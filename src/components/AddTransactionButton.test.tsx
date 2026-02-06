import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AddTransactionButton } from './AddTransactionButton';
import { BudgetProvider } from '../contexts/BudgetContext';
import { ToastProvider } from '../contexts/ToastContext';
import { ThemeProvider } from '../contexts/ThemeContext';

// Wrapper component with required providers
function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <BudgetProvider>{children}</BudgetProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

describe('AddTransactionButton', () => {
  it('renders the floating action button', () => {
    render(
      <TestWrapper>
        <AddTransactionButton />
      </TestWrapper>
    );

    const button = screen.getByRole('button', { name: /add new transaction/i });
    expect(button).toBeInTheDocument();
  });

  it('has proper ARIA label for accessibility', () => {
    render(
      <TestWrapper>
        <AddTransactionButton />
      </TestWrapper>
    );

    const button = screen.getByRole('button', { name: /add new transaction/i });
    expect(button).toHaveAttribute('aria-label', 'Add new transaction');
  });

  it('opens modal when clicked', () => {
    render(
      <TestWrapper>
        <AddTransactionButton />
      </TestWrapper>
    );

    const button = screen.getByRole('button', { name: /add new transaction/i });
    fireEvent.click(button);

    // Check if modal is opened by looking for modal dialog
    const modal = screen.getByRole('dialog');
    expect(modal).toBeInTheDocument();
    expect(modal).toHaveAttribute('aria-modal', 'true');
  });

  it('opens modal when Enter key is pressed', () => {
    render(
      <TestWrapper>
        <AddTransactionButton />
      </TestWrapper>
    );

    const button = screen.getByRole('button', { name: /add new transaction/i });
    fireEvent.keyDown(button, { key: 'Enter' });

    // Check if modal is opened
    const modal = screen.getByRole('dialog');
    expect(modal).toBeInTheDocument();
  });

  it('opens modal when Space key is pressed', () => {
    render(
      <TestWrapper>
        <AddTransactionButton />
      </TestWrapper>
    );

    const button = screen.getByRole('button', { name: /add new transaction/i });
    fireEvent.keyDown(button, { key: ' ' });

    // Check if modal is opened
    const modal = screen.getByRole('dialog');
    expect(modal).toBeInTheDocument();
  });

  it('closes modal when close button is clicked', () => {
    render(
      <TestWrapper>
        <AddTransactionButton />
      </TestWrapper>
    );

    // Open modal
    const button = screen.getByRole('button', { name: /add new transaction/i });
    fireEvent.click(button);

    // Verify modal is open
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Close modal
    const closeButton = screen.getByRole('button', { name: /close modal/i });
    fireEvent.click(closeButton);

    // Verify modal is closed
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('has fixed positioning classes', () => {
    render(
      <TestWrapper>
        <AddTransactionButton />
      </TestWrapper>
    );

    const button = screen.getByRole('button', { name: /add new transaction/i });
    expect(button).toHaveClass('fixed', 'bottom-6', 'right-6');
  });

  it('has hover and focus styles', () => {
    render(
      <TestWrapper>
        <AddTransactionButton />
      </TestWrapper>
    );

    const button = screen.getByRole('button', { name: /add new transaction/i });
    expect(button).toHaveClass('hover:bg-blue-700', 'focus:ring-4');
  });

  it('has animation classes for smooth transitions', () => {
    render(
      <TestWrapper>
        <AddTransactionButton />
      </TestWrapper>
    );

    const button = screen.getByRole('button', { name: /add new transaction/i });
    expect(button).toHaveClass('transition-all', 'hover:scale-110', 'active:scale-95');
  });

  it('contains a plus icon', () => {
    render(
      <TestWrapper>
        <AddTransactionButton />
      </TestWrapper>
    );

    const button = screen.getByRole('button', { name: /add new transaction/i });
    const svg = button.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });
});
