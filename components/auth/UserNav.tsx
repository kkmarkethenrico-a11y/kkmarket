import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { UserDropdown } from '@/components/auth/UserDropdown'

export async function UserNav() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="flex items-center gap-3">
        <Link
          href="/login"
          className="text-sm font-medium text-zinc-300 hover:text-white transition-colors"
        >
          Entrar
        </Link>
        <Link
          href="/cadastro"
          className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-violet-500 active:scale-[0.97]"
        >
          Criar conta
        </Link>
      </div>
    )
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, display_name, avatar_url, role, seller_status, last_seen_at')
    .eq('id', user.id)
    .single()

  const displayName = profile?.display_name ?? profile?.username ?? user.email ?? 'Usuário'
  const isOnline = profile?.last_seen_at
    ? new Date().getTime() - new Date(profile.last_seen_at).getTime() < 5 * 60 * 1000
    : true

  return (
    <UserDropdown
      displayName={displayName}
      username={profile?.username ?? ''}
      email={user.email ?? ''}
      avatarUrl={profile?.avatar_url ?? null}
      role={profile?.role ?? 'client'}
      sellerStatus={(profile as { seller_status?: string } | null)?.seller_status ?? 'disabled'}
      isOnline={isOnline}
    />
  )
}
