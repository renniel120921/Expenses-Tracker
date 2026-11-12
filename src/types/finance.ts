export type EntryType = "expense" | "income" | "transfer";
export type SpendType = "need" | "luho";
export type BillStatus = "Unpaid" | "Paid" | "Overdue";
export type BillRecurrence = "none" | "weekly" | "monthly" | "quarterly" | "yearly";
export type BudgetCycle = "monthly" | "kinsenas";
export type SavingsGoalColor = "emerald" | "blue" | "amber" | "violet" | "rose";
export type UtangDirection = "owed_to_me" | "i_owe";
export type UtangStatus = "Unpaid" | "Paid";
export type LanguageCode = "en" | "tl";
export type ThemePreference = "system" | "light" | "dark";
export type NavTab = "home" | "history" | "analytics" | "plan" | "bills" | "utang" | "profile";

export interface TimestampLike {
  toDate?: () => Date;
  toMillis?: () => number;
}

export interface TransactionEntry {
  id: string;
  type: EntryType;
  desc: string;
  note?: string;
  amount: number;
  category: string;
  method: string;
  toMethod?: string;
  spendType?: SpendType;
  date?: string;
  createdAt?: TimestampLike | Date | string | number | null;
  timestamp?: TimestampLike | Date | string | number | null;
}

export interface BillRecord {
  id: string;
  title: string;
  amount: number;
  dueDate: string;
  category: string;
  notes?: string;
  recurrence?: BillRecurrence;
  status: BillStatus;
  createdAt?: TimestampLike | Date | string | number | null;
}

export interface SavingsGoalRecord {
  id: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
  wallet?: string | null;
  targetDate?: string | null;
  color?: SavingsGoalColor;
  createdAt?: TimestampLike | Date | string | number | null;
  updatedAt?: TimestampLike | Date | string | number | null;
}

export interface CategoryBudgetRecord {
  id: string;
  category: string;
  limitAmount: number;
  createdAt?: TimestampLike | Date | string | number | null;
  updatedAt?: TimestampLike | Date | string | number | null;
}

export interface UtangRecord {
  id: string;
  name: string;
  amount: number;
  direction: UtangDirection;
  dueDate: string | null;
  notes?: string;
  status: UtangStatus;
  createdAt?: TimestampLike | Date | string | number | null;
  settledAt?: TimestampLike | Date | string | number | null;
}

export interface FinancialGoal {
  name?: string;
  targetAmount?: number | null;
  wallet?: string;
  contribution?: number | null;
  frequency?: string;
  startDate?: string | null;
}

export interface NotificationSettings {
  dailyReminders?: boolean;
  reminderTime?: string;
  overbudgetAlerts?: boolean;
  budgetThreshold?: number;
  lastReminderDate?: string;
}

export interface UserPreferences {
  lang?: LanguageCode;
}

export interface UserDocumentData {
  monthlyBudget?: number | null;
  budgetCycle?: BudgetCycle;
  wallets?: Record<string, number>;
  financialGoals?: FinancialGoal;
  notificationSettings?: NotificationSettings;
  preferences?: UserPreferences;
  lang?: LanguageCode;
  statsCounted?: boolean;
}

export interface PublicStats {
  totalUsers: number;
  updatedAt?: unknown;
}

export interface WalletDefinition {
  id: string;
  name: string;
  type: "cash" | "ewallet" | "digital" | "bank";
}

export interface CachedUserSnapshot {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
}
