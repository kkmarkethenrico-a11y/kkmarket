'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useWizardStore, PLANS } from './wizard-store'
import { createClient } from '@/lib/supabase/client'
import type { Category } from '@/types'

interface Step4Props {
  categories: Category[]
}

export function Step4Review({ categories }: Step4Props) {
  const router = useRouter()
  const { draft, prevStep, resetDraft } = useWizardStore()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [success, setSuccess]       = useState(false)

  const category = categories.find((c) => c.id === draft.category_id)
  const plan = PLANS[draft.plan]

  async function handlePublish() {
    setSubmitting(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Sessão expirada. Faça login novamente.')

      const body: Record<string, unknown> = {
        category_id:      draft.category_id,
        title:            draft.title,
        description:      draft.description,
        model:            draft.model,
        plan:             draft.plan,
        has_auto_delivery: draft.has_auto_delivery,
        filters_data:     draft.filters_data,
        cover_url:        draft.cover_preview,
        gallery_urls:     draft.gallery_previews,
      }

      if (draft.model === 'normal') {
        body.unit_price     = parseFloat(draft.unit_price)
        body.stock_quantity = parseInt(draft.stock_quantity)
      } else {
        body.variations = draft.variations.map((v, i) => ({
          title:          v.title,
          unit_price:     parseFloat(v.unit_price),
          stock_quantity: parseInt(v.stock_quantity),
          sort_order:     i,
        }))
      }

      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error ?? `Erro ${res.status}`)
      }

      setSuccess(true)
      resetDraft()
      setTimeout(() => router.push('/meus-anuncios'), 3000)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro inesperado.')
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-16 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-500/20">
          <span className="text-4xl">✅</span>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Anúncio enviado!</h2>
          <p className="mt-2 text-sm text-zinc-400">
            Seu anúncio está em análise (até 6 horas). Você será notificado por e-mail quando for aprovado.
          </p>
        </div>
        <p className="text-xs text-zinc-600">Redirecionando para seus anúncios…</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-lg font-semibold text-zinc-100">Revisão do anúncio</h2>
        <p className="mt-1 text-sm text-zinc-400">Confira todas as informações antes de publicar.</p>
      </div>

      {/* Preview card */}
      <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50">
        {/* Cover */}
        {draft.cover_preview && (
          <div className="relative aspect-video w-full">
            <Image src={draft.cover_preview} alt="Capa do anúncio" fill className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 to-transparent" />
          </div>
        )}

        <div className="flex flex-col gap-4 p-6">
          {/* Category breadcrumb */}
          <div className="flex gap-1.5 text-xs text-zinc-500">
            <span>{draft.root_category_name}</span>
            <span>/</span>
            <span className="text-violet-400">{draft.category_name}</span>
          </div>

          {/* Title + plan */}
          <div className="flex items-start justify-between gap-4">
            <h3 className="text-xl font-bold text-white">{draft.title || '—'}</h3>
            <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${
              draft.plan === 'diamond' ? 'bg-cyan-500/20 text-cyan-300' :
              draft.plan === 'gold'    ? 'bg-yellow-500/20 text-yellow-300' :
                                         'bg-zinc-700 text-zinc-300'}`}>
              {plan.badge} {plan.label}
            </span>
          </div>

          {/* Price / variations */}
          {draft.model === 'normal' ? (
            <div className="flex items-center gap-6">
              <span className="text-2xl font-bold text-green-400">
                R$ {parseFloat(draft.unit_price || '0').toFixed(2)}
              </span>
              <span className="text-sm text-zinc-500">
                Estoque: {draft.stock_quantity || 0} un.
              </span>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-zinc-400">Variações:</span>
              <div className="flex flex-wrap gap-2">
                {draft.variations.map((v) => (
                  <div key={v.id} className="rounded-xl border border-zinc-700 bg-zinc-800/40 px-3 py-2 text-sm">
                    <span className="font-medium text-zinc-200">{v.title}</span>
                    <span className="ml-2 text-green-400 font-bold">R$ {parseFloat(v.unit_price || '0').toFixed(2)}</span>
                    <span className="ml-2 text-xs text-zinc-500">({v.stock_quantity || 0} un.)</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          <div className="rounded-xl bg-zinc-800/40 p-4 text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
            {draft.description || <span className="text-zinc-600">Sem descrição</span>}
          </div>

          {/* Gallery */}
          {draft.gallery_previews.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {draft.gallery_previews.map((src, i) => (
                <div key={i} className="relative h-16 w-24 shrink-0 overflow-hidden rounded-xl">
                  <Image src={src} alt={`Imagem ${i + 1}`} fill className="object-cover" />
                </div>
              ))}
            </div>
          )}

          {/* Meta badges */}
          <div className="flex flex-wrap gap-2">
            {draft.has_auto_delivery && (
              <span className="rounded-full bg-green-500/20 px-3 py-1 text-xs font-medium text-green-400">
                ⚡ Entrega automática
              </span>
            )}
            <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-400">
              Taxa: {(plan.fee * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      </div>

      {/* Resumo em tabela */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-4">
        <table className="w-full text-sm">
          <tbody className="divide-y divide-zinc-800">
            {[
              { label: 'Categoria', value: `${draft.root_category_name} › ${draft.category_name}` },
              { label: 'Modelo',    value: draft.model === 'normal' ? 'Normal' : 'Dinâmico (Variações)' },
              { label: 'Plano',     value: `${plan.badge} ${plan.label} — taxa ${(plan.fee * 100).toFixed(0)}%` },
              { label: 'Imagens',   value: `1 capa + ${draft.gallery_previews.length} extras` },
              { label: 'Entrega',   value: draft.has_auto_delivery ? 'Automática ⚡' : 'Manual' },
            ].map(({ label, value }) => (
              <tr key={label}>
                <td className="py-2.5 pr-4 font-medium text-zinc-500">{label}</td>
                <td className="py-2.5 text-zinc-200">{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ⚠ Moderação aviso */}
      <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 px-5 py-4 text-sm text-yellow-300">
        ⏱ Após publicar, seu anúncio entrará em análise pela equipe GameMarket (até 6 horas). Você receberá uma notificação quando for aprovado ou rejeitado.
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <button type="button" onClick={prevStep}
          className="rounded-xl border border-zinc-700 px-5 py-3 text-sm font-medium text-zinc-300 hover:border-zinc-600 hover:text-white">
          ← Voltar
        </button>
        <button
          type="button"
          onClick={handlePublish}
          disabled={submitting}
          className="flex items-center gap-2 rounded-xl bg-green-600 px-8 py-3 text-sm font-bold text-white transition-all hover:bg-green-500 disabled:opacity-60"
        >
          {submitting ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Publicando…
            </>
          ) : '🚀 Publicar Anúncio'}
        </button>
      </div>
    </div>
  )
}
