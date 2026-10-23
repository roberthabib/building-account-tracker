-- Phase 2u live checks — run AFTER phase2u-v194.sql (the phase2t checks, plus
-- letting a flat again on the day its lease ended).
--
-- Everything happens inside one transaction that is rolled back at the end:
-- a made-up building with three flats, its manager and made-up leases;
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

insert into auth.users (id, aud, role, email, is_anonymous)
values ('00000000-0000-4000-a000-000000000801', 'authenticated', 'authenticated', 'check-manager-z@example.invalid', false);

insert into public.building_state (id, state, rev) values
  ('zzcheckz', '{"building":{"name":"Check Z"},"tenants":[{"id":"fz1","unit":"Z1"},{"id":"fz2","unit":"Z2"},{"id":"fz3","unit":"Z3"}]}', 1);
insert into public.memberships (auth_user_id, building_id, role, tenant_id) values
  ('00000000-0000-4000-a000-000000000801', 'zzcheckz', 'owner', null);

-- Two leases that already overlap on flat Z3 (made before this update).
insert into public.leases (id, building_id, flat_id, data, rev) values
  ('zz-old-a', 'zzcheckz', 'fz3', '{"start":"2026-10-01","status":"active","payments":[]}', 1),
  ('zz-old-b', 'zzcheckz', 'fz3', '{"start":"2026-10-01","status":"active","payments":[]}', 1);

set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', '00000000-0000-4000-a000-000000000801', 'role', 'authenticated')::text, true);
select set_config('request.headers', '{"x-building":"zzcheckz"}', true);

insert into r (name, ok) select 'a first lease on a flat is saved',
  not pg_temp.fails($q$select public.save_lease('zz-lease-1', 'fz1', '{"start":"2026-10-01","end":"2027-09-30","status":"active"}', 0)$q$);
insert into r (name, ok) select 'a second lease over the same dates is refused',
  pg_temp.fails($q$select public.save_lease('zz-lease-2', 'fz1', '{"start":"2027-01-01","status":"active"}', 0)$q$);
insert into r (name, ok) select 'a lease starting after the first one ends is saved',
  not pg_temp.fails($q$select public.save_lease('zz-lease-3', 'fz1', '{"start":"2027-10-01","status":"active"}', 0)$q$);
insert into r (name, ok) select 'another flat is free',
  not pg_temp.fails($q$select public.save_lease('zz-lease-4', 'fz2', '{"start":"2026-10-01","status":"active"}', 0)$q$);
insert into r (name, ok) select 'moving a lease onto a rented flat is refused',
  pg_temp.fails($q$select public.save_lease('zz-lease-4', 'fz1', '{"start":"2026-10-01","status":"active"}', 1)$q$);
insert into r (name, ok) select 'stretching the first lease into the next one is refused',
  pg_temp.fails($q$select public.save_lease('zz-lease-1', 'fz1', '{"start":"2026-10-01","end":"2027-12-31","status":"active"}', 1)$q$);
insert into r (name, ok) select 'a payment on the first lease is saved',
  not pg_temp.fails($q$select public.save_lease('zz-lease-1', 'fz1', '{"start":"2026-10-01","end":"2027-09-30","status":"active","payments":[{"id":"p","amount":5}]}', 1)$q$);
insert into r (name, ok) select 'leases that already overlap can still take payments',
  not pg_temp.fails($q$select public.save_lease('zz-old-a', 'fz3', '{"start":"2026-10-01","status":"active","payments":[{"id":"p","amount":5}]}', 1)$q$);
insert into r (name, ok) select '… and can be ended',
  not pg_temp.fails($q$select public.save_lease('zz-old-b', 'fz3', '{"start":"2026-10-01","status":"ended","endedOn":"2026-10-23"}', 1)$q$);
insert into r (name, ok) select 'a new lease can start on the day the old one ended',
  not pg_temp.fails($q$select public.save_lease('zz-old-a', 'fz3', '{"start":"2026-10-01","status":"ended","endedOn":"2026-10-23","payments":[{"id":"p","amount":5}]}', 2)$q$)
  and not pg_temp.fails($q$select public.save_lease('zz-lease-6', 'fz3', '{"start":"2026-10-23","status":"active"}', 0)$q$)
  and pg_temp.fails($q$select public.save_lease('zz-lease-7', 'fz3', '{"start":"2026-10-23","status":"active"}', 0)$q$);
insert into r (name, ok) select 'once ended, a new lease after that day is saved',
  not pg_temp.fails($q$select public.save_lease('zz-lease-5', 'fz2', '{"start":"2025-01-01","status":"ended","endedOn":"2025-12-31"}', 0)$q$);

reset role;
select n, name, ok from r order by n;
rollback;
