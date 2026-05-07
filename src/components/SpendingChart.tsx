import { Link } from 'react-router-dom';
import { useBudget, useCategories } from '../contexts';
import type { FinancialSummary } from '../types';
import { formatCurrency, getCategoryName } from '../utils';
import { InkStrokeBar } from './InkStrokeBar';

interface SpendingChartProps {
  summaryOverride?: FinancialSummary;
  title?: string;
}

export function SpendingChart({ summaryOverride, title = 'Spending by Category' }: SpendingChartProps) {
  const { summary } = useBudget();
  const activeSummary = summaryOverride ?? summary;
  const { categories } = useCategories();

  const categoriesWithExpenses = Object.entries(activeSummary.expensesByCategory)
    .filter(([, amount]) => (amount as number) > 0)
    .map(([categoryId, amount]) => ({
      categoryId,
      categoryName: getCategoryName(categoryId, categories),
      amount: amount as number,
      percentage: activeSummary.totalExpenses > 0 ? ((amount as number) / activeSummary.totalExpenses) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  if (categoriesWithExpenses.length === 0) {
    return (
      <div className="app-panel p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3 border-b border-[var(--app-border)] pb-3">
          <div>
            <h2 className="app-section-title text-lg">Expenses Breakdown</h2>
            <p className="mt-1 text-sm text-[var(--app-text-muted)]">{title}</p>
          </div>
        </div>
        <div className="mt-5 border border-dashed border-[var(--app-border-strong)] p-5">
          <div className="font-[var(--font-display)] text-xl uppercase leading-none">No Expenses Recorded</div>
          <p className="mt-2 text-sm text-[var(--app-text-muted)]">Add expenses to reveal the category bars.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-panel p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3 border-b border-[var(--app-border)] pb-3">
        <div>
          <h2 className="app-section-title text-lg">Expenses Breakdown</h2>
          <p className="mt-1 text-sm text-[var(--app-text-muted)]">{title}</p>
        </div>
        <Link to="/transactions" className="app-brush-link text-sm">View Report →</Link>
      </div>

      <div className="mt-4 space-y-3">
        {categoriesWithExpenses.map((item) => (
          <div key={item.categoryId} className="grid grid-cols-[76px_1fr_84px_42px] items-center gap-3" aria-label={`${item.categoryName}, ${formatCurrency(item.amount)}, ${Math.round(item.percentage)} percent of monthly expenses`}>
            <div className="text-sm font-black uppercase tracking-[0.08em]">{item.categoryName}</div>
            <div className="h-[18px]">
              <InkStrokeBar percent={item.percentage} minPercent={6} />
            </div>
            <div className="app-numeric text-right text-sm font-black">{formatCurrency(item.amount)}</div>
            <div className="app-numeric text-right text-xs font-black">{Math.round(item.percentage)}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}
