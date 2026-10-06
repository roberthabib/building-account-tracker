# Phase 2 runbook — order matters

Follow these in order. Steps 1–4 are **safe**: the live app keeps working
throughout because `building_state` policies are untouched until step 7.

Do **not** skip to step 7. Tightening policies before the app can sign in
locks the owner out of their own data.

---

## 1. Create the auth machinery  ✅ safe

Supabase dashboard → **SQL Editor** → New query → paste all of
[`phase2a-auth-foundation.sql`](phase2a-auth-foundation.sql) → **Run**.

Expected: `Success. No rows returned.`

Creates: `profiles`, `claim_codes`, and the functions `is_owner()`,
`my_tenant_id()`, `create_claim_code()`, `claim_tenant()`, `get_my_state()`,
`declare_my_payment()`.

## 2. Enable anonymous sign-ins  ✅ safe

Dashboard → **Authentication** → **Sign In / Providers** → enable
**Anonymous sign-ins**.

Why: tenant devices get a real `auth.uid()` without needing an email address.
That is what makes row-level security actually enforceable.

## 3. Create the owner account  ✅ safe

Dashboard → **Authentication** → **Users** → **Add user** → *Create new user*.
Use your own email and a strong password. Tick **Auto Confirm User** so you
don't have to click a confirmation email.

> Do this in the dashboard, not from the app — the app must never handle the
> creation of the owner account.

## 4. Mark yourself as owner  ✅ safe

SQL Editor, replacing the email with the one from step 3:

```sql
insert into public.profiles (auth_user_id, role, tenant_id)
select id, 'owner', null from auth.users where email = 'YOUR-EMAIL@example.com'
on conflict (auth_user_id) do update set role = 'owner', tenant_id = null;
```

Verify — should return exactly one row, `role = owner`:

```sql
select p.role, p.tenant_id, u.email
  from public.profiles p join auth.users u on u.id = p.auth_user_id;
```

## 5. App: owner sign-in  ✅ done (v141, 2026-10-06)

SQL: [`phase2b-owner-access.sql`](phase2b-owner-access.sql), run and verified by
impersonation — owner reads 1 / updates 1 / sees the invoice photos; a claimed
tenant device gets 0 / 0 / 0. App flow tested end to end against a local mock
(sign-in, wrong password, non-owner account, stay-signed-in, token refresh,
revoked session, sign-out, device-password fallback, offline, Arabic).

Adds an owner email + password sign-in, and keeps the Supabase session alive
across reloads (refresh tokens in `localStorage`).

**Verified 2026-10-06 — signed-in users have NO access to `building_state`.**
A signed-in session (owner or tenant, including anonymous sign-ins) runs as the
`authenticated` role. `schema.sql` granted and wrote policies for `anon` only,
so a claimed tenant device reading the row directly gets 403. Good for privacy
(tenants already can't bypass `get_my_state()`), but it means **the owner's
signed-in session can't read or write the document either**. Step 5 must add:

```sql
grant select, insert, update on public.building_state to authenticated;
create policy "owner reads"   on public.building_state for select to authenticated using (public.is_owner());
create policy "owner inserts" on public.building_state for insert to authenticated with check (public.is_owner());
create policy "owner updates" on public.building_state for update to authenticated
  using (public.is_owner()) with check (public.is_owner());
```

Step 7 then only has to remove the `anon` grants/policies.

## 6. App: tenant claim + redacted read  ⏳ not built yet

**Server side verified 2026-10-06 against real data (16/16 checks):** claim
code minted by the owner, redeemed once by an anonymous device, reuse refused,
tenant can't mint codes; `get_my_state()` returns only the caller's tenant row,
the other tenant's id and phone appear nowhere in the response, the building
expense stays visible with its `shares` map cut to the caller's own entry
(amount intact), credentials stripped, and `declare_my_payment()` rejects a bad
month or amount without writing.

Tenant devices sign in anonymously, redeem a claim code once, then load their
data via `get_my_state()` instead of reading the row directly.

## 7. Tighten the policies  ⚠️ only after 5 and 6 are shipped and tested

This is the flag day — the moment privacy becomes real and the shared
publishable key stops granting access to everything.

Do not run it early. Keep a fresh **Download Backup** from the app before you do.

**Keep-alive dependency:** `api/keepalive.js` (Vercel Cron, twice daily) stops
the free-plan project being paused by reading `building_state` with the anon
key. Step 7 revokes that read. Before or alongside step 7, give the keep-alive
something it may still call — e.g. a `public.keepalive()` function returning
`now()`, granted to `anon` — and point `api/keepalive.js` at
`/rest/v1/rpc/keepalive`. Otherwise the project starts getting paused again.

---

## If you get locked out

The app's `Download Backup` JSON is always a complete copy of your data, and
the `building_state` row is never deleted by any of this. Recovery: revert the
step-7 policies in the SQL Editor (dashboard access does not depend on the
app's auth), then reload.
