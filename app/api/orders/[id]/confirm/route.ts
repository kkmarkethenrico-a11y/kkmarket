/**
 * POST /api/orders/[id]/confirm
 *
 * Buyer confirms receipt of the product/service.
 * Optionally includes a positive review to trigger accelerated release.
 *
 * Flow:
 *   1. Auth: only the buyer of the order
 *   2. Mark buyer_confirmed_at = now()
 *   3. If review_type === 'positive' → accelerated release:
 *      escrow_release_at = now() + ceil(original_days / 2) business days
 *   4. Insert system message in chat
 *   5. If review data present, insert order_review
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient }      from '@/lib/supabase/server'
import { createAdminClient }  from '@/lib/supabase/admin'

const bodySchema = z.object({
  review_type:    z.enum(['positive', 'neutral', 'negative']).optional(),
  review_message: z.string().max(600).optional(),
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

  // 2. Parse optional body
  let body: z.infer<typeof bodySchema> = {}
  try {
    const raw = await request.json()
    const parsed = bodySchema.safeParse(raw)
    if (parsed.success) body = parsed.data
  } catch {
    // No body is fine
  }

  const admin = createAdminClient()

  // 3. Get order
  const { data: order, error: oErr } = await admin
    .from('orders')
    .select(`
      id, buyer_id, seller_id, seller_amount, status,
      escrow_release_at, buyer_confirmed_at,
      announcement_id,
      announcements!announcement_id (
        category_id, title,
        categories!category_id ( balance_release_days )
      )
    `)
    .eq('id', orderId)
    .single()

  if (oErr || !order) {
    return NextResponse.json({ error: 'Pedido não encontrado.' }, { status: 404 })
  }

  // 4. Auth: only buyer
  if (order.buyer_id !== user.id) {
    return NextResponse.json({ error: 'Apenas o comprador pode confirmar o recebimento.' }, { status: 403 })
  }

  // 5. Validate status
  const validStatuses = ['paid', 'in_delivery', 'delivered']
  if (!validStatuses.includes(order.status)) {
    return NextResponse.json({ error: `Pedido não está em um status válido para confirmação (atual: ${order.status}).` }, { status: 409 })
  }

  // 6. Idempotency
  if (order.buyer_confirmed_at) {
    return NextResponse.json({ error: 'Recebimento já confirmado.' }, { status: 409 })
  }

  const now = new Date()

  // 7. Calculate new escrow release date
  const ann = order.announcements as unknown as {
    category_id: string
    title: string
    categories: { balance_release_days: number }
  }

  const originalDays = ann.categories?.balance_release_days ?? 4
  const isPositive = body.review_type === 'positive'

  let newReleaseAt: Date
  let releaseMessage: string

  if (isPositive) {
    // Accelerated release: ceil(original_days / 2) business days from now
    const acceleratedDays = Math.ceil(originalDays / 2)
    newReleaseAt = addBusinessDays(now, acceleratedDays)
    releaseMessage = `✅ Entrega confirmada pelo comprador com avaliação positiva! Liberação acelerada: saldo disponível em ${acceleratedDays} dia(s) útil(eis) (${newReleaseAt.toLocaleDateString('pt-BR')}).`
  } else {
    // Keep original or set to original from now
    if (order.escrow_release_at) {
      newReleaseAt = new Date(order.escrow_release_at)
    } else {
      newReleaseAt = addBusinessDays(now, originalDays)
    }
    releaseMessage = `✅ Entrega confirmada pelo comprador. Saldo será liberado em ${newReleaseAt.toLocaleDateString('pt-BR')}.`
  }

  // 8. Update order
  await admin
    .from('orders')
    .update({
      buyer_confirmed_at: now.toISOString(),
      accelerated_release: isPositive,
      escrow_release_at:   newReleaseAt.toISOString(),
      status:              'delivered',
      updated_at:          now.toISOString(),
    })
    .eq('id', orderId)

  // 9. System message in chat
  await admin.from('order_messages').insert({
    order_id:  orderId,
    sender_id: null,
    message:   releaseMessage,
    type:      'system',
  })

  // 10. Insert review if provided
  if (body.review_type) {
    const { error: revErr } = await admin.from('order_reviews').insert({
      order_id:    orderId,
      reviewer_id: user.id,
      reviewed_id: order.seller_id,
      role:        'buyer',
      type:        body.review_type,
      message:     body.review_message ?? null,
    })

    if (revErr && !revErr.message.includes('duplicate')) {
      console.error('[confirm] review insert failed:', revErr.message)
    }

    // Update seller review stats
    const statsField = body.review_type === 'positive'
      ? 'reviews_positive'
      : body.review_type === 'neutral'
      ? 'reviews_neutral'
      : 'reviews_negative'

    // Try RPC first, fall back to manual increment
    const { error: rpcReviewErr } = await admin.rpc('increment_review_count', {
      p_user_id: order.seller_id,
      p_field:   statsField,
    })

    if (rpcReviewErr) {
      // Fallback: manual increment if RPC doesn't exist yet
      const { data: stats } = await admin
        .from('user_stats')
        .select(statsField)
        .eq('user_id', order.seller_id)
        .single()
      if (stats) {
        await admin
          .from('user_stats')
          .update({ [statsField]: ((stats as Record<string, number>)[statsField] ?? 0) + 1 })
          .eq('user_id', order.seller_id)
      }
    }
  }

  // 11. Notify seller (confirmação) + prompt de avaliação para ambos
  await admin.from('notifications').insert([
    {
      user_id:        order.seller_id,
      type:           'order_delivered',
      title:          'Recebimento confirmado!',
      message:        `O comprador confirmou o recebimento de "${ann.title}". ${isPositive ? 'Liberação acelerada ativada! 🚀' : `Saldo será liberado em ${newReleaseAt.toLocaleDateString('pt-BR')}.`}`,
      reference_id:   orderId,
      reference_type: 'order',
    },
    // Prompt: seller avalia o buyer
    {
      user_id:        order.seller_id,
      type:           'review_received',
      title:          'Avalie o comprador',
      message:        `Como foi sua experiência vendendo "${ann.title}"? Avalie o comprador agora.`,
      reference_id:   orderId,
      reference_type: 'order',
    },
    // Prompt: buyer avalia o seller
    {
      user_id:        order.buyer_id,
      type:           'review_received',
      title:          'Avalie sua compra',
      message:        `Tudo certo com "${ann.title}"? Deixe sua avaliação para o vendedor.`,
      reference_id:   orderId,
      reference_type: 'order',
    },
  ])

  return NextResponse.json({
    ok: true,
    accelerated:       isPositive,
    escrow_release_at: newReleaseAt.toISOString(),
  })
}

// ─── Helper ───────────────────────────────────────────────────────────────────
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