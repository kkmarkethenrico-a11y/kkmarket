import type { SupabaseClient } from '@supabase/supabase-js'
import {
  sendAutoDeliveryEmail,
  sendPurchaseConfirmedEmail,
} from '@/lib/resend/emails'
import { getUserEmail } from '@/lib/resend/get-user-email'

interface OrderEmailContext {
  id: string
  buyer_id: string
  amount: number
  announcements: {
    title: string
    has_auto_delivery: boolean
  }
}

export async function sendOrderPaidEmails(
  admin: SupabaseClient,
  order: OrderEmailContext,
  autoDeliveryCode?: string | null,
) {
  const buyerEmail = await getUserEmail(order.buyer_id)
  if (!buyerEmail) {
    console.warn('[resend] comprador sem e-mail — pedido:', order.id)
    return
  }

  const { data: profile } = await admin
    .from('profiles')
    .select('username, display_name')
    .eq('id', order.buyer_id)
    .single()

  const buyerName = profile?.display_name ?? profile?.username ?? 'Comprador'
  const ann = order.announcements

  await sendPurchaseConfirmedEmail({
    to: buyerEmail,
    buyerName,
    productTitle: ann.title,
    amount: order.amount,
    orderId: order.id,
    hasAutoDelivery: ann.has_auto_delivery,
  })

  if (autoDeliveryCode) {
    await sendAutoDeliveryEmail({
      to: buyerEmail,
      buyerName,
      productTitle: ann.title,
      activationCode: autoDeliveryCode,
      orderId: order.id,
    })
  }
}
