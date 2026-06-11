import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import DashboardClient from './DashboardClient'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Painel — GameMarket',
}

export default async function PainelPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()

  // User stats + escrow
  const [statsRes, escrowRes, ordersRes, wishlistRes] = await Promise.all([
    admin.from('user_stats')
      .select('wallet_balance, points_balance, total_purchases, total_sales, reviews_positive, reviews_neutral, reviews_negative')
      .eq('user_id', user.id)
      .maybeSingle(),
    admin.from('orders')
      .select('seller_amount, escrow_release_at')
      .eq('seller_id', user.id)
      .in('status', ['paid', 'in_delivery']),
    admin.from('orders')
      .select('id, status, created_at, announcements:announcement_id(title)')
      .eq('buyer_id', user.id)
      .order('created_at', { ascending: false })
      .limit(3),
    admin.from('wishlist')
      .select('id, announcements:announcement_id(title, unit_price, slug, announcement_images(url, is_cover, sort_order))')
      .eq('user_id', user.id)
      .limit(3),
  ])

  const stats = statsRes.data
  const escrowAmount = (escrowRes.data ?? []).reduce((s, r) => s + Number(r.seller_amount), 0)
  const escrowRelease = (escrowRes.data ?? [])
    .map((r) => r.escrow_release_at).filter(Boolean).sort()[0] ?? null

  return (
    <DashboardClient
      walletBalance={Number(stats?.wallet_balance ?? 0)}
      escrowAmount={Math.round(escrowAmount * 100) / 100}
      escrowRelease={escrowRelease}
      pointsBalance={Number(stats?.points_balance ?? 0)}
      totalPurchases={Number(stats?.total_purchases ?? 0)}
      totalSales={Number(stats?.total_sales ?? 0)}
      recentOrders={(ordersRes.data ?? []) as any}
      wishlistItems={(wishlistRes.data ?? []) as any}
    />
  )
}
