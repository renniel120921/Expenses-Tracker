import { ref } from "vue";

export const updateAvailable = ref(false);
export const swReady = ref(false);

let waitingWorker: ServiceWorker | null = null;
let updateAccepted = false;
let reloadStarted = false;
let swInitialized = false;

export interface ServiceWorkerEnv {
  navigator?: {
    serviceWorker?: {
      controller?: unknown;
      ready?: Promise<ServiceWorkerRegistration>;
      register(url: string): Promise<ServiceWorkerRegistration>;
      addEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
    };
  };
  location?: {
    protocol: string;
    reload(): void;
  };
  addEventListener?(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
}

export function acceptServiceWorkerUpdate(): void {
  if (!waitingWorker) return;
  updateAccepted = true;
  waitingWorker.postMessage({ type: "SKIP_WAITING" });
}

export function dismissServiceWorkerUpdate(): void {
  updateAvailable.value = false;
}

export function resetSwStateForTest(): void {
  waitingWorker = null;
  updateAccepted = false;
  reloadStarted = false;
  swInitialized = false;
  updateAvailable.value = false;
  swReady.value = false;
}

export function initServiceWorker(env: ServiceWorkerEnv = window): void {
  if (env === window && swInitialized) return;
  const sw = env.navigator?.serviceWorker;
  const loc = env.location;
  if (!sw || !loc || loc.protocol === "file:") return;
  if (env === window) swInitialized = true;

  if (sw.controller) {
    swReady.value = true;
  }

  sw.addEventListener("controllerchange", () => {
    swReady.value = true;
    if (!updateAccepted || reloadStarted) return;
    reloadStarted = true;
    loc.reload();
  });

  const register = async () => {
    try {
      const registration = await sw.register("/sw.js");
      swReady.value = Boolean(sw.controller || registration.active);

      const exposePrompt = (worker: ServiceWorker | null) => {
        if (!worker || !sw.controller) return;
        waitingWorker = worker;
        updateAvailable.value = true;
      };

      if (registration.waiting) {
        exposePrompt(registration.waiting);
      }

      registration.addEventListener("updatefound", () => {
        const installing = registration.installing;
        if (!installing) return;
        installing.addEventListener("statechange", () => {
          if (installing.state === "activated") {
            swReady.value = true;
          }
          if (installing.state === "installed" && sw.controller) {
            exposePrompt(registration.waiting || installing);
          }
        });
      });

      if (typeof env.addEventListener === "function") {
        env.addEventListener("online", () => {
          void registration.update().catch(() => {});
        });
      }
    } catch {
      // Service worker registration skipped or unavailable
    }
  };

  if (typeof env.addEventListener === "function") {
    env.addEventListener("load", () => {
      void register();
    }, { once: true });
  } else {
    void register();
  }
}
