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

## 5. App: owner sign-in  ⏳ not built yet

Adds an owner email + password sign-in, and keeps the Supabase session alive
across reloads (refresh tokens in `localStorage`).

## 6. App: tenant claim + redacted read  ⏳ not built yet

Tenant devices sign in anonymously, redeem a claim code once, then load their
data via `get_my_state()` instead of reading the row directly.

## 7. Tighten the policies  ⚠️ only after 5 and 6 are shipped and tested

This is the flag day — the moment privacy becomes real and the shared
publishable key stops granting access to everything.

Do not run it early. Keep a fresh **Download Backup** from the app before you do.

---

## If you get locked out

The app's `Download Backup` JSON is always a complete copy of your data, and
the `building_state` row is never deleted by any of this. Recovery: revert the
step-7 policies in the SQL Editor (dashboard access does not depend on the
app's auth), then reload.
