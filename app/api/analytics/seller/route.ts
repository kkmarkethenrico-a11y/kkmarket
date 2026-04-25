import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// ─── Types ────────────────────────────────────────────────────────────────────
export type DailySale = { date: string; revenue: number; count: number }

export type AnnouncementPerf = {
  id:         string
  title:      string
  slug:       string
  plan:       string
  status:     string
  views:      number
  orders:     number
  revenue:    number
  conversion: number
}

export type CategorySlice = { name: string; revenue: number; orders: number }

export type AnalyticsData = {
  summary: {
    revenue:            number
    orders:             number
    avgTicket:          number
    positiveReviewRate: number
  }
  dailySales:       DailySale[]
  topAnnouncements: AnnouncementPerf[]
  byCategory:       CategorySlice[]
  announcements:    AnnouncementPerf[]
}

// ─── Period helpers ────────────────────────────────────────────────────────────
function periodStart(period: string): Date {
  const days = period === '7d' ? 7 : period === '90d' ? 90 : 30
  const d = new Date()
  d.setDate(d.getDate() - days)
  d.setHours(0, 0, 0, 0)
  return d
}

// ─── GET /api/analytics/seller?period=7d|30d|90d ─────────────────────────────
export async function GET(req: Request) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url    = new URL(req.url)
  const period = url.searchParams.get('period') ?? '30d'
  if (!['7d', '30d', '90d'].includes(period)) {
    return NextResponse.json({ error: 'Invalid period' }, { status: 400 })
  }

  const admin    = createAdminClient()
  const startISO = periodStart(period).toISOString()

  // ── Parallel fetches ───────────────────────────────────────────────────────
  const [
    { data: ordersRaw },
    { data: reviewsRaw },
    { data: annsRaw },
    { data: escrowRaw },
  ] = await Promise.all([
    // Completed orders in period — with announcement + category
    admin
      .from('orders')
      .select(
        `seller_amount, created_at,
         announcement_id,
         announcements!announcement_id (
           id, title, slug, plan, status, view_count, sale_count,
           category_id,
           categories!category_id ( name )
         )`
      )
      .eq('seller_id', user.id)
      .eq('status', 'completed')
      .gte('created_at', startISO),

    // Reviews in period for this seller
    admin
      .from('order_reviews')
      .select('type')
      .eq('reviewed_id', user.id)
      .gte('created_at', startISO),

    // All seller announcements (for full performance table)
    admin
      .from('announcements')
      .select(
        `id, title, slug, plan, status, view_count, sale_count,
         category_id,
         categories!category_id ( name )`
      )
      .eq('user_id', user.id)
      .neq('status', 'deleted')
      .order('sale_count', { ascending: false }),

    // In-flight (escrow) orders — status paid or in_delivery
    admin
      .from('orders')
      .select('seller_amount, escrow_release_at')
      .eq('seller_id', user.id)
      .in('status', ['paid', 'in_delivery']),
  ])

  // ── Aggregate orders ───────────────────────────────────────────────────────
  type OrderRow = {
    seller_amount: number
    created_at:   string
    announcement_id: string
    announcements: {
      id: string; title: string; slug: string; plan: string
      status: string; view_count: number; sale_count: number
      category_id: string
      categories: { name: string } | null
    } | null
  }

  const orders = (ordersRaw ?? []) as unknown as OrderRow[]

  // Daily sales map
  const dailyMap = new Map<string, { revenue: number; count: number }>()
  for (const o of orders) {
    const day = o.created_at.slice(0, 10)
    const cur = dailyMap.get(day) ?? { revenue: 0, count: 0 }
    cur.revenue += Number(o.seller_amount)
    cur.count   += 1
    dailyMap.set(day, cur)
  }

  // Fill in missing days (ensure continuous series)
  const startDate = periodStart(period)
  const today     = new Date()
  const dailySales: DailySale[] = []
  for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
    const key = d.toISOString().slice(0, 10)
    const s   = dailyMap.get(key) ?? { revenue: 0, count: 0 }
    dailySales.push({ date: key, revenue: Math.round(s.revenue * 100) / 100, count: s.count })
  }

  // Per-announcement aggregation (period)
  type AnnAgg = { revenue: number; orders: number }
  const annPeriodMap = new Map<string, AnnAgg>()
  for (const o of orders) {
    const id  = o.announcement_id
    const cur = annPeriodMap.get(id) ?? { revenue: 0, orders: 0 }
    cur.revenue += Number(o.seller_amount)
    cur.orders  += 1
    annPeriodMap.set(id, cur)
  }

  // Per-category aggregation (period)
  type CatAgg = { revenue: number; orders: number }
  const catMap = new Map<string, CatAgg>()
  for (const o of orders) {
    const name = o.announcements?.categories?.name ?? 'Outros'
    const cur  = catMap.get(name) ?? { revenue: 0, orders: 0 }
    cur.revenue += Number(o.seller_amount)
    cur.orders  += 1
    catMap.set(name, cur)
  }

  // ── Build announcements performance table ──────────────────────────────────
  type AnnRow = {
    id: string; title: string; slug: string; plan: string; status: string
    view_count: number; sale_count: number; category_id: string
    categories: { name: string } | null
  }
  const anns = (annsRaw ?? []) as unknown as AnnRow[]

  const announcements: AnnouncementPerf[] = anns.map((a) => {
    const agg     = annPeriodMap.get(a.id) ?? { revenue: 0, orders: 0 }
    const conversion = a.view_count > 0
      ? Math.round((agg.orders / a.view_count) * 10000) / 100
      : 0
    return {
      id:         a.id,
      title:      a.title,
      slug:       a.slug,
      plan:       a.plan,
      status:     a.status,
      views:      a.view_count,
      orders:     agg.orders,
      revenue:    Math.round(agg.revenue * 100) / 100,
      conversion,
    }
  })

  // Top 5 by revenue in period
  const topAnnouncements = [...announcements]
    .filter((a) => a.orders > 0)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)

  // Category slices
  const byCategory: CategorySlice[] = Array.from(catMap.entries())
    .map(([name, agg]) => ({
      name,
      revenue: Math.round(agg.revenue * 100) / 100,
      orders:  agg.orders,
    }))
    .sort((a, b) => b.revenue - a.revenue)

  // ── Summary ────────────────────────────────────────────────────────────────
  const totalRevenue = orders.reduce((s, o) => s + Number(o.seller_amount), 0)
  const totalOrders  = orders.length
  const avgTicket    = totalOrders > 0 ? totalRevenue / totalOrders : 0

  const reviews       = reviewsRaw ?? []
  const totalReviews  = reviews.length
  const positiveCount = reviews.filter((r) => r.type === 'positive').length
  const positiveReviewRate = totalReviews > 0
    ? Math.round((positiveCount / totalReviews) * 100)
    : 0

  // ── Escrow sum ─────────────────────────────────────────────────────────────
  type EscrowRow = { seller_amount: number; escrow_release_at: string | null }
  const escrowRows   = (escrowRaw ?? []) as EscrowRow[]
  const escrowAmount = escrowRows.reduce((s, r) => s + Number(r.seller_amount), 0)
  const nextRelease  = escrowRows
    .map((r) => r.escrow_release_at)
    .filter(Boolean)
    .sort()[0] ?? null

  const data: AnalyticsData = {
    summary: {
      revenue:            Math.round(totalRevenue * 100) / 100,
      orders:             totalOrders,
      avgTicket:          Math.round(avgTicket * 100) / 100,
      positiveReviewRate,
    },
    dailySales,
    topAnnouncements,
    byCategory,
    announcements,
  }

  return NextResponse.json({ ...data, escrow: { amount: Math.round(escrowAmount * 100) / 100, nextRelease } })
}
