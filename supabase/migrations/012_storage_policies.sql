-- ═══════════════════════════════════════════════════════════
-- Storage RLS Policies — kyc-docs / announcement-images / avatars
-- Convenção de path: <user_id>/<arquivo>
-- ═══════════════════════════════════════════════════════════

-- Limpa policies antigas (idempotente)
do $$
declare r record;
begin
  for r in select policyname from pg_policies where schemaname = 'storage' and tablename = 'objects'
           and policyname like 'kyc_%' or policyname like 'ann_%' or policyname like 'avatars_%'
  loop
    execute format('drop policy if exists %I on storage.objects', r.policyname);
  end loop;
end$$;

-- ───────── kyc-docs (privado) ─────────
-- INSERT: dono na pasta auth.uid()
create policy kyc_insert_own
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'kyc-docs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- SELECT: dono OU admin/moderator
create policy kyc_select_own_or_admin
  on storage.objects for select to authenticated
  using (
    bucket_id = 'kyc-docs'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or exists (
        select 1 from public.profiles
        where id = auth.uid() and role in ('admin','moderator')
      )
    )
  );

-- UPDATE/DELETE: dono ou admin
create policy kyc_modify_own_or_admin
  on storage.objects for update to authenticated
  using (
    bucket_id = 'kyc-docs'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','moderator'))
    )
  );

create policy kyc_delete_own_or_admin
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'kyc-docs'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','moderator'))
    )
  );

-- ───────── announcement-images (público) ─────────
create policy ann_select_public
  on storage.objects for select to public
  using (bucket_id = 'announcement-images');

create policy ann_insert_own
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'announcement-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy ann_update_own
  on storage.objects for update to authenticated
  using (
    bucket_id = 'announcement-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy ann_delete_own
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'announcement-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ───────── avatars (público) ─────────
create policy avatars_select_public
  on storage.objects for select to public
  using (bucket_id = 'avatars');

create policy avatars_insert_own
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy avatars_update_own
  on storage.objects for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy avatars_delete_own
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
