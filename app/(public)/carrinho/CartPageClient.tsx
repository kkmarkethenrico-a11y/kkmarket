'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Trash2, ShoppingBag, ArrowLeft, Plus, Minus } from 'lucide-react'
import { useCartStore } from '@/stores/cartStore'
import type { CartItem } from '@/stores/cartStore'
import { PaymentMethods, PixResult } from '@/components/checkout/PaymentMethods'
import type { PaymentData } from '@/components/checkout/PaymentMethods'

// ─── Modal de checkout sequencial (um item por vez) ───────────────────────────
function CartCheckoutModal({
  items,
  onClose,
}: {
  items: CartItem[]
  onClose: () => void
}) {
  const [step, setStep]               = useState(0)
  const [orderId, setOrderId]         = useState<string | null>(null)
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null)
  const [errorMsg, setErrorMsg]       = useState<string | null>(null)
  const [paidCount, setPaidCount]     = useState(0)
  const removeItem = useCartStore((s) => s.removeItem)

  const current = items[step]
  const isLast  = step === items.length - 1
  const allDone = paidCount === items.length

  function handleSuccess(id: string, pd: PaymentData) {
    setOrderId(id)
    setPaymentData(pd)
    setPaidCount((n) => n + 1)
    removeItem(current.announcementId, current.selectedItemId)
  }

  function handleNext() {
    setOrderId(null)
    setPaymentData(null)
    setErrorMsg(null)
    setStep((s) => s + 1)
  }

  if (allDone) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-950 p-8 text-center">
          <p className="text-4xl mb-4">🎉</p>
          <h2 className="text-xl font-bold text-white mb-2">
            {items.length === 1 ? 'Pedido criado!' : 'Todos os pedidos criados!'}
          </h2>
          <p className="text-sm text-zinc-500 mb-6">
            Acompanhe o status em Minhas Compras.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/minhas-compras"
              onClick={onClose}
              className="w-full rounded-2xl bg-violet-600 py-3 text-center text-sm font-bold text-white hover:bg-violet-500 transition-colors"
            >
              Ver Minhas Compras
            </Link>
            <button
              type="button"
              onClick={onClose}
              className="text-sm text-zinc-500 hover:text-white transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-950/80 backdrop-blur-sm sm:items-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label="Checkout"
    >
      <div className="w-full max-w-md rounded-t-3xl border border-zinc-800 bg-zinc-950 p-6 sm:rounded-3xl max-h-[90dvh] overflow-y-auto">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">
              {items.length > 1 ? `Item ${step + 1} de ${items.length}` : 'Confirmar Compra'}
            </h2>
            <p className="text-xs text-zinc-500 truncate max-w-[250px]">{current.title}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-500 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Barra de progresso (multi-item) */}
        {items.length > 1 && (
          <div className="flex gap-1 mb-4">
            {items.map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  i < step ? 'bg-green-500' : i === step ? 'bg-violet-500' : 'bg-zinc-800'
                }`}
              />
            ))}
          </div>
        )}

        {/* Item atual */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 mb-4 flex items-center gap-3">
          {current.imageUrl ? (
            <Image
              src={current.imageUrl}
              alt={current.title}
              width={48}
              height={48}
              className="rounded-xl object-cover shrink-0"
            />
          ) : (
            <div className="h-12 w-12 rounded-xl bg-zinc-700 flex items-center justify-center text-xl shrink-0">
              🎮
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{current.title}</p>
            {current.selectedItemLabel && (
              <p className="text-xs text-zinc-500">{current.selectedItemLabel}</p>
            )}
          </div>
          <span className="text-lg font-bold text-green-400 shrink-0">
            R$ {(current.price * current.quantity).toFixed(2).replace('.', ',')}
          </span>
        </div>

        {/* Erro */}
        {errorMsg && (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {errorMsg}
          </div>
        )}

        {/* Resultado PIX */}
        {orderId && paymentData?.pix && <PixResult data={paymentData.pix} />}

        {/* Resultado Boleto */}
        {orderId && paymentData?.boleto && (
          <div className="flex flex-col items-center gap-3">
            <p className="text-sm text-zinc-400 text-center">Boleto gerado com sucesso!</p>
            <a
              href={paymentData.boleto.boleto_url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full rounded-xl bg-amber-600 py-3 text-center text-sm font-bold text-white hover:bg-amber-500 transition-colors"
            >
              Abrir boleto
            </a>
            <div className="w-full rounded-xl bg-zinc-900 border border-zinc-800 p-3">
              <p className="text-xs text-zinc-500 mb-1">Código de barras</p>
              <code className="text-xs text-zinc-300 break-all select-all">
                {paymentData.boleto.boleto_barcode}
              </code>
            </div>
            <p className="text-xs text-zinc-500">Vencimento: {paymentData.boleto.boleto_exp}</p>
          </div>
        )}

        {/* Resultado cartão */}
        {orderId && paymentData?.method === 'credit_card' && (
          <div className="text-center py-4">
            <p className="text-2xl mb-2">✅</p>
            <p className="text-sm font-semibold text-green-400">Pagamento aprovado!</p>
            <p className="text-xs text-zinc-500 mt-1">Pedido #{orderId.slice(0, 8)}</p>
          </div>
        )}

        {/* Formulário de pagamento */}
        {!orderId && (
          <PaymentMethods
            amount={current.price * current.quantity}
            announcementId={current.announcementId}
            itemId={current.selectedItemId}
            onSuccess={handleSuccess}
            onError={setErrorMsg}
          />
        )}

        {/* Botão próximo / fechar */}
        {orderId && (
          isLast ? (
            <button
              type="button"
              onClick={onClose}
              className="mt-4 w-full rounded-xl border border-zinc-700 py-3 text-sm font-medium text-zinc-300 hover:border-zinc-600 transition-colors"
            >
              Fechar
            </button>
          ) : (
            <button
              type="button"
              onClick={handleNext}
              className="mt-4 w-full rounded-2xl bg-violet-600 py-3 text-sm font-bold text-white hover:bg-violet-500 transition-colors"
            >
              Próximo item →
            </button>
          )
        )}
      </div>
    </div>
  )
}

// ─── Página do carrinho ───────────────────────────────────────────────────────
export function CartPageClient() {
  const { items, removeItem, updateQuantity, clearCart, totalItems, totalPrice } = useCartStore()
  const [checkoutOpen, setCheckoutOpen] = useState(false)

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
    <>
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
          {/* Lista de itens */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {items.map((item) => (
              <div
                key={`${item.announcementId}-${item.selectedItemId ?? ''}`}
                className="flex gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4"
              >
                {/* Imagem */}
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

                {/* Qty + remover */}
                <div className="flex flex-col items-end gap-2">
                  <button
                    onClick={() => removeItem(item.announcementId, item.selectedItemId)}
                    className="text-zinc-600 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        updateQuantity(item.announcementId, item.quantity - 1, item.selectedItemId)
                      }
                      className="flex h-6 w-6 items-center justify-center rounded-full border border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white transition-colors"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-6 text-center text-sm font-medium text-white">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        updateQuantity(item.announcementId, item.quantity + 1, item.selectedItemId)
                      }
                      className="flex h-6 w-6 items-center justify-center rounded-full border border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white transition-colors"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Resumo */}
          <div className="h-fit rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 flex flex-col gap-4">
            <h2 className="font-bold text-white text-lg">Resumo do pedido</h2>

            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between text-zinc-400">
                <span>Subtotal ({totalItems()} {totalItems() === 1 ? 'item' : 'itens'})</span>
                <span className="text-white">R$ {totalPrice().toFixed(2).replace('.', ',')}</span>
              </div>
            </div>

            <div className="border-t border-zinc-800 pt-4 flex justify-between font-bold">
              <span className="text-white">Total</span>
              <span className="text-green-400 text-xl">
                R$ {totalPrice().toFixed(2).replace('.', ',')}
              </span>
            </div>

            <p className="rounded-xl bg-zinc-800/40 px-4 py-2.5 text-xs text-zinc-500 text-center">
              🔒 Pagamento seguro via Mercado Pago · Escrow até confirmação
            </p>

            <button
              onClick={() => setCheckoutOpen(true)}
              className="w-full rounded-2xl bg-green-600 py-4 text-sm font-bold text-white shadow-lg shadow-green-600/20 hover:bg-green-500 transition-all active:scale-[0.98]"
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

      {/* Modal de checkout */}
      {checkoutOpen && (
        <CartCheckoutModal
          items={[...items]}
          onClose={() => setCheckoutOpen(false)}
        />
      )}
    </>
  )
}
