'use client'

import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'
import { useCartStore } from '@/stores/cartStore'

export function CartButton() {
  const totalItems = useCartStore((s) => s.totalItems())

  return (
    <Link
      href="/carrinho"
      className="relative flex items-center justify-center rounded-full p-2 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
      title="Carrinho de compras"
    >
      <ShoppingCart className="h-5 w-5" />
      {totalItems > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-violet-600 text-[10px] font-bold text-white">
          {totalItems > 9 ? '9+' : totalItems}
        </span>
      )}
    </Link>
  )
}
