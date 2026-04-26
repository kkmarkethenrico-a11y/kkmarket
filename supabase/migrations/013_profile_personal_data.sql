-- ═══════════════════════════════════════════════════════════
-- 013 — Profile personal data
-- Adiciona campos pessoais (nome, CPF, telefone, data de nascimento)
-- usados em checkout, KYC e identificação fiscal.
-- ═══════════════════════════════════════════════════════════

alter table public.profiles
  add column if not exists full_name  varchar(120),
  add column if not exists cpf        varchar(14),     -- "000.000.000-00" (com máscara) ou apenas dígitos
  add column if not exists phone      varchar(20),
  add column if not exists birth_date date;

-- CPF deve ser único quando preenchido
create unique index if not exists ux_profiles_cpf
  on public.profiles(cpf)
  where cpf is not null;

-- Validação leve em CPF: 11 dígitos (após remover máscara)
alter table public.profiles
  drop constraint if exists chk_profiles_cpf_digits;

alter table public.profiles
  add constraint chk_profiles_cpf_digits
    check (cpf is null or length(regexp_replace(cpf, '\D', '', 'g')) = 11);
