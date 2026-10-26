-- Phase 2x — v212: the database refuses a cut-down copy as the building
--
--   * a resident's, renter's or concierge's phone receives a cut-down copy of
--     the building (get_my_state adds a "redaction" marker to it). On
--     2026-10-24 such a copy was uploaded as the whole building from a phone
--     that had been linked as the concierge and then signed in as the manager
--     (restored from the backup on 2026-10-26)
--   * from now on, saving a building whose state still carries that marker is
--     refused, whatever the phone does (the app itself never uploads one since
--     v212)
--
-- Run in: Supabase dashboard -> SQL Editor -> New query -> paste -> Run.
-- Safe to re-run. Needs phase2a–2w.

create or replace function public.refuse_partial_building_copy()
returns trigger
language plpgsql set search_path = public, extensions
as $$
begin
  if new.state ? 'redaction' then
    raise exception 'This phone holds a resident''s or concierge''s copy of the building, not the whole building. Nothing was saved: open the app as the building manager to load the full copy.';
  end if;
  return new;
end;
$$;

drop trigger if exists refuse_partial_building_copy on public.building_state;
create trigger refuse_partial_building_copy
  before insert or update of state on public.building_state
  for each row execute function public.refuse_partial_building_copy();
