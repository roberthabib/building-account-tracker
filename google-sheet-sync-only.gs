/**
 * Lower-permission Google Sheets sync backend.
 *
 * Install this from the Google Sheet:
 * Extensions > Apps Script, paste this file, then deploy as a Web App.
 *
 * This version intentionally does not use DriveApp, so invoice photo upload is
 * disabled. It writes only to the spreadsheet that owns this script.
 */

/**
 * @OnlyCurrentDoc
 */

function doGet() {
  return jsonResponse({
    success: true,
    status: "Building account sheet sync is running",
  });
}

function doPost(event) {
  try {
    const payload = JSON.parse((event.postData && event.postData.contents) || "{}");

    // Optional shared secret: set a Script Property named SYNC_SECRET to require
    // every request to include a matching "token". Leave it unset for the current
    // (open) behaviour — this stays backward compatible until you turn it on.
    const secret = PropertiesService.getScriptProperties().getProperty("SYNC_SECRET");
    if (secret && payload.token !== secret) throw new Error("Unauthorized");

    if (payload.action === "saveState") return saveState(payload);
    if (payload.action === "loadState") return loadState();
    if (payload.action === "uploadInvoice") throw new Error("Invoice photo upload is not enabled in the Sheet-only script");

    throw new Error("Unsupported action");
  } catch (error) {
    return jsonResponse({
      success: false,
      error: error.message,
    });
  }
}

function saveState(payload) {
  if (!payload.state) throw new Error("Missing app state");

  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const state = payload.state;
  state.monthlyExpected = normalizedMonthlyExpected(state.monthlyExpected);
  writeAppState(spreadsheet, state);
  writeLedger(spreadsheet, state);
  writeTenants(spreadsheet, state);
  writeMonthlyExpected(spreadsheet, state);
  writeSettings(spreadsheet, state);
  writePolls(spreadsheet, state);
  SpreadsheetApp.flush();

  return jsonResponse({
    success: true,
    updatedAt: new Date().toISOString(),
  });
}

function loadState() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName("App State");
  if (!sheet) throw new Error("No saved app state found");

  const values = sheet.getDataRange().getValues();
  const chunks = [];
  values.forEach(function (row) {
    const key = String(row[0] || "");
    if (key.indexOf("State ") === 0) chunks.push(String(row[1] || ""));
  });
  if (!chunks.length) throw new Error("No saved app state found");

  return jsonResponse({
    success: true,
    state: JSON.parse(chunks.join("")),
  });
}

function writeAppState(spreadsheet, state) {
  const sheet = resetSheet(spreadsheet, "App State");
  const json = JSON.stringify(state);
  const chunkSize = 45000;
  const rows = [
    ["Key", "Value"],
    ["Updated At", new Date().toISOString()],
    ["Building", state.building && state.building.name ? state.building.name : ""],
    ["Version", state.building && state.building.version ? state.building.version : ""],
  ];

  for (let index = 0; index < json.length; index += chunkSize) {
    rows.push(["State " + String(rows.length - 3).padStart(4, "0"), json.slice(index, index + chunkSize)]);
  }

  sheet.getRange(1, 1, rows.length, 2).setValues(rows);
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, 2);
}

function writeLedger(spreadsheet, state) {
  const sheet = resetSheet(spreadsheet, "Ledger");
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
  ];
  const rows = (state.transactions || []).map(function (transaction) {
    return [
      transaction.date || "",
      transaction.category || "",
      tenantName(state, transaction.tenantId),
      transaction.description || "",
      transaction.forMonth || "",
      transaction.supplier || "",
      transaction.invoice || "",
      transaction.project || "",
      Number(transaction.debitUsd || 0),
      Number(transaction.debitLbp || 0),
      Number(transaction.creditUsd || 0),
      Number(transaction.creditLbp || 0),
      transactionNetUsd(state, transaction),
      transaction.receiptRef || "",
      transaction.invoiceAttachment && transaction.invoiceAttachment.driveUrl ? transaction.invoiceAttachment.driveUrl : "",
    ];
  });
  writeTable(sheet, headers, rows);
  if (rows.length) {
    sheet.getRange(2, 9, rows.length, 1).setNumberFormat("$#,##0.00;[Red]-$#,##0.00");
    sheet.getRange(2, 10, rows.length, 1).setNumberFormat("#,##0");
    sheet.getRange(2, 11, rows.length, 1).setNumberFormat("$#,##0.00;[Red]-$#,##0.00");
    sheet.getRange(2, 12, rows.length, 1).setNumberFormat("#,##0");
    sheet.getRange(2, 13, rows.length, 1).setNumberFormat("$#,##0.00;[Red]-$#,##0.00");
  }
}

function writeTenants(spreadsheet, state) {
  const sheet = resetSheet(spreadsheet, "Tenants");
  const headers = ["ID", "Name", "Unit"];
  const rows = (state.tenants || []).map(function (tenant) {
    return [tenant.id || "", tenant.name || "", tenant.unit || ""];
  });
  writeTable(sheet, headers, rows);
}

function writeMonthlyExpected(spreadsheet, state) {
  const sheet = resetSheet(spreadsheet, "Monthly Expected");
  const headers = ["Month", "Expected USD"];
  const rows = normalizedMonthlyExpected(state.monthlyExpected).map(function (entry) {
    return [entry.month, entry.expectedUsd];
  });
  writeTable(sheet, headers, rows);
  if (rows.length) sheet.getRange(2, 2, rows.length, 1).setNumberFormat("$#,##0.00");
}

function normalizedMonthlyExpected(entries) {
  return (entries || [])
    .map(function (entry) {
      return {
        month: entry.month || "",
        expectedUsd: Number(entry.expectedUsd || 0),
      };
    })
    .filter(function (entry) {
      return entry.month && entry.expectedUsd > 0;
    });
}

function writePolls(spreadsheet, state) {
  var sheet = resetSheet(spreadsheet, "Polls");
  var headers = ["Title", "Description", "Created By", "Status", "Created At", "YES", "ABSTAIN", "NO", "Pending", "Vote Details"];
  var polls = state.polls || [];
  var tenants = state.tenants || [];

  function voterName(id) {
    if (id === "owner") return "Owner";
    for (var i = 0; i < tenants.length; i++) {
      if (tenants[i].id === id) return tenants[i].name || id;
    }
    return id;
  }

  var allVoterIds = ["owner"].concat(tenants.filter(function (t) { return t.active !== false; }).map(function (t) { return t.id; }));

  var rows = polls.map(function (poll) {
    var votes = poll.votes || {};
    var yesCount = 0;
    var abstainCount = 0;
    var noCount = 0;
    allVoterIds.forEach(function (id) {
      if (votes[id] === "yes") yesCount++;
      else if (votes[id] === "abstain") abstainCount++;
      else if (votes[id] === "no") noCount++;
    });
    var pending = allVoterIds.length - yesCount - abstainCount - noCount;
    var details = allVoterIds.map(function (id) {
      var v = votes[id];
      return voterName(id) + ": " + (v ? v.toUpperCase() : "—");
    }).join(" · ");
    return [
      poll.title || "",
      poll.description || "",
      voterName(poll.createdBy || ""),
      poll.status || "open",
      poll.createdAt ? poll.createdAt.slice(0, 10) : "",
      yesCount,
      abstainCount,
      noCount,
      pending,
      details,
    ];
  });
  writeTable(sheet, headers, rows);
}

function writeSettings(spreadsheet, state) {
  const sheet = resetSheet(spreadsheet, "Settings");
  const settings = state.settings || {};
  const rows = [
    ["Setting", "Value"],
    ["Building Name", state.building && state.building.name ? state.building.name : ""],
    ["Default Monthly Amount USD", Number(settings.defaultDueUsd || 0)],
    ["LBP per USD", Number(settings.lbpPerUsd || 0)],
  ];
  sheet.getRange(1, 1, rows.length, 2).setValues(rows);
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, 2);
}

function writeTable(sheet, headers, rows) {
  const output = [headers].concat(rows);
  sheet.getRange(1, 1, output.length, headers.length).setValues(output);
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#163832").setFontColor("#ffffff");
  if (output.length > 1) {
    try {
      const existing = sheet.getFilter();
      if (existing) existing.remove();
      sheet.getRange(1, 1, output.length, headers.length).createFilter();
    } catch (filterError) {
      // A filter is purely cosmetic — never let it fail the save.
    }
  }
  sheet.autoResizeColumns(1, headers.length);
}

function resetSheet(spreadsheet, name) {
  const sheet = spreadsheet.getSheetByName(name) || spreadsheet.insertSheet(name);
  const filter = sheet.getFilter();
  if (filter) filter.remove();
  sheet.clear();
  return sheet;
}

function transactionNetUsd(state, transaction) {
  const settings = state.settings || {};
  const rate = Number(settings.lbpPerUsd || 89500) || 89500;
  const netUsd = Number(transaction.creditUsd || 0) - Number(transaction.debitUsd || 0);
  const netLbp = Number(transaction.creditLbp || 0) - Number(transaction.debitLbp || 0);
  return netUsd + netLbp / rate;
}

function tenantName(state, tenantId) {
  const tenants = state.tenants || [];
  for (let index = 0; index < tenants.length; index += 1) {
    if (tenants[index].id === tenantId) return tenants[index].name || "";
  }
  return "";
}

function jsonResponse(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}
