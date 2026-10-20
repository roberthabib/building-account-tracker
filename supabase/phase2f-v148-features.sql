-- Phase 2f — server side of the v148 features
--
--   * extra administrators: a second full owner, or a view-only "viewer"
--   * tenants report problems (with a photo) and see only their own
--   * payment plans and owner-only records never reach tenant phones
--   * polls weighted by ownership share, with a closing date
--   * phone notifications (web push through /api/push on Vercel)
--   * keep-alive watch: the database notices when the keep-alive stops
--
-- Run in: Supabase dashboard -> SQL Editor -> New query -> paste -> Run.
-- Safe to re-run. Needs phase2a–2e.

-- ── Roles: owner (full), viewer (sees everything, changes nothing), tenant ──
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('owner', 'tenant', 'viewer'));

create or replace function public.is_viewer()
returns boolean
language sql stable security definer set search_path = public, extensions
as $$
  select coalesce((select role = 'viewer' from public.profiles where auth_user_id = auth.uid()), false);
$$;

create or replace function public.my_admin_role()
returns text
language sql stable security definer set search_path = public, extensions
as $$
  select role from public.profiles where auth_user_id = auth.uid() and role in ('owner', 'viewer');
$$;

drop policy if exists "viewer reads building_state" on public.building_state;
create policy "viewer reads building_state"
  on public.building_state for select to authenticated
  using (public.is_viewer());

-- ── Photos: problem reports next to payment proofs ──────────────────────────
-- Tenants upload only into issues/<own id>/; they read building photos, their
-- own proofs and problem photos, and problems the owner filed for the building.
drop policy if exists "tenant upload own issue photos" on storage.objects;
create policy "tenant upload own issue photos"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'invoices'
    and public.my_tenant_id() is not null
    and name like 'issues/' || public.my_tenant_id() || '/%'
  );

drop policy if exists "member read invoices" on storage.objects;
create policy "member read invoices"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'invoices'
    and (
      public.is_owner()
      or public.is_viewer()
      or (
        public.my_tenant_id() is not null
        and (
          (name not like 'proofs/%' and name not like 'issues/%')
          or name like 'proofs/' || public.my_tenant_id() || '/%'
          or name like 'issues/' || public.my_tenant_id() || '/%'
          or name like 'issues/building/%'
        )
      )
    )
  );

-- ── Phone notifications ─────────────────────────────────────────────────────
-- A job row is created, then pg_net tells /api/push its id. The id is a random
-- uuid known only to the database and that one request, so claim_push_job()
-- can be called with the public key without a shared secret: a caller can
-- only claim a job it was told about, once, within 10 minutes.
create extension if not exists pg_net with schema extensions;

create table if not exists public.push_subscriptions (
  endpoint     text primary key,
  auth_user_id uuid not null references auth.users (id) on delete cascade,
  role         text not null,
  tenant_id    text,
  p256dh       text not null,
  auth         text not null,
  created_at   timestamptz not null default now()
);
alter table public.push_subscriptions enable row level security;
-- No policies: only the security-definer functions below touch it.

create table if not exists public.push_jobs (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  target     text not null check (target in ('admins', 'tenants')),
  tenant_id  text,
  title      text not null,
  body       text not null,
  taken_at   timestamptz
);
alter table public.push_jobs enable row level security;

create or replace function public.save_push_subscription(p_endpoint text, p_p256dh text, p_auth text)
returns void
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_role text;
  v_tenant text;
begin
  select role, tenant_id into v_role, v_tenant from public.profiles where auth_user_id = auth.uid();
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

create or replace function public.delete_push_subscription(p_endpoint text)
returns void
language sql security definer set search_path = public, extensions
as $$
  delete from public.push_subscriptions where endpoint = p_endpoint and auth_user_id = auth.uid();
$$;

-- Internal: queue a notification. Never granted to clients.
create or replace function public.enqueue_push(p_target text, p_tenant_id text, p_title text, p_body text)
returns void
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_id uuid;
begin
  if not exists (
    select 1 from public.push_subscriptions s
     where (p_target = 'admins' and s.role in ('owner', 'viewer'))
        or (p_target = 'tenants' and s.role = 'tenant' and (p_tenant_id is null or s.tenant_id = p_tenant_id))
  ) then
    return;
  end if;
  insert into public.push_jobs (target, tenant_id, title, body)
       values (p_target, p_tenant_id, left(p_title, 120), left(p_body, 400))
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
begin
  update public.push_jobs set taken_at = now()
   where id = p_job and taken_at is null and created_at > now() - interval '10 minutes'
  returning * into v_job;
  if v_job.id is null then return null; end if;
  select coalesce(jsonb_agg(jsonb_build_object('endpoint', s.endpoint,
                                               'keys', jsonb_build_object('p256dh', s.p256dh, 'auth', s.auth))), '[]'::jsonb)
    into v_subs
    from public.push_subscriptions s
   where (v_job.target = 'admins' and s.role in ('owner', 'viewer'))
      or (v_job.target = 'tenants' and s.role = 'tenant' and (v_job.tenant_id is null or s.tenant_id = v_job.tenant_id));
  return jsonb_build_object('title', v_job.title, 'body', v_job.body, 'subscriptions', v_subs);
end;
$$;

-- Push services answer 404/410 for phones that unsubscribed; /api/push then
-- drops that endpoint, but only while holding a job it just claimed.
create or replace function public.forget_push_endpoint(p_job uuid, p_endpoint text)
returns void
language plpgsql security definer set search_path = public, extensions
as $$
begin
  if exists (select 1 from public.push_jobs where id = p_job and taken_at > now() - interval '10 minutes') then
    delete from public.push_subscriptions where endpoint = p_endpoint;
  end if;
end;
$$;

create or replace function public.notify_tenants(p_tenant_id text, p_title text, p_body text)
returns void
language plpgsql security definer set search_path = public, extensions
as $$
begin
  if not public.is_owner() then raise exception 'Only the building owner can send notifications'; end if;
  perform public.enqueue_push('tenants', nullif(p_tenant_id, ''), p_title, p_body);
end;
$$;

-- ── Tenant writes: payment declarations and problem reports notify admins ──
create or replace function public.tenant_label(p_state jsonb, p_tenant_id text)
returns text
language sql stable set search_path = public, extensions
as $$
  select coalesce(
    (select case when coalesce(p_state->'settings'->>'language', 'en') = 'ar' then 'الوحدة ' else 'Unit ' end || (t->>'unit')
       from jsonb_array_elements(coalesce(p_state->'tenants', '[]'::jsonb)) t
      where t->>'id' = p_tenant_id and coalesce(t->>'unit', '') <> '' limit 1),
    case when coalesce(p_state->'settings'->>'language', 'en') = 'ar' then 'مستأجر' else 'A tenant' end);
$$;
revoke all on function public.tenant_label(jsonb, text) from public;

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
  if p_proof_path is not null and p_proof_path not like 'proofs/' || v_me || '/%' then
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
   where id = 'building'
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
  if p_photo_path is not null and p_photo_path not like 'issues/' || v_me || '/%' then
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
   where id = 'building'
  returning state into v_state;
  if not found then raise exception 'No building data'; end if;
  v_ar := coalesce(v_state->'settings'->>'language', 'en') = 'ar';
  perform public.enqueue_push('admins', null,
    case when v_ar then 'مشكلة جديدة' else 'Problem reported' end,
    public.tenant_label(v_state, v_me) || ': ' || trim(p_title));
end;
$$;

-- Votes: polls can close on a date.
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
  if p_vote not in ('yes', 'no', 'abstain') then raise exception 'Vote must be yes, no or abstain'; end if;
  select (ord - 1)::int, val into v_idx, v_poll
    from public.building_state,
         jsonb_array_elements(coalesce(state->'polls', '[]'::jsonb)) with ordinality as p(val, ord)
   where id = 'building' and val->>'id' = p_poll_id
   for update of building_state;
  if v_idx is null then raise exception 'Poll not found'; end if;
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

-- ── get_my_state: admins get everything; tenants get their own slice ────────
-- New since phase2c: change history and cash counts are stripped, payment
-- plans and problem reports are cut to the caller's own (plus building-wide
-- problems), and poll counts carry ownership-share totals.
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
  v_state := v_orig - 'auditLog' - 'cashChecks';

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

-- ── Extra administrators ────────────────────────────────────────────────────
create table if not exists public.admin_invites (
  code       text primary key,
  role       text not null check (role in ('owner', 'viewer')),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days'),
  used_at    timestamptz,
  used_by    uuid references auth.users (id) on delete set null
);
alter table public.admin_invites enable row level security;

create or replace function public.create_admin_invite(p_role text)
returns text
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_code text;
begin
  if not public.is_owner() then raise exception 'Only the building owner can invite administrators'; end if;
  if p_role not in ('owner', 'viewer') then raise exception 'Role must be owner or viewer'; end if;
  v_code := substr(translate(upper(encode(gen_random_bytes(24), 'base64')), 'O0I1+/=', 'XYZWQRS'), 1, 10);
  insert into public.admin_invites (code, role, created_by) values (v_code, p_role, auth.uid());
  return v_code;
end;
$$;

-- Accepting needs a real (Google) account, never an anonymous tenant phone.
create or replace function public.claim_admin_invite(p_code text)
returns text
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_row public.admin_invites;
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  if coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) then
    raise exception 'Sign in with Google to accept an administrator invite';
  end if;
  select * into v_row from public.admin_invites where code = upper(trim(p_code)) for update;
  if v_row.code is null then raise exception 'That invite is not valid'; end if;
  if v_row.used_at is not null then raise exception 'That invite has already been used'; end if;
  if v_row.expires_at < now() then raise exception 'That invite has expired'; end if;
  -- Never downgrade an existing full owner through an invite.
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
    select p.auth_user_id, u.email::text, p.role, p.created_at, p.auth_user_id = auth.uid()
      from public.profiles p join auth.users u on u.id = p.auth_user_id
     where p.role in ('owner', 'viewer')
     order by p.created_at;
end;
$$;

-- Removes administrator access (the Google account itself is untouched and
-- can be invited again).
create or replace function public.remove_admin(p_user_id uuid)
returns void
language plpgsql security definer set search_path = public, extensions
as $$
begin
  if not public.is_owner() then raise exception 'Only the building owner can remove administrators'; end if;
  if p_user_id = auth.uid() then raise exception 'You cannot remove your own access'; end if;
  delete from public.profiles where auth_user_id = p_user_id and role in ('owner', 'viewer');
  delete from public.push_subscriptions where auth_user_id = p_user_id;
end;
$$;

-- ── Keep-alive watch ────────────────────────────────────────────────────────
create table if not exists public.keepalive_log (
  id      int primary key default 1 check (id = 1),
  last_ok timestamptz not null default now()
);
alter table public.keepalive_log enable row level security;
insert into public.keepalive_log (id, last_ok) values (1, now()) on conflict (id) do nothing;

create or replace function public.keepalive()
returns int
language plpgsql volatile security definer set search_path = public
as $$
declare
  v int;
begin
  insert into public.keepalive_log (id, last_ok) values (1, now())
  on conflict (id) do update set last_ok = now();
  select count(*)::int into v from public.building_state;
  return v;
end;
$$;

create or replace function public.keepalive_status()
returns timestamptz
language plpgsql stable security definer set search_path = public
as $$
begin
  if not (public.is_owner() or public.is_viewer()) then raise exception 'Administrators only'; end if;
  return (select last_ok from public.keepalive_log where id = 1);
end;
$$;

create or replace function public.check_keepalive()
returns void
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_last timestamptz;
begin
  select last_ok into v_last from public.keepalive_log where id = 1;
  if v_last is not null and v_last < now() - interval '36 hours' then
    perform public.enqueue_push('admins', null, 'Keep-alive stopped',
      'The database keep-alive has not run since ' || to_char(v_last at time zone 'utc', 'DD Mon HH24:MI')
      || ' UTC. The free database pauses after a week without activity.');
  end if;
end;
$$;
select cron.schedule('keepalive-watch', '0 9 * * *', $$select public.check_keepalive()$$);

-- ── Grants ──────────────────────────────────────────────────────────────────
revoke all on function public.is_viewer() from public, anon;
revoke all on function public.my_admin_role() from public, anon;
revoke all on function public.save_push_subscription(text, text, text) from public, anon;
revoke all on function public.delete_push_subscription(text) from public, anon;
revoke all on function public.enqueue_push(text, text, text, text) from public, anon, authenticated;
revoke all on function public.claim_push_job(uuid) from public;
revoke all on function public.forget_push_endpoint(uuid, text) from public;
revoke all on function public.notify_tenants(text, text, text) from public, anon;
revoke all on function public.declare_my_payment(text, numeric, text) from public, anon;
revoke all on function public.report_issue(text, text, text) from public, anon;
revoke all on function public.cast_my_vote(text, text) from public, anon;
revoke all on function public.get_my_state() from public, anon;
revoke all on function public.create_admin_invite(text) from public, anon;
revoke all on function public.claim_admin_invite(text) from public, anon;
revoke all on function public.list_admins() from public, anon;
revoke all on function public.remove_admin(uuid) from public, anon;
revoke all on function public.keepalive_status() from public, anon;
revoke all on function public.check_keepalive() from public, anon, authenticated;

grant execute on function public.is_viewer()                                to authenticated;
grant execute on function public.my_admin_role()                            to authenticated;
grant execute on function public.save_push_subscription(text, text, text)   to authenticated;
grant execute on function public.delete_push_subscription(text)             to authenticated;
grant execute on function public.claim_push_job(uuid)                       to anon, authenticated;
grant execute on function public.forget_push_endpoint(uuid, text)           to anon, authenticated;
grant execute on function public.notify_tenants(text, text, text)           to authenticated;
grant execute on function public.declare_my_payment(text, numeric, text)    to authenticated;
grant execute on function public.report_issue(text, text, text)             to authenticated;
grant execute on function public.cast_my_vote(text, text)                   to authenticated;
grant execute on function public.get_my_state()                             to authenticated;
grant execute on function public.create_admin_invite(text)                  to authenticated;
grant execute on function public.claim_admin_invite(text)                   to authenticated;
grant execute on function public.list_admins()                              to authenticated;
grant execute on function public.remove_admin(uuid)                         to authenticated;
grant execute on function public.keepalive_status()                         to authenticated;
grant execute on function public.keepalive()                                to anon, authenticated;
