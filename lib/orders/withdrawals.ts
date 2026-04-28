/**
 * lib/orders/withdrawals.ts
 *
 * Lógica server-side de processamento de saques.
 * Usa lib/mercadopago/transfers.ts como provider de transferência PIX.
 *
 * Não importar em código client.
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { createPixWithdrawal } from '@/lib/mercadopago/transfers'
import type { PixKeyType } from '@/lib/validations/pix'

interface ProcessResult {
  ok:    boolean
  mpId?: string
  error?: string
}

/**
 * Processa um saque pendente via Mercado Pago Disbursements.
 * Em caso de falha, executa RPC reject_withdrawal (estorna saldo).
 */
export async function processWithdrawal(requestId: string): Promise<ProcessResult> {
  const admin = createAdminClient()

  // 1) Carrega + verifica status
  const { data: req, error: loadErr } = await admin
    .from('withdrawal_requests')
    .select('id, user_id, amount, fee, net_amount, type, pix_key, pix_key_type, status')
    .eq('id', requestId)
    .single<{
      id:           string
      user_id:      string
      amount:       number
      fee:          number
      net_amount:   number
      type:         string
      pix_key:      string
      pix_key_type: PixKeyType
      status:       string
    }>()

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
    .eq('id', req.id)
    .eq('status', 'pending')

  if (procErr) {
    return { ok: false, error: 'Falha ao bloquear saque (possível race condition).' }
  }

  // 3) Chama Mercado Pago Disbursements
  try {
    const transfer = await createPixWithdrawal({
      amount:      Number(req.net_amount),
      pixKey:      req.pix_key,
      pixKeyType:  req.pix_key_type,
      description: `Saque ${req.type} #${req.id.slice(0, 8)}`,
      externalRef: req.id,
    })

    // 4) Marca como concluído
    await admin
      .from('withdrawal_requests')
      .update({
        status:       'completed',
        mp_id:        transfer.id,
        processed_at: new Date().toISOString(),
        updated_at:   new Date().toISOString(),
      })
      .eq('id', req.id)

    await admin.from('notifications').insert({
      user_id: req.user_id,
      type:    'withdrawal_approved',
      title:   'Saque aprovado',
      message: `Seu saque de R$ ${Number(req.net_amount).toFixed(2)} foi processado com sucesso.`,
      data:    { withdrawal_id: req.id, mp_id: transfer.id },
    })

    return { ok: true, mpId: transfer.id }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Falha desconhecida no gateway.'
    console.error('[processWithdrawal]', req.id, msg)

    // Estorna saldo via RPC
    await admin.rpc('reject_withdrawal', {
      p_request_id: req.id,
      p_admin_id:   null,
      p_note:       `Falha automática MP: ${msg}`,
    })

    return { ok: false, error: msg }
  }
}
