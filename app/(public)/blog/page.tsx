import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Blog — GameMarket',
  description: 'Guias, dicas e novidades sobre jogos digitais, contas e o mercado gamer.',
}

export default async function BlogPage() {
  const supabase = await createClient()

  const { data: posts } = await supabase
    .from('blog_posts')
    .select('id, title, slug, excerpt, cover_url, reading_time, published_at, created_at, profiles!author_id(username, display_name)')
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  const list = (posts ?? []) as any[]

  return (
    <div className="min-h-screen text-[var(--gm-ink)]">
      <div className="container mx-auto max-w-5xl px-4 py-10">

        {/* Header */}
        <div className="mb-10">
          <nav className="mb-4 flex items-center gap-2 text-sm text-[var(--gm-ink-dim)]">
            <Link href="/" className="hover:text-[var(--gm-ink)] transition-colors">Home</Link>
            <span>/</span>
            <span className="text-[var(--gm-ink)]">Blog</span>
          </nav>
          <h1 className="text-3xl font-black text-[var(--gm-ink)]">Blog</h1>
          <p className="mt-1 text-[var(--gm-ink-dim)]">Guias, dicas e novidades do mundo gamer.</p>
        </div>

        {list.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--gm-ink-faint)]/30 py-24 text-center">
            <span className="text-5xl mb-4">📝</span>
            <p className="text-lg font-semibold text-[var(--gm-ink)]">Nenhum post publicado ainda</p>
            <p className="mt-1 text-sm text-[var(--gm-ink-dim)]">Volte em breve para novidades.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((post) => {
              const author = post.profiles as { username: string; display_name: string | null } | null
              const authorName = author?.display_name ?? author?.username ?? 'GameMarket'
              const date = new Date(post.published_at ?? post.created_at).toLocaleDateString('pt-BR', {
                day: '2-digit', month: 'short', year: 'numeric',
              })
              return (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-[var(--gm-ink-faint)]/20 bg-[var(--gm-paper)] hover:border-[var(--gm-violet)] transition-colors shadow-sm"
                >
                  <div className="relative aspect-video overflow-hidden bg-muted">
                    {post.cover_url ? (
                      <Image
                        src={post.cover_url}
                        alt={post.title}
                        fill
                        sizes="(max-width: 640px) 100vw, 33vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-4xl text-muted-foreground">📝</div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-2 p-4">
                    <h2 className="line-clamp-2 font-bold text-[var(--gm-ink)] group-hover:text-[var(--gm-violet)] leading-snug">{post.title}</h2>
                    {post.excerpt && (
                      <p className="line-clamp-2 text-sm text-[var(--gm-ink-dim)]">{post.excerpt}</p>
                    )}
                    <div className="mt-auto flex items-center gap-2 pt-2 text-xs text-[var(--gm-ink-faint)]">
                      <span className="font-medium text-[var(--gm-ink-dim)]">{authorName}</span>
                      <span>·</span>
                      <span>{date}</span>
                      {post.reading_time && (
                        <>
                          <span>·</span>
                          <span>{post.reading_time} min</span>
                        </>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
