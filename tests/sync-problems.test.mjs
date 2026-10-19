// The sync chip must say WHY it failed, in words that tell the owner what to do.
import { test } from "node:test";
import assert from "node:assert/strict";
import { app } from "./harness.mjs";

function withOnline(online, fn) {
  const before = navigator.onLine;
  navigator.onLine = online;
  try { fn(); } finally { navigator.onLine = before; }
}
const http = (status) => Object.assign(new Error(`HTTP ${status}`), { status });

test("offline wins over everything else", () => {
  withOnline(false, () => assert.match(app.describeSyncProblem(http(500)), /offline/));
});

test("unreachable host reads as a possibly paused database", () => {
  withOnline(true, () => assert.match(app.describeSyncProblem(new TypeError("Failed to fetch")), /paused/));
});

test("401/403 tells a signed-out owner to sign in with Google", () => {
  withOnline(true, () => {
    assert.match(app.describeSyncProblem(http(401)), /sign in with Google/);
    assert.match(app.describeSyncProblem(http(403)), /sign in with Google/);
  });
});

test("server errors say to retry", () => {
  withOnline(true, () => assert.match(app.describeSyncProblem(http(503)), /try again/));
});

test("empty-cloud guard message passes through unchanged", () => {
  const e = Object.assign(new Error("The cloud copy is empty but this device has data."), { code: "empty-cloud" });
  withOnline(true, () => assert.equal(app.describeSyncProblem(e), e.message));
});
