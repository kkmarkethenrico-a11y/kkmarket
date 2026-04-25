/**
 * POST /api/webhooks/pagarme
 *
 * Handles Pagar.me webhook events:
 *   - order.paid → lock escrow, auto-deliver, notify
 *   - order.canceled / charge.failed → restore stock, cancel order, notify
 *
 * SECURITY: Verifies HMAC-SHA256 signature before any processing.
 * All mutations use service-role client (bypasses RLS).
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyWebhookSignature } from '@/lib/pagarme/webhooks'
import {
  calculateReleaseDate,
  lockSellerBalance,
  autoDeliver,
} from '@/lib/pagarme/escrow'

// ─── Handler ──────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  // 1. Read raw body for HMAC verification
  const rawBody = await request.text()
  const signature = request.headers.get('x-hub-signature') ?? request.headers.get('x-webhook-signature')

  if (!verifyWebhookSignature(rawBody, signature)) {
    console.error('[webhook] Invalid signature')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  // 2. Parse event
  let event: {
    type: string
    data: {
      id: string
      status: string
      metadata?: Record<string, string>
      charges?: { id: string; status: string; payment_method: string }[]
    }
  }

  try {
    event = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const eventType  = event.type
  const pagarmeId  = event.data?.id
  const orderId    = event.data?.metadata?.order_id

  if (!orderId) {
    console.warn('[webhook] Event without order_id in metadata:', eventType, pagarmeId)
    return NextResponse.json({ ok: true, skipped: true })
  }

  const admin = createAdminClient()

  // ─── order.paid ──────────────────────────────────────────────────────────
  if (eventType === 'order.paid') {
    return handleOrderPaid(admin, orderId)
  }

  // ─── order.canceled / charge.failed ──────────────────────────────────────
  if (eventType === 'order.canceled' || eventType === 'charge.failed') {
    return handleOrderCanceled(admin, orderId, eventType)
  }

  // Unknown event — acknowledge
  console.log('[webhook] Unhandled event type:', eventType)
  return NextResponse.json({ ok: true })
}

// ─── order.paid handler ───────────────────────────────────────────────────────
async function handleOrderPaid(
  admin: ReturnType<typeof createAdminClient>,
  orderId: string,
) {
  // Fetch order
  const { data: order, error } = await admin
    .from('orders')
    .select(`
      id, announcement_id, announcement_item_id,
      buyer_id, seller_id, amount, seller_amount,
      status, payment_method,
      announcements!announcement_id (
        has_auto_delivery, category_id, title
      )
    `)
    .eq('id', orderId)
    .single()

  if (error || !order) {
    console.error('[webhook] Order not found:', orderId, error?.message)
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  // Idempotency: skip if already processed
  if (order.status !== 'pending_payment') {
    console.log('[webhook] Order already processed:', orderId, order.status)
    return NextResponse.json({ ok: true, already_processed: true })
  }

  const ann = order.announcements as unknown as {
    has_auto_delivery: boolean
    category_id: string
    title: string
  }

  const now = new Date()

  // a. Calculate escrow release date
  const escrowReleaseAt = await calculateReleaseDate(ann.category_id, now)

  // b. Update order status to 'paid'
  await admin
    .from('orders')
    .update({
      status:           'paid',
      escrow_release_at: escrowReleaseAt.toISOString(),
      updated_at:        now.toISOString(),
    })
    .eq('id', orderId)

  // c. Lock seller balance in escrow (via atomic RPC)
  await lockSellerBalance(orderId, order.seller_id, order.seller_amount)

  // d. Auto-delivery if applicable
  let deliveryPayload: string | null = null
  if (ann.has_auto_delivery) {
    deliveryPayload = await autoDeliver(
      orderId,
      order.announcement_id,
      order.announcement_item_id,
    )

    if (deliveryPayload) {
      // Update order to 'in_delivery' (auto-delivered)
      await admin
        .from('orders')
        .update({ status: 'in_delivery', updated_at: now.toISOString() })
        .eq('id', orderId)

      // Send delivery payload as system message in chat
      await admin.from('order_messages').insert({
        order_id:  orderId,
        sender_id: null,
        message:   `⚡ Entrega automática realizada!\n\n${deliveryPayload}`,
        type:      'system',
      })
    }
  } else {
    // Manual delivery: set status to 'in_delivery'
    await admin
      .from('orders')
      .update({ status: 'in_delivery', updated_at: now.toISOString() })
      .eq('id', orderId)
  }

  // e. System message: escrow timeline
  const releaseDays = Math.ceil(
    (escrowReleaseAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  )
  await admin.from('order_messages').insert({
    order_id:  orderId,
    sender_id: null,
    message:   `🔒 Pagamento confirmado! O vendedor tem ${releaseDays} dia(s) para realizar a entrega. O saldo será liberado em ${escrowReleaseAt.toLocaleDateString('pt-BR')}.`,
    type:      'system',
  })

  // f. Notifications
  await admin.from('notifications').insert([
    {
      user_id: order.buyer_id,
      type:    'order_paid',
      title:   'Pagamento confirmado!',
      message: `Seu pagamento de R$ ${order.amount.toFixed(2)} para "${ann.title}" foi confirmado.`,
      data:    { order_id: orderId },
    },
    {
      user_id: order.seller_id,
      type:    'order_new',
      title:   'Nova venda!',
      message: `Você recebeu uma venda de R$ ${order.amount.toFixed(2)} em "${ann.title}". ${ann.has_auto_delivery ? 'Entrega automática realizada.' : 'Realize a entrega para liberar o saldo.'}`,
      data:    { order_id: orderId },
    },
  ])

  // g. Increment announcement sale_count
  const { error: saleErr } = await admin.rpc('increment_sale_count', {
    p_announcement_id: order.announcement_id,
  })

  if (saleErr) {
    // Non-critical — fallback to manual increment
    await admin
      .from('announcements')
      .update({ sale_count: ((order as unknown as { sale_count?: number }).sale_count ?? 0) + 1 })
      .eq('id', order.announcement_id)
  }

  console.log('[webhook] order.paid processed successfully:', orderId)
  return NextResponse.json({ ok: true })
}

// ─── order.canceled handler ───────────────────────────────────────────────────
async function handleOrderCanceled(
  admin: ReturnType<typeof createAdminClient>,
  orderId: string,
  eventType: string,
) {
  const { data: order } = await admin
    .from('orders')
    .select('id, announcement_id, announcement_item_id, buyer_id, amount, status')
    .eq('id', orderId)
    .single()

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  // Idempotency
  if (order.status === 'cancelled' || order.status === 'refunded') {
    return NextResponse.json({ ok: true, already_processed: true })
  }

  // a. Update order
  await admin
    .from('orders')
    .update({
      status:              'cancelled',
      cancelled_at:        new Date().toISOString(),
      cancellation_reason: `Gateway event: ${eventType}`,
      updated_at:          new Date().toISOString(),
    })
    .eq('id', orderId)

  // b. Restore stock
  await admin.rpc('restore_stock', {
    p_announcement_id: order.announcement_id,
    p_item_id:         order.announcement_item_id ?? undefined,
    p_quantity:        1,
  })

  // c. Notify buyer
  await admin.from('notifications').insert({
    user_id: order.buyer_id,
    type:    'system',
    title:   'Pagamento cancelado',
    message: `Seu pagamento de R$ ${order.amount.toFixed(2)} não foi processado. O estoque foi restaurado.`,
    data:    { order_id: orderId },
  })

  console.log('[webhook] order.canceled processed:', orderId, eventType)
  return NextResponse.json({ ok: true })
}