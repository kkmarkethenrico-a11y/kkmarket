/**
 * /api/announcements/[id]/auto-delivery
 *
 * Gestão de estoque de credenciais para entrega automática.
 *
 * GET    → lista itens (sem expor payload — só id, status, data, mascarado)
 * POST   → adiciona 1 ou N itens (texto puro vira AES-256 antes de gravar)
 * DELETE → remove um item específico (apenas se NÃO entregue)
 *
 * Auth: somente o dono do anúncio (announcements.user_id === auth.uid()).
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { encryptPayload } from '@/lib/auto-delivery/crypto'

const MAX_PAYLOAD_LEN = 4000
const MAX_BATCH       = 500

// ─── helpers ──────────────────────────────────────────────────────────
async function loadOwnedAnnouncement(announcementId: string, userId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('announcements')
    .select('id, user_id, has_auto_delivery, status')
    .eq('id', announcementId)
    .single()
  if (error || !data) return { error: 'Anúncio não encontrado.', status: 404 as const, ann: null }
  if (data.user_id !== userId) return { error: 'Acesso negado.', status: 403 as const, ann: null }
  return { ann: data, error: null, status: 200 as const }
}

// ──────────────────────────────────────────────────────────────────────
// GET
// ──────────────────────────────────────────────────────────────────────
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: announcementId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  const { ann, error, status } = await loadOwnedAnnouncement(announcementId, user.id)
  if (error || !ann) return NextResponse.json({ error }, { status })

  const admin = createAdminClient()
  const { data: items, error: listErr } = await admin
    .from('auto_delivery_items')
    .select('id, item_id, is_delivered, order_id, created_at')
    .eq('announcement_id', announcementId)
    .order('created_at', { ascending: false })
    .limit(1000)

  if (listErr) {
    console.error('[auto-delivery.GET]', listErr)
    return NextResponse.json({ error: 'Falha ao listar itens.' }, { status: 500 })
  }

  const total      = items?.length ?? 0
  const delivered  = items?.filter((i) => i.is_delivered).length ?? 0
  const available  = total - delivered

  return NextResponse.json({
    items: items ?? [],
    counts: { total, delivered, available },
  })
}

// ──────────────────────────────────────────────────────────────────────
// POST — adicionar 1+ itens
// ──────────────────────────────────────────────────────────────────────
const postSchema = z.object({
  // Modo único: payload (string) — uma credencial
  // Modo lote:  payloads (string[]) — uma por linha
  payload:  z.string().min(1).max(MAX_PAYLOAD_LEN).optional(),
  payloads: z.array(z.string().min(1).max(MAX_PAYLOAD_LEN)).max(MAX_BATCH).optional(),
  item_id:  z.string().uuid().optional(),
}).refine((d) => d.payload || (d.payloads && d.payloads.length > 0), {
  message: 'Informe payload ou payloads.',
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: announcementId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  const { ann, error, status } = await loadOwnedAnnouncement(announcementId, user.id)
  if (error || !ann) return NextResponse.json({ error }, { status })

  let body: z.infer<typeof postSchema>
  try {
    body = postSchema.parse(await request.json())
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues[0]?.message ?? 'Dados inválidos.' },
        { status: 400 },
      )
    }
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 })
  }

  // Normaliza para um array de payloads em texto puro
  const rawList = (body.payloads ?? [body.payload!])
    .map((s) => s.trim())
    .filter((s) => s.length > 0)

  if (rawList.length === 0) {
    return NextResponse.json({ error: 'Nenhum item válido recebido.' }, { status: 400 })
  }

  // Encripta TUDO em memória — nada de plain-text vai pro DB
  let rows: Array<{
    announcement_id: string
    item_id: string | null
    payload: string
  }>
  try {
    rows = rawList.map((p) => ({
      announcement_id: announcementId,
      item_id:         body.item_id ?? null,
      payload:         encryptPayload(p),
    }))
  } catch (cryptErr) {
    console.error('[auto-delivery.POST] encrypt', cryptErr)
    return NextResponse.json(
      { error: 'Falha ao proteger as credenciais. Verifique ENCRYPTION_KEY no servidor.' },
      { status: 500 },
    )
  }

  const admin = createAdminClient()
  const { data: inserted, error: insertErr } = await admin
    .from('auto_delivery_items')
    .insert(rows)
    .select('id')

  if (insertErr || !inserted) {
    console.error('[auto-delivery.POST] insert', insertErr)
    return NextResponse.json({ error: 'Falha ao salvar itens.' }, { status: 500 })
  }

  // Habilita auto delivery no anúncio se ainda não estava habilitado
  if (!ann.has_auto_delivery) {
    await admin
      .from('announcements')
      .update({ has_auto_delivery: true, updated_at: new Date().toISOString() })
      .eq('id', announcementId)
  }

  // Se anúncio estava 'sold_out' e agora há estoque, reativa para 'active'
  if (ann.status === 'sold_out') {
    await admin
      .from('announcements')
      .update({ status: 'active', updated_at: new Date().toISOString() })
      .eq('id', announcementId)
  }

  return NextResponse.json({ ok: true, added: inserted.length }, { status: 201 })
}

// ──────────────────────────────────────────────────────────────────────
// DELETE — remover um item NÃO entregue
// ──────────────────────────────────────────────────────────────────────
const deleteSchema = z.object({
  item_id: z.string().uuid(),
})

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: announcementId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  const { ann, error, status } = await loadOwnedAnnouncement(announcementId, user.id)
  if (error || !ann) return NextResponse.json({ error }, { status })

  let body: z.infer<typeof deleteSchema>
  try {
    body = deleteSchema.parse(await request.json())
  } catch {
    return NextResponse.json({ error: 'item_id obrigatório.' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: deleted, error: delErr } = await admin
    .from('auto_delivery_items')
    .delete()
    .eq('id', body.item_id)
    .eq('announcement_id', announcementId)
    .eq('is_delivered', false)
    .select('id')
    .maybeSingle()

  if (delErr) {
    console.error('[auto-delivery.DELETE]', delErr)
    return NextResponse.json({ error: 'Falha ao remover item.' }, { status: 500 })
  }
  if (!deleted) {
    return NextResponse.json(
      { error: 'Item não encontrado ou já entregue.' },
      { status: 404 },
    )
  }

  return NextResponse.json({ ok: true })
}
