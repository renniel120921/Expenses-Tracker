import { cosmeticRef, SUPPORTED_WALLETS } from "@/lib/core";
import type { WalletDefinition } from "@/types/finance";

export type WalletKind = WalletDefinition["type"];

export interface WalletVisualTheme {
  monogram: string;
  surfaceStart: string;
  surfaceEnd: string;
  accent: string;
  railLabel: string;
  chipFinish: "gold" | "silver" | "none";
}

export interface ResolvedWalletVisual extends WalletVisualTheme {
  id: string;
  displayName: string;
  kind: WalletKind;
  kindLabel: string;
  cardLast4: string;
}

const DEFAULT_KIND_RAIL: Record<WalletKind, { label: string; rail: string; chipFinish: WalletVisualTheme["chipFinish"] }> = {
  cash: { label: "Cash", rail: "TREASURY RESERVE", chipFinish: "none" },
  ewallet: { label: "E-Wallet", rail: "INSTAPAY WALLET", chipFinish: "none" },
  digital: { label: "Digital Bank", rail: "DIGITAL DEBIT", chipFinish: "silver" },
  bank: { label: "Bank", rail: "DEBIT · EMV", chipFinish: "gold" }
};

const WALLET_THEME_MAP: Record<string, WalletVisualTheme> = {
  Cash: {
    monogram: "₱",
    surfaceStart: "#0B3829",
    surfaceEnd: "#145840",
    accent: "#6EE7B7",
    railLabel: "CASH ON HAND",
    chipFinish: "none"
  },
  GCash: {
    monogram: "G",
    surfaceStart: "#003B99",
    surfaceEnd: "#0062CC",
    accent: "#7DD3FC",
    railLabel: "INSTAPAY WALLET",
    chipFinish: "none"
  },
  Maya: {
    monogram: "M",
    surfaceStart: "#0F1714",
    surfaceEnd: "#1C2B25",
    accent: "#2CE69B",
    railLabel: "VISA WALLET",
    chipFinish: "silver"
  },
  ShopeePay: {
    monogram: "SP",
    surfaceStart: "#7C2308",
    surfaceEnd: "#B8390E",
    accent: "#FDBA74",
    railLabel: "SHOPEEPAY WALLET",
    chipFinish: "none"
  },
  GrabPay: {
    monogram: "GP",
    surfaceStart: "#05381F",
    surfaceEnd: "#0B5E36",
    accent: "#6EE7B7",
    railLabel: "GRABPAY WALLET",
    chipFinish: "none"
  },
  MariBank: {
    monogram: "MB",
    surfaceStart: "#7E2206",
    surfaceEnd: "#BA3B0C",
    accent: "#FDBA74",
    railLabel: "MARIBANK DEBIT",
    chipFinish: "silver"
  },
  SeaBank: {
    monogram: "SB",
    surfaceStart: "#7D2407",
    surfaceEnd: "#B93E0E",
    accent: "#FDBA74",
    railLabel: "SEABANK DEBIT",
    chipFinish: "silver"
  },
  GoTyme: {
    monogram: "GT",
    surfaceStart: "#0B2130",
    surfaceEnd: "#11485B",
    accent: "#38BDF8",
    railLabel: "GOTYME VISA",
    chipFinish: "silver"
  },
  Tonik: {
    monogram: "TN",
    surfaceStart: "#380A68",
    surfaceEnd: "#581EB0",
    accent: "#DDD6FE",
    railLabel: "TONIK STASH CARD",
    chipFinish: "silver"
  },
  UNO: {
    monogram: "UNO",
    surfaceStart: "#1F1938",
    surfaceEnd: "#392C68",
    accent: "#C4B5FD",
    railLabel: "UNO DIGITAL BANK",
    chipFinish: "silver"
  },
  UnionDigital: {
    monogram: "UD",
    surfaceStart: "#451707",
    surfaceEnd: "#802D0E",
    accent: "#FBBF24",
    railLabel: "UNIONDIGITAL",
    chipFinish: "silver"
  },
  OFBank: {
    monogram: "OFB",
    surfaceStart: "#142E1E",
    surfaceEnd: "#244E35",
    accent: "#A7F3D0",
    railLabel: "OVERSEAS FILIPINO",
    chipFinish: "silver"
  },
  CIMB: {
    monogram: "CM",
    surfaceStart: "#4C0C13",
    surfaceEnd: "#821520",
    accent: "#FCA5A5",
    railLabel: "CIMB OCTO DEBIT",
    chipFinish: "silver"
  },
  DiskarTech: {
    monogram: "DT",
    surfaceStart: "#102849",
    surfaceEnd: "#1B4675",
    accent: "#7DD3FC",
    railLabel: "RCBC DISKARTECH",
    chipFinish: "none"
  },
  BDO: {
    monogram: "BDO",
    surfaceStart: "#091D56",
    surfaceEnd: "#143582",
    accent: "#FBBF24",
    railLabel: "BDO DEBIT EMV",
    chipFinish: "gold"
  },
  BPI: {
    monogram: "BPI",
    surfaceStart: "#600B1B",
    surfaceEnd: "#8B1228",
    accent: "#FDE047",
    railLabel: "BPI DEBIT EMV",
    chipFinish: "gold"
  },
  UnionBank: {
    monogram: "UB",
    surfaceStart: "#4A1906",
    surfaceEnd: "#88300E",
    accent: "#FB923C",
    railLabel: "UNIONBANK PLAY",
    chipFinish: "gold"
  },
  Metrobank: {
    monogram: "MBT",
    surfaceStart: "#0D2660",
    surfaceEnd: "#18429E",
    accent: "#93C5FD",
    railLabel: "METROBANK DEBIT",
    chipFinish: "gold"
  },
  PNB: {
    monogram: "PNB",
    surfaceStart: "#112645",
    surfaceEnd: "#1B4173",
    accent: "#FBBF24",
    railLabel: "PNB DEBIT EMV",
    chipFinish: "gold"
  },
  SecurityBank: {
    monogram: "SB",
    surfaceStart: "#0D2638",
    surfaceEnd: "#144260",
    accent: "#5EEAD4",
    railLabel: "SECURITY BANK",
    chipFinish: "gold"
  },
  RCBC: {
    monogram: "RC",
    surfaceStart: "#1B2432",
    surfaceEnd: "#2E3C52",
    accent: "#CBD5E1",
    railLabel: "RCBC DEBIT EMV",
    chipFinish: "silver"
  },
  ChinaBank: {
    monogram: "CBC",
    surfaceStart: "#620D17",
    surfaceEnd: "#921725",
    accent: "#FCA5A5",
    railLabel: "CHINABANK DEBIT",
    chipFinish: "gold"
  },
  EastWest: {
    monogram: "EW",
    surfaceStart: "#460D2B",
    surfaceEnd: "#721847",
    accent: "#F9A8D4",
    railLabel: "EASTWEST DEBIT",
    chipFinish: "gold"
  },
  LandBank: {
    monogram: "LB",
    surfaceStart: "#0A3C20",
    surfaceEnd: "#125E34",
    accent: "#FACC15",
    railLabel: "LANDBANK DEBIT",
    chipFinish: "gold"
  },
  PSBank: {
    monogram: "PSB",
    surfaceStart: "#132452",
    surfaceEnd: "#1F3B82",
    accent: "#93C5FD",
    railLabel: "PSBANK DEBIT",
    chipFinish: "gold"
  },
  PayPal: {
    monogram: "PP",
    surfaceStart: "#001D54",
    surfaceEnd: "#00368A",
    accent: "#7DD3FC",
    railLabel: "GLOBAL WALLET",
    chipFinish: "none"
  }
};

const FALLBACK_THEME: WalletVisualTheme = {
  monogram: "AC",
  surfaceStart: "#16221C",
  surfaceEnd: "#283A31",
  accent: "#A7F3D0",
  railLabel: "ACCOUNT LEDGER",
  chipFinish: "silver"
};

function findSupportedWallet(method: string): WalletDefinition | undefined {
  const normalized = method.trim().toLowerCase();
  if (!normalized) return undefined;
  return SUPPORTED_WALLETS.find(
    (w) => w.id.toLowerCase() === normalized || w.name.toLowerCase() === normalized
  );
}

/**
 * Resolves visual identity, accessible surface palette, and card metadata for a stored wallet identifier.
 * Keeps canonical Firestore IDs untouched while presenting full institution names cleanly.
 */
export function resolveWalletVisual(method: string): ResolvedWalletVisual {
  const def = findSupportedWallet(method);
  const canonicalId = def?.id ?? (method.trim() || "Cash");
  const kind: WalletKind = def?.type ?? "bank";
  const defaults = DEFAULT_KIND_RAIL[kind];
  const mappedTheme = WALLET_THEME_MAP[canonicalId];
  const fallbackMono = canonicalId
    .replace(/[^A-Za-z0-9]/g, "")
    .slice(0, 3)
    .toUpperCase() || FALLBACK_THEME.monogram;

  const theme: WalletVisualTheme = mappedTheme ?? {
    ...FALLBACK_THEME,
    monogram: fallbackMono,
    railLabel: defaults.rail,
    chipFinish: defaults.chipFinish
  };

  return {
    ...theme,
    id: canonicalId,
    displayName: def?.name ?? (method.trim() || "Account"),
    kind,
    kindLabel: defaults.label,
    cardLast4: cosmeticRef(method || canonicalId)
  };
}
