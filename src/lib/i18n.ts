import { ref, computed } from "vue";
import type { LanguageCode } from "@/types/finance";
import { storageKey } from "./core";

export interface TranslationDictionary {
  navHome: string;
  navHistory: string;
  navAnalytics: string;
  navPlan: string;
  navBills: string;
  navUtang: string;
  navProfile: string;
  navLogout: string;
  navDark: string;
  navLight: string;
  navSystem: string;

  dashTitle: string;
  dashSubtitle: string;
  thisMonth: string;
  thisWeek: string;
  last30Days: string;
  allTime: string;
  addTransaction: string;
  netBalance: string;
  monthInflow: string;
  monthOutflow: string;
  monthlyBudget: string;
  walletsHeading: string;
  addWallet: string;
  cashFlowHeading: string;
  commitmentsHeading: string;
  recentLogsHeading: string;
  viewAll: string;

  historyTitle: string;
  historySubtitle: string;
  exportCsv: string;
  printStatement: string;

  analyticsTitle: string;
  analyticsSubtitle: string;

  planTitle: string;
  planSubtitle: string;

  billsTitle: string;
  billsSubtitle: string;
  addBill: string;

  utangTitle: string;
  utangSubtitle: string;
  addUtang: string;

  profileTitle: string;
  profileSubtitle: string;

  commonSave: string;
  commonSaving: string;
  commonCancel: string;
  commonDelete: string;
  commonEdit: string;
  commonSearch: string;
  commonAll: string;
  commonBack: string;
}

const DICTIONARIES: Record<LanguageCode, TranslationDictionary> = {
  en: {
    navHome: "Overview",
    navHistory: "History",
    navAnalytics: "Analytics",
    navPlan: "Plan",
    navBills: "Bills",
    navUtang: "Utang",
    navProfile: "Settings",
    navLogout: "Sign out",
    navDark: "Dark",
    navLight: "Light",
    navSystem: "System",

    dashTitle: "Overview",
    dashSubtitle: "Balances, cash flow, and upcoming commitments.",
    thisMonth: "This Month",
    thisWeek: "This Week",
    last30Days: "30 Days",
    allTime: "All Time",
    addTransaction: "Add Transaction",
    netBalance: "Net Balance",
    monthInflow: "Month Inflow",
    monthOutflow: "Month Outflow",
    monthlyBudget: "Monthly Budget",
    walletsHeading: "Accounts & Wallets",
    addWallet: "Add Account",
    cashFlowHeading: "Spending Trajectory",
    commitmentsHeading: "Commitments Due",
    recentLogsHeading: "Recent Transactions",
    viewAll: "View all",

    historyTitle: "Transactions",
    historySubtitle: "Search, inspect receipts, and export your ledger.",
    exportCsv: "Export CSV",
    printStatement: "Print",

    analyticsTitle: "Analytics",
    analyticsSubtitle: "Spending breakdown by category, wallet, and essentials ratio.",

    planTitle: "Budgets & Goals",
    planSubtitle: "Category limits, safe daily spend, and savings jars.",

    billsTitle: "Bills Schedule",
    billsSubtitle: "Track recurring utilities, subscriptions, and due dates.",
    addBill: "Add Bill",

    utangTitle: "Utang Ledger",
    utangSubtitle: "Monitor receivables owed to you and balances you owe.",
    addUtang: "Record Utang",

    profileTitle: "Settings & Security",
    profileSubtitle: "Manage your profile, budget limits, preferences, and app lock.",

    commonSave: "Save",
    commonSaving: "Saving...",
    commonCancel: "Cancel",
    commonDelete: "Delete",
    commonEdit: "Edit",
    commonSearch: "Search...",
    commonAll: "All",
    commonBack: "Back"
  },
  tl: {
    navHome: "Buod",
    navHistory: "Talaan",
    navAnalytics: "Tsart",
    navPlan: "Plano",
    navBills: "Bills",
    navUtang: "Utang",
    navProfile: "Settings",
    navLogout: "Mag-log out",
    navDark: "Madilim",
    navLight: "Maliwanag",
    navSystem: "System",

    dashTitle: "Pangkalahatang Buod",
    dashSubtitle: "Balanse, daloy ng pera, at mga nakatakdang bayarin.",
    thisMonth: "Ngayong Buwan",
    thisWeek: "Ngayong Linggo",
    last30Days: "30 Araw",
    allTime: "Lahat",
    addTransaction: "Magtala",
    netBalance: "Kabuuang Balanse",
    monthInflow: "Kita Ngayong Buwan",
    monthOutflow: "Gastos Ngayong Buwan",
    monthlyBudget: "Buwanang Badyet",
    walletsHeading: "Mga Wallet at Account",
    addWallet: "Magdagdag",
    cashFlowHeading: "Takbo ng Gastos",
    commitmentsHeading: "Nakatakdang Bayarin",
    recentLogsHeading: "Kamakailang Transaksyon",
    viewAll: "Tingnan lahat",

    historyTitle: "Kasaysayan ng Talaan",
    historySubtitle: "Maghanap, suriin ang detalye, o mag-export ng CSV.",
    exportCsv: "I-export CSV",
    printStatement: "I-print",

    analyticsTitle: "Pagsusuri",
    analyticsSubtitle: "Distribusyon ng gastos ayon sa kategorya, wallet, at Need vs Want.",

    planTitle: "Badyet at Ipon",
    planSubtitle: "Limit bawat kategorya, safe spend bawat araw, at savings jars.",

    billsTitle: "Mga Bayarin",
    billsSubtitle: "Subaybayan ang nakatakda at overdue na mga bayarin.",
    addBill: "Magdagdag ng Bill",

    utangTitle: "Talaan ng Utang",
    utangSubtitle: "Subaybayan ang pautang at mga halagang dapat bayaran.",
    addUtang: "Itala ang Utang",

    profileTitle: "Mga Setting at Seguridad",
    profileSubtitle: "I-update ang profile, badyet, wika, at biometric/PIN lock.",

    commonSave: "I-save",
    commonSaving: "Inise-save...",
    commonCancel: "Kanselahin",
    commonDelete: "Burahin",
    commonEdit: "I-edit",
    commonSearch: "Maghanap...",
    commonAll: "Lahat",
    commonBack: "Bumalik"
  }
};

function readInitialLang(): LanguageCode {
  try {
    return localStorage.getItem("tipid_lang") === "tl" ? "tl" : "en";
  } catch {
    return "en";
  }
}

const currentLang = ref<LanguageCode>(readInitialLang());

export function setLanguage(lang: LanguageCode, uid?: string): LanguageCode {
  const safeLang: LanguageCode = lang === "tl" ? "tl" : "en";
  currentLang.value = safeLang;
  try {
    localStorage.setItem("tipid_lang", safeLang);
    if (uid) {
      localStorage.setItem(storageKey(uid, "lang"), safeLang);
    }
    if (typeof document !== "undefined") {
      document.documentElement.lang = safeLang === "tl" ? "fil" : "en";
    }
  } catch {
    // ignore storage errors
  }
  return safeLang;
}

export function loadUserLanguage(uid: string): LanguageCode {
  try {
    const val = localStorage.getItem(storageKey(uid, "lang"));
    if (val === "tl" || val === "en") {
      return setLanguage(val, uid);
    }
  } catch {
    // ignore
  }
  return currentLang.value;
}

export function useI18n() {
  const t = computed(() => DICTIONARIES[currentLang.value] || DICTIONARIES.en);
  const isTl = computed(() => currentLang.value === "tl");
  return {
    lang: currentLang,
    isTl,
    t,
    setLanguage
  };
}
