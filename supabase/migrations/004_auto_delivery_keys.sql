-- =========================================================================
-- MIGRATION: 004_auto_delivery_keys.sql
-- Objetivo: Cria tabela segura para armazenar chaves e credenciais de entrega automática
-- =========================================================================

create table public.announcement_keys (
  id               uuid primary key default gen_random_uuid(),
  announcement_id  uuid not null references public.announcements(id) on delete cascade,
  item_id          uuid references public.announcement_items(id) on delete cascade,
  key_content      text not null,
  is_used          boolean not null default false,
  order_id         uuid references public.orders(id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table public.announcement_keys enable row level security;

-- Somente o próprio vendedor do anúncio pode inserir/ver/editar suas próprias chaves
create policy "Seller can manage keys" on public.announcement_keys
  for all using (
    exists (
      select 1 from public.announcements a
      where a.id = announcement_id and a.user_id = auth.uid()
    )
  );

-- Função de consumo (para ser chamada via supabase.rpc na API de Webhook)
-- O FOR UPDATE SKIP LOCKED evita race conditions (duas pessoas recebendo a mesma chave)
create or replace function public.consume_auto_delivery_key(
  p_announcement_id uuid,
  p_item_id uuid,
  p_order_id uuid
)
returns text
language plpgsql security definer
as $$
declare
  v_key text;
begin
  update public.announcement_keys
  set is_used = true, order_id = p_order_id, updated_at = now()
  where id = (
    select id from public.announcement_keys
    where announcement_id = p_announcement_id
      and (p_item_id is null or item_id = p_item_id)
      and is_used = false
    limit 1
    for update skip locked
  )
  returning key_content into v_key;

  -- Retorna nulo se não achar mais nenhuma disponível
  return v_key;
end;
$$;
