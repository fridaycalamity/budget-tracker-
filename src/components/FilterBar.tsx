import { type ChangeEvent } from 'react';
import type { TransactionCategory, TransactionFilters } from '../types';

/**
 * FilterBar component
 * Provides filtering controls for transaction list
 * 
 * Features:
 * - Type filter dropdown (all/income/expense)
 * - Category filter dropdown (all categories + "all")
 * - Date range inputs (start and end date)
 * - Connected to filter state via props
 * 
 * Requirements: 5.1, 5.2, 5.3
 */

// All available transaction categories
const CATEGORIES: TransactionCategory[] = [
  'Food',
  'Transport',
  'Bills',
  'Entertainment',
  'Salary',
  'Freelance',
  'Shopping',
  'Healthcare',
  'Education',
  'Other',
];

interface FilterBarProps {
  filters: TransactionFilters;
  onFiltersChange: (filters: TransactionFilters) => void;
}

export function FilterBar({ filters, onFiltersChange }: FilterBarProps) {
  /**
   * Handle type filter change
   */
  const handleTypeChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value as 'all' | 'income' | 'expense';
    onFiltersChange({
      ...filters,
      type: newType,
    });
  };

  /**
   * Handle category filter change
   */
  const handleCategoryChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const newCategory = e.target.value as TransactionCategory | 'all';
    onFiltersChange({
      ...filters,
      category: newCategory,
    });
  };

  /**
   * Handle start date change
   */
  const handleStartDateChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newStartDate = e.target.value || null;
    onFiltersChange({
      ...filters,
      dateRange: {
        ...filters.dateRange,
        start: newStartDate,
      },
    });
  };

  /**
   * Handle end date change
   */
  const handleEndDateChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newEndDate = e.target.value || null;
    onFiltersChange({
      ...filters,
      dateRange: {
        ...filters.dateRange,
        end: newEndDate,
      },
    });
  };

  /**
   * Clear all filters
   */
  const handleClearFilters = () => {
    onFiltersChange({
      type: 'all',
      category: 'all',
      dateRange: {
        start: null,
        end: null,
      },
    });
  };

  // Check if any filters are active
  const hasActiveFilters =
    filters.type !== 'all' ||
    filters.category !== 'all' ||
    filters.dateRange.start !== null ||
    filters.dateRange.end !== null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Filters
        </h3>
        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            aria-label="Clear all filters"
          >
            Clear All
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Type Filter */}
        <div>
          <label
            htmlFor="type-filter"
            className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300"
          >
            Type
          </label>
          <select
            id="type-filter"
            value={filters.type}
            onChange={handleTypeChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            aria-label="Filter by transaction type"
          >
            <option value="all">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
        </div>

        {/* Category Filter */}
        <div>
          <label
            htmlFor="category-filter"
            className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300"
          >
            Category
          </label>
          <select
            id="category-filter"
            value={filters.category}
            onChange={handleCategoryChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            aria-label="Filter by category"
          >
            <option value="all">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Start Date Filter */}
        <div>
          <label
            htmlFor="start-date-filter"
            className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300"
          >
            Start Date
          </label>
          <input
            type="date"
            id="start-date-filter"
            value={filters.dateRange.start || ''}
            onChange={handleStartDateChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            aria-label="Filter by start date"
          />
        </div>

        {/* End Date Filter */}
        <div>
          <label
            htmlFor="end-date-filter"
            className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300"
          >
            End Date
          </label>
          <input
            type="date"
            id="end-date-filter"
            value={filters.dateRange.end || ''}
            onChange={handleEndDateChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            aria-label="Filter by end date"
          />
        </div>
      </div>
    </div>
  );
}
