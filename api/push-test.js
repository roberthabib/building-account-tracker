const fs = require("node:fs");
const path = require("node:path");
const webpush = require("web-push");

// "Send a test" in More → Phone notifications. The phone posts its own push
// subscription; after a short wait (so the person can leave the app and see
// how it pops up) this sends one fixed test message to that subscription only
// and reports what the phone's push service answered. Only signed-in people
// (manager, tenants, concierge) may use it, and only real push services are
// accepted as endpoints.

const PUSH_HOSTS = [/^fcm\.googleapis\.com$/, /\.push\.services\.mozilla\.com$/, /\.notify\.windows\.com$/, /\.push\.apple\.com$/];

function loadConfig() {
  if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
    return { url: process.env.SUPABASE_URL, key: process.env.SUPABASE_ANON_KEY };
  }
  const text = fs.readFileSync(path.join(__dirname, "..", "src", "cloud-config.js"), "utf8");
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

async function signedIn(authorization) {
  const token = String(authorization || "").replace(/^Bearer\s+/i, "");
  if (!token) return false;
  const config = loadConfig();
  if (token === config.key) return false;
  const res = await fetch(`${config.url}/auth/v1/user`, { headers: { apikey: config.key, Authorization: `Bearer ${token}` } });
  return res.ok;
}

function validSubscription(sub) {
  if (!sub || typeof sub.endpoint !== "string" || !sub.keys?.p256dh || !sub.keys?.auth) return false;
  try {
    const url = new URL(sub.endpoint);
    return url.protocol === "https:" && PUSH_HOSTS.some((re) => re.test(url.hostname));
  } catch {
    return false;
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return sendJson(res, 405, { ok: false, error: "POST only" });
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return sendJson(res, 500, { ok: false, error: "VAPID keys are not configured" });

  let body;
  try {
    body = await readBody(req);
  } catch {
    return sendJson(res, 400, { ok: false, error: "bad request" });
  }
  try {
    if (!(await signedIn(req.headers.authorization))) return sendJson(res, 401, { ok: false, error: "Sign in first" });
  } catch (error) {
    return sendJson(res, 502, { ok: false, error: error.message });
  }
  const subscription = body.subscription;
  if (!validSubscription(subscription)) return sendJson(res, 400, { ok: false, error: "bad subscription" });

  const ar = body.lang === "ar";
  const payload = JSON.stringify({
    title: ar ? "إشعار تجريبي" : "Test notification",
    body: ar ? "هكذا ستظهر إشعارات المبنى على هذا الهاتف." : "This is how the building's notifications will appear on this phone.",
    tag: "test",
    url: "/",
  });
  await new Promise((resolve) => setTimeout(resolve, 5000));
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "https://building-account-tracker.vercel.app", publicKey, privateKey);
  try {
    const result = await webpush.sendNotification(subscription, payload, { TTL: 600, urgency: "high" });
    console.log(JSON.stringify({ test: true, status: result.statusCode, host: new URL(subscription.endpoint).hostname }));
    return sendJson(res, 200, { ok: true, status: result.statusCode });
  } catch (error) {
    console.log(JSON.stringify({ test: true, failed: error.statusCode || null, message: String(error.body || error.message).slice(0, 200) }));
    return sendJson(res, 200, { ok: false, status: error.statusCode || null, error: String(error.body || error.message).slice(0, 200) });
  }
};
