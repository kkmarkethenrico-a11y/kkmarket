'use client'

import { useEffect, useRef, useState } from 'react'
import Script from 'next/script'

// ─── Types ────────────────────────────────────────────────────────────────────

export type CheckoutMethod = 'pix' | 'boleto' | 'credit_card'

export interface PixData {
  pix_qr_code:    string
  pix_qr_base64:  string
  pix_expiration: string
}

export interface BoletoData {
  boleto_url:     string
  boleto_barcode: string
  boleto_exp:     string
}

export interface PaymentData {
  method:  CheckoutMethod
  pix?:    PixData
  boleto?: BoletoData
}

interface PaymentMethodsProps {
  amount:         number
  announcementId: string
  itemId?:        string
  onSuccess:      (orderId: string, paymentData: PaymentData) => void
  onError:        (msg: string) => void
}

// ─── MercadoPago window types ─────────────────────────────────────────────────
declare global {
  interface Window {
    MercadoPago?: new (
      publicKey: string,
      options?: { locale?: string },
    ) => MPInstance
  }
}

interface MPInstance {
  cardForm: (opts: {
    amount:     string
    autoMount:  boolean
    form:       MPFormConfig
    callbacks:  MPCallbacks
  }) => MPCardForm
}

interface MPCardForm {
  getCardFormData(): { token?: string; installments?: string }
  unmount(): void
}

interface MPFormConfig {
  id:                   string
  cardholderName:       { id: string }
  cardholderEmail:      { id: string }
  cardNumber:           { id: string }
  expirationDate:       { id: string }
  securityCode:         { id: string }
  installments:         { id: string }
  identificationType:   { id: string }
  identificationNumber: { id: string }
}

interface MPCallbacks {
  onFormMounted:  (err: unknown) => void
  onSubmit:       (event: Event & { preventDefault(): void }) => void
}

// ─── PIX Timer ────────────────────────────────────────────────────────────────

function PixTimer({ expiration }: { expiration: string }) {
  const [remaining, setRemaining] = useState<number>(() =>
    Math.max(0, Math.floor((new Date(expiration).getTime() - Date.now()) / 1000)),
  )

  useEffect(() => {
    if (remaining <= 0) return
    const interval = setInterval(() => {
      setRemaining((s) => Math.max(0, s - 1))
    }, 1000)
    return () => clearInterval(interval)
  }, [remaining])

  const mins = String(Math.floor(remaining / 60)).padStart(2, '0')
  const secs = String(remaining % 60).padStart(2, '0')
  const expired = remaining === 0

  return (
    <p className={`text-center text-sm font-mono ${expired ? 'text-red-400' : 'text-amber-400'}`}>
      {expired ? 'QR Code expirado. Atualize a página.' : `Expira em ${mins}:${secs}`}
    </p>
  )
}

// ─── PIX Result ───────────────────────────────────────────────────────────────

function PixResult({ data }: { data: PixData }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(data.pix_qr_code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-sm text-zinc-400 text-center">
        Escaneie o QR Code com o app do seu banco ou copie o código PIX.
      </p>

      {data.pix_qr_base64 && (
        <img
          src={`data:image/png;base64,${data.pix_qr_base64}`}
          alt="QR Code PIX"
          className="w-52 h-52 rounded-xl border border-zinc-700 bg-white p-2"
        />
      )}

      <PixTimer expiration={data.pix_expiration} />

      <div className="w-full rounded-xl bg-zinc-900 border border-zinc-800 p-3 flex items-center gap-2">
        <code className="flex-1 text-xs text-zinc-300 break-all select-all">
          {data.pix_qr_code}
        </code>
        <button
          type="button"
          onClick={handleCopy}
          className="shrink-0 rounded-lg bg-zinc-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-600 transition-colors"
        >
          {copied ? '✓ Copiado' : 'Copiar'}
        </button>
      </div>

      <p className="text-xs text-zinc-500 text-center">
        Após o pagamento, você receberá uma confirmação por e-mail.
      </p>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function PaymentMethods({
  amount,
  announcementId,
  itemId,
  onSuccess,
  onError,
}: PaymentMethodsProps) {
  const [method, setMethod] = useState<CheckoutMethod>('pix')
  const [loading, setLoading] = useState(false)
  const [sdkReady, setSdkReady] = useState(false)
  const cardFormRef = useRef<MPCardForm | null>(null)

  // Mount MP cardForm when SDK is ready and credit_card is selected
  useEffect(() => {
    if (method !== 'credit_card' || !sdkReady || !window.MercadoPago) return

    const publicKey = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY
    if (!publicKey) {
      onError('Chave pública do Mercado Pago não configurada.')
      return
    }

    const mpInstance = new window.MercadoPago(publicKey, { locale: 'pt-BR' })

    const form = mpInstance.cardForm({
      amount:    String(amount),
      autoMount: true,
      form: {
        id:                   'form-checkout',
        cardholderName:       { id: 'form-checkout__cardholderName' },
        cardholderEmail:      { id: 'form-checkout__cardholderEmail' },
        cardNumber:           { id: 'form-checkout__cardNumber' },
        expirationDate:       { id: 'form-checkout__expirationDate' },
        securityCode:         { id: 'form-checkout__securityCode' },
        installments:         { id: 'form-checkout__installments' },
        identificationType:   { id: 'form-checkout__identificationType' },
        identificationNumber: { id: 'form-checkout__identificationNumber' },
      },
      callbacks: {
        onFormMounted: (err) => {
          if (err) console.error('[MP cardForm]', err)
        },
        onSubmit: async (event) => {
          event.preventDefault()
          const { token, installments } = form.getCardFormData()
          if (!token) {
            onError('Não foi possível tokenizar o cartão. Verifique os dados.')
            return
          }
          await submitPayment({
            payment_method: 'credit_card',
            card_token:     token,
            installments:   parseInt(installments ?? '1'),
          })
        },
      },
    })

    cardFormRef.current = form
    return () => {
      form.unmount()
      cardFormRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [method, sdkReady])

  async function submitPayment(extra: Record<string, unknown> = {}) {
    setLoading(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          announcement_id: announcementId,
          item_id:         itemId,
          payment_method:  extra.payment_method ?? method,
          ...extra,
        }),
      })

      const json = await res.json()
      if (!res.ok) {
        onError(json.error ?? 'Erro ao processar pagamento.')
        return
      }

      const pd = json.payment_data as {
        method:          string
        pix_qr_code?:    string
        pix_qr_base64?:  string
        pix_expiration?: string
        boleto_url?:     string
        boleto_barcode?: string
        boleto_exp?:     string
      }

      const paymentData: PaymentData = {
        method: pd.method as CheckoutMethod,
        pix: pd.pix_qr_code
          ? { pix_qr_code: pd.pix_qr_code, pix_qr_base64: pd.pix_qr_base64 ?? '', pix_expiration: pd.pix_expiration ?? '' }
          : undefined,
        boleto: pd.boleto_url
          ? { boleto_url: pd.boleto_url, boleto_barcode: pd.boleto_barcode ?? '', boleto_exp: pd.boleto_exp ?? '' }
          : undefined,
      }

      onSuccess(json.order_id, paymentData)
    } catch {
      onError('Falha de rede. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const tab = (id: CheckoutMethod, label: string, icon: string) => (
    <button
      type="button"
      onClick={() => setMethod(id)}
      className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition-colors ${
        method === id
          ? 'bg-violet-600 text-white'
          : 'bg-zinc-800 text-zinc-400 hover:text-white'
      }`}
    >
      {icon} {label}
    </button>
  )

  return (
    <>
      <Script
        src="https://sdk.mercadopago.com/js/v2"
        strategy="afterInteractive"
        onReady={() => setSdkReady(true)}
      />

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {tab('pix',         'PIX',    '🏦')}
        {tab('boleto',      'Boleto', '📄')}
        {tab('credit_card', 'Cartão', '💳')}
      </div>

      {/* PIX */}
      {method === 'pix' && (
        <div className="space-y-4">
          <p className="text-sm text-zinc-400">
            Gere o QR Code PIX e pague com o app do seu banco. O QR expira em 30 minutos.
          </p>
          <button
            type="button"
            disabled={loading}
            onClick={() => submitPayment()}
            className="w-full rounded-xl bg-green-600 py-3 text-sm font-bold text-white hover:bg-green-500 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Gerando QR Code…' : 'Gerar QR Code PIX'}
          </button>
        </div>
      )}

      {/* Boleto */}
      {method === 'boleto' && (
        <div className="space-y-4">
          <p className="text-sm text-zinc-400">
            O boleto vence no dia seguinte. Identidade (CPF) deve estar verificada.
          </p>
          <button
            type="button"
            disabled={loading}
            onClick={() => submitPayment()}
            className="w-full rounded-xl bg-amber-600 py-3 text-sm font-bold text-white hover:bg-amber-500 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Gerando boleto…' : 'Gerar Boleto'}
          </button>
        </div>
      )}

      {/* Cartão */}
      {method === 'credit_card' && (
        <form id="form-checkout" className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs text-zinc-400 mb-1 block">Nome no cartão</label>
              <div id="form-checkout__cardholderName" className="mp-field" />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-zinc-400 mb-1 block">E-mail</label>
              <div id="form-checkout__cardholderEmail" className="mp-field" />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-zinc-400 mb-1 block">Número do cartão</label>
              <div id="form-checkout__cardNumber" className="mp-field" />
            </div>
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">Validade</label>
              <div id="form-checkout__expirationDate" className="mp-field" />
            </div>
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">CVV</label>
              <div id="form-checkout__securityCode" className="mp-field" />
            </div>
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">Tipo de documento</label>
              <div id="form-checkout__identificationType" className="mp-field" />
            </div>
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">Documento</label>
              <div id="form-checkout__identificationNumber" className="mp-field" />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-zinc-400 mb-1 block">Parcelas</label>
              <div id="form-checkout__installments" className="mp-field" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !sdkReady}
            className="w-full rounded-xl bg-violet-600 py-3 text-sm font-bold text-white hover:bg-violet-500 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Processando…' : !sdkReady ? 'Carregando…' : 'Pagar com cartão'}
          </button>
        </form>
      )}
    </>
  )
}

export { PixResult }
