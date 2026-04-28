import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { AdminUserActions } from './AdminUserActions'

export const metadata = { title: 'Usuários — Admin' }
export const dynamic = 'force-dynamic'

export default async function AdminUsuariosPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; status?: string; q?: string; page?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!me || !['admin', 'moderator'].includes(me.role)) redirect('/')

  const sp = await searchParams
  const roleFilter = ['client', 'moderator', 'admin'].includes(sp.role ?? '') ? sp.role! : ''
  const statusFilter = ['active', 'suspended', 'banned'].includes(sp.status ?? '') ? sp.status! : ''
  const search = sp.q?.trim() ?? ''
  const page = Math.max(1, parseInt(sp.page ?? '1'))
  const PAGE_SIZE = 50
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const admin = createAdminClient()

  let query = admin
    .from('profiles')
    .select('id, username, display_name, role, status, seller_status, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (roleFilter) query = (query as any).eq('role', roleFilter)
  if (statusFilter) query = (query as any).eq('status', statusFilter)
  if (search) query = (query as any).or(`username.ilike.%${search}%,display_name.ilike.%${search}%`)

  const { data: profiles, count, error } = await query
  if (error) console.error('[admin/usuarios]', error.message)

  const total = count ?? 0
  const totalPages = Math.ceil(total / PAGE_SIZE)

  const buildHref = (extra: Record<string, string>) => {
    const params = new URLSearchParams({
      ...(roleFilter && { role: roleFilter }),
      ...(statusFilter && { status: statusFilter }),
      ...(search && { q: search }),
      ...extra,
    })
    return `/admin/usuarios?${params}`
  }

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Usuários</h1>
        <p className="text-sm text-muted-foreground">{total.toLocaleString('pt-BR')} usuário(s)</p>
      </header>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <form method="GET" action="/admin/usuarios" className="flex gap-2">
          <input
            name="q"
            defaultValue={search}
            placeholder="Buscar username…"
            className="rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {roleFilter && <input type="hidden" name="role" value={roleFilter} />}
          {statusFilter && <input type="hidden" name="status" value={statusFilter} />}
          <button type="submit" className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90">Buscar</button>
        </form>

        <div className="flex gap-1">
          {[['', 'Todos os papéis'], ['client', 'Clientes'], ['moderator', 'Moderadores'], ['admin', 'Admins']].map(([val, label]) => (
            <Link key={val} href={buildHref({ role: val, page: '1' })}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${roleFilter === val ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'}`}>
              {label}
            </Link>
          ))}
        </div>

        <div className="flex gap-1">
          {[['', 'Todos status'], ['active', 'Ativos'], ['suspended', 'Suspensos'], ['banned', 'Banidos']].map(([val, label]) => (
            <Link key={val} href={buildHref({ status: val, page: '1' })}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${statusFilter === val ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'}`}>
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* Tabela */}
      <div className="rounded-xl border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Usuário</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Papel</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Vendedor</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Desde</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {(profiles ?? []).map((p: any) => (
              <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium text-zinc-200">{p.display_name ?? p.username}</p>
                    <p className="text-xs text-zinc-500">@{p.username}</p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                    p.role === 'admin' ? 'bg-red-500/20 text-red-300' :
                    p.role === 'moderator' ? 'bg-blue-500/20 text-blue-300' :
                    'bg-zinc-700 text-zinc-300'
                  }`}>{p.role}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                    p.status === 'active' ? 'bg-green-500/20 text-green-300' :
                    p.status === 'suspended' ? 'bg-yellow-500/20 text-yellow-300' :
                    'bg-red-500/20 text-red-300'
                  }`}>{p.status}</span>
                </td>
                <td className="px-4 py-3 text-xs text-zinc-400">{p.seller_status ?? '—'}</td>
                <td className="px-4 py-3 text-xs text-zinc-500">
                  {new Date(p.created_at).toLocaleDateString('pt-BR')}
                </td>
                <td className="px-4 py-3">
                  <AdminUserActions userId={p.id} currentRole={p.role} currentStatus={p.status} currentAdminId={user.id} />
                </td>
              </tr>
            ))}
            {!profiles?.length && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">Nenhum usuário encontrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center gap-2">
          {page > 1 && <Link href={buildHref({ page: String(page - 1) })} className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted">← Anterior</Link>}
          <span className="text-sm text-muted-foreground">Página {page} de {totalPages}</span>
          {page < totalPages && <Link href={buildHref({ page: String(page + 1) })} className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted">Próxima →</Link>}
        </div>
      )}
    </div>
  )
}
