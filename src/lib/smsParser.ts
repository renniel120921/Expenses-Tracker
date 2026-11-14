import { MAX_MONEY_CENTAVOS, stripUnsafeText } from "./core";
import type { EntryType } from "@/types/finance";

export interface ParsedSmsTransaction {
  amount: string;
  desc: string;
  method: string;
  type: EntryType;
  category: string;
  bankDetected?: string;
  cardLastDigits?: string;
}

const MAX_SMS_INPUT_LENGTH = 4000;
const MAX_PESO_VALUE = MAX_MONEY_CENTAVOS / 100;

const AMOUNT_PATTERNS = [
  /(?:PHP|Php|₱)\s*([\d,]+(?:\.\d{1,2})?)/i,
  /(?:amount\s*(?:of|:)?\s*(?:PHP|Php|₱)?\s*)([\d,]+(?:\.\d{1,2})?)/i,
  /(?:debited|credited|charged|paid|sent|received)\s*(?:PHP|Php|₱)?\s*([\d,]+(?:\.\d{1,2})?)/i,
  /\bP\s*([\d,]+(?:\.\d{1,2})?)\s*(?:was|has|debited|paid|to|at|from)/i
];

const WALLET_CANDIDATES: Array<[RegExp, string]> = [
  [/\b(?:maribank|mari\s*bank)\b/i, "MariBank"],
  [/\b(?:seabank|sea\s*bank)\b/i, "SeaBank"],
  [/\b(?:gotyme|go\s*tyme)\b/i, "GoTyme"],
  [/\b(?:landbank|land\s*bank)\b/i, "LandBank"],
  [/\bgcash\b/i, "GCash"],
  [/\b(?:maya|paymaya)\b/i, "Maya"],
  [/\bbdo\b/i, "BDO"],
  [/\bbpi\b/i, "BPI"],
  [/\b(?:unionbank|union\s*bank)\b/i, "UnionBank"],
  [/\b(?:metrobank|metro\s*bank)\b/i, "Metrobank"],
  [/\bcimb\b/i, "CIMB"],
  [/\brcbc\b/i, "RCBC"],
  [/\bpnb\b/i, "PNB"],
  [/\b(?:securitybank|security\s*bank)\b/i, "SecurityBank"],
  [/\b(?:chinabank|china\s*bank)\b/i, "ChinaBank"],
  [/\b(?:eastwest|east\s*west)\b/i, "EastWest"],
  [/\btonik\b/i, "Tonik"],
  [/\buno\s*(?:bank|digital)?\b/i, "UNO"],
  [/\b(?:shopeepay|shopee\s*pay)\b/i, "ShopeePay"],
  [/\b(?:grabpay|grab\s*pay)\b/i, "GrabPay"]
];

export function parseTransactionSms(
  rawText: string,
  availableWallets: readonly string[] = []
): ParsedSmsTransaction | null {
  const text = stripUnsafeText(rawText).slice(0, MAX_SMS_INPUT_LENGTH).trim();
  if (!text) return null;

  let amount = "";
  for (const re of AMOUNT_PATTERNS) {
    const m = text.match(re);
    if (m?.[1]) {
      const normalized = m[1].replace(/,/g, "");
      const num = Number(normalized);
      if (Number.isFinite(num) && num > 0 && num <= MAX_PESO_VALUE) {
        amount = num.toFixed(2);
        break;
      }
    }
  }
  if (!amount) return null;

  const lower = text.toLowerCase();
  const isIncome =
    /\b(received|credited|deposited|cash[\s-]*in|refund|salary|sahod|transferred to your|transfer from|pumasok|natanggap)\b/i.test(
      text
    ) &&
    !/\b(you\s+(?:have\s+)?(?:paid|sent)|debited|charged|purchase|bawas|nabawas)\b/i.test(text);

  const type: EntryType = isIncome ? "income" : "expense";

  // Detect bank identity from SMS / notification text
  let bankDetected: string | undefined;
  for (const [re, name] of WALLET_CANDIDATES) {
    if (re.test(text)) {
      bankDetected = name;
      break;
    }
  }

  // Detect last 4 digits if available in card/account alert
  const cardDigitsMatch = text.match(
    /\b(?:ending in|card ending|account ending|ending|last digits?)\s*(?:in|:)?\s*(\d{4})\b/i
  );
  const cardLastDigits = cardDigitsMatch ? cardDigitsMatch[1] : undefined;

  // Resolve best matching wallet in availableWallets
  let method = availableWallets.includes("Cash")
    ? "Cash"
    : availableWallets[0] || (bankDetected ?? "Cash");

  if (bankDetected) {
    const exact = availableWallets.find((w) => w.toLowerCase() === bankDetected!.toLowerCase());
    const fuzzy = availableWallets.find((w) => w.toLowerCase().includes(bankDetected!.toLowerCase()));
    if (exact) {
      method = exact;
    } else if (fuzzy) {
      method = fuzzy;
    } else if (availableWallets.includes(bankDetected)) {
      method = bankDetected;
    } else if (availableWallets.length === 0) {
      method = bankDetected;
    }
  }

  let category = "Other";
  if (/\b(meralco|maynilad|manila water|pldt|globe|smart|converge|internet|electric|utilities)\b/i.test(lower)) {
    category = "Bills & Utilities";
  } else if (/\b(jollibee|mcdo|mcdonalds|starbucks|grabfood|foodpanda|chowking|mang inasal|kfc|restaurant|cafe|coffee)\b/i.test(lower)) {
    category = "Food & Dining";
  } else if (/\b(puregold|sm supermarket|robinsons|savemore|mercury drug|grocery|supermarket|dali)\b/i.test(lower)) {
    category = "Groceries";
  } else if (/\b(grab|angkas|joyride|beep|shell|petron|caltex|toll|fuel|gasoline)\b/i.test(lower)) {
    category = "Transportation";
  } else if (/\b(load|prepaid|promo|data|gcash load)\b/i.test(lower)) {
    category = "Mobile & Data";
  } else if (/\b(shopee|lazada|tiktok shop|zalora|shein|mall)\b/i.test(lower)) {
    category = "Shopping";
  }

  const merchantMatch =
    text.match(/\b(?:to|at|from|with|merchant|store|payee)\s+([A-Za-z0-9&'.\-\s]{2,36}?)(?:\s+(?:on|via|using|ref|reference|card|account|dated|in|into|[.,])|$)/i) ||
    text.match(/\b(?:paid|sent)\s+(?:PHP|Php|₱)?\s*[\d,.]+\s+(?:to|at)\s+([A-Za-z0-9&'.\-\s]{2,36}?)(?:\s|$)/i);

  let rawDesc = merchantMatch?.[1]?.trim() || "";
  if (/^(?:your|the|a|my|cash|bank|card|account)$/i.test(rawDesc)) {
    rawDesc = "";
  }

  const desc = rawDesc
    ? stripUnsafeText(rawDesc).slice(0, 120).trim()
    : isIncome
      ? `${method} Pumasok na Pondo`
      : `${method} Bayad`;

  return {
    amount,
    desc,
    method,
    type,
    category,
    bankDetected,
    cardLastDigits
  };
}
