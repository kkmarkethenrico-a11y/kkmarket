'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function AdminReportActions({ reportId }: { reportId: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [note, setNote] = useState('')

  async function resolve(decision: 'accepted' | 'rejected') {
    setError(null)
    setBusy(true)
    try {
      const res = await fetch(`/api/admin/reports/${reportId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, note }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erro')
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro inesperado')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="border-t pt-3 space-y-2">
      {error && <p className="text-xs text-red-400">{error}</p>}
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Nota interna (opcional)"
        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        rows={2}
        maxLength={300}
      />
      <div className="flex gap-2">
        <button
          disabled={busy}
          onClick={() => resolve('accepted')}
          className="rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-500 disabled:opacity-50"
        >
          Aceitar denúncia
        </button>
        <button
          disabled={busy}
          onClick={() => resolve('rejected')}
          className="rounded-md bg-zinc-700 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-600 disabled:opacity-50"
        >
          Rejeitar
        </button>
      </div>
    </div>
  )
}
