/**
 * lib/pagarme/withdrawals.ts
 *
 * Processamento server-side de saques. Usa Pagar.me Transfers PIX.
 * NÃO importar em código client.
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { createPixTransfer } from '@/lib/pagarme/transfers'
import type { PixKeyType } from '@/lib/validations/pix'

const TURBO_FEE = parseFloat(process.env.WITHDRAWAL_TURBO_FEE ?? '3.50')
const MIN_AMOUNT = parseFloat(process.env.WITHDRAWAL_MIN_AMOUNT ?? '10.00')

export const WITHDRAWAL_LIMITS = {
  TURBO_FEE,
  MIN_AMOUNT,
} as const

interface ProcessResult {
  ok: boolean
  pagarmeId?: string
  error?:    string
}

/**
 * Processa um saque pendente: chama a Pagar.me, atualiza status e
 * envia notificação. Em caso de falha, marca como 'rejected' e
 * estorna o saldo via RPC reject_withdrawal.
 */
export async function processWithdrawal(requestId: string): Promise<ProcessResult> {
  const admin = createAdminClient()

  // 1) Carrega + lock lógico (status check)
  const { data: req, error: loadErr } = await admin
    .from('withdrawal_requests')
    .select('id, user_id, amount, fee, net_amount, type, pix_key, pix_key_type, status')
    .eq('id', requestId)
    .single()

  if (loadErr || !req) {
    return { ok: false, error: 'Solicitação não encontrada.' }
  }
  if (req.status !== 'pending') {
    return { ok: false, error: `Saque com status inválido: ${req.status}.` }
  }

  // 2) Marca como 'processing' (idempotência)
  const { error: procErr } = await admin
    .from('withdrawal_requests')
    .update({ status: 'processing', updated_at: new Date().toISOString() })
    .eq('id', requestId)
    .eq('status', 'pending')

  if (procErr) {
    return { ok: false, error: 'Falha ao marcar como processando.' }
  }

  // 3) Chama Pagar.me
  try {
    const transfer = await createPixTransfer({
      amountCents: Math.round(Number(req.net_amount) * 100),
      pixKey:      req.pix_key,
      pixKeyType:  req.pix_key_type as PixKeyType,
      description: `Saque ${req.type} #${req.id.slice(0, 8)}`,
      metadata:    {
        user_id:        req.user_id,
        withdrawal_id:  req.id,
        type:           req.type,
      },
    })

    await admin
      .from('withdrawal_requests')
      .update({
        status:       'completed',
        pagarme_id:   transfer.id,
        processed_at: new Date().toISOString(),
        updated_at:   new Date().toISOString(),
      })
      .eq('id', requestId)

    await admin.from('notifications').insert({
      user_id: req.user_id,
      type:    'withdrawal_approved',
      title:   'Saque aprovado',
      message: `Seu saque de R$ ${Number(req.net_amount).toFixed(2)} foi processado com sucesso.`,
      data:    { withdrawal_id: req.id, pagarme_id: transfer.id },
    })

    return { ok: true, pagarmeId: transfer.id }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido'
    console.error('[withdrawal] processing failed:', msg)

    // Estorna saldo via RPC (segurança definer faz tudo atomicamente)
    await admin.rpc('reject_withdrawal', {
      p_request_id: requestId,
      p_admin_id:   null,
      p_note:       `Falha no processamento automático: ${msg}`,
    })

    return { ok: false, error: msg }
  }
}
