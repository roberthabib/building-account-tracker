-- Phase 2n — v178: rentals (step B — the building manager's tools)
--
--   * a lease per rented flat: the tenant, the rent, the period, the
--     deposit, the rent payments, what was handed over to the flat's owner
--     and the manager's fee
--   * leases are kept apart from the building's document: they never show in
--     the building's cash, reports or backups, and view-only helpers, the
--     concierge and the residents can't read them; only the building's
--     manager (full access) can
--
-- Run in: Supabase dashboard -> SQL Editor -> New query -> paste -> Run.
-- Safe to re-run. Needs phase2a–2m.

create table if not exists public.leases (
  id          text primary key,
  building_id text not null,
  flat_id     text not null,
  data        jsonb not null,
  rev         int not null default 1,
  created_by  uuid references auth.users (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
alter table public.leases enable row level security;
revoke all on public.leases from anon, authenticated;
-- No policies: only the functions below touch it.
create index if not exists leases_building on public.leases (building_id);

create or replace function public.list_leases()
returns jsonb
language plpgsql stable security definer set search_path = public, extensions
as $$
begin
  if not public.is_owner() then raise exception 'Only the building manager can see rentals'; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object('id', l.id, 'flatId', l.flat_id, 'rev', l.rev, 'data', l.data, 'updatedAt', l.updated_at) order by l.created_at)
      from public.leases l
     where l.building_id = public.my_building()), '[]'::jsonb);
end;
$$;

-- Saves one lease; p_rev must be the version this phone last read (0 for a
-- new lease), so two phones can't silently overwrite each other.
create or replace function public.save_lease(p_id text, p_flat_id text, p_data jsonb, p_rev int)
returns int
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_rev int;
  v_building text;
begin
  if not public.is_owner() then raise exception 'Only the building manager can change rentals'; end if;
  if p_id is null or p_id !~ '^[A-Za-z0-9_-]{4,64}$' then raise exception 'That lease id is not valid'; end if;
  if nullif(trim(coalesce(p_flat_id, '')), '') is null then raise exception 'Choose the flat'; end if;
  if p_data is null or jsonb_typeof(p_data) <> 'object' then raise exception 'Nothing to save'; end if;
  if pg_column_size(p_data) > 1000000 then raise exception 'The lease is too big'; end if;
  select rev, building_id into v_rev, v_building from public.leases where id = p_id for update;
  if v_rev is null then
    insert into public.leases (id, building_id, flat_id, data, rev, created_by)
         values (p_id, public.my_building(), p_flat_id, p_data, 1, auth.uid());
    return 1;
  end if;
  if v_building is distinct from public.my_building() then raise exception 'That lease belongs to another building'; end if;
  if v_rev <> coalesce(p_rev, -1) then raise exception 'changed-elsewhere'; end if;
  update public.leases set flat_id = p_flat_id, data = p_data, rev = v_rev + 1, updated_at = now() where id = p_id;
  return v_rev + 1;
end;
$$;

create or replace function public.delete_lease(p_id text)
returns void
language plpgsql security definer set search_path = public, extensions
as $$
begin
  if not public.is_owner() then raise exception 'Only the building manager can change rentals'; end if;
  delete from public.leases where id = p_id and building_id = public.my_building();
  if not found then raise exception 'That lease no longer exists'; end if;
end;
$$;

revoke all on function public.list_leases()                     from public, anon;
revoke all on function public.save_lease(text, text, jsonb, int) from public, anon;
revoke all on function public.delete_lease(text)                 from public, anon;
grant execute on function public.list_leases()                     to authenticated;
grant execute on function public.save_lease(text, text, jsonb, int) to authenticated;
grant execute on function public.delete_lease(text)                 to authenticated;
