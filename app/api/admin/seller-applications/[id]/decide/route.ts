import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const schema = z.object({
  decision: z.enum(['approve', 'reject']),
  reason: z.string().max(500).optional(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: userId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  // Verifica role do caller
  const { data: caller } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!caller || !['admin', 'moderator'].includes(caller.role)) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  if (parsed.data.decision === 'reject' && !parsed.data.reason?.trim()) {
    return NextResponse.json({ error: 'Motivo obrigatório para rejeição' }, { status: 400 })
  }

  const { error } = await supabase.rpc('decide_seller_application', {
    p_user_id: userId,
    p_decision: parsed.data.decision,
    p_reason: parsed.data.reason ?? null,
  })

  if (error) {
    console.error('[admin/seller-applications] rpc error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
