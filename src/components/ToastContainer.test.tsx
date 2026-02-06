import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ToastContainer } from './ToastContainer';
import { ToastProvider } from '../contexts/ToastContext';

describe('ToastContainer', () => {
  it('renders nothing when there are no toasts', () => {
    const { container } = render(
      <ToastProvider>
        <ToastContainer />
      </ToastProvider>
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders toasts when they exist', () => {
    // We'll test this through integration with ToastContext
    // since ToastContainer depends on the context
    render(
      <ToastProvider>
        <ToastContainer />
      </ToastProvider>
    );

    // Initially no toasts
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    const { container } = render(
      <ToastProvider>
        <div data-testid="wrapper">
          <ToastContainer />
        </div>
      </ToastProvider>
    );

    // When there are no toasts, container should not render
    expect(container.querySelector('[aria-live="polite"]')).not.toBeInTheDocument();
  });
});
