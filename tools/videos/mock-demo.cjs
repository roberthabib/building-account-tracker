// In-memory stand-in for the Supabase endpoints the app uses (test-only data).
const http = require("node:http");
const crypto = require("node:crypto");

const demoState = require("./demo-state.cjs");
let STATE = demoState();
const BACKUPS = [{ day: "2026-10-18", state: JSON.parse(JSON.stringify(STATE)) }];
const codes = new Map();          // code -> tenantId
const anonProfile = new Map();    // token -> tenantId
const conciergeTokens = new Set(); // tokens linked as concierge
const adminCodes = new Map();      // invite code -> role
const log = [];
const UPLOADS = [];
let anonGen = 1;

function touch() {
  STATE.meta = { ...STATE.meta, rev: STATE.meta.rev + 1, token: "srv-" + crypto.randomBytes(4).toString("hex"), updatedAt: new Date().toISOString() };
}
function redacted(me) {
  const s = JSON.parse(JSON.stringify(STATE));
  s.tenants = s.tenants.filter((t) => t.id === me).map(({ pinHash, ...t }) => t);
  s.transactions = s.transactions.filter((x) => !x.tenantId || x.tenantId === me)
    .map((x) => (x.shares ? { ...x, shares: x.shares[me] != null ? { [me]: x.shares[me] } : {} } : x));
  s.paymentDeclarations = s.paymentDeclarations.filter((d) => d.tenantId === me);
  delete s.auditLog; delete s.cashChecks;
  s.paymentPlans = (s.paymentPlans || []).filter((p) => p.tenantId === me);
  s.issues = (s.issues || []).filter((i) => !i.tenantId || i.tenantId === me);
  s.announcements = (s.announcements || []).filter((n) => !n.publishAt || Date.parse(n.publishAt) <= Date.now()).map(({ seenBy, ...n }) => ({ ...n, seenByMe: (seenBy || []).includes(me) }));
  const meT = STATE.tenants.find((t) => t.id === me);
  s.directory = meT?.directory ? STATE.tenants.filter((t) => t.id !== me && t.directory && t.active !== false).map((t) => ({ name: t.name, unit: t.unit, phone: t.phone || "" })) : [];
  s.polls = s.polls.map((p) => {
    const v = Object.values(p.votes || {});
    const coef = (id) => Number((STATE.tenants.find((t) => t.id === id) || {}).coefficient || 0); const share = (x) => Object.entries(p.votes || {}).filter(([id, y]) => y === x && id !== "owner").reduce((n, [id]) => n + coef(id), 0);
    const optionCounts = {}; const optionShares = {};
    Object.entries(p.votes || {}).forEach(([id, v]) => { optionCounts[v] = (optionCounts[v] || 0) + 1; optionShares[v] = (optionShares[v] || 0) + coef(id); });
    return { ...p, votes: p.votes[me] ? { [me]: p.votes[me] } : {}, voteCounts: { optionCounts, optionShares, yes: v.filter((x) => x === "yes").length, no: v.filter((x) => x === "no").length, abstain: v.filter((x) => x === "abstain").length, units: STATE.tenants.length, yesShare: share("yes"), noShare: share("no"), abstainShare: share("abstain"), totalShare: STATE.tenants.reduce((n, t) => n + Number(t.coefficient || 0), 0) } };
  });
  delete s.settings.ownerPasswordHash;
  const active = STATE.tenants.filter((t) => t.active !== false);
  s.redaction = { tenantId: me, activeCoefficientTotal: active.reduce((a, t) => a + t.coefficient, 0), activeTenantCount: active.length };
  return s;
}

http.createServer((req, res) => {
  const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*", "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS", "Content-Type": "application/json" };
  if (req.method === "OPTIONS") return res.writeHead(204, cors).end();
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    const send = (code, obj) => res.writeHead(code, cors).end(obj === undefined ? "" : JSON.stringify(obj));
    const url = new URL(req.url, "http://x");
    const path = url.pathname;
    const tok = (req.headers.authorization || "").replace("Bearer ", "");
    let b = {}; try { b = JSON.parse(body || "{}"); } catch {}
    if (path === "/__log") return send(200, log);
    if (path === "/__state") return send(200, STATE);
    if (path === "/__put" && req.method === "POST") { STATE = b; touch(); return send(200, { ok: true }); }
    if (path === "/__uploads") return send(200, UPLOADS);
    if (path === "/__reset") { STATE = demoState(url.searchParams.get("lang") || "en"); codes.clear(); anonProfile.clear(); conciergeTokens.clear(); adminCodes.clear(); log.length = 0; return send(200, { ok: true }); }
    if (path === "/__reset_log") { log.length = 0; return send(200, []); }
    log.push(`${req.method} ${path.replace(/^\/(rest|auth|storage)\/v1\//, "")} as ${tok.slice(0, 9)}`);
    const isOwner = tok.startsWith("demo-owner");
    const me = anonProfile.get(tok) || null;
    const isConcierge = conciergeTokens.has(tok);
    const nowIso = () => new Date().toISOString();

    if (path === "/auth/v1/signup") { const t = `anon-${anonGen++}`; return send(200, { access_token: t, refresh_token: `ref-${t}`, expires_in: 3600, user: { id: `uid-${t}`, is_anonymous: true } }); }
    if (path === "/auth/v1/token" && url.searchParams.get("grant_type") === "refresh_token") {
      const old = String(b.refresh_token || "").replace("ref-", "");
      return send(200, { access_token: old, refresh_token: `ref-${old}`, expires_in: 3600 });
    }
    if (path === "/auth/v1/logout") return send(204);
    if (path === "/rest/v1/rpc/is_owner") return send(200, isOwner);
    if (path === "/rest/v1/rpc/list_tenant_links") return isOwner ? send(200, [...new Set([...anonProfile.values()])].map((t) => ({ tenant_id: t, phones: 1, notifications: 0 }))) : send(400, { message: "Administrators only" });
    if (path === "/rest/v1/rpc/my_admin_role") return send(200, isOwner ? "owner" : null);
    if (path === "/rest/v1/rpc/keepalive_status") return isOwner ? send(200, new Date(Date.now() - 3 * 3600000).toISOString()) : send(400, { message: "Administrators only" });
    if (path === "/rest/v1/rpc/notify_tenants") { log.push("NOTIFY " + JSON.stringify(b)); return send(204); }
    if (path === "/rest/v1/rpc/save_push_subscription") return send(204);
    if (path === "/rest/v1/rpc/list_admins") return isOwner ? send(200, [{ user_id: "u1", email: "owner@test", role: "owner", since: "2026-10-01", is_me: true }, { user_id: "u2", email: "helper@test", role: "viewer", since: "2026-10-10", is_me: false }]) : send(400, { message: "Only the building owner can see administrators" });
    if (path === "/rest/v1/rpc/create_admin_invite") {
      if (!isOwner) return send(400, { message: "Only the building owner can invite administrators" });
      const code = crypto.randomBytes(5).toString("hex").toUpperCase(); adminCodes.set(code, b.p_role || "viewer"); return send(200, code);
    }
    if (path === "/rest/v1/rpc/claim_admin_invite") {
      const role = adminCodes.get(String(b.p_code || "").toUpperCase());
      if (!role) return send(400, { message: "That invite is not valid" });
      if (role !== "concierge" && tok.startsWith("anon-")) return send(400, { message: "Sign in with Google to accept an administrator invite" });
      adminCodes.delete(String(b.p_code).toUpperCase());
      if (role === "concierge") conciergeTokens.add(tok);
      return send(200, role);
    }
    if (path === "/rest/v1/rpc/concierge_add_expense") {
      if (!isConcierge) return send(400, { message: "Concierge access only" });
      const e = b.p_entry || {};
      const id = "cx-" + crypto.randomBytes(3).toString("hex");
      STATE.transactions.push({ id, category: "Expenses", description: e.description, tenantId: null, forMonth: null, project: "", date: e.date, supplier: e.supplier || "", invoice: e.invoice || "", expenseCategory: e.expenseCategory || "", serviceType: "", servicePart: "", debitUsd: Number(e.amountUsd || 0), debitLbp: Number(e.amountLbp || 0), creditUsd: 0, creditLbp: 0, balanceUsd: -Number(e.amountUsd || 0), balanceLbp: 0, paidFrom: "cash", enteredBy: "concierge", invoiceAttachment: e.photoPath ? { storagePath: e.photoPath } : null, sourceRow: null });
      touch(); log.push("CONCIERGE EXPENSE " + e.description); return send(200, id);
    }
    if (path === "/rest/v1/rpc/concierge_save_readings") {
      if (!isConcierge) return send(400, { message: "Concierge access only" });
      const lines = {};
      Object.entries(b.p_lines || {}).forEach(([k, v]) => { lines[k] = { previousReading: v.previousReading, currentReading: v.currentReading, breakerAmps: v.breakerAmps || 0, ...(v.photoPath ? { photo: { storagePath: v.photoPath } } : {}) }; });
      const rec = STATE.serviceReadings.find((r) => r.serviceType === "generator" && String(r.forMonth).slice(0, 7) === String(b.p_month).slice(0, 7));
      if (rec) Object.assign(rec, { lines, enteredBy: "concierge", updatedAt: nowIso() });
      else STATE.serviceReadings.push({ id: "rdg-" + crypto.randomBytes(3).toString("hex"), serviceType: "generator", forMonth: b.p_month, lines, enteredBy: "concierge", updatedAt: nowIso() });
      touch(); return send(204);
    }
    if (path === "/rest/v1/rpc/concierge_report_issue") {
      if (!isConcierge) return send(400, { message: "Concierge access only" });
      (STATE.issues ||= []).push({ id: "iss-" + crypto.randomBytes(3).toString("hex"), tenantId: null, title: b.p_title, details: b.p_details || "", status: "open", createdAt: nowIso(), updatedAt: nowIso(), reportedBy: "concierge", ...(b.p_photo_path ? { photo: { storagePath: b.p_photo_path } } : {}) });
      touch(); return send(204);
    }
    if (path === "/rest/v1/rpc/reply_issue") {
      if (!me && !isConcierge) return send(400, { message: "This device is not linked" });
      const issue = (STATE.issues || []).find((i) => i.id === b.p_issue_id);
      if (!issue) return send(400, { message: "Problem not found" });
      if (!isConcierge && issue.tenantId !== me) return send(400, { message: "You can only reply on your own problems" });
      issue.messages = [...(issue.messages || []), { id: "msg-" + crypto.randomBytes(3).toString("hex"), by: isConcierge ? "concierge" : "tenant", text: b.p_text || "", at: nowIso(), ...(b.p_photo_path ? { photo: { storagePath: b.p_photo_path } } : {}) }];
      issue.updatedAt = nowIso();
      touch(); return send(204);
    }
    if (path === "/rest/v1/rpc/set_directory_optin") {
      if (!me) return send(400, { message: "This device is not linked to a tenant" });
      const t = STATE.tenants.find((x) => x.id === me); t.directory = Boolean(b.p_share); t.directoryAt = nowIso();
      touch(); return send(204);
    }
    if (path === "/rest/v1/rpc/mark_notice_seen") {
      if (!me) return send(204);
      const n = (STATE.announcements || []).find((x) => x.id === b.p_notice_id);
      if (n) { n.seenBy = [...new Set([...(n.seenBy || []), me])]; touch(); }
      return send(204);
    }
    if (path === "/rest/v1/rpc/report_issue") {
      if (!me) return send(400, { message: "This device is not linked to a tenant" });
      (STATE.issues ||= []).push({ id: "iss-" + crypto.randomBytes(3).toString("hex"), tenantId: me, title: b.p_title, details: b.p_details || "", status: "open", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ...(b.p_photo_path ? { photo: { storagePath: b.p_photo_path } } : {}) });
      touch(); return send(204);
    }
    if (path === "/rest/v1/rpc/create_claim_code") {
      if (!isOwner) return send(400, { message: "Only the building owner can create claim codes" });
      const code = crypto.randomBytes(4).toString("hex").toUpperCase(); codes.set(code, b.p_tenant_id); return send(200, code);
    }
    if (path === "/rest/v1/rpc/claim_tenant") {
      const tid = codes.get(String(b.p_code || "").toUpperCase());
      if (!tid) return send(400, { message: "That code is not valid" });
      codes.delete(String(b.p_code).toUpperCase()); anonProfile.set(tok, tid); return send(200, tid);
    }
    if (path === "/rest/v1/rpc/get_my_state") {
      if (isOwner) return send(200, STATE);
      if (isConcierge) {
        const c = JSON.parse(JSON.stringify(STATE));
        return send(200, { meta: c.meta, building: c.building, settings: c.settings, security: {}, setupComplete: true,
          tenants: c.tenants.map((t) => ({ id: t.id, name: t.name, unit: t.unit, active: t.active !== false, breakerAmps: t.breakerAmps, coefficient: 0, phone: "", pinHash: "" })),
          transactions: c.transactions.filter((x) => x.category === "Expenses" || x.category === "Services Expenses").map(({ shares, ...x }) => x),
          serviceReadings: c.serviceReadings, issues: c.issues || [], maintenanceTasks: c.maintenanceTasks || [], equipment: c.equipment || [], generatorServices: c.generatorServices || [],
          suppliers: (c.suppliers || []).map((x) => ({ id: x.id, name: x.name, trade: x.trade, phone: x.phone })), expenseCategories: c.expenseCategories || [],
          announcements: (c.announcements || []).map(({ seenBy, ...n }) => n), monthLocks: c.monthLocks || [], deleted: c.deleted || {}, redaction: { role: "concierge" } });
      }
      if (!me) return send(400, { message: "This device is not linked to a tenant yet" });
      return send(200, redacted(me));
    }
    if (path === "/rest/v1/rpc/declare_my_payment") {
      if (!me) return send(400, { message: "This device is not linked to a tenant" });
      if (b.p_proof_path && !String(b.p_proof_path).startsWith("proofs/" + me + "/")) return send(400, { message: "Proof photo must be one of your own uploads" });
      STATE.paymentDeclarations.push({ id: "decl-" + crypto.randomBytes(3).toString("hex"), tenantId: me, month: b.p_month, amount: b.p_amount, status: "pending", declaredAt: new Date().toISOString(), ...(b.p_proof_path ? { proof: { storagePath: b.p_proof_path, fileName: "payment-proof.jpg", mimeType: "image/jpeg" } } : {}) });
      touch(); return send(204);
    }
    if (path === "/rest/v1/rpc/cast_my_vote") {
      if (!me) return send(400, { message: "This device is not linked to a tenant" });
      const p = STATE.polls.find((x) => x.id === b.p_poll_id);
      if (p.options?.length ? !p.options.some((o) => o.id === b.p_vote) && b.p_vote !== "abstain" : !["yes", "no", "abstain"].includes(b.p_vote)) return send(400, { message: "Not a valid choice" });
      p.votes[me] = b.p_vote; touch(); return send(204);
    }
    if (path === "/rest/v1/rpc/list_backups") {
      if (!isOwner) return send(400, { message: "Only the building owner can see backups" });
      return send(200, BACKUPS.map((x) => ({ day: x.day, tenants: x.state.tenants.length, transactions: x.state.transactions.length })));
    }
    if (path === "/rest/v1/rpc/get_backup") {
      if (!isOwner) return send(400, { message: "Only the building owner can restore backups" });
      return send(200, BACKUPS.find((x) => x.day === b.p_day).state);
    }
    if (path === "/rest/v1/building_state" && req.method === "GET") {
      if (!isOwner) return send(403, { message: "permission denied" }); // step-7 behaviour
      return send(200, [{ state: STATE }]);
    }
    if (path === "/rest/v1/building_state" && req.method === "POST") {
      if (!isOwner) return send(403, { message: "permission denied" });
      STATE = b.state; return send(201);
    }
    if (path.startsWith("/storage/v1/object/invoices/") && req.method === "POST") {
      const obj = decodeURIComponent(path.replace("/storage/v1/object/invoices/", ""));
      if (isOwner || (me && (obj.startsWith("proofs/" + me + "/") || obj.startsWith("issues/" + me + "/"))) || (isConcierge && obj.startsWith("concierge/"))) { UPLOADS.push({ obj, by: tok.slice(0, 9), bytes: body.length }); return send(200, { Key: "invoices/" + obj }); }
      return send(403, { message: "new row violates row-level security policy" });
    }
    if (path.startsWith("/storage/v1/object/sign/")) {
      if (!isOwner && !me && !isConcierge) return send(400, { message: "not allowed" });
      return send(200, { signedURL: `/object/sign/${path.split("/object/sign/")[1]}?token=signed-for-${tok.slice(0, 9)}` });
    }
    if (path.startsWith("/storage/v1/object/") && req.method === "DELETE") return isOwner ? send(200, {}) : send(403, {});
    send(404, { message: "mock: unhandled " + path });
  });
}).listen(4199, () => console.log("tenant mock on 4199"));
