/**
 * Constantes de limites/saques. Provider-agnóstico (era lib/pagarme/withdrawals.ts).
 * Será usado pela próxima integração via Mercado Pago.
 */
const TURBO_FEE  = parseFloat(process.env.WITHDRAWAL_TURBO_FEE  ?? '3.50')
const MIN_AMOUNT = parseFloat(process.env.WITHDRAWAL_MIN_AMOUNT ?? '10.00')

export const WITHDRAWAL_LIMITS = {
  TURBO_FEE,
  MIN_AMOUNT,
} as const
