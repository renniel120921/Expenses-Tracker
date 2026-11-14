/**
 * @vitest-environment happy-dom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  humanizeForSpeech,
  scoreVoice,
  findCalmEnglishVoice,
  useCoachVoice
} from "@/composables/useCoachVoice";

class MockUtterance {
  text: string;
  lang = "en-US";
  rate = 1;
  pitch = 1;
  volume = 1;
  voice: unknown = null;
  onstart?: () => void;
  onend?: () => void;
  onerror?: () => void;
  onboundary?: (event: { name: string; charIndex: number; charLength?: number }) => void;
  constructor(text: string) {
    this.text = text;
  }
}

describe("humanizeForSpeech text pre-processor", () => {
  it("converts Philippine currency symbols into natural spoken pesos", () => {
    expect(humanizeForSpeech("Your bill is ₱1,750 scheduled today.")).toBe(
      "Your bill is 1,750 pesos scheduled today."
    );
    expect(humanizeForSpeech("Remaining balance: ₱150.00.")).toBe(
      "Remaining balance, 150.00 pesos."
    );
    expect(humanizeForSpeech("Total PHP 5,000 recorded.")).toBe(
      "Total 5,000 pesos recorded."
    );
  });

  it("expands acronyms and tech terms for clear, human articulation", () => {
    const input = "Pay via ATM, CVV verified, SMS receipt sent via GCash or BDO.";
    const result = humanizeForSpeech(input);
    expect(result).toContain("A-T-M");
    expect(result).toContain("C-V-V");
    expect(result).toContain("S-M-S");
    expect(result).toContain("G-Cash");
    expect(result).toContain("B-D-O");
  });

  it("humanizes ratios, 3D terms, and budget rules", () => {
    expect(humanizeForSpeech("Follow the 50/30/20 rule.")).toBe(
      "Follow the 50, 30, 20 rule."
    );
    expect(humanizeForSpeech("Tap any card to flip in 3D.")).toBe(
      "Tap any card to flip in 3-D."
    );
    expect(humanizeForSpeech("Budget is ₱200/day.")).toBe(
      "Budget is 200 pesos per day."
    );
  });

  it("replaces em-dashes and colons with natural breath pause commas", () => {
    expect(
      humanizeForSpeech("Ask for instant advice—with an editable confirmation card.")
    ).toBe("Ask for instant advice, with an editable confirmation card.");

    expect(
      humanizeForSpeech("Key benefits: zero passwords and complete privacy.")
    ).toBe("Key benefits, zero passwords and complete privacy.");
  });

  it("strips markdown symbols cleanly", () => {
    expect(humanizeForSpeech("**Important:** check _spending_.")).toBe(
      "Important, check spending."
    );
  });
});

describe("scoreVoice male voice prioritization & female exclusion", () => {
  it("strictly rejects female voices across iOS, Windows, and Android with large negative scores", () => {
    const samantha = { name: "Samantha", lang: "en-US", voiceURI: "Samantha" } as SpeechSynthesisVoice;
    const karen = { name: "Karen", lang: "en-AU", voiceURI: "Karen" } as SpeechSynthesisVoice;
    const aria = { name: "Microsoft Aria Online (Natural) - English", lang: "en-US", voiceURI: "AriaNatural" } as SpeechSynthesisVoice;
    const jenny = { name: "Microsoft Jenny Online (Natural) - English", lang: "en-US", voiceURI: "JennyNatural" } as SpeechSynthesisVoice;
    const zira = { name: "Microsoft Zira - English (United States)", lang: "en-US", voiceURI: "Zira" } as SpeechSynthesisVoice;
    const googleFemale = { name: "en-us-x-sfg-local", lang: "en-US", voiceURI: "en-us-x-sfg-local" } as SpeechSynthesisVoice;

    expect(scoreVoice(samantha)).toBeLessThanOrEqual(-10000);
    expect(scoreVoice(karen)).toBeLessThanOrEqual(-10000);
    expect(scoreVoice(aria)).toBeLessThanOrEqual(-10000);
    expect(scoreVoice(jenny)).toBeLessThanOrEqual(-10000);
    expect(scoreVoice(zira)).toBeLessThanOrEqual(-10000);
    expect(scoreVoice(googleFemale)).toBeLessThanOrEqual(-10000);
  });

  it("awards high positive scores to natural/neural human male voices", () => {
    const guy = {
      name: "Microsoft Guy Online (Natural) - English (United States)",
      lang: "en-US",
      voiceURI: "GuyNatural"
    } as SpeechSynthesisVoice;

    const ryan = {
      name: "Microsoft Ryan Online (Natural) - English (United States)",
      lang: "en-US",
      voiceURI: "RyanNatural"
    } as SpeechSynthesisVoice;

    const alex = {
      name: "Alex",
      lang: "en-US",
      voiceURI: "com.apple.speech.synthesis.voice.Alex"
    } as SpeechSynthesisVoice;

    const danielEnhanced = {
      name: "Daniel (Enhanced)",
      lang: "en-GB",
      voiceURI: "com.apple.speech.synthesis.voice.Daniel.enhanced"
    } as SpeechSynthesisVoice;

    const androidCloudMale = {
      name: "en-us-x-iom-network",
      lang: "en-US",
      voiceURI: "en-us-x-iom-network"
    } as SpeechSynthesisVoice;

    expect(scoreVoice(guy)).toBeGreaterThan(1000);
    expect(scoreVoice(ryan)).toBeGreaterThan(1000);
    expect(scoreVoice(alex)).toBeGreaterThan(1000);
    expect(scoreVoice(danielEnhanced)).toBeGreaterThan(1000);
    expect(scoreVoice(androidCloudMale)).toBeGreaterThan(1000);
  });

  it("awards standard positive scores to mobile on-device male voices", () => {
    const androidLocalMale1 = {
      name: "en-us-x-iom-local",
      lang: "en-US",
      voiceURI: "en-us-x-iom-local"
    } as SpeechSynthesisVoice;

    const androidLocalMale2 = {
      name: "en-us-x-iob-local",
      lang: "en-US",
      voiceURI: "en-us-x-iob-local"
    } as SpeechSynthesisVoice;

    const appleDaniel = {
      name: "Daniel",
      lang: "en-GB",
      voiceURI: "Daniel"
    } as SpeechSynthesisVoice;

    expect(scoreVoice(androidLocalMale1)).toBeGreaterThanOrEqual(500);
    expect(scoreVoice(androidLocalMale2)).toBeGreaterThanOrEqual(500);
    expect(scoreVoice(appleDaniel)).toBeGreaterThanOrEqual(500);
  });
});

describe("findCalmEnglishVoice device simulation", () => {
  let originalSpeechSynthesis: unknown;

  beforeEach(() => {
    originalSpeechSynthesis = (window as unknown as { speechSynthesis: unknown }).speechSynthesis;
  });

  afterEach(() => {
    (window as unknown as { speechSynthesis: unknown }).speechSynthesis = originalSpeechSynthesis;
  });

  it("simulates Android Phone: picks on-device Google Male voice over default female voice", () => {
    const androidVoices = [
      { name: "Google US English", lang: "en-US", voiceURI: "GoogleUSEnglish" },
      { name: "en-us-x-sfg-local", lang: "en-US", voiceURI: "en-us-x-sfg-local" },
      { name: "en-us-x-tpd-local", lang: "en-US", voiceURI: "en-us-x-tpd-local" },
      { name: "en-us-x-iom-local", lang: "en-US", voiceURI: "en-us-x-iom-local" },
      { name: "en-us-x-iob-local", lang: "en-US", voiceURI: "en-us-x-iob-local" }
    ] as SpeechSynthesisVoice[];

    (window as unknown as { speechSynthesis: unknown }).speechSynthesis = {
      getVoices: () => androidVoices
    };

    const selected = findCalmEnglishVoice();
    expect(selected.isExplicitMale).toBe(true);
    expect(selected.voice?.name).toBe("en-us-x-iom-local");
    expect(selected.voice?.name).not.toBe("Google US English");
    expect(selected.voice?.name).not.toBe("en-us-x-sfg-local");
  });

  it("simulates iPhone / iOS device: picks Alex or Daniel over Samantha", () => {
    const iosVoices = [
      { name: "Samantha", lang: "en-US", voiceURI: "Samantha" },
      { name: "Karen", lang: "en-AU", voiceURI: "Karen" },
      { name: "Daniel", lang: "en-GB", voiceURI: "Daniel" },
      { name: "Alex", lang: "en-US", voiceURI: "Alex" }
    ] as SpeechSynthesisVoice[];

    (window as unknown as { speechSynthesis: unknown }).speechSynthesis = {
      getVoices: () => iosVoices
    };

    const selected = findCalmEnglishVoice();
    expect(selected.isExplicitMale).toBe(true);
    expect(selected.voice?.name).toBe("Alex");
    expect(selected.voice?.name).not.toBe("Samantha");
    expect(selected.voice?.name).not.toBe("Karen");
  });

  it("simulates Windows PC: picks Microsoft Guy Online Natural over Aria or Jenny", () => {
    const windowsVoices = [
      { name: "Microsoft Aria Online (Natural) - English", lang: "en-US", voiceURI: "AriaNatural" },
      { name: "Microsoft Jenny Online (Natural) - English", lang: "en-US", voiceURI: "JennyNatural" },
      { name: "Microsoft Guy Online (Natural) - English (United States)", lang: "en-US", voiceURI: "GuyNatural" },
      { name: "Microsoft David", lang: "en-US", voiceURI: "David" }
    ] as SpeechSynthesisVoice[];

    (window as unknown as { speechSynthesis: unknown }).speechSynthesis = {
      getVoices: () => windowsVoices
    };

    const selected = findCalmEnglishVoice();
    expect(selected.isExplicitMale).toBe(true);
    expect(selected.voice?.name).toBe("Microsoft Guy Online (Natural) - English (United States)");
  });
});

describe("useCoachVoice speak with humanized male resonance", () => {
  const mockSynth = {
    speaking: false,
    cancel: vi.fn(),
    speak: vi.fn((utter: MockUtterance) => {
      utter.onstart?.();
    }),
    getVoices: vi.fn(() => [
      { name: "Microsoft Guy Online (Natural) - English (United States)", lang: "en-US", voiceURI: "GuyNatural" },
      { name: "Microsoft Jenny Online (Natural) - English", lang: "en-US", voiceURI: "JennyNatural" }
    ])
  };

  beforeEach(() => {
    (window as unknown as { speechSynthesis: typeof mockSynth }).speechSynthesis = mockSynth;
    (
      window as unknown as {
        SpeechSynthesisUtterance: typeof MockUtterance;
      }
    ).SpeechSynthesisUtterance = MockUtterance;
    mockSynth.cancel.mockClear();
    mockSynth.speak.mockClear();
  });

  it("speaks with natural human male resonance and expanded currency", () => {
    const { speak } = useCoachVoice();

    speak("Tipid balance is ₱2,500. Tap in 3D.");
    expect(mockSynth.speak).toHaveBeenCalledTimes(1);

    const callArg = mockSynth.speak.mock.calls[0][0] as MockUtterance;
    expect(callArg.text).toBe("Tipid balance is 2,500 pesos. Tap in 3-D.");
    expect(callArg.rate).toBeCloseTo(0.92);
    expect(callArg.pitch).toBeCloseTo(0.93);
    expect((callArg.voice as SpeechSynthesisVoice)?.name).toBe(
      "Microsoft Guy Online (Natural) - English (United States)"
    );
  });
});
