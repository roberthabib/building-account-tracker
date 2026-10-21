// v165: oldest month first, due day, message wording, meter checks, search, QR, reports.
import { test } from "node:test";
import assert from "node:assert/strict";
import { app, baseState } from "./harness.mjs";

const fixed = { collectionMode: "fixed", lbpPerUsd: 100000, language: "en", defaultDueUsd: 100 };
const tenants = [{ id: "a", name: "Alice", unit: "1A", active: true, coefficient: 1000, phone: "70 111 222" }];
const months = ["2026-07-01", "2026-08-01", "2026-09-01"].map((month) => ({ month, expectedUsd: 100 }));
const pay = (id, forMonth, usd, date = "2026-09-20") => ({ id, category: "Payments", tenantId: "a", forMonth, date, creditUsd: usd, creditLbp: 0, debitUsd: 0, debitLbp: 0, balanceUsd: usd, balanceLbp: 0 });

test("fixed amount: a payment fills the oldest unpaid month first", () => {
  // 250 recorded for September only: July and August are covered first.
  app.setState(baseState({ settings: fixed, tenants, monthlyExpected: months, transactions: [pay("p", "2026-09-01", 250)] }));
  assert.equal(app.paymentStatus("a", "2026-07-01").paid, 100);
  assert.equal(app.paymentStatus("a", "2026-08-01").paid, 100);
  assert.equal(app.paymentStatus("a", "2026-09-01").paid, 50);
  assert.equal(app.paymentStatus("a", "2026-09-01").label, "Partial");
});

test("the payment form says what a payment covers", () => {
  app.setState(baseState({ settings: fixed, tenants, monthlyExpected: months, transactions: [pay("p", "2026-07-01", 100)] }));
  assert.equal(app.paymentCoverage("a", 120), "Covers Aug 2026 · $20.00 toward Sep 2026");
  assert.equal(app.paymentCoverage("a", 250), "Covers Aug 2026, Sep 2026 · $50.00 in advance");
});

test("due day makes unpaid tenants late", () => {
  app.setState(baseState({ settings: { ...fixed, dueDay: 10 }, tenants, monthlyExpected: months, transactions: [] }));
  assert.equal(app.isMonthLate("2026-09-01", "2026-09-10"), false);
  assert.equal(app.isMonthLate("2026-09-01", "2026-09-11"), true);
  assert.deepEqual(app.lateTenants("2026-09-01", "2026-09-11").map((t) => t.id), ["a"]);
  app.setState(baseState({ settings: { ...fixed, dueDay: 0 }, tenants, monthlyExpected: months }));
  assert.equal(app.isMonthLate("2026-09-01", "2026-09-30"), false);
});

test("reminders use the owner's wording, in the tenant's language", () => {
  app.setState(baseState({ settings: { ...fixed, messageTemplates: { reminder: { en: "Dear {name} ({unit}), please pay {amount} for {month}.", ar: "" } } }, tenants: [{ ...tenants[0], language: "en" }], monthlyExpected: months }));
  assert.equal(app.reminderText({ name: "Alice", unit: "1A", language: "en" }, 100, "2026-09-01"), "Dear Alice (1A), please pay $100.00 for Sep 2026.");
  const ar = app.reminderText({ name: "Alice", unit: "1A", language: "ar" }, 100, "2026-09-01");
  assert.match(ar, /Alice/);
  assert.notEqual(ar, "Dear Alice (1A), please pay $100.00 for Sep 2026.");
  assert.equal(app.fillTemplate("{name}/{building}", { name: "A", building: "B" }), "A/B");
});

test("the standard reminder includes how to pay", () => {
  app.setState(baseState({ settings: { ...fixed, paymentInstructions: "Whish 70 000 000" }, tenants, monthlyExpected: months }));
  assert.match(app.reminderText({ name: "Alice", unit: "1A" }, 50, "2026-09-01"), /Whish 70 000 000/);
});

test("meter reading checks", () => {
  assert.equal(app.meterReadingCheck(100, 90, 50).level, "error");
  assert.equal(app.meterReadingCheck(100, 250, 50).level, "warn");
  assert.equal(app.meterReadingCheck(100, 180, 50), null);
  assert.equal(app.meterReadingCheck(100, 0, 50), null);
});

test("search finds tenants and entries", () => {
  app.setState(baseState({ settings: fixed, tenants, monthlyExpected: months, transactions: [pay("p", "2026-09-01", 100), { id: "e", category: "Expenses", date: "2026-09-02", description: "Roof repair", supplier: "Fix Co", debitUsd: 40, debitLbp: 0, creditUsd: 0, creditLbp: 0, balanceUsd: -40, balanceLbp: 0 }] }));
  assert.ok(app.searchEverything("alic").some((r) => r.kind === "tenant"));
  assert.ok(app.searchEverything("fix co").some((r) => r.kind === "transaction" && r.id === "e"));
  assert.deepEqual(app.searchEverything("x"), []);
});

test("expenses without an invoice photo", () => {
  const exp = (id, attachment) => ({ id, category: "Expenses", date: "2026-03-01", description: id, debitUsd: 10, debitLbp: 0, creditUsd: 0, creditLbp: 0, balanceUsd: -10, balanceLbp: 0, invoiceAttachment: attachment });
  app.setState(baseState({ tenants, transactions: [exp("with", { storagePath: "2026/x.jpg" }), exp("without", null)] }));
  assert.deepEqual(app.expensesMissingInvoice("2026").map((t) => t.id), ["without"]);
});

test("closed votes are announced once, only from the start date", () => {
  app.setState(baseState({ tenants, polls: [
    { id: "old", title: "Old", status: "closed", closedAt: "2026-06-01", votes: { a: "yes" } },
    { id: "new", title: "New", status: "closed", closedAt: "2026-10-22", votes: { a: "yes" } },
  ] }));
  app.setSessionMode("owner");
  assert.equal(app.announceClosedPolls("2026-10-23"), 1);
  assert.equal(app.announceClosedPolls("2026-10-23"), 0);
  app.setSessionMode(null);
});

test("rate changes keep a history", () => {
  app.setState(baseState({ tenants }));
  assert.equal(app.setConversionRate(90000, "2026-10-21"), true);
  assert.equal(app.setConversionRate(90000, "2026-10-22"), false);
});

test("money in and out per month, and the forecast", () => {
  const tx = [];
  ["2026-04", "2026-05", "2026-06", "2026-07", "2026-08", "2026-09"].forEach((m, i) => {
    tx.push(pay(`p${i}`, `${m}-01`, 200, `${m}-05`));
    tx.push({ id: `e${i}`, category: "Expenses", date: `${m}-10`, debitUsd: 150, debitLbp: 0, creditUsd: 0, creditLbp: 0, balanceUsd: -150, balanceLbp: 0 });
  });
  app.setState(baseState({ settings: fixed, tenants, transactions: tx }));
  const flow = app.moneyFlowByMonth(12, "2026-10-21");
  assert.equal(flow.length, 12);
  assert.deepEqual(flow.find((r) => r.month === "2026-09"), { month: "2026-09", in: 200, out: 150 });
  const f = app.reserveForecast("2026-10-21");
  assert.equal(f.avg, 50);
  assert.equal(f.monthsLeft, 2);
});

test("QR matrix has the right size and finder patterns", () => {
  const m = app.qrMatrix("https://example.com/?join=ABCD1234");
  assert.equal(m.length % 4, 1);
  assert.ok(m.length >= 25);
  // top-left finder: dark ring corners and a light gap
  assert.equal(m[0][0], true);
  assert.equal(m[0][6], true);
  assert.equal(m[1][1], false);
  assert.equal(m[3][3], true);
});

test("a one-page PDF wraps the picture", () => {
  const pdf = app.singleImagePdf(new Uint8Array([0xff, 0xd8, 0xff, 0xd9]), 10, 10);
  const text = new TextDecoder().decode(pdf);
  assert.ok(text.startsWith("%PDF-1.4"));
  assert.match(text, /\/DCTDecode/);
  assert.match(text, /%%EOF\n$/);
});
