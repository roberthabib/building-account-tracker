import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(__dirname, "..");
const workbookPath = path.join(appDir, "Naccache 1727 rev3.xlsx");
const outputPath = path.join(appDir, "data", "seed.json");

function excelDate(serial) {
  if (typeof serial !== "number") return null;
  return new Date(Math.round((serial - 25569) * 86400 * 1000)).toISOString().slice(0, 10);
}

function slug(value) {
  return String(value)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const input = await FileBlob.load(workbookPath);
const workbook = await SpreadsheetFile.importXlsx(input);

const monthlySheet = workbook.worksheets.getItem("Monthly Payments");
const tenantNames = monthlySheet.getRange("B4:K4").values[0].filter(Boolean);
const tenants = tenantNames.map((name, index) => ({
  id: slug(name) || `tenant-${index + 1}`,
  name,
  unit: String(index + 1).padStart(2, "0"),
  active: true,
}));

const ledgerSheet = workbook.worksheets.getItem("Detailed Table");
const ledgerRows = ledgerSheet
  .getRange("A1:O238")
  .values.slice(2, -1)
  .filter((row) => row.some((value) => value !== null));

const transactions = ledgerRows.map((row, index) => {
  const debitUsd = Number(row[7] || 0);
  const debitLbp = Number(row[8] || 0);
  const creditUsd = Number(row[9] || 0);
  const creditLbp = Number(row[10] || 0);

  return {
    id: `tx-${String(index + 1).padStart(4, "0")}`,
    category: row[0] || "",
    description: row[1] || "",
    tenantId: tenantNames.includes(row[1]) ? slug(row[1]) : null,
    forMonth: excelDate(row[2]),
    project: row[3] || "",
    date: excelDate(row[4]),
    supplier: row[5] || "",
    invoice: row[6] || "",
    debitUsd,
    debitLbp,
    creditUsd,
    creditLbp,
    balanceUsd: creditUsd - debitUsd,
    balanceLbp: creditLbp - debitLbp,
    sourceRow: index + 3,
  };
});

let receiptSequence = 1;
transactions.forEach((transaction) => {
  if (transaction.category === "Payments" && transaction.tenantId && transaction.forMonth) {
    const date = String(transaction.date || transaction.forMonth).replace(/-/g, "");
    transaction.receiptRef = `RCT-${date}-${String(receiptSequence).padStart(4, "0")}`;
    receiptSequence += 1;
  }
});

const monthlyExpected = monthlySheet
  .getRange("A5:K24")
  .values.map((row) => {
    return {
      month: excelDate(row[0]),
      expectedUsd: 0,
    };
  })
  .filter((entry) => entry.month && Number(entry.expectedUsd || 0) > 0);

const projects = [...new Set(transactions.map((transaction) => transaction.project).filter(Boolean))].map(
  (name, index) => ({
    id: slug(name) || `project-${index + 1}`,
    name,
    active: true,
  }),
);

const suppliers = [...new Set(transactions.map((transaction) => transaction.supplier).filter(Boolean))].map(
  (name, index) => ({
    id: slug(name) || `supplier-${index + 1}`,
    name,
  }),
);

const seed = {
  building: {
    name: "Naccache 1727",
    version: "v43",
    sourceWorkbook: "Naccache 1727 rev3.xlsx",
    importedAt: new Date().toISOString(),
  },
  tenants,
  projects,
  suppliers,
  settings: {
    defaultDueUsd: 0,
    lbpPerUsd: 89500,
    invoiceUploadUrl:
      "https://script.google.com/macros/s/AKfycbzXlrSIWH5FUM5bU5iGpyB0KGXuXeThGloAaiYvAdxwSe88H96kZMtB2kCm4HvpYwAA/exec",
    cloudSpreadsheetId: "1LYnpt1p5JkuGNbzLM0uOZBtmXmBiQtqc3SG9qMqhehU",
    invoiceUploadFolderId: "1QOdJLYZV4dlnW8xP2ZnjEpYY8vjmQxnn",
  },
  categories: ["Opening Balance", "Payments", "Expenses"],
  monthlyExpected,
  transactions,
};

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, JSON.stringify(seed, null, 2));

console.log(
  JSON.stringify(
    {
      outputPath,
      tenants: tenants.length,
      transactions: transactions.length,
      monthlyExpected: monthlyExpected.length,
      projects: projects.length,
      suppliers: suppliers.length,
    },
    null,
    2,
  ),
);
