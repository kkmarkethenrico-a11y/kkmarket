'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, Search, ChevronRight, LayoutDashboard, PlusCircle, Gamepad2, LayoutGrid, Bot, Code, MonitorPlay } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { LogoutButton } from '@/components/auth/LogoutButton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface MobileNavProps {
  isAuthenticated: boolean
  profile?: {
    username: string
    display_name?: string
    avatar_url?: string
    role?: string
  } | null
  sellerStatus?: string
  dict: any
}

export function MobileNav({ isAuthenticated, profile, sellerStatus = 'disabled', dict }: MobileNavProps) {
  const [open, setOpen] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const displayName = profile?.display_name ?? profile?.username ?? 'Usuário'

  if (showSearch) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-[var(--gm-paper)] p-4 animate-in fade-in">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--gm-ink-faint)]" />
            <Input
              autoFocus
              type="search"
              placeholder={dict.header.search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[var(--gm-paper-3)] border-[var(--gm-ink-faint)]/30 pl-10 pr-4 rounded-xl text-[var(--gm-ink)]"
            />
          </div>
          <button
            onClick={() => setShowSearch(false)}
            className="text-sm font-medium text-[var(--gm-ink-dim)] hover:text-[var(--gm-ink)]"
          >
            {dict.header.cancel}
          </button>
        </div>

        {searchQuery.length >= 3 && (
          <div className="mt-6 flex flex-col gap-4">
            <p className="text-xs font-semibold text-[var(--gm-ink-faint)] uppercase tracking-widest">
              {dict.header.resultsFor} &quot;{searchQuery}&quot;
            </p>
            <div className="flex flex-col gap-3">
              <Link href={`/busca?q=${searchQuery}`} onClick={() => setShowSearch(false)} className="flex items-center justify-between text-sm text-[var(--gm-ink-dim)]">
                <div className="flex flex-col">
                  <span className="font-medium text-[var(--gm-ink)]">{dict.header.viewAllAds}</span>
                </div>
                <ChevronRight className="h-4 w-4 text-[var(--gm-ink-faint)]" />
              </Link>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 lg:hidden">
      <button
        onClick={() => setShowSearch(true)}
        className="p-2 text-[var(--gm-ink-dim)] hover:text-[var(--gm-ink)] transition-colors"
      >
        <Search className="h-5 w-5" />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger className="p-2 text-[var(--gm-ink-dim)] hover:text-[var(--gm-ink)] transition-colors">
            <Menu className="h-6 w-6" />
        </SheetTrigger>
        <SheetContent side="right" className="w-[300px] border-[var(--gm-ink-faint)]/20 bg-[var(--gm-paper)] p-6 sm:w-[400px]">
          <SheetHeader className="text-left mb-8 hidden">
            <SheetTitle className="text-[var(--gm-ink)]">{dict.header.mainMenu}</SheetTitle>
          </SheetHeader>

          <div className="flex flex-col gap-8 h-full overflow-y-auto pb-6">

            {/* User Area */}
            {isAuthenticated ? (
              <div className="flex flex-col gap-4">
                <Link
                  href={`/perfil/${profile?.username ?? ''}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 mb-2 hover:opacity-80 transition-opacity"
                >
                  <Avatar className="h-10 w-10 border border-[var(--gm-violet)]/40">
                    <AvatarImage src={profile?.avatar_url ?? ''} />
                    <AvatarFallback className="bg-[var(--gm-violet)] font-bold text-[#1a1126] uppercase">
                      {displayName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-[var(--gm-ink)]">{displayName}</span>
                    <span className="text-xs text-[var(--gm-ink-faint)]">@{profile?.username}</span>
                  </div>
                </Link>

                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/painel"
                    onClick={() => setOpen(false)}
                    className="flex flex-col items-center justify-center gap-2 rounded-xl bg-[var(--gm-paper-2)] border border-[var(--gm-ink-faint)]/20 p-3 text-[var(--gm-ink-dim)] hover:bg-[var(--gm-paper-3)] hover:text-[var(--gm-ink)] transition-colors"
                  >
                    <LayoutDashboard className="h-5 w-5 text-[var(--gm-violet)]" />
                    <span className="text-xs font-medium">{dict.header.panel}</span>
                  </Link>
                  <Link
                    href={sellerStatus === 'approved' ? '/meus-anuncios/novo' : '/verificacao'}
                    onClick={() => setOpen(false)}
                    className="flex flex-col items-center justify-center gap-2 rounded-xl bg-[var(--gm-paper-2)] border border-[var(--gm-ink-faint)]/20 p-3 text-[var(--gm-ink-dim)] hover:bg-[var(--gm-paper-3)] hover:text-[var(--gm-ink)] transition-colors"
                  >
                    <PlusCircle className="h-5 w-5 text-[var(--gm-green)]" />
                    <span className="text-xs font-medium">{sellerStatus === 'approved' ? dict.header.announce : dict.header.sell}</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="rounded-xl border border-[var(--gm-ink-faint)]/30 bg-[var(--gm-paper-2)] px-4 py-3 text-center text-sm font-semibold text-[var(--gm-ink)] transition-all hover:bg-[var(--gm-paper-3)]"
                >
                  {dict.header.login}
                </Link>
                <Link
                  href="/cadastro"
                  onClick={() => setOpen(false)}
                  className="rounded-xl bg-[var(--gm-violet)] px-4 py-3 text-center text-sm font-semibold text-[#1a1126] transition-all hover:opacity-90"
                >
                  {dict.header.register}
                </Link>
              </div>
            )}

            <div className="h-px bg-[var(--gm-ink-faint)]/20" />

            {/* Navigation Links */}
            <nav className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-widest text-[var(--gm-ink-faint)] mb-2 px-2">{dict.header.categories}</span>
              <Link
                href="/categoria/jogos"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-lg px-2 py-3 text-sm font-medium text-[var(--gm-ink-dim)] hover:bg-[var(--gm-paper-2)] hover:text-[var(--gm-ink)] transition-colors"
              >
                <Gamepad2 className="h-5 w-5 text-[var(--gm-ink-faint)]" />
                {dict.categories.games}
              </Link>
              <Link
                href="/categoria/redes-sociais"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-lg px-2 py-3 text-sm font-medium text-[var(--gm-ink-dim)] hover:bg-[var(--gm-paper-2)] hover:text-[var(--gm-ink)] transition-colors"
              >
                <LayoutGrid className="h-5 w-5 text-[var(--gm-ink-faint)]" />
                {dict.categories.socialMedia}
              </Link>
              <Link
                href="/categoria/bots"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-lg px-2 py-3 text-sm font-medium text-[var(--gm-ink-dim)] hover:bg-[var(--gm-paper-2)] hover:text-[var(--gm-ink)] transition-colors"
              >
                <Bot className="h-5 w-5 text-[var(--gm-ink-faint)]" />
                {dict.categories.bots}
              </Link>
              <Link
                href="/categoria/scripts"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-lg px-2 py-3 text-sm font-medium text-[var(--gm-ink-dim)] hover:bg-[var(--gm-paper-2)] hover:text-[var(--gm-ink)] transition-colors"
              >
                <Code className="h-5 w-5 text-[var(--gm-ink-faint)]" />
                {dict.categories.scripts}
              </Link>
              <Link
                href="/categoria/outros-digitais"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-lg px-2 py-3 text-sm font-medium text-[var(--gm-ink-dim)] hover:bg-[var(--gm-paper-2)] hover:text-[var(--gm-ink)] transition-colors"
              >
                <MonitorPlay className="h-5 w-5 text-[var(--gm-ink-faint)]" />
                {dict.categories.otherDigital}
              </Link>
              <Link
                href="/categorias"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-lg px-2 py-3 text-sm font-medium text-[var(--gm-ink-dim)] hover:bg-[var(--gm-paper-2)] hover:text-[var(--gm-ink)] transition-colors mt-2 border-t border-[var(--gm-ink-faint)]/10 pt-3"
              >
                <ChevronRight className="h-5 w-5 text-[var(--gm-ink-faint)]" />
                {dict.header.allCategories}
              </Link>
            </nav>

            <div className="h-px bg-[var(--gm-ink-faint)]/20" />

            <nav className="flex flex-col gap-1">
              <Link
                href="/blog"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-lg px-2 py-3 text-sm font-medium text-[var(--gm-ink-dim)] hover:bg-[var(--gm-paper-2)] hover:text-[var(--gm-ink)] transition-colors"
              >
                {dict.header.blog}
              </Link>
              <Link
                href="/suporte"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-lg px-2 py-3 text-sm font-medium text-[var(--gm-ink-dim)] hover:bg-[var(--gm-paper-2)] hover:text-[var(--gm-ink)] transition-colors"
              >
                {dict.header.helpCenter}
              </Link>
            </nav>

            {isAuthenticated && (
              <div className="mt-auto pt-6">
                <LogoutButton className="flex w-full items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-[var(--gm-rose)] transition-colors hover:bg-red-500/20">
                  {dict.header.logout}
                </LogoutButton>
              </div>
            )}

          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
