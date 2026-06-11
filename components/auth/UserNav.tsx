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
          className="text-sm font-medium text-[var(--gm-ink-dim)] hover:text-[var(--gm-ink)] transition-colors"
        >
          Entrar
        </Link>
        <Link
          href="/cadastro"
          className="rounded-xl bg-[var(--gm-violet)] px-4 py-2 text-sm font-semibold text-[#1a1126] transition-all hover:opacity-90 active:scale-[0.97]"
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
