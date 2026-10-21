const fs = require("node:fs");
const path = require("node:path");
const webpush = require("web-push");

// Sends phone notifications. The database calls this (pg_net, see
// supabase/phase2f-v148-features.sql) with only a job id; this function then
// claims that job through rpc/claim_push_job, which hands back the message and
// the phones to send it to exactly once, within ten minutes of the job being
// queued. Nothing else is trusted from the request, so no shared secret is
// needed: a stranger can at most trigger a job that was about to be sent.
//
// Needs VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY (Vercel environment variables).

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

async function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") return JSON.parse(req.body || "{}");
  let raw = "";
  for await (const chunk of req) raw += chunk;
  return JSON.parse(raw || "{}");
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return sendJson(res, 405, { ok: false, error: "POST only" });
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return sendJson(res, 500, { ok: false, error: "VAPID keys are not configured" });

  let job;
  try {
    job = String((await readBody(req)).job || "");
  } catch {
    return sendJson(res, 400, { ok: false, error: "bad request" });
  }
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(job)) {
    return sendJson(res, 400, { ok: false, error: "bad job id" });
  }

  let config;
  try {
    config = loadConfig();
  } catch (error) {
    return sendJson(res, 500, { ok: false, error: error.message });
  }
  const headers = { apikey: config.key, Authorization: `Bearer ${config.key}`, "Content-Type": "application/json" };
  const rpc = (name, body) => fetch(`${config.url}/rest/v1/rpc/${name}`, { method: "POST", headers, body: JSON.stringify(body) });

  const claimed = await rpc("claim_push_job", { p_job: job });
  if (!claimed.ok) return sendJson(res, 502, { ok: false, error: `claim failed (${claimed.status})` });
  const data = await claimed.json();
  if (!data || !Array.isArray(data.subscriptions)) return sendJson(res, 200, { ok: true, sent: 0 });

  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "https://building-account-tracker.vercel.app", publicKey, privateKey);
  // A notification about a building other than the first opens that building.
  const building = typeof data.building === "string" && /^[a-z0-9]{1,40}$/.test(data.building) && data.building !== "building" ? data.building : "";
  const payload = JSON.stringify({ title: data.title, body: data.body, url: building ? `/?building=${building}` : "/" });
  let sent = 0;
  let gone = 0;
  const failed = [];
  await Promise.all(
    data.subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(subscription, payload, { TTL: 86400, urgency: "high" });
        sent += 1;
      } catch (error) {
        // 404/410: the phone unsubscribed or the browser data was cleared.
        if (error.statusCode === 404 || error.statusCode === 410) {
          gone += 1;
          await rpc("forget_push_endpoint", { p_job: job, p_endpoint: subscription.endpoint }).catch(() => {});
        } else {
          failed.push({ status: error.statusCode || null, message: String(error.body || error.message).slice(0, 160) });
        }
      }
    }),
  );
  // Shows up in the Vercel logs (vercel logs), so a silent failure can be traced.
  console.log(JSON.stringify({ job, phones: data.subscriptions.length, sent, gone, failed }));
  return sendJson(res, 200, { ok: true, sent, gone, failed: failed.length });
};
