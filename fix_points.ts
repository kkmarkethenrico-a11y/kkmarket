import { createAdminClient } from './lib/supabase/admin'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env.production' })

async function main() {
  const orderId = 'd3ee9c5f-ea72-409a-a5a8-0fc2b9103db8'
  const admin = createAdminClient()

  // Busca buyer_id e seller_id do pedido
  const { data: order, error } = await admin
    .from('orders')
    .select('id, buyer_id, seller_id, status')
    .eq('id', orderId)
    .single()

  if (error || !order) {
    console.error('Pedido não encontrado:', error)
    return
  }

  console.log(`Pedido: ${order.id} | Status: ${order.status}`)
  console.log(`Buyer:  ${order.buyer_id}`)
  console.log(`Seller: ${order.seller_id}`)

  const expiresAt = new Date()
  expiresAt.setFullYear(expiresAt.getFullYear() + 1)
  const expiresIso = expiresAt.toISOString()

  // Credita 25 pontos para o comprador
  console.log('\nCreditando 25 pts para o comprador...')
  const { error: buyerErr } = await admin.rpc('credit_points', {
    p_user_id:      order.buyer_id,
    p_type:         'purchase_earn',
    p_amount:       25,
    p_expires_at:   expiresIso,
    p_reference_id: orderId,
    p_description:  'Pontos ganhos por confirmar recebimento de compra',
  })
  if (buyerErr) {
    console.error('  ❌ Falhou:', buyerErr.message)
  } else {
    console.log('  ✅ 25 pts creditados ao comprador!')
  }

  // Credita 25 pontos para o vendedor
  console.log('\nCreditando 25 pts para o vendedor...')
  const { error: sellerErr } = await admin.rpc('credit_points', {
    p_user_id:      order.seller_id,
    p_type:         'sale_earn',
    p_amount:       25,
    p_expires_at:   expiresIso,
    p_reference_id: orderId,
    p_description:  'Pontos ganhos por venda concluída',
  })
  if (sellerErr) {
    console.error('  ❌ Falhou:', sellerErr.message)
  } else {
    console.log('  ✅ 25 pts creditados ao vendedor!')
  }

  console.log('\n✅ Concluído!')
}

main().catch(console.error)
