-- Migration 017: Guided platform tour (first access)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS platform_tour_completed_at timestamptz;

COMMENT ON COLUMN public.profiles.platform_tour_completed_at IS
  'Timestamp when the user completed or skipped the guided platform tour. NULL = not seen yet.';
