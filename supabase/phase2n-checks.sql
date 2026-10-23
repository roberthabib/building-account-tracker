-- Phase 2n live checks — run AFTER phase2n-v178.sql.
--
-- Everything happens inside one transaction that is rolled back at the end:
-- two made-up buildings, their managers, a view-only helper, a resident and
-- made-up leases; nothing is kept. The real building is only read.
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

create function pg_temp.as_user(p_id text, p_anon boolean, p_building text) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', p_id, 'role', 'authenticated', 'is_anonymous', p_anon)::text, true);
  perform set_config('request.headers',
    case when p_building is null then '{}' else json_build_object('x-building', p_building)::text end, true);
end;
$$;

insert into auth.users (id, aud, role, email, is_anonymous)
values ('00000000-0000-4000-a000-000000000201', 'authenticated', 'authenticated', 'check-manager-r@example.invalid', false),
       ('00000000-0000-4000-a000-000000000202', 'authenticated', 'authenticated', 'check-viewer-r@example.invalid', false),
       ('00000000-0000-4000-a000-000000000203', 'authenticated', 'authenticated', 'check-resident-r@example.invalid', true),
       ('00000000-0000-4000-a000-000000000204', 'authenticated', 'authenticated', 'check-manager-s@example.invalid', false);

insert into public.building_state (id, state, rev) values
  ('zzcheckr', '{"building":{"name":"Check R"},"tenants":[{"id":"fr1","name":"Owner One","unit":"R1","active":true}]}', 1),
  ('zzchecks', '{"building":{"name":"Check S"},"tenants":[{"id":"fs1","name":"Owner Two","unit":"S1","active":true}]}', 1);

insert into public.memberships (auth_user_id, building_id, role, tenant_id) values
  ('00000000-0000-4000-a000-000000000201', 'zzcheckr', 'owner', null),
  ('00000000-0000-4000-a000-000000000202', 'zzcheckr', 'viewer', null),
  ('00000000-0000-4000-a000-000000000203', 'zzcheckr', 'tenant', 'fr1'),
  ('00000000-0000-4000-a000-000000000204', 'zzchecks', 'owner', null);

set local role authenticated;

-- ── The manager of R ──
select pg_temp.as_user('00000000-0000-4000-a000-000000000201', false, 'zzcheckr');
insert into r (name, ok) select 'manager: no leases yet', jsonb_array_length(public.list_leases()) = 0;
insert into r (name, ok) select 'manager: adds a lease', public.save_lease('zz-check-lease-1', 'fr1', '{"tenant":{"name":"Tenant One"},"rent":600,"currency":"USD","period":"monthly","start":"2026-09-01"}', 0) = 1;
insert into r (name, ok) select 'manager: sees it', jsonb_array_length(public.list_leases()) = 1
  and public.list_leases()->0->>'flatId' = 'fr1' and (public.list_leases()->0->'data'->>'rent')::int = 600;
insert into r (name, ok) select 'manager: updates it with the right version', public.save_lease('zz-check-lease-1', 'fr1', '{"tenant":{"name":"Tenant One"},"rent":650,"currency":"USD","period":"monthly","start":"2026-09-01"}', 1) = 2;
insert into r (name, ok) select 'manager: a stale copy is refused', pg_temp.fails($$select public.save_lease('zz-check-lease-1', 'fr1', '{"rent":1}', 1)$$);
insert into r (name, ok) select 'manager: a bad id is refused', pg_temp.fails($$select public.save_lease('x', 'fr1', '{"rent":1}', 0)$$);
insert into r (name, ok) select 'manager: a lease needs a flat', pg_temp.fails($$select public.save_lease('zz-check-lease-2', ' ', '{"rent":1}', 0)$$);
insert into r (name, ok) select 'manager: adds and deletes a second lease', public.save_lease('zz-check-lease-2', 'fr2', '{"rent":1}', 0) = 1
  and not pg_temp.fails($$select public.delete_lease('zz-check-lease-2')$$);
insert into r (name, ok) select 'manager: the deleted lease is gone', jsonb_array_length(public.list_leases()) = 1;

-- ── Others in building R ──
select pg_temp.as_user('00000000-0000-4000-a000-000000000202', false, 'zzcheckr');
insert into r (name, ok) select 'view-only helper: no rentals', pg_temp.fails($$select public.list_leases()$$);
insert into r (name, ok) select 'view-only helper: cannot change them', pg_temp.fails($$select public.save_lease('zz-check-lease-1', 'fr1', '{"rent":1}', 2)$$);
select pg_temp.as_user('00000000-0000-4000-a000-000000000203', true, null);
insert into r (name, ok) select 'resident: no rentals', pg_temp.fails($$select public.list_leases()$$);
insert into r (name, ok) select 'resident: cannot delete them', pg_temp.fails($$select public.delete_lease('zz-check-lease-1')$$);

-- ── The manager of another building ──
select pg_temp.as_user('00000000-0000-4000-a000-000000000204', false, 'zzchecks');
insert into r (name, ok) select 'other building: sees none of R''s leases', jsonb_array_length(public.list_leases()) = 0;
insert into r (name, ok) select 'other building: cannot overwrite R''s lease', pg_temp.fails($$select public.save_lease('zz-check-lease-1', 'fs1', '{"rent":1}', 2)$$);
insert into r (name, ok) select 'other building: cannot delete R''s lease', pg_temp.fails($$select public.delete_lease('zz-check-lease-1')$$);
select pg_temp.as_user('00000000-0000-4000-a000-000000000204', false, 'zzcheckr');
insert into r (name, ok) select 'other manager asking for R: refused', pg_temp.fails($$select public.list_leases()$$);

reset role;
insert into r (name, ok) select 'leases are private (no direct table access)',
  not has_table_privilege('authenticated', 'public.leases', 'select')
  and not has_table_privilege('anon', 'public.leases', 'select');
insert into r (name, ok) select 'the lease stayed in R with its last rent',
  (select building_id = 'zzcheckr' and (data->>'rent')::int = 650 and rev = 2 from public.leases where id = 'zz-check-lease-1');

select n, name, ok from r order by n;
rollback;
