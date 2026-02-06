import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { useBudget } from '../contexts';
import { useTheme } from '../contexts/ThemeContext';
import { formatCurrency } from '../utils';
import type { TransactionCategory } from '../types';

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
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Define colors for each category (distinct, accessible colors)
  const categoryColors: Record<TransactionCategory, string> = {
    Food: '#ef4444', // red-500
    Transport: '#3b82f6', // blue-500
    Bills: '#f59e0b', // amber-500
    Entertainment: '#8b5cf6', // violet-500
    Salary: '#10b981', // emerald-500
    Freelance: '#06b6d4', // cyan-500
    Shopping: '#ec4899', // pink-500
    Healthcare: '#14b8a6', // teal-500
    Education: '#6366f1', // indigo-500
    Other: '#6b7280', // gray-500
  };

  // Filter out categories with zero expenses and prepare chart data
  const categoriesWithExpenses = Object.entries(summary.expensesByCategory)
    .filter(([, amount]) => (amount as number) > 0)
    .map(([category, amount]) => ({
      category: category as TransactionCategory,
      amount: amount as number,
    }));

  // Handle empty data state
  if (categoriesWithExpenses.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors duration-200">
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
    labels: categoriesWithExpenses.map((item) => item.category),
    datasets: [
      {
        label: 'Expenses',
        data: categoriesWithExpenses.map((item) => item.amount),
        backgroundColor: categoriesWithExpenses.map((item) => categoryColors[item.category]),
        borderColor: categoriesWithExpenses.map(() => isDark ? '#1f2937' : '#ffffff'),
        borderWidth: 2,
        hoverOffset: 4,
      },
    ],
  };

  // Chart options
  const options = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 15,
          font: {
            size: 12,
          },
          color: isDark ? '#e5e7eb' : '#374151',
          generateLabels: (chart: ChartJS) => {
            const data = chart.data;
            if (data.labels && data.datasets.length) {
              return data.labels.map((label, i) => {
                const value = data.datasets[0].data[i] as number;
                const backgroundColor = data.datasets[0].backgroundColor as string[];
                return {
                  text: `${label}: ${formatCurrency(value)}`,
                  fillStyle: backgroundColor[i],
                  hidden: false,
                  index: i,
                };
              });
            }
            return [];
          },
        },
      },
      tooltip: {
        backgroundColor: isDark ? '#1f2937' : '#ffffff',
        titleColor: isDark ? '#e5e7eb' : '#111827',
        bodyColor: isDark ? '#e5e7eb' : '#111827',
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
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors duration-200">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
        Spending by Category
      </h2>
      <div className="relative" style={{ maxHeight: '400px' }}>
        <Doughnut data={chartData} options={options} />
      </div>
    </div>
  );
}
