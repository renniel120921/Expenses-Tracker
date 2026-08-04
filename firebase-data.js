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
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js"; // <-- Updated to 10.13.0

function entriesRef(uid) {
  return collection(db, "users", uid, "expenses");
}

function userDocRef(uid) {
  return doc(db, "users", uid);
}

window.TipidData = {
  // --- entries (expenses + income) ---------------------------------------

  async addExpense(uid, { desc, amount, category, method }) {
    return addDoc(entriesRef(uid), {
      type: "expense",
      desc,
      amount,
      category,
      method: method || "Cash",
      createdAt: serverTimestamp(),
    });
  },

  async addIncome(uid, { desc, amount, method }) {
    return addDoc(entriesRef(uid), {
      type: "income",
      desc,
      amount,
      category: "Kita",
      method: method || "Cash",
      createdAt: serverTimestamp(),
    });
  },

  async deleteEntry(uid, entryId) {
    return deleteDoc(doc(db, "users", uid, "expenses", entryId));
  },

  // cb receives an array of entries (expenses + income), newest first.
  // Older docs saved before `type` existed are treated as "expense".
  subscribeEntries(uid, cb, onError) {
    const q = query(entriesRef(uid), orderBy("createdAt", "desc"));
    return onSnapshot(
      q,
      (snap) => cb(snap.docs.map((d) => ({ id: d.id, type: "expense", ...d.data() }))),
      onError
    );
  },

  // --- budget --------------------------------------------------------------

  async setBudget(uid, monthlyBudget) {
    return setDoc(userDocRef(uid), { monthlyBudget }, { merge: true });
  },

  // cb receives the current monthlyBudget (number, or null if unset).
  subscribeBudget(uid, cb, onError) {
    return onSnapshot(
      userDocRef(uid),
      (snap) => cb(snap.exists() ? snap.data().monthlyBudget ?? null : null),
      onError
    );
  },

  // --- legacy aliases (kept so older pages that call these still work) -----
  deleteExpense(uid, id) { return this.deleteEntry(uid, id); },
  subscribeExpenses(uid, cb, onError) { return this.subscribeEntries(uid, cb, onError); },
};

window.dispatchEvent(new Event("tipid-data-ready"));
