// v176: a month's generator and water share is part of what a tenant owes for
// that month — on top of the fixed amount, or of the expense share without one.
import { test } from "node:test";
import assert from "node:assert/strict";
import { app, baseState } from "./harness.mjs";

const tenants = [
  { id: "a", name: "A", unit: "1A", active: true, coefficient: 600 },
  { id: "b", name: "B", unit: "1B", active: true, coefficient: 400 },
];
const water = (id, month, a, b) => ({
  id, category: "Services Expenses", serviceType: "water", waterSplit: "coefficient", description: "Water tanker",
  date: `${month.slice(0, 7)}-05`, forMonth: month, debitUsd: a + b, debitLbp: 0, creditUsd: 0, creditLbp: 0, shares: { a, b },
});
const pay = (id, tenantId, month, usd) => ({
  id, category: "Payments", tenantId, forMonth: month, date: `${month.slice(0, 7)}-10`, creditUsd: usd, creditLbp: 0, debitUsd: 0, debitLbp: 0,
});

test("fixed amount: the month's water share is added to that month", () => {
  app.setState(baseState({
    tenants,
    settings: { collectionMode: "fixed", defaultDueUsd: 100, lbpPerUsd: 100000, language: "en" },
    monthlyExpected: [{ month: "2026-08-01", expectedUsd: 100 }, { month: "2026-09-01", expectedUsd: 100 }],
    transactions: [water("w1", "2026-09-01", 30, 20)],
  }));
  assert.equal(app.getExpectedForTenant("a", "2026-09-01"), 60);
  assert.equal(app.getMonthlyDueForTenant("a", "2026-09-01"), 90);
  assert.equal(app.getMonthlyDueForTenant("a", "2026-08-01"), 60);
  assert.equal(app.getMonthlyDueForTenant("b", "2026-09-01"), 60);
});

test("fixed amount: paying only the fee leaves the month partly due", () => {
  app.setState(baseState({
    tenants,
    settings: { collectionMode: "fixed", defaultDueUsd: 100, lbpPerUsd: 100000, language: "en" },
    monthlyExpected: [{ month: "2026-09-01", expectedUsd: 100 }],
    transactions: [water("w1", "2026-09-01", 30, 20), pay("p1", "a", "2026-09-01", 60)],
  }));
  const s = app.paymentStatus("a", "2026-09-01");
  assert.equal(s.expected, 90);
  assert.equal(s.paid, 60);
  assert.equal(s.label, "Partial");
  assert.deepEqual(app.unpaidByMonth().a, { "2026-09": 30 });
  // The total balance is unchanged by v176: fee 60 + water 30 − paid 60.
  assert.equal(app.getTenantBalance("a"), 30);
});

test("fixed amount: paying fee + water settles the month", () => {
  app.setState(baseState({
    tenants,
    settings: { collectionMode: "fixed", defaultDueUsd: 100, lbpPerUsd: 100000, language: "en" },
    monthlyExpected: [{ month: "2026-09-01", expectedUsd: 100 }],
    transactions: [water("w1", "2026-09-01", 30, 20), pay("p1", "a", "2026-09-01", 90)],
  }));
  assert.equal(app.paymentStatus("a", "2026-09-01").label, "Paid");
  assert.equal(app.getTenantBalance("a"), 0);
});

test("no fixed amount: the water share is added to the month's expense share", () => {
  app.setState(baseState({
    tenants,
    transactions: [
      { id: "e1", category: "Expenses", description: "Cleaning", date: "2026-09-03", debitUsd: 100, debitLbp: 0, creditUsd: 0, creditLbp: 0, shares: { a: 60, b: 40 } },
      water("w1", "2026-09-01", 30, 20),
    ],
  }));
  assert.equal(app.getMonthlyDueForTenant("a", "2026-09-01"), 90);
  assert.equal(app.getMonthlyDueForTenant("b", "2026-09-01"), 60);
  assert.equal(app.getTenantBalance("a"), 90);
});
