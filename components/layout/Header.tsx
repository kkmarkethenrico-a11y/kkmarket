import Link from 'next/link'
import Image from 'next/image'
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { HeaderSearch } from '@/components/layout/HeaderSearch'
import { CategoryMegaMenu } from '@/components/layout/CategoryMegaMenu'
import { MobileNav } from '@/components/layout/MobileNav'
import { UserNav } from '@/components/auth/UserNav'
import { CartButton } from '@/components/layout/CartButton'

export async function Header() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile: { username: string; display_name?: string; avatar_url?: string; role?: string; seller_status?: string } | null = null
  let pointsBalance = 0
  let userLevel = 1
  let xpPercent = 0

  if (user) {
    const [profileRes, statsRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('username, display_name, avatar_url, role, seller_status')
        .eq('id', user.id)
        .single(),
      createAdminClient()
        .from('user_stats')
        .select('points_balance')
        .eq('user_id', user.id)
        .single(),
    ])
    const raw = profileRes.data
    profile = raw
      ? {
          username:     raw.username,
          display_name: raw.display_name ?? undefined,
          avatar_url:   raw.avatar_url   ?? undefined,
          role:         raw.role         ?? undefined,
          seller_status: (raw as { seller_status?: string }).seller_status ?? 'disabled',
        }
      : null
    pointsBalance = statsRes.data?.points_balance ?? 0

    // Derive level from points (100 pts per level)
    userLevel  = Math.max(1, Math.floor(pointsBalance / 100) + 1)
    xpPercent  = (pointsBalance % 100)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[var(--gm-ink-faint)]/40 bg-[var(--gm-paper)]/90 backdrop-blur-xl">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-4">

          {/* Logo */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center transition-opacity hover:opacity-90">
              <Image
                src="/images/logo.png"
                alt="KKmarket Logo"
                width={140}
                height={40}
                priority
                className="h-10 w-auto object-contain"
              />
            </Link>

            {/* Navegação Desktop */}
            <nav className="hidden lg:flex items-center gap-6">
              <CategoryMegaMenu />
              <Link
                href="/blog"
                className="text-sm font-medium text-[var(--gm-ink-dim)] hover:text-[var(--gm-ink)] transition-colors"
              >
                Blog
              </Link>
            </nav>
          </div>

          {/* Busca (Desktop) */}
          <div className="hidden flex-1 items-center justify-center lg:flex max-w-xl px-4">
            <HeaderSearch />
          </div>

          {/* Ações */}
          <div className="flex items-center gap-3">

            {/* GG Points + XP HUD — only when logged in */}
            {user && (
              <Link
                href="/gg-points"
                className="hidden lg:flex flex-col items-end gap-0.5 group"
                title="Seus GG Points"
              >
                <div className="flex items-center gap-1.5">
                  <span className="rank-chip text-[9px]">Lv {userLevel}</span>
                  <span className="text-xs font-bold text-[var(--gm-violet)] group-hover:text-[var(--gm-cyan)] transition-colors">
                    {pointsBalance.toLocaleString('pt-BR')} pts
                  </span>
                </div>
                <div className="xp-bar w-20">
                  <div className="xp-bar-fill" style={{ width: `${xpPercent}%` }} />
                </div>
              </Link>
            )}

            {user && (
              <Link
                href="/painel"
                className="hidden lg:flex items-center gap-1.5 rounded-lg border border-[var(--gm-ink-faint)]/60 px-3 py-1.5 text-sm font-semibold text-[var(--gm-ink-dim)] transition-all hover:border-[var(--gm-violet)]/60 hover:text-[var(--gm-ink)] active:scale-95"
              >
                Painel
              </Link>
            )}

            {user && (
              <Link
                href={profile?.seller_status === 'approved' ? '/meus-anuncios/novo' : '/verificacao'}
                className="hidden lg:flex items-center gap-1.5 rounded-lg bg-[var(--gm-violet)] px-4 py-1.5 text-sm font-bold text-[#1a1126] transition-all hover:opacity-90 active:scale-95 gm-glow"
              >
                <Plus className="h-4 w-4" />
                {profile?.seller_status === 'approved' ? 'Anunciar' : 'Vender'}
              </Link>
            )}

            {/* Cart */}
            <CartButton />

            {/* Desktop UserNav */}
            <div className="hidden lg:block border-l border-[var(--gm-ink-faint)]/40 pl-3 ml-1">
              <UserNav />
            </div>

            {/* Mobile nav */}
            <MobileNav isAuthenticated={!!user} profile={profile} sellerStatus={profile?.seller_status ?? 'disabled'} />
          </div>
        </div>
      </div>

      {/* Subtle gold/cyan gradient line at the bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--gm-cyan)]/20 via-[var(--gm-violet)]/40 via-[var(--gm-cyan)]/20 to-transparent" />
    </header>
  )
}
