'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
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
    MercadoPago?: new (publicKey: string, options?: { locale?: string }) => MPInstance
  }
}

interface MPCardTokenParams {
  cardNumber:           string
  cardholderName:       string
  cardExpirationMonth:  string
  cardExpirationYear:   string
  securityCode:         string
  identificationType:   string
  identificationNumber: string
}

interface MPInstance {
  createCardToken(params: MPCardTokenParams): Promise<{ id: string }>
}

// ─── PIX Timer ────────────────────────────────────────────────────────────────

function PixTimer({ expiration }: { expiration: string }) {
  const [remaining, setRemaining] = useState<number>(() =>
    Math.max(0, Math.floor((new Date(expiration).getTime() - Date.now()) / 1000)),
  )
  useEffect(() => {
    if (remaining <= 0) return
    const id = setInterval(() => setRemaining((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(id)
  }, [remaining])
  const mins    = String(Math.floor(remaining / 60)).padStart(2, '0')
  const secs    = String(remaining % 60).padStart(2, '0')
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
        <code className="flex-1 text-xs text-zinc-300 break-all select-all">{data.pix_qr_code}</code>
        <button
          type="button"
          onClick={handleCopy}
          className="shrink-0 rounded-lg bg-zinc-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-600 transition-colors"
        >
          {copied ? '\u2713 Copiado' : 'Copiar'}
        </button>
      </div>
      <p className="text-xs text-zinc-500 text-center">
        Após o pagamento, você receberá uma confirmação por e-mail.
      </p>
    </div>
  )
}

// ─── Card input helpers ───────────────────────────────────────────────────────

function formatCardNumber(v: string) {
  return v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()
}

function formatExpiry(v: string) {
  const digits = v.replace(/\D/g, '').slice(0, 4)
  if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return digits
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  maxLength,
  inputMode,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  maxLength?: number
  inputMode?: React.InputHTMLAttributes<HTMLInputElement>['inputMode']
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-zinc-400">{label}</label>
      <input
        type="text"
        inputMode={inputMode}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        autoComplete="off"
        className="h-10 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 text-sm text-white placeholder-zinc-600 outline-none transition focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
      />
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
  const [method, setMethod]     = useState<CheckoutMethod>('pix')
  const [loading, setLoading]   = useState(false)
  const [sdkReady, setSdkReady] = useState(false)
  const mpRef = useRef<MPInstance | null>(null)

  // Card fields
  const [cardNumber, setCardNumber]     = useState('')
  const [cardName, setCardName]         = useState('')
  const [expiry, setExpiry]             = useState('')
  const [cvv, setCvv]                   = useState('')
  const [docType, setDocType]           = useState('CPF')
  const [docNumber, setDocNumber]       = useState('')
  const [installments, setInstallments] = useState('1')

  // Init MP instance when SDK loads
  useEffect(() => {
    if (!sdkReady || !window.MercadoPago) return
    const publicKey = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY
    if (!publicKey) { onError('Chave pública do Mercado Pago não configurada.'); return }
    mpRef.current = new window.MercadoPago(publicKey, { locale: 'pt-BR' })
  }, [sdkReady, onError])

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
      if (!res.ok) { onError(json.error ?? 'Erro ao processar pagamento.'); return }

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

  async function handleCardSubmit(e: FormEvent) {
    e.preventDefault()
    if (!mpRef.current) {
      onError('SDK do Mercado Pago ainda está carregando. Aguarde.')
      return
    }
    const parts = expiry.replace(/\s/g, '').split('/')
    const month = parts[0] ?? ''
    const year  = parts[1] ? `20${parts[1]}` : ''
    if (!cardNumber.replace(/\s/g, '') || !cardName || !month || !year || !cvv || !docNumber) {
      onError('Preencha todos os campos do cartão.')
      return
    }
    try {
      const token = await mpRef.current.createCardToken({
        cardNumber:           cardNumber.replace(/\s/g, ''),
        cardholderName:       cardName,
        cardExpirationMonth:  month,
        cardExpirationYear:   year,
        securityCode:         cvv,
        identificationType:   docType,
        identificationNumber: docNumber.replace(/\D/g, ''),
      })
      await submitPayment({
        payment_method: 'credit_card',
        card_token:     token.id,
        installments:   parseInt(installments, 10),
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao tokenizar cartão. Verifique os dados.'
      onError(msg)
    }
  }

  const tab = (id: CheckoutMethod, label: string, icon: string) => (
    <button
      key={id}
      type="button"
      onClick={() => setMethod(id)}
      className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition-colors ${
        method === id ? 'bg-violet-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'
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
            {loading ? 'Gerando QR Code\u2026' : 'Gerar QR Code PIX'}
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
            {loading ? 'Gerando boleto\u2026' : 'Gerar Boleto'}
          </button>
        </div>
      )}

      {/* Cartão — inputs nativos + mp.createCardToken() */}
      {method === 'credit_card' && (
        <form onSubmit={handleCardSubmit} className="space-y-3">
          <Field label="Nome no cartão"    value={cardName}   onChange={setCardName}   placeholder="Como aparece no cartão" />
          <Field label="Número do cartão"  value={cardNumber} onChange={(v) => setCardNumber(formatCardNumber(v))} placeholder="0000 0000 0000 0000" maxLength={19} inputMode="numeric" />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Validade" value={expiry} onChange={(v) => setExpiry(formatExpiry(v))} placeholder="MM/AA" maxLength={5} inputMode="numeric" />
            <Field label="CVV"      value={cvv}    onChange={setCvv}                            placeholder="123"   maxLength={4} inputMode="numeric" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-zinc-400">Tipo doc.</label>
              <select value={docType} onChange={(e) => setDocType(e.target.value)}
                className="h-10 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 text-sm text-white outline-none transition focus:border-violet-500">
                <option value="CPF">CPF</option>
                <option value="CNPJ">CNPJ</option>
              </select>
            </div>
            <Field label="Documento" value={docNumber} onChange={setDocNumber}
              placeholder={docType === 'CPF' ? '000.000.000-00' : '00.000.000/0001-00'} inputMode="numeric" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-zinc-400">Parcelas</label>
            <select value={installments} onChange={(e) => setInstallments(e.target.value)}
              className="h-10 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 text-sm text-white outline-none transition focus:border-violet-500">
              {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>{n}x {n === 1 ? 'sem juros' : ''}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={loading || !sdkReady}
            className="w-full rounded-xl bg-violet-600 py-3 text-sm font-bold text-white hover:bg-violet-500 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Processando\u2026' : !sdkReady ? 'Carregando SDK\u2026' : 'Pagar com cartão'}
          </button>
        </form>
      )}
    </>
  )
}

export { PixResult }
