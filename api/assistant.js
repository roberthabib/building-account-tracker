const fs = require("node:fs");
const path = require("node:path");
const AnthropicModule = require("@anthropic-ai/sdk");

const Anthropic = AnthropicModule.default || AnthropicModule.Anthropic || AnthropicModule;

// "Ask the app" and "Say it" with Claude. Only the signed-in building owner
// (or a view-only administrator) may call it, checked with the caller's own
// Supabase session, so the API key can't be used by anyone else.
//
// GET  -> { configured }  (the app hides both features until a key is set)
// POST { mode: "ask", question, language, data }          -> { answer }
// POST { mode: "entry", text, language, today, tenants, categories }
//      -> { kind, unit, amount, currency, month, method, description, supplier, expenseCategory }
//
// Needs ANTHROPIC_API_KEY in the Vercel environment.

const MODEL = "claude-opus-5-5";
const MAX_DATA_CHARS = 1_500_000;

const ENTRY_SCHEMA = {
  type: "object",
  properties: {
    kind: { type: "string", enum: ["payment", "expense", "other_income", "none"], description: "payment = a tenant paid; expense = the building spent; other_income = money in that isn't a tenant's dues; none = unclear." },
    unit: { type: "string", description: "For a payment: the unit of the tenant who paid, exactly as in the list, or an empty string." },
    amount: { type: "number", description: "The amount as a plain number, 0 if not said." },
    currency: { type: "string", enum: ["USD", "LBP"], description: "LBP for Lebanese pounds (lira, ليرة, LL), otherwise USD." },
    month: { type: "string", description: "The month the payment is for, as YYYY-MM, or an empty string." },
    method: { type: "string", enum: ["cash", "bank", "omt", "whish", "cheque", ""], description: "How a payment was made, or an empty string." },
    description: { type: "string", description: "For an expense: a few words saying what it was for." },
    supplier: { type: "string", description: "For an expense: who was paid, or an empty string." },
    expenseCategory: { type: "string", description: "For an expense: one of the given categories if one fits, else an empty string." },
  },
  required: ["kind", "unit", "amount", "currency", "month", "method", "description", "supplier", "expenseCategory"],
  additionalProperties: false,
};

function loadSupabase() {
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

async function callerIsAdmin(authorization) {
  const token = String(authorization || "").replace(/^Bearer\s+/i, "");
  if (!token) return false;
  const supabase = loadSupabase();
  const headers = { apikey: supabase.key, Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  const res = await fetch(`${supabase.url}/rest/v1/rpc/my_admin_role`, { method: "POST", headers, body: "{}" });
  if (!res.ok) return false;
  const role = await res.json();
  return role === "owner" || role === "viewer";
}

function textOf(response) {
  return response.content.filter((block) => block.type === "text").map((block) => block.text).join("\n").trim();
}

async function ask(client, body) {
  const question = String(body.question || "").trim().slice(0, 500);
  const data = JSON.stringify(body.data || {});
  if (!question) return { status: 400, body: { error: "Ask a question" } };
  if (data.length > MAX_DATA_CHARS) return { status: 413, body: { error: "The building's data is too large to send" } };
  const arabic = body.language === "ar";
  const response = await client.beta.messages.create({
    model: MODEL,
    max_tokens: 4000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    thinking: { type: "adaptive" },
    output_config: { effort: "medium" },
    system: "You answer a residential building manager's questions about the building's accounts in Lebanon. "
      + "Use only the JSON data given. Entries: d = date, c = category, usd = signed amount in USD (money in positive, money out negative), "
      + "what = description, who = tenant, cat = expense category or service, sup = supplier, m = month a payment or service is for, p = project. "
      + "tenants[].owesUsd is what each tenant owes today (negative = in credit). cashUsd is the building's cash today. "
      + "If the data can't answer the question, say so plainly. Give amounts in USD with two decimals. "
      + `Answer ${arabic ? "in Arabic" : "in English"}, in a few short lines of plain text, without tables or markdown.`,
    messages: [{ role: "user", content: `Building data:\n${data}\n\nQuestion: ${question}` }],
  });
  if (response.stop_reason === "refusal") return { status: 422, body: { error: "That question can't be answered" } };
  return { status: 200, body: { answer: textOf(response).slice(0, 4000) } };
}

async function entry(client, body) {
  const text = String(body.text || "").trim().slice(0, 300);
  if (!text) return { status: 400, body: { error: "Say what happened" } };
  const tenants = (Array.isArray(body.tenants) ? body.tenants : []).slice(0, 200).map((t) => `${String(t.unit || "").slice(0, 20)}: ${String(t.name || "").slice(0, 60)}`).join("\n");
  const categories = (Array.isArray(body.categories) ? body.categories : []).slice(0, 60).map((c) => String(c).slice(0, 60)).join(", ");
  const response = await client.beta.messages.create({
    model: MODEL,
    max_tokens: 2000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "low", format: { type: "json_schema", schema: ENTRY_SCHEMA } },
    messages: [{
      role: "user",
      content: `A building manager in Lebanon said (in English, Arabic or Lebanese Arabic): "${text}"\n\n`
        + `Today is ${String(body.today || "").slice(0, 10)}. Tenants (unit: name):\n${tenants || "(none)"}\n\n`
        + `Expense categories in use: ${categories || "(none)"}\n\n`
        + "Turn it into one entry for the accounts form. Match the tenant by name to their unit. Leave a field empty rather than guessing.",
    }],
  });
  if (response.stop_reason === "refusal") return { status: 422, body: { error: "That couldn't be understood" } };
  const f = JSON.parse(textOf(response));
  return {
    status: 200,
    body: {
      kind: ["payment", "expense", "other_income"].includes(f.kind) ? f.kind : "none",
      unit: String(f.unit || "").slice(0, 20),
      amount: Number(f.amount) > 0 ? Number(f.amount) : 0,
      currency: f.currency === "LBP" ? "LBP" : "USD",
      month: /^\d{4}-\d{2}$/.test(f.month || "") ? f.month : "",
      method: ["cash", "bank", "omt", "whish", "cheque"].includes(f.method) ? f.method : "",
      description: String(f.description || "").slice(0, 160),
      supplier: String(f.supplier || "").slice(0, 120),
      expenseCategory: String(f.expenseCategory || "").slice(0, 80),
    },
  };
}

module.exports = async function handler(req, res) {
  const configured = Boolean(process.env.ANTHROPIC_API_KEY);
  if (req.method === "GET") return sendJson(res, 200, { configured });
  if (req.method !== "POST") return sendJson(res, 405, { error: "POST only" });
  if (!configured) return sendJson(res, 503, { error: "The assistant is not set up yet" });

  try {
    if (!(await callerIsAdmin(req.headers.authorization))) return sendJson(res, 401, { error: "Only the building's administrators can use the assistant" });
  } catch {
    return sendJson(res, 502, { error: "Could not check your sign-in" });
  }

  let body;
  try {
    body = await readBody(req);
  } catch {
    return sendJson(res, 400, { error: "bad request" });
  }

  const client = new Anthropic();
  try {
    const out = body.mode === "entry" ? await entry(client, body) : await ask(client, body);
    return sendJson(res, out.status, out.body);
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) return sendJson(res, 429, { error: "Too many requests, try again in a minute" });
    if (error instanceof Anthropic.AuthenticationError) return sendJson(res, 503, { error: "The assistant's key is not valid" });
    if (error instanceof Anthropic.APIError) return sendJson(res, 502, { error: `The assistant failed (${error.status})` });
    if (error instanceof SyntaxError) return sendJson(res, 502, { error: "That couldn't be understood" });
    return sendJson(res, 502, { error: "The assistant failed" });
  }
};
