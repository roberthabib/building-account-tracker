const STORAGE_KEY = "building-account-tracker:v1";
const APP_VERSION = "v161";

// Built-in cloud configuration (src/cloud-config.js). Deployed but not
// committed, so the live app is preconfigured while the public repo stays free
// of keys. Absent in a fresh clone — the app then falls back to Settings.
let EMBEDDED_CLOUD = { supabaseUrl: "", supabaseAnonKey: "" };
// The node test harness (tests/) sets this so a test run can never pick up the
// real credentials and talk to the live database.
if (!globalThis.__BAT_TEST__) {
  try {
    const mod = await import("./cloud-config.js");
    if (mod?.CLOUD_CONFIG) EMBEDDED_CLOUD = { ...EMBEDDED_CLOUD, ...mod.CLOUD_CONFIG };
  } catch (_) {
    // No built-in config bundled; Settings values (if any) are used instead.
  }
}

const els = {
  views: document.querySelectorAll(".view"),
  navButtons: document.querySelectorAll(".nav-button"),
  buildingNameHeading: document.querySelector("#buildingNameHeading"),
  appVersionLabel: document.querySelector("#appVersionLabel"),
  moreNavButton: document.querySelector("#moreNavButton"),
  moreMenu: document.querySelector("#moreMenu"),
  appVersionLabelMore: document.querySelector("#appVersionLabelMore"),
  monthChips: document.querySelector("#monthChips"),
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
  toggleDateFilter: document.querySelector("#toggleDateFilter"),
  dateRangeInputs: document.querySelector("#dateRangeInputs"),
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
  transactionAmount: document.querySelector("#transactionAmount"),
  transactionCurrency: document.querySelector("#transactionCurrency"),
  currencyToggle: document.querySelector("#currencyToggle"),
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
  supabaseUrlInput: document.querySelector("#supabaseUrlInput"),
  supabaseAnonKeyInput: document.querySelector("#supabaseAnonKeyInput"),
  googleLegacySection: document.querySelector("#googleLegacySection"),
  cloudSpreadsheetIdInput: document.querySelector("#cloudSpreadsheetIdInput"),
  invoiceUploadFolderIdInput: document.querySelector("#invoiceUploadFolderIdInput"),
  saveSettingsButton: document.querySelector("#saveSettingsButton"),
  loadCloudButton: document.querySelector("#loadCloudButton"),
  downloadBackupButton: document.querySelector("#downloadBackupButton"),
  downloadBackupPhotosButton: document.querySelector("#downloadBackupPhotosButton"),
  fullExportButton: document.querySelector("#fullExportButton"),
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
  loginEmailInput: document.querySelector("#loginEmailInput"),
  loginTenantLinked: document.querySelector("#loginTenantLinked"),
  tenantCoefficientHint: document.querySelector("#tenantCoefficientHint"),
  whatsappGroupButton: document.querySelector("#whatsappGroupButton"),
  whatsappGroupTextButton: document.querySelector("#whatsappGroupTextButton"),
  inviteWhatsAppButton: document.querySelector("#inviteWhatsAppButton"),
  recurringExpenseRow: document.querySelector("#recurringExpenseRow"),
  recurringExpenseInput: document.querySelector("#recurringExpenseInput"),
  recurringSettingsButton: document.querySelector("#recurringSettingsButton"),
  recurringDialog: document.querySelector("#recurringDialog"),
  recurringDialogTitle: document.querySelector("#recurringDialogTitle"),
  recurringDialogNote: document.querySelector("#recurringDialogNote"),
  recurringList: document.querySelector("#recurringList"),
  recurringAddButton: document.querySelector("#recurringAddButton"),
  closeRecurringDialog: document.querySelector("#closeRecurringDialog"),
  declareDialog: document.querySelector("#declareDialog"),
  declareMonthNote: document.querySelector("#declareMonthNote"),
  declareAmountInput: document.querySelector("#declareAmountInput"),
  declareProofInput: document.querySelector("#declareProofInput"),
  declareSubmitButton: document.querySelector("#declareSubmitButton"),
  declareCancelButton: document.querySelector("#declareCancelButton"),
  closeDeclareDialog: document.querySelector("#closeDeclareDialog"),
  loginUnlinkBtn: document.querySelector("#loginUnlinkBtn"),
  inviteDialog: document.querySelector("#inviteDialog"),
  closeInviteDialog: document.querySelector("#closeInviteDialog"),
  inviteTenantSelect: document.querySelector("#inviteTenantSelect"),
  inviteResult: document.querySelector("#inviteResult"),
  inviteCodeText: document.querySelector("#inviteCodeText"),
  inviteHowTo: document.querySelector("#inviteHowTo"),
  inviteCreateButton: document.querySelector("#inviteCreateButton"),
  inviteShareButton: document.querySelector("#inviteShareButton"),
  backupsDialog: document.querySelector("#backupsDialog"),
  closeBackupsDialog: document.querySelector("#closeBackupsDialog"),
  backupsList: document.querySelector("#backupsList"),
  cloudBackupsButton: document.querySelector("#cloudBackupsButton"),
  googleSignInBtn: document.querySelector("#googleSignInBtn"),
  loginEmailModeBtn: document.querySelector("#loginEmailModeBtn"),
  loginOwnerAccount: document.querySelector("#loginOwnerAccount"),
  loginSwitchAccountBtn: document.querySelector("#loginSwitchAccountBtn"),
  loginDeviceFallbackBtn: document.querySelector("#loginDeviceFallbackBtn"),
  loginBackToAccountBtn: document.querySelector("#loginBackToAccountBtn"),
  ownerAccountAction: document.querySelector("#ownerAccountAction"),
  ownerAccountText: document.querySelector("#ownerAccountText"),
  ownerSignOutButton: document.querySelector("#ownerSignOutButton"),
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
  newMonthBannerTitle: document.querySelector("#newMonthBannerTitle"),
  newMonthBannerIcon: document.querySelector("#newMonthBannerIcon"),
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
  languageInput: document.querySelector("#languageInput"),
  wizardLanguage: document.querySelector("#wizardLanguage"),
  monthlyBudgetField: document.querySelector("#monthlyBudgetField"),
  removeOwnerPasswordButton: document.querySelector("#removeOwnerPasswordButton"),
  removeTenantPinButton: document.querySelector("#removeTenantPinButton"),
  wizardCollectionMode: document.querySelector("#wizardCollectionMode"),
  wizardCollectionModeNote: document.querySelector("#wizardCollectionModeNote"),
  wizardBudgetField: document.querySelector("#wizardBudgetField"),
  tenantBreakerInput: document.querySelector("#tenantBreakerInput"),
  addGeneratorBillButton: document.querySelector("#addGeneratorBillButton"),
  servicesIntro: document.querySelector("#servicesIntro"),
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
  deleteGeneratorReadingsButton: document.querySelector("#deleteGeneratorReadingsButton"),
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

// ---------------------------------------------------------------------------
// Internationalization (English / Arabic) with right-to-left support.
// Stored strings (category values, service types, etc.) are NEVER translated —
// only their display. Static HTML is annotated with data-i18n* attributes and
// refreshed by applyStaticI18n(); dynamic strings use t(key, params).
// ---------------------------------------------------------------------------
const LANG_KEY = "building-account-tracker:lang";
const SUPPORTED_LANGS = ["en", "ar"];
let currentLang = "en";

const I18N = {
  en: {
    // Common / shared
    "common.cancel": "Cancel",
    "common.save": "Save",
    "common.add": "Add",
    "common.close": "Close",
    "common.share": "Share",
    "common.download": "Download",
    "common.export": "Export",
    "tenantNotices.title": "From the building",
    "nav.notices": "Notices",
    "nav.help": "Help & videos",
    "more.helpSub": "Short videos that show how it works",
    "help.intro": "Short videos of the app in use, with a made-up building. Tap one to watch; each is about a minute.",
    "help.close": "Close",
    "nav.suppliers": "Suppliers",
    "more.suppliersSub": "Contacts and what you paid them",
    "nav.documents": "Documents",
    "more.documentsSub": "Contracts, insurance, permits",
    "nav.meetings": "Meetings",
    "more.meetingsSub": "Minutes and decisions",
    "ten.inviteAll": "Invite all",
    "pay.whoPaid": "Who paid?",
    "tx.paidBy": "Paid by",
    "tx.readInvoice": "Fill in from the photo",
    "tx.paidFrom": "Paid from",
    "opt.cash": "Cash",
    "opt.bank": "Bank transfer",
    "opt.cheque": "Cheque",
    "opt.cashBox": "Cash box",
    "opt.bankWallets": "Bank & wallets",
    "nav.maintenance": "Maintenance",
    "more.maintenanceSub": "Inspections, cleanings, renewals",
    "maint.new": "+ Add",
    "more.noticesSub": "News for the residents",
    "nav.issues": "Problems",
    "more.issuesSub": "Report and follow repairs",
    "nav.reports": "Reports",
    "more.reportsSub": "Annual report, cash count, history",
    "push.title": "Phone notifications",
    "push.turnOn": "Turn on",
    "notices.new": "+ New",
    "issues.new": "+ Report",
    "set.adminsTitle": "Administrators",
    "set.adminsDesc": "Give a family member or the building committee their own sign-in — full access or view only.",
    "tx.litres": "Litres of diesel (optional)",
    "gen.engineHours": "Generator hour meter (optional)",
    "poll.weighting": "How votes count",
    "poll.byUnit": "One vote per unit",
    "poll.byShare": "By ownership share (coefficient)",
    "poll.closes": "Voting closes on (optional)",
    "poll.quorum": "Minimum turnout % (optional)",
    "wa.groupButton": "Share balances picture with the building group",
    "wa.groupText": "Send as text instead",
    "invite.whatsapp": "Send on WhatsApp",
    "tx.repeatMonthly": "Repeat every month (salary, cleaning, internet…)",
    "set.recurringTitle": "Monthly recurring expenses",
    "set.recurringDesc": "Expenses that repeat every month. Each month they wait for you as drafts to confirm.",
    "common.manage": "Manage",
    "recurring.title": "Monthly expenses",
    "recurring.note": "Check the amounts, then add them. Untick anything that didn't happen this month.",
    "recurring.add": "Add ticked expenses",
    "declare.title": "Tell the owner you've paid",
    "declare.amount": "Amount paid (USD)",
    "declare.proof": "Proof of payment (optional)",
    "declare.proofNote": "A photo of the bank transfer, OMT or Whish receipt helps the owner confirm it quickly.",
    "declare.submit": "Notify the owner",
    "set.fullExportTitle": "Export everything to Excel",
    "set.fullExportDesc": "One workbook with every tenant, transaction, month, reading, project and poll — formatted and ready to print or share.",
    "common.restore": "Restore",
    "common.reload": "Reload",
    "common.clear": "Clear",
    "common.erase": "Erase",
    "common.open": "Open",
    "common.next": "Next →",
    "common.back": "← Back",
    "common.dismiss": "Dismiss",
    // Login
    "login.owner": "Owner",
    "login.tenant": "Tenant",
    "login.appName": "Building Account",
    "login.passwordPh": "Password",
    "login.pinPh": "PIN",
    "login.error": "Incorrect password or PIN",
    "login.enter": "Enter",
    "login.connect": "I'm a tenant with an invite code",
    "login.emailPh": "Email",
    "login.switchAccount": "Use a different account",
    "login.deviceFallback": "Can't sign in? Use this device's password",
    "login.backToAccount": "Back to Google sign-in",
    "login.google": "Continue with Google",
    "login.emailMode": "Use email and password instead",
    // Connect dialog
    "connect.title": "Link your phone",
    "connect.note": "Enter the invite code the building owner sent you. It links this phone to your own account: you'll see your balance, payments and the building expenses — never other tenants.",
    "connect.placeholder": "Invite code, e.g. 7KQ2M9XB",
    "connect.submit": "Link this phone",
    "login.unlink": "Unlink this phone",
    "common.invite": "Invite",
    "common.choose": "Choose…",
    "set.cloudBackupsTitle": "Restore a daily cloud backup",
    "set.cloudBackupsDesc": "The cloud keeps a copy of your data every night for 60 days. Pick a day to go back to.",
    "invite.title": "Invite a tenant",
    "invite.note": "Each code links one phone to one tenant, once, within 30 days. That phone then shows only that tenant's figures and the building expenses.",
    "invite.tenant": "Tenant",
    "invite.create": "Create invite code",
    "backups.title": "Daily cloud backups",
    "backups.note": "Restoring replaces the data on every device with that day's copy. A safety copy of today's data is downloaded first.",
    // Topbar / sync
    "topbar.eyebrow": "Building Account",
    "topbar.appName": "Building Account Tracker",
    "sync.local": "Local",
    "sync.saved": "Saved",
    "sync.saving": "Saving",
    "sync.error": "Error",
    "sync.offline": "Offline",
    "aria.syncStatus": "Sync status",
    "aria.logout": "Logout",
    "aria.add": "Add transaction",
    "aria.prevMonth": "Previous month",
    "aria.nextMonth": "Next month",
    "aria.month": "Month",
    "aria.selectMonth": "Select month",
    "aria.back": "Back",
    // Nav
    "nav.dashboard": "Dashboard",
    "nav.payments": "Payments",
    "nav.tenants": "Tenants",
    "nav.ledger": "Ledger",
    "nav.more": "More",
    "nav.projects": "Projects",
    "nav.services": "Services",
    "nav.polls": "Polls",
    "nav.settings": "Settings",
    // Dashboard
    "dash.eyebrow": "Overview",
    "dash.title": "Account Position",
    "attention.title": "Needs Attention",
    "tenantDues.title": "My Outstanding Dues",
    "financial.title": "Building Financial Position",
    "newMonth.add": "Add Month",
    "declarations.title": "Payment Notifications",
    "tenantBalances.title": "Tenant Balances",
    "monthlyServices.title": "Monthly Services Expenses",
    "monthlyActivity.title": "Monthly Activity",
    "expensesByCategory.title": "Expenses by Category",
    // Payments view
    "pay.eyebrow": "Collections",
    "pay.title": "Monthly Payments",
    "pay.dueOnly": "Due Only",
    "pay.messageDue": "Message Due",
    "pay.addMonth": "Add Month",
    "pay.monthlyPayments": "Monthly Payments",
    "pay.monthlyServices": "Monthly Services Expenses",
    "pay.statusTitle": "Monthly Payment Status",
    "pay.servicesStatusTitle": "Monthly Services Expenses Status",
    "pay.monthHistory": "Month History",
    // Tenants view
    "ten.eyebrow": "Residents",
    "ten.title": "Tenant Accounts",
    "ten.searchPh": "Search tenants",
    "ten.add": "+ Add",
    // Ledger view
    "led.eyebrow": "Transactions",
    "led.title": "Ledger",
    "led.exportExcel": "Export Excel",
    "led.exportPdf": "Export PDF",
    "led.searchPh": "Search ledger",
    "led.clearFilters": "Clear filters",
    "led.dates": "📅 Dates",
    "aria.categoryFilter": "Category filter",
    "aria.expenseCategoryFilter": "Expense category filter",
    "aria.fromDate": "From date",
    "aria.toDate": "To date",
    // Projects view
    "proj.eyebrow": "Building",
    "proj.title": "Projects",
    "proj.new": "+ New",
    // Services view
    "serv.eyebrow": "Building",
    "serv.title": "Services",
    "serv.enterReadings": "Enter Meter Readings",
    "serv.intro": "Log generator (diesel/maintenance) and water tanker costs with the + button (Services Expenses). Generator: enter monthly meter readings here to split fuel by kWh and maintenance by breaker size. Water: split equally or by coefficient, billed straight away.",
    // Polls view
    "poll.eyebrow": "Building",
    "poll.title": "Polls",
    "poll.new": "+ New Poll",
    // Settings
    "set.eyebrow": "Setup",
    "set.title": "Settings",
    "set.accessControl": "Access Control",
    "set.ownerPassword": "Owner password",
    "set.ownerPasswordPh": "Leave blank for no password",
    "set.ownerPasswordSetPh": "Password set — type to change",
    "set.removePassword": "Remove current password",
    "set.passwordNote": "Tenants use a PIN set per-tenant (in the Tenants tab). Passwords and PINs are stored as salted hashes. Leave the field blank to keep the current password.",
    "set.buildingDetails": "Building Details",
    "set.buildingName": "Building name",
    "set.language": "Language",
    "set.collectionMode": "Collection mode",
    "set.collectionActual": "Split actual monthly expenses",
    "set.collectionFixed": "Fixed monthly amount + reserve fund",
    "set.monthlyBudget": "Total monthly building budget USD",
    "set.currency": "Currency & Conversion",
    "set.lbpRate": "LBP per USD conversion rate",
    "set.lbpRateNote": "A new rate applies to new entries. Past entries keep the rate they were recorded at.",
    "set.cloudDb": "Cloud database",
    "set.ownerAccount": "Owner account",
    "set.signOut": "Sign out",
    "set.cloudDbBuiltIn": "Connected to the building's cloud database. Data and invoice photos sync automatically — nothing to set up on this device.",
    "set.supabaseUrl": "Supabase project URL",
    "set.supabaseKey": "Supabase anon public key",
    "set.supabaseNote": "Create a free project at supabase.com, run the setup SQL, then paste the Project URL and the anon public key here. Never paste the service_role key.",
    "set.google": "Google Integration (legacy)",
    "set.appsScriptUrl": "Google Apps Script URL (Sheet sync)",
    "set.sheetId": "Google Sheet ID",
    "set.driveFolderId": "Google Drive invoice folder ID",
    "set.syncSecret": "Sync secret (optional)",
    "set.syncSecretPh": "Match the SYNC_SECRET set in Apps Script",
    "set.shareAccessTitle": "Invite a tenant",
    "set.shareAccessDesc": "Create a one-time code that links a tenant's phone to their own account. They only ever see their own figures.",
    "set.backup": "Backup & Restore",
    "set.downloadBackupTitle": "Download backup",
    "set.backupPhotosTitle": "Download backup with photos",
    "set.backupPhotosDesc": "One ZIP file with all your data and every picture: invoices, payment proofs and problem photos.",
    "set.downloadBackupDesc": "Save all your data to a file on this device. Keep it somewhere safe.",
    "set.restoreTitle": "Restore from a backup file",
    "set.restoreDesc": "Load data from a backup file you saved before. Replaces the data on this device — a safety copy is downloaded first.",
    "set.reloadSheetTitle": "Reload from Google Sheet",
    "set.reloadSheetDesc": "Pull the latest copy from the cloud and replace this device's data. Use when setting up a new phone.",
    "set.reset": "Reset",
    "set.clearTxTitle": "Clear transactions",
    "set.clearTxDesc": "Delete all payments and expenses but keep your tenants and settings — for example to start a new year.",
    "set.eraseTitle": "Erase everything",
    "set.eraseDesc": "Delete all tenants, payments, expenses and settings, then start setup from scratch. This cannot be undone.",
    "set.appSetup": "App Setup",
    "set.wizardTitle": "Setup wizard",
    "set.wizardDesc": "Re-run the guided setup for building details and tenants.",
    "set.cloudNote": "Cloud sync is automatic after the script URL and Google Sheet ID are saved.",
    // More menu
    "more.title": "More",
    "more.eyebrow": "Menu",
    "more.projectsSub": "Building works & collection",
    "more.servicesSub": "Generator & water bills",
    "more.pollsSub": "Building votes",
    "more.settingsSub": "Building, currency, sync & access",
    // Entry chooser
    "entry.title": "Add Entry",
    "entry.paymentTitle": "Record a payment",
    "entry.paymentDesc": "A tenant paid their dues",
    "entry.expenseTitle": "Record an expense",
    "entry.expenseDesc": "A shared building cost",
    "entry.servicesTitle": "Generator / Water cost",
    "entry.servicesDesc": "Diesel, maintenance or a water tanker",
    "entry.openingTitle": "Opening balance",
    "entry.openingDesc": "Starting cash or a tenant carry-in",
    // Transaction dialog
    "tx.addTitle": "Add Transaction",
    "tx.type": "Type",
    "tx.service": "Service",
    "tx.costType": "Cost type",
    "tx.split": "Split",
    "tx.direction": "Direction",
    "tx.tenant": "Tenant",
    "tx.description": "Description",
    "tx.date": "Date",
    "tx.forMonth": "For month",
    "tx.amount": "Amount",
    "tx.currency": "Currency",
    "tx.supplier": "Supplier",
    "tx.supplierPh": "Type supplier",
    "tx.invoiceNumber": "Invoice Number",
    "tx.expenseCategory": "Expense Category",
    "tx.expenseCategoryPh": "Type category",
    "tx.splitDistribution": "Split Distribution",
    "tx.project": "Project",
    "tx.projectPh": "Type project",
    "tx.invoicePicture": "Invoice picture",
    "tx.useCamera": "Use Camera",
    "tx.uploadPhoto": "Upload Photo",
    "tx.noPhoto": "No photo selected",
    "aria.showSuppliers": "Show saved suppliers",
    "aria.showCategories": "Show saved categories",
    "aria.showProjects": "Show saved projects",
    // Option labels
    "opt.payments": "Payments",
    "opt.expenses": "Expenses",
    "opt.servicesExpenses": "Services Expenses",
    "opt.openingBalance": "Opening Balance",
    "opt.generator": "Generator",
    "opt.water": "Water",
    "opt.fuel": "Fuel / Diesel (consumption)",
    "opt.maintenance": "Maintenance",
    "opt.equalSplit": "Equal split",
    "opt.byCoefficient": "By coefficient",
    "opt.received": "Received",
    "opt.appliedPaidOut": "Applied or paid out",
    "opt.usd": "USD ($)",
    "opt.lbp": "LBP (LL)",
    "opt.equalSplitProper": "Equal Split",
    "opt.byCoefficientProp": "By Coefficient (proportional)",
    // Tenant dialog
    "tenant.addTitle": "Add Tenant",
    "tenant.name": "Name",
    "tenant.namePh": "e.g. John Smith",
    "tenant.unit": "Unit number",
    "tenant.unitPh": "e.g. 01",
    "tenant.whatsapp": "WhatsApp number",
    "tenant.coefficient": "Coefficient (X / 1000)",
    "tenant.coefficientPh": "e.g. 125",
    "tenant.breaker": "Generator breaker size (Amps)",
    "tenant.breakerPh": "e.g. 20",
    "tenant.pin": "Tenant PIN (for app access)",
    "tenant.pinPh": "Leave blank to disable tenant login",
    "tenant.removePin": "Remove current PIN",
    // WhatsApp dialog
    "wa.title": "Send Payment Reminders",
    // Month dialog
    "month.title": "Add Month",
    "month.month": "Month",
    "month.budget": "Total Monthly Expected Building Budget USD",
    // Poll dialog
    "poll.newTitle": "New Poll",
    "poll.question": "Question",
    "poll.questionPh": "Should we...?",
    "poll.desc": "Description (optional)",
    "poll.descPh": "Add more details about this project...",
    "poll.create": "Create Poll",
    // Setup wizard
    "wiz.welcomeTitle": "Welcome to Building Account Tracker",
    "wiz.welcomeSub": "Let's quickly set up your building. You can update these details any time in Settings.",
    "wiz.buildingName": "Building Name",
    "wiz.buildingNamePh": "e.g. Naccache 1727",
    "wiz.ownerPassword": "Owner Password",
    "wiz.optional": "(optional)",
    "wiz.language": "Language",
    "wiz.financialTitle": "Financial Settings",
    "wiz.financialSub": "Choose how the building collects money and set the LBP/USD exchange rate.",
    "wiz.collectionMode": "Collection Mode",
    "wiz.collectionActual": "Split actual monthly expenses among tenants",
    "wiz.monthlyBudget": "Total Monthly Expected Building Budget (USD)",
    "wiz.lbpRate": "LBP per USD Rate",
    "wiz.tenantsTitle": "Add Tenants",
    "wiz.tenantsSub": "Add your building's tenants. You can add or edit more at any time in the Tenants tab.",
    "wiz.name": "Name",
    "wiz.namePh": "Full name",
    "wiz.unit": "Unit",
    "wiz.unitPh": "e.g. 3B",
    "wiz.whatsapp": "WhatsApp Number",
    "wiz.pin": "PIN (app access)",
    "wiz.pinPh": "4 digits",
    "wiz.coefficient": "Coefficient (X / 1000)",
    "wiz.addTenant": "+ Add Tenant",
    "wiz.cancelEdit": "Cancel Edit",
    "wiz.finish": "✓ Finish Setup",
    // Project dialog
    "projd.newTitle": "New Project",
    "projd.name": "Project Name",
    "projd.namePh": "e.g. Generator Replacement",
    "projd.desc": "Description",
    "projd.descPh": "Brief description",
    "projd.budget": "Total Budget (USD)",
    "projd.dueDate": "Payment Due Date",
    "projd.create": "Create Project",
    // Generator readings dialog
    "gen.title": "Generator Meter Readings",
    "gen.month": "Month",
    "gen.note": "Costs come from the Services Expenses you logged for this month. Fuel is split by each tenant's metered kWh (current − previous); maintenance is split pro-rata by breaker size.",
    "gen.readings": "Meter readings (kWh)",
    "gen.removeReadings": "Remove meter readings",
    "gen.save": "Save Readings",
  },
  ar: {
    // Common / shared
    "common.cancel": "إلغاء",
    "common.save": "حفظ",
    "common.add": "إضافة",
    "common.close": "إغلاق",
    "common.share": "مشاركة",
    "common.download": "تنزيل",
    "common.export": "تصدير",
    "tenantNotices.title": "من إدارة المبنى",
    "nav.notices": "الإعلانات",
    "nav.help": "المساعدة والفيديوهات",
    "more.helpSub": "فيديوهات قصيرة تشرح طريقة الاستخدام",
    "help.intro": "فيديوهات قصيرة للتطبيق أثناء الاستخدام، على مبنى وهمي. اضغط على أي منها للمشاهدة؛ مدة كل منها دقيقة تقريباً.",
    "help.close": "إغلاق",
    "nav.suppliers": "المورّدون",
    "more.suppliersSub": "جهات الاتصال وما دُفع لهم",
    "nav.documents": "المستندات",
    "more.documentsSub": "العقود والتأمين والتراخيص",
    "nav.meetings": "الاجتماعات",
    "more.meetingsSub": "المحاضر والقرارات",
    "ten.inviteAll": "دعوة الجميع",
    "pay.whoPaid": "من دفع؟",
    "tx.paidBy": "طريقة الدفع",
    "tx.readInvoice": "تعبئة البيانات من الصورة",
    "tx.paidFrom": "دُفع من",
    "opt.cash": "نقداً",
    "opt.bank": "تحويل مصرفي",
    "opt.cheque": "شيك",
    "opt.cashBox": "الصندوق",
    "opt.bankWallets": "المصرف والمحافظ",
    "nav.maintenance": "الصيانة",
    "more.maintenanceSub": "الفحوصات والتنظيف والتجديدات",
    "maint.new": "+ إضافة",
    "more.noticesSub": "أخبار للسكان",
    "nav.issues": "المشاكل",
    "more.issuesSub": "الإبلاغ عن الأعطال ومتابعتها",
    "nav.reports": "التقارير",
    "more.reportsSub": "التقرير السنوي، جرد الصندوق، السجل",
    "push.title": "إشعارات الهاتف",
    "push.turnOn": "تفعيل",
    "notices.new": "+ جديد",
    "issues.new": "+ إبلاغ",
    "set.adminsTitle": "المسؤولون",
    "set.adminsDesc": "امنح أحد أفراد العائلة أو لجنة المبنى دخولاً خاصاً — صلاحية كاملة أو اطلاع فقط.",
    "tx.litres": "ليترات المازوت (اختياري)",
    "gen.engineHours": "عدّاد ساعات المولد (اختياري)",
    "poll.weighting": "كيف تُحتسب الأصوات",
    "poll.byUnit": "صوت واحد لكل وحدة",
    "poll.byShare": "حسب حصة الملكية (المعامل)",
    "poll.closes": "يُغلق التصويت في (اختياري)",
    "poll.quorum": "الحد الأدنى للمشاركة % (اختياري)",
    "wa.groupButton": "مشاركة صورة الأرصدة مع مجموعة المبنى",
    "wa.groupText": "الإرسال كنص بدلاً من ذلك",
    "invite.whatsapp": "إرسال عبر واتساب",
    "tx.repeatMonthly": "تكرار كل شهر (راتب، تنظيف، إنترنت…)",
    "set.recurringTitle": "المصاريف الشهرية المتكررة",
    "set.recurringDesc": "مصاريف تتكرر كل شهر. في كل شهر تنتظرك كمسودات لتأكيدها.",
    "common.manage": "إدارة",
    "recurring.title": "المصاريف الشهرية",
    "recurring.note": "تحقق من المبالغ ثم أضفها. أزل العلامة عن أي مصروف لم يحدث هذا الشهر.",
    "recurring.add": "إضافة المصاريف المحددة",
    "declare.title": "أبلغ المالك أنك دفعت",
    "declare.amount": "المبلغ المدفوع ($)",
    "declare.proof": "إثبات الدفع (اختياري)",
    "declare.proofNote": "صورة التحويل المصرفي أو إيصال OMT أو Whish تساعد المالك على التأكيد بسرعة.",
    "declare.submit": "إبلاغ المالك",
    "set.fullExportTitle": "تصدير كل البيانات إلى Excel",
    "set.fullExportDesc": "ملف واحد يضم كل المستأجرين والقيود والأشهر والقراءات والمشاريع والاستطلاعات — منسّق وجاهز للطباعة أو المشاركة.",
    "common.restore": "استعادة",
    "common.reload": "إعادة تحميل",
    "common.clear": "مسح",
    "common.erase": "محو",
    "common.open": "فتح",
    "common.next": "التالي ←",
    "common.back": "رجوع →",
    "common.dismiss": "إخفاء",
    // Login
    "login.owner": "المالك",
    "login.tenant": "المستأجر",
    "login.appName": "حساب المبنى",
    "login.passwordPh": "كلمة السر",
    "login.pinPh": "الرمز",
    "login.error": "كلمة السر أو الرمز غير صحيح",
    "login.enter": "دخول",
    "login.connect": "أنا مستأجر ولديّ رمز دعوة",
    "login.emailPh": "البريد الإلكتروني",
    "login.switchAccount": "استخدام حساب آخر",
    "login.deviceFallback": "تعذّر تسجيل الدخول؟ استخدم كلمة سر هذا الجهاز",
    "login.backToAccount": "العودة إلى تسجيل الدخول عبر Google",
    "login.google": "المتابعة باستخدام Google",
    "login.emailMode": "استخدام البريد الإلكتروني وكلمة السر بدلاً من ذلك",
    // Connect dialog
    "connect.title": "ربط هاتفك",
    "connect.note": "أدخل رمز الدعوة الذي أرسله لك مالك المبنى. يربط هذا الهاتف بحسابك فقط: سترى رصيدك ودفعاتك ومصاريف المبنى — ولن ترى المستأجرين الآخرين أبداً.",
    "connect.placeholder": "رمز الدعوة، مثل 7KQ2M9XB",
    "connect.submit": "ربط هذا الهاتف",
    "login.unlink": "إلغاء ربط هذا الهاتف",
    "common.invite": "دعوة",
    "common.choose": "اختر…",
    "set.cloudBackupsTitle": "استعادة نسخة احتياطية يومية من السحابة",
    "set.cloudBackupsDesc": "تحتفظ السحابة بنسخة من بياناتك كل ليلة لمدة 60 يوماً. اختر يوماً للعودة إليه.",
    "invite.title": "دعوة مستأجر",
    "invite.note": "كل رمز يربط هاتفاً واحداً بمستأجر واحد، مرة واحدة، خلال 30 يوماً. بعدها يعرض ذلك الهاتف أرقام ذلك المستأجر ومصاريف المبنى فقط.",
    "invite.tenant": "المستأجر",
    "invite.create": "إنشاء رمز دعوة",
    "backups.title": "النسخ الاحتياطية اليومية",
    "backups.note": "الاستعادة تستبدل البيانات على كل الأجهزة بنسخة ذلك اليوم. تُنزَّل أولاً نسخة أمان من بيانات اليوم.",
    // Topbar / sync
    "topbar.eyebrow": "حساب المبنى",
    "topbar.appName": "متتبّع حساب المبنى",
    "sync.local": "محلي",
    "sync.saved": "محفوظ",
    "sync.saving": "جارٍ الحفظ",
    "sync.error": "خطأ",
    "sync.offline": "غير متصل",
    "aria.syncStatus": "حالة المزامنة",
    "aria.logout": "خروج",
    "aria.add": "إضافة عملية",
    "aria.prevMonth": "الشهر السابق",
    "aria.nextMonth": "الشهر التالي",
    "aria.month": "الشهر",
    "aria.selectMonth": "اختر شهراً",
    "aria.back": "رجوع",
    // Nav
    "nav.dashboard": "الرئيسية",
    "nav.payments": "الدفعات",
    "nav.tenants": "المستأجرون",
    "nav.ledger": "السجل",
    "nav.more": "المزيد",
    "nav.projects": "المشاريع",
    "nav.services": "الخدمات",
    "nav.polls": "التصويت",
    "nav.settings": "الإعدادات",
    // Dashboard
    "dash.eyebrow": "نظرة عامة",
    "dash.title": "وضع الحساب",
    "attention.title": "يحتاج انتباهاً",
    "tenantDues.title": "مستحقاتي المتبقية",
    "financial.title": "الوضع المالي للمبنى",
    "newMonth.add": "إضافة شهر",
    "declarations.title": "إشعارات الدفع",
    "tenantBalances.title": "أرصدة المستأجرين",
    "monthlyServices.title": "مصاريف الخدمات الشهرية",
    "monthlyActivity.title": "الحركة الشهرية",
    "expensesByCategory.title": "المصاريف حسب الفئة",
    // Payments view
    "pay.eyebrow": "التحصيل",
    "pay.title": "الدفعات الشهرية",
    "pay.dueOnly": "المتأخرون فقط",
    "pay.messageDue": "تذكير المتأخرين",
    "pay.addMonth": "إضافة شهر",
    "pay.monthlyPayments": "الدفعات الشهرية",
    "pay.monthlyServices": "مصاريف الخدمات الشهرية",
    "pay.statusTitle": "حالة الدفع الشهري",
    "pay.servicesStatusTitle": "حالة مصاريف الخدمات الشهرية",
    "pay.monthHistory": "سجل الأشهر",
    // Tenants view
    "ten.eyebrow": "السكان",
    "ten.title": "حسابات المستأجرين",
    "ten.searchPh": "بحث عن مستأجر",
    "ten.add": "+ إضافة",
    // Ledger view
    "led.eyebrow": "العمليات",
    "led.title": "السجل",
    "led.exportExcel": "تصدير Excel",
    "led.exportPdf": "تصدير PDF",
    "led.searchPh": "ابحث في السجل",
    "led.clearFilters": "مسح الفلاتر",
    "led.dates": "📅 التواريخ",
    "aria.categoryFilter": "فلتر الفئة",
    "aria.expenseCategoryFilter": "فلتر فئة المصروف",
    "aria.fromDate": "من تاريخ",
    "aria.toDate": "إلى تاريخ",
    // Projects view
    "proj.eyebrow": "المبنى",
    "proj.title": "المشاريع",
    "proj.new": "+ جديد",
    // Services view
    "serv.eyebrow": "المبنى",
    "serv.title": "الخدمات",
    "serv.enterReadings": "إدخال قراءات العداد",
    "serv.intro": "سجّل كلفة المولّد (مازوت/صيانة) وصهاريج المياه بزر + (مصاريف الخدمات). المولّد: أدخل قراءات العداد الشهرية هنا لتقسيم الوقود حسب كيلوواط والصيانة حسب حجم القاطع. المياه: تُقسّم بالتساوي أو حسب المعامل، وتُحتسب فوراً.",
    // Polls view
    "poll.eyebrow": "المبنى",
    "poll.title": "التصويت",
    "poll.new": "+ تصويت جديد",
    // Settings
    "set.eyebrow": "الإعداد",
    "set.title": "الإعدادات",
    "set.accessControl": "التحكم بالوصول",
    "set.ownerPassword": "كلمة سر المالك",
    "set.ownerPasswordPh": "اتركه فارغاً لعدم وجود كلمة سر",
    "set.ownerPasswordSetPh": "كلمة السر مضبوطة — اكتب لتغييرها",
    "set.removePassword": "إزالة كلمة السر الحالية",
    "set.passwordNote": "يستخدم المستأجرون رمزاً يُحدّد لكل مستأجر (في تبويب المستأجرين). تُخزّن كلمات السر والرموز مُشفّرة. اترك الحقل فارغاً للإبقاء على كلمة السر الحالية.",
    "set.buildingDetails": "تفاصيل المبنى",
    "set.buildingName": "اسم المبنى",
    "set.language": "اللغة",
    "set.collectionMode": "طريقة التحصيل",
    "set.collectionActual": "تقسيم المصاريف الشهرية الفعلية",
    "set.collectionFixed": "مبلغ شهري ثابت + صندوق احتياطي",
    "set.monthlyBudget": "إجمالي ميزانية المبنى الشهرية بالدولار",
    "set.currency": "العملة والتحويل",
    "set.lbpRate": "سعر صرف الليرة مقابل الدولار",
    "set.lbpRateNote": "يُطبَّق السعر الجديد على القيود الجديدة. تحتفظ القيود السابقة بالسعر الذي سُجّلت به.",
    "set.cloudDb": "قاعدة البيانات السحابية",
    "set.ownerAccount": "حساب المالك",
    "set.signOut": "تسجيل الخروج",
    "set.cloudDbBuiltIn": "متصل بقاعدة بيانات المبنى السحابية. تُزامَن البيانات وصور الفواتير تلقائياً — لا حاجة لأي إعداد على هذا الجهاز.",
    "set.supabaseUrl": "رابط مشروع Supabase",
    "set.supabaseKey": "مفتاح Supabase العام (anon)",
    "set.supabaseNote": "أنشئ مشروعاً مجانياً على supabase.com، ونفّذ سكربت الإعداد، ثم الصق رابط المشروع والمفتاح العام (anon) هنا. لا تلصق مفتاح service_role أبداً.",
    "set.google": "تكامل Google (قديم)",
    "set.appsScriptUrl": "رابط Google Apps Script (مزامنة الجدول)",
    "set.sheetId": "معرّف Google Sheet",
    "set.driveFolderId": "معرّف مجلد الفواتير في Google Drive",
    "set.syncSecret": "كلمة سر المزامنة (اختياري)",
    "set.syncSecretPh": "يطابق SYNC_SECRET المحدّد في Apps Script",
    "set.shareAccessTitle": "دعوة مستأجر",
    "set.shareAccessDesc": "أنشئ رمزاً لمرة واحدة يربط هاتف المستأجر بحسابه فقط. لن يرى سوى أرقامه.",
    "set.backup": "النسخ الاحتياطي والاستعادة",
    "set.downloadBackupTitle": "تنزيل نسخة احتياطية",
    "set.backupPhotosTitle": "تنزيل نسخة احتياطية مع الصور",
    "set.backupPhotosDesc": "ملف ZIP واحد يضم كل بياناتك وجميع الصور: الفواتير وإثباتات الدفع وصور المشاكل.",
    "set.downloadBackupDesc": "احفظ كل بياناتك في ملف على هذا الجهاز. احتفظ به في مكان آمن.",
    "set.restoreTitle": "الاستعادة من ملف احتياطي",
    "set.restoreDesc": "حمّل البيانات من ملف احتياطي حفظته سابقاً. يستبدل بيانات هذا الجهاز — تُنزّل نسخة أمان أولاً.",
    "set.reloadSheetTitle": "إعادة التحميل من Google Sheet",
    "set.reloadSheetDesc": "اسحب أحدث نسخة من السحابة واستبدل بيانات هذا الجهاز. استخدمه عند إعداد هاتف جديد.",
    "set.reset": "إعادة تعيين",
    "set.clearTxTitle": "مسح العمليات",
    "set.clearTxDesc": "احذف كل الدفعات والمصاريف مع الإبقاء على المستأجرين والإعدادات — مثلاً لبدء سنة جديدة.",
    "set.eraseTitle": "محو كل شيء",
    "set.eraseDesc": "احذف كل المستأجرين والدفعات والمصاريف والإعدادات، ثم ابدأ الإعداد من جديد. لا يمكن التراجع.",
    "set.appSetup": "إعداد التطبيق",
    "set.wizardTitle": "معالج الإعداد",
    "set.wizardDesc": "أعد تشغيل الإعداد الموجّه لتفاصيل المبنى والمستأجرين.",
    "set.cloudNote": "تتم المزامنة السحابية تلقائياً بعد حفظ رابط السكربت ومعرّف Google Sheet.",
    // More menu
    "more.title": "المزيد",
    "more.eyebrow": "القائمة",
    "more.projectsSub": "أعمال المبنى والتحصيل",
    "more.servicesSub": "فواتير المولّد والمياه",
    "more.pollsSub": "تصويتات المبنى",
    "more.settingsSub": "المبنى، العملة، المزامنة والوصول",
    // Entry chooser
    "entry.title": "إضافة عملية",
    "entry.paymentTitle": "تسجيل دفعة",
    "entry.paymentDesc": "دفع مستأجر مستحقاته",
    "entry.expenseTitle": "تسجيل مصروف",
    "entry.expenseDesc": "كلفة مشتركة للمبنى",
    "entry.servicesTitle": "كلفة مولّد / مياه",
    "entry.servicesDesc": "مازوت، صيانة أو صهريج مياه",
    "entry.openingTitle": "رصيد افتتاحي",
    "entry.openingDesc": "نقد ابتدائي أو رصيد منقول لمستأجر",
    // Transaction dialog
    "tx.addTitle": "إضافة عملية",
    "tx.type": "النوع",
    "tx.service": "الخدمة",
    "tx.costType": "نوع الكلفة",
    "tx.split": "التقسيم",
    "tx.direction": "الاتجاه",
    "tx.tenant": "المستأجر",
    "tx.description": "الوصف",
    "tx.date": "التاريخ",
    "tx.forMonth": "عن شهر",
    "tx.amount": "المبلغ",
    "tx.currency": "العملة",
    "tx.supplier": "المورّد",
    "tx.supplierPh": "اكتب اسم المورّد",
    "tx.invoiceNumber": "رقم الفاتورة",
    "tx.expenseCategory": "فئة المصروف",
    "tx.expenseCategoryPh": "اكتب الفئة",
    "tx.splitDistribution": "توزيع التقسيم",
    "tx.project": "المشروع",
    "tx.projectPh": "اكتب المشروع",
    "tx.invoicePicture": "صورة الفاتورة",
    "tx.useCamera": "استخدام الكاميرا",
    "tx.uploadPhoto": "رفع صورة",
    "tx.noPhoto": "لم يتم اختيار صورة",
    "aria.showSuppliers": "إظهار المورّدين المحفوظين",
    "aria.showCategories": "إظهار الفئات المحفوظة",
    "aria.showProjects": "إظهار المشاريع المحفوظة",
    // Option labels
    "opt.payments": "دفعات",
    "opt.expenses": "مصاريف",
    "opt.servicesExpenses": "مصاريف الخدمات",
    "opt.openingBalance": "رصيد افتتاحي",
    "opt.generator": "مولّد",
    "opt.water": "مياه",
    "opt.fuel": "وقود / مازوت (استهلاك)",
    "opt.maintenance": "صيانة",
    "opt.equalSplit": "تقسيم متساوٍ",
    "opt.byCoefficient": "حسب المعامل",
    "opt.received": "مقبوض",
    "opt.appliedPaidOut": "مطبّق أو مدفوع",
    "opt.usd": "دولار ($)",
    "opt.lbp": "ليرة (ل.ل)",
    "opt.equalSplitProper": "تقسيم متساوٍ",
    "opt.byCoefficientProp": "حسب المعامل (تناسبي)",
    // Tenant dialog
    "tenant.addTitle": "إضافة مستأجر",
    "tenant.name": "الاسم",
    "tenant.namePh": "مثال: جون سميث",
    "tenant.unit": "رقم الشقة",
    "tenant.unitPh": "مثال: 01",
    "tenant.whatsapp": "رقم واتساب",
    "tenant.coefficient": "المعامل (X / 1000)",
    "tenant.coefficientPh": "مثال: 125",
    "tenant.breaker": "حجم قاطع المولّد (أمبير)",
    "tenant.breakerPh": "مثال: 20",
    "tenant.pin": "رمز المستأجر (للدخول للتطبيق)",
    "tenant.pinPh": "اتركه فارغاً لتعطيل دخول المستأجر",
    "tenant.removePin": "إزالة الرمز الحالي",
    // WhatsApp dialog
    "wa.title": "إرسال تذكيرات الدفع",
    // Month dialog
    "month.title": "إضافة شهر",
    "month.month": "الشهر",
    "month.budget": "إجمالي ميزانية المبنى الشهرية المتوقعة بالدولار",
    // Poll dialog
    "poll.newTitle": "تصويت جديد",
    "poll.question": "السؤال",
    "poll.questionPh": "هل ينبغي أن...؟",
    "poll.desc": "الوصف (اختياري)",
    "poll.descPh": "أضف تفاصيل أكثر عن هذا المشروع...",
    "poll.create": "إنشاء تصويت",
    // Setup wizard
    "wiz.welcomeTitle": "أهلاً بك في متتبّع حساب المبنى",
    "wiz.welcomeSub": "لنُعدّ مبناك بسرعة. يمكنك تحديث هذه التفاصيل في أي وقت من الإعدادات.",
    "wiz.buildingName": "اسم المبنى",
    "wiz.buildingNamePh": "مثال: Naccache 1727",
    "wiz.ownerPassword": "كلمة سر المالك",
    "wiz.optional": "(اختياري)",
    "wiz.language": "اللغة",
    "wiz.financialTitle": "الإعدادات المالية",
    "wiz.financialSub": "اختر طريقة تحصيل الأموال وحدّد سعر صرف الليرة/الدولار.",
    "wiz.collectionMode": "طريقة التحصيل",
    "wiz.collectionActual": "تقسيم المصاريف الشهرية الفعلية بين المستأجرين",
    "wiz.monthlyBudget": "إجمالي ميزانية المبنى الشهرية المتوقعة (دولار)",
    "wiz.lbpRate": "سعر الليرة مقابل الدولار",
    "wiz.tenantsTitle": "إضافة المستأجرين",
    "wiz.tenantsSub": "أضف مستأجري مبناك. يمكنك الإضافة أو التعديل في أي وقت من تبويب المستأجرين.",
    "wiz.name": "الاسم",
    "wiz.namePh": "الاسم الكامل",
    "wiz.unit": "الشقة",
    "wiz.unitPh": "مثال: 3B",
    "wiz.whatsapp": "رقم واتساب",
    "wiz.pin": "الرمز (للدخول)",
    "wiz.pinPh": "4 أرقام",
    "wiz.coefficient": "المعامل (X / 1000)",
    "wiz.addTenant": "+ إضافة مستأجر",
    "wiz.cancelEdit": "إلغاء التعديل",
    "wiz.finish": "✓ إنهاء الإعداد",
    // Project dialog
    "projd.newTitle": "مشروع جديد",
    "projd.name": "اسم المشروع",
    "projd.namePh": "مثال: استبدال المولّد",
    "projd.desc": "الوصف",
    "projd.descPh": "وصف موجز",
    "projd.budget": "إجمالي الميزانية (دولار)",
    "projd.dueDate": "تاريخ استحقاق الدفع",
    "projd.create": "إنشاء مشروع",
    // Generator readings dialog
    "gen.title": "قراءات عداد المولّد",
    "gen.month": "الشهر",
    "gen.note": "تأتي الكلفة من مصاريف الخدمات التي سجّلتها لهذا الشهر. يُقسّم الوقود حسب كيلوواط كل مستأجر (الحالي − السابق)؛ وتُقسّم الصيانة تناسبياً حسب حجم القاطع.",
    "gen.readings": "قراءات العداد (ك.و.س)",
    "gen.removeReadings": "إزالة قراءات العداد",
    "gen.save": "حفظ القراءات",
  },
};

function t(key, params) {
  const table = I18N[currentLang] || I18N.en;
  let str = table[key];
  if (str == null) str = I18N.en[key];
  if (str == null) return key;
  if (params) {
    for (const name in params) str = str.split(`{${name}}`).join(String(params[name]));
  }
  return str;
}

function normalizeLang(lang) {
  return SUPPORTED_LANGS.includes(lang) ? lang : "en";
}

// Reverse map for dynamic strings built in JS (English source → Arabic). Fixed
// strings are auto-translated inside showToast(); labels use tr(). Parameterized
// entries use {name} placeholders. Unknown strings pass through unchanged.
const DYN_AR = {
  "A quick tour": "جولة سريعة",
  "Where everything is in the app": "أين تجد كل شيء في التطبيق",
  "Record a payment": "تسجيل دفعة",
  "With its receipt, in a few taps": "مع الإيصال، ببضع ضغطات",
  "Record an expense": "تسجيل مصروف",
  "With a photo of the invoice": "مع صورة الفاتورة",
  "Share balances with the group": "مشاركة الأرصدة مع المجموعة",
  "One picture for the building's WhatsApp group": "صورة واحدة لمجموعة واتساب المبنى",
  "Generator readings and bills": "قراءات المولّد والفواتير",
  "Split fairly by what each flat used": "تقسيم عادل حسب استهلاك كل شقة",
  "Invite your tenants": "دعوة المستأجرين",
  "Each tenant gets the app on their phone": "كل مستأجر يحصل على التطبيق على هاتفه",
  "Reports and closing the month": "التقارير وإقفال الشهر",
  "Monthly report, cash count, health check": "تقرير شهري، عدّ النقد، فحص البيانات",
  "Maintenance calendar": "روزنامة الصيانة",
  "Never miss an inspection or a cleaning": "لا تفوّت أي كشف أو تنظيف",
  "Notices, votes and problems": "الإعلانات والتصويت والمشاكل",
  "Keep the residents in the loop": "أبقِ المستأجرين على اطلاع",
  "Join with your invite code": "الانضمام برمز الدعوة",
  "For tenants, the first time": "للمستأجرين، في المرة الأولى",
  "Your balance and payments": "رصيدك ودفعاتك",
  "See what you owe and tell the owner you paid": "اعرف ما عليك وأبلغ المالك أنك دفعت",
  "Votes, problems and notifications": "التصويت والمشاكل والإشعارات",
  "Take part in the building": "شارك في شؤون المبنى",
  "For you": "لك",
  "What your tenants see": "ما يراه المستأجرون",
  "New here? Watch the 1-minute tour": "جديد هنا؟ شاهد جولة من دقيقة واحدة",
  "New to the app?": "جديد في التطبيق؟",
  "A 1-minute video shows how it works.": "فيديو من دقيقة واحدة يشرح طريقة الاستخدام.",
  "Watch": "شاهد",
  "Hide": "إخفاء",
  "Bill": "الفاتورة",
  "Generator bill": "فاتورة المولد",
  "To pay for the generator": "المستحق عن المولد",
  "Your meter": "عدّادك",
  "How it is calculated": "كيف تُحتسب",
  "Fuel: {kwh} kWh × ${price}": "المازوت: {kwh} ك.و.س × ${price}",
  "Maintenance: {amps}A of {total}A": "الصيانة: {amps} أمبير من {total} أمبير",
  "Building total this month: {kwh} kWh, fuel {fuel}, maintenance {maint}.": "مجموع المبنى هذا الشهر: {kwh} ك.و.س، مازوت {fuel}، صيانة {maint}.",
  "Fuel is shared by the electricity each unit used; maintenance by breaker size.": "يُوزَّع المازوت حسب الكهرباء التي استهلكتها كل وحدة، والصيانة حسب حجم القاطع.",
  "Enter this month's meter readings first": "أدخل قراءات العدّادات لهذا الشهر أولاً",
  "{name} — generator bill, {month}: {amount}": "{name} — فاتورة المولد، {month}: {amount}",
  "Reading the photo…": "جارٍ قراءة الصورة…",
  "Invoice reading failed ({status})": "فشلت قراءة الفاتورة ({status})",
  "Filled in from the photo — please check the numbers": "تمت التعبئة من الصورة — يرجى التحقق من الأرقام",
  "Couldn't find the amount on the photo": "لم يُعثر على المبلغ في الصورة",
  "Can't reach the server. Check your connection.": "تعذّر الوصول إلى الخادم. تحقق من الاتصال.",
  "Fill in from the photo": "تعبئة البيانات من الصورة",
  "Contract": "عقد",
  "Insurance": "تأمين",
  "Permit": "ترخيص",
  "Attendees": "الحضور",
  "Discussion": "النقاش",
  "Decisions": "القرارات",
  "Votes": "التصويت",
  "Meeting minutes": "محضر الاجتماع",
  "Supplier name": "اسم المورّد",
  "Plumber, electrician, generator…": "سمكري، كهربائي، مولّد…",
  "Remove {name} from the supplier book? Their past expenses stay.": "إزالة {name} من دفتر المورّدين؟ تبقى مصاريفه السابقة.",
  "Edit supplier": "تعديل المورّد",
  "New supplier": "مورّد جديد",
  "What they do": "طبيعة العمل",
  "{n} invoices · {total} in total": "{n} فواتير · {total} إجمالاً",
  "No expenses recorded with this supplier yet.": "لا مصاريف مسجّلة مع هذا المورّد بعد.",
  "No suppliers yet. Add the people you call for the building: plumber, electrician, generator technician, cleaner…": "لا مورّدين بعد. أضف من تتصل بهم للمبنى: السمكري، الكهربائي، فني المولّد، عامل التنظيف…",
  "{n} invoices · {total} · last {date}": "{n} فواتير · {total} · آخرها {date}",
  "No expenses yet": "لا مصاريف بعد",
  "Call": "اتصال",
  "History": "السجل",
  "Upload failed ({status})": "فشل الرفع ({status})",
  "Building insurance 2026": "تأمين المبنى 2026",
  "Delete \"{name}\"? The file is deleted too.": "حذف \"{name}\"؟ يُحذف الملف أيضاً.",
  "Edit document": "تعديل المستند",
  "New document": "مستند جديد",
  "Contracts, insurance, permits… stored privately: only administrators can open them.": "العقود والتأمين والتراخيص… محفوظة بشكل خاص: لا يفتحها إلا المسؤولون.",
  "Type": "النوع",
  "Expires on (optional)": "ينتهي في (اختياري)",
  "You'll be reminded a month before.": "ستصلك تذكرة قبل شهر.",
  "Replace the file (optional)": "استبدال الملف (اختياري)",
  "File (PDF or photo)": "الملف (PDF أو صورة)",
  "No documents yet. Keep the building's contracts, insurance and permits here, with a reminder before they expire.": "لا مستندات بعد. احفظ هنا عقود المبنى وتأمينه وتراخيصه، مع تذكير قبل انتهاء صلاحيتها.",
  "Expired {date}": "انتهى في {date}",
  "Expires {date}": "ينتهي في {date}",
  "Add a category": "أضف فئة",
  "Budget for {year}": "موازنة {year}",
  "What you expect to spend this year in each category. Leave empty for no budget.": "ما تتوقع صرفه هذه السنة في كل فئة. اتركه فارغاً لعدم وضع موازنة.",
  "Another category": "فئة أخرى",
  "Spent": "المصروف",
  "{year} so far against your budget. Categories over budget are in red.": "سنة {year} حتى الآن مقارنة بموازنتك. الفئات التي تجاوزت الموازنة باللون الأحمر.",
  "Set what you expect to spend this year per category, and see how the year is going.": "حدد ما تتوقع صرفه هذه السنة لكل فئة، وتابع سير السنة.",
  "Edit budget": "تعديل الموازنة",
  "Set a budget": "وضع موازنة",
  "The least the building should keep in cash for emergencies. The dashboard warns you when cash drops below it.": "أدنى مبلغ يجب أن يحتفظ به المبنى نقداً للطوارئ. تنبّهك الشاشة الرئيسية عندما ينخفض النقد عنه.",
  "Reserve target (USD)": "الاحتياطي المطلوب (دولار)",
  "Cash is {cash}, below the target of {target}.": "النقد {cash}، أقل من الهدف {target}.",
  "Cash is {cash}, above the target of {target} ✓": "النقد {cash}، فوق الهدف {target} ✓",
  "Annual owners' meeting": "الاجتماع السنوي للمالكين",
  "Who attended (units or names)": "من حضر (الوحدات أو الأسماء)",
  "What was discussed": "ما تمت مناقشته",
  "One decision per line": "قرار واحد في كل سطر",
  "Delete these minutes?": "حذف هذا المحضر؟",
  "Edit minutes": "تعديل المحضر",
  "New meeting": "اجتماع جديد",
  "Polls decided at this meeting": "التصويتات التي حُسمت في هذا الاجتماع",
  "{title} (continued)": "{title} (تابع)",
  "YES {yes} · NO {no} · ABSTAIN {abstain}": "نعم {yes} · لا {no} · امتناع {abstain}",
  "by ownership share": "حسب حصة الملكية",
  "{building} · {date}": "{building} · {date}",
  "No meetings yet. Write down what was decided at each owners' meeting and share the minutes as a PDF.": "لا اجتماعات بعد. دوّن ما تقرر في كل اجتماع للمالكين وشارك المحضر كملف PDF.",
  "No meeting minutes yet.": "لا محاضر اجتماعات بعد.",
  "Close {year}? Every month of {year} is locked. Nothing is erased: balances carry into the new year as they are, and you can still reopen a month in Reports.": "إقفال سنة {year}؟ تُقفل كل أشهر {year}. لا يُمحى شيء: تنتقل الأرصدة إلى السنة الجديدة كما هي، ويمكنك إعادة فتح أي شهر من التقارير.",
  "{year} is closed": "تم إقفال سنة {year}",
  "Keep a copy of the year: the annual report for the owners' meeting and a full backup with photos.": "احتفظ بنسخة من السنة: التقرير السنوي لاجتماع المالكين ونسخة احتياطية كاملة مع الصور.",
  "Annual report (Excel)": "التقرير السنوي (Excel)",
  "Annual report (PDF)": "التقرير السنوي (PDF)",
  "Backup with photos": "نسخة احتياطية مع الصور",
  "Every year so far is closed.": "كل السنوات حتى الآن مقفلة.",
  "At the end of the year, lock all its months and keep a copy. Nothing is erased; balances simply carry on into the new year.": "في نهاية السنة، أقفل كل أشهرها واحتفظ بنسخة. لا يُمحى شيء؛ تنتقل الأرصدة ببساطة إلى السنة الجديدة.",
  "Close the year": "إقفال السنة",
  "{name} expired on {date}": "{name} انتهى في {date}",
  "{name} expires on {date}": "{name} ينتهي في {date}",
  "Cash ({cash}) is below the reserve target of {target}": "النقد ({cash}) أقل من الاحتياطي المطلوب {target}",
  "{n} category is over budget ({names})": "{n} فئة تجاوزت الموازنة ({names})",
  "{n} categories are over budget ({names})": "{n} فئات تجاوزت الموازنة ({names})",
  "Reserve target": "الاحتياطي المطلوب",
  "Enter the supplier's name": "أدخل اسم المورّد",
  "That supplier is already in the book": "هذا المورّد موجود في الدفتر",
  "Supplier saved": "تم حفظ المورّد",
  "Give the document a title": "أعطِ المستند عنواناً",
  "Choose the file": "اختر الملف",
  "Document saved": "تم حفظ المستند",
  "Sign in with Google to upload documents": "سجّل الدخول عبر Google لرفع المستندات",
  "That file is too big (15 MB at most)": "الملف كبير جداً (15 ميغابايت كحد أقصى)",
  "Budget saved": "تم حفظ الموازنة",
  "Reserve target saved": "تم حفظ الاحتياطي المطلوب",
  "Give the meeting a title": "أعطِ الاجتماع عنواناً",
  "Minutes saved": "تم حفظ المحضر",
  "Document": "مستند",
  "Meeting": "اجتماع",
  "Hi {name}! Here is your invite to the {building} app, where you can see your balance and payments.\n1. Open {url}\n2. Tap \"I'm a tenant with an invite code\"\n3. Enter: {code}\nThe code works once, within 30 days.\n\nTip: add the app to your home screen. iPhone: tap Share, then \"Add to Home Screen\". Android: tap ⋮, then \"Install app\". Then open More > Phone notifications to get your balance and news.": "مرحباً {name}! هذه دعوتك إلى تطبيق {building} حيث يمكنك رؤية رصيدك ودفعاتك.\n1. افتح {url}\n2. اضغط \"أنا مستأجر ولديّ رمز دعوة\"\n3. أدخل: {code}\nيعمل الرمز مرة واحدة خلال 30 يوماً.\n\nنصيحة: أضف التطبيق إلى شاشتك الرئيسية. على iPhone: اضغط مشاركة ثم \"إضافة إلى الشاشة الرئيسية\". على Android: اضغط ⋮ ثم \"تثبيت التطبيق\". ثم افتح المزيد > إشعارات الهاتف لتصلك أرصدتك والأخبار.",
  "Phone not linked yet": "الهاتف غير مربوط بعد",
  "Phone linked · notifications on": "الهاتف مربوط · الإشعارات مفعّلة",
  "Phone linked · notifications off": "الهاتف مربوط · الإشعارات متوقفة",
  "Already linked": "مربوط مسبقاً",
  "Not linked yet": "غير مربوط بعد",
  "Not linked yet · no phone number saved": "غير مربوط بعد · لا رقم هاتف محفوظ",
  "Send again": "إرسال مجدداً",
  "Send invite": "إرسال الدعوة",
  "Sent ✓": "أُرسلت ✓",
  "Invite all tenants": "دعوة كل المستأجرين",
  "Each tenant gets their own one-time code on WhatsApp, with the link and how to add the app to their home screen. Tap Send for each one.": "يتلقى كل مستأجر رمزه الخاص لمرة واحدة عبر واتساب، مع الرابط وطريقة إضافة التطبيق إلى شاشته الرئيسية. اضغط إرسال لكل واحد.",
  "Cash": "نقداً",
  "Bank transfer": "تحويل مصرفي",
  "OMT": "OMT",
  "Whish": "Whish",
  "Cheque": "شيك",
  "Paid by": "طريقة الدفع",
  "Paid by {v}": "طريقة الدفع: {v}",
  "Paid from the bank": "دُفع من المصرف",
  "Cash box: counted {counted}, books {books}": "الصندوق: المعدود {counted}، الدفاتر {books}",
  "Bank & wallets: counted {counted}, books {books}": "المصرف والمحافظ: المعدود {counted}، الدفاتر {books}",
  "Nothing due": "لا شيء مستحق",
  "Tick at least one tenant with an amount": "حدد مستأجراً واحداً على الأقل مع مبلغ",
  "{n} payment recorded with its receipt": "سُجّلت {n} دفعة مع إيصالها",
  "{n} payments recorded with their receipts": "سُجّلت {n} دفعات مع إيصالاتها",
  "Who paid? — {month}": "من دفع؟ — {month}",
  "Tick everyone who paid and check the amount. Each payment gets its own receipt.": "حدد كل من دفع وتحقق من المبلغ. لكل دفعة إيصالها الخاص.",
  "Date received": "تاريخ الاستلام",
  "Record payments": "تسجيل الدفعات",
  "Your recent payments": "دفعاتك الأخيرة",
  "Second phone": "هاتف ثانٍ",
  "Number of residents": "عدد السكان",
  "Parking spot / car plate": "موقف السيارة / رقم اللوحة",
  "Emergency contact": "جهة اتصال للطوارئ",
  "Unit details saved": "تم حفظ تفاصيل الوحدة",
  "Unit {unit} — details": "الوحدة {unit} — التفاصيل",
  "Only you see these.": "أنت فقط ترى هذه المعلومات.",
  "Hide this reminder": "إخفاء هذا التذكير",
  "For a week": "لمدة أسبوع",
  "For a month": "لمدة شهر",
  "Don't show it again": "عدم إظهاره مجدداً",
  "Hidden for a week": "أُخفي لمدة أسبوع",
  "Hidden for a month": "أُخفي لمدة شهر",
  "Reminder hidden": "تم إخفاء التذكير",
  "Hidden reminders are listed at the bottom of Needs Attention, where you can show them again.": "تظهر التذكيرات المخفية أسفل قائمة \"يحتاج إلى انتباه\"، ويمكنك إظهارها مجدداً من هناك.",
  "Hidden reminders": "التذكيرات المخفية",
  "Hidden for good": "مخفي نهائياً",
  "Hidden until {date}": "مخفي حتى {date}",
  "Show again": "إظهار مجدداً",
  "Show all again": "إظهار الكل مجدداً",
  "Nothing else needs attention.": "لا شيء آخر يحتاج إلى انتباه.",
  "1 hidden reminder — show": "تذكير مخفي واحد — إظهار",
  "{n} hidden reminders — show": "{n} تذكيرات مخفية — إظهار",
  "Edit Payment": "تعديل الدفعة",
  "Payment updated. Same receipt number": "تم تعديل الدفعة. رقم الإيصال نفسه",
  "That entry was not found": "لم يُعثر على هذا القيد",
  "Lift inspection": "فحص المصعد",
  "Water tank cleaning": "تنظيف خزان المياه",
  "Fire extinguisher refill": "تعبئة طفايات الحريق",
  "Building insurance renewal": "تجديد تأمين المبنى",
  "Pest control": "مكافحة الحشرات",
  "Roof and drains check": "فحص السطح والمجاري",
  "Every month": "كل شهر",
  "Every 2 months": "كل شهرين",
  "Every 3 months": "كل 3 أشهر",
  "Every 6 months": "كل 6 أشهر",
  "Every year": "كل سنة",
  "Every 2 years": "كل سنتين",
  "Every {n} months": "كل {n} أشهر",
  "Company, phone, contract number…": "الشركة، الهاتف، رقم العقد…",
  "Give the job a name": "أعطِ العمل اسماً",
  "Choose when it is next due": "اختر موعد الاستحقاق التالي",
  "Job updated": "تم تحديث العمل",
  "Job added to the calendar": "أُضيف العمل إلى الجدول",
  "Remove \"{name}\" from the calendar? Its history is removed too.": "إزالة \"{name}\" من الجدول؟ يُحذف سجلّه أيضاً.",
  "Edit job": "تعديل العمل",
  "New maintenance job": "عمل صيانة جديد",
  "Job": "العمل",
  "How often": "كم مرة",
  "Next due": "الموعد التالي",
  "Notes": "ملاحظات",
  "Also record the cost as a building expense": "تسجيل الكلفة أيضاً كمصروف للمبنى",
  "Next due: {date}": "الموعد التالي: {date}",
  "Done. Next due {date}": "تم. الموعد التالي {date}",
  "Mark done — {name}": "تسجيل الإنجاز — {name}",
  "Done on": "أُنجز بتاريخ",
  "Cost (USD, optional)": "الكلفة (دولار، اختياري)",
  "Mark done": "تم الإنجاز",
  "Add a common job:": "أضف عملاً شائعاً:",
  "Start with a common job:": "ابدأ بعمل شائع:",
  "Overdue": "متأخر",
  "Due soon": "قريب الاستحقاق",
  "Scheduled": "مجدول",
  "No date": "بلا تاريخ",
  "Next due {date} · {every}": "الموعد التالي {date} · {every}",
  "Last done {date}{cost}": "آخر إنجاز {date}{cost}",
  "No jobs yet. Add the inspections, cleanings and renewals the building needs, and the app reminds you before each is due.": "لا أعمال بعد. أضف الفحوصات والتنظيف والتجديدات التي يحتاجها المبنى، ويذكّرك التطبيق قبل موعد كل منها.",
  "{name} is overdue (was due {date})": "{name} متأخر (كان مستحقاً في {date})",
  "{name} is due {date}": "{name} مستحق في {date}",
  "{n} maintenance jobs are due": "{n} أعمال صيانة مستحقة",
  "Download a backup with photos — last one {date}": "نزّل نسخة احتياطية مع الصور — آخر نسخة {date}",
  "Download your first backup with photos": "نزّل أول نسخة احتياطية مع الصور",
  "Maintenance job": "عمل صيانة",
  "Sign in with Google as the owner to include the photos": "سجّل الدخول عبر Google كمالك لتضمين الصور",
  "{done} of {total}…": "{done} من {total}…",
  "Backup downloaded — {n} photos could not be included (listed in README.txt)": "تم تنزيل النسخة — تعذّر تضمين {n} صور (مذكورة في README.txt)",
  "Backup with {n} photos downloaded": "تم تنزيل النسخة الاحتياطية مع {n} صور",
  "Coefficients add up to {sum}/1000 instead of 1000": "مجموع المعاملات {sum}/1000 بدلاً من 1000",
  "No coefficient for: {units}": "لا معامل للوحدات: {units}",
  "{n} tenant has no phone number ({units})": "{n} مستأجر بلا رقم هاتف ({units})",
  "{n} tenants have no phone number ({units})": "{n} مستأجرين بلا رقم هاتف ({units})",
  "No breaker size for: {units}": "لا قيمة للقاطع للوحدات: {units}",
  "Generator costs without meter readings: {months}": "تكاليف مولد بلا قراءات عدّاد: {months}",
  "Possible duplicate payment: {name}, {amount} on {first} and {second}": "دفعة مكررة محتملة: {name}، {amount} بتاريخ {first} و{second}",
  "{n} entry is dated in the future": "{n} قيد بتاريخ مستقبلي",
  "{n} entries are dated in the future": "{n} قيود بتواريخ مستقبلية",
  "Everything looks right ✓": "كل شيء سليم ✓",
  "Go": "انتقال",
  "Monthly report": "التقرير الشهري",
  "No expenses this month.": "لا مصاريف هذا الشهر.",
  "Collection": "التحصيل",
  "Payments received": "الدفعات المستلمة",
  "Units that paid this month": "الوحدات التي دفعت هذا الشهر",
  "{n} of {total}": "{n} من {total}",
  "Still owed at month end": "المستحق في نهاية الشهر",
  "Fuel": "المازوت",
  "Maintenance": "الصيانة",
  "Electricity used": "الكهرباء المستهلكة",
  "Cost per kWh": "الكلفة لكل ك.و.س",
  "Diesel bought": "المازوت المشترى",
  "{litres} litres": "{litres} ليتر",
  "not entered yet": "لم تُدخل بعد",
  "{n} tanker": "{n} صهريج",
  "{n} tankers": "{n} صهاريج",
  "In the building": "في المبنى",
  "Problems": "المشاكل",
  "{opened} reported, {fixed} fixed": "{opened} مُبلّغ عنها، {fixed} تم إصلاحها",
  "Figures are from the building's account app. For any question, contact the building owner.": "الأرقام من تطبيق حسابات المبنى. لأي سؤال تواصل مع مالك المبنى.",
  "{building} · {month}": "{building} · {month}",
  "{building} — monthly report, {month}": "{building} — التقرير الشهري، {month}",
  "Monthly report shared": "تمت مشاركة التقرير الشهري",
  "Monthly report downloaded": "تم تنزيل التقرير الشهري",
  "On the 1st of each month, send each tenant who owes money a phone notification with their balance": "في الأول من كل شهر، أرسل لكل مستأجر عليه مبلغ إشعاراً على هاتفه برصيده",
  "Only tenants who linked their phone and turned on notifications receive it. The amounts are the ones on your device the last time you saved.": "يصل فقط إلى المستأجرين الذين ربطوا هواتفهم وفعّلوا الإشعارات. المبالغ هي الموجودة على جهازك عند آخر حفظ.",
  "Monthly balance notifications on": "إشعارات الرصيد الشهرية مفعّلة",
  "Monthly balance notifications off": "إشعارات الرصيد الشهرية متوقفة",
  "{name} already has a payment of {amount} on {date}. Record this one too?": "لدى {name} دفعة بقيمة {amount} بتاريخ {date}. هل تسجّل هذه أيضاً؟",
  "{n} thing to check in your data": "{n} أمر يجب التحقق منه في بياناتك",
  "{n} things to check in your data": "{n} أمور يجب التحقق منها في بياناتك",
  "Data health": "سلامة البيانات",
  "Problems the app found in your data, each with a shortcut to fix it.": "مشاكل وجدها التطبيق في بياناتك، مع اختصار لإصلاح كل منها.",
  "A one-page summary of the month for the residents: money in and out, where it went, and what's still owed. The generator part only appears when the building used it that month.": "ملخص من صفحة واحدة للسكان عن الشهر: المداخيل والمصاريف وأين صُرفت وما لا يزال مستحقاً. يظهر قسم المولد فقط إذا استُخدم المولد في ذلك الشهر.",
  "Share PDF": "مشاركة PDF",
  "Automatic reminders": "تذكيرات تلقائية",
  "Balances picture shared": "تمت مشاركة صورة الأرصدة",
  "Balances picture downloaded — attach it in the WhatsApp group": "تم تنزيل صورة الأرصدة — أرفقها في مجموعة واتساب",
  "Building balances": "أرصدة المبنى",
  "As of {date}": "بتاريخ {date}",
  "Total outstanding": "إجمالي المستحق",
  "Up to date": "المسدِّدون",
  "{n} of {total} units": "{n} من {total} وحدات",
  "Tenant credit": "أرصدة دائنة للمستأجرين",
  "In credit": "رصيد دائن",
  "Paid up": "مسدَّد",
  "Balances include monthly charges, generator and water up to today.": "تشمل الأرصدة الرسوم الشهرية والمولد والمياه حتى اليوم.",
  "For any question about your balance, contact the building owner.": "لأي سؤال عن رصيدك، تواصل مع مالك المبنى.",
  "You have view-only access. Changes aren't saved.": "لديك صلاحية الاطلاع فقط. لا تُحفظ التغييرات.",
  "{month} is closed. Reopen it in Reports before changing it.": "شهر {month} مُقفل. أعد فتحه من التقارير قبل تعديله.",
  "Reopen {month}? Its figures can then be changed again.": "إعادة فتح شهر {month}؟ يمكن بعدها تعديل أرقامه من جديد.",
  "{month} closed": "تم إقفال شهر {month}",
  "{month} reopened": "أُعيد فتح شهر {month}",
  "Entry": "قيد",
  "Meter readings": "قراءات العدّادات",
  "Monthly expense": "مصروف شهري",
  "Cash count": "جرد الصندوق",
  "Notice": "إعلان",
  "Problem": "مشكلة",
  "Generator service": "صيانة المولد",
  "Month lock": "إقفال شهر",
  "Settings": "الإعدادات",
  "Many records": "سجلات عديدة",
  "Building settings": "إعدادات المبنى",
  "Amount LBP": "المبلغ بالليرة",
  "Name": "الاسم",
  "Title": "العنوان",
  "Litres": "ليترات",
  "Put back the earlier version of this record?\n\n{label}": "استعادة النسخة السابقة من هذا السجل؟\n\n{label}",
  "That record no longer exists": "هذا السجل لم يعد موجوداً",
  "Earlier version restored": "تمت استعادة النسخة السابقة",
  "Change history": "سجل التغييرات",
  "Nothing recorded yet. From now on every addition, change and deletion is listed here with the date and who made it.": "لا شيء مسجّل بعد. من الآن، تظهر هنا كل إضافة وتعديل وحذف مع التاريخ ومن قام به.",
  "Added": "إضافة",
  "Changed": "تعديل",
  "Deleted": "حذف",
  "Replaced": "استبدال",
  "{n} records at once (restore, import or clear)": "{n} سجل دفعة واحدة (استعادة أو استيراد أو مسح)",
  "by {who}": "بواسطة {who}",
  "Undo": "تراجع",
  "Undone": "تم التراجع",
  "Show more": "عرض المزيد",
  "Every addition, change and deletion, newest first.": "كل إضافة وتعديل وحذف، الأحدث أولاً.",
  "Optional": "اختياري",
  "You counted": "ما عددته",
  "The books say": "ما تقوله الدفاتر",
  "Matches": "مطابق",
  "More than expected": "أكثر من المتوقع",
  "Missing": "نقص",
  "Enter what you counted": "أدخل ما عددته",
  "Cash count saved — it matches the books": "تم حفظ الجرد — مطابق للدفاتر",
  "Cash count saved — difference {amount}": "تم حفظ الجرد — الفرق {amount}",
  "Count the cash": "جرد الصندوق",
  "Count the cash box and check the bank balance. The app compares the total with what the books say you should have.": "عُدّ ما في الصندوق وتحقق من رصيد المصرف. يقارن التطبيق المجموع بما يجب أن يكون لديك حسب الدفاتر.",
  "Cash in USD": "نقداً بالدولار",
  "Cash in LBP": "نقداً بالليرة",
  "Converted at {rate} LBP/USD": "محوّل على سعر {rate} ل.ل/دولار",
  "Bank balance (USD)": "رصيد المصرف (دولار)",
  "Note": "ملاحظة",
  "Save count": "حفظ الجرد",
  "Cancel": "إلغاء",
  "Delete this cash count?": "حذف هذا الجرد؟",
  "Generator: {month} gave {value} kWh per litre, {pct}% below usual ({base}). Check for leaks, theft or an engine problem.": "المولد: أعطى في {month} ‏{value} ك.و.س لكل ليتر، أقل بـ {pct}% من المعتاد ({base}). تحقق من تسرّب أو سرقة أو عطل في المحرك.",
  "Generator: fuel cost per kWh in {month} is {pct}% above usual. Diesel price, or a leak or theft?": "المولد: كلفة المازوت لكل ك.و.س في {month} أعلى بـ {pct}% من المعتاد. سعر المازوت، أم تسرّب أو سرقة؟",
  "Fuel efficiency": "كفاءة الوقود",
  "Last {n} months": "آخر {n} أشهر",
  "kWh / litre": "ك.و.س / ليتر",
  "$ / kWh": "$ / ك.و.س",
  "Tip: type the litres when you record a diesel purchase to see kWh per litre — the clearest sign of leaks or theft.": "نصيحة: أدخل عدد الليترات عند تسجيل شراء المازوت لترى الكيلوواط لكل ليتر — أوضح مؤشر على التسرّب أو السرقة.",
  "Oil and filter change": "تغيير الزيت والفلتر",
  "Say what was done": "اذكر ما تم إنجازه",
  "Generator service saved": "تم حفظ صيانة المولد",
  "Record each service. The app reminds you when the next one is due, by running hours or by date — whichever comes first.": "سجّل كل صيانة. يذكّرك التطبيق بموعد الصيانة التالية حسب ساعات التشغيل أو التاريخ — أيهما يأتي أولاً.",
  "Hour meter reading": "قراءة عدّاد الساعات",
  "Last known: {hours} h": "آخر قراءة: {hours} ساعة",
  "Work done": "العمل المنجز",
  "Cost (USD, optional — record the expense separately)": "الكلفة (دولار، اختياري — سجّل المصروف بشكل منفصل)",
  "Next service at (hours)": "الصيانة التالية عند (ساعات)",
  "or by date": "أو بحلول تاريخ",
  "Save service": "حفظ الصيانة",
  "{hours} h": "{hours} ساعة",
  "Last: {date} · {work}": "آخر صيانة: {date} · {work}",
  "No service recorded yet": "لا صيانة مسجّلة بعد",
  "Record service": "تسجيل صيانة",
  "Hour meter: {hours} h": "عدّاد الساعات: {hours} ساعة",
  "Next at {hours} h": "التالية عند {hours} ساعة",
  "or by {date}": "أو بحلول {date}",
  "Service is overdue.": "الصيانة متأخرة.",
  "Service is due soon.": "الصيانة مستحقة قريباً.",
  "Until {date}": "حتى {date}",
  "Post to WhatsApp group": "نشر في مجموعة واتساب",
  "No notices yet. Post one when there's news for the residents — a water cut, maintenance work, a meeting.": "لا إعلانات بعد. انشر إعلاناً عند وجود أخبار للسكان — انقطاع مياه، أعمال صيانة، اجتماع.",
  "No notices from the building.": "لا إعلانات من إدارة المبنى.",
  "Water cut on Tuesday": "انقطاع المياه يوم الثلاثاء",
  "Details for the residents": "تفاصيل للسكان",
  "Also send a phone notification to tenants": "إرسال إشعار إلى هواتف المستأجرين أيضاً",
  "Give the notice a title": "أعطِ الإعلان عنواناً",
  "Notice posted": "تم نشر الإعلان",
  "Tenants see it on their phones. Post it to the building's WhatsApp group too?": "يراه المستأجرون على هواتفهم. هل تنشره أيضاً في مجموعة واتساب المبنى؟",
  "Done": "تم",
  "New notice": "إعلان جديد",
  "Message": "الرسالة",
  "Show until (optional)": "يُعرض حتى (اختياري)",
  "Without a date it shows for 60 days.": "بدون تاريخ يُعرض لمدة 60 يوماً.",
  "Post notice": "نشر الإعلان",
  "Delete this notice?": "حذف هذا الإعلان؟",
  "In progress": "قيد المعالجة",
  "Fixed": "تم الإصلاح",
  "Photo upload failed ({status})": "فشل رفع الصورة ({status})",
  "Link this phone with an invite code to report problems": "اربط هذا الهاتف برمز دعوة للإبلاغ عن المشاكل",
  "Leak under the stairs": "تسرّب تحت الدرج",
  "Where, since when, how bad": "أين، منذ متى، ومدى خطورته",
  "Describe the problem in a few words": "صف المشكلة ببضع كلمات",
  "Sent to the building owner": "أُرسل إلى مالك المبنى",
  "Problem recorded": "تم تسجيل المشكلة",
  "Report a problem": "الإبلاغ عن مشكلة",
  "The owner gets your report and you can follow its status here.": "يصل بلاغك إلى المالك ويمكنك متابعة حالته هنا.",
  "A building problem everyone can see, like a broken lift.": "مشكلة في المبنى يراها الجميع، كتعطّل المصعد.",
  "What's wrong?": "ما المشكلة؟",
  "Details": "التفاصيل",
  "Photo (optional)": "صورة (اختياري)",
  "e.g. The plumber comes on Thursday": "مثلاً: يأتي السمكري يوم الخميس",
  "Problem update: {title}": "تحديث المشكلة: {title}",
  "Problem updated": "تم تحديث المشكلة",
  "Delete this problem report?": "حذف بلاغ المشكلة هذا؟",
  "Reported by {name} on {date}": "أبلغ عنها {name} بتاريخ {date}",
  "Building problem": "مشكلة في المبنى",
  "Note for the resident": "ملاحظة للساكن",
  "No problems reported.": "لا مشاكل مُبلّغ عنها.",
  "Photo": "صورة",
  "Update": "تحديث",
  "Close": "إغلاق",
  "New occupant's name": "اسم الشاغل الجديد",
  "The leaving tenant settles it": "يسدّده المستأجر المغادر",
  "Transfer it to the new occupant": "ينتقل إلى الشاغل الجديد",
  "{name} is settled in full.": "حساب {name} مسدّد بالكامل.",
  "{name} owes {amount}.": "على {name} مبلغ {amount}.",
  "{name} has a credit of {amount}.": "لـ {name} رصيد دائن بقيمة {amount}.",
  "Choose the handover date": "اختر تاريخ التسليم",
  "Enter the new occupant's name": "أدخل اسم الشاغل الجديد",
  "Balance transferred to {name}": "رصيد محوّل إلى {name}",
  "Balance taken over from {name}": "رصيد منقول من {name}",
  "Handover recorded": "تم تسجيل التسليم",
  "{old} has moved out and {new} is now the occupant of unit {unit}. From {month}, {new} pays the monthly charges.": "غادر {old} وأصبح {new} شاغل الوحدة {unit}. ابتداءً من {month} يدفع {new} الرسوم الشهرية.",
  "Final statement for {name}": "الكشف النهائي لـ {name}",
  "Invite {name}": "دعوة {name}",
  "Move out — {name}": "مغادرة — {name}",
  "Records a change of occupant for unit {unit}. The old account is kept (inactive) with its full history.": "يسجّل تغيير شاغل الوحدة {unit}. يُحتفظ بالحساب القديم (غير نشط) مع كامل سجلّه.",
  "Handover date": "تاريخ التسليم",
  "The leaving tenant pays up to the month before; the new occupant from this month.": "يدفع المستأجر المغادر حتى الشهر السابق، والشاغل الجديد ابتداءً من هذا الشهر.",
  "New occupant": "الشاغل الجديد",
  "Phone (optional)": "الهاتف (اختياري)",
  "Generator meter at handover (optional)": "عدّاد المولد عند التسليم (اختياري)",
  "The balance": "الرصيد",
  "Record handover": "تسجيل التسليم",
  "Sign in with Google as the owner to manage administrators": "سجّل الدخول عبر Google كمالك لإدارة المسؤولين",
  "View only — sees everything, changes nothing": "اطلاع فقط — يرى كل شيء ولا يغيّر شيئاً",
  "Full access — can change everything": "صلاحية كاملة — يمكنه تغيير كل شيء",
  "Create invite link": "إنشاء رابط دعوة",
  "You're invited to help manage {building} in the Building Account Tracker. Open this link on your phone and sign in with your Google account (valid 7 days, one use):\n{link}": "أنت مدعو للمساعدة في إدارة {building} على تطبيق حسابات المبنى. افتح هذا الرابط على هاتفك وسجّل الدخول بحساب Google الخاص بك (صالح 7 أيام، لمرة واحدة):\n{link}",
  "Send on WhatsApp": "إرسال عبر واتساب",
  "Copy link": "نسخ الرابط",
  "Link copied": "تم نسخ الرابط",
  "Administrators": "المسؤولون",
  "Give a family member or the building committee their own sign-in. They use their own Google account; you can remove them at any time.": "امنح أحد أفراد العائلة أو لجنة المبنى دخولاً خاصاً بهم. يستخدمون حساب Google الخاص بهم، ويمكنك إزالتهم في أي وقت.",
  "Invite someone": "دعوة شخص",
  "Google only lets accounts sign in that are allowed in the app's Google settings. If they get an \"access blocked\" message, the account needs adding there first.": "لا يسمح Google بالدخول إلا للحسابات المسموح بها في إعدادات Google للتطبيق. إذا ظهرت رسالة \"تم حظر الوصول\" فيجب إضافة الحساب هناك أولاً.",
  "View only": "اطلاع فقط",
  "Full access": "صلاحية كاملة",
  "You": "أنت",
  "Remove": "إزالة",
  "Remove {email}'s access to the building?": "إزالة وصول {email} إلى المبنى؟",
  "Access removed": "تمت إزالة الوصول",
  "The database update for administrators hasn't been applied yet.": "لم يُطبَّق بعد تحديث قاعدة البيانات الخاص بالمسؤولين.",
  "This phone or browser can't receive notifications. On an iPhone, add the app to the Home Screen first.": "لا يمكن لهذا الهاتف أو المتصفح استقبال الإشعارات. على iPhone أضف التطبيق إلى الشاشة الرئيسية أولاً.",
  "Sign in first (Google for the owner, an invite code for tenants)": "سجّل الدخول أولاً (Google للمالك، رمز دعوة للمستأجرين)",
  "Notifications are blocked for this site in the phone's settings": "الإشعارات محظورة لهذا الموقع في إعدادات الهاتف",
  "Notifications aren't set up on the server yet": "الإشعارات غير مفعّلة على الخادم بعد",
  "Notifications are on for this phone": "الإشعارات مفعّلة على هذا الهاتف",
  "Notifications are off for this phone": "الإشعارات متوقفة على هذا الهاتف",
  "Not available in this browser. On an iPhone, add the app to the Home Screen first.": "غير متاحة في هذا المتصفح. على iPhone أضف التطبيق إلى الشاشة الرئيسية أولاً.",
  "On for this phone.": "مفعّلة على هذا الهاتف.",
  "Get a notification when the owner posts a notice, records your payment or updates a problem you reported.": "تلقَّ إشعاراً عندما ينشر المالك إعلاناً أو يسجّل دفعتك أو يحدّث مشكلة أبلغت عنها.",
  "Get a notification when a tenant says they paid or reports a problem.": "تلقَّ إشعاراً عندما يبلّغ مستأجر أنه دفع أو يبلّغ عن مشكلة.",
  "Turn off": "إيقاف",
  "Turn on": "تفعيل",
  "General": "عام",
  "No expenses recorded yet.": "لا مصاريف مسجّلة بعد.",
  "Change": "التغيّر",
  "{year} is the year so far.": "أرقام {year} حتى تاريخه.",
  "Annual report {year}": "التقرير السنوي {year}",
  "For the owners' meeting": "لاجتماع المالكين",
  "Cash on 1 January": "النقد في 1 كانون الثاني",
  "Money in": "المداخيل",
  "Money out": "المصاريف",
  "Cash on 31 December": "النقد في 31 كانون الأول",
  "Still owed by tenants": "المستحق على المستأجرين",
  "Month by month": "شهراً بشهر",
  "Net": "الصافي",
  "Where the money went": "أين صُرفت الأموال",
  "Paid in the year": "المدفوع خلال السنة",
  "Balances are as of the end of {month}.": "الأرصدة كما في نهاية {month}.",
  "{building} · annual report {year}": "{building} · التقرير السنوي {year}",
  "Annual report downloaded": "تم تنزيل التقرير السنوي",
  "Reopen": "إعادة فتح",
  "No months with activity yet.": "لا أشهر فيها حركة بعد.",
  "Counted {counted} · books {expected}": "المعدود {counted} · الدفاتر {expected}",
  "Annual report": "التقرير السنوي",
  "Everything for the yearly owners' meeting: money in and out, where it went, the reserve, and who still owes.": "كل ما يلزم لاجتماع المالكين السنوي: المداخيل والمصاريف، أين صُرفت، الاحتياطي، ومن لا يزال مديناً.",
  "Year": "السنة",
  "PDF": "PDF",
  "Excel": "Excel",
  "Spending by year": "المصاريف حسب السنة",
  "Cash check": "جرد الصندوق",
  "Once a month, type what's actually in the cash box and the bank. Missing or unrecorded money shows up straight away.": "مرة في الشهر، أدخل ما هو موجود فعلاً في الصندوق والمصرف. يظهر أي نقص أو مبلغ غير مسجّل فوراً.",
  "Close the month": "إقفال الشهر",
  "Once you've sent a month's balances, close it. Its figures can't change by accident; to edit them you reopen the month first.": "بعد إرسال أرصدة الشهر، أقفله. لا تتغيّر أرقامه عن طريق الخطأ؛ ولتعديلها تعيد فتح الشهر أولاً.",
  "{n} changes recorded. Every addition, change and deletion, with the date and who made it — and an Undo for mistakes.": "{n} تغيير مسجّل. كل إضافة وتعديل وحذف مع التاريخ ومن قام به — مع إمكانية التراجع عن الأخطاء.",
  "Open the history": "فتح السجل",
  "Counted by ownership share: YES {yes} · NO {no} · ABSTAIN {abstain} of {total}": "حسب حصة الملكية: نعم {yes} · لا {no} · امتناع {abstain} من {total}",
  "Turnout {pct}% — quorum of {q}% reached": "المشاركة {pct}% — تم بلوغ النصاب {q}%",
  "Turnout {pct}% — needs {q}%": "المشاركة {pct}% — المطلوب {q}%",
  "Voting closes {date}": "يُغلق التصويت في {date}",
  "Voting closed {date}": "أُغلق التصويت في {date}",
  "Result: no decision (quorum not reached)": "النتيجة: لا قرار (لم يكتمل النصاب)",
  "Result: YES": "النتيجة: نعم",
  "Result: NO": "النتيجة: لا",
  "Result: tie": "النتيجة: تعادل",
  "Close {month} now that its balances are out": "أقفل شهر {month} بعد إرسال أرصدته",
  "Count the cash — last count {date}": "جرد الصندوق — آخر جرد {date}",
  "Count the cash once to check the books": "قم بجرد الصندوق مرة للتحقق من الدفاتر",
  "Generator service is overdue": "صيانة المولد متأخرة",
  "Generator service is due soon": "صيانة المولد مستحقة قريباً",
  "{n} problem reported": "{n} مشكلة مُبلّغ عنها",
  "{n} problems reported": "{n} مشاكل مُبلّغ عنها",
  "The database keep-alive hasn't run since {date}. The free database pauses after a week without activity.": "لم يعمل منبّه إبقاء قاعدة البيانات نشطة منذ {date}. تتوقف قاعدة البيانات المجانية بعد أسبوع دون نشاط.",
  "Close {month}? Its figures can't change until you reopen it.": "إقفال شهر {month}؟ لا يمكن تغيير أرقامه حتى تعيد فتحه.",
  "Payment received": "تم استلام الدفعة",
  "{amount} recorded — thank you.": "تم تسجيل {amount} — شكراً لك.",
  "Move out": "مغادرة",
  "Moved out {date}": "غادر بتاريخ {date}",
  "view only": "اطلاع فقط",
  "You've been invited to help manage this building. Continue with Google to accept.": "تمت دعوتك للمساعدة في إدارة هذا المبنى. تابع عبر Google للقبول.",
  "That invite could not be used": "تعذّر استخدام هذه الدعوة",
  "Sign in with Google to accept an administrator invite": "سجّل الدخول عبر Google لقبول دعوة المسؤول",
  "That invite is not valid": "هذه الدعوة غير صالحة",
  "That invite has already been used": "تم استخدام هذه الدعوة مسبقاً",
  "That invite has expired": "انتهت صلاحية هذه الدعوة",
  "The other tenants already use all 1000/1000. Lower someone else's coefficient first.": "المستأجرون الآخرون يستخدمون كامل الـ 1000/1000. خفّض معامل مستأجر آخر أولاً.",
  "Only {room}/1000 is left for this tenant: the total can't go over 1000/1000.": "تبقّى {room}/1000 فقط لهذا المستأجر: لا يمكن أن يتجاوز المجموع 1000/1000.",
  "Available: {room} of 1000": "المتاح: {room} من 1000",
  "{building} — balances as of {date}": "{building} — الأرصدة بتاريخ {date}",
  "paid up ✓ (credit {amount})": "مسدَّد ✓ (رصيد {amount})",
  "paid up ✓": "مسدَّد ✓",
  "Total outstanding: {amount}": "إجمالي المستحق: {amount}",
  "Everyone is up to date for the {month} statement.": "الجميع مسدِّد لكشف شهر {month}.",
  "{names}: no number saved, so WhatsApp will ask who to send it to.": "{names}: لا يوجد رقم محفوظ، لذا سيسألك واتساب لمن ترسل.",
  "Hi {name}! Here is your invite to the {building} app, where you can see your balance and payments.\n1. Open {url}\n2. Tap \"I'm a tenant with an invite code\"\n3. Enter: {code}\nThe code works once, within 30 days.": "مرحباً {name}! هذه دعوتك إلى تطبيق {building} حيث يمكنك رؤية رصيدك ودفعاتك.\n1. افتح {url}\n2. اضغط \"أنا مستأجر ولديّ رمز دعوة\"\n3. أدخل: {code}\nيعمل الرمز مرة واحدة خلال 30 يوماً.",
  "Send balance reminders for the {month} statement": "أرسل تذكيرات الرصيد لكشف شهر {month}",
  "{n} monthly expense to confirm for {month}": "{n} مصروف شهري بانتظار التأكيد لشهر {month}",
  "{n} monthly expenses to confirm for {month}": "{n} مصاريف شهرية بانتظار التأكيد لشهر {month}",
  "Monthly expenses – {month}": "المصاريف الشهرية – {month}",
  "No recurring expenses yet. When you add an expense, tick \"Repeat every month\".": "لا توجد مصاريف متكررة بعد. عند إضافة مصروف، ضع علامة على \"تكرار كل شهر\".",
  "Expense": "مصروف",
  "Added this month ✓": "أُضيف هذا الشهر ✓",
  "Amount ({currency})": "المبلغ ({currency})",
  "Stop": "إيقاف",
  "Tick at least one expense with an amount": "حدد مصروفاً واحداً على الأقل مع مبلغ",
  "{n} expense added": "أُضيف {n} مصروف",
  "{n} expenses added": "أُضيفت {n} مصاريف",
  "Stop repeating \"{name}\"? Expenses already recorded stay.": "إيقاف تكرار \"{name}\"؟ المصاريف المسجّلة سابقاً تبقى.",
  "For {month}": "عن شهر {month}",
  "Photos need the cloud. Send the photo to the owner on WhatsApp instead.": "الصور تحتاج إلى السحابة. أرسل الصورة إلى المالك عبر واتساب بدلاً من ذلك.",
  "Enter the amount you paid": "أدخل المبلغ الذي دفعته",
  "View proof": "عرض الإثبات",
  "Invite": "دعوة",
  "Proof photo must be one of your own uploads": "يجب أن تكون صورة الإثبات من تحميلاتك أنت",
  "Outstanding USD": "المتبقي $",
  "Payment Receipt": "إيصال دفع",
  "Tenant Account Statement": "كشف حساب المستأجر",
  "{name} | Unit {unit}": "{name} | الوحدة {unit}",
  "{name} | Unit {unit} - statement (continued)": "{name} | الوحدة {unit} - كشف الحساب (تابع)",
  "Receipt: {no}": "رقم الإيصال: {no}",
  "Date: {date}": "التاريخ: {date}",
  "Project Payment Details": "تفاصيل دفعة المشروع",
  "Monthly Allocation": "التوزيع الشهري",
  "Applied USD": "المبلغ المخصّص $",
  "Due USD": "المستحق $",
  "Paid USD": "المدفوع $",
  "Monthly Dues": "المستحقات الشهرية",
  "No dues or payments recorded yet.": "لا توجد مستحقات أو دفعات مسجّلة بعد.",
  "Amount USD": "المبلغ $",
  "Received From": "مستلم من",
  "Payment For": "الدفع مقابل",
  "Project Payment": "دفعة مشروع",
  "Amount Received": "المبلغ المستلم",
  "Months Covered": "الأشهر المغطّاة",
  "Advance Credit": "رصيد مسبق",
  "Payment Type": "نوع الدفعة",
  "Payment Date": "تاريخ الدفع",
  "Amount": "المبلغ",
  "Monthly Fee Impact": "الأثر على الرسوم الشهرية",
  "Not attributed to monthly dues": "لا تُحتسب ضمن المستحقات الشهرية",
  "Project payments are separate from monthly building fees.": "دفعات المشاريع منفصلة عن رسوم المبنى الشهرية.",
  "Payments are applied to the tenant's building dues for the month.": "تُطبَّق الدفعات على مستحقات المبنى الشهرية للمستأجر.",
  "Monthly dues and project payments are separated. Project payments are not applied to monthly fees.": "المستحقات الشهرية ودفعات المشاريع منفصلة. لا تُطبَّق دفعات المشاريع على الرسوم الشهرية.",
  "Advance Balance": "رصيد مسبق الدفع",
  "Expense Share": "حصة المصاريف",
  "Total Monthly Dues": "إجمالي المستحقات الشهرية",
  "No share": "لا حصة",
  "Linked as {name} — Unit {unit}": "مرتبط باسم {name} — الوحدة {unit}",
  "This phone is linked to a tenant": "هذا الهاتف مرتبط بمستأجر",
  "Enter the invite code first": "أدخل رمز الدعوة أولاً",
  "This app isn't connected to the cloud database": "هذا التطبيق غير متصل بقاعدة البيانات السحابية",
  "This phone is signed in as the building owner. Link it to a tenant instead? The owner will be signed out here.": "هذا الهاتف مسجّل الدخول كمالك المبنى. هل تريد ربطه بمستأجر بدلاً من ذلك؟ سيتم تسجيل خروج المالك من هذا الهاتف.",
  "Could not create this phone's account": "تعذّر إنشاء حساب لهذا الهاتف",
  "That code is not valid": "هذا الرمز غير صالح",
  "That code has already been used": "هذا الرمز مستخدم مسبقاً",
  "That code has expired": "انتهت صلاحية هذا الرمز",
  "Phone linked. You'll only see your own account.": "تم ربط الهاتف. سترى حسابك فقط.",
  "Unlink this phone? Its copy of your account is removed. You'll need a new invite code from the owner to link it again.": "إلغاء ربط هذا الهاتف؟ ستُحذف نسخة حسابك منه، وستحتاج إلى رمز دعوة جديد من المالك لربطه مجدداً.",
  "Sign in with Google first: only the signed-in owner can create invite codes": "سجّل الدخول عبر Google أولاً: فقط المالك المسجّل يمكنه إنشاء رموز الدعوة",
  "Send this to {name}. On their phone: open {url}, tap \"I'm a tenant with an invite code\" and enter the code. It works once, within 30 days.": "أرسل هذا إلى {name}. على هاتفه: افتح {url}، واضغط \"أنا مستأجر ولديّ رمز دعوة\" وأدخل الرمز. يعمل مرة واحدة خلال 30 يوماً.",
  "Your invite code for {building}": "رمز الدعوة الخاص بك لـ {building}",
  "Invite copied — paste it in WhatsApp or a message": "تم نسخ الدعوة — الصقها في واتساب أو رسالة",
  "Copy this invite:": "انسخ هذه الدعوة:",
  "Sign in with Google first: only the signed-in owner can restore backups": "سجّل الدخول عبر Google أولاً: فقط المالك المسجّل يمكنه استعادة النسخ الاحتياطية",
  "Loading…": "جارٍ التحميل…",
  "No backups yet. The first one is taken tonight.": "لا توجد نسخ احتياطية بعد. تُؤخذ الأولى الليلة.",
  "{tenants} tenants · {transactions} transactions": "{tenants} مستأجرين · {transactions} قيود",
  "Restore the backup from {day}? It replaces the data on every device. Today's data is downloaded first as a safety copy.": "استعادة نسخة {day}؟ ستستبدل البيانات على كل الأجهزة. تُنزَّل بيانات اليوم أولاً كنسخة أمان.",
  "That backup is empty": "هذه النسخة الاحتياطية فارغة",
  "Restored the backup from {day}": "تمت استعادة نسخة {day}",
  "In app": "في التطبيق",
  "Only the building owner can create claim codes": "فقط مالك المبنى يمكنه إنشاء رموز الدعوة",
  "This poll is closed": "هذا الاستطلاع مغلق",
  "Full database export · {date}": "تصدير كامل لقاعدة البيانات · {date}",
  "Only the building owner can export the full database": "فقط مالك المبنى يمكنه تصدير قاعدة البيانات كاملة",
  "Full Excel export downloaded": "تم تنزيل ملف Excel الكامل",
  "{building} · exported {date}": "{building} · صُدّر في {date}",
  "Total": "المجموع",
  "Yes": "نعم",
  "No": "لا",
  "(removed tenant)": "(مستأجر محذوف)",
  "Summary": "ملخص",
  "Tenant balances": "أرصدة المستأجرين",
  "Transactions": "القيود",
  "Monthly activity": "النشاط الشهري",
  "Generator readings": "قراءات المولّد",
  "Monthly budget": "الميزانية الشهرية",
  "Polls": "الاستطلاعات",
  "Payment declarations": "إشعارات الدفع",
  "Tenant": "المستأجر",
  "Unit": "الوحدة",
  "Coefficient": "المعامل",
  "Breaker (A)": "القاطع (أمبير)",
  "Phone": "الهاتف",
  "Active": "نشط",
  "Monthly dues to date": "المستحقات الشهرية حتى الآن",
  "Expense share": "حصة المصاريف",
  "Generator & water": "المولّد والمياه",
  "Payments": "الدفعات",
  "Opening credit (+) / debt (−)": "رصيد افتتاحي دائن (+) / مدين (−)",
  "Balance (owes +)": "الرصيد (مستحق +)",
  "Projects outstanding": "مستحقات المشاريع",
  "Total due": "إجمالي المستحق",
  "Date": "التاريخ",
  "Category": "الفئة",
  "Description": "الوصف",
  "For month": "عن شهر",
  "Expense category": "فئة المصروف",
  "Supplier": "المورّد",
  "Project": "المشروع",
  "Service": "الخدمة",
  "Debit USD": "مدين $",
  "Debit LBP": "مدين ل.ل",
  "Credit USD": "دائن $",
  "Credit LBP": "دائن ل.ل",
  "Net USD": "الصافي $",
  "Invoice photo": "صورة الفاتورة",
  "Opening balance": "الرصيد الافتتاحي",
  "Monthly payments": "الدفعات الشهرية",
  "Project payments": "دفعات المشاريع",
  "Other": "أخرى",
  "Net cash flow": "صافي التدفق النقدي",
  "Cash at month end": "النقد في نهاية الشهر",
  "Previous reading": "القراءة السابقة",
  "Current reading": "القراءة الحالية",
  "kWh used": "الاستهلاك (كيلوواط ساعة)",
  "Fuel share": "حصة الوقود",
  "Maintenance share": "حصة الصيانة",
  "Budget": "الميزانية",
  "Due date": "تاريخ الاستحقاق",
  "Distribution": "طريقة التوزيع",
  "Share": "الحصة",
  "Expected (USD)": "المتوقع ($)",
  "Poll": "الاستطلاع",
  "Created": "تاريخ الإنشاء",
  "Amount (USD)": "المبلغ ($)",
  "Declared on": "تاريخ الإشعار",
  "Building": "المبنى",
  "Exported on": "تاريخ التصدير",
  "App version": "إصدار التطبيق",
  "Collection mode": "طريقة التحصيل",
  "Fixed monthly amount": "مبلغ شهري ثابت",
  "Actual expenses": "المصاريف الفعلية",
  "LBP per USD": "ل.ل لكل دولار",
  "Position": "الوضع المالي",
  "Cash / reserve": "النقد / الاحتياطي",
  "Owed by tenants": "مستحق على المستأجرين",
  "Tenant credit (prepaid)": "رصيد دائن للمستأجرين (مدفوع مسبقاً)",
  "Net position": "صافي الوضع",
  "Total expenses (incl. generator & water)": "إجمالي المصاريف (مع المولّد والمياه)",
  "Total payments received": "إجمالي الدفعات المستلمة",
  "Contents": "المحتويات",
  "Tenants": "المستأجرون",
  "Months with activity": "أشهر فيها نشاط",
  "Generator fuel": "وقود المولّد",
  "Generator maintenance": "صيانة المولّد",
  "This device is offline. Your changes are kept here and sync when you're back online.": "هذا الجهاز غير متصل. تُحفظ تغييراتك هنا وتُزامَن عند عودة الاتصال.",
  "The cloud refused access. Sign out from Settings and sign in again with Google.": "رفضت السحابة الوصول. سجّل الخروج من الإعدادات ثم سجّل الدخول مجدداً عبر Google.",
  "Not signed in to the cloud. Open the login screen and sign in with Google to sync.": "لم تسجّل الدخول إلى السحابة. افتح شاشة الدخول وسجّل الدخول عبر Google للمزامنة.",
  "The cloud database had an error. Tap the chip to try again in a minute.": "حدث خطأ في قاعدة البيانات السحابية. اضغط على الشريحة للمحاولة بعد دقيقة.",
  "Can't reach the cloud database. If this lasts, it may be paused: resume it in the Supabase dashboard.": "تعذّر الوصول إلى قاعدة البيانات السحابية. إذا استمر ذلك فقد تكون متوقفة مؤقتاً: استأنفها من لوحة Supabase.",
  "Sync failed.": "فشلت المزامنة.",
  "Signed in as {email}": "تم تسجيل الدخول باسم {email}",
  "Wrong email or password": "البريد الإلكتروني أو كلمة السر غير صحيحة",
  "This account is not the building owner": "هذا الحساب ليس حساب مالك المبنى",
  "Can't reach the cloud. Check your connection.": "تعذّر الوصول إلى السحابة. تحقّق من الاتصال.",
  "Enter your email and password": "أدخل بريدك الإلكتروني وكلمة السر",
  "Your owner sign-in expired. Sign in again from the login screen.": "انتهت صلاحية تسجيل دخول المالك. سجّل الدخول مجدداً من شاشة الدخول.",
  "Enter this device's owner password": "أدخل كلمة سر المالك على هذا الجهاز",
  "No password set — press Enter to access as owner": "لا توجد كلمة سر — اضغط دخول للوصول كمالك",
  "Incorrect password": "كلمة السر غير صحيحة",
  "Incorrect PIN": "الرمز غير صحيح",
  "Signed out": "تم تسجيل الخروج",
  "{email} is not the building owner's account": "{email} ليس حساب مالك المبنى",
  "Google sign-in didn't finish on this device. Please try again.": "لم يكتمل تسجيل الدخول عبر Google على هذا الجهاز. حاول مجدداً.",
  "Google sign-in was cancelled or failed: {reason}": "أُلغي تسجيل الدخول عبر Google أو فشل: {reason}",
  // Toasts
  "Enter a project name": "أدخل اسم المشروع",
  "Enter the total budget": "أدخل إجمالي الميزانية",
  "Select a payment due date": "اختر تاريخ استحقاق الدفع",
  "Project created": "تم إنشاء المشروع",
  "Project deleted": "تم حذف المشروع",
  "Add tenants before entering meter readings": "أضف مستأجرين قبل إدخال قراءات العداد",
  "Select a month": "اختر شهراً",
  "Meter readings saved": "تم حفظ قراءات العداد",
  "Meter readings removed": "تم حذف قراءات العداد",
  "Please enter the building name.": "الرجاء إدخال اسم المبنى.",
  "Please enter the tenant name.": "الرجاء إدخال اسم المستأجر.",
  "Please enter the unit number.": "الرجاء إدخال رقم الشقة.",
  "Setup complete! Welcome to Building Account Tracker.": "اكتمل الإعداد! أهلاً بك في متتبّع حساب المبنى.",
  "Owner notified of your payment": "تم إبلاغ المالك بدفعتك",
  "Tenant not found": "لم يُعثر على المستأجر",
  "No tenant payment receipt found": "لا يوجد إيصال دفع للمستأجر",
  "Receipt is available for tenant payments only": "الإيصال متاح لدفعات المستأجرين فقط",
  "Could not generate statement": "تعذّر إنشاء كشف الحساب",
  "Statement PDF shared": "تمت مشاركة كشف الحساب PDF",
  "Sharing cancelled": "تم إلغاء المشاركة",
  "Statement PDF downloaded": "تم تنزيل كشف الحساب PDF",
  "Receipt PDF shared": "تمت مشاركة الإيصال PDF",
  "Receipt PDF downloaded": "تم تنزيل الإيصال PDF",
  "Poll closed": "تم إغلاق التصويت",
  "Poll deleted": "تم حذف التصويت",
  "Backup downloaded": "تم تنزيل النسخة الاحتياطية",
  "That file is not a valid backup": "هذا الملف ليس نسخة احتياطية صالحة",
  "That file does not look like a building backup": "لا يبدو أن هذا الملف نسخة احتياطية للمبنى",
  "Backup restored on this device": "تمت استعادة النسخة الاحتياطية على هذا الجهاز",
  "Saved to Google Sheet": "تم الحفظ في Google Sheet",
  "Loaded from Google Sheet": "تم التحميل من Google Sheet",
  "Saved to the cloud": "تم الحفظ في السحابة",
  "Loaded from the cloud": "تم التحميل من السحابة",
  "Set the Google Apps Script URL first, then Save": "حدّد رابط Google Apps Script أولاً ثم احفظ",
  "Set up the cloud database first, then Save": "أعدّ قاعدة البيانات السحابية أولاً ثم احفظ",
  "Access code copied — send it to your tenants": "تم نسخ رمز الوصول — أرسله لمستأجريك",
  "Paste the access code first": "الصق رمز الوصول أولاً",
  "That access code is not valid": "رمز الوصول غير صالح",
  "That access code is missing the sync address": "رمز الوصول ينقصه عنوان المزامنة",
  "Connected. Choose your name and enter your PIN.": "تم الاتصال. اختر اسمك وأدخل رمزك.",
  "Could not connect to the building": "تعذّر الاتصال بالمبنى",
  "All accounts set to zero and synced": "تم تصفير جميع الحسابات ومزامنتها",
  "All accounts set to zero": "تم تصفير جميع الحسابات",
  "Edit generator bills from the Services tab": "عدّل فواتير المولّد من تبويب الخدمات",
  "Only expense entries can be edited here": "يمكن تعديل قيود المصاريف فقط هنا",
  "Transaction not found": "لم يُعثر على العملية",
  "Ledger entry deleted": "تم حذف قيد السجل",
  "No ledger rows to export": "لا توجد صفوف للتصدير",
  "Ledger Excel exported": "تم تصدير السجل Excel",
  "Ledger PDF ready": "السجل PDF جاهز",
  "Tenant updated": "تم تحديث المستأجر",
  "No shared expenses for this month": "لا توجد مصاريف مشتركة لهذا الشهر",
  "All tenants have paid their shared expenses": "دفع جميع المستأجرين مصاريفهم المشتركة",
  "No due tenants have a phone number saved": "لا يوجد رقم هاتف محفوظ للمستأجرين المتأخرين",
  "All tenants have paid their share": "دفع جميع المستأجرين حصتهم",
  "No outstanding statement balances": "لا توجد أرصدة مستحقة",
  "Tenant PIN removed": "تم حذف رمز المستأجر",
  "Uploading replacement invoice": "جارٍ رفع الفاتورة البديلة",
  "Uploading invoice picture": "جارٍ رفع صورة الفاتورة",
  "Payment added. Receipt saved": "تمت إضافة الدفعة. حُفظ الإيصال",
  "Expense added. Invoice uploaded": "تمت إضافة المصروف. رُفعت الفاتورة",
  "Transaction added": "تمت إضافة العملية",
  "Month saved": "تم حفظ الشهر",
  "Owner password removed": "تم حذف كلمة سر المالك",
  "Settings saved": "تم حفظ الإعدادات",
  "All data cleared. Starting fresh.": "تم مسح كل البيانات. بداية جديدة.",
  "Poll created": "تم إنشاء التصويت",
  // Parameterized toasts
  "Voted {vote}": "تم التصويت بـ {vote}",
  "{name} added": "تمت إضافة {name}",
  "{name} removed": "تمت إزالة {name}",
  "Expense saved. Invoice upload failed: {msg}": "حُفظ المصروف. فشل رفع الفاتورة: {msg}",
  "Expense updated": "تم تحديث المصروف",
  "Expense updated. Invoice replaced": "تم تحديث المصروف. استُبدلت الفاتورة",
  "Expense updated. Invoice upload failed: {msg}": "تم تحديث المصروف. فشل رفع الفاتورة: {msg}",
  // Confirm dialogs
  'Delete project "{name}"? Payment transactions linked to this project will remain in the ledger.':
    'حذف المشروع "{name}"؟ ستبقى دفعات هذا المشروع في السجل.',
  "Remove the meter readings for {month}? Tenant charges for that month's generator will be undone until you re-enter readings.":
    "إزالة قراءات العداد لشهر {month}؟ ستُلغى أعباء المولّد لذلك الشهر حتى تُعيد إدخال القراءات.",
  "Notify the owner that you've paid {amount} for {month}?":
    "إبلاغ المالك بأنك دفعت {amount} عن {month}؟",
  "Delete this poll? This cannot be undone.": "حذف هذا التصويت؟ لا يمكن التراجع.",
  "Restore this backup ({summary})? It replaces the data on this device. Your current data will be downloaded first as a safety copy.":
    "استعادة هذه النسخة ({summary})؟ ستستبدل بيانات هذا الجهاز. ستُنزَّل بياناتك الحالية أولاً كنسخة أمان.",
  "Reload from the Google Sheet? This replaces the data on this device with the cloud copy. Any changes here that haven't synced yet will be lost.":
    "إعادة التحميل من Google Sheet؟ ستستبدل بيانات هذا الجهاز بالنسخة السحابية. أي تغييرات لم تُزامَن بعد ستُفقد.",
  "Reload from the cloud? This replaces the data on this device with the cloud copy. Any changes here that haven't synced yet will be lost.":
    "إعادة التحميل من السحابة؟ ستستبدل بيانات هذا الجهاز بالنسخة السحابية. أي تغييرات لم تُزامَن بعد ستُفقد.",
  "The cloud copy is EMPTY. This device has {summary}. Replacing means losing all of it. Download a backup first if you are unsure. Continue anyway?":
    "النسخة السحابية فارغة. هذا الجهاز يحتوي على {summary}. الاستبدال يعني فقدانها بالكامل. نزّل نسخة احتياطية أولاً إذا لم تكن متأكداً. المتابعة على أي حال؟",
  "The cloud copy is empty but this device has data. Nothing was replaced. Tap the sync chip to upload this device's data.":
    "النسخة السحابية فارغة لكن هذا الجهاز يحتوي على بيانات. لم يُستبدل أي شيء. اضغط على شريحة المزامنة لرفع بيانات هذا الجهاز.",
  "Cloud copy is empty — kept this device's data":
    "النسخة السحابية فارغة — تم الإبقاء على بيانات هذا الجهاز",
  "Reload cancelled — this device's data was kept":
    "أُلغيت إعادة التحميل — تم الإبقاء على بيانات هذا الجهاز",
  "Clear all payments and expenses? Your tenants are kept. Use this to start a fresh period (e.g. a new year). This cannot be undone.":
    "مسح كل الدفعات والمصاريف؟ سيبقى المستأجرون. استخدمه لبدء فترة جديدة (مثلاً سنة جديدة). لا يمكن التراجع.",
  "Delete this ledger entry?\n\n{label}\n\nThis removes the record from the app and Google Sheet sync.":
    "حذف قيد السجل؟\n\n{label}\n\nيزيل هذا القيد من التطبيق ومن مزامنة Google Sheet.",
  "Remove {name}'s PIN? They will no longer be able to log in.":
    "إزالة رمز {name}؟ لن يتمكن بعد ذلك من تسجيل الدخول.",
  "Remove the owner password? Anyone opening the app can then enter as owner.":
    "إزالة كلمة سر المالك؟ يمكن لأي شخص يفتح التطبيق الدخول كمالك.",
  "Delete {name}? Their {count} transaction(s) will be kept but unlinked from this tenant.":
    "حذف {name}؟ ستبقى {count} عملية له لكن ستُفصل عن هذا المستأجر.",
  "Delete {name}?": "حذف {name}؟",
  "Erase everything? This permanently deletes all tenants, payments, expenses and settings on this device and starts setup over. This cannot be undone.":
    "محو كل شيء؟ يحذف هذا نهائياً كل المستأجرين والدفعات والمصاريف والإعدادات على هذا الجهاز ويبدأ الإعداد من جديد. لا يمكن التراجع.",
  // KPI cards (dashboard)
  "Cash Balance": "الرصيد النقدي",
  "Reserve Fund": "الصندوق الاحتياطي",
  "Ledger net cash": "صافي النقد في السجل",
  "Collected beyond expenses": "المحصّل فوق المصاريف",
  "Total Expenses": "إجمالي المصاريف",
  "All shared building costs": "كل تكاليف المبنى المشتركة",
  "Outstanding": "المستحق",
  "Tenant balances owed": "أرصدة المستأجرين المستحقة",
  "Net Position": "الوضع الصافي",
  "Cash + outstanding - credits": "النقد + المستحق − الأرصدة الدائنة",
  "Collected funds minus expenses": "الأموال المحصّلة ناقص المصاريف",
  "All recorded building costs": "كل تكاليف المبنى المسجّلة",
  "Tenant dues owed": "مستحقات المستأجرين",
  "Reserve + outstanding - credits": "الاحتياطي + المستحق − الأرصدة الدائنة",
  // Monthly activity / category summary
  "Monthly Payments": "الدفعات الشهرية",
  "Project Payments": "دفعات المشاريع",
  "Opening Balance": "الرصيد الافتتاحي",
  "Expenses": "المصاريف",
  "Generator & Water": "المولّد والمياه",
  "Net Cash Movement": "صافي حركة النقد",
  "Total Expenses:": "إجمالي المصاريف:",
  "Advance Payments": "دفعات مقدمة",
  "Uncategorized": "غير مصنّف",
  "{month} isn't set up yet": "لم يُضبط {month} بعد",
  "Add it to start tracking this month's payments.": "أضِفه لبدء تتبّع دفعات هذا الشهر.",
  "Entries dated in the selected month": "قيود بتاريخ الشهر المحدد",
  "Tenant payments received by date": "دفعات المستأجرين المقبوضة حسب التاريخ",
  "Payments toward building projects": "دفعات لمشاريع المبنى",
  "Prepaid tenant credit": "رصيد مستأجر مدفوع مقدماً",
  "Paid expenses, LBP converted to USD": "المصاريف المدفوعة، محوّلة من الليرة للدولار",
  "Generator fuel, maintenance and water": "وقود المولّد والصيانة والمياه",
  "Cash increase or decrease this month": "زيادة أو نقصان النقد هذا الشهر",
  "{month} by date": "{month} حسب التاريخ",
  "No selected month": "لا يوجد شهر محدد",
  // Tenant status chips / labels
  "Settled": "مسدّد",
  "Due": "مستحق",
  "Paid": "مدفوع",
  "Partial": "جزئي",
  "Unpaid": "غير مدفوع",
  "Advance": "دفعة مقدمة",
  "Credit": "رصيد دائن",
  "Owes": "مدين بـ",
  "Paid in full": "مدفوع بالكامل",
  "Settled in full": "مسدّد بالكامل",
  "No dues": "لا مستحقات",
  "No due": "لا مستحقات",
  "Owes {amount}": "مدين بـ {amount}",
  "Credit {amount}": "رصيد دائن {amount}",
  // Attention items
  "{n} tenant owes {amount}": "{n} مستأجر مدين بمبلغ {amount}",
  "{n} tenants owe {amount}": "{n} مستأجرون مدينون بمبلغ {amount}",
  "Generator: {n} month needs meter readings": "المولّد: {n} شهر يحتاج قراءات عداد",
  "Generator: {n} months need meter readings": "المولّد: {n} أشهر تحتاج قراءات عداد",
  "Reserve fund is negative ({amount})": "الصندوق الاحتياطي سالب ({amount})",
  "Net position is negative ({amount})": "الوضع الصافي سالب ({amount})",
  // Tenant dues summary
  "Your Monthly Dues": "مستحقاتك الشهرية",
  "Your Expense Share": "حصتك من المصاريف",
  "Generator": "المولّد",
  "Water": "المياه",
  "Payments Made": "الدفعات المسدّدة",
  "Projects": "المشاريع",
  "Current Balance": "الرصيد الحالي",
  // Tenant card / payments
  "Your Balance": "رصيدك",
  "Advance credit": "رصيد مقدّم",
  "{amount} due": "{amount} مستحق",
  "{amount} due · {proj} project": "{amount} مستحق · {proj} للمشاريع",
  "{amount} credit": "{amount} رصيد دائن",
  "Expected": "المتوقع",
  "Collected": "المحصّل",
  "Month": "الشهر",
  "Status": "الحالة",
  "Receipts": "الإيصالات",
  // Settings notes
  "Tenants pay a fixed monthly amount; surplus builds the reserve fund.":
    "يدفع المستأجرون مبلغاً شهرياً ثابتاً؛ ويُبنى الفائض في الصندوق الاحتياطي.",
  "Each month's actual expenses are split among tenants.":
    "تُقسّم مصاريف كل شهر الفعلية بين المستأجرين.",
  "Tenants pay a fixed monthly amount (split by coefficient when set). Anything collected beyond expenses builds the reserve fund.":
    "يدفع المستأجرون مبلغاً شهرياً ثابتاً (يُقسّم حسب المعامل عند ضبطه). يُبنى كل ما يُحصّل فوق المصاريف في الصندوق الاحتياطي.",
  "Each month's recorded expenses are split among tenants (by coefficient when set). No fixed monthly amount.":
    "تُقسّم مصاريف كل شهر المسجّلة بين المستأجرين (حسب المعامل عند ضبطه). لا يوجد مبلغ شهري ثابت.",
  "No coefficients set — all tenants use the same flat monthly amount.":
    "لم تُضبط معاملات — يستخدم جميع المستأجرين نفس المبلغ الشهري الموحّد.",
  "Coefficients: {sum}/1000 — all tenants accounted for.":
    "المعاملات: {sum}/1000 — جميع المستأجرين محتسبون.",
  "Coefficients: {sum}/1000 — must total 1000. {rest}":
    "المعاملات: {sum}/1000 — يجب أن يكون المجموع 1000. {rest}",
  "{n} remaining.": "بقي {n}.",
  "{n} over.": "زيادة {n}.",
  // Payment rows
  "Send WhatsApp Reminder": "إرسال تذكير واتساب",
  "Set phone to send reminder": "أضف رقم هاتف لإرسال تذكير",
  "WhatsApp": "واتساب",
  "Add phone": "أضف هاتفاً",
  "Owner notified ✓": "تم إبلاغ المالك ✓",
  "I've Paid": "لقد دفعت",
  "Add Payment": "إضافة دفعة",
  "Unit {unit}": "شقة {unit}",
  "Fully paid": "مدفوع بالكامل",
  "{n}/{m} paid": "{n}/{m} مدفوع",
  "{n}/{m} settled": "{n}/{m} مسدّد",
  "{paid} paid of {share}": "{paid} مدفوع من {share}",
  "of {amount}": "من {amount}",
  // Tenant cards
  "Delete tenant": "حذف المستأجر",
  "Edit": "تعديل",
  "Statement": "كشف حساب",
  "no phone": "بلا هاتف",
  "Save Changes": "حفظ التغييرات",
  // Month history
  "{n}/{m} paid · {rate}%": "{n}/{m} مدفوع · {rate}%",
  "No months yet": "لا أشهر بعد",
  // Transaction dialog dynamic titles
  "Record Payment": "تسجيل دفعة",
  "Record Expense": "تسجيل مصروف",
  "Record a Payment": "تسجيل دفعة",
  "Record an Expense": "تسجيل مصروف",
  "Generator / Water Cost": "كلفة مولّد / مياه",
  "Edit Expense": "تعديل مصروف",
  "Save": "حفظ",
  "Saving...": "جارٍ الحفظ...",
  "Edit Tenant": "تعديل مستأجر",
  "PIN set — type to change": "الرمز مضبوط — اكتب لتغييره",
  // Services cards
  "equal split": "تقسيم متساوٍ",
  "by coefficient": "حسب المعامل",
  "mixed split": "تقسيم مختلط",
  "Update Readings": "تحديث القراءات",
  "Enter Readings": "إدخال القراءات",
  "Remove meter readings": "إزالة قراءات العداد",
  "Not yet billed — enter this month's meter readings to split the costs among tenants.":
    "لم تُحتسب بعد — أدخل قراءات عداد هذا الشهر لتقسيم الكلفة بين المستأجرين.",
  "Not yet billed for this month.": "لم تُحتسب لهذا الشهر بعد.",
  "No services yet.": "لا خدمات بعد.",
  "No services yet. Log generator (diesel/maintenance) or water tanker costs with the + button (choose Services Expenses). Generator is split by meter readings entered here; water is split equally or by coefficient.":
    "لا خدمات بعد. سجّل كلفة المولّد (مازوت/صيانة) أو صهاريج المياه بزر + (اختر مصاريف الخدمات). يُقسّم المولّد حسب قراءات العداد المُدخلة هنا؛ وتُقسّم المياه بالتساوي أو حسب المعامل.",
  "(removed)": "(محذوف)",
  "Fuel {fuel} · Maintenance {maint} · Total {total}": "وقود {fuel} · صيانة {maint} · الإجمالي {total}",
  "{kwh} kWh": "{kwh} ك.و.س",
  "{amps}A · {kwh} kWh · {cons} consumption + {maint} maintenance":
    "{amps} أمبير · {kwh} ك.و.س · {cons} استهلاك + {maint} صيانة",
  "{n} tanker · Total {total} · {split}": "{n} صهريج · الإجمالي {total} · {split}",
  "{n} tankers · Total {total} · {split}": "{n} صهاريج · الإجمالي {total} · {split}",
  "{pct}% of bill": "{pct}% من الفاتورة",
  // Projects
  "No projects yet. Create one with the + New button.": "لا مشاريع بعد. أنشئ مشروعاً بزر + جديد.",
  "No active projects.": "لا مشاريع نشطة.",
  "Remind": "تذكير",
  "Collect": "تحصيل",
  "Delete project": "حذف المشروع",
  "{budget} budget": "ميزانية {budget}",
  "Due {date}": "الاستحقاق {date}",
  "{collected} collected of {budget}": "{collected} محصّل من {budget}",
  // Polls
  "No polls yet. Tap \"+ New Poll\" to start one.": "لا تصويتات بعد. اضغط «+ تصويت جديد» للبدء.",
  "Open": "مفتوح",
  "Closed": "مغلق",
  "Owner": "المالك",
  "By {name} · {date}": "بواسطة {name} · {date}",
  "YES {n}": "نعم {n}",
  "ABSTAIN {n}": "امتناع {n}",
  "NO {n}": "لا {n}",
  "YES": "نعم",
  "NO": "لا",
  "ABSTAIN": "امتناع",
  "✓ YES": "✓ نعم",
  "✓ NO": "✓ لا",
  "✓ Abstain": "✓ امتناع",
  "Vote YES": "صوّت نعم",
  "Vote NO": "صوّت لا",
  "Abstain": "امتناع",
  "Close Poll": "إغلاق التصويت",
  "Delete": "حذف",
  "No categories saved yet": "لا فئات محفوظة بعد",
  "No matching categories": "لا فئات مطابقة",
  // Ledger
  "No matching transactions": "لا عمليات مطابقة",
  "Month: {month}": "الشهر: {month}",
  "Supplier: {v}": "المورّد: {v}",
  "Project: {v}": "المشروع: {v}",
  "Invoice: {v}": "الفاتورة: {v}",
  "Receipt: {v}": "الإيصال: {v}",
  "Attachment: {v}": "المرفق: {v}",
  "Receipt": "إيصال",
  "Invoice": "فاتورة",
  "All Categories": "كل الفئات",
  "All Expense Categories": "كل فئات المصاريف",
  "Showing {n} of {total} transactions": "عرض {n} من {total} عملية",
  // Month history
  "No months recorded yet.": "لا أشهر مسجّلة بعد.",
  "{paid} of {expected} · {rate}%": "{paid} من {expected} · {rate}%",
  // Declarations
  "{name} says they paid {amount} for {month}": "يقول {name} إنه دفع {amount} عن {month}",
  "Record": "تسجيل",
  "Dismiss": "تجاهل",
  "{n} pending": "{n} قيد الانتظار",
  "Notified {date}": "أُبلغ في {date}",
  "{amount} collected": "{amount} محصّل",
  "expenses": "مصاريف",
  // WhatsApp messages (sent to tenants)
  "{building} – Payment Reminder": "{building} – تذكير بالدفع",
  "{building} – Shared Expenses Reminder": "{building} – تذكير بالمصاريف المشتركة",
  "{building} – Project Payment Reminder": "{building} – تذكير بدفعة مشروع",
  "Hi {name}, your outstanding balance{monthLine} is {amount}.":
    "مرحباً {name}، رصيدك المستحق{monthLine} هو {amount}.",
  " as of the {month} statement": " حتى كشف {month}",
  "Hi {name}, your building payment for {month} is outstanding: {amount}.":
    "مرحباً {name}، دفعة المبنى لشهر {month} مستحقة: {amount}.",
  "Hi {name}, your share of the building shared expenses for {month} is outstanding: {amount}.":
    "مرحباً {name}، حصتك من مصاريف المبنى المشتركة لشهر {month} مستحقة: {amount}.",
  'Hi {name}, your share for the "{project}" project is {amount}, due by {date}.':
    'مرحباً {name}، حصتك في مشروع "{project}" هي {amount}، وتستحق بحلول {date}.',
  "Please settle at your earliest convenience. Thank you.":
    "يرجى التسديد في أقرب فرصة. شكراً.",
  // WhatsApp reminder dialog
  "Shared Expenses Reminders – {month}": "تذكيرات المصاريف المشتركة – {month}",
  "Reminders – {project}": "تذكيرات – {project}",
  "Payment Reminders – {month} Statement": "تذكيرات الدفع – كشف {month}",
  "{names} skipped – no phone number saved in the Tenants tab.":
    "{names} — تم تجاهلهم لعدم وجود رقم هاتف محفوظ في تبويب المستأجرين.",
  "{names} skipped – no phone number saved.":
    "{names} — تم تجاهلهم لعدم وجود رقم هاتف محفوظ.",
  "Unit {unit} – {amount} due – {month}": "شقة {unit} – {amount} مستحق – {month}",
  "{amount} outstanding – due {date}": "{amount} مستحق – بحلول {date}",
  "Unit {unit} – {remaining} remaining (stmt {stmt}, paid {paid})":
    "شقة {unit} – {remaining} متبقٍ (الكشف {stmt}، مدفوع {paid})",
  "Unit {unit} – {amount} due ({month} statement)":
    "شقة {unit} – {amount} مستحق (كشف {month})",
  "Send": "إرسال",
  // Amount conversion preview
  "{amount} balance impact": "{amount} أثر على الرصيد",
  "{lbp} = {usd} at {rate} LBP/USD": "{lbp} = {usd} بسعر {rate} ل.ل/دولار",
  // Direction (opening balance)
  "Tenant has credit (prepaid)": "للمستأجر رصيد (مدفوع مقدماً)",
  "Tenant owes (opening due)": "على المستأجر (مستحق افتتاحي)",
  "Cash on hand (add)": "نقد متوفر (إضافة)",
  "Cash shortfall (subtract)": "عجز نقدي (طرح)",
  // Generator readings dialog
  "Previous": "السابق",
  "Current": "الحالي",
  "Unit {unit} · {amps}A": "شقة {unit} · {amps} أمبير",
  "Unit {unit} · no breaker": "شقة {unit} · بلا قاطع",
  "Fuel {fuel} ({fc}) · Maintenance {maint} ({mc}) · Total {total}":
    "وقود {fuel} ({fc}) · صيانة {maint} ({mc}) · الإجمالي {total}",
  "Total billed:": "إجمالي المفوتر:",
  "Total:": "الإجمالي:",
};

// Translate a dynamic (JS-built) string via the reverse map, with {param} substitution.
function tr(en, params) {
  let str = (currentLang === "ar" && DYN_AR[en] != null) ? DYN_AR[en] : en;
  if (params) {
    for (const name in params) str = str.split(`{${name}}`).join(String(params[name]));
  }
  return str;
}

// ---------------------------------------------------------------------------
// Lucide line-icons, inlined as SVG (no runtime dependency). lucide(name)
// returns an <svg> element; stroke defaults to currentColor so CSS controls
// the colour. Path data copied from lucide.dev (ISC licensed).
// ---------------------------------------------------------------------------
const LUCIDE_ICONS = {
  home: [["path", { d: "m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" }], ["path", { d: "M9 22V12h6v10" }]],
  wallet: [["path", { d: "M21 12V7H5a2 2 0 0 1 0-4h14v4" }], ["path", { d: "M3 5v14a2 2 0 0 0 2 2h16v-5" }], ["path", { d: "M18 12a2 2 0 0 0 0 4h4v-4Z" }]],
  users: [["path", { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" }], ["circle", { cx: 9, cy: 7, r: 4 }], ["path", { d: "M22 21v-2a4 4 0 0 0-3-3.87" }], ["path", { d: "M16 3.13a4 4 0 0 1 0 7.75" }]],
  receipt: [["path", { d: "M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" }], ["path", { d: "M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" }], ["path", { d: "M12 17.5v-11" }]],
  grid: [["rect", { width: 7, height: 7, x: 3, y: 3, rx: 1 }], ["rect", { width: 7, height: 7, x: 14, y: 3, rx: 1 }], ["rect", { width: 7, height: 7, x: 14, y: 14, rx: 1 }], ["rect", { width: 7, height: 7, x: 3, y: 14, rx: 1 }]],
  alert: [["path", { d: "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" }], ["path", { d: "M12 9v4" }], ["path", { d: "M12 17h.01" }]],
  check: [["path", { d: "M21.801 10A10 10 0 1 1 17 3.335" }], ["path", { d: "m9 11 3 3L22 4" }]],
  chevronRight: [["path", { d: "m9 18 6-6-6-6" }]],
  chevronLeft: [["path", { d: "m15 18-6-6 6-6" }]],
  chevronDown: [["path", { d: "m6 9 6 6 6-6" }]],
  trash: [["path", { d: "M3 6h18" }], ["path", { d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" }], ["path", { d: "M10 11v6" }], ["path", { d: "M14 11v6" }]],
  search: [["circle", { cx: 11, cy: 11, r: 8 }], ["path", { d: "m21 21-4.3-4.3" }]],
  folder: [["path", { d: "M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" }]],
  zap: [["path", { d: "M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 12 10h8a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 12 14z" }]],
  vote: [["path", { d: "m9 12 2 2 4-4" }], ["rect", { width: 18, height: 18, x: 3, y: 3, rx: 2 }]],
  gear: [["path", { d: "M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" }], ["circle", { cx: 12, cy: 12, r: 3 }]],
  plus: [["path", { d: "M5 12h14" }], ["path", { d: "M12 5v14" }]],
  camera: [["path", { d: "M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" }], ["circle", { cx: 12, cy: 13, r: 3 }]],
  calendar: [["path", { d: "M8 2v4" }], ["path", { d: "M16 2v4" }], ["rect", { width: 18, height: 18, x: 3, y: 4, rx: 2 }], ["path", { d: "M3 10h18" }]],
  megaphone: [["path", { d: "m3 11 18-5v12L3 14v-3z" }], ["path", { d: "M11.6 16.8a3 3 0 1 1-5.8-1.6" }]],
  play: [["path", { d: "M7 4.5v15a1 1 0 0 0 1.5.86l12.4-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5z" }]],
  playCircle: [["circle", { cx: 12, cy: 12, r: 10 }], ["path", { d: "M10 8.5v7a.5.5 0 0 0 .77.42l5.4-3.5a.5.5 0 0 0 0-.84l-5.4-3.5A.5.5 0 0 0 10 8.5z" }]],
  wrench: [["path", { d: "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" }]],
  barChart: [["path", { d: "M3 3v18h18" }], ["path", { d: "M18 17V9" }], ["path", { d: "M13 17V5" }], ["path", { d: "M8 17v-3" }]],
  bell: [["path", { d: "M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" }], ["path", { d: "M10.3 21a1.94 1.94 0 0 0 3.4 0" }]],
};

const SVG_NS = "http://www.w3.org/2000/svg";
function lucide(name, { size = 22, color = "currentColor", stroke = 1.9 } = {}) {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("width", size);
  svg.setAttribute("height", size);
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", color);
  svg.setAttribute("stroke-width", stroke);
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  (LUCIDE_ICONS[name] || []).forEach(([tag, attrs]) => {
    const node = document.createElementNS(SVG_NS, tag);
    for (const k in attrs) node.setAttribute(k, attrs[k]);
    svg.appendChild(node);
  });
  return svg;
}

// Initials for an avatar chip: first letters of the first two words.
function initials(name) {
  return String(name || "?")
    .trim()
    .split(/\s+/)
    .map((w) => w[0] || "")
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";
}

// Build an avatar chip element (initials on a tinted square).
function avatarChip(name, size = 32) {
  const el = document.createElement("span");
  el.className = "avatar";
  el.style.width = `${size}px`;
  el.style.height = `${size}px`;
  el.style.fontSize = size >= 38 ? "0.8rem" : "0.74rem";
  el.textContent = initials(name);
  return el;
}

function applyStaticI18n(root = document) {
  root.querySelectorAll("[data-i18n]").forEach((el) => { el.textContent = t(el.dataset.i18n); });
  root.querySelectorAll("[data-i18n-ph]").forEach((el) => { el.placeholder = t(el.dataset.i18nPh); });
  root.querySelectorAll("[data-i18n-aria]").forEach((el) => { el.setAttribute("aria-label", t(el.dataset.i18nAria)); });
  root.querySelectorAll("[data-i18n-title]").forEach((el) => { el.title = t(el.dataset.i18nTitle); });
}

function applyLanguage(lang) {
  currentLang = normalizeLang(lang);
  try { localStorage.setItem(LANG_KEY, currentLang); } catch (_) {}
  document.documentElement.lang = currentLang;
  document.documentElement.dir = currentLang === "ar" ? "rtl" : "ltr";
  document.body.classList.toggle("rtl", currentLang === "ar");
  applyStaticI18n();
}

// Change language from a UI control: persist into state, apply, and re-render.
function setLanguage(lang) {
  const next = normalizeLang(lang);
  if (state && state.settings) {
    state.settings.language = next;
    saveState();
  }
  applyLanguage(next);
  if (typeof renderAll === "function" && state) renderAll();
}

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
  // Real cents; "|| 0" turns a rounded -0 into 0 so it never prints "-$0.00".
  return usdFormat.format(roundUsd(value) || 0);
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
  return txUsd(transaction, net.usd, net.lbp);
}

function showToast(message, durationMs = 2200) {
  if (Date.now() < (showToast.heldUntil || 0)) return;
  els.toast.textContent = tr(message);
  els.toast.classList.add("visible");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => els.toast.classList.remove("visible"), durationMs);
}

// Returns false when the change was refused (closed month, view-only access);
// the previous copy is then back in `state` and the caller's render shows it.
function saveState(options = {}) {
  stampLbpRates(state, getConversionRate());
  if (options.sync !== false && !guardAndAuditSave()) return false;
  if (sessionMode === "owner" && !isViewerSession()) state.balanceSnapshot = buildBalanceSnapshot();
  state.monthlyExpected = normalizedMonthlyExpected(state.monthlyExpected);
  state.meta = state.meta || {};
  state.meta.rev = Number(state.meta.rev || 0) + 1;
  state.meta.updatedAt = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  if (options.sync !== false) queueCloudSave();
  return true;
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
  hydrated.settings.supabaseUrl ||= "";
  hydrated.settings.supabaseAnonKey ||= "";
  hydrated.settings.collectionMode = hydrated.settings.collectionMode === "fixed" ? "fixed" : "actual";
  hydrated.settings.language = normalizeLang(hydrated.settings.language);
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
  hydrated.deleted.announcements ||= [];
  hydrated.deleted.issues ||= [];
  hydrated.deleted.cashChecks ||= [];
  hydrated.deleted.maintenanceTasks ||= [];
  hydrated.deleted.suppliers ||= [];
  hydrated.deleted.documents ||= [];
  hydrated.deleted.meetings ||= [];
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
  hydrated.recurringExpenses ||= [];
  hydrated.sharedExpenses ||= [];
  hydrated.buildingProjects ||= [];
  hydrated.serviceReadings ||= [];
  hydrated.auditLog ||= [];
  hydrated.monthLocks ||= [];
  hydrated.cashChecks ||= [];
  hydrated.announcements ||= [];
  hydrated.issues ||= [];
  hydrated.generatorServices ||= [];
  hydrated.maintenanceTasks ||= [];
  hydrated.documents ||= [];
  hydrated.meetings ||= [];
  hydrated.budgets ||= {};
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
  ["announcements", "issues", "cashChecks", "maintenanceTasks", "suppliers", "documents", "meetings"].forEach((kind) => {
    const gone = new Set(hydrated.deleted[kind]);
    hydrated[kind] = hydrated[kind].filter((item) => !gone.has(item.id));
  });
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
  stampLbpRates(hydrated, Number(hydrated.settings.lbpPerUsd) || DEFAULT_LBP_PER_USD);
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
  // Without a saved split: the people living there on the expense date, so a
  // later move-out or move-in does not reshuffle old balances.
  const activeTenants = occupantsOn(transaction.date || null);
  if (!activeTenants.length) return 0;
  const totalUsd = txUsd(transaction, transaction.debitUsd, transaction.debitLbp);
  if (!totalUsd) return 0;
  // A tenant's phone only holds its own tenant row; the server sends the
  // building-wide totals so the split matches what the owner sees.
  const red = state.redaction;
  if (red && Number(red.activeTenantCount) > 0) {
    const me = activeTenants.find((t) => t.id === tenantId);
    if (!me) return 0;
    const total = Number(red.activeCoefficientTotal || 0);
    if (total > 0) return roundUsd(totalUsd * ((me.coefficient || 0) / total));
    return roundUsd(totalUsd / Number(red.activeTenantCount));
  }
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
  if (tenant && !tenantOccupiesMonth(tenant, month)) return 0;
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
  if (!window.confirm(tr('Delete project "{name}"? Payment transactions linked to this project will remain in the ledger.', { name: project.name }))) return;
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
      ? tr("No projects yet. Create one with the + New button.")
      : tr("No active projects.");
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
      const metaParts = [tr("{budget} budget", { budget: formatUsd(totalBudget) }), tr("Due {date}", { date: formatDateLabel(project.dueDate) })];
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
          remindBtn.textContent = tr("Remind");
          actions.append(remindBtn);
        }
        const collectBtn = document.createElement("button");
        collectBtn.type = "button";
        collectBtn.className = "mini-button collect-project-btn";
        collectBtn.dataset.projectId = project.id;
        collectBtn.textContent = tr("Collect");
        const deleteBtn = document.createElement("button");
        deleteBtn.type = "button";
        deleteBtn.className = "tenant-trash-btn delete-project-btn";
        deleteBtn.dataset.projectId = project.id;
        deleteBtn.title = tr("Delete project");
        deleteBtn.setAttribute("aria-label", tr("Delete project"));
        deleteBtn.textContent = "\u{1F5D1}";
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
      summary.textContent = tr("{collected} collected of {budget}", { collected: formatUsd(totalCollected), budget: formatUsd(totalBudget) });

      // Tenant status grid
      const grid = document.createElement("div");
      grid.className = "tenant-status-grid";
      tenantStatuses.forEach(({ tenant, share, paid, label, className }) => {
        const statusCard = document.createElement("article");
        statusCard.className = "status-card";
        statusCard.innerHTML = `<strong class="sc-name"></strong><div class="status-card-bottom"><span class="tnum"></span><span class="status-pill"></span></div>`;
        statusCard.querySelector("strong").textContent = tenant.name;
        statusCard.querySelector(".status-card-bottom span:first-child").textContent = `${formatUsd(paid)} / ${formatUsd(share)}`;
        const pill = statusCard.querySelector(".status-pill");
        pill.classList.add(`status-${className === "none" ? "due" : className}`);
        pill.textContent = tr(label);
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
    const amt = txUsd(t, t.debitUsd, t.debitLbp);
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
  // Active tenants, plus one who moved out during this month (their last
  // reading), minus one who only moves in after it.
  const monthStart = monthIso(monthKey(month));
  const monthEnd = getMonthEndDate(monthStart);
  const activeTenants = state.tenants.filter((t) =>
    (t.active !== false || (t.movedOutOn && t.movedOutOn > monthStart)) && !(t.movedInOn && t.movedInOn > monthEnd));
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
        <div class="gen-reading-fields">
          <label class="gen-reading-field"><span class="grf-label"></span><input class="gen-prev" type="number" inputmode="numeric" min="0" step="1" /></label>
          <label class="gen-reading-field"><span class="grf-label"></span><input class="gen-curr" type="number" inputmode="numeric" min="0" step="1" /></label>
        </div>
      `;
      const grfLabels = row.querySelectorAll(".grf-label");
      grfLabels[0].textContent = tr("Previous");
      grfLabels[1].textContent = tr("Current");
      row.querySelector("strong").textContent = tenant.name;
      row.querySelector(".gen-reading-name span").textContent =
        tenant.breakerAmps > 0
          ? tr("Unit {unit} · {amps}A", { unit: tenant.unit, amps: tenant.breakerAmps })
          : tr("Unit {unit} · no breaker", { unit: tenant.unit });
      row.querySelector(".gen-prev").value = prev || "";
      if (saved && saved.currentReading) row.querySelector(".gen-curr").value = saved.currentReading;
      else if (tenant.active === false && tenant.meterEnd !== undefined) row.querySelector(".gen-curr").value = tenant.meterEnd;
      return row;
    }),
  );
}

function updateGeneratorReadingsPreview() {
  const month = monthIso(els.generatorBillMonth.value);
  const pools = getServiceMonthPools("generator", month);
  els.generatorPoolsSummary.textContent = month
    ? tr("Fuel {fuel} ({fc}) · Maintenance {maint} ({mc}) · Total {total}", { fuel: formatUsd(pools.fuelUsd), fc: pools.fuelCount, maint: formatUsd(pools.maintenanceUsd), mc: pools.maintCount, total: formatUsd(pools.totalUsd) })
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
    name.textContent = `${tenantsById.get(id)?.name || "?"} (${tr("{kwh} kWh", { kwh: kwhById[id] })})`;
    const amount = document.createElement("span");
    amount.className = "se-preview-amount";
    amount.textContent = formatUsd(total);
    row.append(name, amount);
    return row;
  });
  const totalRow = document.createElement("div");
  totalRow.className = "se-preview-total";
  const tLabel = document.createElement("strong");
  tLabel.textContent = tr("Total billed:");
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
  if (els.generatorEngineHours) els.generatorEngineHours.value = getServiceReadingRecord("generator", monthIso(m))?.engineHours || "";
  updateGeneratorReadingsPreview();
  updateGeneratorDeleteVisibility();
  openDialog(els.generatorBillDialog);
}

function refreshGeneratorReadingRowsForMonth() {
  buildGeneratorReadingRows(monthIso(els.generatorBillMonth.value));
  if (els.generatorEngineHours) els.generatorEngineHours.value = getServiceReadingRecord("generator", monthIso(els.generatorBillMonth.value))?.engineHours || "";
  updateGeneratorReadingsPreview();
  updateGeneratorDeleteVisibility();
}

// The "Remove meter readings" button only appears when the selected month
// already has saved readings to remove.
function updateGeneratorDeleteVisibility() {
  const month = monthIso(els.generatorBillMonth.value);
  const hasReadings = Boolean(month && getServiceReadingRecord("generator", month));
  els.deleteGeneratorReadingsButton.classList.toggle("hidden", !hasReadings);
}

function submitGeneratorReadings(event) {
  event.preventDefault();
  if (sessionMode !== "owner") return;
  const month = monthIso(els.generatorBillMonth.value);
  if (!month) { showToast("Select a month"); return; }
  if (isMonthClosed(month)) { showToast(closedMonthError(month).message, 5000); return; }
  const readings = readGeneratorFormReadings();
  const engineHours = Number(els.generatorEngineHours?.value || 0);
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
    if (engineHours > 0) existing.engineHours = engineHours;
    else delete existing.engineHours;
  } else {
    state.serviceReadings.push({ id: `rdg-${Date.now()}`, serviceType: "generator", forMonth: month, lines, ...(engineHours > 0 ? { engineHours } : {}) });
  }
  if (!saveState()) return;
  closeDialog(els.generatorBillDialog);
  selectedMonth = month;
  renderAll();
  showToast("Meter readings saved");
}

function deleteServiceReadings(serviceType, month) {
  if (sessionMode !== "owner") return false;
  if (isMonthClosed(month)) { showToast(closedMonthError(month).message, 5000); return false; }
  if (!window.confirm(tr("Remove the meter readings for {month}? Tenant charges for that month's generator will be undone until you re-enter readings.", { month: formatMonth(month) }))) return false;
  state.serviceReadings = (state.serviceReadings || []).filter(
    (r) => !(r.serviceType === serviceType && monthKey(r.forMonth) === monthKey(month)),
  );
  saveState();
  renderAll();
  showToast("Meter readings removed");
  return true;
}

function computeWaterDistribution(month) {
  const txns = state.transactions.filter(
    (t) => t.category === "Services Expenses" && t.serviceType === "water" && monthKey(t.forMonth || t.date || "") === monthKey(month),
  );
  const totalUsd = roundUsd(txns.reduce((s, t) => s + txUsd(t, t.debitUsd, t.debitLbp), 0));
  const shares = {};
  state.tenants.filter((t) => t.active !== false).forEach((t) => {
    shares[t.id] = roundUsd(txns.reduce((s, tx) => s + getTenantExpenseShareForTransaction(t.id, tx), 0));
  });
  const splits = [...new Set(txns.map((t) => t.waterSplit || "equal"))];
  const splitLabel = splits.length > 1 ? tr("mixed split") : splits[0] === "coefficient" ? tr("by coefficient") : tr("equal split");
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
  const text = document.createElement("div");
  text.className = "gbl-text";
  const nameEl = document.createElement("strong");
  nameEl.textContent = name;
  const detail = document.createElement("span");
  detail.className = "gbl-detail";
  detail.textContent = detailText;
  text.append(nameEl, detail);
  const total = document.createElement("b");
  total.className = "tnum";
  total.textContent = totalText;
  item.append(avatarChip(name, 32), text, total);
  return item;
}

function buildGeneratorCard(month, tenantsById) {
  const dist = computeServiceDistribution("generator", month);
  const pools = dist.pools;
  const { card, header } = buildServiceCardShell(
    `⚡ ${tr("Generator")} · ${formatMonth(month)}`,
    tr("Fuel {fuel} · Maintenance {maint} · Total {total}", { fuel: formatUsd(pools.fuelUsd), maint: formatUsd(pools.maintenanceUsd), total: formatUsd(pools.totalUsd) }) + (dist.distributed ? ` · ${tr("{kwh} kWh", { kwh: dist.totalKwh })}` : ""),
  );
  if (sessionMode === "owner") {
    const actions = document.createElement("div");
    actions.className = "project-card-actions";
    const readBtn = document.createElement("button");
    readBtn.type = "button";
    readBtn.className = "mini-button enter-readings-btn";
    readBtn.dataset.month = month;
    readBtn.textContent = dist.distributed ? tr("Update Readings") : tr("Enter Readings");
    actions.append(readBtn);
    // Removing readings is destructive — it lives inside the readings dialog
    // now, not as a one-tap × on the card.
    header.append(actions);
  }
  if (!dist.distributed) {
    const note = document.createElement("p");
    note.className = "settings-note";
    note.textContent = sessionMode === "owner"
      ? tr("Not yet billed — enter this month's meter readings to split the costs among tenants.")
      : tr("Not yet billed for this month.");
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
    const lineEl = buildServiceLine(
      tenant ? tenant.name : tr("(removed)"),
      formatUsd(line.totalUsd),
      tr("{amps}A · {kwh} kWh · {cons} consumption + {maint} maintenance", { amps: line.breakerAmps || 0, kwh: line.kwh || 0, cons: formatUsd(line.consumptionUsd), maint: formatUsd(line.maintenanceUsd) }),
    );
    if (tenant) lineEl.append(miniButton(tr("Bill"), () => { void shareGeneratorBill(id, month); }, "gen-bill-share"));
    lineList.append(lineEl);
  });
  card.append(lineList);
  return card;
}

function buildWaterCard(month, tenantsById) {
  const dist = computeWaterDistribution(month);
  const { card } = buildServiceCardShell(
    `💧 ${tr("Water")} · ${formatMonth(month)}`,
    tr(dist.count === 1 ? "{n} tanker · Total {total} · {split}" : "{n} tankers · Total {total} · {split}", { n: dist.count, total: formatUsd(dist.totalUsd), split: dist.splitLabel }),
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
    lineList.append(buildServiceLine(tenant ? tenant.name : tr("(removed)"), formatUsd(share), tr("{pct}% of bill", { pct })));
  });
  card.append(lineList);
  return card;
}

function renderServices() {
  const genMonths = getServiceMonths("generator");
  const waterMonths = getServiceMonths("water");
  const hasCards = Boolean(genMonths.length || waterMonths.length);
  // The long how-it-works intro only matters before the first service exists;
  // the header readings button is redundant once cards carry their own.
  els.servicesIntro.classList.toggle("hidden", hasCards || sessionMode !== "owner");
  els.addGeneratorBillButton.classList.toggle("hidden", genMonths.length > 0);
  if (!hasCards) {
    const empty = document.createElement("p");
    empty.className = "settings-note";
    empty.textContent = tr("No services yet.");
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

// Who shares a cost dated `date`: the occupants on that day, so a unit that
// changed hands splits by who lived there (without a date: active tenants).
function occupantsOn(date) {
  if (!date) return state.tenants.filter((t) => t.active !== false);
  return state.tenants.filter((t) => (t.active !== false || (t.movedOutOn && t.movedOutOn > date)) && !(t.movedInOn && t.movedInOn > date));
}

function computeSharedExpenseShares(totalUsd, distribution, date = null) {
  const activeTenants = occupantsOn(date);
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
  // A new occupant's first month starts from the meter at handover.
  return Number(state.tenants.find((t) => t.id === tenantId)?.meterStart || 0);
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
  const { amountUsd, amountLbp } = readFormAmount();
  const totalUsd = toUsd(amountUsd, amountLbp);
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
  tLabel.textContent = tr("Total:");
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
        acc.expenseUsd += txUsd(transaction, transaction.debitUsd, transaction.debitLbp);
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
    { category: "Opening Balance", usd: 0, desc: "Entries dated in the selected month" },
    { category: "Monthly Payments", usd: 0, sourceCategory: "Payments", desc: "Tenant payments received by date" },
    { category: "Project Payments", usd: 0, desc: "Payments toward building projects" },
    ...(hasLegacyAdvancePayments ? [{ category: "Advance Payments", usd: 0, desc: "Prepaid tenant credit" }] : []),
    { category: "Expenses", usd: 0, desc: "Paid expenses, LBP converted to USD" },
    { category: "Generator & Water", usd: 0, sourceCategory: "Services Expenses", desc: "Generator fuel, maintenance and water" },
  ];
  const rowByCategory = new Map(rows.map((row) => [row.sourceCategory || row.category, row]));

  state.transactions.forEach((transaction) => {
    if (!month || monthKey(transactionDateValue(transaction)) !== monthKey(month)) return;
    if (transaction.category === "Opening Balance" && transaction.tenantId) return; // not cash movement
    const row = rowByCategory.get(isProjectPayment(transaction) ? "Project Payments" : transaction.category);
    if (!row) return;
    row.usd += transactionNetUsd(transaction);
  });

  const net = rows.reduce((sum, row) => sum + row.usd, 0);
  // Drop $0 lines; always keep the net total.
  return [...rows.filter((row) => Math.abs(row.usd) > 0.005), { category: "Net Cash Movement", usd: net, emphasis: true, desc: "Cash increase or decrease this month" }];
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

  // Segmented month chips (newest last), horizontally scrollable when many.
  els.monthChips.replaceChildren(
    ...months.map((month) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = month === selectedMonth ? "is-active" : "";
      chip.dataset.month = month;
      chip.textContent = formatMonth(month);
      return chip;
    }),
  );
  // Keep the active chip in view.
  const active = els.monthChips.querySelector(".is-active");
  if (active) active.scrollIntoView({ inline: "center", block: "nearest" });
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
  const hasTenants = tenantsWithPin.length > 0;
  els.loginTenantTab.classList.toggle("hidden", !hasTenants && !isTenantSession());
  renderTenantLoginForm();
  if (isTenantSession() && !els.loginTenantTab.classList.contains("active")) els.loginTenantTab.click();
  renderOwnerLoginForm();
  els.loginScreen.classList.remove("hidden");
  document.querySelector(".app-shell").classList.add("hidden");
  focusOwnerLoginField();
}

// How the owner tab signs in when Supabase accounts are on:
//   "google" — Continue with Google (the default)
//   "email"  — email + password for the same kind of account
//   "device" — temporary (Phase 2): the old per-device password, so a failed
//              account sign-in can't lock the owner out before step 7 removes it
let ownerLoginMode = "google";

// Owner states: already signed in on this device (just press Enter), one of
// the three modes above, or — without Supabase — the device password alone.
function renderOwnerLoginForm() {
  const accounts = usesOwnerAccounts();
  const signedIn = accounts && ownerLoginMode !== "device" && isAdminSession();
  const mode = !accounts ? "device" : signedIn ? "signedIn" : ownerLoginMode;
  const show = (el, on) => el.classList.toggle("hidden", !on);
  show(els.loginOwnerAccount, mode === "signedIn");
  if (mode === "signedIn") els.loginOwnerAccount.textContent = tr("Signed in as {email}", { email: authSession.email });
  show(els.googleSignInBtn, mode === "google");
  show(els.loginEmailInput, mode === "email");
  show(els.loginPasswordInput, mode === "email" || mode === "device");
  // Google sign-in has its own button; Enter would do nothing there.
  if (!els.loginOwnerForm.classList.contains("hidden")) show(els.loginSubmitBtn, mode !== "google");
  show(els.loginSwitchAccountBtn, mode === "signedIn");
  show(els.loginEmailModeBtn, mode === "google");
  show(els.loginDeviceFallbackBtn, accounts && (mode === "google" || mode === "email"));
  show(els.loginBackToAccountBtn, accounts && (mode === "email" || mode === "device"));
  const hasPassword = Boolean(state.settings.ownerPasswordHash);
  const hint = mode === "google" && pendingAdminInvite()
    ? tr("You've been invited to help manage this building. Continue with Google to accept.")
    : mode !== "device" ? "" : hasPassword
      ? (accounts ? tr("Enter this device's owner password") : "")
      : tr("No password set — press Enter to access as owner");
  els.loginHint.textContent = hint;
  els.loginHint.classList.toggle("hidden", !hint);
}

function focusOwnerLoginField() {
  if (!els.loginEmailInput.classList.contains("hidden") && !els.loginEmailInput.value) els.loginEmailInput.focus();
  else if (!els.loginPasswordInput.classList.contains("hidden")) els.loginPasswordInput.focus();
  else els.loginSubmitBtn.focus();
}

function showLoginError(message) {
  els.loginError.textContent = tr(message);
  els.loginError.classList.remove("hidden");
}

function enterAsOwner() {
  sessionMode = "owner";
  sessionTenantId = null;
  ownerLoginMode = "google";
  applySessionMode();
  hideLoginScreen();
  els.loginPasswordInput.value = "";
  renderAll();
  checkSetupWizard();
  refreshKeepaliveStatus();
  refreshTenantLinks();
  checkInvoiceReading();
}

function hideLoginScreen() {
  els.loginScreen.classList.add("hidden");
  document.querySelector(".app-shell").classList.remove("hidden");
}

function applySessionMode() {
  // A linked tenant phone holds only its own tenant's money, so building-wide
  // totals (cash, everyone's balances, all payments) can't be computed there.
  document.body.classList.toggle("tenant-phone", sessionMode === "tenant" && isTenantSession());
  if (sessionMode === "tenant") {
    document.body.classList.add("tenant-mode");
    els.logoutButton.classList.remove("hidden");
  } else {
    document.body.classList.remove("tenant-mode");
    els.logoutButton.classList.add("hidden");
  }
}

let ownerSignInBusy = false;

async function attemptLogin() {
  const isOwnerTab = !els.loginOwnerForm.classList.contains("hidden");
  els.loginError.classList.add("hidden");

  if (isOwnerTab && usesOwnerAccounts() && ownerLoginMode !== "device") {
    if (isAdminSession()) {
      enterAsOwner();
      // Boot synced before the owner was known; pull again as the owner.
      syncFromSheet({ silent: true });
      return;
    }
    if (ownerLoginMode === "google") {
      startGoogleSignIn();
      return;
    }
    if (ownerSignInBusy) return;
    const email = els.loginEmailInput.value.trim();
    const password = els.loginPasswordInput.value;
    if (!email || !password) {
      showLoginError("Enter your email and password");
      return;
    }
    ownerSignInBusy = true;
    els.loginSubmitBtn.disabled = true;
    try {
      await signInOwner(email, password);
      enterAsOwner();
      syncFromSheet({ silent: true });
    } catch (error) {
      // fetch() rejects with a TypeError when the network is unreachable, and
      // with a TimeoutError when AbortSignal.timeout fires.
      const unreachable = error instanceof TypeError || error?.name === "TimeoutError" || error?.name === "AbortError";
      showLoginError(unreachable ? "Can't reach the cloud. Check your connection." : error.message);
    } finally {
      ownerSignInBusy = false;
      els.loginSubmitBtn.disabled = false;
      els.loginPasswordInput.value = "";
    }
    return;
  }

  if (!isOwnerTab && isTenantSession()) {
    enterAsLinkedTenant();
    return;
  }

  if (isOwnerTab) {
    const entered = els.loginPasswordInput.value;
    const stored = state.settings.ownerPasswordHash;
    if (!stored || hashSecret(entered, state.security.salt) === stored) {
      enterAsOwner();
      syncFromSheet({ silent: true });
    } else {
      showLoginError("Incorrect password");
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
      showLoginError("Incorrect PIN");
    }
  }
}

function logout() {
  sessionMode = null;
  sessionTenantId = null;
  ownerLoginMode = "google";
  document.body.classList.remove("tenant-mode", "tenant-phone");
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
      text: tr(overdue.length === 1 ? "{n} tenant owes {amount}" : "{n} tenants owe {amount}", { n: overdue.length, amount: formatUsd(total) }),
      view: "paymentsView",
      key: "owing",
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
      text: tr(genPending.length === 1 ? "Generator: {n} month needs meter readings" : "Generator: {n} months need meter readings", { n: genPending.length }),
      view: "servicesView",
    });
  }

  // Money warning. In fixed mode a negative reserve fund means the building
  // overspent its collections. In actual mode cash is routinely negative
  // mid-period (expenses logged before they're collected), so warn only when the
  // net position — cash plus what tenants still owe — is itself negative.
  const totals = getPositionTotals();
  if (isFixedMode() && totals.cashUsd < -0.005) {
    items.push({ kind: "danger", icon: "⚠️", text: tr("Reserve fund is negative ({amount})", { amount: formatUsd(totals.cashUsd) }), view: "ledgerView" });
  } else if (!isFixedMode() && totals.netPositionUsd < -0.005) {
    items.push({ kind: "danger", icon: "⚠️", text: tr("Net position is negative ({amount})", { amount: formatUsd(totals.netPositionUsd) }), view: "ledgerView" });
  }

  // Monthly routine: balance reminders not sent yet this month
  const thisMonth = currentMonthValue();
  if (state.settings.remindersSentMonth !== thisMonth && activeTenants.some((t) => getTenantStatementNotification(t.id))) {
    items.push({ kind: "warn", text: tr("Send balance reminders for the {month} statement", { month: formatMonth(getLastCompletedMonth()) }), view: "paymentsView", action: "reminders", key: `reminders:${thisMonth}` });
  }
  // Recurring expenses waiting to be confirmed for this month
  const recurringDue = pendingRecurringExpenses(thisMonth);
  if (recurringDue.length) {
    items.push({ kind: "warn", text: tr(recurringDue.length === 1 ? "{n} monthly expense to confirm for {month}" : "{n} monthly expenses to confirm for {month}", { n: recurringDue.length, month: formatMonth(thisMonth) }), view: "ledgerView", action: "recurring", key: `recurring:${thisMonth}` });
  }

  items.push(...extraAttentionItems());

  hiddenAttentionItems = items.filter((item) => isAttentionHidden(item));
  const visibleItems = items.filter((item) => !isAttentionHidden(item));
  if (!items.length) {
    els.attentionPanel.classList.add("hidden");
    return;
  }

  const TONE = {
    due: { tint: "#f6e2e2", color: "var(--red)", icon: "alert" },
    danger: { tint: "#f6e2e2", color: "var(--red)", icon: "alert" },
    warn: { tint: "#f6ecd7", color: "var(--amber)", icon: "alert" },
    success: { tint: "var(--green-tint-bg)", color: "var(--primary)", icon: "check" },
    info: { tint: "var(--green-tint-bg)", color: "var(--primary)", icon: "playCircle" },
  };
  els.attentionList.replaceChildren(
    ...visibleItems.map((item) => {
      const tone = TONE[item.kind] || TONE.warn;
      const row = document.createElement("button");
      row.type = "button";
      row.className = "attention-row";
      row.dataset.view = item.view;
      if (item.action) row.dataset.action = item.action;
      if (item.arg) row.dataset.arg = item.arg;
      const chip = document.createElement("span");
      chip.className = "attention-icon";
      chip.style.background = tone.tint;
      chip.appendChild(lucide(tone.icon, { size: 20, color: tone.color }));
      const text = document.createElement("span");
      text.className = "attention-text";
      const titleEl = document.createElement("strong");
      titleEl.textContent = item.text;
      text.appendChild(titleEl);
      if (item.meta) {
        const meta = document.createElement("span");
        meta.textContent = item.meta;
        text.appendChild(meta);
      }
      const chev = lucide("chevronRight", { size: 18, color: "#b3bbb6", stroke: 2.2 });
      chev.classList.add("attention-chevron");
      row.append(chip, text, chev);
      const hide = document.createElement("button");
      hide.type = "button";
      hide.className = "attention-hide";
      hide.dataset.key = attentionKey(item);
      hide.dataset.text = item.text;
      hide.setAttribute("aria-label", tr("Hide this reminder"));
      hide.title = tr("Hide this reminder");
      hide.textContent = "×";
      const wrap = document.createElement("div");
      wrap.className = "attention-item";
      wrap.append(row, hide);
      return wrap;
    }),
    ...(!visibleItems.length ? [mk("p", { className: "settings-note", text: tr("Nothing else needs attention.") })] : []),
    ...(hiddenAttentionItems.length ? [mk("button", {
      type: "button",
      className: "attention-hidden-link",
      text: tr(hiddenAttentionItems.length === 1 ? "1 hidden reminder — show" : "{n} hidden reminders — show", { n: hiddenAttentionItems.length }),
    })] : []),
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
  dueHeaderRow.querySelector("strong").textContent = isFixedMode() ? tr("Your Monthly Dues") : tr("Your Expense Share");
  dueHeaderRow.querySelector("b").textContent = formatUsd(dueBasis);
  list.append(dueHeaderRow);

  if (!isFixedMode()) {
    const categoryMap = getTenantExpensesByCategory(tenantId);
    [...categoryMap.entries()].sort((a, b) => b[1] - a[1]).forEach(([cat, amount]) => {
      const row = document.createElement("article");
      row.className = "summary-row summary-row-indent";
      row.innerHTML = `<div><strong></strong></div><b></b>`;
      row.querySelector("strong").textContent = tr(cat);
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
    row.querySelector("strong").textContent = tr(label);
    row.querySelector("b").textContent = formatUsd(amount);
    list.append(row);
  });

  // Opening balance carry-in (only when present)
  if (Math.abs(openingNet) > 0.005) {
    const openingRow = document.createElement("article");
    openingRow.className = "summary-row";
    openingRow.innerHTML = `<div><strong></strong></div><b></b>`;
    openingRow.querySelector("strong").textContent = tr("Opening Balance");
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
  paymentsRow.innerHTML = `<div><strong></strong></div><b class="advance-credit"></b>`;
  paymentsRow.querySelector("strong").textContent = tr("Payments Made");
  paymentsRow.querySelector("b").textContent = `−${formatUsd(paymentsTotal)}`;
  list.append(paymentsRow);

  // Projects if any
  if (projectsDue > 0) {
    const projRow = document.createElement("article");
    projRow.className = "summary-row";
    projRow.innerHTML = `<div><strong></strong></div><b class="due-amount"></b>`;
    projRow.querySelector("strong").textContent = tr("Projects");
    projRow.querySelector("b").textContent = formatUsd(projectsDue);
    list.append(projRow);
  }

  // Total balance
  const totalRow = document.createElement("article");
  totalRow.className = "summary-row emphasis";
  const balanceClass = totalDue > 0 ? "due-amount" : balance < -0.005 ? "advance-credit" : "";
  totalRow.innerHTML = `<div><strong></strong></div><b class="${balanceClass}"></b>`;
  totalRow.querySelector("strong").textContent = tr("Current Balance");
  totalRow.querySelector("b").textContent = totalDue > 0 ? formatUsd(totalDue) : balance < -0.005 ? tr("Credit {amount}", { amount: formatUsd(-balance) }) : tr("Settled");
  list.append(totalRow);

  els.tenantDuesList.replaceChildren(list);
  els.tenantDuesPanel.classList.remove("hidden");
}

function renderDashboard() {
  renderMonthSelect();

  function buildKpiCards(kpis) {
    return kpis.map(({ label, value, note, valueClass, hero }) => {
      const card = document.createElement("article");
      card.className = hero ? "kpi kpi-hero" : "kpi";
      card.innerHTML = `<span></span><strong></strong><small></small>`;
      card.querySelector("span").textContent = tr(label);
      const strong = card.querySelector("strong");
      strong.textContent = value;
      if (valueClass) strong.classList.add(valueClass);
      card.querySelector("small").textContent = tr(note);
      return card;
    });
  }

  const totals = getPositionTotals();
  const totalExpenses = roundUsd(state.transactions.filter((t) => t.category === "Expenses" || t.category === "Services Expenses").reduce((s, t) => s + txUsd(t, t.debitUsd, t.debitLbp), 0));
  const cashNegative = totals.cashUsd < -0.005 ? "is-negative" : "";
  const outstandingAmber = totals.receivableUsd > 0.005 ? "is-amber" : "";
  els.kpiGrid.replaceChildren(...buildKpiCards(
    isFixedMode()
      ? [
          { label: "Reserve Fund", value: formatUsd(totals.cashUsd), note: "Collected funds minus expenses", valueClass: cashNegative },
          { label: "Total Expenses", value: formatUsd(totalExpenses), note: "All recorded building costs" },
          { label: "Outstanding", value: formatUsd(totals.receivableUsd), note: "Tenant dues owed", valueClass: outstandingAmber },
          { label: "Net Position", value: formatUsd(totals.netPositionUsd), note: "Reserve + outstanding - credits", hero: true },
        ]
      : [
          { label: "Cash Balance", value: formatUsd(totals.cashUsd), note: "Ledger net cash", valueClass: cashNegative },
          { label: "Total Expenses", value: formatUsd(totalExpenses), note: "All shared building costs" },
          { label: "Outstanding", value: formatUsd(totals.receivableUsd), note: "Tenant balances owed", valueClass: outstandingAmber },
          { label: "Net Position", value: formatUsd(totals.netPositionUsd), note: "Cash + outstanding - credits", hero: true },
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
    if (els.newMonthBannerIcon && !els.newMonthBannerIcon.childElementCount) {
      els.newMonthBannerIcon.appendChild(lucide("calendar", { size: 22, color: "#3f5b8c" }));
    }
    els.newMonthBannerTitle.textContent = tr("{month} isn't set up yet", { month: label });
    els.newMonthBannerText.textContent = tr("Add it to start tracking this month's payments.");
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
    ? tr("Tenants pay a fixed monthly amount; surplus builds the reserve fund.")
    : tr("Each month's actual expenses are split among tenants.");
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
  if (els.wizardLanguage) els.wizardLanguage.value = normalizeLang(state.settings.language);
  els.wizardBuildingName.value = (state.building && state.building.name) || "";
  els.wizardOwnerPassword.value = "";
  els.wizardOwnerPassword.placeholder = state.settings.ownerPasswordHash
    ? t("set.ownerPasswordSetPh")
    : t("set.ownerPasswordPh");
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
  els.wizardAddTenantBtn.textContent = t("wiz.addTenant");
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
  els.wizardAddTenantBtn.textContent = t("wiz.addTenant");
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
  els.wizardAddTenantBtn.textContent = tr("Save Changes");
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
  const wizardRoom = COEFFICIENT_TOTAL - wizardTenants
    .filter((_, i) => i !== wizardEditingIdx)
    .reduce((sum, t) => sum + (t.coefficient || 0), 0);
  if (data.coefficient > wizardRoom) {
    showToast(coefficientTooHighMessage(wizardRoom), 6000);
    els.wizardTenantCoeff.focus();
    return;
  }
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
  els.declarationsBadge.textContent = tr("{n} pending", { n: pending.length });
  els.declarationsList.replaceChildren(
    ...pending.map((decl) => {
      const name = tenantName(decl.tenantId);
      const item = document.createElement("div");
      item.className = "declaration-item";
      const info = document.createElement("div");
      info.className = "declaration-info";
      const strong = document.createElement("strong");
      strong.textContent = tr("{name} says they paid {amount} for {month}", { name, amount: formatMonthly(decl.amount), month: formatMonth(decl.month) });
      const sub = document.createElement("span");
      sub.textContent = decl.declaredAt ? tr("Notified {date}", { date: formatDateLabel(decl.declaredAt.slice(0, 10)) }) : "";
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
      recordBtn.textContent = tr("Record Payment");
      const dismissBtn = document.createElement("button");
      dismissBtn.type = "button";
      dismissBtn.className = "secondary-button declaration-dismiss-btn";
      dismissBtn.dataset.declId = decl.id;
      dismissBtn.textContent = tr("Dismiss");
      actions.append(recordBtn, dismissBtn);
      if (decl.proof?.storagePath) {
        const proofBtn = document.createElement("button");
        proofBtn.type = "button";
        proofBtn.className = "secondary-button declaration-proof-btn";
        proofBtn.textContent = tr("View proof");
        proofBtn.addEventListener("click", () => openInvoicePhoto(decl.proof));
        actions.prepend(proofBtn);
      }
      item.append(info, actions);
      return item;
    }),
  );
}

// Confirmation happens in the declare dialog. Returns a promise so the dialog
// can wait for the server.
async function declarePayment(tenantId, month, amount, proof = null) {
  const decl = {
    id: `decl-${Date.now()}`,
    tenantId,
    month,
    amount: Number(amount),
    declaredAt: new Date().toISOString(),
    status: "pending",
    ...(proof ? { proof } : {}),
  };
  if (isTenantSession()) {
    await supabaseRequest("rpc/declare_my_payment", { method: "POST", body: JSON.stringify({ p_month: month, p_amount: Number(amount), ...(proof?.storagePath ? { p_proof_path: proof.storagePath } : {}) }) });
    showToast("Owner notified of your payment");
    syncFromSheet({ silent: true });
    return;
  }
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
  if (record) {
    openPaymentDialogFor(decl.tenantId, decl.month, decl.amount);
    pendingDeclarationProof = decl.proof?.storagePath ? { fileName: "payment-proof.jpg", mimeType: "image/jpeg", ...decl.proof } : null;
  }
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
      const due = balance > 0.005;
      const card = document.createElement("article");
      card.className = "status-card";
      const top = document.createElement("div");
      top.className = "status-card-top";
      const nameEl = document.createElement("strong");
      nameEl.textContent = tenant.name;
      top.append(avatarChip(tenant.name, 32), nameEl);
      const bottom = document.createElement("div");
      bottom.className = "status-card-bottom";
      const sub = document.createElement("span");
      sub.textContent = due
        ? tr("Owes {amount}", { amount: formatUsd(balance) })
        : balance < -0.005 ? tr("Credit {amount}", { amount: formatUsd(-balance) }) : tr("Settled in full");
      const pill = document.createElement("span");
      pill.className = `status-pill status-${due ? "due" : "paid"}`;
      pill.textContent = due ? tr("Due") : tr("Settled");
      bottom.append(sub, pill);
      card.append(top, bottom);
      return card;
    }),
  );
}

function renderExpenseCategoryBreakdown() {
  const monthExpenses = state.transactions.filter(
    (t) => t.category === "Expenses" && monthKey(t.date || t.forMonth || "") === monthKey(selectedMonth),
  );
  // Generator/water costs are part of the month's spend too — include them as
  // one line so this panel's total matches Monthly Activity above it.
  const monthServices = state.transactions.filter(
    (t) => t.category === "Services Expenses" && t.serviceType && monthKey(t.date || t.forMonth || "") === monthKey(selectedMonth),
  );

  if (!monthExpenses.length && !monthServices.length) {
    els.expenseByCategoryPanel.classList.add("hidden");
    return;
  }

  els.expenseByCategoryPanel.classList.remove("hidden");
  els.expenseByCategoryPeriod.textContent = selectedMonth ? tr("{month} by date", { month: formatMonth(selectedMonth) }) : "";

  const categoryMap = new Map();
  monthExpenses.forEach((t) => {
    const cat = t.expenseCategory || "Uncategorized";
    categoryMap.set(cat, (categoryMap.get(cat) || 0) + txUsd(t, t.debitUsd, t.debitLbp));
  });
  const servicesTotal = monthServices.reduce((s, t) => s + txUsd(t, t.debitUsd, t.debitLbp), 0);
  if (servicesTotal > 0.005) categoryMap.set("Generator & Water", (categoryMap.get("Generator & Water") || 0) + servicesTotal);

  const rows = [...categoryMap.entries()].sort((a, b) => b[1] - a[1]);
  const total = rows.reduce((sum, [, amount]) => sum + amount, 0);
  const maxAmount = Math.max(1, ...rows.map(([, a]) => a));

  els.expenseByCategoryList.replaceChildren(
    ...rows.map(([cat, amount]) => {
      const row = document.createElement("article");
      row.className = "cat-row";
      row.innerHTML = `<div class="cat-row-head"><strong></strong><b class="tnum"></b></div><div class="cat-bar"><div class="cat-bar-fill"></div></div>`;
      row.querySelector("strong").textContent = tr(cat);
      row.querySelector("b").textContent = formatUsd(amount);
      row.querySelector(".cat-bar-fill").style.width = `${Math.round((amount / maxAmount) * 100)}%`;
      return row;
    }),
    (() => {
      const totalRow = document.createElement("article");
      totalRow.className = "summary-row emphasis";
      totalRow.innerHTML = `<div><strong></strong></div><b></b>`;
      totalRow.querySelector("strong").textContent = tr("Total Expenses");
      totalRow.querySelector("b").textContent = formatUsd(total);
      return totalRow;
    })(),
  );
}

function renderCategorySummary() {
  els.categorySummaryPeriod.textContent = selectedMonth ? tr("{month} by date", { month: formatMonth(selectedMonth) }) : tr("No selected month");
  els.categorySummary.replaceChildren(
    ...getMonthlyActivityRows(selectedMonth).map((entry) => {
      const row = document.createElement("article");
      row.className = "summary-row";
      row.classList.toggle("emphasis", Boolean(entry.emphasis));
      row.innerHTML = `<div><strong></strong><span></span></div><b></b>`;
      row.querySelector("strong").textContent = tr(entry.category);
      const desc = row.querySelector("span");
      if (entry.desc) desc.textContent = tr(entry.desc); else desc.remove();
      const b = row.querySelector("b");
      b.textContent = formatUsd(entry.usd);
      // Colour the value by sign (muted at zero).
      if (entry.usd < -0.005) b.style.color = "var(--red)";
      else if (entry.usd > 0.005) b.style.color = "var(--primary)";
      else b.style.color = "var(--label-muted)";
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
          .reduce((s, t) => s + txUsd(t, t.debitUsd, t.debitLbp), 0),
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
      row.querySelector("span").textContent = tr("{amount} collected", { amount: formatUsd(monthPaymentsTotal) });
      row.querySelector("b").textContent = formatUsd(monthExpensesTotal);
      row.querySelector("small").textContent = tr("expenses");
      return row;
    }),
  );
}

function appendTenantPaymentExtras(row, tenant, { month, reminderDue = 0, whatsappUrl = null, declarationDue = 0 } = {}) {
  // WhatsApp reminder is a compact action alongside "Add Payment".
  const actions = row.querySelector(".tpr-actions");
  if (reminderDue > 0 && sessionMode === "owner" && actions) {
    if (whatsappUrl) {
      const waBtn = document.createElement("a");
      waBtn.className = "mini-button whatsapp-btn tpr-wa-btn owner-only";
      waBtn.href = whatsappUrl;
      waBtn.target = "_blank";
      waBtn.rel = "noopener";
      waBtn.title = tr("Send WhatsApp Reminder");
      waBtn.textContent = tr("WhatsApp");
      actions.append(waBtn);
    } else {
      const waBtn = document.createElement("button");
      waBtn.className = "mini-button whatsapp-no-phone tpr-wa-btn owner-only";
      waBtn.type = "button";
      waBtn.title = tr("Set phone to send reminder");
      waBtn.textContent = tr("Add phone");
      waBtn.dataset.editTenantId = tenant.id;
      actions.append(waBtn);
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
      paidBtn.textContent = tr("Owner notified ✓");
      paidBtn.disabled = true;
    } else {
      paidBtn.textContent = tr("I've Paid");
      paidBtn.dataset.tenantId = tenant.id;
      paidBtn.dataset.month = month;
      paidBtn.dataset.amount = String(declarationDue);
    }
    row.append(paidBtn);
  }
}

function buildTenantPaymentRowBase({ tenant, paidStr, ofStr, pct, barClass, statusClass, pillText }) {
  const row = document.createElement("div");
  row.className = "tenant-payment-row";

  const top = document.createElement("div");
  top.className = "tpr-top";
  const idCol = document.createElement("div");
  idCol.className = "tpr-id";
  const idText = document.createElement("div");
  idText.className = "tpr-id-text";
  const nameEl = document.createElement("strong");
  nameEl.textContent = tenant.name;
  const unitEl = document.createElement("span");
  unitEl.textContent = tr("Unit {unit}", { unit: tenant.unit });
  idText.append(nameEl, unitEl);
  idCol.append(avatarChip(tenant.name, 32), idText);
  const paidCol = document.createElement("div");
  paidCol.className = "tpr-paid";
  const paidStrong = document.createElement("strong");
  paidStrong.className = "tnum";
  paidStrong.textContent = paidStr;
  const ofEl = document.createElement("span");
  ofEl.className = "tnum";
  ofEl.textContent = ofStr;
  paidCol.append(paidStrong, ofEl);
  top.append(idCol, paidCol);

  const bar = document.createElement("div");
  bar.className = "tpr-bar";
  const fill = document.createElement("div");
  fill.className = `tpr-bar-fill ${barClass}`;
  fill.style.width = pct;
  bar.append(fill);

  const foot = document.createElement("div");
  foot.className = "tpr-foot";
  const pill = document.createElement("span");
  pill.className = `status-pill status-${statusClass}`;
  pill.textContent = pillText;
  const actions = document.createElement("div");
  actions.className = "tpr-actions";
  const addBtn = document.createElement("button");
  addBtn.type = "button";
  addBtn.className = "mini-button tpr-add-btn owner-only";
  addBtn.textContent = tr("Add Payment");
  actions.append(addBtn);
  foot.append(pill, actions);

  row.append(top, bar, foot);
  return row;
}

function renderPaymentsFixed() {
  const collection = getMonthCollection(selectedMonth);
  els.paymentMonthRate.textContent = `${collection.rate}%`;
  els.paymentPaidCount.textContent = tr("{n}/{m} paid", { n: collection.paidCount, m: collection.tenantStatuses.length });

  els.paymentSummary.replaceChildren(
    ...["Expected", "Collected", "Due"].map((label, i) => {
      const value = [formatUsd(collection.expectedTotal), formatUsd(collection.paidTotal), formatUsd(collection.dueTotal)][i];
      const card = document.createElement("article");
      card.className = `payment-summary-card${i === 1 ? " is-collected" : i === 2 ? " is-due" : ""}`;
      card.innerHTML = `<span></span><strong></strong>`;
      card.querySelector("span").textContent = tr(label);
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
      const settled = due <= 0.005 && status.expected > 0;
      const pillText = due > 0 ? tr("{amount} due", { amount: formatUsd(due) }) : status.expected > 0 ? tr("Fully paid") : tr("No due");
      const pct = status.expected > 0 ? `${Math.min(100, Math.round((status.paid / status.expected) * 100))}%` : (status.paid > 0 ? "100%" : "0%");
      const row = buildTenantPaymentRowBase({
        tenant,
        paidStr: formatUsd(status.paid),
        ofStr: tr("of {amount}", { amount: formatUsd(status.expected) }),
        pct,
        barClass: settled ? "is-green" : "is-gold",
        statusClass: due > 0 ? "due" : "paid",
        pillText,
      });
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
  // One consistent basis everywhere: "charged" is everything billed to the
  // tenant (expense share + generator/water + opening carry-in), so
  // charged − payments = balance. "totalDue" adds project shares, matching the
  // Tenants cards (getTenantTotals) and the dashboard Outstanding KPI.
  const balanceData = activeTenants.map((tenant) => {
    const balance = getTenantBalance(tenant.id);
    const payments = getTenantPaymentsTotal(tenant.id);
    const projectsDue = getTenantProjectOutstanding(tenant.id);
    return {
      tenant,
      balance,
      payments,
      projectsDue,
      charged: roundUsd(balance + payments),
      totalDue: roundUsd(Math.max(0, balance) + projectsDue),
    };
  });

  const totalOutstanding = roundUsd(balanceData.reduce((s, d) => s + d.totalDue, 0));
  const totalCollected = roundUsd(balanceData.reduce((s, d) => s + d.payments, 0));
  const totalExpenses = roundUsd(
    balanceData.reduce((s, d) => s + getTenantDueBasisTotal(d.tenant.id) + getTenantServicesDue(d.tenant.id), 0),
  );
  const settledCount = balanceData.filter((d) => d.totalDue <= 0.005).length;

  els.paymentMonthRate.textContent = tr("{n}/{m} settled", { n: settledCount, m: activeTenants.length });
  els.paymentPaidCount.textContent = tr("{n}/{m} settled", { n: settledCount, m: activeTenants.length });

  els.paymentSummary.replaceChildren(
    ...["Total Expenses", "Collected", "Outstanding"].map((label, i) => {
      const value = [formatUsd(totalExpenses), formatUsd(totalCollected), formatUsd(totalOutstanding)][i];
      const card = document.createElement("article");
      card.className = `payment-summary-card${i === 1 ? " is-collected" : i === 2 ? " is-due" : ""}`;
      card.innerHTML = `<span></span><strong></strong>`;
      card.querySelector("span").textContent = tr(label);
      card.querySelector("strong").textContent = value;
      return card;
    }),
  );

  els.dueOnlyToggle.classList.toggle("is-active", dueOnlyFilter);
  const visibleData = dueOnlyFilter ? balanceData.filter((d) => d.totalDue > 0.005) : balanceData;

  els.tenantPaymentList.replaceChildren(
    ...visibleData.map(({ tenant, balance, payments, projectsDue, charged, totalDue }) => {
      const due = Math.max(0, balance);
      const pillText = totalDue > 0.005
        ? (projectsDue > 0.005
            ? tr("{amount} due · {proj} project", { amount: formatUsd(totalDue), proj: formatUsd(projectsDue) })
            : tr("{amount} due", { amount: formatUsd(totalDue) }))
        : balance < -0.005 ? tr("{amount} credit", { amount: formatUsd(-balance) }) : tr("Settled");
      const pct = charged > 0.005 ? `${Math.min(100, Math.round((payments / charged) * 100))}%` : "100%";
      const row = buildTenantPaymentRowBase({
        tenant,
        paidStr: formatUsd(payments),
        ofStr: tr("of {amount}", { amount: formatUsd(charged) }),
        pct,
        barClass: totalDue > 0.005 ? "is-gold" : "is-green",
        statusClass: totalDue > 0.005 ? "due" : "paid",
        pillText,
      });
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
          <div class="tenant-id">
            <div class="tenant-id-text">
              <strong></strong>
              <span class="tenant-unit-line"></span>
            </div>
          </div>
          <button class="tenant-trash-btn delete-tenant-button" type="button" aria-label="Delete tenant"></button>
        </div>
        <div class="tenant-metrics">
          <div class="metric metric-paid"><span></span><b></b></div>
          <div class="metric metric-advance"><span></span><b></b></div>
          <div class="metric metric-due"><span></span><b></b></div>
        </div>
        <div class="tenant-card-footer">
          <button class="text-link-btn edit-tenant-button" type="button"></button>
          <button class="text-link-btn print-statement-button" type="button"></button>
          <button class="text-link-btn invite-tenant-button owner-only" type="button"></button>
          <button class="text-link-btn moveout-tenant-button owner-only" type="button"></button>
          <button class="text-link-btn details-tenant-button owner-only" type="button"></button>
        </div>
      `;
      card.querySelector(".tenant-id").insertBefore(avatarChip(tenant.name, 38), card.querySelector(".tenant-id-text"));
      const trashBtn = card.querySelector(".delete-tenant-button");
      trashBtn.setAttribute("aria-label", tr("Delete tenant"));
      trashBtn.appendChild(lucide("trash", { size: 17, color: "var(--label-muted)" }));
      const metricLabels = card.querySelectorAll(".metric span");
      metricLabels[0].textContent = `✓ ${tr("Paid")}`;
      metricLabels[1].textContent = tr("Advance");
      metricLabels[2].textContent = tr("Due");
      card.querySelector(".edit-tenant-button").textContent = tr("Edit");
      card.querySelector(".print-statement-button").textContent = tr("Statement");
      card.querySelector(".invite-tenant-button").textContent = tr("Invite");
      card.querySelector(".invite-tenant-button").dataset.tenantId = tenant.id;
      const detailsBtn = card.querySelector(".details-tenant-button");
      detailsBtn.textContent = tr("Details");
      detailsBtn.dataset.tenantId = tenant.id;
      if (sessionMode === "owner") {
        const linkLine = tenantLinkLine(tenant);
        if (linkLine) card.querySelector(".tenant-id-text").append(linkLine);
      }
      const moveBtn = card.querySelector(".moveout-tenant-button");
      moveBtn.textContent = tr("Move out");
      moveBtn.dataset.tenantId = tenant.id;
      moveBtn.classList.toggle("hidden", tenant.active === false);
      card.querySelector(".invite-tenant-button").classList.toggle("hidden", tenant.active === false);
      card.querySelector("strong").textContent = tenant.name;
      const unitSpan = card.querySelector(".tenant-unit-line");
      const coeffLabel = tenant.coefficient > 0 ? ` · ${tenant.coefficient}/1000` : "";
      const breakerLabel = tenant.breakerAmps > 0 ? ` · ${tenant.breakerAmps}A` : "";
      unitSpan.textContent = `${tr("Unit {unit}", { unit: tenant.unit })}${coeffLabel}${breakerLabel}${tenant.phone ? "" : ` · ${tr("no phone")}`}`;
      if (tenant.movedOutOn) card.querySelector(".tenant-id-text").append(mk("span", { className: "tenant-moved-line", text: tr("Moved out {date}", { date: formatDateLabel(tenant.movedOutOn) }) }));
      const metrics = card.querySelectorAll(".metric b");
      metrics[0].textContent = formatMonthly(totals.paidUsd);
      metrics[1].textContent = formatUsd(totals.advanceUsd);
      metrics[2].textContent = formatMonthly(totals.dueUsd);
      if (totals.dueUsd > 0.005) card.querySelector(".metric-due").classList.add("has-due");
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

function formatCoveredMonths(entries) {
  const months = entries.map((entry) => entry.forMonth).filter(Boolean).sort();
  if (!months.length) return "";
  if (months.length === 1) return formatMonth(months[0]);
  return `${formatMonth(months[0])} - ${formatMonth(months.at(-1))}`;
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
        ...(data.transaction.method ? [["Paid by", methodLabel(data.transaction.method)]] : []),
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
  const text = String(value ?? "")
    .replace(/[\u2013\u2014\u2212]/g, "-")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2026/g, "...")
    .replace(/\u00B7/g, "-")
    .replace(/[\u0000-\u001F\u007F\u00A0]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  // Accented Latin (é, à…) becomes plain letters Helvetica can draw. Any other
  // script (Arabic names, descriptions, labels) is kept and drawn as an image
  // by pdfTextCommand.
  const latin = text.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
  return /^[\x20-\x7E]*$/.test(latin) ? latin : text;
}

// ── Non-English text in PDFs ─────────────────────────────────────────────────
// The PDF engine only has the built-in Helvetica font, which has no Arabic
// glyphs. Text that isn't plain ASCII is drawn by the browser instead (which
// joins Arabic letters and orders right-to-left text correctly) onto a canvas,
// and embedded as a JPEG. English stays real, selectable PDF text.
const PDF_TEXT_SCALE = 4; // canvas pixels per PDF point: sharp when printed
let pdfTextImages = [];   // filled while drawing, consumed by the PDF builders
let pdfTextImageCache = new Map();

function pdfNeedsImage(text) {
  return /[^\x20-\x7E]/.test(text);
}

function pdfTextImageCommand(text, x, y, size, bold, style = null) {
  const background = style?.bg || "#ffffff";
  const ink = style?.color || "#111111";
  const key = `${bold ? 1 : 0}|${size}|${background}|${ink}|${text}`;
  let img = pdfTextImageCache.get(key);
  if (!img) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const px = size * PDF_TEXT_SCALE;
    const font = `${bold ? 700 : 400} ${px}px Tahoma, "Segoe UI", "Noto Sans Arabic", "Noto Naskh Arabic", Arial, sans-serif`;
    const rtl = /[\u0590-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]/.test(text);
    ctx.font = font;
    // Arabic sits lower and reaches deeper than Latin; leave room for both.
    const ascent = Math.ceil(px * 0.95);
    const descent = Math.ceil(px * 0.45);
    const width = Math.max(1, Math.ceil(ctx.measureText(text).width) + 2);
    const height = ascent + descent;
    canvas.width = width;
    canvas.height = height;
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);
    ctx.font = font;
    ctx.fillStyle = ink;
    ctx.textBaseline = "alphabetic";
    ctx.direction = rtl ? "rtl" : "ltr";
    ctx.textAlign = rtl ? "right" : "left";
    ctx.fillText(text, rtl ? width - 1 : 1, ascent);
    const binary = atob(canvas.toDataURL("image/jpeg", 0.92).split(",")[1] || "");
    let hex = "";
    for (let i = 0; i < binary.length; i += 1) hex += binary.charCodeAt(i).toString(16).padStart(2, "0");
    img = { name: `Tx${pdfTextImages.length + 1}`, width, height, ascent, hex };
    pdfTextImages.push(img);
    pdfTextImageCache.set(key, img);
  }
  const w = (img.width / PDF_TEXT_SCALE).toFixed(2);
  const h = (img.height / PDF_TEXT_SCALE).toFixed(2);
  const bottom = (y - (img.height - img.ascent) / PDF_TEXT_SCALE).toFixed(2);
  return `q ${w} 0 0 ${h} ${x} ${bottom} cm /${img.name} Do Q`;
}

// Hands the images drawn so far to a PDF builder and starts afresh.
function takePdfTextImages() {
  const images = pdfTextImages;
  pdfTextImages = [];
  pdfTextImageCache = new Map();
  return images;
}

// Text images have a white background, so draw them first: the table lines
// and boxes drawn afterwards then stay visible on top of them.
function pdfImagesFirst(content) {
  const lines = content.split("\n");
  const isImage = (line) => /^q .* \/Tx\d+ Do Q$/.test(line);
  const isFill = (line) => /^q [\d.]+ [\d.]+ [\d.]+ rg [-\d. ]+ re f Q$/.test(line);
  return [
    ...lines.filter(isFill),
    ...lines.filter(isImage),
    ...lines.filter((line) => !isImage(line) && !isFill(line)),
  ].join("\n");
}

function pdfImageObject(img) {
  // ASCIIHex keeps the whole file ASCII, so string lengths stay byte offsets.
  const data = `${img.hex}>`;
  return `<< /Type /XObject /Subtype /Image /Width ${img.width} /Height ${img.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter [/ASCIIHexDecode /DCTDecode] /Length ${data.length} >>\nstream\n${data}\nendstream`;
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
    lineCommands.push(pdfTextCommand(line.text, 50, y, size, line.bold));
    y -= size + 6;
  });
  const content = `${lineCommands.join("\n")}\n`;
  return buildPdfDocument(content);
}

function buildPdfDocument(rawContent) {
  const images = takePdfTextImages();
  const content = pdfImagesFirst(rawContent);
  // Image objects follow the six fixed objects: 7, 8, …
  const xobjects = images.length ? ` /XObject << ${images.map((img, i) => `/${img.name} ${7 + i} 0 R`).join(" ")} >>` : "";
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >>${xobjects} >> /Contents 6 0 R >>`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
    `<< /Length ${content.length} >>\nstream\n${content}endstream`,
    ...images.map(pdfImageObject),
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
  // Text images are shared by every page (a label like "Paid" is drawn once).
  const images = takePdfTextImages();
  const firstImageObj = objects.length + 1; // 5, 6, …
  images.forEach((img) => objects.push(pdfImageObject(img)));
  const xobjects = images.length ? ` /XObject << ${images.map((img, i) => `/${img.name} ${firstImageObj + i} 0 R`).join(" ")} >>` : "";
  pageContents.forEach((rawContent) => {
    const content = pdfImagesFirst(rawContent);
    const contentObjNum = objects.length + 1;
    objects.push(`<< /Length ${content.length} >>\nstream\n${content}endstream`);
    const pageObjNum = objects.length + 1;
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R /F2 4 0 R >>${xobjects} >> /Contents ${contentObjNum} 0 R >>`,
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

// style (optional): { color: "#rrggbb", bg: "#rrggbb" } — bg is the colour the
// text sits on, so text drawn as an image blends into a filled box.
function pdfTextCommand(text, x, y, size = 10, bold = false, style = null) {
  // Labels are written in English in the builders; in Arabic, exact labels
  // ("Monthly Dues", "Paid", …) translate here. Data (names, amounts) has no
  // dictionary entry and passes through unchanged.
  const shown = pdfSafeText(currentLang === "ar" ? tr(String(text ?? "")) : text);
  if (pdfNeedsImage(shown)) return pdfTextImageCommand(shown, x, y, size, bold, style);
  const op = `BT /${bold ? "F2" : "F1"} ${size} Tf ${x} ${y} Td (${pdfEscape(shown)}) Tj ET`;
  return style?.color ? `q ${pdfColor(style.color)} rg ${op} Q` : op;
}

function pdfColor(hex) {
  const n = parseInt(String(hex).replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => (v / 255).toFixed(3)).join(" ");
}

// Filled boxes are moved in front of everything else (see pdfImagesFirst), so
// text and lines always land on top of them.
function pdfFillRect(x, y, width, height, hex) {
  return `q ${pdfColor(hex)} rg ${x} ${y} ${width} ${height} re f Q`;
}

// Helvetica advance widths (per 1pt of font size), for right-aligning text.
const HELVETICA_WIDTHS = {
  regular: "a556b556c500d556e556f278g556h556i222j222k500l222m833n556o556p556q556r333s500t278u556v500w722x500y500z500A667B667C722D722E667F611G778H722I278J500K667L556M833N722O778P667Q778R722S667T611U722V667W944X667Y667Z611",
  bold: "a556b611c556d611e556f333g611h611i278j278k556l278m889n611o611p611q611r389s556t333u611v556w778x556y556z500A722B722C722D722E667F611G778H722I278J556K722L611M833N722O778P667Q778R722S667T611U722V667W944X667Y667Z611",
};
const HELVETICA_TABLES = {};
function pdfTextWidth(text, size, bold = false) {
  const kind = bold ? "bold" : "regular";
  if (!HELVETICA_TABLES[kind]) {
    const table = { ",": 278, ".": 278, " ": 278, "-": 333, "+": 584, "$": 556, "%": 889, "/": 278, "(": 333, ")": 333, ":": 278 };
    for (const [, ch, w] of HELVETICA_WIDTHS[kind].matchAll(/([A-Za-z])(\d{3})/g)) table[ch] = Number(w);
    HELVETICA_TABLES[kind] = table;
  }
  const table = HELVETICA_TABLES[kind];
  return [...String(text)].reduce((w, ch) => w + (table[ch] ?? 556), 0) * size / 1000;
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
  commands.push(pdfTextCommand(tr("{name} | Unit {unit}", { name: data.tenant.name, unit: data.tenant.unit }), left, y - 48, 11));
  commands.push(pdfTextCommand(tr("Receipt: {no}", { no: data.receiptNo }), 380, y, 10));
  commands.push(pdfTextCommand(tr("Date: {date}", { date: data.transaction.date || localDateInput() }), 380, y - 16, 10));
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
      commands.push(pdfTextCommand(tr("{name} | Unit {unit}", { name: tenant.name, unit: tenant.unit }), left, y - 48, 11));
      commands.push(pdfTextCommand(tr("Date: {date}", { date: localDateInput() }), 380, y, 10));
      commands.push(pdfTextCommand(`App: ${APP_VERSION}`, 380, y - 16, 9));
      commands.push(pdfLineCommand(left, y - 64, right, y - 64));
      y = TOP - 92;
    } else {
      commands.push(pdfTextCommand(tr("{name} | Unit {unit} - statement (continued)", { name: tenant.name, unit: tenant.unit }), left, y, 10, true));
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
    // y marks the TOP of the summary block; each box hangs below its top edge
    // (rects are drawn from the bottom-left, so subtract the box height).
    const boxTop = y - row * (boxHeight + 8);
    const by = boxTop - boxHeight;
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
    { heading: "Outstanding USD", width: 80 },
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
      option.textContent = category === "All" ? tr("All Categories") : tr(category);
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
        option.textContent = cat === "All" ? tr("All Categories") : tr(cat);
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
  els.dateRangeInputs.classList.add("hidden");
  els.toggleDateFilter.setAttribute("aria-expanded", "false");
  els.toggleDateFilter.classList.remove("is-active");
  renderLedger();
}

function renderLedger() {
  renderLedgerFilters();
  const rows = getFilteredLedgerRows();
  const total = state.transactions.length;

  const anyActive = isAnyLedgerFilterActive();
  els.ledgerFilterStatus.classList.toggle("hidden", !anyActive);
  if (anyActive) {
    els.ledgerCount.textContent = tr("Showing {n} of {total} transactions", { n: rows.length, total });
  }

  if (!rows.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = tr("No matching transactions");
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
      <div class="ledger-row-main">
        <span class="ledger-dot"></span>
        <div class="ledger-text">
          <strong></strong>
          <span class="ledger-subtitle"></span>
        </div>
        <strong class="ledger-amount tnum"></strong>
      </div>
      <div class="ledger-expand">
        <div class="ledger-action-group"></div>
      </div>
    `;
    // Income = green dot, expense/outflow = muddy-red dot.
    if (amountValue < 0) item.querySelector(".ledger-dot").classList.add("is-out");
    const title = transaction.tenantId ? tenantName(transaction.tenantId) : transaction.description;
    item.querySelector("strong").textContent = title || tr(transaction.category);
    item.querySelector(".ledger-subtitle").textContent = [
      dateStr ? formatDateLabel(dateStr) : "",
      tr(transaction.category),
      transaction.expenseCategory ? tr(transaction.expenseCategory) : "",
      transaction.forMonth ? tr("Month: {month}", { month: formatMonth(transaction.forMonth) }) : "",
    ].filter(Boolean).join(" · ");

    const detailItems = [
      transaction.supplier ? tr("Supplier: {v}", { v: transaction.supplier }) : "",
      transaction.project ? tr("Project: {v}", { v: transaction.project }) : "",
      transaction.invoice ? tr("Invoice: {v}", { v: transaction.invoice }) : "",
      receiptReference ? tr("Receipt: {v}", { v: receiptReference }) : "",
      transaction.method ? tr("Paid by {v}", { v: methodLabel(transaction.method) }) : "",
      transaction.paidFrom === "bank" ? tr("Paid from the bank") : "",
      transaction.invoiceAttachment?.fileName ? tr("Attachment: {v}", { v: transaction.invoiceAttachment.fileName }) : "",
    ].filter(Boolean);
    const expand = item.querySelector(".ledger-expand");
    const actionGroup = item.querySelector(".ledger-action-group");
    if (detailItems.length) {
      const details = document.createElement("div");
      details.className = "ledger-details";
      detailItems.forEach((text) => {
        const p = document.createElement("p");
        p.textContent = text;
        details.append(p);
      });
      expand.insertBefore(details, actionGroup);
    }

    const amount = item.querySelector(".ledger-amount");
    amount.textContent = `${amountValue >= 0 ? "+" : ""}${formatUsd(amountValue)}`;
    amount.classList.toggle("positive", amountValue >= 0);
    amount.classList.toggle("negative", amountValue < 0);
    if (isReceiptablePayment(transaction)) {
      const btn = document.createElement("button");
      btn.className = "ledger-action-btn receipt-button";
      btn.type = "button";
      btn.dataset.transactionId = transaction.id;
      btn.textContent = tr("Receipt");
      actionGroup.append(btn);
    }
    if (((transaction.category === "Expenses" && !transaction.serviceType) || transaction.category === "Payments") && sessionMode === "owner") {
      const btn = document.createElement("button");
      btn.className = "ledger-action-btn edit-expense-button";
      btn.type = "button";
      btn.dataset.transactionId = transaction.id;
      btn.textContent = tr("Edit");
      actionGroup.append(btn);
    }
    if (hasInvoicePhoto(transaction.invoiceAttachment)) {
      const link = document.createElement("button");
      link.className = "ledger-action-btn attachment-button";
      link.type = "button";
      link.addEventListener("click", (e) => { e.stopPropagation(); openInvoicePhoto(transaction.invoiceAttachment); });
      link.textContent = tr("Invoice");
      actionGroup.append(link);
    }
    if (sessionMode === "owner") {
      const delBtn = document.createElement("button");
      delBtn.className = "ledger-action-btn delete-transaction-button danger-action";
      delBtn.type = "button";
      delBtn.dataset.transactionId = transaction.id;
      delBtn.textContent = tr("Delete");
      actionGroup.append(delBtn);
    }
    return item;
  }

  // Group the (date-descending) rows under small month headers for scanning.
  const items = [];
  let lastMonthKey = null;
  rows.slice(0, 160).forEach((transaction) => {
    const mk = monthKey(transaction.date || transaction.forMonth || "");
    if (mk && mk !== lastMonthKey) {
      lastMonthKey = mk;
      const header = document.createElement("div");
      header.className = "ledger-month-header";
      header.textContent = formatMonth(mk);
      items.push(header);
    }
    items.push(buildLedgerItem(transaction));
  });
  els.ledgerList.replaceChildren(...items);
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
    empty.textContent = tr("No categories saved yet");
    els.expenseCategoryDropdown.replaceChildren(empty);
    els.expenseCategoryDropdownButton.disabled = true;
    return;
  }
  els.expenseCategoryDropdownButton.disabled = false;
  if (!categories.length) {
    const empty = document.createElement("div");
    empty.className = "supplier-dropdown-empty";
    empty.textContent = tr("No matching categories");
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
    empty.textContent = tr("No polls yet. Tap \"+ New Poll\" to start one.");
    els.pollList.replaceChildren(empty);
    return;
  }
  els.pollList.replaceChildren(...polls.map(buildPollCard));
}

function buildPollCard(poll) {
  const activeTenants = state.tenants.filter((t) => t.active !== false);
  const allVoterIds = ["owner", ...activeTenants.map((t) => t.id)];
  const votes = poll.votes || {};
  const tally = pollTally(poll);
  const shareMode = tally.mode === "share";
  const yesCount = tally.yes;
  const noCount = tally.no;
  const abstainCount = tally.abstain;
  const totalVoters = tally.total;
  const voterIds = shareMode ? activeTenants.map((t) => t.id) : allVoterIds;
  const pending = voterIds.filter((id) => !votes[id]);

  const myId = sessionMode === "owner" ? "owner" : sessionTenantId;
  const myVote = votes[myId];
  const isOpen = pollIsOpen(poll);
  const isOwner = sessionMode === "owner";
  const creatorName = poll.createdBy === "owner" ? tr("Owner") : tenantName(poll.createdBy);

  const card = document.createElement("article");
  card.className = "poll-card";

  const header = document.createElement("div");
  header.className = "poll-card-header";
  const titleEl = document.createElement("h3");
  titleEl.className = "poll-card-title";
  titleEl.textContent = poll.title;
  const badge = document.createElement("span");
  badge.className = `poll-status-badge ${isOpen ? "open" : "closed"}`;
  badge.textContent = isOpen ? tr("Open") : tr("Closed");
  header.append(titleEl, badge);
  card.append(header);

  const meta = document.createElement("p");
  meta.className = "poll-meta";
  meta.textContent = tr("By {name} · {date}", { name: creatorName, date: poll.createdAt ? formatDateLabel(poll.createdAt.slice(0, 10)) : "" });
  card.append(meta);

  if (poll.description) {
    const desc = document.createElement("p");
    desc.className = "poll-desc";
    desc.textContent = poll.description;
    card.append(desc);
  }

  const tallyEl = document.createElement("div");
  tallyEl.className = "poll-tally";
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
  const shown = (n) => (shareMode ? `${n}/${totalVoters}` : n);
  yesLbl.textContent = tr("YES {n}", { n: shown(yesCount) });
  const abstainLbl = document.createElement("span");
  abstainLbl.className = "ptl-abstain";
  abstainLbl.textContent = tr("ABSTAIN {n}", { n: shown(abstainCount) });
  const noLbl = document.createElement("span");
  noLbl.className = "ptl-no";
  noLbl.textContent = tr("NO {n}", { n: shown(noCount) });
  const pendingLbl = document.createElement("span");
  pendingLbl.className = "ptl-pending";
  pendingLbl.textContent = tr("{n} pending", { n: pending.length });
  labels.append(yesLbl, abstainLbl, noLbl, pendingLbl);
  tallyEl.append(labels, track);
  card.append(tallyEl);
  pollSummaryLines(poll).forEach((line) => {
    const p = document.createElement("p");
    p.className = "poll-meta";
    p.textContent = line;
    card.append(p);
  });

  const resultList = document.createElement("ul");
  resultList.className = "poll-result-list";
  voterIds.forEach((voterId) => {
    const voterVote = votes[voterId];
    const coefficient = activeTenants.find((t) => t.id === voterId)?.coefficient || 0;
    const voterName = voterId === "owner" ? tr("Owner") : `${tenantName(voterId)}${shareMode ? ` (${coefficient}/1000)` : ""}`;
    const li = document.createElement("li");
    li.className = "poll-result-row";
    const nameEl = document.createElement("span");
    nameEl.className = "prr-name";
    nameEl.textContent = voterName;
    const voteEl = document.createElement("span");
    voteEl.className = `prr-vote ${voterVote || "pending"}`;
    voteEl.textContent = voterVote ? tr(voterVote.toUpperCase()) : "—";
    li.append(nameEl, voteEl);
    resultList.append(li);
  });
  card.append(resultList);

  if (isOpen && !(shareMode && myId === "owner")) {
    const voteRow = document.createElement("div");
    voteRow.className = "poll-vote-row";
    const yesBtn = document.createElement("button");
    yesBtn.type = "button";
    yesBtn.className = `vote-btn vote-yes${myVote === "yes" ? " selected" : ""}`;
    yesBtn.dataset.pollId = poll.id;
    yesBtn.dataset.vote = "yes";
    yesBtn.textContent = myVote === "yes" ? tr("✓ YES") : tr("Vote YES");
    const abstainBtn = document.createElement("button");
    abstainBtn.type = "button";
    abstainBtn.className = `vote-btn vote-abstain${myVote === "abstain" ? " selected" : ""}`;
    abstainBtn.dataset.pollId = poll.id;
    abstainBtn.dataset.vote = "abstain";
    abstainBtn.textContent = myVote === "abstain" ? tr("✓ Abstain") : tr("Abstain");
    const noBtn = document.createElement("button");
    noBtn.type = "button";
    noBtn.className = `vote-btn vote-no${myVote === "no" ? " selected" : ""}`;
    noBtn.dataset.pollId = poll.id;
    noBtn.dataset.vote = "no";
    noBtn.textContent = myVote === "no" ? tr("✓ NO") : tr("Vote NO");
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
      closeBtn.textContent = tr("Close Poll");
      actRow.append(closeBtn);
    }
    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.className = "danger-button poll-delete-btn";
    delBtn.dataset.pollId = poll.id;
    delBtn.textContent = tr("Delete");
    actRow.append(delBtn);
    card.append(actRow);
  }

  return card;
}

function openCreatePollDialog() {
  els.pollTitleInput.value = "";
  els.pollDescInput.value = "";
  if (els.pollWeightingInput) els.pollWeightingInput.value = "unit";
  if (els.pollClosesInput) els.pollClosesInput.value = "";
  if (els.pollQuorumInput) els.pollQuorumInput.value = "";
  openDialog(els.pollDialog);
  setTimeout(() => els.pollTitleInput.focus(), 50);
}

function castVote(pollId, vote) {
  const poll = (state.polls || []).find((p) => p.id === pollId);
  if (!poll || !pollIsOpen(poll)) return;
  const myId = sessionMode === "owner" ? "owner" : sessionTenantId;
  if (!myId) return;
  if (isTenantSession()) {
    poll.votes[myId] = vote; // show it straight away; the server copy follows
    renderPolls();
    supabaseRequest("rpc/cast_my_vote", { method: "POST", body: JSON.stringify({ p_poll_id: pollId, p_vote: vote }) })
      .then(() => syncFromSheet({ silent: true }))
      .catch((error) => showToast(describeSyncProblem(error), 6000));
    showToast(tr("Voted {vote}", { vote: vote.toUpperCase() }));
    return;
  }
  poll.votes[myId] = vote;
  saveState();
  renderPolls();
  showToast(tr("Voted {vote}", { vote: vote.toUpperCase() }));
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
  if (!window.confirm(tr("Delete this poll? This cannot be undone."))) return;
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
    ? tr("Tenants pay a fixed monthly amount (split by coefficient when set). Anything collected beyond expenses builds the reserve fund.")
    : tr("Each month's recorded expenses are split among tenants (by coefficient when set). No fixed monthly amount.");
}

function renderSettings() {
  els.appVersionLabel.textContent = APP_VERSION;
  if (els.appVersionLabelMore) els.appVersionLabelMore.textContent = APP_VERSION;
  if (els.languageInput) els.languageInput.value = normalizeLang(state.settings.language);
  els.buildingNameInput.value = (state.building && state.building.name) || "";
  els.defaultDueInput.value = amountInputValue(state.settings.defaultDueUsd);
  els.conversionRateInput.value = Number(state.settings.lbpPerUsd || DEFAULT_LBP_PER_USD);
  // Cloud config is built in (src/cloud-config.js); these inputs only exist in
  // builds without it, so every access is optional.
  if (els.invoiceUploadUrlInput) els.invoiceUploadUrlInput.value = state.settings.invoiceUploadUrl || "";
  if (els.supabaseUrlInput) els.supabaseUrlInput.value = state.settings.supabaseUrl || "";
  if (els.supabaseAnonKeyInput) els.supabaseAnonKeyInput.value = state.settings.supabaseAnonKey || "";
  if (els.cloudSpreadsheetIdInput) els.cloudSpreadsheetIdInput.value = state.settings.cloudSpreadsheetId || "";
  if (els.invoiceUploadFolderIdInput) els.invoiceUploadFolderIdInput.value = state.settings.invoiceUploadFolderId || "";
  if (els.syncSecretInput) els.syncSecretInput.value = state.settings.syncSecret || "";
  els.shareAccessAction = els.shareAccessAction || document.querySelector("#shareAccessAction");
  if (els.shareAccessAction) els.shareAccessAction.classList.toggle("hidden", !hasCloudConfig());
  els.collectionModeInput.value = state.settings.collectionMode || "actual";
  applyCollectionModeVisibility(els.collectionModeInput.value);
  els.ownerPasswordInput.value = "";
  els.ownerPasswordInput.placeholder = state.settings.ownerPasswordHash
    ? t("set.ownerPasswordSetPh")
    : t("set.ownerPasswordPh");
  els.removeOwnerPasswordButton.classList.toggle("hidden", !state.settings.ownerPasswordHash);
  renderOwnerAccount();
  const coeffSum = state.tenants.reduce((sum, t) => sum + (t.coefficient || 0), 0);
  const tenantsWithCoeff = state.tenants.filter((t) => t.coefficient > 0).length;
  if (tenantsWithCoeff > 0) {
    const ok = coeffSum === 1000;
    els.coefficientStatus.textContent = ok
      ? tr("Coefficients: {sum}/1000 — all tenants accounted for.", { sum: coeffSum })
      : tr("Coefficients: {sum}/1000 — must total 1000. {rest}", { sum: coeffSum, rest: 1000 - coeffSum > 0 ? tr("{n} remaining.", { n: 1000 - coeffSum }) : tr("{n} over.", { n: coeffSum - 1000 }) });
    els.coefficientStatus.className = ok ? "settings-note coeff-ok" : "settings-note coeff-warn";
  } else {
    els.coefficientStatus.textContent = tr("No coefficients set — all tenants use the same flat monthly amount.");
    els.coefficientStatus.className = "settings-note";
  }
  els.reloadSheetAction.classList.toggle("hidden", !hasCloudConfig());
  renderCloudStatus();
}

function renderAll() {
  // Keep the active language in sync with state (e.g. after a cloud reload / restore).
  const stateLang = normalizeLang(state.settings && state.settings.language);
  if (stateLang !== currentLang) applyLanguage(stateLang);
  else applyStaticI18n();
  els.buildingNameHeading.textContent = (state.building && state.building.name) || t("login.appName");
  renderDashboard();
  renderPayments();
  renderTenants();
  renderProjects();
  renderServices();
  renderLedger();
  renderPolls();
  renderDatalists();
  renderSettings();
  renderV148();
}

const MORE_VIEWS = ["moreView", "projectsView", "servicesView", "pollsView", "settingsView", "noticesView", "issuesView", "reportsView", "maintenanceView", "suppliersView", "documentsView", "meetingsView", "helpView"];

function setView(viewId) {
  if (sessionMode === "tenant" && ["settingsView", "reportsView", "maintenanceView", "suppliersView", "documentsView"].includes(viewId)) viewId = "moreView";
  els.views.forEach((view) => view.classList.toggle("active", view.id === viewId));
  // Re-run the enter animation each time a view is shown.
  const active = document.getElementById(viewId);
  if (active) { active.style.animation = "none"; void active.offsetWidth; active.style.animation = ""; }
  els.navButtons.forEach((button) => {
    if (button.id === "moreNavButton") button.classList.toggle("active", MORE_VIEWS.includes(viewId));
    else button.classList.toggle("active", button.dataset.view === viewId);
  });
  // Scroll back to top when switching views.
  window.scrollTo({ top: 0 });
}

// Inject a Lucide icon into each element carrying data-nav-icon (nav buttons,
// more-menu rows). Idempotent — skips ones already populated.
function renderNavIcons() {
  document.querySelectorAll("[data-nav-icon]").forEach((el) => {
    if (el.dataset.navIconDone) return;
    el.dataset.navIconDone = "1";
    const inMenu = el.classList.contains("more-menu-item");
    const icon = lucide(el.dataset.navIcon, { size: inMenu ? 22 : 22, color: inMenu ? "var(--avatar-text)" : "currentColor" });
    if (inMenu) {
      const chip = document.createElement("span");
      chip.className = "mm-icon";
      chip.appendChild(icon);
      el.insertBefore(chip, el.firstChild);
      const chev = lucide("chevronRight", { size: 19, color: "#b3bbb6", stroke: 2.2 });
      chev.classList.add("mm-chevron");
      el.appendChild(chev);
    } else {
      el.insertBefore(icon, el.firstChild);
    }
  });
  // Back buttons get a chevron (CSS mirrors it under RTL).
  document.querySelectorAll(".back-btn").forEach((el) => {
    if (el.dataset.navIconDone) return;
    el.dataset.navIconDone = "1";
    el.appendChild(lucide("chevronLeft", { size: 20, color: "var(--primary-dark)", stroke: 2.2 }));
  });
  // Entry-chooser rows: tinted icon chip + trailing chevron.
  document.querySelectorAll(".entry-chooser-btn[data-entry-icon]").forEach((el) => {
    if (el.dataset.navIconDone) return;
    el.dataset.navIconDone = "1";
    const chip = el.querySelector(".ec-icon");
    if (chip) chip.appendChild(lucide(el.dataset.entryIcon, { size: 22, color: "var(--avatar-text)" }));
    const chev = lucide("chevronRight", { size: 18, color: "#b3bbb6", stroke: 2.2 });
    chev.classList.add("ec-chevron");
    el.appendChild(chev);
  });
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
      creditOption.textContent = tr("Tenant has credit (prepaid)");
      debitOption.textContent = tr("Tenant owes (opening due)");
    } else {
      creditOption.textContent = tr("Cash on hand (add)");
      debitOption.textContent = tr("Cash shortfall (subtract)");
    }
  } else {
    creditOption.textContent = t("opt.received");
    debitOption.textContent = t("opt.appliedPaidOut");
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
  els.litresWrap?.classList.toggle("hidden", !serviceMode || waterMode || els.transactionServicePart.value === "maintenance");
  els.methodField?.classList.toggle("hidden", !tenantMode);
  els.paidFromField?.classList.toggle("hidden", !expenseLike);
  updateReadInvoiceButton();
  document.querySelector(".tenant-field").classList.toggle("hidden", !(tenantMode || openingMode));
  document.querySelector(".direction-field").classList.toggle("hidden", !(category === "Advance Payments" || openingMode));
  document.querySelector(".description-field").classList.toggle("hidden", tenantMode);
  document.querySelector(".month-field").classList.toggle("hidden", !(monthlyPaymentMode || serviceMode));
  document.querySelector(".extra-fields").classList.toggle("hidden", !expenseLike);
  document.querySelector(".expense-category-field").classList.toggle("hidden", !expenseMode);
  document.querySelector(".invoice-file-field").classList.toggle("hidden", !expenseLike);
  els.recurringExpenseRow.classList.toggle("hidden", !expenseMode || Boolean(editingExpenseId));
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
  syncCurrencyToggle();
}

function updateExpenseConversionPreview() {
  const cat = els.transactionCategory.value;
  if (cat !== "Expenses" && cat !== "Services Expenses") return;
  const { amountUsd, amountLbp } = readFormAmount();
  const rate = getConversionRate();
  if (amountLbp > 0) {
    els.expenseConversionPreview.textContent =
      tr("{lbp} = {usd} at {rate} LBP/USD", { lbp: formatLbp(amountLbp), usd: formatUsd(toUsd(amountUsd, amountLbp)), rate: numberFormat.format(rate) });
  } else {
    els.expenseConversionPreview.textContent = tr("{amount} balance impact", { amount: formatUsd(amountUsd) });
  }
}

function applyTransactionCategoryDefaults() {
  const category = els.transactionCategory.value;
  els.transactionAmount.value = "";
  els.transactionCurrency.value = "USD";
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
  els.invoiceFileSelectionStatus.textContent = file ? file.name : t("tx.noPhoto");
  updateReadInvoiceButton();
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

function readFormAmount() {
  // Single amount field + currency toggle → the USD/LBP split the rest of the app expects.
  const amount = Number(els.transactionAmount.value || 0);
  const isLbp = els.transactionCurrency.value === "LBP";
  return { amountUsd: isLbp ? 0 : amount, amountLbp: isLbp ? amount : 0 };
}

// Reflect the (hidden) currency select's value on the USD/LBP segmented toggle.
function syncCurrencyToggle() {
  if (!els.currencyToggle) return;
  const cur = els.transactionCurrency.value;
  els.currencyToggle.querySelectorAll("button").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.currency === cur);
  });
}

function setTransactionCurrency(cur) {
  els.transactionCurrency.value = cur === "LBP" ? "LBP" : "USD";
  syncCurrencyToggle();
  updateExpenseConversionPreview();
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
  const { amountUsd, amountLbp } = readFormAmount();
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
    ...(isServiceExpense && !isWater && servicePart !== "maintenance" && Number(els.transactionLitres?.value || 0) > 0
      ? { litres: Number(els.transactionLitres.value) } : {}),
    ...(tenantMode && els.transactionMethod ? { method: els.transactionMethod.value } : {}),
    ...(isExpenseLike && els.transactionPaidFrom ? { paidFrom: els.transactionPaidFrom.value } : {}),
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
    const shares = computeSharedExpenseShares(toUsd(amountUsd, amountLbp), "coefficient", els.transactionDate.value || null);
    baseTransaction.shares = Object.keys(shares).length ? shares : null;
  } else if (isWater) {
    baseTransaction.waterSplit = waterSplit;
    const shares = computeSharedExpenseShares(toUsd(amountUsd, amountLbp), waterSplit, els.transactionDate.value || null);
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

// Where an invoice photo can be viewed. `url` is used by Supabase Storage
// uploads; `driveUrl` is kept so photos uploaded to Google Drive before the
// migration still open.
function attachmentUrl(attachment) {
  return attachment?.url || attachment?.driveUrl || "";
}

// True for both kinds of photo: private Supabase files (storagePath) and old
// Google Drive links.
function hasInvoicePhoto(attachment) {
  return Boolean(attachment?.storagePath || attachmentUrl(attachment));
}

const SUPABASE_INVOICE_BUCKET = "invoices";

function base64ToBytes(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

// Upload the compressed JPEG straight into Supabase Storage. The bucket is
// public, so the returned URL can be stored and opened later like the old
// Drive link.
async function uploadInvoiceToSupabase(transaction, prepared) {
  const c = cloudConfig();
  const path = `${(transaction.date || localDateInput()).slice(0, 4)}/${randomToken()}-${prepared.fileName}`;
  await ensureFreshSession();
  const res = await fetch(
    `${c.supabaseUrl}/storage/v1/object/${SUPABASE_INVOICE_BUCKET}/${encodeURI(path)}`,
    {
      method: "POST",
      headers: {
        apikey: c.supabaseKey,
        Authorization: `Bearer ${authBearer()}`,
        "Content-Type": prepared.mimeType,
        "x-upsert": "false",
      },
      body: base64ToBytes(prepared.dataBase64),
    },
  );
  if (!res.ok) {
    let msg = `Invoice upload failed (${res.status})`;
    try { const j = await res.json(); msg = j.message || j.error || msg; } catch (_) {}
    throw new Error(msg);
  }
  return {
    fileName: prepared.fileName,
    mimeType: prepared.mimeType,
    size: prepared.size,
    storagePath: path,
    url: `${c.supabaseUrl}/storage/v1/object/public/${SUPABASE_INVOICE_BUCKET}/${encodeURI(path)}`,
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
  const prepared = await prepareInvoiceUpload(transaction, file);
  // Supabase Storage is the current home for invoice photos. The Google Drive
  // paths below remain only for buildings still on the legacy Sheet setup.
  if (cloudProvider() === "supabase") {
    return uploadInvoiceToSupabase(transaction, prepared);
  }
  const folderId = String(state.settings.invoiceUploadFolderId || "").trim();
  if (!folderId) {
    throw new Error("Set up the cloud database in Settings to attach invoice photos");
  }
  if (canUseServerInvoiceUpload()) {
    return uploadInvoiceThroughServer(transaction, prepared, folderId);
  }
  return uploadInvoiceThroughScript(transaction, prepared, folderId);
}

function cloudConfig() {
  return {
    scriptUrl: String(state.settings.invoiceUploadUrl || "").trim(),
    spreadsheetId: String(state.settings.cloudSpreadsheetId || "").trim(),
    // Built-in config wins; Settings values act as an override/escape hatch.
    supabaseUrl: String(EMBEDDED_CLOUD.supabaseUrl || state.settings.supabaseUrl || "").trim().replace(/\/+$/, ""),
    supabaseKey: String(EMBEDDED_CLOUD.supabaseAnonKey || state.settings.supabaseAnonKey || "").trim(),
  };
}

// Which cloud backend is active. Supabase (a real database) takes precedence
// over the legacy Google Sheet when both happen to be configured.
function cloudProvider() {
  const c = cloudConfig();
  if (c.supabaseUrl && c.supabaseKey) return "supabase";
  if (c.scriptUrl) return "sheet";
  return null;
}

function hasCloudConfig() {
  return cloudProvider() !== null;
}

// The whole app state lives in one row keyed by this id (one Supabase project
// per building). Multi-building support would make this per-building later.
const SUPABASE_STATE_ROW_ID = "building";

// ── Owner sign-in (Supabase Auth, Phase 2 step 5) ───────────────────────────
// The owner signs in once per device with their Supabase account. The session
// (access + refresh token) is kept in its own localStorage key, so later
// launches just press Enter. While it exists, every Supabase request carries it
// instead of the shared publishable key, so the database sees the owner rather
// than "anyone holding the key". Tokens never go into `state`, which is synced
// to the cloud and downloaded as backups.
const AUTH_KEY = "building-account-tracker:auth";
let authSession = loadAuthSession();
let refreshInFlight = null;
// Sign-in calls give up after this long, so a flaky connection shows an error
// instead of leaving the Enter button greyed out indefinitely.
const AUTH_TIMEOUT_MS = 15000;

function loadAuthSession() {
  try {
    const saved = JSON.parse(localStorage.getItem(AUTH_KEY) || "null");
    return saved?.refresh_token ? saved : null;
  } catch {
    return null;
  }
}

function saveAuthSession(session) {
  authSession = session;
  try {
    if (session) localStorage.setItem(AUTH_KEY, JSON.stringify(session));
    else localStorage.removeItem(AUTH_KEY);
  } catch { /* private mode: the session just won't survive a reload */ }
}

// Supabase accounts replace the device password whenever the cloud database is
// Supabase. Without it (fresh clone, local-only) the device password remains.
function usesOwnerAccounts() {
  return cloudProvider() === "supabase";
}

function sessionFromAuthResponse(body) {
  return {
    access_token: body.access_token,
    refresh_token: body.refresh_token,
    // expires_at is in seconds; fall back to expires_in when it's absent
    expires_at: Number(body.expires_at) || Math.floor(Date.now() / 1000) + Number(body.expires_in || 3600),
    email: body.user?.email || authSession?.email || "",
    user_id: body.user?.id || authSession?.user_id || "",
    // Carried across token refreshes; set explicitly on sign-in / linking.
    role: authSession?.role || "owner",
    tenantId: authSession?.tenantId || null,
  };
}

// Sessions saved before roles existed are owner sessions.
function isOwnerSession() {
  return Boolean(authSession) && authSession.role !== "tenant" && authSession.role !== "viewer";
}

function isTenantSession() {
  return Boolean(authSession) && authSession.role === "tenant" && Boolean(authSession.tenantId);
}

async function authRequest(path, body, token) {
  const c = cloudConfig();
  const res = await fetch(`${c.supabaseUrl}/auth/v1/${path}`, {
    method: "POST",
    headers: {
      apikey: c.supabaseKey,
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body || {}),
    signal: AbortSignal.timeout(AUTH_TIMEOUT_MS),
  });
  let json = null;
  try { json = await res.json(); } catch { /* empty body (logout) */ }
  return { ok: res.ok, status: res.status, body: json };
}

// Makes sure the access token has at least a minute left. A refresh token the
// server rejects means the sign-in is over: drop it and fall back to the shared
// key (still accepted until step 7). A network failure keeps the session for
// offline use; the caller's own request then fails the normal way.
async function ensureFreshSession({ force = false } = {}) {
  if (!authSession) return;
  const secondsLeft = authSession.expires_at - Math.floor(Date.now() / 1000);
  if (!force && secondsLeft > 60) return;
  refreshInFlight ||= (async () => {
    try {
      const r = await authRequest("token?grant_type=refresh_token", { refresh_token: authSession.refresh_token });
      if (r.ok && r.body?.access_token) {
        saveAuthSession(sessionFromAuthResponse(r.body));
      } else if (r.status >= 400 && r.status < 500) {
        saveAuthSession(null);
        renderOwnerAccount();
        // The login screen may already be showing "Signed in as …" (boot draws
        // it before syncing); swap it back to the email + password form.
        renderOwnerLoginForm();
        showToast("Your owner sign-in expired. Sign in again from the login screen.");
      }
    } catch {
      // offline — keep the session
    } finally {
      refreshInFlight = null;
    }
  })();
  await refreshInFlight;
}

function authBearer() {
  return authSession?.access_token || cloudConfig().supabaseKey;
}

async function signInOwner(email, password) {
  const r = await authRequest("token?grant_type=password", { email, password });
  if (!r.ok || !r.body?.access_token) {
    throw new Error(r.body?.error_code === "invalid_credentials"
      ? "Wrong email or password"
      : r.body?.msg || r.body?.error_description || `Sign-in failed (${r.status})`);
  }
  await adoptOwnerSession(sessionFromAuthResponse(r.body));
}

// ── Continue with Google (PKCE) ─────────────────────────────────────────────
// The browser goes app -> Supabase -> Google -> Supabase -> back to the app
// with a one-time ?code=. That code is useless on its own: it only becomes a
// session together with the secret "verifier" this device generated before
// leaving, so an intercepted code can't be replayed elsewhere. The verifier is
// kept in localStorage (not sessionStorage) because an installed phone app may
// come back from Google in a different window of the same browser.
const OAUTH_VERIFIER_KEY = "building-account-tracker:oauth-verifier";

function base64Url(bytes) {
  let binary = "";
  bytes.forEach((b) => { binary += String.fromCharCode(b); });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function startGoogleSignIn() {
  const verifier = base64Url(crypto.getRandomValues(new Uint8Array(32)));
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  localStorage.setItem(OAUTH_VERIFIER_KEY, verifier);
  const params = new URLSearchParams({
    provider: "google",
    redirect_to: `${location.origin}${location.pathname}`,
    code_challenge: base64Url(new Uint8Array(digest)),
    code_challenge_method: "s256",
  });
  location.assign(`${cloudConfig().supabaseUrl}/auth/v1/authorize?${params}`);
}

// Runs at boot. Does nothing unless this page load is the return from Google.
async function completeGoogleSignIn() {
  const query = new URLSearchParams(location.search);
  const hash = new URLSearchParams(location.hash.replace(/^#/, ""));
  const code = query.get("code");
  const failure = query.get("error_description") || query.get("error") || hash.get("error_description") || hash.get("error");
  if (!code && !failure) return;
  // Clear ?code= from the address bar and history straight away: it's single
  // use, and a reload must not try to spend it twice.
  history.replaceState(null, "", location.pathname);
  const verifier = localStorage.getItem(OAUTH_VERIFIER_KEY);
  localStorage.removeItem(OAUTH_VERIFIER_KEY);
  if (failure) {
    showLoginError(tr("Google sign-in was cancelled or failed: {reason}", { reason: failure }));
    return;
  }
  if (!verifier) {
    showLoginError("Google sign-in didn't finish on this device. Please try again.");
    return;
  }
  try {
    const r = await authRequest("token?grant_type=pkce", { auth_code: code, code_verifier: verifier });
    if (!r.ok || !r.body?.access_token) {
      throw new Error(r.body?.msg || r.body?.error_description || `Sign-in failed (${r.status})`);
    }
    await adoptOwnerSession(sessionFromAuthResponse(r.body));
    enterAsOwner();
  } catch (error) {
    const unreachable = error instanceof TypeError || error?.name === "TimeoutError" || error?.name === "AbortError";
    showLoginError(unreachable ? "Can't reach the cloud. Check your connection." : error.message);
  }
}

// Signing in proves who you are, not that you own the building, so every
// account must also pass is_owner() before its session is kept. Shared by the
// password and Google paths so they can never disagree.
async function adoptOwnerSession(session) {
  const c = cloudConfig();
  const call = (fn, body = {}) => fetch(`${c.supabaseUrl}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: { apikey: c.supabaseKey, Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(AUTH_TIMEOUT_MS),
  });
  // Arriving through an administrator invite link: accept it first.
  const invite = pendingAdminInvite();
  if (invite) {
    try { localStorage.removeItem(ADMIN_INVITE_KEY); } catch { /* ignore */ }
    const claim = await call("claim_admin_invite", { p_code: invite });
    if (!claim.ok) {
      let msg = "That invite could not be used";
      try { const j = await claim.json(); msg = j.message || msg; } catch { /* keep default */ }
      authRequest("logout", {}, session.access_token).catch(() => {});
      throw new Error(tr(msg));
    }
  }
  // owner (full) or viewer (sees everything, changes nothing). Before the
  // phase2f SQL, my_admin_role doesn't exist yet: fall back to is_owner.
  let role = null;
  const roleRes = await call("my_admin_role");
  if (roleRes.ok) role = await roleRes.json();
  else if (roleRes.status === 404) {
    const check = await call("is_owner");
    role = check.ok && (await check.json()) === true ? "owner" : null;
  }
  if (role !== "owner" && role !== "viewer") {
    authRequest("logout", {}, session.access_token).catch(() => {});
    // Name the account: with Google it's easy to have picked the wrong one.
    throw new Error(session.email
      ? tr("{email} is not the building owner's account", { email: session.email })
      : "This account is not the building owner");
  }
  saveAuthSession({ ...session, role, tenantId: null });
}

function signOutOwner() {
  const token = authSession?.access_token;
  saveAuthSession(null);
  if (token) authRequest("logout", {}, token).catch(() => {});
  showToast("Signed out");
  logout();
}

function renderOwnerAccount() {
  if (!els.ownerAccountAction) return;
  const show = usesOwnerAccounts() && isAdminSession() && sessionMode === "owner";
  els.ownerAccountAction.classList.toggle("hidden", !show);
  if (show) {
    els.ownerAccountText.textContent = tr("Signed in as {email}", { email: authSession.email })
      + (isViewerSession() ? ` · ${tr("view only")}` : "");
  }
}

async function supabaseRequest(path, options = {}, retried = false) {
  const c = cloudConfig();
  await ensureFreshSession();
  const res = await fetch(`${c.supabaseUrl}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: c.supabaseKey,
      Authorization: `Bearer ${authBearer()}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  // The token can expire between the freshness check and the server (clock
  // skew, a sleeping phone). Refresh once and retry.
  if (res.status === 401 && authSession && !retried) {
    await ensureFreshSession({ force: true });
    return supabaseRequest(path, options, true);
  }
  if (!res.ok) {
    let msg = `Cloud database error (${res.status})`;
    try { const j = await res.json(); msg = j.message || j.hint || j.error || msg; } catch (_) {}
    const error = new Error(msg);
    error.status = res.status;
    throw error;
  }
  return res;
}

// Provider-agnostic whole-state load. Returns the stored state object or null.
async function cloudLoadState() {
  if (cloudProvider() === "supabase") {
    // Tenants never read the raw document: the server returns a copy with
    // everything belonging to other tenants removed.
    if (isTenantSession()) {
      const res = await supabaseRequest("rpc/get_my_state", { method: "POST", body: "{}" });
      return await res.json();
    }
    const res = await supabaseRequest(
      `building_state?id=eq.${SUPABASE_STATE_ROW_ID}&select=state`,
      { method: "GET" },
    );
    const rows = await res.json();
    return Array.isArray(rows) && rows[0] ? rows[0].state : null;
  }
  const result = await postCloudAction("loadState");
  return result?.state || null;
}

// Provider-agnostic whole-state save (upsert for Supabase).
async function cloudSaveState(payload) {
  if (cloudProvider() === "supabase") {
    await supabaseRequest("building_state", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({
        id: SUPABASE_STATE_ROW_ID,
        state: payload,
        rev: Number(payload?.meta?.rev || 0),
        updated_at: new Date().toISOString(),
      }),
    });
    return;
  }
  await postCloudAction("saveState", { state: payload });
}

// Short human label for the active backend, used in status messages.
function cloudProviderLabel() {
  return cloudProvider() === "supabase" ? "cloud database" : "Google Sheet";
}

function renderCloudStatus(message = "") {
  if (!els.cloudSyncStatus) return;
  els.cloudSyncStatus.textContent =
    message ||
    (hasCloudConfig()
      ? `Cloud sync is on. Data is saved on this device and synced to the ${cloudProviderLabel()}.`
      : "Cloud sync is off. Add your Supabase project (or a Google Apps Script URL) in Settings to enable.");
}

const SYNC_CHIP_TEXT = { saving: "Saving…", saved: "Saved", error: "Sync error", offline: "Offline", local: "Local" };

// Why the last sync failed, in words the owner can act on. "Sync error" alone
// gave no clue whether to wait, sign in, or resume the database. Shown when the
// chip is tapped; cleared by the next successful sync.
let lastSyncProblem = "";

function describeSyncProblem(error) {
  if (navigator.onLine === false) {
    return "This device is offline. Your changes are kept here and sync when you're back online.";
  }
  if (error?.code === "empty-cloud") return error.message;
  const status = Number(error?.status || 0);
  if (status === 401 || status === 403) {
    return authSession
      ? "The cloud refused access. Sign out from Settings and sign in again with Google."
      : "Not signed in to the cloud. Open the login screen and sign in with Google to sync.";
  }
  if (status >= 500) return "The cloud database had an error. Tap the chip to try again in a minute.";
  // fetch() rejects with a TypeError when the host can't be reached at all — the
  // signature of a paused free-plan Supabase project (its address stops resolving).
  if (error instanceof TypeError || error?.name === "TimeoutError") {
    return "Can't reach the cloud database. If this lasts, it may be paused: resume it in the Supabase dashboard.";
  }
  return error?.message || "Sync failed.";
}

function reportSyncProblem(error) {
  lastSyncProblem = tr(describeSyncProblem(error));
  setSyncChip(navigator.onLine === false ? "offline" : "error");
}

// Header status chip reflecting cloud-sync state. "local" (no cloud configured)
// stays hidden via CSS so single-device users aren't shown a meaningless badge.
function setSyncChip(kind) {
  if (!els.syncChip) return;
  const state_ = hasCloudConfig() ? kind : "local";
  els.syncChip.classList.remove("is-saving", "is-saved", "is-error", "is-offline", "is-local");
  els.syncChip.classList.add(`is-${state_}`);
  els.syncChipText.textContent = SYNC_CHIP_TEXT[state_] || "";
  if (state_ === "saved") lastSyncProblem = "";
  els.syncChip.title = lastSyncProblem;
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
  if (!window.confirm(tr("Restore this backup ({summary})? It replaces the data on this device. Your current data will be downloaded first as a safety copy.", { summary }))) {
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

// Per record, the later edit wins (a tenant's new problem report and the
// owner's status change on another one both survive).
function mergeByStamp(olderArr, newerArr, deletedIds = [], stampKey = "updatedAt") {
  const map = new Map();
  [...(olderArr || []), ...(newerArr || [])].forEach((item) => {
    if (!item?.id) return;
    const prev = map.get(item.id);
    if (!prev || String(item[stampKey] || "") >= String(prev[stampKey] || "")) map.set(item.id, item);
  });
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
  const kinds = ["transactions", "tenants", "polls", "projects", "announcements", "issues", "cashChecks", "maintenanceTasks", "suppliers", "documents", "meetings"];
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
  merged.suppliers = mergeById(older.suppliers, newer.suppliers, merged.deleted.suppliers);
  merged.projects = mergeById(older.projects, newer.projects);
  merged.expenseCategories = mergeById(older.expenseCategories, newer.expenseCategories);
  merged.serviceReadings = mergeById(older.serviceReadings, newer.serviceReadings);
  merged.monthlyExpected = mergeByMonth(older.monthlyExpected, newer.monthlyExpected);
  merged.recurringExpenses = mergeById(older.recurringExpenses, newer.recurringExpenses);
  merged.auditLog = mergeById(older.auditLog, newer.auditLog).sort((a, b) => String(a.at).localeCompare(String(b.at))).slice(-AUDIT_LIMIT);
  merged.monthLocks = mergeByStamp(older.monthLocks, newer.monthLocks, [], "at");
  merged.cashChecks = mergeById(older.cashChecks, newer.cashChecks, merged.deleted.cashChecks);
  merged.announcements = mergeById(older.announcements, newer.announcements, merged.deleted.announcements);
  merged.issues = mergeByStamp(older.issues, newer.issues, merged.deleted.issues, "updatedAt");
  merged.generatorServices = mergeById(older.generatorServices, newer.generatorServices);
  merged.documents = mergeByStamp(older.documents, newer.documents, merged.deleted.documents, "updatedAt");
  merged.meetings = mergeByStamp(older.meetings, newer.meetings, merged.deleted.meetings, "updatedAt");
  merged.maintenanceTasks = mergeByStamp(older.maintenanceTasks, newer.maintenanceTasks, merged.deleted.maintenanceTasks, "updatedAt");
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

// Only the owner's signed-in session writes the whole document. Tenants write
// through narrow server functions; a phone with no session has no identity
// to write with (the shared key loses write access at step 7).
function canPushDocument() {
  if (!usesOwnerAccounts() || isOwnerSession()) return true;
  // Owner who entered with the device password: still tried with the shared
  // key, so nothing stops before step 7; after it, the server refuses and the
  // chip says to sign in with Google.
  return !authSession && sessionMode === "owner";
}

function queueCloudSave() {
  if (!hasCloudConfig()) return;
  if (!canPushDocument()) return;
  setSyncChip("saving");
  window.clearTimeout(cloudSaveTimer);
  cloudSaveTimer = window.setTimeout(() => saveCloudState({ silent: true }), 900);
}

async function saveCloudState({ silent = false } = {}) {
  if (cloudSaveInFlight) return;
  if (!canPushDocument()) {
    reportSyncProblem(Object.assign(new Error("not signed in"), { status: 401 }));
    if (!silent) showToast(lastSyncProblem, 6000);
    return;
  }
  window.clearTimeout(cloudSaveTimer);
  cloudSaveInFlight = true;
  setSyncChip("saving");
  try {
    if (!silent) renderCloudStatus(`Saving to the ${cloudProviderLabel()}…`);
    // Check whether another device wrote since this device last synced.
    const sync = loadSyncMeta();
    let remote = null;
    try {
      remote = await cloudLoadState();
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
    await cloudSaveState(state);
    saveSyncMeta({ lastSyncedToken: state.meta.token, lastPushedRev: Number(state.meta.rev || 0) });
    if (mergedForeignChanges) {
      populateTenantSelect();
      renderAll();
    }
    renderCloudStatus(`Cloud saved at ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`);
    setSyncChip("saved");
    if (!silent) showToast("Saved to the cloud");
  } catch (error) {
    reportSyncProblem(error);
    renderCloudStatus(lastSyncProblem);
    if (!silent) showToast(lastSyncProblem, 6000);
  } finally {
    cloudSaveInFlight = false;
  }
}

async function loadCloudState() {
  if (!window.confirm(tr("Reload from the cloud? This replaces the data on this device with the cloud copy. Any changes here that haven't synced yet will be lost."))) return;
  try {
    renderCloudStatus(`Loading from the ${cloudProviderLabel()}…`);
    const remote = await cloudLoadState();
    if (!remote) throw new Error("No app data found in the cloud database");
    // Second confirmation only when the cloud copy would destroy data. The
    // first prompt is generic; this one names the actual numbers, so "replace
    // 244 transactions with 0" can't be waved through by habit.
    if (remoteWouldWipeLocalData(remote)) {
      const localSummary = `${state.tenants.length} tenants, ${state.transactions.length} transactions`;
      if (!window.confirm(tr("The cloud copy is EMPTY. This device has {summary}. Replacing means losing all of it. Download a backup first if you are unsure. Continue anyway?", { summary: localSummary }))) {
        renderCloudStatus("Reload cancelled — this device's data was kept");
        setSyncChip("error");
        return;
      }
    }
    state = hydrateState(remote);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    saveSyncMeta({ lastSyncedToken: state.meta?.token || "", lastPushedRev: Number(state.meta?.rev || 0) });
    selectedMonth = null;
    populateTenantSelect();
    renderAll();
    renderCloudStatus("Loaded from the cloud");
    setSyncChip("saved");
    showToast("Loaded from the cloud");
  } catch (error) {
    reportSyncProblem(error);
    renderCloudStatus(lastSyncProblem);
    showToast(lastSyncProblem, 6000);
  }
}

// ── Coefficients: the building totals exactly 1000/1000 ─────────────────────
const COEFFICIENT_TOTAL = 1000;

// How much of the 1000 is still free, ignoring one tenant (the one being edited).
function coefficientRoom(tenants, excludeId = null) {
  const used = (tenants || [])
    .filter((t) => t.active !== false && t.id !== excludeId)
    .reduce((sum, t) => sum + Number(t.coefficient || 0), 0);
  return COEFFICIENT_TOTAL - used;
}

function coefficientTooHighMessage(room) {
  return room <= 0
    ? tr("The other tenants already use all 1000/1000. Lower someone else's coefficient first.")
    : tr("Only {room}/1000 is left for this tenant: the total can't go over 1000/1000.", { room });
}

function renderTenantCoefficientHint() {
  const room = coefficientRoom(state.tenants, editingTenantId);
  els.tenantCoefficientHint.textContent = tr("Available: {room} of 1000", { room: Math.max(0, room) });
  const entered = Number(els.tenantCoefficientInput.value || 0);
  els.tenantCoefficientHint.classList.toggle("is-over", entered > Math.max(0, room));
}

// ── WhatsApp ─────────────────────────────────────────────────────────────────
// wa.me needs the full international number. Lebanese numbers are usually saved
// the local way ("70 123 456", "03 123456"), which wa.me would read as another
// country, so local numbers get Lebanon's 961 code.
function whatsappPhone(raw) {
  const text = String(raw || "").trim();
  const digits = text.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("00")) return digits.slice(2);
  if (text.startsWith("+") || digits.startsWith("961")) return digits;
  return `961${digits.replace(/^0+/, "")}`;
}

// With a number this opens that person's chat. Without one, WhatsApp asks who
// to send it to — which is also how a message reaches the building group.
function whatsappLink(rawPhone, message) {
  return `https://wa.me/${whatsappPhone(rawPhone)}?text=${encodeURIComponent(message)}`;
}

// One message with every tenant's position, for the building's WhatsApp group.
function buildGroupBalancesMessage() {
  const tenants = state.tenants
    .filter((t) => t.active !== false)
    .slice()
    .sort((a, b) => String(a.unit || "").localeCompare(String(b.unit || ""), undefined, { numeric: true }));
  const lines = [tr("{building} — balances as of {date}", { building: state.building?.name || "", date: formatDateLabel(localDateInput()) }), ""];
  let totalDue = 0;
  tenants.forEach((t) => {
    const { dueUsd, advanceUsd } = getTenantTotals(t.id);
    totalDue += dueUsd;
    const status = dueUsd > 0.005
      ? tr("{amount} due", { amount: formatUsd(dueUsd) })
      : advanceUsd > 0.005
        ? tr("paid up ✓ (credit {amount})", { amount: formatUsd(advanceUsd) })
        : tr("paid up ✓");
    lines.push(`• ${tr("Unit {unit}", { unit: t.unit || "" })} – ${t.name}: ${status}`);
  });
  lines.push("", tr("Total outstanding: {amount}", { amount: formatUsd(roundUsd(totalDue)) }));
  return lines.join("\n");
}

function reminderMessage(tenant, amount, month) {
  return [
    tr("{building} – Payment Reminder", { building: state.building?.name || "" }),
    tr("Hi {name}, your outstanding balance{monthLine} is {amount}.", { name: tenant.name, monthLine: month ? tr(" as of the {month} statement", { month: formatMonth(month) }) : "", amount: formatUsd(amount) }),
    tr("Please settle at your earliest convenience. Thank you."),
  ].join("\n");
}

// Reminders count as "sent for this month" once any of them is opened, so the
// dashboard stops asking.
function markRemindersSent() {
  const month = currentMonthValue();
  if (state.settings.remindersSentMonth === month) return;
  state.settings.remindersSentMonth = month;
  saveState();
  renderAttention();
}

function openWhatsAppReminderDialog() {
  const lastMonth = getLastCompletedMonth();
  els.whatsappDialogTitle.textContent = tr("Payment Reminders – {month} Statement", { month: formatMonth(lastMonth) });
  const dueEntries = state.tenants
    .filter((t) => t.active !== false)
    .map((tenant) => ({ tenant, notification: getTenantStatementNotification(tenant.id) }))
    .filter(({ notification }) => notification !== null);
  const noNumber = dueEntries.filter(({ tenant }) => !whatsappPhone(tenant.phone));
  const note = !dueEntries.length
    ? tr("Everyone is up to date for the {month} statement.", { month: formatMonth(lastMonth) })
    : noNumber.length
      ? tr("{names}: no number saved, so WhatsApp will ask who to send it to.", { names: noNumber.map(({ tenant }) => tenant.name).join("، ") })
      : "";
  els.whatsappDialogNote.textContent = note;
  els.whatsappDialogNote.classList.toggle("hidden", !note);
  els.whatsappReminderList.replaceChildren(
    ...dueEntries.map(({ tenant, notification }) => {
      const { month, statementBalance, paidSince, remaining } = notification;
      const row = document.createElement("div");
      row.className = "whatsapp-reminder-row";
      const info = document.createElement("div");
      const name = document.createElement("strong");
      name.textContent = tenant.name;
      const detail = document.createElement("span");
      detail.textContent = paidSince > 0
        ? tr("Unit {unit} – {remaining} remaining (stmt {stmt}, paid {paid})", { unit: tenant.unit, remaining: formatUsd(remaining), stmt: formatUsd(statementBalance), paid: formatUsd(paidSince) })
        : tr("Unit {unit} – {amount} due ({month} statement)", { unit: tenant.unit, amount: formatUsd(remaining), month: formatMonth(month) });
      info.append(name, detail);
      const link = document.createElement("a");
      link.className = "mini-button whatsapp-btn";
      link.href = whatsappLink(tenant.phone, reminderMessage(tenant, remaining, month));
      link.target = "_blank";
      link.rel = "noopener";
      link.textContent = tr("Send");
      link.addEventListener("click", markRemindersSent);
      row.append(info, link);
      return row;
    }),
  );
  openDialog(els.whatsappDialog);
}

function postBalancesAsText() {
  window.open(whatsappLink("", buildGroupBalancesMessage()), "_blank", "noopener");
  markRemindersSent();
}

// Everyone's position, for the building's WhatsApp group: the numbers…
function groupBalancesData() {
  const rows = state.tenants
    .filter((t) => t.active !== false)
    .slice()
    .sort((a, b) => String(a.unit || "").localeCompare(String(b.unit || ""), undefined, { numeric: true }))
    .map((t) => {
      const { dueUsd, advanceUsd } = getTenantTotals(t.id);
      const status = dueUsd > 0.005 ? "due" : advanceUsd > 0.005 ? "credit" : "paid";
      return { unit: t.unit || "", name: t.name || "", status, dueUsd: roundUsd(dueUsd), creditUsd: status === "credit" ? roundUsd(advanceUsd) : 0 };
    });
  return {
    rows,
    totalDue: roundUsd(rows.reduce((s, r) => s + r.dueUsd, 0)),
    totalCredit: roundUsd(rows.reduce((s, r) => s + r.creditUsd, 0)),
    upToDate: rows.filter((r) => r.status !== "due").length,
  };
}

// …drawn as one picture (WhatsApp shows it inline in the chat): a header band,
// three summary cards, one colour-coded row per unit, the total and a footer.
// Arabic is laid out right-to-left. Returns the canvas.
function drawGroupBalancesCanvas() {
  const d = groupBalancesData();
  const rtl = currentLang === "ar";
  const C = {
    page: "#ffffff", green: "#163832", soft: "#cfe3db", white: "#ffffff", ink: "#14211f", muted: "#61706b",
    tint: "#eef4ef", zebra: "#f6f9f7", line: "#e4e9e4", red: "#a23b3b", redBg: "#f6dede",
    ok: "#0f513f", okBg: "#dcefe8", blue: "#315f9d", blueBg: "#e3ecf7",
  };
  const FONT = `Inter, "Segoe UI", Roboto, Tahoma, "Noto Sans Arabic", Arial, sans-serif`;
  const W = 1080;
  const PAD = 56;
  const HEADER = 250;
  const CARDS_TOP = HEADER + 44;
  const CARD_H = 150;
  const TABLE_TOP = CARDS_TOP + CARD_H + 52;
  const HEAD_H = 72;
  const ROW_H = 80;
  const rowsBottom = TABLE_TOP + HEAD_H + d.rows.length * ROW_H;
  const H = rowsBottom + 120 + 150;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  ctx.direction = rtl ? "rtl" : "ltr";
  // x is measured from the reading edge: the left in English, the right in Arabic.
  const X = (x) => (rtl ? W - x : x);
  const box = (x, y, w, h, color, radius = 0) => {
    ctx.fillStyle = color;
    const left = rtl ? W - x - w : x;
    ctx.beginPath();
    if (radius && typeof ctx.roundRect === "function") ctx.roundRect(left, y, w, h, radius);
    else ctx.rect(left, y, w, h);
    ctx.fill();
  };
  // max: width limit. fit: shrink the font to fit (cards); otherwise cut with "…".
  const text = (value, x, y, { size = 30, weight = 400, color = C.ink, align = "start", max = 0, fit = false } = {}) => {
    let shown = String(value ?? "");
    let px = size;
    ctx.font = `${weight} ${px}px ${FONT}`;
    while (fit && max && px > 18 && ctx.measureText(shown).width > max) {
      px -= 2;
      ctx.font = `${weight} ${px}px ${FONT}`;
    }
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = "alphabetic";
    if (max && ctx.measureText(shown).width > max) {
      while (shown.length > 1 && ctx.measureText(`${shown}…`).width > max) shown = shown.slice(0, -1);
      shown = `${shown.trimEnd()}…`;
    }
    ctx.fillText(shown, X(x), y);
    return ctx.measureText(shown).width;
  };

  box(0, 0, W, H, C.page);

  // Header
  box(0, 0, W, HEADER, C.green);
  text(state.building?.name || "", PAD, 82, { size: 34, weight: 700, color: C.soft });
  text(tr("Building balances"), PAD, 160, { size: 66, weight: 800, color: C.white });
  // Arabic month names with Western digits, so the date reads correctly right-to-left.
  const today = rtl
    ? new Date().toLocaleDateString("ar-LB-u-nu-latn", { day: "numeric", month: "long", year: "numeric" })
    : formatDateLabel(localDateInput());
  text(tr("As of {date}", { date: today }), PAD, 210, { size: 30, color: C.soft });

  // Summary cards
  const gap = 24;
  const cardW = (W - PAD * 2 - gap * 2) / 3;
  [
    [tr("Total outstanding"), formatUsd(d.totalDue), d.totalDue > 0.005 ? C.red : C.ok],
    [tr("Up to date"), tr("{n} of {total} units", { n: d.upToDate, total: d.rows.length }), C.ok],
    [tr("Tenant credit"), formatUsd(d.totalCredit), C.blue],
  ].forEach(([label, value, color], i) => {
    const x = PAD + i * (cardW + gap);
    box(x, CARDS_TOP, cardW, CARD_H, C.tint, 22);
    text(label, x + 28, CARDS_TOP + 58, { size: 26, color: C.muted, max: cardW - 56, fit: true });
    text(value, x + 28, CARDS_TOP + 116, { size: 44, weight: 800, color, max: cardW - 56, fit: true });
  });

  // Table
  const colUnit = PAD + 28;
  const colName = PAD + 170;
  const colStatus = PAD + 600;
  const colAmount = W - PAD - 28;
  box(PAD, TABLE_TOP, W - PAD * 2, HEAD_H, C.green, 18);
  const headY = TABLE_TOP + 46;
  text(tr("Unit"), colUnit, headY, { size: 26, weight: 700, color: C.white });
  text(tr("Tenant"), colName, headY, { size: 26, weight: 700, color: C.white });
  text(tr("Status"), colStatus, headY, { size: 26, weight: 700, color: C.white });
  text(tr("Amount"), colAmount, headY, { size: 26, weight: 700, color: C.white, align: "end" });

  const PILL = {
    due: [tr("Due"), C.redBg, C.red],
    credit: [tr("In credit"), C.blueBg, C.blue],
    paid: [tr("Paid up"), C.okBg, C.ok],
  };
  d.rows.forEach((row, i) => {
    const top = TABLE_TOP + HEAD_H + i * ROW_H;
    if (i % 2) box(PAD, top, W - PAD * 2, ROW_H, C.zebra);
    const baseY = top + 52;
    text(row.unit, colUnit, baseY, { size: 32, weight: 700, max: colName - colUnit - 20 });
    text(row.name, colName, baseY, { size: 32, max: colStatus - colName - 30 });
    const [label, pillBg, pillInk] = PILL[row.status];
    ctx.font = `700 24px ${FONT}`;
    const pillW = ctx.measureText(label).width + 40;
    box(colStatus - 4, top + 20, pillW, 42, pillBg, 21);
    text(label, colStatus + 16, top + 50, { size: 24, weight: 700, color: pillInk });
    const amount = row.status === "due" ? formatUsd(row.dueUsd) : row.status === "credit" ? `+${formatUsd(row.creditUsd)}` : formatUsd(0);
    text(amount, colAmount, baseY, { size: 32, weight: 800, color: row.status === "due" ? C.red : row.status === "credit" ? C.blue : C.ok, align: "end" });
  });

  // Total
  box(PAD, rowsBottom + 6, W - PAD * 2, 4, C.green);
  text(tr("Total outstanding"), colUnit, rowsBottom + 72, { size: 34, weight: 800 });
  text(formatUsd(d.totalDue), colAmount, rowsBottom + 72, { size: 40, weight: 800, color: d.totalDue > 0.005 ? C.red : C.ok, align: "end" });

  // Footer
  const footTop = rowsBottom + 120;
  box(PAD, footTop, W - PAD * 2, 2, C.line);
  text(tr("Balances include monthly charges, generator and water up to today."), PAD, footTop + 50, { size: 24, color: C.muted, max: W - PAD * 2 });
  text(tr("For any question about your balance, contact the building owner."), PAD, footTop + 90, { size: 24, color: C.muted, max: W - PAD * 2 });
  return canvas;
}

// A PNG file from the canvas, made synchronously so the share sheet still
// counts as a direct response to the tap.
function groupBalancesImageFile() {
  const dataUrl = drawGroupBalancesCanvas().toDataURL("image/png");
  const fileName = `Balances_${safeFilePart(state.building?.name || "Building", "Building")}_${localDateInput()}.png`;
  return new File([base64ToBytes(dataUrl.split(",")[1] || "")], fileName, { type: "image/png" });
}

async function postBalancesToGroup() {
  const file = groupBalancesImageFile();
  const caption = tr("{building} — balances as of {date}", { building: state.building?.name || "", date: formatDateLabel(localDateInput()) });
  try {
    if (typeof navigator.share === "function" && (typeof navigator.canShare !== "function" || navigator.canShare({ files: [file] }))) {
      await navigator.share({ files: [file], title: caption, text: caption });
      markRemindersSent();
      showToast("Balances picture shared");
      return;
    }
  } catch (error) {
    if (error?.name === "AbortError") { showToast("Sharing cancelled"); return; }
  }
  // No file sharing here (e.g. a computer): save the picture and open WhatsApp
  // so it can be attached in the group.
  downloadBlob(file, "image/png", file.name);
  window.open(whatsappLink("", caption), "_blank", "noopener");
  markRemindersSent();
  showToast("Balances picture downloaded — attach it in the WhatsApp group", 6000);
}

function inviteWhatsAppMessage(tenant, code) {
  return tr("Hi {name}! Here is your invite to the {building} app, where you can see your balance and payments.\n1. Open {url}\n2. Tap \"I'm a tenant with an invite code\"\n3. Enter: {code}\nThe code works once, within 30 days.\n\nTip: add the app to your home screen. iPhone: tap Share, then \"Add to Home Screen\". Android: tap ⋮, then \"Install app\". Then open More > Phone notifications to get your balance and news.", {
    name: tenant?.name || "", building: state.building?.name || "", url: inviteAppUrl(), code,
  });
}

function sendInviteOnWhatsApp() {
  const code = els.inviteCodeText.textContent;
  const tenant = state.tenants.find((t) => t.id === els.inviteTenantSelect.value);
  if (!code || !tenant) return;
  window.open(whatsappLink(tenant.phone, inviteWhatsAppMessage(tenant, code)), "_blank", "noopener");
}

// ── Recurring monthly expenses ──────────────────────────────────────────────
// A template remembers a regular expense (salary, cleaning, internet). Each
// month it waits as a draft until the owner confirms it; the transaction it
// creates carries recurringId, which is how a month counts as done.
function pendingRecurringExpenses(month) {
  const key = monthKey(month);
  return (state.recurringExpenses || []).filter((r) =>
    r.active !== false
    && monthKey(r.startMonth || "") <= key
    && !state.transactions.some((t) => t.recurringId === r.id && monthKey(t.date || "") === key));
}

function addRecurringTemplateFrom(transaction) {
  const template = {
    id: `rec-${Date.now()}-${randomToken().slice(0, 4)}`,
    description: transaction.description || "",
    expenseCategory: transaction.expenseCategory || "",
    supplier: transaction.supplier || "",
    currency: Number(transaction.debitLbp || 0) > 0 && !Number(transaction.debitUsd || 0) ? "LBP" : "USD",
    amount: Number(transaction.debitLbp || 0) > 0 && !Number(transaction.debitUsd || 0) ? Number(transaction.debitLbp) : Number(transaction.debitUsd || 0),
    startMonth: monthIso(monthKey(transaction.date || localDateInput())),
    active: true,
    createdAt: new Date().toISOString(),
  };
  (state.recurringExpenses ||= []).push(template);
  return template;
}

let recurringDialogMonth = null;

function openRecurringDialog(month = currentMonthValue()) {
  if (sessionMode !== "owner") return;
  recurringDialogMonth = typeof month === "string" ? month : currentMonthValue();
  els.recurringDialogTitle.textContent = tr("Monthly expenses – {month}", { month: formatMonth(recurringDialogMonth) });
  const templates = (state.recurringExpenses || []).filter((r) => r.active !== false);
  const pending = new Set(pendingRecurringExpenses(recurringDialogMonth).map((r) => r.id));
  els.recurringDialogNote.textContent = templates.length
    ? tr("Check the amounts, then add them. Untick anything that didn't happen this month.")
    : tr("No recurring expenses yet. When you add an expense, tick \"Repeat every month\".");
  els.recurringList.replaceChildren(...templates.map((r) => {
    const row = document.createElement("div");
    row.className = "recurring-row";
    row.dataset.id = r.id;
    const done = !pending.has(r.id);
    const tick = document.createElement("input");
    tick.type = "checkbox";
    tick.className = "recurring-tick";
    tick.checked = !done;
    tick.disabled = done;
    const text = document.createElement("div");
    text.className = "recurring-text";
    const title = document.createElement("strong");
    title.textContent = r.description || tr("Expense");
    const meta = document.createElement("span");
    meta.textContent = done ? tr("Added this month ✓") : [r.expenseCategory, r.supplier].filter(Boolean).join(" · ");
    text.append(title, meta);
    const amount = document.createElement("input");
    amount.type = "number";
    amount.min = "0";
    amount.step = r.currency === "LBP" ? "1000" : "0.01";
    amount.inputMode = "decimal";
    amount.className = "recurring-amount";
    amount.value = String(r.amount || "");
    amount.disabled = done;
    amount.setAttribute("aria-label", tr("Amount ({currency})", { currency: r.currency || "USD" }));
    const currency = document.createElement("span");
    currency.className = "recurring-currency";
    currency.textContent = r.currency === "LBP" ? "LBP" : "$";
    const stop = document.createElement("button");
    stop.type = "button";
    stop.className = "text-link-btn recurring-stop-btn";
    stop.textContent = tr("Stop");
    stop.addEventListener("click", () => stopRecurringExpense(r.id));
    row.append(tick, text, amount, currency, stop);
    return row;
  }));
  els.recurringAddButton.classList.toggle("hidden", pending.size === 0);
  openDialog(els.recurringDialog);
}

function addTickedRecurringExpenses() {
  const month = recurringDialogMonth || currentMonthValue();
  const date = monthKey(month) === monthKey(localDateInput()) ? localDateInput() : `${monthKey(month)}-01`;
  let added = 0;
  els.recurringList.querySelectorAll(".recurring-row").forEach((row) => {
    const tick = row.querySelector(".recurring-tick");
    if (!tick.checked || tick.disabled) return;
    const template = (state.recurringExpenses || []).find((r) => r.id === row.dataset.id);
    const amount = Number(row.querySelector(".recurring-amount").value || 0);
    if (!template || !(amount > 0)) return;
    const usd = template.currency === "LBP" ? 0 : amount;
    const lbp = template.currency === "LBP" ? amount : 0;
    const shares = computeSharedExpenseShares(toUsd(usd, lbp), "coefficient");
    state.transactions.push({
      id: `tx-${Date.now()}-${added}`,
      category: "Expenses",
      description: template.description,
      tenantId: null,
      forMonth: null,
      project: "",
      date,
      supplier: template.supplier || "",
      invoice: nextExpenseInvoiceNumber(),
      expenseCategory: template.expenseCategory || "",
      debitUsd: usd, debitLbp: lbp, creditUsd: 0, creditLbp: 0,
      balanceUsd: -usd, balanceLbp: -lbp,
      shares: Object.keys(shares).length ? shares : null,
      invoiceAttachment: null,
      sourceRow: null,
      recurringId: template.id,
    });
    template.amount = amount; // next month starts from the latest amount
    added += 1;
  });
  if (!added) { showToast("Tick at least one expense with an amount"); return; }
  saveState();
  closeDialog(els.recurringDialog);
  renderAll();
  showToast(tr(added === 1 ? "{n} expense added" : "{n} expenses added", { n: added }));
}

function stopRecurringExpense(id) {
  const template = (state.recurringExpenses || []).find((r) => r.id === id);
  if (!template) return;
  if (!window.confirm(tr("Stop repeating \"{name}\"? Expenses already recorded stay.", { name: template.description || tr("Expense") }))) return;
  template.active = false;
  saveState();
  openRecurringDialog(recurringDialogMonth);
  renderAttention();
}

// ── "I've paid", with an optional proof photo ───────────────────────────────
let declareContext = null;
// Proof attached to the payment the owner is about to record from a declaration.
let pendingDeclarationProof = null;

function openDeclareDialog(tenantId, month, amount) {
  declareContext = { tenantId, month };
  els.declareMonthNote.textContent = tr("For {month}", { month: formatMonth(month) });
  els.declareAmountInput.value = amountInputValue(amount);
  els.declareProofInput.value = "";
  openDialog(els.declareDialog);
}

async function uploadPaymentProof(tenantId, file) {
  if (cloudProvider() !== "supabase" || !authSession) {
    throw new Error("Photos need the cloud. Send the photo to the owner on WhatsApp instead.");
  }
  const prepared = await prepareInvoiceUpload({ id: "proof", invoice: "payment-proof", description: "payment proof", date: localDateInput() }, file);
  // Tenant phones may only write inside proofs/<their tenant id>/ (storage policy).
  const path = `proofs/${tenantId}/${Date.now()}-${randomToken()}.jpg`;
  const c = cloudConfig();
  await ensureFreshSession();
  const res = await fetch(`${c.supabaseUrl}/storage/v1/object/${SUPABASE_INVOICE_BUCKET}/${encodeURI(path)}`, {
    method: "POST",
    headers: { apikey: c.supabaseKey, Authorization: `Bearer ${authBearer()}`, "Content-Type": prepared.mimeType, "x-upsert": "false" },
    body: base64ToBytes(prepared.dataBase64),
  });
  if (!res.ok) throw Object.assign(new Error(`Photo upload failed (${res.status})`), { status: res.status });
  return { fileName: "payment-proof.jpg", mimeType: prepared.mimeType, size: prepared.size, storagePath: path, uploadedAt: new Date().toISOString() };
}

async function submitDeclaration() {
  if (!declareContext) return;
  const amount = Number(els.declareAmountInput.value || 0);
  if (!(amount > 0)) { showToast("Enter the amount you paid"); return; }
  const file = els.declareProofInput.files?.[0] || null;
  els.declareSubmitButton.disabled = true;
  try {
    const proof = file ? await uploadPaymentProof(declareContext.tenantId, file) : null;
    await declarePayment(declareContext.tenantId, declareContext.month, amount, proof);
    closeDialog(els.declareDialog);
  } catch (error) {
    showToast(error instanceof TypeError ? "Can't reach the cloud. Check your connection." : describeSyncProblem(error), 6000);
  } finally {
    els.declareSubmitButton.disabled = false;
  }
}

// ── Invoice photos (private bucket) ─────────────────────────────────────────
// The bucket is private, so a stored photo opens through a link that is
// signed on demand and expires after 10 minutes. Photos uploaded to Google
// Drive before the migration have no storagePath and keep their old link.
async function invoicePhotoLink(attachment) {
  if (!attachment?.storagePath || cloudProvider() !== "supabase") return attachmentUrl(attachment);
  const c = cloudConfig();
  await ensureFreshSession();
  const res = await fetch(`${c.supabaseUrl}/storage/v1/object/sign/${SUPABASE_INVOICE_BUCKET}/${encodeURI(attachment.storagePath)}`, {
    method: "POST",
    headers: { apikey: c.supabaseKey, Authorization: `Bearer ${authBearer()}`, "Content-Type": "application/json" },
    body: JSON.stringify({ expiresIn: 600 }),
  });
  if (!res.ok) throw Object.assign(new Error(`Photo link failed (${res.status})`), { status: res.status });
  const body = await res.json();
  const signed = body.signedURL || body.signedUrl || "";
  return signed.startsWith("http") ? signed : `${c.supabaseUrl}/storage/v1${signed}`;
}

async function openInvoicePhoto(attachment) {
  // Open the window first (inside the tap) so phones don't block it as a popup.
  const win = window.open("", "_blank");
  try {
    const url = await invoicePhotoLink(attachment);
    if (win) win.location.href = url; else window.location.assign(url);
  } catch (error) {
    if (win) win.close();
    showToast(describeSyncProblem(error), 6000);
  }
}

function deleteInvoicePhoto(attachment) {
  if (!attachment?.storagePath || cloudProvider() !== "supabase" || !isOwnerSession()) return;
  const c = cloudConfig();
  ensureFreshSession()
    .then(() => fetch(`${c.supabaseUrl}/storage/v1/object/${SUPABASE_INVOICE_BUCKET}/${encodeURI(attachment.storagePath)}`, {
      method: "DELETE",
      headers: { apikey: c.supabaseKey, Authorization: `Bearer ${authBearer()}` },
    }))
    .catch(() => { /* best effort: the entry is already gone */ });
}

// ── Tenant phones: linked by a one-time invite code ─────────────────────────
// The phone gets its own anonymous account, and the server binds that account
// to one tenant when the code is redeemed. From then on the database itself
// decides what the phone may see (get_my_state) and write (declare / vote).
function renderTenantLoginForm() {
  const linked = isTenantSession();
  const me = linked ? state.tenants.find((t) => t.id === authSession.tenantId) : null;
  els.loginTenantLinked.classList.toggle("hidden", !linked);
  if (linked) {
    els.loginTenantLinked.textContent = me
      ? tr("Linked as {name} — Unit {unit}", { name: me.name, unit: me.unit || "" })
      : tr("This phone is linked to a tenant");
  }
  els.loginTenantSelect.classList.toggle("hidden", linked);
  els.loginPinInput.classList.toggle("hidden", linked);
  els.loginUnlinkBtn.classList.toggle("hidden", !linked || els.loginTenantForm.classList.contains("hidden"));
}

function enterAsLinkedTenant() {
  sessionMode = "tenant";
  sessionTenantId = authSession.tenantId;
  applySessionMode();
  hideLoginScreen();
  setView("dashboardView");
  renderAll();
  checkDueBanner();
  syncFromSheet({ silent: true });
}

async function joinWithInviteCode(rawCode) {
  const code = String(rawCode || "").trim().toUpperCase();
  if (!code) { showToast("Enter the invite code first"); return; }
  if (cloudProvider() !== "supabase") { showToast("This app isn't connected to the cloud database"); return; }
  if (isOwnerSession() && !window.confirm(tr("This phone is signed in as the building owner. Link it to a tenant instead? The owner will be signed out here."))) return;
  const c = cloudConfig();
  els.connectSubmitButton.disabled = true;
  try {
    // 1. a fresh anonymous identity for this phone
    const signup = await authRequest("signup", {});
    if (!signup.ok || !signup.body?.access_token) throw new Error(signup.body?.msg || "Could not create this phone's account");
    const session = sessionFromAuthResponse(signup.body);
    // 2. redeem the code: the server links this identity to one tenant
    const claim = await fetch(`${c.supabaseUrl}/rest/v1/rpc/claim_tenant`, {
      method: "POST",
      headers: { apikey: c.supabaseKey, Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ p_code: code }),
      signal: AbortSignal.timeout(AUTH_TIMEOUT_MS),
    });
    const claimBody = await claim.json().catch(() => null);
    if (!claim.ok) {
      authRequest("logout", {}, session.access_token).catch(() => {});
      throw new Error(claimBody?.message || "That code is not valid");
    }
    saveAuthSession({ ...session, email: "", role: "tenant", tenantId: String(claimBody) });
    // 3. this phone's copy of the data = the server's filtered copy, nothing else
    const res = await supabaseRequest("rpc/get_my_state", { method: "POST", body: "{}" });
    state = hydrateState(await res.json());
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    applyLanguage(state.settings.language);
    closeDialog(els.connectDialog);
    els.connectCodeInput.value = "";
    populateTenantSelect();
    enterAsLinkedTenant();
    showToast("Phone linked. You'll only see your own account.");
  } catch (error) {
    const unreachable = error instanceof TypeError || error?.name === "TimeoutError";
    showToast(unreachable ? "Can't reach the cloud. Check your connection." : tr(error.message), 6000);
  } finally {
    els.connectSubmitButton.disabled = false;
  }
}

function unlinkTenantPhone() {
  if (!window.confirm(tr("Unlink this phone? Its copy of your account is removed. You'll need a new invite code from the owner to link it again."))) return;
  const token = authSession?.access_token;
  saveAuthSession(null);
  if (token) authRequest("logout", {}, token).catch(() => {});
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(SYNC_META_KEY);
  location.reload();
}

// Owner side: mint a code for one tenant and hand it over.
function openInviteDialog(preselectTenantId = null) {
  // Called directly from a tenant card, or as a click handler (gets an event).
  const preselect = typeof preselectTenantId === "string" ? preselectTenantId : null;
  if (!isOwnerSession()) {
    showToast("Sign in with Google first: only the signed-in owner can create invite codes", 6000);
    return;
  }
  const active = state.tenants.filter((t) => t.active !== false);
  els.inviteTenantSelect.replaceChildren(...active.map((t) => {
    const opt = document.createElement("option");
    opt.value = t.id;
    opt.textContent = `${t.name} — ${tr("Unit")} ${t.unit || ""}`;
    return opt;
  }));
  resetInviteResult();
  openDialog(els.inviteDialog);
  if (preselect) {
    els.inviteTenantSelect.value = preselect;
    createInviteCode();
  }
}

function resetInviteResult() {
  els.inviteResult.classList.add("hidden");
  els.inviteShareButton.classList.add("hidden");
  els.inviteWhatsAppButton.classList.add("hidden");
  els.inviteCreateButton.classList.remove("hidden");
  els.inviteCodeText.textContent = "";
}

async function createInviteCode() {
  const tenantId = els.inviteTenantSelect.value;
  if (!tenantId) return;
  els.inviteCreateButton.disabled = true;
  try {
    const res = await supabaseRequest("rpc/create_claim_code", { method: "POST", body: JSON.stringify({ p_tenant_id: tenantId }) });
    const code = String(await res.json());
    const tenant = state.tenants.find((t) => t.id === tenantId);
    els.inviteCodeText.textContent = code;
    els.inviteHowTo.textContent = tr("Send this to {name}. On their phone: open {url}, tap \"I'm a tenant with an invite code\" and enter the code. It works once, within 30 days.", { name: tenant?.name || "", url: inviteAppUrl() });
    els.inviteResult.classList.remove("hidden");
    els.inviteShareButton.classList.remove("hidden");
    els.inviteWhatsAppButton.classList.remove("hidden");
    els.inviteCreateButton.classList.add("hidden");
  } catch (error) {
    showToast(describeSyncProblem(error), 6000);
  } finally {
    els.inviteCreateButton.disabled = false;
  }
}

function inviteAppUrl() {
  return `${location.origin}${location.pathname}`;
}

async function shareInviteCode() {
  const code = els.inviteCodeText.textContent;
  if (!code) return;
  const message = `${tr("Your invite code for {building}", { building: state.building?.name || "" })}: ${code}\n${inviteAppUrl()}`;
  try {
    if (typeof navigator.share === "function") { await navigator.share({ text: message }); return; }
  } catch (error) {
    if (error?.name === "AbortError") return;
  }
  try {
    await navigator.clipboard.writeText(message);
    showToast("Invite copied — paste it in WhatsApp or a message");
  } catch {
    window.prompt(tr("Copy this invite:"), message);
  }
}

// ── Daily cloud backups (owner) ─────────────────────────────────────────────
async function openBackupsDialog() {
  if (!isOwnerSession()) {
    showToast("Sign in with Google first: only the signed-in owner can restore backups", 6000);
    return;
  }
  els.backupsList.replaceChildren();
  const loading = document.createElement("p");
  loading.className = "settings-note";
  loading.textContent = tr("Loading…");
  els.backupsList.append(loading);
  openDialog(els.backupsDialog);
  try {
    const res = await supabaseRequest("rpc/list_backups", { method: "POST", body: "{}" });
    const rows = await res.json();
    if (!rows.length) {
      loading.textContent = tr("No backups yet. The first one is taken tonight.");
      return;
    }
    els.backupsList.replaceChildren(...rows.map((row) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "backup-row";
      const day = document.createElement("strong");
      day.textContent = formatDateLabel(row.day);
      const meta = document.createElement("span");
      meta.textContent = tr("{tenants} tenants · {transactions} transactions", { tenants: row.tenants, transactions: row.transactions });
      btn.append(day, meta);
      btn.addEventListener("click", () => restoreCloudBackup(row.day));
      return btn;
    }));
  } catch (error) {
    loading.textContent = describeSyncProblem(error);
  }
}

async function restoreCloudBackup(day) {
  if (!window.confirm(tr("Restore the backup from {day}? It replaces the data on every device. Today's data is downloaded first as a safety copy.", { day: formatDateLabel(day) }))) return;
  try {
    const res = await supabaseRequest("rpc/get_backup", { method: "POST", body: JSON.stringify({ p_day: day }) });
    const backup = await res.json();
    if (!backup || !Array.isArray(backup.tenants)) throw new Error("That backup is empty");
    downloadBackup(); // safety copy of what's here now
    const restored = hydrateState(backup);
    // A higher epoch makes every other device take this copy wholesale
    // instead of merging their newer rows back in.
    restored.meta = { ...(restored.meta || {}), epoch: Math.max(Number(state.meta?.epoch || 0), Number(backup.meta?.epoch || 0)) + 1 };
    state = restored;
    saveState({ sync: false });
    closeDialog(els.backupsDialog);
    populateTenantSelect();
    renderAll();
    await saveCloudState();
    showToast(tr("Restored the backup from {day}", { day: formatDateLabel(day) }));
  } catch (error) {
    showToast(describeSyncProblem(error), 6000);
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
    su: state.settings.supabaseUrl || "",
    sk: state.settings.supabaseAnonKey || "",
  });
}

async function shareSyncCode() {
  if (!hasCloudConfig()) { showToast("Set up the cloud database first, then Save"); return; }
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
  const hasSupabase = Boolean(cfg && cfg.su && cfg.sk);
  if (!cfg || (!cfg.u && !hasSupabase)) { showToast("That access code is missing the sync address"); return; }

  const applyCfg = () => {
    state.settings.invoiceUploadUrl = String(cfg.u || "").trim();
    state.settings.cloudSpreadsheetId = String(cfg.s || "").trim();
    state.settings.syncSecret = String(cfg.k || "").trim();
    state.settings.supabaseUrl = String(cfg.su || "").trim();
    state.settings.supabaseAnonKey = String(cfg.sk || "").trim();
  };
  applyCfg();
  saveState({ sync: false });

  try {
    renderCloudStatus("Connecting…");
    setSyncChip("saving");
    const remote = await cloudLoadState();
    if (!remote) throw new Error("No building data found at that address");
    state = hydrateState(remote);
    // Preserve the cloud config we just entered, in case the pulled state lacks it.
    applyCfg();
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
  if (!window.confirm(tr("Clear all payments and expenses? Your tenants are kept. Use this to start a fresh period (e.g. a new year). This cannot be undone."))) {
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
  Payments: "Record a Payment",
  Expenses: "Record an Expense",
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
  els.transactionDialogTitle.textContent = ENTRY_TITLES[category] ? tr(ENTRY_TITLES[category]) : t("tx.addTitle");
  document.querySelector(".type-field").classList.add("hidden");
  els.transactionBackButton.classList.remove("hidden");
  openDialog(els.transactionDialog);
  setTimeout(() => (category === "Payments" ? els.transactionTenant : els.transactionAmount).focus(), 50);
}

function resetTransactionForm() {
  editingExpenseId = null;
  pendingDeclarationProof = null;
  els.transactionForm.reset();
  els.transactionBackButton.classList.add("hidden"); // shown only when opened via the chooser
  document.querySelector(".type-field").classList.remove("hidden");
  els.transactionDialogTitle.textContent = t("tx.addTitle");
  els.transactionSubmitButton.textContent = t("common.add");
  els.transactionCategory.disabled = false;
  els.transactionCategory.value = "Payments";
  els.transactionDirection.value = "credit";
  els.transactionDate.value = localDateInput();
  els.transactionMonth.value = selectedMonth ? monthKey(selectedMonth) : monthKey(localDateInput());
  els.transactionCurrency.value = "USD";
  els.transactionAmount.value = amountInputValue(state.settings.defaultDueUsd);
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
  els.transactionSubmitButton.textContent = isBusy ? tr("Saving...") : editingExpenseId ? tr("Save") : t("common.add");
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
  if (transaction?.category === "Payments") { openPaymentEditDialog(transactionId); return; }
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
  els.transactionDialogTitle.textContent = tr("Edit Expense");
  els.transactionSubmitButton.textContent = tr("Save");
  els.transactionCategory.value = "Expenses";
  els.transactionCategory.disabled = true;
  els.transactionDescription.value = transaction.description || "";
  els.transactionDate.value = transaction.date || localDateInput();
  const editLbp = expenseDebitLbp(transaction);
  const editUsd = expenseDebitUsd(transaction);
  if (editLbp > 0 && editUsd === 0) {
    els.transactionCurrency.value = "LBP";
    els.transactionAmount.value = amountInputValue(editLbp);
  } else {
    els.transactionCurrency.value = "USD";
    els.transactionAmount.value = amountInputValue(editUsd);
  }
  els.transactionSupplier.value = transaction.supplier || "";
  els.transactionInvoice.value = transaction.invoice || "";
  if (els.transactionPaidFrom) els.transactionPaidFrom.value = transaction.paidFrom === "bank" ? "bank" : "cash";
  els.transactionExpenseCategory.value = transaction.expenseCategory || "";
  els.transactionProject.value = transaction.project || "";
  clearInvoiceFileSelection();
  els.invoiceAttachmentStatus.textContent = hasInvoicePhoto(transaction.invoiceAttachment)
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
  els.transactionCurrency.value = "USD";
  els.transactionAmount.value = amountInputValue(amount);
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

  const closed = recordMonths("transaction", transaction).find(isMonthClosed);
  if (closed) { showToast(closedMonthError(closed).message, 5000); return; }
  const label = [transaction.category, transaction.description || tenantName(transaction.tenantId), transaction.date]
    .filter(Boolean)
    .join(" | ");
  if (!window.confirm(tr("Delete this ledger entry?\n\n{label}\n\nThis removes the record from the app and Google Sheet sync.", { label }))) {
    return;
  }

  state.transactions = state.transactions.filter((entry) => entry.id !== transactionId);
  state.sharedExpenses = (state.sharedExpenses || []).filter((se) => se.expenseTransactionId !== transactionId);
  recordDeletedId("transactions", transactionId);
  if (!saveState()) return;
  deleteInvoicePhoto(transaction.invoiceAttachment); // otherwise the file is orphaned in storage
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
    // Only old Google Drive photos have a permanent link; private ones open in the app.
    invoicePhoto: transaction.invoiceAttachment?.storagePath ? "" : attachmentUrl(transaction.invoiceAttachment),
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

// ── Full database export (owner only) ───────────────────────────────────────
// One workbook with every part of the building's data on its own styled sheet:
// dark header band, zebra rows, $ / LBP / date formats, frozen headers,
// filters and a bold totals row. Figures come from the same functions the
// screens use, so the workbook always agrees with the app.

// Column types -> number format. Text and Yes/No stay as text.
const WB_FORMATS = { usd: 164, lbp: 165, date: 166, month: 167, int: 168 };
// Cell styles, built once: [type][zebra][totals] -> cellXfs index.
const WB_XF = (() => {
  const list = [
    `<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>`, // 0 default
    `<xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>`, // 1 header
    `<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/>`, // 2 title
    `<xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1"/>`, // 3 subtitle
    `<xf numFmtId="0" fontId="4" fillId="0" borderId="0" xfId="0" applyFont="1"/>`, // 4 bold label
    `<xf numFmtId="164" fontId="4" fillId="0" borderId="0" xfId="0" applyFont="1" applyNumberFormat="1"/>`, // 5 bold $
  ];
  const map = {};
  ["text", "usd", "lbp", "date", "month", "int"].forEach((type) => {
    map[type] = {};
    [false, true].forEach((zebra) => {
      map[type][zebra] = {};
      [false, true].forEach((totals) => {
        const fmt = WB_FORMATS[type] || 0;
        const fill = totals ? 4 : zebra ? 3 : 0;
        const font = totals ? 4 : 0;
        const border = totals ? 2 : 0;
        map[type][zebra][totals] = list.length;
        list.push(`<xf numFmtId="${fmt}" fontId="${font}" fillId="${fill}" borderId="${border}" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1"/>`);
      });
    });
  });
  return { list, map };
})();

const WB_STYLES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <numFmts count="5"><numFmt numFmtId="164" formatCode="$#,##0.00;[Red]-$#,##0.00"/><numFmt numFmtId="165" formatCode="#,##0 &quot;LBP&quot;;[Red]-#,##0 &quot;LBP&quot;"/><numFmt numFmtId="166" formatCode="dd mmm yyyy"/><numFmt numFmtId="167" formatCode="mmm yyyy"/><numFmt numFmtId="168" formatCode="#,##0"/></numFmts>
  <fonts count="5"><font><sz val="11"/><name val="Calibri"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Calibri"/></font><font><b/><color rgb="FF163832"/><sz val="16"/><name val="Calibri"/></font><font><i/><color rgb="FF5F7A71"/><sz val="10"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>
  <fills count="5"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF163832"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFF3F7F5"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFE1ECE7"/><bgColor indexed="64"/></patternFill></fill></fills>
  <borders count="3"><border><left/><right/><top/><bottom/><diagonal/></border><border><left/><right/><top/><bottom style="thin"><color rgb="FFB6C9C1"/></bottom><diagonal/></border><border><left/><right/><top style="medium"><color rgb="FF163832"/></top><bottom/><diagonal/></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="${WB_XF.list.length}">${WB_XF.list.join("")}</cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;

// "2026-09-05" -> Excel day number, so dates sort and filter as real dates.
function excelDateSerial(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ""));
  if (!m) return null;
  return (Date.UTC(+m[1], +m[2] - 1, +m[3]) - Date.UTC(1899, 11, 30)) / 86400000;
}

function wbCell(rowNumber, col, value, type, zebra, totals) {
  const style = WB_XF.map[type || "text"][Boolean(zebra)][Boolean(totals)];
  if (value === null || value === undefined || value === "") {
    return `<c r="${excelCellRef(rowNumber, col)}" s="${style}"/>`;
  }
  if (type === "date" || type === "month") {
    const serial = excelDateSerial(value);
    if (serial !== null) return xlsxNumberCell(rowNumber, col, serial, style);
    return xlsxTextCell(rowNumber, col, value, style);
  }
  if (type && type !== "text") return xlsxNumberCell(rowNumber, col, value, style);
  return xlsxTextCell(rowNumber, col, value, style);
}

// sheet: { name, title, columns: [{ header, width, type, total }], rows: [[...]] }
function buildTableSheetXml(sheet, subtitle, rtl) {
  const cols = sheet.columns;
  const headerRowNo = 4;
  const rowsXml = [
    `<row r="1" ht="24" customHeight="1">${xlsxTextCell(1, 0, sheet.title, 2)}</row>`,
    `<row r="2">${xlsxTextCell(2, 0, subtitle, 3)}</row>`,
    `<row r="${headerRowNo}" ht="30" customHeight="1">${cols.map((c, i) => xlsxTextCell(headerRowNo, i, c.header, 1)).join("")}</row>`,
  ];
  sheet.rows.forEach((row, index) => {
    const r = headerRowNo + 1 + index;
    const zebra = index % 2 === 1;
    rowsXml.push(`<row r="${r}">${cols.map((c, i) => wbCell(r, i, row[i], c.type, zebra, false)).join("")}</row>`);
  });
  const lastData = headerRowNo + sheet.rows.length;
  const hasTotals = sheet.rows.length > 0 && cols.some((c) => c.total);
  if (hasTotals) {
    const r = lastData + 1;
    const cells = cols.map((c, i) => {
      if (i === 0) return wbCell(r, 0, tr("Total"), "text", false, true);
      if (!c.total) return wbCell(r, i, "", c.type, false, true);
      const sum = sheet.rows.reduce((s, row) => s + Number(row[i] || 0), 0);
      return wbCell(r, i, c.type === "usd" ? roundUsd(sum) : sum, c.type, false, true);
    });
    rowsXml.push(`<row r="${r}">${cells.join("")}</row>`);
  }
  const lastRow = hasTotals ? lastData + 1 : Math.max(lastData, headerRowNo);
  const lastCol = excelColumnName(cols.length - 1);
  const filter = sheet.rows.length ? `<autoFilter ref="A${headerRowNo}:${lastCol}${lastData}"/>` : "";
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>
  <dimension ref="A1:${lastCol}${lastRow}"/>
  <sheetViews><sheetView workbookViewId="0"${rtl ? ` rightToLeft="1"` : ""} showGridLines="0"><pane ySplit="${headerRowNo}" topLeftCell="A${headerRowNo + 1}" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>
  <cols>${cols.map((c, i) => `<col min="${i + 1}" max="${i + 1}" width="${c.width || 14}" customWidth="1"/>`).join("")}</cols>
  <sheetData>${rowsXml.join("")}</sheetData>
  ${filter}
  <pageMargins left="0.5" right="0.5" top="0.6" bottom="0.6" header="0.3" footer="0.3"/>
  <pageSetup orientation="landscape" fitToWidth="1" fitToHeight="0"/>
</worksheet>`;
}

// Summary: label / value pairs grouped under section headings.
function buildSummarySheetXml(title, subtitle, sections, rtl) {
  const rows = [
    `<row r="1" ht="24" customHeight="1">${xlsxTextCell(1, 0, title, 2)}</row>`,
    `<row r="2">${xlsxTextCell(2, 0, subtitle, 3)}</row>`,
  ];
  let r = 4;
  sections.forEach((section) => {
    rows.push(`<row r="${r}" ht="22" customHeight="1">${xlsxTextCell(r, 0, section.heading, 1)}${xlsxTextCell(r, 1, "", 1)}</row>`);
    r += 1;
    section.items.forEach(([label, value, type], i) => {
      const zebra = i % 2 === 1;
      rows.push(`<row r="${r}">${wbCell(r, 0, label, "text", zebra, false)}${wbCell(r, 1, value, type || "text", zebra, false)}</row>`);
      r += 1;
    });
    r += 1;
  });
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <dimension ref="A1:B${r}"/>
  <sheetViews><sheetView workbookViewId="0"${rtl ? ` rightToLeft="1"` : ""} showGridLines="0"/></sheetViews>
  <cols><col min="1" max="1" width="38" customWidth="1"/><col min="2" max="2" width="30" customWidth="1"/></cols>
  <sheetData>${rows.join("")}</sheetData>
  <pageMargins left="0.5" right="0.5" top="0.6" bottom="0.6" header="0.3" footer="0.3"/>
</worksheet>`;
}

// Excel sheet names: max 31 chars, none of []:*?/\
function safeSheetName(name, used) {
  let base = String(name).replace(/[[\]:*?/\\]/g, " ").trim().slice(0, 31) || "Sheet";
  let candidate = base;
  let n = 2;
  while (used.has(candidate.toLowerCase())) candidate = `${base.slice(0, 28)} ${n++}`;
  used.add(candidate.toLowerCase());
  return candidate;
}

// Gathers every table from the live state. Exposed to tests.
function collectFullExportData() {
  const yesNo = (v) => (v ? tr("Yes") : tr("No"));
  const name = (id) => tenantName(id) || (id ? tr("(removed tenant)") : "");
  const sortByDate = (a, b) => String(transactionDateValue(a)).localeCompare(String(transactionDateValue(b)));

  // Tenants
  const tenantRows = state.tenants.map((t) => {
    const totals = getTenantTotals(t.id);
    return [
      t.name, t.unit || "", Number(t.coefficient || 0), Number(t.breakerAmps || 0), t.phone || "", yesNo(t.active !== false),
      getTenantDueBasisTotal(t.id), getTenantServicesDue(t.id), getTenantPaymentsTotal(t.id), getTenantOpeningNet(t.id),
      getTenantBalance(t.id), getTenantProjectOutstanding(t.id), totals.dueUsd,
    ];
  });

  // Transactions
  const serviceLabel = (t) => {
    if (t.serviceType === "generator") return t.servicePart === "maintenance" ? tr("Generator maintenance") : tr("Generator fuel");
    if (t.serviceType === "water") return tr("Water");
    return "";
  };
  const txRows = [...state.transactions].sort(sortByDate).map((t) => [
    t.date || "", t.category || "", name(t.tenantId), t.description || "", t.forMonth || "",
    t.expenseCategory || "", t.supplier || "", t.invoice || "", t.project || "", serviceLabel(t),
    Number(t.debitUsd || 0), Number(t.debitLbp || 0), Number(t.creditUsd || 0), Number(t.creditLbp || 0),
    roundUsd(transactionNetUsd(t)), t.receiptRef || "", t.invoiceAttachment ? tr("Yes") : "",
  ]);

  // Monthly cash activity (by transaction date). Running cash ends at the
  // dashboard's Cash figure, because both skip tenant-tied opening balances.
  const byMonth = new Map();
  state.transactions.forEach((t) => {
    if (t.category === "Opening Balance" && t.tenantId) return;
    const m = monthIso(monthKey(t.date || t.forMonth || ""));
    if (!m) return;
    const row = byMonth.get(m) || { opening: 0, expenses: 0, services: 0, payments: 0, projects: 0, other: 0, net: 0 };
    const net = transactionNetUsd(t);
    if (t.category === "Expenses") row.expenses += txUsd(t, t.debitUsd, t.debitLbp);
    else if (t.category === "Services Expenses") row.services += txUsd(t, t.debitUsd, t.debitLbp);
    else if (t.category === "Payments" && t.project) row.projects += net;
    else if (t.category === "Payments") row.payments += net;
    else if (t.category === "Opening Balance") row.opening += net;
    else row.other += net;
    row.net += net;
    byMonth.set(m, row);
  });
  let running = 0;
  const monthRows = [...byMonth.keys()].sort().map((m) => {
    const r = byMonth.get(m);
    running = roundUsd(running + r.net);
    return [m, roundUsd(r.opening), roundUsd(r.payments), roundUsd(r.projects), roundUsd(r.other), roundUsd(r.expenses), roundUsd(r.services), roundUsd(r.net), running];
  });

  // Generator readings with their computed split
  const readingRows = [];
  (state.serviceReadings || [])
    .filter((r) => r.serviceType === "generator")
    .sort((a, b) => String(a.forMonth).localeCompare(String(b.forMonth)))
    .forEach((rec) => {
      const dist = computeServiceDistribution("generator", rec.forMonth);
      Object.keys(rec.lines || {}).forEach((id) => {
        const l = dist.lines[id] || {};
        readingRows.push([rec.forMonth, name(id), l.previousReading || 0, l.currentReading || 0, l.kwh || 0, l.breakerAmps || 0, l.consumptionUsd || 0, l.maintenanceUsd || 0, l.totalUsd || 0]);
      });
    });

  // Projects: one row per tenant share
  const projectRows = [];
  (state.buildingProjects || []).forEach((p) => {
    const ids = Object.keys(p.shares || {});
    const base = [p.name || "", p.status || "", Number(p.totalBudget || 0), p.dueDate || "", p.distribution || ""];
    if (!ids.length) { projectRows.push([...base, "", 0, 0, 0]); return; }
    ids.forEach((id) => {
      const st = getProjectTenantStatus(p, id);
      projectRows.push([...base, name(id), st.share, st.paid, roundUsd(Math.max(0, st.share - st.paid))]);
    });
  });

  const budgetRows = (state.monthlyExpected || [])
    .slice()
    .sort((a, b) => String(a.month).localeCompare(String(b.month)))
    .map((e) => [e.month, Number(e.expectedUsd || 0)]);

  const pollRows = (state.polls || []).map((p) => {
    const votes = Object.values(p.votes || {});
    const count = (v) => votes.filter((x) => x === v).length;
    return [p.title || "", p.status || "", (p.createdAt || "").slice(0, 10), count("yes"), count("no"), count("abstain")];
  });

  const declarationRows = (state.paymentDeclarations || []).map((d) => [
    name(d.tenantId), d.month || "", Number(d.amount || 0), d.status || "", (d.declaredAt || "").slice(0, 10),
  ]);

  const position = getPositionTotals();
  const account = getAccountTotals();
  return { tenantRows, txRows, monthRows, readingRows, projectRows, budgetRows, pollRows, declarationRows, position, account };
}

// Returns the workbook's parts before zipping (tests check each one is valid XML).
function buildFullWorkbookFiles() {
  const d = collectFullExportData();
  const rtl = currentLang === "ar";
  const buildingTitle = (state.building && state.building.name) || "Building";
  const subtitle = tr("{building} · exported {date}", { building: buildingTitle, date: formatDateLabel(localDateInput()) });
  const C = (header, width, type = "text", total = false) => ({ header: tr(header), width, type, total });

  const tables = [
    { name: tr("Tenant balances"), rows: d.tenantRows, columns: [
      C("Tenant", 26), C("Unit", 9), C("Coefficient", 12, "int", true), C("Breaker (A)", 11, "int"), C("Phone", 16), C("Active", 9),
      C(isFixedMode() ? "Monthly dues to date" : "Expense share", 15, "usd", true), C("Generator & water", 15, "usd", true),
      C("Payments", 14, "usd", true), C("Opening credit (+) / debt (−)", 17, "usd", true), C("Balance (owes +)", 15, "usd", true),
      C("Projects outstanding", 15, "usd", true), C("Total due", 14, "usd", true)] },
    { name: tr("Transactions"), rows: d.txRows, columns: [
      C("Date", 13, "date"), C("Category", 17), C("Tenant", 22), C("Description", 34), C("For month", 12, "month"),
      C("Expense category", 17), C("Supplier", 18), C("Invoice", 11), C("Project", 16), C("Service", 18),
      C("Debit USD", 13, "usd", true), C("Debit LBP", 15, "lbp", true), C("Credit USD", 13, "usd", true), C("Credit LBP", 15, "lbp", true),
      C("Net USD", 13, "usd", true), C("Receipt", 18), C("Invoice photo", 12)] },
    { name: tr("Monthly activity"), rows: d.monthRows, columns: [
      C("Month", 12, "month"), C("Opening balance", 15, "usd", true), C("Monthly payments", 16, "usd", true), C("Project payments", 16, "usd", true),
      C("Other", 12, "usd", true), C("Expenses", 14, "usd", true), C("Generator & water", 16, "usd", true), C("Net cash flow", 15, "usd", true),
      C("Cash at month end", 17, "usd")] },
    { name: tr("Generator readings"), rows: d.readingRows, columns: [
      C("Month", 12, "month"), C("Tenant", 24), C("Previous reading", 15, "int"), C("Current reading", 15, "int"), C("kWh used", 12, "int", true),
      C("Breaker (A)", 11, "int"), C("Fuel share", 13, "usd", true), C("Maintenance share", 16, "usd", true), C("Total", 13, "usd", true)] },
    { name: tr("Projects"), rows: d.projectRows, columns: [
      C("Project", 24), C("Status", 12), C("Budget", 14, "usd"), C("Due date", 13, "date"), C("Distribution", 14),
      C("Tenant", 24), C("Share", 13, "usd", true), C("Paid", 13, "usd", true), C("Outstanding", 14, "usd", true)] },
    { name: tr("Monthly budget"), rows: d.budgetRows, columns: [C("Month", 14, "month"), C("Expected (USD)", 16, "usd", true)] },
    { name: tr("Polls"), rows: d.pollRows, columns: [
      C("Poll", 40), C("Status", 12), C("Created", 13, "date"), C("Yes", 8, "int", true), C("No", 8, "int", true), C("Abstain", 10, "int", true)] },
    { name: tr("Payment declarations"), rows: d.declarationRows, columns: [
      C("Tenant", 24), C("Month", 12, "month"), C("Amount (USD)", 14, "usd", true), C("Status", 12), C("Declared on", 14, "date")] },
  ];

  const summarySections = [
    { heading: tr("Building"), items: [
      [tr("Building"), buildingTitle], [tr("Exported on"), localDateInput(), "date"], [tr("App version"), APP_VERSION],
      [tr("Collection mode"), isFixedMode() ? tr("Fixed monthly amount") : tr("Actual expenses")],
      [tr("LBP per USD"), getConversionRate(), "int"]] },
    { heading: tr("Position"), items: [
      [tr("Cash / reserve"), roundUsd(d.position.cashUsd), "usd"], [tr("Owed by tenants"), d.position.receivableUsd, "usd"],
      [tr("Tenant credit (prepaid)"), d.position.advanceLiabilityUsd, "usd"], [tr("Net position"), d.position.netPositionUsd, "usd"],
      [tr("Total expenses (incl. generator & water)"), roundUsd(d.account.expenseUsd), "usd"],
      [tr("Total payments received"), roundUsd(d.account.paymentsUsd), "usd"]] },
    { heading: tr("Contents"), items: [
      [tr("Tenants"), state.tenants.length, "int"], [tr("Transactions"), state.transactions.length, "int"],
      [tr("Months with activity"), d.monthRows.length, "int"], [tr("Projects"), (state.buildingProjects || []).length, "int"],
      [tr("Polls"), (state.polls || []).length, "int"]] },
  ];

  const used = new Set();
  const sheets = [
    { name: safeSheetName(tr("Summary"), used), xml: buildSummarySheetXml(buildingTitle, tr("Full database export · {date}", { date: formatDateLabel(localDateInput()) }), summarySections, rtl) },
    ...tables.map((t) => ({
      name: safeSheetName(t.name, used),
      xml: buildTableSheetXml({ ...t, title: t.name }, subtitle, rtl),
    })),
  ];

  return workbookPackageFiles(sheets, `${buildingTitle} — full export`);
}

function buildFullWorkbookXlsx() {
  return new Blob([buildZip(buildFullWorkbookFiles())], { type: XLSX_MIME });
}

function handleFullExcelExport() {
  // Owner only: the button is hidden for tenants, and this guard stops it
  // being triggered any other way.
  if (sessionMode !== "owner") {
    showToast("Only the building owner can export the full database");
    return;
  }
  const slug = String((state.building && state.building.name) || "building").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "building";
  downloadBlob(buildFullWorkbookXlsx(), XLSX_MIME, `${slug}-full-export-${localDateInput()}.xlsx`);
  showToast("Full Excel export downloaded");
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
    // Private (Supabase) photos have no permanent link to print; say one exists.
    const photo = transaction.invoiceAttachment;
    appendOptionalLinkCell(row, photo ? (photo.storagePath ? tr("In app") : "Open") : "", photo && !photo.storagePath ? attachmentUrl(photo) : "");
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
  els.tenantDialogTitle.textContent = t("tenant.addTitle");
  els.tenantNameInput.value = "";
  els.tenantUnitInput.value = "";
  els.tenantPhoneDialogInput.value = "";
  els.tenantCoefficientInput.value = "";
  els.tenantBreakerInput.value = "";
  els.tenantPinDialogInput.value = "";
  els.tenantPinDialogInput.placeholder = t("tenant.pinPh");
  els.removeTenantPinButton.classList.add("hidden");
  els.tenantSubmitButton.textContent = t("common.add");
  renderTenantCoefficientHint();
  openDialog(els.tenantDialog);
  els.tenantNameInput.focus();
}

function openEditTenantDialog(tenantId) {
  const tenant = state.tenants.find((t) => t.id === tenantId);
  if (!tenant) return;
  editingTenantId = tenantId;
  els.tenantDialogTitle.textContent = tr("Edit Tenant");
  els.tenantNameInput.value = tenant.name;
  els.tenantUnitInput.value = tenant.unit;
  els.tenantPhoneDialogInput.value = tenant.phone || "";
  els.tenantCoefficientInput.value = tenant.coefficient > 0 ? String(tenant.coefficient) : "";
  els.tenantBreakerInput.value = tenant.breakerAmps > 0 ? String(tenant.breakerAmps) : "";
  els.tenantPinDialogInput.value = "";
  els.tenantPinDialogInput.placeholder = tenant.pinHash ? tr("PIN set — type to change") : t("tenant.pinPh");
  els.removeTenantPinButton.classList.toggle("hidden", !tenant.pinHash);
  els.tenantSubmitButton.textContent = tr("Save");
  renderTenantCoefficientHint();
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
  // The building totals 1000/1000. Lowering (or keeping) a coefficient is always
  // allowed, so a building already over the limit can still be fixed.
  const room = coefficientRoom(state.tenants, editingTenantId);
  const previous = editingTenantId ? Number(state.tenants.find((t) => t.id === editingTenantId)?.coefficient || 0) : 0;
  if (coefficient > room && coefficient > previous) {
    showToast(coefficientTooHighMessage(room), 6000);
    els.tenantCoefficientInput.focus();
    return;
  }

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
    showToast(tr("{name} added", { name }));
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
    ? tr("Delete {name}? Their {count} transaction(s) will be kept but unlinked from this tenant.", { name: tenant.name, count: txCount })
    : tr("Delete {name}?", { name: tenant.name });
  if (!window.confirm(msg)) return;
  state.tenants = state.tenants.filter((t) => t.id !== tenantId);
  recordDeletedId("tenants", tenantId);
  saveState();
  renderAll();
  showToast(tr("{name} removed", { name: tenant.name }));
}

function buildWhatsAppUrl(tenant, dueAmount, statementMonth = null) {
  const phone = whatsappPhone(tenant.phone);
  if (!phone) return null;
  const monthLine = statementMonth ? tr(" as of the {month} statement", { month: formatMonth(statementMonth) }) : "";
  const message = [
    tr("{building} – Payment Reminder", { building: state.building.name }),
    tr("Hi {name}, your outstanding balance{monthLine} is {amount}.", { name: tenant.name, monthLine, amount: formatUsd(dueAmount) }),
    tr("Please settle at your earliest convenience. Thank you."),
  ].join("\n");
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

function buildMonthlyDueWhatsAppUrl(tenant, owed, month) {
  const phone = whatsappPhone(tenant.phone);
  if (!phone) return null;
  const message = [
    tr("{building} – Payment Reminder", { building: state.building.name }),
    tr("Hi {name}, your building payment for {month} is outstanding: {amount}.", { name: tenant.name, month: formatMonth(month), amount: formatUsd(owed) }),
    tr("Please settle at your earliest convenience. Thank you."),
  ].join("\n");
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

function buildSharedExpensesWhatsAppUrl(tenant, owed, month) {
  const phone = whatsappPhone(tenant.phone);
  if (!phone) return null;
  const message = [
    tr("{building} – Shared Expenses Reminder", { building: state.building.name }),
    tr("Hi {name}, your share of the building shared expenses for {month} is outstanding: {amount}.", { name: tenant.name, month: formatMonth(month), amount: formatMonthly(owed) }),
    tr("Please settle at your earliest convenience. Thank you."),
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

  els.whatsappDialogTitle.textContent = tr("Shared Expenses Reminders – {month}", { month: formatMonth(selectedMonth) });
  els.whatsappDialogNote.textContent = withoutPhone.length
    ? tr("{names} skipped – no phone number saved in the Tenants tab.", { names: withoutPhone.map(({ tenant }) => tenant.name).join("، ") })
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
      detail.textContent = tr("Unit {unit} – {amount} due – {month}", { unit: tenant.unit, amount: formatMonthly(owed), month: formatMonth(selectedMonth) });
      info.append(name, detail);
      const link = document.createElement("a");
      link.className = "mini-button whatsapp-btn";
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener";
      link.textContent = tr("Send");
      row.append(info, link);
      return row;
    }),
  );

  openDialog(els.whatsappDialog);
}

function buildProjectWhatsAppUrl(tenant, project, owedAmount) {
  const phone = whatsappPhone(tenant.phone);
  if (!phone) return null;
  const message = [
    tr("{building} – Project Payment Reminder", { building: state.building.name }),
    tr('Hi {name}, your share for the "{project}" project is {amount}, due by {date}.', { name: tenant.name, project: project.name, amount: formatMonthly(owedAmount), date: formatDateLabel(project.dueDate) }),
    tr("Please settle at your earliest convenience. Thank you."),
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

  els.whatsappDialogTitle.textContent = tr("Reminders – {project}", { project: project.name });
  els.whatsappDialogNote.textContent = withoutPhone.length
    ? tr("{names} skipped – no phone number saved in the Tenants tab.", { names: withoutPhone.map(({ tenant }) => tenant.name).join("، ") })
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
      detail.textContent = tr("{amount} outstanding – due {date}", { amount: formatMonthly(owed), date: formatDateLabel(project.dueDate) });
      info.append(name, detail);
      const link = document.createElement("a");
      link.className = "mini-button whatsapp-btn";
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener";
      link.textContent = tr("Send");
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
  renderNavIcons();
  attachV148Events();
  els.navButtons.forEach((button) => {
    button.addEventListener("click", () => setView(button.dataset.view));
  });
  // More-menu rows open their sub-view.
  els.moreMenu.addEventListener("click", (event) => {
    const item = event.target.closest(".more-menu-item[data-view]");
    if (item) setView(item.dataset.view);
  });
  // Sub-view back buttons return to the More menu.
  document.querySelectorAll(".back-btn[data-back-to]").forEach((btn) => {
    btn.addEventListener("click", () => setView(btn.dataset.backTo));
  });
  els.dueOnlyToggle.addEventListener("click", () => { dueOnlyFilter = !dueOnlyFilter; renderPayments(); });
  els.whatsappAllDueButton.addEventListener("click", openWhatsAppReminderDialog);
  els.closeWhatsappDialog.addEventListener("click", () => closeDialog(els.whatsappDialog));
  els.clearLedgerFilters.addEventListener("click", clearAllLedgerFilters);
  els.monthChips.addEventListener("click", (event) => {
    const chip = event.target.closest("button[data-month]");
    if (!chip) return;
    selectedMonth = chip.dataset.month;
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
    if (paidBtn) { openDeclareDialog(paidBtn.dataset.tenantId, paidBtn.dataset.month, paidBtn.dataset.amount); return; }
    const noPhoneBtn = event.target.closest(".whatsapp-no-phone[data-edit-tenant-id]");
    if (noPhoneBtn) { openEditTenantDialog(noPhoneBtn.dataset.editTenantId); return; }
    const button = event.target.closest("button[data-tenant-id]");
    if (!button) return;
    openPaymentDialogFor(button.dataset.tenantId, button.dataset.month, button.dataset.due);
  });
  els.attentionList.addEventListener("click", (event) => {
    const hide = event.target.closest(".attention-hide[data-key]");
    if (hide) { openAttentionHideDialog(hide.dataset.key, hide.dataset.text); return; }
    if (event.target.closest(".attention-hidden-link")) { openHiddenAttentionDialog(); return; }
    const row = event.target.closest(".attention-row[data-view]");
    if (!row) return;
    if (row.dataset.action === "reminders") openWhatsAppReminderDialog();
    else if (row.dataset.action === "recurring") openRecurringDialog();
    else if (!handleExtraAttentionAction(row)) setView(row.dataset.view);
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
  els.tenantSearch.addEventListener("input", renderTenants);
  els.addTenantButton.addEventListener("click", openAddTenantDialog);
  els.tenantForm.addEventListener("submit", handleTenantFormSubmit);
  els.closeTenantDialog.addEventListener("click", () => closeDialog(els.tenantDialog));
  els.cancelTenantButton.addEventListener("click", () => closeDialog(els.tenantDialog));
  els.removeTenantPinButton.addEventListener("click", () => {
    const tenant = state.tenants.find((t) => t.id === editingTenantId);
    if (!tenant || !window.confirm(tr("Remove {name}'s PIN? They will no longer be able to log in.", { name: tenant.name }))) return;
    tenant.pinHash = "";
    saveState();
    els.removeTenantPinButton.classList.add("hidden");
    els.tenantPinDialogInput.placeholder = "Leave blank to disable tenant login";
    showToast("Tenant PIN removed");
  });
  els.tenantList.addEventListener("click", (event) => {
    const detailsBtn = event.target.closest(".details-tenant-button[data-tenant-id]");
    if (detailsBtn) { openUnitDetailsDialog(detailsBtn.dataset.tenantId); return; }
    const moveBtn = event.target.closest(".moveout-tenant-button[data-tenant-id]");
    if (moveBtn) { openMoveOutDialog(moveBtn.dataset.tenantId); return; }
    const inviteBtn = event.target.closest(".invite-tenant-button[data-tenant-id]");
    if (inviteBtn) { openInviteDialog(inviteBtn.dataset.tenantId); return; }
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
  els.toggleDateFilter.addEventListener("click", () => {
    const open = els.dateRangeInputs.classList.toggle("hidden");
    els.toggleDateFilter.setAttribute("aria-expanded", String(!open));
    els.toggleDateFilter.classList.toggle("is-active", !open);
    // Collapsing the date row also clears any active date filter so nothing
    // keeps filtering invisibly.
    if (open && (els.ledgerDateFrom.value || els.ledgerDateTo.value)) {
      els.ledgerDateFrom.value = "";
      els.ledgerDateTo.value = "";
      renderLedger();
    }
  });
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
    const mainRow = event.target.closest(".ledger-row-main");
    if (mainRow) {
      // Tap a row to reveal its details + actions (Delete never one tap away).
      mainRow.closest(".ledger-item").classList.toggle("is-open");
    }
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
    if (els.transactionCategory.value === "Payments" && !editingExpenseId) applyTransactionCategoryDefaults();
    else if (els.transactionCategory.value === "Opening Balance") updateTransactionDirectionLabels();
  });
  els.transactionMonth.addEventListener("change", () => { if (els.transactionCategory.value === "Payments" && !editingExpenseId) applyTransactionCategoryDefaults(); });
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
  els.transactionAmount.addEventListener("input", updateExpenseConversionPreview);
  els.transactionCurrency.addEventListener("change", updateExpenseConversionPreview);
  els.currencyToggle.addEventListener("click", (event) => {
    const btn = event.target.closest("button[data-currency]");
    if (btn) setTransactionCurrency(btn.dataset.currency);
  });
  els.transactionForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    setTransactionFormBusy(true);
    try {
      const transactions = createTransactionsFromForm();
      const transaction = transactions[0];
      const editingIndex = editingExpenseId
        ? state.transactions.findIndex((entry) => entry.id === editingExpenseId)
        : -1;
      const existingTransaction = editingIndex >= 0 ? state.transactions[editingIndex] : null;
      let invoiceUploadError = null;
      if (editingExpenseId && !existingTransaction) throw new Error("That entry was not found");
      assertTransactionsOpen(transactions, existingTransaction);
      if (!existingTransaction) {
        const duplicate = findDuplicatePayment(transactions);
        if (duplicate && !window.confirm(tr("{name} already has a payment of {amount} on {date}. Record this one too?", {
          name: tenantName(duplicate.match.tenantId), amount: formatUsd(transactionNetUsd(duplicate.match)), date: formatDateLabel(duplicate.match.date),
        }))) return;
      }
      if (existingTransaction?.category === "Payments") {
        // Editing a payment keeps its id, receipt number and proof photo.
        transaction.id = existingTransaction.id;
        transaction.receiptRef = existingTransaction.receiptRef || transaction.receiptRef;
        transaction.paymentGroupId = existingTransaction.paymentGroupId || transaction.paymentGroupId;
        transaction.sourceRow = existingTransaction.sourceRow || null;
        transaction.invoiceAttachment = existingTransaction.invoiceAttachment || null;
      } else if (existingTransaction) {
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
          const previous = existingTransaction?.invoiceAttachment;
          transaction.invoiceAttachment = await uploadExpenseInvoice(transaction, invoiceFile);
          if (previous?.storagePath && previous.storagePath !== transaction.invoiceAttachment?.storagePath) deleteInvoicePhoto(previous);
        } catch (error) {
          invoiceUploadError = error;
        }
      }
      if (!existingTransaction && transaction.category === "Expenses" && els.recurringExpenseInput.checked) {
        transaction.recurringId = addRecurringTemplateFrom(transaction).id;
      }
      // Recording a tenant's declared payment: keep their proof photo on it.
      if (!existingTransaction && transaction.category === "Payments" && pendingDeclarationProof) {
        transaction.invoiceAttachment = pendingDeclarationProof;
      }
      pendingDeclarationProof = null;
      if (existingTransaction) state.transactions[editingIndex] = { ...existingTransaction, ...transaction };
      else {
        state.transactions.push(...transactions);
      }
      if (!saveState()) return;
      closeDialog(els.transactionDialog);
      if (!existingTransaction) {
        transactions.filter(isReceiptablePayment).forEach((payment) => notifyTenants(payment.tenantId,
          tr("Payment received"), tr("{amount} recorded — thank you.", { amount: formatUsd(transactionNetUsd(payment)) })));
      }
      selectedMonth = transactions.find((entry) => entry.forMonth)?.forMonth || selectedMonth;
      renderAll();
      if (existingTransaction?.category === "Payments") {
        showToast("Payment updated. Same receipt number");
      } else if (existingTransaction) {
        showToast(
          invoiceUploadError
            ? tr("Expense updated. Invoice upload failed: {msg}", { msg: invoiceUploadError.message })
            : invoiceFile
              ? "Expense updated. Invoice replaced"
              : "Expense updated",
        );
      } else if (transactions.some(isReceiptablePayment)) {
        showToast("Payment added. Receipt saved");
      } else if (invoiceUploadError) {
        showToast(tr("Expense saved. Invoice upload failed: {msg}", { msg: invoiceUploadError.message }));
      } else if (hasInvoicePhoto(transaction.invoiceAttachment)) {
        showToast("Expense added. Invoice uploaded");
      } else {
        showToast("Transaction added");
      }
      editingExpenseId = null;
      els.transactionDialogTitle.textContent = t("tx.addTitle");
      els.transactionSubmitButton.textContent = t("common.add");
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
  if (els.languageInput) els.languageInput.addEventListener("change", () => setLanguage(els.languageInput.value));
  els.removeOwnerPasswordButton.addEventListener("click", () => {
    if (!window.confirm(tr("Remove the owner password? Anyone opening the app can then enter as owner."))) return;
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
    // Only present in builds without a bundled cloud-config.js.
    if (els.invoiceUploadUrlInput) state.settings.invoiceUploadUrl = els.invoiceUploadUrlInput.value.trim();
    if (els.supabaseUrlInput) state.settings.supabaseUrl = els.supabaseUrlInput.value.trim().replace(/\/+$/, "");
    if (els.supabaseAnonKeyInput) state.settings.supabaseAnonKey = els.supabaseAnonKeyInput.value.trim();
    if (els.cloudSpreadsheetIdInput) state.settings.cloudSpreadsheetId = els.cloudSpreadsheetIdInput.value.trim();
    if (els.invoiceUploadFolderIdInput) state.settings.invoiceUploadFolderId = els.invoiceUploadFolderIdInput.value.trim();
    if (els.syncSecretInput) state.settings.syncSecret = els.syncSecretInput.value.trim();
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
  els.shareSyncCodeButton.addEventListener("click", openInviteDialog);
  els.connectBuildingButton.addEventListener("click", () => {
    els.connectCodeInput.value = "";
    openDialog(els.connectDialog);
    setTimeout(() => els.connectCodeInput.focus(), 50);
  });
  els.closeConnectDialog.addEventListener("click", () => closeDialog(els.connectDialog));
  els.cancelConnectButton.addEventListener("click", () => closeDialog(els.connectDialog));
  els.connectSubmitButton.addEventListener("click", () => {
    const code = els.connectCodeInput.value.trim();
    // Invite codes are short; anything long is a legacy access code.
    if (/^[A-Za-z0-9]{6,12}$/.test(code)) joinWithInviteCode(code);
    else applySyncCode(code);
  });
  els.loginUnlinkBtn.addEventListener("click", unlinkTenantPhone);
  els.closeInviteDialog.addEventListener("click", () => closeDialog(els.inviteDialog));
  els.inviteCreateButton.addEventListener("click", createInviteCode);
  els.inviteShareButton.addEventListener("click", shareInviteCode);
  els.inviteTenantSelect.addEventListener("change", resetInviteResult);
  els.cloudBackupsButton.addEventListener("click", openBackupsDialog);
  els.whatsappGroupButton.addEventListener("click", postBalancesToGroup);
  els.whatsappGroupTextButton?.addEventListener("click", postBalancesAsText);
  els.inviteWhatsAppButton.addEventListener("click", sendInviteOnWhatsApp);
  els.tenantCoefficientInput.addEventListener("input", renderTenantCoefficientHint);
  els.recurringSettingsButton.addEventListener("click", () => openRecurringDialog());
  els.recurringAddButton.addEventListener("click", addTickedRecurringExpenses);
  els.closeRecurringDialog.addEventListener("click", () => closeDialog(els.recurringDialog));
  els.declareSubmitButton.addEventListener("click", submitDeclaration);
  els.declareCancelButton.addEventListener("click", () => closeDialog(els.declareDialog));
  els.closeDeclareDialog.addEventListener("click", () => closeDialog(els.declareDialog));
  els.closeBackupsDialog.addEventListener("click", () => closeDialog(els.backupsDialog));
  els.downloadBackupButton.addEventListener("click", downloadBackup);
  els.downloadBackupPhotosButton?.addEventListener("click", downloadBackupWithPhotos);
  els.fullExportButton.addEventListener("click", handleFullExcelExport);
  els.restoreBackupButton.addEventListener("click", () => els.restoreBackupInput.click());
  els.restoreBackupInput.addEventListener("change", () => {
    const file = els.restoreBackupInput.files[0];
    els.restoreBackupInput.value = "";
    restoreFromBackupFile(file);
  });
  els.syncChip.addEventListener("click", () => {
    if (lastSyncProblem) showToast(lastSyncProblem, 6000);
    if (hasCloudConfig() && !cloudSaveInFlight) saveCloudState({ silent: Boolean(lastSyncProblem) });
  });
  window.addEventListener("online", () => { if (hasCloudConfig()) saveCloudState({ silent: true }); });
  window.addEventListener("offline", () => setSyncChip("offline"));
  els.zeroAccountsButton.addEventListener("click", zeroAccounts);

  els.startFreshButton.addEventListener("click", () => {
    if (!window.confirm(tr("Erase everything? This permanently deletes all tenants, payments, expenses and settings on this device and starts setup over. This cannot be undone."))) return;
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
      weighting: els.pollWeightingInput?.value === "share" ? "share" : "unit",
      ...(els.pollClosesInput?.value ? { closesOn: els.pollClosesInput.value } : {}),
      ...(Number(els.pollQuorumInput?.value || 0) > 0 ? { quorumPct: Math.min(100, Number(els.pollQuorumInput.value)) } : {}),
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
  els.deleteGeneratorReadingsButton.addEventListener("click", () => {
    const month = monthIso(els.generatorBillMonth.value);
    if (month && deleteServiceReadings("generator", month)) closeDialog(els.generatorBillDialog);
  });
  els.generatorBillList.addEventListener("click", (e) => {
    const readBtn = e.target.closest(".enter-readings-btn[data-month]");
    if (readBtn) { openGeneratorReadingsDialog(readBtn.dataset.month); return; }
  });

  els.loginOwnerTab.addEventListener("click", () => {
    els.loginOwnerTab.classList.add("active");
    els.loginTenantTab.classList.remove("active");
    els.loginOwnerForm.classList.remove("hidden");
    els.loginTenantForm.classList.add("hidden");
    els.loginError.classList.add("hidden");
    renderOwnerLoginForm();
    focusOwnerLoginField();
  });
  els.loginTenantTab.addEventListener("click", () => {
    els.loginTenantTab.classList.add("active");
    els.loginOwnerTab.classList.remove("active");
    els.loginTenantForm.classList.remove("hidden");
    els.loginOwnerForm.classList.add("hidden");
    els.loginError.classList.add("hidden");
    els.loginSubmitBtn.classList.remove("hidden");
    renderTenantLoginForm();
    if (!isTenantSession()) els.loginPinInput.focus();
  });
  els.loginSubmitBtn.addEventListener("click", attemptLogin);
  els.loginPasswordInput.addEventListener("keydown", (e) => { if (e.key === "Enter") attemptLogin(); });
  els.loginEmailInput.addEventListener("keydown", (e) => { if (e.key === "Enter") els.loginPasswordInput.focus(); });
  els.loginSwitchAccountBtn.addEventListener("click", () => {
    // Forget this device's sign-in and show the email + password form.
    const token = authSession?.access_token;
    saveAuthSession(null);
    if (token) authRequest("logout", {}, token).catch(() => {});
    els.loginError.classList.add("hidden");
    renderOwnerLoginForm();
    focusOwnerLoginField();
  });
  els.loginDeviceFallbackBtn.addEventListener("click", () => {
    ownerLoginMode = "device";
    els.loginError.classList.add("hidden");
    renderOwnerLoginForm();
    focusOwnerLoginField();
  });
  els.loginBackToAccountBtn.addEventListener("click", () => {
    ownerLoginMode = "google";
    els.loginError.classList.add("hidden");
    renderOwnerLoginForm();
    focusOwnerLoginField();
  });
  els.loginEmailModeBtn.addEventListener("click", () => {
    ownerLoginMode = "email";
    els.loginError.classList.add("hidden");
    renderOwnerLoginForm();
    focusOwnerLoginField();
  });
  els.googleSignInBtn.addEventListener("click", startGoogleSignIn);
  els.ownerSignOutButton.addEventListener("click", signOutOwner);
  els.loginPinInput.addEventListener("keydown", (e) => { if (e.key === "Enter") attemptLogin(); });
  els.logoutButton.addEventListener("click", logout);
  els.runWizardButton.addEventListener("click", openSetupWizard);
  els.wizardCollectionMode.addEventListener("change", applyWizardCollectionModeVisibility);
  if (els.wizardLanguage) els.wizardLanguage.addEventListener("change", () => setLanguage(els.wizardLanguage.value));
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

// ═══════════════════════════════════════════════════════════════════════════
// v148 — running the building long-term
//   Month locks and the change history both come from one before/after diff
//   taken in saveState. Then: cash counts, generator fuel efficiency and
//   service reminders, notices, problem reports, move-outs,
//   extra administrators, reports (spending trends, annual report),
//   share-weighted polls, phone notifications and a keep-alive watch.
// ═══════════════════════════════════════════════════════════════════════════

Object.assign(els, {
  toolDialog: document.querySelector("#toolDialog"),
  toolDialogTitle: document.querySelector("#toolDialogTitle"),
  toolDialogBody: document.querySelector("#toolDialogBody"),
  closeToolDialog: document.querySelector("#closeToolDialog"),
  noticesList: document.querySelector("#noticesList"),
  newNoticeButton: document.querySelector("#newNoticeButton"),
  issuesList: document.querySelector("#issuesList"),
  newIssueButton: document.querySelector("#newIssueButton"),
  reportsBody: document.querySelector("#reportsBody"),
  tenantNoticesPanel: document.querySelector("#tenantNoticesPanel"),
  tenantNoticesList: document.querySelector("#tenantNoticesList"),
  pushStatusText: document.querySelector("#pushStatusText"),
  pushToggleButton: document.querySelector("#pushToggleButton"),
  adminsButton: document.querySelector("#adminsButton"),
  transactionLitres: document.querySelector("#transactionLitres"),
  litresWrap: document.querySelector(".litres-wrap"),
  generatorEngineHours: document.querySelector("#generatorEngineHours"),
  generatorExtras: document.querySelector("#generatorExtras"),
  pollWeightingInput: document.querySelector("#pollWeightingInput"),
  pollClosesInput: document.querySelector("#pollClosesInput"),
  pollQuorumInput: document.querySelector("#pollQuorumInput"),
  maintenanceList: document.querySelector("#maintenanceList"),
  inviteAllButton: document.querySelector("#inviteAllButton"),
  readInvoiceButton: document.querySelector("#readInvoiceButton"),
  supplierList: document.querySelector("#suppliersList"),
  newSupplierButton: document.querySelector("#newSupplierButton"),
  documentList: document.querySelector("#documentsList"),
  newDocumentButton: document.querySelector("#newDocumentButton"),
  meetingList: document.querySelector("#meetingsList"),
  newMeetingButton: document.querySelector("#newMeetingButton"),
  whoPaidButton: document.querySelector("#whoPaidButton"),
  methodField: document.querySelector(".method-field"),
  paidFromField: document.querySelector(".paidfrom-field"),
  transactionMethod: document.querySelector("#transactionMethod"),
  transactionPaidFrom: document.querySelector("#transactionPaidFrom"),
  newMaintenanceButton: document.querySelector("#newMaintenanceButton"),
});

// ── Small DOM + dialog helpers ──────────────────────────────────────────────
function mk(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  Object.entries(props || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === false) return;
    if (key === "className") node.className = value;
    else if (key === "text") node.textContent = value;
    else if (key === "dataset") Object.assign(node.dataset, value);
    else if (key === "value") node.value = value;
    else if (key === "checked") node.checked = Boolean(value);
    else if (key.startsWith("on") && typeof value === "function") node.addEventListener(key.slice(2), value);
    else node.setAttribute(key, value === true ? "" : String(value));
  });
  children.flat(Infinity).forEach((child) => {
    if (child === null || child === undefined || child === false) return;
    node.append(child instanceof Node ? child : String(child));
  });
  return node;
}

function newId(prefix) {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

function field(label, input, note) {
  return mk("label", {}, mk("span", { text: label }), input, note ? mk("small", { className: "field-hint", text: note }) : null);
}

function textInput(value = "", attrs = {}) {
  return mk("input", { type: "text", value, ...attrs });
}

function numberInput(value = "", attrs = {}) {
  return mk("input", { type: "number", inputmode: "decimal", step: "0.01", min: "0", value: value === 0 ? "0" : value || "", ...attrs });
}

function selectInput(options, value) {
  const select = mk("select", {}, options.map(([v, label]) => mk("option", { value: v, text: label })));
  if (value !== undefined && value !== null) select.value = value;
  return select;
}

function checkboxRow(label, checked = false) {
  const input = mk("input", { type: "checkbox", checked });
  return { row: mk("label", { className: "checkbox-row" }, input, mk("span", { text: label })), input };
}

function primaryButton(text, onclick) {
  return mk("button", { type: "button", className: "primary-button", text, onclick });
}

function secondaryButton(text, onclick) {
  return mk("button", { type: "button", className: "secondary-button", text, onclick });
}

function miniButton(text, onclick, extra = "") {
  return mk("button", { type: "button", className: `mini-button ${extra}`.trim(), text, onclick });
}

function note(text, extra = "") {
  return mk("p", { className: `settings-note ${extra}`.trim(), text });
}

function openToolDialog(title, ...nodes) {
  els.toolDialogTitle.textContent = title;
  els.toolDialogBody.replaceChildren(...nodes.flat().filter(Boolean));
  if (!els.toolDialog.open) openDialog(els.toolDialog);
}

function closeToolDialog() {
  closeDialog(els.toolDialog);
}

// Toasts raised by a refused save win over the caller's own "Saved" toast.
function showPriorityToast(message, durationMs = 5000) {
  showToast(message, durationMs);
  showToast.heldUntil = Date.now() + durationMs;
}

function isAdminView() {
  return sessionMode === "owner";
}

// ── Roles: owner, view-only administrator, tenant ───────────────────────────
function isViewerSession() {
  return Boolean(authSession) && authSession.role === "viewer";
}

function isAdminSession() {
  return Boolean(authSession) && authSession.role !== "tenant";
}

// ── The before/after diff behind month locks and the change history ────────
const AUDIT_LIMIT = 800;
const AUDIT_BULK = 40;
const TRACKED_COLLECTIONS = [
  ["transactions", "transaction"],
  ["tenants", "tenant"],
  ["buildingProjects", "project"],
  ["serviceReadings", "reading"],
  ["recurringExpenses", "recurring"],
  ["cashChecks", "cashCheck"],
  ["announcements", "notice"],
  ["issues", "issue"],
  ["generatorServices", "genService"],
  ["maintenanceTasks", "maintenance"],
  ["suppliers", "supplier"],
  ["documents", "document"],
  ["meetings", "meeting"],
  ["monthLocks", "monthLock"],
  ["polls", "poll"],
];

function comparableRecord(kind, record) {
  if (kind === "poll") {
    const { votes, voteCounts, ...rest } = record;
    return JSON.stringify(rest);
  }
  return JSON.stringify(record);
}

function settingsSnapshot(s) {
  return {
    name: s?.building?.name || "",
    collectionMode: s?.settings?.collectionMode || "actual",
    defaultDueUsd: Number(s?.settings?.defaultDueUsd || 0),
    lbpPerUsd: Number(s?.settings?.lbpPerUsd || 0),
  };
}

// Every record added, changed or removed between two states.
function diffStates(prev, next) {
  const changes = [];
  TRACKED_COLLECTIONS.forEach(([key, kind]) => {
    const before = new Map((prev?.[key] || []).filter((r) => r?.id).map((r) => [r.id, r]));
    const after = new Map((next?.[key] || []).filter((r) => r?.id).map((r) => [r.id, r]));
    after.forEach((record, id) => {
      const old = before.get(id);
      if (!old) changes.push({ kind, id, before: null, after: record });
      else if (comparableRecord(kind, old) !== comparableRecord(kind, record)) changes.push({ kind, id, before: old, after: record });
    });
    before.forEach((record, id) => {
      if (!after.has(id)) changes.push({ kind, id, before: record, after: null });
    });
  });
  const budgetBefore = new Map((prev?.monthlyExpected || []).map((e) => [e.month, e]));
  const budgetAfter = new Map((next?.monthlyExpected || []).map((e) => [e.month, e]));
  new Set([...budgetBefore.keys(), ...budgetAfter.keys()]).forEach((month) => {
    const a = budgetBefore.get(month) || null;
    const b = budgetAfter.get(month) || null;
    if (JSON.stringify(a) !== JSON.stringify(b)) changes.push({ kind: "budget", id: month, before: a, after: b });
  });
  const sa = settingsSnapshot(prev);
  const sb = settingsSnapshot(next);
  if (JSON.stringify(sa) !== JSON.stringify(sb)) changes.push({ kind: "settings", id: "settings", before: sa, after: sb });
  return changes;
}

// The accounting months a record belongs to. Payments and expenses count by
// their date; generator/water costs also by the month they are billed in.
function recordMonths(kind, record) {
  if (!record) return [];
  if (kind === "transaction") {
    const months = [monthKey(record.date || record.forMonth || "")];
    if (record.serviceType && record.forMonth) months.push(monthKey(record.forMonth));
    return months.filter(Boolean);
  }
  if (kind === "reading") return [monthKey(record.forMonth || "")].filter(Boolean);
  if (kind === "budget") return [monthKey(record.month || "")].filter(Boolean);
  return [];
}

function lockedMonthIn(changes) {
  for (const change of changes) {
    for (const month of [...recordMonths(change.kind, change.before), ...recordMonths(change.kind, change.after)]) {
      if (isMonthClosed(month)) return month;
    }
  }
  return null;
}

function auditActor() {
  if (authSession?.email) return authSession.email;
  return sessionMode === "owner" ? "owner" : "";
}

function appendAudit(changes) {
  const at = new Date().toISOString();
  const by = auditActor();
  state.auditLog ||= [];
  if (changes.length > AUDIT_BULK) {
    state.auditLog.push({ id: newId("log"), at, by, action: "bulk", kind: "many", count: changes.length });
  } else {
    changes.forEach((change) => {
      state.auditLog.push({
        id: newId("log"),
        at,
        by,
        action: change.before ? (change.after ? "changed" : "deleted") : "added",
        kind: change.kind,
        recordId: change.id,
        before: change.before,
        after: change.after,
      });
    });
  }
  state.auditLog = state.auditLog.slice(-AUDIT_LIMIT);
}

// Called by saveState before anything is written. Compares with what this
// device last stored. Returns false (and puts the stored copy back) when the
// change is not allowed: a view-only administrator, or a closed month.
function guardAndAuditSave() {
  if (sessionMode !== "owner") return true;
  let stored = null;
  try { stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"); } catch { stored = null; }
  if (!stored) return true;
  const previous = hydrateState(stored);
  if (isViewerSession()) {
    state = previous;
    showPriorityToast("You have view-only access. Changes aren't saved.");
    return false;
  }
  const changes = diffStates(previous, state);
  if (!changes.length) return true;
  const closed = lockedMonthIn(changes);
  if (closed) {
    state = previous;
    showPriorityToast(tr("{month} is closed. Reopen it in Reports before changing it.", { month: formatMonth(monthIso(closed)) }));
    return false;
  }
  appendAudit(changes);
  return true;
}

// ── Month locks ─────────────────────────────────────────────────────────────
function isMonthClosed(month) {
  const key = monthKey(month || "");
  return Boolean(key) && (state.monthLocks || []).some((lock) => lock.id === key && lock.closed);
}

function closedMonthError(month) {
  return new Error(tr("{month} is closed. Reopen it in Reports before changing it.", { month: formatMonth(monthIso(monthKey(month))) }));
}

// Throws before a form is saved, so the dialog stays open with its message.
function assertTransactionsOpen(...transactions) {
  transactions.flat().filter(Boolean).forEach((t) => {
    recordMonths("transaction", t).forEach((m) => { if (isMonthClosed(m)) throw closedMonthError(m); });
  });
}

function setMonthClosed(month, closed) {
  const key = monthKey(month);
  if (!closed && !window.confirm(tr("Reopen {month}? Its figures can then be changed again.", { month: formatMonth(monthIso(key)) }))) return;
  state.monthLocks ||= [];
  const lock = state.monthLocks.find((l) => l.id === key);
  const stamp = { closed, at: new Date().toISOString(), by: auditActor() };
  if (lock) Object.assign(lock, stamp);
  else state.monthLocks.push({ id: key, ...stamp });
  if (!saveState()) return;
  renderAll();
  showToast(closed ? tr("{month} closed", { month: formatMonth(monthIso(key)) }) : tr("{month} reopened", { month: formatMonth(monthIso(key)) }));
}

// The month to suggest closing: last month, once a few days have passed.
function monthToClose() {
  const last = getLastCompletedMonth();
  if (new Date().getDate() < 5) return null;
  if (isMonthClosed(last)) return null;
  const hasActivity = state.transactions.some((t) => monthKey(transactionDateValue(t)) === monthKey(last));
  return hasActivity ? last : null;
}

// ── Change history ──────────────────────────────────────────────────────────
const AUDIT_KIND_LABELS = {
  transaction: "Entry", tenant: "Tenant", project: "Project", reading: "Meter readings", recurring: "Monthly expense",
  cashCheck: "Cash count", notice: "Notice", issue: "Problem", genService: "Generator service",
  monthLock: "Month lock", maintenance: "Maintenance job", supplier: "Supplier", document: "Document", meeting: "Meeting", poll: "Poll", budget: "Monthly budget", settings: "Settings", many: "Many records",
};

function describeRecord(kind, record) {
  if (!record) return "";
  switch (kind) {
    case "transaction": {
      const who = record.tenantId ? tenantName(record.tenantId) || tr("(removed tenant)") : "";
      const amount = formatUsd(Math.abs(transactionNetUsd(record)));
      return [tr(record.category || ""), who || record.description || "", amount, record.date ? formatDateLabel(record.date) : ""].filter(Boolean).join(" · ");
    }
    case "tenant": return `${record.name || ""} · ${tr("Unit {unit}", { unit: record.unit || "" })}`;
    case "project": return record.name || "";
    case "reading": return formatMonth(record.forMonth);
    case "recurring": return record.description || "";
    case "cashCheck": return `${formatDateLabel(record.date)} · ${formatUsd(record.countedUsd)}`;
    case "notice": return record.title || "";
    case "issue": return record.title || "";
    case "genService": return `${formatDateLabel(record.date)} · ${record.work || ""}`;
    case "monthLock": return `${formatMonth(monthIso(record.id))} · ${record.closed ? tr("Closed") : tr("Open")}`;
    case "poll": return record.title || "";
    case "supplier": return record.name || "";
    case "document": return record.title || "";
    case "meeting": return `${record.title || ""} · ${record.date ? formatDateLabel(record.date) : ""}`;
    case "maintenance": return `${record.title || ""} · ${record.nextDue ? formatDateLabel(record.nextDue) : ""}`;
    case "budget": return `${formatMonth(record.month)} · ${formatUsd(record.expectedUsd)}`;
    case "settings": return tr("Building settings");
    default: return "";
  }
}

const AUDIT_FIELD_LABELS = {
  debitUsd: "Amount USD", creditUsd: "Amount USD", debitLbp: "Amount LBP", creditLbp: "Amount LBP", description: "Description",
  date: "Date", forMonth: "Month", tenantId: "Tenant", supplier: "Supplier", invoice: "Invoice", expenseCategory: "Expense category",
  name: "Name", unit: "Unit", coefficient: "Coefficient", breakerAmps: "Breaker (A)", phone: "Phone", active: "Active",
  status: "Status", title: "Title", expectedUsd: "Expected (USD)", collectionMode: "Collection mode", defaultDueUsd: "Monthly budget",
  lbpPerUsd: "LBP per USD", litres: "Litres", totalUsd: "Total", closed: "Closed", amount: "Amount",
};
const AUDIT_SKIP_FIELDS = new Set(["balanceUsd", "balanceLbp", "shares", "sourceRow", "invoiceAttachment", "pinHash", "updatedAt", "lines", "votes", "voteCounts", "at", "by"]);

function auditValue(key, value) {
  if (value === null || value === undefined || value === "") return "—";
  if (key === "tenantId") return tenantName(value) || String(value);
  if (/Usd$/.test(key)) return formatUsd(value);
  if (/Lbp$/.test(key)) return formatLbp(value);
  if (typeof value === "boolean") return value ? tr("Yes") : tr("No");
  if (typeof value === "object") return "…";
  return String(value);
}

function auditFieldChanges(before, after) {
  if (!before || !after) return [];
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  const lines = [];
  keys.forEach((key) => {
    if (AUDIT_SKIP_FIELDS.has(key)) return;
    if (JSON.stringify(before[key] ?? null) === JSON.stringify(after[key] ?? null)) return;
    lines.push(`${tr(AUDIT_FIELD_LABELS[key] || key)}: ${auditValue(key, before[key])} → ${auditValue(key, after[key])}`);
  });
  return lines.slice(0, 6);
}

function canUndoAudit(entry) {
  if (!entry || entry.undone) return false;
  if (entry.kind === "transaction") return entry.action === "changed" || entry.action === "deleted";
  if (entry.kind === "tenant") return entry.action === "changed";
  return false;
}

// Undo puts the old version back. A deleted entry comes back under a new id,
// because the old id is remembered as deleted on every device.
function undoAudit(entryId) {
  const entry = (state.auditLog || []).find((e) => e.id === entryId);
  if (!canUndoAudit(entry)) return;
  if (!window.confirm(tr("Put back the earlier version of this record?\n\n{label}", { label: describeRecord(entry.kind, entry.before) }))) return;
  if (entry.kind === "transaction") {
    if (entry.action === "deleted") {
      state.transactions.push({ ...entry.before, id: `${entry.before.id}-r${Date.now().toString(36)}`, invoiceAttachment: null });
    } else {
      const index = state.transactions.findIndex((t) => t.id === entry.recordId);
      if (index < 0) { showToast("That record no longer exists"); return; }
      state.transactions[index] = { ...entry.before };
    }
  } else if (entry.kind === "tenant") {
    const index = state.tenants.findIndex((t) => t.id === entry.recordId);
    if (index < 0) { showToast("That record no longer exists"); return; }
    state.tenants[index] = { ...entry.before, pinHash: state.tenants[index].pinHash || "" };
  }
  entry.undone = true;
  if (!saveState()) { entry.undone = false; return; }
  populateTenantSelect();
  renderAll();
  openHistoryDialog();
  showToast("Earlier version restored");
}

let historyShown = 40;
function openHistoryDialog() {
  const entries = (state.auditLog || []).slice().reverse();
  if (!entries.length) {
    openToolDialog(tr("Change history"), note(tr("Nothing recorded yet. From now on every addition, change and deletion is listed here with the date and who made it.")));
    return;
  }
  const list = mk("div", { className: "history-list" }, entries.slice(0, historyShown).map((entry) => {
    const when = new Date(entry.at);
    const stamp = `${formatDateLabel(localDateInputFrom(when))} ${when.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    const actionText = { added: tr("Added"), changed: tr("Changed"), deleted: tr("Deleted"), bulk: tr("Replaced") }[entry.action] || entry.action;
    const label = entry.action === "bulk"
      ? tr("{n} records at once (restore, import or clear)", { n: entry.count })
      : describeRecord(entry.kind, entry.after || entry.before);
    const row = mk("div", { className: `history-row history-${entry.action}` },
      mk("div", { className: "history-head" },
        mk("strong", { text: `${actionText} · ${tr(AUDIT_KIND_LABELS[entry.kind] || entry.kind)}` }),
        mk("span", { text: stamp })),
      mk("div", { className: "history-label", text: label }),
      auditFieldChanges(entry.before, entry.after).map((line) => mk("div", { className: "history-change", text: line })),
      entry.by ? mk("div", { className: "history-by", text: tr("by {who}", { who: entry.by }) }) : null,
      canUndoAudit(entry) && !isViewerSession() ? miniButton(tr("Undo"), () => undoAudit(entry.id)) : null,
      entry.undone ? mk("div", { className: "history-by", text: tr("Undone") }) : null);
    return row;
  }));
  const more = entries.length > historyShown
    ? secondaryButton(tr("Show more"), () => { historyShown += 60; openHistoryDialog(); })
    : null;
  openToolDialog(tr("Change history"), note(tr("Every addition, change and deletion, newest first.")), list, more);
}

function localDateInputFrom(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

// ── Cash counts ─────────────────────────────────────────────────────────────
// What the books say the building should hold on a date: every cash movement
// up to that day (tenant-tied opening balances are not cash).
function expectedCashOn(date) {
  return roundUsd(state.transactions
    .filter((t) => !(t.category === "Opening Balance" && t.tenantId))
    .filter((t) => String(transactionDateValue(t)) <= date)
    .reduce((sum, t) => sum + transactionNetUsd(t), 0));
}

function lastCashCheck() {
  return (state.cashChecks || []).slice().sort((a, b) => String(b.date).localeCompare(String(a.date)))[0] || null;
}

function cashCheckDue() {
  if (!state.transactions.length) return null;
  const last = lastCashCheck();
  if (!last) return { last: null };
  const days = (Date.parse(localDateInput()) - Date.parse(last.date)) / 86400000;
  return days > 35 ? { last } : null;
}

function openCashCheckDialog() {
  const rate = getConversionRate();
  const date = mk("input", { type: "date", value: localDateInput() });
  const cashUsd = numberInput("");
  const cashLbp = numberInput("", { step: "1000" });
  const bankUsd = numberInput("");
  const memo = textInput("", { placeholder: tr("Optional") });
  const result = mk("div", { className: "cash-result" });
  const update = () => {
    const counted = roundUsd(Number(cashUsd.value || 0) + Number(bankUsd.value || 0) + Number(cashLbp.value || 0) / rate);
    const expected = expectedCashOn(date.value || localDateInput());
    const diff = roundUsd(counted - expected);
    const byAccount = expectedByAccount(date.value || localDateInput());
    const countedCash = roundUsd(Number(cashUsd.value || 0) + Number(cashLbp.value || 0) / rate);
    const countedBank = roundUsd(Number(bankUsd.value || 0));
    result.replaceChildren(
      mk("div", {}, mk("span", { text: tr("Cash box: counted {counted}, books {books}", { counted: formatUsd(countedCash), books: formatUsd(byAccount.cash) }) }),
        mk("b", { className: Math.abs(countedCash - byAccount.cash) < 1 ? "tnum cash-ok" : "tnum cash-gap", text: formatUsd(roundUsd(countedCash - byAccount.cash)) })),
      mk("div", {}, mk("span", { text: tr("Bank & wallets: counted {counted}, books {books}", { counted: formatUsd(countedBank), books: formatUsd(byAccount.bank) }) }),
        mk("b", { className: Math.abs(countedBank - byAccount.bank) < 1 ? "tnum cash-ok" : "tnum cash-gap", text: formatUsd(roundUsd(countedBank - byAccount.bank)) })),
      mk("div", {}, mk("span", { text: tr("You counted") }), mk("b", { className: "tnum", text: formatUsd(counted) })),
      mk("div", {}, mk("span", { text: tr("The books say") }), mk("b", { className: "tnum", text: formatUsd(expected) })),
      mk("div", { className: Math.abs(diff) < 1 ? "cash-ok" : "cash-gap" },
        mk("span", { text: Math.abs(diff) < 1 ? tr("Matches") : diff > 0 ? tr("More than expected") : tr("Missing") }),
        mk("b", { className: "tnum", text: formatUsd(diff) })),
    );
    return { counted, expected, diff };
  };
  [date, cashUsd, cashLbp, bankUsd].forEach((input) => input.addEventListener("input", update));
  update();
  const save = () => {
    const { counted, expected, diff } = update();
    if (!(Number(cashUsd.value || 0) || Number(cashLbp.value || 0) || Number(bankUsd.value || 0))) { showToast("Enter what you counted"); return; }
    (state.cashChecks ||= []).push({
      id: newId("cash"), date: date.value || localDateInput(), cashUsd: Number(cashUsd.value || 0), cashLbp: Number(cashLbp.value || 0),
      bankUsd: Number(bankUsd.value || 0), rate, countedUsd: counted, expectedUsd: expected, differenceUsd: diff, note: memo.value.trim(), by: auditActor(),
    });
    if (!saveState()) return;
    closeToolDialog();
    renderAll();
    showToast(Math.abs(diff) < 1 ? "Cash count saved — it matches the books" : tr("Cash count saved — difference {amount}", { amount: formatUsd(diff) }));
  };
  openToolDialog(tr("Count the cash"),
    note(tr("Count the cash box and check the bank balance. The app compares the total with what the books say you should have.")),
    field(tr("Date"), date),
    field(tr("Cash in USD"), cashUsd),
    field(tr("Cash in LBP"), cashLbp, tr("Converted at {rate} LBP/USD", { rate: numberFormat.format(rate) })),
    field(tr("Bank balance (USD)"), bankUsd),
    field(tr("Note"), memo),
    result,
    mk("div", { className: "button-row" }, primaryButton(tr("Save count"), save), secondaryButton(tr("Cancel"), closeToolDialog)));
}

function deleteCashCheck(id) {
  if (!window.confirm(tr("Delete this cash count?"))) return;
  state.cashChecks = (state.cashChecks || []).filter((c) => c.id !== id);
  recordDeletedId("cashChecks", id);
  if (!saveState()) return;
  renderAll();
}

// ── Generator: fuel efficiency ──────────────────────────────────────────────
function generatorEfficiencyRows() {
  return getServiceMonths("generator").map((month) => {
    const dist = computeServiceDistribution("generator", month);
    const litres = state.transactions
      .filter((t) => t.category === "Services Expenses" && t.serviceType === "generator" && t.servicePart !== "maintenance")
      .filter((t) => monthKey(t.forMonth || t.date || "") === monthKey(month))
      .reduce((sum, t) => sum + Number(t.litres || 0), 0);
    const kwh = dist.distributed ? dist.totalKwh : 0;
    const fuelUsd = dist.pools.fuelUsd;
    return {
      month,
      litres,
      kwh,
      fuelUsd,
      kwhPerLitre: litres > 0 && kwh > 0 ? kwh / litres : null,
      usdPerKwh: kwh > 0 && fuelUsd > 0 ? fuelUsd / kwh : null,
      usdPerLitre: litres > 0 && fuelUsd > 0 ? fuelUsd / litres : null,
    };
  });
}

// Compares the latest month with the average of up to three months before it.
// Litres give the real signal (kWh per litre falls with leaks, theft or a
// worn engine); without litres, a jump in cost per kWh is a softer hint.
function generatorEfficiencyWarning(rows = generatorEfficiencyRows()) {
  const withLitres = rows.filter((r) => r.kwhPerLitre);
  if (withLitres.length >= 2) {
    const latest = withLitres[withLitres.length - 1];
    const prior = withLitres.slice(-4, -1);
    const baseline = prior.reduce((s, r) => s + r.kwhPerLitre, 0) / prior.length;
    if (latest.kwhPerLitre < baseline * 0.8) {
      return { kind: "litres", month: latest.month, value: latest.kwhPerLitre, baseline, pct: Math.round((1 - latest.kwhPerLitre / baseline) * 100) };
    }
    return null;
  }
  const withCost = rows.filter((r) => r.usdPerKwh);
  if (withCost.length >= 3) {
    const latest = withCost[withCost.length - 1];
    const prior = withCost.slice(-4, -1);
    const baseline = prior.reduce((s, r) => s + r.usdPerKwh, 0) / prior.length;
    if (latest.usdPerKwh > baseline * 1.35) {
      return { kind: "cost", month: latest.month, value: latest.usdPerKwh, baseline, pct: Math.round((latest.usdPerKwh / baseline - 1) * 100) };
    }
  }
  return null;
}

function generatorWarningText(warning) {
  return warning.kind === "litres"
    ? tr("Generator: {month} gave {value} kWh per litre, {pct}% below usual ({base}). Check for leaks, theft or an engine problem.", { month: formatMonth(warning.month), value: warning.value.toFixed(2), pct: warning.pct, base: warning.baseline.toFixed(2) })
    : tr("Generator: fuel cost per kWh in {month} is {pct}% above usual. Diesel price, or a leak or theft?", { month: formatMonth(warning.month), pct: warning.pct });
}

function buildEfficiencyCard() {
  const rows = generatorEfficiencyRows().slice(-6).reverse();
  if (!rows.length) return null;
  const { card } = buildServiceCardShell(`⛽ ${tr("Fuel efficiency")}`, tr("Last {n} months", { n: rows.length }));
  const table = mk("table", { className: "report-table" },
    mk("thead", {}, mk("tr", {}, [tr("Month"), tr("Litres"), tr("kWh"), tr("kWh / litre"), tr("$ / kWh")].map((h, i) => mk("th", { className: i ? "num" : "", text: h })))),
    mk("tbody", {}, rows.map((r) => mk("tr", {},
      mk("td", { text: formatMonth(r.month) }),
      mk("td", { className: "num", text: r.litres ? numberFormat.format(r.litres) : "—" }),
      mk("td", { className: "num", text: r.kwh ? numberFormat.format(r.kwh) : "—" }),
      mk("td", { className: "num", text: r.kwhPerLitre ? r.kwhPerLitre.toFixed(2) : "—" }),
      mk("td", { className: "num", text: r.usdPerKwh ? `$${r.usdPerKwh.toFixed(3)}` : "—" })))));
  card.append(mk("div", { className: "report-table-wrap" }, table));
  const warning = generatorEfficiencyWarning();
  if (warning) card.append(note(generatorWarningText(warning), "is-warning"));
  if (!rows.some((r) => r.litres)) card.append(note(tr("Tip: type the litres when you record a diesel purchase to see kWh per litre — the clearest sign of leaks or theft.")));
  return card;
}

// ── Generator: service reminders ────────────────────────────────────────────
function latestEngineHours() {
  const fromReadings = (state.serviceReadings || []).map((r) => Number(r.engineHours || 0));
  const fromServices = (state.generatorServices || []).map((s) => Number(s.hours || 0));
  return Math.max(0, ...fromReadings, ...fromServices);
}

function lastGeneratorService() {
  return (state.generatorServices || []).slice().sort((a, b) => String(b.date).localeCompare(String(a.date)))[0] || null;
}

function generatorServiceDue() {
  const last = lastGeneratorService();
  if (!last) return null;
  const hours = latestEngineHours();
  const byHours = Number(last.nextHours || 0) > 0 && hours >= Number(last.nextHours) - 25;
  const byDate = last.nextDate && Date.parse(last.nextDate) - Date.parse(localDateInput()) <= 7 * 86400000;
  if (!byHours && !byDate) return null;
  const overdue = (Number(last.nextHours || 0) > 0 && hours >= Number(last.nextHours)) || (last.nextDate && last.nextDate < localDateInput());
  return { last, hours, overdue };
}

function openGeneratorServiceDialog() {
  const hoursNow = latestEngineHours();
  const intervalHours = Number(state.settings.genServiceHours || 250);
  const intervalDays = Number(state.settings.genServiceDays || 90);
  const date = mk("input", { type: "date", value: localDateInput() });
  const hours = numberInput(hoursNow || "", { step: "0.1" });
  const work = textInput("", { placeholder: tr("Oil and filter change") });
  const cost = numberInput("");
  const nextHours = numberInput(hoursNow ? Math.round(hoursNow + intervalHours) : "", { step: "1" });
  const nextDate = mk("input", { type: "date", value: addDays(localDateInput(), intervalDays) });
  hours.addEventListener("input", () => { if (Number(hours.value) > 0) nextHours.value = Math.round(Number(hours.value) + intervalHours); });
  date.addEventListener("input", () => { if (date.value) nextDate.value = addDays(date.value, intervalDays); });
  const save = () => {
    if (!work.value.trim()) { showToast("Say what was done"); return; }
    const record = {
      id: newId("gsv"), date: date.value || localDateInput(), hours: Number(hours.value || 0), work: work.value.trim(),
      costUsd: Number(cost.value || 0), nextHours: Number(nextHours.value || 0), nextDate: nextDate.value || "",
    };
    (state.generatorServices ||= []).push(record);
    if (Number(hours.value) > 0 && Number(nextHours.value) > Number(hours.value)) state.settings.genServiceHours = Number(nextHours.value) - Number(hours.value);
    if (!saveState()) return;
    closeToolDialog();
    renderAll();
    showToast("Generator service saved");
  };
  const history = (state.generatorServices || []).slice().sort((a, b) => String(b.date).localeCompare(String(a.date))).slice(0, 8);
  openToolDialog(tr("Generator service"),
    note(tr("Record each service. The app reminds you when the next one is due, by running hours or by date — whichever comes first.")),
    field(tr("Date"), date),
    field(tr("Hour meter reading"), hours, hoursNow ? tr("Last known: {hours} h", { hours: numberFormat.format(hoursNow) }) : null),
    field(tr("Work done"), work),
    field(tr("Cost (USD, optional — record the expense separately)"), cost),
    mk("div", { className: "two-col" }, field(tr("Next service at (hours)"), nextHours), field(tr("or by date"), nextDate)),
    mk("div", { className: "button-row" }, primaryButton(tr("Save service"), save), secondaryButton(tr("Cancel"), closeToolDialog)),
    history.length ? mk("div", { className: "history-list compact" }, history.map((s) => mk("div", { className: "history-row" },
      mk("div", { className: "history-head" }, mk("strong", { text: s.work }), mk("span", { text: formatDateLabel(s.date) })),
      mk("div", { className: "history-change", text: [s.hours ? tr("{hours} h", { hours: numberFormat.format(s.hours) }) : "", s.costUsd ? formatUsd(s.costUsd) : ""].filter(Boolean).join(" · ") })))) : null);
}

function addDays(iso, days) {
  const [y, m, d] = String(iso).split("-").map(Number);
  return localDateInputFrom(new Date(y, m - 1, d + Number(days || 0)));
}

function buildGeneratorServiceCard() {
  const last = lastGeneratorService();
  const hours = latestEngineHours();
  const due = generatorServiceDue();
  const meta = last
    ? tr("Last: {date} · {work}", { date: formatDateLabel(last.date), work: last.work })
    : tr("No service recorded yet");
  const { card, header } = buildServiceCardShell(`🔧 ${tr("Generator service")}`, meta);
  if (sessionMode === "owner") header.append(mk("div", { className: "project-card-actions" }, miniButton(tr("Record service"), openGeneratorServiceDialog)));
  const lines = [];
  if (hours) lines.push(tr("Hour meter: {hours} h", { hours: numberFormat.format(hours) }));
  if (last?.nextHours) lines.push(tr("Next at {hours} h", { hours: numberFormat.format(last.nextHours) }));
  if (last?.nextDate) lines.push(tr("or by {date}", { date: formatDateLabel(last.nextDate) }));
  if (lines.length) card.append(note(lines.join(" · ")));
  if (due) card.append(note(due.overdue ? tr("Service is overdue.") : tr("Service is due soon."), "is-warning"));
  return card;
}

function renderGeneratorExtras() {
  if (!els.generatorExtras) return;
  if (sessionMode !== "owner") { els.generatorExtras.replaceChildren(); return; }
  const hasGenerator = getServiceMonths("generator").length > 0 || (state.generatorServices || []).length > 0;
  els.generatorExtras.replaceChildren(...[hasGenerator ? buildGeneratorServiceCard() : null, buildEfficiencyCard()].filter(Boolean));
}

// ── Notices ─────────────────────────────────────────────────────────────────
function activeNotices() {
  const today = localDateInput();
  const cutoff = addDays(today, -60);
  return (state.announcements || [])
    .filter((n) => (n.until ? n.until >= today : String(n.createdAt || "").slice(0, 10) >= cutoff))
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

function noticeMessage(notice) {
  return [`📢 ${state.building?.name || ""}`, notice.title, notice.body].filter(Boolean).join("\n");
}

function buildNoticeCard(notice, { compact = false } = {}) {
  const card = mk("article", { className: "notice-card" },
    mk("div", { className: "notice-head" },
      mk("strong", { text: notice.title }),
      mk("span", { text: formatDateLabel(String(notice.createdAt || "").slice(0, 10)) })),
    notice.body ? mk("p", { className: "notice-body", text: notice.body }) : null,
    notice.until ? mk("p", { className: "notice-until", text: tr("Until {date}", { date: formatDateLabel(notice.until) }) }) : null);
  if (!compact && sessionMode === "owner") {
    card.append(mk("div", { className: "notice-actions" },
      miniButton(tr("Post to WhatsApp group"), () => window.open(whatsappLink("", noticeMessage(notice)), "_blank", "noopener")),
      miniButton(tr("Delete"), () => deleteNotice(notice.id), "danger-mini")));
  }
  return card;
}

function renderNotices() {
  if (els.newNoticeButton) els.newNoticeButton.classList.toggle("hidden", sessionMode !== "owner");
  if (els.noticesList) {
    const all = (state.announcements || []).slice().sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    els.noticesList.replaceChildren(...(all.length
      ? all.map((n) => buildNoticeCard(n))
      : [mk("div", { className: "empty-state", text: sessionMode === "owner" ? tr("No notices yet. Post one when there's news for the residents — a water cut, maintenance work, a meeting.") : tr("No notices from the building.") })]));
  }
  renderTenantDashboardExtras();
}

function renderTenantDashboardExtras() {
  if (!els.tenantNoticesPanel) return;
  const isTenant = sessionMode === "tenant" && sessionTenantId;
  const notices = isTenant ? activeNotices().slice(0, 3) : [];
  const myIssues = isTenant ? (state.issues || []).filter((i) => i.tenantId === sessionTenantId && i.status !== "fixed") : [];
  const blocks = [
    isTenant ? tenantHelpCard() : null,
    ...notices.map((n) => buildNoticeCard(n, { compact: true })),
    isTenant ? tenantRecentPaymentsCard() : null,
    ...myIssues.map((issue) => mk("article", { className: "notice-card" },
      mk("div", { className: "notice-head" }, mk("strong", { text: issue.title }), issueStatusPill(issue.status)),
      issue.ownerNote ? mk("p", { className: "notice-body", text: issue.ownerNote }) : null)),
  ].filter(Boolean);
  els.tenantNoticesPanel.classList.toggle("hidden", !blocks.length);
  els.tenantNoticesList.replaceChildren(...blocks);
}

function openNoticeDialog() {
  if (sessionMode !== "owner") return;
  const title = textInput("", { placeholder: tr("Water cut on Tuesday"), maxlength: "120" });
  const body = mk("textarea", { rows: "4", placeholder: tr("Details for the residents"), maxlength: "1500" });
  const until = mk("input", { type: "date" });
  const push = checkboxRow(tr("Also send a phone notification to tenants"), true);
  const save = () => {
    if (!title.value.trim()) { showToast("Give the notice a title"); return; }
    const notice = { id: newId("ntc"), title: title.value.trim(), body: body.value.trim(), until: until.value || "", createdAt: new Date().toISOString(), by: auditActor() };
    (state.announcements ||= []).push(notice);
    if (!saveState()) return;
    renderAll();
    if (push.input.checked) notifyTenants(null, `📢 ${notice.title}`, notice.body || notice.title);
    openToolDialog(tr("Notice posted"),
      note(tr("Tenants see it on their phones. Post it to the building's WhatsApp group too?")),
      mk("div", { className: "button-row" },
        primaryButton(tr("Post to WhatsApp group"), () => { window.open(whatsappLink("", noticeMessage(notice)), "_blank", "noopener"); closeToolDialog(); }),
        secondaryButton(tr("Done"), closeToolDialog)));
  };
  openToolDialog(tr("New notice"),
    field(tr("Title"), title),
    field(tr("Message"), body),
    field(tr("Show until (optional)"), until, tr("Without a date it shows for 60 days.")),
    canNotify() ? push.row : null,
    mk("div", { className: "button-row" }, primaryButton(tr("Post notice"), save), secondaryButton(tr("Cancel"), closeToolDialog)));
}

function deleteNotice(id) {
  if (!window.confirm(tr("Delete this notice?"))) return;
  state.announcements = (state.announcements || []).filter((n) => n.id !== id);
  recordDeletedId("announcements", id);
  if (!saveState()) return;
  renderAll();
}

// ── Problem reports ─────────────────────────────────────────────────────────
const ISSUE_STATUSES = [["open", "Open"], ["in_progress", "In progress"], ["fixed", "Fixed"]];

function issueStatusPill(status) {
  const label = (ISSUE_STATUSES.find(([v]) => v === status) || ISSUE_STATUSES[0])[1];
  return mk("span", { className: `status-pill issue-${status || "open"}`, text: tr(label) });
}

async function uploadPhotoUnder(prefix, file) {
  if (cloudProvider() !== "supabase" || !authSession) throw new Error("Photos need the cloud. Send the photo to the owner on WhatsApp instead.");
  const prepared = await prepareInvoiceUpload({ id: "photo", invoice: "photo", description: "photo", date: localDateInput() }, file);
  const path = `${prefix}/${Date.now()}-${randomToken()}.jpg`;
  const c = cloudConfig();
  await ensureFreshSession();
  const res = await fetch(`${c.supabaseUrl}/storage/v1/object/${SUPABASE_INVOICE_BUCKET}/${encodeURI(path)}`, {
    method: "POST",
    headers: { apikey: c.supabaseKey, Authorization: `Bearer ${authBearer()}`, "Content-Type": prepared.mimeType, "x-upsert": "false" },
    body: base64ToBytes(prepared.dataBase64),
  });
  if (!res.ok) throw Object.assign(new Error(tr("Photo upload failed ({status})", { status: res.status })), { status: res.status });
  return { fileName: "photo.jpg", mimeType: prepared.mimeType, storagePath: path, uploadedAt: new Date().toISOString() };
}

function openIssueDialog() {
  const tenantPhone = isTenantSession() && sessionMode === "tenant";
  if (sessionMode !== "owner" && !tenantPhone) { showToast("Link this phone with an invite code to report problems"); return; }
  const title = textInput("", { placeholder: tr("Leak under the stairs"), maxlength: "200" });
  const details = mk("textarea", { rows: "4", placeholder: tr("Where, since when, how bad"), maxlength: "2000" });
  const photo = mk("input", { type: "file", accept: "image/*" });
  const submit = primaryButton(tr("Send"), async () => {
    if (!title.value.trim()) { showToast("Describe the problem in a few words"); return; }
    submit.disabled = true;
    try {
      const file = photo.files?.[0] || null;
      if (tenantPhone) {
        const uploaded = file ? await uploadPhotoUnder(`issues/${sessionTenantId}`, file) : null;
        await supabaseRequest("rpc/report_issue", { method: "POST", body: JSON.stringify({ p_title: title.value.trim(), p_details: details.value.trim(), ...(uploaded ? { p_photo_path: uploaded.storagePath } : {}) }) });
        closeToolDialog();
        showToast("Sent to the building owner");
        syncFromSheet({ silent: true });
      } else {
        const uploaded = file && hasCloudConfig() && authSession ? await uploadPhotoUnder("issues/building", file) : null;
        const now = new Date().toISOString();
        (state.issues ||= []).push({ id: newId("iss"), tenantId: null, title: title.value.trim(), details: details.value.trim(), status: "open", createdAt: now, updatedAt: now, ...(uploaded ? { photo: uploaded } : {}) });
        if (!saveState()) return;
        closeToolDialog();
        renderAll();
        showToast("Problem recorded");
      }
    } catch (error) {
      showToast(error instanceof TypeError ? "Can't reach the cloud. Check your connection." : describeSyncProblem(error), 6000);
    } finally {
      submit.disabled = false;
    }
  });
  openToolDialog(tr("Report a problem"),
    note(tenantPhone ? tr("The owner gets your report and you can follow its status here.") : tr("A building problem everyone can see, like a broken lift.")),
    field(tr("What's wrong?"), title),
    field(tr("Details"), details),
    field(tr("Photo (optional)"), photo),
    mk("div", { className: "button-row" }, submit, secondaryButton(tr("Cancel"), closeToolDialog)));
}

function openIssueManageDialog(id) {
  const issue = (state.issues || []).find((i) => i.id === id);
  if (!issue || sessionMode !== "owner") return;
  const status = selectInput(ISSUE_STATUSES.map(([v, l]) => [v, tr(l)]), issue.status || "open");
  const ownerNote = mk("textarea", { rows: "3", placeholder: tr("e.g. The plumber comes on Thursday"), maxlength: "1000" });
  ownerNote.value = issue.ownerNote || "";
  const save = () => {
    const changedStatus = status.value !== issue.status;
    issue.status = status.value;
    issue.ownerNote = ownerNote.value.trim();
    issue.updatedAt = new Date().toISOString();
    if (!saveState()) return;
    closeToolDialog();
    renderAll();
    if (issue.tenantId && changedStatus) {
      notifyTenants(issue.tenantId, tr("Problem update: {title}", { title: issue.title }), [tr(ISSUE_STATUSES.find(([v]) => v === issue.status)[1]), issue.ownerNote].filter(Boolean).join(" — "));
    }
    showToast("Problem updated");
  };
  const remove = () => {
    if (!window.confirm(tr("Delete this problem report?"))) return;
    state.issues = (state.issues || []).filter((i) => i.id !== id);
    recordDeletedId("issues", id);
    if (!saveState()) return;
    closeToolDialog();
    renderAll();
  };
  openToolDialog(issue.title,
    issue.details ? note(issue.details) : null,
    note(issue.tenantId ? tr("Reported by {name} on {date}", { name: tenantName(issue.tenantId) || tr("(removed tenant)"), date: formatDateLabel(String(issue.createdAt).slice(0, 10)) }) : tr("Building problem")),
    field(tr("Status"), status),
    field(tr("Note for the resident"), ownerNote),
    mk("div", { className: "button-row" }, primaryButton(tr("Save"), save), mk("button", { type: "button", className: "danger-button", text: tr("Delete"), onclick: remove })));
}

function renderIssues() {
  if (!els.issuesList) return;
  const canReport = sessionMode === "owner" || (sessionMode === "tenant" && isTenantSession());
  if (els.newIssueButton) els.newIssueButton.classList.toggle("hidden", !canReport);
  const order = { open: 0, in_progress: 1, fixed: 2 };
  const issues = (state.issues || []).slice().sort((a, b) => (order[a.status] ?? 0) - (order[b.status] ?? 0) || String(b.createdAt).localeCompare(String(a.createdAt)));
  if (!issues.length) {
    els.issuesList.replaceChildren(mk("div", { className: "empty-state", text: tr("No problems reported.") }));
    return;
  }
  els.issuesList.replaceChildren(...issues.map((issue) => {
    const who = issue.tenantId ? (tenantName(issue.tenantId) || tr("(removed tenant)")) : tr("Building");
    const card = mk("article", { className: "notice-card issue-card" },
      mk("div", { className: "notice-head" }, mk("strong", { text: issue.title }), issueStatusPill(issue.status)),
      issue.details ? mk("p", { className: "notice-body", text: issue.details }) : null,
      issue.ownerNote ? mk("p", { className: "notice-body owner-note", text: `${tr("Owner")}: ${issue.ownerNote}` }) : null,
      mk("p", { className: "notice-until", text: `${who} · ${formatDateLabel(String(issue.createdAt || "").slice(0, 10))}` }));
    const actions = mk("div", { className: "notice-actions" });
    if (issue.photo?.storagePath) actions.append(miniButton(tr("Photo"), () => openInvoicePhoto(issue.photo)));
    if (sessionMode === "owner") actions.append(miniButton(tr("Update"), () => openIssueManageDialog(issue.id)));
    if (actions.childNodes.length) card.append(actions);
    return card;
  }));
}

// ── Moving in and out ───────────────────────────────────────────────────────
function tenantOccupiesMonth(tenant, month) {
  const key = monthKey(month);
  if (tenant.movedInOn && key < monthKey(tenant.movedInOn)) return false;
  if (tenant.movedOutOn && key >= monthKey(tenant.movedOutOn)) return false;
  return true;
}

function openMoveOutDialog(tenantId) {
  const tenant = state.tenants.find((t) => t.id === tenantId);
  if (!tenant || sessionMode !== "owner") return;
  const balance = getTenantBalance(tenantId);
  const nextFirst = monthIso(monthKey(addMonths(currentMonthValue(), 1)));
  const date = mk("input", { type: "date", value: nextFirst });
  const name = textInput("", { placeholder: tr("New occupant's name") });
  const phone = mk("input", { type: "tel", placeholder: "70 123 456" });
  const reading = numberInput("", { step: "1", inputmode: "numeric" });
  const choice = selectInput([
    ["leave", tr("The leaving tenant settles it")],
    ["transfer", tr("Transfer it to the new occupant")],
  ], "leave");
  const balanceLine = Math.abs(balance) < 0.005
    ? tr("{name} is settled in full.", { name: tenant.name })
    : balance > 0
      ? tr("{name} owes {amount}.", { name: tenant.name, amount: formatUsd(balance) })
      : tr("{name} has a credit of {amount}.", { name: tenant.name, amount: formatUsd(-balance) });
  const save = () => {
    const moveDate = date.value;
    if (!moveDate) { showToast("Choose the handover date"); return; }
    if (!name.value.trim()) { showToast("Enter the new occupant's name"); return; }
    if (isMonthClosed(moveDate)) { showToast(closedMonthError(moveDate).message, 5000); return; }
    const newTenant = {
      id: generateTenantId(name.value.trim()),
      name: name.value.trim(),
      unit: tenant.unit,
      coefficient: tenant.coefficient || 0,
      breakerAmps: tenant.breakerAmps || 0,
      phone: phone.value.trim(),
      active: true,
      pinHash: "",
      movedInOn: moveDate,
      ...(reading.value !== "" ? { meterStart: Number(reading.value) } : {}),
    };
    tenant.active = false;
    tenant.movedOutOn = moveDate;
    if (reading.value !== "") tenant.meterEnd = Number(reading.value);
    state.tenants.push(newTenant);
    if (choice.value === "transfer" && Math.abs(balance) >= 0.005) {
      const amount = roundUsd(Math.abs(balance));
      const owes = balance > 0;
      const entry = (tenantIdFor, debit, description) => ({
        id: newId("tx"), category: "Opening Balance", description, tenantId: tenantIdFor, forMonth: null, project: "", date: moveDate,
        supplier: "", invoice: "", expenseCategory: "", serviceType: "", servicePart: "",
        debitUsd: debit ? amount : 0, debitLbp: 0, creditUsd: debit ? 0 : amount, creditLbp: 0,
        balanceUsd: debit ? -amount : amount, balanceLbp: 0, invoiceAttachment: null, sourceRow: null,
      });
      state.transactions.push(
        entry(tenant.id, !owes, tr("Balance transferred to {name}", { name: newTenant.name })),
        entry(newTenant.id, owes, tr("Balance taken over from {name}", { name: tenant.name })),
      );
    }
    if (!saveState()) return;
    populateTenantSelect();
    renderAll();
    openToolDialog(tr("Handover recorded"),
      note(tr("{old} has moved out and {new} is now the occupant of unit {unit}. From {month}, {new} pays the monthly charges.", { old: tenant.name, new: newTenant.name, unit: tenant.unit, month: formatMonth(moveDate) })),
      mk("div", { className: "button-row" },
        primaryButton(tr("Final statement for {name}", { name: tenant.name }), () => { void shareTenantStatementPdf(tenant.id); }),
        secondaryButton(tr("Invite {name}", { name: newTenant.name }), () => { closeToolDialog(); openInviteDialog(newTenant.id); })));
  };
  openToolDialog(tr("Move out — {name}", { name: tenant.name }),
    note(tr("Records a change of occupant for unit {unit}. The old account is kept (inactive) with its full history.", { unit: tenant.unit })),
    field(tr("Handover date"), date, tr("The leaving tenant pays up to the month before; the new occupant from this month.")),
    field(tr("New occupant"), name),
    field(tr("Phone (optional)"), phone),
    field(tr("Generator meter at handover (optional)"), reading),
    note(balanceLine),
    Math.abs(balance) >= 0.005 ? field(tr("The balance"), choice) : null,
    mk("div", { className: "button-row" }, primaryButton(tr("Record handover"), save), secondaryButton(tr("Cancel"), closeToolDialog)));
}

// ── Extra administrators ────────────────────────────────────────────────────
const ADMIN_INVITE_KEY = "building-account-tracker:admin-invite";

function pendingAdminInvite() {
  try { return localStorage.getItem(ADMIN_INVITE_KEY) || ""; } catch { return ""; }
}

// ?admin=CODE in the link the owner sent: remember it until Google sign-in.
function captureAdminInvite() {
  const code = new URLSearchParams(location.search).get("admin");
  if (!code) return;
  try { localStorage.setItem(ADMIN_INVITE_KEY, code.trim().toUpperCase()); } catch { /* private mode */ }
  history.replaceState(null, "", location.pathname);
}

function adminInviteLink(code) {
  return `${location.origin}${location.pathname}?admin=${encodeURIComponent(code)}`;
}

async function openAdminsDialog() {
  if (!isOwnerSession()) { showToast("Sign in with Google as the owner to manage administrators"); return; }
  const list = mk("div", { className: "history-list compact" }, note(tr("Loading…")));
  const role = selectInput([["viewer", tr("View only — sees everything, changes nothing")], ["owner", tr("Full access — can change everything")]], "viewer");
  const result = mk("div");
  const create = primaryButton(tr("Create invite link"), async () => {
    create.disabled = true;
    try {
      const res = await supabaseRequest("rpc/create_admin_invite", { method: "POST", body: JSON.stringify({ p_role: role.value }) });
      const code = await res.json();
      const link = adminInviteLink(code);
      const message = tr("You're invited to help manage {building} in the Building Account Tracker. Open this link on your phone and sign in with your Google account (valid 7 days, one use):\n{link}", { building: state.building?.name || "", link });
      result.replaceChildren(
        mk("p", { className: "invite-code", text: code }),
        note(link),
        mk("div", { className: "button-row" },
          primaryButton(tr("Send on WhatsApp"), () => window.open(whatsappLink("", message), "_blank", "noopener")),
          secondaryButton(tr("Copy link"), () => navigator.clipboard?.writeText(link).then(() => showToast("Link copied")).catch(() => showToast(link, 8000)))));
    } catch (error) {
      showToast(describeSyncProblem(error), 6000);
    } finally {
      create.disabled = false;
    }
  });
  openToolDialog(tr("Administrators"),
    note(tr("Give a family member or the building committee their own sign-in. They use their own Google account; you can remove them at any time.")),
    list,
    field(tr("Invite someone"), role),
    note(tr("Google only lets accounts sign in that are allowed in the app's Google settings. If they get an \"access blocked\" message, the account needs adding there first.")),
    create,
    result);
  try {
    const res = await supabaseRequest("rpc/list_admins", { method: "POST", body: "{}" });
    const admins = await res.json();
    list.replaceChildren(...admins.map((a) => mk("div", { className: "history-row" },
      mk("div", { className: "history-head" }, mk("strong", { text: a.email || a.user_id }), mk("span", { text: a.role === "viewer" ? tr("View only") : tr("Full access") })),
      a.is_me ? mk("div", { className: "history-by", text: tr("You") }) : miniButton(tr("Remove"), async () => {
        if (!window.confirm(tr("Remove {email}'s access to the building?", { email: a.email }))) return;
        try {
          await supabaseRequest("rpc/remove_admin", { method: "POST", body: JSON.stringify({ p_user_id: a.user_id }) });
          showToast("Access removed");
          openAdminsDialog();
        } catch (error) {
          showToast(describeSyncProblem(error), 6000);
        }
      }, "danger-mini"))));
  } catch (error) {
    list.replaceChildren(note(error.status === 404 ? tr("The database update for administrators hasn't been applied yet.") : describeSyncProblem(error)));
  }
}

// ── Phone notifications ─────────────────────────────────────────────────────
const PUSH_STATE_KEY = "building-account-tracker:push";

function pushSupported() {
  return typeof navigator !== "undefined" && "serviceWorker" in navigator && typeof window.PushManager !== "undefined" && typeof window.Notification !== "undefined";
}

function canNotify() {
  return hasCloudConfig() && Boolean(authSession);
}

function pushIsOn() {
  try { return localStorage.getItem(PUSH_STATE_KEY) === "on"; } catch { return false; }
}

function urlBase64ToBytes(base64) {
  const padded = `${base64}${"=".repeat((4 - (base64.length % 4)) % 4)}`.replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(padded);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

async function enablePushNotifications() {
  if (!pushSupported()) { showToast("This phone or browser can't receive notifications. On an iPhone, add the app to the Home Screen first.", 7000); return; }
  if (!authSession) { showToast("Sign in first (Google for the owner, an invite code for tenants)", 6000); return; }
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") { showToast("Notifications are blocked for this site in the phone's settings", 6000); return; }
    const keyRes = await fetch("/api/push-key", { cache: "no-store" });
    const { publicKey } = await keyRes.json();
    if (!publicKey) throw new Error("Notifications aren't set up on the server yet");
    const registration = await navigator.serviceWorker.ready;
    const subscription = (await registration.pushManager.getSubscription())
      || await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToBytes(publicKey) });
    const json = subscription.toJSON();
    await supabaseRequest("rpc/save_push_subscription", { method: "POST", body: JSON.stringify({ p_endpoint: json.endpoint, p_p256dh: json.keys.p256dh, p_auth: json.keys.auth }) });
    localStorage.setItem(PUSH_STATE_KEY, "on");
    showToast("Notifications are on for this phone");
  } catch (error) {
    showToast(error.status ? describeSyncProblem(error) : error.message, 6000);
  }
  renderPushStatus();
}

async function disablePushNotifications() {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      const endpoint = subscription.endpoint;
      await subscription.unsubscribe();
      await supabaseRequest("rpc/delete_push_subscription", { method: "POST", body: JSON.stringify({ p_endpoint: endpoint }) }).catch(() => {});
    }
  } catch { /* already gone */ }
  try { localStorage.removeItem(PUSH_STATE_KEY); } catch { /* ignore */ }
  showToast("Notifications are off for this phone");
  renderPushStatus();
}

function renderPushStatus() {
  if (!els.pushStatusText || !els.pushToggleButton) return;
  const on = pushIsOn();
  els.pushStatusText.textContent = !pushSupported()
    ? tr("Not available in this browser. On an iPhone, add the app to the Home Screen first.")
    : on
      ? tr("On for this phone.")
      : sessionMode === "tenant"
        ? tr("Get a notification when the owner posts a notice, records your payment or updates a problem you reported.")
        : tr("Get a notification when a tenant says they paid or reports a problem.");
  els.pushToggleButton.textContent = on ? tr("Turn off") : tr("Turn on");
  els.pushToggleButton.disabled = !pushSupported();
}

// Owner → tenant phones. Best effort: a failure never blocks the owner's work.
function notifyTenants(tenantId, title, body) {
  if (!isOwnerSession() || !hasCloudConfig()) return;
  supabaseRequest("rpc/notify_tenants", { method: "POST", body: JSON.stringify({ p_tenant_id: tenantId || null, p_title: title, p_body: body || "" }) }).catch(() => {});
}

// ── Keep-alive watch ────────────────────────────────────────────────────────
let keepaliveLastOk = null;
let keepaliveCheckedAt = 0;

async function refreshKeepaliveStatus() {
  if (!isAdminSession() || cloudProvider() !== "supabase") return;
  if (Date.now() - keepaliveCheckedAt < 6 * 3600000) return;
  keepaliveCheckedAt = Date.now();
  try {
    const res = await supabaseRequest("rpc/keepalive_status", { method: "POST", body: "{}" });
    const value = await res.json();
    keepaliveLastOk = value ? new Date(value) : null;
    renderAttention();
  } catch { /* SQL not applied yet, or offline: say nothing */ }
}

function keepaliveStale() {
  if (!keepaliveLastOk || Number.isNaN(keepaliveLastOk.getTime())) return false;
  return Date.now() - keepaliveLastOk.getTime() > 36 * 3600000;
}

// ── Spending trends and the annual report ───────────────────────────────────
function spendingCategory(t) {
  if (t.category === "Services Expenses") {
    if (t.serviceType === "water") return tr("Water");
    return t.servicePart === "maintenance" ? tr("Generator maintenance") : tr("Generator fuel");
  }
  return t.expenseCategory || tr("General");
}

function isSpending(t) {
  return t.category === "Expenses" || t.category === "Services Expenses";
}

function spendingByYear() {
  const years = new Map();
  state.transactions.filter(isSpending).forEach((t) => {
    const year = String(transactionDateValue(t)).slice(0, 4);
    if (!/^\d{4}$/.test(year) || year === "1900") return;
    const cats = years.get(year) || new Map();
    const cat = spendingCategory(t);
    cats.set(cat, roundUsd((cats.get(cat) || 0) + txUsd(t, t.debitUsd, t.debitLbp)));
    years.set(year, cats);
  });
  return years;
}

function buildSpendingTrends() {
  const byYear = spendingByYear();
  const years = [...byYear.keys()].sort().slice(-4);
  if (!years.length) return note(tr("No expenses recorded yet."));
  const latest = years[years.length - 1];
  const categories = [...new Set(years.flatMap((y) => [...byYear.get(y).keys()]))]
    .sort((a, b) => (byYear.get(latest).get(b) || 0) - (byYear.get(latest).get(a) || 0));
  const totals = years.map((y) => roundUsd([...byYear.get(y).values()].reduce((s, v) => s + v, 0)));
  const max = Math.max(...totals, 1);
  const bars = mk("div", { className: "trend-bars" }, years.map((y, i) => mk("div", { className: "trend-bar-row" },
    mk("span", { className: "trend-year", text: y }),
    mk("div", { className: "trend-track" }, mk("div", { className: "trend-fill", style: `width:${Math.max(2, Math.round((totals[i] / max) * 100))}%` })),
    mk("b", { className: "tnum", text: formatUsd(totals[i]) }))));
  const change = (a, b) => (a > 0 ? `${b >= a ? "+" : ""}${Math.round(((b - a) / a) * 100)}%` : "");
  const table = mk("table", { className: "report-table" },
    mk("thead", {}, mk("tr", {}, mk("th", { text: tr("Category") }), years.map((y) => mk("th", { className: "num", text: y })), years.length > 1 ? mk("th", { className: "num", text: tr("Change") }) : null)),
    mk("tbody", {}, categories.map((cat) => {
      const values = years.map((y) => byYear.get(y).get(cat) || 0);
      return mk("tr", {}, mk("td", { text: cat }), values.map((v) => mk("td", { className: "num", text: v ? formatUsd(v) : "—" })),
        years.length > 1 ? mk("td", { className: "num", text: change(values[values.length - 2], values[values.length - 1]) }) : null);
    })),
    mk("tfoot", {}, mk("tr", {}, mk("td", { text: tr("Total") }), totals.map((v) => mk("td", { className: "num", text: formatUsd(v) })),
      years.length > 1 ? mk("td", { className: "num", text: change(totals[totals.length - 2], totals[totals.length - 1]) }) : null)));
  const thisYear = String(new Date().getFullYear());
  return mk("div", {}, bars, mk("div", { className: "report-table-wrap" }, table),
    years.includes(thisYear) ? note(tr("{year} is the year so far.", { year: thisYear })) : null);
}

function reportYears() {
  const years = new Set(state.transactions.map((t) => String(transactionDateValue(t)).slice(0, 4)).filter((y) => /^\d{4}$/.test(y) && y !== "1900"));
  years.add(String(new Date().getFullYear()));
  return [...years].sort().reverse();
}

// Everything the yearly owners' meeting asks about, for one calendar year.
function annualReportData(year) {
  const y = String(year);
  const start = `${y}-01-01`;
  const end = `${y}-12-31`;
  const isCash = (t) => !(t.category === "Opening Balance" && t.tenantId);
  const dateOf = (t) => String(transactionDateValue(t));
  const openingCash = roundUsd(state.transactions.filter(isCash).filter((t) => dateOf(t) < start).reduce((s, t) => s + transactionNetUsd(t), 0));
  const inYear = state.transactions.filter((t) => dateOf(t) >= start && dateOf(t) <= end);
  const months = [];
  let running = openingCash;
  for (let m = 1; m <= 12; m += 1) {
    const key = `${y}-${String(m).padStart(2, "0")}`;
    const row = { month: `${key}-01`, payments: 0, projects: 0, expenses: 0, services: 0, other: 0, net: 0 };
    inYear.filter(isCash).filter((t) => dateOf(t).slice(0, 7) === key).forEach((t) => {
      const net = transactionNetUsd(t);
      if (t.category === "Expenses") row.expenses += txUsd(t, t.debitUsd, t.debitLbp);
      else if (t.category === "Services Expenses") row.services += txUsd(t, t.debitUsd, t.debitLbp);
      else if (t.category === "Payments" && t.project) row.projects += net;
      else if (t.category === "Payments") row.payments += net;
      else row.other += net;
      row.net += net;
    });
    running = roundUsd(running + row.net);
    Object.keys(row).forEach((k) => { if (typeof row[k] === "number") row[k] = roundUsd(row[k]); });
    months.push({ ...row, cashEnd: running });
  }
  const categories = new Map();
  inYear.filter(isSpending).forEach((t) => {
    const cat = spendingCategory(t);
    categories.set(cat, roundUsd((categories.get(cat) || 0) + txUsd(t, t.debitUsd, t.debitLbp)));
  });
  const nowMonth = currentMonthValue();
  const balanceMonth = monthKey(nowMonth).slice(0, 4) === y ? getLastCompletedMonth() : `${y}-12-01`;
  const tenants = state.tenants.filter((t) => t.active !== false || (t.movedOutOn && t.movedOutOn >= start)).map((t) => ({
    name: t.name,
    unit: t.unit || "",
    paid: roundUsd(inYear.filter((x) => x.category === "Payments" && x.tenantId === t.id && !x.project).reduce((s, x) => s + transactionNetUsd(x), 0)),
    projects: roundUsd(inYear.filter((x) => x.category === "Payments" && x.tenantId === t.id && x.project).reduce((s, x) => s + transactionNetUsd(x), 0)),
    balance: monthKey(balanceMonth) < monthKey(start) ? 0 : getTenantMonthEndBalance(t.id, balanceMonth),
  }));
  const projects = (state.buildingProjects || []).map((p) => ({
    name: p.name || "",
    status: p.status || "",
    budget: Number(p.totalBudget || 0),
    collected: roundUsd(state.transactions.filter((x) => x.category === "Payments" && x.project && x.project === p.name).reduce((s, x) => s + transactionNetUsd(x), 0)),
  }));
  const income = roundUsd(months.reduce((s, r) => s + r.payments + r.projects + Math.max(0, r.other), 0));
  const spending = roundUsd(months.reduce((s, r) => s + r.expenses + r.services, 0));
  return {
    year: y, openingCash, closingCash: running, income, spending,
    months, categories: [...categories.entries()].sort((a, b) => b[1] - a[1]), tenants, projects,
    owedAtEnd: roundUsd(tenants.reduce((s, t) => s + Math.max(0, t.balance), 0)),
    balanceMonth,
    cashChecks: (state.cashChecks || []).filter((c) => String(c.date).startsWith(y)),
  };
}

function printAnnualReport(year) {
  const d = annualReportData(year);
  const page = mk("article", { className: "print-page ledger-print-page annual-print" },
    mk("header", { className: "print-header" },
      mk("div", {}, mk("p", { text: state.building?.name || "" }), mk("h1", { text: tr("Annual report {year}", { year: d.year }) }), mk("p", { text: tr("For the owners' meeting") })),
      mk("div", { className: "print-meta" }, mk("span", { text: `${tr("Date")}: ${localDateInput()}` }), mk("span", { text: `App: ${APP_VERSION}` }))),
    mk("section", { className: "print-summary" }, [
      [tr("Cash on 1 January"), formatUsd(d.openingCash)],
      [tr("Money in"), formatUsd(d.income)],
      [tr("Money out"), formatUsd(d.spending)],
      [tr("Cash on 31 December"), formatUsd(d.closingCash)],
      [tr("Still owed by tenants"), formatUsd(d.owedAtEnd)],
    ].map(([label, value]) => mk("div", {}, mk("span", { text: label }), mk("strong", { text: value })))),
    mk("h2", { className: "print-section-title", text: tr("Month by month") }),
    printTable([tr("Month"), tr("Payments"), tr("Projects"), tr("Expenses"), tr("Generator & water"), tr("Net"), tr("Cash at month end")],
      d.months.map((r) => [formatMonth(r.month), formatUsd(r.payments), formatUsd(r.projects), formatUsd(r.expenses), formatUsd(r.services), formatUsd(r.net), formatUsd(r.cashEnd)]), [1, 2, 3, 4, 5, 6]),
    mk("h2", { className: "print-section-title", text: tr("Where the money went") }),
    printTable([tr("Category"), tr("Amount"), tr("Share")],
      d.categories.map(([cat, usd]) => [cat, formatUsd(usd), d.spending > 0 ? `${Math.round((usd / d.spending) * 100)}%` : ""]), [1, 2]),
    mk("h2", { className: "print-section-title", text: tr("Tenants") }),
    printTable([tr("Unit"), tr("Tenant"), tr("Paid in the year"), tr("Projects"), tr("Balance (owes +)")],
      d.tenants.map((t) => [t.unit, t.name, formatUsd(t.paid), formatUsd(t.projects), formatUsd(t.balance)]), [2, 3, 4]),
    d.projects.length ? mk("h2", { className: "print-section-title", text: tr("Projects") }) : null,
    d.projects.length ? printTable([tr("Project"), tr("Status"), tr("Budget"), tr("Collected")],
      d.projects.map((p) => [p.name, tr(p.status), formatUsd(p.budget), formatUsd(p.collected)]), [2, 3]) : null,
    mk("p", { className: "print-note", text: tr("Balances are as of the end of {month}.", { month: formatMonth(d.balanceMonth) }) }));
  printPreparedPage(page);
}

function printTable(headers, rows, numericCols = []) {
  const numeric = new Set(numericCols);
  return mk("table", { className: "print-table" },
    mk("thead", {}, mk("tr", {}, headers.map((h, i) => mk("th", { className: numeric.has(i) ? "numeric" : "", text: h })))),
    mk("tbody", {}, rows.map((row) => mk("tr", {}, row.map((cell, i) => mk("td", { className: numeric.has(i) ? "numeric" : "", text: cell }))))));
}

function buildAnnualWorkbookFiles(year) {
  const d = annualReportData(year);
  const rtl = currentLang === "ar";
  const building = state.building?.name || "Building";
  const subtitle = tr("{building} · annual report {year}", { building, year: d.year });
  const C = (header, width, type = "text", total = false) => ({ header: tr(header), width, type, total });
  const used = new Set();
  const tables = [
    { name: tr("Month by month"), columns: [C("Month", 12, "month"), C("Payments", 14, "usd", true), C("Projects", 14, "usd", true), C("Expenses", 14, "usd", true), C("Generator & water", 16, "usd", true), C("Other", 12, "usd", true), C("Net", 13, "usd", true), C("Cash at month end", 17, "usd")],
      rows: d.months.map((r) => [r.month, r.payments, r.projects, r.expenses, r.services, r.other, r.net, r.cashEnd]) },
    { name: tr("Where the money went"), columns: [C("Category", 30), C("Amount", 15, "usd", true)], rows: d.categories.map(([cat, usd]) => [cat, usd]) },
    { name: tr("Tenants"), columns: [C("Unit", 9), C("Tenant", 26), C("Paid in the year", 16, "usd", true), C("Projects", 14, "usd", true), C("Balance (owes +)", 16, "usd", true)],
      rows: d.tenants.map((t) => [t.unit, t.name, t.paid, t.projects, t.balance]) },
    { name: tr("Projects"), columns: [C("Project", 26), C("Status", 12), C("Budget", 14, "usd", true), C("Collected", 14, "usd", true)],
      rows: d.projects.map((p) => [p.name, tr(p.status), p.budget, p.collected]) },
  ];
  const summary = [
    { heading: tr("Annual report {year}", { year: d.year }), items: [
      [tr("Building"), building], [tr("Cash on 1 January"), d.openingCash, "usd"], [tr("Money in"), d.income, "usd"],
      [tr("Money out"), d.spending, "usd"], [tr("Cash on 31 December"), d.closingCash, "usd"], [tr("Still owed by tenants"), d.owedAtEnd, "usd"]] },
  ];
  const sheets = [
    { name: safeSheetName(tr("Summary"), used), xml: buildSummarySheetXml(building, subtitle, summary, rtl) },
    ...tables.map((t) => ({ name: safeSheetName(t.name, used), xml: buildTableSheetXml({ ...t, title: t.name }, subtitle, rtl) })),
  ];
  return workbookPackageFiles(sheets, `${building} — annual report ${d.year}`);
}

function downloadAnnualWorkbook(year) {
  const slug = String(state.building?.name || "building").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "building";
  downloadBlob(new Blob([buildZip(buildAnnualWorkbookFiles(year))], { type: XLSX_MIME }), XLSX_MIME, `${slug}-annual-report-${year}.xlsx`);
  showToast("Annual report downloaded");
}

// ── The Reports screen ──────────────────────────────────────────────────────
function reportsSection(title, ...children) {
  return mk("section", { className: "panel report-section" }, mk("div", { className: "panel-header" }, mk("h3", { text: title })), ...children);
}

function renderReports() {
  if (!els.reportsBody) return;
  if (sessionMode !== "owner") { els.reportsBody.replaceChildren(); return; }
  const years = reportYears();
  const yearSelect = selectInput(years.map((y) => [y, y]), years.find((y) => y < String(new Date().getFullYear())) || years[0]);
  const reportMonths = getMonths().filter((m) => monthKey(m) <= monthKey(currentMonthValue())).slice().reverse().slice(0, 12);
  if (!reportMonths.length) reportMonths.push(currentMonthValue());
  const lastMonth = getLastCompletedMonth();
  const monthSelect = selectInput(reportMonths.map((m) => [m, formatMonth(m)]), reportMonths.includes(lastMonth) ? lastMonth : reportMonths[0]);

  const monthsWithActivity = [...new Set(state.transactions.map((t) => monthKey(transactionDateValue(t))).filter((m) => m && m !== "1900-01"))]
    .sort().reverse().filter((m) => m <= monthKey(currentMonthValue())).slice(0, 12);
  const monthRows = mk("div", { className: "history-list compact" }, monthsWithActivity.length
    ? monthsWithActivity.map((m) => {
      const closed = isMonthClosed(m);
      return mk("div", { className: "month-lock-row" },
        mk("span", { text: formatMonth(monthIso(m)) }),
        mk("span", { className: `status-pill ${closed ? "status-paid" : "status-due"}`, text: closed ? tr("Closed") : tr("Open") }),
        miniButton(closed ? tr("Reopen") : tr("Close"), () => setMonthClosed(m, !closed)));
    })
    : [note(tr("No months with activity yet."))]);

  const checks = (state.cashChecks || []).slice().sort((a, b) => String(b.date).localeCompare(String(a.date))).slice(0, 6);
  const cashRows = mk("div", { className: "history-list compact" }, checks.map((c) => mk("div", { className: "history-row" },
    mk("div", { className: "history-head" }, mk("strong", { text: formatDateLabel(c.date) }),
      mk("span", { className: Math.abs(c.differenceUsd) < 1 ? "cash-ok" : "cash-gap", text: Math.abs(c.differenceUsd) < 1 ? tr("Matches") : formatUsd(c.differenceUsd) })),
    mk("div", { className: "history-change", text: tr("Counted {counted} · books {expected}", { counted: formatUsd(c.countedUsd), expected: formatUsd(c.expectedUsd) }) }),
    c.note ? mk("div", { className: "history-by", text: c.note }) : null,
    miniButton(tr("Delete"), () => deleteCashCheck(c.id), "danger-mini"))));

  els.reportsBody.replaceChildren(
    reportsSection(tr("Monthly report"),
      note(tr("A one-page summary of the month for the residents: money in and out, where it went, and what's still owed. The generator part only appears when the building used it that month.")),
      field(tr("Month"), monthSelect),
      mk("div", { className: "button-row" }, primaryButton(tr("Share PDF"), () => shareMonthlyReport(monthSelect.value)))),
    reportsSection(tr("Data health"),
      note(tr("Problems the app found in your data, each with a shortcut to fix it.")),
      buildDataHealthSection()),
    reportsSection(tr("Automatic reminders"), buildAutoNoticeSection()),
    reportsSection(tr("Budget"), buildBudgetSection()),
    reportsSection(tr("Reserve target"), buildReserveSection()),
    reportsSection(tr("Close the year"), buildCloseYearSection()),
    reportsSection(tr("Annual report"),
      note(tr("Everything for the yearly owners' meeting: money in and out, where it went, the reserve, and who still owes.")),
      field(tr("Year"), yearSelect),
      mk("div", { className: "button-row" },
        primaryButton(tr("PDF"), () => printAnnualReport(yearSelect.value)),
        secondaryButton(tr("Excel"), () => downloadAnnualWorkbook(yearSelect.value)))),
    reportsSection(tr("Spending by year"), buildSpendingTrends()),
    reportsSection(tr("Cash check"),
      note(tr("Once a month, type what's actually in the cash box and the bank. Missing or unrecorded money shows up straight away.")),
      primaryButton(tr("Count the cash"), openCashCheckDialog),
      cashRows),
    reportsSection(tr("Close the month"),
      note(tr("Once you've sent a month's balances, close it. Its figures can't change by accident; to edit them you reopen the month first.")),
      monthRows),
    reportsSection(tr("Change history"),
      note(tr("{n} changes recorded. Every addition, change and deletion, with the date and who made it — and an Undo for mistakes.", { n: (state.auditLog || []).length })),
      secondaryButton(tr("Open the history"), () => { historyShown = 40; openHistoryDialog(); })),
  );
}

// ── Workbook packaging shared by the full export and the annual report ─────
function workbookPackageFiles(sheets, docTitle) {
  const createdAt = new Date().toISOString();
  return [
    { name: "[Content_Types].xml", content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  ${sheets.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("\n  ")}
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>` },
    { name: "_rels/.rels", content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>` },
    { name: "docProps/app.xml", content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>Building Account Tracker</Application>
  <HeadingPairs><vt:vector size="2" baseType="variant"><vt:variant><vt:lpstr>Worksheets</vt:lpstr></vt:variant><vt:variant><vt:i4>${sheets.length}</vt:i4></vt:variant></vt:vector></HeadingPairs>
  <TitlesOfParts><vt:vector size="${sheets.length}" baseType="lpstr">${sheets.map((s) => `<vt:lpstr>${escapeXml(s.name)}</vt:lpstr>`).join("")}</vt:vector></TitlesOfParts>
</Properties>` },
    { name: "docProps/core.xml", content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>${escapeXml(docTitle)}</dc:title>
  <dc:creator>Building Account Tracker</dc:creator>
  <dcterms:created xsi:type="dcterms:W3CDTF">${createdAt}</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">${createdAt}</dcterms:modified>
</cp:coreProperties>` },
    { name: "xl/workbook.xml", content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <bookViews><workbookView activeTab="0"/></bookViews>
  <sheets>${sheets.map((s, i) => `<sheet name="${escapeXml(s.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join("")}</sheets>
</workbook>` },
    { name: "xl/_rels/workbook.xml.rels", content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${sheets.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join("\n  ")}
  <Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>` },
    { name: "xl/styles.xml", content: WB_STYLES_XML },
    ...sheets.map((s, i) => ({ name: `xl/worksheets/sheet${i + 1}.xml`, content: s.xml })),
  ];
}

// ── Polls weighted by ownership share ───────────────────────────────────────
function pollIsOpen(poll) {
  if (poll.status !== "open") return false;
  return !(poll.closesOn && poll.closesOn < localDateInput());
}

// Counts for a poll card. Share mode weighs each unit by its coefficient; the
// owner's own "owner" vote is not a unit and does not count there.
function pollTally(poll) {
  const counts = poll.voteCounts; // present on a tenant phone (server-side tally)
  const votes = poll.votes || {};
  const activeTenants = state.tenants.filter((t) => t.active !== false);
  if (poll.weighting === "share") {
    if (counts && counts.totalShare !== undefined) {
      return { mode: "share", yes: Number(counts.yesShare || 0), no: Number(counts.noShare || 0), abstain: Number(counts.abstainShare || 0), total: Number(counts.totalShare || 0) };
    }
    const weight = (id) => Number(activeTenants.find((t) => t.id === id)?.coefficient || 0);
    const sum = (v) => Object.entries(votes).filter(([id, x]) => x === v && id !== "owner").reduce((s, [id]) => s + weight(id), 0);
    return { mode: "share", yes: sum("yes"), no: sum("no"), abstain: sum("abstain"), total: activeTenants.reduce((s, t) => s + Number(t.coefficient || 0), 0) };
  }
  const total = counts?.units !== undefined ? Number(counts.units) + 1 : activeTenants.length + 1;
  if (counts) return { mode: "unit", yes: Number(counts.yes || 0), no: Number(counts.no || 0), abstain: Number(counts.abstain || 0), total };
  const count = (v) => Object.values(votes).filter((x) => x === v).length;
  return { mode: "unit", yes: count("yes"), no: count("no"), abstain: count("abstain"), total };
}

function pollSummaryLines(poll) {
  const tally = pollTally(poll);
  const lines = [];
  const voted = tally.yes + tally.no + tally.abstain;
  const turnout = tally.total > 0 ? Math.round((voted / tally.total) * 100) : 0;
  if (tally.mode === "share") lines.push(tr("Counted by ownership share: YES {yes} · NO {no} · ABSTAIN {abstain} of {total}", { yes: tally.yes, no: tally.no, abstain: tally.abstain, total: tally.total }));
  if (poll.quorumPct) {
    lines.push(turnout >= Number(poll.quorumPct)
      ? tr("Turnout {pct}% — quorum of {q}% reached", { pct: turnout, q: poll.quorumPct })
      : tr("Turnout {pct}% — needs {q}%", { pct: turnout, q: poll.quorumPct }));
  }
  if (poll.closesOn) lines.push(pollIsOpen(poll) ? tr("Voting closes {date}", { date: formatDateLabel(poll.closesOn) }) : tr("Voting closed {date}", { date: formatDateLabel(poll.closesOn) }));
  if (!pollIsOpen(poll) && voted > 0) {
    const quorumOk = !poll.quorumPct || turnout >= Number(poll.quorumPct);
    lines.push(!quorumOk ? tr("Result: no decision (quorum not reached)")
      : tally.yes > tally.no ? tr("Result: YES") : tally.no > tally.yes ? tr("Result: NO") : tr("Result: tie"));
  }
  return lines;
}

// ── Attention items added by v148 ───────────────────────────────────────────
function extraAttentionItems() {
  const items = [];
  const toClose = monthToClose();
  if (toClose) items.push({ kind: "warn", text: tr("Close {month} now that its balances are out", { month: formatMonth(toClose) }), view: "reportsView", action: "closeMonth", arg: toClose, key: `closeMonth:${toClose}` });
  const cash = cashCheckDue();
  if (cash) items.push({ kind: "warn", text: cash.last ? tr("Count the cash — last count {date}", { date: formatDateLabel(cash.last.date) }) : tr("Count the cash once to check the books"), view: "reportsView", action: "cashCheck", key: "cashCheck" });
  const warning = generatorEfficiencyWarning();
  if (warning) items.push({ kind: "danger", text: generatorWarningText(warning), view: "servicesView" });
  const service = generatorServiceDue();
  if (service) items.push({ kind: service.overdue ? "danger" : "warn", text: service.overdue ? tr("Generator service is overdue") : tr("Generator service is due soon"), view: "servicesView" });
  const openIssues = (state.issues || []).filter((i) => i.status === "open");
  if (openIssues.length) items.push({ kind: "warn", text: tr(openIssues.length === 1 ? "{n} problem reported" : "{n} problems reported", { n: openIssues.length }), view: "issuesView" });
  const health = dataHealthIssues();
  if (health.length) items.push({ kind: "warn", text: tr(health.length === 1 ? "{n} thing to check in your data" : "{n} things to check in your data", { n: health.length }), view: "reportsView", key: "dataHealth" });
  items.push(...v155AttentionItems());
  items.push(...v158AttentionItems());
  items.push(...v160AttentionItems());
  if (keepaliveStale()) items.push({ kind: "danger", text: tr("The database keep-alive hasn't run since {date}. The free database pauses after a week without activity.", { date: formatDateLabel(localDateInputFrom(keepaliveLastOk)) }), view: "settingsView", key: "keepalive" });
  return items;
}

function handleExtraAttentionAction(row) {
  if (row.dataset.action === "closeMonth" && row.dataset.arg) {
    if (window.confirm(tr("Close {month}? Its figures can't change until you reopen it.", { month: formatMonth(row.dataset.arg) }))) setMonthClosed(row.dataset.arg, true);
    return true;
  }
  if (row.dataset.action === "cashCheck") { openCashCheckDialog(); return true; }
  if (row.dataset.action === "helpVideo") { openHelpVideo(row.dataset.arg || "tour"); return true; }
  return false;
}

function renderV148() {
  renderNotices();
  renderIssues();
  renderReports();
  renderGeneratorExtras();
  renderMaintenance();
  renderSuppliers();
  renderDocuments();
  renderMeetings();
  renderHelp();
  renderPushStatus();
  document.body.classList.toggle("view-only", isViewerSession() && sessionMode === "owner");
}

function attachV148Events() {
  els.closeToolDialog?.addEventListener("click", closeToolDialog);
  els.newNoticeButton?.addEventListener("click", openNoticeDialog);
  els.newIssueButton?.addEventListener("click", openIssueDialog);
  els.newMaintenanceButton?.addEventListener("click", () => openMaintenanceTaskDialog());
  els.inviteAllButton?.addEventListener("click", openInviteAllDialog);
  document.querySelector("#closeVideoDialog")?.addEventListener("click", closeHelpVideo);
  document.querySelector("#videoDialog")?.addEventListener("cancel", (event) => { event.preventDefault(); closeHelpVideo(); });
  els.readInvoiceButton?.addEventListener("click", () => { void readInvoiceIntoForm(); });
  els.newSupplierButton?.addEventListener("click", () => openSupplierDialog());
  els.newDocumentButton?.addEventListener("click", () => openDocumentDialog());
  els.newMeetingButton?.addEventListener("click", () => openMeetingDialog());
  els.whoPaidButton?.addEventListener("click", openWhoPaidDialog);
  els.adminsButton?.addEventListener("click", openAdminsDialog);
  els.pushToggleButton?.addEventListener("click", () => (pushIsOn() ? disablePushNotifications() : enablePushNotifications()));
  els.transactionServicePart?.addEventListener("change", syncTransactionFormMode);
}

// ═══════════════════════════════════════════════════════════════════════════
// v153 — exchange rate per entry, data health check, monthly building report,
// automatic balance notification on the 1st
// ═══════════════════════════════════════════════════════════════════════════

// ── Exchange rate locked on each entry ──────────────────────────────────────
// An amount typed in LBP keeps the rate of the day it was recorded, so changing
// the rate in Settings never rewrites old balances or closed months. Entries
// from before v153 are stamped once with the rate in force when first loaded.
function entryRate(transaction) {
  const rate = Number(transaction?.lbpRate || 0);
  return rate > 0 ? rate : getConversionRate();
}

function txUsd(transaction, usdAmount = 0, lbpAmount = 0) {
  return Number(usdAmount || 0) + Number(lbpAmount || 0) / entryRate(transaction);
}

function hasLbpAmount(t) {
  return Boolean(Number(t.debitLbp || 0) || Number(t.creditLbp || 0) || Number(t.balanceLbp || 0));
}

function stampLbpRates(target, rate) {
  let stamped = 0;
  (target?.transactions || []).forEach((t) => {
    if (!(Number(t.lbpRate) > 0) && hasLbpAmount(t)) {
      t.lbpRate = rate;
      stamped += 1;
    }
  });
  return stamped;
}

// ── Duplicate payments ──────────────────────────────────────────────────────
function isSamePayment(a, b) {
  if (a.category !== "Payments" || b.category !== "Payments" || a.id === b.id) return false;
  if (!a.tenantId || a.tenantId !== b.tenantId) return false;
  if (a.paymentGroupId && a.paymentGroupId === b.paymentGroupId) return false;
  if (Math.abs(transactionNetUsd(a) - transactionNetUsd(b)) >= 0.01) return false;
  const days = Math.abs(Date.parse(a.date || a.forMonth || "") - Date.parse(b.date || b.forMonth || "")) / 86400000;
  return days <= 3;
}

function findDuplicatePayment(newTransactions) {
  for (const entry of newTransactions) {
    const match = state.transactions.find((t) => isSamePayment(entry, t));
    if (match) return { entry, match };
  }
  return null;
}

// ── Data health check ───────────────────────────────────────────────────────
function dataHealthIssues() {
  const issues = [];
  const active = state.tenants.filter((t) => t.active !== false);
  const unitList = (list) => list.map((t) => t.unit || t.name).join(", ");

  const withCoefficient = active.filter((t) => Number(t.coefficient || 0) > 0);
  if (withCoefficient.length) {
    const sum = active.reduce((s, t) => s + Number(t.coefficient || 0), 0);
    if (sum !== COEFFICIENT_TOTAL) {
      issues.push({ text: tr("Coefficients add up to {sum}/1000 instead of 1000", { sum }), view: "tenantsView" });
    }
    const missing = active.filter((t) => !(Number(t.coefficient || 0) > 0));
    if (missing.length) issues.push({ text: tr("No coefficient for: {units}", { units: unitList(missing) }), view: "tenantsView" });
  }

  const noPhone = active.filter((t) => !String(t.phone || "").trim());
  if (noPhone.length) {
    issues.push({ text: tr(noPhone.length === 1 ? "{n} tenant has no phone number ({units})" : "{n} tenants have no phone number ({units})", { n: noPhone.length, units: unitList(noPhone) }), view: "tenantsView" });
  }

  const genMonths = getServiceMonths("generator");
  if (genMonths.length) {
    const noBreaker = active.filter((t) => !(Number(t.breakerAmps || 0) > 0));
    if (noBreaker.length) issues.push({ text: tr("No breaker size for: {units}", { units: unitList(noBreaker) }), view: "tenantsView" });
    const unbilled = genMonths.filter((m) => {
      const dist = computeServiceDistribution("generator", m);
      return dist.pools.totalUsd > 0.005 && !dist.distributed;
    });
    if (unbilled.length) issues.push({ text: tr("Generator costs without meter readings: {months}", { months: unbilled.map((m) => formatMonth(m)).join(", ") }), view: "servicesView" });
  }

  const payments = state.transactions.filter((t) => t.category === "Payments");
  const seen = new Set();
  payments.forEach((a) => {
    payments.forEach((b) => {
      if (a.id >= b.id || !isSamePayment(a, b)) return;
      const key = [a.id, b.id].join("|");
      if (seen.has(key)) return;
      seen.add(key);
      issues.push({
        text: tr("Possible duplicate payment: {name}, {amount} on {first} and {second}", {
          name: tenantName(a.tenantId), amount: formatUsd(transactionNetUsd(a)), first: formatDateLabel(a.date), second: formatDateLabel(b.date),
        }),
        view: "ledgerView",
      });
    });
  });

  const tomorrow = addDays(localDateInput(), 1);
  const future = state.transactions.filter((t) => t.date && t.date > tomorrow);
  if (future.length) issues.push({ text: tr(future.length === 1 ? "{n} entry is dated in the future" : "{n} entries are dated in the future", { n: future.length }), view: "ledgerView" });
  return issues;
}

function buildDataHealthSection() {
  const issues = dataHealthIssues();
  if (!issues.length) return note(tr("Everything looks right ✓"));
  return mk("div", { className: "history-list compact" }, issues.map((issue) => mk("div", { className: "health-row" },
    mk("span", { text: issue.text }),
    miniButton(tr("Go"), () => setView(issue.view)))));
}

// ── Monthly building report (PDF) ───────────────────────────────────────────
// Only shows what the building actually uses: the generator and water parts
// appear just for months that have generator or water costs or readings.
function monthlyReportData(month) {
  const key = monthKey(month);
  const monthIsoValue = monthIso(key);
  const inMonth = state.transactions.filter((t) => monthKey(String(transactionDateValue(t))) === key);
  const isCash = (t) => !(t.category === "Opening Balance" && t.tenantId);
  const payments = inMonth.filter((t) => t.category === "Payments");
  const moneyIn = roundUsd(payments.reduce((s, t) => s + transactionNetUsd(t), 0));
  const payers = new Set(payments.filter((t) => t.tenantId).map((t) => t.tenantId)).size;
  const spending = inMonth.filter(isSpending);
  const moneyOut = roundUsd(spending.reduce((s, t) => s + txUsd(t, t.debitUsd, t.debitLbp), 0));
  const categories = new Map();
  spending.forEach((t) => {
    const cat = spendingCategory(t);
    categories.set(cat, roundUsd((categories.get(cat) || 0) + txUsd(t, t.debitUsd, t.debitLbp)));
  });

  const generatorUsed = state.transactions.some((t) => t.category === "Services Expenses" && t.serviceType === "generator" && monthKey(t.forMonth || t.date || "") === key)
    || Boolean(getServiceReadingRecord("generator", monthIsoValue));
  let generator = null;
  if (generatorUsed) {
    const dist = computeServiceDistribution("generator", monthIsoValue);
    const litres = generatorEfficiencyRows().find((r) => monthKey(r.month) === key)?.litres || 0;
    generator = {
      fuelUsd: dist.pools.fuelUsd,
      maintenanceUsd: dist.pools.maintenanceUsd,
      kwh: dist.distributed ? dist.totalKwh : 0,
      costPerKwh: dist.distributed && dist.totalKwh > 0 ? dist.pools.totalUsd / dist.totalKwh : null,
      litres,
      billed: dist.distributed,
    };
  }
  const waterTx = state.transactions.filter((t) => t.category === "Services Expenses" && t.serviceType === "water" && monthKey(t.forMonth || t.date || "") === key);
  const water = waterTx.length ? { count: waterTx.length, totalUsd: roundUsd(waterTx.reduce((s, t) => s + txUsd(t, t.debitUsd, t.debitLbp), 0)) } : null;

  const active = state.tenants.filter((t) => t.active !== false);
  const owedAtEnd = roundUsd(active.reduce((s, t) => s + Math.max(0, getTenantMonthEndBalance(t.id, monthIsoValue)), 0));
  const notices = (state.announcements || []).filter((n) => monthKey(String(n.createdAt || "").slice(0, 10)) === key).map((n) => n.title);
  const issuesOpened = (state.issues || []).filter((i) => monthKey(String(i.createdAt || "").slice(0, 10)) === key).length;
  const issuesFixed = (state.issues || []).filter((i) => i.status === "fixed" && monthKey(String(i.updatedAt || "").slice(0, 10)) === key).length;
  return {
    month: monthIsoValue,
    moneyIn,
    moneyOut,
    payers,
    units: active.length,
    cashEnd: expectedCashOn(getMonthEndDate(monthIsoValue)),
    owedAtEnd,
    categories: [...categories.entries()].sort((a, b) => b[1] - a[1]),
    generator,
    water,
    notices,
    issuesOpened,
    issuesFixed,
    hasCash: inMonth.some(isCash),
  };
}

function buildMonthlyReportPdf(month) {
  const d = monthlyReportData(month);
  const C = {
    green: "#163832", soft: "#cfe3db", white: "#ffffff", ink: "#14211f", muted: "#61706b", tint: "#eef4ef",
    bar: "#1f6b5a", track: "#e4ece7", red: "#a23b3b", ok: "#0f513f", blue: "#315f9d",
  };
  const W = 595;
  const left = 40;
  const right = 555;
  const cmds = ["0.4 w"];
  const text = (value, x, y, size, bold, color, bg) => cmds.push(pdfTextCommand(value, x, y, size, bold, { color, bg }));
  const widthOf = (value, size, bold) => {
    const shown = pdfSafeText(currentLang === "ar" ? tr(String(value)) : value);
    return pdfNeedsImage(shown) ? shown.length * size * 0.5 : pdfTextWidth(shown, size, bold);
  };
  const textRight = (value, xr, y, size, bold, color, bg) => text(value, (xr - widthOf(value, size, bold)).toFixed(2), y, size, bold, color, bg);
  let y;
  const section = (title) => {
    text(title, left, y, 13, true, C.ink);
    cmds.push(`q ${pdfColor(C.soft)} RG 0.8 w ${left} ${y - 7} m ${right} ${y - 7} l S Q`);
    y -= 26;
  };
  const line = (label, value, color = C.ink) => {
    text(label, left, y, 10, false, C.muted);
    textRight(value, right, y, 10, true, color);
    y -= 18;
  };

  // Header and cards
  cmds.push(pdfFillRect(0, 742, W, 100, C.green));
  text(state.building?.name || "", left, 806, 12, true, C.soft, C.green);
  text("Monthly report", left, 776, 24, true, C.white, C.green);
  text(formatMonth(d.month), left, 756, 11, false, C.soft, C.green);
  const gap = 12;
  const cardW = (right - left - gap * 2) / 3;
  [
    ["Money in", formatUsd(d.moneyIn), C.ok],
    ["Money out", formatUsd(d.moneyOut), C.red],
    ["Cash at month end", formatUsd(d.cashEnd), d.cashEnd < -0.005 ? C.red : C.blue],
  ].forEach(([label, value, color], i) => {
    const x = left + i * (cardW + gap);
    cmds.push(pdfFillRect(x.toFixed(2), 662, cardW.toFixed(2), 60, C.tint));
    text(label, (x + 14).toFixed(2), 702, 9, false, C.muted, C.tint);
    text(value, (x + 14).toFixed(2), 676, 17, true, color, C.tint);
  });
  y = 630;

  // Where the money went
  section("Where the money went");
  if (!d.categories.length) {
    text("No expenses this month.", left, y, 10, false, C.muted);
    y -= 20;
  } else {
    const shown = d.categories.slice(0, 8);
    const rest = d.categories.slice(8).reduce((s, [, v]) => s + v, 0);
    if (rest > 0.005) shown.push([tr("Other"), roundUsd(rest)]);
    const max = Math.max(...shown.map(([, v]) => v), 1);
    const barLeft = left + 170;
    const barRight = right - 90;
    shown.forEach(([cat, usd]) => {
      text(pdfClip(cat, 28), left, y, 10, false, C.ink);
      cmds.push(pdfFillRect(barLeft, y - 2, barRight - barLeft, 9, C.track));
      cmds.push(pdfFillRect(barLeft, y - 2, Math.max(2, ((barRight - barLeft) * usd) / max).toFixed(2), 9, C.bar));
      textRight(formatUsd(usd), right, y, 10, true, C.ink);
      y -= 20;
    });
  }
  y -= 10;

  // Collection
  section("Collection");
  line(tr("Payments received"), formatUsd(d.moneyIn), C.ok);
  line(tr("Units that paid this month"), tr("{n} of {total}", { n: d.payers, total: d.units }));
  line(tr("Still owed at month end"), formatUsd(d.owedAtEnd), d.owedAtEnd > 0.005 ? C.red : C.ok);
  y -= 10;

  if (d.generator) {
    section("Generator");
    line(tr("Fuel"), formatUsd(d.generator.fuelUsd));
    line(tr("Maintenance"), formatUsd(d.generator.maintenanceUsd));
    if (d.generator.kwh) line(tr("Electricity used"), tr("{kwh} kWh", { kwh: numberFormat.format(d.generator.kwh) }));
    if (d.generator.costPerKwh) line(tr("Cost per kWh"), `$${d.generator.costPerKwh.toFixed(3)}`);
    if (d.generator.litres) line(tr("Diesel bought"), tr("{litres} litres", { litres: numberFormat.format(d.generator.litres) }));
    if (!d.generator.billed) line(tr("Meter readings"), tr("not entered yet"), C.red);
    y -= 10;
  }

  if (d.water) {
    section("Water");
    line(tr(d.water.count === 1 ? "{n} tanker" : "{n} tankers", { n: d.water.count }), formatUsd(d.water.totalUsd));
    y -= 10;
  }

  if (d.notices.length || d.issuesOpened || d.issuesFixed) {
    section("In the building");
    d.notices.slice(0, 4).forEach((title) => {
      text(`- ${pdfClip(title, 80)}`, left, y, 10, false, C.ink);
      y -= 18;
    });
    if (d.issuesOpened || d.issuesFixed) line(tr("Problems"), tr("{opened} reported, {fixed} fixed", { opened: d.issuesOpened, fixed: d.issuesFixed }));
  }

  text("Figures are from the building's account app. For any question, contact the building owner.", left, 61, 8.5, false, C.muted);
  cmds.push(`q ${pdfColor(C.soft)} RG 0.6 w ${left} 48 m ${right} 48 l S Q`);
  text(tr("{building} · {month}", { building: state.building?.name || "", month: formatMonth(d.month) }), left, 34, 8, false, C.muted);
  return buildMultiPagePdf([`${cmds.join("\n")}\n`]);
}

async function shareMonthlyReport(month) {
  const pdf = buildMonthlyReportPdf(month);
  const label = formatMonth(month);
  const caption = tr("{building} — monthly report, {month}", { building: state.building?.name || "", month: label });
  const fileName = `Monthly_report_${safeFilePart(state.building?.name || "Building", "Building")}_${monthKey(month)}.pdf`;
  try {
    if (typeof navigator.share === "function" && typeof File === "function") {
      const file = new File([pdf], fileName, { type: PDF_MIME });
      if (typeof navigator.canShare !== "function" || navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: caption, text: caption });
        showToast("Monthly report shared");
        return;
      }
    }
  } catch (error) {
    if (error?.name === "AbortError") { showToast("Sharing cancelled"); return; }
  }
  downloadBlob(pdf, PDF_MIME, fileName);
  showToast("Monthly report downloaded");
}

// ── Balance notification on the 1st ─────────────────────────────────────────
// The owner's device keeps a small list of what each unit owes in the shared
// document; on the 1st the database sends each linked tenant who owes money a
// phone notification from it (supabase/phase2g-monthly.sql). The list is
// removed from what tenants download.
function buildBalanceSnapshot() {
  const items = {};
  state.tenants.filter((t) => t.active !== false).forEach((t) => {
    items[t.id] = roundUsd(getTenantTotals(t.id).dueUsd);
  });
  return { at: localDateInput(), items };
}

function monthlyNoticesOn() {
  return state.settings.monthlyBalanceNotices !== false;
}

function buildAutoNoticeSection() {
  const toggle = checkboxRow(tr("On the 1st of each month, send each tenant who owes money a phone notification with their balance"), monthlyNoticesOn());
  toggle.input.addEventListener("change", () => {
    state.settings.monthlyBalanceNotices = toggle.input.checked;
    if (!saveState()) return;
    showToast(toggle.input.checked ? "Monthly balance notifications on" : "Monthly balance notifications off");
  });
  return mk("div", {}, toggle.row,
    note(tr("Only tenants who linked their phone and turned on notifications receive it. The amounts are the ones on your device the last time you saved.")));
}

function refreshBalanceSnapshot() {
  if (sessionMode !== "owner" || isViewerSession() || !hasCloudConfig()) return;
  const next = buildBalanceSnapshot();
  if (JSON.stringify(next.items) !== JSON.stringify(state.balanceSnapshot?.items || null)) saveState();
}

// ── Backup with photos (v154) ────────────────────────────────────────────────
// The plain backup file holds the data and only the storage path of each
// picture. This ZIP adds the pictures themselves, so nothing depends on the
// cloud storage surviving.
function backupPhotoList() {
  const list = [];
  const seen = new Set();
  const extOf = (p) => (/\.(jpe?g|png|webp|gif|heic|pdf)$/i.exec(p || "")?.[0] || ".jpg").toLowerCase();
  const add = (attachment, folder, parts, extra = {}) => {
    const storagePath = attachment?.storagePath;
    if (!storagePath) {
      if (attachment && attachmentUrl(attachment)) list.push({ external: attachmentUrl(attachment), label: parts.filter(Boolean).join(" "), ...extra });
      return;
    }
    if (seen.has(storagePath)) return;
    seen.add(storagePath);
    const base = parts.filter(Boolean).map((p) => safeFilePart(String(p), "photo")).join("_").slice(0, 90) || "photo";
    list.push({ path: storagePath, zipName: `photos/${folder}/${base}${extOf(storagePath)}`, label: parts.filter(Boolean).join(" "), ...extra });
  };
  state.transactions
    .slice()
    .sort((a, b) => String(transactionDateValue(a)).localeCompare(String(transactionDateValue(b))))
    .forEach((t) => {
      if (!t.invoiceAttachment) return;
      const isPayment = t.category === "Payments";
      add(t.invoiceAttachment, isPayment ? "payment-proofs" : "expenses",
        [t.date, isPayment ? tenantName(t.tenantId) : t.description, t.invoice || t.receiptRef, String(t.id).slice(-6)]);
    });
  (state.paymentDeclarations || []).forEach((d) => {
    if (d.proof) add(d.proof, "payment-proofs", [String(d.declaredAt || "").slice(0, 10), tenantName(d.tenantId), "declared", String(d.id).slice(-6)]);
  });
  (state.documents || []).forEach((d) => {
    if (d.storagePath) add({ storagePath: d.storagePath }, "documents", [d.category, d.title]);
  });
  (state.issues || []).forEach((i) => {
    if (i.photo) add(i.photo, "problems", [String(i.createdAt || "").slice(0, 10), i.title, String(i.id).slice(-6)]);
  });
  // Names must be unique inside the ZIP.
  const used = new Set();
  list.forEach((item) => {
    if (!item.zipName) return;
    let name = item.zipName;
    for (let n = 2; used.has(name.toLowerCase()); n += 1) name = item.zipName.replace(/(\.[a-z]+)$/, `-${n}$1`);
    used.add(name.toLowerCase());
    item.zipName = name;
  });
  return list;
}

async function fetchStoredPhoto(storagePath) {
  const c = cloudConfig();
  await ensureFreshSession();
  const res = await fetch(`${c.supabaseUrl}/storage/v1/object/authenticated/${SUPABASE_INVOICE_BUCKET}/${encodeURI(storagePath)}`, {
    headers: { apikey: c.supabaseKey, Authorization: `Bearer ${authBearer()}` },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return new Uint8Array(await res.arrayBuffer());
}

let photoBackupBusy = false;
async function downloadBackupWithPhotos() {
  if (sessionMode !== "owner") return;
  if (photoBackupBusy) return;
  if (cloudProvider() !== "supabase" || !authSession) {
    showToast("Sign in with Google as the owner to include the photos", 6000);
    return;
  }
  photoBackupBusy = true;
  const button = els.downloadBackupPhotosButton;
  if (button) button.disabled = true;
  try {
    const list = backupPhotoList();
    const stored = list.filter((item) => item.path);
    const files = [{ name: "backup.json", content: JSON.stringify(state, null, 2) }];
    const failed = [];
    let done = 0;
    const queue = stored.slice();
    const worker = async () => {
      while (queue.length) {
        const item = queue.shift();
        try {
          files.push({ name: item.zipName, content: await fetchStoredPhoto(item.path) });
        } catch (error) {
          failed.push(`${item.label} (${error.message})`);
        }
        done += 1;
        if (button) button.textContent = tr("{done} of {total}…", { done, total: stored.length });
      }
    };
    await Promise.all([worker(), worker(), worker(), worker()]);
    const external = list.filter((item) => item.external);
    const readme = [
      `${state.building?.name || "Building"} — backup with photos, ${localDateInput()}`,
      "",
      `backup.json: all the data. Restore it from Settings → Restore from a backup file.`,
      `photos/: ${files.length - 1} pictures (expenses, payment proofs, problems).`,
      ...(failed.length ? ["", "Could not be downloaded:", ...failed.map((f) => `- ${f}`)] : []),
      ...(external.length ? ["", "Older photos kept on Google Drive (not in this file):", ...external.map((e) => `- ${e.label}: ${e.external}`)] : []),
    ].join("\r\n");
    files.splice(1, 0, { name: "README.txt", content: readme });
    state.settings.lastPhotoBackupAt = localDateInput();
    saveState();
    renderAttention();
    const slug = safeFilePart(state.building?.name || "building", "building").toLowerCase();
    downloadBlob(new Blob([buildZip(files)], { type: "application/zip" }), "application/zip", `${slug}-backup-with-photos-${localDateInput()}.zip`);
    showToast(failed.length
      ? tr("Backup downloaded — {n} photos could not be included (listed in README.txt)", { n: failed.length })
      : tr("Backup with {n} photos downloaded", { n: files.length - 2 }), 6000);
  } catch (error) {
    showToast(describeSyncProblem(error), 6000);
  } finally {
    photoBackupBusy = false;
    if (button) {
      button.disabled = false;
      button.textContent = t("common.download");
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// v155 — edit a payment, maintenance calendar, backup reminder
// ═══════════════════════════════════════════════════════════════════════════

// ── Edit a payment ──────────────────────────────────────────────────────────
// Same form as recording one; the receipt number, proof photo and id stay.
function openPaymentEditDialog(transactionId) {
  if (sessionMode !== "owner") return;
  const transaction = state.transactions.find((entry) => entry.id === transactionId);
  if (!transaction || transaction.category !== "Payments") return;
  const closed = recordMonths("transaction", transaction).find(isMonthClosed);
  if (closed) { showToast(closedMonthError(closed).message, 5000); return; }
  resetTransactionForm();
  editingExpenseId = transaction.id;
  els.transactionDialogTitle.textContent = tr("Edit Payment");
  els.transactionSubmitButton.textContent = tr("Save");
  els.transactionCategory.value = "Payments";
  els.transactionCategory.disabled = true;
  syncTransactionFormMode();
  els.transactionTenant.value = transaction.tenantId || "";
  els.transactionDate.value = transaction.date || localDateInput();
  els.transactionMonth.value = monthKey(transaction.forMonth || transaction.date || localDateInput());
  els.transactionProject.value = transaction.project || "";
  if (els.transactionMethod) els.transactionMethod.value = transaction.method || "cash";
  const lbp = Number(transaction.creditLbp || 0);
  const usd = Number(transaction.creditUsd || 0);
  if (lbp > 0 && usd === 0) {
    els.transactionCurrency.value = "LBP";
    els.transactionAmount.value = amountInputValue(lbp);
  } else {
    els.transactionCurrency.value = "USD";
    els.transactionAmount.value = amountInputValue(usd);
  }
  syncTransactionFormMode();
  openDialog(els.transactionDialog);
}

// ── Maintenance calendar ────────────────────────────────────────────────────
const MAINTENANCE_PRESETS = [
  ["Lift inspection", 12],
  ["Water tank cleaning", 6],
  ["Fire extinguisher refill", 12],
  ["Building insurance renewal", 12],
  ["Pest control", 3],
  ["Roof and drains check", 12],
];

function addMonthsToDate(iso, months) {
  const [y, m, d] = String(iso).split("-").map(Number);
  const target = new Date(y, m - 1 + Number(months || 0), 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  return localDateInputFrom(new Date(target.getFullYear(), target.getMonth(), Math.min(d, lastDay)));
}

function maintenanceStatus(task, today = localDateInput()) {
  if (!task.nextDue) return "none";
  if (task.nextDue < today) return "overdue";
  return task.nextDue <= addDays(today, 14) ? "soon" : "ok";
}

function maintenanceDue() {
  return (state.maintenanceTasks || []).filter((task) => ["overdue", "soon"].includes(maintenanceStatus(task)));
}

function openMaintenanceTaskDialog(taskId = null, preset = null) {
  if (sessionMode !== "owner") return;
  const task = taskId ? (state.maintenanceTasks || []).find((t) => t.id === taskId) : null;
  const title = textInput(task?.title || preset?.[0] || "", { placeholder: tr("Lift inspection"), maxlength: "120" });
  const every = selectInput([[1, tr("Every month")], [2, tr("Every 2 months")], [3, tr("Every 3 months")], [6, tr("Every 6 months")], [12, tr("Every year")], [24, tr("Every 2 years")]], String(task?.everyMonths || preset?.[1] || 12));
  const nextDue = mk("input", { type: "date", value: task?.nextDue || addMonthsToDate(localDateInput(), 1) });
  const memo = mk("textarea", { rows: "2", placeholder: tr("Company, phone, contract number…"), maxlength: "500" });
  memo.value = task?.notes || "";
  const save = () => {
    if (!title.value.trim()) { showToast("Give the job a name"); return; }
    if (!nextDue.value) { showToast("Choose when it is next due"); return; }
    const fields = { title: title.value.trim(), everyMonths: Number(every.value), nextDue: nextDue.value, notes: memo.value.trim(), updatedAt: new Date().toISOString() };
    if (task) Object.assign(task, fields);
    else (state.maintenanceTasks ||= []).push({ id: newId("mnt"), history: [], ...fields });
    if (!saveState()) return;
    closeToolDialog();
    renderAll();
    showToast(task ? "Job updated" : "Job added to the calendar");
  };
  const remove = () => {
    if (!window.confirm(tr("Remove \"{name}\" from the calendar? Its history is removed too.", { name: task.title }))) return;
    state.maintenanceTasks = (state.maintenanceTasks || []).filter((t) => t.id !== task.id);
    recordDeletedId("maintenanceTasks", task.id);
    if (!saveState()) return;
    closeToolDialog();
    renderAll();
  };
  openToolDialog(task ? tr("Edit job") : tr("New maintenance job"),
    field(tr("Job"), title),
    field(tr("How often"), every),
    field(tr("Next due"), nextDue),
    field(tr("Notes"), memo),
    mk("div", { className: "button-row" },
      primaryButton(tr("Save"), save),
      task ? mk("button", { type: "button", className: "danger-button", text: tr("Delete"), onclick: remove }) : secondaryButton(tr("Cancel"), closeToolDialog)));
}

function openMaintenanceDoneDialog(taskId) {
  const task = (state.maintenanceTasks || []).find((t) => t.id === taskId);
  if (!task || sessionMode !== "owner") return;
  const date = mk("input", { type: "date", value: localDateInput() });
  const cost = numberInput("");
  const memo = textInput("", { placeholder: tr("Optional") });
  const asExpense = checkboxRow(tr("Also record the cost as a building expense"), true);
  const nextPreview = note("");
  const update = () => { nextPreview.textContent = tr("Next due: {date}", { date: formatDateLabel(addMonthsToDate(date.value || localDateInput(), task.everyMonths)) }); };
  date.addEventListener("input", update);
  update();
  const save = () => {
    const doneOn = date.value || localDateInput();
    const amount = Number(cost.value || 0);
    if (amount > 0 && asExpense.input.checked) {
      if (isMonthClosed(doneOn)) { showToast(closedMonthError(doneOn).message, 5000); return; }
      const shares = computeSharedExpenseShares(amount, "coefficient", doneOn);
      state.transactions.push({
        id: newId("tx"), category: "Expenses", description: task.title, tenantId: null, forMonth: null, project: "", date: doneOn,
        supplier: "", invoice: "", expenseCategory: tr("Maintenance"), serviceType: "", servicePart: "",
        debitUsd: amount, debitLbp: 0, creditUsd: 0, creditLbp: 0, balanceUsd: -amount, balanceLbp: 0,
        invoiceAttachment: null, sourceRow: null, shares: Object.keys(shares).length ? shares : null, maintenanceTaskId: task.id,
      });
    }
    task.history = [...(task.history || []), { date: doneOn, costUsd: amount, note: memo.value.trim() }].slice(-30);
    task.lastDone = doneOn;
    task.nextDue = addMonthsToDate(doneOn, task.everyMonths);
    task.updatedAt = new Date().toISOString();
    if (!saveState()) return;
    closeToolDialog();
    renderAll();
    showToast(tr("Done. Next due {date}", { date: formatDateLabel(task.nextDue) }));
  };
  openToolDialog(tr("Mark done — {name}", { name: task.title }),
    field(tr("Done on"), date),
    field(tr("Cost (USD, optional)"), cost),
    asExpense.row,
    field(tr("Note"), memo),
    nextPreview,
    mk("div", { className: "button-row" }, primaryButton(tr("Mark done"), save), secondaryButton(tr("Cancel"), closeToolDialog)));
}

function renderMaintenance() {
  if (!els.maintenanceList) return;
  if (sessionMode !== "owner") { els.maintenanceList.replaceChildren(); return; }
  const tasks = (state.maintenanceTasks || []).slice().sort((a, b) => String(a.nextDue || "9999").localeCompare(String(b.nextDue || "9999")));
  const presets = MAINTENANCE_PRESETS.filter(([name]) => !tasks.some((t) => t.title.toLowerCase() === tr(name).toLowerCase()));
  const presetRow = presets.length
    ? mk("div", { className: "preset-row" },
      mk("span", { className: "settings-note", text: tasks.length ? tr("Add a common job:") : tr("Start with a common job:") }),
      presets.map((preset) => miniButton(`+ ${tr(preset[0])}`, () => openMaintenanceTaskDialog(null, [tr(preset[0]), preset[1]]))))
    : null;
  const LABEL = { overdue: "Overdue", soon: "Due soon", ok: "Scheduled", none: "No date" };
  const PILL = { overdue: "status-due", soon: "status-partial", ok: "status-paid", none: "status-none" };
  const cards = tasks.map((task) => {
    const status = maintenanceStatus(task);
    const last = (task.history || []).slice(-1)[0];
    const everyText = Number(task.everyMonths) === 12 ? tr("Every year") : Number(task.everyMonths) === 1 ? tr("Every month") : tr("Every {n} months", { n: task.everyMonths });
    return mk("article", { className: "notice-card" },
      mk("div", { className: "notice-head" }, mk("strong", { text: task.title }), mk("span", { className: `status-pill ${PILL[status]}`, text: tr(LABEL[status]) })),
      mk("p", { className: "notice-body", text: tr("Next due {date} · {every}", { date: task.nextDue ? formatDateLabel(task.nextDue) : "—", every: everyText }) }),
      last ? mk("p", { className: "notice-until", text: tr("Last done {date}{cost}", { date: formatDateLabel(last.date), cost: last.costUsd ? ` · ${formatUsd(last.costUsd)}` : "" }) }) : null,
      task.notes ? mk("p", { className: "notice-until", text: task.notes }) : null,
      mk("div", { className: "notice-actions" },
        miniButton(tr("Mark done"), () => openMaintenanceDoneDialog(task.id)),
        miniButton(tr("Edit"), () => openMaintenanceTaskDialog(task.id))));
  });
  els.maintenanceList.replaceChildren(
    ...(cards.length ? cards : [mk("div", { className: "empty-state", text: tr("No jobs yet. Add the inspections, cleanings and renewals the building needs, and the app reminds you before each is due.") })]),
    ...(presetRow ? [presetRow] : []),
  );
}

// ── Backup reminder ─────────────────────────────────────────────────────────
function photoBackupDue() {
  if (sessionMode !== "owner" || isViewerSession() || cloudProvider() !== "supabase" || !state.transactions.length) return null;
  const last = state.settings.lastPhotoBackupAt || "";
  if (!last) return { last: null };
  const days = (Date.parse(localDateInput()) - Date.parse(last)) / 86400000;
  return days > 31 ? { last } : null;
}

function v155AttentionItems() {
  const items = [];
  const due = maintenanceDue();
  if (due.length === 1) {
    const task = due[0];
    items.push({ kind: maintenanceStatus(task) === "overdue" ? "danger" : "warn", text: maintenanceStatus(task) === "overdue" ? tr("{name} is overdue (was due {date})", { name: task.title, date: formatDateLabel(task.nextDue) }) : tr("{name} is due {date}", { name: task.title, date: formatDateLabel(task.nextDue) }), view: "maintenanceView" });
  } else if (due.length > 1) {
    items.push({ kind: due.some((t) => maintenanceStatus(t) === "overdue") ? "danger" : "warn", text: tr("{n} maintenance jobs are due", { n: due.length }), view: "maintenanceView" });
  }
  const backup = photoBackupDue();
  if (backup) {
    items.push({ kind: "warn", text: backup.last ? tr("Download a backup with photos — last one {date}", { date: formatDateLabel(backup.last) }) : tr("Download your first backup with photos"), view: "settingsView", action: "photoBackup", key: "photoBackup" });
  }
  return items;
}

// ── Hiding "Needs Attention" reminders (v156) ───────────────────────────────
// Each reminder has a key. Ones tied to a period (this month's reminders, a
// month to close) carry that period, so hiding one never hides next month's.
// Reminders without an explicit key use their text: if the situation changes
// (a new amount, another date), the reminder comes back.
function attentionKey(item) {
  return item.key || `text:${item.text}`;
}

function hiddenAttention() {
  return state.settings.hiddenAttention || {};
}

function isAttentionHidden(item, today = localDateInput()) {
  const until = hiddenAttention()[attentionKey(item)];
  return until === "forever" || (Boolean(until) && until > today);
}

function hideAttention(key, until) {
  const map = { ...hiddenAttention() };
  // Drop expired entries while we're here.
  const today = localDateInput();
  Object.keys(map).forEach((k) => { if (map[k] !== "forever" && map[k] <= today) delete map[k]; });
  if (until) map[key] = until;
  else delete map[key];
  state.settings.hiddenAttention = map;
  if (!saveState()) return;
  renderAttention();
}

function openAttentionHideDialog(key, text) {
  const choose = (until, message) => {
    closeToolDialog();
    hideAttention(key, until);
    showToast(message);
  };
  openToolDialog(tr("Hide this reminder"),
    note(text),
    mk("div", { className: "hide-choices" },
      secondaryButton(tr("For a week"), () => choose(addDays(localDateInput(), 7), "Hidden for a week")),
      secondaryButton(tr("For a month"), () => choose(addDays(localDateInput(), 30), "Hidden for a month")),
      primaryButton(tr("Don't show it again"), () => choose("forever", "Reminder hidden")),
      mk("button", { type: "button", className: "mini-button", text: tr("Cancel"), onclick: closeToolDialog })),
    note(tr("Hidden reminders are listed at the bottom of Needs Attention, where you can show them again.")));
}

let hiddenAttentionItems = [];
function openHiddenAttentionDialog() {
  const items = hiddenAttentionItems;
  if (!items.length) return;
  const map = hiddenAttention();
  openToolDialog(tr("Hidden reminders"),
    mk("div", { className: "history-list compact" }, items.map((item) => {
      const until = map[attentionKey(item)];
      return mk("div", { className: "health-row" },
        mk("span", {},
          mk("strong", { text: item.text }),
          mk("small", { className: "field-hint", text: until === "forever" ? tr("Hidden for good") : tr("Hidden until {date}", { date: formatDateLabel(until) }) })),
        miniButton(tr("Show again"), () => { hideAttention(attentionKey(item), null); openHiddenAttentionDialog(); if (!hiddenAttentionItems.length) closeToolDialog(); }));
    })),
    mk("div", { className: "button-row" },
      primaryButton(tr("Show all again"), () => {
        const map2 = { ...hiddenAttention() };
        items.forEach((item) => delete map2[attentionKey(item)]);
        state.settings.hiddenAttention = map2;
        if (!saveState()) return;
        closeToolDialog();
        renderAttention();
      }),
      secondaryButton(tr("Close"), closeToolDialog)));
}

// ═══════════════════════════════════════════════════════════════════════════
// v157 — tenants on board, how payments were made, "Who paid?", receipts on
// tenants' phones, unit details
// ═══════════════════════════════════════════════════════════════════════════

// ── Who's connected ─────────────────────────────────────────────────────────
// { tenantId: { phones, notifications } } from rpc/list_tenant_links (owner).
let tenantLinkInfo = null;

async function refreshTenantLinks() {
  if (!isAdminSession() || cloudProvider() !== "supabase") return;
  try {
    const res = await supabaseRequest("rpc/list_tenant_links", { method: "POST", body: "{}" });
    const rows = await res.json();
    tenantLinkInfo = Object.fromEntries((rows || []).map((r) => [r.tenant_id, { phones: Number(r.phones || 0), notifications: Number(r.notifications || 0) }]));
    renderTenants();
  } catch { /* SQL not applied yet, or offline: show nothing */ }
}

function tenantLinkLine(tenant) {
  if (!tenantLinkInfo || tenant.active === false) return null;
  const info = tenantLinkInfo[tenant.id];
  if (!info?.phones) return mk("span", { className: "tenant-link-line is-off", text: tr("Phone not linked yet") });
  return mk("span", { className: "tenant-link-line", text: info.notifications ? tr("Phone linked · notifications on") : tr("Phone linked · notifications off") });
}

function openInviteAllDialog() {
  if (!isOwnerSession()) { showToast("Sign in with Google first: only the signed-in owner can create invite codes", 6000); return; }
  const active = state.tenants.filter((t) => t.active !== false)
    .slice().sort((a, b) => String(a.unit || "").localeCompare(String(b.unit || ""), undefined, { numeric: true }));
  const rows = active.map((tenant) => {
    const info = tenantLinkInfo?.[tenant.id];
    const status = mk("small", { className: "field-hint", text: info?.phones ? tr("Already linked") : tenant.phone ? tr("Not linked yet") : tr("Not linked yet · no phone number saved") });
    const button = miniButton(info?.phones ? tr("Send again") : tr("Send invite"), async () => {
      // Open the WhatsApp window inside the tap so the phone doesn't block it.
      const win = window.open("", "_blank");
      button.disabled = true;
      try {
        const res = await supabaseRequest("rpc/create_claim_code", { method: "POST", body: JSON.stringify({ p_tenant_id: tenant.id }) });
        const code = String(await res.json());
        const link = whatsappLink(tenant.phone, inviteWhatsAppMessage(tenant, code));
        if (win) win.location.href = link;
        else window.open(link, "_blank", "noopener");
        button.textContent = tr("Sent ✓");
      } catch (error) {
        if (win) win.close();
        button.disabled = false;
        showToast(describeSyncProblem(error), 6000);
      }
    });
    return mk("div", { className: "health-row" },
      mk("span", {}, mk("strong", { text: `${tenant.unit || ""} · ${tenant.name}` }), status),
      button);
  });
  openToolDialog(tr("Invite all tenants"),
    note(tr("Each tenant gets their own one-time code on WhatsApp, with the link and how to add the app to their home screen. Tap Send for each one.")),
    mk("div", { className: "history-list compact" }, rows),
    mk("div", { className: "button-row" }, secondaryButton(tr("Done"), () => { closeToolDialog(); refreshTenantLinks(); })));
}

// ── How a payment was made, where an expense was paid from ──────────────────
const PAYMENT_METHODS = [["cash", "Cash"], ["bank", "Bank transfer"], ["omt", "OMT"], ["whish", "Whish"], ["cheque", "Cheque"]];
// OMT is picked up as cash; transfers, Whish and cheques land in the bank/wallet.
const METHOD_ACCOUNT = { cash: "cash", omt: "cash", bank: "bank", whish: "bank", cheque: "bank" };

function methodLabel(method) {
  return tr((PAYMENT_METHODS.find(([v]) => v === method) || [null, method])[1] || "");
}

function transactionAccount(t) {
  if (t.category === "Payments" || t.category === "Advance Payments") return METHOD_ACCOUNT[t.method] || "cash";
  if (t.category === "Expenses" || t.category === "Services Expenses") return t.paidFrom === "bank" ? "bank" : "cash";
  return t.account === "bank" ? "bank" : "cash";
}

// What the books say is in the cash box and in the bank/wallets on a date.
function expectedByAccount(date) {
  const totals = { cash: 0, bank: 0 };
  state.transactions
    .filter((t) => !(t.category === "Opening Balance" && t.tenantId))
    .filter((t) => String(transactionDateValue(t)) <= date)
    .forEach((t) => { totals[transactionAccount(t)] += transactionNetUsd(t); });
  return { cash: roundUsd(totals.cash), bank: roundUsd(totals.bank) };
}

// ── "Who paid?" checklist ───────────────────────────────────────────────────
function openWhoPaidDialog() {
  if (sessionMode !== "owner") return;
  const month = selectedMonth || currentMonthValue();
  const date = mk("input", { type: "date", value: localDateInput() });
  const tenants = state.tenants.filter((t) => t.active !== false)
    .slice().sort((a, b) => String(a.unit || "").localeCompare(String(b.unit || ""), undefined, { numeric: true }));
  const rows = tenants.map((tenant) => {
    const owed = roundUsd(Math.max(0, getTenantBalance(tenant.id)));
    const tick = mk("input", { type: "checkbox", className: "recurring-tick" });
    const amount = mk("input", { type: "number", className: "recurring-amount", min: "0", step: "0.01", inputmode: "decimal", value: owed ? owed.toFixed(2) : "" });
    const method = selectInput(PAYMENT_METHODS.map(([v, l]) => [v, tr(l)]), "cash");
    method.className = "whopaid-method";
    amount.addEventListener("input", () => { tick.checked = Number(amount.value || 0) > 0; });
    const row = mk("div", { className: "whopaid-row" },
      tick,
      mk("div", { className: "recurring-text" }, mk("strong", { text: `${tenant.unit || ""} · ${tenant.name}` }), mk("span", { text: owed ? tr("Owes {amount}", { amount: formatUsd(owed) }) : tr("Nothing due") })),
      amount, method);
    return { tenant, tick, amount, method, row };
  });
  const save = () => {
    const chosen = rows.filter((r) => r.tick.checked && Number(r.amount.value || 0) > 0);
    if (!chosen.length) { showToast("Tick at least one tenant with an amount"); return; }
    const day = date.value || localDateInput();
    if (isMonthClosed(day)) { showToast(closedMonthError(day).message, 5000); return; }
    const created = [];
    chosen.forEach((r, i) => {
      const value = roundUsd(Number(r.amount.value));
      const groupId = `pay-${Date.now()}-${i}`;
      const payment = {
        id: `${groupId}-01`, category: "Payments", description: r.tenant.name, tenantId: r.tenant.id, forMonth: month, project: "",
        date: day, supplier: "", invoice: "", expenseCategory: "", serviceType: "", servicePart: "",
        debitUsd: 0, debitLbp: 0, creditUsd: value, creditLbp: 0, balanceUsd: value, balanceLbp: 0,
        invoiceAttachment: null, sourceRow: null, paymentGroupId: groupId, method: r.method.value,
      };
      payment.receiptRef = nextReceiptReference(day);
      state.transactions.push(payment);
      created.push(payment);
    });
    if (!saveState()) return;
    closeToolDialog();
    renderAll();
    created.forEach((p) => notifyTenants(p.tenantId, tr("Payment received"), tr("{amount} recorded — thank you.", { amount: formatUsd(p.creditUsd) })));
    showToast(tr(created.length === 1 ? "{n} payment recorded with its receipt" : "{n} payments recorded with their receipts", { n: created.length }));
  };
  openToolDialog(tr("Who paid? — {month}", { month: formatMonth(month) }),
    note(tr("Tick everyone who paid and check the amount. Each payment gets its own receipt.")),
    field(tr("Date received"), date),
    mk("div", { className: "recurring-list" }, rows.map((r) => r.row)),
    mk("div", { className: "button-row" }, primaryButton(tr("Record payments"), save), secondaryButton(tr("Cancel"), closeToolDialog)));
}

// ── Receipts on the tenant's own phone ──────────────────────────────────────
function tenantRecentPaymentsCard() {
  const mine = state.transactions
    .filter((t) => t.tenantId === sessionTenantId && isReceiptablePayment(t))
    .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")))
    .slice(0, 3);
  if (!mine.length) return null;
  return mk("article", { className: "notice-card" },
    mk("div", { className: "notice-head" }, mk("strong", { text: tr("Your recent payments") })),
    mine.map((t) => mk("div", { className: "health-row plain" },
      mk("span", { text: `${formatDateLabel(t.date)} · ${formatUsd(transactionNetUsd(t))}${t.method ? ` · ${methodLabel(t.method)}` : ""}` }),
      miniButton(tr("Receipt"), () => { void sharePaymentReceiptPdf(t.id); }))));
}

// ── Unit details (owner only) ───────────────────────────────────────────────
const UNIT_DETAIL_FIELDS = [
  ["phone2", "Second phone"],
  ["residents", "Number of residents"],
  ["parking", "Parking spot / car plate"],
  ["emergency", "Emergency contact"],
  ["notes", "Notes"],
];

function openUnitDetailsDialog(tenantId) {
  const tenant = state.tenants.find((t) => t.id === tenantId);
  if (!tenant || sessionMode !== "owner") return;
  const details = tenant.details || {};
  const inputs = Object.fromEntries(UNIT_DETAIL_FIELDS.map(([key]) => [key, key === "notes"
    ? Object.assign(mk("textarea", { rows: "3", maxlength: "600" }), { value: details.notes || "" })
    : textInput(details[key] || "", { maxlength: "120", ...(key === "residents" ? { inputmode: "numeric" } : {}) })]));
  const save = () => {
    const next = {};
    UNIT_DETAIL_FIELDS.forEach(([key]) => { const v = String(inputs[key].value || "").trim(); if (v) next[key] = v; });
    tenant.details = next;
    if (!saveState()) return;
    closeToolDialog();
    renderAll();
    showToast("Unit details saved");
  };
  openToolDialog(tr("Unit {unit} — details", { unit: tenant.unit || "" }),
    note(tr("Only you see these.")),
    UNIT_DETAIL_FIELDS.map(([key, label]) => field(tr(label), inputs[key])),
    mk("div", { className: "button-row" }, primaryButton(tr("Save"), save), secondaryButton(tr("Cancel"), closeToolDialog)));
}

// ═══════════════════════════════════════════════════════════════════════════
// v158 — supplier book, documents folder, budget vs actual, reserve target,
// meeting minutes, close the year
// ═══════════════════════════════════════════════════════════════════════════

// ── Supplier book ───────────────────────────────────────────────────────────
function supplierExpenses(name) {
  const key = String(name || "").trim().toLowerCase();
  return state.transactions
    .filter((t) => (t.category === "Expenses" || t.category === "Services Expenses") && String(t.supplier || "").trim().toLowerCase() === key)
    .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
}

function openSupplierDialog(supplierId = null) {
  if (sessionMode !== "owner") return;
  const supplier = supplierId ? (state.suppliers || []).find((s) => s.id === supplierId) : null;
  const name = textInput(supplier?.name || "", { placeholder: tr("Supplier name"), maxlength: "120" });
  const trade = textInput(supplier?.trade || "", { placeholder: tr("Plumber, electrician, generator…"), maxlength: "80" });
  const phone = mk("input", { type: "tel", value: supplier?.phone || "", placeholder: "70 123 456" });
  const memo = mk("textarea", { rows: "3", maxlength: "600" });
  memo.value = supplier?.notes || "";
  const save = () => {
    const n = name.value.trim();
    if (!n) { showToast("Enter the supplier's name"); return; }
    const fields = { name: n, trade: trade.value.trim(), phone: phone.value.trim(), notes: memo.value.trim() };
    if (supplier) {
      const oldName = supplier.name;
      Object.assign(supplier, fields);
      // Renaming keeps the history: expenses follow the new name.
      if (oldName !== n) state.transactions.forEach((t) => { if (String(t.supplier || "").trim().toLowerCase() === oldName.toLowerCase()) t.supplier = n; });
    } else {
      if ((state.suppliers || []).some((s) => s.name.toLowerCase() === n.toLowerCase())) { showToast("That supplier is already in the book"); return; }
      (state.suppliers ||= []).push({ id: newId("sup"), ...fields });
    }
    if (!saveState()) return;
    closeToolDialog();
    renderAll();
    showToast("Supplier saved");
  };
  const remove = () => {
    if (!window.confirm(tr("Remove {name} from the supplier book? Their past expenses stay.", { name: supplier.name }))) return;
    state.suppliers = (state.suppliers || []).filter((s) => s.id !== supplier.id);
    recordDeletedId("suppliers", supplier.id);
    if (!saveState()) return;
    closeToolDialog();
    renderAll();
  };
  openToolDialog(supplier ? tr("Edit supplier") : tr("New supplier"),
    field(tr("Name"), name),
    field(tr("What they do"), trade),
    field(tr("Phone"), phone),
    field(tr("Notes"), memo),
    mk("div", { className: "button-row" },
      primaryButton(tr("Save"), save),
      supplier ? mk("button", { type: "button", className: "danger-button", text: tr("Delete"), onclick: remove }) : secondaryButton(tr("Cancel"), closeToolDialog)));
}

function openSupplierHistory(supplierId) {
  const supplier = (state.suppliers || []).find((s) => s.id === supplierId);
  if (!supplier) return;
  const list = supplierExpenses(supplier.name);
  openToolDialog(supplier.name,
    note(list.length ? tr("{n} invoices · {total} in total", { n: list.length, total: formatUsd(list.reduce((s, t) => s + txUsd(t, t.debitUsd, t.debitLbp), 0)) }) : tr("No expenses recorded with this supplier yet.")),
    mk("div", { className: "history-list compact" }, list.slice(0, 40).map((t) => mk("div", { className: "health-row" },
      mk("span", {}, mk("strong", { text: `${formatDateLabel(t.date)} · ${formatUsd(txUsd(t, t.debitUsd, t.debitLbp))}` }), mk("small", { className: "field-hint", text: [t.description, t.invoice].filter(Boolean).join(" · ") })),
      hasInvoicePhoto(t.invoiceAttachment) ? miniButton(tr("Invoice"), () => openInvoicePhoto(t.invoiceAttachment)) : mk("span")))));
}

function renderSuppliers() {
  if (!els.supplierList) return;
  if (sessionMode !== "owner") { els.supplierList.replaceChildren(); return; }
  const suppliers = (state.suppliers || []).slice().sort((a, b) => a.name.localeCompare(b.name));
  if (!suppliers.length) {
    els.supplierList.replaceChildren(mk("div", { className: "empty-state", text: tr("No suppliers yet. Add the people you call for the building: plumber, electrician, generator technician, cleaner…") }));
    return;
  }
  els.supplierList.replaceChildren(...suppliers.map((s) => {
    const spent = supplierExpenses(s.name);
    const total = spent.reduce((sum, t) => sum + txUsd(t, t.debitUsd, t.debitLbp), 0);
    return mk("article", { className: "notice-card" },
      mk("div", { className: "notice-head" }, mk("strong", { text: s.name }), s.trade ? mk("span", { text: s.trade }) : null),
      mk("p", { className: "notice-until", text: spent.length ? tr("{n} invoices · {total} · last {date}", { n: spent.length, total: formatUsd(total), date: formatDateLabel(spent[0].date) }) : tr("No expenses yet") }),
      s.notes ? mk("p", { className: "notice-until", text: s.notes }) : null,
      mk("div", { className: "notice-actions" },
        s.phone ? mk("a", { className: "mini-button", href: `tel:${String(s.phone).replace(/[^\d+]/g, "")}`, text: tr("Call") }) : null,
        s.phone ? mk("a", { className: "mini-button", href: whatsappLink(s.phone, ""), target: "_blank", rel: "noopener", text: "WhatsApp" }) : null,
        miniButton(tr("History"), () => openSupplierHistory(s.id)),
        miniButton(tr("Edit"), () => openSupplierDialog(s.id))));
  }));
}

// ── Documents folder (owner only) ───────────────────────────────────────────
const DOCUMENT_CATEGORIES = ["Contract", "Insurance", "Permit", "Invoice", "Other"];

async function uploadDocumentFile(file, id) {
  if (cloudProvider() !== "supabase" || !authSession) throw new Error("Sign in with Google to upload documents");
  if (file.size > 15 * 1024 * 1024) throw new Error("That file is too big (15 MB at most)");
  const ext = (/\.[a-z0-9]{1,5}$/i.exec(file.name)?.[0] || "").toLowerCase();
  const path = `documents/${id}-${safeFilePart(file.name.replace(/\.[^.]+$/, ""), "document").slice(0, 60)}${ext}`;
  const c = cloudConfig();
  await ensureFreshSession();
  const res = await fetch(`${c.supabaseUrl}/storage/v1/object/${SUPABASE_INVOICE_BUCKET}/${encodeURI(path)}`, {
    method: "POST",
    headers: { apikey: c.supabaseKey, Authorization: `Bearer ${authBearer()}`, "Content-Type": file.type || "application/octet-stream", "x-upsert": "false" },
    body: file,
  });
  if (!res.ok) throw Object.assign(new Error(tr("Upload failed ({status})", { status: res.status })), { status: res.status });
  return { storagePath: path, fileName: file.name, mimeType: file.type || "application/octet-stream", size: file.size };
}

function openDocumentDialog(documentId = null) {
  if (sessionMode !== "owner") return;
  const doc = documentId ? (state.documents || []).find((d) => d.id === documentId) : null;
  const title = textInput(doc?.title || "", { placeholder: tr("Building insurance 2026"), maxlength: "120" });
  const category = selectInput(DOCUMENT_CATEGORIES.map((c) => [c, tr(c)]), doc?.category || "Contract");
  const expires = mk("input", { type: "date", value: doc?.expiresOn || "" });
  const file = mk("input", { type: "file", accept: "application/pdf,image/*" });
  const submit = primaryButton(tr("Save"), async () => {
    if (!title.value.trim()) { showToast("Give the document a title"); return; }
    const picked = file.files?.[0] || null;
    if (!doc && !picked) { showToast("Choose the file"); return; }
    submit.disabled = true;
    try {
      const id = doc?.id || newId("doc");
      const uploaded = picked ? await uploadDocumentFile(picked, id) : null;
      const fields = { title: title.value.trim(), category: category.value, expiresOn: expires.value || "", updatedAt: new Date().toISOString() };
      if (doc) {
        const previous = uploaded ? { storagePath: doc.storagePath } : null;
        Object.assign(doc, fields, uploaded || {});
        if (previous?.storagePath) deleteInvoicePhoto(previous);
      } else {
        (state.documents ||= []).push({ id, ...fields, ...uploaded, uploadedAt: new Date().toISOString() });
      }
      if (!saveState()) return;
      closeToolDialog();
      renderAll();
      showToast("Document saved");
    } catch (error) {
      showToast(error.status ? describeSyncProblem(error) : error.message, 6000);
    } finally {
      submit.disabled = false;
    }
  });
  const remove = () => {
    if (!window.confirm(tr("Delete \"{name}\"? The file is deleted too.", { name: doc.title }))) return;
    state.documents = (state.documents || []).filter((d) => d.id !== doc.id);
    recordDeletedId("documents", doc.id);
    if (!saveState()) return;
    if (doc.storagePath) deleteInvoicePhoto({ storagePath: doc.storagePath });
    closeToolDialog();
    renderAll();
  };
  openToolDialog(doc ? tr("Edit document") : tr("New document"),
    note(tr("Contracts, insurance, permits… stored privately: only administrators can open them.")),
    field(tr("Title"), title),
    field(tr("Type"), category),
    field(tr("Expires on (optional)"), expires, tr("You'll be reminded a month before.")),
    field(doc ? tr("Replace the file (optional)") : tr("File (PDF or photo)"), file),
    mk("div", { className: "button-row" }, submit,
      doc ? mk("button", { type: "button", className: "danger-button", text: tr("Delete"), onclick: remove }) : secondaryButton(tr("Cancel"), closeToolDialog)));
}

function documentsExpiring() {
  const today = localDateInput();
  const soon = addDays(today, 30);
  return (state.documents || []).filter((d) => d.expiresOn && d.expiresOn <= soon);
}

function renderDocuments() {
  if (!els.documentList) return;
  if (sessionMode !== "owner") { els.documentList.replaceChildren(); return; }
  const docs = (state.documents || []).slice().sort((a, b) => String(a.category).localeCompare(String(b.category)) || String(a.title).localeCompare(String(b.title)));
  if (!docs.length) {
    els.documentList.replaceChildren(mk("div", { className: "empty-state", text: tr("No documents yet. Keep the building's contracts, insurance and permits here, with a reminder before they expire.") }));
    return;
  }
  const today = localDateInput();
  els.documentList.replaceChildren(...docs.map((d) => {
    const expired = d.expiresOn && d.expiresOn < today;
    const soon = d.expiresOn && !expired && d.expiresOn <= addDays(today, 30);
    return mk("article", { className: "notice-card" },
      mk("div", { className: "notice-head" }, mk("strong", { text: d.title }), mk("span", { text: tr(d.category || "Other") })),
      d.expiresOn ? mk("p", { className: `notice-until${expired || soon ? " is-warning-text" : ""}`, text: expired ? tr("Expired {date}", { date: formatDateLabel(d.expiresOn) }) : tr("Expires {date}", { date: formatDateLabel(d.expiresOn) }) }) : null,
      mk("p", { className: "notice-until", text: `${d.fileName || ""}${d.size ? ` · ${Math.max(1, Math.round(d.size / 1024))} KB` : ""}` }),
      mk("div", { className: "notice-actions" },
        d.storagePath ? miniButton(tr("Open"), () => openInvoicePhoto({ storagePath: d.storagePath, fileName: d.fileName })) : null,
        miniButton(tr("Edit"), () => openDocumentDialog(d.id))));
  }));
}

// ── Budget vs actual ────────────────────────────────────────────────────────
function budgetYear() {
  return String(new Date().getFullYear());
}

function budgetRows(year = budgetYear()) {
  const plan = state.budgets?.[year] || {};
  const actual = spendingByYear().get(year) || new Map();
  const categories = [...new Set([...Object.keys(plan), ...actual.keys()])].sort((a, b) => (Number(plan[b] || 0) - Number(plan[a] || 0)) || a.localeCompare(b));
  return categories.map((cat) => {
    const budget = Number(plan[cat] || 0);
    const spent = roundUsd(actual.get(cat) || 0);
    return { category: cat, budget, spent, pct: budget > 0 ? Math.round((spent / budget) * 100) : null };
  });
}

function openBudgetDialog(year = budgetYear()) {
  const rows = budgetRows(year);
  const extra = textInput("", { placeholder: tr("Add a category") });
  const inputs = rows.map((r) => ({ category: r.category, input: numberInput(r.budget || "", { step: "1" }) }));
  const save = () => {
    const plan = {};
    inputs.forEach(({ category, input }) => { const v = Number(input.value || 0); if (v > 0) plan[category] = roundUsd(v); });
    const added = extra.value.trim();
    if (added && !plan[added]) plan[added] = 0;
    state.budgets = { ...(state.budgets || {}), [year]: plan };
    if (!saveState()) return;
    closeToolDialog();
    renderAll();
    if (added) openBudgetDialog(year);
    else showToast("Budget saved");
  };
  openToolDialog(tr("Budget for {year}", { year }),
    note(tr("What you expect to spend this year in each category. Leave empty for no budget.")),
    mk("div", { className: "history-list compact" }, inputs.map(({ category, input }) => mk("label", { className: "budget-row" }, mk("span", { text: category }), input))),
    field(tr("Another category"), extra),
    mk("div", { className: "button-row" }, primaryButton(tr("Save"), save), secondaryButton(tr("Cancel"), closeToolDialog)));
}

function buildBudgetSection() {
  const year = budgetYear();
  const rows = budgetRows(year).filter((r) => r.budget > 0 || r.spent > 0);
  const hasBudget = rows.some((r) => r.budget > 0);
  const table = rows.length ? mk("div", { className: "report-table-wrap" }, mk("table", { className: "report-table" },
    mk("thead", {}, mk("tr", {}, mk("th", { text: tr("Category") }), mk("th", { className: "num", text: tr("Budget") }), mk("th", { className: "num", text: tr("Spent") }), mk("th", { className: "num", text: "%" }))),
    mk("tbody", {}, rows.map((r) => mk("tr", {},
      mk("td", { text: r.category }),
      mk("td", { className: "num", text: r.budget ? formatUsd(r.budget) : "—" }),
      mk("td", { className: "num", text: formatUsd(r.spent) }),
      mk("td", { className: `num${r.pct !== null && r.pct > 100 ? " over-budget" : ""}`, text: r.pct === null ? "—" : `${r.pct}%` })))))) : null;
  return mk("div", {},
    note(hasBudget ? tr("{year} so far against your budget. Categories over budget are in red.", { year }) : tr("Set what you expect to spend this year per category, and see how the year is going.")),
    table,
    mk("div", { className: "button-row" }, secondaryButton(hasBudget ? tr("Edit budget") : tr("Set a budget"), () => openBudgetDialog(year))));
}

function overBudgetCategories() {
  return budgetRows().filter((r) => r.budget > 0 && r.spent > r.budget);
}

// ── Reserve target ──────────────────────────────────────────────────────────
function reserveStatus() {
  const target = Number(state.settings.reserveTargetUsd || 0);
  if (!(target > 0)) return null;
  const cash = roundUsd(getAccountTotals().usd);
  return { target, cash, below: cash < target };
}

function buildReserveSection() {
  const input = numberInput(state.settings.reserveTargetUsd || "", { step: "1", placeholder: "0" });
  const status = reserveStatus();
  return mk("div", {},
    note(tr("The least the building should keep in cash for emergencies. The dashboard warns you when cash drops below it.")),
    field(tr("Reserve target (USD)"), input),
    status ? note(status.below
      ? tr("Cash is {cash}, below the target of {target}.", { cash: formatUsd(status.cash), target: formatUsd(status.target) })
      : tr("Cash is {cash}, above the target of {target} ✓", { cash: formatUsd(status.cash), target: formatUsd(status.target) }), status.below ? "is-warning" : "") : null,
    mk("div", { className: "button-row" }, secondaryButton(tr("Save"), () => {
      state.settings.reserveTargetUsd = Math.max(0, Number(input.value || 0));
      if (!saveState()) return;
      renderAll();
      showToast("Reserve target saved");
    })));
}

// ── Meeting minutes ─────────────────────────────────────────────────────────
function openMeetingDialog(meetingId = null) {
  if (sessionMode !== "owner") return;
  const meeting = meetingId ? (state.meetings || []).find((m) => m.id === meetingId) : null;
  const date = mk("input", { type: "date", value: meeting?.date || localDateInput() });
  const title = textInput(meeting?.title || "", { placeholder: tr("Annual owners' meeting"), maxlength: "120" });
  const attendees = mk("textarea", { rows: "2", placeholder: tr("Who attended (units or names)"), maxlength: "600" });
  attendees.value = meeting?.attendees || "";
  const notesBox = mk("textarea", { rows: "4", placeholder: tr("What was discussed"), maxlength: "4000" });
  notesBox.value = meeting?.notes || "";
  const decisions = mk("textarea", { rows: "4", placeholder: tr("One decision per line"), maxlength: "3000" });
  decisions.value = (meeting?.decisions || []).join("\n");
  const pollTicks = (state.polls || []).map((p) => ({ poll: p, box: checkboxRow(p.title, (meeting?.pollIds || []).includes(p.id)) }));
  const save = () => {
    if (!title.value.trim()) { showToast("Give the meeting a title"); return; }
    const fields = {
      date: date.value || localDateInput(), title: title.value.trim(), attendees: attendees.value.trim(), notes: notesBox.value.trim(),
      decisions: decisions.value.split("\n").map((l) => l.trim()).filter(Boolean), pollIds: pollTicks.filter((p) => p.box.input.checked).map((p) => p.poll.id),
      updatedAt: new Date().toISOString(),
    };
    if (meeting) Object.assign(meeting, fields);
    else (state.meetings ||= []).push({ id: newId("mtg"), ...fields });
    if (!saveState()) return;
    closeToolDialog();
    renderAll();
    showToast("Minutes saved");
  };
  const remove = () => {
    if (!window.confirm(tr("Delete these minutes?"))) return;
    state.meetings = (state.meetings || []).filter((m) => m.id !== meeting.id);
    recordDeletedId("meetings", meeting.id);
    if (!saveState()) return;
    closeToolDialog();
    renderAll();
  };
  openToolDialog(meeting ? tr("Edit minutes") : tr("New meeting"),
    field(tr("Date"), date),
    field(tr("Title"), title),
    field(tr("Attendees"), attendees),
    field(tr("Discussion"), notesBox),
    field(tr("Decisions"), decisions),
    pollTicks.length ? mk("div", {}, mk("span", { className: "field-label", text: tr("Polls decided at this meeting") }), pollTicks.map((p) => p.box.row)) : null,
    mk("div", { className: "button-row" }, primaryButton(tr("Save"), save),
      meeting ? mk("button", { type: "button", className: "danger-button", text: tr("Delete"), onclick: remove }) : secondaryButton(tr("Cancel"), closeToolDialog)));
}

function buildMeetingPdf(meeting) {
  const C = { green: "#163832", soft: "#cfe3db", white: "#ffffff", ink: "#14211f", muted: "#61706b" };
  const left = 40;
  const right = 555;
  const pages = [];
  let cmds;
  let y;
  const text = (value, x, ty, size, bold, color, bg) => cmds.push(pdfTextCommand(value, x, ty, size, bold, { color, bg }));
  const newPage = (first) => {
    if (cmds) pages.push(`${cmds.join("\n")}\n`);
    cmds = ["0.4 w"];
    if (first) {
      cmds.push(pdfFillRect(0, 742, 595, 100, C.green));
      text(state.building?.name || "", left, 806, 12, true, C.soft, C.green);
      text("Meeting minutes", left, 776, 24, true, C.white, C.green);
      text(`${formatDateLabel(meeting.date)} · ${pdfClip(meeting.title, 60)}`, left, 756, 11, false, C.soft, C.green);
      y = 710;
    } else {
      text(tr("{title} (continued)", { title: meeting.title }), left, 806, 11, true, C.ink);
      y = 780;
    }
  };
  const ensure = (needed) => { if (y - needed < 70) newPage(false); };
  const section = (title) => {
    ensure(40);
    text(title, left, y, 13, true, C.ink);
    cmds.push(`q ${pdfColor(C.soft)} RG 0.8 w ${left} ${y - 7} m ${right} ${y - 7} l S Q`);
    y -= 26;
  };
  // Splits long text into lines of about `width` characters.
  const wrap = (value, width = 95) => String(value || "").split("\n").flatMap((para) => {
    const words = para.split(/\s+/).filter(Boolean);
    const lines = [];
    let line = "";
    words.forEach((w) => { if ((line + " " + w).trim().length > width) { lines.push(line); line = w; } else line = `${line} ${w}`.trim(); });
    if (line) lines.push(line);
    return lines.length ? lines : [""];
  });
  const paragraph = (value) => wrap(value).forEach((l) => { ensure(16); text(l, left, y, 10, false, C.ink); y -= 15; });

  newPage(true);
  if (meeting.attendees) { section("Attendees"); paragraph(meeting.attendees); y -= 8; }
  if (meeting.notes) { section("Discussion"); paragraph(meeting.notes); y -= 8; }
  if ((meeting.decisions || []).length) {
    section("Decisions");
    meeting.decisions.forEach((d, i) => wrap(d, 90).forEach((l, j) => { ensure(16); text(`${j === 0 ? `${i + 1}.` : "  "} ${l}`, left, y, 10, j === 0, C.ink); y -= 15; }));
    y -= 8;
  }
  const polls = (state.polls || []).filter((p) => (meeting.pollIds || []).includes(p.id));
  if (polls.length) {
    section("Votes");
    polls.forEach((p) => {
      ensure(32);
      text(pdfClip(p.title, 90), left, y, 10, true, C.ink);
      y -= 15;
      const t = pollTally(p);
      text(tr("YES {yes} · NO {no} · ABSTAIN {abstain}", { yes: t.yes, no: t.no, abstain: t.abstain }) + (t.mode === "share" ? ` (${tr("by ownership share")})` : ""), left, y, 9.5, false, C.muted);
      y -= 20;
    });
  }
  text(tr("{building} · {date}", { building: state.building?.name || "", date: formatDateLabel(meeting.date) }), left, 34, 8, false, C.muted);
  pages.push(`${cmds.join("\n")}\n`);
  return buildMultiPagePdf(pages);
}

async function shareMeetingPdf(meetingId) {
  const meeting = (state.meetings || []).find((m) => m.id === meetingId);
  if (!meeting) return;
  const pdf = buildMeetingPdf(meeting);
  const fileName = `Minutes_${safeFilePart(meeting.title, "meeting")}_${meeting.date}.pdf`;
  try {
    if (typeof navigator.share === "function" && typeof File === "function") {
      const file = new File([pdf], fileName, { type: PDF_MIME });
      if (typeof navigator.canShare !== "function" || navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: meeting.title, text: meeting.title });
        return;
      }
    }
  } catch (error) {
    if (error?.name === "AbortError") return;
  }
  downloadBlob(pdf, PDF_MIME, fileName);
}

function renderMeetings() {
  if (!els.meetingList) return;
  if (els.newMeetingButton) els.newMeetingButton.classList.toggle("hidden", sessionMode !== "owner");
  const meetings = (state.meetings || []).slice().sort((a, b) => String(b.date).localeCompare(String(a.date)));
  if (!meetings.length) {
    els.meetingList.replaceChildren(mk("div", { className: "empty-state", text: sessionMode === "owner" ? tr("No meetings yet. Write down what was decided at each owners' meeting and share the minutes as a PDF.") : tr("No meeting minutes yet.") }));
    return;
  }
  els.meetingList.replaceChildren(...meetings.map((m) => mk("article", { className: "notice-card" },
    mk("div", { className: "notice-head" }, mk("strong", { text: m.title }), mk("span", { text: formatDateLabel(m.date) })),
    (m.decisions || []).length ? mk("ol", { className: "decision-list" }, m.decisions.map((d) => mk("li", { text: d }))) : null,
    mk("div", { className: "notice-actions" },
      miniButton(tr("Share PDF"), () => { void shareMeetingPdf(m.id); }),
      sessionMode === "owner" ? miniButton(tr("Edit"), () => openMeetingDialog(m.id)) : null))));
}

// ── Close the year ──────────────────────────────────────────────────────────
function yearFullyClosed(year) {
  for (let m = 1; m <= 12; m += 1) if (!isMonthClosed(`${year}-${String(m).padStart(2, "0")}`)) return false;
  return true;
}

function closeYear(year) {
  if (!window.confirm(tr("Close {year}? Every month of {year} is locked. Nothing is erased: balances carry into the new year as they are, and you can still reopen a month in Reports.", { year }))) return;
  state.monthLocks ||= [];
  const stamp = { closed: true, at: new Date().toISOString(), by: auditActor() };
  for (let m = 1; m <= 12; m += 1) {
    const id = `${year}-${String(m).padStart(2, "0")}`;
    const lock = state.monthLocks.find((l) => l.id === id);
    if (lock) Object.assign(lock, stamp);
    else state.monthLocks.push({ id, ...stamp });
  }
  if (!saveState()) return;
  renderAll();
  openToolDialog(tr("{year} is closed", { year }),
    note(tr("Keep a copy of the year: the annual report for the owners' meeting and a full backup with photos.")),
    mk("div", { className: "hide-choices" },
      primaryButton(tr("Annual report (Excel)"), () => downloadAnnualWorkbook(year)),
      secondaryButton(tr("Annual report (PDF)"), () => { closeToolDialog(); printAnnualReport(year); }),
      secondaryButton(tr("Backup with photos"), () => { closeToolDialog(); void downloadBackupWithPhotos(); }),
      mk("button", { type: "button", className: "mini-button", text: tr("Done"), onclick: closeToolDialog })));
}

function buildCloseYearSection() {
  const thisYear = new Date().getFullYear();
  const years = reportYears().filter((y) => Number(y) <= thisYear && !yearFullyClosed(y));
  if (!years.length) return note(tr("Every year so far is closed."));
  const pick = selectInput(years.map((y) => [y, y]), years.find((y) => Number(y) < thisYear) || years[0]);
  return mk("div", {},
    note(tr("At the end of the year, lock all its months and keep a copy. Nothing is erased; balances simply carry on into the new year.")),
    field(tr("Year"), pick),
    mk("div", { className: "button-row" }, secondaryButton(tr("Close the year"), () => closeYear(pick.value))));
}

function v158AttentionItems() {
  const items = [];
  documentsExpiring().forEach((d) => {
    const expired = d.expiresOn < localDateInput();
    items.push({ kind: expired ? "danger" : "warn", text: expired ? tr("{name} expired on {date}", { name: d.title, date: formatDateLabel(d.expiresOn) }) : tr("{name} expires on {date}", { name: d.title, date: formatDateLabel(d.expiresOn) }), view: "documentsView", key: `doc:${d.id}:${d.expiresOn}` });
  });
  const reserve = reserveStatus();
  if (reserve?.below) items.push({ kind: "warn", text: tr("Cash ({cash}) is below the reserve target of {target}", { cash: formatUsd(reserve.cash), target: formatUsd(reserve.target) }), view: "reportsView", key: "reserve" });
  const over = overBudgetCategories();
  if (over.length) items.push({ kind: "warn", text: tr(over.length === 1 ? "{n} category is over budget ({names})" : "{n} categories are over budget ({names})", { n: over.length, names: over.map((r) => r.category).join(", ") }), view: "reportsView", key: `budget:${budgetYear()}:${over.map((r) => r.category).join("|")}` });
  return items;
}

// ═══════════════════════════════════════════════════════════════════════════
// v159 — personal generator bill as a picture, reading an invoice photo
// ═══════════════════════════════════════════════════════════════════════════

// ── Personal generator bill (picture for one tenant) ────────────────────────
function generatorBillData(tenantId, month) {
  const dist = computeServiceDistribution("generator", month);
  const line = dist.lines?.[tenantId];
  if (!dist.distributed || !line) return null;
  const totalAmps = Object.values(dist.lines).reduce((s, l) => s + Number(l.breakerAmps || 0), 0);
  return {
    month,
    previous: line.previousReading,
    current: line.currentReading,
    kwh: line.kwh,
    breakerAmps: line.breakerAmps,
    fuelUsd: line.consumptionUsd,
    maintenanceUsd: line.maintenanceUsd,
    totalUsd: line.totalUsd,
    buildingKwh: dist.totalKwh,
    buildingFuelUsd: dist.pools.fuelUsd,
    buildingMaintenanceUsd: dist.pools.maintenanceUsd,
    pricePerKwh: dist.totalKwh > 0 ? dist.pools.fuelUsd / dist.totalKwh : 0,
    totalAmps,
  };
}

function drawGeneratorBillCanvas(tenant, month) {
  const d = generatorBillData(tenant.id, month);
  if (!d) return null;
  const rtl = currentLang === "ar";
  const C = { green: "#163832", soft: "#cfe3db", white: "#ffffff", ink: "#14211f", muted: "#61706b", tint: "#eef4ef", line: "#e4e9e4", accent: "#1f6b5a" };
  const FONT = `Inter, "Segoe UI", Roboto, Tahoma, "Noto Sans Arabic", Arial, sans-serif`;
  const W = 1080;
  const PAD = 64;
  const H = 1180;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  ctx.direction = rtl ? "rtl" : "ltr";
  const X = (x) => (rtl ? W - x : x);
  const box = (x, y, w, h, color, radius = 0) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    const left = rtl ? W - x - w : x;
    if (radius && typeof ctx.roundRect === "function") ctx.roundRect(left, y, w, h, radius);
    else ctx.rect(left, y, w, h);
    ctx.fill();
  };
  const text = (value, x, y, { size = 30, weight = 400, color = C.ink, align = "start" } = {}) => {
    ctx.font = `${weight} ${size}px ${FONT}`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.fillText(String(value ?? ""), X(x), y);
  };
  const monthLabel = rtl
    ? new Date(`${monthKey(month)}-01T00:00:00`).toLocaleDateString("ar-LB-u-nu-latn", { month: "long", year: "numeric" })
    : formatMonth(month);

  box(0, 0, W, H, C.white);
  box(0, 0, W, 250, C.green);
  text(state.building?.name || "", PAD, 82, { size: 34, weight: 700, color: C.soft });
  text(tr("Generator bill"), PAD, 160, { size: 64, weight: 800, color: C.white });
  text(`${tenant.name} · ${tr("Unit {unit}", { unit: tenant.unit || "" })} · ${monthLabel}`, PAD, 212, { size: 30, color: C.soft });

  // Big total
  box(PAD, 300, W - PAD * 2, 170, C.tint, 26);
  text(tr("To pay for the generator"), PAD + 36, 360, { size: 30, color: C.muted });
  text(formatUsd(d.totalUsd), PAD + 36, 436, { size: 72, weight: 800, color: C.accent });

  // Meter
  let y = 540;
  const row = (label, value, opts = {}) => {
    text(label, PAD, y, { size: 32, color: C.muted });
    text(value, W - PAD, y, { size: 34, weight: 700, color: C.ink, align: "end", ...opts });
    y += 64;
  };
  text(tr("Your meter"), PAD, y, { size: 38, weight: 800 });
  y += 60;
  row(tr("Previous reading"), numberFormat.format(d.previous));
  row(tr("Current reading"), numberFormat.format(d.current));
  row(tr("Electricity used"), tr("{kwh} kWh", { kwh: numberFormat.format(d.kwh) }));
  box(PAD, y - 34, W - PAD * 2, 2, C.line);
  y += 30;
  text(tr("How it is calculated"), PAD, y, { size: 38, weight: 800 });
  y += 60;
  row(tr("Fuel: {kwh} kWh × ${price}", { kwh: numberFormat.format(d.kwh), price: d.pricePerKwh.toFixed(3) }), formatUsd(d.fuelUsd));
  row(tr("Maintenance: {amps}A of {total}A", { amps: d.breakerAmps, total: d.totalAmps }), formatUsd(d.maintenanceUsd));
  box(PAD, y - 34, W - PAD * 2, 4, C.green);
  y += 24;
  row(tr("Total"), formatUsd(d.totalUsd), { color: C.accent, size: 40 });

  text(tr("Building total this month: {kwh} kWh, fuel {fuel}, maintenance {maint}.", { kwh: numberFormat.format(d.buildingKwh), fuel: formatUsd(d.buildingFuelUsd), maint: formatUsd(d.buildingMaintenanceUsd) }), PAD, H - 90, { size: 24, color: C.muted });
  text(tr("Fuel is shared by the electricity each unit used; maintenance by breaker size."), PAD, H - 52, { size: 24, color: C.muted });
  return canvas;
}

async function shareGeneratorBill(tenantId, month) {
  const tenant = state.tenants.find((t) => t.id === tenantId);
  if (!tenant) return;
  const canvas = drawGeneratorBillCanvas(tenant, month);
  if (!canvas) { showToast("Enter this month's meter readings first"); return; }
  const dataUrl = canvas.toDataURL("image/png");
  const fileName = `Generator_${safeFilePart(tenant.unit || tenant.name, "unit")}_${monthKey(month)}.png`;
  const file = new File([base64ToBytes(dataUrl.split(",")[1] || "")], fileName, { type: "image/png" });
  const caption = tr("{name} — generator bill, {month}: {amount}", { name: tenant.name, month: formatMonth(month), amount: formatUsd(generatorBillData(tenantId, month).totalUsd) });
  try {
    if (typeof navigator.share === "function" && (typeof navigator.canShare !== "function" || navigator.canShare({ files: [file] }))) {
      await navigator.share({ files: [file], title: caption, text: caption });
      return;
    }
  } catch (error) {
    if (error?.name === "AbortError") return;
  }
  downloadBlob(file, "image/png", fileName);
  if (tenant.phone) window.open(whatsappLink(tenant.phone, caption), "_blank", "noopener");
}

// ── Read an invoice photo ───────────────────────────────────────────────────
let invoiceReadingAvailable = false;

async function checkInvoiceReading() {
  try {
    const res = await fetch("/api/read-invoice", { cache: "no-store" });
    invoiceReadingAvailable = res.ok && Boolean((await res.json()).configured);
  } catch {
    invoiceReadingAvailable = false;
  }
  updateReadInvoiceButton();
}

function updateReadInvoiceButton() {
  if (!els.readInvoiceButton) return;
  const show = invoiceReadingAvailable && isOwnerSession() && Boolean(selectedInvoiceFile())
    && (els.transactionCategory.value === "Expenses" || els.transactionCategory.value === "Services Expenses");
  els.readInvoiceButton.classList.toggle("hidden", !show);
}

async function readInvoiceIntoForm() {
  const file = selectedInvoiceFile();
  if (!file) return;
  const button = els.readInvoiceButton;
  button.disabled = true;
  button.textContent = tr("Reading the photo…");
  try {
    const prepared = await prepareInvoiceUpload({ id: "read", invoice: "read", description: "invoice", date: localDateInput() }, file);
    await ensureFreshSession();
    const res = await fetch("/api/read-invoice", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${authBearer()}` },
      body: JSON.stringify({ image: prepared.dataBase64 }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error || tr("Invoice reading failed ({status})", { status: res.status }));
    if (body.amount > 0) {
      setTransactionCurrency(body.currency === "LBP" ? "LBP" : "USD");
      els.transactionAmount.value = String(body.amount);
    }
    if (body.date) els.transactionDate.value = body.date;
    if (body.supplier && !els.transactionSupplier.value.trim()) els.transactionSupplier.value = body.supplier;
    if (body.invoiceNumber) els.transactionInvoice.value = body.invoiceNumber;
    if (body.description && !els.transactionDescription.value.trim()) els.transactionDescription.value = body.description;
    updateExpenseConversionPreview();
    showToast(body.amount > 0 ? "Filled in from the photo — please check the numbers" : "Couldn't find the amount on the photo", 5000);
  } catch (error) {
    showToast(error instanceof TypeError ? "Can't reach the server. Check your connection." : error.message, 6000);
  } finally {
    button.disabled = false;
    button.textContent = tr("Fill in from the photo");
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// v160 — Help & videos: short explainer videos for owners and tenants
// ═══════════════════════════════════════════════════════════════════════════

// Recorded against a made-up demo building (no real data). Files live in
// videos/<en|ar>/<id>.mp4 with a poster <id>.jpg; the service worker never
// caches them, so they only download when someone presses play.
const HELP_VIDEOS = [
  { id: "tour", role: "owner", title: "A quick tour", sub: "Where everything is in the app", seconds: { en: 64, ar: 59 } },
  { id: "payment", role: "owner", title: "Record a payment", sub: "With its receipt, in a few taps", seconds: { en: 62, ar: 60 } },
  { id: "expense", role: "owner", title: "Record an expense", sub: "With a photo of the invoice", seconds: { en: 67, ar: 60 } },
  { id: "group", role: "owner", title: "Share balances with the group", sub: "One picture for the building's WhatsApp group", seconds: { en: 40, ar: 36 } },
  { id: "generator", role: "owner", title: "Generator readings and bills", sub: "Split fairly by what each flat used", seconds: { en: 47, ar: 43 } },
  { id: "invite", role: "owner", title: "Invite your tenants", sub: "Each tenant gets the app on their phone", seconds: { en: 45, ar: 43 } },
  { id: "reports", role: "owner", title: "Reports and closing the month", sub: "Monthly report, cash count, health check", seconds: { en: 59, ar: 55 } },
  { id: "maintenance", role: "owner", title: "Maintenance calendar", sub: "Never miss an inspection or a cleaning", seconds: { en: 53, ar: 50 } },
  { id: "residents", role: "owner", title: "Notices, votes and problems", sub: "Keep the residents in the loop", seconds: { en: 46, ar: 44 } },
  { id: "join", role: "tenant", title: "Join with your invite code", sub: "For tenants, the first time", seconds: { en: 41, ar: 39 } },
  { id: "tenant-home", role: "tenant", title: "Your balance and payments", sub: "See what you owe and tell the owner you paid", seconds: { en: 40, ar: 36 } },
  { id: "tenant-more", role: "tenant", title: "Votes, problems and notifications", sub: "Take part in the building", seconds: { en: 51, ar: 48 } },
];
const HELP_WATCHED_KEY = "building-account-tracker:videos-watched";

function helpVideosFor(role) {
  return role === "owner" ? HELP_VIDEOS.slice() : HELP_VIDEOS.filter((v) => v.role === "tenant");
}

function helpVideoUrl(id, ext = "mp4") {
  return `videos/${currentLang === "ar" ? "ar" : "en"}/${id}.${ext}`;
}

function formatVideoLength(seconds) {
  const s = Math.max(0, Math.round(Number(seconds) || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function watchedVideos() {
  try { return new Set(JSON.parse(localStorage.getItem(HELP_WATCHED_KEY) || "[]")); } catch { return new Set(); }
}

function markVideoWatched(id) {
  const seen = watchedVideos();
  if (seen.has(id)) return;
  seen.add(id);
  try { localStorage.setItem(HELP_WATCHED_KEY, JSON.stringify([...seen])); } catch { /* private mode */ }
}

function helpVideoCard(video) {
  const poster = mk("img", { className: "help-video-poster", alt: "", loading: "lazy", decoding: "async" });
  poster.src = helpVideoUrl(video.id, "jpg");
  const thumb = mk("span", { className: "help-video-thumb" }, poster, mk("span", { className: "help-video-play" }, lucide("play", { size: 20, color: "#fff", stroke: 2.4 })));
  const seconds = video.seconds?.[currentLang === "ar" ? "ar" : "en"];
  const length = seconds ? mk("span", { className: "help-video-length", text: formatVideoLength(seconds) }) : null;
  const card = mk("button", { className: "help-video-card", type: "button" },
    thumb,
    mk("span", { className: "help-video-text" },
      mk("strong", { text: tr(video.title) }),
      mk("span", { text: tr(video.sub) }),
      length));
  if (watchedVideos().has(video.id)) card.classList.add("watched");
  card.addEventListener("click", () => openHelpVideo(video.id));
  return card;
}

function renderHelp() {
  const list = document.querySelector("#helpVideoList");
  if (!list) return;
  const owner = sessionMode === "owner";
  const videos = helpVideosFor(owner ? "owner" : "tenant");
  const group = (title, items) => mk("div", { className: "help-video-group" },
    title ? mk("h3", { className: "help-video-heading", text: title }) : null,
    ...items.map(helpVideoCard));
  list.replaceChildren(owner
    ? mk("div", {},
      group(tr("For you"), videos.filter((v) => v.role === "owner")),
      group(tr("What your tenants see"), videos.filter((v) => v.role === "tenant")))
    : group("", videos));
}

function openHelpVideo(id) {
  const video = HELP_VIDEOS.find((v) => v.id === id);
  const dialog = document.querySelector("#videoDialog");
  const player = document.querySelector("#helpVideo");
  if (!video || !dialog || !player) return;
  document.querySelector("#videoDialogTitle").textContent = tr(video.title);
  player.poster = helpVideoUrl(id, "jpg");
  player.src = helpVideoUrl(id);
  openDialog(dialog);
  player.play().catch(() => { /* the person can press play themselves */ });
  markVideoWatched(id);
}

function closeHelpVideo() {
  const dialog = document.querySelector("#videoDialog");
  const player = document.querySelector("#helpVideo");
  if (player) {
    player.pause();
    // Drop the source so the phone stops downloading the rest of the video.
    player.removeAttribute("src");
    player.load();
  }
  if (dialog?.open) closeDialog(dialog);
  renderHelp();
  renderDashboard();
}

// Owner: a hideable "watch the tour" reminder until the tour has been opened.
function v160AttentionItems() {
  if (watchedVideos().has("tour")) return [];
  return [{ kind: "info", text: tr("New here? Watch the 1-minute tour"), view: "helpView", action: "helpVideo", arg: "tour", key: "helpTour" }];
}

// Tenant: a small card on their home screen until they watch or dismiss it.
function tenantHelpCard() {
  if (sessionMode === "owner" || watchedVideos().has("tenant-home")) return null;
  const dismiss = mk("button", { className: "icon-button small", type: "button", text: "×", "aria-label": tr("Hide") });
  dismiss.addEventListener("click", () => { markVideoWatched("tenant-home"); renderDashboard(); });
  return mk("article", { className: "notice-card help-nudge" },
    mk("div", { className: "help-nudge-text" },
      mk("strong", { text: tr("New to the app?") }),
      mk("span", { text: tr("A 1-minute video shows how it works.") })),
    primaryButton(tr("Watch"), () => openHelpVideo("tenant-home")),
    dismiss);
}

// Guard against one bad cloud write cascading into data loss on every device.
// The auto-sync path adopts the cloud copy whenever this device has nothing
// unsynced — which is correct, EXCEPT when the cloud copy has lost everything.
// Then adopting it silently deletes real data (and the now-empty device pushes
// that emptiness back, so the loss spreads). Refuse it and let the owner decide.
function remoteWouldWipeLocalData(remote) {
  const size = (s) => (s?.tenants?.length || 0) + (s?.transactions?.length || 0);
  return size(state) > 0 && size(remote) === 0;
}

async function syncFromSheet({ silent = false } = {}) {
  if (!hasCloudConfig()) return;
  if (document.querySelector("dialog[open]")) return;
  if (cloudSaveInFlight) return;
  // A phone with no identity that is not in owner mode (fresh phone, login
  // screen, PIN tenant): fetch nothing, so an unlinked phone never downloads
  // the building.
  if (usesOwnerAccounts() && !authSession && sessionMode !== "owner") return;
  if (isTenantSession()) {
    // A tenant phone never has local edits: just take the server's copy.
    try {
      const remote = await cloudLoadState();
      if (!remote) return;
      state = hydrateState(remote);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      if (sessionMode === "tenant") renderAll();
      setSyncChip("saved");
    } catch (error) {
      reportSyncProblem(error);
    }
    return;
  }
  if (!silent) renderCloudStatus(`Syncing from the ${cloudProviderLabel()}…`);
  try {
    const remote = await cloudLoadState();
    if (!remote) return;
    const sync = loadSyncMeta();
    const remoteToken = remote.meta?.token || "";
    const dirty = localHasUnsyncedChanges();

    if (remoteToken && remoteToken === sync.lastSyncedToken) {
      // Cloud unchanged since this device last synced. When clean, this is the
      // round trip that earns "Saved" (boot shows "Saving…" until one happens).
      if (dirty) queueCloudSave();
      else setSyncChip("saved");
      return;
    }
    if (dirty) {
      // Foreign changes AND unsynced local changes: merge, then push the result.
      state = hydrateState(mergeStates(state, remote));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      populateTenantSelect();
      renderAll();
      queueCloudSave();
    } else if (remoteWouldWipeLocalData(remote)) {
      // Cloud lost everything; this device still has data. Keep local, say so
      // loudly, and push nothing automatically either way.
      renderCloudStatus(
        tr("The cloud copy is empty but this device has data. Nothing was replaced. Tap the sync chip to upload this device's data."),
      );
      reportSyncProblem(Object.assign(new Error("The cloud copy is empty but this device has data. Nothing was replaced. Tap the sync chip to upload this device's data."), { code: "empty-cloud" }));
      if (!silent) showToast("Cloud copy is empty — kept this device's data");
      return;
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
    refreshBalanceSnapshot();
  } catch (error) {
    reportSyncProblem(error);
    if (!silent) renderCloudStatus(lastSyncProblem);
  }
}

async function boot() {
  // Apply the last-used language immediately so the login screen renders correctly.
  applyLanguage(localStorage.getItem(LANG_KEY) || "en");
  const response = await fetch("data/seed.json", { cache: "no-store" });
  seedState = hydrateState(await response.json());
  const stored = localStorage.getItem(STORAGE_KEY);
  state = stored ? hydrateState(JSON.parse(stored)) : hydrateState(seedState);
  if (ensureAllReceiptReferences()) saveState({ sync: false });
  applyLanguage(state.settings.language);

  attachEvents();
  populateTenantSelect();
  renderAll();
  // Do NOT claim "Saved" here: nothing has been synced yet at boot. Showing
  // in-progress means the chip can only say "Saved" after a real round trip.
  setSyncChip(hasCloudConfig() ? "saving" : "local");
  showLoginScreen();

  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});

  // Returning from Google? Finish signing in before the first sync, so that
  // sync already runs as the owner.
  captureAdminInvite();
  if (usesOwnerAccounts()) await completeGoogleSignIn();

  await syncFromSheet();

  setInterval(() => { if (sessionMode) syncFromSheet({ silent: true }); }, 60000);
}

boot().catch((error) => {
  document.body.innerHTML = `<main class="app-shell"><section class="panel"><h1>BUILDING ACCOUNT TRACKER ${APP_VERSION}</h1><p>${error.message}</p></section></main>`;
});

// Test hook for the node tests in tests/ (browsers ignore module exports).
// Pure calculation functions plus a way to load a state; nothing here touches
// the network.
export const __test = {
  setState(raw) { state = hydrateState(raw); currentLang = normalizeLang(state.settings.language); },
  setSessionMode(mode) { sessionMode = mode; },
  saveState,
  diffStates,
  recordMonths,
  isMonthClosed,
  generatorEfficiencyRows,
  generatorEfficiencyWarning,
  spendingByYear,
  annualReportData,
  buildAnnualWorkbookFiles,
  pollTally,
  pollSummaryLines,
  tenantOccupiesMonth,
  occupantsOn,
  getExpectedForTenant,
  getPreviousMeterReading,
  expectedCashOn,
  extraAttentionItems,
  getState() { return state; },
  getTenantBalance,
  formatUsd,
  getTenantExpenseShare,
  getTenantServicesDue,
  getTenantPaymentsTotal,
  getTenantOpeningNet,
  getTenantFixedDueTotal,
  computeServiceDistribution,
  allocateByWeight,
  mergeStates,
  remoteWouldWipeLocalData,
  describeSyncProblem,
  coefficientRoom,
  whatsappPhone,
  whatsappLink,
  buildGroupBalancesMessage,
  groupBalancesData,
  txUsd,
  backupPhotoList,
  maintenanceStatus,
  maintenanceDue,
  addMonthsToDate,
  photoBackupDue,
  v155AttentionItems,
  attentionKey,
  transactionAccount,
  budgetRows,
  generatorBillData,
  drawGeneratorBillCanvas,
  reserveStatus,
  documentsExpiring,
  supplierExpenses,
  buildMeetingPdf,
  yearFullyClosed,
  v158AttentionItems,
  v160AttentionItems,
  helpVideosFor,
  formatVideoLength,
  helpVideoUrl,
  HELP_VIDEOS,
  HELP_WATCHED_KEY,
  expectedByAccount,
  methodLabel,
  isAttentionHidden,
  stampLbpRates,
  dataHealthIssues,
  findDuplicatePayment,
  monthlyReportData,
  buildMonthlyReportPdf,
  buildBalanceSnapshot,
  drawGroupBalancesCanvas,
  pendingRecurringExpenses,
  addRecurringTemplateFrom,
  collectFullExportData,
  buildFullWorkbookXlsx,
  buildFullWorkbookFiles,
  getAccountTotals,
  getPositionTotals,
  toUsd,
};
