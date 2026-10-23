-- Phase 2o — v179: rentals step C — the tenant's and the owner's phones
--
--   * the building manager can invite a flat's tenant (the renter) with a
--     one-time code tied to the lease
--   * the tenant's phone sees the flat's building charges (the tenant pays
--     them), the building's notices, problems, bookings and board, and their
--     own rent — not the owners' votes, the owners' meetings, the directory or
--     the owner's personal details; it can't change the owner's details
--   * the tenant's access ends by itself when the lease is ended
--   * the owner's phone also sees their rented flat's rent account (collected,
--     the manager's fee, expenses, handed over)
--   * notices and reminders for a flat also reach its tenant's phone
--
-- Run in: Supabase dashboard -> SQL Editor -> New query -> paste -> Run.
-- Safe to re-run. Needs phase2a–2n.

-- ── Renters in memberships and invite codes ─────────────────────────────────
alter table public.memberships add column if not exists lease_id text;
alter table public.memberships drop constraint if exists memberships_role_check;
alter table public.memberships add constraint memberships_role_check check (role in ('owner', 'viewer', 'tenant', 'concierge', 'renter'));
alter table public.memberships drop constraint if exists membership_tenant_needs_id;
alter table public.memberships add constraint membership_tenant_needs_id check (role not in ('tenant', 'renter') or tenant_id is not null);

alter table public.claim_codes add column if not exists role text not null default 'tenant';
alter table public.claim_codes add column if not exists lease_id text;
alter table public.claim_codes drop constraint if exists claim_codes_role_check;
alter table public.claim_codes add constraint claim_codes_role_check check (role in ('tenant', 'renter'));

create or replace function public.lease_active(p_lease_id text)
returns boolean
language sql stable security definer set search_path = public, extensions
as $$
  select exists (select 1 from public.leases l where l.id = p_lease_id and coalesce(l.data->>'status', 'active') <> 'ended');
$$;

create or replace function public.is_renter()
returns boolean
language sql stable security definer set search_path = public, extensions
as $$
  select coalesce(public.role_in(public.my_building()) = 'renter', false);
$$;

-- The flat this phone pays for: an owner's flat, or a renter's flat while the
-- lease is running.
create or replace function public.my_tenant_id()
returns text
language sql stable security definer set search_path = public, extensions
as $$
  select m.tenant_id from public.memberships m
   where m.auth_user_id = auth.uid() and m.building_id = public.my_building()
     and (m.role = 'tenant' or (m.role = 'renter' and public.lease_active(m.lease_id)));
$$;

-- The manager invites a lease's tenant.
create or replace function public.create_renter_code(p_lease_id text)
returns text
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_lease public.leases;
  v_code text;
begin
  if not public.is_owner() then raise exception 'Only the building manager can create invite codes'; end if;
  select * into v_lease from public.leases where id = p_lease_id and building_id = public.my_building();
  if v_lease.id is null then raise exception 'That lease no longer exists'; end if;
  if coalesce(v_lease.data->>'status', 'active') = 'ended' then raise exception 'That lease has ended'; end if;
  v_code := substr(translate(upper(encode(gen_random_bytes(24), 'base64')), 'O0I1+/=', 'XYZWQRS'), 1, 8);
  insert into public.claim_codes (code, tenant_id, building_id, role, lease_id)
       values (v_code, v_lease.flat_id, v_lease.building_id, 'renter', v_lease.id);
  return v_code;
end;
$$;

-- ── What a phone loads ───────────────────────────────────────────────────────
-- The existing logic becomes get_my_state_base(); get_my_state() adds the rent
-- and trims what a renter must not see.
do $$
begin
  if not exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'get_my_state_base') then
    alter function public.get_my_state() rename to get_my_state_base;
  end if;
end;
$$;
revoke all on function public.get_my_state_base() from public, anon, authenticated;

create or replace function public.get_my_state()
returns jsonb
language plpgsql stable security definer set search_path = public, extensions
as $$
declare
  v jsonb;
  v_role text := public.role_in(public.my_building());
  v_lease public.leases;
begin
  if v_role = 'renter' then
    select l.* into v_lease from public.memberships m join public.leases l on l.id = m.lease_id
     where m.auth_user_id = auth.uid() and m.building_id = public.my_building();
    if v_lease.id is null or coalesce(v_lease.data->>'status', 'active') = 'ended' then
      raise exception 'This lease has ended. Ask the building manager if this is a mistake.';
    end if;
  end if;
  v := public.get_my_state_base();
  if v is null then return v; end if;
  if v_role = 'renter' then
    v := v - 'polls' - 'directory' - 'meetings';
    v := jsonb_set(v, '{tenants}', coalesce((select jsonb_agg(t - 'phone' - 'details' - 'pinHash' - 'directory' - 'directoryAt' - 'language' - 'detailsAt' - 'settlement')
                                                from jsonb_array_elements(coalesce(v->'tenants', '[]'::jsonb)) t), '[]'::jsonb));
    v := v || jsonb_build_object('myRole', 'renter',
      'myLease', (v_lease.data - 'fee' - 'payouts' - 'deductions' - 'ownFlat' - 'notes') || jsonb_build_object('id', v_lease.id));
  elsif v_role = 'tenant' then
    v := v || jsonb_build_object('myRentals', coalesce((
      select jsonb_agg((l.data - 'notes') || jsonb_build_object('id', l.id) order by l.created_at)
        from public.leases l
       where l.building_id = public.my_building() and l.flat_id = public.my_tenant_id()
         and coalesce((l.data->>'ownFlat')::boolean, false) = false), '[]'::jsonb));
  end if;
  return v;
end;
$$;

-- public.cast_my_vote
create or replace function public.cast_my_vote(p_poll_id text, p_vote text)
returns void
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_me  text := public.my_tenant_id();
  v_idx int;
  v_poll jsonb;
begin
  if public.is_renter() then raise exception 'Only flat owners vote on building decisions'; end if;
  if v_me is null then raise exception 'This device is not linked to a tenant'; end if;
  select (ord - 1)::int, val into v_idx, v_poll
    from public.building_state,
         jsonb_array_elements(coalesce(state->'polls', '[]'::jsonb)) with ordinality as p(val, ord)
   where id = public.my_building() and val->>'id' = p_poll_id
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
   where id = public.my_building();
end;
$$;

-- public.set_directory_optin
create or replace function public.set_directory_optin(p_share boolean)
returns void
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_me text := public.my_tenant_id();
  v_state jsonb;
  v_idx int;
begin
  if public.is_renter() then raise exception 'Only the flat owner can change this'; end if;
  if v_me is null then raise exception 'This device is not linked to a tenant'; end if;
  select state into v_state from public.building_state where id = public.my_building() for update;
  v_idx := public.state_index(v_state, 'tenants', v_me);
  if v_idx is null then raise exception 'Tenant not found'; end if;
  update public.building_state
     set state = public.touch_state_meta(jsonb_set(state, array['tenants', v_idx::text],
                   (state->'tenants'->v_idx) || jsonb_build_object('directory', coalesce(p_share, false), 'directoryAt', public.now_iso()))),
         rev = rev + 1, updated_at = now()
   where id = public.my_building();
end;
$$;

-- public.update_my_details
create or replace function public.update_my_details(p_phone text, p_language text)
returns void
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_me text := public.my_tenant_id();
  v_state jsonb;
  v_idx int;
begin
  if public.is_renter() then raise exception 'Only the flat owner can change these details'; end if;
  if v_me is null then raise exception 'This device is not linked to a tenant'; end if;
  if length(coalesce(p_phone, '')) > 30 or coalesce(p_phone, '') !~ '^[0-9 +()-]*$' then raise exception 'That does not look like a phone number'; end if;
  if p_language not in ('en', 'ar') then raise exception 'Language must be en or ar'; end if;
  select state into v_state from public.building_state where id = public.my_building() for update;
  v_idx := public.state_index(v_state, 'tenants', v_me);
  if v_idx is null then raise exception 'Tenant not found'; end if;
  update public.building_state
     set state = public.touch_state_meta(jsonb_set(state, array['tenants', v_idx::text],
                   (state->'tenants'->v_idx) || jsonb_build_object('phone', trim(coalesce(p_phone, '')), 'language', p_language, 'detailsAt', public.now_iso()))),
         rev = rev + 1, updated_at = now()
   where id = public.my_building();
  perform public.enqueue_push('admins', null,
    case when coalesce(v_state->'settings'->>'language', 'en') = 'ar' then 'تحديث بيانات مستأجر' else 'A tenant updated their details' end,
    coalesce(v_state->'tenants'->v_idx->>'name', '') || ' · ' || trim(coalesce(p_phone, '')));
end;
$$;

-- public.claim_tenant
create or replace function public.claim_tenant(p_code text)
returns text
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_row public.claim_codes;
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;
  select * into v_row from public.claim_codes
   where code = upper(trim(p_code)) for update;
  if v_row.code is null then
    raise exception 'That code is not valid';
  end if;
  if v_row.used_at is not null then
    raise exception 'That code has already been used';
  end if;
  if v_row.expires_at < now() then
    raise exception 'That code has expired';
  end if;
  if exists (select 1 from public.memberships
              where auth_user_id = auth.uid() and building_id = v_row.building_id and role in ('owner', 'viewer')) then
    raise exception 'This account already runs this building';
  end if;
  if coalesce(v_row.role, 'tenant') = 'renter' and not public.lease_active(v_row.lease_id) then
    raise exception 'That lease has ended';
  end if;
  insert into public.memberships (auth_user_id, building_id, role, tenant_id, lease_id)
       values (auth.uid(), v_row.building_id, coalesce(v_row.role, 'tenant'), v_row.tenant_id, v_row.lease_id)
  on conflict (auth_user_id, building_id)
    do update set role = excluded.role, tenant_id = excluded.tenant_id, lease_id = excluded.lease_id;
  update public.claim_codes
     set used_at = now(), used_by = auth.uid()
   where code = v_row.code;
  return v_row.tenant_id;
end;
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
      or (v_job.target = 'tenants' and (m.role = 'tenant' or (m.role = 'renter' and public.lease_active(m.lease_id))) and (v_job.tenant_id is null or m.tenant_id = v_job.tenant_id));
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

-- ── Who may call what ────────────────────────────────────────────────────────
revoke all on function public.lease_active(text)       from public, anon, authenticated;
revoke all on function public.is_renter()              from public, anon;
revoke all on function public.create_renter_code(text) from public, anon;
revoke all on function public.get_my_state()           from public, anon;
grant execute on function public.is_renter()              to authenticated;
grant execute on function public.create_renter_code(text) to authenticated;
grant execute on function public.get_my_state()           to authenticated;
