import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const metadata = { title: 'Pontos GG — Admin' }
export const dynamic = 'force-dynamic'

const TYPE_LABELS: Record<string, { label: string; color: string; sign: string }> = {
  purchase_earn: { label: 'Ganho (compra)',     color: 'text-green-400',  sign: '+' },
  sale_earn:     { label: 'Ganho (venda)',       color: 'text-green-400',  sign: '+' },
  coupon:        { label: 'Cupom',               color: 'text-blue-400',   sign: '+' },
  event:         { label: 'Evento',              color: 'text-purple-400', sign: '+' },
  loyalty:       { label: 'Fidelidade',          color: 'text-cyan-400',   sign: '+' },
  redeem:        { label: 'Resgate',             color: 'text-red-400',    sign: '–' },
  expire:        { label: 'Expirado',            color: 'text-zinc-500',   sign: '–' },
}

export default async function AdminPontosPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; page?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!me || !['admin', 'moderator'].includes(me.role)) redirect('/')

  const sp = await searchParams
  const typeFilter = Object.keys(TYPE_LABELS).includes(sp.type ?? '') ? sp.type! : ''
  const page = Math.max(1, parseInt(sp.page ?? '1'))
  const PAGE_SIZE = 60
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const admin = createAdminClient()

  // Total points in circulation
  const { data: totals } = await admin
    .from('user_stats')
    .select('points_balance')

  const totalPoints = (totals ?? []).reduce((s: number, r: any) => s + (r.points_balance ?? 0), 0)

  let query = admin
    .from('points_transactions')
    .select(`id, type, amount, description, expires_at, created_at, profiles!user_id(username, display_name)`, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (typeFilter) query = (query as any).eq('type', typeFilter)

  const { data: txs, count } = await query

  const total = count ?? 0
  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Pontos GG</h1>
        <p className="text-sm text-muted-foreground">
          {totalPoints.toLocaleString('pt-BR')} pontos em circulação · {total.toLocaleString('pt-BR')} transações
        </p>
      </header>

      {/* Filtro de tipo */}
      <nav className="flex flex-wrap gap-2">
        <Link href="/admin/pontos" className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${!typeFilter ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'}`}>Todos</Link>
        {Object.entries(TYPE_LABELS).map(([key, { label }]) => (
          <Link key={key} href={`/admin/pontos?type=${key}`}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${typeFilter === key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'}`}>
            {label}
          </Link>
        ))}
      </nav>

      <div className="rounded-xl border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Usuário</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tipo</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Pontos</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Descrição</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Expira</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Data</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {(txs ?? []).map((tx: any) => {
              const t = TYPE_LABELS[tx.type] ?? { label: tx.type, color: 'text-zinc-400', sign: '' }
              const profile = tx.profiles
              return (
                <tr key={tx.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-zinc-200">{profile?.display_name ?? profile?.username ?? '—'}</p>
                    <p className="text-xs text-zinc-500">@{profile?.username}</p>
                  </td>
                  <td className="px-4 py-3"><span className={`text-xs font-medium ${t.color}`}>{t.label}</span></td>
                  <td className={`px-4 py-3 font-bold ${t.color}`}>{t.sign}{tx.amount.toLocaleString('pt-BR')}</td>
                  <td className="px-4 py-3 text-xs text-zinc-400 max-w-[200px] truncate">{tx.description ?? '—'}</td>
                  <td className="px-4 py-3 text-xs text-zinc-500">
                    {tx.expires_at ? new Date(tx.expires_at).toLocaleDateString('pt-BR') : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-500">
                    {new Date(tx.created_at).toLocaleDateString('pt-BR')}
                  </td>
                </tr>
              )
            })}
            {!txs?.length && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">Nenhuma transação encontrada.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-2">
          {page > 1 && <Link href={`/admin/pontos?${typeFilter ? `type=${typeFilter}&` : ''}page=${page - 1}`} className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted">← Anterior</Link>}
          <span className="text-sm text-muted-foreground">Página {page} de {totalPages}</span>
          {page < totalPages && <Link href={`/admin/pontos?${typeFilter ? `type=${typeFilter}&` : ''}page=${page + 1}`} className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted">Próxima →</Link>}
        </div>
      )}
    </div>
  )
}
