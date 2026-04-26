import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { LogoutButton } from '@/components/auth/LogoutButton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { LayoutDashboard, Store, PlusCircle, Settings, LogOut } from 'lucide-react'

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
    .select('username, display_name, avatar_url, role, last_seen_at')
    .eq('id', user.id)
    .single()

  const displayName = profile?.display_name ?? profile?.username ?? user.email ?? 'Usuário'
  const isOnline = profile?.last_seen_at
    ? new Date().getTime() - new Date(profile.last_seen_at).getTime() < 5 * 60 * 1000
    : true // fallback to true/online se acabou de logar

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="group relative flex items-center gap-2 rounded-full outline-none ring-offset-zinc-950 transition-all focus-visible:ring-2 focus-visible:ring-violet-500">
          <div className="relative">
            <Avatar className="h-9 w-9 border border-zinc-800 transition-colors group-hover:border-zinc-700">
              <AvatarImage src={profile?.avatar_url ?? ''} alt={displayName} />
              <AvatarFallback className="bg-violet-600 font-bold text-white uppercase">
                {displayName[0]}
              </AvatarFallback>
            </Avatar>
            {isOnline && (
              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-zinc-950 bg-green-500" />
            )}
          </div>
          <div className="hidden lg:flex flex-col items-start gap-0.5 text-left">
            <span className="max-w-[100px] truncate text-sm font-semibold text-zinc-200 group-hover:text-white">
              {displayName}
            </span>
            <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">
              {profile?.role === 'admin' ? 'Admin' : profile?.role === 'moderator' ? 'Moderador' : 'Cliente'}
            </span>
          </div>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-56" align="end">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <Link href="/painel" className="cursor-pointer flex items-center w-full">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              <span>Painel</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Link href="/minhas-compras" className="cursor-pointer flex items-center w-full">
              <Store className="mr-2 h-4 w-4" />
              <span>Minhas Compras</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Link href="/meus-anuncios/novo" className="cursor-pointer flex items-center w-full">
              <PlusCircle className="mr-2 h-4 w-4" />
              <span>Criar Anúncio</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Link href="/configuracoes" className="cursor-pointer flex items-center w-full">
              <Settings className="mr-2 h-4 w-4" />
              <span>Configurações</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        
        {profile?.role === 'admin' || profile?.role === 'moderator' ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Link href="/admin" className="cursor-pointer font-bold text-violet-400 focus:text-violet-300 w-full flex items-center">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                <span>Admin Area</span>
              </Link>
            </DropdownMenuItem>
          </>
        ) : null}

        <DropdownMenuSeparator />
        <DropdownMenuItem className="focus:bg-red-500/10 focus:text-red-500 cursor-pointer p-0">
          <LogoutButton className="flex w-full items-center justify-start py-1.5 px-2 h-full bg-transparent border-none">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sair da conta</span>
          </LogoutButton>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
