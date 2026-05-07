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
import type { Transaction } from '../types';
import { formatCurrency } from '../utils';
import {
  getMonthlyTotals,
  getBestMonth,
  getAverageSpending,
  getSpendingTrend,
  hasSufficientMonthlyData,
} from '../utils/monthlyCalculations';
import { mangaAssets } from '../lib/manga';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface MonthlySummaryProps {
  transactionsOverride?: Transaction[];
}

export function MonthlySummary({ transactionsOverride }: MonthlySummaryProps) {
  const { transactions } = useBudget();
  const activeTransactions = transactionsOverride ?? transactions;

  const monthlyTotals = useMemo(() => getMonthlyTotals(activeTransactions, 6), [activeTransactions]);
  const bestMonth = useMemo(() => getBestMonth(monthlyTotals), [monthlyTotals]);
  const averageSpending = useMemo(() => getAverageSpending(monthlyTotals), [monthlyTotals]);
  const spendingTrend = useMemo(() => getSpendingTrend(monthlyTotals), [monthlyTotals]);
  const hasData = useMemo(() => hasSufficientMonthlyData(monthlyTotals), [monthlyTotals]);

  const dateRange = useMemo(() => {
    if (monthlyTotals.length === 0) return '';
    const firstMonth = monthlyTotals[0].month;
    const lastMonth = monthlyTotals[monthlyTotals.length - 1].month;
    return `${format(new Date(firstMonth), 'MMM yyyy')} — ${format(new Date(lastMonth), 'MMM yyyy')}`;
  }, [monthlyTotals]);

  const chartData = useMemo(() => ({
    labels: monthlyTotals.map((m) => m.monthLabel),
    datasets: [
      {
        label: 'Income',
        data: monthlyTotals.map((m) => m.income),
        backgroundColor: 'rgba(216, 216, 216, 0.95)',
        borderColor: 'rgba(5, 5, 5, 1)',
        borderWidth: 1,
      },
      {
        label: 'Expenses',
        data: monthlyTotals.map((m) => m.expenses),
        backgroundColor: 'rgba(5, 5, 5, 0.95)',
        borderColor: 'rgba(5, 5, 5, 1)',
        borderWidth: 1,
      },
    ],
  }), [monthlyTotals]);

  const chartOptions: ChartOptions<'bar'> = useMemo(() => {
    const isDark = document.documentElement.classList.contains('dark');
    const textColor = isDark ? '#D8D8D8' : '#333333';
    const strongText = isDark ? '#FFFFFF' : '#050505';
    const gridColor = isDark ? '#333333' : '#D8D8D8';

    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top' as const,
          labels: { color: strongText, font: { size: 11, weight: 700 }, padding: 18, boxWidth: 10, boxHeight: 10 },
        },
        tooltip: {
          backgroundColor: isDark ? '#111111' : '#F4F1EA',
          titleColor: strongText,
          bodyColor: strongText,
          borderColor: strongText,
          borderWidth: 1,
          padding: 12,
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
        x: { grid: { display: false }, ticks: { color: textColor, font: { size: 11, weight: 700 } } },
        y: {
          beginAtZero: true,
          grid: { color: gridColor, drawBorder: false },
          ticks: {
            color: textColor,
            font: { size: 11, weight: 700 },
            callback: (value) => `₱${Number(value).toLocaleString()}`,
          },
        },
      },
    };
  }, [monthlyTotals]);

  if (!hasData) {
    return (
      <div className="app-panel p-5 sm:p-6">
        <p className="app-kicker mb-2">Six-Month Trend</p>
        <h2 className="app-section-title text-lg">Monthly Overview</h2>
        <div className="mt-5 grid gap-4 border border-dashed border-[var(--app-border-strong)] p-5 sm:grid-cols-[1fr_120px] sm:items-center">
          <div>
            <div className="font-[var(--font-display)] text-xl uppercase leading-none">Keep Tracking</div>
            <p className="mt-2 text-sm leading-6 text-[var(--app-text-muted)]">Monthly trends appear after your second month of data.</p>
          </div>
          <img src={mangaAssets.mottoSamuraiSitting} alt="Reflective samurai illustration" className="mx-auto max-h-28 w-auto object-contain opacity-80 mix-blend-multiply sm:max-h-32" />
        </div>
      </div>
    );
  }

  return (
    <div className="app-panel p-5 sm:p-6">
      <div className="mb-6 border-b app-divider pb-4">
        <p className="app-kicker mb-2">Six-Month Trend</p>
        <h2 className="app-section-title text-lg">Monthly Overview</h2>
        <p className="mt-1 text-sm text-[var(--app-text-muted)]">{dateRange}</p>
      </div>

      <div className="mb-5 h-[240px] sm:h-[320px]">
        <Bar data={chartData} options={chartOptions} />
      </div>

      <div className="mb-5 grid grid-cols-3 gap-2 sm:grid-cols-6">
        {monthlyTotals.map((month) => (
          <div key={month.month} className="app-panel-subtle p-2 text-center">
            <p className="app-numeric text-xs font-black">{month.net >= 0 ? '+' : ''}{formatCurrency(month.net)}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="app-panel-subtle p-4">
          <p className="app-kicker mb-2">Best Month</p>
          {bestMonth && (
            <>
              <p className="app-numeric break-all text-2xl font-black">{formatCurrency(bestMonth.net)}</p>
              <p className="mt-1 text-xs text-[var(--app-text-muted)]">{format(new Date(bestMonth.month), 'MMMM yyyy')}</p>
            </>
          )}
        </div>

        <div className="app-panel-subtle p-4">
          <p className="app-kicker mb-2">Average Spending</p>
          <p className="app-numeric break-all text-2xl font-black">{formatCurrency(averageSpending)}</p>
          <p className="mt-1 text-xs text-[var(--app-text-muted)]">Last 6 months</p>
        </div>

        <div className="app-panel-subtle p-4">
          <p className="app-kicker mb-2">Spending Trend</p>
          {spendingTrend ? (
            <>
              <p className="app-numeric text-2xl font-black">
                {spendingTrend.direction === 'up' ? '↑' : spendingTrend.direction === 'down' ? '↓' : '→'} {spendingTrend.percentage.toFixed(1)}%
              </p>
              <p className="mt-1 text-xs uppercase tracking-[0.08em] text-[var(--app-text-muted)]">vs last month</p>
            </>
          ) : (
            <p className="text-sm text-[var(--app-text-muted)]">Not enough data</p>
          )}
        </div>
      </div>
    </div>
  );
}
