import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { AdminBlogActions } from './AdminBlogActions'

export const metadata = { title: 'Blog — Admin' }
export const dynamic = 'force-dynamic'

export default async function AdminBlogPage({
  searchParams,
}: {
  searchParams: Promise<{ published?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!me || !['admin', 'moderator'].includes(me.role)) redirect('/')

  const sp = await searchParams
  const publishedFilter = sp.published === 'true' ? true : sp.published === 'false' ? false : null

  const admin = createAdminClient()

  let query = admin
    .from('blog_posts')
    .select(`id, title, slug, excerpt, is_published, published_at, reading_time, created_at, profiles!author_id(username, display_name)`, { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(100)

  if (publishedFilter !== null) query = (query as any).eq('is_published', publishedFilter)

  const { data: posts, count } = await query

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Blog</h1>
          <p className="text-sm text-muted-foreground">{(count ?? 0).toLocaleString('pt-BR')} post(s)</p>
        </div>
        <Link
          href="/admin/blog/novo"
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          + Novo post
        </Link>
      </header>

      {/* Filtros */}
      <nav className="flex gap-2">
        {[['', 'Todos'], ['true', 'Publicados'], ['false', 'Rascunhos']].map(([val, label]) => (
          <Link key={val} href={val ? `/admin/blog?published=${val}` : '/admin/blog'}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              (publishedFilter === null && !val) || (publishedFilter !== null && String(publishedFilter) === val)
                ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'
            }`}>
            {label}
          </Link>
        ))}
      </nav>

      {/* Lista de posts */}
      <div className="space-y-3">
        {(posts ?? []).map((post: any) => {
          const author = post.profiles
          return (
            <article key={post.id} className="rounded-xl border bg-card p-5 flex items-start gap-4">
              <div className="flex-1 space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${post.is_published ? 'bg-green-500/20 text-green-300' : 'bg-zinc-700 text-zinc-400'}`}>
                    {post.is_published ? 'Publicado' : 'Rascunho'}
                  </span>
                  {post.reading_time && (
                    <span className="text-xs text-muted-foreground">{post.reading_time} min de leitura</span>
                  )}
                </div>
                <h2 className="font-semibold truncate">{post.title}</h2>
                {post.excerpt && <p className="text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>}
                <p className="text-xs text-muted-foreground">
                  /{post.slug} · por @{author?.username ?? '?'} ·{' '}
                  {post.published_at
                    ? `publicado ${new Date(post.published_at).toLocaleDateString('pt-BR')}`
                    : `criado ${new Date(post.created_at).toLocaleDateString('pt-BR')}`}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link href={`/admin/blog/${post.id}/editar`}
                  className="rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors">
                  Editar
                </Link>
                <AdminBlogActions postId={post.id} isPublished={post.is_published} />
              </div>
            </article>
          )
        })}
        {!posts?.length && (
          <p className="text-center py-10 text-muted-foreground">Nenhum post encontrado.</p>
        )}
      </div>
    </div>
  )
}
