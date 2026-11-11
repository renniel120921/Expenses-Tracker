<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted } from "vue";
import {
  ArrowRight,
  Plus,
  X,
  ShieldCheck,
  Sun,
  Moon,
  Monitor,
  Wallet,
  ListOrdered,
  PieChart,
  ReceiptText,
  Coffee,
  Bus,
  Utensils,
  RotateCcw,
  Wifi,
  WifiOff,
  Smartphone,
  Fingerprint,
  FileSpreadsheet,
  Users,
  CheckCircle2,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowUp,
  ArrowDown,
  Download,
  Database,
  RefreshCw,
  HardDrive
} from "@lucide/vue";
import { CATEGORIES, formatPeso, getCategoryColor, SUPPORTED_WALLETS } from "@/lib/core";
import { parseTransactionSms } from "@/lib/smsParser";
import { setLanguage, useI18n } from "@/lib/i18n";
import { useTheme } from "@/composables/useTheme";
import { subscribePublicUserCount, type PublicUserCountSnapshot } from "@/lib/publicStats";
import { networkOnline } from "@/lib/offlineSync";
import { swReady } from "@/lib/swRegistration";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const { isTl, lang } = useI18n();
const { themePreference, toggleQuickTheme } = useTheme();

/* ---- Live Public User Counter (Firestore appStats/public + Offline Cache) ---- */
const userStats = ref<PublicUserCountSnapshot>({
  totalUsers: null,
  source: "unavailable"
});

const formattedUserCount = computed(() => {
  if (userStats.value.totalUsers === null) return "--";
  return new Intl.NumberFormat("en-US").format(userStats.value.totalUsers);
});

const userCountBadgeLabel = computed(() => {
  if (userStats.value.totalUsers === null) {
    if (import.meta.env.DEV && userStats.value.errorCode === "permission-denied") {
      return isTl.value ? "I-publish ang firestore.rules" : "Publish firestore.rules";
    }
    return isTl.value ? "Nakahanda sa Firestore" : "Awaiting stats sync";
  }
  if (!networkOnline.value || userStats.value.source === "cache") {
    return isTl.value ? "Naka-cache offline" : "Cached for offline";
  }
  return isTl.value ? "Live mula Firebase" : "Live from Firestore";
});

/* ---- Device Offline Readiness & Installable PWA Support ---- */
const idbSupported = typeof window !== "undefined" && "indexedDB" in window;
const deferredInstallPrompt = ref<BeforeInstallPromptEvent | null>(null);
const pwaInstalled = ref(false);

async function triggerPwaInstall() {
  const evt = deferredInstallPrompt.value;
  if (!evt) return;
  try {
    await evt.prompt();
    const choice = await evt.userChoice;
    if (choice.outcome === "accepted") {
      pwaInstalled.value = true;
    }
  } catch {
    // ignore cancelled prompt
  } finally {
    deferredInstallPrompt.value = null;
  }
}

let unsubStats: (() => void) | null = null;
const onBeforeInstall = (e: Event) => {
  e.preventDefault();
  deferredInstallPrompt.value = e as BeforeInstallPromptEvent;
};
const onAppInstalled = () => {
  pwaInstalled.value = true;
  deferredInstallPrompt.value = null;
};

onMounted(() => {
  unsubStats = subscribePublicUserCount((snap) => {
    userStats.value = snap;
  });
  window.addEventListener("beforeinstallprompt", onBeforeInstall);
  window.addEventListener("appinstalled", onAppInstalled);
});

onUnmounted(() => {
  unsubStats?.();
  window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  window.removeEventListener("appinstalled", onAppInstalled);
});

/* ---- Interactive Daily Cap Bento Sandbox (Hero) ---- */
interface DemoItem {
  id: number;
  desc: string;
  cat: string;
  amount: number;
  time: string;
}

const DEFAULT_DEMO_ITEMS: Omit<DemoItem, "id">[] = [
  { desc: "Lunch Meal", cat: "Food & Dining", amount: 110, time: "12:30 PM" },
  { desc: "Commute & Transit", cat: "Transportation", amount: 45, time: "08:45 AM" },
  { desc: "Prepaid Data", cat: "Mobile & Data", amount: 50, time: "07:15 AM" }
];

let nextId = 4;
const items = ref<DemoItem[]>(
  DEFAULT_DEMO_ITEMS.map((item, idx) => ({ ...item, id: idx + 1 }))
);
const descInput = ref("");
const amountInput = ref("");

const DAILY_LIMIT = 500;
const totalSpent = computed(() => items.value.reduce((sum, i) => sum + i.amount, 0));
const remaining = computed(() => Math.max(0, DAILY_LIMIT - totalSpent.value));
const usedPct = computed(() => Math.min(100, Math.round((totalSpent.value / DAILY_LIMIT) * 100)));

function currentTimeLabel(): string {
  return new Date().toLocaleTimeString("en-PH", {
    hour: "numeric",
    minute: "2-digit"
  });
}

function addDemoItem() {
  const amt = Number(amountInput.value);
  if (!descInput.value.trim() || !Number.isFinite(amt) || amt <= 0) return;
  items.value.unshift({
    id: nextId++,
    desc: descInput.value.trim(),
    cat: isTl.value ? "Gastos" : "Expense",
    amount: Math.round(amt * 100) / 100,
    time: currentTimeLabel()
  });
  descInput.value = "";
  amountInput.value = "";
}

function addPreset(desc: string, cat: string, amount: number) {
  items.value.unshift({
    id: nextId++,
    desc,
    cat,
    amount,
    time: currentTimeLabel()
  });
}

function removeItem(id: number) {
  items.value = items.value.filter((i) => i.id !== id);
}

function resetDemo() {
  items.value = DEFAULT_DEMO_ITEMS.map((item) => ({ ...item, id: nextId++ }));
}

function switchLanguage() {
  setLanguage(lang.value === "tl" ? "en" : "tl");
}

/* ---- Interactive Workspace Tour Tabs ---- */
type TourTabId = "overview" | "sms" | "commitments" | "analytics";
const activeTourTab = ref<TourTabId>("overview");
const tabButtonRefs = ref<Array<HTMLButtonElement | null>>([]);

const tourTabs = computed<Array<{ id: TourTabId; domId: string; label: string }>>(() =>
  isTl.value
    ? [
        { id: "overview", domId: "tour-tab-overview", label: "Overview" },
        { id: "sms", domId: "tour-tab-sms", label: "SMS Auto-Fill" },
        { id: "commitments", domId: "tour-tab-commitments", label: "Bills & Utang" },
        { id: "analytics", domId: "tour-tab-analytics", label: "Analytics & Export" }
      ]
    : [
        { id: "overview", domId: "tour-tab-overview", label: "Overview" },
        { id: "sms", domId: "tour-tab-sms", label: "SMS Auto-Fill" },
        { id: "commitments", domId: "tour-tab-commitments", label: "Bills & Utang" },
        { id: "analytics", domId: "tour-tab-analytics", label: "Analytics & Export" }
      ]
);

function selectTourTab(id: TourTabId, focusIndex?: number) {
  activeTourTab.value = id;
  if (typeof focusIndex === "number") {
    void nextTick(() => {
      const btn = tabButtonRefs.value[focusIndex];
      btn?.focus();
      btn?.scrollIntoView({ block: "nearest", inline: "nearest" });
    });
  }
}

function handleTabKeydown(event: KeyboardEvent, idx: number) {
  const count = tourTabs.value.length;
  let nextIdx: number | null = null;
  if (event.key === "ArrowRight") nextIdx = (idx + 1) % count;
  else if (event.key === "ArrowLeft") nextIdx = (idx - 1 + count) % count;
  else if (event.key === "Home") nextIdx = 0;
  else if (event.key === "End") nextIdx = count - 1;

  if (nextIdx !== null) {
    event.preventDefault();
    selectTourTab(tourTabs.value[nextIdx].id, nextIdx);
  }
}

/* ---- Interactive Real SMS Parser Sandbox ---- */
const SMS_SAMPLES = [
  "You have paid PHP 340.00 via GCash to Meralco on 11/11/2026. Ref No. 904122.",
  "You paid PHP 485.50 using Maya at Jollibee Makati.",
  "Received PHP 18,500.00 salary transfer to your SeaBank account from Acme PH."
] as const;

const smsSampleText = ref<string>(SMS_SAMPLES[0]);
const supportedWalletIds = SUPPORTED_WALLETS.map((w) => w.id);
const parsedSmsDemo = computed(() => parseTransactionSms(smsSampleText.value, supportedWalletIds));

/* ---- Offline Mode Capabilities Showcase ---- */
const offlinePillars = computed(() =>
  isTl.value
    ? [
        {
          icon: HardDrive,
          step: "01",
          title: "Buong Multi-Page Shell Cache",
          body: "Lahat ng 9 page at hashed bundle ay naka-precache sa Service Worker, may timeout guard laban sa mabagal na signal, at gumagana pati may query links."
        },
        {
          icon: Database,
          step: "02",
          title: "Hindi Humihinto Kahit Walang Signal",
          body: "Naka-save agad sa local IndexedDB ang gastos, bills, utang, at budget adjustment nang hindi nagha-hang ang modal buttons."
        },
        {
          icon: RefreshCw,
          step: "03",
          title: "Auto Sync at Live Header Telemetry",
          body: "Makikita sa status pill kung may naka-queue sa device at kusang magsi-sync sa Cloud Firestore pagbalik ng koneksyon."
        }
      ]
    : [
        {
          icon: HardDrive,
          step: "01",
          title: "Full 9-Page Shell Precaching",
          body: "Every page and content-hashed bundle loads from the Service Worker with Lie-Fi timeout fallback and query-aware navigation offline."
        },
        {
          icon: Database,
          step: "02",
          title: "Non-Blocking Local Writes",
          body: "Record expenses, mark bills paid, or settle utang while disconnected — IndexedDB saves immediately so forms never freeze."
        },
        {
          icon: RefreshCw,
          step: "03",
          title: "Automatic Cloud Reconciliation",
          body: "Real-time metadata listeners track pending writes in your header pill and confirm when all offline edits sync back to Firebase."
        }
      ]
);

/* ---- Wallet Ecosystem Showcase ---- */
const walletGroups = computed(() => {
  const ewallets = SUPPORTED_WALLETS.filter((w) => w.type === "ewallet");
  const digital = SUPPORTED_WALLETS.filter((w) => w.type === "digital");
  const banks = SUPPORTED_WALLETS.filter((w) => w.type === "bank" || w.type === "cash");
  return isTl.value
    ? [
        { title: "E-Wallets", items: ewallets },
        { title: "Mga Digital Bank", items: digital },
        { title: "Cash at Commercial Banks", items: banks }
      ]
    : [
        { title: "E-Wallets", items: ewallets },
        { title: "Digital Banks", items: digital },
        { title: "Cash & Commercial Banks", items: banks }
      ];
});

/* ---- Core Tool Modules ---- */
const modules = computed(() =>
  isTl.value
    ? [
        {
          icon: Wallet,
          tone: "bg-[var(--accent-soft)] text-[var(--accent)]",
          title: "Overview & Wallets",
          body: "Balanse cards, top spending tiles, at Spend vs Budget meters hanggang eksaktong centavo."
        },
        {
          icon: ListOrdered,
          tone: "bg-[var(--income-soft)] text-[var(--income)]",
          title: "Transactions Ledger",
          body: "Date-grouped ledger rows, live filter pills, SMS quick-fill, print statement, at CSV export."
        },
        {
          icon: PieChart,
          tone: "bg-[var(--warning-soft)] text-[var(--warning)]",
          title: "Clear Analytics",
          body: "Income vs Outcome vs Budget switcher kasama ang category doughnut at Essentials Ratio."
        },
        {
          icon: ReceiptText,
          tone: "bg-[var(--expense-soft)] text-[var(--expense)]",
          title: "Bills & Utang",
          body: "Interactive payment cards, due-date calendar dots, at receivables/payables balance."
        }
      ]
    : [
        {
          icon: Wallet,
          tone: "bg-[var(--accent-soft)] text-[var(--accent)]",
          title: "Overview & Wallets",
          body: "Deep-emerald balance statement, ranked spend tiles, and exact Spend vs Budget meters."
        },
        {
          icon: ListOrdered,
          tone: "bg-[var(--income-soft)] text-[var(--income)]",
          title: "Transactions Ledger",
          body: "Date-grouped searchable history with wallet filters, SMS parser, print layout, and CSV."
        },
        {
          icon: PieChart,
          tone: "bg-[var(--warning-soft)] text-[var(--warning)]",
          title: "Clear Analytics",
          body: "Income, Outcome & Budget views with category share breakdown and Needs vs Wants balance."
        },
        {
          icon: ReceiptText,
          tone: "bg-[var(--expense-soft)] text-[var(--expense)]",
          title: "Bills & Utang",
          body: "Tap-to-edit bill cards, due calendar indicators, and net receivables vs payables tracking."
        }
      ]
);

/* ---- Security & Architecture Pillars ---- */
const securityPillars = computed(() =>
  isTl.value
    ? [
        {
          icon: ShieldCheck,
          title: "Integer-Centavo Math",
          body: "Lahat ng balanse at kabuuan ay kinukuwenta gamit ang eksaktong integer centavos upang maiwasan ang rounding errors."
        },
        {
          icon: Fingerprint,
          title: "Biometric & PIN App Lock",
          body: "Gamitin ang WebAuthn biometrics ng iyong device o magtakda ng 4–8 digit salted SHA-256 PIN sa Settings."
        },
        {
          icon: FileSpreadsheet,
          title: "Per-User Isolation & Safe CSV",
          body: "Naka-isolate bawat user sa Firestore security rules at formula-safe ang CSV downloads laban sa spreadsheet injection."
        }
      ]
    : [
        {
          icon: ShieldCheck,
          title: "Integer-Centavo Accounting",
          body: "Every balance, budget remainder, and split computes in exact integer centavos rather than floats to prevent rounding drift."
        },
        {
          icon: Fingerprint,
          title: "Biometric & PIN App Lock",
          body: "Protect private balances on shared devices using WebAuthn biometrics (Face ID, Touch ID, Windows Hello) or a local PIN."
        },
        {
          icon: FileSpreadsheet,
          title: "Per-User Isolation & Safe CSV",
          body: "Strict per-user Firestore access isolation pairs with local IndexedDB encryption persistence and OWASP-neutralized CSV exports."
        }
      ]
);

/* ---- Native Accordion FAQs ---- */
const faqs = computed(() =>
  isTl.value
    ? [
        {
          q: "Gumagana ba ang Tipid kahit walang internet?",
          a: "Oo. Naka-precache ang lahat ng 9 pages sa Service Worker at naka-store sa IndexedDB ang Firestore data kaya tuloy-tuloy ang pagbabasa, pagdaragdag ng gastos, at pag-marka ng bills kahit offline."
        },
        {
          q: "Paano kinukuwenta ang total users sa landing page?",
          a: "Gumagamit ito ng hiwalay na public aggregate counter (`appStats/public`) sa Firestore kaya nakikita ang aktwal na bilang nang hindi nalalantad ang anumang pribadong profile o pinansyal na data."
        },
        {
          q: "Aling mga wallet at bangko sa Pilipinas ang suportado?",
          a: "May built-in na 26 accounts tulad ng Cash, GCash, Maya, SeaBank, MariBank, GoTyme Bank, BPI, BDO Unibank, UnionBank, Metrobank, at iba pa."
        },
        {
          q: "Paano gumagana ang SMS Quick-Fill?",
          a: "Direktang sinusuri sa browser mo ang kinopyang text notification mula sa bangko o e-wallet upang punan agad ang halaga, uri, merchant, at kategorya."
        },
        {
          q: "Puwede ko bang i-install ang Tipid bilang mobile app?",
          a: "Oo. Bilang Progressive Web App (PWA), puwede itong i-add sa Home Screen sa iOS Safari, Android Chrome, o Desktop browser na may quick-action shortcuts."
        }
      ]
    : [
        {
          q: "How does Tipid work offline?",
          a: "Its Service Worker caches all 9 workspace screens and assets on device while Cloud Firestore persists your ledger in IndexedDB — so logging expenses, bills, or utang offline resolves right away and syncs automatically upon reconnect."
        },
        {
          q: "How is the total user count displayed safely?",
          a: "Tipid reads a dedicated public aggregate counter document in Firestore (`appStats/public`) without ever exposing user UIDs, emails, or financial records, and caches the latest count locally for offline viewing."
        },
        {
          q: "Which Philippine wallets and banks are supported?",
          a: "Tipid includes 26 built-in accounts—including Cash, GCash, Maya, SeaBank, MariBank, GoTyme Bank, BPI, BDO Unibank, UnionBank, and Metrobank—with independent starting balances."
        },
        {
          q: "How does the SMS Auto-Fill parser work?",
          a: "Pasting a bank or e-wallet SMS notification runs entirely inside your browser to extract the peso amount, direction (income vs expense), wallet, merchant, and category."
        },
        {
          q: "Can I install Tipid on my phone or desktop?",
          a: "Yes. Tipid is an installable Progressive Web App with standalone window support, quick-action shortcuts for Add Expense, Bills, and Utang, and safe update prompts."
        }
      ]
);
</script>

<template>
  <div class="min-h-dvh flex flex-col bg-[var(--bg-canvas)] text-[var(--text-primary)]">
    <!-- Floating Glass Capsule Navigation -->
    <div class="pointer-events-none sticky top-3 z-30 mx-auto mt-3 w-full max-w-6xl px-3 sm:px-6">
      <header class="tipid-floating-chrome pointer-events-auto flex items-center justify-between gap-2 rounded-3xl px-3.5 py-2 sm:px-4">
        <div class="flex min-w-0 items-center gap-5">
          <a href="index.html" class="flex shrink-0 items-center gap-2.5 no-underline">
            <img src="/assets/logo.svg" alt="" width="34" height="34" class="h-8.5 w-8.5 rounded-xl shadow-xs" />
            <span class="text-lg font-bold tracking-tight text-[var(--text-primary)]">Tipid</span>
          </a>

          <div class="hidden items-center gap-4 text-xs font-semibold text-[var(--text-secondary)] md:flex">
            <a href="#tour" class="rounded-full px-2.5 py-1.5 no-underline transition-colors hover:bg-[var(--bg-inset)] hover:text-[var(--text-primary)]">
              {{ isTl ? "Tour" : "Tour" }}
            </a>
            <a href="#offline" class="rounded-full px-2.5 py-1.5 no-underline transition-colors hover:bg-[var(--bg-inset)] hover:text-[var(--text-primary)]">
              {{ isTl ? "Offline Mode" : "Offline Mode" }}
            </a>
            <a href="#tools" class="rounded-full px-2.5 py-1.5 no-underline transition-colors hover:bg-[var(--bg-inset)] hover:text-[var(--text-primary)]">
              {{ isTl ? "Wallets" : "Wallets" }}
            </a>
            <a href="#security" class="rounded-full px-2.5 py-1.5 no-underline transition-colors hover:bg-[var(--bg-inset)] hover:text-[var(--text-primary)]">
              {{ isTl ? "Seguridad" : "Security" }}
            </a>
            <a href="#faq" class="rounded-full px-2.5 py-1.5 no-underline transition-colors hover:bg-[var(--bg-inset)] hover:text-[var(--text-primary)]">
              FAQ
            </a>
          </div>
        </div>

        <nav aria-label="Landing" class="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            class="tipid-compact inline-flex min-h-[34px] items-center rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 py-1 text-xs font-semibold text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-inset)] hover:text-[var(--text-primary)]"
            @click="switchLanguage"
          >
            {{ isTl ? "EN" : "FIL" }}
          </button>

          <button
            type="button"
            class="tipid-compact inline-flex h-[34px] w-[34px] items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-inset)] hover:text-[var(--text-primary)]"
            aria-label="Toggle color theme"
            @click="toggleQuickTheme"
          >
            <Sun v-if="themePreference === 'light'" :size="15" aria-hidden="true" />
            <Moon v-else-if="themePreference === 'dark'" :size="15" aria-hidden="true" />
            <Monitor v-else :size="15" aria-hidden="true" />
          </button>

          <a
            href="login.html"
            class="inline-flex min-h-[36px] items-center rounded-full px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] no-underline transition-colors hover:bg-[var(--bg-inset)] hover:text-[var(--text-primary)] sm:text-sm"
          >
            {{ isTl ? "Log in" : "Log in" }}
          </a>

          <a
            href="signup.html"
            class="tipid-cta inline-flex min-h-[36px] items-center gap-1.5 rounded-full bg-[var(--accent)] px-4 py-1.5 text-xs font-semibold text-white no-underline hover:bg-[var(--accent-hover)] sm:text-sm"
          >
            <span>{{ isTl ? "Magsimula" : "Get started" }}</span>
          </a>
        </nav>
      </header>
    </div>

    <main class="flex-1">
      <!-- Architectural Bento Hero -->
      <section class="tipid-atmosphere relative overflow-x-clip border-b border-[var(--border-subtle)]">
        <div class="tipid-grid-bg pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" />

        <div class="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-12 lg:gap-10 lg:py-16">
          <!-- Left Editorial Pitch + Real Community & Platform Bento Strip -->
          <div class="space-y-6 lg:col-span-6">
            <div class="tipid-pill-row">
              <span class="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)]/95 px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] shadow-xs">
                <span :class="['h-2 w-2 rounded-full', networkOnline ? 'bg-[var(--income)]' : 'bg-[var(--warning)]']" aria-hidden="true" />
                <span>{{ isTl ? "Offline-First Personal Ledger" : "Offline-First Personal Ledger" }}</span>
              </span>

              <span class="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--accent-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--accent)]">
                <Users :size="13" aria-hidden="true" />
                <span class="font-mono tabular-nums">{{ formattedUserCount }}</span>
                <span>{{ isTl ? "Registered Users" : "Registered Users" }}</span>
              </span>
            </div>

            <h1 class="tipid-hero-title font-bold text-[var(--text-primary)]">
              <template v-if="isTl">
                Bawat piso, klaro ang galaw —
                <span class="text-[var(--accent)]">kahit offline.</span>
              </template>
              <template v-else>
                Every peso accounted for.
                <span class="text-[var(--accent)]">Built for calm.</span>
              </template>
            </h1>

            <p class="max-w-xl text-base leading-relaxed text-[var(--text-secondary)] sm:text-lg">
              {{
                isTl
                  ? "Subaybayan ang balanse sa Cash, GCash, Maya, at mga bangko, magtala ng bills at utang kahit walang signal, at awtomatikong mag-sync online."
                  : "Track daily cash flow across Cash, PH e-wallets, and banks, manage bills calendar and utang ledgers, and keep logging seamlessly even when you lose signal."
              }}
            </p>

            <div class="flex flex-col gap-3 pt-1 sm:flex-row sm:flex-wrap">
              <a
                href="signup.html"
                class="tipid-cta group inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white no-underline hover:bg-[var(--accent-hover)]"
              >
                <span>{{ isTl ? "Gumawa ng Libreng Account" : "Create Free Account" }}</span>
                <ArrowRight :size="16" class="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </a>

              <a
                href="login.html"
                class="inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-surface)] px-5 py-3 text-sm font-semibold text-[var(--text-primary)] no-underline shadow-xs transition-colors hover:bg-[var(--bg-inset)]"
              >
                {{ isTl ? "Mag-log in" : "Sign in" }}
              </a>

              <button
                v-if="deferredInstallPrompt && !pwaInstalled"
                type="button"
                class="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border border-[var(--accent)]/35 bg-[var(--accent-soft)] px-4 py-3 text-sm font-semibold text-[var(--accent)] transition-colors hover:bg-[var(--accent)] hover:text-white"
                @click="triggerPwaInstall"
              >
                <Download :size="16" aria-hidden="true" />
                <span>{{ isTl ? "I-install ang App" : "Install App" }}</span>
              </button>
            </div>

            <!-- 3-Card Bento Telemetry Row (Live Total Users, PH Wallets, Offline Status) -->
            <div class="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-3">
              <article class="tipid-card tipid-bento-card rounded-2xl p-4">
                <div class="flex items-center justify-between gap-2">
                  <span class="tipid-eyebrow text-[var(--text-muted)]">
                    {{ isTl ? "Total Users" : "Total Users" }}
                  </span>
                  <span class="tipid-icon-badge h-7 w-7 bg-[var(--accent-soft)] text-[var(--accent)]">
                    <Users :size="14" aria-hidden="true" />
                  </span>
                </div>
                <p class="mt-2 font-mono text-2xl font-bold tracking-tight text-[var(--text-primary)] tabular-nums">
                  {{ formattedUserCount }}
                </p>
                <p class="mt-1 flex items-center gap-1.5 text-[11px] font-medium text-[var(--text-secondary)]">
                  <span
                    :class="[
                      'h-1.5 w-1.5 rounded-full',
                      userStats.source === 'live'
                        ? 'bg-[var(--income)]'
                        : userStats.source === 'cache'
                          ? 'bg-[var(--warning)]'
                          : 'bg-[var(--text-muted)]'
                    ]"
                    aria-hidden="true"
                  />
                  <span>{{ userCountBadgeLabel }}</span>
                </p>
              </article>

              <article class="tipid-card tipid-bento-card rounded-2xl p-4">
                <div class="flex items-center justify-between gap-2">
                  <span class="tipid-eyebrow text-[var(--text-muted)]">
                    {{ isTl ? "PH Accounts" : "PH Wallets" }}
                  </span>
                  <span class="tipid-icon-badge h-7 w-7 bg-[var(--income-soft)] text-[var(--income)]">
                    <Wallet :size="14" aria-hidden="true" />
                  </span>
                </div>
                <p class="mt-2 font-mono text-2xl font-bold tracking-tight text-[var(--text-primary)] tabular-nums">
                  {{ SUPPORTED_WALLETS.length }}
                </p>
                <p class="mt-1 text-[11px] font-medium text-[var(--text-secondary)]">
                  {{ isTl ? "Cash, E-Wallets & Banks" : "Cash, E-Wallets & Banks" }}
                </p>
              </article>

              <article class="tipid-card tipid-bento-card rounded-2xl p-4">
                <div class="flex items-center justify-between gap-2">
                  <span class="tipid-eyebrow text-[var(--text-muted)]">
                    {{ isTl ? "Device Sync" : "Offline PWA" }}
                  </span>
                  <span
                    :class="[
                      'tipid-icon-badge h-7 w-7',
                      networkOnline
                        ? 'bg-[var(--income-soft)] text-[var(--income)]'
                        : 'bg-[var(--warning-soft)] text-[var(--warning)]'
                    ]"
                  >
                    <Wifi v-if="networkOnline" :size="14" aria-hidden="true" />
                    <WifiOff v-else :size="14" aria-hidden="true" />
                  </span>
                </div>
                <p class="mt-2 text-lg font-bold tracking-tight text-[var(--text-primary)]">
                  {{ networkOnline ? (isTl ? "Sync Handa" : "Online Ready") : (isTl ? "Offline Active" : "Offline Active") }}
                </p>
                <p class="mt-1 text-[11px] font-medium text-[var(--text-secondary)]">
                  {{
                    swReady
                      ? (isTl ? "App shell naka-cache" : "Shell cached · IndexedDB")
                      : (isTl ? "Local persistence on" : "IndexedDB persistence")
                  }}
                </p>
              </article>
            </div>
          </div>

          <!-- Right Interactive Bento Mini-App Showcase (Matches Inspired Fintech UI) -->
          <div class="lg:col-span-6">
            <div class="space-y-3">
              <!-- Signature Deep Emerald Statement Card (Inspired Hero + Split Metric Bar) -->
              <div class="tipid-card-emerald rounded-3xl p-5 sm:p-6">
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <p class="tipid-eyebrow text-white/70">
                      {{ isTl ? "Interactive Daily Allowance Cap" : "Interactive Daily Balance" }}
                    </p>
                    <div class="mt-1.5 flex flex-wrap items-baseline gap-2">
                      <span class="tipid-amount font-mono text-3xl font-bold tracking-tight text-white sm:text-4xl">
                        ₱{{ formatPeso(remaining) }}
                      </span>
                      <span class="rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-semibold text-white/90">
                        {{ isTl ? `sa ₱${DAILY_LIMIT}` : `of ₱${DAILY_LIMIT} cap` }}
                      </span>
                    </div>
                  </div>

                  <div class="flex shrink-0 items-center gap-1.5">
                    <button
                      v-if="items.length === 0"
                      type="button"
                      class="tipid-compact inline-flex min-h-[30px] items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-white/25"
                      @click="resetDemo"
                    >
                      <RotateCcw :size="11" aria-hidden="true" />
                      <span>{{ isTl ? "Ibalik" : "Restore" }}</span>
                    </button>
                    <span class="rounded-full bg-white/15 px-2.5 py-1 font-mono text-xs font-semibold text-white tabular-nums">
                      {{ usedPct }}%
                    </span>
                  </div>
                </div>

                <!-- Dark Emerald Split Metric Capsule (Directly Inspired by Reference Dashboard) -->
                <div class="mt-4 grid grid-cols-2 divide-x divide-white/15 rounded-2xl border border-white/15 bg-black/20 p-3 backdrop-blur-xs">
                  <div class="flex items-center gap-2.5 pr-3">
                    <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#6EE7B7]/20 text-[#6EE7B7]">
                      <ArrowUp :size="15" aria-hidden="true" />
                    </span>
                    <div class="min-w-0">
                      <span class="block text-[10px] font-semibold uppercase tracking-wider text-white/65">
                        {{ isTl ? "Daily Cap" : "Daily Cap" }}
                      </span>
                      <strong class="block truncate font-mono text-sm font-bold text-white tabular-nums">
                        ₱{{ formatPeso(DAILY_LIMIT) }}
                      </strong>
                    </div>
                  </div>
                  <div class="flex items-center gap-2.5 pl-3">
                    <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#F39B8D]/20 text-[#F39B8D]">
                      <ArrowDown :size="15" aria-hidden="true" />
                    </span>
                    <div class="min-w-0">
                      <span class="block text-[10px] font-semibold uppercase tracking-wider text-white/65">
                        {{ isTl ? "Nagastos" : "Spent" }}
                      </span>
                      <strong class="block truncate font-mono text-sm font-bold text-white tabular-nums">
                        -₱{{ formatPeso(totalSpent) }}
                      </strong>
                    </div>
                  </div>
                </div>

                <div class="mt-3.5 h-2 overflow-hidden rounded-full bg-white/15">
                  <div
                    class="h-full rounded-full transition-all duration-300"
                    :class="usedPct > 85 ? 'bg-[#F39B8D]' : 'bg-[#6EE7B7]'"
                    :style="{ width: `${usedPct}%` }"
                  />
                </div>
              </div>

              <!-- Interactive Bento Transaction Rows + Quick Add (Inspired by History Rows) -->
              <div class="tipid-card rounded-3xl p-4 sm:p-5 space-y-3.5">
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <span class="text-xs font-bold text-[var(--text-primary)]">
                    {{ isTl ? "Subukan mag-log ng gastos" : "Try instant ledger logging" }}
                  </span>
                  <div class="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      class="tipid-compact inline-flex min-h-[30px] items-center gap-1 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-inset)] px-2.5 py-1 text-[11px] font-semibold text-[var(--text-primary)] transition-colors hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]"
                      @click="addPreset('Coffee', 'Food & Dining', 65)"
                    >
                      <Coffee :size="11" class="text-[var(--accent)]" aria-hidden="true" />
                      <span>+ ₱65</span>
                    </button>
                    <button
                      type="button"
                      class="tipid-compact inline-flex min-h-[30px] items-center gap-1 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-inset)] px-2.5 py-1 text-[11px] font-semibold text-[var(--text-primary)] transition-colors hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]"
                      @click="addPreset('Fare', 'Transportation', 20)"
                    >
                      <Bus :size="11" class="text-[var(--accent)]" aria-hidden="true" />
                      <span>+ ₱20</span>
                    </button>
                    <button
                      type="button"
                      class="tipid-compact inline-flex min-h-[30px] items-center gap-1 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-inset)] px-2.5 py-1 text-[11px] font-semibold text-[var(--text-primary)] transition-colors hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]"
                      @click="addPreset('Lunch', 'Food & Dining', 110)"
                    >
                      <Utensils :size="11" class="text-[var(--accent)]" aria-hidden="true" />
                      <span>+ ₱110</span>
                    </button>
                  </div>
                </div>

                <ul v-if="items.length > 0" class="max-h-48 space-y-1.5 overflow-y-auto pr-0.5">
                  <li
                    v-for="item in items"
                    :key="item.id"
                    class="flex items-center justify-between gap-2.5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-inset)]/45 px-3 py-2 transition-colors hover:bg-[var(--bg-inset)]"
                  >
                    <div class="flex min-w-0 items-center gap-2.5">
                      <span
                        class="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[var(--accent)]"
                        :style="{ backgroundColor: `color-mix(in srgb, ${getCategoryColor(item.cat)} 16%, transparent)`, color: getCategoryColor(item.cat) }"
                        aria-hidden="true"
                      >
                        <Wallet :size="14" />
                      </span>
                      <div class="min-w-0">
                        <p class="truncate text-xs font-semibold text-[var(--text-primary)]">{{ item.desc }}</p>
                        <p class="truncate text-[11px] text-[var(--text-muted)]">{{ item.cat }} · {{ item.time }}</p>
                      </div>
                    </div>

                    <div class="flex shrink-0 items-center gap-2">
                      <span class="font-mono text-xs font-bold text-[var(--expense)] tabular-nums">
                        -₱{{ formatPeso(item.amount) }}
                      </span>
                      <button
                        type="button"
                        class="tipid-compact inline-flex h-7 w-7 items-center justify-center rounded-xl text-[var(--text-muted)] transition-colors hover:bg-[var(--expense-soft)] hover:text-[var(--expense)]"
                        aria-label="Remove sample item"
                        @click="removeItem(item.id)"
                      >
                        <X :size="13" aria-hidden="true" />
                      </button>
                    </div>
                  </li>
                </ul>

                <div
                  v-else
                  class="flex items-center justify-between rounded-2xl border border-dashed border-[var(--border-subtle)] px-3.5 py-4 text-xs text-[var(--text-muted)]"
                >
                  <span>{{ isTl ? "Walang nakatala — subukang magdagdag sa ibaba." : "Sample ledger cleared — add an item below." }}</span>
                  <button
                    type="button"
                    class="tipid-compact font-semibold text-[var(--accent)] hover:underline"
                    @click="resetDemo"
                  >
                    {{ isTl ? "Ibalik" : "Reset" }}
                  </button>
                </div>

                <form class="flex items-center gap-2 border-t border-[var(--border-subtle)] pt-3" @submit.prevent="addDemoItem">
                  <input
                    v-model="descInput"
                    type="text"
                    aria-label="Sample item description"
                    :placeholder="isTl ? 'Hal. Merienda' : 'e.g. Merienda'"
                    class="tipid-input min-h-[40px] min-w-0 flex-1 rounded-2xl border-[var(--border-subtle)] bg-[var(--bg-inset)]/60 py-1.5 text-xs focus:bg-[var(--bg-surface)]"
                  />
                  <input
                    v-model="amountInput"
                    type="number"
                    min="1"
                    step="1"
                    inputmode="decimal"
                    aria-label="Sample item amount"
                    placeholder="₱ Amount"
                    class="tipid-input min-h-[40px] w-24 shrink-0 rounded-2xl border-[var(--border-subtle)] bg-[var(--bg-inset)]/60 py-1.5 font-mono text-xs focus:bg-[var(--bg-surface)]"
                  />
                  <button
                    type="submit"
                    aria-label="Add sample item"
                    class="tipid-compact tipid-cta inline-flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-2xl bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]"
                  >
                    <Plus :size="17" aria-hidden="true" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Interactive Workspace Tour with Signature Deep-Emerald Pill Switcher -->
      <section id="tour" class="border-b border-[var(--border-subtle)] py-14 sm:py-16">
        <div class="mx-auto max-w-6xl px-4 sm:px-6">
          <div class="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div class="max-w-xl">
              <p class="tipid-eyebrow text-[var(--accent)]">
                {{ isTl ? "Live Workspace Preview" : "Inside the Workspace" }}
              </p>
              <h2 class="mt-2 text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
                {{ isTl ? "Magkakatugmang screen mula Dashboard hanggang Profile" : "Cohesive financial views built for real workflows" }}
              </h2>
            </div>

            <!-- Deep Emerald Pill Tab Switcher matching Analytics / Bills / Auth -->
            <div
              role="tablist"
              aria-label="Tipid workspace tour"
              class="flex items-center gap-1 overflow-x-auto rounded-full border border-[var(--border-subtle)] bg-[var(--bg-inset)] p-1"
            >
              <button
                v-for="(tab, idx) in tourTabs"
                :id="tab.domId"
                :key="tab.id"
                :ref="(el) => { tabButtonRefs[idx] = el as HTMLButtonElement | null; }"
                type="button"
                role="tab"
                :aria-selected="activeTourTab === tab.id"
                :tabindex="activeTourTab === tab.id ? 0 : -1"
                :class="[
                  'tipid-compact shrink-0 rounded-full px-4 py-2 text-xs font-semibold whitespace-nowrap transition-all',
                  activeTourTab === tab.id
                    ? 'bg-[var(--hero-card-start)] text-white shadow-xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                ]"
                @click="selectTourTab(tab.id, idx)"
                @keydown="handleTabKeydown($event, idx)"
              >
                {{ tab.label }}
              </button>
            </div>
          </div>

          <div class="mt-8">
            <!-- Panel 1: Overview & Spend vs Budget Showcase -->
            <div
              role="tabpanel"
              aria-labelledby="tour-tab-overview"
              :hidden="activeTourTab !== 'overview' ? 'until-found' : undefined"
              :tabindex="activeTourTab === 'overview' ? 0 : undefined"
              @beforematch="activeTourTab = 'overview'"
            >
              <div class="tipid-card grid grid-cols-1 gap-6 rounded-3xl p-6 lg:grid-cols-12 lg:p-8">
                <div class="space-y-4 lg:col-span-5">
                  <span class="tipid-eyebrow text-[var(--accent)]">dashboard.html</span>
                  <h3 class="text-xl font-bold text-[var(--text-primary)]">
                    {{ isTl ? "Malinaw na net balance, top expenses, at budget pacing" : "Ranked expenses, wallet cards, and Spend vs Budget meters" }}
                  </h3>
                  <p class="text-sm leading-relaxed text-[var(--text-secondary)]">
                    {{
                      isTl
                        ? "Isang tingin lang ay kita agad ang kabuuang balanse, top categories ngayong buwan, at mga natitirang budget limit."
                        : "Review your net position across linked wallets, inspect top spending categories at a glance, and track remaining caps without spreadsheets."
                    }}
                  </p>
                  <ul class="space-y-2 text-xs text-[var(--text-secondary)]">
                    <li class="flex items-center gap-2">
                      <CheckCircle2 :size="15" class="shrink-0 text-[var(--income)]" aria-hidden="true" />
                      <span>{{ isTl ? "Horizon filters: This Month, This Week, 30 Days, All Time" : "Instant filters across This Month, This Week, 30 Days & All Time" }}</span>
                    </li>
                    <li class="flex items-center gap-2">
                      <CheckCircle2 :size="15" class="shrink-0 text-[var(--income)]" aria-hidden="true" />
                      <span>{{ isTl ? "Tappable quick-action cards diretsong History, Bills, at Utang" : "Connected KPI shortcuts linking straight to History, Bills & Utang" }}</span>
                    </li>
                  </ul>
                </div>

                <div class="space-y-3 lg:col-span-7">
                  <div class="tipid-card-emerald rounded-2xl p-4 sm:p-5">
                    <div class="flex items-center justify-between text-xs text-white/75">
                      <span class="tipid-eyebrow">Net Balance Preview</span>
                      <span class="rounded-full bg-[#6EE7B7]/18 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-[#6EE7B7]">
                        +₱18,420.50 net
                      </span>
                    </div>
                    <p class="mt-1.5 font-mono text-2xl font-bold tracking-tight text-white">₱64,890.25</p>
                  </div>

                  <!-- Inspired Ranked Top Expenses Bento Cards -->
                  <div class="grid grid-cols-3 gap-2.5">
                    <div class="rounded-2xl border border-[var(--border-subtle)] bg-[var(--accent-soft)] p-3.5">
                      <span class="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--hero-card-start)] text-[11px] font-bold text-white">1</span>
                      <p class="mt-2 truncate text-xs font-semibold text-[var(--text-primary)]">Groceries</p>
                      <p class="mt-0.5 font-mono text-sm font-bold text-[var(--accent)]">₱3,480</p>
                    </div>
                    <div class="rounded-2xl border border-[var(--border-subtle)] bg-[var(--income-soft)] p-3.5">
                      <span class="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--income)] text-[11px] font-bold text-white">2</span>
                      <p class="mt-2 truncate text-xs font-semibold text-[var(--text-primary)]">Transport</p>
                      <p class="mt-0.5 font-mono text-sm font-bold text-[var(--income)]">₱1,620</p>
                    </div>
                    <div class="rounded-2xl border border-[var(--border-subtle)] bg-[var(--warning-soft)] p-3.5">
                      <span class="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--warning)] text-[11px] font-bold text-white">3</span>
                      <p class="mt-2 truncate text-xs font-semibold text-[var(--text-primary)]">Utilities</p>
                      <p class="mt-0.5 font-mono text-sm font-bold text-[var(--warning)]">₱1,450</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Panel 2: Live SMS Parser Interactive Demo -->
            <div
              role="tabpanel"
              aria-labelledby="tour-tab-sms"
              :hidden="activeTourTab !== 'sms' ? 'until-found' : undefined"
              :tabindex="activeTourTab === 'sms' ? 0 : undefined"
              @beforematch="activeTourTab = 'sms'"
            >
              <div class="tipid-card grid grid-cols-1 gap-6 rounded-3xl p-6 lg:grid-cols-12 lg:p-8">
                <div class="space-y-4 lg:col-span-5">
                  <span class="tipid-eyebrow text-[var(--accent)]">Client-Side SMS Parser</span>
                  <h3 class="text-xl font-bold text-[var(--text-primary)]">
                    {{ isTl ? "I-paste ang bank o e-wallet SMS upang makuha ang detalye" : "Paste PH bank & e-wallet alerts for instant logging" }}
                  </h3>
                  <p class="text-sm leading-relaxed text-[var(--text-secondary)]">
                    {{
                      isTl
                        ? "Lokal na pinoproseso sa browser ang kinopyang SMS notice upang awtomatikong makuha ang halaga, direksyon, wallet, at kategorya."
                        : "Runs completely inside your browser via parseTransactionSms—zero external webhooks—even when working completely offline."
                    }}
                  </p>
                  <div class="flex flex-wrap gap-2">
                    <button
                      v-for="(sample, idx) in SMS_SAMPLES"
                      :key="idx"
                      type="button"
                      class="tipid-compact rounded-full border border-[var(--border-strong)] bg-[var(--bg-inset)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] transition-colors hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]"
                      @click="smsSampleText = sample"
                    >
                      {{ idx === 0 ? "GCash Bill" : idx === 1 ? "Maya Dining" : "SeaBank Payroll" }}
                    </button>
                  </div>
                </div>

                <div class="space-y-3 lg:col-span-7">
                  <div>
                    <label for="landing-sms-input" class="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)]">
                      <Smartphone :size="14" class="text-[var(--accent)]" aria-hidden="true" />
                      <span>{{ isTl ? "Subukan o i-edit ang SMS notification:" : "Try or edit SMS notification text:" }}</span>
                    </label>
                    <textarea
                      id="landing-sms-input"
                      v-model="smsSampleText"
                      rows="3"
                      class="tipid-input rounded-2xl border-[var(--border-subtle)] bg-[var(--bg-inset)]/60 font-mono text-xs focus:bg-[var(--bg-surface)]"
                    />
                  </div>

                  <div v-if="parsedSmsDemo" class="tipid-inset grid grid-cols-2 gap-3 rounded-2xl p-4 sm:grid-cols-4">
                    <div>
                      <span class="block text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Type</span>
                      <span :class="['mt-0.5 block text-xs font-bold uppercase', parsedSmsDemo.type === 'income' ? 'text-[var(--income)]' : 'text-[var(--expense)]']">
                        {{ parsedSmsDemo.type }}
                      </span>
                    </div>
                    <div>
                      <span class="block text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Amount</span>
                      <span class="mt-0.5 block font-mono text-xs font-bold text-[var(--text-primary)]">₱{{ formatPeso(parsedSmsDemo.amount) }}</span>
                    </div>
                    <div>
                      <span class="block text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Wallet</span>
                      <span class="mt-0.5 block text-xs font-bold text-[var(--text-primary)]">{{ parsedSmsDemo.method }}</span>
                    </div>
                    <div>
                      <span class="block text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Category</span>
                      <span class="mt-0.5 block truncate text-xs font-bold text-[var(--accent)]">{{ parsedSmsDemo.category }}</span>
                    </div>
                    <div class="col-span-2 border-t border-[var(--border-subtle)] pt-2 sm:col-span-4">
                      <span class="text-[11px] text-[var(--text-muted)]">Detected description: </span>
                      <strong class="text-xs text-[var(--text-primary)]">{{ parsedSmsDemo.desc }}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Panel 3: Bills & Utang Commitments -->
            <div
              role="tabpanel"
              aria-labelledby="tour-tab-commitments"
              :hidden="activeTourTab !== 'commitments' ? 'until-found' : undefined"
              :tabindex="activeTourTab === 'commitments' ? 0 : undefined"
              @beforematch="activeTourTab = 'commitments'"
            >
              <div class="tipid-card grid grid-cols-1 gap-6 rounded-3xl p-6 lg:grid-cols-12 lg:p-8">
                <div class="space-y-4 lg:col-span-5">
                  <span class="tipid-eyebrow text-[var(--accent)]">bills.html · utang.html</span>
                  <h3 class="text-xl font-bold text-[var(--text-primary)]">
                    {{ isTl ? "Walang makalimutang due date at paniningil" : "Stay ahead of upcoming bills and net utang position" }}
                  </h3>
                  <p class="text-sm leading-relaxed text-[var(--text-secondary)]">
                    {{
                      isTl
                        ? "Tap-to-edit bills calendar para sa utilities at subscriptions, kasama ang malinaw na receivables vs payables breakdown."
                        : "Track upcoming, overdue, and paid bills with an interactive monthly calendar alongside a dedicated receivables vs payables ledger."
                    }}
                  </p>
                </div>

                <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:col-span-7">
                  <div class="tipid-inset space-y-2.5 rounded-2xl p-4">
                    <div class="flex items-center justify-between text-xs font-bold text-[var(--text-primary)]">
                      <span class="inline-flex items-center gap-1.5"><ReceiptText :size="14" class="text-[var(--accent)]" aria-hidden="true" /> Bills Schedule</span>
                      <span class="rounded-full bg-[var(--warning-soft)] px-2.5 py-0.5 text-[10px] font-semibold text-[var(--warning)]">2 Open</span>
                    </div>
                    <div class="flex items-center justify-between rounded-xl bg-[var(--bg-surface)] px-3 py-2.5 text-xs">
                      <span>Meralco · <span class="text-[var(--warning)]">3 DAYS</span></span>
                      <strong class="font-mono">₱3,420.00</strong>
                    </div>
                    <div class="flex items-center justify-between rounded-xl bg-[var(--bg-surface)] px-3 py-2.5 text-xs">
                      <span>PLDT Fiber · <span class="text-[var(--income)]">Paid</span></span>
                      <strong class="font-mono text-[var(--text-muted)] line-through">₱1,699.00</strong>
                    </div>
                  </div>

                  <div class="tipid-inset space-y-2.5 rounded-2xl p-4">
                    <div class="flex items-center justify-between text-xs font-bold text-[var(--text-primary)]">
                      <span class="inline-flex items-center gap-1.5"><Users :size="14" class="text-[var(--accent)]" aria-hidden="true" /> Utang Net Position</span>
                      <span class="font-mono text-[var(--income)]">+₱2,500.00</span>
                    </div>
                    <div class="flex items-center justify-between rounded-xl bg-[var(--bg-surface)] px-3 py-2.5 text-xs">
                      <span class="inline-flex items-center gap-1 text-[var(--income)]"><ArrowDownLeft :size="12" aria-hidden="true" /> Owed to you</span>
                      <strong class="font-mono">₱4,000.00</strong>
                    </div>
                    <div class="flex items-center justify-between rounded-xl bg-[var(--bg-surface)] px-3 py-2.5 text-xs">
                      <span class="inline-flex items-center gap-1 text-[var(--expense)]"><ArrowUpRight :size="12" aria-hidden="true" /> You owe</span>
                      <strong class="font-mono">₱1,500.00</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Panel 4: Analytics & CSV Export -->
            <div
              role="tabpanel"
              aria-labelledby="tour-tab-analytics"
              :hidden="activeTourTab !== 'analytics' ? 'until-found' : undefined"
              :tabindex="activeTourTab === 'analytics' ? 0 : undefined"
              @beforematch="activeTourTab = 'analytics'"
            >
              <div class="tipid-card grid grid-cols-1 gap-6 rounded-3xl p-6 lg:grid-cols-12 lg:p-8">
                <div class="space-y-4 lg:col-span-5">
                  <span class="tipid-eyebrow text-[var(--accent)]">chart.html · history.html</span>
                  <h3 class="text-xl font-bold text-[var(--text-primary)]">
                    {{ isTl ? "Malinaw na ratio ng Need vs Want at maayos na CSV" : "Category mix, savings rate, and audit-safe exports" }}
                  </h3>
                  <p class="text-sm leading-relaxed text-[var(--text-secondary)]">
                    {{
                      isTl
                        ? "Alamin kung nasusunod ang iyong target essentials ratio at i-download o i-print ang grouped history anytime."
                        : "Visualize spending shares by category and wallet, monitor Essentials vs Discretionary ratio, and export formula-safe CSV or print statements."
                    }}
                  </p>
                </div>

                <div class="space-y-4 lg:col-span-7">
                  <div class="tipid-inset space-y-3 rounded-2xl p-4">
                    <div class="flex items-center justify-between text-xs">
                      <span class="font-bold text-[var(--text-primary)]">Needs vs Wants Ratio</span>
                      <span class="font-mono text-[var(--text-muted)]">68% Essential · 32% Want</span>
                    </div>
                    <div class="flex h-3 overflow-hidden rounded-full bg-[var(--bg-surface)]">
                      <div class="w-[68%] bg-[var(--income)]" />
                      <div class="w-[32%] bg-[var(--expense)]" />
                    </div>
                    <div class="grid grid-cols-3 gap-2 pt-1 text-center text-xs">
                      <div class="rounded-xl bg-[var(--bg-surface)] p-2.5">
                        <span class="block text-[10px] text-[var(--text-muted)]">Savings Rate</span>
                        <strong class="font-mono text-[var(--income)]">24%</strong>
                      </div>
                      <div class="rounded-xl bg-[var(--bg-surface)] p-2.5">
                        <span class="block text-[10px] text-[var(--text-muted)]">Formula Safe</span>
                        <strong class="font-mono text-[var(--accent)]">OWASP CSV</strong>
                      </div>
                      <div class="rounded-xl bg-[var(--bg-surface)] p-2.5">
                        <span class="block text-[10px] text-[var(--text-muted)]">Statements</span>
                        <strong class="font-mono text-[var(--text-primary)]">Print CSS</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Dedicated Enhanced Offline Mode Architecture Band -->
      <section id="offline" class="border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] py-14 sm:py-16">
        <div class="mx-auto max-w-6xl space-y-8 px-4 sm:px-6">
          <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div class="max-w-2xl">
              <p class="tipid-eyebrow text-[var(--accent)]">
                {{ isTl ? "Pinahusay na Offline Mode" : "Offline-First Reliability" }}
              </p>
              <h2 class="mt-2 text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
                {{ isTl ? "Tuloy ang pagtatala kahit walang internet o mahina ang signal" : "Built to stay fast on airplanes, subways, and patchy signal" }}
              </h2>
            </div>

            <!-- Live Device Offline Capability Strip -->
            <div class="flex flex-wrap items-center gap-2 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-inset)]/70 px-3.5 py-2.5 text-xs">
              <span class="inline-flex items-center gap-1.5 font-semibold text-[var(--text-primary)]">
                <Wifi v-if="networkOnline" :size="14" class="text-[var(--income)]" aria-hidden="true" />
                <WifiOff v-else :size="14" class="text-[var(--warning)]" aria-hidden="true" />
                <span>{{ networkOnline ? "Online" : "Offline Mode" }}</span>
              </span>
              <span class="text-[var(--border-strong)]" aria-hidden="true">·</span>
              <span class="inline-flex items-center gap-1.5 text-[var(--text-secondary)]">
                <CheckCircle2 :size="13" :class="swReady ? 'text-[var(--income)]' : 'text-[var(--text-muted)]'" aria-hidden="true" />
                <span>{{ swReady ? (isTl ? "SW Cache Active" : "SW Cache Active") : (isTl ? "SW Handa sa Build" : "PWA Cache Ready") }}</span>
              </span>
              <span class="text-[var(--border-strong)]" aria-hidden="true">·</span>
              <span class="inline-flex items-center gap-1.5 text-[var(--text-secondary)]">
                <Database :size="13" :class="idbSupported ? 'text-[var(--income)]' : 'text-[var(--text-muted)]'" aria-hidden="true" />
                <span>{{ idbSupported ? "IndexedDB Ready" : "Storage Restricted" }}</span>
              </span>
            </div>
          </div>

          <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
            <article
              v-for="item in offlinePillars"
              :key="item.step"
              data-reveal
              class="tipid-card-interactive tipid-bento-card flex flex-col justify-between rounded-3xl p-5 sm:p-6"
            >
              <div>
                <div class="flex items-center justify-between">
                  <div class="tipid-icon-badge h-10 w-10 rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
                    <component :is="item.icon" :size="18" aria-hidden="true" />
                  </div>
                  <span class="rounded-full bg-[var(--bg-inset)] px-2.5 py-1 font-mono text-[11px] font-bold text-[var(--text-muted)]">
                    {{ item.step }}
                  </span>
                </div>
                <h3 class="mt-4 text-base font-bold text-[var(--text-primary)]">{{ item.title }}</h3>
                <p class="mt-1.5 text-xs leading-relaxed text-[var(--text-secondary)]">{{ item.body }}</p>
              </div>
            </article>
          </div>
        </div>
      </section>

      <!-- Focused Financial Modules Grid + Supported PH Wallets & Categories -->
      <section id="tools" class="py-14 sm:py-16">
        <div class="mx-auto max-w-6xl space-y-12 px-4 sm:px-6">
          <div>
            <div class="max-w-2xl">
              <p class="tipid-eyebrow text-[var(--accent)]">
                {{ isTl ? "Naka-pokus sa Kailangan Mo" : "Built Around Essential Workflows" }}
              </p>
              <h2 class="mt-2 text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
                {{ isTl ? "Mga Pangunahing Gamit sa Workspace" : "Focused Financial Tools" }}
              </h2>
            </div>

            <div class="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <article
                v-for="(mod, idx) in modules"
                :key="mod.title"
                data-reveal
                class="tipid-card-interactive tipid-bento-card flex flex-col justify-between rounded-3xl p-5"
              >
                <div>
                  <div class="flex items-center justify-between gap-2">
                    <div :class="['tipid-icon-badge h-10 w-10 rounded-2xl', mod.tone]">
                      <component :is="mod.icon" :size="18" aria-hidden="true" />
                    </div>
                    <span class="font-mono text-[11px] font-semibold text-[var(--text-muted)]">
                      0{{ idx + 1 }}
                    </span>
                  </div>
                  <h3 class="mt-4 text-base font-bold text-[var(--text-primary)]">{{ mod.title }}</h3>
                  <p class="mt-1.5 text-xs leading-relaxed text-[var(--text-secondary)]">
                    {{ mod.body }}
                  </p>
                </div>
              </article>
            </div>
          </div>

          <!-- Real Philippine Wallets & Categories Catalog -->
          <div data-reveal class="tipid-card rounded-3xl p-6 sm:p-7 space-y-6">
            <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p class="tipid-eyebrow text-[var(--accent)]">
                  {{ isTl ? "Built-In PH Channels" : "Ready Out of the Box" }}
                </p>
                <h3 class="mt-1 text-lg font-bold text-[var(--text-primary)]">
                  {{ isTl ? "26 Suportadong Wallet & 10 Kategorya ng Gastos" : "26 Philippine Accounts & 10 Structured Categories" }}
                </h3>
              </div>
              <span class="text-xs text-[var(--text-muted)]">
                {{ isTl ? "Puwedeng mag-reconcile ng starting balance anumang oras" : "Reconcile opening balances anytime" }}
              </span>
            </div>

            <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div v-for="group in walletGroups" :key="group.title" class="tipid-inset rounded-2xl p-4">
                <h4 class="text-xs font-bold text-[var(--text-primary)]">{{ group.title }}</h4>
                <div class="tipid-pill-row mt-2.5">
                  <span
                    v-for="w in group.items"
                    :key="w.id"
                    class="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 py-1 text-[11px] font-medium text-[var(--text-secondary)]"
                  >
                    {{ w.name }}
                  </span>
                </div>
              </div>
            </div>

            <div class="border-t border-[var(--border-subtle)] pt-4">
              <p class="mb-2.5 text-xs font-semibold text-[var(--text-secondary)]">
                {{ isTl ? "Mga Kategorya ng Paggastos" : "Expense Categories" }}
              </p>
              <div class="tipid-pill-row">
                <span
                  v-for="cat in CATEGORIES"
                  :key="cat"
                  class="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-inset)] px-3 py-1 text-xs font-medium text-[var(--text-primary)]"
                >
                  <span class="h-2 w-2 rounded-full" :style="{ backgroundColor: getCategoryColor(cat) }" aria-hidden="true" />
                  <span>{{ cat }}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Security, Precision & Privacy Architecture -->
      <section id="security" class="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] py-14 sm:py-16">
        <div class="mx-auto max-w-6xl px-4 sm:px-6">
          <div class="max-w-2xl">
            <p class="tipid-eyebrow text-[var(--accent)]">
              {{ isTl ? "Pinansyal na Integridad" : "Architecture & Security" }}
            </p>
            <h2 class="mt-2 text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
              {{ isTl ? "Dinisenyo para sa eksaktong tala at kaligtasan ng data" : "Engineered for financial accuracy and user privacy" }}
            </h2>
          </div>

          <div class="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
            <article v-for="pillar in securityPillars" :key="pillar.title" data-reveal class="tipid-inset rounded-3xl p-5 sm:p-6">
              <div class="tipid-icon-badge h-10 w-10 rounded-2xl bg-[var(--bg-surface)] text-[var(--accent)] shadow-xs">
                <component :is="pillar.icon" :size="18" aria-hidden="true" />
              </div>
              <h3 class="mt-4 text-base font-bold text-[var(--text-primary)]">{{ pillar.title }}</h3>
              <p class="mt-1.5 text-xs leading-relaxed text-[var(--text-secondary)]">
                {{ pillar.body }}
              </p>
            </article>
          </div>
        </div>
      </section>

      <!-- Native Accessible FAQ Accordion & Editorial Conversion Band -->
      <section id="faq" class="border-t border-[var(--border-subtle)] py-14 sm:py-16">
        <div class="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 sm:px-6 lg:grid-cols-12">
          <div class="lg:col-span-5">
            <div class="tipid-card-emerald rounded-3xl p-6 sm:p-7">
              <div class="flex items-center justify-between gap-2">
                <p class="tipid-eyebrow text-white/75">
                  {{ isTl ? "Handa nang magsimula?" : "Ready when you are" }}
                </p>
                <span class="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-2.5 py-1 text-[11px] font-semibold text-white">
                  <Users :size="12" aria-hidden="true" />
                  <span class="font-mono tabular-nums">{{ formattedUserCount }}</span>
                </span>
              </div>
              <h2 class="mt-3 text-2xl font-bold tracking-tight text-white">
                {{ isTl ? "Buuin ang iyong malinis na ledger ngayon." : "Start tracking with zero clutter today." }}
              </h2>
              <p class="mt-2 text-xs leading-relaxed text-white/80">
                {{ isTl ? "Libre, mabilis, gumagana offline, at protektado ang iyong personal na pinansyal na data." : "Free to set up, responsive across phones and desktops, and built for reliable offline sync." }}
              </p>
              <div class="mt-5 flex flex-wrap gap-2.5">
                <a
                  href="signup.html"
                  class="tipid-cta inline-flex min-h-[42px] items-center gap-1.5 rounded-2xl bg-white px-4 py-2.5 text-xs font-bold text-[#0F1A14] no-underline transition-opacity hover:opacity-95"
                >
                  <span>{{ isTl ? "Gumawa ng Account" : "Create Account" }}</span>
                  <ArrowRight :size="14" aria-hidden="true" />
                </a>
                <a
                  href="login.html"
                  class="inline-flex min-h-[42px] items-center rounded-2xl border border-white/25 bg-white/10 px-4 py-2.5 text-xs font-semibold text-white no-underline hover:bg-white/20"
                >
                  {{ isTl ? "Mag-sign in" : "Sign in" }}
                </a>
              </div>
            </div>
          </div>

          <div class="lg:col-span-7">
            <h2 id="faq-heading" class="text-xl font-bold tracking-tight text-[var(--text-primary)]">
              {{ isTl ? "Mga Karaniwang Tanong" : "Frequently Asked Questions" }}
            </h2>
            <div class="mt-4 space-y-2.5" aria-labelledby="faq-heading">
              <details
                v-for="(item, idx) in faqs"
                :key="item.q"
                :open="idx === 0"
                class="tipid-faq-item tipid-card overflow-hidden rounded-2xl"
              >
                <summary class="tipid-faq-summary px-5 py-4 text-sm font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-inset)]/45">
                  <span>{{ item.q }}</span>
                </summary>
                <div class="tipid-faq-content border-t border-[var(--border-subtle)] bg-[var(--bg-inset)]/35 px-5 py-3.5 text-xs leading-relaxed text-[var(--text-secondary)]">
                  {{ item.a }}
                </div>
              </details>
            </div>
          </div>
        </div>
      </section>
    </main>

    <footer class="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] py-6">
      <div class="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 text-xs text-[var(--text-muted)] sm:flex-row sm:px-6">
        <div class="flex items-center gap-2 font-semibold text-[var(--text-secondary)]">
          <img src="/assets/logo.svg" alt="" width="20" height="20" class="h-5 w-5 rounded-md" />
          <span>Tipid Expense Tracker</span>
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <span class="inline-flex items-center gap-1.5">
            <Users :size="13" class="text-[var(--accent)]" aria-hidden="true" />
            <span class="font-mono tabular-nums">{{ formattedUserCount }}</span>
            <span>{{ isTl ? "users" : "registered users" }}</span>
          </span>
          <span class="text-[var(--border-strong)]" aria-hidden="true">·</span>
          <span class="inline-flex items-center gap-1.5">
            <ShieldCheck :size="14" class="text-[var(--accent)]" aria-hidden="true" />
            <span>Private, offline-capable, integer-centavo accuracy</span>
          </span>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* Balanced wrapping for pill rows per css-layout guidance */
.tipid-pill-row {
  display: flex;
  flex-wrap: wrap;
  flex-wrap: balance;
  gap: 0.5rem;
}

/* Container-aware bento cards per card guidance */
.tipid-bento-card {
  container-type: inline-size;
}

/* Progressive scroll-entry reveal keeping compositor properties only & respecting reduced motion */
@media (prefers-reduced-motion: no-preference) {
  @supports ((animation-timeline: view()) and (animation-range: entry)) {
    @keyframes tipid-card-enter {
      from {
        opacity: 0.72;
        translate: 0 14px;
      }
      to {
        opacity: 1;
        translate: 0 0;
      }
    }

    [data-reveal] {
      animation: tipid-card-enter auto linear backwards;
      animation-timeline: view();
      animation-range: entry 0% entry 28%;
    }
  }
}

/* Native <details> FAQ disclosure marker & progressive collapse animation */
.tipid-faq-summary {
  list-style: none;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
}

.tipid-faq-summary::-webkit-details-marker {
  display: none;
}

.tipid-faq-summary::before {
  content: "";
  inline-size: 0.9em;
  block-size: 0.9em;
  flex-shrink: 0;
  border-inline-end: 2px solid var(--accent);
  border-block-end: 2px solid var(--accent);
  transform-origin: center;
  rotate: -45deg;
  scale: 0.55;
  margin-inline-end: 0.1rem;
}

.tipid-faq-item[open] > .tipid-faq-summary::before {
  rotate: 45deg;
}

.tipid-faq-item::details-content {
  interpolate-size: allow-keywords;
  overflow: clip;
  contain: layout;
}

.tipid-faq-item:not([open])::details-content {
  block-size: 0;
}

@media (prefers-reduced-motion: no-preference) {
  .tipid-faq-summary::before {
    transition: rotate 0.2s ease;
  }

  .tipid-faq-item::details-content {
    transition: block-size 0.25s ease-in-out, content-visibility 0.25s ease-in-out, display 0.25s ease-in-out;
    transition-behavior: allow-discrete;
  }
}
</style>
