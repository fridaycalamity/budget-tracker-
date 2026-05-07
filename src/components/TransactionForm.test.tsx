import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../test/testUtils';
import { TransactionForm } from './TransactionForm';

describe('TransactionForm', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders all form fields', () => {
    render(<TransactionForm />);
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/income/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/expense/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/date/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add transaction/i })).toBeInTheDocument();
  });

  it('defaults to expense type', () => {
    render(<TransactionForm />);
    expect((screen.getByLabelText(/expense/i) as HTMLInputElement).checked).toBe(true);
  });

  it('defaults to current date', () => {
    render(<TransactionForm />);
    const dateInput = screen.getByLabelText(/date/i) as HTMLInputElement;
    expect(dateInput.value).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('shows validation error for empty description', async () => {
    render(<TransactionForm />);
    fireEvent.click(screen.getByRole('button', { name: /add transaction/i }));
    await waitFor(() => expect(screen.getByText(/description is required/i)).toBeInTheDocument());
  });

  it('shows validation error for empty amount', async () => {
    render(<TransactionForm />);
    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: 'Test transaction' } });
    fireEvent.click(screen.getByRole('button', { name: /add transaction/i }));
    await waitFor(() => expect(screen.getByText(/amount is required/i)).toBeInTheDocument());
  });

  it('prevents entering negative amount', () => {
    render(<TransactionForm />);
    const amountInput = screen.getByLabelText(/amount/i) as HTMLInputElement;
    fireEvent.change(amountInput, { target: { value: '-100' } });
    expect(amountInput.value).toBe('');
  });

  it('shows validation error for zero amount', async () => {
    render(<TransactionForm />);
    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: 'Test transaction' } });
    fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: '0' } });
    fireEvent.click(screen.getByRole('button', { name: /add transaction/i }));
    await waitFor(() => expect(screen.getByText(/amount must be positive/i)).toBeInTheDocument());
  });

  it('allows valid amount with up to 2 decimal places', () => {
    render(<TransactionForm />);
    const amountInput = screen.getByLabelText(/amount/i) as HTMLInputElement;
    fireEvent.change(amountInput, { target: { value: '100.50' } });
    expect(amountInput.value).toBe('100.50');
  });

  it('prevents amount with more than 2 decimal places during input', () => {
    render(<TransactionForm />);
    const amountInput = screen.getByLabelText(/amount/i) as HTMLInputElement;
    fireEvent.change(amountInput, { target: { value: '100.123' } });
    expect(amountInput.value).toBe('');
  });

  it('allows switching between income and expense', () => {
    render(<TransactionForm />);
    const incomeRadio = screen.getByLabelText(/income/i) as HTMLInputElement;
    const expenseRadio = screen.getByLabelText(/expense/i) as HTMLInputElement;
    expect(expenseRadio.checked).toBe(true);
    fireEvent.click(incomeRadio);
    expect(incomeRadio.checked).toBe(true);
    fireEvent.click(expenseRadio);
    expect(expenseRadio.checked).toBe(true);
  });

  it('allows selecting different categories', () => {
    render(<TransactionForm />);
    const categorySelect = screen.getByLabelText(/category/i) as HTMLSelectElement;
    const selectedOption = categorySelect.options[categorySelect.selectedIndex];
    expect(selectedOption.text).toContain('Other');
  });

  it('successfully submits valid form and clears fields', async () => {
    const onSuccess = vi.fn();
    render(<TransactionForm onSuccess={onSuccess} />);
    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: 'Monthly Salary' } });
    fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: '50000' } });
    fireEvent.click(screen.getByLabelText(/income/i));
    fireEvent.click(screen.getByRole('button', { name: /add transaction/i }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    expect((screen.getByLabelText(/description/i) as HTMLInputElement).value).toBe('');
  });

  it('trims whitespace from description', async () => {
    const onSuccess = vi.fn();
    render(<TransactionForm onSuccess={onSuccess} />);
    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: '  Test Transaction  ' } });
    fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: '100' } });
    fireEvent.click(screen.getByRole('button', { name: /add transaction/i }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
  });

  it('shows validation error for description exceeding 200 characters', async () => {
    render(<TransactionForm />);
    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: 'a'.repeat(201) } });
    fireEvent.click(screen.getByRole('button', { name: /add transaction/i }));
    await waitFor(() => expect(screen.getByText(/description must not exceed 200 characters/i)).toBeInTheDocument());
  });

  it('clears validation errors when user starts typing', async () => {
    render(<TransactionForm />);
    fireEvent.click(screen.getByRole('button', { name: /add transaction/i }));
    await waitFor(() => expect(screen.getByText(/description is required/i)).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: 'T' } });
    await waitFor(() => expect(screen.queryByText(/description is required/i)).not.toBeInTheDocument());
  });

  it('shows submitting state on button', () => {
    render(<TransactionForm />);
    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: 'Test' } });
    fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: '100' } });
    const submitButton = screen.getByRole('button', { name: /add transaction/i });
    expect(submitButton).not.toBeDisabled();
    expect(submitButton).toHaveTextContent('Add Transaction');
  });

  it('has proper ARIA attributes for accessibility', async () => {
    render(<TransactionForm />);
    const descriptionInput = screen.getByLabelText(/description/i);
    const amountInput = screen.getByLabelText(/amount/i);
    expect(screen.getAllByText('*')).toHaveLength(4);
    fireEvent.click(screen.getByRole('button', { name: /add transaction/i }));
    await waitFor(() => {
      expect(descriptionInput).toHaveAttribute('aria-invalid', 'true');
      expect(descriptionInput).toHaveAttribute('aria-describedby', 'description-error');
      expect(amountInput).toHaveAttribute('aria-invalid', 'true');
      expect(amountInput).toHaveAttribute('aria-describedby', 'amount-error');
    });
  });
});
