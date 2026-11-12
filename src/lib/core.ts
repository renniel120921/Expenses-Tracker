import type { TransactionEntry, WalletDefinition } from "@/types/finance";

export const MAX_MONEY_CENTAVOS = 100_000_000_000_000;
const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;
const UNSAFE_CHARS_RE = /[\u0000-\u001F\u007F\u202A-\u202E\u2066-\u2069]/g;
const FORBIDDEN_OBJECT_KEYS = new Set(["__proto__", "constructor", "prototype"]);
const SAFE_DATA_IMAGE_RE = /^data:image\/(?:jpeg|jpg|png|webp);base64,[A-Za-z0-9+/=]+$/i;

export interface MoneyOptions {
  allowZero?: boolean;
  allowNegative?: boolean;
}

export function toCentavos(value: unknown, options: MoneyOptions = {}): number {
  const num = typeof value === "string" && value.trim() === "" ? NaN : Number(value);
  if (!Number.isFinite(num)) throw new TypeError("Invalid monetary amount");

  const centavos = Math.round((num + Number.EPSILON) * 100);
  const allowZero = options.allowZero === true;
  const allowNegative = options.allowNegative === true;

  if (
    (!allowNegative && ((!allowZero && centavos <= 0) || (allowZero && centavos < 0))) ||
    Math.abs(centavos) > MAX_MONEY_CENTAVOS
  ) {
    throw new RangeError("Monetary amount is outside the allowed range");
  }
  return centavos;
}

export function fromCentavos(centavos: number): number {
  return centavos / 100;
}

export function money(value: unknown, options?: MoneyOptions): number {
  return fromCentavos(toCentavos(value, options));
}

export function sumMoney(values: ReadonlyArray<unknown>): number {
  const totalCentavos = values.reduce<number>(
    (sum, value) => sum + toCentavos(value, { allowZero: true, allowNegative: true }),
    0
  );
  return fromCentavos(totalCentavos);
}

export function walletBalances(
  entries: ReadonlyArray<Partial<TransactionEntry>> | null | undefined,
  baseBalances: Record<string, unknown> = {}
): Record<string, number> {
  const cents: Record<string, number> = {};

  Object.entries(baseBalances || {}).forEach(([method, amount]) => {
    if (FORBIDDEN_OBJECT_KEYS.has(method)) return;
    try {
      cents[method] = toCentavos(amount, { allowZero: true, allowNegative: true });
    } catch {
      cents[method] = 0;
    }
  });

  if (Array.isArray(entries)) {
    for (const entry of entries) {
      const rawMethod = String(entry?.method || "Cash");
      const method = FORBIDDEN_OBJECT_KEYS.has(rawMethod) ? "Cash" : rawMethod;
      let amount = 0;
      try {
        amount = toCentavos(entry?.amount, { allowZero: true });
      } catch {
        continue;
      }
      if (entry?.type === "transfer") {
        const toRaw = String(entry?.toMethod || "");
        const toMethod = FORBIDDEN_OBJECT_KEYS.has(toRaw) ? "" : toRaw;
        cents[method] = (cents[method] || 0) - amount;
        if (toMethod && toMethod !== method) {
          cents[toMethod] = (cents[toMethod] || 0) + amount;
        }
      } else {
        cents[method] = (cents[method] || 0) + (entry?.type === "income" ? amount : -amount);
      }
    }
  }

  return Object.fromEntries(
    Object.entries(cents).map(([method, amount]) => [method, fromCentavos(amount)])
  );
}

/**
 * Sums current balances strictly for active linked wallets using integer centavos.
 */
export function sumActiveWalletsBalance(
  wallets: ReadonlyArray<string>,
  balancesMap: Readonly<Record<string, number>>
): number {
  let cents = 0;
  for (const method of wallets) {
    if (FORBIDDEN_OBJECT_KEYS.has(method)) continue;
    const raw = Number(balancesMap[method] ?? 0);
    if (!Number.isFinite(raw)) continue;
    cents += Math.sign(raw) * toCentavos(Math.abs(raw), { allowZero: true });
  }
  return fromCentavos(cents);
}

/**
 * Computes the base balance to persist in Firestore so current entries plus base
 * balance equal the user's desired current balance (used when reconciling or re-linking).
 */
export function deriveWalletBaseBalance(
  entries: ReadonlyArray<Partial<TransactionEntry>> | null | undefined,
  method: string,
  targetBalance: unknown
): number {
  const targetCents = toCentavos(targetBalance, { allowZero: true, allowNegative: true });
  let netCents = 0;
  if (Array.isArray(entries)) {
    for (const entry of entries) {
      let amountCents = 0;
      try {
        amountCents = toCentavos(entry?.amount, { allowZero: true });
      } catch {
        continue;
      }
      if (entry?.type === "transfer") {
        if (entry.method === method) netCents -= amountCents;
        if (entry.toMethod === method) netCents += amountCents;
      } else if (entry?.method === method) {
        netCents += entry?.type === "income" ? amountCents : -amountCents;
      }
    }
  }
  return fromCentavos(targetCents - netCents);
}

export function stripUnsafeText(value: unknown): string {
  return String(value == null ? "" : value).replace(UNSAFE_CHARS_RE, "");
}

export function assertSafeObjectKey(key: string, label = "Key"): string {
  if (!key || FORBIDDEN_OBJECT_KEYS.has(key) || key.includes(".")) {
    throw new TypeError(`Invalid ${label}`);
  }
  return key;
}

export function sanitizeAvatarUrl(url: unknown): string {
  const cleaned = stripUnsafeText(url).trim();
  if (!cleaned || cleaned.length > 8192) return "";
  if (SAFE_DATA_IMAGE_RE.test(cleaned)) return cleaned;
  try {
    const parsed = new URL(cleaned);
    if (parsed.protocol === "https:") return parsed.toString();
    if (
      parsed.protocol === "http:" &&
      (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1")
    ) {
      return parsed.toString();
    }
  } catch {
    // Reject non-URL strings (e.g. javascript:, vbscript:, relative blobs without scheme)
  }
  return "";
}

export function cleanText(value: unknown, label: string, maxLength: number): string {
  const text = stripUnsafeText(value).trim();
  if (!text || text.length > maxLength) {
    throw new TypeError(`${label} must contain 1-${maxLength} characters`);
  }
  return text;
}

export function optionalText(value: unknown, maxLength: number): string {
  const text = stripUnsafeText(value).trim();
  if (text.length > maxLength) {
    throw new TypeError(`Text must not exceed ${maxLength} characters`);
  }
  return text;
}

export function assertChoice<T extends string>(value: unknown, choices: ReadonlyArray<T>, label: string): T {
  if (typeof value !== "string" || !choices.includes(value as T)) {
    throw new TypeError(`Invalid ${label}`);
  }
  return value as T;
}

export function isDateKey(value: unknown): value is string {
  if (typeof value !== "string" || !DATE_KEY_RE.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export interface PlainCalendarDate {
  year: number;
  month: number;
  day: number;
}

export function parseDateKey(value: unknown): PlainCalendarDate | null {
  if (!isDateKey(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  return { year, month, day };
}

export function dayDiffFromKeys(targetKey: unknown, baseKey: unknown): number | null {
  const target = parseDateKey(targetKey);
  const base = parseDateKey(baseKey);
  if (!target || !base) return null;
  const targetDay = Math.floor(Date.UTC(target.year, target.month - 1, target.day) / 86_400_000);
  const baseDay = Math.floor(Date.UTC(base.year, base.month - 1, base.day) / 86_400_000);
  return targetDay - baseDay;
}

export function formatDateKeyReadable(
  value: unknown,
  opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" },
  locale = "en-PH"
): string {
  const parsed = parseDateKey(value);
  if (!parsed) return typeof value === "string" && value ? value : "—";
  return new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day)).toLocaleDateString(locale, {
    ...opts,
    timeZone: "UTC"
  });
}

export function manilaDateKey(value: Date | number | string = new Date()): string | null {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  })
    .formatToParts(date)
    .reduce<Record<string, string>>((out, part) => {
      out[part.type] = part.value;
      return out;
    }, {});
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function entryDate(entry: Partial<TransactionEntry> | null | undefined): Date | null {
  if (!entry) return null;
  if (isDateKey(entry.date)) return new Date(`${entry.date}T00:00:00+08:00`);
  const raw = entry.createdAt ?? entry.timestamp;
  if (!raw) return null;
  if (typeof raw === "object") {
    if ("toDate" in raw && typeof raw.toDate === "function") return raw.toDate();
    if ("toMillis" in raw && typeof raw.toMillis === "function") return new Date(raw.toMillis());
    if (raw instanceof Date) return raw;
  }
  if (typeof raw === "string" || typeof raw === "number") {
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

export function addMonthsClamped(value: Date | string, months: number): Date | null {
  const date = value instanceof Date ? new Date(value) : new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  const day = date.getDate();
  date.setDate(1);
  date.setMonth(date.getMonth() + Number(months));
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  date.setDate(Math.min(day, lastDay));
  return date;
}

export function storageKey(uid: string, name: string): string {
  const safeUid = String(uid || "").replace(/[^A-Za-z0-9_-]/g, "");
  const safeName = String(name || "").replace(/[^A-Za-z0-9_-]/g, "");
  if (!safeUid || !safeName) throw new TypeError("A user and storage key are required");
  return `tipid_user_${safeUid}_${safeName}`;
}

export function formatPeso(value: unknown, hideCentavos = false): string {
  let amount = 0;
  try {
    amount = money(value, { allowZero: true, allowNegative: true });
  } catch {
    amount = 0;
  }
  return amount.toLocaleString("en-PH", {
    minimumFractionDigits: hideCentavos ? 0 : 2,
    maximumFractionDigits: hideCentavos ? 0 : 2
  });
}

export function cosmeticRef(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return String((h % 9000) + 1000);
}

export function csvEscapeCell(value: unknown): string {
  let safe = value == null ? "" : String(value);
  // Mitigate CSV/spreadsheet formula injection (OWASP CSV Injection)
  if (/^[=+\-@\t\r]/.test(safe)) {
    safe = `'${safe}`;
  }
  return `"${safe.replace(/"/g, '""')}"`;
}

export function buildTransactionsCsv(entries: ReadonlyArray<TransactionEntry>): string {
  const header = ["date", "type", "spend_type", "category", "wallet", "amount", "description"];
  const rows = entries.map((e) => {
    const date = entryDate(e);
    const values = [
      date ? date.toISOString() : "",
      e.type,
      e.type === "expense" ? e.spendType || "need" : "",
      e.category,
      e.type === "transfer" && e.toMethod ? `${e.method} -> ${e.toMethod}` : e.method,
      money(e.amount, { allowZero: true }),
      e.desc ?? e.note ?? ""
    ];
    return values.map(csvEscapeCell).join(",");
  });
  return [header.join(","), ...rows].join("\n");
}

export const CATEGORIES: readonly string[] = [
  "Food & Dining",
  "Transportation",
  "Bills & Utilities",
  "Mobile & Data",
  "Groceries",
  "Shopping",
  "Savings",
  "Healthcare",
  "Entertainment",
  "Other"
];

export const CATEGORY_COLOR: Record<string, string> = {
  "Food & Dining": "#C84B31",
  "Pagkain": "#C84B31",
  "Transportation": "#D9822B",
  "Pamasahe": "#D9822B",
  "Bills & Utilities": "#1F6F54",
  "Bills": "#1F6F54",
  "Mobile & Data": "#2E6F95",
  "Load": "#2E6F95",
  "Groceries": "#2A9D8F",
  "Shopping": "#7B5EA7",
  "Savings": "#B48619",
  "Ipon": "#B48619",
  "Healthcare": "#D45B49",
  "Entertainment": "#B85C87",
  "Other": "#68786E",
  "Iba pa": "#68786E",
  "Kita": "#18794E"
};

export function getCategoryColor(category: string): string {
  return CATEGORY_COLOR[category] || "#68786E";
}

export const SUPPORTED_WALLETS: readonly WalletDefinition[] = [
  { id: "Cash", name: "Cash", type: "cash" },
  { id: "GCash", name: "GCash", type: "ewallet" },
  { id: "Maya", name: "Maya", type: "ewallet" },
  { id: "ShopeePay", name: "ShopeePay", type: "ewallet" },
  { id: "GrabPay", name: "GrabPay", type: "ewallet" },
  { id: "MariBank", name: "MariBank", type: "digital" },
  { id: "SeaBank", name: "SeaBank", type: "digital" },
  { id: "GoTyme", name: "GoTyme Bank", type: "digital" },
  { id: "Tonik", name: "Tonik Bank", type: "digital" },
  { id: "UNO", name: "UNO Digital Bank", type: "digital" },
  { id: "UnionDigital", name: "UnionDigital Bank", type: "digital" },
  { id: "OFBank", name: "OFBank", type: "digital" },
  { id: "CIMB", name: "CIMB Bank", type: "digital" },
  { id: "DiskarTech", name: "DiskarTech", type: "digital" },
  { id: "BDO", name: "BDO Unibank", type: "bank" },
  { id: "BPI", name: "BPI", type: "bank" },
  { id: "UnionBank", name: "UnionBank", type: "bank" },
  { id: "Metrobank", name: "Metrobank", type: "bank" },
  { id: "PNB", name: "PNB", type: "bank" },
  { id: "SecurityBank", name: "Security Bank", type: "bank" },
  { id: "RCBC", name: "RCBC", type: "bank" },
  { id: "ChinaBank", name: "China Bank", type: "bank" },
  { id: "EastWest", name: "EastWest Bank", type: "bank" },
  { id: "LandBank", name: "Land Bank", type: "bank" },
  { id: "PSBank", name: "PSBank", type: "bank" },
  { id: "PayPal", name: "PayPal", type: "ewallet" }
];

const SHORTCUT_ACTION_MAP: Readonly<Record<string, "expense" | "income">> = {
  new_expense: "expense",
  new_income: "income"
};

/** Maps a PWA launcher shortcut `?action=` query string to an initial transaction type. */
export function resolveShortcutTransactionType(search: string): "expense" | "income" | null {
  if (!search) return null;
  const params = new URLSearchParams(search);
  const action = (params.get("action") || "").trim().toLowerCase();
  return SHORTCUT_ACTION_MAP[action] ?? null;
}
