import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BudgetProgress } from './BudgetProgress';
import * as BudgetContext from '../contexts/BudgetContext';

// Mock the useBudget hook
vi.mock('../contexts/BudgetContext', () => ({
  useBudget: vi.fn(),
}));

describe('BudgetProgress', () => {
  it('should not render when no budget goal is set', () => {
    vi.mocked(BudgetContext.useBudget).mockReturnValue({
      summary: {
        totalIncome: 0,
        totalExpenses: 0,
        balance: 0,
        expensesByCategory: {} as any,
      },
      budgetGoal: null,
      transactions: [],
      addTransaction: vi.fn(),
      updateTransaction: vi.fn(),
      deleteTransaction: vi.fn(),
      setBudgetGoal: vi.fn(),
      clearAllData: vi.fn(),
      loading: false,
    });

    const { container } = render(<BudgetProgress />);
    expect(container.firstChild).toBeNull();
  });

  it('should render progress bar with correct percentage', () => {
    vi.mocked(BudgetContext.useBudget).mockReturnValue({
      summary: {
        totalIncome: 10000,
        totalExpenses: 5000,
        balance: 5000,
        expensesByCategory: {} as any,
      },
      budgetGoal: {
        monthlyLimit: 10000,
        month: '2024-01',
      },
      transactions: [],
      addTransaction: vi.fn(),
      updateTransaction: vi.fn(),
      deleteTransaction: vi.fn(),
      setBudgetGoal: vi.fn(),
      clearAllData: vi.fn(),
      loading: false,
    });

    render(<BudgetProgress />);

    // Check that the component renders
    expect(screen.getByText('Budget Progress')).toBeInTheDocument();

    // Check percentage display
    expect(screen.getByText('50.0%')).toBeInTheDocument();

    // Check spending and limit amounts
    expect(screen.getByText('₱5,000.00')).toBeInTheDocument();
    expect(screen.getByText('₱10,000.00')).toBeInTheDocument();
  });

  it('should show warning when spending exceeds 80%', () => {
    vi.mocked(BudgetContext.useBudget).mockReturnValue({
      summary: {
        totalIncome: 10000,
        totalExpenses: 8500,
        balance: 1500,
        expensesByCategory: {} as any,
      },
      budgetGoal: {
        monthlyLimit: 10000,
        month: '2024-01',
      },
      transactions: [],
      addTransaction: vi.fn(),
      updateTransaction: vi.fn(),
      deleteTransaction: vi.fn(),
      setBudgetGoal: vi.fn(),
      clearAllData: vi.fn(),
      loading: false,
    });

    render(<BudgetProgress />);

    // Check for warning message
    expect(
      screen.getByText(/You've used over 80% of your monthly budget/i)
    ).toBeInTheDocument();

    // Check percentage
    expect(screen.getByText('85.0%')).toBeInTheDocument();
  });

  it('should show over budget message when spending exceeds limit', () => {
    vi.mocked(BudgetContext.useBudget).mockReturnValue({
      summary: {
        totalIncome: 10000,
        totalExpenses: 12000,
        balance: -2000,
        expensesByCategory: {} as any,
      },
      budgetGoal: {
        monthlyLimit: 10000,
        month: '2024-01',
      },
      transactions: [],
      addTransaction: vi.fn(),
      updateTransaction: vi.fn(),
      deleteTransaction: vi.fn(),
      setBudgetGoal: vi.fn(),
      clearAllData: vi.fn(),
      loading: false,
    });

    render(<BudgetProgress />);

    // Check for over budget message
    expect(
      screen.getByText(/You've exceeded your monthly budget by/i)
    ).toBeInTheDocument();

    // Check that it shows the overage amount
    expect(screen.getByText(/₱2,000.00/i)).toBeInTheDocument();

    // Check percentage is capped at 100%
    expect(screen.getByText('100.0%')).toBeInTheDocument();
  });

  it('should have proper accessibility attributes', () => {
    vi.mocked(BudgetContext.useBudget).mockReturnValue({
      summary: {
        totalIncome: 10000,
        totalExpenses: 5000,
        balance: 5000,
        expensesByCategory: {} as any,
      },
      budgetGoal: {
        monthlyLimit: 10000,
        month: '2024-01',
      },
      transactions: [],
      addTransaction: vi.fn(),
      updateTransaction: vi.fn(),
      deleteTransaction: vi.fn(),
      setBudgetGoal: vi.fn(),
      clearAllData: vi.fn(),
      loading: false,
    });

    render(<BudgetProgress />);

    // Check for progress bar with proper ARIA attributes
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '50');
    expect(progressBar).toHaveAttribute('aria-valuemin', '0');
    expect(progressBar).toHaveAttribute('aria-valuemax', '100');
    expect(progressBar).toHaveAttribute('aria-label', 'Budget usage percentage');
  });
});
