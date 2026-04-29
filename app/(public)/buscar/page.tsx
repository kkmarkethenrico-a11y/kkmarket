import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { AnnouncementCard } from '@/components/marketplace/AnnouncementCard'
import { SearchBar } from '@/components/marketplace/SearchBar'
import { SlidersHorizontal, TrendingUp, Clock, DollarSign, ArrowUpDown } from 'lucide-react'
import type { AnnouncementWithRelations } from '@/types'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

// ─── Metadata ────────────────────────────────────────────────────────────────
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}): Promise<Metadata> {
  const { q } = await searchParams
  return {
    title: q ? `Resultados para "${q}" — KK Market` : 'Buscar anúncios — KK Market',
    description: 'Encontre contas, itens digitais, gift cards e muito mais.',
  }
}

// ─── Order options ────────────────────────────────────────────────────────────
const ORDER_OPTIONS = [
  { value: 'relevance',    label: 'Relevância',      icon: SlidersHorizontal },
  { value: 'best_sellers', label: 'Mais vendidos',   icon: TrendingUp },
  { value: 'newest',       label: 'Mais recentes',   icon: Clock },
  { value: 'cheapest',     label: 'Menor preço',     icon: DollarSign },
  { value: 'expensive',    label: 'Maior preço',     icon: ArrowUpDown },
] as const
type OrderValue = (typeof ORDER_OPTIONS)[number]['value']

const PAGE_SIZE = 24

// ─── Data fetching ────────────────────────────────────────────────────────────
async function getResults(q: string, order: OrderValue, page: number) {
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

  const from = (page - 1) * PAGE_SIZE
  const to   = from + PAGE_SIZE - 1

  let query = supabase
    .from('announcements')
    .select(announcementSelect, { count: 'exact' })
    .eq('status', 'active')

  // Filtro por título
  if (q) {
    query = query.ilike('title', `%${q}%`)
  }

  // Ordenação
  switch (order) {
    case 'best_sellers':
      query = query.order('sale_count', { ascending: false })
      break
    case 'newest':
      query = query.order('created_at', { ascending: false })
      break
    case 'cheapest':
      query = query.order('unit_price', { ascending: true })
      break
    case 'expensive':
      query = query.order('unit_price', { ascending: false })
      break
    default:
      // relevância: destaque primeiro, depois mais vendidos
      query = q
        ? query.order('sale_count', { ascending: false })
        : query.order('plan', { ascending: false }).order('sale_count', { ascending: false })
  }

  const { data: raw, count } = await query.range(from, to)

  if (!raw?.length) return { results: [], total: 0 }

  // Busca stats dos vendedores
  const sellerIds = [...new Set(raw.map((a) => a.user_id))]
  const { data: statsData } = await supabase
    .from('user_stats')
    .select('user_id, avg_response_time_minutes, reviews_positive, reviews_neutral, reviews_negative')
    .in('user_id', sellerIds)

  const statsMap = new Map((statsData ?? []).map((s) => [s.user_id, s]))

  const results = raw.map((ann) => ({
    ...ann,
    user_stats: statsMap.get(ann.user_id) ?? null,
  })) as unknown as AnnouncementWithRelations[]

  return { results, total: count ?? 0 }
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function BuscarPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; order?: string; page?: string }>
}) {
  const { q = '', order: rawOrder = 'relevance', page: rawPage = '1' } = await searchParams
  const order = (ORDER_OPTIONS.map((o) => o.value) as string[]).includes(rawOrder)
    ? (rawOrder as OrderValue)
    : 'relevance'
  const page  = Math.max(1, parseInt(rawPage, 10) || 1)

  const { results, total } = await getResults(q, order, page)
  const totalPages = Math.ceil(total / PAGE_SIZE)

  function buildUrl(params: Record<string, string>) {
    const p = new URLSearchParams()
    if (q)            p.set('q', q)
    if (order !== 'relevance') p.set('order', order)
    Object.entries(params).forEach(([k, v]) => p.set(k, v))
    const s = p.toString()
    return s ? `/buscar?${s}` : '/buscar'
  }

  return (
    <div className="min-h-screen text-white">

      {/* ── Hero / barra de busca ─────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-zinc-800/40 py-14">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 left-1/2 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-violet-600/8 blur-3xl" />
        </div>
        <div className="container mx-auto flex flex-col items-center gap-6 px-4 text-center">
          <h1 className="text-3xl font-black tracking-tight md:text-4xl">
            {q ? (
              <>
                Resultados para{' '}
                <span className="text-violet-400">&ldquo;{q}&rdquo;</span>
              </>
            ) : (
              'Buscar anúncios'
            )}
          </h1>
          <SearchBar defaultValue={q} />

          {/* Contagem */}
          {q && (
            <p className="text-sm text-zinc-500">
              {total === 0
                ? 'Nenhum resultado encontrado'
                : `${total.toLocaleString('pt-BR')} resultado${total !== 1 ? 's' : ''} encontrado${total !== 1 ? 's' : ''}`}
            </p>
          )}
        </div>
      </section>

      {/* ── Filtros de ordenação ──────────────────────────────────────── */}
      <section className="border-b border-zinc-800/40 bg-zinc-950/60 py-3">
        <div className="container mx-auto flex flex-wrap items-center gap-2 px-4">
          <span className="mr-1 text-xs font-semibold uppercase tracking-widest text-zinc-500">
            Ordenar:
          </span>
          {ORDER_OPTIONS.map(({ value, label, icon: Icon }) => {
            const active = value === order
            const href   = buildUrl({ order: value, page: '1' })
            return (
              <Link
                key={value}
                href={href}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  active
                    ? 'bg-violet-600 text-white'
                    : 'border border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </Link>
            )
          })}
        </div>
      </section>

      {/* ── Resultados ───────────────────────────────────────────────── */}
      <section className="py-10">
        <div className="container mx-auto px-4">
          {results.length === 0 ? (
            <div className="flex flex-col items-center gap-6 py-24 text-center">
              <span className="text-6xl">🔍</span>
              <div>
                <p className="mb-2 text-xl font-bold text-zinc-200">
                  {q ? `Nenhum anúncio para "${q}"` : 'Nenhum anúncio disponível'}
                </p>
                <p className="text-sm text-zinc-500">
                  Tente palavras diferentes ou explore as{' '}
                  <Link href="/categorias" className="text-violet-400 hover:text-violet-300 underline">
                    categorias
                  </Link>
                  .
                </p>
              </div>
              <Link
                href="/"
                className="rounded-xl bg-violet-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-violet-500 transition-colors"
              >
                Voltar à página inicial
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                {results.map((ann) => (
                  <AnnouncementCard key={ann.id} ann={ann} />
                ))}
              </div>

              {/* Paginação */}
              {totalPages > 1 && (
                <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
                  {page > 1 && (
                    <Link
                      href={buildUrl({ page: String(page - 1) })}
                      className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 hover:border-zinc-500 hover:text-white transition-colors"
                    >
                      ← Anterior
                    </Link>
                  )}

                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    let p: number
                    if (totalPages <= 7) {
                      p = i + 1
                    } else if (page <= 4) {
                      p = i + 1
                    } else if (page >= totalPages - 3) {
                      p = totalPages - 6 + i
                    } else {
                      p = page - 3 + i
                    }
                    const active = p === page
                    return (
                      <Link
                        key={p}
                        href={buildUrl({ page: String(p) })}
                        className={`h-9 w-9 rounded-xl text-center text-sm font-semibold leading-9 transition-colors ${
                          active
                            ? 'bg-violet-600 text-white'
                            : 'border border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white'
                        }`}
                      >
                        {p}
                      </Link>
                    )
                  })}

                  {page < totalPages && (
                    <Link
                      href={buildUrl({ page: String(page + 1) })}
                      className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 hover:border-zinc-500 hover:text-white transition-colors"
                    >
                      Próxima →
                    </Link>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* ── Atalhos por categoria ─────────────────────────────────────── */}
      <section className="border-t border-zinc-800/40 py-10">
        <div className="container mx-auto px-4 text-center">
          <p className="mb-4 text-sm text-zinc-500">Explore por categoria</p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              { label: 'Jogos',         href: '/categoria/jogos' },
              { label: 'Redes Sociais', href: '/categoria/redes-sociais' },
              { label: 'Bots',          href: '/categoria/bots' },
              { label: 'Scripts',       href: '/categoria/scripts' },
              { label: 'Gift Cards',    href: '/categoria/gift-cards' },
              { label: 'Ver todas',     href: '/categorias' },
            ].map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className="rounded-full border border-zinc-700 px-4 py-1.5 text-xs font-semibold text-zinc-400 transition-colors hover:border-violet-500 hover:text-violet-400"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
