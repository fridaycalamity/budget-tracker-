import { useMemo } from 'react';
import { format } from 'date-fns';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  type ChartOptions,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { useBudget } from '../contexts';
import { formatCurrency } from '../utils';
import {
  getMonthlyTotals,
  getBestMonth,
  getAverageSpending,
  getSpendingTrend,
  hasSufficientMonthlyData,
} from '../utils/monthlyCalculations';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

/**
 * MonthlySummary component
 * Displays a bar chart showing income vs expenses for the last 6 months
 * Includes summary statistics: best month, average spending, and spending trend
 * 
 * Features:
 * - Bar chart with income (green) and expenses (red) side by side
 * - Net difference labels above each month
 * - Responsive design (stacks on mobile)
 * - Light/dark mode support
 * - Empty state for insufficient data
 * - Smooth fade-in animation
 */
export function MonthlySummary() {
  const { transactions } = useBudget();

  // Calculate monthly data
  const monthlyTotals = useMemo(() => getMonthlyTotals(transactions, 6), [transactions]);
  const bestMonth = useMemo(() => getBestMonth(monthlyTotals), [monthlyTotals]);
  const averageSpending = useMemo(() => getAverageSpending(monthlyTotals), [monthlyTotals]);
  const spendingTrend = useMemo(() => getSpendingTrend(monthlyTotals), [monthlyTotals]);
  const hasData = useMemo(() => hasSufficientMonthlyData(monthlyTotals), [monthlyTotals]);

  // Date range for subtitle
  const dateRange = useMemo(() => {
    if (monthlyTotals.length === 0) return '';
    const firstMonth = monthlyTotals[0].month;
    const lastMonth = monthlyTotals[monthlyTotals.length - 1].month;
    return `${format(new Date(firstMonth), 'MMM yyyy')} - ${format(new Date(lastMonth), 'MMM yyyy')}`;
  }, [monthlyTotals]);

  // Chart data
  const chartData = useMemo(() => {
    return {
      labels: monthlyTotals.map((m) => m.monthLabel),
      datasets: [
        {
          label: 'Income',
          data: monthlyTotals.map((m) => m.income),
          backgroundColor: 'rgba(16, 185, 129, 0.8)', // green-500
          borderColor: 'rgba(16, 185, 129, 1)',
          borderWidth: 1,
        },
        {
          label: 'Expenses',
          data: monthlyTotals.map((m) => m.expenses),
          backgroundColor: 'rgba(239, 68, 68, 0.8)', // red-500
          borderColor: 'rgba(239, 68, 68, 1)',
          borderWidth: 1,
        },
      ],
    };
  }, [monthlyTotals]);

  // Chart options with theme support
  const chartOptions: ChartOptions<'bar'> = useMemo(() => {
    const isDark = document.documentElement.classList.contains('dark');
    const textColor = isDark ? '#9CA3AF' : '#4B5563'; // gray-400 : gray-600
    const gridColor = isDark ? '#374151' : '#E5E7EB'; // gray-700 : gray-200

    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top' as const,
          labels: {
            color: textColor,
            font: {
              size: 12,
            },
            padding: 15,
          },
        },
        tooltip: {
          backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
          titleColor: isDark ? '#F9FAFB' : '#111827',
          bodyColor: isDark ? '#D1D5DB' : '#374151',
          borderColor: isDark ? '#374151' : '#E5E7EB',
          borderWidth: 1,
          padding: 12,
          displayColors: true,
          callbacks: {
            label: (context) => {
              const label = context.dataset.label || '';
              const value = context.parsed.y;
              if (value === null) return '';
              return `${label}: ${formatCurrency(value)}`;
            },
            afterBody: (tooltipItems) => {
              const index = tooltipItems[0].dataIndex;
              const month = monthlyTotals[index];
              return `Net: ${formatCurrency(month.net)}`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: {
            display: false,
          },
          ticks: {
            color: textColor,
            font: {
              size: 11,
            },
          },
        },
        y: {
          beginAtZero: true,
          grid: {
            color: gridColor,
            drawBorder: false,
          },
          ticks: {
            color: textColor,
            font: {
              size: 11,
            },
            callback: (value) => {
              return `₱${Number(value).toLocaleString()}`;
            },
          },
        },
      },
    };
  }, [monthlyTotals]);

  // Empty state
  if (!hasData) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 animate-fadeIn">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Monthly Overview
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Track your financial trends over time
        </p>

        <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
          <svg
            className="w-16 h-16 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <p className="text-center text-lg font-medium mb-2">
            Keep tracking!
          </p>
          <p className="text-center text-sm">
            Monthly trends will appear after your second month of data.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 animate-fadeIn">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Monthly Overview
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {dateRange}
        </p>
      </div>

      {/* Chart */}
      <div className="mb-6" style={{ height: '300px' }}>
        <Bar data={chartData} options={chartOptions} />
      </div>

      {/* Net difference labels */}
      <div className="grid grid-cols-6 gap-2 mb-6">
        {monthlyTotals.map((month) => (
          <div key={month.month} className="text-center">
            <p
              className={`text-xs font-semibold ${
                month.net >= 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}
            >
              {month.net >= 0 ? '+' : ''}
              {formatCurrency(month.net)}
            </p>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Best Month */}
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <p className="text-xs font-medium text-green-800 dark:text-green-300 mb-1">
            Best Month
          </p>
          {bestMonth && (
            <>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(bestMonth.net)}
              </p>
              <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                {format(new Date(bestMonth.month), 'MMMM yyyy')}
              </p>
            </>
          )}
        </div>

        {/* Average Monthly Spending */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-xs font-medium text-blue-800 dark:text-blue-300 mb-1">
            Average Monthly Spending
          </p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {formatCurrency(averageSpending)}
          </p>
          <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
            Last 6 months
          </p>
        </div>

        {/* Spending Trend */}
        <div className="bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <p className="text-xs font-medium text-gray-800 dark:text-gray-300 mb-1">
            Spending Trend
          </p>
          {spendingTrend ? (
            <>
              <div className="flex items-center gap-2">
                <p
                  className={`text-2xl font-bold ${
                    spendingTrend.direction === 'up'
                      ? 'text-red-600 dark:text-red-400'
                      : spendingTrend.direction === 'down'
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {spendingTrend.direction === 'up' ? '↑' : spendingTrend.direction === 'down' ? '↓' : '→'}
                  {' '}
                  {spendingTrend.percentage.toFixed(1)}%
                </p>
              </div>
              <p className="text-xs text-gray-700 dark:text-gray-300 mt-1">
                vs last month
              </p>
            </>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Not enough data
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
