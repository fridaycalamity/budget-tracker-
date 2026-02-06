import type { Transaction, BudgetGoal, StorageService } from '../types';

/**
 * Storage keys for localStorage
 * Prefixed with 'budget_tracker_' to avoid conflicts with other applications
 */
const STORAGE_KEYS = {
  TRANSACTIONS: 'budget_tracker_transactions',
  BUDGET_GOAL: 'budget_tracker_budget_goal',
  THEME: 'budget_tracker_theme',
} as const;

/**
 * localStorage wrapper service
 * Provides error-safe methods for persisting and retrieving application data
 * 
 * All methods handle JSON serialization/deserialization errors gracefully
 * and log errors to the console for debugging purposes.
 */
export const storageService: StorageService = {
  /**
   * Retrieves all transactions from localStorage
   * @returns Array of transactions, or empty array if none exist or on error
   * 
   * @example
   * const transactions = storageService.getTransactions();
   * console.log(transactions); // [{ id: '...', description: '...', ... }]
   */
  getTransactions(): Transaction[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      if (!data) {
        return [];
      }
      
      const parsed = JSON.parse(data);
      
      // Validate that parsed data is an array
      if (!Array.isArray(parsed)) {
        console.error('Invalid transactions data in localStorage: expected array');
        return [];
      }
      
      return parsed;
    } catch (error) {
      console.error('Error reading transactions from localStorage:', error);
      return [];
    }
  },

  /**
   * Saves transactions array to localStorage
   * @param transactions - Array of transactions to persist
   * 
   * @example
   * storageService.saveTransactions([
   *   { id: '1', description: 'Salary', amount: 5000, type: 'income', ... }
   * ]);
   */
  saveTransactions(transactions: Transaction[]): void {
    try {
      const data = JSON.stringify(transactions);
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, data);
    } catch (error) {
      console.error('Error saving transactions to localStorage:', error);
      // Note: We don't throw the error to prevent app crashes
      // The user will see their changes not persisted on reload
    }
  },

  /**
   * Retrieves budget goal from localStorage
   * @returns Budget goal object, or null if none exists or on error
   * 
   * @example
   * const goal = storageService.getBudgetGoal();
   * console.log(goal); // { monthlyLimit: 10000, month: '2024-01' } or null
   */
  getBudgetGoal(): BudgetGoal | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BUDGET_GOAL);
      if (!data) {
        return null;
      }
      
      const parsed = JSON.parse(data);
      
      // Validate that parsed data has the expected structure
      if (parsed && typeof parsed === 'object' && 'monthlyLimit' in parsed && 'month' in parsed) {
        return parsed as BudgetGoal;
      }
      
      console.error('Invalid budget goal data in localStorage');
      return null;
    } catch (error) {
      console.error('Error reading budget goal from localStorage:', error);
      return null;
    }
  },

  /**
   * Saves budget goal to localStorage
   * @param goal - Budget goal to persist, or null to remove
   * 
   * @example
   * // Save a budget goal
   * storageService.saveBudgetGoal({ monthlyLimit: 10000, month: '2024-01' });
   * 
   * // Remove budget goal
   * storageService.saveBudgetGoal(null);
   */
  saveBudgetGoal(goal: BudgetGoal | null): void {
    try {
      if (goal === null) {
        localStorage.removeItem(STORAGE_KEYS.BUDGET_GOAL);
      } else {
        const data = JSON.stringify(goal);
        localStorage.setItem(STORAGE_KEYS.BUDGET_GOAL, data);
      }
    } catch (error) {
      console.error('Error saving budget goal to localStorage:', error);
    }
  },

  /**
   * Retrieves theme preference from localStorage
   * @returns Theme preference ('light' or 'dark'), defaults to 'light' if not set
   * 
   * @example
   * const theme = storageService.getTheme();
   * console.log(theme); // 'light' or 'dark'
   */
  getTheme(): 'light' | 'dark' {
    try {
      const theme = localStorage.getItem(STORAGE_KEYS.THEME);
      
      // Validate theme value
      if (theme === 'light' || theme === 'dark') {
        return theme;
      }
      
      // Default to light theme if invalid or not set
      return 'light';
    } catch (error) {
      console.error('Error reading theme from localStorage:', error);
      return 'light';
    }
  },

  /**
   * Saves theme preference to localStorage
   * @param theme - Theme preference to persist ('light' or 'dark')
   * 
   * @example
   * storageService.saveTheme('dark');
   */
  saveTheme(theme: 'light' | 'dark'): void {
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, theme);
    } catch (error) {
      console.error('Error saving theme to localStorage:', error);
    }
  },

  /**
   * Clears all application data from localStorage
   * Removes transactions, budget goal, and theme preference
   * 
   * @example
   * storageService.clearAll();
   * // All budget tracker data is now removed from localStorage
   */
  clearAll(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
      localStorage.removeItem(STORAGE_KEYS.BUDGET_GOAL);
      // Note: We intentionally don't remove theme preference
      // as users typically want to keep their theme choice
      // even when clearing financial data
    } catch (error) {
      console.error('Error clearing data from localStorage:', error);
    }
  },
};
