import { format, parseISO } from 'date-fns';
import type { Transaction, FinancialSummary, TransactionFilters, SortConfig } from '../types';

// Re-export storage service and seed data generator
export { storageService } from './storage';
export { generateSeedData } from './seedData';

// Re-export category utilities
export {
  validateCategory,
  isCategoryNameUnique,
  getCategoryColor,
  getCategoryIcon,
  getCategoryName,
  reassignTransactions,
  countTransactionsByCategory,
} from './categoryValidation';

export {
  needsMigration,
  migrateTransactions,
  mapLegacyCategoryToId,
  initializeDefaultCategories,
} from './categoryMigration';

/**
 * Formats a number as Philippine Peso currency
 * @param amount - The amount to format
 * @returns Formatted currency string with ₱ symbol, comma separators, and 2 decimal places
 * 
 * @example
 * formatCurrency(1234.5) // "₱1,234.50"
 * formatCurrency(1000000) // "₱1,000,000.00"
 * formatCurrency(0) // "₱0.00"
 */
export function formatCurrency(amount: number): string {
  // Format the number with 2 decimal places and comma separators
  const formatted = amount.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  
  // Add Philippine Peso symbol
  return `₱${formatted}`;
}

/**
 * Formats an ISO 8601 date string for display
 * @param dateString - ISO 8601 date string (YYYY-MM-DD)
 * @returns Human-readable date string (e.g., "Jan 15, 2024")
 * 
 * @example
 * formatDate("2024-01-15") // "Jan 15, 2024"
 * formatDate("2024-12-25") // "Dec 25, 2024"
 */
export function formatDate(dateString: string): string {
  try {
    const date = parseISO(dateString);
    return format(date, 'MMM d, yyyy');
  } catch (error) {
    console.error('Invalid date string:', dateString, error);
    return dateString; // Return original string if parsing fails
  }
}

/**
 * Gets the current month in YYYY-MM format
 * @returns Current month string (e.g., "2024-01")
 * 
 * @example
 * getCurrentMonth() // "2024-01" (if current date is in January 2024)
 */
export function getCurrentMonth(): string {
  const now = new Date();
  return format(now, 'yyyy-MM');
}

/**
 * Checks if a date falls within a specified date range
 * @param date - ISO 8601 date string to check (YYYY-MM-DD)
 * @param start - Start date of range (ISO 8601) or null for no lower bound
 * @param end - End date of range (ISO 8601) or null for no upper bound
 * @returns True if date is within range (inclusive), false otherwise
 * 
 * @example
 * isInDateRange("2024-01-15", "2024-01-01", "2024-01-31") // true
 * isInDateRange("2024-01-15", "2024-02-01", "2024-02-28") // false
 * isInDateRange("2024-01-15", null, "2024-01-31") // true (no lower bound)
 * isInDateRange("2024-01-15", "2024-01-01", null) // true (no upper bound)
 * isInDateRange("2024-01-15", null, null) // true (no bounds)
 */
export function isInDateRange(
  date: string,
  start: string | null,
  end: string | null
): boolean {
  try {
    const checkDate = parseISO(date);
    
    // Check if the parsed date is valid
    if (isNaN(checkDate.getTime())) {
      console.error('Invalid date in range check:', { date, start, end });
      return false;
    }
    
    // If start date is specified, check if date is >= start
    if (start !== null) {
      const startDate = parseISO(start);
      if (isNaN(startDate.getTime())) {
        console.error('Invalid start date in range check:', { date, start, end });
        return false;
      }
      if (checkDate < startDate) {
        return false;
      }
    }
    
    // If end date is specified, check if date is <= end
    if (end !== null) {
      const endDate = parseISO(end);
      if (isNaN(endDate.getTime())) {
        console.error('Invalid end date in range check:', { date, start, end });
        return false;
      }
      if (checkDate > endDate) {
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error in date range check:', { date, start, end }, error);
    return false; // Return false if any error occurs
  }
}

/**
 * Calculates financial summary from an array of transactions
 * Computes total income, total expenses, balance, and expenses by category
 * 
 * @param transactions - Array of transactions to summarize
 * @returns Financial summary with totals and category breakdown
 * 
 * @example
 * const transactions = [
 *   { type: 'income', amount: 5000, category: 'Salary', ... },
 *   { type: 'expense', amount: 1000, category: 'Food', ... },
 *   { type: 'expense', amount: 500, category: 'Food', ... }
 * ];
 * calculateSummary(transactions)
 * // {
 * //   totalIncome: 5000,
 * //   totalExpenses: 1500,
 * //   balance: 3500,
 * //   expensesByCategory: { Food: 1500, Transport: 0, ... }
 * // }
 */
export function calculateSummary(transactions: Transaction[]): FinancialSummary {
  // Initialize totals
  let totalIncome = 0;
  let totalExpenses = 0;
  
  // Initialize expenses by category (dynamic based on transactions)
  const expensesByCategory: Record<string, number> = {};
  
  // Process each transaction
  for (const transaction of transactions) {
    if (transaction.type === 'income') {
      totalIncome += transaction.amount;
    } else if (transaction.type === 'expense') {
      totalExpenses += transaction.amount;
      // Add to category total (initialize if not exists)
      if (!expensesByCategory[transaction.category]) {
        expensesByCategory[transaction.category] = 0;
      }
      expensesByCategory[transaction.category] += transaction.amount;
    }
  }
  
  // Calculate balance (income minus expenses)
  const balance = totalIncome - totalExpenses;
  
  return {
    totalIncome,
    totalExpenses,
    balance,
    expensesByCategory,
  };
}

/**
 * Filters transactions based on provided filter criteria
 * Supports filtering by type (income/expense/all), category, and date range
 * 
 * @param transactions - Array of transactions to filter
 * @param filters - Filter configuration specifying type, category, and date range
 * @returns Filtered array of transactions matching all active filters
 * 
 * @example
 * const transactions = [
 *   { type: 'income', category: 'Salary', date: '2024-01-15', ... },
 *   { type: 'expense', category: 'Food', date: '2024-01-20', ... },
 *   { type: 'expense', category: 'Transport', date: '2024-02-05', ... }
 * ];
 * 
 * // Filter by type
 * filterTransactions(transactions, { type: 'expense', category: 'all', dateRange: { start: null, end: null } })
 * // Returns only expense transactions
 * 
 * // Filter by category
 * filterTransactions(transactions, { type: 'all', category: 'Food', dateRange: { start: null, end: null } })
 * // Returns only Food transactions
 * 
 * // Filter by date range
 * filterTransactions(transactions, { 
 *   type: 'all', 
 *   category: 'all', 
 *   dateRange: { start: '2024-01-01', end: '2024-01-31' } 
 * })
 * // Returns only transactions in January 2024
 * 
 * // Combine multiple filters
 * filterTransactions(transactions, { 
 *   type: 'expense', 
 *   category: 'Food', 
 *   dateRange: { start: '2024-01-01', end: '2024-01-31' } 
 * })
 * // Returns only Food expense transactions in January 2024
 */
export function filterTransactions(
  transactions: Transaction[],
  filters: TransactionFilters
): Transaction[] {
  return transactions.filter((transaction) => {
    // Filter by type
    if (filters.type !== 'all' && transaction.type !== filters.type) {
      return false;
    }
    
    // Filter by category
    if (filters.category !== 'all' && transaction.category !== filters.category) {
      return false;
    }
    
    // Filter by date range
    if (!isInDateRange(transaction.date, filters.dateRange.start, filters.dateRange.end)) {
      return false;
    }
    
    // Transaction passes all filters
    return true;
  });
}

/**
 * Sorts transactions based on provided sort configuration
 * Supports sorting by date or amount in ascending or descending order
 * 
 * @param transactions - Array of transactions to sort
 * @param config - Sort configuration specifying field and direction
 * @returns New sorted array of transactions (does not mutate original)
 * 
 * @example
 * const transactions = [
 *   { date: '2024-01-20', amount: 1000, ... },
 *   { date: '2024-01-15', amount: 500, ... },
 *   { date: '2024-01-25', amount: 750, ... }
 * ];
 * 
 * // Sort by date ascending (oldest first)
 * sortTransactions(transactions, { field: 'date', direction: 'asc' })
 * // Returns: [Jan 15, Jan 20, Jan 25]
 * 
 * // Sort by date descending (newest first)
 * sortTransactions(transactions, { field: 'date', direction: 'desc' })
 * // Returns: [Jan 25, Jan 20, Jan 15]
 * 
 * // Sort by amount ascending (smallest first)
 * sortTransactions(transactions, { field: 'amount', direction: 'asc' })
 * // Returns: [500, 750, 1000]
 * 
 * // Sort by amount descending (largest first)
 * sortTransactions(transactions, { field: 'amount', direction: 'desc' })
 * // Returns: [1000, 750, 500]
 */
export function sortTransactions(
  transactions: Transaction[],
  config: SortConfig
): Transaction[] {
  // Create a copy to avoid mutating the original array
  const sortedTransactions = [...transactions];
  
  // Sort based on the specified field and direction
  sortedTransactions.sort((a, b) => {
    let comparison = 0;
    
    if (config.field === 'date') {
      // Compare dates as strings (ISO 8601 format allows string comparison)
      comparison = a.date.localeCompare(b.date);
    } else if (config.field === 'amount') {
      // Compare amounts numerically
      comparison = a.amount - b.amount;
    }
    
    // Reverse comparison for descending order
    return config.direction === 'desc' ? -comparison : comparison;
  });
  
  return sortedTransactions;
}

/**
 * Validates transaction data against business rules
 * Checks all required fields and enforces validation constraints
 * 
 * @param data - Partial transaction data to validate
 * @returns ValidationResult with isValid flag and error messages
 * 
 * Validation Rules:
 * - description: Required, non-empty after trimming, max 200 characters
 * - amount: Required, must be positive (> 0), max 2 decimal places
 * - type: Required, must be 'income' or 'expense'
 * - category: Required, must be valid TransactionCategory
 * - date: Required, must be valid ISO 8601 date, cannot be future date
 * 
 * @example
 * validateTransaction({ description: '', amount: 100, type: 'income', category: 'Salary', date: '2024-01-15' })
 * // { isValid: false, errors: { description: 'Description is required' } }
 * 
 * validateTransaction({ description: 'Salary', amount: -100, type: 'income', category: 'Salary', date: '2024-01-15' })
 * // { isValid: false, errors: { amount: 'Amount must be positive' } }
 * 
 * validateTransaction({ description: 'Salary', amount: 5000, type: 'income', category: 'Salary', date: '2024-01-15' })
 * // { isValid: true, errors: {} }
 */
export function validateTransaction(data: Partial<Transaction>): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  
  // Validate description
  if (!data.description || data.description.trim().length === 0) {
    errors.description = 'Description is required';
  } else if (data.description.trim().length > 200) {
    errors.description = 'Description must not exceed 200 characters';
  }
  
  // Validate amount
  if (data.amount === undefined || data.amount === null) {
    errors.amount = 'Amount is required';
  } else if (typeof data.amount !== 'number' || isNaN(data.amount)) {
    errors.amount = 'Amount must be a valid number';
  } else if (data.amount <= 0) {
    errors.amount = 'Amount must be positive';
  } else {
    // Check for max 2 decimal places
    const decimalPlaces = (data.amount.toString().split('.')[1] || '').length;
    if (decimalPlaces > 2) {
      errors.amount = 'Amount must have at most 2 decimal places';
    }
  }
  
  // Validate type
  if (!data.type) {
    errors.type = 'Transaction type is required';
  } else if (data.type !== 'income' && data.type !== 'expense') {
    errors.type = 'Transaction type must be either income or expense';
  }
  
  // Validate category
  // Note: Category validation will be done against actual category IDs
  // in the CategoryContext when creating transactions
  if (!data.category) {
    errors.category = 'Category is required';
  } else if (typeof data.category !== 'string' || data.category.trim().length === 0) {
    errors.category = 'Invalid category';
  }
  
  // Validate date
  if (!data.date) {
    errors.date = 'Date is required';
  } else {
    try {
      const transactionDate = parseISO(data.date);
      
      // Check if date is valid
      if (isNaN(transactionDate.getTime())) {
        errors.date = 'Invalid date format. Use YYYY-MM-DD';
      } else {
        // Check if date is not in the future
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset time to start of day for fair comparison
        
        if (transactionDate > today) {
          errors.date = 'Date cannot be in the future';
        }
      }
    } catch {
      errors.date = 'Invalid date format. Use YYYY-MM-DD';
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validates budget goal data against business rules
 * Checks required fields and enforces validation constraints
 * 
 * @param goal - Partial budget goal data to validate
 * @returns ValidationResult with isValid flag and error messages
 * 
 * Validation Rules:
 * - monthlyLimit: Required, must be positive (> 0)
 * - month: Required, must be valid YYYY-MM format
 * 
 * @example
 * validateBudgetGoal({ monthlyLimit: 0, month: '2024-01' })
 * // { isValid: false, errors: { monthlyLimit: 'Monthly limit must be positive' } }
 * 
 * validateBudgetGoal({ monthlyLimit: 10000, month: 'invalid' })
 * // { isValid: false, errors: { month: 'Invalid month format. Use YYYY-MM' } }
 * 
 * validateBudgetGoal({ monthlyLimit: 10000, month: '2024-01' })
 * // { isValid: true, errors: {} }
 */
export function validateBudgetGoal(goal: Partial<{ monthlyLimit: number; month: string }>): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  
  // Validate monthlyLimit
  if (goal.monthlyLimit === undefined || goal.monthlyLimit === null) {
    errors.monthlyLimit = 'Monthly limit is required';
  } else if (typeof goal.monthlyLimit !== 'number' || isNaN(goal.monthlyLimit)) {
    errors.monthlyLimit = 'Monthly limit must be a valid number';
  } else if (goal.monthlyLimit <= 0) {
    errors.monthlyLimit = 'Monthly limit must be positive';
  }
  
  // Validate month format (YYYY-MM)
  if (!goal.month) {
    errors.month = 'Month is required';
  } else {
    // Check format using regex
    const monthRegex = /^\d{4}-(0[1-9]|1[0-2])$/;
    if (!monthRegex.test(goal.month)) {
      errors.month = 'Invalid month format. Use YYYY-MM';
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
