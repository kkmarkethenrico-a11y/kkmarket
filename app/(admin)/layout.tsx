import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import AdminSidebar from './AdminSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
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

  // Pending count for badge
  const admin = createAdminClient()
  const { count: pendingCount } = await admin
    .from('announcements')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending')

  return (
    <div className="flex min-h-screen">
      <AdminSidebar pendingCount={pendingCount ?? 0} role={profile.role} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
