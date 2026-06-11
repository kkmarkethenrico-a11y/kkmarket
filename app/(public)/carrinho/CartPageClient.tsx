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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--gm-paper)]/90 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-2xl border border-[var(--gm-violet)]/30 bg-[var(--gm-paper-2)] p-8 text-center">
          <p className="text-4xl mb-4">🎉</p>
          <div className="rank-chip inline-flex mb-4">ACHIEVEMENT DESBLOQUEADO</div>
          <h2 className="text-xl font-black text-[var(--gm-ink)] mb-2">
            {items.length === 1 ? 'Pedido criado!' : 'Todos os pedidos criados!'}
          </h2>
          <p className="text-sm text-[var(--gm-ink-dim)] mb-6">
            Acompanhe o status em Minhas Compras.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/minhas-compras"
              onClick={onClose}
              className="w-full rounded-lg bg-[var(--gm-violet)] py-3 text-center text-sm font-black text-[#1a1126] hover:opacity-90 transition-all gm-glow"
            >
              Ver Minhas Compras
            </Link>
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-[var(--gm-ink-faint)] hover:text-[var(--gm-ink)] transition-colors"
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
      className="fixed inset-0 z-50 flex items-end justify-center bg-[var(--gm-paper)]/80 backdrop-blur-sm sm:items-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label="Checkout"
    >
      <div className="w-full max-w-md rounded-t-2xl border border-[var(--gm-ink-faint)]/30 bg-[var(--gm-paper-2)] p-6 sm:rounded-2xl max-h-[90dvh] overflow-y-auto">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-black text-[var(--gm-ink)]">
              {items.length > 1 ? `Item ${step + 1} de ${items.length}` : 'Confirmar Compra'}
            </h2>
            <p className="text-xs text-[var(--gm-ink-faint)] truncate max-w-[250px]">{current.title}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--gm-ink-faint)] hover:text-[var(--gm-ink)] transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Barra de progresso (multi-item) */}
        {items.length > 1 && (
          <div className="xp-bar mb-4">
            <div className="xp-bar-fill" style={{ width: `${((step) / items.length) * 100}%` }} />
          </div>
        )}

        {/* Item atual */}
        <div className="rounded-xl border border-[var(--gm-ink-faint)]/20 bg-[var(--gm-paper-3)] p-4 mb-4 flex items-center gap-3">
          {current.imageUrl ? (
            <Image
              src={current.imageUrl}
              alt={current.title}
              width={48}
              height={48}
              className="rounded-lg object-cover shrink-0"
            />
          ) : (
            <div className="h-12 w-12 rounded-lg bg-[var(--gm-paper-2)] flex items-center justify-center text-xl shrink-0 border border-[var(--gm-ink-faint)]/20">
              🎮
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[var(--gm-ink)] truncate">{current.title}</p>
            {current.selectedItemLabel && (
              <p className="text-xs text-[var(--gm-ink-faint)]">{current.selectedItemLabel}</p>
            )}
          </div>
          <span className="text-base font-black text-[var(--gm-green)] shrink-0">
            R$ {(current.price * current.quantity).toFixed(2).replace('.', ',')}
          </span>
        </div>

        {/* Erro */}
        {errorMsg && (
          <div className="mb-4 rounded-lg border border-[var(--gm-rose)]/30 bg-[var(--gm-rose)]/10 px-4 py-3 text-sm text-[var(--gm-rose)]">
            {errorMsg}
          </div>
        )}

        {/* Resultado PIX */}
        {orderId && paymentData?.pix && <PixResult data={paymentData.pix} />}

        {/* Resultado Boleto */}
        {orderId && paymentData?.boleto && (
          <div className="flex flex-col items-center gap-3">
            <p className="text-sm text-[var(--gm-ink-dim)] text-center">Boleto gerado com sucesso!</p>
            <a
              href={paymentData.boleto.boleto_url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full rounded-lg bg-[var(--gm-amber)] py-3 text-center text-sm font-black text-[#0d0d12] hover:opacity-90 transition-colors"
            >
              Abrir boleto
            </a>
            <div className="w-full rounded-lg border border-[var(--gm-ink-faint)]/30 bg-[var(--gm-paper-3)] p-3">
              <p className="text-[10px] text-[var(--gm-ink-faint)] mb-1">Código de barras</p>
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
            <p className="text-sm font-black text-[var(--gm-green)]">Pagamento aprovado!</p>
            <p className="text-xs text-[var(--gm-ink-faint)] mt-1">Pedido #{orderId.slice(0, 8)}</p>
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
              className="mt-4 w-full rounded-lg border border-[var(--gm-ink-faint)]/40 py-3 text-sm font-bold text-[var(--gm-ink-dim)] hover:border-[var(--gm-violet)]/50 hover:text-[var(--gm-ink)] transition-colors"
            >
              Fechar
            </button>
          ) : (
            <button
              type="button"
              onClick={handleNext}
              className="mt-4 w-full rounded-lg bg-[var(--gm-violet)] py-3 text-sm font-black text-[#1a1126] hover:opacity-90 transition-all gm-glow"
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
        <ShoppingBag className="h-16 w-16 text-[var(--gm-ink-faint)]" />
        <h1 className="text-2xl font-black text-[var(--gm-ink)]">Carrinho vazio</h1>
        <p className="text-sm text-[var(--gm-ink-dim)] max-w-sm">
          Explore o marketplace e adicione produtos ao carrinho para comprá-los.
        </p>
        <Link
          href="/buscar"
          className="flex items-center gap-2 rounded-lg bg-[var(--gm-violet)] px-6 py-3 text-sm font-black text-[#1a1126] hover:opacity-90 transition-all gm-glow"
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
          <div>
            <div className="rank-chip mb-2 inline-flex">🛒 CARRINHO</div>
            <h1 className="text-2xl font-black text-[var(--gm-ink)]">
              {totalItems()} {totalItems() === 1 ? 'item' : 'itens'}
            </h1>
          </div>
          <button
            onClick={clearCart}
            className="text-xs text-[var(--gm-ink-faint)] hover:text-[var(--gm-rose)] transition-colors"
          >
            Limpar carrinho
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Lista de itens */}
          <div className="lg:col-span-2 flex flex-col gap-3">
            {/* Bonus callout */}
            <div className="rounded-xl border border-[var(--gm-amber)]/30 bg-[var(--gm-amber)]/5 px-4 py-3 flex items-center gap-3">
              <span className="text-lg">🎉</span>
              <p className="text-xs font-bold text-[var(--gm-amber)]">+{Math.round(totalPrice() * 0.1)} pts grátis se finalizar agora</p>
            </div>

            {items.map((item) => (
              <div
                key={`${item.announcementId}-${item.selectedItemId ?? ''}`}
                className="flex gap-4 rounded-xl border border-[var(--gm-ink-faint)]/20 bg-[var(--gm-paper-2)] p-4"
              >
                {/* Imagem */}
                <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-[var(--gm-paper-3)]">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.title}
                      width={56}
                      height={56}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[var(--gm-ink-faint)]">
                      🎮
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex flex-1 flex-col gap-1 min-w-0">
                  <Link
                    href={`/anuncio/${item.announcementSlug}`}
                    className="truncate text-sm font-bold text-[var(--gm-ink)] hover:text-[var(--gm-violet)] transition-colors"
                  >
                    {item.title}
                  </Link>
                  {item.selectedItemLabel && (
                    <p className="text-xs text-[var(--gm-ink-faint)]">{item.selectedItemLabel}</p>
                  )}
                  <p className="text-base font-black text-[var(--gm-green)]">
                    R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}
                  </p>
                </div>

                {/* Qty + remover */}
                <div className="flex flex-col items-end gap-2">
                  <button
                    onClick={() => removeItem(item.announcementId, item.selectedItemId)}
                    className="text-[var(--gm-ink-faint)] hover:text-[var(--gm-rose)] transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        updateQuantity(item.announcementId, item.quantity - 1, item.selectedItemId)
                      }
                      className="flex h-6 w-6 items-center justify-center rounded-lg border border-[var(--gm-ink-faint)]/40 text-[var(--gm-ink-dim)] hover:border-[var(--gm-violet)]/50 hover:text-[var(--gm-ink)] transition-colors"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-5 text-center text-sm font-bold text-[var(--gm-ink)]">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        updateQuantity(item.announcementId, item.quantity + 1, item.selectedItemId)
                      }
                      className="flex h-6 w-6 items-center justify-center rounded-lg border border-[var(--gm-ink-faint)]/40 text-[var(--gm-ink-dim)] hover:border-[var(--gm-violet)]/50 hover:text-[var(--gm-ink)] transition-colors"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            <Link
              href="/buscar"
              className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--gm-ink-faint)]/30 py-3 text-sm text-[var(--gm-ink-faint)] hover:border-[var(--gm-violet)]/40 hover:text-[var(--gm-ink)] transition-all"
            >
              <ArrowLeft className="h-4 w-4" />
              continuar comprando
            </Link>
          </div>

          {/* Resumo */}
          <div className="h-fit rounded-xl border border-[var(--gm-ink-faint)]/30 bg-[var(--gm-paper-2)] p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black uppercase tracking-widest text-[var(--gm-ink-faint)]">resumo</h2>
            </div>

            <div className="flex flex-col gap-2 text-sm border-b border-[var(--gm-ink-faint)]/20 pb-4">
              <div className="flex justify-between text-[var(--gm-ink-dim)]">
                <span>subtotal ({totalItems()} {totalItems() === 1 ? 'item' : 'itens'})</span>
                <span className="text-[var(--gm-ink)] font-semibold">R$ {totalPrice().toFixed(2).replace('.', ',')}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-[var(--gm-ink)]">total</span>
              <span className="text-2xl font-black text-[var(--gm-green)]">
                R$ {totalPrice().toFixed(2).replace('.', ',')}
              </span>
            </div>

            {/* XP bar bonus */}
            <div className="rounded-lg border border-[var(--gm-violet)]/20 bg-[var(--gm-violet)]/5 p-3">
              <p className="text-[10px] font-bold text-[var(--gm-violet)] uppercase tracking-wide mb-1.5">
                🎁 +{Math.round(totalPrice() * 0.1)} pts ao comprar
              </p>
              <div className="xp-bar">
                <div className="xp-bar-fill" style={{ width: '65%' }} />
              </div>
            </div>

            <p className="text-[10px] text-[var(--gm-ink-faint)] text-center">
              🔒 Pagamento seguro via Mercado Pago · Escrow até confirmação
            </p>

            <button
              onClick={() => setCheckoutOpen(true)}
              className="w-full rounded-lg bg-[var(--gm-violet)] py-4 text-sm font-black text-[#1a1126] hover:opacity-90 transition-all active:scale-[0.98] gm-glow"
            >
              finalizar →
            </button>
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
