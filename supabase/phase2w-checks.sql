-- Phase 2w live checks — run AFTER phase2w-v201.sql.
--
-- Everything happens inside one transaction that is rolled back at the end:
-- a made-up building, its manager, a flat's owner and its tenant (renter)
-- with made-up phones; nothing is kept.
--
-- Run in: SQL Editor -> paste -> Run ("Run without RLS" if asked).
-- Every row of the result should say ok = true.

begin;

create temp table r (n serial, name text, ok boolean);
grant all on r to anon, authenticated;
grant usage on sequence r_n_seq to anon, authenticated;

create function pg_temp.fails(p_sql text) returns boolean language plpgsql as $$
begin
  execute p_sql;
  return false;
exception when others then
  return true;
end;
$$;

insert into auth.users (id, aud, role, email, is_anonymous)
values ('00000000-0000-4000-a000-000000000801', 'authenticated', 'authenticated', 'check-manager-z1@example.invalid', false),
       ('00000000-0000-4000-a000-000000000802', 'authenticated', 'authenticated', 'check-owner-z1@example.invalid', true),
       ('00000000-0000-4000-a000-000000000803', 'authenticated', 'authenticated', 'check-renter-z1@example.invalid', true);

insert into public.building_state (id, state, rev) values
  ('zzcheckz', '{"building":{"name":"Check Z"},"settings":{"language":"en"},
                 "tenants":[{"id":"fz1","name":"Owner Z1","unit":"Z1","active":true}],"transactions":[]}', 1);

insert into public.leases (id, building_id, flat_id, data, rev) values
  ('zz-lease-z1', 'zzcheckz', 'fz1', '{"tenant":{"name":"Renter Z1"},"rent":500,"start":"2025-01-01","status":"active"}', 1);

insert into public.memberships (auth_user_id, building_id, role, tenant_id, lease_id) values
  ('00000000-0000-4000-a000-000000000801', 'zzcheckz', 'owner', null, null),
  ('00000000-0000-4000-a000-000000000802', 'zzcheckz', 'tenant', 'fz1', null),
  ('00000000-0000-4000-a000-000000000803', 'zzcheckz', 'renter', 'fz1', 'zz-lease-z1');

insert into public.push_subscriptions (endpoint, auth_user_id, role, tenant_id, p256dh, auth) values
  ('https://fcm.googleapis.com/zz-check-z-owner1', '00000000-0000-4000-a000-000000000802', 'tenant', 'fz1', 'k', 'a'),
  ('https://fcm.googleapis.com/zz-check-z-renter1', '00000000-0000-4000-a000-000000000803', 'renter', 'fz1', 'k', 'a');

-- ── The flat's owner (not the manager) can't use it ──
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', '00000000-0000-4000-a000-000000000802', 'role', 'authenticated', 'is_anonymous', true)::text, true);
select set_config('request.headers', '{}', true);
insert into r (name, ok) select 'an owner''s phone can''t send it',
  pg_temp.fails($$select public.notify_flat_owner('fz1', 'x', 'y')$$);

-- ── The building manager ──
select set_config('request.jwt.claims', json_build_object('sub', '00000000-0000-4000-a000-000000000801', 'role', 'authenticated', 'is_anonymous', false)::text, true);
insert into r (name, ok) select 'the manager sends it',
  not pg_temp.fails($$select public.notify_flat_owner('fz1', 'Rent handed over to you', '$990.00 on 24 October 2026.')$$);
insert into r (name, ok) select 'a flat is needed',
  pg_temp.fails($$select public.notify_flat_owner('', 'x', 'y')$$);

reset role;
insert into r (name, ok) select 'one job for the flat''s owner',
  (select count(*) from public.push_jobs where building_id = 'zzcheckz' and target = 'owner' and tenant_id = 'fz1' and title = 'Rent handed over to you') = 1;
insert into r (name, ok) select 'it reaches the owner''s phone, not the tenant''s',
  (select public.claim_push_job(id) from public.push_jobs where building_id = 'zzcheckz' and target = 'owner' and tenant_id = 'fz1')->'subscriptions'
    = '[{"endpoint":"https://fcm.googleapis.com/zz-check-z-owner1","keys":{"p256dh":"k","auth":"a"}}]'::jsonb;

select n, name, ok from r order by n;
rollback;
