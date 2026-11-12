import {
  collection,
  addDoc,
  deleteDoc,
  deleteField,
  updateDoc,
  doc,
  setDoc,
  writeBatch,
  increment,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  terminate,
  clearIndexedDbPersistence,
  waitForPendingWrites,
  type Unsubscribe
} from "firebase/firestore";
import { db } from "./firebase";
import {
  clearSnapshotSyncSource,
  executeOfflineAwareWrite,
  updateSnapshotSyncState,
  type OfflineWriteResult
} from "./offlineSync";
import {
  assertSafeObjectKey,
  money,
  cleanText,
  optionalText,
  assertChoice,
  isDateKey,
  manilaDateKey
} from "./core";
import { computeNextBillDueDate } from "./planMath";
import type {
  BillRecurrence,
  BillRecord,
  BudgetCycle,
  CategoryBudgetRecord,
  FinancialGoal,
  LanguageCode,
  NotificationSettings,
  SavingsGoalColor,
  SavingsGoalRecord,
  SpendType,
  TransactionEntry,
  UserDocumentData,
  UserPreferences,
  UtangDirection,
  UtangRecord
} from "@/types/finance";

const BILL_WRITE_STATUSES = ["Unpaid", "Paid"] as const;
const BILL_RECURRENCES: readonly BillRecurrence[] = ["none", "weekly", "monthly", "quarterly", "yearly"];
const BUDGET_CYCLES: readonly BudgetCycle[] = ["monthly", "kinsenas"];
const SAVINGS_GOAL_COLORS: readonly SavingsGoalColor[] = ["emerald", "blue", "amber", "violet", "rose"];

const warnedPermissionSources = new Set<string>();

export function isPermissionDeniedError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const record = error as { code?: unknown; message?: unknown };
  const code = typeof record.code === "string" ? record.code.toLowerCase() : "";
  if (code === "permission-denied" || code.endsWith("/permission-denied")) {
    return true;
  }
  const msg = typeof record.message === "string" ? record.message.toLowerCase() : "";
  return msg.includes("missing or insufficient permissions") || msg.includes("permission-denied");
}

function handleOptionalSubscriptionError(
  source: "savingsGoals" | "categoryBudgets",
  label: string,
  error: unknown,
  clearData: () => void,
  onError?: (err: unknown) => void
): void {
  clearSnapshotSyncSource(source);
  clearData();
  if (isPermissionDeniedError(error)) {
    if (import.meta.env.DEV && !warnedPermissionSources.has(source)) {
      warnedPermissionSources.add(source);
      console.warn(
        `[TipidData] Read blocked for ${label} — publish updated firestore.rules in Firebase Console.`
      );
    }
  } else {
    console.error(`[TipidData] Error subscribing to ${label}:`, error);
  }
  onError?.(error);
}

function validUid(uid: string): string {
  const value = String(uid || "");
  if (!value || value.length > 128 || value.includes("/")) {
    throw new TypeError("Invalid user identifier");
  }
  return value;
}

function validId(id: string, label: string): string {
  const value = String(id || "");
  if (!value || value.length > 160 || value.includes("/")) {
    throw new TypeError(`Invalid ${label}`);
  }
  return value;
}

function validDate(value: string | null | undefined, required = false): string | null {
  if (!value && !required) return null;
  if (!isDateKey(value)) throw new TypeError("Invalid date");
  return value;
}

function entriesRef(uid: string) {
  return collection(db, "users", validUid(uid), "expenses");
}

function userDocRef(uid: string) {
  return doc(db, "users", validUid(uid));
}

function billsRef(uid: string) {
  return collection(db, "users", validUid(uid), "bills");
}

function utangRef(uid: string) {
  return collection(db, "users", validUid(uid), "utang");
}

function savingsGoalsRef(uid: string) {
  return collection(db, "users", validUid(uid), "savingsGoals");
}

function categoryBudgetsRef(uid: string) {
  return collection(db, "users", validUid(uid), "categoryBudgets");
}

export async function addExpense(
  uid: string,
  payload: { desc: string; amount: number; category: string; method: string; spendType?: SpendType }
): Promise<OfflineWriteResult> {
  const ref = entriesRef(uid);
  const data = {
    type: "expense" as const,
    desc: cleanText(payload.desc, "Description", 120),
    amount: money(payload.amount),
    category: cleanText(payload.category, "Category", 50),
    method: cleanText(payload.method || "Cash", "Wallet", 50),
    spendType: assertChoice(payload.spendType || "need", ["need", "luho"] as const, "spending type"),
    createdAt: serverTimestamp()
  };
  return executeOfflineAwareWrite(() => addDoc(ref, data));
}

export async function addIncome(
  uid: string,
  payload: { desc: string; amount: number; method: string }
): Promise<OfflineWriteResult> {
  const ref = entriesRef(uid);
  const data = {
    type: "income" as const,
    desc: cleanText(payload.desc, "Description", 120),
    amount: money(payload.amount),
    category: "Kita",
    method: cleanText(payload.method || "Cash", "Wallet", 50),
    createdAt: serverTimestamp()
  };
  return executeOfflineAwareWrite(() => addDoc(ref, data));
}

export async function addTransfer(
  uid: string,
  payload: { desc?: string; amount: number; fromMethod: string; toMethod: string; note?: string }
): Promise<OfflineWriteResult> {
  const ref = entriesRef(uid);
  const fromWallet = assertSafeObjectKey(cleanText(payload.fromMethod, "Source wallet", 50), "Source wallet");
  const toWallet = assertSafeObjectKey(cleanText(payload.toMethod, "Destination wallet", 50), "Destination wallet");
  if (fromWallet === toWallet) {
    throw new RangeError("Source and destination wallets must be different");
  }
  const safeAmount = money(payload.amount);
  const rawDesc = String(payload.desc ?? "").trim() || `${fromWallet} -> ${toWallet}`;
  const data = {
    type: "transfer" as const,
    desc: cleanText(rawDesc, "Description", 120),
    amount: safeAmount,
    category: "Transfer",
    method: fromWallet,
    toMethod: toWallet,
    note: optionalText(payload.note || "", 500),
    createdAt: serverTimestamp()
  };
  return executeOfflineAwareWrite(() => addDoc(ref, data));
}

export async function deleteEntry(uid: string, entryId: string): Promise<OfflineWriteResult> {
  const ref = doc(db, "users", validUid(uid), "expenses", validId(entryId, "entry identifier"));
  return executeOfflineAwareWrite(() => deleteDoc(ref));
}

export function subscribeEntries(
  uid: string,
  cb: (entries: TransactionEntry[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const q = query(entriesRef(uid), orderBy("createdAt", "desc"));
  const unsub = onSnapshot(
    q,
    { includeMetadataChanges: true },
    (snap) => {
      updateSnapshotSyncState("entries", snap.metadata.hasPendingWrites, snap.metadata.fromCache);
      const list: TransactionEntry[] = snap.docs.map((d) => {
        const raw = d.data({ serverTimestamps: "estimate" }) as Omit<TransactionEntry, "id">;
        return {
          ...raw,
          id: d.id,
          type: raw.type || "expense"
        };
      });
      cb(list);
    },
    (error) => {
      console.error("[TipidData] Error subscribing to entries:", error);
      onError?.(error);
    }
  );
  return () => {
    clearSnapshotSyncSource("entries");
    unsub();
  };
}

export function subscribeUserDoc(
  uid: string,
  cb: (data: UserDocumentData) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const unsub = onSnapshot(
    userDocRef(uid),
    { includeMetadataChanges: true },
    (snap) => {
      updateSnapshotSyncState("userDoc", snap.metadata.hasPendingWrites, snap.metadata.fromCache);
      cb(snap.exists() ? (snap.data() as UserDocumentData) : {});
    },
    (error) => {
      console.error("[TipidData] Error subscribing to user doc:", error);
      onError?.(error);
    }
  );
  return () => {
    clearSnapshotSyncSource("userDoc");
    unsub();
  };
}

export async function setBudget(uid: string, monthlyBudget: number): Promise<OfflineWriteResult> {
  const ref = userDocRef(uid);
  const safeBudget = money(monthlyBudget, { allowZero: true });
  return executeOfflineAwareWrite(() =>
    setDoc(ref, { monthlyBudget: safeBudget }, { merge: true })
  );
}

export async function setBudgetCycle(uid: string, cycle: BudgetCycle): Promise<OfflineWriteResult> {
  const ref = userDocRef(uid);
  const safeCycle = assertChoice(cycle, BUDGET_CYCLES, "budget cycle");
  return executeOfflineAwareWrite(() =>
    setDoc(ref, { budgetCycle: safeCycle }, { merge: true })
  );
}

export async function saveWalletBaseBalance(
  uid: string,
  method: string,
  balance: number
): Promise<OfflineWriteResult> {
  const ref = userDocRef(uid);
  const safeMethod = assertSafeObjectKey(cleanText(method, "Wallet", 50), "Wallet");
  const safeBalance = money(balance, { allowZero: true, allowNegative: true });
  return executeOfflineAwareWrite(() =>
    setDoc(ref, { wallets: { [safeMethod]: safeBalance } }, { merge: true })
  );
}

export async function removeWallet(uid: string, method: string): Promise<OfflineWriteResult> {
  const ref = userDocRef(uid);
  const safeMethod = assertSafeObjectKey(cleanText(method, "", 50), "Wallet");
  if (safeMethod.toLowerCase() === "cash") {
    throw new RangeError("Cannot remove the default Cash ledger");
  }
  return executeOfflineAwareWrite(() =>
    setDoc(ref, { wallets: { [safeMethod]: deleteField() } }, { merge: true })
  );
}

export async function ensureDefaultWallet(uid: string): Promise<OfflineWriteResult> {
  const ref = userDocRef(uid);
  return executeOfflineAwareWrite(() =>
    setDoc(ref, { wallets: { Cash: 0 } }, { merge: true })
  );
}

export async function saveFinancialGoals(uid: string, goals: FinancialGoal): Promise<OfflineWriteResult> {
  const ref = userDocRef(uid);
  const payload: Record<string, unknown> = {
    updatedAt: serverTimestamp()
  };
  if (typeof goals.name === "string") payload.name = optionalText(goals.name, 100);
  if (goals.targetAmount !== undefined && goals.targetAmount !== null && !Number.isNaN(Number(goals.targetAmount))) {
    payload.targetAmount = money(goals.targetAmount);
  }
  if (typeof goals.wallet === "string") payload.wallet = optionalText(goals.wallet, 50);
  if (goals.contribution !== undefined && goals.contribution !== null && !Number.isNaN(Number(goals.contribution))) {
    payload.contribution = money(goals.contribution);
  }
  if (typeof goals.frequency === "string") payload.frequency = optionalText(goals.frequency, 30);
  if (goals.startDate !== undefined) payload.startDate = validDate(goals.startDate, false);

  return executeOfflineAwareWrite(() =>
    setDoc(ref, { financialGoals: payload }, { merge: true })
  );
}

export async function addBill(
  uid: string,
  payload: {
    title: string;
    amount: number;
    dueDate: string;
    category: string;
    notes?: string;
    recurrence?: BillRecurrence;
  }
): Promise<OfflineWriteResult> {
  const ref = billsRef(uid);
  const recurrence = assertChoice(payload.recurrence || "none", BILL_RECURRENCES, "bill recurrence");
  const data = {
    title: cleanText(payload.title, "Bill title", 120),
    amount: money(payload.amount),
    dueDate: validDate(payload.dueDate, true),
    category: cleanText(payload.category || "Bills", "Category", 50),
    notes: optionalText(payload.notes || "", 500),
    recurrence,
    status: "Unpaid",
    createdAt: serverTimestamp()
  };
  return executeOfflineAwareWrite(() => addDoc(ref, data));
}

export async function updateBill(
  uid: string,
  billId: string,
  payload: {
    title: string;
    amount: number;
    dueDate: string;
    category: string;
    notes?: string;
    recurrence?: BillRecurrence;
  }
): Promise<OfflineWriteResult> {
  const ref = doc(db, "users", validUid(uid), "bills", validId(billId, "bill identifier"));
  const recurrence = assertChoice(payload.recurrence || "none", BILL_RECURRENCES, "bill recurrence");
  const data = {
    title: cleanText(payload.title, "Bill title", 120),
    amount: money(payload.amount),
    dueDate: validDate(payload.dueDate, true),
    category: cleanText(payload.category || "Bills", "Category", 50),
    notes: optionalText(payload.notes || "", 500),
    recurrence,
    updatedAt: serverTimestamp()
  };
  return executeOfflineAwareWrite(() => updateDoc(ref, data));
}

export async function updateBillStatus(
  uid: string,
  billId: string,
  status: "Unpaid" | "Paid"
): Promise<OfflineWriteResult> {
  const ref = doc(db, "users", validUid(uid), "bills", validId(billId, "bill identifier"));
  const safeStatus = assertChoice(status, BILL_WRITE_STATUSES, "bill status");
  return executeOfflineAwareWrite(() => updateDoc(ref, { status: safeStatus }));
}

/**
 * Marks a bill as Paid and atomically schedules the next cycle bill when recurring.
 */
export async function markBillPaidAndScheduleNext(
  uid: string,
  bill: BillRecord
): Promise<{ result: OfflineWriteResult; nextDueDate: string | null }> {
  const safeUid = validUid(uid);
  const currentRef = doc(db, "users", safeUid, "bills", validId(bill.id, "bill identifier"));
  const recurrence = BILL_RECURRENCES.includes(bill.recurrence || "none")
    ? (bill.recurrence as BillRecurrence)
    : "none";
  const nextDue = computeNextBillDueDate(bill.dueDate, recurrence);

  if (!nextDue) {
    const result = await executeOfflineAwareWrite(() => updateDoc(currentRef, { status: "Paid" }));
    return { result, nextDueDate: null };
  }

  const batch = writeBatch(db);
  batch.update(currentRef, { status: "Paid", updatedAt: serverTimestamp() });
  const nextRef = doc(billsRef(safeUid));
  batch.set(nextRef, {
    title: cleanText(bill.title, "Bill title", 120),
    amount: money(bill.amount),
    dueDate: validDate(nextDue, true),
    category: cleanText(bill.category || "Bills", "Category", 50),
    notes: optionalText(bill.notes || "", 500),
    recurrence,
    status: "Unpaid",
    createdAt: serverTimestamp()
  });

  const result = await executeOfflineAwareWrite(() => batch.commit());
  return { result, nextDueDate: nextDue };
}

export async function deleteBill(uid: string, billId: string): Promise<OfflineWriteResult> {
  const ref = doc(db, "users", validUid(uid), "bills", validId(billId, "bill identifier"));
  return executeOfflineAwareWrite(() => deleteDoc(ref));
}

export function subscribeBills(
  uid: string,
  cb: (bills: BillRecord[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const q = query(billsRef(uid), orderBy("dueDate", "asc"));
  const unsub = onSnapshot(
    q,
    { includeMetadataChanges: true },
    (snap) => {
      updateSnapshotSyncState("bills", snap.metadata.hasPendingWrites, snap.metadata.fromCache);
      const today = manilaDateKey();
      const list: BillRecord[] = snap.docs.map((d) => {
        const data = d.data({ serverTimestamps: "estimate" }) as Omit<BillRecord, "id">;
        let status: BillRecord["status"] = data.status || "Unpaid";
        if (status === "Unpaid" && today && data.dueDate && data.dueDate < today) {
          status = "Overdue";
        }
        return { ...data, id: d.id, status };
      });
      cb(list);
    },
    (error) => {
      console.error("[TipidData] Error subscribing to bills:", error);
      onError?.(error);
    }
  );
  return () => {
    clearSnapshotSyncSource("bills");
    unsub();
  };
}

export async function addUtang(
  uid: string,
  payload: { name: string; amount: number; direction: UtangDirection; dueDate?: string | null; notes?: string }
): Promise<OfflineWriteResult> {
  const ref = utangRef(uid);
  const data = {
    name: cleanText(payload.name, "Name", 120),
    amount: money(payload.amount),
    direction: payload.direction === "i_owe" ? "i_owe" : "owed_to_me",
    dueDate: validDate(payload.dueDate, false),
    notes: optionalText(payload.notes || "", 500),
    status: "Unpaid",
    createdAt: serverTimestamp()
  };
  return executeOfflineAwareWrite(() => addDoc(ref, data));
}

export async function updateUtang(
  uid: string,
  utangId: string,
  payload: { name: string; amount: number; direction: UtangDirection; dueDate?: string | null; notes?: string }
): Promise<OfflineWriteResult> {
  const ref = doc(db, "users", validUid(uid), "utang", validId(utangId, "debt identifier"));
  const data = {
    name: cleanText(payload.name, "Name", 120),
    amount: money(payload.amount),
    direction: payload.direction === "i_owe" ? "i_owe" : "owed_to_me",
    dueDate: validDate(payload.dueDate, false),
    notes: optionalText(payload.notes || "", 500),
    updatedAt: serverTimestamp()
  };
  return executeOfflineAwareWrite(() => updateDoc(ref, data));
}

export async function settleUtang(uid: string, utangId: string): Promise<OfflineWriteResult> {
  const ref = doc(db, "users", validUid(uid), "utang", validId(utangId, "debt identifier"));
  return executeOfflineAwareWrite(() =>
    updateDoc(ref, { status: "Paid", settledAt: serverTimestamp() })
  );
}

export async function reopenUtang(uid: string, utangId: string): Promise<OfflineWriteResult> {
  const ref = doc(db, "users", validUid(uid), "utang", validId(utangId, "debt identifier"));
  return executeOfflineAwareWrite(() =>
    updateDoc(ref, { status: "Unpaid", settledAt: null })
  );
}

export async function deleteUtang(uid: string, utangId: string): Promise<OfflineWriteResult> {
  const ref = doc(db, "users", validUid(uid), "utang", validId(utangId, "debt identifier"));
  return executeOfflineAwareWrite(() => deleteDoc(ref));
}

export function subscribeUtang(
  uid: string,
  cb: (list: UtangRecord[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const q = query(utangRef(uid), orderBy("createdAt", "desc"));
  const unsub = onSnapshot(
    q,
    { includeMetadataChanges: true },
    (snap) => {
      updateSnapshotSyncState("utang", snap.metadata.hasPendingWrites, snap.metadata.fromCache);
      const list: UtangRecord[] = snap.docs.map((d) => {
        const data = d.data({ serverTimestamps: "estimate" }) as Omit<UtangRecord, "id">;
        return {
          ...data,
          id: d.id,
          status: data.status || "Unpaid",
          direction: data.direction || "owed_to_me"
        };
      });
      cb(list);
    },
    (error) => {
      console.error("[TipidData] Error subscribing to utang:", error);
      onError?.(error);
    }
  );
  return () => {
    clearSnapshotSyncSource("utang");
    unsub();
  };
}

export async function saveNotificationSettings(
  uid: string,
  settings: NotificationSettings
): Promise<OfflineWriteResult> {
  const ref = userDocRef(uid);
  const payload: Record<string, unknown> = { updatedAt: serverTimestamp() };
  if (typeof settings.dailyReminders === "boolean") payload.dailyReminders = settings.dailyReminders;
  if (typeof settings.reminderTime === "string") {
    const cleanTime = settings.reminderTime.trim();
    payload.reminderTime = /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(cleanTime) ? cleanTime : "20:00";
  }
  if (typeof settings.overbudgetAlerts === "boolean") payload.overbudgetAlerts = settings.overbudgetAlerts;
  if (typeof settings.budgetThreshold === "number" && Number.isFinite(settings.budgetThreshold)) {
    payload.budgetThreshold = Math.min(Math.max(Math.round(settings.budgetThreshold), 50), 100);
  }
  if (typeof settings.lastReminderDate === "string" && settings.lastReminderDate.trim()) {
    payload.lastReminderDate = validDate(settings.lastReminderDate.trim(), false);
  }

  return executeOfflineAwareWrite(() =>
    setDoc(ref, { notificationSettings: payload }, { merge: true })
  );
}

export async function saveLanguagePreference(
  uid: string,
  lang: LanguageCode
): Promise<OfflineWriteResult> {
  const ref = userDocRef(uid);
  const safeLang: LanguageCode = lang === "tl" ? "tl" : "en";
  const preferences: UserPreferences & { updatedAt: unknown } = {
    lang: safeLang,
    updatedAt: serverTimestamp()
  };
  return executeOfflineAwareWrite(() =>
    setDoc(ref, { preferences, lang: safeLang }, { merge: true })
  );
}

export async function addSavingsGoal(
  uid: string,
  payload: {
    name: string;
    targetAmount: number;
    savedAmount?: number;
    wallet?: string | null;
    targetDate?: string | null;
    color?: SavingsGoalColor;
  }
): Promise<OfflineWriteResult> {
  const ref = savingsGoalsRef(uid);
  const color = assertChoice(payload.color || "emerald", SAVINGS_GOAL_COLORS, "goal accent color");
  const wallet =
    payload.wallet && String(payload.wallet).trim()
      ? cleanText(payload.wallet, "Wallet", 50)
      : null;
  const data = {
    name: cleanText(payload.name, "Goal name", 80),
    targetAmount: money(payload.targetAmount),
    savedAmount: money(payload.savedAmount ?? 0, { allowZero: true }),
    wallet,
    targetDate: validDate(payload.targetDate, false),
    color,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  return executeOfflineAwareWrite(() => addDoc(ref, data));
}

export async function updateSavingsGoal(
  uid: string,
  goalId: string,
  payload: {
    name: string;
    targetAmount: number;
    savedAmount: number;
    wallet?: string | null;
    targetDate?: string | null;
    color?: SavingsGoalColor;
  }
): Promise<OfflineWriteResult> {
  const ref = doc(db, "users", validUid(uid), "savingsGoals", validId(goalId, "savings goal identifier"));
  const color = assertChoice(payload.color || "emerald", SAVINGS_GOAL_COLORS, "goal accent color");
  const wallet =
    payload.wallet && String(payload.wallet).trim()
      ? cleanText(payload.wallet, "Wallet", 50)
      : null;
  const data = {
    name: cleanText(payload.name, "Goal name", 80),
    targetAmount: money(payload.targetAmount),
    savedAmount: money(payload.savedAmount, { allowZero: true }),
    wallet,
    targetDate: validDate(payload.targetDate, false),
    color,
    updatedAt: serverTimestamp()
  };
  return executeOfflineAwareWrite(() => updateDoc(ref, data));
}

/**
 * Adds a positive contribution to a savings jar and optionally records a
 * matching Savings expense from a wallet in a single atomic batch.
 */
export async function depositToSavingsGoal(
  uid: string,
  goal: Pick<SavingsGoalRecord, "id" | "name">,
  depositAmount: number,
  options?: { deductFromWallet?: string | null }
): Promise<OfflineWriteResult> {
  const safeUid = validUid(uid);
  const safeDeposit = money(depositAmount);
  const goalRef = doc(db, "users", safeUid, "savingsGoals", validId(goal.id, "savings goal identifier"));

  const batch = writeBatch(db);
  batch.update(goalRef, {
    savedAmount: increment(safeDeposit),
    updatedAt: serverTimestamp()
  });

  if (options?.deductFromWallet && String(options.deductFromWallet).trim()) {
    const safeWallet = assertSafeObjectKey(
      cleanText(options.deductFromWallet, "Wallet", 50),
      "Wallet"
    );
    const entryDoc = doc(entriesRef(safeUid));
    batch.set(entryDoc, {
      type: "expense",
      desc: cleanText(`Savings: ${goal.name}`, "Description", 120),
      amount: safeDeposit,
      category: "Savings",
      method: safeWallet,
      spendType: "need",
      createdAt: serverTimestamp()
    });
  }

  return executeOfflineAwareWrite(() => batch.commit());
}

export async function deleteSavingsGoal(uid: string, goalId: string): Promise<OfflineWriteResult> {
  const ref = doc(db, "users", validUid(uid), "savingsGoals", validId(goalId, "savings goal identifier"));
  return executeOfflineAwareWrite(() => deleteDoc(ref));
}

export function subscribeSavingsGoals(
  uid: string,
  cb: (goals: SavingsGoalRecord[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const q = query(savingsGoalsRef(uid), orderBy("createdAt", "desc"));
  const unsub = onSnapshot(
    q,
    { includeMetadataChanges: true },
    (snap) => {
      updateSnapshotSyncState("savingsGoals", snap.metadata.hasPendingWrites, snap.metadata.fromCache);
      const list: SavingsGoalRecord[] = snap.docs.map((d) => {
        const data = d.data({ serverTimestamps: "estimate" }) as Omit<SavingsGoalRecord, "id">;
        return {
          ...data,
          id: d.id,
          savedAmount: Number(data.savedAmount ?? 0),
          targetAmount: Number(data.targetAmount ?? 0)
        };
      });
      cb(list);
    },
    (error) => {
      handleOptionalSubscriptionError("savingsGoals", "savings goals", error, () => cb([]), onError);
    }
  );
  return () => {
    clearSnapshotSyncSource("savingsGoals");
    unsub();
  };
}

export async function saveCategoryBudget(
  uid: string,
  payload: { id?: string; category: string; limitAmount: number }
): Promise<OfflineWriteResult> {
  const safeUid = validUid(uid);
  const safeCategory = cleanText(payload.category, "Category", 50);
  const safeLimit = money(payload.limitAmount);

  if (payload.id) {
    const ref = doc(db, "users", safeUid, "categoryBudgets", validId(payload.id, "budget identifier"));
    return executeOfflineAwareWrite(() =>
      updateDoc(ref, {
        category: safeCategory,
        limitAmount: safeLimit,
        updatedAt: serverTimestamp()
      })
    );
  }

  return executeOfflineAwareWrite(() =>
    addDoc(categoryBudgetsRef(safeUid), {
      category: safeCategory,
      limitAmount: safeLimit,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
  );
}

export async function deleteCategoryBudget(uid: string, budgetId: string): Promise<OfflineWriteResult> {
  const ref = doc(db, "users", validUid(uid), "categoryBudgets", validId(budgetId, "budget identifier"));
  return executeOfflineAwareWrite(() => deleteDoc(ref));
}

export function subscribeCategoryBudgets(
  uid: string,
  cb: (budgets: CategoryBudgetRecord[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const q = query(categoryBudgetsRef(uid), orderBy("category", "asc"));
  const unsub = onSnapshot(
    q,
    { includeMetadataChanges: true },
    (snap) => {
      updateSnapshotSyncState("categoryBudgets", snap.metadata.hasPendingWrites, snap.metadata.fromCache);
      const list: CategoryBudgetRecord[] = snap.docs.map((d) => {
        const data = d.data({ serverTimestamps: "estimate" }) as Omit<CategoryBudgetRecord, "id">;
        return {
          ...data,
          id: d.id,
          limitAmount: Number(data.limitAmount ?? 0)
        };
      });
      cb(list);
    },
    (error) => {
      handleOptionalSubscriptionError("categoryBudgets", "category budgets", error, () => cb([]), onError);
    }
  );
  return () => {
    clearSnapshotSyncSource("categoryBudgets");
    unsub();
  };
}

export async function clearLocalCache(): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return false;
  try {
    await Promise.race([
      waitForPendingWrites(db),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Sync timeout")), 2500))
    ]);
    await terminate(db);
    await clearIndexedDbPersistence(db);
    return true;
  } catch {
    console.warn("[TipidData] Local cache could not be cleared cleanly.");
    return false;
  }
}
