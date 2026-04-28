'use client'

import { useState } from 'react'
import { ShoppingCart, Check } from 'lucide-react'
import { VariationSelector, PriceDisplay } from './VariationSelector'
import { BuyButton } from './BuyButton'
import { useCartStore } from '@/stores/cartStore'
import type { AnnouncementItem } from './VariationSelector'

interface PurchasePanelProps {
  announcementId: string
  announcementSlug: string
  title: string
  coverImageUrl: string | null
  model: 'normal' | 'dynamic'
  normalPrice: number | null
  normalStock: number | null
  hasAutoDelivery: boolean
  items: AnnouncementItem[]
  isAuthenticated: boolean
}

export function PurchasePanel({
  announcementId,
  announcementSlug,
  title,
  coverImageUrl,
  model,
  normalPrice,
  normalStock,
  hasAutoDelivery,
  items,
  isAuthenticated,
}: PurchasePanelProps) {
  const [selectedItem, setSelectedItem] = useState<AnnouncementItem | null>(null)
  const [added, setAdded] = useState(false)
  const addItem = useCartStore((s) => s.addItem)

  const isDynamic = model === 'dynamic'
  const outOfStock = isDynamic
    ? (selectedItem?.stock_quantity ?? 0) <= 0
    : (normalStock ?? 0) <= 0
  const price = isDynamic ? selectedItem?.unit_price ?? null : normalPrice
  const canAddToCart = !outOfStock && price !== null && (!isDynamic || selectedItem !== null)

  function handleAddToCart() {
    if (!canAddToCart || price === null) return
    addItem({
      announcementId,
      announcementSlug,
      title,
      imageUrl: coverImageUrl,
      price,
      selectedItemId:    selectedItem?.id,
      selectedItemLabel: selectedItem?.title,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Pricing */}
      {model === 'normal' && normalPrice !== null ? (
        <PriceDisplay price={normalPrice} stock={normalStock ?? 0} />
      ) : model === 'dynamic' ? (
        <>
          {selectedItem ? (
            <PriceDisplay price={selectedItem.unit_price} stock={selectedItem.stock_quantity} />
          ) : (
            <p className="text-sm text-zinc-500">Selecione uma variação para ver o preço</p>
          )}
          <VariationSelector items={items} onSelect={setSelectedItem} />
        </>
      ) : null}

      {/* Botões */}
      <div className="flex flex-col gap-2">
        {/* Comprar agora */}
        <BuyButton
          announcementId={announcementId}
          announcementSlug={announcementSlug}
          isAuthenticated={isAuthenticated}
          model={model}
          normalPrice={normalPrice}
          normalStock={normalStock}
          hasAutoDelivery={hasAutoDelivery}
          selectedItem={selectedItem}
        />

        {/* Adicionar ao carrinho */}
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={!canAddToCart}
          className={`flex w-full items-center justify-center gap-2 rounded-2xl border px-6 py-3 text-sm font-semibold transition-all active:scale-[0.98] ${
            added
              ? 'border-green-500/40 bg-green-500/10 text-green-400'
              : canAddToCart
              ? 'border-zinc-700 bg-zinc-800/60 text-zinc-300 hover:border-violet-500/50 hover:bg-violet-500/10 hover:text-white'
              : 'cursor-not-allowed border-zinc-800 bg-zinc-900/20 text-zinc-600'
          }`}
        >
          {added ? (
            <>
              <Check className="h-4 w-4" />
              Adicionado ao carrinho!
            </>
          ) : (
            <>
              <ShoppingCart className="h-4 w-4" />
              Adicionar ao carrinho
            </>
          )}
        </button>
      </div>
    </div>
  )
}
