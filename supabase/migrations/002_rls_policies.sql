-- ═══════════════════════════════════════════════════════════════════════════
-- 002_rls_policies.sql
-- Row Level Security — GameMarket
--
-- PRINCÍPIO FUNDAMENTAL: Negar tudo por padrão, permitir explicitamente.
-- Se não existe policy para uma operação, ela está BLOQUEADA para
-- authenticated/anon. Apenas service_role ignora RLS.
--
-- CONVENÇÕES:
--   • Funções helper (is_admin, is_moderator) são SECURITY DEFINER
--     para evitar recursão com o próprio RLS de profiles.
--   • Tabelas financeiras (wallet, points, orders.update) são operadas
--     exclusivamente via service_role nos Route Handlers / Edge Functions.
--   • Nenhuma tabela possui policy de DELETE físico a menos que
--     explicitamente indicado (soft delete via coluna status).
-- ═══════════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────────────
-- FUNÇÕES HELPER DE AUTORIZAÇÃO
-- SECURITY DEFINER: executa como o criador da função, contornando RLS
-- de profiles na hora da checagem. Marcadas como STABLE para cache
-- dentro da mesma transação.
-- ─────────────────────────────────────────────────────────────────────────

-- Retorna TRUE se o usuário autenticado tem role = 'admin'
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
end;
$$ language plpgsql security definer stable;

-- Retorna TRUE se o usuário autenticado tem role = 'moderator'
create or replace function public.is_moderator()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role = 'moderator'
  );
end;
$$ language plpgsql security definer stable;

-- Retorna TRUE se admin OU moderator (atalho reutilizável)
create or replace function public.is_staff()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role in ('admin', 'moderator')
  );
end;
$$ language plpgsql security definer stable;

-- Retorna TRUE se o usuário autenticado é dono do anúncio
create or replace function public.owns_announcement(ann_id uuid)
returns boolean as $$
begin
  return exists (
    select 1 from public.announcements
    where id = ann_id
      and user_id = auth.uid()
  );
end;
$$ language plpgsql security definer stable;


-- ═══════════════════════════════════════════════════════════════════════════
-- 1. PROFILES
--
-- Decisão: perfil é informação pública (nome, avatar, reputação são
-- exibidos na vitrine e nos anúncios). Qualquer visitante pode ler.
-- Apenas o próprio dono pode editar seus dados.
-- INSERT é feito exclusivamente pela trigger handle_new_user().
-- DELETE físico NUNCA — soft delete via status = 'banned'.
-- Campos sensíveis (role, status, is_vip) são protegidos nos Route
-- Handlers via validação Zod (o RLS permite UPDATE mas o backend
-- rejeita mutação de campos privilegiados).
-- ═══════════════════════════════════════════════════════════════════════════
alter table public.profiles enable row level security;

create policy "profiles_select_public"
  on public.profiles for select
  using (true);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- INSERT: handle_new_user() roda como SECURITY DEFINER (service_role).
-- DELETE: sem policy = bloqueado. Nunca deletar perfis fisicamente.


-- ═══════════════════════════════════════════════════════════════════════════
-- 2. USER_VALIDATIONS (KYC)
--
-- Decisão: documentos de identidade são dados extremamente sensíveis.
-- O dono pode VER e ENVIAR seus próprios documentos.
-- Apenas moderadores/admins podem verificar/rejeitar (UPDATE de status).
-- DELETE bloqueado — histórico de KYC deve ser preservado para auditoria.
-- ═══════════════════════════════════════════════════════════════════════════
alter table public.user_validations enable row level security;

create policy "user_validations_select_own_or_staff"
  on public.user_validations for select
  using (
    auth.uid() = user_id
    or public.is_staff()
  );

create policy "user_validations_insert_own"
  on public.user_validations for insert
  with check (auth.uid() = user_id);

create policy "user_validations_update_staff"
  on public.user_validations for update
  using (public.is_staff())
  with check (public.is_staff());

-- DELETE: sem policy = bloqueado.


-- ═══════════════════════════════════════════════════════════════════════════
-- 3. USER_STATS
--
-- Decisão: métricas de reputação são públicas (total de vendas, reviews
-- positivos, tempo de resposta). Isso gera confiança na vitrine.
-- wallet_balance e points_balance também ficam visíveis mas sem risco:
-- o saldo real é controlado server-side via wallet_transactions.
-- Escrita BLOQUEADA: atualizado exclusivamente por triggers/service_role.
-- ═══════════════════════════════════════════════════════════════════════════
alter table public.user_stats enable row level security;

create policy "user_stats_select_public"
  on public.user_stats for select
  using (true);

-- INSERT/UPDATE/DELETE: sem policies = bloqueado para authenticated/anon.
-- Gerenciado pelo service_role (triggers, Edge Functions).


-- ═══════════════════════════════════════════════════════════════════════════
-- 4. CATEGORIES
--
-- Decisão: catálogo de categorias é público — necessário para navegar.
-- Apenas staff pode criar, editar ou remover categorias.
-- Na prática não se deleta: usa-se status = false para desativar.
-- Mas a policy de DELETE está presente para limpeza administrativa.
-- ═══════════════════════════════════════════════════════════════════════════
alter table public.categories enable row level security;

create policy "categories_select_public"
  on public.categories for select
  using (true);

create policy "categories_insert_staff"
  on public.categories for insert
  with check (public.is_staff());

create policy "categories_update_staff"
  on public.categories for update
  using (public.is_staff());

create policy "categories_delete_staff"
  on public.categories for delete
  using (public.is_staff());


-- ═══════════════════════════════════════════════════════════════════════════
-- 5. ANNOUNCEMENTS
--
-- Decisão: anúncios ATIVOS são o coração público do marketplace.
-- Anúncios em outros status (pending, paused, rejected, deleted) só
-- são visíveis para o dono e para staff (fila de moderação).
-- INSERT vinculado ao user_id do autenticado.
-- UPDATE permite que o dono edite E que staff modere (aprovar/rejeitar).
-- DELETE bloqueado: usa-se status = 'deleted' como soft delete.
-- ═══════════════════════════════════════════════════════════════════════════
alter table public.announcements enable row level security;

create policy "announcements_select_active_or_own_or_staff"
  on public.announcements for select
  using (
    status = 'active'
    or auth.uid() = user_id
    or public.is_staff()
  );

create policy "announcements_insert_own"
  on public.announcements for insert
  with check (auth.uid() = user_id);

create policy "announcements_update_own_or_staff"
  on public.announcements for update
  using (
    auth.uid() = user_id
    or public.is_staff()
  );

-- DELETE: sem policy = bloqueado. Usar status = 'deleted'.


-- ═══════════════════════════════════════════════════════════════════════════
-- 6. ANNOUNCEMENT_ITEMS (variações de preço — model = 'dynamic')
--
-- Decisão: visibilidade herda do anúncio pai (se o anúncio é visível,
-- suas variações também são). Escrita restrita ao dono do anúncio.
-- DELETE bloqueado: usa-se status = 'deleted'.
-- ═══════════════════════════════════════════════════════════════════════════
alter table public.announcement_items enable row level security;

create policy "announcement_items_select"
  on public.announcement_items for select
  using (
    exists (
      select 1 from public.announcements a
      where a.id = announcement_id
        and (
          a.status = 'active'
          or a.user_id = auth.uid()
          or public.is_staff()
        )
    )
  );

create policy "announcement_items_insert_owner"
  on public.announcement_items for insert
  with check (public.owns_announcement(announcement_id));

create policy "announcement_items_update_owner"
  on public.announcement_items for update
  using (public.owns_announcement(announcement_id));

-- DELETE: sem policy = bloqueado. Usar status = 'deleted'.


-- ═══════════════════════════════════════════════════════════════════════════
-- 7. ANNOUNCEMENT_IMAGES
--
-- Decisão: visibilidade herda do anúncio pai (mesma lógica de items).
-- Dono pode inserir, reordenar e remover imagens.
-- DELETE permitido aqui porque imagens não têm soft delete — a remoção
-- real é necessária para liberar storage.
-- ═══════════════════════════════════════════════════════════════════════════
alter table public.announcement_images enable row level security;

create policy "announcement_images_select"
  on public.announcement_images for select
  using (
    exists (
      select 1 from public.announcements a
      where a.id = announcement_id
        and (
          a.status = 'active'
          or a.user_id = auth.uid()
          or public.is_staff()
        )
    )
  );

create policy "announcement_images_insert_owner"
  on public.announcement_images for insert
  with check (public.owns_announcement(announcement_id));

create policy "announcement_images_update_owner"
  on public.announcement_images for update
  using (public.owns_announcement(announcement_id));

create policy "announcement_images_delete_owner"
  on public.announcement_images for delete
  using (public.owns_announcement(announcement_id));


-- ═══════════════════════════════════════════════════════════════════════════
-- 8. AUTO_DELIVERY_ITEMS
--
-- ⚠️  TABELA CRÍTICA DE SEGURANÇA ⚠️
--
-- Contém credenciais AES-256 criptografadas (payload). Se vazarem,
-- o vendedor perde o produto e o marketplace perde credibilidade.
--
-- Decisão:
--   SELECT: APENAS o vendedor (dono do anúncio) pode ver a LISTA de
--           itens para gerenciar estoque. O campo `payload` ainda está
--           criptografado — descriptografar somente no Route Handler
--           server-side (service_role) no momento da entrega.
--           Staff pode auditar a existência dos itens.
--   INSERT: vendedor carrega novos códigos/credenciais.
--   UPDATE: service_role APENAS — marca is_delivered=true e preenche
--           order_id após pagamento confirmado via webhook Pagar.me.
--   DELETE: service_role APENAS.
--
-- O BUYER nunca toca nesta tabela. A credencial chega descriptografada
-- via mensagem do tipo 'auto_delivery' na tabela order_messages,
-- inserida pelo Route Handler com service_role.
-- ═══════════════════════════════════════════════════════════════════════════
alter table public.auto_delivery_items enable row level security;

create policy "auto_delivery_select_seller_or_staff"
  on public.auto_delivery_items for select
  using (
    exists (
      select 1 from public.announcements a
      where a.id = announcement_id
        and a.user_id = auth.uid()
    )
    or public.is_staff()
  );

create policy "auto_delivery_insert_seller"
  on public.auto_delivery_items for insert
  with check (
    exists (
      select 1 from public.announcements a
      where a.id = announcement_id
        and a.user_id = auth.uid()
    )
  );

-- UPDATE (is_delivered, order_id): sem policy = service_role apenas.
-- DELETE: sem policy = service_role apenas.


-- ═══════════════════════════════════════════════════════════════════════════
-- 9. ORDERS
--
-- Decisão:
--   SELECT: apenas participantes (buyer ou seller) e staff.
--   INSERT: buyer autenticado. Validação adicional: impedir self-buy
--           (buyer_id != seller_id).
--   UPDATE: BLOQUEADO para authenticated. Todas as transições de status
--           são feitas via service_role nos Route Handlers:
--             • Webhook Pagar.me    → pending_payment → paid
--             • Route Handler       → paid → in_delivery (auto delivery)
--             • Route Handler       → in_delivery → delivered (buyer confirma)
--             • Edge Function cron  → in_delivery → completed (escrow expirou)
--             • Route Handler       → disputed, refunded, cancelled
--   DELETE: BLOQUEADO. Usar status = 'cancelled'.
-- ═══════════════════════════════════════════════════════════════════════════
alter table public.orders enable row level security;

create policy "orders_select_participants_or_staff"
  on public.orders for select
  using (
    auth.uid() = buyer_id
    or auth.uid() = seller_id
    or public.is_staff()
  );

create policy "orders_insert_buyer"
  on public.orders for insert
  with check (
    auth.uid() = buyer_id
    and auth.uid() != seller_id  -- impedir self-buy
  );

-- UPDATE: sem policy = bloqueado. Service_role apenas.
-- DELETE: sem policy = bloqueado. Usar status = 'cancelled'.


-- ═══════════════════════════════════════════════════════════════════════════
-- 10. ORDER_MESSAGES (chat do pedido)
--
-- Decisão:
--   SELECT: apenas participantes do pedido (join com orders).
--           Staff pode auditar (anti-bypass, disputas).
--   INSERT: sender autenticado + participante do pedido + order em
--           status que permite comunicação:
--             • paid        → compra confirmada, chat aberto
--             • in_delivery → vendedor entregando, chat aberto
--             • delivered   → buyer confirmou, chat aberto para review
--             • disputed    → disputa aberta, chat aberto para mediação
--           Mensagens de sistema (sender_id = null, type = 'system')
--           são inseridas via service_role.
--   UPDATE: BLOQUEADO. Mensagens são imutáveis (trilha de auditoria).
--   DELETE: BLOQUEADO. Mesmo motivo.
-- ═══════════════════════════════════════════════════════════════════════════
alter table public.order_messages enable row level security;

create policy "messages_select_participants_or_staff"
  on public.order_messages for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id
        and (o.buyer_id = auth.uid() or o.seller_id = auth.uid())
    )
    or public.is_staff()
  );

create policy "messages_insert_participant_valid_status"
  on public.order_messages for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.orders o
      where o.id = order_id
        and (o.buyer_id = auth.uid() or o.seller_id = auth.uid())
        and o.status in ('paid', 'in_delivery', 'delivered', 'disputed')
    )
  );

-- UPDATE: sem policy = bloqueado. Mensagens imutáveis.
-- DELETE: sem policy = bloqueado. Trilha de auditoria.


-- ═══════════════════════════════════════════════════════════════════════════
-- 11. ORDER_REVIEWS
--
-- Decisão: avaliações são públicas (geram a reputação visível na vitrine).
-- INSERT permitido apenas para participantes de orders finalizadas.
-- A UNIQUE(order_id, reviewer_id) no schema impede avaliação duplicada.
-- reviewer_id != reviewed_id impede auto-avaliação.
-- UPDATE/DELETE bloqueados: avaliações são permanentes.
-- ═══════════════════════════════════════════════════════════════════════════
alter table public.order_reviews enable row level security;

create policy "reviews_select_public"
  on public.order_reviews for select
  using (true);

create policy "reviews_insert_participant"
  on public.order_reviews for insert
  with check (
    auth.uid() = reviewer_id
    and auth.uid() != reviewed_id
    and exists (
      select 1 from public.orders o
      where o.id = order_id
        and (o.buyer_id = auth.uid() or o.seller_id = auth.uid())
        and o.status in ('delivered', 'completed')
    )
  );

-- UPDATE: sem policy = bloqueado. Avaliações permanentes.
-- DELETE: sem policy = bloqueado. Avaliações permanentes.


-- ═══════════════════════════════════════════════════════════════════════════
-- 12. ANNOUNCEMENT_COMMENTS (Q&A público)
--
-- Decisão: perguntas e respostas são públicas (ajudam todos os compradores).
-- Qualquer autenticado pode perguntar. O dono do comentário ou staff
-- podem editar (ex: remover info pessoal acidentalmente postada).
-- DELETE bloqueado: usar status = false para ocultar.
-- ═══════════════════════════════════════════════════════════════════════════
alter table public.announcement_comments enable row level security;

create policy "comments_select_public"
  on public.announcement_comments for select
  using (true);

create policy "comments_insert_auth"
  on public.announcement_comments for insert
  with check (auth.uid() = user_id);

create policy "comments_update_own_or_staff"
  on public.announcement_comments for update
  using (
    auth.uid() = user_id
    or public.is_staff()
  );

-- DELETE: sem policy = bloqueado. Usar status = false.


-- ═══════════════════════════════════════════════════════════════════════════
-- 13. WISHLIST
--
-- Decisão: lista de favoritos é privada (somente o dono vê os seus).
-- INSERT/DELETE permitidos para o dono (favoritar/desfavoritar).
-- UNIQUE(user_id, announcement_id) no schema impede duplicatas.
-- ═══════════════════════════════════════════════════════════════════════════
alter table public.wishlist enable row level security;

create policy "wishlist_select_own"
  on public.wishlist for select
  using (auth.uid() = user_id);

create policy "wishlist_insert_own"
  on public.wishlist for insert
  with check (auth.uid() = user_id);

create policy "wishlist_delete_own"
  on public.wishlist for delete
  using (auth.uid() = user_id);


-- ═══════════════════════════════════════════════════════════════════════════
-- 14. WALLET_TRANSACTIONS
--
-- ⚠️  TABELA FINANCEIRA — ESCRITA BLOQUEADA ⚠️
--
-- Decisão: o extrato é visível APENAS para o próprio usuário.
-- Staff pode auditar para disputas e compliance.
-- INSERT/UPDATE/DELETE: service_role APENAS. Cada centavo movimentado
-- passa por validação server-side (Route Handlers, Edge Functions).
-- ═══════════════════════════════════════════════════════════════════════════
alter table public.wallet_transactions enable row level security;

create policy "wallet_select_own_or_staff"
  on public.wallet_transactions for select
  using (
    auth.uid() = user_id
    or public.is_staff()
  );

-- INSERT/UPDATE/DELETE: sem policies = bloqueado. Service_role apenas.


-- ═══════════════════════════════════════════════════════════════════════════
-- 15. WITHDRAWAL_REQUESTS
--
-- ⚠️  TABELA FINANCEIRA — UPDATE/DELETE BLOQUEADOS ⚠️
--
-- Decisão: o vendedor pode VER suas solicitações e CRIAR novas.
-- A validação de saldo mínimo (R$ 10) e KYC completo é feita
-- no Route Handler, não no RLS (RLS não acessa wallet_balance).
-- UPDATE (aprovação/rejeição) é feito por service_role no backend.
-- Staff pode consultar todas as solicitações.
-- ═══════════════════════════════════════════════════════════════════════════
alter table public.withdrawal_requests enable row level security;

create policy "withdrawals_select_own_or_staff"
  on public.withdrawal_requests for select
  using (
    auth.uid() = user_id
    or public.is_staff()
  );

create policy "withdrawals_insert_own"
  on public.withdrawal_requests for insert
  with check (auth.uid() = user_id);

-- UPDATE: sem policy = bloqueado. Aprovação via service_role.
-- DELETE: sem policy = bloqueado.


-- ═══════════════════════════════════════════════════════════════════════════
-- 16. POINTS_TRANSACTIONS
--
-- ⚠️  TABELA FINANCEIRA — ESCRITA BLOQUEADA ⚠️
--
-- Decisão: mesma lógica de wallet_transactions. O usuário só consulta
-- seu próprio histórico de GG Points. Staff pode auditar.
-- Toda movimentação é feita via service_role.
-- ═══════════════════════════════════════════════════════════════════════════
alter table public.points_transactions enable row level security;

create policy "points_select_own_or_staff"
  on public.points_transactions for select
  using (
    auth.uid() = user_id
    or public.is_staff()
  );

-- INSERT/UPDATE/DELETE: sem policies = bloqueado. Service_role apenas.


-- ═══════════════════════════════════════════════════════════════════════════
-- 17. REPORTS (denúncias)
--
-- Decisão: o denunciante vê suas próprias denúncias (acompanhar status).
-- Staff vê TODAS as denúncias (fila de moderação).
-- Qualquer autenticado pode criar denúncia.
-- UPDATE (resolução) é restrito a staff.
-- DELETE bloqueado: registro de denúncia é permanente.
-- ═══════════════════════════════════════════════════════════════════════════
alter table public.reports enable row level security;

create policy "reports_select_own_or_staff"
  on public.reports for select
  using (
    auth.uid() = reporter_id
    or public.is_staff()
  );

create policy "reports_insert_auth"
  on public.reports for insert
  with check (auth.uid() = reporter_id);

create policy "reports_update_staff"
  on public.reports for update
  using (public.is_staff());

-- DELETE: sem policy = bloqueado.


-- ═══════════════════════════════════════════════════════════════════════════
-- 18. NOTIFICATIONS
--
-- Decisão: notificações são privadas do destinatário.
-- SELECT: apenas o dono.
-- UPDATE: apenas o dono (marcar is_read = true).
-- INSERT: service_role apenas (sistema gera notificações).
-- DELETE: bloqueado.
-- ═══════════════════════════════════════════════════════════════════════════
alter table public.notifications enable row level security;

create policy "notifications_select_own"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "notifications_update_own"
  on public.notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- INSERT: sem policy = service_role apenas (geradas pelo sistema).
-- DELETE: sem policy = bloqueado.


-- ═══════════════════════════════════════════════════════════════════════════
-- 19. BLOG_POSTS
--
-- Decisão: posts publicados são públicos (SEO). Rascunhos visíveis
-- apenas para o autor e staff. Escrita inteira restrita a staff.
-- DELETE permitido para staff (limpeza editorial).
-- ═══════════════════════════════════════════════════════════════════════════
alter table public.blog_posts enable row level security;

create policy "blog_select_published_or_staff"
  on public.blog_posts for select
  using (
    is_published = true
    or auth.uid() = author_id
    or public.is_staff()
  );

create policy "blog_insert_staff"
  on public.blog_posts for insert
  with check (public.is_staff());

create policy "blog_update_staff"
  on public.blog_posts for update
  using (public.is_staff());

create policy "blog_delete_staff"
  on public.blog_posts for delete
  using (public.is_staff());


-- ═══════════════════════════════════════════════════════════════════════════
-- 20. ACCOUNT_VERIFIER (base antifraude)
--
-- Decisão: consulta pública (qualquer comprador pode verificar se uma
-- conta é fraudulenta antes de comprar). Escrita restrita a staff.
-- DELETE permitido para staff (remover falsos positivos).
-- ═══════════════════════════════════════════════════════════════════════════
alter table public.account_verifier enable row level security;

create policy "verifier_select_public"
  on public.account_verifier for select
  using (true);

create policy "verifier_insert_staff"
  on public.account_verifier for insert
  with check (public.is_staff());

create policy "verifier_update_staff"
  on public.account_verifier for update
  using (public.is_staff());

create policy "verifier_delete_staff"
  on public.account_verifier for delete
  using (public.is_staff());