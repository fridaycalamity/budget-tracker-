import { useState, useMemo } from 'react';
import { useBudget } from '../contexts';
import { FilterBar } from '../components/FilterBar';
import { SortControls } from '../components/SortControls';
import { TransactionRow } from '../components/TransactionRow';
import { TransactionModal } from '../components/TransactionModal';
import { filterTransactions, sortTransactions } from '../utils';
import type { TransactionFilters, SortConfig, Transaction } from '../types';

/**
 * TransactionList page
 * Displays all transactions with filtering and sorting capabilities
 * 
 * Features:
 * - FilterBar for filtering by type, category, and date range
 * - SortControls for sorting by date or amount
 * - TransactionRow for each transaction with edit and delete
 * - TransactionModal for editing transactions
 * - Empty state when no transactions exist
 * - No results state when filters return no matches
 * - Fully responsive design
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7
 */
export function TransactionList() {
  const { transactions, deleteTransaction } = useBudget();

  // Edit modal state
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Filter state
  const [filters, setFilters] = useState<TransactionFilters>({
    type: 'all',
    category: 'all',
    dateRange: {
      start: null,
      end: null,
    },
  });

  // Sort state - default to newest first
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: 'date',
    direction: 'desc',
  });

  // Handle edit transaction
  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsEditModalOpen(true);
  };

  // Handle close edit modal
  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingTransaction(null);
  };

  // Apply filters and sorting using memoization for performance
  const displayedTransactions = useMemo(() => {
    // First filter the transactions
    const filtered = filterTransactions(transactions, filters);
    
    // Then sort the filtered results
    const sorted = sortTransactions(filtered, sortConfig);
    
    return sorted;
  }, [transactions, filters, sortConfig]);

  // Check if any filters are active
  const hasActiveFilters =
    filters.type !== 'all' ||
    filters.category !== 'all' ||
    filters.dateRange.start !== null ||
    filters.dateRange.end !== null;

  // Empty state - no transactions at all
  if (transactions.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Transactions
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            View and manage all your transactions
          </p>
        </div>

        <div 
          className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center"
          role="status"
          aria-live="polite"
        >
          <svg
            className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-600 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No transactions yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Get started by adding your first transaction using the + button below.
          </p>
        </div>
      </div>
    );
  }

  // No results state - filters returned no matches
  if (displayedTransactions.length === 0 && hasActiveFilters) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Transactions
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            View and manage all your transactions
          </p>
        </div>

        <FilterBar filters={filters} onFiltersChange={setFilters} />
        <SortControls sortConfig={sortConfig} onSortChange={setSortConfig} />

        <div 
          className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center"
          role="status"
          aria-live="polite"
        >
          <svg
            className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-600 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No transactions found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Try adjusting your filters to see more results.
          </p>
        </div>
      </div>
    );
  }

  // Main view with transactions
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Transactions
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          View and manage all your transactions
        </p>
      </div>

      {/* Filter Bar */}
      <div role="region" aria-label="Transaction filters">
        <FilterBar filters={filters} onFiltersChange={setFilters} />
      </div>

      {/* Sort Controls */}
      <div role="region" aria-label="Sort controls">
        <SortControls sortConfig={sortConfig} onSortChange={setSortConfig} />
      </div>

      {/* Results count */}
      <div 
        className="text-sm text-gray-600 dark:text-gray-400"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        Showing {displayedTransactions.length} of {transactions.length} transaction
        {transactions.length !== 1 ? 's' : ''}
      </div>

      {/* Transaction List */}
      <div 
        className="space-y-3"
        role="list"
        aria-label="Transaction list"
      >
        {displayedTransactions.map((transaction) => (
          <div key={transaction.id} role="listitem">
            <TransactionRow
              transaction={transaction}
              onDelete={deleteTransaction}
              onEdit={handleEdit}
            />
          </div>
        ))}
      </div>

      {/* Edit Transaction Modal */}
      <TransactionModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        editTransaction={editingTransaction}
      />
    </div>
  );
}
