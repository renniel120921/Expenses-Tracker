import { ref } from "vue";

const STORAGE_KEY = "tipid:has-seen-welcome-tour-v2";

const isTourOpen = ref(false);

function hasSeenTour(): boolean {
  if (typeof window === "undefined" || !window.localStorage) return true;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function setTourSeen() {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, "true");
  } catch {
    // Ignore restricted storage environments
  }
}

export function useWelcomeTour() {
  function openTour() {
    isTourOpen.value = true;
  }

  function closeTour() {
    isTourOpen.value = false;
    setTourSeen();
  }

  function checkAutoOpen() {
    if (typeof window === "undefined") return;
    if (!hasSeenTour()) {
      // Small graceful delay so initial view settles smoothly before greeting
      window.setTimeout(() => {
        if (!hasSeenTour()) {
          isTourOpen.value = true;
        }
      }, 550);
    }
  }

  return {
    isTourOpen,
    openTour,
    closeTour,
    checkAutoOpen,
    hasSeenTour
  };
}
