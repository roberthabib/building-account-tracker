// Full Excel export: the workbook must agree with the app's own figures.
import { test } from "node:test";
import assert from "node:assert/strict";
import { app, baseState } from "./harness.mjs";

export function exportScenario() {
  return baseState({
    building: { name: "Naccache Test" },
    tenants: [
      { id: "t1", name: "One", unit: "1A", active: true, coefficient: 600, breakerAmps: 20, phone: "70 000 001", pinHash: "" },
      { id: "t2", name: "Two", unit: "1B", active: true, coefficient: 400, breakerAmps: 10, phone: "", pinHash: "" },
    ],
    transactions: [
      { id: "ob", category: "Opening Balance", tenantId: null, date: "2026-07-01", creditUsd: 1000 },        // building cash in
      { id: "ot", category: "Opening Balance", tenantId: "t2", date: "2026-07-01", debitUsd: 15 },          // NOT cash
      { id: "e1", category: "Expenses", tenantId: null, date: "2026-08-02", debitUsd: 100, expenseCategory: "Cleaning", invoiceAttachment: { url: "x" } },
      { id: "g1", category: "Services Expenses", serviceType: "generator", servicePart: "fuel", forMonth: "2026-09-01", date: "2026-09-05", debitUsd: 90 },
      { id: "p1", category: "Payments", tenantId: "t1", forMonth: "2026-09-01", date: "2026-09-10", creditUsd: 50, receiptRef: "R1" },
      { id: "p2", category: "Payments", tenantId: "t2", project: "Roof", date: "2026-09-12", creditLbp: 3000000, receiptRef: "R2" },
    ],
    serviceReadings: [{ id: "r1", serviceType: "generator", forMonth: "2026-09-01", lines: {
      t1: { breakerAmps: 20, previousReading: 0, currentReading: 60 }, t2: { breakerAmps: 10, previousReading: 0, currentReading: 30 } } }],
    buildingProjects: [{ id: "pr", name: "Roof", status: "active", totalBudget: 200, distribution: "coefficient", shares: { t1: 120, t2: 80 } }],
    polls: [{ id: "po", title: "Paint the lobby?", status: "open", createdAt: "2026-09-01T10:00:00Z", votes: { a: "yes", b: "no", c: "yes" } }],
    paymentDeclarations: [{ id: "d1", tenantId: "t2", month: "2026-09-01", amount: 40, status: "pending", declaredAt: "2026-09-20T08:00:00Z" }],
  });
}

test("monthly running cash ends exactly at the dashboard cash figure", () => {
  app.setState(exportScenario());
  const d = app.collectFullExportData();
  const lastRunning = d.monthRows[d.monthRows.length - 1][8];
  assert.equal(lastRunning, Math.round(app.getAccountTotals().usd * 100) / 100);
  // 1000 - 100 - 90 + 50 + 30 = 890 (the tenant opening debt is not cash)
  assert.equal(lastRunning, 890);
});

test("tenant sheet balances match the app's balance function", () => {
  app.setState(exportScenario());
  const d = app.collectFullExportData();
  for (const [i, id] of ["t1", "t2"].entries()) assert.equal(d.tenantRows[i][10], app.getTenantBalance(id));
});

test("project, poll, declaration and generator rows come through", () => {
  app.setState(exportScenario());
  const d = app.collectFullExportData();
  const roofT2 = d.projectRows.find((r) => r[5] === "Two");
  assert.deepEqual(roofT2.slice(6), [80, 30, 50]); // share 80, paid 3,000,000 LBP = $30, outstanding 50
  assert.deepEqual(d.pollRows[0].slice(3), [2, 1, 0]);
  assert.equal(d.declarationRows[0][0], "Two");
  assert.equal(d.readingRows.length, 2);
  assert.equal(d.readingRows[0][8] + d.readingRows[1][8], 90, "whole fuel pool billed");
});

test("workbook is a zip with a summary and 8 data sheets", async () => {
  app.setState(exportScenario());
  const blob = app.buildFullWorkbookXlsx();
  const bytes = new Uint8Array(await blob.arrayBuffer());
  assert.equal(String.fromCharCode(bytes[0], bytes[1]), "PK");
  const text = new TextDecoder("latin1").decode(bytes);
  for (let i = 1; i <= 9; i++) assert.ok(text.includes(`xl/worksheets/sheet${i}.xml`), `sheet${i} present`);
  assert.ok(!text.includes("xl/worksheets/sheet10.xml"));
});

// Minimal XML checker: every tag closes in order, no stray text outside the root.
function assertWellFormed(name, xml) {
  const body = xml.replace(/^<\?xml[^>]*\?>/, "");
  const stack = [];
  const re = /<(\/?)([A-Za-z_][\w:.-]*)([^>]*?)(\/?)>/g;
  let m;
  while ((m = re.exec(body))) {
    const [, closing, tag, , selfClosing] = m;
    if (selfClosing) continue;
    if (closing) {
      const open = stack.pop();
      assert.equal(open, tag, `${name}: </${tag}> closes <${open}>`);
    } else stack.push(tag);
  }
  assert.deepEqual(stack, [], `${name}: unclosed ${stack.join(", ")}`);
  assert.ok(!/&(?!amp;|lt;|gt;|quot;|apos;|#\d+;)/.test(xml), `${name}: unescaped &`);
}

test("every part of the workbook is well-formed XML (English and Arabic)", () => {
  for (const lang of ["en", "ar"]) {
    const s = exportScenario(); s.settings.language = lang;
    s.tenants[0].name = `A & B <"co">`; // must be escaped
    app.setState(s);
    for (const f of app.buildFullWorkbookFiles()) assertWellFormed(`${lang}:${f.name}`, f.content);
  }
});
