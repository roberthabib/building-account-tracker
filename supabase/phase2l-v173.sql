-- Phase 2l — v173: more than one building
--
--   * the building manager can run several buildings and switch between them;
--     each building has its own tenants, concierge, helpers, notifications,
--     invite codes and daily backups
--   * who belongs where lives in public.memberships (one row per person per
--     building); the app says which building it is working on with the
--     x-building request header, and the database only accepts a building
--     the signed-in person belongs to
--   * the existing building keeps the id 'building' and its photo folders;
--     new buildings keep their photos under b/<building id>/
--   * messages say "building manager" instead of "owner"
--
-- Phones on the old app keep working: with no header, the database picks the
-- person's first building, which today is the only one.
--
-- Run in: Supabase dashboard -> SQL Editor -> New query -> paste -> Run.
-- Safe to re-run. Needs phase2a–2k.

-- ── Memberships ──────────────────────────────────────────────────────────────
create table if not exists public.memberships (
  auth_user_id uuid not null references auth.users (id) on delete cascade,
  building_id  text not null,
  role         text not null check (role in ('owner', 'viewer', 'tenant', 'concierge')),
  tenant_id    text,
  created_at   timestamptz not null default now(),
  primary key (auth_user_id, building_id),
  constraint membership_tenant_needs_id check (role <> 'tenant' or tenant_id is not null)
);
alter table public.memberships enable row level security;
drop policy if exists "read own memberships" on public.memberships;
create policy "read own memberships"
  on public.memberships for select to authenticated
  using (auth_user_id = auth.uid());
revoke all on public.memberships from anon;
grant select on public.memberships to authenticated;

-- Everyone already linked belongs to the existing building.
insert into public.memberships (auth_user_id, building_id, role, tenant_id, created_at)
select auth_user_id, 'building', role, tenant_id, created_at from public.profiles
on conflict (auth_user_id, building_id) do nothing;

-- public.profiles is no longer read. Anything that still writes it (older
-- check scripts) is mirrored into the existing building.
create or replace function public.mirror_profile()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    delete from public.memberships where auth_user_id = old.auth_user_id and building_id = 'building';
    return old;
  end if;
  insert into public.memberships (auth_user_id, building_id, role, tenant_id)
       values (new.auth_user_id, 'building', new.role, new.tenant_id)
  on conflict (auth_user_id, building_id) do update set role = excluded.role, tenant_id = excluded.tenant_id;
  return new;
end;
$$;
revoke all on function public.mirror_profile() from public, anon, authenticated;
drop trigger if exists mirror_profile on public.profiles;
create trigger mirror_profile after insert or update or delete on public.profiles
  for each row execute function public.mirror_profile();

-- ── Building ids on codes, invites, notifications, backups, reminders ────────
alter table public.claim_codes       add column if not exists building_id text not null default 'building';
alter table public.admin_invites     add column if not exists building_id text not null default 'building';
alter table public.push_jobs         add column if not exists building_id text not null default 'building';
alter table public.building_backups  add column if not exists building_id text not null default 'building';
alter table public.late_reminder_log add column if not exists building_id text not null default 'building';

do $$
begin
  if (select array_length(conkey, 1) from pg_constraint where conname = 'building_backups_pkey') = 1 then
    alter table public.building_backups drop constraint building_backups_pkey;
    alter table public.building_backups add constraint building_backups_pkey primary key (building_id, day);
  end if;
  if (select array_length(conkey, 1) from pg_constraint where conname = 'late_reminder_log_pkey') = 1 then
    alter table public.late_reminder_log drop constraint late_reminder_log_pkey;
    alter table public.late_reminder_log add constraint late_reminder_log_pkey primary key (building_id, month);
  end if;
end;
$$;

-- ── Which building is this request about? ────────────────────────────────────
-- 1. app.building, set only by the scheduled jobs below while they loop over
--    the buildings (requests can't set it);
-- 2. the x-building header, accepted only if the signed-in person belongs to
--    that building (otherwise null, and every check then fails);
-- 3. else the person's first building, the existing one first.
create or replace function public.my_building()
returns text
language plpgsql stable security definer set search_path = public, extensions
as $$
declare
  v text;
begin
  v := nullif(current_setting('app.building', true), '');
  if v is not null then return v; end if;
  if auth.uid() is null then return 'building'; end if;
  begin
    v := nullif(trim(current_setting('request.headers', true)::json ->> 'x-building'), '');
  exception when others then
    v := null;
  end;
  if v is not null then
    if exists (select 1 from public.memberships where auth_user_id = auth.uid() and building_id = v) then return v; end if;
    return null;
  end if;
  select building_id into v from public.memberships
   where auth_user_id = auth.uid()
   order by (building_id = 'building') desc, created_at
   limit 1;
  return coalesce(v, 'building');
end;
$$;

create or replace function public.role_in(p_building text)
returns text
language sql stable security definer set search_path = public, extensions
as $$
  select role from public.memberships where auth_user_id = auth.uid() and building_id = p_building;
$$;

create or replace function public.is_owner()
returns boolean
language sql stable security definer set search_path = public, extensions
as $$
  select coalesce(public.role_in(public.my_building()) = 'owner', false);
$$;

create or replace function public.is_viewer()
returns boolean
language sql stable security definer set search_path = public, extensions
as $$
  select coalesce(public.role_in(public.my_building()) = 'viewer', false);
$$;

create or replace function public.is_concierge()
returns boolean
language sql stable security definer set search_path = public, extensions
as $$
  select coalesce(public.role_in(public.my_building()) = 'concierge', false);
$$;

create or replace function public.my_tenant_id()
returns text
language sql stable security definer set search_path = public, extensions
as $$
  select tenant_id from public.memberships
   where auth_user_id = auth.uid() and building_id = public.my_building() and role = 'tenant';
$$;

create or replace function public.my_admin_role()
returns text
language sql stable security definer set search_path = public, extensions
as $$
  select r from (select public.role_in(public.my_building()) as r) x where r in ('owner', 'viewer');
$$;

-- ── Photo paths ──────────────────────────────────────────────────────────────
-- b/<id>/<rest> belongs to building <id>; anything else to the existing one.
create or replace function public.photo_building(p_name text)
returns text
language sql immutable
as $$
  select case when p_name like 'b/%/%' then split_part(p_name, '/', 2) else 'building' end;
$$;

create or replace function public.photo_rest(p_name text)
returns text
language sql immutable
as $$
  select case when p_name like 'b/%/%' then substr(p_name, length(split_part(p_name, '/', 2)) + 4) else p_name end;
$$;

create or replace function public.photo_role(p_name text)
returns text
language sql stable security definer set search_path = public, extensions
as $$
  select public.role_in(public.photo_building(p_name));
$$;

create or replace function public.photo_tenant(p_name text)
returns text
language sql stable security definer set search_path = public, extensions
as $$
  select tenant_id from public.memberships
   where auth_user_id = auth.uid() and building_id = public.photo_building(p_name) and role = 'tenant';
$$;

-- A photo path sent to a function, without its building prefix — or something
-- that matches no folder when it belongs to another building.
create or replace function public.local_path(p_name text)
returns text
language sql stable security definer set search_path = public, extensions
as $$
  select case
    when p_name is null then null
    when public.photo_building(p_name) is not distinct from public.my_building() then public.photo_rest(p_name)
    else '!' || p_name
  end;
$$;

-- ── The building row: each person sees the buildings they belong to ─────────
drop policy if exists "owner reads building_state" on public.building_state;
drop policy if exists "owner inserts building_state" on public.building_state;
drop policy if exists "owner updates building_state" on public.building_state;
drop policy if exists "viewer reads building_state" on public.building_state;
drop policy if exists "manager reads building_state" on public.building_state;
drop policy if exists "manager inserts building_state" on public.building_state;
drop policy if exists "manager updates building_state" on public.building_state;
create policy "manager reads building_state"
  on public.building_state for select to authenticated
  using (public.role_in(id) in ('owner', 'viewer'));
create policy "manager inserts building_state"
  on public.building_state for insert to authenticated
  with check (public.role_in(id) = 'owner');
create policy "manager updates building_state"
  on public.building_state for update to authenticated
  using (public.role_in(id) = 'owner') with check (public.role_in(id) = 'owner');

-- ── Buildings: list mine, add one ────────────────────────────────────────────
create or replace function public.my_buildings()
returns table (id text, name text, role text, tenant_id text, since timestamptz)
language sql stable security definer set search_path = public, extensions
as $$
  select m.building_id,
         coalesce(nullif(b.state->'building'->>'name', ''), ''),
         m.role, m.tenant_id, m.created_at
    from public.memberships m
    left join public.building_state b on b.id = m.building_id
   where m.auth_user_id = auth.uid()
   order by (m.building_id = 'building') desc, m.created_at;
$$;

create or replace function public.create_building(p_name text)
returns text
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_id text;
  v_name text := left(trim(coalesce(p_name, '')), 80);
begin
  if auth.uid() is null or coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) then
    raise exception 'Sign in with Google first';
  end if;
  if not exists (select 1 from public.memberships where auth_user_id = auth.uid() and role = 'owner') then
    raise exception 'Only a building manager can add a building';
  end if;
  if v_name = '' then raise exception 'Give the building a name'; end if;
  if (select count(*) from public.memberships where auth_user_id = auth.uid() and role = 'owner') >= 20 then
    raise exception 'That is the most buildings one person can manage here';
  end if;
  v_id := 'b' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 11);
  insert into public.building_state (id, state, rev)
       values (v_id, jsonb_build_object('building', jsonb_build_object('name', v_name), 'setupComplete', false), 0);
  insert into public.memberships (auth_user_id, building_id, role) values (auth.uid(), v_id, 'owner');
  return v_id;
end;
$$;

-- ── Invites, codes, administrators ───────────────────────────────────────────
create or replace function public.create_claim_code(p_tenant_id text)
returns text
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_code text;
begin
  if not public.is_owner() then
    raise exception 'Only the building manager can create invite codes';
  end if;
  -- 8 chars, uppercase, ambiguous glyphs mapped out (O/0/I/1 and base64 +/=).
  v_code := substr(
    translate(upper(encode(gen_random_bytes(24), 'base64')),
              'O0I1+/=', 'XYZWQRS'),
    1, 8);
  insert into public.claim_codes (code, tenant_id, building_id) values (v_code, p_tenant_id, public.my_building());
  return v_code;
end;
$$;

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
  insert into public.memberships (auth_user_id, building_id, role, tenant_id)
       values (auth.uid(), v_row.building_id, 'tenant', v_row.tenant_id)
  on conflict (auth_user_id, building_id)
    do update set role = 'tenant', tenant_id = excluded.tenant_id;
  update public.claim_codes
     set used_at = now(), used_by = auth.uid()
   where code = v_row.code;
  return v_row.tenant_id;
end;
$$;

create or replace function public.create_admin_invite(p_role text)
returns text
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_code text;
begin
  if not public.is_owner() then raise exception 'Only the building manager can invite administrators'; end if;
  if p_role not in ('owner', 'viewer', 'concierge') then raise exception 'Role must be owner, viewer or concierge'; end if;
  v_code := substr(translate(upper(encode(gen_random_bytes(24), 'base64')), 'O0I1+/=', 'XYZWQRS'), 1, 10);
  insert into public.admin_invites (code, role, created_by, building_id) values (v_code, p_role, auth.uid(), public.my_building());
  return v_code;
end;
$$;

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
  if not exists (select 1 from public.memberships
                  where auth_user_id = auth.uid() and building_id = v_row.building_id and role = 'owner') then
    insert into public.memberships (auth_user_id, building_id, role, tenant_id)
         values (auth.uid(), v_row.building_id, v_row.role, null)
    on conflict (auth_user_id, building_id) do update set role = excluded.role, tenant_id = null;
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
  if not public.is_owner() then raise exception 'Only the building manager can see administrators'; end if;
  return query
    select p.auth_user_id, coalesce(u.email::text, ''), p.role, p.created_at, p.auth_user_id = auth.uid()
      from public.memberships p join auth.users u on u.id = p.auth_user_id
     where p.building_id = public.my_building()
       and p.role in ('owner', 'viewer', 'concierge')
     order by p.created_at;
end;
$$;

create or replace function public.remove_admin(p_user_id uuid)
returns void
language plpgsql security definer set search_path = public, extensions
as $$
begin
  if not public.is_owner() then raise exception 'Only the building manager can remove administrators'; end if;
  if p_user_id = auth.uid() then raise exception 'You cannot remove your own access'; end if;
  delete from public.memberships
   where auth_user_id = p_user_id and building_id = public.my_building() and role in ('owner', 'viewer', 'concierge');
  if not exists (select 1 from public.memberships where auth_user_id = p_user_id) then
    delete from public.push_subscriptions where auth_user_id = p_user_id;
  end if;
end;
$$;

create or replace function public.step_down(p_keep_view boolean)
returns void
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_b text := public.my_building();
begin
  if not public.is_owner() then raise exception 'Only the building manager can step down'; end if;
  if not exists (select 1 from public.memberships
                  where building_id = v_b and role = 'owner' and auth_user_id <> auth.uid()) then
    raise exception 'First let the new manager sign in with full access';
  end if;
  if coalesce(p_keep_view, false) then
    update public.memberships set role = 'viewer' where auth_user_id = auth.uid() and building_id = v_b;
  else
    delete from public.memberships where auth_user_id = auth.uid() and building_id = v_b;
    if not exists (select 1 from public.memberships where auth_user_id = auth.uid()) then
      delete from public.push_subscriptions where auth_user_id = auth.uid();
    end if;
  end if;
end;
$$;

create or replace function public.list_tenant_links()
returns table (tenant_id text, phones int, notifications int)
language plpgsql stable security definer set search_path = public, extensions
as $$
begin
  if not (public.is_owner() or public.is_viewer()) then raise exception 'Administrators only'; end if;
  return query
    select p.tenant_id,
           count(distinct p.auth_user_id)::int,
           count(distinct s.endpoint)::int
      from public.memberships p
      join auth.users u on u.id = p.auth_user_id
      left join public.push_subscriptions s on s.auth_user_id = p.auth_user_id
     where p.building_id = public.my_building()
       and p.role = 'tenant'
       and (u.banned_until is null or u.banned_until < now())
     group by p.tenant_id;
end;
$$;

-- ── Notifications: sent to the people of the job's building ─────────────────
create or replace function public.save_push_subscription(p_endpoint text, p_p256dh text, p_auth text)
returns void
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_role text;
  v_tenant text;
begin
  v_role := public.role_in(public.my_building());
  v_tenant := public.my_tenant_id();
  if v_role is null then
    select m.role, m.tenant_id into v_role, v_tenant from public.memberships m
     where m.auth_user_id = auth.uid() order by m.created_at limit 1;
  end if;
  if v_role is null then raise exception 'Sign in first'; end if;
  if p_endpoint !~ '^https://' or length(p_endpoint) > 1000 or length(p_p256dh) > 200 or length(p_auth) > 100 then
    raise exception 'That notification subscription is not valid';
  end if;
  insert into public.push_subscriptions (endpoint, auth_user_id, role, tenant_id, p256dh, auth)
       values (p_endpoint, auth.uid(), v_role, v_tenant, p_p256dh, p_auth)
  on conflict (endpoint) do update
     set auth_user_id = excluded.auth_user_id, role = excluded.role, tenant_id = excluded.tenant_id,
         p256dh = excluded.p256dh, auth = excluded.auth, created_at = now();
end;
$$;

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
        or (p_target = 'tenants' and m.role = 'tenant' and (p_tenant_id is null or m.tenant_id = p_tenant_id))
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
      or (v_job.target = 'tenants' and m.role = 'tenant' and (v_job.tenant_id is null or m.tenant_id = v_job.tenant_id));
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

-- ── Daily backups, per building ──────────────────────────────────────────────
create or replace function public.snapshot_building()
returns void
language plpgsql security definer set search_path = public
as $$
declare
  r record;
begin
  for r in select b.id, b.state, b.rev from public.building_state b
            where b.id = 'building' or exists (select 1 from public.memberships m where m.building_id = b.id and m.role = 'owner')
  loop
    -- Never let an empty or wiped document overwrite a real snapshot.
    if r.state is null
       or jsonb_array_length(coalesce(r.state->'tenants', '[]'::jsonb))
        + jsonb_array_length(coalesce(r.state->'transactions', '[]'::jsonb)) = 0 then
      continue;
    end if;
    insert into public.building_backups (building_id, day, state, rev) values (r.id, current_date, r.state, r.rev)
    on conflict (building_id, day) do update set state = excluded.state, rev = excluded.rev, created_at = now();
  end loop;
  delete from public.building_backups where day < current_date - 60;
end;
$$;

create or replace function public.list_backups()
returns table (day date, tenants int, transactions int, rev bigint, created_at timestamptz)
language plpgsql stable security definer set search_path = public
as $$
begin
  if not public.is_owner() then raise exception 'Only the building manager can see backups'; end if;
  return query
    select b.day,
           jsonb_array_length(coalesce(b.state->'tenants', '[]'::jsonb)),
           jsonb_array_length(coalesce(b.state->'transactions', '[]'::jsonb)),
           b.rev, b.created_at
      from public.building_backups b
     where b.building_id = public.my_building()
     order by b.day desc;
end;
$$;

create or replace function public.get_backup(p_day date)
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare v jsonb;
begin
  if not public.is_owner() then raise exception 'Only the building manager can restore backups'; end if;
  select state into v from public.building_backups where building_id = public.my_building() and day = p_day;
  if v is null then raise exception 'No backup for that day'; end if;
  return v;
end;
$$;

-- ── Functions that read or write the building row: now the chosen building ──

-- public.get_my_state (was phase2j-v167.sql)
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
  select state into v_orig from public.building_state where id = public.my_building();
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

-- public.declare_my_payment (was phase2f-v148-features.sql)
create or replace function public.declare_my_payment(p_month text, p_amount numeric, p_proof_path text default null)
returns void
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_me text := public.my_tenant_id();
  v_decl jsonb;
  v_state jsonb;
  v_ar boolean;
begin
  if v_me is null then raise exception 'This device is not linked to a tenant'; end if;
  if p_month !~ '^\d{4}-\d{2}-\d{2}$' then raise exception 'Month must look like YYYY-MM-01'; end if;
  if p_amount is null or p_amount <= 0 or p_amount > 1000000 then raise exception 'Amount out of range'; end if;
  if p_proof_path is not null and public.local_path(p_proof_path) not like 'proofs/' || v_me || '/%' then
    raise exception 'Proof photo must be one of your own uploads';
  end if;
  v_decl := jsonb_build_object(
    'id', 'decl-' || encode(gen_random_bytes(6), 'hex'), 'tenantId', v_me, 'month', p_month,
    'amount', p_amount, 'status', 'pending',
    'declaredAt', to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'));
  if p_proof_path is not null then
    v_decl := v_decl || jsonb_build_object('proof', jsonb_build_object(
      'storagePath', p_proof_path, 'fileName', 'payment-proof.jpg', 'mimeType', 'image/jpeg'));
  end if;
  update public.building_state
     set state = public.touch_state_meta(jsonb_set(state, '{paymentDeclarations}',
                   coalesce(state->'paymentDeclarations', '[]'::jsonb) || v_decl, true)),
         rev = rev + 1, updated_at = now()
   where id = public.my_building()
  returning state into v_state;
  if not found then raise exception 'No building data'; end if;
  v_ar := coalesce(v_state->'settings'->>'language', 'en') = 'ar';
  perform public.enqueue_push('admins', null,
    case when v_ar then 'دفعة جديدة' else 'Payment declared' end,
    public.tenant_label(v_state, v_me)
      || case when v_ar then ' يقول إنه دفع $' else ' says they paid $' end
      || trim(to_char(p_amount, 'FM999999990.00')));
end;
$$;

-- public.cast_my_vote (was phase2i-v166.sql)
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

-- public.notify_tenants (was phase2f-v148-features.sql)
create or replace function public.notify_tenants(p_tenant_id text, p_title text, p_body text)
returns void
language plpgsql security definer set search_path = public, extensions
as $$
begin
  if not public.is_owner() then raise exception 'Only the building manager can send notifications'; end if;
  perform public.enqueue_push('tenants', nullif(p_tenant_id, ''), p_title, p_body);
end;
$$;

-- public.report_issue (was phase2f-v148-features.sql)
create or replace function public.report_issue(p_title text, p_details text default null, p_photo_path text default null)
returns void
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_me text := public.my_tenant_id();
  v_now text := to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"');
  v_issue jsonb;
  v_state jsonb;
  v_ar boolean;
begin
  if v_me is null then raise exception 'This device is not linked to a tenant'; end if;
  if coalesce(trim(p_title), '') = '' or length(p_title) > 200 then raise exception 'Describe the problem in a few words'; end if;
  if length(coalesce(p_details, '')) > 2000 then raise exception 'The description is too long'; end if;
  if p_photo_path is not null and public.local_path(p_photo_path) not like 'issues/' || v_me || '/%' then
    raise exception 'Photo must be one of your own uploads';
  end if;
  v_issue := jsonb_build_object(
    'id', 'iss-' || encode(gen_random_bytes(6), 'hex'), 'tenantId', v_me, 'title', trim(p_title),
    'details', coalesce(p_details, ''), 'status', 'open', 'createdAt', v_now, 'updatedAt', v_now);
  if p_photo_path is not null then
    v_issue := v_issue || jsonb_build_object('photo', jsonb_build_object(
      'storagePath', p_photo_path, 'fileName', 'problem.jpg', 'mimeType', 'image/jpeg'));
  end if;
  update public.building_state
     set state = public.touch_state_meta(jsonb_set(state, '{issues}',
                   coalesce(state->'issues', '[]'::jsonb) || v_issue, true)),
         rev = rev + 1, updated_at = now()
   where id = public.my_building()
  returning state into v_state;
  if not found then raise exception 'No building data'; end if;
  v_ar := coalesce(v_state->'settings'->>'language', 'en') = 'ar';
  perform public.enqueue_push('admins', null,
    case when v_ar then 'مشكلة جديدة' else 'Problem reported' end,
    public.tenant_label(v_state, v_me) || ': ' || trim(p_title));
end;
$$;

-- public.send_monthly_balances (was phase2g-monthly.sql)
create or replace function public.send_monthly_balances_one()
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
  select state into v_state from public.building_state where id = public.my_building();
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

-- public.concierge_add_expense (was phase2j-v167.sql)
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
  if v_photo is not null and public.local_path(v_photo) not like 'concierge/%' then raise exception 'Photo must be one of your own uploads'; end if;
  select state into v_state from public.building_state where id = public.my_building() for update;
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
     where id = public.my_building();
    perform public.enqueue_push('admins', null,
      case when coalesce(v_state->'settings'->>'language', 'en') = 'ar' then 'مصروف بانتظار موافقتك' else 'An expense is waiting for your approval' end,
      trim(p_entry->>'description') || ' — $' || trim(to_char(v_amount_usd, 'FM999999990.00')));
    return v_id;
  end if;
  update public.building_state
     set state = public.touch_state_meta(jsonb_set(state, '{transactions}', coalesce(state->'transactions', '[]'::jsonb) || v_tx, true)),
         rev = rev + 1, updated_at = now()
   where id = public.my_building();
  perform public.enqueue_push('admins', null,
    case when coalesce(v_state->'settings'->>'language', 'en') = 'ar' then 'مصروف من الناطور' else 'Concierge added an expense' end,
    trim(p_entry->>'description') || ' — $' || trim(to_char(v_amount_usd, 'FM999999990.00')));
  return v_id;
end;
$$;

-- public.concierge_save_readings (was phase2i-v166.sql)
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
  select state into v_state from public.building_state where id = public.my_building() for update;
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
    if nullif(v_val->>'photoPath', '') is not null and public.local_path(v_val->>'photoPath') not like 'concierge/%' then
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
  update public.building_state set state = public.touch_state_meta(v_state), rev = rev + 1, updated_at = now() where id = public.my_building();
  perform public.enqueue_push('admins', null,
    case when coalesce(v_state->'settings'->>'language', 'en') = 'ar' then 'قراءات العدادات' else 'Meter readings entered' end,
    case when coalesce(v_state->'settings'->>'language', 'en') = 'ar' then 'أدخل الناطور قراءات ' else 'The concierge entered the readings for ' end || left(p_month, 7));
end;
$$;

-- public.concierge_report_issue (was phase2i-v166.sql)
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
  if p_photo_path is not null and public.local_path(p_photo_path) not like 'concierge/%' then raise exception 'Photo must be one of your own uploads'; end if;
  v_issue := jsonb_build_object('id', 'iss-' || encode(gen_random_bytes(6), 'hex'), 'tenantId', null, 'title', trim(p_title),
    'details', coalesce(p_details, ''), 'status', 'open', 'createdAt', v_now, 'updatedAt', v_now, 'reportedBy', 'concierge');
  if p_photo_path is not null then
    v_issue := v_issue || jsonb_build_object('photo', jsonb_build_object('storagePath', p_photo_path, 'fileName', 'problem.jpg', 'mimeType', 'image/jpeg'));
  end if;
  update public.building_state
     set state = public.touch_state_meta(jsonb_set(state, '{issues}', coalesce(state->'issues', '[]'::jsonb) || v_issue, true)),
         rev = rev + 1, updated_at = now()
   where id = public.my_building()
  returning state into v_state;
  perform public.enqueue_push('admins', null,
    case when coalesce(v_state->'settings'->>'language', 'en') = 'ar' then 'مشكلة من الناطور' else 'Concierge reported a problem' end, trim(p_title));
end;
$$;

-- public.reply_issue (was phase2i-v166.sql)
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
       (v_me is not null and public.local_path(p_photo_path) like 'issues/' || v_me || '/%')
       or (v_concierge and public.local_path(p_photo_path) like 'concierge/%')) then
    raise exception 'Photo must be one of your own uploads';
  end if;
  select state into v_state from public.building_state where id = public.my_building() for update;
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
   where id = public.my_building();
  perform public.enqueue_push('admins', null,
    case when coalesce(v_state->'settings'->>'language', 'en') = 'ar' then 'رد على مشكلة' else 'Reply on a problem' end,
    (v_issue->>'title') || ': ' || left(trim(coalesce(p_text, '')), 120));
end;
$$;

-- public.set_directory_optin (was phase2i-v166.sql)
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

-- public.mark_notice_seen (was phase2i-v166.sql)
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
  select state into v_state from public.building_state where id = public.my_building() for update;
  v_idx := public.state_index(v_state, 'announcements', p_notice_id);
  if v_idx is null then return; end if;
  v_seen := coalesce(v_state->'announcements'->v_idx->'seenBy', '[]'::jsonb);
  if v_seen ? v_me then return; end if;
  update public.building_state
     set state = public.touch_state_meta(jsonb_set(state, array['announcements', v_idx::text, 'seenBy'], v_seen || to_jsonb(v_me), true)),
         rev = rev + 1, updated_at = now()
   where id = public.my_building();
end;
$$;

-- public.send_due_notices (was phase2i-v166.sql)
create or replace function public.send_due_notices_one()
returns int
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_state jsonb;
  v_n jsonb;
  v_idx int;
  v_sent int := 0;
begin
  select state into v_state from public.building_state where id = public.my_building() for update;
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
    update public.building_state set state = public.touch_state_meta(v_state), rev = rev + 1, updated_at = now() where id = public.my_building();
  end if;
  return v_sent;
end;
$$;

-- public.send_late_reminders (was phase2j-v167.sql)
create or replace function public.send_late_reminders_one()
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
  select state into v_state from public.building_state where id = public.my_building();
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
  if exists (select 1 from public.late_reminder_log where building_id = public.my_building() and month = v_month) then return 0; end if;
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
  insert into public.late_reminder_log (building_id, month, sent) values (public.my_building(), v_month, v_sent) on conflict (building_id, month) do nothing;
  return v_sent;
end;
$$;

-- public.concierge_tick_task (was phase2j-v167.sql)
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
  select state into v_state from public.building_state where id = public.my_building() for update;
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
  update public.building_state set state = public.touch_state_meta(v_state), rev = rev + 1, updated_at = now() where id = public.my_building();
  return v_done;
end;
$$;

-- public.concierge_adjust_supply (was phase2j-v167.sql)
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
  select state into v_state from public.building_state where id = public.my_building() for update;
  v_idx := public.state_index(v_state, 'supplies', p_supply_id);
  if v_idx is null then raise exception 'Supply not found'; end if;
  v_qty := greatest(0, coalesce(nullif(v_state->'supplies'->v_idx->>'qty', '')::numeric, 0) + p_delta);
  v_state := jsonb_set(v_state, array['supplies', v_idx::text],
    (v_state->'supplies'->v_idx) || jsonb_build_object('qty', v_qty, 'updatedAt', public.now_iso()));
  update public.building_state set state = public.touch_state_meta(v_state), rev = rev + 1, updated_at = now() where id = public.my_building();
  if coalesce(nullif(v_state->'supplies'->v_idx->>'lowAt', '')::numeric, 0) > 0
     and v_qty <= (v_state->'supplies'->v_idx->>'lowAt')::numeric and p_delta < 0 then
    perform public.enqueue_push('admins', null,
      case when coalesce(v_state->'settings'->>'language', 'en') = 'ar' then 'لوازم على وشك النفاد' else 'Running low' end,
      (v_state->'supplies'->v_idx->>'name') || ': ' || v_qty::text);
  end if;
  return v_qty;
end;
$$;

-- public.concierge_log_visitor (was phase2j-v167.sql)
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
  select coalesce(state->'visitorLog', '[]'::jsonb) into v_log from public.building_state where id = public.my_building() for update;
  v_log := v_log || jsonb_build_object('id', 'vis-' || encode(gen_random_bytes(5), 'hex'), 'at', public.now_iso(),
    'name', trim(p_name), 'purpose', coalesce(trim(p_purpose), ''), 'unit', coalesce(trim(p_unit), ''), 'by', 'concierge');
  while jsonb_array_length(v_log) > 400 loop v_log := v_log - 0; end loop;
  update public.building_state
     set state = public.touch_state_meta(jsonb_set(state, '{visitorLog}', v_log, true)), rev = rev + 1, updated_at = now()
   where id = public.my_building();
end;
$$;

-- public.concierge_save_water_readings (was phase2j-v167.sql)
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
  select state into v_state from public.building_state where id = public.my_building() for update;
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
  update public.building_state set state = public.touch_state_meta(v_state), rev = rev + 1, updated_at = now() where id = public.my_building();
  perform public.enqueue_push('admins', null,
    case when coalesce(v_state->'settings'->>'language', 'en') = 'ar' then 'قراءات عدادات المياه' else 'Water meter readings entered' end,
    left(p_month, 7));
end;
$$;

-- public.book_space (was phase2j-v167.sql)
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
  select state into v_state from public.building_state where id = public.my_building() for update;
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
   where id = public.my_building();
  return v_id;
end;
$$;

-- public.cancel_my_booking (was phase2j-v167.sql)
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
  select state into v_state from public.building_state where id = public.my_building() for update;
  v_idx := public.state_index(v_state, 'bookings', p_booking_id);
  if v_idx is null or v_state->'bookings'->v_idx->>'tenantId' is distinct from v_me then raise exception 'Booking not found'; end if;
  update public.building_state
     set state = public.touch_state_meta(jsonb_set(state, array['bookings', v_idx::text],
                   (state->'bookings'->v_idx) || jsonb_build_object('status', 'cancelled', 'updatedAt', public.now_iso()))),
         rev = rev + 1, updated_at = now()
   where id = public.my_building();
end;
$$;

-- public.post_to_board (was phase2j-v167.sql)
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
  if p_photo_path is not null and public.local_path(p_photo_path) not like 'board/' || v_me || '/%' then raise exception 'Photo must be one of your own uploads'; end if;
  select state into v_state from public.building_state where id = public.my_building() for update;
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
   where id = public.my_building();
  perform public.enqueue_push('admins', null,
    case when coalesce(v_state->'settings'->>'language', 'en') = 'ar' then 'منشور بانتظار موافقتك' else 'A post is waiting for your approval' end,
    trim(p_title));
  return v_id;
end;
$$;

-- public.remove_my_post (was phase2j-v167.sql)
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
  select state into v_state from public.building_state where id = public.my_building() for update;
  v_idx := public.state_index(v_state, 'boardPosts', p_post_id);
  if v_idx is null or v_state->'boardPosts'->v_idx->>'tenantId' is distinct from v_me then raise exception 'Post not found'; end if;
  update public.building_state
     set state = public.touch_state_meta(jsonb_set(state, array['boardPosts', v_idx::text],
                   (state->'boardPosts'->v_idx) || jsonb_build_object('status', 'removed', 'updatedAt', public.now_iso()))),
         rev = rev + 1, updated_at = now()
   where id = public.my_building();
end;
$$;

-- public.update_my_details (was phase2j-v167.sql)
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

-- public.mark_month_checked (was phase2j-v167.sql)
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
  select coalesce(state->'monthChecks', '[]'::jsonb) into v_checks from public.building_state where id = public.my_building() for update;
  v_checks := v_checks || jsonb_build_object('id', p_id, 'month', p_month, 'fingerprint', coalesce(p_fingerprint, ''),
    'by', coalesce(nullif(auth.jwt()->>'email', ''), 'admin'), 'at', public.now_iso());
  while jsonb_array_length(v_checks) > 500 loop v_checks := v_checks - 0; end loop;
  update public.building_state
     set state = public.touch_state_meta(jsonb_set(state, '{monthChecks}', v_checks, true)), rev = rev + 1, updated_at = now()
   where id = public.my_building();
end;
$$;

-- public.approve_expense (was phase2j-v167.sql)
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
  select state into v_state from public.building_state where id = public.my_building() for update;
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
  update public.building_state set state = public.touch_state_meta(v_state), rev = rev + 1, updated_at = now() where id = public.my_building();
  perform public.enqueue_push('admins', null,
    case when coalesce(p_approve, false) then 'Expense approved' else 'Expense rejected' end,
    coalesce(v_item->>'description', '') || ' — $' || trim(to_char(coalesce(nullif(v_item->>'amountUsd', '')::numeric, 0), 'FM999999990.00')));
end;
$$;

-- ── Scheduled jobs: run once per building ──

create or replace function public.send_monthly_balances()
returns int
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_id text;
  v_sent int := 0;
begin
  -- Every building with a manager, one at a time; one failing building
  -- doesn't stop the others.
  for v_id in select id from public.building_state b
               where b.id = 'building' or exists (select 1 from public.memberships m where m.building_id = b.id and m.role = 'owner')
               order by id loop
    begin
      perform set_config('app.building', v_id, true);
      v_sent := v_sent + coalesce(public.send_monthly_balances_one(), 0);
    exception when others then
      raise warning 'send_monthly_balances: building % failed: %', v_id, sqlerrm;
    end;
  end loop;
  perform set_config('app.building', '', true);
  return v_sent;
end;
$$;
revoke all on function public.send_monthly_balances_one() from public, anon, authenticated;

create or replace function public.send_due_notices()
returns int
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_id text;
  v_sent int := 0;
begin
  -- Every building with a manager, one at a time; one failing building
  -- doesn't stop the others.
  for v_id in select id from public.building_state b
               where b.id = 'building' or exists (select 1 from public.memberships m where m.building_id = b.id and m.role = 'owner')
               order by id loop
    begin
      perform set_config('app.building', v_id, true);
      v_sent := v_sent + coalesce(public.send_due_notices_one(), 0);
    exception when others then
      raise warning 'send_due_notices: building % failed: %', v_id, sqlerrm;
    end;
  end loop;
  perform set_config('app.building', '', true);
  return v_sent;
end;
$$;
revoke all on function public.send_due_notices_one() from public, anon, authenticated;

create or replace function public.send_late_reminders()
returns int
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_id text;
  v_sent int := 0;
begin
  -- Every building with a manager, one at a time; one failing building
  -- doesn't stop the others.
  for v_id in select id from public.building_state b
               where b.id = 'building' or exists (select 1 from public.memberships m where m.building_id = b.id and m.role = 'owner')
               order by id loop
    begin
      perform set_config('app.building', v_id, true);
      v_sent := v_sent + coalesce(public.send_late_reminders_one(), 0);
    exception when others then
      raise warning 'send_late_reminders: building % failed: %', v_id, sqlerrm;
    end;
  end loop;
  perform set_config('app.building', '', true);
  return v_sent;
end;
$$;
revoke all on function public.send_late_reminders_one() from public, anon, authenticated;

-- ── Photos: new buildings keep theirs under b/<building id>/ ──

drop policy if exists "owner upload invoices" on storage.objects;
create policy "owner upload invoices"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'invoices' and public.photo_role(name) = 'owner');

drop policy if exists "owner read invoices" on storage.objects;
create policy "owner read invoices"
  on storage.objects for select to authenticated
  using (bucket_id = 'invoices' and public.photo_role(name) = 'owner');

drop policy if exists "owner delete invoices" on storage.objects;
create policy "owner delete invoices"
  on storage.objects for delete to authenticated
  using (bucket_id = 'invoices' and public.photo_role(name) = 'owner');

drop policy if exists "member read invoices" on storage.objects;
create policy "member read invoices"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'invoices'
    and (
      public.photo_role(name) = 'owner'
      or public.photo_role(name) = 'viewer'
      or (public.photo_role(name) = 'concierge' and (public.photo_rest(name) like 'concierge/%' or public.photo_rest(name) like 'issues/%'))
      or (
        public.photo_tenant(name) is not null
        and (
          (public.photo_rest(name) not like 'proofs/%' and public.photo_rest(name) not like 'issues/%' and public.photo_rest(name) not like 'documents/%' and public.photo_rest(name) not like 'concierge/%')
          or public.photo_rest(name) ~ '^concierge/[0-9]{4}/'
          or public.photo_rest(name) like 'proofs/' || public.photo_tenant(name) || '/%'
          or public.photo_rest(name) like 'issues/' || public.photo_tenant(name) || '/%'
          or public.photo_rest(name) like 'issues/building/%'
        )
      )
    )
  );

drop policy if exists "tenant upload own proofs" on storage.objects;
create policy "tenant upload own proofs"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'invoices'
    and public.photo_tenant(name) is not null
    and public.photo_rest(name) like 'proofs/' || public.photo_tenant(name) || '/%'
  );

drop policy if exists "tenant upload own issue photos" on storage.objects;
create policy "tenant upload own issue photos"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'invoices'
    and public.photo_tenant(name) is not null
    and public.photo_rest(name) like 'issues/' || public.photo_tenant(name) || '/%'
  );

drop policy if exists "concierge upload photos" on storage.objects;
create policy "concierge upload photos"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'invoices' and public.photo_role(name) = 'concierge' and public.photo_rest(name) like 'concierge/%');

drop policy if exists "tenant upload own board photos" on storage.objects;
create policy "tenant upload own board photos"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'invoices' and public.photo_tenant(name) is not null and public.photo_rest(name) like 'board/' || public.photo_tenant(name) || '/%');


-- ── Who may call what ────────────────────────────────────────────────────────
revoke all on function public.my_building()          from public, anon;
revoke all on function public.role_in(text)          from public, anon;
revoke all on function public.photo_role(text)       from public, anon;
revoke all on function public.photo_tenant(text)     from public, anon;
revoke all on function public.local_path(text)       from public, anon;
revoke all on function public.my_buildings()         from public, anon;
revoke all on function public.create_building(text)  from public, anon;
grant execute on function public.my_building()         to authenticated;
grant execute on function public.role_in(text)         to authenticated;
grant execute on function public.photo_building(text)  to authenticated;
grant execute on function public.photo_rest(text)      to authenticated;
grant execute on function public.photo_role(text)      to authenticated;
grant execute on function public.photo_tenant(text)    to authenticated;
grant execute on function public.local_path(text)      to authenticated;
grant execute on function public.my_buildings()        to authenticated;
grant execute on function public.create_building(text) to authenticated;
