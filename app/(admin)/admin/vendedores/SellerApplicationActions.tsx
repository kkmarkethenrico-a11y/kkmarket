'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function SellerApplicationActions({ userId }: { userId: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showReject, setShowReject] = useState(false)
  const [reason, setReason] = useState('')

  async function decide(decision: 'approve' | 'reject') {
    setError(null)
    if (decision === 'reject' && !reason.trim()) {
      setError('Informe o motivo da rejeição.')
      return
    }
    setBusy(true)
    try {
      const res = await fetch(`/api/admin/seller-applications/${userId}/decide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, reason: decision === 'reject' ? reason : undefined }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Falha ao processar')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-2 border-t pt-4">
      {error && <p className="text-xs text-red-500">{error}</p>}
      {!showReject ? (
        <div className="flex gap-2">
          <button
            disabled={busy}
            onClick={() => decide('approve')}
            className="rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-500 disabled:opacity-50"
          >
            Aprovar
          </button>
          <button
            disabled={busy}
            onClick={() => setShowReject(true)}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50"
          >
            Rejeitar
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Motivo da rejeição (será mostrado ao usuário)"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            rows={3}
            maxLength={500}
          />
          <div className="flex gap-2">
            <button
              disabled={busy}
              onClick={() => decide('reject')}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50"
            >
              Confirmar rejeição
            </button>
            <button
              disabled={busy}
              onClick={() => { setShowReject(false); setReason(''); setError(null) }}
              className="rounded-md border px-4 py-2 text-sm hover:bg-muted disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
