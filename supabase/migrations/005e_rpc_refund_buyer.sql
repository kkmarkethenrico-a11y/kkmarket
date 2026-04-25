CREATE OR REPLACE FUNCTION public.refund_buyer(
  p_order_id uuid,
  p_buyer_id uuid,
  p_amount numeric,
  p_description text DEFAULT 'Reembolso de compra'
) RETURNS uuid
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  WITH update_balance AS (
    UPDATE user_stats
       SET wallet_balance = wallet_balance + p_amount,
           updated_at = now()
     WHERE user_id = p_buyer_id
    RETURNING wallet_balance
  )
  INSERT INTO wallet_transactions
    (user_id, type, amount, balance_after, reference_id, description)
  VALUES
    (p_buyer_id, 'refund', p_amount, (SELECT wallet_balance FROM update_balance), p_order_id, p_description)
  RETURNING id;
$$;
