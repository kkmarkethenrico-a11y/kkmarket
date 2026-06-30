-- Migration 018: Credit 50 welcome points on account creation
--
-- Updates the handle_new_user trigger function to insert 50 points into user_stats
-- and log the transaction in points_transactions.

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

  -- Create user stats with 50 points initially
  INSERT INTO public.user_stats (
    user_id,
    points_balance
  ) VALUES (
    new.id,
    50
  );

  -- Add the welcome points transaction (expires in 180 days by default)
  INSERT INTO public.points_transactions (
    user_id,
    type,
    amount,
    expires_at,
    description
  ) VALUES (
    new.id,
    'event',
    50,
    now() + interval '180 days',
    'Bônus de boas-vindas'
  );

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
