import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, BudgetProvider, ToastProvider } from './contexts';
import { Dashboard, TransactionList, BudgetGoals, Settings } from './pages';

// Create a test version of App without BrowserRouter so we can use MemoryRouter
function AppRoutes() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <BudgetProvider>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/transactions" element={<TransactionList />} />
                <Route path="/budget-goals" element={<BudgetGoals />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </main>
          </div>
        </BudgetProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

describe('App Routing', () => {
  it('renders Dashboard page on root path', () => {
    render(
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(
      screen.getByText('Financial overview and recent activity')
    ).toBeInTheDocument();
  });

  it('renders TransactionList page on /transactions path', () => {
    // Navigate to /transactions
    window.history.pushState({}, 'Transactions', '/transactions');
    
    render(
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    );

    expect(screen.getByText('Transactions')).toBeInTheDocument();
    expect(
      screen.getByText('View and manage all your transactions')
    ).toBeInTheDocument();
  });

  it('renders BudgetGoals page on /budget-goals path', () => {
    // Navigate to /budget-goals
    window.history.pushState({}, 'Budget Goals', '/budget-goals');
    
    render(
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    );

    expect(screen.getByText('Budget Goals')).toBeInTheDocument();
    expect(
      screen.getByText('Set and track your monthly spending limits')
    ).toBeInTheDocument();
  });

  it('renders Settings page on /settings path', () => {
    // Navigate to /settings
    window.history.pushState({}, 'Settings', '/settings');
    
    render(
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    );

    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(
      screen.getByText('Manage your application settings and data')
    ).toBeInTheDocument();
  });
});
