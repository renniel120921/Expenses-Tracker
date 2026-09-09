const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");

function loadAuth(signInWithPopupImpl) {
  const errors = [];
  const storage = new Map();
  const context = {
    app: {},
    getAuth: () => ({}),
    setPersistence: () => Promise.resolve(),
    browserLocalPersistence: {},
    createUserWithEmailAndPassword: async () => ({ user: {} }),
    signInWithEmailAndPassword: async () => ({ user: {} }),
    signOut: async () => {},
    sendPasswordResetEmail: async () => {},
    updateProfile: async () => {},
    GoogleAuthProvider: class {
      setCustomParameters() {}
    },
    signInWithPopup: (...args) => signInWithPopupImpl(...args),
    onAuthStateChanged: () => () => {},
    window: {
      addEventListener() {},
      dispatchEvent() {},
      location: { origin: "https://preview.example" },
    },
    location: { protocol: "https:", hostname: "preview.example" },
    navigator: { onLine: true },
    localStorage: {
      getItem: key => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
    },
    console: {
      error: (...args) => errors.push(args),
      warn() {},
    },
    CustomEvent: class {},
    Event: class {},
    Date,
    Error,
    Intl,
    JSON,
    Math,
    Object,
    Promise,
    Set,
    String,
    TypeError,
    setTimeout,
  };

  const source = fs.readFileSync(path.join(root, "firebase-auth.js"), "utf8")
    .replace(/import \{ app \} from "\.\/firebase\.js";\s*/, "")
    .replace(/import \{[\s\S]*?\} from "https:\/\/www\.gstatic\.com\/firebasejs\/10\.13\.0\/firebase-auth\.js";\s*/, "");

  vm.runInNewContext(source, context, { filename: "firebase-auth.js" });
  return { TipidAuth: context.window.TipidAuth, errors };
}

for (const code of ["auth/popup-closed-by-user", "auth/cancelled-popup-request"]) {
  test(`${code} is silent and returns without an authenticated user`, async () => {
    const cancellation = Object.assign(new Error("expected cancellation"), { code });
    const { TipidAuth, errors } = loadAuth(async () => { throw cancellation; });

    assert.equal(await TipidAuth.loginWithGoogle(), null);
    assert.deepEqual(errors, []);
  });
}

test("Google sign-in can be retried immediately after cancellation", async () => {
  let attempt = 0;
  const expectedUser = { uid: "test-user" };
  const { TipidAuth, errors } = loadAuth(async () => {
    attempt += 1;
    if (attempt === 1) {
      throw Object.assign(new Error("closed"), { code: "auth/popup-closed-by-user" });
    }
    return { user: expectedUser };
  });

  assert.equal(await TipidAuth.loginWithGoogle(), null);
  assert.equal(await TipidAuth.loginWithGoogle(), expectedUser);
  assert.equal(attempt, 2);
  assert.deepEqual(errors, []);
});

test("genuine Google Auth failures still use sanitized normal error handling", async () => {
  const failure = Object.assign(new Error("network unavailable"), {
    code: "auth/network-request-failed",
    credential: { accessToken: "must-not-be-logged" },
    user: { uid: "must-not-be-logged" },
  });
  const { TipidAuth, errors } = loadAuth(async () => { throw failure; });

  await assert.rejects(TipidAuth.loginWithGoogle(), err => err === failure);
  assert.equal(errors.length, 1);
  assert.equal(errors[0][0], "[TipidAuth] Google Sign-In failed");
  assert.deepEqual(Object.keys(errors[0][1]).sort(), ["code", "message"]);
  assert.equal(errors[0][1].code, "auth/network-request-failed");
  assert.equal(TipidAuth.friendlyError(failure.code), "Walang connection. Subukan ulit.");
});

test("auth pages stop before success UI and redirect when Google sign-in is cancelled", () => {
  for (const page of ["login.html", "signup.html"]) {
    const html = fs.readFileSync(path.join(root, page), "utf8");
    assert.match(
      html,
      /const user = await window\.TipidAuth\.loginWithGoogle\(\);\s*setLoading\(false\);\s*if \(!user\) return;\s*await swalSuccess/,
      page
    );
  }
});
