import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const schema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(220).regex(/^[a-z0-9-]+$/),
  excerpt: z.string().max(500).nullable().optional(),
  content: z.string().min(1),
  cover_url: z.string().url().nullable().optional(),
  reading_time: z.number().int().min(1).default(1),
  seo_title: z.string().max(80).nullable().optional(),
  seo_description: z.string().max(200).nullable().optional(),
  is_published: z.boolean().default(false),
})

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!me || !['admin', 'moderator'].includes(me.role)) return null
  return user
}

export async function POST(req: NextRequest) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.flatten() }, { status: 400 })

  const admin = createAdminClient()
  const { data, error } = await admin.from('blog_posts').insert({
    ...parsed.data,
    author_id: user.id,
    published_at: parsed.data.is_published ? new Date().toISOString() : null,
  }).select('id').single()

  if (error) {
    console.error('[admin/blog POST]', error.message)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true, id: data.id }, { status: 201 })
}
