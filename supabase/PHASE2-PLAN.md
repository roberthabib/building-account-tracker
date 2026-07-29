# Phase 2 — Tenant privacy (plan, not yet built)

## The problem this solves

Today a tenant can see **everything**: every other tenant's balance, phone number,
and the whole ledger. The app hides some of it in the UI (`tenant-mode` CSS,
`sessionMode` checks), but that is cosmetic — the data is all on the device, and
the shared access code grants full read/write to the entire building.

Two separate weaknesses:

1. **No real identity.** Tenant "login" is a 4-digit PIN compared in JavaScript
   (`hashSecret(pin, salt) === tenant.pinHash`). Anyone can bypass it by editing
   localStorage or reading the synced document directly.
2. **No server enforcement.** Every device uses the same publishable key, and the
   RLS policies allow that key to read/write the whole `building_state` row.

Phase 2 = make privacy **server-enforced**, so it holds even if someone bypasses
the UI.

---

## The crux: how does a tenant prove who they are?

This is the hard part, not the SQL. Real row-level security needs
`auth.uid()` — a genuine authenticated user. Our tenants currently have no
accounts, and most have no email on file (right now, none do).

### Option A — Email accounts (conventional)
Owner collects each tenant's email; tenants sign in with a magic link or
password via Supabase Auth.

- ✅ Standard, well-trodden, free
- ❌ Requires collecting emails from every tenant
- ❌ Tenants must check email to log in — real friction for non-technical users
- ❌ Loses the current "paste a code, pick your name, enter PIN" simplicity

### Option B — Anonymous auth + one-time claim code  ⭐ recommended
Each device silently creates a Supabase **anonymous** user on first run. The
owner generates a per-tenant **claim code**; the tenant enters it once, and a
server function permanently links that anonymous user to their tenant row.
Afterwards the device is that tenant, enforced by RLS.

- ✅ No email needed — preserves today's low-friction onboarding
- ✅ Real `auth.uid()`, so RLS genuinely works
- ✅ Free (anonymous sign-ins are included)
- ✅ PIN can stay as a local convenience lock, no longer the security boundary
- ⚠️ Losing the device = owner re-issues a claim code (acceptable, and a good
  revocation story)
- ⚠️ One extra moving part: a small Postgres function to redeem codes

### Option C — Edge Function issuing custom JWTs from unit + PIN
Keeps the exact current login UX.

- ✅ Zero change for tenants
- ❌ We'd be hand-rolling authentication — signing our own tokens, rate-limiting
  PIN guesses, handling rotation. 4-digit PINs are weak (10,000 combinations)
- ❌ Most likely of the three to contain a security mistake

**Recommendation: Option B.** It keeps the UX you already have while making the
privacy boundary real, and it doesn't require me to invent an auth scheme.

---

## What tenants should and shouldn't see

Worth being explicit, because it isn't simply "only my rows":

| Data | Owner | Tenant |
|---|---|---|
| Own payments & balance | ✅ | ✅ |
| **Other tenants' payments/balances** | ✅ | ❌ |
| Other tenants' phone numbers, PINs | ✅ | ❌ |
| Building expenses (salary, cleaning, diesel…) | ✅ | ✅ *needed to justify their share* |
| Own generator/water share | ✅ | ✅ |
| Other tenants' meter readings | ✅ | ❌ (but the totals they're divided by, yes) |
| Building totals (cash, outstanding) | ✅ | ❌ (aggregate leaks little, but not needed) |
| Polls & votes | ✅ | ✅ (votes are inherently shared) |
| Settings, sync config, projects budgets | ✅ | read-only subset |

The subtle one: **tenants must see building-level expenses** — that's how their
share is computed and it's the transparency the app exists for. So the rule is
"rows tied to another tenant are hidden", not "only my rows".

---

## Schema (normalised)

Replaces the single `building_state` jsonb document.

```
profiles            auth_user_id PK, role ('owner'|'tenant'), tenant_id FK null
tenants             id PK, name, unit, coefficient, breaker_amps, phone, active, pin_hash
transactions        id PK, tenant_id FK null, category, date, for_month,
                    credit_usd, debit_usd, credit_lbp, debit_lbp, description,
                    supplier, invoice, project, expense_category,
                    service_type, service_part, water_split, invoice_photo_url,
                    receipt_ref
monthly_expected    month PK, expected_usd
building_projects   id PK, name, description, total_budget, due_date, distribution, status
project_shares      project_id FK, tenant_id FK, share_usd
service_readings    id PK, service_type, for_month
reading_lines       reading_id FK, tenant_id FK, previous, current, breaker_amps
polls               id PK, title, description, status, created_by, created_at
poll_votes          poll_id FK, voter_key, vote
declarations        id PK, tenant_id FK, month, amount, status, declared_at
settings            single row: building name, collection mode, lbp rate, language…
suppliers           name PK
expense_categories  name PK
claim_codes         code PK, tenant_id FK, used_at, expires_at
```

`tenant_id IS NULL` on a transaction means "building-level" (a shared expense).
That's what makes the RLS rule expressible.

### RLS shape

```sql
-- helper
create function my_tenant_id() returns uuid language sql stable as $$
  select tenant_id from profiles where auth_user_id = auth.uid()
$$;
create function is_owner() returns boolean language sql stable as $$
  select coalesce((select role = 'owner' from profiles where auth_user_id = auth.uid()), false)
$$;

-- transactions: owner sees all; tenant sees own rows + building-level rows
create policy tx_read on transactions for select
  using (is_owner() or tenant_id is null or tenant_id = my_tenant_id());

-- writes: owner only (tenants never write ledger rows)
create policy tx_write on transactions for all
  using (is_owner()) with check (is_owner());

-- tenants table: owner sees all; tenant sees only their own row,
-- and phone/pin_hash are excluded via a restricted view for tenants
create policy tenant_read on tenants for select
  using (is_owner() or id = my_tenant_id());
```

Declarations ("I've paid") stay tenant-writable, scoped to their own row.

---

## Impact on the app (the real cost)

This is where the work is, not in the SQL.

1. **Data layer.** Every render function currently reads one in-memory `state`
   object (`state.transactions`, `state.tenants`, …). I'd keep that shape and
   hydrate it from queries, so the ~40 render/compute functions stay untouched.
   Rewriting them all would be a much larger, riskier change.
2. **Writes.** Today: mutate `state` → save whole document. After: per-row
   insert/update/delete. `saveState()` becomes a small dispatcher.
3. **Offline.** Currently trivial (whole document in localStorage). After: still
   cache the hydrated state for reads, but offline *writes* need a queue with
   per-row replay. The current whole-document token/merge conflict resolution
   stops applying and needs replacing.
4. **Login screen.** Owner: Supabase Auth. Tenant: claim code once, then PIN as a
   local lock. Existing "Connect to a building" flow gets repurposed.
5. **Migration.** One-off script: read the jsonb document → insert into the new
   tables → verify counts and a few balances match the app exactly before
   switching over. Keep the document as a frozen backup.

### Honest cost estimate
Multiple sessions, not one. Roughly:
- schema + RLS + helpers: moderate
- claim-code function + auth wiring: moderate
- data layer + writes + offline queue: **the bulk of it**
- migration + verification: moderate
- retesting every screen in EN + AR: moderate

Still **$0/month** — Supabase's free tier covers Auth (50k monthly active users),
anonymous sign-ins, and Edge Functions.

---

## Risks to weigh before starting

- **Regression risk is real.** The balance/consistency work (v128) and the whole
  redesign sit on top of the current data layer. Changing it can reintroduce
  disagreements between screens.
- **Offline gets genuinely harder.** Right now it's a strength of this app. A
  per-row write queue is materially more complex than the current document merge.
- **Lock-out risk.** If auth is misconfigured, the owner can be locked out of
  their own data. Mitigation: keep the JSON document + `Download backup` working
  throughout, and don't delete the old row until the new path is proven.
- **It may be more than you need.** If all tenants are family/trusted and only
  *you* actually use the app, the current UI-level hiding may be sufficient, and
  this effort could go to features instead.

---

## Suggested sequencing (each step independently useful)

1. **Owner auth only.** Add Supabase Auth for the owner; tighten RLS so writes
   require a logged-in owner instead of the shared publishable key. Immediately
   removes the "anyone with the key can wipe the data" exposure — the single
   biggest win for the least work, and no tenant-facing change.
2. **Normalise the schema** and migrate, with the app still hydrating one state
   object. No visible change; purely structural.
3. **Tenant claim codes + RLS.** The actual privacy feature.
4. **Offline write queue.** Restore full offline parity.
5. **Private invoice bucket** with signed URLs (replaces today's public bucket)
   and delete orphaned photos when an expense is deleted.

Step 1 alone is worth doing even if we never do the rest.
