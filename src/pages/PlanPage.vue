<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import {
  AlertTriangle,
  ArrowDownLeft,
  Calendar,
  CheckCircle2,
  Coins,
  Gauge,
  Loader2,
  Pencil,
  PiggyBank,
  Plus,
  ShieldCheck,
  Sparkles,
  Tag,
  Target,
  Trash2,
  Wallet
} from "@lucide/vue";
import AppShell from "@/components/AppShell.vue";
import BaseDialog from "@/components/BaseDialog.vue";
import BudgetModal from "@/components/BudgetModal.vue";
import ConfirmDialog from "@/components/ConfirmDialog.vue";
import { useAuthGuard } from "@/composables/useAuthGuard";
import { useFinanceData } from "@/composables/useFinanceData";
import { pushToast } from "@/composables/useToast";
import { useI18n } from "@/lib/i18n";
import {
  CATEGORIES,
  formatPeso,
  getCategoryColor,
  manilaDateKey,
  money,
  sumActiveWalletsBalance,
  sumMoney
} from "@/lib/core";
import {
  addSavingsGoal,
  deleteCategoryBudget,
  deleteSavingsGoal,
  depositToSavingsGoal,
  isPermissionDeniedError,
  saveCategoryBudget,
  setBudgetCycle,
  updateSavingsGoal
} from "@/lib/data";
import { notifyWriteResult } from "@/lib/offlineSync";
import {
  computeCategoryBudgetStatuses,
  computeSafeToSpendMetrics,
  computeSavingsJarProgress,
  resolveBudgetCycleWindow
} from "@/lib/planMath";
import { resolveWalletVisual } from "@/lib/walletVisuals";
import { getCategoryIcon } from "@/lib/categoryIcons";
import type {
  BudgetCycle,
  CategoryBudgetRecord,
  SavingsGoalColor,
  SavingsGoalRecord
} from "@/types/finance";

const { user, isOffline, isLocked, unlockSession } = useAuthGuard();
const uidRef = computed(() => user.value?.uid);
const {
  entries,
  budget,
  budgetCycle,
  wallets,
  walletBalances,
  bills,
  goals,
  notificationSettings,
  savingsGoals,
  loadingSavingsGoals,
  categoryBudgets,
  loadingCategoryBudgets,
  planRulesBlocked
} = useFinanceData(uidRef, {
  withBills: true,
  withSavingsGoals: true,
  withCategoryBudgets: true
});
const { t, isTl } = useI18n();

function formatPlanWriteError(err: unknown, fallback: string): string {
  if (isPermissionDeniedError(err)) {
    return isTl.value
      ? "I-publish muna ang updated firestore.rules sa Firebase Console (Firestore Database -> Rules)."
      : "Publish the updated firestore.rules in Firebase Console (Firestore Database -> Rules) first.";
  }
  return err instanceof Error ? err.message : fallback;
}

type PlanTabId = "jars" | "budgets";
const activeTab = ref<PlanTabId>("jars");
const tabIds: PlanTabId[] = ["jars", "budgets"];

onMounted(() => {
  const params = new URLSearchParams(window.location.search);
  const tabParam = params.get("tab");
  if (tabParam === "budgets" || tabParam === "jars") {
    activeTab.value = tabParam;
  }
});

function selectTab(next: PlanTabId) {
  activeTab.value = next;
}

function handleTabKeydown(event: KeyboardEvent) {
  const idx = tabIds.indexOf(activeTab.value);
  let target: PlanTabId | null = null;
  if (event.key === "ArrowRight") target = tabIds[(idx + 1) % tabIds.length];
  else if (event.key === "ArrowLeft") target = tabIds[(idx - 1 + tabIds.length) % tabIds.length];
  else if (event.key === "Home") target = tabIds[0];
  else if (event.key === "End") target = tabIds[tabIds.length - 1];

  if (!target) return;
  event.preventDefault();
  activeTab.value = target;
  document.getElementById(`plan-tab-${target}`)?.focus();
}

const todayKey = manilaDateKey() || new Date().toISOString().slice(0, 10);

const JAR_COLORS: Array<{ id: SavingsGoalColor; hex: string; labelEn: string; labelTl: string }> = [
  { id: "emerald", hex: "#0E7A53", labelEn: "Emerald", labelTl: "Berde" },
  { id: "blue", hex: "#2563EB", labelEn: "Blue", labelTl: "Asul" },
  { id: "amber", hex: "#D97706", labelEn: "Amber", labelTl: "Ginto" },
  { id: "violet", hex: "#7C3AED", labelEn: "Violet", labelTl: "Lila" },
  { id: "rose", hex: "#E11D48", labelEn: "Rose", labelTl: "Rosas" }
];

function jarColorHex(color?: SavingsGoalColor): string {
  return JAR_COLORS.find((c) => c.id === color)?.hex || "#0E7A53";
}

// ---------- Savings Jars State & Computations ----------
const jarProgressMap = computed(() => {
  const map: Record<string, ReturnType<typeof computeSavingsJarProgress>> = {};
  for (const jar of savingsGoals.value) {
    map[jar.id] = computeSavingsJarProgress(jar, todayKey);
  }
  return map;
});

const jarPortfolioSummary = computed(() => {
  const saved = sumMoney(savingsGoals.value.map((g) => g.savedAmount));
  const target = sumMoney(savingsGoals.value.map((g) => g.targetAmount));
  const completedCount = savingsGoals.value.filter((g) => jarProgressMap.value[g.id]?.isCompleted).length;
  const pct = target > 0 ? Math.min(100, Math.round((saved / target) * 100)) : 0;
  return {
    count: savingsGoals.value.length,
    completedCount,
    saved,
    target,
    pct
  };
});

const canMigrateLegacyGoal = computed(
  () =>
    !loadingSavingsGoals.value &&
    savingsGoals.value.length === 0 &&
    Boolean(goals.value?.name?.trim()) &&
    Number(goals.value?.targetAmount || 0) > 0
);

const migratingLegacy = ref(false);
async function importLegacyGoal() {
  const uid = user.value?.uid;
  if (!uid || !canMigrateLegacyGoal.value || migratingLegacy.value) return;
  migratingLegacy.value = true;
  try {
    const res = await addSavingsGoal(uid, {
      name: goals.value.name!.trim(),
      targetAmount: Number(goals.value.targetAmount),
      savedAmount: 0,
      wallet: goals.value.wallet || null,
      targetDate: null,
      color: "emerald"
    });
    notifyWriteResult(
      pushToast,
      res,
      isTl.value ? "Na-import ang goal sa Savings Jars." : "Legacy goal imported to Savings Jars.",
      isTl.value ? "Naka-save offline — isi-sync online." : "Saved offline — syncs when online."
    );
  } catch {
    pushToast(isTl.value ? "Hindi ma-import ang goal." : "Could not import goal.", "error");
  } finally {
    migratingLegacy.value = false;
  }
}

// Create / Edit Jar Dialog
const jarModalOpen = ref(false);
const editingJar = ref<SavingsGoalRecord | null>(null);
const jarName = ref("");
const jarTarget = ref("");
const jarSaved = ref("0");
const jarWallet = ref("");
const jarTargetDate = ref("");
const jarColor = ref<SavingsGoalColor>("emerald");
const jarError = ref("");
const savingJar = ref(false);
const jarNameRef = ref<HTMLInputElement | null>(null);
const jarTargetRef = ref<HTMLInputElement | null>(null);
const jarSavedRef = ref<HTMLInputElement | null>(null);

function openAddJar() {
  editingJar.value = null;
  jarName.value = "";
  jarTarget.value = "";
  jarSaved.value = "0";
  jarWallet.value = "";
  jarTargetDate.value = "";
  jarColor.value = "emerald";
  jarError.value = "";
  jarModalOpen.value = true;
}

function openEditJar(jar: SavingsGoalRecord) {
  editingJar.value = jar;
  jarName.value = jar.name;
  jarTarget.value = String(jar.targetAmount ?? "");
  jarSaved.value = String(jar.savedAmount ?? 0);
  jarWallet.value = jar.wallet || "";
  jarTargetDate.value = jar.targetDate || "";
  jarColor.value = jar.color || "emerald";
  jarError.value = "";
  jarModalOpen.value = true;
}

async function submitJar() {
  const uid = user.value?.uid;
  if (!uid) return;
  jarError.value = "";

  const cleanName = jarName.value.trim();
  if (!cleanName) {
    jarError.value = isTl.value ? "Ilagay ang pangalan ng ipon jar." : "Enter a savings jar name.";
    jarNameRef.value?.focus();
    return;
  }

  let safeTarget = 0;
  try {
    safeTarget = money(jarTarget.value);
  } catch {
    jarError.value = isTl.value ? "Maglagay ng target na lampas ₱0." : "Enter a valid target above ₱0.";
    jarTargetRef.value?.focus();
    return;
  }

  let safeSaved = 0;
  try {
    safeSaved = money(jarSaved.value || 0, { allowZero: true });
  } catch {
    jarError.value = isTl.value ? "Maglagay ng wastong halagang nakaipon." : "Enter a valid non-negative saved amount.";
    jarSavedRef.value?.focus();
    return;
  }

  savingJar.value = true;
  try {
    const payload = {
      name: cleanName,
      targetAmount: safeTarget,
      savedAmount: safeSaved,
      wallet: jarWallet.value || null,
      targetDate: jarTargetDate.value || null,
      color: jarColor.value
    };
    if (editingJar.value) {
      const res = await updateSavingsGoal(uid, editingJar.value.id, payload);
      notifyWriteResult(
        pushToast,
        res,
        isTl.value ? "Na-update ang ipon jar." : "Savings jar updated.",
        isTl.value ? "Na-update offline — isi-sync online." : "Updated offline — syncs when online."
      );
    } else {
      const res = await addSavingsGoal(uid, payload);
      notifyWriteResult(
        pushToast,
        res,
        isTl.value ? "Nadagdag ang bagong ipon jar." : "Savings jar created.",
        isTl.value ? "Naka-save offline — isi-sync online." : "Saved offline — syncs when online."
      );
    }
    jarModalOpen.value = false;
    editingJar.value = null;
  } catch (err) {
    jarError.value = formatPlanWriteError(err, "Could not save jar.");
  } finally {
    savingJar.value = false;
  }
}

// Deposit to Jar Dialog
const depositModalOpen = ref(false);
const depositTargetJar = ref<SavingsGoalRecord | null>(null);
const depositAmount = ref("");
const deductWalletEnabled = ref(true);
const depositWallet = ref("Cash");
const depositError = ref("");
const savingDeposit = ref(false);
const depositAmountRef = ref<HTMLInputElement | null>(null);

const selectedDepositWalletBalance = computed(() => walletBalances.value[depositWallet.value] ?? 0);
const parsedDepositAmount = computed(() => {
  const n = Number(depositAmount.value);
  return Number.isFinite(n) && n > 0 ? n : 0;
});
const depositInsufficient = computed(
  () =>
    deductWalletEnabled.value &&
    parsedDepositAmount.value > 0 &&
    parsedDepositAmount.value > selectedDepositWalletBalance.value
);

function openDepositDialog(jar: SavingsGoalRecord) {
  depositTargetJar.value = jar;
  const rem = jarProgressMap.value[jar.id]?.remainingAmount ?? 0;
  depositAmount.value = rem > 0 ? String(Math.min(rem, 500)) : "";
  const preferredWallet = jar.wallet && wallets.value.includes(jar.wallet) ? jar.wallet : wallets.value[0] || "Cash";
  depositWallet.value = preferredWallet;
  deductWalletEnabled.value = true;
  depositError.value = "";
  depositModalOpen.value = true;
}

async function submitDeposit() {
  const uid = user.value?.uid;
  const jar = depositTargetJar.value;
  if (!uid || !jar) return;
  depositError.value = "";

  let safeDeposit = 0;
  try {
    safeDeposit = money(depositAmount.value);
  } catch {
    depositError.value = isTl.value ? "Maglagay ng halagang lampas ₱0." : "Enter a valid deposit above ₱0.";
    depositAmountRef.value?.focus();
    return;
  }

  if (deductWalletEnabled.value && safeDeposit > selectedDepositWalletBalance.value) {
    depositError.value = isTl.value
      ? `Kulang ang balanse sa ${resolveWalletVisual(depositWallet.value).displayName}.`
      : `Insufficient balance in ${resolveWalletVisual(depositWallet.value).displayName}.`;
    depositAmountRef.value?.focus();
    return;
  }

  savingDeposit.value = true;
  try {
    const res = await depositToSavingsGoal(uid, jar, safeDeposit, {
      deductFromWallet: deductWalletEnabled.value ? depositWallet.value : null
    });
    notifyWriteResult(
      pushToast,
      res,
      isTl.value ? `Nadagdagan ng ₱${formatPeso(safeDeposit)} ang ${jar.name}.` : `Deposited ₱${formatPeso(safeDeposit)} to ${jar.name}.`,
      isTl.value ? "Naka-save ang hulog offline — isi-sync online." : "Deposit saved offline — syncs when online."
    );
    depositModalOpen.value = false;
    depositTargetJar.value = null;
  } catch (err) {
    depositError.value = formatPlanWriteError(err, "Could not record deposit.");
  } finally {
    savingDeposit.value = false;
  }
}

const pendingDeleteJar = ref<SavingsGoalRecord | null>(null);
const deletingJar = ref(false);
async function confirmDeleteJar() {
  const uid = user.value?.uid;
  const jar = pendingDeleteJar.value;
  if (!uid || !jar) return;
  deletingJar.value = true;
  try {
    await deleteSavingsGoal(uid, jar.id);
    pendingDeleteJar.value = null;
    pushToast(isTl.value ? "Nabura ang ipon jar." : "Savings jar deleted.", "info");
  } catch {
    pushToast(isTl.value ? "Hindi mabura ang jar." : "Could not delete jar.", "error");
  } finally {
    deletingJar.value = false;
  }
}

// ---------- Category Budgets & Safe-to-Spend State ----------
const overallBudgetModalOpen = ref(false);
const savingCycle = ref(false);

async function handleCycleChange(cycle: BudgetCycle) {
  const uid = user.value?.uid;
  if (!uid || cycle === budgetCycle.value || savingCycle.value) return;
  savingCycle.value = true;
  try {
    const res = await setBudgetCycle(uid, cycle);
    notifyWriteResult(
      pushToast,
      res,
      cycle === "kinsenas"
        ? isTl.value
          ? "Naka-set sa Kinsenas (1-15 / 16-End)."
          : "Switched to Kinsenas (1-15 / 16-End)."
        : isTl.value
          ? "Naka-set sa Buwanan."
          : "Switched to Monthly cycle.",
      isTl.value ? "Naka-save offline — isi-sync online." : "Saved offline — syncs when online."
    );
  } catch (err) {
    pushToast(
      formatPlanWriteError(err, isTl.value ? "Hindi mabago ang cycle." : "Could not update cycle."),
      "error"
    );
  } finally {
    savingCycle.value = false;
  }
}

const cycleWindow = computed(() => resolveBudgetCycleWindow(todayKey, budgetCycle.value));

const warningThreshold = computed(() => {
  const raw = Number(notificationSettings.value?.budgetThreshold ?? 80);
  return Number.isFinite(raw) ? Math.min(Math.max(Math.round(raw), 50), 99) : 80;
});

const categoryBreakdown = computed(() =>
  computeCategoryBudgetStatuses({
    entries: entries.value,
    budgets: categoryBudgets.value,
    cycleStartKey: cycleWindow.value.startKey,
    cycleEndKey: cycleWindow.value.endKey,
    warningThresholdPct: warningThreshold.value
  })
);

const liquidWalletBalance = computed(() => sumActiveWalletsBalance(wallets.value, walletBalances.value));

const unpaidBillsInCycle = computed(() =>
  sumMoney(
    bills.value
      .filter((b) => b.status !== "Paid" && b.dueDate && b.dueDate <= cycleWindow.value.endKey)
      .map((b) => b.amount)
  )
);

const safeToSpend = computed(() =>
  computeSafeToSpendMetrics({
    capAmount: Number(budget.value || 0),
    spentAmount: categoryBreakdown.value.totalPeriodExpense,
    remainingDays: cycleWindow.value.remainingDays,
    activeLiquidityBalance: liquidWalletBalance.value,
    unpaidBillsInCycle: unpaidBillsInCycle.value
  })
);

const uncappedSpentCategories = computed(() => {
  const capped = new Set(categoryBudgets.value.map((b) => b.category));
  return Object.entries(categoryBreakdown.value.spentByCategory)
    .filter(([cat, amt]) => !capped.has(cat) && amt > 0)
    .sort((a, b) => b[1] - a[1]);
});

const cycleRangeLabel = computed(() => {
  const fmt = (key: string) => {
    const parts = key.split("-").map(Number);
    if (parts.length !== 3) return key;
    return new Date(Date.UTC(parts[0], parts[1] - 1, parts[2])).toLocaleDateString(
      isTl.value ? "fil-PH" : "en-US",
      { month: "short", day: "numeric", timeZone: "UTC" }
    );
  };
  return `${fmt(cycleWindow.value.startKey)} - ${fmt(cycleWindow.value.endKey)}`;
});

// Add / Edit Category Limit Dialog
const catModalOpen = ref(false);
const editingCatBudget = ref<CategoryBudgetRecord | null>(null);
const catName = ref<string>(CATEGORIES[0]);
const catLimit = ref("");
const catError = ref("");
const savingCatBudget = ref(false);
const catLimitRef = ref<HTMLInputElement | null>(null);

const selectableCategories = computed(() => {
  const set = new Set<string>(CATEGORIES);
  if (catName.value) set.add(catName.value);
  return Array.from(set);
});

function openAddCatBudget(prefillCategory?: string) {
  const used = new Set(categoryBudgets.value.map((b) => b.category));
  const firstUnused = CATEGORIES.find((c) => !used.has(c)) || CATEGORIES[0];
  const chosen = prefillCategory || firstUnused;
  const existing = categoryBudgets.value.find((b) => b.category === chosen) || null;
  editingCatBudget.value = existing;
  catName.value = chosen;
  catLimit.value = existing ? String(existing.limitAmount) : "";
  catError.value = "";
  catModalOpen.value = true;
}

function openEditCatBudget(item: { id: string; category: string; limitAmount: number }) {
  editingCatBudget.value =
    categoryBudgets.value.find((b) => b.id === item.id) || {
      id: item.id,
      category: item.category,
      limitAmount: item.limitAmount
    };
  catName.value = item.category;
  catLimit.value = String(item.limitAmount);
  catError.value = "";
  catModalOpen.value = true;
}

async function submitCatBudget() {
  const uid = user.value?.uid;
  if (!uid) return;
  catError.value = "";

  let safeLimit = 0;
  try {
    safeLimit = money(catLimit.value);
  } catch {
    catError.value = isTl.value ? "Maglagay ng limit na lampas ₱0." : "Enter a valid category limit above ₱0.";
    catLimitRef.value?.focus();
    return;
  }

  savingCatBudget.value = true;
  try {
    const existingMatch = categoryBudgets.value.find((b) => b.category === catName.value);
    const targetId = editingCatBudget.value?.id || existingMatch?.id;
    const res = await saveCategoryBudget(uid, {
      id: targetId,
      category: catName.value,
      limitAmount: safeLimit
    });
    notifyWriteResult(
      pushToast,
      res,
      isTl.value ? `Nai-save ang badyet para sa ${catName.value}.` : `Saved budget limit for ${catName.value}.`,
      isTl.value ? "Naka-save offline — isi-sync online." : "Saved offline — syncs when online."
    );
    catModalOpen.value = false;
    editingCatBudget.value = null;
  } catch (err) {
    catError.value = formatPlanWriteError(err, "Could not save category budget.");
  } finally {
    savingCatBudget.value = false;
  }
}

const pendingDeleteCat = ref<{ id: string; category: string } | null>(null);
const deletingCat = ref(false);
async function confirmDeleteCatBudget() {
  const uid = user.value?.uid;
  const target = pendingDeleteCat.value;
  if (!uid || !target) return;
  deletingCat.value = true;
  try {
    await deleteCategoryBudget(uid, target.id);
    pendingDeleteCat.value = null;
    pushToast(isTl.value ? "Natanggal ang category limit." : "Category limit removed.", "info");
  } catch {
    pushToast(isTl.value ? "Hindi matanggal ang limit." : "Could not remove category limit.", "error");
  } finally {
    deletingCat.value = false;
  }
}
</script>

<template>
  <AppShell active-tab="plan" :user="user" :is-offline="isOffline" :is-locked="isLocked" @unlocked="unlockSession">
    <div v-if="user" class="space-y-5">
      <!-- Page Header -->
      <header class="flex flex-wrap items-center justify-between gap-3">
        <div class="min-w-0">
          <h1 class="truncate text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
            {{ t.planTitle }}
          </h1>
          <p class="mt-0.5 text-xs text-[var(--text-secondary)]">
            {{ t.planSubtitle }}
          </p>
        </div>

        <button
          v-if="activeTab === 'jars'"
          type="button"
          class="tipid-cta inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl bg-[var(--accent)] px-3.5 py-2.5 text-xs font-semibold text-white hover:bg-[var(--accent-hover)]"
          @click="openAddJar"
        >
          <Plus :size="15" aria-hidden="true" />
          <span>{{ isTl ? "Bagong Ipon Jar" : "New Savings Jar" }}</span>
        </button>

        <button
          v-else
          type="button"
          class="tipid-cta inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl bg-[var(--accent)] px-3.5 py-2.5 text-xs font-semibold text-white hover:bg-[var(--accent-hover)]"
          @click="openAddCatBudget()"
        >
          <Plus :size="15" aria-hidden="true" />
          <span>{{ isTl ? "Bagong Limit" : "Add Limit" }}</span>
        </button>
      </header>

      <div
        v-if="planRulesBlocked"
        role="alert"
        class="tipid-card flex items-start gap-3 border border-[var(--warning)]/40 bg-[var(--warning-soft)] p-4 text-xs text-[var(--text-primary)]"
      >
        <AlertTriangle :size="17" class="mt-0.5 shrink-0 text-[var(--warning)]" aria-hidden="true" />
        <div class="space-y-1">
          <p class="font-bold">
            {{ isTl ? "Kailangan i-publish ang updated firestore.rules" : "Publish updated firestore.rules in Firebase Console" }}
          </p>
          <p class="text-[var(--text-secondary)]">
            {{
              isTl
                ? "Naka-block sa Cloud Firestore ang savingsGoals at categoryBudgets hanggang ma-publish ang bagong firestore.rules sa Firebase Console -> Firestore Database -> Rules."
                : "Cloud Firestore is still running your previous security rules. Publish the updated firestore.rules file under Firebase Console -> Firestore Database -> Rules (or run npx -y firebase-tools@latest deploy --only firestore:rules)."
            }}
          </p>
        </div>
      </div>

      <!-- Single-row Accessible Tablist with Non-Color Underline Indicator -->
      <div
        role="tablist"
        :aria-label="isTl ? 'Mga seksyon ng plano' : 'Planning sections'"
        class="flex flex-nowrap items-center gap-6 overflow-x-auto border-b border-[var(--border-subtle)]"
        @keydown="handleTabKeydown"
      >
        <button
          id="plan-tab-jars"
          type="button"
          role="tab"
          :aria-selected="activeTab === 'jars'"
          :tabindex="activeTab === 'jars' ? 0 : -1"
          :class="[
            'plan-tab inline-flex shrink-0 items-center gap-2 whitespace-nowrap px-1 py-3 text-sm font-semibold transition-colors',
            activeTab === 'jars'
              ? 'text-[var(--accent)]'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          ]"
          @click="selectTab('jars')"
        >
          <PiggyBank :size="16" aria-hidden="true" />
          <span>{{ isTl ? "Mga Ipon Jar" : "Savings Jars" }}</span>
          <span
            v-if="jarPortfolioSummary.count > 0"
            class="rounded-full bg-[var(--bg-inset)] px-2 py-0.5 font-mono text-[11px] font-bold text-[var(--text-secondary)]"
          >
            {{ jarPortfolioSummary.count }}
          </span>
        </button>

        <button
          id="plan-tab-budgets"
          type="button"
          role="tab"
          :aria-selected="activeTab === 'budgets'"
          :tabindex="activeTab === 'budgets' ? 0 : -1"
          :class="[
            'plan-tab inline-flex shrink-0 items-center gap-2 whitespace-nowrap px-1 py-3 text-sm font-semibold transition-colors',
            activeTab === 'budgets'
              ? 'text-[var(--accent)]'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          ]"
          @click="selectTab('budgets')"
        >
          <Gauge :size="16" aria-hidden="true" />
          <span>{{ isTl ? "Badyet at Ligtas Gastusin" : "Budgets & Safe-Spend" }}</span>
          <span
            v-if="categoryBudgets.length > 0"
            class="rounded-full bg-[var(--bg-inset)] px-2 py-0.5 font-mono text-[11px] font-bold text-[var(--text-secondary)]"
          >
            {{ categoryBudgets.length }}
          </span>
        </button>
      </div>

      <!-- TAB PANEL 1: SAVINGS JARS -->
      <section
        id="plan-panel-jars"
        role="tabpanel"
        aria-labelledby="plan-tab-jars"
        :hidden="activeTab !== 'jars'"
        class="space-y-5"
      >
        <!-- Hero Emerald Portfolio Card -->
        <article class="tipid-card-emerald p-5 sm:p-6">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div class="min-w-0">
              <span class="tipid-eyebrow text-white/75">
                {{ isTl ? "KABUUANG NAIPON" : "TOTAL SAVINGS JARS" }}
              </span>
              <p class="tipid-amount mt-1.5 font-mono text-3xl font-bold tracking-tight text-white sm:text-4xl">
                ₱{{ formatPeso(jarPortfolioSummary.saved) }}
              </p>
              <p class="mt-1 text-xs text-white/80">
                {{ isTl ? "Target:" : "Across targets:" }}
                <strong class="font-mono text-white">₱{{ formatPeso(jarPortfolioSummary.target) }}</strong>
              </p>
            </div>

            <div class="flex flex-wrap items-center gap-2">
              <span class="rounded-full bg-white/15 px-3 py-1 font-mono text-xs font-semibold text-white">
                {{ jarPortfolioSummary.pct }}% {{ isTl ? "kumpleto" : "overall" }}
              </span>
              <span
                v-if="jarPortfolioSummary.completedCount > 0"
                class="inline-flex items-center gap-1 rounded-full bg-[#7BE5B5]/20 px-3 py-1 text-xs font-semibold text-[#7BE5B5]"
              >
                <CheckCircle2 :size="13" aria-hidden="true" />
                <span>{{ jarPortfolioSummary.completedCount }} {{ isTl ? "natapos" : "funded" }}</span>
              </span>
            </div>
          </div>

          <div class="mt-4">
            <progress
              class="tipid-progress h-2 w-full"
              :value="jarPortfolioSummary.pct"
              max="100"
              style="--progress-bar-fill: #7BE5B5; background: rgba(255,255,255,0.16)"
              :aria-label="`Savings jars overall progress: ${jarPortfolioSummary.pct}%`"
            />
          </div>
        </article>

        <!-- Legacy Profile Goal Import Helper -->
        <div
          v-if="canMigrateLegacyGoal"
          class="tipid-card flex flex-wrap items-center justify-between gap-3 border border-[var(--accent)]/35 bg-[var(--accent-soft)]/50 p-4"
        >
          <div class="flex min-w-0 items-center gap-3">
            <div class="tipid-icon-badge h-10 w-10 shrink-0 bg-[var(--accent)] text-white">
              <Sparkles :size="18" aria-hidden="true" />
            </div>
            <div class="min-w-0">
              <p class="truncate text-sm font-bold text-[var(--text-primary)]">
                {{ isTl ? `I-import ang "${goals.name}" mula sa Profile?` : `Import "${goals.name}" from Profile?` }}
              </p>
              <p class="text-xs text-[var(--text-secondary)]">
                Target ₱{{ formatPeso(Number(goals.targetAmount || 0)) }}
              </p>
            </div>
          </div>
          <button
            type="button"
            :disabled="migratingLegacy"
            class="tipid-compact inline-flex items-center gap-1.5 rounded-xl bg-[var(--accent)] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[var(--accent-hover)]"
            @click="importLegacyGoal"
          >
            <Loader2 v-if="migratingLegacy" :size="13" class="animate-spin" aria-hidden="true" />
            <span>{{ isTl ? "I-import sa Jars" : "Import Goal" }}</span>
          </button>
        </div>

        <!-- Empty Jars State -->
        <div
          v-if="!loadingSavingsGoals && savingsGoals.length === 0"
          class="tipid-card flex flex-col items-center gap-3 px-6 py-12 text-center"
        >
          <div class="tipid-icon-badge h-12 w-12 rounded-2xl bg-[var(--income-soft)] text-[var(--income)]">
            <PiggyBank :size="24" aria-hidden="true" />
          </div>
          <div class="max-w-sm">
            <h2 class="text-base font-bold text-[var(--text-primary)]">
              {{ isTl ? "Wala pang ipon jar" : "No savings jars yet" }}
            </h2>
            <p class="mt-1 text-xs text-[var(--text-secondary)]">
              {{
                isTl
                  ? "Hatiin ang ipon para sa emergency fund, gadgets, o bakasyon — may awtomatikong pace bawat payday."
                  : "Split goals into Emergency Fund, Travel, or Tuition jars with automatic daily and payday saving pace."
              }}
            </p>
          </div>
          <button
            type="button"
            class="inline-flex items-center gap-1.5 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[var(--accent-hover)]"
            @click="openAddJar"
          >
            <Plus :size="14" aria-hidden="true" />
            <span>{{ isTl ? "Gumawa ng Unang Jar" : "Create First Jar" }}</span>
          </button>
        </div>

        <!-- Jars Grid -->
        <div v-else class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <article
            v-for="jar in savingsGoals"
            :key="jar.id"
            class="tipid-card relative flex flex-col justify-between overflow-hidden p-5"
          >
            <div
              class="absolute inset-x-0 top-0 h-1.5"
              :style="{ backgroundColor: jarColorHex(jar.color) }"
              aria-hidden="true"
            />

            <div>
              <div class="flex items-start justify-between gap-3 pt-1">
                <div class="flex min-w-0 items-center gap-3">
                  <div
                    class="tipid-icon-badge h-10 w-10 shrink-0 rounded-2xl"
                    :style="{
                      backgroundColor: `color-mix(in srgb, ${jarColorHex(jar.color)} 15%, transparent)`,
                      color: jarColorHex(jar.color)
                    }"
                    aria-hidden="true"
                  >
                    <CheckCircle2 v-if="jarProgressMap[jar.id]?.isCompleted" :size="20" />
                    <PiggyBank v-else :size="20" />
                  </div>
                  <div class="min-w-0">
                    <h2 class="truncate text-base font-bold text-[var(--text-primary)]">
                      {{ jar.name }}
                    </h2>
                    <div class="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
                      <span
                        v-if="jar.wallet"
                        class="inline-flex items-center gap-1 rounded-md bg-[var(--bg-inset)] px-1.5 py-0.5 font-medium text-[var(--text-secondary)]"
                      >
                        <Wallet :size="10" aria-hidden="true" />
                        <span>{{ resolveWalletVisual(jar.wallet).displayName }}</span>
                      </span>
                      <span v-if="jar.targetDate" class="inline-flex items-center gap-1 font-mono">
                        <Calendar :size="10" aria-hidden="true" />
                        <span>{{ jar.targetDate }}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <span
                  :class="[
                    'shrink-0 rounded-full px-2.5 py-0.5 font-mono text-[11px] font-bold',
                    jarProgressMap[jar.id]?.isCompleted
                      ? 'bg-[var(--income-soft)] text-[var(--income)]'
                      : 'bg-[var(--bg-inset)] text-[var(--text-secondary)]'
                  ]"
                >
                  {{
                    jarProgressMap[jar.id]?.isCompleted
                      ? (isTl ? "Tapos 100%" : "Funded 100%")
                      : `${jarProgressMap[jar.id]?.pct ?? 0}%`
                  }}
                </span>
              </div>

              <div class="mt-4 flex items-baseline justify-between gap-2">
                <p class="tipid-amount font-mono text-xl font-bold text-[var(--text-primary)]">
                  ₱{{ formatPeso(jar.savedAmount) }}
                  <span class="text-xs font-medium text-[var(--text-muted)]">/ ₱{{ formatPeso(jar.targetAmount) }}</span>
                </p>
                <span class="font-mono text-xs font-semibold text-[var(--text-secondary)]">
                  <template v-if="jarProgressMap[jar.id]?.isCompleted">
                    {{ isTl ? "Kumpleto!" : "Target reached" }}
                  </template>
                  <template v-else>
                    ₱{{ formatPeso(jarProgressMap[jar.id]?.remainingAmount ?? 0) }} {{ isTl ? "kulang" : "to go" }}
                  </template>
                </span>
              </div>

              <div class="mt-2">
                <progress
                  class="tipid-progress h-2 w-full"
                  :value="jarProgressMap[jar.id]?.pct ?? 0"
                  max="100"
                  :style="{ '--progress-bar-fill': jarColorHex(jar.color) }"
                  :aria-label="`${jar.name} progress ${jarProgressMap[jar.id]?.pct ?? 0}%`"
                />
              </div>

              <!-- Recommended Pace Pill Strip -->
              <div
                v-if="jarProgressMap[jar.id]?.suggestedDaily !== null && !jarProgressMap[jar.id]?.isCompleted"
                class="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-[var(--bg-inset)] px-3 py-2 text-[11px]"
              >
                <Target :size="13" class="shrink-0 text-[var(--accent)]" aria-hidden="true" />
                <span class="text-[var(--text-secondary)]">
                  <strong class="font-mono text-[var(--text-primary)]">₱{{ formatPeso(jarProgressMap[jar.id].suggestedDaily!) }}</strong>/{{ isTl ? "araw" : "day" }}
                </span>
                <span class="text-[var(--text-muted)]">·</span>
                <span class="text-[var(--text-secondary)]">
                  <strong class="font-mono text-[var(--text-primary)]">₱{{ formatPeso(jarProgressMap[jar.id].suggestedPayday!) }}</strong>/payday
                </span>
                <span class="ml-auto font-mono text-[var(--text-muted)]">
                  {{ jarProgressMap[jar.id].daysRemaining }}d
                </span>
              </div>
            </div>

            <div class="mt-4 flex items-center justify-between gap-2 border-t border-[var(--border-subtle)] pt-3">
              <button
                type="button"
                class="tipid-compact inline-flex items-center gap-1.5 rounded-xl bg-[var(--accent)] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[var(--accent-hover)]"
                @click="openDepositDialog(jar)"
              >
                <Coins :size="13" aria-hidden="true" />
                <span>{{ isTl ? "+ Mag-hulog" : "+ Deposit" }}</span>
              </button>

              <div class="flex items-center gap-1.5">
                <button
                  type="button"
                  class="tipid-compact tipid-compact-touch inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-inset)] hover:text-[var(--text-primary)]"
                  :aria-label="`Edit ${jar.name}`"
                  @click="openEditJar(jar)"
                >
                  <Pencil :size="14" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  class="tipid-compact tipid-compact-touch inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border-subtle)] text-[var(--text-muted)] hover:border-[var(--expense)]/40 hover:bg-[var(--expense-soft)] hover:text-[var(--expense)]"
                  :aria-label="`Delete ${jar.name}`"
                  @click="pendingDeleteJar = jar"
                >
                  <Trash2 :size="14" aria-hidden="true" />
                </button>
              </div>
            </div>
          </article>
        </div>
      </section>

      <!-- TAB PANEL 2: CATEGORY BUDGETS & SAFE-TO-SPEND -->
      <section
        id="plan-panel-budgets"
        role="tabpanel"
        aria-labelledby="plan-tab-budgets"
        :hidden="activeTab !== 'budgets'"
        class="space-y-5"
      >
        <!-- Hero Emerald Safe-to-Spend Card with Cycle Toggle -->
        <article class="tipid-card-emerald p-5 sm:p-6">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div class="min-w-0">
              <span class="tipid-eyebrow text-white/75">
                {{ isTl ? "LIGTAS GASTUSIN NGAYONG ARAW" : "SAFE-TO-SPEND TODAY" }}
              </span>
              <p class="tipid-amount mt-1.5 font-mono text-3xl font-bold tracking-tight text-white sm:text-4xl">
                <template v-if="safeToSpend.capAmount > 0">
                  ₱{{ formatPeso(safeToSpend.dailySafeSpend) }}<span class="text-base font-semibold text-white/75 sm:text-lg"> / {{ isTl ? "araw" : "day" }}</span>
                </template>
                <template v-else>
                  {{ isTl ? "Walang limit pa" : "No cycle cap" }}
                </template>
              </p>
              <p class="mt-1 text-xs text-white/80">
                {{ cycleRangeLabel }} ·
                <strong class="font-mono text-white">{{ safeToSpend.remainingDays }}</strong>
                {{ isTl ? "araw na natitira" : "days remaining" }}
              </p>
            </div>

            <!-- Budget Cycle Segmented Radio Toggle -->
            <fieldset class="inline-flex rounded-full border border-white/20 bg-white/12 p-1 backdrop-blur-xs">
              <legend class="visually-hidden">{{ isTl ? "Siklo ng badyet" : "Budget cycle" }}</legend>
              <label
                :class="[
                  'cursor-pointer rounded-full px-3 py-1 text-xs font-semibold transition-colors',
                  budgetCycle === 'monthly' ? 'bg-white text-[#0E7A53]' : 'text-white/85 hover:text-white'
                ]"
              >
                <input
                  type="radio"
                  name="plan-budget-cycle"
                  value="monthly"
                  :checked="budgetCycle === 'monthly'"
                  class="visually-hidden"
                  @change="handleCycleChange('monthly')"
                />
                {{ isTl ? "Buwanan" : "Monthly" }}
              </label>
              <label
                :class="[
                  'cursor-pointer rounded-full px-3 py-1 text-xs font-semibold transition-colors',
                  budgetCycle === 'kinsenas' ? 'bg-white text-[#0E7A53]' : 'text-white/85 hover:text-white'
                ]"
              >
                <input
                  type="radio"
                  name="plan-budget-cycle"
                  value="kinsenas"
                  :checked="budgetCycle === 'kinsenas'"
                  class="visually-hidden"
                  @change="handleCycleChange('kinsenas')"
                />
                Kinsenas
              </label>
            </fieldset>
          </div>

          <div class="mt-4 grid grid-cols-2 gap-2.5 border-t border-white/15 pt-4 sm:grid-cols-4">
            <div class="rounded-xl bg-white/10 p-3">
              <span class="block text-[10px] font-semibold uppercase tracking-wider text-white/70">
                {{ isTl ? "Cap ng Siklo" : "Cycle Cap" }}
              </span>
              <div class="mt-1 flex items-center justify-between gap-1">
                <span class="tipid-amount font-mono text-sm font-bold text-white">
                  {{ safeToSpend.capAmount > 0 ? `₱${formatPeso(safeToSpend.capAmount)}` : "Not set" }}
                </span>
                <button
                  type="button"
                  class="tipid-compact rounded-md bg-white/15 px-1.5 py-0.5 text-[10px] font-semibold text-white hover:bg-white/25"
                  @click="overallBudgetModalOpen = true"
                >
                  {{ t.commonEdit }}
                </button>
              </div>
            </div>

            <div class="rounded-xl bg-white/10 p-3">
              <span class="block text-[10px] font-semibold uppercase tracking-wider text-white/70">
                {{ isTl ? "Nagastos" : "Cycle Spent" }}
              </span>
              <p class="tipid-amount mt-1 font-mono text-sm font-bold text-white">
                ₱{{ formatPeso(safeToSpend.spentAmount) }}
              </p>
            </div>

            <div class="rounded-xl bg-white/10 p-3">
              <span class="block text-[10px] font-semibold uppercase tracking-wider text-white/70">
                {{ isTl ? "Natitirang Cap" : "Cap Remaining" }}
              </span>
              <p
                :class="[
                  'tipid-amount mt-1 font-mono text-sm font-bold',
                  safeToSpend.remainingBudget < 0 ? 'text-rose-200' : 'text-[#7BE5B5]'
                ]"
              >
                {{ safeToSpend.remainingBudget < 0 ? "-" : "" }}₱{{ formatPeso(Math.abs(safeToSpend.remainingBudget)) }}
              </p>
            </div>

            <div class="rounded-xl bg-white/10 p-3">
              <span class="block text-[10px] font-semibold uppercase tracking-wider text-white/70">
                {{ isTl ? "Matapos Bills" : "Free After Bills" }}
              </span>
              <p
                :class="[
                  'tipid-amount mt-1 font-mono text-sm font-bold',
                  safeToSpend.freeAfterBills < 0 ? 'text-rose-200' : 'text-[#7BE5B5]'
                ]"
              >
                {{ safeToSpend.freeAfterBills < 0 ? "-" : "" }}₱{{ formatPeso(Math.abs(safeToSpend.freeAfterBills)) }}
              </p>
            </div>
          </div>
        </article>

        <!-- Category Envelopes List -->
        <div class="space-y-3">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 class="text-base font-bold text-[var(--text-primary)]">
                {{ isTl ? "Mga Limit Bawat Kategorya" : "Category Envelopes" }}
              </h2>
              <p class="text-xs text-[var(--text-muted)]">
                {{ isTl ? "Nakatalagang kabuuan:" : "Total category caps:" }}
                <strong class="font-mono text-[var(--text-primary)]">₱{{ formatPeso(categoryBreakdown.totalCategoryCaps) }}</strong>
              </p>
            </div>

            <button
              type="button"
              class="tipid-compact inline-flex items-center gap-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-inset)]"
              @click="openAddCatBudget()"
            >
              <Plus :size="13" aria-hidden="true" />
              <span>{{ isTl ? "Magdagdag ng Kategorya" : "Add Envelope" }}</span>
            </button>
          </div>

          <div
            v-if="!loadingCategoryBudgets && categoryBreakdown.statuses.length === 0"
            class="tipid-card flex flex-col items-center gap-3 px-6 py-10 text-center"
          >
            <div class="tipid-icon-badge h-12 w-12 rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
              <ShieldCheck :size="22" aria-hidden="true" />
            </div>
            <div class="max-w-sm">
              <p class="text-sm font-bold text-[var(--text-primary)]">
                {{ isTl ? "Wala pang envelope limits" : "No category envelopes yet" }}
              </p>
              <p class="mt-1 text-xs text-[var(--text-secondary)]">
                {{
                  isTl
                    ? "Magtakda ng limit para sa Food, Transport, o Shopping para makita agad kapag malapit nang lumagpas."
                    : "Set spending limits for Food, Transport, or Shopping to catch overspending before payday."
                }}
              </p>
            </div>
            <button
              type="button"
              class="inline-flex items-center gap-1.5 rounded-xl bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white hover:bg-[var(--accent-hover)]"
              @click="openAddCatBudget()"
            >
              <Plus :size="14" aria-hidden="true" />
              <span>{{ isTl ? "Magtakda ng Unang Limit" : "Set First Envelope" }}</span>
            </button>
          </div>

          <div v-else class="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            <article
              v-for="item in categoryBreakdown.statuses"
              :key="item.id"
              class="tipid-card flex flex-col justify-between p-4"
            >
              <div>
                <div class="flex items-start justify-between gap-2">
                  <div class="flex min-w-0 items-center gap-2.5">
                    <div
                      class="tipid-icon-badge h-9 w-9 shrink-0 rounded-xl"
                      :style="{
                        backgroundColor: `color-mix(in srgb, ${getCategoryColor(item.category)} 15%, transparent)`,
                        color: getCategoryColor(item.category)
                      }"
                      aria-hidden="true"
                    >
                      <component :is="getCategoryIcon(item.category, 'expense')" :size="16" />
                    </div>
                    <div class="min-w-0">
                      <h3 class="truncate text-sm font-bold text-[var(--text-primary)]">
                        {{ item.category }}
                      </h3>
                      <p class="font-mono text-[11px] text-[var(--text-muted)]">
                        ₱{{ formatPeso(item.spentAmount) }} / ₱{{ formatPeso(item.limitAmount) }}
                      </p>
                    </div>
                  </div>

                  <span
                    :class="[
                      'inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold',
                      item.state === 'over'
                        ? 'bg-[var(--expense-soft)] text-[var(--expense)]'
                        : item.state === 'warning'
                          ? 'bg-[var(--warning-soft)] text-[var(--warning)]'
                          : 'bg-[var(--income-soft)] text-[var(--income)]'
                    ]"
                  >
                    <AlertTriangle v-if="item.state !== 'safe'" :size="11" aria-hidden="true" />
                    <CheckCircle2 v-else :size="11" aria-hidden="true" />
                    <span>
                      {{
                        item.state === "over"
                          ? `Over (${item.pct}%)`
                          : item.state === "warning"
                            ? `Near (${item.pct}%)`
                            : `${item.pct}%`
                      }}
                    </span>
                  </span>
                </div>

                <div class="mt-3">
                  <progress
                    class="tipid-progress h-2 w-full"
                    :value="Math.min(100, item.pct)"
                    max="100"
                    :style="{
                      '--progress-bar-fill':
                        item.state === 'over'
                          ? 'var(--expense)'
                          : item.state === 'warning'
                            ? 'var(--warning)'
                            : getCategoryColor(item.category)
                    }"
                    :aria-label="`${item.category} budget usage ${item.pct}%`"
                  />
                </div>
              </div>

              <div class="mt-3 flex items-center justify-between gap-2 border-t border-[var(--border-subtle)] pt-2.5 text-xs">
                <span
                  :class="[
                    'font-mono font-semibold',
                    item.remainingAmount < 0 ? 'text-[var(--expense)]' : 'text-[var(--text-secondary)]'
                  ]"
                >
                  <template v-if="item.remainingAmount < 0">
                    -₱{{ formatPeso(Math.abs(item.remainingAmount)) }} {{ isTl ? "lampas" : "over" }}
                  </template>
                  <template v-else>
                    ₱{{ formatPeso(item.remainingAmount) }} {{ isTl ? "natitira" : "left" }}
                  </template>
                </span>

                <div class="flex items-center gap-1">
                  <button
                    type="button"
                    class="tipid-compact tipid-compact-touch inline-flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-inset)] hover:text-[var(--text-primary)]"
                    :aria-label="`Edit ${item.category} limit`"
                    @click="openEditCatBudget(item)"
                  >
                    <Pencil :size="13" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    class="tipid-compact tipid-compact-touch inline-flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--expense-soft)] hover:text-[var(--expense)]"
                    :aria-label="`Delete ${item.category} limit`"
                    @click="pendingDeleteCat = { id: item.id, category: item.category }"
                  >
                    <Trash2 :size="13" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </article>
          </div>
        </div>

        <!-- Uncapped Categories with Activity in Current Cycle -->
        <div v-if="uncappedSpentCategories.length > 0" class="tipid-card p-4">
          <div class="flex items-center gap-2 text-xs font-bold text-[var(--text-secondary)]">
            <Tag :size="14" class="text-[var(--accent)]" aria-hidden="true" />
            <span>{{ isTl ? "May gastos ngayong siklo pero walang limit pa" : "Spent this cycle without a cap" }}</span>
          </div>
          <div class="mt-3 flex flex-wrap gap-2">
            <button
              v-for="[cat, amt] in uncappedSpentCategories"
              :key="cat"
              type="button"
              class="tipid-compact inline-flex items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-inset)]/60 px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]"
              @click="openAddCatBudget(cat)"
            >
              <span>{{ cat }}</span>
              <span class="font-mono text-[11px] text-[var(--text-muted)]">₱{{ formatPeso(amt) }}</span>
              <span class="text-[var(--accent)]">+ Cap</span>
            </button>
          </div>
        </div>
      </section>
    </div>

    <!-- Add / Edit Savings Jar Dialog -->
    <BaseDialog
      :open="jarModalOpen"
      :title="editingJar ? (isTl ? 'I-edit ang Ipon Jar' : 'Edit Savings Jar') : (isTl ? 'Bagong Ipon Jar' : 'New Savings Jar')"
      :subtitle="isTl ? 'Magtakda ng layunin, target na halaga, at kulay.' : 'Set a dedicated goal target and optional deadline.'"
      @close="jarModalOpen = false; editingJar = null"
    >
      <form class="space-y-4" novalidate @submit.prevent="submitJar">
        <div>
          <label for="jar-name" class="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">
            {{ isTl ? "Pangalan ng Goal" : "Goal Name" }}
          </label>
          <input
            id="jar-name"
            ref="jarNameRef"
            v-model="jarName"
            type="text"
            maxlength="80"
            required
            class="tipid-input text-base sm:text-sm"
            :placeholder="isTl ? 'hal. Emergency Fund, Bakasyon' : 'e.g. Emergency Fund, Laptop, Travel'"
            @input="jarError = ''"
          />
        </div>

        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label for="jar-target" class="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">
              {{ isTl ? "Target (PHP)" : "Target Amount (PHP)" }}
            </label>
            <div class="relative">
              <span class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-mono font-semibold text-[var(--text-muted)]">₱</span>
              <input
                id="jar-target"
                ref="jarTargetRef"
                v-model="jarTarget"
                type="number"
                inputmode="decimal"
                step="0.01"
                min="0.01"
                required
                class="tipid-input pl-8 font-mono text-base sm:text-sm"
                placeholder="10000.00"
                @input="jarError = ''"
              />
            </div>
          </div>

          <div>
            <label for="jar-saved" class="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">
              {{ isTl ? "Kasalukuyang Ipon (PHP)" : "Current Saved (PHP)" }}
            </label>
            <div class="relative">
              <span class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-mono font-semibold text-[var(--text-muted)]">₱</span>
              <input
                id="jar-saved"
                ref="jarSavedRef"
                v-model="jarSaved"
                type="number"
                inputmode="decimal"
                step="0.01"
                min="0"
                class="tipid-input pl-8 font-mono text-base sm:text-sm"
                placeholder="0.00"
                @input="jarError = ''"
              />
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label for="jar-wallet" class="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">
              {{ isTl ? "Wallet (Opsyonal)" : "Preferred Wallet (Optional)" }}
            </label>
            <select id="jar-wallet" v-model="jarWallet" class="tipid-input text-base sm:text-sm">
              <option value="">{{ isTl ? "Kahit anong wallet" : "Any wallet" }}</option>
              <option v-for="w in wallets" :key="w" :value="w">
                {{ resolveWalletVisual(w).displayName }}
              </option>
            </select>
          </div>

          <div>
            <label for="jar-date" class="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">
              {{ isTl ? "Target Date (Opsyonal)" : "Target Date (Optional)" }}
            </label>
            <input
              id="jar-date"
              v-model="jarTargetDate"
              type="date"
              class="tipid-input text-base sm:text-sm"
            />
          </div>
        </div>

        <fieldset class="space-y-1.5">
          <legend class="text-xs font-semibold text-[var(--text-secondary)]">
            {{ isTl ? "Kulay ng Jar" : "Accent Color" }}
          </legend>
          <div class="grid grid-cols-5 gap-1.5">
            <label
              v-for="c in JAR_COLORS"
              :key="c.id"
              :class="[
                'flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border px-2 py-2 text-[11px] font-semibold transition-colors',
                jarColor === c.id
                  ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--text-primary)]'
                  : 'border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]'
              ]"
            >
              <input v-model="jarColor" type="radio" name="jar-color" :value="c.id" class="visually-hidden" />
              <span class="h-2.5 w-2.5 shrink-0 rounded-full" :style="{ backgroundColor: c.hex }" aria-hidden="true" />
              <span class="hidden sm:inline">{{ isTl ? c.labelTl : c.labelEn }}</span>
            </label>
          </div>
        </fieldset>

        <p v-if="jarError" role="alert" class="rounded-xl bg-[var(--expense-soft)] px-3 py-2 text-xs font-medium text-[var(--expense)]">
          {{ jarError }}
        </p>

        <div class="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
          <button
            type="button"
            class="rounded-xl border border-[var(--border-strong)] px-4 py-2.5 text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-inset)]"
            :disabled="savingJar"
            @click="jarModalOpen = false; editingJar = null"
          >
            {{ t.commonCancel }}
          </button>
          <button
            type="submit"
            :disabled="savingJar"
            class="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--accent-hover)]"
          >
            <Loader2 v-if="savingJar" :size="15" class="animate-spin" aria-hidden="true" />
            <span>{{ savingJar ? t.commonSaving : t.commonSave }}</span>
          </button>
        </div>
      </form>
    </BaseDialog>

    <!-- Deposit to Savings Jar Dialog -->
    <BaseDialog
      :open="depositModalOpen"
      :title="depositTargetJar ? `${isTl ? 'Mag-hulog sa' : 'Deposit to'} ${depositTargetJar.name}` : 'Deposit'"
      :subtitle="isTl ? 'Idagdag ang bagong ipon sa jar.' : 'Record a contribution toward this goal jar.'"
      max-width-class="max-w-sm"
      @close="depositModalOpen = false; depositTargetJar = null"
    >
      <form v-if="depositTargetJar" class="space-y-4" novalidate @submit.prevent="submitDeposit">
        <div>
          <label for="deposit-amount" class="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">
            {{ isTl ? "Halaga ng Hulog (PHP)" : "Deposit Amount (PHP)" }}
          </label>
          <div class="relative">
            <span class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-mono font-semibold text-[var(--text-muted)]">₱</span>
            <input
              id="deposit-amount"
              ref="depositAmountRef"
              v-model="depositAmount"
              type="number"
              inputmode="decimal"
              step="0.01"
              min="0.01"
              required
              class="tipid-input pl-8 font-mono text-lg font-bold"
              placeholder="500.00"
              @input="depositError = ''"
            />
          </div>
          <p v-if="depositInsufficient" class="mt-1 text-xs font-medium text-[var(--expense)]">
            {{
              isTl
                ? `Short ng ₱${formatPeso(parsedDepositAmount - selectedDepositWalletBalance)} sa ${resolveWalletVisual(depositWallet).displayName}`
                : `Short by ₱${formatPeso(parsedDepositAmount - selectedDepositWalletBalance)} in ${resolveWalletVisual(depositWallet).displayName}`
            }}
          </p>
        </div>

        <label class="flex cursor-pointer items-start gap-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-inset)]/60 p-3 text-xs">
          <input v-model="deductWalletEnabled" type="checkbox" class="tipid-checkbox mt-0.5 shrink-0" />
          <span>
            <strong class="block font-semibold text-[var(--text-primary)]">
              {{ isTl ? "Ibawas sa balanse ng wallet" : "Deduct from wallet balance" }}
            </strong>
            <span class="text-[var(--text-muted)]">
              {{ isTl ? "Magtatala ng 'Savings' entry mula sa napiling wallet." : "Logs a matching Savings entry from the chosen wallet." }}
            </span>
          </span>
        </label>

        <div v-if="deductWalletEnabled">
          <label for="deposit-wallet" class="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">
            {{ isTl ? "Kukunin mula sa Wallet" : "Source Wallet" }}
          </label>
          <select id="deposit-wallet" v-model="depositWallet" class="tipid-input text-base sm:text-sm" @change="depositError = ''">
            <option v-for="w in wallets" :key="w" :value="w">
              {{ resolveWalletVisual(w).displayName }} (₱{{ formatPeso(walletBalances[w] ?? 0) }})
            </option>
          </select>
        </div>

        <p v-if="depositError" role="alert" class="rounded-xl bg-[var(--expense-soft)] px-3 py-2 text-xs font-medium text-[var(--expense)]">
          {{ depositError }}
        </p>

        <div class="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
          <button
            type="button"
            class="rounded-xl border border-[var(--border-strong)] px-4 py-2.5 text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-inset)]"
            :disabled="savingDeposit"
            @click="depositModalOpen = false; depositTargetJar = null"
          >
            {{ t.commonCancel }}
          </button>
          <button
            type="submit"
            :disabled="savingDeposit"
            class="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--accent-hover)]"
          >
            <Loader2 v-if="savingDeposit" :size="15" class="animate-spin" aria-hidden="true" />
            <ArrowDownLeft v-else :size="15" aria-hidden="true" />
            <span>{{ savingDeposit ? t.commonSaving : (isTl ? "Ihulog Ngayon" : "Confirm Deposit") }}</span>
          </button>
        </div>
      </form>
    </BaseDialog>

    <!-- Add / Edit Category Limit Dialog -->
    <BaseDialog
      :open="catModalOpen"
      :title="editingCatBudget ? (isTl ? 'I-edit ang Limit' : 'Edit Category Limit') : (isTl ? 'Bagong Category Limit' : 'Add Category Envelope')"
      :subtitle="isTl ? 'Badyet para sa aktibong siklo.' : 'Spending limit applied to your active budget cycle.'"
      max-width-class="max-w-sm"
      @close="catModalOpen = false; editingCatBudget = null"
    >
      <form class="space-y-4" novalidate @submit.prevent="submitCatBudget">
        <div>
          <label for="cat-budget-category" class="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">
            {{ isTl ? "Kategorya" : "Category" }}
          </label>
          <select id="cat-budget-category" v-model="catName" class="tipid-input text-base sm:text-sm" @change="catError = ''">
            <option v-for="c in selectableCategories" :key="c" :value="c">{{ c }}</option>
          </select>
        </div>

        <div>
          <label for="cat-budget-limit" class="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">
            {{ isTl ? "Limit sa Siklo (PHP)" : "Cycle Limit (PHP)" }}
          </label>
          <div class="relative">
            <span class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-mono font-semibold text-[var(--text-muted)]">₱</span>
            <input
              id="cat-budget-limit"
              ref="catLimitRef"
              v-model="catLimit"
              type="number"
              inputmode="decimal"
              step="10"
              min="1"
              required
              class="tipid-input pl-8 font-mono text-base sm:text-sm"
              placeholder="3000.00"
              @input="catError = ''"
            />
          </div>
        </div>

        <p v-if="catError" role="alert" class="rounded-xl bg-[var(--expense-soft)] px-3 py-2 text-xs font-medium text-[var(--expense)]">
          {{ catError }}
        </p>

        <div class="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
          <button
            type="button"
            class="rounded-xl border border-[var(--border-strong)] px-4 py-2.5 text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-inset)]"
            :disabled="savingCatBudget"
            @click="catModalOpen = false; editingCatBudget = null"
          >
            {{ t.commonCancel }}
          </button>
          <button
            type="submit"
            :disabled="savingCatBudget"
            class="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--accent-hover)]"
          >
            <Loader2 v-if="savingCatBudget" :size="15" class="animate-spin" aria-hidden="true" />
            <span>{{ savingCatBudget ? t.commonSaving : t.commonSave }}</span>
          </button>
        </div>
      </form>
    </BaseDialog>

    <BudgetModal
      v-if="user"
      :open="overallBudgetModalOpen"
      :uid="user.uid"
      :current-budget="budget"
      @close="overallBudgetModalOpen = false"
    />

    <ConfirmDialog
      :open="Boolean(pendingDeleteJar)"
      :title="isTl ? 'Burahin ang ipon jar?' : 'Delete savings jar?'"
      :message="
        pendingDeleteJar
          ? `Remove '${pendingDeleteJar.name}' (₱${formatPeso(pendingDeleteJar.savedAmount)} saved)? Existing wallet transactions are kept.`
          : ''
      "
      :loading="deletingJar"
      @cancel="pendingDeleteJar = null"
      @confirm="confirmDeleteJar"
    />

    <ConfirmDialog
      :open="Boolean(pendingDeleteCat)"
      :title="isTl ? 'Tanggalin ang category limit?' : 'Remove category envelope?'"
      :message="
        pendingDeleteCat
          ? `Remove the spending cap for ${pendingDeleteCat.category}? Your transaction history remains unchanged.`
          : ''
      "
      :loading="deletingCat"
      @cancel="pendingDeleteCat = null"
      @confirm="confirmDeleteCatBudget"
    />
  </AppShell>
</template>

<style scoped>
.plan-tab {
  position: relative;
}

.plan-tab[aria-selected="true"]::after {
  content: "";
  position: absolute;
  inset-inline: 0;
  inset-block-end: 0;
  border-block-end: 3px solid var(--accent);
  border-radius: 9999px;
}
</style>
