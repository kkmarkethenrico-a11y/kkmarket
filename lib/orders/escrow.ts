/**
 * lib/orders/escrow.ts
 *
 * Helpers de escrow/estoque provider-agnósticos (extraídos de lib/pagarme/escrow.ts
 * durante a migração para Mercado Pago).
 *
 * Não importar em código client.
 */

import { createAdminClient } from '@/lib/supabase/admin'
import type { AnnouncementPlan } from '@/types'

// ─── Taxas por plano ─────────────────────────────────────────────────────────
// Aceita tanto MP_MARKETPLACE_FEE_* (novo) quanto PLATFORM_FEE_* (legado).
const FEE_RATES: Record<AnnouncementPlan, number> = {
  silver: parseFloat(
    process.env.MP_MARKETPLACE_FEE_SILVER ??
      process.env.PLATFORM_FEE_SILVER ??
      '0.0999',
  ),
  gold: parseFloat(
    process.env.MP_MARKETPLACE_FEE_GOLD ??
      process.env.PLATFORM_FEE_GOLD ??
      '0.1199',
  ),
  diamond: parseFloat(
    process.env.MP_MARKETPLACE_FEE_DIAMOND ??
      process.env.PLATFORM_FEE_DIAMOND ??
      '0.1299',
  ),
}

export function calculateFee(
  amount: number,
  plan: AnnouncementPlan,
): { fee: number; sellerAmount: number } {
  const rate = FEE_RATES[plan] ?? FEE_RATES.silver
  const fee = Math.round(amount * rate * 100) / 100
  const sellerAmount = Math.round((amount - fee) * 100) / 100
  return { fee, sellerAmount }
}

/** Atomically decrement stock. Returns false if insufficient. */
export async function decrementStock(
  announcementId: string,
  itemId: string | null,
  quantity = 1,
): Promise<boolean> {
  const admin = createAdminClient()
  const { data, error } = await admin.rpc('decrement_stock', {
    p_announcement_id: announcementId,
    p_item_id:         itemId ?? undefined,
    p_quantity:        quantity,
  })

  if (error) {
    console.error('[escrow] decrementStock failed:', error.message)
    return false
  }

  return data as boolean
}

// ─── calculateReleaseDate ────────────────────────────────────────────────────
/** Adiciona N dias úteis a `paidAt`, pulando finais de semana. */
function addBusinessDays(date: Date, days: number): Date {
  const result = new Date(date)
  let added = 0
  while (added < days) {
    result.setDate(result.getDate() + 1)
    const dow = result.getDay()
    if (dow !== 0 && dow !== 6) added++
  }
  return result
}

export async function calculateReleaseDate(
  categoryId: string,
  paidAt: Date,
): Promise<Date> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('categories')
    .select('balance_release_days')
    .eq('id', categoryId)
    .single<{ balance_release_days: number | null }>()

  const days = data?.balance_release_days ?? 4
  return addBusinessDays(paidAt, days)
}

// ─── lockSellerBalance ───────────────────────────────────────────────────────
/** Insere wallet_transaction em escrow (sem incrementar wallet_balance). */
export async function lockSellerBalance(
  orderId: string,
  sellerId: string,
  amount: number,
): Promise<string> {
  const admin = createAdminClient()
  const { data, error } = await admin.rpc('lock_seller_balance', {
    p_order_id:    orderId,
    p_seller_id:   sellerId,
    p_amount:      amount,
    p_description: `Receita de venda (em escrow) — pedido ${orderId.slice(0, 8)}`,
  })

  if (error) {
    console.error('[escrow] lockSellerBalance failed:', error.message)
    throw new Error(`Failed to lock seller balance: ${error.message}`)
  }

  return data as string
}

// ─── autoDeliver ─────────────────────────────────────────────────────────────
/**
 * Reserva atomicamente + decifra 1 auto_delivery_item.
 * Marca o anúncio como 'sold_out' se foi a última unidade.
 *
 * Caller é responsável por garantir que a ordem está paga.
 */
export async function autoDeliver(
  orderId: string,
  announcementId: string,
  itemId: string | null,
): Promise<{ payload: string; soldOut: boolean } | null> {
  const { decryptPayload } = await import('@/lib/auto-delivery/crypto')
  const admin = createAdminClient()

  const { data, error } = await admin.rpc('deliver_auto_delivery', {
    p_order_id:        orderId,
    p_announcement_id: announcementId,
    p_item_id:         itemId ?? undefined,
  })

  if (error) {
    console.error('[escrow] autoDeliver RPC failed:', error.message)
    return null
  }

  const row = Array.isArray(data) ? data[0] : data
  if (!row || !row.encrypted_payload) return null

  let payload: string
  try {
    payload = decryptPayload(row.encrypted_payload as string)
  } catch (e) {
    console.error('[escrow] autoDeliver decrypt failed:', e)
    return null
  }

  return { payload, soldOut: Boolean(row.sold_out) }
}
