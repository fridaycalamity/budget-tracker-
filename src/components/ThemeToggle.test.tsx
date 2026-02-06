import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeToggle } from './ThemeToggle';
import { ThemeProvider } from '../contexts';

describe('ThemeToggle', () => {
  it('renders toggle button with correct ARIA label for light theme', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    const button = screen.getByRole('button', { name: /switch to dark mode/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-pressed', 'false');
  });

  it('shows moon icon when in light theme', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    const button = screen.getByRole('button');
    // Moon icon has a specific path for dark mode
    const svg = button.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('toggles theme when clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    const button = screen.getByRole('button', { name: /switch to dark mode/i });
    
    // Click to toggle to dark mode
    await user.click(button);
    
    // After toggle, button should now say "Switch to light mode"
    expect(screen.getByRole('button', { name: /switch to light mode/i })).toBeInTheDocument();
  });

  it('updates aria-pressed attribute when theme changes', async () => {
    const user = userEvent.setup();
    
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    const button = screen.getByRole('button');
    
    // Initially in light mode
    expect(button).toHaveAttribute('aria-pressed', 'false');
    
    // Click to toggle to dark mode
    await user.click(button);
    
    // Should now be pressed (dark mode)
    expect(button).toHaveAttribute('aria-pressed', 'true');
  });

  it('has proper button type attribute', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('type', 'button');
  });

  it('has focus ring styles for accessibility', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    const button = screen.getByRole('button');
    // Check that focus styles are present in className
    expect(button.className).toContain('focus:ring');
  });
});
