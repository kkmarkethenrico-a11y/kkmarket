-- 014_rename_pagarme_to_mp.sql
-- Migração de Pagar.me → Mercado Pago.
-- Renomeia pagarme_order_id → mp_payment_id e remove pagarme_charge_id
-- (no MP a referência da cobrança é o próprio payment.id).

ALTER TABLE public.orders
  RENAME COLUMN pagarme_order_id TO mp_payment_id;

ALTER TABLE public.orders
  DROP COLUMN IF EXISTS pagarme_charge_id;
