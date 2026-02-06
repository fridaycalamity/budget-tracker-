import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FilterBar } from './FilterBar';
import { CategoryProvider } from '../contexts';
import type { TransactionFilters } from '../types';

// Helper to render with CategoryProvider
const renderWithProvider = (ui: React.ReactElement) => {
  return render(<CategoryProvider>{ui}</CategoryProvider>);
};

describe('FilterBar', () => {
  const defaultFilters: TransactionFilters = {
    type: 'all',
    category: 'all',
    dateRange: {
      start: null,
      end: null,
    },
  };

  it('renders all filter controls', () => {
    const onFiltersChange = vi.fn();
    renderWithProvider(<FilterBar filters={defaultFilters} onFiltersChange={onFiltersChange} />);

    // Check for filter labels
    expect(screen.getByText('Filters')).toBeInTheDocument();
    expect(screen.getByLabelText('Filter by transaction type')).toBeInTheDocument();
    expect(screen.getByLabelText('Filter by category')).toBeInTheDocument();
    expect(screen.getByLabelText('Filter by start date')).toBeInTheDocument();
    expect(screen.getByLabelText('Filter by end date')).toBeInTheDocument();
  });

  it('displays current filter values', () => {
    // Use a UUID for the category (Salary category ID)
    const filters: TransactionFilters = {
      type: 'income',
      category: '550e8400-e29b-41d4-a716-446655440005', // Salary category ID
      dateRange: {
        start: '2024-01-01',
        end: '2024-01-31',
      },
    };
    const onFiltersChange = vi.fn();
    renderWithProvider(<FilterBar filters={filters} onFiltersChange={onFiltersChange} />);

    // Check that values are displayed
    expect(screen.getByLabelText('Filter by transaction type')).toHaveValue('income');
    expect(screen.getByLabelText('Filter by category')).toHaveValue('550e8400-e29b-41d4-a716-446655440005');
    expect(screen.getByLabelText('Filter by start date')).toHaveValue('2024-01-01');
    expect(screen.getByLabelText('Filter by end date')).toHaveValue('2024-01-31');
  });

  it('calls onFiltersChange when type filter changes', async () => {
    const user = userEvent.setup();
    const onFiltersChange = vi.fn();
    renderWithProvider(<FilterBar filters={defaultFilters} onFiltersChange={onFiltersChange} />);

    const typeSelect = screen.getByLabelText('Filter by transaction type');
    await user.selectOptions(typeSelect, 'income');

    expect(onFiltersChange).toHaveBeenCalledWith({
      ...defaultFilters,
      type: 'income',
    });
  });

  it('calls onFiltersChange when category filter changes', async () => {
    const user = userEvent.setup();
    const onFiltersChange = vi.fn();
    renderWithProvider(<FilterBar filters={defaultFilters} onFiltersChange={onFiltersChange} />);

    const categorySelect = screen.getByLabelText('Filter by category');
    // Get the Food category option (first non-"all" option with Food in text)
    const foodOption = Array.from(categorySelect.querySelectorAll('option')).find(
      (opt) => opt.textContent?.includes('Food')
    );
    
    await user.selectOptions(categorySelect, foodOption!.value);

    expect(onFiltersChange).toHaveBeenCalledWith({
      ...defaultFilters,
      category: foodOption!.value,
    });
  });

  it('calls onFiltersChange when start date changes', async () => {
    const user = userEvent.setup();
    const onFiltersChange = vi.fn();
    renderWithProvider(<FilterBar filters={defaultFilters} onFiltersChange={onFiltersChange} />);

    const startDateInput = screen.getByLabelText('Filter by start date');
    await user.type(startDateInput, '2024-01-01');

    expect(onFiltersChange).toHaveBeenCalledWith({
      ...defaultFilters,
      dateRange: {
        start: '2024-01-01',
        end: null,
      },
    });
  });

  it('calls onFiltersChange when end date changes', async () => {
    const user = userEvent.setup();
    const onFiltersChange = vi.fn();
    renderWithProvider(<FilterBar filters={defaultFilters} onFiltersChange={onFiltersChange} />);

    const endDateInput = screen.getByLabelText('Filter by end date');
    await user.type(endDateInput, '2024-01-31');

    expect(onFiltersChange).toHaveBeenCalledWith({
      ...defaultFilters,
      dateRange: {
        start: null,
        end: '2024-01-31',
      },
    });
  });

  it('shows "Clear All" button when filters are active', () => {
    const filters: TransactionFilters = {
      type: 'income',
      category: 'all',
      dateRange: {
        start: null,
        end: null,
      },
    };
    const onFiltersChange = vi.fn();
    renderWithProvider(<FilterBar filters={filters} onFiltersChange={onFiltersChange} />);

    expect(screen.getByText('Clear All')).toBeInTheDocument();
  });

  it('does not show "Clear All" button when no filters are active', () => {
    const onFiltersChange = vi.fn();
    renderWithProvider(<FilterBar filters={defaultFilters} onFiltersChange={onFiltersChange} />);

    expect(screen.queryByText('Clear All')).not.toBeInTheDocument();
  });

  it('clears all filters when "Clear All" is clicked', async () => {
    const user = userEvent.setup();
    const filters: TransactionFilters = {
      type: 'expense',
      category: 'Food',
      dateRange: {
        start: '2024-01-01',
        end: '2024-01-31',
      },
    };
    const onFiltersChange = vi.fn();
    renderWithProvider(<FilterBar filters={filters} onFiltersChange={onFiltersChange} />);

    const clearButton = screen.getByText('Clear All');
    await user.click(clearButton);

    expect(onFiltersChange).toHaveBeenCalledWith({
      type: 'all',
      category: 'all',
      dateRange: {
        start: null,
        end: null,
      },
    });
  });

  it('includes all transaction categories in category dropdown', () => {
    const onFiltersChange = vi.fn();
    renderWithProvider(<FilterBar filters={defaultFilters} onFiltersChange={onFiltersChange} />);

    const categorySelect = screen.getByLabelText('Filter by category');
    const optionTexts = Array.from(categorySelect.querySelectorAll('option')).map(
      (option) => option.textContent || ''
    );

    // Check that all category names appear in the dropdown (with icons)
    expect(optionTexts.some(text => text.includes('All Categories'))).toBe(true);
    expect(optionTexts.some(text => text.includes('Food'))).toBe(true);
    expect(optionTexts.some(text => text.includes('Transport'))).toBe(true);
    expect(optionTexts.some(text => text.includes('Bills'))).toBe(true);
    expect(optionTexts.some(text => text.includes('Entertainment'))).toBe(true);
    expect(optionTexts.some(text => text.includes('Salary'))).toBe(true);
    expect(optionTexts.some(text => text.includes('Freelance'))).toBe(true);
    expect(optionTexts.some(text => text.includes('Shopping'))).toBe(true);
    expect(optionTexts.some(text => text.includes('Healthcare'))).toBe(true);
    expect(optionTexts.some(text => text.includes('Education'))).toBe(true);
    expect(optionTexts.some(text => text.includes('Other'))).toBe(true);
  });

  it('includes all type options in type dropdown', () => {
    const onFiltersChange = vi.fn();
    renderWithProvider(<FilterBar filters={defaultFilters} onFiltersChange={onFiltersChange} />);

    const typeSelect = screen.getByLabelText('Filter by transaction type');
    const options = Array.from(typeSelect.querySelectorAll('option')).map(
      (option) => option.value
    );

    expect(options).toEqual(['all', 'income', 'expense']);
  });

  it('handles clearing date inputs', async () => {
    const user = userEvent.setup();
    const filters: TransactionFilters = {
      type: 'all',
      category: 'all',
      dateRange: {
        start: '2024-01-01',
        end: '2024-01-31',
      },
    };
    const onFiltersChange = vi.fn();
    renderWithProvider(<FilterBar filters={filters} onFiltersChange={onFiltersChange} />);

    const startDateInput = screen.getByLabelText('Filter by start date');
    await user.clear(startDateInput);

    expect(onFiltersChange).toHaveBeenCalledWith({
      ...filters,
      dateRange: {
        start: null,
        end: '2024-01-31',
      },
    });
  });
});
