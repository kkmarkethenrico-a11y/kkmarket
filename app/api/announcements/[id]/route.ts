import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const patchSchema = z.object({
  plan:           z.enum(['silver', 'gold', 'diamond']).optional(),
  title:          z.string().min(5).max(120).optional(),
  description:    z.string().min(50).optional(),
  unit_price:     z.number().min(2).optional(),
  stock_quantity: z.number().int().min(0).optional(),
})

/**
 * PATCH /api/announcements/[id]
 * - Owner-only edit.
 * - Changing the plan forces re-moderation: status → 'pending'.
 */
export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  let rawBody: unknown
  try {
    rawBody = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido.' }, { status: 400 })
  }

  const parsed = patchSchema.safeParse(rawBody)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados inválidos.', details: z.flattenError(parsed.error) },
      { status: 422 },
    )
  }

  // Load announcement to verify ownership + detect plan change
  const { data: ann, error: loadErr } = await supabase
    .from('announcements')
    .select('id, user_id, plan, status')
    .eq('id', id)
    .single()

  if (loadErr || !ann) {
    return NextResponse.json({ error: 'Anúncio não encontrado.' }, { status: 404 })
  }
  if (ann.user_id !== user.id) {
    return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 })
  }
  if (ann.status === 'deleted') {
    return NextResponse.json({ error: 'Anúncio excluído.' }, { status: 410 })
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (parsed.data.title          !== undefined) updates.title          = parsed.data.title
  if (parsed.data.description    !== undefined) updates.description    = parsed.data.description
  if (parsed.data.unit_price     !== undefined) updates.unit_price     = parsed.data.unit_price
  if (parsed.data.stock_quantity !== undefined) updates.stock_quantity = parsed.data.stock_quantity

  const planChanged = parsed.data.plan !== undefined && parsed.data.plan !== ann.plan
  if (planChanged) {
    updates.plan             = parsed.data.plan
    updates.status           = 'pending'        // mandatory re-moderation
    updates.approved_at      = null
    updates.approved_by      = null
    updates.rejection_reason = null
  }

  const { error: updErr } = await supabase
    .from('announcements')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)

  if (updErr) {
    console.error('[api/announcements PATCH] update error:', updErr.message)
    return NextResponse.json({ error: 'Erro ao atualizar.' }, { status: 500 })
  }

  // If plan changed, remove from MeiliSearch until re-approval
  if (planChanged) {
    try {
      const { removeAnnouncementFromIndex } = await import('@/lib/meilisearch/announcements')
      await removeAnnouncementFromIndex(id)
    } catch (e) {
      console.error('[api/announcements PATCH] meilisearch remove failed:', e)
    }
  }

  return NextResponse.json({
    ok: true,
    plan_changed: planChanged,
    status: planChanged ? 'pending' : ann.status,
  })
}
