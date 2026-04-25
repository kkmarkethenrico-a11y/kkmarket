'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ThumbsUp, ThumbsDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ProfileReviewItem {
  id: string
  reviewer_id: string
  role: 'buyer' | 'seller'
  type: 'positive' | 'neutral' | 'negative'
  message: string | null
  created_at: string
  profiles: {
    username: string
    display_name: string | null
    avatar_url: string | null
  } | null
}

interface ProfileReviewTabsProps {
  userId: string
  initialReviews: ProfileReviewItem[]
  reviewsPositive: number
  reviewsNeutral: number
  reviewsNegative: number
}

type RoleTab = 'all' | 'seller' | 'buyer'

const TABS: { id: RoleTab; label: string }[] = [
  { id: 'all',    label: 'Todas'           },
  { id: 'seller', label: 'Como Vendedor'   },
  { id: 'buyer',  label: 'Como Comprador'  },
]

const PAGE_SIZE = 10

const REVIEW_ICON = {
  positive: <ThumbsUp   className="h-4 w-4 text-emerald-500" />,
  neutral:  <Minus      className="h-4 w-4 text-zinc-400"    />,
  negative: <ThumbsDown className="h-4 w-4 text-red-500"     />,
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

function SmallAvatar({ src, name }: { src: string | null; name: string }) {
  if (src) {
    return (
      <Image
        src={src}
        alt={name}
        width={32}
        height={32}
        className="h-8 w-8 rounded-full object-cover"
      />
    )
  }
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-700 text-xs font-semibold text-zinc-300">
      {name.slice(0, 2).toUpperCase()}
    </div>
  )
}

export function ProfileReviewTabs({
  userId,
  initialReviews,
  reviewsPositive,
  reviewsNeutral,
  reviewsNegative,
}: ProfileReviewTabsProps) {
  const [activeTab, setActiveTab] = useState<RoleTab>('all')
  const [allReviews, setAllReviews]     = useState<ProfileReviewItem[]>(initialReviews)
  const [sellerReviews, setSellerReviews] = useState<ProfileReviewItem[]>([])
  const [buyerReviews, setBuyerReviews]   = useState<ProfileReviewItem[]>([])

  const [pages, setPages]     = useState<Record<RoleTab, number>>({ all: 0, seller: 0, buyer: 0 })
  const [hasMore, setHasMore] = useState<Record<RoleTab, boolean>>({
    all:    initialReviews.length >= PAGE_SIZE,
    seller: true,
    buyer:  true,
  })
  const [loaded, setLoaded]   = useState<Record<RoleTab, boolean>>({ all: true, seller: false, buyer: false })
  const [loading, setLoading] = useState(false)

  const reviews: Record<RoleTab, ProfileReviewItem[]> = {
    all:    allReviews,
    seller: sellerReviews,
    buyer:  buyerReviews,
  }
  const setters: Record<RoleTab, React.Dispatch<React.SetStateAction<ProfileReviewItem[]>>> = {
    all:    setAllReviews,
    seller: setSellerReviews,
    buyer:  setBuyerReviews,
  }

  async function loadTab(tab: RoleTab, page = 0) {
    setLoading(true)
    const from = page * PAGE_SIZE
    const to   = from + PAGE_SIZE - 1
    const role = tab === 'all' ? '' : `&role=${tab}`
    try {
      const res  = await fetch(`/api/profiles/${userId}/reviews?from=${from}&to=${to}${role}`)
      const data = (await res.json()) as { reviews: ProfileReviewItem[]; hasMore: boolean }
      if (page === 0) {
        setters[tab](data.reviews)
      } else {
        setters[tab]((prev) => [...prev, ...data.reviews])
      }
      setHasMore((prev) => ({ ...prev, [tab]: data.hasMore }))
      setPages((prev) => ({ ...prev, [tab]: page }))
    } catch {
      // silêncio
    } finally {
      setLoading(false)
    }
  }

  function handleTabChange(tab: RoleTab) {
    setActiveTab(tab)
    if (!loaded[tab]) {
      setLoaded((prev) => ({ ...prev, [tab]: true }))
      void loadTab(tab, 0)
    }
  }

  async function loadMore() {
    const nextPage = pages[activeTab] + 1
    await loadTab(activeTab, nextPage)
    setPages((prev) => ({ ...prev, [activeTab]: nextPage }))
  }

  const current = reviews[activeTab]
  const total   = reviewsPositive + reviewsNeutral + reviewsNegative

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-zinc-900 p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => handleTabChange(t.id)}
            className={cn(
              'flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              activeTab === t.id
                ? 'bg-zinc-700 text-white'
                : 'text-zinc-400 hover:text-zinc-200',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Resumo (só na aba "todas") */}
      {activeTab === 'all' && total > 0 && (
        <div className="flex flex-wrap gap-4 rounded-lg bg-zinc-800/60 px-4 py-3 text-sm">
          <span className="text-emerald-400 font-medium">
            ▲ {reviewsPositive} positiva{reviewsPositive !== 1 ? 's' : ''}
          </span>
          <span className="text-zinc-400">
            ● {reviewsNeutral} neutra{reviewsNeutral !== 1 ? 's' : ''}
          </span>
          <span className="text-red-400">
            ▼ {reviewsNegative} negativa{reviewsNegative !== 1 ? 's' : ''}
          </span>
          <span className="ml-auto text-zinc-500 text-xs self-center">
            {total} avaliações no total
          </span>
        </div>
      )}

      {/* Lista */}
      {current.length === 0 && !loading && (
        <p className="py-8 text-center text-sm text-zinc-500">
          Nenhuma avaliação para esta categoria.
        </p>
      )}

      <ul className="space-y-3">
        {current.map((r) => {
          const name = r.profiles?.display_name ?? r.profiles?.username ?? 'Usuário'
          return (
            <li
              key={r.id}
              className={cn(
                'flex gap-3 rounded-lg border p-3',
                r.type === 'positive'
                  ? 'border-emerald-500/20 bg-emerald-500/5'
                  : r.type === 'negative'
                  ? 'border-red-500/20 bg-red-500/5'
                  : 'border-zinc-700/40 bg-zinc-800/40',
              )}
            >
              <SmallAvatar src={r.profiles?.avatar_url ?? null} name={name} />
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  {REVIEW_ICON[r.type]}
                  <span className="text-sm font-medium text-zinc-200">{name}</span>
                  <span className="rounded-full bg-zinc-700/60 px-1.5 py-0.5 text-[10px] text-zinc-400">
                    {r.role === 'buyer' ? 'comprador' : 'vendedor'}
                  </span>
                  <span className="ml-auto text-xs text-zinc-500">
                    {formatDate(r.created_at)}
                  </span>
                </div>
                {r.message && (
                  <p className="mt-1 text-sm text-zinc-400 break-words">{r.message}</p>
                )}
              </div>
            </li>
          )
        })}
      </ul>

      {hasMore[activeTab] && (
        <div className="flex justify-center pt-2">
          <button
            onClick={loadMore}
            disabled={loading}
            className="rounded-md border border-zinc-700 px-5 py-1.5 text-sm text-zinc-400 hover:bg-zinc-800 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Carregando…' : 'Carregar mais'}
          </button>
        </div>
      )}
    </div>
  )
}
