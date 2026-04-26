import Link from 'next/link'
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { HeaderSearch } from '@/components/layout/HeaderSearch'
import { CategoryMegaMenu } from '@/components/layout/CategoryMegaMenu'
import { MobileNav } from '@/components/layout/MobileNav'
import { UserNav } from '@/components/auth/UserNav'

export async function Header() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  let profile: { username: string; display_name?: string; avatar_url?: string; role?: string } | null = null
  let pointsBalance = 0
  if (user) {
    const [profileRes, statsRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('username, display_name, avatar_url, role')
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
        }
      : null
    pointsBalance = statsRes.data?.points_balance ?? 0
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl supports-[backdrop-filter]:bg-zinc-950/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          
          {/* Logo */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-90">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600 text-white">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  <path d="M6 12L3.269 3.125A59.769 59.769 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              </div>
              <span className="text-xl font-bold tracking-tight text-white hidden sm:inline-block">
                Game<span className="text-violet-500">Market</span>
              </span>
            </Link>

            {/* Navegação Desktop */}
            <nav className="hidden lg:flex items-center gap-6">
              <CategoryMegaMenu />
              <Link 
                href="/blog" 
                className="text-sm font-medium text-zinc-300 hover:text-white transition-colors"
              >
                Blog
              </Link>
            </nav>
          </div>

          {/* Busca (Desktop) */}
          <div className="hidden flex-1 items-center justify-center lg:flex max-w-xl px-4">
            <HeaderSearch />
          </div>

          {/* Ações (Desktop & Mobile mistos) */}
          <div className="flex items-center gap-4">

            {/* GG Points badge — only when logged in */}
            {user && (
              <Link
                href="/gg-points"
                className="hidden lg:flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 text-xs font-semibold text-violet-300 transition-colors hover:border-violet-500/60 hover:bg-violet-500/20"
                title="Seus GG Points"
              >
                <span className="text-sm">🎮</span>
                {pointsBalance.toLocaleString('pt-BR')} pts
              </Link>
            )}
            
            <Link
              href="/meus-anuncios/novo"
              className="hidden lg:flex items-center gap-1.5 rounded-full bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-violet-500 active:scale-[0.97]"
            >
              <Plus className="h-4 w-4" />
              Anunciar
            </Link>

            {/* Desktop UserNav */}
            <div className="hidden lg:block border-l border-zinc-800 pl-4 ml-2">
              <UserNav />
            </div>

            {/* Mobile Navigation / Trigger */}
            <MobileNav isAuthenticated={!!user} profile={profile} />
            
          </div>
        </div>
      </div>
    </header>
  )
}