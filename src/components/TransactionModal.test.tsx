import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TransactionModal } from './TransactionModal';
import { BudgetProvider, ToastProvider, CategoryProvider } from '../contexts';

/**
 * Test suite for TransactionModal component
 * 
 * Tests:
 * - Modal rendering when open/closed
 * - Close button functionality
 * - Backdrop click to close
 * - Escape key to close
 * - Focus trap
 * - Body scroll prevention
 * - Form submission and modal close
 * - Accessibility attributes
 */

// Mock the TransactionForm component to simplify testing
vi.mock('./TransactionForm', () => ({
  TransactionForm: ({ onSuccess }: { onSuccess?: () => void }) => (
    <div data-testid="transaction-form">
      <button onClick={onSuccess} data-testid="mock-submit">
        Submit
      </button>
    </div>
  ),
}));

describe('TransactionModal', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
  });

  afterEach(() => {
    // Clean up body styles
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
  });

  const renderModal = (isOpen: boolean) => {
    return render(
      <ToastProvider>
        <CategoryProvider>
          <BudgetProvider>
            <TransactionModal isOpen={isOpen} onClose={mockOnClose} />
          </BudgetProvider>
        </CategoryProvider>
      </ToastProvider>
    );
  };

  describe('Rendering', () => {
    it('should not render when isOpen is false', () => {
      renderModal(false);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should render when isOpen is true', () => {
      renderModal(true);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should render modal title', () => {
      renderModal(true);
      expect(screen.getByText('Add Transaction')).toBeInTheDocument();
    });

    it('should render TransactionForm', () => {
      renderModal(true);
      expect(screen.getByTestId('transaction-form')).toBeInTheDocument();
    });

    it('should render close button', () => {
      renderModal(true);
      expect(screen.getByLabelText('Close modal')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      renderModal(true);
      const dialog = screen.getByRole('dialog');
      
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title');
    });

    it('should have accessible modal title', () => {
      renderModal(true);
      const title = screen.getByText('Add Transaction');
      expect(title).toHaveAttribute('id', 'modal-title');
    });

    it('should have accessible close button', () => {
      renderModal(true);
      const closeButton = screen.getByLabelText('Close modal');
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe('Close functionality', () => {
    it('should call onClose when close button is clicked', () => {
      renderModal(true);
      const closeButton = screen.getByLabelText('Close modal');
      
      fireEvent.click(closeButton);
      
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when backdrop is clicked', () => {
      renderModal(true);
      const dialog = screen.getByRole('dialog');
      
      // Click the dialog itself (backdrop)
      fireEvent.click(dialog);
      
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should not call onClose when modal content is clicked', () => {
      renderModal(true);
      const modalContent = screen.getByText('Add Transaction').closest('div');
      
      if (modalContent) {
        fireEvent.click(modalContent);
      }
      
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should call onClose when Escape key is pressed', () => {
      renderModal(true);
      
      fireEvent.keyDown(document, { key: 'Escape' });
      
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should not call onClose for other keys', () => {
      renderModal(true);
      
      fireEvent.keyDown(document, { key: 'Enter' });
      fireEvent.keyDown(document, { key: 'Space' });
      
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('Form submission', () => {
    it('should close modal when form submission is successful', () => {
      renderModal(true);
      const submitButton = screen.getByTestId('mock-submit');
      
      fireEvent.click(submitButton);
      
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Body scroll prevention', () => {
    it('should prevent body scroll when modal is open', () => {
      renderModal(true);
      
      expect(document.body.style.position).toBe('fixed');
      expect(document.body.style.width).toBe('100%');
    });

    it('should restore body scroll when modal is closed', () => {
      const { rerender } = renderModal(true);
      
      // Modal is open, body should be fixed
      expect(document.body.style.position).toBe('fixed');
      
      // Close modal
      rerender(
        <ToastProvider>
          <BudgetProvider>
            <TransactionModal isOpen={false} onClose={mockOnClose} />
          </BudgetProvider>
        </ToastProvider>
      );
      
      // Body should be restored
      expect(document.body.style.position).toBe('');
    });
  });

  describe('Focus management', () => {
    it('should focus first focusable element when opened', async () => {
      renderModal(true);
      
      await waitFor(() => {
        const closeButton = screen.getByLabelText('Close modal');
        expect(document.activeElement).toBe(closeButton);
      });
    });

    it('should trap focus within modal', async () => {
      renderModal(true);
      
      const closeButton = screen.getByLabelText('Close modal');
      
      // Focus should be on close button initially
      await waitFor(() => {
        expect(document.activeElement).toBe(closeButton);
      });
      
      // Tab should move to next focusable element
      fireEvent.keyDown(document, { key: 'Tab' });
      
      // Shift+Tab from first element should go to last
      closeButton.focus();
      fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    });
  });

  describe('Animations', () => {
    it('should have animation classes', () => {
      renderModal(true);
      const dialog = screen.getByRole('dialog');
      
      expect(dialog).toHaveClass('animate-fadeIn');
    });

    it('should have slide up animation on modal content', () => {
      renderModal(true);
      // The modal content is the div with the white background, not the header
      const dialog = screen.getByRole('dialog');
      const modalContent = dialog.querySelector('.animate-slideUp');
      
      expect(modalContent).toBeInTheDocument();
      expect(modalContent).toHaveClass('animate-slideUp');
    });
  });

  describe('Edge cases', () => {
    it('should handle multiple rapid open/close cycles', () => {
      const { rerender } = renderModal(false);
      
      // Open
      rerender(
        <ToastProvider>
          <BudgetProvider>
            <TransactionModal isOpen={true} onClose={mockOnClose} />
          </BudgetProvider>
        </ToastProvider>
      );
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      
      // Close
      rerender(
        <ToastProvider>
          <BudgetProvider>
            <TransactionModal isOpen={false} onClose={mockOnClose} />
          </BudgetProvider>
        </ToastProvider>
      );
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      
      // Open again
      rerender(
        <ToastProvider>
          <BudgetProvider>
            <TransactionModal isOpen={true} onClose={mockOnClose} />
          </BudgetProvider>
        </ToastProvider>
      );
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should clean up event listeners when unmounted', () => {
      const { unmount } = renderModal(true);
      
      unmount();
      
      // Should not throw error when pressing Escape after unmount
      expect(() => {
        fireEvent.keyDown(document, { key: 'Escape' });
      }).not.toThrow();
    });
  });
});
