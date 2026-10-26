-- Phase 2y live checks — run AFTER phase2y-v214.sql.
--
-- Everything happens inside one transaction that is rolled back at the end:
-- a made-up building with a made-up manager, concierge and tenant; nothing
-- is kept. The real building is not touched.
--
-- Run in: SQL Editor -> paste -> Run ("Run without RLS" if asked).
-- Every row of the result should say ok = true.

begin;

create temp table r (n serial, name text, ok boolean);
grant all on r to authenticated;
grant usage on sequence r_n_seq to authenticated;
create temp table v (k text primary key, val text);
grant all on v to authenticated;

create function pg_temp.as_user(p_id text, p_anon boolean, p_building text) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', p_id, 'role', 'authenticated', 'is_anonymous', p_anon)::text, true);
  perform set_config('request.headers',
    case when p_building is null then '{}' else json_build_object('x-building', p_building)::text end, true);
end;
$$;

create function pg_temp.tx_ids() returns text language sql as $$
  select coalesce(string_agg(x->>'id', ',' order by x->>'id'), '')
    from jsonb_array_elements(coalesce(public.get_my_state()->'transactions', '[]'::jsonb)) x;
$$;

insert into auth.users (id, aud, role, email, is_anonymous)
values ('00000000-0000-4000-a000-0000000000e1', 'authenticated', 'authenticated', 'check-y-manager@example.invalid', false),
       ('00000000-0000-4000-a000-0000000000e2', 'authenticated', 'authenticated', 'check-y-concierge@example.invalid', true),
       ('00000000-0000-4000-a000-0000000000e3', 'authenticated', 'authenticated', 'check-y-tenant@example.invalid', true);

insert into public.building_state (id, state, rev) values
  ('zzchecky', '{"building":{"name":"Check Y"},"settings":{"collectionMode":"fixed"},
                 "tenants":[{"id":"fy","name":"Flat Y","unit":"Y1","active":true,"coefficient":100}],
                 "transactions":[
                   {"id":"y-1","category":"Expenses","description":"Bulbs","debitUsd":12,"enteredBy":"concierge"},
                   {"id":"y-2","category":"Expenses","description":"Salaries","debitUsd":300},
                   {"id":"y-3","category":"Services Expenses","description":"Diesel","debitUsd":200},
                   {"id":"y-4","category":"Payments","tenantId":"fy","creditUsd":100}]}', 1);

insert into public.memberships (auth_user_id, building_id, role, tenant_id) values
  ('00000000-0000-4000-a000-0000000000e1', 'zzchecky', 'owner', null),
  ('00000000-0000-4000-a000-0000000000e3', 'zzchecky', 'tenant', 'fy');

set local role authenticated;

select pg_temp.as_user('00000000-0000-4000-a000-0000000000e1', false, 'zzchecky');
insert into v values ('invite', public.create_admin_invite('concierge'));

select pg_temp.as_user('00000000-0000-4000-a000-0000000000e2', true, null);
insert into r (name, ok) select 'concierge: joins the building', public.claim_admin_invite((select val from v where k = 'invite')) = 'concierge';
insert into r (name, ok) select 'concierge: is the building''s concierge', public.is_concierge();
insert into r (name, ok) select 'concierge: gets only the expense he entered', pg_temp.tx_ids() = 'y-1';
insert into r (name, ok) select 'concierge: still a cut-down copy', public.get_my_state() ? 'redaction';

select pg_temp.as_user('00000000-0000-4000-a000-0000000000e2', true, null);
insert into r (name, ok) select 'concierge: an expense he adds shows up for him', (
  select public.concierge_add_expense(jsonb_build_object('description', 'Soap', 'date', to_char(current_date, 'YYYY-MM-DD'), 'amountUsd', 5)) is not null
     and pg_temp.tx_ids() like 'cx-%,y-1');

select pg_temp.as_user('00000000-0000-4000-a000-0000000000e3', true, null);
insert into r (name, ok) select 'tenant: still sees the building''s expenses', (
  select count(*) from jsonb_array_elements(public.get_my_state()->'transactions') x where x->>'category' in ('Expenses', 'Services Expenses')) = 4;

reset role;
select n, name, ok from r order by n;
rollback;
