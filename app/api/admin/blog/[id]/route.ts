import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const patchSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  slug: z.string().min(1).max(220).regex(/^[a-z0-9-]+$/).optional(),
  excerpt: z.string().max(500).nullable().optional(),
  content: z.string().min(1).optional(),
  cover_url: z.string().url().nullable().optional(),
  reading_time: z.number().int().min(1).optional(),
  seo_title: z.string().max(80).nullable().optional(),
  seo_description: z.string().max(200).nullable().optional(),
  is_published: z.boolean().optional(),
  published_at: z.string().nullable().optional(),
})

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!me || !['admin', 'moderator'].includes(me.role)) return null
  return user
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { id } = await params
  const body = await req.json().catch(() => null)
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.flatten() }, { status: 400 })

  const admin = createAdminClient()
  const update: Record<string, unknown> = { ...parsed.data }
  // Auto-set published_at when publishing for the first time
  if (parsed.data.is_published === true && !('published_at' in parsed.data)) {
    const { data: current } = await admin.from('blog_posts').select('published_at').eq('id', id).single()
    if (!current?.published_at) update.published_at = new Date().toISOString()
  }

  const { error } = await admin.from('blog_posts').update(update).eq('id', id)
  if (error) {
    console.error('[admin/blog PATCH]', error.message)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { id } = await params
  const admin = createAdminClient()
  const { error } = await admin.from('blog_posts').delete().eq('id', id)
  if (error) {
    console.error('[admin/blog DELETE]', error.message)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
