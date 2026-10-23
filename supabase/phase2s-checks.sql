-- Phase 2s live checks — run AFTER phase2s-v187.sql.
--
-- Everything happens inside one transaction that is rolled back at the end:
-- a made-up building with three flats, the owners' and a tenant's phones and
-- made-up leases; nothing is kept (notices included).
--
-- Run in: SQL Editor -> paste -> Run ("Run without RLS" if asked).
-- Every row of the result should say ok = true.

begin;

create temp table r (n serial, name text, ok boolean);

insert into auth.users (id, aud, role, email, is_anonymous)
values ('00000000-0000-4000-a000-000000000701', 'authenticated', 'authenticated', 'check-owner-y1@example.invalid', true),
       ('00000000-0000-4000-a000-000000000702', 'authenticated', 'authenticated', 'check-renter-y1@example.invalid', true),
       ('00000000-0000-4000-a000-000000000703', 'authenticated', 'authenticated', 'check-owner-y2@example.invalid', true),
       ('00000000-0000-4000-a000-000000000704', 'authenticated', 'authenticated', 'check-owner-y3@example.invalid', true);

insert into public.building_state (id, state, rev) values
  ('zzchecky', '{"building":{"name":"Check Y"},"settings":{"language":"en"},
                 "tenants":[{"id":"fy1","name":"Owner Y1","unit":"Y1","active":true},
                            {"id":"fy2","name":"Owner Y2","unit":"Y2","active":true,"language":"ar"},
                            {"id":"fy3","name":"Owner Y3","unit":"Y3","active":true}],
                 "transactions":[]}', 1);

insert into public.leases (id, building_id, flat_id, data, rev) values
  ('zz-lease-y1', 'zzchecky', 'fy1', '{"tenant":{"name":"Renter Y1"},"rent":500,"start":"2025-01-01","status":"active"}', 1),
  ('zz-lease-y2', 'zzchecky', 'fy2', '{"tenant":{"name":"Renter Y2"},"rent":500,"start":"2025-01-01","status":"active"}', 1),
  ('zz-lease-y3', 'zzchecky', 'fy3', '{"tenant":{"name":"Renter Y3"},"rent":500,"start":"2025-01-01","status":"active","ownFlat":true}', 1);

insert into public.memberships (auth_user_id, building_id, role, tenant_id, lease_id) values
  ('00000000-0000-4000-a000-000000000701', 'zzchecky', 'tenant', 'fy1', null),
  ('00000000-0000-4000-a000-000000000702', 'zzchecky', 'renter', 'fy1', 'zz-lease-y1'),
  ('00000000-0000-4000-a000-000000000703', 'zzchecky', 'tenant', 'fy2', null),
  ('00000000-0000-4000-a000-000000000704', 'zzchecky', 'tenant', 'fy3', null);

insert into public.push_subscriptions (endpoint, auth_user_id, role, tenant_id, p256dh, auth) values
  ('https://fcm.googleapis.com/zz-check-y-owner1', '00000000-0000-4000-a000-000000000701', 'tenant', 'fy1', 'k', 'a'),
  ('https://fcm.googleapis.com/zz-check-y-renter1', '00000000-0000-4000-a000-000000000702', 'renter', 'fy1', 'k', 'a'),
  ('https://fcm.googleapis.com/zz-check-y-owner2', '00000000-0000-4000-a000-000000000703', 'tenant', 'fy2', 'k', 'a'),
  ('https://fcm.googleapis.com/zz-check-y-owner3', '00000000-0000-4000-a000-000000000704', 'tenant', 'fy3', 'k', 'a');

create temp table v (k text, val text);
insert into v select 'sent', (select count(*) from (select public.send_owner_statements()) q)::text;
insert into r (name, ok) select 'statements: the two owners of rented flats, not the manager''s own flat',
  (select count(*) from public.push_jobs where target = 'owner' and tenant_id in ('fy1', 'fy2', 'fy3')) = 2
  and not exists (select 1 from public.push_jobs where tenant_id = 'fy3');
insert into r (name, ok) select 'the notice names last month and the building',
  exists (select 1 from public.push_jobs where tenant_id = 'fy1' and title = 'Rent statement — Check Y'
           and body like 'Your statement for ' || to_char(date_trunc('month', current_date) - interval '1 month', 'FMMonth YYYY') || ' is ready%');
insert into r (name, ok) select 'in Arabic for an owner who reads Arabic',
  exists (select 1 from public.push_jobs where tenant_id = 'fy2' and title like 'كشف الإيجار — %');
insert into r (name, ok) select 'it reaches the owner''s phone, not the tenant''s',
  (select public.claim_push_job(id) from public.push_jobs where tenant_id = 'fy1' and target = 'owner')->'subscriptions'
    = '[{"endpoint":"https://fcm.googleapis.com/zz-check-y-owner1","keys":{"p256dh":"k","auth":"a"}}]'::jsonb;
insert into r (name, ok) select 'once a month only', public.send_owner_statements() = 0;
insert into r (name, ok) select 'the owners'' daily jobs still work', public.send_rent_reminders() >= 0;

select n, name, ok from r order by n;
rollback;
