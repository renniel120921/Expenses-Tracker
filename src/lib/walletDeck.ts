import { resolveWalletVisual, type ResolvedWalletVisual, type WalletKind } from "@/lib/walletVisuals";

export type WalletDeckViewMode = "deck" | "grid";
export type WalletDeckKindFilter = "all" | WalletKind;

export interface WalletDeckItem {
  method: string;
  balance: number;
  visual: ResolvedWalletVisual;
  searchableText: string;
}

const KIND_DISPLAY_ORDER: readonly WalletKind[] = ["ewallet", "digital", "bank", "cash"];

/**
 * Resolves visual identity and search metadata for every user wallet while
 * preserving account order from preferences.
 */
export function buildWalletDeckItems(
  wallets: readonly string[],
  walletBalances: Readonly<Record<string, number>>
): WalletDeckItem[] {
  return wallets.map((method) => {
    const visual = resolveWalletVisual(method);
    const balance = walletBalances[method] ?? 0;
    const searchableText = [
      method,
      visual.displayName,
      visual.kindLabel,
      visual.railLabel,
      visual.monogram,
      visual.cardLast4
    ]
      .join(" ")
      .toLowerCase();

    return {
      method,
      balance,
      visual,
      searchableText
    };
  });
}

/**
 * Returns wallet kinds present in the deck in consistent display priority.
 */
export function getAvailableWalletKinds(items: readonly WalletDeckItem[]): WalletKind[] {
  const present = new Set<WalletKind>();
  for (const item of items) {
    present.add(item.visual.kind);
  }
  return KIND_DISPLAY_ORDER.filter((kind) => present.has(kind));
}

/**
 * Filters wallet deck items by account kind and multi-token search query
 * matching brand, account label, payment rail, or card last-4 digits.
 */
export function filterWalletDeckItems(
  items: readonly WalletDeckItem[],
  kindFilter: WalletDeckKindFilter,
  searchQuery: string
): WalletDeckItem[] {
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const tokens = normalizedQuery ? normalizedQuery.split(/\s+/).filter(Boolean) : [];

  return items.filter((item) => {
    if (kindFilter !== "all" && item.visual.kind !== kindFilter) {
      return false;
    }
    if (!tokens.length) {
      return true;
    }
    return tokens.every((token) => item.searchableText.includes(token));
  });
}

/**
 * Computes the next slide index for Prev/Next controls.
 * Wraps continuously when at least three cards exist; clamps cleanly otherwise.
 */
export function resolveStepTargetIndex(
  currentIndex: number,
  delta: -1 | 1,
  totalCount: number
): number {
  if (totalCount <= 0) return 0;
  const clamped = Math.max(0, Math.min(totalCount - 1, currentIndex));
  if (totalCount >= 3) {
    return (clamped + delta + totalCount) % totalCount;
  }
  return Math.max(0, Math.min(totalCount - 1, clamped + delta));
}

/**
 * Computes the track horizontal scrollLeft offset that centers the target slide
 * inside the scrollport without touching vertical page scroll.
 */
export function computeCenteredSlideScrollLeft(params: {
  slideOffsetLeft: number;
  slideWidth: number;
  trackClientWidth: number;
  maxScrollLeft: number;
}): number {
  const { slideOffsetLeft, slideWidth, trackClientWidth, maxScrollLeft } = params;
  if (maxScrollLeft <= 0) return 0;
  const rawLeft = slideOffsetLeft - Math.max(0, trackClientWidth - slideWidth) / 2;
  return Math.max(0, Math.min(maxScrollLeft, Math.round(rawLeft)));
}

/**
 * Finds the slide index closest to the center of the track scrollport along
 * the inline axis.
 */
export function findNearestSlideIndex(
  slides: ReadonlyArray<{ offsetLeft: number; clientWidth: number }>,
  scrollLeft: number,
  trackClientWidth: number
): number {
  if (!slides.length) return 0;
  const viewportCenter = scrollLeft + trackClientWidth / 2;
  let bestIndex = 0;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (let i = 0; i < slides.length; i += 1) {
    const slide = slides[i];
    if (!slide) continue;
    const slideCenter = slide.offsetLeft + slide.clientWidth / 2;
    const distance = Math.abs(slideCenter - viewportCenter);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = i;
    }
  }

  return bestIndex;
}
