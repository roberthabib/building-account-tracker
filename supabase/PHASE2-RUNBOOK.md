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
| v166 concierge, neighbours, replies, choice votes, notices (`phase2i-v166.sql`) | ✅ applied 2026-10-21; 32/32 live checks (`phase2i-checks.sql`, rolled back) |
| v167 late reminders, concierge jobs/supplies/visitors, water meters, bookings, board, own details, month checks, hand over, approvals, deposits (`phase2j-v167.sql`) | ✅ applied 2026-10-21; 57/57 live checks (`phase2j-checks.sql`, rolled back) |
| v170 tenants see the concierge's invoice photos (`phase2k-v170.sql`) | ✅ applied 2026-10-21; 6/6 live checks (`phase2k-checks.sql`, rolled back) |
| v173 more than one building (`phase2l-v173.sql`): memberships, x-building header, per-building codes/invites/push/backups/reminders, `b/<id>/` photo folders, `create_building` / `my_buildings`, "building manager" wording | ✅ applied 2026-10-22 (run by Claude in the dashboard); 41/41 live checks (`phase2l-checks.sql`, rolled back); 7 accounts carried over into memberships |
| v174 trusted technicians (`phase2m-v174.sql`): residents ask for a technician, the manager's private notebook, request photos | ✅ applied 2026-10-22 (run by Claude in the dashboard); 27/27 live checks (`phase2m-checks.sql`, rolled back) |
| v178 rentals (`phase2n-v178.sql`): private `leases` table + list/save/delete RPCs for the building manager | ✅ applied 2026-10-23 (run by Claude in the dashboard); 19/19 live checks (`phase2n-checks.sql`, rolled back) |
| v179 rentals on the phones (`phase2o-v179.sql`): renter role + invites tied to a lease, `get_my_state` wrapper (renter trimming, owner `myRentals`), renter guards, push to the tenant | ✅ applied 2026-10-23 (run by Claude in the dashboard); 23/23 live checks (`phase2o-checks.sql`, rolled back) |
| v180 receipts that can be checked (`phase2p-v180.sql`): public `verify_receipt` (anon), `get_my_state` drops `voidedReceipts` | ✅ applied 2026-10-23 (run by Claude in the dashboard); 16/16 live checks (`phase2p-checks.sql`, rolled back) |
| v185 rentals round A (`phase2q-v185.sql`): rent reminders job, `declare_rent_payment`, push target renter, renters' photos | ✅ applied 2026-10-23 (run by Claude in the dashboard); 16/16 live checks (`phase2q-checks.sql`, rolled back) |
| Housekeeping | ✅ test identities + unused hotmail owner **banned (not deleted)** — undo: `update auth.users set banned_until = null where id = '…'` |

Undo for step 7 is at the bottom of `phase2d-lockdown.sql`.

---

## v166 — `phase2i-v166.sql` (concierge and the new resident features)

**Apply this before the v166 app goes live.** The v166 app calls functions that
only exist after it; without them a concierge cannot be invited, and tenant
replies, the neighbours list, "seen by" and quote votes fail.

What it adds:

| Part | What it does |
|---|---|
| Concierge role | `profiles` / `admin_invites` accept `concierge`; `is_concierge()`. An anonymous phone may claim an invite only when its role is concierge (owners and viewers still need Google). `list_admins` / `remove_admin` include them. |
| Concierge slice of `get_my_state` | Expenses and service expenses without per-flat shares; tenants without phones, PINs, shares or details; readings, problems, maintenance, equipment, generator services, supplier names/trades/phones, published notices, month locks. No payments, dues, declarations, cash counts, history, polls, projects, documents or balance snapshot. |
| Concierge writes | `concierge_add_expense` (checks text, date, amount range, closed months; photo must be under `concierge/`; shares by coefficient; marked `enteredBy: concierge`; push to admins), `concierge_save_readings`, `concierge_report_issue`. |
| Photos | Concierge may upload under `concierge/` and read `concierge/` and `issues/`; tenants cannot read `concierge/`. |
| Problems | `reply_issue` — a tenant on their own problems, the concierge on any. |
| Neighbours | `set_directory_optin`; tenants who share get `directory` (name, unit, phone of the others who share); nobody else's phone otherwise. |
| Notices | `mark_notice_seen` → `seenBy` (owner only sees the list; tenants get `seenByMe`); unpublished (`publishAt` in the future) notices hidden from tenants and the concierge; `send_due_notices()` every 15 minutes (pg_cron `scheduled-notices`) sends the phone notification once (`pushedAt`). |
| Votes with choices | `cast_my_vote` accepts one of the poll's option ids (or abstain); `get_my_state` adds `optionCounts` / `optionShares`. |
| Tenants | `equipment` and `messageTemplates` stripped from their copy. |

Steps:

1. Download a fresh backup from the app (Settings → Download backup).
2. Supabase → SQL Editor → New query → paste `phase2i-v166.sql` → Run. Safe to re-run.
3. New query → paste `phase2i-checks.sql` → Run. It acts as a made-up concierge
   and tenant inside a transaction that is rolled back; every row must say
   `ok = true`. If asked about a table without RLS, that is its temporary
   results table: Run without RLS.
4. Confirm nothing was left: `select count(*) from auth.users where email like 'check-%@example.invalid';` → 0.
5. Deploy the v166 app.

Undo: the earlier versions of the replaced functions are in `phase2h-v157.sql`
(`get_my_state`, storage read rule) and `phase2f-v148-features.sql` (admin
invites, `cast_my_vote`); re-running those restores them. Remove the job with
`select cron.unschedule('scheduled-notices');`. Concierge profiles can be
removed from Settings → Administrators.

---

## v167 — `phase2j-v167.sql`

Apply before the v167 app goes live (same steps as v166: backup, run
`phase2j-v167.sql`, then `phase2j-checks.sql` — every row ok = true — then
confirm no `check-%@example.invalid` users are left, then deploy).

| Part | What it does |
|---|---|
| Late reminders | `send_late_reminders()` daily 06:00 UTC (pg_cron `late-reminders`): fixed mode, `settings.lateReminders.on`, due day + delay passed, once a month (`public.late_reminder_log`, RLS on, no access for anon/authenticated); amounts from `balanceSnapshot.unpaid`, message in the tenant's language. |
| Concierge | `concierge_tick_task` (last 7 days only), `concierge_adjust_supply` (never below 0, push when low), `concierge_log_visitor` (last 400), `concierge_save_water_readings` (month locks respected). Concierge expenses at or above `settings.approvalOverUsd` go to `pendingExpenses`. |
| Approvals | `approve_expense(id, approve)`: owner or viewer, never the requester (by email), only pending ones, month locks respected; approving moves the entries into `transactions` with `approvedBy`. |
| Bookings | `book_space` (space must exist, no overlap, at most 10 upcoming per flat), `cancel_my_booking` (own only). Tenants see others' bookings without who/why. |
| Board | `post_to_board` (pending, at most 3 waiting per flat, photo only under `board/<own id>/`), `remove_my_post` (own only). Tenants see approved posts of the last 30 days (without the other flat's id) and their own. Storage: tenants may upload into `board/<own id>/`. |
| Own details | `update_my_details(phone, language)` sets `detailsAt`. |
| Month checks | `mark_month_checked(id, month, fingerprint)` for owner/viewer, records their email. |
| Hand over | `step_down(keep_view)`: only when another owner exists; becomes viewer or removes own access. |
| get_my_state | Tenants: no jobs, supplies, visitors, month checks, approvals; only their own deposits; no `onlyFlats`. Concierge: jobs, recent log, supplies, recent visitors, upcoming bookings without who/why. |

Undo: re-run `phase2i-v166.sql` for `get_my_state` and `concierge_add_expense`; `select cron.unschedule('late-reminders');`.
