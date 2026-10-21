-- Phase 2l live checks — run AFTER phase2l-v173.sql.
--
-- Everything happens inside one transaction that is rolled back at the end:
-- two made-up buildings (A and B), a made-up manager of both, a tenant in
-- each, made-up photos and phones are created, used through the same
-- functions the app calls, and thrown away with every change they made.
-- The real building is only read.
--
-- Run in: SQL Editor -> paste -> Run. If the editor warns about a table
-- without RLS, that is the temporary results table: "Run without RLS".
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

create function pg_temp.state_name() returns text language plpgsql as $$
begin
  return coalesce(public.get_my_state()->'building'->>'name', '(none)');
exception when others then
  return '(refused)';
end;
$$;

-- Session helpers: who is calling, and which building the app asked for.
create function pg_temp.as_user(p_id text, p_anon boolean, p_building text) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', p_id, 'role', 'authenticated', 'is_anonymous', p_anon)::text, true);
  perform set_config('request.headers',
    case when p_building is null then '{}' else json_build_object('x-building', p_building)::text end, true);
end;
$$;

insert into auth.users (id, aud, role, email, is_anonymous)
values ('00000000-0000-4000-a000-0000000000f1', 'authenticated', 'authenticated', 'check-manager@example.invalid', false),
       ('00000000-0000-4000-a000-0000000000f2', 'authenticated', 'authenticated', 'check-tenant-a@example.invalid', true),
       ('00000000-0000-4000-a000-0000000000f3', 'authenticated', 'authenticated', 'check-tenant-b@example.invalid', true),
       ('00000000-0000-4000-a000-0000000000f4', 'authenticated', 'authenticated', 'check-new-phone@example.invalid', true),
       ('00000000-0000-4000-a000-0000000000f5', 'authenticated', 'authenticated', 'check-concierge-b@example.invalid', true);

insert into public.building_state (id, state, rev) values
  ('zzchecka', '{"building":{"name":"Check A"},"settings":{"collectionMode":"fixed"},
                 "tenants":[{"id":"fa","name":"Flat A","unit":"A1","active":true}],
                 "announcements":[{"id":"na","title":"A notice","body":"x","publishAt":"2020-01-01T00:00:00Z","sendPush":true}]}', 1),
  ('zzcheckb', '{"building":{"name":"Check B"},"settings":{"collectionMode":"fixed"},
                 "tenants":[{"id":"fb","name":"Flat B","unit":"B1","active":true},{"id":"fb2","name":"Flat B2","unit":"B2","active":true}],
                 "announcements":[]}', 1);

insert into public.memberships (auth_user_id, building_id, role, tenant_id) values
  ('00000000-0000-4000-a000-0000000000f1', 'zzchecka', 'owner', null),
  ('00000000-0000-4000-a000-0000000000f1', 'zzcheckb', 'owner', null),
  ('00000000-0000-4000-a000-0000000000f2', 'zzchecka', 'tenant', 'fa'),
  ('00000000-0000-4000-a000-0000000000f3', 'zzcheckb', 'tenant', 'fb');

insert into storage.objects (bucket_id, name) values
  ('invoices', 'b/zzchecka/2026/zz-check-inv.jpg'),
  ('invoices', 'b/zzcheckb/2026/zz-check-inv.jpg'),
  ('invoices', 'b/zzchecka/proofs/fa/zz-check-proof.jpg'),
  ('invoices', 'b/zzcheckb/proofs/fb/zz-check-proof.jpg'),
  ('invoices', 'zz-check/2026/zz-check-main.jpg');

insert into public.push_subscriptions (endpoint, auth_user_id, role, tenant_id, p256dh, auth) values
  ('https://fcm.googleapis.com/zz-check-manager', '00000000-0000-4000-a000-0000000000f1', 'owner', null, 'k', 'a'),
  ('https://fcm.googleapis.com/zz-check-tenant-a', '00000000-0000-4000-a000-0000000000f2', 'tenant', 'fa', 'k', 'a'),
  ('https://fcm.googleapis.com/zz-check-tenant-b', '00000000-0000-4000-a000-0000000000f3', 'tenant', 'fb', 'k', 'a');

set local role authenticated;

-- ── The manager of A and B ──
select pg_temp.as_user('00000000-0000-4000-a000-0000000000f1', false, 'zzchecka');
insert into r (name, ok) select 'manager: the app can choose building A', public.my_building() = 'zzchecka' and public.is_owner();
insert into r (name, ok) select 'manager: lists both buildings', (select count(*) from public.my_buildings()) = 2;
insert into r (name, ok) select 'manager: reads A and B', (select count(*) from public.building_state where id in ('zzchecka', 'zzcheckb')) = 2;
insert into r (name, ok) select 'manager of A and B: not the real building', not exists (select 1 from public.building_state where id = 'building');
insert into v values ('code-a', public.create_claim_code('fa'));
insert into r (name, ok) select 'manager: sees A''s photos', exists (select 1 from storage.objects where name = 'b/zzchecka/2026/zz-check-inv.jpg');
insert into r (name, ok) select 'manager: no photos of the real building', not exists (select 1 from storage.objects where name = 'zz-check/2026/zz-check-main.jpg');
insert into r (name, ok) select 'manager: can upload into A', not pg_temp.fails($$insert into storage.objects (bucket_id, name) values ('invoices', 'b/zzchecka/2026/zz-check-up.jpg')$$);
insert into r (name, ok) select 'manager: cannot upload into the real building', pg_temp.fails($$insert into storage.objects (bucket_id, name) values ('invoices', 'zz-check/2026/zz-check-up.jpg')$$);

select pg_temp.as_user('00000000-0000-4000-a000-0000000000f1', false, 'zzcheckb');
insert into r (name, ok) select 'manager: switching to B', public.my_building() = 'zzcheckb' and public.is_owner();
insert into v values ('code-b', public.create_claim_code('fb2'));
insert into v values ('invite-b', public.create_admin_invite('concierge'));
insert into r (name, ok) select 'manager: B''s administrators are B''s only', (select count(*) from public.list_admins()) = 1;

select pg_temp.as_user('00000000-0000-4000-a000-0000000000f1', false, 'building');
insert into r (name, ok) select 'a building you don''t belong to is refused', public.my_building() is null and not public.is_owner();
insert into r (name, ok) select 'refused building: no data', pg_temp.state_name() in ('(refused)', '(none)')
  and not exists (select 1 from public.building_state where id = 'building');
insert into r (name, ok) select 'refused building: no invite codes', pg_temp.fails($$select public.create_claim_code('x')$$);

-- ── Tenant of A (phone on the old app: no header) ──
select pg_temp.as_user('00000000-0000-4000-a000-0000000000f2', true, null);
insert into r (name, ok) select 'tenant A, no header: lands in A', public.my_building() = 'zzchecka' and public.my_tenant_id() = 'fa';
insert into r (name, ok) select 'tenant A: gets A''s data', pg_temp.state_name() = 'Check A';
insert into r (name, ok) select 'tenant A: sees A''s invoice', exists (select 1 from storage.objects where name = 'b/zzchecka/2026/zz-check-inv.jpg');
insert into r (name, ok) select 'tenant A: sees own proof', exists (select 1 from storage.objects where name = 'b/zzchecka/proofs/fa/zz-check-proof.jpg');
insert into r (name, ok) select 'tenant A: no B invoice', not exists (select 1 from storage.objects where name = 'b/zzcheckb/2026/zz-check-inv.jpg');
insert into r (name, ok) select 'tenant A: no B proof', not exists (select 1 from storage.objects where name = 'b/zzcheckb/proofs/fb/zz-check-proof.jpg');
insert into r (name, ok) select 'tenant A: no real-building photo', not exists (select 1 from storage.objects where name = 'zz-check/2026/zz-check-main.jpg');
insert into r (name, ok) select 'tenant A: uploads a proof into A', not pg_temp.fails($$insert into storage.objects (bucket_id, name) values ('invoices', 'b/zzchecka/proofs/fa/zz-check-new.jpg')$$);
insert into r (name, ok) select 'tenant A: cannot upload into B', pg_temp.fails($$insert into storage.objects (bucket_id, name) values ('invoices', 'b/zzcheckb/proofs/fa/zz-check-new.jpg')$$);
insert into r (name, ok) select 'tenant A: says they paid, proof in A', not pg_temp.fails($$select public.declare_my_payment('2026-10-01', 50, 'b/zzchecka/proofs/fa/zz-check-new.jpg')$$);
insert into r (name, ok) select 'tenant A: proof from B refused', pg_temp.fails($$select public.declare_my_payment('2026-10-01', 50, 'b/zzcheckb/proofs/fa/zz-check-new.jpg')$$);
insert into r (name, ok) select 'tenant A: cannot add a building', pg_temp.fails($$select public.create_building('Mine')$$);

select pg_temp.as_user('00000000-0000-4000-a000-0000000000f2', true, 'zzcheckb');
insert into r (name, ok) select 'tenant A asking for B: refused', public.my_building() is null and pg_temp.state_name() in ('(refused)', '(none)');

-- ── Tenant of B ──
select pg_temp.as_user('00000000-0000-4000-a000-0000000000f3', true, 'zzcheckb');
insert into r (name, ok) select 'tenant B: gets B''s data', pg_temp.state_name() = 'Check B' and public.my_tenant_id() = 'fb';
insert into r (name, ok) select 'tenant B: no A invoice', not exists (select 1 from storage.objects where name = 'b/zzchecka/2026/zz-check-inv.jpg');

-- ── A new phone joins B with B's invite code ──
select pg_temp.as_user('00000000-0000-4000-a000-0000000000f4', true, null);
insert into r (name, ok) select 'new phone: B''s code links to B''s flat', public.claim_tenant((select val from v where k = 'code-b')) = 'fb2';
insert into r (name, ok) select 'new phone: lands in B', public.my_building() = 'zzcheckb' and pg_temp.state_name() = 'Check B';

-- ── A concierge joins B ──
select pg_temp.as_user('00000000-0000-4000-a000-0000000000f5', true, null);
insert into r (name, ok) select 'concierge: B''s invite is a concierge invite', public.claim_admin_invite((select val from v where k = 'invite-b')) = 'concierge';
insert into r (name, ok) select 'concierge: lands in B as its concierge', public.my_building() = 'zzcheckb' and public.is_concierge();

-- ── The manager adds a building ──
select pg_temp.as_user('00000000-0000-4000-a000-0000000000f1', false, null);
insert into v values ('new-building', public.create_building('Check C'));
insert into r (name, ok) select 'manager: new building is listed', (select count(*) from public.my_buildings()) = 3
  and exists (select 1 from public.my_buildings() where name = 'Check C' and role = 'owner');

reset role;

insert into r (name, ok) select 'A''s invite code belongs to A', (select building_id from public.claim_codes where code = (select val from v where k = 'code-a')) = 'zzchecka';
insert into r (name, ok) select 'tenant A''s payment landed in A only',
  jsonb_array_length(coalesce((select state->'paymentDeclarations' from public.building_state where id = 'zzchecka'), '[]')) = 1
  and jsonb_array_length(coalesce((select state->'paymentDeclarations' from public.building_state where id = 'zzcheckb'), '[]')) = 0;

-- Notifications go to the people of the job's building only.
select set_config('app.building', 'zzcheckb', true);
select public.enqueue_push('tenants', null, 'zz-check B', 'x');
select set_config('app.building', 'zzchecka', true);
select public.enqueue_push('admins', null, 'zz-check A', 'x');
select set_config('app.building', '', true);
insert into r (name, ok) select 'push to B''s tenants reaches B''s phones only', (
  select x->'subscriptions' @> '[{"endpoint":"https://fcm.googleapis.com/zz-check-tenant-b"}]'
     and jsonb_array_length(x->'subscriptions') = 1
    from (select public.claim_push_job(id) x from public.push_jobs where title = 'zz-check B') q);
insert into r (name, ok) select 'push to A''s managers says which building', (
  select x->>'title' like 'Check A · %' and jsonb_array_length(x->'subscriptions') = 1
    from (select public.claim_push_job(id) x from public.push_jobs where title = 'zz-check A') q);

-- Scheduled jobs run building by building.
select public.send_due_notices();
insert into r (name, ok) select 'scheduled notice sent in A',
  (select state->'announcements'->0->>'pushedAt' from public.building_state where id = 'zzchecka') is not null
  and exists (select 1 from public.push_jobs where building_id = 'zzchecka' and title like '%A notice');
select public.snapshot_building();
insert into r (name, ok) select 'daily backup made for A and for B',
  (select count(*) from public.building_backups where building_id in ('zzchecka', 'zzcheckb') and day = current_date) = 2;
insert into r (name, ok) select 'the real building''s backup is still there',
  not exists (select 1 from public.building_state where id = 'building')
  or exists (select 1 from public.building_backups where building_id = 'building');

set local role authenticated;
select pg_temp.as_user('00000000-0000-4000-a000-0000000000f1', false, 'zzchecka');
insert into r (name, ok) select 'manager in A: restores A''s backup, not B''s', (public.get_backup(current_date)->'building'->>'name') = 'Check A';
reset role;

select n, name, ok from r order by n;
rollback;
