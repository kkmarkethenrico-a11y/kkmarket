-- ═══════════════════════════════════════════════════════════
-- EXTENSÕES
-- ═══════════════════════════════════════════════════════════
create extension if not exists "pgcrypto";
create extension if not exists "unaccent";

-- ═══════════════════════════════════════════════════════════
-- ENUMS
-- ═══════════════════════════════════════════════════════════
create type user_status as enum ('active', 'suspended', 'banned');
create type user_role as enum ('client', 'moderator', 'admin');
create type validation_type as enum ('email', 'phone', 'identity_front', 'identity_back', 'residence', 'selfie');
create type validation_status as enum ('pending', 'verified', 'rejected');
create type announcement_model as enum ('normal', 'dynamic');
create type announcement_plan as enum ('silver', 'gold', 'diamond');
create type announcement_status as enum ('pending', 'active', 'paused', 'rejected', 'sold_out', 'deleted');
create type item_status as enum ('active', 'sold', 'reserved', 'deleted');
create type order_status as enum ('pending_payment', 'paid', 'in_delivery', 'delivered', 'disputed', 'refunded', 'cancelled', 'completed');
create type payment_method as enum ('pix', 'credit_card', 'boleto', 'wallet_balance', 'points');
create type review_type as enum ('positive', 'neutral', 'negative');
create type review_role as enum ('buyer', 'seller');
create type withdrawal_type as enum ('normal', 'turbo');
create type withdrawal_status as enum ('pending', 'processing', 'completed', 'rejected');
create type transaction_type as enum ('order_payment', 'order_revenue', 'withdrawal', 'refund', 'bonus', 'fee');
create type points_transaction_type as enum ('purchase_earn', 'sale_earn', 'coupon', 'event', 'loyalty', 'redeem', 'expire');
create type report_target as enum ('announcement', 'user', 'comment', 'review');
create type report_status as enum ('pending', 'accepted', 'rejected');
create type notification_type as enum ('order_new', 'order_paid', 'order_delivered', 'order_completed', 'order_disputed', 'payment_released', 'withdrawal_approved', 'withdrawal_rejected', 'announcement_approved', 'announcement_rejected', 'review_received', 'message_received', 'system');

-- ═══════════════════════════════════════════════════════════
-- TABELA: profiles
-- Objetivo: Extensão da tabela de usuários (auth.users do supabase) com informações públicas e regras do GameMarket.
-- ═══════════════════════════════════════════════════════════
create table public.profiles (
  id             uuid primary key references auth.users(id) on delete cascade,
  username       varchar(30) unique not null,
  display_name   varchar(60),
  avatar_url     text,
  bio            varchar(300),
  role           user_role not null default 'client',
  status         user_status not null default 'active',
  is_vip         boolean not null default false,
  ban_reason     text,
  last_seen_at   timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ═══════════════════════════════════════════════════════════
-- TABELA: user_validations
-- Objetivo: Registro e status da documentação fornecida pelo usuário (KYC - Know Your Customer).
-- ═══════════════════════════════════════════════════════════
create table public.user_validations (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  type           validation_type not null,
  status         validation_status not null default 'pending',
  file_url       text,
  rejection_note text,
  verified_at    timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique(user_id, type)
);

-- ═══════════════════════════════════════════════════════════
-- TABELA: user_stats
-- Objetivo: Cache de métricas do usuário como saldo da carteira, reputação, e histórico resumido.
-- ═══════════════════════════════════════════════════════════
create table public.user_stats (
  user_id                   uuid primary key references public.profiles(id) on delete cascade,
  total_sales               int not null default 0,
  total_purchases           int not null default 0,
  reviews_positive          int not null default 0,
  reviews_neutral           int not null default 0,
  reviews_negative          int not null default 0,
  avg_response_time_minutes int,
  wallet_balance            numeric(10,2) not null default 0,
  points_balance            int not null default 0,
  updated_at                timestamptz not null default now()
);

-- ═══════════════════════════════════════════════════════════
-- TABELA: categories
-- Objetivo: Categorias em árvore (com auto-relacionamento parent_id) para os produtos do marketplace.
-- ═══════════════════════════════════════════════════════════
create table public.categories (
  id                    uuid primary key default gen_random_uuid(),
  parent_id             uuid references public.categories(id) on delete set null,
  name                  varchar(100) not null,
  slug                  varchar(120) unique not null,
  description           text,
  image_url             text,
  icon                  varchar(50),
  sort_order            int not null default 0,
  is_featured           boolean not null default false,
  show_in_menu          boolean not null default true,
  balance_release_days  int not null default 4,
  seo_title             varchar(120),
  seo_description       varchar(300),
  custom_filters        jsonb,
  status                boolean not null default true,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- ═══════════════════════════════════════════════════════════
-- TABELA: announcements
-- Objetivo: Agrupa os dados principais dos anúncios cadastrados pelos usuários e seu status no fluxo de moderação.
-- ═══════════════════════════════════════════════════════════
create table public.announcements (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references public.profiles(id) on delete cascade,
  category_id          uuid not null references public.categories(id),
  title                varchar(120) not null,
  slug                 varchar(150) unique not null,
  description          text not null,
  model                announcement_model not null default 'normal',
  plan                 announcement_plan not null default 'silver',
  unit_price           numeric(10,2),    -- null se model=dynamic
  stock_quantity       int,              -- null se model=dynamic
  has_auto_delivery    boolean not null default false,
  is_vip               boolean not null default false,
  filters_data         jsonb,
  sale_count           int not null default 0,
  view_count           int not null default 0,
  status               announcement_status not null default 'pending',
  rejection_reason     text,
  approved_at          timestamptz,
  approved_by          uuid references public.profiles(id),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- ═══════════════════════════════════════════════════════════
-- TABELA: announcement_items
-- Objetivo: Variações de preço de um anúncio que utiliza o 'model = dynamic'.
-- ═══════════════════════════════════════════════════════════
create table public.announcement_items (
  id               uuid primary key default gen_random_uuid(),
  announcement_id  uuid not null references public.announcements(id) on delete cascade,
  title            varchar(120) not null,
  unit_price       numeric(10,2) not null,
  stock_quantity   int not null default 0,
  sort_order       int not null default 0,
  status           item_status not null default 'active',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ═══════════════════════════════════════════════════════════
-- TABELA: announcement_images
-- Objetivo: Galeria de fotos relativas a cada respectivo anúncio.
-- ═══════════════════════════════════════════════════════════
create table public.announcement_images (
  id               uuid primary key default gen_random_uuid(),
  announcement_id  uuid not null references public.announcements(id) on delete cascade,
  url              text not null,
  is_cover         boolean not null default false,
  sort_order       int not null default 0,
  created_at       timestamptz not null default now()
);

-- ═══════════════════════════════════════════════════════════
-- TABELA: auto_delivery_items
-- Objetivo: Cadastro de credenciais codificadas que são instantaneamente entregues assim que aprovado o pagamento.
-- ═══════════════════════════════════════════════════════════
create table public.auto_delivery_items (
  id               uuid primary key default gen_random_uuid(),
  announcement_id  uuid not null references public.announcements(id) on delete cascade,
  item_id          uuid references public.announcement_items(id),
  payload          text not null,
  is_delivered     boolean not null default false,
  order_id         uuid,
  created_at       timestamptz not null default now()
);

-- ═══════════════════════════════════════════════════════════
-- TABELA: orders
-- Objetivo: Transação de compra principal e seu status de liberação do pagamento via Pagar.me escrow.
-- ═══════════════════════════════════════════════════════════
create table public.orders (
  id                    uuid primary key default gen_random_uuid(),
  announcement_id       uuid not null references public.announcements(id),
  announcement_item_id  uuid references public.announcement_items(id),
  buyer_id              uuid not null references public.profiles(id),
  seller_id             uuid not null references public.profiles(id),
  status                order_status not null default 'pending_payment',
  amount                numeric(10,2) not null,
  platform_fee          numeric(10,2) not null,
  seller_amount         numeric(10,2) not null,
  payment_method        payment_method,
  pagarme_order_id      text,
  pagarme_charge_id     text,
  escrow_release_at     timestamptz,
  accelerated_release   boolean not null default false,
  buyer_confirmed_at    timestamptz,
  completed_at          timestamptz,
  cancelled_at          timestamptz,
  cancellation_reason   text,
  metadata              jsonb,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- ═══════════════════════════════════════════════════════════
-- TABELA: order_messages
-- Objetivo: Chat interno para comunicação comprador vs vendedor do respectivo pedido e logs de sistema.
-- ═══════════════════════════════════════════════════════════
create table public.order_messages (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references public.orders(id) on delete cascade,
  sender_id    uuid references public.profiles(id),
  message      text not null,
  type         varchar(20) not null default 'text',
  is_filtered  boolean not null default false,
  created_at   timestamptz not null default now()
);

-- ═══════════════════════════════════════════════════════════
-- TABELA: order_reviews
-- Objetivo: Avaliações após a order ser finalizada do comprador a respeito do vendedor ou vice versa.
-- ═══════════════════════════════════════════════════════════
create table public.order_reviews (
  id             uuid primary key default gen_random_uuid(),
  order_id       uuid not null references public.orders(id),
  reviewer_id    uuid not null references public.profiles(id),
  reviewed_id    uuid not null references public.profiles(id),
  role           review_role not null,
  type           review_type not null,
  message        varchar(600),
  created_at     timestamptz not null default now(),
  unique(order_id, reviewer_id)
);

-- ═══════════════════════════════════════════════════════════
-- TABELA: announcement_comments
-- Objetivo: Espaço para Q&A público atrelado ao anúncio (Perguntas sobre o produto).
-- ═══════════════════════════════════════════════════════════
create table public.announcement_comments (
  id               uuid primary key default gen_random_uuid(),
  announcement_id  uuid not null references public.announcements(id) on delete cascade,
  user_id          uuid not null references public.profiles(id),
  parent_id        uuid references public.announcement_comments(id),
  message          text not null,
  status           boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ═══════════════════════════════════════════════════════════
-- TABELA: wishlist
-- Objetivo: Armazena anúncios que usuários favoritaram.
-- ═══════════════════════════════════════════════════════════
create table public.wishlist (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.profiles(id) on delete cascade,
  announcement_id  uuid not null references public.announcements(id) on delete cascade,
  created_at       timestamptz not null default now(),
  unique(user_id, announcement_id)
);

-- ═══════════════════════════════════════════════════════════
-- TABELA: wallet_transactions
-- Objetivo: Registro financeiro/extrato detalhado de saldo para a carteira de cada usuário.
-- ═══════════════════════════════════════════════════════════
create table public.wallet_transactions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id),
  type         transaction_type not null,
  amount       numeric(10,2) not null,
  balance_after numeric(10,2) not null,
  reference_id uuid,
  description  varchar(300),
  created_at   timestamptz not null default now()
);

-- ═══════════════════════════════════════════════════════════
-- TABELA: withdrawal_requests
-- Objetivo: Transações de pedido de saque do saldo para contas Pix vinculadas no KYC.
-- ═══════════════════════════════════════════════════════════
create table public.withdrawal_requests (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles(id),
  amount         numeric(10,2) not null,
  type           withdrawal_type not null default 'normal',
  fee            numeric(10,2) not null default 0,
  net_amount     numeric(10,2) not null,
  pix_key        varchar(150) not null,
  pix_key_type   varchar(20) not null,
  status         withdrawal_status not null default 'pending',
  rejection_note text,
  processed_at   timestamptz,
  processed_by   uuid references public.profiles(id),
  pagarme_id     text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ═══════════════════════════════════════════════════════════
-- TABELA: points_transactions
-- Objetivo: Registro no banco de "GG Points" para compras através do programa de recompensas com expiração.
-- ═══════════════════════════════════════════════════════════
create table public.points_transactions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id),
  type         points_transaction_type not null,
  amount       int not null,
  expires_at   timestamptz,
  reference_id uuid,
  description  varchar(300),
  created_at   timestamptz not null default now()
);

-- ═══════════════════════════════════════════════════════════
-- TABELA: reports
-- Objetivo: Sistema de denúncia de usuários para anúncios indevidos, spams ou comportamento abusivo no chat.
-- ═══════════════════════════════════════════════════════════
create table public.reports (
  id              uuid primary key default gen_random_uuid(),
  reporter_id     uuid not null references public.profiles(id),
  target_type     report_target not null,
  target_id       uuid not null,
  reason          varchar(100) not null,
  description     text,
  status          report_status not null default 'pending',
  moderator_id    uuid references public.profiles(id),
  moderator_note  text,
  resolved_at     timestamptz,
  created_at      timestamptz not null default now()
);

-- ═══════════════════════════════════════════════════════════
-- TABELA: notifications
-- Objetivo: Notificações em tempo real enviadas sistematicamente para o usuário logado sobre atualizações na sua conta ou pedido.
-- ═══════════════════════════════════════════════════════════
create table public.notifications (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  type         notification_type not null,
  title        varchar(120) not null,
  message      text not null,
  reference_id uuid,
  reference_type varchar(50),
  is_read      boolean not null default false,
  created_at   timestamptz not null default now()
);

-- ═══════════════════════════════════════════════════════════
-- TABELA: blog_posts
-- Objetivo: Conteúdo consumível atrelado a SEO para guias e tutoriais relacionados ao ecossistema.
-- ═══════════════════════════════════════════════════════════
create table public.blog_posts (
  id            uuid primary key default gen_random_uuid(),
  author_id     uuid not null references public.profiles(id),
  title         varchar(200) not null,
  slug          varchar(220) unique not null,
  excerpt       varchar(400),
  content       text not null,
  cover_url     text,
  reading_time  int,
  is_published  boolean not null default false,
  published_at  timestamptz,
  seo_title     varchar(120),
  seo_description varchar(300),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ═══════════════════════════════════════════════════════════
-- TABELA: account_verifier
-- Objetivo: Base de checagem antifraude contra usuários denunciados globalmente em outros hubs por quebrar escrows.
-- ═══════════════════════════════════════════════════════════
create table public.account_verifier (
  id             uuid primary key default gen_random_uuid(),
  game_id        uuid references public.categories(id),
  identifier     varchar(200) not null,
  status         varchar(20) not null,
  description    text,
  reported_by    uuid references public.profiles(id),
  verified_by    uuid references public.profiles(id),
  created_at     timestamptz not null default now()
);

-- ═══════════════════════════════════════════════════════════
-- ÍNDICES CRÍTICOS
-- ═══════════════════════════════════════════════════════════
create index idx_announcements_category on public.announcements(category_id) where status = 'active';
create index idx_announcements_user on public.announcements(user_id);
create index idx_announcements_slug on public.announcements(slug);
create index idx_announcements_plan on public.announcements(plan, status);
create index idx_orders_buyer on public.orders(buyer_id);
create index idx_orders_seller on public.orders(seller_id);
create index idx_orders_status on public.orders(status);
create index idx_orders_escrow_release on public.orders(escrow_release_at) where status = 'in_delivery';
create index idx_messages_order on public.order_messages(order_id, created_at);
create index idx_notifications_user on public.notifications(user_id, is_read, created_at desc);
create index idx_wallet_user on public.wallet_transactions(user_id, created_at desc);
create index idx_points_user on public.points_transactions(user_id, expires_at);
create index idx_categories_parent on public.categories(parent_id) where status = true;

-- ═══════════════════════════════════════════════════════════
-- TRIGGER: updated_at automático
-- ═══════════════════════════════════════════════════════════
create or replace function public.set_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

-- Tabela: profiles
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

-- Tabela: user_validations
create trigger trg_user_validations_updated before update on public.user_validations
  for each row execute function public.set_updated_at();

-- Tabela: user_stats
create trigger trg_user_stats_updated before update on public.user_stats
  for each row execute function public.set_updated_at();

-- Tabela: categories
create trigger trg_categories_updated before update on public.categories
  for each row execute function public.set_updated_at();

-- Tabela: announcements
create trigger trg_announcements_updated before update on public.announcements
  for each row execute function public.set_updated_at();

-- Tabela: announcement_items
create trigger trg_announcement_items_updated before update on public.announcement_items
  for each row execute function public.set_updated_at();

-- Tabela: orders
create trigger trg_orders_updated before update on public.orders
  for each row execute function public.set_updated_at();

-- Tabela: announcement_comments
create trigger trg_announcement_comments_updated before update on public.announcement_comments
  for each row execute function public.set_updated_at();

-- Tabela: withdrawal_requests
create trigger trg_withdrawal_requests_updated before update on public.withdrawal_requests
  for each row execute function public.set_updated_at();

-- Tabela: blog_posts
create trigger trg_blog_posts_updated before update on public.blog_posts
  for each row execute function public.set_updated_at();

-- ═══════════════════════════════════════════════════════════
-- TRIGGER: criar user_stats / profiles automaticamente no cadastro
-- ═══════════════════════════════════════════════════════════
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, display_name, avatar_url)
  values (
    new.id,
    lower(split_part(new.email, '@', 1)) || '_' || substr(new.id::text, 1, 6),
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  );
  insert into public.user_stats (user_id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();