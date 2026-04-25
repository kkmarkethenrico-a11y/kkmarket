/**
 * Supabase Edge Function: process-withdrawal
 *
 * Roda 1x ao dia (10h America/Sao_Paulo) via pg_cron. Busca todos os
 * withdrawal_requests com status='pending' AND type='normal' e dispara
 * a transferência PIX na Pagar.me.
 *
 * Em caso de falha, o valor é estornado para o saldo (RPC reject_withdrawal).
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
const PAGARME_API_KEY  = Deno.env.get('PAGARME_API_KEY')!

const PAGARME_BASE = 'https://api.pagar.me/core/v5'

function pagarmeHeaders(): HeadersInit {
  // @ts-ignore — Deno polyfill
  const encoded = btoa(`${PAGARME_API_KEY}:`)
  return {
    'Content-Type': 'application/json',
    Authorization:  `Basic ${encoded}`,
  }
}

async function createPixTransfer(params: {
  amountCents: number
  pixKey:      string
  pixKeyType:  string
  description: string
  metadata:    Record<string, string>
}): Promise<{ id: string; status: string }> {
  const res = await fetch(`${PAGARME_BASE}/transfers`, {
    method:  'POST',
    headers: pagarmeHeaders(),
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
  if (!res.ok) throw new Error(json?.message ?? `Pagar.me ${res.status}`)
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
      const transfer = await createPixTransfer({
        amountCents: Math.round(Number(req.net_amount) * 100),
        pixKey:      req.pix_key,
        pixKeyType:  req.pix_key_type,
        description: `Saque ${req.type} #${req.id.slice(0, 8)}`,
        metadata:    {
          user_id:       req.user_id,
          withdrawal_id: req.id,
          type:          req.type,
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
        .eq('id', req.id)

      await admin.from('notifications').insert({
        user_id: req.user_id,
        type:    'withdrawal_approved',
        title:   'Saque aprovado',
        message: `Seu saque de R$ ${Number(req.net_amount).toFixed(2)} foi processado com sucesso.`,
        data:    { withdrawal_id: req.id, pagarme_id: transfer.id },
      })

      results.completed++
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'unknown'
      console.error('[process-withdrawal]', req.id, msg)

      // Estorna saldo via RPC
      await admin.rpc('reject_withdrawal', {
        p_request_id: req.id,
        p_admin_id:   null,
        p_note:       `Falha automática: ${msg}`,
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