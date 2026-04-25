'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

type Tab = 'pending' | 'fraudulent' | 'suspicious' | 'rejected'

interface Row {
  id:             string
  identifier:     string
  status:         string
  description:    string | null
  evidence_url:   string | null
  reporter_email: string | null
  moderator_note: string | null
  moderated_at:   string | null
  created_at:     string
  reported_by:    string | null
  verified_by:    string | null
  categories:     { id: string; name: string; slug: string } | null
  reporter:       { username: string; display_name: string | null } | null
}

interface Props {
  rows:       Row[]
  currentTab: Tab
  counts:     Record<Tab, number>
  search:     string
}

const TAB_LABELS: Record<Tab, string> = {
  pending:    'Pendentes',
  fraudulent: 'Confirmadas',
  suspicious: 'Suspeitas',
  rejected:   'Rejeitadas',
}

const STATUS_CLS: Record<string, string> = {
  pending:    'bg-zinc-700 text-zinc-200',
  fraudulent: 'bg-red-500/20 text-red-300',
  suspicious: 'bg-amber-500/20 text-amber-300',
  rejected:   'bg-zinc-800 text-zinc-500',
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function VerifierAdminClient({ rows, currentTab, counts, search }: Props) {
  const router = useRouter()
  const sp     = useSearchParams()
  const [active, setActive]     = useState<Row | null>(null)
  const [searchInput, setInput] = useState(search)
  const [pending, startTransition] = useTransition()

  function setTab(t: Tab) {
    const params = new URLSearchParams(sp.toString())
    params.set('tab', t)
    router.push(`?${params.toString()}`)
  }

  function submitSearch(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams(sp.toString())
    if (searchInput.trim()) params.set('q', searchInput.trim())
    else params.delete('q')
    router.push(`?${params.toString()}`)
  }

  async function moderate(action: 'confirm_fraud' | 'mark_suspicious' | 'reject', note?: string) {
    if (!active) return
    startTransition(async () => {
      const res = await fetch(`/api/admin/verifier/${active.id}/moderate`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ action, note }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        alert(j.error ?? 'Erro ao moderar.')
        return
      }
      setActive(null)
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(TAB_LABELS) as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              currentTab === t
                ? 'bg-violet-600 text-white'
                : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
            }`}
          >
            {TAB_LABELS[t]}
            {counts[t] > 0 && (
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                currentTab === t ? 'bg-white/20' : 'bg-zinc-800'
              }`}>
                {counts[t]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search */}
      <form onSubmit={submitSearch} className="flex gap-2">
        <input
          type="text"
          placeholder="Buscar por identificador (email/usuário/CPF)"
          value={searchInput}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-violet-500"
        />
        <button
          type="submit"
          className="rounded-lg bg-zinc-800 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-700"
        >
          Buscar
        </button>
      </form>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-zinc-800">
        {rows.length === 0 ? (
          <div className="p-10 text-center text-sm text-zinc-500">
            Nenhum registro nesta aba.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/60 text-left text-xs uppercase tracking-wider text-zinc-500">
                <th className="px-4 py-3">Identificador</th>
                <th className="px-4 py-3">Jogo</th>
                <th className="px-4 py-3">Status</th>
                <th className="hidden px-4 py-3 md:table-cell">Denunciante</th>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-zinc-900/40">
                  <td className="max-w-xs truncate px-4 py-3 font-mono text-xs text-zinc-200">
                    {r.identifier}
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-400">
                    {r.categories?.name ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_CLS[r.status] ?? STATUS_CLS.pending}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 text-xs text-zinc-500 md:table-cell">
                    {r.reporter?.display_name ?? r.reporter?.username ?? r.reporter_email ?? 'Anônimo'}
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-500">{formatDate(r.created_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setActive(r)}
                      className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-200 hover:bg-zinc-800"
                    >
                      Revisar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Review modal */}
      {active && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setActive(null)}
        >
          <div
            className="w-full max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Revisar denúncia</h3>
                <p className="mt-0.5 font-mono text-sm text-zinc-400">{active.identifier}</p>
              </div>
              <button
                type="button"
                onClick={() => setActive(null)}
                className="text-zinc-500 hover:text-zinc-200"
              >
                ✕
              </button>
            </div>

            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs text-zinc-500">Jogo</dt>
                <dd className="text-zinc-200">{active.categories?.name ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-500">Status atual</dt>
                <dd>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_CLS[active.status] ?? STATUS_CLS.pending}`}>
                    {active.status}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-500">Descrição</dt>
                <dd className="whitespace-pre-wrap rounded-lg border border-zinc-800 bg-zinc-900/50 p-3 text-sm text-zinc-300">
                  {active.description ?? '—'}
                </dd>
              </div>
              {active.evidence_url && (
                <div>
                  <dt className="text-xs text-zinc-500">Evidência</dt>
                  <dd>
                    <a
                      href={active.evidence_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-violet-400 underline hover:text-violet-300"
                    >
                      {active.evidence_url}
                    </a>
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-xs text-zinc-500">Denunciante</dt>
                <dd className="text-zinc-300">
                  {active.reporter?.display_name ?? active.reporter?.username
                    ?? active.reporter_email ?? 'Anônimo'}
                </dd>
              </div>
              {active.moderator_note && (
                <div>
                  <dt className="text-xs text-zinc-500">Nota anterior do moderador</dt>
                  <dd className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3 text-sm text-zinc-300">
                    {active.moderator_note}
                  </dd>
                </div>
              )}
            </dl>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={pending}
                onClick={() => moderate('reject')}
                className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 disabled:opacity-50"
              >
                Rejeitar denúncia
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => moderate('mark_suspicious')}
                className="rounded-lg bg-amber-600/90 px-4 py-2 text-sm font-semibold text-amber-50 hover:bg-amber-500 disabled:opacity-50"
              >
                ⚠️ Marcar suspeito
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => moderate('confirm_fraud')}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50"
              >
                🚨 Confirmar fraude
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
