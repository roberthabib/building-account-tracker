// Loads the real src/app.js in Node with a stand-in browser, so the money
// logic can be tested without a browser. The stand-in DOM accepts any property
// read, write or call; network access is blocked outright.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// A do-anything object: every property is another stub, every call returns a
// stub, iteration yields nothing, and it converts to "" / 0.
function stub() {
  const target = function () {};
  return new Proxy(target, {
    get(_, key) {
      if (key === Symbol.toPrimitive) return () => "";
      if (key === Symbol.iterator) return function* () {};
      if (key === "then") return undefined; // never look like a promise
      if (key === "length") return 0;
      if (key === "dataset" || key === "style") return {};
      return stub();
    },
    set: () => true,
    apply: () => stub(),
    construct: () => stub(),
  });
}

const store = new Map();
globalThis.__BAT_TEST__ = true;
globalThis.document = stub();
globalThis.window = globalThis;
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  key: () => null,
  get length() { return store.size; },
};
globalThis.sessionStorage = globalThis.localStorage;
Object.defineProperty(globalThis, "navigator", { value: { onLine: false, serviceWorker: undefined }, configurable: true });
globalThis.location = { search: "", hash: "", pathname: "/", origin: "http://test", protocol: "http:", assign() {}, reload() {} };
globalThis.history = { replaceState() {} };
globalThis.matchMedia = () => ({ matches: false, addEventListener() {} });
globalThis.setInterval = () => 0; // boot() schedules a periodic sync; don't keep node alive
globalThis.setTimeout = () => 0;
globalThis.clearTimeout = () => {};
globalThis.alert = () => {};
globalThis.confirm = () => false;

const seed = fs.readFileSync(path.join(root, "data", "seed.json"), "utf8");
globalThis.fetch = async (url) => {
  if (String(url).includes("seed.json")) {
    return { ok: true, status: 200, json: async () => JSON.parse(seed), text: async () => seed };
  }
  throw new Error(`network blocked in tests: ${url}`);
};

const mod = await import(pathToFileURL(path.join(root, "src", "app.js")).href);
export const app = mod.__test;

// Minimal valid state; scenarios override what they need.
export function baseState(overrides = {}) {
  return {
    building: { name: "Test" },
    settings: { collectionMode: "actual", lbpPerUsd: 100000, defaultDueUsd: 0, language: "en" },
    security: { salt: "s" },
    meta: { rev: 1, epoch: 0, token: "", updatedAt: "2026-09-30T00:00:00.000Z" },
    deleted: { transactions: [], tenants: [], polls: [], projects: [] },
    tenants: [],
    transactions: [],
    monthlyExpected: [],
    serviceReadings: [],
    buildingProjects: [],
    polls: [],
    paymentDeclarations: [],
    projects: [],
    suppliers: [],
    expenseCategories: [],
    setupComplete: true,
    ...overrides,
  };
}
