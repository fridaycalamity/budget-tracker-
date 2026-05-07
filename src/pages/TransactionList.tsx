import { useState, useMemo, useEffect } from 'react';
import { useBudget } from '../contexts';
import { FilterBar } from '../components/FilterBar';
import { SortControls } from '../components/SortControls';
import { TransactionRow } from '../components/TransactionRow';
import { TransactionModal } from '../components/TransactionModal';
import { filterTransactions, sortTransactions } from '../utils';
import type { TransactionFilters, SortConfig, Transaction } from '../types';
import { mangaAssets } from '../lib/manga';

const TRANSACTION_WINDOWS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'all', label: 'All Records' },
] as const;

const TRANSACTION_WINDOW_SUMMARY_LABELS = {
  daily: 'daily',
  weekly: 'weekly',
  monthly: 'monthly',
  all: 'transaction',
} as const;

type TransactionWindow = (typeof TRANSACTION_WINDOWS)[number]['value'];

type PageSize = 25 | 50;

export function TransactionList() {
  const { transactions, deleteTransaction } = useBudget();
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [filters, setFilters] = useState<TransactionFilters>({
    type: 'all',
    category: 'all',
    dateRange: { start: null, end: null },
  });
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: 'date', direction: 'desc' });
  const [transactionWindow, setTransactionWindow] = useState<TransactionWindow>('monthly');
  const [pageSize, setPageSize] = useState<PageSize>(50);
  const [currentPage, setCurrentPage] = useState(1);

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingTransaction(null);
  };

  const windowedTransactions = useMemo(() => {
    if (transactionWindow === 'all') return transactions;

    const today = new Date();
    const todayKey = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString().slice(0, 10);

    if (transactionWindow === 'daily') {
      return transactions.filter((transaction) => transaction.date === todayKey);
    }

    if (transactionWindow === 'monthly') {
      const monthKey = todayKey.slice(0, 7);
      return transactions.filter((transaction) => transaction.date.startsWith(monthKey));
    }

    const weekStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    weekStart.setDate(weekStart.getDate() - 6);
    const weekStartKey = weekStart.toISOString().slice(0, 10);

    return transactions.filter((transaction) => transaction.date >= weekStartKey && transaction.date <= todayKey);
  }, [transactions, transactionWindow]);

  const displayedTransactions = useMemo(() => {
    const filtered = filterTransactions(windowedTransactions, filters);
    return sortTransactions(filtered, sortConfig);
  }, [windowedTransactions, filters, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(displayedTransactions.length / pageSize));
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return displayedTransactions.slice(startIndex, startIndex + pageSize);
  }, [displayedTransactions, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, sortConfig, transactionWindow, pageSize]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const hasActiveFilters =
    filters.type !== 'all' ||
    filters.category !== 'all' ||
    filters.dateRange.start !== null ||
    filters.dateRange.end !== null;

  return (
    <div className="space-y-4 lg:space-y-5">
      <section>
        <p className="app-kicker mb-2">Ledger Entries</p>
        <h1 className="app-page-title">Transactions</h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--app-text-muted)] sm:text-base">
          Review every recorded entry, refine the ledger with filters, and edit details without leaving the page.
        </p>
      </section>

      {transactions.length === 0 ? (
        <div className="app-panel overflow-hidden p-6 sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_220px] lg:items-center">
            <div>
              <div className="font-[var(--font-display)] text-3xl uppercase leading-none">No Transactions Yet</div>
              <p className="mt-3 text-sm leading-6 text-[var(--app-text-muted)]">Every journey begins with the first entry. Add your first income or expense using the floating plus button.</p>
            </div>
            <img src={mangaAssets.emptyStateLoneSamurai} alt="Lone samurai empty state" className="mx-auto max-h-40 w-auto object-contain opacity-80 mix-blend-multiply sm:max-h-52" />
          </div>
        </div>
      ) : (
        <>
          <div className="app-panel p-4 sm:p-5">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h3 className="app-section-title text-lg">Record Window</h3>
                <p className="mt-1 text-sm text-[var(--app-text-muted)]">Start with the current month by default, or switch to daily, weekly, or the full ledger.</p>
              </div>
              <div className="text-xs font-black uppercase tracking-[0.12em] text-[var(--app-text-muted)]">
                Default view: Monthly
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="tablist" aria-label="Transaction record window">
              {TRANSACTION_WINDOWS.map((option) => {
                const isActive = transactionWindow === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setTransactionWindow(option.value)}
                    className={`min-h-11 border px-4 py-3 text-sm font-black uppercase tracking-[0.1em] transition ${isActive ? 'border-[var(--color-black)] bg-[var(--color-black)] text-white' : 'border-[var(--app-border-strong)] bg-[var(--color-white)] text-[var(--app-text)] hover:bg-[var(--color-paper)]'}`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <FilterBar filters={filters} onFiltersChange={setFilters} />
          <SortControls sortConfig={sortConfig} onSortChange={setSortConfig} />

          <div className="app-panel p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-[var(--app-text-muted)]" role="status" aria-live="polite" aria-atomic="true">
                Showing <span className="font-black text-[var(--app-text)]">{paginatedTransactions.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}</span>–<span className="font-black text-[var(--app-text)]">{Math.min(currentPage * pageSize, displayedTransactions.length)}</span> of <span className="font-black text-[var(--app-text)]">{displayedTransactions.length}</span> visible {TRANSACTION_WINDOW_SUMMARY_LABELS[transactionWindow]} record{displayedTransactions.length !== 1 ? 's' : ''}
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <label className="flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-[var(--app-text-muted)]">
                  <span>Per Page</span>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value) as PageSize)}
                    className="app-input min-h-11 w-[110px] px-3 py-2 text-sm text-[var(--app-text)]"
                    aria-label="Transactions per page"
                  >
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                </label>
                {hasActiveFilters && displayedTransactions.length === 0 && <div className="app-stamp">No Matches</div>}
              </div>
            </div>
          </div>

          {displayedTransactions.length === 0 ? (
            <div className="app-panel p-6 sm:p-8 text-center">
              <div className="font-[var(--font-display)] text-3xl uppercase leading-none">No Transactions Found</div>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[var(--app-text-muted)]">The current filters produced an empty panel. Adjust the date window, type, or category to reveal more entries.</p>
            </div>
          ) : (
            <>
              <div className="app-panel px-4 sm:px-5" role="list" aria-label="Transaction list">
                {paginatedTransactions.map((transaction) => (
                  <div key={transaction.id} role="listitem">
                    <TransactionRow transaction={transaction} onDelete={deleteTransaction} onEdit={handleEdit} />
                  </div>
                ))}
              </div>

              {displayedTransactions.length > pageSize && (
                <div className="app-panel p-4 sm:p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm text-[var(--app-text-muted)]">
                      Page <span className="font-black text-[var(--app-text)]">{currentPage}</span> of <span className="font-black text-[var(--app-text)]">{totalPages}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                        disabled={currentPage === 1}
                        className="app-button-secondary min-h-11 px-4 disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <button
                        type="button"
                        onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                        disabled={currentPage === totalPages}
                        className="app-button-primary min-h-11 px-4 text-white disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      <TransactionModal isOpen={isEditModalOpen} onClose={handleCloseEditModal} editTransaction={editingTransaction} />
    </div>
  );
}
