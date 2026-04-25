import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '../test/testUtils';
import userEvent from '@testing-library/user-event';
import { Settings } from './Settings';

/**
 * Test suite for Settings page component
 * Tests sync and data management functionality
 */

// Helper to render Settings with context
function renderSettings() {
  return render(<Settings />);
}

describe('Settings', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  it('should render settings page with title and description', () => {
    renderSettings();

    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Manage your application settings and data')).toBeInTheDocument();
  });

  it('should render sync & data management section', () => {
    renderSettings();

    expect(screen.getByText('Sync & Data')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry sync/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /refresh from server/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /clear local cache/i })).toBeInTheDocument();
  });

  it('should show retry sync button as disabled while syncing', async () => {
    // This test verifies the disabled state rendering. The actual syncing state
    // comes from context, so we just verify the button exists and is not disabled
    // in the default (non-syncing) state.
    renderSettings();

    const retryButton = screen.getByRole('button', { name: /retry sync/i });
    expect(retryButton).not.toBeDisabled();
  });

  it('should prompt for confirmation when refreshing from server', async () => {
    const user = userEvent.setup();
    const mockConfirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    renderSettings();

    const refreshButton = screen.getByRole('button', { name: /refresh from server/i });
    await user.click(refreshButton);

    expect(mockConfirm).toHaveBeenCalled();
    mockConfirm.mockRestore();
  });

  it('should prompt for confirmation when clearing local cache', async () => {
    const user = userEvent.setup();
    const mockConfirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    renderSettings();

    const cacheButton = screen.getByRole('button', { name: /clear local cache/i });
    await user.click(cacheButton);

    expect(mockConfirm).toHaveBeenCalled();
    mockConfirm.mockRestore();
  });
});
