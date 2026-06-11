import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import NotificationsClient from './NotificationsClient'

export const metadata = {
  title: 'Notificações — KKmarket',
}

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/notificacoes')

  const admin = createAdminClient()
  
  const { data: notifications } = await admin
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <header className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[var(--gm-ink)]">Notificações</h1>
          <p className="mt-1 text-sm text-[var(--gm-ink-faint)]">
            Fique por dentro do que acontece na sua conta.
          </p>
        </div>
      </header>

      <NotificationsClient items={notifications as any} />
    </div>
  )
}