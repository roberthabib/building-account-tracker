// v158: budget vs actual, reserve target, supplier history, documents expiring, minutes PDF, year closing.
import { test } from "node:test";
import assert from "node:assert/strict";
import { app, baseState } from "./harness.mjs";

const year = String(new Date().getFullYear());
const exp = (id, date, usd, extra = {}) => ({ id, category: "Expenses", date, debitUsd: usd, debitLbp: 0, creditUsd: 0, creditLbp: 0, balanceUsd: -usd, balanceLbp: 0, ...extra });

test("budget vs actual: spent this year per category against the plan", () => {
  app.setState(baseState({
    transactions: [exp("e1", `${year}-02-01`, 300, { expenseCategory: "Cleaning" }), exp("e2", `${year}-03-01`, 900, { expenseCategory: "Cleaning" }), exp("e3", `${year}-03-02`, 50, { expenseCategory: "Lift" })],
    budgets: { [year]: { Cleaning: 1000, Insurance: 400 } },
  }));
  const rows = Object.fromEntries(app.budgetRows().map((r) => [r.category, r]));
  assert.equal(rows.Cleaning.spent, 1200);
  assert.equal(rows.Cleaning.pct, 120);
  assert.equal(rows.Insurance.spent, 0);
  assert.equal(rows.Lift.budget, 0);
  assert.ok(app.v158AttentionItems().some((i) => i.text.startsWith("1 category is over budget (Cleaning)")));
});

test("reserve target: warns when cash is below it", () => {
  app.setState(baseState({ settings: { reserveTargetUsd: 500 }, transactions: [{ id: "p", category: "Payments", tenantId: "a", date: "2026-01-01", creditUsd: 300, creditLbp: 0, debitUsd: 0, debitLbp: 0, balanceUsd: 300, balanceLbp: 0 }] }));
  assert.deepEqual(app.reserveStatus(), { target: 500, cash: 300, below: true });
  assert.ok(app.v158AttentionItems().some((i) => i.key === "reserve"));
});

test("supplier history matches the name whatever the capitals", () => {
  app.setState(baseState({ transactions: [exp("e1", "2026-01-01", 10, { supplier: "Abou Elie" }), exp("e2", "2026-02-01", 20, { supplier: "abou elie " }), exp("e3", "2026-03-01", 5, { supplier: "Other" })] }));
  assert.deepEqual(app.supplierExpenses("ABOU ELIE").map((t) => t.id), ["e2", "e1"]);
});

test("documents: reminded a month before they expire", () => {
  const soon = new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 10);
  app.setState(baseState({ documents: [{ id: "d1", title: "Insurance", expiresOn: soon }, { id: "d2", title: "Contract", expiresOn: "2999-01-01" }, { id: "d3", title: "Permit" }] }));
  assert.deepEqual(app.documentsExpiring().map((d) => d.id), ["d1"]);
});

test("meeting minutes PDF lists the decisions", async () => {
  app.setState(baseState({ meetings: [], polls: [] }));
  const pdf = await app.buildMeetingPdf({ id: "m", date: "2026-10-20", title: "AGM", attendees: "1A, 1B", notes: "Lift", decisions: ["Paint the lobby", "Raise the reserve"] }).text();
  assert.ok(pdf.includes("(1. Paint the lobby)"));
  assert.ok(pdf.includes("(Meeting minutes)"));
});

test("a year counts as closed only when all twelve months are", () => {
  app.setState(baseState({ monthLocks: Array.from({ length: 12 }, (_, i) => ({ id: `2025-${String(i + 1).padStart(2, "0")}`, closed: true })) }));
  assert.equal(app.yearFullyClosed("2025"), true);
  app.getState().monthLocks[5].closed = false;
  assert.equal(app.yearFullyClosed("2025"), false);
});
