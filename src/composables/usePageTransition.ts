import { ref, onMounted, onUnmounted, type Ref } from "vue";

export type PageNavDirection = "forward" | "back" | "fade";

const NAV_STORAGE_KEY = "tipid_page_nav_dir";
const NAV_TTL_MS = 3000;

const PAGE_ORDER: Record<string, number> = {
  "dashboard.html": 0,
  "history.html": 1,
  "chart.html": 2,
  "analytics.html": 2,
  "bills.html": 3,
  "utang.html": 4,
  "profile.html": 5
};

const WORKSPACE_ROUTES = [
  "dashboard.html",
  "history.html",
  "chart.html",
  "bills.html",
  "utang.html",
  "profile.html"
] as const;

const prefetchedSet = new Set<string>();

function pageNameFromHref(href: string): string {
  try {
    const url = new URL(href, window.location.href);
    if (url.origin !== window.location.origin) return "";
    const seg = url.pathname.split("/").pop() || "";
    return seg.toLowerCase();
  } catch {
    return "";
  }
}

function resolveDirection(fromName: string, toName: string): PageNavDirection {
  const fromIdx = PAGE_ORDER[fromName];
  const toIdx = PAGE_ORDER[toName];
  if (typeof fromIdx === "number" && typeof toIdx === "number") {
    if (toIdx > fromIdx) return "forward";
    if (toIdx < fromIdx) return "back";
  }
  return "fade";
}

function readAndClearEntryDir(): PageNavDirection | "default" {
  try {
    const raw = sessionStorage.getItem(NAV_STORAGE_KEY);
    sessionStorage.removeItem(NAV_STORAGE_KEY);
    if (!raw) return "default";
    const parsed = JSON.parse(raw) as { dir?: PageNavDirection; ts?: number };
    if (typeof parsed?.ts === "number" && Date.now() - parsed.ts > NAV_TTL_MS) {
      return "default";
    }
    if (parsed?.dir === "forward" || parsed?.dir === "back" || parsed?.dir === "fade") {
      return parsed.dir;
    }
  } catch {
    // ignore malformed or restricted storage
  }
  return "default";
}

export function prefetchWorkspacePage(href: string): void {
  if (typeof document === "undefined") return;
  const pageName = pageNameFromHref(href);
  if (!pageName || !(pageName in PAGE_ORDER)) return;
  if (prefetchedSet.has(pageName)) return;
  prefetchedSet.add(pageName);

  const link = document.createElement("link");
  link.rel = "prefetch";
  link.as = "document";
  link.href = pageName;
  document.head.appendChild(link);
}

export function usePageTransition(mainRef: Ref<HTMLElement | null>) {
  const entryDir = ref<PageNavDirection | "default">(readAndClearEntryDir());
  const leavingDir = ref<PageNavDirection | null>(null);

  const onPageShow = () => {
    leavingDir.value = null;
  };

  onMounted(() => {
    window.addEventListener("pageshow", onPageShow);

    const cur = pageNameFromHref(window.location.href);
    const warmup = () => {
      for (const route of WORKSPACE_ROUTES) {
        if (route !== cur) {
          prefetchWorkspacePage(route);
        }
      }
    };

    if ("requestIdleCallback" in window) {
      (window as Window & { requestIdleCallback: (cb: () => void) => number }).requestIdleCallback(warmup);
    } else {
      setTimeout(warmup, 350);
    }
  });

  onUnmounted(() => {
    window.removeEventListener("pageshow", onPageShow);
  });

  async function navigateSmooth(href: string, explicitDir?: PageNavDirection): Promise<void> {
    const targetName = pageNameFromHref(href);
    const currentName = pageNameFromHref(window.location.href);
    const dir = explicitDir || resolveDirection(currentName, targetName);

    const reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

    try {
      sessionStorage.setItem(NAV_STORAGE_KEY, JSON.stringify({ dir, ts: Date.now() }));
    } catch {
      // ignore storage errors
    }

    if (reducedMotion || leavingDir.value) {
      window.location.href = href;
      return;
    }

    leavingDir.value = dir;

    const mainEl = mainRef.value;
    if (mainEl && typeof mainEl.getAnimations === "function") {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      const running = mainEl.getAnimations({ subtree: false });
      if (running.length > 0) {
        await Promise.race([
          Promise.allSettled(running.map((anim) => anim.finished)),
          new Promise<void>((resolve) => setTimeout(resolve, 130))
        ]);
      } else {
        await new Promise<void>((resolve) => setTimeout(resolve, 110));
      }
    }

    window.location.href = href;
  }

  function handleShellClick(event: MouseEvent): void {
    if (
      event.defaultPrevented ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.button !== 0
    ) {
      return;
    }

    const target = event.target as HTMLElement | null;
    const anchor = target?.closest?.("a[href]") as HTMLAnchorElement | null;
    if (!anchor) return;
    if (anchor.hasAttribute("download") || (anchor.target && anchor.target !== "_self")) return;

    const rawHref = anchor.getAttribute("href") || "";
    if (!rawHref || rawHref.startsWith("#")) return;

    const nextPage = pageNameFromHref(anchor.href);
    if (!nextPage || !(nextPage in PAGE_ORDER)) return;

    const destUrl = new URL(anchor.href);
    const curUrl = new URL(window.location.href);
    if (destUrl.pathname === curUrl.pathname && destUrl.search === curUrl.search && destUrl.hash) {
      return;
    }

    event.preventDefault();
    void navigateSmooth(anchor.href);
  }

  function handleShellPointerOver(event: Event): void {
    const target = event.target as HTMLElement | null;
    const anchor = target?.closest?.("a[href]") as HTMLAnchorElement | null;
    if (!anchor) return;
    prefetchWorkspacePage(anchor.href);
  }

  return {
    entryDir,
    leavingDir,
    handleShellClick,
    handleShellPointerOver
  };
}
