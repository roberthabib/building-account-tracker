import { chromium } from "playwright";
import fs from "node:fs";

const browserCandidates = [
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
];
const executablePath = browserCandidates.find((candidate) => fs.existsSync(candidate));
const browser = await chromium.launch({ headless: true, executablePath });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, acceptDownloads: true });
const page = await context.newPage();
const errors = [];
let uploadedInvoiceFileName = "";
const onePixelPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMB/axuE2kAAAAASUVORK5CYII=",
  "base64",
);

await page.route("https://script.google.com/**", async (route) => {
  const postData = route.request().postData() || "";
  let action = "";
  let payload = {};
  try {
    payload = JSON.parse(postData);
    action = payload.action || "";
  } catch {}
  if (action === "uploadInvoice") uploadedInvoiceFileName = payload.fileName || "";
  await route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify(
      action === "uploadInvoice"
        ? { success: false, error: "Mock invoice upload failed" }
        : { success: true, mocked: true },
    ),
  });
});

function countPdfPages(buffer) {
  return (buffer.toString("latin1").match(/\/Type\s*\/Page\b/g) || []).length;
}

async function expectSinglePrintPage(label) {
  const pdf = await page.pdf({ format: "A4", printBackground: true });
  const pages = countPdfPages(pdf);
  if (pages !== 1) {
    throw new Error(`${label} generated ${pages} print pages`);
  }
}

async function expectPrintablePdf(label) {
  const pdf = await page.pdf({ format: "A4", printBackground: true });
  const pages = countPdfPages(pdf);
  if (pages < 1) {
    throw new Error(`${label} did not generate printable PDF pages`);
  }
}

async function expectDownloadedReceiptPdf(download, label, expectedTerms = []) {
  if (!download.suggestedFilename().endsWith(".pdf")) {
    throw new Error(`${label} did not create a .pdf file`);
  }
  const path = await download.path();
  const content = fs.readFileSync(path);
  const text = content.toString("latin1");
  if (!text.startsWith("%PDF-1.4") || !text.includes("Payment Receipt")) {
    throw new Error(`${label} did not create a valid receipt PDF`);
  }
  const missing = expectedTerms.filter((term) => !text.includes(term));
  if (missing.length) {
    throw new Error(`${label} PDF is missing: ${missing.join(", ")}`);
  }
}

page.on("pageerror", (error) => errors.push(error.message));
page.on("console", (message) => {
  if (message.type() !== "error") return;
  if (message.text().includes("Failed to load resource")) return;
  errors.push(message.text());
});
page.on("response", (response) => {
  if (response.status() >= 400 && !response.url().endsWith("/favicon.ico")) {
    errors.push(`${response.status()} ${response.url()}`);
  }
});

await page.goto("http://localhost:4180", { waitUntil: "networkidle" });
await page.getByText("BUILDING ACCOUNT TRACKER v43").waitFor();
await page.getByText("Cash Balance").waitFor();
await page.getByText("Monthly Activity").waitFor();
await page.getByRole("button", { name: "Payments" }).click();
await page.getByRole("heading", { name: "Monthly Payments" }).waitFor();
await page.getByText("Tenant Status").waitFor();
await page.getByText("Month History").waitFor();
if (await page.getByRole("button", { name: "Share Last PDF" }).count()) {
  throw new Error("Payments tab should not show a separate Share Last PDF button");
}
await page.evaluate(() => {
  window.__lastReceiptPrintCalled = false;
  window.print = () => {
    window.__lastReceiptPrintCalled = true;
  };
});
await page.getByRole("button", { name: "Last Receipt" }).click();
await page.waitForFunction(() => window.__lastReceiptPrintCalled === true);
await page.waitForFunction(() => document.querySelector("#printStatement")?.textContent.includes("RCT-"));
await page.waitForFunction(() => getComputedStyle(document.querySelector("#printStatement")).display !== "none");
await expectSinglePrintPage("Last receipt");
await page.getByRole("button", { name: "Tenants" }).click();
await page.getByRole("heading", { name: "Tenant Accounts" }).waitFor();
await page.evaluate(() => {
  window.print = () => {
    window.__statementPrintCalled = true;
  };
});
await page.getByRole("button", { name: "Print Statement" }).first().click();
await page.waitForFunction(() => window.__statementPrintCalled === true);
await page.waitForFunction(() => document.querySelector("#printStatement")?.textContent.includes("Tenant Account Statement"));
await page.waitForFunction(() => document.querySelector("#printStatement")?.textContent.includes("Project Payments"));
await page.waitForFunction(() => getComputedStyle(document.querySelector("#printStatement")).display !== "none");
await expectSinglePrintPage("Tenant statement");
await page.getByRole("button", { name: "Ledger" }).click();
await page.getByRole("heading", { name: "Ledger" }).waitFor();
if (await page.getByRole("button", { name: "Export JSON" }).count()) {
  throw new Error("Ledger JSON export button should not be visible");
}
if (await page.locator(".share-receipt-button").count()) {
  throw new Error("Ledger should not show separate Share PDF receipt buttons");
}
const [ledgerDownload] = await Promise.all([
  page.waitForEvent("download"),
  page.getByRole("button", { name: "Export Excel" }).click(),
]);
if (!ledgerDownload.suggestedFilename().endsWith(".xlsx")) {
  throw new Error("Ledger Excel export did not create an .xlsx file");
}
const ledgerExportPath = await ledgerDownload.path();
const ledgerExport = fs.readFileSync(ledgerExportPath);
const ledgerExportText = ledgerExport.toString("utf8");
if (
  ledgerExport[0] !== 0x50 ||
  ledgerExport[1] !== 0x4b ||
  !ledgerExportText.includes("[Content_Types].xml") ||
  !ledgerExportText.includes("xl/workbook.xml") ||
  !ledgerExportText.includes("Net USD") ||
  !ledgerExportText.includes("Invoice Photo")
) {
  throw new Error("Ledger Excel export is not a valid .xlsx workbook");
}
await page.evaluate(() => {
  window.__ledgerPdfPrintCalled = false;
  window.print = () => {
    window.__ledgerPdfPrintCalled = true;
  };
});
await page.getByRole("button", { name: "Export PDF" }).click();
await page.waitForFunction(() => window.__ledgerPdfPrintCalled === true);
await page.waitForFunction(() => document.querySelector("#printStatement")?.textContent.includes("Ledger PDF Export"));
await expectPrintablePdf("Ledger PDF export");
await page.evaluate(() => {
  window.__receiptPrintCalled = false;
  window.print = () => {
    window.__receiptPrintCalled = true;
  };
  Object.defineProperty(navigator, "share", { value: undefined, configurable: true });
  Object.defineProperty(navigator, "canShare", { value: undefined, configurable: true });
});
const [receiptPdfDownload] = await Promise.all([
  page.waitForEvent("download"),
  page.getByRole("button", { name: "Receipt" }).first().click(),
]);
await expectDownloadedReceiptPdf(receiptPdfDownload, "Ledger receipt button PDF");
if (await page.evaluate(() => window.__receiptPrintCalled === true)) {
  throw new Error("Ledger Receipt button should share/download a PDF instead of printing");
}
await page.evaluate(() => {
  window.__autoReceiptPrintCalled = false;
  window.print = () => {
    window.__autoReceiptPrintCalled = true;
  };
});
await page.getByRole("button", { name: "Settings" }).click();
await page.getByRole("heading", { name: "Settings" }).waitFor();
if ((await page.locator("#defaultDueInput").inputValue()) !== "") {
  throw new Error("Zero default monthly amount should display as an empty input");
}
await page.locator("#defaultDueInput").fill("1");
await page.getByRole("button", { name: "Save" }).click();
await page.getByText("Settings saved").waitFor();
await page.getByRole("button", { name: "Add transaction" }).click();
await page.getByRole("heading", { name: "Add Transaction" }).waitFor();
await page.locator("#transactionCategory").selectOption("Payments");
if (await page.locator("#transactionCategory option", { hasText: "Advance Payments" }).count()) {
  throw new Error("Advance Payments should not be available for new entries");
}
await page.locator("#transactionUsd").fill("1");
await page.locator("#transactionForm button[type='submit']").click();
await page.getByText("Payment added. Receipt saved").waitFor();
await page.waitForTimeout(150);
if (await page.evaluate(() => window.__autoReceiptPrintCalled === true)) {
  throw new Error("Payment submission triggered automatic receipt printing");
}
await page.getByRole("button", { name: "Add transaction" }).click();
await page.getByRole("heading", { name: "Add Transaction" }).waitFor();
await page.locator("#transactionCategory").selectOption("Payments");
const advanceStartMonth = await page.locator("#transactionMonth").inputValue();
await page.locator("#transactionUsd").fill("2");
await page.locator("#transactionForm button[type='submit']").click();
await page.getByText("Payment added. Receipt saved").waitFor();
const advanceAllocation = await page.evaluate((startMonth) => {
  const state = JSON.parse(localStorage.getItem("building-account-tracker:v1"));
  const entries = state.transactions.filter((transaction) => transaction.paymentGroupId).slice(-2);
  const expected = state.settings.defaultDueUsd;
  return {
    expected,
    count: entries.length,
    months: entries.map((entry) => entry.forMonth),
    amounts: entries.map((entry) => entry.creditUsd),
    receiptRef: entries[0]?.receiptRef || "",
    sameReceipt: entries.length === 2 && entries[0].receiptRef && entries[0].receiptRef === entries[1].receiptRef,
    startsAtSelectedMonth: entries[0]?.forMonth === `${startMonth}-01`,
  };
}, advanceStartMonth);
if (
  advanceAllocation.expected !== 1 ||
  advanceAllocation.count !== 2 ||
  !advanceAllocation.sameReceipt ||
  !advanceAllocation.startsAtSelectedMonth ||
  advanceAllocation.amounts.some((amount) => amount !== 1)
) {
  throw new Error(`Monthly overpayment was not split into advance allocations: ${JSON.stringify(advanceAllocation)}`);
}
await page.getByRole("button", { name: "Ledger" }).click();
await page.locator("#ledgerSearch").fill(advanceAllocation.receiptRef);
const [advanceReceiptPdfDownload] = await Promise.all([
  page.waitForEvent("download"),
  page.getByRole("button", { name: "Receipt" }).first().click(),
]);
await expectDownloadedReceiptPdf(advanceReceiptPdfDownload, "Advance receipt button PDF", [
  "Months Covered",
  "Advance Liability",
]);
await page.getByRole("button", { name: "Settings" }).click();
await page.getByRole("heading", { name: "Settings" }).waitFor();
await page.locator("#defaultDueInput").fill("0");
await page.getByRole("button", { name: "Save" }).click();
await page.getByText("Settings saved").waitFor();
if ((await page.locator("#defaultDueInput").inputValue()) !== "") {
  throw new Error("Saving a zero default monthly amount should leave the input empty");
}
await page.getByRole("button", { name: "Payments" }).click();
await page.getByRole("heading", { name: "Monthly Payments" }).waitFor();
await page.getByRole("button", { name: "Add Month" }).click();
await page.locator("#newMonthInput").fill("2030-01");
if ((await page.locator("#newMonthAmountInput").inputValue()) !== "") {
  throw new Error("New month amount should be empty when there is no default monthly amount");
}
await page.locator("#newMonthAmountInput").fill("60");
await page.locator("#monthForm button[type='submit']").click();
await page.getByText("Month saved").waitFor();
await page.getByRole("button", { name: "Add transaction" }).click();
await page.getByRole("heading", { name: "Add Transaction" }).waitFor();
await page.locator("#transactionCategory").selectOption("Payments");
await page.locator("#transactionMonth").fill("2030-01");
if ((await page.locator("#transactionUsd").inputValue()) !== "") {
  throw new Error("Payment amount should be empty when there is no default monthly amount");
}
await page.locator("#transactionUsd").fill("100");
await page.locator("#transactionForm button[type='submit']").click();
await page.getByText("Payment added. Receipt saved").waitFor();
const partialAdvanceAllocation = await page.evaluate(() => {
  const state = JSON.parse(localStorage.getItem("building-account-tracker:v1"));
  const entries = state.transactions.filter((transaction) => transaction.paymentGroupId).slice(-2);
  const expectedRows = Object.fromEntries(
    state.monthlyExpected
      .filter((entry) => entry.month === "2030-01-01" || entry.month === "2030-02-01")
      .map((entry) => [entry.month, entry.expectedUsd]),
  );
  return {
    count: entries.length,
    months: entries.map((entry) => entry.forMonth),
    amounts: entries.map((entry) => entry.creditUsd),
    sameReceipt: entries.length === 2 && entries[0].receiptRef && entries[0].receiptRef === entries[1].receiptRef,
    expectedRows,
  };
});
if (
  partialAdvanceAllocation.count !== 2 ||
  !partialAdvanceAllocation.sameReceipt ||
  partialAdvanceAllocation.months[0] !== "2030-01-01" ||
  partialAdvanceAllocation.months[1] !== "2030-02-01" ||
  partialAdvanceAllocation.amounts[0] !== 60 ||
  partialAdvanceAllocation.amounts[1] !== 40 ||
  partialAdvanceAllocation.expectedRows["2030-01-01"] !== 60 ||
  partialAdvanceAllocation.expectedRows["2030-02-01"] !== 60
) {
  throw new Error(`Partial advance allocation failed: ${JSON.stringify(partialAdvanceAllocation)}`);
}
await page.getByRole("button", { name: "Add transaction" }).click();
await page.getByRole("heading", { name: "Add Transaction" }).waitFor();
await page.locator("#transactionCategory").selectOption("Payments");
await page.locator("#transactionProject").fill("Smoke Project");
await page.locator(".month-field").evaluate((element) => {
  if (!element.classList.contains("hidden")) throw new Error("Project payment should not require a month");
});
await page.locator("#transactionUsd").fill("2");
await page.locator("#transactionForm button[type='submit']").click();
await page.getByText("Payment added. Receipt saved").waitFor();
await page.getByRole("button", { name: "Ledger" }).click();
await page.locator("#ledgerSearch").fill("Smoke Project");
await page.getByText("Project: Smoke Project").waitFor();
await page.evaluate(() => {
  window.__projectReceiptPrintCalled = false;
  window.print = () => {
    window.__projectReceiptPrintCalled = true;
  };
});
const [projectReceiptPdfDownload] = await Promise.all([
  page.waitForEvent("download"),
  page.getByRole("button", { name: "Receipt" }).first().click(),
]);
await expectDownloadedReceiptPdf(projectReceiptPdfDownload, "Project receipt button PDF");
if (await page.evaluate(() => window.__projectReceiptPrintCalled === true)) {
  throw new Error("Project Receipt button should share/download a PDF instead of printing");
}
await page.getByRole("button", { name: "Tenants" }).click();
await page.evaluate(() => {
  window.__projectStatementPrintCalled = false;
  window.print = () => {
    window.__projectStatementPrintCalled = true;
  };
});
await page.getByRole("button", { name: "Print Statement" }).first().click();
await page.waitForFunction(() => window.__projectStatementPrintCalled === true);
await page.waitForFunction(() => document.querySelector("#printStatement")?.textContent.includes("Smoke Project"));
await page.waitForFunction(() => document.querySelector("#printStatement")?.textContent.includes("Receipts"));
await page.waitForFunction(() => /RCT-\d{8}-\d{4}/.test(document.querySelector("#printStatement")?.textContent || ""));
await page.getByRole("button", { name: "Add transaction" }).click();
await page.getByRole("heading", { name: "Add Transaction" }).waitFor();
await page.locator("#transactionCategory").selectOption("Expenses");
if ((await page.locator("#transactionLbp").inputValue()) !== "" || (await page.locator("#transactionUsd").inputValue()) !== "") {
  throw new Error("Expense amount fields should be empty by default");
}
await page.getByRole("button", { name: "Use Camera" }).waitFor();
await page.getByRole("button", { name: "Upload Photo" }).waitFor();
if ((await page.locator("#transactionInvoiceCameraFile").getAttribute("capture")) !== "environment") {
  throw new Error("Camera invoice input should request environment capture");
}
if ((await page.locator("#transactionInvoiceFile").getAttribute("capture")) !== null) {
  throw new Error("Invoice upload input should allow choosing an existing phone photo");
}
const suggestedInvoice = await page.locator("#transactionInvoice").inputValue();
if (!/^INV\d{4}$/.test(suggestedInvoice)) {
  throw new Error(`Expense invoice number was not suggested sequentially: ${suggestedInvoice}`);
}
await page.locator("#transactionInvoice").fill("INV0004");
await page.locator("#transactionSupplier").fill("Smoke Supplier");
await page.locator("#transactionInvoiceFile").setInputFiles({
  name: "invoice.png",
  mimeType: "image/png",
  buffer: onePixelPng,
});
await page.getByText("invoice.png").waitFor();
await page.locator("#transactionDescription").fill("Smoke test expense");
const expenseDate = await page.locator("#transactionDate").inputValue();
await page.locator("#transactionLbp").fill("89500");
await page.waitForTimeout(100);
const expensePreview = await page.evaluate(() => {
  const preview = document.querySelector("#expenseConversionPreview");
  return {
    category: document.querySelector("#transactionCategory")?.value,
    lbp: document.querySelector("#transactionLbp")?.value,
    usd: document.querySelector("#transactionUsd")?.value,
    rate: document.querySelector("#lbpRateInput")?.value,
    text: preview?.textContent || "",
    className: preview?.className || "",
    display: preview ? getComputedStyle(preview).display : "",
  };
});
if (!expensePreview.text.includes("$1.00 balance impact") || expensePreview.display === "none") {
  throw new Error(`Expense conversion preview is incorrect: ${JSON.stringify(expensePreview)}`);
}
await page.locator("#transactionForm button[type='submit']").click();
await page.getByText("Expense saved. Invoice upload failed").waitFor();
if (uploadedInvoiceFileName !== `${expenseDate}_INV0004_Smoke-test-expense.jpg`) {
  throw new Error(`Unexpected Drive invoice filename: ${uploadedInvoiceFileName}`);
}
await page.getByRole("button", { name: "Ledger" }).click();
await page.locator("#ledgerSearch").fill("Smoke test expense");
await page.getByRole("button", { name: "Edit" }).first().click();
await page.getByRole("heading", { name: "Edit Expense" }).waitFor();
if ((await page.locator("#transactionInvoice").inputValue()) !== "INV0004") {
  throw new Error("Manual expense invoice number was not preserved");
}
if ((await page.locator("#transactionSupplier").inputValue()) !== "Smoke Supplier") {
  throw new Error("Manual expense supplier was not preserved");
}
if (!(await page.locator("#transactionCategory").evaluate((element) => element.disabled))) {
  throw new Error("Expense edit mode should lock the transaction type");
}
await page.locator("#transactionDescription").fill("Smoke edited expense");
await page.locator("#transactionLbp").fill("179000");
await page.locator("#transactionForm button[type='submit']").click();
await page.getByText("Expense updated").waitFor();
await page.locator("#ledgerSearch").fill("Smoke edited expense");
await page.getByText("Smoke edited expense").waitFor();
await page.locator(".ledger-amount").filter({ hasText: "-$2.00" }).first().waitFor();
page.once("dialog", (dialog) => dialog.accept());
await page.getByRole("button", { name: "Delete" }).first().click();
await page.getByText("Ledger entry deleted").waitFor();
await page.getByText("No matching transactions").waitFor();
await page.getByRole("button", { name: "Add transaction" }).click();
await page.getByRole("heading", { name: "Add Transaction" }).waitFor();
await page.locator("#transactionCategory").selectOption("Expenses");
await page.locator("#supplierDropdownButton").click();
await page.locator("#supplierDropdown button", { hasText: "Smoke Supplier" }).click();
if ((await page.locator("#transactionSupplier").inputValue()) !== "Smoke Supplier") {
  throw new Error("Supplier dropdown did not fill the supplier field");
}
await page.getByRole("button", { name: "Cancel" }).click();
await page.getByRole("button", { name: "Settings" }).click();
await page.getByRole("heading", { name: "Settings" }).waitFor();
page.once("dialog", (dialog) => dialog.accept());
await page.getByRole("button", { name: "Zero Accounts" }).click();
await page.getByText("All accounts set to zero").waitFor();
await page.locator("#invoiceUploadUrlInput").waitFor();
if (
  (await page.locator("#invoiceUploadUrlInput").inputValue()) !==
  "https://script.google.com/macros/s/AKfycbzXlrSIWH5FUM5bU5iGpyB0KGXuXeThGloAaiYvAdxwSe88H96kZMtB2kCm4HvpYwAA/exec"
) {
  throw new Error("Default Google Apps Script URL is not prefilled");
}
if ((await page.locator("#cloudSpreadsheetIdInput").inputValue()) !== "1LYnpt1p5JkuGNbzLM0uOZBtmXmBiQtqc3SG9qMqhehU") {
  throw new Error("Default Google Sheet ID is not prefilled");
}
if ((await page.locator("#invoiceUploadFolderIdInput").inputValue()) !== "1QOdJLYZV4dlnW8xP2ZnjEpYY8vjmQxnn") {
  throw new Error("Default invoice folder ID is not prefilled");
}
await page.getByRole("button", { name: "Dashboard" }).click();
await page.getByText("Cash Balance").waitFor();
await page.locator(".kpi").filter({ hasText: "Cash Balance" }).getByText("$0.00").waitFor();
const monthlyExpectedAfterZero = await page.evaluate(
  () => JSON.parse(localStorage.getItem("building-account-tracker:v1") || "{}").monthlyExpected || [],
);
if (monthlyExpectedAfterZero.length !== 0) {
  throw new Error("Zero Accounts should remove all monthly expected rows");
}
await page.getByRole("button", { name: "Ledger" }).click();
await page.getByText("No matching transactions").waitFor();

if (errors.length) {
  throw new Error(errors.join("\n"));
}

await context.close();
await browser.close();
console.log("Smoke test passed");
