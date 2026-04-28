'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function AdminCategoryActions({ categoryId, currentStatus }: { categoryId: string; currentStatus: boolean }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function toggle() {
    setBusy(true)
    try {
      await fetch(`/api/admin/categories/${categoryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: !currentStatus }),
      })
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      disabled={busy}
      onClick={toggle}
      className={`rounded px-2 py-1 text-[11px] font-medium disabled:opacity-50 transition-colors ${
        currentStatus
          ? 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
          : 'bg-green-500/20 text-green-300 hover:bg-green-500/30'
      }`}
    >
      {currentStatus ? 'Desativar' : 'Ativar'}
    </button>
  )
}
