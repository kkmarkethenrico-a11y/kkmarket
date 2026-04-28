import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const metadata = { title: 'Pedidos — Admin' }
export const dynamic = 'force-dynamic'

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending_payment:  { label: 'Aguard. pagamento', color: 'text-zinc-400' },
  paid:             { label: 'Pago',               color: 'text-blue-400' },
  in_delivery:      { label: 'Em entrega',          color: 'text-yellow-400' },
  delivered:        { label: 'Entregue',            color: 'text-cyan-400' },
  disputed:         { label: 'Disputado',           color: 'text-red-400' },
  refunded:         { label: 'Reembolsado',         color: 'text-orange-400' },
  cancelled:        { label: 'Cancelado',           color: 'text-zinc-500' },
  completed:        { label: 'Concluído',           color: 'text-green-400' },
}

const VALID_STATUS = Object.keys(STATUS_LABELS)

export default async function AdminPedidosPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!me || !['admin', 'moderator'].includes(me.role)) redirect('/')

  const sp = await searchParams
  const statusFilter = VALID_STATUS.includes(sp.status ?? '') ? sp.status! : ''
  const page = Math.max(1, parseInt(sp.page ?? '1'))
  const PAGE_SIZE = 50
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const admin = createAdminClient()

  let query = admin
    .from('orders')
    .select(
      `id, amount, platform_fee, status, payment_method, created_at,
       profiles!buyer_id(username, display_name),
       profiles!seller_id(username, display_name),
       announcements!announcement_id(title, slug)`,
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })
    .range(from, to)

  if (statusFilter) query = (query as any).eq('status', statusFilter)

  const { data: orders, count, error } = await query

  if (error) console.error('[admin/pedidos]', error.message)

  const total = count ?? 0
  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Pedidos</h1>
        <p className="text-sm text-muted-foreground">{total.toLocaleString('pt-BR')} pedido(s) encontrado(s)</p>
      </header>

      {/* Filtro de status */}
      <nav className="flex flex-wrap gap-2">
        <Link
          href="/admin/pedidos"
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${!statusFilter ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'}`}
        >
          Todos
        </Link>
        {Object.entries(STATUS_LABELS).map(([key, { label }]) => (
          <Link
            key={key}
            href={`/admin/pedidos?status=${key}`}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${statusFilter === key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'}`}
          >
            {label}
          </Link>
        ))}
      </nav>

      {/* Tabela */}
      <div className="rounded-xl border overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">ID</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Comprador</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Vendedor</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Anúncio</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Valor</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Taxa</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Data</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {(orders ?? []).map((o: any) => {
              const s = STATUS_LABELS[o.status] ?? { label: o.status, color: 'text-zinc-400' }
              return (
                <tr key={o.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-[11px] text-zinc-500">{o.id.slice(0, 8)}…</td>
                  <td className="px-4 py-3 text-zinc-300">@{(o['profiles!buyer_id'] as any)?.username ?? (o.profiles as any)?.username ?? '—'}</td>
                  <td className="px-4 py-3 text-zinc-400">@{(o['profiles!seller_id'] as any)?.username ?? '—'}</td>
                  <td className="px-4 py-3 text-zinc-400 max-w-[160px] truncate">
                    {(o.announcements as any)?.title ?? '—'}
                  </td>
                  <td className="px-4 py-3 font-semibold text-green-400">
                    R$ {Number(o.amount).toFixed(2).replace('.', ',')}
                  </td>
                  <td className="px-4 py-3 text-zinc-500">
                    R$ {Number(o.platform_fee).toFixed(2).replace('.', ',')}
                  </td>
                  <td className={`px-4 py-3 font-medium text-xs ${s.color}`}>{s.label}</td>
                  <td className="px-4 py-3 text-zinc-500 text-xs">
                    {new Date(o.created_at).toLocaleDateString('pt-BR')}
                  </td>
                </tr>
              )
            })}
            {!orders?.length && (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">Nenhum pedido encontrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center gap-2">
          {page > 1 && (
            <Link href={`/admin/pedidos?${statusFilter ? `status=${statusFilter}&` : ''}page=${page - 1}`} className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted">
              ← Anterior
            </Link>
          )}
          <span className="text-sm text-muted-foreground">Página {page} de {totalPages}</span>
          {page < totalPages && (
            <Link href={`/admin/pedidos?${statusFilter ? `status=${statusFilter}&` : ''}page=${page + 1}`} className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted">
              Próxima →
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
