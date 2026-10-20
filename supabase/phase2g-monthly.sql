-- Phase 2g — v153: balance notification on the 1st of each month
--
-- The owner's device keeps state.balanceSnapshot = { at, items: { tenantId: dueUsd } }
-- up to date. On the 1st (08:00 Beirut) pg_cron calls send_monthly_balances(),
-- which queues one phone notification per tenant who owes money (only tenants
-- with notifications turned on actually receive one — see enqueue_push).
-- get_my_state now also strips balanceSnapshot, so tenants never see the list.
--
-- Run in: Supabase dashboard -> SQL Editor -> New query -> paste -> Run.
-- Safe to re-run. Needs phase2f.

create or replace function public.get_my_state()
returns jsonb
language plpgsql stable security definer set search_path = public, extensions
as $$
declare
  v_orig  jsonb;
  v_state jsonb;
  v_me    text;
begin
  select state into v_orig from public.building_state where id = 'building';
  if v_orig is null then
    return null;
  end if;
  if public.is_owner() or public.is_viewer() then
    return v_orig;
  end if;
  v_me := public.my_tenant_id();
  if v_me is null then
    raise exception 'This device is not linked to a tenant yet';
  end if;
  v_state := v_orig - 'auditLog' - 'cashChecks' - 'balanceSnapshot';

  v_state := jsonb_set(v_state, '{tenants}', coalesce((
    select jsonb_agg(t - 'pinHash') from jsonb_array_elements(coalesce(v_orig->'tenants', '[]'::jsonb)) t
     where t->>'id' = v_me), '[]'::jsonb));

  v_state := jsonb_set(v_state, '{transactions}', coalesce((
    select jsonb_agg(
             case when jsonb_typeof(x->'shares') = 'object'
                  then jsonb_set(x, '{shares}',
                         case when x->'shares' ? v_me then jsonb_build_object(v_me, x->'shares'->v_me) else '{}'::jsonb end)
                  else x end)
      from jsonb_array_elements(coalesce(v_orig->'transactions', '[]'::jsonb)) x
     where coalesce(x->>'tenantId', '') in ('', v_me)), '[]'::jsonb));

  v_state := jsonb_set(v_state, '{paymentDeclarations}', coalesce((
    select jsonb_agg(d) from jsonb_array_elements(coalesce(v_orig->'paymentDeclarations', '[]'::jsonb)) d
     where d->>'tenantId' = v_me), '[]'::jsonb));

  v_state := jsonb_set(v_state, '{paymentPlans}', coalesce((
    select jsonb_agg(p) from jsonb_array_elements(coalesce(v_orig->'paymentPlans', '[]'::jsonb)) p
     where p->>'tenantId' = v_me), '[]'::jsonb));

  v_state := jsonb_set(v_state, '{issues}', coalesce((
    select jsonb_agg(i) from jsonb_array_elements(coalesce(v_orig->'issues', '[]'::jsonb)) i
     where coalesce(i->>'tenantId', '') in ('', v_me)), '[]'::jsonb));

  v_state := jsonb_set(v_state, '{buildingProjects}', coalesce((
    select jsonb_agg(
             case when jsonb_typeof(p->'shares') = 'object'
                  then jsonb_set(p, '{shares}',
                         case when p->'shares' ? v_me then jsonb_build_object(v_me, p->'shares'->v_me) else '{}'::jsonb end)
                  else p end)
      from jsonb_array_elements(coalesce(v_orig->'buildingProjects', '[]'::jsonb)) p), '[]'::jsonb));

  -- Poll votes: the caller's own vote, anonymous counts, and the same counts
  -- weighted by each active unit's coefficient (ownership share).
  v_state := jsonb_set(v_state, '{polls}', coalesce((
    select jsonb_agg(
             (p - 'votes')
             || jsonb_build_object('votes', case when p->'votes' ? v_me then jsonb_build_object(v_me, p->'votes'->v_me) else '{}'::jsonb end)
             || jsonb_build_object('voteCounts', jsonb_build_object(
                  'yes',     (select count(*) from jsonb_each_text(coalesce(p->'votes', '{}'::jsonb)) v where v.value = 'yes'),
                  'no',      (select count(*) from jsonb_each_text(coalesce(p->'votes', '{}'::jsonb)) v where v.value = 'no'),
                  'abstain', (select count(*) from jsonb_each_text(coalesce(p->'votes', '{}'::jsonb)) v where v.value = 'abstain'),
                  'yesShare', (select coalesce(sum(coalesce(nullif(t->>'coefficient', '')::numeric, 0)), 0)
                                 from jsonb_array_elements(coalesce(v_orig->'tenants', '[]'::jsonb)) t
                                 join jsonb_each_text(coalesce(p->'votes', '{}'::jsonb)) v on v.key = t->>'id'
                                where v.value = 'yes' and coalesce((t->>'active')::boolean, true)),
                  'noShare', (select coalesce(sum(coalesce(nullif(t->>'coefficient', '')::numeric, 0)), 0)
                                 from jsonb_array_elements(coalesce(v_orig->'tenants', '[]'::jsonb)) t
                                 join jsonb_each_text(coalesce(p->'votes', '{}'::jsonb)) v on v.key = t->>'id'
                                where v.value = 'no' and coalesce((t->>'active')::boolean, true)),
                  'abstainShare', (select coalesce(sum(coalesce(nullif(t->>'coefficient', '')::numeric, 0)), 0)
                                 from jsonb_array_elements(coalesce(v_orig->'tenants', '[]'::jsonb)) t
                                 join jsonb_each_text(coalesce(p->'votes', '{}'::jsonb)) v on v.key = t->>'id'
                                where v.value = 'abstain' and coalesce((t->>'active')::boolean, true)),
                  'totalShare', (select coalesce(sum(coalesce(nullif(t->>'coefficient', '')::numeric, 0)), 0)
                                 from jsonb_array_elements(coalesce(v_orig->'tenants', '[]'::jsonb)) t
                                where coalesce((t->>'active')::boolean, true)),
                  'units', (select count(*) from jsonb_array_elements(coalesce(v_orig->'tenants', '[]'::jsonb)) t
                                where coalesce((t->>'active')::boolean, true)))))
      from jsonb_array_elements(coalesce(v_orig->'polls', '[]'::jsonb)) p), '[]'::jsonb));

  v_state := jsonb_set(v_state, '{settings}',
    (coalesce(v_state->'settings', '{}'::jsonb)
       - 'ownerPasswordHash' - 'syncSecret' - 'invoiceUploadUrl'
       - 'cloudSpreadsheetId' - 'invoiceUploadFolderId'
       - 'supabaseUrl' - 'supabaseAnonKey'));

  v_state := v_state || jsonb_build_object('redaction', jsonb_build_object(
    'tenantId', v_me,
    'activeCoefficientTotal', coalesce((
      select sum(coalesce(nullif(t->>'coefficient', '')::numeric, 0))
        from jsonb_array_elements(coalesce(v_orig->'tenants', '[]'::jsonb)) t
       where coalesce((t->>'active')::boolean, true)), 0),
    'activeTenantCount', coalesce((
      select count(*) from jsonb_array_elements(coalesce(v_orig->'tenants', '[]'::jsonb)) t
       where coalesce((t->>'active')::boolean, true)), 0)));

  return v_state;
end;
$$;

create or replace function public.send_monthly_balances()
returns int
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_state jsonb;
  v_ar boolean;
  v_building text;
  v_at text;
  v_sent int := 0;
  r record;
begin
  select state into v_state from public.building_state where id = 'building';
  if v_state is null then return 0; end if;
  if coalesce(v_state->'settings'->>'monthlyBalanceNotices', 'true') = 'false' then return 0; end if;
  v_ar := coalesce(v_state->'settings'->>'language', 'en') = 'ar';
  v_building := coalesce(nullif(v_state->'building'->>'name', ''), '');
  v_at := coalesce(v_state->'balanceSnapshot'->>'at', '');
  for r in
    select key as tenant_id, (value #>> '{}')::numeric as due
      from jsonb_each(coalesce(v_state->'balanceSnapshot'->'items', '{}'::jsonb))
  loop
    if r.due > 0.005 then
      perform public.enqueue_push('tenants', r.tenant_id,
        case when v_ar then 'رصيدك — ' || v_building else 'Your balance — ' || v_building end,
        case when v_ar
          then 'المبلغ المستحق عليك $' || trim(to_char(r.due, 'FM999,999,990.00')) || ' (حتى ' || v_at || '). شكراً لتسديده.'
          else 'You owe $' || trim(to_char(r.due, 'FM999,999,990.00')) || ' (as of ' || v_at || '). Thank you for settling it.'
        end);
      v_sent := v_sent + 1;
    end if;
  end loop;
  return v_sent;
end;
$$;
revoke all on function public.send_monthly_balances() from public, anon, authenticated;
select cron.schedule('monthly-balance-notices', '0 5 1 * *', $$select public.send_monthly_balances()$$);
