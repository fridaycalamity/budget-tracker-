import { format, parseISO, subDays } from 'date-fns';
import type { Transaction } from '../types';

export interface DailyExpensePoint {
  date: string;
  label: string;
  amount: number;
}

export function getLocalDateKey(date: string): string {
  return format(parseISO(date), 'yyyy-MM-dd');
}

export function getDailyExpenseMap(transactions: Transaction[]): Record<string, number> {
  return transactions.reduce<Record<string, number>>((acc, transaction) => {
    if (transaction.type !== 'expense') {
      return acc;
    }

    try {
      const key = getLocalDateKey(transaction.date);
      acc[key] = (acc[key] ?? 0) + Math.abs(transaction.amount);
    } catch {
      // Ignore invalid dates in malformed records
    }

    return acc;
  }, {});
}

export function getLastNDaysExpenses(
  transactions: Transaction[],
  days: number = 7,
  now: Date = new Date()
): DailyExpensePoint[] {
  const dailyMap = getDailyExpenseMap(transactions);

  return Array.from({ length: days }, (_, index) => {
    const day = subDays(now, days - 1 - index);
    const key = format(day, 'yyyy-MM-dd');

    return {
      date: key,
      label: format(day, 'EEE'),
      amount: dailyMap[key] ?? 0,
    };
  });
}
