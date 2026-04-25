'use client'

import Link from 'next/link'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChevronDown, Gamepad2, LayoutGrid, MonitorPlay, Bot, Code } from 'lucide-react'

const topCategories = [
  { name: 'Jogos', icon: Gamepad2, slug: 'jogos', items: ['Free Fire', 'Valorant', 'Roblox', 'League of Legends', 'Minecraft', 'GTA V', 'CS2', 'Fortnite'] },
  { name: 'Redes Sociais', icon: LayoutGrid, slug: 'redes-sociais' },
  { name: 'Bots', icon: Bot, slug: 'bots' },
  { name: 'Scripts', icon: Code, slug: 'scripts' },
  { name: 'Outros Digitais', icon: MonitorPlay, slug: 'outros-digitais' },
]

export function CategoryMegaMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-1.5 text-sm font-medium text-zinc-300 hover:text-white transition-colors outline-none focus-visible:text-violet-400">
          Categorias
          <ChevronDown className="h-4 w-4 opacity-50" />
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        className="w-[600px] p-4 bg-zinc-950/95 backdrop-blur-xl border-zinc-800" 
        align="start" 
        sideOffset={20}
      >
        <div className="grid grid-cols-3 gap-6">
          {/* Main category column */}
          <div className="col-span-1 border-r border-zinc-800/50 pr-4 flex flex-col gap-1">
            {topCategories.map(cat => (
              <DropdownMenuItem key={cat.slug} className="rounded-lg cursor-pointer focus:bg-zinc-800/60 focus:text-white">
                <Link href={`/categoria/${cat.slug}`} className="flex items-center gap-3 py-2 px-3 text-sm font-medium text-zinc-300 w-full">
                  <cat.icon className="h-4 w-4 text-violet-500" />
                  {cat.name}
                </Link>
              </DropdownMenuItem>
            ))}
          </div>
          
          {/* Sub-categories grid view */}
          <div className="col-span-2 flex flex-col">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3 px-2">
              Jogos Populares
            </h4>
            <div className="grid grid-cols-2 gap-1">
              {topCategories[0].items?.map(game => (
                <DropdownMenuItem key={game} className="rounded-lg cursor-pointer focus:bg-zinc-800/60 p-0">
                  <Link href={`/categoria/jogos/${game.toLowerCase().replace(/ /g, '-')}`} className="text-sm text-zinc-300 py-2 px-3 w-full">
                    {game}
                  </Link>
                </DropdownMenuItem>
              ))}
            </div>
            
            <DropdownMenuItem className="mt-4 rounded-lg cursor-pointer bg-violet-600/10 focus:bg-violet-600/20 text-violet-400 focus:text-violet-300 p-0">
              <Link href="/categoria/jogos" className="flex items-center justify-center py-2.5 font-medium border border-violet-500/20 w-full">
                Ver todos os jogos
              </Link>
            </DropdownMenuItem>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
