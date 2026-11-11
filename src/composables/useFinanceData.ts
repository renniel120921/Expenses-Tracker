import { ref, computed, watch, onUnmounted, type Ref } from "vue";
import type { Unsubscribe } from "firebase/firestore";
import {
  subscribeEntries,
  subscribeUserDoc,
  subscribeBills,
  subscribeUtang,
  ensureDefaultWallet
} from "@/lib/data";
import { walletBalances as computeWalletBalances, toCentavos, fromCentavos } from "@/lib/core";
import { setLanguage } from "@/lib/i18n";
import { ensureUserCountedInStats } from "@/lib/publicStats";
import type {
  BillRecord,
  FinancialGoal,
  NotificationSettings,
  TransactionEntry,
  UtangRecord
} from "@/types/finance";

export interface UseFinanceOptions {
  withBills?: boolean;
  withUtang?: boolean;
}

export function useFinanceData(uidRef: Ref<string | undefined>, options: UseFinanceOptions = {}) {
  const entries = ref<TransactionEntry[]>([]);
  const loadingEntries = ref(true);
  const budget = ref<number | null>(null);
  const baseBalances = ref<Record<string, number>>({ Cash: 0 });
  const goals = ref<FinancialGoal>({});
  const notificationSettings = ref<NotificationSettings>({});
  const bills = ref<BillRecord[]>([]);
  const loadingBills = ref(Boolean(options.withBills));
  const utangList = ref<UtangRecord[]>([]);
  const loadingUtang = ref(Boolean(options.withUtang));

  const walletBalances = computed(() => computeWalletBalances(entries.value, baseBalances.value));

  const overallBalance = computed(() => {
    const cents = Object.values(walletBalances.value).reduce((sum, val) => {
      const n = Number(val) || 0;
      return sum + Math.sign(n) * toCentavos(Math.abs(n), { allowZero: true });
    }, 0);
    return fromCentavos(cents);
  });

  const wallets = computed(() => {
    const keys = Object.keys(baseBalances.value);
    return keys.includes("Cash") ? keys : ["Cash", ...keys];
  });

  let unsubs: Unsubscribe[] = [];

  function cleanup(): void {
    unsubs.forEach((fn) => fn());
    unsubs = [];
  }

  watch(
    uidRef,
    (uid) => {
      cleanup();
      if (!uid) return;

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
          budget.value = docData.monthlyBudget ?? null;
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
    },
    { immediate: true }
  );

  onUnmounted(cleanup);

  return {
    entries,
    loadingEntries,
    budget,
    baseBalances,
    walletBalances,
    overallBalance,
    wallets,
    goals,
    notificationSettings,
    bills,
    loadingBills,
    utangList,
    loadingUtang
  };
}
