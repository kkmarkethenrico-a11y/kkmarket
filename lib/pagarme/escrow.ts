/**
 * lib/pagarme/escrow.ts
 *
 * Core escrow business logic. All financial mutations go through
 * atomic PostgreSQL RPCs via the service-role Supabase client.
 *
 * NEVER import this in client code.
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { cancelOrder as pagarmeCancelOrder } from '@/lib/pagarme/client'
import type { AnnouncementPlan } from '@/types'

// ─── Fee rates from env (contexto.md §6) ──────────────────────────────────────
const FEE_RATES: Record<AnnouncementPlan, number> = {
  silver:  parseFloat(process.env.PLATFORM_FEE_SILVER  ?? '0.0999'),
  gold:    parseFloat(process.env.PLATFORM_FEE_GOLD    ?? '0.1199'),
  diamond: parseFloat(process.env.PLATFORM_FEE_DIAMOND ?? '0.1299'),
}

// ─── calculateFee ─────────────────────────────────────────────────────────────
export function calculateFee(
  amount: number,
  plan: AnnouncementPlan,
): { fee: number; sellerAmount: number } {
  const rate = FEE_RATES[plan] ?? FEE_RATES.silver
  const fee  = Math.round(amount * rate * 100) / 100 // round to 2 decimals
  const sellerAmount = Math.round((amount - fee) * 100) / 100
  return { fee, sellerAmount }
}

// ─── calculateReleaseDate ─────────────────────────────────────────────────────
/** Add N business days to paidAt, skipping weekends. */
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
    .single()

  const days = data?.balance_release_days ?? 4
  return addBusinessDays(paidAt, days)
}

// ─── lockSellerBalance ────────────────────────────────────────────────────────
/** Calls RPC lock_seller_balance — inserts wallet_transaction without
 *  incrementing wallet_balance (balance stays blocked in escrow). */
export async function lockSellerBalance(
  orderId: string,
  sellerId: string,
  amount: number,
): Promise<string> {
  const admin = createAdminClient()
  const { data, error } = await admin.rpc('lock_seller_balance', {
    p_order_id:   orderId,
    p_seller_id:  sellerId,
    p_amount:     amount,
    p_description: `Receita de venda (em escrow) — pedido ${orderId.slice(0, 8)}`,
  })

  if (error) {
    console.error('[escrow] lockSellerBalance failed:', error.message)
    throw new Error(`Failed to lock seller balance: ${error.message}`)
  }

  return data as string
}

// ─── releaseSellerBalance ─────────────────────────────────────────────────────
/** Calls RPC release_seller_balance — atomically increments wallet_balance
 *  and updates the original transaction's balance_after. */
export async function releaseSellerBalance(orderId: string): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin.rpc('release_seller_balance', {
    p_order_id: orderId,
  })

  if (error) {
    console.error('[escrow] releaseSellerBalance failed:', error.message)
    throw new Error(`Failed to release seller balance: ${error.message}`)
  }
}

// ─── refundBuyer ──────────────────────────────────────────────────────────────
/** Cancels the charge on Pagar.me and credits the buyer's wallet via RPC. */
export async function refundBuyer(
  orderId: string,
  reason: string,
): Promise<void> {
  const admin = createAdminClient()

  // 1. Get order details
  const { data: order, error: oErr } = await admin
    .from('orders')
    .select('id, buyer_id, amount, pagarme_order_id, announcement_id, announcement_item_id')
    .eq('id', orderId)
    .single()

  if (oErr || !order) throw new Error(`Order ${orderId} not found`)

  // 2. Cancel on Pagar.me (if external charge exists)
  if (order.pagarme_order_id) {
    try {
      await pagarmeCancelOrder(order.pagarme_order_id)
    } catch (e) {
      console.error('[escrow] Pagar.me cancel failed (proceeding with internal refund):', e)
    }
  }

  // 3. Refund buyer via atomic RPC
  await admin.rpc('refund_buyer', {
    p_order_id:    orderId,
    p_buyer_id:    order.buyer_id,
    p_amount:      order.amount,
    p_description: `Reembolso: ${reason} — pedido ${orderId.slice(0, 8)}`,
  })

  // 4. Restore stock
  await admin.rpc('restore_stock', {
    p_announcement_id: order.announcement_id,
    p_item_id:         order.announcement_item_id ?? undefined,
    p_quantity:        1,
  })

  // 5. Update order status
  await admin
    .from('orders')
    .update({
      status:              'refunded',
      cancelled_at:        new Date().toISOString(),
      cancellation_reason: reason,
      updated_at:          new Date().toISOString(),
    })
    .eq('id', orderId)

  // 6. Notify buyer
  await admin.from('notifications').insert({
    user_id: order.buyer_id,
    type:    'system',
    title:   'Reembolso processado',
    message: `Seu reembolso de R$ ${order.amount.toFixed(2)} foi processado. Motivo: ${reason}`,
    data:    { order_id: orderId },
  })
}

// ─── decrementStock ───────────────────────────────────────────────────────────
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

// ─── autoDeliver ──────────────────────────────────────────────────────────────
/** Deliver auto-delivery payload if available. */
export async function autoDeliver(
  orderId: string,
  announcementId: string,
  itemId: string | null,
): Promise<string | null> {
  const admin = createAdminClient()

  // Find an undelivered auto_delivery_item
  let query = admin
    .from('auto_delivery_items')
    .select('id, payload')
    .eq('announcement_id', announcementId)
    .eq('is_delivered', false)
    .limit(1)

  if (itemId) {
    query = query.eq('item_id', itemId)
  }

  const { data: items } = await query

  if (!items || items.length === 0) return null

  const item = items[0]

  // Mark as delivered
  await admin
    .from('auto_delivery_items')
    .update({ is_delivered: true, order_id: orderId })
    .eq('id', item.id)

  return item.payload
}