'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback, useRef, useState, useTransition } from 'react'
import type { Category } from '@/types'

// ─── helpers ─────────────────────────────────────────────────────────────────
function useQueryUpdater() {
  const router    = useRouter()
  const pathname  = usePathname()
  const sp        = useSearchParams()
  const [pending, startTransition] = useTransition()

  const update = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(sp.toString())
      for (const [k, v] of Object.entries(updates)) {
        if (v === null || v === '') params.delete(k)
        else params.set(k, v)
      }
      // reset page when filters change
      if (!('page' in updates)) params.delete('page')
      startTransition(() => router.push(`${pathname}?${params.toString()}`))
    },
    [router, pathname, sp],
  )

  return { update, pending }
}

// ─── PriceRange ───────────────────────────────────────────────────────────────
function PriceRange() {
  const sp      = useSearchParams()
  const { update, pending } = useQueryUpdater()
  const [min, setMin] = useState(sp.get('min_price') ?? '')
  const [max, setMax] = useState(sp.get('max_price') ?? '')
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const flush = useCallback(
    (minVal: string, maxVal: string) => {
      clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        update({ min_price: minVal || null, max_price: maxVal || null })
      }, 600)
    },
    [update],
  )

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
        Faixa de Preço
      </span>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-zinc-600">R$</span>
          <input
            type="number"
            min={0}
            placeholder="Mín"
            value={min}
            aria-label="Preço mínimo"
            onChange={(e) => { setMin(e.target.value); flush(e.target.value, max) }}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 py-2 pl-8 pr-2 text-sm text-white placeholder-zinc-600 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30"
          />
        </div>
        <span className="text-zinc-700">–</span>
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-zinc-600">R$</span>
          <input
            type="number"
            min={0}
            placeholder="Máx"
            value={max}
            aria-label="Preço máximo"
            onChange={(e) => { setMax(e.target.value); flush(min, e.target.value) }}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 py-2 pl-8 pr-2 text-sm text-white placeholder-zinc-600 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30"
          />
        </div>
      </div>
      {pending && <p className="text-xs text-zinc-600 animate-pulse">Filtrando…</p>}
    </div>
  )
}

// ─── SubcategoryList ─────────────────────────────────────────────────────────
function SubcategoryLinks({
  parent,
  subcategories,
  activeSlug,
  tipo,
}: {
  parent: Category
  subcategories: Category[]
  activeSlug: string
  tipo: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="mb-1 text-xs font-semibold uppercase tracking-wider text-zinc-500">
        {parent.name}
      </span>
      {subcategories.map((sub) => {
        const active = sub.slug === activeSlug
        return (
          <a
            key={sub.id}
            href={`/categoria/${tipo}/${sub.slug}`}
            className={`rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? 'bg-violet-600/20 text-violet-300'
                : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
            }`}
          >
            {sub.name}
          </a>
        )
      })}
    </div>
  )
}

// ─── OrderSelect ─────────────────────────────────────────────────────────────
export function OrderSelect() {
  const sp = useSearchParams()
  const { update } = useQueryUpdater()

  const options = [
    { value: 'best_sellers', label: 'Mais vendidos' },
    { value: 'newest',       label: 'Mais recentes' },
    { value: 'price_asc',    label: 'Menor preço'   },
    { value: 'price_desc',   label: 'Maior preço'   },
  ]

  return (
    <select
      value={sp.get('order') ?? 'best_sellers'}
      onChange={(e) => update({ order: e.target.value })}
      aria-label="Ordenar anúncios"
      className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-violet-500"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}

// ─── Pagination ───────────────────────────────────────────────────────────────
export function Pagination({ page, total, perPage }: { page: number; total: number; perPage: number }) {
  const { update, pending } = useQueryUpdater()
  const totalPages = Math.max(1, Math.ceil(total / perPage))

  if (totalPages <= 1) return null

  // Show window of 5 pages around current
  const window = 2
  const start  = Math.max(1, page - window)
  const end    = Math.min(totalPages, page + window)
  const pages  = Array.from({ length: end - start + 1 }, (_, i) => start + i)

  return (
    <nav aria-label="Paginação" className="flex items-center justify-center gap-1.5">
      {/* Prev */}
      <button
        type="button"
        disabled={page <= 1 || pending}
        onClick={() => update({ page: String(page - 1) })}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-800 text-sm text-zinc-400 transition-all hover:border-zinc-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
      >
        ←
      </button>

      {start > 1 && (
        <>
          <PageBtn n={1} current={page} onChange={(n) => update({ page: String(n) })} />
          {start > 2 && <span className="px-1 text-zinc-700">…</span>}
        </>
      )}

      {pages.map((n) => (
        <PageBtn key={n} n={n} current={page} onChange={(n) => update({ page: String(n) })} />
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="px-1 text-zinc-700">…</span>}
          <PageBtn n={totalPages} current={page} onChange={(n) => update({ page: String(n) })} />
        </>
      )}

      {/* Next */}
      <button
        type="button"
        disabled={page >= totalPages || pending}
        onClick={() => update({ page: String(page + 1) })}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-800 text-sm text-zinc-400 transition-all hover:border-zinc-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
      >
        →
      </button>
    </nav>
  )
}

function PageBtn({ n, current, onChange }: { n: number; current: number; onChange: (n: number) => void }) {
  const active = n === current
  return (
    <button
      type="button"
      onClick={() => onChange(n)}
      aria-current={active ? 'page' : undefined}
      className={`flex h-9 w-9 items-center justify-center rounded-xl border text-sm font-medium transition-all ${
        active
          ? 'border-violet-500 bg-violet-600/20 text-violet-300'
          : 'border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white'
      }`}
    >
      {n}
    </button>
  )
}

// ─── CategorySidebar (the composed sidebar) ─────────────────────────────────
export function CategorySidebar({
  parent,
  subcategories,
  activeSlug,
  tipo,
}: {
  parent: Category
  subcategories: Category[]
  activeSlug: string
  tipo: string
}) {
  return (
    <aside className="flex w-full flex-col gap-6 lg:w-[280px] lg:shrink-0">
      {/* Category header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-600/20 text-xl">
          {catEmoji(parent.slug)}
        </div>
        <div>
          <h2 className="text-base font-bold text-zinc-100">{parent.name}</h2>
          {parent.description && (
            <p className="text-xs text-zinc-500 line-clamp-2">{parent.description}</p>
          )}
        </div>
      </div>

      {/* Subcategory links */}
      <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-3">
        <SubcategoryLinks
          parent={parent}
          subcategories={subcategories}
          activeSlug={activeSlug}
          tipo={tipo}
        />
      </div>

      {/* Price filter */}
      <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-4">
        <PriceRange />
      </div>
    </aside>
  )
}

function catEmoji(slug: string): string {
  const map: Record<string, string> = {
    jogos: '🎮',
    'redes-sociais': '📱',
    bots: '🤖',
    scripts: '💻',
    'outros-digitais': '📦',
  }
  return map[slug] ?? '📂'
}