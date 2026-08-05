// firebase-data.js

import { db } from "./firebase.js";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  setDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

function entriesRef(uid) {
  return collection(db, "users", uid, "expenses");
}

function userDocRef(uid) {
  return doc(db, "users", uid);
}

window.TipidData = {
  // --- entries (expenses + income) ---------------------------------------

  async addExpense(uid, { desc, amount, category, method }) {
    try {
      return await addDoc(entriesRef(uid), {
        type: "expense",
        desc,
        amount,
        category,
        method: method || "Cash",
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
        desc,
        amount,
        category: "Kita",
        method: method || "Cash",
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error adding income:", error);
      throw error;
    }
  },

  async deleteEntry(uid, entryId) {
    try {
      const entryRef = doc(db, "users", uid, "expenses", entryId);
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
      return await setDoc(userDocRef(uid), { monthlyBudget }, { merge: true });
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

  // --- legacy aliases (kept so older pages that call these still work) -----
  deleteExpense(uid, id) { return this.deleteEntry(uid, id); },
  subscribeExpenses(uid, cb, onError) { return this.subscribeEntries(uid, cb, onError); },
};

window.dispatchEvent(new Event("tipid-data-ready"));
