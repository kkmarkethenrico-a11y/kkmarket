import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { POINTS_TO_BRL_RATE, POINTS_MIN_REDEEM, POINTS_MAX_COVERAGE, POINTS_EXPIRY_DAYS } from '@/lib/points'

export const dynamic = 'force-dynamic'

type PointsTx = {
  id: string
  type: string
  amount: number
  expires_at: string | null
  description: string | null
  created_at: string
  reference_id: string | null
}

const TYPE_CONFIG: Record<string, { label: string; color: string; sign: string }> = {
  purchase_earn: { label: 'Compra',           color: 'text-green-400',  sign: '+' },
  sale_earn:     { label: 'Venda',             color: 'text-emerald-400', sign: '+' },
  coupon:        { label: 'Cupom',             color: 'text-cyan-400',   sign: '+' },
  event:         { label: 'Evento',            color: 'text-blue-400',   sign: '+' },
  loyalty:       { label: 'Fidelidade',        color: 'text-violet-400', sign: '+' },
  redeem:        { label: 'Resgate no checkout', color: 'text-amber-400', sign: '-' },
  expire:        { label: 'Expirado',          color: 'text-zinc-600',   sign: '-' },
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

export default async function GGPointsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()

  // Balance
  const { data: stats } = await admin
    .from('user_stats')
    .select('points_balance')
    .eq('user_id', user.id)
    .single()

  const balance = stats?.points_balance ?? 0
  const balanceBrl = (balance / POINTS_TO_BRL_RATE).toFixed(2).replace('.', ',')

  // Next expiry
  const { data: nextExpiryTx } = await admin
    .from('points_transactions')
    .select('expires_at, amount')
    .eq('user_id', user.id)
    .gt('amount', 0)
    .gt('expires_at', new Date().toISOString())
    .order('expires_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  // History — last 50
  const { data: transactions } = await admin
    .from('points_transactions')
    .select('id, type, amount, expires_at, description, created_at, reference_id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  const txList = (transactions ?? []) as PointsTx[]

  // Points that will expire in next 30 days
  const in30Days = new Date()
  in30Days.setDate(in30Days.getDate() + 30)
  const { data: expiringTxs } = await admin
    .from('points_transactions')
    .select('amount')
    .eq('user_id', user.id)
    .gt('amount', 0)
    .gt('expires_at', new Date().toISOString())
    .lte('expires_at', in30Days.toISOString())
  const expiringIn30 = (expiringTxs ?? []).reduce((s, t) => s + (t.amount as number), 0)

  return (
    <div className="min-h-screen text-[var(--gm-ink)]">
      <div className="container mx-auto max-w-4xl px-4 py-8">

        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-[var(--gm-ink-dim)]">
          <Link href="/painel" className="hover:text-[var(--gm-ink)]">Painel</Link>
          <span>/</span>
          <span className="font-medium text-[var(--gm-ink)]">GG Points</span>
        </nav>

        <h1 className="mb-6 text-2xl font-bold text-[var(--gm-ink)]">GG Points 🎮</h1>

        {/* ── Balance card ──────────────────────────────────────────────── */}
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="col-span-1 flex flex-col items-center justify-center gap-1 rounded-2xl border border-[var(--gm-violet)]/30 bg-[var(--gm-violet)]/10 p-6 text-center sm:col-span-1">
            <span className="text-sm font-medium text-[var(--gm-violet)]">Saldo atual</span>
            <span className="text-4xl font-extrabold text-[var(--gm-ink)]">
              {balance.toLocaleString('pt-BR')}
            </span>
            <span className="text-sm text-[var(--gm-ink-dim)]">≈ R$ {balanceBrl}</span>
            {balance < POINTS_MIN_REDEEM && (
              <span className="mt-2 rounded-full bg-muted px-3 py-1 text-[11px] text-[var(--gm-ink-dim)]">
                Mínimo para resgate: {POINTS_MIN_REDEEM} pontos
              </span>
            )}
          </div>

          <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-5">
            <span className="text-xs font-medium text-[var(--gm-ink-dim)] uppercase tracking-wider">Próxima expiração</span>
            {nextExpiryTx ? (
              <>
                <span className="text-xl font-bold text-amber-500">
                  {(nextExpiryTx.amount as number).toLocaleString('pt-BR')} pts
                </span>
                <span className="text-xs text-[var(--gm-ink-dim)]">
                  Expiram em {formatDate(nextExpiryTx.expires_at as string)}
                </span>
              </>
            ) : (
              <span className="text-sm text-[var(--gm-ink-dim)]/60">Nenhuma expiração próxima</span>
            )}
            {expiringIn30 > 0 && (
              <span className="mt-auto text-[11px] text-amber-500">
                ⚠ {expiringIn30.toLocaleString('pt-BR')} pts expiram em 30 dias
              </span>
            )}
          </div>

          <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-5">
            <span className="text-xs font-medium text-[var(--gm-ink-dim)] uppercase tracking-wider">Cotação</span>
            <span className="text-xl font-bold text-[var(--gm-ink)]">
              {POINTS_TO_BRL_RATE} pts = R$ 1,00
            </span>
            <span className="text-xs text-[var(--gm-ink-dim)]">
              Máx. {(POINTS_MAX_COVERAGE * 100).toFixed(0)}% do pedido<br />
              Expiração: {POINTS_EXPIRY_DAYS} dias
            </span>
          </div>
        </div>

        {/* ── Como ganhar mais ──────────────────────────────────────────── */}
        <div className="mb-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--gm-ink-dim)]">Como ganhar mais pontos</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              {
                icon: '🛒',
                title: 'Fazendo compras',
                desc: `1 ponto por R$ 1 gasto em qualquer pedido concluído.`,
                color: 'border-green-500/20 bg-green-500/5',
              },
              {
                icon: '🏆',
                title: 'Vendendo (Gold/Diamond)',
                desc: `Ganhe 0,5 pts por R$ 1 em vendas com avaliação positiva do comprador.`,
                color: 'border-amber-500/20 bg-amber-500/5',
              },
              {
                icon: '🎁',
                title: 'Eventos e cupons',
                desc: 'Fique de olho em promoções e eventos especiais da plataforma.',
                color: 'border-violet-500/20 bg-violet-500/5',
              },
            ].map((card) => (
              <div
                key={card.title}
                className={`rounded-xl border p-4 ${card.color}`}
              >
                <div className="mb-2 text-2xl">{card.icon}</div>
                <h3 className="mb-1 text-sm font-semibold text-[var(--gm-ink)]">{card.title}</h3>
                <p className="text-xs leading-relaxed text-[var(--gm-ink-dim)]">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Transaction history ───────────────────────────────────────── */}
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--gm-ink-dim)]">
            Histórico de transações
          </h2>

          {txList.length === 0 ? (
            <div className="rounded-xl border border-border bg-card/30 p-8 text-center text-sm text-[var(--gm-ink-dim)]">
              Nenhuma transação ainda. Faça sua primeira compra e ganhe pontos! 🎮
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/60 text-left text-xs uppercase tracking-wider text-[var(--gm-ink-dim)]">
                    <th className="px-4 py-3">Tipo</th>
                    <th className="px-4 py-3">Descrição</th>
                    <th className="px-4 py-3 text-right">Pontos</th>
                    <th className="hidden px-4 py-3 sm:table-cell">Expiração</th>
                    <th className="px-4 py-3 text-right">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {txList.map((tx) => {
                    const cfg = TYPE_CONFIG[tx.type] ?? { label: tx.type, color: 'text-[var(--gm-ink-dim)]', sign: '' }
                    const isPositive = tx.amount > 0
                    return (
                      <tr key={tx.id} className="hover:bg-muted/40">
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium ${cfg.color}`}>
                            {cfg.label}
                          </span>
                        </td>
                        <td className="max-w-xs truncate px-4 py-3 text-xs text-[var(--gm-ink-dim)]">
                          {tx.description ?? '—'}
                        </td>
                        <td className={`px-4 py-3 text-right font-bold tabular-nums ${isPositive ? 'text-green-500' : 'text-[var(--gm-ink-dim)]'}`}>
                          {cfg.sign}{Math.abs(tx.amount).toLocaleString('pt-BR')}
                        </td>
                        <td className="hidden px-4 py-3 text-xs text-[var(--gm-ink-dim)] sm:table-cell">
                          {tx.expires_at ? formatDate(tx.expires_at) : '—'}
                        </td>
                        <td className="px-4 py-3 text-right text-xs text-[var(--gm-ink-dim)]">
                          {formatDate(tx.created_at)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
