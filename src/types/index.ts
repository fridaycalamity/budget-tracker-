// Core Data Types

/**
 * Transaction type definition
 * Represents a single financial record (income or expense)
 */
export interface Transaction {
  id: string; // UUID v4
  description: string; // 1-200 characters
  amount: number; // Positive number, max 2 decimal places
  type: 'income' | 'expense';
  category: TransactionCategory;
  date: string; // ISO 8601 date string (YYYY-MM-DD)
  createdAt: string; // ISO 8601 timestamp
}

/**
 * Category enumeration
 * Predefined categories for transaction classification
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
  category: TransactionCategory | 'all';
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
  expensesByCategory: Record<TransactionCategory, number>;
}

// Context API Interfaces

/**
 * Budget Context value
 * Provides transaction and budget management functionality
 */
export interface BudgetContextValue {
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => void;
  deleteTransaction: (id: string) => void;
  budgetGoal: BudgetGoal | null;
  setBudgetGoal: (goal: BudgetGoal | null) => void;
  clearAllData: () => void;
  summary: FinancialSummary;
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
