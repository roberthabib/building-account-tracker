// v193 rentals, clearer: which payment paid which period, the next rent to
// pay, and what a new payment would cover.
import { test } from "node:test";
import assert from "node:assert/strict";
import { app } from "./harness.mjs";

const TODAY = "2026-10-23";
const pay = (amount, date) => ({ id: `p-${date}`, date, amount, method: "cash" });
const lease = (extra = {}) => ({
  id: "l", flatId: "a", start: "2026-08-01", rent: 600, currency: "USD", period: "monthly", graceDays: 5, payments: [], status: "active", ...extra,
});

test("each period lists the payments that paid it", () => {
  const { rows } = app.rentStatementRows(lease({ payments: [pay(900, "2026-08-02"), pay(500, "2026-09-20")] }), TODAY);
  assert.deepEqual(rows.map((r) => [r.start, r.state, r.paidBy.map((x) => [x.date, x.amount])]), [
    ["2026-08-01", "paid", [["2026-08-02", 600]]],
    ["2026-09-01", "paid", [["2026-08-02", 300], ["2026-09-20", 300]]],
    ["2026-10-01", "late", [["2026-09-20", 200]]],
  ]);
});

test("the next rent: what is owed now, else the next period less any advance", () => {
  assert.deepEqual(app.nextRentDue(lease({ payments: [pay(1200, "2026-08-02")] }), TODAY), { date: "2026-10-01", amount: 600, now: true });
  assert.deepEqual(app.nextRentDue(lease({ payments: [pay(1800, "2026-08-02")] }), TODAY), { date: "2026-11-01", amount: 600, now: false });
  assert.deepEqual(app.nextRentDue(lease({ payments: [pay(2000, "2026-08-02")] }), TODAY), { date: "2026-11-01", amount: 400, now: false });
  assert.equal(app.nextRentDue(lease({ status: "ended" }), TODAY), null);
});

test("what a payment covers, oldest open period first", () => {
  const l = lease({ payments: [pay(600, "2026-08-02")] });
  assert.equal(app.rentCoverageText(l, 600, TODAY), "Covers Sep 2026");
  assert.equal(app.rentCoverageText(l, 1500, TODAY), "Covers Sep 2026, Oct 2026 · $300.00 toward Nov 2026");
  assert.equal(app.rentCoverageText(l, 0, TODAY), "");
  assert.match(app.rentCoverageText(lease({ end: "2026-09-30", payments: [] }), 1500, TODAY), /\$300\.00 in advance$/);
});
