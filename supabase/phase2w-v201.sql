-- Phase 2w — v201: tell a flat's owner when rent is handed over to them
--
--   * notify_flat_owner() lets the building manager send one notification to
--     the phones of a flat's OWNER only (push target 'owner', phase2s) — not
--     to the tenant renting the flat, who must not see what the owner gets
--   * the app calls it after recording a hand-over ("Rent handed over to
--     you"); the receipt is on the owner's phone under "Your rented flat"
--
-- Run in: Supabase dashboard -> SQL Editor -> New query -> paste -> Run.
-- Safe to re-run. Needs phase2a–2v.

create or replace function public.notify_flat_owner(p_tenant_id text, p_title text, p_body text)
returns void
language plpgsql security definer set search_path = public, extensions
as $$
begin
  if not public.is_owner() then raise exception 'Only the building manager can send notifications'; end if;
  if coalesce(p_tenant_id, '') = '' then raise exception 'Choose the flat'; end if;
  if coalesce(trim(p_title), '') = '' or length(p_title) > 120 or length(coalesce(p_body, '')) > 400 then
    raise exception 'The notification is too long';
  end if;
  perform public.enqueue_push('owner', p_tenant_id, p_title, coalesce(p_body, ''));
end;
$$;

revoke all on function public.notify_flat_owner(text, text, text) from public, anon;
grant execute on function public.notify_flat_owner(text, text, text) to authenticated;
