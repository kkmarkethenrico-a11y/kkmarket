-- Migration 015: Seller Ranking
-- Adiciona coluna de score de reputação e view pública de ranking.
--
-- Fórmula de score (0-100):
--   Quando total_reviews >= 3:
--     score = round( (positive * 100 + neutral * 50) / total_reviews )
--   Caso contrário: NULL (vendedor não aparece no ranking principal)
--
-- A view seller_ranking expõe apenas usuários com seller_status='approved'
-- e pelo menos 3 avaliações recebidas, ordenados por score + total_sales.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Coluna de score calculado em user_stats
ALTER TABLE public.user_stats
  ADD COLUMN IF NOT EXISTS reputation_score numeric(5,2) GENERATED ALWAYS AS (
    CASE
      WHEN (reviews_positive + reviews_neutral + reviews_negative) >= 3
      THEN ROUND(
        (
          (reviews_positive::numeric * 100 + reviews_neutral::numeric * 50)
          /
          NULLIF(reviews_positive + reviews_neutral + reviews_negative, 0)
        )::numeric, 2
      )
      ELSE NULL
    END
  ) STORED;

-- 2. Índice para queries de ranking
CREATE INDEX IF NOT EXISTS idx_user_stats_reputation_score
  ON public.user_stats (reputation_score DESC NULLS LAST)
  WHERE reputation_score IS NOT NULL;

-- 3. View pública de ranking de vendedores
CREATE OR REPLACE VIEW public.seller_ranking AS
SELECT
  p.id            AS user_id,
  p.username,
  p.display_name,
  p.avatar_url,
  p.is_vip,
  us.total_sales,
  us.reviews_positive,
  us.reviews_neutral,
  us.reviews_negative,
  us.reviews_positive + us.reviews_neutral + us.reviews_negative AS total_reviews,
  us.reputation_score,
  us.avg_response_time_minutes,
  ROW_NUMBER() OVER (
    ORDER BY us.reputation_score DESC NULLS LAST, us.total_sales DESC
  ) AS rank
FROM public.profiles p
JOIN public.user_stats us ON us.user_id = p.id
WHERE
  p.status        = 'active'
  AND p.seller_status = 'approved'
  AND us.reputation_score IS NOT NULL;

-- RLS: a view herda RLS das tabelas base; expor como SECURITY DEFINER não é necessário.
-- Acesso público via anon key é suficiente (dados não sensíveis).
GRANT SELECT ON public.seller_ranking TO anon, authenticated;
