-- Phase 2q — v185: rentals round A — rent reminders and "I've paid my rent"
--
--   * every morning the tenant's phone gets a reminder 3 days before the rent
--     is due, and on the day it becomes late (then weekly, 4 times at most)
--     while rent is owed. The manager's app keeps a small schedule on each
--     lease (data.schedule: rent already due before the current period, rent
--     received, and the coming periods), so the server needs no rent maths
--   * the tenant can say they paid the rent, with a photo of the transfer:
--     declare_rent_payment() adds it to the lease and tells the manager
--   * notifications can now go to one lease's tenant only (target 'renter')
--   * tenants' phones can upload and open photos like the flat's owner
--     (problem photos, payment proofs, invoices) while their lease runs
--
-- Run in: Supabase dashboard -> SQL Editor -> New query -> paste -> Run.
-- Safe to re-run. Needs phase2a–2p.

create table if not exists public.rent_reminder_log (
  lease_id text not null,
  kind text not null,
  period_start text not null,
  sent_at timestamptz not null default now(),
  primary key (lease_id, kind, period_start)
);
alter table public.rent_reminder_log enable row level security;
revoke all on public.rent_reminder_log from public, anon, authenticated;

alter table public.push_jobs drop constraint if exists push_jobs_target_check;
alter table public.push_jobs add constraint push_jobs_target_check check (target in ('admins', 'tenants', 'renter'));

-- The flat a phone acts for in photo paths: owners, and tenants while their
-- lease runs.
create or replace function public.photo_tenant(p_name text)
returns text
language sql stable security definer set search_path = public, extensions
as $$
  select tenant_id from public.memberships
   where auth_user_id = auth.uid() and building_id = public.photo_building(p_name)
     and (role = 'tenant' or (role = 'renter' and public.lease_active(lease_id)));
$$;

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
      or (v_job.target = 'renter' and m.role = 'renter' and m.lease_id = v_job.tenant_id and public.lease_active(m.lease_id));
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

-- ── "I've paid my rent" ──────────────────────────────────────────────────────
create or replace function public.declare_rent_payment(p_amount numeric, p_date text, p_method text default null, p_proof_path text default null)
returns void
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_lease public.leases;
  v_decl jsonb;
  v_ar boolean;
  v_money text;
begin
  if not public.is_renter() then raise exception 'Only the flat''s tenant can do this'; end if;
  select l.* into v_lease from public.memberships m join public.leases l on l.id = m.lease_id
   where m.auth_user_id = auth.uid() and m.building_id = public.my_building() and m.role = 'renter';
  if v_lease.id is null or coalesce(v_lease.data->>'status', 'active') = 'ended' then
    raise exception 'This lease has ended. Ask the building manager if this is a mistake.';
  end if;
  if p_amount is null or p_amount <= 0 or p_amount > 1000000000 then raise exception 'Amount out of range'; end if;
  if coalesce(p_date, '') !~ '^\d{4}-\d{2}-\d{2}$' then raise exception 'Date must look like YYYY-MM-DD'; end if;
  if p_proof_path is not null and public.local_path(p_proof_path) not like 'proofs/' || v_lease.flat_id || '/%' then
    raise exception 'Proof photo must be one of your own uploads';
  end if;
  if (select count(*) from jsonb_array_elements(coalesce(v_lease.data->'declarations', '[]'::jsonb)) d where d->>'status' = 'pending') >= 5 then
    raise exception 'You already have payments waiting for the building manager';
  end if;
  v_decl := jsonb_build_object(
    'id', 'rdecl-' || encode(gen_random_bytes(6), 'hex'), 'amount', p_amount, 'date', p_date,
    'method', left(coalesce(p_method, ''), 20), 'status', 'pending',
    'at', to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'));
  if p_proof_path is not null then
    v_decl := v_decl || jsonb_build_object('proof', jsonb_build_object('storagePath', p_proof_path, 'fileName', 'rent-proof.jpg', 'mimeType', 'image/jpeg'));
  end if;
  update public.leases
     set data = jsonb_set(data, '{declarations}', coalesce(data->'declarations', '[]'::jsonb) || v_decl, true),
         rev = rev + 1, updated_at = now()
   where id = v_lease.id;
  v_ar := coalesce((select state->'settings'->>'language' from public.building_state where id = v_lease.building_id), 'en') = 'ar';
  v_money := case when coalesce(v_lease.data->>'currency', 'USD') = 'LBP'
                  then trim(to_char(p_amount, 'FM999,999,999,990')) || ' LBP'
                  else '$' || trim(to_char(p_amount, 'FM999,999,990.00')) end;
  perform public.enqueue_push('admins', null,
    case when v_ar then 'دفعة إيجار' else 'Rent payment' end,
    coalesce(nullif(v_lease.data->'tenant'->>'name', ''), case when v_ar then 'المستأجر' else 'The tenant' end)
      || case when v_ar then ' يقول إنه دفع الإيجار: ' else ' says they paid the rent: ' end || v_money);
end;
$$;

-- ── Daily rent reminders ─────────────────────────────────────────────────────
-- data.schedule = { asOf, currency, dueBefore (rent due before the first listed
-- period), paid (rent received), periods: [{ start, lateFrom, amount }] }.
create or replace function public.send_rent_reminders()
returns int
language plpgsql security definer set search_path = public, extensions
as $$
declare
  l record;
  v_s jsonb;
  v_today text := to_char(current_date, 'YYYY-MM-DD');
  v_soon text := to_char(current_date + 3, 'YYYY-MM-DD');
  v_owed numeric;
  v_p jsonb;
  v_ar boolean;
  v_money text;
  v_building text;
  v_week int;
  v_sent int := 0;
begin
  for l in select le.* from public.leases le
            where coalesce(le.data->>'status', 'active') <> 'ended'
              and coalesce(le.data->>'autoReminders', 'true') <> 'false'
              and jsonb_typeof(le.data->'schedule'->'periods') = 'array'
              and exists (select 1 from public.memberships m where m.lease_id = le.id and m.role = 'renter')
  loop
    begin
      v_s := l.data->'schedule';
      v_ar := coalesce(l.data->'tenant'->>'language', 'en') = 'ar';
      select coalesce(nullif(state->'building'->>'name', ''), '') into v_building from public.building_state where id = l.building_id;
      v_owed := coalesce(nullif(v_s->>'dueBefore', '')::numeric, 0)
              + coalesce((select sum(nullif(p->>'amount', '')::numeric) from jsonb_array_elements(v_s->'periods') p where p->>'start' <= v_today), 0)
              - coalesce(nullif(v_s->>'paid', '')::numeric, 0);
      perform set_config('app.building', l.building_id, true);

      -- 3 days before a period starts.
      select p into v_p from jsonb_array_elements(v_s->'periods') p where p->>'start' = v_soon limit 1;
      if v_p is not null and not exists (select 1 from public.rent_reminder_log where lease_id = l.id and kind = 'soon' and period_start = v_p->>'start') then
        v_money := case when v_s->>'currency' = 'LBP' then trim(to_char(greatest(v_owed, 0) + nullif(v_p->>'amount', '')::numeric, 'FM999,999,999,990')) || ' LBP'
                        else '$' || trim(to_char(greatest(v_owed, 0) + nullif(v_p->>'amount', '')::numeric, 'FM999,999,990.00')) end;
        perform public.enqueue_push('renter', l.id,
          case when v_ar then 'تذكير بالإيجار — ' || v_building else 'Rent reminder — ' || v_building end,
          case when v_ar then 'يستحق الإيجار في ' || (v_p->>'start') || ': ' || v_money
               else 'Rent is due on ' || (v_p->>'start') || ': ' || v_money end);
        insert into public.rent_reminder_log (lease_id, kind, period_start) values (l.id, 'soon', v_p->>'start') on conflict do nothing;
        v_sent := v_sent + 1;
      end if;

      -- Late: on the day, then once a week (4 times at most) while rent is owed.
      if v_owed > 0.5 then
        select p into v_p from jsonb_array_elements(v_s->'periods') p
         where p->>'lateFrom' <= v_today order by p->>'lateFrom' desc limit 1;
        if v_p is not null then
          v_week := (current_date - (v_p->>'lateFrom')::date) / 7;
          if (current_date - (v_p->>'lateFrom')::date) % 7 = 0 and v_week < 4
             and not exists (select 1 from public.rent_reminder_log where lease_id = l.id and kind = 'late' || v_week and period_start = v_p->>'start') then
            v_money := case when v_s->>'currency' = 'LBP' then trim(to_char(v_owed, 'FM999,999,999,990')) || ' LBP'
                            else '$' || trim(to_char(v_owed, 'FM999,999,990.00')) end;
            perform public.enqueue_push('renter', l.id,
              case when v_ar then 'الإيجار متأخر — ' || v_building else 'Rent is late — ' || v_building end,
              case when v_ar then 'المبلغ المستحق: ' || v_money || '. شكراً لتسديده في أقرب وقت.'
                   else 'Owed: ' || v_money || '. Thank you for paying it soon.' end);
            insert into public.rent_reminder_log (lease_id, kind, period_start) values (l.id, 'late' || v_week, v_p->>'start') on conflict do nothing;
            v_sent := v_sent + 1;
          end if;
        end if;
      end if;
    exception when others then
      raise warning 'send_rent_reminders: lease % failed: %', l.id, sqlerrm;
    end;
  end loop;
  perform set_config('app.building', '', true);
  delete from public.rent_reminder_log where sent_at < now() - interval '400 days';
  return v_sent;
end;
$$;

do $$
begin
  if exists (select 1 from cron.job where jobname = 'rent-reminders') then
    perform cron.unschedule('rent-reminders');
  end if;
end;
$$;
select cron.schedule('rent-reminders', '30 6 * * *', $$select public.send_rent_reminders()$$);

-- ── Who may call what ────────────────────────────────────────────────────────
revoke all on function public.declare_rent_payment(numeric, text, text, text) from public, anon;
grant execute on function public.declare_rent_payment(numeric, text, text, text) to authenticated;
revoke all on function public.send_rent_reminders() from public, anon, authenticated;
