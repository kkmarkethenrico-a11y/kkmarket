/**
 * lib/points/index.ts
 *
 * Server-only GG Points logic. Never import in client code.
 *
 * Rates from env:
 *   POINTS_TO_BRL_RATE  — points per R$ 1 (default: 77)
 *   POINTS_EXPIRY_DAYS  — days until points expire (default: 180)
 *   POINTS_MIN_REDEEM   — minimum balance to redeem (default: 300)
 *   POINTS_MAX_COVERAGE — max fraction of order covered by points (default: 0.30)
 */

import { createAdminClient } from '@/lib/supabase/admin'

// ─── Config ──────────────────────────────────────────────────────────────────
export const POINTS_TO_BRL_RATE  = parseFloat(process.env.POINTS_TO_BRL_RATE   ?? '77')  // 77 pts = R$ 1
export const POINTS_EXPIRY_DAYS  = parseInt(process.env.POINTS_EXPIRY_DAYS      ?? '180', 10)
export const POINTS_MIN_REDEEM   = parseInt(process.env.POINTS_MIN_REDEEM       ?? '300', 10)
export const POINTS_MAX_COVERAGE = parseFloat(process.env.POINTS_MAX_COVERAGE   ?? '0.30') // 30%

export type PointsEarnType = 'purchase_earn' | 'sale_earn' | 'coupon' | 'event' | 'loyalty'

// ─── creditarPontos ───────────────────────────────────────────────────────────
/**
 * Atomically insert a positive points transaction and increment balance.
 * Silently skips if amount ≤ 0.
 */
export async function creditarPontos(params: {
  userId:      string
  amount:      number   // positive integer — truncated automatically
  type:        PointsEarnType
  referenceId?: string
  description?: string
  expiresAt?:  Date    // defaults to now() + POINTS_EXPIRY_DAYS
}): Promise<void> {
  const pts = Math.floor(params.amount)
  if (pts <= 0) return

  const expiresAt = params.expiresAt ?? (() => {
    const d = new Date()
    d.setDate(d.getDate() + POINTS_EXPIRY_DAYS)
    return d
  })()

  const admin = createAdminClient()
  const { error } = await admin.rpc('credit_points', {
    p_user_id:      params.userId,
    p_amount:       pts,
    p_type:         params.type,
    p_expires_at:   expiresAt.toISOString(),
    p_reference_id: params.referenceId ?? null,
    p_description:  params.description ?? null,
  })

  if (error) {
    console.error('[points] creditarPontos failed:', error.message, { userId: params.userId, pts })
    throw new Error(`Failed to credit points: ${error.message}`)
  }
}

// ─── calcularDescontoEmPontos ─────────────────────────────────────────────────
/**
 * Validate and calculate max redeemable points for a given order amount.
 * Does NOT debit — call debitarPontos() afterwards.
 */
export async function calcularDescontoEmPontos(
  userId:         string,
  orderAmount:    number,
  pontosParaUsar: number,
): Promise<{
  valid:           boolean
  error?:          string
  discountBrl:     number
  pontosEfetivos:  number
  currentBalance:  number
}> {
  const admin = createAdminClient()
  const { data: stats } = await admin
    .from('user_stats')
    .select('points_balance')
    .eq('user_id', userId)
    .single()

  const balance = stats?.points_balance ?? 0

  if (balance < POINTS_MIN_REDEEM) {
    return {
      valid:          false,
      error:          `Saldo mínimo para resgate é ${POINTS_MIN_REDEEM} pontos. Você tem ${balance}.`,
      discountBrl:    0,
      pontosEfetivos: 0,
      currentBalance: balance,
    }
  }

  if (pontosParaUsar > balance) {
    return {
      valid:          false,
      error:         `Pontos insuficientes. Saldo: ${balance} pts.`,
      discountBrl:    0,
      pontosEfetivos: 0,
      currentBalance: balance,
    }
  }

  // Max discount = 30% of order value, converted to points
  const maxPtsAllowed = Math.floor(orderAmount * POINTS_MAX_COVERAGE * POINTS_TO_BRL_RATE)
  const pontosEfetivos = Math.min(pontosParaUsar, maxPtsAllowed, balance)
  const discountBrl    = Math.round((pontosEfetivos / POINTS_TO_BRL_RATE) * 100) / 100

  if (pontosEfetivos <= 0) {
    return {
      valid:          false,
      error:          'Valor de desconto inválido.',
      discountBrl:    0,
      pontosEfetivos: 0,
      currentBalance: balance,
    }
  }

  return { valid: true, discountBrl, pontosEfetivos, currentBalance: balance }
}

// ─── debitarPontos ────────────────────────────────────────────────────────────
/**
 * FIFO debit via atomic SQL RPC. Returns true on success, false if insufficient balance.
 */
export async function debitarPontos(params: {
  userId:       string
  amount:       number
  referenceId?: string
  description?: string
}): Promise<boolean> {
  const pts = Math.floor(params.amount)
  if (pts <= 0) return true

  const admin = createAdminClient()
  const { data, error } = await admin.rpc('debit_points', {
    p_user_id:      params.userId,
    p_amount:       pts,
    p_type:         'redeem',
    p_reference_id: params.referenceId ?? null,
    p_description:  params.description ?? null,
  })

  if (error) {
    console.error('[points] debitarPontos failed:', error.message)
    return false
  }

  return data as boolean
}
