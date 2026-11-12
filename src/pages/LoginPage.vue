<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import {
  AlertCircle,
  ArrowLeft,
  ArrowUp,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  Monitor,
  Moon,
  ReceiptText,
  ShieldCheck,
  Sun,
  Wallet,
  Wifi
} from "@lucide/vue";
import {
  authPersistenceReady,
  friendlyError,
  logIn,
  loginWithGoogle,
  onAuthChange,
  resetPassword
} from "@/lib/auth";
import { useTheme } from "@/composables/useTheme";
import { useAuthTransition } from "@/composables/useAuthTransition";
import { setLanguage, useI18n } from "@/lib/i18n";
import type { Unsubscribe } from "firebase/auth";

const { themePreference, toggleQuickTheme } = useTheme();
const { entryDir, leavingDir, transitionRoot, navigateAuth } = useAuthTransition();
const { isTl, lang } = useI18n();

const email = ref("");
const password = ref("");
const showPw = ref(false);
const loading = ref(false);
const errorMsg = ref("");
const forgotOpen = ref(false);
const resetEmail = ref("");
const resetNotice = ref("");
const resetLoading = ref(false);

const emailRef = ref<HTMLInputElement | null>(null);
const passwordRef = ref<HTMLInputElement | null>(null);

let unsub: Unsubscribe | null = null;

onMounted(() => {
  void authPersistenceReady.finally(() => {
    unsub = onAuthChange((u) => {
      if (u) {
        window.location.href = "dashboard.html";
      }
    });
  });
});

onUnmounted(() => {
  unsub?.();
});

function switchLanguage() {
  setLanguage(lang.value === "tl" ? "en" : "tl");
}

function toggleForgot() {
  forgotOpen.value = !forgotOpen.value;
  if (forgotOpen.value && !resetEmail.value && email.value) {
    resetEmail.value = email.value;
  }
}

async function handleSubmit() {
  errorMsg.value = "";
  if (!email.value.trim()) {
    errorMsg.value = isTl.value ? "Ilagay ang iyong email address." : "Please enter your email address.";
    emailRef.value?.focus();
    return;
  }
  if (!password.value) {
    errorMsg.value = isTl.value ? "Ilagay ang iyong password." : "Please enter your password.";
    passwordRef.value?.focus();
    return;
  }

  loading.value = true;
  try {
    await authPersistenceReady;
    await logIn(email.value, password.value);
    window.location.href = "dashboard.html";
  } catch (err) {
    errorMsg.value = friendlyError(err);
  } finally {
    loading.value = false;
  }
}

async function handleGoogle() {
  errorMsg.value = "";
  loading.value = true;
  try {
    await authPersistenceReady;
    const user = await loginWithGoogle();
    if (!user) return;
    window.location.href = "dashboard.html";
  } catch (err) {
    errorMsg.value = friendlyError(err);
  } finally {
    loading.value = false;
  }
}

async function handleForgot() {
  resetNotice.value = "";
  errorMsg.value = "";
  resetLoading.value = true;
  try {
    await resetPassword(resetEmail.value || email.value);
    resetNotice.value = isTl.value
      ? "Kung rehistrado ang account na iyon, naipadala na ang password reset link sa inbox."
      : "If that account exists, a password reset link has been sent to its inbox.";
  } catch (err) {
    errorMsg.value = friendlyError(err);
  } finally {
    resetLoading.value = false;
  }
}
</script>

<template>
  <div
    ref="transitionRoot"
    :data-auth-leaving="leavingDir || undefined"
    class="min-h-dvh grid grid-cols-1 bg-[var(--bg-canvas)] lg:grid-cols-12"
  >
    <!-- Desktop Editorial Showcase Panel -->
    <aside class="tipid-card-emerald hidden flex-col justify-between rounded-none border-0 p-10 xl:p-12 lg:col-span-5 lg:flex">
      <div class="tipid-auth-showcase flex items-center justify-between">
        <a
          href="index.html"
          class="flex items-center gap-3 text-white no-underline"
          @click="navigateAuth($event, 'index.html', 'exit')"
        >
          <img src="/assets/logo.svg" alt="" width="36" height="36" class="h-9 w-9 rounded-xl ring-1 ring-white/25" />
          <div>
            <span class="block text-lg font-bold leading-none tracking-tight">Tipid</span>
            <span class="mt-0.5 block text-[10px] font-medium uppercase tracking-widest text-white/65">Personal Ledger</span>
          </div>
        </a>
        <span class="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/90">
          {{ isTl ? "Handa Offline" : "Offline Ready" }}
        </span>
      </div>

      <div class="max-w-md space-y-6">
        <div class="tipid-auth-step tipid-auth-step-1 space-y-2.5">
          <p class="tipid-eyebrow text-[#6EE7B7]">
            {{ isTl ? "Maligayang Pagbabalik" : "Workspace Access" }}
          </p>
          <h2 class="text-3xl font-bold leading-tight tracking-tight text-white">
            {{ isTl ? "Diretsong kita ang balanse, gastos, at nakatakdang bills." : "Calm clarity for every peso you earn and spend." }}
          </h2>
        </div>

        <!-- Bento Showcase Preview Matching Dashboard Aesthetic -->
        <div class="tipid-auth-step tipid-auth-step-2 space-y-2.5">
          <div class="rounded-2xl border border-white/18 bg-black/22 p-4 shadow-sm backdrop-blur-xs">
            <div class="flex items-center justify-between gap-2">
              <span class="text-[10px] font-semibold uppercase tracking-wider text-white/65">
                {{ isTl ? "Netong Balanse" : "Total Balance" }}
              </span>
              <span class="inline-flex items-center gap-1 rounded-full bg-[#6EE7B7]/18 px-2 py-0.5 font-mono text-[11px] font-semibold text-[#6EE7B7]">
                <ArrowUp :size="11" aria-hidden="true" />
                +₱18,420.50
              </span>
            </div>
            <p class="mt-1 font-mono text-2xl font-bold tracking-tight text-white">₱64,890.25</p>
            <div class="mt-3 grid grid-cols-3 gap-2 border-t border-white/12 pt-3 text-[11px]">
              <div class="rounded-xl bg-white/8 px-2.5 py-2">
                <span class="block text-white/65">Cash</span>
                <strong class="font-mono text-white">₱12,200</strong>
              </div>
              <div class="rounded-xl bg-white/8 px-2.5 py-2">
                <span class="block text-white/65">GCash</span>
                <strong class="font-mono text-white">₱14,250</strong>
              </div>
              <div class="rounded-xl bg-white/8 px-2.5 py-2">
                <span class="block text-white/65">SeaBank</span>
                <strong class="font-mono text-white">₱38,440</strong>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2.5 text-xs">
            <div class="rounded-2xl border border-white/14 bg-white/8 p-3.5 backdrop-blur-xs">
              <span class="inline-flex items-center gap-1.5 text-[11px] font-medium text-white/75">
                <Wallet :size="13" class="text-[#6EE7B7]" aria-hidden="true" />
                <span>{{ isTl ? "26 PH Accounts" : "26 PH Accounts" }}</span>
              </span>
              <p class="mt-1 text-xs font-semibold text-white">
                {{ isTl ? "Eksaktong centavo" : "Exact centavo sync" }}
              </p>
            </div>
            <div class="rounded-2xl border border-white/14 bg-white/8 p-3.5 backdrop-blur-xs">
              <span class="inline-flex items-center gap-1.5 text-[11px] font-medium text-white/75">
                <ReceiptText :size="13" class="text-[#6EE7B7]" aria-hidden="true" />
                <span>{{ isTl ? "Bills & Utang" : "Bills & Utang" }}</span>
              </span>
              <p class="mt-1 text-xs font-semibold text-white">
                {{ isTl ? "Calendar + Paalala" : "Calendar reminders" }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div class="flex items-center justify-between border-t border-white/12 pt-4 text-xs text-white/70">
        <span class="inline-flex items-center gap-1.5">
          <ShieldCheck :size="14" class="text-[#6EE7B7]" aria-hidden="true" />
          {{ isTl ? "Isolated bawat user" : "Per-user Firestore isolation" }}
        </span>
        <span class="inline-flex items-center gap-1.5">
          <Wifi :size="14" class="text-[#6EE7B7]" aria-hidden="true" />
          PWA Sync
        </span>
      </div>
    </aside>

    <!-- Right Workspace Form Column -->
    <div
      class="tipid-atmosphere relative flex flex-col justify-between px-4 sm:px-8 sm:py-6 lg:col-span-7"
      style="padding-top: max(1rem, var(--safe-top)); padding-bottom: max(1.25rem, var(--safe-bottom))"
    >
      <div class="tipid-grid-bg pointer-events-none absolute inset-0 opacity-40" aria-hidden="true" />

      <!-- Floating Top Navigation Pill -->
      <div class="tipid-auth-nav relative mx-auto w-full max-w-[440px]">
        <header class="tipid-floating-chrome flex items-center justify-between gap-2 rounded-2xl px-3 py-2">
          <a
            href="index.html"
            class="tipid-compact tipid-compact-touch inline-flex min-h-[36px] shrink-0 items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-semibold text-[var(--text-secondary)] no-underline transition-colors hover:bg-[var(--bg-inset)] hover:text-[var(--text-primary)]"
            @click="navigateAuth($event, 'index.html', 'exit')"
          >
            <ArrowLeft :size="14" aria-hidden="true" />
            <span>{{ isTl ? "Home" : "Home" }}</span>
          </a>

          <a
            href="index.html"
            class="flex shrink-0 items-center gap-2 no-underline lg:hidden"
            @click="navigateAuth($event, 'index.html', 'exit')"
          >
            <img src="/assets/logo.svg" alt="" width="26" height="26" class="h-6.5 w-6.5 shrink-0 rounded-lg" />
            <span class="whitespace-nowrap text-sm font-bold tracking-tight text-[var(--text-primary)]">Tipid</span>
          </a>

          <div class="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              class="tipid-compact tipid-compact-touch inline-flex min-h-[32px] items-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 py-1 text-[11px] font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-inset)] hover:text-[var(--text-primary)]"
              @click="switchLanguage"
            >
              {{ isTl ? "EN" : "FIL" }}
            </button>
            <button
              type="button"
              class="tipid-compact tipid-compact-touch inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--bg-inset)] hover:text-[var(--text-primary)]"
              aria-label="Toggle color theme"
              @click="toggleQuickTheme"
            >
              <Sun v-if="themePreference === 'light'" :size="15" aria-hidden="true" />
              <Moon v-else-if="themePreference === 'dark'" :size="15" aria-hidden="true" />
              <Monitor v-else :size="15" aria-hidden="true" />
            </button>
          </div>
        </header>
      </div>

      <!-- Focused Sign-In Card -->
      <main class="relative mx-auto my-5 w-full max-w-[440px]">
        <div
          class="tipid-card tipid-auth-card rounded-3xl p-5 sm:p-8"
          :data-auth-enter="entryDir"
        >
          <!-- Pill Mode Switcher (Matches Tipid Analytics/Bills Switcher) -->
          <div class="mb-6 grid grid-cols-2 gap-1 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-inset)] p-1 text-xs font-semibold">
            <span
              aria-current="page"
              class="flex min-h-[38px] items-center justify-center rounded-full bg-[var(--hero-card-start)] text-white shadow-xs"
            >
              {{ isTl ? "Mag-log in" : "Sign in" }}
            </span>
            <a
              href="signup.html"
              class="flex min-h-[38px] items-center justify-center rounded-full text-[var(--text-secondary)] no-underline transition-colors hover:text-[var(--text-primary)]"
              @click="navigateAuth($event, 'signup.html', 'forward')"
            >
              {{ isTl ? "Gumawa ng Account" : "Create account" }}
            </a>
          </div>

          <h1 id="login-heading" class="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            {{ isTl ? "Mag-sign in sa Tipid" : "Welcome back" }}
          </h1>
          <p class="mt-1 text-sm text-[var(--text-secondary)]">
            {{ isTl ? "Buksan ang iyong personal na talaan ng gastos at wallets." : "Sign in to open your Tipid workspace." }}
          </p>

          <div
            v-if="errorMsg"
            role="alert"
            aria-live="assertive"
            class="mt-4 flex items-start gap-2 rounded-2xl bg-[var(--expense-soft)] px-3.5 py-2.5 text-xs font-medium text-[var(--expense)]"
          >
            <AlertCircle :size="15" class="mt-0.5 shrink-0" aria-hidden="true" />
            <span>{{ errorMsg }}</span>
          </div>

          <div
            v-if="resetNotice"
            role="status"
            aria-live="polite"
            class="mt-4 rounded-2xl bg-[var(--accent-soft)] px-3.5 py-2.5 text-xs font-medium text-[var(--accent)]"
          >
            {{ resetNotice }}
          </div>

          <form class="mt-5 space-y-4" aria-labelledby="login-heading" @submit.prevent="handleSubmit">
            <div>
              <label for="login-email" class="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">
                {{ isTl ? "Email address" : "Email address" }}
                <span class="text-[var(--expense)]" aria-hidden="true">*</span>
              </label>
              <div class="relative">
                <Mail :size="15" class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" aria-hidden="true" />
                <input
                  id="login-email"
                  ref="emailRef"
                  v-model="email"
                  name="email"
                  type="email"
                  autocomplete="username"
                  autocorrect="off"
                  autocapitalize="none"
                  spellcheck="false"
                  enterkeyhint="next"
                  required
                  placeholder="name@example.com"
                  class="tipid-input rounded-2xl border-[var(--border-subtle)] bg-[var(--bg-inset)]/60 pl-10 text-sm focus:bg-[var(--bg-surface)]"
                  @input="errorMsg = ''"
                />
              </div>
            </div>

            <div>
              <div class="mb-1.5 flex items-center justify-between gap-2">
                <label for="login-password" class="block text-xs font-semibold text-[var(--text-secondary)]">
                  {{ isTl ? "Password" : "Password" }}
                  <span class="text-[var(--expense)]" aria-hidden="true">*</span>
                </label>
                <button
                  type="button"
                  :aria-expanded="forgotOpen"
                  aria-controls="forgot-password-panel"
                  class="tipid-compact text-xs font-semibold text-[var(--accent)] hover:underline"
                  @click="toggleForgot"
                >
                  {{ isTl ? "Nakalimutan ang password?" : "Forgot password?" }}
                </button>
              </div>
              <div class="relative">
                <Lock :size="15" class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" aria-hidden="true" />
                <input
                  id="login-password"
                  ref="passwordRef"
                  v-model="password"
                  name="password"
                  :type="showPw ? 'text' : 'password'"
                  autocomplete="current-password"
                  enterkeyhint="done"
                  required
                  placeholder="Enter your password"
                  class="tipid-input rounded-2xl border-[var(--border-subtle)] bg-[var(--bg-inset)]/60 pl-10 pr-11 text-sm focus:bg-[var(--bg-surface)]"
                  @input="errorMsg = ''"
                />
                <button
                  type="button"
                  class="tipid-compact absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-xl text-[var(--text-muted)] hover:bg-[var(--bg-inset)] hover:text-[var(--text-primary)]"
                  :aria-pressed="showPw"
                  :aria-label="showPw ? 'Hide password' : 'Show password'"
                  aria-describedby="login-pw-toggle-warn"
                  @click="showPw = !showPw"
                >
                  <EyeOff v-if="showPw" :size="16" aria-hidden="true" />
                  <Eye v-else :size="16" aria-hidden="true" />
                </button>
                <span id="login-pw-toggle-warn" class="visually-hidden">
                  Warning: toggling this reveals your password text on screen.
                </span>
              </div>
            </div>

            <div v-if="forgotOpen" id="forgot-password-panel" class="tipid-auth-disclosure tipid-inset space-y-2.5 p-3.5">
              <label for="reset-email" class="block text-xs font-semibold text-[var(--text-secondary)]">
                {{ isTl ? "Email ng account para sa reset link" : "Account email for password reset link" }}
              </label>
              <input
                id="reset-email"
                v-model="resetEmail"
                type="email"
                autocomplete="username"
                autocorrect="off"
                autocapitalize="none"
                spellcheck="false"
                placeholder="name@example.com"
                class="tipid-input rounded-xl text-base sm:text-xs"
              />
              <button
                type="button"
                :disabled="resetLoading"
                class="w-full rounded-xl bg-[var(--hero-card-start)] px-3 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                @click="handleForgot"
              >
                {{ resetLoading ? (isTl ? "Ipinapadala..." : "Sending...") : (isTl ? "Magpadala ng reset email" : "Send reset email") }}
              </button>
            </div>

            <button
              type="submit"
              :disabled="loading"
              class="tipid-cta inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white hover:bg-[var(--accent-hover)]"
            >
              <Loader2 v-if="loading" :size="16" class="animate-spin" aria-hidden="true" />
              <span>{{ loading ? (isTl ? "Nagla-log in..." : "Signing in...") : (isTl ? "Mag-sign in" : "Sign in") }}</span>
            </button>
          </form>

          <div class="my-5 flex items-center gap-3">
            <div class="h-px flex-1 bg-[var(--border-subtle)]" />
            <span class="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              {{ isTl ? "o kaya" : "or" }}
            </span>
            <div class="h-px flex-1 bg-[var(--border-subtle)]" />
          </div>

          <button
            type="button"
            :disabled="loading"
            class="flex min-h-[48px] w-full items-center justify-center gap-2.5 rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-surface)] px-4 py-2.5 text-sm font-semibold text-[var(--text-primary)] shadow-xs transition-colors hover:bg-[var(--bg-inset)]"
            @click="handleGoogle"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>{{ isTl ? "Magpatuloy gamit ang Google" : "Continue with Google" }}</span>
          </button>

          <p class="mt-5 text-center text-xs text-[var(--text-secondary)]">
            {{ isTl ? "Wala pang account?" : "No account yet?" }}
            <a
              href="signup.html"
              class="font-semibold text-[var(--accent)] hover:underline"
              @click="navigateAuth($event, 'signup.html', 'forward')"
            >
              {{ isTl ? "Gumawa ng libreng account" : "Create an account" }}
            </a>
          </p>
        </div>
      </main>

      <footer class="relative mx-auto flex w-full max-w-[440px] items-center justify-between text-[11px] text-[var(--text-muted)]">
        <span>Tipid Expense Tracker</span>
        <span class="inline-flex items-center gap-1">
          <ShieldCheck :size="12" class="text-[var(--accent)]" aria-hidden="true" />
          {{ isTl ? "Private Firebase Auth" : "Encrypted session" }}
        </span>
      </footer>
    </div>
  </div>
</template>
