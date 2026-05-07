import { useMemo, useState } from 'react';
import { addMonths, format } from 'date-fns';
import { useBudget, useCategories } from '../contexts';
import { formatCurrency } from '../utils';

function formatOrdinal(day: number): string {
  const mod10 = day % 10;
  const mod100 = day % 100;
  if (mod10 === 1 && mod100 !== 11) return `${day}st`;
  if (mod10 === 2 && mod100 !== 12) return `${day}nd`;
  if (mod10 === 3 && mod100 !== 13) return `${day}rd`;
  return `${day}th`;
}

export function Subscriptions() {
  const {
    subscriptions,
    subscriptionPayments,
    addSubscription,
    updateSubscription,
    deleteSubscription,
    toggleSubscription,
    balanceSources,
  } = useBudget();
  const { getCategoriesByType, getCategoryById } = useCategories();

  const expenseCategories = getCategoriesByType('expense');
  const currentMonth = new Date().toISOString().slice(0, 7);
  const availableBalanceSources = useMemo(() => {
    const grouped = new Map<string, (typeof balanceSources)[number]>();

    for (const source of balanceSources) {
      const key = source.name.trim().toLowerCase();
      if (!grouped.has(key)) {
        grouped.set(key, source);
      }
    }

    return Array.from(grouped.values());
  }, [balanceSources]);

  const emptyForm = {
    name: '',
    amount: '',
    billingDay: '1',
    categoryId: expenseCategories[0]?.id || '',
    balanceSourceId: availableBalanceSources[0]?.id || '',
    isEnabled: true,
    startMode: 'current' as 'current' | 'next',
  };

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const paidThisMonth = useMemo(() => {
    const set = new Set<string>();
    for (const payment of subscriptionPayments) {
      if (payment.billingMonth === currentMonth) set.add(payment.subscriptionId);
    }
    return set;
  }, [subscriptionPayments, currentMonth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.categoryId || !form.balanceSourceId) return;
    setSubmitting(true);
    try {
      await addSubscription({
        name: form.name.trim(),
        amount: Number(form.amount),
        billingDay: Number(form.billingDay),
        categoryId: form.categoryId,
        balanceSourceId: form.balanceSourceId,
        isEnabled: form.isEnabled,
        startMode: form.startMode,
      });
      setForm({
        ...emptyForm,
        categoryId: expenseCategories[0]?.id || '',
        balanceSourceId: availableBalanceSources[0]?.id || '',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = 'app-input w-full px-3 py-3';
  const labelClass = 'mb-1 block text-[11px] font-black uppercase tracking-[0.14em] text-[var(--app-text-muted)]';

  return (
    <div className="space-y-4 lg:space-y-5">
      <section>
        <p className="app-kicker mb-2">Recurring Bills</p>
        <h1 className="app-page-title">Subscriptions</h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--app-text-muted)] sm:text-base">
          Define recurring charges, assign them to real sources, and let the ledger generate clean monthly entries.
        </p>
      </section>

      <div className="app-panel-subtle p-4 sm:p-5">
        <h2 className="app-section-title text-lg">How It Works</h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-[var(--app-text-muted)]">
          <li>Active subscriptions generate normal expense transactions on the billing day.</li>
          <li>Each recurring bill can target a specific source such as GCash, GoTyme Bank, BPI, or Cash.</li>
          <li>Pause a subscription to stop future generation without deleting the history.</li>
        </ul>
      </div>

      <div className="app-panel p-5 sm:p-6">
        <div>
          <h2 className="app-section-title text-lg">Add Subscription</h2>
          <p className="mt-1 text-sm text-[var(--app-text-muted)]">Create recurring bills like rent, internet, or streaming services.</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className={labelClass}>Subscription Name</label>
              <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Netflix, Spotify, Rent" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Monthly Amount</label>
              <input type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} placeholder="Amount" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Billing Day</label>
              <input type="number" min="1" max="31" value={form.billingDay} onChange={(e) => setForm((f) => ({ ...f, billingDay: e.target.value }))} placeholder="Billing day" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Category</label>
              <select value={form.categoryId} onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))} className={inputClass}>
                {expenseCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Pay From</label>
              <select value={form.balanceSourceId} onChange={(e) => setForm((f) => ({ ...f, balanceSourceId: e.target.value }))} className={inputClass}>
                <option value="">Select source</option>
                {availableBalanceSources.map((source) => (
                  <option key={source.id} value={source.id}>{source.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex min-h-[44px] items-center gap-3 text-sm font-semibold uppercase tracking-[0.08em]">
                <input type="checkbox" checked={form.isEnabled} onChange={(e) => setForm((f) => ({ ...f, isEnabled: e.target.checked }))} className="accent-black" />
                Active Subscription
              </label>
            </div>
          </div>

          <div className="app-panel-subtle p-4">
            <div className="app-kicker mb-3">Start Mode</div>
            <div className="space-y-3 text-sm">
              <label className="flex items-start gap-3">
                <input type="radio" name="startMode" checked={form.startMode === 'current'} onChange={() => setForm((f) => ({ ...f, startMode: 'current' }))} className="mt-1 accent-black" />
                <span><span className="font-semibold uppercase tracking-[0.08em]">Include Current Month</span><span className="mt-1 block text-[var(--app-text-muted)]">Generate this month if it has not already been handled.</span></span>
              </label>
              <label className="flex items-start gap-3">
                <input type="radio" name="startMode" checked={form.startMode === 'next'} onChange={() => setForm((f) => ({ ...f, startMode: 'next' }))} className="mt-1 accent-black" />
                <span><span className="font-semibold uppercase tracking-[0.08em]">Start Next Month</span><span className="mt-1 block text-[var(--app-text-muted)]">Use this if you already paid this month and want to avoid duplicates.</span></span>
              </label>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-[var(--app-text-muted)]">Generated transactions appear in the normal transaction ledger.</p>
            <button type="submit" disabled={submitting || !form.name.trim() || !form.amount || !form.balanceSourceId} className="app-button-primary px-5 text-white disabled:opacity-50">
              {submitting ? 'Adding...' : 'Add Subscription'}
            </button>
          </div>
        </form>
      </div>

      <div className="app-panel p-5 sm:p-6">
        <h2 className="app-section-title text-lg">Current Subscriptions</h2>
        {subscriptions.length === 0 ? (
          <p className="mt-4 text-sm text-[var(--app-text-muted)]">No subscriptions yet. Add recurring bills like rent, internet, phone plans, or streaming services.</p>
        ) : (
          <div className="mt-5 space-y-3">
            {subscriptions.map((sub) => {
              const category = getCategoryById(sub.categoryId);
              const source = balanceSources.find((s) => s.id === sub.balanceSourceId);
              const isHandledThisMonth = paidThisMonth.has(sub.id);
              const isEditing = editingId === sub.id;
              const chargeMonthBase = isHandledThisMonth ? addMonths(new Date(`${currentMonth}-01`), 1) : new Date(`${currentMonth}-01`);
              const chargeDay = Math.min(sub.billingDay, new Date(chargeMonthBase.getFullYear(), chargeMonthBase.getMonth() + 1, 0).getDate());
              const nextChargeDate = format(new Date(chargeMonthBase.getFullYear(), chargeMonthBase.getMonth(), chargeDay), 'MMM d, yyyy');
              const statusLabel = sub.isEnabled ? (isHandledThisMonth ? 'Paid This Month' : 'Active') : 'Paused';

              return (
                <div key={sub.id} className="app-panel-subtle p-4">
                  {isEditing ? (
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className={inputClass} />
                      <input type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} className={inputClass} />
                      <input type="number" min="1" max="31" value={form.billingDay} onChange={(e) => setForm((f) => ({ ...f, billingDay: e.target.value }))} className={inputClass} />
                      <select value={form.categoryId} onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))} className={inputClass}>
                        {expenseCategories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                      </select>
                      <select value={form.balanceSourceId} onChange={(e) => setForm((f) => ({ ...f, balanceSourceId: e.target.value }))} className={inputClass}>
                        {availableBalanceSources.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                      <label className="flex min-h-[44px] items-center gap-2 text-sm font-semibold uppercase tracking-[0.08em]">
                        <input type="checkbox" checked={form.isEnabled} onChange={(e) => setForm((f) => ({ ...f, isEnabled: e.target.checked }))} className="accent-black" />
                        Active subscription
                      </label>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="font-black uppercase tracking-[0.08em]">{sub.name}</div>
                        <div className="mt-1 text-sm text-[var(--app-text-muted)]">{formatCurrency(sub.amount)} · {category?.name || 'Unknown category'} · {source?.name || 'No source'}</div>
                        <div className="mt-2 text-sm text-[var(--app-text-muted)]">Charges every month on the {formatOrdinal(sub.billingDay)}</div>
                        <div className="mt-1 text-xs uppercase tracking-[0.12em] text-[var(--app-text-muted)]">Next charge: {nextChargeDate}</div>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className={`app-stamp ${statusLabel === 'Paused' ? 'bg-transparent' : ''}`}>{statusLabel}</span>
                        <span className="app-stamp">{source?.name || 'Unassigned'}</span>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap gap-2">
                    {isEditing ? (
                      <>
                        <button
                          onClick={async () => {
                            await updateSubscription(sub.id, {
                              name: form.name.trim(),
                              amount: Number(form.amount),
                              billingDay: Number(form.billingDay),
                              categoryId: form.categoryId,
                              balanceSourceId: form.balanceSourceId,
                              isEnabled: form.isEnabled,
                            });
                            setEditingId(null);
                            setForm({ ...emptyForm, categoryId: expenseCategories[0]?.id || '', balanceSourceId: availableBalanceSources[0]?.id || '' });
                          }}
                          className="app-button-primary px-4 text-white"
                        >Save</button>
                        <button onClick={() => setEditingId(null)} className="app-button-secondary px-4">Cancel</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => toggleSubscription(sub.id)} className="app-button-secondary px-4">{sub.isEnabled ? 'Pause' : 'Resume'}</button>
                        <button
                          onClick={() => {
                            setEditingId(sub.id);
                            setForm({ name: sub.name, amount: String(sub.amount), billingDay: String(sub.billingDay), categoryId: sub.categoryId, balanceSourceId: sub.balanceSourceId || '', isEnabled: sub.isEnabled, startMode: 'current' });
                          }}
                          className="app-button-primary px-4 text-white"
                        >Edit</button>
                        <button onClick={() => deleteSubscription(sub.id)} className="app-button-secondary px-4">Delete</button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
