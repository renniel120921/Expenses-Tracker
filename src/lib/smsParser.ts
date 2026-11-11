import { MAX_MONEY_CENTAVOS, stripUnsafeText } from "./core";
import type { EntryType } from "@/types/finance";

export interface ParsedSmsTransaction {
  amount: string;
  desc: string;
  method: string;
  type: EntryType;
  category: string;
}

const MAX_SMS_INPUT_LENGTH = 4000;
const MAX_PESO_VALUE = MAX_MONEY_CENTAVOS / 100;

const AMOUNT_PATTERNS = [
  /(?:PHP|Php|₱)\s*([\d,]+(?:\.\d{1,2})?)/i,
  /(?:amount\s*(?:of|:)?\s*)([\d,]+(?:\.\d{1,2})?)/i
];

export function parseTransactionSms(rawText: string, availableWallets: readonly string[]): ParsedSmsTransaction | null {
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
  const isIncome = /\b(received|credited|deposited|cash[\s-]*in|refund|salary|transferred to your)\b/i.test(text);
  const type: EntryType = isIncome ? "income" : "expense";

  const walletCandidates: Array<[RegExp, string]> = [
    [/\bgcash\b/i, "GCash"],
    [/\bmaya\b/i, "Maya"],
    [/\bseabank\b/i, "SeaBank"],
    [/\bmaribank\b/i, "MariBank"],
    [/\bgotyme\b/i, "GoTyme"],
    [/\bbdo\b/i, "BDO"],
    [/\bbpi\b/i, "BPI"],
    [/\bunionbank\b/i, "UnionBank"],
    [/\bmetrobank\b/i, "Metrobank"],
    [/\bshopeepay\b/i, "ShopeePay"],
    [/\bgrabpay\b/i, "GrabPay"]
  ];

  let method = availableWallets.includes("Cash") ? "Cash" : availableWallets[0] || "Cash";
  for (const [re, name] of walletCandidates) {
    if (re.test(text) && availableWallets.includes(name)) {
      method = name;
      break;
    }
  }

  let category = "Other";
  if (/\b(meralco|maynilad|manila water|pldt|globe|smart|converge|internet|electric)\b/i.test(lower)) {
    category = "Bills & Utilities";
  } else if (/\b(jollibee|mcdo|starbucks|grabfood|foodpanda|chowking|mang inasal|restaurant|cafe)\b/i.test(lower)) {
    category = "Food & Dining";
  } else if (/\b(puregold|sm supermarket|robinsons|savemore|mercury drug|grocery)\b/i.test(lower)) {
    category = "Groceries";
  } else if (/\b(grab|angkas|joyride|beep|shell|petron|caltex|toll)\b/i.test(lower)) {
    category = "Transportation";
  } else if (/\b(load|prepaid|promo|data)\b/i.test(lower)) {
    category = "Mobile & Data";
  } else if (/\b(shopee|lazada|tiktok shop|mall)\b/i.test(lower)) {
    category = "Shopping";
  }

  const merchantMatch = text.match(/\b(?:to|at|from)\s+([A-Z0-9][A-Za-z0-9 &.'-]{2,36})(?:\s+(?:on|via|ref|with|dated|[.,])|$)/);
  const rawDesc = merchantMatch?.[1]?.trim() || (isIncome ? `${method} Transfer Received` : `${method} Payment`);
  const desc = stripUnsafeText(rawDesc).slice(0, 120).trim();

  return { amount, desc, method, type, category };
}
