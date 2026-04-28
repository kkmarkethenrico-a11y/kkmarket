import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { BlogEditor } from '../BlogEditor'

export const dynamic = 'force-dynamic'

export default async function NovoPostPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!me || !['admin', 'moderator'].includes(me.role)) redirect('/')

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
        <h1 className="text-xl font-semibold text-white">Novo post</h1>
      </div>

      <BlogEditor />
    </div>
  )
}
