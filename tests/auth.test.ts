import { describe, it, expect, beforeEach, vi } from "vitest";

const signInWithPopupMock = vi.fn();
const signInWithEmailAndPasswordMock = vi.fn();
const createUserWithEmailAndPasswordMock = vi.fn();
const sendPasswordResetEmailMock = vi.fn();

vi.mock("firebase/auth", () => ({
  getAuth: () => ({ currentUser: null }),
  setPersistence: () => Promise.resolve(),
  browserLocalPersistence: {},
  GoogleAuthProvider: class {
    setCustomParameters() {}
  },
  signInWithPopup: (...args: unknown[]) => signInWithPopupMock(...args),
  signInWithEmailAndPassword: (...args: unknown[]) => signInWithEmailAndPasswordMock(...args),
  createUserWithEmailAndPassword: (...args: unknown[]) => createUserWithEmailAndPasswordMock(...args),
  sendPasswordResetEmail: (...args: unknown[]) => sendPasswordResetEmailMock(...args),
  updateProfile: vi.fn(),
  deleteUser: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(() => () => {})
}));

import { friendlyError, logIn, loginWithGoogle, resetPassword, signUp } from "@/lib/auth";

describe("Authentication security and Google Sign-In resilience", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    signInWithPopupMock.mockReset();
    signInWithEmailAndPasswordMock.mockReset();
    createUserWithEmailAndPasswordMock.mockReset();
    sendPasswordResetEmailMock.mockReset();
  });

  it("handles cancelled Google popups quietly and allows subsequent retry", async () => {
    signInWithPopupMock
      .mockRejectedValueOnce({ code: "auth/popup-closed-by-user", message: "closed" })
      .mockRejectedValueOnce({ code: "auth/cancelled-popup-request", message: "cancelled" })
      .mockResolvedValueOnce({ user: { uid: "u123", email: "user@tipid.test" } });

    await expect(loginWithGoogle()).resolves.toBeNull();
    await expect(loginWithGoogle()).resolves.toBeNull();
    const user = await loginWithGoogle();
    expect(user?.uid).toBe("u123");
    expect(signInWithPopupMock).toHaveBeenCalledTimes(3);
  });

  it("logs sanitized failure metadata on real Google Sign-In errors", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    signInWithPopupMock.mockRejectedValueOnce({
      code: "auth/unauthorized-domain",
      message: "Domain not authorized",
      accessToken: "secret-should-not-log"
    });

    await expect(loginWithGoogle()).rejects.toMatchObject({ code: "auth/unauthorized-domain" });
    expect(errSpy).toHaveBeenCalledTimes(1);
    const logged = JSON.stringify(errSpy.mock.calls[0]);
    expect(logged).toContain("auth/unauthorized-domain");
    expect(logged).not.toContain("secret-should-not-log");
    errSpy.mockRestore();
  });

  it("blocks common passwords before contacting Firebase", async () => {
    await expect(signUp("Alex", "alex@tipid.test", "password")).rejects.toMatchObject({
      code: "app/common-password"
    });
    await expect(signUp("Alex", "alex@tipid.test", "password123")).rejects.toMatchObject({
      code: "app/common-password"
    });
    expect(createUserWithEmailAndPasswordMock).not.toHaveBeenCalled();
  });

  it("uses identical user-enumeration-safe messages for missing accounts and wrong passwords", () => {
    expect(friendlyError("auth/user-not-found")).toBe("Incorrect email or password.");
    expect(friendlyError("auth/wrong-password")).toBe("Incorrect email or password.");
    expect(friendlyError("auth/invalid-credential")).toBe("Incorrect email or password.");
  });

  it("enforces exponential client rate limiting after repeated failed logins", async () => {
    signInWithEmailAndPasswordMock.mockRejectedValue({ code: "auth/invalid-credential" });

    for (let i = 0; i < 5; i += 1) {
      await expect(logIn("rate@tipid.test", "wrongpass")).rejects.toMatchObject({
        code: "auth/invalid-credential"
      });
    }

    await expect(logIn("rate@tipid.test", "wrongpass")).rejects.toMatchObject({
      code: "app/rate-limited"
    });
    expect(signInWithEmailAndPasswordMock).toHaveBeenCalledTimes(5);
  });

  it("normalizes missing accounts silently in password reset", async () => {
    sendPasswordResetEmailMock.mockRejectedValueOnce({ code: "auth/user-not-found" });
    await expect(resetPassword("nobody@tipid.test")).resolves.toBeUndefined();
  });
});
