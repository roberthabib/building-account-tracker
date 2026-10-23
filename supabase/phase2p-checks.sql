-- Phase 2p live checks — run AFTER phase2p-v180.sql.
--
-- Everything happens inside one transaction that is rolled back at the end:
-- a made-up building with one flat, its owner's phone, a few made-up
-- payments with receipts and a made-up lease; nothing is kept.
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
values ('00000000-0000-4000-a000-000000000401', 'authenticated', 'authenticated', 'check-owner-v1@example.invalid', true);

insert into public.building_state (id, state, rev) values
  ('zzcheckv', '{"building":{"name":"Check V"},"settings":{"language":"en","lbpPerUsd":89500},
                 "tenants":[{"id":"fv1","name":"Secret Owner Name","unit":"V1","phone":"70000021","active":true,"coefficient":1000}],
                 "transactions":[
                   {"id":"zz-p1","category":"Payments","tenantId":"fv1","forMonth":"2026-09-01","date":"2026-09-03","creditUsd":100,"receiptRef":"RCT-ZZ-0001","verifyCode":"CHECKAAAA1","paymentGroupId":"g1"},
                   {"id":"zz-p2","category":"Payments","tenantId":"fv1","forMonth":"2026-10-01","date":"2026-09-03","creditUsd":50,"receiptRef":"RCT-ZZ-0001","verifyCode":"CHECKAAAA1","paymentGroupId":"g1"},
                   {"id":"zz-p3","category":"Payments","tenantId":"fv1","forMonth":"2026-10-01","date":"2026-10-05","creditLbp":895000,"lbpRate":89500,"receiptRef":"RCT-ZZ-0002","verifyCode":"CHECKBBBB2"},
                   {"id":"zz-p4","category":"Payments","tenantId":"fv1","project":"Roof","date":"2026-10-06","creditUsd":"","creditLbp":null,"debitUsd":0,"receiptRef":"RCT-ZZ-0003","verifyCode":"CHECKCCCC3"},
                   {"id":"zz-e1","category":"Expenses","date":"2026-10-06","debitUsd":30,"receiptRef":"RCT-ZZ-0004","verifyCode":"CHECKDDDD4"}],
                 "voidedReceipts":[{"id":"RCT-ZZ-0009:CHECKVOID9","ref":"RCT-ZZ-0009","code":"CHECKVOID9","unit":"V1","amountUsd":70,"at":"2026-10-20T10:00:00Z"}],
                 "paymentDeclarations":[]}', 1);

insert into public.memberships (auth_user_id, building_id, role, tenant_id) values
  ('00000000-0000-4000-a000-000000000401', 'zzcheckv', 'tenant', 'fv1');

insert into public.leases (id, building_id, flat_id, data, rev) values
  ('zz-check-lease-v', 'zzcheckv', 'fv1',
   '{"tenant":{"name":"Secret Renter Name","phone":"71000002"},"rent":650,"currency":"USD","period":"monthly","start":"2026-09-01","status":"active",
     "payments":[{"id":"zz-rent-1","date":"2026-09-02","amount":650,"verifyCode":"RENTAAAAA1"}]}', 1);

-- ── Anyone with the link, not signed in ──
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);

insert into r (name, ok) select 'a genuine receipt is valid, with both months',
  public.verify_receipt('zzcheckv', 'RCT-ZZ-0001', 'CHECKAAAA1', 150)->>'status' = 'valid'
  and (public.verify_receipt('zzcheckv', 'RCT-ZZ-0001', 'CHECKAAAA1', 150)->>'amount')::numeric = 150
  and public.verify_receipt('zzcheckv', 'RCT-ZZ-0001', 'CHECKAAAA1', 150)->'months' = '["2026-09-01","2026-10-01"]'::jsonb;
insert into r (name, ok) select 'it shows the building, the flat and the date',
  public.verify_receipt('zzcheckv', 'RCT-ZZ-0001', 'CHECKAAAA1', 150) @> '{"building":"Check V","unit":"V1","date":"2026-09-03"}';
insert into r (name, ok) select 'no names or phone numbers in the answer',
  public.verify_receipt('zzcheckv', 'RCT-ZZ-0001', 'CHECKAAAA1', 150)::text !~ '(Secret|7000002|7100000)'
  and public.verify_receipt('zzcheckv', 'zz-rent-1', 'RENTAAAAA1', 650, 'rent')::text !~ '(Secret|7000002|7100000)';
insert into r (name, ok) select 'a wrong check code is not found',
  public.verify_receipt('zzcheckv', 'RCT-ZZ-0001', 'CHECKAAAA9', 150)->>'status' = 'not_found';
insert into r (name, ok) select 'a made-up receipt number is not found',
  public.verify_receipt('zzcheckv', 'RCT-ZZ-7777', 'CHECKAAAA1', 150)->>'status' = 'not_found';
insert into r (name, ok) select 'a too-short code is refused',
  public.verify_receipt('zzcheckv', 'RCT-ZZ-0001', 'CHE', 150)->>'status' = 'not_found';
insert into r (name, ok) select 'another building with the same code: not found',
  public.verify_receipt('zz-no-such-building', 'RCT-ZZ-0001', 'CHECKAAAA1', 150)->>'status' = 'not_found';
insert into r (name, ok) select 'a different printed amount says changed, with today''s amount',
  public.verify_receipt('zzcheckv', 'RCT-ZZ-0001', 'CHECKAAAA1', 100) @> '{"status":"changed","amount":150}';
insert into r (name, ok) select 'Lebanese pounds count at the entry''s own rate',
  public.verify_receipt('zzcheckv', 'RCT-ZZ-0002', 'CHECKBBBB2', 10) @> '{"status":"valid","amount":10}';
insert into r (name, ok) select 'a project payment shows the project; blank amounts don''t break it',
  public.verify_receipt('zzcheckv', 'RCT-ZZ-0003', 'CHECKCCCC3') @> '{"status":"valid","project":"Roof","amount":0}';
insert into r (name, ok) select 'only payments have receipts (an expense is not found)',
  public.verify_receipt('zzcheckv', 'RCT-ZZ-0004', 'CHECKDDDD4')->>'status' = 'not_found';
insert into r (name, ok) select 'a deleted payment''s receipt says cancelled',
  public.verify_receipt('zzcheckv', 'RCT-ZZ-0009', 'CHECKVOID9', 70) @> '{"status":"cancelled","unit":"V1","amount":70}';
insert into r (name, ok) select 'a rent receipt is valid',
  public.verify_receipt('zzcheckv', 'zz-rent-1', 'RENTAAAAA1', 650, 'rent') @> '{"status":"valid","kind":"rent","unit":"V1","amount":650,"currency":"USD"}';
insert into r (name, ok) select 'a rent receipt with a wrong code is not found',
  public.verify_receipt('zzcheckv', 'zz-rent-1', 'RENTAAAAA2', 650, 'rent')->>'status' = 'not_found';
insert into r (name, ok) select 'without signing in, nothing else opens',
  pg_temp.fails($$select public.get_my_state()$$);

-- ── The owner's phone doesn't receive the cancelled receipts ──
reset role;
set local role authenticated;
select set_config('request.jwt.claims',
  json_build_object('sub', '00000000-0000-4000-a000-000000000401', 'role', 'authenticated', 'is_anonymous', true)::text, true);
select set_config('request.headers', '{}', true);
insert into r (name, ok) select 'a resident''s phone gets no cancelled receipts',
  not (public.get_my_state() ? 'voidedReceipts') and jsonb_array_length(public.get_my_state()->'transactions') >= 1;

reset role;
select n, name, ok from r order by n;
rollback;
