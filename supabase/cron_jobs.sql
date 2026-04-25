-- ═══════════════════════════════════════════════════════════════════════════════
-- CRON JOBS — GameMarket / KKMarket
-- Execute este snippet no SQL Editor do Supabase Dashboard
-- (Database → SQL Editor → New query → Run)
--
-- Pré-requisito: a extensão pg_cron deve estar habilitada.
-- Habilite em: Database → Extensions → procure "pg_cron" → Enable
--
-- Pré-requisito 2: a extensão pg_net deve estar habilitada (net.http_post).
-- Habilite em: Database → Extensions → procure "pg_net" → Enable
--
-- Substitua as duas variáveis abaixo antes de executar:
--   <PROJECT_REF>       → ID do projeto Supabase (ex: abcdefghijklmnop)
--   <SERVICE_ROLE_KEY>  → chave service_role (Settings → API → Service Role)
--
-- Todos os horários são UTC. Conversões BRT (-3h) indicadas nos comentários.
-- ═══════════════════════════════════════════════════════════════════════════════


-- ── 0. Remover jobs antigos (idempotente) ────────────────────────────────────
-- Permite executar este script múltiplas vezes sem duplicar jobs.
SELECT cron.unschedule('release-escrow-hourly')       WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'release-escrow-hourly');
SELECT cron.unschedule('auto-approve-announcements')  WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'auto-approve-announcements');
SELECT cron.unschedule('expire-points-daily')         WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'expire-points-daily');
SELECT cron.unschedule('process-withdrawal-daily')    WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'process-withdrawal-daily');
SELECT cron.unschedule('cancel-stale-orders-daily')   WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cancel-stale-orders-daily');
SELECT cron.unschedule('restock-sold-out-daily')      WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'restock-sold-out-daily');


-- ── 1. Liberar escrow expirado ───────────────────────────────────────────────
-- Frequência : a cada hora, no minuto 0
-- BRT         : todo horário cheio
-- Função      : release-escrow edge function
-- O que faz   : encontra pedidos in_delivery com escrow_release_at <= now()
--               e move seller_amount para wallet_balance do vendedor;
--               status → completed.
SELECT cron.schedule(
  'release-escrow-hourly',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url     := 'https://<PROJECT_REF>.supabase.co/functions/v1/release-escrow',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer <SERVICE_ROLE_KEY>"}'::jsonb,
    body    := '{}'::jsonb
  )
  $$
);


-- ── 2. Auto-aprovar anúncios ─────────────────────────────────────────────────
-- Frequência : a cada hora, no minuto 5 (desfasado do release-escrow)
-- BRT         : todo horário e 5min
-- Função      : auto-approve-announcements edge function
-- O que faz   : anúncios status='pending' criados há >6h sem termos proibidos
--               são promovidos para 'active', indexados no MeiliSearch,
--               notificação in-app + e-mail via Resend.
SELECT cron.schedule(
  'auto-approve-announcements',
  '5 * * * *',
  $$
  SELECT net.http_post(
    url     := 'https://<PROJECT_REF>.supabase.co/functions/v1/auto-approve-announcements',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer <SERVICE_ROLE_KEY>"}'::jsonb,
    body    := '{}'::jsonb
  )
  $$
);


-- ── 3. Expirar GG Points vencidos ────────────────────────────────────────────
-- Frequência : 1x ao dia às 03:00 UTC (00:00 BRT)
-- Função      : expire-points edge function
-- O que faz   : chama RPC expire_user_points() que agrupa transações com
--               expires_at <= now() por usuário, cria linha 'expire' no
--               histórico e decrementa points_balance em user_stats.
SELECT cron.schedule(
  'expire-points-daily',
  '0 3 * * *',
  $$
  SELECT net.http_post(
    url     := 'https://<PROJECT_REF>.supabase.co/functions/v1/expire-points',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer <SERVICE_ROLE_KEY>"}'::jsonb,
    body    := '{}'::jsonb
  )
  $$
);


-- ── 4. Processar saques normais (PIX) ────────────────────────────────────────
-- Frequência : 1x ao dia às 13:00 UTC (10:00 BRT, horário comercial)
-- Função      : process-withdrawal edge function
-- O que faz   : busca withdrawal_requests status='pending' AND type='normal',
--               dispara transferência PIX via Pagar.me API. Em falha, chama
--               RPC reject_withdrawal para estornar ao wallet_balance.
SELECT cron.schedule(
  'process-withdrawal-daily',
  '0 13 * * *',
  $$
  SELECT net.http_post(
    url     := 'https://<PROJECT_REF>.supabase.co/functions/v1/process-withdrawal',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer <SERVICE_ROLE_KEY>"}'::jsonb,
    body    := '{}'::jsonb
  )
  $$
);


-- ── 5. Cancelar pedidos pendentes de pagamento ───────────────────────────────
-- Frequência : 1x ao dia às 04:00 UTC (01:00 BRT, baixo tráfego)
-- Função      : SQL puro direto (sem edge function necessária)
-- O que faz   : pedidos status='pending_payment' com mais de 24h são
--               cancelados automaticamente com a razão 'Pagamento não
--               confirmado em 24h' e stock_quantity restituído ao anúncio.
SELECT cron.schedule(
  'cancel-stale-orders-daily',
  '0 4 * * *',
  $$
  WITH stale AS (
    SELECT id, announcement_id, announcement_item_id
    FROM public.orders
    WHERE status = 'pending_payment'
      AND created_at < now() - interval '24 hours'
  ),
  cancelled AS (
    UPDATE public.orders
    SET
      status              = 'cancelled',
      cancellation_reason = 'Pagamento não confirmado em 24h — cancelamento automático',
      cancelled_at        = now(),
      updated_at          = now()
    FROM stale
    WHERE public.orders.id = stale.id
    RETURNING public.orders.id, stale.announcement_id, stale.announcement_item_id
  )
  -- Restituir estoque
  UPDATE public.announcements ann
  SET
    stock_quantity = stock_quantity + 1,
    updated_at     = now()
  FROM cancelled c
  WHERE ann.id = c.announcement_id
    AND ann.model = 'normal';
  $$
);


-- ── 6. Reativar anúncios com estoque reposto ─────────────────────────────────
-- Frequência : 1x ao dia às 04:05 UTC (logo após o cancelamento acima)
-- Função      : SQL puro direto
-- O que faz   : anúncios status='sold_out' com stock_quantity > 0
--               (que tiveram estoque reposto por cancelamento, reposição
--               manual ou auto-delivery) voltam para status='active'.
SELECT cron.schedule(
  'restock-sold-out-daily',
  '5 4 * * *',
  $$
  UPDATE public.announcements
  SET
    status     = 'active',
    updated_at = now()
  WHERE status         = 'sold_out'
    AND stock_quantity > 0
    AND model          = 'normal';
  $$
);


-- ── Verificar jobs cadastrados ────────────────────────────────────────────────
-- Execute após o script acima para confirmar que todos foram criados.
SELECT
  jobid,
  jobname,
  schedule,
  command,
  active,
  username
FROM cron.job
WHERE jobname IN (
  'release-escrow-hourly',
  'auto-approve-announcements',
  'expire-points-daily',
  'process-withdrawal-daily',
  'cancel-stale-orders-daily',
  'restock-sold-out-daily'
)
ORDER BY jobname;
