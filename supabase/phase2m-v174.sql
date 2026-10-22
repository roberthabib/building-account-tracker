-- Phase 2m — v174: trusted technicians
--
--   * residents ask the building manager for a technician for a repair in
--     their own flat (plumber, electrician, …), optionally with a photo
--   * the building manager sees the requests of all their buildings, passes
--     each to a technician and the resident is told who will call them
--   * the building manager keeps a private notebook (technicians, jobs,
--     ratings, fees) that belongs to them, not to any building: nobody else
--     can read it and it never appears in a building's accounts
--
-- Run in: Supabase dashboard -> SQL Editor -> New query -> paste -> Run.
-- Safe to re-run. Needs phase2a–2l.

-- ── Residents' requests ──────────────────────────────────────────────────────
create table if not exists public.service_requests (
  id               uuid primary key default gen_random_uuid(),
  building_id      text not null,
  tenant_id        text not null,
  requested_by     uuid references auth.users (id) on delete set null,
  trade            text not null,
  details          text not null,
  photo_path       text,
  status           text not null default 'new' check (status in ('new', 'sent', 'done', 'cancelled')),
  technician_name  text,
  technician_phone text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
alter table public.service_requests enable row level security;
revoke all on public.service_requests from anon, authenticated;
-- No policies: only the functions below touch it.
create index if not exists service_requests_building on public.service_requests (building_id, created_at desc);

-- ── The building manager's own notebook ──────────────────────────────────────
create table if not exists public.manager_books (
  auth_user_id uuid primary key references auth.users (id) on delete cascade,
  data         jsonb not null default '{}'::jsonb,
  rev          int not null default 0,
  updated_at   timestamptz not null default now()
);
alter table public.manager_books enable row level security;
revoke all on public.manager_books from anon, authenticated;

create or replace function public.trade_label(p_trade text, p_ar boolean)
returns text
language sql immutable
as $$
  select case p_trade
    when 'plumber'     then case when p_ar then 'سبّاك' else 'Plumber' end
    when 'electrician' then case when p_ar then 'كهربائي' else 'Electrician' end
    when 'lift'        then case when p_ar then 'فنّي مصعد' else 'Lift technician' end
    when 'generator'   then case when p_ar then 'ميكانيكي مولّدات' else 'Generator mechanic' end
    when 'ac'          then case when p_ar then 'تكييف' else 'Air conditioning' end
    when 'painting'    then case when p_ar then 'دهان وعزل' else 'Painting & waterproofing' end
    when 'carpentry'   then case when p_ar then 'نجّار وأقفال' else 'Carpenter & locksmith' end
    when 'cleaning'    then case when p_ar then 'تنظيف' else 'Cleaning' end
    else case when p_ar then 'فنّي' else 'Technician' end
  end;
$$;

create or replace function public.is_manager_somewhere()
returns boolean
language sql stable security definer set search_path = public, extensions
as $$
  select exists (select 1 from public.memberships where auth_user_id = auth.uid() and role = 'owner');
$$;

-- A resident asks for a technician.
create or replace function public.request_technician(p_trade text, p_details text, p_photo_path text default null)
returns uuid
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_me text := public.my_tenant_id();
  v_b text := public.my_building();
  v_id uuid;
  v_state jsonb;
  v_ar boolean;
begin
  if v_me is null then raise exception 'This device is not linked to a tenant'; end if;
  if p_trade is null or p_trade not in ('plumber', 'electrician', 'lift', 'generator', 'ac', 'painting', 'carpentry', 'cleaning', 'other') then
    raise exception 'Choose what kind of technician you need';
  end if;
  if length(trim(coalesce(p_details, ''))) < 3 then raise exception 'Say what needs fixing'; end if;
  if p_photo_path is not null and public.local_path(p_photo_path) not like 'requests/' || v_me || '/%' then
    raise exception 'Photo must be one of your own uploads';
  end if;
  if (select count(*) from public.service_requests where building_id = v_b and tenant_id = v_me and status = 'new') >= 5 then
    raise exception 'You already have 5 requests waiting. The building manager will answer them first.';
  end if;
  insert into public.service_requests (building_id, tenant_id, requested_by, trade, details, photo_path)
       values (v_b, v_me, auth.uid(), p_trade, left(trim(p_details), 1000), nullif(p_photo_path, ''))
  returning id into v_id;
  select state into v_state from public.building_state where id = v_b;
  v_ar := coalesce(v_state->'settings'->>'language', 'en') = 'ar';
  perform public.enqueue_push('admins', null,
    '🔧 ' || public.trade_label(p_trade, v_ar) || ' — ' || public.tenant_label(v_state, v_me),
    left(trim(p_details), 200));
  return v_id;
end;
$$;

-- A resident's own requests in this building.
create or replace function public.my_service_requests()
returns jsonb
language sql stable security definer set search_path = public, extensions
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
           'id', r.id, 'trade', r.trade, 'details', r.details, 'photoPath', r.photo_path, 'status', r.status,
           'technicianName', r.technician_name, 'technicianPhone', r.technician_phone,
           'createdAt', r.created_at, 'updatedAt', r.updated_at) order by r.created_at desc), '[]'::jsonb)
    from (select * from public.service_requests
           where building_id = public.my_building() and tenant_id = public.my_tenant_id()
           order by created_at desc limit 20) r;
$$;

create or replace function public.cancel_my_request(p_id uuid)
returns void
language plpgsql security definer set search_path = public, extensions
as $$
begin
  update public.service_requests set status = 'cancelled', updated_at = now()
   where id = p_id and building_id = public.my_building() and tenant_id = public.my_tenant_id()
     and status in ('new', 'sent');
  if not found then raise exception 'That request can no longer be cancelled'; end if;
end;
$$;

-- The building manager: requests from every building they manage.
create or replace function public.list_service_requests(p_days int default 120)
returns jsonb
language plpgsql stable security definer set search_path = public, extensions
as $$
begin
  if not public.is_manager_somewhere() then raise exception 'Only the building manager can see technician requests'; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
             'id', r.id, 'buildingId', r.building_id,
             'buildingName', coalesce(nullif(b.state->'building'->>'name', ''), r.building_id),
             'tenantId', r.tenant_id, 'tenantName', t->>'name', 'unit', t->>'unit', 'phone', t->>'phone',
             'trade', r.trade, 'details', r.details, 'photoPath', r.photo_path, 'status', r.status,
             'technicianName', r.technician_name, 'technicianPhone', r.technician_phone,
             'createdAt', r.created_at, 'updatedAt', r.updated_at) order by r.created_at desc)
      from public.service_requests r
      join public.memberships m on m.building_id = r.building_id and m.auth_user_id = auth.uid() and m.role = 'owner'
      left join public.building_state b on b.id = r.building_id
      left join lateral (select x from jsonb_array_elements(coalesce(b.state->'tenants', '[]'::jsonb)) x
                          where x->>'id' = r.tenant_id limit 1) tt(t) on true
     where r.created_at > now() - make_interval(days => greatest(1, least(coalesce(p_days, 120), 730)))), '[]'::jsonb);
end;
$$;

create or replace function public.update_service_request(p_id uuid, p_status text, p_technician_name text default null, p_technician_phone text default null)
returns void
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_req public.service_requests;
  v_state jsonb;
  v_lang text;
  v_name text := nullif(left(trim(coalesce(p_technician_name, '')), 80), '');
  v_phone text := nullif(left(trim(coalesce(p_technician_phone, '')), 40), '');
begin
  select * into v_req from public.service_requests where id = p_id for update;
  if v_req.id is null then raise exception 'That request no longer exists'; end if;
  if not exists (select 1 from public.memberships where auth_user_id = auth.uid() and building_id = v_req.building_id and role = 'owner') then
    raise exception 'Only the building manager can update technician requests';
  end if;
  if p_status not in ('new', 'sent', 'done', 'cancelled') then raise exception 'Unknown status'; end if;
  if p_status = 'sent' and v_name is null then raise exception 'Say which technician'; end if;
  update public.service_requests
     set status = p_status,
         technician_name = coalesce(v_name, technician_name),
         technician_phone = coalesce(v_phone, technician_phone),
         updated_at = now()
   where id = p_id;
  -- Tell the resident who will call them.
  if p_status = 'sent' and (v_req.status <> 'sent' or v_req.technician_name is distinct from v_name) then
    select state into v_state from public.building_state where id = v_req.building_id;
    select coalesce(nullif(t->>'language', ''), v_state->'settings'->>'language', 'en') into v_lang
      from jsonb_array_elements(coalesce(v_state->'tenants', '[]'::jsonb)) t where t->>'id' = v_req.tenant_id;
    perform set_config('app.building', v_req.building_id, true);
    perform public.enqueue_push('tenants', v_req.tenant_id,
      '🔧 ' || public.trade_label(v_req.trade, coalesce(v_lang, 'en') = 'ar'),
      case when coalesce(v_lang, 'en') = 'ar'
        then v_name || ' سيتواصل معك' || coalesce(' (' || v_phone || ')', '') || '.'
        else v_name || ' will contact you' || coalesce(' (' || v_phone || ')', '') || '.'
      end);
    perform set_config('app.building', '', true);
  end if;
end;
$$;

create or replace function public.get_manager_book()
returns jsonb
language plpgsql stable security definer set search_path = public, extensions
as $$
declare
  v jsonb;
begin
  if not public.is_manager_somewhere() then raise exception 'Only the building manager has a technicians notebook'; end if;
  select jsonb_build_object('data', data, 'rev', rev) into v from public.manager_books where auth_user_id = auth.uid();
  return coalesce(v, jsonb_build_object('data', '{}'::jsonb, 'rev', 0));
end;
$$;

-- Saves the whole notebook; p_rev must be the version this phone last read,
-- so two phones can't silently overwrite each other.
create or replace function public.save_manager_book(p_data jsonb, p_rev int)
returns int
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_rev int;
begin
  if not public.is_manager_somewhere() then raise exception 'Only the building manager has a technicians notebook'; end if;
  if p_data is null or jsonb_typeof(p_data) <> 'object' then raise exception 'Nothing to save'; end if;
  if pg_column_size(p_data) > 2000000 then raise exception 'The notebook is too big'; end if;
  select rev into v_rev from public.manager_books where auth_user_id = auth.uid() for update;
  if v_rev is null then
    insert into public.manager_books (auth_user_id, data, rev) values (auth.uid(), p_data, 1);
    return 1;
  end if;
  if v_rev <> coalesce(p_rev, -1) then raise exception 'changed-elsewhere'; end if;
  update public.manager_books set data = p_data, rev = v_rev + 1, updated_at = now() where auth_user_id = auth.uid();
  return v_rev + 1;
end;
$$;

-- ── Photos of a request: the resident uploads, only they and the manager see ─
drop policy if exists "tenant upload own request photos" on storage.objects;
create policy "tenant upload own request photos"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'invoices'
    and public.photo_tenant(name) is not null
    and public.photo_rest(name) like 'requests/' || public.photo_tenant(name) || '/%'
  );

drop policy if exists "member read invoices" on storage.objects;
create policy "member read invoices"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'invoices'
    and (
      public.photo_role(name) = 'owner'
      or (public.photo_role(name) = 'viewer' and public.photo_rest(name) not like 'requests/%')
      or (public.photo_role(name) = 'concierge' and (public.photo_rest(name) like 'concierge/%' or public.photo_rest(name) like 'issues/%'))
      or (
        public.photo_tenant(name) is not null
        and (
          (public.photo_rest(name) not like 'proofs/%' and public.photo_rest(name) not like 'issues/%' and public.photo_rest(name) not like 'documents/%'
           and public.photo_rest(name) not like 'concierge/%' and public.photo_rest(name) not like 'requests/%')
          or public.photo_rest(name) ~ '^concierge/[0-9]{4}/'
          or public.photo_rest(name) like 'proofs/' || public.photo_tenant(name) || '/%'
          or public.photo_rest(name) like 'issues/' || public.photo_tenant(name) || '/%'
          or public.photo_rest(name) like 'issues/building/%'
          or public.photo_rest(name) like 'requests/' || public.photo_tenant(name) || '/%'
        )
      )
    )
  );

-- ── Who may call what ────────────────────────────────────────────────────────
revoke all on function public.trade_label(text, boolean)                  from public, anon, authenticated;
revoke all on function public.is_manager_somewhere()                       from public, anon;
revoke all on function public.request_technician(text, text, text)        from public, anon;
revoke all on function public.my_service_requests()                        from public, anon;
revoke all on function public.cancel_my_request(uuid)                      from public, anon;
revoke all on function public.list_service_requests(int)                   from public, anon;
revoke all on function public.update_service_request(uuid, text, text, text) from public, anon;
revoke all on function public.get_manager_book()                           from public, anon;
revoke all on function public.save_manager_book(jsonb, int)                from public, anon;
grant execute on function public.is_manager_somewhere()                       to authenticated;
grant execute on function public.request_technician(text, text, text)        to authenticated;
grant execute on function public.my_service_requests()                        to authenticated;
grant execute on function public.cancel_my_request(uuid)                      to authenticated;
grant execute on function public.list_service_requests(int)                   to authenticated;
grant execute on function public.update_service_request(uuid, text, text, text) to authenticated;
grant execute on function public.get_manager_book()                           to authenticated;
grant execute on function public.save_manager_book(jsonb, int)                to authenticated;
