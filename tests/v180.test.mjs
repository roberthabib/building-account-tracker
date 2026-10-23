// v180: receipts that can be checked — check codes shared by a receipt's
// payments, the check link, and receipts of deleted payments.
import { test } from "node:test";
import assert from "node:assert/strict";
import { app, baseState } from "./harness.mjs";

const tenants = [{ id: "a", name: "A", unit: "1A", active: true, coefficient: 1000 }];
const pay = (id, ref, extra = {}) => ({
  id, category: "Payments", tenantId: "a", forMonth: "2026-09-01", date: "2026-09-10", creditUsd: 50, creditLbp: 0, debitUsd: 0, debitLbp: 0, receiptRef: ref, ...extra,
});

test("check codes are random, readable and 10 characters long", () => {
  const codes = new Set(Array.from({ length: 200 }, () => app.newVerifyCode()));
  assert.equal(codes.size, 200);
  codes.forEach((c) => assert.match(c, /^[A-HJ-NP-Z2-9]{10}$/));
});

test("payments of one receipt share its code; codes already given are kept", () => {
  const s = baseState({
    tenants,
    transactions: [
      pay("p1", "RCT-20260910-0001", { paymentGroupId: "g" }),
      pay("p2", "RCT-20260910-0001", { paymentGroupId: "g", forMonth: "2026-10-01" }),
      pay("p3", "RCT-20260910-0002", { verifyCode: "KEEPKEEP22" }),
      { id: "e1", category: "Expenses", date: "2026-09-10", debitUsd: 20 },
    ],
  });
  assert.equal(app.addReceiptVerifyCodes(s), 2);
  const [p1, p2, p3, e1] = s.transactions;
  assert.ok(p1.verifyCode);
  assert.equal(p2.verifyCode, p1.verifyCode);
  assert.equal(p3.verifyCode, "KEEPKEEP22");
  assert.equal(e1.verifyCode, undefined);
  assert.equal(app.addReceiptVerifyCodes(s), 0);
});

test("the check link carries the building, receipt, code, amount and language", () => {
  app.setState(baseState({ tenants, settings: { language: "ar" } }));
  const link = new URL(app.receiptCheckLink({ ref: "RCT-20260910-0001", code: "ABCDEFGH23", amount: 150.004 }));
  assert.equal(link.pathname, "/verify");
  assert.equal(link.searchParams.get("r"), "RCT-20260910-0001");
  assert.equal(link.searchParams.get("c"), "ABCDEFGH23");
  assert.equal(link.searchParams.get("a"), "150");
  assert.equal(link.searchParams.get("l"), "ar");
  assert.ok(link.searchParams.get("b"));
  assert.equal(link.searchParams.get("k"), null);
  assert.equal(new URL(app.receiptCheckLink({ ref: "rent-1", code: "ABCDEFGH23", amount: 650, kind: "rent", lang: "en" })).searchParams.get("k"), "rent");
  assert.equal(app.receiptCheckLink({ ref: "RCT-1", code: "" }), "");
});

test("deleting a receipt's payments records it as cancelled, with the flat and amount", () => {
  const before = baseState({
    tenants,
    transactions: [
      pay("p1", "R-1", { verifyCode: "CODECODE11", paymentGroupId: "g" }),
      pay("p2", "R-1", { verifyCode: "CODECODE11", paymentGroupId: "g", creditUsd: 25 }),
      pay("p3", "R-2", { verifyCode: "CODECODE22" }),
    ],
  });
  const after = { ...before, transactions: before.transactions.filter((t) => t.id === "p3") };
  const gone = app.voidedReceiptsBetween(before, after);
  assert.equal(gone.length, 1);
  assert.deepEqual({ ...gone[0], at: "" }, { id: "R-1:CODECODE11", ref: "R-1", code: "CODECODE11", unit: "1A", amountUsd: 75, at: "" });
  // Taking back a deletion (same receipt and code under a new id) is not a cancellation.
  const undone = { ...before, transactions: [...after.transactions, { ...before.transactions[0], id: "p9" }] };
  assert.equal(app.voidedReceiptsBetween(before, undone).length, 0);
});
