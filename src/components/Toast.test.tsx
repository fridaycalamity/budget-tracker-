import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Toast } from './Toast';
import type { Toast as ToastType } from '../types';

describe('Toast', () => {
  const mockOnRemove = vi.fn();

  beforeEach(() => {
    mockOnRemove.mockClear();
  });

  it('renders success toast with correct styling', () => {
    const toast: ToastType = {
      id: '1',
      message: 'Transaction added successfully!',
      type: 'success',
    };

    render(<Toast toast={toast} onRemove={mockOnRemove} />);

    expect(screen.getByText('Transaction added successfully!')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveClass('bg-green-500');
    expect(screen.getByText('✓')).toBeInTheDocument();
  });

  it('renders error toast with correct styling', () => {
    const toast: ToastType = {
      id: '2',
      message: 'Validation failed',
      type: 'error',
    };

    render(<Toast toast={toast} onRemove={mockOnRemove} />);

    expect(screen.getByText('Validation failed')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveClass('bg-red-500');
    expect(screen.getByText('✕')).toBeInTheDocument();
  });

  it('calls onRemove when close button is clicked', async () => {
    const user = userEvent.setup();
    const toast: ToastType = {
      id: '3',
      message: 'Test message',
      type: 'success',
    };

    render(<Toast toast={toast} onRemove={mockOnRemove} />);

    const closeButton = screen.getByLabelText('Close notification');
    await user.click(closeButton);

    // Wait for animation to complete
    await waitFor(
      () => {
        expect(mockOnRemove).toHaveBeenCalledWith('3');
      },
      { timeout: 500 }
    );
  });

  it('has proper accessibility attributes', () => {
    const toast: ToastType = {
      id: '4',
      message: 'Accessible toast',
      type: 'success',
    };

    render(<Toast toast={toast} onRemove={mockOnRemove} />);

    const alert = screen.getByRole('alert');
    expect(alert).toHaveAttribute('aria-live', 'polite');

    const closeButton = screen.getByLabelText('Close notification');
    expect(closeButton).toBeInTheDocument();
  });

  it('applies enter animation on mount', async () => {
    const toast: ToastType = {
      id: '5',
      message: 'Animated toast',
      type: 'success',
    };

    render(<Toast toast={toast} onRemove={mockOnRemove} />);

    const alert = screen.getByRole('alert');

    // Wait for animation to apply
    await waitFor(() => {
      expect(alert).toHaveClass('opacity-100', 'translate-x-0');
    });
  });
});
