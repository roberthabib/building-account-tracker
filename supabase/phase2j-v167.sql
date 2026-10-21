-- Phase 2j — v167
--
--   * automatic late reminders (daily check, once a month per building)
--   * concierge: ticks jobs, counts supplies, notes visitors, water meters
--   * bookings of shared spaces by tenants (no overlaps)
--   * residents' board: tenants post, the owner approves
--   * tenants update their own phone number and language
--   * a second administrator marks a month as checked
--   * the owner hands the building over and steps down
--
-- Run in: Supabase dashboard -> SQL Editor -> New query -> paste -> Run.
-- Safe to re-run. Needs phase2a–2i.

-- ── Automatic late reminders ────────────────────────────────────────────────
create table if not exists public.late_reminder_log (
  month   text primary key,
  sent_at timestamptz not null default now(),
  sent    int not null default 0
);
alter table public.late_reminder_log enable row level security;
revoke all on public.late_reminder_log from anon, authenticated;

create or replace function public.send_late_reminders()
returns int
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_state jsonb;
  v_month text := to_char(current_date, 'YYYY-MM');
  v_due int;
  v_days int;
  v_sent int := 0;
  v_building text;
  v_total numeric;
  v_months text;
  v_lang text;
  r record;
begin
  select state into v_state from public.building_state where id = 'building';
  if v_state is null then return 0; end if;
  if coalesce(v_state->'settings'->'lateReminders'->>'on', 'false') <> 'true' then return 0; end if;
  if coalesce(v_state->'settings'->>'collectionMode', 'actual') <> 'fixed' then return 0; end if;
  v_due := coalesce(nullif(v_state->'settings'->>'dueDay', '')::int, 0);
  if v_due < 1 then return 0; end if;
  v_days := greatest(1, coalesce(nullif(v_state->'settings'->'lateReminders'->>'days', '')::int, 5));
  -- Not before this month's due day plus the chosen delay, and once a month.
  if current_date < make_date(extract(year from current_date)::int, extract(month from current_date)::int, least(28, v_due)) + v_days then
    return 0;
  end if;
  if exists (select 1 from public.late_reminder_log where month = v_month) then return 0; end if;
  v_building := coalesce(nullif(v_state->'building'->>'name', ''), '');
  for r in select key as tenant_id, value as months from jsonb_each(coalesce(v_state->'balanceSnapshot'->'unpaid', '{}'::jsonb)) loop
    if jsonb_typeof(r.months) <> 'object' then continue; end if;
    select coalesce(sum((m.value #>> '{}')::numeric), 0), string_agg(m.key, ', ' order by m.key)
      into v_total, v_months
      from jsonb_each(r.months) m
     where m.key ~ '^\d{4}-\d{2}$'
       and make_date(left(m.key, 4)::int, right(m.key, 2)::int, least(28, v_due)) + v_days <= current_date;
    if coalesce(v_total, 0) > 0.5 then
      select coalesce(nullif(t->>'language', ''), v_state->'settings'->>'language', 'en') into v_lang
        from jsonb_array_elements(coalesce(v_state->'tenants', '[]'::jsonb)) t
       where t->>'id' = r.tenant_id and coalesce((t->>'active')::boolean, true);
      if v_lang is null then continue; end if;
      perform public.enqueue_push('tenants', r.tenant_id,
        case when v_lang = 'ar' then 'تذكير بالدفع — ' || v_building else 'Payment reminder — ' || v_building end,
        case when v_lang = 'ar'
          then 'المبلغ المتأخر: $' || trim(to_char(v_total, 'FM999,999,990.00')) || ' (' || v_months || '). شكراً لتسديده في أقرب وقت.'
          else 'Overdue: $' || trim(to_char(v_total, 'FM999,999,990.00')) || ' (' || v_months || '). Thank you for settling it soon.'
        end);
      v_sent := v_sent + 1;
    end if;
  end loop;
  insert into public.late_reminder_log (month, sent) values (v_month, v_sent) on conflict (month) do nothing;
  return v_sent;
end;
$$;
select cron.schedule('late-reminders', '0 6 * * *', $$select public.send_late_reminders()$$);

-- ── Concierge: jobs, supplies, visitors, water meters ───────────────────────
create or replace function public.concierge_tick_task(p_task_id text, p_date text)
returns boolean
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_state jsonb;
  v_idx int;
  v_id text := p_task_id || ':' || p_date;
  v_done boolean;
begin
  if not public.is_concierge() then raise exception 'Concierge access only'; end if;
  if p_date !~ '^\d{4}-\d{2}-\d{2}$' or abs(p_date::date - current_date) > 7 then raise exception 'Only the last few days can be ticked'; end if;
  select state into v_state from public.building_state where id = 'building' for update;
  if public.state_index(v_state, 'routineTasks', p_task_id) is null then raise exception 'Job not found'; end if;
  v_idx := public.state_index(v_state, 'routineLog', v_id);
  if v_idx is null then
    v_done := true;
    v_state := jsonb_set(v_state, '{routineLog}', coalesce(v_state->'routineLog', '[]'::jsonb)
      || jsonb_build_object('id', v_id, 'taskId', p_task_id, 'date', p_date, 'done', true, 'at', public.now_iso(), 'by', 'concierge'), true);
  else
    v_done := not coalesce((v_state->'routineLog'->v_idx->>'done')::boolean, false);
    v_state := jsonb_set(v_state, array['routineLog', v_idx::text],
      (v_state->'routineLog'->v_idx) || jsonb_build_object('done', v_done, 'at', public.now_iso(), 'by', 'concierge'));
  end if;
  update public.building_state set state = public.touch_state_meta(v_state), rev = rev + 1, updated_at = now() where id = 'building';
  return v_done;
end;
$$;

create or replace function public.concierge_adjust_supply(p_supply_id text, p_delta numeric)
returns numeric
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_state jsonb;
  v_idx int;
  v_qty numeric;
begin
  if not public.is_concierge() then raise exception 'Concierge access only'; end if;
  if p_delta is null or abs(p_delta) > 1000 then raise exception 'Amount out of range'; end if;
  select state into v_state from public.building_state where id = 'building' for update;
  v_idx := public.state_index(v_state, 'supplies', p_supply_id);
  if v_idx is null then raise exception 'Supply not found'; end if;
  v_qty := greatest(0, coalesce(nullif(v_state->'supplies'->v_idx->>'qty', '')::numeric, 0) + p_delta);
  v_state := jsonb_set(v_state, array['supplies', v_idx::text],
    (v_state->'supplies'->v_idx) || jsonb_build_object('qty', v_qty, 'updatedAt', public.now_iso()));
  update public.building_state set state = public.touch_state_meta(v_state), rev = rev + 1, updated_at = now() where id = 'building';
  if coalesce(nullif(v_state->'supplies'->v_idx->>'lowAt', '')::numeric, 0) > 0
     and v_qty <= (v_state->'supplies'->v_idx->>'lowAt')::numeric and p_delta < 0 then
    perform public.enqueue_push('admins', null,
      case when coalesce(v_state->'settings'->>'language', 'en') = 'ar' then 'لوازم على وشك النفاد' else 'Running low' end,
      (v_state->'supplies'->v_idx->>'name') || ': ' || v_qty::text);
  end if;
  return v_qty;
end;
$$;

create or replace function public.concierge_log_visitor(p_name text, p_purpose text default null, p_unit text default null)
returns void
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_log jsonb;
begin
  if not public.is_concierge() then raise exception 'Concierge access only'; end if;
  if coalesce(trim(p_name), '') = '' or length(p_name) > 80 then raise exception 'Enter who came'; end if;
  if length(coalesce(p_purpose, '')) > 200 or length(coalesce(p_unit, '')) > 20 then raise exception 'Too long'; end if;
  select coalesce(state->'visitorLog', '[]'::jsonb) into v_log from public.building_state where id = 'building' for update;
  v_log := v_log || jsonb_build_object('id', 'vis-' || encode(gen_random_bytes(5), 'hex'), 'at', public.now_iso(),
    'name', trim(p_name), 'purpose', coalesce(trim(p_purpose), ''), 'unit', coalesce(trim(p_unit), ''), 'by', 'concierge');
  while jsonb_array_length(v_log) > 400 loop v_log := v_log - 0; end loop;
  update public.building_state
     set state = public.touch_state_meta(jsonb_set(state, '{visitorLog}', v_log, true)), rev = rev + 1, updated_at = now()
   where id = 'building';
end;
$$;

create or replace function public.concierge_save_water_readings(p_month text, p_lines jsonb)
returns void
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_state jsonb;
  v_idx int;
  v_lines jsonb := '{}'::jsonb;
  v_key text;
  v_val jsonb;
begin
  if not public.is_concierge() then raise exception 'Concierge access only'; end if;
  if p_month !~ '^\d{4}-\d{2}-01$' then raise exception 'Month must look like YYYY-MM-01'; end if;
  if jsonb_typeof(p_lines) <> 'object' then raise exception 'Readings missing'; end if;
  select state into v_state from public.building_state where id = 'building' for update;
  if v_state is null then raise exception 'No building data'; end if;
  if exists (select 1 from jsonb_array_elements(coalesce(v_state->'monthLocks', '[]'::jsonb)) l
              where l->>'id' = substr(p_month, 1, 7) and coalesce((l->>'closed')::boolean, false)) then
    raise exception 'That month is closed';
  end if;
  for v_key, v_val in select * from jsonb_each(p_lines) loop
    if not exists (select 1 from jsonb_array_elements(coalesce(v_state->'tenants', '[]'::jsonb)) t where t->>'id' = v_key) then
      raise exception 'Unknown flat in the readings';
    end if;
    if coalesce(nullif(v_val->>'currentReading', '')::numeric, -1) < 0 or coalesce(nullif(v_val->>'previousReading', '')::numeric, -1) < 0 then
      raise exception 'Readings must be numbers';
    end if;
    v_lines := v_lines || jsonb_build_object(v_key, jsonb_build_object(
      'previousReading', (v_val->>'previousReading')::numeric, 'currentReading', (v_val->>'currentReading')::numeric));
  end loop;
  select (ord - 1)::int into v_idx
    from jsonb_array_elements(coalesce(v_state->'serviceReadings', '[]'::jsonb)) with ordinality as a(val, ord)
   where val->>'serviceType' = 'water' and left(val->>'forMonth', 7) = left(p_month, 7)
   limit 1;
  if v_idx is null then
    v_state := jsonb_set(v_state, '{serviceReadings}', coalesce(v_state->'serviceReadings', '[]'::jsonb) || jsonb_build_object(
      'id', 'wrd-' || encode(gen_random_bytes(5), 'hex'), 'serviceType', 'water', 'forMonth', p_month,
      'lines', v_lines, 'enteredBy', 'concierge', 'updatedAt', public.now_iso()), true);
  else
    v_state := jsonb_set(v_state, array['serviceReadings', v_idx::text],
      (v_state->'serviceReadings'->v_idx) || jsonb_build_object('lines', v_lines, 'enteredBy', 'concierge', 'updatedAt', public.now_iso()));
  end if;
  update public.building_state set state = public.touch_state_meta(v_state), rev = rev + 1, updated_at = now() where id = 'building';
  perform public.enqueue_push('admins', null,
    case when coalesce(v_state->'settings'->>'language', 'en') = 'ar' then 'قراءات عدادات المياه' else 'Water meter readings entered' end,
    left(p_month, 7));
end;
$$;

-- ── Bookings of shared spaces ───────────────────────────────────────────────
create or replace function public.book_space(p_space_id text, p_date text, p_from text, p_to text, p_note text default null)
returns text
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_me text := public.my_tenant_id();
  v_state jsonb;
  v_unit text;
  v_id text := 'bk-' || encode(gen_random_bytes(6), 'hex');
  v_now text := public.now_iso();
begin
  if v_me is null then raise exception 'This device is not linked to a tenant'; end if;
  if p_date !~ '^\d{4}-\d{2}-\d{2}$' or p_date::date < current_date - 1 or p_date::date > current_date + 365 then raise exception 'Choose a day in the coming year'; end if;
  if p_from !~ '^\d{2}:\d{2}$' or p_to !~ '^\d{2}:\d{2}$' or p_from >= p_to then raise exception 'The end time must be after the start'; end if;
  if length(coalesce(p_note, '')) > 120 then raise exception 'The note is too long'; end if;
  select state into v_state from public.building_state where id = 'building' for update;
  if not exists (select 1 from jsonb_array_elements(coalesce(v_state->'settings'->'spaces', '[]'::jsonb)) s where s->>'id' = p_space_id) then
    raise exception 'Space not found';
  end if;
  if exists (select 1 from jsonb_array_elements(coalesce(v_state->'bookings', '[]'::jsonb)) b
              where b->>'spaceId' = p_space_id and b->>'date' = p_date and coalesce(b->>'status', '') <> 'cancelled'
                and b->>'from' < p_to and p_from < b->>'to') then
    raise exception 'Already booked at that time';
  end if;
  if (select count(*) from jsonb_array_elements(coalesce(v_state->'bookings', '[]'::jsonb)) b
       where b->>'tenantId' = v_me and coalesce(b->>'status', '') <> 'cancelled' and b->>'date' >= to_char(current_date, 'YYYY-MM-DD')) >= 10 then
    raise exception 'You already have 10 bookings coming up';
  end if;
  select t->>'unit' into v_unit from jsonb_array_elements(coalesce(v_state->'tenants', '[]'::jsonb)) t where t->>'id' = v_me;
  update public.building_state
     set state = public.touch_state_meta(jsonb_set(state, '{bookings}', coalesce(state->'bookings', '[]'::jsonb) || jsonb_build_object(
           'id', v_id, 'spaceId', p_space_id, 'date', p_date, 'from', p_from, 'to', p_to, 'tenantId', v_me, 'unit', coalesce(v_unit, ''),
           'note', coalesce(trim(p_note), ''), 'status', 'booked', 'createdAt', v_now, 'updatedAt', v_now), true)),
         rev = rev + 1, updated_at = now()
   where id = 'building';
  return v_id;
end;
$$;

create or replace function public.cancel_my_booking(p_booking_id text)
returns void
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_me text := public.my_tenant_id();
  v_state jsonb;
  v_idx int;
begin
  if v_me is null then raise exception 'This device is not linked to a tenant'; end if;
  select state into v_state from public.building_state where id = 'building' for update;
  v_idx := public.state_index(v_state, 'bookings', p_booking_id);
  if v_idx is null or v_state->'bookings'->v_idx->>'tenantId' is distinct from v_me then raise exception 'Booking not found'; end if;
  update public.building_state
     set state = public.touch_state_meta(jsonb_set(state, array['bookings', v_idx::text],
                   (state->'bookings'->v_idx) || jsonb_build_object('status', 'cancelled', 'updatedAt', public.now_iso()))),
         rev = rev + 1, updated_at = now()
   where id = 'building';
end;
$$;

-- ── Residents' board ────────────────────────────────────────────────────────
create or replace function public.post_to_board(p_title text, p_body text default null, p_photo_path text default null)
returns text
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_me text := public.my_tenant_id();
  v_state jsonb;
  v_tenant jsonb;
  v_post jsonb;
  v_now text := public.now_iso();
  v_id text := 'post-' || encode(gen_random_bytes(6), 'hex');
begin
  if v_me is null then raise exception 'This device is not linked to a tenant'; end if;
  if coalesce(trim(p_title), '') = '' or length(p_title) > 80 then raise exception 'Give your post a short title'; end if;
  if length(coalesce(p_body, '')) > 800 then raise exception 'The text is too long'; end if;
  if p_photo_path is not null and p_photo_path not like 'board/' || v_me || '/%' then raise exception 'Photo must be one of your own uploads'; end if;
  select state into v_state from public.building_state where id = 'building' for update;
  if (select count(*) from jsonb_array_elements(coalesce(v_state->'boardPosts', '[]'::jsonb)) p
       where p->>'tenantId' = v_me and p->>'status' = 'pending') >= 3 then
    raise exception 'Wait until your other posts are approved';
  end if;
  select t into v_tenant from jsonb_array_elements(coalesce(v_state->'tenants', '[]'::jsonb)) t where t->>'id' = v_me;
  v_post := jsonb_build_object('id', v_id, 'tenantId', v_me, 'authorName', coalesce(v_tenant->>'name', ''), 'authorUnit', coalesce(v_tenant->>'unit', ''),
    'title', trim(p_title), 'body', coalesce(trim(p_body), ''), 'status', 'pending', 'createdAt', v_now, 'updatedAt', v_now);
  if p_photo_path is not null then
    v_post := v_post || jsonb_build_object('photo', jsonb_build_object('storagePath', p_photo_path, 'fileName', 'photo.jpg', 'mimeType', 'image/jpeg'));
  end if;
  update public.building_state
     set state = public.touch_state_meta(jsonb_set(state, '{boardPosts}', coalesce(state->'boardPosts', '[]'::jsonb) || v_post, true)),
         rev = rev + 1, updated_at = now()
   where id = 'building';
  perform public.enqueue_push('admins', null,
    case when coalesce(v_state->'settings'->>'language', 'en') = 'ar' then 'منشور بانتظار موافقتك' else 'A post is waiting for your approval' end,
    trim(p_title));
  return v_id;
end;
$$;

create or replace function public.remove_my_post(p_post_id text)
returns void
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_me text := public.my_tenant_id();
  v_state jsonb;
  v_idx int;
begin
  if v_me is null then raise exception 'This device is not linked to a tenant'; end if;
  select state into v_state from public.building_state where id = 'building' for update;
  v_idx := public.state_index(v_state, 'boardPosts', p_post_id);
  if v_idx is null or v_state->'boardPosts'->v_idx->>'tenantId' is distinct from v_me then raise exception 'Post not found'; end if;
  update public.building_state
     set state = public.touch_state_meta(jsonb_set(state, array['boardPosts', v_idx::text],
                   (state->'boardPosts'->v_idx) || jsonb_build_object('status', 'removed', 'updatedAt', public.now_iso()))),
         rev = rev + 1, updated_at = now()
   where id = 'building';
end;
$$;

drop policy if exists "tenant upload own board photos" on storage.objects;
create policy "tenant upload own board photos"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'invoices' and public.my_tenant_id() is not null and name like 'board/' || public.my_tenant_id() || '/%');

-- ── Tenants keep their own phone and language up to date ────────────────────
create or replace function public.update_my_details(p_phone text, p_language text)
returns void
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_me text := public.my_tenant_id();
  v_state jsonb;
  v_idx int;
begin
  if v_me is null then raise exception 'This device is not linked to a tenant'; end if;
  if length(coalesce(p_phone, '')) > 30 or coalesce(p_phone, '') !~ '^[0-9 +()-]*$' then raise exception 'That does not look like a phone number'; end if;
  if p_language not in ('en', 'ar') then raise exception 'Language must be en or ar'; end if;
  select state into v_state from public.building_state where id = 'building' for update;
  v_idx := public.state_index(v_state, 'tenants', v_me);
  if v_idx is null then raise exception 'Tenant not found'; end if;
  update public.building_state
     set state = public.touch_state_meta(jsonb_set(state, array['tenants', v_idx::text],
                   (state->'tenants'->v_idx) || jsonb_build_object('phone', trim(coalesce(p_phone, '')), 'language', p_language, 'detailsAt', public.now_iso()))),
         rev = rev + 1, updated_at = now()
   where id = 'building';
  perform public.enqueue_push('admins', null,
    case when coalesce(v_state->'settings'->>'language', 'en') = 'ar' then 'تحديث بيانات مستأجر' else 'A tenant updated their details' end,
    coalesce(v_state->'tenants'->v_idx->>'name', '') || ' · ' || trim(coalesce(p_phone, '')));
end;
$$;

-- ── A second administrator checks each month ────────────────────────────────
create or replace function public.mark_month_checked(p_id text, p_month text, p_fingerprint text)
returns void
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_checks jsonb;
begin
  if not (public.is_owner() or public.is_viewer()) then raise exception 'Administrators only'; end if;
  if p_month !~ '^\d{4}-\d{2}$' then raise exception 'Month must look like YYYY-MM'; end if;
  if p_id !~ '^chk-[a-z0-9]{4,40}$' or length(coalesce(p_fingerprint, '')) > 40 then raise exception 'Bad check'; end if;
  select coalesce(state->'monthChecks', '[]'::jsonb) into v_checks from public.building_state where id = 'building' for update;
  v_checks := v_checks || jsonb_build_object('id', p_id, 'month', p_month, 'fingerprint', coalesce(p_fingerprint, ''),
    'by', coalesce(nullif(auth.jwt()->>'email', ''), 'admin'), 'at', public.now_iso());
  while jsonb_array_length(v_checks) > 500 loop v_checks := v_checks - 0; end loop;
  update public.building_state
     set state = public.touch_state_meta(jsonb_set(state, '{monthChecks}', v_checks, true)), rev = rev + 1, updated_at = now()
   where id = 'building';
end;
$$;

-- ── Handing the building over ───────────────────────────────────────────────
create or replace function public.step_down(p_keep_view boolean)
returns void
language plpgsql security definer set search_path = public, extensions
as $$
begin
  if not public.is_owner() then raise exception 'Only the building owner can step down'; end if;
  if not exists (select 1 from public.profiles where role = 'owner' and auth_user_id <> auth.uid()) then
    raise exception 'First let the new manager sign in with full access';
  end if;
  if coalesce(p_keep_view, false) then
    update public.profiles set role = 'viewer' where auth_user_id = auth.uid();
    update public.push_subscriptions set role = 'viewer' where auth_user_id = auth.uid();
  else
    delete from public.push_subscriptions where auth_user_id = auth.uid();
    delete from public.profiles where auth_user_id = auth.uid();
  end if;
end;
$$;

-- ── Big expenses wait for a second administrator ────────────────────────────
create or replace function public.approve_expense(p_id text, p_approve boolean)
returns void
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_state jsonb;
  v_idx int;
  v_item jsonb;
  v_me text := lower(coalesce(nullif(auth.jwt()->>'email', ''), ''));
  v_now text := public.now_iso();
  v_txs jsonb;
begin
  if not (public.is_owner() or public.is_viewer()) then raise exception 'Administrators only'; end if;
  select state into v_state from public.building_state where id = 'building' for update;
  v_idx := public.state_index(v_state, 'pendingExpenses', p_id);
  if v_idx is null then raise exception 'Expense not found'; end if;
  v_item := v_state->'pendingExpenses'->v_idx;
  if coalesce(v_item->>'status', '') <> 'pending' then raise exception 'This expense was already decided'; end if;
  if v_me = '' or lower(coalesce(v_item->>'requestedBy', '')) = v_me then raise exception 'Another administrator must approve it'; end if;
  if coalesce(p_approve, false) then
    select coalesce(jsonb_agg(t || jsonb_build_object('approvedBy', v_me, 'approvedAt', v_now)), '[]'::jsonb) into v_txs
      from jsonb_array_elements(coalesce(v_item->'transactions', '[]'::jsonb)) t;
    if exists (select 1 from jsonb_array_elements(v_txs) t, jsonb_array_elements(coalesce(v_state->'monthLocks', '[]'::jsonb)) l
                where coalesce((l->>'closed')::boolean, false)
                  and (l->>'id' = left(coalesce(t->>'date', ''), 7) or l->>'id' = left(coalesce(t->>'forMonth', ''), 7))) then
      raise exception 'That month is closed';
    end if;
    v_state := jsonb_set(v_state, '{transactions}', coalesce(v_state->'transactions', '[]'::jsonb) || v_txs, true);
  end if;
  v_state := jsonb_set(v_state, array['pendingExpenses', v_idx::text], v_item || jsonb_build_object(
    'status', case when coalesce(p_approve, false) then 'approved' else 'rejected' end, 'decidedBy', v_me, 'decidedAt', v_now, 'updatedAt', v_now));
  update public.building_state set state = public.touch_state_meta(v_state), rev = rev + 1, updated_at = now() where id = 'building';
  perform public.enqueue_push('admins', null,
    case when coalesce(p_approve, false) then 'Expense approved' else 'Expense rejected' end,
    coalesce(v_item->>'description', '') || ' — $' || trim(to_char(coalesce(nullif(v_item->>'amountUsd', '')::numeric, 0), 'FM999999990.00')));
end;
$$;

-- ── Concierge expenses over the limit wait for approval too ─────────────────
create or replace function public.concierge_add_expense(p_entry jsonb)
returns text
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_state jsonb;
  v_id text := 'cx-' || encode(gen_random_bytes(6), 'hex');
  v_usd numeric := coalesce(nullif(p_entry->>'amountUsd', '')::numeric, 0);
  v_lbp numeric := coalesce(nullif(p_entry->>'amountLbp', '')::numeric, 0);
  v_rate numeric;
  v_total numeric;
  v_amount_usd numeric;
  v_date text := coalesce(p_entry->>'date', '');
  v_photo text := nullif(p_entry->>'photoPath', '');
  v_tx jsonb;
  v_shares jsonb;
  v_limit numeric;
begin
  if not public.is_concierge() then raise exception 'Concierge access only'; end if;
  if coalesce(trim(p_entry->>'description'), '') = '' or length(p_entry->>'description') > 200 then raise exception 'Say what the expense was for'; end if;
  if v_date !~ '^\d{4}-\d{2}-\d{2}$' then raise exception 'Date must look like YYYY-MM-DD'; end if;
  if v_usd < 0 or v_lbp < 0 or (v_usd = 0 and v_lbp = 0) or v_usd > 100000 or v_lbp > 10000000000 then raise exception 'Amount out of range'; end if;
  if v_photo is not null and v_photo not like 'concierge/%' then raise exception 'Photo must be one of your own uploads'; end if;
  select state into v_state from public.building_state where id = 'building' for update;
  if v_state is null then raise exception 'No building data'; end if;
  if exists (select 1 from jsonb_array_elements(coalesce(v_state->'monthLocks', '[]'::jsonb)) l
              where l->>'id' = substr(v_date, 1, 7) and coalesce((l->>'closed')::boolean, false)) then
    raise exception 'That month is closed';
  end if;
  v_rate := coalesce(nullif(v_state->'settings'->>'lbpPerUsd', '')::numeric, 89500);
  v_amount_usd := v_usd + case when v_lbp > 0 then v_lbp / v_rate else 0 end;
  select coalesce(sum(coalesce(nullif(t->>'coefficient', '')::numeric, 0)), 0) into v_total
    from jsonb_array_elements(coalesce(v_state->'tenants', '[]'::jsonb)) t where coalesce((t->>'active')::boolean, true);
  if v_total > 0 then
    select jsonb_object_agg(t->>'id', round(v_amount_usd * coalesce(nullif(t->>'coefficient', '')::numeric, 0) / v_total, 2)) into v_shares
      from jsonb_array_elements(coalesce(v_state->'tenants', '[]'::jsonb)) t where coalesce((t->>'active')::boolean, true);
  end if;
  v_tx := jsonb_build_object(
    'id', v_id, 'category', 'Expenses', 'description', trim(p_entry->>'description'), 'tenantId', null, 'forMonth', null,
    'project', '', 'date', v_date, 'supplier', left(coalesce(p_entry->>'supplier', ''), 120), 'invoice', left(coalesce(p_entry->>'invoice', ''), 60),
    'expenseCategory', left(coalesce(p_entry->>'expenseCategory', ''), 80), 'serviceType', '', 'servicePart', '',
    'debitUsd', v_usd, 'debitLbp', v_lbp, 'creditUsd', 0, 'creditLbp', 0, 'balanceUsd', -v_usd, 'balanceLbp', -v_lbp,
    'lbpRate', v_rate, 'paidFrom', 'cash', 'shares', v_shares, 'sourceRow', null, 'enteredBy', 'concierge',
    'invoiceAttachment', case when v_photo is null then null else jsonb_build_object('storagePath', v_photo, 'fileName', 'invoice.jpg', 'mimeType', 'image/jpeg') end);
  v_limit := coalesce(nullif(v_state->'settings'->>'approvalOverUsd', '')::numeric, 0);
  if v_limit > 0 and v_amount_usd + 0.005 >= v_limit then
    -- Over the building's limit: it waits for an administrator's approval.
    update public.building_state
       set state = public.touch_state_meta(jsonb_set(state, '{pendingExpenses}', coalesce(state->'pendingExpenses', '[]'::jsonb) || jsonb_build_object(
             'id', 'apr-' || encode(gen_random_bytes(6), 'hex'), 'transactions', jsonb_build_array(v_tx), 'amountUsd', round(v_amount_usd, 2),
             'description', trim(p_entry->>'description'), 'requestedBy', 'concierge', 'requestedAt', public.now_iso(),
             'status', 'pending', 'updatedAt', public.now_iso()), true)),
           rev = rev + 1, updated_at = now()
     where id = 'building';
    perform public.enqueue_push('admins', null,
      case when coalesce(v_state->'settings'->>'language', 'en') = 'ar' then 'مصروف بانتظار موافقتك' else 'An expense is waiting for your approval' end,
      trim(p_entry->>'description') || ' — $' || trim(to_char(v_amount_usd, 'FM999999990.00')));
    return v_id;
  end if;
  update public.building_state
     set state = public.touch_state_meta(jsonb_set(state, '{transactions}', coalesce(state->'transactions', '[]'::jsonb) || v_tx, true)),
         rev = rev + 1, updated_at = now()
   where id = 'building';
  perform public.enqueue_push('admins', null,
    case when coalesce(v_state->'settings'->>'language', 'en') = 'ar' then 'مصروف من الناطور' else 'Concierge added an expense' end,
    trim(p_entry->>'description') || ' — $' || trim(to_char(v_amount_usd, 'FM999999990.00')));
  return v_id;
end;
$$;

-- ── get_my_state: the concierge and tenants get their new lists ─────────────
create or replace function public.get_my_state()
returns jsonb
language plpgsql stable security definer set search_path = public, extensions
as $$
declare
  v_orig  jsonb;
  v_state jsonb;
  v_me    text;
  v_settings jsonb;
  v_now   timestamptz := now();
begin
  select state into v_orig from public.building_state where id = 'building';
  if v_orig is null then
    return null;
  end if;
  if public.is_owner() or public.is_viewer() then
    return v_orig;
  end if;

  v_settings := coalesce(v_orig->'settings', '{}'::jsonb)
       - 'ownerPasswordHash' - 'syncSecret' - 'invoiceUploadUrl'
       - 'cloudSpreadsheetId' - 'invoiceUploadFolderId'
       - 'supabaseUrl' - 'supabaseAnonKey' - 'messageTemplates';

  -- Concierge: the building's running, no money owed or paid by anyone.
  if public.is_concierge() then
    return jsonb_build_object(
      'meta', v_orig->'meta', 'building', v_orig->'building', 'settings', v_settings, 'security', '{}'::jsonb,
      'setupComplete', true,
      'tenants', coalesce((select jsonb_agg(jsonb_build_object('id', t->>'id', 'name', t->>'name', 'unit', t->>'unit',
                                  'active', coalesce((t->>'active')::boolean, true), 'breakerAmps', t->'breakerAmps', 'coefficient', 0,
                                  'phone', '', 'pinHash', ''))
                            from jsonb_array_elements(coalesce(v_orig->'tenants', '[]'::jsonb)) t), '[]'::jsonb),
      'transactions', coalesce((select jsonb_agg(x - 'shares' - 'onlyFlats') from jsonb_array_elements(coalesce(v_orig->'transactions', '[]'::jsonb)) x
                                 where x->>'category' in ('Expenses', 'Services Expenses')), '[]'::jsonb),
      'serviceReadings', coalesce(v_orig->'serviceReadings', '[]'::jsonb),
      'issues', coalesce(v_orig->'issues', '[]'::jsonb),
      'maintenanceTasks', coalesce(v_orig->'maintenanceTasks', '[]'::jsonb),
      'equipment', coalesce(v_orig->'equipment', '[]'::jsonb),
      'generatorServices', coalesce(v_orig->'generatorServices', '[]'::jsonb),
      'suppliers', coalesce((select jsonb_agg(jsonb_build_object('id', s->>'id', 'name', s->>'name', 'trade', s->>'trade', 'phone', s->>'phone'))
                              from jsonb_array_elements(coalesce(v_orig->'suppliers', '[]'::jsonb)) s), '[]'::jsonb),
      'expenseCategories', coalesce(v_orig->'expenseCategories', '[]'::jsonb),
      'announcements', coalesce((select jsonb_agg(n - 'seenBy') from jsonb_array_elements(coalesce(v_orig->'announcements', '[]'::jsonb)) n
                                  where coalesce(n->>'publishAt', '') = '' or (n->>'publishAt')::timestamptz <= v_now), '[]'::jsonb),
      'monthLocks', coalesce(v_orig->'monthLocks', '[]'::jsonb),
      'routineTasks', coalesce(v_orig->'routineTasks', '[]'::jsonb),
      'routineLog', coalesce((select jsonb_agg(l) from jsonb_array_elements(coalesce(v_orig->'routineLog', '[]'::jsonb)) l
                               where l->>'date' >= to_char(current_date - 60, 'YYYY-MM-DD')), '[]'::jsonb),
      'supplies', coalesce(v_orig->'supplies', '[]'::jsonb),
      'visitorLog', coalesce((select jsonb_agg(v) from jsonb_array_elements(coalesce(v_orig->'visitorLog', '[]'::jsonb)) v
                               where left(v->>'at', 10) >= to_char(current_date - 60, 'YYYY-MM-DD')), '[]'::jsonb),
      'bookings', coalesce((select jsonb_agg(b - 'tenantId' - 'note' - 'by') from jsonb_array_elements(coalesce(v_orig->'bookings', '[]'::jsonb)) b
                             where coalesce(b->>'status', '') <> 'cancelled' and b->>'date' >= to_char(current_date - 1, 'YYYY-MM-DD')), '[]'::jsonb),
      'deleted', coalesce(v_orig->'deleted', '{}'::jsonb),
      'redaction', jsonb_build_object('role', 'concierge'));
  end if;

  v_me := public.my_tenant_id();
  if v_me is null then
    raise exception 'This device is not linked to a tenant yet';
  end if;
  v_state := v_orig - 'auditLog' - 'cashChecks' - 'balanceSnapshot' - 'documents' - 'suppliers' - 'equipment'
                    - 'routineTasks' - 'routineLog' - 'supplies' - 'visitorLog' - 'monthChecks' - 'pendingExpenses';

  v_state := jsonb_set(v_state, '{deposits}', coalesce((
    select jsonb_agg(d) from jsonb_array_elements(coalesce(v_orig->'deposits', '[]'::jsonb)) d
     where d->>'tenantId' = v_me), '[]'::jsonb));

  v_state := jsonb_set(v_state, '{tenants}', coalesce((
    select jsonb_agg(t - 'pinHash' - 'details') from jsonb_array_elements(coalesce(v_orig->'tenants', '[]'::jsonb)) t
     where t->>'id' = v_me), '[]'::jsonb));

  -- Directory: neighbours who share, shown only to tenants who share too.
  v_state := v_state || jsonb_build_object('directory', case
    when exists (select 1 from jsonb_array_elements(coalesce(v_orig->'tenants', '[]'::jsonb)) t
                  where t->>'id' = v_me and coalesce((t->>'directory')::boolean, false))
    then coalesce((select jsonb_agg(jsonb_build_object('name', t->>'name', 'unit', t->>'unit', 'phone', coalesce(t->>'phone', '')))
                     from jsonb_array_elements(coalesce(v_orig->'tenants', '[]'::jsonb)) t
                    where t->>'id' <> v_me and coalesce((t->>'directory')::boolean, false) and coalesce((t->>'active')::boolean, true)), '[]'::jsonb)
    else '[]'::jsonb end);

  v_state := jsonb_set(v_state, '{transactions}', coalesce((
    select jsonb_agg(
             case when jsonb_typeof(x->'shares') = 'object'
                  then jsonb_set(x, '{shares}',
                         case when x->'shares' ? v_me then jsonb_build_object(v_me, x->'shares'->v_me) else '{}'::jsonb end)
                  else x end - 'onlyFlats')
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

  -- Notices: published ones only; whether this tenant has seen each.
  v_state := jsonb_set(v_state, '{announcements}', coalesce((
    select jsonb_agg((n - 'seenBy') || jsonb_build_object('seenByMe', coalesce(n->'seenBy', '[]'::jsonb) ? v_me))
      from jsonb_array_elements(coalesce(v_orig->'announcements', '[]'::jsonb)) n
     where coalesce(n->>'publishAt', '') = '' or (n->>'publishAt')::timestamptz <= v_now), '[]'::jsonb));

  -- Bookings: everyone sees what is taken; only their own say who and why.
  v_state := jsonb_set(v_state, '{bookings}', coalesce((
    select jsonb_agg(case when b->>'tenantId' = v_me then b - 'by' else b - 'tenantId' - 'note' - 'unit' - 'by' end)
      from jsonb_array_elements(coalesce(v_orig->'bookings', '[]'::jsonb)) b
     where b->>'date' >= to_char(current_date - 7, 'YYYY-MM-DD')
       and (coalesce(b->>'status', '') <> 'cancelled' or b->>'tenantId' = v_me)), '[]'::jsonb));

  -- Board: approved posts of the last 30 days, plus the tenant's own.
  v_state := jsonb_set(v_state, '{boardPosts}', coalesce((
    select jsonb_agg(case when p->>'tenantId' = v_me then p else p - 'tenantId' end)
      from jsonb_array_elements(coalesce(v_orig->'boardPosts', '[]'::jsonb)) p
     where (p->>'status' = 'approved' and coalesce(nullif(p->>'createdAt', ''), '1970-01-01')::timestamptz >= v_now - interval '30 days')
        or (p->>'tenantId' = v_me and p->>'status' in ('pending', 'approved'))), '[]'::jsonb));

  v_state := jsonb_set(v_state, '{buildingProjects}', coalesce((
    select jsonb_agg(
             case when jsonb_typeof(p->'shares') = 'object'
                  then jsonb_set(p, '{shares}',
                         case when p->'shares' ? v_me then jsonb_build_object(v_me, p->'shares'->v_me) else '{}'::jsonb end)
                  else p end - 'onlyFlats')
      from jsonb_array_elements(coalesce(v_orig->'buildingProjects', '[]'::jsonb)) p), '[]'::jsonb));

  -- Poll votes: the caller's own vote, anonymous counts, the same weighted by
  -- each active unit's coefficient, and per-choice counts for choice polls.
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
                                where coalesce((t->>'active')::boolean, true)),
                  'optionCounts', (select coalesce(jsonb_object_agg(v.value, v.n), '{}'::jsonb)
                                     from (select value, count(*) as n from jsonb_each_text(coalesce(p->'votes', '{}'::jsonb)) group by value) v),
                  'optionShares', (select coalesce(jsonb_object_agg(v.value, v.share), '{}'::jsonb)
                                     from (select vv.value, sum(coalesce(nullif(t->>'coefficient', '')::numeric, 0)) as share
                                             from jsonb_each_text(coalesce(p->'votes', '{}'::jsonb)) vv
                                             join jsonb_array_elements(coalesce(v_orig->'tenants', '[]'::jsonb)) t on t->>'id' = vv.key
                                            where coalesce((t->>'active')::boolean, true)
                                            group by vv.value) v))))
      from jsonb_array_elements(coalesce(v_orig->'polls', '[]'::jsonb)) p), '[]'::jsonb));

  v_state := jsonb_set(v_state, '{settings}', v_settings);

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

revoke all on function public.send_late_reminders() from public, anon, authenticated;
revoke all on function public.concierge_tick_task(text, text) from public, anon;
revoke all on function public.concierge_adjust_supply(text, numeric) from public, anon;
revoke all on function public.concierge_log_visitor(text, text, text) from public, anon;
revoke all on function public.concierge_save_water_readings(text, jsonb) from public, anon;
revoke all on function public.book_space(text, text, text, text, text) from public, anon;
revoke all on function public.cancel_my_booking(text) from public, anon;
revoke all on function public.post_to_board(text, text, text) from public, anon;
revoke all on function public.remove_my_post(text) from public, anon;
revoke all on function public.update_my_details(text, text) from public, anon;
revoke all on function public.mark_month_checked(text, text, text) from public, anon;
revoke all on function public.step_down(boolean) from public, anon;
revoke all on function public.approve_expense(text, boolean) from public, anon;
revoke all on function public.concierge_add_expense(jsonb) from public, anon;
revoke all on function public.get_my_state() from public, anon;

grant execute on function public.approve_expense(text, boolean)               to authenticated;
grant execute on function public.concierge_add_expense(jsonb)                 to authenticated;
grant execute on function public.concierge_tick_task(text, text)              to authenticated;
grant execute on function public.concierge_adjust_supply(text, numeric)       to authenticated;
grant execute on function public.concierge_log_visitor(text, text, text)      to authenticated;
grant execute on function public.concierge_save_water_readings(text, jsonb)   to authenticated;
grant execute on function public.book_space(text, text, text, text, text)     to authenticated;
grant execute on function public.cancel_my_booking(text)                      to authenticated;
grant execute on function public.post_to_board(text, text, text)              to authenticated;
grant execute on function public.remove_my_post(text)                         to authenticated;
grant execute on function public.update_my_details(text, text)                to authenticated;
grant execute on function public.mark_month_checked(text, text, text)         to authenticated;
grant execute on function public.step_down(boolean)                           to authenticated;
grant execute on function public.get_my_state()                               to authenticated;
