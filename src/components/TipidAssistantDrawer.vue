<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from "vue";
import {
  X,
  Send,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Trash2,
  Loader2,
  WifiOff,
  ArrowRight,
  Wallet,
  Sparkles,
  Volume2,
  VolumeX
} from "@lucide/vue";
import {
  CATEGORIES,
  formatPeso,
  manilaDateKey,
  money,
  storageKey
} from "@/lib/core";
import {
  addBill,
  addExpense,
  addIncome,
  addSavingsGoal,
  addTransfer,
  addUtang,
  depositToSavingsGoal,
  markBillPaidAndScheduleNext,
  saveCategoryBudget,
  setBudget,
  setBudgetCycle,
  settleUtang
} from "@/lib/data";
import { notifyWriteResult } from "@/lib/offlineSync";
import { resolveWalletVisual } from "@/lib/walletVisuals";
import { useFinanceData, useSharedFinanceSnapshot } from "@/composables/useFinanceData";
import { useI18n } from "@/lib/i18n";
import { useWelcomeTour } from "@/composables/useWelcomeTour";
import { useCoachVoice } from "@/composables/useCoachVoice";
import { pushToast } from "@/composables/useToast";
import {
  analyzeSpendingBehavior,
  evaluateActionBehaviorWarning,
  type AssistantBehaviorAlert,
  type AssistantLedgerSnapshot,
  type ProposedChatAction
} from "@/lib/assistantEngine";
import { sendAssistantMessage, type ChatHistoryTurn } from "@/lib/assistantClient";
import TipidCoachAvatar, { type CoachAvatarMood } from "./TipidCoachAvatar.vue";
import type { BillRecurrence, SavingsGoalColor } from "@/types/finance";

interface EditableDraft {
  id: string;
  status: "pending" | "saving" | "saved" | "dismissed";
  error?: string;
  action: ProposedChatAction;
}

interface ChatMessageItem {
  id: string;
  role: "user" | "assistant";
  text: string;
  mode?: "ai" | "local";
  warning?: AssistantBehaviorAlert | null;
  drafts: EditableDraft[];
}

const BILL_CATEGORY_OPTIONS = [
  "Bills",
  "Bills & Utilities",
  "Housing",
  "Mobile & Data",
  "Healthcare",
  "Other"
] as const;

const GOAL_COLORS: ReadonlyArray<{ value: SavingsGoalColor; label: string; dot: string }> = [
  { value: "emerald", label: "Emerald", dot: "bg-emerald-500" },
  { value: "blue", label: "Blue", dot: "bg-blue-500" },
  { value: "amber", label: "Amber", dot: "bg-amber-500" },
  { value: "violet", label: "Violet", dot: "bg-violet-500" },
  { value: "rose", label: "Rose", dot: "bg-rose-500" }
];

const RECURRENCE_OPTIONS: ReadonlyArray<{ value: BillRecurrence; label: string }> = [
  { value: "none", label: "One-time" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" }
];

const props = defineProps<{
  open: boolean;
  uid: string;
  isOffline: boolean;
}>();

const emit = defineEmits<{
  (e: "close"): void;
}>();

const { lang, isTl } = useI18n();
const { openTour } = useWelcomeTour();
const {
  isSupported: isVoiceSupported,
  isSpeaking: isVoiceSpeaking,
  speak,
  stop: stopVoice,
  isSpeakingMessage
} = useCoachVoice();
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

const unpaidBillsList = computed(() =>
  effectiveSnapshot.value.bills.filter((b) => b.status !== "Paid")
);

const openUtangList = computed(() =>
  effectiveSnapshot.value.utangList.filter((u) => u.status !== "Paid")
);

const dialogRef = ref<HTMLDialogElement | null>(null);
const scrollBodyRef = ref<HTMLElement | null>(null);
const inputRef = ref<HTMLTextAreaElement | null>(null);
const draftText = ref("");
const sending = ref(false);
const isSpeaking = ref(false);
const isCelebrating = ref(false);
const messages = ref<ChatMessageItem[]>([]);
const lastMode = ref<"ai" | "local">(props.isOffline ? "local" : "ai");

let seq = 0;
let pressedOutside = false;
let speakingTimer: ReturnType<typeof setTimeout> | null = null;
let celebratingTimer: ReturnType<typeof setTimeout> | null = null;

const latestAssistantMessageId = computed(() => {
  for (let i = messages.value.length - 1; i >= 0; i -= 1) {
    if (messages.value[i].role === "assistant") {
      return messages.value[i].id;
    }
  }
  return "";
});

const isAvatarSpeaking = computed(() => isSpeaking.value || isVoiceSpeaking.value);

const coachMood = computed<CoachAvatarMood>(() => {
  if (sending.value) return "thinking";
  if (isCelebrating.value) return "happy";
  if (isAvatarSpeaking.value) return "speaking";
  if (activeWarnings.value.length > 0) return "caution";
  return "idle";
});

const coachStatusLabel = computed(() => {
  if (sending.value) {
    return isTl.value ? "Nag-iisip sa ledger mo..." : "Thinking through your ledger...";
  }
  if (isCelebrating.value) {
    return isTl.value ? "Naitala sa ledger" : "Saved to ledger";
  }
  if (isVoiceSpeaking.value) {
    return isTl.value ? "Nagsasalita..." : "Speaking narration...";
  }
  if (isSpeaking.value) {
    return isTl.value ? "Sumasagot..." : "Replying...";
  }
  if (props.isOffline) {
    return isTl.value ? "Offline · On-device Coach" : "Offline · On-device Coach";
  }
  return lastMode.value === "ai"
    ? isTl.value
      ? "Smart Coach · Live ledger"
      : "Smart Coach · Live ledger"
    : isTl.value
      ? "On-device Coach · Live ledger"
      : "On-device Coach · Live ledger";
});

function clearAvatarTimers(): void {
  if (speakingTimer) {
    clearTimeout(speakingTimer);
    speakingTimer = null;
  }
  if (celebratingTimer) {
    clearTimeout(celebratingTimer);
    celebratingTimer = null;
  }
  isSpeaking.value = false;
  isCelebrating.value = false;
}

function triggerSpeakingAnimation(replyLength: number): void {
  if (speakingTimer) clearTimeout(speakingTimer);
  isSpeaking.value = true;
  const durationMs = Math.min(4200, Math.max(2000, replyLength * 18));
  speakingTimer = setTimeout(() => {
    isSpeaking.value = false;
    speakingTimer = null;
  }, durationMs);
}

function triggerCelebratingAnimation(): void {
  if (celebratingTimer) clearTimeout(celebratingTimer);
  isCelebrating.value = true;
  celebratingTimer = setTimeout(() => {
    isCelebrating.value = false;
    celebratingTimer = null;
  }, 2100);
}

function nextId(prefix: string): string {
  seq += 1;
  return `${prefix}-${Date.now()}-${seq}`;
}

function buildGreetingMessage(): ChatMessageItem {
  const topWarning = activeWarnings.value[0];
  const greeting = isTl.value
    ? "Kumusta! Ako si Tipid Coach. Kausapin mo lang ako na parang kaibigan sa budget — puwede kang magtanong ng 'Kaya ba bumili ng 1,500?', magpa-split ng sahod, mag-paste ng GCash/bank SMS, mag-transfer o mag-update ng bills, utang, at savings jars."
    : "Hey there! I'm Tipid Coach. Chat with me naturally — ask 'Can I afford ₱1,500?', split a payday, paste a GCash or bank SMS/receipt, transfer wallets, manage bills and utang, or ask who built Tipid.";

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
  stopVoice();
  clearAvatarTimers();
  if (dialogRef.value) {
    dialogRef.value.returnValue = "";
  }
  emit("close");
}

function toggleSpeakAssistantMessage(id: string, text: string): void {
  if (isSpeakingMessage(id)) {
    stopVoice();
  } else {
    speak(text, { messageId: id, force: true });
  }
}

function handleOpenTour(): void {
  dialogRef.value?.close();
  openTour();
}

function resizeComposer(): void {
  const el = inputRef.value;
  if (!el) return;
  el.style.height = "auto";
  const nextHeight = Math.min(112, Math.max(44, el.scrollHeight));
  el.style.height = `${nextHeight}px`;
}

watch(
  () => props.open,
  async (isOpen) => {
    const el = dialogRef.value;
    if (isOpen) {
      if (messages.value.length === 0) {
        messages.value = [buildGreetingMessage()];
        triggerSpeakingAnimation(160);
      }
      if (el && !el.open) {
        el.showModal();
      }
      await nextTick();
      resizeComposer();
      scrollToBottom();
      inputRef.value?.focus();
    } else {
      clearAvatarTimers();
      if (el && el.open) {
        el.close();
      }
    }
  }
);

watch(
  () => props.uid,
  () => {
    clearAvatarTimers();
    messages.value = [];
    draftText.value = "";
  }
);

onMounted(() => {
  const el = dialogRef.value;
  if (el && props.open && !el.open) {
    if (messages.value.length === 0) {
      messages.value = [buildGreetingMessage()];
      triggerSpeakingAnimation(160);
    }
    el.showModal();
  }
});

onUnmounted(() => {
  clearAvatarTimers();
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
        { label: "Tour & Guide", prompt: "Paano gamitin ang Tipid app at ano ang mga benefits nito?" },
        { label: "Check spending", prompt: "Kumusta gastos ko ngayon? Nag-o-overspend ba ako?" },
        { label: "Kaya ba ₱1,500?", prompt: "Kaya ba ng budget ko kung gumastos ako ng 1500?" },
        { label: "Split ₱15k sahod", prompt: "Paano ko hahatiin ang 15000 sahod ko?" },
        { label: "50/30/20 audit", prompt: "I-check ang 50/30/20 breakdown ng gastos ko" },
        { label: "Bills & utang", prompt: "Ano ang unpaid bills at utang ko?" },
        { label: "Sino gumawa?", prompt: "Sino ang developer ng Tipid app?" },
        { label: "Capabilities", prompt: "Ano ang mga kaya mong gawin?" }
      ]
    : [
        { label: "Tour & Guide", prompt: "How do I use Tipid and what are its key benefits?" },
        { label: "Check spending", prompt: "Am I overspending? Check my spending habits." },
        { label: "Afford ₱1,500?", prompt: "Can I afford a ₱1,500 purchase right now?" },
        { label: "Split ₱15k payday", prompt: "Split my 15000 payday based on my bills and jars" },
        { label: "50/30/20 audit", prompt: "Run a 50/30/20 spending audit for this cycle" },
        { label: "Bills & utang", prompt: "Summarize my unpaid bills and utang." },
        { label: "Who built Tipid?", prompt: "Tell me about Renniel Salazar, the developer of Tipid." },
        { label: "What can you do?", prompt: "What can you help me do inside Tipid?" }
      ]
);

function handleComposerKeydown(e: KeyboardEvent): void {
  if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
    e.preventDefault();
    void submitPrompt();
  }
}

async function submitPrompt(overrideText?: string): Promise<void> {
  const raw = (overrideText ?? draftText.value).trim();
  if (!raw || sending.value) return;

  if (!overrideText) {
    draftText.value = "";
    await nextTick();
    resizeComposer();
  }

  const userMsg: ChatMessageItem = {
    id: nextId("user"),
    role: "user",
    text: raw,
    drafts: []
  };
  const historyForRequest: ChatHistoryTurn[] = messages.value.slice(-10).map((m) => ({
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
      drafts: res.proposedActions.map((action) => ({
        id: nextId("draft"),
        status: "pending",
        action
      }))
    });
    triggerSpeakingAnimation(res.reply.length);
  } finally {
    sending.value = false;
    await nextTick();
    scrollToBottom();
  }
}

function clearChat(): void {
  clearAvatarTimers();
  messages.value = [buildGreetingMessage()];
  triggerSpeakingAnimation(140);
}

function dismissDraft(draft: EditableDraft): void {
  draft.status = "dismissed";
  draft.error = undefined;
}

function onSelectBillToPay(draft: EditableDraft, billId: string): void {
  if (draft.action.type !== "mark_bill_paid") return;
  const match = unpaidBillsList.value.find((b) => b.id === billId);
  if (!match) return;
  draft.action.billId = match.id;
  draft.action.title = match.title;
  draft.action.amount = match.amount;
  draft.action.dueDate = match.dueDate || manilaDateKey(new Date()) || "2026-01-01";
  draft.action.recurrence = match.recurrence || "none";
  draft.action.category = match.category || "Bills";
  draft.error = undefined;
}

function onSelectUtangToSettle(draft: EditableDraft, utangId: string): void {
  if (draft.action.type !== "settle_utang") return;
  const match = openUtangList.value.find((u) => u.id === utangId);
  if (!match) return;
  draft.action.utangId = match.id;
  draft.action.name = match.name;
  draft.action.amount = match.amount;
  draft.action.direction = match.direction;
  draft.error = undefined;
}

function onSelectGoalToDeposit(draft: EditableDraft, goalId: string): void {
  if (draft.action.type !== "savings_deposit") return;
  const match = effectiveSnapshot.value.savingsGoals.find((g) => g.id === goalId);
  if (!match) return;
  draft.action.goalId = match.id;
  draft.action.goalName = match.name;
  draft.error = undefined;
}

function draftBadgeLabel(draft: EditableDraft): string {
  const t = draft.action.type;
  if (draft.status === "saved") {
    return isTl.value ? "Naka-save" : "Saved";
  }
  switch (t) {
    case "income":
      return isTl.value ? "Draft · Kita" : "Draft · Income";
    case "expense":
      return isTl.value ? "Draft · Gastos" : "Draft · Expense";
    case "transfer":
      return "Draft · Transfer";
    case "bill":
      return isTl.value ? "Draft · Bagong Bill" : "Draft · New Bill";
    case "mark_bill_paid":
      return isTl.value ? "Confirm · Bayad Bill" : "Confirm · Pay Bill";
    case "utang":
      return "Draft · Utang";
    case "settle_utang":
      return isTl.value ? "Confirm · Bayad Utang" : "Confirm · Settle Utang";
    case "savings_goal":
      return isTl.value ? "Draft · Savings Jar" : "Draft · Savings Jar";
    case "savings_deposit":
      return isTl.value ? "Confirm · Hulog sa Jar" : "Confirm · Jar Deposit";
    case "set_budget":
      return isTl.value ? "Confirm · Budget Plan" : "Confirm · Budget Plan";
    case "category_budget":
      return isTl.value ? "Confirm · Category Cap" : "Confirm · Category Cap";
  }
}

function draftBadgeTone(draft: EditableDraft): string {
  const t = draft.action.type;
  if (draft.status === "saved") {
    return "bg-[var(--income-soft)] text-[var(--income)]";
  }
  if (t === "income" || t === "savings_goal" || t === "savings_deposit") {
    return "bg-[var(--income-soft)] text-[var(--income)]";
  }
  if (t === "expense") {
    return "bg-[var(--expense-soft)] text-[var(--expense)]";
  }
  return "bg-[var(--accent-soft)] text-[var(--accent)]";
}

function draftHeaderAmount(action: ProposedChatAction): string {
  switch (action.type) {
    case "expense":
    case "income":
    case "transfer":
    case "bill":
    case "mark_bill_paid":
    case "utang":
    case "settle_utang":
    case "savings_deposit":
    case "set_budget":
      return `₱${formatPeso(Number(action.amount) || 0)}`;
    case "savings_goal":
      return `₱${formatPeso(Number(action.targetAmount) || 0)}`;
    case "category_budget":
      return `₱${formatPeso(Number(action.limitAmount) || 0)}`;
  }
}

function draftSavedSummary(action: ProposedChatAction): string {
  switch (action.type) {
    case "expense":
    case "income":
      return `${action.desc} · ${resolveWalletVisual(action.method).displayName}`;
    case "transfer":
      return `${resolveWalletVisual(action.fromMethod).displayName} -> ${resolveWalletVisual(action.toMethod).displayName} · ₱${formatPeso(action.amount)}`;
    case "bill":
      return `${action.title} · due ${action.dueDate}`;
    case "mark_bill_paid":
      return `${action.title} marked Paid`;
    case "utang":
      return `${action.name} · ₱${formatPeso(action.amount)}`;
    case "settle_utang":
      return `${action.name} settled`;
    case "savings_goal":
      return `${action.name} (target ₱${formatPeso(action.targetAmount)})`;
    case "savings_deposit":
      return `${action.goalName} (+₱${formatPeso(action.amount)})`;
    case "set_budget":
      return `Cycle budget: ₱${formatPeso(action.amount)}${action.budgetCycle ? ` (${action.budgetCycle})` : ""}`;
    case "category_budget":
      return `${action.category} limit: ₱${formatPeso(action.limitAmount)}`;
  }
}

async function confirmDraft(draft: EditableDraft): Promise<void> {
  if (!props.uid || draft.status === "saving" || draft.status === "saved") return;
  draft.error = undefined;

  const wallets = effectiveSnapshot.value.wallets;
  const fallbackWallet = wallets[0] || "Cash";
  const action = draft.action;

  try {
    if (action.type === "income" || action.type === "expense") {
      let safeAmount: number;
      try {
        safeAmount = money(action.amount);
      } catch {
        draft.error = isTl.value ? "Maglagay ng wastong halaga." : "Enter a valid positive amount.";
        return;
      }
      const cleanDesc = action.desc.trim();
      if (!cleanDesc) {
        draft.error = isTl.value ? "Maglagay ng paglalarawan." : "Enter a description.";
        return;
      }
      const method = wallets.includes(action.method) ? action.method : fallbackWallet;
      const walletBal = effectiveSnapshot.value.walletBalances[method] ?? 0;

      if (action.type === "expense" && safeAmount > walletBal) {
        draft.error = isTl.value
          ? `Kulang ang balanse sa ${resolveWalletVisual(method).displayName} (₱${formatPeso(walletBal)} lang).`
          : `Insufficient balance in ${resolveWalletVisual(method).displayName} (₱${formatPeso(walletBal)} available).`;
        return;
      }

      draft.status = "saving";
      if (action.type === "income") {
        const res = await addIncome(props.uid, { desc: cleanDesc, amount: safeAmount, method });
        notifyWriteResult(
          pushToast,
          res,
          isTl.value ? "Naitala ang kita." : "Income recorded.",
          isTl.value ? "Naka-save offline — isi-sync online." : "Saved offline — syncs when online."
        );
      } else {
        const safeCat = CATEGORIES.includes(action.category) ? action.category : "Other";
        const safeSpend = action.spendType === "luho" ? "luho" : "need";
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
      triggerCelebratingAnimation();

      const postWarning = evaluateActionBehaviorWarning(
        { ...action, amount: safeAmount, desc: cleanDesc, method },
        effectiveSnapshot.value,
        lang.value,
        false
      );
      if (postWarning && postWarning.level !== "none") {
        messages.value.push({
          id: nextId("warn"),
          role: "assistant",
          text: isTl.value
            ? `Na-save na ang "${cleanDesc}" (₱${formatPeso(safeAmount)}). Paalala lang sa budget:`
            : `Saved "${cleanDesc}" (₱${formatPeso(safeAmount)}). Quick heads-up:`,
          mode: "local",
          warning: postWarning,
          drafts: []
        });
        await nextTick();
        scrollToBottom();
      }
      return;
    }

    if (action.type === "transfer") {
      let safeAmount: number;
      try {
        safeAmount = money(action.amount);
      } catch {
        draft.error = isTl.value ? "Maglagay ng wastong halaga." : "Enter a valid positive amount.";
        return;
      }
      const fromMethod = wallets.includes(action.fromMethod) ? action.fromMethod : fallbackWallet;
      const toMethod = wallets.includes(action.toMethod) ? action.toMethod : fallbackWallet;
      if (fromMethod === toMethod) {
        draft.error = isTl.value
          ? "Dapat magkaiba ang pinanggalingan at pupuntahang wallet."
          : "Source and destination wallets must be different.";
        return;
      }
      const srcBal = effectiveSnapshot.value.walletBalances[fromMethod] ?? 0;
      if (safeAmount > srcBal) {
        draft.error = isTl.value
          ? `Kulang ang balanse sa ${resolveWalletVisual(fromMethod).displayName} (₱${formatPeso(srcBal)} lang).`
          : `Insufficient balance in ${resolveWalletVisual(fromMethod).displayName} (₱${formatPeso(srcBal)} available).`;
        return;
      }
      draft.status = "saving";
      const res = await addTransfer(props.uid, {
        desc: action.desc.trim() || `${fromMethod} -> ${toMethod}`,
        amount: safeAmount,
        fromMethod,
        toMethod,
        note: action.note
      });
      notifyWriteResult(
        pushToast,
        res,
        isTl.value ? "Nailipat na ang balanse." : "Transfer recorded.",
        isTl.value ? "Naka-save offline — isi-sync online." : "Saved offline — syncs when online."
      );
      draft.status = "saved";
      triggerCelebratingAnimation();
      return;
    }

    if (action.type === "bill") {
      let safeAmount: number;
      try {
        safeAmount = money(action.amount);
      } catch {
        draft.error = isTl.value ? "Maglagay ng wastong halaga." : "Enter a valid positive amount.";
        return;
      }
      const title = action.title.trim();
      if (!title) {
        draft.error = isTl.value ? "Maglagay ng pangalan ng bill." : "Enter a bill title.";
        return;
      }
      draft.status = "saving";
      const res = await addBill(props.uid, {
        title,
        amount: safeAmount,
        dueDate: action.dueDate || manilaDateKey(new Date()) || "2026-01-01",
        category: action.category || "Bills",
        recurrence: action.recurrence || "none",
        notes: action.notes
      });
      notifyWriteResult(
        pushToast,
        res,
        isTl.value ? "Nadagdag ang bill." : "Bill reminder added.",
        isTl.value ? "Naka-save offline — isi-sync online." : "Saved offline — syncs when online."
      );
      draft.status = "saved";
      triggerCelebratingAnimation();
      return;
    }

    if (action.type === "mark_bill_paid") {
      const target = unpaidBillsList.value.find((b) => b.id === action.billId);
      if (!target) {
        draft.error = isTl.value
          ? "Hindi na mahanap ang unpaid bill na ito."
          : "This unpaid bill is no longer open.";
        return;
      }
      draft.status = "saving";
      const { result, nextDueDate } = await markBillPaidAndScheduleNext(props.uid, target);
      notifyWriteResult(
        pushToast,
        result,
        nextDueDate
          ? isTl.value
            ? `Nabayaran ang bill; naka-iskedyul ang susunod sa ${nextDueDate}.`
            : `Bill marked Paid; next due ${nextDueDate}.`
          : isTl.value
            ? "Nabayaran ang bill."
            : "Bill marked Paid.",
        isTl.value ? "Naka-save offline — isi-sync online." : "Saved offline — syncs when online."
      );
      draft.status = "saved";
      triggerCelebratingAnimation();
      return;
    }

    if (action.type === "utang") {
      let safeAmount: number;
      try {
        safeAmount = money(action.amount);
      } catch {
        draft.error = isTl.value ? "Maglagay ng wastong halaga." : "Enter a valid positive amount.";
        return;
      }
      const name = action.name.trim();
      if (!name) {
        draft.error = isTl.value ? "Ilagay ang pangalan ng tao o entity." : "Enter the contact name.";
        return;
      }
      draft.status = "saving";
      const res = await addUtang(props.uid, {
        name,
        amount: safeAmount,
        direction: action.direction === "i_owe" ? "i_owe" : "owed_to_me",
        dueDate: action.dueDate || null,
        notes: action.notes
      });
      notifyWriteResult(
        pushToast,
        res,
        isTl.value ? "Naitala ang utang." : "Utang recorded.",
        isTl.value ? "Naka-save offline — isi-sync online." : "Saved offline — syncs when online."
      );
      draft.status = "saved";
      triggerCelebratingAnimation();
      return;
    }

    if (action.type === "settle_utang") {
      const target = openUtangList.value.find((u) => u.id === action.utangId);
      if (!target) {
        draft.error = isTl.value
          ? "Hindi na mahanap ang open utang record."
          : "This utang record is no longer open.";
        return;
      }
      draft.status = "saving";
      const res = await settleUtang(props.uid, target.id);
      notifyWriteResult(
        pushToast,
        res,
        isTl.value ? "Na-markahan nang bayad ang utang." : "Utang settled.",
        isTl.value ? "Naka-save offline — isi-sync online." : "Saved offline — syncs when online."
      );
      draft.status = "saved";
      triggerCelebratingAnimation();
      return;
    }

    if (action.type === "savings_goal") {
      let safeTarget: number;
      let safeSaved: number;
      try {
        safeTarget = money(action.targetAmount);
        safeSaved = money(action.savedAmount || 0, { allowZero: true });
      } catch {
        draft.error = isTl.value ? "Maglagay ng wastong target amount." : "Enter a valid target amount.";
        return;
      }
      const name = action.name.trim();
      if (!name) {
        draft.error = isTl.value ? "Maglagay ng pangalan ng savings jar." : "Enter a jar name.";
        return;
      }
      draft.status = "saving";
      const res = await addSavingsGoal(props.uid, {
        name,
        targetAmount: safeTarget,
        savedAmount: safeSaved,
        wallet: action.wallet && wallets.includes(action.wallet) ? action.wallet : null,
        targetDate: action.targetDate || null,
        color: action.color || "emerald"
      });
      notifyWriteResult(
        pushToast,
        res,
        isTl.value ? "Nagawa ang savings jar." : "Savings jar created.",
        isTl.value ? "Naka-save offline — isi-sync online." : "Saved offline — syncs when online."
      );
      draft.status = "saved";
      triggerCelebratingAnimation();
      return;
    }

    if (action.type === "savings_deposit") {
      const targetGoal = effectiveSnapshot.value.savingsGoals.find((g) => g.id === action.goalId);
      if (!targetGoal) {
        draft.error = isTl.value
          ? "Hindi mahanap ang savings jar na ito."
          : "Savings jar could not be found.";
        return;
      }
      let safeAmount: number;
      try {
        safeAmount = money(action.amount);
      } catch {
        draft.error = isTl.value ? "Maglagay ng wastong deposit amount." : "Enter a valid positive amount.";
        return;
      }
      const deductWallet =
        action.deductFromWallet && wallets.includes(action.deductFromWallet)
          ? action.deductFromWallet
          : null;
      if (deductWallet) {
        const bal = effectiveSnapshot.value.walletBalances[deductWallet] ?? 0;
        if (safeAmount > bal) {
          draft.error = isTl.value
            ? `Kulang ang balanse sa ${resolveWalletVisual(deductWallet).displayName} (₱${formatPeso(bal)} lang).`
            : `Insufficient balance in ${resolveWalletVisual(deductWallet).displayName} (₱${formatPeso(bal)} available).`;
          return;
        }
      }
      draft.status = "saving";
      const res = await depositToSavingsGoal(props.uid, targetGoal, safeAmount, {
        deductFromWallet: deductWallet
      });
      notifyWriteResult(
        pushToast,
        res,
        isTl.value ? `Nahulugan ang ${targetGoal.name}.` : `Deposited into ${targetGoal.name}.`,
        isTl.value ? "Naka-save offline — isi-sync online." : "Saved offline — syncs when online."
      );
      draft.status = "saved";
      triggerCelebratingAnimation();
      return;
    }

    if (action.type === "set_budget") {
      let safeBudget: number;
      try {
        safeBudget = money(action.amount, { allowZero: true });
      } catch {
        draft.error = isTl.value ? "Hindi wastong budget amount." : "Enter a valid budget amount.";
        return;
      }
      draft.status = "saving";
      const res = await setBudget(props.uid, safeBudget);
      if (action.budgetCycle) {
        await setBudgetCycle(props.uid, action.budgetCycle);
      }
      notifyWriteResult(
        pushToast,
        res,
        isTl.value ? "Na-update ang budget plan." : "Budget plan updated.",
        isTl.value ? "Naka-save offline — isi-sync online." : "Saved offline — syncs when online."
      );
      draft.status = "saved";
      triggerCelebratingAnimation();
      return;
    }

    if (action.type === "category_budget") {
      let safeLimit: number;
      try {
        safeLimit = money(action.limitAmount);
      } catch {
        draft.error = isTl.value ? "Maglagay ng wastong limit." : "Enter a valid positive limit.";
        return;
      }
      const safeCat = CATEGORIES.includes(action.category) ? action.category : "Other";
      const existing = effectiveSnapshot.value.categoryBudgets.find((b) => b.category === safeCat);
      draft.status = "saving";
      const res = await saveCategoryBudget(props.uid, {
        id: existing?.id || action.budgetId,
        category: safeCat,
        limitAmount: safeLimit
      });
      notifyWriteResult(
        pushToast,
        res,
        isTl.value ? `Na-save ang ${safeCat} cap.` : `${safeCat} budget cap saved.`,
        isTl.value ? "Naka-save offline — isi-sync online." : "Saved offline — syncs when online."
      );
      draft.status = "saved";
      triggerCelebratingAnimation();
    }
  } catch {
    draft.status = "pending";
    draft.error = isTl.value
      ? "Hindi nai-save ang pagbabago. Subukan ulit."
      : "Could not save update. Please try again.";
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
      <!-- Modern Coach Hero Header -->
      <header
        class="relative shrink-0 border-b border-[var(--border-subtle)] bg-gradient-to-b from-[var(--accent-soft)]/55 to-[var(--bg-surface)] px-4 py-3.5 sm:px-5"
        style="padding-top: max(0.95rem, var(--safe-top))"
      >
        <div class="flex items-center justify-between gap-3">
          <div class="flex min-w-0 items-center gap-3">
            <TipidCoachAvatar :mood="coachMood" :is-speaking="isAvatarSpeaking" size="md" />
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <h2
                  id="tipid-assistant-title"
                  class="truncate text-[15px] font-bold tracking-tight text-[var(--text-primary)]"
                >
                  Tipid Coach
                </h2>
                <span
                  v-if="lastMode === 'ai' && !isOffline"
                  class="inline-flex items-center rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-[10px] font-bold tracking-wide text-[var(--accent)]"
                >
                  AI
                </span>
              </div>
              <p class="mt-0.5 flex items-center gap-1.5 text-[11.5px] font-medium text-[var(--text-secondary)]">
                <WifiOff v-if="isOffline" :size="11" class="text-[var(--warning)]" aria-hidden="true" />
                <span
                  v-else
                  :class="[
                    'inline-block h-2 w-2 rounded-full',
                    coachMood === 'caution'
                      ? 'bg-[var(--warning)]'
                      : coachMood === 'thinking'
                        ? 'animate-pulse bg-[var(--accent)]'
                        : 'bg-[var(--income)]'
                  ]"
                  aria-hidden="true"
                />
                <span class="truncate">{{ coachStatusLabel }}</span>
              </p>
            </div>
          </div>

          <div class="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              class="tipid-compact inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/85 px-2.5 text-xs font-medium text-[var(--text-secondary)] shadow-2xs transition-colors hover:bg-[var(--bg-inset)] hover:text-[var(--text-primary)]"
              :title="isTl ? 'Buksan ang Welcome Tour & Gabay' : 'Open Welcome Tour & Guide'"
              @click="handleOpenTour"
            >
              <Sparkles :size="13" class="text-[var(--accent)]" aria-hidden="true" />
              <span>{{ isTl ? "Gabay" : "Tour" }}</span>
            </button>
            <button
              type="button"
              class="tipid-compact inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/85 px-2.5 text-xs font-medium text-[var(--text-secondary)] shadow-2xs transition-colors hover:bg-[var(--bg-inset)] hover:text-[var(--text-primary)]"
              :title="isTl ? 'Linisin ang usapan' : 'Clear chat'"
              @click="clearChat"
            >
              <Trash2 :size="13" aria-hidden="true" />
              <span>Clear</span>
            </button>
            <button
              type="button"
              class="tipid-compact tipid-compact-touch inline-flex h-10 w-10 items-center justify-center rounded-xl text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-inset)] hover:text-[var(--text-primary)]"
              :aria-label="isTl ? 'Isara ang assistant' : 'Close assistant'"
              @click="dialogRef?.close()"
            >
              <X :size="18" aria-hidden="true" />
            </button>
          </div>
        </div>

        <!-- Compact Ledger Pulse + Alert Trigger -->
        <div class="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px]">
          <div class="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)]/90 px-2.5 py-1 font-medium text-[var(--text-secondary)] shadow-2xs">
            <Wallet :size="12" class="text-[var(--accent)]" aria-hidden="true" />
            <span class="font-mono font-semibold tabular-nums text-[var(--text-primary)]">
              ₱{{ formatPeso(effectiveSnapshot.overallBalance) }}
            </span>
            <span v-if="effectiveSnapshot.budget" class="text-[var(--text-muted)]">
              · {{ effectiveSnapshot.budgetCycle === "kinsenas" ? "Kinsenas" : "Monthly" }}
            </span>
          </div>

          <button
            v-if="activeWarnings.length > 0"
            type="button"
            :class="[
              'tipid-compact inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-semibold transition-opacity hover:opacity-90',
              warningCardClass(activeWarnings[0].severity)
            ]"
            @click="submitPrompt(isTl ? 'Suriin ang spending warnings at Luho ko' : 'Explain my spending warnings and how to fix them')"
          >
            <ShieldAlert
              v-if="activeWarnings[0].severity === 'critical'"
              :size="12"
              aria-hidden="true"
            />
            <AlertTriangle v-else :size="12" aria-hidden="true" />
            <span class="max-w-[11rem] truncate">{{ activeWarnings[0].title }}</span>
            <span v-if="activeWarnings.length > 1" class="opacity-80">
              +{{ activeWarnings.length - 1 }}
            </span>
          </button>
        </div>
      </header>

      <!-- Scrollable Conversation Feed -->
      <div
        ref="scrollBodyRef"
        class="tipid-chat-scroll flex-1 space-y-3.5 overflow-y-auto px-4 py-4 sm:px-5"
      >
        <article
          v-for="msg in messages"
          :key="msg.id"
          :class="[
            'tipid-chat-msg flex flex-col gap-2',
            msg.role === 'user' ? 'items-end' : 'items-start'
          ]"
        >
          <!-- Assistant Bubble with Expressive Mini Avatar -->
          <div
            v-if="msg.role === 'assistant'"
            class="flex max-w-[94%] items-start gap-2.5"
          >
            <TipidCoachAvatar
              :mood="
                msg.id === latestAssistantMessageId
                  ? (sending ? 'idle' : coachMood)
                  : (msg.warning && msg.warning.level !== 'none' ? 'caution' : 'idle')
              "
              :is-speaking="isSpeakingMessage(msg.id)"
              size="xs"
              class="mt-0.5"
            />
            <div class="flex min-w-0 flex-col gap-1">
              <div class="rounded-2xl rounded-tl-md border border-[var(--border-subtle)] bg-[var(--bg-inset)]/65 px-3.5 py-2.5 text-[13.5px] leading-relaxed text-[var(--text-primary)] whitespace-pre-line shadow-2xs">
                {{ msg.text }}
              </div>
              <div v-if="isVoiceSupported" class="flex items-center gap-1.5 pl-1">
                <button
                  type="button"
                  class="tipid-compact inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-inset)] hover:text-[var(--text-primary)]"
                  :aria-label="isSpeakingMessage(msg.id) ? 'Stop voice' : 'Listen with English voice'"
                  :title="isSpeakingMessage(msg.id) ? 'Stop speaking' : 'Listen with English voice'"
                  @click="toggleSpeakAssistantMessage(msg.id, msg.text)"
                >
                  <VolumeX v-if="isSpeakingMessage(msg.id)" :size="12" class="text-[var(--accent)]" aria-hidden="true" />
                  <Volume2 v-else :size="12" aria-hidden="true" />
                  <span :class="isSpeakingMessage(msg.id) ? 'font-semibold text-[var(--accent)]' : ''">
                    {{ isSpeakingMessage(msg.id) ? "Stop voice" : "Listen" }}
                  </span>
                </button>
              </div>
            </div>
          </div>

          <!-- User Bubble -->
          <div
            v-else
            class="max-w-[85%] rounded-2xl rounded-br-md bg-[var(--accent)] px-3.5 py-2.5 text-[13.5px] leading-relaxed text-white whitespace-pre-line shadow-xs"
          >
            {{ msg.text }}
          </div>

          <!-- Inline Spending Warning Callout -->
          <div
            v-if="msg.warning && msg.warning.level !== 'none'"
            :class="[
              'flex w-full max-w-[94%] items-start gap-2 rounded-xl border px-3 py-2.5 text-xs sm:ml-9 sm:max-w-[calc(94%-2.25rem)]',
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

          <!-- Interactive Action Review Cards -->
          <div
            v-for="draft in msg.drafts"
            :key="draft.id"
            class="w-full max-w-[96%] rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-surface)] p-3.5 shadow-xs sm:ml-9 sm:max-w-[calc(96%-2.25rem)]"
          >
            <div class="flex items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-2">
              <span
                :class="[
                  'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold',
                  draftBadgeTone(draft)
                ]"
              >
                {{ draftBadgeLabel(draft) }}
              </span>
              <span class="font-mono text-sm font-bold tabular-nums text-[var(--text-primary)]">
                {{ draftHeaderAmount(draft.action) }}
              </span>
            </div>

            <div v-if="draft.status === 'saved'" class="mt-2.5 flex items-center gap-2 text-xs font-semibold text-[var(--income)]">
              <CheckCircle2 :size="15" class="shrink-0" aria-hidden="true" />
              <span>{{ draftSavedSummary(draft.action) }}</span>
            </div>

            <div v-else-if="draft.status === 'dismissed'" class="mt-2 text-xs text-[var(--text-muted)]">
              {{ isTl ? "Kinansela ang draft na ito." : "Draft dismissed." }}
            </div>

            <!-- Editable Form Controls per Action Type -->
            <div v-else class="mt-3 space-y-2.5">
              <!-- Expense / Income -->
              <template v-if="draft.action.type === 'expense' || draft.action.type === 'income'">
                <div class="grid grid-cols-2 gap-2">
                  <select
                    v-model="draft.action.type"
                    aria-label="Draft transaction type"
                    class="tipid-input min-h-[40px] py-1.5 text-base sm:text-xs"
                    @change="
                      draft.action.category =
                        draft.action.type === 'income'
                          ? 'Kita'
                          : draft.action.category === 'Kita'
                            ? CATEGORIES[0]
                            : draft.action.category;
                      draft.error = undefined;
                    "
                  >
                    <option value="expense">{{ isTl ? "Gastos (Expense)" : "Expense" }}</option>
                    <option value="income">{{ isTl ? "Kita (Income)" : "Income" }}</option>
                  </select>
                  <input
                    v-model.number="draft.action.amount"
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
                  v-model="draft.action.desc"
                  type="text"
                  maxlength="120"
                  aria-label="Draft description"
                  class="tipid-input min-h-[40px] py-1.5 text-base sm:text-xs"
                  @input="draft.error = undefined"
                />

                <div class="grid grid-cols-2 gap-2">
                  <select
                    v-if="draft.action.type === 'expense'"
                    v-model="draft.action.category"
                    aria-label="Draft category"
                    class="tipid-input min-h-[40px] py-1.5 text-base sm:text-xs"
                  >
                    <option v-for="c in CATEGORIES" :key="c" :value="c">{{ c }}</option>
                  </select>

                  <select
                    v-model="draft.action.method"
                    :class="[
                      'tipid-input min-h-[40px] py-1.5 text-base sm:text-xs',
                      draft.action.type === 'income' ? 'col-span-2' : ''
                    ]"
                    aria-label="Draft wallet"
                    @change="draft.error = undefined"
                  >
                    <option v-for="w in effectiveSnapshot.wallets" :key="w" :value="w">
                      {{ resolveWalletVisual(w).displayName }} (₱{{ formatPeso(effectiveSnapshot.walletBalances[w] ?? 0) }})
                    </option>
                  </select>
                </div>

                <div v-if="draft.action.type === 'expense'" class="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    :class="[
                      'tipid-compact min-h-[38px] rounded-xl border text-xs font-semibold transition-colors',
                      draft.action.spendType === 'need'
                        ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]'
                        : 'border-[var(--border-subtle)] text-[var(--text-secondary)]'
                    ]"
                    @click="draft.action.spendType = 'need'"
                  >
                    {{ isTl ? "Need (Kailangan)" : "Need" }}
                  </button>
                  <button
                    type="button"
                    :class="[
                      'tipid-compact min-h-[38px] rounded-xl border text-xs font-semibold transition-colors',
                      draft.action.spendType === 'luho'
                        ? 'border-[var(--expense)] bg-[var(--expense-soft)] text-[var(--expense)]'
                        : 'border-[var(--border-subtle)] text-[var(--text-secondary)]'
                    ]"
                    @click="draft.action.spendType = 'luho'"
                  >
                    {{ isTl ? "Luho (Want)" : "Want / Luho" }}
                  </button>
                </div>
              </template>

              <!-- Transfer -->
              <template v-else-if="draft.action.type === 'transfer'">
                <div class="grid grid-cols-2 gap-2">
                  <select
                    v-model="draft.action.fromMethod"
                    aria-label="Source wallet"
                    class="tipid-input min-h-[40px] py-1.5 text-base sm:text-xs"
                    @change="draft.error = undefined"
                  >
                    <option v-for="w in effectiveSnapshot.wallets" :key="w" :value="w">
                      {{ resolveWalletVisual(w).displayName }} (₱{{ formatPeso(effectiveSnapshot.walletBalances[w] ?? 0) }})
                    </option>
                  </select>
                  <select
                    v-model="draft.action.toMethod"
                    aria-label="Destination wallet"
                    class="tipid-input min-h-[40px] py-1.5 text-base sm:text-xs"
                    @change="draft.error = undefined"
                  >
                    <option v-for="w in effectiveSnapshot.wallets" :key="w" :value="w">
                      -> {{ resolveWalletVisual(w).displayName }}
                    </option>
                  </select>
                </div>
                <div class="grid grid-cols-2 gap-2">
                  <input
                    v-model.number="draft.action.amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    inputmode="decimal"
                    aria-label="Transfer amount"
                    class="tipid-input min-h-[40px] py-1.5 font-mono text-base font-semibold sm:text-xs"
                    @input="draft.error = undefined"
                  />
                  <input
                    v-model="draft.action.desc"
                    type="text"
                    maxlength="120"
                    aria-label="Transfer note"
                    class="tipid-input min-h-[40px] py-1.5 text-base sm:text-xs"
                  />
                </div>
              </template>

              <!-- Add Bill -->
              <template v-else-if="draft.action.type === 'bill'">
                <input
                  v-model="draft.action.title"
                  type="text"
                  maxlength="120"
                  aria-label="Bill title"
                  class="tipid-input min-h-[40px] py-1.5 text-base sm:text-xs"
                  @input="draft.error = undefined"
                />
                <div class="grid grid-cols-2 gap-2">
                  <input
                    v-model.number="draft.action.amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    inputmode="decimal"
                    aria-label="Bill amount"
                    class="tipid-input min-h-[40px] py-1.5 font-mono text-base font-semibold sm:text-xs"
                    @input="draft.error = undefined"
                  />
                  <input
                    v-model="draft.action.dueDate"
                    type="date"
                    aria-label="Bill due date"
                    class="tipid-input min-h-[40px] py-1.5 text-base sm:text-xs"
                  />
                </div>
                <div class="grid grid-cols-2 gap-2">
                  <select
                    v-model="draft.action.category"
                    aria-label="Bill category"
                    class="tipid-input min-h-[40px] py-1.5 text-base sm:text-xs"
                  >
                    <option v-for="c in BILL_CATEGORY_OPTIONS" :key="c" :value="c">{{ c }}</option>
                  </select>
                  <select
                    v-model="draft.action.recurrence"
                    aria-label="Bill recurrence"
                    class="tipid-input min-h-[40px] py-1.5 text-base sm:text-xs"
                  >
                    <option v-for="r in RECURRENCE_OPTIONS" :key="r.value" :value="r.value">
                      {{ r.label }}
                    </option>
                  </select>
                </div>
              </template>

              <!-- Mark Bill Paid -->
              <template v-else-if="draft.action.type === 'mark_bill_paid'">
                <select
                  :value="draft.action.billId"
                  aria-label="Select unpaid bill"
                  class="tipid-input min-h-[40px] py-1.5 text-base sm:text-xs"
                  @change="onSelectBillToPay(draft, ($event.target as HTMLSelectElement).value)"
                >
                  <option v-for="b in unpaidBillsList" :key="b.id" :value="b.id">
                    {{ b.title }} · ₱{{ formatPeso(b.amount) }} (due {{ b.dueDate }})
                  </option>
                </select>
                <p class="text-[11px] text-[var(--text-muted)]">
                  {{
                    draft.action.recurrence !== "none"
                      ? (isTl
                          ? `Mamarkahang Paid at awtomatikong gagawin ang susunod na ${draft.action.recurrence} schedule.`
                          : `Will mark Paid and auto-schedule the next ${draft.action.recurrence} cycle.`)
                      : (isTl ? "Mamarkahang Paid sa Bills ledger." : "Will mark this bill as Paid.")
                  }}
                </p>
              </template>

              <!-- Add Utang -->
              <template v-else-if="draft.action.type === 'utang'">
                <div class="grid grid-cols-2 gap-2">
                  <input
                    v-model="draft.action.name"
                    type="text"
                    maxlength="120"
                    aria-label="Contact name"
                    class="tipid-input min-h-[40px] py-1.5 text-base sm:text-xs"
                    @input="draft.error = undefined"
                  />
                  <input
                    v-model.number="draft.action.amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    inputmode="decimal"
                    aria-label="Utang amount"
                    class="tipid-input min-h-[40px] py-1.5 font-mono text-base font-semibold sm:text-xs"
                    @input="draft.error = undefined"
                  />
                </div>
                <div class="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    :class="[
                      'tipid-compact min-h-[38px] rounded-xl border text-xs font-semibold transition-colors',
                      draft.action.direction === 'owed_to_me'
                        ? 'border-[var(--income)] bg-[var(--income-soft)] text-[var(--income)]'
                        : 'border-[var(--border-subtle)] text-[var(--text-secondary)]'
                    ]"
                    @click="draft.action.direction = 'owed_to_me'"
                  >
                    {{ isTl ? "May utang sa akin" : "Owed to me" }}
                  </button>
                  <button
                    type="button"
                    :class="[
                      'tipid-compact min-h-[38px] rounded-xl border text-xs font-semibold transition-colors',
                      draft.action.direction === 'i_owe'
                        ? 'border-[var(--expense)] bg-[var(--expense-soft)] text-[var(--expense)]'
                        : 'border-[var(--border-subtle)] text-[var(--text-secondary)]'
                    ]"
                    @click="draft.action.direction = 'i_owe'"
                  >
                    {{ isTl ? "Utang ko" : "I owe" }}
                  </button>
                </div>
              </template>

              <!-- Settle Utang -->
              <template v-else-if="draft.action.type === 'settle_utang'">
                <select
                  :value="draft.action.utangId"
                  aria-label="Select utang to settle"
                  class="tipid-input min-h-[40px] py-1.5 text-base sm:text-xs"
                  @change="onSelectUtangToSettle(draft, ($event.target as HTMLSelectElement).value)"
                >
                  <option v-for="u in openUtangList" :key="u.id" :value="u.id">
                    {{ u.name }} · ₱{{ formatPeso(u.amount) }} ({{ u.direction === "i_owe" ? "I owe" : "Owed to me" }})
                  </option>
                </select>
              </template>

              <!-- New Savings Jar -->
              <template v-else-if="draft.action.type === 'savings_goal'">
                <input
                  v-model="draft.action.name"
                  type="text"
                  maxlength="80"
                  aria-label="Savings jar name"
                  class="tipid-input min-h-[40px] py-1.5 text-base sm:text-xs"
                  @input="draft.error = undefined"
                />
                <div class="grid grid-cols-2 gap-2">
                  <input
                    v-model.number="draft.action.targetAmount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    inputmode="decimal"
                    aria-label="Target amount"
                    class="tipid-input min-h-[40px] py-1.5 font-mono text-base font-semibold sm:text-xs"
                    @input="draft.error = undefined"
                  />
                  <input
                    v-model="draft.action.targetDate"
                    type="date"
                    aria-label="Target date"
                    class="tipid-input min-h-[40px] py-1.5 text-base sm:text-xs"
                  />
                </div>
                <div class="flex items-center justify-between gap-2">
                  <span class="text-[11px] font-medium text-[var(--text-secondary)]">
                    {{ isTl ? "Kulay ng jar" : "Jar accent" }}
                  </span>
                  <div class="flex items-center gap-1.5">
                    <button
                      v-for="c in GOAL_COLORS"
                      :key="c.value"
                      type="button"
                      :aria-label="c.label"
                      :class="[
                        'h-6 w-6 rounded-full border-2 transition-transform',
                        c.dot,
                        draft.action.color === c.value
                          ? 'scale-110 border-[var(--text-primary)]'
                          : 'border-transparent opacity-70'
                      ]"
                      @click="draft.action.color = c.value"
                    />
                  </div>
                </div>
              </template>

              <!-- Deposit to Savings Jar -->
              <template v-else-if="draft.action.type === 'savings_deposit'">
                <select
                  :value="draft.action.goalId"
                  aria-label="Select savings jar"
                  class="tipid-input min-h-[40px] py-1.5 text-base sm:text-xs"
                  @change="onSelectGoalToDeposit(draft, ($event.target as HTMLSelectElement).value)"
                >
                  <option v-for="g in effectiveSnapshot.savingsGoals" :key="g.id" :value="g.id">
                    {{ g.name }} (₱{{ formatPeso(g.savedAmount) }} / ₱{{ formatPeso(g.targetAmount) }})
                  </option>
                </select>
                <div class="grid grid-cols-2 gap-2">
                  <input
                    v-model.number="draft.action.amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    inputmode="decimal"
                    aria-label="Deposit amount"
                    class="tipid-input min-h-[40px] py-1.5 font-mono text-base font-semibold sm:text-xs"
                    @input="draft.error = undefined"
                  />
                  <select
                    v-model="draft.action.deductFromWallet"
                    aria-label="Deduct from wallet"
                    class="tipid-input min-h-[40px] py-1.5 text-base sm:text-xs"
                    @change="draft.error = undefined"
                  >
                    <option :value="undefined">
                      {{ isTl ? "Walang bawas sa wallet" : "No wallet deduct" }}
                    </option>
                    <option v-for="w in effectiveSnapshot.wallets" :key="w" :value="w">
                      From {{ resolveWalletVisual(w).displayName }} (₱{{ formatPeso(effectiveSnapshot.walletBalances[w] ?? 0) }})
                    </option>
                  </select>
                </div>
              </template>

              <!-- Cycle Budget Plan -->
              <template v-else-if="draft.action.type === 'set_budget'">
                <div class="grid grid-cols-2 gap-2">
                  <input
                    v-model.number="draft.action.amount"
                    type="number"
                    step="1"
                    min="0"
                    inputmode="decimal"
                    aria-label="Cycle budget cap"
                    class="tipid-input min-h-[40px] py-1.5 font-mono text-base font-semibold sm:text-xs"
                    @input="draft.error = undefined"
                  />
                  <select
                    v-model="draft.action.budgetCycle"
                    aria-label="Budget cycle"
                    class="tipid-input min-h-[40px] py-1.5 text-base sm:text-xs"
                  >
                    <option :value="undefined">
                      {{ isTl ? "Keep current cycle" : "Keep current cycle" }}
                    </option>
                    <option value="monthly">Monthly</option>
                    <option value="kinsenas">Kinsenas (1st–15th / 16th–End)</option>
                  </select>
                </div>
              </template>

              <!-- Category Budget Cap -->
              <template v-else-if="draft.action.type === 'category_budget'">
                <div class="grid grid-cols-2 gap-2">
                  <select
                    v-model="draft.action.category"
                    aria-label="Category budget name"
                    class="tipid-input min-h-[40px] py-1.5 text-base sm:text-xs"
                  >
                    <option v-for="c in CATEGORIES" :key="c" :value="c">{{ c }}</option>
                  </select>
                  <input
                    v-model.number="draft.action.limitAmount"
                    type="number"
                    step="1"
                    min="1"
                    inputmode="decimal"
                    aria-label="Category limit amount"
                    class="tipid-input min-h-[40px] py-1.5 font-mono text-base font-semibold sm:text-xs"
                    @input="draft.error = undefined"
                  />
                </div>
              </template>

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
                  <ArrowRight v-else :size="13" aria-hidden="true" />
                  <span>{{ isTl ? "Confirm & Save" : "Confirm & Save" }}</span>
                </button>
              </div>
            </div>
          </div>
        </article>

        <!-- Thinking Indicator with Live Avatar -->
        <div v-if="sending" class="tipid-chat-msg flex items-start gap-2.5">
          <TipidCoachAvatar mood="thinking" size="xs" class="mt-0.5" />
          <div class="inline-flex items-center gap-2 rounded-2xl rounded-tl-md border border-[var(--border-subtle)] bg-[var(--bg-inset)]/60 px-3.5 py-2.5 text-xs font-medium text-[var(--text-secondary)]">
            <Loader2 :size="13" class="animate-spin text-[var(--accent)]" aria-hidden="true" />
            <span>{{ isTl ? "Binabasa ko ang ledger at iniisip..." : "Reviewing your numbers..." }}</span>
          </div>
        </div>
      </div>

      <!-- Quick Prompt Chips + Auto-Resizing Composer -->
      <footer
        class="shrink-0 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 pt-2.5 sm:px-5"
        style="padding-bottom: max(0.875rem, var(--safe-bottom))"
      >
        <div class="tipid-chip-rail mb-2.5 flex gap-1.5 overflow-x-auto pr-4">
          <button
            v-for="chip in quickPrompts"
            :key="chip.label"
            type="button"
            class="tipid-compact shrink-0 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-inset)]/75 px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
            @click="submitPrompt(chip.prompt)"
          >
            {{ chip.label }}
          </button>
        </div>

        <form class="flex items-end gap-2" @submit.prevent="submitPrompt()">
          <label for="tipid-assistant-input" class="visually-hidden">
            {{ isTl ? "Mensahing pantanong o utos kay Tipid Coach" : "Message Tipid Coach" }}
          </label>
          <textarea
            id="tipid-assistant-input"
            ref="inputRef"
            v-model="draftText"
            rows="1"
            maxlength="1200"
            :disabled="sending"
            :placeholder="isTl ? 'Magtanong, mag-paste ng SMS/resibo, o mag-utos...' : 'Ask anything, paste SMS/receipt, or log an update...'"
            class="tipid-input min-h-[44px] min-w-0 flex-1 resize-none py-2.5 text-base leading-snug sm:text-sm"
            @input="resizeComposer"
            @keydown="handleComposerKeydown"
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
