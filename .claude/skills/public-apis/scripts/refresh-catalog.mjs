#!/usr/bin/env node
// Re-fetch the upstream public-apis README and rebuild references/apis.json.
// Usage: node scripts/refresh-catalog.mjs
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const SRC = "https://raw.githubusercontent.com/public-apis/public-apis/master/README.md";
const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, "..", "references", "apis.json");

const res = await fetch(SRC);
if (!res.ok) { console.error(`fetch failed: HTTP ${res.status}`); process.exit(1); }
const md = await res.text();

const rows = [];
let category = null, inIndex = false;
for (const line of md.split(/\r?\n/)) {
  const head = /^#{2,3}\s+(.+?)\s*$/.exec(line);
  if (head) {
    category = head[1].replace(/\[|\]|\(.*?\)/g, "").trim();
    inIndex = /^index$/i.test(category);
    continue;
  }
  if (!category || inIndex || !line.startsWith("|")) continue;
  if (/^\|\s*:?-{3,}/.test(line)) continue;

  const cells = [];
  let buf = "", p = 0, b = 0;
  for (const ch of line.slice(1)) {
    if (ch === "(") p++; else if (ch === ")") p--;
    else if (ch === "[") b++; else if (ch === "]") b--;
    if (ch === "|" && p === 0 && b === 0) { cells.push(buf); buf = ""; continue; }
    buf += ch;
  }
  if (buf.trim()) cells.push(buf);
  const c = cells.map((s) => s.trim());
  if (c.length < 5 || /^API$/i.test(c[0]) || /<img/i.test(c[2])) continue;

  const link = /^\[(.+?)\]\((.+?)\)$/s.exec(c[0]);
  if (!link) continue;
  const norm = (v) => {
    const s = v.replace(/`/g, "").trim();
    return s === "" || s.toLowerCase() === "no" ? "No" : s;
  };
  rows.push({
    name: link[1].trim(),
    url: link[2].trim(),
    category,
    description: c[1].replace(/\s+/g, " ").trim(),
    auth: norm(c[2]),
    https: c[3].replace(/`/g, "").trim(),
    cors: c[4].replace(/`/g, "").trim(),
  });
}

const categories = [...new Set(rows.map((r) => r.category))].sort();
writeFileSync(out, JSON.stringify({
  source: "https://github.com/public-apis/public-apis",
  license: "MIT (catalog data); each API has its own terms",
  fetchedAt: new Date().toISOString().slice(0, 10),
  count: rows.length,
  categories,
  apis: rows,
}, null, 0) + "\n");

console.log(`wrote ${rows.length} APIs in ${categories.length} categories to ${out}`);
