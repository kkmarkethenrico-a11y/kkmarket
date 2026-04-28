import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { AdminReportActions } from './AdminReportActions'

export const metadata = { title: 'Moderação — Admin' }
export const dynamic = 'force-dynamic'

const TARGET_LABELS: Record<string, string> = {
  announcement: 'Anúncio', user: 'Usuário', comment: 'Comentário', review: 'Avaliação',
}

export default async function AdminModeracaoPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!me || !['admin', 'moderator'].includes(me.role)) redirect('/')

  const sp = await searchParams
  const statusFilter = ['pending', 'accepted', 'rejected'].includes(sp.status ?? '') ? sp.status! : 'pending'

  const admin = createAdminClient()

  const { data: reports, error } = await admin
    .from('reports')
    .select(`
      id, target_type, target_id, reason, description, status, created_at,
      profiles!reporter_id(username, display_name),
      profiles!moderator_id(username)
    `)
    .eq('status', statusFilter)
    .order('created_at', { ascending: true })
    .limit(100)

  if (error) console.error('[admin/moderacao]', error.message)

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Moderação</h1>
        <p className="text-sm text-muted-foreground">Denúncias enviadas pelos usuários</p>
      </header>

      <nav className="flex gap-2 border-b pb-0">
        {[['pending', 'Pendentes'], ['accepted', 'Aceitas'], ['rejected', 'Rejeitadas']].map(([key, label]) => (
          <Link
            key={key}
            href={`/admin/moderacao?status=${key}`}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              statusFilter === key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>

      <div className="space-y-3">
        {(reports ?? []).map((r: any) => {
          const reporter = r['profiles!reporter_id'] ?? r.profiles
          return (
            <article key={r.id} className="rounded-xl border bg-card p-5 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium uppercase">
                      {TARGET_LABELS[r.target_type] ?? r.target_type}
                    </span>
                    <span className="text-xs text-muted-foreground">ID: {r.target_id.slice(0, 8)}…</span>
                  </div>
                  <p className="font-semibold">{r.reason}</p>
                  {r.description && <p className="text-sm text-muted-foreground">{r.description}</p>}
                  <p className="text-xs text-muted-foreground">
                    Denunciado por @{reporter?.username ?? '?'} em {new Date(r.created_at).toLocaleString('pt-BR')}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">{r.id.slice(0, 8)}</span>
              </div>

              {statusFilter === 'pending' && (
                <AdminReportActions reportId={r.id} />
              )}
            </article>
          )
        })}
        {!reports?.length && (
          <p className="text-center py-10 text-muted-foreground">Nenhuma denúncia {statusFilter === 'pending' ? 'pendente' : statusFilter === 'accepted' ? 'aceita' : 'rejeitada'}.</p>
        )}
      </div>
    </div>
  )
}
