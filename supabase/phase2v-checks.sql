-- Phase 2v live checks — run AFTER phase2v-v199.sql.
--
-- Everything happens inside one transaction that is rolled back at the end:
-- a made-up building with two flats of one owner, made-up leases with
-- hand-overs; nothing is kept.
--
-- Run in: SQL Editor -> paste -> Run ("Run without RLS" if asked).
-- Every row of the result should say ok = true.

begin;

create temp table r (n serial, name text, ok boolean);
grant all on r to anon, authenticated;
grant usage on sequence r_n_seq to anon, authenticated;

insert into public.building_state (id, state, rev) values
  ('zzcheckw', '{"building":{"name":"Check W"},"settings":{"language":"en"},
                 "tenants":[{"id":"fw1","name":"Secret Owner Name","unit":"W1","phone":"70000031","active":true,"coefficient":500},
                            {"id":"fw2","name":"Secret Owner Name","unit":"W2","phone":"70000031","active":true,"coefficient":500}],
                 "transactions":[]}', 1);

insert into public.leases (id, building_id, flat_id, data, rev) values
  ('zz-check-lease-w1', 'zzcheckw', 'fw1',
   '{"tenant":{"name":"Secret Renter One","phone":"71000031"},"rent":600,"currency":"USD","period":"monthly","start":"2026-09-01","status":"active",
     "payments":[{"id":"zz-rent-w1","date":"2026-09-02","amount":600,"verifyCode":"RENTWWWWW1"}],
     "payouts":[{"id":"zz-out-1","receipt":"HO-ZZ-1","verifyCode":"HANDWWWWW1","date":"2026-09-10","amount":540,"method":"cash"},
                {"id":"zz-out-3","receipt":"HO-ZZ-3","verifyCode":"HANDWWWWW3","date":"2026-09-12","amount":100,"method":"cash","voidedAt":"2026-09-13T08:00:00Z"}]}', 1),
  ('zz-check-lease-w2', 'zzcheckw', 'fw2',
   '{"tenant":{"name":"Secret Renter Two","phone":"71000032"},"rent":500,"currency":"USD","period":"monthly","start":"2026-09-01","status":"active",
     "payments":[{"id":"zz-rent-w2","date":"2026-09-02","amount":500}],
     "payouts":[{"id":"zz-out-2","receipt":"HO-ZZ-1","verifyCode":"HANDWWWWW1","date":"2026-09-10","amount":450,"method":"cash"}]}', 1);

set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);

insert into r (name, ok) select 'a hand-over covering two flats is valid, with both flats and the total',
  public.verify_receipt('zzcheckw', 'HO-ZZ-1', 'HANDWWWWW1', 990, 'handover') @> '{"status":"valid","kind":"handover","unit":"W1, W2","amount":990,"currency":"USD","date":"2026-09-10"}';
insert into r (name, ok) select 'no names or phone numbers in the answer',
  public.verify_receipt('zzcheckw', 'HO-ZZ-1', 'HANDWWWWW1', 990, 'handover')::text !~ '(Secret|7000003|7100003)';
insert into r (name, ok) select 'a different printed amount says changed',
  public.verify_receipt('zzcheckw', 'HO-ZZ-1', 'HANDWWWWW1', 900, 'handover') @> '{"status":"changed","amount":990}';
insert into r (name, ok) select 'a wrong code is not found',
  public.verify_receipt('zzcheckw', 'HO-ZZ-1', 'HANDWWWWW9', 990, 'handover')->>'status' = 'not_found';
insert into r (name, ok) select 'a deleted hand-over says cancelled',
  public.verify_receipt('zzcheckw', 'HO-ZZ-3', 'HANDWWWWW3', 100, 'handover') @> '{"status":"cancelled","kind":"handover","at":"2026-09-13T08:00:00Z"}';
insert into r (name, ok) select 'another building with the same code: not found',
  public.verify_receipt('zz-no-such-building', 'HO-ZZ-1', 'HANDWWWWW1', 990, 'handover')->>'status' = 'not_found';
insert into r (name, ok) select 'a hand-over is not a rent receipt (and the other way round)',
  public.verify_receipt('zzcheckw', 'HO-ZZ-1', 'HANDWWWWW1', 990, 'rent')->>'status' = 'not_found'
  and public.verify_receipt('zzcheckw', 'zz-rent-w1', 'RENTWWWWW1', 600, 'handover')->>'status' = 'not_found';
insert into r (name, ok) select 'rent receipts still work',
  public.verify_receipt('zzcheckw', 'zz-rent-w1', 'RENTWWWWW1', 600, 'rent') @> '{"status":"valid","kind":"rent","unit":"W1","amount":600}';

reset role;
select n, name, ok from r order by n;
rollback;
