import { useState } from 'react';
import { useBudget } from '../contexts/BudgetContext';
import { useToast } from '../contexts/ToastContext';
import { BudgetProgress } from '../components';
import { getCurrentMonth } from '../utils';

/**
 * BudgetGoals page (optional feature)
 * Allows users to set monthly spending limits and view progress
 */
export function BudgetGoals() {
  const { budgetGoal, setBudgetGoal } = useBudget();
  const { showToast } = useToast();

  const [monthlyLimit, setMonthlyLimit] = useState<string>(
    budgetGoal?.monthlyLimit.toString() || ''
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    const newErrors: Record<string, string> = {};
    const limitValue = parseFloat(monthlyLimit);

    if (!monthlyLimit || monthlyLimit.trim() === '') {
      newErrors.monthlyLimit = 'Monthly limit is required';
    } else if (isNaN(limitValue) || limitValue <= 0) {
      newErrors.monthlyLimit = 'Monthly limit must be a positive number';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Save budget goal
    setBudgetGoal({
      monthlyLimit: limitValue,
      month: getCurrentMonth(),
    });

    setErrors({});
    showToast('Budget goal saved successfully!', 'success');
  };

  const handleClearGoal = () => {
    setBudgetGoal(null);
    setMonthlyLimit('');
    showToast('Budget goal cleared', 'success');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Budget Goals
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Set and track your monthly spending limits
        </p>
      </div>

      {/* Budget Goal Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Set Monthly Budget
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="monthlyLimit"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Monthly Spending Limit (₱)
            </label>
            <input
              type="number"
              id="monthlyLimit"
              value={monthlyLimit}
              onChange={(e) => setMonthlyLimit(e.target.value)}
              step="0.01"
              min="0"
              placeholder="Enter your monthly budget limit"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white dark:border-gray-600 ${
                errors.monthlyLimit
                  ? 'border-red-500 dark:border-red-500'
                  : 'border-gray-300'
              }`}
              aria-invalid={!!errors.monthlyLimit}
              aria-describedby={errors.monthlyLimit ? 'monthlyLimit-error' : undefined}
            />
            {errors.monthlyLimit && (
              <p
                id="monthlyLimit-error"
                className="mt-1 text-sm text-red-600 dark:text-red-400"
                role="alert"
              >
                {errors.monthlyLimit}
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            >
              Save Budget Goal
            </button>
            {budgetGoal && (
              <button
                type="button"
                onClick={handleClearGoal}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
              >
                Clear Goal
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Budget Progress */}
      <BudgetProgress />
    </div>
  );
}
