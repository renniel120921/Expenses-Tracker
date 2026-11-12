<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { ArrowLeftRight, Loader2, Sparkles } from "@lucide/vue";
import BaseDialog from "./BaseDialog.vue";
import { CATEGORIES, formatPeso, money, storageKey } from "@/lib/core";
import { resolveWalletVisual } from "@/lib/walletVisuals";
import { addExpense, addIncome, addTransfer } from "@/lib/data";
import { notifyWriteResult } from "@/lib/offlineSync";
import { parseTransactionSms } from "@/lib/smsParser";
import { pushToast } from "@/composables/useToast";
import { useI18n } from "@/lib/i18n";
import type { EntryType, SpendType } from "@/types/finance";

const props = withDefaults(
  defineProps<{
    open: boolean;
    uid: string;
    wallets: string[];
    walletBalances: Record<string, number>;
    defaultType?: EntryType;
  }>(),
  {
    defaultType: "expense"
  }
);

const emit = defineEmits<{
  (e: "close"): void;
}>();

const { isTl } = useI18n();

const type = ref<EntryType>(props.defaultType);
const amount = ref("");
const desc = ref("");
const category = ref<string>(CATEGORIES[0]);
const method = ref<string>(props.wallets[0] || "Cash");
const toMethod = ref<string>(props.wallets[1] || props.wallets[0] || "Cash");
const spendType = ref<SpendType>("need");
const saving = ref(false);
const showSms = ref(false);
const smsText = ref("");
const error = ref("");
const amountInputRef = ref<HTMLInputElement | null>(null);
const descInputRef = ref<HTMLInputElement | null>(null);
const toWalletSelectRef = ref<HTMLSelectElement | null>(null);
const walletTouched = ref(false);

function resolveOtherWallet(primary: string): string {
  return props.wallets.find((w) => w !== primary) || primary || "Cash";
}

function syncDefaultWallets() {
  const preferred = resolvePreferredWallet();
  method.value = preferred;
  toMethod.value = resolveOtherWallet(preferred);
}

function markWalletTouched() {
  walletTouched.value = true;
  error.value = "";
}

function swapTransferWallets() {
  walletTouched.value = true;
  const from = method.value;
  method.value = toMethod.value;
  toMethod.value = from;
  error.value = "";
}

function resolvePreferredWallet(): string {
  const list = props.wallets;
  if (!list.length) return "Cash";
  try {
    const saved = localStorage.getItem(storageKey(props.uid, "default_wallet"));
    if (saved) {
      const exact = list.find((w) => w.toLowerCase() === saved.toLowerCase());
      if (exact) return exact;
      const savedId = resolveWalletVisual(saved).id.toLowerCase();
      const visualMatch = list.find((w) => resolveWalletVisual(w).id.toLowerCase() === savedId);
      if (visualMatch) return visualMatch;
    }
  } catch {
    // ignore storage read failure
  }
  return list[0] || "Cash";
}

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      type.value = props.defaultType;
      amount.value = "";
      desc.value = "";
      category.value = CATEGORIES[0];
      walletTouched.value = false;
      syncDefaultWallets();
      spendType.value = "need";
      showSms.value = false;
      smsText.value = "";
      error.value = "";
    }
  },
  { immediate: true }
);

watch(
  () => props.wallets,
  () => {
    if (props.open && !walletTouched.value) {
      syncDefaultWallets();
    }
  }
);

watch([type, method], ([nextType, nextMethod]) => {
  if (nextType === "transfer" && toMethod.value === nextMethod && props.wallets.length > 1) {
    toMethod.value = resolveOtherWallet(nextMethod);
  }
});

const parsedAmount = computed(() => {
  const n = Number(amount.value);
  return Number.isFinite(n) && n > 0 ? n : 0;
});

const currentWalletBalance = computed(() => props.walletBalances[method.value] ?? 0);
const insufficient = computed(() => {
  return (
    (type.value === "expense" || type.value === "transfer") &&
    parsedAmount.value > 0 &&
    parsedAmount.value > currentWalletBalance.value
  );
});

function applySmsParse() {
  const parsed = parseTransactionSms(smsText.value, props.wallets);
  if (!parsed) {
    error.value = isTl.value
      ? "Walang nakitang valid na halaga mula sa SMS."
      : "No valid amount detected in the SMS message.";
    return;
  }
  type.value = parsed.type;
  amount.value = parsed.amount;
  desc.value = parsed.desc;
  method.value = parsed.method;
  if (parsed.type === "expense") {
    category.value = parsed.category;
  }
  showSms.value = false;
  error.value = "";
}

async function handleSubmit() {
  error.value = "";
  let safeAmount: number;
  try {
    safeAmount = money(amount.value);
  } catch {
    error.value = isTl.value ? "Maglagay ng wastong halaga." : "Enter a valid positive amount.";
    amountInputRef.value?.focus();
    return;
  }

  if (type.value !== "transfer" && !desc.value.trim()) {
    error.value = isTl.value ? "Maglagay ng paglalarawan." : "Enter a description.";
    descInputRef.value?.focus();
    return;
  }

  if (type.value === "transfer") {
    if (props.wallets.length < 2) {
      error.value = isTl.value
        ? "Magdagdag muna ng pangalawang wallet para makapag-transfer."
        : "Add a second wallet first to transfer funds.";
      toWalletSelectRef.value?.focus();
      return;
    }
    if (!toMethod.value || toMethod.value === method.value) {
      error.value = isTl.value
        ? "Pumili ng ibang paglilipatang wallet."
        : "Choose a different destination wallet.";
      toWalletSelectRef.value?.focus();
      return;
    }
  }

  if ((type.value === "expense" || type.value === "transfer") && safeAmount > currentWalletBalance.value) {
    error.value = isTl.value
      ? `Kulang ang balanse sa ${resolveWalletVisual(method.value).displayName} (₱${formatPeso(currentWalletBalance.value)} lang).`
      : `Insufficient balance in ${resolveWalletVisual(method.value).displayName} (₱${formatPeso(currentWalletBalance.value)} available).`;
    amountInputRef.value?.focus();
    return;
  }

  saving.value = true;
  try {
    if (type.value === "transfer") {
      const fromLabel = resolveWalletVisual(method.value).displayName;
      const toLabel = resolveWalletVisual(toMethod.value).displayName;
      const cleanDesc = desc.value.trim() || `Transfer: ${fromLabel} -> ${toLabel}`;
      const res = await addTransfer(props.uid, {
        desc: cleanDesc,
        amount: safeAmount,
        fromMethod: method.value,
        toMethod: toMethod.value
      });
      notifyWriteResult(
        pushToast,
        res,
        isTl.value ? "Nailipat ang pondo." : "Transfer recorded.",
        isTl.value ? "Naka-save ang transfer offline — isi-sync online." : "Transfer saved offline — syncs when online."
      );
    } else if (type.value === "income") {
      const res = await addIncome(props.uid, { desc: desc.value.trim(), amount: safeAmount, method: method.value });
      notifyWriteResult(
        pushToast,
        res,
        isTl.value ? "Naitala ang kita." : "Income recorded.",
        isTl.value ? "Naka-save ang kita offline — isi-sync online." : "Income saved offline — syncs when online."
      );
    } else {
      const res = await addExpense(props.uid, {
        desc: desc.value.trim(),
        amount: safeAmount,
        category: category.value,
        method: method.value,
        spendType: spendType.value
      });
      notifyWriteResult(
        pushToast,
        res,
        isTl.value ? "Naitala ang gastos." : "Expense recorded.",
        isTl.value ? "Naka-save ang gastos offline — isi-sync online." : "Expense saved offline — syncs when online."
      );
    }
    emit("close");
  } catch {
    error.value = isTl.value
      ? "Hindi nai-save ang transaksyon. Subukan ulit."
      : "Could not save transaction. Please try again.";
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <BaseDialog
    :open="open"
    :title="isTl ? 'Bagong Transaksyon' : 'New Transaction'"
    :subtitle="isTl ? 'Itala ang gastos, kita, o lipat-pondo sa wallet.' : 'Record an expense, income, or wallet transfer.'"
    @close="emit('close')"
  >
    <form class="space-y-4" @submit.prevent="handleSubmit">
      <!-- Type Radio Group -->
      <fieldset class="grid grid-cols-3 gap-1.5 rounded-xl bg-[var(--bg-inset)] p-1">
        <legend class="visually-hidden">{{ isTl ? "Uri ng transaksyon" : "Transaction type" }}</legend>
        <label
          :class="[
            'flex cursor-pointer items-center justify-center rounded-lg py-2 text-xs font-semibold transition-colors',
            type === 'expense' ? 'bg-[var(--bg-surface)] text-[var(--expense)] shadow-xs' : 'text-[var(--text-secondary)]'
          ]"
        >
          <input v-model="type" type="radio" name="tx-type" value="expense" class="visually-hidden" @change="error = ''" />
          {{ isTl ? "Gastos" : "Expense" }}
        </label>
        <label
          :class="[
            'flex cursor-pointer items-center justify-center rounded-lg py-2 text-xs font-semibold transition-colors',
            type === 'income' ? 'bg-[var(--bg-surface)] text-[var(--income)] shadow-xs' : 'text-[var(--text-secondary)]'
          ]"
        >
          <input v-model="type" type="radio" name="tx-type" value="income" class="visually-hidden" @change="error = ''" />
          {{ isTl ? "Kita" : "Income" }}
        </label>
        <label
          :class="[
            'flex cursor-pointer items-center justify-center rounded-lg py-2 text-xs font-semibold transition-colors',
            type === 'transfer' ? 'bg-[var(--bg-surface)] text-[var(--accent)] shadow-xs' : 'text-[var(--text-secondary)]'
          ]"
        >
          <input v-model="type" type="radio" name="tx-type" value="transfer" class="visually-hidden" @change="error = ''" />
          {{ isTl ? "Lipat" : "Transfer" }}
        </label>
      </fieldset>

      <!-- Amount -->
      <div>
        <label for="tx-amount" class="mb-1 block text-xs font-medium text-[var(--text-secondary)]">
          {{ isTl ? "Halaga (PHP)" : "Amount (PHP)" }}
        </label>
        <div class="relative">
          <span class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-base font-semibold text-[var(--text-muted)]">
            ₱
          </span>
          <input
            id="tx-amount"
            ref="amountInputRef"
            v-model="amount"
            type="number"
            step="0.01"
            min="0.01"
            inputmode="decimal"
            autofocus
            required
            placeholder="0.00"
            class="tipid-input pl-8 font-mono text-lg font-bold tabular-nums"
            @input="error = ''"
          />
        </div>
        <p v-if="insufficient" class="mt-1 text-xs font-medium text-[var(--expense)]">
          {{ isTl ? `Short ng ₱${formatPeso(parsedAmount - currentWalletBalance)} sa ${resolveWalletVisual(method).displayName}` : `Short by ₱${formatPeso(parsedAmount - currentWalletBalance)} in ${resolveWalletVisual(method).displayName}` }}
        </p>
      </div>

      <!-- Description -->
      <div>
        <label for="tx-desc" class="mb-1 block text-xs font-medium text-[var(--text-secondary)]">
          {{ type === "transfer" ? (isTl ? "Paglalarawan (opsyonal)" : "Note / Description (optional)") : (isTl ? "Paglalarawan" : "Description") }}
        </label>
        <input
          id="tx-desc"
          ref="descInputRef"
          v-model="desc"
          type="text"
          maxlength="120"
          :required="type !== 'transfer'"
          :placeholder="
            type === 'transfer'
              ? (isTl ? 'hal. Cash-in GCash, Savings transfer' : 'e.g., Cash-in GCash, Move to savings')
              : type === 'income'
                ? 'e.g., Monthly salary, Freelance'
                : 'e.g., Grocery, Grab fare, Electric bill'
          "
          class="tipid-input text-base sm:text-sm"
          @input="error = ''"
        />
      </div>

      <!-- Need vs Want (Expenses only) -->
      <fieldset v-if="type === 'expense'" class="space-y-1.5">
        <legend class="text-xs font-medium text-[var(--text-secondary)]">
          {{ isTl ? "Klasipikasyon" : "Spending Classification" }}
        </legend>
        <div class="grid grid-cols-2 gap-2">
          <label
            :class="[
              'flex cursor-pointer items-center justify-center rounded-xl border px-3 py-2.5 text-xs font-semibold transition-colors',
              spendType === 'need'
                ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]'
                : 'border-[var(--border-subtle)] text-[var(--text-secondary)]'
            ]"
          >
            <input v-model="spendType" type="radio" name="spend-type" value="need" class="visually-hidden" />
            {{ isTl ? "Kailangan (Need)" : "Essential (Need)" }}
          </label>
          <label
            :class="[
              'flex cursor-pointer items-center justify-center rounded-xl border px-3 py-2.5 text-xs font-semibold transition-colors',
              spendType === 'luho'
                ? 'border-[var(--expense)] bg-[var(--expense-soft)] text-[var(--expense)]'
                : 'border-[var(--border-subtle)] text-[var(--text-secondary)]'
            ]"
          >
            <input v-model="spendType" type="radio" name="spend-type" value="luho" class="visually-hidden" />
            {{ isTl ? "Luho (Want)" : "Discretionary (Want)" }}
          </label>
        </div>
      </fieldset>

      <!-- Transfer Wallets -->
      <div v-if="type === 'transfer'" class="space-y-2.5">
        <div class="grid grid-cols-1 items-end gap-2.5 sm:grid-cols-[1fr_auto_1fr]">
          <div>
            <label for="tx-from-wallet" class="mb-1 block text-xs font-medium text-[var(--text-secondary)]">
              {{ isTl ? "Mula sa Wallet" : "From Wallet" }}
            </label>
            <select id="tx-from-wallet" v-model="method" class="tipid-input text-base sm:text-sm" @change="markWalletTouched">
              <option v-for="w in wallets" :key="w" :value="w">
                {{ resolveWalletVisual(w).displayName }} (₱{{ formatPeso(walletBalances[w] ?? 0) }})
              </option>
            </select>
          </div>

          <button
            type="button"
            class="tipid-compact inline-flex h-10 w-full items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-inset)] text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] sm:w-10"
            :title="isTl ? 'Pagpalitin ang wallets' : 'Swap wallets'"
            :aria-label="isTl ? 'Pagpalitin ang mula at papuntang wallet' : 'Swap source and destination wallets'"
            @click="swapTransferWallets"
          >
            <ArrowLeftRight :size="15" aria-hidden="true" />
          </button>

          <div>
            <label for="tx-to-wallet" class="mb-1 block text-xs font-medium text-[var(--text-secondary)]">
              {{ isTl ? "Papunta sa Wallet" : "To Wallet" }}
            </label>
            <select
              id="tx-to-wallet"
              ref="toWalletSelectRef"
              v-model="toMethod"
              class="tipid-input text-base sm:text-sm"
              @change="markWalletTouched"
            >
              <option v-for="w in wallets" :key="w" :value="w" :disabled="w === method && wallets.length > 1">
                {{ resolveWalletVisual(w).displayName }} (₱{{ formatPeso(walletBalances[w] ?? 0) }})
              </option>
            </select>
          </div>
        </div>
        <p class="text-[11px] text-[var(--text-muted)]">
          {{ isTl ? "Hindi nakakaapekto ang lipat-pondo sa totals ng gastos o kita." : "Transfers move wallet balances without inflating expenses or income." }}
        </p>
      </div>

      <!-- Category & Wallet (Expense / Income) -->
      <div v-else class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div v-if="type === 'expense'">
          <label for="tx-category" class="mb-1 block text-xs font-medium text-[var(--text-secondary)]">
            {{ isTl ? "Kategorya" : "Category" }}
          </label>
          <select id="tx-category" v-model="category" class="tipid-input text-base sm:text-sm">
            <option v-for="c in CATEGORIES" :key="c" :value="c">{{ c }}</option>
          </select>
        </div>

        <div :class="type === 'income' ? 'sm:col-span-2' : ''">
          <label for="tx-wallet" class="mb-1 block text-xs font-medium text-[var(--text-secondary)]">
            {{ isTl ? "Wallet / Account" : "Account / Wallet" }}
          </label>
          <select id="tx-wallet" v-model="method" class="tipid-input text-base sm:text-sm" @change="markWalletTouched">
            <option v-for="w in wallets" :key="w" :value="w">
              {{ resolveWalletVisual(w).displayName }} (₱{{ formatPeso(walletBalances[w] ?? 0) }})
            </option>
          </select>
        </div>
      </div>

      <!-- Optional SMS Quick Parse -->
      <div class="border-t border-[var(--border-subtle)] pt-3">
        <button
          type="button"
          class="tipid-compact inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--accent)] hover:underline"
          :aria-expanded="showSms"
          @click="showSms = !showSms"
        >
          <Sparkles :size="14" aria-hidden="true" />
          <span>{{ showSms ? (isTl ? "Itago ang SMS Auto-Fill" : "Hide SMS Auto-Fill") : (isTl ? "Gamitin ang Bank / GCash SMS Auto-Fill" : "Auto-fill from Bank / GCash SMS") }}</span>
        </button>

        <div v-if="showSms" class="mt-2.5 space-y-2 rounded-xl bg-[var(--bg-inset)] p-3">
          <label for="sms-paste" class="block text-[11px] font-medium text-[var(--text-secondary)]">
            {{ isTl ? "I-paste ang SMS notification dito:" : "Paste SMS notification text:" }}
          </label>
          <textarea
            id="sms-paste"
            v-model="smsText"
            rows="2"
            maxlength="4000"
            placeholder="e.g., You paid PHP 340.00 to Meralco using GCash..."
            class="tipid-input text-base sm:text-xs"
          />
          <button
            type="button"
            class="tipid-compact rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[var(--accent-hover)]"
            @click="applySmsParse"
          >
            {{ isTl ? "Kunin ang Detalye" : "Extract Fields" }}
          </button>
        </div>
      </div>

      <p v-if="error" role="alert" class="rounded-xl bg-[var(--expense-soft)] px-3 py-2 text-xs font-medium text-[var(--expense)]">
        {{ error }}
      </p>

      <div class="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
        <button
          type="button"
          class="rounded-xl border border-[var(--border-strong)] px-4 py-2.5 text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-inset)]"
          @click="emit('close')"
        >
          {{ isTl ? "Kanselahin" : "Cancel" }}
        </button>
        <button
          type="submit"
          :disabled="saving"
          class="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--accent-hover)]"
        >
          <Loader2 v-if="saving" :size="16" class="animate-spin" aria-hidden="true" />
          <span>{{ saving ? (isTl ? "Sinasave..." : "Saving...") : (type === "transfer" ? (isTl ? "Ilipat ang Pondo" : "Save Transfer") : type === "income" ? (isTl ? "Itala ang Kita" : "Save Income") : (isTl ? "Itala ang Gastos" : "Save Expense")) }}</span>
        </button>
      </div>
    </form>
  </BaseDialog>
</template>
