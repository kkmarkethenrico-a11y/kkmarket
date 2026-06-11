'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Trash2, ShoppingCart } from 'lucide-react'
import { toast } from 'sonner'
import { removeFromWishlistAction } from './actions'

type WishlistItem = {
  id: string
  announcements: {
    id: string
    title: string
    unit_price: number
    slug: string
    announcement_images: { url: string; is_cover: boolean; sort_order: number }[]
  }
}

export default function WishlistClient({ items: initialItems }: { items: WishlistItem[] }) {
  const [items, setItems] = useState<WishlistItem[]>(initialItems ?? [])
  const [removing, setRemoving] = useState<string | null>(null)

  async function handleRemove(id: string) {
    setRemoving(id)
    const res = await removeFromWishlistAction(id)
    if (res.success) {
      setItems(items.filter(i => i.id !== id))
      toast.success('Removido da lista de desejos.')
    } else {
      toast.error(res.message)
    }
    setRemoving(null)
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-[var(--gm-ink-faint)]/20 bg-[var(--gm-paper-2)] p-12 text-center">
        <p className="text-[var(--gm-ink-dim)]">Sua lista de desejos está vazia.</p>
        <Link href="/buscar" className="mt-4 inline-block rounded-full bg-[var(--gm-violet)] px-6 py-2 text-sm font-black text-[#1a1126] hover:opacity-90 transition-all gm-glow">
          Explorar Anúncios
        </Link>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((item) => {
        const ann = item.announcements
        if (!ann) return null
        const cover = ann.announcement_images?.find(i => i.is_cover)?.url ?? ann.announcement_images?.[0]?.url

        return (
          <div key={item.id} className="group relative flex flex-col rounded-2xl border border-[var(--gm-ink-faint)]/20 bg-[var(--gm-paper-2)] overflow-hidden hover:border-[var(--gm-violet)]/40 transition-colors">
            <Link href={`/${ann.slug}`} className="block h-48 bg-[var(--gm-paper-3)] relative overflow-hidden">
              {cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={cover} alt={ann.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              ) : (
                <div className="flex h-full items-center justify-center text-[var(--gm-ink-faint)]">sem imagem</div>
              )}
            </Link>
            
            <div className="flex flex-1 flex-col p-4">
              <Link href={`/${ann.slug}`} className="flex-1">
                <h3 className="line-clamp-2 text-sm font-bold text-[var(--gm-ink)] hover:text-[var(--gm-violet)] transition-colors">
                  {ann.title}
                </h3>
                <p className="mt-2 text-lg font-black text-[var(--gm-green)]">
                  {Number(ann.unit_price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              </Link>
              
              <div className="mt-4 flex items-center justify-between gap-2 border-t border-[var(--gm-ink-faint)]/10 pt-4">
                <button
                  onClick={() => handleRemove(item.id)}
                  disabled={removing === item.id}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--gm-paper-3)] text-[var(--gm-ink-faint)] hover:bg-red-500/10 hover:text-red-500 transition-colors disabled:opacity-50"
                  title="Remover"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <Link
                  href={`/${ann.slug}`}
                  className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[var(--gm-violet)] px-4 py-2 text-xs font-black text-[#1a1126] transition-all hover:opacity-90 active:scale-[0.97] gm-glow"
                >
                  <ShoppingCart className="h-3.5 w-3.5" />
                  Ver Produto
                </Link>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
