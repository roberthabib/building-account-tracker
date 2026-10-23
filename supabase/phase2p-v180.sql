-- Phase 2p — v180: receipts that can be checked
--
--   * every receipt carries a QR code / link to /verify with the building,
--     the receipt number, a random check code stored on the payment
--     (verifyCode) and the amount printed on it
--   * verify_receipt() answers without signing in: valid, changed (the
--     amount is different now), cancelled (the payment was deleted) or not
--     found. It shows the building, the flat, the amount, the date and what
--     the payment was for — never names or phone numbers
--   * cancelled receipts are kept in the building document as
--     voidedReceipts, which residents' phones don't receive
--
-- Run in: Supabase dashboard -> SQL Editor -> New query -> paste -> Run.
-- Safe to re-run. Needs phase2a–2o.

create or replace function public.verify_receipt(p_building text, p_ref text, p_code text, p_amount numeric default null, p_kind text default 'building')
returns jsonb
language plpgsql stable security definer set search_path = public, extensions
as $$
declare
  v_id text := coalesce(nullif(p_building, ''), 'building');
  s jsonb;
  t jsonb;
  v_rate numeric;
  v_total numeric := 0;
  v_n int := 0;
  v_tenant text;
  v_date text;
  v_months text[] := '{}';
  v_project text;
  v_lease public.leases;
  v_unit text;
begin
  if coalesce(p_ref, '') = '' or length(coalesce(p_code, '')) < 8 or length(p_ref) > 80 or length(p_code) > 40 then
    return jsonb_build_object('status', 'not_found');
  end if;
  select b.state into s from public.building_state b where b.id = v_id;
  if s is null then return jsonb_build_object('status', 'not_found'); end if;

  -- Rent receipts: one payment of a lease.
  if p_kind = 'rent' then
    select * into v_lease from public.leases l
     where l.building_id = v_id
       and l.data->'payments' @> jsonb_build_array(jsonb_build_object('id', p_ref, 'verifyCode', p_code));
    if v_lease.id is null then return jsonb_build_object('status', 'not_found'); end if;
    select e into t from jsonb_array_elements(v_lease.data->'payments') e where e->>'id' = p_ref limit 1;
    select x->>'unit' into v_unit from jsonb_array_elements(coalesce(s->'tenants', '[]'::jsonb)) x where x->>'id' = v_lease.flat_id limit 1;
    v_total := round(coalesce(nullif(t->>'amount', '')::numeric, 0), 2);
    return jsonb_build_object(
      'status', case when p_amount is not null and abs(v_total - p_amount) > 0.009 then 'changed' else 'valid' end,
      'kind', 'rent', 'building', s->'building'->>'name', 'unit', v_unit, 'amount', v_total,
      'currency', coalesce(v_lease.data->>'currency', 'USD'), 'date', t->>'date', 'ref', p_ref);
  end if;

  -- Building receipts: every payment carrying this receipt number and code.
  v_rate := coalesce(nullif(coalesce(nullif(s->'settings'->>'lbpPerUsd', '')::numeric, 0), 0), 89500);
  for t in select e from jsonb_array_elements(coalesce(s->'transactions', '[]'::jsonb)) e
            where e->>'receiptRef' = p_ref and e->>'verifyCode' = p_code and e->>'category' = 'Payments'
  loop
    v_n := v_n + 1;
    v_total := v_total + coalesce(nullif(t->>'creditUsd', '')::numeric, 0) - coalesce(nullif(t->>'debitUsd', '')::numeric, 0)
      + (coalesce(nullif(t->>'creditLbp', '')::numeric, 0) - coalesce(nullif(t->>'debitLbp', '')::numeric, 0)) / coalesce(nullif(coalesce(nullif(t->>'lbpRate', '')::numeric, 0), 0), v_rate);
    v_tenant := t->>'tenantId';
    if v_date is null or t->>'date' < v_date then v_date := t->>'date'; end if;
    if coalesce(t->>'project', '') <> '' then
      v_project := t->>'project';
    elsif coalesce(t->>'forMonth', '') <> '' then
      v_months := array_append(v_months, t->>'forMonth');
    end if;
  end loop;
  if v_n > 0 then
    v_total := round(v_total, 2);
    select x->>'unit' into v_unit from jsonb_array_elements(coalesce(s->'tenants', '[]'::jsonb)) x where x->>'id' = v_tenant limit 1;
    return jsonb_build_object(
      'status', case when p_amount is not null and abs(v_total - p_amount) > 0.009 then 'changed' else 'valid' end,
      'kind', 'building', 'building', s->'building'->>'name', 'unit', v_unit, 'amount', v_total, 'currency', 'USD',
      'date', v_date, 'months', (select coalesce(jsonb_agg(m order by m), '[]'::jsonb) from (select distinct unnest(v_months) m) q),
      'project', v_project, 'ref', p_ref);
  end if;

  -- A deleted payment: its receipt was cancelled.
  select e into t from jsonb_array_elements(coalesce(s->'voidedReceipts', '[]'::jsonb)) e
   where e->>'ref' = p_ref and e->>'code' = p_code limit 1;
  if t is not null then
    return jsonb_build_object('status', 'cancelled', 'kind', 'building', 'building', s->'building'->>'name',
      'unit', t->>'unit', 'amount', round(coalesce(nullif(t->>'amountUsd', '')::numeric, 0), 2), 'currency', 'USD', 'at', t->>'at', 'ref', p_ref);
  end if;
  return jsonb_build_object('status', 'not_found');
end;
$$;

-- What a phone loads: as in phase2o, without the cancelled receipts.
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
      'myLease', (v_lease.data - 'fee' - 'payouts' - 'deductions' - 'ownFlat' - 'notes') || jsonb_build_object('id', v_lease.id));
  elsif v_role = 'tenant' then
    v := v || jsonb_build_object('myRentals', coalesce((
      select jsonb_agg((l.data - 'notes') || jsonb_build_object('id', l.id) order by l.created_at)
        from public.leases l
       where l.building_id = public.my_building() and l.flat_id = public.my_tenant_id()
         and coalesce((l.data->>'ownFlat')::boolean, false) = false), '[]'::jsonb));
  end if;
  return v;
end;
$$;

-- ── Who may call what ────────────────────────────────────────────────────────
revoke all on function public.verify_receipt(text, text, text, numeric, text) from public;
grant execute on function public.verify_receipt(text, text, text, numeric, text) to anon, authenticated;
revoke all on function public.get_my_state() from public, anon;
grant execute on function public.get_my_state() to authenticated;
