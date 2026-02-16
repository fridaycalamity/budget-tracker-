import { describe, expect, it } from 'vitest';
import { getDailyExpenseMap, getLastNDaysExpenses, getLocalDateKey } from './dailyExpense';
import type { Transaction } from '../types';

const makeTx = (
  date: string,
  amount: number,
  type: 'income' | 'expense' = 'expense'
): Transaction => ({
  id: `${date}-${amount}-${type}`,
  description: 'test',
  amount,
  type,
  category: '550e8400-e29b-41d4-a716-446655440001',
  date,
  createdAt: `${date}T12:00:00Z`,
});

describe('dailyExpense utils', () => {
  it('returns local YYYY-MM-DD date key', () => {
    expect(getLocalDateKey('2026-02-16')).toBe('2026-02-16');
  });

  it('groups and sums only expense transactions by day', () => {
    const transactions = [
      makeTx('2026-02-16', 100, 'expense'),
      makeTx('2026-02-16', -20, 'expense'),
      makeTx('2026-02-16', 500, 'income'),
      makeTx('2026-02-15', 40, 'expense'),
    ];

    const result = getDailyExpenseMap(transactions);

    expect(result['2026-02-16']).toBe(120);
    expect(result['2026-02-15']).toBe(40);
    expect(Object.keys(result)).toHaveLength(2);
  });

  it('returns last N days with zero-filled gaps', () => {
    const transactions = [
      makeTx('2026-02-16', 100, 'expense'),
      makeTx('2026-02-14', 30, 'expense'),
    ];

    const result = getLastNDaysExpenses(transactions, 4, new Date('2026-02-16T12:00:00'));

    expect(result.map((d) => d.date)).toEqual([
      '2026-02-13',
      '2026-02-14',
      '2026-02-15',
      '2026-02-16',
    ]);
    expect(result.map((d) => d.amount)).toEqual([0, 30, 0, 100]);
  });
});
