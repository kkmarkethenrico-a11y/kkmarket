/**
 * lib/pagarme/client.ts
 *
 * HTTP client for the Pagar.me v5 REST API.
 * All amounts are in CENTAVOS (R$ 10.00 = 1000).
 *
 * SECURITY: Uses PAGARME_API_KEY (server-only). Never import in client code.
 */

const BASE_URL = 'https://api.pagar.me/core/v5'

function getHeaders(): HeadersInit {
  const key = process.env.PAGARME_API_KEY
  if (!key) throw new Error('Missing PAGARME_API_KEY')
  // Basic auth: sk_xxx as username, empty password
  const encoded = Buffer.from(`${key}:`).toString('base64')
  return {
    'Content-Type':  'application/json',
    Authorization:   `Basic ${encoded}`,
  }
}

async function pagarmeRequest<T = unknown>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const url = `${BASE_URL}${path}`
  const res = await fetch(url, {
    method,
    headers: getHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  })

  const json = await res.json()

  if (!res.ok) {
    console.error(`[Pagar.me] ${method} ${path} → ${res.status}`, JSON.stringify(json))
    throw new PagarmeError(
      json.message ?? `Pagar.me API error ${res.status}`,
      res.status,
      json,
    )
  }

  return json as T
}

// ─── Error type ──────────────────────────────────────────────────────────────
export class PagarmeError extends Error {
  constructor(
    message: string,
    public status: number,
    public response: unknown,
  ) {
    super(message)
    this.name = 'PagarmeError'
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────
export interface PagarmeCustomer {
  name:     string
  email:    string
  document: string
  type:     'individual' | 'company'
}

export interface PagarmeOrderItem {
  amount:      number   // centavos
  description: string
  quantity:    number
}

interface PagarmeChargeBase {
  payment_method: string
  amount:         number
}

export interface PagarmePixCharge extends PagarmeChargeBase {
  payment_method: 'pix'
  pix: {
    expires_in: number  // seconds
    additional_information?: { name: string; value: string }[]
  }
}

export interface PagarmeBoletoCharge extends PagarmeChargeBase {
  payment_method: 'boleto'
  boleto: {
    instructions: string
    due_at:       string  // ISO date
    document_number?: string
  }
}

export interface PagarmeCreditCardCharge extends PagarmeChargeBase {
  payment_method: 'credit_card'
  credit_card: {
    card_token:         string
    operation_type:     'auth_and_capture'
    installments:       number
    statement_descriptor?: string
  }
}

export type PagarmeCharge = PagarmePixCharge | PagarmeBoletoCharge | PagarmeCreditCardCharge

export interface PagarmeOrderResponse {
  id:       string
  code:     string
  status:   string
  charges:  {
    id:               string
    status:           string
    payment_method:   string
    last_transaction: {
      id:         string
      status:     string
      qr_code?:   string           // PIX
      qr_code_url?: string         // PIX
      url?:       string           // Boleto
      pdf?:       string           // Boleto
      expires_at?: string
    }
  }[]
}

// ─── API Functions ────────────────────────────────────────────────────────────

/**
 * Create an order with charges on Pagar.me v5.
 */
export async function createOrder(params: {
  customer: PagarmeCustomer
  items:    PagarmeOrderItem[]
  charges:  PagarmeCharge[]
  metadata?: Record<string, string>
}): Promise<PagarmeOrderResponse> {
  return pagarmeRequest<PagarmeOrderResponse>('POST', '/orders', {
    customer:  params.customer,
    items:     params.items,
    payments:  params.charges,
    metadata:  params.metadata,
  })
}

/**
 * Get an existing order by ID.
 */
export async function getOrder(orderId: string): Promise<PagarmeOrderResponse> {
  return pagarmeRequest<PagarmeOrderResponse>('GET', `/orders/${orderId}`)
}

/**
 * Cancel an order on Pagar.me.
 */
export async function cancelOrder(orderId: string): Promise<PagarmeOrderResponse> {
  return pagarmeRequest<PagarmeOrderResponse>('DELETE', `/orders/${orderId}`)
}

/**
 * Create a PIX charge body.
 */
export function buildPixCharge(amountCents: number, expiresInSeconds = 1800): PagarmePixCharge {
  return {
    payment_method: 'pix',
    amount:         amountCents,
    pix: {
      expires_in: expiresInSeconds,
      additional_information: [
        { name: 'Plataforma', value: process.env.NEXT_PUBLIC_APP_NAME ?? 'GameMarket' },
      ],
    },
  }
}

/**
 * Create a Boleto charge body.
 */
export function buildBoletoCharge(amountCents: number, dueDate: Date): PagarmeBoletoCharge {
  return {
    payment_method: 'boleto',
    amount:         amountCents,
    boleto: {
      instructions: `Pagamento referente a compra na ${process.env.NEXT_PUBLIC_APP_NAME ?? 'GameMarket'}`,
      due_at:       dueDate.toISOString(),
    },
  }
}

/**
 * Create a Credit Card charge body.
 */
export function buildCreditCardCharge(
  amountCents: number,
  cardToken: string,
  installments = 1,
): PagarmeCreditCardCharge {
  return {
    payment_method: 'credit_card',
    amount:         amountCents,
    credit_card: {
      card_token:          cardToken,
      operation_type:      'auth_and_capture',
      installments,
      statement_descriptor: 'GAMEMARKET',
    },
  }
}