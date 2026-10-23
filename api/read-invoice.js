const fs = require("node:fs");
const path = require("node:path");
const AnthropicModule = require("@anthropic-ai/sdk");

const Anthropic = AnthropicModule.default || AnthropicModule.Anthropic || AnthropicModule;

// Reads an invoice photo with Claude and returns the fields the expense form
// needs. Only the signed-in building owner may call it (checked with the
// caller's own Supabase session), so the API key can't be used by anyone else.
//
// GET  -> { configured }  (the app hides the button until a key is set)
// POST { image: <base64 JPEG> } or { pdf: <base64 PDF> } with "Authorization: Bearer <owner session>"
//      -> { amount, currency, date, supplier, invoiceNumber, description }
//
// Needs ANTHROPIC_API_KEY in the Vercel environment.

const MODEL = "claude-opus-5-5";
const MAX_IMAGE_BYTES = 3.5 * 1024 * 1024;

const INVOICE_SCHEMA = {
  type: "object",
  properties: {
    amount: { type: "number", description: "Total to pay, as a plain number. 0 if unreadable." },
    currency: { type: "string", enum: ["USD", "LBP"], description: "LBP for Lebanese pounds (LL, L.L., ل.ل), otherwise USD." },
    date: { type: "string", description: "Invoice date as YYYY-MM-DD, or an empty string if not shown." },
    supplier: { type: "string", description: "Business that issued the invoice, or an empty string." },
    invoiceNumber: { type: "string", description: "Invoice or receipt number, or an empty string." },
    description: { type: "string", description: "A few words saying what was bought or done." },
  },
  required: ["amount", "currency", "date", "supplier", "invoiceNumber", "description"],
  additionalProperties: false,
};

const PROMPT = "This is an invoice or receipt (a photo or a PDF) for a residential building's expenses in Lebanon. "
  + "Read the total amount due, its currency, the date, the supplier, the invoice number and a short description of what it is for. "
  + "If the invoice shows totals in both USD and LBP, give the USD total. Leave a field empty rather than guessing.";

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

async function callerIsOwner(authorization) {
  const token = String(authorization || "").replace(/^Bearer\s+/i, "");
  if (!token) return false;
  const supabase = loadSupabase();
  const res = await fetch(`${supabase.url}/rest/v1/rpc/is_owner`, {
    method: "POST",
    headers: { apikey: supabase.key, Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: "{}",
  });
  return res.ok && (await res.json()) === true;
}

module.exports = async function handler(req, res) {
  const configured = Boolean(process.env.ANTHROPIC_API_KEY);
  if (req.method === "GET") return sendJson(res, 200, { configured });
  if (req.method !== "POST") return sendJson(res, 405, { error: "POST only" });
  if (!configured) return sendJson(res, 503, { error: "Invoice reading is not set up yet" });

  try {
    if (!(await callerIsOwner(req.headers.authorization))) return sendJson(res, 401, { error: "Only the signed-in owner can read invoices" });
  } catch {
    return sendJson(res, 502, { error: "Could not check your sign-in" });
  }

  let image;
  let pdf;
  try {
    const body = await readBody(req);
    image = String(body.image || "");
    pdf = String(body.pdf || "");
  } catch {
    return sendJson(res, 400, { error: "bad request" });
  }
  const data = image || pdf;
  if (!data || (image && pdf) || !/^[A-Za-z0-9+/=]+$/.test(data) || data.length * 0.75 > MAX_IMAGE_BYTES) {
    return sendJson(res, 400, { error: "Send one JPEG photo or PDF (3.5 MB at most)" });
  }
  const source = pdf
    ? { type: "document", source: { type: "base64", media_type: "application/pdf", data: pdf } }
    : { type: "image", source: { type: "base64", media_type: "image/jpeg", data: image } };

  const client = new Anthropic();
  try {
    const response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 2000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "low", format: { type: "json_schema", schema: INVOICE_SCHEMA } },
      messages: [{
        role: "user",
        content: [
          source,
          { type: "text", text: PROMPT },
        ],
      }],
    });
    if (response.stop_reason === "refusal") return sendJson(res, 422, { error: "The photo could not be read" });
    const text = response.content.find((block) => block.type === "text")?.text || "";
    const fields = JSON.parse(text);
    return sendJson(res, 200, {
      amount: Number(fields.amount) > 0 ? Number(fields.amount) : 0,
      currency: fields.currency === "LBP" ? "LBP" : "USD",
      date: /^\d{4}-\d{2}-\d{2}$/.test(fields.date || "") ? fields.date : "",
      supplier: String(fields.supplier || "").slice(0, 120),
      invoiceNumber: String(fields.invoiceNumber || "").slice(0, 60),
      description: String(fields.description || "").slice(0, 160),
    });
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) return sendJson(res, 429, { error: "Too many requests, try again in a minute" });
    if (error instanceof Anthropic.AuthenticationError) return sendJson(res, 503, { error: "The invoice-reading key is not valid" });
    if (error instanceof Anthropic.APIError) return sendJson(res, 502, { error: `Invoice reading failed (${error.status})` });
    if (error instanceof SyntaxError) return sendJson(res, 502, { error: "The photo could not be read" });
    return sendJson(res, 502, { error: "Invoice reading failed" });
  }
};
