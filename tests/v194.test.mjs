// v194: rent paid ahead counts as paid periods; a flat can be let again from
// the day its lease ended.
import { test } from "node:test";
import assert from "node:assert/strict";
import { app } from "./harness.mjs";

const pay = (amount, date) => ({ id: `p-${date}-${amount}`, date, amount, method: "cash" });
const lease = (extra = {}) => ({ id: "l", flatId: "a", start: "2026-10-23", rent: 650, currency: "USD", period: "monthly", graceDays: 5, payments: [], status: "active", ...extra });

test("two months paid on day one: paid until the end of the second month", () => {
  const s = app.leaseStatus(lease({ payments: [pay(1300, "2026-10-23")] }), "2026-10-23");
  assert.equal(s.owed, 0);
  assert.equal(s.paidUntil, "2026-12-22");
  assert.deepEqual(s.ahead.map((p) => p.start), ["2026-11-23"]);
  assert.equal(s.creditLeft, 0);
  assert.deepEqual(app.nextRentDue(lease({ payments: [pay(1300, "2026-10-23")] }), "2026-10-23"), { date: "2026-12-23", amount: 650, now: false });
  const { rows } = app.rentStatementRows(lease({ payments: [pay(1300, "2026-10-23")] }), "2026-10-23");
  assert.deepEqual(rows.map((r) => [r.start, r.state, Boolean(r.ahead), r.paidBy.map((x) => x.amount)]), [
    ["2026-10-23", "paid", false, [650]], ["2026-11-23", "paid", true, [650]],
  ]);
});

test("part of a coming month paid: paid until stays, the rest is noted", () => {
  const s = app.leaseStatus(lease({ payments: [pay(1000, "2026-10-23")] }), "2026-10-23");
  assert.equal(s.paidUntil, "2026-11-22");
  assert.equal(s.creditLeft, 350);
  assert.deepEqual(app.nextRentDue(lease({ payments: [pay(1000, "2026-10-23")] }), "2026-10-23"), { date: "2026-11-23", amount: 300, now: false });
});

test("a flat is free again from the day its lease ended", () => {
  const leases = [{ id: "old", flatId: "a", start: "2026-10-23", status: "ended", endedOn: "2026-10-23", tenant: { name: "Maguy" } }];
  assert.equal(app.leaseClash(leases, { flatId: "a", start: "2026-10-23", end: "" }), null);
  const longer = [{ id: "old", flatId: "a", start: "2026-01-01", status: "ended", endedOn: "2026-10-23", tenant: { name: "Jad" } }];
  assert.equal(app.leaseClash(longer, { flatId: "a", start: "2026-10-23", end: "" }), null);
  assert.equal(app.leaseClash(longer, { flatId: "a", start: "2026-10-22", end: "" })?.id, "old");
});
