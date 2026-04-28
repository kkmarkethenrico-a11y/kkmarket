import Link from 'next/link'
import Image from 'next/image'
import { PlanBadge } from './PlanBadge'
import type { AnnouncementWithRelations } from '@/types'

// ─── helpers ─────────────────────────────────────────────────────────────────
function isOnline(lastSeen: string | null): boolean {
  if (!lastSeen) return false
  return Date.now() - new Date(lastSeen).getTime() < 5 * 60 * 1000
}

function pluralReviews(p: number, n: number, ng: number) {
  const total = p + n + ng
  if (total === 0) return 'Sem avaliações'
  const pct = Math.round((p / total) * 100)
  return `${pct}% positivas (${total})`
}

function coverUrl(images: AnnouncementWithRelations['announcement_images']): string | null {
  const cover = images?.find((i) => i.is_cover) ?? images?.[0]
  return cover?.url ?? null
}

// ─── AnnouncementCard ─────────────────────────────────────────────────────────
export function AnnouncementCard({ ann }: { ann: AnnouncementWithRelations }) {
  const seller  = ann.profiles
  const stats   = ann.user_stats
  const images  = ann.announcement_images ?? []
  const imgSrc  = coverUrl(images)
  const online  = seller ? isOnline(seller.last_seen_at) : false

  const sellerName  = seller?.display_name ?? seller?.username ?? '—'
  const reviewStr   = stats
    ? pluralReviews(stats.reviews_positive, stats.reviews_neutral, stats.reviews_negative)
    : 'Sem avaliações'

  const lowestPrice = ann.model === 'normal'
    ? ann.unit_price
    : null // for dynamic, price shown differently

  return (
    <Link
      href={`/anuncio/${ann.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/60 transition-all hover:border-zinc-700 hover:shadow-xl hover:shadow-zinc-950/40 hover:-translate-y-0.5"
    >
      {/* Cover image */}
      <div className="relative aspect-video overflow-hidden bg-zinc-800">
        {imgSrc ? (
          <Image
            src={imgSrc}
            alt={ann.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl text-zinc-700">🎮</div>
        )}
        {/* Plan badge overlay */}
        <div className="absolute right-2 top-2">
          <PlanBadge plan={ann.plan} />
        </div>
        {/* Auto-delivery badge */}
        {ann.has_auto_delivery && (
          <div className="absolute left-2 bottom-2">
            <span className="rounded-full bg-green-500/90 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
              ⚡ Entrega Auto
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        {/* Title */}
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-zinc-100 group-hover:text-white">
          {ann.title}
        </h3>

        {/* Price */}
        <div className="mt-auto">
          {ann.model === 'normal' && lowestPrice !== null ? (
            <span className="text-xl font-bold text-green-400">
              R$ {lowestPrice.toFixed(2).replace('.', ',')}
            </span>
          ) : (
            <span className="text-sm font-medium text-zinc-400">Verificar variações</span>
          )}
        </div>

        {/* Seller row */}
        <div className="flex items-center gap-2 border-t border-zinc-800/60 pt-3">
          <div className="relative shrink-0">
            {seller?.avatar_url ? (
              <Image
                src={seller.avatar_url}
                alt={sellerName}
                width={24}
                height={24}
                sizes="24px"
                loading="lazy"
                className="rounded-full object-cover"
              />
            ) : (
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-700 text-[10px] font-bold text-white uppercase">
                {sellerName[0]}
              </span>
            )}
            {online && (
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-zinc-900 bg-green-500" />
            )}
          </div>
          <span className="truncate text-xs text-zinc-400">{sellerName}</span>
          <span className="ml-auto shrink-0 text-[10px] text-zinc-600">
            {ann.sale_count > 0 ? `${ann.sale_count} vendas` : 'Novo'}
          </span>
        </div>

        {/* Reviews */}
        {stats && (
          <p className="text-[10px] text-zinc-600">{reviewStr}</p>
        )}
      </div>
    </Link>
  )
}