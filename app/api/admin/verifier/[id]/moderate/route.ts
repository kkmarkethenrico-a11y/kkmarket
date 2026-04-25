/**
 * POST /api/admin/verifier/[id]/moderate
 *   Body: { action: 'confirm_fraud' | 'mark_suspicious' | 'reject', note?: string }
 *
 * Staff-only. Promotes a 'pending' report to its public status, or rejects it.
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient }      from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

const bodySchema = z.object({
  action: z.enum(['confirm_fraud', 'mark_suspicious', 'reject']),
  note:   z.string().max(500).optional(),
})

const ACTION_TO_STATUS: Record<z.infer<typeof bodySchema>['action'], string> = {
  confirm_fraud:   'fraudulent',
  mark_suspicious: 'suspicious',
  reject:          'rejected',
}

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || (profile.role !== 'admin' && profile.role !== 'moderator')) {
    return NextResponse.json({ error: 'Acesso restrito.' }, { status: 403 })
  }

  let rawBody: unknown
  try {
    rawBody = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido.' }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(rawBody)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados inválidos.', details: z.flattenError(parsed.error) },
      { status: 422 },
    )
  }

  const newStatus = ACTION_TO_STATUS[parsed.data.action]
  const admin = createAdminClient()

  const { error } = await admin
    .from('account_verifier')
    .update({
      status:         newStatus,
      verified_by:    user.id,
      moderator_note: parsed.data.note ?? null,
      moderated_at:   new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    console.error('[admin/verifier/moderate] update error:', error.message)
    return NextResponse.json({ error: 'Erro ao moderar.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, status: newStatus })
}
