import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata, ResolvingMetadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { PlanBadge } from '@/components/marketplace/PlanBadge'
import { ImageGallery } from '@/components/announcement/ImageGallery'
import { PurchasePanel } from '@/components/announcement/PurchasePanel'
import { AnnouncementTabsShell } from '@/components/announcement/AnnouncementTabsShell'
import type { AnnouncementItem } from '@/components/announcement/VariationSelector'

// ─── Types ───────────────────────────────────────────────────────────────────
type Props = {
  params: Promise<{ slug: string }>
}

// ─── Strip HTML tags (server-safe, no DOM needed) ─────────────────────────────
function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
}

// ─── generateMetadata ─────────────────────────────────────────────────────────
export async function generateMetadata(
  { params }: Props,
  _parent: ResolvingMetadata,
): Promise<Metadata> {
  const { slug } = await params
  const supabase  = await createClient()
  const { data }  = await supabase
    .from('announcements')
    .select('title, description, announcement_images(url, is_cover)')
    .eq('slug', slug)
    .eq('status', 'active')
    .single()

  if (!data) return { title: 'Anúncio não encontrado — KKmarket' }

  const baseUrl  = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://kkmarket.com.br'
  const excerpt  = stripHtml(data.description ?? '').slice(0, 155)
  const images   = (data.announcement_images ?? []) as { url: string; is_cover: boolean }[]
  const cover    = images.find((i) => i.is_cover) ?? images[0]
  const ogImages = cover ? [{ url: cover.url, width: 1200, height: 630, alt: data.title }] : []

  return {
    title:       `${data.title} — KKmarket`,
    description: excerpt,
    alternates:  { canonical: `${baseUrl}/anuncio/${slug}` },
    openGraph:   { title: data.title, description: excerpt, type: 'website', images: ogImages, siteName: 'KKmarket' },
    twitter:     { card: 'summary_large_image', title: data.title, description: excerpt, images: cover ? [cover.url] : [] },
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function isOnline(lastSeen: string | null): boolean {
  if (!lastSeen) return false
  return Date.now() - new Date(lastSeen).getTime() < 5 * 60 * 1000
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function AnnouncioPage({ params }: Props) {
  const { slug } = await params
  const supabase  = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  // ─── Announcement (sem joins aninhados de user_stats) ────────────────────
  const { data: ann } = await supabase
    .from('announcements')
    .select(`
      id, title, slug, description, model, plan,
      unit_price, stock_quantity, has_auto_delivery, is_vip,
      sale_count, view_count, status, category_id, user_id,
      created_at, updated_at,
      profiles!user_id ( id, username, display_name, avatar_url, last_seen_at ),
      announcement_images ( url, is_cover, sort_order ),
      announcement_items ( id, title, unit_price, stock_quantity, sort_order, status )
    `)
    .eq('slug', slug)
    .eq('status', 'active')
    .single()

  if (!ann) notFound()

  // ─── Seller stats (busca separada, evita join aninhado inválido) ─────────
  const { data: statsRaw } = await supabase
    .from('user_stats')
    .select('reviews_positive, reviews_neutral, reviews_negative, total_sales, avg_response_time_minutes')
    .eq('user_id', ann.user_id)
    .single()

  // ─── Verificações do vendedor ────────────────────────────────────────────
  const { data: validations } = await supabase
    .from('user_validations')
    .select('type, status')
    .eq('user_id', ann.user_id)

  // ─── Categoria breadcrumb ────────────────────────────────────────────────
  const { data: category } = await supabase
    .from('categories')
    .select('id, name, slug, parent_id')
    .eq('id', ann.category_id)
    .single()

  const { data: parentCategory } = category?.parent_id
    ? await supabase.from('categories').select('name, slug').eq('id', category.parent_id).single()
    : { data: null }

  // ─── Avaliações iniciais ─────────────────────────────────────────────────
  const { data: reviews } = await supabase
    .from('order_reviews')
    .select('id, reviewer_id, type, message, created_at, profiles!reviewer_id(username, display_name, avatar_url)')
    .eq('reviewed_id', ann.user_id)
    .order('created_at', { ascending: false })
    .limit(5)

  // ─── Perguntas/comentários iniciais ─────────────────────────────────────
  const { data: comments } = await supabase
    .from('announcement_comments')
    .select('id, user_id, parent_id, message, created_at, profiles!user_id(username, display_name, avatar_url)')
    .eq('announcement_id', ann.id)
    .eq('status', true)
    .order('created_at', { ascending: false })
    .limit(30)

  // ─── Dados derivados ─────────────────────────────────────────────────────
  const seller = ann.profiles as unknown as {
    id: string
    username: string
    display_name: string | null
    avatar_url: string | null
    last_seen_at: string | null
  } | null

  const stats       = statsRaw ?? null
  const online      = isOnline(seller?.last_seen_at ?? null)
  const sellerName  = seller?.display_name ?? seller?.username ?? '—'

  const totalReviews  = (stats?.reviews_positive ?? 0) + (stats?.reviews_neutral ?? 0) + (stats?.reviews_negative ?? 0)
  const positiveRatio = totalReviews > 0
    ? Math.round(((stats?.reviews_positive ?? 0) / totalReviews) * 100)
    : null

  const verifiedList = (validations ?? []).filter((v) => v.status === 'verified')
  const hasEmail     = verifiedList.some((v) => v.type === 'email')
  const hasPhone     = verifiedList.some((v) => v.type === 'phone')
  const hasIdentity  = verifiedList.some((v) => ['identity_front', 'identity_back'].includes(v.type))

  const images  = (ann.announcement_images ?? []) as { url: string; is_cover: boolean; sort_order: number }[]
  const items   = (ann.announcement_items  ?? []) as AnnouncementItem[]

  // Descrição: plain text do wizard — sem necessidade de sanitização HTML
  const description = ann.description ?? ''

  // Schema.org JSON-LD
  const siteUrl    = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://kkmarket.com.br'
  const inStock    = ann.model === 'normal'
    ? (ann.stock_quantity ?? 0) > 0
    : items.some((i) => (i.stock_quantity ?? 0) > 0)
  const ratingP     = stats?.reviews_positive ?? 0
  const ratingN     = stats?.reviews_neutral  ?? 0
  const ratingNg    = stats?.reviews_negative ?? 0
  const ratingTotal = ratingP + ratingN + ratingNg
  const ratingValue = ratingTotal > 0
    ? ((ratingP * 5 + ratingN * 3 + ratingNg * 1) / ratingTotal).toFixed(1)
    : null

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type':    'Product',
    name:       ann.title,
    description: stripHtml(description).slice(0, 5000),
    image:      images.map((i) => i.url),
    url:        `${siteUrl}/anuncio/${ann.slug}`,
    offers: {
      '@type':       'Offer',
      priceCurrency: 'BRL',
      ...(ann.model === 'normal' && ann.unit_price != null ? { price: ann.unit_price } : {}),
      availability:  inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Person',
        name:    sellerName,
        url:     `${siteUrl}/perfil/${seller?.username ?? ''}`,
      },
    },
    ...(ratingValue && ratingTotal > 0 ? {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue,
        ratingCount: ratingTotal,
        bestRating: 5,
        worstRating: 1,
      },
    } : {}),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen text-[var(--gm-ink)]">
        <div className="container mx-auto px-4 py-8">

          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-sm text-[var(--gm-ink-faint)]">
            <Link href="/" className="hover:text-[var(--gm-ink)] transition-colors">Home</Link>
            {parentCategory && (
              <>
                <span>/</span>
                <Link href={`/categoria/${parentCategory.slug}`} className="hover:text-[var(--gm-ink)] transition-colors capitalize">
                  {parentCategory.name}
                </Link>
              </>
            )}
            {category && (
              <>
                <span>/</span>
                <Link href={`/categoria/${parentCategory?.slug ?? 'categoria'}/${category.slug}`} className="hover:text-[var(--gm-ink)] transition-colors">
                  {category.name}
                </Link>
              </>
            )}
            <span>/</span>
            <span className="truncate max-w-[200px] text-[var(--gm-ink-dim)]">{ann.title}</span>
          </nav>

          <div className="flex flex-col gap-8 lg:flex-row lg:items-start">

            {/* ESQUERDA: galeria + tabs */}
            <div className="min-w-0 flex-1 flex flex-col gap-8">
              <ImageGallery images={images} />
              <AnnouncementTabsShell
                description={description}
                sellerId={ann.user_id}
                announcementId={ann.id}
                isAuthenticated={!!user}
                currentUserId={user?.id ?? null}
                reviewsPositive={stats?.reviews_positive ?? 0}
                reviewsNeutral={stats?.reviews_neutral ?? 0}
                reviewsNegative={stats?.reviews_negative ?? 0}
                initialReviews={(reviews ?? []) as unknown as Parameters<typeof AnnouncementTabsShell>[0]['initialReviews']}
                initialComments={(comments ?? []) as unknown as Parameters<typeof AnnouncementTabsShell>[0]['initialComments']}
              />
            </div>

            {/* DIREITA: info + compra */}
            <aside className="flex w-full flex-col gap-5 lg:w-[360px] lg:shrink-0">

              {/* Título + plano + stats */}
              <div className="rounded-xl border border-[var(--gm-ink-faint)]/30 bg-[var(--gm-paper-2)] p-4 flex flex-col gap-3">
                <div className="flex items-start gap-2">
                  <h1 className="flex-1 text-xl font-black leading-snug text-[var(--gm-ink)] sm:text-2xl">{ann.title}</h1>
                  <PlanBadge plan={ann.plan} />
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--gm-ink-faint)]">
                  {ann.has_auto_delivery && (
                    <span className="rank-chip green text-[10px]">⚡ auto</span>
                  )}
                  {(ann.sale_count ?? 0) > 10 && (
                    <span className="rank-chip gold text-[10px]">🔥 hot</span>
                  )}
                  <span>{ann.view_count ?? 0} views</span>
                  <span>·</span>
                  <span>{ann.sale_count ?? 0} vendas</span>
                </div>
              </div>

              {/* Painel de compra */}
              <div id="purchase-panel-container" className="rounded-xl border border-[var(--gm-violet)]/20 bg-[var(--gm-paper-2)] p-4">
                <PurchasePanel
                  announcementId={ann.id}
                  announcementSlug={ann.slug}
                  title={ann.title}
                  coverImageUrl={images.find((i) => i.is_cover)?.url ?? images[0]?.url ?? null}
                  model={ann.model as 'normal' | 'dynamic'}
                  normalPrice={ann.unit_price}
                  normalStock={ann.stock_quantity}
                  hasAutoDelivery={ann.has_auto_delivery}
                  items={items}
                  isAuthenticated={!!user}
                />
              </div>

              {/* Card do vendedor */}
              <div className="rounded-xl border border-[var(--gm-ink-faint)]/30 bg-[var(--gm-paper-2)] p-4 flex flex-col gap-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--gm-ink-faint)]">Vendedor</p>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    {seller?.avatar_url ? (
                      <Image src={seller.avatar_url} alt={sellerName} width={48} height={48} sizes="48px" className="h-12 w-12 rounded-full object-cover ring-2 ring-[var(--gm-violet)]/30" />
                    ) : (
                      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--gm-violet)]/20 text-lg font-black text-[var(--gm-violet)] uppercase ring-2 ring-[var(--gm-violet)]/30">
                        {sellerName[0]}
                      </span>
                    )}
                    {online && <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[var(--gm-paper-2)] bg-[var(--gm-green)]" />}
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <Link href={`/perfil/${seller?.username ?? ''}`} className="text-sm font-black text-[var(--gm-ink)] hover:text-[var(--gm-violet)] transition-colors">
                      {sellerName}
                    </Link>
                    <span className="text-xs text-[var(--gm-ink-faint)]">@{seller?.username}</span>
                  </div>
                  <span className={`shrink-0 rounded-lg px-2.5 py-1 text-[10px] font-bold ${online ? 'bg-[var(--gm-green)]/15 text-[var(--gm-green)]' : 'bg-[var(--gm-ink-faint)]/10 text-[var(--gm-ink-faint)]'}`}>
                    {online ? '● Online' : '○ Offline'}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  <VerBadge ok={hasEmail}    label="E-mail"     emoji="✉️" />
                  <VerBadge ok={hasPhone}    label="Telefone"   emoji="📱" />
                  <VerBadge ok={hasIdentity} label="Documentos" emoji="🪪" />
                </div>

                {positiveRatio !== null && (
                  <div className="flex items-center gap-2 rounded-lg border border-[var(--gm-amber)]/20 bg-[var(--gm-amber)]/5 px-3 py-2">
                    <span className="text-base">⭐</span>
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-[var(--gm-amber)]">{positiveRatio}% positivas</span>
                      <span className="text-[10px] text-[var(--gm-ink-faint)]">{totalReviews} avaliações · {stats?.total_sales ?? 0} vendas</span>
                    </div>
                  </div>
                )}

                <Link
                  href={`/perfil/${seller?.username ?? ''}`}
                  className="flex items-center justify-center gap-2 rounded-lg border border-[var(--gm-ink-faint)]/40 px-4 py-2 text-xs font-bold text-[var(--gm-ink-dim)] hover:border-[var(--gm-violet)]/50 hover:text-[var(--gm-ink)] transition-all"
                >
                  ver perfil →
                </Link>
              </div>

              <div className="rounded-lg border border-[var(--gm-ink-faint)]/20 bg-[var(--gm-paper-3)] px-4 py-3 text-[10px] text-[var(--gm-ink-faint)] text-center">
                🔒 Pagamento seguro via Mercado Pago · Escrow até confirmação · Suporte 24h
              </div>
            </aside>
          </div>
        </div>
      </div>
    </>
  )
}

// ─── Badge de verificação ─────────────────────────────────────────────────────
function VerBadge({ ok, label, emoji }: { ok: boolean; label: string; emoji: string }) {
  return (
    <span className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[10px] font-bold ${
      ok ? 'border-[var(--gm-green)]/30 bg-[var(--gm-green)]/10 text-[var(--gm-green)]' : 'border-[var(--gm-ink-faint)]/30 bg-[var(--gm-paper-3)] text-[var(--gm-ink-faint)]'
    }`}>
      {emoji} <span>{label}</span> <span>{ok ? '✓' : '–'}</span>
    </span>
  )
}
