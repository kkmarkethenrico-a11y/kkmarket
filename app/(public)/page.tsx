import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { AnnouncementCard } from '@/components/marketplace/AnnouncementCard'
import type { AnnouncementWithRelations, Category } from '@/types'
import { Gamepad2, Share2, Bot, Code, Box, Flame, Crosshair, Sparkles, Pickaxe, Blocks, Sword, Target, Trophy, Star, ShieldCheck, HeadphonesIcon, Gift, ThumbsUp, BookOpen, Newspaper } from 'lucide-react'

const PLAN_ORDER: Record<string, number> = { diamond: 3, gold: 2, silver: 1 }
function planWeight(p: string) { return PLAN_ORDER[p] ?? 0 }

const CATEGORY_COVERS: Record<string, string> = {
  'jogos':          'https://images.unsplash.com/photo-1593118247619-e2d6f056869e?w=224&h=288&fit=crop&q=80',
  'redes-sociais':  'https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?w=224&h=288&fit=crop&q=80',
  'bots':           'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=224&h=288&fit=crop&q=80',
  'scripts':        'https://images.unsplash.com/photo-1555066931-bf19f8fd1085?w=224&h=288&fit=crop&q=80',
  'outros-digitais':'https://images.unsplash.com/photo-1518770660439-4636190af475?w=224&h=288&fit=crop&q=80',
}

const GAME_COVERS = [
  { name: 'Free Fire',         slug: 'free-fire',         img: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co49wj.webp' },
  { name: 'Valorant',          slug: 'valorant',          img: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co2mvt.webp' },
  { name: 'Fortnite',          slug: 'fortnite',          img: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co6cl0.webp' },
  { name: 'Minecraft',         slug: 'minecraft',         img: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co49x5.webp' },
  { name: 'Roblox',            slug: 'roblox',            img: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co3o15.webp' },
  { name: 'League of Legends', slug: 'league-of-legends', img: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co49wk.webp' },
  { name: 'CS2',               slug: 'cs2',               img: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co7ef3.webp' },
  { name: 'Genshin Impact',    slug: 'genshin-impact',    img: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co4lwn.webp' },
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

  const [featuredRes, popularRes, newestRes, reviewsRes, postsRes, catsRes, sellersRes] = await Promise.all([
    supabase.from('announcements').select(announcementSelect)
      .eq('status', 'active').eq('plan', 'diamond')
      .order('sale_count', { ascending: false }).limit(6),
    supabase.from('announcements').select(announcementSelect)
      .eq('status', 'active')
      .order('plan', { ascending: false })
      .order('sale_count', { ascending: false }).limit(12),
    supabase.from('announcements').select(announcementSelect)
      .eq('status', 'active').order('created_at', { ascending: false }).limit(12),
    supabase.from('order_reviews').select('id, type, message, created_at, profiles!reviewer_id(username)')
      .eq('type', 'positive').order('created_at', { ascending: false }).limit(6),
    supabase.from('blog_posts').select('id, title, slug, cover_url, created_at')
      .eq('is_published', true).order('created_at', { ascending: false }).limit(4),
    supabase.from('categories').select('id, name, slug, image_url, icon')
      .is('parent_id', null).eq('status', true)
      .order('sort_order', { ascending: true }).limit(8),
    supabase.from('profiles').select('id, username, display_name, avatar_url')
      .eq('status', 'active')
      .order('last_seen_at', { ascending: false })
      .limit(8),
  ])

  const allRaw = [...(featuredRes.data ?? []), ...(popularRes.data ?? []), ...(newestRes.data ?? [])]
  const sellerIds = [...new Set(allRaw.map((a) => a.user_id))]
  const { data: statsData } = sellerIds.length
    ? await supabase
        .from('user_stats')
        .select('user_id, avg_response_time_minutes, reviews_positive, reviews_neutral, reviews_negative')
        .in('user_id', sellerIds)
    : { data: [] as { user_id: string; avg_response_time_minutes: number | null; reviews_positive: number; reviews_neutral: number; reviews_negative: number }[] }

  const statsMap = new Map((statsData ?? []).map((s) => [s.user_id, s]))
  function mergeStats(raw: typeof allRaw) {
    return raw.map((ann) => ({ ...ann, user_stats: statsMap.get(ann.user_id) ?? null }))
  }

  return {
    featured: mergeStats(featuredRes.data ?? []) as unknown as AnnouncementWithRelations[],
    popular: mergeStats(popularRes.data ?? []).sort(
      (a, b) => planWeight((b as any).plan) - planWeight((a as any).plan)
    ) as unknown as AnnouncementWithRelations[],
    newest: mergeStats(newestRes.data ?? []) as unknown as AnnouncementWithRelations[],
    reviews: reviewsRes.data ?? [],
    posts: postsRes.data ?? [],
    categories: (catsRes.data ?? []) as Category[],
    sellers: (sellersRes.data ?? []) as { id: string; username: string; display_name: string | null; avatar_url: string | null }[],
  }
}

// ── Section heading component ──────────────────────────────────────────────
function SectionHead({ title, href, hrefLabel = 'ver mais →' }: { title: React.ReactNode; href?: string; hrefLabel?: string }) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <h2 className="text-lg font-black tracking-tight text-[var(--gm-ink)] uppercase">
        {title}
      </h2>
      {href && (
        <Link href={href} className="text-xs font-semibold text-[var(--gm-violet)] hover:text-[var(--gm-cyan)] transition-colors uppercase tracking-wide">
          {hrefLabel}
        </Link>
      )}
    </div>
  )
}

export default async function HomePage() {
  const { featured, popular, newest, reviews, posts, categories, sellers } = await getData()

  const categoryItems = categories.length > 0
    ? categories.map((cat) => ({ name: cat.name, slug: cat.slug, img: cat.image_url ?? CATEGORY_COVERS[cat.slug] ?? null, href: `/categoria/${cat.slug}` }))
    : GAME_COVERS.map((g) => ({ name: g.name, slug: g.slug, img: g.img, href: `/categoria/jogos/${g.slug}` }))

  return (
    <div className="min-h-screen text-[var(--gm-ink)]">

      {/* ── Stories row ───────────────────────────────────────────────────── */}
      {sellers.length > 0 && (
        <section className="border-b border-[var(--gm-ink-faint)]/20 py-4">
          <div className="container mx-auto px-4">
            <div className="flex gap-4 overflow-x-auto pb-1 scrollbar-hide">
              {/* "seu drop" placeholder */}
              <Link href="/meus-anuncios/novo" className="flex flex-col items-center gap-1.5 shrink-0">
                <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-[var(--gm-violet)]/50 bg-[var(--gm-violet)]/5 text-xl text-[var(--gm-violet)] hover:border-[var(--gm-violet)] transition-colors">
                  +
                </div>
                <span className="text-[9px] font-bold text-[var(--gm-violet)] uppercase tracking-wide">seu drop</span>
              </Link>
              {sellers.map((s) => {
                const name = s.display_name ?? s.username
                const initials = name.slice(0, 2).toUpperCase()
                return (
                  <Link key={s.id} href={`/perfil/${s.username}`} className="flex flex-col items-center gap-1.5 shrink-0 group">
                    <div className="relative">
                      {s.avatar_url ? (
                        <Image
                          src={s.avatar_url}
                          alt={name}
                          width={56}
                          height={56}
                          className="h-14 w-14 rounded-full object-cover ring-2 ring-[var(--gm-violet)]/40 group-hover:ring-[var(--gm-violet)] transition-all"
                        />
                      ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--gm-violet)]/15 text-sm font-black text-[var(--gm-violet)] ring-2 ring-[var(--gm-violet)]/40 group-hover:ring-[var(--gm-violet)] transition-all uppercase">
                          {initials}
                        </div>
                      )}
                    </div>
                    <span className="text-[9px] font-bold text-[var(--gm-ink-dim)] max-w-[56px] truncate text-center group-hover:text-[var(--gm-ink)] transition-colors">
                      {s.username}
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-[var(--gm-ink-faint)]/30 py-20">
        {/* Background glow */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 left-1/2 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-[var(--gm-violet)]/8 blur-3xl" />
          <div className="absolute top-10 right-1/4 h-64 w-64 rounded-full bg-[var(--gm-cyan)]/5 blur-3xl" />
        </div>

        <div className="container mx-auto px-4 text-center relative">
          <div className="inline-flex items-center gap-2 rank-chip mb-6">
            ◆ O MARKETPLACE DE JOGOS DIGITAIS
          </div>
          <h1 className="mb-4 text-5xl font-black leading-tight tracking-tight md:text-6xl text-[var(--gm-ink)]">
            comprar e{' '}
            <span className="text-[var(--gm-violet)]" style={{ textShadow: '0 0 30px rgba(255, 157, 0, 0.4)' }}>
              vender
            </span>
          </h1>
          <p className="mb-8 text-base text-[var(--gm-ink-dim)] max-w-md mx-auto">
            contas · jogos · gift cards · gold · itens digitais e mais
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link
              href="/como-funciona"
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--gm-violet)] px-7 py-3 text-sm font-bold text-[#1a1126] transition-all hover:opacity-90 active:scale-95 gm-glow"
            >
              COMO FUNCIONA?
            </Link>
            <Link
              href="/buscar"
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--gm-ink-faint)]/60 px-7 py-3 text-sm font-bold text-[var(--gm-ink-dim)] hover:border-[var(--gm-violet)]/50 hover:text-[var(--gm-ink)] transition-all"
            >
              explorar →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Quests / Missões HUD ──────────────────────────────────────────── */}
      <section className="border-b border-[var(--gm-ink-faint)]/30 py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {/* Missão diária */}
            <div className="rounded-xl border border-[var(--gm-violet)]/30 bg-[var(--gm-violet)]/5 p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wide text-[var(--gm-violet)] flex items-center justify-center gap-1"><Target className="h-4 w-4" /> Missão Diária</span>
                <span className="rank-chip text-[9px]">+25 pts</span>
              </div>
              <p className="text-sm font-semibold text-[var(--gm-ink)]">Explore o marketplace hoje</p>
              <div className="xp-bar">
                <div className="xp-bar-fill" style={{ width: '0%' }} />
              </div>
            </div>

            {/* Desafio */}
            <div className="rounded-xl border border-[var(--gm-amber)]/30 bg-[var(--gm-amber)]/5 p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wide text-[var(--gm-amber)]">⚔ Desafio Semanal</span>
                <span className="rank-chip gold text-[9px]">+100 pts</span>
              </div>
              <p className="text-sm font-semibold text-[var(--gm-ink)]">Faça sua primeira compra</p>
              <div className="xp-bar">
                <div className="xp-bar-fill" style={{ width: '0%', background: 'var(--gm-amber)' }} />
              </div>
            </div>

            {/* Ranking */}
            <Link
              href="/ranking"
              className="rounded-xl border border-[var(--gm-ink-faint)]/40 bg-[var(--gm-paper-3)] p-4 flex flex-col items-center justify-center gap-2 hover:border-[var(--gm-violet)]/50 transition-colors"
            >
              <Trophy className="h-10 w-10 text-[var(--gm-violet)]" strokeWidth={1.5} />
              <span className="text-xs font-bold uppercase tracking-wide text-[var(--gm-ink-dim)]">Ver Ranking</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Categorias ────────────────────────────────────────────────────── */}
      <section className="border-b border-[var(--gm-ink-faint)]/30 py-10">
        <div className="container mx-auto px-4">
          <SectionHead title="Categorias Populares" href="/categorias" hrefLabel="ver todas →" />
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {categoryItems.map((item) => {
              // Select appropriate icon
              let Icon = Gamepad2
              if (item.slug === 'redes-sociais') Icon = Share2
              else if (item.slug === 'bots') Icon = Bot
              else if (item.slug === 'scripts') Icon = Code
              else if (item.slug === 'outros-digitais') Icon = Box
              else if (item.slug === 'free-fire') Icon = Flame
              else if (item.slug === 'valorant' || item.slug === 'cs2') Icon = Crosshair
              else if (item.slug === 'fortnite' || item.slug === 'genshin-impact') Icon = Sparkles
              else if (item.slug === 'minecraft') Icon = Pickaxe
              else if (item.slug === 'roblox') Icon = Blocks
              else if (item.slug === 'league-of-legends') Icon = Sword

              return (
                <Link
                  key={item.slug}
                  href={item.href}
                  className="group relative flex h-28 w-24 shrink-0 flex-col items-center justify-center gap-3 overflow-hidden rounded-xl border border-[var(--gm-ink-faint)]/20 bg-[var(--gm-paper-3)] hover:border-[var(--gm-violet)]/50 hover:bg-[var(--gm-violet)]/5 transition-all shadow-sm"
                >
                  <div className="text-[var(--gm-ink-dim)] group-hover:text-[var(--gm-violet)] transition-colors duration-300 transform group-hover:scale-110">
                    <Icon className="h-8 w-8" strokeWidth={1.5} />
                  </div>
                  <p className="text-center text-[10px] font-bold leading-tight text-[var(--gm-ink)] px-2">{item.name}</p>
                </Link>
              )
            })}

            <Link
              href="/categorias"
              className="flex h-32 w-24 shrink-0 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--gm-ink-faint)]/40 text-[var(--gm-ink-faint)] hover:border-[var(--gm-violet)]/50 hover:text-[var(--gm-violet)] transition-colors"
            >
              <span className="text-xl">＋</span>
              <span className="text-[10px] font-bold">Ver todas</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Em destaque ───────────────────────────────────────────────────── */}
      {featured.length > 0 && (
        <section className="border-b border-[var(--gm-ink-faint)]/30 py-12">
          <div className="container mx-auto px-4">
            <SectionHead title="◆ Em Destaque" href="/buscar?order=best_sellers" />
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {featured.map((ann) => (
                <AnnouncementCard key={ann.id} ann={ann} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Mais populares ────────────────────────────────────────────────── */}
      {popular.length > 0 && (
        <section className="border-b border-[var(--gm-ink-faint)]/30 py-12">
          <div className="container mx-auto px-4">
            <SectionHead title={<span className="flex items-center gap-2"><Flame className="h-5 w-5 text-[var(--gm-amber)]" /> Mais Populares</span>} href="/buscar?order=best_sellers" />
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {popular.map((ann) => (
                <AnnouncementCard key={ann.id} ann={ann} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Avaliações recentes ────────────────────────────────────────────── */}
      {reviews.length > 0 && (
        <section className="border-b border-[var(--gm-ink-faint)]/30 py-12">
          <div className="container mx-auto px-4">
            <SectionHead title={<span className="flex items-center gap-2"><Star className="h-5 w-5 text-[var(--gm-amber)]" /> Avaliações Recentes</span>} />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {reviews.map((r: any) => (
                <div key={r.id} className="rounded-xl border border-[var(--gm-ink-faint)]/30 bg-[var(--gm-paper-2)] p-4 flex flex-col gap-2 hover:border-[var(--gm-green)]/40 transition-colors">
                  <div className="flex items-center gap-2 text-xs font-bold text-[var(--gm-green)] uppercase tracking-wide">
                    <ThumbsUp className="h-4 w-4" />
                    <span className="truncate">
                      {r.comment} — <strong className="text-[var(--gm-ink)]">{r.profiles?.username}</strong>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Blog posts ──────────────────────────────────────────────────────── */}
      {posts.length > 0 && (
        <section className="border-b border-[var(--gm-ink-faint)]/30 py-12">
          <div className="container mx-auto px-4">
            <SectionHead title={<span className="flex items-center gap-2"><BookOpen className="h-5 w-5 text-[var(--gm-violet)]" /> Blog</span>} href="/blog" hrefLabel="ver artigos →" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {posts.map((p: any) => (
                <Link
                  key={p.id}
                  href={`/blog/${p.slug}`}
                  className="group overflow-hidden rounded-xl border border-[var(--gm-ink-faint)]/30 bg-[var(--gm-paper-2)] hover:border-[var(--gm-violet)]/50 transition-colors"
                >
                  <div className="relative aspect-video overflow-hidden bg-[var(--gm-paper-3)]">
                    {p.cover_url ? (
                      <Image
                        src={p.cover_url}
                        alt={p.title}
                        fill
                        sizes="(max-width: 640px) 100vw, 25vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[var(--gm-ink-faint)]">
                        <Newspaper className="h-10 w-10 opacity-50" />
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="line-clamp-2 text-sm font-semibold text-[var(--gm-ink)] group-hover:text-white transition-colors">{p.title}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Outros anúncios (newest) ─────────────────────────────────────────── */}
      {newest.length > 0 && (
        <section className="border-b border-[var(--gm-ink-faint)]/30 py-12">
          <div className="container mx-auto px-4">
            <SectionHead title={<span className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-[var(--gm-cyan)]" /> Recém Chegados</span>} href="/buscar?order=newest" />
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {newest.map((ann) => (
                <AnnouncementCard key={ann.id} ann={ann} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Trust badges ─────────────────────────────────────────────────────── */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[
              { icon: <ShieldCheck className="h-8 w-8" />, title: 'Compra segura',         desc: 'Entrega garantida ou o seu dinheiro de volta.',      color: 'var(--gm-green)' },
              { icon: <HeadphonesIcon className="h-8 w-8" />, title: 'Suporte 24 horas',       desc: 'Equipe pronta para te atender sempre que precisar.', color: 'var(--gm-cyan)'  },
              { icon: <Gift className="h-8 w-8" />, title: 'Programa de recompensa', desc: 'Seja recompensado pelas suas compras e vendas.',      color: 'var(--gm-violet)'},
            ].map((b) => (
              <div
                key={b.title}
                className="rounded-xl border border-[var(--gm-ink-faint)]/30 bg-[var(--gm-paper-2)] p-6 text-center hover:border-[var(--gm-violet)]/40 transition-colors"
              >
                <div className="mb-3 flex justify-center text-[var(--gm-ink)]">{b.icon}</div>
                <h3 className="mb-1 text-sm font-bold" style={{ color: b.color }}>{b.title}</h3>
                <p className="text-xs text-[var(--gm-ink-dim)]">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
