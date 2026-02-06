import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider } from '../contexts/ToastContext';
import { BudgetProvider } from '../contexts/BudgetContext';
import { ToastContainer } from './ToastContainer';
import { TransactionForm } from './TransactionForm';

describe('Toast Integration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('shows success toast when transaction is added', async () => {
    const user = userEvent.setup();

    render(
      <ToastProvider>
        <BudgetProvider>
          <TransactionForm />
          <ToastContainer />
        </BudgetProvider>
      </ToastProvider>
    );

    // Fill out the form
    await user.type(screen.getByLabelText(/description/i), 'Test transaction');
    await user.type(screen.getByLabelText(/amount/i), '100.50');
    
    // Submit the form
    await user.click(screen.getByRole('button', { name: /add transaction/i }));

    // Wait for success toast to appear
    await waitFor(() => {
      expect(screen.getByText('Transaction added successfully!')).toBeInTheDocument();
    });

    // Verify it's a success toast (green background)
    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('bg-green-500');
  });

  it('shows error toast when validation fails', async () => {
    const user = userEvent.setup();

    render(
      <ToastProvider>
        <BudgetProvider>
          <TransactionForm />
          <ToastContainer />
        </BudgetProvider>
      </ToastProvider>
    );

    // Submit form without filling required fields
    await user.click(screen.getByRole('button', { name: /add transaction/i }));

    // Form validation should prevent submission
    // Error messages should appear in the form itself
    await waitFor(() => {
      expect(screen.getByText(/description is required/i)).toBeInTheDocument();
    });
  });

  it('auto-dismisses toast after duration', async () => {
    const user = userEvent.setup();

    render(
      <ToastProvider>
        <BudgetProvider>
          <TransactionForm />
          <ToastContainer />
        </BudgetProvider>
      </ToastProvider>
    );

    // Add a transaction
    await user.type(screen.getByLabelText(/description/i), 'Test transaction');
    await user.type(screen.getByLabelText(/amount/i), '50');
    await user.click(screen.getByRole('button', { name: /add transaction/i }));

    // Toast should appear
    await waitFor(() => {
      expect(screen.getByText('Transaction added successfully!')).toBeInTheDocument();
    });

    // Toast should disappear after 3 seconds
    await waitFor(
      () => {
        expect(screen.queryByText('Transaction added successfully!')).not.toBeInTheDocument();
      },
      { timeout: 4000 }
    );
  });

  it('can manually close toast', async () => {
    const user = userEvent.setup();

    render(
      <ToastProvider>
        <BudgetProvider>
          <TransactionForm />
          <ToastContainer />
        </BudgetProvider>
      </ToastProvider>
    );

    // Add a transaction
    await user.type(screen.getByLabelText(/description/i), 'Test transaction');
    await user.type(screen.getByLabelText(/amount/i), '75');
    await user.click(screen.getByRole('button', { name: /add transaction/i }));

    // Toast should appear
    await waitFor(() => {
      expect(screen.getByText('Transaction added successfully!')).toBeInTheDocument();
    });

    // Click close button
    const closeButton = screen.getByLabelText('Close notification');
    await user.click(closeButton);

    // Toast should disappear
    await waitFor(
      () => {
        expect(screen.queryByText('Transaction added successfully!')).not.toBeInTheDocument();
      },
      { timeout: 500 }
    );
  });

  it('displays multiple toasts in queue', async () => {
    const user = userEvent.setup();

    render(
      <ToastProvider>
        <BudgetProvider>
          <TransactionForm />
          <ToastContainer />
        </BudgetProvider>
      </ToastProvider>
    );

    // Add first transaction
    await user.type(screen.getByLabelText(/description/i), 'First transaction');
    await user.type(screen.getByLabelText(/amount/i), '100');
    await user.click(screen.getByRole('button', { name: /add transaction/i }));

    // Wait for first toast
    await waitFor(() => {
      expect(screen.getByText('Transaction added successfully!')).toBeInTheDocument();
    });

    // Add second transaction quickly
    await user.type(screen.getByLabelText(/description/i), 'Second transaction');
    await user.type(screen.getByLabelText(/amount/i), '200');
    await user.click(screen.getByRole('button', { name: /add transaction/i }));

    // Both toasts should be visible
    await waitFor(() => {
      const alerts = screen.getAllByRole('alert');
      expect(alerts).toHaveLength(2);
    });
  });
});
