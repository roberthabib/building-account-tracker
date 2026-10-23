// v176 regression: generator (and water) shares inside each month's due.
// The v176 tests covered water only; these synthetic scenarios cover the
// generator side: readings missing, added, corrected and removed; combined
// service charges; partial/full payments; oldest-month-first allocation; late
// reminders; statement rows; and reconciliation with the overall balance in
// fixed and actual modes. Made-up data only.
import { test } from "node:test";
import assert from "node:assert/strict";
import { app, baseState } from "./harness.mjs";

const AUG = "2026-08-01";
const SEP = "2026-09-01";
const tenants = () => [
  { id: "a", name: "A", unit: "1A", active: true, coefficient: 600, breakerAmps: 10 },
  { id: "b", name: "B", unit: "1B", active: true, coefficient: 400, breakerAmps: 5 },
];
const fixedSettings = { collectionMode: "fixed", defaultDueUsd: 100, lbpPerUsd: 100000, language: "en" };
const months = (...ms) => ms.map((month) => ({ month, expectedUsd: 100 }));
const gen = (id, month, usd, part = "fuel", date = `${month.slice(0, 7)}-04`) => ({
  id, category: "Services Expenses", serviceType: "generator", servicePart: part, description: `Generator ${part}`,
  date, forMonth: month, debitUsd: usd, debitLbp: 0, creditUsd: 0, creditLbp: 0,
});
const water = (id, month, a, b) => ({
  id, category: "Services Expenses", serviceType: "water", waterSplit: "coefficient", description: "Water tanker",
  date: `${month.slice(0, 7)}-06`, forMonth: month, debitUsd: a + b, debitLbp: 0, creditUsd: 0, creditLbp: 0, shares: { a, b },
});
const pay = (id, tenantId, month, usd, extra = {}) => ({
  id, category: "Payments", tenantId, forMonth: month, date: `${month.slice(0, 7)}-12`,
  creditUsd: usd, creditLbp: 0, debitUsd: 0, debitLbp: 0, ...extra,
});
// kWh: a 30, b 10 (fuel splits 3:1); amps 10 and 5 (maintenance splits 2:1).
const reading = (month, aCurr = 130, bCurr = 210) => ({
  id: `r-${month}`, serviceType: "generator", forMonth: month,
  lines: { a: { breakerAmps: 10, previousReading: 100, currentReading: aCurr }, b: { breakerAmps: 5, previousReading: 200, currentReading: bCurr } },
});
const fixedState = (transactions, serviceReadings = [], ms = [SEP]) =>
  baseState({ tenants: tenants(), settings: { ...fixedSettings }, monthlyExpected: months(...ms), transactions, serviceReadings });

test("1. generator bill without readings: not yet billed, the month is the fee only", () => {
  app.setState(fixedState([gen("f1", SEP, 80)]));
  assert.equal(app.computeServiceDistribution("generator", SEP).distributed, false);
  assert.equal(app.getTenantServicesDue("a", { month: SEP }), 0);
  assert.equal(app.getMonthlyDueForTenant("a", SEP), 60);
  assert.equal(app.getTenantBalance("a"), 60);
});

test("2. readings added: each flat's kWh share joins that month", () => {
  app.setState(fixedState([gen("f1", SEP, 80)], [reading(SEP)]));
  const d = app.computeServiceDistribution("generator", SEP);
  assert.equal(d.distributed, true);
  assert.deepEqual(d.shares, { a: 60, b: 20 });
  assert.equal(app.getMonthlyDueForTenant("a", SEP), 120);
  assert.equal(app.getMonthlyDueForTenant("b", SEP), 60);
  assert.equal(app.getTenantBalance("a"), 120);
  assert.equal(app.getTenantBalance("b"), 60);
});

test("3. readings corrected: shares move, the bill still adds up, stored records untouched", () => {
  const raw = fixedState([gen("f1", SEP, 80)], [reading(SEP, 120, 220)]); // a 20 kWh, b 20 kWh
  app.setState(raw);
  const stored = JSON.stringify(app.getState().transactions) + JSON.stringify(app.getState().serviceReadings);
  const d = app.computeServiceDistribution("generator", SEP);
  assert.deepEqual(d.shares, { a: 40, b: 40 });
  assert.equal(d.shares.a + d.shares.b, 80);
  assert.equal(app.getMonthlyDueForTenant("a", SEP), 100);
  assert.equal(app.getMonthlyDueForTenant("b", SEP), 80);
  // Working out dues, statuses, reminders and statements changes nothing stored.
  app.paymentStatus("a", SEP);
  app.unpaidByMonth();
  app.tenantStatementRows("a");
  app.getTenantBalance("b");
  assert.equal(JSON.stringify(app.getState().transactions) + JSON.stringify(app.getState().serviceReadings), stored);
});

test("4. readings removed: back to not billed, dues and balance fall back", () => {
  app.setState(fixedState([gen("f1", SEP, 80)], [reading(SEP)]));
  assert.equal(app.getMonthlyDueForTenant("a", SEP), 120);
  const st = app.getState();
  st.serviceReadings = [];
  app.setState(st);
  assert.equal(app.getMonthlyDueForTenant("a", SEP), 60);
  assert.equal(app.getTenantBalance("a"), 60);
});

test("5. fuel + maintenance + water: one month's due, each part counted once", () => {
  app.setState(fixedState([gen("f1", SEP, 80), gen("m1", SEP, 30, "maintenance"), water("w1", SEP, 30, 20)], [reading(SEP)]));
  const d = app.computeServiceDistribution("generator", SEP);
  assert.equal(d.lines.a.consumptionUsd, 60);
  assert.equal(d.lines.a.maintenanceUsd, 20);
  assert.equal(d.lines.b.consumptionUsd, 20);
  assert.equal(d.lines.b.maintenanceUsd, 10);
  assert.equal(app.getTenantServicesDue("a", { serviceType: "generator", month: SEP }), 80);
  assert.equal(app.getTenantServicesDue("a", { serviceType: "water", month: SEP }), 30);
  assert.equal(app.getMonthlyDueForTenant("a", SEP), 60 + 80 + 30);
  assert.equal(app.getMonthlyDueForTenant("b", SEP), 40 + 30 + 20);
  assert.equal(app.getTenantBalance("a"), 170);
});

test("6. partial then full payment, in dollars and in LBP; project and opening amounts kept apart", () => {
  const base = [gen("f1", SEP, 80), water("w1", SEP, 30, 20)];
  app.setState(fixedState([...base, pay("p1", "a", SEP, 60)], [reading(SEP)]));
  let s = app.paymentStatus("a", SEP);
  assert.equal(s.expected, 150);
  assert.equal(s.paid, 60);
  assert.equal(s.label, "Partial");
  assert.equal(app.getTenantBalance("a"), 90);

  // The rest paid in LBP at the entry's own rate (90 USD × 90,000).
  const lbp = pay("p2", "a", SEP, 0, { creditLbp: 8100000, lbpRate: 90000 });
  // A project payment must not count toward monthly dues.
  const project = pay("p3", "a", SEP, 500, { project: "Roof" });
  app.setState(fixedState([...base, pay("p1", "a", SEP, 60), lbp, project], [reading(SEP)]));
  s = app.paymentStatus("a", SEP);
  assert.equal(s.paid, 150);
  assert.equal(s.label, "Paid");
  assert.equal(app.getTenantPaymentsTotal("a"), 150);
  assert.equal(app.getTenantBalance("a"), 0);

  // An opening credit lowers the balance but is not a payment for a month.
  const opening = { id: "o1", category: "Opening Balance", tenantId: "b", description: "Prepaid", date: "2026-08-01", creditUsd: 25, creditLbp: 0, debitUsd: 0, debitLbp: 0 };
  app.setState(fixedState([...base, opening], [reading(SEP)]));
  assert.equal(app.getMonthlyDueForTenant("b", SEP), 40 + 20 + 20);
  assert.equal(app.paymentStatus("b", SEP).label, "Due");
  assert.equal(app.getTenantBalance("b"), 80 - 25);
});

test("7. oldest month first: a payment for September settles August's fee + generator first", () => {
  app.setState(fixedState(
    [gen("f8", AUG, 40), gen("f9", SEP, 80), pay("p1", "a", SEP, 130)],
    [reading(AUG), reading(SEP)],
    [AUG, SEP],
  ));
  // August: 60 fee + 30 generator (a's 3/4 of 40) = 90; September: 60 + 60 = 120.
  assert.equal(app.getMonthlyDueForTenant("a", AUG), 90);
  assert.equal(app.getMonthlyDueForTenant("a", SEP), 120);
  const aug = app.paymentStatus("a", AUG);
  const sep = app.paymentStatus("a", SEP);
  assert.equal(aug.paid, 90);
  assert.equal(aug.label, "Paid");
  assert.equal(sep.paid, 40);
  assert.equal(sep.label, "Partial");
  assert.equal(app.getTenantBalance("a"), 90 + 120 - 130);
});

test("8. late reminders: unpaid generator shares are counted per month, by service month", () => {
  // The September fuel invoice is dated 2 October; it still belongs to September.
  app.setState(fixedState(
    [gen("f8", AUG, 40), gen("f9", SEP, 80, "fuel", "2026-10-02"), pay("p1", "a", AUG, 60)],
    [reading(AUG), reading(SEP)],
    [AUG, SEP],
  ));
  assert.equal(app.getTenantServicesDue("a", { month: SEP }), 60);
  assert.equal(app.getTenantServicesDue("a", { month: "2026-10-01" }), 0);
  const unpaid = app.unpaidByMonth();
  // a paid 60 of August's 90: 30 left; September 120 untouched. The invoice
  // date brings October into the month list; October carries only its fee
  // (the default monthly amount, as for any month not set separately) and
  // none of September's generator share.
  assert.deepEqual(unpaid.a, { "2026-08": 30, "2026-09": 120, "2026-10": 60 });
  assert.deepEqual(unpaid.b, { "2026-08": 50, "2026-09": 60, "2026-10": 40 });
  assert.equal(app.getMonthlyDueForTenant("a", "2026-10-01"), app.getExpectedForTenant("a", "2026-10-01"));
});

test("9. statement rows match the overall balance, in fixed and in actual mode", () => {
  const tx = [gen("f8", AUG, 40), gen("f9", SEP, 80), water("w9", SEP, 30, 20), pay("p1", "a", AUG, 90), pay("p2", "a", SEP, 50)];
  app.setState(fixedState(tx, [reading(AUG), reading(SEP)], [AUG, SEP]));
  const fixed = app.tenantStatementRows("a");
  const byMonth = Object.fromEntries(fixed.rows.map((r) => [r.month, r]));
  assert.equal(byMonth[AUG].due, 90);
  assert.equal(byMonth[AUG].paid, 90);
  assert.equal(byMonth[SEP].due, 150);
  assert.equal(byMonth[SEP].paid, 50);
  assert.equal(byMonth[SEP].outstanding, 100);
  assert.equal(Math.round(fixed.totals.due * 100) / 100, 240);
  assert.equal(Math.round(fixed.totals.outstanding * 100) / 100, app.getTenantBalance("a"));

  // Actual mode: the month's expense share + its generator and water share.
  const expense = { id: "e9", category: "Expenses", description: "Cleaning", date: "2026-09-03", debitUsd: 100, debitLbp: 0, creditUsd: 0, creditLbp: 0, shares: { a: 60, b: 40 } };
  app.setState(baseState({ tenants: tenants(), transactions: [...tx, expense], serviceReadings: [reading(AUG), reading(SEP)] }));
  assert.equal(app.getMonthlyDueForTenant("a", AUG), 30);
  assert.equal(app.getMonthlyDueForTenant("a", SEP), 60 + 60 + 30);
  const actual = app.tenantStatementRows("a");
  const due = Math.round(actual.rows.reduce((s, r) => s + r.due, 0) * 100) / 100;
  assert.equal(due, 30 + 150);
  assert.equal(app.getTenantBalance("a"), 180 - 140);
});

test("10. v183: each statement row is broken down into fee, generator and water", () => {
  const tx = [gen("f8", AUG, 40), gen("f9", SEP, 80), water("w9", SEP, 30, 20), pay("p1", "a", AUG, 90), pay("p2", "a", SEP, 50)];
  app.setState(fixedState(tx, [reading(AUG), reading(SEP)], [AUG, SEP]));
  const byMonth = Object.fromEntries(app.tenantStatementRows("a").rows.map((r) => [r.month, r]));
  for (const r of Object.values(byMonth)) assert.equal(Math.round((r.fee + r.generator + r.water) * 100) / 100, r.due);
  assert.ok(byMonth[SEP].generator > 0);
  assert.equal(byMonth[SEP].water, 30);
  assert.equal(byMonth[SEP].fee, app.getExpectedForTenant("a", SEP));
});
