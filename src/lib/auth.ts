import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  deleteUser,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  type User,
  type Unsubscribe
} from "firebase/auth";
import { app } from "./firebase";
import { clearLocalCache } from "./data";
import { setSessionUnlocked } from "./biometrics";
import { cleanText, sanitizeAvatarUrl } from "./core";
import {
  checkRateLimit as checkActionRateLimit,
  recordFailure,
  recordSuccess,
  type RateAction
} from "./rateLimit";
import type { CachedUserSnapshot } from "@/types/finance";

export const auth = getAuth(app);

export const authPersistenceReady = setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn("[TipidAuth] Failed to set browserLocalPersistence:", err);
});

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account"
});

const GOOGLE_POPUP_CANCELLATION_CODES = new Set([
  "auth/popup-closed-by-user",
  "auth/cancelled-popup-request"
]);

function isGooglePopupCancellation(err: unknown): boolean {
  const code = typeof err === "object" && err !== null && "code" in err ? String((err as { code: unknown }).code) : "";
  return GOOGLE_POPUP_CANCELLATION_CODES.has(code);
}

export class TipidAuthError extends Error {
  code: string;
  secondsLeft?: number;

  constructor(code: string, message = code, secondsLeft?: number) {
    super(message);
    this.code = code;
    this.secondsLeft = secondsLeft;
  }
}

function checkRateLimit(action: RateAction, ident: string): void {
  try {
    checkActionRateLimit(action, ident);
  } catch (err: unknown) {
    const secondsLeft =
      typeof err === "object" && err !== null && "secondsLeft" in err && typeof (err as { secondsLeft: unknown }).secondsLeft === "number"
        ? (err as { secondsLeft: number }).secondsLeft
        : undefined;
    throw new TipidAuthError("app/rate-limited", "rate-limited", secondsLeft);
  }
}

const inFlight = new Set<string>();

function claimInFlight(action: string, ident: string): string {
  const key = `${action}:${ident}`;
  if (inFlight.has(key)) {
    throw new TipidAuthError("app/in-flight", "in-flight");
  }
  inFlight.add(key);
  return key;
}

function releaseInFlight(key: string): void {
  inFlight.delete(key);
}

const COMMON_PASSWORDS = new Set([
  "123456",
  "password",
  "password123",
  "123456789",
  "12345678",
  "12345",
  "qwerty",
  "111111",
  "abc123",
  "password1",
  "iloveyou",
  "admin123",
  "letmein",
  "welcome",
  "monkey",
  "dragon",
  "123123",
  "000000",
  "qwerty123",
  "1q2w3e4r",
  "654321"
]);

export function isCommonPassword(password: string): boolean {
  return COMMON_PASSWORDS.has((password || "").toLowerCase());
}

const EMAIL_RE = /^\S+@\S+\.\S+$/;

function normalizeEmail(email: string): string {
  return (email || "").trim().toLowerCase();
}

export function isOnline(): boolean {
  return typeof navigator === "undefined" ? true : navigator.onLine !== false;
}

function assertOnline(): void {
  if (!isOnline()) {
    throw new TipidAuthError("app/offline", "offline");
  }
}

function formatWait(seconds: number): string {
  if (seconds < 60) return `${seconds} seconds`;
  return `${Math.ceil(seconds / 60)} minutes`;
}

function withMinDuration<T>(promise: Promise<T>, ms: number): Promise<T> {
  const floor = new Promise<void>((resolve) => setTimeout(resolve, ms));
  return Promise.allSettled([promise, floor]).then(([result]) => {
    if (result.status === "rejected") throw result.reason;
    return result.value;
  });
}

export function friendlyError(errOrCode: unknown): string {
  const obj = typeof errOrCode === "object" && errOrCode !== null ? (errOrCode as { code?: unknown; secondsLeft?: unknown }) : null;
  const code = typeof errOrCode === "string" ? errOrCode : String(obj?.code || "");
  const secondsLeft = typeof obj?.secondsLeft === "number" ? obj.secondsLeft : undefined;

  if (code === "app/offline") {
    return "You are offline. Reconnect to finish this action.";
  }
  if (code === "app/rate-limited") {
    return secondsLeft
      ? `Too many attempts. Try again in ${formatWait(secondsLeft)}.`
      : "Too many attempts. Try again later.";
  }
  if (code === "app/common-password") {
    return "This password is too common. Choose a stronger password.";
  }
  if (code === "app/in-flight") {
    return "Please wait — processing your previous request.";
  }

  const map: Record<string, string> = {
    "auth/email-already-in-use": "An account with this email already exists.",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/weak-password": "Password must be at least 6 characters long.",
    "auth/missing-password": "Please enter your password.",
    // Identical error for unregistered/wrong-password to prevent user enumeration
    "auth/user-not-found": "Incorrect email or password.",
    "auth/wrong-password": "Incorrect email or password.",
    "auth/invalid-credential": "Incorrect email or password.",
    "auth/too-many-requests": "Too many attempts. Please try again later.",
    "auth/popup-closed-by-user": "Google sign-in was cancelled.",
    "auth/popup-blocked": "Popup blocked by browser. Please allow popups for this site.",
    "auth/operation-not-supported-in-this-environment": "Google sign-in popup is not supported in this browser.",
    "auth/unauthorized-domain": "Unauthorized domain for Google sign-in.",
    "auth/network-request-failed": "Network error. Please check your connection and try again.",
    "auth/account-exists-with-different-credential": "An account exists with the same email using another sign-in method."
  };
  return map[code] || "Something went wrong. Please try again.";
}

const CACHED_USER_KEY = "tipid_auth_cached_user";

function cacheAuthUser(u: User | null): void {
  try {
    if (u && u.uid) {
      const snap: CachedUserSnapshot = {
        uid: u.uid,
        displayName: u.displayName || "",
        email: u.email || "",
        photoURL: sanitizeAvatarUrl(u.photoURL || "")
      };
      localStorage.setItem(CACHED_USER_KEY, JSON.stringify(snap));
    } else {
      localStorage.removeItem(CACHED_USER_KEY);
    }
  } catch {
    // ignore storage errors
  }
}

export function getCachedUser(): CachedUserSnapshot | null {
  try {
    const raw = localStorage.getItem(CACHED_USER_KEY);
    return raw ? (JSON.parse(raw) as CachedUserSnapshot) : null;
  } catch {
    return null;
  }
}

onAuthStateChanged(auth, (u) => {
  cacheAuthUser(u);
});

export async function signUp(name: string, email: string, password: string): Promise<User> {
  assertOnline();
  const normEmail = normalizeEmail(email);
  checkRateLimit("signUp", normEmail);
  if (isCommonPassword(password)) {
    throw new TipidAuthError("app/common-password", "common-password");
  }
  const claim = claimInFlight("signUp", normEmail);
  try {
    const cred = await createUserWithEmailAndPassword(auth, normEmail, password);
    if (name.trim()) {
      await updateProfile(cred.user, { displayName: name.trim() });
    }
    cacheAuthUser(cred.user);
    recordSuccess("signUp", normEmail);
    return cred.user;
  } catch (err) {
    recordFailure("signUp", normEmail);
    throw err;
  } finally {
    releaseInFlight(claim);
  }
}

export async function logIn(email: string, password: string): Promise<User> {
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
}

export async function loginWithGoogle(): Promise<User | null> {
  assertOnline();
  const claim = claimInFlight("google", "popup");
  try {
    const cred = await signInWithPopup(auth, googleProvider);
    return cred.user;
  } catch (err: unknown) {
    if (isGooglePopupCancellation(err)) return null;
    const code = typeof err === "object" && err !== null && "code" in err ? (err as { code?: unknown }).code : undefined;
    const message = typeof err === "object" && err !== null && "message" in err ? (err as { message?: unknown }).message : undefined;
    console.error("[TipidAuth] Google Sign-In failed", { code, message });
    throw err;
  } finally {
    releaseInFlight(claim);
  }
}

export async function resetPassword(email: string): Promise<void> {
  assertOnline();
  const normEmail = normalizeEmail(email);
  if (!EMAIL_RE.test(normEmail)) {
    throw new TipidAuthError("auth/invalid-email", "invalid-email");
  }
  checkRateLimit("resetPassword", normEmail);
  const claim = claimInFlight("resetPassword", normEmail);
  try {
    await withMinDuration(
      sendPasswordResetEmail(auth, normEmail, {
        url: `${window.location.origin}/login.html`,
        handleCodeInApp: false
      }),
      700
    );
  } catch (err: unknown) {
    const code = typeof err === "object" && err !== null && "code" in err ? String((err as { code?: unknown }).code) : "";
    if (code !== "auth/user-not-found") {
      recordFailure("resetPassword", normEmail);
      throw err;
    }
    // Timing normalized silent branch for unregistered addresses
  } finally {
    releaseInFlight(claim);
  }
  recordSuccess("resetPassword", normEmail);
}

export async function updateUserProfile(updates: { displayName?: string; photoURL?: string }): Promise<void> {
  assertOnline();
  const user = auth.currentUser;
  if (!user) throw new Error("No authenticated user");
  const safeUpdates: { displayName?: string; photoURL?: string } = {};
  if (updates.displayName !== undefined) {
    safeUpdates.displayName = cleanText(updates.displayName, "Display name", 80);
  }
  if (updates.photoURL !== undefined) {
    safeUpdates.photoURL = updates.photoURL ? sanitizeAvatarUrl(updates.photoURL) : "";
  }
  await updateProfile(user, safeUpdates);
  cacheAuthUser(user);
}

export async function deleteCurrentUser(): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("No authenticated user");
  setSessionUnlocked(user.uid, false);
  cacheAuthUser(null);
  await deleteUser(user);
}

export async function logOut(): Promise<void> {
  const uid = auth.currentUser?.uid || getCachedUser()?.uid;
  if (uid) setSessionUnlocked(uid, false);
  cacheAuthUser(null);
  await clearLocalCache();
  await signOut(auth);
}

export function onAuthChange(cb: (user: User | null) => void): Unsubscribe {
  return onAuthStateChanged(auth, cb);
}
