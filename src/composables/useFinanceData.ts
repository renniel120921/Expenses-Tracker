import { ref, reactive, computed, watch, watchEffect, onUnmounted, type Ref } from "vue";
import type { Unsubscribe } from "firebase/firestore";
import type { AssistantLedgerSnapshot } from "@/lib/assistantEngine";
import {
  subscribeEntries,
  subscribeUserDoc,
  subscribeBills,
  subscribeUtang,
  subscribeSavingsGoals,
  subscribeCategoryBudgets,
  ensureDefaultWallet,
  isPermissionDeniedError
} from "@/lib/data";
import { walletBalances as computeWalletBalances, sumActiveWalletsBalance } from "@/lib/core";
import { setLanguage } from "@/lib/i18n";
import { ensureUserCountedInStats } from "@/lib/publicStats";
import type {
  BillRecord,
  BudgetCycle,
  CategoryBudgetRecord,
  FinancialGoal,
  NotificationSettings,
  SavingsGoalRecord,
  TransactionEntry,
  UtangRecord
} from "@/types/finance";

export interface UseFinanceOptions {
  withBills?: boolean;
  withUtang?: boolean;
  withSavingsGoals?: boolean;
  withCategoryBudgets?: boolean;
}

const sharedLedgerUid = ref<string | null>(null);
const activeConsumerUids = new Map<symbol, string>();
const sharedLedgerState = reactive<AssistantLedgerSnapshot>({
  entries: [],
  budget: null,
  budgetCycle: "monthly",
  wallets: ["Cash"],
  walletBalances: { Cash: 0 },
  overallBalance: 0,
  bills: [],
  utangList: [],
  savingsGoals: [],
  categoryBudgets: []
});

function resetSharedLedger(nextUid: string | null): void {
  sharedLedgerUid.value = nextUid;
  sharedLedgerState.entries = [];
  sharedLedgerState.budget = null;
  sharedLedgerState.budgetCycle = "monthly";
  sharedLedgerState.wallets = ["Cash"];
  sharedLedgerState.walletBalances = { Cash: 0 };
  sharedLedgerState.overallBalance = 0;
  sharedLedgerState.bills = [];
  sharedLedgerState.utangList = [];
  sharedLedgerState.savingsGoals = [];
  sharedLedgerState.categoryBudgets = [];
}

/** Exposes the active user's sanitized shared ledger snapshot for global workspace tools (e.g. AI Coach). */
export function useSharedFinanceSnapshot(): AssistantLedgerSnapshot {
  return sharedLedgerState;
}

export function useFinanceData(uidRef: Ref<string | undefined>, options: UseFinanceOptions = {}) {
  const entries = ref<TransactionEntry[]>([]);
  const loadingEntries = ref(true);
  const budget = ref<number | null>(null);
  const budgetCycle = ref<BudgetCycle>("monthly");
  const baseBalances = ref<Record<string, number>>({ Cash: 0 });
  const goals = ref<FinancialGoal>({});
  const notificationSettings = ref<NotificationSettings>({});
  const bills = ref<BillRecord[]>([]);
  const loadingBills = ref(Boolean(options.withBills));
  const utangList = ref<UtangRecord[]>([]);
  const loadingUtang = ref(Boolean(options.withUtang));
  const savingsGoals = ref<SavingsGoalRecord[]>([]);
  const loadingSavingsGoals = ref(Boolean(options.withSavingsGoals));
  const categoryBudgets = ref<CategoryBudgetRecord[]>([]);
  const loadingCategoryBudgets = ref(Boolean(options.withCategoryBudgets));
  const planRulesBlocked = ref(false);
  const userDocLoaded = ref(false);

  const walletBalances = computed(() => computeWalletBalances(entries.value, baseBalances.value));

  const wallets = computed(() => {
    const keys = Object.keys(baseBalances.value);
    return keys.includes("Cash") ? keys : ["Cash", ...keys];
  });

  const overallBalance = computed(() =>
    sumActiveWalletsBalance(wallets.value, walletBalances.value)
  );

  let unsubs: Unsubscribe[] = [];
  const consumerId = Symbol("useFinanceData");

  function cleanup(): void {
    unsubs.forEach((fn) => fn());
    unsubs = [];
  }

  watch(
    uidRef,
    (uid) => {
      cleanup();
      planRulesBlocked.value = false;
      userDocLoaded.value = false;
      if (!uid) {
        activeConsumerUids.delete(consumerId);
        if (activeConsumerUids.size === 0) {
          resetSharedLedger(null);
        }
        return;
      }
      activeConsumerUids.set(consumerId, uid);
      if (sharedLedgerUid.value !== uid) {
        resetSharedLedger(uid);
      }

      loadingEntries.value = true;
      unsubs.push(
        subscribeEntries(
          uid,
          (list) => {
            entries.value = list;
            loadingEntries.value = false;
          },
          () => {
            loadingEntries.value = false;
          }
        )
      );

      let seededWallet = false;
      let statsChecked = false;
      unsubs.push(
        subscribeUserDoc(uid, (docData) => {
          userDocLoaded.value = true;
          budget.value = docData.monthlyBudget ?? null;
          budgetCycle.value = docData.budgetCycle === "kinsenas" ? "kinsenas" : "monthly";
          if (docData.wallets && Object.keys(docData.wallets).length > 0) {
            baseBalances.value = { ...docData.wallets };
          } else {
            baseBalances.value = { Cash: 0 };
            if (!seededWallet) {
              seededWallet = true;
              void ensureDefaultWallet(uid).catch(() => {});
            }
          }
          const canCheckOnline = typeof navigator === "undefined" || navigator.onLine !== false;
          if (!statsChecked && canCheckOnline) {
            statsChecked = true;
            if (docData.statsCounted !== true) {
              void ensureUserCountedInStats(uid);
            }
          }
          goals.value = docData.financialGoals || {};
          notificationSettings.value = docData.notificationSettings || {};
          const docLang = docData.preferences?.lang || docData.lang;
          if (docLang === "tl" || docLang === "en") {
            setLanguage(docLang, uid);
          }
        })
      );

      if (options.withBills) {
        loadingBills.value = true;
        unsubs.push(
          subscribeBills(
            uid,
            (list) => {
              bills.value = list;
              loadingBills.value = false;
            },
            () => {
              loadingBills.value = false;
            }
          )
        );
      }

      if (options.withUtang) {
        loadingUtang.value = true;
        unsubs.push(
          subscribeUtang(
            uid,
            (list) => {
              utangList.value = list;
              loadingUtang.value = false;
            },
            () => {
              loadingUtang.value = false;
            }
          )
        );
      }

      if (options.withSavingsGoals) {
        loadingSavingsGoals.value = true;
        unsubs.push(
          subscribeSavingsGoals(
            uid,
            (list) => {
              savingsGoals.value = list;
              loadingSavingsGoals.value = false;
            },
            (err) => {
              loadingSavingsGoals.value = false;
              if (isPermissionDeniedError(err)) {
                planRulesBlocked.value = true;
              }
            }
          )
        );
      }

      if (options.withCategoryBudgets) {
        loadingCategoryBudgets.value = true;
        unsubs.push(
          subscribeCategoryBudgets(
            uid,
            (list) => {
              categoryBudgets.value = list;
              loadingCategoryBudgets.value = false;
            },
            (err) => {
              loadingCategoryBudgets.value = false;
              if (isPermissionDeniedError(err)) {
                planRulesBlocked.value = true;
              }
            }
          )
        );
      }
    },
    { immediate: true }
  );

  watchEffect(() => {
    const uid = uidRef.value;
    if (!uid || sharedLedgerUid.value !== uid) return;
    if (!loadingEntries.value) {
      sharedLedgerState.entries = entries.value;
    }
    if (userDocLoaded.value) {
      sharedLedgerState.budget = budget.value;
      sharedLedgerState.budgetCycle = budgetCycle.value;
      sharedLedgerState.wallets = wallets.value;
      sharedLedgerState.walletBalances = walletBalances.value;
      sharedLedgerState.overallBalance = overallBalance.value;
    }
    if (options.withBills && !loadingBills.value) {
      sharedLedgerState.bills = bills.value;
    }
    if (options.withUtang && !loadingUtang.value) {
      sharedLedgerState.utangList = utangList.value;
    }
    if (options.withSavingsGoals && !loadingSavingsGoals.value) {
      sharedLedgerState.savingsGoals = savingsGoals.value;
    }
    if (options.withCategoryBudgets && !loadingCategoryBudgets.value) {
      sharedLedgerState.categoryBudgets = categoryBudgets.value;
    }
  });

  onUnmounted(() => {
    activeConsumerUids.delete(consumerId);
    cleanup();
    if (activeConsumerUids.size === 0) {
      resetSharedLedger(null);
    }
  });

  return {
    entries,
    loadingEntries,
    budget,
    budgetCycle,
    baseBalances,
    walletBalances,
    overallBalance,
    wallets,
    goals,
    notificationSettings,
    bills,
    loadingBills,
    utangList,
    loadingUtang,
    savingsGoals,
    loadingSavingsGoals,
    categoryBudgets,
    loadingCategoryBudgets,
    planRulesBlocked
  };
}
