'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Trash2, ShoppingBag, ArrowLeft, Plus, Minus } from 'lucide-react'
import { useCartStore } from '@/stores/cartStore'

export function CartPageClient() {
  const { items, removeItem, updateQuantity, clearCart, totalItems, totalPrice } = useCartStore()

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 flex flex-col items-center gap-6 text-center">
        <ShoppingBag className="h-16 w-16 text-zinc-700" />
        <h1 className="text-2xl font-bold text-white">Seu carrinho está vazio</h1>
        <p className="text-zinc-400 max-w-sm">
          Explore o marketplace e adicione produtos ao carrinho para comprá-los.
        </p>
        <Link
          href="/buscar"
          className="flex items-center gap-2 rounded-full bg-violet-600 px-6 py-3 text-sm font-semibold text-white hover:bg-violet-500 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Explorar produtos
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">
          Carrinho ({totalItems()} {totalItems() === 1 ? 'item' : 'itens'})
        </h1>
        <button
          onClick={clearCart}
          className="text-sm text-zinc-500 hover:text-red-400 transition-colors"
        >
          Limpar carrinho
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Item list */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {items.map((item) => (
            <div
              key={`${item.announcementId}-${item.selectedItemId ?? ''}`}
              className="flex gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4"
            >
              {/* Image */}
              <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-zinc-800">
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.title}
                    width={80}
                    height={80}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-zinc-600">
                    🎮
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex flex-1 flex-col gap-1 min-w-0">
                <Link
                  href={`/anuncio/${item.announcementSlug}`}
                  className="truncate font-semibold text-white hover:text-violet-400 transition-colors"
                >
                  {item.title}
                </Link>
                {item.selectedItemLabel && (
                  <p className="text-xs text-zinc-500">{item.selectedItemLabel}</p>
                )}
                <p className="text-sm font-bold text-green-400">
                  R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}
                </p>
              </div>

              {/* Qty + remove */}
              <div className="flex flex-col items-end gap-2">
                <button
                  onClick={() => removeItem(item.announcementId, item.selectedItemId)}
                  className="text-zinc-600 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.announcementId, item.quantity - 1, item.selectedItemId)}
                    className="flex h-6 w-6 items-center justify-center rounded-full border border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white transition-colors"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-6 text-center text-sm font-medium text-white">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.announcementId, item.quantity + 1, item.selectedItemId)}
                    className="flex h-6 w-6 items-center justify-center rounded-full border border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white transition-colors"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="h-fit rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 flex flex-col gap-4">
          <h2 className="font-bold text-white text-lg">Resumo do pedido</h2>

          <div className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between text-zinc-400">
              <span>Subtotal ({totalItems()} itens)</span>
              <span className="text-white">R$ {totalPrice().toFixed(2).replace('.', ',')}</span>
            </div>
          </div>

          <div className="border-t border-zinc-800 pt-4 flex justify-between font-bold">
            <span className="text-white">Total</span>
            <span className="text-green-400 text-xl">
              R$ {totalPrice().toFixed(2).replace('.', ',')}
            </span>
          </div>

          <p className="rounded-xl bg-zinc-800/60 px-4 py-3 text-xs text-zinc-500 text-center">
            🚧 Integração de pagamento via Mercado Pago em breve.
          </p>

          <button
            disabled
            className="w-full rounded-2xl bg-green-600 py-4 text-sm font-bold text-white opacity-50 cursor-not-allowed"
          >
            Finalizar Compra
          </button>

          <Link
            href="/buscar"
            className="flex items-center justify-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Continuar comprando
          </Link>
        </div>
      </div>
    </div>
  )
}
