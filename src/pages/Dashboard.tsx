import { useState } from 'react';
import { useBudget } from '../contexts';
import { SummaryCard } from '../components/SummaryCard';
import { SpendingChart } from '../components/SpendingChart';
import { TransactionRow } from '../components/TransactionRow';
import { TransactionModal } from '../components/TransactionModal';
import type { Transaction } from '../types';

/**
 * Dashboard page
 * Displays financial summary, spending chart, and recent transactions
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 7.1, 7.2, 7.3
 */
export function Dashboard() {
  const { summary, transactions, deleteTransaction } = useBudget();

  // Edit modal state
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

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

  // Get 10 most recent transactions, sorted by date (newest first)
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  // Determine balance color based on positive/negative value
  const balanceColor = summary.balance >= 0 ? 'green' : 'red';

  return (
    <div className="space-y-6 pb-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Financial overview and recent activity
        </p>
      </div>

      {/* Summary Cards - Responsive grid */}
      <div 
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
        role="region"
        aria-label="Financial summary"
      >
        <SummaryCard
          title="Total Income"
          amount={summary.totalIncome}
          color="green"
        />
        <SummaryCard
          title="Total Expenses"
          amount={summary.totalExpenses}
          color="red"
        />
        <SummaryCard
          title="Balance"
          amount={summary.balance}
          color={balanceColor}
        />
      </div>

      {/* Spending Chart */}
      <div role="region" aria-label="Spending breakdown by category">
        <SpendingChart />
      </div>

      {/* Recent Transactions */}
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
        role="region"
        aria-label="Recent transactions"
      >
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Recent Transactions
        </h2>

        {recentTransactions.length === 0 ? (
          // Empty state
          <div 
            className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400"
            role="status"
            aria-live="polite"
          >
            <svg
              className="w-16 h-16 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <p className="text-center text-lg font-medium mb-2">
              No transactions yet
            </p>
            <p className="text-center text-sm">
              Start tracking your finances by adding your first transaction.
            </p>
          </div>
        ) : (
          // Transaction list
          <div 
            className="space-y-3"
            role="list"
            aria-label="Recent transaction list"
          >
            {recentTransactions.map((transaction) => (
              <div key={transaction.id} role="listitem">
                <TransactionRow
                  transaction={transaction}
                  onDelete={deleteTransaction}
                  onEdit={handleEdit}
                />
              </div>
            ))}
          </div>
        )}
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
