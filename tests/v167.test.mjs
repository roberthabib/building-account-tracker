// v167: paid until, some flats, budget proposal, generator subscription, water
// meters, jobs, bookings, merging server-side changes, month fingerprints.
import { test } from "node:test";
import assert from "node:assert/strict";
import { app, baseState } from "./harness.mjs";

const tenants = [
  { id: "a", name: "A", unit: "1A", active: true, coefficient: 600, breakerAmps: 10 },
  { id: "b", name: "B", unit: "1B", active: true, coefficient: 400, breakerAmps: 20 },
];
const meta = (t) => ({ rev: 5, epoch: 0, token: "x", updatedAt: t });
const pad = (n) => String(n).padStart(2, "0");
function monthOffset(k) {
  const d = new Date();
  const x = new Date(d.getFullYear(), d.getMonth() + k, 1);
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-01`;
}
const pay = (id, tenantId, forMonth, usd) => ({ id, category: "Payments", tenantId, forMonth, date: forMonth, description: "", project: "", debitUsd: 0, debitLbp: 0, creditUsd: usd, creditLbp: 0, balanceUsd: usd, balanceLbp: 0 });
const expense = (id, date, usd, cat = "Cleaning", extra = {}) => ({ id, category: "Expenses", description: cat, date, expenseCategory: cat, debitUsd: usd, debitLbp: 0, creditUsd: 0, creditLbp: 0, balanceUsd: -usd, balanceLbp: 0, ...extra });

test("paid until: money paid ahead covers future months", () => {
  const months = [monthOffset(-2), monthOffset(-1), monthOffset(0)];
  app.setState(baseState({
    tenants: [{ id: "a", name: "A", unit: "1A", active: true, coefficient: 500 }],
    settings: { collectionMode: "fixed", defaultDueUsd: 200, lbpPerUsd: 100000, language: "en" },
    monthlyExpected: months.map((month) => ({ month, expectedUsd: 200 })),
    transactions: [pay("p1", "a", months[0], 100), pay("p2", "a", months[1], 100), pay("p3", "a", months[2], 300)],
  }));
  assert.equal(app.paidUntil("a"), monthOffset(2));
});

test("paid until: nothing shown while a month is still owed", () => {
  const months = [monthOffset(-1), monthOffset(0)];
  app.setState(baseState({
    tenants: [{ id: "a", name: "A", unit: "1A", active: true, coefficient: 500 }],
    settings: { collectionMode: "fixed", defaultDueUsd: 200, lbpPerUsd: 100000, language: "en" },
    monthlyExpected: months.map((month) => ({ month, expectedUsd: 200 })),
    transactions: [pay("p1", "a", months[0], 100)],
  }));
  assert.equal(app.paidUntil("a"), null);
  assert.deepEqual(app.unpaidByMonth(), { a: { [months[1].slice(0, 7)]: 100 } });
});

test("a cost shared by only some flats", () => {
  app.setState(baseState({ tenants: [...tenants, { id: "c", name: "C", unit: "2A", active: true, coefficient: 0 }] }));
  assert.deepEqual(app.computeSharedExpenseShares(100, "coefficient", null, ["a"]), { a: 100 });
  assert.deepEqual(app.computeSharedExpenseShares(90, "equal", null, ["a", "c"]), { a: 45, c: 45 });
});

test("budget proposal from the last 12 months", () => {
  const tx = [];
  for (let m = 0; m < 12; m += 1) {
    const d = new Date(2025, 9 + m, 10);
    tx.push(expense(`c${m}`, `${d.getFullYear()}-${pad(d.getMonth() + 1)}-10`, 100));
  }
  tx.push(expense("l1", "2026-03-02", 300, "Lift"));
  tx.push(expense("late", "2026-10-05", 999, "Lift"));
  tx.push({ ...expense("gen", "2026-05-05", 500, "Fuel"), category: "Services Expenses", serviceType: "generator" });
  app.setState(baseState({ tenants, transactions: tx }));
  const p = app.budgetProposal(10, "2026-10-21");
  assert.deepEqual(p.rows.map((r) => [r.category, r.last, r.next]), [["Cleaning", 1200, 1320], ["Lift", 300, 330]]);
  assert.equal(p.yearly, 1650);
  assert.equal(p.monthly, 137.5);
  assert.deepEqual(p.perFlat.map((f) => f.usd), [82.5, 55]);
  assert.equal(p.nextYear, "2027");
});

test("generator subscription per amp, plus metered kWh", () => {
  app.setState(baseState({
    tenants,
    settings: { collectionMode: "actual", lbpPerUsd: 100000, language: "en", generatorBilling: { mode: "subscription", perAmpUsd: 2, perKwhUsd: 0.5, since: "2026-09" } },
    serviceReadings: [
      { id: "r8", serviceType: "generator", forMonth: "2026-08-01", lines: { a: { previousReading: 0, currentReading: 10, breakerAmps: 10 }, b: { previousReading: 0, currentReading: 30, breakerAmps: 20 } } },
      { id: "r9", serviceType: "generator", forMonth: "2026-09-01", lines: { a: { previousReading: 100, currentReading: 120, breakerAmps: 10 } } },
    ],
    transactions: [{ id: "f8", category: "Services Expenses", serviceType: "generator", servicePart: "fuel", forMonth: "2026-08-01", date: "2026-08-03", debitUsd: 40, debitLbp: 0, creditUsd: 0, creditLbp: 0, balanceUsd: -40, balanceLbp: 0 }],
  }));
  const sep = app.computeServiceDistribution("generator", "2026-09-01");
  assert.equal(sep.subscription, true);
  assert.deepEqual(sep.shares, { a: 30, b: 40 });
  const aug = app.computeServiceDistribution("generator", "2026-08-01");
  assert.equal(aug.subscription, undefined);
  assert.deepEqual(aug.shares, { a: 10, b: 30 });
  assert.ok(app.getServiceMonths("generator").includes("2026-09-01"));
});

test("water shared by each flat's meter once the readings are in", () => {
  const bill = { id: "w1", category: "Services Expenses", serviceType: "water", waterSplit: "meter", forMonth: "2026-09-01", date: "2026-09-05", debitUsd: 60, debitLbp: 0, creditUsd: 0, creditLbp: 0, balanceUsd: -60, balanceLbp: 0, shares: null };
  app.setState(baseState({ tenants, transactions: [bill] }));
  assert.equal(app.getTenantExpenseShareForTransaction("a", bill), 0);
  app.setState(baseState({ tenants, transactions: [bill],
    serviceReadings: [{ id: "wr", serviceType: "water", forMonth: "2026-09-01", lines: { a: { previousReading: 10, currentReading: 14 }, b: { previousReading: 0, currentReading: 8 } } }] }));
  assert.equal(app.getTenantExpenseShareForTransaction("a", bill), 20);
  assert.equal(app.getTenantExpenseShareForTransaction("b", bill), 40);
});

test("today's jobs follow the chosen weekdays", () => {
  const today = new Date();
  const date = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
  app.setState(baseState({ tenants, routineTasks: [
    { id: "j1", title: "Stairs", days: [today.getDay()] },
    { id: "j2", title: "Rubbish", days: [] },
    { id: "j3", title: "Not today", days: [(today.getDay() + 1) % 7] },
  ], routineLog: [{ id: `j2:${date}`, taskId: "j2", date, done: true, at: "x" }] }));
  assert.deepEqual(app.todaysJobs(date).map((j) => [j.task.id, j.done]), [["j1", false], ["j2", true]]);
});

test("bookings of the same space can't overlap", () => {
  const list = [{ id: "x", spaceId: "roof", date: "2026-11-01", from: "18:00", to: "22:00", status: "booked" }];
  assert.equal(app.bookingClash(list, { spaceId: "roof", date: "2026-11-01", from: "21:00", to: "23:00" }), true);
  assert.equal(app.bookingClash(list, { spaceId: "roof", date: "2026-11-01", from: "22:00", to: "23:00" }), false);
  assert.equal(app.bookingClash(list, { spaceId: "hall", date: "2026-11-01", from: "19:00", to: "20:00" }), false);
  assert.equal(app.bookingClash([{ ...list[0], status: "cancelled" }], { spaceId: "roof", date: "2026-11-01", from: "19:00", to: "20:00" }), false);
});

test("changes made through the server survive the owner's next save", () => {
  const cloud = app.hydrateState(baseState({
    meta: meta("2026-10-21T10:00:00Z"),
    tenants: [{ ...tenants[0], phone: "70 999", language: "ar", detailsAt: "2026-10-21T10:00:00Z" }, tenants[1]],
    routineLog: [{ id: "j1:2026-10-21", taskId: "j1", date: "2026-10-21", done: true, at: "2026-10-21T09:00:00Z" }],
    supplies: [{ id: "s1", name: "Bulbs", qty: 3, lowAt: 2, updatedAt: "2026-10-21T09:30:00Z" }],
    boardPosts: [{ id: "p1", title: "Sofa", status: "pending", createdAt: "2026-10-21T08:00:00Z", updatedAt: "2026-10-21T08:00:00Z" }],
    visitorLog: [{ id: "v1", at: "2026-10-21T08:00:00Z", name: "Plumber" }],
  }));
  const phone = app.hydrateState(baseState({
    meta: meta("2026-10-21T12:00:00Z"),
    tenants: [{ ...tenants[0], phone: "70 111" }, tenants[1]],
    supplies: [{ id: "s1", name: "Bulbs", qty: 5, lowAt: 2, updatedAt: "2026-10-20T09:00:00Z" }],
    boardPosts: [],
  }));
  const merged = app.mergeStates(phone, cloud);
  const a = merged.tenants.find((t) => t.id === "a");
  assert.equal(a.phone, "70 999");
  assert.equal(a.language, "ar");
  assert.equal(merged.routineLog.length, 1);
  assert.equal(merged.supplies[0].qty, 3);
  assert.equal(merged.boardPosts[0].status, "pending");
  assert.equal(merged.visitorLog.length, 1);
});

test("a month's fingerprint changes when one of its entries changes", () => {
  app.setState(baseState({ tenants, transactions: [expense("e1", "2026-09-10", 100)] }));
  const before = app.monthFingerprint("2026-09-01");
  assert.equal(app.monthFingerprint("2026-09-01"), before);
  app.setState(baseState({ tenants, transactions: [expense("e1", "2026-09-10", 101)] }));
  assert.notEqual(app.monthFingerprint("2026-09-01"), before);
});

test("supplies at or below their warning level", () => {
  app.setState(baseState({ tenants, supplies: [{ id: "s1", name: "Bulbs", qty: 2, lowAt: 2 }, { id: "s2", name: "Soap", qty: 5, lowAt: 2 }, { id: "s3", name: "Filters", qty: 0 }] }));
  assert.deepEqual(app.lowSupplies().map((s) => s.id), ["s1"]);
});

test("board posts show for 30 days once approved", () => {
  assert.equal(app.boardPostVisible({ status: "approved", createdAt: "2026-10-01T00:00:00Z" }, "2026-10-21"), true);
  assert.equal(app.boardPostVisible({ status: "approved", createdAt: "2026-09-01T00:00:00Z" }, "2026-10-21"), false);
  assert.equal(app.boardPostVisible({ status: "pending", createdAt: "2026-10-20T00:00:00Z" }, "2026-10-21"), false);
});
