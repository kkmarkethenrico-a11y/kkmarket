import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { AnnouncementCard } from '@/components/marketplace/AnnouncementCard'
import type { AnnouncementWithRelations, Category } from '@/types'

const PLAN_ORDER: Record<string, number> = { diamond: 3, gold: 2, silver: 1 }
function planWeight(p: string) { return PLAN_ORDER[p] ?? 0 }

// Fallback images from Unsplash for top-level categories (when image_url is null in DB)
const CATEGORY_COVERS: Record<string, string> = {
  'jogos':          'https://images.unsplash.com/photo-1593118247619-e2d6f056869e?w=224&h=288&fit=crop&q=80',
  'redes-sociais':  'https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?w=224&h=288&fit=crop&q=80',
  'bots':           'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=224&h=288&fit=crop&q=80',
  'scripts':        'https://images.unsplash.com/photo-1555066931-bf19f8fd1085?w=224&h=288&fit=crop&q=80',
  'outros-digitais':'https://images.unsplash.com/photo-1518770660439-4636190af475?w=224&h=288&fit=crop&q=80',
}

// Popular games with cover images for the category slider
const GAME_COVERS = [
  { name: 'Free Fire',          slug: 'free-fire',          img: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co49wj.webp' },
  { name: 'Valorant',           slug: 'valorant',           img: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co2mvt.webp' },
  { name: 'Fortnite',           slug: 'fortnite',           img: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co6cl0.webp' },
  { name: 'Minecraft',          slug: 'minecraft',          img: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co49x5.webp' },
  { name: 'Roblox',             slug: 'roblox',             img: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co3o15.webp' },
  { name: 'League of Legends',  slug: 'league-of-legends',  img: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co49wk.webp' },
  { name: 'CS2',                slug: 'cs2',                img: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co7ef3.webp' },
  { name: 'Genshin Impact',     slug: 'genshin-impact',     img: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co4lwn.webp' },
]

async function getData() {
  const supabase = await createClient()

  const announcementSelect = `
    id, user_id, category_id, title, slug, description,
    model, plan, unit_price, stock_quantity,
    has_auto_delivery, is_vip, sale_count, view_count,
    status, created_at, updated_at,
    filters_data, rejection_reason, approved_at, approved_by,
    profiles!user_id(username, display_name, avatar_url, last_seen_at),
    announcement_images(url, is_cover, sort_order)
  `

  // Featured (diamond plan, sorted by sale_count)
  const { data: featuredRaw } = await supabase
    .from('announcements')
    .select(announcementSelect)
    .eq('status', 'active')
    .eq('plan', 'diamond')
    .order('sale_count', { ascending: false })
    .limit(6)

  // Most popular (all plans, sorted by sale_count)
  const { data: popularRaw } = await supabase
    .from('announcements')
    .select(announcementSelect)
    .eq('status', 'active')
    .order('plan', { ascending: false })
    .order('sale_count', { ascending: false })
    .limit(12)

  // Newest
  const { data: newestRaw } = await supabase
    .from('announcements')
    .select(announcementSelect)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(12)

  // Collect unique seller user_ids and fetch their stats in one query
  const allRaw = [...(featuredRaw ?? []), ...(popularRaw ?? []), ...(newestRaw ?? [])]
  const sellerIds = [...new Set(allRaw.map((a) => a.user_id))]
  const { data: statsData } = sellerIds.length
    ? await supabase
        .from('user_stats')
        .select('user_id, avg_response_time_minutes, reviews_positive, reviews_neutral, reviews_negative')
        .in('user_id', sellerIds)
    : { data: [] as { user_id: string; avg_response_time_minutes: number | null; reviews_positive: number; reviews_neutral: number; reviews_negative: number }[] }

  const statsMap = new Map((statsData ?? []).map((s) => [s.user_id, s]))

  function mergeStats(raw: typeof allRaw) {
    return raw.map((ann) => ({
      ...ann,
      user_stats: statsMap.get(ann.user_id) ?? null,
    }))
  }

  // Recent reviews — using actual schema columns
  const { data: reviews } = await supabase
    .from('order_reviews')
    .select('id, type, message, created_at, profiles!reviewer_id(username)')
    .eq('type', 'positive')
    .order('created_at', { ascending: false })
    .limit(8)

  // Blog posts
  const { data: posts } = await supabase
    .from('blog_posts')
    .select('id, title, slug, cover_url, created_at')
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(4)

  // Top-level categories
  const { data: cats } = await supabase
    .from('categories')
    .select('id, name, slug, image_url, icon')
    .is('parent_id', null)
    .eq('status', true)
    .order('sort_order', { ascending: true })
    .limit(8)

  return {
    featured: mergeStats(featuredRaw ?? []) as unknown as AnnouncementWithRelations[],
    popular: mergeStats(popularRaw ?? []).sort(
      (a, b) => planWeight((b as any).plan) - planWeight((a as any).plan)
    ) as unknown as AnnouncementWithRelations[],
    newest: mergeStats(newestRaw ?? []) as unknown as AnnouncementWithRelations[],
    reviews: reviews ?? [],
    posts: posts ?? [],
    categories: (cats ?? []) as Category[],
  }
}

export default async function HomePage() {
  const { featured, popular, newest, reviews, posts, categories } = await getData()

  return (
    <div className="min-h-screen bg-zinc-950 text-white">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-zinc-800/40 py-20">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-violet-600/10 blur-3xl" />
        </div>
        <div className="container mx-auto px-4 text-center">
          <p className="mb-3 text-sm font-medium uppercase tracking-widest text-violet-400">
            O marketplace de jogos digitais
          </p>
          <h1 className="mb-4 text-5xl font-black leading-tight tracking-tight md:text-6xl">
            comprar e vender
          </h1>
          <p className="mb-8 text-lg text-zinc-400">
            contas, jogos, gift cards, gold, itens digitais e mais!
          </p>
          <Link
            href="/como-funciona"
            className="inline-flex items-center gap-2 rounded-full bg-violet-600 px-8 py-3 text-sm font-bold uppercase tracking-wider text-white transition hover:bg-violet-500 active:scale-[0.97]"
          >
            Como funciona?
          </Link>
        </div>
      </section>

      {/* ── Category slider ──────────────────────────────────────────────── */}
      <section className="border-b border-zinc-800/40 py-10">
        <div className="container mx-auto px-4">
          <h2 className="mb-6 text-xl font-bold text-zinc-100">Categorias Populares</h2>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {(categories.length > 0
              ? categories.map((cat) => ({
                  name: cat.name,
                  slug: cat.slug,
                  img: cat.image_url ?? CATEGORY_COVERS[cat.slug] ?? null,
                  href: `/categoria/${cat.slug}`,
                }))
              : GAME_COVERS.map((g) => ({
                  name: g.name,
                  slug: g.slug,
                  img: g.img,
                  href: `/categoria/jogos/${g.slug}`,
                }))
            ).map((item) => (
              <Link
                key={item.slug}
                href={item.href}
                className="group relative h-36 w-28 shrink-0 overflow-hidden rounded-xl border border-zinc-800"
              >
                {item.img ? (
                  <Image
                    src={item.img}
                    alt={item.name}
                    fill
                    sizes="112px"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-zinc-800 text-3xl">🎮</div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                  <p className="text-center text-[11px] font-semibold leading-tight text-white">{item.name}</p>
                </div>
              </Link>
            ))}

            {/* Ver todas */}
            <Link
              href="/categorias"
              className="flex h-36 w-28 shrink-0 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-700 text-zinc-400 hover:border-violet-500 hover:text-violet-400 transition-colors"
            >
              <span className="text-2xl">＋</span>
              <span className="text-[11px] font-medium">Ver todas</span>
            </Link>
          </div>

          <div className="mt-6 flex justify-center">
            <Link
              href="/categorias"
              className="rounded-full border border-zinc-700 px-6 py-2 text-xs font-bold uppercase tracking-wider text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 transition-colors"
            >
              Ver todas categorias
            </Link>
          </div>
        </div>
      </section>

      {/* ── Em destaque ─────────────────────────────────────────────────── */}
      {featured.length > 0 && (
        <section className="border-b border-zinc-800/40 py-12">
          <div className="container mx-auto px-4">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-zinc-100">Em destaque</h2>
              <Link href="/buscar?order=best_sellers" className="text-sm text-violet-400 hover:text-violet-300 transition-colors">
                Ver mais →
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {featured.map((ann) => (
                <AnnouncementCard key={ann.id} ann={ann} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Mais populares ─────────────────────────────────────────────── */}
      {popular.length > 0 && (
        <section className="border-b border-zinc-800/40 py-12">
          <div className="container mx-auto px-4">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-zinc-100">Mais populares</h2>
              <Link href="/buscar?order=best_sellers" className="text-sm text-violet-400 hover:text-violet-300 transition-colors">
                Ver mais →
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {popular.map((ann) => (
                <AnnouncementCard key={ann.id} ann={ann} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Avaliações recentes ─────────────────────────────────────────── */}
      {reviews.length > 0 && (
        <section className="border-b border-zinc-800/40 py-12">
          <div className="container mx-auto px-4">
            <h2 className="mb-6 text-xl font-bold text-zinc-100">Avaliações recentes</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {reviews.map((r: any) => (
                <div key={r.id} className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-4 flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-sm text-green-400 font-medium">
                    <span>👍</span>
                    <span className="truncate">{r.comment} — <strong className="text-zinc-200">{r.buyer?.username}</strong></span>
                  </div>
                  {r.announcement && (
                    <Link
                      href={`/anuncio/${r.announcement.slug}`}
                      className="text-xs text-violet-400 hover:text-violet-300 line-clamp-2 font-medium uppercase"
                    >
                      {r.announcement.title}
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Blog posts ─────────────────────────────────────────────────── */}
      {posts.length > 0 && (
        <section className="border-b border-zinc-800/40 py-12">
          <div className="container mx-auto px-4">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-zinc-100">Últimos posts no blog</h2>
              <Link href="/blog" className="text-sm text-violet-400 hover:text-violet-300 transition-colors">
                Ver mais artigos →
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {posts.map((p: any) => (
                <Link
                  key={p.id}
                  href={`/blog/${p.slug}`}
                  className="group overflow-hidden rounded-2xl border border-zinc-800/60 bg-zinc-900/40 hover:border-zinc-700 transition-colors"
                >
                  <div className="relative aspect-video overflow-hidden bg-zinc-800">
                    {p.cover_url ? (
                      <Image
                        src={p.cover_url}
                        alt={p.title}
                        fill
                        sizes="(max-width: 640px) 100vw, 25vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-4xl text-zinc-700">📝</div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="line-clamp-2 text-sm font-semibold text-zinc-200 group-hover:text-white">{p.title}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Outros anúncios (newest) ─────────────────────────────────────── */}
      {newest.length > 0 && (
        <section className="border-b border-zinc-800/40 py-12">
          <div className="container mx-auto px-4">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-zinc-100">Outros anúncios</h2>
              <Link href="/buscar?order=newest" className="text-sm text-violet-400 hover:text-violet-300 transition-colors">
                Ver mais →
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {newest.map((ann) => (
                <AnnouncementCard key={ann.id} ann={ann} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Trust badges ────────────────────────────────────────────────── */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[
              { icon: '🔒', title: 'Compra segura', desc: 'Entrega garantida ou o seu dinheiro de volta.' },
              { icon: '💬', title: 'Suporte 24 horas', desc: 'Equipe pronta para te atender sempre que precisar.' },
              { icon: '🎁', title: 'Programa de recompensa', desc: 'Seja recompensado pelas suas compras e vendas.' },
            ].map((b) => (
              <div key={b.title} className="rounded-2xl border border-zinc-800/60 bg-zinc-900/30 p-6 text-center">
                <div className="mb-3 text-3xl">{b.icon}</div>
                <h3 className="mb-1 text-sm font-bold text-zinc-200">{b.title}</h3>
                <p className="text-xs text-zinc-500">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
