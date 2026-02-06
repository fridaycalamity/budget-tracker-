import { useState } from 'react';
import { FilterBar } from '../components';
import { ThemeProvider } from '../contexts';
import type { TransactionFilters } from '../types';

/**
 * Demo page for FilterBar component
 * Shows the filter bar in action with state management
 */
export function FilterBarDemo() {
  const [filters, setFilters] = useState<TransactionFilters>({
    type: 'all',
    category: 'all',
    dateRange: {
      start: null,
      end: null,
    },
  });

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
              FilterBar Component Demo
            </h1>
            
            <FilterBar filters={filters} onFiltersChange={setFilters} />
          </div>

          {/* Display current filter state */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Current Filter State
            </h2>
            <pre className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg overflow-x-auto">
              <code className="text-sm text-gray-800 dark:text-gray-200">
                {JSON.stringify(filters, null, 2)}
              </code>
            </pre>
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}
