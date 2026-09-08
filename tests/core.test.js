const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

function loadCore() {
  const context = {
    window: { addEventListener() {} }, navigator: { onLine: true }, location: { protocol: "file:" },
    document: { readyState: "loading", addEventListener() {}, createElement() { return {}; } },
    Intl, Date, Number, Math, Object, String, TypeError, RangeError, setTimeout
  };
  vm.runInNewContext(fs.readFileSync("app-utils.js", "utf8"), context);
  return context.window.TipidCore;
}

test("money uses integer centavos", () => {
  const core = loadCore();
  assert.equal(core.toCentavos(0.30) - core.toCentavos(0.10), core.toCentavos(0.20));
  assert.equal(core.money("12.345"), 12.35);
  assert.throws(() => core.money("Infinity"));
  assert.throws(() => core.money(""));
});

test("Manila date key does not use the previous UTC day", () => {
  assert.equal(loadCore().manilaDateKey(new Date("2026-09-08T01:00:00+08:00")), "2026-09-08");
});

test("month arithmetic clamps to the final calendar day", () => {
  const result = loadCore().addMonthsClamped("2026-01-31", 1);
  assert.equal(`${result.getFullYear()}-${result.getMonth() + 1}-${result.getDate()}`, "2026-2-28");
});

test("storage keys isolate users", () => {
  const core = loadCore();
  assert.notEqual(core.storageKey("user-a", "goal"), core.storageKey("user-b", "goal"));
  assert.throws(() => core.storageKey("", "goal"));
});

test("entry dates support current and legacy fields", () => {
  const core = loadCore();
  assert.equal(core.entryDate({ createdAt: { toDate: () => new Date("2026-01-01") } }).getUTCFullYear(), 2026);
  assert.equal(core.entryDate({ timestamp: "2025-01-01T00:00:00Z" }).getUTCFullYear(), 2025);
});
