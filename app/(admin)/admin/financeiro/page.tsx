import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import AdminWithdrawalsClient from './AdminWithdrawalsClient'

export const dynamic = 'force-dynamic'

interface SearchProps {
  searchParams: Promise<{ status?: string }>
}

export default async function AdminFinanceiroPage({ searchParams }: SearchProps) {
  const sp = await searchParams
  const status = sp.status ?? 'pending'

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

  const admin = createAdminClient()
  let query = admin
    .from('withdrawal_requests')
    .select(`
      id, user_id, amount, fee, net_amount, type, pix_key, pix_key_type,
      status, rejection_note, processed_at, created_at,
      profiles:user_id (id, username, display_name, email)
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  if (status !== 'all') {
    query = query.eq('status', status)
  }

  const { data: items } = await query

  return (
    <div className="container mx-auto max-w-7xl py-8 px-4 space-y-6">
      <h1 className="text-2xl font-bold">Saques</h1>
      <AdminWithdrawalsClient
        items={(items ?? []) as never}
        currentStatus={status}
      />
    </div>
  )
}
