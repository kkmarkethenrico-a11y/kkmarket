import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: orderId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  const admin = createAdminClient()

  // Busca o pedido
  const { data: order, error: oErr } = await admin
    .from('orders')
    .select('id, seller_id, status, buyer_id, announcements(title)')
    .eq('id', orderId)
    .single()

  if (oErr || !order) {
    return NextResponse.json({ error: 'Pedido não encontrado.' }, { status: 404 })
  }

  // Verifica se é o vendedor
  if (order.seller_id !== user.id) {
    return NextResponse.json({ error: 'Apenas o vendedor pode confirmar a entrega.' }, { status: 403 })
  }

  // Verifica se o status permite entrega
  if (!['paid', 'in_delivery'].includes(order.status)) {
    return NextResponse.json({ error: 'Pedido não está em um status válido para entrega.' }, { status: 409 })
  }

  const now = new Date().toISOString()

  // Atualiza para delivered
  await admin
    .from('orders')
    .update({
      status: 'delivered',
      updated_at: now,
    })
    .eq('id', orderId)

  // Mensagem no chat
  await admin.from('order_messages').insert({
    order_id: orderId,
    sender_id: null,
    message: `📦 **Produto Entregue**\nO vendedor marcou este pedido como entregue. Por favor, verifique e confirme o recebimento para liberar o pagamento!`,
    type: 'system',
  })

  // Notifica o comprador
  const title = (order.announcements as any)?.title || 'Produto'
  await admin.from('notifications').insert({
    user_id: order.buyer_id,
    type: 'order_delivered',
    title: 'Produto Entregue!',
    message: `Sua compra "${title}" foi entregue pelo vendedor. Acesse o pedido para confirmar o recebimento.`,
    reference_id: orderId,
    reference_type: 'order',
  })

  return NextResponse.json({ ok: true })
}
