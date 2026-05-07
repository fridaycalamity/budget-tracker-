import { useMemo } from 'react';
import { useBudget } from '../contexts';
import { formatCurrency, getLastNDaysExpenses } from '../utils';
import type { Transaction } from '../types';
import { mangaAssets } from '../lib/manga';

interface DailyExpenseProps {
  transactionsOverride?: Transaction[];
}

export function DailyExpense({ transactionsOverride }: DailyExpenseProps) {
  const { transactions } = useBudget();
  const activeTransactions = transactionsOverride ?? transactions;

  const dailyExpenses = useMemo(() => getLastNDaysExpenses(activeTransactions, 7), [activeTransactions]);
  const todaySpend = dailyExpenses[dailyExpenses.length - 1]?.amount ?? 0;
  const weekTotal = dailyExpenses.reduce((sum, day) => sum + day.amount, 0);
  const maxDailySpend = Math.max(...dailyExpenses.map((day) => day.amount), 0);
  const hasExpenses = weekTotal > 0;

  return (
    <div className="app-panel p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3 border-b border-[var(--app-border)] pb-3">
        <div>
          <p className="app-kicker mb-2">Seven-Day Spend</p>
          <h2 className="app-section-title text-lg">Daily Expense</h2>
        </div>
        <div className="app-stamp">Last 7 Days</div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="app-panel-subtle p-4">
          <p className="app-kicker mb-2">Today's Spend</p>
          <p className="app-numeric text-2xl font-black">{formatCurrency(todaySpend)}</p>
        </div>
        <div className="app-panel-subtle p-4">
          <p className="app-kicker mb-2">This Week</p>
          <p className="app-numeric text-2xl font-black">{formatCurrency(weekTotal)}</p>
        </div>
      </div>

      {!hasExpenses ? (
        <div className="mt-5 grid gap-4 border border-dashed border-[var(--app-border-strong)] p-5 sm:grid-cols-[1fr_120px] sm:items-center">
          <div>
            <div className="font-[var(--font-display)] text-xl uppercase leading-none">No Expenses Yet</div>
            <p className="mt-2 text-sm leading-6 text-[var(--app-text-muted)]">Daily expense bars will appear once the ledger records spend.</p>
          </div>
          <img src={mangaAssets.emptyStateLoneSamurai} alt="Lone samurai empty state" className="mx-auto max-h-28 w-auto object-contain opacity-80 mix-blend-multiply sm:max-h-32" />
        </div>
      ) : (
        <div className="mt-5 space-y-2">
          {dailyExpenses.map((day) => {
            const width = maxDailySpend === 0 ? 0 : (day.amount / maxDailySpend) * 100;
            return (
              <div key={day.date} className="grid grid-cols-[38px_1fr_76px] items-center gap-3" aria-label={`${day.label} expense ${formatCurrency(day.amount)}`}>
                <span className="text-[11px] font-black uppercase tracking-[0.1em]">{day.label}</span>
                <div className="h-4 bg-[linear-gradient(90deg,rgba(0,0,0,0.05),transparent)]">
                  <div className="h-full bg-[var(--color-black)]" style={{ width: `${Math.max(width, day.amount > 0 ? 8 : 0)}%` }} />
                </div>
                <span className="app-numeric text-right text-[11px] font-black text-[var(--app-text-muted)]">{formatCurrency(day.amount)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
