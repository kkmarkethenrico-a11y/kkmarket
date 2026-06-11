import { Heart, Star, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ReputationBadgeProps {
  reviewsPositive: number
  reviewsNeutral: number
  reviewsNegative: number
  /** 'sm' = número pequeno inline | 'full' = com texto descritivo */
  variant?: 'sm' | 'full'
  className?: string
}

function calcPercent(pos: number, neu: number, neg: number): number | null {
  const total = pos + neu + neg
  if (total === 0) return null
  return Math.round((pos / total) * 100)
}

/** Tier de cor baseado no percentual de positivas */
function tier(pct: number | null): 'gold' | 'blue' | 'gray' {
  if (pct === null) return 'gray'
  if (pct >= 95) return 'gold'
  if (pct >= 80) return 'blue'
  return 'gray'
}

const tierStyles = {
  gold: {
    icon: 'text-[var(--gm-amber)]',
    badge: 'bg-[var(--gm-amber)]/15 text-[var(--gm-amber)] border-[var(--gm-amber)]/30',
    label: 'Excelente',
  },
  blue: {
    icon: 'text-[var(--gm-cyan)]',
    badge: 'bg-[var(--gm-cyan)]/15 text-[var(--gm-cyan)] border-[var(--gm-cyan)]/30',
    label: 'Bom',
  },
  gray: {
    icon: 'text-[var(--gm-ink-faint)]',
    badge: 'bg-[var(--gm-ink-faint)]/15 text-[var(--gm-ink-dim)] border-[var(--gm-ink-faint)]/30',
    label: 'Novo',
  },
}

export function ReputationBadge({
  reviewsPositive,
  reviewsNeutral,
  reviewsNegative,
  variant = 'full',
  className,
}: ReputationBadgeProps) {
  const total = reviewsPositive + reviewsNeutral + reviewsNegative
  const pct   = calcPercent(reviewsPositive, reviewsNeutral, reviewsNegative)
  const t     = tier(pct)
  const style = tierStyles[t]

  // ─── Variant: sm ─────────────────────────────────────────────────────
  if (variant === 'sm') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium',
          style.badge,
          className,
        )}
        title={
          total > 0
            ? `${pct}% positivas · ${total} avaliações`
            : 'Sem avaliações ainda'
        }
      >
        {t === 'gold' ? (
          <Star className={cn('h-3 w-3 fill-current', style.icon)} />
        ) : (
          <Heart className={cn('h-3 w-3', style.icon)} />
        )}
        {total > 0 ? `${pct}%` : style.label}
      </span>
    )
  }

  // ─── Variant: full ───────────────────────────────────────────────────
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <div className="flex items-center gap-2">
        {t === 'gold' ? (
          <Star className={cn('h-5 w-5 fill-current', style.icon)} />
        ) : t === 'blue' ? (
          <Heart className={cn('h-5 w-5', style.icon)} />
        ) : (
          <Minus className={cn('h-5 w-5', style.icon)} />
        )}
        <span className={cn('text-sm font-semibold', style.icon)}>
          {pct !== null ? `${pct}% positivas` : 'Sem avaliações'}
        </span>
        {total > 0 && (
          <span className="text-xs text-muted-foreground">({total} no total)</span>
        )}
      </div>
      {total > 0 && (
        <div className="flex gap-3 text-xs text-muted-foreground">
          <span className="text-[var(--gm-green)]">▲ {reviewsPositive}</span>
          <span className="text-[var(--gm-ink-faint)]">● {reviewsNeutral}</span>
          <span className="text-[var(--gm-rose)]">▼ {reviewsNegative}</span>
        </div>
      )}
    </div>
  )
}
