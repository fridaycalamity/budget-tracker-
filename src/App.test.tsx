import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, BudgetProvider, ToastProvider, CategoryProvider } from './contexts';
import { Dashboard, TransactionList, BudgetGoals, Settings } from './pages';

function AppRoutes() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <CategoryProvider>
          <BudgetProvider>
            <div className="app-shell">
              <main className="app-main px-4 py-8">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/transactions" element={<TransactionList />} />
                  <Route path="/budget-goals" element={<BudgetGoals />} />
                  <Route path="/settings" element={<Settings />} />
                </Routes>
              </main>
            </div>
          </BudgetProvider>
        </CategoryProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

describe('App Routing', () => {
  it('renders Dashboard page on root path', () => {
    render(<BrowserRouter><AppRoutes /></BrowserRouter>);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText(/monochrome ledger view/i)).toBeInTheDocument();
  });

  it('renders TransactionList page on /transactions path', () => {
    window.history.pushState({}, 'Transactions', '/transactions');
    render(<BrowserRouter><AppRoutes /></BrowserRouter>);
    expect(screen.getByText('Transactions')).toBeInTheDocument();
    expect(screen.getByText(/Review every recorded entry/i)).toBeInTheDocument();
  });

  it('renders BudgetGoals page on /budget-goals path', () => {
    window.history.pushState({}, 'Budget Goals', '/budget-goals');
    render(<BrowserRouter><AppRoutes /></BrowserRouter>);
    expect(screen.getByText('Budget Goals')).toBeInTheDocument();
    expect(screen.getByText(/monthly ceiling/i)).toBeInTheDocument();
  });

  it('renders Settings page on /settings path', () => {
    window.history.pushState({}, 'Settings', '/settings');
    render(<BrowserRouter><AppRoutes /></BrowserRouter>);
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText(/Manage source accounts, categories, and sync controls/i)).toBeInTheDocument();
  });
});
