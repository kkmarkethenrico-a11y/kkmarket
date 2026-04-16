---

## 1. IDENTIDADE DO PROJETO

| Campo | Valor |
|---|---|
| **Nome do Projeto** | GameMarket (nome provisório — substituir pelo nome final do cliente) |
| **Tipo** | Marketplace B2C/C2C — Produtos e Serviços Digitais de Games |
| **Repositório** | github.com/[ORG]/gamemarket |
| **Ambiente Dev** | http://localhost:3000 |
| **Ambiente Staging** | https://gamemarket-staging.vercel.app |
| **Ambiente Prod** | https://[dominio-final].com.br |
| **Supabase Project ID** | [PREENCHER APÓS CRIAR O PROJETO] |
| **Supabase URL** | https://[PROJECT_ID].supabase.co |
| **Vercel Project** | gamemarket |
| **Responsável Técnico** | Marcos Roberto Padilha — Vintage DevStack |

---

## 2. STACK COMPLETA

```
Frontend:        Next.js 14 (App Router) — SSR/SSG/Client components
UI/Estilização:  Tailwind CSS + shadcn/ui
Estado Global:   Zustand (UI state) + TanStack Query v5 (server state / cache)
Backend/BaaS:    Supabase (PostgreSQL 15 + Auth + Realtime + Storage + Edge Functions)
API Routes:      Next.js Route Handlers (/app/api/*)
Pagamentos:      Pagar.me API v5 (PIX + Boleto + Cartão 3DS + Escrow)
Busca:           MeiliSearch v1.x (self-hosted no Railway)
Chat Realtime:   Supabase Realtime (WebSockets + Presence)
Storage:         Supabase Storage + Cloudflare CDN
Email:           Resend (transacional)
Deploy Frontend: Vercel (CI/CD automático na main)
Deploy Serviços: Railway (MeiliSearch + workers)
Auth Social:     Supabase Auth — Google OAuth + Discord OAuth
KYC (Fase 2+):   Unico Check ou Idwall (a definir com cliente)
Linguagem:       TypeScript (strict mode) em todo o projeto
```

---

## 3. ESTRUTURA DE PASTAS

```
/
├── app/                          # Next.js App Router
│   ├── (public)/                 # Layout público (header + footer)
│   │   ├── page.tsx              # Home
│   │   ├── categorias/
│   │   │   └── page.tsx
│   │   ├── categoria/
│   │   │   └── [tipo]/           # jogos | outros
│   │   │       └── [slug]/
│   │   │           ├── page.tsx  # Listagem de anúncios por categoria
│   │   │           └── [sub]/
│   │   │               └── page.tsx
│   │   ├── anuncio/
│   │   │   └── [slug]/
│   │   │       └── page.tsx      # Detalhe do anúncio (SSR — SEO crítico)
│   │   ├── perfil/
│   │   │   └── [username]/
│   │   │       └── page.tsx      # Perfil público
│   │   ├── buscar/
│   │   │   └── page.tsx
│   │   ├── blog/
│   │   │   ├── page.tsx
│   │   │   └── [slug]/
│   │   │       └── page.tsx
│   │   ├── como-funciona/
│   │   ├── tarifas-e-prazos/
│   │   ├── formas-de-pagamento/
│   │   ├── programa-de-pontos/
│   │   ├── perguntas-frequentes/
│   │   └── verificador/
│   ├── (auth)/                   # Rotas de autenticação
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── cadastro/
│   │   │   └── page.tsx
│   │   └── callback/             # OAuth callback handlers
│   ├── (dashboard)/              # Layout protegido (área logada)
│   │   ├── layout.tsx            # Sidebar + header da área logada
│   │   ├── painel/
│   │   │   └── page.tsx
│   │   ├── minhas-compras/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx      # Chat do pedido
│   │   ├── minhas-vendas/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── meus-anuncios/
│   │   │   ├── page.tsx
│   │   │   └── novo/
│   │   │       └── page.tsx      # Wizard 4 passos
│   │   ├── minhas-retiradas/
│   │   ├── gg-points/
│   │   ├── wishlist/
│   │   ├── verificacao/
│   │   ├── configuracoes/
│   │   └── notificacoes/
│   ├── (admin)/                  # Layout exclusivo admin
│   │   ├── layout.tsx
│   │   ├── admin/
│   │   │   ├── page.tsx          # Dashboard admin
│   │   │   ├── usuarios/
│   │   │   ├── anuncios/
│   │   │   ├── pedidos/
│   │   │   ├── moderacao/
│   │   │   ├── categorias/
│   │   │   ├── blog/
│   │   │   ├── financeiro/
│   │   │   ├── pontos/
│   │   │   └── configuracoes/
│   └── api/                      # Route Handlers
│       ├── webhooks/
│       │   └── pagarme/
│       │       └── route.ts      # Webhook de pagamentos
│       ├── orders/
│       │   ├── route.ts          # POST criar pedido
│       │   └── [id]/
│       │       ├── route.ts
│       │       ├── confirm/
│       │       │   └── route.ts  # Confirmar recebimento
│       │       └── dispute/
│       │           └── route.ts
│       ├── withdrawals/
│       │   └── route.ts          # POST solicitar saque
│       ├── search/
│       │   └── route.ts          # Proxy MeiliSearch
│       ├── upload/
│       │   └── route.ts          # Upload de imagens
│       └── kyc/
│           └── route.ts          # Webhook KYC
├── components/
│   ├── ui/                       # shadcn/ui base components
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── Sidebar.tsx
│   │   └── MobileNav.tsx
│   ├── marketplace/
│   │   ├── AnnouncementCard.tsx
│   │   ├── AnnouncementGrid.tsx
│   │   ├── AnnouncementFilters.tsx
│   │   ├── CategoryCard.tsx
│   │   ├── SearchBar.tsx
│   │   └── PlanBadge.tsx
│   ├── announcement/
│   │   ├── WizardStep1.tsx
│   │   ├── WizardStep2.tsx
│   │   ├── WizardStep3.tsx
│   │   ├── WizardStep4.tsx
│   │   ├── ItemVariations.tsx
│   │   ├── QASection.tsx
│   │   ├── ReviewsList.tsx
│   │   └── AutoDeliveryToggle.tsx
│   ├── checkout/
│   │   ├── CheckoutForm.tsx
│   │   ├── PaymentMethods.tsx
│   │   └── OrderSummary.tsx
│   ├── chat/
│   │   ├── ChatWindow.tsx
│   │   ├── ChatMessage.tsx
│   │   └── ChatInput.tsx         # Filtragem client-side (UX)
│   ├── profile/
│   │   ├── PublicProfile.tsx
│   │   ├── ReputationBadge.tsx
│   │   └── VerificationBadges.tsx
│   └── admin/
│       ├── DataTable.tsx
│       ├── StatsCard.tsx
│       └── ModerationQueue.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # Supabase browser client
│   │   ├── server.ts             # Supabase server client (Route Handlers)
│   │   ├── middleware.ts         # Supabase auth middleware
│   │   └── types.ts              # Types gerados pelo Supabase CLI
│   ├── pagarme/
│   │   ├── client.ts
│   │   ├── escrow.ts             # Lógica de escrow
│   │   └── webhooks.ts           # Handlers de webhook
│   ├── meilisearch/
│   │   ├── client.ts
│   │   └── indexes.ts            # Definição dos índices
│   ├── resend/
│   │   ├── client.ts
│   │   └── templates/            # Templates de email
│   ├── chat-filter/
│   │   └── index.ts              # Regex de filtro anti-bypass
│   ├── validations/              # Zod schemas
│   │   ├── announcement.ts
│   │   ├── order.ts
│   │   └── user.ts
│   └── utils.ts
├── stores/                       # Zustand stores
│   ├── authStore.ts
│   ├── cartStore.ts
│   └── notificationStore.ts
├── hooks/                        # Custom React hooks
│   ├── useAnnouncements.ts
│   ├── useChat.ts
│   ├── useUser.ts
│   └── useSearch.ts
├── types/                        # TypeScript global types
│   └── index.ts
├── middleware.ts                 # Next.js middleware (auth guard)
├── supabase/
│   ├── migrations/               # SQL migrations (versionadas)
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_rls_policies.sql
│   │   ├── 003_seed_categories.sql
│   │   └── 004_seed_games.sql
│   └── functions/                # Supabase Edge Functions
│       ├── release-escrow/       # Liberação automática por prazo
│       │   └── index.ts
│       ├── process-withdrawal/   # Processamento de saques
│       │   └── index.ts
│       └── send-notification/    # Envio de emails/notificações
│           └── index.ts
└── public/
    ├── images/
    └── icons/
```

---

## 4. BANCO DE DADOS — SCHEMA COMPLETO (PostgreSQL / Supabase)

### Convenções
- Todos os IDs: `uuid` com `gen_random_uuid()` como default
- Timestamps: `created_at` e `updated_at` em todas as tabelas (UTC)
- Soft delete: coluna `status` (nunca DELETE físico em produção)
- Schema: `public` (padrão Supabase)

```sql
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
-- TABELA: profiles (extensão do auth.users do Supabase)
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
-- TABELA: user_validations (KYC)
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
-- TABELA: user_stats (cache de métricas do perfil)
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
  custom_filters        jsonb,           -- filtros específicos desta categoria
  status                boolean not null default true,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- ═══════════════════════════════════════════════════════════
-- TABELA: announcements
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
  unit_price           numeric(10,2),    -- null se model=dynamic (usar items)
  stock_quantity       int,              -- null se model=dynamic
  has_auto_delivery    boolean not null default false,
  is_vip               boolean not null default false,
  filters_data         jsonb,            -- valores dos filtros custom da categoria
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
-- TABELA: announcement_items (variações de anúncio dinâmico)
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
-- TABELA: auto_delivery_items (credenciais pré-carregadas)
-- ═══════════════════════════════════════════════════════════
create table public.auto_delivery_items (
  id               uuid primary key default gen_random_uuid(),
  announcement_id  uuid not null references public.announcements(id) on delete cascade,
  item_id          uuid references public.announcement_items(id),
  payload          text not null,  -- ENCRYPTED: credencial/link/código
  is_delivered     boolean not null default false,
  order_id         uuid,           -- preenchido quando entregue
  created_at       timestamptz not null default now()
);

-- ═══════════════════════════════════════════════════════════
-- TABELA: orders
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
  seller_amount         numeric(10,2) not null,  -- amount - platform_fee
  payment_method        payment_method,
  pagarme_order_id      text,
  pagarme_charge_id     text,
  escrow_release_at     timestamptz,             -- calculado após pagamento aprovado
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
-- TABELA: order_messages (chat do pedido)
-- ═══════════════════════════════════════════════════════════
create table public.order_messages (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references public.orders(id) on delete cascade,
  sender_id    uuid references public.profiles(id),  -- null = mensagem do sistema
  message      text not null,
  type         varchar(20) not null default 'text',  -- text | system | auto_delivery | image
  is_filtered  boolean not null default false,        -- true se conteúdo foi censurado
  created_at   timestamptz not null default now()
);

-- ═══════════════════════════════════════════════════════════
-- TABELA: order_reviews
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
-- TABELA: announcement_comments (Q&A público)
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
-- ═══════════════════════════════════════════════════════════
create table public.wallet_transactions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id),
  type         transaction_type not null,
  amount       numeric(10,2) not null,  -- positivo = crédito, negativo = débito
  balance_after numeric(10,2) not null,
  reference_id uuid,                    -- order_id ou withdrawal_id
  description  varchar(300),
  created_at   timestamptz not null default now()
);

-- ═══════════════════════════════════════════════════════════
-- TABELA: withdrawal_requests
-- ═══════════════════════════════════════════════════════════
create table public.withdrawal_requests (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles(id),
  amount         numeric(10,2) not null,
  type           withdrawal_type not null default 'normal',
  fee            numeric(10,2) not null default 0,       -- R$ 3,50 para TURBO
  net_amount     numeric(10,2) not null,                 -- amount - fee
  pix_key        varchar(150) not null,
  pix_key_type   varchar(20) not null,                   -- cpf | cnpj | email | phone | random
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
-- ═══════════════════════════════════════════════════════════
create table public.points_transactions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id),
  type         points_transaction_type not null,
  amount       int not null,              -- positivo = ganho, negativo = uso
  expires_at   timestamptz,              -- null para pontos que não expiram
  reference_id uuid,
  description  varchar(300),
  created_at   timestamptz not null default now()
);

-- ═══════════════════════════════════════════════════════════
-- TABELA: reports (denúncias)
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
-- ═══════════════════════════════════════════════════════════
create table public.notifications (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  type         notification_type not null,
  title        varchar(120) not null,
  message      text not null,
  reference_id uuid,                  -- order_id, announcement_id, etc.
  reference_type varchar(50),
  is_read      boolean not null default false,
  created_at   timestamptz not null default now()
);

-- ═══════════════════════════════════════════════════════════
-- TABELA: blog_posts
-- ═══════════════════════════════════════════════════════════
create table public.blog_posts (
  id            uuid primary key default gen_random_uuid(),
  author_id     uuid not null references public.profiles(id),
  title         varchar(200) not null,
  slug          varchar(220) unique not null,
  excerpt       varchar(400),
  content       text not null,           -- HTML ou Markdown
  cover_url     text,
  reading_time  int,                     -- em minutos
  is_published  boolean not null default false,
  published_at  timestamptz,
  seo_title     varchar(120),
  seo_description varchar(300),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ═══════════════════════════════════════════════════════════
-- TABELA: account_verifier (banco antifraude - Fase 4)
-- ═══════════════════════════════════════════════════════════
create table public.account_verifier (
  id             uuid primary key default gen_random_uuid(),
  game_id        uuid references public.categories(id),
  identifier     varchar(200) not null,   -- email, username ou CPF
  status         varchar(20) not null,    -- fraudulent | suspicious | clean
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

-- Aplicar em todas as tabelas com updated_at
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger trg_announcements_updated before update on public.announcements
  for each row execute function public.set_updated_at();
create trigger trg_orders_updated before update on public.orders
  for each row execute function public.set_updated_at();
-- (repetir para demais tabelas)

-- ═══════════════════════════════════════════════════════════
-- TRIGGER: criar user_stats automaticamente no cadastro
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
```

---

## 5. VARIÁVEIS DE AMBIENTE

```env
# ─── Supabase ────────────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT_ID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[ANON_KEY]
SUPABASE_SERVICE_ROLE_KEY=[SERVICE_ROLE_KEY]   # NUNCA expor no client

# ─── Pagar.me ────────────────────────────────────────────────
PAGARME_API_KEY=[sk_live_XXX]                  # sk_test_XXX em dev
PAGARME_WEBHOOK_SECRET=[webhook_secret]
NEXT_PUBLIC_PAGARME_PUBLIC_KEY=[pk_live_XXX]   # Para tokenização client-side

# ─── MeiliSearch ─────────────────────────────────────────────
MEILISEARCH_HOST=https://search.[dominio].com.br
MEILISEARCH_API_KEY=[master_key]
NEXT_PUBLIC_MEILISEARCH_HOST=https://search.[dominio].com.br
NEXT_PUBLIC_MEILISEARCH_SEARCH_KEY=[search_only_key]  # Chave pública limitada

# ─── Resend ──────────────────────────────────────────────────
RESEND_API_KEY=re_XXXXXXXXXX

# ─── App ─────────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL=https://[dominio].com.br
NEXT_PUBLIC_APP_NAME=GameMarket
PLATFORM_FEE_SILVER=0.0999    # 9.99%
PLATFORM_FEE_GOLD=0.1199      # 11.99%
PLATFORM_FEE_DIAMOND=0.1299   # 12.99%
WITHDRAWAL_TURBO_FEE=3.50
POINTS_TO_BRL_RATE=77         # 77 pontos = R$ 1,00
POINTS_EXPIRY_DAYS=180        # 6 meses
MIN_ORDER_AMOUNT=2.00
MIN_ANNOUNCEMENT_PRICE=2.00

# ─── Criptografia (Auto Delivery) ────────────────────────────
ENCRYPTION_KEY=[32_bytes_hex]  # Para criptografar credenciais no auto delivery
```

---

## 6. REGRAS DE NEGÓCIO CRÍTICAS

```
ESCROW:
- Pagamento retido até: buyer confirmar OU prazo de escrow_release_at expirar
- escrow_release_at = paid_at + balance_release_days da category
- Liberação acelerada: reduz prazo pela metade SE buyer avaliar positivamente
- Liberação automática: Edge Function roda a cada hora buscando orders vencidas

TAXAS DA PLATAFORMA:
- Silver: 9.99% | Gold: 11.99% | Diamond: 12.99%
- Cobrada APENAS sobre vendas (nunca sobre criação de anúncio)
- seller_amount = amount * (1 - fee_rate)
- platform_fee = amount * fee_rate

CHAT ANTI-BYPASS (server-side, lib/chat-filter/index.ts):
- Executado no Route Handler ANTES de gravar na tabela order_messages
- Padrões bloqueados: telefones BR, @telegram, t.me/, discord.gg/, wa.me/, +55...
- Mensagem bloqueada → is_filtered=true, conteúdo substituído por aviso padrão
- Log do conteúdo original em tabela admin_logs (não visível ao usuário)
- 3+ tentativas do mesmo usuário em 24h → notificação automática ao admin

SAQUES:
- Requisito: user_validations com TODOS os tipos verificados
- Normal: grátis, processa em até 2 dias úteis (batch diário às 10h)
- TURBO: R$ 3,50 de taxa, processamento imediato (até 30min)
- Saldo mínimo para saque: R$ 10,00
- Verificar saldo em user_stats.wallet_balance antes de processar

PONTOS:
- Ganho em compras: 1 ponto por R$ 1 gasto (creditado após order completada)
- Ganho em vendas (Gold/Diamond): 50% do valor em pontos (ao receber avaliação positiva)
- Mínimo para usar: 300 pontos
- Cotação: 77 pontos = R$ 1,00 (configurável via admin)
- Expiração: 180 dias a partir do crédito
- Débito: prioridade por data de expiração (FIFO por expires_at)

AUTO DELIVERY:
- Payload criptografado com AES-256 usando ENCRYPTION_KEY
- Decriptografar APENAS no momento da entrega (após payment=paid)
- Após entrega: is_delivered=true, order_id preenchido
- Se estoque de auto_delivery_items acabar: mover announcement para 'sold_out'

ANÚNCIOS:
- Todo novo anúncio criado com status='pending' (aguarda moderação)
- Moderação automática: verificar palavras proibidas no título/descrição
- Se não há fila de moderação manual: aprovar em até 6h
- Status de presença online: consultar profiles.last_seen_at (online se < 5 min)

CATEGORIAS:
- Hierarquia máxima: 2 níveis (categoria → subcategoria)
- Jogos é a categoria raiz principal (sem parent_id)
- balance_release_days por categoria (padrão: 4 dias)
- Categorias com is_featured=true aparecem em destaque na home
```

---

## 7. CONVENÇÕES DE CÓDIGO

```typescript
// Nomenclatura
- Componentes: PascalCase (AnnouncementCard.tsx)
- Hooks: camelCase com prefixo 'use' (useAnnouncements.ts)
- Stores Zustand: camelCase com sufixo 'Store' (authStore.ts)
- Tipos: PascalCase, sufixo Type ou Interface (AnnouncementType)
- API Routes: verbo HTTP explícito nos handlers (GET, POST, PUT, DELETE)
- Variáveis de ambiente server: sem prefixo NEXT_PUBLIC_
- Variáveis de ambiente client: prefixo NEXT_PUBLIC_

// Server vs Client Components
- Padrão: Server Components (async, sem 'use client')
- Client apenas quando necessário: hooks, eventos, estado local, realtime
- Nunca usar 'use client' em layouts principais (quebra SSR)
- Supabase server client: lib/supabase/server.ts (cookies)
- Supabase browser client: lib/supabase/client.ts (singleton)

// Validação
- Zod em todas as entradas (API routes + formulários)
- Tratar erros Supabase explicitamente (não usar ! assertivo)
- Logs de erro com contexto: console.error('[modulo] mensagem', { data })

// Supabase queries
- Sempre usar .select() explícito (nunca select('*') em produção)
- Preferir joins via .select('*, related_table(fields)') sobre múltiplas queries
- Paginação com .range(from, to) — 20 itens por página como padrão
- Ordenação explícita em todas as listagens

// Imagens
- Sempre converter para WebP no upload (sharp ou Supabase transform)
- Limitar tamanho: capa do anúncio 2MB, imagens adicionais 1MB, avatar 500KB
- Bucket 'announcements': público | Bucket 'kyc-docs': privado (apenas service role)
```

---

## 8. SUPABASE RLS — POLÍTICAS BASE

```sql
-- Princípio: negar tudo por padrão, permitir explicitamente

-- profiles: público para leitura, privado para escrita
alter table public.profiles enable row level security;
create policy "profiles_select_public" on public.profiles for select using (true);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- announcements: ativo visível para todos, dono gerencia os próprios
alter table public.announcements enable row level security;
create policy "announcements_select_active" on public.announcements
  for select using (status = 'active' or auth.uid() = user_id);
create policy "announcements_insert_auth" on public.announcements
  for insert with check (auth.uid() = user_id);
create policy "announcements_update_own" on public.announcements
  for update using (auth.uid() = user_id);

-- orders: visível apenas para buyer e seller do pedido
alter table public.orders enable row level security;
create policy "orders_select_participants" on public.orders
  for select using (auth.uid() = buyer_id or auth.uid() = seller_id);
create policy "orders_insert_buyer" on public.orders
  for insert with check (auth.uid() = buyer_id);

-- order_messages: visível apenas para participantes do pedido
alter table public.order_messages enable row level security;
create policy "messages_select_participants" on public.order_messages
  for select using (
    exists (select 1 from public.orders o
      where o.id = order_id and (o.buyer_id = auth.uid() or o.seller_id = auth.uid()))
  );
create policy "messages_insert_participants" on public.order_messages
  for insert with check (
    auth.uid() = sender_id and
    exists (select 1 from public.orders o
      where o.id = order_id and (o.buyer_id = auth.uid() or o.seller_id = auth.uid())
      and o.status in ('paid', 'in_delivery', 'delivered'))
  );

-- wallet_transactions: apenas o próprio usuário
alter table public.wallet_transactions enable row level security;
create policy "wallet_select_own" on public.wallet_transactions
  for select using (auth.uid() = user_id);

-- notifications: apenas o destinatário
alter table public.notifications enable row level security;
create policy "notifications_select_own" on public.notifications
  for select using (auth.uid() = user_id);
create policy "notifications_update_own" on public.notifications
  for update using (auth.uid() = user_id);
```

---

## 9. INTEGRAÇÃO PAGAR.ME — FLUXO DE ESCROW

```typescript
// Fluxo completo de criação de pedido com Pagar.me
// 1. POST /api/orders → cria order no banco (status: pending_payment)
// 2. POST /api/orders/[id]/payment → cria cobrança no Pagar.me
// 3. Webhook /api/webhooks/pagarme → recebe confirmação de pagamento
// 4. Webhook handler:
//    - Atualiza order.status = 'paid'
//    - Calcula escrow_release_at = now() + category.balance_release_days
//    - Credita wallet do vendedor com status 'escrow' (bloqueado)
//    - Dispara mensagem de sistema no chat
//    - Se has_auto_delivery: entrega credencial automaticamente
// 5. Edge Function (hourly cron):
//    - Busca orders onde escrow_release_at <= now() e status = 'in_delivery'
//    - Para cada uma: libera saldo (escrow → available)
//    - Atualiza order.status = 'completed'
// 6. Saque via PIX: POST /api/withdrawals → Pagar.me Transfers API
```

---

## 10. CHAT FILTER — PADRÕES DE BLOQUEIO

```typescript
// lib/chat-filter/index.ts
export const BLOCK_PATTERNS = [
  // Telefones BR (fixo e celular)
  /(\+?55\s?)?(\(?\d{2}\)?\s?)(\d{4,5}[-\s]?\d{4})/g,
  // WhatsApp
  /(wa\.me|api\.whatsapp\.com|whatsapp\.com\/send)/gi,
  // Telegram
  /(@\w{5,}|t\.me\/|telegram\.me\/|telegram:)/gi,
  // Discord
  /(discord\.gg\/|discord\.com\/invite\/|\w{2,32}#\d{4})/gi,
  // Instagram DM hint
  /(instagram\.com\/|insta:\s*@|ig:\s*@)/gi,
  // Emails
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
];

export const REPLACEMENT_MESSAGE =
  "⚠️ [Contato externo bloqueado] Negocie pela plataforma para sua proteção.";

export function filterMessage(content: string): {
  filtered: boolean;
  content: string;
  originalContent: string;
} {
  let filtered = false;
  let result = content;
  for (const pattern of BLOCK_PATTERNS) {
    if (pattern.test(result)) {
      filtered = true;
      result = result.replace(pattern, "[BLOQUEADO]");
    }
  }
  return { filtered, content: result, originalContent: content };
}
```

---

## 11. MEILISEARCH — ÍNDICES

```typescript
// lib/meilisearch/indexes.ts
// Índice: announcements
{
  primaryKey: 'id',
  searchableAttributes: ['title', 'description', 'category_name', 'username'],
  filterableAttributes: ['category_id', 'plan', 'status', 'has_auto_delivery', 'min_price', 'max_price'],
  sortableAttributes: ['sale_count', 'created_at', 'unit_price'],
  rankingRules: ['words', 'typo', 'proximity', 'attribute', 'sort', 'exactness'],
  typoTolerance: { enabled: true, minWordSizeForTypos: { oneTypo: 4, twoTypos: 8 } }
}
// Índice: users
{
  primaryKey: 'id',
  searchableAttributes: ['username', 'display_name'],
  filterableAttributes: ['status', 'is_vip']
}
// Índice: categories
{
  primaryKey: 'id',
  searchableAttributes: ['name', 'slug'],
  filterableAttributes: ['parent_id', 'status', 'is_featured']
}

// Sincronização: webhook no Supabase Database ao INSERT/UPDATE em announcements
// Usar Supabase Edge Function para reindexar no MeiliSearch
```

---

## 12. STATUS ATUAL DO PROJETO

| Fase | Módulo | Status | Observações |
|------|--------|--------|-------------|
| Setup | Estrutura Next.js | ⏳ Pendente | |
| Setup | Schema SQL | ⏳ Pendente | |
| Setup | Seed categorias | ⏳ Pendente | |
| Fase 1 | Autenticação | ⏳ Pendente | |
| Fase 1 | Anúncios (CRUD) | ⏳ Pendente | |
| Fase 1 | Checkout + Pagar.me | ⏳ Pendente | |
| Fase 1 | Chat + Anti-bypass | ⏳ Pendente | |
| ... | ... | ⏳ Pendente | |

> **Atualizar esta tabela a cada módulo concluído.**

---

*contexto.md v1.0 — Vintage DevStack — Marcos Roberto Padilha*
