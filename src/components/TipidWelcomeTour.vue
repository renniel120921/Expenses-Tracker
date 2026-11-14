<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CreditCard,
  PiggyBank,
  ReceiptText,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Volume2,
  VolumeX,
  WifiOff,
  X,
  Zap
} from "@lucide/vue";
import TipidCoachAvatar, { type CoachAvatarMood } from "@/components/TipidCoachAvatar.vue";
import { useI18n } from "@/lib/i18n";
import { useWelcomeTour } from "@/composables/useWelcomeTour";
import { useCoachVoice } from "@/composables/useCoachVoice";

const { isTourOpen, closeTour } = useWelcomeTour();
const { isTl } = useI18n();
const {
  isSupported: isVoiceSupported,
  isSpeaking,
  isMouthMoving,
  isVoiceMuted,
  currentSpokenText,
  speak,
  stop: stopVoice,
  toggleMute
} = useCoachVoice();

const dialogEl = ref<HTMLDialogElement | null>(null);
const currentSlide = ref(0);
const slideDirection = ref<"next" | "prev">("next");

interface TourSlide {
  id: string;
  badge: { en: string; tl: string };
  title: { en: string; tl: string };
  subtitle: { en: string; tl: string };
  voiceNarration: string;
  mood: CoachAvatarMood;
  accessory: "stars" | "card" | "bill" | "piggy" | "ai";
  benefits: Array<{
    icon: typeof ShieldCheck;
    title: { en: string; tl: string };
    desc: { en: string; tl: string };
  }>;
}

const slides: TourSlide[] = [
  {
    id: "welcome",
    badge: { en: "Welcome to Tipid", tl: "Maligayang Pagdating sa Tipid" },
    title: {
      en: "Your Calm, Private Financial Companion",
      tl: "Ang Iyong Maaasahang Financial Companion"
    },
    subtitle: {
      en: "Master your money with authentic Philippine bank cards, automated bills, and atomic financial integrity inspired by Apple Human Interface guidelines.",
      tl: "Subaybayan ang iyong pera nang may katahimikan ng isip gamit ang totoong Philippine cards, automated bills, at de-kalidad na Apple-inspired design."
    },
    voiceNarration:
      "Welcome to Tipid. Your calm, private financial companion. Master your daily finances with complete privacy, zero bank credentials, and true offline capability.",
    mood: "happy",
    accessory: "stars",
    benefits: [
      {
        icon: ShieldCheck,
        title: { en: "Zero Bank Passwords", tl: "Walang Bank Credentials" },
        desc: {
          en: "We never ask for your bank login or ATM PIN. Your financial data stays 100% private and user-owned.",
          tl: "Hindi namin hihingin ang iyong bank password o PIN. Pribado at ligtas ang iyong records."
        }
      },
      {
        icon: WifiOff,
        title: { en: "100% Offline Ready", tl: "Gumagana Kahit Offline" },
        desc: {
          en: "Record expenses, income, or transfers anywhere—even without internet or signal. Syncs automatically upon reconnection.",
          tl: "Mag-log ng gastos kahit walang data o WiFi. Awtomatikong magsi-sync pagbalik ng internet."
        }
      }
    ]
  },
  {
    id: "wallets",
    badge: { en: "Tactile 3D ATM Cards", tl: "3D ATM Cards & Wallets" },
    title: {
      en: "Real Philippine Banks & Digital Wallets",
      tl: "Hawakan ang Iyong Mga Bangko at E-Wallets"
    },
    subtitle: {
      en: "From LandBank, BDO, BPI to GoTyme, Maya, and GCash each card has realistic textures, metallic chips, and an authentic 3D flip animation.",
      tl: "Mula LandBank, BDO, BPI hanggang GoTyme, Maya, at GCash—may totoong card textures, metallic chips, at 3D flip animation."
    },
    voiceNarration:
      "Experience realistic Philippine bank cards and digital wallets. Tap any card in your deck to flip it in 3D, inspect your card details, and track your balances to the exact centavo.",
    mood: "happy",
    accessory: "card",
    benefits: [
      {
        icon: CreditCard,
        title: { en: "Interactive 3D Card Flip", tl: "I-flip ang ATM Card" },
        desc: {
          en: "Click or tap any bank card in the Wallet Deck to flip it and view its CVV, expiry date, and last 4 digits.",
          tl: "Pindutin ang card para mag-rotate sa 3D at makita ang card number, expiration, at CVC."
        }
      },
      {
        icon: Zap,
        title: { en: "Centavo-Exact Balances", tl: "Eksaktong Bawat Sentimo" },
        desc: {
          en: "Integer centavo math guarantees your cash on hand and bank balances stay perfectly synchronized across all screens.",
          tl: "Eksakto hanggang sa pinakamaliit na sentimo para laging tugma ang balanse ng iyong mga card."
        }
      }
    ]
  },
  {
    id: "bills",
    badge: { en: "Smart Bills & Commitments", tl: "Awtomatikong Bayarin ng Bills" },
    title: {
      en: "Schedule Bills with Live Card Deduction",
      tl: "Magtakda ng Bills na May Auto-Deduct sa Card"
    },
    subtitle: {
      en: "Never miss a due date. Pay your utilities, subscriptions, or rent directly from your chosen ATM card with a signature live deduction animation.",
      tl: "I-log ang Meralco, internet, o upa. Piliin kung anong ATM card ang pambayad at panoorin ang live balance deduction animation."
    },
    voiceNarration:
      "Stay ahead of your commitments. Schedule recurring bills, choose your payment card, and watch your balance deduct in real time with our signature card animation.",
    mood: "idle",
    accessory: "bill",
    benefits: [
      {
        icon: ReceiptText,
        title: { en: "Automated Card Deduction", tl: "Awtomatikong Bawas sa Card" },
        desc: {
          en: "When you mark a bill as paid, select your ATM card—Tipid automatically deducts the balance atomically from that wallet.",
          tl: "Piliin ang pambayad na card at kusa itong ibabawas sa napiling bangko sa isang pindot lang."
        }
      },
      {
        icon: RotateCcw,
        title: { en: "Recurring Cycle Scheduling", tl: "Awtomatikong Susunod na Due" },
        desc: {
          en: "Monthly, weekly, or yearly bills auto-schedule the next billing cycle immediately upon payment.",
          tl: "Awtomatikong itatakda ang susunod na buwan pagkatapos bayaran ang kasalukuyang bill."
        }
      }
    ]
  },
  {
    id: "plan",
    badge: { en: "50/30/20 Plan & Safe-to-Spend", tl: "Safe-to-Spend & Pag-iipon" },
    title: {
      en: "Know Exactly What is Safe to Spend",
      tl: "Alamin Kung Magkano ang Ligtas Gastusin"
    },
    subtitle: {
      en: "Eliminate paycheck anxiety with real-time safe-to-spend tracking, Kinsenas/Monthly budget cycles, and virtual savings jars.",
      tl: "Iwasan ang petsa de peligro. May live Safe-to-Spend tracker at virtual savings jars para sa iyong mga pangarap."
    },
    voiceNarration:
      "Know exactly what is safe to spend. Manage your money across Kinsenas or monthly cycles, allocate savings into virtual jars, and balance your needs and wants effortlessly.",
    mood: "happy",
    accessory: "piggy",
    benefits: [
      {
        icon: PiggyBank,
        title: { en: "Virtual Savings Goals", tl: "May Kulay na Savings Jars" },
        desc: {
          en: "Deposit money into dedicated jars for emergencies, travel, or gadgets without mixing up your daily funds.",
          tl: "Mag-ipon para sa emergency fund o travel nang hiwalay sa iyong pang-araw-araw na pondo."
        }
      },
      {
        icon: CheckCircle2,
        title: { en: "50% Needs, 30% Wants, 20% Savings", tl: "50/30/20 Budgeting Rule" },
        desc: {
          en: "Tag expenses as Need or Want to keep your lifestyle in healthy balance automatically.",
          tl: "I-tag ang gastos bilang Need o Want para mapanatili ang tamang balanse ng iyong pera."
        }
      }
    ]
  },
  {
    id: "coach",
    badge: { en: "Tipid Coach AI", tl: "Iyong Personal AI Coach" },
    title: {
      en: "Meet Tipid Coach: Your Smart Ledger AI",
      tl: "Kilalanin si Tipid Coach: Ang Iyong AI Assistant"
    },
    subtitle: {
      en: "Tap the mascot avatar anytime to chat. Instruct it with natural commands like 'Log 150 coffee via GCash' or ask 'Safe to spend?' for instant financial advice.",
      tl: "Pindutin ang mascot avatar para mag-chat. Sabihin lang ang 'Log 150 kape via GCash' o itanong kung ligtas bang gumastos ngayon."
    },
    voiceNarration:
      "Meet your personal financial coach. Log expenses with natural commands, paste receipts, or ask for instant advice—with an editable confirmation card before every change.",
    mood: "thinking",
    accessory: "ai",
    benefits: [
      {
        icon: Sparkles,
        title: { en: "Natural Language Logging", tl: "Natural na Utos at Pag-log" },
        desc: {
          en: "No tedious form filling—just tell your coach what you earned or spent, and review the prepared draft with a tap.",
          tl: "Kausapin si Tipid Coach tulad ng tao para mag-handa ng draft entries sa iyong ledger nang mabilisan."
        }
      },
      {
        icon: Zap,
        title: { en: "On-Device Fallback Engine", tl: "Matalino Kahit Offline" },
        desc: {
          en: "Even if your network is down or API limits hit, Tipid Coach uses an on-device rule engine to parse and advise instantly.",
          tl: "Kahit offline o mahina ang signal, may on-device intelligence pa rin si Tipid Coach para tumulong sa iyo."
        }
      }
    ]
  }
];

const activeSlide = computed(() => slides[currentSlide.value]);
const totalSlides = slides.length;
const isLastSlide = computed(() => currentSlide.value === totalSlides - 1);

function speakCurrentSlide(force = false) {
  if (!isVoiceSupported) return;
  const slide = activeSlide.value;
  if (!slide?.voiceNarration) return;
  speak(slide.voiceNarration, { force });
}

function handleToggleVoice() {
  toggleMute();
  if (!isVoiceMuted.value) {
    speakCurrentSlide(true);
  }
}

function nextSlide() {
  if (isLastSlide.value) {
    handleDismiss();
    return;
  }
  slideDirection.value = "next";
  currentSlide.value += 1;
  speakCurrentSlide();
}

function prevSlide() {
  if (currentSlide.value > 0) {
    slideDirection.value = "prev";
    currentSlide.value -= 1;
    speakCurrentSlide();
  }
}

function goToSlide(idx: number) {
  slideDirection.value = idx > currentSlide.value ? "next" : "prev";
  currentSlide.value = idx;
  speakCurrentSlide();
}

function handleDismiss() {
  stopVoice();
  closeTour();
  const el = dialogEl.value;
  if (el?.open && typeof el.close === "function") {
    el.close();
  }
}

async function syncDialog(open: boolean) {
  if (open) {
    currentSlide.value = 0;
    if (!dialogEl.value) {
      await nextTick();
    }
    const el = dialogEl.value;
    if (el && !el.open) {
      if (typeof el.showModal === "function") {
        try {
          el.showModal();
        } catch {
          el.setAttribute("open", "");
        }
      } else {
        el.setAttribute("open", "");
      }
    }
    speakCurrentSlide();
  } else {
    stopVoice();
    const el = dialogEl.value;
    if (el && (el.open || el.hasAttribute("open"))) {
      if (typeof el.close === "function") {
        try {
          el.close();
        } catch {
          el.removeAttribute("open");
        }
      } else {
        el.removeAttribute("open");
      }
    }
  }
}

watch(
  () => isTourOpen.value,
  (open) => {
    void syncDialog(open);
  },
  { immediate: true }
);

onMounted(() => {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    try {
      window.speechSynthesis.getVoices();
    } catch {
      // Graceful fallback
    }
  }
});
</script>

<template>
  <dialog
    ref="dialogEl"
    class="tipid-dialog tipid-welcome-dialog"
    aria-labelledby="tipid-tour-title"
    :closedby="isTourOpen ? 'any' : 'none'"
    @close="handleDismiss"
  >
    <div
      class="tipid-tour-container"
      role="region"
      aria-roledescription="carousel"
      :aria-label="isTl ? 'Tipid Welcome Walkthrough' : 'Tipid Welcome Walkthrough'"
    >
      <!-- Top Action Bar -->
      <div class="flex items-center justify-between gap-2 border-b border-[var(--border-subtle)] px-3.5 py-2.5 sm:px-5 sm:py-3.5">
        <div class="flex min-w-0 items-center gap-2 shrink-0">
          <span class="tipid-icon-badge h-7 w-7 shrink-0 rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
            <Sparkles :size="14" aria-hidden="true" />
          </span>
          <span class="truncate text-xs font-bold tracking-tight text-[var(--text-primary)]">
            Tipid Guide
          </span>
        </div>

        <div class="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <!-- Voice Audio Narration Control Pill (Compact, zero-wrap) -->
          <button
            v-if="isVoiceSupported"
            type="button"
            :class="[
              'tipid-compact whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition-all',
              isVoiceMuted
                ? 'border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-inset)]'
                : isSpeaking
                  ? 'bg-[var(--accent-soft)] text-[var(--accent)] ring-1 ring-[var(--accent)]/40 shadow-xs'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-inset)] hover:text-[var(--text-primary)] border border-transparent'
            ]"
            :title="isVoiceMuted ? 'Unmute English voice audio' : 'Mute English voice audio'"
            @click="handleToggleVoice"
          >
            <VolumeX v-if="isVoiceMuted" :size="13" aria-hidden="true" />
            <Volume2 v-else :size="13" :class="isSpeaking ? 'animate-pulse text-[var(--accent)]' : ''" aria-hidden="true" />
            <span class="text-[11px] font-semibold">{{ isVoiceMuted ? "Muted" : isSpeaking ? "Voice" : "Voice" }}</span>
          </button>

          <button
            type="button"
            class="tipid-compact whitespace-nowrap shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-inset)] hover:text-[var(--text-primary)]"
            @click="handleDismiss"
          >
            {{ isTl ? "Laktawan" : "Skip" }}
          </button>
          <button
            type="button"
            class="tipid-compact whitespace-nowrap shrink-0 inline-flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-inset)] hover:text-[var(--text-primary)]"
            :aria-label="isTl ? 'Isara' : 'Close'"
            @click="handleDismiss"
          >
            <X :size="16" aria-hidden="true" />
          </button>
        </div>
      </div>

      <!-- Mascot Spotlight Stage -->
      <div class="tipid-tour-stage" :data-mood="activeSlide.mood">
        <div class="tipid-tour-stage-glow" aria-hidden="true" />

        <!-- Floating Mascot Character with Real-Time Articulating Mouth -->
        <div class="tipid-mascot-pod">
          <div class="tipid-mascot-avatar-wrap">
            <TipidCoachAvatar
              :mood="activeSlide.mood"
              :is-speaking="isSpeaking"
              :is-mouth-moving="isMouthMoving"
              size="xl"
            />
          </div>

          <!-- Dynamic Mascot Accessory Prop -->
          <div class="tipid-mascot-prop" aria-hidden="true">
            <!-- Stars for Welcome -->
            <div v-if="activeSlide.accessory === 'stars'" class="tipid-prop-stars">
              <span class="tipid-star star-1">✦</span>
              <span class="tipid-star star-2">★</span>
              <span class="tipid-star star-3">✦</span>
            </div>

            <!-- Mini 3D Debit Card for Wallets -->
            <div v-else-if="activeSlide.accessory === 'card'" class="tipid-prop-card">
              <div class="tipid-prop-card-chip" />
              <span class="tipid-prop-card-net">VISA</span>
              <span class="tipid-prop-card-num">•••• 9071</span>
            </div>

            <!-- Bill Calendar Reminder for Bills -->
            <div v-else-if="activeSlide.accessory === 'bill'" class="tipid-prop-bill">
              <ReceiptText :size="15" />
              <span class="tipid-prop-bill-check">✓</span>
            </div>

            <!-- Piggy Coin for Plan -->
            <div v-else-if="activeSlide.accessory === 'piggy'" class="tipid-prop-piggy">
              <span class="tipid-prop-coin">₱</span>
            </div>

            <!-- AI Sparkle Chip for Coach -->
            <div v-else-if="activeSlide.accessory === 'ai'" class="tipid-prop-ai">
              <Sparkles :size="16" />
            </div>
          </div>
        </div>

        <!-- Slide Position Pill -->
        <div class="flex items-center justify-center">
          <span class="tipid-tour-badge">
            <Sparkles :size="11" aria-hidden="true" />
            <span>{{ isTl ? activeSlide.badge.tl : activeSlide.badge.en }}</span>
          </span>
        </div>

        <!-- Live Speech Dialogue Card (Mouth & Equalizer Timing) -->
        <div
          class="tipid-speech-bubble"
          :class="isSpeaking ? 'is-active-speech' : 'is-idle-speech'"
          role="region"
          aria-label="Coach voice dialogue"
        >
          <div class="tipid-speech-bubble-tail" aria-hidden="true" />

          <div class="flex items-center gap-2.5">
            <!-- Dynamic 5-bar Live Equalizer (Bounces on Spoken Words) -->
            <div
              :class="[
                'tipid-live-equalizer',
                isSpeaking && 'is-active',
                isMouthMoving && 'is-animating'
              ]"
              aria-hidden="true"
            >
              <span class="eq-bar bar-1" />
              <span class="eq-bar bar-2" />
              <span class="eq-bar bar-3" />
              <span class="eq-bar bar-4" />
              <span class="eq-bar bar-5" />
            </div>

            <!-- Subtitle Dialogue Text -->
            <div class="min-w-0 flex-1">
              <p v-if="isSpeaking" class="tipid-speech-text">
                <span class="tipid-speech-quote">“</span>{{ currentSpokenText || activeSlide.voiceNarration }}<span class="tipid-speech-quote">”</span>
              </p>
              <p v-else-if="isVoiceMuted" class="tipid-speech-muted-text">
                {{ isTl ? "Naka-mute ang audio. Pindutin para pakinggan." : "Voice narration is muted. Tap to listen." }}
              </p>
              <p v-else class="tipid-speech-idle-text">
                {{ isTl ? "Pindutin para pakinggan ang boses ni Tipid Coach." : "Tap to listen to Tipid Coach explain this feature." }}
              </p>
            </div>

            <!-- Quick Audio Play / Pause Action Button -->
            <button
              v-if="isVoiceSupported"
              type="button"
              class="tipid-speech-audio-btn tipid-compact shrink-0 inline-flex h-7 w-7 items-center justify-center rounded-full text-white transition-transform active:scale-90"
              :class="isSpeaking ? 'bg-[var(--accent)] hover:bg-[var(--accent-hover)]' : 'bg-[var(--text-secondary)] hover:bg-[var(--accent)]'"
              :title="isSpeaking ? 'Pause voice' : isVoiceMuted ? 'Unmute & listen' : 'Replay voice in English'"
              :aria-label="isSpeaking ? 'Pause voice' : 'Play voice in English'"
              @click="isSpeaking ? stopVoice() : speakCurrentSlide(true)"
            >
              <VolumeX v-if="isSpeaking" :size="13" />
              <Volume2 v-else :size="13" />
            </button>
          </div>
        </div>
      </div>

      <!-- Slide Content Body (Smooth Transition on Slide Change) -->
      <div
        class="tipid-tour-body"
        role="group"
        aria-roledescription="slide"
        :aria-label="`${currentSlide + 1} of ${totalSlides}`"
      >
        <h2 id="tipid-tour-title" class="tipid-tour-title">
          {{ isTl ? activeSlide.title.tl : activeSlide.title.en }}
        </h2>
        <p class="tipid-tour-desc">
          {{ isTl ? activeSlide.subtitle.tl : activeSlide.subtitle.en }}
        </p>

        <!-- Feature Benefits Grid -->
        <div class="tipid-tour-benefits">
          <div
            v-for="(b, idx) in activeSlide.benefits"
            :key="idx"
            class="tipid-tour-benefit-card"
          >
            <span class="tipid-benefit-icon" aria-hidden="true">
              <component :is="b.icon" :size="16" />
            </span>
            <div class="min-w-0">
              <h3 class="tipid-benefit-title">
                {{ isTl ? b.title.tl : b.title.en }}
              </h3>
              <p class="tipid-benefit-desc">
                {{ isTl ? b.desc.tl : b.desc.en }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Polite Screen Reader Status -->
      <p class="visually-hidden" role="status" aria-live="polite">
        Slide {{ currentSlide + 1 }} of {{ totalSlides }}: {{ isTl ? activeSlide.title.tl : activeSlide.title.en }}
      </p>

      <!-- Carousel Footer Controls -->
      <footer class="tipid-tour-footer">
        <!-- Step Indicator Dots -->
        <div class="tipid-tour-dots" role="tablist" :aria-label="isTl ? 'Mga slide ng tour' : 'Tour slides'">
          <button
            v-for="(_, idx) in slides"
            :key="idx"
            type="button"
            role="tab"
            :aria-selected="currentSlide === idx"
            :aria-label="`${isTl ? 'Pumunta sa slide' : 'Go to slide'} ${idx + 1}`"
            :class="['tipid-tour-dot', currentSlide === idx && 'is-active']"
            @click="goToSlide(idx)"
          />
        </div>

        <!-- Navigation Buttons -->
        <div class="flex items-center gap-2 shrink-0">
          <button
            v-if="currentSlide > 0"
            type="button"
            class="tipid-compact whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)] transition-transform hover:bg-[var(--bg-inset)] active:scale-95"
            @click="prevSlide"
          >
            <ArrowLeft :size="14" aria-hidden="true" />
            <span>{{ isTl ? "Bumalik" : "Back" }}</span>
          </button>

          <button
            type="button"
            data-tour-action="next"
            class="tipid-compact whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-[var(--accent)] px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-transform hover:bg-[var(--accent-hover)] active:scale-95"
            @click="nextSlide"
          >
            <span>
              {{
                isLastSlide
                  ? isTl
                    ? "Simulan ang Pagtitipid"
                    : "Get Started"
                  : isTl
                    ? "Susunod"
                    : "Next"
              }}
            </span>
            <ArrowRight v-if="!isLastSlide" :size="14" aria-hidden="true" />
            <Sparkles v-else :size="14" aria-hidden="true" />
          </button>
        </div>
      </footer>
    </div>
  </dialog>
</template>

<style scoped>
dialog.tipid-welcome-dialog {
  max-inline-size: min(34rem, calc(100dvw - 1.5rem));
  border-radius: 1.5rem;
  overscroll-behavior: contain;
}

dialog.tipid-welcome-dialog::backdrop {
  background: rgba(13, 22, 17, 0.45);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  overscroll-behavior: contain;
}

.tipid-tour-container {
  display: flex;
  flex-direction: column;
}

/* Mascot Spotlight Stage */
.tipid-tour-stage {
  position: relative;
  overflow: hidden;
  padding: 1.5rem 1.15rem 1.15rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  background:
    radial-gradient(ellipse 90% 70% at 50% 10%, rgba(20, 99, 72, 0.18), transparent 70%),
    linear-gradient(180deg, rgba(20, 99, 72, 0.08) 0%, rgba(20, 99, 72, 0.02) 100%);
  border-bottom: 1px solid var(--border-subtle);
}

.dark .tipid-tour-stage {
  background:
    radial-gradient(ellipse 90% 70% at 50% 10%, rgba(52, 211, 153, 0.22), transparent 70%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.01) 100%);
}

.tipid-tour-stage-glow {
  pointer-events: none;
  position: absolute;
  inset: -20% 0 auto;
  height: 140px;
  background: radial-gradient(circle, rgba(16, 185, 129, 0.28), transparent 70%);
}

/* Mascot Pod & Accessories */
.tipid-mascot-pod {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.tipid-mascot-avatar-wrap {
  position: relative;
  z-index: 2;
  filter: drop-shadow(0 8px 18px rgba(13, 22, 17, 0.14));
  transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);
}

@media (prefers-reduced-motion: no-preference) {
  .tipid-mascot-pod {
    animation: tipidMascotFloat 3.8s ease-in-out infinite;
  }
}

@keyframes tipidMascotFloat {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
}

/* Floating Accessory Props */
.tipid-mascot-prop {
  position: absolute;
  right: -14px;
  bottom: -4px;
  z-index: 3;
}

.tipid-prop-stars {
  position: relative;
  display: flex;
  gap: 0.25rem;
  color: #F59E0B;
}

.tipid-star {
  display: inline-block;
  font-size: 0.85rem;
  animation: tipidStarPulse 2s ease-in-out infinite;
}

.tipid-star.star-2 {
  font-size: 1.1rem;
  animation-delay: 0.4s;
  color: #10B981;
}

.tipid-star.star-3 {
  font-size: 0.75rem;
  animation-delay: 0.8s;
}

@keyframes tipidStarPulse {
  0%, 100% { transform: scale(1) rotate(0deg); opacity: 0.9; }
  50% { transform: scale(1.25) rotate(12deg); opacity: 1; }
}

.tipid-prop-card {
  width: 48px;
  height: 30px;
  border-radius: 6px;
  background: linear-gradient(135deg, #064E3B 0%, #065F46 50%, #047857 100%);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 10px rgba(6, 78, 59, 0.35);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 3px 4px;
  color: #FFFFFF;
  transform: rotate(-10deg);
}

.tipid-prop-card-chip {
  width: 8px;
  height: 6px;
  background: #FBBF24;
  border-radius: 1.5px;
}

.tipid-prop-card-net {
  font-size: 6px;
  font-weight: 800;
  align-self: flex-end;
  letter-spacing: 0.5px;
}

.tipid-prop-card-num {
  font-size: 5px;
  font-family: monospace;
  opacity: 0.85;
}

.tipid-prop-bill {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: var(--bg-surface);
  border: 1px solid var(--border-strong);
  box-shadow: 0 4px 12px rgba(13, 22, 17, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent);
  position: relative;
  transform: rotate(8deg);
}

.tipid-prop-bill-check {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 14px;
  height: 14px;
  background: #10B981;
  color: white;
  border-radius: 9999px;
  font-size: 9px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tipid-prop-piggy {
  width: 32px;
  height: 32px;
  border-radius: 9999px;
  background: #10B981;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 14px;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
  transform: rotate(-6deg);
}

.tipid-prop-ai {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: linear-gradient(135deg, #10B981, #047857);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 14px rgba(16, 185, 129, 0.45);
  animation: tipidAiSpin 4s linear infinite;
}

@keyframes tipidAiSpin {
  0% { transform: rotate(0deg) scale(1); }
  50% { transform: rotate(180deg) scale(1.08); }
  100% { transform: rotate(360deg) scale(1); }
}

.tipid-tour-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  border-radius: 9999px;
  border: 1px solid var(--border-subtle);
  background: var(--bg-surface);
  padding: 0.28rem 0.75rem;
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--accent);
  box-shadow: 0 2px 6px rgba(13, 22, 17, 0.05);
}

/* Live Speech Dialogue Card */
.tipid-speech-bubble {
  position: relative;
  width: 100%;
  max-width: 28rem;
  border-radius: 1.15rem;
  padding: 0.75rem 1rem;
  margin-top: 0.15rem;
  transition: all 0.25s cubic-bezier(0.22, 1, 0.36, 1);
  border: 1px solid var(--border-subtle);
  background: var(--bg-surface);
  box-shadow: 0 4px 16px -2px rgba(13, 22, 17, 0.08);
}

.tipid-speech-bubble.is-active-speech {
  border-color: color-mix(in srgb, var(--accent) 35%, transparent);
  background: color-mix(in srgb, var(--accent) 5%, var(--bg-surface));
  box-shadow: 0 6px 20px -2px rgba(16, 185, 129, 0.15);
}

.tipid-speech-bubble-tail {
  position: absolute;
  top: -6px;
  left: 50%;
  transform: translateX(-50%) rotate(45deg);
  width: 12px;
  height: 12px;
  background: var(--bg-surface);
  border-left: 1px solid var(--border-subtle);
  border-top: 1px solid var(--border-subtle);
}

.tipid-speech-bubble.is-active-speech .tipid-speech-bubble-tail {
  background: color-mix(in srgb, var(--accent) 5%, var(--bg-surface));
  border-left-color: color-mix(in srgb, var(--accent) 35%, transparent);
  border-top-color: color-mix(in srgb, var(--accent) 35%, transparent);
}

/* Dynamic 5-bar Live Equalizer */
.tipid-live-equalizer {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  height: 20px;
  padding: 0 3px;
  flex-shrink: 0;
}

.tipid-live-equalizer .eq-bar {
  width: 2.5px;
  background: var(--text-muted);
  border-radius: 9999px;
  transition: height 0.16s ease, background-color 0.2s ease;
  transform-origin: center;
}

.tipid-live-equalizer .bar-1 { height: 6px; }
.tipid-live-equalizer .bar-2 { height: 11px; }
.tipid-live-equalizer .bar-3 { height: 16px; }
.tipid-live-equalizer .bar-4 { height: 10px; }
.tipid-live-equalizer .bar-5 { height: 7px; }

.tipid-live-equalizer.is-active .eq-bar {
  background: color-mix(in srgb, var(--accent) 65%, var(--text-muted));
}

.tipid-live-equalizer.is-animating .eq-bar {
  background: var(--accent);
}

@media (prefers-reduced-motion: no-preference) {
  .tipid-live-equalizer.is-animating .bar-1 { animation: tipidEqPulse1 0.44s ease-in-out infinite alternate; }
  .tipid-live-equalizer.is-animating .bar-2 { animation: tipidEqPulse2 0.58s ease-in-out infinite alternate; }
  .tipid-live-equalizer.is-animating .bar-3 { animation: tipidEqPulse3 0.36s ease-in-out infinite alternate; }
  .tipid-live-equalizer.is-animating .bar-4 { animation: tipidEqPulse4 0.50s ease-in-out infinite alternate; }
  .tipid-live-equalizer.is-animating .bar-5 { animation: tipidEqPulse5 0.40s ease-in-out infinite alternate; }
}

@keyframes tipidEqPulse1 { 0% { height: 5px; } 100% { height: 12px; } }
@keyframes tipidEqPulse2 { 0% { height: 8px; } 100% { height: 18px; } }
@keyframes tipidEqPulse3 { 0% { height: 6px; } 100% { height: 20px; } }
@keyframes tipidEqPulse4 { 0% { height: 7px; } 100% { height: 15px; } }
@keyframes tipidEqPulse5 { 0% { height: 4px; } 100% { height: 11px; } }

.tipid-speech-text {
  font-size: 0.78rem;
  line-height: 1.4;
  font-weight: 500;
  color: var(--text-primary);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.tipid-speech-quote {
  color: var(--accent);
  font-weight: 700;
}

.tipid-speech-muted-text,
.tipid-speech-idle-text {
  font-size: 0.72rem;
  line-height: 1.35;
  color: var(--text-muted);
}

/* Slide Body */
.tipid-tour-body {
  padding: 1.25rem 1.25rem 0.5rem;
}

.tipid-tour-title {
  font-size: 1.15rem;
  font-weight: 800;
  letter-spacing: -0.015em;
  color: var(--text-primary);
  line-height: 1.3;
}

.tipid-tour-desc {
  margin-top: 0.35rem;
  font-size: 0.8rem;
  line-height: 1.5;
  color: var(--text-secondary);
}

/* Benefits 2-Column Grid */
.tipid-tour-benefits {
  margin-top: 1rem;
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.65rem;
}

@media (min-width: 480px) {
  .tipid-tour-benefits {
    grid-template-columns: 1fr 1fr;
  }
}

.tipid-tour-benefit-card {
  display: flex;
  align-items: flex-start;
  gap: 0.65rem;
  border-radius: 0.95rem;
  border: 1px solid var(--border-subtle);
  background: var(--bg-surface);
  padding: 0.75rem 0.85rem;
  box-shadow: 0 1px 3px rgba(13, 22, 17, 0.03);
}

.tipid-benefit-icon {
  margin-top: 0.1rem;
  display: flex;
  height: 1.75rem;
  width: 1.75rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 0.65rem;
  background: var(--accent-soft);
  color: var(--accent);
}

.tipid-benefit-title {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.25;
}

.tipid-benefit-desc {
  margin-top: 0.15rem;
  font-size: 0.7rem;
  line-height: 1.4;
  color: var(--text-muted);
}

/* Footer Controls */
.tipid-tour-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.15rem 1.25rem 1.25rem;
  border-top: 1px solid var(--border-subtle);
  margin-top: 0.75rem;
}

/* Step Indicator Dots */
.tipid-tour-dots {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.tipid-tour-dot {
  width: 8px;
  height: 8px;
  border-radius: 9999px;
  background: var(--border-strong);
  border: 0;
  padding: 0;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.22, 1, 0.36, 1);
}

.tipid-tour-dot.is-active {
  width: 22px;
  background: var(--accent);
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.4);
}

@media (prefers-reduced-motion: reduce) {
  .tipid-mascot-pod,
  .tipid-prop-ai,
  .tipid-star,
  .tipid-live-equalizer.is-animating .eq-bar {
    animation: none;
    transform: none;
  }
}
</style>
