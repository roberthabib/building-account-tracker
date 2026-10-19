-- Phase 2d — step 7: lock the shared key out of the data
--
-- Before this, anyone holding the publishable key (it ships inside the web
-- app, so: anyone) could read, change or wipe the building's data and photos.
-- After it:
--   * the owner reaches everything through their Google sign-in (phase2b),
--   * a linked tenant phone reaches only get_my_state() / its own writes,
--   * the shared key can only call keepalive() and the sign-in endpoints.
--
-- Prerequisites (checked 2026-10-19): owner's Google session in daily use;
-- phase2b + phase2c applied; app >= v144 (keep-alive on rpc/keepalive).
--
-- Run in: Supabase dashboard -> SQL Editor -> New query -> paste -> Run.

-- ── The state document ─────────────────────────────────────────────────────
drop policy if exists "anon read building_state"   on public.building_state;
drop policy if exists "anon insert building_state" on public.building_state;
drop policy if exists "anon update building_state" on public.building_state;
revoke select, insert, update, delete on public.building_state from anon;

-- ── Invoice photos ─────────────────────────────────────────────────────────
drop policy if exists "anon upload invoices" on storage.objects;
drop policy if exists "anon read invoices"   on storage.objects;

-- ── Disable (not delete) identities that must not act any more ─────────────
-- * every anonymous identity that exists right now was created while testing
--   (no real tenant has linked a phone yet), one of them linked to tenant 1A;
-- * the never-used robert-habib@hotmail.com owner account (unknown password).
-- A banned user can no longer sign in or refresh a session. Reversible:
--   update auth.users set banned_until = null where id = '<id>';
update auth.users
   set banned_until = 'infinity'
 where (is_anonymous and created_at < now())
    or email = 'robert-habib@hotmail.com';

-- ── UNDO (only if something is badly wrong) ────────────────────────────────
-- grant select, insert, update on public.building_state to anon;
-- create policy "anon read building_state"   on public.building_state for select to anon using (true);
-- create policy "anon insert building_state" on public.building_state for insert to anon with check (true);
-- create policy "anon update building_state" on public.building_state for update to anon using (true) with check (true);
-- create policy "anon upload invoices" on storage.objects for insert to anon with check (bucket_id = 'invoices');
-- create policy "anon read invoices"   on storage.objects for select to anon using (bucket_id = 'invoices');
