-- Phase 2t — v190: one lease at a time per flat, in the database too
--
--   * save_lease refuses a new lease (or a change of flat or dates) that
--     overlaps another lease of the same flat; a lease starting after the
--     other one ends is fine. Leases that already overlap can still be saved
--     as they are (a payment, ending one) so nothing gets stuck.
--
-- Run in: Supabase dashboard -> SQL Editor -> New query -> paste -> Run.
-- Safe to re-run. Needs phase2a–2s.

-- The last day a lease covers: the day it ended, its end date, or never.
create or replace function public.lease_last(p_data jsonb)
returns text
language sql immutable
as $$
  select case when coalesce(p_data->>'status', 'active') = 'ended'
              then coalesce(nullif(p_data->>'endedOn', ''), nullif(p_data->>'end', ''), p_data->>'start', '0000-00-00')
              else coalesce(nullif(p_data->>'end', ''), '9999-12-31') end;
$$;

create or replace function public.save_lease(p_id text, p_flat_id text, p_data jsonb, p_rev int)
returns int
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_rev int;
  v_building text;
  v_old public.leases;
begin
  if not public.is_owner() then raise exception 'Only the building manager can change rentals'; end if;
  if p_id is null or p_id !~ '^[A-Za-z0-9_-]{4,64}$' then raise exception 'That lease id is not valid'; end if;
  if nullif(trim(coalesce(p_flat_id, '')), '') is null then raise exception 'Choose the flat'; end if;
  if p_data is null or jsonb_typeof(p_data) <> 'object' then raise exception 'Nothing to save'; end if;
  if pg_column_size(p_data) > 1000000 then raise exception 'The lease is too big'; end if;
  select rev, building_id into v_rev, v_building from public.leases where id = p_id for update;
  select * into v_old from public.leases where id = p_id;
  -- One lease at a time per flat: a new lease, or a change of flat, dates or
  -- an ended lease reopened, must not overlap another lease of the flat.
  -- (Saving a lease as it is — a payment, ending it — is always allowed.)
  if v_old.id is null or v_old.flat_id is distinct from p_flat_id
     or coalesce(v_old.data->>'start', '') is distinct from coalesce(p_data->>'start', '')
     or public.lease_last(v_old.data) < public.lease_last(p_data) then
    if exists (select 1 from public.leases l
                where l.building_id = public.my_building() and l.flat_id = p_flat_id and l.id <> p_id
                  and coalesce(l.data->>'start', '') <= public.lease_last(p_data)
                  and coalesce(p_data->>'start', '') <= public.lease_last(l.data)) then
      raise exception 'This flat is already rented for those dates';
    end if;
  end if;
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

revoke all on function public.lease_last(jsonb) from public, anon, authenticated;
revoke all on function public.save_lease(text, text, jsonb, int) from public, anon;
grant execute on function public.save_lease(text, text, jsonb, int) to authenticated;
