// v182: a monthly payment's receipt shows what it paid for — the monthly fee,
// then the generator, then the water — after what was already paid that month.
import { test } from "node:test";
import assert from "node:assert/strict";
import { app, baseState } from "./harness.mjs";

const tenants = [
  { id: "a", name: "A", unit: "1A", active: true, coefficient: 600 },
  { id: "b", name: "B", unit: "1B", active: true, coefficient: 400 },
];
const water = {
  id: "w1", category: "Services Expenses", serviceType: "water", waterSplit: "coefficient", description: "Water tanker",
  date: "2026-09-05", forMonth: "2026-09-01", debitUsd: 50, debitLbp: 0, creditUsd: 0, creditLbp: 0, shares: { a: 30, b: 20 },
};
const pay = (id, usd, date = "2026-09-10") => ({
  id, category: "Payments", tenantId: "a", forMonth: "2026-09-01", date, creditUsd: usd, creditLbp: 0, debitUsd: 0, debitLbp: 0,
});
const setup = (...payments) => {
  app.setState(baseState({
    tenants,
    settings: { collectionMode: "fixed", defaultDueUsd: 100, lbpPerUsd: 100000, language: "en" },
    monthlyExpected: [{ month: "2026-09-01", expectedUsd: 100 }],
    transactions: [water, ...payments],
  }));
};
const rowsFor = (entry) => app.receiptBreakdownRows({ tenant: tenants[0], receiptEntries: [entry] }).map((r) => [...r.slice(0, 4), Boolean(r.total)]);

test("a full payment shows the fee and the water, with the month's total", () => {
  const p = pay("p1", 90);
  setup(p);
  assert.deepEqual(rowsFor(p), [
    ["Sep 2026", "Monthly fee", "$60.00", "$60.00", false],
    ["", "Water", "$30.00", "$30.00", false],
    ["", "Total for the month", "$90.00", "$90.00", true],
  ]);
});

test("an earlier payment that month is counted first", () => {
  const first = pay("p1", 40, "2026-09-03");
  const second = pay("p2", 50, "2026-09-20");
  setup(first, second);
  assert.deepEqual(rowsFor(second).map((r) => r[3]), ["$20.00", "$30.00", "$50.00"]);
  assert.deepEqual(rowsFor(first).map((r) => r[3]), ["$40.00", "$0.00", "$40.00"]);
});

test("more than the month's due shows the extra as credit", () => {
  const p = pay("p1", 100);
  setup(p);
  assert.deepEqual(rowsFor(p).map((r) => [r[1], r[3]]), [
    ["Monthly fee", "$60.00"], ["Water", "$30.00"], ["Extra (credit)", "$10.00"], ["Total for the month", "$100.00"],
  ]);
});

test("a month with only the fee is a single row with its status", () => {
  const p = { ...pay("p1", 40), forMonth: "2026-10-01", date: "2026-10-02" };
  app.setState(baseState({
    tenants,
    settings: { collectionMode: "fixed", defaultDueUsd: 100, lbpPerUsd: 100000, language: "en" },
    monthlyExpected: [{ month: "2026-10-01", expectedUsd: 100 }],
    transactions: [p],
  }));
  const rows = app.receiptBreakdownRows({ tenant: tenants[0], receiptEntries: [p] });
  assert.equal(rows.length, 1);
  assert.deepEqual(rows[0].slice(0, 4), ["Oct 2026", "Monthly fee", "$60.00", "$40.00"]);
  assert.ok(rows[0][4]);
});

test("the month's status follows the breakdown: paid in full or partly", () => {
  const first = pay("p1", 40, "2026-09-03");
  const second = pay("p2", 50, "2026-09-20");
  setup(first, second);
  assert.equal(app.receiptBreakdownRows({ tenant: tenants[0], receiptEntries: [first] }).at(-1)[4], "Partial");
  assert.equal(app.receiptBreakdownRows({ tenant: tenants[0], receiptEntries: [second] }).at(-1)[4], "Paid");
});
