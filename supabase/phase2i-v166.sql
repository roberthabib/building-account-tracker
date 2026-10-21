-- Phase 2i — v166
--
--   * concierge role: a caretaker's phone can add expenses (with photos),
--     meter readings and problem reports, reply on problems, and sees no
--     money owed or paid by anyone
--   * resident directory: tenants choose to share name, unit and phone with
--     the neighbours who also share
--   * problems become conversations (tenant / concierge replies)
--   * votes with several choices (quote comparison)
--   * notices: "seen by" and scheduled publishing (with a phone notification
--     when they go out)
--
-- Run in: Supabase dashboard -> SQL Editor -> New query -> paste -> Run.
-- Safe to re-run. Needs phase2a–2h.

-- ── Roles ───────────────────────────────────────────────────────────────────
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('owner', 'tenant', 'viewer', 'concierge'));
alter table public.admin_invites drop constraint if exists admin_invites_role_check;
alter table public.admin_invites add constraint admin_invites_role_check check (role in ('owner', 'viewer', 'concierge'));

create or replace function public.is_concierge()
returns boolean
language sql stable security definer set search_path = public, extensions
as $$
  select coalesce((select role = 'concierge' from public.profiles where auth_user_id = auth.uid()), false);
$$;

create or replace function public.create_admin_invite(p_role text)
returns text
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_code text;
begin
  if not public.is_owner() then raise exception 'Only the building owner can invite administrators'; end if;
  if p_role not in ('owner', 'viewer', 'concierge') then raise exception 'Role must be owner, viewer or concierge'; end if;
  v_code := substr(translate(upper(encode(gen_random_bytes(24), 'base64')), 'O0I1+/=', 'XYZWQRS'), 1, 10);
  insert into public.admin_invites (code, role, created_by) values (v_code, p_role, auth.uid());
  return v_code;
end;
$$;

-- Owners and viewers need a Google account; a concierge links a phone with
-- the code, like a tenant (anonymous account).
create or replace function public.claim_admin_invite(p_code text)
returns text
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_row public.admin_invites;
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  select * into v_row from public.admin_invites where code = upper(trim(p_code)) for update;
  if v_row.code is null then raise exception 'That invite is not valid'; end if;
  if v_row.used_at is not null then raise exception 'That invite has already been used'; end if;
  if v_row.expires_at < now() then raise exception 'That invite has expired'; end if;
  if v_row.role <> 'concierge' and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) then
    raise exception 'Sign in with Google to accept an administrator invite';
  end if;
  if not exists (select 1 from public.profiles where auth_user_id = auth.uid() and role = 'owner') then
    insert into public.profiles (auth_user_id, role, tenant_id)
         values (auth.uid(), v_row.role, null)
    on conflict (auth_user_id) do update set role = excluded.role, tenant_id = null;
  end if;
  update public.admin_invites set used_at = now(), used_by = auth.uid() where code = v_row.code;
  return v_row.role;
end;
$$;

create or replace function public.list_admins()
returns table (user_id uuid, email text, role text, since timestamptz, is_me boolean)
language plpgsql stable security definer set search_path = public, extensions
as $$
begin
  if not public.is_owner() then raise exception 'Only the building owner can see administrators'; end if;
  return query
    select p.auth_user_id, coalesce(u.email::text, ''), p.role, p.created_at, p.auth_user_id = auth.uid()
      from public.profiles p join auth.users u on u.id = p.auth_user_id
     where p.role in ('owner', 'viewer', 'concierge')
     order by p.created_at;
end;
$$;

create or replace function public.remove_admin(p_user_id uuid)
returns void
language plpgsql security definer set search_path = public, extensions
as $$
begin
  if not public.is_owner() then raise exception 'Only the building owner can remove administrators'; end if;
  if p_user_id = auth.uid() then raise exception 'You cannot remove your own access'; end if;
  delete from public.profiles where auth_user_id = p_user_id and role in ('owner', 'viewer', 'concierge');
  delete from public.push_subscriptions where auth_user_id = p_user_id;
end;
$$;

-- ── Photos: the concierge uploads under concierge/ and reads problem photos ─
drop policy if exists "concierge upload photos" on storage.objects;
create policy "concierge upload photos"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'invoices' and public.is_concierge() and name like 'concierge/%');

drop policy if exists "member read invoices" on storage.objects;
create policy "member read invoices"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'invoices'
    and (
      public.is_owner()
      or public.is_viewer()
      or (public.is_concierge() and (name like 'concierge/%' or name like 'issues/%'))
      or (
        public.my_tenant_id() is not null
        and (
          (name not like 'proofs/%' and name not like 'issues/%' and name not like 'documents/%' and name not like 'concierge/%')
          or name like 'proofs/' || public.my_tenant_id() || '/%'
          or name like 'issues/' || public.my_tenant_id() || '/%'
          or name like 'issues/building/%'
        )
      )
    )
  );

-- ── Small helpers ───────────────────────────────────────────────────────────
create or replace function public.now_iso()
returns text
language sql stable
as $$ select to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'); $$;

-- Index of an element with this id in a state array (0-based), or null.
create or replace function public.state_index(p_state jsonb, p_key text, p_id text)
returns int
language sql stable
as $$
  select (ord - 1)::int
    from jsonb_array_elements(coalesce(p_state->p_key, '[]'::jsonb)) with ordinality as a(val, ord)
   where val->>'id' = p_id
   limit 1;
$$;

-- ── Concierge writes ────────────────────────────────────────────────────────
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

-- Meter readings for one month: { tenantId: { previousReading, currentReading, breakerAmps, photoPath? } }
create or replace function public.concierge_save_readings(p_month text, p_lines jsonb)
returns void
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_state jsonb;
  v_idx int;
  v_lines jsonb := '{}'::jsonb;
  v_key text;
  v_val jsonb;
  v_rec jsonb;
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
    if nullif(v_val->>'photoPath', '') is not null and v_val->>'photoPath' not like 'concierge/%' then
      raise exception 'Photo must be one of your own uploads';
    end if;
    v_lines := v_lines || jsonb_build_object(v_key, jsonb_strip_nulls(jsonb_build_object(
      'previousReading', (v_val->>'previousReading')::numeric,
      'currentReading', (v_val->>'currentReading')::numeric,
      'breakerAmps', coalesce(nullif(v_val->>'breakerAmps', '')::numeric, 0),
      'photo', case when nullif(v_val->>'photoPath', '') is null then null
                    else jsonb_build_object('storagePath', v_val->>'photoPath', 'fileName', 'meter.jpg', 'mimeType', 'image/jpeg') end)));
  end loop;
  select (ord - 1)::int into v_idx
    from jsonb_array_elements(coalesce(v_state->'serviceReadings', '[]'::jsonb)) with ordinality as a(val, ord)
   where val->>'serviceType' = 'generator' and left(val->>'forMonth', 7) = left(p_month, 7)
   limit 1;
  if v_idx is null then
    v_rec := jsonb_build_object('id', 'rdg-' || encode(gen_random_bytes(5), 'hex'), 'serviceType', 'generator', 'forMonth', p_month,
                                'lines', v_lines, 'enteredBy', 'concierge', 'updatedAt', public.now_iso());
    v_state := jsonb_set(v_state, '{serviceReadings}', coalesce(v_state->'serviceReadings', '[]'::jsonb) || v_rec, true);
  else
    v_state := jsonb_set(v_state, array['serviceReadings', v_idx::text],
                 (v_state->'serviceReadings'->v_idx) || jsonb_build_object('lines', v_lines, 'enteredBy', 'concierge', 'updatedAt', public.now_iso()));
  end if;
  update public.building_state set state = public.touch_state_meta(v_state), rev = rev + 1, updated_at = now() where id = 'building';
  perform public.enqueue_push('admins', null,
    case when coalesce(v_state->'settings'->>'language', 'en') = 'ar' then 'قراءات العدادات' else 'Meter readings entered' end,
    case when coalesce(v_state->'settings'->>'language', 'en') = 'ar' then 'أدخل الناطور قراءات ' else 'The concierge entered the readings for ' end || left(p_month, 7));
end;
$$;

create or replace function public.concierge_report_issue(p_title text, p_details text default null, p_photo_path text default null)
returns void
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_now text := public.now_iso();
  v_issue jsonb;
  v_state jsonb;
begin
  if not public.is_concierge() then raise exception 'Concierge access only'; end if;
  if coalesce(trim(p_title), '') = '' or length(p_title) > 200 then raise exception 'Describe the problem in a few words'; end if;
  if length(coalesce(p_details, '')) > 2000 then raise exception 'The description is too long'; end if;
  if p_photo_path is not null and p_photo_path not like 'concierge/%' then raise exception 'Photo must be one of your own uploads'; end if;
  v_issue := jsonb_build_object('id', 'iss-' || encode(gen_random_bytes(6), 'hex'), 'tenantId', null, 'title', trim(p_title),
    'details', coalesce(p_details, ''), 'status', 'open', 'createdAt', v_now, 'updatedAt', v_now, 'reportedBy', 'concierge');
  if p_photo_path is not null then
    v_issue := v_issue || jsonb_build_object('photo', jsonb_build_object('storagePath', p_photo_path, 'fileName', 'problem.jpg', 'mimeType', 'image/jpeg'));
  end if;
  update public.building_state
     set state = public.touch_state_meta(jsonb_set(state, '{issues}', coalesce(state->'issues', '[]'::jsonb) || v_issue, true)),
         rev = rev + 1, updated_at = now()
   where id = 'building'
  returning state into v_state;
  perform public.enqueue_push('admins', null,
    case when coalesce(v_state->'settings'->>'language', 'en') = 'ar' then 'مشكلة من الناطور' else 'Concierge reported a problem' end, trim(p_title));
end;
$$;

-- ── Problems as conversations ───────────────────────────────────────────────
create or replace function public.reply_issue(p_issue_id text, p_text text, p_photo_path text default null)
returns void
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_me text := public.my_tenant_id();
  v_concierge boolean := public.is_concierge();
  v_state jsonb;
  v_idx int;
  v_issue jsonb;
  v_msg jsonb;
  v_now text := public.now_iso();
begin
  if v_me is null and not v_concierge then raise exception 'This device is not linked'; end if;
  if coalesce(trim(p_text), '') = '' and p_photo_path is null then raise exception 'Write a message'; end if;
  if length(coalesce(p_text, '')) > 1000 then raise exception 'The message is too long'; end if;
  if p_photo_path is not null and not (
       (v_me is not null and p_photo_path like 'issues/' || v_me || '/%')
       or (v_concierge and p_photo_path like 'concierge/%')) then
    raise exception 'Photo must be one of your own uploads';
  end if;
  select state into v_state from public.building_state where id = 'building' for update;
  v_idx := public.state_index(v_state, 'issues', p_issue_id);
  if v_idx is null then raise exception 'Problem not found'; end if;
  v_issue := v_state->'issues'->v_idx;
  if not v_concierge and coalesce(v_issue->>'tenantId', '') <> v_me then raise exception 'You can only reply on your own problems'; end if;
  v_msg := jsonb_build_object('id', 'msg-' || encode(gen_random_bytes(5), 'hex'), 'by', case when v_concierge then 'concierge' else 'tenant' end,
                              'text', trim(coalesce(p_text, '')), 'at', v_now);
  if p_photo_path is not null then
    v_msg := v_msg || jsonb_build_object('photo', jsonb_build_object('storagePath', p_photo_path, 'fileName', 'photo.jpg', 'mimeType', 'image/jpeg'));
  end if;
  v_issue := v_issue || jsonb_build_object('messages', coalesce(v_issue->'messages', '[]'::jsonb) || v_msg, 'updatedAt', v_now);
  update public.building_state
     set state = public.touch_state_meta(jsonb_set(state, array['issues', v_idx::text], v_issue)),
         rev = rev + 1, updated_at = now()
   where id = 'building';
  perform public.enqueue_push('admins', null,
    case when coalesce(v_state->'settings'->>'language', 'en') = 'ar' then 'رد على مشكلة' else 'Reply on a problem' end,
    (v_issue->>'title') || ': ' || left(trim(coalesce(p_text, '')), 120));
end;
$$;

-- ── Resident directory (opt-in) ─────────────────────────────────────────────
create or replace function public.set_directory_optin(p_share boolean)
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
  v_idx := public.state_index(v_state, 'tenants', v_me);
  if v_idx is null then raise exception 'Tenant not found'; end if;
  update public.building_state
     set state = public.touch_state_meta(jsonb_set(state, array['tenants', v_idx::text],
                   (state->'tenants'->v_idx) || jsonb_build_object('directory', coalesce(p_share, false), 'directoryAt', public.now_iso()))),
         rev = rev + 1, updated_at = now()
   where id = 'building';
end;
$$;

-- ── Notices: seen by ────────────────────────────────────────────────────────
create or replace function public.mark_notice_seen(p_notice_id text)
returns void
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_me text := public.my_tenant_id();
  v_state jsonb;
  v_idx int;
  v_seen jsonb;
begin
  if v_me is null then return; end if;
  select state into v_state from public.building_state where id = 'building' for update;
  v_idx := public.state_index(v_state, 'announcements', p_notice_id);
  if v_idx is null then return; end if;
  v_seen := coalesce(v_state->'announcements'->v_idx->'seenBy', '[]'::jsonb);
  if v_seen ? v_me then return; end if;
  update public.building_state
     set state = public.touch_state_meta(jsonb_set(state, array['announcements', v_idx::text, 'seenBy'], v_seen || to_jsonb(v_me), true)),
         rev = rev + 1, updated_at = now()
   where id = 'building';
end;
$$;

-- ── Votes with several choices ──────────────────────────────────────────────
create or replace function public.cast_my_vote(p_poll_id text, p_vote text)
returns void
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_me  text := public.my_tenant_id();
  v_idx int;
  v_poll jsonb;
begin
  if v_me is null then raise exception 'This device is not linked to a tenant'; end if;
  select (ord - 1)::int, val into v_idx, v_poll
    from public.building_state,
         jsonb_array_elements(coalesce(state->'polls', '[]'::jsonb)) with ordinality as p(val, ord)
   where id = 'building' and val->>'id' = p_poll_id
   for update of building_state;
  if v_idx is null then raise exception 'Poll not found'; end if;
  if jsonb_typeof(v_poll->'options') = 'array' and jsonb_array_length(v_poll->'options') > 0 then
    if not exists (select 1 from jsonb_array_elements(v_poll->'options') o where o->>'id' = p_vote) and p_vote <> 'abstain' then
      raise exception 'Choose one of the options';
    end if;
  elsif p_vote not in ('yes', 'no', 'abstain') then
    raise exception 'Vote must be yes, no or abstain';
  end if;
  if v_poll->>'status' <> 'open' then raise exception 'This poll is closed'; end if;
  if coalesce(v_poll->>'closesOn', '') ~ '^\d{4}-\d{2}-\d{2}$' and (v_poll->>'closesOn')::date < current_date then
    raise exception 'Voting on this poll has closed';
  end if;
  update public.building_state
     set state = public.touch_state_meta(jsonb_set(state, array['polls', v_idx::text, 'votes'],
                   coalesce(v_poll->'votes', '{}'::jsonb) || jsonb_build_object(v_me, p_vote), true)),
         rev = rev + 1, updated_at = now()
   where id = 'building';
end;
$$;

-- ── Scheduled notices go out on their date ──────────────────────────────────
create or replace function public.send_due_notices()
returns int
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_state jsonb;
  v_n jsonb;
  v_idx int;
  v_sent int := 0;
begin
  select state into v_state from public.building_state where id = 'building' for update;
  if v_state is null then return 0; end if;
  for v_n, v_idx in
    select val, (ord - 1)::int from jsonb_array_elements(coalesce(v_state->'announcements', '[]'::jsonb)) with ordinality as a(val, ord)
  loop
    if coalesce(v_n->>'publishAt', '') <> ''
       and (v_n->>'publishAt')::timestamptz <= now()
       and coalesce((v_n->>'sendPush')::boolean, false)
       and coalesce(v_n->>'pushedAt', '') = '' then
      perform public.enqueue_push('tenants', null, '📢 ' || (v_n->>'title'), coalesce(nullif(v_n->>'body', ''), v_n->>'title'));
      v_state := jsonb_set(v_state, array['announcements', v_idx::text, 'pushedAt'], to_jsonb(public.now_iso()), true);
      v_sent := v_sent + 1;
    end if;
  end loop;
  if v_sent > 0 then
    update public.building_state set state = public.touch_state_meta(v_state), rev = rev + 1, updated_at = now() where id = 'building';
  end if;
  return v_sent;
end;
$$;
select cron.schedule('scheduled-notices', '*/15 * * * *', $$select public.send_due_notices()$$);

-- ── get_my_state: tenants and the concierge get their own slices ───────────
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
      'transactions', coalesce((select jsonb_agg(x - 'shares') from jsonb_array_elements(coalesce(v_orig->'transactions', '[]'::jsonb)) x
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
      'deleted', coalesce(v_orig->'deleted', '{}'::jsonb),
      'redaction', jsonb_build_object('role', 'concierge'));
  end if;

  v_me := public.my_tenant_id();
  if v_me is null then
    raise exception 'This device is not linked to a tenant yet';
  end if;
  v_state := v_orig - 'auditLog' - 'cashChecks' - 'balanceSnapshot' - 'documents' - 'suppliers' - 'equipment';

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

  -- Notices: published ones only; whether this tenant has seen each.
  v_state := jsonb_set(v_state, '{announcements}', coalesce((
    select jsonb_agg((n - 'seenBy') || jsonb_build_object('seenByMe', coalesce(n->'seenBy', '[]'::jsonb) ? v_me))
      from jsonb_array_elements(coalesce(v_orig->'announcements', '[]'::jsonb)) n
     where coalesce(n->>'publishAt', '') = '' or (n->>'publishAt')::timestamptz <= v_now), '[]'::jsonb));

  v_state := jsonb_set(v_state, '{buildingProjects}', coalesce((
    select jsonb_agg(
             case when jsonb_typeof(p->'shares') = 'object'
                  then jsonb_set(p, '{shares}',
                         case when p->'shares' ? v_me then jsonb_build_object(v_me, p->'shares'->v_me) else '{}'::jsonb end)
                  else p end)
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

-- ── Grants ──────────────────────────────────────────────────────────────────
revoke all on function public.is_concierge() from public, anon;
revoke all on function public.now_iso() from public, anon;
revoke all on function public.state_index(jsonb, text, text) from public, anon, authenticated;
revoke all on function public.concierge_add_expense(jsonb) from public, anon;
revoke all on function public.concierge_save_readings(text, jsonb) from public, anon;
revoke all on function public.concierge_report_issue(text, text, text) from public, anon;
revoke all on function public.reply_issue(text, text, text) from public, anon;
revoke all on function public.set_directory_optin(boolean) from public, anon;
revoke all on function public.mark_notice_seen(text) from public, anon;
revoke all on function public.send_due_notices() from public, anon, authenticated;
revoke all on function public.create_admin_invite(text) from public, anon;
revoke all on function public.claim_admin_invite(text) from public, anon;
revoke all on function public.list_admins() from public, anon;
revoke all on function public.remove_admin(uuid) from public, anon;
revoke all on function public.cast_my_vote(text, text) from public, anon;
revoke all on function public.get_my_state() from public, anon;

grant execute on function public.is_concierge()                            to authenticated;
grant execute on function public.now_iso()                                 to authenticated;
grant execute on function public.concierge_add_expense(jsonb)              to authenticated;
grant execute on function public.concierge_save_readings(text, jsonb)      to authenticated;
grant execute on function public.concierge_report_issue(text, text, text)  to authenticated;
grant execute on function public.reply_issue(text, text, text)             to authenticated;
grant execute on function public.set_directory_optin(boolean)              to authenticated;
grant execute on function public.mark_notice_seen(text)                    to authenticated;
grant execute on function public.create_admin_invite(text)                 to authenticated;
grant execute on function public.claim_admin_invite(text)                  to authenticated;
grant execute on function public.list_admins()                             to authenticated;
grant execute on function public.remove_admin(uuid)                        to authenticated;
grant execute on function public.cast_my_vote(text, text)                  to authenticated;
grant execute on function public.get_my_state()                            to authenticated;
