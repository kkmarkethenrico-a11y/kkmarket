-- ═══════════════════════════════════════════════════════════════════════════
-- RPC: deliver_auto_delivery
--
-- Reserva atomicamente UM item de auto_delivery_items para um pedido,
-- evitando double-spending mesmo sob concorrência (FOR UPDATE SKIP LOCKED).
-- Devolve { item_id, encrypted_payload, sold_out } ou NULL se sem estoque.
--
-- A descriptografia acontece no Route Handler / webhook (Node.js).
-- O insert da mensagem em order_messages e a marcação 'sold_out' em
-- announcements são feitos aqui dentro da MESMA transação.
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.deliver_auto_delivery(
  p_order_id        uuid,
  p_announcement_id uuid,
  p_item_id         uuid default null
)
returns table (
  item_id            uuid,
  encrypted_payload  text,
  sold_out           boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item_id   uuid;
  v_payload   text;
  v_remaining int;
begin
  -- 1. Reserva 1 item disponível (lock pessimista, pula linhas já travadas)
  if p_item_id is not null then
    select id, payload
      into v_item_id, v_payload
      from auto_delivery_items
     where announcement_id = p_announcement_id
       and item_id         = p_item_id
       and is_delivered    = false
     order by created_at asc
     limit 1
       for update skip locked;
  else
    select id, payload
      into v_item_id, v_payload
      from auto_delivery_items
     where announcement_id = p_announcement_id
       and is_delivered    = false
     order by created_at asc
     limit 1
       for update skip locked;
  end if;

  -- Sem estoque disponível: devolve NULL
  if v_item_id is null then
    return;
  end if;

  -- 2. Marca como entregue
  update auto_delivery_items
     set is_delivered = true,
         order_id     = p_order_id
   where id = v_item_id;

  -- 3. Conta itens restantes para indicar sold_out
  select count(*)
    into v_remaining
    from auto_delivery_items
   where announcement_id = p_announcement_id
     and is_delivered    = false;

  if v_remaining = 0 then
    update announcements
       set status     = 'sold_out',
           updated_at = now()
     where id = p_announcement_id;
  end if;

  -- 4. Devolve o item reservado (criptografado) + flag sold_out
  return query
    select v_item_id, v_payload, (v_remaining = 0);
end;
$$;

-- Permissões: apenas service_role chama este RPC.
revoke all on function public.deliver_auto_delivery(uuid, uuid, uuid) from public;
revoke all on function public.deliver_auto_delivery(uuid, uuid, uuid) from anon, authenticated;
grant execute on function public.deliver_auto_delivery(uuid, uuid, uuid) to service_role;
