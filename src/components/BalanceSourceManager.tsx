import { useEffect, useMemo, useState } from 'react';

const UNASSIGNED_WINDOWS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'all', label: 'All Records' },
] as const;

type UnassignedWindow = (typeof UNASSIGNED_WINDOWS)[number]['value'];
type PageSize = 25 | 50;
import { useBudget, useCategories } from '../contexts';
import { formatCurrency } from '../utils';
import { CategoryIcon } from './CategoryIcon';
import { getSourceMonogram } from '../lib/manga';

export function BalanceSourceManager() {
  const {
    balanceSources,
    transactions,
    addBalanceSource,
    updateBalanceSource,
    deleteBalanceSource,
    assignTransactionsToSource,
  } = useBudget();
  const { getCategoryById } = useCategories();
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [assignSourceId, setAssignSourceId] = useState('');
  const [selectedUnassignedIds, setSelectedUnassignedIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [unassignedWindow, setUnassignedWindow] = useState<UnassignedWindow>('monthly');
  const [pageSize, setPageSize] = useState<PageSize>(50);
  const [currentPage, setCurrentPage] = useState(1);

  const balances = useMemo(() => {
    const map: Record<string, number> = {};
    for (const source of balanceSources) map[source.id] = 0;
    for (const t of transactions) {
      if (!t.balanceSourceId) continue;
      if (!(t.balanceSourceId in map)) map[t.balanceSourceId] = 0;
      map[t.balanceSourceId] += t.type === 'income' ? t.amount : -t.amount;
    }
    return map;
  }, [balanceSources, transactions]);

  const totalBalance = useMemo(() => transactions.reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0), [transactions]);
  const assignedBalance = useMemo(() => transactions.filter((t) => t.balanceSourceId).reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0), [transactions]);
  const unassignedTransactions = useMemo(() => transactions.filter((t) => !t.balanceSourceId), [transactions]);
  const unassignedBalance = totalBalance - assignedBalance;

  const filteredUnassignedTransactions = useMemo(() => {
    if (unassignedWindow === 'all') return unassignedTransactions;

    const today = new Date();
    const todayKey = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString().slice(0, 10);

    if (unassignedWindow === 'daily') {
      return unassignedTransactions.filter((transaction) => transaction.date === todayKey);
    }

    if (unassignedWindow === 'monthly') {
      const monthKey = todayKey.slice(0, 7);
      return unassignedTransactions.filter((transaction) => transaction.date.startsWith(monthKey));
    }

    const weekStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    weekStart.setDate(weekStart.getDate() - 6);
    const weekStartKey = weekStart.toISOString().slice(0, 10);

    return unassignedTransactions.filter((transaction) => transaction.date >= weekStartKey && transaction.date <= todayKey);
  }, [unassignedTransactions, unassignedWindow]);

  const totalPages = Math.max(1, Math.ceil(filteredUnassignedTransactions.length / pageSize));
  const paginatedUnassignedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredUnassignedTransactions.slice(startIndex, startIndex + pageSize);
  }, [filteredUnassignedTransactions, currentPage, pageSize]);

  const selectedUnassignedTransactions = useMemo(() => filteredUnassignedTransactions.filter((transaction) => selectedUnassignedIds.includes(transaction.id)), [selectedUnassignedIds, filteredUnassignedTransactions]);
  const selectedUnassignedBalance = useMemo(() => selectedUnassignedTransactions.reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0), [selectedUnassignedTransactions]);

  useEffect(() => {
    setCurrentPage(1);
  }, [unassignedWindow, pageSize]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    const filteredIds = new Set(filteredUnassignedTransactions.map((transaction) => transaction.id));
    setSelectedUnassignedIds((current) => current.filter((id) => filteredIds.has(id)));
  }, [filteredUnassignedTransactions]);

  const dedupedSources = useMemo(() => {
    const seen = new Set<string>();
    const unique = [] as typeof balanceSources;
    const duplicates = [] as typeof balanceSources;

    for (const source of balanceSources) {
      const key = source.name.trim().toLowerCase();
      if (seen.has(key)) duplicates.push(source);
      else {
        seen.add(key);
        unique.push(source);
      }
    }

    return { unique, duplicates };
  }, [balanceSources]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setSubmitting(true);
    try {
      await addBalanceSource(newName.trim());
      setNewName('');
    } finally {
      setSubmitting(false);
    }
  };

  const saveEdit = async () => {
    if (!editingId || !editingName.trim()) return;
    setSubmitting(true);
    try {
      await updateBalanceSource(editingId, editingName.trim());
      setEditingId(null);
      setEditingName('');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleSelectedUnassigned = (transactionId: string) => {
    setSelectedUnassignedIds((current) => current.includes(transactionId) ? current.filter((id) => id !== transactionId) : [...current, transactionId]);
  };

  const handleAssignSelected = async () => {
    if (!assignSourceId || selectedUnassignedIds.length === 0) return;
    setSubmitting(true);
    try {
      await assignTransactionsToSource(selectedUnassignedIds, assignSourceId);
      setAssignSourceId('');
      setSelectedUnassignedIds([]);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignAll = async () => {
    if (!assignSourceId || filteredUnassignedTransactions.length === 0) return;
    setSubmitting(true);
    try {
      await assignTransactionsToSource(filteredUnassignedTransactions.map((transaction) => transaction.id), assignSourceId);
      setAssignSourceId('');
      setSelectedUnassignedIds([]);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app-panel p-5 sm:p-6">
      <div>
        <div className="app-kicker mb-2">Account Sources</div>
        <h3 className="app-section-title text-lg">Balance Sources</h3>
        <p className="mt-1 text-sm text-[var(--app-text-muted)]">Manage accounts or wallets and reconcile transactions that still have no source.</p>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="app-panel-subtle p-4">
          <div className="app-kicker mb-2">Total Balance</div>
          <div className="app-numeric text-2xl font-black">{formatCurrency(totalBalance)}</div>
        </div>
        <div className="app-panel-subtle p-4">
          <div className="app-kicker mb-2">Assigned Balance</div>
          <div className="app-numeric text-2xl font-black">{formatCurrency(assignedBalance)}</div>
        </div>
        <div className="border border-dashed border-[var(--app-border-strong)] bg-[repeating-linear-gradient(-45deg,rgba(0,0,0,0.04),rgba(0,0,0,0.04)_4px,transparent_4px,transparent_8px)] p-4">
          <div className="app-kicker mb-2">Unassigned Balance</div>
          <div className="app-numeric text-2xl font-black">{formatCurrency(unassignedBalance)}</div>
          <div className="mt-1 text-xs uppercase tracking-[0.12em] text-[var(--app-text-muted)]">{unassignedTransactions.length} transaction{unassignedTransactions.length === 1 ? '' : 's'} need source</div>
        </div>
      </div>

      {dedupedSources.duplicates.length > 0 && (
        <div className="mt-4 border border-dashed border-[var(--app-border-strong)] p-4 text-sm text-[var(--app-text-muted)]">
          Duplicate balance source names were detected and hidden: {dedupedSources.duplicates.map((source) => source.name).join(', ')}
        </div>
      )}

      <form onSubmit={handleAdd} className="mt-5 flex flex-col gap-2 sm:flex-row">
        <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Add new source (e.g. GoTyme, BPI, GCash, Cash)" className="app-input flex-1 px-3 py-3" />
        <button type="submit" disabled={submitting || !newName.trim()} className="app-button-primary px-4 text-white disabled:opacity-50">Add Source</button>
      </form>

      <div className="mt-5 space-y-3">
        <div className="border border-dashed border-[var(--app-border-strong)] bg-[repeating-linear-gradient(-45deg,rgba(0,0,0,0.04),rgba(0,0,0,0.04)_4px,transparent_4px,transparent_8px)] p-4">
          <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_320px]">
            <div>
              <div className="font-black uppercase tracking-[0.08em]">Unassigned Transactions</div>
              <div className="mt-1 text-sm text-[var(--app-text-muted)]">Select individual transactions for partial reconciliation or assign everything at once.</div>

              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4" role="tablist" aria-label="Unassigned transaction record window">
                {UNASSIGNED_WINDOWS.map((option) => {
                  const isActive = unassignedWindow === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setUnassignedWindow(option.value)}
                      className={`min-h-11 border px-3 py-3 text-sm font-black uppercase tracking-[0.1em] transition ${isActive ? 'border-[var(--color-black)] bg-[var(--color-black)] text-white' : 'border-[var(--app-border-strong)] bg-[var(--color-white)] text-[var(--app-text)] hover:bg-[var(--color-paper)]'}`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <button type="button" onClick={() => setSelectedUnassignedIds(filteredUnassignedTransactions.map((transaction) => transaction.id))} disabled={submitting || filteredUnassignedTransactions.length === 0} className="app-button-secondary px-3 text-xs disabled:opacity-50">Select All</button>
                  <button type="button" onClick={() => setSelectedUnassignedIds([])} disabled={submitting || selectedUnassignedIds.length === 0} className="app-button-secondary px-3 text-xs disabled:opacity-50">Clear</button>
                  <span className="text-xs uppercase tracking-[0.12em] text-[var(--app-text-muted)]">{selectedUnassignedIds.length} selected · {formatCurrency(selectedUnassignedBalance)}</span>
                </div>

                <label className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-[var(--app-text-muted)]">
                  <span>Per Page</span>
                  <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value) as PageSize)} className="app-input min-h-11 w-[110px] px-3 py-2 text-sm text-[var(--app-text)]" aria-label="Unassigned transactions per page">
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                </label>
              </div>

              <div className="mt-4 text-sm text-[var(--app-text-muted)]" role="status" aria-live="polite" aria-atomic="true">
                Showing <span className="font-black text-[var(--app-text)]">{paginatedUnassignedTransactions.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}</span>–<span className="font-black text-[var(--app-text)]">{Math.min(currentPage * pageSize, filteredUnassignedTransactions.length)}</span> of <span className="font-black text-[var(--app-text)]">{filteredUnassignedTransactions.length}</span> unassigned record{filteredUnassignedTransactions.length === 1 ? '' : 's'}
              </div>

              <div className="mt-4 space-y-2">
                {filteredUnassignedTransactions.length === 0 ? (
                  <div className="app-panel-subtle p-4 text-sm text-[var(--app-text-muted)]">No unassigned transactions in this record window.</div>
                ) : (
                  paginatedUnassignedTransactions.map((transaction) => {
                    const category = getCategoryById(transaction.category);
                    const selected = selectedUnassignedIds.includes(transaction.id);
                    return (
                      <label key={transaction.id} className={`app-panel-subtle flex cursor-pointer items-start gap-3 p-3 ${selected ? 'ring-1 ring-[var(--app-border-strong)]' : ''}`}>
                        <input type="checkbox" checked={selected} onChange={() => toggleSelectedUnassigned(transaction.id)} className="mt-1 h-4 w-4 accent-black" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="truncate text-sm font-semibold">{transaction.description || 'Untitled transaction'}</div>
                              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--app-text-muted)]">
                                <span>{new Date(transaction.date).toLocaleDateString()}</span>
                                {category && (
                                  <span className="app-stamp inline-flex items-center gap-1">
                                    <CategoryIcon name={category.name} icon={category.icon} className="h-3.5 w-3.5" />
                                    {category.name}
                                  </span>
                                )}
                                <span className="app-stamp">{transaction.type}</span>
                              </div>
                            </div>
                            <div className="app-numeric whitespace-nowrap text-sm font-black">{transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}</div>
                          </div>
                        </div>
                      </label>
                    );
                  })
                )}
              </div>
            </div>

            <div className="app-panel-subtle h-fit p-4">
              <div className="font-black uppercase tracking-[0.08em]">Assign To Source</div>
              <div className="mt-1 text-sm text-[var(--app-text-muted)]">Use selected transactions for partial assignment, or assign everything in one stamped action.</div>

              <select value={assignSourceId} onChange={(e) => setAssignSourceId(e.target.value)} className="app-input mt-4 w-full px-3 py-3" disabled={submitting || unassignedTransactions.length === 0}>
                <option value="">Choose a balance source…</option>
                {dedupedSources.unique.map((source) => (
                  <option key={source.id} value={source.id}>{source.name}</option>
                ))}
              </select>

              {filteredUnassignedTransactions.length > pageSize && (
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm text-[var(--app-text-muted)]">
                    Page <span className="font-black text-[var(--app-text)]">{currentPage}</span> of <span className="font-black text-[var(--app-text)]">{totalPages}</span>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1} className="app-button-secondary min-h-11 px-4 disabled:opacity-50">Previous</button>
                    <button type="button" onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={currentPage === totalPages} className="app-button-primary min-h-11 px-4 text-white disabled:opacity-50">Next</button>
                  </div>
                </div>
              )}

              <div className="mt-4 space-y-2">
                <button type="button" onClick={handleAssignSelected} disabled={submitting || !assignSourceId || selectedUnassignedIds.length === 0} className="app-button-primary w-full px-4 text-white disabled:opacity-50">Assign Selected ({selectedUnassignedIds.length})</button>
                <button type="button" onClick={handleAssignAll} disabled={submitting || !assignSourceId || filteredUnassignedTransactions.length === 0} className="app-button-secondary w-full px-4 disabled:opacity-50">Assign All Shown ({filteredUnassignedTransactions.length})</button>
              </div>
            </div>
          </div>
        </div>

        {dedupedSources.unique.length === 0 ? (
          <div className="text-sm text-[var(--app-text-muted)]">No balance sources yet.</div>
        ) : (
          dedupedSources.unique.map((source) => {
            const txCount = transactions.filter((t) => t.balanceSourceId === source.id).length;
            return (
              <div key={source.id} className="app-panel-subtle grid grid-cols-[auto_1fr_auto] items-center gap-4 p-4">
                <div className="flex h-11 w-11 items-center justify-center border border-[var(--app-border-strong)] text-[11px] font-black uppercase tracking-[0.08em]">{getSourceMonogram(source.name)}</div>
                <div className="min-w-0">
                  {editingId === source.id ? (
                    <input type="text" value={editingName} onChange={(e) => setEditingName(e.target.value)} className="app-input w-full px-3 py-3" />
                  ) : (
                    <>
                      <div className="text-sm font-black uppercase tracking-[0.08em]">{source.name}</div>
                      <div className="mt-1 text-sm text-[var(--app-text-muted)]">Balance: {formatCurrency(balances[source.id] || 0)} · {txCount} transaction{txCount === 1 ? '' : 's'}</div>
                    </>
                  )}
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                  {editingId === source.id ? (
                    <>
                      <button type="button" onClick={saveEdit} className="app-button-primary px-3 text-white">Save</button>
                      <button type="button" onClick={() => { setEditingId(null); setEditingName(''); }} className="app-button-secondary px-3">Cancel</button>
                    </>
                  ) : (
                    <>
                      <button type="button" onClick={() => { setEditingId(source.id); setEditingName(source.name); }} className="app-button-secondary px-3 text-xs">Edit</button>
                      <button type="button" onClick={() => deleteBalanceSource(source.id)} className="app-button-secondary px-3 text-xs">Delete</button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
