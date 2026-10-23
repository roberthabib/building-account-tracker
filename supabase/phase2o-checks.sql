-- Phase 2o live checks — run AFTER phase2o-v179.sql.
--
-- Everything happens inside one transaction that is rolled back at the end:
-- a made-up building with two flats, its manager, the two owners, a tenant
-- (renter), a view-only helper and a made-up lease; nothing is kept.
--
-- Run in: SQL Editor -> paste -> Run ("Run without RLS" if asked).
-- Every row of the result should say ok = true.

begin;

create temp table r (n serial, name text, ok boolean);
grant all on r to authenticated;
grant usage on sequence r_n_seq to authenticated;
create temp table v (k text primary key, val text);
grant all on v to authenticated;

create function pg_temp.fails(p_sql text) returns boolean language plpgsql as $$
begin
  execute p_sql;
  return false;
exception when others then
  return true;
end;
$$;

create function pg_temp.as_user(p_id text, p_anon boolean, p_building text) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', p_id, 'role', 'authenticated', 'is_anonymous', p_anon)::text, true);
  perform set_config('request.headers',
    case when p_building is null then '{}' else json_build_object('x-building', p_building)::text end, true);
end;
$$;

insert into auth.users (id, aud, role, email, is_anonymous)
values ('00000000-0000-4000-a000-000000000301', 'authenticated', 'authenticated', 'check-manager-t@example.invalid', false),
       ('00000000-0000-4000-a000-000000000302', 'authenticated', 'authenticated', 'check-owner-t1@example.invalid', true),
       ('00000000-0000-4000-a000-000000000303', 'authenticated', 'authenticated', 'check-renter-t1@example.invalid', true),
       ('00000000-0000-4000-a000-000000000304', 'authenticated', 'authenticated', 'check-owner-t2@example.invalid', true),
       ('00000000-0000-4000-a000-000000000305', 'authenticated', 'authenticated', 'check-viewer-t@example.invalid', false),
       ('00000000-0000-4000-a000-000000000306', 'authenticated', 'authenticated', 'check-late-renter@example.invalid', true),
       ('00000000-0000-4000-a000-000000000307', 'authenticated', 'authenticated', 'check-manager-u@example.invalid', false);

insert into public.building_state (id, state, rev) values
  ('zzcheckt', '{"building":{"name":"Check T"},"settings":{"language":"en","collectionMode":"fixed"},
                 "tenants":[{"id":"fo1","name":"Owner One","unit":"T1","phone":"70000011","active":true,"coefficient":500},
                            {"id":"fo2","name":"Owner Two","unit":"T2","phone":"70000012","active":true,"coefficient":500}],
                 "polls":[{"id":"zz-poll","title":"Paint?","status":"open","votes":{}}],
                 "meetings":[{"id":"zz-meeting","title":"Owners meeting"}],
                 "transactions":[],"paymentDeclarations":[]}', 1),
  ('zzchecku', '{"building":{"name":"Check U"},"tenants":[]}', 1);

insert into public.memberships (auth_user_id, building_id, role, tenant_id) values
  ('00000000-0000-4000-a000-000000000301', 'zzcheckt', 'owner', null),
  ('00000000-0000-4000-a000-000000000302', 'zzcheckt', 'tenant', 'fo1'),
  ('00000000-0000-4000-a000-000000000304', 'zzcheckt', 'tenant', 'fo2'),
  ('00000000-0000-4000-a000-000000000305', 'zzcheckt', 'viewer', null),
  ('00000000-0000-4000-a000-000000000307', 'zzchecku', 'owner', null);

insert into public.leases (id, building_id, flat_id, data, rev) values
  ('zz-check-lease-t', 'zzcheckt', 'fo1',
   '{"tenant":{"name":"Renter One","phone":"71000001"},"rent":650,"currency":"USD","period":"monthly","start":"2026-09-01","status":"active",
     "fee":{"kind":"percent","value":10},"payouts":[{"id":"o1","amount":500}],"deductions":[],"notes":"private note","payments":[{"id":"p1","date":"2026-09-02","amount":650}]}', 1);

insert into public.push_subscriptions (endpoint, auth_user_id, role, tenant_id, p256dh, auth) values
  ('https://fcm.googleapis.com/zz-check-t-renter', '00000000-0000-4000-a000-000000000303', 'renter', 'fo1', 'k', 'a');

set local role authenticated;

-- ── The manager invites the tenant ──
select pg_temp.as_user('00000000-0000-4000-a000-000000000301', false, 'zzcheckt');
insert into v select 'code', public.create_renter_code('zz-check-lease-t');
insert into v select 'code2', public.create_renter_code('zz-check-lease-t');
insert into r (name, ok) select 'manager: creates a tenant invite for the lease', (select val from v where k = 'code') is not null;
insert into r (name, ok) select 'manager: an unknown lease is refused', pg_temp.fails($$select public.create_renter_code('zz-no-such-lease')$$);

select pg_temp.as_user('00000000-0000-4000-a000-000000000305', false, 'zzcheckt');
insert into r (name, ok) select 'view-only helper: cannot invite tenants', pg_temp.fails($$select public.create_renter_code('zz-check-lease-t')$$);
select pg_temp.as_user('00000000-0000-4000-a000-000000000307', false, 'zzchecku');
insert into r (name, ok) select 'another building''s manager: cannot invite for this lease', pg_temp.fails($$select public.create_renter_code('zz-check-lease-t')$$);

-- ── The tenant links their phone ──
select pg_temp.as_user('00000000-0000-4000-a000-000000000303', true, null);
insert into r (name, ok) select 'tenant: the code links the phone to the flat', public.claim_tenant((select val from v where k = 'code')) = 'fo1';
insert into r (name, ok) select 'tenant: pays for flat T1 as a renter', public.my_tenant_id() = 'fo1' and public.is_renter();
insert into v select 'renterState', public.get_my_state()::text;
insert into r (name, ok) select 'tenant: sees their rent', ((select val from v where k = 'renterState')::jsonb->'myLease'->>'rent')::int = 650
  and (select val from v where k = 'renterState')::jsonb->>'myRole' = 'renter';
insert into r (name, ok) select 'tenant: not the manager''s fee, hand-overs or notes',
  not ((select val from v where k = 'renterState')::jsonb->'myLease' ?| array['fee', 'payouts', 'deductions', 'notes']);
insert into r (name, ok) select 'tenant: no votes, no owners'' meetings, no directory',
  not ((select val from v where k = 'renterState')::jsonb ?| array['polls', 'meetings', 'directory']);
insert into r (name, ok) select 'tenant: the flat without the owner''s phone',
  (select val from v where k = 'renterState')::jsonb->'tenants'->0->>'unit' = 'T1'
  and not ((select val from v where k = 'renterState')::jsonb->'tenants'->0 ? 'phone');
insert into r (name, ok) select 'tenant: cannot vote', pg_temp.fails($$select public.cast_my_vote('zz-poll', 'yes')$$);
insert into r (name, ok) select 'tenant: cannot change the owner''s details', pg_temp.fails($$select public.update_my_details('70000099', 'en')$$);
insert into r (name, ok) select 'tenant: cannot change the directory choice', pg_temp.fails($$select public.set_directory_optin(true)$$);
insert into r (name, ok) select 'tenant: can say they paid the building charges', not pg_temp.fails($$select public.declare_my_payment('2026-10-01', 120, null)$$);

-- ── The owners ──
select pg_temp.as_user('00000000-0000-4000-a000-000000000302', true, null);
insert into v select 'ownerState', public.get_my_state()::text;
insert into r (name, ok) select 'owner: sees their rented flat''s account',
  jsonb_array_length((select val from v where k = 'ownerState')::jsonb->'myRentals') = 1
  and ((select val from v where k = 'ownerState')::jsonb->'myRentals'->0->'fee'->>'value')::int = 10
  and not ((select val from v where k = 'ownerState')::jsonb->'myRentals'->0 ? 'notes');
insert into r (name, ok) select 'owner: still votes', jsonb_array_length((select val from v where k = 'ownerState')::jsonb->'polls') = 1;
select pg_temp.as_user('00000000-0000-4000-a000-000000000304', true, null);
insert into r (name, ok) select 'other owner: no rent of another flat', jsonb_array_length(public.get_my_state()->'myRentals') = 0;

reset role;

-- Notices for flat T1 reach its tenant's phone.
select set_config('app.building', 'zzcheckt', true);
select public.enqueue_push('tenants', 'fo1', 'zz-check T1', 'x');
select set_config('app.building', '', true);
insert into r (name, ok) select 'a notice for the flat reaches the tenant',
  (select public.claim_push_job(id) from public.push_jobs where title = 'zz-check T1')->'subscriptions'
    @> '[{"endpoint":"https://fcm.googleapis.com/zz-check-t-renter"}]';

-- The lease ends: the tenant's phone loses access.
update public.leases set data = data || '{"status":"ended","endedOn":"2026-10-20"}' where id = 'zz-check-lease-t';
set local role authenticated;
select pg_temp.as_user('00000000-0000-4000-a000-000000000303', true, null);
insert into r (name, ok) select 'after the lease: the tenant pays for no flat', public.my_tenant_id() is null;
insert into r (name, ok) select 'after the lease: nothing to load', pg_temp.fails($$select public.get_my_state()$$);
insert into r (name, ok) select 'after the lease: cannot report or declare', pg_temp.fails($$select public.declare_my_payment('2026-10-01', 1, null)$$);
select pg_temp.as_user('00000000-0000-4000-a000-000000000306', true, null);
insert into r (name, ok) select 'after the lease: an old invite no longer works', pg_temp.fails(format($$select public.claim_tenant(%L)$$, (select val from v where k = 'code2')));
select pg_temp.as_user('00000000-0000-4000-a000-000000000301', false, 'zzcheckt');
insert into r (name, ok) select 'after the lease: no new invites', pg_temp.fails($$select public.create_renter_code('zz-check-lease-t')$$);

reset role;
select n, name, ok from r order by n;
rollback;
