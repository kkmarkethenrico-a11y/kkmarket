import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const schema = z.object({
  action: z.enum(['ban', 'suspend', 'activate', 'set_role']),
  role: z.enum(['client', 'moderator']).optional(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!me || !['admin', 'moderator'].includes(me.role)) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const { id: targetId } = await params
  if (targetId === user.id) {
    return NextResponse.json({ error: 'Não pode modificar a si mesmo' }, { status: 400 })
  }

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })

  const { action, role } = parsed.data

  // Only admin can set roles
  if (action === 'set_role' && me.role !== 'admin') {
    return NextResponse.json({ error: 'Apenas admin pode alterar papéis' }, { status: 403 })
  }

  const admin = createAdminClient()

  // Prevent modifying another admin (unless caller is admin)
  const { data: target } = await admin.from('profiles').select('role').eq('id', targetId).single()
  if (target?.role === 'admin' && me.role !== 'admin') {
    return NextResponse.json({ error: 'Não pode modificar um admin' }, { status: 403 })
  }

  let update: Record<string, string> = {}
  if (action === 'ban')      update = { status: 'banned' }
  if (action === 'suspend')  update = { status: 'suspended' }
  if (action === 'activate') update = { status: 'active' }
  if (action === 'set_role' && role) update = { role }

  const { error } = await admin.from('profiles').update({ ...update, updated_at: new Date().toISOString() }).eq('id', targetId)
  if (error) {
    console.error('[admin/users/action]', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
