// v174: trusted technicians — fees, ratings and the statement text.
import { test } from "node:test";
import assert from "node:assert/strict";
import { app } from "./harness.mjs";

const samir = { id: "t1", name: "Samir", trade: "plumber", feeKind: "percent", feeValue: 10 };
const elie = { id: "t2", name: "Elie", trade: "plumber", feeKind: "fixed", feeValue: 5 };

test("fee: a percentage of the job or a fixed amount", () => {
  assert.equal(app.jobFee(samir, 120), 12);
  assert.equal(app.jobFee(samir, "45"), 4.5);
  assert.equal(app.jobFee(elie, 300), 5);
  assert.equal(app.jobFee(null, 100), 0);
});

test("stats: rating average, done jobs and fees not settled", () => {
  const jobs = [
    { technicianId: "t1", status: "done", feeUsd: 12, paidOn: "", rating: { onTime: 5, price: 4, quality: 5 } },
    { technicianId: "t1", status: "done", feeUsd: 4.5, paidOn: "", rating: { onTime: 4, price: 5, quality: 4 } },
    { technicianId: "t1", status: "done", feeUsd: 20, paidOn: "2026-10-01", rating: null },
    { technicianId: "t1", status: "sent", feeUsd: 0 },
    { technicianId: "t2", status: "done", feeUsd: 5, paidOn: "" },
  ];
  const s = app.technicianStats("t1", jobs);
  assert.equal(s.jobs, 3);
  assert.equal(s.rating, 4.5);
  assert.equal(s.unpaidUsd, 16.5);
  assert.equal(s.unpaid.length, 2);
  assert.equal(app.technicianStats("t2", jobs).rating, null);
});

test("trade names", () => {
  assert.equal(app.tradeLabel("electrician"), "Electrician");
  assert.equal(app.tradeLabel("nonsense"), "Technician");
});
