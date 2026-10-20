// Made-up building for the explainer videos. No real people or data.
const AR = require("./demo-ar.cjs");
module.exports = function demoState(lang = "en") {
  const L = (text) => (lang === "ar" && AR[text]) || text;
  const tenants = [
    ["t1", L("Rami S."), "1A", 180, 15, "70 100 101"],
    ["t2", L("Lina M."), "1B", 170, 15, "70 100 102"],
    ["t3", L("Omar T."), "2A", 170, 20, "70 100 103"],
    ["t4", L("Maya R."), "2B", 160, 10, "70 100 104"],
    ["t5", L("Sami K."), "3A", 160, 15, "70 100 105"],
    ["t6", L("Nour B."), "3B", 160, 10, ""],
  ].map(([id, name, unit, coefficient, breakerAmps, phone]) => ({ id, name, unit, active: true, coefficient, breakerAmps, phone, pinHash: "" }));
  const share = (total) => Object.fromEntries(tenants.map((t) => [t.id, Math.round(total * t.coefficient / 10) / 100]));
  const expense = (id, date, usd, description, category, supplier, extra = {}) => ({
    id, category: "Expenses", description, tenantId: null, forMonth: null, project: "", date, supplier, invoice: "", expenseCategory: category,
    serviceType: "", servicePart: "", debitUsd: usd, debitLbp: 0, creditUsd: 0, creditLbp: 0, balanceUsd: -usd, balanceLbp: 0,
    invoiceAttachment: null, sourceRow: null, shares: share(usd), paidFrom: "cash", ...extra,
  });
  const gen = (id, date, part, usd, litres) => ({
    id, category: "Services Expenses", description: lang === "ar" ? (part === "fuel" ? "مازوت المولّد" : "صيانة المولّد") : `Generator ${part}`, tenantId: null, forMonth: "2026-09-01", project: "", date, supplier: L("Power Co."),
    invoice: "", expenseCategory: part === "fuel" ? "Generator Fuel" : "Generator Maintenance", serviceType: "generator", servicePart: part,
    debitUsd: usd, debitLbp: 0, creditUsd: 0, creditLbp: 0, balanceUsd: -usd, balanceLbp: 0, invoiceAttachment: null, sourceRow: null, ...(litres ? { litres } : {}),
  });
  const pay = (id, tenantId, date, usd, method, ref) => ({
    id, category: "Payments", description: tenants.find((t) => t.id === tenantId).name, tenantId, forMonth: "2026-09-01", project: "", date,
    supplier: "", invoice: "", expenseCategory: "", serviceType: "", servicePart: "", debitUsd: 0, debitLbp: 0, creditUsd: usd, creditLbp: 0,
    balanceUsd: usd, balanceLbp: 0, invoiceAttachment: null, sourceRow: null, receiptRef: ref, paymentGroupId: `grp-${id}`, method,
  });
  const lines = {};
  [[1200, 1520], [800, 1010], [1500, 1880], [600, 760], [900, 1180], [400, 520]].forEach(([prev, cur], i) => {
    lines[tenants[i].id] = { breakerAmps: tenants[i].breakerAmps, previousReading: prev, currentReading: cur };
  });
  return {
    meta: { rev: 10, epoch: 0, token: "demo-10", updatedAt: "2026-10-18T09:00:00.000Z" },
    building: { name: L("Cedar Residence") },
    settings: { collectionMode: "actual", lbpPerUsd: 89500, defaultDueUsd: 0, language: lang, ownerPasswordHash: "", remindersSentMonth: "", monthlyBalanceNotices: true, lastPhotoBackupAt: "2026-10-15", reserveTargetUsd: 0 },
    security: { salt: "demo" },
    setupComplete: true,
    tenants,
    transactions: [
      { id: "ob1", category: "Opening Balance", description: lang === "ar" ? "رصيد الصندوق" : "Cash in the building box", tenantId: null, forMonth: null, project: "", date: "2026-08-31", supplier: "", invoice: "", expenseCategory: "", serviceType: "", servicePart: "", debitUsd: 0, debitLbp: 0, creditUsd: 3000, creditLbp: 0, balanceUsd: 3000, balanceLbp: 0, invoiceAttachment: null, sourceRow: null, paidFrom: "cash" },
      expense("e1", "2026-09-02", 240, L("Building cleaning"), L("Cleaning"), L("Clean Team")),
      expense("e2", "2026-09-05", 300, L("Concierge salary"), L("Salaries"), ""),
      expense("e3", "2026-09-12", 85, L("Lift maintenance visit"), L("Lift"), L("Lift Services")),
      expense("e4", "2026-09-20", 60, L("Lobby light bulbs"), L("Repairs"), L("Electro Shop")),
      gen("g1", "2026-09-06", "fuel", 420, 400),
      gen("g2", "2026-09-18", "maintenance", 60),
      expense("e5", "2026-10-02", 240, L("Building cleaning"), L("Cleaning"), L("Clean Team")),
      expense("e6", "2026-10-05", 300, L("Concierge salary"), L("Salaries"), ""),
      pay("p1", "t1", "2026-10-03", 240, "cash", "RCT-20261003-0001"),
      pay("p2", "t2", "2026-10-04", 180, "bank", "RCT-20261004-0001"),
      pay("p3", "t3", "2026-10-06", 260, "whish", "RCT-20261006-0001"),
      pay("p4", "t5", "2026-10-09", 150, "omt", "RCT-20261009-0001"),
    ],
    serviceReadings: [{ id: "rdg-sep", serviceType: "generator", forMonth: "2026-09-01", lines, engineHours: 1240 }],
    monthlyExpected: [],
    buildingProjects: [],
    projects: [],
    suppliers: [
      { id: "sup-1", name: L("Clean Team"), trade: L("Cleaning"), phone: "70 200 201", notes: "" },
      { id: "sup-2", name: L("Lift Services"), trade: L("Lift maintenance"), phone: "70 200 202", notes: L("Contract renews in March") },
      { id: "sup-3", name: L("Power Co."), trade: L("Generator"), phone: "70 200 203", notes: "" },
    ],
    expenseCategories: [],
    recurringExpenses: [],
    polls: [{ id: "po1", title: L("Paint the stairwell this winter?"), description: L("Estimate: $1,800 shared by coefficient."), status: "open", createdBy: "owner", createdAt: "2026-10-10T08:00:00Z", weighting: "share", closesOn: "2026-11-10", quorumPct: 50, votes: { t1: "yes", t3: "yes", t4: "no" } }],
    paymentDeclarations: [{ id: "decl-1", tenantId: "t4", month: "2026-09-01", amount: 120, status: "pending", declaredAt: "2026-10-17T10:00:00Z" }],
    announcements: [{ id: "ntc-1", title: L("Water tank cleaning on Thursday"), body: L("Water will be cut from 9:00 to 13:00. Please fill some bottles the night before."), until: "2026-10-30", createdAt: "2026-10-16T08:00:00Z" }],
    issues: [{ id: "iss-1", tenantId: "t2", title: L("Leak under the kitchen sink"), details: L("Dripping since yesterday."), status: "open", createdAt: "2026-10-18T07:00:00Z", updatedAt: "2026-10-18T07:00:00Z" }],
    maintenanceTasks: [
      { id: "m1", title: L("Lift inspection"), everyMonths: 12, nextDue: "2026-10-28", notes: L("Lift Services, contract 2041"), history: [], updatedAt: "2026-01-01T00:00:00Z" },
      { id: "m2", title: L("Water tank cleaning"), everyMonths: 6, nextDue: "2027-03-15", notes: "", history: [{ date: "2026-09-15", costUsd: 90, note: "" }], lastDone: "2026-09-15", updatedAt: "2026-09-15T00:00:00Z" },
    ],
    generatorServices: [{ id: "gsv-1", date: "2026-08-01", hours: 1100, work: L("Oil and filter change"), costUsd: 70, nextHours: 1350, nextDate: "2026-11-01" }],
    cashChecks: [], monthLocks: [], auditLog: [], documents: [], meetings: [], budgets: {},
    deleted: { transactions: [], tenants: [], polls: [], projects: [] },
  };
};
