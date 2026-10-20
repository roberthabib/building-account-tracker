// Coefficient cap, WhatsApp numbers, group message, recurring expenses.
import { test } from "node:test";
import assert from "node:assert/strict";
import { app, baseState } from "./harness.mjs";

const T = (id, coefficient, extra = {}) => ({ id, name: id.toUpperCase(), unit: id, active: true, coefficient, breakerAmps: 0, pinHash: "", ...extra });

test("coefficient room: what's left of 1000, ignoring the tenant being edited", () => {
  const tenants = [T("a", 600), T("b", 300)];
  assert.equal(app.coefficientRoom(tenants), 100, "new tenant may take at most 100");
  assert.equal(app.coefficientRoom(tenants, "a"), 700, "editing A: its own 600 is free again");
  assert.equal(app.coefficientRoom([...tenants, T("c", 50, { active: false })]), 100, "inactive tenants don't count");
  assert.equal(app.coefficientRoom([T("a", 700), T("b", 400)]), -100, "already over the limit shows as negative");
});

test("WhatsApp numbers: Lebanese local numbers get 961, international ones are kept", () => {
  assert.equal(app.whatsappPhone("70 123 456"), "96170123456");
  assert.equal(app.whatsappPhone("03 123456"), "9613123456");
  assert.equal(app.whatsappPhone("+961 71 000 000"), "96171000000");
  assert.equal(app.whatsappPhone("00961 76 111 222"), "96176111222");
  assert.equal(app.whatsappPhone("961-70-123456"), "96170123456");
  assert.equal(app.whatsappPhone("+33 6 12 34 56 78"), "33612345678", "a French number stays French");
  assert.equal(app.whatsappPhone(""), "");
});

test("WhatsApp link without a number lets WhatsApp ask who to send to (group)", () => {
  assert.equal(app.whatsappLink("", "hi there"), "https://wa.me/?text=hi%20there");
  assert.equal(app.whatsappLink("70 123 456", "x"), "https://wa.me/96170123456?text=x");
});

test("group message lists every active tenant by unit with what they owe", () => {
  app.setState(baseState({
    building: { name: "Naccache 1727" },
    tenants: [T("2b", 400, { name: "Hanady", unit: "2B" }), T("1a", 600, { name: "Robert", unit: "1A" }), T("x", 0, { name: "Gone", unit: "9", active: false })],
    transactions: [
      { id: "e", category: "Expenses", tenantId: null, date: "2026-09-02", debitUsd: 100, shares: { "1a": 60, "2b": 40 } },
      { id: "p", category: "Payments", tenantId: "2b", forMonth: "2026-09-01", date: "2026-09-05", creditUsd: 50, receiptRef: "R" },
    ],
  }));
  const msg = app.buildGroupBalancesMessage();
  const lines = msg.split("\n");
  assert.match(lines[0], /^Naccache 1727 — balances as of /);
  const robert = lines.findIndex((l) => l.includes("Robert"));
  const hanady = lines.findIndex((l) => l.includes("Hanady"));
  assert.ok(robert > 0 && robert < hanady, "sorted by unit: 1A before 2B");
  assert.match(lines[robert], /Unit 1A – Robert: \$60\.00 due/);
  assert.match(lines[hanady], /Unit 2B – Hanady: paid up ✓ \(credit \$10\.00\)/, "paid 50 against 40");
  assert.ok(!msg.includes("Gone"), "inactive tenants are left out");
  assert.match(msg, /Total outstanding: \$60\.00$/);
});

test("recurring expense: pending each month until a transaction carries its id", () => {
  const s = baseState({ tenants: [T("a", 1000)] });
  app.setState(s);
  const st = app.getState();
  const tpl = app.addRecurringTemplateFrom({ description: "Concierge", expenseCategory: "Salary", debitUsd: 200, date: "2026-09-03" });
  assert.equal(tpl.amount, 200);
  assert.equal(tpl.currency, "USD");
  // created from a September expense -> September is that expense's month
  st.transactions.push({ id: "t1", category: "Expenses", date: "2026-09-03", debitUsd: 200, recurringId: tpl.id });
  assert.deepEqual(app.pendingRecurringExpenses("2026-09-01").map((r) => r.id), [], "September already recorded");
  assert.deepEqual(app.pendingRecurringExpenses("2026-10-01").map((r) => r.id), [tpl.id], "October waits");
  assert.deepEqual(app.pendingRecurringExpenses("2026-08-01"), [], "nothing before it started");
  st.transactions.push({ id: "t2", category: "Expenses", date: "2026-10-04", debitUsd: 210, recurringId: tpl.id });
  assert.deepEqual(app.pendingRecurringExpenses("2026-10-01"), [], "done once October's is added");
  tpl.active = false;
  assert.deepEqual(app.pendingRecurringExpenses("2026-11-01"), [], "stopped templates never come back");
});

test("recurring expense remembers LBP amounts in LBP", () => {
  app.setState(baseState());
  const tpl = app.addRecurringTemplateFrom({ description: "Internet", debitUsd: 0, debitLbp: 1790000, date: "2026-10-01" });
  assert.equal(tpl.currency, "LBP");
  assert.equal(tpl.amount, 1790000);
});
