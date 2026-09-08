const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

function createHarness({ controlled = true } = {}) {
  const windowListeners = {};
  const serviceWorkerListeners = {};
  const elements = new Map();
  let reloadCount = 0;
  const messages = [];

  function element(tagName) {
    const listeners = {};
    return {
      tagName, children: [], className: "", textContent: "", disabled: false,
      set id(value) { this._id = value; elements.set(value, this); }, get id() { return this._id; },
      setAttribute() {}, addEventListener(type, listener) { listeners[type] = listener; },
      append(...children) { this.children.push(...children); },
      appendChild(child) { this.children.push(child); },
      remove() { if (this.id) elements.delete(this.id); this.removed = true; },
      click() { listeners.click?.(); },
    };
  }

  const waiting = { postMessage(message) { messages.push(message); } };
  const registrationListeners = {};
  const registration = {
    waiting,
    addEventListener(type, listener) { registrationListeners[type] = listener; },
  };
  const serviceWorker = {
    controller: controlled ? {} : null,
    async register() { return registration; },
    addEventListener(type, listener) { serviceWorkerListeners[type] = listener; },
  };
  const location = { protocol: "https:", reload() { reloadCount += 1; } };
  const document = {
    readyState: "complete",
    body: { appendChild(child) { if (child.id) elements.set(child.id, child); } },
    getElementById(id) { return elements.get(id) || null; },
    createElement: element,
  };
  const window = {
    location,
    addEventListener(type, listener) { windowListeners[type] = listener; },
  };
  const context = {
    window, document, navigator: { onLine: true, serviceWorker }, location, localStorage: { getItem() { return null; } },
    Intl, Date, Number, Math, Object, String, TypeError, RangeError, setTimeout,
  };
  vm.runInNewContext(fs.readFileSync("app-utils.js", "utf8"), context);

  const findButton = label => {
    const prompt = elements.get("tipid-update-prompt");
    const all = [];
    const walk = node => { all.push(node); node.children?.forEach(walk); };
    if (prompt) walk(prompt);
    return all.find(node => node.tagName === "button" && node.textContent === label);
  };
  return {
    async load() { await windowListeners.load(); },
    prompt: () => elements.get("tipid-update-prompt"),
    findButton,
    fireControllerChange() { serviceWorkerListeners.controllerchange(); },
    messages,
    reloadCount: () => reloadCount,
  };
}

test("first install does not show an update prompt", async () => {
  const harness = createHarness({ controlled: false });
  await harness.load();
  assert.equal(harness.prompt(), undefined);
});

test("waiting update can be deferred without activation", async () => {
  const harness = createHarness();
  await harness.load();
  assert.ok(harness.prompt());
  harness.findButton("Mamaya").click();
  assert.equal(harness.prompt(), undefined);
  assert.deepEqual(harness.messages, []);
});

test("accepted update sends SKIP_WAITING and reloads exactly once", async () => {
  const harness = createHarness();
  await harness.load();
  harness.findButton("Update Now").click();
  assert.equal(JSON.stringify(harness.messages), JSON.stringify([{ type: "SKIP_WAITING" }]));
  harness.fireControllerChange();
  harness.fireControllerChange();
  assert.equal(harness.reloadCount(), 1);
});
