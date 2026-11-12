<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from "vue";
import {
  AlertTriangle,
  Bell,
  CalendarClock,
  Camera,
  CheckCircle2,
  ChevronDown,
  Coins,
  Database,
  Download,
  Fingerprint,
  KeyRound,
  Lock,
  LogOut,
  Monitor,
  Moon,
  Pencil,
  RotateCcw,
  ShieldCheck,
  ShieldOff,
  SlidersHorizontal,
  Sun,
  Target,
  Trash2,
  User
} from "@lucide/vue";
import AppShell from "@/components/AppShell.vue";
import BaseDialog from "@/components/BaseDialog.vue";
import ConfirmDialog from "@/components/ConfirmDialog.vue";
import { useAuthGuard } from "@/composables/useAuthGuard";
import { useFinanceData } from "@/composables/useFinanceData";
import { useTheme } from "@/composables/useTheme";
import { pushToast } from "@/composables/useToast";
import { useI18n } from "@/lib/i18n";
import {
  buildTransactionsCsv,
  entryDate,
  cleanText,
  formatPeso,
  fromCentavos,
  manilaDateKey,
  money,
  parseDateKey,
  sanitizeAvatarUrl,
  storageKey,
  SUPPORTED_WALLETS,
  toCentavos
} from "@/lib/core";
import {
  deleteCurrentUser,
  friendlyError,
  logOut,
  resetPassword,
  updateUserProfile
} from "@/lib/auth";
import {
  saveFinancialGoals,
  saveLanguagePreference,
  saveNotificationSettings,
  setBudget
} from "@/lib/data";
import {
  disableBiometrics,
  hasPasscode,
  isBiometricEnabled,
  isPlatformBiometricsAvailable,
  registerBiometrics,
  setBiometricEnabled,
  setPasscode,
  verifyBiometrics,
  verifyPasscode
} from "@/lib/biometrics";
import { resolveWalletVisual } from "@/lib/walletVisuals";
import type { LanguageCode, ThemePreference } from "@/types/finance";

type ProfileTabId = "plan" | "prefs" | "security";

const { user, isOffline, isLocked, unlockSession, refreshUserSnapshot } = useAuthGuard();
const uidRef = computed(() => user.value?.uid);
const { entries, budget, wallets, goals, notificationSettings } = useFinanceData(uidRef);
const { themePreference, setThemePreference } = useTheme();
const { lang, t, isTl, setLanguage } = useI18n();

const activeTab = ref<ProfileTabId>("plan");
const tabDefs = computed(() => [
  { id: "plan" as const, label: isTl.value ? "Plano" : "Plan" },
  { id: "prefs" as const, label: isTl.value ? "Kagustuhan" : "Preferences" },
  { id: "security" as const, label: isTl.value ? "Seguridad" : "Security" }
]);

function selectTab(id: ProfileTabId) {
  activeTab.value = id;
}

onMounted(() => {
  const tabParam = new URLSearchParams(window.location.search).get("tab");
  if (tabParam === "plan" || tabParam === "prefs" || tabParam === "security") {
    activeTab.value = tabParam;
  }
});

function handleTabKeydown(event: KeyboardEvent, index: number) {
  const list = tabDefs.value;
  let nextIdx = index;
  if (event.key === "ArrowRight") nextIdx = (index + 1) % list.length;
  else if (event.key === "ArrowLeft") nextIdx = (index - 1 + list.length) % list.length;
  else if (event.key === "Home") nextIdx = 0;
  else if (event.key === "End") nextIdx = list.length - 1;
  else return;
  event.preventDefault();
  const nextTab = list[nextIdx];
  selectTab(nextTab.id);
  nextTick(() => document.getElementById(`profile-tab-${nextTab.id}`)?.focus());
}

function cycleThemePreference() {
  const order: ThemePreference[] = ["system", "light", "dark"];
  const idx = order.indexOf(themePreference.value);
  const next = order[(idx + 1) % order.length];
  setThemePreference(next);
  pushToast(
    isTl.value
      ? `Tema: ${next === "dark" ? "Madilim" : next === "light" ? "Maliwanag" : "Sistema"}`
      : `Theme switched to ${next}.`,
    "info"
  );
}

// Account form state
const editProfileOpen = ref(false);
const displayName = ref("");
const avatarPreview = ref("");
const savingAccount = ref(false);
const resettingPassword = ref(false);

// Budget & Goal state
const budgetInput = ref("");
const goalName = ref("");
const goalTarget = ref("");
const goalWallet = ref("Cash");
const goalContribution = ref("");
const goalFrequency = ref("monthly");
const goalStartDate = ref("");
const savingPlan = ref(false);

// Preferences state
const hideCentavos = ref(false);
const defaultWallet = ref("Cash");
const dailyReminders = ref(true);
const reminderTime = ref("20:00");
const overbudgetAlerts = ref(true);
const budgetThreshold = ref(80);
const savingPrefs = ref(false);

// Security / Lock state
const platformBioAvailable = ref(false);
const bioEnabled = ref(false);
const pinConfigured = ref(false);
const pinInput = ref("");
const pinSaving = ref(false);
const bioBusy = ref(false);
const testPinOpen = ref(false);
const testPinValue = ref("");
const testPinError = ref("");

// Data & Danger state
const clearPrefsOpen = ref(false);
const deleteAccountOpen = ref(false);
const deleteConfirmInput = ref("");
const deleteError = ref("");
const deletingAccount = ref(false);

const userInitial = computed(() => {
  const src = displayName.value || user.value?.email || "T";
  return src.charAt(0).toUpperCase();
});

const localAvatar = ref("");
const effectiveAvatar = computed(() => avatarPreview.value || localAvatar.value || user.value?.photoURL || "");

const linkedWalletSet = computed(() => new Set(wallets.value.map((w) => w.toLowerCase())));

const extraSupportedWallets = computed(() =>
  SUPPORTED_WALLETS.filter((w) => !linkedWalletSet.value.has(w.id.toLowerCase()))
);

const hasCustomGoalWallet = computed(() => {
  const gw = goalWallet.value.trim();
  if (!gw) return false;
  const gwLower = gw.toLowerCase();
  const inLinked = linkedWalletSet.value.has(gwLower);
  const inSupported = SUPPORTED_WALLETS.some((w) => w.id.toLowerCase() === gwLower);
  return !inLinked && !inSupported;
});

const defaultWalletOptions = computed(() => {
  const opts = wallets.value.map((w) => ({
    value: w,
    label: resolveWalletVisual(w).displayName
  }));
  const dw = defaultWallet.value.trim();
  if (dw && !opts.some((o) => o.value.toLowerCase() === dw.toLowerCase())) {
    opts.push({ value: dw, label: resolveWalletVisual(dw).displayName });
  }
  return opts;
});

const monthBudgetStats = computed(() => {
  const curYm = (manilaDateKey() || new Date().toISOString().slice(0, 10)).slice(0, 7);
  let spentCents = 0;
  for (const e of entries.value) {
    if (e.type !== "expense") continue;
    const d = entryDate(e);
    const dk = d ? manilaDateKey(d) : null;
    if (!dk || !dk.startsWith(curYm)) continue;
    try {
      spentCents += toCentavos(e.amount, { allowZero: true });
    } catch {
      continue;
    }
  }
  let capCents = 0;
  if (budget.value && budget.value > 0) {
    try {
      capCents = toCentavos(budget.value, { allowZero: true });
    } catch {
      capCents = 0;
    }
  }
  const pct = capCents > 0 ? Math.round((spentCents / capCents) * 100) : 0;
  return {
    spent: fromCentavos(spentCents),
    cap: fromCentavos(capCents),
    pct,
    barPct: Math.min(100, pct),
    hasCap: capCents > 0
  };
});

watch(
  () => user.value,
  async (u) => {
    if (!u) return;
    displayName.value = u.displayName || "";
    try {
      localAvatar.value = sanitizeAvatarUrl(localStorage.getItem(storageKey(u.uid, "avatar")) || "");
      hideCentavos.value = localStorage.getItem(storageKey(u.uid, "hide_centavos")) === "1";
      defaultWallet.value = localStorage.getItem(storageKey(u.uid, "default_wallet")) || "Cash";
    } catch {
      // ignore storage errors
    }
    bioEnabled.value = isBiometricEnabled(u.uid);
    pinConfigured.value = hasPasscode(u.uid);
    platformBioAvailable.value = await isPlatformBiometricsAvailable();
  },
  { immediate: true }
);

watch(
  () => budget.value,
  (val) => {
    if (val != null && val > 0 && !budgetInput.value) {
      budgetInput.value = String(val);
    }
  },
  { immediate: true }
);

watch(
  () => goals.value,
  (g) => {
    if (!g) return;
    if (g.name !== undefined) goalName.value = g.name || "";
    if (g.targetAmount !== undefined && g.targetAmount !== null) goalTarget.value = String(g.targetAmount);
    if (g.wallet) {
      const matched = SUPPORTED_WALLETS.find(
        (w) => w.id.toLowerCase() === g.wallet?.trim().toLowerCase() || w.name.toLowerCase() === g.wallet?.trim().toLowerCase()
      );
      goalWallet.value = matched?.id || g.wallet;
    }
    if (g.contribution !== undefined && g.contribution !== null) goalContribution.value = String(g.contribution);
    if (g.frequency) goalFrequency.value = g.frequency;
    if (g.startDate) goalStartDate.value = g.startDate;
  },
  { immediate: true }
);

watch(
  () => notificationSettings.value,
  (n) => {
    if (!n) return;
    if (typeof n.dailyReminders === "boolean") dailyReminders.value = n.dailyReminders;
    if (typeof n.reminderTime === "string" && n.reminderTime) reminderTime.value = n.reminderTime;
    if (typeof n.overbudgetAlerts === "boolean") overbudgetAlerts.value = n.overbudgetAlerts;
    if (typeof n.budgetThreshold === "number") budgetThreshold.value = n.budgetThreshold;
  },
  { immediate: true }
);

const goalProjection = computed(() => {
  const target = Number(goalTarget.value);
  const contrib = Number(goalContribution.value);
  if (!Number.isFinite(target) || target <= 0 || !Number.isFinite(contrib) || contrib <= 0) {
    return null;
  }
  const periods = Math.ceil(target / contrib);
  const start = goalStartDate.value || manilaDateKey() || new Date().toISOString().slice(0, 10);
  const parsed = parseDateKey(start);
  if (!parsed) return null;

  let targetDate: Date;
  if (goalFrequency.value === "monthly") {
    const totalMonths = parsed.year * 12 + (parsed.month - 1) + periods;
    const targetYear = Math.floor(totalMonths / 12);
    const targetMonth = (totalMonths % 12) + 1;
    const maxDay = new Date(Date.UTC(targetYear, targetMonth, 0)).getUTCDate();
    const clampedDay = Math.min(parsed.day, maxDay);
    targetDate = new Date(Date.UTC(targetYear, targetMonth - 1, clampedDay));
  } else {
    const stepDays = goalFrequency.value === "weekly" ? 7 : 15;
    targetDate = new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day + periods * stepDays));
  }

  return {
    periods,
    targetDateLabel: targetDate.toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC"
    })
  };
});

function handleAvatarSelect(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    pushToast(isTl.value ? "Pumili ng valid na larawan." : "Please select a valid image file.", "error");
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    pushToast(isTl.value ? "Mas maliit sa 5MB ang dapat piliin." : "Choose an image smaller than 5MB.", "error");
    return;
  }

  const reader = new FileReader();
  reader.onload = (loadEv) => {
    const result = typeof loadEv.target?.result === "string" ? loadEv.target.result : "";
    if (!result) return;
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const size = 128;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const minDim = Math.min(img.width, img.height);
      const sx = (img.width - minDim) / 2;
      const sy = (img.height - minDim) / 2;
      ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
      avatarPreview.value = canvas.toDataURL("image/jpeg", 0.72);
      if (!editProfileOpen.value) {
        editProfileOpen.value = true;
      }
    };
    img.src = result;
  };
  reader.readAsDataURL(file);
}

async function handleSaveAccount() {
  const uid = user.value?.uid;
  if (!uid) return;
  let cleanName = "";
  try {
    cleanName = cleanText(displayName.value, "Display name", 80);
  } catch {
    pushToast(isTl.value ? "Ilagay ang wastong pangalan (1–80 letra)." : "Display name must be 1–80 characters.", "error");
    return;
  }

  savingAccount.value = true;
  try {
    const safeAvatar = avatarPreview.value ? sanitizeAvatarUrl(avatarPreview.value) : "";
    const updates: { displayName?: string; photoURL?: string } = { displayName: cleanName };
    if (safeAvatar) {
      if (safeAvatar.length <= 1800) {
        updates.photoURL = safeAvatar;
      }
      try {
        localStorage.setItem(storageKey(uid, "avatar"), safeAvatar);
        localAvatar.value = safeAvatar;
      } catch {
        // ignore storage quota errors
      }
    }
    await updateUserProfile(updates);
    refreshUserSnapshot();
    avatarPreview.value = "";
    editProfileOpen.value = false;
    pushToast(isTl.value ? "Na-update ang profile." : "Profile updated.", "success");
  } catch (err) {
    pushToast(friendlyError(err), "error");
  } finally {
    savingAccount.value = false;
  }
}

async function handlePasswordReset() {
  const email = user.value?.email;
  if (!email) return;
  resettingPassword.value = true;
  try {
    await resetPassword(email);
    pushToast(
      isTl.value
        ? "Naipadala ang password reset kung rehistrado ang email."
        : "If eligible, a password reset link has been sent to your email.",
      "info"
    );
  } catch (err) {
    pushToast(friendlyError(err), "error");
  } finally {
    resettingPassword.value = false;
  }
}

async function handleSavePlan() {
  const uid = user.value?.uid;
  if (!uid) return;

  let parsedBudget: number | null = null;
  if (budgetInput.value.trim() !== "") {
    try {
      parsedBudget = money(budgetInput.value, { allowZero: true });
    } catch {
      pushToast(isTl.value ? "Hindi wastong buwanang badyet." : "Invalid monthly budget amount.", "error");
      return;
    }
  }

  let parsedTarget: number | null = null;
  if (goalTarget.value.trim() !== "") {
    try {
      parsedTarget = money(goalTarget.value);
    } catch {
      pushToast(isTl.value ? "Hindi wastong halaga ng target." : "Target amount must be greater than ₱0.", "error");
      return;
    }
  }

  let parsedContrib: number | null = null;
  if (goalContribution.value.trim() !== "") {
    try {
      parsedContrib = money(goalContribution.value);
    } catch {
      pushToast(isTl.value ? "Hindi wastong halaga ng hulog." : "Contribution must be greater than ₱0.", "error");
      return;
    }
  }

  savingPlan.value = true;
  try {
    if (parsedBudget !== null) {
      await setBudget(uid, parsedBudget);
    }
    await saveFinancialGoals(uid, {
      name: goalName.value.trim(),
      targetAmount: parsedTarget,
      wallet: goalWallet.value || "Cash",
      contribution: parsedContrib,
      frequency: goalFrequency.value,
      startDate: goalStartDate.value || null
    });
    pushToast(isTl.value ? "Nai-save ang badyet at target." : "Budget and financial goal saved.", "success");
  } catch (err) {
    pushToast(err instanceof Error ? err.message : "Failed to save financial plan.", "error");
  } finally {
    savingPlan.value = false;
  }
}

async function handleSavePin() {
  const uid = user.value?.uid;
  if (!uid) return;
  const cleanPin = pinInput.value.trim();
  if (!/^\d{4,8}$/.test(cleanPin)) {
    pushToast(isTl.value ? "Gumamit ng 4 hanggang 8 na numero." : "Enter a 4 to 8 digit PIN.", "error");
    return;
  }
  pinSaving.value = true;
  try {
    const ok = await setPasscode(uid, cleanPin);
    if (!ok) throw new Error("Storage unavailable");
    setBiometricEnabled(uid, true);
    bioEnabled.value = true;
    pinConfigured.value = true;
    pinInput.value = "";
    pushToast(isTl.value ? "Naitakda ang PIN app lock." : "PIN passcode enabled.", "success");
  } catch {
    pushToast(isTl.value ? "Hindi naisave ang PIN." : "Could not save PIN passcode.", "error");
  } finally {
    pinSaving.value = false;
  }
}

async function handleEnableBiometrics() {
  const uid = user.value?.uid;
  if (!uid) return;
  bioBusy.value = true;
  try {
    const ok = await registerBiometrics(uid, user.value?.email || "user@tipid.app");
    if (ok) {
      bioEnabled.value = true;
      pushToast(isTl.value ? "Na-enable ang biometric unlock." : "Biometric lock enabled.", "success");
    }
  } catch (err) {
    pushToast(err instanceof Error ? err.message : "Biometrics registration canceled or unavailable.", "error");
  } finally {
    bioBusy.value = false;
  }
}

async function handleTestLock() {
  const uid = user.value?.uid;
  if (!uid) return;
  bioBusy.value = true;
  try {
    const res = await verifyBiometrics(uid);
    if (res === true) {
      pushToast(isTl.value ? "Napatunayan ang biometric lock." : "Biometric check succeeded.", "success");
    } else if (res === "prompt_pin") {
      testPinValue.value = "";
      testPinError.value = "";
      testPinOpen.value = true;
    } else {
      pushToast(isTl.value ? "Walang naka-setup na biometric o PIN." : "Verification did not succeed.", "error");
    }
  } catch {
    if (hasPasscode(uid)) {
      testPinValue.value = "";
      testPinError.value = "";
      testPinOpen.value = true;
    } else {
      pushToast(isTl.value ? "Kanselado o bigo ang pagsubok." : "Biometric check canceled.", "info");
    }
  } finally {
    bioBusy.value = false;
  }
}

async function submitTestPin() {
  const uid = user.value?.uid;
  if (!uid) return;
  try {
    const ok = await verifyPasscode(uid, testPinValue.value);
    if (ok) {
      testPinOpen.value = false;
      pushToast(isTl.value ? "Tama ang PIN!" : "PIN verified successfully.", "success");
    } else {
      testPinError.value = isTl.value ? "Maling PIN." : "Incorrect PIN.";
    }
  } catch (err) {
    testPinError.value = friendlyError(err);
  }
}

function handleDisableLock() {
  const uid = user.value?.uid;
  if (!uid) return;
  disableBiometrics(uid);
  bioEnabled.value = false;
  pinConfigured.value = false;
  pushToast(isTl.value ? "Tinanggal ang app lock." : "App lock disabled.", "info");
}

function handleToggleCentavos(checked: boolean) {
  const uid = user.value?.uid;
  hideCentavos.value = checked;
  if (uid) {
    try {
      localStorage.setItem(storageKey(uid, "hide_centavos"), checked ? "1" : "0");
    } catch {
      // ignore
    }
  }
}

function handleChangeDefaultWallet(val: string) {
  const uid = user.value?.uid;
  defaultWallet.value = val;
  if (uid) {
    try {
      localStorage.setItem(storageKey(uid, "default_wallet"), val);
    } catch {
      // ignore
    }
  }
}

async function handleSelectLanguage(next: LanguageCode) {
  const uid = user.value?.uid;
  setLanguage(next, uid);
  if (uid) {
    try {
      await saveLanguagePreference(uid, next);
    } catch {
      // local preference already applied
    }
  }
}

async function handleSaveNotifications() {
  const uid = user.value?.uid;
  if (!uid) return;
  savingPrefs.value = true;
  try {
    await saveNotificationSettings(uid, {
      dailyReminders: dailyReminders.value,
      reminderTime: reminderTime.value || "20:00",
      overbudgetAlerts: overbudgetAlerts.value,
      budgetThreshold: Math.min(Math.max(Number(budgetThreshold.value) || 80, 50), 100)
    });
    pushToast(isTl.value ? "Nai-save ang mga paalala." : "Notification preferences saved.", "success");
  } catch {
    pushToast(isTl.value ? "Hindi naisave ang mga setting." : "Could not save preferences.", "error");
  } finally {
    savingPrefs.value = false;
  }
}

function handleExportCsv() {
  if (entries.value.length === 0) {
    pushToast(isTl.value ? "Walang talaan para i-export." : "No transactions to export.", "info");
    return;
  }
  const csv = buildTransactionsCsv(entries.value);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `tipid-ledger-${manilaDateKey() || "export"}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function handleClearLocalPrefs() {
  const uid = user.value?.uid;
  if (uid) {
    const keys = ["default_wallet", "hide_centavos", "lang", "avatar"];
    for (const k of keys) {
      try {
        localStorage.removeItem(storageKey(uid, k));
      } catch {
        // ignore
      }
    }
  }
  hideCentavos.value = false;
  defaultWallet.value = "Cash";
  localAvatar.value = "";
  setLanguage("en", uid);
  setThemePreference("system");
  clearPrefsOpen.value = false;
  pushToast(isTl.value ? "Na-reset ang local preferences." : "Local preferences reset.", "info");
}

async function handleSignOut() {
  await logOut();
  window.location.href = "login.html";
}

async function handleDeleteAccount() {
  if (deleteConfirmInput.value.trim().toUpperCase() !== "DELETE") {
    deleteError.value = 'Type "DELETE" to confirm permanent removal.';
    return;
  }
  deletingAccount.value = true;
  deleteError.value = "";
  try {
    await deleteCurrentUser();
    window.location.replace("login.html");
  } catch (err: unknown) {
    const code = typeof err === "object" && err !== null && "code" in err ? String((err as { code?: unknown }).code) : "";
    if (code === "auth/requires-recent-login") {
      deleteError.value = isTl.value
        ? "Para sa seguridad, mag-sign out at mag-sign in muli bago burahin ang account."
        : "For your security, please sign out and sign in again before deleting your account.";
    } else {
      deleteError.value = friendlyError(err);
    }
  } finally {
    deletingAccount.value = false;
  }
}
</script>

<template>
  <AppShell active-tab="profile" :user="user" :is-offline="isOffline" :is-locked="isLocked" @unlocked="unlockSession">
    <div v-if="user" class="mx-auto max-w-5xl space-y-5">
      <!-- Compact Page Header -->
      <header class="flex items-center justify-between gap-3">
        <div class="min-w-0">
          <h1 class="truncate text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
            {{ t.profileTitle }}
          </h1>
          <p class="mt-0.5 hidden text-xs text-[var(--text-secondary)] sm:block">
            {{ t.profileSubtitle }}
          </p>
        </div>

        <button
          type="button"
          :class="[
            'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
            bioEnabled || pinConfigured
              ? 'border-[var(--income)]/30 bg-[var(--income-soft)] text-[var(--income)]'
              : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          ]"
          @click="selectTab('security')"
        >
          <Lock v-if="bioEnabled || pinConfigured" :size="12" aria-hidden="true" />
          <ShieldOff v-else :size="12" aria-hidden="true" />
          <span>{{ bioEnabled || pinConfigured ? (isTl ? "Naka-Lock" : "Lock Active") : (isTl ? "Standard" : "Standard Access") }}</span>
        </button>
      </header>

      <!-- Hidden File Input Shared by Hero Avatar Camera Badge & Edit Profile Modal -->
      <input id="avatar-upload" type="file" accept="image/*" class="visually-hidden" @change="handleAvatarSelect" />

      <!-- Top Bento Profile Dashboard (Identity Anchor Card + Live Financial Snapshot + Quick Tiles) -->
      <div class="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <!-- Left (5 cols): Compact Emerald Identity Statement Card -->
        <section aria-label="Account identity" class="tipid-card-emerald flex flex-col justify-between p-5 lg:col-span-5">
          <div>
            <div class="flex items-start gap-3.5">
              <div class="relative shrink-0">
                <div class="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-white/25 bg-white/14 text-xl font-bold text-white shadow-xs">
                  <img v-if="effectiveAvatar" :src="effectiveAvatar" alt="" class="h-full w-full object-cover" />
                  <span v-else>{{ userInitial }}</span>
                </div>
                <label
                  for="avatar-upload"
                  class="absolute -bottom-1 -right-1 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-white/30 bg-[#0B3A2B] text-white shadow-sm transition-transform hover:scale-105"
                  :aria-label="isTl ? 'Palitan ang larawan ng profile' : 'Upload profile photo'"
                >
                  <Camera :size="13" aria-hidden="true" />
                </label>
              </div>

              <div class="min-w-0 flex-1">
                <span class="tipid-eyebrow text-white/75">
                  {{ isTl ? "BERIPIKADONG ACCOUNT" : "VERIFIED LEDGER MEMBER" }}
                </span>
                <h2 class="mt-0.5 truncate text-lg font-bold text-white sm:text-xl">
                  {{ displayName || user?.email?.split("@")[0] || "Tipid Member" }}
                </h2>
                <p class="truncate text-xs text-white/80">
                  {{ user?.email || "—" }}
                </p>
              </div>
            </div>

            <div class="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                class="inline-flex items-center gap-1.5 rounded-xl border border-white/25 bg-white/15 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-xs transition-colors hover:bg-white/25"
                @click="editProfileOpen = true"
              >
                <Pencil :size="12" aria-hidden="true" />
                <span>{{ isTl ? "I-edit ang Profile" : "Edit Profile" }}</span>
              </button>

              <button
                type="button"
                class="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-black/18 px-3 py-1.5 text-xs font-semibold text-white/95 transition-colors hover:bg-black/28"
                :disabled="resettingPassword || !user?.email"
                @click="handlePasswordReset"
              >
                <KeyRound :size="12" aria-hidden="true" />
                <span>{{ resettingPassword ? "..." : (isTl ? "Reset Password" : "Reset Password") }}</span>
              </button>
            </div>
          </div>

          <div class="mt-5 grid grid-cols-3 gap-2 border-t border-white/14 pt-3.5 text-center">
            <div class="rounded-xl bg-white/10 px-2 py-2">
              <p class="font-mono text-sm font-bold text-white">{{ wallets.length }}</p>
              <p class="text-[10px] font-medium text-white/75">{{ isTl ? "Wallets" : "Wallets" }}</p>
            </div>
            <div class="rounded-xl bg-white/10 px-2 py-2">
              <p class="font-mono text-sm font-bold text-white">{{ entries.length }}</p>
              <p class="text-[10px] font-medium text-white/75">{{ isTl ? "Mga Tala" : "Entries" }}</p>
            </div>
            <div class="rounded-xl bg-white/10 px-2 py-2">
              <p class="font-mono text-sm font-bold text-white">{{ lang === "tl" ? "FIL" : "EN" }}</p>
              <p class="text-[10px] font-medium text-white/75">{{ isTl ? "Wika" : "Language" }}</p>
            </div>
          </div>
        </section>

        <!-- Right (7 cols): Budget & Goal Snapshot + 4 Quick Action Tiles -->
        <div class="flex flex-col justify-between gap-4 lg:col-span-7">
          <section aria-label="Budget and goal summary" class="tipid-card p-5">
            <div class="mb-3 flex items-center justify-between gap-2">
              <div class="flex items-center gap-2">
                <div class="tipid-icon-badge h-8 w-8 bg-[var(--income-soft)] text-[var(--income)]">
                  <Target :size="16" aria-hidden="true" />
                </div>
                <h2 class="text-sm font-bold text-[var(--text-primary)]">
                  {{ isTl ? "Katayuan ng Badyet at Target" : "Financial Plan Snapshot" }}
                </h2>
              </div>

              <button
                type="button"
                class="text-xs font-semibold text-[var(--accent)] hover:underline"
                @click="selectTab('plan')"
              >
                {{ isTl ? "Baguhin" : "Adjust Plan" }}
              </button>
            </div>

            <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <!-- Monthly Budget Status Tile -->
              <div class="tipid-inset space-y-2 p-3.5">
                <div class="flex items-center justify-between gap-2 text-xs">
                  <span class="font-semibold text-[var(--text-secondary)]">
                    {{ t.monthlyBudget }}
                  </span>
                  <span
                    v-if="monthBudgetStats.hasCap"
                    :class="[
                      'font-mono text-[11px] font-bold',
                      monthBudgetStats.pct > 100
                        ? 'text-[var(--expense)]'
                        : monthBudgetStats.pct >= 80
                          ? 'text-[var(--warning)]'
                          : 'text-[var(--income)]'
                    ]"
                  >
                    {{ monthBudgetStats.pct }}%
                  </span>
                </div>

                <p class="tipid-amount font-mono text-base font-bold text-[var(--text-primary)]">
                  <template v-if="monthBudgetStats.hasCap">
                    ₱{{ formatPeso(monthBudgetStats.spent) }}
                    <span class="text-xs font-normal text-[var(--text-muted)]">/ ₱{{ formatPeso(monthBudgetStats.cap) }}</span>
                  </template>
                  <template v-else>
                    {{ isTl ? "Walang nakatakda" : "No cap set" }}
                  </template>
                </p>

                <progress
                  class="tipid-progress h-2 w-full"
                  :value="monthBudgetStats.barPct"
                  max="100"
                  :style="{
                    '--progress-bar-fill':
                      monthBudgetStats.pct > 100
                        ? 'var(--expense)'
                        : monthBudgetStats.pct >= 80
                          ? 'var(--warning)'
                          : 'var(--accent)'
                  }"
                  :aria-label="`Monthly budget used: ${monthBudgetStats.pct}%`"
                />
              </div>

              <!-- Savings Goal Snapshot Tile -->
              <div class="tipid-inset flex flex-col justify-between p-3.5">
                <div>
                  <div class="flex items-center justify-between gap-2 text-xs">
                    <span class="truncate font-semibold text-[var(--text-secondary)]">
                      {{ goalName || (isTl ? "Target na Ipon" : "Savings Goal") }}
                    </span>
                    <span
                      v-if="goalProjection"
                      class="shrink-0 rounded-full bg-[var(--bg-surface)] px-2 py-0.5 font-mono text-[10px] font-semibold text-[var(--accent)]"
                    >
                      {{ goalProjection.periods }} {{ isTl ? "hulog" : "deposits" }}
                    </span>
                  </div>
                  <p class="tipid-amount mt-1 font-mono text-base font-bold text-[var(--text-primary)]">
                    <template v-if="goalTarget && Number(goalTarget) > 0">
                      ₱{{ formatPeso(Number(goalTarget)) }}
                    </template>
                    <template v-else>
                      {{ isTl ? "Walang target" : "Not configured" }}
                    </template>
                  </p>
                </div>

                <p class="mt-2 flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
                  <CalendarClock :size="12" class="shrink-0 text-[var(--accent)]" aria-hidden="true" />
                  <span class="truncate">
                    <template v-if="goalProjection">
                      {{ isTl ? "Target:" : "Projected:" }} <strong class="text-[var(--text-primary)]">{{ goalProjection.targetDateLabel }}</strong>
                    </template>
                    <template v-else>
                      {{ isTl ? "Magtakda sa tab sa ibaba" : "Configure contribution below" }}
                    </template>
                  </span>
                </p>
              </div>
            </div>
          </section>

          <!-- 4 Quick Action Tiles -->
          <section aria-label="Quick profile shortcuts" class="grid grid-cols-2 gap-2.5 min-[375px]:grid-cols-4">
            <button
              type="button"
              class="tipid-card-interactive flex flex-col items-center justify-center gap-1.5 px-2 py-3 text-center"
              @click="editProfileOpen = true"
            >
              <span class="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]" aria-hidden="true">
                <User :size="16" />
              </span>
              <span class="text-[11px] font-semibold text-[var(--text-primary)]">{{ isTl ? "Profile" : "Profile" }}</span>
            </button>

            <button
              type="button"
              class="tipid-card-interactive flex flex-col items-center justify-center gap-1.5 px-2 py-3 text-center"
              @click="cycleThemePreference"
            >
              <span class="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--warning-soft)] text-[var(--warning)]" aria-hidden="true">
                <Sun v-if="themePreference === 'light'" :size="16" />
                <Moon v-else-if="themePreference === 'dark'" :size="16" />
                <Monitor v-else :size="16" />
              </span>
              <span class="text-[11px] font-semibold capitalize text-[var(--text-primary)]">{{ themePreference }}</span>
            </button>

            <button
              type="button"
              class="tipid-card-interactive relative flex flex-col items-center justify-center gap-1.5 px-2 py-3 text-center"
              @click="selectTab('security')"
            >
              <span class="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--income-soft)] text-[var(--income)]" aria-hidden="true">
                <Lock :size="16" />
              </span>
              <span class="text-[11px] font-semibold text-[var(--text-primary)]">{{ isTl ? "Seguridad" : "Security" }}</span>
              <span
                v-if="bioEnabled || pinConfigured"
                class="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-[var(--income)]"
                aria-hidden="true"
              />
            </button>

            <button
              type="button"
              class="tipid-card-interactive flex flex-col items-center justify-center gap-1.5 px-2 py-3 text-center"
              @click="handleExportCsv"
            >
              <span class="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--bg-inset)] text-[var(--text-secondary)]" aria-hidden="true">
                <Download :size="16" />
              </span>
              <span class="text-[11px] font-semibold text-[var(--text-primary)]">CSV ({{ entries.length }})</span>
            </button>
          </section>
        </div>
      </div>

      <!-- Accessible 3-Tab Settings Switcher (Plan & Goal | Preferences | Security & Data) -->
      <div
        role="tablist"
        :aria-label="isTl ? 'Mga kategorya ng settings' : 'Profile settings sections'"
        class="tipid-tablist w-full sm:max-w-lg"
      >
        <button
          v-for="(tab, idx) in tabDefs"
          :id="`profile-tab-${tab.id}`"
          :key="tab.id"
          type="button"
          role="tab"
          class="tipid-tab"
          :aria-selected="activeTab === tab.id"
          :tabindex="activeTab === tab.id ? 0 : -1"
          @click="selectTab(tab.id)"
          @keydown="handleTabKeydown($event, idx)"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Stacked Single-Cell Grid for Tab Panels (Zero Gap When Hidden with until-found) -->
      <div class="grid grid-cols-1">
        <!-- TAB 1: PLAN & GOAL -->
        <section
          id="profile-panel-plan"
          role="tabpanel"
          aria-labelledby="profile-tab-plan"
          class="col-start-1 row-start-1"
          :tabindex="activeTab === 'plan' ? 0 : undefined"
          :hidden="activeTab !== 'plan' ? 'until-found' : undefined"
          @beforematch="selectTab('plan')"
        >
          <div class="tipid-card space-y-5 p-5 sm:p-6">
            <div class="flex items-start gap-3">
              <div class="tipid-icon-badge mt-0.5 h-9 w-9 bg-[var(--income-soft)] text-[var(--income)]">
                <Target :size="17" aria-hidden="true" />
              </div>
              <div>
                <h2 class="text-base font-bold text-[var(--text-primary)]">
                  {{ isTl ? "Buwanang Badyet at Target na Ipon" : "Monthly Budget & Savings Goal" }}
                </h2>
                <p class="mt-0.5 text-xs text-[var(--text-secondary)]">
                  {{ isTl ? "Limit sa gastos at target na ipon." : "Monthly spending cap and savings target." }}
                </p>
              </div>
            </div>

            <form class="space-y-4" @submit.prevent="handleSavePlan">
              <div class="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                <div>
                  <label for="plan-budget" class="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">
                    {{ t.monthlyBudget }} (PHP)
                  </label>
                  <div class="relative">
                    <span class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-mono font-semibold text-[var(--text-muted)]">₱</span>
                    <input
                      id="plan-budget"
                      v-model="budgetInput"
                      name="monthlyBudget"
                      type="number"
                      inputmode="decimal"
                      step="0.01"
                      min="0"
                      class="tipid-input pl-8 font-mono font-semibold tabular-nums"
                      placeholder="15000"
                    />
                  </div>
                </div>

                <div>
                  <label for="plan-goal-name" class="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">
                    {{ isTl ? "Pangalan ng Target" : "Savings Goal Name" }}
                  </label>
                  <input
                    id="plan-goal-name"
                    v-model="goalName"
                    name="goalName"
                    type="text"
                    maxlength="100"
                    class="tipid-input"
                    :placeholder="isTl ? 'hal. Emergency Fund' : 'e.g. Emergency Fund'"
                  />
                </div>
              </div>

              <div class="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
                <div>
                  <label for="plan-target" class="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">
                    {{ isTl ? "Target na Halaga (PHP)" : "Target Amount (PHP)" }}
                  </label>
                  <div class="relative">
                    <span class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-mono font-semibold text-[var(--text-muted)]">₱</span>
                    <input
                      id="plan-target"
                      v-model="goalTarget"
                      name="goalTarget"
                      type="number"
                      inputmode="decimal"
                      step="0.01"
                      min="0.01"
                      class="tipid-input pl-8 font-mono font-semibold tabular-nums"
                      placeholder="50000"
                    />
                  </div>
                </div>

                <div>
                  <label for="plan-contrib" class="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">
                    {{ isTl ? "Hulog Bawat Siklo (PHP)" : "Contribution (PHP)" }}
                  </label>
                  <div class="relative">
                    <span class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-mono font-semibold text-[var(--text-muted)]">₱</span>
                    <input
                      id="plan-contrib"
                      v-model="goalContribution"
                      name="goalContribution"
                      type="number"
                      inputmode="decimal"
                      step="0.01"
                      min="0.01"
                      class="tipid-input pl-8 font-mono font-semibold tabular-nums"
                      placeholder="2500"
                    />
                  </div>
                </div>

                <div>
                  <label for="plan-freq" class="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">
                    {{ isTl ? "Dalas ng Hulog" : "Schedule" }}
                  </label>
                  <select id="plan-freq" v-model="goalFrequency" name="goalFrequency" class="tipid-input">
                    <option value="sahod">{{ isTl ? "Tuwing Sahod (15d)" : "Every Payday (15d)" }}</option>
                    <option value="weekly">{{ isTl ? "Lingguhan" : "Weekly" }}</option>
                    <option value="monthly">{{ isTl ? "Buwanan" : "Monthly" }}</option>
                  </select>
                </div>
              </div>

              <div class="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                <div>
                  <label for="plan-wallet" class="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">
                    {{ isTl ? "Wallet ng Ipon" : "Destination Wallet" }}
                  </label>
                  <select id="plan-wallet" v-model="goalWallet" name="goalWallet" class="tipid-input">
                    <optgroup :label="isTl ? 'Naka-link na Account' : 'Linked Accounts'">
                      <option v-for="w in wallets" :key="w" :value="w">
                        {{ resolveWalletVisual(w).displayName }}
                      </option>
                    </optgroup>
                    <optgroup v-if="extraSupportedWallets.length > 0" :label="isTl ? 'Iba Pang Sinusuportahan' : 'Other Supported Accounts'">
                      <option v-for="w in extraSupportedWallets" :key="w.id" :value="w.id">
                        {{ w.name }}
                      </option>
                    </optgroup>
                    <option v-if="hasCustomGoalWallet" :value="goalWallet">
                      {{ goalWallet }}
                    </option>
                  </select>
                </div>

                <div>
                  <label for="plan-start" class="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">
                    {{ isTl ? "Petsa ng Simula" : "Start Date" }}
                  </label>
                  <input id="plan-start" v-model="goalStartDate" name="goalStartDate" type="date" class="tipid-input" />
                </div>
              </div>

              <div v-if="goalProjection" class="tipid-inset flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-xs">
                <span class="inline-flex items-center gap-2 text-[var(--text-secondary)]">
                  <CalendarClock :size="15" class="shrink-0 text-[var(--accent)]" aria-hidden="true" />
                  <span>
                    {{ isTl ? "Tinatayang petsa ng pagkumpleto" : "Projected target date" }}:
                    <strong class="text-[var(--text-primary)]">{{ goalProjection.targetDateLabel }}</strong>
                  </span>
                </span>
                <span class="rounded-full bg-[var(--bg-surface)] px-2.5 py-0.5 font-mono font-bold text-[var(--accent)] shadow-xs">
                  {{ goalProjection.periods }} {{ isTl ? "hulog" : "deposits" }}
                </span>
              </div>

              <div class="flex justify-end">
                <button
                  type="submit"
                  :disabled="savingPlan"
                  class="tipid-cta rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--accent-hover)]"
                >
                  {{ savingPlan ? t.commonSaving : (isTl ? "I-save ang Plano" : "Save Plan") }}
                </button>
              </div>
            </form>
          </div>
        </section>

        <!-- TAB 2: PREFERENCES -->
        <section
          id="profile-panel-prefs"
          role="tabpanel"
          aria-labelledby="profile-tab-prefs"
          class="col-start-1 row-start-1"
          :tabindex="activeTab === 'prefs' ? 0 : undefined"
          :hidden="activeTab !== 'prefs' ? 'until-found' : undefined"
          @beforematch="selectTab('prefs')"
        >
          <div class="tipid-card space-y-5 p-5 sm:p-6">
            <div class="flex items-start gap-3">
              <div class="tipid-icon-badge mt-0.5 h-9 w-9 bg-[var(--bg-inset)] text-[var(--text-secondary)]">
                <SlidersHorizontal :size="17" aria-hidden="true" />
              </div>
              <div>
                <h2 class="text-base font-bold text-[var(--text-primary)]">
                  {{ isTl ? "Mga Kagustuhan" : "Appearance & Reminders" }}
                </h2>
                <p class="mt-0.5 text-xs text-[var(--text-secondary)]">
                  {{ isTl ? "Tema, wika, default wallet, at mga paalala." : "Theme, language, default wallet, and alerts." }}
                </p>
              </div>
            </div>

            <fieldset class="space-y-2">
              <legend class="text-xs font-semibold text-[var(--text-secondary)]">
                {{ isTl ? "Tema ng Kulay" : "Appearance" }}
              </legend>
              <div class="grid grid-cols-3 gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-inset)] p-1">
                <button
                  v-for="opt in [
                    { id: 'system', label: t.navSystem, icon: Monitor },
                    { id: 'light', label: t.navLight, icon: Sun },
                    { id: 'dark', label: t.navDark, icon: Moon }
                  ]"
                  :key="opt.id"
                  type="button"
                  :class="[
                    'flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors',
                    themePreference === opt.id
                      ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  ]"
                  @click="setThemePreference(opt.id as ThemePreference)"
                >
                  <component :is="opt.icon" :size="14" aria-hidden="true" />
                  <span>{{ opt.label }}</span>
                </button>
              </div>
            </fieldset>

            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <fieldset>
                <legend class="mb-1.5 text-xs font-semibold text-[var(--text-secondary)]">
                  {{ isTl ? "Wika" : "Language" }}
                </legend>
                <div class="grid grid-cols-2 gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-inset)] p-1">
                  <button
                    type="button"
                    :class="[
                      'rounded-lg px-3 py-2 text-xs font-semibold transition-colors',
                      lang === 'en' ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs' : 'text-[var(--text-secondary)]'
                    ]"
                    @click="handleSelectLanguage('en')"
                  >
                    English
                  </button>
                  <button
                    type="button"
                    :class="[
                      'rounded-lg px-3 py-2 text-xs font-semibold transition-colors',
                      lang === 'tl' ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs' : 'text-[var(--text-secondary)]'
                    ]"
                    @click="handleSelectLanguage('tl')"
                  >
                    Filipino
                  </button>
                </div>
              </fieldset>

              <div>
                <label for="pref-default-wallet" class="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">
                  {{ isTl ? "Default na Wallet" : "Default Wallet" }}
                </label>
                <select
                  id="pref-default-wallet"
                  :value="defaultWallet"
                  name="defaultWallet"
                  class="tipid-input"
                  @change="handleChangeDefaultWallet(($event.target as HTMLSelectElement).value)"
                >
                  <option v-for="opt in defaultWalletOptions" :key="opt.value" :value="opt.value">
                    {{ opt.label }}
                  </option>
                </select>
              </div>
            </div>

            <div class="divide-y divide-[var(--border-subtle)] rounded-xl border border-[var(--border-subtle)]">
              <div class="flex flex-wrap items-center justify-between gap-3 p-3.5 sm:flex-nowrap sm:gap-4 sm:px-4">
                <label for="pref-hide-centavos" class="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
                  <div class="tipid-icon-badge h-8 w-8 bg-[var(--bg-inset)] text-[var(--text-secondary)]" aria-hidden="true">
                    <Coins :size="15" />
                  </div>
                  <div class="min-w-0 flex-1">
                    <span class="block text-sm font-medium text-[var(--text-primary)]">
                      {{ isTl ? "Itago ang Centavos" : "Compact Whole-Peso" }}
                    </span>
                    <span class="block text-xs text-[var(--text-muted)]">
                      {{ isTl ? "Alisin ang .00 kung buo." : "Hide .00 on whole amounts." }}
                    </span>
                  </div>
                </label>
                <input
                  id="pref-hide-centavos"
                  type="checkbox"
                  role="switch"
                  class="tipid-switch shrink-0"
                  :checked="hideCentavos"
                  @change="handleToggleCentavos(($event.target as HTMLInputElement).checked)"
                />
              </div>

              <div class="flex flex-col gap-3 p-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-4">
                <label for="pref-daily-reminders" class="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
                  <div class="tipid-icon-badge h-8 w-8 bg-[var(--accent-soft)] text-[var(--accent)]" aria-hidden="true">
                    <Bell :size="15" />
                  </div>
                  <div class="min-w-0 flex-1">
                    <span class="block text-sm font-medium text-[var(--text-primary)]">
                      {{ isTl ? "Arawang Paalala" : "Daily Reminder" }}
                    </span>
                    <span class="block text-xs text-[var(--text-muted)]">
                      {{ isTl ? "Paalala para magtala araw-araw." : "Prompt to log daily expenses." }}
                    </span>
                  </div>
                </label>
                <div class="flex shrink-0 items-center justify-end gap-2.5 pl-11 sm:pl-0">
                  <input
                    v-if="dailyReminders"
                    v-model="reminderTime"
                    type="time"
                    aria-label="Reminder time"
                    class="tipid-compact min-h-[40px] min-w-0 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] px-2.5 py-1 text-base sm:min-h-[34px] sm:py-1 sm:text-xs"
                  />
                  <input
                    id="pref-daily-reminders"
                    v-model="dailyReminders"
                    type="checkbox"
                    role="switch"
                    class="tipid-switch shrink-0"
                  />
                </div>
              </div>

              <div class="flex flex-col gap-3 p-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-4">
                <label for="pref-overbudget-alerts" class="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
                  <div class="tipid-icon-badge h-8 w-8 bg-[var(--warning-soft)] text-[var(--warning)]" aria-hidden="true">
                    <AlertTriangle :size="15" />
                  </div>
                  <div class="min-w-0 flex-1">
                    <span class="block text-sm font-medium text-[var(--text-primary)]">
                      {{ isTl ? "Babala sa Badyet" : "Budget Alerts" }}
                    </span>
                    <span class="block text-xs text-[var(--text-muted)]">
                      {{ isTl ? "Babala malapit sa limit." : "Warn when spending nears cap." }}
                    </span>
                  </div>
                </label>
                <div class="flex shrink-0 items-center justify-end gap-2.5 pl-11 sm:pl-0">
                  <select
                    v-if="overbudgetAlerts"
                    v-model.number="budgetThreshold"
                    aria-label="Budget threshold percentage"
                    class="tipid-compact min-h-[40px] rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] px-2.5 py-1 text-base sm:min-h-[34px] sm:py-1 sm:text-xs"
                  >
                    <option :value="75">75%</option>
                    <option :value="80">80%</option>
                    <option :value="90">90%</option>
                    <option :value="100">100%</option>
                  </select>
                  <input
                    id="pref-overbudget-alerts"
                    v-model="overbudgetAlerts"
                    type="checkbox"
                    role="switch"
                    class="tipid-switch shrink-0"
                  />
                </div>
              </div>
            </div>

            <div class="flex justify-end">
              <button
                type="button"
                :disabled="savingPrefs"
                class="tipid-cta rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--accent-hover)]"
                @click="handleSaveNotifications"
              >
                {{ savingPrefs ? t.commonSaving : (isTl ? "I-save ang Paalala" : "Save Reminder Settings") }}
              </button>
            </div>
          </div>
        </section>

        <!-- TAB 3: SECURITY & DATA -->
        <section
          id="profile-panel-security"
          role="tabpanel"
          aria-labelledby="profile-tab-security"
          class="col-start-1 row-start-1"
          :tabindex="activeTab === 'security' ? 0 : undefined"
          :hidden="activeTab !== 'security' ? 'until-found' : undefined"
          @beforematch="selectTab('security')"
        >
          <div class="space-y-4">
            <!-- App Lock & Biometrics Card -->
            <div class="tipid-card space-y-5 p-5 sm:p-6">
              <div class="flex flex-wrap items-center justify-between gap-3">
                <div class="flex items-start gap-3">
                  <div class="tipid-icon-badge mt-0.5 h-9 w-9 bg-[var(--warning-soft)] text-[var(--warning)]">
                    <ShieldCheck :size="17" aria-hidden="true" />
                  </div>
                  <div>
                    <h2 class="text-base font-bold text-[var(--text-primary)]">
                      {{ isTl ? "Seguridad at App Lock" : "Security & App Lock" }}
                    </h2>
                    <p class="mt-0.5 text-xs text-[var(--text-secondary)]">
                      {{ isTl ? "Protektahan gamit ang biometrics o PIN." : "Require Face ID, Touch ID, or a local PIN." }}
                    </p>
                  </div>
                </div>

                <span
                  :class="[
                    'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold',
                    bioEnabled || pinConfigured
                      ? 'bg-[var(--income-soft)] text-[var(--income)]'
                      : 'bg-[var(--bg-inset)] text-[var(--text-muted)]'
                  ]"
                >
                  <CheckCircle2 v-if="bioEnabled || pinConfigured" :size="13" aria-hidden="true" />
                  <ShieldOff v-else :size="13" aria-hidden="true" />
                  <span>{{ bioEnabled || pinConfigured ? (isTl ? "Aktibo" : "Active") : (isTl ? "Naka-off" : "Off") }}</span>
                </span>
              </div>

              <div class="flex flex-wrap gap-2.5">
                <button
                  v-if="platformBioAvailable"
                  type="button"
                  :disabled="bioBusy"
                  class="inline-flex items-center gap-2 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] px-4 py-2.5 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-inset)] sm:text-sm"
                  @click="handleEnableBiometrics"
                >
                  <Fingerprint :size="16" aria-hidden="true" />
                  <span>{{ isTl ? "I-setup ang Biometrics" : "Register Device Biometrics" }}</span>
                </button>

                <button
                  v-if="bioEnabled || pinConfigured"
                  type="button"
                  :disabled="bioBusy"
                  class="inline-flex items-center gap-2 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] px-4 py-2.5 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-inset)] sm:text-sm"
                  @click="handleTestLock"
                >
                  <KeyRound :size="16" aria-hidden="true" />
                  <span>{{ isTl ? "Subukan ang Lock" : "Test Unlock" }}</span>
                </button>

                <button
                  v-if="bioEnabled || pinConfigured"
                  type="button"
                  class="inline-flex items-center gap-2 rounded-xl border border-[var(--border-strong)] px-4 py-2.5 text-xs font-semibold text-[var(--expense)] hover:bg-[var(--expense-soft)] sm:text-sm"
                  @click="handleDisableLock"
                >
                  <ShieldOff :size="16" aria-hidden="true" />
                  <span>{{ isTl ? "I-disable ang Lock" : "Disable Lock" }}</span>
                </button>
              </div>

              <form class="flex flex-col gap-3 border-t border-[var(--border-subtle)] pt-4 sm:flex-row sm:items-end" @submit.prevent="handleSavePin">
                <div class="flex-1">
                  <label for="pin-setup" class="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">
                    {{ pinConfigured ? (isTl ? "Palitan ang Backup PIN (4–8 digits)" : "Update PIN Passcode (4–8 digits)") : (isTl ? "Magtakda ng PIN Passcode (4–8 digits)" : "Set PIN Passcode (4–8 digits)") }}
                  </label>
                  <input
                    id="pin-setup"
                    v-model="pinInput"
                    name="pinSetup"
                    type="password"
                    inputmode="numeric"
                    minlength="4"
                    maxlength="8"
                    autocomplete="off"
                    class="tipid-input font-mono tracking-widest"
                    placeholder="••••"
                  />
                </div>

                <button
                  type="submit"
                  :disabled="pinSaving"
                  class="shrink-0 rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--accent-hover)]"
                >
                  {{ pinSaving ? t.commonSaving : (isTl ? "I-save ang PIN" : "Save PIN") }}
                </button>
              </form>
            </div>

            <!-- Data Controls & Collapsible Danger Zone Card -->
            <div class="tipid-card space-y-5 p-5 sm:p-6">
              <div class="flex items-start gap-3">
                <div class="tipid-icon-badge mt-0.5 h-9 w-9 bg-[var(--bg-inset)] text-[var(--text-secondary)]">
                  <Database :size="17" aria-hidden="true" />
                </div>
                <div>
                  <h2 class="text-base font-bold text-[var(--text-primary)]">
                    {{ isTl ? "Data at Account" : "Data & Session Controls" }}
                  </h2>
                  <p class="mt-0.5 text-xs text-[var(--text-secondary)]">
                    {{ isTl ? "I-export ang CSV, i-reset ang prefs, o mag-sign out." : "Export CSV, reset device prefs, or sign out." }}
                  </p>
                </div>
              </div>

              <div class="flex flex-wrap gap-2.5">
                <button
                  type="button"
                  class="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] px-4 py-2.5 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-inset)] sm:text-sm"
                  @click="handleExportCsv"
                >
                  <Download :size="15" aria-hidden="true" />
                  <span>{{ t.exportCsv }} ({{ entries.length }})</span>
                </button>

                <button
                  type="button"
                  class="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] px-4 py-2.5 text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-inset)] sm:text-sm"
                  @click="clearPrefsOpen = true"
                >
                  <RotateCcw :size="15" aria-hidden="true" />
                  <span>{{ isTl ? "I-reset ang Device Prefs" : "Reset Device Prefs" }}</span>
                </button>

                <button
                  type="button"
                  class="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] px-4 py-2.5 text-xs font-semibold text-[var(--text-primary)] transition-colors hover:border-[var(--expense)]/40 hover:bg-[var(--expense-soft)] hover:text-[var(--expense)] sm:text-sm"
                  @click="handleSignOut"
                >
                  <LogOut :size="15" aria-hidden="true" />
                  <span>{{ t.navLogout }}</span>
                </button>
              </div>

              <!-- Collapsible Danger Zone per accordion/content-first-noise-reduction guides (no heading inside summary) -->
              <details class="tipid-disclosure group rounded-xl border border-[var(--expense)]/25 bg-[var(--expense-soft)]/45">
                <summary class="flex items-center justify-between gap-2 px-4 py-3 text-xs font-bold text-[var(--expense)]">
                  <span class="inline-flex items-center gap-2">
                    <ChevronDown :size="15" class="transition-transform group-open:rotate-180" aria-hidden="true" />
                    <span>{{ isTl ? "Danger Zone · Permanenteng Pagtanggal" : "Danger Zone · Account Deletion" }}</span>
                  </span>
                  <span class="text-[11px] font-medium text-[var(--text-secondary)]">
                    {{ isTl ? "Buksan" : "Expand" }}
                  </span>
                </summary>

                <div class="flex flex-col gap-3 border-t border-[var(--expense)]/15 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                  <p class="text-xs text-[var(--text-secondary)]">
                    {{ isTl ? "Permanenteng tatanggalin ang iyong account access." : "Permanently remove your login access." }}
                  </p>

                  <button
                    type="button"
                    class="inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border border-[var(--expense)]/45 bg-[var(--bg-surface)] px-4 py-2 text-xs font-semibold text-[var(--expense)] transition-colors hover:bg-[var(--expense)] hover:text-white"
                    @click="deleteConfirmInput = ''; deleteError = ''; deleteAccountOpen = true"
                  >
                    <Trash2 :size="14" aria-hidden="true" />
                    <span>{{ isTl ? "Burahin ang Account" : "Delete Account" }}</span>
                  </button>
                </div>
              </details>
            </div>
          </div>
        </section>
      </div>
    </div>

    <!-- Edit Profile & Photo Dialog -->
    <BaseDialog
      :open="editProfileOpen"
      :title="isTl ? 'I-edit ang Profile' : 'Edit Profile'"
      :subtitle="isTl ? 'I-update ang pangalan, larawan, o magpadala ng password reset.' : 'Update your display name, upload a square avatar, or trigger password reset.'"
      max-width-class="max-w-md"
      @close="editProfileOpen = false"
    >
      <form class="space-y-4" @submit.prevent="handleSaveAccount">
        <div class="flex items-center gap-4">
          <div class="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-inset)] text-xl font-bold text-[var(--text-primary)]">
            <img v-if="effectiveAvatar" :src="effectiveAvatar" alt="" class="h-full w-full object-cover" />
            <span v-else>{{ userInitial }}</span>
          </div>
          <div class="flex flex-wrap gap-2">
            <label
              for="avatar-upload"
              class="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3.5 py-2 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-inset)]"
            >
              <Camera :size="14" aria-hidden="true" />
              <span>{{ isTl ? "Pumili ng Larawan" : "Choose Photo" }}</span>
            </label>
            <button
              v-if="avatarPreview"
              type="button"
              class="rounded-xl px-3 py-2 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              @click="avatarPreview = ''"
            >
              {{ isTl ? "Alisin preview" : "Discard preview" }}
            </button>
          </div>
        </div>

        <div>
          <label for="profile-name" class="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">
            {{ isTl ? "Pangalan na Ipinapakita" : "Display Name" }}
          </label>
          <input
            id="profile-name"
            v-model="displayName"
            name="displayName"
            type="text"
            autocomplete="name"
            maxlength="80"
            required
            class="tipid-input"
          />
        </div>

        <div class="flex flex-col-reverse gap-2.5 pt-1 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            class="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3.5 py-2.5 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-inset)]"
            :disabled="resettingPassword || !user?.email"
            @click="handlePasswordReset"
          >
            <KeyRound :size="13" aria-hidden="true" />
            <span>{{ resettingPassword ? "..." : (isTl ? "Password Reset" : "Reset Password") }}</span>
          </button>

          <div class="flex gap-2">
            <button
              type="button"
              class="flex-1 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] px-4 py-2.5 text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-inset)] sm:flex-none"
              @click="editProfileOpen = false"
            >
              {{ t.commonCancel }}
            </button>
            <button
              type="submit"
              :disabled="savingAccount"
              class="flex-1 rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--accent-hover)] sm:flex-none"
            >
              {{ savingAccount ? t.commonSaving : t.commonSave }}
            </button>
          </div>
        </div>
      </form>
    </BaseDialog>

    <!-- Test PIN Dialog -->
    <BaseDialog
      :open="testPinOpen"
      :title="isTl ? 'Subukan ang PIN Passcode' : 'Verify PIN Passcode'"
      max-width-class="max-w-xs"
      @close="testPinOpen = false"
    >
      <form class="space-y-4" @submit.prevent="submitTestPin">
        <input
          v-model="testPinValue"
          type="password"
          inputmode="numeric"
          maxlength="8"
          autocomplete="off"
          autofocus
          class="tipid-input text-center font-mono text-xl tracking-[0.3em]"
          placeholder="••••"
        />
        <p v-if="testPinError" role="alert" class="text-xs font-medium text-[var(--expense)]">
          {{ testPinError }}
        </p>
        <div class="flex justify-end gap-2">
          <button
            type="button"
            class="rounded-xl border border-[var(--border-strong)] px-4 py-2 text-sm font-semibold"
            @click="testPinOpen = false"
          >
            {{ t.commonCancel }}
          </button>
          <button type="submit" class="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white">
            {{ isTl ? "Suriin" : "Verify" }}
          </button>
        </div>
      </form>
    </BaseDialog>

    <!-- Confirm Reset Local Prefs -->
    <ConfirmDialog
      :open="clearPrefsOpen"
      :title="isTl ? 'I-reset ang local preferences?' : 'Reset local preferences?'"
      :message="isTl ? 'Mananatili ang iyong cloud data, ngunit ibabalik sa default ang wika, tema, at napiling wallet sa device na ito.' : 'Your cloud ledger stays intact, while theme, language, and local device defaults reset.'"
      :confirm-label="isTl ? 'I-reset' : 'Reset'"
      :cancel-label="t.commonCancel"
      :destructive="false"
      @cancel="clearPrefsOpen = false"
      @confirm="handleClearLocalPrefs"
    />

    <!-- Confirm Permanent Delete Account -->
    <BaseDialog
      :open="deleteAccountOpen"
      :title="isTl ? 'Permanenteng Burahin ang Account' : 'Permanently Delete Account'"
      :subtitle="isTl ? 'Hindi na maibabalik ang access kapag tinuloy ito.' : 'This permanently removes your Firebase login account.'"
      max-width-class="max-w-md"
      @close="deleteAccountOpen = false"
    >
      <form class="space-y-4" @submit.prevent="handleDeleteAccount">
        <div>
          <label for="delete-confirm" class="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">
            {{ isTl ? 'I-type ang "DELETE" upang kumpirmahin' : 'Type "DELETE" to confirm' }}
          </label>
          <input
            id="delete-confirm"
            v-model="deleteConfirmInput"
            type="text"
            autocomplete="off"
            class="tipid-input font-mono uppercase"
            placeholder="DELETE"
          />
        </div>

        <p v-if="deleteError" role="alert" class="text-xs font-medium text-[var(--expense)]">
          {{ deleteError }}
        </p>

        <div class="flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
          <button
            type="button"
            class="rounded-xl border border-[var(--border-strong)] px-4 py-2.5 text-sm font-semibold"
            :disabled="deletingAccount"
            @click="deleteAccountOpen = false"
          >
            {{ t.commonCancel }}
          </button>
          <button
            type="submit"
            :disabled="deletingAccount || deleteConfirmInput.trim().toUpperCase() !== 'DELETE'"
            class="rounded-xl bg-[var(--expense)] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
          >
            {{ deletingAccount ? "..." : (isTl ? "Burahin ang Account" : "Delete Account") }}
          </button>
        </div>
      </form>
    </BaseDialog>
  </AppShell>
</template>
