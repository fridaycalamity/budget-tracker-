import { useState } from 'react';
import { useBudget } from '../contexts';
import { CategoryManager } from '../components';

/**
 * Settings page
 * Provides data management options like clearing all data
 * 
 * Features:
 * - Clear All Data button
 * - Confirmation dialog before clearing
 * - Success message after clearing
 * 
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6
 */
export function Settings() {
  const { clearAllData } = useBudget();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  /**
   * Handle clear data button click
   * Shows confirmation dialog
   */
  const handleClearDataClick = () => {
    setShowConfirmDialog(true);
  };

  /**
   * Handle confirmation of data clearing
   * Clears all data and shows success message
   */
  const handleConfirmClear = () => {
    clearAllData();
    setShowConfirmDialog(false);
    setShowSuccessMessage(true);

    // Hide success message after 3 seconds
    setTimeout(() => {
      setShowSuccessMessage(false);
    }, 3000);
  };

  /**
   * Handle cancellation of data clearing
   * Closes confirmation dialog
   */
  const handleCancelClear = () => {
    setShowConfirmDialog(false);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
        Settings
      </h2>
      <p className="text-gray-600 dark:text-gray-400">
        Manage your application settings and data
      </p>

      {/* Success Message */}
      {showSuccessMessage && (
        <div
          className="p-4 bg-green-100 dark:bg-green-900/30 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-300 rounded-lg animate-fadeIn"
          role="alert"
          aria-live="polite"
        >
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-medium">All data has been cleared successfully!</span>
          </div>
        </div>
      )}

      {/* Category Management Section */}
      <CategoryManager />

      {/* Data Management Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Data Management
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Clear all your transactions and budget goals. This action cannot be undone.
        </p>
        <button
          onClick={handleClearDataClick}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors duration-200"
          aria-label="Clear all data"
        >
          Clear All Data
        </button>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn"
          onClick={(e) => {
            // Close when clicking the backdrop (not the dialog content)
            if (e.target === e.currentTarget) {
              handleCancelClear();
            }
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
          aria-describedby="confirm-dialog-description"
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
              id="confirm-dialog-title"
              className="text-lg font-semibold text-gray-900 dark:text-white text-center mb-2"
            >
              Clear All Data?
            </h3>

            {/* Description */}
            <p
              id="confirm-dialog-description"
              className="text-sm text-gray-600 dark:text-gray-400 text-center mb-6"
            >
              This will permanently delete all your transactions and budget goals. This action cannot be undone.
            </p>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleCancelClear}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors duration-200"
                aria-label="Cancel clearing data"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmClear}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors duration-200"
                aria-label="Confirm clear all data"
              >
                Clear Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
