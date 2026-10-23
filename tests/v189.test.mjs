// v189: a flat can't have two leases at the same time.
import { test } from "node:test";
import assert from "node:assert/strict";
import { app } from "./harness.mjs";

const leases = [
  { id: "l1", flatId: "a", start: "2026-10-23", end: "", status: "active", tenant: { name: "Maguy" } },
  { id: "l2", flatId: "b", start: "2026-01-01", end: "2026-12-31", status: "active", tenant: { name: "Hala" } },
  { id: "l3", flatId: "c", start: "2025-01-01", end: "2026-12-31", status: "ended", endedOn: "2026-06-30", tenant: { name: "Jad" } },
];

test("a second lease on a rented flat is refused", () => {
  assert.equal(app.leaseClash(leases, { flatId: "a", start: "2026-10-23", end: "" })?.id, "l1");
  assert.equal(app.leaseClash(leases, { flatId: "a", start: "2027-05-01", end: "" })?.id, "l1");
});

test("after a fixed end, or once ended, the flat can be rented again", () => {
  assert.equal(app.leaseClash(leases, { flatId: "b", start: "2027-01-01", end: "" }), null);
  assert.equal(app.leaseClash(leases, { flatId: "b", start: "2026-12-01", end: "" })?.id, "l2");
  assert.equal(app.leaseClash(leases, { flatId: "c", start: "2026-07-01", end: "" }), null);
  assert.equal(app.leaseClash(leases, { flatId: "c", start: "2026-06-01", end: "" })?.id, "l3");
});

test("editing a lease doesn't clash with itself; other flats are free", () => {
  assert.equal(app.leaseClash(leases, { id: "l1", flatId: "a", start: "2026-10-01", end: "" }), null);
  assert.equal(app.leaseClash(leases, { flatId: "d", start: "2026-10-23", end: "" }), null);
});
