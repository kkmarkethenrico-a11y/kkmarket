import Link from 'next/link'
import Image from 'next/image'
import { ShoppingCart, Plus } from 'lucide-react'
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

export function AnnouncementCard({ ann, dict }: { ann: AnnouncementWithRelations, dict?: any }) {
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
      className="product-card-hover group flex flex-col bg-surface-container rounded-xl overflow-hidden transition-all duration-300 border border-white/5"
    >
      <div className="h-48 relative overflow-hidden bg-surface-container-high">
        {imgSrc ? (
          <Image
            src={imgSrc}
            alt={ann.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-500"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl text-on-surface-variant">🎮</div>
        )}

        {ann.sale_count > 10 && (
          <div className="absolute top-2 right-2 px-2 py-1 bg-surface-container/80 backdrop-blur-md rounded text-label-sm font-bold text-secondary">HOT</div>
        )}

        {ann.has_auto_delivery && (
           <div className="absolute top-2 left-2 px-2 py-1 bg-primary/20 text-primary border border-primary/30 backdrop-blur-md rounded text-label-sm font-bold">AUTO</div>
        )}

        <div className="absolute bottom-2 right-2">
           <PlanBadge plan={ann.plan} />
        </div>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-tighter flex items-center gap-2">
           <span className="truncate">{sellerName}</span>
           {total > 0 && <span className="text-primary text-[10px]">{pct}%</span>}
        </span>
        <h3 className="font-headline-sm text-[18px] text-white mt-1 line-clamp-2">
          {ann.title}
        </h3>
        <div className="mt-auto pt-4 flex justify-between items-center">
          {ann.model === 'normal' && ann.unit_price !== null ? (
            <span className="font-label-md text-label-md font-bold text-primary tracking-tight font-mono">
              R$ {ann.unit_price.toFixed(2).replace('.', ',')}
            </span>
          ) : (
            <span className="font-label-md text-label-md font-bold text-on-surface-variant tracking-tight">Ver variações</span>
          )}
          <div className="flex items-center justify-center p-2 rounded-lg bg-surface-variant/50 text-on-surface-variant group-hover:bg-primary/20 group-hover:text-primary transition-all duration-300">
            <Plus className="h-3 w-3 mr-0.5" strokeWidth={3} />
            <ShoppingCart className="h-4 w-4" strokeWidth={2} />
          </div>
        </div>
      </div>
    </Link>
  )
}
