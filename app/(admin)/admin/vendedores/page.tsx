import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { SellerApplicationActions } from './SellerApplicationActions'

export const metadata = { title: 'Vendedores — Admin' }
export const dynamic = 'force-dynamic'

type Profile = {
  id: string
  username: string
  display_name: string | null
  seller_status: string
  seller_applied_at: string | null
  seller_rejection_reason: string | null
}

type Validation = {
  user_id: string
  type: string
  file_url: string | null
  status: string
}

export default async function AdminVendedoresPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: caller } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!caller || !['admin', 'moderator'].includes(caller.role)) {
    redirect('/')
  }

  const { status: filter } = await searchParams
  const statusFilter = filter ?? 'pending'

  const admin = createAdminClient()
  const { data: profiles, error: profilesError } = await admin
    .from('profiles')
    .select('id, username, display_name, seller_status, seller_applied_at, seller_rejection_reason')
    .eq('seller_status', statusFilter)
    .order('seller_applied_at', { ascending: false, nullsFirst: false })
    .limit(100)

  if (profilesError) {
    console.error('[admin/vendedores] profiles query error:', profilesError.message)
  }

  const userIds = (profiles ?? []).map((p) => p.id)

  // Fetch emails from auth.users (profiles table doesn't store email)
  const emailMap = new Map<string, string>()
  await Promise.all(
    userIds.map(async (id) => {
      const { data } = await admin.auth.admin.getUserById(id)
      if (data.user?.email) emailMap.set(id, data.user.email)
    })
  )

  const { data: validations } = userIds.length
    ? await admin
        .from('user_validations')
        .select('user_id, type, file_url, status')
        .in('user_id', userIds)
        .in('type', ['identity_front', 'identity_back', 'selfie'])
    : { data: [] as Validation[] }

  const docsByUser = new Map<string, Record<string, string | null>>()
  for (const v of (validations ?? []) as Validation[]) {
    const m = docsByUser.get(v.user_id) ?? {}
    m[v.type] = v.file_url
    docsByUser.set(v.user_id, m)
  }

  const tabs: Array<{ key: string; label: string }> = [
    { key: 'pending',  label: 'Pendentes' },
    { key: 'approved', label: 'Aprovados' },
    { key: 'rejected', label: 'Rejeitados' },
  ]

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Qualificação de Vendedores</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Analise documentos enviados e aprove ou rejeite a qualificação.
        </p>
      </header>

      <nav className="flex gap-2 border-b">
        {tabs.map((t) => (
          <a
            key={t.key}
            href={`/admin/vendedores?status=${t.key}`}
            className={`px-4 py-2 text-sm font-medium ${
              statusFilter === t.key
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </a>
        ))}
      </nav>

      {(!profiles || profiles.length === 0) && (
        <p className="text-sm text-muted-foreground">Nenhum pedido encontrado.</p>
      )}

      <div className="space-y-4">
        {(profiles ?? []).map((p: Profile) => {
          const docs = docsByUser.get(p.id) ?? {}
          return (
            <article key={p.id} className="rounded-lg border bg-card p-5 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-semibold">
                    {p.display_name ?? p.username}{' '}
                    <span className="text-xs text-muted-foreground">@{p.username}</span>
                  </h2>
                  <p className="text-xs text-muted-foreground">{emailMap.get(p.id) ?? '—'}</p>
                  {p.seller_applied_at && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Aplicou em {new Date(p.seller_applied_at).toLocaleString('pt-BR')}
                    </p>
                  )}
                  {p.seller_status === 'rejected' && p.seller_rejection_reason && (
                    <p className="mt-2 text-xs text-red-500">
                      Motivo: {p.seller_rejection_reason}
                    </p>
                  )}
                </div>
                <span className="text-xs uppercase rounded-full bg-muted px-2 py-1">
                  {p.seller_status}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {(['identity_front', 'identity_back', 'selfie'] as const).map((t) => {
                  const url = docs[t]
                  const label = t === 'identity_front' ? 'Doc Frente' : t === 'identity_back' ? 'Doc Verso' : 'Selfie'
                  return (
                    <div key={t} className="rounded-md border p-2">
                      <p className="text-xs font-medium mb-2">{label}</p>
                      {url ? (
                        <a href={url} target="_blank" rel="noopener noreferrer" className="block">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={url}
                            alt={label}
                            className="h-32 w-full rounded object-cover bg-muted"
                          />
                          <span className="mt-1 block text-xs text-primary underline">Ver completo</span>
                        </a>
                      ) : (
                        <div className="h-32 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">
                          Sem arquivo
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {p.seller_status === 'pending' && (
                <SellerApplicationActions userId={p.id} />
              )}
            </article>
          )
        })}
      </div>
    </div>
  )
}
