import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SortControls } from './SortControls';
import type { SortConfig } from '../types';

describe('SortControls', () => {
  const defaultSortConfig: SortConfig = {
    field: 'date',
    direction: 'desc',
  };

  it('renders all sort controls', () => {
    const onSortChange = vi.fn();
    render(<SortControls sortConfig={defaultSortConfig} onSortChange={onSortChange} />);

    // Check for sort controls
    expect(screen.getByText('Sort By')).toBeInTheDocument();
    expect(screen.getByLabelText('Select sort field')).toBeInTheDocument();
    expect(screen.getByLabelText('Select sort direction')).toBeInTheDocument();
  });

  it('displays current sort configuration', () => {
    const sortConfig: SortConfig = {
      field: 'amount',
      direction: 'asc',
    };
    const onSortChange = vi.fn();
    render(<SortControls sortConfig={sortConfig} onSortChange={onSortChange} />);

    // Check that values are displayed
    expect(screen.getByLabelText('Select sort field')).toHaveValue('amount');
    expect(screen.getByLabelText('Select sort direction')).toHaveValue('asc');
  });

  it('calls onSortChange when sort field changes', async () => {
    const user = userEvent.setup();
    const onSortChange = vi.fn();
    render(<SortControls sortConfig={defaultSortConfig} onSortChange={onSortChange} />);

    const fieldSelect = screen.getByLabelText('Select sort field');
    await user.selectOptions(fieldSelect, 'amount');

    expect(onSortChange).toHaveBeenCalledWith({
      field: 'amount',
      direction: 'desc',
    });
  });

  it('calls onSortChange when sort direction changes', async () => {
    const user = userEvent.setup();
    const onSortChange = vi.fn();
    render(<SortControls sortConfig={defaultSortConfig} onSortChange={onSortChange} />);

    const directionSelect = screen.getByLabelText('Select sort direction');
    await user.selectOptions(directionSelect, 'asc');

    expect(onSortChange).toHaveBeenCalledWith({
      field: 'date',
      direction: 'asc',
    });
  });

  it('toggles direction when toggle button is clicked', async () => {
    const user = userEvent.setup();
    const onSortChange = vi.fn();
    render(<SortControls sortConfig={defaultSortConfig} onSortChange={onSortChange} />);

    const toggleButton = screen.getByRole('button', { name: /toggle sort direction/i });
    await user.click(toggleButton);

    expect(onSortChange).toHaveBeenCalledWith({
      field: 'date',
      direction: 'asc',
    });
  });

  it('toggles from ascending to descending', async () => {
    const user = userEvent.setup();
    const sortConfig: SortConfig = {
      field: 'amount',
      direction: 'asc',
    };
    const onSortChange = vi.fn();
    render(<SortControls sortConfig={sortConfig} onSortChange={onSortChange} />);

    const toggleButton = screen.getByRole('button', { name: /toggle sort direction/i });
    await user.click(toggleButton);

    expect(onSortChange).toHaveBeenCalledWith({
      field: 'amount',
      direction: 'desc',
    });
  });

  it('includes both field options in field dropdown', () => {
    const onSortChange = vi.fn();
    render(<SortControls sortConfig={defaultSortConfig} onSortChange={onSortChange} />);

    const fieldSelect = screen.getByLabelText('Select sort field');
    const options = Array.from(fieldSelect.querySelectorAll('option')).map(
      (option) => option.value
    );

    expect(options).toEqual(['date', 'amount']);
  });

  it('includes both direction options in direction dropdown', () => {
    const onSortChange = vi.fn();
    render(<SortControls sortConfig={defaultSortConfig} onSortChange={onSortChange} />);

    const directionSelect = screen.getByLabelText('Select sort direction');
    const options = Array.from(directionSelect.querySelectorAll('option')).map(
      (option) => option.value
    );

    expect(options).toEqual(['asc', 'desc']);
  });

  it('shows appropriate labels for date field ascending', () => {
    const sortConfig: SortConfig = {
      field: 'date',
      direction: 'asc',
    };
    const onSortChange = vi.fn();
    render(<SortControls sortConfig={sortConfig} onSortChange={onSortChange} />);

    expect(screen.getByText(/Oldest First/i)).toBeInTheDocument();
  });

  it('shows appropriate labels for date field descending', () => {
    const sortConfig: SortConfig = {
      field: 'date',
      direction: 'desc',
    };
    const onSortChange = vi.fn();
    render(<SortControls sortConfig={sortConfig} onSortChange={onSortChange} />);

    expect(screen.getByText(/Newest First/i)).toBeInTheDocument();
  });

  it('shows appropriate labels for amount field ascending', () => {
    const sortConfig: SortConfig = {
      field: 'amount',
      direction: 'asc',
    };
    const onSortChange = vi.fn();
    render(<SortControls sortConfig={sortConfig} onSortChange={onSortChange} />);

    expect(screen.getByText(/Lowest First/i)).toBeInTheDocument();
  });

  it('shows appropriate labels for amount field descending', () => {
    const sortConfig: SortConfig = {
      field: 'amount',
      direction: 'desc',
    };
    const onSortChange = vi.fn();
    render(<SortControls sortConfig={sortConfig} onSortChange={onSortChange} />);

    expect(screen.getByText(/Highest First/i)).toBeInTheDocument();
  });

  it('displays ascending icon when direction is ascending', () => {
    const sortConfig: SortConfig = {
      field: 'date',
      direction: 'asc',
    };
    const onSortChange = vi.fn();
    render(<SortControls sortConfig={sortConfig} onSortChange={onSortChange} />);

    const toggleButton = screen.getByRole('button', { name: /toggle sort direction/i });
    expect(toggleButton).toHaveTextContent('Ascending');
  });

  it('displays descending icon when direction is descending', () => {
    const sortConfig: SortConfig = {
      field: 'date',
      direction: 'desc',
    };
    const onSortChange = vi.fn();
    render(<SortControls sortConfig={sortConfig} onSortChange={onSortChange} />);

    const toggleButton = screen.getByRole('button', { name: /toggle sort direction/i });
    expect(toggleButton).toHaveTextContent('Descending');
  });

  it('has proper accessibility attributes', () => {
    const onSortChange = vi.fn();
    render(<SortControls sortConfig={defaultSortConfig} onSortChange={onSortChange} />);

    // Check ARIA labels
    expect(screen.getByLabelText('Select sort field')).toBeInTheDocument();
    expect(screen.getByLabelText('Select sort direction')).toBeInTheDocument();
    expect(screen.getByLabelText(/toggle sort direction/i)).toBeInTheDocument();
  });

  it('maintains field when only direction changes', async () => {
    const user = userEvent.setup();
    const sortConfig: SortConfig = {
      field: 'amount',
      direction: 'desc',
    };
    const onSortChange = vi.fn();
    render(<SortControls sortConfig={sortConfig} onSortChange={onSortChange} />);

    const directionSelect = screen.getByLabelText('Select sort direction');
    await user.selectOptions(directionSelect, 'asc');

    expect(onSortChange).toHaveBeenCalledWith({
      field: 'amount',
      direction: 'asc',
    });
  });

  it('maintains direction when only field changes', async () => {
    const user = userEvent.setup();
    const sortConfig: SortConfig = {
      field: 'date',
      direction: 'asc',
    };
    const onSortChange = vi.fn();
    render(<SortControls sortConfig={sortConfig} onSortChange={onSortChange} />);

    const fieldSelect = screen.getByLabelText('Select sort field');
    await user.selectOptions(fieldSelect, 'amount');

    expect(onSortChange).toHaveBeenCalledWith({
      field: 'amount',
      direction: 'asc',
    });
  });
});
