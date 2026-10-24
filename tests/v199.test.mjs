// v199: the owners tab — owner groups, the summary, fees by period, one
// hand-over shared between an owner's flats, deleted hand-overs, statements.
import { test } from "node:test";
import assert from "node:assert/strict";
import { app } from "./harness.mjs";

const TODAY = "2026-10-24";
const pay = (amount, date) => ({ id: `p-${date}-${amount}`, date, amount, method: "bank" });
const lease = (id, flatId, extra = {}) => ({
  id, flatId, start: "2026-07-01", rent: 600, currency: "USD", period: "monthly", graceDays: 5, advanceMonths: 1, payments: [], payouts: [], deductions: [],
  fee: { kind: "percent", value: 10 }, status: "active", ...extra,
});
const flats = [{ id: "a", unit: "2A", name: "Omar T.", phone: "70 111 222" }, { id: "b", unit: "2B", name: "omar t." }, { id: "c", unit: "3A", name: "Sami K." }, { id: "d", unit: "1A", name: "Me" }];

test("fees between two dates: percent on rent received, fixed per paid period", () => {
  const l = lease("l1", "a", { payments: [pay(600, "2026-09-01"), pay(600, "2026-10-02")] });
  assert.equal(app.leaseFeesBetween(l, "2026-10-01", "2026-10-31", TODAY), 60);
  assert.equal(app.leaseFeesBetween(l, "2026-01-01", "2026-12-31", TODAY), 120);
  const fixed = lease("l2", "a", { fee: { kind: "fixed", value: 25 }, payments: [pay(1200, "2026-07-01")] });
  assert.equal(app.leaseFeesBetween(fixed, "2026-07-01", "2026-07-31", TODAY), 50);
  assert.equal(app.leaseFeesBetween(lease("l3", "d", { ownFlat: true, payments: [pay(600, "2026-10-01")] }), "2026-10-01", "2026-10-31", TODAY), 0);
});

test("one card per owner (same name, any case), own flats last; settled owners marked", () => {
  const leases = [
    lease("l1", "a", { payments: [pay(1000, "2026-10-01")] }),
    lease("l2", "b", { payments: [pay(500, "2026-10-01")], deposit: { amount: 600 } }),
    lease("l3", "c", { status: "ended", endedOn: "2026-08-31", payments: [pay(100, "2026-07-01")], payouts: [{ id: "o", date: "2026-09-01", amount: 90 }] }),
    lease("l4", "d", { ownFlat: true }),
  ];
  const groups = app.rentalOwnerGroups(leases, flats, TODAY);
  assert.deepEqual(groups.map((g) => [g.name, g.leases.length, g.settled]), [["Omar T.", 2, false], ["Sami K.", 1, true], ["Your own flats", 1, false]]);
  assert.equal(groups[0].phone, "70 111 222");
  assert.deepEqual(groups[0].account.USD, { collected: 1500, fee: 150, deductions: 0, paidOut: 0, depositKept: 0, toHandOver: 1350, deposit: 600 });
  const sum = app.ownersSummary(groups, TODAY);
  assert.deepEqual([sum.toHandOver.USD, sum.feesMonth.USD, sum.feesYear.USD], [1350, 150, 160]);
});

test("a hand-over for several flats goes to the biggest amounts due first", () => {
  const leases = [lease("l1", "a", { payments: [pay(1000, "2026-10-01")] }), lease("l2", "b", { payments: [pay(500, "2026-10-01")] })];
  assert.deepEqual(app.splitHandOver(leases, 1000, TODAY), [{ leaseId: "l1", amount: 900 }, { leaseId: "l2", amount: 100 }]);
  assert.deepEqual(app.splitHandOver(leases, 1500, TODAY), [{ leaseId: "l1", amount: 1050 }, { leaseId: "l2", amount: 450 }]);
});

test("a deleted hand-over no longer counts, and its receipt is gone from the list", () => {
  const l = lease("l1", "a", { payments: [pay(1000, "2026-10-01")], payouts: [
    { id: "o1", receipt: "HO-1", verifyCode: "ABCDEFGHJK", date: "2026-10-05", amount: 400, method: "cash" },
    { id: "o2", receipt: "HO-2", verifyCode: "ABCDEFGHJM", date: "2026-10-06", amount: 100, method: "cash", voidedAt: "2026-10-07T10:00:00Z" },
  ] });
  assert.equal(app.leaseOwnerAccount(l, TODAY).paidOut, 400);
  assert.deepEqual(app.ownerHistoryEntries([l]).map((e) => [e.kind, e.ref, e.amount]), [["handover", "HO-1", 400]]);
});

test("statement for a period: months, totals, entries; due now counts everything", () => {
  const leases = [lease("l1", "a", { payments: [pay(600, "2026-09-01"), pay(600, "2026-10-02")], deductions: [{ id: "d1", date: "2026-10-10", amount: 50, description: "Tap" }],
    payouts: [{ id: "o1", receipt: "HO-1", date: "2026-09-05", amount: 540, method: "bank" }] })];
  const g = app.rentalOwnerGroups(leases, flats, TODAY)[0];
  const d = app.ownerStatementData(g, "2026-10-01", "2026-10-31", TODAY);
  assert.deepEqual(d.rows, [{ month: "2026-10", collected: 600, fee: 60, expenses: 50, handedOver: 0 }]);
  assert.deepEqual(d.entries.map((e) => e.kind), ["expense"]);
  assert.equal(d.dueNow, 1200 - 120 - 50 - 540);
  assert.match(app.ownerPeriodStatementText(d, "en"), /Due to you now: \$490\.00/);
});

test("fees report: month by month for the year", () => {
  const leases = [lease("l1", "a", { payments: [pay(600, "2026-09-01"), pay(600, "2026-10-02")] }), lease("l2", "d", { ownFlat: true, payments: [pay(600, "2026-10-02")] })];
  const r = app.feesReportData(2026, leases, TODAY);
  assert.equal(r.rows.length, 10);
  assert.deepEqual(r.rows.filter((x) => x.parts.length).map((x) => [x.month, x.total.USD]), [["2026-09", 60], ["2026-10", 60]]);
  assert.equal(r.total.USD, 120);
});
