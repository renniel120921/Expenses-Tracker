import { ref, computed } from "vue";
import type { ThemePreference } from "@/types/finance";

const STORAGE_KEY = "tipid_theme";

function getSystemDark(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function readStoredPreference(): ThemePreference {
  if (typeof localStorage === "undefined") return "system";
  try {
    const val = localStorage.getItem(STORAGE_KEY);
    return val === "light" || val === "dark" ? val : "system";
  } catch {
    return "system";
  }
}

const themePreference = ref<ThemePreference>(readStoredPreference());
const systemDark = ref<boolean>(getSystemDark());
let initialized = false;

function applyThemeToDocument(pref: ThemePreference, osDark: boolean): void {
  if (typeof document === "undefined") return;
  const meta = document.querySelector('meta[name="color-scheme"]');
  const content = pref === "dark" || pref === "light" ? pref : "light dark";
  if (meta) meta.setAttribute("content", content);

  const dark = pref === "dark" || (pref === "system" && osDark);
  document.documentElement.classList.toggle("dark", dark);
}

export function setThemePreference(pref: ThemePreference): void {
  themePreference.value = pref;
  try {
    if (pref === "system") {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, pref);
    }
  } catch {
    // ignore storage errors
  }
  applyThemeToDocument(pref, systemDark.value);
}

export function toggleQuickTheme(): void {
  const currentlyDark =
    themePreference.value === "dark" || (themePreference.value === "system" && systemDark.value);
  const target: ThemePreference = currentlyDark ? "light" : "dark";
  // Revert to system if target matches system preference so two-state toggles never trap OS changes
  if ((target === "dark" && systemDark.value) || (target === "light" && !systemDark.value)) {
    setThemePreference("system");
  } else {
    setThemePreference(target);
  }
}

export function useTheme() {
  if (!initialized && typeof window !== "undefined") {
    initialized = true;
    applyThemeToDocument(themePreference.value, systemDark.value);

    const media = window.matchMedia?.("(prefers-color-scheme: dark)");
    media?.addEventListener("change", (e) => {
      systemDark.value = e.matches;
      applyThemeToDocument(themePreference.value, systemDark.value);
    });

    window.addEventListener("storage", (e) => {
      if (e.key === STORAGE_KEY) {
        themePreference.value = readStoredPreference();
        applyThemeToDocument(themePreference.value, systemDark.value);
      }
    });
  }

  const isDark = computed(
    () => themePreference.value === "dark" || (themePreference.value === "system" && systemDark.value)
  );

  return {
    themePreference,
    systemDark,
    isDark,
    setThemePreference,
    toggleQuickTheme
  };
}
