'use client'

import Image from 'next/image'
import { ThumbsUp, ThumbsDown, Minus } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

export interface ReviewItem {
  id: string
  reviewer_id: string
  type: 'positive' | 'neutral' | 'negative'
  message: string | null
  created_at: string
  profiles: {
    username: string
    display_name: string | null
    avatar_url: string | null
  } | null
}

interface ReviewsListProps {
  /** Avaliações iniciais (já carregadas no servidor, SSR) */
  initialReviews: ReviewItem[]
  /** ID do vendedor (para buscar mais avaliações) */
  sellerId: string
  /** Total vindo de user_stats para exibir o resumo */
  reviewsPositive: number
  reviewsNeutral: number
  reviewsNegative: number
  /** Quantas avaliações mostrar inicialmente */
  initialLimit?: number
}

const REVIEW_ICON = {
  positive: <ThumbsUp  className="h-4 w-4 text-emerald-500" aria-label="Positiva" />,
  neutral:  <Minus     className="h-4 w-4 text-zinc-400"    aria-label="Neutra"   />,
  negative: <ThumbsDown className="h-4 w-4 text-red-500"   aria-label="Negativa" />,
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day:   '2-digit',
    month: 'short',
    year:  'numeric',
  })
}

function Avatar({ src, name }: { src: string | null; name: string }) {
  const initials = name.slice(0, 2).toUpperCase()
  if (src) {
    return (
      <Image
        src={src}
        alt={name}
        width={32}
        height={32}
        sizes="32px"
        loading="lazy"
        className="h-8 w-8 rounded-full object-cover"
      />
    )
  }
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-700 text-xs font-semibold text-zinc-300">
      {initials}
    </div>
  )
}

export function ReviewsList({
  initialReviews,
  sellerId,
  reviewsPositive,
  reviewsNeutral,
  reviewsNegative,
  initialLimit = 5,
}: ReviewsListProps) {
  const [reviews, setReviews] = useState<ReviewItem[]>(
    initialReviews.slice(0, initialLimit),
  )
  const [loading, setLoading] = useState(false)
  const [page, setPage]       = useState(0)
  const [hasMore, setHasMore] = useState(initialReviews.length > initialLimit)

  const total    = reviewsPositive + reviewsNeutral + reviewsNegative
  const posPct   = total > 0 ? Math.round((reviewsPositive / total) * 100) : null

  async function loadMore() {
    setLoading(true)
    const nextPage = page + 1
    const from     = nextPage * 10
    const to       = from + 9
    try {
      const res = await fetch(
        `/api/profiles/${sellerId}/reviews?from=${from}&to=${to}`,
      )
      if (!res.ok) throw new Error('Erro ao carregar')
      const data = (await res.json()) as { reviews: ReviewItem[]; hasMore: boolean }
      setReviews((prev) => [...prev, ...data.reviews])
      setHasMore(data.hasMore)
      setPage(nextPage)
    } catch {
      // silêncio: o usuário pode tentar novamente
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Resumo */}
      {total > 0 && (
        <div className="flex items-center gap-3 rounded-lg bg-zinc-800/60 px-4 py-3 text-sm">
          <span className="font-semibold text-emerald-400">
            {posPct}% positivas
          </span>
          <span className="text-zinc-500">·</span>
          <span className="text-zinc-400">
            {reviewsPositive} positiva{reviewsPositive !== 1 ? 's' : ''}
          </span>
          <span className="text-zinc-600">de</span>
          <span className="text-zinc-400">{total} vendas avaliadas</span>
        </div>
      )}

      {/* Lista */}
      {reviews.length === 0 && (
        <p className="py-4 text-center text-sm text-zinc-500">
          Nenhuma avaliação ainda.
        </p>
      )}

      <ul className="space-y-3">
        {reviews.map((r) => {
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
              <Avatar src={r.profiles?.avatar_url ?? null} name={name} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {REVIEW_ICON[r.type]}
                  <span className="text-sm font-medium text-zinc-200">{name}</span>
                  <span className="ml-auto text-xs text-zinc-500">
                    {formatDate(r.created_at)}
                  </span>
                </div>
                {r.message && (
                  <p className="mt-1 text-sm text-zinc-400 break-words">
                    {r.message}
                  </p>
                )}
              </div>
            </li>
          )
        })}
      </ul>

      {hasMore && (
        <div className="flex justify-center pt-2">
          <button
            onClick={loadMore}
            disabled={loading}
            className="rounded-md border border-zinc-700 px-4 py-1.5 text-sm text-zinc-400 hover:bg-zinc-800 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Carregando…' : 'Carregar mais'}
          </button>
        </div>
      )}
    </div>
  )
}
