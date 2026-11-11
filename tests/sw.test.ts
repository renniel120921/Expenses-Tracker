import { describe, it, expect, beforeEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  acceptServiceWorkerUpdate,
  dismissServiceWorkerUpdate,
  initServiceWorker,
  resetSwStateForTest,
  updateAvailable
} from "@/lib/swRegistration";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function createMockSwEnv(options: { hasController?: boolean; initialWaiting?: boolean } = {}) {
  const listeners = new Map<string, Array<(...args: unknown[]) => void>>();
  let reloadCount = 0;
  let skipWaitingCount = 0;

  const createWorker = () => ({
    state: "installing",
    listeners: new Map<string, Array<() => void>>(),
    addEventListener(event: string, cb: () => void) {
      const list = this.listeners.get(event) || [];
      list.push(cb);
      this.listeners.set(event, list);
    },
    postMessage(msg: { type?: string }) {
      if (msg?.type === "SKIP_WAITING") skipWaitingCount += 1;
    },
    triggerState(nextState: string) {
      this.state = nextState;
      for (const cb of this.listeners.get("statechange") || []) cb();
    }
  });

  const registrationListeners = new Map<string, Array<() => void>>();
  const waitingWorker = options.initialWaiting ? createWorker() : null;
  let installingWorker: ReturnType<typeof createWorker> | null = null;

  const registration = {
    waiting: waitingWorker as unknown as ServiceWorker | null,
    get installing() {
      return installingWorker as unknown as ServiceWorker | null;
    },
    addEventListener(event: string, cb: () => void) {
      const list = registrationListeners.get(event) || [];
      list.push(cb);
      registrationListeners.set(event, list);
    }
  };

  const controller = options.hasController ? ({} as ServiceWorker) : undefined;
  const swObj = {
    controller,
    register: async () => registration as unknown as ServiceWorkerRegistration,
    addEventListener(event: string, cb: (...args: unknown[]) => void) {
      const list = listeners.get(event) || [];
      list.push(cb);
      listeners.set(event, list);
    }
  };

  return {
    env: {
      navigator: { serviceWorker: swObj },
      location: {
        protocol: "https:",
        reload() {
          reloadCount += 1;
        }
      }
    },
    triggerUpdateFound() {
      installingWorker = createWorker();
      for (const cb of registrationListeners.get("updatefound") || []) cb();
      return installingWorker;
    },
    triggerControllerChange() {
      for (const cb of listeners.get("controllerchange") || []) cb();
    },
    get reloadCount() {
      return reloadCount;
    },
    get skipWaitingCount() {
      return skipWaitingCount;
    }
  };
}

describe("Service worker safe update lifecycle", () => {
  beforeEach(() => {
    resetSwStateForTest();
  });

  it("does not prompt or reload during initial installation without an active controller", async () => {
    const mock = createMockSwEnv({ hasController: false });
    initServiceWorker(mock.env);
    await Promise.resolve();

    const worker = mock.triggerUpdateFound();
    worker.triggerState("installed");

    expect(updateAvailable.value).toBe(false);
    expect(mock.reloadCount).toBe(0);
  });

  it("prompts on waiting update and reloads only once after user accepts", async () => {
    const mock = createMockSwEnv({ hasController: true, initialWaiting: true });
    initServiceWorker(mock.env);
    await Promise.resolve();

    expect(updateAvailable.value).toBe(true);
    expect(mock.reloadCount).toBe(0);

    // Ignoring unsolicited controllerchange before acceptance
    mock.triggerControllerChange();
    expect(mock.reloadCount).toBe(0);

    acceptServiceWorkerUpdate();
    expect(mock.skipWaitingCount).toBe(1);

    mock.triggerControllerChange();
    mock.triggerControllerChange();
    expect(mock.reloadCount).toBe(1);
  });

  it("dismisses prompt cleanly without activating waiting worker", async () => {
    const mock = createMockSwEnv({ hasController: true, initialWaiting: true });
    initServiceWorker(mock.env);
    await Promise.resolve();

    expect(updateAvailable.value).toBe(true);
    dismissServiceWorkerUpdate();
    expect(updateAvailable.value).toBe(false);
    expect(mock.skipWaitingCount).toBe(0);
  });

  it("configures Vite SW generator to bypass private Firebase hosts, support query routes offline, and skip waiting on message", () => {
    const viteConfig = fs.readFileSync(path.join(ROOT, "vite.config.ts"), "utf8");
    expect(viteConfig).toContain("firestore.googleapis.com");
    expect(viteConfig).toContain("identitytoolkit.googleapis.com");
    expect(viteConfig).toContain("type === 'SKIP_WAITING'");
    expect(viteConfig).toContain("self.skipWaiting()");
    expect(viteConfig).toContain("ignoreSearch: true");
    expect(viteConfig).toContain("OFFLINE_ROUTE_ALIASES");
    expect(viteConfig).toContain("cacheFirst");
    expect(viteConfig).toContain("networkFirstWithTimeout");
  });
});
