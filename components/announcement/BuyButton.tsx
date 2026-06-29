'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { AnnouncementItem } from './VariationSelector'
import { PaymentMethods, PixResult } from '@/components/checkout/PaymentMethods'
import type { PaymentData } from '@/components/checkout/PaymentMethods'

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
              <p className="text-sm font-semibold text-[var(--gm-ink)]">Entrega Automática</p>
              <p className="text-xs text-[var(--gm-ink-dim)]">
                Receba seus dados instantaneamente após confirmar o pagamento
              </p>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={handleClick}
          disabled={disabled}
          className={`flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 text-base font-bold transition-all active:scale-[0.98] ${disabled
              ? 'cursor-not-allowed bg-[var(--gm-paper-3)] text-[var(--gm-ink-faint)]'
              : 'bg-[var(--gm-green)] text-[#0d1a12] shadow-lg shadow-[var(--gm-green)]/20 hover:opacity-90'
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
          <p className="text-center text-xs text-[var(--gm-ink-faint)]">
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

// ─── Checkout Modal ───────────────────────────────────────────────────────────
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
  const [orderId, setOrderId] = useState<string | null>(null)
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  function handleSuccess(id: string, pd: PaymentData) {
    setOrderId(id)
    setPaymentData(pd)
  }

  // Polling automático para confirmar PIX/Boleto pago
  useEffect(() => {
    if (!orderId || paymentData?.method === 'credit_card') return

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}/status`)
        const json = await res.json()
        if (json.status && json.status !== 'pending_payment' && json.status !== 'cancelled') {
          window.location.href = '/minhas-compras'
        }
      } catch (e) {
        // Ignora falhas de rede no polling
      }
    }, 4000)

    return () => clearInterval(interval)
  }, [orderId, paymentData?.method])

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[var(--gm-paper)]/80 backdrop-blur-sm sm:items-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label="Checkout"
    >
      <div className="w-full max-w-md rounded-t-3xl border border-[var(--gm-ink-faint)]/20 bg-[var(--gm-paper-2)] p-6 sm:rounded-3xl max-h-[90dvh] overflow-y-auto">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[var(--gm-ink)]">Confirmar Compra</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--gm-ink-faint)] hover:text-[var(--gm-ink)] transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Total */}
        <div className="rounded-2xl border border-[var(--gm-ink-faint)]/20 bg-[var(--gm-paper-3)] p-4 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--gm-ink-dim)]">Total a pagar</span>
            <span className="text-2xl font-bold text-[var(--gm-green)]">
              R$ {price.toFixed(2).replace('.', ',')}
            </span>
          </div>
        </div>

        {/* Erro */}
        {errorMsg && (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {errorMsg}
          </div>
        )}

        {/* Resultado PIX */}
        {orderId && paymentData?.pix && (
          <PixResult data={paymentData.pix} />
        )}

        {/* Resultado Boleto */}
        {orderId && paymentData?.boleto && (
          <div className="flex flex-col items-center gap-3">
            <p className="text-sm text-[var(--gm-ink-dim)] text-center">Boleto gerado com sucesso!</p>
            <a
              href={paymentData.boleto.boleto_url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full rounded-xl bg-amber-600 py-3 text-center text-sm font-bold text-white hover:bg-amber-500 transition-colors"
            >
              Abrir boleto
            </a>
            <div className="w-full rounded-xl bg-[var(--gm-paper-3)] border border-[var(--gm-ink-faint)]/20 p-3">
              <p className="text-xs text-[var(--gm-ink-faint)] mb-1">Código de barras</p>
              <code className="text-xs text-[var(--gm-ink-dim)] break-all select-all">
                {paymentData.boleto.boleto_barcode}
              </code>
            </div>
            <p className="text-xs text-[var(--gm-ink-faint)]">Vencimento: {paymentData.boleto.boleto_exp}</p>
          </div>
        )}

        {/* Resultado cartão */}
        {orderId && paymentData?.method === 'credit_card' && (
          <div className="text-center py-4">
            <p className="text-2xl mb-2">✅</p>
            <p className="text-sm font-semibold text-green-400">Pagamento aprovado!</p>
            <p className="text-xs text-[var(--gm-ink-faint)] mt-1">Pedido #{orderId.slice(0, 8)}</p>
          </div>
        )}

        {/* Formulário de pagamento (antes de submeter) */}
        {!orderId && (
          <PaymentMethods
            amount={price}
            announcementId={announcementId}
            itemId={selectedItemId}
            onSuccess={handleSuccess}
            onError={setErrorMsg}
          />
        )}

        {orderId && (
          <button
            type="button"
            onClick={onClose}
            className="mt-4 w-full rounded-xl border border-[var(--gm-ink-faint)]/30 py-3 text-sm font-medium text-[var(--gm-ink-dim)] hover:border-[var(--gm-violet)]/40 hover:text-[var(--gm-ink)] transition-colors"
          >
            Fechar
          </button>
        )}
      </div>
    </div>
  )
}
