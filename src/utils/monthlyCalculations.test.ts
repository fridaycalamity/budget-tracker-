import { describe, it, expect } from 'vitest';
import {
  getMonthlyTotals,
  getBestMonth,
  getAverageSpending,
  getSpendingTrend,
  hasSufficientMonthlyData,
} from './monthlyCalculations';
import type { Transaction } from '../types';

describe('monthlyCalculations', () => {
  describe('getMonthlyTotals', () => {
    it('should return 6 months of data with zero values when no transactions', () => {
      const result = getMonthlyTotals([], 6);
      
      expect(result).toHaveLength(6);
      result.forEach((month) => {
        expect(month.income).toBe(0);
        expect(month.expenses).toBe(0);
        expect(month.net).toBe(0);
        expect(month.month).toMatch(/^\d{4}-\d{2}$/);
        expect(month.monthLabel).toMatch(/^[A-Z][a-z]{2}$/);
      });
    });

    it('should aggregate transactions by month correctly', () => {
      const now = new Date();
      const currentMonth = now.toISOString().slice(0, 7); // YYYY-MM
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 15).toISOString().slice(0, 10);
      const currentMonthDate = new Date(now.getFullYear(), now.getMonth(), 15).toISOString().slice(0, 10);

      const transactions: Transaction[] = [
        {
          id: '1',
          description: 'Salary',
          amount: 5000,
          type: 'income',
          category: 'salary-id',
          date: lastMonth,
          createdAt: `${lastMonth}T10:00:00Z`,
        },
        {
          id: '2',
          description: 'Groceries',
          amount: 200,
          type: 'expense',
          category: 'food-id',
          date: lastMonth,
          createdAt: `${lastMonth}T10:00:00Z`,
        },
        {
          id: '3',
          description: 'Freelance',
          amount: 1000,
          type: 'income',
          category: 'freelance-id',
          date: currentMonthDate,
          createdAt: `${currentMonthDate}T10:00:00Z`,
        },
      ];

      const result = getMonthlyTotals(transactions, 3);
      
      // Find last month and current month
      const lastMonthData = result.find((m) => m.month === lastMonth.slice(0, 7));
      const currentMonthData = result.find((m) => m.month === currentMonth);

      expect(lastMonthData?.income).toBe(5000);
      expect(lastMonthData?.expenses).toBe(200);
      expect(lastMonthData?.net).toBe(4800);

      expect(currentMonthData?.income).toBe(1000);
      expect(currentMonthData?.expenses).toBe(0);
      expect(currentMonthData?.net).toBe(1000);
    });

    it('should calculate net correctly (income - expenses)', () => {
      const now = new Date();
      const currentMonthDate = new Date(now.getFullYear(), now.getMonth(), 15).toISOString().slice(0, 10);
      const currentMonth = currentMonthDate.slice(0, 7);

      const transactions: Transaction[] = [
        {
          id: '1',
          description: 'Income',
          amount: 3000,
          type: 'income',
          category: 'salary-id',
          date: currentMonthDate,
          createdAt: `${currentMonthDate}T10:00:00Z`,
        },
        {
          id: '2',
          description: 'Expense',
          amount: 1500,
          type: 'expense',
          category: 'food-id',
          date: currentMonthDate,
          createdAt: `${currentMonthDate}T10:00:00Z`,
        },
      ];

      const result = getMonthlyTotals(transactions, 2);
      const current = result.find((m) => m.month === currentMonth);

      expect(current?.net).toBe(1500); // 3000 - 1500
    });

    it('should return months sorted from oldest to newest', () => {
      const result = getMonthlyTotals([], 6);
      
      for (let i = 1; i < result.length; i++) {
        expect(result[i].month > result[i - 1].month).toBe(true);
      }
    });
  });

  describe('getBestMonth', () => {
    it('should return null for empty array', () => {
      const result = getBestMonth([]);
      expect(result).toBeNull();
    });

    it('should return the month with highest net savings', () => {
      const monthlyTotals = [
        { month: '2024-01', monthLabel: 'Jan', income: 5000, expenses: 2000, net: 3000 },
        { month: '2024-02', monthLabel: 'Feb', income: 4000, expenses: 1000, net: 3000 },
        { month: '2024-03', monthLabel: 'Mar', income: 6000, expenses: 1500, net: 4500 },
      ];

      const result = getBestMonth(monthlyTotals);
      
      expect(result?.month).toBe('2024-03');
      expect(result?.net).toBe(4500);
    });

    it('should handle negative net values', () => {
      const monthlyTotals = [
        { month: '2024-01', monthLabel: 'Jan', income: 1000, expenses: 2000, net: -1000 },
        { month: '2024-02', monthLabel: 'Feb', income: 500, expenses: 1000, net: -500 },
      ];

      const result = getBestMonth(monthlyTotals);
      
      expect(result?.month).toBe('2024-02');
      expect(result?.net).toBe(-500);
    });
  });

  describe('getAverageSpending', () => {
    it('should return 0 for empty array', () => {
      const result = getAverageSpending([]);
      expect(result).toBe(0);
    });

    it('should calculate average expenses correctly', () => {
      const monthlyTotals = [
        { month: '2024-01', monthLabel: 'Jan', income: 5000, expenses: 2000, net: 3000 },
        { month: '2024-02', monthLabel: 'Feb', income: 4000, expenses: 3000, net: 1000 },
        { month: '2024-03', monthLabel: 'Mar', income: 6000, expenses: 1000, net: 5000 },
      ];

      const result = getAverageSpending(monthlyTotals);
      
      expect(result).toBe(2000); // (2000 + 3000 + 1000) / 3
    });

    it('should handle months with zero expenses', () => {
      const monthlyTotals = [
        { month: '2024-01', monthLabel: 'Jan', income: 5000, expenses: 0, net: 5000 },
        { month: '2024-02', monthLabel: 'Feb', income: 4000, expenses: 0, net: 4000 },
      ];

      const result = getAverageSpending(monthlyTotals);
      
      expect(result).toBe(0);
    });
  });

  describe('getSpendingTrend', () => {
    it('should return null for less than 2 months', () => {
      const monthlyTotals = [
        { month: '2024-01', monthLabel: 'Jan', income: 5000, expenses: 2000, net: 3000 },
      ];

      const result = getSpendingTrend(monthlyTotals);
      
      expect(result).toBeNull();
    });

    it('should detect upward trend (spending increased)', () => {
      const monthlyTotals = [
        { month: '2024-01', monthLabel: 'Jan', income: 5000, expenses: 2000, net: 3000 },
        { month: '2024-02', monthLabel: 'Feb', income: 5000, expenses: 3000, net: 2000 },
      ];

      const result = getSpendingTrend(monthlyTotals);
      
      expect(result?.direction).toBe('up');
      expect(result?.percentage).toBe(50); // (3000 - 2000) / 2000 * 100
      expect(result?.currentMonth).toBe(3000);
      expect(result?.previousMonth).toBe(2000);
    });

    it('should detect downward trend (spending decreased)', () => {
      const monthlyTotals = [
        { month: '2024-01', monthLabel: 'Jan', income: 5000, expenses: 3000, net: 2000 },
        { month: '2024-02', monthLabel: 'Feb', income: 5000, expenses: 2000, net: 3000 },
      ];

      const result = getSpendingTrend(monthlyTotals);
      
      expect(result?.direction).toBe('down');
      expect(result?.percentage).toBeCloseTo(33.33, 1); // (3000 - 2000) / 3000 * 100
      expect(result?.currentMonth).toBe(2000);
      expect(result?.previousMonth).toBe(3000);
    });

    it('should detect neutral trend (no change)', () => {
      const monthlyTotals = [
        { month: '2024-01', monthLabel: 'Jan', income: 5000, expenses: 2000, net: 3000 },
        { month: '2024-02', monthLabel: 'Feb', income: 5000, expenses: 2000, net: 3000 },
      ];

      const result = getSpendingTrend(monthlyTotals);
      
      expect(result?.direction).toBe('neutral');
      expect(result?.percentage).toBe(0);
    });

    it('should handle previous month with zero expenses', () => {
      const monthlyTotals = [
        { month: '2024-01', monthLabel: 'Jan', income: 5000, expenses: 0, net: 5000 },
        { month: '2024-02', monthLabel: 'Feb', income: 5000, expenses: 1000, net: 4000 },
      ];

      const result = getSpendingTrend(monthlyTotals);
      
      expect(result?.direction).toBe('up');
      expect(result?.percentage).toBe(100);
    });

    it('should handle both months with zero expenses', () => {
      const monthlyTotals = [
        { month: '2024-01', monthLabel: 'Jan', income: 5000, expenses: 0, net: 5000 },
        { month: '2024-02', monthLabel: 'Feb', income: 5000, expenses: 0, net: 5000 },
      ];

      const result = getSpendingTrend(monthlyTotals);
      
      expect(result?.direction).toBe('neutral');
      expect(result?.percentage).toBe(0);
    });
  });

  describe('hasSufficientMonthlyData', () => {
    it('should return false for empty array', () => {
      const result = hasSufficientMonthlyData([]);
      expect(result).toBe(false);
    });

    it('should return false for less than 2 months with data', () => {
      const monthlyTotals = [
        { month: '2024-01', monthLabel: 'Jan', income: 5000, expenses: 2000, net: 3000 },
        { month: '2024-02', monthLabel: 'Feb', income: 0, expenses: 0, net: 0 },
      ];

      const result = hasSufficientMonthlyData(monthlyTotals);
      expect(result).toBe(false);
    });

    it('should return true for 2 or more months with data', () => {
      const monthlyTotals = [
        { month: '2024-01', monthLabel: 'Jan', income: 5000, expenses: 2000, net: 3000 },
        { month: '2024-02', monthLabel: 'Feb', income: 4000, expenses: 1000, net: 3000 },
      ];

      const result = hasSufficientMonthlyData(monthlyTotals);
      expect(result).toBe(true);
    });

    it('should count months with only income as having data', () => {
      const monthlyTotals = [
        { month: '2024-01', monthLabel: 'Jan', income: 5000, expenses: 0, net: 5000 },
        { month: '2024-02', monthLabel: 'Feb', income: 4000, expenses: 0, net: 4000 },
      ];

      const result = hasSufficientMonthlyData(monthlyTotals);
      expect(result).toBe(true);
    });

    it('should count months with only expenses as having data', () => {
      const monthlyTotals = [
        { month: '2024-01', monthLabel: 'Jan', income: 0, expenses: 2000, net: -2000 },
        { month: '2024-02', monthLabel: 'Feb', income: 0, expenses: 1000, net: -1000 },
      ];

      const result = hasSufficientMonthlyData(monthlyTotals);
      expect(result).toBe(true);
    });
  });
});
