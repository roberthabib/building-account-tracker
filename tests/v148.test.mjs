// v148: month locks, change history, payment plans, move-outs, generator
// efficiency, weighted polls, annual report, device merges.
import { test } from "node:test";
import assert from "node:assert/strict";
import { app, baseState } from "./harness.mjs";

const STORAGE_KEY = "building-account-tracker:v1";
const T = (id, coefficient, extra = {}) => ({ id, name: id.toUpperCase(), unit: id, active: true, coefficient, breakerAmps: 10, pinHash: "", phone: "", ...extra });
const expense = (id, date, usd, extra = {}) => ({ id, category: "Expenses", date, debitUsd: usd, debitLbp: 0, creditUsd: 0, creditLbp: 0, balanceUsd: -usd, balanceLbp: 0, description: id, ...extra });
const payment = (id, tenantId, date, usd) => ({ id, category: "Payments", tenantId, date, forMonth: `${date.slice(0, 7)}-01`, creditUsd: usd, creditLbp: 0, debitUsd: 0, debitLbp: 0, balanceUsd: usd, balanceLbp: 0, description: tenantId });

// Loads a state as "what this device last saved", like a real session.
function loadSaved(raw) {
  app.setState(raw);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(app.getState()));
  app.setSessionMode("owner");
}

test("a closed month refuses changes and the stored copy comes back", () => {
  loadSaved(baseState({
    tenants: [T("a", 1000)],
    transactions: [expense("e1", "2026-08-10", 100)],
    monthLocks: [{ id: "2026-08", closed: true, at: "2026-09-05T00:00:00Z" }],
  }));
  assert.equal(app.isMonthClosed("2026-08-01"), true);
  app.getState().transactions[0].debitUsd = 999;
  assert.equal(app.saveState(), false, "editing an August entry is refused");
  assert.equal(app.getState().transactions[0].debitUsd, 100, "the edit is undone");
  app.getState().transactions.push(expense("e2", "2026-09-02", 50));
  assert.equal(app.saveState(), true, "September is still open");
  app.getState().transactions.push(expense("e3", "2026-08-30", 5));
  assert.equal(app.saveState(), false, "a new entry dated in August is refused too");
  app.setSessionMode(null);
});

test("generator costs count in the month they are billed, not only their date", () => {
  assert.deepEqual(app.recordMonths("transaction", { category: "Services Expenses", serviceType: "generator", date: "2026-10-02", forMonth: "2026-09-01" }), ["2026-10", "2026-09"]);
  assert.deepEqual(app.recordMonths("transaction", { category: "Payments", date: "2026-10-02", forMonth: "2026-09-01" }), ["2026-10"], "a late payment for September is dated October");
});

test("every save is recorded in the change history, with what changed", () => {
  loadSaved(baseState({ tenants: [T("a", 1000)], transactions: [expense("e1", "2026-09-10", 100)] }));
  app.getState().transactions[0].debitUsd = 120;
  app.getState().transactions.push(payment("p1", "a", "2026-09-12", 40));
  assert.equal(app.saveState(), true);
  const log = app.getState().auditLog;
  assert.equal(log.length, 2);
  const changed = log.find((e) => e.action === "changed");
  assert.equal(changed.kind, "transaction");
  assert.equal(changed.before.debitUsd, 100);
  assert.equal(changed.after.debitUsd, 120);
  assert.ok(log.find((e) => e.action === "added" && e.recordId === "p1"));
  app.setSessionMode(null);
});

test("a tenant phone records no history (it never writes the document)", () => {
  loadSaved(baseState({ tenants: [T("a", 1000)] }));
  app.setSessionMode("tenant");
  app.getState().tenants[0].phone = "70 000 000";
  app.saveState({ sync: false });
  assert.equal((app.getState().auditLog || []).length, 0);
  app.setSessionMode(null);
});

test("diff ignores poll votes but sees settings changes", () => {
  const before = baseState({ polls: [{ id: "p", title: "Paint?", status: "open", votes: {} }], settings: { lbpPerUsd: 89500 } });
  const after = baseState({ polls: [{ id: "p", title: "Paint?", status: "open", votes: { a: "yes" } }], settings: { lbpPerUsd: 90000 } });
  const changes = app.diffStates(before, after);
  assert.deepEqual(changes.map((c) => c.kind), ["settings"]);
});

test("move-out: fixed dues follow the occupant month by month", () => {
  app.setState(baseState({
    settings: { collectionMode: "fixed", defaultDueUsd: 1000, lbpPerUsd: 100000, language: "en" },
    tenants: [T("old", 500, { active: false, movedOutOn: "2026-11-01" }), T("new", 500, { movedInOn: "2026-11-01" })],
  }));
  assert.equal(app.getExpectedForTenant("old", "2026-10-01"), 500, "old tenant pays October");
  assert.equal(app.getExpectedForTenant("old", "2026-11-01"), 0, "but not November");
  assert.equal(app.getExpectedForTenant("new", "2026-10-01"), 0, "new tenant owes nothing before moving in");
  assert.equal(app.getExpectedForTenant("new", "2026-11-01"), 500);
});

test("move-out: the new occupant's first meter reading starts from the handover", () => {
  app.setState(baseState({ tenants: [T("new", 500, { meterStart: 4321 })] }));
  assert.equal(app.getPreviousMeterReading("new", "2026-11-01"), 4321);
});

test("generator efficiency warns when kWh per litre drops", () => {
  const fuel = (id, month, usd, litres) => ({ id, category: "Services Expenses", serviceType: "generator", servicePart: "fuel", forMonth: month, date: month, debitUsd: usd, debitLbp: 0, creditUsd: 0, creditLbp: 0, balanceUsd: -usd, balanceLbp: 0, litres });
  const reading = (month, kwh) => ({ id: `r-${month}`, serviceType: "generator", forMonth: month, lines: { a: { breakerAmps: 10, previousReading: 0, currentReading: kwh } } });
  app.setState(baseState({
    tenants: [T("a", 1000)],
    transactions: [fuel("f1", "2026-06-01", 300, 300), fuel("f2", "2026-07-01", 300, 300), fuel("f3", "2026-08-01", 300, 300), fuel("f4", "2026-09-01", 300, 300)],
    serviceReadings: [reading("2026-06-01", 900), reading("2026-07-01", 900), reading("2026-08-01", 900), reading("2026-09-01", 600)],
  }));
  const rows = app.generatorEfficiencyRows();
  assert.equal(rows[0].kwhPerLitre, 3);
  const warning = app.generatorEfficiencyWarning(rows);
  assert.equal(warning.kind, "litres");
  assert.equal(warning.month, "2026-09-01");
  assert.equal(warning.pct, 33);
});

test("polls weighted by ownership share", () => {
  app.setState(baseState({ tenants: [T("a", 600), T("b", 300), T("c", 100)] }));
  const poll = { id: "p", title: "Lift?", status: "open", weighting: "share", votes: { a: "no", b: "yes", c: "yes", owner: "yes" } };
  const tally = app.pollTally(poll);
  assert.deepEqual({ yes: tally.yes, no: tally.no, total: tally.total }, { yes: 400, no: 600, total: 1000 }, "the owner's own vote is not a unit");
  const closed = { ...poll, closesOn: "2020-01-01", quorumPct: 50 };
  const lines = app.pollSummaryLines(closed);
  assert.ok(lines.includes("Result: NO"));
  assert.ok(lines.some((l) => l.startsWith("Turnout 100%")));
});

test("annual report: cash opens and closes on the year's movements", () => {
  app.setState(baseState({
    tenants: [T("a", 1000)],
    transactions: [expense("e0", "2025-12-20", 50), payment("p0", "a", "2025-12-21", 200), expense("e1", "2026-03-10", 80, { expenseCategory: "Cleaning" }), payment("p1", "a", "2026-03-12", 30)],
  }));
  const d = app.annualReportData(2026);
  assert.equal(d.openingCash, 150);
  assert.equal(d.spending, 80);
  assert.equal(d.closingCash, 100);
  assert.deepEqual(d.categories, [["Cleaning", 80]]);
  const xml = app.buildAnnualWorkbookFiles(2026).map((f) => f.content).join("\n");
  assert.ok(xml.includes("annual report 2026"));
});

test("expected cash on a date ignores later entries and tenant opening balances", () => {
  app.setState(baseState({
    tenants: [T("a", 1000)],
    transactions: [payment("p1", "a", "2026-09-01", 100), expense("e1", "2026-09-20", 30),
      { id: "ob", category: "Opening Balance", tenantId: "a", date: "2026-01-01", debitUsd: 500, creditUsd: 0, debitLbp: 0, creditLbp: 0, balanceUsd: -500, balanceLbp: 0 }],
  }));
  assert.equal(app.expectedCashOn("2026-09-10"), 100);
  assert.equal(app.expectedCashOn("2026-09-30"), 70);
});

test("merging devices keeps both sides' problem reports and the later status", () => {
  const local = baseState({
    meta: { rev: 3, epoch: 0, updatedAt: "2026-10-02T00:00:00Z" },
    issues: [{ id: "i1", title: "Leak", status: "fixed", updatedAt: "2026-10-02T00:00:00Z" }],
    announcements: [{ id: "n1", title: "Water cut", createdAt: "2026-10-01T00:00:00Z" }],
  });
  const remote = baseState({
    meta: { rev: 4, epoch: 0, updatedAt: "2026-10-03T00:00:00Z" },
    issues: [{ id: "i1", title: "Leak", status: "open", updatedAt: "2026-10-01T00:00:00Z" }, { id: "i2", title: "Light", status: "open", updatedAt: "2026-10-03T00:00:00Z" }],
    announcements: [],
    deleted: { transactions: [], tenants: [], polls: [], projects: [], announcements: ["n1"] },
  });
  const merged = app.mergeStates(local, remote);
  assert.equal(merged.issues.find((i) => i.id === "i1").status, "fixed", "the owner's later status survives");
  assert.ok(merged.issues.find((i) => i.id === "i2"), "the tenant's new report survives");
  assert.equal(merged.announcements.length, 0, "a notice deleted on another device stays deleted");
});

test("attention: an open problem and an overdue generator service show up", () => {
  app.setState(baseState({
    issues: [{ id: "i1", title: "Leak", status: "open" }],
    generatorServices: [{ id: "g", date: "2026-01-01", hours: 100, work: "Oil", nextHours: 350, nextDate: "2026-02-01" }],
  }));
  const texts = app.extraAttentionItems().map((i) => i.text);
  assert.ok(texts.includes("1 problem reported"));
  assert.ok(texts.includes("Generator service is overdue"));
});

test("move-out: costs split by who occupied the unit on the cost's date", () => {
  app.setState(baseState({ tenants: [T("a", 600), T("old", 400, { active: false, movedOutOn: "2026-11-01" }), T("new", 400, { movedInOn: "2026-11-01" })] }));
  assert.deepEqual(app.occupantsOn("2026-10-15").map((t) => t.id), ["a", "old"]);
  assert.deepEqual(app.occupantsOn("2026-11-01").map((t) => t.id), ["a", "new"]);
});

test("move-out: an old expense without a saved split keeps its split after the move", () => {
  const e = expense("e1", "2026-09-10", 100);
  app.setState(baseState({ tenants: [T("a", 600), T("b", 400)], transactions: [e] }));
  const before = app.getTenantBalance("b");
  app.setState(baseState({ tenants: [T("a", 600), T("b", 400, { active: false, movedOutOn: "2026-11-01" }), T("n", 400, { movedInOn: "2026-11-01" })], transactions: [e] }));
  assert.equal(app.getTenantBalance("b"), before, "the leaving tenant still owes their September share");
  assert.equal(app.getTenantBalance("n"), 0, "the new occupant owes nothing for September");
});
