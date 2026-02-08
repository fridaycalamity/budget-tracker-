import { format, subMonths, parseISO } from 'date-fns';
import type { Transaction } from '../types';

/**
 * Monthly totals interface
 */
export interface MonthlyTotal {
  month: string; // YYYY-MM format
  monthLabel: string; // Short month name (e.g., "Jan")
  income: number;
  expenses: number;
  net: number;
}

/**
 * Spending trend interface
 */
export interface SpendingTrend {
  direction: 'up' | 'down' | 'neutral';
  percentage: number;
  currentMonth: number;
  previousMonth: number;
}

/**
 * Get monthly totals for the last N months
 * Returns array of monthly data sorted from oldest to newest
 */
export function getMonthlyTotals(
  transactions: Transaction[],
  monthsCount: number = 6
): MonthlyTotal[] {
  const now = new Date();
  const monthlyData: Record<string, MonthlyTotal> = {};

  // Initialize all months with zero values
  for (let i = monthsCount - 1; i >= 0; i--) {
    const monthDate = subMonths(now, i);
    const monthKey = format(monthDate, 'yyyy-MM');
    const monthLabel = format(monthDate, 'MMM');

    monthlyData[monthKey] = {
      month: monthKey,
      monthLabel,
      income: 0,
      expenses: 0,
      net: 0,
    };
  }

  // Aggregate transactions by month
  transactions.forEach((transaction) => {
    const transactionDate = parseISO(transaction.date);
    const monthKey = format(transactionDate, 'yyyy-MM');

    // Only include if within our date range
    if (monthlyData[monthKey]) {
      if (transaction.type === 'income') {
        monthlyData[monthKey].income += transaction.amount;
      } else {
        monthlyData[monthKey].expenses += transaction.amount;
      }
    }
  });

  // Calculate net for each month
  Object.values(monthlyData).forEach((month) => {
    month.net = month.income - month.expenses;
  });

  // Return sorted array (oldest to newest)
  return Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));
}

/**
 * Get the best month (highest net savings)
 * Returns null if no data available
 */
export function getBestMonth(monthlyTotals: MonthlyTotal[]): MonthlyTotal | null {
  if (monthlyTotals.length === 0) return null;

  return monthlyTotals.reduce((best, current) => {
    return current.net > best.net ? current : best;
  });
}

/**
 * Get average monthly spending across all months
 */
export function getAverageSpending(monthlyTotals: MonthlyTotal[]): number {
  if (monthlyTotals.length === 0) return 0;

  const totalExpenses = monthlyTotals.reduce((sum, month) => sum + month.expenses, 0);
  return totalExpenses / monthlyTotals.length;
}

/**
 * Get spending trend comparing current month to previous month
 * Returns direction, percentage change, and amounts
 */
export function getSpendingTrend(monthlyTotals: MonthlyTotal[]): SpendingTrend | null {
  if (monthlyTotals.length < 2) return null;

  const currentMonth = monthlyTotals[monthlyTotals.length - 1];
  const previousMonth = monthlyTotals[monthlyTotals.length - 2];

  const currentExpenses = currentMonth.expenses;
  const previousExpenses = previousMonth.expenses;

  // Handle edge case where previous month had zero expenses
  if (previousExpenses === 0) {
    if (currentExpenses === 0) {
      return {
        direction: 'neutral',
        percentage: 0,
        currentMonth: currentExpenses,
        previousMonth: previousExpenses,
      };
    }
    return {
      direction: 'up',
      percentage: 100,
      currentMonth: currentExpenses,
      previousMonth: previousExpenses,
    };
  }

  const percentageChange = ((currentExpenses - previousExpenses) / previousExpenses) * 100;

  let direction: 'up' | 'down' | 'neutral';
  if (Math.abs(percentageChange) < 0.01) {
    direction = 'neutral';
  } else if (percentageChange > 0) {
    direction = 'up';
  } else {
    direction = 'down';
  }

  return {
    direction,
    percentage: Math.abs(percentageChange),
    currentMonth: currentExpenses,
    previousMonth: previousExpenses,
  };
}

/**
 * Check if there is sufficient data for monthly trends
 * Returns true if there are at least 2 months with transactions
 */
export function hasSufficientMonthlyData(monthlyTotals: MonthlyTotal[]): boolean {
  const monthsWithData = monthlyTotals.filter(
    (month) => month.income > 0 || month.expenses > 0
  );
  return monthsWithData.length >= 2;
}
