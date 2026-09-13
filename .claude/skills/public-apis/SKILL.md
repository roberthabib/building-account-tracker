---
name: public-apis
description: Find and use a free/public web API from the public-apis catalog (1,778 APIs in 51 categories). Use when you need an external data source and do not already know which service to call, when the user asks "is there an API for X", or when picking an API by its key/auth, HTTPS and CORS requirements. Covers currency exchange, weather, geocoding, finance, government/open data, phone/email validation, and more.
---

# Public APIs catalog

A local, searchable copy of the [public-apis/public-apis](https://github.com/public-apis/public-apis)
directory: **1,778 APIs across 51 categories**, each with its auth requirement, HTTPS support and
CORS support. Catalog data is MIT licensed; every listed API carries its own separate terms.

## Finding an API

Always search the catalog before assuming an API exists or guessing an endpoint. The catalog gives
you the service and its docs URL, not the endpoint shapes, so read the linked docs before writing
any call.

```bash
node .claude/skills/public-apis/scripts/find-api.mjs --categories        # list all 51 categories
node .claude/skills/public-apis/scripts/find-api.mjs exchange rate       # keyword search
node .claude/skills/public-apis/scripts/find-api.mjs --category Weather --no-auth --cors
node .claude/skills/public-apis/scripts/find-api.mjs geocode --https --limit 5 --json
```

| Flag | Effect |
|---|---|
| `--category <name>` | Restrict to a category (substring, case-insensitive) |
| `--no-auth` | Only APIs needing no key or token |
| `--https` | Only APIs served over HTTPS |
| `--cors` | Only APIs that advertise CORS support |
| `--limit <n>` | Cap results (default 25, `0` for all) |
| `--categories` | List categories with counts, then exit |
| `--json` | Raw JSON instead of the readable table |

Keywords are ANDed against name, description and category; matches on the name rank highest.

## Reading the three qualifier fields

These decide whether an API is usable at all for a given job, so filter on them before shortlisting.

- **`auth`** is `No`, `apiKey`, `OAuth`, `X-Mashape-Key` or `User-Agent`. Anything other than `No`
  or `User-Agent` means the user must supply a credential. Never invent, guess or hardcode a key.
  Ask the user for it and read it from an environment variable or from settings the user enters.
- **`https`** is `Yes` or `No`. Treat `No` as unusable from this app: the PWA is served over HTTPS
  and browsers block mixed content.
- **`cors`** is `Yes`, `No` or `Unknown`. Only `Yes` is safe to `fetch()` directly from browser code
  in `src/app.js`. `No` or `Unknown` means the call needs a server-side hop, which in this repo
  means a Vercel function under `api/` alongside `api/upload-invoice.js`.

## Network access in this session

This remote session's egress proxy denies CONNECT to arbitrary hosts (`api.frankfurter.app` and
`api.open-meteo.com` both returned 403 when verified). GitHub and package registries are reachable;
general API hosts are not. Practical consequences:

- You can search the catalog and read docs on GitHub, but you usually cannot smoke-test a live call
  from here. Say so plainly rather than claiming an untested call works.
- Code you write for an API still runs fine where it is meant to run: the user's browser, a Vercel
  function, or a local `node local-server.js` session.
- To allow live calls from remote sessions, the user changes the network policy on the Claude Code
  on the web environment. See https://code.claude.com/docs/en/claude-code-on-the-web.

Run `curl -sS "$HTTPS_PROXY/__agentproxy/status"` to see the current policy and recent denials.

## Using an API inside this repo

The tracker's own rules in `CLAUDE.md` still apply and they constrain API work specifically:

- **No external runtime libraries.** Use the built-in `fetch`, never an SDK or HTTP client package.
- **No hardcoded credentials or service URLs** in `seed.json`, `src/app.js` or the `.gs` files.
  Anything account-specific is entered by the owner in Settings and lives in `state.settings`,
  the way `invoiceUploadUrl` and `cloudSpreadsheetId` already do.
- **No `innerHTML` with fetched values.** API responses are user-controlled data; render them with
  `.textContent` or created nodes.
- The app must keep working **offline**. Every call needs a timeout, a `try`/`catch`, and a fallback
  to the stored value. A failed fetch shows `showToast(...)` and changes nothing else.
- New persisted fields get a safe default in `hydrateState()`, and a new top-level collection must
  be added to `mergeStates()`. Bump `APP_VERSION` in `src/app.js` and `CACHE_NAME` in `sw.js`.

## Refreshing the catalog

The upstream list changes often. To pull the current version:

```bash
node .claude/skills/public-apis/scripts/refresh-catalog.mjs
```

It re-fetches the upstream README, re-parses it and rewrites `references/apis.json` (which records
its own `fetchedAt` date). Sponsored header rows and the index table are skipped by the parser.
