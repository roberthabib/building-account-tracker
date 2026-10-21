// v164: everyday polish.
import { test } from "node:test";
import assert from "node:assert/strict";
import { app, baseState } from "./harness.mjs";

const tenants = [
  { id: "a", name: "A", unit: "1A", active: true, coefficient: 600, breakerAmps: 15 },
  { id: "b", name: "B", unit: "1B", active: true, coefficient: 400, breakerAmps: 15 },
];
const exp = (id, date, usd, extra = {}) => ({ id, category: "Expenses", date, debitUsd: usd, debitLbp: 0, creditUsd: 0, creditLbp: 0, balanceUsd: -usd, balanceLbp: 0, ...extra });
const pay = (id, tenantId, date, usd, extra = {}) => ({ id, category: "Payments", tenantId, date, forMonth: `${date.slice(0, 7)}-01`, creditUsd: usd, creditLbp: 0, debitUsd: 0, debitLbp: 0, balanceUsd: usd, balanceLbp: 0, ...extra });

test("recent expenses become one-tap templates, newest first, no repeats", () => {
  app.setState(baseState({ tenants, transactions: [
    exp("1", "2026-01-03", 50, { description: "Cleaning", expenseCategory: "Cleaning", supplier: "Clean Co" }),
    exp("2", "2026-02-03", 55, { description: "cleaning ", expenseCategory: "Cleaning" }),
    exp("3", "2026-02-10", 30, { description: "Bulbs", expenseCategory: "Repairs" }),
  ] }));
  const t = app.recentExpenseTemplates();
  assert.deepEqual(t.map((x) => x.description), ["Bulbs", "cleaning"]);
  assert.equal(t[1].usd, 55);
});

test("split preview follows the coefficients (actual mode only)", () => {
  app.setState(baseState({ tenants }));
  assert.deepEqual(app.expenseSplitPreview(100), [{ unit: "1A", usd: 60 }, { unit: "1B", usd: 40 }]);
  app.setState(baseState({ tenants, settings: { collectionMode: "fixed", lbpPerUsd: 100000, language: "en" } }));
  assert.deepEqual(app.expenseSplitPreview(100), []);
});

test("Who paid? starts on each tenant's last payment method", () => {
  app.setState(baseState({ tenants, transactions: [pay("p1", "a", "2026-01-05", 10, { method: "bank" }), pay("p2", "a", "2026-03-05", 10, { method: "whish" })] }));
  assert.equal(app.lastPaymentMethod("a"), "whish");
  assert.equal(app.lastPaymentMethod("b"), "cash");
});

test("the current month is added from the previous month's amount", () => {
  app.setState(baseState({ tenants, settings: { collectionMode: "fixed", lbpPerUsd: 100000, language: "en", defaultDueUsd: 150 }, monthlyExpected: [{ month: "2026-09-01", expectedUsd: 200 }] }));
  assert.deepEqual(app.monthToAutoAdd("2026-10-21"), { month: "2026-10-01", expectedUsd: 200 });
  app.setState(baseState({ tenants, settings: { collectionMode: "fixed", lbpPerUsd: 100000, language: "en" }, monthlyExpected: [{ month: "2026-10-01", expectedUsd: 200 }] }));
  assert.equal(app.monthToAutoAdd("2026-10-21"), null);
});

test("ledger month totals split money in and out", () => {
  const rows = [pay("p", "a", "2026-05-02", 100), exp("e", "2026-05-09", 40), exp("f", "2026-06-01", 5)];
  app.setState(baseState({ tenants, transactions: rows }));
  const totals = app.ledgerMonthTotals(rows);
  assert.deepEqual(totals.get("2026-05"), { in: 100, out: 40 });
  assert.deepEqual(totals.get("2026-06"), { in: 0, out: 5 });
});

test("diesel price warning when the litre price jumps", () => {
  const rows = [3, 3.1, 2.9, 4].map((p, i) => ({ month: `2026-0${i + 5}-01`, usdPerLitre: p }));
  const w = app.fuelPriceWarning(rows);
  assert.equal(w.month, "2026-08-01");
  assert.ok(w.pct >= 33);
  assert.equal(app.fuelPriceWarning(rows.slice(0, 3)), null);
});

test("same months last year comparison", () => {
  app.setState(baseState({ tenants, transactions: [exp("x", "2025-03-01", 100), exp("y", "2025-11-01", 999), exp("z", "2026-02-01", 150)] }));
  const c = app.samePeriodComparison("2026-10-21");
  assert.deepEqual([c.now, c.before, c.pct], [150, 100, 50]);
});

test("coefficient warning when the total isn't 1000", () => {
  app.setState(baseState({ tenants: [...tenants, { id: "c", name: "C", unit: "2", active: true, coefficient: 200 }] }));
  assert.match(app.coefficientWarningText(), /1200\/1000/);
  app.setState(baseState({ tenants }));
  assert.equal(app.coefficientWarningText(), "");
});

test("removing test data keeps real records and tombstones the rest", () => {
  const s = baseState({
    tenants,
    settings: { collectionMode: "fixed", lbpPerUsd: 100000, language: "en", monthlyBalanceNotices: false },
    monthlyExpected: [{ month: "2026-05-01", expectedUsd: 200 }, { month: "2026-08-01", expectedUsd: 200 }],
    transactions: [pay("test-pay-1", "a", "2026-05-04", 60), pay("real", "a", "2026-08-11", 100), exp("test-exp-2", "2026-08-03", 50)],
    serviceReadings: [{ id: "test-rdg-2026-05", serviceType: "generator", forMonth: "2026-05-01", lines: {} }],
    polls: [{ id: "test-poll-1", title: "x", votes: {} }],
    deleted: { transactions: [], tenants: [], polls: [], projects: [] },
  });
  app.setState(s);
  assert.equal(app.testDataCount(), 4);
  const result = app.removeTestData(s);
  assert.equal(result.removed, 4);
  assert.deepEqual(s.transactions.map((t) => t.id), ["real"]);
  assert.deepEqual(s.monthlyExpected.map((m) => m.month), ["2026-08-01"]); // May had only test entries
  assert.ok(s.deleted.transactions.includes("test-pay-1"));
  assert.ok(s.deleted.serviceReadings.includes("test-rdg-2026-05"));
  assert.deepEqual(s.deleted.monthlyExpected, ["2026-05-01"]);
});

test("a phone with an old copy can't bring removed test records back", () => {
  const meta = (t) => ({ rev: 5, epoch: 0, token: "x", updatedAt: t });
  const cloud = app.hydrateState(baseState({
    tenants, meta: meta("2026-10-21T10:00:00Z"),
    transactions: [pay("real", "a", "2026-08-11", 100)],
    monthlyExpected: [{ month: "2026-08-01", expectedUsd: 200 }],
    deleted: { transactions: ["test-pay-1"], tenants: [], polls: [], projects: [], serviceReadings: ["test-rdg-2026-05"], monthlyExpected: ["2026-05-01"], paymentDeclarations: ["test-decl-1"], generatorServices: [] },
  }));
  const phone = app.hydrateState(baseState({
    tenants, meta: meta("2026-10-20T10:00:00Z"),
    transactions: [pay("real", "a", "2026-08-11", 100), pay("test-pay-1", "a", "2026-05-04", 60)],
    monthlyExpected: [{ month: "2026-05-01", expectedUsd: 200 }, { month: "2026-08-01", expectedUsd: 200 }],
    serviceReadings: [{ id: "test-rdg-2026-05", serviceType: "generator", forMonth: "2026-05-01", lines: {} }],
    paymentDeclarations: [{ id: "test-decl-1", tenantId: "a", status: "pending" }],
  }));
  const merged = app.mergeStates(phone, cloud);
  assert.deepEqual(merged.transactions.map((t) => t.id), ["real"]);
  assert.deepEqual(merged.monthlyExpected.map((m) => m.month), ["2026-08-01"]);
  assert.equal(merged.serviceReadings.length, 0);
  assert.equal(merged.paymentDeclarations.length, 0);
});

test("accountant pack holds the workbooks and the year's receipts", () => {
  app.setState(baseState({ tenants, transactions: [pay("p1", "a", "2026-03-05", 60, { receiptRef: "RCT-1" }), pay("p0", "a", "2025-03-05", 60, { receiptRef: "RCT-0" })] }));
  const names = app.accountantPackFiles("2026").map((f) => f.name);
  assert.ok(names.some((n) => n.startsWith("ledger-full-")));
  assert.ok(names.includes("annual-report-2026.xlsx"));
  assert.equal(names.filter((n) => n.startsWith("receipts/")).length, 1);
});
