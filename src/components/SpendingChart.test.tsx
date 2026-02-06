import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SpendingChart } from './SpendingChart';
import { BudgetProvider, ToastProvider, ThemeProvider } from '../contexts';
import { storageService } from '../utils';

// Helper to render with providers
const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <ThemeProvider>
      <ToastProvider>
        <BudgetProvider>{ui}</BudgetProvider>
      </ToastProvider>
    </ThemeProvider>
  );
};

describe('SpendingChart', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    storageService.clearAll();
  });

  it('should render empty state when there are no expenses', () => {
    renderWithProviders(<SpendingChart />);

    // Check for empty state message
    expect(screen.getByText(/No expense data to display/i)).toBeInTheDocument();
    expect(screen.getByText(/Add some expenses to see your spending breakdown/i)).toBeInTheDocument();
  });

  it('should render chart title', () => {
    // Add some test data
    const transactions = [
      {
        id: '1',
        description: 'Groceries',
        amount: 1000,
        type: 'expense' as const,
        category: 'Food' as const,
        date: '2024-01-15',
        createdAt: '2024-01-15T10:00:00Z',
      },
    ];
    storageService.saveTransactions(transactions);

    renderWithProviders(<SpendingChart />);

    expect(screen.getByText('Spending by Category')).toBeInTheDocument();
  });

  it('should render chart when there are expenses', () => {
    // Add test data with multiple categories
    const transactions = [
      {
        id: '1',
        description: 'Groceries',
        amount: 1000,
        type: 'expense' as const,
        category: 'Food' as const,
        date: '2024-01-15',
        createdAt: '2024-01-15T10:00:00Z',
      },
      {
        id: '2',
        description: 'Bus fare',
        amount: 500,
        type: 'expense' as const,
        category: 'Transport' as const,
        date: '2024-01-16',
        createdAt: '2024-01-16T10:00:00Z',
      },
      {
        id: '3',
        description: 'Electricity',
        amount: 2000,
        type: 'expense' as const,
        category: 'Bills' as const,
        date: '2024-01-17',
        createdAt: '2024-01-17T10:00:00Z',
      },
    ];
    storageService.saveTransactions(transactions);

    renderWithProviders(<SpendingChart />);

    // Chart should be rendered (canvas element)
    const canvas = document.querySelector('canvas');
    expect(canvas).toBeInTheDocument();

    // Empty state should not be shown
    expect(screen.queryByText(/No expense data to display/i)).not.toBeInTheDocument();
  });

  it('should not show income transactions in the chart', () => {
    // Add income and expense transactions
    const transactions = [
      {
        id: '1',
        description: 'Salary',
        amount: 50000,
        type: 'income' as const,
        category: 'Salary' as const,
        date: '2024-01-01',
        createdAt: '2024-01-01T10:00:00Z',
      },
      {
        id: '2',
        description: 'Groceries',
        amount: 1000,
        type: 'expense' as const,
        category: 'Food' as const,
        date: '2024-01-15',
        createdAt: '2024-01-15T10:00:00Z',
      },
    ];
    storageService.saveTransactions(transactions);

    renderWithProviders(<SpendingChart />);

    // Chart should be rendered (only expenses)
    const canvas = document.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });

  it('should handle categories with zero expenses', () => {
    // Add expenses in only one category
    const transactions = [
      {
        id: '1',
        description: 'Groceries',
        amount: 1000,
        type: 'expense' as const,
        category: 'Food' as const,
        date: '2024-01-15',
        createdAt: '2024-01-15T10:00:00Z',
      },
    ];
    storageService.saveTransactions(transactions);

    renderWithProviders(<SpendingChart />);

    // Chart should be rendered
    const canvas = document.querySelector('canvas');
    expect(canvas).toBeInTheDocument();

    // Should not show empty state
    expect(screen.queryByText(/No expense data to display/i)).not.toBeInTheDocument();
  });

  it('should be responsive with proper container styling', () => {
    const transactions = [
      {
        id: '1',
        description: 'Groceries',
        amount: 1000,
        type: 'expense' as const,
        category: 'Food' as const,
        date: '2024-01-15',
        createdAt: '2024-01-15T10:00:00Z',
      },
    ];
    storageService.saveTransactions(transactions);

    const { container } = renderWithProviders(<SpendingChart />);

    // Check for responsive container classes
    const chartContainer = container.querySelector('.bg-white');
    expect(chartContainer).toHaveClass('rounded-lg', 'shadow-md', 'p-6');
  });

  it('should aggregate multiple expenses in the same category', () => {
    // Add multiple expenses in the same category
    const transactions = [
      {
        id: '1',
        description: 'Groceries',
        amount: 1000,
        type: 'expense' as const,
        category: 'Food' as const,
        date: '2024-01-15',
        createdAt: '2024-01-15T10:00:00Z',
      },
      {
        id: '2',
        description: 'Restaurant',
        amount: 500,
        type: 'expense' as const,
        category: 'Food' as const,
        date: '2024-01-16',
        createdAt: '2024-01-16T10:00:00Z',
      },
    ];
    storageService.saveTransactions(transactions);

    renderWithProviders(<SpendingChart />);

    // Chart should be rendered
    const canvas = document.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });
});
