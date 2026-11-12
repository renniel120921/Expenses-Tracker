import type { Component } from "vue";
import {
  ArrowLeftRight,
  Banknote,
  Building2,
  CalendarClock,
  Car,
  Clapperboard,
  Coins,
  CreditCard,
  HeartPulse,
  Landmark,
  PiggyBank,
  ReceiptText,
  ShieldCheck,
  ShoppingBag,
  ShoppingBasket,
  Smartphone,
  Tag,
  Utensils,
  Wifi,
  Zap
} from "@lucide/vue";
import type { EntryType } from "@/types/finance";
import type { WalletKind } from "@/lib/walletVisuals";

const EXACT_CATEGORY_ICONS: Record<string, Component> = {
  "food & dining": Utensils,
  pagkain: Utensils,
  transportation: Car,
  pamasahe: Car,
  "bills & utilities": Zap,
  bills: Zap,
  "mobile & data": Wifi,
  load: Wifi,
  groceries: ShoppingBasket,
  shopping: ShoppingBag,
  savings: PiggyBank,
  ipon: PiggyBank,
  transfer: ArrowLeftRight,
  healthcare: HeartPulse,
  entertainment: Clapperboard,
  kita: Coins,
  income: Coins,
  other: Tag,
  "iba pa": Tag
};

const KEYWORD_CATEGORY_ICONS: ReadonlyArray<readonly [RegExp, Component]> = [
  [/credit|bnpl|card|spay|loan|utang/i, CreditCard],
  [/electric|meralco|water|maynilad|manila water|util/i, Zap],
  [/internet|fiber|pldt|globe|smart|mobile|data|wifi/i, Wifi],
  [/rent|housing|condo|assoc|mortgage/i, Building2],
  [/sub|stream|netflix|spotify|cloud/i, CalendarClock],
  [/insur|health|med|clinic|pharma/i, ShieldCheck],
  [/food|dining|coffee|meal/i, Utensils],
  [/grocer|market|palengke/i, ShoppingBasket],
  [/transpo|grab|commute|fare|fuel|gas/i, Car]
];

/**
 * Returns a crisp vector icon component for transaction and bill categories.
 */
export function getCategoryIcon(category: string, type?: EntryType): Component {
  if (type === "income") return Coins;
  if (type === "transfer") return ArrowLeftRight;
  const normalized = String(category || "").trim().toLowerCase();
  if (normalized && EXACT_CATEGORY_ICONS[normalized]) {
    return EXACT_CATEGORY_ICONS[normalized];
  }
  for (const [pattern, icon] of KEYWORD_CATEGORY_ICONS) {
    if (pattern.test(normalized)) {
      return icon;
    }
  }
  return normalized ? ReceiptText : Tag;
}

/**
 * Returns the representative hardware/channel icon for each wallet kind.
 */
export function getWalletKindIcon(kind: WalletKind): Component {
  if (kind === "cash") return Banknote;
  if (kind === "ewallet") return Smartphone;
  return Landmark;
}
