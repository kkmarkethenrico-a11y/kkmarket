'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function AdminBlogActions({ postId, isPublished }: { postId: string; isPublished: boolean }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function togglePublish() {
    setBusy(true)
    try {
      await fetch(`/api/admin/blog/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_published: !isPublished,
          published_at: !isPublished ? new Date().toISOString() : null,
        }),
      })
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  async function deletePost() {
    if (!confirm('Excluir este post permanentemente?')) return
    setBusy(true)
    try {
      await fetch(`/api/admin/blog/${postId}`, { method: 'DELETE' })
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex gap-1">
      <button
        disabled={busy}
        onClick={togglePublish}
        className={`rounded-md px-3 py-1.5 text-xs font-medium disabled:opacity-50 transition-colors ${
          isPublished
            ? 'bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30'
            : 'bg-green-500/20 text-green-300 hover:bg-green-500/30'
        }`}
      >
        {isPublished ? 'Despublicar' : 'Publicar'}
      </button>
      <button
        disabled={busy}
        onClick={deletePost}
        className="rounded-md px-3 py-1.5 text-xs font-medium bg-red-500/20 text-red-300 hover:bg-red-500/30 disabled:opacity-50"
      >
        Excluir
      </button>
    </div>
  )
}
