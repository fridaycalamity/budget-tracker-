import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Dashboard } from './Dashboard';
import { BudgetProvider } from '../contexts/BudgetContext';
import { ToastProvider } from '../contexts/ToastContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import { CategoryProvider } from '../contexts/CategoryContext';

function renderDashboard() {
  return render(
    <MemoryRouter>
      <ThemeProvider>
        <ToastProvider>
          <CategoryProvider>
            <BudgetProvider>
              <Dashboard />
            </BudgetProvider>
          </CategoryProvider>
        </ToastProvider>
      </ThemeProvider>
    </MemoryRouter>
  );
}

describe('Dashboard', () => {
  it('renders page title and description', () => {
    renderDashboard();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText(/A monochrome ledger view of your balances/i)).toBeInTheDocument();
  });

  it('renders hero and primary sections', () => {
    renderDashboard();
    expect(screen.getByText('Total Balance')).toBeInTheDocument();
    expect(screen.getByText('Accounts & Wallets')).toBeInTheDocument();
    expect(screen.getByText('Expenses Breakdown')).toBeInTheDocument();
    expect(screen.getByText('Recent Transactions')).toBeInTheDocument();
  });

  it('displays empty state when no transactions exist', () => {
    renderDashboard();
    expect(screen.getByText('No Transactions Yet')).toBeInTheDocument();
    expect(screen.getByText('Every journey begins with the first entry. Add an income or expense to start filling the ledger.')).toBeInTheDocument();
  });

  it('renders dashboard layout sections', () => {
    const { container } = renderDashboard();
    expect(container.querySelector('.app-page-title')).toBeInTheDocument();
    expect(container.querySelectorAll('.app-panel').length).toBeGreaterThan(2);
  });
});
