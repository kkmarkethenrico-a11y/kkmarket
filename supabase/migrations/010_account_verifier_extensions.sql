-- Migration 010: Account Verifier extensions
-- Adds public report fields + status enum + indexes.

-- Allow anonymous (logged-out) reports: store optional reporter_email.
-- Existing reported_by remains for logged-in reporters (FK to profiles).
alter table public.account_verifier
  add column if not exists evidence_url    text,
  add column if not exists reporter_email  varchar(200),
  add column if not exists moderator_note  text,
  add column if not exists moderated_at    timestamptz;

-- Status values used by the application:
--   'pending'    — submitted by users, awaiting moderation (NOT shown publicly)
--   'fraudulent' — confirmed by staff (shown publicly, red)
--   'suspicious' — flagged by staff (shown publicly, amber)
--   'rejected'   — staff dismissed the report (NOT shown publicly)
-- We intentionally keep `status varchar(20)` from 001 (no enum) for flexibility.

-- Public lookup index: case-insensitive identifier search on visible records.
create index if not exists idx_verifier_identifier_visible
  on public.account_verifier (lower(identifier))
  where status in ('fraudulent', 'suspicious');

-- Admin queue index
create index if not exists idx_verifier_pending_created
  on public.account_verifier (created_at desc)
  where status = 'pending';

-- Tighten RLS: public SELECT was unrestricted; restrict to visible statuses.
-- Staff continues to bypass via is_staff() admin client.
drop policy if exists "verifier_select_public" on public.account_verifier;
create policy "verifier_select_public"
  on public.account_verifier for select
  using (status in ('fraudulent', 'suspicious'));

create policy "verifier_select_staff_all"
  on public.account_verifier for select
  using (public.is_staff());
