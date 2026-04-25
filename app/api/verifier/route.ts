/**
 * GET  /api/verifier/check?identifier=<email|username|cpf>
 *   Public lookup. Returns matching VISIBLE records (fraudulent/suspicious).
 *
 * POST /api/verifier/report
 *   Body: { identifier, game_id?, status, description, evidence_url?, reporter_email? }
 *   Public submission. Inserts with status='pending' for admin moderation.
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient }      from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// ─── Helpers ─────────────────────────────────────────────────────────────────
function normalizeIdentifier(raw: string): string {
  const trimmed = raw.trim().toLowerCase()
  // If looks like CPF (only digits/dots/dashes), strip non-digits
  if (/^[\d.\-\s]+$/.test(trimmed)) {
    return trimmed.replace(/\D/g, '')
  }
  return trimmed
}

// ─── GET ─────────────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const identifier = url.searchParams.get('identifier')?.trim()

  if (!identifier || identifier.length < 3) {
    return NextResponse.json(
      { error: 'Informe um identificador com pelo menos 3 caracteres.' },
      { status: 400 },
    )
  }

  const normalized = normalizeIdentifier(identifier)

  // Public anon client respects RLS (only fraudulent/suspicious visible)
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('account_verifier')
    .select(`
      id, identifier, status, description, evidence_url, created_at,
      categories:game_id ( id, name, slug )
    `)
    .or(`identifier.ilike.${identifier},identifier.eq.${normalized}`)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    console.error('[verifier/check] error:', error.message)
    return NextResponse.json({ error: 'Erro ao consultar.' }, { status: 500 })
  }

  return NextResponse.json({
    identifier,
    found:    (data ?? []).length > 0,
    matches:  data ?? [],
  })
}

// ─── POST ────────────────────────────────────────────────────────────────────
const reportSchema = z.object({
  identifier:     z.string().min(3).max(200),
  game_id:        z.string().uuid().optional().nullable(),
  status:         z.enum(['fraudulent', 'suspicious']),
  description:    z.string().min(20, 'Descreva o ocorrido (mín. 20 caracteres)').max(2000),
  evidence_url:   z.string().url().optional().nullable(),
  reporter_email: z.string().email().optional().nullable(),
})

export async function POST(request: NextRequest) {
  let rawBody: unknown
  try {
    rawBody = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido.' }, { status: 400 })
  }

  const parsed = reportSchema.safeParse(rawBody)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados inválidos.', details: z.flattenError(parsed.error) },
      { status: 422 },
    )
  }

  const data = parsed.data
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // All public reports start as 'pending' for admin moderation —
  // user-submitted `status` is just the *suggested* category.
  const admin = createAdminClient()
  const { data: row, error } = await admin
    .from('account_verifier')
    .insert({
      identifier:     normalizeIdentifier(data.identifier),
      game_id:        data.game_id ?? null,
      status:         'pending',
      description:    `[${data.status.toUpperCase()}] ${data.description}`,
      evidence_url:   data.evidence_url ?? null,
      reported_by:    user?.id ?? null,
      reporter_email: user?.email ?? data.reporter_email ?? null,
    })
    .select('id')
    .single()

  if (error || !row) {
    console.error('[verifier/report] insert error:', error?.message)
    return NextResponse.json({ error: 'Erro ao registrar denúncia.' }, { status: 500 })
  }

  return NextResponse.json({
    ok:      true,
    id:      row.id,
    message: 'Denúncia recebida. Será analisada pela moderação.',
  })
}
