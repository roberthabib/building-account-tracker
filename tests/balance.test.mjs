// Money logic tests. Every expected figure is worked out by hand from the
// rules in CLAUDE.md, never copied from the app's own output.
// Run: npm test   (or: node --test tests/)
import { test } from "node:test";
import assert from "node:assert/strict";
import { app, baseState } from "./harness.mjs";

const RATE = 100000; // LBP per USD in every scenario, for easy arithmetic

// Two tenants: t1 holds 60% (coefficient 600) on a 20 A breaker, t2 40% on 10 A.
const TENANTS = [
  { id: "t1", name: "One", unit: "1", active: true, coefficient: 600, breakerAmps: 20, pinHash: "" },
  { id: "t2", name: "Two", unit: "2", active: true, coefficient: 400, breakerAmps: 10, pinHash: "" },
];

function actualScenario() {
  return baseState({
    tenants: TENANTS,
    transactions: [
      // $100 expense, no snapshot -> split by coefficient: t1 60, t2 40
      { id: "e1", category: "Expenses", tenantId: null, date: "2026-09-02", debitUsd: 100 },
      // 500,000 LBP = $5 with a snapshot that overrides coefficients: t1 1, t2 4
      { id: "e2", category: "Expenses", tenantId: null, date: "2026-09-03", debitLbp: 500000, shares: { t1: 1, t2: 4 } },
      // Generator, September: fuel $90 (split by kWh), maintenance $30 (by amps)
      { id: "g1", category: "Services Expenses", serviceType: "generator", servicePart: "fuel", forMonth: "2026-09-01", date: "2026-09-05", debitUsd: 90 },
      { id: "g2", category: "Services Expenses", serviceType: "generator", servicePart: "maintenance", forMonth: "2026-09-01", date: "2026-09-06", debitUsd: 30 },
      // Water $10, snapshotted equal split
      { id: "w1", category: "Services Expenses", serviceType: "water", waterSplit: "equal", forMonth: "2026-09-01", date: "2026-09-07", debitUsd: 10, shares: { t1: 5, t2: 5 } },
      // Payments: t1 $50; t2 2,000,000 LBP = $20
      { id: "p1", category: "Payments", tenantId: "t1", forMonth: "2026-09-01", date: "2026-09-10", creditUsd: 50, receiptRef: "R1" },
      { id: "p2", category: "Payments", tenantId: "t2", forMonth: "2026-09-01", date: "2026-09-11", creditLbp: 2000000, receiptRef: "R2" },
      // A project payment must NOT reduce the monthly balance
      { id: "p3", category: "Payments", tenantId: "t1", project: "Roof", date: "2026-09-12", creditUsd: 100, receiptRef: "R3" },
      // Opening balances: t2 owed $15 before the app; t1 had $10 prepaid
      { id: "o1", category: "Opening Balance", tenantId: "t2", date: "2026-01-01", debitUsd: 15 },
      { id: "o2", category: "Opening Balance", tenantId: "t1", date: "2026-01-01", creditUsd: 10 },
    ],
    serviceReadings: [{
      id: "r1", serviceType: "generator", forMonth: "2026-09-01",
      lines: {
        t1: { breakerAmps: 20, previousReading: 100, currentReading: 160 }, // 60 kWh
        t2: { breakerAmps: 10, previousReading: 50, currentReading: 80 },   // 30 kWh
      },
    }],
  });
}

test("LBP converts at the configured rate", () => {
  app.setState(actualScenario());
  assert.equal(app.toUsd(0, 500000), 5);
  assert.equal(app.toUsd(10, 2000000), 30);
});

test("expense share: coefficient split, and a saved snapshot beats coefficients", () => {
  app.setState(actualScenario());
  assert.equal(app.getTenantExpenseShare("t1"), 61); // 60 + 1
  assert.equal(app.getTenantExpenseShare("t2"), 44); // 40 + 4
});

test("generator: fuel by metered kWh, maintenance by breaker amps", () => {
  app.setState(actualScenario());
  const d = app.computeServiceDistribution("generator", "2026-09-01");
  assert.equal(d.distributed, true);
  assert.equal(d.totalKwh, 90);
  // fuel 90 x 60/90 = 60, maint 30 x 20/30 = 20 -> 80;  fuel 30 + maint 10 -> 40
  assert.equal(d.shares.t1, 80);
  assert.equal(d.shares.t2, 40);
  assert.equal(d.shares.t1 + d.shares.t2, 120, "every dollar of the generator pool is billed");
});

test("generator month without readings is not billed yet", () => {
  const s = actualScenario();
  s.serviceReadings = [];
  app.setState(s);
  assert.equal(app.computeServiceDistribution("generator", "2026-09-01").distributed, false);
  assert.equal(app.getTenantServicesDue("t1"), 5); // water only
});

test("services due = generator + water", () => {
  app.setState(actualScenario());
  assert.equal(app.getTenantServicesDue("t1"), 85); // 80 + 5
  assert.equal(app.getTenantServicesDue("t2"), 45); // 40 + 5
  assert.equal(app.getTenantServicesDue("t1", { serviceType: "water" }), 5);
});

test("payments exclude project payments and convert LBP", () => {
  app.setState(actualScenario());
  assert.equal(app.getTenantPaymentsTotal("t1"), 50);
  assert.equal(app.getTenantPaymentsTotal("t2"), 20);
});

test("opening balance: debit = owes, credit = prepaid", () => {
  app.setState(actualScenario());
  assert.equal(app.getTenantOpeningNet("t1"), 10);  // credit
  assert.equal(app.getTenantOpeningNet("t2"), -15); // debit
});

test("balance (actual mode) = expenses + services - payments - opening net", () => {
  app.setState(actualScenario());
  assert.equal(app.getTenantBalance("t1"), 86); // 61 + 85 - 50 - 10
  assert.equal(app.getTenantBalance("t2"), 84); // 44 + 45 - 20 + 15
});

test("balance (fixed mode) uses the monthly amount by coefficient, ignores expenses, skips future months", () => {
  app.setState(baseState({
    settings: { collectionMode: "fixed", lbpPerUsd: RATE, defaultDueUsd: 0, language: "en" },
    tenants: TENANTS,
    monthlyExpected: [
      { month: "2026-08-01", expectedUsd: 500 },
      { month: "2026-09-01", expectedUsd: 500 },
      { month: "2099-01-01", expectedUsd: 500 }, // future: not due yet
    ],
    transactions: [
      { id: "e1", category: "Expenses", tenantId: null, date: "2026-09-02", debitUsd: 1000 },
      { id: "p1", category: "Payments", tenantId: "t1", forMonth: "2026-08-01", date: "2026-08-05", creditUsd: 250, receiptRef: "R1" },
    ],
  }));
  assert.equal(app.getTenantFixedDueTotal("t1"), 600); // 500 x 600/1000 x 2 months
  assert.equal(app.getTenantBalance("t1"), 350);       // 600 - 250
  assert.equal(app.getTenantBalance("t2"), 400);       // 500 x 400/1000 x 2
});

test("allocateByWeight never loses a cent to rounding", () => {
  const r = app.allocateByWeight(100, [{ id: "a", weight: 1 }, { id: "b", weight: 1 }, { id: "c", weight: 1 }]);
  assert.equal(Math.round((r.a + r.b + r.c) * 100), 10000);
  const none = app.allocateByWeight(9, [{ id: "a", weight: 0 }, { id: "b", weight: 0 }]);
  assert.equal(none.a + none.b, 9, "no positive weights -> equal split, still fully allocated");
});

test("merge: union by id, and a tombstone stops a deleted row coming back", () => {
  const local = baseState({
    meta: { rev: 3, epoch: 0, updatedAt: "2026-09-30T10:00:00.000Z" },
    transactions: [{ id: "a", category: "Expenses" }, { id: "b", category: "Expenses" }],
  });
  const remote = baseState({
    meta: { rev: 4, epoch: 0, updatedAt: "2026-09-30T11:00:00.000Z" },
    transactions: [{ id: "a", category: "Expenses" }, { id: "c", category: "Expenses" }],
    deleted: { transactions: ["b"], tenants: [], polls: [], projects: [] },
  });
  const ids = app.mergeStates(local, remote).transactions.map((t) => t.id).sort();
  assert.deepEqual(ids, ["a", "c"]);
});

test("merge: a higher epoch (Zero/Reset) wins wholesale", () => {
  const stale = baseState({ meta: { epoch: 1, updatedAt: "2026-09-30T12:00:00.000Z" }, transactions: [{ id: "old" }] });
  const wiped = baseState({ meta: { epoch: 2, updatedAt: "2026-09-30T09:00:00.000Z" }, transactions: [] });
  assert.equal(app.mergeStates(stale, wiped).transactions.length, 0);
});

test("an empty cloud copy is never allowed to silently replace real data", () => {
  app.setState(actualScenario());
  assert.equal(app.remoteWouldWipeLocalData(baseState()), true);
  assert.equal(app.remoteWouldWipeLocalData(actualScenario()), false);
  app.setState(baseState());
  assert.equal(app.remoteWouldWipeLocalData(baseState()), false, "nothing local to lose");
});
