'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { AnnouncementPlan } from '@/types'

interface PlanOption {
  key: AnnouncementPlan
  label: string
  fee: number
  badge: string
  tag: { text: string; tone: 'amber' | 'violet' } | null
  description: string
  visibility: string
}

const PLAN_OPTIONS: PlanOption[] = [
  {
    key:         'silver',
    label:       'Prata',
    fee:         0.0999,
    badge:       '🥈',
    tag:         null,
    description: 'Anúncio básico — taxa 9,99%',
    visibility:  'Posição orgânica por vendas. Sem destaque visual.',
  },
  {
    key:         'gold',
    label:       'Ouro',
    fee:         0.1199,
    badge:       '🥇',
    tag:         { text: 'POPULAR', tone: 'amber' },
    description: 'Destaque na home — taxa 11,99%',
    visibility:  'Aparece na seção "Mais Vistos" da categoria + badge GOLD no card.',
  },
  {
    key:         'diamond',
    label:       'Diamante',
    fee:         0.1299,
    badge:       '💎',
    tag:         { text: 'TOP', tone: 'violet' },
    description: 'Máxima visibilidade — taxa 12,99%',
    visibility:  'Aparece em "Em Destaque" na home + badge DIAMOND no card. Topo da busca.',
  },
]

const SIM = 100

export default function UpgradePlanForm({
  announcementId,
  currentPlan,
}: {
  announcementId: string
  currentPlan: AnnouncementPlan
}) {
  const router = useRouter()
  const [selected, setSelected] = useState<AnnouncementPlan>(currentPlan)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const tagCls: Record<'amber' | 'violet', string> = {
    amber:  'bg-amber-500 text-amber-950',
    violet: 'bg-violet-600 text-white',
  }

  const cardCls: Record<AnnouncementPlan, string> = {
    silver:  'border-zinc-700 bg-zinc-900/40',
    gold:    'border-amber-500/40 bg-amber-500/5',
    diamond: 'border-violet-500/40 bg-violet-500/5',
  }

  const ringCls: Record<AnnouncementPlan, string> = {
    silver:  'ring-2 ring-zinc-400',
    gold:    'ring-2 ring-amber-400 shadow-amber-500/30',
    diamond: 'ring-2 ring-violet-400 shadow-violet-500/30',
  }

  async function submit() {
    setError(null)
    if (selected === currentPlan) {
      setError('Selecione um plano diferente do atual.')
      return
    }
    startTransition(async () => {
      const res = await fetch(`/api/announcements/${announcementId}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ plan: selected }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        setError(j.error ?? 'Erro ao atualizar plano.')
        return
      }
      router.push('/meus-anuncios?upgraded=1')
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {PLAN_OPTIONS.map((p) => {
          const sellerReceives = SIM - SIM * p.fee
          const isSelected = selected === p.key
          const isCurrent  = currentPlan === p.key

          return (
            <button
              key={p.key}
              type="button"
              onClick={() => setSelected(p.key)}
              className={`relative flex flex-col gap-3 rounded-2xl border p-4 text-left transition-all ${cardCls[p.key]} ${isSelected ? `${ringCls[p.key]} shadow-lg` : 'opacity-80 hover:opacity-100'}`}
            >
              {p.tag && (
                <span
                  className={`absolute -top-2 right-3 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow ${tagCls[p.tag.tone]}`}
                >
                  {p.tag.text}
                </span>
              )}
              {isCurrent && (
                <span className="absolute -top-2 left-3 rounded-full bg-zinc-700 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-200 shadow">
                  ATUAL
                </span>
              )}

              <div className="flex items-center gap-2 font-semibold text-zinc-100">
                <span className="text-xl">{p.badge}</span>
                <span>{p.label}</span>
              </div>

              <p className="text-sm text-zinc-300">{p.description}</p>
              <p className="text-xs leading-relaxed text-zinc-500">{p.visibility}</p>

              <div className="mt-auto space-y-1 border-t border-zinc-800/60 pt-3">
                <p className="text-sm font-bold text-zinc-100">
                  Taxa {(p.fee * 100).toFixed(2).replace('.', ',')}%
                </p>
                <p className="text-[11px] text-zinc-500">
                  Em uma venda de <span className="font-semibold text-zinc-300">R$ 100,00</span>, você recebe{' '}
                  <span className="font-bold text-green-400">
                    R$ {sellerReceives.toFixed(2).replace('.', ',')}
                  </span>
                </p>
              </div>
            </button>
          )
        })}
      </div>

      {error && (
        <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          disabled={pending}
          className="rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={pending || selected === currentPlan}
          className="rounded-xl bg-violet-600 px-5 py-2 text-sm font-semibold text-white hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? 'Atualizando…' : 'Confirmar troca de plano'}
        </button>
      </div>
    </div>
  )
}
