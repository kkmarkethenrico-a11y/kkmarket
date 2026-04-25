import type { AnnouncementPlan } from '@/types'

const CONFIG: Record<
  Exclude<AnnouncementPlan, 'silver'>,
  { label: string; cls: string }
> = {
  gold:    { label: 'GOLD',    cls: 'bg-amber-500/90 text-amber-950 ring-amber-300/40 shadow-sm shadow-amber-500/30' },
  diamond: { label: 'DIAMOND', cls: 'bg-violet-600/90 text-white ring-violet-300/40 shadow-sm shadow-violet-500/30' },
}

/**
 * PlanBadge — visible only for gold/diamond plans (silver = no badge).
 */
export function PlanBadge({ plan }: { plan: AnnouncementPlan }) {
  if (plan === 'silver') return null
  const { label, cls } = CONFIG[plan]
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ${cls}`}
    >
      {label}
    </span>
  )
}