/**
 * Supabase Edge Function: process-withdrawal
 *
 * Roda 1x ao dia (10h America/Sao_Paulo) via pg_cron. Busca todos os
 * withdrawal_requests com status='pending' AND type='normal' e dispara
 * a transferência PIX via Mercado Pago Disbursements API.
 *
 * ATENÇÃO: A API de Disbursements exige habilitação manual pelo suporte MP.
 * Enquanto não habilitada, processar saques manualmente em:
 * mercadopago.com.br → Seu negócio → Saques.
 *
 * Deploy:
 *   supabase functions deploy process-withdrawal
 *
 * Cron:
 *   SELECT cron.schedule(
 *     'process-withdrawal-daily',
 *     '0 13 * * *',  -- 13:00 UTC ≈ 10:00 BRT
 *     $$SELECT net.http_post(
 *       url := 'https://<project>.supabase.co/functions/v1/process-withdrawal',
 *       headers := '{"Authorization": "Bearer <service_role_key>"}'::jsonb
 *     )$$
 *   );
 */

// @ts-ignore — Deno edge runtime
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// @ts-ignore
const SUPABASE_URL     = Deno.env.get('SUPABASE_URL')!
// @ts-ignore
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
// @ts-ignore
const MP_ACCESS_TOKEN  = Deno.env.get('MP_ACCESS_TOKEN')!

async function createMPPixWithdrawal(params: {
  amount:      number
  pixKey:      string
  pixKeyType:  string
  description: string
  externalRef: string
}): Promise<{ id: string; status: string }> {
  const res = await fetch('https://api.mercadopago.com/v1/disbursements', {
    method:  'POST',
    headers: {
      'Content-Type':      'application/json',
      'Authorization':     `Bearer ${MP_ACCESS_TOKEN}`,
      'X-Idempotency-Key': params.externalRef,
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
  const json = await res.json()
  if (!res.ok) throw new Error(json?.message ?? json?.error ?? `MP HTTP ${res.status}`)
  return json
}

// @ts-ignore — Deno
Deno.serve(async (req) => {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.includes(SERVICE_ROLE_KEY)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: pending, error: listErr } = await admin
    .from('withdrawal_requests')
    .select('id, user_id, amount, fee, net_amount, type, pix_key, pix_key_type, status')
    .eq('status', 'pending')
    .eq('type',   'normal')
    .order('created_at', { ascending: true })
    .limit(500)

  if (listErr) {
    return new Response(JSON.stringify({ error: listErr.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const results = { processed: 0, completed: 0, failed: 0, errors: [] as string[] }

  for (const req of pending ?? []) {
    results.processed++

    // marca como processing
    const { error: lockErr } = await admin
      .from('withdrawal_requests')
      .update({ status: 'processing', updated_at: new Date().toISOString() })
      .eq('id', req.id)
      .eq('status', 'pending')

    if (lockErr) {
      results.errors.push(`${req.id}: lock failed`)
      continue
    }

    try {
      const transfer = await createMPPixWithdrawal({
        amount:      Number(req.net_amount),
        pixKey:      req.pix_key,
        pixKeyType:  req.pix_key_type,
        description: `Saque ${req.type} #${req.id.slice(0, 8)}`,
        externalRef: req.id,
      })

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

      results.completed++
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'unknown'
      console.error('[process-withdrawal]', req.id, msg)

      // Estorna saldo via RPC
      await admin.rpc('reject_withdrawal', {
        p_request_id: req.id,
        p_admin_id:   null,
        p_note:       `Falha automática MP: ${msg}`,
      })

      results.failed++
      results.errors.push(`${req.id}: ${msg}`)
    }
  }

  return new Response(JSON.stringify(results), {
    headers: { 'Content-Type': 'application/json' },
  })
})
// TODO