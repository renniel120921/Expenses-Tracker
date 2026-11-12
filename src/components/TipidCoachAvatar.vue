<script setup lang="ts">
import { computed } from "vue";

export type CoachAvatarMood = "idle" | "thinking" | "speaking" | "happy" | "caution";
export type CoachAvatarSize = "xs" | "sm" | "md" | "lg";

const props = withDefaults(
  defineProps<{
    mood?: CoachAvatarMood;
    size?: CoachAvatarSize;
  }>(),
  {
    mood: "idle",
    size: "md"
  }
);

const sizeClass = computed(() => {
  if (props.size === "xs") return "h-7 w-7";
  if (props.size === "sm") return "h-9 w-9";
  if (props.size === "lg") return "h-14 w-14";
  return "h-12 w-12";
});
</script>

<template>
  <span
    :class="['tipid-coach-avatar', `mood-${mood}`, sizeClass]"
    aria-hidden="true"
  >
    <span class="tipid-coach-aura" />

    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      class="tipid-coach-svg h-full w-full"
      focusable="false"
    >
      <defs>
        <linearGradient id="tipidCoachBg" x1="8" y1="6" x2="56" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#E7F3EE" />
          <stop offset="100%" stop-color="#CDE4D8" />
        </linearGradient>
        <linearGradient id="tipidCoachShirt" x1="16" y1="45" x2="48" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#1A6E50" />
          <stop offset="100%" stop-color="#0E4733" />
        </linearGradient>
        <linearGradient id="tipidCoachHair" x1="18" y1="10" x2="46" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#352B26" />
          <stop offset="100%" stop-color="#1E1815" />
        </linearGradient>
        <clipPath id="tipidCoachCircle">
          <circle cx="32" cy="32" r="29" />
        </clipPath>
      </defs>

      <!-- Portrait Backdrop -->
      <circle cx="32" cy="32" r="29" fill="url(#tipidCoachBg)" />

      <g clip-path="url(#tipidCoachCircle)">
        <!-- Ambient Subtle Accent Rim -->
        <circle cx="32" cy="32" r="28" stroke="#146348" stroke-opacity="0.14" stroke-width="1.5" />

        <!-- Shoulders & Collar -->
        <g class="tipid-coach-body">
          <path
            d="M11 63C12.5 51.5 21 47 32 47C43 47 51.5 51.5 53 63H11Z"
            fill="url(#tipidCoachShirt)"
          />
          <path d="M26 47L32 53L38 47" fill="#F4F8F5" fill-opacity="0.92" />
          <!-- Neck -->
          <rect x="27.5" y="40.5" width="9" height="9" rx="4.5" fill="#DDA986" />
          <path d="M27.5 43.2C29 44.8 35 44.8 36.5 43.2V41H27.5V43.2Z" fill="#C98F6B" fill-opacity="0.55" />
        </g>

        <!-- Head Group -->
        <g class="tipid-coach-head">
          <!-- Back Hair -->
          <ellipse cx="32" cy="24" rx="15.8" ry="14.5" fill="#1F1916" />

          <!-- Ears -->
          <circle cx="17.2" cy="31" r="3.1" fill="#DDA986" />
          <circle cx="46.8" cy="31" r="3.1" fill="#DDA986" />

          <!-- Face Shape -->
          <path
            d="M18.2 26.5C18.2 19.2 24.1 14.2 32 14.2C39.9 14.2 45.8 19.2 45.8 26.5V30.6C45.8 38.4 39.7 43.8 32 43.8C24.3 43.8 18.2 38.4 18.2 30.6V26.5Z"
            fill="#EDC1A0"
          />

          <!-- Soft Cheek Warmth -->
          <ellipse cx="22.8" cy="33.8" rx="2.7" ry="1.5" fill="#E38B7B" fill-opacity="0.34" />
          <ellipse cx="41.2" cy="33.8" rx="2.7" ry="1.5" fill="#E38B7B" fill-opacity="0.34" />

          <!-- Front Stylized Hair -->
          <path
            d="M16.8 26.2C16.8 16.9 23.3 11 32.3 11C41 11 47.2 16.5 47.2 25.8C45.3 22 42.3 19.9 37.9 19.4C33.4 18.8 30.6 21.8 25.3 21.8C21.5 21.8 18.8 23.4 16.8 26.2Z"
            fill="url(#tipidCoachHair)"
          />
          <path
            d="M25.5 14.4C29.5 12.8 35.4 12.9 39.3 15"
            stroke="#594A43"
            stroke-opacity="0.55"
            stroke-width="1.3"
            stroke-linecap="round"
          />

          <!-- Eyebrows -->
          <path
            class="tipid-coach-brow tipid-coach-brow-left"
            d="M22.2 25.1C23.8 24 26.2 23.9 27.9 24.7"
            stroke="#2B221E"
            stroke-width="1.65"
            stroke-linecap="round"
          />
          <path
            class="tipid-coach-brow tipid-coach-brow-right"
            d="M36.1 24.7C37.8 23.9 40.2 24 41.8 25.1"
            stroke="#2B221E"
            stroke-width="1.65"
            stroke-linecap="round"
          />

          <!-- Eyes (Standard Blinking + Glance) -->
          <g v-if="mood !== 'happy'" class="tipid-coach-eyes">
            <g class="tipid-coach-eye">
              <ellipse cx="25.3" cy="29.3" rx="2.15" ry="2.35" fill="#FFFFFF" />
              <g class="tipid-coach-pupil">
                <circle cx="25.4" cy="29.4" r="1.45" fill="#1E1815" />
                <circle cx="26" cy="28.7" r="0.52" fill="#FFFFFF" />
              </g>
            </g>
            <g class="tipid-coach-eye">
              <ellipse cx="38.7" cy="29.3" rx="2.15" ry="2.35" fill="#FFFFFF" />
              <g class="tipid-coach-pupil">
                <circle cx="38.8" cy="29.4" r="1.45" fill="#1E1815" />
                <circle cx="39.4" cy="28.7" r="0.52" fill="#FFFFFF" />
              </g>
            </g>
          </g>

          <!-- Happy Smiling Eyes -->
          <g v-else class="tipid-coach-happy-eyes">
            <path
              d="M23.2 29.7C24 28.2 26.4 28.2 27.3 29.7"
              stroke="#1E1815"
              stroke-width="1.8"
              stroke-linecap="round"
            />
            <path
              d="M36.7 29.7C37.6 28.2 40 28.2 40.8 29.7"
              stroke="#1E1815"
              stroke-width="1.8"
              stroke-linecap="round"
            />
          </g>

          <!-- Modern Smart Glasses -->
          <g class="tipid-coach-glasses" stroke="#24352C" stroke-width="1.25">
            <rect
              x="20.6"
              y="26.3"
              width="9.4"
              height="6.4"
              rx="2.6"
              fill="#FFFFFF"
              fill-opacity="0.14"
            />
            <rect
              x="34"
              y="26.3"
              width="9.4"
              height="6.4"
              rx="2.6"
              fill="#FFFFFF"
              fill-opacity="0.14"
            />
            <path d="M30 29.2C31.1 28.6 32.9 28.6 34 29.2" stroke-linecap="round" />
          </g>

          <!-- Nose -->
          <path
            d="M32 30.8C32.4 32.4 32.7 33.4 31.3 33.9"
            stroke="#C78C68"
            stroke-width="1.35"
            stroke-linecap="round"
          />

          <!-- Mouth Expressions -->
          <g class="tipid-coach-mouth">
            <!-- Speaking Animated Mouth -->
            <g v-if="mood === 'speaking'" class="tipid-coach-mouth-speaking">
              <ellipse cx="32" cy="37.5" rx="3.1" ry="2.2" fill="#9E483E" />
              <path d="M29.7 36.7C30.8 36.3 33.2 36.3 34.3 36.7" stroke="#FFFFFF" stroke-width="0.95" stroke-linecap="round" />
            </g>

            <!-- Happy Open Grin -->
            <g v-else-if="mood === 'happy'">
              <path
                d="M27.6 36.2C28.8 39.2 35.2 39.2 36.4 36.2H27.6Z"
                fill="#A3493F"
              />
              <path d="M28.6 36.6H35.4" stroke="#FFFFFF" stroke-width="1.1" stroke-linecap="round" />
            </g>

            <!-- Thinking Mouth -->
            <circle
              v-else-if="mood === 'thinking'"
              cx="33.2"
              cy="37.4"
              r="1.35"
              fill="#A85A4D"
            />

            <!-- Caution / Concerned Mouth -->
            <path
              v-else-if="mood === 'caution'"
              d="M28.7 37.9C30.6 37 33.4 37 35.3 37.6"
              stroke="#9C4D43"
              stroke-width="1.75"
              stroke-linecap="round"
            />

            <!-- Idle Warm Friendly Smile -->
            <path
              v-else
              d="M28.2 36.7C29.8 38.7 34.2 38.7 35.8 36.7"
              stroke="#9E4B41"
              stroke-width="1.75"
              stroke-linecap="round"
            />
          </g>
        </g>
      </g>
    </svg>

    <!-- Subtle Floating Thinking Dots -->
    <span v-if="mood === 'thinking'" class="tipid-coach-think-dots">
      <span />
      <span />
      <span />
    </span>
  </span>
</template>

<style scoped>
.tipid-coach-avatar {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  flex-shrink: 0;
  transition: transform 0.22s ease;
}

.tipid-coach-aura {
  position: absolute;
  inset: -2px;
  border-radius: 9999px;
  border: 1.5px solid color-mix(in srgb, var(--accent) 40%, transparent);
  pointer-events: none;
  transition: border-color 0.25s ease, opacity 0.25s ease;
}

.mood-thinking .tipid-coach-aura {
  border-color: color-mix(in srgb, var(--accent) 65%, transparent);
}

.mood-speaking .tipid-coach-aura {
  border-color: color-mix(in srgb, var(--accent) 80%, transparent);
}

.mood-caution .tipid-coach-aura {
  border-color: color-mix(in srgb, var(--warning) 80%, transparent);
}

.mood-happy .tipid-coach-aura {
  border-color: color-mix(in srgb, var(--income) 75%, transparent);
}

.tipid-coach-head {
  transform-box: fill-box;
  transform-origin: center bottom;
  transition: transform 0.25s ease;
}

.tipid-coach-brow {
  transform-box: fill-box;
  transform-origin: center;
  transition: transform 0.25s ease;
}

.tipid-coach-eye {
  transform-box: fill-box;
  transform-origin: center;
}

.tipid-coach-pupil {
  transform-box: fill-box;
  transform-origin: center;
  transition: transform 0.25s ease;
}

.tipid-coach-mouth-speaking {
  transform-box: fill-box;
  transform-origin: center;
}

/* Expression poses (static clarity even under reduced-motion) */
.mood-thinking .tipid-coach-head {
  transform: rotate(-4deg);
}

.mood-thinking .tipid-coach-pupil {
  transform: translate(1.2px, -1.1px);
}

.mood-thinking .tipid-coach-brow-right {
  transform: translateY(-1.1px) rotate(-5deg);
}

.mood-caution .tipid-coach-brow-left {
  transform: translateY(-0.4px) rotate(-10deg);
}

.mood-caution .tipid-coach-brow-right {
  transform: translateY(-0.4px) rotate(10deg);
}

.mood-happy .tipid-coach-brow-left,
.mood-happy .tipid-coach-brow-right {
  transform: translateY(-1.2px);
}

/* Thinking Badge */
.tipid-coach-think-dots {
  position: absolute;
  top: -3px;
  right: -4px;
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px 5px;
  border-radius: 9999px;
  background: var(--bg-surface);
  border: 1px solid var(--border-strong);
  box-shadow: 0 2px 6px rgba(13, 22, 17, 0.14);
}

.tipid-coach-think-dots > span {
  width: 3px;
  height: 3px;
  border-radius: 9999px;
  background: var(--accent);
}

@media (prefers-reduced-motion: no-preference) {
  .tipid-coach-svg {
    animation: tipid-coach-breathe 3.8s ease-in-out infinite;
  }

  .tipid-coach-eye {
    animation: tipid-coach-blink 4.6s ease-in-out infinite;
  }

  .mood-speaking .tipid-coach-head {
    animation: tipid-coach-nod 1.15s ease-in-out infinite;
  }

  .mood-speaking .tipid-coach-mouth-speaking {
    animation: tipid-coach-talk 0.42s ease-in-out infinite;
  }

  .mood-speaking .tipid-coach-aura {
    animation: tipid-coach-ring-pulse 1.5s ease-in-out infinite;
  }

  .mood-thinking .tipid-coach-aura {
    animation: tipid-coach-ring-pulse 1.8s ease-in-out infinite;
  }

  .mood-thinking .tipid-coach-think-dots > span:nth-child(1) {
    animation: tipid-coach-dot-bounce 1s ease-in-out infinite 0s;
  }

  .mood-thinking .tipid-coach-think-dots > span:nth-child(2) {
    animation: tipid-coach-dot-bounce 1s ease-in-out infinite 0.16s;
  }

  .mood-thinking .tipid-coach-think-dots > span:nth-child(3) {
    animation: tipid-coach-dot-bounce 1s ease-in-out infinite 0.32s;
  }

  .mood-happy .tipid-coach-svg {
    animation: tipid-coach-celebrate 0.7s cubic-bezier(0.22, 1, 0.36, 1) 1;
  }
}

@keyframes tipid-coach-breathe {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-1px);
  }
}

@keyframes tipid-coach-blink {
  0%,
  90%,
  100% {
    transform: scaleY(1);
  }
  94% {
    transform: scaleY(0.08);
  }
}

@keyframes tipid-coach-talk {
  0%,
  100% {
    transform: scaleY(0.35) scaleX(1.08);
  }
  30% {
    transform: scaleY(1) scaleX(0.95);
  }
  58% {
    transform: scaleY(0.6) scaleX(1.02);
  }
  80% {
    transform: scaleY(1.12) scaleX(0.92);
  }
}

@keyframes tipid-coach-nod {
  0%,
  100% {
    transform: rotate(-1.5deg) translateY(0);
  }
  50% {
    transform: rotate(2deg) translateY(-1px);
  }
}

@keyframes tipid-coach-ring-pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.7;
  }
  50% {
    transform: scale(1.06);
    opacity: 1;
  }
}

@keyframes tipid-coach-dot-bounce {
  0%,
  80%,
  100% {
    transform: translateY(0);
    opacity: 0.45;
  }
  40% {
    transform: translateY(-2.5px);
    opacity: 1;
  }
}

@keyframes tipid-coach-celebrate {
  0% {
    transform: scale(1) translateY(0);
  }
  40% {
    transform: scale(1.07) translateY(-2px);
  }
  100% {
    transform: scale(1) translateY(0);
  }
}
</style>
