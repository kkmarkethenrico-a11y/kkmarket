'use client'

import { useState } from 'react'

export interface AnnouncementItem {
  id: string
  title: string
  unit_price: number
  stock_quantity: number
  sort_order: number
  status: string
}

interface VariationSelectorProps {
  items: AnnouncementItem[]
  onSelect: (item: AnnouncementItem | null) => void
}

export function VariationSelector({ items, onSelect }: VariationSelectorProps) {
  const active = items.filter((i) => i.status === 'active' && i.stock_quantity > 0)
  const [selected, setSelected] = useState<string | null>(null)

  function handleChange(id: string) {
    setSelected(id)
    const item = items.find((i) => i.id === id) ?? null
    onSelect(item)
  }

  return (
    <div className="flex flex-col gap-3">
      <span className="text-sm font-semibold text-zinc-300">Selecione uma variação</span>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {items
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((item) => {
            const outOfStock = item.status !== 'active' || item.stock_quantity === 0
            const isSel = selected === item.id
            return (
              <button
                key={item.id}
                type="button"
                disabled={outOfStock}
                onClick={() => !outOfStock && handleChange(item.id)}
                className={`flex flex-col items-start gap-1 rounded-xl border px-4 py-3 text-left transition-all ${
                  isSel
                    ? 'border-violet-500 bg-violet-600/20 ring-1 ring-violet-500/40'
                    : outOfStock
                    ? 'cursor-not-allowed border-zinc-800 bg-zinc-900/30 opacity-50'
                    : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700'
                }`}
              >
                <span className={`text-sm font-medium ${isSel ? 'text-violet-300' : 'text-zinc-200'}`}>
                  {item.title}
                </span>
                <span className={`text-lg font-bold ${outOfStock ? 'text-zinc-600' : 'text-green-400'}`}>
                  {outOfStock
                    ? 'Esgotado'
                    : `R$ ${item.unit_price.toFixed(2).replace('.', ',')}`}
                </span>
                {!outOfStock && (
                  <span className="text-[10px] text-zinc-600">{item.stock_quantity} disponíveis</span>
                )}
              </button>
            )
          })}
      </div>
    </div>
  )
}

// ─── Preço único (anúncio normal) ─────────────────────────────────────────────
export function PriceDisplay({
  price,
  stock,
}: {
  price: number
  stock: number
}) {
  return (
    <div className="flex items-end gap-4">
      <span className="text-4xl font-bold tracking-tight text-green-400">
        R$ {price.toFixed(2).replace('.', ',')}
      </span>
      <span className={`mb-1 text-sm font-medium ${stock > 0 ? 'text-zinc-400' : 'text-red-400'}`}>
        {stock > 0 ? `${stock} em estoque` : 'Esgotado'}
      </span>
    </div>
  )
}
