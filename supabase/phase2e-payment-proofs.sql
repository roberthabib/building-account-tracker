-- Phase 2e — proof of payment photos from tenant phones (v146)
--
-- A linked tenant can attach a photo (bank transfer / OMT / Whish receipt) to
-- "I've paid". Photos go to invoices/proofs/<tenant id>/…, and:
--   * a tenant may upload ONLY into their own proofs/<tenant id>/ folder,
--   * a tenant may read building invoices and their own proofs, never another
--     tenant's proofs (the old member-read policy allowed any path),
--   * the owner keeps full access (existing owner policies).
-- Safe to re-run.

-- ── Storage ─────────────────────────────────────────────────────────────────
drop policy if exists "tenant upload own proofs" on storage.objects;
create policy "tenant upload own proofs"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'invoices'
    and public.my_tenant_id() is not null
    and name like 'proofs/' || public.my_tenant_id() || '/%'
  );

drop policy if exists "member read invoices" on storage.objects;
create policy "member read invoices"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'invoices'
    and (
      public.is_owner()
      or (
        public.my_tenant_id() is not null
        and (name not like 'proofs/%' or name like 'proofs/' || public.my_tenant_id() || '/%')
      )
    )
  );

-- ── declare_my_payment gains an optional proof path ─────────────────────────
-- Drop the 2-argument version first: two overloads where one has a default
-- would make the REST call ambiguous.
drop function if exists public.declare_my_payment(text, numeric);

create or replace function public.declare_my_payment(p_month text, p_amount numeric, p_proof_path text default null)
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
  if p_proof_path is not null and p_proof_path not like 'proofs/' || v_me || '/%' then
    raise exception 'Proof photo must be one of your own uploads';
  end if;
  v_decl := jsonb_build_object(
    'id', 'decl-' || encode(gen_random_bytes(6), 'hex'), 'tenantId', v_me, 'month', p_month,
    'amount', p_amount, 'status', 'pending',
    'declaredAt', to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'));
  if p_proof_path is not null then
    v_decl := v_decl || jsonb_build_object('proof', jsonb_build_object(
      'storagePath', p_proof_path, 'fileName', 'payment-proof.jpg', 'mimeType', 'image/jpeg'));
  end if;
  update public.building_state
     set state = public.touch_state_meta(jsonb_set(state, '{paymentDeclarations}',
                   coalesce(state->'paymentDeclarations', '[]'::jsonb) || v_decl, true)),
         rev = rev + 1, updated_at = now()
   where id = 'building';
  if not found then raise exception 'No building data'; end if;
end;
$$;

revoke all on function public.declare_my_payment(text, numeric, text) from public;
grant execute on function public.declare_my_payment(text, numeric, text) to authenticated;
