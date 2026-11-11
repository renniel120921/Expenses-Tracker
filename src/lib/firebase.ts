import { initializeApp } from "firebase/app";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB0cmCEgR09ZmY_v2RMXnhnW72ttSYIVlM",
  authDomain: "expensestracker-18d2b.firebaseapp.com",
  projectId: "expensestracker-18d2b",
  storageBucket: "expensestracker-18d2b.firebasestorage.app",
  messagingSenderId: "316182556072",
  appId: "1:316182556072:web:d673007a335bc4622b019d"
};

export const app = initializeApp(firebaseConfig);

export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  experimentalForceLongPolling: true
});
