import Link from 'next/link'
import Image from 'next/image'
import { PlanBadge } from './PlanBadge'
import type { AnnouncementWithRelations } from '@/types'

function isOnline(lastSeen: string | null): boolean {
  if (!lastSeen) return false
  return Date.now() - new Date(lastSeen).getTime() < 5 * 60 * 1000
}

function coverUrl(images: AnnouncementWithRelations['announcement_images']): string | null {
  const cover = images?.find((i) => i.is_cover) ?? images?.[0]
  return cover?.url ?? null
}

function reviewScore(p: number, n: number, ng: number): { pct: number; total: number } {
  const total = p + n + ng
  if (total === 0) return { pct: 0, total: 0 }
  return { pct: Math.round((p / total) * 100), total }
}

export function AnnouncementCard({ ann }: { ann: AnnouncementWithRelations }) {
  const seller = ann.profiles
  const stats  = ann.user_stats
  const images = ann.announcement_images ?? []
  const imgSrc = coverUrl(images)
  const online = seller ? isOnline(seller.last_seen_at) : false

  const sellerName = seller?.display_name ?? seller?.username ?? '—'
  const { pct, total } = stats
    ? reviewScore(stats.reviews_positive, stats.reviews_neutral, stats.reviews_negative)
    : { pct: 0, total: 0 }

  return (
    <Link
      href={`/anuncio/${ann.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-[var(--gm-ink-faint)]/50 bg-[var(--gm-paper-2)] gm-card-tilt hover:border-[var(--gm-violet)]/50"
    >
      {/* Cover image */}
      <div className="relative aspect-video overflow-hidden bg-[var(--gm-paper-3)]">
        {imgSrc ? (
          <Image
            src={imgSrc}
            alt={ann.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl text-[var(--gm-ink-faint)]">🎮</div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--gm-paper-2)]/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Plan badge */}
        <div className="absolute right-2 top-2">
          <PlanBadge plan={ann.plan} />
        </div>

        {/* Auto-delivery badge */}
        {ann.has_auto_delivery && (
          <div className="absolute left-2 bottom-2">
            <span className="rank-chip green text-[9px]">⚡ Auto</span>
          </div>
        )}

        {/* Sale count badge */}
        {ann.sale_count > 10 && (
          <div className="absolute left-2 top-2">
            <span className="rank-chip gold text-[9px]">🔥 {ann.sale_count}+</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-2.5 p-3">
        {/* Title */}
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-[var(--gm-ink)] group-hover:text-white transition-colors">
          {ann.title}
        </h3>

        {/* Price */}
        <div className="mt-auto">
          {ann.model === 'normal' && ann.unit_price !== null ? (
            <span className="text-xl font-black text-[var(--gm-green)]">
              R$ {ann.unit_price.toFixed(2).replace('.', ',')}
            </span>
          ) : (
            <span className="text-sm font-medium text-[var(--gm-ink-dim)]">Ver variações</span>
          )}
        </div>

        {/* Seller row */}
        <div className="flex items-center gap-2 border-t border-[var(--gm-ink-faint)]/30 pt-2.5">
          <div className="relative shrink-0">
            {seller?.avatar_url ? (
              <Image
                src={seller.avatar_url}
                alt={sellerName}
                width={22}
                height={22}
                sizes="22px"
                loading="lazy"
                className="rounded-full object-cover"
              />
            ) : (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--gm-violet)]/20 border border-[var(--gm-violet)]/40 text-[9px] font-bold text-[var(--gm-violet)] uppercase">
                {sellerName[0]}
              </span>
            )}
            {online && (
              <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-[var(--gm-paper-2)] bg-[var(--gm-green)]" />
            )}
          </div>
          <span className="truncate text-xs text-[var(--gm-ink-dim)]">{sellerName}</span>

          {/* Review score */}
          {total > 0 ? (
            <span className="ml-auto shrink-0 text-[10px] font-semibold text-[var(--gm-green)]">
              {pct}%
            </span>
          ) : (
            <span className="ml-auto shrink-0 text-[10px] text-[var(--gm-ink-faint)]">Novo</span>
          )}
        </div>
      </div>
    </Link>
  )
}
