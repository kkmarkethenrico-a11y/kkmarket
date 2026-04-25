import type { AnnouncementPlan } from '@/types'

const CONFIG: Record<
  AnnouncementPlan,
  { label: string; emoji: string; cls: string }
> = {
  silver:  { label: 'Prata',    emoji: '🥈', cls: 'bg-zinc-700/60 text-zinc-300 ring-zinc-600/40' },
  gold:    { label: 'Ouro',     emoji: '🥇', cls: 'bg-yellow-500/20 text-yellow-300 ring-yellow-500/30' },
  diamond: { label: 'Diamante', emoji: '💎', cls: 'bg-cyan-500/20 text-cyan-300 ring-cyan-400/30' },
}

export function PlanBadge({ plan }: { plan: AnnouncementPlan }) {
  const { label, emoji, cls } = CONFIG[plan]
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1 ${cls}`}
    >
      {emoji} {label}
    </span>
  )
}