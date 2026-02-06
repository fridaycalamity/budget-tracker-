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
  date: string; // ISO 8601 date string (YYYY-MM-DD)
  createdAt: string; // ISO 8601 timestamp
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
  monthlyLimit: number; // Positive number
  month: string; // Format: YYYY-MM
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
  balance: number;
  expensesByCategory: Record<string, number>; // Category ID -> amount
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
  budgetGoal: BudgetGoal | null;
  setBudgetGoal: (goal: BudgetGoal | null) => void;
  clearAllData: () => void;
  summary: FinancialSummary;
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
