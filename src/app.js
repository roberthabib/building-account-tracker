const STORAGE_KEY = "building-account-tracker:v1";
const APP_VERSION = "v60";

const els = {
  views: document.querySelectorAll(".view"),
  navButtons: document.querySelectorAll(".nav-button"),
  monthSelect: document.querySelector("#monthSelect"),
  kpiGrid: document.querySelector("#kpiGrid"),
  collectionRate: document.querySelector("#collectionRate"),
  collectionProgress: document.querySelector("#collectionProgress"),
  tenantStatusGrid: document.querySelector("#tenantStatusGrid"),
  categorySummaryPeriod: document.querySelector("#categorySummaryPeriod"),
  categorySummary: document.querySelector("#categorySummary"),
  paymentMonthStrip: document.querySelector("#paymentMonthStrip"),
  paymentSummary: document.querySelector("#paymentSummary"),
  paymentMonthRate: document.querySelector("#paymentMonthRate"),
  tenantPaymentList: document.querySelector("#tenantPaymentList"),
  monthOverviewList: document.querySelector("#monthOverviewList"),
  tenantList: document.querySelector("#tenantList"),
  tenantSearch: document.querySelector("#tenantSearch"),
  addTenantButton: document.querySelector("#addTenantButton"),
  tenantDialog: document.querySelector("#tenantDialog"),
  tenantDialogTitle: document.querySelector("#tenantDialogTitle"),
  tenantForm: document.querySelector("#tenantForm"),
  tenantNameInput: document.querySelector("#tenantNameInput"),
  tenantUnitInput: document.querySelector("#tenantUnitInput"),
  tenantPhoneDialogInput: document.querySelector("#tenantPhoneDialogInput"),
  tenantSubmitButton: document.querySelector("#tenantSubmitButton"),
  closeTenantDialog: document.querySelector("#closeTenantDialog"),
  cancelTenantButton: document.querySelector("#cancelTenantButton"),
  ledgerList: document.querySelector("#ledgerList"),
  ledgerSearch: document.querySelector("#ledgerSearch"),
  categoryFilter: document.querySelector("#categoryFilter"),
  expenseCategoryFilter: document.querySelector("#expenseCategoryFilter"),
  ledgerDateFrom: document.querySelector("#ledgerDateFrom"),
  ledgerDateTo: document.querySelector("#ledgerDateTo"),
  ledgerFilterStatus: document.querySelector("#ledgerFilterStatus"),
  ledgerCount: document.querySelector("#ledgerCount"),
  clearLedgerFilters: document.querySelector("#clearLedgerFilters"),
  monthPrev: document.querySelector("#monthPrev"),
  monthNext: document.querySelector("#monthNext"),
  dueOnlyToggle: document.querySelector("#dueOnlyToggle"),
  whatsappAllDueButton: document.querySelector("#whatsappAllDueButton"),
  whatsappDialog: document.querySelector("#whatsappDialog"),
  whatsappDialogNote: document.querySelector("#whatsappDialogNote"),
  whatsappReminderList: document.querySelector("#whatsappReminderList"),
  closeWhatsappDialog: document.querySelector("#closeWhatsappDialog"),
  expenseByCategoryPanel: document.querySelector("#expenseByCategoryPanel"),
  expenseByCategoryPeriod: document.querySelector("#expenseByCategoryPeriod"),
  expenseByCategoryList: document.querySelector("#expenseByCategoryList"),
  exportExcelButton: document.querySelector("#exportExcelButton"),
  exportButton: document.querySelector("#exportButton"),
  openAddButton: document.querySelector("#openAddButton"),
  transactionDialog: document.querySelector("#transactionDialog"),
  transactionDialogTitle: document.querySelector("#transactionDialogTitle"),
  transactionForm: document.querySelector("#transactionForm"),
  transactionSubmitButton: document.querySelector("#transactionSubmitButton"),
  closeDialogButton: document.querySelector("#closeDialogButton"),
  cancelDialogButton: document.querySelector("#cancelDialogButton"),
  transactionCategory: document.querySelector("#transactionCategory"),
  transactionDirection: document.querySelector("#transactionDirection"),
  transactionTenant: document.querySelector("#transactionTenant"),
  transactionDescription: document.querySelector("#transactionDescription"),
  transactionDate: document.querySelector("#transactionDate"),
  transactionMonth: document.querySelector("#transactionMonth"),
  transactionLbp: document.querySelector("#transactionLbp"),
  transactionUsd: document.querySelector("#transactionUsd"),
  expenseConversionPreview: document.querySelector("#expenseConversionPreview"),
  transactionSupplier: document.querySelector("#transactionSupplier"),
  supplierDropdownButton: document.querySelector("#supplierDropdownButton"),
  supplierDropdown: document.querySelector("#supplierDropdown"),
  transactionInvoice: document.querySelector("#transactionInvoice"),
  transactionProject: document.querySelector("#transactionProject"),
  takeInvoicePhotoButton: document.querySelector("#takeInvoicePhotoButton"),
  uploadInvoicePhotoButton: document.querySelector("#uploadInvoicePhotoButton"),
  transactionInvoiceCameraFile: document.querySelector("#transactionInvoiceCameraFile"),
  transactionInvoiceFile: document.querySelector("#transactionInvoiceFile"),
  invoiceFileSelectionStatus: document.querySelector("#invoiceFileSelectionStatus"),
  invoiceAttachmentStatus: document.querySelector("#invoiceAttachmentStatus"),
  supplierList: document.querySelector("#supplierList"),
  projectList: document.querySelector("#projectList"),
  projectDropdownButton: document.querySelector("#projectDropdownButton"),
  projectDropdown: document.querySelector("#projectDropdown"),
  transactionExpenseCategory: document.querySelector("#transactionExpenseCategory"),
  expenseCategoryDropdownButton: document.querySelector("#expenseCategoryDropdownButton"),
  expenseCategoryDropdown: document.querySelector("#expenseCategoryDropdown"),
  lastReceiptButton: document.querySelector("#lastReceiptButton"),
  addMonthButton: document.querySelector("#addMonthButton"),
  monthDialog: document.querySelector("#monthDialog"),
  monthForm: document.querySelector("#monthForm"),
  closeMonthButton: document.querySelector("#closeMonthButton"),
  cancelMonthButton: document.querySelector("#cancelMonthButton"),
  newMonthInput: document.querySelector("#newMonthInput"),
  newMonthAmountInput: document.querySelector("#newMonthAmountInput"),
  buildingNameInput: document.querySelector("#buildingNameInput"),
  defaultDueInput: document.querySelector("#defaultDueInput"),
  conversionRateInput: document.querySelector("#conversionRateInput"),
  invoiceUploadUrlInput: document.querySelector("#invoiceUploadUrlInput"),
  cloudSpreadsheetIdInput: document.querySelector("#cloudSpreadsheetIdInput"),
  invoiceUploadFolderIdInput: document.querySelector("#invoiceUploadFolderIdInput"),
  saveSettingsButton: document.querySelector("#saveSettingsButton"),
  loadCloudButton: document.querySelector("#loadCloudButton"),
  cloudSyncStatus: document.querySelector("#cloudSyncStatus"),
  resetButton: document.querySelector("#resetButton"),
  zeroAccountsButton: document.querySelector("#zeroAccountsButton"),
  printStatement: document.querySelector("#printStatement"),
  toast: document.querySelector("#toast"),
};

let seedState;
let state;
let selectedMonth;
let dueOnlyFilter = false;
let editingTenantId = null;
let editingExpenseId = null;
let printCleanupTimer = null;
let cloudSaveTimer = null;
let cloudSaveInFlight = false;

const numberFormat = new Intl.NumberFormat("en-US");
const usdFormat = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const DEFAULT_LBP_PER_USD = 89500;
const DEFAULT_GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzXlrSIWH5FUM5bU5iGpyB0KGXuXeThGloAaiYvAdxwSe88H96kZMtB2kCm4HvpYwAA/exec";
const DEFAULT_GOOGLE_SHEET_ID = "1LYnpt1p5JkuGNbzLM0uOZBtmXmBiQtqc3SG9qMqhehU";
const DEFAULT_INVOICE_FOLDER_ID = "1QOdJLYZV4dlnW8xP2ZnjEpYY8vjmQxnn";
const DEFAULT_CATEGORIES = ["Opening Balance", "Payments", "Expenses"];
const SERVER_INVOICE_UPLOAD_PATH = "/api/upload-invoice";
const EXPENSE_INVOICE_PREFIX = "INV";
const INVOICE_IMAGE_MAX_EDGE = 1800;
const INVOICE_IMAGE_QUALITY = 0.82;
const INVOICE_UPLOAD_MAX_BYTES = 3 * 1024 * 1024;

function localDateInput(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function formatLbp(value) {
  return `${numberFormat.format(Math.round(value || 0))} LL`;
}

function formatUsd(value) {
  return usdFormat.format(Math.round(value || 0));
}

function formatMonthly(value) {
  return formatUsd(value);
}

function amountInputValue(value) {
  const amount = Number(value || 0);
  return amount > 0 ? amount : "";
}

function getConversionRate() {
  const rate = Number(state?.settings?.lbpPerUsd || DEFAULT_LBP_PER_USD);
  return rate > 0 ? rate : DEFAULT_LBP_PER_USD;
}

function formatDateLabel(dateStr) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function formatMonth(value) {
  if (!value) return "No month";
  const [year, month] = value.slice(0, 7).split("-");
  return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

function monthIso(monthInputValue) {
  return monthInputValue ? `${monthInputValue}-01` : null;
}

function monthKey(value) {
  return value ? value.slice(0, 7) : "";
}

function addMonths(value, count) {
  const [year, month] = monthKey(value).split("-").map(Number);
  const date = new Date(year, month - 1 + count, 1);
  return monthIso(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`);
}

function currentMonthValue() {
  return monthIso(monthKey(localDateInput()));
}

function isFutureMonth(value) {
  return Boolean(value) && monthKey(value) > monthKey(currentMonthValue());
}

function isCurrentOrPastMonth(value) {
  return Boolean(value) && monthKey(value) <= monthKey(currentMonthValue());
}

function roundUsd(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

function transactionDateValue(transaction) {
  return transaction.date || transaction.forMonth || "1900-01-01";
}

function transactionNet(transaction) {
  return {
    lbp: Number(transaction.creditLbp || 0) - Number(transaction.debitLbp || 0),
    usd: Number(transaction.creditUsd || 0) - Number(transaction.debitUsd || 0),
  };
}

function toUsd(usdAmount = 0, lbpAmount = 0) {
  return Number(usdAmount || 0) + Number(lbpAmount || 0) / getConversionRate();
}

function transactionNetUsd(transaction) {
  const net = transactionNet(transaction);
  return toUsd(net.usd, net.lbp);
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("visible");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => els.toast.classList.remove("visible"), 2200);
}

function saveState(options = {}) {
  state.monthlyExpected = normalizedMonthlyExpected(state.monthlyExpected);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  if (options.sync !== false) queueCloudSave();
}

function hydrateState(rawState) {
  const hydrated = clone(rawState);
  hydrated.settings ||= {};
  if (hydrated.settings.defaultDueUsd === undefined) hydrated.settings.defaultDueUsd = getSeedDefaultDue(hydrated);
  if (hydrated.settings.lbpPerUsd === undefined) hydrated.settings.lbpPerUsd = DEFAULT_LBP_PER_USD;
  hydrated.settings.invoiceUploadUrl ||= DEFAULT_GOOGLE_SCRIPT_URL;
  hydrated.settings.cloudSpreadsheetId ||= DEFAULT_GOOGLE_SHEET_ID;
  hydrated.settings.invoiceUploadFolderId ||= DEFAULT_INVOICE_FOLDER_ID;
  hydrated.transactions ||= [];
  hydrated.tenants ||= [];
  hydrated.tenants.forEach((tenant) => { tenant.phone ||= ""; });
  hydrated.projects ||= [];
  hydrated.suppliers ||= [];
  hydrated.expenseCategories ||= [];
  hydrated.transactions.forEach((transaction) => {
    if (transaction.category === "Payments" && transaction.project) transaction.forMonth = null;
  });
  hydrated.categories = DEFAULT_CATEGORIES.slice();
  hydrated.transactions.forEach((transaction) => {
    if (transaction.category && !hydrated.categories.includes(transaction.category)) {
      hydrated.categories.push(transaction.category);
    }
  });
  hydrated.monthlyExpected = normalizedMonthlyExpected(hydrated.monthlyExpected || []);
  return hydrated;
}

function normalizedMonthlyExpected(entries) {
  return (entries || [])
    .map((entry) => ({
      month: entry.month || "",
      expectedUsd: Number(entry.expectedUsd || 0),
    }))
    .filter((entry) => entry.month && entry.expectedUsd > 0);
}

function getSeedDefaultDue(source) {
  const amounts = (source.monthlyExpected || [])
    .map((entry) => Number(entry.expectedUsd || 0))
    .filter((amount) => amount > 0);
  return amounts.length ? amounts[amounts.length - 1] : 0;
}

function tenantName(tenantId) {
  return state.tenants.find((tenant) => tenant.id === tenantId)?.name || "";
}

function tenantIdByName(name) {
  return state.tenants.find((tenant) => tenant.name === name)?.id || null;
}

function getMonths() {
  const months = new Set();
  state.monthlyExpected.forEach((entry) => entry.month && months.add(entry.month));
  state.transactions.forEach((transaction) => transaction.forMonth && months.add(transaction.forMonth));
  return [...months].sort();
}

function getExpectedMonthlyUsd(month) {
  const configured = state.monthlyExpected.find((entry) => entry.month === month);
  if (configured && Number(configured.expectedUsd || 0) > 0) return Number(configured.expectedUsd || 0);
  return Number(state.settings.defaultDueUsd || 0);
}

function hasConfiguredMonthlyExpected(month) {
  return state.monthlyExpected.some((entry) => entry.month === month && Number(entry.expectedUsd || 0) > 0);
}

function getRawPaidForMonth(tenantId, month) {
  const usd = state.transactions
    .filter(
      (transaction) =>
        transaction.category === "Payments" &&
        transaction.tenantId === tenantId &&
        transaction.forMonth === month &&
        !transaction.project,
    )
    .reduce((total, transaction) => total + transactionNetUsd(transaction), 0);
  return { usd };
}

function getPaidForMonth(tenantId, month) {
  const rawPaid = getRawPaidForMonth(tenantId, month).usd;
  const expected = getExpectedMonthlyUsd(month);
  return { usd: expected > 0 ? Math.min(rawPaid, expected) : rawPaid };
}

function getTenantTotals(tenantId) {
  const totals = {
    paidUsd: 0,
    advanceUsd: 0,
    dueUsd: 0,
  };

  state.transactions.forEach((transaction) => {
    if (transaction.tenantId !== tenantId) return;
    const netUsd = transactionNetUsd(transaction);
    if (isMonthlyPayment(transaction)) {
      totals.paidUsd += netUsd;
    }
    if (transaction.category === "Advance Payments") {
      totals.advanceUsd += netUsd;
    }
  });

  getMonths().forEach((month) => {
    const expected = getExpectedMonthlyUsd(month);
    if (!expected) return;
    const rawPaid = getRawPaidForMonth(tenantId, month).usd;
    if (isFutureMonth(month)) {
      totals.advanceUsd += Math.max(0, rawPaid);
      return;
    }
    totals.advanceUsd += Math.max(0, rawPaid - expected);
    if (isCurrentOrPastMonth(month)) totals.dueUsd += Math.max(0, expected - Math.min(rawPaid, expected));
  });

  return totals;
}

function getCategoryTotals() {
  return state.categories.map((category) => {
    const usd = state.transactions
      .filter((transaction) => transaction.category === category)
      .reduce((total, transaction) => total + transactionNetUsd(transaction), 0);
    return { category, usd };
  });
}

function getAccountTotals() {
  return state.transactions.reduce(
    (acc, transaction) => {
      const netUsd = transactionNetUsd(transaction);
      acc.usd += netUsd;
      if (transaction.category === "Payments") {
        acc.paymentsUsd += netUsd;
      }
      if (transaction.category === "Advance Payments") {
        acc.advanceUsd += netUsd;
      }
      if (transaction.category === "Expenses") {
        acc.expenseUsd += toUsd(transaction.debitUsd, transaction.debitLbp);
      }
      return acc;
    },
    {
      usd: 0,
      paymentsUsd: 0,
      advanceUsd: 0,
      expenseUsd: 0,
    },
  );
}

function getPositionTotals() {
  const account = getAccountTotals();
  const tenantTotals = state.tenants.map((tenant) => getTenantTotals(tenant.id));
  const receivableUsd = tenantTotals.reduce((sum, totals) => sum + totals.dueUsd, 0);
  const advanceLiabilityUsd = tenantTotals.reduce((sum, totals) => sum + Math.max(0, totals.advanceUsd), 0);

  return {
    cashUsd: account.usd,
    receivableUsd,
    advanceLiabilityUsd,
    netPositionUsd: account.usd + receivableUsd - advanceLiabilityUsd,
  };
}

function getMonthlyActivityRows(month) {
  const hasLegacyAdvancePayments = state.transactions.some((transaction) => transaction.category === "Advance Payments");
  const rows = [
    {
      category: "Opening Balance",
      note: "Entries dated in selected month",
      usd: 0,
    },
    {
      category: "Monthly Payments",
      note: "Tenant payments received by date",
      usd: 0,
      sourceCategory: "Payments",
    },
    {
      category: "Project Payments",
      note: "Extra tenant payments for selected projects",
      usd: 0,
    },
    ...(hasLegacyAdvancePayments
      ? [
          {
            category: "Advance Payments",
            note: "Legacy advance entries",
            usd: 0,
          },
        ]
      : []),
    {
      category: "Expenses",
      note: "Paid expenses, including LBP converted to USD",
      usd: 0,
    },
  ];
  const rowByCategory = new Map(rows.map((row) => [row.sourceCategory || row.category, row]));

  state.transactions.forEach((transaction) => {
    if (!month || monthKey(transactionDateValue(transaction)) !== monthKey(month)) return;
    const row = rowByCategory.get(isProjectPayment(transaction) ? "Project Payments" : transaction.category);
    if (!row) return;
    row.usd += transactionNetUsd(transaction);
  });

  return [
    ...rows,
    {
      category: "Net Cash Movement",
      note: "Cash increase or decrease for selected month",
      usd: rows.reduce((sum, row) => sum + row.usd, 0),
      emphasis: true,
    },
  ];
}

function paymentStatus(tenantId, month) {
  const expected = getExpectedMonthlyUsd(month);
  const paid = getPaidForMonth(tenantId, month).usd;
  if (!expected && !paid) return { label: "No due", className: "none", paid, expected };
  if (paid >= expected) return { label: "Paid", className: "paid", paid, expected };
  if (paid > 0) return { label: "Partial", className: "partial", paid, expected };
  return { label: "Due", className: "due", paid, expected };
}

function renderMonthSelect() {
  const months = getMonths();
  if (!selectedMonth || !months.includes(selectedMonth)) {
    selectedMonth =
      [...months].reverse().find((month) => getExpectedMonthlyUsd(month) || hasPaymentInMonth(month)) || months.at(-1);
  }

  els.monthSelect.innerHTML = "";
  months
    .slice()
    .reverse()
    .forEach((month) => {
      const option = document.createElement("option");
      option.value = month;
      option.textContent = formatMonth(month);
      option.selected = month === selectedMonth;
      els.monthSelect.append(option);
    });

  const idx = months.indexOf(selectedMonth);
  els.monthPrev.disabled = idx <= 0;
  els.monthNext.disabled = idx >= months.length - 1;
}

function hasPaymentInMonth(month) {
  return state.transactions.some((transaction) => transaction.category === "Payments" && transaction.forMonth === month);
}

function renderDashboard() {
  renderMonthSelect();
  const totals = getPositionTotals();
  const kpis = [
    ["Cash Balance", formatUsd(totals.cashUsd), "Ledger cash now"],
    ["Tenant Receivables", formatUsd(totals.receivableUsd), "Unpaid monthly dues"],
    ["Advance Liability", formatUsd(totals.advanceLiabilityUsd), "Tenant credit to honor"],
    ["Net Position", formatUsd(totals.netPositionUsd), "Cash + receivables - advances"],
  ];

  els.kpiGrid.replaceChildren(
    ...kpis.map(([label, value, note]) => {
      const card = document.createElement("article");
      card.className = "kpi";
      card.innerHTML = `<span></span><strong></strong><small></small>`;
      card.querySelector("span").textContent = label;
      card.querySelector("strong").textContent = value;
      card.querySelector("small").textContent = note;
      return card;
    }),
  );

  renderTenantStatus();
  renderCategorySummary();
  renderExpenseCategoryBreakdown();
}

function renderTenantStatus() {
  const expected = getExpectedMonthlyUsd(selectedMonth);
  const statuses = state.tenants.map((tenant) => ({ tenant, status: paymentStatus(tenant.id, selectedMonth) }));
  const expectedTotal = expected * state.tenants.length;
  const paidTotal = statuses.reduce((sum, entry) => sum + entry.status.paid, 0);
  const rate = expectedTotal ? Math.min(100, Math.round((paidTotal / expectedTotal) * 100)) : 0;

  els.collectionRate.textContent = `${rate}%`;
  els.collectionProgress.style.width = `${rate}%`;
  els.tenantStatusGrid.replaceChildren(
    ...statuses.map(({ tenant, status }) => {
      const card = document.createElement("article");
      card.className = "status-card";
      card.innerHTML = `<strong></strong><span></span><div class="status-pill"></div>`;
      card.querySelector("strong").textContent = tenant.name;
      card.querySelector("span").textContent = `${formatMonthly(status.paid)} / ${formatMonthly(status.expected)}`;
      const pill = card.querySelector(".status-pill");
      pill.classList.add(`status-${status.className === "none" ? "due" : status.className}`);
      pill.textContent = status.label;
      return card;
    }),
  );
}

function renderExpenseCategoryBreakdown() {
  const monthExpenses = state.transactions.filter(
    (t) => t.category === "Expenses" && monthKey(t.date || t.forMonth || "") === monthKey(selectedMonth),
  );

  if (!monthExpenses.length) {
    els.expenseByCategoryPanel.classList.add("hidden");
    return;
  }

  els.expenseByCategoryPanel.classList.remove("hidden");
  els.expenseByCategoryPeriod.textContent = selectedMonth ? `${formatMonth(selectedMonth)} by date` : "";

  const categoryMap = new Map();
  monthExpenses.forEach((t) => {
    const cat = t.expenseCategory || "Uncategorized";
    categoryMap.set(cat, (categoryMap.get(cat) || 0) + toUsd(Number(t.debitUsd || 0), Number(t.debitLbp || 0)));
  });

  const rows = [...categoryMap.entries()].sort((a, b) => b[1] - a[1]);
  const total = rows.reduce((sum, [, amount]) => sum + amount, 0);

  els.expenseByCategoryList.replaceChildren(
    ...rows.map(([cat, amount]) => {
      const row = document.createElement("article");
      row.className = "summary-row";
      row.innerHTML = `<div><strong></strong></div><b></b>`;
      row.querySelector("strong").textContent = cat;
      row.querySelector("b").textContent = formatUsd(amount);
      return row;
    }),
    (() => {
      const totalRow = document.createElement("article");
      totalRow.className = "summary-row emphasis";
      totalRow.innerHTML = `<div><strong></strong></div><b></b>`;
      totalRow.querySelector("strong").textContent = "Total Expenses";
      totalRow.querySelector("b").textContent = formatUsd(total);
      return totalRow;
    })(),
  );
}

function renderCategorySummary() {
  els.categorySummaryPeriod.textContent = selectedMonth ? `${formatMonth(selectedMonth)} by date` : "No selected month";
  els.categorySummary.replaceChildren(
    ...getMonthlyActivityRows(selectedMonth).map((entry) => {
      const row = document.createElement("article");
      row.className = "summary-row";
      row.classList.toggle("emphasis", Boolean(entry.emphasis));
      row.innerHTML = `<div><strong></strong><span></span></div><b></b>`;
      row.querySelector("strong").textContent = entry.category;
      row.querySelector("span").textContent = entry.note;
      row.querySelector("b").textContent = formatUsd(entry.usd);
      return row;
    }),
  );
}

function getMonthCollection(month) {
  const expected = getExpectedMonthlyUsd(month);
  const tenantStatuses = state.tenants.map((tenant) => ({ tenant, status: paymentStatus(tenant.id, month) }));
  const expectedTotal = expected * state.tenants.length;
  const paidTotal = tenantStatuses.reduce((sum, entry) => sum + entry.status.paid, 0);
  const dueTotal = Math.max(0, expectedTotal - paidTotal);
  const paidCount = tenantStatuses.filter((entry) => entry.status.className === "paid").length;
  const partialCount = tenantStatuses.filter((entry) => entry.status.className === "partial").length;
  const dueCount = tenantStatuses.filter((entry) => entry.status.className === "due").length;
  const rate = expectedTotal ? Math.min(100, Math.round((paidTotal / expectedTotal) * 100)) : 0;
  return { expected, expectedTotal, paidTotal, dueTotal, paidCount, partialCount, dueCount, rate, tenantStatuses };
}

function renderPaymentMonthSelect() {
  const months = getMonths();
  if (!selectedMonth || !months.includes(selectedMonth)) selectedMonth = months.at(-1);

  els.paymentMonthStrip.replaceChildren(
    ...months
      .slice()
      .reverse()
      .map((month) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "month-strip-btn";
        btn.dataset.month = month;
        btn.textContent = formatMonth(month);
        btn.classList.toggle("active", month === selectedMonth);
        return btn;
      }),
  );

  requestAnimationFrame(() => {
    const active = els.paymentMonthStrip.querySelector(".month-strip-btn.active");
    if (active) active.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  });
}

function renderPayments() {
  renderPaymentMonthSelect();
  const collection = getMonthCollection(selectedMonth);
  const summary = [
    ["Expected", formatMonthly(collection.expectedTotal)],
    ["Collected", formatMonthly(collection.paidTotal)],
    ["Due", formatMonthly(collection.dueTotal)],
    ["Paid Tenants", `${collection.paidCount}/${state.tenants.length}`],
  ];

  els.paymentMonthRate.textContent = `${collection.rate}% collected`;
  els.paymentSummary.replaceChildren(
    ...summary.map(([label, value]) => {
      const card = document.createElement("article");
      card.className = "payment-summary-card";
      card.innerHTML = `<span></span><strong></strong>`;
      card.querySelector("span").textContent = label;
      card.querySelector("strong").textContent = value;
      return card;
    }),
  );

  els.dueOnlyToggle.classList.toggle("is-active", dueOnlyFilter);
  const visibleStatuses = dueOnlyFilter
    ? collection.tenantStatuses.filter(({ status }) => status.paid < status.expected)
    : collection.tenantStatuses;

  els.tenantPaymentList.replaceChildren(
    ...visibleStatuses.map(({ tenant, status }) => {
      const due = Math.max(0, status.expected - status.paid);
      const row = document.createElement("div");
      row.className = "tenant-payment-row";
      row.innerHTML = `
        <div class="tpr-main">
          <div class="tpr-info">
            <strong></strong>
            <span></span>
          </div>
          <div class="tpr-amount"></div>
        </div>
        <div class="tpr-status-row">
          <div class="tpr-status-left">
            <span class="status-pill"></span>
            <span class="tpr-detail"></span>
          </div>
          <button class="mini-button tpr-add-btn" type="button">Add</button>
        </div>
      `;
      row.querySelector("strong").textContent = tenant.name;
      row.querySelector(".tpr-info span").textContent = `Unit ${tenant.unit}`;
      row.querySelector(".tpr-amount").textContent = `${formatMonthly(status.paid)} / ${formatMonthly(status.expected)}`;
      const pill = row.querySelector(".status-pill");
      pill.className = `status-pill status-${status.className === "none" ? "due" : status.className}`;
      pill.textContent = status.label;
      row.querySelector(".tpr-detail").textContent = due > 0 ? `${formatMonthly(due)} due` : "Fully paid";
      const addBtn = row.querySelector(".tpr-add-btn");
      addBtn.dataset.tenantId = tenant.id;
      addBtn.dataset.month = selectedMonth;
      addBtn.dataset.due = String(due || status.expected || state.settings.defaultDueUsd || 0);
      if (due > 0 && tenant.phone) {
        const waUrl = buildWhatsAppUrl(tenant, due, selectedMonth);
        if (waUrl) {
          const waBtn = document.createElement("a");
          waBtn.className = "whatsapp-full-btn";
          waBtn.href = waUrl;
          waBtn.target = "_blank";
          waBtn.rel = "noopener";
          waBtn.textContent = "Send WhatsApp Reminder";
          row.append(waBtn);
        }
      }
      return row;
    }),
  );

  const months = getMonths().slice().reverse();
  els.monthOverviewList.replaceChildren(
    ...months.map((month) => {
      const monthCollection = getMonthCollection(month);
      const row = document.createElement("button");
      row.className = "payment-month-row";
      row.type = "button";
      row.dataset.month = month;
      row.innerHTML = `
        <div><strong></strong><span></span></div>
        <div class="month-progress"><b></b><small></small></div>
      `;
      row.querySelector("strong").textContent = formatMonth(month);
      row.querySelector("span").textContent = `${formatMonthly(monthCollection.paidTotal)} collected`;
      row.querySelector("b").textContent = `${monthCollection.rate}%`;
      row.querySelector("small").textContent = `${monthCollection.paidCount}/${state.tenants.length} paid`;
      return row;
    }),
  );
}

function renderTenants() {
  const query = els.tenantSearch.value.trim().toLowerCase();
  const tenants = state.tenants.filter(
    (tenant) => tenant.name.toLowerCase().includes(query) || tenant.unit.toLowerCase().includes(query),
  );
  els.tenantList.replaceChildren(
    ...tenants.map((tenant) => {
      const totals = getTenantTotals(tenant.id);
      const card = document.createElement("article");
      card.className = "tenant-card";
      card.innerHTML = `
        <div class="tenant-card-top">
          <div>
            <strong></strong>
            <span class="tenant-unit-line"></span>
          </div>
          <button class="tenant-trash-btn delete-tenant-button" type="button" aria-label="Delete tenant">&#128465;</button>
        </div>
        <div class="tenant-metrics">
          <div class="metric metric-paid"><span>&#10003; Paid</span><b></b></div>
          <div class="metric"><span>Advance</span><b></b></div>
          <div class="metric metric-due"><span>Due</span><b></b></div>
        </div>
        <div class="tenant-card-footer">
          <button class="text-link-btn edit-tenant-button" type="button">Edit</button>
          <button class="text-link-btn print-statement-button" type="button">Statement</button>
        </div>
      `;
      card.querySelector("strong").textContent = tenant.name;
      const unitSpan = card.querySelector(".tenant-unit-line");
      unitSpan.textContent = `Unit ${tenant.unit}${tenant.phone ? "" : " · no phone"}`;
      const metrics = card.querySelectorAll(".metric b");
      metrics[0].textContent = formatMonthly(totals.paidUsd);
      metrics[1].textContent = formatUsd(totals.advanceUsd);
      metrics[2].textContent = formatMonthly(totals.dueUsd);
      if (totals.paidUsd > 0) card.querySelector(".metric-paid").classList.add("is-filled");
      if (totals.dueUsd > 0) card.querySelector(".metric-due").classList.add("has-due");
      card.querySelector(".edit-tenant-button").dataset.tenantId = tenant.id;
      card.querySelector(".print-statement-button").dataset.tenantId = tenant.id;
      card.querySelector(".delete-tenant-button").dataset.tenantId = tenant.id;
      return card;
    }),
  );
}

function appendCell(row, text, className = "") {
  const cell = document.createElement("td");
  if (className) cell.className = className;
  cell.textContent = text;
  row.append(cell);
}

function appendHeaderCell(row, text, className = "") {
  const cell = document.createElement("th");
  if (className) cell.className = className;
  cell.textContent = text;
  row.append(cell);
}

function printTenantStatement(tenantId) {
  const tenant = state.tenants.find((entry) => entry.id === tenantId);
  if (!tenant) {
    showToast("Tenant not found");
    return;
  }

  const months = getMonths();
  let receiptChanged = false;
  const rows = months.map((month) => {
    const status = paymentStatus(tenant.id, month);
    const receipts = state.transactions
      .filter(
        (transaction) =>
          isMonthlyPayment(transaction) && transaction.tenantId === tenant.id && transaction.forMonth === month,
      )
      .sort((a, b) => transactionDateValue(a).localeCompare(transactionDateValue(b)) || String(a.id).localeCompare(String(b.id)))
      .map((transaction) => {
        const before = transaction.receiptRef;
        const reference = ensureReceiptReference(transaction);
        if (transaction.receiptRef !== before) receiptChanged = true;
        return reference;
      })
      .filter(Boolean);
    return {
      month,
      expected: status.expected,
      paid: status.paid,
      due: Math.max(0, status.expected - status.paid),
      status: status.label,
      receipts,
    };
  });
  const totals = rows.reduce(
    (acc, row) => {
      acc.expected += row.expected;
      acc.paid += row.paid;
      acc.due += row.due;
      return acc;
    },
    { expected: 0, paid: 0, due: 0 },
  );
  const tenantTotals = getTenantTotals(tenant.id);
  const projectRows = state.transactions
    .filter((transaction) => isProjectPayment(transaction) && transaction.tenantId === tenant.id)
    .slice()
    .sort((a, b) => transactionDateValue(a).localeCompare(transactionDateValue(b)) || String(a.id).localeCompare(String(b.id)));
  const projectTotal = projectRows.reduce((sum, transaction) => sum + transactionNetUsd(transaction), 0);
  projectRows.forEach((transaction) => {
    const before = transaction.receiptRef;
    ensureReceiptReference(transaction);
    if (transaction.receiptRef !== before) receiptChanged = true;
  });
  if (receiptChanged) saveState();

  const page = document.createElement("article");
  page.className = "print-page";

  const header = document.createElement("header");
  header.className = "print-header";

  const titleBlock = document.createElement("div");
  const building = document.createElement("p");
  building.textContent = state.building.name;
  const title = document.createElement("h1");
  title.textContent = "Tenant Account Statement";
  const tenantLine = document.createElement("p");
  tenantLine.textContent = `${tenant.name} | Unit ${tenant.unit}`;
  titleBlock.append(building, title, tenantLine);

  const meta = document.createElement("div");
  meta.className = "print-meta";
  const generated = document.createElement("span");
  generated.textContent = `Date: ${localDateInput()}`;
  const version = document.createElement("span");
  version.textContent = `App: ${APP_VERSION}`;
  meta.append(generated, version);
  header.append(titleBlock, meta);

  const summary = document.createElement("section");
  summary.className = "print-summary";
  [
    ["Monthly Expected", formatMonthly(totals.expected)],
    ["Monthly Paid", formatMonthly(totals.paid)],
    ["Remaining Monthly Due", formatMonthly(totals.due)],
    ["Project Payments", formatUsd(projectTotal)],
    ["Advance Balance", formatUsd(tenantTotals.advanceUsd)],
  ].forEach(([label, value]) => {
    const item = document.createElement("div");
    const itemLabel = document.createElement("span");
    itemLabel.textContent = label;
    const itemValue = document.createElement("strong");
    itemValue.textContent = value;
    item.append(itemLabel, itemValue);
    summary.append(item);
  });

  const monthlyTitle = document.createElement("h2");
  monthlyTitle.className = "print-section-title";
  monthlyTitle.textContent = "Monthly Fees";

  const table = document.createElement("table");
  table.className = "print-table";
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
    ["Month", "Expected USD", "Paid USD", "Due USD", "Status", "Receipts"].forEach((heading, index) =>
      appendHeaderCell(headerRow, heading, index > 0 && index < 4 ? "numeric" : ""),
  );
  thead.append(headerRow);

  const tbody = document.createElement("tbody");
  rows.forEach((entry) => {
    const row = document.createElement("tr");
    appendCell(row, formatMonth(entry.month));
    appendCell(row, formatMonthly(entry.expected), "numeric");
    appendCell(row, formatMonthly(entry.paid), "numeric");
    appendCell(row, formatMonthly(entry.due), "numeric");
    appendCell(row, entry.status);
    appendCell(row, entry.receipts.join(", "));
    tbody.append(row);
  });

  const tfoot = document.createElement("tfoot");
  const totalRow = document.createElement("tr");
  appendCell(totalRow, "Total");
  appendCell(totalRow, formatMonthly(totals.expected), "numeric");
  appendCell(totalRow, formatMonthly(totals.paid), "numeric");
  appendCell(totalRow, formatMonthly(totals.due), "numeric");
  appendCell(totalRow, "");
  appendCell(totalRow, "");
  tfoot.append(totalRow);
  table.append(thead, tbody, tfoot);

  const projectSection = [];
  if (projectRows.length) {
    const projectTitle = document.createElement("h2");
    projectTitle.className = "print-section-title";
    projectTitle.textContent = "Project Payments";

    const projectTable = document.createElement("table");
    projectTable.className = "print-table";
    const projectHead = document.createElement("thead");
    const projectHeaderRow = document.createElement("tr");
    ["Date", "Project", "Amount USD", "Receipt"].forEach((heading, index) =>
      appendHeaderCell(projectHeaderRow, heading, index === 2 ? "numeric" : ""),
    );
    projectHead.append(projectHeaderRow);

    const projectBody = document.createElement("tbody");
    projectRows.forEach((transaction) => {
      const row = document.createElement("tr");
      appendCell(row, transaction.date || "");
      appendCell(row, transaction.project || "");
      appendCell(row, formatUsd(transactionNetUsd(transaction)), "numeric");
      appendCell(row, transaction.receiptRef || "");
      projectBody.append(row);
    });
    projectTable.append(projectHead, projectBody);
    projectSection.push(projectTitle, projectTable);
  }

  const note = document.createElement("p");
  note.className = "print-note";
  note.textContent =
    "Monthly dues and project payments are separated. Project payments are not applied to monthly fees.";

  page.append(header, summary, monthlyTitle, table, ...projectSection, note);
  printPreparedPage(page);
}

function isMonthlyPayment(transaction) {
  return (
    transaction.category === "Payments" &&
    Boolean(transaction.tenantId) &&
    Boolean(transaction.forMonth) &&
    !transaction.project
  );
}

function isProjectPayment(transaction) {
  return transaction.category === "Payments" && Boolean(transaction.tenantId) && Boolean(transaction.project);
}

function isReceiptablePayment(transaction) {
  return isMonthlyPayment(transaction) || isProjectPayment(transaction);
}

function compactDate(value) {
  return String(value || localDateInput()).replace(/-/g, "");
}

function nextReceiptReference(date, excludeTransactionId = null) {
  const base = `RCT-${compactDate(date)}`;
  const used = new Set(
    state.transactions
      .filter((transaction) => transaction.id !== excludeTransactionId)
      .map((transaction) => transaction.receiptRef)
      .filter(Boolean),
  );
  let sequence = 1;
  let reference = `${base}-${String(sequence).padStart(4, "0")}`;
  while (used.has(reference)) {
    sequence += 1;
    reference = `${base}-${String(sequence).padStart(4, "0")}`;
  }
  return reference;
}

function samePaymentGroup(first, second) {
  return Boolean(first.paymentGroupId && second.paymentGroupId && first.paymentGroupId === second.paymentGroupId);
}

function ensureReceiptReference(transaction) {
  if (!isReceiptablePayment(transaction)) return "";
  const duplicate = state.transactions.some(
    (entry) =>
      entry.id !== transaction.id &&
      entry.receiptRef &&
      entry.receiptRef === transaction.receiptRef &&
      !samePaymentGroup(entry, transaction),
  );
  if (!transaction.receiptRef || duplicate) {
    transaction.receiptRef = nextReceiptReference(transaction.date || transaction.forMonth || localDateInput(), transaction.id);
  }
  return transaction.receiptRef;
}

function ensureAllReceiptReferences() {
  let changed = false;
  state.transactions.filter(isReceiptablePayment).forEach((transaction) => {
    const before = transaction.receiptRef;
    ensureReceiptReference(transaction);
    if (transaction.receiptRef !== before) changed = true;
  });
  return changed;
}

function getLastReceiptablePayment() {
  return state.transactions
    .filter(isReceiptablePayment)
    .slice()
    .sort(
      (a, b) =>
        transactionDateValue(b).localeCompare(transactionDateValue(a)) ||
        Number(b.sourceRow || 0) - Number(a.sourceRow || 0) ||
        String(b.id).localeCompare(String(a.id)),
    )[0];
}

function formatCoveredMonths(entries) {
  const months = entries.map((entry) => entry.forMonth).filter(Boolean).sort();
  if (!months.length) return "";
  if (months.length === 1) return formatMonth(months[0]);
  return `${formatMonth(months[0])} - ${formatMonth(months.at(-1))}`;
}

function printLastReceipt() {
  const transaction = getLastReceiptablePayment();
  if (!transaction) {
    showToast("No tenant payment receipt found");
    return;
  }
  void sharePaymentReceiptPdf(transaction.id);
}

function getPaymentReceiptData(transactionId) {
  const transaction = state.transactions.find((entry) => entry.id === transactionId);
  if (!transaction || !isReceiptablePayment(transaction)) {
    showToast("Receipt is available for tenant payments only");
    return null;
  }

  const tenant = state.tenants.find((entry) => entry.id === transaction.tenantId);
  if (!tenant) {
    showToast("Tenant not found");
    return null;
  }

  const isProject = isProjectPayment(transaction);
  const receiptNo = ensureReceiptReference(transaction);
  const receiptEntries = isProject
    ? [transaction]
    : state.transactions
        .filter(
          (entry) =>
            isMonthlyPayment(entry) &&
            entry.tenantId === transaction.tenantId &&
            entry.receiptRef === receiptNo &&
            (samePaymentGroup(entry, transaction) || entry.id === transaction.id),
        )
        .sort((a, b) => String(a.forMonth || "").localeCompare(String(b.forMonth || "")));
  const amount = receiptEntries.reduce((sum, entry) => sum + transactionNetUsd(entry), 0);
  const advanceAmount = isProject
    ? 0
    : receiptEntries.filter((entry) => isFutureMonth(entry.forMonth)).reduce((sum, entry) => sum + transactionNetUsd(entry), 0);
  saveState();
  return { transaction, tenant, isProject, receiptNo, receiptEntries, amount, advanceAmount };
}

function receiptSummaryRows(data) {
  return data.isProject
    ? [
        ["Received From", data.tenant.name],
        ["Payment For", "Project Payment"],
        ["Project", data.transaction.project],
        ["Amount Received", formatUsd(data.amount)],
      ]
    : [
        ["Received From", data.tenant.name],
        ["Months Covered", formatCoveredMonths(data.receiptEntries)],
        ["Amount Received", formatUsd(data.amount)],
        ["Advance Liability", formatUsd(data.advanceAmount)],
      ];
}

function receiptTableRows(data) {
  if (data.isProject) {
    return [
      ["Payment Type", "Project Payment"],
      ["Payment Date", data.transaction.date || ""],
      ["Project", data.transaction.project || ""],
      ["Amount", formatUsd(data.amount)],
      ["Monthly Fee Impact", "Not attributed to monthly dues"],
    ];
  }

  return data.receiptEntries.map((entry) => {
    const status = paymentStatus(data.tenant.id, entry.forMonth);
    return [
      formatMonth(entry.forMonth),
      formatUsd(transactionNetUsd(entry)),
      formatUsd(status.expected),
      formatUsd(status.paid),
      status.label,
    ];
  });
}

function printPaymentReceipt(transactionId) {
  const data = getPaymentReceiptData(transactionId);
  if (!data) return;

  const page = document.createElement("article");
  page.className = "print-page receipt-page";

  const header = document.createElement("header");
  header.className = "print-header";

  const titleBlock = document.createElement("div");
  const building = document.createElement("p");
  building.textContent = state.building.name;
  const title = document.createElement("h1");
  title.textContent = "Payment Receipt";
  const tenantLine = document.createElement("p");
  tenantLine.textContent = `${data.tenant.name} | Unit ${data.tenant.unit}`;
  titleBlock.append(building, title, tenantLine);

  const meta = document.createElement("div");
  meta.className = "print-meta";
  const receipt = document.createElement("span");
  receipt.textContent = `Receipt: ${data.receiptNo}`;
  const generated = document.createElement("span");
  generated.textContent = `Date: ${data.transaction.date || localDateInput()}`;
  const version = document.createElement("span");
  version.textContent = `App: ${APP_VERSION}`;
  meta.append(receipt, generated, version);
  header.append(titleBlock, meta);

  const summary = document.createElement("section");
  summary.className = "print-summary receipt-summary";
  receiptSummaryRows(data).forEach(([label, value]) => {
    const item = document.createElement("div");
    const itemLabel = document.createElement("span");
    itemLabel.textContent = label;
    const itemValue = document.createElement("strong");
    itemValue.textContent = value;
    item.append(itemLabel, itemValue);
    summary.append(item);
  });

  const table = document.createElement("table");
  table.className = "print-table";
  if (data.isProject) {
    const tbody = document.createElement("tbody");
    receiptTableRows(data).forEach(([label, value]) => {
      const row = document.createElement("tr");
      appendHeaderCell(row, label);
      appendCell(row, value);
      tbody.append(row);
    });
    table.append(tbody);
  } else {
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    ["Month", "Applied USD", "Expected USD", "Paid For Month", "Status"].forEach((heading, index) =>
      appendHeaderCell(headerRow, heading, index > 0 && index < 4 ? "numeric" : ""),
    );
    thead.append(headerRow);
    const tbody = document.createElement("tbody");
    data.receiptEntries.forEach((entry) => {
      const status = paymentStatus(data.tenant.id, entry.forMonth);
      const row = document.createElement("tr");
      appendCell(row, formatMonth(entry.forMonth));
      appendCell(row, formatUsd(transactionNetUsd(entry)), "numeric");
      appendCell(row, formatUsd(status.expected), "numeric");
      appendCell(row, formatUsd(status.paid), "numeric");
      appendCell(row, status.label);
      tbody.append(row);
    });
    table.append(thead, tbody);
  }

  const note = document.createElement("p");
  note.className = "print-note";
  note.textContent = data.isProject
    ? "Project payments are separate from monthly building fees."
    : "Any amount allocated to future months is treated as advance liability until that month is reached.";

  page.append(header, summary, table, note);
  printPreparedPage(page);
}

const PDF_MIME = "application/pdf";

function pdfSafeText(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function pdfEscape(value) {
  return pdfSafeText(value).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function pdfClip(value, length = 94) {
  const text = pdfSafeText(value);
  return text.length > length ? `${text.slice(0, Math.max(0, length - 3))}...` : text;
}

function paymentReceiptPdfLines(data) {
  const lines = [
    { text: state.building.name, size: 11 },
    { text: "Payment Receipt", size: 20, bold: true },
    { text: `Receipt: ${data.receiptNo}`, size: 11 },
    { text: `Date: ${data.transaction.date || localDateInput()}`, size: 11 },
    { text: `Tenant: ${data.tenant.name} | Unit ${data.tenant.unit}`, size: 11 },
    { text: `App: ${APP_VERSION}`, size: 9 },
    { text: " ", size: 6 },
    { text: "Summary", size: 13, bold: true },
    ...receiptSummaryRows(data).map(([label, value]) => ({ text: `${label}: ${value}`, size: 11 })),
    { text: " ", size: 6 },
  ];

  if (data.isProject) {
    lines.push(
      { text: "Project Payment Details", size: 13, bold: true },
      ...receiptTableRows(data).map(([label, value]) => ({ text: `${label}: ${value}`, size: 11 })),
      { text: "Project payments are separate from monthly building fees.", size: 10 },
    );
  } else {
    lines.push(
      { text: "Monthly Allocation", size: 13, bold: true },
      { text: "Month | Applied USD | Expected USD | Paid For Month | Status", size: 9, bold: true },
      ...receiptTableRows(data).map((row) => ({ text: row.join(" | "), size: 9 })),
      { text: "Any amount allocated to future months is treated as advance liability until that month is reached.", size: 10 },
    );
  }

  return lines.map((line) => ({ ...line, text: pdfClip(line.text, line.size <= 9 ? 118 : 94) }));
}

function buildSimplePdf(lines) {
  const lineCommands = [];
  let y = 800;
  lines.forEach((line) => {
    const size = line.size || 11;
    const font = line.bold ? "F2" : "F1";
    lineCommands.push(`BT /${font} ${size} Tf 50 ${y} Td (${pdfEscape(line.text)}) Tj ET`);
    y -= size + 6;
  });
  const content = `${lineCommands.join("\n")}\n`;
  return buildPdfDocument(content);
}

function buildPdfDocument(content) {
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
    `<< /Length ${content.length} >>\nstream\n${content}endstream`,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return new Blob([pdf], { type: PDF_MIME });
}

function pdfTextCommand(text, x, y, size = 10, bold = false) {
  return `BT /${bold ? "F2" : "F1"} ${size} Tf ${x} ${y} Td (${pdfEscape(text)}) Tj ET`;
}

function pdfRectCommand(x, y, width, height) {
  return `${x} ${y} ${width} ${height} re S`;
}

function pdfLineCommand(x1, y1, x2, y2) {
  return `${x1} ${y1} m ${x2} ${y2} l S`;
}

function buildReceiptLayoutPdf(data) {
  const commands = ["0.2 w"];
  const left = 50;
  const right = 545;
  let y = 800;

  commands.push(pdfTextCommand(state.building.name, left, y, 11));
  commands.push(pdfTextCommand("Payment Receipt", left, y - 28, 20, true));
  commands.push(pdfTextCommand(`${data.tenant.name} | Unit ${data.tenant.unit}`, left, y - 48, 11));
  commands.push(pdfTextCommand(`Receipt: ${data.receiptNo}`, 380, y, 10));
  commands.push(pdfTextCommand(`Date: ${data.transaction.date || localDateInput()}`, 380, y - 16, 10));
  commands.push(pdfTextCommand(`App: ${APP_VERSION}`, 380, y - 32, 9));
  commands.push(pdfLineCommand(left, y - 64, right, y - 64));

  y -= 120;
  const summaryRows = receiptSummaryRows(data);
  const boxWidth = 238;
  const boxHeight = 44;
  summaryRows.forEach(([label, value], index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);
    const x = left + column * (boxWidth + 18);
    const boxY = y - row * (boxHeight + 8);
    commands.push(pdfRectCommand(x, boxY, boxWidth, boxHeight));
    commands.push(pdfTextCommand(label, x + 8, boxY + 26, 8));
    commands.push(pdfTextCommand(pdfClip(value, 42), x + 8, boxY + 10, 12, true));
  });

  y -= Math.ceil(summaryRows.length / 2) * (boxHeight + 8) + 18;
  commands.push(pdfTextCommand(data.isProject ? "Project Payment Details" : "Monthly Allocation", left, y, 13, true));
  y -= 20;

  if (data.isProject) {
    const rows = receiptTableRows(data);
    const labelWidth = 160;
    const valueWidth = 335;
    rows.forEach(([label, value]) => {
      commands.push(pdfRectCommand(left, y - 16, labelWidth, 22));
      commands.push(pdfRectCommand(left + labelWidth, y - 16, valueWidth, 22));
      commands.push(pdfTextCommand(label, left + 7, y - 4, 9, true));
      commands.push(pdfTextCommand(pdfClip(value, 62), left + labelWidth + 7, y - 4, 9));
      y -= 22;
    });
  } else {
    const headers = ["Month", "Applied USD", "Expected USD", "Paid For Month", "Status"];
    const widths = [92, 92, 92, 104, 115];
    const rows = receiptTableRows(data);
    let x = left;
    headers.forEach((heading, index) => {
      commands.push(pdfRectCommand(x, y - 16, widths[index], 22));
      commands.push(pdfTextCommand(heading, x + 5, y - 4, 8, true));
      x += widths[index];
    });
    y -= 22;
    rows.slice(0, 22).forEach((row) => {
      x = left;
      row.forEach((value, index) => {
        commands.push(pdfRectCommand(x, y - 16, widths[index], 22));
        commands.push(pdfTextCommand(pdfClip(value, index === 4 ? 18 : 14), x + 5, y - 4, 8));
        x += widths[index];
      });
      y -= 22;
    });
  }

  y -= 18;
  commands.push(
    pdfTextCommand(
      data.isProject
        ? "Project payments are separate from monthly building fees."
        : "Any amount allocated to future months is treated as advance liability until that month is reached.",
      left,
      Math.max(52, y),
      9,
    ),
  );

  return buildPdfDocument(`${commands.join("\n")}\n`);
}

function receiptPdfFileName(data) {
  const tenant = safeFilePart(data.tenant.name, "tenant");
  return `${data.receiptNo}_${tenant}.pdf`;
}

function buildPaymentReceiptPdf(data) {
  return buildReceiptLayoutPdf(data);
}

function buildTenantStatementPdf(tenantId) {
  const tenant = state.tenants.find((entry) => entry.id === tenantId);
  if (!tenant) return null;

  const months = getMonths();
  const rows = months.map((month) => {
    const status = paymentStatus(tenant.id, month);
    const receipts = state.transactions
      .filter((tx) => isMonthlyPayment(tx) && tx.tenantId === tenant.id && tx.forMonth === month)
      .sort((a, b) => transactionDateValue(a).localeCompare(transactionDateValue(b)) || String(a.id).localeCompare(String(b.id)))
      .map((tx) => tx.receiptRef)
      .filter(Boolean);
    return {
      month,
      expected: status.expected,
      paid: status.paid,
      due: Math.max(0, status.expected - status.paid),
      status: status.label,
      receipts,
    };
  });
  const totals = rows.reduce(
    (acc, row) => { acc.expected += row.expected; acc.paid += row.paid; acc.due += row.due; return acc; },
    { expected: 0, paid: 0, due: 0 },
  );
  const tenantTotals = getTenantTotals(tenant.id);
  const projectRows = state.transactions
    .filter((tx) => isProjectPayment(tx) && tx.tenantId === tenant.id)
    .slice()
    .sort((a, b) => transactionDateValue(a).localeCompare(transactionDateValue(b)) || String(a.id).localeCompare(String(b.id)));
  const projectTotal = projectRows.reduce((sum, tx) => sum + transactionNetUsd(tx), 0);

  const commands = ["0.2 w"];
  const left = 50;
  const right = 545;
  let y = 800;

  // Header
  commands.push(pdfTextCommand(state.building.name, left, y, 11));
  commands.push(pdfTextCommand("Tenant Account Statement", left, y - 28, 18, true));
  commands.push(pdfTextCommand(`${tenant.name} | Unit ${tenant.unit}`, left, y - 48, 11));
  commands.push(pdfTextCommand(`Date: ${localDateInput()}`, 380, y, 10));
  commands.push(pdfTextCommand(`App: ${APP_VERSION}`, 380, y - 16, 9));
  commands.push(pdfLineCommand(left, y - 64, right, y - 64));

  y -= 120;

  // Summary boxes (2 columns)
  const summaryItems = [
    ["Monthly Expected", formatMonthly(totals.expected)],
    ["Monthly Paid", formatMonthly(totals.paid)],
    ["Remaining Due", formatMonthly(totals.due)],
    ["Project Payments", formatUsd(projectTotal)],
    ["Advance Balance", formatUsd(tenantTotals.advanceUsd)],
  ];
  const boxWidth = 238;
  const boxHeight = 44;
  summaryItems.forEach(([label, value], index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);
    const bx = left + column * (boxWidth + 18);
    const by = y - row * (boxHeight + 8);
    commands.push(pdfRectCommand(bx, by, boxWidth, boxHeight));
    commands.push(pdfTextCommand(label, bx + 8, by + 26, 8));
    commands.push(pdfTextCommand(pdfClip(value, 42), bx + 8, by + 10, 12, true));
  });

  y -= Math.ceil(summaryItems.length / 2) * (boxHeight + 8) + 18;

  // Monthly Fees table
  commands.push(pdfTextCommand("Monthly Fees", left, y, 13, true));
  y -= 20;

  const monthCols = [
    { heading: "Month", width: 80 },
    { heading: "Expected USD", width: 80 },
    { heading: "Paid USD", width: 80 },
    { heading: "Due USD", width: 75 },
    { heading: "Status", width: 65 },
    { heading: "Receipts", width: 115 },
  ];

  let x = left;
  monthCols.forEach((col) => {
    commands.push(pdfRectCommand(x, y - 16, col.width, 22));
    commands.push(pdfTextCommand(col.heading, x + 5, y - 4, 8, true));
    x += col.width;
  });
  y -= 22;

  rows.forEach((entry) => {
    x = left;
    const cells = [
      formatMonth(entry.month),
      formatMonthly(entry.expected),
      formatMonthly(entry.paid),
      formatMonthly(entry.due),
      entry.status,
      entry.receipts.join(", "),
    ];
    monthCols.forEach((col, index) => {
      commands.push(pdfRectCommand(x, y - 16, col.width, 22));
      commands.push(pdfTextCommand(pdfClip(cells[index], Math.floor(col.width / 5.5)), x + 5, y - 4, 8));
      x += col.width;
    });
    y -= 22;
  });

  // Totals row
  x = left;
  const totalCells = ["Total", formatMonthly(totals.expected), formatMonthly(totals.paid), formatMonthly(totals.due), "", ""];
  monthCols.forEach((col, index) => {
    commands.push(pdfRectCommand(x, y - 16, col.width, 22));
    commands.push(pdfTextCommand(pdfClip(totalCells[index], Math.floor(col.width / 5.5)), x + 5, y - 4, 8, index === 0));
    x += col.width;
  });
  y -= 22;

  // Project payments table
  if (projectRows.length) {
    y -= 18;
    commands.push(pdfTextCommand("Project Payments", left, y, 13, true));
    y -= 20;

    const projCols = [
      { heading: "Date", width: 70 },
      { heading: "Project", width: 200 },
      { heading: "Amount USD", width: 90 },
      { heading: "Receipt", width: 135 },
    ];

    x = left;
    projCols.forEach((col) => {
      commands.push(pdfRectCommand(x, y - 16, col.width, 22));
      commands.push(pdfTextCommand(col.heading, x + 5, y - 4, 8, true));
      x += col.width;
    });
    y -= 22;

    projectRows.forEach((tx) => {
      x = left;
      const cells = [tx.date || "", tx.project || "", formatUsd(transactionNetUsd(tx)), tx.receiptRef || ""];
      projCols.forEach((col, index) => {
        commands.push(pdfRectCommand(x, y - 16, col.width, 22));
        commands.push(pdfTextCommand(pdfClip(cells[index], Math.floor(col.width / 5.5)), x + 5, y - 4, 8));
        x += col.width;
      });
      y -= 22;
    });
  }

  commands.push(pdfTextCommand(
    "Monthly dues and project payments are separated. Project payments are not applied to monthly fees.",
    left,
    Math.max(52, y - 18),
    9,
  ));

  return buildPdfDocument(`${commands.join("\n")}\n`);
}

async function shareTenantStatementPdf(tenantId) {
  const tenant = state.tenants.find((entry) => entry.id === tenantId);
  if (!tenant) { showToast("Tenant not found"); return; }

  if (ensureAllReceiptReferences()) saveState();

  const pdf = buildTenantStatementPdf(tenantId);
  if (!pdf) { showToast("Could not generate statement"); return; }

  const fileName = `Statement_${safeFilePart(tenant.name)}_${localDateInput()}.pdf`;

  try {
    if (typeof navigator.share === "function" && typeof File === "function") {
      const file = new File([pdf], fileName, { type: PDF_MIME });
      const sharePayload = {
        title: `${tenant.name} Statement`,
        text: `Account statement for ${tenant.name}`,
        files: [file],
      };
      if (typeof navigator.canShare !== "function" || navigator.canShare({ files: [file] })) {
        await navigator.share(sharePayload);
        showToast("Statement PDF shared");
        return;
      }
    }
  } catch (error) {
    if (error?.name === "AbortError") { showToast("Sharing cancelled"); return; }
  }

  downloadBlob(pdf, PDF_MIME, fileName);
  showToast("Statement PDF downloaded");
}

async function sharePaymentReceiptPdf(transactionId) {
  const data = getPaymentReceiptData(transactionId);
  if (!data) return;

  const fileName = receiptPdfFileName(data);
  const pdf = buildPaymentReceiptPdf(data);
  try {
    if (typeof navigator.share === "function" && typeof File === "function") {
      const file = new File([pdf], fileName, { type: PDF_MIME });
      const sharePayload = {
        title: `Receipt ${data.receiptNo}`,
        text: `Payment receipt ${data.receiptNo}`,
        files: [file],
      };
      if (typeof navigator.canShare !== "function" || navigator.canShare({ files: [file] })) {
        await navigator.share(sharePayload);
        showToast("Receipt PDF shared");
        return;
      }
    }
  } catch (error) {
    if (error?.name === "AbortError") {
      showToast("Sharing cancelled");
      return;
    }
  }

  downloadBlob(pdf, PDF_MIME, fileName);
  showToast("Receipt PDF downloaded");
}

function schedulePrintCleanup(delay = 1800) {
  window.clearTimeout(printCleanupTimer);
  printCleanupTimer = window.setTimeout(() => {
    els.printStatement.setAttribute("aria-hidden", "true");
    document.body.classList.remove("is-printing");
  }, delay);
}

function printPreparedPage(page) {
  window.clearTimeout(printCleanupTimer);
  els.printStatement.replaceChildren(page);
  els.printStatement.setAttribute("aria-hidden", "false");
  document.body.classList.add("is-printing");

  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      window.setTimeout(() => window.print(), 150);
    });
  });
}

function renderLedgerFilters() {
  const current = els.categoryFilter.value || "All";
  els.categoryFilter.replaceChildren(
    ...["All", ...state.categories].map((category) => {
      const option = document.createElement("option");
      option.value = category;
      option.textContent = category;
      option.selected = category === current;
      return option;
    }),
  );

  const isExpenses = els.categoryFilter.value === "Expenses";
  els.expenseCategoryFilter.classList.toggle("hidden", !isExpenses);
  if (isExpenses) {
    const currentExpCat = els.expenseCategoryFilter.value || "All";
    const expCats = state.expenseCategories.slice().sort((a, b) => a.name.localeCompare(b.name));
    els.expenseCategoryFilter.replaceChildren(
      ...["All", ...expCats.map((c) => c.name)].map((cat) => {
        const option = document.createElement("option");
        option.value = cat;
        option.textContent = cat === "All" ? "All Categories" : cat;
        option.selected = cat === currentExpCat;
        return option;
      }),
    );
  }
}

function getFilteredLedgerRows() {
  const category = els.categoryFilter.value;
  const expenseCat = category === "Expenses" ? (els.expenseCategoryFilter.value || "All") : "All";
  const query = els.ledgerSearch.value.trim().toLowerCase();
  const dateFrom = els.ledgerDateFrom.value; // "YYYY-MM-DD" or ""
  const dateTo = els.ledgerDateTo.value;     // "YYYY-MM-DD" or ""
  return state.transactions
    .filter((transaction) => category === "All" || transaction.category === category)
    .filter((transaction) => {
      if (expenseCat === "All") return true;
      return (transaction.expenseCategory || "") === expenseCat;
    })
    .filter((transaction) => {
      if (!query) return true;
      return [
        transaction.category,
        transaction.description,
        tenantName(transaction.tenantId),
        transaction.supplier,
        transaction.invoice,
        transaction.project,
        transaction.receiptRef,
        transaction.invoiceAttachment?.fileName,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    })
    .filter((transaction) => {
      const txDate = transaction.date || transaction.forMonth || "";
      if (dateFrom && txDate < dateFrom) return false;
      if (dateTo && txDate > dateTo) return false;
      return true;
    })
    .sort((a, b) => {
      const da = a.date || a.forMonth || "1900-01-01";
      const db = b.date || b.forMonth || "1900-01-01";
      if (db !== da) return db.localeCompare(da);
      // Same date: use the numeric part of the ID as a tie-breaker (higher = newer)
      const numA = Number(String(a.id).replace(/\D/g, "")) || Number(a.sourceRow || 0);
      const numB = Number(String(b.id).replace(/\D/g, "")) || Number(b.sourceRow || 0);
      return numB - numA;
    });
}

function isAnyLedgerFilterActive() {
  return (
    (els.categoryFilter.value && els.categoryFilter.value !== "All") ||
    els.ledgerSearch.value.trim() !== "" ||
    els.ledgerDateFrom.value !== "" ||
    els.ledgerDateTo.value !== ""
  );
}

function clearAllLedgerFilters() {
  els.categoryFilter.value = "All";
  els.expenseCategoryFilter.value = "";
  els.ledgerSearch.value = "";
  els.ledgerDateFrom.value = "";
  els.ledgerDateTo.value = "";
  renderLedger();
}

function renderLedger() {
  renderLedgerFilters();
  const rows = getFilteredLedgerRows();
  const total = state.transactions.length;

  const anyActive = isAnyLedgerFilterActive();
  els.ledgerFilterStatus.classList.toggle("hidden", !anyActive);
  if (anyActive) {
    els.ledgerCount.textContent = `Showing ${rows.length} of ${total} transactions`;
  }

  if (!rows.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "No matching transactions";
    els.ledgerList.replaceChildren(empty);
    return;
  }

  function buildLedgerItem(transaction) {
    const amountValue = transactionNetUsd(transaction);
    const item = document.createElement("article");
    item.className = `ledger-item ${transaction.category === "Expenses" ? "ledger-expense" : "ledger-payment"}`;
    const dateStr = transaction.date || (transaction.forMonth ? transaction.forMonth.slice(0, 10) : "");
    const receiptReference = isReceiptablePayment(transaction) ? transaction.receiptRef : "";
    item.innerHTML = `
      <div class="ledger-card-top">
        <span class="ledger-date-label"></span>
        <div class="ledger-action-group"></div>
      </div>
      <div class="ledger-card-body">
        <div class="ledger-text">
          <strong></strong>
          <span class="ledger-subtitle"></span>
          <div class="ledger-expand"></div>
        </div>
        <div class="ledger-amount"></div>
      </div>
    `;
    item.querySelector(".ledger-date-label").textContent = dateStr ? formatDateLabel(dateStr) : "";
    const title = transaction.tenantId ? tenantName(transaction.tenantId) : transaction.description;
    item.querySelector("strong").textContent = title || transaction.category;
    item.querySelector(".ledger-subtitle").textContent = [
      transaction.category,
      transaction.expenseCategory || "",
      transaction.forMonth ? `Month: ${formatMonth(transaction.forMonth)}` : "",
    ].filter(Boolean).join(" · ");

    const detailItems = [
      transaction.supplier ? `Supplier: ${transaction.supplier}` : "",
      transaction.project ? `Project: ${transaction.project}` : "",
      transaction.invoice ? `Invoice: ${transaction.invoice}` : "",
      receiptReference ? `Receipt: ${receiptReference}` : "",
      transaction.invoiceAttachment?.fileName ? `Attachment: ${transaction.invoiceAttachment.fileName}` : "",
    ].filter(Boolean);
    const expand = item.querySelector(".ledger-expand");
    if (detailItems.length) {
      detailItems.forEach((text) => {
        const p = document.createElement("p");
        p.textContent = text;
        expand.append(p);
      });
    } else {
      expand.remove();
    }

    const amount = item.querySelector(".ledger-amount");
    amount.textContent = formatUsd(amountValue);
    amount.classList.toggle("positive", amountValue >= 0);
    amount.classList.toggle("negative", amountValue < 0);

    const actionGroup = item.querySelector(".ledger-action-group");
    if (isReceiptablePayment(transaction)) {
      const btn = document.createElement("button");
      btn.className = "ledger-action-btn receipt-button";
      btn.type = "button";
      btn.dataset.transactionId = transaction.id;
      btn.textContent = "Receipt";
      actionGroup.append(btn);
    }
    if (transaction.category === "Expenses") {
      const btn = document.createElement("button");
      btn.className = "ledger-action-btn edit-expense-button";
      btn.type = "button";
      btn.dataset.transactionId = transaction.id;
      btn.textContent = "Edit";
      actionGroup.append(btn);
    }
    if (transaction.invoiceAttachment?.driveUrl) {
      const link = document.createElement("a");
      link.className = "ledger-action-btn attachment-button";
      link.href = transaction.invoiceAttachment.driveUrl;
      link.target = "_blank";
      link.rel = "noopener";
      link.textContent = "Invoice";
      actionGroup.append(link);
    }
    const delBtn = document.createElement("button");
    delBtn.className = "ledger-action-btn delete-transaction-button danger-action";
    delBtn.type = "button";
    delBtn.dataset.transactionId = transaction.id;
    delBtn.textContent = "Delete";
    actionGroup.append(delBtn);
    return item;
  }

  els.ledgerList.replaceChildren(...rows.slice(0, 160).map(buildLedgerItem));
}

function renderDatalists() {
  const suppliers = state.suppliers.slice().sort((a, b) => a.name.localeCompare(b.name));
  els.supplierList.replaceChildren(
    ...suppliers.map((supplier) => {
      const option = document.createElement("option");
      option.value = supplier.name;
      return option;
    }),
  );
  renderSupplierDropdown();
  renderProjectDropdown();
  renderExpenseCategoryDropdown();
}

function supplierOptions() {
  return state.suppliers.slice().sort((a, b) => a.name.localeCompare(b.name));
}

function renderSupplierDropdown() {
  const query = els.transactionSupplier.value.trim().toLowerCase();
  const suppliers = supplierOptions().filter((supplier) => !query || supplier.name.toLowerCase().includes(query));
  if (!supplierOptions().length) {
    const empty = document.createElement("div");
    empty.className = "supplier-dropdown-empty";
    empty.textContent = "No suppliers saved yet";
    els.supplierDropdown.replaceChildren(empty);
    els.supplierDropdownButton.disabled = true;
    return;
  }

  els.supplierDropdownButton.disabled = false;
  if (!suppliers.length) {
    const empty = document.createElement("div");
    empty.className = "supplier-dropdown-empty";
    empty.textContent = "No matching suppliers";
    els.supplierDropdown.replaceChildren(empty);
    return;
  }

  els.supplierDropdown.replaceChildren(
    ...suppliers.map((supplier) => {
      const button = document.createElement("button");
      button.type = "button";
      button.role = "option";
      button.textContent = supplier.name;
      button.dataset.supplier = supplier.name;
      return button;
    }),
  );
}

function setSupplierDropdownOpen(isOpen) {
  renderSupplierDropdown();
  if (els.supplierDropdownButton.disabled) isOpen = false;
  els.supplierDropdown.classList.toggle("hidden", !isOpen);
  els.transactionSupplier.setAttribute("aria-expanded", String(isOpen));
}

function selectSupplier(name) {
  els.transactionSupplier.value = name;
  setSupplierDropdownOpen(false);
  els.transactionSupplier.focus();
}

function projectOptions() {
  return state.projects.slice().sort((a, b) => a.name.localeCompare(b.name));
}

function renderProjectDropdown() {
  const query = els.transactionProject.value.trim().toLowerCase();
  const projects = projectOptions().filter((p) => !query || p.name.toLowerCase().includes(query));
  if (!projectOptions().length) {
    const empty = document.createElement("div");
    empty.className = "supplier-dropdown-empty";
    empty.textContent = "No projects saved yet";
    els.projectDropdown.replaceChildren(empty);
    els.projectDropdownButton.disabled = true;
    return;
  }
  els.projectDropdownButton.disabled = false;
  if (!projects.length) {
    const empty = document.createElement("div");
    empty.className = "supplier-dropdown-empty";
    empty.textContent = "No matching projects";
    els.projectDropdown.replaceChildren(empty);
    return;
  }
  els.projectDropdown.replaceChildren(
    ...projects.map((project) => {
      const button = document.createElement("button");
      button.type = "button";
      button.role = "option";
      button.textContent = project.name;
      button.dataset.project = project.name;
      return button;
    }),
  );
}

function setProjectDropdownOpen(isOpen) {
  renderProjectDropdown();
  if (els.projectDropdownButton.disabled) isOpen = false;
  els.projectDropdown.classList.toggle("hidden", !isOpen);
  els.transactionProject.setAttribute("aria-expanded", String(isOpen));
}

function selectProject(name) {
  els.transactionProject.value = name;
  setProjectDropdownOpen(false);
  els.transactionProject.focus();
  syncTransactionFormMode();
}

function expenseCategoryOptions() {
  return state.expenseCategories.slice().sort((a, b) => a.name.localeCompare(b.name));
}

function renderExpenseCategoryDropdown() {
  const query = els.transactionExpenseCategory.value.trim().toLowerCase();
  const categories = expenseCategoryOptions().filter((c) => !query || c.name.toLowerCase().includes(query));
  if (!expenseCategoryOptions().length) {
    const empty = document.createElement("div");
    empty.className = "supplier-dropdown-empty";
    empty.textContent = "No categories saved yet";
    els.expenseCategoryDropdown.replaceChildren(empty);
    els.expenseCategoryDropdownButton.disabled = true;
    return;
  }
  els.expenseCategoryDropdownButton.disabled = false;
  if (!categories.length) {
    const empty = document.createElement("div");
    empty.className = "supplier-dropdown-empty";
    empty.textContent = "No matching categories";
    els.expenseCategoryDropdown.replaceChildren(empty);
    return;
  }
  els.expenseCategoryDropdown.replaceChildren(
    ...categories.map((cat) => {
      const button = document.createElement("button");
      button.type = "button";
      button.role = "option";
      button.textContent = cat.name;
      button.dataset.expenseCategory = cat.name;
      return button;
    }),
  );
}

function setExpenseCategoryDropdownOpen(isOpen) {
  renderExpenseCategoryDropdown();
  if (els.expenseCategoryDropdownButton.disabled) isOpen = false;
  els.expenseCategoryDropdown.classList.toggle("hidden", !isOpen);
  els.transactionExpenseCategory.setAttribute("aria-expanded", String(isOpen));
}

function selectExpenseCategory(name) {
  els.transactionExpenseCategory.value = name;
  setExpenseCategoryDropdownOpen(false);
  els.transactionExpenseCategory.focus();
}

function renderSettings() {
  els.buildingNameInput.value = state.building.name;
  els.defaultDueInput.value = amountInputValue(state.settings.defaultDueUsd);
  els.conversionRateInput.value = Number(state.settings.lbpPerUsd || DEFAULT_LBP_PER_USD);
  els.invoiceUploadUrlInput.value = state.settings.invoiceUploadUrl || "";
  els.cloudSpreadsheetIdInput.value = state.settings.cloudSpreadsheetId || "";
  els.invoiceUploadFolderIdInput.value = state.settings.invoiceUploadFolderId || "";
  renderCloudStatus();
}

function renderAll() {
  renderDashboard();
  renderPayments();
  renderTenants();
  renderLedger();
  renderDatalists();
  renderSettings();
}

function setView(viewId) {
  els.views.forEach((view) => view.classList.toggle("active", view.id === viewId));
  els.navButtons.forEach((button) => button.classList.toggle("active", button.dataset.view === viewId));
}

function openDialog(dialog) {
  if (typeof dialog.showModal === "function") dialog.showModal();
  else dialog.setAttribute("open", "");
}

function closeDialog(dialog) {
  if (typeof dialog.close === "function") dialog.close();
  else dialog.removeAttribute("open");
}

function populateTenantSelect() {
  els.transactionTenant.replaceChildren(
    ...state.tenants.map((tenant) => {
      const option = document.createElement("option");
      option.value = tenant.id;
      option.textContent = tenant.name;
      return option;
    }),
  );
}

function expenseInvoiceSequenceNumber(value) {
  const match = String(value || "").trim().match(/(\d+)$/);
  return match ? Number(match[1]) : 0;
}

function nextExpenseInvoiceNumber(excludeTransactionId = null) {
  const highest = state.transactions
    .filter((transaction) => transaction.category === "Expenses" && transaction.id !== excludeTransactionId)
    .reduce((max, transaction) => Math.max(max, expenseInvoiceSequenceNumber(transaction.invoice)), 0);
  return `${EXPENSE_INVOICE_PREFIX}${String(highest + 1).padStart(4, "0")}`;
}

function maybeSetNextExpenseInvoiceNumber() {
  if (editingExpenseId || els.transactionCategory.value !== "Expenses" || els.transactionInvoice.value.trim()) return;
  els.transactionInvoice.value = nextExpenseInvoiceNumber();
}

function syncTransactionFormMode() {
  const category = els.transactionCategory.value;
  const project = els.transactionProject.value.trim();
  const tenantMode = category === "Payments" || category === "Advance Payments";
  const monthlyPaymentMode = category === "Payments" && !project;
  const expenseMode = category === "Expenses";
  document.querySelector(".tenant-field").classList.toggle("hidden", !tenantMode);
  document.querySelector(".direction-field").classList.toggle("hidden", category !== "Advance Payments");
  document.querySelector(".description-field").classList.toggle("hidden", tenantMode);
  document.querySelector(".month-field").classList.toggle("hidden", !monthlyPaymentMode);
  document.querySelector(".lbp-amount-field").classList.toggle("hidden", !expenseMode);
  document.querySelector(".amount-row").classList.toggle("monthly-usd-only", !expenseMode);
  document.querySelector(".extra-fields").classList.toggle("hidden", !expenseMode);
  document.querySelector(".expense-category-field").classList.toggle("hidden", !expenseMode);
  document.querySelector(".invoice-file-field").classList.toggle("hidden", !expenseMode);
  els.expenseConversionPreview.classList.toggle("hidden", !expenseMode);
  els.invoiceAttachmentStatus.classList.toggle("hidden", !expenseMode || !editingExpenseId);
  els.transactionDescription.required = !tenantMode;
  els.transactionMonth.required = monthlyPaymentMode;
  maybeSetNextExpenseInvoiceNumber();
  updateExpenseConversionPreview();
}

function updateExpenseConversionPreview() {
  if (els.transactionCategory.value !== "Expenses") return;
  const lbp = Number(els.transactionLbp.value || 0);
  const usd = Number(els.transactionUsd.value || 0);
  const rate = getConversionRate();
  const converted = toUsd(usd, lbp);
  els.expenseConversionPreview.textContent =
    `${formatLbp(lbp)} + ${formatUsd(usd)} = ${formatUsd(converted)} balance impact at ${numberFormat.format(rate)} LBP/USD`;
}

function applyTransactionCategoryDefaults() {
  const category = els.transactionCategory.value;
  els.transactionLbp.value = "";
  els.transactionUsd.value = category === "Payments" ? amountInputValue(state.settings.defaultDueUsd) : "";
  if (category !== "Expenses") {
    els.transactionSupplier.value = "";
    els.transactionInvoice.value = "";
  }
  syncTransactionFormMode();
}

function selectedInvoiceFile() {
  return els.transactionInvoiceCameraFile.files[0] || els.transactionInvoiceFile.files[0] || null;
}

function updateInvoiceFileSelectionStatus() {
  const file = selectedInvoiceFile();
  els.invoiceFileSelectionStatus.textContent = file ? file.name : "No photo selected";
}

function clearInvoiceFileSelection() {
  els.transactionInvoiceCameraFile.value = "";
  els.transactionInvoiceFile.value = "";
  updateInvoiceFileSelectionStatus();
}

function setInvoiceFileSource(source) {
  if (source === "camera") els.transactionInvoiceFile.value = "";
  else els.transactionInvoiceCameraFile.value = "";
  updateInvoiceFileSelectionStatus();
}

function addKnownValue(collection, name) {
  if (!name) return;
  if (collection.some((item) => item.name.toLowerCase() === name.toLowerCase())) return;
  collection.push({ id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""), name });
}

function allocateMonthlyPayment(amountUsd, startMonth) {
  const allocations = [];
  let remaining = roundUsd(amountUsd);
  let month = startMonth;
  let guard = 0;
  const fallbackExpected = roundUsd(getExpectedMonthlyUsd(startMonth));

  if (fallbackExpected <= 0) {
    throw new Error("Set the expected monthly amount USD for the selected month");
  }

  while (remaining > 0 && guard < 360) {
    const configuredExpected = roundUsd(getExpectedMonthlyUsd(month));
    const expected = configuredExpected > 0 ? configuredExpected : fallbackExpected;
    const amount = roundUsd(Math.min(remaining, expected));
    allocations.push({ month, amountUsd: amount, expectedUsd: expected });
    remaining = roundUsd(remaining - amount);
    month = addMonths(month, 1);
    guard += 1;
  }

  if (remaining > 0) throw new Error("Payment covers too many months");
  allocations.forEach((allocation) => {
    if (!hasConfiguredMonthlyExpected(allocation.month) && Number(state.settings.defaultDueUsd || 0) <= 0) {
      state.monthlyExpected.push({ month: allocation.month, expectedUsd: allocation.expectedUsd });
    }
  });
  state.monthlyExpected = normalizedMonthlyExpected(state.monthlyExpected);
  return allocations;
}

function createTransactionsFromForm() {
  const category = els.transactionCategory.value;
  const amountLbp = category === "Expenses" ? Number(els.transactionLbp.value || 0) : 0;
  const amountUsd = Number(els.transactionUsd.value || 0);
  if (!amountLbp && !amountUsd) throw new Error("Enter an amount");

  const tenantId = els.transactionTenant.value;
  const isDebit = category === "Expenses" || (category === "Advance Payments" && els.transactionDirection.value === "debit");
  const tenantMode = category === "Payments" || category === "Advance Payments";
  const description = tenantMode ? tenantName(tenantId) : els.transactionDescription.value.trim();
  if (!description) throw new Error("Enter a description");

  const project = els.transactionProject.value.trim();
  const supplier = els.transactionSupplier.value.trim();
  const expenseCategory = category === "Expenses" ? els.transactionExpenseCategory.value.trim() : "";
  addKnownValue(state.projects, project);
  addKnownValue(state.suppliers, supplier);
  if (expenseCategory) addKnownValue(state.expenseCategories, expenseCategory);

  const baseTransaction = {
    id: `tx-${Date.now()}`,
    category,
    description,
    tenantId: tenantMode ? tenantId : null,
    forMonth: category === "Payments" && !project ? monthIso(els.transactionMonth.value) : null,
    project,
    date: els.transactionDate.value,
    supplier,
    invoice: els.transactionInvoice.value.trim(),
    expenseCategory,
    debitUsd: isDebit ? amountUsd : 0,
    debitLbp: isDebit ? amountLbp : 0,
    creditUsd: isDebit ? 0 : amountUsd,
    creditLbp: isDebit ? 0 : amountLbp,
    balanceUsd: isDebit ? -amountUsd : amountUsd,
    balanceLbp: isDebit ? -amountLbp : amountLbp,
    invoiceAttachment: null,
    sourceRow: null,
  };

  if (category === "Payments" && !project) {
    const startMonth = monthIso(els.transactionMonth.value);
    if (!startMonth) throw new Error("Select the starting month");
    const receiptRef = nextReceiptReference(els.transactionDate.value || startMonth || localDateInput());
    const paymentGroupId = `pay-${Date.now()}`;
    return allocateMonthlyPayment(amountUsd, startMonth).map((allocation, index) => ({
      ...baseTransaction,
      id: `${paymentGroupId}-${String(index + 1).padStart(2, "0")}`,
      forMonth: allocation.month,
      creditUsd: allocation.amountUsd,
      balanceUsd: allocation.amountUsd,
      receiptRef,
      paymentGroupId,
    }));
  }

  return [baseTransaction];
}

function createTransactionFromForm() {
  return createTransactionsFromForm()[0];
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(reader.result));
    reader.addEventListener("error", () => reject(new Error("Could not read invoice picture")));
    reader.readAsDataURL(file);
  });
}

function loadImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", () => reject(new Error("Could not prepare invoice picture")));
    image.src = dataUrl;
  });
}

function safeFilePart(value, fallback = "invoice") {
  const cleaned = String(value || fallback)
    .trim()
    .replace(/[^a-z0-9._-]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return cleaned || fallback;
}

function invoiceFileName(transaction) {
  const invoice = safeFilePart(transaction.invoice || transaction.id, "invoice");
  const description = safeFilePart(transaction.description, "expense");
  return `${transaction.date || localDateInput()}_${invoice}_${description}.jpg`;
}

async function prepareInvoiceUpload(transaction, file) {
  if (!file.type.startsWith("image/")) throw new Error("Choose an invoice picture file");
  const source = await readFileAsDataUrl(file);
  const image = await loadImage(source);
  const scale = Math.min(1, INVOICE_IMAGE_MAX_EDGE / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext("2d");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const dataUrl = canvas.toDataURL("image/jpeg", INVOICE_IMAGE_QUALITY);
  const dataBase64 = dataUrl.split(",")[1] || "";
  const size = Math.round((dataBase64.length * 3) / 4);
  if (size > INVOICE_UPLOAD_MAX_BYTES) throw new Error("Invoice picture is too large after compression");
  return {
    dataBase64,
    fileName: invoiceFileName(transaction),
    mimeType: "image/jpeg",
    size,
  };
}

function invoiceUploadMetadata(transaction) {
  return {
    building: state.building.name,
    category: transaction.category,
    description: transaction.description,
    supplier: transaction.supplier,
    invoice: transaction.invoice,
    project: transaction.project,
    date: transaction.date,
    transactionId: transaction.id,
  };
}

function invoiceAttachmentFromResult(result, prepared) {
  return {
    fileName: result.fileName || prepared.fileName,
    mimeType: prepared.mimeType,
    size: prepared.size,
    driveFileId: result.fileId || "",
    driveUrl: result.fileUrl || "",
    uploadedAt: new Date().toISOString(),
  };
}

function canUseServerInvoiceUpload() {
  return window.location.protocol === "https:";
}

async function uploadInvoiceThroughServer(transaction, prepared, folderId) {
  const response = await fetch(SERVER_INVOICE_UPLOAD_PATH, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      folderId,
      fileName: prepared.fileName,
      mimeType: prepared.mimeType,
      dataBase64: prepared.dataBase64,
      metadata: invoiceUploadMetadata(transaction),
    }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.success) {
    throw new Error(result.error || "Invoice upload failed");
  }
  return invoiceAttachmentFromResult(result, prepared);
}

async function uploadInvoiceThroughScript(transaction, prepared, folderId) {
  const uploadUrl = state.settings.invoiceUploadUrl.trim();
  if (!uploadUrl || !folderId) {
    throw new Error("Set the Google Apps Script URL and Drive folder ID in Settings");
  }

  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({
      action: "uploadInvoice",
      folderId,
      fileName: prepared.fileName,
      mimeType: prepared.mimeType,
      dataBase64: prepared.dataBase64,
      metadata: invoiceUploadMetadata(transaction),
    }),
  });
  if (!response.ok) throw new Error("Invoice upload failed");
  const result = await response.json();
  if (!result.success) throw new Error(result.error || "Invoice upload failed");
  return invoiceAttachmentFromResult(result, prepared);
}

async function uploadExpenseInvoice(transaction, file) {
  const folderId = state.settings.invoiceUploadFolderId.trim();
  if (!folderId) {
    throw new Error("Set the Google Drive invoice folder ID in Settings");
  }

  const prepared = await prepareInvoiceUpload(transaction, file);
  if (canUseServerInvoiceUpload()) {
    return uploadInvoiceThroughServer(transaction, prepared, folderId);
  }
  return uploadInvoiceThroughScript(transaction, prepared, folderId);
}

function cloudConfig() {
  return {
    scriptUrl: String(state.settings.invoiceUploadUrl || "").trim(),
    spreadsheetId: String(state.settings.cloudSpreadsheetId || "").trim(),
  };
}

function hasCloudConfig() {
  const config = cloudConfig();
  return Boolean(config.scriptUrl && config.spreadsheetId);
}

function renderCloudStatus(message = "") {
  if (!els.cloudSyncStatus) return;
  els.cloudSyncStatus.textContent =
    message ||
    (hasCloudConfig()
      ? "Cloud sync is on. Changes save locally and sync automatically to the Google Sheet."
      : "Cloud sync is off until the script URL and Google Sheet ID are saved.");
}

async function postCloudAction(action, payload = {}) {
  const config = cloudConfig();
  if (!config.scriptUrl || !config.spreadsheetId) {
    throw new Error("Set the Google Apps Script URL and Google Sheet ID in Settings");
  }
  const response = await fetch(config.scriptUrl, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({
      action,
      spreadsheetId: config.spreadsheetId,
      ...payload,
    }),
  });
  if (!response.ok) throw new Error("Google Sheet sync failed");
  const result = await response.json();
  if (!result.success) throw new Error(result.error || "Google Sheet sync failed");
  return result;
}

function queueCloudSave() {
  if (!hasCloudConfig()) return;
  window.clearTimeout(cloudSaveTimer);
  cloudSaveTimer = window.setTimeout(() => saveCloudState({ silent: true }), 900);
}

async function saveCloudState({ silent = false } = {}) {
  if (cloudSaveInFlight) return;
  window.clearTimeout(cloudSaveTimer);
  cloudSaveInFlight = true;
  try {
    if (!silent) renderCloudStatus("Saving to Google Sheet...");
    await postCloudAction("saveState", { state });
    renderCloudStatus(`Google Sheet saved at ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`);
    if (!silent) showToast("Saved to Google Sheet");
  } catch (error) {
    renderCloudStatus(error.message);
    if (!silent) showToast(error.message);
  } finally {
    cloudSaveInFlight = false;
  }
}

async function loadCloudState() {
  try {
    renderCloudStatus("Loading from Google Sheet...");
    const result = await postCloudAction("loadState");
    if (!result.state) throw new Error("No app data found in Google Sheet");
    state = hydrateState(result.state);
    saveState({ sync: false });
    selectedMonth = null;
    renderAll();
    renderCloudStatus("Loaded from Google Sheet");
    showToast("Loaded from Google Sheet");
  } catch (error) {
    renderCloudStatus(error.message);
    showToast(error.message);
  }
}

async function zeroAccounts() {
  if (!window.confirm("Set all account balances to zero? This removes all transactions and monthly dues from this device and syncs the empty accounts to the Google Sheet.")) {
    return;
  }
  state.transactions = [];
  state.monthlyExpected = [];
  state.projects = [];
  state.suppliers = [];
  state.categories = DEFAULT_CATEGORIES.slice();
  state.settings.defaultDueUsd = 0;
  selectedMonth = null;
  saveState({ sync: false });
  renderAll();
  updateExpenseConversionPreview();
  if (hasCloudConfig()) {
    await saveCloudState();
    showToast("All accounts set to zero and synced");
  } else {
    showToast("All accounts set to zero");
  }
}

function resetTransactionForm() {
  editingExpenseId = null;
  els.transactionForm.reset();
  els.transactionDialogTitle.textContent = "Add Transaction";
  els.transactionSubmitButton.textContent = "Add";
  els.transactionCategory.disabled = false;
  els.transactionCategory.value = "Payments";
  els.transactionDirection.value = "credit";
  els.transactionDate.value = localDateInput();
  els.transactionMonth.value = selectedMonth ? monthKey(selectedMonth) : monthKey(localDateInput());
  els.transactionLbp.value = "";
  els.transactionUsd.value = amountInputValue(state.settings.defaultDueUsd);
  clearInvoiceFileSelection();
  els.invoiceAttachmentStatus.textContent = "";
  setProjectDropdownOpen(false);
  setExpenseCategoryDropdownOpen(false);
  populateTenantSelect();
  syncTransactionFormMode();
  updateExpenseConversionPreview();
}

function setTransactionFormBusy(isBusy) {
  els.transactionSubmitButton.disabled = isBusy;
  els.takeInvoicePhotoButton.disabled = isBusy;
  els.uploadInvoicePhotoButton.disabled = isBusy;
  els.projectDropdownButton.disabled = isBusy;
  els.expenseCategoryDropdownButton.disabled = isBusy;
  els.transactionSubmitButton.textContent = isBusy ? "Saving..." : editingExpenseId ? "Save" : "Add";
}

function expenseDebitUsd(transaction) {
  return Number(transaction.debitUsd || 0) || Math.max(0, -Number(transaction.balanceUsd || 0));
}

function expenseDebitLbp(transaction) {
  return Number(transaction.debitLbp || 0) || Math.max(0, -Number(transaction.balanceLbp || 0));
}

function openExpenseEditDialog(transactionId) {
  const transaction = state.transactions.find((entry) => entry.id === transactionId);
  if (!transaction || transaction.category !== "Expenses") {
    showToast("Only expense entries can be edited here");
    return;
  }

  resetTransactionForm();
  editingExpenseId = transaction.id;
  els.transactionDialogTitle.textContent = "Edit Expense";
  els.transactionSubmitButton.textContent = "Save";
  els.transactionCategory.value = "Expenses";
  els.transactionCategory.disabled = true;
  els.transactionDescription.value = transaction.description || "";
  els.transactionDate.value = transaction.date || localDateInput();
  els.transactionLbp.value = amountInputValue(expenseDebitLbp(transaction));
  els.transactionUsd.value = amountInputValue(expenseDebitUsd(transaction));
  els.transactionSupplier.value = transaction.supplier || "";
  els.transactionInvoice.value = transaction.invoice || "";
  els.transactionExpenseCategory.value = transaction.expenseCategory || "";
  els.transactionProject.value = transaction.project || "";
  clearInvoiceFileSelection();
  els.invoiceAttachmentStatus.textContent = transaction.invoiceAttachment?.driveUrl
    ? "Existing invoice photo will be kept unless you choose a new picture."
    : "No invoice photo is attached. Choose a picture to add one.";
  syncTransactionFormMode();
  openDialog(els.transactionDialog);
}

function openPaymentDialogFor(tenantId, month, amount) {
  resetTransactionForm();
  els.transactionCategory.value = "Payments";
  els.transactionTenant.value = tenantId;
  els.transactionMonth.value = monthKey(month);
  els.transactionLbp.value = "";
  els.transactionUsd.value = amountInputValue(amount);
  syncTransactionFormMode();
  openDialog(els.transactionDialog);
}

function deleteLedgerTransaction(transactionId) {
  const transaction = state.transactions.find((entry) => entry.id === transactionId);
  if (!transaction) {
    showToast("Transaction not found");
    return;
  }

  const label = [transaction.category, transaction.description || tenantName(transaction.tenantId), transaction.date]
    .filter(Boolean)
    .join(" | ");
  if (!window.confirm(`Delete this ledger entry?\n\n${label}\n\nThis removes the record from the app and Google Sheet sync.`)) {
    return;
  }

  state.transactions = state.transactions.filter((entry) => entry.id !== transactionId);
  saveState();
  renderAll();
  showToast("Ledger entry deleted");
}

function downloadBlob(content, type, fileName) {
  const blob = content instanceof Blob ? content : new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

function escapeXml(value) {
  return String(value ?? "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function ledgerExcelRows() {
  return getFilteredLedgerRows().map((transaction) => ({
    date: transaction.date || "",
    category: transaction.category || "",
    tenant: tenantName(transaction.tenantId),
    description: transaction.description || "",
    forMonth: transaction.forMonth ? formatMonth(transaction.forMonth) : "",
    supplier: transaction.supplier || "",
    invoice: transaction.invoice || "",
    project: transaction.project || "",
    debitUsd: Number(transaction.debitUsd || 0),
    debitLbp: Number(transaction.debitLbp || 0),
    creditUsd: Number(transaction.creditUsd || 0),
    creditLbp: Number(transaction.creditLbp || 0),
    netUsd: transactionNetUsd(transaction),
    receiptRef: transaction.receiptRef || "",
    invoicePhoto: transaction.invoiceAttachment?.driveUrl || "",
    expenseCategory: transaction.expenseCategory || "",
  }));
}

const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const textEncoder = new TextEncoder();
const crc32Table = Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  return value >>> 0;
});

function utf8Bytes(value) {
  return textEncoder.encode(String(value));
}

function crc32(bytes) {
  let crc = 0xffffffff;
  bytes.forEach((byte) => {
    crc = crc32Table[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  });
  return (crc ^ 0xffffffff) >>> 0;
}

function uint16(value) {
  return new Uint8Array([value & 0xff, (value >>> 8) & 0xff]);
}

function uint32(value) {
  return new Uint8Array([
    value & 0xff,
    (value >>> 8) & 0xff,
    (value >>> 16) & 0xff,
    (value >>> 24) & 0xff,
  ]);
}

function concatBytes(parts) {
  const output = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let offset = 0;
  parts.forEach((part) => {
    output.set(part, offset);
    offset += part.length;
  });
  return output;
}

function zipDateTime(date) {
  const year = Math.max(1980, date.getFullYear());
  return {
    time: (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2),
    date: ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate(),
  };
}

function buildZip(files) {
  const localParts = [];
  const centralParts = [];
  const timestamp = zipDateTime(new Date());
  let offset = 0;

  files.forEach((file) => {
    const name = utf8Bytes(file.name);
    const content = file.content instanceof Uint8Array ? file.content : utf8Bytes(file.content);
    const checksum = crc32(content);
    const flags = 0x0800;
    const localHeader = concatBytes([
      uint32(0x04034b50),
      uint16(20),
      uint16(flags),
      uint16(0),
      uint16(timestamp.time),
      uint16(timestamp.date),
      uint32(checksum),
      uint32(content.length),
      uint32(content.length),
      uint16(name.length),
      uint16(0),
      name,
    ]);
    const centralHeader = concatBytes([
      uint32(0x02014b50),
      uint16(20),
      uint16(20),
      uint16(flags),
      uint16(0),
      uint16(timestamp.time),
      uint16(timestamp.date),
      uint32(checksum),
      uint32(content.length),
      uint32(content.length),
      uint16(name.length),
      uint16(0),
      uint16(0),
      uint16(0),
      uint16(0),
      uint32(0),
      uint32(offset),
      name,
    ]);
    const localRecord = concatBytes([localHeader, content]);
    localParts.push(localRecord);
    centralParts.push(centralHeader);
    offset += localRecord.length;
  });

  const centralDirectory = concatBytes(centralParts);
  const endRecord = concatBytes([
    uint32(0x06054b50),
    uint16(0),
    uint16(0),
    uint16(files.length),
    uint16(files.length),
    uint32(centralDirectory.length),
    uint32(offset),
    uint16(0),
  ]);

  return concatBytes([...localParts, centralDirectory, endRecord]);
}

function excelColumnName(index) {
  let value = index + 1;
  let name = "";
  while (value > 0) {
    const remainder = (value - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    value = Math.floor((value - 1) / 26);
  }
  return name;
}

function excelCellRef(rowNumber, columnIndex) {
  return `${excelColumnName(columnIndex)}${rowNumber}`;
}

function xlsxTextCell(rowNumber, columnIndex, value, style = 0) {
  const ref = excelCellRef(rowNumber, columnIndex);
  const styleAttr = style ? ` s="${style}"` : "";
  return `<c r="${ref}"${styleAttr} t="inlineStr"><is><t xml:space="preserve">${escapeXml(value)}</t></is></c>`;
}

function xlsxNumberCell(rowNumber, columnIndex, value, style = 0) {
  const ref = excelCellRef(rowNumber, columnIndex);
  const amount = Number(value || 0);
  const styleAttr = style ? ` s="${style}"` : "";
  return `<c r="${ref}"${styleAttr}><v>${Number.isFinite(amount) ? amount : 0}</v></c>`;
}

function buildLedgerSheetXml(rows) {
  const headers = [
    "Date",
    "Category",
    "Tenant",
    "Description",
    "For Month",
    "Supplier",
    "Invoice",
    "Project",
    "Debit USD",
    "Debit LBP",
    "Credit USD",
    "Credit LBP",
    "Net USD",
    "Receipt Ref",
    "Invoice Photo",
    "Expense Category",
  ];
  const widths = [86, 108, 140, 180, 90, 130, 96, 130, 82, 88, 82, 88, 82, 120, 160, 130];
  const hyperlinks = [];
  const headerRow = `<row r="1">${headers.map((header, index) => xlsxTextCell(1, index, header, 1)).join("")}</row>`;
  const dataRows = rows.map((row, index) => {
    const rowNumber = index + 2;
    const values = [
      row.date,
      row.category,
      row.tenant,
      row.description,
      row.forMonth,
      row.supplier,
      row.invoice,
      row.project,
      row.debitUsd,
      row.debitLbp,
      row.creditUsd,
      row.creditLbp,
      row.netUsd,
      row.receiptRef,
      row.invoicePhoto ? "Open invoice photo" : "",
      row.expenseCategory,
    ];
    if (row.invoicePhoto) {
      hyperlinks.push({ ref: excelCellRef(rowNumber, 14), target: row.invoicePhoto, id: `rId${hyperlinks.length + 1}` });
    }
    const cells = values
      .map((value, cellIndex) => {
        if ([8, 10, 12].includes(cellIndex)) return xlsxNumberCell(rowNumber, cellIndex, value, 3);
        if ([9, 11].includes(cellIndex)) return xlsxNumberCell(rowNumber, cellIndex, value, 2);
        return xlsxTextCell(rowNumber, cellIndex, value);
      })
      .join("");
    return `<row r="${rowNumber}">${cells}</row>`;
  });
  const endRef = excelCellRef(rows.length + 1, headers.length - 1);
  const hyperlinkXml = hyperlinks.length
    ? `<hyperlinks>${hyperlinks.map((link) => `<hyperlink ref="${link.ref}" r:id="${link.id}"/>`).join("")}</hyperlinks>`
    : "";

  return {
    xml: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <dimension ref="A1:${endRef}"/>
  <sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>
  <cols>${widths.map((width, index) => `<col min="${index + 1}" max="${index + 1}" width="${Math.round(width / 7)}" customWidth="1"/>`).join("")}</cols>
  <sheetData>${headerRow}${dataRows.join("")}</sheetData>
  <autoFilter ref="A1:${endRef}"/>
  ${hyperlinkXml}
  <pageMargins left="0.7" right="0.7" top="0.75" bottom="0.75" header="0.3" footer="0.3"/>
</worksheet>`,
    hyperlinks,
  };
}

function buildLedgerXlsx(rows) {
  const { xml: sheetXml, hyperlinks } = buildLedgerSheetXml(rows);
  const createdAt = new Date().toISOString();
  const files = [
    {
      name: "[Content_Types].xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`,
    },
    {
      name: "_rels/.rels",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`,
    },
    {
      name: "docProps/app.xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>Building Account Tracker</Application>
  <DocSecurity>0</DocSecurity>
  <ScaleCrop>false</ScaleCrop>
  <HeadingPairs><vt:vector size="2" baseType="variant"><vt:variant><vt:lpstr>Worksheets</vt:lpstr></vt:variant><vt:variant><vt:i4>1</vt:i4></vt:variant></vt:vector></HeadingPairs>
  <TitlesOfParts><vt:vector size="1" baseType="lpstr"><vt:lpstr>Ledger</vt:lpstr></vt:vector></TitlesOfParts>
</Properties>`,
    },
    {
      name: "docProps/core.xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>Naccache 1727 Ledger Export</dc:title>
  <dc:creator>Building Account Tracker</dc:creator>
  <cp:lastModifiedBy>Building Account Tracker</cp:lastModifiedBy>
  <dcterms:created xsi:type="dcterms:W3CDTF">${createdAt}</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">${createdAt}</dcterms:modified>
</cp:coreProperties>`,
    },
    {
      name: "xl/workbook.xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets><sheet name="Ledger" sheetId="1" r:id="rId1"/></sheets>
</workbook>`,
    },
    {
      name: "xl/_rels/workbook.xml.rels",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`,
    },
    {
      name: "xl/styles.xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <numFmts count="1"><numFmt numFmtId="164" formatCode="$#,##0.00;[Red]-$#,##0.00"/></numFmts>
  <fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Calibri"/></font></fonts>
  <fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF163832"/><bgColor indexed="64"/></patternFill></fill></fills>
  <borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left/><right/><top/><bottom style="thin"><color rgb="FFB6C9C1"/></bottom/><diagonal/></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="4"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="3" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`,
    },
    { name: "xl/worksheets/sheet1.xml", content: sheetXml },
  ];

  if (hyperlinks.length) {
    files.push({
      name: "xl/worksheets/_rels/sheet1.xml.rels",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${hyperlinks.map((link) => `<Relationship Id="${link.id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="${escapeXml(link.target)}" TargetMode="External"/>`).join("")}
</Relationships>`,
    });
  }

  return new Blob([buildZip(files)], { type: XLSX_MIME });
}

function handleLedgerExcelExport() {
  const rows = ledgerExcelRows();
  if (!rows.length) {
    showToast("No ledger rows to export");
    return;
  }
  const workbook = buildLedgerXlsx(rows);
  downloadBlob(
    workbook,
    XLSX_MIME,
    `naccache-1727-ledger-${localDateInput()}.xlsx`,
  );
  showToast("Ledger Excel exported");
}

function appendOptionalLinkCell(row, text, href = "", className = "") {
  const cell = document.createElement("td");
  if (className) cell.className = className;
  if (href) {
    const link = document.createElement("a");
    link.href = href;
    link.textContent = text;
    cell.append(link);
  } else {
    cell.textContent = text;
  }
  row.append(cell);
}

function ledgerFilterSummary() {
  const parts = [];
  if (els.categoryFilter.value !== "all") parts.push(`Category: ${els.categoryFilter.value}`);
  const search = els.ledgerSearch.value.trim();
  if (search) parts.push(`Search: ${search}`);
  const dateFrom = els.ledgerDateFrom.value;
  const dateTo = els.ledgerDateTo.value;
  if (dateFrom || dateTo) parts.push(`Date: ${dateFrom || "start"} – ${dateTo || "end"}`);
  return parts.length ? parts.join(" | ") : "All ledger entries";
}

function handleLedgerPdfExport() {
  const transactions = getFilteredLedgerRows();
  if (!transactions.length) {
    showToast("No ledger rows to export");
    return;
  }

  const totals = transactions.reduce(
    (acc, transaction) => {
      acc.debitUsd += Number(transaction.debitUsd || 0);
      acc.creditUsd += Number(transaction.creditUsd || 0);
      acc.netUsd += transactionNetUsd(transaction);
      return acc;
    },
    { debitUsd: 0, creditUsd: 0, netUsd: 0 },
  );

  const page = document.createElement("article");
  page.className = "print-page ledger-print-page";

  const header = document.createElement("header");
  header.className = "print-header";

  const titleBlock = document.createElement("div");
  const building = document.createElement("p");
  building.textContent = state.building.name;
  const title = document.createElement("h1");
  title.textContent = "Ledger PDF Export";
  const filterLine = document.createElement("p");
  filterLine.textContent = ledgerFilterSummary();
  titleBlock.append(building, title, filterLine);

  const meta = document.createElement("div");
  meta.className = "print-meta";
  const generated = document.createElement("span");
  generated.textContent = `Date: ${localDateInput()}`;
  const entries = document.createElement("span");
  entries.textContent = `Entries: ${transactions.length}`;
  const version = document.createElement("span");
  version.textContent = `App: ${APP_VERSION}`;
  meta.append(generated, entries, version);
  header.append(titleBlock, meta);

  const summary = document.createElement("section");
  summary.className = "print-summary";
  [
    ["Entries", String(transactions.length)],
    ["Debit USD", formatUsd(totals.debitUsd)],
    ["Credit USD", formatUsd(totals.creditUsd)],
    ["Net USD", formatUsd(totals.netUsd)],
  ].forEach(([label, value]) => {
    const item = document.createElement("div");
    const itemLabel = document.createElement("span");
    itemLabel.textContent = label;
    const itemValue = document.createElement("strong");
    itemValue.textContent = value;
    item.append(itemLabel, itemValue);
    summary.append(item);
  });

  const table = document.createElement("table");
  table.className = "print-table ledger-print-table";
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  ["Date", "Category", "Details", "Debit USD", "Credit USD", "Net USD", "Invoice"].forEach((heading, index) =>
    appendHeaderCell(headerRow, heading, index >= 3 && index <= 5 ? "numeric" : ""),
  );
  thead.append(headerRow);

  const tbody = document.createElement("tbody");
  transactions.forEach((transaction) => {
    const row = document.createElement("tr");
    const details = [
      tenantName(transaction.tenantId),
      transaction.description,
      transaction.expenseCategory || "",
      transaction.forMonth ? `For ${formatMonth(transaction.forMonth)}` : "",
      transaction.supplier ? `Supplier: ${transaction.supplier}` : "",
      transaction.invoice ? `Invoice: ${transaction.invoice}` : "",
      transaction.receiptRef ? `Receipt: ${transaction.receiptRef}` : "",
    ]
      .filter(Boolean)
      .join(" | ");
    appendCell(row, transaction.date || "");
    appendCell(row, transaction.category || "");
    appendCell(row, details);
    appendCell(row, formatUsd(Number(transaction.debitUsd || 0)), "numeric");
    appendCell(row, formatUsd(Number(transaction.creditUsd || 0)), "numeric");
    appendCell(row, formatUsd(transactionNetUsd(transaction)), "numeric");
    appendOptionalLinkCell(row, transaction.invoiceAttachment?.driveUrl ? "Open" : "", transaction.invoiceAttachment?.driveUrl || "");
    tbody.append(row);
  });

  const tfoot = document.createElement("tfoot");
  const totalRow = document.createElement("tr");
  appendCell(totalRow, "Total");
  appendCell(totalRow, "");
  appendCell(totalRow, "");
  appendCell(totalRow, formatUsd(totals.debitUsd), "numeric");
  appendCell(totalRow, formatUsd(totals.creditUsd), "numeric");
  appendCell(totalRow, formatUsd(totals.netUsd), "numeric");
  appendCell(totalRow, "");
  tfoot.append(totalRow);
  table.append(thead, tbody, tfoot);

  const note = document.createElement("p");
  note.className = "print-note";
  note.textContent = "This PDF export reflects the current Ledger filters and search.";

  page.append(header, summary, table, note);
  printPreparedPage(page);
  showToast("Ledger PDF ready");
}

function generateTenantId(name) {
  const base = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") || "tenant";
  let id = base;
  let n = 1;
  while (state.tenants.some((t) => t.id === id)) id = `${base}-${++n}`;
  return id;
}

function openAddTenantDialog() {
  editingTenantId = null;
  els.tenantDialogTitle.textContent = "Add Tenant";
  els.tenantNameInput.value = "";
  els.tenantUnitInput.value = "";
  els.tenantPhoneDialogInput.value = "";
  els.tenantSubmitButton.textContent = "Add";
  openDialog(els.tenantDialog);
  els.tenantNameInput.focus();
}

function openEditTenantDialog(tenantId) {
  const tenant = state.tenants.find((t) => t.id === tenantId);
  if (!tenant) return;
  editingTenantId = tenantId;
  els.tenantDialogTitle.textContent = "Edit Tenant";
  els.tenantNameInput.value = tenant.name;
  els.tenantUnitInput.value = tenant.unit;
  els.tenantPhoneDialogInput.value = tenant.phone || "";
  els.tenantSubmitButton.textContent = "Save";
  openDialog(els.tenantDialog);
  els.tenantNameInput.focus();
}

function handleTenantFormSubmit(event) {
  event.preventDefault();
  const name = els.tenantNameInput.value.trim();
  const unit = els.tenantUnitInput.value.trim();
  const phone = els.tenantPhoneDialogInput.value.trim();
  if (!name || !unit) return;

  if (editingTenantId) {
    const tenant = state.tenants.find((t) => t.id === editingTenantId);
    if (tenant) { tenant.name = name; tenant.unit = unit; tenant.phone = phone; }
    showToast("Tenant updated");
  } else {
    state.tenants.push({ id: generateTenantId(name), name, unit, active: true, phone });
    showToast(`${name} added`);
  }

  saveState();
  closeDialog(els.tenantDialog);
  editingTenantId = null;
  renderAll();
}

function deleteTenant(tenantId) {
  const tenant = state.tenants.find((t) => t.id === tenantId);
  if (!tenant) return;
  const txCount = state.transactions.filter((t) => t.tenantId === tenantId).length;
  const msg = txCount > 0
    ? `Delete ${tenant.name}? Their ${txCount} transaction(s) will be kept but unlinked from this tenant.`
    : `Delete ${tenant.name}?`;
  if (!window.confirm(msg)) return;
  state.tenants = state.tenants.filter((t) => t.id !== tenantId);
  saveState();
  renderAll();
  showToast(`${tenant.name} removed`);
}

function buildWhatsAppUrl(tenant, dueAmount, month) {
  const phone = (tenant.phone || "").replace(/\D/g, "");
  if (!phone) return null;
  const message = [
    `${state.building.name} – Payment Reminder`,
    `Hi ${tenant.name}, your rent for ${formatMonth(month)} is due: ${formatMonthly(dueAmount)}.`,
    `Please settle at your earliest convenience. Thank you.`,
  ].join("\n");
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

function openWhatsAppReminderDialog() {
  const collection = getMonthCollection(selectedMonth);
  const dueStatuses = collection.tenantStatuses.filter(({ status }) => status.paid < status.expected);

  if (!dueStatuses.length) {
    showToast("No due payments for this month");
    return;
  }

  const withPhone = dueStatuses.filter(({ tenant }) => tenant.phone);
  const withoutPhone = dueStatuses.filter(({ tenant }) => !tenant.phone);

  els.whatsappDialogNote.textContent = withoutPhone.length
    ? `${withoutPhone.map(({ tenant }) => tenant.name).join(", ")} skipped – no phone number saved in the Tenants tab.`
    : "";
  els.whatsappDialogNote.classList.toggle("hidden", !withoutPhone.length);

  if (!withPhone.length) {
    showToast("No due tenants have a phone number saved");
    return;
  }

  els.whatsappReminderList.replaceChildren(
    ...withPhone.map(({ tenant, status }) => {
      const due = Math.max(0, status.expected - status.paid);
      const url = buildWhatsAppUrl(tenant, due, selectedMonth);
      const row = document.createElement("div");
      row.className = "whatsapp-reminder-row";
      const info = document.createElement("div");
      const name = document.createElement("strong");
      name.textContent = tenant.name;
      const detail = document.createElement("span");
      detail.textContent = `Unit ${tenant.unit} – ${formatMonthly(due)} due – ${formatMonth(selectedMonth)}`;
      info.append(name, detail);
      const link = document.createElement("a");
      link.className = "mini-button whatsapp-btn";
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener";
      link.textContent = "Send";
      row.append(info, link);
      return row;
    }),
  );

  openDialog(els.whatsappDialog);
}

function navigateMonth(direction) {
  const months = getMonths();
  const idx = months.indexOf(selectedMonth);
  const next = months[idx + direction];
  if (next === undefined) return;
  selectedMonth = next;
  renderDashboard();
  renderPayments();
}

function attachEvents() {
  els.navButtons.forEach((button) => button.addEventListener("click", () => setView(button.dataset.view)));
  els.monthPrev.addEventListener("click", () => navigateMonth(-1));
  els.monthNext.addEventListener("click", () => navigateMonth(1));
  els.dueOnlyToggle.addEventListener("click", () => { dueOnlyFilter = !dueOnlyFilter; renderPayments(); });
  els.whatsappAllDueButton.addEventListener("click", openWhatsAppReminderDialog);
  els.closeWhatsappDialog.addEventListener("click", () => closeDialog(els.whatsappDialog));
  els.clearLedgerFilters.addEventListener("click", clearAllLedgerFilters);
  els.monthSelect.addEventListener("change", () => {
    selectedMonth = els.monthSelect.value;
    renderDashboard();
    renderPayments();
  });
  els.paymentMonthStrip.addEventListener("click", (e) => {
    const btn = e.target.closest(".month-strip-btn");
    if (!btn) return;
    selectedMonth = btn.dataset.month;
    renderDashboard();
    renderPayments();
  });
  els.tenantPaymentList.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-tenant-id]");
    if (!button) return;
    openPaymentDialogFor(button.dataset.tenantId, button.dataset.month, button.dataset.due);
  });
  els.monthOverviewList.addEventListener("click", (event) => {
    const row = event.target.closest("button[data-month]");
    if (!row) return;
    selectedMonth = row.dataset.month;
    renderDashboard();
    renderPayments();
  });
  els.lastReceiptButton.addEventListener("click", printLastReceipt);
  els.tenantSearch.addEventListener("input", renderTenants);
  els.addTenantButton.addEventListener("click", openAddTenantDialog);
  els.tenantForm.addEventListener("submit", handleTenantFormSubmit);
  els.closeTenantDialog.addEventListener("click", () => closeDialog(els.tenantDialog));
  els.cancelTenantButton.addEventListener("click", () => closeDialog(els.tenantDialog));
  els.tenantList.addEventListener("click", (event) => {
    const statBtn = event.target.closest(".print-statement-button[data-tenant-id]");
    if (statBtn) { void shareTenantStatementPdf(statBtn.dataset.tenantId); return; }
    const editBtn = event.target.closest(".edit-tenant-button[data-tenant-id]");
    if (editBtn) { openEditTenantDialog(editBtn.dataset.tenantId); return; }
    const delBtn = event.target.closest(".delete-tenant-button[data-tenant-id]");
    if (delBtn) deleteTenant(delBtn.dataset.tenantId);
  });
  window.addEventListener("afterprint", () => schedulePrintCleanup());
  els.ledgerSearch.addEventListener("input", renderLedger);
  els.categoryFilter.addEventListener("change", renderLedger);
  els.expenseCategoryFilter.addEventListener("change", renderLedger);
  els.ledgerDateFrom.addEventListener("change", renderLedger);
  els.ledgerDateTo.addEventListener("change", renderLedger);
  els.ledgerList.addEventListener("click", (event) => {
    const receiptButton = event.target.closest(".receipt-button[data-transaction-id]");
    if (receiptButton) {
      void sharePaymentReceiptPdf(receiptButton.dataset.transactionId);
      return;
    }
    const editButton = event.target.closest(".edit-expense-button[data-transaction-id]");
    if (editButton) {
      openExpenseEditDialog(editButton.dataset.transactionId);
      return;
    }
    const deleteButton = event.target.closest(".delete-transaction-button[data-transaction-id]");
    if (deleteButton) { deleteLedgerTransaction(deleteButton.dataset.transactionId); return; }
    const textArea = event.target.closest(".ledger-text");
    if (textArea) textArea.querySelector(".ledger-expand")?.classList.toggle("is-open");
  });
  els.exportExcelButton.addEventListener("click", handleLedgerExcelExport);
  els.exportButton.addEventListener("click", handleLedgerPdfExport);

  els.openAddButton.addEventListener("click", () => {
    resetTransactionForm();
    openDialog(els.transactionDialog);
  });
  els.closeDialogButton.addEventListener("click", () => closeDialog(els.transactionDialog));
  els.cancelDialogButton.addEventListener("click", () => closeDialog(els.transactionDialog));
  els.transactionCategory.addEventListener("change", applyTransactionCategoryDefaults);
  els.transactionProject.addEventListener("input", () => {
    setProjectDropdownOpen(true);
    syncTransactionFormMode();
  });
  els.transactionProject.addEventListener("focus", () => setProjectDropdownOpen(true));
  els.projectDropdownButton.addEventListener("click", () => {
    setProjectDropdownOpen(els.projectDropdown.classList.contains("hidden"));
  });
  els.projectDropdown.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-project]");
    if (button) selectProject(button.dataset.project);
  });
  els.transactionExpenseCategory.addEventListener("input", () => setExpenseCategoryDropdownOpen(true));
  els.transactionExpenseCategory.addEventListener("focus", () => setExpenseCategoryDropdownOpen(true));
  els.expenseCategoryDropdownButton.addEventListener("click", () => {
    setExpenseCategoryDropdownOpen(els.expenseCategoryDropdown.classList.contains("hidden"));
  });
  els.expenseCategoryDropdown.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-expense-category]");
    if (button) selectExpenseCategory(button.dataset.expenseCategory);
  });
  els.supplierDropdownButton.addEventListener("click", () => {
    setSupplierDropdownOpen(els.supplierDropdown.classList.contains("hidden"));
  });
  els.supplierDropdown.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-supplier]");
    if (button) selectSupplier(button.dataset.supplier);
  });
  els.transactionSupplier.addEventListener("focus", () => setSupplierDropdownOpen(true));
  els.transactionSupplier.addEventListener("input", () => setSupplierDropdownOpen(true));
  document.addEventListener("click", (event) => {
    if (event.target.closest(".supplier-field")) return;
    if (event.target.closest(".project-combobox")) return;
    if (event.target.closest(".expense-category-combobox")) return;
    setSupplierDropdownOpen(false);
    setProjectDropdownOpen(false);
    setExpenseCategoryDropdownOpen(false);
  });
  els.takeInvoicePhotoButton.addEventListener("click", () => els.transactionInvoiceCameraFile.click());
  els.uploadInvoicePhotoButton.addEventListener("click", () => els.transactionInvoiceFile.click());
  els.transactionInvoiceCameraFile.addEventListener("change", () => setInvoiceFileSource("camera"));
  els.transactionInvoiceFile.addEventListener("change", () => setInvoiceFileSource("upload"));
  els.transactionLbp.addEventListener("input", updateExpenseConversionPreview);
  els.transactionUsd.addEventListener("input", updateExpenseConversionPreview);
  els.transactionForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    setTransactionFormBusy(true);
    try {
      const transactions = createTransactionsFromForm();
      const transaction = transactions[0];
      const editingIndex = editingExpenseId
        ? state.transactions.findIndex((entry) => entry.id === editingExpenseId && entry.category === "Expenses")
        : -1;
      const existingTransaction = editingIndex >= 0 ? state.transactions[editingIndex] : null;
      let invoiceUploadError = null;
      if (editingExpenseId && !existingTransaction) throw new Error("Expense entry was not found");
      if (existingTransaction) {
        transaction.id = existingTransaction.id;
        transaction.category = "Expenses";
        transaction.tenantId = null;
        transaction.forMonth = null;
        transaction.sourceRow = existingTransaction.sourceRow || null;
        transaction.invoiceAttachment = existingTransaction.invoiceAttachment || null;
      } else {
        transactions.filter(isReceiptablePayment).forEach((entry) => ensureReceiptReference(entry));
      }
      const invoiceFile = selectedInvoiceFile();
      if (transaction.category === "Expenses" && invoiceFile) {
        showToast(existingTransaction ? "Uploading replacement invoice" : "Uploading invoice picture");
        try {
          transaction.invoiceAttachment = await uploadExpenseInvoice(transaction, invoiceFile);
        } catch (error) {
          invoiceUploadError = error;
        }
      }
      if (existingTransaction) state.transactions[editingIndex] = { ...existingTransaction, ...transaction };
      else state.transactions.push(...transactions);
      saveState();
      closeDialog(els.transactionDialog);
      selectedMonth = transactions.find((entry) => entry.forMonth)?.forMonth || selectedMonth;
      renderAll();
      if (existingTransaction) {
        showToast(
          invoiceUploadError
            ? `Expense updated. Invoice upload failed: ${invoiceUploadError.message}`
            : invoiceFile
              ? "Expense updated. Invoice replaced"
              : "Expense updated",
        );
      } else if (transactions.some(isReceiptablePayment)) {
        showToast("Payment added. Receipt saved");
      } else if (invoiceUploadError) {
        showToast(`Expense saved. Invoice upload failed: ${invoiceUploadError.message}`);
      } else if (transaction.invoiceAttachment?.driveUrl) {
        showToast("Expense added. Invoice uploaded");
      } else {
        showToast("Transaction added");
      }
      editingExpenseId = null;
      els.transactionDialogTitle.textContent = "Add Transaction";
      els.transactionSubmitButton.textContent = "Add";
      els.transactionCategory.disabled = false;
    } catch (error) {
      showToast(error.message);
    } finally {
      setTransactionFormBusy(false);
    }
  });

  els.addMonthButton.addEventListener("click", () => {
    els.newMonthInput.value = selectedMonth ? monthKey(selectedMonth) : monthKey(localDateInput());
    els.newMonthAmountInput.value = state.settings.defaultDueUsd || "";
    openDialog(els.monthDialog);
  });
  els.closeMonthButton.addEventListener("click", () => closeDialog(els.monthDialog));
  els.cancelMonthButton.addEventListener("click", () => closeDialog(els.monthDialog));
  els.monthForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const month = monthIso(els.newMonthInput.value);
    const expectedUsd = Number(els.newMonthAmountInput.value || 0);
    const existing = state.monthlyExpected.find((entry) => entry.month === month);
    if (existing) {
      existing.expectedUsd = expectedUsd;
      delete existing.expectedLbp;
    }
    else state.monthlyExpected.push({ month, expectedUsd });
    state.monthlyExpected = normalizedMonthlyExpected(state.monthlyExpected);
    selectedMonth = month;
    saveState();
    closeDialog(els.monthDialog);
    renderAll();
    showToast("Month saved");
  });

  els.saveSettingsButton.addEventListener("click", () => {
    state.building.name = els.buildingNameInput.value.trim() || state.building.name;
    state.settings.defaultDueUsd = Number(els.defaultDueInput.value || 0);
    state.settings.lbpPerUsd = Math.max(1, Number(els.conversionRateInput.value || DEFAULT_LBP_PER_USD));
    state.settings.invoiceUploadUrl = els.invoiceUploadUrlInput.value.trim();
    state.settings.cloudSpreadsheetId = els.cloudSpreadsheetIdInput.value.trim();
    state.settings.invoiceUploadFolderId = els.invoiceUploadFolderIdInput.value.trim();
    saveState();
    renderAll();
    updateExpenseConversionPreview();
    if (hasCloudConfig()) saveCloudState({ silent: true });
    showToast("Settings saved");
  });
  els.loadCloudButton.addEventListener("click", loadCloudState);
  els.zeroAccountsButton.addEventListener("click", zeroAccounts);

  els.resetButton.addEventListener("click", () => {
    if (!window.confirm("Reset this browser to the imported Excel data? Local edits will be removed.")) return;
    localStorage.removeItem(STORAGE_KEY);
    state = hydrateState(seedState);
    selectedMonth = null;
    renderAll();
    showToast("Data reset");
  });
}

async function boot() {
  const response = await fetch("data/seed.json", { cache: "no-store" });
  seedState = hydrateState(await response.json());
  const stored = localStorage.getItem(STORAGE_KEY);
  state = stored ? hydrateState(JSON.parse(stored)) : hydrateState(seedState);
  if (ensureAllReceiptReferences()) saveState();

  attachEvents();
  populateTenantSelect();
  renderAll();

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
}

boot().catch((error) => {
  document.body.innerHTML = `<main class="app-shell"><section class="panel"><h1>BUILDING ACCOUNT TRACKER ${APP_VERSION}</h1><p>${error.message}</p></section></main>`;
});
