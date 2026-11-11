<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  Monitor,
  Moon,
  PieChart,
  ShieldCheck,
  Sun,
  User as UserIcon
} from "@lucide/vue";
import {
  authPersistenceReady,
  friendlyError,
  loginWithGoogle,
  onAuthChange,
  signUp
} from "@/lib/auth";
import { useTheme } from "@/composables/useTheme";
import { useAuthTransition } from "@/composables/useAuthTransition";
import { setLanguage, useI18n } from "@/lib/i18n";
import type { Unsubscribe } from "firebase/auth";

const { themePreference, toggleQuickTheme } = useTheme();
const { entryDir, leavingDir, transitionRoot, navigateAuth } = useAuthTransition();
const { isTl, lang } = useI18n();

const fullName = ref("");
const email = ref("");
const password = ref("");
const agreeTerms = ref(false);
const showPw = ref(false);
const loading = ref(false);
const errorMsg = ref("");

const nameRef = ref<HTMLInputElement | null>(null);
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

const strengthScore = computed(() => {
  const pw = password.value;
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 6) score += 1;
  if (pw.length >= 10) score += 1;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score += 1;
  if (/\d/.test(pw) || /[^A-Za-z0-9]/.test(pw)) score += 1;
  return score;
});

const strengthLabel = computed(() => {
  const s = strengthScore.value;
  if (!password.value) return "";
  if (isTl.value) {
    if (s <= 1) return "Mahina";
    if (s === 2) return "Katamtaman";
    if (s === 3) return "Matibay";
    return "Napakatibay";
  }
  if (s <= 1) return "Weak";
  if (s === 2) return "Fair";
  if (s === 3) return "Good";
  return "Strong";
});

async function handleSubmit() {
  errorMsg.value = "";
  if (!fullName.value.trim()) {
    errorMsg.value = isTl.value ? "Ilagay ang iyong pangalan." : "Please enter your name.";
    nameRef.value?.focus();
    return;
  }
  if (!email.value.trim()) {
    errorMsg.value = isTl.value ? "Ilagay ang iyong email address." : "Please enter your email address.";
    emailRef.value?.focus();
    return;
  }
  if (password.value.length < 6) {
    errorMsg.value = isTl.value ? "Dapat hindi bababa sa 6 karakter ang password." : "Password must be at least 6 characters long.";
    passwordRef.value?.focus();
    return;
  }
  if (!agreeTerms.value) {
    errorMsg.value = isTl.value
      ? "Pakikumpirma ang pag-save sa Firebase at offline cache."
      : "Please confirm that you agree to local/cloud storage terms.";
    return;
  }

  loading.value = true;
  try {
    await authPersistenceReady;
    await signUp(fullName.value.trim(), email.value, password.value);
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

const onboardingSteps = computed(() =>
  isTl.value
    ? [
        { num: "01", title: "Gumawa ng private ledger", desc: "Ligtas na account gamit ang email o Google sign-in." },
        { num: "02", title: "I-set ang mga wallet at limit", desc: "Piliin ang Cash, GCash, Maya, SeaBank, o bangko at monthly budget." },
        { num: "03", title: "Magtala kahit offline", desc: "Awtomatikong magsi-sync ang records kasama ang bills at utang." }
      ]
    : [
        { num: "01", title: "Create a private ledger", desc: "Sign up with email or Google with per-user Firestore isolation." },
        { num: "02", title: "Link 26 PH accounts & budget", desc: "Set Cash, GCash, Maya, digital bank balances, and monthly caps." },
        { num: "03", title: "Log offline, export anytime", desc: "Instant transaction tracking, CSV exports, and biometric app lock." }
      ]
);
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
          {{ isTl ? "Libreng Account" : "Free Account" }}
        </span>
      </div>

      <div class="max-w-md space-y-6">
        <div class="tipid-auth-step tipid-auth-step-1 space-y-2.5">
          <p class="tipid-eyebrow text-[#6EE7B7]">
            {{ isTl ? "Magsimula sa Wala Pang Isang Minuto" : "Start in under a minute" }}
          </p>
          <h2 class="text-3xl font-bold leading-tight tracking-tight text-white">
            {{ isTl ? "I-ayos ang badyet, mga wallet, at nakatakdang bills." : "Set up your wallets, budget cap, and bills cleanly." }}
          </h2>
        </div>

        <!-- Bento 3-Step Onboarding Preview -->
        <ol class="space-y-2.5">
          <li
            v-for="(step, idx) in onboardingSteps"
            :key="step.num"
            :class="[
              'tipid-auth-step flex items-start gap-3.5 rounded-2xl border border-white/15 bg-black/18 p-4 backdrop-blur-xs',
              idx === 0 ? 'tipid-auth-step-1' : idx === 1 ? 'tipid-auth-step-2' : 'tipid-auth-step-3'
            ]"
          >
            <span class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-[#6EE7B7]/20 font-mono text-xs font-bold text-[#6EE7B7]">
              {{ step.num }}
            </span>
            <div>
              <p class="text-sm font-semibold text-white">{{ step.title }}</p>
              <p class="mt-0.5 text-xs leading-relaxed text-white/75">{{ step.desc }}</p>
            </div>
          </li>
        </ol>

        <div class="flex flex-wrap gap-2 text-[11px] font-medium text-white/85">
          <span class="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1">
            <PieChart :size="13" class="text-[#6EE7B7]" aria-hidden="true" />
            Needs vs Wants Analytics
          </span>
          <span class="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1">
            <CheckCircle2 :size="13" class="text-[#6EE7B7]" aria-hidden="true" />
            OWASP CSV Export
          </span>
        </div>
      </div>

      <div class="flex items-center justify-between border-t border-white/12 pt-4 text-xs text-white/70">
        <span class="inline-flex items-center gap-1.5">
          <ShieldCheck :size="14" class="text-[#6EE7B7]" aria-hidden="true" />
          {{ isTl ? "Integer-Centavo Precision" : "Integer-centavo precision" }}
        </span>
        <span>v2.0 PWA</span>
      </div>
    </aside>

    <!-- Right Workspace Form Column -->
    <div class="tipid-atmosphere relative flex flex-col justify-between px-4 py-4 sm:px-8 sm:py-6 lg:col-span-7">
      <div class="tipid-grid-bg pointer-events-none absolute inset-0 opacity-40" aria-hidden="true" />

      <!-- Floating Top Navigation Pill -->
      <div class="tipid-auth-nav relative mx-auto w-full max-w-[440px]">
        <header class="tipid-floating-chrome flex items-center justify-between gap-2 rounded-2xl px-3 py-2">
          <a
            href="index.html"
            class="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-semibold text-[var(--text-secondary)] no-underline transition-colors hover:bg-[var(--bg-inset)] hover:text-[var(--text-primary)]"
            @click="navigateAuth($event, 'index.html', 'exit')"
          >
            <ArrowLeft :size="14" aria-hidden="true" />
            <span>{{ isTl ? "Home" : "Home" }}</span>
          </a>

          <a
            href="index.html"
            class="flex items-center gap-2 no-underline lg:hidden"
            @click="navigateAuth($event, 'index.html', 'exit')"
          >
            <img src="/assets/logo.svg" alt="" width="26" height="26" class="h-6.5 w-6.5 rounded-lg" />
            <span class="text-sm font-bold tracking-tight text-[var(--text-primary)]">Tipid</span>
          </a>

          <div class="flex items-center gap-1.5">
            <button
              type="button"
              class="tipid-compact inline-flex min-h-[32px] items-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 py-1 text-[11px] font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-inset)] hover:text-[var(--text-primary)]"
              @click="switchLanguage"
            >
              {{ isTl ? "EN" : "FIL" }}
            </button>
            <button
              type="button"
              class="tipid-compact inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--bg-inset)] hover:text-[var(--text-primary)]"
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

      <!-- Focused Sign-Up Card -->
      <main class="relative mx-auto my-5 w-full max-w-[440px]">
        <div
          class="tipid-card tipid-auth-card rounded-3xl p-5 sm:p-8"
          :data-auth-enter="entryDir"
        >
          <!-- Pill Mode Switcher -->
          <div class="mb-6 grid grid-cols-2 gap-1 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-inset)] p-1 text-xs font-semibold">
            <a
              href="login.html"
              class="flex min-h-[38px] items-center justify-center rounded-full text-[var(--text-secondary)] no-underline transition-colors hover:text-[var(--text-primary)]"
              @click="navigateAuth($event, 'login.html', 'back')"
            >
              {{ isTl ? "Mag-log in" : "Sign in" }}
            </a>
            <span
              aria-current="page"
              class="flex min-h-[38px] items-center justify-center rounded-full bg-[var(--hero-card-start)] text-white shadow-xs"
            >
              {{ isTl ? "Gumawa ng Account" : "Create account" }}
            </span>
          </div>

          <h1 id="signup-heading" class="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            {{ isTl ? "Gumawa ng account" : "Create your account" }}
          </h1>
          <p class="mt-1 text-sm text-[var(--text-secondary)]">
            {{ isTl ? "Simulang bantayan ang mga wallet, gastos, bills, at utang." : "Start tracking wallets, expenses, bills, and debts with clarity." }}
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

          <form class="mt-5 space-y-4" aria-labelledby="signup-heading" @submit.prevent="handleSubmit">
            <div>
              <label for="signup-name" class="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">
                {{ isTl ? "Buong pangalan" : "Full name" }}
                <span class="text-[var(--expense)]" aria-hidden="true">*</span>
              </label>
              <div class="relative">
                <UserIcon :size="15" class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" aria-hidden="true" />
                <input
                  id="signup-name"
                  ref="nameRef"
                  v-model="fullName"
                  name="fullname"
                  type="text"
                  autocomplete="name"
                  enterkeyhint="next"
                  maxlength="80"
                  required
                  placeholder="Alex Santos"
                  class="tipid-input rounded-2xl border-[var(--border-subtle)] bg-[var(--bg-inset)]/60 pl-10 text-sm focus:bg-[var(--bg-surface)]"
                  @input="errorMsg = ''"
                />
              </div>
            </div>

            <div>
              <label for="signup-email" class="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">
                {{ isTl ? "Email address" : "Email address" }}
                <span class="text-[var(--expense)]" aria-hidden="true">*</span>
              </label>
              <div class="relative">
                <Mail :size="15" class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" aria-hidden="true" />
                <input
                  id="signup-email"
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
              <label for="signup-password" class="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">
                {{ isTl ? "Password" : "Password" }}
                <span class="text-[var(--expense)]" aria-hidden="true">*</span>
              </label>
              <p id="signup-pw-hint" class="mb-1.5 text-[11px] text-[var(--text-muted)]">
                {{ isTl ? "Hindi bababa sa 6 karakter. Gumamit ng letra, numero, o simbolo." : "Minimum 6 characters. Mix letters, numbers, or symbols." }}
              </p>
              <div class="relative">
                <Lock :size="15" class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" aria-hidden="true" />
                <input
                  id="signup-password"
                  ref="passwordRef"
                  v-model="password"
                  name="new-password"
                  :type="showPw ? 'text' : 'password'"
                  autocomplete="new-password"
                  enterkeyhint="done"
                  minlength="6"
                  required
                  aria-describedby="signup-pw-hint signup-pw-toggle-warn"
                  placeholder="At least 6 characters"
                  class="tipid-input rounded-2xl border-[var(--border-subtle)] bg-[var(--bg-inset)]/60 pl-10 pr-11 text-sm focus:bg-[var(--bg-surface)]"
                  @input="errorMsg = ''"
                />
                <button
                  type="button"
                  class="tipid-compact absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-xl text-[var(--text-muted)] hover:bg-[var(--bg-inset)] hover:text-[var(--text-primary)]"
                  :aria-pressed="showPw"
                  :aria-label="showPw ? 'Hide password' : 'Show password'"
                  aria-describedby="signup-pw-toggle-warn"
                  @click="showPw = !showPw"
                >
                  <EyeOff v-if="showPw" :size="16" aria-hidden="true" />
                  <Eye v-else :size="16" aria-hidden="true" />
                </button>
                <span id="signup-pw-toggle-warn" class="visually-hidden">
                  Warning: toggling this reveals your password text on screen.
                </span>
              </div>

              <!-- Accessible Strength Indicator (Shape + Label, never color alone) -->
              <div class="mt-2 flex items-center gap-2">
                <div class="grid flex-1 grid-cols-4 gap-1.5" aria-hidden="true">
                  <div
                    v-for="idx in 4"
                    :key="idx"
                    :class="[
                      'h-1.5 rounded-full transition-colors',
                      idx <= strengthScore
                        ? strengthScore <= 1
                          ? 'bg-[var(--expense)]'
                          : strengthScore === 2
                            ? 'bg-[var(--warning)]'
                            : 'bg-[var(--accent)]'
                        : 'bg-[var(--bg-inset)]'
                    ]"
                  />
                </div>
                <span v-if="strengthLabel" class="min-w-[48px] text-right text-[11px] font-semibold text-[var(--text-secondary)]">
                  {{ strengthLabel }}
                </span>
              </div>
            </div>

            <label class="flex cursor-pointer items-center gap-2.5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-inset)]/45 p-3 text-xs text-[var(--text-secondary)]">
              <input
                v-model="agreeTerms"
                name="agree_terms"
                type="checkbox"
                required
                class="tipid-checkbox"
                @change="errorMsg = ''"
              />
              <span>
                {{
                  isTl
                    ? "Sumasang-ayon akong i-save ang aking talaan nang ligtas sa Firebase at device offline cache."
                    : "I agree to store my ledger securely in Firebase and my device cache for offline use."
                }}
              </span>
            </label>

            <button
              type="submit"
              :disabled="loading"
              class="tipid-cta inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white hover:bg-[var(--accent-hover)]"
            >
              <Loader2 v-if="loading" :size="16" class="animate-spin" aria-hidden="true" />
              <span>{{ loading ? (isTl ? "Ginagawa ang account..." : "Creating account...") : (isTl ? "Gumawa ng account" : "Create account") }}</span>
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
            {{ isTl ? "May account na?" : "Already have an account?" }}
            <a
              href="login.html"
              class="font-semibold text-[var(--accent)] hover:underline"
              @click="navigateAuth($event, 'login.html', 'back')"
            >
              {{ isTl ? "Mag-sign in" : "Sign in" }}
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
