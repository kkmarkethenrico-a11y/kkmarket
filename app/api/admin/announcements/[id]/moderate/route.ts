/**
 * /api/admin/announcements/[id]/moderate
 *
 * POST — aprova, reprova ou edita-e-aprova um anúncio.
 *
 * Body:
 *   action: 'approve' | 'reject' | 'edit_approve'
 *   rejection_reason?: string  (obrigatório para reject)
 *   edits?: Partial<{ title, description, unit_price, stock_quantity }> (para edit_approve)
 *
 * Auth: role admin | moderator
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendAnnouncementApproved, sendAnnouncementRejected } from '@/lib/resend/emails'
import { indexAnnouncement, removeAnnouncementFromIndex } from '@/lib/meilisearch/announcements'

const schema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('approve') }),
  z.object({
    action:           z.literal('reject'),
    rejection_reason: z.string().min(10).max(1000),
  }),
  z.object({
    action: z.literal('edit_approve'),
    edits:  z.object({
      title:          z.string().min(5).max(120).optional(),
      description:    z.string().min(50).optional(),
      unit_price:     z.number().positive().optional(),
      stock_quantity: z.number().int().min(1).optional(),
    }),
  }),
])

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const { data: me } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!me || (me.role !== 'admin' && me.role !== 'moderator')) {
    return NextResponse.json({ error: 'Acesso restrito.' }, { status: 403 })
  }

  let body: z.infer<typeof schema>
  try {
    body = schema.parse(await request.json())
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message ?? 'Dados inválidos.' }, { status: 400 })
    }
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Load announcement + seller profile + email
  const { data: ann } = await admin
    .from('announcements')
    .select(`
      id, title, slug, description, status, user_id, category_id,
      unit_price, stock_quantity, sale_count, approved_at, plan,
      profiles:user_id (id, username, display_name, email:id)
    `)
    .eq('id', id)
    .single()

  if (!ann) return NextResponse.json({ error: 'Anúncio não encontrado.' }, { status: 404 })
  if (ann.status !== 'pending' && body.action !== 'edit_approve') {
    return NextResponse.json({ error: `Anúncio não está pendente (${ann.status}).` }, { status: 400 })
  }

  // Get seller email (auth.users)
  const { data: authUserData } = await admin.auth.admin.getUserById(ann.user_id)
  const sellerEmail = authUserData?.user?.email ?? null
  const seller = ann.profiles as unknown as { username: string; display_name: string | null }
  const sellerName = seller?.display_name ?? seller?.username ?? 'Vendedor'

  const now = new Date().toISOString()

  if (body.action === 'reject') {
    await admin
      .from('announcements')
      .update({
        status:           'rejected',
        rejection_reason: body.rejection_reason,
        updated_at:       now,
      })
      .eq('id', id)

    // Remove from search index if was somehow published
    await removeAnnouncementFromIndex(id)

    // Notify in-app
    await admin.from('notifications').insert({
      user_id: ann.user_id,
      type:    'announcement_rejected',
      title:   'Anúncio reprovado',
      message: `Seu anúncio "${ann.title}" foi reprovado. Motivo: ${body.rejection_reason}`,
      data:    { announcement_id: id },
    })

    // Email
    if (sellerEmail) {
      await sendAnnouncementRejected({
        to:     sellerEmail,
        name:   sellerName,
        title:  ann.title,
        reason: body.rejection_reason,
      }).catch(console.error)
    }

    return NextResponse.json({ ok: true, status: 'rejected' })
  }

  // approve or edit_approve
  const updates: Record<string, unknown> = {
    status:      'active',
    approved_at: now,
    approved_by: user.id,
    updated_at:  now,
    // Clear any previous rejection
    rejection_reason: null,
  }

  if (body.action === 'edit_approve' && body.edits) {
    const e = body.edits
    if (e.title)          updates.title          = e.title
    if (e.description)    updates.description    = e.description
    if (e.unit_price)     updates.unit_price     = e.unit_price
    if (e.stock_quantity) updates.stock_quantity = e.stock_quantity
    // Regen slug if title changed
    if (e.title) {
      updates.slug = `${e.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`
    }
  }

  const { data: updated } = await admin
    .from('announcements')
    .update(updates)
    .eq('id', id)
    .select('id, title, slug, unit_price, category_id, user_id, sale_count, plan')
    .single()

  if (!updated) {
    return NextResponse.json({ error: 'Falha ao atualizar anúncio.' }, { status: 500 })
  }

  // Index on MeiliSearch
  await indexAnnouncement({
    id:           updated.id,
    title:        updated.title,
    description:  (updates.description as string | undefined) ?? ann.description,
    slug:         (updates.slug as string | undefined) ?? ann.slug,
    plan:         ann.plan,
    unit_price:   updated.unit_price,
    category_id:  updated.category_id,
    user_id:      updated.user_id,
    sale_count:   updated.sale_count,
    approved_at:  now,
  }).catch(console.error)

  // Notify in-app
  await admin.from('notifications').insert({
    user_id: ann.user_id,
    type:    'announcement_approved',
    title:   'Anúncio aprovado! 🎉',
    message: `Seu anúncio "${updated.title}" foi aprovado e já está disponível na plataforma.`,
    data:    { announcement_id: id, slug: updated.slug },
  })

  // Email
  if (sellerEmail) {
    await sendAnnouncementApproved({
      to:    sellerEmail,
      name:  sellerName,
      title: updated.title,
      slug:  (updates.slug as string | undefined) ?? ann.slug,
    }).catch(console.error)
  }

  return NextResponse.json({ ok: true, status: 'active', slug: updated.slug })
}
