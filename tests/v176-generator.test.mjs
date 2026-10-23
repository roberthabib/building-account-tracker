// Synthetic records only; harness.mjs blocks network access.
// Fuel $90: 60/30 kWh -> $60/$30. Maintenance $30: 20/10 A -> $20/$10.
import { test } from "node:test";
import assert from "node:assert/strict";
import { app, baseState } from "./harness.mjs";

const aug = "2026-08-01", sep = "2026-09-01";
const tenants = [
  { id: "a", name: "Synthetic A", active: true, coefficient: 600, breakerAmps: 20 },
  { id: "b", name: "Synthetic B", active: true, coefficient: 400, breakerAmps: 10 },
];
const payment = (usd, month = sep, extra = {}) => ({
  id: "p", category: "Payments", tenantId: "a", forMonth: month,
  date: "2026-09-20", creditUsd: usd, receiptRef: "SYN-1", ...extra,
});
function scenario(mode = "fixed", months = [sep]) {
  return baseState({
    tenants,
    settings: { collectionMode: mode, defaultDueUsd: 0, lbpPerUsd: 100000, language: "en", dueDay: 10 },
    monthlyExpected: mode === "fixed" ? months.map(month => ({ month, expectedUsd: 100 })) : [],
    transactions: [
      { id: "fuel", category: "Services Expenses", serviceType: "generator", servicePart: "fuel", forMonth: sep, date: "2026-10-02", debitUsd: 90 },
      { id: "maint", category: "Services Expenses", serviceType: "generator", servicePart: "maintenance", forMonth: sep, date: "2026-10-03", debitUsd: 30 },
    ],
    serviceReadings: [{ id: "r", serviceType: "generator", forMonth: sep, lines: {
      a: { previousReading: 100, currentReading: 160, breakerAmps: 20 },
      b: { previousReading: 50, currentReading: 80, breakerAmps: 10 },
    } }],
  });
}
function addWater(s) {
  s.transactions.push({ id: "water", category: "Services Expenses", serviceType: "water", forMonth: sep,
    date: "2026-10-04", debitUsd: 50, shares: { a: 30, b: 20 } });
}
function assertMonth(id, month, due, paid, label) {
  assert.deepEqual(app.paymentStatus(id, month), { expected: due, paid, label,
    className: { Paid: "paid", Partial: "partial", Due: "due", "No due": "none" }[label] });
  const row = app.tenantStatementRows(id).rows.find(r => r.month === month);
  assert.equal(row.due, due);
  assert.equal(row.paid, paid);
  assert.equal(row.outstanding, due - paid);
  assert.equal(row.status, label);
}

for (const mode of ["fixed", "actual"]) {
  test(`${mode}: adding, correcting and removing readings recalculates monthly status and balance`, () => {
    const s = scenario(mode);
    if (mode === "actual") s.transactions.push({ id: "general", category: "Expenses", date: "2026-09-03", debitUsd: 100, shares: { a: 60, b: 40 } });
    s.transactions.push(payment(60));
    const readings = structuredClone(s.serviceReadings);
    s.serviceReadings = [];
    app.setState(s);
    assertMonth("a", sep, 60, 60, "Paid");
    assert.equal(app.getTenantBalance("a"), 0);
    assert.equal(app.getMonthlyDueForTenant("a", "2026-10-01"), 0, "service month takes precedence over invoice date");
    s.serviceReadings = readings;
    app.setState(s);
    assertMonth("a", sep, 140, 60, "Partial");
    assert.equal(app.getTenantBalance("a"), 80);
    assert.equal(app.getMonthlyDueForTenant("b", sep), 80);
    // Correct A to 30 kWh: fuel $45 each; maintenance remains $20/$10.
    s.serviceReadings[0].lines.a.currentReading = 130;
    app.setState(s);
    assertMonth("a", sep, 125, 60, "Partial");
    assert.equal(app.getMonthlyDueForTenant("b", sep), 95);
    assert.equal(app.getTenantBalance("a"), 65);
    assert.equal(app.getTenantBalance("b"), 95);
    s.serviceReadings = [];
    app.setState(s);
    assertMonth("a", sep, 60, 60, "Paid");
    assert.equal(app.getTenantBalance("a"), 0);
  });
}

for (const [paid, label, outstanding] of [[0, "Due", 170], [60, "Partial", 110], [150, "Partial", 20], [170, "Paid", 0]]) {
  test(`fixed: fee + generator + water with $${paid} paid`, () => {
    const s = scenario();
    addWater(s);
    if (paid) s.transactions.push(payment(paid));
    app.setState(s);
    assertMonth("a", sep, 170, paid, label);
    assert.equal(app.getMonthlyDueForTenant("b", sep), 100);
    assert.equal(app.getTenantBalance("a"), outstanding);
    assert.deepEqual(app.unpaidByMonth().a, outstanding ? { "2026-09": outstanding } : undefined);
    assert.equal(app.lateTenants(sep, "2026-10-11").some(t => t.id === "a"), outstanding > 0);
  });
}

test("fixed: late readings reallocate existing payments to the oldest month without rewriting records", () => {
  const s = scenario("fixed", [aug, sep]);
  s.transactions.forEach(t => { t.forMonth = aug; });
  s.serviceReadings[0].forMonth = aug;
  s.transactions.push(payment(150));
  const readings = s.serviceReadings;
  s.serviceReadings = [];
  app.setState(s);
  assertMonth("a", aug, 60, 60, "Paid");
  assertMonth("a", sep, 60, 60, "Paid");
  assert.equal(app.fifoMonthPaid("a").leftover, 30);
  assert.equal(app.getTenantBalance("a"), -30);
  s.serviceReadings = readings;
  app.setState(s);
  const before = structuredClone(app.getState());
  assertMonth("a", aug, 140, 140, "Paid");
  assertMonth("a", sep, 60, 10, "Partial");
  assert.deepEqual(app.unpaidByMonth().a, { "2026-09": 50 });
  assert.equal(app.getTenantBalance("a"), 50);
  assert.equal(app.paymentCoverage("a", 50), "Covers Sep 2026");
  assert.deepEqual(app.getState(), before);
});

for (const mode of ["fixed", "actual"]) {
  test(`${mode}: month totals reconcile with balance, opening credit and project exclusion`, () => {
    const s = scenario(mode, [aug, sep]);
    if (mode === "actual") for (const date of ["2026-08-03", "2026-09-03"]) {
      s.transactions.push({ id: date, category: "Expenses", date, debitUsd: 100, shares: { a: 60, b: 40 } });
    }
    addWater(s);
    s.transactions.push(payment(0, sep, { creditLbp: 9000000, lbpRate: 100000 }),
      payment(999, sep, { id: "project", project: "Synthetic roof" }),
      { id: "opening", category: "Opening Balance", tenantId: "a", date: "2026-01-01", creditUsd: 10 });
    app.setState(s);
    // Two $60 base fees + generator $80 + water $30 - payment $90 - credit $10.
    assert.equal(app.getMonthlyDueForTenant("a", aug), 60);
    assert.equal(app.getMonthlyDueForTenant("a", sep), 170);
    assert.equal(app.getTenantBalance("a"), 130);
    assert.equal(app.getTenantBalance("b"), 140);
    const totals = app.tenantStatementRows("a").totals;
    assert.equal(totals.due, 230);
    assert.equal(totals.paid, 90);
    assert.equal(totals.outstanding - app.getTenantOpeningNet("a"), 130);
  });
}
