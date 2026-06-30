'use client'

import Link from 'next/link'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChevronDown, Gamepad2, LayoutGrid, MonitorPlay, Bot, Code } from 'lucide-react'

export function CategoryMegaMenu({ dict }: { dict: any }) {
  const topCategories = [
    { name: dict.categories.games, icon: Gamepad2, slug: 'jogos', items: ['Free Fire', 'Valorant', 'Roblox', 'League of Legends', 'Minecraft', 'GTA V', 'CS2', 'Fortnite'] },
    { name: dict.categories.socialMedia, icon: LayoutGrid, slug: 'redes-sociais' },
    { name: dict.categories.bots, icon: Bot, slug: 'bots' },
    { name: dict.categories.scripts, icon: Code, slug: 'scripts' },
    { name: dict.categories.otherDigital, icon: MonitorPlay, slug: 'outros-digitais' },
  ]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        data-tour="categories"
        className="flex items-center gap-1.5 text-sm font-medium text-[var(--gm-ink-dim)] hover:text-[var(--gm-ink)] transition-colors outline-none focus-visible:text-[var(--gm-violet)]"
      >
          {dict.header.categories}
          <ChevronDown className="h-4 w-4 opacity-50" />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-[600px] p-4 bg-[var(--gm-paper)]/95 backdrop-blur-xl border-[var(--gm-ink-faint)]/20"
        align="start"
        sideOffset={20}
      >
        <div className="grid grid-cols-3 gap-6">
          {/* Main category column */}
          <div className="col-span-1 border-r border-[var(--gm-ink-faint)]/20 pr-4 flex flex-col gap-1">
            {topCategories.map(cat => (
              <DropdownMenuItem key={cat.slug} className="rounded-lg cursor-pointer focus:bg-[var(--gm-paper-3)] focus:text-[var(--gm-ink)]">
                <Link href={`/categoria/${cat.slug}`} className="flex items-center gap-3 py-2 px-3 text-sm font-medium text-[var(--gm-ink-dim)] w-full">
                  <cat.icon className="h-4 w-4 text-[var(--gm-violet)]" />
                  {cat.name}
                </Link>
              </DropdownMenuItem>
            ))}
          </div>

          {/* Sub-categories grid view */}
          <div className="col-span-2 flex flex-col">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--gm-ink-faint)] mb-3 px-2">
              {dict.header.popularGames}
            </h4>
            <div className="grid grid-cols-2 gap-1">
              {topCategories[0].items?.map(game => {
                const gameSlug = game.toLowerCase().replace(/ /g, '-')
                return (
                  <DropdownMenuItem key={game} className="rounded-lg cursor-pointer focus:bg-[var(--gm-paper-3)] p-0">
                    <Link href={`/categoria/jogos/${gameSlug}`} className="flex items-center gap-2.5 text-sm text-[var(--gm-ink-dim)] hover:text-[var(--gm-ink)] py-2 px-3 w-full">
                      <img 
                        src={`/images/games/${gameSlug}.svg`} 
                        alt={game} 
                        width={18} 
                        height={18} 
                        className="shrink-0 object-contain" 
                      />
                      <span>{game}</span>
                    </Link>
                  </DropdownMenuItem>
                )
              })}
            </div>

            <DropdownMenuItem className="mt-4 rounded-lg cursor-pointer bg-[var(--gm-violet)]/10 focus:bg-[var(--gm-violet)]/20 text-[var(--gm-violet)] focus:text-[var(--gm-violet)] p-0">
              <Link href="/categoria/jogos" className="flex items-center justify-center py-2.5 font-medium border border-[var(--gm-violet)]/20 w-full">
                {dict.header.viewAllGames}
              </Link>
            </DropdownMenuItem>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
