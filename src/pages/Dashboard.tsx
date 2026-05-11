import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { addMonths, format } from 'date-fns';
import { useBudget, useCategories } from '../contexts';
import { BudgetProgress } from '../components/BudgetProgress';
import { CategoryIcon } from '../components/CategoryIcon';
import { formatCurrency, getCategoryName } from '../utils';
import { getSourceMonogram, mangaAssets } from '../lib/manga';
import type { Category, FinancialSummary, Subscription, Transaction } from '../types';

type DashboardInsight = {
  label: string;
  headline: string;
  detail: string;
};

function percentChange(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return ((current - previous) / previous) * 100;
}

function getExpenseCategoryTotals(txns: Transaction[]) {
  return txns.reduce<Record<string, number>>((totals, transaction) => {
    if (transaction.type !== 'expense') return totals;
    totals[transaction.category] = (totals[transaction.category] || 0) + transaction.amount;
    return totals;
  }, {});
}

function getCategorySubtitle(name: string): string {
  const normalized = name.toLowerCase();
  if (normalized.includes('food') || normalized.includes('dining')) return 'Meals and daily fuel';
  if (normalized.includes('transport') || normalized.includes('angkas') || normalized.includes('grab')) return 'Movement and fares';
  if (normalized.includes('aki')) return 'Shared / partner spending';
  if (normalized.includes('subscription')) return 'Recurring commitments';
  if (normalized.includes('bill')) return 'Fixed obligations';
  if (normalized.includes('other')) return 'Unclassified pressure';
  return 'Category pressure';
}

function formatRelativeLedgerDate(date: string): string {
  const today = new Date();
  const target = new Date(`${date}T12:00:00`);
  const todayMidday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12);
  const diffDays = Math.round((todayMidday.getTime() - target.getTime()) / 86_400_000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays > 1 && diffDays <= 6) return `${diffDays} days ago`;
  return format(target, 'MMM d');
}

function getTransactionGroupLabel(date: string): string {
  const relative = formatRelativeLedgerDate(date);
  if (relative === 'Today' || relative === 'Yesterday') return relative;
  if (relative.endsWith('days ago')) return 'Earlier This Week';
  return format(new Date(`${date}T12:00:00`), 'MMM yyyy');
}

function getTransactionMark(transaction: Transaction): string {
  if (transaction.description.toLowerCase().includes('subscription')) return 'S';
  return transaction.type === 'income' ? 'I' : 'E';
}

function buildDashboardInsights({
  activeTransactions,
  previousTransactions,
  activeSummary,
  previousSummary,
  categories,
  subscriptions,
  viewMode,
  selectedMonth,
}: {
  activeTransactions: Transaction[];
  previousTransactions: Transaction[];
  activeSummary: FinancialSummary;
  previousSummary: FinancialSummary | null;
  categories: Category[];
  subscriptions: Subscription[];
  viewMode: 'month' | 'all';
  selectedMonth: string;
}): DashboardInsight[] {
  const insights: DashboardInsight[] = [];
  const expenseTransactions = activeTransactions.filter((t) => t.type === 'expense');
  const incomeTransactions = activeTransactions.filter((t) => t.type === 'income');
  const periodLabel = viewMode === 'month' ? format(new Date(`${selectedMonth}-01`), 'MMMM') : 'the full ledger';

  if (activeTransactions.length < 3) {
    return [{
      label: 'Quiet Ledger',
      headline: viewMode === 'month' ? 'More entries will reveal the month.' : 'More records will sharpen the ledger.',
      detail: 'Add a few income and expense records to unlock spending rhythm, category movement, and cash-flow observations.',
    }];
  }

  if (activeSummary.totalIncome > 0 && activeSummary.totalExpenses > 0) {
    const ratio = (activeSummary.totalExpenses / activeSummary.totalIncome) * 100;
    if (activeSummary.totalIncome >= activeSummary.totalExpenses) {
      const surplus = ((activeSummary.totalIncome - activeSummary.totalExpenses) / activeSummary.totalIncome) * 100;
      insights.push({
        label: 'Cash Flow',
        headline: `Income stayed ahead by ${Math.round(surplus)}%.`,
        detail: `For ${periodLabel}, expenses used ${Math.round(ratio)}% of recorded income — the ledger is still holding ground.`,
      });
    } else {
      const overrun = ((activeSummary.totalExpenses - activeSummary.totalIncome) / activeSummary.totalIncome) * 100;
      insights.push({
        label: 'Cash Flow',
        headline: `Expenses outpaced income by ${Math.round(overrun)}%.`,
        detail: `The period is leaning defensive. Review the largest categories before adding new commitments.`,
      });
    }
  }

  const topCategory = Object.entries(activeSummary.expensesByCategory)
    .filter(([, amount]) => amount > 0)
    .sort((a, b) => b[1] - a[1])[0];
  if (topCategory && activeSummary.totalExpenses > 0) {
    const [categoryId, amount] = topCategory;
    const share = (amount / activeSummary.totalExpenses) * 100;
    insights.push({
      label: 'Top Category',
      headline: `${getCategoryName(categoryId, categories)} led spending at ${Math.round(share)}%.`,
      detail: `${formatCurrency(amount)} moved through this category, making it the clearest pressure point in the current range.`,
    });
  }

  if (viewMode === 'month' && previousSummary) {
    const currentTotals = getExpenseCategoryTotals(activeTransactions);
    const previousTotals = getExpenseCategoryTotals(previousTransactions);
    const risingCategory = Object.entries(currentTotals)
      .map(([categoryId, amount]) => ({ categoryId, amount, change: percentChange(amount, previousTotals[categoryId] || 0) }))
      .filter((item): item is { categoryId: string; amount: number; change: number } => item.change !== null && item.change >= 10)
      .sort((a, b) => b.change - a.change)[0];

    if (risingCategory) {
      insights.push({
        label: 'Monthly Movement',
        headline: `${getCategoryName(risingCategory.categoryId, categories)} rose ${Math.round(risingCategory.change)}%.`,
        detail: `Compared with the previous month, this category is moving faster than the rest of the ledger.`,
      });
    } else if (previousSummary.totalExpenses > 0) {
      const expenseChange = percentChange(activeSummary.totalExpenses, previousSummary.totalExpenses);
      if (expenseChange !== null && Math.abs(expenseChange) >= 5) {
        insights.push({
          label: 'Monthly Movement',
          headline: `Expenses ${expenseChange > 0 ? 'increased' : 'decreased'} by ${Math.round(Math.abs(expenseChange))}%.`,
          detail: `This month is ${expenseChange > 0 ? 'heavier' : 'lighter'} than the previous one across recorded spending.`,
        });
      }
    }
  }

  if (expenseTransactions.length >= 4) {
    const weekendCount = expenseTransactions.filter((transaction) => {
      const day = new Date(`${transaction.date}T12:00:00`).getDay();
      return day === 0 || day === 6;
    }).length;
    const weekendShare = (weekendCount / expenseTransactions.length) * 100;
    if (weekendShare >= 35) {
      insights.push({
        label: 'Spending Rhythm',
        headline: `${Math.round(weekendShare)}% of expenses happened on weekends.`,
        detail: 'Weekend transactions are shaping the period. Keep leisure and travel entries especially precise.',
      });
    }
  }

  const activeSubscriptions = subscriptions.filter((subscription) => subscription.isEnabled);
  if (activeSubscriptions.length > 0) {
    const subscriptionTotal = activeSubscriptions.reduce((total, subscription) => total + subscription.amount, 0);
    insights.push({
      label: 'Recurring Watch',
      headline: `${activeSubscriptions.length} active subscription${activeSubscriptions.length === 1 ? '' : 's'} require attention.`,
      detail: `${formatCurrency(subscriptionTotal)} is committed through recurring expenses before flexible spending begins.`,
    });
  }

  if (incomeTransactions.length > 0 && expenseTransactions.length > 0) {
    insights.push({
      label: 'Ledger Activity',
      headline: `${activeTransactions.length} entries shaped this range.`,
      detail: `${incomeTransactions.length} income record${incomeTransactions.length === 1 ? '' : 's'} and ${expenseTransactions.length} expense record${expenseTransactions.length === 1 ? '' : 's'} define the current balance.`,
    });
  }

  return insights.slice(0, 7);
}

export function Dashboard() {
  const { summary, transactions, getMonthlySummary, balanceSources, subscriptions } = useBudget();
  const { categories } = useCategories();
  const [viewMode, setViewMode] = useState<'month' | 'all'>(() => {
    return (localStorage.getItem('dashboard_view_mode') as 'month' | 'all') || 'month';
  });
  const [selectedMonth, setSelectedMonth] = useState(() => {
    return localStorage.getItem('dashboard_selected_month') || format(new Date(), 'yyyy-MM');
  });

  useEffect(() => {
    const hasPersistedMonth = !!localStorage.getItem('dashboard_selected_month');
    if (hasPersistedMonth || transactions.length === 0) return;
    const hasCurrentMonthData = transactions.some((t) => t.date.startsWith(selectedMonth));
    if (!hasCurrentMonthData) {
      const latestMonth = [...transactions]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
        ?.date.slice(0, 7);
      if (latestMonth) setSelectedMonth(latestMonth);
    }
  }, [transactions, selectedMonth]);

  const activeTransactions = useMemo(() => {
    if (viewMode === 'all') return transactions;
    return transactions.filter((t) => t.date.startsWith(selectedMonth));
  }, [transactions, viewMode, selectedMonth]);

  const activeSummary = useMemo(() => {
    return viewMode === 'all' ? summary : getMonthlySummary(selectedMonth);
  }, [viewMode, summary, getMonthlySummary, selectedMonth]);

  const previousMonthSummary = useMemo(() => {
    if (viewMode !== 'month') return null;
    const previousMonth = format(addMonths(new Date(`${selectedMonth}-01`), -1), 'yyyy-MM');
    return getMonthlySummary(previousMonth);
  }, [getMonthlySummary, selectedMonth, viewMode]);

  const previousMonthTransactions = useMemo(() => {
    if (viewMode !== 'month') return [];
    const previousMonth = format(addMonths(new Date(`${selectedMonth}-01`), -1), 'yyyy-MM');
    return transactions.filter((t) => t.date.startsWith(previousMonth));
  }, [transactions, selectedMonth, viewMode]);

  const [insightPage, setInsightPage] = useState(0);
  const insights = useMemo(() => buildDashboardInsights({
    activeTransactions,
    previousTransactions: previousMonthTransactions,
    activeSummary,
    previousSummary: previousMonthSummary,
    categories,
    subscriptions,
    viewMode,
    selectedMonth,
  }), [activeTransactions, previousMonthTransactions, activeSummary, previousMonthSummary, categories, subscriptions, viewMode, selectedMonth]);
  const visibleInsights = useMemo(() => {
    if (insights.length <= 3) return insights;
    return [0, 1, 2].map((offset) => insights[(insightPage + offset) % insights.length]);
  }, [insights, insightPage]);

  useEffect(() => {
    setInsightPage(0);
  }, [selectedMonth, viewMode, transactions.length]);

  useEffect(() => {
    if (insights.length <= 3) return;
    const timer = window.setInterval(() => {
      setInsightPage((page) => (page + 1) % insights.length);
    }, 8000);
    return () => window.clearInterval(timer);
  }, [insights.length]);

  const balanceChange = previousMonthSummary ? activeSummary.balance - previousMonthSummary.balance : 0;
  const balanceChangePercent = previousMonthSummary && previousMonthSummary.balance !== 0
    ? (balanceChange / Math.abs(previousMonthSummary.balance)) * 100
    : null;

  const recentTransactions = useMemo(() => {
    return [...activeTransactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [activeTransactions]);

  const expenseBreakdown = useMemo(() => {
    const total = activeSummary.totalExpenses;
    return Object.entries(activeSummary.expensesByCategory)
      .filter(([, amount]) => amount > 0)
      .map(([categoryId, amount]) => {
        const name = getCategoryName(categoryId, categories);
        return {
          categoryId,
          name,
          subtitle: getCategorySubtitle(name),
          amount,
          percent: total > 0 ? (amount / total) * 100 : 0,
        };
      })
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [activeSummary.expensesByCategory, activeSummary.totalExpenses, categories]);

  const todayExpense = useMemo(() => {
    const todayKey = format(new Date(), 'yyyy-MM-dd');
    return transactions
      .filter((transaction) => transaction.type === 'expense' && transaction.date === todayKey)
      .reduce((total, transaction) => total + transaction.amount, 0);
  }, [transactions]);

  const expenseInsight = useMemo(() => {
    const top = expenseBreakdown[0];
    if (!top) return null;

    if (viewMode === 'month' && previousMonthSummary?.totalExpenses) {
      const change = percentChange(activeSummary.totalExpenses, previousMonthSummary.totalExpenses);
      if (change !== null && Math.abs(change) >= 5) {
        return `Expenses ${change > 0 ? 'increased' : 'decreased'} by ${Math.round(Math.abs(change))}% compared to last month.`;
      }
    }

    return `Largest spending category: ${top.name} • ${Math.round(top.percent)}%.`;
  }, [activeSummary.totalExpenses, expenseBreakdown, previousMonthSummary, viewMode]);

  const sourceBalances = useMemo(() => {
    const map = activeSummary.balanceBySource || {};
    const grouped = new Map<string, { id: string; name: string; balance: number }>();

    for (const source of balanceSources) {
      const key = source.name.trim().toLowerCase();
      const existing = grouped.get(key);
      const balance = map[source.id] || 0;

      if (existing) {
        existing.balance += balance;
      } else {
        grouped.set(key, {
          id: source.id,
          name: source.name,
          balance,
        });
      }
    }

    return Array.from(grouped.values());
  }, [activeSummary.balanceBySource, balanceSources]);

  const recentTransactionGroups = useMemo(() => {
    const groups = new Map<string, Transaction[]>();
    for (const transaction of recentTransactions) {
      const label = getTransactionGroupLabel(transaction.date);
      groups.set(label, [...(groups.get(label) ?? []), transaction]);
    }
    return Array.from(groups.entries()).map(([label, items]) => ({ label, items }));
  }, [recentTransactions]);

  const unassignedTransactions = useMemo(
    () => activeTransactions.filter((transaction) => !transaction.balanceSourceId),
    [activeTransactions]
  );

  const shiftMonth = (delta: number) => {
    const next = format(addMonths(new Date(`${selectedMonth}-01`), delta), 'yyyy-MM');
    setSelectedMonth(next);
    localStorage.setItem('dashboard_selected_month', next);
  };

  const switchView = (mode: 'month' | 'all') => {
    setViewMode(mode);
    localStorage.setItem('dashboard_view_mode', mode);
  };

  const heroLabel = viewMode === 'month' ? 'End Balance' : 'All-Time Balance';

  return (
    <div className="space-y-4 lg:space-y-5">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="app-kicker mb-2">Monthly Ledger</p>
          <h1 className="app-page-title">Dashboard</h1>
          <p className="mt-2 max-w-2xl text-sm text-[var(--app-text-muted)] sm:text-base">A monochrome ledger view of your balances, account sources, spending rhythm, and latest entries.</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
          {viewMode === 'month' && (
            <div className="grid grid-cols-[44px_minmax(0,1fr)_44px] items-center gap-2 sm:flex sm:items-center">
              <button onClick={() => shiftMonth(-1)} className="app-button-secondary px-3" aria-label="Previous month">←</button>
              <button className="app-button-secondary min-w-0 px-3 app-numeric sm:min-w-[160px]">{format(new Date(`${selectedMonth}-01`), 'MMMM yyyy')}</button>
              <button onClick={() => shiftMonth(1)} className="app-button-secondary px-3" aria-label="Next month">→</button>
            </div>
          )}

          <div className="grid w-full grid-cols-2 border border-[var(--app-border-strong)] sm:inline-grid sm:w-auto">
            <button onClick={() => switchView('month')} className={`min-h-11 px-3 py-2 text-center text-sm font-extrabold uppercase tracking-[0.1em] sm:px-4 sm:tracking-[0.12em] ${viewMode === 'month' ? 'bg-[var(--color-black)] text-white' : 'text-[var(--app-text)]'}`}>Monthly</button>
            <button onClick={() => switchView('all')} className={`min-h-11 px-3 py-2 text-center text-sm font-extrabold uppercase tracking-[0.1em] sm:px-4 sm:tracking-[0.12em] ${viewMode === 'all' ? 'bg-[var(--color-black)] text-white' : 'text-[var(--app-text)]'}`}>All-Time</button>
          </div>
        </div>
      </section>

      <section className="grid gap-3 xl:grid-cols-[minmax(0,2fr)_minmax(320px,0.9fr)]">
        <div className="app-panel ink-overlay min-h-[220px] p-5 sm:p-6">
          <div className="relative z-10 max-w-[76%] sm:max-w-[54%]">
            <p className="app-section-title text-lg">Total Balance</p>
            <p className="mt-2 text-[11px] font-black uppercase tracking-[0.16em] text-[var(--app-text-muted)]">{heroLabel}</p>
            <p className="app-numeric mt-4 text-[2.85rem] leading-none sm:text-[4.35rem] lg:text-[4.9rem]">{formatCurrency(activeSummary.balance)}</p>
            <div className="mt-4 inline-flex max-w-full flex-wrap items-center gap-2 bg-[var(--color-black)] px-3 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-white">
              {viewMode === 'month' ? (
                <>
                  <span>Vs Last Month</span>
                  <span className="app-numeric">{balanceChange >= 0 ? '+' : '-'}{formatCurrency(Math.abs(balanceChange))}</span>
                  {balanceChangePercent !== null && <span>({balanceChangePercent >= 0 ? '+' : '-'}{Math.abs(balanceChangePercent).toFixed(2)}%)</span>}
                </>
              ) : (
                <span>All Recorded Transactions</span>
              )}
            </div>
          </div>
          <div className="pointer-events-none absolute inset-0 bg-right-bottom bg-cover bg-no-repeat opacity-[0.42] sm:opacity-[0.58] mix-blend-multiply" style={{ backgroundImage: `url(${mangaAssets.heroKatanaField})` }} aria-hidden="true" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(244,241,234,0.82)_0%,rgba(244,241,234,0.74)_32%,rgba(244,241,234,0.38)_58%,rgba(244,241,234,0.2)_100%)] sm:bg-[linear-gradient(90deg,rgba(244,241,234,0.94)_0%,rgba(244,241,234,0.88)_36%,rgba(244,241,234,0.12)_70%,rgba(244,241,234,0.01)_100%)]" aria-hidden="true" />
        </div>

        <div className="app-panel p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3 border-b border-[var(--app-border)] pb-3">
            <div>
              <p className="app-section-title text-lg">Accounts & Wallets</p>
              <p className="mt-1 text-sm text-[var(--app-text-muted)]">Source balances</p>
            </div>
            <Link to="/settings" className="app-brush-link text-sm">View All →</Link>
          </div>

          <div className="mt-3 space-y-0.5">
            {sourceBalances.length > 0 ? sourceBalances.map((source) => (
              <div key={source.id} className="grid grid-cols-[30px_1fr_auto] items-center gap-3 border-b border-[var(--app-border)] py-2.5 last:border-b-0">
                <div className="flex h-8 w-8 items-center justify-center text-[11px] font-black uppercase tracking-[0.08em]">{getSourceMonogram(source.name)}</div>
                <div className="min-w-0 text-sm font-black uppercase tracking-[0.08em]">{source.name}</div>
                <div className="app-numeric text-right text-base font-black">{formatCurrency(source.balance)}</div>
              </div>
            )) : (
              <div className="border border-dashed border-[var(--app-border-strong)] p-4 text-sm text-[var(--app-text-muted)]">No balance sources yet. Add GCash, GoTyme Bank, BPI, or Cash in Settings.</div>
            )}

            {unassignedTransactions.length > 0 && (
              <div className="border-t border-[var(--app-border)] pt-3">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <div>
                    <div className="font-black uppercase tracking-[0.08em]">Unassigned</div>
                    <div className="text-[11px] uppercase tracking-[0.14em] text-[var(--app-text-muted)]">{unassignedTransactions.length} transaction{unassignedTransactions.length === 1 ? '' : 's'} need source</div>
                  </div>
                  <Link to="/settings" className="app-brush-link text-sm">Reconcile →</Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2">
        <div className="app-panel ink-overlay min-h-[136px] p-5">
          <div className="relative z-10">
            <p className="app-section-title text-lg">Total Income</p>
            <p className="app-numeric mt-4 text-4xl leading-none sm:text-5xl">{formatCurrency(activeSummary.totalIncome)}</p>
            <p className="mt-2 text-[11px] font-black uppercase tracking-[0.18em] text-[var(--app-text-muted)]">This {viewMode === 'month' ? 'Month' : 'Ledger'}</p>
          </div>
          <div className="pointer-events-none absolute inset-0 bg-right-center bg-cover bg-no-repeat opacity-[0.14] mix-blend-multiply" style={{ backgroundImage: `url(${mangaAssets.inkBird})` }} />
        </div>

        <div className="app-panel ink-overlay min-h-[136px] p-5">
          <div className="relative z-10">
            <p className="app-section-title text-lg">Total Expenses</p>
            <p className="app-numeric mt-4 text-4xl leading-none sm:text-5xl">{formatCurrency(activeSummary.totalExpenses)}</p>
            <p className="mt-2 text-[11px] font-black uppercase tracking-[0.18em] text-[var(--app-text-muted)]">This {viewMode === 'month' ? 'Month' : 'Ledger'}</p>
            <div className="mt-3 flex items-center justify-between gap-3 border-t border-[var(--app-border)] pt-3 text-[11px] font-black uppercase tracking-[0.14em] text-[var(--app-text-muted)]">
              <span>Daily Expense</span>
              <span className="app-numeric text-base leading-none text-[var(--app-text)] sm:text-lg">{formatCurrency(todayExpense)}</span>
            </div>
          </div>
          <div className="pointer-events-none absolute inset-0 bg-right-center bg-cover bg-no-repeat opacity-[0.15] mix-blend-multiply" style={{ backgroundImage: `url(${mangaAssets.inkMountains})` }} />
        </div>
      </section>

      <section className="grid gap-3 xl:grid-cols-[minmax(0,1.3fr)_minmax(360px,1fr)]">
        <div className="app-panel p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3 border-b border-[var(--app-border)] pb-3">
            <div>
              <p className="app-section-title text-lg">Expenses Breakdown</p>
              <p className="mt-1 text-sm text-[var(--app-text-muted)]">Spending by category</p>
            </div>
            <Link to="/transactions" className="app-brush-link text-sm">View Report →</Link>
          </div>

          {expenseBreakdown.length === 0 ? (
            <div className="mt-5 grid gap-4 border border-dashed border-[var(--app-border-strong)] p-5 sm:grid-cols-[1fr_120px] sm:items-center">
              <div>
                <div className="font-[var(--font-display)] text-xl uppercase leading-none">No Expenses Recorded</div>
                <p className="mt-2 text-sm text-[var(--app-text-muted)]">This month has no expense transactions yet.</p>
              </div>
              <button className="app-button-primary px-4" onClick={() => window.dispatchEvent(new CustomEvent('open-add-transaction'))}>Add Expense</button>
            </div>
          ) : (
            <div className="mt-4 min-w-0 space-y-3">
                {expenseInsight && (
                  <div className="border border-[var(--app-border)] bg-[rgba(255,255,255,0.2)] px-3 py-2 text-xs font-black uppercase leading-5 tracking-[0.12em] text-[var(--app-text-muted)]">
                    {expenseInsight}
                  </div>
                )}
                {expenseBreakdown.map((item, index) => (
                  <div key={item.categoryId} className="group border-b border-[var(--app-border)] py-2.5 first:pt-1 last:border-b-0 last:pb-0" aria-label={`${item.name}, ${formatCurrency(item.amount)}, ${Math.round(item.percent)} percent of monthly expenses`}>
                    <div className="grid grid-cols-[22px_34px_minmax(0,1fr)_auto] items-center gap-2.5 sm:grid-cols-[26px_40px_minmax(0,1fr)_auto] sm:gap-3">
                      <span className="app-numeric text-xs font-black text-[var(--app-text-muted)]">{String(index + 1).padStart(2, '0')}</span>
                      <div className="flex h-8 w-8 items-center justify-center text-[var(--app-text-muted)] sm:h-9 sm:w-9">
                        <CategoryIcon name={item.name} className="h-5.5 w-5.5 sm:h-6 sm:w-6" />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-base font-black uppercase leading-none tracking-[-0.01em] sm:text-lg">{item.name}</div>
                        <div className="mt-1.5 truncate text-[10px] font-medium uppercase tracking-[0.16em] text-[var(--app-text-muted)] sm:text-[11px]">{item.subtitle}</div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="app-numeric text-base font-black leading-none sm:text-lg">{formatCurrency(item.amount)}</div>
                        <div className="app-numeric mt-1.5 text-xs font-black text-[var(--app-text-muted)]">{Math.round(item.percent)}%</div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        <div className="app-panel p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3 border-b border-[var(--app-border)] pb-3">
            <div>
              <p className="app-section-title text-lg">Recent Transactions</p>
              <p className="mt-1 text-sm text-[var(--app-text-muted)]">Latest financial events</p>
            </div>
            <Link to="/transactions" className="app-brush-link text-sm">View All →</Link>
          </div>

          {recentTransactions.length === 0 ? (
            <div className="relative mt-4 min-h-[190px] overflow-hidden border border-[var(--app-border)] p-5 sm:p-6">
              <div className="pointer-events-none absolute inset-0 bg-right-bottom bg-contain bg-no-repeat opacity-[0.22] sm:opacity-[0.3] mix-blend-multiply" style={{ backgroundImage: `url(${mangaAssets.emptyStateLoneSamurai})` }} aria-hidden="true" />
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(244,241,234,0.92)_0%,rgba(244,241,234,0.84)_45%,rgba(244,241,234,0.58)_100%)] sm:bg-[linear-gradient(90deg,rgba(244,241,234,0.97)_0%,rgba(244,241,234,0.9)_42%,rgba(244,241,234,0.42)_72%,rgba(244,241,234,0.12)_100%)]" aria-hidden="true" />
              <div className="relative z-10 max-w-full sm:max-w-[60%]">
                <div className="font-[var(--font-display)] text-2xl uppercase leading-none">No Transactions Yet</div>
                <p className="mt-3 text-sm leading-6 text-[var(--app-text-muted)]">Every journey begins with the first entry. Add an income or expense to start filling the ledger.</p>
              </div>
            </div>
          ) : (
            <div className="mt-3 space-y-4">
              {recentTransactionGroups.map((group) => (
                <div key={group.label}>
                  <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-[var(--app-text-muted)]">
                    <span>{group.label}</span>
                    <span className="h-px flex-1 bg-[var(--app-border)]" />
                  </div>
                  <div className="space-y-1.5">
                    {group.items.map((transaction) => {
                      const sourceName = balanceSources.find((source) => source.id === transaction.balanceSourceId)?.name ?? 'Unassigned';
                      const categoryName = getCategoryName(transaction.category, categories);
                      const mark = getTransactionMark(transaction);
                      return (
                        <div key={transaction.id} className="group grid grid-cols-[4px_34px_minmax(0,1fr)_auto] items-center gap-3 border border-transparent py-2 pr-1 text-sm transition hover:border-[var(--app-border)] hover:bg-[rgba(255,255,255,0.22)]">
                          <div className={`h-full min-h-[52px] ${transaction.type === 'income' ? 'bg-[repeating-linear-gradient(180deg,var(--color-black)_0_4px,transparent_4px_7px)]' : 'bg-[var(--color-black)]'}`} aria-hidden="true" />
                          <div className="flex h-8 w-8 items-center justify-center border border-[var(--app-border-strong)] bg-[rgba(255,255,255,0.28)] text-[10px] font-black uppercase">{sourceName === 'Unassigned' ? mark : getSourceMonogram(sourceName)}</div>
                          <div className="min-w-0">
                            <div className="truncate text-[15px] font-black leading-tight tracking-[-0.01em]">{transaction.description}</div>
                            <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-[var(--app-text-muted)]">
                              <span>{categoryName}</span>
                              <span aria-hidden="true">•</span>
                              <span>{sourceName === 'Unassigned' ? 'No Source' : sourceName}</span>
                              <span aria-hidden="true">•</span>
                              <span>{format(new Date(`${transaction.date}T12:00:00`), 'MMM d')}</span>
                            </div>
                          </div>
                          <div className="shrink-0 text-right">
                            <div className="app-numeric text-base font-black">{transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}</div>
                            <div className="mt-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-[var(--app-text-muted)]">{formatRelativeLedgerDate(transaction.date)}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-3 xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
        <BudgetProgress summaryOverride={activeSummary} title="Spending Rhythm" selectedMonth={selectedMonth} viewMode={viewMode} />

        <div className="app-panel p-5 sm:p-6">
          <div className="pointer-events-none absolute inset-0 bg-cover bg-no-repeat opacity-[0.38] mix-blend-multiply sm:opacity-[0.34]" style={{ backgroundImage: `url(${mangaAssets.mottoSamuraiSitting})`, backgroundPosition: '63% 52%' }} aria-hidden="true" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(145deg,rgba(244,241,234,0.94)_0%,rgba(244,241,234,0.84)_38%,rgba(244,241,234,0.46)_68%,rgba(244,241,234,0.16)_100%)] sm:bg-[linear-gradient(90deg,rgba(244,241,234,0.97)_0%,rgba(244,241,234,0.88)_38%,rgba(244,241,234,0.38)_68%,rgba(244,241,234,0.1)_100%)]" aria-hidden="true" />
          <div className="relative z-10 flex items-start justify-between gap-3 border-b border-[var(--app-border)] pb-3">
            <div>
              <p className="app-section-title text-lg">Monthly Insight</p>
              <p className="mt-1 text-sm text-[var(--app-text-muted)]">Smart ledger reading</p>
            </div>
            {insights.length > 3 && <div className="app-numeric text-xs font-black uppercase tracking-[0.14em] text-[var(--app-text-muted)]">{(insightPage % insights.length) + 1}/{insights.length}</div>}
          </div>
          <div key={`${selectedMonth}-${viewMode}-${insightPage}`} className="dashboard-insight-fade relative z-10 mt-4 max-w-full space-y-3 sm:max-w-[72%]">
            {visibleInsights.map((insight, index) => (
              <article key={`${insight.label}-${insight.headline}`} className={index === 0 ? '' : 'border-t border-[var(--app-border)] pt-3'}>
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--app-text-muted)]">{insight.label}</div>
                <div className={`${index === 0 ? 'mt-2 font-[var(--font-display)] text-2xl' : 'mt-1 text-base font-black'} uppercase leading-none tracking-[-0.02em]`}>{insight.headline}</div>
                <p className="mt-2 text-sm leading-6 text-[var(--app-text-muted)]">{insight.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
