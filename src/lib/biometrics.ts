import { checkRateLimit, recordFailure, recordSuccess } from "./rateLimit";

const PBKDF2_ITERATIONS = 100_000;
const PIN_HASH_PREFIX = "v2$";

function bufferToBase64Url(buffer: ArrayBuffer | Uint8Array | null | undefined): string {
  if (!buffer) return "";
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function getCryptoSubtle(): SubtleCrypto | null {
  if (typeof globalThis !== "undefined" && globalThis.crypto?.subtle) {
    return globalThis.crypto.subtle;
  }
  if (typeof window !== "undefined" && window.crypto?.subtle) {
    return window.crypto.subtle;
  }
  return null;
}

function getRandomBytes(length: number): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(new ArrayBuffer(length));
  if (typeof globalThis !== "undefined" && globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(out);
  } else if (typeof window !== "undefined" && window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(out);
  }
  return out;
}

function constantTimeEqual(a: string, b: string): boolean {
  const len = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < len; i += 1) {
    const ca = i < a.length ? a.charCodeAt(i) : 0;
    const cb = i < b.length ? b.charCodeAt(i) : 0;
    diff |= ca ^ cb;
  }
  return diff === 0;
}

function base64UrlToBuffer(base64url: string): Uint8Array<ArrayBuffer> {
  if (!base64url) return new Uint8Array(new ArrayBuffer(0));
  let base64 = String(base64url).replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) base64 += "=";
  const binary = atob(base64);
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function isWebAuthnSupported(): boolean {
  if (typeof window === "undefined" || !window.isSecureContext) return false;
  if (typeof window.PublicKeyCredential === "undefined") return false;
  if (typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable !== "function") {
    return false;
  }
  const hostname = window.location.hostname || "";
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)) return false;
  return true;
}

export async function isPlatformBiometricsAvailable(): Promise<boolean> {
  try {
    if (!isWebAuthnSupported()) return false;
    return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

export function isBiometricEnabled(uid: string): boolean {
  if (!uid || typeof localStorage === "undefined") return false;
  try {
    return localStorage.getItem(`tipid_biometrics_enabled_${uid}`) === "true";
  } catch {
    return false;
  }
}

export function setBiometricEnabled(uid: string, enabled: boolean): void {
  if (!uid || typeof localStorage === "undefined") return;
  try {
    if (enabled) {
      localStorage.setItem(`tipid_biometrics_enabled_${uid}`, "true");
    } else {
      localStorage.removeItem(`tipid_biometrics_enabled_${uid}`);
      sessionStorage.removeItem(`tipid_biometrics_unlocked_${uid}`);
    }
  } catch {
    // ignore storage errors
  }
}

export function isSessionUnlocked(uid: string): boolean {
  if (!uid || typeof sessionStorage === "undefined") return true;
  if (!isBiometricEnabled(uid)) return true;
  try {
    return sessionStorage.getItem(`tipid_biometrics_unlocked_${uid}`) === "true";
  } catch {
    return false;
  }
}

export function setSessionUnlocked(uid: string, unlocked: boolean): void {
  if (!uid || typeof sessionStorage === "undefined") return;
  try {
    if (unlocked) {
      sessionStorage.setItem(`tipid_biometrics_unlocked_${uid}`, "true");
    } else {
      sessionStorage.removeItem(`tipid_biometrics_unlocked_${uid}`);
    }
  } catch {
    // ignore storage errors
  }
}

export function hasPasscode(uid: string): boolean {
  if (!uid || typeof localStorage === "undefined") return false;
  try {
    return Boolean(localStorage.getItem(`tipid_biometrics_pin_${uid}`));
  } catch {
    return false;
  }
}

async function derivePbkdf2Hash(
  subtle: SubtleCrypto,
  uid: string,
  pin: string,
  salt: Uint8Array<ArrayBuffer>
): Promise<string> {
  const enc = new TextEncoder();
  const baseKey = await subtle.importKey("raw", enc.encode(`${pin}__tipid__${uid}`), "PBKDF2", false, [
    "deriveBits"
  ]);
  const derived = await subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    baseKey,
    256
  );
  return `${PIN_HASH_PREFIX}${bufferToBase64Url(salt)}$${bufferToBase64Url(derived)}`;
}

async function legacyHashPin(subtle: SubtleCrypto, uid: string, pin: string): Promise<string> {
  const enc = new TextEncoder();
  const buf = await subtle.digest("SHA-256", enc.encode(`${pin}__tipid__${uid}`));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function setPasscode(uid: string, pin: string): Promise<boolean> {
  const subtle = getCryptoSubtle();
  if (!uid || !/^\d{4,8}$/.test(pin.trim()) || !subtle || typeof localStorage === "undefined") {
    return false;
  }
  try {
    const salt = getRandomBytes(16);
    const hash = await derivePbkdf2Hash(subtle, uid, pin.trim(), salt);
    localStorage.setItem(`tipid_biometrics_pin_${uid}`, hash);
    recordSuccess("pinUnlock", uid);
    return true;
  } catch {
    return false;
  }
}

export async function verifyPasscode(uid: string, pin: string): Promise<boolean> {
  if (!uid || !pin || typeof localStorage === "undefined") return false;
  checkRateLimit("pinUnlock", uid);

  const subtle = getCryptoSubtle();
  if (!subtle) return false;

  try {
    const stored = localStorage.getItem(`tipid_biometrics_pin_${uid}`);
    if (!stored) return false;

    const cleanPin = pin.trim();
    let matched = false;

    if (stored.startsWith(PIN_HASH_PREFIX)) {
      const parts = stored.slice(PIN_HASH_PREFIX.length).split("$");
      if (parts.length === 2 && parts[0] && parts[1]) {
        const saltBytes = base64UrlToBuffer(parts[0]);
        const expectedHash = await derivePbkdf2Hash(subtle, uid, cleanPin, saltBytes);
        matched = constantTimeEqual(stored, expectedHash);
      }
    } else if (/^[a-f0-9]{64}$/i.test(stored)) {
      const legacyDigest = await legacyHashPin(subtle, uid, cleanPin);
      matched = constantTimeEqual(stored, legacyDigest);
      if (matched) {
        // Transparently upgrade legacy single-round SHA-256 hash to salted PBKDF2
        const salt = getRandomBytes(16);
        const upgraded = await derivePbkdf2Hash(subtle, uid, cleanPin, salt);
        localStorage.setItem(`tipid_biometrics_pin_${uid}`, upgraded);
      }
    }

    if (matched) {
      recordSuccess("pinUnlock", uid);
      setSessionUnlocked(uid, true);
      return true;
    }

    recordFailure("pinUnlock", uid);
    return false;
  } catch {
    return false;
  }
}

export async function registerBiometrics(uid: string, email = "user@tipid.app"): Promise<boolean> {
  if (!isWebAuthnSupported()) {
    throw new Error("Biometric authentication requires HTTPS or localhost. Set a PIN Passcode instead.");
  }
  const available = await isPlatformBiometricsAvailable();
  if (!available) {
    throw new Error("No platform biometric sensor detected on this device. Set a PIN Passcode instead.");
  }

  const challenge = new Uint8Array(32);
  window.crypto.getRandomValues(challenge);
  const userId = new TextEncoder().encode(uid || "tipid_user");

  const credential = (await navigator.credentials.create({
    publicKey: {
      challenge,
      rp: { name: "Tipid Expense Tracker", id: window.location.hostname },
      user: {
        id: userId,
        name: email,
        displayName: email.split("@")[0] || "Tipid User"
      },
      pubKeyCredParams: [
        { type: "public-key", alg: -7 },
        { type: "public-key", alg: -257 }
      ],
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        userVerification: "preferred",
        residentKey: "preferred"
      },
      timeout: 60000
    }
  })) as PublicKeyCredential | null;

  if (!credential) return false;

  const credId = credential.rawId ? bufferToBase64Url(credential.rawId) : credential.id;
  if (credId) {
    localStorage.setItem(`tipid_biometrics_cred_id_${uid}`, credId);
  }
  setBiometricEnabled(uid, true);
  setSessionUnlocked(uid, true);
  return true;
}

export async function verifyBiometrics(uid: string): Promise<boolean | "prompt_pin"> {
  if (!uid || !isBiometricEnabled(uid)) return true;
  if (!isWebAuthnSupported()) {
    return hasPasscode(uid) ? "prompt_pin" : false;
  }

  const credId = localStorage.getItem(`tipid_biometrics_cred_id_${uid}`);
  if (!credId) {
    return hasPasscode(uid) ? "prompt_pin" : false;
  }

  const challenge = new Uint8Array(32);
  window.crypto.getRandomValues(challenge);
  const bytes = base64UrlToBuffer(credId);

  const assertion = await navigator.credentials.get({
    publicKey: {
      challenge,
      rpId: window.location.hostname,
      userVerification: "preferred",
      timeout: 60000,
      ...(bytes.length > 0
        ? { allowCredentials: [{ type: "public-key", id: bytes }] }
        : {})
    }
  });

  if (assertion) {
    setSessionUnlocked(uid, true);
    return true;
  }
  return false;
}

export function disableBiometrics(uid: string): void {
  if (!uid) return;
  setBiometricEnabled(uid, false);
  recordSuccess("pinUnlock", uid);
  try {
    localStorage.removeItem(`tipid_biometrics_cred_id_${uid}`);
    localStorage.removeItem(`tipid_biometrics_pin_${uid}`);
    sessionStorage.removeItem(`tipid_biometrics_unlocked_${uid}`);
  } catch {
    // ignore
  }
}
