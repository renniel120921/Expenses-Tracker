import { ref, onMounted, onUnmounted } from "vue";

export type AuthNavDirection = "forward" | "back" | "exit";

const DIR_STORAGE_KEY = "tipid_auth_nav_dir";

function readAndClearEntryDir(): "forward" | "back" | "default" {
  try {
    const val = sessionStorage.getItem(DIR_STORAGE_KEY);
    sessionStorage.removeItem(DIR_STORAGE_KEY);
    if (val === "forward" || val === "back") return val;
  } catch {
    // ignore storage errors
  }
  return "default";
}

export function useAuthTransition() {
  const entryDir = ref<"forward" | "back" | "default">(readAndClearEntryDir());
  const leavingDir = ref<AuthNavDirection | null>(null);
  const transitionRoot = ref<HTMLElement | null>(null);

  const onPageShow = () => {
    leavingDir.value = null;
  };

  onMounted(() => {
    window.addEventListener("pageshow", onPageShow);
  });

  onUnmounted(() => {
    window.removeEventListener("pageshow", onPageShow);
  });

  async function navigateAuth(
    event: MouseEvent,
    href: string,
    dir: AuthNavDirection = "forward"
  ): Promise<void> {
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
    event.preventDefault();

    try {
      sessionStorage.setItem(DIR_STORAGE_KEY, dir);
    } catch {
      // ignore storage errors
    }

    const reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

    if (reducedMotion || leavingDir.value) {
      window.location.href = href;
      return;
    }

    leavingDir.value = dir;

    const root = transitionRoot.value;
    if (root && typeof root.getAnimations === "function") {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      const running = root.getAnimations({ subtree: true });
      if (running.length > 0) {
        await Promise.race([
          Promise.allSettled(running.map((anim) => anim.finished)),
          new Promise<void>((resolve) => setTimeout(resolve, 190))
        ]);
      }
    }

    window.location.href = href;
  }

  return {
    entryDir,
    leavingDir,
    transitionRoot,
    navigateAuth
  };
}
