// firebase.js
// Use CDN links instead of bare imports
// IMPORTANT: this version number must match the one used in firebase-auth.js
// (and any other firebase-*.js file you add). Loading different versions
// from CDN creates separate, isolated SDK instances that can't see each
// other — that mismatch is what causes "Component auth has not been
// registered yet."
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-analytics.js";

// Pinalitan natin ang getFirestore para isama ang offline persistence tools
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyB0cmCEgR09ZmY_v2RMXnhnW72ttSYIVlM",
  authDomain: "expensestracker-18d2b.firebaseapp.com",
  projectId: "expensestracker-18d2b",
  storageBucket: "expensestracker-18d2b.firebasestorage.app",
  messagingSenderId: "316182556072",
  appId: "1:316182556072:web:d673007a335bc4622b019d",
  measurementId: "G-XEPDS0FG10"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firestore with Offline Persistence ENABLED
// Pinapayagan nito ang app na gumana, mag-save, at mag-load ng data kahit walang internet.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
});

// ---------------------------------------------------------------------------
// Bridge: i-expose ang db at ang mga Firestore functions na madalas gamitin
// papunta sa window, para magamit ng classic (non-module) scripts tulad ng
// components/AllowanceCalculator.js na naka-<script type="text/babel">.
// Sundin ang parehong pattern na ginamit sa TipidAuth (firebase-auth.js).
// ---------------------------------------------------------------------------
window.db = db;
window.FirestoreAPI = {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp
};
