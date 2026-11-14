<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted } from "vue";
import {
  ArrowRight,
  ShieldCheck,
  Sun,
  Moon,
  Monitor,
  Wallet,
  ReceiptText,
  Coffee,
  Utensils,
  Smartphone,
  Fingerprint,
  Users,
  CheckCircle2,
  ArrowDownLeft,
  ArrowUpRight,
  Database,
  RefreshCw,
  HardDrive,
  Sparkles,
  Zap,
  Flame,
  Check,
  Lock,
  MessageSquare,
  Wifi,
  WifiOff,
  Download
} from "@lucide/vue";
import { CATEGORIES, formatPeso, getCategoryColor, SUPPORTED_WALLETS } from "@/lib/core";
import { parseTransactionSms } from "@/lib/smsParser";
import { setLanguage, useI18n } from "@/lib/i18n";
import { useTheme } from "@/composables/useTheme";
import { subscribePublicUserCount, type PublicUserCountSnapshot } from "@/lib/publicStats";
import { networkOnline } from "@/lib/offlineSync";
import { swReady } from "@/lib/swRegistration";
import WalletCard from "@/components/WalletCard.vue";
import TipidCoachAvatar from "@/components/TipidCoachAvatar.vue";

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
  if (userStats.value.totalUsers === null) return "1,200+";
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

/* ---- Interactive 3D ATM Cards & Live Deduction Sandbox (Hero) ---- */
const heroWallets = [
  { id: "MariBank", name: "MariBank", subtitle: "Shopee · 2.5% P.A.", color: "#106A43" },
  { id: "GCash", name: "GCash", subtitle: "Visa Debit", color: "#007DFE" },
  { id: "Maya", name: "Maya", subtitle: "Black Card", color: "#111827" },
  { id: "LandBank", name: "LandBank", subtitle: "Gov / Payroll", color: "#007A33" }
];

const selectedHeroWallet = ref("MariBank");
const heroCardBalance = ref(28450.50);
const heroTotalBalance = ref(45200.00);
const lastDeductionNotice = ref<{ text: string; type: "deduct" | "add" } | null>(null);

function simulateHeroDeduct(desc: string, amount: number) {
  heroCardBalance.value = Math.max(0, Math.round((heroCardBalance.value - amount) * 100) / 100);
  lastDeductionNotice.value = {
    text: isTl.value
      ? `-₱${formatPeso(amount)} (${desc}) bawas sa ${selectedHeroWallet.value}`
      : `-₱${formatPeso(amount)} (${desc}) deducted from ${selectedHeroWallet.value}`,
    type: "deduct"
  };
  setTimeout(() => {
    if (lastDeductionNotice.value?.text.includes(desc)) {
      lastDeductionNotice.value = null;
    }
  }, 3500);
}

function simulateHeroAdd(desc: string, amount: number) {
  heroCardBalance.value = Math.round((heroCardBalance.value + amount) * 100) / 100;
  lastDeductionNotice.value = {
    text: isTl.value
      ? `+₱${formatPeso(amount)} (${desc}) pumasok sa ${selectedHeroWallet.value}`
      : `+₱${formatPeso(amount)} (${desc}) credited to ${selectedHeroWallet.value}`,
    type: "add"
  };
  setTimeout(() => {
    if (lastDeductionNotice.value?.text.includes(desc)) {
      lastDeductionNotice.value = null;
    }
  }, 3500);
}

function switchLanguage() {
  setLanguage(lang.value === "tl" ? "en" : "tl");
}

/* ---- AOS (Animate On Scroll) Engine ---- */
let aosObserver: IntersectionObserver | null = null;

function initAOS() {
  if (typeof window === "undefined") return;

  const elements = document.querySelectorAll("[data-aos]");
  if (!("IntersectionObserver" in window)) {
    elements.forEach((el) => el.classList.add("aos-animate"));
    return;
  }

  aosObserver?.disconnect();
  aosObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("aos-animate");
          if (entry.target.getAttribute("data-aos-once") !== "false") {
            aosObserver?.unobserve(entry.target);
          }
        } else if (entry.target.getAttribute("data-aos-once") === "false") {
          entry.target.classList.remove("aos-animate");
        }
      });
    },
    {
      threshold: 0.12,
      rootMargin: "0px 0px -30px 0px"
    }
  );

  elements.forEach((el) => aosObserver?.observe(el));
}

onMounted(() => {
  unsubStats = subscribePublicUserCount((snap) => {
    userStats.value = snap;
  });
  window.addEventListener("beforeinstallprompt", onBeforeInstall);
  window.addEventListener("appinstalled", onAppInstalled);

  void nextTick(() => {
    initAOS();
  });
});

onUnmounted(() => {
  unsubStats?.();
  aosObserver?.disconnect();
  window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  window.removeEventListener("appinstalled", onAppInstalled);
});

/* ---- Interactive Real SMS Parser Sandbox ---- */
const SMS_SAMPLES = [
  "You have paid PHP 340.00 via GCash to Meralco on 11/14/2026. Ref No. 904122.",
  "You paid PHP 485.50 using Maya at Jollibee Makati.",
  "Received PHP 18,500.00 salary transfer to your SeaBank account from Acme PH.",
  "You paid PHP 1,250.00 using MariBank Card •••• 9071 at Uniqlo SM Megamall."
] as const;

const smsSampleText = ref<string>(SMS_SAMPLES[3]);
const supportedWalletIds = SUPPORTED_WALLETS.map((w) => w.id);
const parsedSmsDemo = computed(() => parseTransactionSms(smsSampleText.value, supportedWalletIds));

/* ---- Interactive Workspace Tour Tabs ---- */
type TourTabId = "overview" | "sms" | "coach" | "commitments";
const activeTourTab = ref<TourTabId>("overview");
const tabButtonRefs = ref<Array<HTMLButtonElement | null>>([]);

const tourTabs = computed<Array<{ id: TourTabId; domId: string; label: string }>>(() =>
  isTl.value
    ? [
        { id: "overview", domId: "tour-tab-overview", label: "3D Wallet Deck" },
        { id: "sms", domId: "tour-tab-sms", label: "SMS Auto-Deduct" },
        { id: "coach", domId: "tour-tab-coach", label: "Tipid Coach AI" },
        { id: "commitments", domId: "tour-tab-commitments", label: "Bills & Utang" }
      ]
    : [
        { id: "overview", domId: "tour-tab-overview", label: "3D Wallet Deck" },
        { id: "sms", domId: "tour-tab-sms", label: "SMS Auto-Deduct" },
        { id: "coach", domId: "tour-tab-coach", label: "Tipid Coach AI" },
        { id: "commitments", domId: "tour-tab-commitments", label: "Bills & Utang" }
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

/* ---- Offline Mode Capabilities Showcase ---- */
const offlinePillars = computed(() =>
  isTl.value
    ? [
        {
          step: "01",
          icon: Database,
          title: "IndexedDB Local Engine",
          body: "Lahat ng wallet balances, utang, at transactions mo ay naka-save sa secure storage ng iyong browser — mabilis mag-load kahit walang data."
        },
        {
          step: "02",
          icon: RefreshCw,
          title: "Automatic Background Sync",
          body: "Mag-log ng gastos sa jeep o elevator na walang signal. Pagkabalik ng Wi-Fi o data, kusa itong mag-si-sync sa Firebase cloud."
        },
        {
          step: "03",
          icon: HardDrive,
          title: "Service Worker PWA Cache",
          body: "Instantly magbubukas ang app kahit naka-airplane mode. Walang loading spinner at hindi nauubos ang mobile data mo."
        }
      ]
    : [
        {
          step: "01",
          icon: Database,
          title: "IndexedDB Local Storage",
          body: "All wallet balances, loans, and expenses live locally in browser storage first — instant read and write with zero latency."
        },
        {
          step: "02",
          icon: RefreshCw,
          title: "Conflict-Free Sync Queue",
          body: "Log transactions offline in transit or elevators. As soon as connectivity returns, changes sync seamlessly to Firebase."
        },
        {
          step: "03",
          icon: HardDrive,
          title: "PWA Service Worker Cache",
          body: "The complete app shell is cached locally. Launch Tipid instantly even in airplane mode without consuming mobile data."
        }
      ]
);

const modules = computed(() =>
  isTl.value
    ? [
        {
          icon: Wallet,
          tone: "bg-[var(--accent-soft)] text-[var(--accent)]",
          title: "3D Philippine Wallet Deck",
          body: "26 na bangko at e-wallets (MariBank, GCash, Maya, LandBank, BDO, BPI). Centavo-exact integer math na walang rounding error."
        },
        {
          icon: Zap,
          tone: "bg-[var(--income-soft)] text-[var(--income)]",
          title: "Magic Bank SMS Reader",
          body: "I-paste lang ang SMS confirmation mula sa bangko o e-wallet — kusa nang magbabawas sa tamang card nang may 3D animation."
        },
        {
          icon: MessageSquare,
          tone: "bg-[var(--accent-soft)] text-[var(--accent)]",
          title: "Tipid Coach AI Assistant",
          body: "May sarili kang Pinoy financial coach na may natural na boses para sagutin kung kaya ba ng budget mo ang bibilhin o split ang sahod."
        },
        {
          icon: ReceiptText,
          tone: "bg-[var(--warning-soft)] text-[var(--warning)]",
          title: "Bills & Utang Tracker",
          body: "Due-date calendar para sa kuryente at tubig, kasama ang malinaw na talaan ng pautang at babayarang utang para walang kalimutan."
        }
      ]
    : [
        {
          icon: Wallet,
          tone: "bg-[var(--accent-soft)] text-[var(--accent)]",
          title: "Tactile 3D Wallet Deck",
          body: "26 Philippine banks and digital wallets with realistic 3D flip textures. Exact integer-centavo accounting without floating-point drift."
        },
        {
          icon: Zap,
          tone: "bg-[var(--income-soft)] text-[var(--income)]",
          title: "Smart Bank SMS Parser",
          body: "Paste text receipts from MariBank, GCash, Maya, or BDO. Instantly extracts amount, merchant, and method with auto-deduct animation."
        },
        {
          icon: MessageSquare,
          tone: "bg-[var(--accent-soft)] text-[var(--accent)]",
          title: "Tipid Coach AI Assistant",
          body: "An intelligent bilingual companion with realistic human voice that checks affordability, splits paydays, and guards your budget buffer."
        },
        {
          icon: ReceiptText,
          tone: "bg-[var(--warning-soft)] text-[var(--warning)]",
          title: "Bills & Utang Lifecycle",
          body: "Track due dates, recurring bills, and net lending/borrowing balances with complete payment logging and audit history."
        }
      ]
);

const walletGroups = computed(() => [
  {
    title: isTl.value ? "Digital Banks & E-Wallets" : "Digital Banks & E-Wallets",
    items: SUPPORTED_WALLETS.filter((w) =>
      ["gcash", "maya", "seabank", "maribank", "gotyme", "tonik", "shopeepay", "grabpay"].includes(w.id)
    )
  },
  {
    title: isTl.value ? "Traditional Banks" : "Major Traditional Banks",
    items: SUPPORTED_WALLETS.filter((w) =>
      ["bdo", "bpi", "landbank", "metrobank", "unionbank", "rcbc", "securitybank", "pnb"].includes(w.id)
    )
  },
  {
    title: isTl.value ? "Cash & Savings Jars" : "Cash & Dedicated Envelopes",
    items: SUPPORTED_WALLETS.filter((w) =>
      ["cash", "savings", "emergency", "pagibig_mp2"].includes(w.id)
    )
  }
]);

const securityPillars = computed(() =>
  isTl.value
    ? [
        {
          icon: Lock,
          title: "Zero Bank Credentials Needed",
          body: "Hindi namin kailanman hihingin ang iyong bank username, password, o OTP. Ikaw ang may buong kontrol sa data mo gamit ang local parser."
        },
        {
          icon: Fingerprint,
          title: "6-Digit App Lock PIN",
          body: "Protektado ang iyong ledger gamit ang PBKDF2 cryptographic hashing at brute-force lockout laban sa mga makikitingin sa phone mo."
        },
        {
          icon: ShieldCheck,
          title: "Per-User Firestore Security",
          body: "Ang data mo ay eksklusibong nakatali sa iyong verified UID gamit ang server-enforced security rules. Walang ibang makakabasa."
        }
      ]
    : [
        {
          icon: Lock,
          title: "Zero Bank Password Access",
          body: "We never ask for your bank login, credentials, or OTPs. All SMS and receipt extractions run 100% locally on your own device."
        },
        {
          icon: Fingerprint,
          title: "Cryptographic PIN App Lock",
          body: "Secure your workspace with a 6-digit PIN protected by PBKDF2 salted hashing with automatic brute-force lockout protection."
        },
        {
          icon: ShieldCheck,
          title: "Server-Enforced Access Control",
          body: "Strict deny-by-default Firestore rules ensure users can only ever access their own financial records. Verified by automated tests."
        }
      ]
);

const faqs = computed(() =>
  isTl.value
    ? [
        {
          q: "Libre ba talaga ang Tipid? May hidden fees ba o subscription?",
          a: "Oo, 100% libre ang Tipid. Walang subscription, walang paywall sa mga features, at walang nakakainis na pop-up ads."
        },
        {
          q: "Ligtas ba ang pera at data ko? Kailangan ko ba i-link ang bank account ko?",
          a: "Hindi mo kailangang i-link ang bangko o magbigay ng passwords o OTP. Ang Tipid ay gumagamit ng offline-safe SMS parser — kopyahin mo lang ang text confirmation at awtomatiko itong magbabawas sa 3D card mo."
        },
        {
          q: "Paano ko mai-install ang Tipid sa aking iPhone o Android phone?",
          a: "Sa iPhone (Safari), i-tap ang 'Share' button sa ilalim at piliin ang 'Add to Home Screen'. Sa Android (Chrome), i-tap ang menu (3 dots) at piliin ang 'Install App'. May app icon ka na agad sa phone mo nang walang dinadownload na 100MB mula sa App Store!"
        },
        {
          q: "Gumagana ba ito kapag walang internet o mahina ang signal?",
          a: "Oo! Binuo ang Tipid bilang Offline-First PWA. Lahat ng gastusin mo ay naka-save sa IndexedDB ng phone mo at kusa itong mag-si-sync kapag nagkaroon muli ng internet connection."
        },
        {
          q: "Bakit may 3D Philippine ATM Cards ang Tipid?",
          a: "Dahil ang pag-budget ay dapat visually satisfying at masaya! Ang bawat card (LandBank, MariBank, GCash, Maya, BDO) ay may authentic 3D flip animation at eksaktong centavo balance para maramdaman mong hawak mo talaga ang iyong mga pitaka."
        }
      ]
    : [
        {
          q: "Is Tipid completely free? Are there subscription fees or ads?",
          a: "Yes, Tipid is 100% free with zero paywalls, zero subscription tiers, and no intrusive ads."
        },
        {
          q: "Do I need to connect my real bank account or give my password?",
          a: "No! Tipid never asks for bank logins, credentials, or OTPs. You simply paste SMS transaction notices, and our offline-safe client parser extracts the amount and merchant locally."
        },
        {
          q: "How do I install Tipid on my iPhone or Android device?",
          a: "On iOS Safari, tap the Share icon and select 'Add to Home Screen'. On Android Chrome, tap the menu and select 'Install App'. It installs in seconds as a high-performance PWA!"
        },
        {
          q: "Can I use Tipid when I have no internet signal?",
          a: "Yes! Tipid is engineered offline-first. Your entire ledger and 3D wallet balances are cached locally in IndexedDB, syncing seamlessly once connection returns."
        },
        {
          q: "What makes the 3D Philippine ATM Cards special?",
          a: "Financial tracking should be tactile and enjoyable. Every card (MariBank, GCash, Maya, LandBank, BPI) is rendered in realistic 3D with flip interactions, metallic chips, and centavo precision."
        }
      ]
);
</script>

<template>
  <div class="min-h-dvh flex flex-col bg-[var(--bg-canvas)] text-[var(--text-primary)]">
    <!-- Floating Glass Capsule Navigation -->
    <div
      class="pointer-events-none sticky top-0 z-40 mx-auto w-full max-w-6xl px-3 sm:px-6"
      style="padding-top: max(0.75rem, var(--safe-top))"
    >
      <header
        class="tipid-floating-chrome pointer-events-auto flex items-center justify-between gap-2 rounded-3xl px-3.5 py-2.5 sm:px-5"
        data-aos="fade-down"
        data-aos-duration="600"
      >
        <div class="flex shrink-0 items-center gap-5">
          <a href="index.html" class="flex shrink-0 items-center gap-2.5 no-underline">
            <img src="/assets/logo.svg" alt="" width="34" height="34" class="h-8.5 w-8.5 shrink-0 rounded-xl shadow-xs" />
            <div class="flex items-center gap-1.5">
              <span class="whitespace-nowrap text-base font-bold tracking-tight text-[var(--text-primary)] sm:text-lg">Tipid</span>
              <span class="rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-[10px] font-bold text-[var(--accent)]">3D PWA</span>
            </div>
          </a>

          <div class="hidden items-center gap-3 text-xs font-semibold text-[var(--text-secondary)] lg:flex">
            <a href="#hero-demo" class="rounded-full px-2.5 py-1.5 no-underline transition-colors hover:bg-[var(--bg-inset)] hover:text-[var(--text-primary)]">
              {{ isTl ? "3D Cards Demo" : "3D Cards Demo" }}
            </a>
            <a href="#transformation" class="rounded-full px-2.5 py-1.5 no-underline transition-colors hover:bg-[var(--bg-inset)] hover:text-[var(--text-primary)]">
              {{ isTl ? "Bakit Tipid?" : "Why Tipid?" }}
            </a>
            <a href="#tour" class="rounded-full px-2.5 py-1.5 no-underline transition-colors hover:bg-[var(--bg-inset)] hover:text-[var(--text-primary)]">
              {{ isTl ? "Features" : "Features" }}
            </a>
            <a href="#offline" class="rounded-full px-2.5 py-1.5 no-underline transition-colors hover:bg-[var(--bg-inset)] hover:text-[var(--text-primary)]">
              {{ isTl ? "Offline PWA" : "Offline PWA" }}
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
            class="tipid-compact inline-flex h-[36px] items-center rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 text-xs font-semibold text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-inset)] hover:text-[var(--text-primary)]"
            @click="switchLanguage"
          >
            {{ isTl ? "EN" : "FIL" }}
          </button>

          <button
            type="button"
            class="tipid-compact inline-flex h-[36px] w-[36px] items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-inset)] hover:text-[var(--text-primary)]"
            aria-label="Toggle color theme"
            @click="toggleQuickTheme"
          >
            <Sun v-if="themePreference === 'light'" :size="15" aria-hidden="true" />
            <Moon v-else-if="themePreference === 'dark'" :size="15" aria-hidden="true" />
            <Monitor v-else :size="15" aria-hidden="true" />
          </button>

          <a
            href="login.html"
            class="hidden min-h-[36px] items-center rounded-full px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap text-[var(--text-secondary)] no-underline transition-colors hover:bg-[var(--bg-inset)] hover:text-[var(--text-primary)] sm:inline-flex"
          >
            {{ isTl ? "Mag-log in" : "Sign in" }}
          </a>

          <a
            href="signup.html"
            class="tipid-cta tipid-glow-button inline-flex min-h-[36px] items-center gap-1.5 rounded-full bg-[var(--accent)] px-4 py-1.5 text-xs font-bold whitespace-nowrap text-white no-underline hover:bg-[var(--accent-hover)] shadow-md shadow-[var(--accent)]/20"
          >
            <Sparkles :size="13" class="animate-pulse" aria-hidden="true" />
            <span>{{ isTl ? "Magsimula Na (Libre)" : "Get Started Free" }}</span>
          </a>
        </nav>
      </header>
    </div>

    <main class="flex-1">
      <!-- High-Energy FOMO Hero Section with Interactive 3D ATM Card Playground -->
      <section id="hero-demo" class="tipid-atmosphere relative overflow-x-clip border-b border-[var(--border-subtle)] pt-4 pb-14 sm:pb-20">
        <div class="tipid-grid-bg pointer-events-none absolute inset-0 opacity-50" aria-hidden="true" />

        <div class="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-4 pt-6 sm:px-6 lg:grid-cols-12 lg:gap-12 lg:pt-12">
          <!-- Left Column: The Irresistible Hook & Social Proof -->
          <div class="space-y-6 lg:col-span-6" data-aos="fade-right" data-aos-duration="750">
            <!-- Launch Badge -->
            <div class="flex flex-wrap items-center gap-2">
              <span class="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-500 dark:text-amber-400 shadow-xs">
                <Flame :size="14" class="text-amber-500" aria-hidden="true" />
                <span>{{ isTl ? "Unang Pinoy 3D Budget PWA" : "The 1st Pinoy 3D Budget PWA" }}</span>
              </span>

              <span class="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[var(--accent)]">
                <Users :size="13" aria-hidden="true" />
                <span class="font-mono font-bold tabular-nums">{{ formattedUserCount }}</span>
                <span>{{ isTl ? "Pinoys tracking" : "active users" }}</span>
              </span>
            </div>

            <!-- Big Emotional Headline -->
            <h1 class="text-3xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-4xl lg:text-5xl lg:leading-[1.12]">
              <template v-if="isTl">
                Saan napupunta ang sahod mo?
                <span class="bg-gradient-to-r from-[var(--accent)] to-[#48e3a8] bg-clip-text text-transparent">
                  Huwag mong hulaan.
                </span>
              </template>
              <template v-else>
                Where does your payday go?
                <span class="bg-gradient-to-r from-[var(--accent)] to-[#48e3a8] bg-clip-text text-transparent">
                  Stop guessing.
                </span>
              </template>
            </h1>

            <!-- High-Impact Description -->
            <p class="max-w-xl text-base leading-relaxed text-[var(--text-secondary)] sm:text-lg">
              <template v-if="isTl">
                I-paste lang ang text ng <strong class="text-[var(--text-primary)]">MariBank, GCash, Maya, o LandBank</strong>, kusa nang magbabawas sa 3D ATM card mo. May Utang tracker, Bills calendar, at Tipid Coach AI na magsasabi kung kaya pa ng budget mo.
              </template>
              <template v-else>
                Paste SMS confirmations from <strong class="text-[var(--text-primary)]">MariBank, GCash, Maya, or BDO</strong> to auto-deduct from realistic 3D ATM cards. Comes with Utang tracking, Bills schedule, and Tipid Coach AI.
              </template>
            </p>

            <!-- Conversion Action Buttons -->
            <div class="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
              <a
                href="signup.html"
                class="tipid-cta group inline-flex min-h-[50px] items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] px-7 py-3 text-sm font-bold text-white no-underline shadow-lg shadow-[var(--accent)]/25 hover:bg-[var(--accent-hover)] transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>{{ isTl ? "Subukan ang Tipid (100% Libre)" : "Try Tipid Free Today" }}</span>
                <ArrowRight :size="16" class="transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </a>

              <a
                href="#transformation"
                class="inline-flex min-h-[50px] items-center justify-center gap-2 rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-surface)] px-5 py-3 text-sm font-semibold text-[var(--text-primary)] no-underline shadow-xs transition-colors hover:bg-[var(--bg-inset)]"
              >
                <span>{{ isTl ? "Bakit Iba si Tipid? ↓" : "Why Tipid is Different ↓" }}</span>
              </a>
            </div>

            <!-- Trust Highlights Grid -->
            <div class="grid grid-cols-2 gap-3 pt-2 text-xs font-semibold text-[var(--text-secondary)] sm:grid-cols-3">
              <div class="flex items-center gap-2">
                <Check :size="15" class="shrink-0 text-[var(--income)]" aria-hidden="true" />
                <span>{{ isTl ? "0 Subscription Fee" : "Zero Subscription" }}</span>
              </div>
              <div class="flex items-center gap-2">
                <Check :size="15" class="shrink-0 text-[var(--income)]" aria-hidden="true" />
                <span>{{ isTl ? "Walang makulit na Ads" : "100% Ad-Free" }}</span>
              </div>
              <div class="col-span-2 flex items-center gap-2 sm:col-span-1">
                <Check :size="15" class="shrink-0 text-[var(--income)]" aria-hidden="true" />
                <span>{{ isTl ? "Walang Bank Password" : "No Bank Login Needed" }}</span>
              </div>
            </div>
          </div>

          <!-- Right Column: Interactive 3D ATM Card Playground -->
          <div class="lg:col-span-6" data-aos="fade-left" data-aos-duration="750" data-aos-delay="150">
            <div class="tipid-card rounded-3xl p-5 sm:p-6 space-y-4 border border-[var(--border-subtle)] shadow-xl shadow-black/5 bg-[var(--bg-surface)]">
              <!-- Header Bar of Interactive Playground -->
              <div class="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
                <div class="flex items-center gap-2">
                  <span class="flex h-2.5 w-2.5 rounded-full bg-[var(--income)] animate-ping" />
                  <span class="text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
                    {{ isTl ? "Live Interactive 3D Card Playground" : "Live 3D Card Playground" }}
                  </span>
                </div>
                <span class="text-[11px] font-medium text-[var(--text-muted)]">
                  {{ isTl ? "I-tap ang card para mag-flip 3D" : "Tap card to flip in 3D" }}
                </span>
              </div>

              <!-- Philippine Bank Card Switcher Chips -->
              <div class="flex items-center gap-1.5 overflow-x-auto pb-1">
                <button
                  v-for="card in heroWallets"
                  :key="card.id"
                  type="button"
                  :class="[
                    'tipid-compact shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all',
                    selectedHeroWallet === card.id
                      ? 'bg-[var(--accent)] text-white shadow-xs scale-[1.02]'
                      : 'border border-[var(--border-subtle)] bg-[var(--bg-inset)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  ]"
                  @click="selectedHeroWallet = card.id"
                >
                  {{ card.name }}
                </button>
              </div>

              <!-- The Real Tactile 3D Card Mounted in the Hero! -->
              <div class="relative py-2">
                <WalletCard
                  :method="selectedHeroWallet"
                  :balance="heroCardBalance"
                  :total-positive-balance="heroTotalBalance"
                  :show-edit="false"
                />

                <!-- Dynamic Floating Deduction Toast -->
                <transition name="fade">
                  <div
                    v-if="lastDeductionNotice"
                    :class="[
                      'absolute top-4 right-4 z-20 flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold shadow-lg backdrop-blur-md',
                      lastDeductionNotice.type === 'deduct'
                        ? 'border border-[var(--expense)]/30 bg-[var(--expense-soft)] text-[var(--expense)]'
                        : 'border border-[var(--income)]/30 bg-[var(--income-soft)] text-[var(--income)]'
                    ]"
                  >
                    <Zap :size="13" class="animate-bounce" aria-hidden="true" />
                    <span>{{ lastDeductionNotice.text }}</span>
                  </div>
                </transition>
              </div>

              <!-- Interactive Simulated Actions (Instant Gratification!) -->
              <div class="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-inset)]/60 p-3.5 space-y-2.5">
                <div class="flex items-center justify-between text-xs">
                  <span class="font-bold text-[var(--text-primary)]">
                    {{ isTl ? "Subukan magbawas o magdagdag (Live Demo):" : "Test instant deduction & credit (Live Demo):" }}
                  </span>
                  <span class="font-mono text-[11px] text-[var(--text-muted)]">
                    {{ isTl ? "Centavo-exact" : "Integer cents" }}
                  </span>
                </div>

                <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <button
                    type="button"
                    class="tipid-compact flex flex-col items-center justify-center gap-0.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-2 text-center transition-all hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] active:scale-95"
                    @click="simulateHeroDeduct('Kape', 110)"
                  >
                    <Coffee :size="14" class="text-[var(--accent)]" aria-hidden="true" />
                    <span class="text-[11px] font-semibold text-[var(--text-primary)]">Kape</span>
                    <span class="font-mono text-[10px] text-[var(--expense)] font-bold">-₱110.00</span>
                  </button>

                  <button
                    type="button"
                    class="tipid-compact flex flex-col items-center justify-center gap-0.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-2 text-center transition-all hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] active:scale-95"
                    @click="simulateHeroDeduct('Jollibee', 245)"
                  >
                    <Utensils :size="14" class="text-[var(--accent)]" aria-hidden="true" />
                    <span class="text-[11px] font-semibold text-[var(--text-primary)]">Jollibee</span>
                    <span class="font-mono text-[10px] text-[var(--expense)] font-bold">-₱245.00</span>
                  </button>

                  <button
                    type="button"
                    class="tipid-compact flex flex-col items-center justify-center gap-0.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-2 text-center transition-all hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] active:scale-95"
                    @click="simulateHeroDeduct('Meralco', 2150)"
                  >
                    <Zap :size="14" class="text-[var(--warning)]" aria-hidden="true" />
                    <span class="text-[11px] font-semibold text-[var(--text-primary)]">Meralco</span>
                    <span class="font-mono text-[10px] text-[var(--expense)] font-bold">-₱2,150.00</span>
                  </button>

                  <button
                    type="button"
                    class="tipid-compact flex flex-col items-center justify-center gap-0.5 rounded-xl border border-[var(--income)]/30 bg-[var(--income-soft)] p-2 text-center transition-all hover:bg-[var(--income)] hover:text-white active:scale-95 text-[var(--income)]"
                    @click="simulateHeroAdd('Sahod', 15000)"
                  >
                    <ArrowDownLeft :size="14" aria-hidden="true" />
                    <span class="text-[11px] font-semibold">Sahod / Sweldo</span>
                    <span class="font-mono text-[10px] font-bold">+₱15,000.00</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- The Transformation: Bago Mag-Tipid vs May Tipid (High Emotional Punch) -->
      <section id="transformation" class="border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] py-16 sm:py-20">
        <div class="mx-auto max-w-6xl px-4 sm:px-6 space-y-12">
          <div class="text-center max-w-2xl mx-auto space-y-3" data-aos="fade-up">
            <span class="inline-flex items-center gap-1.5 rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-bold text-[var(--accent)]">
              <Sparkles :size="13" aria-hidden="true" />
              <span>{{ isTl ? "Bakit Hindi Pwedeng Hindi Mo Subukan?" : "Why You Need Tipid Today" }}</span>
            </span>
            <h2 class="text-2xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-3xl lg:text-4xl">
              {{ isTl ? "Itigil na ang hulaan sa sahod at gastusin." : "Stop the financial stress before payday." }}
            </h2>
            <p class="text-sm text-[var(--text-secondary)] sm:text-base">
              {{
                isTl
                  ? "Narito kung bakit lumipat na ang maraming Pinoy mula sa makukulit na apps at manual spreadsheets patungo sa Tipid."
                  : "Here is why Filipinos are switching from clunky budgeting apps and tedious spreadsheets to Tipid."
              }}
            </p>
          </div>

          <!-- Side-by-Side Comparison Bento Grid -->
          <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <!-- Left: Without Tipid (Pain) -->
            <div
              class="rounded-3xl border border-red-500/20 bg-red-500/[0.03] p-6 sm:p-8 space-y-5"
              data-aos="fade-right"
              data-aos-duration="700"
            >
              <div class="flex items-center gap-3">
                <span class="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-500/15 text-red-500 font-bold text-lg">
                  ✕
                </span>
                <div>
                  <h3 class="text-lg font-bold text-red-500 dark:text-red-400">
                    {{ isTl ? "Buhay Bago Mag-Tipid (The Pain)" : "Without Tipid (The Struggle)" }}
                  </h3>
                  <p class="text-xs text-[var(--text-muted)]">
                    {{ isTl ? "Mga problemang kinakaharap nating mga Pinoy" : "Common pain points of manual tracking" }}
                  </p>
                </div>
              </div>

              <ul class="space-y-4 text-xs sm:text-sm text-[var(--text-secondary)]">
                <li class="flex items-start gap-3">
                  <span class="text-red-500 font-bold shrink-0 mt-0.5">✕</span>
                  <div>
                    <strong class="text-[var(--text-primary)]">{{ isTl ? "Ghost Spending:" : "Ghost Spending:" }}</strong>
                    {{ isTl ? " May ₱10,000 ka pa kahapon pero bakit ₱1,200 na lang ngayon nang hindi mo namamalayan?" : " You had ₱10k yesterday, but somehow only have ₱1,200 left today without knowing where it went." }}
                  </div>
                </li>
                <li class="flex items-start gap-3">
                  <span class="text-red-500 font-bold shrink-0 mt-0.5">✕</span>
                  <div>
                    <strong class="text-[var(--text-primary)]">{{ isTl ? "Nakakatamad Mag-Log:" : "Tedious Logging:" }}</strong>
                    {{ isTl ? " Nakakatamad buksan ang spreadsheet para mag-type ng bawat ₱20 tricycle o ₱65 kape." : " Opening spreadsheets to manually type every ₱20 commute or ₱65 coffee burns you out quickly." }}
                  </div>
                </li>
                <li class="flex items-start gap-3">
                  <span class="text-red-500 font-bold shrink-0 mt-0.5">✕</span>
                  <div>
                    <strong class="text-[var(--text-primary)]">{{ isTl ? "Nakalimutang Bills & Penalty:" : "Missed Bills & Late Fees:" }}</strong>
                    {{ isTl ? " Napuputulan ng Wifi o nagbabayad ng late penalty sa kuryente kasi nakalimutan ang due date." : " Forgetting utility deadlines leads to reconnection fees and unwanted stress." }}
                  </div>
                </li>
                <li class="flex items-start gap-3">
                  <span class="text-red-500 font-bold shrink-0 mt-0.5">✕</span>
                  <div>
                    <strong class="text-[var(--text-primary)]">{{ isTl ? "Nahihiyang Maningil ng Utang:" : "Lost Utang Records:" }}</strong>
                    {{ isTl ? " Nakalimutan mo na kung sino ang may utang sa'yo at magkano pa ang kulang nilang hulog." : " Unrecorded loans and informal utang lead to awkward follow-ups and lost money." }}
                  </div>
                </li>
                <li class="flex items-start gap-3">
                  <span class="text-red-500 font-bold shrink-0 mt-0.5">✕</span>
                  <div>
                    <strong class="text-[var(--text-primary)]">{{ isTl ? "Makukulit na Ads & Mahal na Subscription:" : "Aggressive Ads & Paywalls:" }}</strong>
                    {{ isTl ? " Mga tracker sa app store na may ₱300/month subscription o punong-puno ng video ads." : " Most budget apps bombard you with popup video ads or demand ₱300/month subscriptions." }}
                  </div>
                </li>
              </ul>
            </div>

            <!-- Right: With Tipid (Peace of Mind & Excitement) -->
            <div
              class="rounded-3xl border border-[var(--accent)]/40 bg-[var(--accent)]/[0.04] p-6 sm:p-8 space-y-5 shadow-lg shadow-[var(--accent)]/5"
              data-aos="fade-left"
              data-aos-duration="700"
              data-aos-delay="150"
            >
              <div class="flex items-center gap-3">
                <span class="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--accent)] text-white font-bold text-lg shadow-sm">
                  ✓
                </span>
                <div>
                  <h3 class="text-lg font-bold text-[var(--accent)]">
                    {{ isTl ? "Buhay Gamit ang Tipid (Peace of Mind)" : "With Tipid (Effortless Peace of Mind)" }}
                  </h3>
                  <p class="text-xs text-[var(--text-muted)]">
                    {{ isTl ? "Binuo para sa tunay na sitwasyon ng Pinoy" : "Built specifically for modern Filipino cash flow" }}
                  </p>
                </div>
              </div>

              <ul class="space-y-4 text-xs sm:text-sm text-[var(--text-secondary)]">
                <li class="flex items-start gap-3">
                  <span class="text-[var(--accent)] font-bold shrink-0 mt-0.5">✓</span>
                  <div>
                    <strong class="text-[var(--text-primary)]">{{ isTl ? "Centavo-Exact 3D Wallet Deck:" : "Tactile 3D Wallet Deck:" }}</strong>
                    {{ isTl ? " Isang tingin lang sa 3D cards mo, alam mo agad ang bawat sentimo sa GCash, Maya, at MariBank." : " Real 3D cards with centavo precision give you instant visibility across every bank." }}
                  </div>
                </li>
                <li class="flex items-start gap-3">
                  <span class="text-[var(--accent)] font-bold shrink-0 mt-0.5">✓</span>
                  <div>
                    <strong class="text-[var(--text-primary)]">{{ isTl ? "Magic SMS Auto-Deduct:" : "Magic SMS Auto-Deduct:" }}</strong>
                    {{ isTl ? " I-copy-paste lang ang SMS confirmation ng bangko, kusa nang magbabawas sa 3D card nang walang kahirap-hirap." : " Copy-paste SMS confirmations from your bank to automatically log amounts and merchants." }}
                  </div>
                </li>
                <li class="flex items-start gap-3">
                  <span class="text-[var(--accent)] font-bold shrink-0 mt-0.5">✓</span>
                  <div>
                    <strong class="text-[var(--text-primary)]">{{ isTl ? "Smart Bills Calendar:" : "Visual Due-Date Radar:" }}</strong>
                    {{ isTl ? " May countdown badges para sa kuryente at tubig para alam mo kung kailan dapat magtabi ng pambayad." : " Upcoming bills show exact days remaining so you never miss another payment." }}
                  </div>
                </li>
                <li class="flex items-start gap-3">
                  <span class="text-[var(--accent)] font-bold shrink-0 mt-0.5">✓</span>
                  <div>
                    <strong class="text-[var(--text-primary)]">{{ isTl ? "Utang & Pautang Manager:" : "Clear Net Utang Position:" }}</strong>
                    {{ isTl ? " Malinaw na talaan ng may utang sa'yo at dapat mong bayaran, kumpleto sa payment history at resibo." : " Track receivables and payables cleanly with partial payment logging and due dates." }}
                  </div>
                </li>
                <li class="flex items-start gap-3">
                  <span class="text-[var(--accent)] font-bold shrink-0 mt-0.5">✓</span>
                  <div>
                    <strong class="text-[var(--text-primary)]">{{ isTl ? "100% Libre Magpakailanman:" : "100% Free Forever:" }}</strong>
                    {{ isTl ? " Walang ads, walang subscription, at gumagana 100% kahit walang internet connection (Offline PWA)." : " Zero ads, zero paywalls, and operates seamlessly even in offline mode." }}
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <!-- Interactive Feature Showcase Tabs (With AOS) -->
      <section id="tour" class="border-b border-[var(--border-subtle)] py-16 sm:py-20">
        <div class="mx-auto max-w-6xl px-4 sm:px-6 space-y-8">
          <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between" data-aos="fade-up">
            <div class="max-w-xl">
              <span class="inline-flex items-center gap-1.5 rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-bold text-[var(--accent)]">
                <Sparkles :size="13" aria-hidden="true" />
                <span>{{ isTl ? "Live Features Tour" : "Inside the Workspace" }}</span>
              </span>
              <h2 class="mt-2 text-2xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-3xl">
                {{ isTl ? "Mabilis, maganda, at binuo para sa totoong buhay" : "Designed for real-world financial clarity" }}
              </h2>
            </div>

            <!-- Tab Switcher -->
            <div
              role="tablist"
              aria-label="Tipid workspace tour"
              class="flex items-center gap-1 overflow-x-auto rounded-full border border-[var(--border-subtle)] bg-[var(--bg-inset)] p-1.5"
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
                  'tipid-compact shrink-0 rounded-full px-4 py-2 text-xs font-bold whitespace-nowrap transition-all',
                  activeTourTab === tab.id
                    ? 'bg-[var(--accent)] text-white shadow-xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                ]"
                @click="selectTourTab(tab.id, idx)"
                @keydown="handleTabKeydown($event, idx)"
              >
                {{ tab.label }}
              </button>
            </div>
          </div>

          <!-- Tab 1: 3D Wallet Deck -->
          <div
            v-if="activeTourTab === 'overview'"
            role="tabpanel"
            aria-labelledby="tour-tab-overview"
            class="tipid-card grid grid-cols-1 gap-6 rounded-3xl p-6 lg:grid-cols-12 lg:p-8"
            data-aos="zoom-in"
            data-aos-duration="600"
          >
            <div class="space-y-4 lg:col-span-5">
              <span class="tipid-eyebrow text-[var(--accent)]">dashboard.html · 3D Deck</span>
              <h3 class="text-xl font-bold text-[var(--text-primary)]">
                {{ isTl ? "Makikita ang bawat sentimo sa 3D cards" : "Realistic 3D Philippine Card Deck" }}
              </h3>
              <p class="text-sm leading-relaxed text-[var(--text-secondary)]">
                {{
                  isTl
                    ? "Hawak mo ang 26 suportadong bangko at digital wallets (LandBank, BDO, BPI, GCash, Maya, SeaBank, MariBank) na may 3D flip animation at metallic chips."
                    : "Track 26 Philippine accounts and cards with realistic 3D textures, metallic chips, and centavo precision."
                }}
              </p>
              <ul class="space-y-2 text-xs font-medium text-[var(--text-secondary)]">
                <li class="flex items-center gap-2">
                  <CheckCircle2 :size="15" class="text-[var(--income)]" aria-hidden="true" />
                  <span>{{ isTl ? "Integer centavo math — walang rounding error" : "Integer centavo math with zero rounding drift" }}</span>
                </li>
                <li class="flex items-center gap-2">
                  <CheckCircle2 :size="15" class="text-[var(--income)]" aria-hidden="true" />
                  <span>{{ isTl ? "Horizon filters: This Month, Week, 30 Days, All Time" : "Instant filters for Month, Week, and Horizon" }}</span>
                </li>
              </ul>
            </div>

            <div class="space-y-3 lg:col-span-7">
              <div class="tipid-card-emerald rounded-2xl p-5 text-white">
                <div class="flex items-center justify-between text-xs text-white/75">
                  <span class="tipid-eyebrow">Net Balance Across All Cards</span>
                  <span class="rounded-full bg-[#6EE7B7]/20 px-2.5 py-0.5 font-mono text-[11px] font-bold text-[#6EE7B7]">
                    +₱18,420.50 This Month
                  </span>
                </div>
                <p class="mt-2 font-mono text-3xl font-extrabold tracking-tight">₱64,890.25</p>
              </div>

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

          <!-- Tab 2: Bank SMS Auto-Deduct Demo -->
          <div
            v-if="activeTourTab === 'sms'"
            role="tabpanel"
            aria-labelledby="tour-tab-sms"
            class="tipid-card grid grid-cols-1 gap-6 rounded-3xl p-6 lg:grid-cols-12 lg:p-8"
            data-aos="zoom-in"
            data-aos-duration="600"
          >
            <div class="space-y-4 lg:col-span-5">
              <span class="tipid-eyebrow text-[var(--accent)]">Client-Side SMS Parser</span>
              <h3 class="text-xl font-bold text-[var(--text-primary)]">
                {{ isTl ? "Auto-Deduct mula sa Bank & GCash SMS" : "Instant Auto-Fill via Bank SMS" }}
              </h3>
              <p class="text-sm leading-relaxed text-[var(--text-secondary)]">
                {{
                  isTl
                    ? "I-click ang sample SMS sa ibaba o i-paste ang totoong text confirmation mula sa bangko mo para makita kung paano ito kusa magbabawas sa 3D card mo:"
                    : "Click any sample SMS below to see how our offline parser extracts the exact amount, merchant, and method:"
                }}
              </p>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="(sample, idx) in SMS_SAMPLES"
                  :key="idx"
                  type="button"
                  :class="[
                    'tipid-compact rounded-full px-3 py-1.5 text-xs font-semibold transition-all',
                    smsSampleText === sample
                      ? 'bg-[var(--accent)] text-white shadow-xs'
                      : 'border border-[var(--border-strong)] bg-[var(--bg-inset)] text-[var(--text-primary)] hover:border-[var(--accent)]'
                  ]"
                  @click="smsSampleText = sample"
                >
                  {{ idx === 0 ? "GCash Meralco" : idx === 1 ? "Maya Jollibee" : idx === 2 ? "SeaBank Sahod" : "MariBank Uniqlo" }}
                </button>
              </div>
            </div>

            <div class="space-y-3 lg:col-span-7">
              <div>
                <label for="landing-sms-input" class="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)]">
                  <Smartphone :size="14" class="text-[var(--accent)]" aria-hidden="true" />
                  <span>{{ isTl ? "Subukan o i-edit ang SMS notification:" : "Try or edit SMS text:" }}</span>
                </label>
                <textarea
                  id="landing-sms-input"
                  v-model="smsSampleText"
                  rows="3"
                  class="tipid-input rounded-2xl border-[var(--border-subtle)] bg-[var(--bg-inset)]/60 font-mono text-base sm:text-xs focus:bg-[var(--bg-surface)]"
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
                  <span class="block text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Card / Wallet</span>
                  <span class="mt-0.5 block text-xs font-bold text-[var(--accent)]">{{ parsedSmsDemo.method }}</span>
                </div>
                <div>
                  <span class="block text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Category</span>
                  <span class="mt-0.5 block truncate text-xs font-bold text-[var(--text-primary)]">{{ parsedSmsDemo.category }}</span>
                </div>
                <div class="col-span-2 border-t border-[var(--border-subtle)] pt-2 sm:col-span-4">
                  <span class="text-[11px] text-[var(--text-muted)]">Merchant / Payee: </span>
                  <strong class="text-xs text-[var(--text-primary)]">{{ parsedSmsDemo.desc }}</strong>
                </div>
              </div>
            </div>
          </div>

          <!-- Tab 3: Tipid Coach AI Showcase -->
          <div
            v-if="activeTourTab === 'coach'"
            role="tabpanel"
            aria-labelledby="tour-tab-coach"
            class="tipid-card grid grid-cols-1 gap-6 rounded-3xl p-6 lg:grid-cols-12 lg:p-8"
            data-aos="zoom-in"
            data-aos-duration="600"
          >
            <div class="space-y-4 lg:col-span-5">
              <span class="tipid-eyebrow text-[var(--accent)]">Tipid Coach AI</span>
              <h3 class="text-xl font-bold text-[var(--text-primary)]">
                {{ isTl ? "Ang tropa mong taga-saway sa impulse spending" : "Your Friendly Filipino Financial Coach" }}
              </h3>
              <p class="text-sm leading-relaxed text-[var(--text-secondary)]">
                {{
                  isTl
                    ? "Kausapin si Tipid Coach sa Tagalog o English na may natural na boses. Magtanong kung kaya ba ng budget mo ang sapatos, magpa-split ng sahod, o humingi ng tips para lumaki ang ipon."
                    : "Chat naturally in Tagalog or English with realistic male voice. Ask if you can afford an impulse buy or split your paycheck into balanced jars."
                }}
              </p>
              <div class="flex items-center gap-3 pt-2">
                <TipidCoachAvatar mood="speaking" size="sm" />
                <div>
                  <p class="text-xs font-bold text-[var(--text-primary)]">Tipid Coach</p>
                  <p class="text-[11px] text-[var(--text-muted)]">Smart AI Advisor with Voice</p>
                </div>
              </div>
            </div>

            <div class="space-y-3 lg:col-span-7">
              <!-- Chat Bubble 1: User -->
              <div class="flex justify-end">
                <div class="max-w-[85%] rounded-2xl rounded-tr-xs bg-[var(--accent)] px-4 py-2.5 text-xs font-medium text-white shadow-xs">
                  "Coach, kaya ba bumili ng sapatos na ₱3,500 ngayon?"
                </div>
              </div>

              <!-- Chat Bubble 2: Coach -->
              <div class="flex items-start gap-2.5">
                <TipidCoachAvatar mood="caution" size="xs" />
                <div class="max-w-[88%] rounded-2xl rounded-tl-xs border border-[var(--border-subtle)] bg-[var(--bg-inset)] p-3.5 text-xs text-[var(--text-primary)] shadow-xs space-y-2">
                  <p>
                    {{
                      isTl
                        ? "Mas safe kung ipagpaliban muna! ⚠️ May ₱2,150 kang Meralco bill sa darating na Biyernes, at ₱1,400 na lang ang buffer mo sa MariBank bago mag-sahod sa ika-15."
                        : "Caution recommended! ⚠️ You have a ₱2,150 Meralco bill due this Friday, leaving only ₱1,400 buffer in your MariBank before the 15th payday."
                    }}
                  </p>
                  <div class="flex items-center gap-2 text-[11px] font-semibold text-[var(--accent)]">
                    <CheckCircle2 :size="13" />
                    <span>{{ isTl ? "Payo: Maghintay muna sa susunod na sahod!" : "Recommendation: Defer until next payday!" }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Tab 4: Bills & Utang Tracking -->
          <div
            v-if="activeTourTab === 'commitments'"
            role="tabpanel"
            aria-labelledby="tour-tab-commitments"
            class="tipid-card grid grid-cols-1 gap-6 rounded-3xl p-6 lg:grid-cols-12 lg:p-8"
            data-aos="zoom-in"
            data-aos-duration="600"
          >
            <div class="space-y-4 lg:col-span-5">
              <span class="tipid-eyebrow text-[var(--accent)]">bills.html · utang.html</span>
              <h3 class="text-xl font-bold text-[var(--text-primary)]">
                {{ isTl ? "Walang makakalimutang due date at paniningil" : "Never Miss a Bill or Utang Due Date" }}
              </h3>
              <p class="text-sm leading-relaxed text-[var(--text-secondary)]">
                {{
                  isTl
                    ? "Due-date calendar para sa kuryente, tubig, at internet, kasama ang malinaw na talaan ng pautang at babayaran para iwas sa penalty at alitan."
                    : "Visual due-date schedule for utilities alongside clear receivables and payables so you always stay ahead."
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
                  <span>Meralco · <span class="text-[var(--warning)] font-bold">3 DAYS LEFT</span></span>
                  <strong class="font-mono">₱3,420.00</strong>
                </div>
                <div class="flex items-center justify-between rounded-xl bg-[var(--bg-surface)] px-3 py-2.5 text-xs">
                  <span>PLDT Fiber · <span class="text-[var(--income)] font-bold">Paid</span></span>
                  <strong class="font-mono text-[var(--text-muted)] line-through">₱1,699.00</strong>
                </div>
              </div>

              <div class="tipid-inset space-y-2.5 rounded-2xl p-4">
                <div class="flex items-center justify-between text-xs font-bold text-[var(--text-primary)]">
                  <span class="inline-flex items-center gap-1.5"><Users :size="14" class="text-[var(--accent)]" aria-hidden="true" /> Utang Radar</span>
                  <span class="font-mono text-[var(--income)] font-bold">+₱2,500.00 Net</span>
                </div>
                <div class="flex items-center justify-between rounded-xl bg-[var(--bg-surface)] px-3 py-2.5 text-xs">
                  <span class="inline-flex items-center gap-1 text-[var(--income)]"><ArrowDownLeft :size="12" aria-hidden="true" /> May utang sayo</span>
                  <strong class="font-mono">₱4,000.00</strong>
                </div>
                <div class="flex items-center justify-between rounded-xl bg-[var(--bg-surface)] px-3 py-2.5 text-xs">
                  <span class="inline-flex items-center gap-1 text-[var(--expense)]"><ArrowUpRight :size="12" aria-hidden="true" /> Utang mo</span>
                  <strong class="font-mono">₱1,500.00</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 4 Core Pillars Grid (With AOS) -->
      <section class="py-16 sm:py-20 border-b border-[var(--border-subtle)]">
        <div class="mx-auto max-w-6xl px-4 sm:px-6 space-y-12">
          <div class="max-w-2xl space-y-2" data-aos="fade-up">
            <span class="inline-flex items-center gap-1.5 rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-bold text-[var(--accent)]">
              <Zap :size="13" aria-hidden="true" />
              <span>{{ isTl ? "Makabagong Teknolohiya" : "Core Capabilities" }}</span>
            </span>
            <h2 class="text-2xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-3xl">
              {{ isTl ? "Mga Pangunahing Gamit sa Loob ng Workspace" : "Focused Financial Tools" }}
            </h2>
          </div>

          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <article
              v-for="(mod, idx) in modules"
              :key="mod.title"
              class="tipid-card-interactive flex flex-col justify-between rounded-3xl p-5 border border-[var(--border-subtle)] bg-[var(--bg-surface)]"
              data-aos="fade-up"
              :data-aos-delay="String((idx + 1) * 100)"
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

          <!-- Philippine Wallets Catalog Showcase -->
          <div class="tipid-card rounded-3xl p-6 sm:p-8 space-y-6 border border-[var(--border-subtle)]" data-aos="zoom-in">
            <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p class="tipid-eyebrow text-[var(--accent)]">
                  {{ isTl ? "Handa Nang Gamitin" : "Ready Out of the Box" }}
                </p>
                <h3 class="mt-1 text-lg font-bold text-[var(--text-primary)]">
                  {{ isTl ? "26 Suportadong Philippine Accounts & 10 Kategorya ng Gastos" : "26 Philippine Accounts & 10 Categories" }}
                </h3>
              </div>
              <span class="text-xs text-[var(--text-muted)]">
                {{ isTl ? "May realistic 3D flip card ang bawat bangko" : "Every bank features realistic 3D card flip" }}
              </span>
            </div>

            <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div v-for="group in walletGroups" :key="group.title" class="tipid-inset rounded-2xl p-4">
                <h4 class="text-xs font-bold text-[var(--text-primary)]">{{ group.title }}</h4>
                <div class="tipid-pill-row mt-2.5">
                  <span
                    v-for="w in group.items"
                    :key="w.id"
                    class="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 py-1 text-[11px] font-semibold text-[var(--text-secondary)]"
                  >
                    {{ w.name }}
                  </span>
                </div>
              </div>
            </div>

            <div class="border-t border-[var(--border-subtle)] pt-4">
              <p class="mb-2.5 text-xs font-bold text-[var(--text-secondary)]">
                {{ isTl ? "10 Kategorya ng Gastos na may Sariling Icon & Color" : "10 Structured Expense Categories" }}
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

      <!-- Dedicated Enhanced Offline Mode Architecture Band -->
      <section id="offline" class="border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] py-16 sm:py-20">
        <div class="mx-auto max-w-6xl space-y-8 px-4 sm:px-6">
          <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between" data-aos="fade-up">
            <div class="max-w-2xl space-y-2">
              <span class="inline-flex items-center gap-1.5 rounded-full bg-[var(--income-soft)] px-3 py-1 text-xs font-bold text-[var(--income)]">
                <Database :size="13" aria-hidden="true" />
                <span>{{ isTl ? "Offline-First Reliability" : "Offline-First Architecture" }}</span>
              </span>
              <h2 class="text-2xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-3xl">
                {{ isTl ? "Mabilis at gumagana kahit walang internet" : "Blazing fast, even completely offline" }}
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
                <span>{{ swReady ? "SW Cache Active" : "PWA Ready" }}</span>
              </span>
              <span class="text-[var(--border-strong)]" aria-hidden="true">·</span>
              <span class="inline-flex items-center gap-1.5 text-[var(--text-secondary)]">
                <Database :size="13" :class="idbSupported ? 'text-[var(--income)]' : 'text-[var(--text-muted)]'" aria-hidden="true" />
                <span>{{ idbSupported ? "IndexedDB Ready" : "Storage Restricted" }}</span>
              </span>
              <button
                v-if="deferredInstallPrompt && !pwaInstalled"
                type="button"
                class="ml-2 tipid-compact inline-flex items-center gap-1 rounded-xl bg-[var(--accent)] px-2.5 py-1 text-xs font-bold text-white hover:bg-[var(--accent-hover)]"
                @click="triggerPwaInstall"
              >
                <Download :size="12" aria-hidden="true" />
                <span>{{ isTl ? "I-install PWA" : "Install App" }}</span>
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
            <article
              v-for="(item, idx) in offlinePillars"
              :key="item.step"
              class="tipid-card-interactive flex flex-col justify-between rounded-3xl p-6 border border-[var(--border-subtle)] bg-[var(--bg-canvas)]"
              data-aos="fade-up"
              :data-aos-delay="String((idx + 1) * 100)"
            >
              <div>
                <div class="flex items-center justify-between">
                  <div class="tipid-icon-badge h-10 w-10 rounded-2xl bg-[var(--income-soft)] text-[var(--income)]">
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

      <!-- Security Guarantees (With AOS) -->
      <section id="security" class="border-b border-[var(--border-subtle)] bg-[var(--bg-canvas)] py-16 sm:py-20">
        <div class="mx-auto max-w-6xl px-4 sm:px-6 space-y-10">
          <div class="max-w-2xl space-y-2" data-aos="fade-up">
            <span class="inline-flex items-center gap-1.5 rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-bold text-[var(--accent)]">
              <ShieldCheck :size="13" aria-hidden="true" />
              <span>{{ isTl ? "Proteksyon at Seguridad" : "Security & Privacy" }}</span>
            </span>
            <h2 class="text-2xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-3xl">
              {{ isTl ? "Walang bank credentials. Naka-encrypt. Hawak mo ang pera mo." : "Zero bank passwords. Encrypted. You own your data." }}
            </h2>
          </div>

          <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
            <article
              v-for="(pillar, idx) in securityPillars"
              :key="pillar.title"
              class="tipid-inset rounded-3xl p-6 border border-[var(--border-subtle)] bg-[var(--bg-surface)]"
              data-aos="fade-up"
              :data-aos-delay="String((idx + 1) * 100)"
            >
              <div class="tipid-icon-badge h-10 w-10 rounded-2xl bg-[var(--bg-canvas)] text-[var(--accent)] shadow-xs">
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

      <!-- FAQ Section (With AOS) -->
      <section id="faq" class="border-b border-[var(--border-subtle)] py-16 sm:py-20">
        <div class="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 sm:px-6 lg:grid-cols-12">
          <div class="lg:col-span-5" data-aos="fade-right">
            <div class="tipid-card-emerald rounded-3xl p-6 sm:p-7 text-white space-y-4">
              <div class="flex items-center justify-between gap-2">
                <p class="tipid-eyebrow text-white/75">
                  {{ isTl ? "Handa nang magsimula?" : "Ready when you are" }}
                </p>
                <span class="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold text-white">
                  <Users :size="12" aria-hidden="true" />
                  <span class="font-mono tabular-nums">{{ formattedUserCount }}</span>
                </span>
              </div>
              <h2 class="text-2xl font-extrabold tracking-tight">
                {{ isTl ? "Subukan ang Tipid nang libre ngayon." : "Start tracking with clarity." }}
              </h2>
              <p class="text-xs leading-relaxed text-white/80">
                {{ isTl ? "Walang credit card, walang subscription, at gagana agad sa phone mo sa loob ng 5 segundo." : "No credit cards, no subscriptions, and installs on your phone in 5 seconds." }}
              </p>

              <div class="pt-2 flex flex-wrap gap-2.5">
                <a
                  href="signup.html"
                  class="tipid-cta inline-flex min-h-[44px] items-center gap-1.5 rounded-2xl bg-white px-5 py-2.5 text-xs font-bold text-[#0F1A14] no-underline shadow-md transition-all hover:scale-[1.02]"
                >
                  <span>{{ isTl ? "Gumawa ng Libreng Account" : "Create Free Account" }}</span>
                  <ArrowRight :size="14" aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>

          <div class="lg:col-span-7 space-y-4" data-aos="fade-left">
            <h2 id="faq-heading" class="text-xl font-bold tracking-tight text-[var(--text-primary)]">
              {{ isTl ? "Mga Karaniwang Tanong (FAQ)" : "Frequently Asked Questions" }}
            </h2>
            <div class="space-y-2.5" aria-labelledby="faq-heading">
              <details
                v-for="(item, idx) in faqs"
                :key="item.q"
                :open="idx === 0"
                class="tipid-faq-item tipid-card overflow-hidden rounded-2xl border border-[var(--border-subtle)]"
              >
                <summary class="tipid-faq-summary px-5 py-4 text-sm font-bold text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-inset)]/45">
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

      <!-- Final High-Impact Conversion Band (Bottom Call to Action) -->
      <section class="py-16 sm:py-20 text-center relative overflow-hidden bg-gradient-to-b from-[var(--bg-canvas)] to-[var(--bg-surface)]">
        <div class="mx-auto max-w-4xl px-4 sm:px-6 space-y-6" data-aos="zoom-in" data-aos-duration="700">
          <div class="inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/30 bg-[var(--accent-soft)] px-4 py-1.5 text-xs font-bold text-[var(--accent)]">
            <Flame :size="14" aria-hidden="true" />
            <span>{{ isTl ? "Huwag nang patagalin ang financial stress" : "Take control of your money right now" }}</span>
          </div>

          <h2 class="text-3xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-4xl lg:text-5xl">
            {{ isTl ? "Klarong pera. Payapang isip." : "Clear finances. Total peace of mind." }}
          </h2>

          <p class="max-w-xl mx-auto text-sm text-[var(--text-secondary)] sm:text-base leading-relaxed">
            {{
              isTl
                ? "Subukan ang Pinoy 3D cards at magic SMS auto-deduct ngayon. Walang bayad at walang mawawala sa'yo."
                : "Experience interactive 3D Philippine ATM cards and magic SMS auto-deduct. 100% free with nothing to lose."
            }}
          </p>

          <div class="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="signup.html"
              class="tipid-cta tipid-glow-button inline-flex min-h-[52px] items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] px-8 py-3.5 text-sm font-bold text-white no-underline shadow-xl shadow-[var(--accent)]/25 hover:bg-[var(--accent-hover)] transition-all hover:scale-[1.03] active:scale-[0.98]"
            >
              <span>{{ isTl ? "Simulan ang Iyong Pagtitipid Ngayon (Libre)" : "Start Your Free Tipid Account" }}</span>
              <ArrowRight :size="16" aria-hidden="true" />
            </a>

            <a
              href="login.html"
              class="inline-flex min-h-[52px] items-center justify-center rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-surface)] px-6 py-3.5 text-sm font-semibold text-[var(--text-primary)] no-underline transition-colors hover:bg-[var(--bg-inset)]"
            >
              {{ isTl ? "May account na? Mag-log in" : "Already have an account? Sign in" }}
            </a>
          </div>

          <p class="text-[11px] font-medium text-[var(--text-muted)]">
            {{ isTl ? "🔒 Walang bank password na kailangan · 📶 Gumagana kahit offline · ⚡ PWA install sa loob ng 5 segundo" : "🔒 No bank passwords needed · 📶 100% offline-ready · ⚡ PWA install in 5 seconds" }}
          </p>
        </div>
      </section>
    </main>

    <!-- Footer -->
    <footer class="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] py-8">
      <div class="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-xs text-[var(--text-muted)] sm:flex-row sm:px-6">
        <div class="flex items-center gap-2 font-bold text-[var(--text-secondary)]">
          <img src="/assets/logo.svg" alt="" width="22" height="22" class="h-5.5 w-5.5 rounded-lg" />
          <span>Tipid Expense Tracker</span>
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <span class="inline-flex items-center gap-1.5 font-semibold">
            <Users :size="13" class="text-[var(--accent)]" aria-hidden="true" />
            <span class="font-mono tabular-nums text-[var(--text-primary)]">{{ formattedUserCount }}</span>
            <span>{{ isTl ? "registered users" : "registered users" }}</span>
          </span>
          <span class="text-[var(--border-strong)]" aria-hidden="true">·</span>
          <span class="text-xs text-[var(--text-muted)]">{{ userCountBadgeLabel }}</span>
          <span class="text-[var(--border-strong)]" aria-hidden="true">·</span>
          <span>100% Free & Open Privacy</span>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* ============================================================
   AOS (Animate On Scroll) Engine
   Hardware-accelerated transforms & opacity with reduced-motion safety
   ============================================================ */
[data-aos] {
  opacity: 0;
  transition-property: opacity, transform;
  transition-duration: 650ms;
  transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
  will-change: opacity, transform;
}

[data-aos].aos-animate {
  opacity: 1;
  transform: translate3d(0, 0, 0) scale(1) !important;
}

[data-aos="fade-up"] {
  transform: translate3d(0, 32px, 0);
}
[data-aos="fade-down"] {
  transform: translate3d(0, -32px, 0);
}
[data-aos="fade-right"] {
  transform: translate3d(-32px, 0, 0);
}
[data-aos="fade-left"] {
  transform: translate3d(32px, 0, 0);
}
[data-aos="zoom-in"] {
  transform: scale(0.92);
}
[data-aos="zoom-out"] {
  transform: scale(1.06);
}

[data-aos-delay="50"] { transition-delay: 50ms; }
[data-aos-delay="100"] { transition-delay: 100ms; }
[data-aos-delay="150"] { transition-delay: 150ms; }
[data-aos-delay="200"] { transition-delay: 200ms; }
[data-aos-delay="250"] { transition-delay: 250ms; }
[data-aos-delay="300"] { transition-delay: 300ms; }
[data-aos-delay="400"] { transition-delay: 400ms; }
[data-aos-delay="500"] { transition-delay: 500ms; }

[data-aos-duration="400"] { transition-duration: 400ms; }
[data-aos-duration="600"] { transition-duration: 600ms; }
[data-aos-duration="750"] { transition-duration: 750ms; }
[data-aos-duration="900"] { transition-duration: 900ms; }

@media (prefers-reduced-motion: reduce) {
  [data-aos] {
    opacity: 1 !important;
    transform: none !important;
    transition: none !important;
  }
}

/* Balanced wrapping for pill rows per css-layout guidance */
.tipid-pill-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
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

/* Transitions for interactive elements */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
