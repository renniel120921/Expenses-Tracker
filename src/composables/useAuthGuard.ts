import { ref, computed, onMounted, onUnmounted } from "vue";
import type { User, Unsubscribe } from "firebase/auth";
import { authPersistenceReady, getCachedUser, onAuthChange } from "@/lib/auth";
import { isBiometricEnabled, isSessionUnlocked, setSessionUnlocked } from "@/lib/biometrics";
import { sanitizeAvatarUrl, storageKey } from "@/lib/core";
import { loadUserLanguage } from "@/lib/i18n";
import type { CachedUserSnapshot } from "@/types/finance";

export interface AuthUserView {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  providerData?: User["providerData"];
  metadata?: User["metadata"];
}

export function useAuthGuard(options: { redirectWhenUnauthed?: boolean } = {}) {
  const redirectWhenUnauthed = options.redirectWhenUnauthed !== false;

  const cached = getCachedUser();
  const liveUser = ref<User | null>(null);
  const cachedSnap = ref<CachedUserSnapshot | null>(cached);
  const authReady = ref(false);
  const isOffline = ref(typeof navigator !== "undefined" ? navigator.onLine === false : false);
  const lockTrigger = ref(0);
  const userVersion = ref(0);

  function readLocalAvatar(uid: string): string {
    try {
      return sanitizeAvatarUrl(localStorage.getItem(storageKey(uid, "avatar")) || "");
    } catch {
      return "";
    }
  }

  const activeUser = computed<AuthUserView | null>(() => {
    void userVersion.value;
    if (liveUser.value) {
      return {
        uid: liveUser.value.uid,
        displayName: liveUser.value.displayName || "",
        email: liveUser.value.email || "",
        photoURL: sanitizeAvatarUrl(liveUser.value.photoURL || "") || readLocalAvatar(liveUser.value.uid),
        providerData: liveUser.value.providerData,
        metadata: liveUser.value.metadata
      };
    }
    if (cachedSnap.value) {
      return {
        uid: cachedSnap.value.uid,
        displayName: cachedSnap.value.displayName,
        email: cachedSnap.value.email,
        photoURL: sanitizeAvatarUrl(cachedSnap.value.photoURL || "") || readLocalAvatar(cachedSnap.value.uid)
      };
    }
    return null;
  });

  function refreshUserSnapshot(): void {
    cachedSnap.value = getCachedUser();
    userVersion.value += 1;
  }

  const isLocked = computed(() => {
    void lockTrigger.value;
    const uid = activeUser.value?.uid;
    if (!uid) return false;
    return isBiometricEnabled(uid) && !isSessionUnlocked(uid);
  });

  function unlockSession(): void {
    const uid = activeUser.value?.uid;
    if (!uid) return;
    setSessionUnlocked(uid, true);
    lockTrigger.value += 1;
  }

  let unsubAuth: Unsubscribe | null = null;
  const onOnline = () => { isOffline.value = false; };
  const onOffline = () => { isOffline.value = true; };

  onMounted(() => {
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    void authPersistenceReady.finally(() => {
      unsubAuth = onAuthChange((u) => {
        authReady.value = true;
        liveUser.value = u;
        if (u) {
          cachedSnap.value = {
            uid: u.uid,
            displayName: u.displayName || "",
            email: u.email || "",
            photoURL: u.photoURL || ""
          };
          loadUserLanguage(u.uid);
        } else {
          cachedSnap.value = null;
          if (redirectWhenUnauthed) {
            window.location.href = "login.html";
          }
        }
      });
    });
  });

  onUnmounted(() => {
    window.removeEventListener("online", onOnline);
    window.removeEventListener("offline", onOffline);
    unsubAuth?.();
  });

  return {
    liveUser,
    user: activeUser,
    authReady,
    isOffline,
    isLocked,
    unlockSession,
    refreshUserSnapshot
  };
}
