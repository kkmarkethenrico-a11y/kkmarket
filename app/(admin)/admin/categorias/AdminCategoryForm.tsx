'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  parents: { id: string; name: string }[]
}

export function AdminCategoryForm({ parents }: Props) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '', slug: '', icon: '', parent_id: '', sort_order: '0', balance_release_days: '4',
    is_featured: false, show_in_menu: true,
  })

  function set(key: string, value: string | boolean) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  // Auto-generate slug from name
  function handleName(value: string) {
    set('name', value)
    set('slug', value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!form.name.trim() || !form.slug.trim()) {
      setError('Nome e slug são obrigatórios.')
      return
    }
    setBusy(true)
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          slug: form.slug,
          icon: form.icon || null,
          parent_id: form.parent_id || null,
          sort_order: parseInt(form.sort_order) || 0,
          balance_release_days: parseInt(form.balance_release_days) || 4,
          is_featured: form.is_featured,
          show_in_menu: form.show_in_menu,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erro ao criar')
      setForm({ name: '', slug: '', icon: '', parent_id: '', sort_order: '0', balance_release_days: '4', is_featured: false, show_in_menu: true })
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro inesperado')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">{error}</p>}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="col-span-2">
          <label className="block text-xs font-medium text-muted-foreground mb-1">Nome *</label>
          <input value={form.name} onChange={(e) => handleName(e.target.value)} required
            className="w-full rounded-md border bg-background px-3 py-2 text-sm" placeholder="Ex: Jogos" />
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-medium text-muted-foreground mb-1">Slug *</label>
          <input value={form.slug} onChange={(e) => set('slug', e.target.value)} required
            className="w-full rounded-md border bg-background px-3 py-2 text-sm font-mono" placeholder="ex: jogos" />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Ícone (emoji)</label>
          <input value={form.icon} onChange={(e) => set('icon', e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm" placeholder="🎮" />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Categoria pai</label>
          <select value={form.parent_id} onChange={(e) => set('parent_id', e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm">
            <option value="">— Raiz —</option>
            {parents.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Ordem</label>
          <input type="number" value={form.sort_order} onChange={(e) => set('sort_order', e.target.value)} min={0}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Dias liberação</label>
          <input type="number" value={form.balance_release_days} onChange={(e) => set('balance_release_days', e.target.value)} min={1}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
        </div>
      </div>
      <div className="flex gap-4">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={form.is_featured} onChange={(e) => set('is_featured', e.target.checked)} className="rounded" />
          Em destaque
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={form.show_in_menu} onChange={(e) => set('show_in_menu', e.target.checked)} className="rounded" />
          Mostrar no menu
        </label>
      </div>
      <button type="submit" disabled={busy}
        className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50">
        {busy ? 'Criando…' : 'Criar categoria'}
      </button>
    </form>
  )
}
