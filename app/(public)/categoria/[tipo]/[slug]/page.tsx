import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata, ResolvingMetadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { AnnouncementCard } from '@/components/marketplace/AnnouncementCard'
import {
  CategorySidebar,
  OrderSelect,
  Pagination,
} from '@/components/marketplace/AnnouncementFilters'
import type { Category, AnnouncementWithRelations } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────
type PageParams = { tipo: string; slug: string }
type SearchParams = { min_price?: string; max_price?: string; order?: string; page?: string }

type Props = {
  params:       Promise<PageParams>
  searchParams: Promise<SearchParams>
}

const PER_PAGE = 20

// ─── Plan ordering helper ─────────────────────────────────────────────────────
const PLAN_ORDER: Record<string, number> = { diamond: 3, gold: 2, silver: 1 }

function planWeight(plan: string) {
  return PLAN_ORDER[plan] ?? 0
}

// ─── generateMetadata ─────────────────────────────────────────────────────────
export async function generateMetadata(
  { params }: Props,
  _parent: ResolvingMetadata,
): Promise<Metadata> {
  const { slug } = await params
  const supabase  = await createClient()
  const { data }  = await supabase
    .from('categories')
    .select('name, seo_title, seo_description')
    .eq('slug', slug)
    .single()

  if (!data) return { title: 'Categoria — GameMarket' }

  return {
    title:       `${data.seo_title ?? data.name} — Anúncios | GameMarket`,
    description: data.seo_description ?? `Compre ${data.name} com segurança e entrega garantida na GameMarket.`,
    openGraph: {
      title:       `${data.name} | GameMarket`,
      description: data.seo_description ?? `Produtos digitais de ${data.name} com garantia.`,
    },
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function CategoryPage({ params, searchParams }: Props) {
  const { tipo, slug } = await params
  const sp             = await searchParams

  const page      = Math.max(1, parseInt(sp.page ?? '1', 10))
  const order     = sp.order ?? 'best_sellers'
  const minPrice  = sp.min_price ? parseFloat(sp.min_price) : null
  const maxPrice  = sp.max_price ? parseFloat(sp.max_price) : null

  const supabase = await createClient()

  // ─── Fetch category tree ────────────────────────────────────────────────
  // Parent (root) by slug=tipo
  const { data: parentCat } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', tipo)
    .eq('status', true)
    .single()

  if (!parentCat) notFound()

  // Current subcategory
  const { data: currentCat } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .eq('parent_id', parentCat.id)
    .eq('status', true)
    .single()

  if (!currentCat) notFound()

  // All sibling subcategories for sidebar
  const { data: siblings } = await supabase
    .from('categories')
    .select('id, name, slug, sort_order')
    .eq('parent_id', parentCat.id)
    .eq('status', true)
    .order('sort_order', { ascending: true })

  const subcategories = (siblings ?? []) as Category[]

  // ─── Build announcements query ──────────────────────────────────────────
  const from = (page - 1) * PER_PAGE
  const to   = from + PER_PAGE - 1

  let query = supabase
    .from('announcements')
    .select(
      `
      id, user_id, category_id, title, slug, description,
      model, plan, unit_price, stock_quantity,
      has_auto_delivery, is_vip, sale_count, view_count,
      status, created_at, updated_at,
      filters_data, rejection_reason, approved_at, approved_by,
      profiles!user_id (
        username, display_name, avatar_url, last_seen_at
      ),
      user_stats!user_id (
        avg_response_time_minutes, reviews_positive, reviews_neutral, reviews_negative
      ),
      announcement_images (
        url, is_cover, sort_order
      )
      `,
      { count: 'exact' },
    )
    .eq('category_id', currentCat.id)
    .eq('status', 'active')

  if (minPrice !== null) query = query.gte('unit_price', minPrice)
  if (maxPrice !== null) query = query.lte('unit_price', maxPrice)

  // Apply ordering (plan always primary DESC, secondary criterion varies)
  switch (order) {
    case 'newest':
      query = query.order('plan',       { ascending: false })
                   .order('created_at', { ascending: false })
      break
    case 'price_asc':
      query = query.order('plan',       { ascending: false })
                   .order('unit_price', { ascending: true,  nullsFirst: false })
      break
    case 'price_desc':
      query = query.order('plan',       { ascending: false })
                   .order('unit_price', { ascending: false, nullsFirst: false })
      break
    default: // best_sellers
      query = query.order('plan',       { ascending: false })
                   .order('sale_count', { ascending: false })
      break
  }

  query = query.range(from, to)

  const { data: rawAnn, count, error } = await query

  if (error) {
    console.error('[categoria/slug] query error:', error.message)
  }

  // Sort client-side by plan weight within result set (Supabase enum order ≠ plan priority)
  const announcements = ((rawAnn ?? []) as unknown as AnnouncementWithRelations[]).sort(
    (a, b) => planWeight(b.plan) - planWeight(a.plan),
  )

  const total = count ?? 0

  // ─── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="container mx-auto px-4 py-8">
        
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-sm text-zinc-500">
          <Link href="/" className="hover:text-zinc-300 transition-colors">Home</Link>
          <span>/</span>
          <Link href={`/categoria/${tipo}`} className="hover:text-zinc-300 transition-colors capitalize">
            {(parentCat as Category).name}
          </Link>
          <span>/</span>
          <span className="text-zinc-200 font-medium">{(currentCat as Category).name}</span>
        </nav>

        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">

          {/* ─── Sidebar ─────────────────────────────────────────────── */}
          <CategorySidebar
            parent={parentCat as Category}
            subcategories={subcategories}
            activeSlug={slug}
            tipo={tipo}
          />

          {/* ─── Main content ─────────────────────────────────────── */}
          <main className="flex min-w-0 flex-1 flex-col gap-6">
            
            {/* Header row */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {(currentCat as Category).name}
                </h1>
                <p className="mt-0.5 text-sm text-zinc-500">
                  {total > 0
                    ? `${total.toLocaleString('pt-BR')} anúnci${total === 1 ? 'o' : 'os'} encontrado${total === 1 ? '' : 's'}`
                    : 'Nenhum anúncio encontrado'}
                </p>
              </div>
              <OrderSelect />
            </div>

            {/* Results grid */}
            {announcements.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
                {announcements.map((ann) => (
                  <AnnouncementCard key={ann.id} ann={ann} />
                ))}
              </div>
            ) : (
              <EmptyState />
            )}

            {/* Pagination */}
            {total > PER_PAGE && (
              <div className="mt-4">
                <Pagination page={page} total={total} perPage={PER_PAGE} />
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-zinc-800 py-24 text-center">
      <span className="text-5xl">🔍</span>
      <div>
        <p className="text-lg font-semibold text-zinc-300">Nenhum anúncio encontrado</p>
        <p className="mt-1 text-sm text-zinc-600">
          Tente remover os filtros ou escolha outra subcategoria.
        </p>
      </div>
    </div>
  )
}