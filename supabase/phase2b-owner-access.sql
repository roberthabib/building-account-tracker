-- Phase 2b — let the signed-in OWNER reach the data (step 5 of the runbook)
--
-- A signed-in session runs as the `authenticated` role. schema.sql only ever
-- granted access to `anon` (the shared publishable key), so without this the
-- owner's own login would be refused. This ADDS owner access and removes
-- nothing: the shared key keeps working until step 7.
--
-- Tenants (also `authenticated`, via anonymous sign-in + claim code) are NOT
-- covered by these policies, because is_owner() is false for them. They keep
-- reading through get_my_state().
--
-- Run in: Supabase dashboard -> SQL Editor -> New query -> paste -> Run.
-- Safe to re-run.

-- ── The state document ─────────────────────────────────────────────────────
grant select, insert, update on public.building_state to authenticated;

drop policy if exists "owner reads building_state"   on public.building_state;
drop policy if exists "owner inserts building_state" on public.building_state;
drop policy if exists "owner updates building_state" on public.building_state;

create policy "owner reads building_state"
  on public.building_state for select to authenticated
  using (public.is_owner());

create policy "owner inserts building_state"
  on public.building_state for insert to authenticated
  with check (public.is_owner());

create policy "owner updates building_state"
  on public.building_state for update to authenticated
  using (public.is_owner()) with check (public.is_owner());

-- ── Invoice photos ─────────────────────────────────────────────────────────
-- The bucket stays public, so photo URLs keep opening without a key. These
-- only cover uploading (insert) and API reads for the owner's session.
drop policy if exists "owner upload invoices" on storage.objects;
drop policy if exists "owner read invoices"   on storage.objects;

create policy "owner upload invoices"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'invoices' and public.is_owner());

create policy "owner read invoices"
  on storage.objects for select to authenticated
  using (bucket_id = 'invoices' and public.is_owner());
