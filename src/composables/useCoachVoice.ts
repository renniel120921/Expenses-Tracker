import { ref } from "vue";

const STORAGE_MUTE_KEY = "tipid:voice-narration-muted";

const isSpeaking = ref(false);
const isMouthMoving = ref(false);
const currentSpokenText = ref("");
const currentWord = ref("");
const spokenCharIndex = ref(0);
const activeMessageId = ref<string | null>(null);

let wordTimer: ReturnType<typeof setTimeout> | null = null;
let timelineTimers: Array<ReturnType<typeof setTimeout>> = [];

interface AcousticWordEvent {
  word: string;
  charIndex: number;
  startMs: number;
  vocalizeMs: number;
  pauseMs: number;
}

function clearTimelineTimers() {
  if (wordTimer) {
    clearTimeout(wordTimer);
    wordTimer = null;
  }
  for (const t of timelineTimers) {
    clearTimeout(t);
  }
  timelineTimers = [];
}

/**
 * Estimates phonetic syllable count of an English word.
 */
function estimateSyllables(word: string): number {
  const clean = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!clean || clean.length <= 2) return 1;
  const matches = clean.match(/[aeiouy]{1,2}/g);
  let count = matches ? matches.length : 1;
  if (clean.endsWith("e") && !clean.endsWith("le") && count > 1) {
    count--;
  }
  return Math.max(1, Math.min(6, count));
}

/**
 * Builds an exact acoustic timeline of spoken words and natural human pauses
 * (commas, clause breaks, and sentence-ending breath pauses).
 */
function buildAcousticTimeline(
  text: string,
  rate = 0.94
): { events: AcousticWordEvent[]; totalDurationMs: number } {
  const events: AcousticWordEvent[] = [];
  const rateMultiplier = 1 / Math.max(0.6, Math.min(1.5, rate));

  const regex = /(\S+)/g;
  let match: RegExpExecArray | null;
  let currentMs = 80; // slight pre-speech breath pause

  while ((match = regex.exec(text)) !== null) {
    const rawToken = match[0];
    const charIndex = match.index;

    const endsWithSentenceEnd = /[.!?]+$/.test(rawToken);
    const endsWithClauseBreak = /[,;:\u2014\-]+$/.test(rawToken);

    const word = rawToken.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, "");
    if (!word) continue;

    const syllables = estimateSyllables(word);
    // Articulation duration proportional to syllables and letters
    const baseDuration = syllables * 118 + word.length * 13 + 65;
    const vocalizeMs = Math.round(
      Math.min(520, Math.max(170, baseDuration)) * rateMultiplier
    );

    let pauseMs: number;
    if (endsWithSentenceEnd) {
      // Natural human sentence boundary: mouth rests in calm smile
      pauseMs = Math.round(520 * rateMultiplier);
    } else if (endsWithClauseBreak) {
      // Clause / comma pause: mouth rests momentarily
      pauseMs = Math.round(280 * rateMultiplier);
    } else {
      // Normal inter-word gap between spoken words
      pauseMs = Math.round(65 * rateMultiplier);
    }

    events.push({
      word,
      charIndex,
      startMs: currentMs,
      vocalizeMs,
      pauseMs
    });

    currentMs += vocalizeMs + pauseMs;
  }

  return { events, totalDurationMs: currentMs };
}

function getInitialMuteState(): boolean {
  if (typeof window === "undefined" || !window.localStorage) return false;
  try {
    return window.localStorage.getItem(STORAGE_MUTE_KEY) === "true";
  } catch {
    return false;
  }
}

const isVoiceMuted = ref(getInitialMuteState());

function setMuteStorage(muted: boolean) {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    window.localStorage.setItem(STORAGE_MUTE_KEY, muted ? "true" : "false");
  } catch {
    // Ignore restricted environments
  }
}

let cachedVoices: SpeechSynthesisVoice[] = [];

function loadVoices(): SpeechSynthesisVoice[] {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return [];
  }
  try {
    const list = window.speechSynthesis.getVoices();
    if (list && list.length > 0) {
      cachedVoices = list;
    }
    return cachedVoices;
  } catch {
    return [];
  }
}

if (typeof window !== "undefined" && "speechSynthesis" in window) {
  try {
    window.speechSynthesis.onvoiceschanged = () => {
      loadVoices();
    };
    loadVoices();
  } catch {
    // Graceful fallback
  }
}

/**
 * Picks the highest-quality calm, natural English voice available in the browser.
 */
function findCalmEnglishVoice(): SpeechSynthesisVoice | null {
  const voices = cachedVoices.length > 0 ? cachedVoices : loadVoices();
  if (voices.length === 0) return null;

  // 1. Natural / Neural online voices (Edge, Chrome, Windows)
  const naturalMatch = voices.find(
    (v) =>
      v.lang.startsWith("en") &&
      (/\b(natural|neural|aria|jenny|guy|ryan)\b/i.test(v.name) ||
        /\b(natural|neural)\b/i.test(v.voiceURI))
  );
  if (naturalMatch) return naturalMatch;

  // 2. High quality Apple/macOS voices
  const appleMatch = voices.find(
    (v) =>
      v.lang.startsWith("en") &&
      /\b(samantha|daniel|karen|moira|alex|serena|oliver)\b/i.test(v.name)
  );
  if (appleMatch) return appleMatch;

  // 3. Google English voices
  const googleMatch = voices.find(
    (v) => v.lang.startsWith("en") && /\bgoogle\b/i.test(v.name)
  );
  if (googleMatch) return googleMatch;

  // 4. Any English voice
  const anyEnglish = voices.find((v) => v.lang.startsWith("en"));
  if (anyEnglish) return anyEnglish;

  return voices[0] || null;
}

export interface SpeakOptions {
  force?: boolean;
  rate?: number;
  pitch?: number;
  messageId?: string;
  onEnd?: () => void;
}

export function useCoachVoice() {
  const isSupported =
    typeof window !== "undefined" &&
    typeof window.speechSynthesis !== "undefined" &&
    typeof SpeechSynthesisUtterance !== "undefined";

  function clearTimers() {
    clearTimelineTimers();
  }

  function stop() {
    clearTimers();
    activeMessageId.value = null;
    isSpeaking.value = false;
    isMouthMoving.value = false;
    currentWord.value = "";
    spokenCharIndex.value = 0;
    if (!isSupported) return;
    try {
      window.speechSynthesis.cancel();
    } catch {
      // Ignore errors
    }
  }

  function speak(text: string, options?: SpeakOptions) {
    if (!isSupported) return;

    if (isVoiceMuted.value && !options?.force) {
      stop();
      return;
    }

    const cleanText = text.replace(/[*_#`~[\]]/g, "").trim();
    if (!cleanText) {
      stop();
      return;
    }

    try {
      stop();

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = "en-US";

      const preferredVoice = findCalmEnglishVoice();
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      // Calm, measured, reassuring cadence
      const targetRate = options?.rate ?? 0.94;
      utterance.rate = targetRate;
      utterance.pitch = options?.pitch ?? 0.98;
      utterance.volume = 1.0;

      activeMessageId.value = options?.messageId ?? null;
      currentSpokenText.value = cleanText;

      const { events, totalDurationMs } = buildAcousticTimeline(
        cleanText,
        targetRate
      );

      let nativeBoundaryFired = false;

      // Word boundary event (when supported natively by the browser OS voice)
      utterance.onboundary = (event: SpeechSynthesisEvent) => {
        if (event.name === "word") {
          nativeBoundaryFired = true;
          spokenCharIndex.value = event.charIndex;
          const remaining = cleanText.slice(event.charIndex);
          const wordMatch = remaining.match(/^[\w’']+/);
          const extractedWord = wordMatch
            ? wordMatch[0]
            : (event.charLength
                ? cleanText.slice(event.charIndex, event.charIndex + event.charLength).trim()
                : remaining.split(/\s+/)[0] || "");
          currentWord.value = extractedWord;

          isMouthMoving.value = true;
          if (wordTimer) clearTimeout(wordTimer);
          const wordLen = event.charLength || extractedWord.length || 5;
          const wordDuration = Math.min(420, Math.max(170, wordLen * 42));
          wordTimer = setTimeout(() => {
            isMouthMoving.value = false;
          }, wordDuration);
        }
      };

      utterance.onstart = () => {
        isSpeaking.value = true;
        clearTimelineTimers();

        // Schedule realistic human vocalization and pauses for every word and comma
        events.forEach((ev) => {
          // Word begins: mouth articulates actively
          const tStart = setTimeout(() => {
            if (!nativeBoundaryFired) {
              isMouthMoving.value = true;
              currentWord.value = ev.word;
              spokenCharIndex.value = ev.charIndex;
            }
          }, ev.startMs);

          // Word finishes: mouth closes and rests during inter-word gaps, commas, or periods
          const tEnd = setTimeout(() => {
            if (!nativeBoundaryFired) {
              isMouthMoving.value = false;
            }
          }, ev.startMs + ev.vocalizeMs);

          timelineTimers.push(tStart, tEnd);
        });

        // Speech completion safety timeout (in case browser fails to trigger onend)
        const tComplete = setTimeout(() => {
          isMouthMoving.value = false;
          if (
            typeof window !== "undefined" &&
            window.speechSynthesis &&
            !window.speechSynthesis.speaking
          ) {
            stop();
            options?.onEnd?.();
          }
        }, totalDurationMs + 300);

        timelineTimers.push(tComplete);
      };

      utterance.onend = () => {
        stop();
        options?.onEnd?.();
      };

      utterance.onerror = () => {
        stop();
        options?.onEnd?.();
      };

      window.speechSynthesis.speak(utterance);
    } catch {
      stop();
    }
  }

  function toggleMute() {
    isVoiceMuted.value = !isVoiceMuted.value;
    setMuteStorage(isVoiceMuted.value);
    if (isVoiceMuted.value) {
      stop();
    }
  }

  function isSpeakingMessage(id: string): boolean {
    return isSpeaking.value && activeMessageId.value === id;
  }

  return {
    isSupported,
    isSpeaking,
    isMouthMoving,
    isVoiceMuted,
    currentSpokenText,
    currentWord,
    spokenCharIndex,
    activeMessageId,
    speak,
    stop,
    toggleMute,
    isSpeakingMessage
  };
}
