-- ═══════════════════════════════════════════════════════════
-- TABELA: admin_logs
-- Registra tentativas de bypass do chat e demais eventos
-- sensíveis. Acessível apenas via service_role.
-- ═══════════════════════════════════════════════════════════
create table if not exists public.admin_logs (
  id           uuid primary key default gen_random_uuid(),
  event_type   varchar(60) not null,         -- ex: 'chat_bypass_attempt'
  user_id      uuid references public.profiles(id) on delete set null,
  reference_id uuid,                          -- order_id, message_id, etc.
  payload      jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now()
);

create index if not exists idx_admin_logs_event_user
  on public.admin_logs (event_type, user_id, created_at desc);

create index if not exists idx_admin_logs_reference
  on public.admin_logs (reference_id);

-- RLS: apenas service_role pode ler/escrever
alter table public.admin_logs enable row level security;

-- Sem policies → bloqueia todo acesso anon/authenticated.
-- service_role bypassa RLS automaticamente.
