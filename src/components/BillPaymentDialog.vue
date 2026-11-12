<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch, type CSSProperties } from "vue";
import { ArrowDownRight, CheckCircle2, CreditCard, Repeat, Sparkles, Wallet, X } from "@lucide/vue";
import WalletCard from "@/components/WalletCard.vue";
import { getCategoryIcon } from "@/lib/categoryIcons";
import { formatPeso, fromCentavos, toCentavos } from "@/lib/core";
import { useI18n } from "@/lib/i18n";
import { resolveWalletVisual } from "@/lib/walletVisuals";
import type { BillRecord } from "@/types/finance";

export interface BillPaymentSettledResult {
  wallet: string | null;
  beforeBalance: number;
  afterBalance: number;
  nextDueDate: string | null;
}

const LAST_BILL_WALLET_STORAGE_KEY = "tipid:last-bill-payment-wallet";

const props = withDefaults(
  defineProps<{
    open: boolean;
    bill: BillRecord | null;
    wallets: string[];
    walletBalances: Readonly<Record<string, number>>;
    processing?: boolean;
    paymentResult?: BillPaymentSettledResult | null;
    errorMessage?: string;
  }>(),
  {
    processing: false,
    paymentResult: null,
    errorMessage: ""
  }
);

const emit = defineEmits<{
  (e: "close"): void;
  (e: "confirm", payload: { wallet: string | null }): void;
}>();

const { isTl } = useI18n();

const dialogEl = ref<HTMLDialogElement | null>(null);
const doneButtonEl = ref<HTMLButtonElement | null>(null);
const selectedWallet = ref<string | null>(null);
const animatedBalance = ref(0);
const animationPhase = ref<"idle" | "entering" | "counting" | "settled">("idle");

let enterTimer: number | null = null;
let rafId: number | null = null;

const titleId = "tipid-bill-payment-dialog-title";

function clearAnimationTimers() {
  if (enterTimer !== null && typeof window !== "undefined") {
    window.clearTimeout(enterTimer);
    enterTimer = null;
  }
  if (rafId !== null && typeof window !== "undefined") {
    window.cancelAnimationFrame(rafId);
    rafId = null;
  }
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return true;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function readStoredPreferredWallet(): string | null {
  try {
    if (typeof window === "undefined" || !window.localStorage) return null;
    const saved = window.localStorage.getItem(LAST_BILL_WALLET_STORAGE_KEY);
    return saved && saved.trim() ? saved.trim() : null;
  } catch {
    return null;
  }
}

function writeStoredPreferredWallet(wallet: string | null) {
  try {
    if (typeof window === "undefined" || !window.localStorage) return;
    if (wallet) {
      window.localStorage.setItem(LAST_BILL_WALLET_STORAGE_KEY, wallet);
    }
  } catch {
    // Ignore storage restriction errors in private browsing or locked sandboxes.
  }
}

function safeCents(value: unknown): number {
  try {
    return toCentavos(value, { allowZero: true, allowNegative: true });
  } catch {
    return 0;
  }
}

function formatSignedPeso(amount: number): string {
  const numeric = Number(amount);
  if (!Number.isFinite(numeric)) return "₱0.00";
  return `${numeric < 0 ? "-" : ""}₱${formatPeso(Math.abs(numeric))}`;
}

const billCents = computed(() => {
  if (!props.bill) return 0;
  try {
    return toCentavos(props.bill.amount, { allowZero: false });
  } catch {
    return 0;
  }
});

interface WalletOptionItem {
  name: string;
  visual: ReturnType<typeof resolveWalletVisual>;
  balance: number;
  afterBalance: number;
  coversBill: boolean;
  swatchStyle: CSSProperties;
}

const walletOptions = computed<WalletOptionItem[]>(() =>
  props.wallets.map((name) => {
    const visual = resolveWalletVisual(name);
    const currentCents = safeCents(props.walletBalances[name] ?? 0);
    const afterCents = currentCents - billCents.value;
    return {
      name,
      visual,
      balance: fromCentavos(currentCents),
      afterBalance: fromCentavos(afterCents),
      coversBill: currentCents >= billCents.value,
      swatchStyle: {
        background: `linear-gradient(135deg, ${visual.surfaceStart} 0%, ${visual.surfaceEnd} 100%)`,
        color: visual.inkColor,
        borderColor: "rgba(255, 255, 255, 0.22)"
      }
    };
  })
);

function pickDefaultWallet(): string | null {
  const options = walletOptions.value;
  if (options.length === 0) return null;

  const remembered = readStoredPreferredWallet();
  if (remembered) {
    const match = options.find((item) => item.name === remembered);
    if (match && match.coversBill) return match.name;
  }

  const nonCashCovering = options.find((item) => item.visual.kind !== "cash" && item.coversBill);
  if (nonCashCovering) return nonCashCovering.name;

  const anyCovering = options.find((item) => item.coversBill);
  if (anyCovering) return anyCovering.name;

  if (remembered && options.some((item) => item.name === remembered)) {
    return remembered;
  }

  const firstCard = options.find((item) => item.visual.kind !== "cash");
  return firstCard ? firstCard.name : options[0].name;
}

const selectedVisual = computed(() =>
  selectedWallet.value ? resolveWalletVisual(selectedWallet.value) : null
);

const settledVisual = computed(() =>
  props.paymentResult?.wallet ? resolveWalletVisual(props.paymentResult.wallet) : null
);

const stageThemeStyle = computed<CSSProperties>(() => {
  const accent = settledVisual.value?.accent || "#10b981";
  const surface = settledVisual.value?.surfaceEnd || "#0f4f39";
  return {
    "--tipid-deduct-accent": accent,
    "--tipid-deduct-surface": surface
  } as CSSProperties;
});

function startDeductionAnimation(result: BillPaymentSettledResult) {
  clearAnimationTimers();
  if (!result.wallet) {
    animatedBalance.value = result.afterBalance;
    animationPhase.value = "settled";
    return;
  }

  const startCents = safeCents(result.beforeBalance);
  const endCents = safeCents(result.afterBalance);

  if (prefersReducedMotion() || typeof window === "undefined") {
    animatedBalance.value = fromCentavos(endCents);
    animationPhase.value = "settled";
    return;
  }

  animatedBalance.value = fromCentavos(startCents);
  animationPhase.value = "entering";

  enterTimer = window.setTimeout(() => {
    enterTimer = null;
    animationPhase.value = "counting";
    const durationMs = 780;
    const startTime = typeof performance !== "undefined" ? performance.now() : Date.now();

    const step = (now: number) => {
      const elapsed = Math.max(0, now - startTime);
      const progress = Math.min(1, elapsed / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentCents = Math.round(startCents + (endCents - startCents) * eased);
      animatedBalance.value = fromCentavos(currentCents);

      if (progress < 1) {
        rafId = window.requestAnimationFrame(step);
      } else {
        rafId = null;
        animatedBalance.value = fromCentavos(endCents);
        animationPhase.value = "settled";
      }
    };

    rafId = window.requestAnimationFrame(step);
  }, 210);
}

watch(
  () => [props.open, props.bill?.id] as const,
  async ([isOpen]) => {
    if (!isOpen) {
      clearAnimationTimers();
      animationPhase.value = "idle";
      return;
    }
    if (!props.paymentResult) {
      selectedWallet.value = pickDefaultWallet();
      animationPhase.value = "idle";
    }
    await nextTick();
    const el = dialogEl.value;
    if (el && !el.open) {
      if (typeof el.showModal === "function") {
        el.showModal();
      } else {
        el.setAttribute("open", "");
      }
    }
  },
  { immediate: true }
);

watch(
  () => props.open,
  (isOpen) => {
    const el = dialogEl.value;
    if (!el || isOpen) return;
    if (el.open && typeof el.close === "function") {
      el.close();
    } else if (el.hasAttribute("open")) {
      el.removeAttribute("open");
    }
  }
);

watch(
  () => props.paymentResult,
  async (result) => {
    if (!result) {
      clearAnimationTimers();
      animationPhase.value = "idle";
      return;
    }
    startDeductionAnimation(result);
    await nextTick();
    doneButtonEl.value?.focus();
  }
);

onBeforeUnmount(() => {
  clearAnimationTimers();
});

function handleNativeClose() {
  clearAnimationTimers();
  if (props.open) {
    emit("close");
  }
}

function handleCancel(event: Event) {
  if (props.processing) {
    event.preventDefault();
  }
}

function requestClose() {
  if (props.processing) return;
  const el = dialogEl.value;
  if (el?.open && typeof el.close === "function") {
    el.close();
  } else {
    emit("close");
  }
}

function handleConfirm() {
  if (!props.bill || props.processing) return;
  writeStoredPreferredWallet(selectedWallet.value);
  emit("confirm", { wallet: selectedWallet.value });
}
</script>

<template>
  <dialog
    ref="dialogEl"
    class="tipid-dialog tipid-pay-dialog"
    :aria-labelledby="titleId"
    :closedby="processing ? 'none' : 'any'"
    @close="handleNativeClose"
    @cancel="handleCancel"
  >
    <div v-if="bill" class="flex flex-col">
      <!-- Top Header -->
      <header class="flex items-start justify-between gap-3 border-b border-[var(--border-subtle)] px-5 py-4">
        <div class="flex min-w-0 items-center gap-3">
          <div
            :class="[
              'tipid-icon-badge h-10 w-10 shrink-0 rounded-2xl transition-colors',
              paymentResult
                ? 'bg-[var(--income-soft)] text-[var(--income)]'
                : 'bg-[var(--accent-soft)] text-[var(--accent)]'
            ]"
            aria-hidden="true"
          >
            <CheckCircle2 v-if="paymentResult" :size="20" />
            <CreditCard v-else :size="19" />
          </div>
          <div class="min-w-0">
            <h2 :id="titleId" class="truncate text-base font-bold tracking-tight text-[var(--text-primary)]">
              <template v-if="paymentResult">
                {{
                  paymentResult.wallet
                    ? isTl
                      ? "Bayad at Nabawas sa Card"
                      : "Payment & Card Deduction Confirmed"
                    : isTl
                      ? "Minarkahang Bayad"
                      : "Bill Marked as Paid"
                }}
              </template>
              <template v-else>
                {{ isTl ? "Piliin ang Card na Pambayad" : "Pay Bill with ATM Card" }}
              </template>
            </h2>
            <p class="truncate text-xs text-[var(--text-muted)]">
              {{ bill.title }} · {{ bill.category }}
            </p>
          </div>
        </div>

        <button
          type="button"
          class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-inset)] hover:text-[var(--text-primary)] disabled:opacity-45"
          :disabled="processing"
          :aria-label="isTl ? 'Isara' : 'Close dialog'"
          @click="requestClose"
        >
          <X :size="18" />
        </button>
      </header>

      <!-- STAGE 1: ATM Card / Wallet Selector -->
      <div v-if="!paymentResult" class="space-y-4 p-5">
        <!-- Bill Summary Card -->
        <div class="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-inset)]/60 px-4 py-3">
          <div class="flex min-w-0 items-center gap-2.5">
            <span class="tipid-icon-badge h-9 w-9 shrink-0 rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]" aria-hidden="true">
              <component :is="getCategoryIcon(bill.category)" :size="16" />
            </span>
            <div class="min-w-0">
              <p class="truncate text-sm font-bold text-[var(--text-primary)]">{{ bill.title }}</p>
              <p class="text-[11px] font-medium text-[var(--text-muted)]">
                {{ isTl ? "Takdang petsa" : "Due" }} {{ bill.dueDate }}
                <template v-if="bill.recurrence && bill.recurrence !== 'none'">
                  · <span class="capitalize">{{ bill.recurrence }}</span>
                </template>
              </p>
            </div>
          </div>
          <div class="shrink-0 text-right">
            <p class="font-mono text-base font-extrabold text-[var(--expense)]">
              -₱{{ formatPeso(bill.amount) }}
            </p>
            <p class="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              {{ isTl ? "Babayaran" : "Bill amount" }}
            </p>
          </div>
        </div>

        <!-- Radio Group of ATM Cards & Wallets -->
        <div>
          <div class="mb-2 flex items-center justify-between gap-2">
            <span class="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
              {{ isTl ? "Piliin ang ATM Card / Wallet" : "Select ATM Card / Account" }}
            </span>
            <span class="text-[11px] font-medium text-[var(--text-muted)]">
              {{ isTl ? "Awtomatikong ibabawas" : "Auto-deducts balance" }}
            </span>
          </div>

          <div
            role="radiogroup"
            :aria-label="isTl ? 'Piliin ang ATM card na gagamitin' : 'Select payment ATM card or wallet'"
            class="space-y-2 max-h-[42dvh] overflow-y-auto pr-0.5"
          >
            <button
              v-for="option in walletOptions"
              :key="option.name"
              type="button"
              role="radio"
              :aria-checked="selectedWallet === option.name"
              :data-wallet-option="option.name"
              :class="[
                'group flex w-full items-center justify-between gap-3 rounded-2xl border px-3.5 py-3 text-left transition-all',
                selectedWallet === option.name
                  ? 'border-[var(--accent)] bg-[var(--accent-soft)]/55 shadow-sm ring-1 ring-[var(--accent)]/30'
                  : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-inset)]/45'
              ]"
              :disabled="processing"
              @click="selectedWallet = option.name"
            >
              <div class="flex min-w-0 items-center gap-3">
                <!-- Miniature ATM Card Emblem -->
                <span
                  class="relative flex h-9 w-13 shrink-0 flex-col justify-between overflow-hidden rounded-lg border px-1.5 py-1 shadow-xs"
                  :style="option.swatchStyle"
                  aria-hidden="true"
                >
                  <span class="flex items-center justify-between">
                    <span class="h-1.5 w-2 rounded-[2px] bg-amber-300/85" />
                    <span class="text-[7px] font-bold tracking-wider opacity-80">{{ option.visual.network }}</span>
                  </span>
                  <span class="flex items-end justify-between">
                    <span class="text-[9px] font-extrabold tracking-tight leading-none">{{ option.visual.monogram }}</span>
                    <span class="font-mono text-[7px] opacity-75">{{ option.visual.cardLast4 }}</span>
                  </span>
                </span>

                <div class="min-w-0">
                  <div class="flex items-center gap-1.5">
                    <span class="truncate text-sm font-bold text-[var(--text-primary)]">
                      {{ option.visual.displayName }}
                    </span>
                    <span
                      v-if="!option.coversBill"
                      class="shrink-0 rounded-full bg-[var(--warning-soft)] px-1.5 py-0.5 text-[9px] font-bold text-[var(--warning)]"
                    >
                      {{ isTl ? "Kulang balanse" : "Low balance" }}
                    </span>
                  </div>
                  <p class="truncate text-[11px] font-medium text-[var(--text-muted)]">
                    {{ option.visual.kindLabel }}
                    <template v-if="option.visual.kind !== 'cash'"> · •••• {{ option.visual.cardLast4 }}</template>
                  </p>
                </div>
              </div>

              <div class="shrink-0 text-right">
                <p class="font-mono text-xs font-bold text-[var(--text-primary)]">
                  {{ formatSignedPeso(option.balance) }}
                </p>
                <p
                  :class="[
                    'font-mono text-[10px] font-semibold',
                    option.afterBalance < 0 ? 'text-[var(--expense)]' : 'text-[var(--income)]'
                  ]"
                >
                  {{ isTl ? "Matitira:" : "After:" }} {{ formatSignedPeso(option.afterBalance) }}
                </p>
              </div>
            </button>

            <!-- Optional No-Deduction Fallback -->
            <button
              type="button"
              role="radio"
              :aria-checked="selectedWallet === null"
              data-wallet-option="__none__"
              :class="[
                'flex w-full items-center justify-between gap-3 rounded-2xl border px-3.5 py-2.5 text-left transition-all',
                selectedWallet === null
                  ? 'border-[var(--accent)] bg-[var(--accent-soft)]/50 ring-1 ring-[var(--accent)]/25'
                  : 'border-dashed border-[var(--border-strong)] bg-transparent hover:bg-[var(--bg-inset)]/40'
              ]"
              :disabled="processing"
              @click="selectedWallet = null"
            >
              <div class="flex min-w-0 items-center gap-2.5">
                <span class="tipid-icon-badge h-8 w-8 shrink-0 rounded-xl bg-[var(--bg-inset)] text-[var(--text-muted)]" aria-hidden="true">
                  <Wallet :size="15" />
                </span>
                <div class="min-w-0">
                  <p class="text-xs font-bold text-[var(--text-primary)]">
                    {{ isTl ? "Markahang bayad lang (walang bawas sa card)" : "Mark paid only (skip wallet deduction)" }}
                  </p>
                  <p class="text-[11px] text-[var(--text-muted)]">
                    {{ isTl ? "Gamitin kung nai-log na sa History." : "Use if already logged in History." }}
                  </p>
                </div>
              </div>
              <CheckCircle2
                v-if="selectedWallet === null"
                :size="17"
                class="shrink-0 text-[var(--accent)]"
                aria-hidden="true"
              />
            </button>
          </div>
        </div>

        <p
          v-if="errorMessage"
          role="alert"
          class="rounded-xl border border-[var(--expense)]/30 bg-[var(--expense-soft)] px-3 py-2 text-xs font-semibold text-[var(--expense)]"
        >
          {{ errorMessage }}
        </p>

        <div class="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
          <button
            type="button"
            class="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-2.5 text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-inset)] disabled:opacity-50"
            :disabled="processing"
            @click="requestClose"
          >
            {{ isTl ? "Kanselahin" : "Cancel" }}
          </button>
          <button
            type="button"
            data-confirm-bill-payment
            class="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[var(--accent-hover)] disabled:opacity-60"
            :disabled="processing"
            autofocus
            @click="handleConfirm"
          >
            <CreditCard :size="15" aria-hidden="true" />
            <span v-if="processing">
              {{
                selectedVisual
                  ? isTl
                    ? `Binabawas sa ${selectedVisual.displayName}...`
                    : `Deducting from ${selectedVisual.displayName}...`
                  : isTl
                    ? "Nagmamarka..."
                    : "Updating bill..."
              }}
            </span>
            <span v-else>
              {{
                selectedVisual
                  ? isTl
                    ? `Bayaran gamit ang ${selectedVisual.displayName} (₱${formatPeso(bill.amount)})`
                    : `Pay ₱${formatPeso(bill.amount)} with ${selectedVisual.displayName}`
                  : isTl
                    ? "Markahang Bayad"
                    : "Mark Paid Only"
              }}
            </span>
          </button>
        </div>
      </div>

      <!-- STAGE 2: Modern Fintech Card Deduction Animation & Receipt -->
      <div v-else class="space-y-4 p-5">
        <div
          v-if="paymentResult.wallet && settledVisual"
          class="tipid-deduct-stage"
          :data-phase="animationPhase"
          :style="stageThemeStyle"
        >
          <div class="tipid-deduct-stage-glow" aria-hidden="true" />

          <!-- Floating Deduction Pill -->
          <div class="tipid-deduct-header-row">
            <span class="tipid-deduct-source-pill">
              <Sparkles :size="12" aria-hidden="true" />
              <span>{{ settledVisual.displayName }}</span>
            </span>

            <span
              class="tipid-deduct-amount-pill"
              role="status"
              aria-live="polite"
            >
              <ArrowDownRight :size="14" aria-hidden="true" />
              <span>-₱{{ formatPeso(bill.amount) }}</span>
              <span class="tipid-deduct-tag">{{ isTl ? "NABAWAS" : "DEDUCTED" }}</span>
            </span>
          </div>

          <!-- Live Physical ATM Card Appearing + Animating Balance Countdown -->
          <div class="tipid-deduct-card-wrap">
            <WalletCard
              :method="paymentResult.wallet"
              :balance="animatedBalance"
              :total-positive-balance="0"
              :show-edit="false"
            />
          </div>

          <!-- Before -> Deducted -> Remaining Breakdown -->
          <div class="tipid-deduct-ledger" aria-label="Deduction breakdown">
            <div class="tipid-deduct-metric">
              <span class="tipid-deduct-metric-label">{{ isTl ? "Dating Balanse" : "Before" }}</span>
              <span class="tipid-deduct-metric-val">{{ formatSignedPeso(paymentResult.beforeBalance) }}</span>
            </div>
            <div class="tipid-deduct-metric">
              <span class="tipid-deduct-metric-label">{{ isTl ? "Ibinawas" : "Deducted" }}</span>
              <span class="tipid-deduct-metric-val is-debit">-₱{{ formatPeso(bill.amount) }}</span>
            </div>
            <div class="tipid-deduct-metric">
              <span class="tipid-deduct-metric-label">{{ isTl ? "Bagong Balanse" : "New Balance" }}</span>
              <span
                :class="[
                  'tipid-deduct-metric-val',
                  paymentResult.afterBalance < 0 ? 'is-debit' : 'is-settled'
                ]"
              >
                {{ formatSignedPeso(paymentResult.afterBalance) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Fallback Confirmation when Paid Without Card Deduction -->
        <div
          v-else
          class="flex items-center justify-between gap-3 rounded-2xl border border-[var(--income)]/25 bg-[var(--income-soft)]/50 px-4 py-4"
        >
          <div class="min-w-0">
            <p class="text-sm font-bold text-[var(--text-primary)]">{{ bill.title }}</p>
            <p class="text-xs text-[var(--text-secondary)]">
              {{ isTl ? "Naitala bilang bayad na (walang bawas sa card)." : "Recorded as paid without wallet deduction." }}
            </p>
          </div>
          <p class="font-mono text-base font-extrabold text-[var(--income)]">
            ₱{{ formatPeso(bill.amount) }}
          </p>
        </div>

        <p
          v-if="paymentResult.nextDueDate"
          class="flex items-center gap-2 rounded-xl border border-[var(--accent)]/20 bg-[var(--accent-soft)]/45 px-3.5 py-2.5 text-xs font-semibold text-[var(--accent)]"
        >
          <Repeat :size="14" class="shrink-0" aria-hidden="true" />
          <span>
            {{
              isTl
                ? `Awtomatikong naitakda ang susunod na due sa ${paymentResult.nextDueDate}.`
                : `Next recurring bill automatically scheduled for ${paymentResult.nextDueDate}.`
            }}
          </span>
        </p>

        <div class="flex justify-end pt-1">
          <button
            ref="doneButtonEl"
            type="button"
            data-payment-done
            class="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[var(--accent-hover)] sm:w-auto"
            @click="requestClose"
          >
            <CheckCircle2 :size="15" aria-hidden="true" />
            <span>{{ isTl ? "Tapos na" : "Done" }}</span>
          </button>
        </div>
      </div>
    </div>
  </dialog>
</template>
