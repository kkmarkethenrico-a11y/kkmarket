'use client'

import { useState, useActionState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

// ─── Types ─────────────────────────────────────────────────────────────────────
interface Review {
  id: string
  reviewer_id: string
  type: 'positive' | 'neutral' | 'negative'
  message: string | null
  created_at: string
  profiles: { username: string; display_name: string | null; avatar_url: string | null }
}

interface Comment {
  id: string
  user_id: string
  parent_id: string | null
  message: string
  created_at: string
  profiles: { username: string; display_name: string | null; avatar_url: string | null }
  replies?: Comment[]
}

// ─── Review item ──────────────────────────────────────────────────────────────
const TYPE_CONFIG = {
  positive: { emoji: '👍', label: 'Positiva', cls: 'text-green-400 bg-green-500/10 border-green-500/20' },
  neutral:  { emoji: '😐', label: 'Neutra',   cls: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
  negative: { emoji: '👎', label: 'Negativa', cls: 'text-red-400 bg-red-500/10 border-red-500/20' },
}

function ReviewCard({ review }: { review: Review }) {
  const cfg = TYPE_CONFIG[review.type]
  const name = review.profiles.display_name ?? review.profiles.username

  return (
    <div className="flex gap-3 rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-4">
      {review.profiles.avatar_url ? (
        <Image
          src={review.profiles.avatar_url}
          alt={name}
          width={36}
          height={36}
          className="h-9 w-9 shrink-0 rounded-full object-cover"
        />
      ) : (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-sm font-bold uppercase">
          {name[0]}
        </span>
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-zinc-200">{name}</span>
          <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${cfg.cls}`}>
            {cfg.emoji} {cfg.label}
          </span>
          <span className="ml-auto text-xs text-zinc-600">
            {new Date(review.created_at).toLocaleDateString('pt-BR')}
          </span>
        </div>
        {review.message && (
          <p className="text-sm text-zinc-400 leading-relaxed">{review.message}</p>
        )}
      </div>
    </div>
  )
}

// ─── Reviews tab ─────────────────────────────────────────────────────────────
export function ReviewsTab({
  initial,
  sellerId,
  reviewsPositive = 0,
  reviewsNeutral = 0,
  reviewsNegative = 0,
}: {
  initial: Review[]
  sellerId: string
  reviewsPositive?: number
  reviewsNeutral?: number
  reviewsNegative?: number
}) {
  const [reviews, setReviews] = useState<Review[]>(initial)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(initial.length >= 10)
  const PER_PAGE = 10

  const total  = reviewsPositive + reviewsNeutral + reviewsNegative
  const posPct = total > 0 ? Math.round((reviewsPositive / total) * 100) : null

  async function loadMore() {
    setLoading(true)
    const supabase = createClient()
    const from = reviews.length
    const { data } = await supabase
      .from('order_reviews')
      .select('id, reviewer_id, type, message, created_at, profiles!reviewer_id(username, display_name, avatar_url)')
      .eq('reviewed_id', sellerId)
      .order('created_at', { ascending: false })
      .range(from, from + PER_PAGE - 1)
    setLoading(false)
    if (!data || data.length < PER_PAGE) setHasMore(false)
    if (data) setReviews((prev) => [...prev, ...(data as unknown as Review[])])
  }

  if (reviews.length === 0 && total === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <span className="text-4xl">⭐</span>
        <p className="text-zinc-500">Ainda sem avaliações neste anúncio.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Resumo */}
      {total > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg bg-zinc-800/60 px-4 py-3 text-sm">
          <span className="font-semibold text-emerald-400">
            {reviewsPositive} avaliação{reviewsPositive !== 1 ? 'ões' : ''} positiva{reviewsPositive !== 1 ? 's' : ''}
          </span>
          <span className="text-zinc-600">de</span>
          <span className="text-zinc-400">{total} vendas avaliadas</span>
          {posPct !== null && (
            <span className="ml-auto rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-400">
              {posPct}% positivas
            </span>
          )}
        </div>
      )}
      {reviews.map((r) => <ReviewCard key={r.id} review={r} />)}
      {hasMore && (
        <button
          type="button"
          onClick={loadMore}
          disabled={loading}
          className="mx-auto mt-2 rounded-xl border border-zinc-700 px-6 py-2.5 text-sm font-medium text-zinc-300 transition-all hover:border-zinc-600 hover:text-white disabled:opacity-50"
        >
          {loading ? 'Carregando…' : 'Carregar mais avaliações'}
        </button>
      )}
    </div>
  )
}

// ─── Comment thread ───────────────────────────────────────────────────────────
function CommentItem({
  comment,
  announcementId,
  isAuthenticated,
  sellerId,
  currentUserId,
}: {
  comment: Comment
  announcementId: string
  isAuthenticated: boolean
  sellerId: string
  currentUserId: string | null
}) {
  const [replying, setReplying] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [replies, setReplies] = useState<Comment[]>(comment.replies ?? [])
  const [sending, setSending] = useState(false)

  const name = comment.profiles.display_name ?? comment.profiles.username
  const isSeller = comment.user_id === sellerId

  async function sendReply() {
    if (!replyText.trim()) return
    setSending(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('announcement_comments')
      .insert({
        announcement_id: announcementId,
        parent_id: comment.id,
        message: replyText.trim(),
      })
      .select('id, user_id, parent_id, message, created_at, profiles(username, display_name, avatar_url)')
      .single()
    setSending(false)
    if (data) {
      setReplies((prev) => [...prev, data as unknown as Comment])
      setReplyText('')
      setReplying(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-3">
        {comment.profiles.avatar_url ? (
          <Image
            src={comment.profiles.avatar_url}
            alt={name}
            width={32}
            height={32}
            className="h-8 w-8 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold uppercase">
            {name[0]}
          </span>
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-1 rounded-2xl border border-zinc-800/60 bg-zinc-900/40 px-4 py-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-zinc-200">{name}</span>
            {isSeller && (
              <span className="rounded-full bg-violet-600/20 px-2 py-0.5 text-[10px] font-bold uppercase text-violet-400">
                Vendedor
              </span>
            )}
            <span className="ml-auto text-xs text-zinc-600">
              {new Date(comment.created_at).toLocaleDateString('pt-BR')}
            </span>
          </div>
          <p className="text-sm text-zinc-300 leading-relaxed">{comment.message}</p>
          {isAuthenticated && (currentUserId === sellerId || !comment.parent_id) && (
            <button
              type="button"
              onClick={() => setReplying((v) => !v)}
              className="mt-1 self-start text-xs text-zinc-500 hover:text-violet-400 transition-colors"
            >
              {replying ? 'Cancelar' : 'Responder'}
            </button>
          )}
        </div>
      </div>

      {/* Replies */}
      {replies.length > 0 && (
        <div className="ml-11 flex flex-col gap-2 border-l-2 border-zinc-800/60 pl-4">
          {replies.map((r) => (
            <CommentItem
              key={r.id}
              comment={r}
              announcementId={announcementId}
              isAuthenticated={isAuthenticated}
              sellerId={sellerId}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      )}

      {/* Reply form */}
      {replying && (
        <div className="ml-11 flex gap-2">
          <textarea
            rows={2}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Sua resposta…"
            className="flex-1 resize-none rounded-xl border border-zinc-700 bg-zinc-800/60 px-3 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:border-violet-500"
          />
          <button
            type="button"
            onClick={sendReply}
            disabled={sending || !replyText.trim()}
            className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-50"
          >
            {sending ? '…' : 'Enviar'}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Questions tab ────────────────────────────────────────────────────────────
export function QuestionsTab({
  initial,
  announcementId,
  sellerId,
  isAuthenticated,
  currentUserId,
}: {
  initial: Comment[]
  announcementId: string
  sellerId: string
  isAuthenticated: boolean
  currentUserId: string | null
}) {
  const [comments, setComments] = useState<Comment[]>(initial)
  const [question, setQuestion] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function sendQuestion() {
    if (!question.trim()) return
    setError(null)
    setSending(true)
    const supabase = createClient()
    const { data, error: err } = await supabase
      .from('announcement_comments')
      .insert({ announcement_id: announcementId, message: question.trim() })
      .select('id, user_id, parent_id, message, created_at, profiles(username, display_name, avatar_url)')
      .single()
    setSending(false)
    if (err) { setError('Erro ao enviar pergunta. Tente novamente.'); return }
    if (data) {
      setComments((prev) => [data as unknown as Comment, ...prev])
      setQuestion('')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Question form */}
      {isAuthenticated ? (
        <div className="flex flex-col gap-2 rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-4">
          <label className="text-sm font-medium text-zinc-300">Faça uma pergunta ao vendedor</label>
          <textarea
            rows={3}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Sua dúvida sobre este produto…"
            className="resize-y rounded-xl border border-zinc-700 bg-zinc-800/60 px-3 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30"
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button
            type="button"
            onClick={sendQuestion}
            disabled={sending || !question.trim()}
            className="self-end rounded-xl bg-violet-600 px-5 py-2 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-50"
          >
            {sending ? 'Enviando…' : 'Enviar pergunta'}
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 px-5 py-4 text-center text-sm text-zinc-500">
          <Link href="/login" className="text-violet-400 hover:underline font-medium">Faça login</Link> para enviar uma pergunta.
        </div>
      )}

      {/* Comments list */}
      {comments.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <span className="text-4xl">💬</span>
          <p className="text-zinc-500">Nenhuma pergunta ainda. Seja o primeiro!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {comments
            .filter((c) => !c.parent_id)
            .map((c) => (
              <CommentItem
                key={c.id}
                comment={{
                  ...c,
                  replies: comments.filter((r) => r.parent_id === c.id),
                }}
                announcementId={announcementId}
                isAuthenticated={isAuthenticated}
                sellerId={sellerId}
                currentUserId={currentUserId}
              />
            ))}
        </div>
      )}
    </div>
  )
}
