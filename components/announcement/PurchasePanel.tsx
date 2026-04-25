'use client'

import { useState } from 'react'
import { VariationSelector, PriceDisplay } from './VariationSelector'
import { BuyButton } from './BuyButton'
import type { AnnouncementItem } from './VariationSelector'

interface PurchasePanelProps {
  announcementId: string
  announcementSlug: string
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
  model,
  normalPrice,
  normalStock,
  hasAutoDelivery,
  items,
  isAuthenticated,
}: PurchasePanelProps) {
  const [selectedItem, setSelectedItem] = useState<AnnouncementItem | null>(null)

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

      {/* Buy button */}
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
    </div>
  )
}
