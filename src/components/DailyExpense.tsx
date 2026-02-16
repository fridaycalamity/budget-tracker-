import { useMemo } from 'react';
import { useBudget } from '../contexts';
import { formatCurrency, getLastNDaysExpenses } from '../utils';

export function DailyExpense() {
  const { transactions } = useBudget();

  const dailyExpenses = useMemo(() => getLastNDaysExpenses(transactions, 7), [transactions]);
  const todaySpend = dailyExpenses[dailyExpenses.length - 1]?.amount ?? 0;
  const weekTotal = dailyExpenses.reduce((sum, day) => sum + day.amount, 0);
  const maxDailySpend = Math.max(...dailyExpenses.map((day) => day.amount), 0);
  const hasExpenses = weekTotal > 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 transition-colors duration-200">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Daily Expense
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <p className="text-xs font-medium text-red-800 dark:text-red-300 mb-1">Today&apos;s spend</p>
          <p className="text-xl font-bold text-red-600 dark:text-red-400">{formatCurrency(todaySpend)}</p>
        </div>
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
          <p className="text-xs font-medium text-orange-800 dark:text-orange-300 mb-1">This week</p>
          <p className="text-xl font-bold text-orange-600 dark:text-orange-400">{formatCurrency(weekTotal)}</p>
        </div>
      </div>

      {!hasExpenses ? (
        <div className="py-4 text-center text-gray-500 dark:text-gray-400">No expenses yet</div>
      ) : (
        <div className="w-full">
          <div className="h-28 flex items-end justify-between gap-2">
            {dailyExpenses.map((day) => {
              const height = maxDailySpend === 0 ? 0 : (day.amount / maxDailySpend) * 100;

              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-2 min-w-0">
                  <div className="w-full h-20 flex items-end">
                    <div
                      className="w-full rounded-t bg-red-500/80 dark:bg-red-400 transition-all duration-200"
                      style={{ height: `${Math.max(height, day.amount > 0 ? 8 : 0)}%` }}
                      aria-label={`${day.label} expense ${formatCurrency(day.amount)}`}
                    />
                  </div>
                  <span className="text-xs text-gray-600 dark:text-gray-400">{day.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
