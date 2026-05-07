import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '../test/testUtils';
import { AddTransactionButton } from './AddTransactionButton';

describe('AddTransactionButton', () => {
  it('renders the floating action button', () => {
    render(<AddTransactionButton />);
    expect(screen.getByRole('button', { name: /add new transaction/i })).toBeInTheDocument();
  });

  it('has proper ARIA label for accessibility', () => {
    render(<AddTransactionButton />);
    expect(screen.getByRole('button', { name: /add new transaction/i })).toHaveAttribute('aria-label', 'Add new transaction');
  });

  it('opens modal when clicked', () => {
    render(<AddTransactionButton />);
    fireEvent.click(screen.getByRole('button', { name: /add new transaction/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('opens modal when Enter key is pressed', () => {
    render(<AddTransactionButton />);
    fireEvent.keyDown(screen.getByRole('button', { name: /add new transaction/i }), { key: 'Enter' });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('opens modal when Space key is pressed', () => {
    render(<AddTransactionButton />);
    fireEvent.keyDown(screen.getByRole('button', { name: /add new transaction/i }), { key: ' ' });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('closes modal when close button is clicked', () => {
    render(<AddTransactionButton />);
    fireEvent.click(screen.getByRole('button', { name: /add new transaction/i }));
    fireEvent.click(screen.getByRole('button', { name: /close modal/i }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('uses centered mobile positioning and desktop corner positioning', () => {
    render(<AddTransactionButton />);
    const button = screen.getByRole('button', { name: /add new transaction/i });
    expect(button.className).toContain('left-1/2');
    expect(button.className).toContain('sm:right-6');
  });

  it('has focus and motion classes', () => {
    render(<AddTransactionButton />);
    const button = screen.getByRole('button', { name: /add new transaction/i });
    expect(button.className).toContain('focus:ring-2');
    expect(button.className).toContain('active:scale-95');
  });

  it('contains a plus icon', () => {
    render(<AddTransactionButton />);
    const svg = screen.getByRole('button', { name: /add new transaction/i }).querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });
});
