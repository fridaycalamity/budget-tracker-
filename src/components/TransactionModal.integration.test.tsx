import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../test/testUtils';
import userEvent from '@testing-library/user-event';
import { TransactionModal } from './TransactionModal';
import { useBudget } from '../contexts';

/**
 * Integration test for TransactionModal with real TransactionForm
 * 
 * Tests the complete flow of opening modal, filling form, and submitting
 */

// Helper component to test the modal with context
function TestWrapper() {
  const [isOpen, setIsOpen] = React.useState(false);
  const { transactions } = useBudget();

  return (
    <div>
      <button onClick={() => setIsOpen(true)}>Open Modal</button>
      <TransactionModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
      <div data-testid="transaction-count">{transactions.length}</div>
    </div>
  );
}

// Import React for useState
import React from 'react';

describe('TransactionModal Integration', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  it('should successfully add a transaction and close modal', async () => {
    const user = userEvent.setup();
    
    render(<TestWrapper />);

    // Get initial transaction count
    const initialCount = parseInt(screen.getByTestId('transaction-count').textContent || '0');

    // Open modal
    await user.click(screen.getByText('Open Modal'));
    
    // Wait for modal to appear
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Fill out the form
    const descriptionInput = screen.getByLabelText(/description/i);
    const amountInput = screen.getByLabelText(/amount/i);
    
    await user.type(descriptionInput, 'Test Transaction');
    await user.type(amountInput, '100.50');

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /add transaction/i });
    await user.click(submitButton);

    // Modal should close
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    // Transaction count should increase
    await waitFor(() => {
      const newCount = parseInt(screen.getByTestId('transaction-count').textContent || '0');
      expect(newCount).toBe(initialCount + 1);
    });
  });

  it('should not close modal if form validation fails', async () => {
    const user = userEvent.setup();
    
    render(<TestWrapper />);

    // Open modal
    await user.click(screen.getByText('Open Modal'));
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Try to submit without filling required fields
    const submitButton = screen.getByRole('button', { name: /add transaction/i });
    await user.click(submitButton);

    // Modal should still be open
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    
    // Should show validation errors
    await waitFor(() => {
      expect(screen.getByText(/description is required/i)).toBeInTheDocument();
    });
  });

  it('should close modal when clicking backdrop', async () => {
    const user = userEvent.setup();
    
    render(<TestWrapper />);

    // Open modal
    await user.click(screen.getByText('Open Modal'));
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Click backdrop (the dialog element itself)
    const dialog = screen.getByRole('dialog');
    fireEvent.click(dialog);

    // Modal should close
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('should close modal when pressing Escape key', async () => {
    const user = userEvent.setup();
    
    render(<TestWrapper />);

    // Open modal
    await user.click(screen.getByText('Open Modal'));
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Press Escape
    fireEvent.keyDown(document, { key: 'Escape' });

    // Modal should close
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
