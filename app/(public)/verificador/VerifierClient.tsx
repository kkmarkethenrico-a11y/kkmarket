'use client'

import { useState, useTransition } from 'react'

interface Game {
  id:   string
  name: string
  slug: string
}

interface Match {
  id:           string
  identifier:   string
  status:       string         // 'fraudulent' | 'suspicious'
  description:  string | null
  evidence_url: string | null
  created_at:   string
  categories:   { id: string; name: string; slug: string } | null
}

type SearchState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'found';     identifier: string; matches: Match[] }
  | { kind: 'not_found'; identifier: string }
  | { kind: 'error';     message: string }

// ─── CPF mask helpers ─────────────────────────────────────────────────────────
function isLikelyCpf(s: string): boolean {
  return /^[\d.\-\s]{6,}$/.test(s)
}
function maskCpf(s: string): string {
  const digits = s.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 3)  return digits
  if (digits.length <= 6)  return `${digits.slice(0, 3)}.${digits.slice(3)}`
  if (digits.length <= 9)  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

const STATUS_CONFIG: Record<string, { label: string; cls: string; icon: string }> = {
  fraudulent: { label: 'Conta fraudulenta confirmada', icon: '🚨', cls: 'border-red-500/40 bg-red-500/10 text-red-200' },
  suspicious: { label: 'Conta sob suspeita',           icon: '⚠️',  cls: 'border-amber-500/40 bg-amber-500/10 text-amber-200' },
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function VerifierClient({ games }: { games: Game[] }) {
  const [query, setQuery]       = useState('')
  const [state, setState]       = useState<SearchState>({ kind: 'idle' })
  const [showReport, setReport] = useState(false)
  const [isPending, startTransition] = useTransition()

  function onChange(v: string) {
    if (isLikelyCpf(v) && /^\d/.test(v.replace(/\D/g, '')) && v.replace(/\D/g, '').length >= 6) {
      setQuery(maskCpf(v))
    } else {
      setQuery(v)
    }
  }

  async function search(e?: React.FormEvent) {
    e?.preventDefault()
    const id = query.trim()
    if (id.length < 3) {
      setState({ kind: 'error', message: 'Informe pelo menos 3 caracteres.' })
      return
    }
    setState({ kind: 'loading' })
    startTransition(async () => {
      try {
        const res = await fetch(`/api/verifier?identifier=${encodeURIComponent(id)}`, {
          method: 'GET',
        })
        const j = await res.json()
        if (!res.ok) {
          setState({ kind: 'error', message: j.error ?? 'Erro ao consultar.' })
          return
        }
        if (j.found && j.matches.length > 0) {
          setState({ kind: 'found', identifier: id, matches: j.matches })
        } else {
          setState({ kind: 'not_found', identifier: id })
        }
      } catch {
        setState({ kind: 'error', message: 'Erro de rede.' })
      }
    })
  }

  return (
    <div className="space-y-8">
      {/* Search form */}
      <form
        onSubmit={search}
        className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-6"
      >
        <label htmlFor="verifier-input" className="mb-2 block text-sm font-medium text-zinc-300">
          Email, usuário ou CPF da conta
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id="verifier-input"
            type="text"
            value={query}
            onChange={(e) => onChange(e.target.value)}
            placeholder="ex: jogador@exemplo.com / Player123 / 123.456.789-00"
            className="flex-1 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-violet-500"
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={isPending}
            className="rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? 'Verificando…' : 'Verificar'}
          </button>
        </div>
        <p className="mt-2 text-[11px] text-zinc-500">
          A consulta é anônima. Aceita email, nome de usuário ou CPF (mascarado automaticamente).
        </p>
      </form>

      {/* Results */}
      {state.kind === 'error' && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {state.message}
        </div>
      )}

      {state.kind === 'not_found' && (
        <div className="rounded-2xl border border-green-500/30 bg-green-500/10 px-5 py-6 text-center">
          <div className="mb-2 text-4xl">✅</div>
          <h3 className="text-lg font-semibold text-green-200">
            Identificador não registrado
          </h3>
          <p className="mt-1 text-sm text-green-300/80">
            <span className="font-mono">{state.identifier}</span> não consta em nossa base.
            Provavelmente é uma conta limpa, mas mantenha-se atento e use o escrow da KKMarket.
          </p>
          <button
            type="button"
            onClick={() => setReport(true)}
            className="mt-4 rounded-full border border-zinc-700 bg-zinc-900/60 px-4 py-2 text-xs text-zinc-300 hover:border-zinc-600 hover:bg-zinc-800"
          >
            Esta conta já me prejudicou — quero denunciar
          </button>
        </div>
      )}

      {state.kind === 'found' && (
        <div className="space-y-3">
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            <strong>{state.matches.length} ocorrência(s) encontrada(s)</strong> para{' '}
            <span className="font-mono">{state.identifier}</span>. <strong>Não recomendamos</strong> a compra desta conta.
          </div>

          {state.matches.map((m) => {
            const cfg = STATUS_CONFIG[m.status] ?? STATUS_CONFIG.suspicious
            return (
              <div
                key={m.id}
                className={`rounded-2xl border p-5 ${cfg.cls}`}
              >
                <div className="mb-2 flex items-center gap-3">
                  <span className="text-2xl">{cfg.icon}</span>
                  <div>
                    <h4 className="font-semibold">{cfg.label}</h4>
                    <p className="text-xs opacity-80">
                      {m.categories?.name ?? 'Jogo não especificado'} · Registrado em {formatDate(m.created_at)}
                    </p>
                  </div>
                </div>
                {m.description && (
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed opacity-95">
                    {m.description}
                  </p>
                )}
                {m.evidence_url && (
                  <a
                    href={m.evidence_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-block text-xs underline opacity-80 hover:opacity-100"
                  >
                    Ver evidência →
                  </a>
                )}
              </div>
            )
          })}

          <div className="text-center">
            <button
              type="button"
              onClick={() => setReport(true)}
              className="rounded-full border border-zinc-700 bg-zinc-900/60 px-4 py-2 text-xs text-zinc-300 hover:border-zinc-600 hover:bg-zinc-800"
            >
              Esta conta também me prejudicou — adicionar denúncia
            </button>
          </div>
        </div>
      )}

      {/* Always-available report CTA when idle */}
      {state.kind === 'idle' && (
        <div className="text-center">
          <button
            type="button"
            onClick={() => setReport(true)}
            className="rounded-full border border-zinc-700 bg-zinc-900/60 px-4 py-2 text-xs text-zinc-300 hover:border-zinc-600 hover:bg-zinc-800"
          >
            Foi vítima de fraude? Denunciar conta
          </button>
        </div>
      )}

      {/* Report modal */}
      {showReport && (
        <ReportModal
          games={games}
          initialIdentifier={query}
          onClose={() => setReport(false)}
        />
      )}
    </div>
  )
}

// ─── Report Modal ────────────────────────────────────────────────────────────
function ReportModal({
  games,
  initialIdentifier,
  onClose,
}: {
  games: Game[]
  initialIdentifier: string
  onClose: () => void
}) {
  const [identifier, setIdentifier]   = useState(initialIdentifier)
  const [gameId, setGameId]           = useState('')
  const [status, setStatus]           = useState<'fraudulent' | 'suspicious'>('fraudulent')
  const [description, setDescription] = useState('')
  const [evidenceUrl, setEvidenceUrl] = useState('')
  const [reporterEmail, setEmail]     = useState('')
  const [pending, setPending]         = useState(false)
  const [done, setDone]               = useState(false)
  const [error, setError]             = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (description.length < 20) {
      setError('Descreva o ocorrido com pelo menos 20 caracteres.')
      return
    }
    setPending(true)
    try {
      const res = await fetch('/api/verifier', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier,
          game_id:        gameId || null,
          status,
          description,
          evidence_url:   evidenceUrl || null,
          reporter_email: reporterEmail || null,
        }),
      })
      const j = await res.json()
      if (!res.ok) {
        setError(j.error ?? 'Erro ao enviar denúncia.')
        return
      }
      setDone(true)
    } catch {
      setError('Erro de rede.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">Denunciar conta fraudulenta</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-200"
          >
            ✕
          </button>
        </div>

        {done ? (
          <div className="py-8 text-center">
            <div className="mb-3 text-5xl">✅</div>
            <h4 className="text-base font-semibold text-green-300">Denúncia recebida</h4>
            <p className="mt-2 text-sm text-zinc-400">
              Nossa equipe vai validar as evidências antes de publicar o registro.
              Obrigado por proteger a comunidade!
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-4 rounded-full bg-violet-600 px-5 py-2 text-sm font-semibold text-white hover:bg-violet-500"
            >
              Fechar
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3 text-sm">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-400">
                Identificador da conta (email/usuário/CPF) *
              </label>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-400">Jogo</label>
              <select
                value={gameId}
                onChange={(e) => setGameId(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white outline-none focus:border-violet-500"
              >
                <option value="">— Selecione —</option>
                {games.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-400">Tipo *</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setStatus('fraudulent')}
                  className={`rounded-lg border px-3 py-2 text-xs font-semibold ${status === 'fraudulent' ? 'border-red-500 bg-red-500/20 text-red-200' : 'border-zinc-700 bg-zinc-900 text-zinc-400'}`}
                >
                  🚨 Fraude confirmada
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('suspicious')}
                  className={`rounded-lg border px-3 py-2 text-xs font-semibold ${status === 'suspicious' ? 'border-amber-500 bg-amber-500/20 text-amber-200' : 'border-zinc-700 bg-zinc-900 text-zinc-400'}`}
                >
                  ⚠️ Suspeita
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-400">
                Descreva o ocorrido * <span className="text-zinc-600">({description.length}/2000)</span>
              </label>
              <textarea
                required
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={2000}
                placeholder="Ex: Comprei a conta em 12/03 e em 18/03 perdi acesso. O vendedor recuperou via email original."
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-400">
                URL da evidência (opcional)
              </label>
              <input
                type="url"
                value={evidenceUrl}
                onChange={(e) => setEvidenceUrl(e.target.value)}
                placeholder="https://imgur.com/..."
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-400">
                Seu email (opcional, para contato)
              </label>
              <input
                type="email"
                value={reporterEmail}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white outline-none focus:border-violet-500"
              />
            </div>

            {error && (
              <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                {error}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-zinc-700 px-4 py-2 text-xs text-zinc-300 hover:bg-zinc-800"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={pending}
                className="rounded-lg bg-violet-600 px-5 py-2 text-xs font-semibold text-white hover:bg-violet-500 disabled:opacity-60"
              >
                {pending ? 'Enviando…' : 'Enviar denúncia'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
