import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata, ResolvingMetadata } from 'next'
import DOMPurify from 'isomorphic-dompurify'
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

  if (!data) return { title: 'Anúncio não encontrado — GameMarket' }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://kkmarket.com.br'
  const plain   = data.description.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
  const excerpt = plain.slice(0, 155)
  const images  = (data.announcement_images ?? []) as { url: string; is_cover: boolean }[]
  const cover   = images.find((i) => i.is_cover) ?? images[0]
  const ogImages = cover
    ? [{ url: cover.url, width: 1200, height: 630, alt: data.title }]
    : []

  return {
    title:       `${data.title} — GameMarket`,
    description: excerpt,
    alternates:  { canonical: `${baseUrl}/anuncio/${slug}` },
    openGraph: {
      title:       data.title,
      description: excerpt,
      type:        'website',
      images:      ogImages,
      siteName:    'GameMarket',
    },
    twitter: {
      card:        'summary_large_image',
      title:       data.title,
      description: excerpt,
      images:      cover ? [cover.url] : [],
    },
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

  // ─── Auth ────────────────────────────────────────────────────────────────
  const { data: { user } } = await supabase.auth.getUser()

  // ─── Announcement ───────────────────────────────────────────────────────
  const { data: ann } = await supabase
    .from('announcements')
    .select(`
      id, title, slug, description, model, plan,
      unit_price, stock_quantity, has_auto_delivery, is_vip,
      sale_count, view_count, status, category_id, user_id,
      created_at, updated_at, filters_data,
      rejection_reason, approved_at, approved_by,
      profiles!user_id (
        id, username, display_name, avatar_url, last_seen_at,
        user_validations ( type, status ),
        user_stats!user_id (
          reviews_positive, reviews_neutral, reviews_negative,
          total_sales, avg_response_time_minutes
        )
      ),
      announcement_images ( url, is_cover, sort_order ),
      announcement_items ( id, title, unit_price, stock_quantity, sort_order, status )
    `)
    .eq('slug', slug)
    .eq('status', 'active')
    .single()

  if (!ann) notFound()

  // ─── Category breadcrumb ─────────────────────────────────────────────────
  const { data: category } = await supabase
    .from('categories')
    .select('id, name, slug, parent_id')
    .eq('id', ann.category_id)
    .single()

  const { data: parentCategory } = category?.parent_id
    ? await supabase
        .from('categories')
        .select('name, slug')
        .eq('id', category.parent_id)
        .single()
    : { data: null }

  // ─── Initial reviews (first 5 for announcement page) ────────────────────────
  const { data: reviews } = await supabase
    .from('order_reviews')
    .select('id, reviewer_id, type, message, created_at, profiles!reviewer_id(username, display_name, avatar_url)')
    .eq('reviewed_id', ann.user_id)
    .order('created_at', { ascending: false })
    .limit(5)

  // ─── Initial comments (top-level + first replies) ────────────────────────
  const { data: comments } = await supabase
    .from('announcement_comments')
    .select('id, user_id, parent_id, message, created_at, profiles!user_id(username, display_name, avatar_url)')
    .eq('announcement_id', ann.id)
    .eq('status', true)
    .order('created_at', { ascending: false })
    .limit(30)

  // ─── Derived data ────────────────────────────────────────────────────────
  const seller     = ann.profiles as unknown as {
    id: string
    username: string
    display_name: string | null
    avatar_url: string | null
    last_seen_at: string | null
    user_validations: { type: string; status: string }[]
    user_stats: { reviews_positive: number; reviews_neutral: number; reviews_negative: number; total_sales: number } | null
  }

  const stats  = seller.user_stats
  const online = isOnline(seller.last_seen_at)
  const sellerName = seller.display_name ?? seller.username

  const totalReviews  = (stats?.reviews_positive ?? 0) + (stats?.reviews_neutral ?? 0) + (stats?.reviews_negative ?? 0)
  const positiveRatio = totalReviews > 0
    ? Math.round(((stats?.reviews_positive ?? 0) / totalReviews) * 100)
    : null

  const verifications = (seller.user_validations ?? []).filter((v) => v.status === 'verified')
  const hasEmail    = verifications.some((v) => v.type === 'email')
  const hasPhone    = verifications.some((v) => v.type === 'phone')
  const hasIdentity = verifications.some((v) => ['identity_front', 'identity_back'].includes(v.type))

  const images  = (ann.announcement_images ?? []) as { url: string; is_cover: boolean; sort_order: number }[]
  const items   = (ann.announcement_items  ?? []) as AnnouncementItem[]
  const coverUrl = images.find((i) => i.is_cover)?.url ?? images[0]?.url ?? null

  // Sanitize HTML description
  const safeDescription = DOMPurify.sanitize(ann.description ?? '', {
    ALLOWED_TAGS: ['b','i','em','strong','p','br','ul','ol','li','h2','h3','a','span'],
    ALLOWED_ATTR: ['href','target','rel'],
  })

  // Schema.org Product JSON-LD
  const siteUrl    = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://kkmarket.com.br'
  const inStock    = ann.model === 'normal'
    ? ann.stock_quantity > 0
    : items.some((i) => (i.stock_quantity ?? 0) > 0)
  const ratingP    = stats?.reviews_positive  ?? 0
  const ratingN    = stats?.reviews_neutral   ?? 0
  const ratingNg   = stats?.reviews_negative  ?? 0
  const ratingTotal = ratingP + ratingN + ratingNg
  const ratingValue = ratingTotal > 0
    ? ((ratingP * 5 + ratingN * 3 + ratingNg * 1) / ratingTotal).toFixed(1)
    : null

  const jsonLd: Record<string, unknown> = {
    '@context':  'https://schema.org',
    '@type':     'Product',
    name:        ann.title,
    description: ann.description.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().slice(0, 5000),
    image:       images.map((i) => i.url),
    url:         `${siteUrl}/anuncio/${ann.slug}`,
    offers: {
      '@type':        'Offer',
      priceCurrency:  'BRL',
      ...(ann.model === 'normal' && ann.unit_price != null ? { price: ann.unit_price } : {}),
      availability:   inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Person',
        name:    sellerName,
        url:     `${siteUrl}/perfil/${seller.username}`,
      },
    },
    ...(ratingValue && ratingTotal > 0 ? {
      aggregateRating: {
        '@type':      'AggregateRating',
        ratingValue,
        ratingCount:  ratingTotal,
        bestRating:   5,
        worstRating:  1,
      },
    } : {}),
  }

  return (
    <>
      {/* Schema.org JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen bg-zinc-950 text-white">
        <div className="container mx-auto px-4 py-8">

          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-sm text-zinc-500">
            <Link href="/" className="hover:text-zinc-300 transition-colors">Home</Link>
            {parentCategory && (
              <>
                <span>/</span>
                <Link
                  href={`/categoria/${parentCategory.slug}`}
                  className="hover:text-zinc-300 transition-colors capitalize"
                >
                  {parentCategory.name}
                </Link>
              </>
            )}
            {category && (
              <>
                <span>/</span>
                <Link
                  href={`/categoria/${parentCategory?.slug ?? 'categoria'}/${category.slug}`}
                  className="hover:text-zinc-300 transition-colors"
                >
                  {category.name}
                </Link>
              </>
            )}
            <span>/</span>
            <span className="truncate max-w-[200px] text-zinc-300">{ann.title}</span>
          </nav>

          {/* ── Main 2-column layout ────────────────────────────────────── */}
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start">

            {/* LEFT: gallery + tabs */}
            <div className="min-w-0 flex-1 flex flex-col gap-8">

              {/* Gallery */}
              <ImageGallery images={images} />

              {/* Tabs (description / reviews / questions) */}
              <AnnouncementTabsShell
                description={safeDescription}
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

            {/* RIGHT: info + buy panel */}
            <aside className="flex w-full flex-col gap-6 lg:w-[360px] lg:shrink-0">

              {/* Title + plan */}
              <div className="flex flex-col gap-2">
                <div className="flex items-start gap-2">
                  <h1 className="flex-1 text-xl font-bold leading-snug text-white sm:text-2xl">
                    {ann.title}
                  </h1>
                  <PlanBadge plan={ann.plan} />
                </div>
                <div className="flex items-center gap-3 text-xs text-zinc-600">
                  <span>{ann.view_count} visualizações</span>
                  <span>·</span>
                  <span>{ann.sale_count} vendas</span>
                </div>
              </div>

              {/* Seller card */}
              <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-4 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    {seller.avatar_url ? (
                      <Image
                        src={seller.avatar_url}
                        alt={sellerName}
                        width={48}
                        height={48}
                        sizes="48px"
                        loading="lazy"
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-700 text-lg font-bold uppercase">
                        {sellerName[0]}
                      </span>
                    )}
                    {online && (
                      <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-zinc-900 bg-green-500" />
                    )}
                  </div>
                  <div className="flex flex-col">
                    <Link
                      href={`/perfil/${seller.username}`}
                      className="text-sm font-semibold text-zinc-100 hover:text-violet-400 transition-colors"
                    >
                      {sellerName}
                    </Link>
                    <span className="text-xs text-zinc-500">@{seller.username}</span>
                  </div>
                  <span className={`ml-auto rounded-full px-2.5 py-1 text-xs font-medium ${online ? 'bg-green-500/20 text-green-400' : 'bg-zinc-800 text-zinc-500'}`}>
                    {online ? '● Online' : '○ Offline'}
                  </span>
                </div>

                {/* Verifications */}
                <div className="flex flex-wrap gap-2">
                  <VerBadge ok={hasEmail}    label="E-mail" emoji="✉️" />
                  <VerBadge ok={hasPhone}    label="Telefone" emoji="📱" />
                  <VerBadge ok={hasIdentity} label="Documentos" emoji="🪪" />
                </div>

                {/* Reputation */}
                {positiveRatio !== null && (
                  <div className="flex items-center gap-2 rounded-xl bg-zinc-800/40 px-3 py-2">
                    <span className="text-lg">⭐</span>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-zinc-100">{positiveRatio}% positivas</span>
                      <span className="text-xs text-zinc-500">{totalReviews} avaliação{totalReviews !== 1 ? 'ões' : ''} · {stats?.total_sales ?? 0} vendas</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Purchase panel */}
              <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-4">
                <PurchasePanel
                  announcementId={ann.id}
                  announcementSlug={ann.slug}
                  model={ann.model as 'normal' | 'dynamic'}
                  normalPrice={ann.unit_price}
                  normalStock={ann.stock_quantity}
                  hasAutoDelivery={ann.has_auto_delivery}
                  items={items}
                  isAuthenticated={!!user}
                />
              </div>

              {/* Safety notice */}
              <div className="rounded-2xl border border-zinc-800/40 bg-zinc-900/20 px-4 py-3 text-xs text-zinc-600">
                🔒 Pagamento seguro via Pagar.me · Dinheiro retido em escrow até sua confirmação · Suporte 24h
              </div>
            </aside>
          </div>
        </div>
      </div>
    </>
  )
}

// ─── Verification badge ───────────────────────────────────────────────────────
function VerBadge({ ok, label, emoji }: { ok: boolean; label: string; emoji: string }) {
  return (
    <span className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
      ok
        ? 'border-green-500/30 bg-green-500/10 text-green-400'
        : 'border-zinc-800 bg-zinc-900/40 text-zinc-600'
    }`}>
      {emoji}
      <span>{label}</span>
      <span>{ok ? '✓' : '–'}</span>
    </span>
  )
}