// v185 rentals round A: late fees, the reminder schedule kept on each lease,
// and which rent periods a payment paid (rent receipts).
import { test } from "node:test";
import assert from "node:assert/strict";
import { app } from "./harness.mjs";

const TODAY = "2026-10-23";
const pay = (amount, date, id = `p-${date}`) => ({ id, date, amount, method: "cash" });
const base = (extra = {}) => ({
  id: "lease-t", flatId: "a", start: "2026-08-01", rent: 600, currency: "USD", period: "monthly", graceDays: 5,
  payments: [pay(600, "2026-08-02"), pay(600, "2026-09-10")], payouts: [], deductions: [],
  lateFee: { kind: "fixed", value: 25, since: "2026-01-01" }, ...extra,
});

test("a late fee is charged on periods not paid by their late day", () => {
  const s = app.leaseStatus(base(), TODAY);
  assert.deepEqual(s.periods.map((p) => [p.start, p.amount, p.lateFee || 0, p.state]), [
    ["2026-08-01", 600, 0, "paid"], ["2026-09-01", 625, 25, "late"], ["2026-10-01", 625, 25, "late"],
  ]);
  assert.equal(s.dueTotal, 1850);
  assert.equal(s.owed, 650);
});

test("no fee without a rule, before it started, or once waived; percent fees", () => {
  assert.equal(app.leaseStatus(base({ lateFee: null }), TODAY).dueTotal, 1800);
  assert.deepEqual(app.leaseStatus(base({ lateFee: { kind: "fixed", value: 25, since: "2026-10-01" } }), TODAY).periods.map((p) => p.lateFee || 0), [0, 0, 25]);
  assert.deepEqual(app.leaseStatus(base({ waivedFees: ["2026-09-01"] }), TODAY).periods.map((p) => p.lateFee || 0), [0, 0, 25]);
  assert.deepEqual(app.leaseStatus(base({ lateFee: { kind: "percent", value: 5, since: "2026-01-01" } }), TODAY).periods.map((p) => p.lateFee || 0), [0, 30, 30]);
  // Not late yet: no fee before the late day.
  assert.deepEqual(app.leaseStatus(base(), "2026-10-04").periods.map((p) => p.lateFee || 0), [0, 25, 0]);
});

test("the reminder schedule: rent due before this period, received, and coming periods", () => {
  const sch = app.leaseSchedule(base({ end: "2027-07-31" }), TODAY);
  assert.equal(sch.asOf, TODAY);
  assert.equal(sch.dueBefore, 1225);
  assert.equal(sch.paid, 1200);
  assert.deepEqual(sch.periods[0], { start: "2026-10-01", lateFrom: "2026-10-06", amount: 625 });
  assert.deepEqual(sch.periods[1], { start: "2026-11-01", lateFrom: "2026-11-06", amount: 600 });
  assert.equal(sch.periods.at(-1).start, "2027-07-01");
  // What the server works out on a later day equals the app's own figure.
  const later = "2026-11-20";
  const serverOwed = sch.dueBefore + sch.periods.filter((p) => p.start <= later).reduce((t, p) => t + p.amount, 0) - sch.paid;
  assert.equal(serverOwed, app.leaseStatus(base({ lateFee: null }), later).owed + 50);
});

test("a rent receipt lists the periods that payment paid", () => {
  const lease = base({ payments: [pay(600, "2026-08-02"), pay(1000, "2026-09-10")] });
  const a = app.rentPaymentAllocation(lease, "p-2026-09-10", TODAY);
  assert.deepEqual(a.rows.map((r) => [r.period.start, r.applied, r.done]), [["2026-09-01", 625, true], ["2026-10-01", 375, false]]);
  assert.equal(a.credit, 0);
  const first = app.rentPaymentAllocation(lease, "p-2026-08-02", TODAY);
  assert.deepEqual(first.rows.map((r) => [r.period.start, r.applied, r.done]), [["2026-08-01", 600, true]]);
  const big = app.rentPaymentAllocation(base({ lateFee: null, payments: [pay(2000, "2026-08-02")] }), "p-2026-08-02", TODAY);
  assert.deepEqual(big.rows.map((r) => r.applied), [600, 600, 600]);
  assert.equal(big.credit, 200);
});
