CREATE OR REPLACE FUNCTION public.lock_seller_balance(
  p_order_id uuid,
  p_seller_id uuid,
  p_amount numeric,
  p_description text DEFAULT 'Receita de venda (em escrow)'
) RETURNS uuid
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  INSERT INTO wallet_transactions
    (user_id, type, amount, balance_after, reference_id, description)
  SELECT
    p_seller_id,
    'order_revenue',
    p_amount,
    COALESCE(us.wallet_balance, 0),
    p_order_id,
    p_description
  FROM user_stats us
  WHERE us.user_id = p_seller_id
  RETURNING id;
$$;
