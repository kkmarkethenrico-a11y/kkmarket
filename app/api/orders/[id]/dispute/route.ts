/**
 * POST /api/orders/[id]/dispute
 *
 * Opens a dispute on an order. Either buyer or seller can initiate.
 *
 * Flow:
 *   1. Auth: buyer OR seller of the order
 *   2. Validate order is in a disputable status
 *   3. Update order.status = 'disputed', escrow_release_at = null (pauses auto-release)
 *   4. Create a report record linked to the order
 *   5. Notify the counter-party + all admins
 *   6. System message in chat
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient }      from '@/lib/supabase/server'
import { createAdminClient }  from '@/lib/supabase/admin'

const bodySchema = z.object({
  reason:      z.string().min(10).max(1000),
  description: z.string().min(20).max(5000).optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: orderId } = await params

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

  const { reason, description } = parsed.data
  const admin = createAdminClient()

  // 3. Get order
  const { data: order, error: oErr } = await admin
    .from('orders')
    .select(`
      id, buyer_id, seller_id, amount, status,
      announcement_id,
      announcements!announcement_id ( title )
    `)
    .eq('id', orderId)
    .single()

  if (oErr || !order) {
    return NextResponse.json({ error: 'Pedido não encontrado.' }, { status: 404 })
  }

  // 4. Auth: only buyer or seller
  const isBuyer  = user.id === order.buyer_id
  const isSeller = user.id === order.seller_id
  if (!isBuyer && !isSeller) {
    return NextResponse.json({ error: 'Apenas participantes do pedido podem abrir disputa.' }, { status: 403 })
  }

  // 5. Validate status (can dispute if paid, in_delivery, or delivered)
  const disputableStatuses = ['paid', 'in_delivery', 'delivered']
  if (!disputableStatuses.includes(order.status)) {
    return NextResponse.json(
      { error: `Não é possível abrir disputa neste status (${order.status}).` },
      { status: 409 },
    )
  }

  // Prevent double dispute
  if (order.status === 'disputed') {
    return NextResponse.json({ error: 'Disputa já está em andamento.' }, { status: 409 })
  }

  const now = new Date()
  const ann = order.announcements as unknown as { title: string }
  const counterPartyId = isBuyer ? order.seller_id : order.buyer_id
  const initiatorRole  = isBuyer ? 'Comprador' : 'Vendedor'

  // 6. Update order — pause escrow
  await admin
    .from('orders')
    .update({
      status:            'disputed',
      escrow_release_at: null, // Pauses automatic release
      updated_at:        now.toISOString(),
    })
    .eq('id', orderId)

  // 7. Create report
  await admin.from('reports').insert({
    reporter_id:   user.id,
    reported_id:   counterPartyId,
    type:          'order_dispute',
    reason,
    description:   description ?? null,
    reference_id:  orderId,
    status:        'open',
  })

  // 8. System message in chat
  await admin.from('order_messages').insert({
    order_id:  orderId,
    sender_id: null,
    message:   `⚠️ Disputa aberta pelo ${initiatorRole.toLowerCase()}.\n\nMotivo: ${reason}\n\nA liberação do saldo foi pausada. Um moderador analisará o caso.`,
    type:      'system',
  })

  // 9. Notify counter-party
  await admin.from('notifications').insert({
    user_id: counterPartyId,
    type:    'order_disputed',
    title:   'Disputa aberta no pedido',
    message: `${initiatorRole} abriu uma disputa no pedido "${ann.title}". Motivo: ${reason}`,
    data:    { order_id: orderId },
  })

  // 10. Notify all admins
  const { data: admins } = await admin
    .from('profiles')
    .select('id')
    .in('role', ['admin', 'moderator'])

  if (admins && admins.length > 0) {
    const adminNotifs = admins.map((a) => ({
      user_id: a.id,
      type:    'admin_dispute',
      title:   '🚨 Nova disputa para análise',
      message: `Disputa no pedido ${orderId.slice(0, 8)}… (R$ ${order.amount.toFixed(2)}) — "${ann.title}". Motivo: ${reason}`,
      data:    { order_id: orderId, reporter_id: user.id },
    }))
    await admin.from('notifications').insert(adminNotifs)
  }

  return NextResponse.json({ ok: true, status: 'disputed' })
}