// firebase-auth.js
// Wraps Firebase Authentication and exposes it as window.TipidAuth so the
// non-module React pages (signup.html, login.html, dashboard.html, bills.html) can call it directly.
import { app } from "./firebase.js";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

const auth = getAuth(app);

// Keep the user logged in locally even when offline or restarting the app.
// IMPORTANT: this must finish (or at least be attempted) BEFORE any page
// trusts onAuthStateChanged/onChange, otherwise a page that checks auth
// state immediately on load can race ahead of persistence actually being
// set. `persistenceReady` lets callers await that instead of guessing.
const persistenceReady = setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn("[TipidAuth] Failed to set auth persistence — falling back to Firebase's default (session may not survive a full app/browser restart):", err);
});

const googleProvider = new GoogleAuthProvider();

// Dev aid only — Firebase Auth itself still enforces its own domain/HTTPS
// rules server-side, this just warns early in the console during local work.
if (location.protocol !== "https:" && !["localhost", "127.0.0.1"].includes(location.hostname)) {
  console.warn("[TipidAuth] Running over a non-HTTPS, non-local origin — Firebase Auth may reject requests from here.");
}

// ---------------------------------------------------------------------------
// Rate limiting
// ---------------------------------------------------------------------------
// IMPORTANT: this is a client-side throttle, not a real security boundary.
// Anyone can bypass it by clearing localStorage or opening a private window,
// so it does not stop a determined/scripted attacker — that protection has
// to live server-side (Firebase already enforces its own quota, surfaced as
// "auth/too-many-requests"; for anything stronger, add Firebase App Check
// and/or move sign-up/login through a Cloud Function you control). What this
// DOES do: slow down casual abuse from a single browser and give honest
// users clear feedback instead of a silent retry loop.

const RATE_LIMITS = {
  login: { maxAttempts: 5, windowMs: 5 * 60 * 1000, baseLockMs: 30 * 1000 },
  signUp: { maxAttempts: 5, windowMs: 15 * 60 * 1000, baseLockMs: 60 * 1000 },
  resetPassword: { maxAttempts: 3, windowMs: 10 * 60 * 1000, baseLockMs: 60 * 1000 },
};
const MAX_LOCK_MS = 15 * 60 * 1000;

class RateLimitError extends Error {
  constructor(secondsLeft) {
    super("rate-limited");
    this.code = "app/rate-limited";
    this.secondsLeft = secondsLeft;
  }
}

// Small non-cryptographic string hash (DJB2). Not for security-critical use —
// only so raw email addresses aren't sitting in plaintext in localStorage,
// where any script or browser extension on the page could otherwise read
// them straight out of devtools.
function hashIdent(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return (hash >>> 0).toString(36);
}

function rlKey(action, ident) {
  return `tipid_rl_${action}_${hashIdent(ident)}`;
}

function readRecord(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeRecord(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // Storage unavailable (private mode, quota exceeded, etc.) — fail open
    // rather than lock a real user out because of it.
  }
}

// Throws RateLimitError if this action/identity is currently locked out.
function checkRateLimit(action, ident) {
  const cfg = RATE_LIMITS[action];
  const key = rlKey(action, ident);
  const now = Date.now();
  const rec = readRecord(key);
  if (!rec) return;

  if (rec.lockUntil && now < rec.lockUntil) {
    throw new RateLimitError(Math.ceil((rec.lockUntil - now) / 1000));
  }
  if (now - rec.windowStart > cfg.windowMs) {
    writeRecord(key, { count: 0, windowStart: now, lockUntil: 0, strikes: rec.strikes || 0 });
  }
}

function recordFailure(action, ident) {
  const cfg = RATE_LIMITS[action];
  const key = rlKey(action, ident);
  const now = Date.now();
  const rec = readRecord(key) || { count: 0, windowStart: now, lockUntil: 0, strikes: 0 };

  if (now - rec.windowStart > cfg.windowMs) {
    rec.count = 0;
    rec.windowStart = now;
  }
  rec.count += 1;

  if (rec.count >= cfg.maxAttempts) {
    rec.strikes = (rec.strikes || 0) + 1;
    rec.lockUntil = now + Math.min(cfg.baseLockMs * 2 ** (rec.strikes - 1), MAX_LOCK_MS);
    rec.count = 0;
    rec.windowStart = now;
  }
  writeRecord(key, rec);
}

function recordSuccess(action, ident) {
  writeRecord(rlKey(action, ident), { count: 0, windowStart: Date.now(), lockUntil: 0, strikes: 0 });
}

// ---------------------------------------------------------------------------
// Concurrent-call guard
// ---------------------------------------------------------------------------
// Stops a double-click or a slow network response from firing the same
// action twice in parallel (e.g. two account-creation requests racing).
const inFlight = new Set();

function claimInFlight(action, ident) {
  const key = `${action}:${ident}`;
  if (inFlight.has(key)) {
    const err = new Error("in-flight");
    err.code = "app/in-flight";
    throw err;
  }
  inFlight.add(key);
  return key;
}
function releaseInFlight(key) {
  inFlight.delete(key);
}

// ---------------------------------------------------------------------------
// Common/breached password blocklist
// ---------------------------------------------------------------------------
// Rejects a short list of extremely common passwords at sign-up time (NIST
// 800-63B recommends blocking known-weak/breached passwords rather than just
// enforcing length+complexity rules). Not exhaustive — pair with the
// strength meter in the UI for real guidance.
const COMMON_PASSWORDS = new Set([
  "123456", "password", "123456789", "12345678", "12345",
  "qwerty", "111111", "abc123", "password1", "iloveyou",
  "admin123", "letmein", "welcome", "monkey", "dragon",
  "123123", "000000", "qwerty123", "1q2w3e4r", "654321",
]);
function isCommonPassword(password) {
  return COMMON_PASSWORDS.has((password || "").toLowerCase());
}

// Same pattern used client-side by signup.html/login.html — kept here too so
// resetPassword never even reaches the network with a malformed address.
const EMAIL_RE = /^\S+@\S+\.\S+$/;

function normalizeEmail(email) {
  return (email || "").trim().toLowerCase();
}

// ---------------------------------------------------------------------------
// Offline detection
// ---------------------------------------------------------------------------
// signUp/logIn/loginWithGoogle/resetPassword all need a real round-trip to
// Firebase's servers — no amount of client code can make those work with
// zero connectivity. What THIS does is fail fast with a clear Tagalog
// message the instant we know we're offline, instead of letting the user
// stare at a spinner for Firebase's own ~20-30s network timeout, and it
// avoids burning a rate-limit attempt on a request that never left the
// browser.
//
// IMPORTANT: this does NOT affect already-logged-in users. Firebase's
// browserLocalPersistence (set up above) keeps the session cached locally,
// so onAuthStateChanged/onChange still fires with the cached user — and the
// dashboard stays fully usable — even with zero internet. Only background
// token refresh is skipped until connectivity returns, silently.
function isOnline() {
  return typeof navigator === "undefined" ? true : navigator.onLine !== false;
}

class OfflineError extends Error {
  constructor() {
    super("offline");
    this.code = "app/offline";
  }
}

function assertOnline() {
  if (!isOnline()) throw new OfflineError();
}

function formatWait(seconds) {
  if (seconds < 60) return `${seconds} segundo`;
  return `${Math.ceil(seconds / 60)} minuto`;
}

// Pads out a promise to a minimum duration. Used on resetPassword so that a
// registered vs. unregistered email can't be told apart by response time —
// the "silent" branch below would otherwise resolve noticeably faster than
// a real network round-trip to Firebase.
function withMinDuration(promise, ms) {
  const floor = new Promise(resolve => setTimeout(resolve, ms));
  return Promise.allSettled([promise, floor]).then(([result]) => {
    if (result.status === "rejected") throw result.reason;
    return result.value;
  });
}

// ---------------------------------------------------------------------------
// Error messages
// ---------------------------------------------------------------------------
// Tagalog-first error messages — Firebase's default codes are English/technical.
//
// Note: "auth/user-not-found" and "auth/wrong-password" are deliberately
// mapped to the SAME message as "auth/invalid-credential". If a wrong
// password produced one message and an unregistered email produced another,
// an attacker could use the login form to enumerate which emails have
// accounts on this app. Keep these three identical.
function friendlyError(errOrCode) {
  const code = typeof errOrCode === "string" ? errOrCode : errOrCode && errOrCode.code;
  const secondsLeft = errOrCode && typeof errOrCode === "object" ? errOrCode.secondsLeft : undefined;

  if (code === "app/offline") {
    return "Wala kang internet connection. Kailangan ng connection para dito — subukan ulit kapag may signal o WiFi ka na.";
  }
  if (code === "app/rate-limited") {
    return secondsLeft
      ? `Sobrang dami ng pagtatangka. Subukan ulit pagkalipas ng ${formatWait(secondsLeft)}.`
      : "Sobrang dami ng pagtatangka. Subukan ulit mamaya.";
  }
  if (code === "app/common-password") {
    return "Masyadong karaniwan ang password na ito. Pumili ng mas matibay.";
  }
  if (code === "app/in-flight") {
    return "Sandali lang — kasalukuyan pang pinoproseso ang huling request mo.";
  }

  const map = {
    "auth/email-already-in-use": "May account na gamit itong email.",
    "auth/invalid-email": "Hindi valid ang email address.",
    "auth/weak-password": "Dapat 6 characters pataas ang password.",
    "auth/missing-password": "Kailangan ng password.",
    "auth/user-not-found": "Mali ang email o password.",
    "auth/wrong-password": "Mali ang email o password.",
    "auth/invalid-credential": "Mali ang email o password.",
    "auth/too-many-requests": "Sobrang dami ng attempts. Subukan ulit mamaya.",
    "auth/popup-closed-by-user": "Na-cancel ang Google sign-in.",
    "auth/unauthorized-domain": "Hindi authorized ang domain na ito para sa Google sign-in. Pakigamit ang production site.",
    "auth/network-request-failed": "Walang connection. Subukan ulit.",
  };
  return map[code] || "May problema. Subukan ulit.";
}

window.TipidAuth = {
  async signUp(name, email, password) {
    assertOnline();
    const normEmail = normalizeEmail(email);
    checkRateLimit("signUp", normEmail);
    if (isCommonPassword(password)) {
      const err = new Error("common-password");
      err.code = "app/common-password";
      throw err;
    }
    const claim = claimInFlight("signUp", normEmail);
    try {
      const cred = await createUserWithEmailAndPassword(auth, normEmail, password);
      if (name) await updateProfile(cred.user, { displayName: name.trim() });
      recordSuccess("signUp", normEmail);
      return cred.user;
    } catch (err) {
      recordFailure("signUp", normEmail);
      throw err;
    } finally {
      releaseInFlight(claim);
    }
  },

  async logIn(email, password) {
    assertOnline();
    const normEmail = normalizeEmail(email);
    checkRateLimit("login", normEmail);
    const claim = claimInFlight("login", normEmail);
    try {
      const cred = await signInWithEmailAndPassword(auth, normEmail, password);
      recordSuccess("login", normEmail);
      return cred.user;
    } catch (err) {
      recordFailure("login", normEmail);
      throw err;
    } finally {
      releaseInFlight(claim);
    }
  },

  async loginWithGoogle() {
    assertOnline();
    const claim = claimInFlight("google", "popup");
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      return cred.user;
    } catch (err) {
      // Safe diagnostic: log only the error code and message, never tokens/credentials
      console.error("[TipidAuth] Google Sign-In failed", { code: err?.code, message: err?.message });
      throw err;
    } finally {
      releaseInFlight(claim);
    }
  },

  async resetPassword(email) {
    assertOnline();
    const normEmail = normalizeEmail(email);
    if (!EMAIL_RE.test(normEmail)) {
      const err = new Error("invalid-email");
      err.code = "auth/invalid-email";
      throw err;
    }
    checkRateLimit("resetPassword", normEmail);
    const claim = claimInFlight("resetPassword", normEmail);
    try {
      await withMinDuration(
        sendPasswordResetEmail(auth, normEmail, {
          // Sends the user back to your own login page (instead of the bare
          // firebaseapp.com action handler) once they've reset their password.
          url: `${window.location.origin}/login.html`,
          handleCodeInApp: false,
        }),
        700
      );
    } catch (err) {
      if (err.code !== "auth/user-not-found") {
        recordFailure("resetPassword", normEmail);
        throw err;
      }
      // Unregistered email: stay silent here too, so this endpoint can't be
      // used to figure out which addresses have accounts. Timing is
      // normalized by withMinDuration above so this branch can't be
      // distinguished from a real send by response speed either.
    } finally {
      releaseInFlight(claim);
    }
    recordSuccess("resetPassword", normEmail);
  },

  async logOut() {
    // Deliberately NOT gated by assertOnline() — logging out just clears the
    // locally-cached session, so it must keep working with zero connectivity.
    if (window.TipidData?.clearLocalCache) await window.TipidData.clearLocalCache();
    await signOut(auth);
  },

  // Returns an unsubscribe function. cb receives the Firebase user or null.
  onChange(cb) {
    return onAuthStateChanged(auth, cb);
  },

  // Added alias so both onAuthStateChanged and onChange work seamlessly across pages
  onAuthStateChanged(cb) {
    return onAuthStateChanged(auth, cb);
  },

  friendlyError,
  isOnline,

  // Resolves once persistence has been (attempted to be) set. Pages that
  // check login state the moment they load — e.g. "if no user, redirect to
  // login.html" — should `await window.TipidAuth.ready` first so they don't
  // race ahead of Firebase restoring the saved session.
  ready: persistenceReady,
};

// ---------------------------------------------------------------------------
// Network status broadcast
// ---------------------------------------------------------------------------
// Lets dashboard.html/bills.html/etc. react to connectivity changes (e.g.
// show/hide an "Offline mode" banner) without polling.
window.addEventListener("online", () => window.dispatchEvent(new CustomEvent("tipid-network-change", { detail: { online: true } })));
window.addEventListener("offline", () => window.dispatchEvent(new CustomEvent("tipid-network-change", { detail: { online: false } })));

window.dispatchEvent(new Event("tipid-auth-ready"));
