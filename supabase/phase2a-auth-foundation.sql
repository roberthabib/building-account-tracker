-- Phase 2a — auth foundation (ADDITIVE ONLY, nothing breaks)
--
-- Creates the identity + redaction machinery for tenant privacy. It does NOT
-- change the existing building_state policies, so the live app keeps working
-- exactly as it does today. Policies get tightened in Phase 2b, once the app
-- knows how to sign in and call these functions.
--
-- Run in: Supabase dashboard -> SQL Editor -> New query -> paste -> Run.
-- Safe to re-run.
--
-- NOTE on search_path: every function sets `public, extensions` because
-- Supabase installs pgcrypto (gen_random_bytes) into the extensions schema.
-- Omitting it makes gen_random_bytes fail at runtime.

-- ── Who is this user? ───────────────────────────────────────────────────────
-- One row per authenticated user (including anonymous ones). role='owner' sees
-- everything; role='tenant' is bound to one app tenant id (text, matching the
-- ids already used inside the JSON document).
create table if not exists public.profiles (
  auth_user_id uuid primary key references auth.users (id) on delete cascade,
  role         text not null check (role in ('owner', 'tenant')),
  tenant_id    text,
  created_at   timestamptz not null default now(),
  constraint tenant_needs_id check (role <> 'tenant' or tenant_id is not null)
);

alter table public.profiles enable row level security;

-- A user may read only their own profile row. No client can write it: rows are
-- created by claim_tenant(), or seeded by you for the owner.
drop policy if exists "read own profile" on public.profiles;
create policy "read own profile"
  on public.profiles for select
  to authenticated
  using (auth_user_id = auth.uid());

grant select on public.profiles to authenticated;

-- ── Helpers used by policies and redaction ─────────────────────────────────
create or replace function public.is_owner()
returns boolean
language sql stable security definer set search_path = public, extensions
as $$
  select coalesce(
    (select role = 'owner' from public.profiles where auth_user_id = auth.uid()),
    false
  );
$$;

create or replace function public.my_tenant_id()
returns text
language sql stable security definer set search_path = public, extensions
as $$
  select tenant_id from public.profiles where auth_user_id = auth.uid();
$$;

-- ── One-time claim codes (tenant onboarding without email) ─────────────────
create table if not exists public.claim_codes (
  code        text primary key,
  tenant_id   text not null,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null default (now() + interval '30 days'),
  used_at     timestamptz,
  used_by     uuid references auth.users (id) on delete set null
);

alter table public.claim_codes enable row level security;
-- Deliberately NO policies: no client reads or writes this table directly.
-- Codes are minted by create_claim_code() and redeemed by claim_tenant(),
-- both security definer. A tenant can therefore never enumerate codes.

-- Owner mints a code for one tenant. Returns the code to hand over.
create or replace function public.create_claim_code(p_tenant_id text)
returns text
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_code text;
begin
  if not public.is_owner() then
    raise exception 'Only the building owner can create claim codes';
  end if;

  -- 8 chars, uppercase, ambiguous glyphs mapped out (O/0/I/1 and base64 +/=).
  -- upper() runs BEFORE translate so lowercase 'o' can't survive as 'O'.
  v_code := substr(
    translate(upper(encode(gen_random_bytes(24), 'base64')),
              'O0I1+/=', 'XYZWQRS'),
    1, 8);

  insert into public.claim_codes (code, tenant_id) values (v_code, p_tenant_id);
  return v_code;
end;
$$;

-- Tenant device redeems a code: binds the CURRENT auth user to that tenant.
create or replace function public.claim_tenant(p_code text)
returns text
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_row public.claim_codes;
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;

  select * into v_row from public.claim_codes
   where code = upper(trim(p_code)) for update;

  if v_row.code is null then
    raise exception 'That code is not valid';
  end if;
  if v_row.used_at is not null then
    raise exception 'That code has already been used';
  end if;
  if v_row.expires_at < now() then
    raise exception 'That code has expired';
  end if;

  insert into public.profiles (auth_user_id, role, tenant_id)
       values (auth.uid(), 'tenant', v_row.tenant_id)
  on conflict (auth_user_id)
    do update set role = 'tenant', tenant_id = excluded.tenant_id;

  update public.claim_codes
     set used_at = now(), used_by = auth.uid()
   where code = v_row.code;

  return v_row.tenant_id;
end;
$$;

-- ── Redacted read for tenants ──────────────────────────────────────────────
-- Returns the state document with everything belonging to OTHER tenants
-- removed. The owner gets it unchanged. Shape stays identical to what the app
-- already loads, so no render/compute function has to change.
--
-- Redaction decisions (deliberate — read before changing):
--   tenants           -> caller's own row only; every other row dropped, so
--                        names, phones and PIN hashes of others are gone
--   transactions      -> own rows + building-level rows (no tenantId), which
--                        tenants MUST see to justify their share
--   transactions.shares -> reduced to the caller's own entry. Critical: a
--                        building expense carries a per-tenant share map, and
--                        leaving it whole would expose every tenant's amount
--                        on rows tenants are allowed to read. The app only
--                        ever reads shares[myId], so this is lossless for them.
--   paymentDeclarations -> own only
--   buildingProjects.shares -> reduced to caller's own entry
--   serviceReadings   -> kept whole, on purpose. The app needs every meter line
--                        to allocate fuel by kWh; without them a tenant cannot
--                        compute their own share. Names are already gone, so
--                        this leaves anonymous kWh/amp figures only.
--   settings          -> credentials and the owner password hash stripped
--   security.salt     -> kept (the tenant's own local PIN lock needs it)
--   polls             -> kept; votes are inherently shared in this app
create or replace function public.get_my_state()
returns jsonb
language plpgsql stable security definer set search_path = public, extensions
as $$
declare
  v_state jsonb;
  v_me    text;
begin
  select state into v_state from public.building_state where id = 'building';
  if v_state is null then
    return null;
  end if;

  if public.is_owner() then
    return v_state;
  end if;

  v_me := public.my_tenant_id();
  if v_me is null then
    raise exception 'This device is not linked to a tenant yet';
  end if;

  -- tenants: own row only
  v_state := jsonb_set(v_state, '{tenants}', coalesce((
    select jsonb_agg(t)
      from jsonb_array_elements(coalesce(v_state->'tenants', '[]'::jsonb)) t
     where t->>'id' = v_me
  ), '[]'::jsonb));

  -- transactions: own + building-level, with the share map narrowed to self
  v_state := jsonb_set(v_state, '{transactions}', coalesce((
    select jsonb_agg(
             case
               when jsonb_typeof(x->'shares') = 'object'
               then jsonb_set(x, '{shares}',
                      case when x->'shares' ? v_me
                           then jsonb_build_object(v_me, x->'shares'->v_me)
                           else '{}'::jsonb end)
               else x
             end)
      from jsonb_array_elements(coalesce(v_state->'transactions', '[]'::jsonb)) x
     where coalesce(x->>'tenantId', '') in ('', v_me)
  ), '[]'::jsonb));

  -- declarations: own only
  v_state := jsonb_set(v_state, '{paymentDeclarations}', coalesce((
    select jsonb_agg(d)
      from jsonb_array_elements(coalesce(v_state->'paymentDeclarations', '[]'::jsonb)) d
     where d->>'tenantId' = v_me
  ), '[]'::jsonb));

  -- projects: keep the project, narrow its share map to self
  v_state := jsonb_set(v_state, '{buildingProjects}', coalesce((
    select jsonb_agg(
             case
               when jsonb_typeof(p->'shares') = 'object'
               then jsonb_set(p, '{shares}',
                      case when p->'shares' ? v_me
                           then jsonb_build_object(v_me, p->'shares'->v_me)
                           else '{}'::jsonb end)
               else p
             end)
      from jsonb_array_elements(coalesce(v_state->'buildingProjects', '[]'::jsonb)) p
  ), '[]'::jsonb));

  -- settings: strip credentials + the owner password hash
  v_state := jsonb_set(v_state, '{settings}',
    (coalesce(v_state->'settings', '{}'::jsonb)
       - 'ownerPasswordHash' - 'syncSecret' - 'invoiceUploadUrl'
       - 'cloudSpreadsheetId' - 'invoiceUploadFolderId'
       - 'supabaseUrl' - 'supabaseAnonKey'));

  return v_state;
end;
$$;

-- ── Narrow tenant write ────────────────────────────────────────────────────
-- Tenants never write the document. They only announce a payment, which the
-- owner then confirms. Amount is clamped to a sane range so a hostile client
-- can't stuff nonsense into the ledger.
create or replace function public.declare_my_payment(p_month text, p_amount numeric)
returns void
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_me   text := public.my_tenant_id();
  v_decl jsonb;
begin
  if v_me is null then
    raise exception 'This device is not linked to a tenant';
  end if;
  if p_month !~ '^\d{4}-\d{2}-\d{2}$' then
    raise exception 'Month must look like YYYY-MM-01';
  end if;
  if p_amount is null or p_amount <= 0 or p_amount > 1000000 then
    raise exception 'Amount out of range';
  end if;

  v_decl := jsonb_build_object(
    'id',         'decl-' || encode(gen_random_bytes(6), 'hex'),
    'tenantId',   v_me,
    'month',      p_month,
    'amount',     p_amount,
    'status',     'pending',
    'declaredAt', to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
  );

  update public.building_state
     set state = jsonb_set(state, '{paymentDeclarations}',
                   coalesce(state->'paymentDeclarations', '[]'::jsonb) || v_decl,
                   true),
         rev = rev + 1,
         updated_at = now()
   where id = 'building';

  if not found then
    raise exception 'No building data';
  end if;
end;
$$;

-- ── Execute grants ─────────────────────────────────────────────────────────
-- Postgres grants EXECUTE to PUBLIC by default, so revoke from public (not
-- just anon) before granting deliberately.
revoke all on function public.create_claim_code(text)            from public;
revoke all on function public.claim_tenant(text)                 from public;
revoke all on function public.get_my_state()                     from public;
revoke all on function public.declare_my_payment(text, numeric)  from public;
revoke all on function public.is_owner()                         from public;
revoke all on function public.my_tenant_id()                     from public;

grant execute on function public.create_claim_code(text)           to authenticated;
grant execute on function public.claim_tenant(text)                to authenticated;
grant execute on function public.get_my_state()                    to authenticated;
grant execute on function public.declare_my_payment(text, numeric) to authenticated;
grant execute on function public.is_owner()                        to authenticated;
grant execute on function public.my_tenant_id()                    to authenticated;

-- ── Deliberately NOT done here ─────────────────────────────────────────────
-- building_state policies are UNCHANGED, so the live app keeps working while
-- the client side is built. Phase 2b will tighten them to:
--   select -> using (public.is_owner())   [tenants switch to get_my_state()]
--   write  -> using (public.is_owner())
-- Do not run that until the app signs in, or you will lock yourself out.
