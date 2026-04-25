import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import VerifierAdminClient from './VerifierAdminClient'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ tab?: string; q?: string }>
}

const TABS = ['pending', 'fraudulent', 'suspicious', 'rejected'] as const
type Tab = typeof TABS[number]

export default async function AdminVerificadorPage({ searchParams }: PageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || (profile.role !== 'admin' && profile.role !== 'moderator')) {
    redirect('/painel')
  }

  const { tab: tabParam, q } = await searchParams
  const tab: Tab = (TABS as readonly string[]).includes(tabParam ?? '')
    ? (tabParam as Tab)
    : 'pending'
  const search = q?.trim() ?? ''

  const admin = createAdminClient()

  let query = admin
    .from('account_verifier')
    .select(`
      id, identifier, status, description, evidence_url,
      reporter_email, moderator_note, moderated_at, created_at,
      reported_by, verified_by,
      categories:game_id ( id, name, slug ),
      reporter:profiles!reported_by ( username, display_name )
    `)
    .eq('status', tab)
    .order('created_at', { ascending: tab === 'pending' })
    .limit(100)

  if (search.length >= 2) {
    query = query.ilike('identifier', `%${search}%`)
  }

  const { data: rows } = await query

  // Counts for tab badges
  const counts: Record<Tab, number> = { pending: 0, fraudulent: 0, suspicious: 0, rejected: 0 }
  await Promise.all(
    TABS.map(async (t) => {
      const { count } = await admin
        .from('account_verifier')
        .select('id', { count: 'exact', head: true })
        .eq('status', t)
      counts[t] = count ?? 0
    }),
  )

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-white">Verificador de Contas — Moderação</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Valide denúncias da comunidade e gerencie o banco antifraude público.
        </p>
      </header>

      <VerifierAdminClient
        rows={(rows ?? []) as never[]}
        currentTab={tab}
        counts={counts}
        search={search}
      />
    </div>
  )
}
