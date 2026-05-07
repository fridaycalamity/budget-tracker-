import { useMemo, useState } from 'react';
import { subMonths, format } from 'date-fns';
import { useBudget } from '../contexts/BudgetContext';
import { useToast } from '../contexts/ToastContext';
import { BudgetProgress } from '../components';
import { formatCurrency } from '../utils';
import { InkStrokeBar } from '../components/InkStrokeBar';

export function BudgetGoals() {
  const { budgetGoal, setBudgetGoal, getMonthlySummary } = useBudget();
  const { showToast } = useToast();

  const [monthlyLimit, setMonthlyLimit] = useState<string>(budgetGoal?.monthlyLimit.toString() || '');
  const [selectedMonth, setSelectedMonth] = useState(() => format(new Date(), 'yyyy-MM'));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const recentMonths = useMemo(() => Array.from({ length: 6 }, (_, i) => format(subMonths(new Date(), i), 'yyyy-MM')).reverse(), []);
  const selectedSummary = useMemo(() => getMonthlySummary(selectedMonth), [getMonthlySummary, selectedMonth]);
  const monthRows = useMemo(() => recentMonths.map((month) => ({ month, summary: getMonthlySummary(month) })), [recentMonths, getMonthlySummary]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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

    setBudgetGoal({ monthlyLimit: limitValue, month: selectedMonth });
    setErrors({});
    showToast('Monthly budget limit saved successfully!', 'success');
  };

  const handleClearGoal = () => {
    setBudgetGoal(null);
    setMonthlyLimit('');
    showToast('Budget goal cleared', 'success');
  };

  return (
    <div className="space-y-4 lg:space-y-5">
      <section>
        <p className="app-kicker mb-2">Monthly Limit</p>
        <h1 className="app-page-title">Budget Goals</h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--app-text-muted)] sm:text-base">Set a monthly ceiling, inspect the current month, and compare recent pressure across the ledger.</p>
      </section>

      <div className="app-panel p-5 sm:p-6">
        <h2 className="app-section-title text-lg">Monthly Budget Limit</h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="monthlyLimit" className="mb-1 block text-[11px] font-black uppercase tracking-[0.14em] text-[var(--app-text-muted)]">Budget Limit (₱)</label>
            <input type="number" id="monthlyLimit" value={monthlyLimit} onChange={(e) => setMonthlyLimit(e.target.value)} step="0.01" min="0" placeholder="Enter your monthly budget limit" className={`app-input w-full px-4 py-3 ${errors.monthlyLimit ? 'border-[var(--app-border-strong)]' : ''}`} />
            {errors.monthlyLimit && <p className="mt-1 text-sm text-[var(--app-text)]">{errors.monthlyLimit}</p>}
          </div>

          <div className="flex flex-wrap gap-3">
            <button type="submit" className="app-button-primary px-5 text-white">Save Budget Limit</button>
            {budgetGoal && <button type="button" onClick={handleClearGoal} className="app-button-secondary px-5">Clear Goal</button>}
          </div>
        </form>
      </div>

      {budgetGoal && (
        <>
          <BudgetProgress summaryOverride={selectedSummary} title="Budget Progress" />

          <div className="app-panel p-5 sm:p-6">
            <div className="flex flex-col gap-3 border-b border-[var(--app-border)] pb-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="app-section-title text-lg">Current Month</h2>
                <p className="mt-1 text-sm text-[var(--app-text-muted)]">Inspect a specific month in detail.</p>
              </div>
              <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="app-input px-3 py-3" />
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="app-panel-subtle p-4"><div className="app-kicker mb-2">Income</div><div className="app-numeric text-2xl font-black">{formatCurrency(selectedSummary.totalIncome)}</div></div>
              <div className="app-panel-subtle p-4"><div className="app-kicker mb-2">Expenses</div><div className="app-numeric text-2xl font-black">{formatCurrency(selectedSummary.totalExpenses)}</div></div>
              <div className="app-panel-subtle p-4"><div className="app-kicker mb-2">Balance</div><div className="app-numeric text-2xl font-black">{formatCurrency(selectedSummary.balance)}</div></div>
            </div>
          </div>

          <div className="app-panel p-5 sm:p-6">
            <h2 className="app-section-title text-lg">Recent Month Progress</h2>
            <div className="mt-4 space-y-3">
              {monthRows.map(({ month, summary }) => {
                const limit = budgetGoal.monthlyLimit;
                const pctRaw = limit > 0 ? (summary.totalExpenses / limit) * 100 : 0;
                const pct = Math.min(pctRaw, 100);
                const over = summary.totalExpenses > limit;
                const label = over ? 'Over Budget' : pctRaw >= 70 ? 'Nearing Limit' : 'On Track';
                return (
                  <div key={month} className="app-panel-subtle p-4">
                    <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
                      <div>
                        <div className="font-black uppercase tracking-[0.08em]">{format(new Date(`${month}-01`), 'MMMM yyyy')}</div>
                        <div className="mt-1 text-sm text-[var(--app-text-muted)]">Spent {formatCurrency(summary.totalExpenses)} / {formatCurrency(limit)}</div>
                      </div>
                      <div className="text-right"><div className="app-stamp">{label}</div><div className="app-numeric mt-2 text-lg font-black">{pctRaw.toFixed(1)}%</div></div>
                    </div>
                    <div className="mt-3 h-4"><InkStrokeBar percent={pct} minPercent={2} /></div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
