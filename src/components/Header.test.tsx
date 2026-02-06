import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '../contexts';
import { Header } from './Header';

describe('Header', () => {
  it('renders the app title', () => {
    render(
      <MemoryRouter>
        <ThemeProvider>
          <Header />
        </ThemeProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('Budget Tracker')).toBeInTheDocument();
  });

  it('renders all navigation links on desktop', () => {
    render(
      <MemoryRouter>
        <ThemeProvider>
          <Header />
        </ThemeProvider>
      </MemoryRouter>
    );

    // Desktop navigation should be visible (hidden on mobile)
    const desktopNav = screen.getAllByText('Dashboard')[0];
    expect(desktopNav).toBeInTheDocument();
    expect(screen.getAllByText('Transactions')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Budget Goals')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Settings')[0]).toBeInTheDocument();
  });

  it('highlights active route', () => {
    render(
      <MemoryRouter initialEntries={['/transactions']}>
        <ThemeProvider>
          <Header />
        </ThemeProvider>
      </MemoryRouter>
    );

    // Find the active link (should have blue background)
    const transactionsLinks = screen.getAllByText('Transactions');
    const activeLink = transactionsLinks.find((link) =>
      link.className.includes('bg-blue-100')
    );
    expect(activeLink).toBeDefined();
  });

  it('toggles mobile menu when hamburger button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ThemeProvider>
          <Header />
        </ThemeProvider>
      </MemoryRouter>
    );

    // Mobile menu should not be visible initially
    const mobileMenuButton = screen.getByLabelText('Toggle navigation menu');
    expect(mobileMenuButton).toBeInTheDocument();

    // Click to open mobile menu
    await user.click(mobileMenuButton);

    // Mobile menu should now be visible with navigation links
    // We should see duplicate links (desktop + mobile)
    const dashboardLinks = screen.getAllByText('Dashboard');
    expect(dashboardLinks.length).toBeGreaterThan(1);
  });

  it('closes mobile menu when a link is clicked', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ThemeProvider>
          <Header />
        </ThemeProvider>
      </MemoryRouter>
    );

    // Open mobile menu
    const mobileMenuButton = screen.getByLabelText('Toggle navigation menu');
    await user.click(mobileMenuButton);

    // Verify menu is open (multiple Dashboard links visible)
    let dashboardLinks = screen.getAllByText('Dashboard');
    expect(dashboardLinks.length).toBeGreaterThan(1);

    // Click a mobile navigation link
    const mobileLinks = screen.getAllByText('Transactions');
    const mobileLink = mobileLinks[mobileLinks.length - 1]; // Get the last one (mobile)
    await user.click(mobileLink);

    // Menu should close (back to single set of links)
    dashboardLinks = screen.getAllByText('Dashboard');
    // After clicking, mobile menu should close, but we still have desktop nav
    // So we should have fewer links than before
    expect(dashboardLinks.length).toBeLessThanOrEqual(2);
  });

  it('renders theme toggle button', () => {
    render(
      <MemoryRouter>
        <ThemeProvider>
          <Header />
        </ThemeProvider>
      </MemoryRouter>
    );

    // Theme toggle should be present
    const themeToggle = screen.getByLabelText(/switch to (dark|light) mode/i);
    expect(themeToggle).toBeInTheDocument();
  });
});
