import { createAdminClient } from './lib/supabase/admin'
import { calculateReleaseDate, lockSellerBalance, autoDeliver } from './lib/orders/escrow'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env.production' })

async function main() {
  const orderId = 'd3ee9c5f-ea72-409a-a5a8-0fc2b9103db8'
  const admin = createAdminClient()

  console.log(`Buscando pedido ${orderId}...`)
  
  const { data: order, error: orderErr } = await admin
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

  if (orderErr || !order) {
    console.error('Pedido não encontrado:', orderErr)
    return
  }

  const ann = order.announcements as any
  const now = new Date()

  console.log('1. Calculando Escrow Release...')
  const escrowReleaseAt = await calculateReleaseDate(ann.category_id, now)

  console.log('2. Atualizando pedido para paid...')
  await admin
    .from('orders')
    .update({
      status: 'paid',
      escrow_release_at: escrowReleaseAt.toISOString(),
      updated_at: now.toISOString(),
    })
    .eq('id', order.id)

  console.log('3. Travando saldo do vendedor...')
  await lockSellerBalance(order.id, order.seller_id, order.seller_amount)

  if (ann.has_auto_delivery) {
    console.log('4. Solicitando autoDeliver...')
    const result = await autoDeliver(order.id, order.announcement_id, order.announcement_item_id)
    
    if (result) {
      console.log('5. Chave resgatada! Enviando mensagens...')
      await admin.from('orders').update({ status: 'in_delivery', updated_at: now.toISOString() }).eq('id', order.id)

      await admin.from('order_messages').insert({
        order_id: order.id,
        sender_id: null,
        message: result.payload,
        type: 'auto_delivery',
      })

      await admin.from('order_messages').insert({
        order_id: order.id,
        sender_id: null,
        message: '⚡ Entrega automática realizada! Suas credenciais foram enviadas acima.',
        type: 'system',
      })
      console.log('✅ Chave entregue com sucesso!')
    } else {
      console.log('❌ Sem estoque para entrega automática.')
    }
  } else {
    console.log('Pedido não é de entrega automática.')
  }
}

main().catch(console.error)
