// v201: move-out settlement, rent from a statement, your own flats' year,
// the lease contract's wording.
import { test } from "node:test";
import assert from "node:assert/strict";
import { app } from "./harness.mjs";

const pay = (id, amount, date) => ({ id, date, amount, method: "cash" });
const lease = (extra = {}) => ({ id: "l", flatId: "a", start: "2026-07-01", rent: 600, currency: "USD", period: "monthly", graceDays: 5, advanceMonths: 1, status: "active", payments: [], ...extra });

test("settlement: unpaid rent comes out of the deposit, damages are kept, the rest goes back", () => {
  // July–October due (2,400), 1,800 paid → 600 unpaid; deposit 1,000; 150 kept for damages.
  const l = lease({ deposit: { amount: 1000 }, payments: [pay("p1", 1800, "2026-07-01")] });
  const st = app.leaseSettlement(l, "2026-10-31", { takeRentFromDeposit: true, damages: 150 });
  assert.deepEqual([st.owed, st.deposit, st.kept, st.rentFromDeposit, st.stillOwed, st.depositBack, st.toTenant], [600, 1000, 150, 600, 0, 250, 250]);
  const keep = app.leaseSettlement(l, "2026-10-31", { takeRentFromDeposit: false, damages: 0 });
  assert.deepEqual([keep.stillOwed, keep.toTenant], [600, 1000]);
});

test("settlement: rent paid for after the last day goes back with the deposit; more owed than the deposit stays owed", () => {
  const ahead = app.leaseSettlement(lease({ deposit: { amount: 600 }, payments: [pay("p1", 3000, "2026-07-01")] }), "2026-09-30");
  assert.deepEqual([ahead.owed, ahead.rentBack, ahead.depositBack, ahead.toTenant], [0, 1200, 600, 1800]);
  const short = app.leaseSettlement(lease({ deposit: { amount: 500 } }), "2026-08-31");
  assert.deepEqual([short.owed, short.rentFromDeposit, short.stillOwed, short.toTenant], [1200, 500, 700, 0]);
});

test("what is kept for damages is handed over to the owner", () => {
  const l = lease({ fee: { kind: "percent", value: 10 }, status: "ended", endedOn: "2026-07-31", payments: [pay("p1", 600, "2026-07-01")], deposit: { amount: 600, returnedOn: "2026-07-31", keptAmount: 100 } });
  const a = app.leaseOwnerAccount(l, "2026-08-05");
  assert.deepEqual([a.collected, a.fee, a.depositKept, a.toHandOver], [600, 60, 100, 640]);
});

test("a statement line goes to the tenant whose name or phone it carries", () => {
  const leases = [lease({ id: "l1", tenant: { name: "Karim Nassar", phone: "71 200 301" } }), lease({ id: "l2", tenant: { name: "Hala Daher", phone: "03 555 777" } })];
  assert.equal(app.matchRentStatementRow({ amount: 600, text: "TRANSFER FROM KARIM NASSAR" }, leases), "l1");
  assert.equal(app.matchRentStatementRow({ amount: 250, text: "Whish 03555777" }, leases), "l2");
  assert.equal(app.matchRentStatementRow({ amount: 600, text: "Salary" }, leases), "");
  const done = lease({ payments: [pay("p", 600, "2026-10-03")] });
  assert.ok(app.rentAlreadyRecorded({ amount: 600, date: "2026-10-05" }, done));
  assert.equal(app.rentAlreadyRecorded({ amount: 600, date: "2026-10-20" }, done), null);
});

test("your own flats' year: rent received per month and per flat", () => {
  const leases = [lease({ id: "o1", flatId: "a", ownFlat: true, payments: [pay("p1", 600, "2026-07-01"), pay("p2", 600, "2026-08-02")] }), lease({ id: "x", flatId: "b", payments: [pay("q", 999, "2026-07-01")] })];
  const d = app.ownRentYearData(2026, leases, "2026-10-24");
  assert.deepEqual(d.rows.filter((r) => r.parts.length).map((r) => [r.month, r.total.USD]), [["2026-07", 600], ["2026-08", 600]]);
  assert.equal(d.total.USD, 1200);
  assert.equal(d.owed.USD, 1200);
});

test("the contract says what was agreed, in English and in Arabic", () => {
  const l = lease({ start: "2026-10-24", rent: 1000, advanceMonths: 3, deposit: { amount: 1000 }, lateFee: { kind: "fixed", value: 25 }, increasePct: 5 });
  const en = app.leaseContractClauses(l, "en");
  assert.match(en[3], /pays \$3,258\.06: the rest of the first month by the days, and 3 months in advance/);
  assert.match(en[4], /late 5 days after it is due\. A late fee of \$25\.00 is then added\./);
  assert.ok(en.some((c) => /up by 5%/.test(c)) && en.some((c) => /Deposit: \$1,000\.00/.test(c)));
  const ar = app.leaseContractClauses(l, "ar");
  assert.match(ar[3], /عند التوقيع/);
  assert.equal(app.ltrAmount("$5.00"), "$5.00");
});
