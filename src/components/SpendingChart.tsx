import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { useBudget, useCategories } from '../contexts';
import { useTheme } from '../contexts/ThemeContext';
import { formatCurrency, getCategoryColor, getCategoryName, getCategoryIcon } from '../utils';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

/**
 * SpendingChart component
 * Displays a doughnut chart visualizing expenses by category
 * Uses data from BudgetContext and handles empty state gracefully
 * 
 * Requirements: 1.4
 */
export function SpendingChart() {
  const { summary } = useBudget();
  const { categories } = useCategories();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const textColor = isDark ? '#E5E7EB' : '#111827';

  // Filter out categories with zero expenses and prepare chart data
  const categoriesWithExpenses = Object.entries(summary.expensesByCategory)
    .filter(([, amount]) => (amount as number) > 0)
    .map(([categoryId, amount]) => ({
      categoryId,
      categoryName: getCategoryName(categoryId, categories),
      categoryIcon: getCategoryIcon(categoryId, categories),
      categoryColor: getCategoryColor(categoryId, categories),
      amount: amount as number,
    }));

  // Handle empty data state
  if (categoriesWithExpenses.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 transition-colors duration-200">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Spending by Category
        </h2>
        <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
          <svg
            className="w-16 h-16 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"
            />
          </svg>
          <p className="text-center">
            No expense data to display.
            <br />
            Add some expenses to see your spending breakdown.
          </p>
        </div>
      </div>
    );
  }

  // Prepare data for Chart.js
  const chartData = {
    labels: categoriesWithExpenses.map((item) => `${item.categoryIcon} ${item.categoryName}`),
    datasets: [
      {
        label: 'Expenses',
        data: categoriesWithExpenses.map((item) => item.amount),
        backgroundColor: categoriesWithExpenses.map((item) => item.categoryColor),
        borderColor: categoriesWithExpenses.map(() => isDark ? '#1f2937' : '#ffffff'),
        borderWidth: 2,
        hoverOffset: 4,
      },
    ],
  };

  // Chart options
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
        position: 'bottom' as const,
        labels: {
          padding: 15,
          font: {
            size: 12,
          },
          color: textColor,
        },
      },
      tooltip: {
        backgroundColor: isDark ? '#1f2937' : '#ffffff',
        titleColor: textColor,
        bodyColor: textColor,
        borderColor: isDark ? '#374151' : '#e5e7eb',
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        callbacks: {
          label: (context: { label?: string; parsed: number; dataset: { data: number[] } }) => {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((acc: number, val: number) => acc + val, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${formatCurrency(value)} (${percentage}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 transition-colors duration-200">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 sm:mb-6">
        Spending by Category
      </h2>

      <div className="flex flex-col lg:flex-row lg:items-center gap-4 sm:gap-6">
        <div className="w-full max-w-[360px] h-[240px] sm:h-[280px] mx-auto">
          <Doughnut data={chartData} options={options} />
        </div>

        <ul className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
          {categoriesWithExpenses.map((item) => (
            <li
              key={item.categoryId}
              className="flex items-center justify-between gap-3 text-sm text-gray-700 dark:text-gray-200"
            >
              <span className="flex items-center gap-2 min-w-0">
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.categoryColor }}
                  aria-hidden="true"
                />
                <span className="truncate">{item.categoryIcon} {item.categoryName}</span>
              </span>
              <span className="font-medium whitespace-nowrap">{formatCurrency(item.amount)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
