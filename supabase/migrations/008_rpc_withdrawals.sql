-- ═══════════════════════════════════════════════════════════════════════════
-- 008 — RPC request_withdrawal
--
-- Solicita um saque de forma ATÔMICA:
--   1. Lock pessimista no user_stats (FOR UPDATE)
--   2. Valida saldo suficiente
--   3. Cria withdrawal_requests (status='pending')
--   4. Cria wallet_transactions negativa (type='withdrawal', amount=-X)
--   5. Atualiza user_stats.wallet_balance
--
-- Retorna a linha criada de withdrawal_requests.
-- security definer: granted apenas para service_role.
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.request_withdrawal(
  p_user_id        uuid,
  p_amount         numeric,
  p_fee            numeric,
  p_type           withdrawal_type,
  p_pix_key        text,
  p_pix_key_type   text
)
returns table (
  id           uuid,
  amount       numeric,
  fee          numeric,
  net_amount   numeric,
  type         withdrawal_type,
  status       withdrawal_status,
  pix_key      varchar(150),
  pix_key_type varchar(20),
  created_at   timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance     numeric;
  v_net         numeric;
  v_new_balance numeric;
  v_request_id  uuid;
begin
  if p_amount <= 0 then
    raise exception 'invalid_amount' using errcode = 'P0001';
  end if;

  v_net := p_amount - p_fee;

  -- Lock o stats do usuário
  select wallet_balance into v_balance
    from public.user_stats
    where user_id = p_user_id
    for update;

  if v_balance is null then
    raise exception 'user_stats_not_found' using errcode = 'P0002';
  end if;

  if v_balance < p_amount then
    raise exception 'insufficient_balance' using errcode = 'P0003';
  end if;

  v_new_balance := v_balance - p_amount;

  -- Cria a solicitação
  insert into public.withdrawal_requests (
    user_id, amount, type, fee, net_amount,
    pix_key, pix_key_type, status
  )
  values (
    p_user_id, p_amount, p_type, p_fee, v_net,
    p_pix_key, p_pix_key_type, 'pending'
  )
  returning withdrawal_requests.id into v_request_id;

  -- Debita saldo IMEDIATAMENTE (não esperamos processamento)
  insert into public.wallet_transactions (
    user_id, type, amount, balance_after, reference_id, description
  )
  values (
    p_user_id, 'withdrawal', -p_amount, v_new_balance, v_request_id,
    'Solicitação de saque #' || substring(v_request_id::text, 1, 8)
  );

  update public.user_stats
    set wallet_balance = v_new_balance,
        updated_at     = now()
    where user_id = p_user_id;

  return query
    select wr.id, wr.amount, wr.fee, wr.net_amount, wr.type, wr.status,
           wr.pix_key, wr.pix_key_type, wr.created_at
    from public.withdrawal_requests wr
    where wr.id = v_request_id;
end;
$$;

revoke all on function public.request_withdrawal(uuid, numeric, numeric, withdrawal_type, text, text) from public, anon, authenticated;
grant execute on function public.request_withdrawal(uuid, numeric, numeric, withdrawal_type, text, text) to service_role;


-- ═══════════════════════════════════════════════════════════════════════════
-- RPC reject_withdrawal: devolve o valor ao saldo do usuário
-- ═══════════════════════════════════════════════════════════════════════════
create or replace function public.reject_withdrawal(
  p_request_id uuid,
  p_admin_id   uuid,
  p_note       text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id    uuid;
  v_amount     numeric;
  v_status     withdrawal_status;
  v_balance    numeric;
  v_new_balance numeric;
begin
  select user_id, amount, status
    into v_user_id, v_amount, v_status
    from public.withdrawal_requests
    where id = p_request_id
    for update;

  if v_user_id is null then
    raise exception 'withdrawal_not_found' using errcode = 'P0004';
  end if;

  if v_status not in ('pending', 'processing') then
    raise exception 'invalid_status' using errcode = 'P0005';
  end if;

  -- Devolve o saldo
  select wallet_balance into v_balance
    from public.user_stats where user_id = v_user_id for update;

  v_new_balance := coalesce(v_balance, 0) + v_amount;

  insert into public.wallet_transactions (
    user_id, type, amount, balance_after, reference_id, description
  )
  values (
    v_user_id, 'refund', v_amount, v_new_balance, p_request_id,
    'Estorno de saque rejeitado: ' || coalesce(p_note, '')
  );

  update public.user_stats
    set wallet_balance = v_new_balance, updated_at = now()
    where user_id = v_user_id;

  update public.withdrawal_requests
    set status         = 'rejected',
        rejection_note = p_note,
        processed_at   = now(),
        processed_by   = p_admin_id,
        updated_at     = now()
    where id = p_request_id;

  insert into public.notifications (user_id, type, title, message, data)
  values (
    v_user_id, 'withdrawal_rejected',
    'Saque rejeitado',
    'Sua solicitação de saque foi rejeitada e o valor foi devolvido ao saldo. Motivo: ' || coalesce(p_note, 'não informado'),
    jsonb_build_object('withdrawal_id', p_request_id)
  );
end;
$$;

revoke all on function public.reject_withdrawal(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.reject_withdrawal(uuid, uuid, text) to service_role;
