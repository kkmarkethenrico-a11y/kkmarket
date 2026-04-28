/**
 * POST /api/orders
 *
 * Cria um pedido + cobrança no Mercado Pago em uma única transação.
 *
 * Fluxo:
 *   1. Valida body (announcement_id, item_id?, payment_method, card_token?)
 *   2. Verifica anúncio ativo + estoque
 *   3. Decrementa estoque atomicamente via RPC
 *   4. Calcula platform_fee conforme o plano do anúncio
 *   5. Insere a linha em `orders` (status: pending_payment)
 *   6. Cria a cobrança no Mercado Pago (PIX / Boleto / Credit Card)
 *   7. Retorna { order_id, payment_data }
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  createPixPayment,
  createBoletoPayment,
  createCreditCardPayment,
} from '@/lib/mercadopago/payments'
import type { MPPaymentMethod, MPPaymentResult } from '@/lib/mercadopago/types'
import { calculateFee, decrementStock } from '@/lib/orders/escrow'
import type { AnnouncementPlan } from '@/types'

// ─── Request Schema ──────────────────────────────────────────────────────────
const bodySchema = z.object({
  announcement_id: z.string().uuid(),
  item_id:         z.string().uuid().optional(),
  payment_method:  z.enum(['pix', 'credit_card', 'boleto']),
  card_token:      z.string().optional(),
  installments:    z.number().int().min(1).max(12).optional(),
})

// ─── Handler ─────────────────────────────────────────────────────────────────
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

  const body = parsed.data
  const { announcement_id, item_id, payment_method } = body

  if (payment_method === 'credit_card' && !body.card_token) {
    return NextResponse.json(
      { error: 'card_token obrigatório para cartão de crédito.' },
      { status: 422 },
    )
  }

  // 3. Fetch announcement
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

  if (ann.user_id === user.id) {
    return NextResponse.json({ error: 'Você não pode comprar seu próprio anúncio.' }, { status: 403 })
  }

  // 4. Determina preço + valida estoque
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

  const minAmount = parseFloat(process.env.MIN_ORDER_AMOUNT ?? '2.00')
  if (amount < minAmount) {
    return NextResponse.json(
      { error: `Valor mínimo do pedido: R$ ${minAmount.toFixed(2)}.` },
      { status: 422 },
    )
  }

  // 5. Decrementa estoque atomicamente
  const decremented = await decrementStock(announcement_id, item_id ?? null)
  if (!decremented) {
    return NextResponse.json({ error: 'Estoque insuficiente.' }, { status: 409 })
  }

  // 6. Calcula taxas
  const plan = ann.plan as AnnouncementPlan
  const { fee: platformFee, sellerAmount } = calculateFee(amount, plan)

  // 7. Insere a ordem
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
    await admin.rpc('restore_stock', {
      p_announcement_id: announcement_id,
      p_item_id:         item_id ?? undefined,
      p_quantity:        1,
    })
    console.error('[orders] insert failed:', orderErr?.message)
    return NextResponse.json({ error: 'Erro ao criar pedido.' }, { status: 500 })
  }

  // 8. Buyer profile (para nome/CPF no boleto)
  const { data: profile } = await admin
    .from('profiles')
    .select('username, display_name, full_name, cpf')
    .eq('id', user.id)
    .single<{
      username:     string | null
      display_name: string | null
      full_name:    string | null
      cpf:          string | null
    }>()

  const fullName = profile?.full_name ?? profile?.display_name ?? profile?.username ?? 'Comprador'
  const [firstName, ...rest] = fullName.trim().split(/\s+/)
  const lastName = rest.join(' ') || firstName

  if (!user.email) {
    await admin.rpc('restore_stock', {
      p_announcement_id: announcement_id,
      p_item_id:         item_id ?? undefined,
      p_quantity:        1,
    })
    return NextResponse.json({ error: 'E-mail do comprador não encontrado.' }, { status: 422 })
  }

  // 9. Cria cobrança no Mercado Pago
  const mpMethod: MPPaymentMethod =
    payment_method === 'boleto' ? 'ticket' : payment_method
  const paymentParams = {
    orderId:     order.id,
    amount,
    method:      mpMethod,
    buyerEmail:  user.email,
    description: `Pedido #${order.id.slice(0, 8)} — ${ann.title}`,
  }

  let paymentResult: MPPaymentResult
  try {
    switch (payment_method) {
      case 'pix':
        paymentResult = await createPixPayment(paymentParams)
        break
      case 'boleto':
        if (!profile?.cpf) {
          throw new Error(
            'CPF do comprador não cadastrado. Conclua a verificação de identidade para pagar com boleto.',
          )
        }
        paymentResult = await createBoletoPayment({
          ...paymentParams,
          buyerFirstName: firstName,
          buyerLastName:  lastName,
          buyerCpf:       profile.cpf,
        })
        break
      case 'credit_card':
        paymentResult = await createCreditCardPayment({
          ...paymentParams,
          cardToken:    body.card_token,
          installments: body.installments ?? 1,
        })
        break
      default:
        return NextResponse.json({ error: 'Método inválido.' }, { status: 400 })
    }
  } catch (e) {
    // Rollback: restaura estoque + cancela ordem
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

    const msg = e instanceof Error ? e.message : 'Erro no gateway de pagamento'
    console.error('[orders] Mercado Pago createPayment failed:', e)
    return NextResponse.json({ error: msg }, { status: 502 })
  }

  // 10. Atualiza ordem com o ID do pagamento MP
  await admin
    .from('orders')
    .update({
      mp_payment_id: paymentResult.id,
      updated_at:    new Date().toISOString(),
    })
    .eq('id', order.id)

  // 11. Resposta ao frontend
  return NextResponse.json(
    {
      order_id: order.id,
      payment_data: {
        method:          payment_method,
        pix_qr_code:     paymentResult.pixQrCode,
        pix_qr_base64:   paymentResult.pixQrCodeBase64,
        pix_expiration:  paymentResult.pixExpiration,
        boleto_url:      paymentResult.boletoUrl,
        boleto_barcode:  paymentResult.boletoBarcode,
        boleto_exp:      paymentResult.boletoExpiration,
      },
    },
    { status: 201 },
  )
}
