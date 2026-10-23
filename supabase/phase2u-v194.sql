-- Phase 2u — v194: a flat can be let again from the day its lease ended
--
--   * an ended lease covers the flat up to the day before it ended, so the
--     next tenant's lease can start on that day (before, the same day counted
--     as an overlap and save_lease refused it)
--
-- Run in: Supabase dashboard -> SQL Editor -> New query -> paste -> Run.
-- Safe to re-run. Needs phase2a–2t.

create or replace function public.lease_last(p_data jsonb)
returns text
language sql immutable
as $$
  select case
    when coalesce(p_data->>'status', 'active') = 'ended' then
      case when coalesce(p_data->>'endedOn', p_data->>'end', '') ~ '^\d{4}-\d{2}-\d{2}$'
           then to_char(coalesce(nullif(p_data->>'endedOn', ''), p_data->>'end')::date - 1, 'YYYY-MM-DD')
           else '0000-00-00' end
    else coalesce(nullif(p_data->>'end', ''), '9999-12-31')
  end;
$$;

revoke all on function public.lease_last(jsonb) from public, anon, authenticated;
