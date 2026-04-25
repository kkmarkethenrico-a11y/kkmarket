/**
 * /api/admin/withdrawals/[id]/decision
 *
 * POST → admin aprova ou rejeita um saque pendente.
 *   action='approve' → chama processWithdrawal()
 *   action='reject'  → chama RPC reject_withdrawal (estorna saldo)
 *
 * Auth: somente role admin/moderator.
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { processWithdrawal } from '@/lib/pagarme/withdrawals'

const schema = z.object({
  action: z.enum(['approve', 'reject']),
  note:   z.string().max(500).optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || (profile.role !== 'admin' && profile.role !== 'moderator')) {
    return NextResponse.json({ error: 'Acesso restrito.' }, { status: 403 })
  }

  let body: z.infer<typeof schema>
  try {
    body = schema.parse(await request.json())
  } catch {
    return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })
  }

  if (body.action === 'reject' && !body.note) {
    return NextResponse.json({ error: 'Informe a nota da rejeição.' }, { status: 400 })
  }

  const admin = createAdminClient()

  if (body.action === 'reject') {
    const { error } = await admin.rpc('reject_withdrawal', {
      p_request_id: id,
      p_admin_id:   user.id,
      p_note:       body.note,
    })
    if (error) {
      console.error('[admin.withdrawals.reject]', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ ok: true })
  }

  // approve → processa
  const result = await processWithdrawal(id)
  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? 'Falha no processamento.' }, { status: 502 })
  }

  // Marca quem aprovou
  await admin
    .from('withdrawal_requests')
    .update({ processed_by: user.id, updated_at: new Date().toISOString() })
    .eq('id', id)

  return NextResponse.json({ ok: true, pagarmeId: result.pagarmeId })
}
