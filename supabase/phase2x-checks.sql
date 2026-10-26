-- Phase 2x live checks — run AFTER phase2x-v212.sql.
--
-- Everything happens inside one transaction that is rolled back at the end:
-- a made-up building; nothing is kept.
--
-- Run in: SQL Editor -> paste -> Run ("Run without RLS" if asked).
-- Every row of the result should say ok = true.

begin;

create temp table r (n serial, name text, ok boolean);

create function pg_temp.fails(p_sql text) returns boolean language plpgsql as $$
begin
  execute p_sql;
  return false;
exception when others then
  return true;
end;
$$;

insert into public.building_state (id, state, rev) values
  ('zzcheckx', '{"building":{"name":"Check X"},"settings":{},"tenants":[],"transactions":[{"id":"zz-x-1","category":"Payments","creditUsd":100}]}', 1);

insert into r (name, ok) select 'a full building is saved as before',
  not pg_temp.fails($q$update public.building_state set state = state || '{"monthlyExpected":[{"month":"2026-10-01","expectedUsd":700}]}' where id = 'zzcheckx'$q$);
insert into r (name, ok) select 'a concierge''s cut-down copy is refused',
  pg_temp.fails($q$update public.building_state set state = '{"building":{"name":"Check X"},"transactions":[],"redaction":{"role":"concierge"}}' where id = 'zzcheckx'$q$);
insert into r (name, ok) select 'a resident''s copy is refused too',
  pg_temp.fails($q$update public.building_state set state = state || '{"redaction":{"tenantId":"x"}}' where id = 'zzcheckx'$q$);
insert into r (name, ok) select 'a new building with a cut-down copy is refused',
  pg_temp.fails($q$insert into public.building_state (id, state, rev) values ('zzcheckx2', '{"redaction":{"role":"concierge"}}', 1)$q$);
insert into r (name, ok) select 'the building kept its payment and its month',
  (select jsonb_array_length(state->'transactions') = 1 and jsonb_array_length(state->'monthlyExpected') = 1 from public.building_state where id = 'zzcheckx');
insert into r (name, ok) select 'the real building has no cut-down marker',
  not exists (select 1 from public.building_state where state ? 'redaction');

select n, name, ok from r order by n;
rollback;
