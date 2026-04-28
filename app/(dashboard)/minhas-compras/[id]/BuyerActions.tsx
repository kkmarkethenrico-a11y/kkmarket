'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  orderId: string
  status:  string
}

const DISPUTABLE = ['paid', 'in_delivery', 'delivered']

export default function BuyerActions({ orderId, status }: Props) {
  const router = useRouter()
  const [loading, setLoading]     = useState<string | null>(null)
  const [showDispute, setShowDispute] = useState(false)
  const [disputeReason, setDisputeReason] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function confirmReceipt() {
    setLoading('confirm')
    setError(null)
    try {
      const res = await fetch(`/api/orders/${orderId}/confirm`, { method: 'POST' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erro ao confirmar')
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido')
    } finally {
      setLoading(null)
    }
  }

  async function openDispute() {
    if (disputeReason.length < 10) {
      setError('Descreva o motivo com pelo menos 10 caracteres.')
      return
    }
    setLoading('dispute')
    setError(null)
    try {
      const res = await fetch(`/api/orders/${orderId}/dispute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: disputeReason }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erro ao abrir disputa')
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido')
    } finally {
      setLoading(null)
      setShowDispute(false)
    }
  }

  const canConfirm = status === 'delivered'
  const canDispute = DISPUTABLE.includes(status)

  if (!canConfirm && !canDispute) return null

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-3">
      <h3 className="font-semibold text-white">Ações</h3>

      {error && (
        <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-2">
          {error}
        </p>
      )}

      {canConfirm && (
        <button
          onClick={confirmReceipt}
          disabled={loading === 'confirm'}
          className="w-full rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-500 disabled:opacity-60 transition-colors"
        >
          {loading === 'confirm' ? 'Confirmando…' : '✓ Confirmar recebimento'}
        </button>
      )}

      {canDispute && !showDispute && (
        <button
          onClick={() => { setShowDispute(true); setError(null) }}
          className="w-full rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-400 hover:bg-red-500/20 transition-colors"
        >
          ⚑ Abrir disputa
        </button>
      )}

      {showDispute && (
        <div className="space-y-3">
          <textarea
            value={disputeReason}
            onChange={(e) => setDisputeReason(e.target.value)}
            placeholder="Descreva o problema com o pedido (mínimo 10 caracteres)…"
            rows={3}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-violet-500 resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={openDispute}
              disabled={loading === 'dispute'}
              className="flex-1 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-60 transition-colors"
            >
              {loading === 'dispute' ? 'Enviando…' : 'Confirmar disputa'}
            </button>
            <button
              onClick={() => { setShowDispute(false); setError(null) }}
              className="rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
