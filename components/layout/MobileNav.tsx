'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, Search, X, ChevronRight, LayoutDashboard, PlusCircle, Gamepad2 } from 'lucide-react'
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
}

export function MobileNav({ isAuthenticated, profile, sellerStatus = 'disabled' }: MobileNavProps) {
  const [open, setOpen] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const displayName = profile?.display_name ?? profile?.username ?? 'Usuário'

  if (showSearch) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-zinc-950 p-4 animate-in fade-in">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input
              autoFocus
              type="search"
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900 border-zinc-800 pl-10 pr-4 rounded-xl"
            />
          </div>
          <button 
            onClick={() => setShowSearch(false)}
            className="text-sm font-medium text-zinc-400 hover:text-white"
          >
            Cancelar
          </button>
        </div>
        
        {/* Mock Search Results Mobile */}
        {searchQuery.length >= 3 && (
          <div className="mt-6 flex flex-col gap-4">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
              Resultados para &quot;{searchQuery}&quot;
            </p>
            <div className="flex flex-col gap-3">
              <Link href={`/busca?q=${searchQuery}`} onClick={() => setShowSearch(false)} className="flex items-center justify-between text-sm text-zinc-300">
                <div className="flex flex-col">
                  <span className="font-medium text-zinc-200">Ver todos anúncios</span>
                </div>
                <ChevronRight className="h-4 w-4 text-zinc-600" />
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
        className="p-2 text-zinc-400 hover:text-white transition-colors"
      >
        <Search className="h-5 w-5" />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger className="p-2 text-zinc-400 hover:text-white transition-colors">
            <Menu className="h-6 w-6" />
        </SheetTrigger>
        <SheetContent side="right" className="w-[300px] border-zinc-800 bg-zinc-950 p-6 sm:w-[400px]">
          <SheetHeader className="text-left mb-8 hidden">
            <SheetTitle className="text-zinc-100">Menu Principal</SheetTitle>
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
                  <Avatar className="h-10 w-10 border border-zinc-800">
                    <AvatarImage src={profile?.avatar_url ?? ''} />
                    <AvatarFallback className="bg-violet-600 font-bold text-white uppercase">
                      {displayName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-white">{displayName}</span>
                    <span className="text-xs text-zinc-400">@{profile?.username}</span>
                  </div>
                </Link>
                
                <div className="grid grid-cols-2 gap-2">
                  <Link 
                    href="/painel" 
                    onClick={() => setOpen(false)}
                    className="flex flex-col items-center justify-center gap-2 rounded-xl bg-zinc-900 border border-zinc-800 p-3 text-zinc-300 hover:bg-zinc-800 transition-colors"
                  >
                    <LayoutDashboard className="h-5 w-5 text-violet-400" />
                    <span className="text-xs font-medium">Painel</span>
                  </Link>
                  <Link 
                    href={sellerStatus === 'approved' ? '/meus-anuncios/novo' : '/verificacao'} 
                    onClick={() => setOpen(false)}
                    className="flex flex-col items-center justify-center gap-2 rounded-xl bg-zinc-900 border border-zinc-800 p-3 text-zinc-300 hover:bg-zinc-800 transition-colors"
                  >
                    <PlusCircle className="h-5 w-5 text-green-400" />
                    <span className="text-xs font-medium">{sellerStatus === 'approved' ? 'Anunciar' : 'Vender'}</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-center text-sm font-semibold text-white transition-all hover:bg-zinc-800"
                >
                  Entrar na conta
                </Link>
                <Link
                  href="/cadastro"
                  onClick={() => setOpen(false)}
                  className="rounded-xl bg-violet-600 px-4 py-3 text-center text-sm font-semibold text-white transition-all hover:bg-violet-500"
                >
                  Criar conta grátis
                </Link>
              </div>
            )}

            <div className="h-px bg-zinc-800/50" />

            {/* Navigation Links */}
            <nav className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-2 px-2">Categorias</span>
              <Link 
                href="/categoria/jogos" 
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-lg px-2 py-3 text-sm font-medium text-zinc-300 hover:bg-zinc-900 hover:text-white transition-colors"
              >
                <Gamepad2 className="h-5 w-5 text-zinc-400" />
                Jogos
              </Link>
              <Link 
                href="/categoria" 
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-lg px-2 py-3 text-sm font-medium text-zinc-300 hover:bg-zinc-900 hover:text-white transition-colors"
              >
                <ChevronRight className="h-5 w-5 text-zinc-400" />
                Todas as Categorias
              </Link>
            </nav>

            <div className="h-px bg-zinc-800/50" />
            
            <nav className="flex flex-col gap-1">
              <Link 
                href="/blog" 
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-lg px-2 py-3 text-sm font-medium text-zinc-300 hover:bg-zinc-900 hover:text-white transition-colors"
              >
                Blog
              </Link>
              <Link 
                href="/suporte" 
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-lg px-2 py-3 text-sm font-medium text-zinc-300 hover:bg-zinc-900 hover:text-white transition-colors"
              >
                Central de Ajuda
              </Link>
            </nav>

            {isAuthenticated && (
              <div className="mt-auto pt-6">
                <LogoutButton className="flex w-full items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-500 transition-colors hover:bg-red-500/20">
                  Sair da conta
                </LogoutButton>
              </div>
            )}

          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}