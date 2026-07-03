# Building Account Tracker

A mobile-first progressive web app for managing a residential building's finances — tenant dues and payments, expenses, shared services (generator + water), building projects, and cash/reserve position. Runs in the browser on local storage, with optional Google Sheet sync and invoice-photo upload to Google Drive. Two roles: **owner** (full access) and **tenant** (read-only, PIN login).

## Features

- **Dashboard** with a "Needs Attention" strip (overdue tenants, generator months awaiting readings, low reserve) and KPI cards (Cash/Reserve, Total Expenses, Outstanding, Net Position).
- **Two collection modes:**
  - *Split actual monthly expenses* — tenants owe their share of recorded expenses.
  - *Fixed monthly amount + reserve fund* — tenants owe a set amount; surplus builds a reserve.
- **Coefficient-based splitting** — per-tenant coefficient (X/1000) for proportional shares; otherwise equal.
- **Payments & monthly status** per tenant, with multi-month allocation, receipts, and WhatsApp reminders.
- **Expenses** with supplier/category autocomplete, sequential invoice numbers, and invoice-photo upload.
- **Services tab:**
  - *Generator* — log diesel/maintenance costs progressively; enter monthly meter readings to split fuel by kWh and maintenance pro-rata by breaker size.
  - *Water* — split each tanker equally or by coefficient.
- **Per-tenant opening balances** (carry-in arrears or prepaid credit), separate from building cash.
- **Building projects** with per-tenant shares and collection tracking; **polls** with voting.
- **Ledger** with category/expense-category/text/date filters; Excel and multi-page PDF export.
- **Tenant statements** (multi-page PDF) and payment receipts.
- **Bilingual (English / Arabic)** with full right-to-left layout; pick the language in the setup wizard or Settings and the whole UI — including WhatsApp reminder messages — switches instantly.
- **Single amount field + USD/LBP currency toggle**; all figures reconciled to USD.
- **Backup & restore:** one-tap JSON backup/restore on the device, plus Google Sheet cloud sync with multi-device conflict merging and a header sync-status indicator.
- **Access control:** owner password and tenant PINs stored as salted hashes; tenants onboard a new device by pasting an access code.
- Installable PWA with an offline app shell.

## Run locally

```powershell
node .\local-server.js
```

Then open `http://localhost:4180`. For phone testing on the same Wi-Fi, use the computer's IP instead of `localhost`. (The dev server also serves `.pdf` files inline, handy for checking generated statements.)

## Install as a phone app

Deploy to a public HTTPS host (this project uses Vercel: `vercel --prod` from inside the project folder), open the URL on the phone, then:

- Android Chrome: menu → `Add to Home screen` / `Install app`.
- iPhone Safari: Share → `Add to Home Screen`.

Open it from the home-screen icon afterwards.

## First-time setup

On first launch the **Setup wizard** collects the language (English/Arabic), building name, owner password, collection mode, monthly budget / LBP rate, and tenants (with coefficient, breaker size, phone, and PIN). You can re-run it any time from **Settings → App Setup → Setup wizard**, and change the language any time in **Settings → Building Details → Language**.

## Google Sheet cloud sync (optional)

Sync keeps a backup in a Google Sheet and lets multiple devices share data.

1. Create a Google Sheet for the building. Copy its **Sheet ID** from the URL.
2. In the Sheet: **Extensions → Apps Script**, paste `google-sheet-sync-only.gs`, and **Deploy → New deployment → Web app** (Execute as: Me; Who has access: Anyone). Copy the `/exec` URL.
3. In the app: **Settings → Google Integration** → paste the Apps Script URL and Sheet ID → **Save**.
4. *(Recommended)* Set a shared secret: add a Script Property `SYNC_SECRET` in Apps Script, and the same value in **Settings → Sync secret**. Requests without it are then rejected, so a leaked URL alone is useless.
5. The header chip shows **Saved / Saving / Error / Offline**. Data is saved locally first and synced automatically.

### Onboarding tenants / new devices

In **Settings → Share access**, copy the access code and send it to the tenant. On their phone they tap **"Connect to a building"** on the login screen and paste it — this configures sync and downloads the data, then they log in with their PIN.

### Invoice photo upload (optional)

On HTTPS, invoice photos upload through the Vercel function `api/upload-invoice.js` to a Drive folder (set the folder ID in Settings). Configure these Vercel environment variables (personal Gmail Drive):

- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`, `GOOGLE_DRIVE_FOLDER_ID`

Workspace Shared Drives can instead use `GOOGLE_SERVICE_ACCOUNT_EMAIL` + `GOOGLE_PRIVATE_KEY` + `GOOGLE_DRIVE_FOLDER_ID`. Keep private keys and refresh tokens in Vercel only — never in app Settings.

## Backup & reset

- **Settings → Backup & Restore:** Download Backup (JSON to the device), Restore from a backup file (auto safety-copy first), Reload from Google Sheet.
- **Settings → Reset:** Clear transactions (keep tenants), or Erase everything (start over).

## Notes for maintainers

- `data/seed.json` is an intentionally empty factory-reset template (no real data or credentials).
- Bump the version in two places when releasing: `APP_VERSION` (`src/app.js`, shown in Settings) and `CACHE_NAME` (`sw.js`).
- See `CLAUDE.md` for architecture, state schema, and conventions.
