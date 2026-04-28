/**
 * /api/admin/withdrawals/[id]/decision
 *
 * Stub temporário durante migração Pagar.me → Mercado Pago.
 * A aprovação/processamento de saques será reimplementada usando
 * lib/mercadopago/* nas próximas etapas.
 */

import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json(
    { error: 'Processamento de saques indisponível (migração em curso).' },
    { status: 501 },
  )
}
