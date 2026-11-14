/**
 * @vitest-environment happy-dom
 */
import { createApp, h, nextTick } from "vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import TipidWelcomeTour from "@/components/TipidWelcomeTour.vue";
import TipidCoachAvatar from "@/components/TipidCoachAvatar.vue";
import { useWelcomeTour } from "@/composables/useWelcomeTour";
import { useCoachVoice } from "@/composables/useCoachVoice";

class MockSpeechSynthesisUtterance {
  text: string;
  lang = "en-US";
  rate = 1;
  pitch = 1;
  volume = 1;
  voice: unknown = null;
  onstart?: () => void;
  onend?: () => void;
  onerror?: () => void;
  onboundary?: (event: { name: string; charIndex: number; charLength?: number; elapsedTime?: number }) => void;
  constructor(text: string) {
    this.text = text;
  }
}

const mockSpeechSynthesis = {
  speaking: false,
  cancel: vi.fn(),
  speak: vi.fn((utter: MockSpeechSynthesisUtterance) => {
    utter.onstart?.();
  }),
  getVoices: vi.fn(() => [
    { name: "Microsoft Jenny Online (Natural) - English", lang: "en-US", voiceURI: "JennyNatural" },
    { name: "Samantha", lang: "en-US", voiceURI: "Samantha" }
  ]),
  onvoiceschanged: null as (() => void) | null
};

describe("useWelcomeTour composable", () => {
  const STORAGE_KEY = "tipid:has-seen-welcome-tour-v2";

  beforeEach(() => {
    localStorage.clear();
    const { closeTour } = useWelcomeTour();
    closeTour();
    localStorage.removeItem(STORAGE_KEY);
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("defaults to tour not open and reports seen state from localStorage", () => {
    const { isTourOpen, hasSeenTour } = useWelcomeTour();
    expect(isTourOpen.value).toBe(false);
    expect(hasSeenTour()).toBe(false);

    localStorage.setItem(STORAGE_KEY, "true");
    expect(hasSeenTour()).toBe(true);
  });

  it("opens and closes the tour, updating localStorage when closed", () => {
    const { isTourOpen, openTour, closeTour, hasSeenTour } = useWelcomeTour();

    openTour();
    expect(isTourOpen.value).toBe(true);

    closeTour();
    expect(isTourOpen.value).toBe(false);
    expect(hasSeenTour()).toBe(true);
    expect(localStorage.getItem(STORAGE_KEY)).toBe("true");
  });

  it("checkAutoOpen triggers openTour if user has never seen it", async () => {
    vi.useFakeTimers();
    const { isTourOpen, checkAutoOpen } = useWelcomeTour();

    checkAutoOpen();
    expect(isTourOpen.value).toBe(false);

    vi.advanceTimersByTime(600);
    expect(isTourOpen.value).toBe(true);
    vi.useRealTimers();
  });

  it("checkAutoOpen skips opening if already seen in localStorage", () => {
    vi.useFakeTimers();
    localStorage.setItem(STORAGE_KEY, "true");
    const { isTourOpen, checkAutoOpen } = useWelcomeTour();

    checkAutoOpen();
    vi.advanceTimersByTime(600);
    expect(isTourOpen.value).toBe(false);
    vi.useRealTimers();
  });
});

describe("useCoachVoice composable", () => {
  const STORAGE_MUTE_KEY = "tipid:voice-narration-muted";

  beforeEach(() => {
    localStorage.clear();
    // Setup mock window.speechSynthesis
    (window as unknown as { speechSynthesis: typeof mockSpeechSynthesis }).speechSynthesis =
      mockSpeechSynthesis;
    (
      window as unknown as {
        SpeechSynthesisUtterance: typeof MockSpeechSynthesisUtterance;
      }
    ).SpeechSynthesisUtterance = MockSpeechSynthesisUtterance;
    mockSpeechSynthesis.cancel.mockClear();
    mockSpeechSynthesis.speak.mockClear();
  });

  afterEach(() => {
    const { stop } = useCoachVoice();
    stop();
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("detects speech synthesis support and manages mute preference in localStorage", () => {
    const { isSupported, isVoiceMuted, toggleMute } = useCoachVoice();
    expect(isSupported).toBe(true);
    expect(isVoiceMuted.value).toBe(false);

    toggleMute();
    expect(isVoiceMuted.value).toBe(true);
    expect(localStorage.getItem(STORAGE_MUTE_KEY)).toBe("true");

    toggleMute();
    expect(isVoiceMuted.value).toBe(false);
    expect(localStorage.getItem(STORAGE_MUTE_KEY)).toBe("false");
  });

  it("speaks calm professional English audio with proper rate and pitch", () => {
    const { speak, isSpeaking, stop } = useCoachVoice();

    speak("Welcome to Tipid. Master your finances.");
    expect(mockSpeechSynthesis.speak).toHaveBeenCalledTimes(1);

    const callArg = mockSpeechSynthesis.speak.mock.calls[0][0] as MockSpeechSynthesisUtterance;
    expect(callArg.text).toBe("Welcome to Tipid. Master your finances.");
    expect(callArg.lang).toBe("en-US");
    expect(callArg.rate).toBeCloseTo(0.94);
    expect(callArg.pitch).toBeCloseTo(0.98);
    expect(isSpeaking.value).toBe(true);

    stop();
    expect(mockSpeechSynthesis.cancel).toHaveBeenCalled();
    expect(isSpeaking.value).toBe(false);
  });

  it("synchronizes mouth movement timing with spoken word boundaries", () => {
    vi.useFakeTimers();
    const { speak, isMouthMoving, currentWord, stop } = useCoachVoice();

    speak("Welcome to Tipid");
    const utterance = mockSpeechSynthesis.speak.mock.calls[0][0] as MockSpeechSynthesisUtterance;
    expect(utterance.onboundary).toBeDefined();

    // Fire boundary for first word "Welcome" (charIndex 0)
    utterance.onboundary?.({ name: "word", charIndex: 0 });
    expect(isMouthMoving.value).toBe(true);
    expect(currentWord.value).toBe("Welcome");

    // Advance timer past word duration (word length 7 * 42 = 294ms)
    vi.advanceTimersByTime(350);
    expect(isMouthMoving.value).toBe(false);

    // Fire boundary for next word "to" (charIndex 8)
    utterance.onboundary?.({ name: "word", charIndex: 8 });
    expect(isMouthMoving.value).toBe(true);
    expect(currentWord.value).toBe("to");

    stop();
    vi.useRealTimers();
  });

  it("drives speech with acoustic prosody timeline when browser voice does not fire onboundary", () => {
    vi.useFakeTimers();
    const { speak, isMouthMoving, currentWord, stop } = useCoachVoice();

    speak("Welcome to Tipid. Master your money.");
    // Initial state before speech timeline fires
    expect(isMouthMoving.value).toBe(false);

    // First word "Welcome" begins at ~80ms
    vi.advanceTimersByTime(90);
    expect(isMouthMoving.value).toBe(true);
    expect(currentWord.value).toBe("Welcome");

    // Advance past "Welcome" vocalization duration into gap: mouth relaxes
    vi.advanceTimersByTime(450);
    expect(isMouthMoving.value).toBe(false);

    // Next word "to" starts
    vi.advanceTimersByTime(100);
    expect(isMouthMoving.value).toBe(true);
    expect(currentWord.value).toBe("to");

    stop();
    vi.useRealTimers();
  });
});

describe("TipidCoachAvatar.vue expression and speech animation", () => {
  let host: HTMLDivElement;

  beforeEach(() => {
    host = document.createElement("div");
    document.body.appendChild(host);
  });

  afterEach(() => {
    host.remove();
  });

  it("activates speaking mouth animation when isSpeaking prop is true", async () => {
    const app = createApp({
      render() {
        return h(TipidCoachAvatar, { mood: "happy", isSpeaking: true });
      }
    });
    app.mount(host);
    await nextTick();

    const avatar = host.querySelector(".tipid-coach-avatar");
    expect(avatar?.classList.contains("is-speaking-active")).toBe(true);

    const speakingMouth = host.querySelector(".tipid-coach-mouth-speaking");
    expect(speakingMouth).not.toBeNull();
    app.unmount();
  });

  it("keeps mouth completely still when isSpeaking is false even if mood is speaking", async () => {
    const app = createApp({
      render() {
        return h(TipidCoachAvatar, { mood: "speaking", isSpeaking: false, isMouthMoving: false });
      }
    });
    app.mount(host);
    await nextTick();

    const avatar = host.querySelector(".tipid-coach-avatar");
    expect(avatar?.classList.contains("is-mouth-moving")).toBe(false);
    expect(host.querySelector(".tipid-coach-mouth-speaking")).toBeNull();

    app.unmount();
  });

  it("distinguishes active mouth movement from speech pauses", async () => {
    const app = createApp({
      render() {
        return h(TipidCoachAvatar, { mood: "idle", isSpeaking: true, isMouthMoving: false });
      }
    });
    app.mount(host);
    await nextTick();

    const avatar = host.querySelector(".tipid-coach-avatar");
    expect(avatar?.classList.contains("is-speaking-active")).toBe(true);
    expect(avatar?.classList.contains("is-mouth-moving")).toBe(false);

    // Should NOT have active speaking mouth ellipse during pause
    expect(host.querySelector(".tipid-coach-mouth-speaking")).toBeNull();

    app.unmount();
  });

  it("activates is-mouth-moving when isMouthMoving prop is true", async () => {
    const app = createApp({
      render() {
        return h(TipidCoachAvatar, { mood: "idle", isSpeaking: true, isMouthMoving: true });
      }
    });
    app.mount(host);
    await nextTick();

    const avatar = host.querySelector(".tipid-coach-avatar");
    expect(avatar?.classList.contains("is-mouth-moving")).toBe(true);
    expect(host.querySelector(".tipid-coach-mouth-speaking")).not.toBeNull();

    app.unmount();
  });
});

describe("TipidWelcomeTour.vue interactive walkthrough component", () => {
  let host: HTMLDivElement;

  beforeEach(() => {
    host = document.createElement("div");
    document.body.appendChild(host);

    (window as unknown as { speechSynthesis: typeof mockSpeechSynthesis }).speechSynthesis =
      mockSpeechSynthesis;
    (
      window as unknown as {
        SpeechSynthesisUtterance: typeof MockSpeechSynthesisUtterance;
      }
    ).SpeechSynthesisUtterance = MockSpeechSynthesisUtterance;
    mockSpeechSynthesis.cancel.mockClear();
    mockSpeechSynthesis.speak.mockClear();

    if (!HTMLDialogElement.prototype.showModal) {
      HTMLDialogElement.prototype.showModal = function () {
        this.setAttribute("open", "");
      };
    }
    if (!HTMLDialogElement.prototype.close) {
      HTMLDialogElement.prototype.close = function () {
        this.removeAttribute("open");
        this.dispatchEvent(new Event("close"));
      };
    }
  });

  afterEach(() => {
    host.remove();
    const { closeTour } = useWelcomeTour();
    closeTour();
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("renders the 5-step walkthrough dialog, animates mascot moods & accessories, speaks narration, and closes on completion", async () => {
    const { openTour, isTourOpen } = useWelcomeTour();

    const app = createApp({
      render() {
        return h(TipidWelcomeTour);
      }
    });
    app.mount(host);

    openTour();
    await nextTick();
    await nextTick();

    const dialog = host.querySelector("dialog.tipid-welcome-dialog") as HTMLDialogElement | null;
    expect(dialog).not.toBeNull();
    expect(dialog?.hasAttribute("open") || (dialog as unknown as { open: boolean }).open).toBe(true);

    // Initial slide triggers speech synthesis
    expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
    const firstCall = mockSpeechSynthesis.speak.mock.calls[0][0] as MockSpeechSynthesisUtterance;
    expect(firstCall.text).toContain("Welcome to Tipid");

    // Slide 1: Welcome
    expect(host.textContent).toContain("Your Calm, Private Financial Companion");
    expect(host.querySelector(".tipid-prop-stars")).not.toBeNull();

    // Verify Live Speech Dialogue Card & 5-bar Equalizer are rendered
    expect(host.querySelector(".tipid-speech-bubble")).not.toBeNull();
    expect(host.querySelector(".tipid-live-equalizer")).not.toBeNull();
    expect(host.querySelectorAll(".tipid-live-equalizer .eq-bar").length).toBe(5);

    // Advance to Slide 2: Wallets & 3D cards
    const nextBtn = host.querySelector('button[data-tour-action="next"]') as HTMLButtonElement | null;
    expect(nextBtn).not.toBeNull();
    nextBtn?.click();
    await nextTick();

    expect(host.textContent).toContain("Real Philippine Banks & Digital Wallets");
    expect(host.querySelector(".tipid-prop-card")).not.toBeNull();

    // Advance to Slide 3: Smart Bills
    nextBtn?.click();
    await nextTick();
    expect(host.textContent).toContain("Schedule Bills with Live Card Deduction");
    expect(host.querySelector(".tipid-prop-bill")).not.toBeNull();

    // Advance to Slide 4: Safe-to-Spend & Plan
    nextBtn?.click();
    await nextTick();
    expect(host.textContent).toContain("Know Exactly What is Safe to Spend");
    expect(host.querySelector(".tipid-prop-piggy")).not.toBeNull();

    // Advance to Slide 5: Tipid Coach AI
    nextBtn?.click();
    await nextTick();
    expect(host.textContent).toContain("Meet Tipid Coach: Your Smart Ledger AI");
    expect(host.querySelector(".tipid-prop-ai")).not.toBeNull();
    expect(nextBtn?.textContent).toContain("Get Started");

    // Click Get Started on last slide -> closes dialog & tour
    nextBtn?.click();
    await nextTick();

    expect(isTourOpen.value).toBe(false);
    app.unmount();
  });

  it("allows skipping the walkthrough and toggling voice audio mute", async () => {
    const { openTour, isTourOpen } = useWelcomeTour();

    const app = createApp({
      render() {
        return h(TipidWelcomeTour);
      }
    });
    app.mount(host);

    openTour();
    await nextTick();
    await nextTick();

    // Check voice toggle button exists
    const voiceBtn = Array.from(host.querySelectorAll("button")).find(
      (b) => b.textContent?.includes("Voice") || b.textContent?.includes("Muted")
    );
    expect(voiceBtn).toBeDefined();

    const skipBtn = Array.from(host.querySelectorAll("button")).find(
      (b) => b.textContent?.trim() === "Skip" || b.textContent?.trim() === "Laktawan"
    );
    expect(skipBtn).toBeDefined();

    skipBtn?.click();
    await nextTick();

    expect(isTourOpen.value).toBe(false);
    app.unmount();
  });
});
