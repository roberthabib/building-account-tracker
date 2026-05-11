# Naccache 1727 Building Account Tracker — Claude Instructions

## What this app is

A mobile-first progressive web app (PWA) for managing the accounts of a residential building (Naccache 1727). It tracks tenant monthly payments, expenses, and cash position. It runs entirely in the browser with local storage, optional Google Sheet backup, and invoice photo upload to Google Drive.

---

## File map

```
index.html              All HTML markup, dialog templates, bottom navigation
src/app.js              All application logic — single file, ~2800 lines, vanilla ES modules
src/styles.css          All CSS, mobile-first, CSS custom properties for theming
data/seed.json          Seed data extracted from Naccache 1727 rev3.xlsx
sw.js                   Service worker — offline app shell, cache-first strategy
manifest.json           PWA manifest
api/upload-invoice.js   Vercel serverless function — uploads invoice images to Google Drive
google-sheet-sync-only.gs           Google Apps Script for Google Sheet sync (no Drive)
google-drive-invoice-upload.gs      Google Apps Script with Drive invoice upload
local-server.js         Local dev server on port 4180
tools/extract-seed.mjs  Regenerates data/seed.json from the Excel workbook
tools/smoke-test.mjs    Basic smoke tests
vercel.json             Vercel deployment config (cleanUrls, Cache-Control for sw.js)
```

---

## Architecture

- **No framework, no build step.** Pure vanilla JavaScript ES modules loaded directly from `index.html`.
- **Single JS file:** all logic lives in `src/app.js`. Do not split it into multiple files.
- **Single CSS file:** all styles in `src/styles.css`.
- **State is a plain JS object** held in the global `state` variable, persisted to `localStorage` under the key `building-account-tracker:v1`.
- **DOM refs** are all cached at boot in the `els` object (see top of `app.js`). Use `els.*` for all element access; do not call `document.querySelector` inline elsewhere.
- **Rendering** is done entirely by DOM manipulation — `replaceChildren`, `createElement`, `textContent`. No template literals that set `innerHTML` for user-controlled values (XSS risk). Titles and labels use `.textContent`.
- **No external runtime dependencies** loaded at runtime. Excel export (XLSX), PDF generation, and ZIP building are all hand-rolled in `app.js`.

---

## App version

The app version is stored in **two places** — both must be updated together when bumping:
1. `const APP_VERSION = "v43";` in `src/app.js`
2. `<h1>BUILDING ACCOUNT TRACKER v43</h1>` in `index.html`

---

## State schema

```js
{
  building: {
    name: string,           // e.g. "Naccache 1727"
    version: string,
    sourceWorkbook: string,
    importedAt: string,     // ISO timestamp
  },
  settings: {
    defaultDueUsd: number,        // default monthly rent in USD
    lbpPerUsd: number,            // LBP/USD conversion rate (default 89500)
    invoiceUploadUrl: string,     // Google Apps Script web app URL
    cloudSpreadsheetId: string,   // Google Sheet ID
    invoiceUploadFolderId: string,// Google Drive folder ID for invoices
  },
  tenants: [{ id, name, unit, active }],
  transactions: [Transaction],    // see Transaction schema below
  monthlyExpected: [{ month: "YYYY-MM-01", expectedUsd: number }],
  projects: [{ id, name }],       // known project names
  suppliers: [{ id, name }],      // known supplier names
  categories: string[],           // derived — do not store manually
}
```

### Transaction schema

```js
{
  id: string,                   // "tx-{timestamp}" or "pay-{timestamp}-01"
  category: string,             // "Opening Balance" | "Payments" | "Expenses"
  description: string,
  tenantId: string | null,
  forMonth: string | null,      // "YYYY-MM-01" — only for monthly Payments
  project: string,              // non-empty for project payments (not monthly)
  date: string,                 // "YYYY-MM-DD"
  supplier: string,             // expenses only
  invoice: string,              // expenses only, e.g. "INV0004"
  debitUsd: number,
  debitLbp: number,
  creditUsd: number,
  creditLbp: number,
  balanceUsd: number,           // legacy field; use creditUsd/debitUsd for new logic
  balanceLbp: number,           // legacy field
  invoiceAttachment: null | {
    fileName, mimeType, size,
    driveFileId, driveUrl, uploadedAt,
  },
  sourceRow: number | null,     // row number from original Excel (seed data only)
  receiptRef: string,           // "RCT-YYYYMMDD-0001" — auto-assigned for payments
  paymentGroupId: string,       // groups multi-month payment allocations
}
```

---

## Key constants (app.js)

| Constant | Value | Purpose |
|---|---|---|
| `STORAGE_KEY` | `"building-account-tracker:v1"` | localStorage key |
| `APP_VERSION` | `"v43"` | shown in header, receipts, PDFs |
| `DEFAULT_LBP_PER_USD` | `89500` | fallback conversion rate |
| `EXPENSE_INVOICE_PREFIX` | `"INV"` | prefix for auto-numbered invoices |
| `INVOICE_IMAGE_MAX_EDGE` | `1800` | max px edge for compressed invoices |
| `INVOICE_IMAGE_QUALITY` | `0.82` | JPEG quality for compressed invoices |
| `INVOICE_UPLOAD_MAX_BYTES` | `3 * 1024 * 1024` | 3 MB upload limit |
| `SERVER_INVOICE_UPLOAD_PATH` | `"/api/upload-invoice"` | Vercel API endpoint |

---

## Core functions to know

| Function | What it does |
|---|---|
| `boot()` | Entry point — loads seed, loads localStorage, renders everything |
| `hydrateState(raw)` | Normalises raw state from storage or Sheet, fills defaults |
| `saveState(opts)` | Saves to localStorage; queues cloud save unless `opts.sync=false` |
| `renderAll()` | Re-renders all five views — call after any state change |
| `renderDashboard()` | KPI cards, tenant collection status, monthly activity summary |
| `renderPayments()` | Monthly payment matrix and per-month history |
| `renderTenants()` | Tenant account cards with totals |
| `renderLedger()` | Filtered transaction list with export buttons |
| `renderSettings()` | Settings form values and cloud sync status |
| `queueCloudSave()` | Debounces cloud sync (900 ms) — called by `saveState` |
| `allocateMonthlyPayment(amountUsd, startMonth)` | Splits a lump payment across consecutive months |
| `createTransactionsFromForm()` | Builds transaction object(s) from the dialog form |
| `getPositionTotals()` | Returns `{cashUsd, receivableUsd, advanceLiabilityUsd, netPositionUsd}` |
| `getTenantTotals(tenantId)` | Returns `{paidUsd, advanceUsd, dueUsd}` for a tenant |
| `paymentStatus(tenantId, month)` | Returns `{label, className, paid, expected}` for dashboard pills |
| `ensureReceiptReference(tx)` | Assigns `RCT-YYYYMMDD-XXXX` reference if missing |
| `buildSimplePdf(lines)` | Hand-built PDF blob from line objects (used for receipts) |
| `buildLedgerXlsx()` | Hand-built XLSX blob for ledger export |

---

## Views and navigation

Five views, switched by bottom navigation buttons (`data-view` attribute):
- **dashboardView** — KPIs, collection progress, monthly activity
- **paymentsView** — per-tenant payment status + month history
- **tenantsView** — tenant account cards + "Print Statement" per tenant
- **ledgerView** — filterable transaction list, Excel/PDF export
- **settingsView** — building config, Google sync, reset/zero options

Both `monthSelect` (Dashboard) and `paymentMonthSelect` (Payments) share the `selectedMonth` global variable.

---

## Transaction categories

- **Opening Balance** — initial cash entry
- **Payments** — tenant monthly rent (`forMonth` set, no `project`) or project payment (`project` set, no `forMonth`)
- **Expenses** — debit entries; have `supplier`, `invoice`, optional `invoiceAttachment`
- **Advance Payments** — legacy category; still handled but no longer created by the form

A "monthly payment" satisfies: `category === "Payments" && tenantId && forMonth && !project`
A "project payment" satisfies: `category === "Payments" && tenantId && project`

---

## Payment allocation logic

When a tenant pays more than one month's rent, `allocateMonthlyPayment()` splits the amount across consecutive months starting from `forMonth`. Each allocation becomes a separate transaction in the same `paymentGroupId`, all sharing the same `receiptRef`. This is automatic — a $300 payment for a $150/month building creates two transactions.

---

## Receipt references

Format: `RCT-YYYYMMDD-0001` (date from `transaction.date`, sequence padded to 4 digits).
Assigned by `ensureReceiptReference()`. Transactions in the same `paymentGroupId` share a receipt ref. Assigned lazily when printing or on boot via `ensureAllReceiptReferences()`.

---

## Invoice numbering

Expense invoices auto-increment: `INV0001`, `INV0002`, etc. The number is suggested when the form opens for a new expense and can be manually overridden. The next number is derived from the highest `expenseInvoiceSequenceNumber()` across all existing expenses.

---

## Dual currency

The app operates in both USD and LBP. Amounts are stored separately (`debitUsd`, `debitLbp`, `creditUsd`, `creditLbp`). All financial summaries convert LBP to USD using `getConversionRate()` (from settings, default 89500). `toUsd(usd, lbp)` is the central conversion helper. Financial KPIs are always displayed in USD.

---

## Cloud sync

1. **Google Sheet** — via `postCloudAction("saveState", { state })` which POSTs to the configured Apps Script URL. Triggered automatically (debounced 900 ms) after every `saveState()`.
2. **Invoice upload** — via Vercel serverless `api/upload-invoice.js` when on HTTPS, or via Apps Script when on HTTP. Requires `invoiceUploadFolderId` in settings.
3. **Restore** — `loadCloudState()` fetches from the Sheet and overwrites local storage. Manual only.

---

## Adding a new feature — checklist

1. **HTML**: Add any new elements or dialogs to `index.html`. Keep dialogs as `<dialog>` elements.
2. **els**: Add new element refs to the `els` object at the top of `app.js`.
3. **State**: If storing new data, add it to `hydrateState()` with a safe default (so old stored data doesn't break).
4. **Render**: If the feature affects a view, update or add a `render*()` function. Call it from `renderAll()` if needed.
5. **Events**: Wire up event listeners in `attachEvents()`.
6. **saveState**: Call `saveState()` after every state mutation.
7. **Version**: Bump `APP_VERSION` in `app.js` and the `<h1>` in `index.html`.

---

## CSS conventions

- All colors via CSS custom properties defined in `:root` (see top of `styles.css`).
- Mobile-first, `max-width: 1180px` container for desktop.
- Card components: `.panel`, `.kpi`, `.tenant-card`, `.tenant-payment-card`, `.ledger-row`.
- Status pills: `.status-pill.status-paid`, `.status-partial`, `.status-due`, `.status-none`.
- Print styles are scoped with `@media print` — `#printStatement` is the print container.

---

## Running locally

```powershell
node .\local-server.js
# then open http://localhost:4180
```

For phone testing on the same Wi-Fi, use the machine's IP instead of `localhost`.

---

## Deployment

Deployed to Vercel. `vercel.json` sets `cleanUrls: true` and disables caching on `sw.js`. The Vercel serverless function at `api/upload-invoice.js` handles invoice uploads (requires Google OAuth environment variables set in Vercel).

---

## Seed data

`data/seed.json` is the factory-reset snapshot seeded from `Naccache 1727 rev3.xlsx`. To regenerate it:
```powershell
node .\tools\extract-seed.mjs
```
The seed is loaded fresh on every `boot()` and used as the reset target when the user presses "Reset Data".

---

## Things to avoid

- **Do not use innerHTML with user-supplied values** — use `.textContent` or create elements programmatically.
- **Do not add external runtime JS libraries** — the app deliberately has no runtime dependencies.
- **Do not split app.js into modules** — it is intentionally one file.
- **Do not use sessionStorage or indexedDB for primary state** — localStorage is the source of truth.
- **Do not remove the `seedState` variable** — it is what "Reset Data" restores to.
- **Do not use `alert()` for user messages** — use `showToast(message)` instead.
- **Do not use `confirm()` except for destructive actions** (delete, reset, zero accounts) — this pattern already exists and is intentional.
