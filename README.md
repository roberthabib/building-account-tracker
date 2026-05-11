# Naccache 1727 Building Account Tracker

Mobile-first building account tracker generated from `Naccache 1727 rev3.xlsx`.

## What is included

- Dashboard for current LBP/USD balances.
- Monthly tenant payment matrix.
- Tenant account cards with paid, advance, and due totals.
- Ledger with category and text filters.
- Excel-compatible ledger export from the current Ledger filter/search.
- Printable PDF ledger export from the current Ledger filter/search.
- Add payment, advance payment, expense, and opening-balance entries.
- Expense invoice numbers are suggested sequentially and can still be edited manually.
- Uploaded invoice photos are named as `YYYY-MM-DD_INV0004_Description.jpg`.
- Invoice photos can be added either by camera capture or by uploading an existing phone photo.
- The expense supplier field can reuse previous supplier names from its dropdown while still accepting new names.
- Ledger entries can be deleted after confirmation.
- Google Apps Script sync to a Google Sheet in Drive, plus server-side invoice picture upload to a Drive folder.
- Local browser storage.
- Offline app shell through `sw.js`.

## Run locally

```powershell
node .\local-server.js
```

Then open:

```text
http://localhost:4180
```

For phone testing on the same Wi-Fi, use the computer IP address instead of `localhost`.

## Run as a phone app

Deploy the folder to a public static host such as Vercel, then open the deployed HTTPS URL on the phone.

To remove the browser URL bar, install it from the phone browser:

- Android Chrome: menu, then `Add to Home screen` or `Install app`.
- iPhone Safari: Share, then `Add to Home Screen`.

After installing, open it from the home screen icon, not from the browser tab.

## Google Drive and Google Sheet sync

If Google shows `This app is blocked`, use `google-sheet-sync-only.gs` first. Install it from inside the Google Sheet with `Extensions > Apps Script`. This lower-permission version syncs the Sheet but does not upload invoice photos to Drive.

1. In Google Drive, create a Google Sheet for the building account.
2. Copy the Sheet ID from the Google Sheet URL.
3. In Google Drive, create or choose a folder for invoice pictures.
4. Copy the folder ID from the folder URL.
5. Create a Google Apps Script project and paste the code from `google-sheet-sync-only.gs`.
6. Deploy it as a Web App with `Execute as: Me` and access set to anyone with the link.
7. Copy the Web App URL into the app Settings as `Google Apps Script URL (Sheet sync)`.
8. Paste the Sheet ID into `Google Sheet ID`.
9. Paste the invoice folder ID into `Google Drive invoice folder ID`.
10. Press `Save`.

Invoice photos are uploaded through the Vercel backend at `api/upload-invoice.js`, not through Apps Script.

For a normal personal Gmail Drive folder, configure these Vercel environment variables:

- `GOOGLE_CLIENT_ID`: OAuth client ID from Google Cloud.
- `GOOGLE_CLIENT_SECRET`: OAuth client secret from Google Cloud.
- `GOOGLE_REFRESH_TOKEN`: refresh token authorized by the Google account that owns the Drive folder.
- `GOOGLE_DRIVE_FOLDER_ID`: the invoice folder ID.

The older service-account method only works with Google Workspace Shared Drives because service accounts do not have storage quota in a normal personal `My Drive` folder. If using a Workspace Shared Drive, configure:

- `GOOGLE_SERVICE_ACCOUNT_EMAIL`: the `client_email` from the service account JSON key.
- `GOOGLE_PRIVATE_KEY`: the `private_key` from the JSON key.
- `GOOGLE_DRIVE_FOLDER_ID`: the invoice folder ID.

Private keys and refresh tokens must stay in Vercel only; do not paste them into the app settings.

The app saves data locally first. When cloud settings are configured, changes are backed up to the Google Sheet automatically. The Sheet includes readable tabs for `Ledger`, `Tenants`, `Monthly Expected`, and `Settings`.

Use `Restore from Sheet` only when setting up a new phone or recovering data. It intentionally stays manual because loading from the Sheet replaces the data currently stored on the device.

When entering an expense, choose or take an invoice picture. The app compresses it, uploads it to Drive, and stores the Drive link in the ledger entry.

## Regenerate Excel seed data

```powershell
node .\tools\extract-seed.mjs
```
