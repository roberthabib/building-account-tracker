-- Phase 2r — v186: rentals round B — lease documents, inspections, renewals
--
--   * the building manager keeps each lease's documents (signed contract, ID
--     copies, subscriptions) and the move-in / move-out inspections with their
--     photos under leases/<lease id>/ in the photo store
--   * only the manager opens them: view-only helpers, owners' and tenants'
--     phones can't read leases/ files, and their phones don't receive the
--     documents or inspections lists (the manager shares an inspection
--     report as a PDF when needed)
--   * renewals are data on the lease (no database change)
--
-- Run in: Supabase dashboard -> SQL Editor -> New query -> paste -> Run.
-- Safe to re-run. Needs phase2a–2q.

drop policy if exists "member read invoices" on storage.objects;
create policy "member read invoices"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'invoices'
    and (
      public.photo_role(name) = 'owner'
      or (public.photo_role(name) = 'viewer' and public.photo_rest(name) not like 'requests/%' and public.photo_rest(name) not like 'leases/%')
      or (public.photo_role(name) = 'concierge' and (public.photo_rest(name) like 'concierge/%' or public.photo_rest(name) like 'issues/%'))
      or (
        public.photo_tenant(name) is not null
        and (
          (public.photo_rest(name) not like 'proofs/%' and public.photo_rest(name) not like 'issues/%' and public.photo_rest(name) not like 'documents/%'
           and public.photo_rest(name) not like 'concierge/%' and public.photo_rest(name) not like 'requests/%'
           and public.photo_rest(name) not like 'leases/%')
          or public.photo_rest(name) ~ '^concierge/[0-9]{4}/'
          or public.photo_rest(name) like 'proofs/' || public.photo_tenant(name) || '/%'
          or public.photo_rest(name) like 'issues/' || public.photo_tenant(name) || '/%'
          or public.photo_rest(name) like 'issues/building/%'
          or public.photo_rest(name) like 'requests/' || public.photo_tenant(name) || '/%'
        )
      )
    )
  );

-- What a phone loads: as in phase2p, without lease documents and inspections.
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
  if v_role = 'renter' then
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
