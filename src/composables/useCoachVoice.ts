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
    return cachedVoices;
  }
  try {
    const list = window.speechSynthesis.getVoices();
    if (list && list.length > 0) {
      cachedVoices = list;
      return list;
    }
    return cachedVoices;
  } catch {
    return cachedVoices;
  }
}

if (typeof window !== "undefined" && "speechSynthesis" in window) {
  try {
    const handleVoices = () => {
      loadVoices();
    };
    if (typeof window.speechSynthesis.addEventListener === "function") {
      window.speechSynthesis.addEventListener("voiceschanged", handleVoices);
    }
    window.speechSynthesis.onvoiceschanged = handleVoices;
    loadVoices();
  } catch {
    // Graceful fallback
  }
}

/**
 * Female voice markers and names to strictly reject or heavily penalize.
 * Ensures the coach voice never switches to a female voice on iOS (Samantha/Karen),
 * Android (Google female default / sfg / tpd), or Windows (Aria/Jenny/Zira).
 */
const FEMALE_VOICE_MARKERS = [
  "female",
  "woman",
  "girl",
  "zira",
  "aria",
  "jenny",
  "samantha",
  "karen",
  "moira",
  "serena",
  "victoria",
  "susan",
  "hazel",
  "catherine",
  "linda",
  "ava",
  "emma",
  "fiona",
  "tessa",
  "allison",
  "kendra",
  "kimberly",
  "salli",
  "joanna",
  "ivy",
  "amy",
  "nicole",
  "priti",
  "neerja",
  "aditi",
  "stephanie",
  "zoe",
  "en-us-x-sfg", // Google TTS female 1
  "en-us-x-tpd", // Google TTS female 2
  "en-us-x-tpc", // Google TTS female 3
  "en-us-x-tow", // Google TTS female 4
  "en-gb-x-fis", // Google UK female
  "en-gb-x-rfs"  // Google UK female
];

/**
 * Top tier natural/neural human male voices across Edge, Chrome, Apple, and Android.
 */
const TOP_TIER_MALE_VOICES = [
  "guy",                 // Microsoft Guy Online (Natural) - ultra-natural US male
  "ryan",                // Microsoft Ryan Online (Natural) - warm US male
  "christopher",         // Microsoft Christopher Online (Natural)
  "eric",                // Microsoft Eric Online (Natural)
  "brian",               // Microsoft Brian Online (Natural)
  "andrew",              // Microsoft Andrew Online (Natural)
  "steffan",             // Microsoft Steffan Online (Natural)
  "daniel (enhanced)",   // Apple iOS Enhanced Siri/Daniel
  "daniel (premium)",    // Apple iOS Premium Daniel
  "alex",                // Apple Alex (acoustic breathing synthesis, remarkably human)
  "en-us-x-iom-network", // Android Google Cloud Neural Male 1
  "en-us-x-iob-network"  // Android Google Cloud Neural Male 2
];

/**
 * Standard high-quality male voices across devices.
 */
const SECOND_TIER_MALE_VOICES = [
  "daniel",              // Apple Daniel (calm, warm gentleman)
  "oliver",              // Apple Oliver
  "arthur",              // Apple Arthur
  "aaron",               // Apple Aaron
  "gordon",              // Apple Gordon
  "en-us-x-iom",         // Android Google Male 1 (local)
  "en-us-x-iob",         // Android Google Male 2 (local)
  "en-us-x-iol",         // Android Google Male 3 (local)
  "en-gb-x-rjs",         // Android Google UK Male
  "en-au-x-aub",         // Android Google AU Male
  "male"                 // Any voice explicitly tagging gender as male
];

/**
 * Desktop classic male voices.
 */
const THIRD_TIER_MALE_VOICES = [
  "david",               // Microsoft David (Windows desktop male)
  "mark",                // Microsoft Mark
  "george",              // Microsoft George
  "fred"                 // Apple Fred
];

/**
 * Evaluates how authentically a voice represents a calm, human male financial coach.
 * Returns negative scores for female voices, high positive scores for natural male voices.
 */
export function scoreVoice(v: SpeechSynthesisVoice): number {
  if (!v.lang || !v.lang.toLowerCase().startsWith("en")) {
    return -99999;
  }

  const name = (v.name || "").toLowerCase();
  const uri = (v.voiceURI || "").toLowerCase();
  const combined = `${name} ${uri}`;

  // Strict rejection of female voices
  for (const marker of FEMALE_VOICE_MARKERS) {
    if (combined.includes(marker)) {
      return -10000;
    }
  }

  let score = 0;

  // Language affinity: US or PH English is most familiar to Filipino users
  if (v.lang.toLowerCase().startsWith("en-us") || v.lang.toLowerCase().startsWith("en-ph")) {
    score += 15;
  } else if (v.lang.toLowerCase().startsWith("en-gb")) {
    score += 10;
  }

  // Tier 1: Natural / Neural Male
  for (const male of TOP_TIER_MALE_VOICES) {
    if (combined.includes(male)) {
      score += 1000;
      break;
    }
  }

  // Tier 2: Standard Male
  for (const male of SECOND_TIER_MALE_VOICES) {
    if (combined.includes(male)) {
      score += 500;
      break;
    }
  }

  // Tier 3: Classic Male
  for (const male of THIRD_TIER_MALE_VOICES) {
    if (combined.includes(male)) {
      score += 200;
      break;
    }
  }

  // Bonus for natural/neural in name
  if (combined.includes("natural") || combined.includes("neural")) {
    score += 150;
  }

  // Bonus for network stream voices on Android
  if (combined.includes("network") || v.localService === false) {
    score += 80;
  }

  // Penalty for generic Android "Google US English" which defaults to female on mobile
  if (name === "google us english" || name === "google english") {
    score -= 100;
  }

  return score;
}

export interface SelectedVoiceInfo {
  voice: SpeechSynthesisVoice | null;
  isExplicitMale: boolean;
  score: number;
}

/**
 * Picks the highest-quality calm, natural English male voice available on the device.
 * Guaranteed to never pick a female voice if a male voice exists.
 */
export function findCalmEnglishVoice(): SelectedVoiceInfo {
  const voices = loadVoices();
  if (voices.length === 0) {
    return { voice: null, isExplicitMale: false, score: 0 };
  }

  const scored = voices
    .map((v) => ({ voice: v, score: scoreVoice(v) }))
    .sort((a, b) => b.score - a.score);

  const best = scored[0];
  if (!best) {
    return { voice: null, isExplicitMale: false, score: 0 };
  }

  // If top candidate has a positive male score, we have a verified male voice
  if (best.score > 0) {
    return { voice: best.voice, isExplicitMale: true, score: best.score };
  }

  // If all available voices on the device scored negative, pick the best English fallback
  const englishFallback = scored.find((s) => s.voice.lang.toLowerCase().startsWith("en"));
  if (englishFallback) {
    return { voice: englishFallback.voice, isExplicitMale: false, score: englishFallback.score };
  }

  return { voice: best.voice, isExplicitMale: false, score: best.score };
}

/**
 * Transforms raw text and Philippine financial tokens into natural, humanized spoken English.
 * Replaces symbols (₱, %, /) and acronyms (ATM, CVV, GCash) with fluent conversational phrasing.
 */
export function humanizeForSpeech(text: string): string {
  if (!text) return "";

  return text
    // Strip markdown formatting tokens
    .replace(/[*_#`~[\]]/g, "")
    // Convert list bullets to smooth breath pauses
    .replace(/^\s*[-•]\s*/gm, "")
    // Ratios & per units before currency replacement: e.g. 50/30/20, /day, /month
    .replace(/(\d+)\/(\d+)\/(\d+)/g, "$1, $2, $3")
    .replace(/\/([a-zA-Z]+)\b/g, " per $1")
    // Currency: Replace ₱1,500.00 with 1,500 pesos, ₱150 with 150 pesos
    .replace(/₱\s*(\d+(?:,\d{3})*(?:\.\d+)?)/g, "$1 pesos")
    .replace(/\bPHP\s*(\d+(?:,\d{3})*(?:\.\d+)?)/gi, "$1 pesos")
    .replace(/₱/g, " pesos ")
    // Pronunciation of Philippine banking & tech terms
    .replace(/\bATM\b/g, "A-T-M")
    .replace(/\bCVV\b/g, "C-V-V")
    .replace(/\bCVC\b/g, "C-V-C")
    .replace(/\bSMS\b/g, "S-M-S")
    .replace(/\bBDO\b/g, "B-D-O")
    .replace(/\bBPI\b/g, "B-P-I")
    .replace(/\b3D\b/gi, "3-D")
    .replace(/\bGCash\b/gi, "G-Cash")
    .replace(/\bGoTyme\b/gi, "Go-Tyme")
    .replace(/\bLandBank\b/gi, "Land-Bank")
    // Human breath pauses: em-dashes and colons to gentle comma pause
    .replace(/[—–]/g, ", ")
    .replace(/:\s+/g, ", ")
    // Ellipses to clean comma pause
    .replace(/\.{2,}/g, ", ")
    // Clean redundant commas or spaces
    .replace(/\s*,\s*,\s*/g, ", ")
    .replace(/\s+/g, " ")
    .trim();
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

    const cleanText = humanizeForSpeech(text);
    if (!cleanText) {
      stop();
      return;
    }

    try {
      stop();

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = "en-US";

      // Select natural male voice
      const selected = findCalmEnglishVoice();
      if (selected.voice) {
        utterance.voice = selected.voice;
      }

      // Calm, measured, reassuring human male cadence:
      // When a verified male voice is used:
      // Rate 0.92: calm, natural, unhurried, reassuring human cadence
      // Pitch 0.93: warm chest resonance, eliminates tinny/metallic computer frequencies
      // If no explicit male voice exists, default to 0.94 rate and 0.98 pitch
      const targetRate = options?.rate ?? (selected.isExplicitMale ? 0.92 : 0.94);
      const targetPitch = options?.pitch ?? (selected.isExplicitMale ? 0.93 : 0.98);

      utterance.rate = targetRate;
      utterance.pitch = targetPitch;
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
