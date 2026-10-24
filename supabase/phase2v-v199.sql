-- Phase 2v — v199: hand-over receipts can be checked
--
--   * the building manager gives the owner a receipt when handing over the
--     rent (one receipt can cover several of the owner's flats); its QR code
--     opens /verify?k=handover
--   * verify_receipt() also answers for those: valid, changed, cancelled (the
--     hand-over was deleted; it stays in the lease with voidedAt) or not
--     found — never names or phone numbers
--   * everything else in verify_receipt is as in phase2p
--
-- Run in: Supabase dashboard -> SQL Editor -> New query -> paste -> Run.
-- Safe to re-run. Needs phase2a–2u.

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
  v_sum numeric;
  v_d text;
  v_units text[] := '{}';
  v_cur text;
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

  -- Hand-over receipts (v199): the payouts to an owner sharing this receipt
  -- number and code, across that owner's flats. A deleted one is kept with
  -- voidedAt: its receipt says cancelled.
  if p_kind = 'handover' then
    for v_lease in select * from public.leases l
                    where l.building_id = v_id
                      and exists (select 1 from jsonb_array_elements(coalesce(l.data->'payouts', '[]'::jsonb)) e
                                   where e->>'receipt' = p_ref and e->>'verifyCode' = p_code)
                    order by l.id
    loop
      select coalesce(sum(coalesce(nullif(e->>'amount', '')::numeric, 0)), 0), min(e->>'date'),
             count(*) filter (where coalesce(e->>'voidedAt', '') = '')
        into v_sum, v_d, v_n
        from jsonb_array_elements(v_lease.data->'payouts') e
       where e->>'receipt' = p_ref and e->>'verifyCode' = p_code and coalesce(e->>'voidedAt', '') = '';
      if v_n > 0 then
        v_total := v_total + v_sum;
        if v_date is null or v_d < v_date then v_date := v_d; end if;
        select x->>'unit' into v_unit from jsonb_array_elements(coalesce(s->'tenants', '[]'::jsonb)) x where x->>'id' = v_lease.flat_id limit 1;
        v_units := array_append(v_units, v_unit);
        v_cur := coalesce(v_lease.data->>'currency', 'USD');
      end if;
    end loop;
    if array_length(v_units, 1) > 0 then
      v_total := round(v_total, 2);
      return jsonb_build_object(
        'status', case when p_amount is not null and abs(v_total - p_amount) > 0.009 then 'changed' else 'valid' end,
        'kind', 'handover', 'building', s->'building'->>'name', 'unit', array_to_string(v_units, ', '), 'amount', v_total,
        'currency', coalesce(v_cur, 'USD'), 'date', v_date, 'ref', p_ref);
    end if;
    select e into t from public.leases l, jsonb_array_elements(coalesce(l.data->'payouts', '[]'::jsonb)) e
     where l.building_id = v_id and e->>'receipt' = p_ref and e->>'verifyCode' = p_code limit 1;
    if t is not null then
      return jsonb_build_object('status', 'cancelled', 'kind', 'handover', 'building', s->'building'->>'name',
        'at', t->>'voidedAt', 'ref', p_ref);
    end if;
    return jsonb_build_object('status', 'not_found');
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

-- ── Who may call what ────────────────────────────────────────────────────────
revoke all on function public.verify_receipt(text, text, text, numeric, text) from public;
grant execute on function public.verify_receipt(text, text, text, numeric, text) to anon, authenticated;
