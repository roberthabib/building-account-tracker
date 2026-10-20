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

### 5b. Owner signs in with Google (v142)

App side built and tested against a local mock (round trip, wrong account,
cancel at Google, intercepted-code replay rejected by PKCE, stray code, email
mode, tabs, Arabic). Needs, once: a Google OAuth client (redirect URI
`https://<project>.supabase.co/auth/v1/callback`), the Google provider enabled
in Supabase with that client, Site URL + redirect allow-list set to the app's
URL, and the Gmail account marked owner (`insert into public.profiles …
role 'owner'`) after its first sign-in attempt.

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

---

## Status 2026-10-19 — Phase 2 complete

| Step | State |
|---|---|
| 1–4 foundation, owner account | ✅ |
| 5 owner sign-in (Google, v142) | ✅ owner session in daily use |
| 6 tenant phones (v144 + `phase2c-tenants-backups-photos.sql`) | ✅ 16/16 live checks: own row only, other tenant's id/name/phone absent, shares cut to own, building totals for the split, anonymous poll counts, credentials stripped, bad writes refused, no backup access, raw document unreadable |
| 7 lockdown (`phase2d-lockdown.sql`) | ✅ shared key refused for read / write / photo upload; owner reads, writes, sees photos and backups; keep-alive on `rpc/keepalive` |
| Daily backups | ✅ pg_cron `daily-building-backup` 00:30 UTC, 60 days, first snapshot taken |
| Private invoice photos | ✅ bucket private, 10-minute signed links, deleted with their expense |
| Proof-of-payment photos (`phase2e-payment-proofs.sql`, v146) | ✅ 6/6 live checks (rolled back): tenant uploads only into `proofs/<own id>/`, other tenant folder and building invoices refused (42501), declaring with another tenant's photo refused, other tenant's proof invisible, own proof visible |
| v148 features (`phase2f-v148-features.sql`) | ✅ applied 2026-10-20; 21 live checks (rolled back): tenant gets no history/cash counts and only own plans, issue photos own-folder only, report_issue refuses other tenants' photos, enqueue_push/notify/admin invites/keepalive_status refused for tenants, anon can only claim real jobs, share-weighted poll counts correct; VAPID keys in Vercel env — viewer admins, admin invites, problem reports + photos, plans/history/cash counts stripped from tenants, share-weighted poll counts, push notifications, keep-alive watch |
| v153 monthly balance notices (`phase2g-monthly.sql`) | ✅ applied 2026-10-20; 6 live checks (rolled back): cron `monthly-balance-notices` 0 5 1 * *, one job queued per owing tenant with a subscription, none when switched off, `balanceSnapshot` hidden from tenants, tenants cannot run it |
| v157 tenant links + privacy (`phase2h-v157.sql`) | ✅ applied 2026-10-20; 7 live checks (rolled back): tenants get no documents list, supplier book or unit details and cannot read documents/ files or call list_tenant_links; owner can |
| Housekeeping | ✅ test identities + unused hotmail owner **banned (not deleted)** — undo: `update auth.users set banned_until = null where id = '…'` |

Undo for step 7 is at the bottom of `phase2d-lockdown.sql`.
