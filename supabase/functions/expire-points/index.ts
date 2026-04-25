/**
 * Supabase Edge Function: expire-points
 *
 * Runs daily via pg_cron. Calls expire_user_points() RPC which atomically
 * creates expiry transactions and decrements balances.
 *
 * Deploy: supabase functions deploy expire-points
 * Cron:   SELECT cron.schedule('expire-points-daily', '0 3 * * *',
 *           $$SELECT net.http_post(
 *             url := 'https://<project>.supabase.co/functions/v1/expire-points',
 *             headers := '{"Authorization": "Bearer <service_role_key>"}'::jsonb
 *           )$$);
 */

// @ts-ignore — Deno edge runtime
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL     = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

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

  try {
    // Call the atomic SQL RPC that handles all expiry in one transaction
    const { data: processed, error } = await admin.rpc('expire_user_points')

    if (error) {
      console.error('[expire-points] RPC error:', error.message)
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    console.log(`[expire-points] Processed ${processed} users with expired points`)
    return new Response(JSON.stringify({ ok: true, usersProcessed: processed }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('[expire-points] Unexpected error:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
