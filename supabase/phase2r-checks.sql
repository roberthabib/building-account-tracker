-- Phase 2r live checks — run AFTER phase2r-v186.sql.
--
-- Everything happens inside one transaction that is rolled back at the end:
-- a made-up building with one rented flat, its manager, a view-only helper,
-- the owner's and the tenant's phones, a made-up lease and file names;
-- nothing is kept.
--
-- Run in: SQL Editor -> paste -> Run ("Run without RLS" if asked).
-- Every row of the result should say ok = true.

begin;

create temp table r (n serial, name text, ok boolean);
grant all on r to authenticated;
grant usage on sequence r_n_seq to authenticated;

create function pg_temp.fails(p_sql text) returns boolean language plpgsql as $$
begin
  execute p_sql;
  return false;
exception when others then
  return true;
end;
$$;

create function pg_temp.as_user(p_id text) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', p_id, 'role', 'authenticated', 'is_anonymous', true)::text, true);
  perform set_config('request.headers', '{"x-building":"zzcheckx"}', true);
end;
$$;

insert into auth.users (id, aud, role, email, is_anonymous)
values ('00000000-0000-4000-a000-000000000601', 'authenticated', 'authenticated', 'check-manager-x@example.invalid', false),
       ('00000000-0000-4000-a000-000000000602', 'authenticated', 'authenticated', 'check-viewer-x@example.invalid', false),
       ('00000000-0000-4000-a000-000000000603', 'authenticated', 'authenticated', 'check-owner-x@example.invalid', true),
       ('00000000-0000-4000-a000-000000000604', 'authenticated', 'authenticated', 'check-renter-x@example.invalid', true);

insert into public.building_state (id, state, rev) values
  ('zzcheckx', '{"building":{"name":"Check X"},"settings":{"language":"en"},
                 "tenants":[{"id":"fx1","name":"Owner X1","unit":"X1","active":true,"coefficient":1000}],
                 "transactions":[],"paymentDeclarations":[]}', 1);

insert into public.leases (id, building_id, flat_id, data, rev) values
  ('zz-lease-x', 'zzcheckx', 'fx1',
   '{"tenant":{"name":"Renter X"},"rent":500,"currency":"USD","period":"monthly","start":"2026-09-01","status":"active",
     "payments":[{"id":"p1","date":"2026-09-01","amount":500}],
     "documents":[{"id":"d1","name":"Signed lease","storagePath":"b/zzcheckx/leases/zz-lease-x/contract.pdf"}],
     "inspections":[{"id":"i1","kind":"move-in","date":"2026-09-01","rooms":[]}],
     "schedule":{"asOf":"2026-10-01","periods":[]}}', 1);

insert into public.memberships (auth_user_id, building_id, role, tenant_id, lease_id) values
  ('00000000-0000-4000-a000-000000000601', 'zzcheckx', 'owner', null, null),
  ('00000000-0000-4000-a000-000000000602', 'zzcheckx', 'viewer', null, null),
  ('00000000-0000-4000-a000-000000000603', 'zzcheckx', 'tenant', 'fx1', null),
  ('00000000-0000-4000-a000-000000000604', 'zzcheckx', 'renter', 'fx1', 'zz-lease-x');

insert into storage.objects (bucket_id, name) values
  ('invoices', 'b/zzcheckx/leases/zz-lease-x/contract.pdf'),
  ('invoices', 'b/zzcheckx/2026/zz-invoice.jpg'),
  ('invoices', 'b/zzcheckx/proofs/fx1/zz-proof.jpg');

set local role authenticated;

select pg_temp.as_user('00000000-0000-4000-a000-000000000601');
insert into r (name, ok) select 'manager: opens a lease document', exists (select 1 from storage.objects where name = 'b/zzcheckx/leases/zz-lease-x/contract.pdf');
insert into r (name, ok) select 'manager: adds a lease document',
  not pg_temp.fails($q$insert into storage.objects (bucket_id, name) values ('invoices', 'b/zzcheckx/leases/zz-lease-x/zz-id.jpg')$q$);

select pg_temp.as_user('00000000-0000-4000-a000-000000000602');
insert into r (name, ok) select 'view-only helper: no lease documents', not exists (select 1 from storage.objects where name = 'b/zzcheckx/leases/zz-lease-x/contract.pdf');
insert into r (name, ok) select 'view-only helper: still sees invoices', exists (select 1 from storage.objects where name = 'b/zzcheckx/2026/zz-invoice.jpg');

select pg_temp.as_user('00000000-0000-4000-a000-000000000603');
insert into r (name, ok) select 'owner''s phone: no lease documents', not exists (select 1 from storage.objects where name = 'b/zzcheckx/leases/zz-lease-x/contract.pdf');
insert into r (name, ok) select 'owner''s phone: still sees invoices', exists (select 1 from storage.objects where name = 'b/zzcheckx/2026/zz-invoice.jpg');
insert into r (name, ok) select 'owner''s phone: the rented flat without documents or inspections',
  jsonb_array_length(public.get_my_state()->'myRentals') = 1
  and not (public.get_my_state()->'myRentals'->0 ?| array['documents', 'inspections', 'schedule', 'declarations', 'notes'])
  and public.get_my_state()->'myRentals'->0->'payments' is not null;

select pg_temp.as_user('00000000-0000-4000-a000-000000000604');
insert into r (name, ok) select 'tenant''s phone: no lease documents', not exists (select 1 from storage.objects where name = 'b/zzcheckx/leases/zz-lease-x/contract.pdf');
insert into r (name, ok) select 'tenant''s phone: still sees invoices and its own proofs',
  exists (select 1 from storage.objects where name = 'b/zzcheckx/2026/zz-invoice.jpg')
  and exists (select 1 from storage.objects where name = 'b/zzcheckx/proofs/fx1/zz-proof.jpg');
insert into r (name, ok) select 'tenant''s phone: cannot add lease documents',
  pg_temp.fails($q$insert into storage.objects (bucket_id, name) values ('invoices', 'b/zzcheckx/leases/zz-lease-x/zz-fake.pdf')$q$);
insert into r (name, ok) select 'tenant''s phone: its lease without documents or inspections',
  not (public.get_my_state()->'myLease' ?| array['documents', 'inspections', 'schedule', 'fee', 'notes'])
  and (public.get_my_state()->'myLease'->>'rent')::int = 500;

reset role;
select n, name, ok from r order by n;
rollback;
