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
  Wallet, Lock, Loader2, Trophy, Zap, Target, Package, Hourglass, RefreshCcw, Megaphone
} from 'lucide-react'
import { toast } from 'sonner'
import type { AnalyticsData, AnnouncementPerf } from '@/app/api/analytics/seller/route'
import { claimQuestAction, exchangePointsAction } from '@/app/actions/quests'

// ─── Constants ────────────────────────────────────────────────────────────────
const PERIOD_OPTIONS = [
  { value: '7d',  label: '7 dias' },
  { value: '30d', label: '30 dias' },
  { value: '90d', label: '90 dias' },
] as const

const PIE_COLORS = ['#FF9D00', '#00A2FF', '#34d399', '#FFC000', '#fb7185']

const PLAN_COLORS: Record<string, string> = {
  diamond: 'text-[#22d3ee]',
  gold:    'text-[#fbbf24]',
  silver:  'text-[#8b8a86]',
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
    <div className="rounded-xl border border-[var(--gm-ink-faint)]/40 bg-[var(--gm-paper-2)] p-5 flex flex-col gap-3 hover:border-[var(--gm-violet)]/40 transition-colors">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-[var(--gm-ink-faint)] uppercase tracking-widest">{label}</span>
        <span className={`rounded-lg p-2 ${color}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="text-2xl font-black text-[var(--gm-ink)]">{value}</p>
      {sub && <p className="text-xs text-[var(--gm-ink-faint)]">{sub}</p>}
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
  if (field !== active) return <ChevronsUpDown className="h-3 w-3 text-[var(--gm-ink-faint)]" />
  return dir === 'asc'
    ? <ChevronUp   className="h-3 w-3 text-[var(--gm-violet)]" />
    : <ChevronDown className="h-3 w-3 text-[var(--gm-violet)]" />
}

// ─── Main Component ───────────────────────────────────────────────────────────
interface RecentOrder {
  id: string
  status: string
  created_at: string
  announcements: { title: string } | null
}

interface WishlistItem {
  id: string
  announcements: {
    title: string
    unit_price: number | null
    slug: string
    announcement_images: { url: string; is_cover: boolean; sort_order: number }[]
  } | null
}

interface Props {
  walletBalance:  number
  escrowAmount:   number
  escrowRelease:  string | null
  pointsBalance:  number
  totalPurchases: number
  totalSales:     number
  recentOrders:   RecentOrder[]
  wishlistItems:  WishlistItem[]
  claimedQuests:  string[]
}

export default function DashboardClient({
  walletBalance, escrowAmount, escrowRelease,
  pointsBalance, totalPurchases, totalSales,
  recentOrders, wishlistItems, claimedQuests,
}: Props) {
  const [period,    setPeriod]   = useState<'7d' | '30d' | '90d'>('30d')
  const [data,      setData]     = useState<AnalyticsData | null>(null)
  const [loading,   setLoading]  = useState(true)
  const [sortKey,   setSortKey]  = useState<SortKey>('revenue')
  const [sortDir,   setSortDir]  = useState<SortDir>('desc')
  const [claiming,  setClaiming] = useState<string | null>(null)
  const [exchanging,setExchanging] = useState(false)

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

  async function handleClaimQuest(questId: string, pts: number) {
    setClaiming(questId)
    const res = await claimQuestAction(questId, pts)
    if (res.success) toast.success(res.message)
    else toast.error(res.message)
    setClaiming(null)
  }

  async function handleExchangeXP() {
    if (pointsBalance < 100) return
    setExchanging(true)
    const ptsToExchange = Math.floor(pointsBalance / 100) * 100
    const res = await exchangePointsAction(ptsToExchange)
    if (res.success) toast.success(res.message)
    else toast.error(res.message)
    setExchanging(false)
  }

  const sortedAnns = data
    ? sortAnnouncements(data.announcements, sortKey, sortDir)
    : []

  // Derive level and XP from points_balance
  const level  = Math.max(1, Math.floor(pointsBalance / 100) + 1)
  const xpPct  = pointsBalance % 100
  const xpMax  = 100

  // Quest definitions (client-side derived from real data)
  const todayQuestId = `daily_login_${new Date().toISOString().split('T')[0]}`
  const quests = [
    { id: 'daily_login', label: 'login diário', progress: 1, max: 1, pts: 10, done: claimedQuests.includes(todayQuestId) },
    { id: 'first_purchase', label: 'fazer sua 1ª compra da semana', progress: claimedQuests.includes('first_purchase') ? 1 : Math.min(totalPurchases, 1), max: 1, pts: 25, done: claimedQuests.includes('first_purchase') },
    { id: 'first_sale', label: 'criar 1 novo anúncio', progress: claimedQuests.includes('first_sale') ? 1 : Math.min(totalSales, 1), max: 1, pts: 50, done: claimedQuests.includes('first_sale') },
    { id: 'invite_friend', label: 'convidar 1 amigo', progress: claimedQuests.includes('invite_friend') ? 1 : 0, max: 1, pts: 100, done: claimedQuests.includes('invite_friend') },
  ]

  // Activity feed from orders
  const activityFeed = recentOrders.map((o) => ({
    icon: o.status === 'completed' ? <Package className="h-4 w-4" /> : o.status === 'paid' ? <Hourglass className="h-4 w-4" /> : <RefreshCcw className="h-4 w-4" />,
    title: o.announcements?.title ?? 'Pedido',
    sub: o.status === 'completed' ? '✓ entregue' : o.status === 'paid' ? '⏳ processando' : o.status,
    cls: o.status === 'completed' ? 'text-[var(--gm-green)]' : 'text-[var(--gm-amber)]',
  }))

  // Achievements derived from milestones
  const achievements: { icon: React.ReactNode; unlocked: boolean }[] = [
    { icon: <Trophy className="h-4 w-4" />, unlocked: totalSales >= 1 },
    { icon: <Zap className="h-4 w-4" />, unlocked: totalPurchases >= 1 },
    { icon: <Lock className="h-4 w-4" />, unlocked: false },
    { icon: <Star className="h-4 w-4" />,  unlocked: pointsBalance >= 50 },
    { icon: <Wallet className="h-4 w-4" />, unlocked: walletBalance > 0 },
    { icon: <Target className="h-4 w-4" />, unlocked: totalSales >= 10 },
    { icon: <Lock className="h-4 w-4" />,  unlocked: false },
    { icon: <Lock className="h-4 w-4" />,  unlocked: false },
    { icon: <Lock className="h-4 w-4" />,  unlocked: false },
    { icon: <Lock className="h-4 w-4" />,  unlocked: false },
    { icon: <Lock className="h-4 w-4" />,  unlocked: false },
    { icon: <Lock className="h-4 w-4" />,  unlocked: false },
  ]

  const unlockedCount = achievements.filter((a) => a.unlocked).length

  // Tooltip style
  const tooltipStyle = {
    backgroundColor: '#14141c',
    border:          '1px solid rgba(74,74,82,0.6)',
    borderRadius:    '8px',
    color:           '#e8e6e3',
  }

  return (
    <div className="min-h-screen bg-[var(--gm-paper)] text-[var(--gm-ink)] pb-16">
      <div className="container mx-auto max-w-7xl px-4 py-8 space-y-8">

        {/* ── Player Card Hero ────────────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-xl border border-[var(--gm-violet)]/30 bg-[var(--gm-paper-2)] p-6"
          style={{ background: 'linear-gradient(135deg, rgba(255, 157, 0, 0.06), rgba(0, 162, 255, 0.03))' }}>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Avatar / Level badge */}
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-[var(--gm-violet)]/40 bg-[var(--gm-violet)]/15 text-3xl font-black text-[var(--gm-violet)]">
              {level}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-xl font-black text-[var(--gm-ink)]">Meu Painel</h1>
                <span className="rank-chip text-[10px]">◆ JOGADOR</span>
                {pointsBalance >= 200 && <span className="rank-chip gold text-[10px]">VIP</span>}
              </div>
              <p className="text-xs text-[var(--gm-ink-faint)] mb-3">{pointsBalance} / {level * xpMax} XP · nível {level}</p>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-[var(--gm-ink-faint)] shrink-0">LV {level}</span>
                <div className="xp-bar flex-1 max-w-xs">
                  <div className="xp-bar-fill" style={{ width: `${xpPct}%` }} />
                </div>
                <span className="text-xs font-bold text-[var(--gm-violet)] shrink-0">{xpPct} / {xpMax} XP</span>
                {pointsBalance >= 100 && (
                  <button 
                    onClick={handleExchangeXP}
                    disabled={exchanging}
                    className="ml-2 text-[10px] bg-[var(--gm-green)]/15 text-[var(--gm-green)] border border-[var(--gm-green)]/30 px-2 py-0.5 rounded font-bold hover:bg-[var(--gm-green)] hover:text-black transition-colors disabled:opacity-50"
                  >
                    {exchanging ? '...' : `Trocar por R$ ${Math.floor(pointsBalance / 100).toFixed(2)}`}
                  </button>
                )}
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <Link href="/configuracoes" className="rounded-lg border border-[var(--gm-ink-faint)]/40 px-3 py-2 text-xs font-bold text-[var(--gm-ink-dim)] hover:border-[var(--gm-violet)]/50 hover:text-[var(--gm-ink)] transition-all">⚙ config</Link>
              <Link href="/meus-anuncios/novo" className="rounded-lg bg-[var(--gm-violet)] px-3 py-2 text-xs font-black text-[#1a1126] hover:opacity-90 transition-all gm-glow">+ vender</Link>
            </div>
          </div>
          {/* Decorative */}
          <div className="pointer-events-none absolute right-4 top-4 text-8xl opacity-[0.03]">🎮</div>
        </div>

        {/* ── Quick Stats HUD ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: <Wallet className="h-6 w-6" />, label: 'CARTEIRA', value: fmtBRL(walletBalance), sub: 'saque ↗', cls: 'text-[var(--gm-green)]', href: '/minhas-retiradas' },
            { icon: <Package className="h-6 w-6" />, label: 'PEDIDOS',  value: String(totalPurchases), sub: 'como comprador', cls: 'text-[var(--gm-ink)]', href: '/minhas-compras' },
            { icon: <Trophy className="h-6 w-6" />, label: 'PONTOS',   value: String(pointsBalance), sub: `Lv ${level}`, cls: 'text-[var(--gm-violet)]', href: '/kks-points' },
            { icon: <Megaphone className="h-6 w-6" />, label: 'VENDAS',   value: String(totalSales), sub: 'total acumulado', cls: 'text-[var(--gm-cyan)]', href: '/minhas-vendas' },
          ].map((s) => (
            <Link key={s.label} href={s.href}
              className="rounded-xl border border-[var(--gm-ink-faint)]/20 bg-[var(--gm-paper-2)] p-4 flex flex-col gap-2 hover:border-[var(--gm-violet)]/40 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--gm-ink-faint)]">{s.label}</span>
                <span className="text-lg">{s.icon}</span>
              </div>
              <p className={`text-2xl font-black ${s.cls}`}>{s.value}</p>
              <p className="text-[10px] text-[var(--gm-ink-faint)]">{s.sub}</p>
            </Link>
          ))}
        </div>

        {/* ── Quests + Activity / Achievements + Wishlist ──────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 flex flex-col gap-6">

            {/* Quests diárias */}
            <div className="rounded-xl border border-[var(--gm-ink-faint)]/20 bg-[var(--gm-paper-2)] p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xs font-black uppercase tracking-widest text-[var(--gm-ink)]">quests diárias</h2>
                <span className="text-xs font-bold text-[var(--gm-violet)]">+{quests.reduce((s, q) => s + q.pts, 0)} pts hoje</span>
              </div>
              <div className="flex flex-col gap-3">
                {quests.map((q, i) => (
                  <div key={i} className="flex items-center gap-3 py-2 border-b border-[var(--gm-ink-faint)]/15 last:border-0">
                    <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-xs ${
                      q.done
                        ? 'border-[var(--gm-green)] bg-[var(--gm-green)]/10 text-[var(--gm-green)]'
                        : 'border-[var(--gm-ink-faint)]/40'
                    }`}>
                      {q.done ? '✓' : ''}
                    </div>
                    <span className={`text-sm font-bold flex-1 ${q.done ? 'line-through opacity-50 text-[var(--gm-ink-dim)]' : 'text-[var(--gm-ink)]'}`}>
                      {q.label}
                    </span>
                    <div className="xp-bar w-16 shrink-0">
                      <div className="xp-bar-fill" style={{ width: `${(q.progress / q.max) * 100}%` }} />
                    </div>
                    {q.progress >= q.max && !q.done ? (
                      <button 
                        onClick={() => handleClaimQuest(q.id, q.pts)}
                        disabled={claiming === q.id}
                        className="text-xs font-black text-black bg-[var(--gm-cyan)] px-2 py-1 rounded shrink-0 min-w-[50px] text-center hover:opacity-90 disabled:opacity-50 transition-all"
                      >
                        {claiming === q.id ? '...' : 'Resgatar'}
                      </button>
                    ) : (
                      <span className={`text-xs font-bold shrink-0 min-w-[50px] text-right ${q.done ? 'text-[var(--gm-ink-dim)]' : 'text-[var(--gm-violet)]'}`}>
                        +{q.pts} pts
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Atividade recente */}
            {activityFeed.length > 0 && (
              <div className="rounded-xl border border-[var(--gm-ink-faint)]/20 bg-[var(--gm-paper-2)] p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xs font-black uppercase tracking-widest text-[var(--gm-ink)]">atividade</h2>
                  <Link href="/minhas-compras" className="text-xs text-[var(--gm-violet)] hover:text-[var(--gm-cyan)] transition-colors">ver tudo →</Link>
                </div>
                <div className="flex flex-col gap-3">
                  {activityFeed.map((a, i) => (
                    <div key={i} className="flex items-center gap-3 py-2 border-b border-[var(--gm-ink-faint)]/15 last:border-0">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--gm-ink-faint)]/20 text-base">
                        {a.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-[var(--gm-ink)] truncate">{a.title}</p>
                        <p className={`text-[10px] font-bold ${a.cls}`}>{a.sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-6">
            {/* Conquistas */}
            <div className="rounded-xl border border-[var(--gm-ink-faint)]/20 bg-[var(--gm-paper-2)] p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xs font-black uppercase tracking-widest text-[var(--gm-ink)]">conquistas</h2>
                <span className="text-xs font-bold text-[var(--gm-violet)]">{unlockedCount}/{achievements.length}</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {achievements.map((a, i) => (
                  <div key={i}
                    className="flex aspect-square items-center justify-center rounded-lg text-lg"
                    style={{
                      border: `1.5px ${a.unlocked ? 'solid' : 'dashed'} ${i < 2 && a.unlocked ? 'var(--gm-violet)' : 'var(--gm-ink-faint)'}`,
                      background: i < 2 && a.unlocked ? 'rgba(255, 157, 0, 0.1)' : 'transparent',
                      opacity: a.unlocked ? 1 : 0.4,
                    }}>
                    {a.icon}
                  </div>
                ))}
              </div>
            </div>

            {/* Wishlist */}
            {wishlistItems.length > 0 && (
              <div className="rounded-xl border border-[var(--gm-ink-faint)]/20 bg-[var(--gm-paper-2)] p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xs font-black uppercase tracking-widest text-[var(--gm-ink)]">wishlist</h2>
                  <Link href="/wishlist" className="text-xs text-[var(--gm-violet)]">{wishlistItems.length}</Link>
                </div>
                <div className="flex flex-col gap-3">
                  {wishlistItems.map((w, i) => {
                    const ann = w.announcements
                    if (!ann) return null
                    const cover = ann.announcement_images?.find((img) => img.is_cover) ?? ann.announcement_images?.[0]
                    return (
                      <Link key={i} href={`/anuncio/${ann.slug}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                        <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-md bg-[var(--gm-paper-3)]">
                          {cover?.url
                            ? <img src={cover.url} alt={ann.title} className="h-full w-full object-cover" />
                            : <div className="flex h-full w-full items-center justify-center text-[10px]">🎮</div>}
                        </div>
                        <span className="text-xs font-semibold text-[var(--gm-ink)] flex-1 truncate">{ann.title}</span>
                        <span className="text-xs font-black text-[var(--gm-green)] shrink-0">
                          {ann.unit_price != null ? `R$ ${ann.unit_price}` : '—'}
                        </span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Wallet Banner ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Available balance */}
          <div className="flex items-center gap-4 rounded-xl border border-[var(--gm-green)]/20 bg-[var(--gm-green)]/5 p-5">
            <div className="rounded-lg bg-[var(--gm-green)]/15 p-3">
              <Wallet className="h-6 w-6 text-[var(--gm-green)]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-[var(--gm-ink-faint)] uppercase tracking-widest">Saldo disponível</p>
              <p className="text-2xl font-black text-[var(--gm-green)]">{fmtBRL(walletBalance)}</p>
            </div>
            <Link
              href="/minhas-retiradas"
              className="shrink-0 rounded-lg bg-[var(--gm-green)] px-4 py-2 text-sm font-black text-[#0d0d12] hover:opacity-90 transition-colors flex items-center gap-1.5"
            >
              Sacar <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Escrow balance */}
          <div className="flex items-center gap-4 rounded-xl border border-[var(--gm-amber)]/20 bg-[var(--gm-amber)]/5 p-5">
            <div className="rounded-lg bg-[var(--gm-amber)]/15 p-3">
              <Lock className="h-6 w-6 text-[var(--gm-amber)]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-[var(--gm-ink-faint)] uppercase tracking-widest">Em escrow (bloqueado)</p>
              <p className="text-2xl font-black text-[var(--gm-amber)]">{fmtBRL(escrowAmount)}</p>
            </div>
            {escrowAmount > 0 && (
              <div className="shrink-0 rounded-lg border border-[var(--gm-amber)]/30 bg-[var(--gm-paper-3)] px-4 py-2 text-xs font-semibold text-[var(--gm-ink-faint)] text-center">
                <div>Liberação em</div>
                <div className="text-[var(--gm-amber)] font-black">{fmtDays(escrowRelease)}</div>
              </div>
            )}
          </div>
        </div>

        {/* ── Analytics section ─────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black uppercase tracking-widest text-[var(--gm-ink-dim)]">Analytics de Vendas</h2>
          <div className="flex items-center gap-1 rounded-lg border border-[var(--gm-ink-faint)]/40 bg-[var(--gm-paper-2)] p-1">
            {PERIOD_OPTIONS.map((o) => (
              <button
                key={o.value}
                onClick={() => setPeriod(o.value)}
                className={`rounded-md px-4 py-1.5 text-xs font-bold uppercase tracking-wide transition-all ${
                  period === o.value
                    ? 'bg-[var(--gm-violet)] text-[#1a1126]'
                    : 'text-[var(--gm-ink-faint)] hover:text-[var(--gm-ink)]'
                }`}
              >
                {o.label}
              </button>
            ))}
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
                color="bg-[var(--gm-violet)]/15 text-[var(--gm-violet)]"
              />
              <SummaryCard
                icon={ShoppingBag}
                label="Pedidos"
                value={String(data.summary.orders)}
                sub="somente concluídos"
                color="bg-[var(--gm-cyan)]/15 text-[var(--gm-cyan)]"
              />
              <SummaryCard
                icon={CreditCard}
                label="Ticket médio"
                value={fmtBRL(data.summary.avgTicket)}
                color="bg-[var(--gm-green)]/15 text-[var(--gm-green)]"
              />
              <SummaryCard
                icon={Star}
                label="Avaliações positivas"
                value={`${data.summary.positiveReviewRate}%`}
                sub="no período selecionado"
                color="bg-[var(--gm-amber)]/15 text-[var(--gm-amber)]"
              />
            </div>

            {/* ── Charts ─────────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

              {/* LineChart — evolução diária */}
              <div className="xl:col-span-2 rounded-xl border border-[var(--gm-ink-faint)]/40 bg-[var(--gm-paper-2)] p-5">
                <h2 className="text-xs font-bold text-[var(--gm-ink-dim)] uppercase tracking-wide mb-4">Evolução de vendas</h2>
                {data.dailySales.length === 0 || data.summary.revenue === 0 ? (
                  <div className="flex h-48 items-center justify-center text-sm text-[var(--gm-ink-faint)]">
                    Sem vendas no período
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={data.dailySales} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(74,74,82,0.3)" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={fmtDate}
                        tick={{ fill: '#8b8a86', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tickFormatter={(v) => `R$${v}`}
                        tick={{ fill: '#8b8a86', fontSize: 11 }}
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
                        stroke="#FF9D00"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4, fill: '#FF9D00' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* PieChart — por categoria */}
              <div className="rounded-xl border border-[var(--gm-ink-faint)]/40 bg-[var(--gm-paper-2)] p-5">
                <h2 className="text-xs font-bold text-[var(--gm-ink-dim)] uppercase tracking-wide mb-4">Por categoria</h2>
                {data.byCategory.length === 0 ? (
                  <div className="flex h-48 items-center justify-center text-sm text-[var(--gm-ink-faint)]">
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
                        wrapperStyle={{ fontSize: 11, color: '#8b8a86' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* BarChart — top 5 anúncios */}
            <div className="rounded-xl border border-[var(--gm-ink-faint)]/40 bg-[var(--gm-paper-2)] p-5">
              <h2 className="text-xs font-bold text-[var(--gm-ink-dim)] uppercase tracking-wide mb-4">Top 5 anúncios por receita</h2>
              {data.topAnnouncements.length === 0 ? (
                <div className="flex h-40 items-center justify-center text-sm text-[var(--gm-ink-faint)]">
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
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(74,74,82,0.3)" vertical={false} />
                    <XAxis
                      dataKey="shortTitle"
                      tick={{ fill: '#8b8a86', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tickFormatter={(v) => `R$${v}`}
                      tick={{ fill: '#8b8a86', fontSize: 11 }}
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
                    <Bar dataKey="revenue" fill="#FF9D00" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* ── Announcements Table ─────────────────────────────────────── */}
            <div className="rounded-xl border border-[var(--gm-ink-faint)]/40 bg-[var(--gm-paper-2)] overflow-hidden">
              <div className="p-5 border-b border-[var(--gm-ink-faint)]/30">
                <h2 className="text-xs font-bold text-[var(--gm-ink-dim)] uppercase tracking-wide">
                  Meus anúncios — performance
                  <span className="ml-2 text-[var(--gm-ink-faint)] font-normal">({sortedAnns.length})</span>
                </h2>
              </div>

              {sortedAnns.length === 0 ? (
                <div className="flex items-center justify-center py-12 text-sm text-[var(--gm-ink-faint)]">
                  Nenhum anúncio ainda
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--gm-ink-faint)]/30 text-[10px] text-[var(--gm-ink-faint)] uppercase tracking-widest">
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
                            className="px-4 py-3 text-left cursor-pointer select-none hover:text-[var(--gm-ink)] transition-colors"
                            onClick={() => toggleSort(col.key)}
                          >
                            <span className="flex items-center gap-1">
                              {col.label}
                              <SortIcon field={col.key} active={sortKey} dir={sortDir} />
                            </span>
                          </th>
                        ))}
                        <th className="px-4 py-3 text-left text-[10px] text-[var(--gm-ink-faint)] uppercase tracking-widest">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedAnns.map((ann) => (
                        <tr
                          key={ann.id}
                          className="border-b border-[var(--gm-ink-faint)]/20 hover:bg-[var(--gm-paper-3)] transition-colors"
                        >
                          <td className="px-4 py-3">
                            <Link
                              href={`/anuncio/${ann.slug}`}
                              className="text-[var(--gm-ink)] hover:text-[var(--gm-violet)] transition-colors line-clamp-1 max-w-[220px]"
                              title={ann.title}
                            >
                              {ann.title}
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-[var(--gm-ink-dim)]">{ann.views.toLocaleString('pt-BR')}</td>
                          <td className="px-4 py-3 text-[var(--gm-ink-dim)]">{ann.orders}</td>
                          <td className="px-4 py-3 text-[var(--gm-ink-dim)]">{ann.conversion.toFixed(2)}%</td>
                          <td className="px-4 py-3 font-black text-[var(--gm-green)]">{fmtBRL(ann.revenue)}</td>
                          <td className={`px-4 py-3 font-bold capitalize ${PLAN_COLORS[ann.plan] ?? 'text-[var(--gm-ink-faint)]'}`}>
                            {ann.plan}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                              ann.status === 'active'
                                ? 'bg-[var(--gm-green)]/15 text-[var(--gm-green)]'
                                : ann.status === 'paused'
                                ? 'bg-[var(--gm-amber)]/15 text-[var(--gm-amber)]'
                                : ann.status === 'pending'
                                ? 'bg-[var(--gm-cyan)]/15 text-[var(--gm-cyan)]'
                                : 'bg-[var(--gm-ink-faint)]/20 text-[var(--gm-ink-faint)]'
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
