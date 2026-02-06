import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FilterBar } from './FilterBar';
import type { TransactionFilters } from '../types';

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
    render(<FilterBar filters={defaultFilters} onFiltersChange={onFiltersChange} />);

    // Check for filter labels
    expect(screen.getByText('Filters')).toBeInTheDocument();
    expect(screen.getByLabelText('Filter by transaction type')).toBeInTheDocument();
    expect(screen.getByLabelText('Filter by category')).toBeInTheDocument();
    expect(screen.getByLabelText('Filter by start date')).toBeInTheDocument();
    expect(screen.getByLabelText('Filter by end date')).toBeInTheDocument();
  });

  it('displays current filter values', () => {
    const filters: TransactionFilters = {
      type: 'income',
      category: 'Salary',
      dateRange: {
        start: '2024-01-01',
        end: '2024-01-31',
      },
    };
    const onFiltersChange = vi.fn();
    render(<FilterBar filters={filters} onFiltersChange={onFiltersChange} />);

    // Check that values are displayed
    expect(screen.getByLabelText('Filter by transaction type')).toHaveValue('income');
    expect(screen.getByLabelText('Filter by category')).toHaveValue('Salary');
    expect(screen.getByLabelText('Filter by start date')).toHaveValue('2024-01-01');
    expect(screen.getByLabelText('Filter by end date')).toHaveValue('2024-01-31');
  });

  it('calls onFiltersChange when type filter changes', async () => {
    const user = userEvent.setup();
    const onFiltersChange = vi.fn();
    render(<FilterBar filters={defaultFilters} onFiltersChange={onFiltersChange} />);

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
    render(<FilterBar filters={defaultFilters} onFiltersChange={onFiltersChange} />);

    const categorySelect = screen.getByLabelText('Filter by category');
    await user.selectOptions(categorySelect, 'Food');

    expect(onFiltersChange).toHaveBeenCalledWith({
      ...defaultFilters,
      category: 'Food',
    });
  });

  it('calls onFiltersChange when start date changes', async () => {
    const user = userEvent.setup();
    const onFiltersChange = vi.fn();
    render(<FilterBar filters={defaultFilters} onFiltersChange={onFiltersChange} />);

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
    render(<FilterBar filters={defaultFilters} onFiltersChange={onFiltersChange} />);

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
    render(<FilterBar filters={filters} onFiltersChange={onFiltersChange} />);

    expect(screen.getByText('Clear All')).toBeInTheDocument();
  });

  it('does not show "Clear All" button when no filters are active', () => {
    const onFiltersChange = vi.fn();
    render(<FilterBar filters={defaultFilters} onFiltersChange={onFiltersChange} />);

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
    render(<FilterBar filters={filters} onFiltersChange={onFiltersChange} />);

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
    render(<FilterBar filters={defaultFilters} onFiltersChange={onFiltersChange} />);

    const categorySelect = screen.getByLabelText('Filter by category');
    const options = Array.from(categorySelect.querySelectorAll('option')).map(
      (option) => option.value
    );

    expect(options).toContain('all');
    expect(options).toContain('Food');
    expect(options).toContain('Transport');
    expect(options).toContain('Bills');
    expect(options).toContain('Entertainment');
    expect(options).toContain('Salary');
    expect(options).toContain('Freelance');
    expect(options).toContain('Shopping');
    expect(options).toContain('Healthcare');
    expect(options).toContain('Education');
    expect(options).toContain('Other');
  });

  it('includes all type options in type dropdown', () => {
    const onFiltersChange = vi.fn();
    render(<FilterBar filters={defaultFilters} onFiltersChange={onFiltersChange} />);

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
    render(<FilterBar filters={filters} onFiltersChange={onFiltersChange} />);

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
