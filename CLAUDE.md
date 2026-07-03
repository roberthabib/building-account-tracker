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

When adding UI text: static markup gets a `data-i18n*` attribute + an `I18N` entry; JS-built text gets wrapped in `tr("English", {params})` + a `DYN_AR` entry. Category/status values that double as **stored data** (e.g. `"Payments"`, `"Expenses"`) are only ever translated at display time — never change the stored value. Generated **PDF statements/receipts stay English** (the hand-rolled PDF engine has no Arabic shaping/bidi).

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
- Receipts (`buildReceiptLayoutPdf`), ledger PDF, and ledger XLSX (`buildLedgerXlsx`) are all hand-built. `pdfSafeText` strips non-ASCII (no Arabic glyphs in the base PDF fonts yet).

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
