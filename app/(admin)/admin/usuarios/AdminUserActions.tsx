'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  userId: string
  currentRole: string
  currentStatus: string
  currentAdminId: string
}

export function AdminUserActions({ userId, currentRole, currentStatus, currentAdminId }: Props) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Prevent self-modification
  const isSelf = userId === currentAdminId

  async function act(action: string, extra?: Record<string, string>) {
    setError(null)
    setBusy(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...extra }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erro ao processar')
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro inesperado')
    } finally {
      setBusy(false)
    }
  }

  if (isSelf) return <span className="text-xs text-zinc-600">—</span>

  return (
    <div className="flex flex-col gap-1">
      {error && <p className="text-[10px] text-red-400">{error}</p>}
      <div className="flex flex-wrap gap-1">
        {currentStatus === 'active' && (
          <>
            <button
              disabled={busy}
              onClick={() => act('suspend')}
              className="rounded px-2 py-1 text-[11px] font-medium bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30 disabled:opacity-50"
            >
              Suspender
            </button>
            <button
              disabled={busy}
              onClick={() => act('ban')}
              className="rounded px-2 py-1 text-[11px] font-medium bg-red-500/20 text-red-300 hover:bg-red-500/30 disabled:opacity-50"
            >
              Banir
            </button>
          </>
        )}
        {currentStatus !== 'active' && (
          <button
            disabled={busy}
            onClick={() => act('activate')}
            className="rounded px-2 py-1 text-[11px] font-medium bg-green-500/20 text-green-300 hover:bg-green-500/30 disabled:opacity-50"
          >
            Ativar
          </button>
        )}
        {currentRole === 'client' && (
          <button
            disabled={busy}
            onClick={() => act('set_role', { role: 'moderator' })}
            className="rounded px-2 py-1 text-[11px] font-medium bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 disabled:opacity-50"
          >
            + Moderador
          </button>
        )}
        {currentRole === 'moderator' && (
          <button
            disabled={busy}
            onClick={() => act('set_role', { role: 'client' })}
            className="rounded px-2 py-1 text-[11px] font-medium bg-zinc-500/20 text-zinc-300 hover:bg-zinc-500/30 disabled:opacity-50"
          >
            – Moderador
          </button>
        )}
      </div>
    </div>
  )
}
