-- Phase 2m live checks — run AFTER phase2m-v174.sql.
--
-- Everything happens inside one transaction that is rolled back at the end:
-- a made-up building with two flats, its manager, a view-only helper and two
-- tenant phones make technician requests, photos and notebook entries
-- through the same functions the app calls; all of it is thrown away.
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

create function pg_temp.as_user(p_id text, p_anon boolean) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', p_id, 'role', 'authenticated', 'is_anonymous', p_anon)::text, true);
  perform set_config('request.headers', '{}', true);
end;
$$;

insert into auth.users (id, aud, role, email, is_anonymous)
values ('00000000-0000-4000-a000-000000000101', 'authenticated', 'authenticated', 'check-manager-m@example.invalid', false),
       ('00000000-0000-4000-a000-000000000102', 'authenticated', 'authenticated', 'check-tenant-m1@example.invalid', true),
       ('00000000-0000-4000-a000-000000000103', 'authenticated', 'authenticated', 'check-tenant-m2@example.invalid', true),
       ('00000000-0000-4000-a000-000000000104', 'authenticated', 'authenticated', 'check-viewer-m@example.invalid', false);

insert into public.building_state (id, state, rev) values
  ('zzcheckm', '{"building":{"name":"Check M"},"settings":{"language":"en"},
                 "tenants":[{"id":"fm1","name":"Flat One","unit":"M1","phone":"70000001","active":true},
                            {"id":"fm2","name":"Flat Two","unit":"M2","active":true}]}', 1);

insert into public.memberships (auth_user_id, building_id, role, tenant_id) values
  ('00000000-0000-4000-a000-000000000101', 'zzcheckm', 'owner', null),
  ('00000000-0000-4000-a000-000000000102', 'zzcheckm', 'tenant', 'fm1'),
  ('00000000-0000-4000-a000-000000000103', 'zzcheckm', 'tenant', 'fm2'),
  ('00000000-0000-4000-a000-000000000104', 'zzcheckm', 'viewer', null);

insert into public.push_subscriptions (endpoint, auth_user_id, role, tenant_id, p256dh, auth) values
  ('https://fcm.googleapis.com/zz-check-m-manager', '00000000-0000-4000-a000-000000000101', 'owner', null, 'k', 'a'),
  ('https://fcm.googleapis.com/zz-check-m-tenant1', '00000000-0000-4000-a000-000000000102', 'tenant', 'fm1', 'k', 'a');

insert into storage.objects (bucket_id, name) values
  ('invoices', 'b/zzcheckm/requests/fm1/zz-check-sink.jpg');

set local role authenticated;

-- ── Tenant of flat M1 ──
select pg_temp.as_user('00000000-0000-4000-a000-000000000102', true);
insert into r (name, ok) select 'tenant: uploads a photo for a request', not pg_temp.fails($$insert into storage.objects (bucket_id, name) values ('invoices', 'b/zzcheckm/requests/fm1/zz-check-new.jpg')$$);
insert into r (name, ok) select 'tenant: cannot upload into another flat''s requests', pg_temp.fails($$insert into storage.objects (bucket_id, name) values ('invoices', 'b/zzcheckm/requests/fm2/zz-check-new.jpg')$$);
insert into r (name, ok) select 'tenant: sees own request photo', exists (select 1 from storage.objects where name = 'b/zzcheckm/requests/fm1/zz-check-sink.jpg');
insert into v select 'req', public.request_technician('plumber', 'zz-check leak under the kitchen sink', 'b/zzcheckm/requests/fm1/zz-check-sink.jpg')::text;
insert into r (name, ok) select 'tenant: asks for a plumber', (select val from v where k = 'req') is not null;
insert into r (name, ok) select 'tenant: unknown trade refused', pg_temp.fails($$select public.request_technician('astronaut', 'zz-check x', null)$$);
insert into r (name, ok) select 'tenant: empty request refused', pg_temp.fails($$select public.request_technician('plumber', ' ', null)$$);
insert into r (name, ok) select 'tenant: another flat''s photo refused', pg_temp.fails($$select public.request_technician('plumber', 'zz-check x', 'b/zzcheckm/requests/fm2/zz-check-new.jpg')$$);
insert into r (name, ok) select 'tenant: sees own request', jsonb_array_length(public.my_service_requests()) = 1;
insert into r (name, ok) select 'tenant: cannot see all requests', pg_temp.fails($$select public.list_service_requests(30)$$);
insert into r (name, ok) select 'tenant: has no notebook', pg_temp.fails($$select public.get_manager_book()$$);
insert into r (name, ok) select 'tenant: cannot pass a request on', pg_temp.fails(format($$select public.update_service_request(%L, 'sent', 'Someone', null)$$, (select val from v where k = 'req')));

-- ── Tenant of flat M2 ──
select pg_temp.as_user('00000000-0000-4000-a000-000000000103', true);
insert into r (name, ok) select 'other flat: doesn''t see the request', jsonb_array_length(public.my_service_requests()) = 0;
insert into r (name, ok) select 'other flat: no photo of it', not exists (select 1 from storage.objects where name = 'b/zzcheckm/requests/fm1/zz-check-sink.jpg');
insert into r (name, ok) select 'other flat: cannot cancel it', pg_temp.fails(format($$select public.cancel_my_request(%L)$$, (select val from v where k = 'req')));

-- ── View-only helper ──
select pg_temp.as_user('00000000-0000-4000-a000-000000000104', false);
insert into r (name, ok) select 'view-only helper: no request photos', not exists (select 1 from storage.objects where name = 'b/zzcheckm/requests/fm1/zz-check-sink.jpg');
insert into r (name, ok) select 'view-only helper: no request list', pg_temp.fails($$select public.list_service_requests(30)$$);

-- ── The building manager ──
select pg_temp.as_user('00000000-0000-4000-a000-000000000101', false);
insert into r (name, ok) select 'manager: sees the request with the flat', exists (
  select 1 from jsonb_array_elements(public.list_service_requests(30)) x
   where x->>'id' = (select val from v where k = 'req') and x->>'unit' = 'M1' and x->>'buildingName' = 'Check M' and x->>'phone' = '70000001');
insert into r (name, ok) select 'manager: sees the request photo', exists (select 1 from storage.objects where name = 'b/zzcheckm/requests/fm1/zz-check-sink.jpg');
insert into r (name, ok) select 'manager: passing on needs a name', pg_temp.fails(format($$select public.update_service_request(%L, 'sent', ' ', null)$$, (select val from v where k = 'req')));
select public.update_service_request((select val from v where k = 'req')::uuid, 'sent', 'Samir', '03 123 456');
insert into r (name, ok) select 'manager: notebook starts empty', (public.get_manager_book()->>'rev')::int = 0;
insert into v select 'rev1', public.save_manager_book('{"technicians":[{"id":"t1","name":"Samir","trade":"plumber"}]}', 0)::text;
insert into r (name, ok) select 'manager: notebook saved', (select val from v where k = 'rev1') = '1'
  and public.get_manager_book()->'data'->'technicians'->0->>'name' = 'Samir';
insert into r (name, ok) select 'manager: a stale notebook copy is refused', pg_temp.fails($$select public.save_manager_book('{"technicians":[]}', 0)$$);

-- ── Back to the tenant ──
select pg_temp.as_user('00000000-0000-4000-a000-000000000102', true);
insert into r (name, ok) select 'tenant: sees who will call', public.my_service_requests()->0->>'technicianName' = 'Samir'
  and public.my_service_requests()->0->>'status' = 'sent';
insert into r (name, ok) select 'tenant: can cancel own request', not pg_temp.fails(format($$select public.cancel_my_request(%L)$$, (select val from v where k = 'req')));

reset role;

insert into r (name, ok) select 'manager was notified of the request',
  exists (select 1 from public.push_jobs where building_id = 'zzcheckm' and target = 'admins' and title like '🔧 Plumber — Unit M1%');
insert into r (name, ok) select 'tenant was told who will call',
  exists (select 1 from public.push_jobs where building_id = 'zzcheckm' and target = 'tenants' and tenant_id = 'fm1' and body like 'Samir will contact you (03 123 456)%');
insert into r (name, ok) select 'the notebook is private',
  not has_table_privilege('authenticated', 'public.manager_books', 'select')
  and not has_table_privilege('authenticated', 'public.service_requests', 'select');

select n, name, ok from r order by n;
rollback;
