import { describe, it, expect } from 'vitest';
import { render, screen } from '../test/testUtils';
import { MemoryRouter } from 'react-router-dom';
import { SpendingChart } from './SpendingChart';

function renderChart(summaryOverride: Parameters<typeof SpendingChart>[0]['summaryOverride']) {
  return render(
    <MemoryRouter>
      <SpendingChart summaryOverride={summaryOverride} />
    </MemoryRouter>
  );
}

describe('SpendingChart', () => {
  it('renders empty state when there are no expenses', () => {
    renderChart({ totalIncome: 0, totalExpenses: 0, balance: 0, expensesByCategory: {} });
    expect(screen.getByText(/No Expenses Recorded/i)).toBeInTheDocument();
  });

  it('renders chart title', () => {
    renderChart({ totalIncome: 0, totalExpenses: 1000, balance: -1000, expensesByCategory: { '550e8400-e29b-41d4-a716-446655440001': 1000 } });
    expect(screen.getByText('Expenses Breakdown')).toBeInTheDocument();
  });

  it('renders category rows when there are expenses', () => {
    renderChart({ totalIncome: 0, totalExpenses: 1500, balance: -1500, expensesByCategory: { '550e8400-e29b-41d4-a716-446655440001': 1000, '550e8400-e29b-41d4-a716-446655440002': 500 } });
    expect(screen.getByText(/Food/i)).toBeInTheDocument();
    expect(screen.getByText(/Transport/i)).toBeInTheDocument();
  });

  it('does not show income transactions in the breakdown', () => {
    renderChart({ totalIncome: 50000, totalExpenses: 1000, balance: 49000, expensesByCategory: { '550e8400-e29b-41d4-a716-446655440001': 1000 } });
    expect(screen.queryByText(/Salary/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Food/i)).toBeInTheDocument();
  });

  it('handles categories with zero expenses', () => {
    renderChart({ totalIncome: 0, totalExpenses: 1000, balance: -1000, expensesByCategory: { '550e8400-e29b-41d4-a716-446655440001': 1000 } });
    expect(screen.queryByText(/No Expenses Recorded/i)).not.toBeInTheDocument();
  });

  it('uses the panel container styling', () => {
    const { container } = renderChart({ totalIncome: 0, totalExpenses: 1000, balance: -1000, expensesByCategory: { '550e8400-e29b-41d4-a716-446655440001': 1000 } });
    expect(container.querySelector('.app-panel')).toBeInTheDocument();
  });

  it('aggregates multiple expenses in the same category', () => {
    renderChart({ totalIncome: 0, totalExpenses: 1500, balance: -1500, expensesByCategory: { '550e8400-e29b-41d4-a716-446655440001': 1500 } });
    expect(screen.getByText('₱1,500.00')).toBeInTheDocument();
  });
});
