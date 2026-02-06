import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Settings } from './Settings';
import { BudgetProvider, ToastProvider, CategoryProvider } from '../contexts';

/**
 * Test suite for Settings page component
 * Tests data management functionality including clear all data
 */

// Helper to render Settings with context
function renderSettings() {
  return render(
    <ToastProvider>
      <CategoryProvider>
        <BudgetProvider>
          <Settings />
        </BudgetProvider>
      </CategoryProvider>
    </ToastProvider>
  );
}

describe('Settings', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  it('should render settings page with title and description', () => {
    renderSettings();

    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Manage your application settings and data')).toBeInTheDocument();
  });

  it('should render data management section with clear button', () => {
    renderSettings();

    expect(screen.getByText('Data Management')).toBeInTheDocument();
    expect(screen.getByText(/Clear all your transactions and budget goals/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /clear all data/i })).toBeInTheDocument();
  });

  it('should show confirmation dialog when clear button is clicked', async () => {
    const user = userEvent.setup();
    renderSettings();

    const clearButton = screen.getByRole('button', { name: /clear all data/i });
    await user.click(clearButton);

    // Check for confirmation dialog
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Clear All Data?')).toBeInTheDocument();
    expect(screen.getByText(/This will permanently delete all your transactions/i)).toBeInTheDocument();
  });

  it('should close confirmation dialog when cancel is clicked', async () => {
    const user = userEvent.setup();
    renderSettings();

    // Open dialog
    const clearButton = screen.getByRole('button', { name: /clear all data/i });
    await user.click(clearButton);

    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Click cancel
    const cancelButton = screen.getByRole('button', { name: /cancel clearing data/i });
    await user.click(cancelButton);

    // Dialog should be closed
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should close confirmation dialog when backdrop is clicked', async () => {
    renderSettings();

    // Open dialog
    const clearButton = screen.getByRole('button', { name: /clear all data/i });
    fireEvent.click(clearButton);

    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Click backdrop (the dialog wrapper itself, not its children)
    const dialogWrapper = screen.getByRole('dialog');
    fireEvent.click(dialogWrapper);

    // Dialog should be closed
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should clear all data and show success message when confirmed', async () => {
    const user = userEvent.setup();
    
    // Add some test data to localStorage
    localStorage.setItem('budget_tracker_transactions', JSON.stringify([
      {
        id: '1',
        description: 'Test transaction',
        amount: 100,
        type: 'expense',
        category: 'Food',
        date: '2024-01-01',
        createdAt: '2024-01-01T00:00:00.000Z',
      },
    ]));
    localStorage.setItem('budget_tracker_budget_goal', JSON.stringify({
      monthlyLimit: 5000,
      month: '2024-01',
    }));

    renderSettings();

    // Open dialog
    const clearButton = screen.getByRole('button', { name: /clear all data/i });
    await user.click(clearButton);

    // Confirm clear
    const confirmButton = screen.getByRole('button', { name: /confirm clear all data/i });
    await user.click(confirmButton);

    // Dialog should be closed
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    // Success message should appear
    await waitFor(() => {
      expect(screen.getByText(/All data has been cleared successfully!/i)).toBeInTheDocument();
    });

    // localStorage should be cleared (items removed, so getItem returns null)
    expect(localStorage.getItem('budget_tracker_transactions')).toBeNull();
    expect(localStorage.getItem('budget_tracker_budget_goal')).toBeNull();
  });

  it('should hide success message after 3 seconds', async () => {
    vi.useFakeTimers();
    
    renderSettings();

    // Open dialog and confirm using fireEvent for synchronous behavior with fake timers
    const clearButton = screen.getByRole('button', { name: /clear all data/i });
    fireEvent.click(clearButton);

    const confirmButton = screen.getByRole('button', { name: /confirm clear all data/i });
    fireEvent.click(confirmButton);

    // Success message should appear
    expect(screen.getByText(/All data has been cleared successfully!/i)).toBeInTheDocument();

    // Fast-forward 3 seconds
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    // Success message should be hidden
    expect(screen.queryByText(/All data has been cleared successfully!/i)).not.toBeInTheDocument();

    vi.useRealTimers();
  });

  it('should have proper ARIA attributes for accessibility', async () => {
    renderSettings();

    // Open dialog using fireEvent for synchronous behavior
    const clearButton = screen.getByRole('button', { name: /clear all data/i });
    fireEvent.click(clearButton);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'confirm-dialog-title');
    expect(dialog).toHaveAttribute('aria-describedby', 'confirm-dialog-description');

    // Check for success message accessibility
    const confirmButton = screen.getByRole('button', { name: /confirm clear all data/i });
    fireEvent.click(confirmButton);

    const successAlert = screen.getByRole('alert');
    expect(successAlert).toHaveAttribute('aria-live', 'polite');
  });

  it('should maintain data when cancel is clicked', async () => {
    // Add some test data to localStorage
    const testData = [
      {
        id: '1',
        description: 'Test transaction',
        amount: 100,
        type: 'expense',
        category: '550e8400-e29b-41d4-a716-446655440001', // Food category ID
        date: '2024-01-01',
        createdAt: '2024-01-01T00:00:00.000Z',
      },
    ];
    localStorage.setItem('budget_tracker_transactions', JSON.stringify(testData));

    renderSettings();

    // Open dialog using fireEvent for synchronous behavior
    const clearButton = screen.getByRole('button', { name: /clear all data/i });
    fireEvent.click(clearButton);

    // Cancel
    const cancelButton = screen.getByRole('button', { name: /cancel clearing data/i });
    fireEvent.click(cancelButton);

    // Data should still be in localStorage
    expect(localStorage.getItem('budget_tracker_transactions')).toBe(JSON.stringify(testData));
  });
});
