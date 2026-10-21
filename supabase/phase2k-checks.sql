-- Phase 2k live checks — run AFTER phase2k-v170.sql.
--
-- Made-up photo records and a made-up tenant phone are created inside a
-- transaction that is rolled back at the end; nothing is kept.
-- Run in: SQL Editor -> paste -> Run ("Run without RLS" if asked).
-- Every row of the result should say ok = true.

begin;

create temp table r (n serial, name text, ok boolean);
grant all on r to authenticated;
grant usage on sequence r_n_seq to authenticated;

insert into auth.users (id, aud, role, email, is_anonymous)
values ('00000000-0000-4000-a000-0000000000e2', 'authenticated', 'authenticated', 'check-tenant@example.invalid', true);
insert into public.profiles (auth_user_id, role, tenant_id)
values ('00000000-0000-4000-a000-0000000000e2', 'tenant', 'zz-check-flat')
on conflict (auth_user_id) do update set role = excluded.role, tenant_id = excluded.tenant_id;

insert into storage.objects (bucket_id, name) values
  ('invoices', 'zz-check/2026/invoice.jpg'),
  ('invoices', 'concierge/2099/zz-check-invoice.jpg'),
  ('invoices', 'concierge/meters/zz-check-meter.jpg'),
  ('invoices', 'concierge/issues/zz-check-problem.jpg'),
  ('invoices', 'proofs/zz-other-flat/zz-check-proof.jpg'),
  ('invoices', 'documents/zz-check-contract.pdf');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-a000-0000000000e2","role":"authenticated","is_anonymous":true}', true);
set local role authenticated;

insert into r (name, ok) select 'tenant: sees an expense invoice', exists (select 1 from storage.objects where name = 'zz-check/2026/invoice.jpg');
insert into r (name, ok) select 'tenant: sees an invoice the concierge photographed', exists (select 1 from storage.objects where name = 'concierge/2099/zz-check-invoice.jpg');
insert into r (name, ok) select 'tenant: no meter photos taken by the concierge', not exists (select 1 from storage.objects where name = 'concierge/meters/zz-check-meter.jpg');
insert into r (name, ok) select 'tenant: no problem photos taken by the concierge', not exists (select 1 from storage.objects where name = 'concierge/issues/zz-check-problem.jpg');
insert into r (name, ok) select 'tenant: no other flat''s payment proof', not exists (select 1 from storage.objects where name = 'proofs/zz-other-flat/zz-check-proof.jpg');
insert into r (name, ok) select 'tenant: no building documents', not exists (select 1 from storage.objects where name = 'documents/zz-check-contract.pdf');

reset role;
select n, name, ok from r order by n;
rollback;
