-- Phase 2q live checks — run AFTER phase2q-v185.sql.
--
-- Everything happens inside one transaction that is rolled back at the end:
-- a made-up building with three flats, an owner's phone, three tenants'
-- phones and made-up leases; nothing is kept (reminders included).
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

create function pg_temp.as_user(p_id text) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', p_id, 'role', 'authenticated', 'is_anonymous', true)::text, true);
  perform set_config('request.headers', '{"x-building":"zzcheckw"}', true);
end;
$$;

insert into auth.users (id, aud, role, email, is_anonymous)
values ('00000000-0000-4000-a000-000000000501', 'authenticated', 'authenticated', 'check-owner-w@example.invalid', true),
       ('00000000-0000-4000-a000-000000000502', 'authenticated', 'authenticated', 'check-renter-w1@example.invalid', true),
       ('00000000-0000-4000-a000-000000000504', 'authenticated', 'authenticated', 'check-renter-w2@example.invalid', true),
       ('00000000-0000-4000-a000-000000000505', 'authenticated', 'authenticated', 'check-renter-w3@example.invalid', true),
       ('00000000-0000-4000-a000-000000000506', 'authenticated', 'authenticated', 'check-manager-w@example.invalid', false);

insert into public.building_state (id, state, rev) values
  ('zzcheckw', '{"building":{"name":"Check W"},"settings":{"language":"en"},
                 "tenants":[{"id":"fw1","name":"Owner W1","unit":"W1","active":true,"coefficient":400},
                            {"id":"fw2","name":"Owner W2","unit":"W2","active":true,"coefficient":300},
                            {"id":"fw3","name":"Owner W3","unit":"W3","active":true,"coefficient":300}],
                 "transactions":[],"paymentDeclarations":[]}', 1);

insert into public.leases (id, building_id, flat_id, data, rev) values
  ('zz-lease-w1', 'zzcheckw', 'fw1', jsonb_build_object('tenant', jsonb_build_object('name', 'Renter W1', 'language', 'en'), 'currency', 'USD', 'status', 'active',
     'schedule', jsonb_build_object('asOf', to_char(current_date, 'YYYY-MM-DD'), 'currency', 'USD', 'dueBefore', 0, 'paid', 0,
       'periods', jsonb_build_array(jsonb_build_object('start', to_char(current_date + 3, 'YYYY-MM-DD'), 'lateFrom', to_char(current_date + 8, 'YYYY-MM-DD'), 'amount', 650))),
     'payments', '[]'::jsonb), 1),
  ('zz-lease-w2', 'zzcheckw', 'fw2', jsonb_build_object('tenant', jsonb_build_object('name', 'Renter W2', 'language', 'en'), 'currency', 'USD', 'status', 'active',
     'schedule', jsonb_build_object('asOf', to_char(current_date - 10, 'YYYY-MM-DD'), 'currency', 'USD', 'dueBefore', 0, 'paid', 100,
       'periods', jsonb_build_array(jsonb_build_object('start', to_char(current_date - 10, 'YYYY-MM-DD'), 'lateFrom', to_char(current_date - 7, 'YYYY-MM-DD'), 'amount', 500))),
     'payments', '[]'::jsonb), 1),
  ('zz-lease-w3', 'zzcheckw', 'fw3', jsonb_build_object('tenant', jsonb_build_object('name', 'Renter W3', 'language', 'en'), 'currency', 'USD', 'status', 'active', 'autoReminders', false,
     'schedule', jsonb_build_object('asOf', to_char(current_date, 'YYYY-MM-DD'), 'currency', 'USD', 'dueBefore', 0, 'paid', 0,
       'periods', jsonb_build_array(jsonb_build_object('start', to_char(current_date + 3, 'YYYY-MM-DD'), 'lateFrom', to_char(current_date + 8, 'YYYY-MM-DD'), 'amount', 400))),
     'payments', '[]'::jsonb), 1);

insert into public.memberships (auth_user_id, building_id, role, tenant_id, lease_id) values
  ('00000000-0000-4000-a000-000000000501', 'zzcheckw', 'tenant', 'fw1', null),
  ('00000000-0000-4000-a000-000000000502', 'zzcheckw', 'renter', 'fw1', 'zz-lease-w1'),
  ('00000000-0000-4000-a000-000000000504', 'zzcheckw', 'renter', 'fw2', 'zz-lease-w2'),
  ('00000000-0000-4000-a000-000000000505', 'zzcheckw', 'renter', 'fw3', 'zz-lease-w3'),
  ('00000000-0000-4000-a000-000000000506', 'zzcheckw', 'owner', null, null);

insert into public.push_subscriptions (endpoint, auth_user_id, role, tenant_id, p256dh, auth) values
  ('https://fcm.googleapis.com/zz-check-w-owner',  '00000000-0000-4000-a000-000000000501', 'tenant', 'fw1', 'k', 'a'),
  ('https://fcm.googleapis.com/zz-check-w-renter', '00000000-0000-4000-a000-000000000502', 'renter', 'fw1', 'k', 'a'),
  ('https://fcm.googleapis.com/zz-check-w-renter2', '00000000-0000-4000-a000-000000000504', 'renter', 'fw2', 'k', 'a'),
  ('https://fcm.googleapis.com/zz-check-w-renter3', '00000000-0000-4000-a000-000000000505', 'renter', 'fw3', 'k', 'a'),
  ('https://fcm.googleapis.com/zz-check-w-manager', '00000000-0000-4000-a000-000000000506', 'owner', null, 'k', 'a');

-- ── Reminders ──
insert into v select 'sent', public.send_rent_reminders()::text;
insert into r (name, ok) select 'reminders: one due soon, one late, none when turned off', (select val from v where k = 'sent') = '2';
insert into r (name, ok) select 'due soon: the rent and the date, to that lease''s tenant',
  exists (select 1 from public.push_jobs where target = 'renter' and tenant_id = 'zz-lease-w1' and title like 'Rent reminder%'
           and body like '%$650.00%' and body like '%' || to_char(current_date + 3, 'YYYY-MM-DD') || '%');
insert into r (name, ok) select 'late: what is still owed',
  exists (select 1 from public.push_jobs where target = 'renter' and tenant_id = 'zz-lease-w2' and title like 'Rent is late%' and body like '%$400.00%');
insert into r (name, ok) select 'turned off for a lease: no reminder',
  not exists (select 1 from public.push_jobs where tenant_id = 'zz-lease-w3');
insert into r (name, ok) select 'the reminder reaches the tenant''s phone, not the owner''s',
  (select public.claim_push_job(id) from public.push_jobs where tenant_id = 'zz-lease-w1' and title like 'Rent reminder%')->'subscriptions'
    = '[{"endpoint":"https://fcm.googleapis.com/zz-check-w-renter","keys":{"p256dh":"k","auth":"a"}}]'::jsonb;
insert into r (name, ok) select 'a second run the same day sends nothing again', public.send_rent_reminders() = 0;

-- ── The tenant says they paid ──
set local role authenticated;
select pg_temp.as_user('00000000-0000-4000-a000-000000000502');
insert into r (name, ok) select 'tenant: says they paid the rent',
  not pg_temp.fails($$select public.declare_rent_payment(650, '2026-10-01', 'omt', 'b/zzcheckw/proofs/fw1/zz.jpg')$$);
insert into r (name, ok) select 'tenant: a proof photo from another flat is refused',
  pg_temp.fails($$select public.declare_rent_payment(650, '2026-10-01', 'omt', 'b/zzcheckw/proofs/fw2/zz.jpg')$$);
insert into r (name, ok) select 'tenant: a bad date is refused', pg_temp.fails($$select public.declare_rent_payment(650, '1 Oct', null, null)$$);
insert into r (name, ok) select 'tenant: can upload and open the flat''s photos while the lease runs',
  public.photo_tenant('b/zzcheckw/proofs/fw1/zz.jpg') = 'fw1';
select pg_temp.as_user('00000000-0000-4000-a000-000000000501');
insert into r (name, ok) select 'the flat''s owner cannot use the tenant''s rent button',
  pg_temp.fails($$select public.declare_rent_payment(650, '2026-10-01', null, null)$$);
reset role;
insert into r (name, ok) select 'the payment waits on the lease for the manager',
  (select data->'declarations'->0->>'status' = 'pending' and (data->'declarations'->0->>'amount')::numeric = 650 and rev = 2
     and data->'declarations'->0->'proof'->>'storagePath' = 'b/zzcheckw/proofs/fw1/zz.jpg'
     from public.leases where id = 'zz-lease-w1');
insert into r (name, ok) select 'the manager is told', exists (select 1 from public.push_jobs where target = 'admins' and title = 'Rent payment' and body like 'Renter W1 says they paid the rent: $650.00');

-- ── After the lease ──
update public.leases set data = data || '{"status":"ended"}' where id = 'zz-lease-w1';
set local role authenticated;
select pg_temp.as_user('00000000-0000-4000-a000-000000000502');
insert into r (name, ok) select 'after the lease: no more photos', public.photo_tenant('b/zzcheckw/proofs/fw1/zz.jpg') is null;
insert into r (name, ok) select 'after the lease: cannot say they paid', pg_temp.fails($$select public.declare_rent_payment(650, '2026-10-01', null, null)$$);
reset role;
insert into r (name, ok) select 'after the lease: no reminders',
  (select count(*) from public.push_jobs where tenant_id = 'zz-lease-w1') = 1;

select n, name, ok from r order by n;
rollback;
