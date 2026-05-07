import { useBudget } from '../contexts/BudgetContext';
import { useCategories } from '../contexts/CategoryContext';
import { formatCurrency, getCategoryName } from '../utils';
import type { FinancialSummary } from '../types';
import { InkStrokeBar } from './InkStrokeBar';

interface BudgetProgressProps {
  summaryOverride?: FinancialSummary;
  title?: string;
  selectedMonth?: string;
  viewMode?: 'month' | 'all';
}

function getMonthPace(selectedMonth?: string): { elapsedPercent: number; daysRemaining: number; isCurrentMonth: boolean } {
  const now = new Date();
  const fallbackMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const month = selectedMonth || fallbackMonth;
  const [year, monthIndex] = month.split('-').map(Number);
  const daysInMonth = new Date(year, monthIndex, 0).getDate();
  const isCurrentMonth = year === now.getFullYear() && monthIndex === now.getMonth() + 1;
  const elapsedDays = isCurrentMonth ? Math.min(now.getDate(), daysInMonth) : daysInMonth;

  return {
    elapsedPercent: Math.min((elapsedDays / daysInMonth) * 100, 100),
    daysRemaining: Math.max(daysInMonth - elapsedDays, 0),
    isCurrentMonth,
  };
}

function getRhythmState(percentageUsed: number, elapsedPercent: number) {
  if (percentageUsed > 100) return { label: 'OVER LIMIT', detail: 'The limit has been breached. Shift into recovery mode.' };
  if (percentageUsed <= Math.max(elapsedPercent - 12, 8)) return { label: 'AHEAD', detail: 'You are spending slower than the month is moving.' };
  if (percentageUsed >= 82 || percentageUsed > elapsedPercent + 14) return { label: 'CAUTION', detail: 'Current pace may pressure the budget before month-end.' };
  return { label: 'DISCIPLINED', detail: 'Your spending rhythm is holding close to the monthly pace.' };
}

export function BudgetProgress({ summaryOverride, title = 'Spending Rhythm', selectedMonth, viewMode = 'month' }: BudgetProgressProps) {
  const { summary, budgetGoal } = useBudget();
  const { categories } = useCategories();
  const activeSummary = summaryOverride ?? summary;

  if (!budgetGoal) {
    return (
      <div className="app-panel p-5 sm:p-6">
        <p className="app-section-title text-lg">{title}</p>
        <div className="mt-4 border border-dashed border-[var(--app-border-strong)] p-4">
          <div className="font-[var(--font-display)] text-xl uppercase leading-none">No Budget Limit Set</div>
          <p className="mt-2 text-sm text-[var(--app-text-muted)]">Set a monthly limit to track spending pressure and remaining room.</p>
        </div>
      </div>
    );
  }

  const monthlyLimit = budgetGoal.monthlyLimit;
  const totalExpenses = activeSummary.totalExpenses;
  const rawPercentage = monthlyLimit > 0 ? (totalExpenses / monthlyLimit) * 100 : 0;
  const percentage = Math.min(rawPercentage, 100);
  const remaining = Math.max(monthlyLimit - totalExpenses, 0);
  const overBudgetAmount = Math.max(totalExpenses - monthlyLimit, 0);
  const pacing = getMonthPace(selectedMonth);
  const state = getRhythmState(rawPercentage, viewMode === 'month' ? pacing.elapsedPercent : 100);
  const dailySafeSpend = viewMode === 'month' && pacing.daysRemaining > 0 ? remaining / pacing.daysRemaining : remaining;
  const topCategory = Object.entries(activeSummary.expensesByCategory)
    .filter(([, amount]) => amount > 0)
    .sort((a, b) => b[1] - a[1])[0];
  const topCategoryShare = topCategory && totalExpenses > 0 ? (topCategory[1] / totalExpenses) * 100 : 0;
  const ringRadius = 42;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference - (percentage / 100) * ringCircumference;

  return (
    <div className="app-panel p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3 border-b border-[var(--app-border)] pb-3">
        <div>
          <p className="app-section-title text-lg">{title}</p>
          <p className="mt-1 text-[11px] font-black uppercase tracking-[0.16em] text-[var(--app-text-muted)]">Financial discipline tracker</p>
        </div>
        <span className="app-stamp">{state.label}</span>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-[116px_minmax(0,1fr)] sm:items-center">
        <div className="mx-auto flex h-[116px] w-[116px] items-center justify-center sm:mx-0" aria-hidden="true">
          <svg viewBox="0 0 112 112" className="h-full w-full -rotate-90">
            <circle cx="56" cy="56" r={ringRadius} fill="none" stroke="rgba(5,5,5,0.14)" strokeWidth="10" />
            <circle
              cx="56"
              cy="56"
              r={ringRadius}
              fill="none"
              stroke="var(--color-black)"
              strokeWidth="10"
              strokeLinecap="butt"
              strokeDasharray={ringCircumference}
              strokeDashoffset={ringOffset}
              className="transition-[stroke-dashoffset] duration-700 ease-out"
            />
          </svg>
          <div className="app-numeric absolute text-2xl font-black">{Math.round(rawPercentage)}%</div>
        </div>

        <div className="min-w-0">
          <div className="h-5" role="progressbar" aria-label="Budget usage percentage" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Number(Math.min(rawPercentage, 100).toFixed(0))}>
            <InkStrokeBar percent={percentage} minPercent={2} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 text-sm sm:gap-x-5">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--app-text-muted)]">Monthly Limit</div>
              <div className="app-numeric mt-1 text-lg font-black">{formatCurrency(monthlyLimit)}</div>
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--app-text-muted)]">Spent</div>
              <div className="app-numeric mt-1 text-lg font-black">{formatCurrency(totalExpenses)}</div>
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--app-text-muted)]">Remaining</div>
              <div className="app-numeric mt-1 text-lg font-black">{formatCurrency(remaining)}</div>
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--app-text-muted)]">Daily Safe Spend</div>
              <div className="app-numeric mt-1 text-lg font-black">{formatCurrency(dailySafeSpend)}<span className="text-xs tracking-normal">/day</span></div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 border-t border-[var(--app-border)] pt-3 text-sm sm:grid-cols-2">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--app-text-muted)]">Month Pace</div>
          <p className="mt-1 leading-6 text-[var(--app-text-muted)]"><span className="app-numeric font-black text-[var(--app-text)]">{Math.round(rawPercentage)}%</span> budget used{viewMode === 'month' && <> • <span className="app-numeric font-black text-[var(--app-text)]">{Math.round(pacing.elapsedPercent)}%</span> of month completed</>}.</p>
        </div>
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--app-text-muted)]">Category Pressure</div>
          <p className="mt-1 leading-6 text-[var(--app-text-muted)]">
            {topCategory ? <>{getCategoryName(topCategory[0], categories)} • <span className="app-numeric font-black text-[var(--app-text)]">{Math.round(topCategoryShare)}%</span></> : 'No expense pressure detected yet.'}
          </p>
        </div>
      </div>

      <div className="mt-3 border-t border-[var(--app-border)] pt-3">
        <p className="text-sm leading-6 text-[var(--app-text-muted)]">
          {overBudgetAmount > 0 ? <>You exceeded the limit by <span className="app-numeric font-black text-[var(--app-text)]">{formatCurrency(overBudgetAmount)}</span>. {state.detail}</> : state.detail}
        </p>
      </div>
    </div>
  );
}
