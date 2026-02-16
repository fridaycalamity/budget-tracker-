import { useState } from 'react';
import { TransactionModal } from './TransactionModal';

/**
 * AddTransactionButton component
 * Floating Action Button (FAB) for adding new transactions
 * 
 * Features:
 * - Fixed position at bottom-right corner
 * - Opens TransactionModal on click
 * - Smooth hover and click animations
 * - Keyboard accessible (Enter/Space to activate)
 * - ARIA labels for screen readers
 * - Responsive positioning
 * 
 * Requirements: 12.1, 12.2, 7.4, 7.5
 */

export function AddTransactionButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  /**
   * Handle button click
   * Opens the transaction modal
   */
  const handleClick = () => {
    setIsModalOpen(true);
  };

  /**
   * Handle keyboard interaction
   * Opens modal on Enter or Space key
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  /**
   * Handle modal close
   * Closes the transaction modal
   */
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40 w-14 h-14 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 ease-in-out transform hover:scale-110 active:scale-95 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800 flex items-center justify-center group"
        aria-label="Add new transaction"
        title="Add new transaction"
        type="button"
      >
        {/* Plus Icon */}
        <svg
          className="w-6 h-6 transition-transform duration-200 group-hover:rotate-90"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
      </button>

      {/* Transaction Modal */}
      <TransactionModal isOpen={isModalOpen} onClose={handleCloseModal} />
    </>
  );
}
