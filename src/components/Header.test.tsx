import { describe, it, expect } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '../contexts';
import { Header } from './Header';

describe('Header', () => {
  it('renders the app title', () => {
    render(<MemoryRouter><ThemeProvider><Header /></ThemeProvider></MemoryRouter>);
    expect(screen.getAllByText(/RONIN|Budget Tracker/)[0]).toBeInTheDocument();
  });

  it('renders all navigation links on desktop', () => {
    render(<MemoryRouter><ThemeProvider><Header /></ThemeProvider></MemoryRouter>);
    expect(screen.getAllByText('Dashboard')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Transactions')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Budget Goals')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Settings')[0]).toBeInTheDocument();
  });

  it('highlights active route', () => {
    render(<MemoryRouter initialEntries={['/transactions']}><ThemeProvider><Header /></ThemeProvider></MemoryRouter>);
    const activeLink = screen.getAllByText('Transactions').find((link) => link.closest('a')?.className.includes('bg-white text-black'));
    expect(activeLink).toBeDefined();
  });

  it('toggles mobile menu when hamburger button is clicked', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><ThemeProvider><Header /></ThemeProvider></MemoryRouter>);
    await user.click(screen.getByLabelText('Toggle navigation menu'));
    expect(screen.getAllByText('Dashboard').length).toBeGreaterThan(1);
  });

  it('closes mobile menu when a link is clicked', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><ThemeProvider><Header /></ThemeProvider></MemoryRouter>);
    await user.click(screen.getByLabelText('Toggle navigation menu'));
    const dialog = screen.getByRole('dialog');
    const link = within(dialog).getByText('Transactions');
    await user.click(link);
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('does not render a theme toggle button in the fixed theme shell', () => {
    render(<MemoryRouter><ThemeProvider><Header /></ThemeProvider></MemoryRouter>);
    expect(screen.getAllByRole('button').some((button) => /switch to (dark|light) mode/i.test(button.getAttribute('aria-label') || ''))).toBe(false);
  });
});
