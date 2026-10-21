// v173: more than one building — the chosen building decides the request
// header, the building row and where photos are stored.
import { test } from "node:test";
import assert from "node:assert/strict";
import { app } from "./harness.mjs";

const KEY = "building-account-tracker:building";

test("a phone that never chose a building behaves as before", () => {
  localStorage.removeItem(KEY);
  assert.equal(app.currentBuildingId(), "building");
  assert.deepEqual(app.buildingHeader(), {});
  assert.equal(app.buildingPath("proofs/t1/x.jpg"), "proofs/t1/x.jpg");
});

test("the first building keeps its photo folders", () => {
  localStorage.setItem(KEY, "building");
  assert.deepEqual(app.buildingHeader(), { "x-building": "building" });
  assert.equal(app.buildingPath("2026/abc-invoice.jpg"), "2026/abc-invoice.jpg");
  localStorage.removeItem(KEY);
});

test("another building: header and photos under b/<id>/", () => {
  localStorage.setItem(KEY, "b1a2b3c4d5e6");
  assert.equal(app.currentBuildingId(), "b1a2b3c4d5e6");
  assert.deepEqual(app.buildingHeader(), { "x-building": "b1a2b3c4d5e6" });
  assert.equal(app.buildingPath("concierge/2026/x.jpg"), "b/b1a2b3c4d5e6/concierge/2026/x.jpg");
  localStorage.removeItem(KEY);
});
