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
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

function entriesRef(uid) {
  return collection(db, "users", uid, "expenses");
}

function userDocRef(uid) {
  return doc(db, "users", uid);
}

function billsRef(uid) {
  return collection(db, "users", uid, "bills");
}

function utangRef(uid) {
  return collection(db, "users", uid, "utang");
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

  // --- bills center --------------------------------------------------------

  async addBill(uid, { title, amount, dueDate, category, notes }) {
    try {
      return await addDoc(billsRef(uid), {
        title,
        amount: parseFloat(amount),
        dueDate, // Format: "YYYY-MM-DD"
        category: category || "Bills",
        notes: notes || "",
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
      const billDocRef = doc(db, "users", uid, "bills", billId);
      return await updateDoc(billDocRef, { status });
    } catch (error) {
      console.error("Error updating bill status:", error);
      throw error;
    }
  },

  async deleteBill(uid, billId) {
    try {
      const billDocRef = doc(db, "users", uid, "bills", billId);
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
        const today = new Date().toISOString().split("T")[0];
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
        name,
        amount: parseFloat(amount),
        direction: direction === "i_owe" ? "i_owe" : "owed_to_me",
        dueDate: dueDate || null, // Format: "YYYY-MM-DD" or null
        notes: notes || "",
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
      const utangDocRef = doc(db, "users", uid, "utang", utangId);
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
      const utangDocRef = doc(db, "users", uid, "utang", utangId);
      return await updateDoc(utangDocRef, { status: "Unpaid" });
    } catch (error) {
      console.error("Error reopening utang:", error);
      throw error;
    }
  },

  async deleteUtang(uid, utangId) {
    try {
      const utangDocRef = doc(db, "users", uid, "utang", utangId);
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

  // --- legacy aliases (kept so older pages that call these still work) -----
  deleteExpense(uid, id) { return this.deleteEntry(uid, id); },
  subscribeExpenses(uid, cb, onError) { return this.subscribeEntries(uid, cb, onError); },
};

window.dispatchEvent(new Event("tipid-data-ready"));
