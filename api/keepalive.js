const fs = require("node:fs");
const path = require("node:path");

// Keep-alive for the Supabase free plan, which pauses projects that see too
// little database activity over 7 days. A building app is opened a few times a
// month, so it WILL be paused without this. Vercel Cron calls this endpoint
// twice a day (see "crons" in vercel.json; Hobby allows each job once a day).
//
// It can only PREVENT a pause. A project that is already paused stops resolving
// in DNS and must be resumed from the Supabase dashboard; this then reports 503.

// Reads per invocation. Supabase asks for "a few user requests each day";
// 3 per run x 2 runs a day keeps clear of that threshold without being noisy.
const READS_PER_RUN = 3;

// Credentials come from the same gitignored src/cloud-config.js the app uses
// (deployed via .vercelignore, bundled into this function via "includeFiles" in
// vercel.json), so the key still lives in exactly one place. That file is an ES
// module and this function is CommonJS, so read the two values out as text
// rather than importing it. SUPABASE_URL / SUPABASE_ANON_KEY env vars override.
function loadConfig() {
  if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
    return { url: process.env.SUPABASE_URL, key: process.env.SUPABASE_ANON_KEY };
  }
  const file = path.join(__dirname, "..", "src", "cloud-config.js");
  const text = fs.readFileSync(file, "utf8");
  const url = text.match(/supabaseUrl:\s*"([^"]+)"/)?.[1];
  const key = text.match(/supabaseAnonKey:\s*"([^"]+)"/)?.[1];
  if (!url || !key) throw new Error("Supabase URL or key missing from src/cloud-config.js");
  return { url: url.replace(/\/+$/, ""), key };
}

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

module.exports = async function handler(req, res) {
  // Vercel sends "Authorization: Bearer <CRON_SECRET>" on cron calls when that
  // env var is set. Optional: the endpoint only performs tiny reads and returns
  // no data, so leaving it open costs nothing beyond the requests themselves.
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.authorization !== `Bearer ${secret}`) {
    return sendJson(res, 401, { ok: false, error: "unauthorized" });
  }

  let config;
  try {
    config = loadConfig();
  } catch (error) {
    return sendJson(res, 500, { ok: false, error: error.message });
  }

  const statuses = [];
  for (let i = 0; i < READS_PER_RUN; i += 1) {
    try {
      const response = await fetch(`${config.url}/rest/v1/building_state?id=eq.building&select=rev`, {
        headers: { apikey: config.key, Authorization: `Bearer ${config.key}` },
      });
      statuses.push(response.status);
    } catch (error) {
      // DNS failure / connection refused: the project is paused (or gone).
      return sendJson(res, 503, {
        ok: false,
        error: "Database unreachable - the Supabase project is probably paused. Resume it from the dashboard.",
        detail: error.cause?.code || error.message,
        at: new Date().toISOString(),
      });
    }
  }

  // Any answer below 500 came back through Postgres, which is the activity that
  // counts. (A 401/403 would also mean the anon read was revoked — see the
  // keep-alive note in supabase/PHASE2-RUNBOOK.md step 7.)
  const ok = statuses.every((status) => status < 500);
  return sendJson(res, ok ? 200 : 502, { ok, statuses, at: new Date().toISOString() });
};
