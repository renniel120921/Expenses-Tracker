// Use CDN links instead of bare imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-analytics.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

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

// Export Firestore to use it in your React component later
export const db = getFirestore(app);
