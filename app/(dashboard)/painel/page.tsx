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

  // Wallet balance
  const { data: stats } = await admin
    .from('user_stats')
    .select('wallet_balance')
    .eq('user_id', user.id)
    .maybeSingle()

  // Escrow: pedidos paid ou in_delivery (ainda bloqueados)
  const { data: escrowRows } = await admin
    .from('orders')
    .select('seller_amount, escrow_release_at')
    .eq('seller_id', user.id)
    .in('status', ['paid', 'in_delivery'])

  const escrowAmount = (escrowRows ?? []).reduce(
    (s, r) => s + Number(r.seller_amount), 0
  )
  const escrowRelease = (escrowRows ?? [])
    .map((r) => r.escrow_release_at)
    .filter(Boolean)
    .sort()[0] ?? null

  return (
    <DashboardClient
      walletBalance={Number(stats?.wallet_balance ?? 0)}
      escrowAmount={Math.round(escrowAmount * 100) / 100}
      escrowRelease={escrowRelease}
    />
  )
}
