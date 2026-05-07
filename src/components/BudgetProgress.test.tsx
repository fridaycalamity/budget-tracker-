import { beforeEach, describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BudgetProgress } from './BudgetProgress';
import * as BudgetContext from '../contexts/BudgetContext';
import * as CategoryContext from '../contexts/CategoryContext';
import type { BudgetContextValue, CategoryContextValue } from '../types';

vi.mock('../contexts/BudgetContext', () => ({ useBudget: vi.fn() }));
vi.mock('../contexts/CategoryContext', () => ({ useCategories: vi.fn() }));

const createMockBudgetContext = (overrides: Partial<BudgetContextValue> = {}): BudgetContextValue => ({
  summary: { totalIncome: 0, totalExpenses: 0, balance: 0, expensesByCategory: {} as any },
  budgetGoal: null,
  transactions: [], balanceSources: [], addBalanceSource: vi.fn(async () => {}), updateBalanceSource: vi.fn(async () => {}), deleteBalanceSource: vi.fn(async () => {}), assignTransactionsToSource: vi.fn(async () => {}), subscriptions: [], addSubscription: vi.fn(async () => {}), updateSubscription: vi.fn(async () => {}), deleteSubscription: vi.fn(async () => {}), toggleSubscription: vi.fn(async () => {}), subscriptionPayments: [], addTransaction: vi.fn(), updateTransaction: vi.fn(), deleteTransaction: vi.fn(), setBudgetGoal: vi.fn(), getMonthlySummary: vi.fn(() => ({ totalIncome: 0, totalExpenses: 0, balance: 0, expensesByCategory: {}, balanceBySource: {} })), clearAllData: vi.fn(), retrySync: vi.fn(async () => {}), clearLocalCache: vi.fn(async () => {}), forceRefreshFromServer: vi.fn(async () => {}), queuedCount: 0, isSyncing: false, isOffline: false, loading: false, ...overrides,
});

const createMockCategoryContext = (overrides: Partial<CategoryContextValue> = {}): CategoryContextValue => ({
  categories: [], addCategory: vi.fn(), updateCategory: vi.fn(), deleteCategory: vi.fn(), getCategoryById: vi.fn(), getCategoriesByType: vi.fn(() => []), getDefaultCategories: vi.fn(() => []), getCustomCategories: vi.fn(() => []), loading: false, ...overrides,
});

describe('BudgetProgress', () => {
  beforeEach(() => {
    vi.mocked(CategoryContext.useCategories).mockReturnValue(createMockCategoryContext());
  });
  it('renders empty state when no budget goal is set', () => {
    vi.mocked(BudgetContext.useBudget).mockReturnValue(createMockBudgetContext());
    render(<BudgetProgress />);
    expect(screen.getByText('No Budget Limit Set')).toBeInTheDocument();
  });

  it('renders progress bar with correct percentage', () => {
    vi.mocked(BudgetContext.useBudget).mockReturnValue(createMockBudgetContext({ summary: { totalIncome: 10000, totalExpenses: 5000, balance: 5000, expensesByCategory: {} as any }, budgetGoal: { monthlyLimit: 10000, month: '2024-01' } }));
    render(<BudgetProgress />);
    expect(screen.getByText('Spending Rhythm')).toBeInTheDocument();
    expect(screen.getAllByText('50%').length).toBeGreaterThan(0);
    expect(screen.getByText('₱10,000.00')).toBeInTheDocument();
    expect(screen.getAllByText('₱5,000.00').length).toBeGreaterThan(0);
  });

  it('shows caution state when spending pressure is high', () => {
    vi.mocked(BudgetContext.useBudget).mockReturnValue(createMockBudgetContext({ summary: { totalIncome: 10000, totalExpenses: 8500, balance: 1500, expensesByCategory: {} as any }, budgetGoal: { monthlyLimit: 10000, month: '2024-01' } }));
    render(<BudgetProgress />);
    expect(screen.getAllByText('CAUTION').length).toBeGreaterThan(0);
    expect(screen.getAllByText('85%').length).toBeGreaterThan(0);
  });

  it('shows over limit state when spending exceeds limit', () => {
    vi.mocked(BudgetContext.useBudget).mockReturnValue(createMockBudgetContext({ summary: { totalIncome: 10000, totalExpenses: 12000, balance: -2000, expensesByCategory: {} as any }, budgetGoal: { monthlyLimit: 10000, month: '2024-01' } }));
    render(<BudgetProgress />);
    expect(screen.getAllByText('OVER LIMIT').length).toBeGreaterThan(0);
    expect(screen.getByText(/You exceeded the limit by/)).toBeInTheDocument();
    expect(screen.getAllByText('120%').length).toBeGreaterThan(0);
  });

  it('has proper accessibility attributes', () => {
    vi.mocked(BudgetContext.useBudget).mockReturnValue(createMockBudgetContext({ summary: { totalIncome: 10000, totalExpenses: 5000, balance: 5000, expensesByCategory: {} as any }, budgetGoal: { monthlyLimit: 10000, month: '2024-01' } }));
    render(<BudgetProgress />);
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '50');
    expect(progressBar).toHaveAttribute('aria-valuemin', '0');
    expect(progressBar).toHaveAttribute('aria-valuemax', '100');
    expect(progressBar).toHaveAttribute('aria-label', 'Budget usage percentage');
  });
});
