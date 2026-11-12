import { cosmeticRef, SUPPORTED_WALLETS } from "@/lib/core";
import type { WalletDefinition } from "@/types/finance";

export type WalletKind = WalletDefinition["type"];
export type WalletCardMaterial = "brushed-metal" | "satin-matte" | "pearl-foil" | "carbon-weave" | "guilloche";
export type WalletCardNetwork = "VISA" | "MC" | "INSTAPAY" | "BANCNET" | "CASH";
export type WalletCardMotif = "wave" | "prism" | "rings" | "mesh" | "horizon";

export interface WalletVisualTheme {
  monogram: string;
  surfaceStart: string;
  surfaceMid: string;
  surfaceEnd: string;
  accent: string;
  stripeColor: string;
  inkColor: string;
  railLabel: string;
  chipFinish: "gold" | "silver" | "none";
  material: WalletCardMaterial;
  network: WalletCardNetwork;
  motif: WalletCardMotif;
}

export interface ResolvedWalletVisual extends WalletVisualTheme {
  id: string;
  displayName: string;
  kind: WalletKind;
  kindLabel: string;
  cardLast4: string;
  cardNumberGroups: [string, string, string, string];
  validThru: string;
  cvc: string;
  issuerNotice: string;
}

const DEFAULT_KIND_RAIL: Record<
  WalletKind,
  {
    label: string;
    rail: string;
    chipFinish: WalletVisualTheme["chipFinish"];
    material: WalletCardMaterial;
    network: WalletCardNetwork;
    motif: WalletCardMotif;
  }
> = {
  cash: {
    label: "Cash",
    rail: "TREASURY RESERVE",
    chipFinish: "none",
    material: "guilloche",
    network: "CASH",
    motif: "rings"
  },
  ewallet: {
    label: "E-Wallet",
    rail: "INSTAPAY WALLET",
    chipFinish: "none",
    material: "pearl-foil",
    network: "INSTAPAY",
    motif: "wave"
  },
  digital: {
    label: "Digital Bank",
    rail: "DIGITAL DEBIT",
    chipFinish: "silver",
    material: "satin-matte",
    network: "VISA",
    motif: "horizon"
  },
  bank: {
    label: "Bank",
    rail: "DEBIT · EMV",
    chipFinish: "gold",
    material: "brushed-metal",
    network: "MC",
    motif: "prism"
  }
};

const WALLET_THEME_MAP: Record<string, WalletVisualTheme> = {
  Cash: {
    monogram: "₱",
    surfaceStart: "#092D21",
    surfaceMid: "#114835",
    surfaceEnd: "#0C3929",
    accent: "#6EE7B7",
    stripeColor: "#34D399",
    inkColor: "#FFFFFF",
    railLabel: "CASH ON HAND",
    chipFinish: "none",
    material: "guilloche",
    network: "CASH",
    motif: "rings"
  },
  GCash: {
    monogram: "G",
    surfaceStart: "#00399E",
    surfaceMid: "#0055D6",
    surfaceEnd: "#0047B8",
    accent: "#7DD3FC",
    stripeColor: "#38BDF8",
    inkColor: "#FFFFFF",
    railLabel: "INSTAPAY WALLET",
    chipFinish: "none",
    material: "pearl-foil",
    network: "INSTAPAY",
    motif: "wave"
  },
  Maya: {
    monogram: "M",
    surfaceStart: "#090D0B",
    surfaceMid: "#121B17",
    surfaceEnd: "#0D1411",
    accent: "#1FF27A",
    stripeColor: "#00D664",
    inkColor: "#FFFFFF",
    railLabel: "MAYA VISA CARD",
    chipFinish: "silver",
    material: "carbon-weave",
    network: "VISA",
    motif: "prism"
  },
  ShopeePay: {
    monogram: "SP",
    surfaceStart: "#962205",
    surfaceMid: "#C9370B",
    surfaceEnd: "#A82906",
    accent: "#FDBA74",
    stripeColor: "#FF7833",
    inkColor: "#FFFFFF",
    railLabel: "SHOPEEPAY WALLET",
    chipFinish: "none",
    material: "pearl-foil",
    network: "INSTAPAY",
    motif: "wave"
  },
  GrabPay: {
    monogram: "GP",
    surfaceStart: "#04381E",
    surfaceMid: "#086335",
    surfaceEnd: "#054726",
    accent: "#6EE7B7",
    stripeColor: "#22C55E",
    inkColor: "#FFFFFF",
    railLabel: "GRABPAY WALLET",
    chipFinish: "none",
    material: "carbon-weave",
    network: "INSTAPAY",
    motif: "mesh"
  },
  MariBank: {
    monogram: "MB",
    surfaceStart: "#9A2305",
    surfaceMid: "#CF380D",
    surfaceEnd: "#B42B07",
    accent: "#FED7AA",
    stripeColor: "#FF7E38",
    inkColor: "#FFFFFF",
    railLabel: "MARIBANK VISA DEBIT",
    chipFinish: "silver",
    material: "pearl-foil",
    network: "VISA",
    motif: "horizon"
  },
  SeaBank: {
    monogram: "SB",
    surfaceStart: "#8C1F04",
    surfaceMid: "#CA340B",
    surfaceEnd: "#AD2907",
    accent: "#FDBA74",
    stripeColor: "#FF823A",
    inkColor: "#FFFFFF",
    railLabel: "SEABANK DEBIT",
    chipFinish: "silver",
    material: "satin-matte",
    network: "MC",
    motif: "wave"
  },
  GoTyme: {
    monogram: "GT",
    surfaceStart: "#042834",
    surfaceMid: "#0B5669",
    surfaceEnd: "#0D687A",
    accent: "#22F0FF",
    stripeColor: "#00D8EC",
    inkColor: "#FFFFFF",
    railLabel: "GOTYME VISA DEBIT",
    chipFinish: "silver",
    material: "satin-matte",
    network: "VISA",
    motif: "wave"
  },
  Tonik: {
    monogram: "TN",
    surfaceStart: "#420C8A",
    surfaceMid: "#6D19D1",
    surfaceEnd: "#5512AB",
    accent: "#F472B6",
    stripeColor: "#E879F9",
    inkColor: "#FFFFFF",
    railLabel: "TONIK STASH CARD",
    chipFinish: "silver",
    material: "pearl-foil",
    network: "MC",
    motif: "prism"
  },
  UNO: {
    monogram: "UNO",
    surfaceStart: "#121A42",
    surfaceMid: "#223175",
    surfaceEnd: "#192459",
    accent: "#38BDF8",
    stripeColor: "#FACC15",
    inkColor: "#FFFFFF",
    railLabel: "UNO DIGITAL BANK",
    chipFinish: "silver",
    material: "satin-matte",
    network: "MC",
    motif: "prism"
  },
  UnionDigital: {
    monogram: "UD",
    surfaceStart: "#141210",
    surfaceMid: "#2A2420",
    surfaceEnd: "#1B1715",
    accent: "#FB923C",
    stripeColor: "#FF6A00",
    inkColor: "#FFFFFF",
    railLabel: "UNIONDIGITAL VISA",
    chipFinish: "silver",
    material: "brushed-metal",
    network: "VISA",
    motif: "mesh"
  },
  OFBank: {
    monogram: "OFB",
    surfaceStart: "#09261E",
    surfaceMid: "#13493B",
    surfaceEnd: "#0E392E",
    accent: "#FDE047",
    stripeColor: "#34D399",
    inkColor: "#FFFFFF",
    railLabel: "OVERSEAS FILIPINO",
    chipFinish: "silver",
    material: "guilloche",
    network: "VISA",
    motif: "rings"
  },
  CIMB: {
    monogram: "CM",
    surfaceStart: "#7E0916",
    surfaceMid: "#BA1123",
    surfaceEnd: "#990D1C",
    accent: "#FECACA",
    stripeColor: "#F43F5E",
    inkColor: "#FFFFFF",
    railLabel: "CIMB OCTO DEBIT",
    chipFinish: "silver",
    material: "pearl-foil",
    network: "VISA",
    motif: "horizon"
  },
  DiskarTech: {
    monogram: "DT",
    surfaceStart: "#083A73",
    surfaceMid: "#105CAE",
    surfaceEnd: "#0B4B90",
    accent: "#7DD3FC",
    stripeColor: "#22D3EE",
    inkColor: "#FFFFFF",
    railLabel: "RCBC DISKARTECH",
    chipFinish: "none",
    material: "satin-matte",
    network: "INSTAPAY",
    motif: "wave"
  },
  BDO: {
    monogram: "BDO",
    surfaceStart: "#051B54",
    surfaceMid: "#0E389E",
    surfaceEnd: "#082775",
    accent: "#FACC15",
    stripeColor: "#EAB308",
    inkColor: "#FFFFFF",
    railLabel: "BDO DEBIT EMV",
    chipFinish: "gold",
    material: "brushed-metal",
    network: "MC",
    motif: "prism"
  },
  BPI: {
    monogram: "BPI",
    surfaceStart: "#570717",
    surfaceMid: "#8D0E26",
    surfaceEnd: "#6B091C",
    accent: "#FDE047",
    stripeColor: "#FACC15",
    inkColor: "#FFFFFF",
    railLabel: "BPI DEBIT EMV",
    chipFinish: "gold",
    material: "pearl-foil",
    network: "MC",
    motif: "wave"
  },
  UnionBank: {
    monogram: "UB",
    surfaceStart: "#1F1814",
    surfaceMid: "#522510",
    surfaceEnd: "#2E1A11",
    accent: "#FB923C",
    stripeColor: "#FF6B00",
    inkColor: "#FFFFFF",
    railLabel: "UNIONBANK VISA",
    chipFinish: "gold",
    material: "brushed-metal",
    network: "VISA",
    motif: "prism"
  },
  Metrobank: {
    monogram: "MBT",
    surfaceStart: "#091E52",
    surfaceMid: "#153A94",
    surfaceEnd: "#0E2B70",
    accent: "#93C5FD",
    stripeColor: "#60A5FA",
    inkColor: "#FFFFFF",
    railLabel: "METROBANK DEBIT",
    chipFinish: "gold",
    material: "guilloche",
    network: "MC",
    motif: "rings"
  },
  PNB: {
    monogram: "PNB",
    surfaceStart: "#0B1D3B",
    surfaceMid: "#173A73",
    surfaceEnd: "#102952",
    accent: "#FBBF24",
    stripeColor: "#F59E0B",
    inkColor: "#FFFFFF",
    railLabel: "PNB DEBIT EMV",
    chipFinish: "gold",
    material: "guilloche",
    network: "MC",
    motif: "horizon"
  },
  SecurityBank: {
    monogram: "SB",
    surfaceStart: "#071B26",
    surfaceMid: "#0E374D",
    surfaceEnd: "#0A2838",
    accent: "#2DD4BF",
    stripeColor: "#14B8A6",
    inkColor: "#FFFFFF",
    railLabel: "SECURITY BANK",
    chipFinish: "gold",
    material: "brushed-metal",
    network: "MC",
    motif: "prism"
  },
  RCBC: {
    monogram: "RC",
    surfaceStart: "#141B24",
    surfaceMid: "#2A374B",
    surfaceEnd: "#1C2534",
    accent: "#E2E8F0",
    stripeColor: "#94A3B8",
    inkColor: "#FFFFFF",
    railLabel: "RCBC DEBIT EMV",
    chipFinish: "silver",
    material: "brushed-metal",
    network: "VISA",
    motif: "mesh"
  },
  ChinaBank: {
    monogram: "CBC",
    surfaceStart: "#5A0812",
    surfaceMid: "#941322",
    surfaceEnd: "#700C18",
    accent: "#FDE68A",
    stripeColor: "#FCA5A5",
    inkColor: "#FFFFFF",
    railLabel: "CHINABANK DEBIT",
    chipFinish: "gold",
    material: "guilloche",
    network: "MC",
    motif: "rings"
  },
  EastWest: {
    monogram: "EW",
    surfaceStart: "#3D0725",
    surfaceMid: "#731449",
    surfaceEnd: "#520C33",
    accent: "#F9A8D4",
    stripeColor: "#F472B6",
    inkColor: "#FFFFFF",
    railLabel: "EASTWEST DEBIT",
    chipFinish: "gold",
    material: "pearl-foil",
    network: "VISA",
    motif: "wave"
  },
  LandBank: {
    monogram: "LB",
    surfaceStart: "#062E17",
    surfaceMid: "#0E5A30",
    surfaceEnd: "#094222",
    accent: "#FACC15",
    stripeColor: "#4ADE80",
    inkColor: "#FFFFFF",
    railLabel: "LANDBANK VISA",
    chipFinish: "gold",
    material: "guilloche",
    network: "VISA",
    motif: "rings"
  },
  PSBank: {
    monogram: "PSB",
    surfaceStart: "#0D1D47",
    surfaceMid: "#1B3B8C",
    surfaceEnd: "#122A66",
    accent: "#93C5FD",
    stripeColor: "#60A5FA",
    inkColor: "#FFFFFF",
    railLabel: "PSBANK DEBIT",
    chipFinish: "gold",
    material: "satin-matte",
    network: "MC",
    motif: "horizon"
  },
  PayPal: {
    monogram: "PP",
    surfaceStart: "#001B54",
    surfaceMid: "#003C9E",
    surfaceEnd: "#002B78",
    accent: "#7DD3FC",
    stripeColor: "#38BDF8",
    inkColor: "#FFFFFF",
    railLabel: "GLOBAL WALLET",
    chipFinish: "none",
    material: "pearl-foil",
    network: "INSTAPAY",
    motif: "wave"
  }
};

const FALLBACK_THEME: WalletVisualTheme = {
  monogram: "AC",
  surfaceStart: "#14201A",
  surfaceMid: "#24372E",
  surfaceEnd: "#192821",
  accent: "#A7F3D0",
  stripeColor: "#6EE7B7",
  inkColor: "#FFFFFF",
  railLabel: "ACCOUNT LEDGER",
  chipFinish: "silver",
  material: "satin-matte",
  network: "BANCNET",
  motif: "prism"
};

const ISSUER_NOTICE_MAP: Readonly<Record<string, string>> = {
  Cash: "Physical Cash Treasury · Ledger Reserve",
  GCash: "G-Xchange, Inc. · BSP Supervised · InstaPay",
  Maya: "Maya Bank, Inc. · BSP Supervised · PDIC",
  ShopeePay: "ShopeePay Philippines · InstaPay Wallet",
  GrabPay: "GPay Network PH · BSP Supervised",
  MariBank: "MariBank Virtual Debit · SEA Financial Rail",
  SeaBank: "SeaBank Philippines, Inc. · BSP Supervised",
  GoTyme: "GoTyme Bank Corp. · BSP Supervised · PDIC",
  Tonik: "Tonik Digital Bank · BSP Supervised · PDIC",
  UNO: "UNO Digital Bank, Inc. · BSP Supervised",
  UnionDigital: "UnionDigital Bank · BSP Supervised · PDIC",
  OFBank: "Overseas Filipino Bank · A LandBank Subsidiary",
  CIMB: "CIMB Bank Philippines · BSP Supervised · PDIC",
  DiskarTech: "RCBC DiskarTech · Basic Deposit Account",
  BDO: "BDO Unibank, Inc. · BancNet / Cirrus · PDIC",
  BPI: "Bank of the Philippine Islands · BancNet",
  UnionBank: "Union Bank of the Philippines · BancNet",
  Metrobank: "Metropolitan Bank & Trust Co. · BancNet",
  PNB: "Philippine National Bank · BancNet · PDIC",
  SecurityBank: "Security Bank Corp. · BancNet · PDIC",
  RCBC: "Rizal Commercial Banking Corp. · BancNet",
  ChinaBank: "China Banking Corp. · BancNet · PDIC",
  EastWest: "EastWest Banking Corp. · BancNet · PDIC",
  LandBank: "Land Bank of the Philippines · BancNet",
  PSBank: "Philippine Savings Bank · BancNet · PDIC",
  PayPal: "PayPal Holdings · Cross-Border Balance"
};

function hashSeed(seed: string, salt: number): number {
  let h = salt >>> 0;
  for (let i = 0; i < seed.length; i += 1) {
    h = (Math.imul(h, 33) + seed.charCodeAt(i)) >>> 0;
  }
  return h;
}

function padFixed(num: number, width: number): string {
  return String(num).padStart(width, "0").slice(-width);
}

/**
 * Generates deterministic non-PII virtual reference details for the back face of
 * the physical card preview so users experience an authentic ATM card layout
 * without storing real payment credentials.
 */
function deriveCardBackSpecs(
  seed: string,
  network: WalletCardNetwork,
  last4: string,
  kind: WalletKind
): Pick<ResolvedWalletVisual, "cardNumberGroups" | "validThru" | "cvc" | "issuerNotice"> {
  const h1 = hashSeed(seed, 17);
  const h2 = hashSeed(seed, 53);
  const h3 = hashSeed(seed, 97);

  let prefixBin: string;
  if (network === "VISA") {
    prefixBin = `4${padFixed(h1 % 900 + 100, 3)}`;
  } else if (network === "MC") {
    const secondDigit = 2 + (h1 % 4);
    prefixBin = `5${secondDigit}${padFixed(h1 % 100, 2)}`;
  } else if (network === "INSTAPAY") {
    prefixBin = `62${padFixed(h1 % 100, 2)}`;
  } else if (network === "CASH") {
    prefixBin = `88${padFixed(h1 % 100, 2)}`;
  } else {
    prefixBin = `60${padFixed(h1 % 100, 2)}`;
  }

  const mid1 = padFixed((h2 % 9000) + 1000, 4);
  const mid2 = padFixed((h3 % 9000) + 1000, 4);
  const expMonth = padFixed((h2 % 12) + 1, 2);
  const expYear = String(28 + (h3 % 4));
  const cvc = padFixed(((h1 ^ h3) % 899) + 100, 3);

  const defaultNotice =
    kind === "cash"
      ? "Physical Cash Ledger Reserve"
      : kind === "ewallet"
        ? "Digital E-Wallet Account · InstaPay"
        : kind === "digital"
          ? "Digital Banking Account · BSP Supervised"
          : "Authorized Debit Card · BancNet EMV";

  return {
    cardNumberGroups: [prefixBin, mid1, mid2, last4],
    validThru: `${expMonth}/${expYear}`,
    cvc,
    issuerNotice: ISSUER_NOTICE_MAP[seed] ?? defaultNotice
  };
}

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
    chipFinish: defaults.chipFinish,
    material: defaults.material,
    network: defaults.network,
    motif: defaults.motif
  };

  const last4 = cosmeticRef(method || canonicalId);
  const backSpecs = deriveCardBackSpecs(canonicalId, theme.network, last4, kind);

  return {
    ...theme,
    id: canonicalId,
    displayName: def?.name ?? (method.trim() || "Account"),
    kind,
    kindLabel: defaults.label,
    cardLast4: last4,
    ...backSpecs
  };
}
