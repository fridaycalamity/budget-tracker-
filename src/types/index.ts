// Core Data Types

/**
 * Category definition
 * Represents a transaction classification with visual properties
 */
export interface Category {
  id: string; // UUID v4
  name: string; // 1-30 characters, trimmed, unique (case-insensitive)
  icon: string; // Emoji character
  color: string; // Hex color format (#RRGGBB)
  type: 'income' | 'expense' | 'both';
  isDefault: boolean; // true for system categories, false for user-created
}

/**
 * Category validation result
 * Contains validation status and field-specific error messages
 */
export interface CategoryValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Default categories
 * System-provided categories that cannot be deleted or renamed
 */
export const DEFAULT_CATEGORIES: Omit<Category, 'id'>[] = [
  { name: 'Food', icon: '🍔', color: '#ef4444', type: 'expense', isDefault: true },
  { name: 'Transport', icon: '🚗', color: '#3b82f6', type: 'expense', isDefault: true },
  { name: 'Bills', icon: '📄', color: '#f59e0b', type: 'expense', isDefault: true },
  { name: 'Entertainment', icon: '🎬', color: '#8b5cf6', type: 'expense', isDefault: true },
  { name: 'Salary', icon: '💰', color: '#10b981', type: 'income', isDefault: true },
  { name: 'Freelance', icon: '💼', color: '#06b6d4', type: 'income', isDefault: true },
  { name: 'Shopping', icon: '🛍️', color: '#ec4899', type: 'expense', isDefault: true },
  { name: 'Healthcare', icon: '🏥', color: '#14b8a6', type: 'expense', isDefault: true },
  { name: 'Education', icon: '📚', color: '#6366f1', type: 'expense', isDefault: true },
  { name: 'Other', icon: '📌', color: '#6b7280', type: 'both', isDefault: true },
];

/**
 * Transaction type definition
 * Represents a single financial record (income or expense)
 */
export interface Transaction {
  id: string; // UUID v4
  description: string; // 1-200 characters
  amount: number; // Positive number, max 2 decimal places
  type: 'income' | 'expense';
  category: string; // Category ID (migrated from TransactionCategory)
  balanceSourceId?: string; // Balance source ID (nullable for backward compat with existing rows)
  date: string; // ISO 8601 date string (YYYY-MM-DD)
  createdAt: string; // ISO 8601 timestamp
  updatedAt?: string; // ISO 8601 timestamp
  __localOnly?: boolean; // local-only marker for offline queue
  __syncStatus?: 'synced' | 'queued' | 'syncing'; // local sync status
}

/**
 * Legacy category enumeration (deprecated)
 * Kept for backward compatibility during migration
 * @deprecated Use Category interface instead
 */
export type TransactionCategory =
  | 'Food'
  | 'Transport'
  | 'Bills'
  | 'Entertainment'
  | 'Salary'
  | 'Freelance'
  | 'Shopping'
  | 'Healthcare'
  | 'Education'
  | 'Other';

/**
 * Budget goal definition
 * Represents a monthly spending limit
 */
export interface BudgetGoal {
  monthlyLimit: number; // Positive number applied to every month
  month?: string; // legacy compatibility, ignored by current implementation
}

/**
 * Filter state
 * Configuration for filtering transactions
 */
export interface TransactionFilters {
  type: 'all' | 'income' | 'expense';
  category: string | 'all'; // Category ID or 'all'
  dateRange: {
    start: string | null; // ISO 8601 date string
    end: string | null; // ISO 8601 date string
  };
}

/**
 * Sort configuration
 * Defines how transactions should be sorted
 */
export interface SortConfig {
  field: 'date' | 'amount';
  direction: 'asc' | 'desc';
}

/**
 * Financial summary
 * Aggregated financial data calculated from transactions
 */
export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  balance: number; // all-time: overall balance, monthly: end balance for the selected month
  startBalance?: number; // monthly only: carried balance at the start of the period
  expensesByCategory: Record<string, number>; // Category ID -> amount
  balanceBySource?: Record<string, number>; // source end balance for the selected period view
  startBalanceBySource?: Record<string, number>; // monthly only: carried source balances at period start
}

/**
 * Balance source definition
 * Represents a named account/wallet (e.g., GoTyme, BPI, Gcash, Cash)
 */
export interface BalanceSource {
  id: string; // UUID v4
  name: string; // User-defined name, 1-50 characters
  userId: string; // Auth user ID
  createdAt: string; // ISO 8601 timestamp
}

/**
 * Subscription definition
 * Represents a recurring monthly expense template
 */
export interface Subscription {
  id: string; // UUID v4
  name: string; // 1-100 characters
  amount: number; // Fixed monthly amount
  billingDay: number; // Day of month (1-31)
  categoryId: string; // Category ID for the generated expense
  balanceSourceId?: string; // Optional: which source to charge from
  isEnabled: boolean; // Whether the subscription is active
  userId: string; // Auth user ID
  createdAt: string; // ISO 8601 timestamp
}

export interface CreateSubscriptionInput extends Omit<Subscription, 'id' | 'userId' | 'createdAt'> {
  startMode?: 'current' | 'next';
}

/**
 * Subscription payment tracking
 * Records which months have been generated for each subscription
 */
export interface SubscriptionPayment {
  id: string; // UUID v4
  subscriptionId: string; // FK to subscription
  transactionId: string | null; // FK to generated transaction (null if deleted)
  billingMonth: string; // Format: YYYY-MM
  userId: string; // Auth user ID
  createdAt: string; // ISO 8601 timestamp
}

// Context API Interfaces

/**
 * Budget Context value
 * Provides transaction and budget management functionality
 */
export interface BudgetContextValue {
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => void;
  updateTransaction: (id: string, transaction: Omit<Transaction, 'id' | 'createdAt'>) => void;
  deleteTransaction: (id: string) => void;
  balanceSources: BalanceSource[];
  addBalanceSource: (name: string) => Promise<void>;
  updateBalanceSource: (id: string, name: string) => Promise<void>;
  deleteBalanceSource: (id: string) => Promise<void>;
  assignTransactionsToSource: (transactionIds: string[], sourceId: string) => Promise<void>;
  subscriptions: Subscription[];
  addSubscription: (sub: CreateSubscriptionInput) => Promise<void>;
  updateSubscription: (id: string, updates: Partial<Subscription>) => Promise<void>;
  deleteSubscription: (id: string) => Promise<void>;
  toggleSubscription: (id: string) => Promise<void>;
  subscriptionPayments: SubscriptionPayment[];
  budgetGoal: BudgetGoal | null;
  setBudgetGoal: (goal: BudgetGoal | null) => void;
  getMonthlySummary: (month: string) => FinancialSummary;
  clearAllData: () => void;
  retrySync: () => Promise<void>;
  clearLocalCache: () => Promise<void>;
  forceRefreshFromServer: () => Promise<void>;
  queuedCount: number;
  isSyncing: boolean;
  isOffline: boolean;
  summary: FinancialSummary;
  loading: boolean;
}

/**
 * Category Context value
 * Provides category management functionality
 */
export interface CategoryContextValue {
  categories: Category[];
  addCategory: (category: Omit<Category, 'id' | 'isDefault'>) => void;
  updateCategory: (id: string, updates: Partial<Omit<Category, 'id' | 'isDefault'>>) => void;
  deleteCategory: (id: string) => void;
  getCategoryById: (id: string) => Category | undefined;
  getCategoriesByType: (type: 'income' | 'expense' | 'both') => Category[];
  getDefaultCategories: () => Category[];
  getCustomCategories: () => Category[];
  loading: boolean;
}

/**
 * Theme Context value
 * Provides theme management functionality
 */
export interface ThemeContextValue {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

// Storage Interface

/**
 * localStorage wrapper interface
 * Defines methods for data persistence
 */
export interface StorageService {
  getTransactions(): Transaction[];
  saveTransactions(transactions: Transaction[]): void;
  getBudgetGoal(): BudgetGoal | null;
  saveBudgetGoal(goal: BudgetGoal | null): void;
  getTheme(): 'light' | 'dark';
  saveTheme(theme: 'light' | 'dark'): void;
  getCategories(): Category[];
  saveCategories(categories: Category[]): void;
  getMigrationFlag(): boolean;
  setMigrationFlag(migrated: boolean): void;
  clearAll(): void;
}

// Validation Interface

/**
 * Validation result
 * Contains validation status and error messages
 */
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

// Toast Notification Interface

/**
 * Toast notification type
 * Represents a temporary notification message
 */
export interface Toast {
  id: string; // Unique identifier
  message: string; // Message to display
  type: 'success' | 'error'; // Toast type
  duration?: number; // Auto-dismiss duration in ms (default: 3000)
}

/**
 * Toast Context value
 * Provides toast notification functionality
 */
export interface ToastContextValue {
  toasts: Toast[];
  showToast: (message: string, type: 'success' | 'error', duration?: number) => void;
  removeToast: (id: string) => void;
}
