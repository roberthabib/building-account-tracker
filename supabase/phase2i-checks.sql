-- Phase 2i live checks — run AFTER phase2i-v166.sql.
--
-- Everything happens inside one transaction that is rolled back at the end:
-- two made-up phones (a concierge and a tenant) are created, act through the
-- same functions the app calls, and are thrown away with every change they
-- made. Push notifications queued meanwhile are rolled back too (pg_net only
-- sends after a commit).
--
-- Run in: SQL Editor -> paste -> Run. If the editor warns about a table
-- without RLS, that is the temporary results table: "Run without RLS".
-- Every row of the result should say ok = true.

begin;

create temp table r (n serial, name text, ok boolean);
grant all on r to authenticated;
grant usage on sequence r_n_seq to authenticated;

-- true when the statement raises an error (a refusal)
create function pg_temp.fails(p_sql text) returns boolean language plpgsql as $$
begin
  execute p_sql;
  return false;
exception when others then
  return true;
end;
$$;

insert into auth.users (id, aud, role, email, is_anonymous)
values ('00000000-0000-4000-a000-0000000000c1', 'authenticated', 'authenticated', 'check-concierge@example.invalid', true),
       ('00000000-0000-4000-a000-0000000000c2', 'authenticated', 'authenticated', 'check-tenant@example.invalid', true);

insert into public.profiles (auth_user_id, role, tenant_id)
values ('00000000-0000-4000-a000-0000000000c1', 'concierge', null),
       ('00000000-0000-4000-a000-0000000000c2', 'tenant',
        (select t->>'id' from public.building_state, jsonb_array_elements(state->'tenants') t
          where id = 'building' and coalesce((t->>'active')::boolean, true) limit 1))
on conflict (auth_user_id) do update set role = excluded.role, tenant_id = excluded.tenant_id;

-- ── As the concierge ────────────────────────────────────────────────────────
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-a000-0000000000c1","role":"authenticated","is_anonymous":true}', true);
set local role authenticated;

insert into r (name, ok) select 'concierge: recognised as concierge, not owner or tenant',
  public.is_concierge() and not public.is_owner() and public.my_tenant_id() is null;
insert into r (name, ok) select 'concierge: sees only expenses, no payments or opening balances',
  not exists (select 1 from jsonb_array_elements(public.get_my_state()->'transactions') x
               where x->>'category' not in ('Expenses', 'Services Expenses'));
insert into r (name, ok) select 'concierge: no per-flat shares on expenses',
  not exists (select 1 from jsonb_array_elements(public.get_my_state()->'transactions') x where x ? 'shares');
insert into r (name, ok) select 'concierge: no tenant phones or shares',
  not exists (select 1 from jsonb_array_elements(public.get_my_state()->'tenants') t
               where coalesce(t->>'phone', '') <> '' or coalesce(t->>'pinHash', '') <> '' or (t->>'coefficient')::numeric <> 0 or t ? 'details');
insert into r (name, ok) select 'concierge: no money collections (declarations, dues, cash counts, history, polls, projects, documents)',
  not (s ? 'paymentDeclarations' or s ? 'monthlyExpected' or s ? 'cashChecks' or s ? 'auditLog' or s ? 'balanceSnapshot'
       or s ? 'polls' or s ? 'buildingProjects' or s ? 'documents' or s ? 'recurringExpenses' or s ? 'budgets')
  from (select public.get_my_state() as s) x;
insert into r (name, ok) select 'concierge: credentials and message templates stripped from settings',
  not (s->'settings' ? 'ownerPasswordHash' or s->'settings' ? 'syncSecret' or s->'settings' ? 'messageTemplates')
  from (select public.get_my_state() as s) x;
insert into r (name, ok) select 'concierge: can add an expense',
  public.concierge_add_expense('{"description":"phase2i check","date":"2099-01-15","amountUsd":1}'::jsonb) like 'cx-%';
insert into r (name, ok) select 'concierge: the expense is marked as entered by the concierge',
  exists (select 1 from jsonb_array_elements(public.get_my_state()->'transactions') x
           where x->>'description' = 'phase2i check' and x->>'enteredBy' = 'concierge');
insert into r (name, ok) select 'concierge: refused in a closed month',
  coalesce((select pg_temp.fails(format('select public.concierge_add_expense(%L::jsonb)',
             jsonb_build_object('description', 'x', 'date', (l->>'id') || '-10', 'amountUsd', 1))))
              from public.building_state, jsonb_array_elements(coalesce(state->'monthLocks', '[]'::jsonb)) l
             where id = 'building' and coalesce((l->>'closed')::boolean, false) limit 1), true);
insert into r (name, ok) select 'concierge: refused a photo outside concierge/',
  pg_temp.fails($$select public.concierge_add_expense('{"description":"x","date":"2099-01-15","amountUsd":1,"photoPath":"2026/other.jpg"}'::jsonb)$$);
insert into r (name, ok) select 'concierge: cannot invite administrators', pg_temp.fails($$select public.create_admin_invite('viewer')$$);
insert into r (name, ok) select 'concierge: cannot vote', pg_temp.fails($$select public.cast_my_vote('x', 'yes')$$);
insert into r (name, ok) select 'concierge: cannot join the neighbours list', pg_temp.fails($$select public.set_directory_optin(true)$$);
insert into r (name, ok) select 'concierge: cannot read backups', pg_temp.fails($$select public.list_backups()$$);
insert into r (name, ok) select 'concierge: cannot run the notice sender', pg_temp.fails($$select public.send_due_notices()$$);

-- ── As a tenant phone ───────────────────────────────────────────────────────
reset role;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-a000-0000000000c2","role":"authenticated","is_anonymous":true}', true);
set local role authenticated;

insert into r (name, ok) select 'tenant: linked to a flat', public.my_tenant_id() is not null and not public.is_concierge();
insert into r (name, ok) select 'tenant: cannot add a concierge expense',
  pg_temp.fails($$select public.concierge_add_expense('{"description":"x","date":"2099-01-15","amountUsd":1}'::jsonb)$$);
insert into r (name, ok) select 'tenant: cannot save meter readings', pg_temp.fails($$select public.concierge_save_readings('2099-01-01', '{}'::jsonb)$$);
insert into r (name, ok) select 'tenant: no equipment list, documents or supplier book',
  not (s ? 'equipment' or s ? 'documents' or s ? 'suppliers') from (select public.get_my_state() as s) x;
insert into r (name, ok) select 'tenant: notices carry seenByMe, never the list of who saw them',
  not exists (select 1 from jsonb_array_elements(coalesce(public.get_my_state()->'announcements', '[]'::jsonb)) n
               where n ? 'seenBy' or not (n ? 'seenByMe'));
insert into r (name, ok) select 'tenant: unscheduled-yet notices hidden',
  not exists (select 1 from jsonb_array_elements(coalesce(public.get_my_state()->'announcements', '[]'::jsonb)) n
               where coalesce(n->>'publishAt', '') <> '' and (n->>'publishAt')::timestamptz > now());
insert into r (name, ok) select 'tenant: not sharing → sees no neighbours', jsonb_array_length(public.get_my_state()->'directory') = 0
  where not coalesce((select (t->>'directory')::boolean from jsonb_array_elements(public.get_my_state()->'tenants') t
                       where t->>'id' = public.my_tenant_id()), false);
select public.set_directory_optin(true);
insert into r (name, ok) select 'tenant: can choose to share',
  coalesce((select (t->>'directory')::boolean from jsonb_array_elements(public.get_my_state()->'tenants') t
             where t->>'id' = public.my_tenant_id()), false);
insert into r (name, ok) select 'tenant: sharing → sees only neighbours who share',
  jsonb_array_length(public.get_my_state()->'directory') =
  (select count(*) from public.building_state, jsonb_array_elements(state->'tenants') t
    where id = 'building' and t->>'id' <> public.my_tenant_id()
      and coalesce((t->>'directory')::boolean, false) and coalesce((t->>'active')::boolean, true));
select public.set_directory_optin(false);
insert into r (name, ok) select 'tenant: can stop sharing', jsonb_array_length(public.get_my_state()->'directory') = 0;
insert into r (name, ok) select 'tenant: marking an unknown notice seen is harmless', not pg_temp.fails($$select public.mark_notice_seen('no-such-notice')$$);
insert into r (name, ok) select 'tenant: cannot reply on a problem that is not theirs',
  pg_temp.fails($$select public.reply_issue('no-such-problem', 'hello')$$);
insert into r (name, ok) select 'tenant: a vote must be yes / no / abstain or one of the choices',
  coalesce((select pg_temp.fails(format('select public.cast_my_vote(%L, %L)', p->>'id', 'not-a-choice'))
              from public.building_state, jsonb_array_elements(coalesce(state->'polls', '[]'::jsonb)) p
             where id = 'building' and p->>'status' = 'open' limit 1), true);
insert into r (name, ok) select 'tenant: cannot invite administrators', pg_temp.fails($$select public.create_admin_invite('concierge')$$);

-- ── Set-up ──────────────────────────────────────────────────────────────────
reset role;
insert into r (name, ok) select 'scheduled notices job runs every 15 minutes',
  exists (select 1 from cron.job where jobname = 'scheduled-notices' and schedule = '*/15 * * * *');
insert into r (name, ok) select 'storage: concierge upload rule in place',
  exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'concierge upload photos');
insert into r (name, ok) select 'anonymous key cannot call the new functions',
  not has_function_privilege('anon', 'public.concierge_add_expense(jsonb)', 'execute')
  and not has_function_privilege('anon', 'public.reply_issue(text, text, text)', 'execute')
  and not has_function_privilege('anon', 'public.get_my_state()', 'execute');

select n, name, ok from r order by n;
rollback;

-- Afterwards, as a separate query, confirm nothing was left behind (expect 0):
--   select count(*) from auth.users where email like 'check-%@example.invalid';
