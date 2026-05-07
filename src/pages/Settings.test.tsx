import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '../test/testUtils';
import userEvent from '@testing-library/user-event';
import { Settings } from './Settings';

function renderSettings() {
  return render(<Settings />);
}

describe('Settings', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should render settings page with title and description', () => {
    renderSettings();
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Manage source accounts, categories, and sync controls for the ledger.')).toBeInTheDocument();
  });

  it('should render sync & data management section', () => {
    renderSettings();
    expect(screen.getByText('Sync & Data')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry sync/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /refresh from server/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /clear local cache/i })).toBeInTheDocument();
  });

  it('should show retry sync button as enabled by default', () => {
    renderSettings();
    expect(screen.getByRole('button', { name: /retry sync/i })).not.toBeDisabled();
  });

  it('should prompt for confirmation when refreshing from server', async () => {
    const user = userEvent.setup();
    const mockConfirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    renderSettings();
    await user.click(screen.getByRole('button', { name: /refresh from server/i }));
    expect(mockConfirm).toHaveBeenCalled();
    mockConfirm.mockRestore();
  });

  it('should prompt for confirmation when clearing local cache', async () => {
    const user = userEvent.setup();
    const mockConfirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    renderSettings();
    await user.click(screen.getByRole('button', { name: /clear local cache/i }));
    expect(mockConfirm).toHaveBeenCalled();
    mockConfirm.mockRestore();
  });
});
