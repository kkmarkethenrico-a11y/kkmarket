'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { AnnouncementItem } from './VariationSelector'

interface BuyButtonProps {
  announcementId: string
  announcementSlug: string
  isAuthenticated: boolean
  model: 'normal' | 'dynamic'
  normalPrice: number | null
  normalStock: number | null
  hasAutoDelivery: boolean
  /** Passed from parent when a variation is selected */
  selectedItem?: AnnouncementItem | null
}

export function BuyButton({
  announcementId,
  announcementSlug,
  isAuthenticated,
  model,
  normalPrice,
  normalStock,
  hasAutoDelivery,
  selectedItem,
}: BuyButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const isDynamic = model === 'dynamic'
  const noVariationSelected = isDynamic && !selectedItem
  const outOfStock = isDynamic
    ? (selectedItem?.stock_quantity ?? 0) <= 0
    : (normalStock ?? 0) <= 0

  const price = isDynamic ? selectedItem?.unit_price : normalPrice

  function handleClick() {
    if (!isAuthenticated) {
      router.push(`/login?next=/anuncio/${announcementSlug}`)
      return
    }
    if (noVariationSelected || outOfStock) return
    setOpen(true)
  }

  const disabled = outOfStock || noVariationSelected || isPending

  return (
    <>
      <div className="flex flex-col gap-2">
        {hasAutoDelivery && (
          <div className="flex items-center gap-2 rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-2.5">
            <span className="text-lg">⚡</span>
            <div>
              <p className="text-sm font-semibold text-green-400">Entrega Automática</p>
              <p className="text-xs text-green-600">
                Receba seus dados instantaneamente após confirmar o pagamento
              </p>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={handleClick}
          disabled={disabled}
          className={`flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 text-base font-bold transition-all active:scale-[0.98] ${
            disabled
              ? 'cursor-not-allowed bg-zinc-800 text-zinc-500'
              : 'bg-green-600 text-white shadow-lg shadow-green-600/20 hover:bg-green-500 hover:shadow-green-500/30'
          }`}
        >
          {outOfStock ? (
            'Esgotado'
          ) : noVariationSelected ? (
            'Selecione uma variação'
          ) : (
            <>
              🛒 Comprar
              {price !== null && price !== undefined && (
                <span className="ml-2 rounded-full bg-white/20 px-2.5 py-0.5 text-sm font-semibold">
                  R$ {price.toFixed(2).replace('.', ',')}
                </span>
              )}
            </>
          )}
        </button>

        {!isAuthenticated && (
          <p className="text-center text-xs text-zinc-500">
            Você precisa estar logado para comprar
          </p>
        )}
      </div>

      {/* Checkout Modal */}
      {open && (
        <CheckoutModal
          announcementId={announcementId}
          selectedItemId={selectedItem?.id}
          price={price ?? 0}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}

// ─── Checkout Modal placeholder (O-01 will replace this) ─────────────────────
function CheckoutModal({
  announcementId,
  selectedItemId,
  price,
  onClose,
}: {
  announcementId: string
  selectedItemId?: string
  price: number
  onClose: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-950/80 backdrop-blur-sm sm:items-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label="Checkout"
    >
      <div className="w-full max-w-md rounded-t-3xl border border-zinc-800 bg-zinc-950 p-6 sm:rounded-3xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Confirmar Compra</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-500 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">Total a pagar</span>
            <span className="text-2xl font-bold text-green-400">
              R$ {price.toFixed(2).replace('.', ',')}
            </span>
          </div>
          {selectedItemId && (
            <p className="mt-1 text-xs text-zinc-600">ID da variação: {selectedItemId}</p>
          )}
        </div>

        <p className="mb-4 rounded-xl bg-zinc-900 px-4 py-3 text-xs text-zinc-500 text-center">
          🚧 Integração de pagamento via Pagar.me será implementada em O-01.
        </p>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-zinc-700 py-3 text-sm font-medium text-zinc-300 hover:border-zinc-600"
          >
            Cancelar
          </button>
          <button
            type="button"
            className="flex-1 rounded-xl bg-green-600 py-3 text-sm font-bold text-white hover:bg-green-500"
          >
            Prosseguir para pagamento
          </button>
        </div>
      </div>
    </div>
  )
}
