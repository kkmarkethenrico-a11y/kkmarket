/**
 * POST /api/orders/[id]/review
 *
 * Participante avalia o outro lado do negócio após a conclusão do pedido.
 *
 * Regras:
 *   - Pedido deve estar em status 'delivered' ou 'completed'
 *   - Usuário deve ser buyer ou seller do pedido
 *   - Cada participante só pode avaliar uma vez por pedido (unique constraint)
 *   - buyer avalia seller  → role='buyer'
 *   - seller avalia buyer  → role='seller'
 *   - Atualiza user_stats do avaliado
 *   - Se review_type='positive' e reviewer=buyer e pedido em 'delivered':
 *       aciona liberação acelerada de escrow (mesma lógica do confirm)
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const bodySchema = z.object({
  type:    z.enum(['positive', 'neutral', 'negative']),
  message: z.string().max(600).optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: orderId } = await params

  // 1. Auth
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  // 2. Parse body
  let body: z.infer<typeof bodySchema>
  try {
    body = bodySchema.parse(await request.json())
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues[0]?.message ?? 'Dados inválidos.' },
        { status: 400 },
      )
    }
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 })
  }

  const admin = createAdminClient()

  // 3. Busca pedido
  const { data: order, error: orderErr } = await admin
    .from('orders')
    .select(
      'id, buyer_id, seller_id, status, escrow_release_at, accelerated_release, announcement_id, announcements!announcement_id(title, category_id, categories!category_id(balance_release_days))',
    )
    .eq('id', orderId)
    .single()

  if (orderErr || !order) {
    return NextResponse.json({ error: 'Pedido não encontrado.' }, { status: 404 })
  }

  // 4. Participação
  const isBuyer  = order.buyer_id  === user.id
  const isSeller = order.seller_id === user.id
  if (!isBuyer && !isSeller) {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
  }

  // 5. Status do pedido
  const allowedStatuses = ['delivered', 'completed']
  if (!allowedStatuses.includes(order.status)) {
    return NextResponse.json(
      {
        error: `Avaliação disponível apenas para pedidos concluídos (status atual: ${order.status}).`,
      },
      { status: 409 },
    )
  }

  // 6. Verificar se já avaliou
  const { data: existing } = await admin
    .from('order_reviews')
    .select('id')
    .eq('order_id', orderId)
    .eq('reviewer_id', user.id)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'Você já avaliou este pedido.' }, { status: 409 })
  }

  const reviewedId = isBuyer ? order.seller_id : order.buyer_id
  const role       = isBuyer ? 'buyer' : 'seller'

  // 7. Inserir avaliação
  const { data: inserted, error: insertErr } = await admin
    .from('order_reviews')
    .insert({
      order_id:    orderId,
      reviewer_id: user.id,
      reviewed_id: reviewedId,
      role,
      type:        body.type,
      message:     body.message ?? null,
    })
    .select('id')
    .single()

  if (insertErr || !inserted) {
    if (insertErr?.code === '23505') {
      return NextResponse.json({ error: 'Você já avaliou este pedido.' }, { status: 409 })
    }
    console.error('[review.POST] insert', insertErr)
    return NextResponse.json({ error: 'Falha ao registrar avaliação.' }, { status: 500 })
  }

  // 8. Atualizar user_stats do avaliado
  const statsField =
    body.type === 'positive'
      ? 'reviews_positive'
      : body.type === 'neutral'
      ? 'reviews_neutral'
      : 'reviews_negative'

  const { data: stats } = await admin
    .from('user_stats')
    .select(statsField)
    .eq('user_id', reviewedId)
    .single()

  if (stats) {
    await admin
      .from('user_stats')
      .update({
        [statsField]: ((stats as Record<string, number>)[statsField] ?? 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', reviewedId)
  }

  // 9. Se buyer avaliou positivamente e pedido ainda em 'delivered':
  //    acionar liberação acelerada (idempotente — só atualiza se não acelerado ainda)
  if (isBuyer && body.type === 'positive' && order.status === 'delivered' && !order.accelerated_release) {
    const ann = order.announcements as unknown as {
      title: string
      categories: { balance_release_days: number }
    }
    const originalDays    = ann.categories?.balance_release_days ?? 4
    const acceleratedDays = Math.ceil(originalDays / 2)
    const newRelease      = addBusinessDays(new Date(), acceleratedDays)

    await admin
      .from('orders')
      .update({
        accelerated_release: true,
        escrow_release_at:   newRelease.toISOString(),
        updated_at:          new Date().toISOString(),
      })
      .eq('id', orderId)

    await admin.from('order_messages').insert({
      order_id:  orderId,
      sender_id: null,
      message:   `⭐ Avaliação positiva registrada! Liberação acelerada: saldo disponível em ${acceleratedDays} dia(s) útil(eis) (${newRelease.toLocaleDateString('pt-BR')}).`,
      type:      'system',
    })
  }

  // 10. Notificar o avaliado
  const annTitle = (order.announcements as unknown as { title: string })?.title ?? 'pedido'
  const typeLabel = body.type === 'positive' ? 'positiva ⭐' : body.type === 'neutral' ? 'neutra' : 'negativa'
  await admin.from('notifications').insert({
    user_id:        reviewedId,
    type:           'review_received',
    title:          'Você recebeu uma avaliação',
    message:        `Avaliação ${typeLabel} recebida no pedido de "${annTitle}".`,
    reference_id:   orderId,
    reference_type: 'order',
  })

  return NextResponse.json({ ok: true, review_id: inserted.id }, { status: 201 })
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
