import { describe, expect, it } from "vitest";
import {
  buildWalletDeckItems,
  computeCenteredSlideScrollLeft,
  filterWalletDeckItems,
  findNearestSlideIndex,
  getAvailableWalletKinds,
  resolveStepTargetIndex
} from "@/lib/walletDeck";

const SAMPLE_WALLETS = [
  "LandBank",
  "Cash",
  "GCash",
  "Maya",
  "BDO",
  "BPI",
  "GoTyme",
  "SeaBank",
  "UnionBank",
  "Metrobank"
];

const SAMPLE_BALANCES: Record<string, number> = {
  LandBank: 100,
  Cash: 0,
  GCash: 2500,
  Maya: 1200,
  BDO: 18500,
  BPI: 9400,
  GoTyme: 4300,
  SeaBank: 6800,
  UnionBank: 3100,
  Metrobank: 15200
};

describe("walletDeck helpers", () => {
  it("builds deck metadata for 10+ wallets preserving order and balances", () => {
    const items = buildWalletDeckItems(SAMPLE_WALLETS, SAMPLE_BALANCES);
    expect(items).toHaveLength(10);
    expect(items[0]?.visual.displayName).toBe("Land Bank");
    expect(items[0]?.balance).toBe(100);
    expect(items[1]?.visual.kind).toBe("cash");
    expect(items[2]?.visual.kind).toBe("ewallet");
    expect(items[6]?.visual.kind).toBe("digital");
  });

  it("extracts available wallet kinds in consistent display priority", () => {
    const items = buildWalletDeckItems(SAMPLE_WALLETS, SAMPLE_BALANCES);
    expect(getAvailableWalletKinds(items)).toEqual(["ewallet", "digital", "bank", "cash"]);

    const subset = buildWalletDeckItems(["LandBank", "Cash"], SAMPLE_BALANCES);
    expect(getAvailableWalletKinds(subset)).toEqual(["bank", "cash"]);
  });

  it("filters by account kind and multi-token queries including last-4 digits", () => {
    const items = buildWalletDeckItems(SAMPLE_WALLETS, SAMPLE_BALANCES);

    const banksOnly = filterWalletDeckItems(items, "bank", "");
    expect(banksOnly.map((i) => i.method)).toEqual([
      "LandBank",
      "BDO",
      "BPI",
      "UnionBank",
      "Metrobank"
    ]);

    const landBankLast4 = items[0]!.visual.cardLast4;
    const byDigits = filterWalletDeckItems(items, "all", landBankLast4);
    expect(byDigits.some((i) => i.method === "LandBank")).toBe(true);

    const digitalMatch = filterWalletDeckItems(items, "digital", "gotyme");
    expect(digitalMatch.map((i) => i.method)).toEqual(["GoTyme"]);
  });

  it("loops Prev/Next continuously when 3+ cards exist and clamps when fewer than 3", () => {
    expect(resolveStepTargetIndex(0, -1, 10)).toBe(9);
    expect(resolveStepTargetIndex(9, 1, 10)).toBe(0);
    expect(resolveStepTargetIndex(4, 1, 10)).toBe(5);

    expect(resolveStepTargetIndex(0, -1, 2)).toBe(0);
    expect(resolveStepTargetIndex(1, 1, 2)).toBe(1);
    expect(resolveStepTargetIndex(0, 1, 2)).toBe(1);
    expect(resolveStepTargetIndex(0, 1, 1)).toBe(0);
  });

  it("computes clamped inline centering offsets and identifies nearest slide", () => {
    const centered = computeCenteredSlideScrollLeft({
      slideOffsetLeft: 760,
      slideWidth: 344,
      trackClientWidth: 680,
      maxScrollLeft: 2800
    });
    expect(centered).toBe(592);

    const clampedStart = computeCenteredSlideScrollLeft({
      slideOffsetLeft: 16,
      slideWidth: 344,
      trackClientWidth: 680,
      maxScrollLeft: 2800
    });
    expect(clampedStart).toBe(0);

    const slides = [
      { offsetLeft: 20, clientWidth: 340 },
      { offsetLeft: 376, clientWidth: 340 },
      { offsetLeft: 732, clientWidth: 340 }
    ];
    expect(findNearestSlideIndex(slides, 220, 680)).toBe(1);
    expect(findNearestSlideIndex(slides, 0, 680)).toBe(0);
    expect(findNearestSlideIndex(slides, 620, 680)).toBe(2);
  });
});
