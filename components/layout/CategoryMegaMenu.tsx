'use client'

import Link from 'next/link'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChevronDown, Gamepad2, LayoutGrid, MonitorPlay, Bot, Code } from 'lucide-react'

function GameIcon({ game, ...props }: { game: string; [key: string]: any }) {
  switch (game) {
    case 'Free Fire':
      return (
        <svg viewBox="0 0 24 24" fill="#FF5722" width="18" height="18" {...props}>
          <path d="M17.66 11.57c-.77-.77-1.9-1.08-2.85-1.07.1.95-.12 1.95-.82 2.65-.28.28-.68.49-1.08.6-.4.12-.83.14-1.24.04.09-.58.38-1.1.84-1.47.46-.38.74-.93.74-1.52 0-.6-.3-1.17-.82-1.47-.9-.52-2.1-.47-2.93.18-.84.66-1.24 1.76-1.02 2.79.03.1.06.2.1.3-.39-.24-.72-.57-.96-.97-.24-.4-.36-.88-.36-1.37 0-.74.27-1.45.77-2 .5-.55 1.18-.94 1.92-1.1.75-.15 1.54-.03 2.22.33a4.02 4.02 0 0 1 1.84 2.37c.75-.42 1.3-1.1 1.53-1.92.23-.83.12-1.72-.32-2.47-.45-.75-1.2-1.3-2.07-1.53-.88-.23-1.82-.12-2.6.3a8.03 8.03 0 0 0-3.6 4.75 8.03 8.03 0 0 0 2 7.78c1.55 1.55 3.65 2.42 5.85 2.42s4.3-.87 5.85-2.42c3.23-3.23 3.23-8.47 0-11.7z" />
        </svg>
      )
    case 'Valorant':
      return (
        <svg viewBox="0 0 24 24" fill="#FA4454" width="18" height="18" {...props}>
          <path d="M23.792 2.152a.252.252 0 0 0-.098.083c-3.384 4.23-6.769 8.46-10.15 12.69-.107.093-.025.288.119.265 2.439.003 4.877 0 7.316.001a.66.66 0 0 0 .552-.25c.774-.967 1.55-1.934 2.324-2.903a.72.72 0 0 0 .144-.49c-.002-3.077 0-6.153-.003-9.23.016-.11-.1-.206-.204-.167zM.077 2.166c-.077.038-.074.132-.076.205.002 3.074.001 6.15.001 9.225a.679.679 0 0 0 .158.463l7.64 9.55c.12.152.308.25.505.247 2.455 0 4.91.003 7.365 0 .142.02.222-.174.116-.265C10.661 15.176 5.526 8.766.4 2.35c-.08-.094-.174-.272-.322-.184z" />
        </svg>
      )
    case 'Roblox':
      return (
        <svg viewBox="0 0 24 24" fill="#ECEFF1" width="18" height="18" {...props}>
          <path d="M18.926 23.998 0 18.892 5.075.002 24 5.108ZM15.348 10.09l-5.282-1.453-1.414 5.273 5.282 1.453z" />
        </svg>
      )
    case 'League of Legends':
      return (
        <svg viewBox="0 0 24 24" fill="#C28F2C" width="18" height="18" {...props}>
          <path d="m1.912 0 1.212 2.474v19.053L1.912 24h14.73l1.337-4.682H8.33V0ZM12 1.516c-.913 0-1.798.112-2.648.312v1.74a9.738 9.738 0 0 1 2.648-.368c5.267 0 9.536 4.184 9.536 9.348a9.203 9.203 0 0 1-2.3 6.086l-.273.954-.602 2.112c2.952-1.993 4.89-5.335 4.89-9.122C23.25 6.468 18.213 1.516 12 1.516Zm0 2.673c-.924 0-1.814.148-2.648.414v13.713h8.817a8.246 8.246 0 0 0 2.36-5.768c0-4.617-3.818-8.359-8.529-8.359zM2.104 7.312A10.858 10.858 0 0 0 .75 12.576c0 1.906.492 3.7 1.355 5.266z" />
        </svg>
      )
    case 'Minecraft':
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" {...props}>
          <path d="M12 2L22 7L12 12L2 7Z" fill="#4CAF50" />
          <path d="M2 7L12 12L12 22L2 17Z" fill="#5D4037" />
          <path d="M12 12L22 7L22 17L12 22Z" fill="#795548" />
        </svg>
      )
    case 'GTA V':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="#2E7D32" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18" {...props}>
          <path d="M4 3h3M20 3h-3M6.5 3L12 21L17.5 3" />
          <path d="M8 12c2.5-1 3.5 0 5-1" strokeWidth="1.5" />
        </svg>
      )
    case 'CS2':
      return (
        <svg viewBox="0 0 24 24" fill="#E0A922" width="18" height="18" {...props}>
          <path d="M21.7101 3.2348a.0218.0218 0 0 1-.0216-.0215c.001-.0815.003-.3698.004-.424 0-.1292-.1428-.1831-.2117-.0829-.0113.016-.1457.212-.2287.3323a.0244.0244 0 0 1-.0198.0103h-6.5508a.0473.0473 0 0 1-.0473-.0463l-.0131-.177a.0477.0477 0 0 1 .056-.0477l.335.0319a.059.059 0 0 0 .0624-.0445l.2441-.989a.0475.0475 0 0 0-.0295-.0542l-.2268-.0848a.0427.0427 0 0 1-.0263-.0295c-.0412-.1722-.3766-1.3235-1.9935-1.581-.7867-.125-1.302.2107-1.577.4784a1.594 1.594 0 0 0-.3018.4095l-.0965.2125c-.008.0164-.046.2157-.046.234l.0513.9815a.109.109 0 0 0 .0422.0856l.3546.153-.1958.3244a.055.055 0 0 1-.053.0402s-.417.0108-.6227.0192c-.3856.0155-1.2444.4858-1.8773 1.8385-.6219 1.3282-.724 1.5496-.724 1.5496a.0736.0736 0 0 1-.0684.0398l-.5776.0019c-.0356 0-.0736.0285-.0886.0608l-.8982 2.5428c-.0149.0323-.006.081.0173.1081l.627.3918a.059.059 0 0 1 .0195.059l-.3274.9664a.1916.1916 0 0 1-.0235.0618l-.4343.3824a.1056.1056 0 0 0-.0356.059l-.5978 1.5308a.0632.0632 0 0 1-.0608.0455l-.3355.0018a.1633.1633 0 0 0-.162.1488l-.2007 2.2883a1.7194 1.7194 0 0 1-.0159.1207l-.1583.908a.128.128 0 0 1-.0333.0553l-.5584.4263c-.2559.2443-.5988.6903-.7665 1.0015l-1.86 3.9235c-.045.0833-.0811.227-.0788.3221l.1321.2354c.002.0842-.0319.4559-.0707.5307L.817 23.6545a.0985.0985 0 0 0-.003.0856l.0309.0706.0932.1859 1.8913.0029c.1173.0106.247-.1396.2507-.3005l.1027-1.2965-.0268-.1952 3.6063-4.232c.0942-.1146.222-.3168.2861-.4506l1.7186-3.7892a.1712.1712 0 0 1 .1004-.088l.1086-.035a.1694.1694 0 0 1 .1827.0528c.1505.1807.5042.781.6765 1.0315.1425.2079.8495 1.2304 1.1582 1.5675.0853.0926.3481.198.4658.2696a.083.083 0 0 1 .029.1119l-1.0298 1.8083-.4549 2.1357a.9542.9542 0 0 0-.0356.1526l-.4118 1.4831c.003.1873-.141.2856-.1527.5064l-.15 1.084a.0581.0581 0 0 0 .0582.0614l2.5445.014c.0951-.0003.1902-.0045.2854-.0067a1.1049 1.1049 0 0 0 .0755-.0069c.1242-.0158.5629-.0754.75-.1503.1097-.0388.1809-.0819.2268-.1295.1855-.1935.2002-.278.2034-.3975.001-.0212-.011-.0726-.0283-.1049-.0053-.0117-.0316-.0382-.059-.0477l-1.1815-.3562a.3693.3693 0 0 1-.1889-.1338l-.3172-.469a.0865.0865 0 0 1 .0173-.0973l.618-.609a.2017.2017 0 0 0 .0483-.072l1.9036-4.488c.089-.285.0595-.6056 0-.9445-.044-.2504-.6854-1.3264-.8532-1.6236-.1476-.262-1.0677-1.8707-1.286-2.2517-.0793-.1376-.1894-.1328-.2287-.276l-.0726-1.1173a.0398.0398 0 0 1 .0356-.0505l.3312-.0276a.093.093 0 0 0 .0741-.0487l1.147-2.1544a.0958.0958 0 0 0-.002-.094l-.2349-.2907a.0874.0874 0 0 1-.001-.0875l.3515-.3796a.054.054 0 0 1 .0736-.0206l.9343.5266a.3819.3819 0 0 0 .186.0505c.259-.0019.6858-.1549.908-.2906a.3833.3833 0 0 0 .1386-.148l.4583-1.0703c.006-.0136.0262-.0117.029.0028l.1278.5953a.0635.0635 0 0 0 .0788.0501l1.3494-.3a.0662.0662 0 0 0 .05-.0786l-.318-1.3437a.0716.0716 0 0 1 .009-.0534l.1313-.2036a.281.281 0 0 0 .036-.0814l.1589-.725a.0408.0408 0 0 1 .0397-.0323l3.7327.0047a.0916.0916 0 0 0 .0932-.0931v-.6336a.022.022 0 0 1 .0216-.0216h1.4393a.0465.0465 0 0 0 .0464-.0463v-.2855a.0465.0465 0 0 0-.0464-.0463h-1.4398z"/></svg>
      )
    case 'Fortnite':
      return (
        <svg viewBox="0 0 24 24" fill="#00B0FF" width="18" height="18" {...props}>
          <path d="m15.767 14.171.097-5.05H12.4V5.197h3.99L16.872 0H7.128v24l5.271-.985V14.17z" />
        </svg>
      )
    default:
      return <Gamepad2 {...props} />
  }
}

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
              {topCategories[0].items?.map(game => (
                <DropdownMenuItem key={game} className="rounded-lg cursor-pointer focus:bg-[var(--gm-paper-3)] p-0">
                  <Link href={`/categoria/jogos/${game.toLowerCase().replace(/ /g, '-')}`} className="flex items-center gap-2.5 text-sm text-[var(--gm-ink-dim)] hover:text-[var(--gm-ink)] py-2 px-3 w-full">
                    <GameIcon game={game} className="shrink-0" />
                    <span>{game}</span>
                  </Link>
                </DropdownMenuItem>
              ))}
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
