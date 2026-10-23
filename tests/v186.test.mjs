// v186 rentals round B: a renewal changes the rent from its start date, and
// the yearly increase then counts from the renewal.
import { test } from "node:test";
import assert from "node:assert/strict";
import { app } from "./harness.mjs";

const base = (extra = {}) => ({
  id: "lease-r", flatId: "a", start: "2025-11-01", end: "2026-10-31", rent: 600, currency: "USD", period: "monthly", graceDays: 5,
  increasePct: 10, payments: [], payouts: [], deductions: [], ...extra,
});

test("without a renewal the lease keeps its own rent and increase", () => {
  const p = app.leasePeriods(base({ end: "" }), "2026-12-15");
  assert.equal(p.find((x) => x.start === "2026-10-01").amount, 600);
  assert.equal(p.find((x) => x.start === "2026-11-01").amount, 660);
});

test("a renewal sets the rent from its start; the increase counts from there", () => {
  const lease = base({ end: "2028-10-31", rentChanges: [{ from: "2026-11-01", rent: 700 }] });
  const p = app.leasePeriods(lease, "2027-12-15");
  assert.equal(p.find((x) => x.start === "2026-10-01").amount, 600);
  assert.equal(p.find((x) => x.start === "2026-11-01").amount, 700);
  assert.equal(p.find((x) => x.start === "2027-10-01").amount, 700);
  assert.equal(p.find((x) => x.start === "2027-11-01").amount, 770);
  assert.deepEqual(app.leaseRentBase(lease, "2026-12-01"), { rent: 700, since: "2026-11-01" });
  assert.deepEqual(app.leaseRentBase(lease, "2026-01-01"), { rent: 600, since: "2025-11-01" });
});

test("the latest of several renewals wins", () => {
  const lease = base({ increasePct: 0, end: "", rentChanges: [{ from: "2027-11-01", rent: 800 }, { from: "2026-11-01", rent: 700 }] });
  const p = app.leasePeriods(lease, "2027-12-15");
  assert.deepEqual([p.find((x) => x.start === "2026-11-01").amount, p.find((x) => x.start === "2027-11-01").amount, p.at(-1).amount], [700, 800, 800]);
});
