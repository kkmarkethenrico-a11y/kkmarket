/**
 * lib/mercadopago/transfers.ts
 *
 * Transferências PIX de saída (Money Out / Disbursements).
 *
 * ATENÇÃO: A API POST /v1/disbursements exige habilitação manual pelo
 * suporte do Mercado Pago para cada conta. Enquanto não habilitada,
 * os saques devem ser processados manualmente pelo painel do MP em:
 * mercadopago.com.br → Seu negócio → Saques.
 *
 * Assim que o suporte habilitar a conta, esta função passa a funcionar
 * automaticamente sem alterar o código da aplicação.
 *
 * Não importar em código client.
 */

export type PixKeyType = 'cpf' | 'cnpj' | 'email' | 'phone' | 'random'

interface CreatePixWithdrawalParams {
  amount:      number       // em R$ (ex: 50.00)
  pixKey:      string
  pixKeyType:  PixKeyType
  description: string
  externalRef: string       // withdrawal_request.id
}

interface WithdrawalResult {
  id:     string
  status: string
}

interface MPDisbursementError {
  message?: string
  error?:   string
  status?:  number
}

/**
 * Cria uma transferência PIX de saída via API de Disbursements do MP.
 *
 * Requer MP_ACCESS_TOKEN com permissão de money-out habilitada pelo suporte.
 * Em caso de erro da API, lança Error com detalhes.
 */
export async function createPixWithdrawal(
  params: CreatePixWithdrawalParams,
): Promise<WithdrawalResult> {
  const accessToken = process.env.MP_ACCESS_TOKEN
  if (!accessToken) {
    throw new Error('[MP Transfer] MP_ACCESS_TOKEN não definido.')
  }

  const response = await fetch('https://api.mercadopago.com/v1/disbursements', {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${accessToken}`,
      'X-Idempotency-Key': params.externalRef, // idempotência por withdrawal_id
    },
    body: JSON.stringify({
      external_reference: params.externalRef,
      amount:             params.amount,
      description:        params.description,
      receiver: {
        pix_key:      params.pixKey,
        pix_key_type: params.pixKeyType,
      },
    }),
  })

  const json = await response.json() as WithdrawalResult & MPDisbursementError

  if (!response.ok) {
    const msg = json.message ?? json.error ?? `HTTP ${response.status}`
    throw new Error(`[MP Transfer] createPixWithdrawal falhou: ${msg}`)
  }

  return { id: json.id, status: json.status }
}
