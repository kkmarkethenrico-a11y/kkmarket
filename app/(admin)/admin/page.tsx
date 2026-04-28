import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  Users, ShoppingCart, Megaphone, Wallet,
  Clock, AlertTriangle, TrendingUp, UserCheck,
} from 'lucide-react'

export const metadata = { title: 'Dashboard — Admin' }
export const dynamic = 'force-dynamic'

function StatCard({
  title, value, sub, href, icon: Icon, color,
}: {
  title: string
  value: string | number
  sub?: string
  href?: string
  icon: React.FC<{ className?: string }>
  color: string
}) {
  const inner = (
    <div className={`rounded-xl border bg-card p-5 space-y-3 hover:border-zinc-600 transition-colors ${href ? 'cursor-pointer' : ''}`}>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{title}</p>
        <div className={`rounded-lg p-2 ${color}`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
      </div>
      <p className="text-3xl font-bold">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
  return href ? <Link href={href}>{inner}</Link> : inner
}

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!me || !['admin', 'moderator'].includes(me.role)) redirect('/')

  const admin = createAdminClient()

  const [
    { count: totalUsers },
    { count: totalAnnouncements },
    { count: totalOrders },
    { count: pendingAnnouncements },
    { count: pendingSellers },
    { count: pendingWithdrawals },
    { count: openDisputes },
    { count: pendingReports },
    { data: recentOrders },
    { data: revenue },
  ] = await Promise.all([
    admin.from('profiles').select('id', { count: 'exact', head: true }),
    admin.from('announcements').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    admin.from('orders').select('id', { count: 'exact', head: true }),
    admin.from('announcements').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    admin.from('profiles').select('id', { count: 'exact', head: true }).eq('seller_status', 'pending'),
    admin.from('withdrawal_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    admin.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'disputed'),
    admin.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    admin.from('orders')
      .select('id, amount, status, created_at, profiles!buyer_id(username), announcements!announcement_id(title)')
      .in('status', ['completed', 'in_delivery', 'paid', 'delivered'])
      .order('created_at', { ascending: false })
      .limit(8),
    admin.from('orders')
      .select('platform_fee')
      .eq('status', 'completed'),
  ])

  const totalRevenue = (revenue ?? []).reduce((sum, o) => sum + (o.platform_fee ?? 0), 0)

  return (
    <div className="p-6 space-y-8">
      <header>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Visão geral da plataforma</p>
      </header>

      {/* Alertas urgentes */}
      {(pendingAnnouncements ?? 0) + (pendingSellers ?? 0) + (openDisputes ?? 0) + (pendingWithdrawals ?? 0) > 0 && (
        <section className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-2">
          <p className="flex items-center gap-2 text-sm font-semibold text-amber-400">
            <AlertTriangle className="h-4 w-4" /> Itens que precisam de atenção
          </p>
          <div className="flex flex-wrap gap-3 text-xs">
            {(pendingAnnouncements ?? 0) > 0 && (
              <Link href="/admin/anuncios?tab=pending" className="rounded-full bg-amber-500/20 px-3 py-1 text-amber-300 hover:bg-amber-500/30">
                {pendingAnnouncements} anúncio(s) pendente(s)
              </Link>
            )}
            {(pendingSellers ?? 0) > 0 && (
              <Link href="/admin/vendedores?status=pending" className="rounded-full bg-amber-500/20 px-3 py-1 text-amber-300 hover:bg-amber-500/30">
                {pendingSellers} vendedor(es) aguardando
              </Link>
            )}
            {(openDisputes ?? 0) > 0 && (
              <Link href="/admin/pedidos?status=disputed" className="rounded-full bg-red-500/20 px-3 py-1 text-red-300 hover:bg-red-500/30">
                {openDisputes} disputa(s) aberta(s)
              </Link>
            )}
            {(pendingWithdrawals ?? 0) > 0 && (
              <Link href="/admin/financeiro" className="rounded-full bg-amber-500/20 px-3 py-1 text-amber-300 hover:bg-amber-500/30">
                {pendingWithdrawals} saque(s) pendente(s)
              </Link>
            )}
          </div>
        </section>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard title="Usuários" value={(totalUsers ?? 0).toLocaleString('pt-BR')} href="/admin/usuarios" icon={Users} color="bg-blue-600" />
        <StatCard title="Anúncios ativos" value={(totalAnnouncements ?? 0).toLocaleString('pt-BR')} href="/admin/anuncios" icon={Megaphone} color="bg-violet-600" />
        <StatCard title="Pedidos totais" value={(totalOrders ?? 0).toLocaleString('pt-BR')} href="/admin/pedidos" icon={ShoppingCart} color="bg-green-600" />
        <StatCard title="Receita (taxa)" value={`R$ ${totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={TrendingUp} color="bg-amber-600" />
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard title="Anúncios pendentes" value={pendingAnnouncements ?? 0} href="/admin/anuncios?tab=pending" icon={Clock} color="bg-yellow-600" />
        <StatCard title="Sellers aguardando" value={pendingSellers ?? 0} href="/admin/vendedores" icon={UserCheck} color="bg-orange-600" />
        <StatCard title="Disputas abertas" value={openDisputes ?? 0} href="/admin/pedidos?status=disputed" icon={AlertTriangle} color="bg-red-600" />
        <StatCard title="Denúncias pendentes" value={pendingReports ?? 0} href="/admin/moderacao" icon={AlertTriangle} color="bg-pink-600" />
      </div>

      {/* Recent orders */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Pedidos recentes</h2>
          <Link href="/admin/pedidos" className="text-sm text-primary hover:underline">Ver todos →</Link>
        </div>
        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Comprador</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Anúncio</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Valor</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(recentOrders ?? []).map((o: any) => (
                <tr key={o.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-zinc-300">
                    @{(o.profiles as any)?.username ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-zinc-400 max-w-[180px] truncate">
                    {(o.announcements as any)?.title ?? '—'}
                  </td>
                  <td className="px-4 py-3 font-medium text-green-400">
                    R$ {Number(o.amount).toFixed(2).replace('.', ',')}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] uppercase font-medium">
                      {o.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-500 text-xs">
                    {new Date(o.created_at).toLocaleDateString('pt-BR')}
                  </td>
                </tr>
              ))}
              {!recentOrders?.length && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Nenhum pedido ainda.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
