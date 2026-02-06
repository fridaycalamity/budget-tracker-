import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Dashboard } from './Dashboard';
import { BudgetProvider } from '../contexts/BudgetContext';
import { ToastProvider } from '../contexts/ToastContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import * as storage from '../utils/storage';
import type { Transaction } from '../types';

// Mock Chart.js to avoid canvas issues in tests
vi.mock('react-chartjs-2', () => ({
  Doughnut: () => <div data-testid="spending-chart">Chart</div>,
}));

// Mock storage service
vi.mock('../utils/storage', () => ({
  storageService: {
    getTransactions: vi.fn(() => []),
    saveTransactions: vi.fn(),
    getBudgetGoal: vi.fn(() => null),
    saveBudgetGoal: vi.fn(),
    getTheme: vi.fn(() => 'light'),
    saveTheme: vi.fn(),
    clearAll: vi.fn(),
  },
}));

// Helper to render Dashboard with providers
function renderDashboard() {
  return render(
    <ThemeProvider>
      <ToastProvider>
        <BudgetProvider>
          <Dashboard />
        </BudgetProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders page title and description', () => {
    renderDashboard();
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Financial overview and recent activity')).toBeInTheDocument();
  });

  it('renders three summary cards', () => {
    renderDashboard();
    
    expect(screen.getByText('Total Income')).toBeInTheDocument();
    expect(screen.getByText('Total Expenses')).toBeInTheDocument();
    expect(screen.getByText('Balance')).toBeInTheDocument();
  });

  it('renders spending chart section', () => {
    renderDashboard();
    
    expect(screen.getByText('Spending by Category')).toBeInTheDocument();
  });

  it('displays empty state when no transactions exist', () => {
    renderDashboard();
    
    expect(screen.getByText('No transactions yet')).toBeInTheDocument();
    expect(screen.getByText('Start tracking your finances by adding your first transaction.')).toBeInTheDocument();
  });

  it('displays recent transactions section header', () => {
    renderDashboard();
    
    expect(screen.getByText('Recent Transactions')).toBeInTheDocument();
  });

  it('applies responsive grid layout to summary cards', () => {
    const { container } = renderDashboard();
    
    const grid = container.querySelector('.grid');
    expect(grid).toHaveClass('grid-cols-1', 'md:grid-cols-3', 'gap-4');
  });

  it('displays balance with green color when positive', () => {
    // Mock transactions with positive balance
    const mockTransactions: Transaction[] = [
      {
        id: '1',
        description: 'Salary',
        amount: 5000,
        type: 'income',
        category: 'Salary',
        date: '2024-01-15',
        createdAt: '2024-01-15T10:00:00Z',
      },
      {
        id: '2',
        description: 'Groceries',
        amount: 1000,
        type: 'expense',
        category: 'Food',
        date: '2024-01-16',
        createdAt: '2024-01-16T10:00:00Z',
      },
    ];

    vi.mocked(storage.storageService.getTransactions).mockReturnValue(mockTransactions);

    const { container } = renderDashboard();
    
    // Find the balance card (third card)
    const balanceCards = container.querySelectorAll('.bg-green-50');
    expect(balanceCards.length).toBeGreaterThan(0);
  });

  it('displays balance with red color when negative', () => {
    // Mock transactions with negative balance
    const mockTransactions: Transaction[] = [
      {
        id: '1',
        description: 'Salary',
        amount: 1000,
        type: 'income',
        category: 'Salary',
        date: '2024-01-15',
        createdAt: '2024-01-15T10:00:00Z',
      },
      {
        id: '2',
        description: 'Shopping',
        amount: 5000,
        type: 'expense',
        category: 'Shopping',
        date: '2024-01-16',
        createdAt: '2024-01-16T10:00:00Z',
      },
    ];

    vi.mocked(storage.storageService.getTransactions).mockReturnValue(mockTransactions);

    const { container } = renderDashboard();
    
    // Find red colored cards (should include balance card)
    const redCards = container.querySelectorAll('.bg-red-50');
    expect(redCards.length).toBeGreaterThan(0);
  });

  it('displays up to 10 most recent transactions', () => {
    // Mock 15 transactions
    const mockTransactions: Transaction[] = Array.from({ length: 15 }, (_, i) => ({
      id: `${i + 1}`,
      description: `Transaction ${i + 1}`,
      amount: 100,
      type: i % 2 === 0 ? 'income' : 'expense',
      category: 'Other',
      date: `2024-01-${String(i + 1).padStart(2, '0')}`,
      createdAt: `2024-01-${String(i + 1).padStart(2, '0')}T10:00:00Z`,
    })) as Transaction[];

    vi.mocked(storage.storageService.getTransactions).mockReturnValue(mockTransactions);

    renderDashboard();
    
    // Should display only 10 transactions
    const transactionElements = screen.getAllByText(/Transaction \d+/);
    expect(transactionElements.length).toBe(10);
  });

  it('displays transactions in reverse chronological order (newest first)', () => {
    const mockTransactions: Transaction[] = [
      {
        id: '1',
        description: 'Old Transaction',
        amount: 100,
        type: 'income',
        category: 'Salary',
        date: '2024-01-01',
        createdAt: '2024-01-01T10:00:00Z',
      },
      {
        id: '2',
        description: 'Recent Transaction',
        amount: 200,
        type: 'expense',
        category: 'Food',
        date: '2024-01-15',
        createdAt: '2024-01-15T10:00:00Z',
      },
    ];

    vi.mocked(storage.storageService.getTransactions).mockReturnValue(mockTransactions);

    renderDashboard();
    
    const descriptions = screen.getAllByText(/Transaction/);
    // The recent transaction should appear before the old one
    expect(descriptions[0]).toHaveTextContent('Recent Transaction');
  });
});
