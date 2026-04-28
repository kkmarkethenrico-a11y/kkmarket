/**
 * /api/withdrawals
 *
 * GET → lista saques do usuário autenticado.
 * POST → solicita novo saque (valida KYC + saldo, processa TURBO imediatamente).
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkKycComplete } from '@/lib/validations/kyc'
import { PIX_KEY_TYPES, validatePixKey, type PixKeyType } from '@/lib/validations/pix'
import { WITHDRAWAL_LIMITS } from '@/lib/withdrawal/limits'
import { processWithdrawal } from '@/lib/orders/withdrawals'

const postSchema = z.object({
  amount:       z.number().positive(),
  type:         z.enum(['normal', 'turbo']),
  pix_key:      z.string().min(1).max(150),
  pix_key_type: z.enum(PIX_KEY_TYPES),
})

// ─── GET ─────────────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const url    = new URL(request.url)
  const page   = Math.max(1, parseInt(url.searchParams.get('page')  ?? '1'))
  const limit  = Math.min(50, parseInt(url.searchParams.get('limit') ?? '20'))
  const offset = (page - 1) * limit

  const { data, error, count } = await supabase
    .from('withdrawal_requests')
    .select(
      'id, amount, fee, net_amount, type, pix_key, pix_key_type, status, rejection_note, processed_at, created_at',
      { count: 'exact' },
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('[withdrawals.GET]', error)
    return NextResponse.json({ error: 'Falha ao listar saques.' }, { status: 500 })
  }

  const admin = createAdminClient()
  const { data: stats } = await admin
    .from('user_stats')
    .select('wallet_balance')
    .eq('user_id', user.id)
    .maybeSingle()

  return NextResponse.json({
    data:    data ?? [],
    count:   count ?? 0,
    page,
    limit,
    balance: Number(stats?.wallet_balance ?? 0),
  })
}

// ─── POST ─────────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  let body: z.infer<typeof postSchema>
  try {
    body = postSchema.parse(await request.json())
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues[0]?.message ?? 'Dados inválidos.' },
        { status: 400 },
      )
    }
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 })
  }

  const amount = Math.round(body.amount * 100) / 100
  if (amount < WITHDRAWAL_LIMITS.MIN_AMOUNT) {
    return NextResponse.json(
      { error: `Valor mínimo: R$ ${WITHDRAWAL_LIMITS.MIN_AMOUNT.toFixed(2)}.` },
      { status: 400 },
    )
  }

  const pixCheck = validatePixKey(body.pix_key_type as PixKeyType, body.pix_key)
  if (!pixCheck.valid) {
    return NextResponse.json({ error: pixCheck.reason ?? 'Chave PIX inválida.' }, { status: 400 })
  }

  // Verificação de identidade obrigatória para saques
  const kyc = await checkKycComplete(user.id)
  if (!kyc.complete) {
    return NextResponse.json(
      {
        error: 'Verificação de identidade incompleta.',
        kyc:   { missing: kyc.missing, pending: kyc.pending, rejected: kyc.rejected },
      },
      { status: 403 },
    )
  }

  const admin = createAdminClient()
  const { data: stats } = await admin
    .from('user_stats')
    .select('wallet_balance')
    .eq('user_id', user.id)
    .maybeSingle()

  const balance = Number(stats?.wallet_balance ?? 0)
  if (balance < amount) {
    return NextResponse.json(
      { error: `Saldo insuficiente. Disponível: R$ ${balance.toFixed(2)}.` },
      { status: 400 },
    )
  }

  const fee = body.type === 'turbo' ? WITHDRAWAL_LIMITS.TURBO_FEE : 0
  if (body.type === 'turbo' && amount <= fee) {
    return NextResponse.json(
      { error: `Valor TURBO deve ser maior que a taxa de R$ ${fee.toFixed(2)}.` },
      { status: 400 },
    )
  }

  // RPC atômica: cria withdrawal_request + debita saldo
  const { data: created, error: rpcErr } = await admin.rpc('request_withdrawal', {
    p_user_id:      user.id,
    p_amount:       amount,
    p_fee:          fee,
    p_type:         body.type,
    p_pix_key:      pixCheck.normalized,
    p_pix_key_type: body.pix_key_type,
  })

  if (rpcErr || !created) {
    console.error('[withdrawals.POST] rpc', rpcErr)
    const msg = rpcErr?.message?.includes('insufficient_balance')
      ? 'Saldo insuficiente.'
      : 'Falha ao criar solicitação de saque.'
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  const row = Array.isArray(created) ? created[0] : created

  // TURBO: processa via MP Disbursements imediatamente
  if (body.type === 'turbo') {
    const result = await processWithdrawal(row.id)
    if (!result.ok) {
      return NextResponse.json(
        { error: `Falha no processamento TURBO: ${result.error}. O valor foi devolvido ao saldo.` },
        { status: 502 },
      )
    }
    return NextResponse.json(
      { ok: true, withdrawal: { ...row, status: 'completed' } },
      { status: 201 },
    )
  }

  // Normal: fica pendente para processamento diário (Edge Function ou admin)
  return NextResponse.json({ ok: true, withdrawal: row }, { status: 201 })
}
