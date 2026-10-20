// v157: payment method / paid from and the cash box vs bank split.
import { test } from "node:test";
import assert from "node:assert/strict";
import { app, baseState } from "./harness.mjs";

const pay = (id, date, usd, method) => ({ id, category: "Payments", tenantId: "a", date, forMonth: `${date.slice(0, 7)}-01`, creditUsd: usd, creditLbp: 0, debitUsd: 0, debitLbp: 0, balanceUsd: usd, balanceLbp: 0, ...(method ? { method } : {}) });
const exp = (id, date, usd, paidFrom) => ({ id, category: "Expenses", date, debitUsd: usd, debitLbp: 0, creditUsd: 0, creditLbp: 0, balanceUsd: -usd, balanceLbp: 0, ...(paidFrom ? { paidFrom } : {}) });

test("payment methods map to the cash box or the bank", () => {
  assert.equal(app.transactionAccount(pay("p", "2026-09-01", 1)), "cash", "no method recorded: cash");
  assert.equal(app.transactionAccount(pay("p", "2026-09-01", 1, "omt")), "cash", "OMT is picked up as cash");
  assert.equal(app.transactionAccount(pay("p", "2026-09-01", 1, "whish")), "bank");
  assert.equal(app.transactionAccount(exp("e", "2026-09-01", 1, "bank")), "bank");
  assert.equal(app.transactionAccount(exp("e", "2026-09-01", 1)), "cash");
});

test("expected money splits between the cash box and the bank", () => {
  app.setState(baseState({
    transactions: [pay("p1", "2026-09-01", 100, "cash"), pay("p2", "2026-09-02", 200, "bank"), exp("e1", "2026-09-03", 30), exp("e2", "2026-09-04", 50, "bank"), pay("p3", "2026-10-01", 999, "cash")],
  }));
  assert.deepEqual(app.expectedByAccount("2026-09-30"), { cash: 70, bank: 150 });
});

test("method labels are readable", () => {
  assert.equal(app.methodLabel("bank"), "Bank transfer");
  assert.equal(app.methodLabel("omt"), "OMT");
});
