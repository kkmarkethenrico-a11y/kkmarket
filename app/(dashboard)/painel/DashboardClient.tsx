'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import {
  TrendingUp, ShoppingBag, CreditCard, Star,
  ArrowUpRight, ChevronUp, ChevronDown, ChevronsUpDown,
  Wallet, Lock, Loader2,
} from 'lucide-react'
import type { AnalyticsData, AnnouncementPerf } from '@/app/api/analytics/seller/route'

// ─── Constants ────────────────────────────────────────────────────────────────
const PERIOD_OPTIONS = [
  { value: '7d',  label: '7 dias' },
  { value: '30d', label: '30 dias' },
  { value: '90d', label: '90 dias' },
] as const

const PIE_COLORS = ['#8B5CF6', '#6D28D9', '#4C1D95', '#7C3AED', '#5B21B6']

const PLAN_COLORS: Record<string, string> = {
  diamond: 'text-cyan-300',
  gold:    'text-yellow-400',
  silver:  'text-zinc-400',
}

// ─── Formatters ───────────────────────────────────────────────────────────────
function fmtBRL(n: number) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function fmtDate(iso: string) {
  const [, m, d] = iso.split('-')
  return `${d}/${m}`
}

function fmtDays(isoDate: string | null): string {
  if (!isoDate) return '—'
  const diff = Math.ceil((new Date(isoDate).getTime() - Date.now()) / 86_400_000)
  if (diff <= 0) return 'hoje'
  return `${diff} dia${diff !== 1 ? 's' : ''}`
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SummaryCard({
  icon: Icon, label, value, sub, color,
}: {
  icon: React.ElementType
  label: string
  value: string
  sub?: string
  color: string
}) {
  return (
    <div className="rounded-2xl border border-zinc-800/70 bg-zinc-900/60 p-5 flex flex-col gap-3 hover:border-zinc-700 transition-colors">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">{label}</span>
        <span className={`rounded-xl p-2 ${color}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-zinc-500">{sub}</p>}
    </div>
  )
}

// ─── Sort helpers ─────────────────────────────────────────────────────────────
type SortKey = keyof Pick<AnnouncementPerf, 'title' | 'views' | 'orders' | 'conversion' | 'revenue' | 'plan'>
type SortDir = 'asc' | 'desc'

function sortAnnouncements(list: AnnouncementPerf[], key: SortKey, dir: SortDir) {
  return [...list].sort((a, b) => {
    const va = a[key]
    const vb = b[key]
    const cmp = typeof va === 'string' ? va.localeCompare(vb as string) : (va as number) - (vb as number)
    return dir === 'asc' ? cmp : -cmp
  })
}

function SortIcon({ field, active, dir }: { field: string; active: string; dir: SortDir }) {
  if (field !== active) return <ChevronsUpDown className="h-3 w-3 text-zinc-600" />
  return dir === 'asc'
    ? <ChevronUp   className="h-3 w-3 text-violet-400" />
    : <ChevronDown className="h-3 w-3 text-violet-400" />
}

// ─── Main Component ───────────────────────────────────────────────────────────
interface Props {
  walletBalance: number
  escrowAmount:  number
  escrowRelease: string | null
}

export default function DashboardClient({ walletBalance, escrowAmount, escrowRelease }: Props) {
  const [period,    setPeriod]   = useState<'7d' | '30d' | '90d'>('30d')
  const [data,      setData]     = useState<AnalyticsData | null>(null)
  const [loading,   setLoading]  = useState(true)
  const [sortKey,   setSortKey]  = useState<SortKey>('revenue')
  const [sortDir,   setSortDir]  = useState<SortDir>('desc')

  const load = useCallback(async (p: string) => {
    setLoading(true)
    try {
      const res  = await fetch(`/api/analytics/seller?period=${p}`)
      const json = await res.json()
      setData(json)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(period) }, [period, load])

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const sortedAnns = data
    ? sortAnnouncements(data.announcements, sortKey, sortDir)
    : []

  // ── Tooltip styles ─────────────────────────────────────────────────────────
  const tooltipStyle = {
    backgroundColor: '#18181b',
    border:          '1px solid #3f3f46',
    borderRadius:    '8px',
    color:           '#fff',
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-16">
      <div className="container mx-auto max-w-7xl px-4 py-8 space-y-8">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Meu Painel</h1>
            <p className="text-sm text-zinc-500 mt-0.5">Visão geral da sua performance de vendas</p>
          </div>

          {/* Period selector */}
          <div className="flex items-center gap-1 rounded-xl border border-zinc-800 bg-zinc-900/50 p-1">
            {PERIOD_OPTIONS.map((o) => (
              <button
                key={o.value}
                onClick={() => setPeriod(o.value)}
                className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-all ${
                  period === o.value
                    ? 'bg-violet-600 text-white shadow'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Wallet Banner ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Available balance */}
          <div className="flex items-center gap-4 rounded-2xl border border-green-500/20 bg-green-950/20 p-5">
            <div className="rounded-xl bg-green-500/15 p-3">
              <Wallet className="h-6 w-6 text-green-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-zinc-500 uppercase tracking-wide">Saldo disponível</p>
              <p className="text-2xl font-bold text-green-400">{fmtBRL(walletBalance)}</p>
            </div>
            <Link
              href="/minhas-retiradas"
              className="shrink-0 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-500 transition-colors flex items-center gap-1.5"
            >
              Sacar Agora <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Escrow balance */}
          <div className="flex items-center gap-4 rounded-2xl border border-zinc-800/70 bg-zinc-900/40 p-5">
            <div className="rounded-xl bg-amber-500/15 p-3">
              <Lock className="h-6 w-6 text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-zinc-500 uppercase tracking-wide">Em escrow (bloqueado)</p>
              <p className="text-2xl font-bold text-amber-300">{fmtBRL(escrowAmount)}</p>
            </div>
            {escrowAmount > 0 && (
              <div className="shrink-0 rounded-xl bg-zinc-800/60 px-4 py-2 text-xs font-medium text-zinc-400 text-center">
                <div>Liberação em</div>
                <div className="text-amber-300 font-semibold">{fmtDays(escrowRelease)}</div>
              </div>
            )}
          </div>
        </div>

        {/* ── Summary Cards ──────────────────────────────────────────────── */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
          </div>
        ) : data && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <SummaryCard
                icon={TrendingUp}
                label="Receita no período"
                value={fmtBRL(data.summary.revenue)}
                sub={`${data.summary.orders} pedidos concluídos`}
                color="bg-violet-500/15 text-violet-400"
              />
              <SummaryCard
                icon={ShoppingBag}
                label="Pedidos"
                value={String(data.summary.orders)}
                sub="somente concluídos"
                color="bg-blue-500/15 text-blue-400"
              />
              <SummaryCard
                icon={CreditCard}
                label="Ticket médio"
                value={fmtBRL(data.summary.avgTicket)}
                color="bg-emerald-500/15 text-emerald-400"
              />
              <SummaryCard
                icon={Star}
                label="Avaliações positivas"
                value={`${data.summary.positiveReviewRate}%`}
                sub="no período selecionado"
                color="bg-yellow-500/15 text-yellow-400"
              />
            </div>

            {/* ── Charts ─────────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

              {/* LineChart — evolução diária */}
              <div className="xl:col-span-2 rounded-2xl border border-zinc-800/70 bg-zinc-900/60 p-5">
                <h2 className="text-sm font-semibold text-zinc-300 mb-4">Evolução de vendas</h2>
                {data.dailySales.length === 0 || data.summary.revenue === 0 ? (
                  <div className="flex h-48 items-center justify-center text-sm text-zinc-600">
                    Sem vendas no período
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={data.dailySales} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={fmtDate}
                        tick={{ fill: '#71717a', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tickFormatter={(v) => `R$${v}`}
                        tick={{ fill: '#71717a', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        width={56}
                      />
                      <Tooltip
                        contentStyle={tooltipStyle}
                        labelFormatter={(label) => typeof label === 'string' ? fmtDate(label) : label}
                        formatter={(v) => [fmtBRL(Number(v ?? 0)), 'Receita']}
                      />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="#8B5CF6"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4, fill: '#8B5CF6' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* PieChart — por categoria */}
              <div className="rounded-2xl border border-zinc-800/70 bg-zinc-900/60 p-5">
                <h2 className="text-sm font-semibold text-zinc-300 mb-4">Por categoria</h2>
                {data.byCategory.length === 0 ? (
                  <div className="flex h-48 items-center justify-center text-sm text-zinc-600">
                    Sem dados
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={data.byCategory}
                        dataKey="revenue"
                        nameKey="name"
                        cx="50%"
                        cy="45%"
                        outerRadius={80}
                        paddingAngle={3}
                        label={({ name, percent }: { name?: string; percent?: number }) =>
                          (percent ?? 0) > 0.05 ? `${((percent ?? 0) * 100).toFixed(0)}%` : ''
                        }
                        labelLine={false}
                      >
                        {data.byCategory.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={tooltipStyle}
                        formatter={(v) => [fmtBRL(Number(v ?? 0)), 'Receita']}
                      />
                      <Legend
                        iconSize={8}
                        wrapperStyle={{ fontSize: 11, color: '#a1a1aa' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* BarChart — top 5 anúncios */}
            <div className="rounded-2xl border border-zinc-800/70 bg-zinc-900/60 p-5">
              <h2 className="text-sm font-semibold text-zinc-300 mb-4">Top 5 anúncios por receita</h2>
              {data.topAnnouncements.length === 0 ? (
                <div className="flex h-40 items-center justify-center text-sm text-zinc-600">
                  Sem vendas no período
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart
                    data={data.topAnnouncements.map((a) => ({
                      ...a,
                      shortTitle: a.title.length > 24 ? a.title.slice(0, 24) + '…' : a.title,
                    }))}
                    margin={{ top: 4, right: 8, left: 8, bottom: 0 }}
                    barSize={32}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis
                      dataKey="shortTitle"
                      tick={{ fill: '#71717a', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tickFormatter={(v) => `R$${v}`}
                      tick={{ fill: '#71717a', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      width={56}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(v, _name, props) => [
                        fmtBRL(Number(v ?? 0)),
                        (props as { payload?: AnnouncementPerf }).payload?.title ?? 'Receita',
                      ]}
                    />
                    <Bar dataKey="revenue" fill="#7C3AED" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* ── Announcements Table ─────────────────────────────────────── */}
            <div className="rounded-2xl border border-zinc-800/70 bg-zinc-900/60 overflow-hidden">
              <div className="p-5 border-b border-zinc-800/60">
                <h2 className="text-sm font-semibold text-zinc-300">
                  Meus anúncios — performance
                  <span className="ml-2 text-zinc-600 font-normal">({sortedAnns.length})</span>
                </h2>
              </div>

              {sortedAnns.length === 0 ? (
                <div className="flex items-center justify-center py-12 text-sm text-zinc-600">
                  Nenhum anúncio ainda
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-800/60 text-xs text-zinc-500 uppercase tracking-wide">
                        {(
                          [
                            { key: 'title',      label: 'Título' },
                            { key: 'views',      label: 'Visualizações' },
                            { key: 'orders',     label: 'Pedidos' },
                            { key: 'conversion', label: 'Conversão' },
                            { key: 'revenue',    label: 'Receita' },
                            { key: 'plan',       label: 'Plano' },
                          ] as { key: SortKey; label: string }[]
                        ).map((col) => (
                          <th
                            key={col.key}
                            className="px-4 py-3 text-left cursor-pointer select-none hover:text-zinc-300 transition-colors"
                            onClick={() => toggleSort(col.key)}
                          >
                            <span className="flex items-center gap-1">
                              {col.label}
                              <SortIcon field={col.key} active={sortKey} dir={sortDir} />
                            </span>
                          </th>
                        ))}
                        <th className="px-4 py-3 text-left text-xs text-zinc-500 uppercase tracking-wide">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedAnns.map((ann) => (
                        <tr
                          key={ann.id}
                          className="border-b border-zinc-800/40 hover:bg-zinc-800/30 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <Link
                              href={`/anuncio/${ann.slug}`}
                              className="text-zinc-200 hover:text-violet-400 transition-colors line-clamp-1 max-w-[220px]"
                              title={ann.title}
                            >
                              {ann.title}
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-zinc-400">{ann.views.toLocaleString('pt-BR')}</td>
                          <td className="px-4 py-3 text-zinc-400">{ann.orders}</td>
                          <td className="px-4 py-3 text-zinc-400">{ann.conversion.toFixed(2)}%</td>
                          <td className="px-4 py-3 font-medium text-green-400">{fmtBRL(ann.revenue)}</td>
                          <td className={`px-4 py-3 font-semibold capitalize ${PLAN_COLORS[ann.plan] ?? 'text-zinc-400'}`}>
                            {ann.plan}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              ann.status === 'active'
                                ? 'bg-green-500/15 text-green-400'
                                : ann.status === 'paused'
                                ? 'bg-amber-500/15 text-amber-400'
                                : ann.status === 'pending'
                                ? 'bg-blue-500/15 text-blue-400'
                                : 'bg-zinc-700/60 text-zinc-400'
                            }`}>
                              {ann.status === 'active'   ? 'Ativo'
                               : ann.status === 'paused'   ? 'Pausado'
                               : ann.status === 'pending'  ? 'Em análise'
                               : ann.status === 'rejected' ? 'Rejeitado'
                               : ann.status === 'sold_out' ? 'Esgotado'
                               : ann.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
