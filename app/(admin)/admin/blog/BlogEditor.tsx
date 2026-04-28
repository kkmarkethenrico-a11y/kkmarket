'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type BlogPost = {
  id?: string
  title?: string
  slug?: string
  excerpt?: string | null
  content?: string
  cover_url?: string | null
  reading_time?: number
  seo_title?: string | null
  seo_description?: string | null
  is_published?: boolean
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function BlogEditor({ initial }: { initial?: BlogPost }) {
  const router = useRouter()
  const isEdit = !!initial?.id

  const [form, setForm] = useState<BlogPost>({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    cover_url: '',
    reading_time: 1,
    seo_title: '',
    seo_description: '',
    is_published: false,
    ...initial,
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  function set(field: keyof BlogPost) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = e.target.type === 'checkbox'
        ? (e.target as HTMLInputElement).checked
        : e.target.value
      setForm(prev => {
        const next = { ...prev, [field]: value }
        if (field === 'title' && !isEdit) {
          next.slug = slugify(value as string)
        }
        return next
      })
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const url = isEdit ? `/api/admin/blog/${initial!.id}` : '/api/admin/blog'
      const method = isEdit ? 'PATCH' : 'POST'
      const body = {
        title: form.title,
        slug: form.slug,
        excerpt: form.excerpt || null,
        content: form.content,
        cover_url: form.cover_url || null,
        reading_time: Number(form.reading_time) || 1,
        seo_title: form.seo_title || null,
        seo_description: form.seo_description || null,
        is_published: form.is_published,
      }
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Erro ao salvar'); return }
      router.push('/admin/blog')
      router.refresh()
    } catch {
      setError('Erro de rede')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6 max-w-3xl">
      {error && (
        <div className="rounded-lg bg-red-500/20 border border-red-500/30 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Título */}
      <div>
        <label className="block text-sm font-medium text-white/70 mb-1">Título *</label>
        <input
          type="text"
          required
          value={form.title}
          onChange={set('title')}
          placeholder="Título do post"
          className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Slug */}
      <div>
        <label className="block text-sm font-medium text-white/70 mb-1">Slug *</label>
        <input
          type="text"
          required
          value={form.slug}
          onChange={set('slug')}
          placeholder="meu-post"
          pattern="[a-z0-9-]+"
          className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
        />
      </div>

      {/* Resumo */}
      <div>
        <label className="block text-sm font-medium text-white/70 mb-1">Resumo (excerpt)</label>
        <textarea
          rows={2}
          value={form.excerpt ?? ''}
          onChange={set('excerpt')}
          placeholder="Breve descrição do post..."
          className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
        />
      </div>

      {/* Conteúdo */}
      <div>
        <label className="block text-sm font-medium text-white/70 mb-1">Conteúdo (Markdown) *</label>
        <textarea
          rows={18}
          required
          value={form.content}
          onChange={set('content')}
          placeholder="# Título do post&#10;&#10;Escreva o conteúdo em Markdown..."
          className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y font-mono"
        />
      </div>

      {/* URL da capa */}
      <div>
        <label className="block text-sm font-medium text-white/70 mb-1">URL da imagem de capa</label>
        <input
          type="url"
          value={form.cover_url ?? ''}
          onChange={set('cover_url')}
          placeholder="https://..."
          className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Tempo de leitura */}
      <div className="w-40">
        <label className="block text-sm font-medium text-white/70 mb-1">Tempo de leitura (min) *</label>
        <input
          type="number"
          required
          min={1}
          value={form.reading_time}
          onChange={set('reading_time')}
          className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* SEO */}
      <div className="rounded-lg border border-white/10 bg-white/5 p-4 space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-white/50">SEO</p>
        <div>
          <label className="block text-sm font-medium text-white/70 mb-1">Title tag</label>
          <input
            type="text"
            value={form.seo_title ?? ''}
            onChange={set('seo_title')}
            maxLength={80}
            placeholder="Deixe vazio para usar o título do post"
            className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-white/70 mb-1">Meta description</label>
          <textarea
            rows={2}
            value={form.seo_description ?? ''}
            onChange={set('seo_description')}
            maxLength={200}
            placeholder="Deixe vazio para usar o resumo"
            className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
        </div>
      </div>

      {/* Publicar */}
      <label className="flex items-center gap-3 cursor-pointer group">
        <input
          type="checkbox"
          checked={!!form.is_published}
          onChange={set('is_published')}
          className="w-4 h-4 rounded accent-indigo-500"
        />
        <span className="text-sm font-medium text-white/80">Publicar imediatamente</span>
      </label>

      {/* Ações */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
        >
          {busy ? 'Salvando...' : isEdit ? 'Salvar alterações' : 'Criar post'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/admin/blog')}
          className="rounded-lg border border-white/10 px-6 py-2 text-sm font-medium text-white/60 hover:text-white hover:border-white/20 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
