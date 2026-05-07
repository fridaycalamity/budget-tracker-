import { useState } from 'react';
import { formatCurrency, formatDate, getCategoryName, getCategoryIcon } from '../utils';
import { useBudget, useCategories } from '../contexts';
import type { Transaction } from '../types';
import { CategoryIcon } from './CategoryIcon';
import { getSourceMonogram } from '../lib/manga';

interface TransactionRowProps {
  transaction: Transaction;
  onDelete: (id: string) => void;
  onEdit: (transaction: Transaction) => void;
}

export function TransactionRow({ transaction, onDelete, onEdit }: TransactionRowProps) {
  const { categories } = useCategories();
  const { balanceSources } = useBudget();
  const [showConfirm, setShowConfirm] = useState(false);

  const categoryName = getCategoryName(transaction.category, categories);
  const categoryIcon = getCategoryIcon(transaction.category, categories);
  const sourceName = balanceSources.find((s) => s.id === transaction.balanceSourceId)?.name ?? 'Unassigned';
  const sourceMonogram = sourceName === 'Unassigned' ? '—' : getSourceMonogram(sourceName);
  const syncLabel = transaction.__syncStatus && transaction.__syncStatus !== 'synced' ? transaction.__syncStatus : null;

  const handleConfirmDelete = () => {
    onDelete(transaction.id);
    setShowConfirm(false);
  };

  return (
    <div className="border-b border-[var(--app-border)] py-3 last:border-b-0">
      <div className="sm:hidden">
        <div className="grid grid-cols-[32px_minmax(0,1fr)] gap-x-3 gap-y-2">
          <div className="row-span-2 flex h-8 w-8 items-center justify-center border border-[var(--app-border-strong)] text-[10px] font-black uppercase tracking-[0.08em]">{sourceMonogram}</div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-black uppercase tracking-[0.14em] text-[var(--app-text-muted)]">
              <span className="break-words">{sourceName}</span>
              <span>•</span>
              <span>{formatDate(transaction.date)}</span>
            </div>
          </div>
          <div className="min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="break-words text-sm font-semibold leading-5">{transaction.description || 'Untitled transaction'}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--app-text-muted)]">
                  <CategoryIcon name={categoryName} icon={categoryIcon} className="h-4 w-4" />
                  <span>{categoryName}</span>
                  {syncLabel && <span className="app-stamp">{syncLabel}</span>}
                </div>
              </div>
              <div className="shrink-0 pl-2 text-right">
                <div className="app-numeric text-base font-black">{transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-3 flex justify-end gap-2">
          {!showConfirm ? (
            <>
              <button onClick={() => onEdit(transaction)} className="app-button-secondary px-3 text-xs">Edit</button>
              <button onClick={() => setShowConfirm(true)} className="app-button-secondary px-3 text-xs">Delete</button>
            </>
          ) : (
            <>
              <button onClick={handleConfirmDelete} className="app-button-primary px-3 text-xs text-white">Confirm</button>
              <button onClick={() => setShowConfirm(false)} className="app-button-secondary px-3 text-xs">Cancel</button>
            </>
          )}
        </div>
      </div>

      <div className="hidden sm:grid sm:grid-cols-[156px_minmax(0,1.3fr)_132px_120px_96px_auto] sm:items-center sm:gap-4">
        <div className="min-w-0">
          <div className="flex items-start gap-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center border border-[var(--app-border-strong)] text-[10px] font-black uppercase tracking-[0.08em]">{sourceMonogram}</div>
            <span className="break-words pt-2 text-xs font-black uppercase leading-4 tracking-[0.08em]">{sourceName}</span>
          </div>
        </div>

        <div className="min-w-0">
          <p className="break-words text-sm font-semibold leading-5">{transaction.description || 'Untitled transaction'}</p>
          {syncLabel && <div className="app-stamp mt-1">{syncLabel}</div>}
        </div>

        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-[var(--app-text-muted)]">
          <CategoryIcon name={categoryName} icon={categoryIcon} className="h-4.5 w-4.5 shrink-0" />
          <span className="truncate">{categoryName}</span>
        </div>
        <div className="app-numeric text-right text-lg font-black">{transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}</div>
        <div className="text-right text-xs font-black uppercase tracking-[0.08em] text-[var(--app-text-muted)]">{formatDate(transaction.date)}</div>
        <div className="flex justify-end gap-2">
          {!showConfirm ? (
            <>
              <button onClick={() => onEdit(transaction)} className="app-button-secondary px-3 text-xs">Edit</button>
              <button onClick={() => setShowConfirm(true)} className="app-button-secondary px-3 text-xs">Delete</button>
            </>
          ) : (
            <>
              <button onClick={handleConfirmDelete} className="app-button-primary px-3 text-xs text-white">Confirm</button>
              <button onClick={() => setShowConfirm(false)} className="app-button-secondary px-3 text-xs">Cancel</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
