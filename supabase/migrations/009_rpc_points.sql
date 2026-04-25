-- Migration 009: RPC functions for GG Points (atomic credit + debit)
-- Run via: supabase db push

-- ─── credit_points ─────────────────────────────────────────────────────────
-- Atomically insert a positive points_transaction and increment points_balance.
create or replace function public.credit_points(
  p_user_id      uuid,
  p_amount       int,
  p_type         points_transaction_type,
  p_expires_at   timestamptz,
  p_reference_id uuid    default null,
  p_description  varchar(300) default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_amount <= 0 then
    raise exception 'p_amount must be positive';
  end if;

  insert into public.points_transactions
    (user_id, type, amount, expires_at, reference_id, description)
  values
    (p_user_id, p_type, p_amount, p_expires_at, p_reference_id, p_description);

  insert into public.user_stats (user_id, points_balance)
  values (p_user_id, p_amount)
  on conflict (user_id) do update
    set points_balance = user_stats.points_balance + p_amount,
        updated_at     = now();
end;
$$;

-- ─── debit_points ──────────────────────────────────────────────────────────
-- Atomically insert a negative points_transaction (FIFO debit) and decrement
-- points_balance. Returns TRUE on success, FALSE if balance insufficient.
create or replace function public.debit_points(
  p_user_id      uuid,
  p_amount       int,
  p_type         points_transaction_type,
  p_reference_id uuid    default null,
  p_description  varchar(300) default null
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance int;
begin
  -- Lock the row to prevent concurrent over-spend
  select points_balance
    into v_balance
  from public.user_stats
  where user_id = p_user_id
  for update;

  if v_balance is null or v_balance < p_amount then
    return false;
  end if;

  insert into public.points_transactions
    (user_id, type, amount, expires_at, reference_id, description)
  values
    (p_user_id, p_type, -p_amount, null, p_reference_id, p_description);

  update public.user_stats
    set points_balance = points_balance - p_amount,
        updated_at     = now()
  where user_id = p_user_id;

  return true;
end;
$$;

-- ─── expire_user_points ────────────────────────────────────────────────────
-- Called by the expire-points edge function. Marks all expired positive
-- transactions with a matching 'expire' entry and decrements the balance.
-- Returns number of users processed.
create or replace function public.expire_user_points()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  r              record;
  v_total_expired int;
  v_processed     int := 0;
begin
  for r in
    select
      user_id,
      sum(amount) as expired_amount
    from public.points_transactions
    where
      expires_at <= now()
      and amount > 0
      and type != 'expire'
      -- exclude if an 'expire' row already exists for those transactions
      and not exists (
        select 1 from public.points_transactions e
        where e.user_id = points_transactions.user_id
          and e.type = 'expire'
          and e.reference_id = points_transactions.id
      )
    group by user_id
  loop
    v_total_expired := r.expired_amount;

    -- Cap at current balance (can't expire more than held)
    declare
      v_balance int;
    begin
      select points_balance into v_balance
      from public.user_stats
      where user_id = r.user_id
      for update;

      v_total_expired := least(v_total_expired, coalesce(v_balance, 0));

      if v_total_expired > 0 then
        insert into public.points_transactions
          (user_id, type, amount, expires_at, description)
        values
          (r.user_id, 'expire', -v_total_expired, null, 'Pontos expirados automaticamente');

        update public.user_stats
          set points_balance = greatest(0, points_balance - v_total_expired),
              updated_at     = now()
        where user_id = r.user_id;

        v_processed := v_processed + 1;
      end if;
    end;
  end loop;

  return v_processed;
end;
$$;

-- RLS: service_role bypasses RLS, so no additional policies needed for RPC calls.
