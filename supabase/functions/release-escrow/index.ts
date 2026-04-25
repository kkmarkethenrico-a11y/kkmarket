/**
 * Supabase Edge Function: release-escrow
 *
 * Scheduled to run every hour via pg_cron.
 * Finds orders in 'in_delivery' status with expired escrow and releases funds.
 *
 * Deploy: supabase functions deploy release-escrow
 * Cron:   SELECT cron.schedule('release-escrow', '0 * * * *',
 *           $$SELECT net.http_post(url := 'https://<project>.supabase.co/functions/v1/release-escrow',
 *             headers := '{"Authorization": "Bearer <service_role_key>"}'::jsonb)$$);
 */

// @ts-ignore — Deno edge runtime
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL     = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async (req) => {
  // Verify auth (service role or cron internal)
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.includes(SERVICE_ROLE_KEY)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const now = new Date().toISOString()

  // 1. Find orders with expired escrow
  const { data: orders, error } = await admin
    .from('orders')
    .select('id, seller_id, seller_amount, announcement_id, announcements!announcement_id(title)')
    .in('status', ['in_delivery', 'delivered'])
    .not('escrow_release_at', 'is', null)
    .lte('escrow_release_at', now)
    .limit(100) // Process in batches

  if (error) {
    console.error('[release-escrow] Query error:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (!orders || orders.length === 0) {
    return new Response(JSON.stringify({ ok: true, released: 0 }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  console.log(`[release-escrow] Processing ${orders.length} orders`)

  let released = 0
  let failures = 0

  for (const order of orders) {
    try {
      const ann = (order as any).announcements as { title: string }

      // a. Release seller balance via atomic RPC
      const { error: rpcErr } = await admin.rpc('release_seller_balance', {
        p_order_id: order.id,
      })

      if (rpcErr) {
        console.error(`[release-escrow] RPC failed for order ${order.id}:`, rpcErr.message)
        failures++
        continue
      }

      // b. Update order status to 'completed'
      await admin
        .from('orders')
        .update({
          status:       'completed',
          completed_at: now,
          updated_at:   now,
        })
        .eq('id', order.id)

      // c. System message in chat
      await admin.from('order_messages').insert({
        order_id:  order.id,
        sender_id: null,
        message:   `💰 Saldo de R$ ${order.seller_amount.toFixed(2)} foi liberado para o vendedor. Pedido concluído! ✅`,
        type:      'system',
      })

      // d. Notify seller
      await admin.from('notifications').insert({
        user_id: order.seller_id,
        type:    'balance_released',
        title:   'Saldo liberado!',
        message: `R$ ${order.seller_amount.toFixed(2)} da venda "${ann?.title ?? 'Produto'}" foi creditado na sua carteira.`,
        data:    { order_id: order.id, amount: order.seller_amount },
      })

      released++
      console.log(`[release-escrow] Released order ${order.id}: R$ ${order.seller_amount}`)
    } catch (err) {
      console.error(`[release-escrow] Unexpected error for order ${order.id}:`, err)
      failures++
    }
  }

  const summary = { ok: true, released, failures, total: orders.length }
  console.log('[release-escrow] Summary:', summary)

  return new Response(JSON.stringify(summary), {
    headers: { 'Content-Type': 'application/json' },
  })
})