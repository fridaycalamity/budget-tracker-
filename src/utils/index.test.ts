/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatCurrency, formatDate, getCurrentMonth, isInDateRange, calculateSummary, filterTransactions, sortTransactions, validateTransaction, validateBudgetGoal } from './index';
import type { Transaction, TransactionFilters, SortConfig } from '../types';

describe('formatCurrency', () => {
  it('should format a positive number with Philippine Peso symbol', () => {
    expect(formatCurrency(1234.5)).toBe('₱1,234.50');
  });

  it('should format large numbers with comma separators', () => {
    expect(formatCurrency(1000000)).toBe('₱1,000,000.00');
  });

  it('should format zero correctly', () => {
    expect(formatCurrency(0)).toBe('₱0.00');
  });

  it('should always show two decimal places', () => {
    expect(formatCurrency(100)).toBe('₱100.00');
    expect(formatCurrency(99.9)).toBe('₱99.90');
  });

  it('should handle decimal values correctly', () => {
    expect(formatCurrency(1234.567)).toBe('₱1,234.57'); // Rounds to 2 decimals
  });
});

describe('formatDate', () => {
  it('should format ISO date string to human-readable format', () => {
    expect(formatDate('2024-01-15')).toBe('Jan 15, 2024');
  });

  it('should handle different months correctly', () => {
    expect(formatDate('2024-12-25')).toBe('Dec 25, 2024');
    expect(formatDate('2024-06-01')).toBe('Jun 1, 2024');
  });

  it('should handle single-digit days correctly', () => {
    expect(formatDate('2024-03-05')).toBe('Mar 5, 2024');
  });

  it('should handle different years correctly', () => {
    expect(formatDate('2023-01-01')).toBe('Jan 1, 2023');
    expect(formatDate('2025-12-31')).toBe('Dec 31, 2025');
  });

  it('should return original string if date is invalid', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(formatDate('invalid-date')).toBe('invalid-date');
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('should handle edge case dates', () => {
    expect(formatDate('2024-02-29')).toBe('Feb 29, 2024'); // Leap year
  });
});

describe('getCurrentMonth', () => {
  beforeEach(() => {
    // Mock the current date
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return current month in YYYY-MM format', () => {
    vi.setSystemTime(new Date('2024-01-15'));
    expect(getCurrentMonth()).toBe('2024-01');
  });

  it('should handle different months correctly', () => {
    vi.setSystemTime(new Date('2024-12-25'));
    expect(getCurrentMonth()).toBe('2024-12');
  });

  it('should handle single-digit months with leading zero', () => {
    vi.setSystemTime(new Date('2024-03-15'));
    expect(getCurrentMonth()).toBe('2024-03');
  });

  it('should handle year transitions correctly', () => {
    vi.setSystemTime(new Date('2023-12-31'));
    expect(getCurrentMonth()).toBe('2023-12');
    
    vi.setSystemTime(new Date('2024-01-01'));
    expect(getCurrentMonth()).toBe('2024-01');
  });
});

describe('isInDateRange', () => {
  describe('with both start and end dates', () => {
    it('should return true for date within range', () => {
      expect(isInDateRange('2024-01-15', '2024-01-01', '2024-01-31')).toBe(true);
    });

    it('should return true for date equal to start date', () => {
      expect(isInDateRange('2024-01-01', '2024-01-01', '2024-01-31')).toBe(true);
    });

    it('should return true for date equal to end date', () => {
      expect(isInDateRange('2024-01-31', '2024-01-01', '2024-01-31')).toBe(true);
    });

    it('should return false for date before range', () => {
      expect(isInDateRange('2023-12-31', '2024-01-01', '2024-01-31')).toBe(false);
    });

    it('should return false for date after range', () => {
      expect(isInDateRange('2024-02-01', '2024-01-01', '2024-01-31')).toBe(false);
    });
  });

  describe('with only start date (no upper bound)', () => {
    it('should return true for date after start', () => {
      expect(isInDateRange('2024-06-15', '2024-01-01', null)).toBe(true);
    });

    it('should return true for date equal to start', () => {
      expect(isInDateRange('2024-01-01', '2024-01-01', null)).toBe(true);
    });

    it('should return false for date before start', () => {
      expect(isInDateRange('2023-12-31', '2024-01-01', null)).toBe(false);
    });
  });

  describe('with only end date (no lower bound)', () => {
    it('should return true for date before end', () => {
      expect(isInDateRange('2024-01-15', null, '2024-12-31')).toBe(true);
    });

    it('should return true for date equal to end', () => {
      expect(isInDateRange('2024-12-31', null, '2024-12-31')).toBe(true);
    });

    it('should return false for date after end', () => {
      expect(isInDateRange('2025-01-01', null, '2024-12-31')).toBe(false);
    });
  });

  describe('with no bounds (both null)', () => {
    it('should return true for any date', () => {
      expect(isInDateRange('2024-01-15', null, null)).toBe(true);
      expect(isInDateRange('2020-01-01', null, null)).toBe(true);
      expect(isInDateRange('2030-12-31', null, null)).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should return false for invalid date string', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(isInDateRange('invalid-date', '2024-01-01', '2024-01-31')).toBe(false);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should return false for invalid start date', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(isInDateRange('2024-01-15', 'invalid-start', '2024-01-31')).toBe(false);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should return false for invalid end date', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(isInDateRange('2024-01-15', '2024-01-01', 'invalid-end')).toBe(false);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('edge cases', () => {
    it('should handle leap year dates correctly', () => {
      expect(isInDateRange('2024-02-29', '2024-02-01', '2024-02-29')).toBe(true);
    });

    it('should handle year boundaries correctly', () => {
      expect(isInDateRange('2024-01-01', '2023-12-31', '2024-01-02')).toBe(true);
      expect(isInDateRange('2023-12-31', '2023-12-31', '2024-01-01')).toBe(true);
    });

    it('should handle same start and end date', () => {
      expect(isInDateRange('2024-01-15', '2024-01-15', '2024-01-15')).toBe(true);
      expect(isInDateRange('2024-01-14', '2024-01-15', '2024-01-15')).toBe(false);
      expect(isInDateRange('2024-01-16', '2024-01-15', '2024-01-15')).toBe(false);
    });
  });
});

describe('calculateSummary', () => {
  // Helper to create a transaction
  const createTransaction = (
    type: 'income' | 'expense',
    amount: number,
    category: string
  ): Transaction => ({
    id: '123',
    description: 'Test transaction',
    amount,
    type,
    category: category as any,
    date: '2024-01-15',
    createdAt: '2024-01-15T10:00:00Z',
  });

  describe('basic calculations', () => {
    it('should return zero totals for empty transaction array', () => {
      const result = calculateSummary([]);
      
      expect(result.totalIncome).toBe(0);
      expect(result.totalExpenses).toBe(0);
      expect(result.balance).toBe(0);
      expect(Object.keys(result.expensesByCategory).length).toBe(0);
    });

    it('should calculate total income correctly', () => {
      const transactions = [
        createTransaction('income', 5000, 'Salary'),
        createTransaction('income', 2000, 'Freelance'),
      ];
      
      const result = calculateSummary(transactions);
      
      expect(result.totalIncome).toBe(7000);
      expect(result.totalExpenses).toBe(0);
      expect(result.balance).toBe(7000);
    });

    it('should calculate total expenses correctly', () => {
      const transactions = [
        createTransaction('expense', 1000, 'Food'),
        createTransaction('expense', 500, 'Transport'),
      ];
      
      const result = calculateSummary(transactions);
      
      expect(result.totalIncome).toBe(0);
      expect(result.totalExpenses).toBe(1500);
      expect(result.balance).toBe(-1500);
    });

    it('should calculate balance as income minus expenses', () => {
      const transactions = [
        createTransaction('income', 5000, 'Salary'),
        createTransaction('expense', 1000, 'Food'),
        createTransaction('expense', 500, 'Transport'),
      ];
      
      const result = calculateSummary(transactions);
      
      expect(result.totalIncome).toBe(5000);
      expect(result.totalExpenses).toBe(1500);
      expect(result.balance).toBe(3500);
    });
  });

  describe('expenses by category', () => {
    it('should group expenses by category correctly', () => {
      const transactions = [
        createTransaction('expense', 1000, 'Food'),
        createTransaction('expense', 500, 'Food'),
        createTransaction('expense', 300, 'Transport'),
      ];
      
      const result = calculateSummary(transactions);
      
      expect(result.expensesByCategory['Food']).toBe(1500);
      expect(result.expensesByCategory['Transport']).toBe(300);
      expect(result.expensesByCategory['Bills']).toBeUndefined();
    });

    it('should only include categories with expenses', () => {
      const result = calculateSummary([]);
      
      expect(Object.keys(result.expensesByCategory).length).toBe(0);
    });

    it('should not include income in category totals', () => {
      const transactions = [
        createTransaction('income', 5000, 'Salary'),
        createTransaction('income', 2000, 'Freelance'),
        createTransaction('expense', 1000, 'Food'),
      ];
      
      const result = calculateSummary(transactions);
      
      // Income categories should not be in expensesByCategory
      expect(result.expensesByCategory['Salary']).toBeUndefined();
      expect(result.expensesByCategory['Freelance']).toBeUndefined();
      // Only expense categories should have values
      expect(result.expensesByCategory['Food']).toBe(1000);
    });

    it('should handle all expense categories', () => {
      const transactions = [
        createTransaction('expense', 100, 'Food'),
        createTransaction('expense', 200, 'Transport'),
        createTransaction('expense', 300, 'Bills'),
        createTransaction('expense', 400, 'Entertainment'),
        createTransaction('expense', 500, 'Shopping'),
        createTransaction('expense', 600, 'Healthcare'),
        createTransaction('expense', 700, 'Education'),
        createTransaction('expense', 800, 'Other'),
      ];
      
      const result = calculateSummary(transactions);
      
      expect(result.expensesByCategory.Food).toBe(100);
      expect(result.expensesByCategory.Transport).toBe(200);
      expect(result.expensesByCategory.Bills).toBe(300);
      expect(result.expensesByCategory.Entertainment).toBe(400);
      expect(result.expensesByCategory.Shopping).toBe(500);
      expect(result.expensesByCategory.Healthcare).toBe(600);
      expect(result.expensesByCategory.Education).toBe(700);
      expect(result.expensesByCategory.Other).toBe(800);
    });
  });

  describe('edge cases', () => {
    it('should handle decimal amounts correctly', () => {
      const transactions = [
        createTransaction('income', 1234.56, 'Salary'),
        createTransaction('expense', 123.45, 'Food'),
      ];
      
      const result = calculateSummary(transactions);
      
      expect(result.totalIncome).toBe(1234.56);
      expect(result.totalExpenses).toBe(123.45);
      expect(result.balance).toBeCloseTo(1111.11, 2);
    });

    it('should handle large numbers correctly', () => {
      const transactions = [
        createTransaction('income', 1000000, 'Salary'),
        createTransaction('expense', 500000, 'Shopping'),
      ];
      
      const result = calculateSummary(transactions);
      
      expect(result.totalIncome).toBe(1000000);
      expect(result.totalExpenses).toBe(500000);
      expect(result.balance).toBe(500000);
    });

    it('should handle negative balance correctly', () => {
      const transactions = [
        createTransaction('income', 1000, 'Salary'),
        createTransaction('expense', 2000, 'Shopping'),
      ];
      
      const result = calculateSummary(transactions);
      
      expect(result.balance).toBe(-1000);
    });

    it('should handle multiple transactions of same type and category', () => {
      const transactions = [
        createTransaction('expense', 100, 'Food'),
        createTransaction('expense', 200, 'Food'),
        createTransaction('expense', 300, 'Food'),
        createTransaction('expense', 400, 'Food'),
      ];
      
      const result = calculateSummary(transactions);
      
      expect(result.totalExpenses).toBe(1000);
      expect(result.expensesByCategory.Food).toBe(1000);
    });
  });

  describe('mixed transactions', () => {
    it('should handle complex mix of income and expenses', () => {
      const transactions = [
        createTransaction('income', 50000, 'Salary'),
        createTransaction('income', 10000, 'Freelance'),
        createTransaction('expense', 5000, 'Food'),
        createTransaction('expense', 3000, 'Transport'),
        createTransaction('expense', 10000, 'Bills'),
        createTransaction('expense', 2000, 'Entertainment'),
        createTransaction('expense', 5000, 'Shopping'),
      ];
      
      const result = calculateSummary(transactions);
      
      expect(result.totalIncome).toBe(60000);
      expect(result.totalExpenses).toBe(25000);
      expect(result.balance).toBe(35000);
      expect(result.expensesByCategory.Food).toBe(5000);
      expect(result.expensesByCategory.Transport).toBe(3000);
      expect(result.expensesByCategory.Bills).toBe(10000);
      expect(result.expensesByCategory.Entertainment).toBe(2000);
      expect(result.expensesByCategory.Shopping).toBe(5000);
    });
  });
});

describe('filterTransactions', () => {
  // Helper to create a transaction
  const createTransaction = (
    type: 'income' | 'expense',
    category: string,
    date: string
  ): Transaction => ({
    id: `${type}-${category}-${date}`,
    description: `Test ${type} - ${category}`,
    amount: 1000,
    type,
    category: category as any,
    date,
    createdAt: '2024-01-15T10:00:00Z',
  });

  // Sample transactions for testing
  const sampleTransactions: Transaction[] = [
    createTransaction('income', 'Salary', '2024-01-15'),
    createTransaction('income', 'Freelance', '2024-01-20'),
    createTransaction('expense', 'Food', '2024-01-10'),
    createTransaction('expense', 'Food', '2024-01-25'),
    createTransaction('expense', 'Transport', '2024-01-18'),
    createTransaction('expense', 'Bills', '2024-02-05'),
    createTransaction('expense', 'Entertainment', '2024-02-10'),
    createTransaction('income', 'Salary', '2024-02-15'),
  ];

  describe('filtering by type', () => {
    it('should return all transactions when type is "all"', () => {
      const filters: TransactionFilters = {
        type: 'all',
        category: 'all',
        dateRange: { start: null, end: null },
      };
      
      const result = filterTransactions(sampleTransactions, filters);
      
      expect(result).toHaveLength(8);
      expect(result).toEqual(sampleTransactions);
    });

    it('should return only income transactions when type is "income"', () => {
      const filters: TransactionFilters = {
        type: 'income',
        category: 'all',
        dateRange: { start: null, end: null },
      };
      
      const result = filterTransactions(sampleTransactions, filters);
      
      expect(result).toHaveLength(3);
      expect(result.every(t => t.type === 'income')).toBe(true);
    });

    it('should return only expense transactions when type is "expense"', () => {
      const filters: TransactionFilters = {
        type: 'expense',
        category: 'all',
        dateRange: { start: null, end: null },
      };
      
      const result = filterTransactions(sampleTransactions, filters);
      
      expect(result).toHaveLength(5);
      expect(result.every(t => t.type === 'expense')).toBe(true);
    });
  });

  describe('filtering by category', () => {
    it('should return all transactions when category is "all"', () => {
      const filters: TransactionFilters = {
        type: 'all',
        category: 'all',
        dateRange: { start: null, end: null },
      };
      
      const result = filterTransactions(sampleTransactions, filters);
      
      expect(result).toHaveLength(8);
    });

    it('should return only transactions with specified category', () => {
      const filters: TransactionFilters = {
        type: 'all',
        category: 'Food',
        dateRange: { start: null, end: null },
      };
      
      const result = filterTransactions(sampleTransactions, filters);
      
      expect(result).toHaveLength(2);
      expect(result.every(t => t.category === 'Food')).toBe(true);
    });

    it('should return only Salary transactions', () => {
      const filters: TransactionFilters = {
        type: 'all',
        category: 'Salary',
        dateRange: { start: null, end: null },
      };
      
      const result = filterTransactions(sampleTransactions, filters);
      
      expect(result).toHaveLength(2);
      expect(result.every(t => t.category === 'Salary')).toBe(true);
    });

    it('should return empty array when no transactions match category', () => {
      const filters: TransactionFilters = {
        type: 'all',
        category: 'Healthcare',
        dateRange: { start: null, end: null },
      };
      
      const result = filterTransactions(sampleTransactions, filters);
      
      expect(result).toHaveLength(0);
    });
  });

  describe('filtering by date range', () => {
    it('should return all transactions when date range is null', () => {
      const filters: TransactionFilters = {
        type: 'all',
        category: 'all',
        dateRange: { start: null, end: null },
      };
      
      const result = filterTransactions(sampleTransactions, filters);
      
      expect(result).toHaveLength(8);
    });

    it('should filter transactions by start date only', () => {
      const filters: TransactionFilters = {
        type: 'all',
        category: 'all',
        dateRange: { start: '2024-02-01', end: null },
      };
      
      const result = filterTransactions(sampleTransactions, filters);
      
      expect(result).toHaveLength(3);
      expect(result.every(t => t.date >= '2024-02-01')).toBe(true);
    });

    it('should filter transactions by end date only', () => {
      const filters: TransactionFilters = {
        type: 'all',
        category: 'all',
        dateRange: { start: null, end: '2024-01-20' },
      };
      
      const result = filterTransactions(sampleTransactions, filters);
      
      expect(result).toHaveLength(4);
      expect(result.every(t => t.date <= '2024-01-20')).toBe(true);
    });

    it('should filter transactions by both start and end dates', () => {
      const filters: TransactionFilters = {
        type: 'all',
        category: 'all',
        dateRange: { start: '2024-01-15', end: '2024-01-25' },
      };
      
      const result = filterTransactions(sampleTransactions, filters);
      
      expect(result).toHaveLength(4);
      expect(result.every(t => t.date >= '2024-01-15' && t.date <= '2024-01-25')).toBe(true);
    });

    it('should include transactions on boundary dates', () => {
      const filters: TransactionFilters = {
        type: 'all',
        category: 'all',
        dateRange: { start: '2024-01-15', end: '2024-01-15' },
      };
      
      const result = filterTransactions(sampleTransactions, filters);
      
      expect(result).toHaveLength(1);
      expect(result[0].date).toBe('2024-01-15');
    });
  });

  describe('combining multiple filters', () => {
    it('should filter by type and category', () => {
      const filters: TransactionFilters = {
        type: 'expense',
        category: 'Food',
        dateRange: { start: null, end: null },
      };
      
      const result = filterTransactions(sampleTransactions, filters);
      
      expect(result).toHaveLength(2);
      expect(result.every(t => t.type === 'expense' && t.category === 'Food')).toBe(true);
    });

    it('should filter by type and date range', () => {
      const filters: TransactionFilters = {
        type: 'income',
        category: 'all',
        dateRange: { start: '2024-01-01', end: '2024-01-31' },
      };
      
      const result = filterTransactions(sampleTransactions, filters);
      
      expect(result).toHaveLength(2);
      expect(result.every(t => t.type === 'income' && t.date >= '2024-01-01' && t.date <= '2024-01-31')).toBe(true);
    });

    it('should filter by category and date range', () => {
      const filters: TransactionFilters = {
        type: 'all',
        category: 'Food',
        dateRange: { start: '2024-01-01', end: '2024-01-20' },
      };
      
      const result = filterTransactions(sampleTransactions, filters);
      
      expect(result).toHaveLength(1);
      expect(result[0].category).toBe('Food');
      expect(result[0].date).toBe('2024-01-10');
    });

    it('should filter by all three criteria', () => {
      const filters: TransactionFilters = {
        type: 'expense',
        category: 'Food',
        dateRange: { start: '2024-01-20', end: '2024-01-31' },
      };
      
      const result = filterTransactions(sampleTransactions, filters);
      
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('expense');
      expect(result[0].category).toBe('Food');
      expect(result[0].date).toBe('2024-01-25');
    });

    it('should return empty array when no transactions match all filters', () => {
      const filters: TransactionFilters = {
        type: 'income',
        category: 'Food',
        dateRange: { start: null, end: null },
      };
      
      const result = filterTransactions(sampleTransactions, filters);
      
      expect(result).toHaveLength(0);
    });
  });

  describe('edge cases', () => {
    it('should return empty array for empty transaction list', () => {
      const filters: TransactionFilters = {
        type: 'all',
        category: 'all',
        dateRange: { start: null, end: null },
      };
      
      const result = filterTransactions([], filters);
      
      expect(result).toHaveLength(0);
    });

    it('should handle single transaction correctly', () => {
      const singleTransaction = [createTransaction('income', 'Salary', '2024-01-15')];
      
      const filters: TransactionFilters = {
        type: 'income',
        category: 'Salary',
        dateRange: { start: '2024-01-01', end: '2024-01-31' },
      };
      
      const result = filterTransactions(singleTransaction, filters);
      
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(singleTransaction[0]);
    });

    it('should not mutate original transactions array', () => {
      const originalTransactions = [...sampleTransactions];
      
      const filters: TransactionFilters = {
        type: 'expense',
        category: 'Food',
        dateRange: { start: null, end: null },
      };
      
      filterTransactions(sampleTransactions, filters);
      
      expect(sampleTransactions).toEqual(originalTransactions);
    });

    it('should handle invalid dates gracefully', () => {
      const transactionsWithInvalidDate = [
        createTransaction('income', 'Salary', 'invalid-date'),
        createTransaction('expense', 'Food', '2024-01-15'),
      ];
      
      const filters: TransactionFilters = {
        type: 'all',
        category: 'all',
        dateRange: { start: '2024-01-01', end: '2024-01-31' },
      };
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const result = filterTransactions(transactionsWithInvalidDate, filters);
      
      // Invalid date transaction should be filtered out
      expect(result).toHaveLength(1);
      expect(result[0].date).toBe('2024-01-15');
      
      consoleSpy.mockRestore();
    });
  });

  describe('requirements validation', () => {
    it('should support filtering by type (Requirement 5.1)', () => {
      const incomeFilters: TransactionFilters = {
        type: 'income',
        category: 'all',
        dateRange: { start: null, end: null },
      };
      
      const expenseFilters: TransactionFilters = {
        type: 'expense',
        category: 'all',
        dateRange: { start: null, end: null },
      };
      
      const allFilters: TransactionFilters = {
        type: 'all',
        category: 'all',
        dateRange: { start: null, end: null },
      };
      
      const incomeResult = filterTransactions(sampleTransactions, incomeFilters);
      const expenseResult = filterTransactions(sampleTransactions, expenseFilters);
      const allResult = filterTransactions(sampleTransactions, allFilters);
      
      expect(incomeResult.every(t => t.type === 'income')).toBe(true);
      expect(expenseResult.every(t => t.type === 'expense')).toBe(true);
      expect(allResult).toHaveLength(8);
    });

    it('should support filtering by category (Requirement 5.2)', () => {
      const filters: TransactionFilters = {
        type: 'all',
        category: 'Transport',
        dateRange: { start: null, end: null },
      };
      
      const result = filterTransactions(sampleTransactions, filters);
      
      expect(result.every(t => t.category === 'Transport')).toBe(true);
    });

    it('should support filtering by date range (Requirement 5.3)', () => {
      const filters: TransactionFilters = {
        type: 'all',
        category: 'all',
        dateRange: { start: '2024-01-01', end: '2024-01-31' },
      };
      
      const result = filterTransactions(sampleTransactions, filters);
      
      expect(result.every(t => t.date >= '2024-01-01' && t.date <= '2024-01-31')).toBe(true);
    });

    it('should display only matching transactions when filters are applied (Requirement 5.6)', () => {
      const filters: TransactionFilters = {
        type: 'expense',
        category: 'Food',
        dateRange: { start: '2024-01-01', end: '2024-01-31' },
      };
      
      const result = filterTransactions(sampleTransactions, filters);
      
      // All returned transactions must match ALL active filters
      expect(result.every(t => 
        t.type === 'expense' && 
        t.category === 'Food' && 
        t.date >= '2024-01-01' && 
        t.date <= '2024-01-31'
      )).toBe(true);
    });
  });
});

describe('sortTransactions', () => {
  // Helper to create a transaction
  const createTransaction = (
    date: string,
    amount: number,
    id: string = `tx-${date}-${amount}`
  ): Transaction => ({
    id,
    description: `Transaction ${id}`,
    amount,
    type: 'expense',
    category: 'Food',
    date,
    createdAt: '2024-01-15T10:00:00Z',
  });

  // Sample transactions for testing
  const sampleTransactions: Transaction[] = [
    createTransaction('2024-01-20', 1000, 'tx1'),
    createTransaction('2024-01-15', 500, 'tx2'),
    createTransaction('2024-01-25', 750, 'tx3'),
    createTransaction('2024-01-10', 2000, 'tx4'),
    createTransaction('2024-01-18', 300, 'tx5'),
  ];

  describe('sorting by date', () => {
    it('should sort transactions by date in ascending order (oldest first)', () => {
      const config: SortConfig = { field: 'date', direction: 'asc' };
      
      const result = sortTransactions(sampleTransactions, config);
      
      expect(result).toHaveLength(5);
      expect(result[0].date).toBe('2024-01-10');
      expect(result[1].date).toBe('2024-01-15');
      expect(result[2].date).toBe('2024-01-18');
      expect(result[3].date).toBe('2024-01-20');
      expect(result[4].date).toBe('2024-01-25');
    });

    it('should sort transactions by date in descending order (newest first)', () => {
      const config: SortConfig = { field: 'date', direction: 'desc' };
      
      const result = sortTransactions(sampleTransactions, config);
      
      expect(result).toHaveLength(5);
      expect(result[0].date).toBe('2024-01-25');
      expect(result[1].date).toBe('2024-01-20');
      expect(result[2].date).toBe('2024-01-18');
      expect(result[3].date).toBe('2024-01-15');
      expect(result[4].date).toBe('2024-01-10');
    });

    it('should handle transactions with same date', () => {
      const transactionsWithSameDate = [
        createTransaction('2024-01-15', 1000, 'tx1'),
        createTransaction('2024-01-15', 500, 'tx2'),
        createTransaction('2024-01-15', 750, 'tx3'),
      ];
      
      const config: SortConfig = { field: 'date', direction: 'asc' };
      
      const result = sortTransactions(transactionsWithSameDate, config);
      
      expect(result).toHaveLength(3);
      // All dates should be the same
      expect(result.every(t => t.date === '2024-01-15')).toBe(true);
    });

    it('should handle dates across different months', () => {
      const transactionsAcrossMonths = [
        createTransaction('2024-03-15', 1000, 'tx1'),
        createTransaction('2024-01-20', 500, 'tx2'),
        createTransaction('2024-02-10', 750, 'tx3'),
      ];
      
      const config: SortConfig = { field: 'date', direction: 'asc' };
      
      const result = sortTransactions(transactionsAcrossMonths, config);
      
      expect(result[0].date).toBe('2024-01-20');
      expect(result[1].date).toBe('2024-02-10');
      expect(result[2].date).toBe('2024-03-15');
    });

    it('should handle dates across different years', () => {
      const transactionsAcrossYears = [
        createTransaction('2025-01-15', 1000, 'tx1'),
        createTransaction('2023-12-20', 500, 'tx2'),
        createTransaction('2024-06-10', 750, 'tx3'),
      ];
      
      const config: SortConfig = { field: 'date', direction: 'asc' };
      
      const result = sortTransactions(transactionsAcrossYears, config);
      
      expect(result[0].date).toBe('2023-12-20');
      expect(result[1].date).toBe('2024-06-10');
      expect(result[2].date).toBe('2025-01-15');
    });
  });

  describe('sorting by amount', () => {
    it('should sort transactions by amount in ascending order (smallest first)', () => {
      const config: SortConfig = { field: 'amount', direction: 'asc' };
      
      const result = sortTransactions(sampleTransactions, config);
      
      expect(result).toHaveLength(5);
      expect(result[0].amount).toBe(300);
      expect(result[1].amount).toBe(500);
      expect(result[2].amount).toBe(750);
      expect(result[3].amount).toBe(1000);
      expect(result[4].amount).toBe(2000);
    });

    it('should sort transactions by amount in descending order (largest first)', () => {
      const config: SortConfig = { field: 'amount', direction: 'desc' };
      
      const result = sortTransactions(sampleTransactions, config);
      
      expect(result).toHaveLength(5);
      expect(result[0].amount).toBe(2000);
      expect(result[1].amount).toBe(1000);
      expect(result[2].amount).toBe(750);
      expect(result[3].amount).toBe(500);
      expect(result[4].amount).toBe(300);
    });

    it('should handle transactions with same amount', () => {
      const transactionsWithSameAmount = [
        createTransaction('2024-01-15', 1000, 'tx1'),
        createTransaction('2024-01-20', 1000, 'tx2'),
        createTransaction('2024-01-25', 1000, 'tx3'),
      ];
      
      const config: SortConfig = { field: 'amount', direction: 'asc' };
      
      const result = sortTransactions(transactionsWithSameAmount, config);
      
      expect(result).toHaveLength(3);
      // All amounts should be the same
      expect(result.every(t => t.amount === 1000)).toBe(true);
    });

    it('should handle decimal amounts correctly', () => {
      const transactionsWithDecimals = [
        createTransaction('2024-01-15', 1234.56, 'tx1'),
        createTransaction('2024-01-20', 123.45, 'tx2'),
        createTransaction('2024-01-25', 999.99, 'tx3'),
      ];
      
      const config: SortConfig = { field: 'amount', direction: 'asc' };
      
      const result = sortTransactions(transactionsWithDecimals, config);
      
      expect(result[0].amount).toBe(123.45);
      expect(result[1].amount).toBe(999.99);
      expect(result[2].amount).toBe(1234.56);
    });

    it('should handle large amounts correctly', () => {
      const transactionsWithLargeAmounts = [
        createTransaction('2024-01-15', 1000000, 'tx1'),
        createTransaction('2024-01-20', 50000, 'tx2'),
        createTransaction('2024-01-25', 500000, 'tx3'),
      ];
      
      const config: SortConfig = { field: 'amount', direction: 'desc' };
      
      const result = sortTransactions(transactionsWithLargeAmounts, config);
      
      expect(result[0].amount).toBe(1000000);
      expect(result[1].amount).toBe(500000);
      expect(result[2].amount).toBe(50000);
    });

    it('should handle very small amounts correctly', () => {
      const transactionsWithSmallAmounts = [
        createTransaction('2024-01-15', 10.50, 'tx1'),
        createTransaction('2024-01-20', 0.99, 'tx2'),
        createTransaction('2024-01-25', 5.25, 'tx3'),
      ];
      
      const config: SortConfig = { field: 'amount', direction: 'asc' };
      
      const result = sortTransactions(transactionsWithSmallAmounts, config);
      
      expect(result[0].amount).toBe(0.99);
      expect(result[1].amount).toBe(5.25);
      expect(result[2].amount).toBe(10.50);
    });
  });

  describe('edge cases', () => {
    it('should return empty array for empty transaction list', () => {
      const config: SortConfig = { field: 'date', direction: 'asc' };
      
      const result = sortTransactions([], config);
      
      expect(result).toHaveLength(0);
      expect(result).toEqual([]);
    });

    it('should handle single transaction correctly', () => {
      const singleTransaction = [createTransaction('2024-01-15', 1000, 'tx1')];
      
      const config: SortConfig = { field: 'date', direction: 'asc' };
      
      const result = sortTransactions(singleTransaction, config);
      
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(singleTransaction[0]);
    });

    it('should not mutate original transactions array', () => {
      const originalTransactions = [...sampleTransactions];
      const originalOrder = sampleTransactions.map(t => t.id);
      
      const config: SortConfig = { field: 'date', direction: 'asc' };
      
      sortTransactions(sampleTransactions, config);
      
      // Original array should remain unchanged
      expect(sampleTransactions.map(t => t.id)).toEqual(originalOrder);
      expect(sampleTransactions).toEqual(originalTransactions);
    });

    it('should handle already sorted array (ascending)', () => {
      const alreadySorted = [
        createTransaction('2024-01-10', 100, 'tx1'),
        createTransaction('2024-01-15', 200, 'tx2'),
        createTransaction('2024-01-20', 300, 'tx3'),
      ];
      
      const config: SortConfig = { field: 'date', direction: 'asc' };
      
      const result = sortTransactions(alreadySorted, config);
      
      expect(result[0].date).toBe('2024-01-10');
      expect(result[1].date).toBe('2024-01-15');
      expect(result[2].date).toBe('2024-01-20');
    });

    it('should handle already sorted array (descending)', () => {
      const alreadySorted = [
        createTransaction('2024-01-20', 300, 'tx1'),
        createTransaction('2024-01-15', 200, 'tx2'),
        createTransaction('2024-01-10', 100, 'tx3'),
      ];
      
      const config: SortConfig = { field: 'date', direction: 'desc' };
      
      const result = sortTransactions(alreadySorted, config);
      
      expect(result[0].date).toBe('2024-01-20');
      expect(result[1].date).toBe('2024-01-15');
      expect(result[2].date).toBe('2024-01-10');
    });

    it('should handle reverse sorted array', () => {
      const reverseSorted = [
        createTransaction('2024-01-25', 1000, 'tx1'),
        createTransaction('2024-01-20', 500, 'tx2'),
        createTransaction('2024-01-15', 750, 'tx3'),
        createTransaction('2024-01-10', 2000, 'tx4'),
      ];
      
      const config: SortConfig = { field: 'date', direction: 'asc' };
      
      const result = sortTransactions(reverseSorted, config);
      
      expect(result[0].date).toBe('2024-01-10');
      expect(result[1].date).toBe('2024-01-15');
      expect(result[2].date).toBe('2024-01-20');
      expect(result[3].date).toBe('2024-01-25');
    });
  });

  describe('mixed transaction types', () => {
    it('should sort income and expense transactions together by date', () => {
      const mixedTransactions = [
        { ...createTransaction('2024-01-20', 1000, 'tx1'), type: 'expense' as const },
        { ...createTransaction('2024-01-15', 5000, 'tx2'), type: 'income' as const, category: 'Salary' as const },
        { ...createTransaction('2024-01-25', 500, 'tx3'), type: 'expense' as const },
        { ...createTransaction('2024-01-10', 2000, 'tx4'), type: 'income' as const, category: 'Freelance' as const },
      ];
      
      const config: SortConfig = { field: 'date', direction: 'asc' };
      
      const result = sortTransactions(mixedTransactions, config);
      
      expect(result[0].date).toBe('2024-01-10');
      expect(result[0].type).toBe('income');
      expect(result[1].date).toBe('2024-01-15');
      expect(result[1].type).toBe('income');
      expect(result[2].date).toBe('2024-01-20');
      expect(result[2].type).toBe('expense');
      expect(result[3].date).toBe('2024-01-25');
      expect(result[3].type).toBe('expense');
    });

    it('should sort income and expense transactions together by amount', () => {
      const mixedTransactions = [
        { ...createTransaction('2024-01-20', 1000, 'tx1'), type: 'expense' as const },
        { ...createTransaction('2024-01-15', 5000, 'tx2'), type: 'income' as const, category: 'Salary' as const },
        { ...createTransaction('2024-01-25', 500, 'tx3'), type: 'expense' as const },
        { ...createTransaction('2024-01-10', 2000, 'tx4'), type: 'income' as const, category: 'Freelance' as const },
      ];
      
      const config: SortConfig = { field: 'amount', direction: 'desc' };
      
      const result = sortTransactions(mixedTransactions, config);
      
      expect(result[0].amount).toBe(5000);
      expect(result[0].type).toBe('income');
      expect(result[1].amount).toBe(2000);
      expect(result[1].type).toBe('income');
      expect(result[2].amount).toBe(1000);
      expect(result[2].type).toBe('expense');
      expect(result[3].amount).toBe(500);
      expect(result[3].type).toBe('expense');
    });
  });

  describe('requirements validation', () => {
    it('should support sorting by date (Requirement 5.4)', () => {
      const config: SortConfig = { field: 'date', direction: 'asc' };
      
      const result = sortTransactions(sampleTransactions, config);
      
      // Verify transactions are sorted by date
      for (let i = 0; i < result.length - 1; i++) {
        expect(result[i].date <= result[i + 1].date).toBe(true);
      }
    });

    it('should support sorting by amount (Requirement 5.5)', () => {
      const config: SortConfig = { field: 'amount', direction: 'asc' };
      
      const result = sortTransactions(sampleTransactions, config);
      
      // Verify transactions are sorted by amount
      for (let i = 0; i < result.length - 1; i++) {
        expect(result[i].amount <= result[i + 1].amount).toBe(true);
      }
    });

    it('should reorder transactions according to sort criteria (Requirement 5.7)', () => {
      const config: SortConfig = { field: 'date', direction: 'desc' };
      
      const result = sortTransactions(sampleTransactions, config);
      
      // Verify the order has changed from the original
      expect(result[0].id).not.toBe(sampleTransactions[0].id);
      
      // Verify transactions are properly reordered
      for (let i = 0; i < result.length - 1; i++) {
        expect(result[i].date >= result[i + 1].date).toBe(true);
      }
    });

    it('should support both ascending and descending directions', () => {
      const ascConfig: SortConfig = { field: 'amount', direction: 'asc' };
      const descConfig: SortConfig = { field: 'amount', direction: 'desc' };
      
      const ascResult = sortTransactions(sampleTransactions, ascConfig);
      const descResult = sortTransactions(sampleTransactions, descConfig);
      
      // Ascending should go from smallest to largest
      expect(ascResult[0].amount).toBe(300);
      expect(ascResult[ascResult.length - 1].amount).toBe(2000);
      
      // Descending should go from largest to smallest
      expect(descResult[0].amount).toBe(2000);
      expect(descResult[descResult.length - 1].amount).toBe(300);
      
      // Results should be reverse of each other
      expect(ascResult[0].id).toBe(descResult[descResult.length - 1].id);
      expect(ascResult[ascResult.length - 1].id).toBe(descResult[0].id);
    });
  });

  describe('integration with filtering', () => {
    it('should work correctly when applied after filtering', () => {
      // This simulates a common use case: filter then sort
      const allTransactions = [
        { ...createTransaction('2024-01-20', 1000, 'tx1'), type: 'expense' as const },
        { ...createTransaction('2024-01-15', 5000, 'tx2'), type: 'income' as const, category: 'Salary' as const },
        { ...createTransaction('2024-01-25', 500, 'tx3'), type: 'expense' as const },
        { ...createTransaction('2024-01-10', 2000, 'tx4'), type: 'income' as const, category: 'Freelance' as const },
      ];
      
      // Filter to only expenses
      const filtered = allTransactions.filter(t => t.type === 'expense');
      
      // Then sort by amount descending
      const config: SortConfig = { field: 'amount', direction: 'desc' };
      const result = sortTransactions(filtered, config);
      
      expect(result).toHaveLength(2);
      expect(result[0].amount).toBe(1000);
      expect(result[1].amount).toBe(500);
      expect(result.every(t => t.type === 'expense')).toBe(true);
    });
  });
});

describe('validateTransaction', () => {
  describe('description validation', () => {
    it('should return error when description is missing', () => {
      const data = {
        amount: 1000,
        type: 'income' as const,
        category: 'Salary' as const,
        date: '2024-01-15',
      };
      
      const result = validateTransaction(data);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.description).toBe('Description is required');
    });

    it('should return error when description is empty string', () => {
      const data = {
        description: '',
        amount: 1000,
        type: 'income' as const,
        category: 'Salary' as const,
        date: '2024-01-15',
      };
      
      const result = validateTransaction(data);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.description).toBe('Description is required');
    });

    it('should return error when description is only whitespace', () => {
      const data = {
        description: '   ',
        amount: 1000,
        type: 'income' as const,
        category: 'Salary' as const,
        date: '2024-01-15',
      };
      
      const result = validateTransaction(data);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.description).toBe('Description is required');
    });

    it('should return error when description exceeds 200 characters', () => {
      const data = {
        description: 'a'.repeat(201),
        amount: 1000,
        type: 'income' as const,
        category: 'Salary' as const,
        date: '2024-01-15',
      };
      
      const result = validateTransaction(data);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.description).toBe('Description must not exceed 200 characters');
    });

    it('should accept valid description', () => {
      const data = {
        description: 'Monthly salary payment',
        amount: 1000,
        type: 'income' as const,
        category: 'Salary' as const,
        date: '2024-01-15',
      };
      
      const result = validateTransaction(data);
      
      expect(result.errors.description).toBeUndefined();
    });

    it('should accept description with exactly 200 characters', () => {
      const data = {
        description: 'a'.repeat(200),
        amount: 1000,
        type: 'income' as const,
        category: 'Salary' as const,
        date: '2024-01-15',
      };
      
      const result = validateTransaction(data);
      
      expect(result.errors.description).toBeUndefined();
    });
  });

  describe('amount validation', () => {
    it('should return error when amount is missing', () => {
      const data = {
        description: 'Test transaction',
        type: 'income' as const,
        category: 'Salary' as const,
        date: '2024-01-15',
      };
      
      const result = validateTransaction(data);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.amount).toBe('Amount is required');
    });

    it('should return error when amount is null', () => {
      const data = {
        description: 'Test transaction',
        amount: null as any,
        type: 'income' as const,
        category: 'Salary' as const,
        date: '2024-01-15',
      };
      
      const result = validateTransaction(data);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.amount).toBe('Amount is required');
    });

    it('should return error when amount is not a number', () => {
      const data = {
        description: 'Test transaction',
        amount: 'not a number' as any,
        type: 'income' as const,
        category: 'Salary' as const,
        date: '2024-01-15',
      };
      
      const result = validateTransaction(data);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.amount).toBe('Amount must be a valid number');
    });

    it('should return error when amount is NaN', () => {
      const data = {
        description: 'Test transaction',
        amount: NaN,
        type: 'income' as const,
        category: 'Salary' as const,
        date: '2024-01-15',
      };
      
      const result = validateTransaction(data);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.amount).toBe('Amount must be a valid number');
    });

    it('should return error when amount is zero', () => {
      const data = {
        description: 'Test transaction',
        amount: 0,
        type: 'income' as const,
        category: 'Salary' as const,
        date: '2024-01-15',
      };
      
      const result = validateTransaction(data);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.amount).toBe('Amount must be positive');
    });

    it('should return error when amount is negative', () => {
      const data = {
        description: 'Test transaction',
        amount: -100,
        type: 'income' as const,
        category: 'Salary' as const,
        date: '2024-01-15',
      };
      
      const result = validateTransaction(data);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.amount).toBe('Amount must be positive');
    });

    it('should return error when amount has more than 2 decimal places', () => {
      const data = {
        description: 'Test transaction',
        amount: 100.123,
        type: 'income' as const,
        category: 'Salary' as const,
        date: '2024-01-15',
      };
      
      const result = validateTransaction(data);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.amount).toBe('Amount must have at most 2 decimal places');
    });

    it('should accept valid amount with 2 decimal places', () => {
      const data = {
        description: 'Test transaction',
        amount: 1234.56,
        type: 'income' as const,
        category: 'Salary' as const,
        date: '2024-01-15',
      };
      
      const result = validateTransaction(data);
      
      expect(result.errors.amount).toBeUndefined();
    });

    it('should accept valid amount with 1 decimal place', () => {
      const data = {
        description: 'Test transaction',
        amount: 1234.5,
        type: 'income' as const,
        category: 'Salary' as const,
        date: '2024-01-15',
      };
      
      const result = validateTransaction(data);
      
      expect(result.errors.amount).toBeUndefined();
    });

    it('should accept valid amount with no decimal places', () => {
      const data = {
        description: 'Test transaction',
        amount: 1234,
        type: 'income' as const,
        category: 'Salary' as const,
        date: '2024-01-15',
      };
      
      const result = validateTransaction(data);
      
      expect(result.errors.amount).toBeUndefined();
    });
  });

  describe('type validation', () => {
    it('should return error when type is missing', () => {
      const data = {
        description: 'Test transaction',
        amount: 1000,
        category: 'Salary' as const,
        date: '2024-01-15',
      };
      
      const result = validateTransaction(data);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.type).toBe('Transaction type is required');
    });

    it('should return error when type is invalid', () => {
      const data = {
        description: 'Test transaction',
        amount: 1000,
        type: 'invalid' as any,
        category: 'Salary' as const,
        date: '2024-01-15',
      };
      
      const result = validateTransaction(data);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.type).toBe('Transaction type must be either income or expense');
    });

    it('should accept income type', () => {
      const data = {
        description: 'Test transaction',
        amount: 1000,
        type: 'income' as const,
        category: 'Salary' as const,
        date: '2024-01-15',
      };
      
      const result = validateTransaction(data);
      
      expect(result.errors.type).toBeUndefined();
    });

    it('should accept expense type', () => {
      const data = {
        description: 'Test transaction',
        amount: 1000,
        type: 'expense' as const,
        category: 'Food' as const,
        date: '2024-01-15',
      };
      
      const result = validateTransaction(data);
      
      expect(result.errors.type).toBeUndefined();
    });
  });

  describe('category validation', () => {
    it('should return error when category is missing', () => {
      const data = {
        description: 'Test transaction',
        amount: 1000,
        type: 'income' as const,
        date: '2024-01-15',
      };
      
      const result = validateTransaction(data);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.category).toBe('Category is required');
    });

    it('should return error when category is invalid', () => {
      const data = {
        description: 'Test transaction',
        amount: 1000,
        type: 'income' as const,
        category: '   ', // Whitespace only
        date: '2024-01-15',
      };
      
      const result = validateTransaction(data);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.category).toBe('Invalid category');
    });

    it('should accept all valid category IDs', () => {
      const validCategoryIds = [
        '550e8400-e29b-41d4-a716-446655440001', // UUID format
        'custom-category-id',
        'any-string-id',
      ];
      
      validCategoryIds.forEach(category => {
        const data = {
          description: 'Test transaction',
          amount: 1000,
          type: 'expense' as const,
          category: category as any,
          date: '2024-01-15',
        };
        
        const result = validateTransaction(data);
        
        expect(result.errors.category).toBeUndefined();
      });
    });
  });

  describe('date validation', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-20T12:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return error when date is missing', () => {
      const data = {
        description: 'Test transaction',
        amount: 1000,
        type: 'income' as const,
        category: 'Salary' as const,
      };
      
      const result = validateTransaction(data);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.date).toBe('Date is required');
    });

    it('should return error when date format is invalid', () => {
      const data = {
        description: 'Test transaction',
        amount: 1000,
        type: 'income' as const,
        category: 'Salary' as const,
        date: 'invalid-date',
      };
      
      const result = validateTransaction(data);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.date).toBe('Invalid date format. Use YYYY-MM-DD');
    });

    it('should return error when date is in the future', () => {
      const data = {
        description: 'Test transaction',
        amount: 1000,
        type: 'income' as const,
        category: 'Salary' as const,
        date: '2024-01-21', // Tomorrow
      };
      
      const result = validateTransaction(data);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.date).toBe('Date cannot be in the future');
    });

    it('should accept today\'s date', () => {
      const data = {
        description: 'Test transaction',
        amount: 1000,
        type: 'income' as const,
        category: 'Salary' as const,
        date: '2024-01-20', // Today
      };
      
      const result = validateTransaction(data);
      
      expect(result.errors.date).toBeUndefined();
    });

    it('should accept past dates', () => {
      const data = {
        description: 'Test transaction',
        amount: 1000,
        type: 'income' as const,
        category: 'Salary' as const,
        date: '2024-01-15', // Past date
      };
      
      const result = validateTransaction(data);
      
      expect(result.errors.date).toBeUndefined();
    });

    it('should handle leap year dates correctly', () => {
      const data = {
        description: 'Test transaction',
        amount: 1000,
        type: 'income' as const,
        category: 'Salary' as const,
        date: '2024-02-29', // Valid leap year date (but in future for our test)
      };
      
      const result = validateTransaction(data);
      
      // Should fail because it's in the future, not because it's invalid
      expect(result.errors.date).toBe('Date cannot be in the future');
    });
  });

  describe('complete validation', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-20T12:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return isValid true for completely valid transaction', () => {
      const data = {
        description: 'Monthly salary payment',
        amount: 50000,
        type: 'income' as const,
        category: 'Salary' as const,
        date: '2024-01-15',
      };
      
      const result = validateTransaction(data);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('should return multiple errors for invalid transaction', () => {
      const data = {
        description: '',
        amount: -100,
        type: 'invalid' as any,
        category: '', // Empty category
        date: 'invalid-date',
      };
      
      const result = validateTransaction(data);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.description).toBeDefined();
      expect(result.errors.amount).toBeDefined();
      expect(result.errors.type).toBeDefined();
      expect(result.errors.category).toBeDefined();
      expect(result.errors.date).toBeDefined();
    });

    it('should validate expense transaction correctly', () => {
      const data = {
        description: 'Grocery shopping',
        amount: 1500.50,
        type: 'expense' as const,
        category: 'Food' as const,
        date: '2024-01-18',
      };
      
      const result = validateTransaction(data);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });
  });

  describe('requirements validation', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-20T12:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should require description field (Requirement 2.2)', () => {
      const data = {
        amount: 1000,
        type: 'income' as const,
        category: 'Salary' as const,
        date: '2024-01-15',
      };
      
      const result = validateTransaction(data);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.description).toBeDefined();
    });

    it('should require positive amount value (Requirement 2.3)', () => {
      const data = {
        description: 'Test',
        amount: -100,
        type: 'income' as const,
        category: 'Salary' as const,
        date: '2024-01-15',
      };
      
      const result = validateTransaction(data);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.amount).toBe('Amount must be positive');
    });

    it('should require transaction type (Requirement 2.4)', () => {
      const data = {
        description: 'Test',
        amount: 1000,
        category: 'Salary' as const,
        date: '2024-01-15',
      };
      
      const result = validateTransaction(data);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.type).toBeDefined();
    });

    it('should require category selection (Requirement 2.5)', () => {
      const data = {
        description: 'Test',
        amount: 1000,
        type: 'income' as const,
        date: '2024-01-15',
      };
      
      const result = validateTransaction(data);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.category).toBeDefined();
    });

    it('should require date field (Requirement 2.6)', () => {
      const data = {
        description: 'Test',
        amount: 1000,
        type: 'income' as const,
        category: 'Salary' as const,
      };
      
      const result = validateTransaction(data);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.date).toBeDefined();
    });

    it('should prevent transaction creation with invalid data (Requirement 2.7)', () => {
      const invalidData = {
        description: '',
        amount: 0,
        type: 'invalid' as any,
        category: 'InvalidCategory' as any,
        date: 'invalid',
      };
      
      const result = validateTransaction(invalidData);
      
      expect(result.isValid).toBe(false);
      expect(Object.keys(result.errors).length).toBeGreaterThan(0);
    });
  });
});

describe('validateBudgetGoal', () => {
  describe('monthlyLimit validation', () => {
    it('should return error when monthlyLimit is missing', () => {
      const goal = {
        month: '2024-01',
      };
      
      const result = validateBudgetGoal(goal);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.monthlyLimit).toBe('Monthly limit is required');
    });

    it('should return error when monthlyLimit is null', () => {
      const goal = {
        monthlyLimit: null as any,
        month: '2024-01',
      };
      
      const result = validateBudgetGoal(goal);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.monthlyLimit).toBe('Monthly limit is required');
    });

    it('should return error when monthlyLimit is not a number', () => {
      const goal = {
        monthlyLimit: 'not a number' as any,
        month: '2024-01',
      };
      
      const result = validateBudgetGoal(goal);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.monthlyLimit).toBe('Monthly limit must be a valid number');
    });

    it('should return error when monthlyLimit is NaN', () => {
      const goal = {
        monthlyLimit: NaN,
        month: '2024-01',
      };
      
      const result = validateBudgetGoal(goal);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.monthlyLimit).toBe('Monthly limit must be a valid number');
    });

    it('should return error when monthlyLimit is zero', () => {
      const goal = {
        monthlyLimit: 0,
        month: '2024-01',
      };
      
      const result = validateBudgetGoal(goal);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.monthlyLimit).toBe('Monthly limit must be positive');
    });

    it('should return error when monthlyLimit is negative', () => {
      const goal = {
        monthlyLimit: -1000,
        month: '2024-01',
      };
      
      const result = validateBudgetGoal(goal);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.monthlyLimit).toBe('Monthly limit must be positive');
    });

    it('should accept valid positive monthlyLimit', () => {
      const goal = {
        monthlyLimit: 10000,
        month: '2024-01',
      };
      
      const result = validateBudgetGoal(goal);
      
      expect(result.errors.monthlyLimit).toBeUndefined();
    });

    it('should accept decimal monthlyLimit', () => {
      const goal = {
        monthlyLimit: 10000.50,
        month: '2024-01',
      };
      
      const result = validateBudgetGoal(goal);
      
      expect(result.errors.monthlyLimit).toBeUndefined();
    });
  });

  describe('month validation', () => {
    it('should return error when month is missing', () => {
      const goal = {
        monthlyLimit: 10000,
      };
      
      const result = validateBudgetGoal(goal);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.month).toBe('Month is required');
    });

    it('should return error when month format is invalid', () => {
      const invalidFormats = [
        '2024-1',      // Missing leading zero
        '2024-13',     // Invalid month
        '2024-00',     // Invalid month
        '24-01',       // Two-digit year
        '2024/01',     // Wrong separator
        '2024-Jan',    // Month name
        'invalid',     // Completely invalid
        '2024-01-15',  // Too specific (includes day)
      ];
      
      invalidFormats.forEach(format => {
        const goal = {
          monthlyLimit: 10000,
          month: format,
        };
        
        const result = validateBudgetGoal(goal);
        
        expect(result.isValid).toBe(false);
        expect(result.errors.month).toBe('Invalid month format. Use YYYY-MM');
      });
    });

    it('should accept valid month formats', () => {
      const validFormats = [
        '2024-01',
        '2024-02',
        '2024-03',
        '2024-04',
        '2024-05',
        '2024-06',
        '2024-07',
        '2024-08',
        '2024-09',
        '2024-10',
        '2024-11',
        '2024-12',
        '2023-01',
        '2025-12',
      ];
      
      validFormats.forEach(format => {
        const goal = {
          monthlyLimit: 10000,
          month: format,
        };
        
        const result = validateBudgetGoal(goal);
        
        expect(result.errors.month).toBeUndefined();
      });
    });
  });

  describe('complete validation', () => {
    it('should return isValid true for completely valid budget goal', () => {
      const goal = {
        monthlyLimit: 15000,
        month: '2024-01',
      };
      
      const result = validateBudgetGoal(goal);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('should return multiple errors for invalid budget goal', () => {
      const goal = {
        monthlyLimit: -1000,
        month: 'invalid',
      };
      
      const result = validateBudgetGoal(goal);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.monthlyLimit).toBeDefined();
      expect(result.errors.month).toBeDefined();
    });

    it('should validate large budget limits', () => {
      const goal = {
        monthlyLimit: 1000000,
        month: '2024-01',
      };
      
      const result = validateBudgetGoal(goal);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('should validate small budget limits', () => {
      const goal = {
        monthlyLimit: 0.01,
        month: '2024-01',
      };
      
      const result = validateBudgetGoal(goal);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });
  });

  describe('requirements validation', () => {
    it('should require positive monthly limit (Requirement 6.1)', () => {
      const goal = {
        monthlyLimit: -5000,
        month: '2024-01',
      };
      
      const result = validateBudgetGoal(goal);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.monthlyLimit).toBe('Monthly limit must be positive');
    });

    it('should require valid YYYY-MM format (Requirement 6.1)', () => {
      const goal = {
        monthlyLimit: 10000,
        month: 'invalid-format',
      };
      
      const result = validateBudgetGoal(goal);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.month).toBe('Invalid month format. Use YYYY-MM');
    });

    it('should accept valid budget goal data', () => {
      const goal = {
        monthlyLimit: 20000,
        month: '2024-02',
      };
      
      const result = validateBudgetGoal(goal);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });
  });
});
