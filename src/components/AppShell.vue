<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import {
  LayoutDashboard,
  ListOrdered,
  PieChart,
  ReceiptText,
  Users,
  Settings,
  Sun,
  Moon,
  Monitor,
  LogOut,
  WifiOff,
  RefreshCw,
  CheckCircle2
} from "@lucide/vue";
import { useTheme } from "@/composables/useTheme";
import { usePageTransition } from "@/composables/usePageTransition";
import { useI18n } from "@/lib/i18n";
import { logOut } from "@/lib/auth";
import { hasPendingSync, justSynced, queuedWriteCount } from "@/lib/offlineSync";
import {
  initServiceWorker,
  updateAvailable,
  acceptServiceWorkerUpdate,
  dismissServiceWorkerUpdate
} from "@/lib/swRegistration";
import AppToast from "./AppToast.vue";
import LockScreen from "./LockScreen.vue";
import type { NavTab } from "@/types/finance";
import type { AuthUserView } from "@/composables/useAuthGuard";

const props = defineProps<{
  activeTab: NavTab;
  user: AuthUserView | null;
  isOffline: boolean;
  isLocked: boolean;
}>();

const emit = defineEmits<{
  (e: "unlocked"): void;
}>();

const { themePreference, isDark, toggleQuickTheme } = useTheme();
const { t, isTl } = useI18n();
const mainRef = ref<HTMLElement | null>(null);
const { entryDir, leavingDir, handleShellClick, handleShellPointerOver } = usePageTransition(mainRef);

const navItems = computed(() => [
  { id: "home" as NavTab, href: "dashboard.html", label: t.value.navHome, icon: LayoutDashboard },
  { id: "history" as NavTab, href: "history.html", label: t.value.navHistory, icon: ListOrdered },
  { id: "analytics" as NavTab, href: "chart.html", label: t.value.navAnalytics, icon: PieChart },
  { id: "bills" as NavTab, href: "bills.html", label: t.value.navBills, icon: ReceiptText },
  { id: "utang" as NavTab, href: "utang.html", label: t.value.navUtang, icon: Users },
  { id: "profile" as NavTab, href: "profile.html", label: t.value.navProfile, icon: Settings, desktopOnly: true }
]);

const initial = computed(() => {
  const name = props.user?.displayName || props.user?.email || "T";
  return name.charAt(0).toUpperCase();
});

const displayName = computed(() => {
  return props.user?.displayName || props.user?.email?.split("@")[0] || "Tipid User";
});

async function handleSignOut() {
  await logOut();
  window.location.href = "login.html";
}

onMounted(() => {
  if (import.meta.env.PROD) {
    initServiceWorker();
  }
});
</script>

<template>
  <div
    class="tipid-atmosphere min-h-dvh bg-[var(--bg-canvas)] text-[var(--text-primary)]"
    @click="handleShellClick"
    @pointerover="handleShellPointerOver"
    @touchstart.passive="handleShellPointerOver"
  >
    <a href="#main-content" class="skip-link visually-hidden">
      {{ isTl ? "Tumalon sa pangunahing nilalaman" : "Skip to main content" }}
    </a>

    <!-- Offline & Sync telemetry status pill -->
    <div
      v-if="isOffline || hasPendingSync || justSynced"
      role="status"
      aria-live="polite"
      :class="[
        'fixed top-3 left-1/2 z-50 -translate-x-1/2 max-w-[calc(100vw-1.5rem)] rounded-full border px-4 py-1.5 text-xs font-semibold shadow-[var(--shadow-popover)] backdrop-blur-md flex items-center gap-1.5',
        isOffline
          ? 'border-[var(--border-strong)] bg-[var(--warning-soft)] text-[var(--warning)]'
          : hasPendingSync
            ? 'border-[var(--border-strong)] bg-[var(--accent-soft)] text-[var(--accent)]'
            : 'border-[var(--border-strong)] bg-[var(--income-soft)] text-[var(--income)]'
      ]"
    >
      <template v-if="isOffline">
        <WifiOff :size="14" aria-hidden="true" />
        <span v-if="hasPendingSync">
          {{
            isTl
              ? `Offline · May ${queuedWriteCount > 0 ? queuedWriteCount : "mga"} naka-save sa device`
              : `Offline · ${queuedWriteCount > 0 ? queuedWriteCount : "Changes"} saved locally to sync`
          }}
        </span>
        <span v-else>
          {{ isTl ? "Offline mode — puwedeng magtala, isi-sync online." : "Offline mode — works offline & syncs online." }}
        </span>
      </template>
      <template v-else-if="hasPendingSync">
        <RefreshCw :size="14" class="animate-spin" aria-hidden="true" />
        <span>{{ isTl ? "Nagsi-sync ng mga pagbabago..." : "Syncing offline changes..." }}</span>
      </template>
      <template v-else>
        <CheckCircle2 :size="14" aria-hidden="true" />
        <span>{{ isTl ? "Na-sync na sa cloud." : "All offline changes synced." }}</span>
      </template>
    </div>

    <!-- Mobile Floating Top Capsule (< 768px) -->
    <div class="pointer-events-none sticky top-3 z-30 mx-3 pt-3 md:hidden print:hidden" style="padding-top: max(0.75rem, var(--safe-top))">
      <header
        class="tipid-floating-chrome pointer-events-auto flex items-center justify-between rounded-2xl px-3.5 py-2"
      >
        <a href="dashboard.html" class="flex items-center gap-2.5 no-underline">
          <img src="/assets/logo.svg" alt="" width="30" height="30" class="h-7.5 w-7.5 rounded-xl shadow-xs" />
          <span class="text-base font-bold tracking-tight text-[var(--text-primary)]">Tipid</span>
        </a>

        <div class="flex min-w-0 items-center gap-1.5">
          <button
            type="button"
            class="tipid-compact tipid-compact-touch inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] shadow-xs transition-colors hover:bg-[var(--bg-inset)] hover:text-[var(--text-primary)]"
            :aria-label="isDark ? 'Switch light/system theme' : 'Switch dark/system theme'"
            @click="toggleQuickTheme"
          >
            <Sun v-if="themePreference === 'light'" :size="16" aria-hidden="true" />
            <Moon v-else-if="themePreference === 'dark'" :size="16" aria-hidden="true" />
            <Monitor v-else :size="16" aria-hidden="true" />
          </button>

          <a
            href="profile.html"
            :aria-current="activeTab === 'profile' ? 'page' : undefined"
            class="inline-flex h-9 min-w-0 items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 text-xs font-semibold text-[var(--text-primary)] no-underline shadow-xs transition-colors hover:bg-[var(--bg-inset)]"
            :title="t.navProfile"
          >
            <span class="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--accent-soft)] text-[11px] font-bold text-[var(--accent)]">
              <img
                v-if="user?.photoURL"
                :src="user.photoURL"
                alt=""
                referrerpolicy="no-referrer"
                class="h-full w-full object-cover"
              />
              <span v-else>{{ initial }}</span>
            </span>
            <span class="hidden min-[360px]:inline max-w-[76px] min-[400px]:max-w-[96px] truncate">{{ displayName }}</span>
          </a>

          <button
            type="button"
            class="tipid-compact tipid-compact-touch inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] shadow-xs transition-colors hover:bg-[var(--expense-soft)] hover:text-[var(--expense)]"
            :aria-label="t.navLogout"
            :title="t.navLogout"
            @click="handleSignOut"
          >
            <LogOut :size="15" aria-hidden="true" />
          </button>
        </div>
      </header>
    </div>

    <!-- Desktop Floating Sidebar Island (>= 768px) -->
    <aside
      class="tipid-floating-chrome hidden print:hidden md:fixed md:inset-y-4 md:left-4 md:z-30 md:flex md:w-[228px] lg:w-[244px] md:flex-col md:rounded-2xl"
    >
      <div class="flex items-center justify-between border-b border-[var(--border-subtle)] px-4 py-4">
        <a href="dashboard.html" class="flex items-center gap-2.5 no-underline">
          <img src="/assets/logo.svg" alt="" width="32" height="32" class="h-8 w-8 rounded-xl shadow-xs" />
          <div>
            <span class="block text-base font-bold leading-none tracking-tight text-[var(--text-primary)]">Tipid</span>
            <span class="mt-0.5 block text-[10px] font-medium text-[var(--text-muted)]">Finance</span>
          </div>
        </a>

        <button
          type="button"
          class="tipid-compact inline-flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-inset)]/60 text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-inset)] hover:text-[var(--text-primary)]"
          :aria-label="`Theme: ${themePreference}`"
          :title="`Theme: ${themePreference}`"
          @click="toggleQuickTheme"
        >
          <Sun v-if="themePreference === 'light'" :size="15" aria-hidden="true" />
          <Moon v-else-if="themePreference === 'dark'" :size="15" aria-hidden="true" />
          <Monitor v-else :size="15" aria-hidden="true" />
        </button>
      </div>

      <div class="flex-1 overflow-y-auto px-3 py-4" id="desktop-nav-slot-anchor" />

      <div class="p-3">
        <div class="tipid-inset flex items-center justify-between gap-2 px-3 py-2.5">
          <a href="profile.html" class="flex min-w-0 flex-1 items-center gap-2.5 no-underline">
            <span class="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--accent-soft)] text-xs font-bold text-[var(--accent)] ring-1 ring-[var(--border-subtle)]">
              <img
                v-if="user?.photoURL"
                :src="user.photoURL"
                alt=""
                referrerpolicy="no-referrer"
                class="h-full w-full object-cover"
              />
              <span v-else>{{ initial }}</span>
            </span>
            <div class="min-w-0">
              <p class="truncate text-xs font-semibold text-[var(--text-primary)]">
                {{ displayName }}
              </p>
              <p class="truncate text-[11px] text-[var(--text-muted)]">
                {{ user?.email }}
              </p>
            </div>
          </a>
          <button
            type="button"
            class="tipid-compact inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--expense-soft)] hover:text-[var(--expense)]"
            :aria-label="t.navLogout"
            :title="t.navLogout"
            @click="handleSignOut"
          >
            <LogOut :size="15" aria-hidden="true" />
          </button>
        </div>
      </div>
    </aside>

    <!-- Single Semantic Primary Navigation Landmark (Floating Bottom Pill on Mobile, Floating Rail on Desktop) -->
    <nav aria-label="Primary" class="tipid-primary-nav print:hidden">
      <ul class="tipid-nav-list">
        <li
          v-for="item in navItems"
          :key="item.id"
          :class="[item.desktopOnly ? 'hidden md:block' : 'flex-1 md:flex-none']"
        >
          <a
            :href="item.href"
            :aria-current="activeTab === item.id ? 'page' : undefined"
            class="tipid-nav-link"
          >
            <span class="tipid-nav-icon">
              <component :is="item.icon" :size="18" class="shrink-0" aria-hidden="true" />
            </span>
            <span class="truncate">{{ item.label }}</span>
          </a>
        </li>
      </ul>
    </nav>

    <!-- Main Workspace -->
    <main
      id="main-content"
      ref="mainRef"
      tabindex="-1"
      :data-page-enter="entryDir"
      :data-page-leaving="leavingDir ?? undefined"
      class="tipid-workspace-main mx-auto w-full max-w-6xl px-4 pb-28 pt-5 sm:px-6 md:pl-[calc(228px+2.5rem)] lg:pl-[calc(244px+2.75rem)] md:pr-8 md:pb-12 md:pt-8 print:max-w-none print:p-0"
    >
      <slot />
    </main>

    <!-- Floating Update Prompt Banner -->
    <div
      v-if="updateAvailable"
      role="region"
      aria-label="App Update Available"
      class="fixed bottom-24 right-4 z-[130] flex w-[min(22rem,calc(100vw-2rem))] items-center gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3.5 shadow-[var(--shadow-popover)] md:bottom-5"
    >
      <div class="tipid-icon-badge h-9 w-9 bg-[var(--accent-soft)] text-[var(--accent)]">
        <RefreshCw :size="16" aria-hidden="true" />
      </div>
      <div class="min-w-0 flex-1">
        <p class="text-xs font-semibold text-[var(--text-primary)]">
          {{ isTl ? "May bagong update ang Tipid." : "An update is ready." }}
        </p>
        <p class="text-[11px] text-[var(--text-secondary)]">
          {{ isTl ? "I-refresh para makuha ang pinakabagong version." : "Reload to apply the latest version." }}
        </p>
      </div>
      <div class="flex shrink-0 items-center gap-1">
        <button
          type="button"
          class="tipid-compact rounded-lg px-2.5 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-inset)]"
          @click="dismissServiceWorkerUpdate"
        >
          {{ isTl ? "Mamaya" : "Later" }}
        </button>
        <button
          type="button"
          class="tipid-compact rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[var(--accent-hover)]"
          @click="acceptServiceWorkerUpdate"
        >
          {{ isTl ? "I-update" : "Reload" }}
        </button>
      </div>
    </div>

    <AppToast />
    <LockScreen
      v-if="isLocked && user?.uid"
      :uid="user.uid"
      :email="user.email"
      @unlocked="emit('unlocked')"
    />
  </div>
</template>

<style scoped>
/* Mobile Floating Bottom Pill Dock */
.tipid-primary-nav {
  position: fixed;
  inset-inline: 0.75rem;
  bottom: max(0.875rem, var(--safe-bottom));
  z-index: 30;
  max-inline-size: 28rem;
  margin-inline: auto;
  border-radius: 1.5rem;
  border: 1px solid var(--border-subtle);
  background: color-mix(in srgb, var(--bg-surface) 86%, transparent);
  backdrop-filter: blur(22px);
  box-shadow: var(--shadow-floating);
  padding: 0.375rem;
}

.tipid-nav-list {
  display: flex;
  align-items: stretch;
  justify-content: space-around;
  list-style: none;
  margin: 0;
  padding: 0;
  gap: 0.125rem;
}

.tipid-nav-link {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.2rem;
  min-block-size: 48px;
  padding: 0.375rem 0.25rem;
  border-radius: 1rem;
  font-size: 0.6875rem;
  font-weight: 500;
  color: var(--text-muted);
  text-decoration: none;
  transition: color 0.15s ease, background-color 0.15s ease;
}

.tipid-nav-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 1.5rem;
  border-radius: 9999px;
  transition: transform 0.2s cubic-bezier(0.32, 0.72, 0, 1), background-color 0.16s ease, color 0.16s ease;
}

.tipid-nav-link:hover {
  color: var(--text-primary);
}

.tipid-nav-link[aria-current="page"] {
  color: var(--accent);
  font-weight: 700;
}

.tipid-nav-link[aria-current="page"] .tipid-nav-icon {
  background: var(--accent-soft);
  transform: scale(1.06);
}

/* Desktop Floating Sidebar Rail inside detached left island */
@media (min-width: 768px) {
  .tipid-primary-nav {
    inset: 5.5rem auto 5.75rem 1rem;
    max-inline-size: none;
    margin-inline: 0;
    width: 228px;
    border-radius: 0;
    border: 0;
    background: transparent;
    backdrop-filter: none;
    box-shadow: none;
    padding: 0.75rem;
    overflow-y: auto;
    pointer-events: none;
  }

  .tipid-nav-list {
    flex-direction: column;
    gap: 0.25rem;
    pointer-events: auto;
  }

  .tipid-nav-link {
    flex-direction: row;
    justify-content: flex-start;
    gap: 0.75rem;
    min-block-size: 42px;
    padding: 0.5rem 0.875rem;
    font-size: 0.875rem;
    border-radius: 0.875rem;
  }

  .tipid-nav-icon {
    width: auto;
    height: auto;
    background: transparent !important;
  }

  .tipid-nav-link:hover {
    background: var(--bg-inset);
  }

  .tipid-nav-link[aria-current="page"] {
    background: var(--accent-soft);
    color: var(--accent);
    box-shadow: inset 3px 0 0 var(--accent);
  }
}

@media (min-width: 1024px) {
  .tipid-primary-nav {
    width: 244px;
  }
}
</style>
