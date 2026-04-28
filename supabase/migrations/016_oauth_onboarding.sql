-- Migration 016: OAuth onboarding + trigger sanitization
--
-- Problema: usuários que entram via Google/Discord têm username
-- gerado automaticamente com caracteres inválidos (pontos, hífens etc.)
-- e podem não ter um nome de usuário adequado.
--
-- Solução:
--   1. Adiciona coluna onboarding_complete (false = usuário OAuth novo).
--   2. Refaz handle_new_user com sanitização robusta de username e
--      lógica de deduplicação por sufixo numérico.
--   3. Usuários OAuth são redirecionados para /completar-perfil
--      até escolherem um username definitivo (feito no callback Next.js).
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Adiciona flag de onboarding
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_complete boolean NOT NULL DEFAULT true;

-- Perfis já existentes estão completos
UPDATE public.profiles SET onboarding_complete = true;

-- 2. Trigger aprimorado com sanitização e deduplicação
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_base      TEXT;
  v_username  TEXT;
  v_counter   INT := 0;
  v_provider  TEXT;
BEGIN
  -- Sanitiza: mantém apenas a-z, 0-9, _ (substitui o resto por _)
  -- e converte para minúsculas
  v_base := lower(
    regexp_replace(
      split_part(new.email, '@', 1),
      '[^a-z0-9_]', '_', 'g'
    )
  );

  -- Remove underscores repetidos e leading/trailing underscores
  v_base := trim('_' FROM regexp_replace(v_base, '_+', '_', 'g'));

  -- Garante tamanho mínimo e máximo (deixa 8 chars livres para sufixo numérico)
  IF length(v_base) < 3 THEN v_base := 'user'; END IF;
  v_base := substring(v_base, 1, 22);

  v_username := v_base;

  -- Deduplicação: acrescenta sufixo _N se já existe
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = v_username) LOOP
    v_counter := v_counter + 1;
    v_username := v_base || '_' || v_counter::text;
  END LOOP;

  -- Detecta se é OAuth (provider != 'email') para marcar onboarding pendente
  v_provider := COALESCE(new.raw_app_meta_data->>'provider', 'email');

  INSERT INTO public.profiles (
    id, username, display_name, avatar_url, onboarding_complete
  ) VALUES (
    new.id,
    v_username,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url',
    v_provider = 'email'   -- false para Google/Discord → precisa completar perfil
  );

  INSERT INTO public.user_stats (user_id) VALUES (new.id);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
