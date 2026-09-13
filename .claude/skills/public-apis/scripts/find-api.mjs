#!/usr/bin/env node
// Search the bundled public-apis catalog.
// Usage: node scripts/find-api.mjs [keywords...] [flags]
//   --category <name>   restrict to a category (substring, case-insensitive)
//   --no-auth           only APIs that need no key/token  (auth === "No")
//   --https             only APIs served over HTTPS
//   --cors              only APIs that advertise CORS support (browser-callable)
//   --limit <n>         max results (default 25, 0 = all)
//   --categories        list categories and their API counts, then exit
//   --json              emit raw JSON instead of a table

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const db = JSON.parse(readFileSync(join(here, "..", "references", "apis.json"), "utf8"));

const argv = process.argv.slice(2);
const flags = { limit: 25 };
const words = [];
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === "--category") flags.category = argv[++i];
  else if (a === "--limit") flags.limit = Number(argv[++i]);
  else if (a === "--no-auth") flags.noAuth = true;
  else if (a === "--https") flags.https = true;
  else if (a === "--cors") flags.cors = true;
  else if (a === "--json") flags.json = true;
  else if (a === "--categories") flags.categories = true;
  else if (a.startsWith("--")) { console.error(`unknown flag: ${a}`); process.exit(2); }
  else words.push(a.toLowerCase());
}

if (flags.categories) {
  const counts = new Map();
  for (const a of db.apis) counts.set(a.category, (counts.get(a.category) || 0) + 1);
  for (const [name, n] of [...counts].sort((x, y) => y[1] - x[1])) {
    console.log(`${String(n).padStart(4)}  ${name}`);
  }
  console.log(`\n${db.count} APIs, ${counts.size} categories (catalog fetched ${db.fetchedAt})`);
  process.exit(0);
}

let hits = db.apis;
if (flags.category) {
  const c = flags.category.toLowerCase();
  hits = hits.filter((a) => a.category.toLowerCase().includes(c));
}
if (flags.noAuth) hits = hits.filter((a) => a.auth === "No");
if (flags.https) hits = hits.filter((a) => a.https === "Yes");
if (flags.cors) hits = hits.filter((a) => a.cors === "Yes");
if (words.length) {
  hits = hits
    .map((a) => {
      const name = a.name.toLowerCase();
      const hay = `${name} ${a.description.toLowerCase()} ${a.category.toLowerCase()}`;
      let score = 0;
      for (const w of words) {
        if (!hay.includes(w)) return null;
        if (name.includes(w)) score += 2;
        score += 1;
      }
      return { a, score };
    })
    .filter(Boolean)
    .sort((x, y) => y.score - x.score || x.a.name.localeCompare(y.a.name))
    .map((r) => r.a);
}

const total = hits.length;
if (flags.limit > 0) hits = hits.slice(0, flags.limit);

if (flags.json) {
  console.log(JSON.stringify(hits, null, 2));
} else if (!total) {
  console.log("No matches. Try fewer keywords, or --categories to see what exists.");
} else {
  for (const a of hits) {
    console.log(`${a.name}  [${a.category}]`);
    console.log(`  ${a.description}`);
    console.log(`  auth: ${a.auth}   https: ${a.https}   cors: ${a.cors}`);
    console.log(`  ${a.url}`);
    console.log();
  }
  console.log(`${hits.length} of ${total} match${total === 1 ? "" : "es"} shown.`);
}
