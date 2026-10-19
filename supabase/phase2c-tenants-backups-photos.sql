-- Phase 2c — tenant app support, daily backups, private invoice photos
--
-- ADDITIVE: nothing here removes the shared-key (anon) access the live app
-- still uses. That is step 7, in phase2d-lockdown.sql. Safe to re-run.
--
-- Run in: Supabase dashboard -> SQL Editor -> New query -> paste -> Run.

-- ── Shared helper: mark the document as changed ─────────────────────────────
-- Owner devices only merge when the document's meta.token differs from the
-- one they last synced. Every server-side write MUST rotate it (and bump
-- updatedAt) or an owner's next save would silently overwrite the change.
create or replace function public.touch_state_meta(p_state jsonb)
returns jsonb
language sql volatile set search_path = public, extensions
as $$
  select jsonb_set(
           jsonb_set(
             jsonb_set(p_state, '{meta,token}', to_jsonb('srv-' || encode(gen_random_bytes(8), 'hex')), true),
             '{meta,updatedAt}', to_jsonb(to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')), true),
           '{meta,rev}', to_jsonb(coalesce((p_state->'meta'->>'rev')::bigint, 0) + 1), true);
$$;
revoke all on function public.touch_state_meta(jsonb) from public;

-- ── get_my_state: same redaction + building totals for share fallbacks ──────
-- Expenses recorded without a saved share split are divided by coefficient
-- across ALL active tenants. A tenant only receives their own row, so the
-- app needs the building-wide totals to do that division correctly.
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
  if public.is_owner() then
    return v_orig;
  end if;
  v_me := public.my_tenant_id();
  if v_me is null then
    raise exception 'This device is not linked to a tenant yet';
  end if;
  v_state := v_orig;

  v_state := jsonb_set(v_state, '{tenants}', coalesce((
    select jsonb_agg(t) from jsonb_array_elements(coalesce(v_orig->'tenants', '[]'::jsonb)) t
     where t->>'id' = v_me), '[]'::jsonb));
  -- (pinHash of the caller's own row is local-lock material; strip it anyway)
  v_state := jsonb_set(v_state, '{tenants}', coalesce((
    select jsonb_agg(t - 'pinHash') from jsonb_array_elements(v_state->'tenants') t), '[]'::jsonb));

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

  v_state := jsonb_set(v_state, '{buildingProjects}', coalesce((
    select jsonb_agg(
             case when jsonb_typeof(p->'shares') = 'object'
                  then jsonb_set(p, '{shares}',
                         case when p->'shares' ? v_me then jsonb_build_object(v_me, p->'shares'->v_me) else '{}'::jsonb end)
                  else p end)
      from jsonb_array_elements(coalesce(v_orig->'buildingProjects', '[]'::jsonb)) p), '[]'::jsonb));

  -- Poll votes: keep the caller's own vote and anonymous counts only.
  v_state := jsonb_set(v_state, '{polls}', coalesce((
    select jsonb_agg(
             (p - 'votes')
             || jsonb_build_object('votes', case when p->'votes' ? v_me then jsonb_build_object(v_me, p->'votes'->v_me) else '{}'::jsonb end)
             || jsonb_build_object('voteCounts', jsonb_build_object(
                  'yes',     (select count(*) from jsonb_each_text(coalesce(p->'votes', '{}'::jsonb)) v where v.value = 'yes'),
                  'no',      (select count(*) from jsonb_each_text(coalesce(p->'votes', '{}'::jsonb)) v where v.value = 'no'),
                  'abstain', (select count(*) from jsonb_each_text(coalesce(p->'votes', '{}'::jsonb)) v where v.value = 'abstain'))))
      from jsonb_array_elements(coalesce(v_orig->'polls', '[]'::jsonb)) p), '[]'::jsonb));

  v_state := jsonb_set(v_state, '{settings}',
    (coalesce(v_state->'settings', '{}'::jsonb)
       - 'ownerPasswordHash' - 'syncSecret' - 'invoiceUploadUrl'
       - 'cloudSpreadsheetId' - 'invoiceUploadFolderId'
       - 'supabaseUrl' - 'supabaseAnonKey'));

  -- Building-wide totals for the coefficient fallback (aggregates only).
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

-- ── Tenant writes (now rotating the sync token) ─────────────────────────────
create or replace function public.declare_my_payment(p_month text, p_amount numeric)
returns void
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_me text := public.my_tenant_id();
  v_decl jsonb;
begin
  if v_me is null then raise exception 'This device is not linked to a tenant'; end if;
  if p_month !~ '^\d{4}-\d{2}-\d{2}$' then raise exception 'Month must look like YYYY-MM-01'; end if;
  if p_amount is null or p_amount <= 0 or p_amount > 1000000 then raise exception 'Amount out of range'; end if;
  v_decl := jsonb_build_object(
    'id', 'decl-' || encode(gen_random_bytes(6), 'hex'), 'tenantId', v_me, 'month', p_month,
    'amount', p_amount, 'status', 'pending',
    'declaredAt', to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'));
  update public.building_state
     set state = public.touch_state_meta(jsonb_set(state, '{paymentDeclarations}',
                   coalesce(state->'paymentDeclarations', '[]'::jsonb) || v_decl, true)),
         rev = rev + 1, updated_at = now()
   where id = 'building';
  if not found then raise exception 'No building data'; end if;
end;
$$;

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
  update public.building_state
     set state = public.touch_state_meta(jsonb_set(state, array['polls', v_idx::text, 'votes'],
                   coalesce(v_poll->'votes', '{}'::jsonb) || jsonb_build_object(v_me, p_vote), true)),
         rev = rev + 1, updated_at = now()
   where id = 'building';
end;
$$;

-- ── Keep-alive that survives step 7 ─────────────────────────────────────────
-- A real query (so it counts as database activity) that returns nothing
-- sensitive. The Vercel cron calls this instead of reading the document.
create or replace function public.keepalive()
returns int
language sql stable security definer set search_path = public
as $$ select count(*)::int from public.building_state; $$;

-- ── Daily backups (Supabase free plan keeps none you can download) ──────────
create table if not exists public.building_backups (
  day        date primary key,
  state      jsonb not null,
  rev        bigint,
  created_at timestamptz not null default now()
);
alter table public.building_backups enable row level security;
-- No policies: only the security-definer functions below touch it.

create or replace function public.snapshot_building()
returns void
language plpgsql security definer set search_path = public
as $$
declare v_state jsonb; v_rev bigint;
begin
  select state, rev into v_state, v_rev from public.building_state where id = 'building';
  -- Never let an empty or wiped document overwrite a real snapshot.
  if v_state is null
     or jsonb_array_length(coalesce(v_state->'tenants', '[]'::jsonb))
      + jsonb_array_length(coalesce(v_state->'transactions', '[]'::jsonb)) = 0 then
    return;
  end if;
  insert into public.building_backups (day, state, rev) values (current_date, v_state, v_rev)
  on conflict (day) do update set state = excluded.state, rev = excluded.rev, created_at = now();
  delete from public.building_backups where day < current_date - 60;
end;
$$;
revoke all on function public.snapshot_building() from public;

create or replace function public.list_backups()
returns table (day date, tenants int, transactions int, rev bigint, created_at timestamptz)
language plpgsql stable security definer set search_path = public
as $$
begin
  if not public.is_owner() then raise exception 'Only the building owner can see backups'; end if;
  return query
    select b.day,
           jsonb_array_length(coalesce(b.state->'tenants', '[]'::jsonb)),
           jsonb_array_length(coalesce(b.state->'transactions', '[]'::jsonb)),
           b.rev, b.created_at
      from public.building_backups b order by b.day desc;
end;
$$;

create or replace function public.get_backup(p_day date)
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare v jsonb;
begin
  if not public.is_owner() then raise exception 'Only the building owner can restore backups'; end if;
  select state into v from public.building_backups where day = p_day;
  if v is null then raise exception 'No backup for that day'; end if;
  return v;
end;
$$;

create extension if not exists pg_cron with schema pg_catalog;
select cron.schedule('daily-building-backup', '30 0 * * *', $$select public.snapshot_building()$$);
select public.snapshot_building(); -- take today's snapshot now

-- ── Invoice photos: private bucket, owner deletes, members read ─────────────
-- Making the bucket private means photo links only open through a short-lived
-- signed URL that a signed-in owner or linked tenant asks for.
update storage.buckets set public = false where id = 'invoices';

drop policy if exists "owner delete invoices"  on storage.objects;
drop policy if exists "member read invoices"   on storage.objects;
create policy "owner delete invoices"
  on storage.objects for delete to authenticated
  using (bucket_id = 'invoices' and public.is_owner());
create policy "member read invoices"
  on storage.objects for select to authenticated
  using (bucket_id = 'invoices'
         and exists (select 1 from public.profiles where auth_user_id = auth.uid()));

-- ── Grants ──────────────────────────────────────────────────────────────────
revoke all on function public.cast_my_vote(text, text) from public;
revoke all on function public.declare_my_payment(text, numeric) from public;
revoke all on function public.get_my_state() from public;
revoke all on function public.list_backups() from public;
revoke all on function public.get_backup(date) from public;
revoke all on function public.keepalive() from public;
grant execute on function public.cast_my_vote(text, text)          to authenticated;
grant execute on function public.declare_my_payment(text, numeric) to authenticated;
grant execute on function public.get_my_state()                    to authenticated;
grant execute on function public.list_backups()                    to authenticated;
grant execute on function public.get_backup(date)                  to authenticated;
grant execute on function public.keepalive()                       to anon, authenticated;
