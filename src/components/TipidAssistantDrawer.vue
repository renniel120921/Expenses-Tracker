<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from "vue";
import {
  Sparkles,
  X,
  Send,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Trash2,
  Loader2,
  WifiOff,
  Bot
} from "@lucide/vue";
import {
  CATEGORIES,
  formatPeso,
  money,
  storageKey
} from "@/lib/core";
import { addExpense, addIncome } from "@/lib/data";
import { notifyWriteResult } from "@/lib/offlineSync";
import { resolveWalletVisual } from "@/lib/walletVisuals";
import { useFinanceData, useSharedFinanceSnapshot } from "@/composables/useFinanceData";
import { useI18n } from "@/lib/i18n";
import { pushToast } from "@/composables/useToast";
import {
  analyzeSpendingBehavior,
  evaluateActionBehaviorWarning,
  type AssistantBehaviorAlert,
  type AssistantLedgerSnapshot,
  type ProposedChatAction
} from "@/lib/assistantEngine";
import { sendAssistantMessage, type ChatHistoryTurn } from "@/lib/assistantClient";

interface EditableDraft extends ProposedChatAction {
  id: string;
  status: "pending" | "saving" | "saved" | "dismissed";
  error?: string;
}

interface ChatMessageItem {
  id: string;
  role: "user" | "assistant";
  text: string;
  mode?: "ai" | "local";
  warning?: AssistantBehaviorAlert | null;
  drafts: EditableDraft[];
}

const props = defineProps<{
  open: boolean;
  uid: string;
  isOffline: boolean;
}>();

const emit = defineEmits<{
  (e: "close"): void;
}>();

const { lang, isTl } = useI18n();
const sharedSnapshot = useSharedFinanceSnapshot();
const lazyUidRef = computed(() => (props.open && props.uid ? props.uid : undefined));
const lazyData = useFinanceData(lazyUidRef, {
  withBills: true,
  withUtang: true,
  withSavingsGoals: true,
  withCategoryBudgets: true
});

const preferredWallet = computed(() => {
  try {
    return localStorage.getItem(storageKey(props.uid, "default_wallet")) || undefined;
  } catch {
    return undefined;
  }
});

const effectiveSnapshot = computed<AssistantLedgerSnapshot>(() => {
  const wallets =
    sharedSnapshot.wallets.length > 0 ? sharedSnapshot.wallets : lazyData.wallets.value;
  const walletBalances =
    Object.keys(sharedSnapshot.walletBalances).length > 0
      ? sharedSnapshot.walletBalances
      : lazyData.walletBalances.value;
  const entries =
    sharedSnapshot.entries.length >= lazyData.entries.value.length
      ? sharedSnapshot.entries
      : lazyData.entries.value;

  return {
    entries,
    budget: sharedSnapshot.budget ?? lazyData.budget.value,
    budgetCycle: sharedSnapshot.budgetCycle || lazyData.budgetCycle.value,
    wallets,
    walletBalances,
    overallBalance:
      sharedSnapshot.entries.length > 0 || sharedSnapshot.overallBalance !== 0
        ? sharedSnapshot.overallBalance
        : lazyData.overallBalance.value,
    bills: sharedSnapshot.bills.length > 0 ? sharedSnapshot.bills : lazyData.bills.value,
    utangList:
      sharedSnapshot.utangList.length > 0 ? sharedSnapshot.utangList : lazyData.utangList.value,
    savingsGoals:
      sharedSnapshot.savingsGoals.length > 0
        ? sharedSnapshot.savingsGoals
        : lazyData.savingsGoals.value,
    categoryBudgets:
      sharedSnapshot.categoryBudgets.length > 0
        ? sharedSnapshot.categoryBudgets
        : lazyData.categoryBudgets.value,
    preferredWallet: preferredWallet.value
  };
});

const activeWarnings = computed(() =>
  analyzeSpendingBehavior(effectiveSnapshot.value, lang.value)
);

const dialogRef = ref<HTMLDialogElement | null>(null);
const scrollBodyRef = ref<HTMLElement | null>(null);
const inputRef = ref<HTMLInputElement | null>(null);
const draftText = ref("");
const sending = ref(false);
const messages = ref<ChatMessageItem[]>([]);
const lastMode = ref<"ai" | "local">(props.isOffline ? "local" : "ai");

let seq = 0;
let pressedOutside = false;

function nextId(prefix: string): string {
  seq += 1;
  return `${prefix}-${Date.now()}-${seq}`;
}

function buildGreetingMessage(): ChatMessageItem {
  const topWarning = activeWarnings.value[0];
  const greeting = isTl.value
    ? "Kumusta! Ako si Tipid Coach. Puwede mo akong tanungin tungkol sa budget, safe-to-spend, bills, o utang — o utusan na mag-log tulad ng \"Log 150 lunch sa Cash\" o \"Kita 12000 sa Land Bank\"."
    : "Hi! I am Tipid Coach. Ask me about your spending, safe-to-spend, bills, or utang — or tell me to log entries like \"Log 150 lunch via Cash\" or \"Log income 12000 to Land Bank\".";

  return {
    id: nextId("msg"),
    role: "assistant",
    text: greeting,
    mode: props.isOffline ? "local" : undefined,
    warning: topWarning
      ? { level: topWarning.severity, title: topWarning.title, detail: topWarning.detail }
      : null,
    drafts: []
  };
}

function isPointerOutsideDialog(e: PointerEvent, dialog: HTMLDialogElement): boolean {
  const r = dialog.getBoundingClientRect();
  return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
}

function handlePointerDown(e: PointerEvent) {
  const el = dialogRef.value;
  if (!el) {
    pressedOutside = false;
    return;
  }
  pressedOutside = isPointerOutsideDialog(e, el);
}

function handlePointerUp(e: PointerEvent) {
  const el = dialogRef.value;
  if (!el) return;
  if (!("closedBy" in HTMLDialogElement.prototype) && pressedOutside && isPointerOutsideDialog(e, el)) {
    el.close();
  }
  pressedOutside = false;
}

function handleDialogClose() {
  if (dialogRef.value) {
    dialogRef.value.returnValue = "";
  }
  emit("close");
}

watch(
  () => props.open,
  async (isOpen) => {
    const el = dialogRef.value;
    if (isOpen) {
      if (messages.value.length === 0) {
        messages.value = [buildGreetingMessage()];
      }
      if (el && !el.open) {
        el.showModal();
      }
      await nextTick();
      scrollToBottom();
      inputRef.value?.focus();
    } else if (el && el.open) {
      el.close();
    }
  }
);

watch(
  () => props.uid,
  () => {
    messages.value = [];
    draftText.value = "";
  }
);

onMounted(() => {
  const el = dialogRef.value;
  if (el && props.open && !el.open) {
    if (messages.value.length === 0) {
      messages.value = [buildGreetingMessage()];
    }
    el.showModal();
  }
});

onUnmounted(() => {
  if (dialogRef.value?.open) {
    dialogRef.value.close();
  }
});

function scrollToBottom(): void {
  const container = scrollBodyRef.value;
  if (!container) return;
  container.scrollTop = container.scrollHeight;
}

const quickPrompts = computed(() =>
  isTl.value
    ? [
        { label: "Check spending", prompt: "Kumusta gastos ko ngayon? Nag-o-overspend ba ako?" },
        { label: "Safe to spend?", prompt: "Magkano na lang ang safe to spend ko?" },
        { label: "Bills & utang", prompt: "Ano ang unpaid bills at utang ko?" },
        { label: "Log sample", prompt: "Log 150 lunch sa Cash" }
      ]
    : [
        { label: "Check spending", prompt: "Am I overspending? Check my spending habits." },
        { label: "Safe to spend?", prompt: "How much is left safe to spend this cycle?" },
        { label: "Bills & utang", prompt: "Summarize my unpaid bills and utang." },
        { label: "Log sample", prompt: "Log 150 lunch via Cash" }
      ]
);

async function submitPrompt(overrideText?: string): Promise<void> {
  const raw = (overrideText ?? draftText.value).trim();
  if (!raw || sending.value) return;

  if (!overrideText) {
    draftText.value = "";
  }

  const userMsg: ChatMessageItem = {
    id: nextId("user"),
    role: "user",
    text: raw,
    drafts: []
  };
  const historyForRequest: ChatHistoryTurn[] = messages.value.slice(-8).map((m) => ({
    role: m.role,
    text: m.text
  }));
  messages.value.push(userMsg);
  await nextTick();
  scrollToBottom();

  sending.value = true;
  try {
    const res = await sendAssistantMessage({
      message: raw,
      history: historyForRequest,
      snapshot: effectiveSnapshot.value,
      lang: lang.value
    });

    lastMode.value = res.mode;
    messages.value.push({
      id: nextId("bot"),
      role: "assistant",
      text: res.reply,
      mode: res.mode,
      warning: res.warning,
      drafts: res.proposedActions.map((act) => ({
        ...act,
        id: nextId("draft"),
        status: "pending"
      }))
    });
  } finally {
    sending.value = false;
    await nextTick();
    scrollToBottom();
  }
}

function clearChat(): void {
  messages.value = [buildGreetingMessage()];
}

function dismissDraft(draft: EditableDraft): void {
  draft.status = "dismissed";
  draft.error = undefined;
}

async function confirmDraft(draft: EditableDraft): Promise<void> {
  if (!props.uid || draft.status === "saving" || draft.status === "saved") return;
  draft.error = undefined;

  let safeAmount: number;
  try {
    safeAmount = money(draft.amount);
  } catch {
    draft.error = isTl.value ? "Maglagay ng wastong halaga." : "Enter a valid positive amount.";
    return;
  }

  const cleanDesc = draft.desc.trim();
  if (!cleanDesc) {
    draft.error = isTl.value ? "Maglagay ng paglalarawan." : "Enter a description.";
    return;
  }

  const validWallets = effectiveSnapshot.value.wallets;
  const method = validWallets.includes(draft.method) ? draft.method : validWallets[0] || "Cash";
  const walletBal = effectiveSnapshot.value.walletBalances[method] ?? 0;

  if (draft.type === "expense" && safeAmount > walletBal) {
    draft.error = isTl.value
      ? `Kulang ang balanse sa ${resolveWalletVisual(method).displayName} (₱${formatPeso(walletBal)} lang).`
      : `Insufficient balance in ${resolveWalletVisual(method).displayName} (₱${formatPeso(walletBal)} available).`;
    return;
  }

  draft.status = "saving";
  try {
    if (draft.type === "income") {
      const res = await addIncome(props.uid, {
        desc: cleanDesc,
        amount: safeAmount,
        method
      });
      notifyWriteResult(
        pushToast,
        res,
        isTl.value ? "Naitala ang kita." : "Income recorded.",
        isTl.value ? "Naka-save offline — isi-sync online." : "Saved offline — syncs when online."
      );
    } else {
      const safeCat = CATEGORIES.includes(draft.category) ? draft.category : "Other";
      const safeSpend = draft.spendType === "luho" ? "luho" : "need";
      const res = await addExpense(props.uid, {
        desc: cleanDesc,
        amount: safeAmount,
        category: safeCat,
        method,
        spendType: safeSpend
      });
      notifyWriteResult(
        pushToast,
        res,
        isTl.value ? "Naitala ang gastos." : "Expense recorded.",
        isTl.value ? "Naka-save offline — isi-sync online." : "Saved offline — syncs when online."
      );
    }

    draft.status = "saved";

    const postWarning = evaluateActionBehaviorWarning(
      { ...draft, amount: safeAmount, desc: cleanDesc, method },
      effectiveSnapshot.value,
      lang.value,
      false
    );
    if (postWarning && postWarning.level !== "none") {
      messages.value.push({
        id: nextId("warn"),
        role: "assistant",
        text: isTl.value
          ? `Na-save na ang "${cleanDesc}" (₱${formatPeso(safeAmount)}). Paalala lang sa gastos:`
          : `Saved "${cleanDesc}" (₱${formatPeso(safeAmount)}). Spending heads-up:`,
        mode: "local",
        warning: postWarning,
        drafts: []
      });
      await nextTick();
      scrollToBottom();
    }
  } catch {
    draft.status = "pending";
    draft.error = isTl.value
      ? "Hindi nai-save ang entry. Subukan ulit."
      : "Could not save transaction. Please try again.";
  }
}

function warningCardClass(level: AssistantBehaviorAlert["level"] | "watch" | "warning" | "critical"): string {
  if (level === "critical") {
    return "border-[var(--expense)]/35 bg-[var(--expense-soft)] text-[var(--expense)]";
  }
  if (level === "warning") {
    return "border-[var(--warning)]/40 bg-[var(--warning-soft)] text-[var(--warning)]";
  }
  return "border-[var(--accent)]/30 bg-[var(--accent-soft)] text-[var(--accent)]";
}
</script>

<template>
  <dialog
    id="tipid-assistant-dialog"
    ref="dialogRef"
    closedby="any"
    aria-labelledby="tipid-assistant-title"
    class="tipid-dialog tipid-assistant-dialog"
    @close="handleDialogClose"
    @pointerdown="handlePointerDown"
    @pointerup="handlePointerUp"
  >
    <div class="flex h-full flex-col overflow-hidden bg-[var(--bg-surface)]">
      <!-- Header -->
      <header
        class="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--border-subtle)] px-4 py-3.5 sm:px-5"
        style="padding-top: max(0.875rem, var(--safe-top))"
      >
        <div class="flex min-w-0 items-center gap-2.5">
          <div class="tipid-icon-badge h-9 w-9 shrink-0 rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
            <Sparkles :size="17" aria-hidden="true" />
          </div>
          <div class="min-w-0">
            <h2 id="tipid-assistant-title" class="truncate text-sm font-bold tracking-tight text-[var(--text-primary)]">
              Tipid Coach
            </h2>
            <p class="flex items-center gap-1.5 text-[11px] font-medium text-[var(--text-muted)]">
              <WifiOff v-if="isOffline" :size="11" class="text-[var(--warning)]" aria-hidden="true" />
              <Bot v-else :size="11" class="text-[var(--accent)]" aria-hidden="true" />
              <span>
                {{
                  isOffline
                    ? (isTl ? "Offline · On-device AI" : "Offline · On-device mode")
                    : lastMode === "ai"
                      ? (isTl ? "Smart Coach · Live ledger" : "Smart Coach · Live ledger")
                      : (isTl ? "On-device Coach · Live ledger" : "On-device Coach · Live ledger")
                }}
              </span>
            </p>
          </div>
        </div>

        <div class="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            class="tipid-compact inline-flex min-h-[38px] items-center gap-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-inset)]/60 px-2.5 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-inset)] hover:text-[var(--text-primary)]"
            :title="isTl ? 'Linisin ang usapan' : 'Clear chat'"
            @click="clearChat"
          >
            <Trash2 :size="13" aria-hidden="true" />
            <span>{{ isTl ? "Clear" : "Clear" }}</span>
          </button>
          <button
            type="button"
            class="tipid-compact tipid-compact-touch inline-flex h-10 w-10 items-center justify-center rounded-xl text-[var(--text-secondary)] hover:bg-[var(--bg-inset)] hover:text-[var(--text-primary)]"
            :aria-label="isTl ? 'Isara ang assistant' : 'Close assistant'"
            @click="dialogRef?.close()"
          >
            <X :size="18" aria-hidden="true" />
          </button>
        </div>
      </header>

      <!-- Live Spending Behavior Risk Strip (always computed deterministically) -->
      <section
        v-if="activeWarnings.length > 0"
        aria-label="Spending warnings"
        class="shrink-0 border-b border-[var(--border-subtle)] bg-[var(--bg-inset)]/45 px-4 py-2.5 sm:px-5"
      >
        <div
          :class="[
            'flex items-start justify-between gap-2.5 rounded-xl border px-3 py-2 text-xs',
            warningCardClass(activeWarnings[0].severity)
          ]"
        >
          <div class="flex min-w-0 items-start gap-2">
            <ShieldAlert v-if="activeWarnings[0].severity === 'critical'" :size="15" class="mt-0.5 shrink-0" aria-hidden="true" />
            <AlertTriangle v-else :size="15" class="mt-0.5 shrink-0" aria-hidden="true" />
            <div class="min-w-0">
              <p class="font-bold leading-snug">
                {{ activeWarnings[0].title }}
                <span v-if="activeWarnings.length > 1" class="ml-1 font-semibold opacity-80">
                  (+{{ activeWarnings.length - 1 }})
                </span>
              </p>
              <p class="mt-0.5 text-[11px] leading-relaxed text-[var(--text-secondary)]">
                {{ activeWarnings[0].detail }}
              </p>
            </div>
          </div>
          <button
            type="button"
            class="tipid-compact shrink-0 rounded-lg bg-[var(--bg-surface)] px-2.5 py-1 text-[11px] font-semibold text-[var(--text-primary)] shadow-xs hover:bg-[var(--bg-inset)]"
            @click="submitPrompt(isTl ? 'Suriin ang spending warnings at Luho ko' : 'Explain my spending warnings and how to fix them')"
          >
            {{ isTl ? "Suriin" : "Review" }}
          </button>
        </div>
      </section>

      <!-- Scrollable Conversation Feed -->
      <div
        ref="scrollBodyRef"
        class="flex-1 space-y-3 overflow-y-auto px-4 py-4 sm:px-5"
      >
        <article
          v-for="msg in messages"
          :key="msg.id"
          :class="[
            'flex flex-col gap-2',
            msg.role === 'user' ? 'items-end' : 'items-start'
          ]"
        >
          <div
            :class="[
              'max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-line',
              msg.role === 'user'
                ? 'rounded-br-md bg-[var(--accent)] text-white shadow-xs'
                : 'rounded-bl-md border border-[var(--border-subtle)] bg-[var(--bg-inset)]/70 text-[var(--text-primary)]'
            ]"
          >
            {{ msg.text }}
          </div>

          <!-- Inline Spending Warning Callout -->
          <div
            v-if="msg.warning && msg.warning.level !== 'none'"
            :class="[
              'flex w-full max-w-[94%] items-start gap-2 rounded-xl border px-3 py-2.5 text-xs',
              warningCardClass(msg.warning.level)
            ]"
          >
            <AlertTriangle :size="15" class="mt-0.5 shrink-0" aria-hidden="true" />
            <div class="min-w-0">
              <p class="font-bold">{{ msg.warning.title }}</p>
              <p class="mt-0.5 text-[11px] leading-relaxed text-[var(--text-secondary)]">
                {{ msg.warning.detail }}
              </p>
            </div>
          </div>

          <!-- Interactive Chat-to-Log Confirmation Cards -->
          <div
            v-for="draft in msg.drafts"
            :key="draft.id"
            class="w-full max-w-[96%] rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-surface)] p-3.5 shadow-xs"
          >
            <div class="flex items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-2">
              <span
                :class="[
                  'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold',
                  draft.type === 'income'
                    ? 'bg-[var(--income-soft)] text-[var(--income)]'
                    : 'bg-[var(--expense-soft)] text-[var(--expense)]'
                ]"
              >
                {{
                  draft.status === "saved"
                    ? (isTl ? "Naka-save sa ledger" : "Saved to ledger")
                    : draft.type === "income"
                      ? (isTl ? "Draft · Kita" : "Draft · Income")
                      : (isTl ? "Draft · Gastos" : "Draft · Expense")
                }}
              </span>
              <span class="font-mono text-sm font-bold tabular-nums text-[var(--text-primary)]">
                ₱{{ formatPeso(Number(draft.amount) || 0) }}
              </span>
            </div>

            <div v-if="draft.status === 'saved'" class="mt-2.5 flex items-center gap-2 text-xs font-semibold text-[var(--income)]">
              <CheckCircle2 :size="15" aria-hidden="true" />
              <span>{{ draft.desc }} · {{ resolveWalletVisual(draft.method).displayName }}</span>
            </div>

            <div v-else-if="draft.status === 'dismissed'" class="mt-2 text-xs text-[var(--text-muted)]">
              {{ isTl ? "Kinansela ang draft na ito." : "Draft dismissed." }}
            </div>

            <div v-else class="mt-3 space-y-2.5">
              <div class="grid grid-cols-2 gap-2">
                <select
                  v-model="draft.type"
                  aria-label="Draft transaction type"
                  class="tipid-input min-h-[40px] py-1.5 text-base sm:text-xs"
                  @change="draft.category = draft.type === 'income' ? 'Kita' : (draft.category === 'Kita' ? CATEGORIES[0] : draft.category); draft.error = undefined"
                >
                  <option value="expense">{{ isTl ? "Gastos (Expense)" : "Expense" }}</option>
                  <option value="income">{{ isTl ? "Kita (Income)" : "Income" }}</option>
                </select>
                <input
                  v-model.number="draft.amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  inputmode="decimal"
                  aria-label="Draft amount"
                  class="tipid-input min-h-[40px] py-1.5 font-mono text-base font-semibold sm:text-xs"
                  @input="draft.error = undefined"
                />
              </div>

              <input
                v-model="draft.desc"
                type="text"
                maxlength="120"
                aria-label="Draft description"
                class="tipid-input min-h-[40px] py-1.5 text-base sm:text-xs"
                @input="draft.error = undefined"
              />

              <div class="grid grid-cols-2 gap-2">
                <select
                  v-if="draft.type === 'expense'"
                  v-model="draft.category"
                  aria-label="Draft category"
                  class="tipid-input min-h-[40px] py-1.5 text-base sm:text-xs"
                >
                  <option v-for="c in CATEGORIES" :key="c" :value="c">{{ c }}</option>
                </select>

                <select
                  v-model="draft.method"
                  :class="[
                    'tipid-input min-h-[40px] py-1.5 text-base sm:text-xs',
                    draft.type === 'income' ? 'col-span-2' : ''
                  ]"
                  aria-label="Draft wallet"
                  @change="draft.error = undefined"
                >
                  <option v-for="w in effectiveSnapshot.wallets" :key="w" :value="w">
                    {{ resolveWalletVisual(w).displayName }} (₱{{ formatPeso(effectiveSnapshot.walletBalances[w] ?? 0) }})
                  </option>
                </select>
              </div>

              <div v-if="draft.type === 'expense'" class="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  :class="[
                    'tipid-compact min-h-[38px] rounded-xl border text-xs font-semibold transition-colors',
                    draft.spendType === 'need'
                      ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]'
                      : 'border-[var(--border-subtle)] text-[var(--text-secondary)]'
                  ]"
                  @click="draft.spendType = 'need'"
                >
                  {{ isTl ? "Need (Kailangan)" : "Need" }}
                </button>
                <button
                  type="button"
                  :class="[
                    'tipid-compact min-h-[38px] rounded-xl border text-xs font-semibold transition-colors',
                    draft.spendType === 'luho'
                      ? 'border-[var(--expense)] bg-[var(--expense-soft)] text-[var(--expense)]'
                      : 'border-[var(--border-subtle)] text-[var(--text-secondary)]'
                  ]"
                  @click="draft.spendType = 'luho'"
                >
                  {{ isTl ? "Luho (Want)" : "Want / Luho" }}
                </button>
              </div>

              <p
                v-if="draft.error"
                role="alert"
                class="rounded-lg bg-[var(--expense-soft)] px-2.5 py-1.5 text-xs font-medium text-[var(--expense)]"
              >
                {{ draft.error }}
              </p>

              <div class="flex items-center justify-end gap-2 pt-0.5">
                <button
                  type="button"
                  class="tipid-compact min-h-[40px] rounded-xl px-3 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-inset)]"
                  @click="dismissDraft(draft)"
                >
                  {{ isTl ? "Balewala" : "Dismiss" }}
                </button>
                <button
                  type="button"
                  :disabled="draft.status === 'saving'"
                  class="tipid-compact inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-[var(--accent)] px-3.5 text-xs font-semibold text-white hover:bg-[var(--accent-hover)] disabled:opacity-60"
                  @click="confirmDraft(draft)"
                >
                  <Loader2 v-if="draft.status === 'saving'" :size="13" class="animate-spin" aria-hidden="true" />
                  <span>{{ isTl ? "Confirm & Save" : "Confirm & Save" }}</span>
                </button>
              </div>
            </div>
          </div>
        </article>

        <div v-if="sending" class="flex items-center gap-2 text-xs text-[var(--text-muted)]">
          <Loader2 :size="14" class="animate-spin text-[var(--accent)]" aria-hidden="true" />
          <span>{{ isTl ? "Sinusuri ng Tipid Coach..." : "Tipid Coach is thinking..." }}</span>
        </div>
      </div>

      <!-- Quick Prompt Chips + Input Composer -->
      <footer
        class="shrink-0 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 pt-2.5 sm:px-5"
        style="padding-bottom: max(0.875rem, var(--safe-bottom))"
      >
        <div class="mb-2.5 flex gap-1.5 overflow-x-auto pb-0.5">
          <button
            v-for="chip in quickPrompts"
            :key="chip.label"
            type="button"
            class="tipid-compact shrink-0 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-inset)]/75 px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
            @click="submitPrompt(chip.prompt)"
          >
            {{ chip.label }}
          </button>
        </div>

        <form class="flex items-center gap-2" @submit.prevent="submitPrompt()">
          <label for="tipid-assistant-input" class="visually-hidden">
            {{ isTl ? "Mensahing pantanong o utos kay Tipid Coach" : "Message Tipid Coach" }}
          </label>
          <input
            id="tipid-assistant-input"
            ref="inputRef"
            v-model="draftText"
            type="text"
            maxlength="600"
            :disabled="sending"
            :placeholder="isTl ? 'Magtanong o mag-utos (hal. Log 150 kape sa Cash)...' : 'Ask or command (e.g. Log 150 coffee via Cash)...'"
            class="tipid-input min-w-0 flex-1 text-base sm:text-sm"
          />
          <button
            type="submit"
            :disabled="sending || !draftText.trim()"
            class="tipid-compact inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)] text-white shadow-xs transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-50"
            :aria-label="isTl ? 'Ipadala' : 'Send message'"
          >
            <Send :size="16" aria-hidden="true" />
          </button>
        </form>
      </footer>
    </div>
  </dialog>
</template>
