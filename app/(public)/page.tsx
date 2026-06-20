import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { AnnouncementCard } from '@/components/marketplace/AnnouncementCard'
import type { AnnouncementWithRelations, Category } from '@/types'
import { getDictionary } from '@/lib/i18n'
import { LayoutGrid, Gamepad2, Bot, Code, MonitorPlay, Users, Terminal, ArrowRight, Medal, Star, BadgeCheck } from 'lucide-react'

const PLAN_ORDER: Record<string, number> = { diamond: 3, gold: 2, silver: 1 }
function planWeight(p: string) { return PLAN_ORDER[p] ?? 0 }

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  'jogos': Gamepad2,
  'redes-sociais': Users,
  'bots': Bot,
  'scripts': Code,
  'outros-digitais': MonitorPlay,
}

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
      .order('sale_count', { ascending: false }).limit(4),
    supabase.from('announcements').select(announcementSelect)
      .eq('status', 'active')
      .order('plan', { ascending: false })
      .order('sale_count', { ascending: false }).limit(8),
    supabase.from('announcements').select(announcementSelect)
      .eq('status', 'active').order('created_at', { ascending: false }).limit(8),
    supabase.from('order_reviews').select('id, type, message, created_at, profiles!reviewer_id(username, avatar_url)')
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

export default async function HomePage() {
  const { featured, popular, newest, reviews, posts, categories, sellers } = await getData()
  const dict = await getDictionary()

  const categoryItems = categories.length > 0
    ? categories.map((cat) => ({ name: cat.name, slug: cat.slug, img: cat.image_url ?? CATEGORY_COVERS[cat.slug] ?? null, href: `/categoria/${cat.slug}` }))
    : GAME_COVERS.map((g) => ({ name: g.name, slug: g.slug, img: g.img, href: `/categoria/jogos/${g.slug}` }))

  return (
    <div className="min-h-screen font-body-md text-on-surface bg-background">
      <main className="max-w-[1440px] mx-auto px-margin md:px-margin px-4">
        
        {/* Cyber-Nexus Hero Section */}
        <section className="relative mt-8 rounded-xl overflow-hidden min-h-[500px] flex items-center border border-white/5 bg-surface-container-lowest">
          <div className="scanline"></div>
          {/* Background Elements */}
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-transparent z-10"></div>
            <div className="w-full h-full bg-cover bg-center opacity-40" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuA3c8skU9aYIn74YQc4q8Dds0-sDXJ-fUCcfQOzD1rRmLiKmfswSo51GD8qTQV7smjcHRUx8iHPu50UstJlEvU6l2i_CDwYEkkbB_0hnqH5UWioLLYmbrSPbn7AB6yBmderOeZbrmX-fUCI-ihqezZLmwqhc8ij2F8WVDDXV-Qew3ffn58qpG3hMUdYjcA4ufyiuHW3Q0SyNfF8NUwOSYJ7-YBIkQt-4XF7erpOSCR1y4_mYORa-DvbK9n1Rldx0UPsfwvla5uQOOmi')" }}></div>
          </div>
          {/* Hero Content */}
          <div className="relative z-20 w-full md:w-1/2 p-6 md:p-12 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary font-label-md text-label-md tracking-wider">
              <Terminal className="w-4 h-4" />
              {dict.hero.systemsOnline}
            </div>
            <h1 className="font-display-lg text-4xl md:text-display-lg text-white leading-tight">{dict.hero.title1} <span className="text-primary">{dict.hero.title2}</span></h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-lg">{dict.hero.subtitle}</p>
            <div className="flex flex-wrap gap-4 pt-4">
              <Link href="/buscar" className="px-8 py-4 bg-primary text-on-primary font-bold rounded-lg hover:shadow-[0_0_20px_rgba(76,215,246,0.6)] transition-all active:scale-95 flex items-center gap-2">
                {dict.hero.startTrading} <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/como-funciona" className="px-8 py-4 bg-transparent border border-secondary text-secondary font-bold rounded-lg hover:bg-secondary/10 transition-all active:scale-95">
                {dict.hero.viewMissions}
              </Link>
            </div>
          </div>
        </section>

        {/* Missions & Rewards Banner */}
        <section className="mt-8">
          <div className="bg-secondary-container text-on-secondary-container p-6 rounded-xl flex flex-col md:flex-row md:items-center justify-between shadow-lg gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-on-secondary-container text-secondary p-3 rounded-lg">
                <Medal className="w-6 h-6 fill-current" />
              </div>
              <div>
                <h3 className="font-headline-sm text-headline-sm leading-tight">{dict.missions.title}</h3>
                <p className="font-label-md text-label-md opacity-80">{dict.missions.desc}</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right hidden sm:block">
                <div className="font-label-sm text-label-sm uppercase tracking-widest opacity-60">{dict.missions.nextReward}</div>
                <div className="font-label-md text-label-md font-bold">1,500 KK-COINS</div>
              </div>
              <div className="hidden sm:block w-32 h-2 bg-on-secondary-container/20 rounded-full overflow-hidden">
                <div className="w-3/4 h-full bg-on-secondary-container"></div>
              </div>
              <button className="bg-on-secondary-container text-secondary-container px-6 py-2 rounded-lg font-bold hover:opacity-90 transition-opacity">{dict.missions.claim}</button>
            </div>
          </div>
        </section>

        {/* Main Marketplace Body */}
        <div className="mt-16 flex flex-col lg:flex-row gap-8">
          
          {/* Sidebar Navigation */}
          <aside className="hidden lg:flex flex-col gap-6 p-8 h-full w-64 rounded-xl bg-surface-container border-r border-white/5 shrink-0">
            <div className="mb-4">
              <h2 className="font-headline-sm text-headline-sm text-primary">{dict.sidebar.title}</h2>
              <p className="font-label-md text-label-md text-on-surface-variant">{dict.sidebar.subtitle}</p>
            </div>
            <div className="flex flex-col gap-2">
              <Link href="/buscar" className="flex items-center gap-3 p-3 text-primary bg-primary/10 rounded-lg font-bold cursor-pointer">
                <LayoutGrid className="w-5 h-5" />
                <span className="font-label-md text-label-md">{dict.sidebar.allProducts}</span>
              </Link>
              {categoryItems.map(item => {
                const Icon = CATEGORY_ICONS[item.slug] || Gamepad2
                return (
                  <Link key={item.slug} href={item.href} className="flex items-center gap-3 p-3 text-on-surface-variant hover:bg-surface-variant rounded-lg transition-colors cursor-pointer">
                    <Icon className="w-5 h-5" />
                    <span className="font-label-md text-label-md">{item.name}</span>
                  </Link>
                )
              })}
            </div>
            <Link href="/buscar" className="mt-8 text-center bg-primary text-on-primary font-bold py-3 rounded-lg hover:opacity-90 transition-opacity">{dict.sidebar.applyFilters}</Link>
          </aside>

          {/* Main Content Area */}
          <div className="flex-1 space-y-16">
            
            {/* Featured Section */}
            {featured.length > 0 && (
              <section>
                <div className="flex justify-between items-end mb-6">
                  <div>
                    <h2 className="font-headline-md text-headline-md text-white">{dict.sections.featured}</h2>
                    <p className="text-on-surface-variant font-body-md text-body-md">{dict.sections.featuredDesc}</p>
                  </div>
                  <Link className="text-primary hover:underline font-label-md text-label-md" href="/buscar?order=best_sellers">{dict.sections.viewAll}</Link>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                  {featured.map(ann => (
                    <AnnouncementCard key={ann.id} ann={ann} dict={dict} />
                  ))}
                </div>
              </section>
            )}

            {/* Most Popular Section */}
            {popular.length > 0 && (
              <section>
                <div className="flex justify-between items-end mb-6">
                  <div>
                    <h2 className="font-headline-md text-headline-md text-white">{dict.sections.popular}</h2>
                    <p className="text-on-surface-variant font-body-md text-body-md">{dict.sections.popularDesc}</p>
                  </div>
                  <Link className="text-primary hover:underline font-label-md text-label-md" href="/buscar?order=best_sellers">{dict.sections.viewAll}</Link>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                  {popular.map(ann => (
                    <AnnouncementCard key={ann.id} ann={ann} dict={dict} />
                  ))}
                </div>
              </section>
            )}

            {/* Recent Ratings Section */}
            {reviews.length > 0 && (
              <section>
                <div className="flex justify-between items-end mb-6">
                  <div>
                    <h2 className="font-headline-md text-headline-md text-white">{dict.sections.recentRatings}</h2>
                    <p className="text-on-surface-variant font-body-md text-body-md">{dict.sections.ratingsDesc}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {reviews.map((r: any) => {
                    const initials = (r.profiles?.username || 'U').charAt(0).toUpperCase()
                    return (
                      <div key={r.id} className="bg-surface-container-low p-6 rounded-xl border border-white/5 space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-surface-variant flex items-center justify-center font-bold text-primary">
                              {r.profiles?.avatar_url ? (
                                <Image src={r.profiles.avatar_url} alt="Avatar" width={40} height={40} className="rounded-full object-cover" />
                              ) : initials}
                            </div>
                            <div>
                              <div className="font-label-md text-label-md text-white">{r.profiles?.username}</div>
                              <div className="font-label-sm text-label-sm text-on-surface-variant">{dict.sections.recent}</div>
                            </div>
                          </div>
                          <div className="flex text-secondary">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className="w-4 h-4 fill-current" />
                            ))}
                          </div>
                        </div>
                        <p className="font-body-md text-on-surface-variant leading-relaxed italic">"{r.message}"</p>
                        <div className="pt-2 border-t border-white/5 flex items-center gap-2 text-label-sm text-[var(--gm-green)] opacity-90">
                          <BadgeCheck className="w-4 h-4" />
                          {dict.sections.verifiedPurchase}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {/* Blog Posts Section */}
            {posts.length > 0 && (
              <section>
                <div className="flex justify-between items-end mb-6">
                  <div>
                    <h2 className="font-headline-md text-headline-md text-white">Últimas do Blog</h2>
                    <p className="text-on-surface-variant font-body-md text-body-md">Fique por dentro das novidades, dicas e tutoriais</p>
                  </div>
                  <Link className="text-primary hover:underline font-label-md text-label-md" href="/blog">Ver todos</Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                  {posts.map((post: any) => (
                    <Link key={post.id} href={`/blog/${post.slug}`} className="group bg-surface-container-low rounded-xl border border-white/5 overflow-hidden hover:border-primary/30 transition-colors">
                      <div className="aspect-[16/9] w-full relative overflow-hidden bg-surface-variant">
                        {post.cover_url ? (
                          <Image src={post.cover_url} alt={post.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
                            <Terminal className="w-8 h-8 opacity-20" />
                          </div>
                        )}
                      </div>
                      <div className="p-5">
                        <div className="text-xs text-primary font-bold mb-2 uppercase tracking-wider">
                          {new Date(post.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                        <h3 className="font-headline-sm text-headline-sm text-white line-clamp-2 group-hover:text-primary transition-colors">
                          {post.title}
                        </h3>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
