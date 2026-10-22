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
const REQUESTS = [];               // technician requests (v174)
let BOOK = { data: {}, rev: 0 };    // the manager's technicians notebook (v174)
const EXTRA = new Map();           // other buildings (v173): id -> { name, state, since }
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
  ["routineTasks", "routineLog", "supplies", "visitorLog", "monthChecks", "balanceSnapshot", "equipment", "pendingExpenses"].forEach((k) => delete s[k]);
  s.deposits = (s.deposits || []).filter((d) => d.tenantId === me);
  s.bookings = (s.bookings || []).filter((b) => b.status !== "cancelled" || b.tenantId === me)
    .map(({ by, ...b }) => (b.tenantId === me ? b : (({ tenantId, note, unit, ...rest }) => rest)(b)));
  s.boardPosts = (s.boardPosts || []).filter((p) => (p.status === "approved" && Date.parse(p.createdAt) >= Date.now() - 30 * 864e5) || (p.tenantId === me && ["pending", "approved"].includes(p.status)))
    .map((p) => (p.tenantId === me ? p : (({ tenantId, ...rest }) => rest)(p)));
  s.transactions = s.transactions.map(({ onlyFlats, ...x }) => x);
  s.buildingProjects = (s.buildingProjects || []).map(({ onlyFlats, ...p }) => (p.shares ? { ...p, shares: p.shares[me] != null ? { [me]: p.shares[me] } : {} } : p));
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
    if (path === "/__reset") { STATE = demoState(url.searchParams.get("lang") || "en"); codes.clear(); EXTRA.clear(); REQUESTS.length = 0; BOOK = { data: {}, rev: 0 }; anonProfile.clear(); conciergeTokens.clear(); adminCodes.clear(); log.length = 0; return send(200, { ok: true }); }
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
    const t = (k) => (STATE[k] ||= []);
    const meRec = () => STATE.tenants.find((x) => x.id === me);
    if (path === "/rest/v1/rpc/concierge_tick_task") {
      if (!isConcierge) return send(400, { message: "Concierge access only" });
      const id = b.p_task_id + ":" + b.p_date;
      const e = t("routineLog").find((l) => l.id === id);
      if (e) Object.assign(e, { done: !e.done, at: nowIso(), by: "concierge" }); else t("routineLog").push({ id, taskId: b.p_task_id, date: b.p_date, done: true, at: nowIso(), by: "concierge" });
      touch(); return send(200, e ? e.done : true);
    }
    if (path === "/rest/v1/rpc/concierge_adjust_supply") {
      if (!isConcierge) return send(400, { message: "Concierge access only" });
      const x = t("supplies").find((y) => y.id === b.p_supply_id); if (!x) return send(400, { message: "Supply not found" });
      x.qty = Math.max(0, Number(x.qty || 0) + Number(b.p_delta || 0)); x.updatedAt = nowIso(); touch(); return send(200, x.qty);
    }
    if (path === "/rest/v1/rpc/concierge_log_visitor") {
      if (!isConcierge) return send(400, { message: "Concierge access only" });
      t("visitorLog").push({ id: "vis-" + crypto.randomBytes(3).toString("hex"), at: nowIso(), name: b.p_name, purpose: b.p_purpose || "", unit: b.p_unit || "", by: "concierge" });
      touch(); return send(204);
    }
    if (path === "/rest/v1/rpc/concierge_save_water_readings") {
      if (!isConcierge) return send(400, { message: "Concierge access only" });
      const rec = t("serviceReadings").find((r) => r.serviceType === "water" && String(r.forMonth).slice(0, 7) === String(b.p_month).slice(0, 7));
      if (rec) Object.assign(rec, { lines: b.p_lines, enteredBy: "concierge", updatedAt: nowIso() });
      else t("serviceReadings").push({ id: "wrd-" + crypto.randomBytes(3).toString("hex"), serviceType: "water", forMonth: b.p_month, lines: b.p_lines, enteredBy: "concierge", updatedAt: nowIso() });
      touch(); return send(204);
    }
    if (path === "/rest/v1/rpc/book_space") {
      if (!me) return send(400, { message: "This device is not linked to a tenant" });
      if (!(STATE.settings.spaces || []).some((x) => x.id === b.p_space_id)) return send(400, { message: "Space not found" });
      if (!(b.p_from < b.p_to)) return send(400, { message: "The end time must be after the start" });
      if (t("bookings").some((x) => x.spaceId === b.p_space_id && x.date === b.p_date && x.status !== "cancelled" && x.from < b.p_to && b.p_from < x.to)) return send(400, { message: "Already booked at that time" });
      const id = "bk-" + crypto.randomBytes(3).toString("hex");
      t("bookings").push({ id, spaceId: b.p_space_id, date: b.p_date, from: b.p_from, to: b.p_to, tenantId: me, unit: meRec()?.unit || "", note: b.p_note || "", status: "booked", createdAt: nowIso(), updatedAt: nowIso() });
      touch(); return send(200, id);
    }
    if (path === "/rest/v1/rpc/cancel_my_booking") {
      const x = t("bookings").find((y) => y.id === b.p_booking_id);
      if (!me || !x || x.tenantId !== me) return send(400, { message: "Booking not found" });
      Object.assign(x, { status: "cancelled", updatedAt: nowIso() }); touch(); return send(204);
    }
    if (path === "/rest/v1/rpc/post_to_board") {
      if (!me) return send(400, { message: "This device is not linked to a tenant" });
      const id = "post-" + crypto.randomBytes(3).toString("hex");
      t("boardPosts").push({ id, tenantId: me, authorName: meRec()?.name || "", authorUnit: meRec()?.unit || "", title: b.p_title, body: b.p_body || "", status: "pending", createdAt: nowIso(), updatedAt: nowIso(), ...(b.p_photo_path ? { photo: { storagePath: b.p_photo_path } } : {}) });
      touch(); log.push("BOARD POST " + b.p_title); return send(200, id);
    }
    if (path === "/rest/v1/rpc/remove_my_post") {
      const x = t("boardPosts").find((y) => y.id === b.p_post_id);
      if (!me || !x || x.tenantId !== me) return send(400, { message: "Post not found" });
      Object.assign(x, { status: "removed", updatedAt: nowIso() }); touch(); return send(204);
    }
    if (path === "/rest/v1/rpc/update_my_details") {
      if (!me) return send(400, { message: "This device is not linked to a tenant" });
      if (!["en", "ar"].includes(b.p_language)) return send(400, { message: "Language must be en or ar" });
      Object.assign(meRec(), { phone: b.p_phone || "", language: b.p_language, detailsAt: nowIso() }); touch(); return send(204);
    }
    if (path === "/rest/v1/rpc/mark_month_checked") {
      if (!isOwner) return send(400, { message: "Administrators only" });
      t("monthChecks").push({ id: b.p_id, month: b.p_month, fingerprint: b.p_fingerprint || "", by: "helper@test", at: nowIso() }); touch(); return send(204);
    }
    if (path === "/rest/v1/rpc/approve_expense") {
      if (!isOwner) return send(400, { message: "Administrators only" });
      const p = t("pendingExpenses").find((x) => x.id === b.p_id);
      if (!p || p.status !== "pending") return send(400, { message: "This expense was already decided" });
      if (b.p_approve) STATE.transactions.push(...(p.transactions || []).map((x) => ({ ...x, approvedBy: "helper@test", approvedAt: nowIso() })));
      Object.assign(p, { status: b.p_approve ? "approved" : "rejected", decidedBy: "helper@test", updatedAt: nowIso() }); touch(); return send(204);
    }
    if (path === "/rest/v1/rpc/step_down") return isOwner ? send(204) : send(400, { message: "Only the building owner can step down" });
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
          announcements: (c.announcements || []).map(({ seenBy, ...n }) => n), monthLocks: c.monthLocks || [], deleted: c.deleted || {}, redaction: { role: "concierge" },
          routineTasks: c.routineTasks || [], routineLog: c.routineLog || [], supplies: c.supplies || [], visitorLog: c.visitorLog || [],
          bookings: (c.bookings || []).filter((b) => b.status !== "cancelled").map(({ tenantId, note, by, ...b }) => b) });
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
    if (path === "/rest/v1/rpc/request_technician") {
      if (!me) return send(400, { message: "This device is not linked to a tenant" });
      const id = crypto.randomUUID();
      REQUESTS.push({ id, buildingId: "building", tenantId: me, trade: b.p_trade, details: b.p_details, photoPath: b.p_photo_path || null, status: "new", technicianName: null, technicianPhone: null, createdAt: nowIso(), updatedAt: nowIso() });
      log.push("PUSH admins request " + b.p_trade);
      return send(200, id);
    }
    if (path === "/rest/v1/rpc/my_service_requests") {
      if (!me) return send(200, []);
      return send(200, REQUESTS.filter((r) => r.tenantId === me).slice().reverse());
    }
    if (path === "/rest/v1/rpc/cancel_my_request") {
      const r = REQUESTS.find((x) => x.id === b.p_id && x.tenantId === me && ["new", "sent"].includes(x.status));
      if (!r) return send(400, { message: "That request can no longer be cancelled" });
      r.status = "cancelled"; r.updatedAt = nowIso(); return send(204);
    }
    if (path === "/rest/v1/rpc/list_service_requests") {
      if (!isOwner) return send(400, { message: "Only the building manager can see technician requests" });
      return send(200, REQUESTS.slice().reverse().map((r) => {
        const t = STATE.tenants.find((x) => x.id === r.tenantId) || {};
        return { ...r, buildingName: STATE.building.name, tenantName: t.name, unit: t.unit, phone: t.phone || "" };
      }));
    }
    if (path === "/rest/v1/rpc/update_service_request") {
      if (!isOwner) return send(400, { message: "Only the building manager can update technician requests" });
      const r = REQUESTS.find((x) => x.id === b.p_id);
      if (!r) return send(400, { message: "That request no longer exists" });
      r.status = b.p_status; if (b.p_technician_name) r.technicianName = b.p_technician_name; if (b.p_technician_phone) r.technicianPhone = b.p_technician_phone; r.updatedAt = nowIso();
      if (b.p_status === "sent") log.push("PUSH tenant " + r.tenantId + " " + r.technicianName);
      return send(204);
    }
    if (path === "/rest/v1/rpc/get_manager_book") {
      if (!isOwner) return send(400, { message: "Only the building manager has a technicians notebook" });
      return send(200, BOOK);
    }
    if (path === "/rest/v1/rpc/save_manager_book") {
      if (!isOwner) return send(400, { message: "Only the building manager has a technicians notebook" });
      if (Number(b.p_rev) !== BOOK.rev) return send(400, { message: "changed-elsewhere" });
      BOOK = { data: b.p_data, rev: BOOK.rev + 1 }; return send(200, BOOK.rev);
    }
    if (path === "/__book" && req.method === "POST") { BOOK = { data: b, rev: BOOK.rev + 1 }; return send(200, { ok: true }); }
    if (path === "/__requests" && req.method === "POST") { REQUESTS.push(...b); return send(200, { ok: true }); }
    if (path === "/rest/v1/rpc/my_buildings") {
      if (isOwner) return send(200, [{ id: "building", name: STATE.building.name, role: "owner", tenant_id: null, since: "2026-01-01T00:00:00Z" },
        ...[...EXTRA].map(([id, x]) => ({ id, name: x.state.building?.name || x.name, role: "owner", tenant_id: null, since: x.since }))]);
      if (me) return send(200, [{ id: "building", name: STATE.building.name, role: "tenant", tenant_id: me, since: "2026-01-01T00:00:00Z" }]);
      if (isConcierge) return send(200, [{ id: "building", name: STATE.building.name, role: "concierge", tenant_id: null, since: "2026-01-01T00:00:00Z" }]);
      return send(200, []);
    }
    if (path === "/rest/v1/rpc/create_building") {
      if (!isOwner) return send(400, { message: "Only a building manager can add a building" });
      const id = "b" + crypto.randomBytes(6).toString("hex").slice(0, 11);
      EXTRA.set(id, { name: b.p_name, since: nowIso(), state: { building: { name: b.p_name }, setupComplete: false } });
      return send(200, id);
    }
    if (path === "/rest/v1/building_state" && req.method === "GET") {
      if (!isOwner) return send(403, { message: "permission denied" }); // step-7 behaviour
      const id = (url.searchParams.get("id") || "eq.building").replace(/^eq\./, "");
      if (id === "building") return send(200, [{ state: STATE }]);
      return send(200, EXTRA.has(id) ? [{ state: EXTRA.get(id).state }] : []);
    }
    if (path === "/rest/v1/building_state" && req.method === "POST") {
      if (!isOwner) return send(403, { message: "permission denied" });
      if (!b.id || b.id === "building") STATE = b.state;
      else if (EXTRA.has(b.id)) EXTRA.get(b.id).state = b.state;
      else return send(403, { message: "permission denied" });
      return send(201);
    }
    if (path.startsWith("/storage/v1/object/invoices/") && req.method === "POST") {
      const obj = decodeURIComponent(path.replace("/storage/v1/object/invoices/", ""));
      if (isOwner || (me && (obj.startsWith("proofs/" + me + "/") || obj.startsWith("issues/" + me + "/") || obj.startsWith("board/" + me + "/") || obj.startsWith("requests/" + me + "/"))) || (isConcierge && obj.startsWith("concierge/"))) { UPLOADS.push({ obj, by: tok.slice(0, 9), bytes: body.length }); return send(200, { Key: "invoices/" + obj }); }
      return send(403, { message: "new row violates row-level security policy" });
    }
    if (req.method === "GET" && path.startsWith("/storage/v1/object/sign/")) {
      // A made-up invoice picture for previews.
      const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800"><rect width="600" height="800" fill="#fff"/><text x="40" y="80" font-family="Arial" font-size="36" font-weight="700">Clean Team s.a.r.l.</text><text x="40" y="130" font-family="Arial" font-size="22" fill="#555">Invoice INV-0412 · Cedar Residence</text><line x1="40" y1="170" x2="560" y2="170" stroke="#ccc"/><text x="40" y="230" font-family="Arial" font-size="24">Building cleaning — October</text><text x="560" y="230" font-family="Arial" font-size="24" text-anchor="end">$240.00</text><line x1="40" y1="300" x2="560" y2="300" stroke="#333" stroke-width="2"/><text x="40" y="350" font-family="Arial" font-size="28" font-weight="700">Total</text><text x="560" y="350" font-family="Arial" font-size="28" font-weight="700" text-anchor="end">$240.00</text><text x="40" y="740" font-family="Arial" font-size="18" fill="#888">Made-up invoice for the demo building</text></svg>';
      return res.writeHead(200, { ...cors, "Content-Type": "image/svg+xml" }).end(svg);
    }
    if (path.startsWith("/storage/v1/object/sign/")) {
      if (!isOwner && !me && !isConcierge) return send(400, { message: "not allowed" });
      return send(200, { signedURL: `/object/sign/${path.split("/object/sign/")[1]}?token=signed-for-${tok.slice(0, 9)}` });
    }
    if (path.startsWith("/storage/v1/object/") && req.method === "DELETE") return isOwner ? send(200, {}) : send(403, {});
    send(404, { message: "mock: unhandled " + path });
  });
}).listen(4199, () => console.log("tenant mock on 4199"));
