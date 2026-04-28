import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { BlogEditor } from '../../BlogEditor'

export const dynamic = 'force-dynamic'

export default async function EditarPostPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!me || !['admin', 'moderator'].includes(me.role)) redirect('/')

  const { id } = await params
  const admin = createAdminClient()
  const { data: post } = await admin
    .from('blog_posts')
    .select('id, title, slug, excerpt, content, cover_url, reading_time, seo_title, seo_description, is_published')
    .eq('id', id)
    .single()

  if (!post) notFound()

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/admin/blog"
          className="text-white/50 hover:text-white text-sm transition-colors"
        >
          ← Blog
        </Link>
        <span className="text-white/20">/</span>
        <h1 className="text-xl font-semibold text-white">Editar post</h1>
      </div>

      <BlogEditor initial={post} />
    </div>
  )
}
