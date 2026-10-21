// v166: concierge, directory merge, choice polls, equipment, diesel, water, notices, calendar.
import { test } from "node:test";
import assert from "node:assert/strict";
import { app, baseState } from "./harness.mjs";

const tenants = [
  { id: "a", name: "A", unit: "1A", active: true, coefficient: 600 },
  { id: "b", name: "B", unit: "1B", active: true, coefficient: 400 },
];
const meta = (t) => ({ rev: 5, epoch: 0, token: "x", updatedAt: t });

test("choice polls count each option, weighted by share", () => {
  app.setState(baseState({ tenants, polls: [{ id: "p", title: "Quote", status: "open", weighting: "share", votes: { a: "q1", b: "q2" }, options: [{ id: "q1", label: "One" }, { id: "q2", label: "Two" }] }] }));
  const t = app.optionTally({ id: "p", weighting: "share", votes: { a: "q1", b: "q2" }, options: [{ id: "q1", label: "One" }, { id: "q2", label: "Two" }] });
  assert.deepEqual(t.rows.map((r) => r.value), [600, 400]);
  assert.equal(t.total, 1000);
});

test("a closed choice poll reports the winner", () => {
  app.setState(baseState({ tenants }));
  const line = app.pollResultLine({ id: "p", status: "closed", weighting: "share", votes: { a: "q1", b: "q2" }, options: [{ id: "q1", label: "Cheap Co" }, { id: "q2", label: "Dear Co" }] });
  assert.equal(line, "Chosen: Cheap Co");
});

test("server-side notice views and pushes survive a merge", () => {
  const cloud = app.hydrateState(baseState({ tenants, meta: meta("2026-10-21T10:00:00Z"), announcements: [{ id: "n", title: "T", seenBy: ["a"], pushedAt: "2026-10-21T09:00:00Z" }] }));
  const phone = app.hydrateState(baseState({ tenants, meta: meta("2026-10-21T11:00:00Z"), announcements: [{ id: "n", title: "T edited" }] }));
  const merged = app.mergeStates(phone, cloud);
  const n = merged.announcements.find((x) => x.id === "n");
  assert.equal(n.title, "T edited");
  assert.deepEqual(n.seenBy, ["a"]);
  assert.equal(n.pushedAt, "2026-10-21T09:00:00Z");
});

test("a tenant's directory choice made through the server is kept", () => {
  const cloud = app.hydrateState(baseState({ meta: meta("2026-10-21T10:00:00Z"), tenants: [{ ...tenants[0], directory: true, directoryAt: "2026-10-21T10:00:00Z" }, tenants[1]] }));
  const phone = app.hydrateState(baseState({ meta: meta("2026-10-21T12:00:00Z"), tenants: [{ ...tenants[0], phone: "70 1" }, tenants[1]] }));
  const merged = app.mergeStates(phone, cloud);
  const a = merged.tenants.find((t) => t.id === "a");
  assert.equal(a.directory, true);
  assert.equal(a.phone, "70 1");
});

test("meter readings entered on another phone win when newer", () => {
  const line = (cur) => ({ a: { previousReading: 100, currentReading: cur, breakerAmps: 10 } });
  const cloud = app.hydrateState(baseState({ tenants, meta: meta("2026-10-21T10:00:00Z"), serviceReadings: [{ id: "r", serviceType: "generator", forMonth: "2026-10-01", lines: line(180), updatedAt: "2026-10-21T10:00:00Z" }] }));
  const phone = app.hydrateState(baseState({ tenants, meta: meta("2026-10-21T12:00:00Z"), serviceReadings: [{ id: "r", serviceType: "generator", forMonth: "2026-10-01", lines: line(150), updatedAt: "2026-10-20T10:00:00Z" }] }));
  const merged = app.mergeStates(phone, cloud);
  assert.equal(merged.serviceReadings[0].lines.a.currentReading, 180);
});

test("equipment warranty status", () => {
  assert.equal(app.equipmentWarrantyStatus({ warrantyUntil: "2026-10-01" }, "2026-10-21"), "expired");
  assert.equal(app.equipmentWarrantyStatus({ warrantyUntil: "2026-11-30" }, "2026-10-21"), "soon");
  assert.equal(app.equipmentWarrantyStatus({ warrantyUntil: "2027-06-01" }, "2026-10-21"), "ok");
  assert.equal(app.equipmentWarrantyStatus({}, "2026-10-21"), null);
});

test("diesel estimate from the last measurement, purchases and recent use", () => {
  const fuel = (id, date, litres) => ({ id, category: "Services Expenses", serviceType: "generator", servicePart: "fuel", date, litres, debitUsd: 100, debitLbp: 0, creditUsd: 0, creditLbp: 0, balanceUsd: -100, balanceLbp: 0 });
  app.setState(baseState({
    tenants,
    settings: { lbpPerUsd: 100000, language: "en", dieselReorderLitres: 300 },
    dieselChecks: [{ id: "d", date: "2026-10-01", litres: 500 }],
    transactions: [fuel("f1", "2026-08-01", 450), fuel("f2", "2026-09-01", 450), fuel("f3", "2026-10-10", 200)],
  }));
  const d = app.dieselEstimate("2026-10-21");
  // 1,100 litres bought in the 90 days before → about 12.2 a day; 500 + 200 − 20 days × 12.2
  assert.equal(d.litres, 456);
  assert.equal(d.daysLeft, 37);
  assert.equal(d.low, false);
});

test("water deliveries: interval and price per 1,000 litres", () => {
  const water = (id, date, usd, litres) => ({ id, category: "Services Expenses", serviceType: "water", date, litres, debitUsd: usd, debitLbp: 0, creditUsd: 0, creditLbp: 0, balanceUsd: -usd, balanceLbp: 0 });
  app.setState(baseState({ tenants, transactions: [water("w1", "2026-09-01", 30, 10000), water("w2", "2026-09-11", 30, 10000), water("w3", "2026-09-21", 30, 10000)] }));
  const w = app.waterDeliveries();
  assert.equal(w.avgGap, 10);
  assert.equal(w.per1000, 3);
});

test("scheduled notices", () => {
  assert.equal(app.noticeIsScheduled({ publishAt: "2099-01-01T00:00:00Z" }), true);
  assert.equal(app.noticeIsScheduled({ publishAt: "2020-01-01T00:00:00Z" }), false);
  assert.equal(app.noticeIsScheduled({}), false);
});

test("calendar file lists maintenance, warranties and votes", () => {
  app.setState(baseState({ tenants,
    maintenanceTasks: [{ id: "m", title: "Lift check", nextDue: "2026-11-05" }],
    equipment: [{ id: "e", name: "Pump", warrantyUntil: "2027-01-01" }],
    polls: [{ id: "p", title: "Paint", status: "open", closesOn: "2026-11-15", votes: {} }] }));
  const ics = app.buildCalendarIcs("2026-10-21");
  assert.match(ics, /BEGIN:VCALENDAR/);
  assert.match(ics, /DTSTART;VALUE=DATE:20261105/);
  assert.match(ics, /Pump/);
  assert.match(ics, /Paint/);
  assert.equal((ics.match(/BEGIN:VEVENT/g) || []).length, 3);
});

test("concierge sessions are not owner sessions", () => {
  assert.equal(app.isConciergeSession(), false);
});
