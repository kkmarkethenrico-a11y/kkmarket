/**
 * POST /api/orders
 *
 * Creates an order + Pagar.me charge in a single transaction.
 * Flow:
 *   1. Validate body (announcement_id, item_id?, payment_method, card_token?)
 *   2. Verify announcement exists, is active, has stock
 *   3. Atomically decrement stock via RPC
 *   4. Calculate platform_fee based on announcement plan
 *   5. Insert order row (status: pending_payment)
 *   6. Create charge on Pagar.me (PIX / Boleto / Credit Card)
 *   7. Return { order_id, payment_data }
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient }      from '@/lib/supabase/server'
import { createAdminClient }  from '@/lib/supabase/admin'
import {
  createOrder as pagarmeCreateOrder,
  buildPixCharge,
  buildBoletoCharge,
  buildCreditCardCharge,
  PagarmeError,
} from '@/lib/pagarme/client'
import {
  calculateFee,
  decrementStock,
} from '@/lib/pagarme/escrow'
import type { AnnouncementPlan } from '@/types'

// ─── Request Schema ───────────────────────────────────────────────────────────
const bodySchema = z.object({
  announcement_id: z.string().uuid(),
  item_id:         z.string().uuid().optional(),
  payment_method:  z.enum(['pix', 'credit_card', 'boleto']),
  card_token:      z.string().optional(),
  installments:    z.number().int().min(1).max(12).optional(),
})

// ─── Handler ──────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  // 1. Auth
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  // 2. Parse body
  let rawBody: unknown
  try { rawBody = await request.json() }
  catch { return NextResponse.json({ error: 'Body inválido.' }, { status: 400 }) }

  const parsed = bodySchema.safeParse(rawBody)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados inválidos.', details: parsed.error.issues },
      { status: 422 },
    )
  }

  const { announcement_id, item_id, payment_method, card_token, installments } = parsed.data

  if (payment_method === 'credit_card' && !card_token) {
    return NextResponse.json({ error: 'card_token obrigatório para cartão de crédito.' }, { status: 422 })
  }

  // 3. Fetch announcement + seller + category
  const admin = createAdminClient()
  const { data: ann, error: annErr } = await admin
    .from('announcements')
    .select(`
      id, user_id, category_id, title, model, plan,
      unit_price, stock_quantity, has_auto_delivery, status,
      categories!category_id ( balance_release_days )
    `)
    .eq('id', announcement_id)
    .eq('status', 'active')
    .single()

  if (annErr || !ann) {
    return NextResponse.json({ error: 'Anúncio não encontrado ou inativo.' }, { status: 404 })
  }

  // Prevent self-purchase
  if (ann.user_id === user.id) {
    return NextResponse.json({ error: 'Você não pode comprar seu próprio anúncio.' }, { status: 403 })
  }

  // 4. Determine price + validate stock
  let amount: number

  if (ann.model === 'dynamic') {
    if (!item_id) {
      return NextResponse.json({ error: 'item_id obrigatório para anúncio dinâmico.' }, { status: 422 })
    }
    const { data: item } = await admin
      .from('announcement_items')
      .select('id, unit_price, stock_quantity, status')
      .eq('id', item_id)
      .eq('announcement_id', announcement_id)
      .eq('status', 'active')
      .single()

    if (!item) {
      return NextResponse.json({ error: 'Variação não encontrada ou esgotada.' }, { status: 404 })
    }
    if (item.stock_quantity <= 0) {
      return NextResponse.json({ error: 'Variação esgotada.' }, { status: 409 })
    }
    amount = item.unit_price
  } else {
    if (ann.unit_price === null || ann.stock_quantity === null || ann.stock_quantity <= 0) {
      return NextResponse.json({ error: 'Anúncio esgotado.' }, { status: 409 })
    }
    amount = ann.unit_price
  }

  // Min order amount
  const minAmount = parseFloat(process.env.MIN_ORDER_AMOUNT ?? '2.00')
  if (amount < minAmount) {
    return NextResponse.json({ error: `Valor mínimo do pedido: R$ ${minAmount.toFixed(2)}.` }, { status: 422 })
  }

  // 5. Atomically decrement stock
  const decremented = await decrementStock(announcement_id, item_id ?? null)
  if (!decremented) {
    return NextResponse.json({ error: 'Estoque insuficiente.' }, { status: 409 })
  }

  // 6. Calculate fees
  const plan = ann.plan as AnnouncementPlan
  const { fee: platformFee, sellerAmount } = calculateFee(amount, plan)

  // 7. Insert order
  const { data: order, error: orderErr } = await admin
    .from('orders')
    .insert({
      announcement_id,
      announcement_item_id: item_id ?? null,
      buyer_id:             user.id,
      seller_id:            ann.user_id,
      status:               'pending_payment',
      amount,
      platform_fee:         platformFee,
      seller_amount:        sellerAmount,
      payment_method,
      metadata: {
        announcement_title: ann.title,
        plan,
      },
    })
    .select('id')
    .single()

  if (orderErr || !order) {
    // Restore stock on failure
    await admin.rpc('restore_stock', {
      p_announcement_id: announcement_id,
      p_item_id:         item_id ?? undefined,
      p_quantity:        1,
    })
    console.error('[orders] insert failed:', orderErr?.message)
    return NextResponse.json({ error: 'Erro ao criar pedido.' }, { status: 500 })
  }

  // 8. Get buyer profile for Pagar.me customer
  const { data: profile } = await admin
    .from('profiles')
    .select('username, display_name')
    .eq('id', user.id)
    .single()

  const customerName = profile?.display_name ?? profile?.username ?? 'Comprador'

  // 9. Create Pagar.me charge
  const amountCents = Math.round(amount * 100)
  let charge
  switch (payment_method) {
    case 'pix':
      charge = buildPixCharge(amountCents, 1800)  // 30 min
      break
    case 'boleto': {
      const due = new Date()
      due.setDate(due.getDate() + 1) // 1 business day
      charge = buildBoletoCharge(amountCents, due)
      break
    }
    case 'credit_card':
      charge = buildCreditCardCharge(amountCents, card_token!, installments ?? 1)
      break
  }

  try {
    const pagarmeOrder = await pagarmeCreateOrder({
      customer: {
        name:     customerName,
        email:    user.email!,
        document: '00000000000', // Will be replaced by real CPF from KYC
        type:     'individual',
      },
      items: [{
        amount:      amountCents,
        description: ann.title.slice(0, 120),
        quantity:    1,
      }],
      charges:  [charge],
      metadata: {
        order_id:     order.id,
        platform:     'gamemarket',
      },
    })

    // 10. Update order with Pagar.me IDs
    const pagarmeCharge = pagarmeOrder.charges?.[0]
    await admin
      .from('orders')
      .update({
        pagarme_order_id:  pagarmeOrder.id,
        pagarme_charge_id: pagarmeCharge?.id ?? null,
        updated_at:        new Date().toISOString(),
      })
      .eq('id', order.id)

    // 11. Build payment response
    const lastTx = pagarmeCharge?.last_transaction
    const paymentData: Record<string, unknown> = { payment_method }

    if (payment_method === 'pix' && lastTx) {
      paymentData.qr_code     = lastTx.qr_code
      paymentData.qr_code_url = lastTx.qr_code_url
      paymentData.expires_at  = lastTx.expires_at
    } else if (payment_method === 'boleto' && lastTx) {
      paymentData.boleto_url = lastTx.url
      paymentData.boleto_pdf = lastTx.pdf
      paymentData.expires_at = lastTx.expires_at
    } else if (payment_method === 'credit_card') {
      paymentData.status = pagarmeCharge?.status
    }

    return NextResponse.json(
      { order_id: order.id, payment_data: paymentData },
      { status: 201 },
    )
  } catch (e) {
    // Rollback: restore stock + cancel order
    await admin.rpc('restore_stock', {
      p_announcement_id: announcement_id,
      p_item_id:         item_id ?? undefined,
      p_quantity:        1,
    })
    await admin
      .from('orders')
      .update({
        status:              'cancelled',
        cancelled_at:        new Date().toISOString(),
        cancellation_reason: 'Falha ao criar cobrança no gateway',
        updated_at:          new Date().toISOString(),
      })
      .eq('id', order.id)

    const msg = e instanceof PagarmeError ? e.message : 'Erro no gateway de pagamento'
    console.error('[orders] Pagar.me createOrder failed:', e)
    return NextResponse.json({ error: msg }, { status: 502 })
  }
}