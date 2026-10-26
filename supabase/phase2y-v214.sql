-- Phase 2y — v214: the concierge's phone receives only the expenses he entered
--
--   * until now the concierge's copy of the building held every expense and
--     service expense (the app showed them as "Expenses by category" on his
--     dashboard). From now on it holds only the expenses the concierge added
--     himself (enteredBy = 'concierge'); the app no longer shows the month
--     section on his phone either
--
-- Run in: Supabase dashboard -> SQL Editor -> New query -> paste -> Run.
-- Safe to re-run. Needs phase2a–2r.

-- What a phone loads: as in phase2r, and the concierge only gets his own expenses.
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
  v := v - 'voidedReceipts';
  if public.is_concierge() then
    v := jsonb_set(v, '{transactions}', coalesce((select jsonb_agg(x) from jsonb_array_elements(coalesce(v->'transactions', '[]'::jsonb)) x
                                                    where x->>'enteredBy' = 'concierge'), '[]'::jsonb));
  elsif v_role = 'renter' then
    v := v - 'polls' - 'directory' - 'meetings';
    v := jsonb_set(v, '{tenants}', coalesce((select jsonb_agg(t - 'phone' - 'details' - 'pinHash' - 'directory' - 'directoryAt' - 'language' - 'detailsAt' - 'settlement')
                                                from jsonb_array_elements(coalesce(v->'tenants', '[]'::jsonb)) t), '[]'::jsonb));
    v := v || jsonb_build_object('myRole', 'renter',
      'myLease', (v_lease.data - 'fee' - 'payouts' - 'deductions' - 'ownFlat' - 'notes' - 'documents' - 'inspections' - 'schedule') || jsonb_build_object('id', v_lease.id));
  elsif v_role = 'tenant' then
    v := v || jsonb_build_object('myRentals', coalesce((
      select jsonb_agg((l.data - 'notes' - 'documents' - 'inspections' - 'schedule' - 'declarations') || jsonb_build_object('id', l.id) order by l.created_at)
        from public.leases l
       where l.building_id = public.my_building() and l.flat_id = public.my_tenant_id()
         and coalesce((l.data->>'ownFlat')::boolean, false) = false), '[]'::jsonb));
  end if;
  return v;
end;
$$;

revoke all on function public.get_my_state() from public, anon;
grant execute on function public.get_my_state() to authenticated;
