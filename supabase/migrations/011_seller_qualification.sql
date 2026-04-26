-- ═══════════════════════════════════════════════════════════
-- 011 — Seller Qualification
-- Objetivo: contas iniciam como compradores; vendedores precisam
-- enviar documentos e ser aprovados pelo admin antes de anunciar.
-- ═══════════════════════════════════════════════════════════

-- Status da qualificação para vendedor
do $$
begin
  if not exists (select 1 from pg_type where typname = 'seller_status') then
    create type seller_status as enum ('disabled', 'pending', 'approved', 'rejected');
  end if;
end$$;

-- Coluna em profiles
alter table public.profiles
  add column if not exists seller_status seller_status not null default 'disabled';

alter table public.profiles
  add column if not exists seller_applied_at timestamptz;

alter table public.profiles
  add column if not exists seller_approved_at timestamptz;

alter table public.profiles
  add column if not exists seller_rejection_reason text;

create index if not exists idx_profiles_seller_status on public.profiles(seller_status);

-- ─── Função: usuário aplicar para vendedor ─────────────────────────────────
create or replace function public.apply_to_sell(
  p_identity_front_url text,
  p_identity_back_url  text,
  p_selfie_url         text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'Não autenticado';
  end if;

  -- Bloquear re-aplicação se já aprovado ou pendente
  if exists (
    select 1 from profiles
    where id = v_user and seller_status in ('approved', 'pending')
  ) then
    raise exception 'Já existe uma solicitação ativa.';
  end if;

  -- Insere/atualiza documentos KYC
  insert into user_validations(user_id, type, status, file_url)
  values
    (v_user, 'identity_front', 'pending', p_identity_front_url),
    (v_user, 'identity_back',  'pending', p_identity_back_url),
    (v_user, 'selfie',         'pending', p_selfie_url)
  on conflict (user_id, type) do update
    set file_url       = excluded.file_url,
        status         = 'pending',
        rejection_note = null,
        verified_at    = null,
        updated_at     = now();

  -- Marca profile como aplicado
  update profiles
    set seller_status        = 'pending',
        seller_applied_at    = now(),
        seller_rejection_reason = null,
        updated_at           = now()
    where id = v_user;
end;
$$;

revoke all on function public.apply_to_sell(text, text, text) from public;
grant execute on function public.apply_to_sell(text, text, text) to authenticated;

-- ─── Função admin: aprovar/rejeitar ─────────────────────────────────────────
create or replace function public.decide_seller_application(
  p_user_id   uuid,
  p_decision  text,        -- 'approve' | 'reject'
  p_reason    text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin uuid := auth.uid();
  v_role  user_role;
begin
  if v_admin is null then
    raise exception 'Não autenticado';
  end if;

  select role into v_role from profiles where id = v_admin;
  if v_role not in ('admin', 'moderator') then
    raise exception 'Apenas admin/moderator pode decidir';
  end if;

  if p_decision = 'approve' then
    update profiles
      set seller_status            = 'approved',
          seller_approved_at       = now(),
          seller_rejection_reason  = null,
          updated_at               = now()
      where id = p_user_id;

    update user_validations
      set status      = 'verified',
          verified_at = now(),
          updated_at  = now()
      where user_id = p_user_id
        and type in ('identity_front', 'identity_back', 'selfie');

  elsif p_decision = 'reject' then
    update profiles
      set seller_status           = 'rejected',
          seller_rejection_reason = p_reason,
          updated_at              = now()
      where id = p_user_id;

    update user_validations
      set status         = 'rejected',
          rejection_note = p_reason,
          updated_at     = now()
      where user_id = p_user_id
        and type in ('identity_front', 'identity_back', 'selfie');
  else
    raise exception 'p_decision deve ser approve ou reject';
  end if;
end;
$$;

revoke all on function public.decide_seller_application(uuid, text, text) from public;
grant execute on function public.decide_seller_application(uuid, text, text) to authenticated;
