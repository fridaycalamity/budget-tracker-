import { useState } from 'react';
import { formatCurrency, formatDate, getCategoryName, getCategoryIcon, getCategoryColor } from '../utils';
import { useCategories } from '../contexts';
import type { Transaction } from '../types';

interface TransactionRowProps {
  transaction: Transaction;
  onDelete: (id: string) => void;
  onEdit: (transaction: Transaction) => void;
}

/**
 * TransactionRow component
 * Displays a single transaction with date, description, category, and amount
 * Includes edit and delete buttons with confirmation
 * Color-coded by transaction type (green for income, red for expense)
 * Shows category icon and color badge
 */
export function TransactionRow({ transaction, onDelete, onEdit }: TransactionRowProps) {
  const { categories } = useCategories();
  const [showConfirm, setShowConfirm] = useState(false);

  const categoryName = getCategoryName(transaction.category, categories);
  const categoryIcon = getCategoryIcon(transaction.category, categories);
  const categoryColor = getCategoryColor(transaction.category, categories);

  const handleDeleteClick = () => {
    setShowConfirm(true);
  };

  const handleConfirmDelete = () => {
    onDelete(transaction.id);
    setShowConfirm(false);
  };

  const handleCancelDelete = () => {
    setShowConfirm(false);
  };

  // Color classes based on transaction type
  const amountColorClass =
    transaction.type === 'income'
      ? 'text-green-600 dark:text-green-400'
      : 'text-red-600 dark:text-red-400';

  return (
    <div className="p-3 sm:p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-all duration-200">
      {/* Mobile layout: stacked */}
      <div className="sm:hidden">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {transaction.description}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: categoryColor }}
                aria-label="Category color"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {categoryIcon} {categoryName}
              </p>
            </div>
          </div>
          <div className={`text-sm font-semibold ${amountColorClass} flex-shrink-0 text-right`}>
            {transaction.type === 'income' ? '+' : '-'}
            {formatCurrency(transaction.amount)}
          </div>
        </div>
        <div className="flex items-center justify-between mt-2">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {formatDate(transaction.date)}
          </div>
          <div className="flex-shrink-0">
            {!showConfirm ? (
              <div className="flex gap-1">
                <button
                  onClick={() => onEdit(transaction)}
                  className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
                  aria-label="Edit transaction"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={handleDeleteClick}
                  className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-200"
                  aria-label="Delete transaction"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleConfirmDelete}
                  className="px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors duration-200 min-h-[44px]"
                  aria-label="Confirm delete"
                >
                  Delete
                </button>
                <button
                  onClick={handleCancelDelete}
                  className="px-3 py-1.5 text-sm bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors duration-200 min-h-[44px]"
                  aria-label="Cancel delete"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Desktop layout: single row */}
      <div className="hidden sm:flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-4">
            {/* Date */}
            <div className="text-sm text-gray-500 dark:text-gray-400 w-24 flex-shrink-0">
              {formatDate(transaction.date)}
            </div>

            {/* Description and Category */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {transaction.description}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: categoryColor }}
                  aria-label="Category color"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {categoryIcon} {categoryName}
                </p>
              </div>
            </div>

            {/* Amount */}
            <div className={`text-lg font-semibold ${amountColorClass} w-32 text-right flex-shrink-0`}>
              {transaction.type === 'income' ? '+' : '-'}
              {formatCurrency(transaction.amount)}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="ml-4 flex-shrink-0">
          {!showConfirm ? (
            <div className="flex gap-2">
              <button
                onClick={() => onEdit(transaction)}
                className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
                aria-label="Edit transaction"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                onClick={handleDeleteClick}
                className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-200"
                aria-label="Delete transaction"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleConfirmDelete}
                className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors duration-200"
                aria-label="Confirm delete"
              >
                Delete
              </button>
              <button
                onClick={handleCancelDelete}
                className="px-3 py-1 text-sm bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors duration-200"
                aria-label="Cancel delete"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
