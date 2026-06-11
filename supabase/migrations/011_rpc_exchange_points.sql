-- Migration 011: RPC function to exchange GG Points for Wallet Balance
-- Atomically debits points and credits wallet balance as a 'bonus' transaction.

create or replace function public.exchange_points_to_wallet(
  p_user_id      uuid,
  p_points       int,
  p_exchange_rate numeric -- ex: 100 points = 1 BRL
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_points_balance int;
  v_wallet_balance numeric(10,2);
  v_amount_brl     numeric(10,2);
begin
  if p_points <= 0 then
    return false;
  end if;

  -- 1. Lock user_stats to prevent concurrent operations
  select points_balance, wallet_balance
    into v_points_balance, v_wallet_balance
  from public.user_stats
  where user_id = p_user_id
  for update;

  if v_points_balance is null or v_points_balance < p_points then
    return false;
  end if;

  v_amount_brl := round((p_points / p_exchange_rate)::numeric, 2);

  if v_amount_brl <= 0 then
    return false;
  end if;

  -- 2. Deduct points
  insert into public.points_transactions
    (user_id, type, amount, expires_at, description)
  values
    (p_user_id, 'redeem', -p_points, null, 'Conversão de Pontos GG para Saldo na Carteira');

  -- 3. Credit wallet
  insert into public.wallet_transactions
    (user_id, type, amount, balance_after, description)
  values
    (p_user_id, 'bonus', v_amount_brl, v_wallet_balance + v_amount_brl, 'Conversão de Pontos GG para Saldo na Carteira');

  -- 4. Update user_stats
  update public.user_stats
    set points_balance = points_balance - p_points,
        wallet_balance = wallet_balance + v_amount_brl,
        updated_at     = now()
  where user_id = p_user_id;

  return true;
end;
$$;
