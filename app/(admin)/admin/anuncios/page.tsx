import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import AnnouncementsModeration from './AnnouncementsModeration'

export const dynamic = 'force-dynamic'

type Tab = 'pending' | 'active' | 'paused' | 'rejected'

interface PageProps {
  searchParams: Promise<{ tab?: string }>
}

const VALID_TABS: Tab[] = ['pending', 'active', 'paused', 'rejected']

export default async function AdminAnunciosPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const tab: Tab = (VALID_TABS.includes(sp.tab as Tab) ? sp.tab : 'pending') as Tab

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: me } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!me || (me.role !== 'admin' && me.role !== 'moderator')) redirect('/painel')

  const admin = createAdminClient()

  const order = tab === 'pending'
    ? { column: 'created_at', ascending: true }   // mais antigos primeiro
    : { column: 'created_at', ascending: false }

  const { data: items, count } = await admin
    .from('announcements')
    .select(
      `id, title, slug, description, model, plan, unit_price, stock_quantity,
       status, rejection_reason, approved_at, created_at, updated_at,
       has_auto_delivery, sale_count,
       profiles:user_id (id, username, display_name, avatar_url),
       user_stats:user_id (reviews_positive, reviews_neutral, reviews_negative, total_sales),
       categories:category_id (id, name),
       announcement_images (url, is_cover, sort_order)`,
      { count: 'exact' },
    )
    .eq('status', tab)
    .order(order.column, { ascending: order.ascending })
    .limit(100)

  // Pending count badge
  const { count: pendingCount } = await admin
    .from('announcements')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending')

  return (
    <div className="container mx-auto max-w-7xl py-8 px-4 space-y-6">
      <h1 className="text-2xl font-bold">Moderação de Anúncios</h1>

      <AnnouncementsModeration
        items={(items ?? []) as never}
        total={count ?? 0}
        currentTab={tab}
        pendingCount={pendingCount ?? 0}
      />
    </div>
  )
}