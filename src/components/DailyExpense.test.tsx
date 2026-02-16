import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '../test/testUtils';
import { DailyExpense } from './DailyExpense';
import { storageService } from '../utils';

describe('DailyExpense', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-16T12:00:00'));
    storageService.clearAll();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows empty state when there are no expenses', () => {
    render(<DailyExpense />);

    expect(screen.getByText('Daily Expense')).toBeInTheDocument();
    expect(screen.getByText(/No expenses yet/i)).toBeInTheDocument();
    expect(screen.getAllByText('₱0.00')).toHaveLength(2);
  });

  it('calculates today and weekly totals from expense transactions only', () => {
    storageService.saveTransactions([
      {
        id: '1',
        description: 'Today expense',
        amount: 100,
        type: 'expense',
        category: '550e8400-e29b-41d4-a716-446655440001',
        date: '2026-02-16',
        createdAt: '2026-02-16T09:00:00Z',
      },
      {
        id: '2',
        description: 'Today income',
        amount: 800,
        type: 'income',
        category: '550e8400-e29b-41d4-a716-446655440005',
        date: '2026-02-16',
        createdAt: '2026-02-16T10:00:00Z',
      },
      {
        id: '3',
        description: '3 days ago expense',
        amount: -25,
        type: 'expense',
        category: '550e8400-e29b-41d4-a716-446655440001',
        date: '2026-02-13',
        createdAt: '2026-02-13T12:00:00Z',
      },
      {
        id: '4',
        description: '6 days ago expense',
        amount: 50,
        type: 'expense',
        category: '550e8400-e29b-41d4-a716-446655440001',
        date: '2026-02-10',
        createdAt: '2026-02-10T12:00:00Z',
      },
      {
        id: '5',
        description: '8 days ago expense',
        amount: 999,
        type: 'expense',
        category: '550e8400-e29b-41d4-a716-446655440001',
        date: '2026-02-08',
        createdAt: '2026-02-08T12:00:00Z',
      },
    ]);

    render(<DailyExpense />);

    expect(screen.getByText('₱100.00')).toBeInTheDocument();
    expect(screen.getByText('₱175.00')).toBeInTheDocument();
  });
});
