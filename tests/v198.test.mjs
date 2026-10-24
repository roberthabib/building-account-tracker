// v198: a lease whose only open payment is the one due at signing says so.
import { test } from "node:test";
import assert from "node:assert/strict";
import { app } from "./harness.mjs";

const lease = (extra = {}) => ({ id: "f", flatId: "a", start: "2026-10-24", rent: 1000, currency: "USD", period: "monthly", graceDays: 5, advanceMonths: 3, payments: [], status: "active", ...extra });

test("signing on 24 October with 3 months in advance: the rest of October + 3 months", () => {
  const text = app.signingDueText(lease(), app.leaseStatus(lease(), "2026-10-24"));
  assert.match(text, /^Due at signing: \$3,258\.06 \(24–31 Oct 2026 \+ 3 months in advance\)$/);
});

test("part paid at signing, one month in advance, a lease starting on the 1st", () => {
  const part = lease({ advanceMonths: 1, payments: [{ id: "p", date: "2026-10-24", amount: 500, method: "cash" }] });
  assert.match(app.signingDueText(part, app.leaseStatus(part, "2026-10-24")), /^Left to pay from signing: \$758\.06 \(24–31 Oct 2026 \+ 1 month in advance\)$/);
  const first = lease({ start: "2026-11-01", advanceMonths: 0 });
  assert.match(app.signingDueText(first, app.leaseStatus(first, "2026-11-01")), /^Due at signing: \$1,000\.00 \(Nov 2026\)$/);
});

test("late, paid up or after the signing months: no signing line", () => {
  assert.equal(app.signingDueText(lease(), app.leaseStatus(lease(), "2026-11-10")), "");
  const paid = lease({ payments: [{ id: "p", date: "2026-10-24", amount: 3258.06, method: "cash" }] });
  assert.equal(app.signingDueText(paid, app.leaseStatus(paid, "2026-10-24")), "");
  assert.equal(app.signingDueText(paid, app.leaseStatus(paid, "2027-02-02")), "");
});
