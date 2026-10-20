-- Phase 2h — v157/v158
--
--   * list_tenant_links(): for the owner, which tenants have linked a phone and
--     turned on notifications (counts only, no identities)
--   * get_my_state(): also strips the owner-only documents list, the supplier
--     book and each tenant's private unit details
--   * photos: tenants can no longer read files under documents/
--
-- Run in: Supabase dashboard -> SQL Editor -> New query -> paste -> Run.
-- Safe to re-run. Needs phase2g.

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
      from public.profiles p
      join auth.users u on u.id = p.auth_user_id
      left join public.push_subscriptions s on s.auth_user_id = p.auth_user_id
     where p.role = 'tenant'
       and (u.banned_until is null or u.banned_until < now())
     group by p.tenant_id;
end;
$$;
revoke all on function public.list_tenant_links() from public, anon;
grant execute on function public.list_tenant_links() to authenticated;

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
  v_state := v_orig - 'auditLog' - 'cashChecks' - 'balanceSnapshot' - 'documents' - 'suppliers';

  v_state := jsonb_set(v_state, '{tenants}', coalesce((
    select jsonb_agg(t - 'pinHash' - 'details') from jsonb_array_elements(coalesce(v_orig->'tenants', '[]'::jsonb)) t
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
          (name not like 'proofs/%' and name not like 'issues/%' and name not like 'documents/%')
          or name like 'proofs/' || public.my_tenant_id() || '/%'
          or name like 'issues/' || public.my_tenant_id() || '/%'
          or name like 'issues/building/%'
        )
      )
    )
  );
