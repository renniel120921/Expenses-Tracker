import {
  collection,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  setDoc,
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
import type {
  BillRecord,
  FinancialGoal,
  LanguageCode,
  NotificationSettings,
  SpendType,
  TransactionEntry,
  UserDocumentData,
  UserPreferences,
  UtangDirection,
  UtangRecord
} from "@/types/finance";

const BILL_WRITE_STATUSES = ["Unpaid", "Paid"] as const;

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
  payload: { title: string; amount: number; dueDate: string; category: string; notes?: string }
): Promise<OfflineWriteResult> {
  const ref = billsRef(uid);
  const data = {
    title: cleanText(payload.title, "Bill title", 120),
    amount: money(payload.amount),
    dueDate: validDate(payload.dueDate, true),
    category: cleanText(payload.category || "Bills", "Category", 50),
    notes: optionalText(payload.notes || "", 500),
    status: "Unpaid",
    createdAt: serverTimestamp()
  };
  return executeOfflineAwareWrite(() => addDoc(ref, data));
}

export async function updateBill(
  uid: string,
  billId: string,
  payload: { title: string; amount: number; dueDate: string; category: string; notes?: string }
): Promise<OfflineWriteResult> {
  const ref = doc(db, "users", validUid(uid), "bills", validId(billId, "bill identifier"));
  const data = {
    title: cleanText(payload.title, "Bill title", 120),
    amount: money(payload.amount),
    dueDate: validDate(payload.dueDate, true),
    category: cleanText(payload.category || "Bills", "Category", 50),
    notes: optionalText(payload.notes || "", 500),
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
