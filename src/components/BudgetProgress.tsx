import { useBudget } from '../contexts/BudgetContext';
import { formatCurrency } from '../utils';

/**
 * BudgetProgress component
 * Displays progress bar showing spending vs budget limit
 * Shows warning indicator when spending exceeds 80% of limit
 */
export function BudgetProgress() {
  const { summary, budgetGoal } = useBudget();

  // If no budget goal is set, don't render anything
  if (!budgetGoal) {
    return null;
  }

  const { totalExpenses } = summary;
  const { monthlyLimit } = budgetGoal;

  // Calculate percentage of budget used
  const percentage = Math.min((totalExpenses / monthlyLimit) * 100, 100);
  const isWarning = percentage > 80;
  const isOverBudget = totalExpenses > monthlyLimit;

  // Determine progress bar color based on percentage
  const getProgressColor = () => {
    if (isOverBudget) return 'bg-red-500';
    if (isWarning) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  // Determine text color for status
  const getTextColor = () => {
    if (isOverBudget) return 'text-red-600 dark:text-red-400';
    if (isWarning) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-4 transition-colors duration-200">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Budget Progress
        </h3>
        <span className={`text-sm font-medium ${getTextColor()}`}>
          {percentage.toFixed(1)}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="relative w-full h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden transition-colors duration-200">
        <div
          className={`h-full ${getProgressColor()} transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Budget usage percentage"
        />
      </div>

      {/* Spending details */}
      <div className="flex justify-between items-center text-sm">
        <div>
          <p className="text-gray-600 dark:text-gray-400">Current Spending</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {formatCurrency(totalExpenses)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-gray-600 dark:text-gray-400">Monthly Limit</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {formatCurrency(monthlyLimit)}
          </p>
        </div>
      </div>

      {/* Warning message */}
      {isWarning && !isOverBudget && (
        <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md transition-colors duration-200">
          <svg
            className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            You've used over 80% of your monthly budget. Consider reducing spending.
          </p>
        </div>
      )}

      {/* Over budget message */}
      {isOverBudget && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md transition-colors duration-200">
          <svg
            className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <p className="text-sm text-red-800 dark:text-red-200">
            You've exceeded your monthly budget by {formatCurrency(totalExpenses - monthlyLimit)}.
          </p>
        </div>
      )}
    </div>
  );
}
