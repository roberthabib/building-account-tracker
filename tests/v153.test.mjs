// v153: exchange rate per entry, data health, duplicate payments, monthly report, balance snapshot.
import { test } from "node:test";
import assert from "node:assert/strict";
import { app, baseState } from "./harness.mjs";

const T = (id, coefficient, extra = {}) => ({ id, name: id.toUpperCase(), unit: id, active: true, coefficient, breakerAmps: 10, pinHash: "", phone: "70 000 000", ...extra });
const lbpExpense = (id, date, lbp, extra = {}) => ({ id, category: "Expenses", date, debitUsd: 0, debitLbp: lbp, creditUsd: 0, creditLbp: 0, balanceUsd: 0, balanceLbp: -lbp, description: id, ...extra });
const payment = (id, tenantId, date, usd, extra = {}) => ({ id, category: "Payments", tenantId, date, forMonth: `${date.slice(0, 7)}-01`, creditUsd: usd, creditLbp: 0, debitUsd: 0, debitLbp: 0, balanceUsd: usd, balanceLbp: 0, ...extra });

test("an LBP entry keeps its rate when the rate in Settings changes", () => {
  app.setState(baseState({ settings: { lbpPerUsd: 100000, collectionMode: "actual", language: "en" }, tenants: [T("a", 1000)], transactions: [lbpExpense("e1", "2026-09-02", 1000000)] }));
  const st = app.getState();
  assert.equal(st.transactions[0].lbpRate, 100000, "stamped on load with the rate in force");
  assert.equal(app.getTenantBalance("a"), 10);
  st.settings.lbpPerUsd = 50000;
  assert.equal(app.getTenantBalance("a"), 10, "old entry still worth $10");
  st.transactions.push(lbpExpense("e2", "2026-10-02", 1000000));
  app.stampLbpRates(st, 50000);
  assert.equal(st.transactions[1].lbpRate, 50000, "a new entry takes the new rate");
  assert.equal(app.getTenantBalance("a"), 30);
  assert.equal(app.stampLbpRates(st, 1), 0, "stamped entries are never restamped");
});

test("USD-only entries get no rate stamp", () => {
  app.setState(baseState({ transactions: [payment("p1", "a", "2026-09-01", 50)] }));
  assert.equal(app.getState().transactions[0].lbpRate, undefined);
});

test("data health lists coefficients, missing phones and possible duplicates", () => {
  app.setState(baseState({
    tenants: [T("a", 600), T("b", 500, { phone: "" }), T("c", 0)],
    transactions: [payment("p1", "a", "2026-09-10", 50, { paymentGroupId: "g1" }), payment("p2", "a", "2026-09-12", 50, { paymentGroupId: "g2" }), payment("p3", "a", "2026-09-30", 50, { paymentGroupId: "g3" })],
  }));
  const texts = app.dataHealthIssues().map((i) => i.text);
  assert.ok(texts.includes("Coefficients add up to 1100/1000 instead of 1000"));
  assert.ok(texts.includes("No coefficient for: c"));
  assert.ok(texts.some((t) => t.startsWith("1 tenant has no phone number (b)")));
  assert.equal(texts.filter((t) => t.startsWith("Possible duplicate payment")).length, 1, "only the two payments two days apart");
});

test("a new payment matching a recent one is caught before saving", () => {
  app.setState(baseState({ tenants: [T("a", 1000)], transactions: [payment("p1", "a", "2026-09-10", 50)] }));
  assert.ok(app.findDuplicatePayment([payment("new", "a", "2026-09-11", 50)]));
  assert.equal(app.findDuplicatePayment([payment("new", "a", "2026-09-20", 50)]), null, "too far apart");
  assert.equal(app.findDuplicatePayment([payment("new", "a", "2026-09-11", 60)]), null, "different amount");
});

test("monthly report leaves the generator out when the building doesn't use it", () => {
  app.setState(baseState({ tenants: [T("a", 1000)], transactions: [lbpExpense("e1", "2026-09-02", 2000000, { expenseCategory: "Cleaning" }), payment("p1", "a", "2026-09-10", 15)] }));
  let d = app.monthlyReportData("2026-09-01");
  assert.equal(d.generator, null);
  assert.equal(d.water, null);
  assert.equal(d.moneyOut, 20);
  assert.equal(d.moneyIn, 15);
  assert.deepEqual(d.categories, [["Cleaning", 20]]);
  let pdf = await_text(app.buildMonthlyReportPdf("2026-09-01"));
  return pdf.then((text) => {
    assert.ok(!text.includes("(Generator)"), "no generator section");
    assert.ok(text.includes("(Monthly report)"));
    app.setState(baseState({ tenants: [T("a", 1000)], transactions: [{ id: "g1", category: "Services Expenses", serviceType: "generator", servicePart: "fuel", forMonth: "2026-09-01", date: "2026-09-03", debitUsd: 90, debitLbp: 0, creditUsd: 0, creditLbp: 0, balanceUsd: -90, balanceLbp: 0 }] }));
    d = app.monthlyReportData("2026-09-01");
    assert.equal(d.generator.fuelUsd, 90);
    return await_text(app.buildMonthlyReportPdf("2026-09-01"));
  }).then((text) => assert.ok(text.includes("(Generator)"), "generator section when used"));
});

function await_text(blob) {
  return blob.text();
}

test("balance snapshot lists what each active unit owes", () => {
  app.setState(baseState({ tenants: [T("a", 600), T("b", 400), T("x", 0, { active: false })], transactions: [{ id: "e1", category: "Expenses", date: "2026-09-02", debitUsd: 100, debitLbp: 0, creditUsd: 0, creditLbp: 0, balanceUsd: -100, balanceLbp: 0, shares: { a: 60, b: 40 } }, payment("p1", "b", "2026-09-05", 40)] }));
  assert.deepEqual(app.buildBalanceSnapshot().items, { a: 60, b: 0 });
});
