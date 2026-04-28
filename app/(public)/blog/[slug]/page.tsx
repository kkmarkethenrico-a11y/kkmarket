import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata, ResolvingMetadata } from 'next'
import { createClient } from '@/lib/supabase/server'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata(
  { params }: Props,
  _parent: ResolvingMetadata,
): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('blog_posts')
    .select('title, excerpt, seo_title, seo_description, cover_url')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (!data) return { title: 'Post não encontrado — GameMarket' }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://kkmarket.com.br'
  const desc = data.seo_description ?? data.excerpt ?? ''
  return {
    title: `${data.seo_title ?? data.title} — GameMarket`,
    description: desc,
    alternates: { canonical: `${baseUrl}/blog/${slug}` },
    openGraph: {
      title: data.title,
      description: desc,
      type: 'article',
      images: data.cover_url ? [{ url: data.cover_url }] : [],
    },
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: post } = await supabase
    .from('blog_posts')
    .select('id, title, slug, excerpt, content, cover_url, reading_time, published_at, created_at, profiles!author_id(username, display_name, avatar_url)')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (!post) notFound()

  const author = post.profiles as unknown as {
    username: string
    display_name: string | null
    avatar_url: string | null
  } | null

  const authorName = author?.display_name ?? author?.username ?? 'GameMarket'
  const publishedDate = new Date(post.published_at ?? post.created_at).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
  })

  // Related posts
  const { data: related } = await supabase
    .from('blog_posts')
    .select('id, title, slug, cover_url, created_at')
    .eq('is_published', true)
    .neq('slug', slug)
    .order('created_at', { ascending: false })
    .limit(3)

  return (
    <div className="min-h-screen text-white">
      <div className="container mx-auto max-w-3xl px-4 py-10">

        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-zinc-500">
          <Link href="/" className="hover:text-zinc-300 transition-colors">Home</Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-zinc-300 transition-colors">Blog</Link>
          <span>/</span>
          <span className="truncate max-w-[200px] text-zinc-300">{post.title}</span>
        </nav>

        {/* Header */}
        <header className="mb-8">
          <h1 className="mb-4 text-3xl font-black leading-tight text-white sm:text-4xl">{post.title}</h1>
          {post.excerpt && (
            <p className="mb-4 text-lg text-zinc-400 leading-relaxed">{post.excerpt}</p>
          )}
          <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-500">
            <div className="flex items-center gap-2">
              {author?.avatar_url ? (
                <Image src={author.avatar_url} alt={authorName} width={28} height={28} className="h-7 w-7 rounded-full object-cover" />
              ) : (
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-700 text-xs font-bold uppercase">
                  {authorName[0]}
                </span>
              )}
              <span className="text-zinc-300 font-medium">{authorName}</span>
            </div>
            <span>·</span>
            <span>{publishedDate}</span>
            {post.reading_time && (
              <>
                <span>·</span>
                <span>{post.reading_time} min de leitura</span>
              </>
            )}
          </div>
        </header>

        {/* Cover image */}
        {post.cover_url && (
          <div className="relative mb-8 aspect-video w-full overflow-hidden rounded-2xl">
            <Image
              src={post.cover_url}
              alt={post.title}
              fill
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-cover"
              priority
            />
          </div>
        )}

        {/* Content */}
        <article className="prose prose-invert prose-zinc max-w-none prose-headings:font-bold prose-a:text-violet-400 prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl">
          <div dangerouslySetInnerHTML={{ __html: post.content }} />
        </article>

        {/* Related posts */}
        {(related ?? []).length > 0 && (
          <section className="mt-16 border-t border-zinc-800/60 pt-10">
            <h2 className="mb-5 text-lg font-bold text-zinc-100">Mais artigos</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {(related ?? []).map((r: any) => (
                <Link
                  key={r.id}
                  href={`/blog/${r.slug}`}
                  className="group overflow-hidden rounded-xl border border-zinc-800/60 bg-zinc-900/40 hover:border-zinc-700 transition-colors"
                >
                  <div className="relative aspect-video overflow-hidden bg-zinc-800">
                    {r.cover_url ? (
                      <Image src={r.cover_url} alt={r.title} fill sizes="33vw" className="object-cover transition-transform duration-300 group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-3xl text-zinc-700">📝</div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="line-clamp-2 text-sm font-semibold text-zinc-200 group-hover:text-white">{r.title}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <div className="mt-10">
          <Link href="/blog" className="text-sm text-violet-400 hover:text-violet-300 transition-colors">
            ← Voltar ao blog
          </Link>
        </div>
      </div>
    </div>
  )
}
