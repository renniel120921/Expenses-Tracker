<script setup lang="ts">
import { computed, ref, useId, watch } from "vue";
import { Pencil, AlertCircle, RotateCw, Eye, EyeOff } from "@lucide/vue";
import { formatPeso } from "@/lib/core";
import { resolveWalletVisual } from "@/lib/walletVisuals";
import { getWalletKindIcon } from "@/lib/categoryIcons";
import { useI18n } from "@/lib/i18n";

const props = withDefaults(
  defineProps<{
    method: string;
    balance: number;
    totalPositiveBalance?: number;
    balanceHidden?: boolean;
    showEdit?: boolean;
    isDeckInactive?: boolean;
  }>(),
  {
    totalPositiveBalance: 0,
    balanceHidden: false,
    showEdit: true,
    isDeckInactive: false
  }
);

const emit = defineEmits<{
  (e: "edit", method: string): void;
}>();

const { isTl } = useI18n();
const svgUid = useId();
const goldGradId = `tipid-chip-gold-${svgUid}`;
const silverGradId = `tipid-chip-silver-${svgUid}`;
const motifGradId = `tipid-motif-grad-${svgUid}`;
const foilGradId = `tipid-foil-grad-${svgUid}`;

const isFlipped = ref(false);
const maskCardBack = ref(false);

watch(
  () => props.isDeckInactive,
  (inactive) => {
    if (inactive && isFlipped.value) {
      isFlipped.value = false;
    }
  }
);

const visual = computed(() => resolveWalletVisual(props.method));
const KindIcon = computed(() => getWalletKindIcon(visual.value.kind));

const portfolioSharePct = computed(() => {
  if (props.balance <= 0 || props.totalPositiveBalance <= 0) return null;
  return Math.max(1, Math.min(100, Math.round((props.balance / props.totalPositiveBalance) * 100)));
});

const isNegative = computed(() => props.balance < 0);
const backDigitsHidden = computed(() => props.balanceHidden || maskCardBack.value);

const formattedBackCardNumber = computed(() => {
  const [g1, g2, g3, g4] = visual.value.cardNumberGroups;
  if (backDigitsHidden.value) {
    return `••••  ••••  ••••  ${g4}`;
  }
  return `${g1}  ${g2}  ${g3}  ${g4}`;
});

function toggleFlip() {
  if (props.isDeckInactive) return;
  isFlipped.value = !isFlipped.value;
}

const cardVars = computed(() => ({
  "--bank-start": visual.value.surfaceStart,
  "--bank-mid": visual.value.surfaceMid,
  "--bank-end": visual.value.surfaceEnd,
  "--bank-accent": visual.value.accent,
  "--bank-stripe": visual.value.stripeColor,
  "--bank-ink": visual.value.inkColor
}));
</script>

<template>
  <article
    class="tipid-bank-card tipid-card-scene group relative select-none"
    :class="{ 'is-flipped': isFlipped, 'is-deck-inactive': isDeckInactive }"
    :data-material="visual.material"
    :data-kind="visual.kind"
    :style="cardVars"
    @keydown.esc="isFlipped = false"
  >
    <div class="tipid-card-flipper" :class="{ 'is-flipped': isFlipped }">
      <!-- FRONT FACE: Authentic Tactile ATM / Digital Bank Card -->
      <div
        class="tipid-card-face tipid-card-front flex flex-col justify-between overflow-hidden rounded-[1.15rem] p-5"
        :class="{ 'is-inactive-face': isFlipped }"
        :inert="isFlipped || undefined"
        :aria-hidden="isFlipped ? 'true' : undefined"
      >
        <!-- Full-Card Accessible Flip Trigger (stretched overlay beneath action buttons) -->
        <button
          v-if="!isDeckInactive"
          type="button"
          class="tipid-card-flip-hit"
          :aria-expanded="isFlipped"
          :aria-label="
            isTl
              ? `I-flip ang ${visual.displayName} card para makita ang detalye sa likod`
              : `Flip ${visual.displayName} card to view back details`
          "
          @click="toggleFlip"
        ></button>

        <!-- Layered PVC / Metallic Card Surface Micro-Texture & Specular Foil Sheen -->
        <span class="tipid-card-texture pointer-events-none" aria-hidden="true"></span>
        <span class="tipid-card-sheen pointer-events-none" aria-hidden="true"></span>

        <!-- Per-Bank Architectural Guilloché / Wave / Prism Surface Artwork -->
        <svg
          aria-hidden="true"
          class="tipid-card-artwork pointer-events-none absolute inset-0 h-full w-full"
          viewBox="0 0 360 225"
          preserveAspectRatio="xMidYMid slice"
          fill="none"
        >
          <defs>
            <linearGradient :id="motifGradId" x1="0" y1="0" x2="360" y2="225" gradientUnits="userSpaceOnUse">
              <stop offset="0" :stop-color="visual.stripeColor" stop-opacity="0.34" />
              <stop offset="0.55" :stop-color="visual.accent" stop-opacity="0.16" />
              <stop offset="1" stop-color="#FFFFFF" stop-opacity="0.03" />
            </linearGradient>
            <linearGradient :id="foilGradId" x1="40" y1="0" x2="320" y2="225" gradientUnits="userSpaceOnUse">
              <stop offset="0" stop-color="#FFFFFF" stop-opacity="0.22" />
              <stop offset="0.5" :stop-color="visual.accent" stop-opacity="0.26" />
              <stop offset="1" stop-color="#FFFFFF" stop-opacity="0.04" />
            </linearGradient>
          </defs>

          <!-- Flowing Wave Ribbons (GoTyme, SeaBank, GCash, BPI, ShopeePay, EastWest) -->
          <template v-if="visual.motif === 'wave'">
            <path
              d="M-24 158 C78 96, 174 202, 286 110 C324 79, 352 46, 384 18 L384 240 L-24 240 Z"
              :fill="`url(#${motifGradId})`"
              opacity="0.72"
            />
            <path
              d="M-18 182 C92 128, 198 214, 314 134 C344 114, 366 94, 384 74"
              :stroke="`url(#${foilGradId})`"
              stroke-width="2"
              opacity="0.68"
            />
            <path
              d="M148 -14 C210 52, 278 68, 378 28"
              :stroke="visual.accent"
              stroke-width="1.25"
              stroke-opacity="0.26"
            />
          </template>

          <!-- Architectural Metallic Prism (Maya, Tonik, UNO, BDO, UnionBank, SecurityBank) -->
          <template v-else-if="visual.motif === 'prism'">
            <polygon
              points="196,-12 376,-12 376,238 112,238"
              :fill="`url(#${motifGradId})`"
              opacity="0.58"
            />
            <polygon
              points="258,-12 376,-12 376,170 184,238"
              :fill="`url(#${foilGradId})`"
              opacity="0.34"
            />
            <line
              x1="112"
              y1="238"
              x2="296"
              y2="-12"
              :stroke="visual.accent"
              stroke-width="1.4"
              stroke-opacity="0.34"
            />
            <line
              x1="184"
              y1="238"
              x2="346"
              y2="-12"
              stroke="#FFFFFF"
              stroke-width="0.85"
              stroke-opacity="0.16"
            />
          </template>

          <!-- Fine Security Guilloché Rings (LandBank, Metrobank, OFBank, ChinaBank, Cash) -->
          <template v-else-if="visual.motif === 'rings'">
            <circle cx="294" cy="148" r="108" :fill="`url(#${motifGradId})`" opacity="0.4" />
            <circle cx="294" cy="148" r="96" :stroke="visual.accent" stroke-width="1.1" stroke-opacity="0.24" />
            <circle cx="294" cy="148" r="76" stroke="#FFFFFF" stroke-width="1" stroke-dasharray="3 4" stroke-opacity="0.22" />
            <circle cx="294" cy="148" r="56" :stroke="visual.stripeColor" stroke-width="1.2" stroke-opacity="0.28" />
            <circle cx="294" cy="148" r="36" stroke="#FFFFFF" stroke-width="0.9" stroke-opacity="0.18" />
          </template>

          <!-- Precision Carbon Mesh / Grid (UnionDigital, RCBC, GrabPay) -->
          <template v-else-if="visual.motif === 'mesh'">
            <path
              d="M210 -12 L372 150 M246 -12 L372 114 M282 -12 L372 78 M174 -12 L372 186 M140 0 L360 220"
              :stroke="visual.accent"
              stroke-width="1"
              stroke-opacity="0.18"
            />
            <path
              d="M372 -12 L192 168 M372 24 L216 180 M372 60 L240 192 M372 96 L264 204"
              stroke="#FFFFFF"
              stroke-width="0.85"
              stroke-opacity="0.13"
            />
            <rect x="242" y="138" width="132" height="96" rx="14" :fill="`url(#${motifGradId})`" opacity="0.44" />
          </template>

          <!-- Twin Horizon Sweep (MariBank, CIMB, PNB, PSBank) -->
          <template v-else>
            <ellipse cx="298" cy="184" rx="164" ry="118" :fill="`url(#${motifGradId})`" opacity="0.62" />
            <path
              d="M-20 144 Q 176 74 380 154"
              :stroke="`url(#${foilGradId})`"
              stroke-width="2.2"
              opacity="0.68"
            />
            <path
              d="M-20 164 Q 186 106 380 176"
              :stroke="visual.accent"
              stroke-width="1"
              stroke-opacity="0.28"
            />
          </template>
        </svg>

        <!-- Card Header: Bank Issuer Mark, Official Name, Rail & Edit Trigger -->
        <header class="pointer-events-none relative z-10 flex items-start justify-between gap-2.5">
          <div class="flex min-w-0 items-center gap-2.5">
            <span
              class="tipid-card-issuer-seal flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/25 bg-black/22 shadow-xs backdrop-blur-xs"
              aria-hidden="true"
            >
              <span v-if="visual.monogram.length <= 3" class="font-mono text-[11px] font-extrabold tracking-tight">
                {{ visual.monogram }}
              </span>
              <component v-else :is="KindIcon" :size="17" class="shrink-0" />
            </span>

            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-1.5">
                <h3 class="tipid-card-embossed truncate text-[15px] font-bold tracking-tight">
                  {{ visual.displayName }}
                </h3>
                <span class="shrink-0 whitespace-nowrap rounded-full border border-white/22 bg-black/22 px-2 py-0.5 text-[10px] font-semibold tracking-wide">
                  {{ visual.kindLabel }}
                </span>
              </div>
              <p class="mt-0.5 truncate text-[10px] font-semibold tracking-[0.11em] uppercase opacity-80">
                {{ visual.railLabel }}
              </p>
            </div>
          </div>

          <button
            v-if="showEdit"
            type="button"
            class="tipid-compact tipid-compact-touch pointer-events-auto relative z-20 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/24 bg-black/22 opacity-92 backdrop-blur-xs transition-colors hover:bg-black/38 hover:opacity-100"
            :aria-label="`Adjust ${visual.displayName} balance`"
            :title="`Edit or remove ${visual.displayName}`"
            @click.stop="emit('edit', method)"
          >
            <Pencil :size="14" aria-hidden="true" />
          </button>
        </header>

        <!-- Middle Hardware Rail: Realistic Recessed 3D EMV Contact Chip + Contactless + Stamped Last 4 -->
        <div class="tipid-bank-card-mid pointer-events-none relative z-10 mt-4 flex items-center justify-between gap-3">
          <div class="flex min-w-0 items-center gap-2.5">
            <!-- Metallic 8-Pad EMV Contact Module -->
            <svg
              v-if="visual.chipFinish !== 'none'"
              aria-hidden="true"
              viewBox="0 0 42 30"
              class="tipid-emv-chip h-[25px] w-[35px] shrink-0 rounded-[5px]"
              :data-finish="visual.chipFinish"
              fill="none"
            >
              <defs>
                <linearGradient :id="goldGradId" x1="0" y1="0" x2="42" y2="30" gradientUnits="userSpaceOnUse">
                  <stop offset="0" stop-color="#FFF1B8" />
                  <stop offset="0.35" stop-color="#E7C266" />
                  <stop offset="0.7" stop-color="#C89B3C" />
                  <stop offset="1" stop-color="#9B7222" />
                </linearGradient>
                <linearGradient :id="silverGradId" x1="0" y1="0" x2="42" y2="30" gradientUnits="userSpaceOnUse">
                  <stop offset="0" stop-color="#F8FAFC" />
                  <stop offset="0.35" stop-color="#CBD5E1" />
                  <stop offset="0.72" stop-color="#94A3B8" />
                  <stop offset="1" stop-color="#64748B" />
                </linearGradient>
              </defs>
              <rect
                x="0.75"
                y="0.75"
                width="40.5"
                height="28.5"
                rx="4.75"
                :fill="visual.chipFinish === 'gold' ? `url(#${goldGradId})` : `url(#${silverGradId})`"
                stroke="rgba(255,255,255,0.62)"
                stroke-width="1"
              />
              <path
                d="M14 1V29M28 1V29M1 10H14M28 10H41M1 20H14M28 20H41"
                stroke="rgba(12,18,16,0.42)"
                stroke-width="1.05"
              />
              <rect
                x="14"
                y="8"
                width="14"
                height="14"
                rx="2.6"
                stroke="rgba(12,18,16,0.38)"
                stroke-width="1.05"
              />
              <line x1="2.5" y1="2.5" x2="39.5" y2="2.5" stroke="rgba(255,255,255,0.45)" stroke-width="0.75" />
            </svg>

            <!-- Digital Wallet Seal when card has no physical EMV chip -->
            <span
              v-else
              aria-hidden="true"
              class="inline-flex h-6 w-7 shrink-0 items-center justify-center rounded-md border border-white/25 bg-black/18"
            >
              <component :is="KindIcon" :size="13" class="shrink-0 opacity-90" />
            </span>

            <!-- Contactless NFC Waves -->
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              class="h-4 w-4 shrink-0 opacity-80"
              fill="none"
            >
              <path d="M5.5 7.2a4.8 4.8 0 0 1 0 5.6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
              <path d="M8.8 5.1a8 8 0 0 1 0 9.8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
              <path d="M12.2 3.1a11.4 11.4 0 0 1 0 13.8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
            </svg>

            <!-- Hot-stamped Card Digits -->
            <span class="tipid-card-digits truncate font-mono text-[12px] font-semibold tracking-[0.16em] tabular-nums opacity-92">
              •••• •••• {{ visual.cardLast4 }}
            </span>
          </div>

          <!-- Subtle Holographic Foil Square / Security Seal -->
          <span
            v-if="visual.chipFinish !== 'none'"
            aria-hidden="true"
            class="tipid-card-holo h-5 w-7 shrink-0 rounded-[4px]"
            title="EMV Secured"
          ></span>
        </div>

        <!-- Card Footer: Available Balance + Share Pill + Flip Cue + Network Emblem -->
        <footer class="pointer-events-none relative z-10 mt-4 flex items-end justify-between gap-2.5 border-t border-white/18 pt-3">
          <div class="min-w-0">
            <span class="block text-[10px] font-medium tracking-wider uppercase opacity-80">
              {{ visual.kind === "cash" ? (isTl ? "Hawak na Pera" : "On Hand Balance") : (isTl ? "Kasalukuyang Balanse" : "Available Balance") }}
            </span>
            <p class="tipid-amount tipid-bank-card-balance tipid-card-embossed mt-0.5 font-mono text-xl font-bold tracking-tight tabular-nums">
              <template v-if="balanceHidden">₱••••••</template>
              <template v-else>{{ isNegative ? "-₱" : "₱" }}{{ formatPeso(Math.abs(balance)) }}</template>
            </p>
          </div>

          <div class="flex shrink-0 flex-col items-end gap-1.5">
            <div class="flex items-center gap-1.5">
              <span
                v-if="isNegative"
                class="inline-flex items-center gap-1 rounded-full border border-white/30 bg-black/42 px-2 py-0.5 text-[10px] font-semibold"
              >
                <AlertCircle :size="11" aria-hidden="true" />
                <span>{{ isTl ? "Kulang" : "Overdrawn" }}</span>
              </span>
              <span
                v-else-if="portfolioSharePct !== null && !balanceHidden"
                class="whitespace-nowrap rounded-full border border-white/22 bg-black/26 px-2 py-0.5 font-mono text-[10px] font-semibold"
              >
                {{ portfolioSharePct }}% {{ isTl ? "bahagi" : "share" }}
              </span>

              <span
                v-if="!isDeckInactive"
                class="tipid-card-flip-cue inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/20 bg-black/20"
                aria-hidden="true"
              >
                <RotateCw :size="10" />
              </span>
            </div>

            <!-- Authentic Card Network Emblem -->
            <div aria-hidden="true" class="flex items-center justify-end">
              <span
                v-if="visual.network === 'VISA'"
                class="inline-flex items-center font-sans text-[13px] font-black italic tracking-[0.06em] text-white/95 drop-shadow-xs"
              >
                VISA
              </span>
              <span
                v-else-if="visual.network === 'MC'"
                class="inline-flex items-center -space-x-1.5"
              >
                <span class="h-4 w-4 rounded-full bg-[#EB001B]/90 ring-1 ring-white/20"></span>
                <span class="h-4 w-4 rounded-full bg-[#F79E1B]/90 ring-1 ring-white/20"></span>
              </span>
              <span
                v-else-if="visual.network === 'INSTAPAY'"
                class="rounded border border-white/22 bg-black/24 px-1.5 py-0.5 font-mono text-[9px] font-bold tracking-[0.12em] opacity-90"
              >
                INSTAPAY
              </span>
              <span
                v-else-if="visual.network === 'BANCNET'"
                class="rounded border border-white/22 bg-black/24 px-1.5 py-0.5 font-mono text-[9px] font-bold tracking-[0.12em] opacity-90"
              >
                BANCNET
              </span>
              <span
                v-else
                class="rounded border border-white/22 bg-black/24 px-1.5 py-0.5 font-mono text-[9px] font-bold tracking-[0.12em] opacity-90"
              >
                PHP CASH
              </span>
            </div>
          </div>
        </footer>
      </div>

      <!-- BACK FACE: Realistic Physical ATM Card Reverse (Magstripe, Signature Strip, CVC, Card Number & Expiry) -->
      <div
        class="tipid-card-face tipid-card-back flex flex-col justify-between overflow-hidden rounded-[1.15rem] px-5 pt-2.5 pb-3.5"
        :class="{ 'is-inactive-face': !isFlipped }"
        :inert="!isFlipped || undefined"
        :aria-hidden="!isFlipped ? 'true' : undefined"
      >
        <!-- Full-Card Accessible Flip-Back Hit Overlay -->
        <button
          v-if="!isDeckInactive"
          type="button"
          class="tipid-card-flip-hit"
          :aria-expanded="isFlipped"
          :aria-label="
            isTl
              ? `Ibalik ang ${visual.displayName} card sa harap`
              : `Flip ${visual.displayName} card back to front`
          "
          @click="toggleFlip"
        ></button>

        <span class="tipid-card-sheen pointer-events-none" aria-hidden="true"></span>

        <!-- Top Edge Issuer Service Bar -->
        <div class="pointer-events-none relative z-10 flex items-center justify-between gap-2 text-[9px] font-semibold tracking-[0.12em] uppercase opacity-80">
          <span class="truncate">{{ visual.displayName }} · {{ visual.railLabel }}</span>
          <div class="flex shrink-0 items-center gap-1.5">
            <button
              v-if="!balanceHidden"
              type="button"
              class="tipid-compact pointer-events-auto relative z-20 inline-flex h-5 w-5 items-center justify-center rounded-md border border-white/22 bg-black/28 text-white transition-colors hover:bg-black/48"
              :aria-label="maskCardBack ? 'Show card digits and CVC' : 'Hide card digits and CVC'"
              :title="maskCardBack ? 'Show card number & CVC' : 'Mask card number & CVC'"
              @click.stop="maskCardBack = !maskCardBack"
            >
              <Eye v-if="maskCardBack" :size="11" aria-hidden="true" />
              <EyeOff v-else :size="11" aria-hidden="true" />
            </button>
            <span class="inline-flex items-center gap-1 opacity-85" aria-hidden="true">
              <RotateCw :size="10" />
              <span>{{ isTl ? "Harap" : "Front" }}</span>
            </span>
          </div>
        </div>

        <!-- Edge-to-Edge High-Coercivity Magnetic Stripe -->
        <div class="tipid-card-magstripe pointer-events-none relative z-10 -mx-5 mt-1.5 h-7" aria-hidden="true"></div>

        <!-- Signature Security Tape & White-Backed Italic CVC Box -->
        <div class="pointer-events-none relative z-10 mt-2.5">
          <div class="mb-0.5 flex items-center justify-between text-[7.5px] font-semibold tracking-[0.14em] uppercase opacity-75">
            <span>AUTHORIZED SIGNATURE · NOT VALID UNLESS SIGNED</span>
            <span>{{ visual.kind === "cash" ? "REF CODE" : "CVC / CVV" }}</span>
          </div>
          <div class="flex items-stretch gap-1.5">
            <div class="tipid-card-sigstrip flex flex-1 items-center justify-between overflow-hidden rounded-[3px] px-2.5 py-1">
              <span class="tipid-card-signature truncate text-[12px] italic tracking-wide">
                Tipid Cardholder
              </span>
              <span class="font-mono text-[9px] font-semibold tracking-widest opacity-55">
                {{ visual.monogram }}
              </span>
            </div>
            <div
              class="tipid-card-cvc-box flex min-w-[46px] items-center justify-center rounded-[3px] px-2 py-1 font-mono text-[13px] font-black italic tracking-widest tabular-nums"
              :aria-label="backDigitsHidden ? 'CVC hidden' : `CVC ${visual.cvc}`"
            >
              {{ backDigitsHidden ? "•••" : visual.cvc }}
            </div>
          </div>
        </div>

        <!-- Embossed Full 16-Digit Card Number & Valid Thru -->
        <div class="pointer-events-none relative z-10 mt-2.5 flex items-end justify-between gap-2">
          <div class="min-w-0">
            <span class="block text-[8px] font-semibold tracking-[0.14em] uppercase opacity-70">
              {{ visual.kind === "cash" ? "RESERVE SERIAL NUMBER" : "CARD NUMBER" }}
            </span>
            <p class="tipid-card-digits mt-0.5 truncate font-mono text-[13px] font-bold tracking-[0.14em] tabular-nums">
              {{ formattedBackCardNumber }}
            </p>
          </div>

          <div class="flex shrink-0 items-center gap-1.5 text-right">
            <span class="text-[7px] leading-tight font-semibold tracking-wider uppercase opacity-75">
              VALID<br />THRU
            </span>
            <span class="tipid-card-digits font-mono text-[13px] font-bold tracking-wider tabular-nums">
              {{ backDigitsHidden ? "••/••" : visual.validThru }}
            </span>
          </div>
        </div>

        <!-- Bottom Issuer Fine Print & Security Hologram Seal -->
        <footer class="pointer-events-none relative z-10 mt-2 flex items-center justify-between gap-2 border-t border-white/15 pt-2">
          <p class="min-w-0 truncate text-[8.5px] leading-tight opacity-78">
            {{ visual.issuerNotice }} · Virtual Ref
          </p>
          <div class="flex shrink-0 items-center gap-1.5" aria-hidden="true">
            <span class="tipid-card-holo inline-block h-4 w-6 rounded-[3px]"></span>
            <span class="rounded border border-white/22 bg-black/25 px-1.5 py-0.5 font-mono text-[8px] font-bold tracking-[0.12em]">
              {{ visual.network === "MC" ? "CIRRUS" : visual.network === "CASH" ? "PHP" : visual.network }}
            </span>
          </div>
        </footer>
      </div>
    </div>
  </article>
</template>
