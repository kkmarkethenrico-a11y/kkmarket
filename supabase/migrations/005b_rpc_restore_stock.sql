CREATE OR REPLACE FUNCTION public.restore_stock(
  p_announcement_id uuid,
  p_item_id uuid DEFAULT NULL,
  p_quantity int DEFAULT 1
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $restore_stock$
BEGIN
  IF p_item_id IS NOT NULL THEN
    UPDATE announcement_items
       SET stock_quantity = stock_quantity + p_quantity, updated_at = now()
     WHERE id = p_item_id AND announcement_id = p_announcement_id;
  ELSE
    UPDATE announcements
       SET stock_quantity = stock_quantity + p_quantity, updated_at = now()
     WHERE id = p_announcement_id;
  END IF;
END;
$restore_stock$;
