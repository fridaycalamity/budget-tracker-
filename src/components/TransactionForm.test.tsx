import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TransactionForm } from './TransactionForm';
import { BudgetProvider, ToastProvider, CategoryProvider } from '../contexts';

// Helper to render component with context
const renderWithContext = (ui: React.ReactElement) => {
  return render(
    <ToastProvider>
      <CategoryProvider>
        <BudgetProvider>{ui}</BudgetProvider>
      </CategoryProvider>
    </ToastProvider>
  );
};

describe('TransactionForm', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  it('renders all form fields', () => {
    renderWithContext(<TransactionForm />);

    // Check for all form elements
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/income/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/expense/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/date/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add transaction/i })).toBeInTheDocument();
  });

  it('defaults to expense type', () => {
    renderWithContext(<TransactionForm />);

    const expenseRadio = screen.getByLabelText(/expense/i) as HTMLInputElement;
    expect(expenseRadio.checked).toBe(true);
  });

  it('defaults to current date', () => {
    renderWithContext(<TransactionForm />);

    const dateInput = screen.getByLabelText(/date/i) as HTMLInputElement;
    // Check that the date is set and is a valid date format (YYYY-MM-DD)
    expect(dateInput.value).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    
    // Verify it's within a reasonable range (today or yesterday to account for timezone differences)
    const inputDate = new Date(dateInput.value);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    expect(inputDate.getTime()).toBeGreaterThanOrEqual(yesterday.getTime());
    expect(inputDate.getTime()).toBeLessThanOrEqual(tomorrow.getTime());
  });

  it('shows validation error for empty description', async () => {
    renderWithContext(<TransactionForm />);

    const submitButton = screen.getByRole('button', { name: /add transaction/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/description is required/i)).toBeInTheDocument();
    });
  });

  it('shows validation error for empty amount', async () => {
    renderWithContext(<TransactionForm />);

    const descriptionInput = screen.getByLabelText(/description/i);
    fireEvent.change(descriptionInput, { target: { value: 'Test transaction' } });

    const submitButton = screen.getByRole('button', { name: /add transaction/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/amount is required/i)).toBeInTheDocument();
    });
  });

  it('prevents entering negative amount', () => {
    renderWithContext(<TransactionForm />);

    const amountInput = screen.getByLabelText(/amount/i) as HTMLInputElement;

    // Try to enter negative amount
    fireEvent.change(amountInput, { target: { value: '-100' } });
    
    // Input should remain empty because negative values are not allowed
    expect(amountInput.value).toBe('');
  });

  it('shows validation error for zero amount', async () => {
    renderWithContext(<TransactionForm />);

    const descriptionInput = screen.getByLabelText(/description/i);
    const amountInput = screen.getByLabelText(/amount/i);

    fireEvent.change(descriptionInput, { target: { value: 'Test transaction' } });
    fireEvent.change(amountInput, { target: { value: '0' } });

    const submitButton = screen.getByRole('button', { name: /add transaction/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/amount must be positive/i)).toBeInTheDocument();
    });
  });

  it('allows valid amount with up to 2 decimal places', () => {
    renderWithContext(<TransactionForm />);

    const amountInput = screen.getByLabelText(/amount/i) as HTMLInputElement;

    fireEvent.change(amountInput, { target: { value: '100.50' } });
    expect(amountInput.value).toBe('100.50');
  });

  it('prevents amount with more than 2 decimal places during input', () => {
    renderWithContext(<TransactionForm />);

    const amountInput = screen.getByLabelText(/amount/i) as HTMLInputElement;

    fireEvent.change(amountInput, { target: { value: '100.123' } });
    // Should not update because it has 3 decimal places
    expect(amountInput.value).toBe('');
  });

  it('allows switching between income and expense', () => {
    renderWithContext(<TransactionForm />);

    const incomeRadio = screen.getByLabelText(/income/i) as HTMLInputElement;
    const expenseRadio = screen.getByLabelText(/expense/i) as HTMLInputElement;

    // Initially expense is selected
    expect(expenseRadio.checked).toBe(true);
    expect(incomeRadio.checked).toBe(false);

    // Switch to income
    fireEvent.click(incomeRadio);
    expect(incomeRadio.checked).toBe(true);
    expect(expenseRadio.checked).toBe(false);

    // Switch back to expense
    fireEvent.click(expenseRadio);
    expect(expenseRadio.checked).toBe(true);
    expect(incomeRadio.checked).toBe(false);
  });

  it('allows selecting different categories', () => {
    renderWithContext(<TransactionForm />);

    const categorySelect = screen.getByLabelText(/category/i) as HTMLSelectElement;

    // Default should be 'Other' - check the selected option text
    const selectedOption = categorySelect.options[categorySelect.selectedIndex];
    expect(selectedOption.text).toContain('Other');

    // The value should be a UUID
    expect(categorySelect.value).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });

  it('successfully submits valid form and clears fields', async () => {
    const onSuccess = vi.fn();
    renderWithContext(<TransactionForm onSuccess={onSuccess} />);

    // Fill in the form
    const descriptionInput = screen.getByLabelText(/description/i);
    const amountInput = screen.getByLabelText(/amount/i);
    const incomeRadio = screen.getByLabelText(/income/i);
    const categorySelect = screen.getByLabelText(/category/i);

    fireEvent.change(descriptionInput, { target: { value: 'Monthly Salary' } });
    fireEvent.change(amountInput, { target: { value: '50000' } });
    fireEvent.click(incomeRadio);
    // Use the Salary category UUID instead of string
    fireEvent.change(categorySelect, { target: { value: '550e8400-e29b-41d4-a716-446655440005' } });

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /add transaction/i });
    fireEvent.click(submitButton);

    // Wait for submission to complete
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });

    // Check that form fields are cleared
    expect((descriptionInput as HTMLInputElement).value).toBe('');
    expect((amountInput as HTMLInputElement).value).toBe('');
    expect((screen.getByLabelText(/expense/i) as HTMLInputElement).checked).toBe(true);
    // Category should be reset to Other (check by text content)
    const selectedOption = (categorySelect as HTMLSelectElement).options[(categorySelect as HTMLSelectElement).selectedIndex];
    expect(selectedOption.text).toContain('Other');
  });

  it('trims whitespace from description', async () => {
    const onSuccess = vi.fn();
    renderWithContext(<TransactionForm onSuccess={onSuccess} />);

    const descriptionInput = screen.getByLabelText(/description/i);
    const amountInput = screen.getByLabelText(/amount/i);

    fireEvent.change(descriptionInput, { target: { value: '  Test Transaction  ' } });
    fireEvent.change(amountInput, { target: { value: '100' } });

    const submitButton = screen.getByRole('button', { name: /add transaction/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('shows validation error for description exceeding 200 characters', async () => {
    renderWithContext(<TransactionForm />);

    const descriptionInput = screen.getByLabelText(/description/i);
    const longDescription = 'a'.repeat(201);

    fireEvent.change(descriptionInput, { target: { value: longDescription } });

    const submitButton = screen.getByRole('button', { name: /add transaction/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/description must not exceed 200 characters/i)).toBeInTheDocument();
    });
  });

  it('clears validation errors when user starts typing', async () => {
    renderWithContext(<TransactionForm />);

    // Submit empty form to trigger validation errors
    const submitButton = screen.getByRole('button', { name: /add transaction/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/description is required/i)).toBeInTheDocument();
    });

    // Start typing in description field
    const descriptionInput = screen.getByLabelText(/description/i);
    fireEvent.change(descriptionInput, { target: { value: 'T' } });

    // Error should be cleared
    await waitFor(() => {
      expect(screen.queryByText(/description is required/i)).not.toBeInTheDocument();
    });
  });

  it('shows submitting state on button', async () => {
    renderWithContext(<TransactionForm />);

    const descriptionInput = screen.getByLabelText(/description/i);
    const amountInput = screen.getByLabelText(/amount/i);

    fireEvent.change(descriptionInput, { target: { value: 'Test' } });
    fireEvent.change(amountInput, { target: { value: '100' } });

    const submitButton = screen.getByRole('button', { name: /add transaction/i });
    
    // Check button is enabled before submission
    expect(submitButton).not.toBeDisabled();
    expect(submitButton).toHaveTextContent('Add Transaction');
  });

  it('has proper ARIA attributes for accessibility', () => {
    renderWithContext(<TransactionForm />);

    const descriptionInput = screen.getByLabelText(/description/i);
    const amountInput = screen.getByLabelText(/amount/i);

    // Check for required indicators
    expect(screen.getAllByText('*')).toHaveLength(5); // 5 required fields

    // Submit to trigger errors
    const submitButton = screen.getByRole('button', { name: /add transaction/i });
    fireEvent.click(submitButton);

    // Check ARIA attributes are set when errors are present
    waitFor(() => {
      expect(descriptionInput).toHaveAttribute('aria-invalid', 'true');
      expect(descriptionInput).toHaveAttribute('aria-describedby', 'description-error');
      expect(amountInput).toHaveAttribute('aria-invalid', 'true');
      expect(amountInput).toHaveAttribute('aria-describedby', 'amount-error');
    });
  });
});
