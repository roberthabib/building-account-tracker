// v194/v195: rent paid ahead counts as paid months; monthly rent follows
// calendar months with months paid in advance at signing; a flat can be let
// again from the day its lease ended.
import { test } from "node:test";
import assert from "node:assert/strict";
import { app } from "./harness.mjs";

const pay = (amount, date) => ({ id: `p-${date}-${amount}`, date, amount, method: "cash" });
const lease = (extra = {}) => ({ id: "l", flatId: "a", start: "2026-10-23", rent: 650, currency: "USD", period: "monthly", graceDays: 5, payments: [], status: "active", ...extra });

test("signing on 19 October, 3 months in advance: the rest of October by the days + Nov, Dec, Jan", () => {
  const l = lease({ start: "2026-10-19", advanceMonths: 3 });
  const p = app.leasePeriods(l, "2026-10-19");
  assert.deepEqual(p.map((x) => [x.start, x.due, x.amount]), [
    ["2026-10-19", "2026-10-19", 272.58], ["2026-11-01", "2026-10-19", 650], ["2026-12-01", "2026-10-19", 650], ["2027-01-01", "2026-10-19", 650],
  ]);
  assert.equal(app.leaseStatus(l, "2026-10-19").owed, 2222.58);
  const paid = { ...l, payments: [pay(2222.58, "2026-10-19")] };
  assert.equal(app.leaseStatus(paid, "2026-10-19").paidUntil, "2027-01-31");
  assert.deepEqual(app.nextRentDue(paid, "2026-10-19"), { date: "2027-02-01", amount: 650, now: false });
  // Each month after that is due on the 1st, the same amount.
  assert.deepEqual(app.leasePeriods(l, "2027-03-10").slice(4).map((x) => [x.due, x.amount]), [["2027-02-01", 650], ["2027-03-01", 650]]);
});

test("leases without the setting count one month in advance; on the 1st the whole month", () => {
  assert.equal(app.leaseAdvanceMonths(lease()), 1);
  assert.deepEqual(app.leasePeriods(lease({ start: "2026-11-01" }), "2026-11-01").map((x) => [x.start, x.amount]), [["2026-11-01", 650], ["2026-12-01", 650]]);
});

test("paid more than the signing amount: whole months ahead, the rest noted", () => {
  // Signing on 23 October: 23–31 Oct ($188.71) + November = $838.71.
  const ahead = lease({ payments: [pay(1488.71, "2026-10-23")] });
  const s = app.leaseStatus(ahead, "2026-10-23");
  assert.equal(s.owed, 0);
  assert.equal(s.paidUntil, "2026-12-31");
  assert.deepEqual(s.ahead.map((p) => p.start), ["2026-12-01"]);
  assert.deepEqual(app.nextRentDue(ahead, "2026-10-23"), { date: "2027-01-01", amount: 650, now: false });
  const part = app.leaseStatus(lease({ payments: [pay(1300, "2026-10-23")] }), "2026-10-23");
  assert.equal(part.paidUntil, "2026-11-30");
  assert.equal(part.creditLeft, 461.29);
  assert.deepEqual(app.nextRentDue(lease({ payments: [pay(1300, "2026-10-23")] }), "2026-10-23"), { date: "2026-12-01", amount: 188.71, now: false });
  const { rows } = app.rentStatementRows(ahead, "2026-10-23");
  assert.deepEqual(rows.map((r) => [r.start, r.state, Boolean(r.ahead)]), [["2026-10-23", "paid", false], ["2026-11-01", "paid", false], ["2026-12-01", "paid", true]]);
});

test("a flat is free again from the day its lease ended", () => {
  const leases = [{ id: "old", flatId: "a", start: "2026-10-23", status: "ended", endedOn: "2026-10-23", tenant: { name: "Maguy" } }];
  assert.equal(app.leaseClash(leases, { flatId: "a", start: "2026-10-23", end: "" }), null);
  const longer = [{ id: "old", flatId: "a", start: "2026-01-01", status: "ended", endedOn: "2026-10-23", tenant: { name: "Jad" } }];
  assert.equal(app.leaseClash(longer, { flatId: "a", start: "2026-10-23", end: "" }), null);
  assert.equal(app.leaseClash(longer, { flatId: "a", start: "2026-10-22", end: "" })?.id, "old");
});
