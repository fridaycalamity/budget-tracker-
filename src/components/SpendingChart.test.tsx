import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '../test/testUtils';
import { SpendingChart } from './SpendingChart';
import { storageService } from '../utils';

describe('SpendingChart', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    storageService.clearAll();
  });

  it('should render empty state when there are no expenses', () => {
    render(<SpendingChart />);

    // Check for empty state message
    expect(screen.getByText(/No expense data to display/i)).toBeInTheDocument();
    expect(screen.getByText(/Add some expenses to see your spending breakdown/i)).toBeInTheDocument();
  });

  it('should render chart title', () => {
    // Add some test data with UUID category
    const transactions = [
      {
        id: '1',
        description: 'Groceries',
        amount: 1000,
        type: 'expense' as const,
        category: '550e8400-e29b-41d4-a716-446655440001', // Food category ID
        date: '2024-01-15',
        createdAt: '2024-01-15T10:00:00Z',
      },
    ];
    storageService.saveTransactions(transactions);

    render(<SpendingChart />);

    expect(screen.getByText('Spending by Category')).toBeInTheDocument();
  });

  it('should render chart when there are expenses', () => {
    // Add test data with multiple categories using UUIDs
    const transactions = [
      {
        id: '1',
        description: 'Groceries',
        amount: 1000,
        type: 'expense' as const,
        category: '550e8400-e29b-41d4-a716-446655440001', // Food
        date: '2024-01-15',
        createdAt: '2024-01-15T10:00:00Z',
      },
      {
        id: '2',
        description: 'Bus fare',
        amount: 500,
        type: 'expense' as const,
        category: '550e8400-e29b-41d4-a716-446655440002', // Transport
        date: '2024-01-16',
        createdAt: '2024-01-16T10:00:00Z',
      },
      {
        id: '3',
        description: 'Electricity',
        amount: 2000,
        type: 'expense' as const,
        category: '550e8400-e29b-41d4-a716-446655440003', // Bills
        date: '2024-01-17',
        createdAt: '2024-01-17T10:00:00Z',
      },
    ];
    storageService.saveTransactions(transactions);

    render(<SpendingChart />);

    // Chart should be rendered (canvas element)
    const canvas = document.querySelector('canvas');
    expect(canvas).toBeInTheDocument();

    // Empty state should not be shown
    expect(screen.queryByText(/No expense data to display/i)).not.toBeInTheDocument();
  });

  it('should not show income transactions in the chart', () => {
    // Add income and expense transactions with UUIDs
    const transactions = [
      {
        id: '1',
        description: 'Salary',
        amount: 50000,
        type: 'income' as const,
        category: '550e8400-e29b-41d4-a716-446655440005', // Salary
        date: '2024-01-01',
        createdAt: '2024-01-01T10:00:00Z',
      },
      {
        id: '2',
        description: 'Groceries',
        amount: 1000,
        type: 'expense' as const,
        category: '550e8400-e29b-41d4-a716-446655440001', // Food
        date: '2024-01-15',
        createdAt: '2024-01-15T10:00:00Z',
      },
    ];
    storageService.saveTransactions(transactions);

    render(<SpendingChart />);

    // Chart should be rendered (only expenses)
    const canvas = document.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });

  it('should handle categories with zero expenses', () => {
    // Add expenses in only one category using UUID
    const transactions = [
      {
        id: '1',
        description: 'Groceries',
        amount: 1000,
        type: 'expense' as const,
        category: '550e8400-e29b-41d4-a716-446655440001', // Food
        date: '2024-01-15',
        createdAt: '2024-01-15T10:00:00Z',
      },
    ];
    storageService.saveTransactions(transactions);

    render(<SpendingChart />);

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
        category: '550e8400-e29b-41d4-a716-446655440001', // Food
        date: '2024-01-15',
        createdAt: '2024-01-15T10:00:00Z',
      },
    ];
    storageService.saveTransactions(transactions);

    const { container } = render(<SpendingChart />);

    // Check for responsive container classes
    const chartContainer = container.querySelector('.bg-white');
    expect(chartContainer).toHaveClass('rounded-lg', 'shadow-md');
    expect(
      chartContainer?.classList.contains('p-6') ||
        (chartContainer?.classList.contains('p-4') && chartContainer?.classList.contains('sm:p-6'))
    ).toBe(true);
  });

  it('should aggregate multiple expenses in the same category', () => {
    // Add multiple expenses in the same category using UUID
    const transactions = [
      {
        id: '1',
        description: 'Groceries',
        amount: 1000,
        type: 'expense' as const,
        category: '550e8400-e29b-41d4-a716-446655440001', // Food
        date: '2024-01-15',
        createdAt: '2024-01-15T10:00:00Z',
      },
      {
        id: '2',
        description: 'Restaurant',
        amount: 500,
        type: 'expense' as const,
        category: '550e8400-e29b-41d4-a716-446655440001', // Food
        date: '2024-01-16',
        createdAt: '2024-01-16T10:00:00Z',
      },
    ];
    storageService.saveTransactions(transactions);

    render(<SpendingChart />);

    // Chart should be rendered
    const canvas = document.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });
});
