<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
  type ComponentPublicInstance
} from "vue";
import {
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Layers,
  LayoutGrid,
  Plus,
  Search,
  ShieldCheck,
  X
} from "@lucide/vue";
import WalletCard from "@/components/WalletCard.vue";
import { useI18n } from "@/lib/i18n";
import {
  buildWalletDeckItems,
  computeCenteredSlideScrollLeft,
  filterWalletDeckItems,
  findNearestSlideIndex,
  getAvailableWalletKinds,
  resolveStepTargetIndex,
  type WalletDeckItem,
  type WalletDeckKindFilter,
  type WalletDeckViewMode
} from "@/lib/walletDeck";
import type { WalletKind } from "@/lib/walletVisuals";

const props = withDefaults(
  defineProps<{
    wallets: string[];
    walletBalances: Record<string, number>;
    totalPositiveBalance: number;
    balanceHidden?: boolean;
  }>(),
  {
    balanceHidden: false
  }
);

const emit = defineEmits<{
  (e: "add"): void;
  (e: "edit", method: string): void;
}>();

const { t, isTl } = useI18n();

const viewMode = ref<WalletDeckViewMode>("deck");
const kindFilter = ref<WalletDeckKindFilter>("all");
const searchQuery = ref("");
const activeIndex = ref(0);
const isDeckScrollable = ref(false);
const settledAnnouncement = ref("");

const trackRef = ref<HTMLElement | null>(null);
const pillNavRef = ref<HTMLElement | null>(null);
const slideRefs = ref<Array<HTMLElement | null>>([]);
const pillRefs = ref<Array<HTMLElement | null>>([]);

let pendingTargetIndex: number | null = null;
let pendingFromUser = false;
let lastAnnouncedIndex = -1;
let scrollRafId: number | null = null;
let scrollSettleTimer: number | null = null;
let resizeObserver: ResizeObserver | null = null;
let trackResizeAttached = false;
let supportsScrollEnd = false;
let supportsViewTimeline = false;

const deckItems = computed(() => buildWalletDeckItems(props.wallets, props.walletBalances));
const availableKinds = computed(() => getAvailableWalletKinds(deckItems.value));
const filteredItems = computed(() =>
  filterWalletDeckItems(deckItems.value, kindFilter.value, searchQuery.value)
);

const showDiscoveryTools = computed(() => deckItems.value.length >= 4);
const hasActiveFilters = computed(
  () => kindFilter.value !== "all" || searchQuery.value.trim().length > 0
);
const showQuickJumpNav = computed(
  () =>
    viewMode.value === "deck" &&
    (filteredItems.value.length >= 3 ||
      (filteredItems.value.length >= 2 && isDeckScrollable.value))
);

const isPrevDisabled = computed(() => {
  const count = filteredItems.value.length;
  if (count <= 1) return true;
  if (count >= 3) return false;
  return activeIndex.value <= 0;
});

const isNextDisabled = computed(() => {
  const count = filteredItems.value.length;
  if (count <= 1) return true;
  if (count >= 3) return false;
  return activeIndex.value >= count - 1;
});

const deckTrackLabel = computed(() =>
  isTl.value ? "Mga card at wallet" : "Accounts and wallet cards"
);
const prevButtonLabel = computed(() =>
  isTl.value ? "Nakaraang card" : "Previous card"
);
const nextButtonLabel = computed(() =>
  isTl.value ? "Susunod na card" : "Next card"
);
const chooseCardLabel = computed(() =>
  isTl.value ? "Pumili ng card" : "Choose a card"
);
const searchPlaceholder = computed(() =>
  isTl.value ? "Hanapin card o huling 4..." : "Find card, bank, last 4..."
);

function getKindFilterLabel(kind: WalletDeckKindFilter): string {
  if (kind === "all") return isTl.value ? "Lahat" : "All";
  if (kind === "ewallet") return "E-Wallets";
  if (kind === "digital") return "Digital";
  if (kind === "bank") return isTl.value ? "Bangko" : "Banks";
  return "Cash";
}

function getKindCount(kind: WalletDeckKindFilter): number {
  if (kind === "all") return deckItems.value.length;
  let total = 0;
  for (const item of deckItems.value) {
    if (item.visual.kind === kind) total += 1;
  }
  return total;
}

function getSlideAriaLabel(item: WalletDeckItem, idx: number): string {
  const total = filteredItems.value.length;
  const posText = isTl.value ? `${idx + 1} sa ${total}` : `${idx + 1} of ${total}`;
  return `${posText}: ${item.visual.displayName} (${item.visual.kindLabel})`;
}

function resolveElement(el: Element | ComponentPublicInstance | null): HTMLElement | null {
  if (!el) return null;
  if (el instanceof HTMLElement) return el;
  if ("$el" in el && el.$el instanceof HTMLElement) return el.$el;
  return null;
}

function setSlideRef(el: Element | ComponentPublicInstance | null, index: number) {
  slideRefs.value[index] = resolveElement(el);
}

function setPillRef(el: Element | ComponentPublicInstance | null, index: number) {
  pillRefs.value[index] = resolveElement(el);
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getOrderedSlides(): HTMLElement[] {
  const count = filteredItems.value.length;
  const list: HTMLElement[] = [];
  for (let i = 0; i < count; i += 1) {
    const el = slideRefs.value[i];
    if (el) list.push(el);
  }
  return list;
}

function measureDeckScrollability() {
  const track = trackRef.value;
  if (!track || viewMode.value !== "deck") {
    isDeckScrollable.value = false;
    return;
  }
  isDeckScrollable.value = track.scrollWidth - track.clientWidth > 4;
}

function centerQuickJumpPill(index: number) {
  const nav = pillNavRef.value;
  const pill = pillRefs.value[index];
  if (!nav || !pill) return;

  const maxLeft = Math.max(0, nav.scrollWidth - nav.clientWidth);
  if (maxLeft <= 0) return;

  const left = computeCenteredSlideScrollLeft({
    slideOffsetLeft: pill.offsetLeft,
    slideWidth: pill.clientWidth,
    trackClientWidth: nav.clientWidth,
    maxScrollLeft: maxLeft
  });

  nav.scrollTo({
    left,
    behavior: prefersReducedMotion() ? "auto" : "smooth"
  });
}

function announceSettledSlide(index: number) {
  const item = filteredItems.value[index];
  if (!item) return;
  const total = filteredItems.value.length;
  if (index === lastAnnouncedIndex) return;
  lastAnnouncedIndex = index;
  settledAnnouncement.value = isTl.value
    ? `Card ${index + 1} sa ${total}: ${item.visual.displayName}`
    : `Card ${index + 1} of ${total}: ${item.visual.displayName}`;
}

function finalizeScrollSettled(fromUser = true) {
  const track = trackRef.value;
  const slides = getOrderedSlides();
  if (!track || !slides.length) {
    pendingTargetIndex = null;
    pendingFromUser = false;
    return;
  }

  const settledIndex =
    pendingTargetIndex !== null
      ? pendingTargetIndex
      : findNearestSlideIndex(slides, track.scrollLeft, track.clientWidth);

  const clamped = Math.max(0, Math.min(filteredItems.value.length - 1, settledIndex));
  const shouldAnnounce = fromUser || pendingFromUser;

  pendingTargetIndex = null;
  pendingFromUser = false;

  if (clamped !== activeIndex.value) {
    activeIndex.value = clamped;
  }
  centerQuickJumpPill(clamped);

  if (shouldAnnounce) {
    announceSettledSlide(clamped);
  }
}

function clearSettleTimer() {
  if (scrollSettleTimer !== null) {
    window.clearTimeout(scrollSettleTimer);
    scrollSettleTimer = null;
  }
}

function scheduleFallbackSettle(delayMs = 140) {
  clearSettleTimer();
  scrollSettleTimer = window.setTimeout(() => {
    scrollSettleTimer = null;
    finalizeScrollSettled(true);
  }, delayMs);
}

function onTrackScroll() {
  if (pendingTargetIndex === null) {
    pendingFromUser = true;
  }

  if (scrollRafId === null) {
    scrollRafId = window.requestAnimationFrame(() => {
      scrollRafId = null;
      const track = trackRef.value;
      const slides = getOrderedSlides();
      if (!track || !slides.length) return;

      // Skip live marker updates while a scripted smooth scroll is in flight so
      // markers stay pinned to the user's chosen target without Safari stutter.
      if (pendingTargetIndex !== null) return;

      const nearest = findNearestSlideIndex(slides, track.scrollLeft, track.clientWidth);
      if (nearest !== activeIndex.value) {
        activeIndex.value = nearest;
        centerQuickJumpPill(nearest);
      }
    });
  }

  if (!supportsScrollEnd) {
    scheduleFallbackSettle(140);
  }
}

function onTrackScrollEnd() {
  clearSettleTimer();
  finalizeScrollSettled(true);
}

function scrollToSlide(index: number, fromUser = true) {
  const track = trackRef.value;
  const count = filteredItems.value.length;
  if (!track || !count) return;

  const targetIndex = Math.max(0, Math.min(count - 1, index));
  const targetSlide = slideRefs.value[targetIndex];
  if (!targetSlide) return;

  pendingTargetIndex = targetIndex;
  pendingFromUser = fromUser;

  if (targetIndex !== activeIndex.value) {
    activeIndex.value = targetIndex;
  }
  centerQuickJumpPill(targetIndex);

  const maxLeft = Math.max(0, track.scrollWidth - track.clientWidth);
  const left = computeCenteredSlideScrollLeft({
    slideOffsetLeft: targetSlide.offsetLeft,
    slideWidth: targetSlide.clientWidth,
    trackClientWidth: track.clientWidth,
    maxScrollLeft: maxLeft
  });

  if (Math.abs(track.scrollLeft - left) <= 2) {
    clearSettleTimer();
    window.requestAnimationFrame(() => finalizeScrollSettled(fromUser));
    return;
  }

  const instant = prefersReducedMotion();
  track.scrollTo({
    left,
    behavior: instant ? "auto" : "smooth"
  });

  if (instant || !supportsScrollEnd) {
    scheduleFallbackSettle(instant ? 40 : 160);
  }
}

function stepSlide(delta: -1 | 1) {
  const count = filteredItems.value.length;
  if (count <= 1) return;
  const baseIndex = pendingTargetIndex !== null ? pendingTargetIndex : activeIndex.value;
  const nextIndex = resolveStepTargetIndex(baseIndex, delta, count);
  scrollToSlide(nextIndex, true);
}

function onSlideClick(event: MouseEvent, idx: number) {
  if (viewMode.value !== "deck" || !isDeckScrollable.value) return;
  const target = event.target as HTMLElement | null;
  if (target?.closest("button, a, input, select, textarea")) return;
  if (idx !== activeIndex.value) {
    scrollToSlide(idx, true);
  }
}

function onTrackKeydown(event: KeyboardEvent) {
  if (viewMode.value !== "deck" || filteredItems.value.length <= 1) return;
  const target = event.target as HTMLElement | null;
  if (target?.closest("button, a, input, select, textarea")) return;

  if (event.key === "ArrowRight") {
    event.preventDefault();
    stepSlide(1);
  } else if (event.key === "ArrowLeft") {
    event.preventDefault();
    stepSlide(-1);
  } else if (event.key === "Home") {
    event.preventDefault();
    scrollToSlide(0, true);
  } else if (event.key === "End") {
    event.preventDefault();
    scrollToSlide(filteredItems.value.length - 1, true);
  }
}

function clearFilters() {
  kindFilter.value = "all";
  searchQuery.value = "";
}

function syncTrackBindings() {
  const track = trackRef.value;
  if (!track) return;

  if (!trackResizeAttached && typeof ResizeObserver !== "undefined") {
    resizeObserver?.disconnect();
    resizeObserver = new ResizeObserver(() => {
      measureDeckScrollability();
    });
    resizeObserver.observe(track);
    trackResizeAttached = true;
  }
  measureDeckScrollability();
}

watch([kindFilter, searchQuery], async () => {
  pendingTargetIndex = null;
  pendingFromUser = false;
  activeIndex.value = 0;
  lastAnnouncedIndex = -1;
  slideRefs.value.length = filteredItems.value.length;
  pillRefs.value.length = filteredItems.value.length;

  await nextTick();
  if (trackRef.value) {
    trackRef.value.scrollTo({ left: 0, behavior: "auto" });
  }
  syncTrackBindings();
});

watch(
  () => [...props.wallets],
  async (nextWallets, prevWallets = []) => {
    // Drop unavailable kind selection if user deletes the last wallet of that kind
    if (kindFilter.value !== "all" && !availableKinds.value.includes(kindFilter.value as WalletKind)) {
      kindFilter.value = "all";
    }

    const prevSet = new Set(prevWallets);
    const addedWallet = nextWallets.find((w) => !prevSet.has(w));

    slideRefs.value.length = filteredItems.value.length;
    pillRefs.value.length = filteredItems.value.length;

    await nextTick();
    syncTrackBindings();

    if (viewMode.value !== "deck" || !filteredItems.value.length) return;

    if (addedWallet) {
      const addedIdx = filteredItems.value.findIndex((item) => item.method === addedWallet);
      if (addedIdx >= 0) {
        scrollToSlide(addedIdx, false);
        return;
      }
    }

    const clamped = Math.max(0, Math.min(filteredItems.value.length - 1, activeIndex.value));
    if (clamped !== activeIndex.value) {
      scrollToSlide(clamped, false);
    }
  }
);

watch(
  () => viewMode.value,
  async (mode) => {
    if (mode === "deck") {
      trackResizeAttached = false;
      await nextTick();
      syncTrackBindings();
      if (activeIndex.value > 0) {
        scrollToSlide(activeIndex.value, false);
      }
    } else {
      resizeObserver?.disconnect();
      trackResizeAttached = false;
      isDeckScrollable.value = false;
    }
  }
);

onMounted(async () => {
  supportsScrollEnd = typeof window !== "undefined" && "onscrollend" in window;
  supportsViewTimeline =
    typeof CSS !== "undefined" &&
    typeof CSS.supports === "function" &&
    CSS.supports("(animation-timeline: view()) and (animation-range: entry)");

  await nextTick();
  syncTrackBindings();
});

onBeforeUnmount(() => {
  if (scrollRafId !== null) {
    window.cancelAnimationFrame(scrollRafId);
    scrollRafId = null;
  }
  clearSettleTimer();
  resizeObserver?.disconnect();
  resizeObserver = null;
});
</script>

<template>
  <section
    id="accounts-section"
    aria-roledescription="carousel"
    :aria-label="t.walletsHeading"
    class="scroll-mt-24 space-y-3"
  >
    <!-- Header Bar -->
    <div class="flex flex-wrap items-center justify-between gap-2">
      <div class="flex min-w-0 items-center gap-2.5">
        <div class="tipid-icon-badge h-8 w-8 shrink-0 bg-[var(--accent-soft)] text-[var(--accent)]">
          <ShieldCheck :size="16" aria-hidden="true" />
        </div>
        <div class="flex min-w-0 items-center gap-2">
          <h2 class="truncate text-sm font-bold text-[var(--text-primary)]">{{ t.walletsHeading }}</h2>
          <span
            class="rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 py-0.5 font-mono text-[11px] font-semibold text-[var(--text-secondary)]"
          >
            {{ hasActiveFilters ? `${filteredItems.length}/${wallets.length}` : wallets.length }}
          </span>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <div
          v-if="showDiscoveryTools"
          class="tipid-tablist inline-flex shrink-0 items-center rounded-xl p-0.5"
          role="group"
          :aria-label="isTl ? 'Uri ng view ng card' : 'Card layout view'"
        >
          <button
            type="button"
            class="tipid-tab tipid-compact inline-flex items-center gap-1 rounded-[9px] px-2.5 py-1 text-[11px] font-semibold"
            :class="{ 'is-active': viewMode === 'deck' }"
            :aria-pressed="viewMode === 'deck'"
            @click="viewMode = 'deck'"
          >
            <Layers :size="12" aria-hidden="true" />
            <span>{{ isTl ? "Deck" : "Deck" }}</span>
          </button>
          <button
            type="button"
            class="tipid-tab tipid-compact inline-flex items-center gap-1 rounded-[9px] px-2.5 py-1 text-[11px] font-semibold"
            :class="{ 'is-active': viewMode === 'grid' }"
            :aria-pressed="viewMode === 'grid'"
            @click="viewMode = 'grid'"
          >
            <LayoutGrid :size="12" aria-hidden="true" />
            <span>{{ isTl ? "Grid" : "Grid" }}</span>
          </button>
        </div>

        <button
          type="button"
          class="tipid-compact inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--accent)] shadow-xs transition-colors hover:border-[var(--accent)]/35 hover:bg-[var(--accent-soft)]"
          @click="emit('add')"
        >
          <Plus :size="14" aria-hidden="true" />
          <span>{{ t.addWallet }}</span>
        </button>
      </div>
    </div>

    <!-- Search & Kind Filters (auto-unlocked once user has 4+ wallets) -->
    <div
      v-if="showDiscoveryTools"
      class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
    >
      <div
        role="search"
        :aria-label="isTl ? 'Maghanap ng wallet o card' : 'Search wallets or cards'"
        class="relative w-full sm:max-w-[260px]"
      >
        <Search
          :size="14"
          class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[var(--text-secondary)]"
          aria-hidden="true"
        />
        <input
          v-model="searchQuery"
          type="search"
          enterkeyhint="search"
          autocomplete="off"
          :placeholder="searchPlaceholder"
          :aria-label="searchPlaceholder"
          class="tipid-input tipid-compact w-full py-1.5 pr-8 pl-8 text-base sm:text-xs"
        />
        <button
          v-if="searchQuery"
          type="button"
          class="tipid-compact absolute top-1/2 right-1.5 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
          :aria-label="isTl ? 'I-clear ang hanap' : 'Clear search'"
          @click="searchQuery = ''"
        >
          <X :size="12" aria-hidden="true" />
        </button>
      </div>

      <div
        v-if="availableKinds.length >= 2"
        class="tipid-wallet-filter-pills flex items-center gap-1.5 overflow-x-auto pb-0.5"
        role="group"
        :aria-label="isTl ? 'Uri ng account' : 'Account type filter'"
      >
        <button
          v-for="kind in (['all', ...availableKinds] as WalletDeckKindFilter[])"
          :key="kind"
          type="button"
          class="tipid-compact shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors"
          :class="
            kindFilter === kind
              ? 'border-[var(--accent)] bg-[var(--accent)] text-white shadow-xs'
              : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-[var(--accent)]/35 hover:text-[var(--text-primary)]'
          "
          :aria-pressed="kindFilter === kind"
          @click="kindFilter = kind"
        >
          <span>{{ getKindFilterLabel(kind) }}</span>
          <span
            class="ml-1 font-mono text-[10px]"
            :class="kindFilter === kind ? 'text-white/80' : 'text-[var(--text-muted)]'"
          >
            {{ getKindCount(kind) }}
          </span>
        </button>
      </div>
    </div>

    <!-- Empty Filter State -->
    <div
      v-if="filteredItems.length === 0"
      class="tipid-card flex flex-col items-center justify-center gap-2.5 px-4 py-8 text-center"
    >
      <div class="tipid-icon-badge h-10 w-10 bg-[var(--accent-soft)] text-[var(--accent)]">
        <CreditCard :size="18" aria-hidden="true" />
      </div>
      <div class="space-y-0.5">
        <p class="text-sm font-semibold text-[var(--text-primary)]">
          {{ isTl ? "Walang tugmang card" : "No matching cards" }}
        </p>
        <p class="text-xs text-[var(--text-secondary)]">
          {{ isTl ? "Subukan ang ibang pangalan o filter." : "Try another name, digit, or filter." }}
        </p>
      </div>
      <button
        type="button"
        class="tipid-compact rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-1.5 text-xs font-semibold text-[var(--accent)] hover:bg-[var(--accent-soft)]"
        @click="clearFilters"
      >
        {{ isTl ? "I-clear" : "Clear filter" }}
      </button>
    </div>

    <!-- Interactive Peek Carousel Deck Mode -->
    <div v-else-if="viewMode === 'deck'" class="space-y-2.5">
      <div class="relative">
        <!-- Prev / Next HTML controls placed before track in DOM order -->
        <div v-if="isDeckScrollable" class="tipid-wallet-stage-controls">
          <button
            type="button"
            class="tipid-wallet-nav-btn"
            :aria-label="prevButtonLabel"
            :disabled="isPrevDisabled"
            @click="stepSlide(-1)"
          >
            <ChevronLeft :size="18" aria-hidden="true" />
          </button>
          <button
            type="button"
            class="tipid-wallet-nav-btn"
            :aria-label="nextButtonLabel"
            :disabled="isNextDisabled"
            @click="stepSlide(1)"
          >
            <ChevronRight :size="18" aria-hidden="true" />
          </button>
        </div>

        <div
          ref="trackRef"
          class="tipid-wallet-deck-track"
          :class="{
            'is-scrollable': isDeckScrollable,
            'is-single': filteredItems.length === 1,
            'is-pair': filteredItems.length === 2,
            'has-view-timeline': supportsViewTimeline
          }"
          tabindex="0"
          role="group"
          :aria-label="deckTrackLabel"
          @scroll="onTrackScroll"
          @scrollend="onTrackScrollEnd"
          @keydown="onTrackKeydown"
        >
          <TransitionGroup name="tipid-deck-filter">
            <div
              v-for="(item, idx) in filteredItems"
              :key="item.method"
              :ref="(el) => setSlideRef(el, idx)"
              class="tipid-wallet-slide"
              :class="{
                'is-active-slide': idx === activeIndex,
                'cursor-pointer': isDeckScrollable && idx !== activeIndex
              }"
              role="group"
              aria-roledescription="slide"
              :aria-label="getSlideAriaLabel(item, idx)"
              :data-marker-name="item.visual.displayName"
              @click="onSlideClick($event, idx)"
            >
              <WalletCard
                :method="item.method"
                :balance="item.balance"
                :total-positive-balance="totalPositiveBalance"
                :balance-hidden="balanceHidden"
                @edit="emit('edit', $event)"
              />
            </div>
          </TransitionGroup>
        </div>
      </div>

      <!-- Quick-Jump Wallet Pill Bar + Position Indicator -->
      <nav
        v-if="showQuickJumpNav"
        :aria-label="chooseCardLabel"
        class="flex items-center gap-2"
      >
        <span
          class="shrink-0 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 py-0.5 font-mono text-[11px] font-semibold text-[var(--text-secondary)]"
          aria-hidden="true"
        >
          {{ activeIndex + 1 }}/{{ filteredItems.length }}
        </span>

        <div
          ref="pillNavRef"
          class="tipid-wallet-marker-bar flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto py-0.5"
        >
          <button
            v-for="(item, idx) in filteredItems"
            :key="`pill-${item.method}`"
            :ref="(el) => setPillRef(el, idx)"
            type="button"
            class="tipid-wallet-marker-pill tipid-compact inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-all"
            :aria-current="activeIndex === idx ? 'true' : undefined"
            :aria-label="getSlideAriaLabel(item, idx)"
            @click="scrollToSlide(idx, true)"
          >
            <span
              class="h-2 w-2 shrink-0 rounded-full"
              :style="{ backgroundColor: item.visual.accent }"
              aria-hidden="true"
            />
            <span class="max-w-[110px] truncate">{{ item.visual.displayName }}</span>
          </button>
        </div>
      </nav>
    </div>

    <!-- Overview Grid Mode -->
    <TransitionGroup
      v-else
      name="tipid-deck-filter"
      tag="div"
      class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
    >
      <WalletCard
        v-for="item in filteredItems"
        :key="item.method"
        :method="item.method"
        :balance="item.balance"
        :total-positive-balance="totalPositiveBalance"
        :balance-hidden="balanceHidden"
        @edit="emit('edit', $event)"
      />
    </TransitionGroup>

    <!-- Settled Slide Live Region (initially empty so page load stays quiet) -->
    <p class="visually-hidden" role="status" aria-live="polite">
      {{ settledAnnouncement }}
    </p>
  </section>
</template>

<style scoped>
.tipid-wallet-deck-track {
  --deck-slide-width: min(84%, 332px);
  position: relative;
  display: flex;
  align-items: stretch;
  gap: 0.75rem;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  touch-action: manipulation;
  scrollbar-width: none;
  -ms-overflow-style: none;
  padding-block: 0.375rem 0.625rem;
}

.tipid-wallet-deck-track::-webkit-scrollbar {
  display: none;
}

.tipid-wallet-deck-track .tipid-wallet-slide {
  flex: 0 0 var(--deck-slide-width);
}

.tipid-wallet-deck-track.is-single .tipid-wallet-slide {
  flex: 0 1 400px;
  max-width: 400px;
  width: 100%;
}

@media (min-width: 640px) {
  .tipid-wallet-deck-track {
    --deck-slide-width: 344px;
    gap: 1rem;
  }

  .tipid-wallet-deck-track.is-pair .tipid-wallet-slide {
    flex: 1 1 0;
    max-width: 440px;
  }
}

.tipid-wallet-deck-track.is-scrollable {
  scroll-snap-type: x mandatory;
  padding-inline: max(0.5rem, calc(50% - var(--deck-slide-width) / 2));
}

.tipid-wallet-deck-track:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 4px;
  border-radius: 1.25rem;
}

.tipid-wallet-deck-track.is-scrollable .tipid-wallet-slide {
  scroll-snap-align: center;
  scroll-snap-stop: normal;
  will-change: transform, opacity;
}

/* Controls overlaid at start/end edges without blocking center swipes */
.tipid-wallet-stage-controls {
  pointer-events: none;
  position: absolute;
  inset-inline: 0.25rem;
  top: 50%;
  z-index: 12;
  display: flex;
  justify-content: space-between;
  transform: translateY(-50%);
}

.tipid-wallet-nav-btn {
  pointer-events: auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 9999px;
  border: 1px solid var(--border-subtle);
  background: color-mix(in srgb, var(--bg-surface) 90%, transparent);
  color: var(--text-primary);
  box-shadow: 0 8px 20px -6px rgba(15, 23, 42, 0.24);
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
  touch-action: manipulation;
  transition: transform 160ms ease, background-color 160ms ease, opacity 160ms ease;
}

.tipid-wallet-nav-btn:hover:not(:disabled) {
  background: var(--bg-surface);
  color: var(--accent);
  transform: scale(1.05);
}

.tipid-wallet-nav-btn:active:not(:disabled) {
  transform: scale(0.95);
}

.tipid-wallet-nav-btn:disabled {
  opacity: 0.32;
  cursor: not-allowed;
}

.tipid-wallet-nav-btn:focus-visible,
.tipid-wallet-marker-pill:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

/* Marker pill strip */
.tipid-wallet-filter-pills,
.tipid-wallet-marker-bar {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.tipid-wallet-filter-pills::-webkit-scrollbar,
.tipid-wallet-marker-bar::-webkit-scrollbar {
  display: none;
}

.tipid-wallet-marker-pill {
  border-color: var(--border-subtle);
  background: var(--bg-surface);
  color: var(--text-secondary);
  touch-action: manipulation;
}

.tipid-wallet-marker-pill:hover {
  border-color: color-mix(in srgb, var(--accent) 40%, transparent);
  color: var(--text-primary);
}

.tipid-wallet-marker-pill[aria-current="true"] {
  border-color: var(--hero-card-start);
  background: var(--hero-card-start);
  color: #ffffff;
  box-shadow: 0 6px 14px -6px rgba(15, 92, 68, 0.55);
}

/* Scroll-driven & focus elevation effects strictly behind reduced-motion guard */
@media (prefers-reduced-motion: no-preference) {
  .tipid-wallet-deck-track.is-scrollable {
    scroll-behavior: smooth;
  }

  /* Smooth filter / add / grid rearrangement transitions */
  .tipid-deck-filter-move,
  .tipid-deck-filter-enter-active,
  .tipid-deck-filter-leave-active {
    transition:
      transform 240ms cubic-bezier(0.22, 1, 0.36, 1),
      opacity 180ms ease;
  }

  .tipid-deck-filter-enter-from,
  .tipid-deck-filter-leave-to {
    opacity: 0;
    transform: scale(0.94);
  }

  /* Fallback active-slide depth for browsers without full view-timeline */
  .tipid-wallet-deck-track.is-scrollable:not(.has-view-timeline) .tipid-wallet-slide {
    transform: scale(0.94);
    opacity: 0.76;
    transition:
      transform 240ms cubic-bezier(0.22, 1, 0.36, 1),
      opacity 220ms ease;
  }

  .tipid-wallet-deck-track.is-scrollable:not(.has-view-timeline) .tipid-wallet-slide.is-active-slide {
    transform: scale(1);
    opacity: 1;
  }

  /* Progressive Enhancement continuous scroll-driven slide scale + opacity */
  @supports ((animation-timeline: view()) and (animation-range: entry)) {
    @keyframes tipid-deck-slide-focus {
      0% {
        transform: scale(0.92) translateY(4px);
        opacity: 0.72;
      }
      35% {
        transform: scale(1) translateY(0);
        opacity: 1;
      }
      65% {
        transform: scale(1) translateY(0);
        opacity: 1;
      }
      100% {
        transform: scale(0.92) translateY(4px);
        opacity: 0.72;
      }
    }

    .tipid-wallet-deck-track.is-scrollable .tipid-wallet-slide {
      animation: tipid-deck-slide-focus auto linear both;
      animation-timeline: view(inline);
      animation-range: cover 0% cover 100%;
    }
  }
}
</style>
