import { useState } from 'react';
import { useCategories, useToast, useBudget } from '../contexts';
import { CategoryForm } from './CategoryForm';
import { countTransactionsByCategory, reassignTransactions } from '../utils/categoryValidation';
import type { Category } from '../types';
import { storageService } from '../utils';

/**
 * CategoryManager component
 * Displays and manages all categories in the Settings page
 * 
 * Features:
 * - Display all categories in a grid
 * - Show emoji, name, color dot, and type badge
 * - Default categories are read-only
 * - Custom categories have Edit and Delete buttons
 * - Add Category button
 * - Delete confirmation with transaction reassignment
 * - Light/dark mode support
 */
export function CategoryManager() {
  const { categories, deleteCategory, getDefaultCategories } = useCategories();
  const { transactions } = useBudget();
  const { showToast } = useToast();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

  const defaultCategories = getDefaultCategories();
  const defaultCategoryIds = new Set(defaultCategories.map((cat: Category) => cat.id));

  const handleAddClick = () => {
    setEditingCategory(null);
    setIsFormOpen(true);
  };

  const handleEditClick = (category: Category) => {
    setEditingCategory(category);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (category: Category) => {
    setDeletingCategory(category);
  };

  const handleConfirmDelete = () => {
    if (!deletingCategory) return;

    const transactionCount = countTransactionsByCategory(transactions, deletingCategory.id);

    if (transactionCount > 0) {
      // Reassign transactions to "Other" category
      const otherCategory = categories.find((cat: Category) => cat.name === 'Other');
      if (otherCategory) {
        const updatedTransactions = reassignTransactions(
          transactions,
          deletingCategory.id,
          otherCategory.id
        );
        storageService.saveTransactions(updatedTransactions);
      }
    }

    deleteCategory(deletingCategory.id);
    showToast('Category deleted successfully!', 'success');
    setDeletingCategory(null);
  };

  const handleCancelDelete = () => {
    setDeletingCategory(null);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingCategory(null);
  };

  const getTypeBadgeColor = (type: Category['type']) => {
    switch (type) {
      case 'income':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
      case 'expense':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
      case 'both':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Manage Categories
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Customize your transaction categories
          </p>
        </div>
        <button
          onClick={handleAddClick}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors duration-200 flex items-center gap-2"
          aria-label="Add new category"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Category
        </button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        {categories.map((category: Category) => {
          const isDefault = defaultCategoryIds.has(category.id);
          const transactionCount = countTransactionsByCategory(transactions, category.id);

          return (
            <div
              key={category.id}
              className="flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 dark:hover:border-gray-600 transition-colors duration-200"
            >
              {/* Icon and Color */}
              <div className="flex items-center gap-3">
                <span className="text-3xl">{category.icon}</span>
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: category.color }}
                  aria-label={`Color: ${category.color}`}
                />
              </div>

              {/* Category Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-gray-900 dark:text-white truncate">
                    {category.name}
                  </h4>
                  {isDefault && (
                    <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                      Default
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs px-2 py-0.5 rounded capitalize ${getTypeBadgeColor(category.type)}`}>
                    {category.type}
                  </span>
                  {transactionCount > 0 && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {transactionCount} transaction{transactionCount !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              {!isDefault && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEditClick(category)}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors duration-200"
                    aria-label={`Edit ${category.name} category`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeleteClick(category)}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200"
                    aria-label={`Delete ${category.name} category`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Category Form Modal */}
      <CategoryForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        editCategory={editingCategory}
      />

      {/* Delete Confirmation Dialog */}
      {deletingCategory && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCancelDelete();
            }
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
          aria-describedby="delete-dialog-description"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

          {/* Dialog Content */}
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 animate-slideUp">
            {/* Icon */}
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full">
              <svg
                className="w-6 h-6 text-red-600 dark:text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            {/* Title */}
            <h3
              id="delete-dialog-title"
              className="text-lg font-semibold text-gray-900 dark:text-white text-center mb-2"
            >
              Delete Category?
            </h3>

            {/* Description */}
            <div id="delete-dialog-description" className="text-sm text-gray-600 dark:text-gray-400 text-center mb-6 space-y-2">
              <p>
                Are you sure you want to delete the <strong>{deletingCategory.name}</strong> category?
              </p>
              {countTransactionsByCategory(transactions, deletingCategory.id) > 0 && (
                <p className="text-amber-600 dark:text-amber-400">
                  This category has {countTransactionsByCategory(transactions, deletingCategory.id)} transaction(s).
                  They will be reassigned to the "Other" category.
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleCancelDelete}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors duration-200"
                aria-label="Cancel delete"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors duration-200"
                aria-label="Confirm delete category"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
