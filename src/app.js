const STORAGE_KEY = "building-account-tracker:v1";
const APP_VERSION = "v124";

const els = {
  views: document.querySelectorAll(".view"),
  navButtons: document.querySelectorAll(".nav-button"),
  moreNavButton: document.querySelector("#moreNavButton"),
  moreSheet: document.querySelector("#moreSheet"),
  closeMoreSheet: document.querySelector("#closeMoreSheet"),
  moreSheetItems: document.querySelectorAll(".more-sheet-item"),
  monthSelect: document.querySelector("#monthSelect"),
  kpiGrid: document.querySelector("#kpiGrid"),
  attentionPanel: document.querySelector("#attentionPanel"),
  attentionList: document.querySelector("#attentionList"),
  tenantDuesPanel: document.querySelector("#tenantDuesPanel"),
  tenantDuesList: document.querySelector("#tenantDuesList"),
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
  whatsappDialogTitle: document.querySelector("#whatsappDialogTitle"),
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
  entryChooser: document.querySelector("#entryChooser"),
  closeEntryChooser: document.querySelector("#closeEntryChooser"),
  entryChooserButtons: document.querySelectorAll(".entry-chooser-btn"),
  transactionBackButton: document.querySelector("#transactionBackButton"),
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
  downloadBackupButton: document.querySelector("#downloadBackupButton"),
  restoreBackupButton: document.querySelector("#restoreBackupButton"),
  restoreBackupInput: document.querySelector("#restoreBackupInput"),
  cloudSyncStatus: document.querySelector("#cloudSyncStatus"),
  syncChip: document.querySelector("#syncChip"),
  syncChipText: document.querySelector("#syncChipText"),
  reloadSheetAction: document.querySelector("#reloadSheetAction"),
  syncSecretInput: document.querySelector("#syncSecretInput"),
  shareSyncCodeButton: document.querySelector("#shareSyncCodeButton"),
  connectBuildingButton: document.querySelector("#connectBuildingButton"),
  connectDialog: document.querySelector("#connectDialog"),
  closeConnectDialog: document.querySelector("#closeConnectDialog"),
  cancelConnectButton: document.querySelector("#cancelConnectButton"),
  connectSubmitButton: document.querySelector("#connectSubmitButton"),
  connectCodeInput: document.querySelector("#connectCodeInput"),
  startFreshButton: document.querySelector("#startFreshButton"),
  zeroAccountsButton: document.querySelector("#zeroAccountsButton"),
  printStatement: document.querySelector("#printStatement"),
  toast: document.querySelector("#toast"),
  loginScreen: document.querySelector("#loginScreen"),
  loginOwnerTab: document.querySelector("#loginOwnerTab"),
  loginTenantTab: document.querySelector("#loginTenantTab"),
  loginOwnerForm: document.querySelector("#loginOwnerForm"),
  loginTenantForm: document.querySelector("#loginTenantForm"),
  loginTenantSelect: document.querySelector("#loginTenantSelect"),
  loginPasswordInput: document.querySelector("#loginPasswordInput"),
  loginPinInput: document.querySelector("#loginPinInput"),
  loginSubmitBtn: document.querySelector("#loginSubmitBtn"),
  loginError: document.querySelector("#loginError"),
  loginHint: document.querySelector("#loginHint"),
  logoutButton: document.querySelector("#logoutButton"),
  tenantCoefficientInput: document.querySelector("#tenantCoefficientInput"),
  tenantPinDialogInput: document.querySelector("#tenantPinDialogInput"),
  coefficientStatus: document.querySelector("#coefficientStatus"),
  ownerPasswordInput: document.querySelector("#ownerPasswordInput"),
  dueBanner: document.querySelector("#dueBanner"),
  dueBannerText: document.querySelector("#dueBannerText"),
  dueBannerClose: document.querySelector("#dueBannerClose"),
  newMonthBanner: document.querySelector("#newMonthBanner"),
  newMonthBannerText: document.querySelector("#newMonthBannerText"),
  newMonthBannerAdd: document.querySelector("#newMonthBannerAdd"),
  newMonthBannerDismiss: document.querySelector("#newMonthBannerDismiss"),
  declarationsPanel: document.querySelector("#declarationsPanel"),
  declarationsBadge: document.querySelector("#declarationsBadge"),
  declarationsList: document.querySelector("#declarationsList"),
  pollList: document.querySelector("#pollList"),
  createPollButton: document.querySelector("#createPollButton"),
  pollDialog: document.querySelector("#pollDialog"),
  pollForm: document.querySelector("#pollForm"),
  pollTitleInput: document.querySelector("#pollTitleInput"),
  pollDescInput: document.querySelector("#pollDescInput"),
  closePollDialog: document.querySelector("#closePollDialog"),
  cancelPollButton: document.querySelector("#cancelPollButton"),
  buildingProjectList: document.querySelector("#buildingProjectList"),
  createProjectButton: document.querySelector("#createProjectButton"),
  projectDialog: document.querySelector("#projectDialog"),
  closeProjectDialog: document.querySelector("#closeProjectDialog"),
  cancelProjectButton: document.querySelector("#cancelProjectButton"),
  projectForm: document.querySelector("#projectForm"),
  projectNameInput: document.querySelector("#projectNameInput"),
  projectDescInput: document.querySelector("#projectDescInput"),
  projectBudgetInput: document.querySelector("#projectBudgetInput"),
  projectDueDateInput: document.querySelector("#projectDueDateInput"),
  projectDistributionInput: document.querySelector("#projectDistributionInput"),
  projectSharePreview: document.querySelector("#projectSharePreview"),
  projectSubmitButton: document.querySelector("#projectSubmitButton"),
  runWizardButton: document.querySelector("#runWizardButton"),
  setupWizardDialog: document.querySelector("#setupWizardDialog"),
  wizardStep1: document.querySelector("#wizardStep1"),
  wizardStep2: document.querySelector("#wizardStep2"),
  wizardStep3: document.querySelector("#wizardStep3"),
  wizardDot1: document.querySelector("#wizardDot1"),
  wizardDot2: document.querySelector("#wizardDot2"),
  wizardDot3: document.querySelector("#wizardDot3"),
  wizardBuildingName: document.querySelector("#wizardBuildingName"),
  wizardOwnerPassword: document.querySelector("#wizardOwnerPassword"),
  wizardMonthlyBudget: document.querySelector("#wizardMonthlyBudget"),
  wizardLbpRate: document.querySelector("#wizardLbpRate"),
  wizardTenantList: document.querySelector("#wizardTenantList"),
  wizardTenantName: document.querySelector("#wizardTenantName"),
  wizardTenantUnit: document.querySelector("#wizardTenantUnit"),
  wizardTenantPhone: document.querySelector("#wizardTenantPhone"),
  wizardTenantPin: document.querySelector("#wizardTenantPin"),
  wizardTenantCoeff: document.querySelector("#wizardTenantCoeff"),
  wizardCoeffStatus: document.querySelector("#wizardCoeffStatus"),
  wizardStep1Next: document.querySelector("#wizardStep1Next"),
  wizardStep2Prev: document.querySelector("#wizardStep2Prev"),
  wizardStep2Next: document.querySelector("#wizardStep2Next"),
  wizardStep3Prev: document.querySelector("#wizardStep3Prev"),
  wizardAddTenantBtn: document.querySelector("#wizardAddTenantBtn"),
  wizardCancelEditBtn: document.querySelector("#wizardCancelEditBtn"),
  wizardFinishBtn: document.querySelector("#wizardFinishBtn"),
  sharedExpensesPanel: document.querySelector("#sharedExpensesPanel"),
  sharedExpensesRate: document.querySelector("#sharedExpensesRate"),
  sharedExpensesProgress: document.querySelector("#sharedExpensesProgress"),
  sharedExpensesBar: document.querySelector("#sharedExpensesBar"),
  sharedExpensesList: document.querySelector("#sharedExpensesList"),
  paymentSharedExpensesSection: document.querySelector("#paymentSharedExpensesSection"),
  paymentSharedExpensesRate: document.querySelector("#paymentSharedExpensesRate"),
  paymentSharedExpensesProgress: document.querySelector("#paymentSharedExpensesProgress"),
  paymentSharedExpensesBar: document.querySelector("#paymentSharedExpensesBar"),
  paymentSharedExpensesList: document.querySelector("#paymentSharedExpensesList"),
  paymentSharedSummary: document.querySelector("#paymentSharedSummary"),
  paymentSharedSummaryLabel: document.querySelector("#paymentSharedSummaryLabel"),
  paymentPaidCount: document.querySelector("#paymentPaidCount"),
  paymentSharedPaidCount: document.querySelector("#paymentSharedPaidCount"),
  sharedExpensesEnabledToggle: document.querySelector("#sharedExpensesEnabledToggle"),
  transactionDistribution: document.querySelector("#transactionDistribution"),
  sharedExpenseInlinePreview: document.querySelector("#sharedExpenseInlinePreview"),
  collectionModeInput: document.querySelector("#collectionModeInput"),
  collectionModeNote: document.querySelector("#collectionModeNote"),
  monthlyBudgetField: document.querySelector("#monthlyBudgetField"),
  removeOwnerPasswordButton: document.querySelector("#removeOwnerPasswordButton"),
  removeTenantPinButton: document.querySelector("#removeTenantPinButton"),
  wizardCollectionMode: document.querySelector("#wizardCollectionMode"),
  wizardCollectionModeNote: document.querySelector("#wizardCollectionModeNote"),
  wizardBudgetField: document.querySelector("#wizardBudgetField"),
  tenantBreakerInput: document.querySelector("#tenantBreakerInput"),
  addGeneratorBillButton: document.querySelector("#addGeneratorBillButton"),
  generatorBillList: document.querySelector("#generatorBillList"),
  generatorBillDialog: document.querySelector("#generatorBillDialog"),
  generatorBillDialogTitle: document.querySelector("#generatorBillDialogTitle"),
  generatorBillForm: document.querySelector("#generatorBillForm"),
  closeGeneratorBillDialog: document.querySelector("#closeGeneratorBillDialog"),
  cancelGeneratorBillButton: document.querySelector("#cancelGeneratorBillButton"),
  generatorBillMonth: document.querySelector("#generatorBillMonth"),
  generatorPoolsSummary: document.querySelector("#generatorPoolsSummary"),
  generatorReadingRows: document.querySelector("#generatorReadingRows"),
  transactionService: document.querySelector("#transactionService"),
  transactionServicePart: document.querySelector("#transactionServicePart"),
  transactionServiceSplit: document.querySelector("#transactionServiceSplit"),
  generatorBillPreview: document.querySelector("#generatorBillPreview"),
  generatorBillSubmitButton: document.querySelector("#generatorBillSubmitButton"),
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
let sessionMode = null; // "owner" | "tenant"
let newMonthBannerDismissed = false;
let wizardTenants = [];
let wizardEditingIdx = null;
let sessionTenantId = null;

const numberFormat = new Intl.NumberFormat("en-US");
const usdFormat = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const DEFAULT_LBP_PER_USD = 89500;
const SYNC_META_KEY = "building-account-tracker:sync";
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

// Synchronous SHA-256 (no crypto.subtle, so it also works on plain-http LAN testing).
const SHA256_K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
];

function sha256Hex(message) {
  const bytes = new TextEncoder().encode(String(message));
  const bitLen = bytes.length * 8;
  const padded = new Uint8Array((((bytes.length + 8) >> 6) << 6) + 64);
  padded.set(bytes);
  padded[bytes.length] = 0x80;
  const dv = new DataView(padded.buffer);
  dv.setUint32(padded.length - 4, bitLen >>> 0);
  dv.setUint32(padded.length - 8, Math.floor(bitLen / 0x100000000));
  const H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
  const w = new Array(64);
  const rotr = (x, n) => (x >>> n) | (x << (32 - n));
  for (let i = 0; i < padded.length; i += 64) {
    for (let t = 0; t < 16; t += 1) w[t] = dv.getUint32(i + t * 4);
    for (let t = 16; t < 64; t += 1) {
      const s0 = rotr(w[t - 15], 7) ^ rotr(w[t - 15], 18) ^ (w[t - 15] >>> 3);
      const s1 = rotr(w[t - 2], 17) ^ rotr(w[t - 2], 19) ^ (w[t - 2] >>> 10);
      w[t] = (w[t - 16] + s0 + w[t - 7] + s1) >>> 0;
    }
    let [a, b, c, d, e, f, g, h] = H;
    for (let t = 0; t < 64; t += 1) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const t1 = (h + S1 + ch + SHA256_K[t] + w[t]) >>> 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + maj) >>> 0;
      h = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0;
    }
    H[0] = (H[0] + a) >>> 0; H[1] = (H[1] + b) >>> 0; H[2] = (H[2] + c) >>> 0; H[3] = (H[3] + d) >>> 0;
    H[4] = (H[4] + e) >>> 0; H[5] = (H[5] + f) >>> 0; H[6] = (H[6] + g) >>> 0; H[7] = (H[7] + h) >>> 0;
  }
  return H.map((x) => x.toString(16).padStart(8, "0")).join("");
}

function hashSecret(value, salt) {
  return sha256Hex(`${salt}:${value}`);
}

function randomToken() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}-${Math.random().toString(36).slice(2, 10)}`;
}

function loadSyncMeta() {
  try {
    return JSON.parse(localStorage.getItem(SYNC_META_KEY)) || {};
  } catch {
    return {};
  }
}

function saveSyncMeta(meta) {
  localStorage.setItem(SYNC_META_KEY, JSON.stringify(meta));
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
  state.meta = state.meta || {};
  state.meta.rev = Number(state.meta.rev || 0) + 1;
  state.meta.updatedAt = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  if (options.sync !== false) queueCloudSave();
}

function hydrateState(rawState) {
  const hydrated = clone(rawState);
  hydrated.settings ||= {};
  if (hydrated.settings.defaultDueUsd === undefined) hydrated.settings.defaultDueUsd = getSeedDefaultDue(hydrated);
  if (hydrated.settings.lbpPerUsd === undefined) hydrated.settings.lbpPerUsd = DEFAULT_LBP_PER_USD;
  hydrated.settings.invoiceUploadUrl ||= "";
  hydrated.settings.cloudSpreadsheetId ||= "";
  hydrated.settings.invoiceUploadFolderId ||= "";
  hydrated.settings.syncSecret ||= "";
  hydrated.settings.collectionMode = hydrated.settings.collectionMode === "fixed" ? "fixed" : "actual";
  hydrated.meta ||= {};
  hydrated.meta.rev = Number(hydrated.meta.rev || 0);
  hydrated.meta.epoch = Number(hydrated.meta.epoch || 0);
  hydrated.meta.token ||= "";
  hydrated.meta.updatedAt ||= "";
  hydrated.deleted ||= {};
  hydrated.deleted.transactions ||= [];
  hydrated.deleted.tenants ||= [];
  hydrated.deleted.polls ||= [];
  hydrated.deleted.projects ||= [];
  hydrated.security ||= {};
  hydrated.security.salt ||= randomToken();
  hydrated.transactions ||= [];
  // Migrate plaintext owner password / tenant PINs to salted hashes (v112).
  if (hydrated.settings.ownerPassword) {
    hydrated.settings.ownerPasswordHash = hashSecret(hydrated.settings.ownerPassword, hydrated.security.salt);
  }
  delete hydrated.settings.ownerPassword;
  hydrated.settings.ownerPasswordHash ||= "";
  hydrated.tenants ||= [];
  hydrated.tenants.forEach((tenant) => {
    tenant.phone ||= "";
    tenant.coefficient ||= 0;
    tenant.breakerAmps ||= 0;
    if (tenant.pin) tenant.pinHash = hashSecret(tenant.pin, hydrated.security.salt);
    delete tenant.pin;
    tenant.pinHash ||= "";
  });
  hydrated.projects ||= [];
  hydrated.suppliers ||= [];
  hydrated.expenseCategories ||= [];
  hydrated.building ||= {};
  hydrated.polls ||= [];
  hydrated.paymentDeclarations ||= [];
  hydrated.sharedExpenses ||= [];
  hydrated.buildingProjects ||= [];
  hydrated.serviceReadings ||= [];
  hydrated.settings.sharedExpensesEnabled = false; // v108: merged into unified Expenses model
  if (hydrated.setupComplete === undefined) {
    hydrated.setupComplete = Boolean(
      hydrated.building && hydrated.building.name &&
      hydrated.tenants && hydrated.tenants.length > 0
    );
  }
  // Legacy (v107) "Services Expenses" had no serviceType — fold those into Expenses.
  // The current Services Expenses model is identified by a serviceType.
  hydrated.transactions = hydrated.transactions.map((t) =>
    t.category === "Services Expenses" && !t.serviceType ? { ...t, category: "Expenses" } : t
  );
  // v116: legacy single-transaction generator bills (v113–v115, identified by a
  // .generator object) are replaced by the Services Expenses + meter-reading
  // model. They were test-only; tombstone and drop them so books stay consistent.
  hydrated.transactions
    .filter((t) => t.serviceType && t.generator)
    .forEach((t) => { if (!hydrated.deleted.transactions.includes(t.id)) hydrated.deleted.transactions.push(t.id); });
  hydrated.transactions = hydrated.transactions.filter((t) => !(t.serviceType && t.generator));
  const deletedTx = new Set(hydrated.deleted.transactions);
  const deletedTenants = new Set(hydrated.deleted.tenants);
  const deletedPolls = new Set(hydrated.deleted.polls);
  const deletedProjects = new Set(hydrated.deleted.projects);
  hydrated.transactions = hydrated.transactions.filter((t) => !deletedTx.has(t.id));
  hydrated.tenants = hydrated.tenants.filter((t) => !deletedTenants.has(t.id));
  hydrated.polls = hydrated.polls.filter((p) => !deletedPolls.has(p.id));
  hydrated.buildingProjects = hydrated.buildingProjects.filter((p) => !deletedProjects.has(p.id));
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
  state.transactions.forEach((transaction) => {
    if (transaction.forMonth) months.add(transaction.forMonth);
    if (transaction.date) months.add(monthIso(monthKey(transaction.date)));
  });
  return [...months].filter(Boolean).sort();
}

// ── Live-expenses model ──────────────────────────────────────────────────────
function getTotalActiveCoefficient() {
  return state.tenants.filter((t) => t.active !== false).reduce((s, t) => s + (t.coefficient || 0), 0);
}

function getTenantExpenseShareForTransaction(tenantId, transaction) {
  // Prefer the share split snapshotted when the expense was recorded, so later
  // tenant/coefficient changes do not retroactively shift historical balances.
  if (transaction.shares) return roundUsd(Number(transaction.shares[tenantId] || 0));
  const activeTenants = state.tenants.filter((t) => t.active !== false);
  if (!activeTenants.length) return 0;
  const totalUsd = toUsd(Number(transaction.debitUsd || 0), Number(transaction.debitLbp || 0));
  if (!totalUsd) return 0;
  const coeffSum = activeTenants.reduce((s, t) => s + (t.coefficient || 0), 0);
  const tenant = activeTenants.find((t) => t.id === tenantId);
  if (!tenant) return 0;
  if (coeffSum > 0) return roundUsd(totalUsd * ((tenant.coefficient || 0) / coeffSum));
  return roundUsd(totalUsd / activeTenants.length);
}

function getTenantExpenseShare(tenantId, month = null) {
  return roundUsd(
    state.transactions
      .filter((t) => {
        if (t.category !== "Expenses") return false;
        if (t.serviceType) return false; // services (e.g. generator) are billed separately
        if (month && monthKey(t.date || t.forMonth || "") !== monthKey(month)) return false;
        return true;
      })
      .reduce((sum, t) => sum + getTenantExpenseShareForTransaction(tenantId, t), 0),
  );
}

// Services (generator, water, …) are billed to tenants by their own rules and
// shown as a distinct line, never folded into the general expense share. Each
// month's accumulated service expenses are split once meter readings exist for
// that month (see computeServiceDistribution).
const SERVICE_TYPES = ["generator", "water"];

function getTenantServicesDue(tenantId, { serviceType = null, month = null } = {}) {
  let total = 0;
  const want = (st) => !serviceType || serviceType === st;
  // Generator: split via the monthly meter-reading distribution.
  if (want("generator")) {
    getServiceMonths("generator").forEach((m) => {
      if (month && monthKey(m) !== monthKey(month)) return;
      total += Number(computeServiceDistribution("generator", m).shares[tenantId] || 0);
    });
  }
  // Water: each tanker carries its own snapshotted share split (equal/coefficient).
  if (want("water")) {
    state.transactions.forEach((t) => {
      if (t.category !== "Services Expenses" || t.serviceType !== "water") return;
      if (month && monthKey(t.forMonth || t.date || "") !== monthKey(month)) return;
      total += getTenantExpenseShareForTransaction(tenantId, t);
    });
  }
  return roundUsd(total);
}

function getTenantPaymentsTotal(tenantId, month = null) {
  return roundUsd(
    state.transactions
      .filter((t) => {
        if (t.category !== "Payments") return false;
        if (t.tenantId !== tenantId) return false;
        if (t.project) return false;
        if (month && monthKey(t.date || t.forMonth || "") !== monthKey(month)) return false;
        return true;
      })
      .reduce((sum, t) => sum + transactionNetUsd(t), 0),
  );
}

// ── Collection mode ──────────────────────────────────────────────────────────
// "actual": tenants owe their share of recorded expenses (live-expenses model).
// "fixed": tenants owe the configured monthly amount; surplus builds the reserve fund.
function isFixedMode() {
  return state?.settings?.collectionMode === "fixed";
}

function getMonthlyDueForTenant(tenantId, month) {
  if (isFixedMode()) return roundUsd(getExpectedForTenant(tenantId, month));
  return getTenantExpenseShare(tenantId, month);
}

function getTenantFixedDueTotal(tenantId) {
  return roundUsd(
    state.monthlyExpected
      .filter((entry) => isCurrentOrPastMonth(entry.month))
      .reduce((sum, entry) => sum + getExpectedForTenant(tenantId, entry.month), 0),
  );
}

function getTenantDueBasisTotal(tenantId) {
  return isFixedMode() ? getTenantFixedDueTotal(tenantId) : getTenantExpenseShare(tenantId);
}

function getTenantOpeningNet(tenantId) {
  // Net of tenant-tied Opening Balance entries: debit = tenant owes (carry-in
  // arrears), credit = prepaid credit. These adjust the tenant balance only —
  // they are receivables/liabilities, not building cash.
  return roundUsd(
    state.transactions
      .filter((t) => t.category === "Opening Balance" && t.tenantId === tenantId)
      .reduce((sum, t) => sum + transactionNetUsd(t), 0),
  );
}

function getTenantBalance(tenantId) {
  // Positive = tenant owes money; negative = credit
  return roundUsd(
    getTenantDueBasisTotal(tenantId) +
      getTenantServicesDue(tenantId) -
      getTenantPaymentsTotal(tenantId) -
      getTenantOpeningNet(tenantId),
  );
}

function getTenantExpensesByCategory(tenantId, month = null) {
  const map = new Map();
  state.transactions
    .filter((t) => {
      if (t.category !== "Expenses") return false;
      if (t.serviceType) return false; // services shown separately, not in expense breakdown
      if (month && monthKey(t.date || t.forMonth || "") !== monthKey(month)) return false;
      return true;
    })
    .forEach((t) => {
      const cat = t.expenseCategory || "General";
      const share = getTenantExpenseShareForTransaction(tenantId, t);
      if (share > 0) map.set(cat, (map.get(cat) || 0) + share);
    });
  return map;
}
function getMonthEndDate(monthIso) {
  const [year, month] = monthIso.split("-").map(Number);
  const lastDay = new Date(year, month, 0).getDate();
  return `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
}

function getLastCompletedMonth() {
  const today = new Date();
  const m = today.getMonth(); // 0-indexed
  if (m === 0) return `${today.getFullYear() - 1}-12-01`;
  return `${today.getFullYear()}-${String(m).padStart(2, "0")}-01`;
}

function getTenantMonthEndBalance(tenantId, monthIso) {
  const endDate = getMonthEndDate(monthIso);
  const dues = isFixedMode()
    ? state.monthlyExpected
        .filter((entry) => monthKey(entry.month) <= monthKey(monthIso))
        .reduce((sum, entry) => sum + getExpectedForTenant(tenantId, entry.month), 0)
    : state.transactions
        .filter((t) => t.category === "Expenses" && !t.serviceType && t.date && t.date <= endDate)
        .reduce((sum, t) => sum + getTenantExpenseShareForTransaction(tenantId, t), 0);
  // Services (generator, water) are owed in both collection modes — count any
  // distributed service activity up to and including this statement month.
  let services = 0;
  getServiceMonths("generator").forEach((m) => {
    if (monthKey(m) <= monthKey(monthIso)) services += Number(computeServiceDistribution("generator", m).shares[tenantId] || 0);
  });
  state.transactions.forEach((t) => {
    if (t.category !== "Services Expenses" || t.serviceType !== "water") return;
    if (monthKey(t.forMonth || t.date || "") <= monthKey(monthIso)) services += getTenantExpenseShareForTransaction(tenantId, t);
  });
  const payments = state.transactions
    .filter((t) => t.category === "Payments" && t.tenantId === tenantId && !t.project && t.date && t.date <= endDate)
    .reduce((sum, t) => sum + transactionNetUsd(t), 0);
  const openingNet = state.transactions
    .filter((t) => t.category === "Opening Balance" && t.tenantId === tenantId && (!t.date || t.date <= endDate))
    .reduce((sum, t) => sum + transactionNetUsd(t), 0);
  return roundUsd(dues + services - payments - openingNet);
}

function getTenantStatementHasBasis() {
  return (
    (isFixedMode() ? state.monthlyExpected.length > 0 : state.transactions.some((t) => t.category === "Expenses" && !t.serviceType)) ||
    state.transactions.some((t) => t.category === "Services Expenses") ||
    (state.serviceReadings || []).length > 0
  );
}

function getTenantStatementNotification(tenantId) {
  if (!getTenantStatementHasBasis()) return null;
  const lastMonth = getLastCompletedMonth();
  const statementBalance = getTenantMonthEndBalance(tenantId, lastMonth);
  if (statementBalance <= 0.005) return null;
  const endDate = getMonthEndDate(lastMonth);
  const paidSince = roundUsd(
    state.transactions
      .filter((t) => t.category === "Payments" && t.tenantId === tenantId && !t.project && t.date && t.date > endDate)
      .reduce((sum, t) => sum + transactionNetUsd(t), 0),
  );
  const remaining = roundUsd(statementBalance - paidSince);
  if (remaining <= 0.005) return null;
  return { month: lastMonth, statementBalance, paidSince, remaining };
}

// ────────────────────────────────────────────────────────────────────────────

function getExpectedMonthlyUsd(month) {
  const configured = state.monthlyExpected.find((entry) => entry.month === month);
  if (configured && Number(configured.expectedUsd || 0) > 0) return Number(configured.expectedUsd || 0);
  return Number(state.settings.defaultDueUsd || 0);
}

function getExpectedForTenant(tenantId, month) {
  const total = getExpectedMonthlyUsd(month);
  if (!total) return 0;
  const tenant = state.tenants.find((t) => t.id === tenantId);
  if (tenant && tenant.coefficient > 0) return roundUsd(total * (tenant.coefficient / 1000));
  return total;
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

function getTenantTotals(tenantId) {
  const balance = getTenantBalance(tenantId);
  const projectOutstanding = getTenantProjectOutstanding(tenantId);
  return {
    paidUsd: getTenantPaymentsTotal(tenantId),
    advanceUsd: Math.max(0, -balance),
    dueUsd: roundUsd(Math.max(0, balance) + projectOutstanding),
  };
}

function getTenantSharedOutstanding(tenantId) {
  if (!state.settings?.sharedExpensesEnabled) return 0;
  const byMonth = new Map();
  (state.sharedExpenses || []).forEach((se) => {
    if (se.forMonth) {
      byMonth.set(se.forMonth, (byMonth.get(se.forMonth) || 0) + Number(se.shares?.[tenantId] || 0));
    } else {
      // Legacy: no forMonth, fall back to manual collections
      const owed = Number(se.shares?.[tenantId] || 0);
      const collected = Number(se.collections?.[tenantId] || 0);
      byMonth.set(`legacy-${se.id}`, Math.max(0, owed - collected));
    }
  });
  let total = 0;
  byMonth.forEach((totalShare, key) => {
    if (key.startsWith("legacy-")) { total += totalShare; return; }
    const month = key;
    const rent = getExpectedForTenant(tenantId, month);
    const rawPaid = getRawPaidForMonth(tenantId, month).usd;
    const excessOverRent = Math.max(0, rawPaid - rent);
    total += Math.max(0, totalShare - excessOverRent);
  });
  return roundUsd(total);
}

function getExplicitAdvanceBalance(tenantId) {
  return roundUsd(
    state.transactions
      .filter((t) => t.tenantId === tenantId && t.category === "Advance Payments")
      .reduce((sum, t) => sum + transactionNetUsd(t), 0),
  );
}

function getRawPaidForProject(tenantId, projectName) {
  return roundUsd(
    state.transactions
      .filter((t) => t.category === "Payments" && t.tenantId === tenantId && t.project === projectName)
      .reduce((sum, t) => sum + transactionNetUsd(t), 0),
  );
}

function getProjectTenantStatus(project, tenantId) {
  const share = roundUsd(Number(project.shares?.[tenantId] || 0));
  const paid = getRawPaidForProject(tenantId, project.name);
  if (!share) return { share: 0, paid: 0, label: "No share", className: "none" };
  if (paid >= share - 0.005) return { share, paid, label: "Paid", className: "paid" };
  if (paid > 0) return { share, paid, label: "Partial", className: "partial" };
  return { share, paid, label: "Due", className: "due" };
}

function getTenantProjectOutstanding(tenantId) {
  return roundUsd(
    (state.buildingProjects || [])
      .filter((p) => p.status !== "completed")
      .reduce((sum, project) => {
        const share = roundUsd(Number(project.shares?.[tenantId] || 0));
        const paid = getRawPaidForProject(tenantId, project.name);
        return sum + Math.max(0, share - paid);
      }, 0),
  );
}

function updateProjectSharePreview() {
  const budget = Number(els.projectBudgetInput.value || 0);
  const distribution = els.projectDistributionInput.value;
  if (budget <= 0) {
    els.projectSharePreview.classList.add("hidden");
    els.projectSharePreview.replaceChildren();
    return;
  }
  const shares = computeSharedExpenseShares(budget, distribution);
  const activeTenants = state.tenants.filter((t) => t.active !== false);
  const rows = activeTenants.map((t) => {
    const share = shares[t.id] || 0;
    const pct = budget > 0 ? Math.round((share / budget) * 100) : 0;
    const row = document.createElement("div");
    row.className = "se-preview-row";
    const name = document.createElement("span");
    name.textContent = t.name;
    const amount = document.createElement("span");
    amount.className = "se-preview-amount";
    amount.textContent = `${formatUsd(share)} (${pct}%)`;
    row.append(name, amount);
    return row;
  });
  els.projectSharePreview.replaceChildren(...rows);
  els.projectSharePreview.classList.remove("hidden");
}

function openCreateProjectDialog() {
  els.projectForm.reset();
  els.projectDueDateInput.value = localDateInput();
  els.projectSharePreview.classList.add("hidden");
  els.projectSharePreview.replaceChildren();
  openDialog(els.projectDialog);
  setTimeout(() => els.projectNameInput.focus(), 50);
}

function submitProject(event) {
  event.preventDefault();
  const name = els.projectNameInput.value.trim();
  const description = els.projectDescInput.value.trim();
  const totalBudget = Number(els.projectBudgetInput.value || 0);
  const dueDate = els.projectDueDateInput.value;
  const distribution = els.projectDistributionInput.value;
  if (!name) { showToast("Enter a project name"); return; }
  if (!totalBudget) { showToast("Enter the total budget"); return; }
  if (!dueDate) { showToast("Select a payment due date"); return; }
  const shares = computeSharedExpenseShares(totalBudget, distribution);
  const project = {
    id: `bp-${Date.now()}`,
    name,
    description,
    totalBudget,
    dueDate,
    distribution,
    shares,
    status: "active",
    createdAt: new Date().toISOString(),
  };
  (state.buildingProjects ||= []).push(project);
  addKnownValue(state.projects, name);
  saveState();
  closeDialog(els.projectDialog);
  renderAll();
  showToast("Project created");
}

function deleteProject(projectId) {
  const project = (state.buildingProjects || []).find((p) => p.id === projectId);
  if (!project) return;
  if (!window.confirm(`Delete project "${project.name}"? Payment transactions linked to this project will remain in the ledger.`)) return;
  state.buildingProjects = state.buildingProjects.filter((p) => p.id !== projectId);
  recordDeletedId("projects", projectId);
  saveState();
  renderAll();
  showToast("Project deleted");
}

function openCollectForProject(project) {
  resetTransactionForm();
  els.transactionProject.value = project.name;
  syncTransactionFormMode();
  openDialog(els.transactionDialog);
  setTimeout(() => els.transactionTenant.focus(), 50);
}

function renderProjects() {
  const projects = state.buildingProjects || [];
  if (!projects.length) {
    const empty = document.createElement("p");
    empty.className = "settings-note";
    empty.textContent = sessionMode === "owner"
      ? "No projects yet. Create one with the + New button."
      : "No active projects.";
    els.buildingProjectList.replaceChildren(empty);
    return;
  }
  const activeTenants = state.tenants.filter((t) => t.active !== false);
  els.buildingProjectList.replaceChildren(
    ...projects.map((project) => {
      const tenantStatuses = activeTenants
        .map((tenant) => ({ tenant, ...getProjectTenantStatus(project, tenant.id) }))
        .filter((s) => s.share > 0);
      const totalCollected = tenantStatuses.reduce((s, ts) => s + ts.paid, 0);
      const totalBudget = Number(project.totalBudget || 0);
      const rate = totalBudget > 0 ? Math.min(100, Math.round((totalCollected / totalBudget) * 100)) : 0;

      const card = document.createElement("div");
      card.className = "project-card";

      // Header row
      const header = document.createElement("div");
      header.className = "project-card-header";
      const info = document.createElement("div");
      const title = document.createElement("strong");
      title.className = "project-card-title";
      title.textContent = project.name;
      const meta = document.createElement("div");
      meta.className = "project-card-meta";
      const metaParts = [`${formatUsd(totalBudget)} budget`, `Due ${formatDateLabel(project.dueDate)}`];
      if (project.description) metaParts.unshift(project.description);
      meta.textContent = metaParts.join(" · ");
      info.append(title, meta);
      const actions = document.createElement("div");
      actions.className = "project-card-actions";
      const rateSpan = document.createElement("span");
      rateSpan.className = "project-rate";
      rateSpan.textContent = `${rate}%`;
      actions.append(rateSpan);
      if (sessionMode === "owner") {
        const hasDue = tenantStatuses.some(({ share, paid }) => paid < share - 0.005);
        if (hasDue) {
          const remindBtn = document.createElement("button");
          remindBtn.type = "button";
          remindBtn.className = "mini-button whatsapp-btn remind-project-btn";
          remindBtn.dataset.projectId = project.id;
          remindBtn.textContent = "Remind";
          actions.append(remindBtn);
        }
        const collectBtn = document.createElement("button");
        collectBtn.type = "button";
        collectBtn.className = "mini-button collect-project-btn";
        collectBtn.dataset.projectId = project.id;
        collectBtn.textContent = "Collect";
        const deleteBtn = document.createElement("button");
        deleteBtn.type = "button";
        deleteBtn.className = "icon-button small delete-project-btn";
        deleteBtn.dataset.projectId = project.id;
        deleteBtn.title = "Delete project";
        deleteBtn.textContent = "×";
        actions.append(collectBtn, deleteBtn);
      }
      header.append(info, actions);

      // Progress bar
      const track = document.createElement("div");
      track.className = "progress-track";
      const bar = document.createElement("div");
      bar.className = "progress-bar";
      bar.style.width = `${rate}%`;
      track.append(bar);

      // Collected / budget summary
      const summary = document.createElement("div");
      summary.className = "project-collected-summary";
      summary.textContent = `${formatUsd(totalCollected)} collected of ${formatUsd(totalBudget)}`;

      // Tenant status grid
      const grid = document.createElement("div");
      grid.className = "tenant-status-grid";
      tenantStatuses.forEach(({ tenant, share, paid, label, className }) => {
        const statusCard = document.createElement("article");
        statusCard.className = "status-card";
        statusCard.innerHTML = `<strong></strong><span></span><div class="status-pill"></div>`;
        statusCard.querySelector("strong").textContent = tenant.name;
        statusCard.querySelector("span").textContent = `${formatUsd(paid)} / ${formatUsd(share)}`;
        const pill = statusCard.querySelector(".status-pill");
        pill.classList.add(`status-${className === "none" ? "due" : className}`);
        pill.textContent = label;
        grid.append(statusCard);
      });

      card.append(header, track, summary, grid);
      return card;
    }),
  );
}

// ── Services tab (generator) ─────────────────────────────────────────────────
// Generator costs are logged progressively as "Services Expenses" transactions
// (fuel + maintenance). Each month's pools are summed live; once the owner enters
// that month's meter readings, fuel is split by metered kWh and maintenance by
// breaker amps. The split is computed live, so a late expense is reflected
// automatically without re-running anything.
function getServiceMonths(serviceType) {
  const set = new Set();
  state.transactions.forEach((t) => {
    if (t.category === "Services Expenses" && t.serviceType === serviceType && t.forMonth) set.add(t.forMonth);
  });
  (state.serviceReadings || []).forEach((r) => {
    if (r.serviceType === serviceType && r.forMonth) set.add(r.forMonth);
  });
  return [...set].sort();
}

function getServiceMonthPools(serviceType, month) {
  let fuelUsd = 0, maintenanceUsd = 0, fuelCount = 0, maintCount = 0;
  state.transactions.forEach((t) => {
    if (t.category !== "Services Expenses" || t.serviceType !== serviceType) return;
    if (monthKey(t.forMonth || t.date || "") !== monthKey(month)) return;
    const amt = toUsd(Number(t.debitUsd || 0), Number(t.debitLbp || 0));
    if (t.servicePart === "maintenance") { maintenanceUsd += amt; maintCount += 1; }
    else { fuelUsd += amt; fuelCount += 1; }
  });
  return {
    fuelUsd: roundUsd(fuelUsd),
    maintenanceUsd: roundUsd(maintenanceUsd),
    totalUsd: roundUsd(fuelUsd + maintenanceUsd),
    fuelCount,
    maintCount,
  };
}

function getServiceReadingRecord(serviceType, month) {
  return (state.serviceReadings || []).find(
    (r) => r.serviceType === serviceType && monthKey(r.forMonth) === monthKey(month),
  ) || null;
}

function computeServiceDistribution(serviceType, month) {
  const pools = getServiceMonthPools(serviceType, month);
  const rec = getServiceReadingRecord(serviceType, month);
  if (!rec) return { pools, distributed: false, lines: {}, shares: {}, totalKwh: 0 };
  const ids = Object.keys(rec.lines || {});
  const kwhById = {};
  ids.forEach((id) => {
    const l = rec.lines[id];
    kwhById[id] = Math.max(0, roundKwh(Number(l.currentReading || 0) - Number(l.previousReading || 0)));
  });
  const consShares = allocateByWeight(pools.fuelUsd, ids.map((id) => ({ id, weight: kwhById[id] })));
  const maintShares = allocateByWeight(pools.maintenanceUsd, ids.map((id) => ({ id, weight: Number(rec.lines[id].breakerAmps || 0) })));
  const lines = {};
  const shares = {};
  ids.forEach((id) => {
    const c = roundUsd(consShares[id] || 0);
    const m = roundUsd(maintShares[id] || 0);
    const total = roundUsd(c + m);
    lines[id] = {
      breakerAmps: Number(rec.lines[id].breakerAmps || 0),
      previousReading: Number(rec.lines[id].previousReading || 0),
      currentReading: Number(rec.lines[id].currentReading || 0),
      kwh: kwhById[id],
      consumptionUsd: c,
      maintenanceUsd: m,
      totalUsd: total,
    };
    shares[id] = total;
  });
  return {
    pools,
    distributed: true,
    lines,
    shares,
    totalKwh: roundKwh(Object.values(kwhById).reduce((s, v) => s + v, 0)),
  };
}

function readGeneratorFormReadings() {
  const readings = {};
  els.generatorReadingRows.querySelectorAll(".gen-reading-row").forEach((row) => {
    readings[row.dataset.tenantId] = {
      breakerAmps: Number(row.dataset.breakerAmps || 0),
      previousReading: Number(row.querySelector(".gen-prev").value || 0),
      currentReading: Number(row.querySelector(".gen-curr").value || 0),
    };
  });
  return readings;
}

function buildGeneratorReadingRows(month) {
  const activeTenants = state.tenants.filter((t) => t.active !== false);
  const existing = getServiceReadingRecord("generator", month);
  els.generatorReadingRows.replaceChildren(
    ...activeTenants.map((tenant) => {
      const saved = existing?.lines?.[tenant.id];
      const prev = saved ? Number(saved.previousReading || 0) : getPreviousMeterReading(tenant.id, month);
      const row = document.createElement("div");
      row.className = "gen-reading-row";
      row.dataset.tenantId = tenant.id;
      row.dataset.breakerAmps = String(tenant.breakerAmps || 0);
      row.innerHTML = `
        <div class="gen-reading-name"><strong></strong><span></span></div>
        <label class="gen-reading-field">Previous<input class="gen-prev" type="number" min="0" step="1" /></label>
        <label class="gen-reading-field">Current<input class="gen-curr" type="number" min="0" step="1" /></label>
      `;
      row.querySelector("strong").textContent = tenant.name;
      row.querySelector(".gen-reading-name span").textContent =
        `Unit ${tenant.unit}${tenant.breakerAmps > 0 ? ` · ${tenant.breakerAmps}A` : " · no breaker"}`;
      row.querySelector(".gen-prev").value = prev || "";
      if (saved && saved.currentReading) row.querySelector(".gen-curr").value = saved.currentReading;
      return row;
    }),
  );
}

function updateGeneratorReadingsPreview() {
  const month = monthIso(els.generatorBillMonth.value);
  const pools = getServiceMonthPools("generator", month);
  els.generatorPoolsSummary.textContent = month
    ? `Fuel ${formatUsd(pools.fuelUsd)} (${pools.fuelCount}) · Maintenance ${formatUsd(pools.maintenanceUsd)} (${pools.maintCount}) · Total ${formatUsd(pools.totalUsd)}`
    : "";
  if (pools.totalUsd <= 0) {
    els.generatorBillPreview.classList.add("hidden");
    els.generatorBillPreview.replaceChildren();
    return;
  }
  const readings = readGeneratorFormReadings();
  const ids = Object.keys(readings);
  const kwhById = {};
  ids.forEach((id) => { kwhById[id] = Math.max(0, roundKwh(readings[id].currentReading - readings[id].previousReading)); });
  const consShares = allocateByWeight(pools.fuelUsd, ids.map((id) => ({ id, weight: kwhById[id] })));
  const maintShares = allocateByWeight(pools.maintenanceUsd, ids.map((id) => ({ id, weight: readings[id].breakerAmps })));
  const tenantsById = new Map(state.tenants.map((t) => [t.id, t]));
  const rows = ids.map((id) => {
    const total = roundUsd((consShares[id] || 0) + (maintShares[id] || 0));
    const row = document.createElement("div");
    row.className = "se-preview-row";
    const name = document.createElement("span");
    name.textContent = `${tenantsById.get(id)?.name || "?"} (${kwhById[id]} kWh)`;
    const amount = document.createElement("span");
    amount.className = "se-preview-amount";
    amount.textContent = formatUsd(total);
    row.append(name, amount);
    return row;
  });
  const totalRow = document.createElement("div");
  totalRow.className = "se-preview-total";
  const tLabel = document.createElement("strong");
  tLabel.textContent = "Total billed:";
  const tVal = document.createElement("strong");
  tVal.textContent = formatUsd(pools.totalUsd);
  totalRow.append(tLabel, tVal);
  els.generatorBillPreview.replaceChildren(...rows, totalRow);
  els.generatorBillPreview.classList.remove("hidden");
}

function openGeneratorReadingsDialog(month) {
  if (sessionMode !== "owner") return;
  const activeTenants = state.tenants.filter((t) => t.active !== false);
  if (!activeTenants.length) { showToast("Add tenants before entering meter readings"); return; }
  els.generatorBillForm.reset();
  const m = month ? monthKey(month) : (selectedMonth ? monthKey(selectedMonth) : monthKey(localDateInput()));
  els.generatorBillMonth.value = m;
  buildGeneratorReadingRows(monthIso(m));
  updateGeneratorReadingsPreview();
  openDialog(els.generatorBillDialog);
}

function refreshGeneratorReadingRowsForMonth() {
  buildGeneratorReadingRows(monthIso(els.generatorBillMonth.value));
  updateGeneratorReadingsPreview();
}

function submitGeneratorReadings(event) {
  event.preventDefault();
  if (sessionMode !== "owner") return;
  const month = monthIso(els.generatorBillMonth.value);
  if (!month) { showToast("Select a month"); return; }
  const readings = readGeneratorFormReadings();
  const lines = {};
  Object.keys(readings).forEach((id) => {
    lines[id] = {
      breakerAmps: readings[id].breakerAmps,
      previousReading: readings[id].previousReading,
      currentReading: readings[id].currentReading,
    };
  });
  state.serviceReadings ||= [];
  const existing = getServiceReadingRecord("generator", month);
  if (existing) {
    existing.lines = lines;
  } else {
    state.serviceReadings.push({ id: `rdg-${Date.now()}`, serviceType: "generator", forMonth: month, lines });
  }
  saveState();
  closeDialog(els.generatorBillDialog);
  selectedMonth = month;
  renderAll();
  showToast("Meter readings saved");
}

function deleteServiceReadings(serviceType, month) {
  if (sessionMode !== "owner") return;
  if (!window.confirm(`Remove the meter readings for ${formatMonth(month)}? Tenant charges for that month's generator will be undone until you re-enter readings.`)) return;
  state.serviceReadings = (state.serviceReadings || []).filter(
    (r) => !(r.serviceType === serviceType && monthKey(r.forMonth) === monthKey(month)),
  );
  saveState();
  renderAll();
  showToast("Meter readings removed");
}

function computeWaterDistribution(month) {
  const txns = state.transactions.filter(
    (t) => t.category === "Services Expenses" && t.serviceType === "water" && monthKey(t.forMonth || t.date || "") === monthKey(month),
  );
  const totalUsd = roundUsd(txns.reduce((s, t) => s + toUsd(Number(t.debitUsd || 0), Number(t.debitLbp || 0)), 0));
  const shares = {};
  state.tenants.filter((t) => t.active !== false).forEach((t) => {
    shares[t.id] = roundUsd(txns.reduce((s, tx) => s + getTenantExpenseShareForTransaction(t.id, tx), 0));
  });
  const splits = [...new Set(txns.map((t) => t.waterSplit || "equal"))];
  const splitLabel = splits.length > 1 ? "mixed split" : splits[0] === "coefficient" ? "by coefficient" : "equal split";
  return { totalUsd, count: txns.length, shares, splitLabel };
}

function buildServiceCardShell(titleText, metaText) {
  const card = document.createElement("div");
  card.className = "project-card";
  const header = document.createElement("div");
  header.className = "project-card-header";
  const info = document.createElement("div");
  const title = document.createElement("strong");
  title.className = "project-card-title";
  title.textContent = titleText;
  const meta = document.createElement("div");
  meta.className = "project-card-meta";
  meta.textContent = metaText;
  info.append(title, meta);
  header.append(info);
  card.append(header);
  return { card, header };
}

function buildServiceLine(name, totalText, detailText) {
  const item = document.createElement("div");
  item.className = "gen-bill-line";
  const top = document.createElement("div");
  top.className = "gbl-top";
  const nameEl = document.createElement("strong");
  nameEl.textContent = name;
  const total = document.createElement("b");
  total.textContent = totalText;
  top.append(nameEl, total);
  const detail = document.createElement("span");
  detail.className = "gbl-detail";
  detail.textContent = detailText;
  item.append(top, detail);
  return item;
}

function buildGeneratorCard(month, tenantsById) {
  const dist = computeServiceDistribution("generator", month);
  const pools = dist.pools;
  const { card, header } = buildServiceCardShell(
    `Generator · ${formatMonth(month)}`,
    `Fuel ${formatUsd(pools.fuelUsd)} · Maintenance ${formatUsd(pools.maintenanceUsd)} · Total ${formatUsd(pools.totalUsd)}${dist.distributed ? ` · ${dist.totalKwh} kWh` : ""}`,
  );
  if (sessionMode === "owner") {
    const actions = document.createElement("div");
    actions.className = "project-card-actions";
    const readBtn = document.createElement("button");
    readBtn.type = "button";
    readBtn.className = "mini-button enter-readings-btn";
    readBtn.dataset.month = month;
    readBtn.textContent = dist.distributed ? "Update Readings" : "Enter Readings";
    actions.append(readBtn);
    if (dist.distributed) {
      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "icon-button small delete-readings-btn";
      delBtn.dataset.month = month;
      delBtn.title = "Remove meter readings";
      delBtn.textContent = "×";
      actions.append(delBtn);
    }
    header.append(actions);
  }
  if (!dist.distributed) {
    const note = document.createElement("p");
    note.className = "settings-note";
    note.textContent = sessionMode === "owner"
      ? "Not yet billed — enter this month's meter readings to split the costs among tenants."
      : "Not yet billed for this month.";
    card.append(note);
    return card;
  }
  const lineList = document.createElement("div");
  lineList.className = "gen-bill-lines";
  const visibleIds = sessionMode === "tenant"
    ? Object.keys(dist.lines).filter((id) => id === sessionTenantId)
    : Object.keys(dist.lines);
  visibleIds.forEach((id) => {
    const line = dist.lines[id];
    const tenant = tenantsById.get(id);
    if (!tenant && sessionMode !== "owner") return;
    lineList.append(
      buildServiceLine(
        tenant ? tenant.name : "(removed)",
        formatUsd(line.totalUsd),
        `${line.breakerAmps || 0}A · ${line.kwh || 0} kWh · ${formatUsd(line.consumptionUsd)} consumption + ${formatUsd(line.maintenanceUsd)} maintenance`,
      ),
    );
  });
  card.append(lineList);
  return card;
}

function buildWaterCard(month, tenantsById) {
  const dist = computeWaterDistribution(month);
  const { card } = buildServiceCardShell(
    `Water · ${formatMonth(month)}`,
    `${dist.count} ${dist.count === 1 ? "tanker" : "tankers"} · Total ${formatUsd(dist.totalUsd)} · ${dist.splitLabel}`,
  );
  const lineList = document.createElement("div");
  lineList.className = "gen-bill-lines";
  const visibleIds = sessionMode === "tenant"
    ? Object.keys(dist.shares).filter((id) => id === sessionTenantId)
    : Object.keys(dist.shares);
  visibleIds.forEach((id) => {
    const share = dist.shares[id] || 0;
    if (share <= 0 && sessionMode === "tenant") return;
    const tenant = tenantsById.get(id);
    const pct = dist.totalUsd > 0 ? Math.round((share / dist.totalUsd) * 100) : 0;
    lineList.append(buildServiceLine(tenant ? tenant.name : "(removed)", formatUsd(share), `${pct}% of bill`));
  });
  card.append(lineList);
  return card;
}

function renderServices() {
  const genMonths = getServiceMonths("generator");
  const waterMonths = getServiceMonths("water");
  if (!genMonths.length && !waterMonths.length) {
    const empty = document.createElement("p");
    empty.className = "settings-note";
    empty.textContent = sessionMode === "owner"
      ? "No services yet. Log generator (diesel/maintenance) or water tanker costs with the + button (choose Services Expenses). Generator is split by meter readings entered here; water is split equally or by coefficient."
      : "No services yet.";
    els.generatorBillList.replaceChildren(empty);
    return;
  }
  const tenantsById = new Map(state.tenants.map((t) => [t.id, t]));
  const cards = [
    ...genMonths.map((m) => ({ month: m, type: "generator" })),
    ...waterMonths.map((m) => ({ month: m, type: "water" })),
  ]
    .sort((a, b) => monthKey(b.month).localeCompare(monthKey(a.month)) || a.type.localeCompare(b.type))
    .map((entry) =>
      entry.type === "generator" ? buildGeneratorCard(entry.month, tenantsById) : buildWaterCard(entry.month, tenantsById),
    );
  els.generatorBillList.replaceChildren(...cards);
}

function computeSharedExpenseShares(totalUsd, distribution) {
  const activeTenants = state.tenants.filter((t) => t.active !== false);
  if (!activeTenants.length) return {};
  const shares = {};
  if (distribution === "coefficient") {
    const coeffSum = activeTenants.reduce((s, t) => s + (t.coefficient || 0), 0);
    if (coeffSum > 0) {
      let allocated = 0;
      activeTenants.forEach((t, i) => {
        if (i === activeTenants.length - 1) {
          shares[t.id] = roundUsd(totalUsd - allocated);
        } else {
          const share = roundUsd(totalUsd * ((t.coefficient || 0) / coeffSum));
          shares[t.id] = share;
          allocated += share;
        }
      });
      return shares;
    }
  }
  let allocated = 0;
  activeTenants.forEach((t, i) => {
    if (i === activeTenants.length - 1) {
      shares[t.id] = roundUsd(totalUsd - allocated);
    } else {
      const share = roundUsd(totalUsd / activeTenants.length);
      shares[t.id] = share;
      allocated += share;
    }
  });
  return shares;
}

// ── Generator service billing ────────────────────────────────────────────────
// Cost-distribution model: the recorded generator expense for a month is split
// into a maintenance part (pro-rata by breaker amps) and a consumption part
// (pro-rata by metered kWh). The building collects exactly what it spent.
function roundKwh(value) {
  return Math.round(Number(value || 0));
}

function allocateByWeight(totalUsd, weights) {
  // weights: [{ id, weight }]. Distributes totalUsd proportionally, with the
  // rounding remainder going to the last weighted entry. Falls back to an equal
  // split when no positive weights exist, so the full amount is always allocated.
  const result = {};
  weights.forEach((w) => (result[w.id] = 0));
  const total = roundUsd(totalUsd);
  if (total <= 0 || !weights.length) return result;
  const positive = weights.filter((w) => w.weight > 0);
  const pool = positive.length ? positive : weights;
  const weightSum = positive.length ? positive.reduce((s, w) => s + w.weight, 0) : pool.length;
  let allocated = 0;
  pool.forEach((w, i) => {
    if (i === pool.length - 1) {
      result[w.id] = roundUsd(total - allocated);
    } else {
      const share = roundUsd(total * ((positive.length ? w.weight : 1) / weightSum));
      result[w.id] = share;
      allocated += share;
    }
  });
  return result;
}

function getPreviousMeterReading(tenantId, beforeMonth) {
  // Most recent saved reading for this tenant, strictly before the given month;
  // falls back to 0 for the first month.
  const priors = (state.serviceReadings || [])
    .filter(
      (r) =>
        r.serviceType === "generator" &&
        r.forMonth &&
        (!beforeMonth || monthKey(r.forMonth) < monthKey(beforeMonth)),
    )
    .sort((a, b) => monthKey(b.forMonth).localeCompare(monthKey(a.forMonth)));
  for (const rec of priors) {
    const line = rec.lines?.[tenantId];
    if (line && line.currentReading !== undefined && line.currentReading !== null) {
      return Number(line.currentReading) || 0;
    }
  }
  return 0;
}

function buildSharedExpensesForMonth(month) {
  const monthExpenses = (state.sharedExpenses || []).filter(
    (se) => se.forMonth && monthKey(se.forMonth) === monthKey(month),
  );
  if (!monthExpenses.length) return null;

  const activeTenants = state.tenants.filter((t) => t.active !== false);
  const tenantStatuses = activeTenants.map((tenant) => {
    const totalShare = monthExpenses.reduce((s, se) => s + Number(se.shares?.[tenant.id] || 0), 0);
    const rent = getExpectedForTenant(tenant.id, month);
    const rawPaid = getRawPaidForMonth(tenant.id, month).usd;
    const excessOverRent = Math.max(0, rawPaid - rent);
    const covered = Math.min(excessOverRent, totalShare);
    let label, className;
    if (!totalShare) { label = "No share"; className = "none"; }
    else if (covered >= totalShare - 0.005) { label = "Paid"; className = "paid"; }
    else if (covered > 0) { label = "Partial"; className = "partial"; }
    else { label = "Due"; className = "due"; }
    return { tenant, totalShare, covered, label, className };
  }).filter((s) => s.totalShare > 0);

  const expectedTotal = tenantStatuses.reduce((s, ts) => s + ts.totalShare, 0);
  const coveredTotal = tenantStatuses.reduce((s, ts) => s + ts.covered, 0);
  const rate = expectedTotal ? Math.min(100, Math.round((coveredTotal / expectedTotal) * 100)) : 0;

  const categoryMap = new Map();
  monthExpenses.forEach((se) => {
    const cat = se.category || se.description || "Uncategorized";
    categoryMap.set(cat, (categoryMap.get(cat) || 0) + Number(se.totalUsd || 0));
  });
  const totalShared = [...categoryMap.values()].reduce((s, v) => s + v, 0);

  return { rate, tenantStatuses, categoryMap, totalShared };
}

function buildSharedExpensesSummaryList({ categoryMap, totalShared }) {
  const summaryList = document.createElement("div");
  summaryList.className = "summary-list";
  [...categoryMap.entries()].forEach(([cat, amount]) => {
    const row = document.createElement("article");
    row.className = "summary-row";
    row.innerHTML = `<div><strong></strong></div><b></b>`;
    row.querySelector("strong").textContent = cat;
    row.querySelector("b").textContent = formatUsd(amount);
    summaryList.append(row);
  });
  if (categoryMap.size > 1) {
    const totalRow = document.createElement("article");
    totalRow.className = "summary-row emphasis";
    totalRow.innerHTML = `<div><strong></strong></div><b></b>`;
    totalRow.querySelector("strong").textContent = "Total";
    totalRow.querySelector("b").textContent = formatUsd(totalShared);
    summaryList.append(totalRow);
  }
  return summaryList;
}

function renderSharedExpenses() {
  if (!state.settings?.sharedExpensesEnabled || !sessionMode) {
    els.sharedExpensesPanel.classList.add("hidden");
    return;
  }
  els.sharedExpensesPanel.classList.remove("hidden");

  const data = buildSharedExpensesForMonth(selectedMonth);
  if (!data) {
    els.sharedExpensesRate.textContent = "";
    els.sharedExpensesProgress.classList.add("hidden");
    const empty = document.createElement("p");
    empty.className = "settings-note";
    empty.textContent = selectedMonth ? `No shared expenses for ${formatMonth(selectedMonth)}.` : "No shared expenses.";
    els.sharedExpensesList.replaceChildren(empty);
    return;
  }

  els.sharedExpensesRate.textContent = `${data.rate}%`;
  els.sharedExpensesProgress.classList.remove("hidden");
  els.sharedExpensesBar.style.width = `${data.rate}%`;

  const grid = document.createElement("div");
  grid.className = "tenant-status-grid";
  data.tenantStatuses.forEach(({ tenant, totalShare, covered, label, className }) => {
    const card = document.createElement("article");
    card.className = "status-card";
    card.innerHTML = `<strong></strong><span></span><div class="status-pill"></div>`;
    card.querySelector("strong").textContent = tenant.name;
    card.querySelector("span").textContent = `${formatUsd(covered)} / ${formatUsd(totalShare)}`;
    const pill = card.querySelector(".status-pill");
    pill.classList.add(`status-${className === "none" ? "due" : className}`);
    pill.textContent = label;
    grid.append(card);
  });

  els.sharedExpensesList.replaceChildren(buildSharedExpensesSummaryList(data), grid);
}

function renderPaymentsSharedExpenses() {
  const hide = () => {
    els.paymentSharedExpensesSection.classList.add("hidden");
    els.paymentSharedSummary.classList.add("hidden");
    els.paymentSharedSummaryLabel.classList.add("hidden");
  };

  if (!state.settings?.sharedExpensesEnabled || !sessionMode) { hide(); return; }

  const data = buildSharedExpensesForMonth(selectedMonth);
  if (!data) { hide(); return; }

  // Summary KPI cards — same 4-card layout as Monthly Payments
  const expectedTotal = data.tenantStatuses.reduce((s, ts) => s + ts.totalShare, 0);
  const coveredTotal = data.tenantStatuses.reduce((s, ts) => s + ts.covered, 0);
  const dueTotal = roundUsd(expectedTotal - coveredTotal);
  const paidCount = data.tenantStatuses.filter(({ totalShare, covered }) => covered >= totalShare - 0.005).length;
  els.paymentSharedPaidCount.textContent = `${paidCount}/${data.tenantStatuses.length} paid`;

  els.paymentSharedSummary.replaceChildren(
    ...["Expected", "Collected", "Due"].map((label, i) => {
      const value = [formatUsd(expectedTotal), formatUsd(coveredTotal), formatUsd(dueTotal)][i];
      const card = document.createElement("article");
      card.className = "payment-summary-card";
      card.innerHTML = `<span></span><strong></strong>`;
      card.querySelector("span").textContent = label;
      card.querySelector("strong").textContent = value;
      return card;
    }),
  );
  els.paymentSharedSummary.classList.remove("hidden");
  els.paymentSharedSummaryLabel.classList.remove("hidden");


  // Detail section
  els.paymentSharedExpensesSection.classList.remove("hidden");
  els.paymentSharedExpensesRate.textContent = `${data.rate}%`;
  els.paymentSharedExpensesProgress.classList.remove("hidden");
  els.paymentSharedExpensesBar.style.width = `${data.rate}%`;

  const list = document.createElement("div");
  list.className = "tenant-payment-list";
  data.tenantStatuses.forEach(({ tenant, totalShare, covered, label, className }) => {
    const due = roundUsd(totalShare - covered);
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
      </div>
    `;
    row.querySelector("strong").textContent = tenant.name;
    row.querySelector(".tpr-info span").textContent = `Unit ${tenant.unit}`;
    row.querySelector(".tpr-amount").textContent = `${formatUsd(covered)} / ${formatUsd(totalShare)}`;
    const pill = row.querySelector(".status-pill");
    pill.className = `status-pill status-${className === "none" ? "due" : className}`;
    pill.textContent = label;
    row.querySelector(".tpr-detail").textContent = due > 0 ? `${formatUsd(due)} due` : "Fully paid";
    // Per-tenant WhatsApp reminder (owner only, same as Monthly Payment Status)
    if (due > 0 && sessionMode === "owner") {
      const waUrl = buildSharedExpensesWhatsAppUrl(tenant, due, selectedMonth);
      if (waUrl) {
        const waBtn = document.createElement("a");
        waBtn.className = "whatsapp-full-btn";
        waBtn.href = waUrl;
        waBtn.target = "_blank";
        waBtn.rel = "noopener";
        waBtn.textContent = "Send WhatsApp Reminder";
        row.append(waBtn);
      } else {
        const waBtn = document.createElement("button");
        waBtn.className = "whatsapp-full-btn whatsapp-no-phone";
        waBtn.type = "button";
        waBtn.textContent = "Set phone to send reminder";
        waBtn.dataset.editTenantId = tenant.id;
        row.append(waBtn);
      }
    }
    list.append(row);
  });

  els.paymentSharedExpensesList.replaceChildren(list);
}


function updateSharedExpenseInlinePreview() {
  if (els.transactionCategory.value !== "Services Expenses") return;
  const lbp = Number(els.transactionLbp.value || 0);
  const usd = Number(els.transactionUsd.value || 0);
  const totalUsd = toUsd(usd, lbp);
  const distribution = els.transactionDistribution.value;
  if (totalUsd <= 0) {
    els.sharedExpenseInlinePreview.classList.add("hidden");
    els.sharedExpenseInlinePreview.replaceChildren();
    return;
  }
  const shares = computeSharedExpenseShares(totalUsd, distribution);
  const activeTenants = state.tenants.filter((t) => t.active !== false);
  const rows = activeTenants.map((t) => {
    const share = shares[t.id] || 0;
    const pct = totalUsd > 0 ? Math.round((share / totalUsd) * 100) : 0;
    const row = document.createElement("div");
    row.className = "se-preview-row";
    const name = document.createElement("span");
    name.textContent = t.name;
    const amount = document.createElement("span");
    amount.className = "se-preview-amount";
    amount.textContent = `${formatUsd(share)} (${pct}%)`;
    row.append(name, amount);
    return row;
  });
  const totalRow = document.createElement("div");
  totalRow.className = "se-preview-total";
  const tLabel = document.createElement("strong");
  tLabel.textContent = "Total:";
  const tVal = document.createElement("strong");
  tVal.textContent = formatUsd(totalUsd);
  totalRow.append(tLabel, tVal);
  els.sharedExpenseInlinePreview.replaceChildren(...rows, totalRow);
  els.sharedExpenseInlinePreview.classList.remove("hidden");
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
      // Tenant-tied opening balances are receivables/credits, not cash.
      if (transaction.category === "Opening Balance" && transaction.tenantId) return acc;
      const netUsd = transactionNetUsd(transaction);
      acc.usd += netUsd;
      if (transaction.category === "Payments") {
        acc.paymentsUsd += netUsd;
      }
      if (transaction.category === "Advance Payments") {
        acc.advanceUsd += netUsd;
      }
      if (transaction.category === "Expenses" || transaction.category === "Services Expenses") {
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
  const activeTenants = state.tenants.filter((t) => t.active !== false);
  const tenantBalances = activeTenants.map((t) => getTenantBalance(t.id));
  const receivableUsd = roundUsd(tenantBalances.reduce((sum, b) => sum + Math.max(0, b), 0));
  const advanceLiabilityUsd = roundUsd(tenantBalances.reduce((sum, b) => sum + Math.max(0, -b), 0));
  const projectReceivable = roundUsd(activeTenants.reduce((sum, t) => sum + getTenantProjectOutstanding(t.id), 0));
  const totalReceivable = roundUsd(receivableUsd + projectReceivable);
  return {
    cashUsd: account.usd,
    receivableUsd: totalReceivable,
    advanceLiabilityUsd,
    netPositionUsd: roundUsd(account.usd + totalReceivable - advanceLiabilityUsd),
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
    {
      category: "Services Expenses",
      note: "Generator fuel and maintenance paid",
      usd: 0,
    },
  ];
  const rowByCategory = new Map(rows.map((row) => [row.sourceCategory || row.category, row]));

  state.transactions.forEach((transaction) => {
    if (!month || monthKey(transactionDateValue(transaction)) !== monthKey(month)) return;
    if (transaction.category === "Opening Balance" && transaction.tenantId) return; // not cash movement
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
  const expected = getMonthlyDueForTenant(tenantId, month);
  const rawPaid = isFixedMode() ? getRawPaidForMonth(tenantId, month).usd : getTenantPaymentsTotal(tenantId, month);
  const paid = expected > 0 ? Math.min(rawPaid, expected) : rawPaid;
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

function showLoginScreen() {
  const tenantsWithPin = state.tenants.filter((t) => t.pinHash);
  els.loginTenantSelect.replaceChildren(
    ...tenantsWithPin.map((t) => {
      const opt = document.createElement("option");
      opt.value = t.id;
      opt.textContent = `${t.name} — Unit ${t.unit}`;
      return opt;
    }),
  );
  const hasPassword = Boolean(state.settings.ownerPasswordHash);
  const hasTenants = tenantsWithPin.length > 0;
  els.loginHint.textContent = hasPassword ? "" : "No password set — press Enter to access as owner";
  els.loginHint.classList.toggle("hidden", hasPassword);
  els.loginTenantTab.classList.toggle("hidden", !hasTenants);
  els.loginScreen.classList.remove("hidden");
  document.querySelector(".app-shell").classList.add("hidden");
  els.loginPasswordInput.focus();
}

function hideLoginScreen() {
  els.loginScreen.classList.add("hidden");
  document.querySelector(".app-shell").classList.remove("hidden");
}

function applySessionMode() {
  if (sessionMode === "tenant") {
    document.body.classList.add("tenant-mode");
    els.logoutButton.classList.remove("hidden");
  } else {
    document.body.classList.remove("tenant-mode");
    els.logoutButton.classList.add("hidden");
  }
}

function attemptLogin() {
  const isOwnerTab = !els.loginOwnerForm.classList.contains("hidden");
  els.loginError.classList.add("hidden");

  if (isOwnerTab) {
    const entered = els.loginPasswordInput.value;
    const stored = state.settings.ownerPasswordHash;
    if (!stored || hashSecret(entered, state.security.salt) === stored) {
      sessionMode = "owner";
      sessionTenantId = null;
      applySessionMode();
      hideLoginScreen();
      els.loginPasswordInput.value = "";
      renderAll();
      checkSetupWizard();
    } else {
      els.loginError.textContent = "Incorrect password";
      els.loginError.classList.remove("hidden");
    }
  } else {
    const tenantId = els.loginTenantSelect.value;
    const entered = els.loginPinInput.value;
    const tenant = state.tenants.find((t) => t.id === tenantId);
    if (tenant && tenant.pinHash && hashSecret(entered, state.security.salt) === tenant.pinHash) {
      sessionMode = "tenant";
      sessionTenantId = tenantId;
      applySessionMode();
      hideLoginScreen();
      setView("dashboardView");
      renderAll();
      checkDueBanner();
      els.loginPinInput.value = "";
    } else {
      els.loginError.textContent = "Incorrect PIN";
      els.loginError.classList.remove("hidden");
    }
  }
}

function logout() {
  sessionMode = null;
  sessionTenantId = null;
  document.body.classList.remove("tenant-mode");
  els.logoutButton.classList.add("hidden");
  els.loginPasswordInput.value = "";
  els.loginPinInput.value = "";
  els.loginError.classList.add("hidden");
  els.loginOwnerTab.classList.add("active");
  els.loginTenantTab.classList.remove("active");
  els.loginOwnerForm.classList.remove("hidden");
  els.loginTenantForm.classList.add("hidden");
  els.dueBanner.classList.add("hidden");
  showLoginScreen();
}

function checkDueBanner() {
  if (sessionMode !== "tenant" || !sessionTenantId) {
    els.dueBanner.classList.add("hidden");
    return;
  }
  const balance = getTenantBalance(sessionTenantId);
  const projectsDue = getTenantProjectOutstanding(sessionTenantId);
  const totalDue = roundUsd(Math.max(0, balance) + projectsDue);
  if (totalDue > 0) {
    els.dueBannerText.textContent = `You have ${formatUsd(totalDue)} outstanding. Please contact the building owner to settle your balance.`;
    els.dueBanner.classList.remove("hidden");
  } else {
    els.dueBanner.classList.add("hidden");
  }
}

function renderAttention() {
  if (sessionMode !== "owner") {
    els.attentionPanel.classList.add("hidden");
    return;
  }
  const activeTenants = state.tenants.filter((t) => t.active !== false);
  const items = [];

  // Tenants who owe money
  const overdue = activeTenants
    .map((t) => ({ tenant: t, balance: getTenantBalance(t.id) }))
    .filter((x) => x.balance > 0.005);
  if (overdue.length) {
    const total = roundUsd(overdue.reduce((sum, x) => sum + x.balance, 0));
    items.push({
      kind: "due",
      icon: "💰",
      text: `${overdue.length} ${overdue.length === 1 ? "tenant owes" : "tenants owe"} ${formatUsd(total)}`,
      view: "paymentsView",
    });
  }

  // Generator months with costs logged but no meter readings yet
  const genPending = getServiceMonths("generator").filter((m) => {
    const dist = computeServiceDistribution("generator", m);
    return dist.pools.totalUsd > 0.005 && !dist.distributed;
  });
  if (genPending.length) {
    items.push({
      kind: "warn",
      icon: "⚡",
      text: `Generator: ${genPending.length} ${genPending.length === 1 ? "month needs" : "months need"} meter readings`,
      view: "servicesView",
    });
  }

  // Negative cash / reserve
  const totals = getPositionTotals();
  if (totals.cashUsd < -0.005) {
    items.push({
      kind: "danger",
      icon: "⚠️",
      text: `${isFixedMode() ? "Reserve fund" : "Cash balance"} is negative (${formatUsd(totals.cashUsd)})`,
      view: "ledgerView",
    });
  }

  if (!items.length) {
    els.attentionPanel.classList.add("hidden");
    return;
  }

  els.attentionList.replaceChildren(
    ...items.map((item) => {
      const row = document.createElement("button");
      row.type = "button";
      row.className = `attention-row attention-${item.kind}`;
      row.dataset.view = item.view;
      row.innerHTML = `<span class="attention-icon"></span><span class="attention-text"></span><span class="attention-chevron">&#8250;</span>`;
      row.querySelector(".attention-icon").textContent = item.icon;
      row.querySelector(".attention-text").textContent = item.text;
      return row;
    }),
  );
  els.attentionPanel.classList.remove("hidden");
}

function renderTenantDuesSummary() {
  if (sessionMode !== "tenant" || !sessionTenantId) {
    els.tenantDuesPanel.classList.add("hidden");
    return;
  }

  const tenantId = sessionTenantId;
  const dueBasis = getTenantDueBasisTotal(tenantId);
  const paymentsTotal = getTenantPaymentsTotal(tenantId);
  const openingNet = getTenantOpeningNet(tenantId);
  const balance = getTenantBalance(tenantId);
  const projectsDue = getTenantProjectOutstanding(tenantId);
  const totalDue = roundUsd(Math.max(0, balance) + projectsDue);

  const list = document.createElement("div");
  list.className = "summary-list";

  const dueHeaderRow = document.createElement("article");
  dueHeaderRow.className = "summary-row";
  dueHeaderRow.innerHTML = `<div><strong></strong></div><b></b>`;
  dueHeaderRow.querySelector("strong").textContent = isFixedMode() ? "Your Monthly Dues" : "Your Expense Share";
  dueHeaderRow.querySelector("b").textContent = formatUsd(dueBasis);
  list.append(dueHeaderRow);

  if (!isFixedMode()) {
    const categoryMap = getTenantExpensesByCategory(tenantId);
    [...categoryMap.entries()].sort((a, b) => b[1] - a[1]).forEach(([cat, amount]) => {
      const row = document.createElement("article");
      row.className = "summary-row summary-row-indent";
      row.innerHTML = `<div><strong></strong></div><b></b>`;
      row.querySelector("strong").textContent = cat;
      row.querySelector("b").textContent = formatUsd(amount);
      list.append(row);
    });
  }

  // Services due (each shown as its own line, never folded into general dues)
  [
    ["Generator", getTenantServicesDue(tenantId, { serviceType: "generator" })],
    ["Water", getTenantServicesDue(tenantId, { serviceType: "water" })],
  ].forEach(([label, amount]) => {
    if (amount <= 0.005) return;
    const row = document.createElement("article");
    row.className = "summary-row";
    row.innerHTML = `<div><strong></strong></div><b class="due-amount"></b>`;
    row.querySelector("strong").textContent = label;
    row.querySelector("b").textContent = formatUsd(amount);
    list.append(row);
  });

  // Opening balance carry-in (only when present)
  if (Math.abs(openingNet) > 0.005) {
    const openingRow = document.createElement("article");
    openingRow.className = "summary-row";
    openingRow.innerHTML = `<div><strong>Opening Balance</strong></div><b></b>`;
    const openingValue = openingRow.querySelector("b");
    if (openingNet < 0) {
      openingValue.textContent = formatUsd(-openingNet);
      openingValue.className = "due-amount";
    } else {
      openingValue.textContent = `−${formatUsd(openingNet)}`;
      openingValue.className = "advance-credit";
    }
    list.append(openingRow);
  }

  // Payments made
  const paymentsRow = document.createElement("article");
  paymentsRow.className = "summary-row";
  paymentsRow.innerHTML = `<div><strong>Payments Made</strong></div><b class="advance-credit"></b>`;
  paymentsRow.querySelector("b").textContent = `−${formatUsd(paymentsTotal)}`;
  list.append(paymentsRow);

  // Projects if any
  if (projectsDue > 0) {
    const projRow = document.createElement("article");
    projRow.className = "summary-row";
    projRow.innerHTML = `<div><strong>Projects</strong></div><b class="due-amount"></b>`;
    projRow.querySelector("b").textContent = formatUsd(projectsDue);
    list.append(projRow);
  }

  // Total balance
  const totalRow = document.createElement("article");
  totalRow.className = "summary-row emphasis";
  const balanceClass = totalDue > 0 ? "due-amount" : balance < -0.005 ? "advance-credit" : "";
  totalRow.innerHTML = `<div><strong>Current Balance</strong></div><b class="${balanceClass}"></b>`;
  totalRow.querySelector("b").textContent = totalDue > 0 ? formatUsd(totalDue) : balance < -0.005 ? `Credit ${formatUsd(-balance)}` : "Settled";
  list.append(totalRow);

  els.tenantDuesList.replaceChildren(list);
  els.tenantDuesPanel.classList.remove("hidden");
}

function renderDashboard() {
  renderMonthSelect();

  function buildKpiCards(kpis) {
    return kpis.map(([label, value, note]) => {
      const card = document.createElement("article");
      card.className = "kpi";
      card.innerHTML = `<span></span><strong></strong><small></small>`;
      card.querySelector("span").textContent = label;
      card.querySelector("strong").textContent = value;
      card.querySelector("small").textContent = note;
      return card;
    });
  }

  const totals = getPositionTotals();
  const totalExpenses = roundUsd(state.transactions.filter((t) => t.category === "Expenses" || t.category === "Services Expenses").reduce((s, t) => s + toUsd(t.debitUsd, t.debitLbp), 0));
  els.kpiGrid.replaceChildren(...buildKpiCards(
    isFixedMode()
      ? [
          ["Reserve Fund", formatUsd(totals.cashUsd), "Collected funds minus expenses"],
          ["Total Expenses", formatUsd(totalExpenses), "All recorded building costs"],
          ["Outstanding", formatUsd(totals.receivableUsd), "Tenant dues owed"],
          ["Net Position", formatUsd(totals.netPositionUsd), "Reserve + outstanding - credits"],
        ]
      : [
          ["Cash Balance", formatUsd(totals.cashUsd), "Ledger net cash"],
          ["Total Expenses", formatUsd(totalExpenses), "All shared building costs"],
          ["Outstanding", formatUsd(totals.receivableUsd), "Tenant balances owed"],
          ["Net Position", formatUsd(totals.netPositionUsd), "Cash + outstanding - credits"],
        ],
  ));

  renderAttention();
  renderTenantDuesSummary();
  renderPaymentDeclarations();
  renderSharedExpenses();
  checkNewMonthBanner();
  renderTenantStatus();
  els.categorySummary.closest(".panel").classList.remove("hidden");
  renderCategorySummary();
  renderExpenseCategoryBreakdown();
}

function checkNewMonthBanner() {
  if (sessionMode !== "owner" || newMonthBannerDismissed || !isFixedMode()) {
    els.newMonthBanner.classList.add("hidden");
    return;
  }
  const now = new Date();
  const currentMonthIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const alreadyAdded = state.monthlyExpected.some((e) => e.month === currentMonthIso);
  if (alreadyAdded) {
    els.newMonthBanner.classList.add("hidden");
  } else {
    const label = now.toLocaleString("default", { month: "long", year: "numeric" });
    els.newMonthBannerText.textContent = `${label} has not been set up yet. Add it to start tracking this month's payments.`;
    els.newMonthBanner.classList.remove("hidden");
  }
}

function checkSetupWizard() {
  if (sessionMode === "owner" && !state.setupComplete) openSetupWizard();
}

function applyWizardCollectionModeVisibility() {
  const fixed = els.wizardCollectionMode.value === "fixed";
  els.wizardBudgetField.classList.toggle("hidden", !fixed);
  els.wizardCollectionModeNote.textContent = fixed
    ? "Tenants pay a fixed monthly amount; surplus builds the reserve fund."
    : "Each month's actual expenses are split among tenants.";
}

function openSetupWizard() {
  wizardTenants = state.tenants.map((t) => ({
    id: t.id,
    name: t.name || "",
    unit: t.unit || "",
    phone: t.phone || "",
    pinHash: t.pinHash || "",
    newPin: "",
    coefficient: t.coefficient || 0,
    breakerAmps: t.breakerAmps || 0,
    active: t.active !== false,
  }));
  els.wizardBuildingName.value = (state.building && state.building.name) || "";
  els.wizardOwnerPassword.value = "";
  els.wizardOwnerPassword.placeholder = state.settings.ownerPasswordHash
    ? "Password set — type to change"
    : "Leave blank for no password";
  els.wizardCollectionMode.value = state.settings.collectionMode || "actual";
  applyWizardCollectionModeVisibility();
  els.wizardMonthlyBudget.value = state.settings.defaultDueUsd || "";
  els.wizardLbpRate.value = state.settings.lbpPerUsd || "";
  wizardEditingIdx = null;
  els.wizardTenantName.value = "";
  els.wizardTenantUnit.value = "";
  els.wizardTenantPhone.value = "";
  els.wizardTenantPin.value = "";
  els.wizardTenantCoeff.value = "";
  els.wizardAddTenantBtn.textContent = "+ Add Tenant";
  els.wizardCancelEditBtn.classList.add("hidden");
  showWizardStep(1);
  renderWizardTenants();
  openDialog(els.setupWizardDialog);
  setTimeout(() => els.wizardBuildingName.focus(), 50);
}

function showWizardStep(n) {
  [els.wizardStep1, els.wizardStep2, els.wizardStep3].forEach((step, i) => {
    step.classList.toggle("hidden", i + 1 !== n);
  });
  [els.wizardDot1, els.wizardDot2, els.wizardDot3].forEach((dot, i) => {
    dot.classList.toggle("active", i + 1 <= n);
  });
}

function wizardNextStep(from) {
  if (from === 1) {
    if (!els.wizardBuildingName.value.trim()) {
      showToast("Please enter the building name.");
      els.wizardBuildingName.focus();
      return;
    }
    showWizardStep(2);
    setTimeout(() => els.wizardMonthlyBudget.focus(), 50);
  } else if (from === 2) {
    showWizardStep(3);
    setTimeout(() => els.wizardTenantName.focus(), 50);
  }
}

function wizardPrevStep(from) {
  showWizardStep(from - 1);
}

function wizardClearTenantForm() {
  els.wizardTenantName.value = "";
  els.wizardTenantUnit.value = "";
  els.wizardTenantPhone.value = "";
  els.wizardTenantPin.value = "";
  els.wizardTenantPin.placeholder = "4 digits";
  els.wizardTenantCoeff.value = "";
  els.wizardAddTenantBtn.textContent = "+ Add Tenant";
  els.wizardCancelEditBtn.classList.add("hidden");
  wizardEditingIdx = null;
}

function wizardEditTenant(idx) {
  const t = wizardTenants[idx];
  if (!t) return;
  wizardEditingIdx = idx;
  els.wizardTenantName.value = t.name;
  els.wizardTenantUnit.value = t.unit;
  els.wizardTenantPhone.value = t.phone || "";
  els.wizardTenantPin.value = t.newPin || "";
  els.wizardTenantPin.placeholder = t.pinHash ? "PIN set — type to change" : "4 digits";
  els.wizardTenantCoeff.value = t.coefficient > 0 ? String(t.coefficient) : "";
  els.wizardAddTenantBtn.textContent = "Save Changes";
  els.wizardCancelEditBtn.classList.remove("hidden");
  els.wizardTenantName.focus();
}

function wizardAddTenant() {
  const name = els.wizardTenantName.value.trim();
  const unit = els.wizardTenantUnit.value.trim();
  if (!name) { showToast("Please enter the tenant name."); els.wizardTenantName.focus(); return; }
  if (!unit) { showToast("Please enter the unit number."); els.wizardTenantUnit.focus(); return; }
  const data = {
    name,
    unit,
    phone: els.wizardTenantPhone.value.trim(),
    pinHash: "",
    newPin: els.wizardTenantPin.value.trim(),
    coefficient: parseInt(els.wizardTenantCoeff.value, 10) || 0,
    breakerAmps: 0,
  };
  if (wizardEditingIdx !== null) {
    data.id = wizardTenants[wizardEditingIdx].id;
    data.active = wizardTenants[wizardEditingIdx].active;
    data.pinHash = wizardTenants[wizardEditingIdx].pinHash || "";
    data.breakerAmps = wizardTenants[wizardEditingIdx].breakerAmps || 0;
    wizardTenants[wizardEditingIdx] = data;
  } else {
    wizardTenants.push(data);
  }
  wizardClearTenantForm();
  renderWizardTenants();
  els.wizardTenantName.focus();
}

function renderWizardTenants() {
  const coeffSum = wizardTenants.reduce((s, t) => s + (t.coefficient || 0), 0);
  const hasCoeff = wizardTenants.some((t) => t.coefficient > 0);
  const items = wizardTenants.map((t, i) => {
    const item = document.createElement("div");
    item.className = "wizard-tenant-item";
    const info = document.createElement("div");
    info.className = "wizard-tenant-item-info";
    const nameLine = document.createElement("span");
    nameLine.className = "wizard-tenant-item-name";
    nameLine.textContent = `${t.name} — Unit ${t.unit}`;
    const metaLine = document.createElement("span");
    metaLine.className = "wizard-tenant-item-meta";
    const parts = [];
    if (t.phone) parts.push(t.phone);
    if (t.pinHash || t.newPin) parts.push("PIN set");
    if (t.coefficient) parts.push(`${t.coefficient}/1000`);
    metaLine.textContent = parts.join(" · ") || "—";
    info.append(nameLine, metaLine);
    const actions = document.createElement("div");
    actions.className = "wizard-tenant-actions";
    const editBtn = document.createElement("button");
    editBtn.className = "wizard-tenant-edit";
    editBtn.textContent = "Edit";
    editBtn.type = "button";
    editBtn.dataset.editIdx = String(i);
    const removeBtn = document.createElement("button");
    removeBtn.className = "wizard-tenant-remove";
    removeBtn.textContent = "×";
    removeBtn.type = "button";
    removeBtn.dataset.idx = String(i);
    actions.append(editBtn, removeBtn);
    item.append(info, actions);
    return item;
  });
  els.wizardTenantList.replaceChildren(...items);
  const s = els.wizardCoeffStatus;
  if (!hasCoeff) {
    s.textContent = "";
    s.className = "wizard-coeff-status";
  } else if (coeffSum === 1000) {
    s.textContent = `Coefficients: ${coeffSum}/1000 ✓`;
    s.className = "wizard-coeff-status coeff-ok";
  } else {
    s.textContent = `Coefficients: ${coeffSum}/1000 — total must be 1000`;
    s.className = "wizard-coeff-status coeff-warn";
  }
}

function finishSetupWizard() {
  const buildingName = els.wizardBuildingName.value.trim();
  if (!buildingName) {
    showWizardStep(1);
    showToast("Please enter the building name.");
    els.wizardBuildingName.focus();
    return;
  }
  state.building = state.building || {};
  state.building.name = buildingName;
  const pw = els.wizardOwnerPassword.value;
  if (pw) state.settings.ownerPasswordHash = hashSecret(pw, state.security.salt);
  state.settings.collectionMode = els.wizardCollectionMode.value === "fixed" ? "fixed" : "actual";
  const budget = parseFloat(els.wizardMonthlyBudget.value);
  if (budget > 0) state.settings.defaultDueUsd = budget;
  const rate = parseFloat(els.wizardLbpRate.value);
  if (rate > 0) state.settings.lbpPerUsd = rate;
  state.tenants = wizardTenants.map((t) => ({
    id: t.id || ("tenant-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6)),
    name: t.name,
    unit: t.unit,
    phone: t.phone || "",
    pinHash: t.newPin ? hashSecret(t.newPin, state.security.salt) : (t.pinHash || ""),
    coefficient: t.coefficient || 0,
    breakerAmps: t.breakerAmps || 0,
    active: t.active !== false,
  }));
  state.setupComplete = true;
  saveState();
  closeDialog(els.setupWizardDialog);
  populateTenantSelect();
  renderAll();
  showToast("Setup complete! Welcome to Building Account Tracker.");
}

function renderPaymentDeclarations() {
  const pending = (state.paymentDeclarations || []).filter((d) => d.status === "pending");
  els.declarationsPanel.classList.toggle("hidden", pending.length === 0);
  if (!pending.length) return;
  els.declarationsBadge.textContent = `${pending.length} pending`;
  els.declarationsList.replaceChildren(
    ...pending.map((decl) => {
      const name = tenantName(decl.tenantId);
      const item = document.createElement("div");
      item.className = "declaration-item";
      const info = document.createElement("div");
      info.className = "declaration-info";
      const strong = document.createElement("strong");
      strong.textContent = `${name} says they paid ${formatMonthly(decl.amount)} for ${formatMonth(decl.month)}`;
      const sub = document.createElement("span");
      sub.textContent = decl.declaredAt ? `Notified ${formatDateLabel(decl.declaredAt.slice(0, 10))}` : "";
      info.append(strong, sub);
      const actions = document.createElement("div");
      actions.className = "declaration-actions";
      const recordBtn = document.createElement("button");
      recordBtn.type = "button";
      recordBtn.className = "primary-button declaration-record-btn";
      recordBtn.dataset.declId = decl.id;
      recordBtn.dataset.tenantId = decl.tenantId;
      recordBtn.dataset.month = decl.month;
      recordBtn.dataset.amount = String(decl.amount);
      recordBtn.textContent = "Record Payment";
      const dismissBtn = document.createElement("button");
      dismissBtn.type = "button";
      dismissBtn.className = "secondary-button declaration-dismiss-btn";
      dismissBtn.dataset.declId = decl.id;
      dismissBtn.textContent = "Dismiss";
      actions.append(recordBtn, dismissBtn);
      item.append(info, actions);
      return item;
    }),
  );
}

function declarePayment(tenantId, month, amount) {
  if (!window.confirm(`Notify the owner that you've paid ${formatMonthly(amount)} for ${formatMonth(month)}?`)) return;
  const decl = {
    id: `decl-${Date.now()}`,
    tenantId,
    month,
    amount: Number(amount),
    declaredAt: new Date().toISOString(),
    status: "pending",
  };
  (state.paymentDeclarations ||= []).push(decl);
  saveState();
  renderPayments();
  showToast("Owner notified of your payment");
}

function acknowledgeDeclaration(id, { record = false } = {}) {
  const decl = (state.paymentDeclarations || []).find((d) => d.id === id);
  if (!decl) return;
  decl.status = "acknowledged";
  saveState();
  renderDashboard();
  if (record) openPaymentDialogFor(decl.tenantId, decl.month, decl.amount);
}

function renderTenantStatus() {
  const activeTenants = state.tenants.filter((t) => t.active !== false);
  const balanceData = activeTenants.map((t) => ({
    tenant: t,
    balance: getTenantBalance(t.id),
    payments: getTenantPaymentsTotal(t.id),
    owed: roundUsd(getTenantDueBasisTotal(t.id) - getTenantOpeningNet(t.id)),
  }));
  const totalOwed = roundUsd(balanceData.reduce((s, d) => s + d.owed, 0));
  const totalPaid = roundUsd(balanceData.reduce((s, d) => s + d.payments, 0));
  const rate = totalOwed > 0 ? Math.min(100, Math.round((totalPaid / totalOwed) * 100)) : 0;

  els.collectionRate.textContent = `${rate}%`;
  els.collectionProgress.style.width = `${rate}%`;
  els.tenantStatusGrid.replaceChildren(
    ...balanceData.map(({ tenant, balance }) => {
      const card = document.createElement("article");
      card.className = "status-card";
      card.innerHTML = `<strong></strong><span></span><div class="status-pill"></div>`;
      card.querySelector("strong").textContent = tenant.name;
      const pill = card.querySelector(".status-pill");
      const statusClass = balance > 0.005 ? "due" : "paid";
      pill.classList.add(`status-${statusClass}`);
      pill.textContent = balance > 0.005 ? "Due" : balance < -0.005 ? "Credit" : "Settled";
      card.querySelector("span").textContent = balance > 0.005
        ? `Owes ${formatUsd(balance)}`
        : balance < -0.005 ? `Credit ${formatUsd(-balance)}` : "Settled";
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
  const tenantStatuses = state.tenants
    .filter((t) => t.active !== false)
    .map((tenant) => ({ tenant, status: paymentStatus(tenant.id, month) }));
  const expectedTotal = tenantStatuses.reduce((sum, entry) => sum + entry.status.expected, 0);
  const paidTotal = tenantStatuses.reduce((sum, entry) => sum + entry.status.paid, 0);
  const dueTotal = Math.max(0, expectedTotal - paidTotal);
  const paidCount = tenantStatuses.filter((entry) => entry.status.className === "paid").length;
  const partialCount = tenantStatuses.filter((entry) => entry.status.className === "partial").length;
  const dueCount = tenantStatuses.filter((entry) => entry.status.className === "due").length;
  const rate = expectedTotal ? Math.min(100, Math.round((paidTotal / expectedTotal) * 100)) : 0;
  return { expectedTotal, paidTotal, dueTotal, paidCount, partialCount, dueCount, rate, tenantStatuses };
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
  els.addMonthButton.classList.toggle("hidden", !isFixedMode());
  if (isFixedMode()) renderPaymentsFixed();
  else renderPaymentsActual();

  // Hide shared expenses section (merged into regular expenses now)
  els.paymentSharedExpensesSection.classList.add("hidden");
  els.paymentSharedSummary.classList.add("hidden");
  els.paymentSharedSummaryLabel.classList.add("hidden");

  const months = getMonths().slice().reverse();
  els.monthOverviewList.replaceChildren(
    ...months.map((month) => {
      const monthExpensesTotal = roundUsd(
        state.transactions
          .filter((t) => t.category === "Expenses" && monthKey(t.date || "") === monthKey(month))
          .reduce((s, t) => s + toUsd(t.debitUsd, t.debitLbp), 0),
      );
      const monthPaymentsTotal = roundUsd(
        state.transactions
          .filter((t) => t.category === "Payments" && !t.project && monthKey(t.date || t.forMonth || "") === monthKey(month))
          .reduce((s, t) => s + transactionNetUsd(t), 0),
      );
      const row = document.createElement("button");
      row.className = "payment-month-row";
      row.type = "button";
      row.dataset.month = month;
      row.innerHTML = `
        <div><strong></strong><span></span></div>
        <div class="month-progress"><b></b><small></small></div>
      `;
      row.querySelector("strong").textContent = formatMonth(month);
      row.querySelector("span").textContent = `${formatUsd(monthPaymentsTotal)} collected`;
      row.querySelector("b").textContent = formatUsd(monthExpensesTotal);
      row.querySelector("small").textContent = "expenses";
      return row;
    }),
  );
}

function appendTenantPaymentExtras(row, tenant, { month, reminderDue = 0, whatsappUrl = null, declarationDue = 0 } = {}) {
  if (reminderDue > 0 && sessionMode === "owner") {
    if (whatsappUrl) {
      const waBtn = document.createElement("a");
      waBtn.className = "whatsapp-full-btn owner-only";
      waBtn.href = whatsappUrl;
      waBtn.target = "_blank";
      waBtn.rel = "noopener";
      waBtn.textContent = "Send WhatsApp Reminder";
      row.append(waBtn);
    } else {
      const waBtn = document.createElement("button");
      waBtn.className = "whatsapp-full-btn whatsapp-no-phone owner-only";
      waBtn.type = "button";
      waBtn.textContent = "Set phone to send reminder";
      waBtn.dataset.editTenantId = tenant.id;
      row.append(waBtn);
    }
  }
  if (sessionMode === "tenant" && tenant.id === sessionTenantId && declarationDue > 0) {
    const hasPending = (state.paymentDeclarations || []).some(
      (d) => d.tenantId === tenant.id && d.status === "pending",
    );
    const paidBtn = document.createElement("button");
    paidBtn.type = "button";
    paidBtn.className = "paid-declaration-btn";
    if (hasPending) {
      paidBtn.textContent = "Owner notified ✓";
      paidBtn.disabled = true;
    } else {
      paidBtn.textContent = "I've Paid";
      paidBtn.dataset.tenantId = tenant.id;
      paidBtn.dataset.month = month;
      paidBtn.dataset.amount = String(declarationDue);
    }
    row.append(paidBtn);
  }
}

function buildTenantPaymentRowBase(tenant, amountText, statusLabel, statusClass, detailText) {
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
      <button class="mini-button tpr-add-btn owner-only" type="button">Add Payment</button>
    </div>
  `;
  row.querySelector("strong").textContent = tenant.name;
  row.querySelector(".tpr-info span").textContent = `Unit ${tenant.unit}`;
  row.querySelector(".tpr-amount").textContent = amountText;
  const pill = row.querySelector(".status-pill");
  pill.className = `status-pill status-${statusClass}`;
  pill.textContent = statusLabel;
  row.querySelector(".tpr-detail").textContent = detailText;
  return row;
}

function renderPaymentsFixed() {
  const collection = getMonthCollection(selectedMonth);
  els.paymentMonthRate.textContent = `${collection.rate}%`;
  els.paymentPaidCount.textContent = `${collection.paidCount}/${collection.tenantStatuses.length} paid`;

  els.paymentSummary.replaceChildren(
    ...["Expected", "Collected", "Due"].map((label, i) => {
      const value = [formatUsd(collection.expectedTotal), formatUsd(collection.paidTotal), formatUsd(collection.dueTotal)][i];
      const card = document.createElement("article");
      card.className = "payment-summary-card";
      card.innerHTML = `<span></span><strong></strong>`;
      card.querySelector("span").textContent = label;
      card.querySelector("strong").textContent = value;
      return card;
    }),
  );

  els.dueOnlyToggle.classList.toggle("is-active", dueOnlyFilter);
  const visible = dueOnlyFilter
    ? collection.tenantStatuses.filter(({ status }) => status.className === "due" || status.className === "partial")
    : collection.tenantStatuses;

  els.tenantPaymentList.replaceChildren(
    ...visible.map(({ tenant, status }) => {
      const due = roundUsd(Math.max(0, status.expected - status.paid));
      const detail = due > 0 ? `${formatUsd(due)} due` : status.expected > 0 ? "Fully paid" : "No due";
      const row = buildTenantPaymentRowBase(
        tenant,
        `${formatUsd(status.paid)} / ${formatUsd(status.expected)}`,
        status.label,
        status.className,
        detail,
      );
      const addBtn = row.querySelector(".tpr-add-btn");
      addBtn.dataset.tenantId = tenant.id;
      addBtn.dataset.month = selectedMonth;
      addBtn.dataset.due = String(due || 0);
      const waUrl = tenant.phone ? buildMonthlyDueWhatsAppUrl(tenant, due, selectedMonth) : null;
      appendTenantPaymentExtras(row, tenant, {
        month: selectedMonth,
        reminderDue: due,
        whatsappUrl: waUrl,
        declarationDue: due,
      });
      return row;
    }),
  );
}

function renderPaymentsActual() {
  const activeTenants = state.tenants.filter((t) => t.active !== false);
  const balanceData = activeTenants.map((tenant) => ({
    tenant,
    balance: getTenantBalance(tenant.id),
    expenseShare: getTenantExpenseShare(tenant.id),
    payments: getTenantPaymentsTotal(tenant.id),
  }));

  const totalOutstanding = roundUsd(balanceData.reduce((s, d) => s + Math.max(0, d.balance), 0));
  const totalCollected = roundUsd(balanceData.reduce((s, d) => s + d.payments, 0));
  const totalExpenses = roundUsd(balanceData.reduce((s, d) => s + d.expenseShare, 0));
  const settledCount = balanceData.filter((d) => d.balance <= 0.005).length;

  els.paymentMonthRate.textContent = `${settledCount}/${activeTenants.length} settled`;
  els.paymentPaidCount.textContent = `${settledCount}/${activeTenants.length} settled`;

  els.paymentSummary.replaceChildren(
    ...["Total Expenses", "Collected", "Outstanding"].map((label, i) => {
      const value = [formatUsd(totalExpenses), formatUsd(totalCollected), formatUsd(totalOutstanding)][i];
      const card = document.createElement("article");
      card.className = "payment-summary-card";
      card.innerHTML = `<span></span><strong></strong>`;
      card.querySelector("span").textContent = label;
      card.querySelector("strong").textContent = value;
      return card;
    }),
  );

  els.dueOnlyToggle.classList.toggle("is-active", dueOnlyFilter);
  const visibleData = dueOnlyFilter ? balanceData.filter((d) => d.balance > 0.005) : balanceData;

  els.tenantPaymentList.replaceChildren(
    ...visibleData.map(({ tenant, balance, expenseShare, payments }) => {
      const due = Math.max(0, balance);
      const statusClass = balance > 0.005 ? "due" : "paid";
      const statusLabel = balance > 0.005 ? "Due" : balance < -0.005 ? "Credit" : "Settled";
      const detail = due > 0 ? `${formatUsd(due)} due` : balance < -0.005 ? `${formatUsd(-balance)} credit` : "Settled";
      const row = buildTenantPaymentRowBase(
        tenant,
        `${formatUsd(payments)} paid of ${formatUsd(expenseShare)}`,
        statusLabel,
        statusClass,
        detail,
      );
      const addBtn = row.querySelector(".tpr-add-btn");
      addBtn.dataset.tenantId = tenant.id;
      addBtn.dataset.month = selectedMonth;
      addBtn.dataset.due = String(due || 0);
      const stmtNotif = getTenantStatementNotification(tenant.id);
      const waUrl = stmtNotif && tenant.phone ? buildWhatsAppUrl(tenant, stmtNotif.remaining, stmtNotif.month) : null;
      appendTenantPaymentExtras(row, tenant, {
        month: selectedMonth,
        reminderDue: stmtNotif ? stmtNotif.remaining : 0,
        whatsappUrl: waUrl,
        declarationDue: due,
      });
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
      const coeffLabel = tenant.coefficient > 0 ? ` · ${tenant.coefficient}/1000` : "";
      const breakerLabel = tenant.breakerAmps > 0 ? ` · ${tenant.breakerAmps}A` : "";
      unitSpan.textContent = `Unit ${tenant.unit}${coeffLabel}${breakerLabel}${tenant.phone ? "" : " · no phone"}`;
      const metrics = card.querySelectorAll(".metric b");
      metrics[0].textContent = formatMonthly(totals.paidUsd);
      metrics[1].textContent = formatUsd(totals.advanceUsd);
      metrics[2].textContent = formatMonthly(totals.dueUsd);
      if (totals.paidUsd > 0) card.querySelector(".metric-paid").classList.add("is-filled");
      if (totals.dueUsd > 0) card.querySelector(".metric-due").classList.add("has-due");
      card.querySelector(".edit-tenant-button").dataset.tenantId = tenant.id;
      card.querySelector(".print-statement-button").dataset.tenantId = tenant.id;
      card.querySelector(".delete-tenant-button").dataset.tenantId = tenant.id;
      if (sessionMode === "tenant" && tenant.id !== sessionTenantId) {
        card.querySelector(".tenant-card-footer").classList.add("hidden");
      }
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

function tenantStatementRows(tenantId) {
  let changed = false;
  const rows = getMonths().map((month) => {
    const status = paymentStatus(tenantId, month);
    const due = roundUsd(status.expected);
    const paid = roundUsd(status.paid);
    const outstanding = roundUsd(Math.max(0, due - paid));
    const receipts = state.transactions
      .filter((tx) => isMonthlyPayment(tx) && tx.tenantId === tenantId && tx.forMonth === month)
      .sort((a, b) => transactionDateValue(a).localeCompare(transactionDateValue(b)) || String(a.id).localeCompare(String(b.id)))
      .map((tx) => {
        const before = tx.receiptRef;
        const reference = ensureReceiptReference(tx);
        if (tx.receiptRef !== before) changed = true;
        return reference;
      })
      .filter(Boolean);
    return { month, due, paid, outstanding, status: status.label, receipts };
  });
  const totals = rows.reduce(
    (acc, row) => {
      acc.due += row.due;
      acc.paid += row.paid;
      acc.outstanding += row.outstanding;
      return acc;
    },
    { due: 0, paid: 0, outstanding: 0 },
  );
  return { rows, totals, receiptChanged: changed };
}

function tenantStatementSummaryItems(tenant, projectTotal, tenantTotals) {
  const openingNet = getTenantOpeningNet(tenant.id);
  const generator = getTenantServicesDue(tenant.id, { serviceType: "generator" });
  const water = getTenantServicesDue(tenant.id, { serviceType: "water" });
  // Always show the dues basis, payments and the current balance; show the rest
  // only when non-zero so the summary stays clean for simple accounts.
  const items = [[isFixedMode() ? "Total Monthly Dues" : "Expense Share", formatUsd(getTenantDueBasisTotal(tenant.id))]];
  if (Math.abs(generator) > 0.005) items.push(["Generator", formatUsd(generator)]);
  if (Math.abs(water) > 0.005) items.push(["Water", formatUsd(water)]);
  if (Math.abs(openingNet) > 0.005) items.push(["Opening Balance", formatUsd(roundUsd(-openingNet))]);
  items.push(["Payments Made", formatUsd(getTenantPaymentsTotal(tenant.id))]);
  if (Math.abs(projectTotal) > 0.005) items.push(["Project Payments", formatUsd(projectTotal)]);
  if (tenantTotals.advanceUsd > 0.005) items.push(["Advance Balance", formatUsd(tenantTotals.advanceUsd)]);
  items.push(["Current Balance", formatUsd(getTenantBalance(tenant.id))]);
  return items;
}

function printTenantStatement(tenantId) {
  const tenant = state.tenants.find((entry) => entry.id === tenantId);
  if (!tenant) {
    showToast("Tenant not found");
    return;
  }

  const { rows, totals, receiptChanged } = tenantStatementRows(tenant.id);
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
  tenantStatementSummaryItems(tenant, projectTotal, tenantTotals).forEach(([label, value]) => {
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
  monthlyTitle.textContent = "Monthly Dues";

  const table = document.createElement("table");
  table.className = "print-table";
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  ["Month", "Due USD", "Paid USD", "Outstanding USD", "Status", "Receipts"].forEach((heading, index) =>
    appendHeaderCell(headerRow, heading, index > 0 && index < 4 ? "numeric" : ""),
  );
  thead.append(headerRow);

  const tbody = document.createElement("tbody");
  rows.forEach((entry) => {
    const row = document.createElement("tr");
    appendCell(row, formatMonth(entry.month));
    appendCell(row, formatMonthly(entry.due), "numeric");
    appendCell(row, formatMonthly(entry.paid), "numeric");
    appendCell(row, formatMonthly(entry.outstanding), "numeric");
    appendCell(row, entry.status);
    appendCell(row, entry.receipts.join(", "));
    tbody.append(row);
  });

  const tfoot = document.createElement("tfoot");
  const totalRow = document.createElement("tr");
  appendCell(totalRow, "Total");
  appendCell(totalRow, formatMonthly(totals.due), "numeric");
  appendCell(totalRow, formatMonthly(totals.paid), "numeric");
  appendCell(totalRow, formatMonthly(totals.outstanding), "numeric");
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
    : state.transactions
        .filter((entry) =>
          entry.category === "Advance Payments" &&
          entry.tenantId === transaction.tenantId &&
          samePaymentGroup(entry, transaction))
        .reduce((sum, entry) => sum + transactionNetUsd(entry), 0);
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
        ...(data.advanceAmount > 0 ? [["Advance Credit", formatUsd(data.advanceAmount)]] : []),
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
    const applied = transactionNetUsd(entry);
    const status = paymentStatus(data.tenant.id, entry.forMonth);
    return [formatMonth(entry.forMonth), formatUsd(applied), status.label];
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
    ["Month", "Applied USD", "Status"].forEach((heading, index) =>
      appendHeaderCell(headerRow, heading, index === 1 ? "numeric" : ""),
    );
    thead.append(headerRow);
    const tbody = document.createElement("tbody");
    receiptTableRows(data).forEach((cells) => {
      const row = document.createElement("tr");
      appendCell(row, cells[0]);
      appendCell(row, cells[1], "numeric");
      appendCell(row, cells[2]);
      tbody.append(row);
    });
    table.append(thead, tbody);
  }

  const note = document.createElement("p");
  note.className = "print-note";
  note.textContent = data.isProject
    ? "Project payments are separate from monthly building fees."
    : "Payments are applied to the tenant's building dues for the month.";

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
      { text: "Month | Applied USD | Status", size: 9, bold: true },
      ...receiptTableRows(data).map((row) => ({ text: row.join(" | "), size: 9 })),
      { text: "Payments are applied to the tenant's building dues for the month.", size: 10 },
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

function buildMultiPagePdf(pageContents) {
  // Shared catalog/pages/fonts, one Page + Contents pair per page of commands.
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    null, // 2: Pages — filled once kids are known
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
  ];
  const kids = [];
  pageContents.forEach((content) => {
    const contentObjNum = objects.length + 1;
    objects.push(`<< /Length ${content.length} >>\nstream\n${content}endstream`);
    const pageObjNum = objects.length + 1;
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentObjNum} 0 R >>`,
    );
    kids.push(`${pageObjNum} 0 R`);
  });
  objects[1] = `<< /Type /Pages /Kids [${kids.join(" ")}] /Count ${pageContents.length} >>`;

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
    const headers = ["Month", "Applied USD", "Status"];
    const widths = [165, 165, 165];
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
        : "Payments are applied to the tenant's building dues for the month.",
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

  const { rows: allRows, totals } = tenantStatementRows(tenant.id);
  // Only months with real activity — skip empty $0 / no-due months so the
  // statement stays readable (totals still cover every month).
  const rows = allRows.filter((r) => r.due > 0.005 || r.paid > 0.005 || (r.receipts && r.receipts.length));
  const tenantTotals = getTenantTotals(tenant.id);
  const projectRows = state.transactions
    .filter((tx) => isProjectPayment(tx) && tx.tenantId === tenant.id)
    .slice()
    .sort((a, b) => transactionDateValue(a).localeCompare(transactionDateValue(b)) || String(a.id).localeCompare(String(b.id)));
  const projectTotal = projectRows.reduce((sum, tx) => sum + transactionNetUsd(tx), 0);

  const left = 50;
  const right = 545;
  const TOP = 800;
  const BOTTOM = 60;
  const ROW_H = 22;
  const pages = [];
  let commands;
  let y;
  let x;

  function flushPage() {
    if (commands) pages.push(`${commands.join("\n")}\n`);
  }
  function startPage(kind) {
    flushPage();
    commands = ["0.2 w"];
    y = TOP;
    if (kind === "full") {
      commands.push(pdfTextCommand(state.building.name, left, y, 11));
      commands.push(pdfTextCommand("Tenant Account Statement", left, y - 28, 18, true));
      commands.push(pdfTextCommand(`${tenant.name} | Unit ${tenant.unit}`, left, y - 48, 11));
      commands.push(pdfTextCommand(`Date: ${localDateInput()}`, 380, y, 10));
      commands.push(pdfTextCommand(`App: ${APP_VERSION}`, 380, y - 16, 9));
      commands.push(pdfLineCommand(left, y - 64, right, y - 64));
      y = TOP - 92;
    } else {
      commands.push(pdfTextCommand(`${tenant.name} | Unit ${tenant.unit} — statement (continued)`, left, y, 10, true));
      commands.push(pdfLineCommand(left, y - 10, right, y - 10));
      y = TOP - 34;
    }
  }
  function drawColHeader(cols) {
    x = left;
    cols.forEach((col) => {
      commands.push(pdfRectCommand(x, y - 16, col.width, ROW_H));
      commands.push(pdfTextCommand(col.heading, x + 5, y - 4, 8, true));
      x += col.width;
    });
    y -= ROW_H;
  }
  function drawRow(cells, cols, boldFirst) {
    x = left;
    cols.forEach((col, index) => {
      commands.push(pdfRectCommand(x, y - 16, col.width, ROW_H));
      commands.push(pdfTextCommand(pdfClip(cells[index], Math.floor(col.width / 5.5)), x + 5, y - 4, 8, Boolean(boldFirst) && index === 0));
      x += col.width;
    });
    y -= ROW_H;
  }
  function ensureSpace(needed, redraw) {
    if (y - needed < BOTTOM) {
      startPage("cont");
      if (redraw) redraw();
    }
  }
  function sectionTitle(text) {
    ensureSpace(40);
    commands.push(pdfTextCommand(text, left, y, 13, true));
    y -= 20;
  }

  startPage("full");

  // Summary boxes (2 columns)
  const summaryItems = tenantStatementSummaryItems(tenant, projectTotal, tenantTotals);
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

  // Monthly Dues table
  const monthCols = [
    { heading: "Month", width: 80 },
    { heading: "Due USD", width: 80 },
    { heading: "Paid USD", width: 80 },
    { heading: "Outstanding", width: 80 },
    { heading: "Status", width: 60 },
    { heading: "Receipts", width: 115 },
  ];
  sectionTitle("Monthly Dues");
  drawColHeader(monthCols);
  if (!rows.length) {
    commands.push(pdfTextCommand("No dues or payments recorded yet.", left, y - 4, 9));
    y -= ROW_H;
  }
  rows.forEach((entry) => {
    ensureSpace(ROW_H, () => drawColHeader(monthCols));
    drawRow(
      [
        formatMonth(entry.month),
        formatMonthly(entry.due),
        formatMonthly(entry.paid),
        formatMonthly(entry.outstanding),
        entry.status,
        entry.receipts.join(", "),
      ],
      monthCols,
    );
  });
  ensureSpace(ROW_H, () => drawColHeader(monthCols));
  drawRow(
    ["Total", formatMonthly(totals.due), formatMonthly(totals.paid), formatMonthly(totals.outstanding), "", ""],
    monthCols,
    true,
  );

  // Project payments table
  if (projectRows.length) {
    y -= 14;
    const projCols = [
      { heading: "Date", width: 70 },
      { heading: "Project", width: 200 },
      { heading: "Amount USD", width: 90 },
      { heading: "Receipt", width: 135 },
    ];
    sectionTitle("Project Payments");
    drawColHeader(projCols);
    projectRows.forEach((tx) => {
      ensureSpace(ROW_H, () => drawColHeader(projCols));
      drawRow([tx.date || "", tx.project || "", formatUsd(transactionNetUsd(tx)), tx.receiptRef || ""], projCols);
    });
  }

  ensureSpace(30);
  commands.push(pdfTextCommand(
    "Monthly dues and project payments are separated. Project payments are not applied to monthly fees.",
    left,
    y - 8,
    9,
  ));

  flushPage();
  return buildMultiPagePdf(pages);
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
    .filter((transaction) => {
      if (sessionMode === "tenant" && transaction.tenantId && transaction.tenantId !== sessionTenantId) return false;
      return true;
    })
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
    if (transaction.category === "Expenses" && !transaction.serviceType && sessionMode === "owner") {
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
    if (sessionMode === "owner") {
      const delBtn = document.createElement("button");
      delBtn.className = "ledger-action-btn delete-transaction-button danger-action";
      delBtn.type = "button";
      delBtn.dataset.transactionId = transaction.id;
      delBtn.textContent = "Delete";
      actionGroup.append(delBtn);
    }
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

function renderPolls() {
  const polls = (state.polls || []).slice().reverse();
  if (!polls.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "No polls yet. Tap \"+ New Poll\" to start one.";
    els.pollList.replaceChildren(empty);
    return;
  }
  els.pollList.replaceChildren(...polls.map(buildPollCard));
}

function buildPollCard(poll) {
  const activeTenants = state.tenants.filter((t) => t.active !== false);
  const allVoterIds = ["owner", ...activeTenants.map((t) => t.id)];
  const votes = poll.votes || {};
  const yesCount = Object.values(votes).filter((v) => v === "yes").length;
  const noCount = Object.values(votes).filter((v) => v === "no").length;
  const abstainCount = Object.values(votes).filter((v) => v === "abstain").length;
  const totalVoters = allVoterIds.length;
  const pending = allVoterIds.filter((id) => !votes[id]);

  const myId = sessionMode === "owner" ? "owner" : sessionTenantId;
  const myVote = votes[myId];
  const isOpen = poll.status === "open";
  const isOwner = sessionMode === "owner";
  const creatorName = poll.createdBy === "owner" ? "Owner" : tenantName(poll.createdBy);

  const card = document.createElement("article");
  card.className = "poll-card";

  const header = document.createElement("div");
  header.className = "poll-card-header";
  const titleEl = document.createElement("h3");
  titleEl.className = "poll-card-title";
  titleEl.textContent = poll.title;
  const badge = document.createElement("span");
  badge.className = `poll-status-badge ${poll.status}`;
  badge.textContent = poll.status === "open" ? "Open" : "Closed";
  header.append(titleEl, badge);
  card.append(header);

  const meta = document.createElement("p");
  meta.className = "poll-meta";
  meta.textContent = `By ${creatorName} · ${poll.createdAt ? formatDateLabel(poll.createdAt.slice(0, 10)) : ""}`;
  card.append(meta);

  if (poll.description) {
    const desc = document.createElement("p");
    desc.className = "poll-desc";
    desc.textContent = poll.description;
    card.append(desc);
  }

  const tally = document.createElement("div");
  tally.className = "poll-tally";
  const yesPct = totalVoters > 0 ? Math.round((yesCount / totalVoters) * 100) : 0;
  const abstainPct = totalVoters > 0 ? Math.round((abstainCount / totalVoters) * 100) : 0;
  const noPct = totalVoters > 0 ? Math.round((noCount / totalVoters) * 100) : 0;
  const track = document.createElement("div");
  track.className = "poll-tally-track";
  const yesBar = document.createElement("div");
  yesBar.className = "poll-tally-yes";
  yesBar.style.width = `${yesPct}%`;
  const abstainBar = document.createElement("div");
  abstainBar.className = "poll-tally-abstain";
  abstainBar.style.width = `${abstainPct}%`;
  const noBar = document.createElement("div");
  noBar.className = "poll-tally-no";
  noBar.style.width = `${noPct}%`;
  track.append(yesBar, abstainBar, noBar);
  const labels = document.createElement("div");
  labels.className = "poll-tally-labels";
  const yesLbl = document.createElement("span");
  yesLbl.className = "ptl-yes";
  yesLbl.textContent = `YES ${yesCount}`;
  const abstainLbl = document.createElement("span");
  abstainLbl.className = "ptl-abstain";
  abstainLbl.textContent = `ABSTAIN ${abstainCount}`;
  const noLbl = document.createElement("span");
  noLbl.className = "ptl-no";
  noLbl.textContent = `NO ${noCount}`;
  const pendingLbl = document.createElement("span");
  pendingLbl.className = "ptl-pending";
  pendingLbl.textContent = `${pending.length} pending`;
  labels.append(yesLbl, abstainLbl, noLbl, pendingLbl);
  tally.append(labels, track);
  card.append(tally);

  const resultList = document.createElement("ul");
  resultList.className = "poll-result-list";
  allVoterIds.forEach((voterId) => {
    const voterVote = votes[voterId];
    const voterName = voterId === "owner" ? "Owner" : tenantName(voterId);
    const li = document.createElement("li");
    li.className = "poll-result-row";
    const nameEl = document.createElement("span");
    nameEl.className = "prr-name";
    nameEl.textContent = voterName;
    const voteEl = document.createElement("span");
    voteEl.className = `prr-vote ${voterVote || "pending"}`;
    voteEl.textContent = voterVote ? voterVote.toUpperCase() : "—";
    li.append(nameEl, voteEl);
    resultList.append(li);
  });
  card.append(resultList);

  if (isOpen) {
    const voteRow = document.createElement("div");
    voteRow.className = "poll-vote-row";
    const yesBtn = document.createElement("button");
    yesBtn.type = "button";
    yesBtn.className = `vote-btn vote-yes${myVote === "yes" ? " selected" : ""}`;
    yesBtn.dataset.pollId = poll.id;
    yesBtn.dataset.vote = "yes";
    yesBtn.textContent = myVote === "yes" ? "✓ YES" : "Vote YES";
    const abstainBtn = document.createElement("button");
    abstainBtn.type = "button";
    abstainBtn.className = `vote-btn vote-abstain${myVote === "abstain" ? " selected" : ""}`;
    abstainBtn.dataset.pollId = poll.id;
    abstainBtn.dataset.vote = "abstain";
    abstainBtn.textContent = myVote === "abstain" ? "✓ Abstain" : "Abstain";
    const noBtn = document.createElement("button");
    noBtn.type = "button";
    noBtn.className = `vote-btn vote-no${myVote === "no" ? " selected" : ""}`;
    noBtn.dataset.pollId = poll.id;
    noBtn.dataset.vote = "no";
    noBtn.textContent = myVote === "no" ? "✓ NO" : "Vote NO";
    voteRow.append(yesBtn, abstainBtn, noBtn);
    card.append(voteRow);
  }

  if (isOwner) {
    const actRow = document.createElement("div");
    actRow.className = "poll-actions-row";
    if (isOpen) {
      const closeBtn = document.createElement("button");
      closeBtn.type = "button";
      closeBtn.className = "secondary-button poll-close-btn";
      closeBtn.dataset.pollId = poll.id;
      closeBtn.textContent = "Close Poll";
      actRow.append(closeBtn);
    }
    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.className = "danger-button poll-delete-btn";
    delBtn.dataset.pollId = poll.id;
    delBtn.textContent = "Delete";
    actRow.append(delBtn);
    card.append(actRow);
  }

  return card;
}

function openCreatePollDialog() {
  els.pollTitleInput.value = "";
  els.pollDescInput.value = "";
  openDialog(els.pollDialog);
  setTimeout(() => els.pollTitleInput.focus(), 50);
}

function castVote(pollId, vote) {
  const poll = (state.polls || []).find((p) => p.id === pollId);
  if (!poll || poll.status !== "open") return;
  const myId = sessionMode === "owner" ? "owner" : sessionTenantId;
  if (!myId) return;
  poll.votes[myId] = vote;
  saveState();
  renderPolls();
  showToast(`Voted ${vote.toUpperCase()}`);
}

function closePoll(pollId) {
  const poll = (state.polls || []).find((p) => p.id === pollId);
  if (!poll) return;
  poll.status = "closed";
  saveState();
  renderPolls();
  showToast("Poll closed");
}

function deletePoll(pollId) {
  if (!window.confirm("Delete this poll? This cannot be undone.")) return;
  state.polls = (state.polls || []).filter((p) => p.id !== pollId);
  recordDeletedId("polls", pollId);
  saveState();
  renderPolls();
  showToast("Poll deleted");
}


function applyCollectionModeVisibility(mode) {
  const fixed = mode === "fixed";
  els.monthlyBudgetField.classList.toggle("hidden", !fixed);
  els.collectionModeNote.textContent = fixed
    ? "Tenants pay a fixed monthly amount (split by coefficient when set). Anything collected beyond expenses builds the reserve fund."
    : "Each month's recorded expenses are split among tenants (by coefficient when set). No fixed monthly amount.";
}

function renderSettings() {
  els.buildingNameInput.value = (state.building && state.building.name) || "";
  els.defaultDueInput.value = amountInputValue(state.settings.defaultDueUsd);
  els.conversionRateInput.value = Number(state.settings.lbpPerUsd || DEFAULT_LBP_PER_USD);
  els.invoiceUploadUrlInput.value = state.settings.invoiceUploadUrl || "";
  els.cloudSpreadsheetIdInput.value = state.settings.cloudSpreadsheetId || "";
  els.invoiceUploadFolderIdInput.value = state.settings.invoiceUploadFolderId || "";
  els.syncSecretInput.value = state.settings.syncSecret || "";
  els.shareAccessAction = els.shareAccessAction || document.querySelector("#shareAccessAction");
  if (els.shareAccessAction) els.shareAccessAction.classList.toggle("hidden", !hasCloudConfig());
  els.collectionModeInput.value = state.settings.collectionMode || "actual";
  applyCollectionModeVisibility(els.collectionModeInput.value);
  els.ownerPasswordInput.value = "";
  els.ownerPasswordInput.placeholder = state.settings.ownerPasswordHash
    ? "Password set — type to change"
    : "Leave blank for no password";
  els.removeOwnerPasswordButton.classList.toggle("hidden", !state.settings.ownerPasswordHash);
  const coeffSum = state.tenants.reduce((sum, t) => sum + (t.coefficient || 0), 0);
  const tenantsWithCoeff = state.tenants.filter((t) => t.coefficient > 0).length;
  if (tenantsWithCoeff > 0) {
    const ok = coeffSum === 1000;
    els.coefficientStatus.textContent = ok
      ? `Coefficients: ${coeffSum}/1000 — all tenants accounted for.`
      : `Coefficients: ${coeffSum}/1000 — must total 1000. ${1000 - coeffSum > 0 ? `${1000 - coeffSum} remaining.` : `${coeffSum - 1000} over.`}`;
    els.coefficientStatus.className = ok ? "settings-note coeff-ok" : "settings-note coeff-warn";
  } else {
    els.coefficientStatus.textContent = "No coefficients set — all tenants use the same flat monthly amount.";
    els.coefficientStatus.className = "settings-note";
  }
  els.reloadSheetAction.classList.toggle("hidden", !hasCloudConfig());
  renderCloudStatus();
}

function renderAll() {
  renderDashboard();
  renderPayments();
  renderTenants();
  renderProjects();
  renderServices();
  renderLedger();
  renderPolls();
  renderDatalists();
  renderSettings();
}

const MORE_VIEWS = ["projectsView", "servicesView", "pollsView", "settingsView"];

function setView(viewId) {
  if (sessionMode === "tenant" && viewId === "settingsView") viewId = "dashboardView";
  els.views.forEach((view) => view.classList.toggle("active", view.id === viewId));
  els.navButtons.forEach((button) => {
    if (button.id === "moreNavButton") button.classList.toggle("active", MORE_VIEWS.includes(viewId));
    else button.classList.toggle("active", button.dataset.view === viewId);
  });
  els.moreSheetItems.forEach((item) => item.classList.toggle("is-active", item.dataset.view === viewId));
}

function openDialog(dialog) {
  if (typeof dialog.showModal === "function") dialog.showModal();
  else dialog.setAttribute("open", "");
}

function closeDialog(dialog) {
  if (typeof dialog.close === "function") dialog.close();
  else dialog.removeAttribute("open");
}

function populateTenantSelect(includeBuildingOption = false) {
  const previous = els.transactionTenant.value;
  const options = [];
  if (includeBuildingOption) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "Building cash (no tenant)";
    options.push(option);
  }
  state.tenants.forEach((tenant) => {
    const option = document.createElement("option");
    option.value = tenant.id;
    option.textContent = tenant.name;
    options.push(option);
  });
  els.transactionTenant.replaceChildren(...options);
  if (previous && state.tenants.some((t) => t.id === previous)) els.transactionTenant.value = previous;
  else if (includeBuildingOption) els.transactionTenant.value = "";
}

function updateTransactionDirectionLabels() {
  const category = els.transactionCategory.value;
  const [creditOption, debitOption] = els.transactionDirection.options;
  if (category === "Opening Balance") {
    if (els.transactionTenant.value) {
      creditOption.textContent = "Tenant has credit (prepaid)";
      debitOption.textContent = "Tenant owes (opening due)";
    } else {
      creditOption.textContent = "Cash on hand (add)";
      debitOption.textContent = "Cash shortfall (subtract)";
    }
  } else {
    creditOption.textContent = "Received";
    debitOption.textContent = "Applied or paid out";
  }
}

function expenseInvoiceSequenceNumber(value) {
  const match = String(value || "").trim().match(/(\d+)$/);
  return match ? Number(match[1]) : 0;
}

function nextExpenseInvoiceNumber(excludeTransactionId = null) {
  const highest = state.transactions
    .filter((t) => t.category === "Expenses" && t.id !== excludeTransactionId)
    .reduce((max, t) => Math.max(max, expenseInvoiceSequenceNumber(t.invoice)), 0);
  return `${EXPENSE_INVOICE_PREFIX}${String(highest + 1).padStart(4, "0")}`;
}

function maybeSetNextExpenseInvoiceNumber() {
  const cat = els.transactionCategory.value;
  if (editingExpenseId || cat !== "Expenses" || els.transactionInvoice.value.trim()) return;
  els.transactionInvoice.value = nextExpenseInvoiceNumber();
}

function syncTransactionFormMode() {
  const category = els.transactionCategory.value;
  const project = els.transactionProject.value.trim();
  const tenantMode = category === "Payments" || category === "Advance Payments";
  const openingMode = category === "Opening Balance";
  const monthlyPaymentMode = category === "Payments" && !project;
  const expenseMode = category === "Expenses";
  const serviceMode = category === "Services Expenses";
  const expenseLike = expenseMode || serviceMode;
  populateTenantSelect(openingMode);
  document.querySelector(".service-fields").classList.toggle("hidden", !serviceMode);
  const waterMode = serviceMode && els.transactionService.value === "water";
  document.querySelector(".service-part-wrap").classList.toggle("hidden", !serviceMode || waterMode);
  document.querySelector(".service-split-wrap").classList.toggle("hidden", !waterMode);
  document.querySelector(".tenant-field").classList.toggle("hidden", !(tenantMode || openingMode));
  document.querySelector(".direction-field").classList.toggle("hidden", !(category === "Advance Payments" || openingMode));
  document.querySelector(".description-field").classList.toggle("hidden", tenantMode);
  document.querySelector(".month-field").classList.toggle("hidden", !(monthlyPaymentMode || serviceMode));
  document.querySelector(".lbp-amount-field").classList.toggle("hidden", !expenseLike);
  document.querySelector(".amount-row").classList.toggle("monthly-usd-only", !expenseLike);
  document.querySelector(".extra-fields").classList.toggle("hidden", !expenseLike);
  document.querySelector(".expense-category-field").classList.toggle("hidden", !expenseMode);
  document.querySelector(".invoice-file-field").classList.toggle("hidden", !expenseLike);
  document.querySelector(".project-combobox").closest("label").classList.toggle("hidden", serviceMode);
  document.querySelector(".shared-expense-dist-field").classList.add("hidden");
  els.sharedExpenseInlinePreview.classList.add("hidden");
  els.expenseConversionPreview.classList.toggle("hidden", !expenseLike);
  els.invoiceAttachmentStatus.classList.toggle("hidden", !expenseMode || !editingExpenseId);
  els.transactionDescription.required = !tenantMode && !openingMode && !serviceMode;
  els.transactionMonth.required = serviceMode;
  updateTransactionDirectionLabels();
  maybeSetNextExpenseInvoiceNumber();
  updateExpenseConversionPreview();
}

function updateExpenseConversionPreview() {
  const cat = els.transactionCategory.value;
  if (cat !== "Expenses" && cat !== "Services Expenses") return;
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
  els.transactionUsd.value = "";
  if (category !== "Expenses") {
    els.transactionSupplier.value = "";
    els.transactionInvoice.value = "";
  }
  syncTransactionFormMode();
  if (category === "Opening Balance") {
    els.transactionTenant.value = "";
    updateTransactionDirectionLabels();
  }
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

function createTransactionsFromForm() {
  const category = els.transactionCategory.value;
  const isExpense = category === "Expenses";
  const isServiceExpense = category === "Services Expenses";
  const isExpenseLike = isExpense || isServiceExpense;
  const amountLbp = isExpenseLike ? Number(els.transactionLbp.value || 0) : 0;
  const amountUsd = Number(els.transactionUsd.value || 0);
  if (!amountLbp && !amountUsd) throw new Error("Enter an amount");

  const tenantId = els.transactionTenant.value;
  const isOpening = category === "Opening Balance";
  const openingTenantId = isOpening ? (tenantId || null) : null;
  const isDebit =
    isExpenseLike ||
    ((category === "Advance Payments" || isOpening) && els.transactionDirection.value === "debit");
  const tenantMode = category === "Payments" || category === "Advance Payments";

  const serviceType = isServiceExpense ? els.transactionService.value : "";
  const isWater = isServiceExpense && serviceType === "water";
  const servicePart = isServiceExpense && !isWater ? els.transactionServicePart.value : "";
  const waterSplit = isWater ? els.transactionServiceSplit.value : "";
  const serviceForMonth = isServiceExpense ? monthIso(els.transactionMonth.value) : null;
  if (isServiceExpense && !serviceForMonth) throw new Error("Select the service month");

  let description = tenantMode ? tenantName(tenantId) : els.transactionDescription.value.trim();
  if (isOpening && !description) {
    description = openingTenantId ? `Opening balance - ${tenantName(openingTenantId)}` : "Opening balance";
  }
  if (isServiceExpense && !description) {
    if (isWater) description = `Water - ${formatMonth(serviceForMonth)}`;
    else description = `Generator ${servicePart === "maintenance" ? "maintenance" : "fuel"} - ${formatMonth(serviceForMonth)}`;
  }
  if (!description) throw new Error("Enter a description");

  const project = els.transactionProject.value.trim();
  const supplier = els.transactionSupplier.value.trim();
  const expenseCategory = isExpense ? els.transactionExpenseCategory.value.trim() : "";
  if (!isServiceExpense) addKnownValue(state.projects, project);
  addKnownValue(state.suppliers, supplier);
  if (expenseCategory) addKnownValue(state.expenseCategories, expenseCategory);

  const baseTransaction = {
    id: `tx-${Date.now()}`,
    category,
    description,
    tenantId: tenantMode ? tenantId : openingTenantId,
    forMonth: category === "Payments" && !project ? monthIso(els.transactionMonth.value) : serviceForMonth,
    project: isServiceExpense ? "" : project,
    date: els.transactionDate.value,
    supplier,
    invoice: els.transactionInvoice.value.trim(),
    expenseCategory: isWater
      ? "Water"
      : isServiceExpense
        ? (servicePart === "maintenance" ? "Generator Maintenance" : "Generator Fuel")
        : expenseCategory,
    serviceType,
    servicePart,
    debitUsd: isDebit ? amountUsd : 0,
    debitLbp: isDebit ? amountLbp : 0,
    creditUsd: isDebit ? 0 : amountUsd,
    creditLbp: isDebit ? 0 : amountLbp,
    balanceUsd: isDebit ? -amountUsd : amountUsd,
    balanceLbp: isDebit ? -amountLbp : amountLbp,
    invoiceAttachment: null,
    sourceRow: null,
  };

  // Plain expenses snapshot a per-tenant coefficient split. Water tankers snapshot
  // an equal or by-coefficient split chosen at entry and bill immediately. Generator
  // service expenses carry no shares — they bill via the monthly meter readings.
  if (isExpense) {
    const shares = computeSharedExpenseShares(toUsd(amountUsd, amountLbp), "coefficient");
    baseTransaction.shares = Object.keys(shares).length ? shares : null;
  } else if (isWater) {
    baseTransaction.waterSplit = waterSplit;
    const shares = computeSharedExpenseShares(toUsd(amountUsd, amountLbp), waterSplit);
    baseTransaction.shares = Object.keys(shares).length ? shares : null;
  }

  // Payments: simple credit — no month allocation, receipt assigned
  if (category === "Payments" && !project) {
    const receiptRef = nextReceiptReference(els.transactionDate.value || localDateInput());
    const paymentGroupId = `pay-${Date.now()}`;
    return [{
      ...baseTransaction,
      id: `${paymentGroupId}-01`,
      receiptRef,
      paymentGroupId,
    }];
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
  return Boolean(cloudConfig().scriptUrl);
}

function renderCloudStatus(message = "") {
  if (!els.cloudSyncStatus) return;
  els.cloudSyncStatus.textContent =
    message ||
    (hasCloudConfig()
      ? "Cloud sync is on. Data is saved locally and synced to the Google Sheet."
      : "Cloud sync is off. Enter the Google Apps Script URL in Settings to enable.");
}

const SYNC_CHIP_TEXT = { saving: "Saving…", saved: "Saved", error: "Sync error", offline: "Offline", local: "Local" };

// Header status chip reflecting cloud-sync state. "local" (no cloud configured)
// stays hidden via CSS so single-device users aren't shown a meaningless badge.
function setSyncChip(kind) {
  if (!els.syncChip) return;
  const state_ = hasCloudConfig() ? kind : "local";
  els.syncChip.classList.remove("is-saving", "is-saved", "is-error", "is-offline", "is-local");
  els.syncChip.classList.add(`is-${state_}`);
  els.syncChipText.textContent = SYNC_CHIP_TEXT[state_] || "";
}

function downloadBackup() {
  const data = JSON.stringify(state, null, 2);
  downloadBlob(data, "application/json", `building-account-backup-${localDateInput()}.json`);
  showToast("Backup downloaded");
}

async function restoreFromBackupFile(file) {
  if (!file) return;
  let parsed;
  try {
    parsed = JSON.parse(await file.text());
  } catch {
    showToast("That file is not a valid backup");
    return;
  }
  if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.tenants) || !Array.isArray(parsed.transactions)) {
    showToast("That file does not look like a building backup");
    return;
  }
  const summary = `${parsed.tenants.length} tenants, ${parsed.transactions.length} transactions`;
  if (!window.confirm(`Restore this backup (${summary})? It replaces the data on this device. Your current data will be downloaded first as a safety copy.`)) {
    return;
  }
  // Safety net: download the current data before overwriting it.
  downloadBlob(JSON.stringify(state, null, 2), "application/json", `building-account-before-restore-${localDateInput()}.json`);
  state = hydrateState(parsed);
  saveState({ sync: false }); // local only — does not push the restore to the cloud
  selectedMonth = null;
  populateTenantSelect();
  renderAll();
  showToast("Backup restored on this device");
}

async function postCloudAction(action, payload = {}) {
  const config = cloudConfig();
  if (!config.scriptUrl) throw new Error("Google Apps Script URL not set. Add it in Settings.");
  const body = { action, ...payload };
  if (config.spreadsheetId) body.spreadsheetId = config.spreadsheetId;
  const secret = String(state?.settings?.syncSecret || "").trim();
  if (secret) body.token = secret;
  const response = await fetch(config.scriptUrl, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error("Google Sheet sync failed");
  const result = await response.json();
  if (!result.success) throw new Error(result.error || "Google Sheet sync failed");
  return result;
}

// ── Sync conflict protection ─────────────────────────────────────────────────
// The Sheet stores whole-state snapshots, so two devices writing close together
// used to silently overwrite each other. Each pushed snapshot now carries a
// random token; if the cloud token is not the one this device last synced,
// another device wrote in between and the two states are merged item-by-item
// before pushing. Deletions survive merging through the state.deleted tombstones.
function recordDeletedId(kind, id) {
  state.deleted ||= {};
  state.deleted[kind] ||= [];
  state.deleted[kind].push(id);
  state.deleted[kind] = state.deleted[kind].slice(-1000);
}

function mergeById(olderArr, newerArr, deletedIds = []) {
  const map = new Map();
  (olderArr || []).forEach((item) => item?.id && map.set(item.id, item));
  (newerArr || []).forEach((item) => item?.id && map.set(item.id, item));
  deletedIds.forEach((id) => map.delete(id));
  return [...map.values()];
}

function mergeByMonth(olderArr, newerArr) {
  const map = new Map();
  (olderArr || []).forEach((entry) => entry?.month && map.set(entry.month, entry));
  (newerArr || []).forEach((entry) => entry?.month && map.set(entry.month, entry));
  return [...map.values()];
}

function mergePolls(olderArr, newerArr, deletedIds = []) {
  const map = new Map();
  (olderArr || []).forEach((p) => p?.id && map.set(p.id, p));
  (newerArr || []).forEach((p) => {
    if (!p?.id) return;
    const prev = map.get(p.id);
    if (!prev) {
      map.set(p.id, p);
      return;
    }
    map.set(p.id, {
      ...prev,
      ...p,
      votes: { ...(prev.votes || {}), ...(p.votes || {}) },
      status: prev.status === "closed" || p.status === "closed" ? "closed" : p.status,
    });
  });
  deletedIds.forEach((id) => map.delete(id));
  return [...map.values()];
}

function mergeDeclarations(olderArr, newerArr) {
  const map = new Map();
  [...(olderArr || []), ...(newerArr || [])].forEach((d) => {
    if (!d?.id) return;
    const prev = map.get(d.id);
    if (!prev || (prev.status !== "acknowledged" && d.status === "acknowledged")) map.set(d.id, d);
  });
  return [...map.values()];
}

function mergeDeletedLists(local, remote) {
  const kinds = ["transactions", "tenants", "polls", "projects"];
  const merged = {};
  kinds.forEach((kind) => {
    merged[kind] = [...new Set([...(local?.[kind] || []), ...(remote?.[kind] || [])])].slice(-1000);
  });
  return merged;
}

function mergeStates(local, remote) {
  const localEpoch = Number(local.meta?.epoch || 0);
  const remoteEpoch = Number(remote.meta?.epoch || 0);
  // An epoch bump means "Zero Accounts" / "Reset" happened: the higher epoch
  // wins wholesale so wiped data is not resurrected by a stale device.
  if (localEpoch !== remoteEpoch) return clone(localEpoch > remoteEpoch ? local : remote);

  const localNewer = String(local.meta?.updatedAt || "") >= String(remote.meta?.updatedAt || "");
  const newer = localNewer ? local : remote;
  const older = localNewer ? remote : local;
  const merged = clone(newer);
  merged.deleted = mergeDeletedLists(local.deleted, remote.deleted);
  merged.transactions = mergeById(older.transactions, newer.transactions, merged.deleted.transactions);
  merged.tenants = mergeById(older.tenants, newer.tenants, merged.deleted.tenants);
  merged.buildingProjects = mergeById(older.buildingProjects, newer.buildingProjects, merged.deleted.projects);
  merged.polls = mergePolls(older.polls, newer.polls, merged.deleted.polls);
  merged.paymentDeclarations = mergeDeclarations(older.paymentDeclarations, newer.paymentDeclarations);
  merged.suppliers = mergeById(older.suppliers, newer.suppliers);
  merged.projects = mergeById(older.projects, newer.projects);
  merged.expenseCategories = mergeById(older.expenseCategories, newer.expenseCategories);
  merged.serviceReadings = mergeById(older.serviceReadings, newer.serviceReadings);
  merged.monthlyExpected = mergeByMonth(older.monthlyExpected, newer.monthlyExpected);
  merged.meta = {
    rev: Math.max(Number(local.meta?.rev || 0), Number(remote.meta?.rev || 0)) + 1,
    epoch: localEpoch,
    token: "",
    updatedAt: new Date().toISOString(),
  };
  return merged;
}

function localHasUnsyncedChanges() {
  return Number(state.meta?.rev || 0) > Number(loadSyncMeta().lastPushedRev || 0);
}

function queueCloudSave() {
  if (!hasCloudConfig()) return;
  setSyncChip("saving");
  window.clearTimeout(cloudSaveTimer);
  cloudSaveTimer = window.setTimeout(() => saveCloudState({ silent: true }), 900);
}

async function saveCloudState({ silent = false } = {}) {
  if (cloudSaveInFlight) return;
  window.clearTimeout(cloudSaveTimer);
  cloudSaveInFlight = true;
  setSyncChip("saving");
  try {
    if (!silent) renderCloudStatus("Saving to Google Sheet...");
    // Check whether another device wrote since this device last synced.
    const sync = loadSyncMeta();
    let remote = null;
    try {
      const result = await postCloudAction("loadState");
      remote = result?.state || null;
    } catch {
      // Cloud unreachable for the pre-check; push anyway (best effort).
    }
    let mergedForeignChanges = false;
    if (remote && remote.meta?.token && remote.meta.token !== sync.lastSyncedToken) {
      state = hydrateState(mergeStates(state, remote));
      mergedForeignChanges = true;
    }
    state.meta.token = randomToken();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    await postCloudAction("saveState", { state });
    saveSyncMeta({ lastSyncedToken: state.meta.token, lastPushedRev: Number(state.meta.rev || 0) });
    if (mergedForeignChanges) {
      populateTenantSelect();
      renderAll();
    }
    renderCloudStatus(`Google Sheet saved at ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`);
    setSyncChip("saved");
    if (!silent) showToast("Saved to Google Sheet");
  } catch (error) {
    renderCloudStatus(error.message);
    setSyncChip(navigator.onLine === false ? "offline" : "error");
    if (!silent) showToast(error.message);
  } finally {
    cloudSaveInFlight = false;
  }
}

async function loadCloudState() {
  if (!window.confirm("Reload from the Google Sheet? This replaces the data on this device with the cloud copy. Any changes here that haven't synced yet will be lost.")) return;
  try {
    renderCloudStatus("Loading from Google Sheet...");
    const result = await postCloudAction("loadState");
    if (!result.state) throw new Error("No app data found in Google Sheet");
    state = hydrateState(result.state);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    saveSyncMeta({ lastSyncedToken: state.meta?.token || "", lastPushedRev: Number(state.meta?.rev || 0) });
    selectedMonth = null;
    populateTenantSelect();
    renderAll();
    renderCloudStatus("Loaded from Google Sheet");
    setSyncChip("saved");
    showToast("Loaded from Google Sheet");
  } catch (error) {
    renderCloudStatus(error.message);
    setSyncChip(navigator.onLine === false ? "offline" : "error");
    showToast(error.message);
  }
}

// ── Tenant onboarding via a shareable access code ────────────────────────────
// The code bundles the cloud config (Apps Script URL, Sheet ID, sync secret) so a
// tenant's fresh device can connect without owner-only Settings access.
function encodeSyncCode(obj) {
  return btoa(unescape(encodeURIComponent(JSON.stringify(obj))));
}

function decodeSyncCode(code) {
  return JSON.parse(decodeURIComponent(escape(atob(String(code).trim()))));
}

function buildSyncCode() {
  return encodeSyncCode({
    u: state.settings.invoiceUploadUrl || "",
    s: state.settings.cloudSpreadsheetId || "",
    k: state.settings.syncSecret || "",
  });
}

async function shareSyncCode() {
  if (!hasCloudConfig()) { showToast("Set the Google Apps Script URL first, then Save"); return; }
  const code = buildSyncCode();
  const message =
    `${state.building.name || "Building"} – access code\n\n${code}\n\n` +
    `On the app login screen, tap "Connect to a building" and paste this code.`;
  try {
    if (typeof navigator.share === "function") {
      await navigator.share({ title: "Building Account access", text: message });
      return;
    }
  } catch (error) {
    if (error?.name === "AbortError") return;
  }
  try {
    await navigator.clipboard.writeText(code);
    showToast("Access code copied — send it to your tenants");
    return;
  } catch {
    window.prompt("Copy this access code and send it to your tenants:", code);
  }
}

async function applySyncCode(rawCode) {
  if (!rawCode || !rawCode.trim()) { showToast("Paste the access code first"); return; }
  let cfg;
  try {
    cfg = decodeSyncCode(rawCode);
  } catch {
    showToast("That access code is not valid");
    return;
  }
  if (!cfg || !cfg.u) { showToast("That access code is missing the sync address"); return; }

  state.settings.invoiceUploadUrl = String(cfg.u || "").trim();
  state.settings.cloudSpreadsheetId = String(cfg.s || "").trim();
  state.settings.syncSecret = String(cfg.k || "").trim();
  saveState({ sync: false });

  try {
    renderCloudStatus("Connecting…");
    setSyncChip("saving");
    const result = await postCloudAction("loadState");
    if (!result.state) throw new Error("No building data found at that address");
    state = hydrateState(result.state);
    // Preserve the cloud config we just entered, in case the pulled state lacks it.
    state.settings.invoiceUploadUrl = String(cfg.u || "").trim();
    state.settings.cloudSpreadsheetId = String(cfg.s || "").trim();
    state.settings.syncSecret = String(cfg.k || "").trim();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    saveSyncMeta({ lastSyncedToken: state.meta?.token || "", lastPushedRev: Number(state.meta?.rev || 0) });
    selectedMonth = null;
    populateTenantSelect();
    renderAll();
    setSyncChip("saved");
    closeDialog(els.connectDialog);
    els.connectCodeInput.value = "";
    showLoginScreen();
    if (!els.loginTenantTab.classList.contains("hidden")) els.loginTenantTab.click();
    showToast("Connected. Choose your name and enter your PIN.");
  } catch (error) {
    setSyncChip(navigator.onLine === false ? "offline" : "error");
    showToast(error.message || "Could not connect to the building");
  }
}

async function zeroAccounts() {
  if (!window.confirm("Clear all payments and expenses? Your tenants are kept. Use this to start a fresh period (e.g. a new year). This cannot be undone.")) {
    return;
  }
  state.transactions = [];
  state.monthlyExpected = [];
  state.projects = [];
  state.suppliers = [];
  state.sharedExpenses = [];
  state.categories = DEFAULT_CATEGORIES.slice();
  state.settings.defaultDueUsd = 0;
  state.deleted = { transactions: [], tenants: [], polls: [], projects: [] };
  state.meta.epoch = Number(state.meta?.epoch || 0) + 1;
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

const ENTRY_TITLES = {
  Payments: "Record Payment",
  Expenses: "Record Expense",
  "Services Expenses": "Generator / Water Cost",
  "Opening Balance": "Opening Balance",
};

// Opened from the "+" chooser: preset the category, hide the Type dropdown
// (the chooser already picked it), and show a Back arrow to the chooser.
function openEntryForm(category) {
  resetTransactionForm();
  if (category !== "Payments") {
    els.transactionCategory.value = category;
    applyTransactionCategoryDefaults();
  }
  els.transactionDialogTitle.textContent = ENTRY_TITLES[category] || "Add Transaction";
  document.querySelector(".type-field").classList.add("hidden");
  els.transactionBackButton.classList.remove("hidden");
  openDialog(els.transactionDialog);
  setTimeout(() => (category === "Payments" ? els.transactionTenant : els.transactionUsd).focus(), 50);
}

function resetTransactionForm() {
  editingExpenseId = null;
  els.transactionForm.reset();
  els.transactionBackButton.classList.add("hidden"); // shown only when opened via the chooser
  document.querySelector(".type-field").classList.remove("hidden");
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
  if (sessionMode !== "owner") return;
  const transaction = state.transactions.find((entry) => entry.id === transactionId);
  if (transaction?.serviceType === "generator") {
    showToast("Edit generator bills from the Services tab");
    return;
  }
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
  if (sessionMode !== "owner") return;
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
  state.sharedExpenses = (state.sharedExpenses || []).filter((se) => se.expenseTransactionId !== transactionId);
  recordDeletedId("transactions", transactionId);
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
  els.tenantCoefficientInput.value = "";
  els.tenantBreakerInput.value = "";
  els.tenantPinDialogInput.value = "";
  els.tenantPinDialogInput.placeholder = "Leave blank to disable tenant login";
  els.removeTenantPinButton.classList.add("hidden");
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
  els.tenantCoefficientInput.value = tenant.coefficient > 0 ? String(tenant.coefficient) : "";
  els.tenantBreakerInput.value = tenant.breakerAmps > 0 ? String(tenant.breakerAmps) : "";
  els.tenantPinDialogInput.value = "";
  els.tenantPinDialogInput.placeholder = tenant.pinHash ? "PIN set — type to change" : "Leave blank to disable tenant login";
  els.removeTenantPinButton.classList.toggle("hidden", !tenant.pinHash);
  els.tenantSubmitButton.textContent = "Save";
  openDialog(els.tenantDialog);
  els.tenantNameInput.focus();
}

function handleTenantFormSubmit(event) {
  event.preventDefault();
  const name = els.tenantNameInput.value.trim();
  const unit = els.tenantUnitInput.value.trim();
  const phone = els.tenantPhoneDialogInput.value.trim();
  const coefficient = Math.max(0, Math.min(1000, Number(els.tenantCoefficientInput.value || 0)));
  const breakerAmps = Math.max(0, Number(els.tenantBreakerInput.value || 0));
  const pinEntered = els.tenantPinDialogInput.value.trim();
  if (!name || !unit) return;

  if (editingTenantId) {
    const tenant = state.tenants.find((t) => t.id === editingTenantId);
    if (tenant) {
      tenant.name = name;
      tenant.unit = unit;
      tenant.phone = phone;
      tenant.coefficient = coefficient;
      tenant.breakerAmps = breakerAmps;
      if (pinEntered) tenant.pinHash = hashSecret(pinEntered, state.security.salt);
    }
    showToast("Tenant updated");
  } else {
    state.tenants.push({
      id: generateTenantId(name),
      name,
      unit,
      active: true,
      phone,
      coefficient,
      breakerAmps,
      pinHash: pinEntered ? hashSecret(pinEntered, state.security.salt) : "",
    });
    showToast(`${name} added`);
  }

  saveState();
  closeDialog(els.tenantDialog);
  editingTenantId = null;
  renderAll();
}

function deleteTenant(tenantId) {
  if (sessionMode !== "owner") return;
  const tenant = state.tenants.find((t) => t.id === tenantId);
  if (!tenant) return;
  const txCount = state.transactions.filter((t) => t.tenantId === tenantId).length;
  const msg = txCount > 0
    ? `Delete ${tenant.name}? Their ${txCount} transaction(s) will be kept but unlinked from this tenant.`
    : `Delete ${tenant.name}?`;
  if (!window.confirm(msg)) return;
  state.tenants = state.tenants.filter((t) => t.id !== tenantId);
  recordDeletedId("tenants", tenantId);
  saveState();
  renderAll();
  showToast(`${tenant.name} removed`);
}

function buildWhatsAppUrl(tenant, dueAmount, statementMonth = null) {
  const phone = (tenant.phone || "").replace(/\D/g, "");
  if (!phone) return null;
  const monthLine = statementMonth ? ` as of the ${formatMonth(statementMonth)} statement` : "";
  const message = [
    `${state.building.name} – Payment Reminder`,
    `Hi ${tenant.name}, your outstanding balance${monthLine} is ${formatUsd(dueAmount)}.`,
    `Please settle at your earliest convenience. Thank you.`,
  ].join("\n");
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

function buildMonthlyDueWhatsAppUrl(tenant, owed, month) {
  const phone = (tenant.phone || "").replace(/\D/g, "");
  if (!phone) return null;
  const message = [
    `${state.building.name} – Payment Reminder`,
    `Hi ${tenant.name}, your building payment for ${formatMonth(month)} is outstanding: ${formatUsd(owed)}.`,
    `Please settle at your earliest convenience. Thank you.`,
  ].join("\n");
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

function buildSharedExpensesWhatsAppUrl(tenant, owed, month) {
  const phone = (tenant.phone || "").replace(/\D/g, "");
  if (!phone) return null;
  const message = [
    `${state.building.name} – Shared Expenses Reminder`,
    `Hi ${tenant.name}, your share of the building shared expenses for ${formatMonth(month)} is outstanding: ${formatMonthly(owed)}.`,
    `Please settle at your earliest convenience. Thank you.`,
  ].join("\n");
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

function openSharedExpensesWhatsAppReminderDialog() {
  const data = buildSharedExpensesForMonth(selectedMonth);
  if (!data) { showToast("No shared expenses for this month"); return; }

  const dueStatuses = data.tenantStatuses.filter(({ totalShare, covered }) => covered < totalShare - 0.005);
  if (!dueStatuses.length) { showToast("All tenants have paid their shared expenses"); return; }

  const withPhone = dueStatuses.filter(({ tenant }) => tenant.phone);
  const withoutPhone = dueStatuses.filter(({ tenant }) => !tenant.phone);

  els.whatsappDialogTitle.textContent = `Shared Expenses Reminders – ${formatMonth(selectedMonth)}`;
  els.whatsappDialogNote.textContent = withoutPhone.length
    ? `${withoutPhone.map(({ tenant }) => tenant.name).join(", ")} skipped – no phone number saved in the Tenants tab.`
    : "";
  els.whatsappDialogNote.classList.toggle("hidden", !withoutPhone.length);

  if (!withPhone.length) { showToast("No due tenants have a phone number saved"); return; }

  els.whatsappReminderList.replaceChildren(
    ...withPhone.map(({ tenant, totalShare, covered }) => {
      const owed = roundUsd(totalShare - covered);
      const url = buildSharedExpensesWhatsAppUrl(tenant, owed, selectedMonth);
      const row = document.createElement("div");
      row.className = "whatsapp-reminder-row";
      const info = document.createElement("div");
      const name = document.createElement("strong");
      name.textContent = tenant.name;
      const detail = document.createElement("span");
      detail.textContent = `Unit ${tenant.unit} – ${formatMonthly(owed)} due – ${formatMonth(selectedMonth)}`;
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

function buildProjectWhatsAppUrl(tenant, project, owedAmount) {
  const phone = (tenant.phone || "").replace(/\D/g, "");
  if (!phone) return null;
  const message = [
    `${state.building.name} – Project Payment Reminder`,
    `Hi ${tenant.name}, your share for the "${project.name}" project is ${formatMonthly(owedAmount)}, due by ${formatDateLabel(project.dueDate)}.`,
    `Please settle at your earliest convenience. Thank you.`,
  ].join("\n");
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

function openProjectWhatsAppReminderDialog(project) {
  const activeTenants = state.tenants.filter((t) => t.active !== false);
  const dueStatuses = activeTenants
    .map((tenant) => ({ tenant, ...getProjectTenantStatus(project, tenant.id) }))
    .filter(({ share, paid }) => share > 0 && paid < share - 0.005);

  if (!dueStatuses.length) {
    showToast("All tenants have paid their share");
    return;
  }

  const withPhone = dueStatuses.filter(({ tenant }) => tenant.phone);
  const withoutPhone = dueStatuses.filter(({ tenant }) => !tenant.phone);

  els.whatsappDialogTitle.textContent = `Reminders – ${project.name}`;
  els.whatsappDialogNote.textContent = withoutPhone.length
    ? `${withoutPhone.map(({ tenant }) => tenant.name).join(", ")} skipped – no phone number saved in the Tenants tab.`
    : "";
  els.whatsappDialogNote.classList.toggle("hidden", !withoutPhone.length);

  if (!withPhone.length) {
    showToast("No due tenants have a phone number saved");
    return;
  }

  els.whatsappReminderList.replaceChildren(
    ...withPhone.map(({ tenant, share, paid }) => {
      const owed = roundUsd(share - paid);
      const url = buildProjectWhatsAppUrl(tenant, project, owed);
      const row = document.createElement("div");
      row.className = "whatsapp-reminder-row";
      const info = document.createElement("div");
      const name = document.createElement("strong");
      name.textContent = tenant.name;
      const detail = document.createElement("span");
      detail.textContent = `${formatMonthly(owed)} outstanding – due ${formatDateLabel(project.dueDate)}`;
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

function openWhatsAppReminderDialog() {
  const lastMonth = getLastCompletedMonth();
  els.whatsappDialogTitle.textContent = `Payment Reminders – ${formatMonth(lastMonth)} Statement`;

  const activeTenants = state.tenants.filter((t) => t.active !== false);
  const dueEntries = activeTenants
    .map((tenant) => ({ tenant, notification: getTenantStatementNotification(tenant.id) }))
    .filter(({ notification }) => notification !== null);

  if (!dueEntries.length) { showToast("No outstanding statement balances"); return; }

  const withPhone = dueEntries.filter(({ tenant }) => tenant.phone);
  const withoutPhone = dueEntries.filter(({ tenant }) => !tenant.phone);

  els.whatsappDialogNote.textContent = withoutPhone.length
    ? `${withoutPhone.map(({ tenant }) => tenant.name).join(", ")} skipped – no phone number saved.`
    : "";
  els.whatsappDialogNote.classList.toggle("hidden", !withoutPhone.length);

  if (!withPhone.length) { showToast("No due tenants have a phone number saved"); return; }

  els.whatsappReminderList.replaceChildren(
    ...withPhone.map(({ tenant, notification }) => {
      const { month, statementBalance, paidSince, remaining } = notification;
      const url = buildWhatsAppUrl(tenant, remaining, month);
      const row = document.createElement("div");
      row.className = "whatsapp-reminder-row";
      const info = document.createElement("div");
      const name = document.createElement("strong");
      name.textContent = tenant.name;
      const detail = document.createElement("span");
      detail.textContent = paidSince > 0
        ? `Unit ${tenant.unit} – ${formatUsd(remaining)} remaining (stmt ${formatUsd(statementBalance)}, paid ${formatUsd(paidSince)})`
        : `Unit ${tenant.unit} – ${formatUsd(remaining)} due (${formatMonth(month)} statement)`;
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
  els.navButtons.forEach((button) => {
    if (button.id === "moreNavButton") {
      button.addEventListener("click", () => openDialog(els.moreSheet));
    } else {
      button.addEventListener("click", () => setView(button.dataset.view));
    }
  });
  els.moreSheetItems.forEach((item) =>
    item.addEventListener("click", () => {
      setView(item.dataset.view);
      closeDialog(els.moreSheet);
    }),
  );
  els.closeMoreSheet.addEventListener("click", () => closeDialog(els.moreSheet));
  els.moreSheet.addEventListener("click", (event) => {
    if (event.target === els.moreSheet) closeDialog(els.moreSheet);
  });
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
    const paidBtn = event.target.closest(".paid-declaration-btn[data-tenant-id]");
    if (paidBtn) { declarePayment(paidBtn.dataset.tenantId, paidBtn.dataset.month, paidBtn.dataset.amount); return; }
    const noPhoneBtn = event.target.closest(".whatsapp-no-phone[data-edit-tenant-id]");
    if (noPhoneBtn) { openEditTenantDialog(noPhoneBtn.dataset.editTenantId); return; }
    const button = event.target.closest("button[data-tenant-id]");
    if (!button) return;
    openPaymentDialogFor(button.dataset.tenantId, button.dataset.month, button.dataset.due);
  });
  els.attentionList.addEventListener("click", (event) => {
    const row = event.target.closest(".attention-row[data-view]");
    if (row) setView(row.dataset.view);
  });
  els.declarationsList.addEventListener("click", (event) => {
    const recordBtn = event.target.closest(".declaration-record-btn[data-decl-id]");
    if (recordBtn) { acknowledgeDeclaration(recordBtn.dataset.declId, { record: true }); return; }
    const dismissBtn = event.target.closest(".declaration-dismiss-btn[data-decl-id]");
    if (dismissBtn) { acknowledgeDeclaration(dismissBtn.dataset.declId); return; }
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
  els.removeTenantPinButton.addEventListener("click", () => {
    const tenant = state.tenants.find((t) => t.id === editingTenantId);
    if (!tenant || !window.confirm(`Remove ${tenant.name}'s PIN? They will no longer be able to log in.`)) return;
    tenant.pinHash = "";
    saveState();
    els.removeTenantPinButton.classList.add("hidden");
    els.tenantPinDialogInput.placeholder = "Leave blank to disable tenant login";
    showToast("Tenant PIN removed");
  });
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

  els.openAddButton.addEventListener("click", () => openDialog(els.entryChooser));
  els.closeEntryChooser.addEventListener("click", () => closeDialog(els.entryChooser));
  els.entryChooser.addEventListener("click", (event) => {
    if (event.target === els.entryChooser) closeDialog(els.entryChooser);
  });
  els.entryChooserButtons.forEach((btn) =>
    btn.addEventListener("click", () => {
      closeDialog(els.entryChooser);
      openEntryForm(btn.dataset.category);
    }),
  );
  els.transactionBackButton.addEventListener("click", () => {
    closeDialog(els.transactionDialog);
    openDialog(els.entryChooser);
  });
  els.closeDialogButton.addEventListener("click", () => closeDialog(els.transactionDialog));
  els.cancelDialogButton.addEventListener("click", () => closeDialog(els.transactionDialog));
  els.transactionCategory.addEventListener("change", applyTransactionCategoryDefaults);
  els.transactionService.addEventListener("change", syncTransactionFormMode);
  els.transactionTenant.addEventListener("change", () => {
    if (els.transactionCategory.value === "Payments") applyTransactionCategoryDefaults();
    else if (els.transactionCategory.value === "Opening Balance") updateTransactionDirectionLabels();
  });
  els.transactionMonth.addEventListener("change", () => { if (els.transactionCategory.value === "Payments") applyTransactionCategoryDefaults(); });
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
      if ((transaction.category === "Expenses" || transaction.category === "Services Expenses") && invoiceFile) {
        showToast(existingTransaction ? "Uploading replacement invoice" : "Uploading invoice picture");
        try {
          transaction.invoiceAttachment = await uploadExpenseInvoice(transaction, invoiceFile);
        } catch (error) {
          invoiceUploadError = error;
        }
      }
      if (existingTransaction) state.transactions[editingIndex] = { ...existingTransaction, ...transaction };
      else {
        state.transactions.push(...transactions);
      }
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

  els.collectionModeInput.addEventListener("change", () => applyCollectionModeVisibility(els.collectionModeInput.value));
  els.removeOwnerPasswordButton.addEventListener("click", () => {
    if (!window.confirm("Remove the owner password? Anyone opening the app can then enter as owner.")) return;
    state.settings.ownerPasswordHash = "";
    saveState();
    renderSettings();
    showToast("Owner password removed");
  });
  els.saveSettingsButton.addEventListener("click", () => {
    state.building.name = els.buildingNameInput.value.trim() || state.building.name;
    state.settings.collectionMode = els.collectionModeInput.value === "fixed" ? "fixed" : "actual";
    state.settings.defaultDueUsd = Number(els.defaultDueInput.value || 0);
    state.settings.lbpPerUsd = Math.max(1, Number(els.conversionRateInput.value || DEFAULT_LBP_PER_USD));
    state.settings.invoiceUploadUrl = els.invoiceUploadUrlInput.value.trim();
    state.settings.cloudSpreadsheetId = els.cloudSpreadsheetIdInput.value.trim();
    state.settings.invoiceUploadFolderId = els.invoiceUploadFolderIdInput.value.trim();
    state.settings.syncSecret = els.syncSecretInput.value.trim();
    const newPassword = els.ownerPasswordInput.value.trim();
    if (newPassword) state.settings.ownerPasswordHash = hashSecret(newPassword, state.security.salt);
    state.settings.sharedExpensesEnabled = false;
    saveState();
    renderAll();
    updateExpenseConversionPreview();
    if (hasCloudConfig()) saveCloudState({ silent: true });
    showToast("Settings saved");
  });
  els.loadCloudButton.addEventListener("click", loadCloudState);
  els.shareSyncCodeButton.addEventListener("click", shareSyncCode);
  els.connectBuildingButton.addEventListener("click", () => {
    els.connectCodeInput.value = "";
    openDialog(els.connectDialog);
    setTimeout(() => els.connectCodeInput.focus(), 50);
  });
  els.closeConnectDialog.addEventListener("click", () => closeDialog(els.connectDialog));
  els.cancelConnectButton.addEventListener("click", () => closeDialog(els.connectDialog));
  els.connectSubmitButton.addEventListener("click", () => applySyncCode(els.connectCodeInput.value));
  els.downloadBackupButton.addEventListener("click", downloadBackup);
  els.restoreBackupButton.addEventListener("click", () => els.restoreBackupInput.click());
  els.restoreBackupInput.addEventListener("change", () => {
    const file = els.restoreBackupInput.files[0];
    els.restoreBackupInput.value = "";
    restoreFromBackupFile(file);
  });
  els.syncChip.addEventListener("click", () => {
    if (hasCloudConfig() && !cloudSaveInFlight) saveCloudState();
  });
  window.addEventListener("online", () => { if (hasCloudConfig()) saveCloudState({ silent: true }); });
  window.addEventListener("offline", () => setSyncChip("offline"));
  els.zeroAccountsButton.addEventListener("click", zeroAccounts);

  els.startFreshButton.addEventListener("click", () => {
    if (!window.confirm("Erase everything? This permanently deletes all tenants, payments, expenses and settings on this device and starts setup over. This cannot be undone.")) return;
    const nextEpoch = Number(state.meta?.epoch || 0) + 1;
    localStorage.removeItem(STORAGE_KEY);
    state = hydrateState({});
    state.meta.epoch = nextEpoch;
    state.setupComplete = false;
    saveState({ sync: false });
    selectedMonth = null;
    populateTenantSelect();
    renderAll();
    openSetupWizard();
    showToast("All data cleared. Starting fresh.");
  });

  els.dueBannerClose.addEventListener("click", () => els.dueBanner.classList.add("hidden"));
  els.newMonthBannerAdd.addEventListener("click", () => {
    newMonthBannerDismissed = true;
    els.newMonthBanner.classList.add("hidden");
    openDialog(els.monthDialog);
  });
  els.newMonthBannerDismiss.addEventListener("click", () => {
    newMonthBannerDismissed = true;
    els.newMonthBanner.classList.add("hidden");
  });
  els.createPollButton.addEventListener("click", openCreatePollDialog);
  els.pollForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const title = els.pollTitleInput.value.trim();
    if (!title) return;
    const poll = {
      id: `poll-${Date.now()}`,
      title,
      description: els.pollDescInput.value.trim(),
      createdBy: sessionMode === "owner" ? "owner" : sessionTenantId,
      createdAt: new Date().toISOString(),
      status: "open",
      votes: {},
    };
    (state.polls ||= []).push(poll);
    saveState();
    closeDialog(els.pollDialog);
    renderPolls();
    setView("pollsView");
    showToast("Poll created");
  });
  els.closePollDialog.addEventListener("click", () => closeDialog(els.pollDialog));
  els.cancelPollButton.addEventListener("click", () => closeDialog(els.pollDialog));
  els.pollList.addEventListener("click", (e) => {
    const voteBtn = e.target.closest(".vote-btn[data-poll-id]");
    if (voteBtn) { castVote(voteBtn.dataset.pollId, voteBtn.dataset.vote); return; }
    const closeBtn = e.target.closest(".poll-close-btn[data-poll-id]");
    if (closeBtn) { closePoll(closeBtn.dataset.pollId); return; }
    const delBtn = e.target.closest(".poll-delete-btn[data-poll-id]");
    if (delBtn) { deletePoll(delBtn.dataset.pollId); return; }
  });

  els.transactionDistribution.addEventListener("change", updateSharedExpenseInlinePreview);

  els.createProjectButton.addEventListener("click", openCreateProjectDialog);
  els.closeProjectDialog.addEventListener("click", () => closeDialog(els.projectDialog));
  els.cancelProjectButton.addEventListener("click", () => closeDialog(els.projectDialog));
  els.projectForm.addEventListener("submit", submitProject);
  els.projectBudgetInput.addEventListener("input", updateProjectSharePreview);
  els.projectDistributionInput.addEventListener("change", updateProjectSharePreview);
  els.buildingProjectList.addEventListener("click", (e) => {
    const remindBtn = e.target.closest(".remind-project-btn[data-project-id]");
    if (remindBtn) {
      const project = (state.buildingProjects || []).find((p) => p.id === remindBtn.dataset.projectId);
      if (project) openProjectWhatsAppReminderDialog(project);
      return;
    }
    const collectBtn = e.target.closest(".collect-project-btn[data-project-id]");
    if (collectBtn) {
      const project = (state.buildingProjects || []).find((p) => p.id === collectBtn.dataset.projectId);
      if (project) openCollectForProject(project);
      return;
    }
    const deleteBtn = e.target.closest(".delete-project-btn[data-project-id]");
    if (deleteBtn) { deleteProject(deleteBtn.dataset.projectId); return; }
  });

  els.addGeneratorBillButton.addEventListener("click", () => openGeneratorReadingsDialog());
  els.closeGeneratorBillDialog.addEventListener("click", () => closeDialog(els.generatorBillDialog));
  els.cancelGeneratorBillButton.addEventListener("click", () => closeDialog(els.generatorBillDialog));
  els.generatorBillForm.addEventListener("submit", submitGeneratorReadings);
  els.generatorBillMonth.addEventListener("change", refreshGeneratorReadingRowsForMonth);
  els.generatorReadingRows.addEventListener("input", updateGeneratorReadingsPreview);
  els.generatorBillList.addEventListener("click", (e) => {
    const readBtn = e.target.closest(".enter-readings-btn[data-month]");
    if (readBtn) { openGeneratorReadingsDialog(readBtn.dataset.month); return; }
    const delBtn = e.target.closest(".delete-readings-btn[data-month]");
    if (delBtn) { deleteServiceReadings("generator", delBtn.dataset.month); return; }
  });

  els.loginOwnerTab.addEventListener("click", () => {
    els.loginOwnerTab.classList.add("active");
    els.loginTenantTab.classList.remove("active");
    els.loginOwnerForm.classList.remove("hidden");
    els.loginTenantForm.classList.add("hidden");
    els.loginError.classList.add("hidden");
    els.loginPasswordInput.focus();
  });
  els.loginTenantTab.addEventListener("click", () => {
    els.loginTenantTab.classList.add("active");
    els.loginOwnerTab.classList.remove("active");
    els.loginTenantForm.classList.remove("hidden");
    els.loginOwnerForm.classList.add("hidden");
    els.loginError.classList.add("hidden");
    els.loginPinInput.focus();
  });
  els.loginSubmitBtn.addEventListener("click", attemptLogin);
  els.loginPasswordInput.addEventListener("keydown", (e) => { if (e.key === "Enter") attemptLogin(); });
  els.loginPinInput.addEventListener("keydown", (e) => { if (e.key === "Enter") attemptLogin(); });
  els.logoutButton.addEventListener("click", logout);
  els.runWizardButton.addEventListener("click", openSetupWizard);
  els.wizardCollectionMode.addEventListener("change", applyWizardCollectionModeVisibility);
  els.wizardStep1Next.addEventListener("click", () => wizardNextStep(1));
  els.wizardStep2Prev.addEventListener("click", () => wizardPrevStep(2));
  els.wizardStep2Next.addEventListener("click", () => wizardNextStep(2));
  els.wizardStep3Prev.addEventListener("click", () => wizardPrevStep(3));
  els.wizardAddTenantBtn.addEventListener("click", wizardAddTenant);
  els.wizardTenantList.addEventListener("click", (e) => {
    const editBtn = e.target.closest(".wizard-tenant-edit[data-edit-idx]");
    if (editBtn) { wizardEditTenant(parseInt(editBtn.dataset.editIdx, 10)); return; }
    const removeBtn = e.target.closest(".wizard-tenant-remove[data-idx]");
    if (!removeBtn) return;
    const removedIdx = parseInt(removeBtn.dataset.idx, 10);
    if (wizardEditingIdx === removedIdx) wizardClearTenantForm();
    else if (wizardEditingIdx !== null && wizardEditingIdx > removedIdx) wizardEditingIdx--;
    wizardTenants.splice(removedIdx, 1);
    renderWizardTenants();
  });
  els.wizardCancelEditBtn.addEventListener("click", () => { wizardClearTenantForm(); });
  els.wizardFinishBtn.addEventListener("click", finishSetupWizard);
  els.wizardTenantName.addEventListener("keydown", (e) => { if (e.key === "Enter") wizardAddTenant(); });
  els.setupWizardDialog.addEventListener("cancel", (e) => e.preventDefault());
}

async function syncFromSheet({ silent = false } = {}) {
  if (!hasCloudConfig()) return;
  if (document.querySelector("dialog[open]")) return;
  if (cloudSaveInFlight) return;
  if (!silent) renderCloudStatus("Syncing from Google Sheet...");
  try {
    const result = await postCloudAction("loadState");
    if (!result.success || !result.state) return;
    const remote = result.state;
    const sync = loadSyncMeta();
    const remoteToken = remote.meta?.token || "";
    const dirty = localHasUnsyncedChanges();

    if (remoteToken && remoteToken === sync.lastSyncedToken) {
      // Cloud unchanged since this device last synced.
      if (dirty) queueCloudSave();
      return;
    }
    if (dirty) {
      // Foreign changes AND unsynced local changes: merge, then push the result.
      state = hydrateState(mergeStates(state, remote));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      populateTenantSelect();
      renderAll();
      queueCloudSave();
    } else {
      // No local changes: safe to adopt the cloud state.
      state = hydrateState(remote);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      saveSyncMeta({ lastSyncedToken: remoteToken, lastPushedRev: Number(state.meta?.rev || 0) });
      populateTenantSelect();
      renderAll();
    }
    renderCloudStatus(`Last synced at ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`);
    setSyncChip("saved");
  } catch {
    if (!silent) renderCloudStatus("Could not reach Google Sheet — showing cached data.");
    setSyncChip(navigator.onLine === false ? "offline" : "error");
  }
}

async function boot() {
  const response = await fetch("data/seed.json", { cache: "no-store" });
  seedState = hydrateState(await response.json());
  const stored = localStorage.getItem(STORAGE_KEY);
  state = stored ? hydrateState(JSON.parse(stored)) : hydrateState(seedState);
  if (ensureAllReceiptReferences()) saveState({ sync: false });

  attachEvents();
  populateTenantSelect();
  renderAll();
  setSyncChip(hasCloudConfig() ? "saved" : "local");
  showLoginScreen();

  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});

  await syncFromSheet();

  setInterval(() => { if (sessionMode) syncFromSheet({ silent: true }); }, 60000);
}

boot().catch((error) => {
  document.body.innerHTML = `<main class="app-shell"><section class="panel"><h1>BUILDING ACCOUNT TRACKER ${APP_VERSION}</h1><p>${error.message}</p></section></main>`;
});
