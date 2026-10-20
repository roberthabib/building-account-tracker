// v155: maintenance calendar dates and status, backup reminder, attention rows.
import { test } from "node:test";
import assert from "node:assert/strict";
import { app, baseState } from "./harness.mjs";

const pay = { id: "p1", category: "Payments", tenantId: "a", date: "2026-09-10", forMonth: "2026-09-01", creditUsd: 10, creditLbp: 0, debitUsd: 0, debitLbp: 0, balanceUsd: 10, balanceLbp: 0 };

test("maintenance: next due moves by whole months and keeps the day where it can", () => {
  assert.equal(app.addMonthsToDate("2026-01-31", 1), "2026-02-28", "end of month clamps");
  assert.equal(app.addMonthsToDate("2026-10-20", 6), "2027-04-20");
  assert.equal(app.addMonthsToDate("2026-10-20", 12), "2027-10-20");
});

test("maintenance: overdue, due within two weeks, or scheduled", () => {
  const today = "2026-10-20";
  assert.equal(app.maintenanceStatus({ nextDue: "2026-10-01" }, today), "overdue");
  assert.equal(app.maintenanceStatus({ nextDue: "2026-11-02" }, today), "soon");
  assert.equal(app.maintenanceStatus({ nextDue: "2026-12-01" }, today), "ok");
  assert.equal(app.maintenanceStatus({}, today), "none");
});

test("maintenance and backup reminders appear in Needs Attention for the owner", () => {
  app.setState(baseState({
    transactions: [pay],
    maintenanceTasks: [{ id: "m1", title: "Lift inspection", everyMonths: 12, nextDue: "2020-01-01", history: [] }, { id: "m2", title: "Pest control", everyMonths: 3, nextDue: "2999-01-01", history: [] }],
  }));
  app.setSessionMode("owner");
  const texts = app.v155AttentionItems().map((i) => i.text);
  assert.ok(texts.some((t) => t.startsWith("Lift inspection is overdue")), "only the overdue job, by name");
  assert.ok(!texts.some((t) => t.includes("Pest control")));
  app.setSessionMode(null);
});

test("backup reminder: only after a month without a backup with photos", () => {
  app.setSessionMode("owner");
  app.setState(baseState({ transactions: [pay], settings: { lastPhotoBackupAt: new Date().toISOString().slice(0, 10) } }));
  // Without Supabase configured (tests) there are no cloud photos to back up.
  assert.equal(app.photoBackupDue(), null);
  app.setSessionMode(null);
});

test("deleted maintenance jobs stay deleted when devices merge", () => {
  const local = baseState({ meta: { rev: 2, epoch: 0, updatedAt: "2026-10-02T00:00:00Z" }, maintenanceTasks: [{ id: "m1", title: "Lift", updatedAt: "2026-10-01T00:00:00Z" }] });
  const remote = baseState({ meta: { rev: 3, epoch: 0, updatedAt: "2026-10-03T00:00:00Z" }, maintenanceTasks: [], deleted: { transactions: [], tenants: [], polls: [], projects: [], maintenanceTasks: ["m1"] } });
  assert.equal(app.mergeStates(local, remote).maintenanceTasks.length, 0);
});
