-- Phase 2s — v187: rentals round C — the owners' monthly rent statement
--
--   * on the 2nd of every month, the phone of each rented flat's owner is told
--     that last month's rent statement is ready (the app makes the PDF from
--     the owner's rented-flat account; the manager's own flats are skipped)
--   * notifications can go to a flat's owner only (target 'owner'), not its
--     tenant
--
-- Run in: Supabase dashboard -> SQL Editor -> New query -> paste -> Run.
-- Safe to re-run. Needs phase2a–2r.

create table if not exists public.owner_statement_log (
  lease_id text not null,
  month text not null,
  sent_at timestamptz not null default now(),
  primary key (lease_id, month)
);
alter table public.owner_statement_log enable row level security;
revoke all on public.owner_statement_log from public, anon, authenticated;

alter table public.push_jobs drop constraint if exists push_jobs_target_check;
alter table public.push_jobs add constraint push_jobs_target_check check (target in ('admins', 'tenants', 'renter', 'owner'));

-- public.enqueue_push
create or replace function public.enqueue_push(p_target text, p_tenant_id text, p_title text, p_body text)
returns void
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_id uuid;
  v_b text := public.my_building();
begin
  if v_b is null or not exists (
    select 1 from public.push_subscriptions s
      join public.memberships m on m.auth_user_id = s.auth_user_id and m.building_id = v_b
     where (p_target = 'admins' and m.role in ('owner', 'viewer'))
        or (p_target = 'tenants' and (m.role = 'tenant' or (m.role = 'renter' and public.lease_active(m.lease_id))) and (p_tenant_id is null or m.tenant_id = p_tenant_id))
        or (p_target = 'renter' and m.role = 'renter' and m.lease_id = p_tenant_id and public.lease_active(m.lease_id))
        or (p_target = 'owner' and m.role = 'tenant' and m.tenant_id = p_tenant_id)
  ) then
    return;
  end if;
  insert into public.push_jobs (building_id, target, tenant_id, title, body)
       values (v_b, p_target, p_tenant_id, left(p_title, 120), left(p_body, 400))
  returning id into v_id;
  begin
    perform net.http_post(
      url := 'https://building-account-tracker.vercel.app/api/push',
      body := jsonb_build_object('job', v_id),
      headers := '{"Content-Type": "application/json"}'::jsonb
    );
  exception when others then
    null; -- notifications are best effort: never block the write that caused them
  end;
  delete from public.push_jobs where created_at < now() - interval '2 days';
end;
$$;

-- public.claim_push_job
create or replace function public.claim_push_job(p_job uuid)
returns jsonb
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_job public.push_jobs;
  v_subs jsonb;
  v_title text;
  v_name text;
begin
  update public.push_jobs set taken_at = now()
   where id = p_job and taken_at is null and created_at > now() - interval '10 minutes'
  returning * into v_job;
  if v_job.id is null then return null; end if;
  select coalesce(jsonb_agg(jsonb_build_object('endpoint', s.endpoint,
                                               'keys', jsonb_build_object('p256dh', s.p256dh, 'auth', s.auth))), '[]'::jsonb)
    into v_subs
    from public.push_subscriptions s
    join public.memberships m on m.auth_user_id = s.auth_user_id and m.building_id = v_job.building_id
   where (v_job.target = 'admins' and m.role in ('owner', 'viewer'))
      or (v_job.target = 'tenants' and (m.role = 'tenant' or (m.role = 'renter' and public.lease_active(m.lease_id))) and (v_job.tenant_id is null or m.tenant_id = v_job.tenant_id))
      or (v_job.target = 'renter' and m.role = 'renter' and m.lease_id = v_job.tenant_id and public.lease_active(m.lease_id))
      or (v_job.target = 'owner' and m.role = 'tenant' and m.tenant_id = v_job.tenant_id);
  v_title := v_job.title;
  -- A manager with several buildings needs to know which one it is about.
  if v_job.target = 'admins'
     and (select count(distinct building_id) from public.memberships where role = 'owner') > 1 then
    select nullif(state->'building'->>'name', '') into v_name from public.building_state where id = v_job.building_id;
    if v_name is not null then v_title := v_name || ' · ' || v_title; end if;
  end if;
  return jsonb_build_object('title', v_title, 'body', v_job.body, 'building', v_job.building_id, 'subscriptions', v_subs);
end;
$$;

create or replace function public.send_owner_statements()
returns int
language plpgsql security definer set search_path = public, extensions
as $$
declare
  l record;
  v_month date := (date_trunc('month', current_date) - interval '1 month')::date;
  v_key text := to_char(v_month, 'YYYY-MM');
  v_ar boolean;
  v_building text;
  v_month_label text;
  v_sent int := 0;
  v_ar_months text[] := array['كانون الثاني', 'شباط', 'آذار', 'نيسان', 'أيار', 'حزيران', 'تموز', 'آب', 'أيلول', 'تشرين الأول', 'تشرين الثاني', 'كانون الأول'];
begin
  for l in select le.* from public.leases le
            where coalesce((le.data->>'ownFlat')::boolean, false) = false
              and coalesce(le.data->>'start', '9999') < to_char(v_month + interval '1 month', 'YYYY-MM-DD')
              and (coalesce(le.data->>'status', 'active') <> 'ended' or coalesce(le.data->>'endedOn', '') >= to_char(v_month, 'YYYY-MM-DD'))
  loop
    begin
      if exists (select 1 from public.owner_statement_log where lease_id = l.id and month = v_key) then continue; end if;
      select coalesce(nullif(state->'building'->>'name', ''), ''),
             coalesce((select nullif(t->>'language', '') from jsonb_array_elements(coalesce(state->'tenants', '[]'::jsonb)) t where t->>'id' = l.flat_id limit 1),
                      state->'settings'->>'language', 'en') = 'ar'
        into v_building, v_ar
        from public.building_state where id = l.building_id;
      v_month_label := case when v_ar then v_ar_months[extract(month from v_month)::int] || ' ' || extract(year from v_month)::int
                            else to_char(v_month, 'FMMonth YYYY') end;
      perform set_config('app.building', l.building_id, true);
      perform public.enqueue_push('owner', l.flat_id,
        case when v_ar then 'كشف الإيجار — ' || v_building else 'Rent statement — ' || v_building end,
        case when v_ar then 'كشف ' || v_month_label || ' جاهز: افتح التطبيق ← شقتك المؤجّرة.'
             else 'Your statement for ' || v_month_label || ' is ready: open the app → Your rented flat.' end);
      insert into public.owner_statement_log (lease_id, month) values (l.id, v_key) on conflict do nothing;
      v_sent := v_sent + 1;
    exception when others then
      raise warning 'send_owner_statements: lease % failed: %', l.id, sqlerrm;
    end;
  end loop;
  perform set_config('app.building', '', true);
  return v_sent;
end;
$$;

do $$
begin
  if exists (select 1 from cron.job where jobname = 'owner-statements') then
    perform cron.unschedule('owner-statements');
  end if;
end;
$$;
select cron.schedule('owner-statements', '0 7 2 * *', $$select public.send_owner_statements()$$);

revoke all on function public.send_owner_statements() from public, anon, authenticated;
