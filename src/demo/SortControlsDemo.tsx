import { useState } from 'react';
import { SortControls } from '../components';
import { ThemeProvider } from '../contexts';
import type { SortConfig } from '../types';

/**
 * Demo page for SortControls component
 * Shows the sort controls in action with state management
 */
export function SortControlsDemo() {
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: 'date',
    direction: 'desc',
  });

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
              SortControls Component Demo
            </h1>
            
            <SortControls sortConfig={sortConfig} onSortChange={setSortConfig} />
          </div>

          {/* Display current sort state */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Current Sort Configuration
            </h2>
            <pre className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg overflow-x-auto">
              <code className="text-sm text-gray-800 dark:text-gray-200">
                {JSON.stringify(sortConfig, null, 2)}
              </code>
            </pre>
          </div>

          {/* Example of how sorting would affect data */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Sort Behavior
            </h2>
            <div className="space-y-2 text-gray-700 dark:text-gray-300">
              <p>
                <strong>Field:</strong> {sortConfig.field === 'date' ? 'Date' : 'Amount'}
              </p>
              <p>
                <strong>Direction:</strong> {sortConfig.direction === 'asc' ? 'Ascending' : 'Descending'}
              </p>
              <p className="mt-4">
                {sortConfig.field === 'date' && sortConfig.direction === 'asc' && (
                  <span>Transactions will be sorted from oldest to newest.</span>
                )}
                {sortConfig.field === 'date' && sortConfig.direction === 'desc' && (
                  <span>Transactions will be sorted from newest to oldest.</span>
                )}
                {sortConfig.field === 'amount' && sortConfig.direction === 'asc' && (
                  <span>Transactions will be sorted from lowest to highest amount.</span>
                )}
                {sortConfig.field === 'amount' && sortConfig.direction === 'desc' && (
                  <span>Transactions will be sorted from highest to lowest amount.</span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}
