// v167 part 2: statement import, category suggestions, deposits, approvals.
import { test } from "node:test";
import assert from "node:assert/strict";
import { app, baseState } from "./harness.mjs";

const tenants = [
  { id: "a", name: "Rami Sarkis", unit: "1A", active: true, coefficient: 600, phone: "70 123 456" },
  { id: "b", name: "Lina Masri", unit: "1B", active: true, coefficient: 400, phone: "03 987 654" },
];

test("amounts in bank formats", () => {
  assert.equal(app.parseStatementAmount("1,234.50"), 1234.5);
  assert.equal(app.parseStatementAmount("1.234,50"), 1234.5);
  assert.equal(app.parseStatementAmount("$ 100"), 100);
  assert.equal(app.parseStatementAmount("(100.00)"), -100);
  assert.equal(app.parseStatementAmount(""), null);
});

test("dates in bank formats", () => {
  assert.equal(app.parseStatementDate("2026-10-21"), "2026-10-21");
  assert.equal(app.parseStatementDate("21/10/2026"), "2026-10-21");
  assert.equal(app.parseStatementDate("5.9.26"), "2026-09-05");
  assert.equal(app.parseStatementDate("46316"), "2026-10-21");
});

test("CSV with quotes and semicolons", () => {
  const rows = app.parseCsvText('Date;Details;Credit;Debit\n21/10/2026;"Transfer from RAMI SARKIS; Oct";200,00;\n22/10/2026;Bank fee;;5,00\n');
  assert.equal(rows.length, 3);
  assert.equal(rows[1][1], "Transfer from RAMI SARKIS; Oct");
});

test("only money coming in is kept, with the right columns", () => {
  const table = app.parseCsvText("Date,Description,Debit,Credit\n2026-10-21,Transfer RAMI SARKIS,,200.00\n2026-10-22,Bank fee,5.00,\n2026-10-23,WHISH 03987654,,170\n");
  const rows = app.statementRowsFromTable(table);
  assert.deepEqual(rows.map((r) => [r.date, r.amount]), [["2026-10-21", 200], ["2026-10-23", 170]]);
  const signed = app.statementRowsFromTable(app.parseCsvText("Date,Narrative,Amount\n2026-10-01,Fee,-3\n2026-10-02,LINA,170\n"));
  assert.deepEqual(signed.map((r) => r.amount), [170]);
});

test("a statement without headers is still understood", () => {
  const rows = app.statementRowsFromTable(app.parseCsvText("21/10/2026,Payment from Rami,200\n22/10/2026,Lina October,170\n"));
  assert.deepEqual(rows.map((r) => [r.date, r.amount, r.text]), [["2026-10-21", 200, "Payment from Rami"], ["2026-10-22", 170, "Lina October"]]);
});

test("each line is matched to a tenant by name or phone", () => {
  app.setState(baseState({ tenants }));
  assert.equal(app.matchStatementRow({ amount: 200, text: "TRANSFER FROM RAMI SARKIS" }), "a");
  assert.equal(app.matchStatementRow({ amount: 170, text: "WHISH 961 3 987654" }), "b");
  assert.equal(app.matchStatementRow({ amount: 5, text: "Bank fee" }), "");
});

test("a payment already in the books is flagged", () => {
  app.setState(baseState({ tenants, transactions: [{ id: "p", category: "Payments", tenantId: "a", date: "2026-10-19", project: "", debitUsd: 0, debitLbp: 0, creditUsd: 200, creditLbp: 0, balanceUsd: 200, balanceLbp: 0 }] }));
  assert.ok(app.alreadyRecorded({ date: "2026-10-21", amount: 200 }, "a"));
  assert.equal(app.alreadyRecorded({ date: "2026-10-21", amount: 150 }, "a"), null);
  assert.equal(app.alreadyRecorded({ date: "2026-11-21", amount: 200 }, "a"), null);
});

test("expense category suggested from past expenses", () => {
  const e = (id, description, supplier, cat) => ({ id, category: "Expenses", description, supplier, expenseCategory: cat, date: "2026-09-01", debitUsd: 10, debitLbp: 0, creditUsd: 0, creditLbp: 0, balanceUsd: -10, balanceLbp: 0 });
  app.setState(baseState({ tenants, transactions: [e("1", "Stairs cleaning", "Clean Team", "Cleaning"), e("2", "Lift maintenance visit", "Lift Co", "Lift"), e("3", "Lift repair", "Lift Co", "Lift")] }));
  assert.equal(app.suggestExpenseCategory("monthly visit", "Lift Co"), "Lift");
  assert.equal(app.suggestExpenseCategory("cleaning the stairs", ""), "Cleaning");
  assert.equal(app.suggestExpenseCategory("something new", ""), "");
});

test("deposits are kept apart and only the held ones count", () => {
  app.setState(baseState({ tenants, deposits: [
    { id: "d1", tenantId: "a", amountUsd: 200, status: "held" },
    { id: "d2", tenantId: "b", amountUsd: 150, status: "returned" },
  ] }));
  assert.equal(app.depositsHeldUsd(), 200);
});

test("expenses waiting for approval merge by their latest decision", () => {
  const meta = (t) => ({ rev: 5, epoch: 0, token: "x", updatedAt: t });
  const cloud = app.hydrateState(baseState({ tenants, meta: meta("2026-10-21T10:00:00Z"),
    pendingExpenses: [{ id: "x", status: "approved", updatedAt: "2026-10-21T10:00:00Z", transactions: [] }] }));
  const phone = app.hydrateState(baseState({ tenants, meta: meta("2026-10-21T12:00:00Z"),
    pendingExpenses: [{ id: "x", status: "pending", updatedAt: "2026-10-21T08:00:00Z", transactions: [] }] }));
  const merged = app.mergeStates(phone, cloud);
  assert.equal(merged.pendingExpenses[0].status, "approved");
  app.setState(merged);
  assert.equal(app.pendingApprovals().length, 0);
});
