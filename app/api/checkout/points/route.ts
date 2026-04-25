/**
 * POST /api/checkout/points/validate
 *   Body: { orderAmount: number, pontosParaUsar: number }
 *   Returns: { valid, discountBrl, pontosEfetivos, currentBalance, error? }
 *
 * POST /api/checkout/points/apply
 *   Body: { orderId: string, pontosParaUsar: number }
 *   Debits points atomically and applies discount to pending order.
 *   Returns: { ok, newAmount, discountBrl, pontosDebitados }
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient }       from '@/lib/supabase/server'
import { createAdminClient }  from '@/lib/supabase/admin'
import {
  calcularDescontoEmPontos,
  debitarPontos,
  POINTS_TO_BRL_RATE,
  POINTS_MIN_REDEEM,
  POINTS_MAX_COVERAGE,
} from '@/lib/points'

// ─── Route config ─────────────────────────────────────────────────────────────
export const dynamic = 'force-dynamic'

const validateSchema = z.object({
  orderAmount:    z.number().positive(),
  pontosParaUsar: z.number().int().positive(),
})

const applySchema = z.object({
  orderId:        z.string().uuid(),
  pontosParaUsar: z.number().int().positive(),
})

// ─── POST /api/checkout/points ────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  const url    = new URL(request.url)
  const action = url.searchParams.get('action') // 'validate' | 'apply'

  let rawBody: unknown
  try {
    rawBody = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido.' }, { status: 400 })
  }

  // ── validate ────────────────────────────────────────────────────────────
  if (action === 'validate' || !action) {
    const parsed = validateSchema.safeParse(rawBody)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos.', details: z.flattenError(parsed.error) },
        { status: 422 },
      )
    }

    const { orderAmount, pontosParaUsar } = parsed.data
    const result = await calcularDescontoEmPontos(user.id, orderAmount, pontosParaUsar)
    return NextResponse.json(result)
  }

  // ── apply ────────────────────────────────────────────────────────────────
  if (action === 'apply') {
    const parsed = applySchema.safeParse(rawBody)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos.', details: z.flattenError(parsed.error) },
        { status: 422 },
      )
    }

    const { orderId, pontosParaUsar } = parsed.data
    const admin = createAdminClient()

    // Load order — must be pending_payment and owned by buyer
    const { data: order, error: oErr } = await admin
      .from('orders')
      .select('id, buyer_id, amount, status, points_discount')
      .eq('id', orderId)
      .single()

    if (oErr || !order) {
      return NextResponse.json({ error: 'Pedido não encontrado.' }, { status: 404 })
    }
    if (order.buyer_id !== user.id) {
      return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 })
    }
    if (order.status !== 'pending_payment') {
      return NextResponse.json({ error: 'Pedido não está pendente de pagamento.' }, { status: 409 })
    }

    const result = await calcularDescontoEmPontos(user.id, order.amount, pontosParaUsar)
    if (!result.valid) {
      return NextResponse.json({ error: result.error }, { status: 422 })
    }

    // Debit points atomically
    const debited = await debitarPontos({
      userId:      user.id,
      amount:      result.pontosEfetivos,
      referenceId: orderId,
      description: `Desconto em pedido ${orderId.slice(0, 8)} — -${result.pontosEfetivos} pontos`,
    })

    if (!debited) {
      return NextResponse.json({ error: 'Falha ao debitar pontos. Tente novamente.' }, { status: 500 })
    }

    // Update order amount
    const newAmount = Math.max(0.01, order.amount - result.discountBrl)
    await admin
      .from('orders')
      .update({
        amount:          newAmount,
        points_discount: result.pontosEfetivos,
        updated_at:      new Date().toISOString(),
      })
      .eq('id', orderId)

    return NextResponse.json({
      ok:              true,
      newAmount,
      discountBrl:     result.discountBrl,
      pontosDebitados: result.pontosEfetivos,
    })
  }

  return NextResponse.json({ error: 'Ação inválida. Use ?action=validate ou ?action=apply' }, { status: 400 })
}

// ─── GET /api/checkout/points ─────────────────────────────────────────────────
// Returns the user's current points balance + max redeemable info for a given amount
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  const admin  = createAdminClient()
  const { data: stats } = await admin
    .from('user_stats')
    .select('points_balance')
    .eq('user_id', user.id)
    .single()

  const balance = stats?.points_balance ?? 0

  // Next expiry
  const { data: nextExpiry } = await admin
    .from('points_transactions')
    .select('expires_at, amount')
    .eq('user_id', user.id)
    .gt('amount', 0)
    .gt('expires_at', new Date().toISOString())
    .order('expires_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  return NextResponse.json({
    balance,
    canRedeem:          balance >= POINTS_MIN_REDEEM,
    minRedeem:          POINTS_MIN_REDEEM,
    rate:               POINTS_TO_BRL_RATE,
    maxCoverage:        POINTS_MAX_COVERAGE,
    balanceBrl:         Math.round((balance / POINTS_TO_BRL_RATE) * 100) / 100,
    nextExpiry: nextExpiry
      ? { date: nextExpiry.expires_at, amount: nextExpiry.amount }
      : null,
  })
}
