// firebase-data.js

import { db } from "./firebase.js";
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
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const core = window.TipidCore;
const BILL_STATUSES = ["Unpaid", "Paid"];

function validUid(uid) {
  const value = String(uid || "");
  if (!value || value.length > 128 || value.includes("/")) throw new TypeError("Invalid user identifier");
  return value;
}

function validId(id, label) {
  const value = String(id || "");
  if (!value || value.length > 160 || value.includes("/")) throw new TypeError(`Invalid ${label}`);
  return value;
}

function normalizedAmount(value) { return core.money(value); }
function requiredText(value, label, max) { return core.cleanText(value, label, max); }
function optionalText(value, max) { return core.optionalText(value, max); }
function validDate(value, required = false) {
  if (!value && !required) return null;
  if (!core.isDateKey(value)) throw new TypeError("Invalid date");
  return value;
}

function entriesRef(uid) {
  return collection(db, "users", validUid(uid), "expenses");
}

function userDocRef(uid) {
  return doc(db, "users", validUid(uid));
}

function billsRef(uid) {
  return collection(db, "users", validUid(uid), "bills");
}

function utangRef(uid) {
  return collection(db, "users", validUid(uid), "utang");
}

window.TipidData = {
  // --- entries (expenses + income) ---------------------------------------

  async addExpense(uid, { desc, amount, category, method, spendType = "need" }) {
    try {
      return await addDoc(entriesRef(uid), {
        type: "expense",
        desc: requiredText(desc, "Description", 120),
        amount: normalizedAmount(amount),
        category: requiredText(category, "Category", 50),
        method: requiredText(method || "Cash", "Wallet", 50),
        spendType: core.assertChoice(spendType, ["need", "luho"], "spending type"),
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error adding expense:", error);
      throw error;
    }
  },

  async addIncome(uid, { desc, amount, method }) {
    try {
      return await addDoc(entriesRef(uid), {
        type: "income",
        desc: requiredText(desc, "Description", 120),
        amount: normalizedAmount(amount),
        category: "Kita",
        method: requiredText(method || "Cash", "Wallet", 50),
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error adding income:", error);
      throw error;
    }
  },

  async deleteEntry(uid, entryId) {
    try {
      const entryRef = doc(db, "users", validUid(uid), "expenses", validId(entryId, "entry identifier"));
      return await deleteDoc(entryRef);
    } catch (error) {
      // Dito natin mahuhuli kung Firebase Rules ang nagba-block sa pagbura
      console.error("Error deleting entry:", error);
      throw error;
    }
  },

  // cb receives an array of entries (expenses + income), newest first.
  subscribeEntries(uid, cb, onError) {
    const q = query(entriesRef(uid), orderBy("createdAt", "desc"));

    // IMPORTANT: includeMetadataChanges allows the UI to react to local offline writes instantly.
    return onSnapshot(
      q,
      { includeMetadataChanges: true },
      (snap) => {
        cb(
          snap.docs.map((d) => ({
            id: d.id,
            type: "expense", // Default fallback for older records
            // { serverTimestamps: "estimate" } prevents 'null' errors when adding items offline
            ...d.data({ serverTimestamps: "estimate" }),
          }))
        );
      },
      (error) => {
        console.error("Error subscribing to entries:", error);
        if (onError) onError(error);
      }
    );
  },

  // --- budget --------------------------------------------------------------

  async setBudget(uid, monthlyBudget) {
    try {
      return await setDoc(userDocRef(uid), { monthlyBudget: normalizedAmount(monthlyBudget) }, { merge: true });
    } catch (error) {
      console.error("Error setting budget:", error);
      throw error;
    }
  },

  // cb receives the current monthlyBudget (number, or null if unset).
  subscribeBudget(uid, cb, onError) {
    return onSnapshot(
      userDocRef(uid),
      { includeMetadataChanges: true },
      (snap) => cb(snap.exists() ? snap.data().monthlyBudget ?? null : null),
      (error) => {
        console.error("Error subscribing to budget:", error);
        if (onError) onError(error);
      }
    );
  },

  async saveFinancialGoals(uid, goals = {}) {
    try {
      const payload = {
        updatedAt: serverTimestamp()
      };
      if (typeof goals.name === 'string') payload.name = optionalText(goals.name, 100);
      if (goals.targetAmount !== undefined && goals.targetAmount !== null && !isNaN(Number(goals.targetAmount))) {
        payload.targetAmount = normalizedAmount(goals.targetAmount);
      }
      if (typeof goals.wallet === 'string') payload.wallet = optionalText(goals.wallet, 50);
      if (goals.contribution !== undefined && goals.contribution !== null && !isNaN(Number(goals.contribution))) {
        payload.contribution = normalizedAmount(goals.contribution);
      }
      if (typeof goals.frequency === 'string') payload.frequency = optionalText(goals.frequency, 30);
      if (goals.startDate !== undefined) payload.startDate = validDate(goals.startDate, false);

      return await setDoc(userDocRef(uid), { financialGoals: payload }, { merge: true });
    } catch (error) {
      console.error("Error saving financial goals:", error);
      throw error;
    }
  },

  subscribeFinancialGoals(uid, cb, onError) {
    return onSnapshot(
      userDocRef(uid),
      { includeMetadataChanges: true },
      (snap) => {
        const goals = snap.exists() ? (snap.data().financialGoals || {}) : {};
        cb(goals);
      },
      (error) => {
        console.error("Error subscribing to financial goals:", error);
        if (onError) onError(error);
      }
    );
  },

  // --- bills center --------------------------------------------------------

  async addBill(uid, { title, amount, dueDate, category, notes }) {
    try {
      return await addDoc(billsRef(uid), {
        title: requiredText(title, "Bill title", 120),
        amount: normalizedAmount(amount),
        dueDate: validDate(dueDate, true),
        category: requiredText(category || "Bills", "Category", 50),
        notes: optionalText(notes, 500),
        status: "Unpaid", // Default status
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error adding bill:", error);
      throw error;
    }
  },

  async updateBillStatus(uid, billId, status) {
    try {
      const billDocRef = doc(db, "users", validUid(uid), "bills", validId(billId, "bill identifier"));
      return await updateDoc(billDocRef, { status: core.assertChoice(status, BILL_STATUSES, "bill status") });
    } catch (error) {
      console.error("Error updating bill status:", error);
      throw error;
    }
  },

  async deleteBill(uid, billId) {
    try {
      const billDocRef = doc(db, "users", validUid(uid), "bills", validId(billId, "bill identifier"));
      return await deleteDoc(billDocRef);
    } catch (error) {
      console.error("Error deleting bill:", error);
      throw error;
    }
  },

  subscribeBills(uid, cb, onError) {
    const q = query(billsRef(uid), orderBy("dueDate", "asc"));

    return onSnapshot(
      q,
      { includeMetadataChanges: true },
      (snap) => {
        const today = core.manilaDateKey();
        const list = snap.docs.map((d) => {
          const data = d.data({ serverTimestamps: "estimate" });
          let status = data.status || "Unpaid";
          if (status === "Unpaid" && data.dueDate && data.dueDate < today) {
            status = "Overdue";
          }
          return { id: d.id, ...data, status };
        });
        cb(list);
      },
      (error) => {
        console.error("Error subscribing to bills:", error);
        if (onError) onError(error);
      }
    );
  },

  // --- utang tracker ---------------------------------------------------------
  // direction: "owed_to_me"  -> may utang sa akin ang ibang tao
  //            "i_owe"       -> may utang ako sa ibang tao
  // status:    "Unpaid" | "Paid"

  async addUtang(uid, { name, amount, direction, dueDate, notes }) {
    try {
      return await addDoc(utangRef(uid), {
        name: requiredText(name, "Name", 120),
        amount: normalizedAmount(amount),
        direction: direction === "i_owe" ? "i_owe" : "owed_to_me",
        dueDate: validDate(dueDate),
        notes: optionalText(notes, 500),
        status: "Unpaid",
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error adding utang:", error);
      throw error;
    }
  },

  async settleUtang(uid, utangId) {
    try {
      const utangDocRef = doc(db, "users", validUid(uid), "utang", validId(utangId, "debt identifier"));
      return await updateDoc(utangDocRef, {
        status: "Paid",
        settledAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error settling utang:", error);
      throw error;
    }
  },

  async reopenUtang(uid, utangId) {
    try {
      const utangDocRef = doc(db, "users", validUid(uid), "utang", validId(utangId, "debt identifier"));
      return await updateDoc(utangDocRef, { status: "Unpaid" });
    } catch (error) {
      console.error("Error reopening utang:", error);
      throw error;
    }
  },

  async deleteUtang(uid, utangId) {
    try {
      const utangDocRef = doc(db, "users", validUid(uid), "utang", validId(utangId, "debt identifier"));
      return await deleteDoc(utangDocRef);
    } catch (error) {
      console.error("Error deleting utang:", error);
      throw error;
    }
  },

  // cb receives an array of utang records, newest first.
  subscribeUtang(uid, cb, onError) {
    const q = query(utangRef(uid), orderBy("createdAt", "desc"));

    return onSnapshot(
      q,
      { includeMetadataChanges: true },
      (snap) => {
        cb(
          snap.docs.map((d) => ({
            id: d.id,
            status: "Unpaid",
            direction: "owed_to_me",
            ...d.data({ serverTimestamps: "estimate" }),
          }))
        );
      },
      (error) => {
        console.error("Error subscribing to utang:", error);
        if (onError) onError(error);
      }
    );
  },

  // --- notifications & reminders settings ----------------------------------
  async saveNotificationSettings(uid, settings = {}) {
    try {
      const payload = {
        updatedAt: serverTimestamp()
      };
      if (typeof settings.dailyReminders === 'boolean') payload.dailyReminders = settings.dailyReminders;
      if (typeof settings.reminderTime === 'string') payload.reminderTime = settings.reminderTime;
      if (typeof settings.overbudgetAlerts === 'boolean') payload.overbudgetAlerts = settings.overbudgetAlerts;
      if (typeof settings.budgetThreshold === 'number') payload.budgetThreshold = settings.budgetThreshold;
      if (typeof settings.lastReminderDate === 'string') payload.lastReminderDate = settings.lastReminderDate;

      return await setDoc(userDocRef(uid), { notificationSettings: payload }, { merge: true });
    } catch (error) {
      console.error("Error saving notification settings:", error);
      throw error;
    }
  },

  subscribeNotificationSettings(uid, cb, onError) {
    return onSnapshot(
      userDocRef(uid),
      { includeMetadataChanges: true },
      (snap) => {
        const notif = snap.exists() ? (snap.data().notificationSettings || {}) : {};
        cb(notif);
      },
      (error) => {
        console.error("Error subscribing to notification settings:", error);
        if (onError) onError(error);
      }
    );
  },

  async recordReminderTriggered(uid, dateKey = core.manilaDateKey()) {
    try {
      return await setDoc(userDocRef(uid), {
        notificationSettings: { lastReminderDate: dateKey }
      }, { merge: true });
    } catch (error) {
      console.warn("Could not record reminder timestamp to cloud:", error);
    }
  },

  // --- preferences (language, etc.) --------------------------------------
  async saveLanguagePreference(uid, lang) {
    try {
      const safeLang = (lang === "tl" || lang === "fil") ? "tl" : "en";
      return await setDoc(userDocRef(uid), {
        preferences: {
          lang: safeLang,
          updatedAt: serverTimestamp()
        },
        lang: safeLang
      }, { merge: true });
    } catch (error) {
      console.error("Error saving language preference:", error);
      throw error;
    }
  },

  subscribePreferences(uid, cb, onError) {
    return onSnapshot(
      userDocRef(uid),
      { includeMetadataChanges: true },
      (snap) => {
        const data = snap.exists() ? snap.data() : {};
        const lang = data.preferences?.lang || data.lang || "en";
        cb({ ...(data.preferences || {}), lang });
      },
      (error) => {
        console.error("Error subscribing to preferences:", error);
        if (onError) onError(error);
      }
    );
  },

  // --- legacy aliases (kept so older pages that call these still work) -----
  deleteExpense(uid, id) { return this.deleteEntry(uid, id); },
  subscribeExpenses(uid, cb, onError) { return this.subscribeEntries(uid, cb, onError); },

  async clearLocalCache() {
    if (typeof navigator !== "undefined" && navigator.onLine === false) return false;
    try {
      await waitForPendingWrites(db);
      await terminate(db);
      await clearIndexedDbPersistence(db);
      return true;
    } catch (error) {
      console.warn("[TipidData] Local cache could not be cleared; another app tab may still be open.");
      return false;
    }
  },
};

window.dispatchEvent(new Event("tipid-data-ready"));
