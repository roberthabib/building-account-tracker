// v178 rentals: rent periods, oldest-first allocation, late and paid-until,
// yearly increase, end of lease, LBP, and what the flat's owner is owed.
import { test } from "node:test";
import assert from "node:assert/strict";
import { app } from "./harness.mjs";

const TODAY = "2026-10-23";
const base = (extra = {}) => ({ id: "lease-t1", flatId: "a", start: "2026-08-01", rent: 600, currency: "USD", period: "monthly", graceDays: 5, payments: [], payouts: [], deductions: [], ...extra });
const pay = (amount, date = "2026-08-02") => ({ id: `p${amount}${date}`, date, amount, method: "cash" });

test("monthly periods follow calendar months (v195); quarterly and yearly from the start day", () => {
  // Starts 15 August, one month in advance: 15–31 Aug by the days + September at signing, then October on the 1st.
  const p = app.leasePeriods(base({ start: "2026-08-15" }), TODAY);
  assert.deepEqual(p.map((x) => [x.start, x.due, x.amount]), [["2026-08-15", "2026-08-15", 329.03], ["2026-09-01", "2026-08-15", 600], ["2026-10-01", "2026-10-01", 600]]);
  assert.equal(p[0].end, "2026-08-31");
  assert.equal(p[1].lateFrom, "2026-08-20");
  assert.equal(app.leasePeriods(base({ period: "quarterly", start: "2026-01-10" }), TODAY).length, 4);
  assert.equal(app.leasePeriods(base({ period: "yearly", start: "2025-03-01" }), TODAY).length, 2);
  assert.deepEqual(app.leasePeriods(base({ start: "2026-11-01" }), TODAY), []);
});

test("the yearly increase applies on each anniversary", () => {
  const p = app.leasePeriods(base({ start: "2024-10-01", rent: 500, increasePct: 10, period: "yearly" }), TODAY);
  assert.deepEqual(p.map((x) => x.amount), [500, 550, 605]);
});

test("payments fill the oldest period first; late after the grace days", () => {
  const s = app.leaseStatus(base({ payments: [pay(600), pay(300, "2026-09-03")] }), TODAY);
  assert.deepEqual(s.periods.map((x) => [x.start, x.paid, x.state]), [
    ["2026-08-01", 600, "paid"], ["2026-09-01", 300, "late"], ["2026-10-01", 0, "late"],
  ]);
  assert.equal(s.owed, 900);
  assert.equal(s.lateAmount, 900);
  assert.equal(s.paidUntil, "2026-08-31");
  // Inside the grace days the new period is only due, not late.
  const early = app.leaseStatus(base({ payments: [pay(600), pay(600, "2026-09-02")] }), "2026-10-03");
  assert.equal(early.periods.at(-1).state, "due");
  assert.equal(early.lateCount, 0);
  assert.equal(early.paidUntil, "2026-09-30");
});

test("paid ahead: a credit, and paid until the last period", () => {
  const s = app.leaseStatus(base({ payments: [pay(2000)] }), TODAY);
  assert.equal(s.owed, 0);
  assert.equal(s.credit, 200);
  assert.equal(s.paidUntil, "2026-10-31");
});

test("an ended lease stops charging; LBP rents round to whole pounds", () => {
  const ended = app.leaseStatus(base({ status: "ended", endedOn: "2026-09-10", payments: [pay(1200)] }), TODAY);
  assert.equal(ended.periods.length, 2);
  assert.equal(ended.owed, 0);
  const lbp = app.leasePeriods(base({ rent: 1000001, currency: "LBP", increasePct: 3.3, start: "2025-09-01", period: "yearly" }), TODAY);
  assert.deepEqual(lbp.map((x) => x.amount), [1000001, 1033001]);
});

test("owner account: collected − fee − expenses − handed over", () => {
  const lease = base({
    fee: { kind: "percent", value: 10 },
    payments: [pay(600), pay(300, "2026-09-03")],
    deductions: [{ id: "d1", date: "2026-09-05", amount: 50, description: "Tap" }],
    payouts: [{ id: "o1", date: "2026-09-06", amount: 500 }],
  });
  assert.deepEqual(app.leaseOwnerAccount(lease, TODAY), { currency: "USD", collected: 900, fee: 90, deductions: 50, paidOut: 500, toHandOver: 260 });
  // A fixed fee counts once per fully paid period.
  assert.equal(app.leaseOwnerAccount({ ...lease, fee: { kind: "fixed", value: 20 } }, TODAY).fee, 20);
  // The manager's own flat: no fee, nothing to hand over.
  const own = app.leaseOwnerAccount({ ...lease, ownFlat: true }, TODAY);
  assert.equal(own.fee, 0);
  assert.equal(own.toHandOver, 0);
  assert.equal(own.collected, 900);
});
