CREATE OR REPLACE FUNCTION public.decrement_stock(
  p_announcement_id uuid,
  p_item_id uuid DEFAULT NULL,
  p_quantity int DEFAULT 1
) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $decrement_stock$
BEGIN
  IF p_item_id IS NOT NULL THEN
    UPDATE announcement_items
       SET stock_quantity = stock_quantity - p_quantity, updated_at = now()
     WHERE id = p_item_id
       AND announcement_id = p_announcement_id
       AND stock_quantity >= p_quantity
       AND status = 'active';
  ELSE
    UPDATE announcements
       SET stock_quantity = stock_quantity - p_quantity, updated_at = now()
     WHERE id = p_announcement_id
       AND stock_quantity >= p_quantity
       AND status = 'active';
  END IF;
  RETURN FOUND;
END;
$decrement_stock$;
