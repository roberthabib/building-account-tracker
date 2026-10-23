// v187 rentals round C: the overview figures, how late each tenant is, and
// the owner's statement month by month.
import { test } from "node:test";
import assert from "node:assert/strict";
import { app } from "./harness.mjs";

const TODAY = "2026-10-23";
const pay = (amount, date) => ({ id: `p-${date}`, date, amount, method: "bank" });
const lease = (id, flatId, extra = {}) => ({
  id, flatId, start: "2026-07-01", rent: 600, currency: "USD", period: "monthly", graceDays: 5, payments: [], payouts: [], deductions: [],
  fee: { kind: "percent", value: 10 }, status: "active", ...extra,
});
const flats = [{ id: "a", unit: "1A" }, { id: "b", unit: "1B" }, { id: "c", unit: "2A" }, { id: "d", unit: "2B", active: false }];

test("how late a tenant is: days since the oldest late period's late day", () => {
  const behind = lease("l1", "a", { payments: [pay(600, "2026-07-02"), pay(600, "2026-08-03")] });
  assert.deepEqual(app.arrearsAge(behind, TODAY), { days: 47, owed: 1200, currency: "USD" });
  assert.equal(app.arrearsAge(lease("l2", "b", { payments: [600, 600, 600, 600].map((v, i) => pay(v, `2026-${String(7 + i).padStart(2, "0")}-01`)) }), TODAY), null);
});

test("the overview: this month, who is behind, occupancy, hand-overs, 12 months", () => {
  const leases = [
    lease("l1", "a", { payments: [pay(600, "2026-07-02"), pay(600, "2026-08-03")] }),
    lease("l2", "b", { payments: [pay(600, "2026-07-01"), pay(600, "2026-08-01"), pay(600, "2026-09-01"), pay(600, "2026-10-02")], payouts: [{ id: "o", date: "2026-10-05", amount: 1000 }] }),
    lease("l3", "c", { status: "ended", endedOn: "2026-08-31", payments: [pay(1200, "2026-07-01")] }),
  ];
  const d = app.rentalsOverviewData(leases, flats, TODAY);
  assert.equal(d.expected.reduce((t, x) => t + x.v, 0), 1200);
  assert.equal(d.collected.reduce((t, x) => t + x.v, 0), 600);
  assert.deepEqual(d.buckets.map((b) => b.count), [0, 1, 0, 0]);
  assert.equal(d.rented, 2);
  assert.equal(d.flats, 3);
  assert.deepEqual(d.toHandOver.map((x) => x.v), [1080, 1160]);
  assert.equal(d.months.length, 12);
  assert.equal(d.months.at(-1).month, "2026-10");
  assert.equal(d.months.find((m) => m.month === "2026-07").usd, 2400);
});

test("the owner's statement, month by month", () => {
  const l = lease("l2", "b", {
    payments: [pay(600, "2026-07-01"), pay(600, "2026-08-01"), pay(600, "2026-09-01")],
    payouts: [{ id: "o", date: "2026-09-10", amount: 1000 }], deductions: [{ id: "d", date: "2026-08-20", amount: 40, description: "Lock" }],
  });
  const rows = app.ownerStatementMonths(l, "2026");
  assert.deepEqual(rows.map((r) => [r.month, r.due, r.collected, r.fee, r.expenses, r.handedOver]), [
    ["2026-07", 600, 600, 60, 0, 0], ["2026-08", 600, 600, 60, 40, 0], ["2026-09", 600, 600, 60, 0, 1000], ["2026-10", 600, 0, 0, 0, 0],
  ]);
  const fixed = app.ownerStatementMonths({ ...l, fee: { kind: "fixed", value: 50 } }, "2026");
  assert.deepEqual(fixed.map((r) => r.fee), [50, 50, 50, 0]);
});
