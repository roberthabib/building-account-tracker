# Building Account Tracker — Claude Instructions

## What this app is

A mobile-first progressive web app (PWA) for managing a residential building's accounts. It tracks tenant dues and payments, building expenses, shared services (generator + water), one-off building projects, cash/reserve position, and simple polls. It runs entirely in the browser on `localStorage`, with optional Google Sheet cloud sync and invoice-photo upload to Google Drive. There are two roles: **owner** (full access) and **tenant** (read-only, scoped via a PIN).

---

## File map

```
index.html              All HTML markup, dialogs, login screen, bottom nav + More sheet
src/app.js              All application logic — single file (~6,150 lines), vanilla ES module
src/styles.css          All CSS, mobile-first, CSS custom properties for theming
data/seed.json          Factory-reset template — intentionally EMPTY (no real data / no credentials)
sw.js                   Service worker — offline app shell, network-first
manifest.json           PWA manifest
api/upload-invoice.js   Vercel serverless function — uploads invoice images to Google Drive
google-sheet-sync-only.gs        Apps Script for Sheet sync (no Drive) — the deployed one
google-drive-invoice-upload.gs   Apps Script variant that also uploads invoices to Drive
local-server.js         Local dev server on port 4180 (serves files; also serves .pdf inline)
tools/extract-seed.mjs  (Legacy) regenerates seed.json from an Excel workbook
tools/smoke-test.mjs    OUTDATED (describes the v43 UI) — do not trust without updating
tools/clean-sheet.mjs   One-off Sheet cleanup tool — gitignored (holds the live Apps Script URL)
vercel.json             Vercel config (cleanUrls, no-cache for sw.js)
```

---

## Architecture

- **No framework, no build step.** Pure vanilla JS ES module loaded directly from `index.html`.
- **Single JS file** (`src/app.js`) and **single CSS file** (`src/styles.css`). Do not split them.
- **State** is one plain object in the global `state`, persisted to `localStorage` under `building-account-tracker:v1`. Sync metadata lives under `building-account-tracker:sync`.
- **DOM refs** are cached at boot in the `els` object (top of `app.js`). Use `els.*`; avoid inline `document.querySelector` elsewhere (a few late-bound exceptions exist).
- **Rendering** is plain DOM manipulation (`replaceChildren`, `createElement`, `textContent`). Never put user-controlled values through `innerHTML` (XSS). Static structure via `innerHTML` with empty nodes then `.textContent` is the established pattern.
- **No external runtime dependencies.** XLSX export, multi-page PDF generation, ZIP building, and SHA-256 are all hand-rolled in `app.js`.

---

## Internationalization (English / Arabic, right-to-left)

The app is fully bilingual. Language lives in `state.settings.language` (`"en"` | `"ar"`), mirrored to `localStorage["building-account-tracker:lang"]` so the pre-login screen renders correctly. `applyLanguage()` sets `<html lang/dir>` and toggles `body.rtl`; RTL layout is achieved almost entirely by `dir="rtl"` + the existing flexbox (no bespoke RTL CSS was needed). The language picker appears in the setup wizard (step 1) and **Settings → Building Details**; `setLanguage()` persists + re-renders.

Two translation mechanisms, both near the top of `app.js`:
- **Static HTML** → the `I18N` dictionary (semantic keys like `nav.dashboard`) + `t(key, params)`. Markup carries `data-i18n` / `data-i18n-ph` (placeholder) / `data-i18n-aria` / `data-i18n-title`; `applyStaticI18n()` walks them on every render. **Never** put `data-i18n` on a `<label>` that wraps an input — wrap the caption in a `<span>` instead (setting `textContent` would delete the input).
- **Dynamic JS strings** → the `DYN_AR` reverse map (English source string → Arabic) + `tr(en, params)`. `showToast()` runs its message through `tr()` automatically, so fixed toast strings need no call-site change; only parameterized ones do. Params use `{name}` placeholders.

When adding UI text: static markup gets a `data-i18n*` attribute + an `I18N` entry; JS-built text gets wrapped in `tr("English", {params})` + a `DYN_AR` entry. Category/status values that double as **stored data** (e.g. `"Payments"`, `"Expenses"`) are only ever translated at display time — never change the stored value. Generated **PDFs follow the app language** (v145+): `pdfTextCommand` translates exact labels via `tr()`, and any non-ASCII text (Arabic labels, Arabic names/descriptions) is drawn by the browser on a canvas and embedded as a JPEG XObject (`pdfTextImageCommand`, ASCIIHex so the file stays ASCII; images are drawn first so table lines stay on top). English output is unchanged pure text. Table column order stays left-to-right.

---

## App version — TWO places (bump together)

1. `const APP_VERSION = "v126";` in `src/app.js` (shown to users in Settings)
2. `const CACHE_NAME = "building-account-tracker-v126";` in `sw.js` (forces the service worker to refresh the cached shell)

The header no longer shows the version (it shows the building name); the version is displayed in Settings from `APP_VERSION`.

---

## State schema

```js
{
  building: { name, version, sourceWorkbook, importedAt },
  settings: {
    collectionMode: "actual" | "fixed", // how tenants are billed (see Collection modes)
    defaultDueUsd: number,              // monthly amount (fixed mode) / fallback
    lbpPerUsd: number,                  // conversion rate (default 89500)
    invoiceUploadUrl: string,           // Apps Script web-app URL  (blank by default)
    cloudSpreadsheetId: string,         // Google Sheet ID          (blank by default)
    invoiceUploadFolderId: string,      // Drive folder ID          (blank by default)
    syncSecret: string,                 // optional shared secret, sent as token on cloud calls
    ownerPasswordHash: string,          // salted SHA-256 (never plaintext)
    sharedExpensesEnabled: false,       // legacy, forced false
  },
  security: { salt: string },           // per-install salt for password/PIN hashing
  meta: { rev, epoch, token, updatedAt },// sync conflict metadata (see Cloud sync)
  deleted: { transactions:[], tenants:[], polls:[], projects:[] }, // tombstones for merge
  tenants: [{ id, name, unit, active, phone, coefficient, breakerAmps, pinHash }],
  transactions: [Transaction],
  monthlyExpected: [{ month: "YYYY-MM-01", expectedUsd: number }],
  serviceReadings: [{ id, serviceType, forMonth, lines: { [tenantId]: { breakerAmps, previousReading, currentReading } } }],
  buildingProjects: [{ id, name, description, totalBudget, dueDate, distribution, shares, status, createdAt }],
  polls: [{ id, title, description, createdBy, createdAt, status, votes: { [voterId]: "yes"|"no"|"abstain" } }],
  paymentDeclarations: [{ id, tenantId, month, amount, declaredAt, status }],
  projects: [{ id, name }],          // known project names (autocomplete)
  suppliers: [{ id, name }],         // known supplier names (autocomplete)
  expenseCategories: [{ id, name }], // known expense categories (autocomplete)
  categories: string[],              // derived — do not store manually
  setupComplete: boolean,
}
```

### Transaction schema

```js
{
  id, category,                 // see Categories below
  description, tenantId,        // tenantId set for Payments + tenant Opening Balance
  forMonth: "YYYY-MM-01" | null,// monthly Payments + Services Expenses month
  project: string,              // set for project payments
  date: "YYYY-MM-DD",
  supplier, invoice, expenseCategory,
  serviceType: "generator" | "water" | undefined,  // Services Expenses only
  servicePart: "fuel" | "maintenance" | "",         // generator Services Expenses
  waterSplit: "equal" | "coefficient" | undefined,  // water Services Expenses
  debitUsd, debitLbp, creditUsd, creditLbp,
  balanceUsd, balanceLbp,       // legacy; prefer credit/debit
  shares: { [tenantId]: number } | null, // snapshotted per-tenant split (expenses + water)
  invoiceAttachment: null | { fileName, mimeType, size, driveFileId, driveUrl, uploadedAt },
  sourceRow, receiptRef, paymentGroupId,
}
```

---

## Key constants (app.js)

| Constant | Value |
|---|---|
| `STORAGE_KEY` | `"building-account-tracker:v1"` |
| `SYNC_META_KEY` | `"building-account-tracker:sync"` |
| `APP_VERSION` | `"v125"` |
| `DEFAULT_LBP_PER_USD` | `89500` |
| `DEFAULT_CATEGORIES` | `["Opening Balance","Payments","Expenses"]` |
| `SERVICE_TYPES` | `["generator","water"]` |
| `MORE_VIEWS` | views behind the "More" sheet |
| `EXPENSE_INVOICE_PREFIX` | `"INV"` |
| `INVOICE_IMAGE_MAX_EDGE` / `_QUALITY` / `_UPLOAD_MAX_BYTES` | 1800 / 0.82 / 3 MB |

---

## Views and navigation

Eight `.view` sections, switched by `setView(viewId)`. The **bottom nav shows four** — `dashboardView`, `paymentsView`, `tenantsView`, `ledgerView` — plus a **More** button (`#moreNavButton`) that opens `#moreSheet` containing `projectsView`, `servicesView`, `pollsView`, `settingsView` (`MORE_VIEWS`). `selectedMonth` is shared between the dashboard month nav and the payments month strip.

- **dashboardView** — "Needs Attention" strip (owner), KPI cards (Cash/Reserve, Expenses, Outstanding, Net Position), tenant balances, monthly activity. Tenant sees their own dues panel + due banner.
- **paymentsView** — per-tenant payment status + month history (mode-aware).
- **tenantsView** — tenant cards + statement PDF.
- **projectsView** — building projects with per-tenant shares + collection.
- **servicesView** — generator + water bills (see Services).
- **ledgerView** — filterable transactions, Excel + PDF export (owner-only edit/delete).
- **pollsView** — building polls/votes.
- **settingsView** — building config, currency, Google integration + sync secret + share access, backup/restore, reset actions.

Roles: `sessionMode` is `"owner"` or `"tenant"`. `.owner-only` elements are hidden in tenant mode (CSS via `body.tenant-mode`), and owner-only actions are also guarded in JS.

---

## Transaction categories

- **Opening Balance** — building cash (no `tenantId`) OR a tenant carry-in (`tenantId` set; debit = owes, credit = prepaid). Tenant openings affect balances, not cash.
- **Payments** — monthly (`tenantId` + `forMonth`, no `project`) or project (`tenantId` + `project`).
- **Expenses** — building costs; split among tenants by coefficient (snapshotted in `shares`).
- **Services Expenses** — generator/water costs (`serviceType` set); cash-out, billed via the Services distribution, NOT folded into the general expense share.
- **Advance Payments** — legacy; still summed, not created by the form.

Helpers: `isMonthlyPayment`, `isProjectPayment`, `isFixedMode`.

---

## Collection modes (`settings.collectionMode`)

- **`actual`** — tenants owe their share of recorded `Expenses` (`getTenantExpenseShare`, by coefficient).
- **`fixed`** — tenants owe a fixed monthly amount (`monthlyExpected` / `defaultDueUsd`, split by coefficient when set); surplus builds the **reserve fund** (the cash KPI). The "Add Month" flow and new-month banner only apply here.

`getTenantBalance(id)` = dues basis (mode-aware) **+ services due − payments − opening net**. Expense/water shares are snapshotted on the transaction (`shares`) at entry so later roster changes don't rewrite history.

---

## Services (generator + water)

Costs are logged progressively via the `+` button as **Services Expenses** (cash-out, in the ledger). Distribution to tenants:

- **Generator** — `servicePart` is `fuel` or `maintenance`. The owner enters monthly **meter readings** on the Services tab (`serviceReadings`); fuel is split by metered kWh, maintenance pro-rata by `breakerAmps`. Computed live by `computeServiceDistribution(serviceType, month)` — a month with costs but no readings is "not yet billed".
- **Water** — split `equal` or by `coefficient`, snapshotted in `shares` at entry; bills immediately (no readings).

`getTenantServicesDue(tenantId, {serviceType, month})` totals a tenant's service charges.

---

## Auth & onboarding

- **Owner sign-in (Supabase Auth, Phase 2 step 5, v141+; Google v142+).** When the cloud is Supabase (`usesOwnerAccounts()`), the owner tab defaults to **Continue with Google** (`startGoogleSignIn` → Supabase `/auth/v1/authorize?provider=google` with a PKCE challenge; on return `completeGoogleSignIn` swaps `?code=` + the stored verifier at `/auth/v1/token?grant_type=pkce`). Email + password (`signInOwner`) is behind a link. Both paths go through `adoptOwnerSession`, which requires `rpc/is_owner` to be true before keeping the session. The session lives in `localStorage["building-account-tracker:auth"]` (`AUTH_KEY`) — **never in `state`**, which is synced and backed up. While a session exists, `supabaseRequest` and `uploadInvoiceToSupabase` send it as the bearer instead of the publishable key (`authBearer()`), refreshing it first via `ensureFreshSession()`. A rejected refresh drops the session and falls back to the publishable key. The old per-device owner password stays as a temporary fallback link ("Can't sign in? Use this device's password", `ownerDevicePasswordMode`) until runbook step 7. Database side: `supabase/phase2a-auth-foundation.sql`, `phase2b-owner-access.sql`, and `supabase/PHASE2-RUNBOOK.md`.
- **Tenant phones (v144+).** Owner mints a one-time invite code (Settings → Invite a tenant → `rpc/create_claim_code`). The tenant taps "I'm a tenant with an invite code": the phone signs up anonymously, `rpc/claim_tenant` binds it, and the session is saved with `role: "tenant"`. Tenant phones load only `rpc/get_my_state` (server-filtered; `state.redaction` carries building totals for the coefficient split), never push the document (`canPushDocument()`), and write via `rpc/declare_my_payment` / `rpc/cast_my_vote`. `body.tenant-phone` hides `.building-wide` panels. Since step 7 (`supabase/phase2d-lockdown.sql`) the publishable key has **no** access to `building_state` or photos — only `rpc/keepalive` and auth.
- **Invoice photos** are private: open via `openInvoicePhoto()` (10-min signed link); `deleteInvoicePhoto()` on delete/replace. **Daily backups**: pg_cron snapshot into `building_backups`; owner restores via Settings (`rpc/list_backups`, `rpc/get_backup`).
- **v146 owner tools.** Coefficients are capped at 1000/1000 (`coefficientRoom`; lowering is always allowed). WhatsApp links go through `whatsappPhone()` (adds Lebanon 961 to local numbers) / `whatsappLink()`; the reminders dialog has a building-group message (`buildGroupBalancesMessage`, opens WhatsApp chooser). Recurring expenses: `state.recurringExpenses` templates; a month is done when a transaction carries `recurringId` (`pendingRecurringExpenses`). Proof of payment: tenants upload to `invoices/proofs/<tenantId>/` (`phase2e-payment-proofs.sql`), declarations carry `proof`, recording one attaches it to the payment. Attention rows can carry `data-action` (reminders / recurring).
- **v147 real cents.** `formatUsd` shows cents (`roundUsd`, -0 normalised); it used to round to whole dollars while printing ".00". Excel already used `$#,##0.00`. `phase2e-payment-proofs.sql` is applied and verified live (own-folder upload only, no cross-tenant proof reads).
- **v148 running the building.** One section in app.js (search "v148 — running the building"). `saveState` now returns false when it refuses: `guardAndAuditSave` diffs the new state against the copy in localStorage (owner sessions only), refuses changes touching a closed month (`state.monthLocks`, by transaction date and, for services, `forMonth`) or any change by a view-only admin (`authSession.role === "viewer"`), and appends to `state.auditLog` (cap 800; >40 changes = one "bulk" entry). Undo puts `before` back (deleted transactions return under a new id). New collections: `cashChecks`, `announcements`, `issues`, `generatorServices`, `monthLocks`, `auditLog` (all hydrated + merged; issues/monthLocks merge per record by `updatedAt`/`at`). Fuel litres on generator fuel expenses (`litres`), `engineHours` on readings. Move-out: tenant gets `movedOutOn` (inactive), new tenant `movedInOn`/`meterStart`; fixed dues (`tenantOccupiesMonth`) and unsnapshotted expense splits (`occupantsOn(date)`) follow occupancy. Polls: `weighting: "share"`, `closesOn`, `quorumPct` (server tallies `yesShare`… in get_my_state). Admins: `supabase/phase2f-v148-features.sql` (viewer role, admin invites `?admin=CODE`, push tables, report_issue, keepalive_log). Push: pg_net → `/api/push` with a job id only; it claims the job via `rpc/claim_push_job` and sends with `web-push` (env VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY); `/api/push-key` serves the public key. Generic sheet: `openToolDialog(title, ...nodes)` + `mk()` DOM helper.
- **v149 group balances PDF.** "Share balances PDF with the building group" builds `buildGroupBalancesPdf()` (header band, 3 summary cards, colour-coded unit table, total, footer) and shares it with `navigator.share({files})` so WhatsApp can post it to the group; without file sharing it downloads the PDF and opens WhatsApp with a caption. Text version kept (`postBalancesAsText`). PDF colour helpers: `pdfTextCommand(text, x, y, size, bold, { color, bg })`, `pdfFillRect` (fills are moved before images/text by `pdfImagesFirst`), `pdfTextWidth` for right-aligned amounts.
- **v169 tenant home.** Tenant phones get `#tenantHome` (`renderTenantHome`, end of renderDashboard): one balance card (`tenantHeroCard`: to pay / in credit / all paid, paid until or due date, How to pay sheet + I've paid → `openDeclareDialog` for `oldestUnpaidMonth`, details on tap = the old dues list), "For you" (unseen notices, open votes not yet voted, own problems with a new reply, own bookings, tour), and shortcut tiles (notices, emergency, generator hours, report a problem, bookings, board, receipts, My flat). The old dues panel, "From the building" panel and yellow due banner are hidden (`body.tenant-home-on`). Parking, deposit, My details and Neighbours moved to More → My flat (`myFlatView`, `.tenant-phone-only`).
- **v170 invoice photos.** Ledger rows with an invoice photo show a camera button (`.ledger-photo-chip`); `openInvoicePhoto` shows images in an in-app viewer (`#photoViewer` dialog, signed link, "Open full size") and only opens a new window for non-images. `supabase/phase2k-v170.sql`: tenants may also read the concierge's invoice photos (`concierge/<year>/…`), not `concierge/meters` or `concierge/issues`. Local rehearsal of the whole database: scratchpad PGlite harness (see memory gotchas).
- **v171 notification test.** More → Phone notifications (when on): "Send a test" posts the phone's own subscription to `api/push-test.js` (signed-in callers only, known push-service hosts only), which waits 5 s and sends one fixed test message, answering with the push service's status (403/404/410 → the phone re-registers). "Not popping up?" (`openPushHelp`) explains Android's per-app Pop on screen / Alert setting and battery Unrestricted; the web app can't force heads-up pop-ups. `api/push.js` now logs `{job, phones, sent, gone, failed}` (see `vercel logs`).
- **v172.** Tenant/concierge phones: `saveCloudState` (sync chip tap, back online) now just re-fetches via `syncFromSheet` instead of reporting a fake 401 with the manager's "sign in with Google" text; `describeSyncProblem` gives tenant phones their own 401/403 wording (ask for a new invite code).
- **v173 more than one building.** Block "v173 — more than one building". The chosen building is per phone (`building-account-tracker:building`, `currentBuildingId()`, default "building"); `supabaseRequest` sends `x-building` only once one was chosen (`buildingHeader()`), so old phones behave as before. The state row is `building_state?id=eq.<id>`; uploads go through `buildingPath()` (`b/<id>/…` for every building except the first). `checkBuildingChoice()` at boot (rpc `my_buildings`; resets a building you no longer belong to, follows a notification's `?building=`), `switchBuilding()` (saves pending changes, fetches the other building's data, reloads; a new building gets the current language), `openBuildingsDialog()` (header name tap or More → Your buildings; manager can add one via rpc `create_building` → setup wizard, which gets a "Switch to another building" link). Invite claims call `adoptNewestBuilding()`. Server: `supabase/phase2l-v173.sql` (`public.memberships` replaces `profiles`, mirrored by a trigger for old scripts; `my_building()` = app.building (scheduled jobs) / validated header / first membership; `role_in`, `photo_building/rest/role/tenant`, `local_path`; scheduled jobs loop over buildings via `<job>_one()`; push titles for managers of several buildings start with the building name; api/push.js opens `/?building=<id>`). Old check scripts still pass because `profiles` writes are mirrored.
- **v174 trusted technicians.** Block "v174 — trusted technicians". Tenants: shortcut tile "Need a technician?" (`openTechRequestDialog`: trade, details, optional photo under `requests/<tenantId>/` → rpc `request_technician`; own list via `my_service_requests`, `cancel_my_request`). Manager (owner, not viewer): More → Technicians (`techView`, `renderTechView`, tabs Requests / Technicians / Fees). Requests from every building the manager runs (`list_service_requests`); "Send to a technician" (`openSendToTechnician`, also from problem cards via `problemContext`) opens WhatsApp with a message + 3-day photo link (`longPhotoLink`) and records a job; `update_service_request` tells the resident who will call. Jobs are marked done with value, fee (`jobFee`: % or fixed) and ratings; Fees tab = who owes you, WhatsApp statement (`techStatementText`), mark paid, manual jobs. The notebook (technicians + jobs) is the manager's own (`get_manager_book` / `save_manager_book` with a rev check, `changeTechBook`), never part of a building's state or ledger. Attention row + More badge for new requests (`refreshTechRequests` after entering as manager). Server: `supabase/phase2m-v174.sql` (`service_requests`, `manager_books`, trade labels, storage policy for `requests/`; other tenants and view-only helpers can't read request photos).
- **v175 More menu in groups.** `#moreMenu` has headings (`p.more-group`, I18N `more.group*`; a divider before Your buildings / Help / Settings); `renderMoreGroups()` hides a heading whose items are all hidden for this role and re-translates code-added items (Your buildings, Ask the app, the Settings subtitle). Every item has its own icon (layers, message, clock, box, truck, fileText, building added to `LUCIDE_ICONS`). Phone settings moved into Settings → "This phone" (`#phoneSettings`: push panel, `renderDisplayPanel` → Display + App lock + Install); everything else in Settings is under "Building". Tenants/concierge can now open Settings but only see `#phoneSettings` (CSS `body.tenant-mode #settingsView > :not(.section-title):not(#phoneSettings)`). Emergency numbers card on More now sits above the version note.
- **v176 services in each month's due.** `getMonthlyDueForTenant(tenantId, month)` = fixed amount share (or, without a fixed amount, the month's expense share) **+ that month's generator and water share** (`getTenantServicesDue(tenantId, { month })`; generator only once the month's readings exist). So `paymentStatus`, `fifoMonthPaid`, `paidUntil`, Late pills, `unpaidByMonth` → late reminders, statement rows and Payments → Expected include them; balances were already total-based and don't change. Payments (fixed) rows say "of $x · incl. $y generator & water" (`monthServicesNote`).
- **v177 owners, flats, residents.** The people in `state.tenants` are flat **owners** (they pay building charges, no rent). UI words only (stored names unchanged: `state.tenants`, `tenantId`, role `tenant`): tab **Flats** (الشقق), "Flats & Owners", Add/Edit/Delete flat; **Owner** (المالك) for money owed; **Resident** (السكان) for things everyone living in the building sees; the login link is "I have an invite code"; Move out → **Transfer** (ownership transfer dialog). "Tenant" (المستأجر) is reserved for renters (rentals feature planned: in a rented flat the tenant pays rent AND the building charges); the deposit lines still say tenant on purpose.
- **v178 rentals (manager tools).** Block "v178 — rentals". More → Rentals (`rentalsView`, manager with full access only), tabs Leases / Owners. A lease = flat (`flatId` = a `state.tenants` id), tenant {name, phone, language}, start/end, rent + currency (USD/LBP), period monthly/quarterly/yearly, yearly increase %, grace days, deposit, `ownFlat` (manager's own flat: no fee, no hand-over) or `fee` {percent | fixed per paid period}, `payments`, `payouts` (handed over to the owner), `deductions` (expenses paid for the owner), status/endedOn. Pure maths (tested): `leasePeriods` (due on each period's first day, in advance), `leaseStatus` (oldest period first, late after grace, paid until), `leaseOwnerAccount` (collected − fee − deductions − handed over). Rent payment can also record the **building charges paid by the tenant** as a normal building Payment for the flat (`paidByTenant`, receipt). WhatsApp: rent reminder, receipt, owner statement. Attention rows: rent late, lease ending ≤ 60 days. Flats cards show "Rented to …". Leases live in `public.leases` (`supabase/phase2n-v178.sql`: rpc `list_leases`/`save_lease` (rev check)/`delete_lease`, owner role of `my_building()` only) — never in `state`, building cash, reports or backups.
- **v179 rentals on the phones.** Block "v179 — rentals on the phones". The manager invites a lease's tenant from the lease (Invite to the app → rpc `create_renter_code`; the code is claimed through the same `claim_tenant`). A renter phone has `sessionMode` "tenant" and `state.myRole === "renter"` (`isRenterPhone()`, body `renter-phone` hides Votes/Meetings); `get_my_state` (now a wrapper around `get_my_state_base`, `supabase/phase2o-v179.sql`) sends it the flat's building charges plus `myLease` (no fee/payouts/deductions/notes), without polls, meetings, directory or the owner's details, and refuses once the lease has ended. Home: `renterRentCard` ("Your rent", Rent payments), My flat: `renterLeaseCard`; `residentName()` shows the renter's name. Owner phones get `state.myRentals` → `ownerRentalCards` ("Your rented flat", due to you now, `openOwnerRentalSheet`). `heroChargesNote()` labels the balance card "Building charges" (· paid by your tenant). Recording rent notifies the flat's phones ("Rent received").
- **v180 receipts that can be checked.** Block "v180 — receipts that can be checked". Receipted payments carry `verifyCode` (10 random chars, shared by a receipt's payments; only the manager's phone hands them out: `addReceiptVerifyCodes` in `saveState` after the guard, `backfillReceiptChecks` after a sync). Receipt PDFs draw a QR (`pdfQrCommand`) of `receiptCheckLink` → `/verify?b=&r=&c=&a=&l=` (`verify.html`, standalone, public). Rent payments get codes too (new ones at recording, old ones once via `backfillRentVerifyCodes`); the WhatsApp rent receipt adds "Check this receipt" (`k=rent`). Deleting payments records `state.voidedReceipts` ({id ref:code, ref, code, unit, amountUsd, at}, in `guardAndAuditSave`, merged by id) so the check says cancelled. Server: `supabase/phase2p-v180.sql` (`verify_receipt` for anon: valid / changed (printed amount differs) / cancelled / not_found; never names or phones; `get_my_state` drops `voidedReceipts`).
- **v181 PDF invoices.** Expense invoices (manager form and the concierge's expenses) can be a PDF as well as a photo: `prepareInvoiceUpload(t, file, { allowPdf: true })` keeps a PDF as it is (10 MB at most, `.pdf` path, mimeType application/pdf); photos are still compressed to JPEG. The upload button says "Photo or PDF" (the camera button stays photo-only). PDFs open in a new tab through the signed link (`isImageAttachment` is false for `.pdf` paths, even when the server labelled a concierge upload as JPEG); Ledger rows show a document icon instead of the camera. "Fill in from the invoice" sends `{ pdf }` to `api/read-invoice.js` (Claude document block; 3 MB at most because of Vercel's request limit). No database change: the `invoices` bucket has no type or size limit.
- **v182 receipt breakdown.** Block "v182 — receipts show what a payment paid for". Monthly receipts (PDF, printed, text fallback) use `RECEIPT_COLUMNS` Month · Item · Due · This payment · Status from `receiptBreakdownRows`: per month the parts of the due (`receiptMonthParts`: monthly fee in fixed mode / share of expenses in actual mode, generator, water), allocated fee → generator → water after what was already paid for that month (`paidForMonthBefore`, other receipts ordered by date then id); overflow = "Extra (credit)"; a bold total row (`.total`) when there are several parts; the status (Paid / Partial) follows the breakdown, not `paymentStatus`.
- **v183 statement breakdown.** `tenantStatementRows` rows also carry `fee`, `generator`, `water` (fee = due − services). Block "v183 — statements show what each month was made of": `statementMonthColumns(rows, totals)` drives the monthly table of the statement PDF (`buildTenantStatementPdf`, 7-pt cells) and the printed statement (`printTenantStatement`); generator/water columns only when used; receipts shown without "RCT-". The statement picture (`drawStatementCanvas`) adds a muted line per month with the parts when the month has generator or water.
- **v184 Arabic dates, one invoice button.** In Arabic, `formatMonth` and `formatDateLabel` use `ar-LB-u-nu-latn` (Lebanese month names, Western digits; English unchanged). The 8 strings that had no Arabic got one (the scratchpad tool `missing-ar.cjs` lists tr()/trIn()/showToast() strings without a DYN_AR entry; it reports 0 now). The expense form has one invoice button, "Add a photo or PDF" (`#takeInvoicePhotoButton` is kept hidden: the phone picker offers the camera).
- **v185 rentals round A.** Block "v185 — rentals: reminders…". Late fee `lease.lateFee {kind fixed|percent, value, since}` via `withLateFees` inside `leaseStatus` (periods get `rent`, `lateFee`, amount incl. fee; charged when payments dated before the late day don't cover the rent so far; `lease.waivedFees` = period starts). `saveLease` stores `data.schedule` (`leaseSchedule`: asOf, dueBefore, paid, current + 24 coming periods) for the server job `send_rent_reminders` (pg_cron `rent-reminders` 06:30 UTC; 3 days before, on the late day then weekly ×4; `lease.autoReminders` false = off; push target `renter` = one lease's tenant). `maintainLeases()` (once per session) adds rent check codes and refreshes schedules older than a week. Tenant phone: "I've paid the rent" → `rpc/declare_rent_payment` → `lease.declarations` (pending/confirmed/rejected); manager confirms via `openRentPaymentDialog(id, declaration)`, attention row (`v185AttentionItems`). Rent receipt PDF `buildRentReceiptPdf` (QR, `rentPaymentAllocation`) for manager (PDF button) and tenant (Rent payments → Receipt). `leaseCurrentRent` = rent without late fees. Server: `supabase/phase2q-v185.sql` (also `photo_tenant` includes renters with an active lease).
- **v186 rentals round B.** Block "v186 — rentals: lease documents…". `lease.documents` [{id, kind, name, storagePath, mimeType, …}] and `lease.inspections` [{id, kind move-in|move-out, date, meters, keys, rooms [{name, condition good|worn|damaged, note, photos}]}] — files under `leases/<lease id>/` (`uploadLeaseFile`), manager only: `supabase/phase2r-v186.sql` keeps tenants and viewers out of `leases/` and strips documents/inspections/schedule from `get_my_state` (myLease, myRentals). Inspection PDF `buildInspectionPdf` (move-out shows the move-in condition; photos 4 per page via `pdfPhotoImage` + `fetchStoredPhoto`). Renewals: `openRenewLeaseDialog` → `lease.rentChanges` [{from, rent}] (+ `lease.renewals` log); `leasePeriods` takes the rent from `leaseRentBase` (latest change on or before the period; yearly increase counted from it).
- **Wording:** the person running the building is the "building manager"; flat owners are "owners"; renters are "tenants".
- **Older wording note:** the person running the building is the "building manager" (Arabic "مدير المبنى", login tab "Manager"), never "owner" in UI text; "Owner" (المالك) remains only for flat owners (owners' meeting).
- **v168.** Payments: the "Add Month" button is hidden for good (the current month is added automatically, `autoAddCurrentMonth`); a small Edit link on the Expected card opens the same dialog, now titled "Monthly amount" and prefilled with the month's amount. "Change" buttons (LBP rate, generator billing, My details) say Edit — `tr("Change")` translates to the noun "التغيّر" and stays only for the change column in Reports.
- **v167 (part 2).** Second block (search "v167 (part 2)"). **Other income**: category "Other Income" (credit, `account` cash/bank), from the + chooser (`openOtherIncomeDialog`); counts in cash and in the annual report's "other". **Deposits held** (`state.deposits` {tenantId, kind, amountUsd, receivedOn, status held/returned, keptUsd}; not cash; returning keeps any withheld part as Other Income with `depositId`; tenant page, Tenants → More…, cash breakdown, settlement, tenant phone card; server sends tenants only their own). **Statement import** (Payments → Import statement: CSV/TSV/paste or .xlsx read with `DecompressionStream`; `statementRowsFromTable` finds incoming money, `matchStatementRow` suggests the tenant by name/phone/amount, `alreadyRecorded` flags duplicates; creates payments with receipts, `importedFrom`). **Approval for big expenses** (`settings.approvalOverUsd`; expenses at or above go to `state.pendingExpenses` {transactions, requestedBy email, status}; another administrator decides via `approve_expense`, which moves them into `transactions`; concierge expenses over the limit also wait; attention row action `approvals`). **Everyone's statement** (Tenants → More…: share each picture or a ZIP). **Parking** (`tenant.parking`, Tenants → More… → Parking spaces; tenant phone card). **Category suggestion** without AI (`suggestExpenseCategory`: same supplier, else words of past descriptions). **Ask the app / Say it** (`api/assistant.js`, Claude, owner/viewer only via `rpc/my_admin_role`; hidden until `ANTHROPIC_API_KEY` is set — `body.assistant-ready`; voice via `webkitSpeechRecognition`). **Pop-up notifications**: push sent with urgency high, `vibrate`/`renotify`; a bottom sheet invites turning them on (`maybeShowNudge`, localStorage `building-account-tracker:nudges`). **Install sheet**: `beforeinstallprompt` on Android/desktop, Share → Add to Home Screen steps on iPhone; also More → Display → Install.
- **v167.** One block (search "v167 — paid until"); server side `supabase/phase2j-v167.sql`. **Paid until** (fixed mode, `paidUntil`: FIFO leftover ÷ monthly amount; Payments pill, tenant card/page, tenant phone card). **Only some flats pay**: `computeSharedExpenseShares(total, distribution, date, only)`; `installFlatPicker`/`pickedFlatIds` in the project dialog (`project.onlyFlats`) and the expense form in actual mode (`transaction.onlyFlats`); tenants don't see projects they have no share in. **Budget proposal** (`budgetProposal(marginPct)`: last 12 months of Expenses by category + margin + reserve top-up → monthly per flat; "Use as the {year} budget" writes `state.budgets`). **Move-out settlement** (`openSettlementDialog`, `tenant.settlement`, picture `drawSettlementCanvas`). **Automatic late reminders**: `settings.lateReminders {on, days}`; `balanceSnapshot.unpaid` (per tenant per month, `unpaidByMonth`); server `send_late_reminders()` daily (pg_cron `late-reminders`), once per month (`private.late_reminder_log`). **Generator subscription**: `settings.generatorBilling {mode: "subscription", perAmpUsd, perKwhUsd, since}`; `computeServiceDistribution` returns `subscription: true` lines (maintenanceUsd = amps part, consumptionUsd = kWh part) for months ≥ since; `getServiceMonths` adds every month since. **Water meters**: `settings.waterMeters`, water split "meter" (no shares; `waterMeterShare` from `serviceReadings` with serviceType "water", m³), `openWaterReadingsDialog` (owner, concierge via `concierge_save_water_readings`). **Jobs & supplies** (More → `staffView`, owner + concierge, `.staff-only`): `state.routineTasks` (days of week), `state.routineLog` (id `taskId:date`, `done`, merged by `at`), `state.supplies` (qty, lowAt; merged by updatedAt), `state.visitorLog`; concierge RPCs `concierge_tick_task`, `concierge_adjust_supply`, `concierge_log_visitor`. **Bookings** (`bookingsView`, `settings.spaces`, `state.bookings`; tenants `book_space` / `cancel_my_booking`, others' bookings reach tenants without who/notes). **Residents' board** (`boardView`, `state.boardPosts` pending → approved by the owner, 30 days; tenants `post_to_board` / `remove_my_post`, photos under `board/<tenantId>/`). **My details** (tenant `update_my_details` → phone/language + `detailsAt`; owner edits stamp `detailsAt`; `mergeTenantDetails`). **Owners' meeting pack** (`printMeetingPack`: accounts, works, votes/decisions, proposed budget, optional balances, signatures). **Month checks** (`mark_month_checked` for owner/viewer admins; `state.monthChecks` with `monthFingerprint`; "Changed since checked"). **Hand over** (Administrators → `openHandOverDialog`: full-access invite, then `step_down(p_keep_view)`).
- **v166.** One block (search "v166 — concierge"); server side `supabase/phase2i-v166.sql`. **Concierge role** (`authSession.role === "concierge"`, `isConciergeSession`; excluded from `isOwnerSession`/`isAdminSession`): the owner creates a concierge invite (Settings → Administrators, role concierge; the server lets an anonymous phone claim only that role); the code is typed in the same "invite code" box (`joinWithInviteCode` falls back to `claimConciergeCode`). The phone loads a filtered `get_my_state` (no money owed/paid, no shares, no phones) and writes only through `concierge_add_expense`, `concierge_save_readings`, `concierge_report_issue`, `reply_issue`; photos go under `concierge/`. `sessionMode === "concierge"` (body `tenant-mode tenant-phone concierge-mode`), home panel `renderConciergeHome`. Emergency numbers `settings.emergencyContacts` (Settings editor; tenant/concierge/More cards). Resident directory: tenants opt in via `set_directory_optin` (`tenant.directory`/`directoryAt`), `get_my_state` adds `directory` only for tenants who share; `mergeDirectoryFlags` keeps the latest choice. Problems: `issue.messages` thread (owner local, others via `reply_issue`), `issue.workOrder` (supplier, date, cost, before/after photos, "record the bill" → Expense with `issueId`). Projects: `project.quotes`, "Put to a vote" → poll with `options` (`buildOptionPollCard`, `optionTally`; `cast_my_vote` accepts option ids, server returns `optionCounts`/`optionShares`). Equipment (More, `state.equipment`, tombstoned, warranty attention). Diesel estimate (`dieselEstimate`, `state.dieselChecks`, `settings.dieselTankLitres/dieselReorderLitres`, low-diesel attention). Water deliveries card (water expenses can carry `litres`). Notices: `publishAt`/`sendPush` (server `send_due_notices` every 15 min via pg_cron; `get_my_state` hides unpublished), "seen by" (`mark_notice_seen` → `seenBy`; tenants get `seenByMe`; `mergeAnnouncementsV166` unions it). Reports: monthly newsletter picture (`drawNewsletterCanvas`) and calendar .ics (`buildCalendarIcs`). App lock: WebAuthn platform credential per phone (`building-account-tracker:app-lock`), lock screen at start and after 5 min in the background (a local gate, not server auth). serviceReadings now merge by `updatedAt`.
- **v165.** One block (search "v165 — shortcuts, search"), preceded by a hand-written QR encoder (`qrMatrix`/`qrCanvas`: byte mode, level M, versions 1–10; verified against jsQR in development, no runtime library). manifest.json `shortcuts` open `/?do=payment|expense` and `?join=CODE` pre-fills the connect dialog (`captureLaunchParams`/`runLaunchAction`; `?code=` is reserved for Google sign-in). Ledger: Repeat on expenses (`repeatTransaction`), swipe a row to open/close it, pull a sheet down by its top edge to close it (`attachSwipeGestures`). Header search button (`searchEverything`/`openSearch`). Sync chip shows "Saved · 2 min ago" / "Offline · will send" (`decorateSyncChip`, localStorage `building-account-tracker:last-synced`). **Fixed mode now fills the oldest unpaid month first**: `paymentStatus` uses `fifoMonthPaid` (balances were already total-based), and the payment form shows what a payment covers (`paymentCoverage`). `settings.dueDay` → "Late · $x" pills and a late attention row (`lateTenants`). Reminder wording: `settings.messageTemplates.reminder.{en,ar}` with {name} {amount} {month} {unit} {building}; per-tenant `tenant.language` (Details) via `reminderText`/`trIn`; the standard text adds the payment instructions. Reports: missing invoice photos, 12-month money in/out SVG chart (`moneyFlowByMonth`), reserve forecast (`reserveForecast`, also in the cash drill-down). Meter readings: inline checks (`meterReadingCheck`: lower than last month = error, > 2× last month's kWh = warning, confirm on save) and a meter photo per flat (`lines[tid].photo`, uploaded like invoices, in the photo backup under `photos/meters/`). Invites: QR in the single-invite dialog and a QR button per tenant in Invite all; links are `?join=CODE`. Notices: Print → A4 PDF poster with a QR to the app (`drawNoticePoster` + `singleImagePdf`). Tenants: All receipts ZIP; generator hours card (`settings.generatorSchedule`). Closed polls notify tenants once (`announceClosedPolls`, `poll.closedAt`/`resultNotifiedAt`, only polls closed from 2026-10-21). LBP rate: quick change dialog with `settings.rateHistory` (Settings and the expense form). Dashboard "Getting started" checklist (hideable, localStorage). Empty screens get a first-action button (`decorateEmptyStates`). First-sync shimmer on KPI cards (`body.is-first-sync`). The tenant due banner is translated.
- **v164 everyday polish.** One block (search "v164 — everyday polish"). Undo toast (`showUndoToast`) after adding entries, Who paid? and ledger deletes (`undoAddedTransactions` tombstones; `undoDeletedTransaction` re-adds under a new id; the invoice photo is only deleted after the 9 s undo window). Expense form: recent-expense chips (`recentExpenseTemplates`) and, in actual mode, "Each flat pays" (`expenseSplitPreview`). Who paid? preselects each tenant's last method (`lastPaymentMethod`). Fixed mode: the current month is added automatically from the previous month's amount (`autoAddCurrentMonth`, once per session). Dashboard KPI cards open drill-downs (cash vs bank, expenses by category this year, who owes, net position). Month chips replaced by ‹ Month › steppers on the dashboard and Payments (`renderMonthSteppers`; the buttons keep `data-month`). Ledger month headers show in/out totals and stick; quick filter chips drive `categoryFilter`. Tenant cards open `openTenantPage` (balance, last months, generator kWh, recent receipts, statement picture `drawStatementCanvas`, PDF, edit). More → Display: text size and light/dark/auto, per phone (`building-account-tracker:display`, `html.text-large|text-xlarge`, `html[data-theme]`). The Dashboard tab badge counts visible attention rows. Settings "How tenants can pay" (`settings.paymentInstructions`, passes through get_my_state) feeds the tenant `howToPayCard`. Fuel $/litre column + `fuelPriceWarning` (attention key `fuelPrice:YYYY-MM`). Reports: same-months-last-year note (`samePeriodComparison`) and "For the accountant" ZIP (`accountantPackFiles`: full ledger xlsx, annual xlsx, the year's receipt PDFs, plus invoice photos when signed in). Tenants screen banner when coefficients don't total 1000. Settings → Test data → Remove (`removeTestData`: drops every `test-` id with tombstones and the empty test months, turns monthly notices back on). New tombstone kinds: serviceReadings, generatorServices, paymentDeclarations, monthlyExpected (by month; Add Month and the auto-add clear that month's tombstone). "Payment received" push to the tenant already existed (v148).
- **v163 Month History.** Payments → Month History rows (`buildMonthHistoryRow`, data from `monthHistoryData`): fixed dues show "n of m paid", a progress bar and "$x of $y collected" on the same forMonth basis as the cards above (it used to mix payment dates with forMonth); actual mode shows collected for the month. Both show "Spent" (expenses + services dated that month). The selected month is highlighted; tapping one scrolls back to the top.
- **v162 dashboard layout.** Top: Needs Attention, then "today" figures that ignore the month (Building Financial Position with an "As of" date, payment notifications, Tenant Balances). The month chips moved down into `#monthSection` ("Month by month", title = chosen month) above the panels that use `selectedMonth`: new-month banner, Monthly Services Expenses, Monthly Activity, Expenses by Category; `updateMonthSectionHead` hides the picker when none of them shows. `renderMonthSelect` scrolls the chips horizontally only (scrollIntoView would jump the page). The all-time "Total Expenses" card became "Expenses this year" (`expensesThisYearUsd`).
- **v161.** Payments: the "Last Receipt" button was removed (owner didn't need it); receipts are still on each payment (Ledger, tenant card, tenant phones).
- **v160 Help & videos.** More → Help & videos (`renderHelp`, everyone): `HELP_VIDEOS` lists explainer videos (owner ones + tenant ones; tenants only see theirs), played in `#videoDialog` from `videos/<en|ar>/<id>.mp4` with a `<id>.jpg` poster. `sw.js` never caches `/videos/`. Owners get a hideable "Watch the 1-minute tour" attention row (key `helpTour`, action `helpVideo`) and tenants a dismissible home card until watched (localStorage `building-account-tracker:videos-watched`). The videos are recorded with Playwright against a made-up demo building (no real data): real Chrome at 390×844, DPR 2, CDP screencast frames encoded to H.264 with WebCodecs and muxed to MP4 in Node; captions and a tap dot are injected overlays. To re-record after UI changes: `node tools/videos/run.cjs` (see tools/videos/README.md; it swaps in a demo cloud config and always restores the real one, and updates the lengths in `HELP_VIDEOS`).
- **v159.** Generator card lines have a Bill button: `drawGeneratorBillCanvas` makes a picture of one tenant's readings, kWh and fuel/maintenance shares (owner for any unit, tenant for their own). Expense form: "Fill in from the photo" sends the compressed invoice photo to `/api/read-invoice` (official `@anthropic-ai/sdk`, `claude-opus-5-5`, effort low, JSON-schema structured output, server-side fallbacks default), which checks the caller is the owner via `rpc/is_owner`; the button stays hidden until `ANTHROPIC_API_KEY` is set in Vercel (GET returns `{configured}`).
- **v158.** More → Suppliers (owner: `state.suppliers` gains phone/trade/notes, call/WhatsApp, history of expenses with that supplier; renaming renames past expenses), Documents (owner: `state.documents`, raw files under `documents/` in the bucket, expiry reminders 30 days ahead, included in the backup with photos), Meetings (everyone reads; owner writes `state.meetings` with decisions and linked polls, minutes as PDF). Reports: Budget vs actual (`state.budgets[year][category]`), Reserve target (`settings.reserveTargetUsd`, attention when cash is below), Close the year (locks all 12 months, offers annual report + backup; nothing erased).
- **v157.** Tenants screen: "Invite all" (`openInviteAllDialog`, one WhatsApp invite per tenant, invite text now explains Add to Home Screen) and a linked / notifications line per tenant from `rpc/list_tenant_links` (`supabase/phase2h-v157.sql`, which also strips owner-only `documents`, `suppliers` and tenants' `details` from `get_my_state` and hides `documents/` photos from tenants). Payments carry `method` (cash/bank/omt/whish/cheque), expenses `paidFrom` (cash/bank); `transactionAccount`/`expectedByAccount` split the cash count into cash box vs bank & wallets. Payments → "Who paid?" (`openWhoPaidDialog`) records several payments with receipts at once. Tenant dashboard lists their recent payments with Receipt buttons. Tenant card → Details (`tenant.details`, owner only).
- **v156 hide reminders.** Each Needs Attention row has a × (`openAttentionHideDialog`): hide for a week, a month or for good, stored in `settings.hiddenAttention` {key: untilDate | "forever"}. Keys: `item.key` (period-bound, e.g. `reminders:2026-10-01`, `closeMonth:…`, or type-bound like `photoBackup`, `owing`) else the text, so a changed situation shows again. Hidden ones are listed via the link at the bottom (`openHiddenAttentionDialog`).
- **v155.** Payments are editable from the Ledger (`openPaymentEditDialog`, same form; id, receiptRef, paymentGroupId and proof photo are kept). Maintenance calendar: `state.maintenanceTasks` [{id, title, everyMonths, nextDue, lastDone, notes, history, updatedAt}] (More → Maintenance, owner only; merged per record by updatedAt, tombstones `deleted.maintenanceTasks`); "Mark done" can also record the cost as an Expense (`maintenanceTaskId`). Backup reminder: `settings.lastPhotoBackupAt`, attention row after 31 days.
- **v154 backup with photos.** Settings → "Download backup with photos": `backupPhotoList()` gathers every stored picture (expense invoices, payment proofs, declaration proofs, problem photos; deduped by storagePath, unique names under `photos/<folder>/`), `fetchStoredPhoto` downloads each via `/storage/v1/object/authenticated/invoices/…` (4 at a time), and the ZIP holds `backup.json` + `README.txt` (lists failures and old Drive-only photos) + `photos/`.
- **v153.** LBP amounts convert at the entry's own `lbpRate` (stamped at first save / first load; `txUsd(t, usd, lbp)`, `entryRate`) so changing the rate never rewrites history; `toUsd` is only for amounts not yet recorded. Data health (`dataHealthIssues`) in Reports + an attention row; duplicate-payment confirm on save (`findDuplicatePayment`). Monthly report PDF (`monthlyReportData`/`buildMonthlyReportPdf`, generator/water sections only when used that month). `state.balanceSnapshot` (owner saves it on every save) feeds `send_monthly_balances()` on the 1st via pg_cron (`supabase/phase2g-monthly.sql`), which also strips it from `get_my_state`; toggle `settings.monthlyBalanceNotices`.
- **v152 group balances as a picture.** The group post is now a PNG drawn on a canvas (`drawGroupBalancesCanvas`, data from `groupBalancesData`, file from `groupBalancesImageFile`, made synchronously so `navigator.share` keeps the tap's user activation). Arabic is laid out right-to-left. The v149 PDF builder is gone; its PDF colour helpers remain.
- **v151 payment plans removed** (owner didn't need them). Old `state.paymentPlans` data, if any, is simply ignored; `get_my_state` still filters that key harmlessly.
- **Tests:** `npm test` (node, tests/harness.mjs loads src/app.js with a stub DOM; network blocked).
- Owner password and tenant PINs are stored as **salted SHA-256** (`hashSecret`, `sha256Hex`, salt in `state.security.salt`). Never store plaintext. Legacy plaintext is migrated to hashes in `hydrateState`.
- **Tenant onboarding:** owner shares an access code (Settings → Share access) bundling `{url, sheetId, syncSecret}` (`buildSyncCode`); a new device pastes it on the login screen ("Connect to a building", `applySyncCode`) to configure sync and pull the data.

---

## Cloud sync (Google Apps Script + Sheet)

- `postCloudAction(action, payload)` POSTs to `settings.invoiceUploadUrl`, including `token: settings.syncSecret` when set. The `.gs` checks a `SYNC_SECRET` Script Property (dormant unless set).
- `saveState()` bumps `meta.rev`/`updatedAt` and debounces `queueCloudSave()` (900 ms).
- **Conflict protection:** each push carries a random `meta.token`. On save/sync, if the cloud token differs from this device's last-synced token, states are **merged item-by-item** (`mergeStates`) keyed by id, with `deleted` tombstones preventing resurrection. `meta.epoch` bumps on Zero/Reset so a wipe wins over stale devices. Header sync chip (`setSyncChip`) shows Saving/Saved/Error/Offline.
- **Backup/restore:** owner can Download Backup / Restore from File (JSON, `downloadBackup`/`restoreFromBackupFile`, auto safety-copy before restore). "Reload from Google Sheet" (`loadCloudState`) overwrites local from the cloud (confirmed).

---

## Dual currency

Amounts are stored as `debitUsd`/`debitLbp`/`creditUsd`/`creditLbp`. The entry form uses a **single Amount field + a USD/LBP currency toggle** (`readFormAmount()` routes to the right field). `toUsd(usd, lbp)` converts via `getConversionRate()` (default 89500). KPIs display USD.

---

## Statements, receipts, exports

- Tenant statement PDF (`buildTenantStatementPdf`) is **multi-page** (`buildMultiPagePdf`), skips empty months, and shows a non-zero-only summary.
- Receipts (`buildReceiptLayoutPdf`), ledger PDF, and ledger XLSX (`buildLedgerXlsx`) are all hand-built. `pdfSafeText` keeps non-Latin text (rendered as images) and folds accented Latin to plain letters.

---

## Adding a feature — checklist

1. **HTML**: add elements/dialogs to `index.html` (dialogs as `<dialog>`).
2. **els**: add refs to the `els` object.
3. **State**: add to `hydrateState()` with a safe default so old data doesn't break.
4. **Sync**: if it's a new top-level collection, add it to `mergeStates()` so multi-device sync handles it.
5. **Render**: add/update a `render*()` and call from `renderAll()`.
6. **Events**: wire in `attachEvents()`.
7. **saveState** after every mutation.
8. **Version**: bump all THREE version locations.

---

## Running locally & deploying

```powershell
node .\local-server.js   # http://localhost:4180
```
Deploy from inside the `Building Account tracker` folder: `vercel --prod --yes`. Production alias: `building-account-tracker.vercel.app`. The repo is public — keep credentials and real resident data out of committed files.

---

## Things to avoid

- **No `innerHTML` with user values** — use `.textContent` / created nodes.
- **No external runtime libraries**; **do not split `app.js`**.
- **No plaintext passwords/PINs** — always hash with the salt.
- **Do not hardcode the Apps Script URL / Sheet ID / Drive folder** anywhere (seed.json, app.js, .gs). They are owner-entered in Settings.
- **Do not commit** `Naccache 1727 rev3.xlsx`, `*-backup-*.json`, or `tools/clean-sheet.mjs` (all gitignored — they hold real data or the live URL).
- **No `alert()`** — use `showToast(message)`. Reserve `confirm()` for destructive actions.
- When testing in a browser that has cloud config saved, you will sync to the **live Sheet** — isolate tests with a blank-cloud local state.
