'use client'

import { useState } from 'react'
import { ThumbsUp, ThumbsDown, Minus } from 'lucide-react'

interface Props {
  orderId:    string
  /** Role de quem está avaliando — 'buyer' avalia seller; 'seller' avalia buyer */
  reviewerRole: 'buyer' | 'seller'
  /** Se o usuário já avaliou este pedido */
  alreadyReviewed: boolean
  onSuccess?: () => void
}

type ReviewType = 'positive' | 'neutral' | 'negative'

const OPTIONS: { value: ReviewType; label: string; icon: React.ReactNode; cls: string; activeCls: string }[] = [
  {
    value: 'positive',
    label: 'Positiva',
    icon: <ThumbsUp className="h-4 w-4" />,
    cls: 'border-zinc-700 text-zinc-400 hover:border-green-500/50 hover:text-green-400',
    activeCls: 'border-green-500 bg-green-500/15 text-green-400',
  },
  {
    value: 'neutral',
    label: 'Neutra',
    icon: <Minus className="h-4 w-4" />,
    cls: 'border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-300',
    activeCls: 'border-zinc-400 bg-zinc-700/50 text-zinc-300',
  },
  {
    value: 'negative',
    label: 'Negativa',
    icon: <ThumbsDown className="h-4 w-4" />,
    cls: 'border-zinc-700 text-zinc-400 hover:border-red-500/50 hover:text-red-400',
    activeCls: 'border-red-500 bg-red-500/15 text-red-400',
  },
]

export default function ReviewForm({ orderId, reviewerRole, alreadyReviewed, onSuccess }: Props) {
  const [selected, setSelected] = useState<ReviewType | null>(null)
  const [message, setMessage]   = useState('')
  const [loading, setLoading]   = useState(false)
  const [done, setDone]         = useState(alreadyReviewed)
  const [error, setError]       = useState<string | null>(null)

  const targetLabel = reviewerRole === 'buyer' ? 'vendedor' : 'comprador'

  if (done) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
        <p className="text-sm font-semibold text-zinc-300">⭐ Avaliação registrada</p>
        <p className="text-xs text-zinc-500 mt-1">Obrigado por avaliar o {targetLabel}!</p>
      </div>
    )
  }

  async function submit() {
    if (!selected) {
      setError('Selecione um tipo de avaliação.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/orders/${orderId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: selected, message: message.trim() || undefined }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Falha ao enviar avaliação')
      setDone(true)
      onSuccess?.()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
      <div>
        <h3 className="font-semibold text-white">Avaliar {targetLabel}</h3>
        <p className="text-xs text-zinc-500 mt-0.5">Sua avaliação é anônima para outros usuários, mas ajuda a manter a comunidade segura.</p>
      </div>

      {error && (
        <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-2">
          {error}
        </p>
      )}

      {/* Botões de tipo */}
      <div className="flex gap-2">
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setSelected(opt.value)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all ${
              selected === opt.value ? opt.activeCls : opt.cls
            }`}
          >
            {opt.icon}
            <span className="hidden sm:inline">{opt.label}</span>
          </button>
        ))}
      </div>

      {/* Mensagem opcional */}
      {selected && (
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={`Descreva sua experiência com o ${targetLabel} (opcional, máx. 600 caracteres)…`}
          maxLength={600}
          rows={3}
          className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-violet-500 resize-none"
        />
      )}

      <button
        onClick={submit}
        disabled={!selected || loading}
        className="w-full rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Enviando…' : 'Enviar avaliação'}
      </button>
    </div>
  )
}
