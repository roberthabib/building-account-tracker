// v200: a rent receipt names the months a payment paid, including months
// paid in advance (not "extra (credit)").
import { test } from "node:test";
import assert from "node:assert/strict";
import { app } from "./harness.mjs";

const pay = (id, amount, date) => ({ id, date, amount, method: "cash" });
// Signed 23 October: 23–31 Oct = $188.71, then $650 a month.
const lease = (payments) => ({ id: "l", flatId: "a", start: "2026-10-23", rent: 650, currency: "USD", period: "monthly", graceDays: 5, advanceMonths: 1, status: "active", payments });

test("money beyond what is due pays the next months, named one by one", () => {
  const l = lease([pay("p1", 1300, "2026-10-23"), pay("p2", 650, "2026-10-24"), pay("p3", 188.71, "2026-10-24")]);
  const rows = (id) => app.rentPaymentAllocation(l, id, "2026-10-24").rows.map((r) => [r.period.start, r.applied, app.rentAllocationState(r)]);
  assert.deepEqual(rows("p1"), [["2026-10-23", 188.71, "Paid"], ["2026-11-01", 650, "Paid"], ["2026-12-01", 461.29, "Part paid ahead"]]);
  assert.deepEqual(rows("p2"), [["2026-12-01", 188.71, "Paid ahead"], ["2027-01-01", 461.29, "Part paid ahead"]]);
  assert.deepEqual(rows("p3"), [["2027-01-01", 188.71, "Paid ahead"]]);
  assert.equal(app.rentPaymentAllocation(l, "p2", "2026-10-24").credit, 0);
});

test("an ended lease: what is beyond its last period stays extra", () => {
  const ended = { ...lease([pay("p1", 1000, "2026-10-23")]), status: "ended", endedOn: "2026-11-30" };
  const r = app.rentPaymentAllocation(ended, "p1", "2026-12-05");
  assert.deepEqual(r.rows.map((x) => x.period.start), ["2026-10-23", "2026-11-01"]);
  assert.equal(r.credit, 161.29);
});
