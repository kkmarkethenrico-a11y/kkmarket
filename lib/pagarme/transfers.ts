/**
 * lib/pagarme/transfers.ts
 *
 * Wrapper para a API de transferências PIX da Pagar.me.
 *
 * Pagar.me v5: POST /transfers
 * Doc: https://docs.pagar.me/reference/criar-uma-transferncia
 *
 * Todas as quantias em CENTAVOS.
 */

const BASE_URL = 'https://api.pagar.me/core/v5'

function getHeaders(): HeadersInit {
  const key = process.env.PAGARME_API_KEY
  if (!key) throw new Error('Missing PAGARME_API_KEY')
  const encoded = Buffer.from(`${key}:`).toString('base64')
  return {
    'Content-Type': 'application/json',
    Authorization:  `Basic ${encoded}`,
  }
}

export interface PagarmeTransferResponse {
  id:          string
  status:      string
  amount:      number
  created_at?: string
  metadata?:   Record<string, unknown>
}

export interface CreatePixTransferParams {
  amountCents:  number
  pixKey:       string
  pixKeyType:   'cpf' | 'cnpj' | 'email' | 'phone' | 'random'
  description?: string
  metadata?:    Record<string, string>
}

export async function createPixTransfer(
  params: CreatePixTransferParams,
): Promise<PagarmeTransferResponse> {
  const res = await fetch(`${BASE_URL}/transfers`, {
    method:  'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      amount: params.amountCents,
      pix: {
        key:      params.pixKey,
        key_type: params.pixKeyType,
      },
      description: params.description,
      metadata:    params.metadata,
    }),
  })

  const json = await res.json()

  if (!res.ok) {
    console.error(`[pagarme.transfer] ${res.status}`, JSON.stringify(json))
    const msg = json?.message ?? `Pagar.me transfer failed (${res.status})`
    throw new Error(msg)
  }

  return json as PagarmeTransferResponse
}
