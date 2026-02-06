import { type ChangeEvent } from 'react';
import type { SortConfig } from '../types';

/**
 * SortControls component
 * Provides sorting controls for transaction list
 * 
 * Features:
 * - Sort field selector (date/amount)
 * - Sort direction toggle (asc/desc)
 * - Connected to sort state via props
 * 
 * Requirements: 5.4, 5.5
 */

interface SortControlsProps {
  sortConfig: SortConfig;
  onSortChange: (sortConfig: SortConfig) => void;
}

export function SortControls({ sortConfig, onSortChange }: SortControlsProps) {
  /**
   * Handle sort field change
   */
  const handleFieldChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const newField = e.target.value as 'date' | 'amount';
    onSortChange({
      ...sortConfig,
      field: newField,
    });
  };

  /**
   * Handle sort direction change
   */
  const handleDirectionChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const newDirection = e.target.value as 'asc' | 'desc';
    onSortChange({
      ...sortConfig,
      direction: newDirection,
    });
  };

  /**
   * Toggle sort direction
   */
  const toggleDirection = () => {
    onSortChange({
      ...sortConfig,
      direction: sortConfig.direction === 'asc' ? 'desc' : 'asc',
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Sort By
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Sort Field Selector */}
        <div>
          <label
            htmlFor="sort-field"
            className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300"
          >
            Field
          </label>
          <select
            id="sort-field"
            value={sortConfig.field}
            onChange={handleFieldChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            aria-label="Select sort field"
          >
            <option value="date">Date</option>
            <option value="amount">Amount</option>
          </select>
        </div>

        {/* Sort Direction Selector */}
        <div>
          <label
            htmlFor="sort-direction"
            className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300"
          >
            Direction
          </label>
          <select
            id="sort-direction"
            value={sortConfig.direction}
            onChange={handleDirectionChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            aria-label="Select sort direction"
          >
            <option value="asc">
              Ascending {sortConfig.field === 'date' ? '(Oldest First)' : '(Lowest First)'}
            </option>
            <option value="desc">
              Descending {sortConfig.field === 'date' ? '(Newest First)' : '(Highest First)'}
            </option>
          </select>
        </div>

        {/* Quick Toggle Button */}
        <div className="flex items-end">
          <button
            onClick={toggleDirection}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            aria-label={`Toggle sort direction to ${sortConfig.direction === 'asc' ? 'descending' : 'ascending'}`}
          >
            <span className="flex items-center justify-center gap-2">
              {sortConfig.direction === 'asc' ? (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 15l7-7 7 7"
                    />
                  </svg>
                  <span>Ascending</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                  <span>Descending</span>
                </>
              )}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
