import { useState, useMemo, useEffect, type FormEvent, type ChangeEvent } from 'react';
import { format } from 'date-fns';
import { useBudget, useCategories } from '../contexts';
import type { Transaction, BalanceSource } from '../types';

interface TransactionFormProps {
  onSuccess?: () => void;
  editTransaction?: Transaction | null;
}

export function TransactionForm({ onSuccess, editTransaction }: TransactionFormProps) {
  const { addTransaction, updateTransaction, balanceSources } = useBudget();
  const { getCategoriesByType } = useCategories();

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [category, setCategory] = useState('');
  const [balanceSourceId, setBalanceSourceId] = useState('');
  const [date, setDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableCategories = useMemo(() => getCategoriesByType(type), [type, getCategoriesByType]);
  const availableBalanceSources = useMemo(() => {
    const grouped = new Map<string, BalanceSource>();

    for (const source of balanceSources) {
      const key = source.name.trim().toLowerCase();
      if (!grouped.has(key)) {
        grouped.set(key, source);
      }
    }

    return Array.from(grouped.values());
  }, [balanceSources]);

  useEffect(() => {
    if (editTransaction) {
      setDescription(editTransaction.description);
      setAmount(editTransaction.amount.toString());
      setType(editTransaction.type);
      setCategory(editTransaction.category);
      setBalanceSourceId(editTransaction.balanceSourceId ?? '');
      setDate(editTransaction.date);
    } else {
      setDescription('');
      setAmount('');
      setType('expense');
      setCategory('');
      setBalanceSourceId('');
      setDate(format(new Date(), 'yyyy-MM-dd'));
    }
    setErrors({});
  }, [editTransaction]);

  useEffect(() => {
    if (availableCategories.length > 0 && !category) {
      const otherCategory = availableCategories.find((cat) => cat.name === 'Other');
      setCategory(otherCategory?.id || availableCategories[0].id);
    }
  }, [availableCategories, category]);

  useEffect(() => {
    if (availableBalanceSources.length > 0 && !balanceSourceId && !editTransaction) {
      setBalanceSourceId(availableBalanceSources[0].id);
    }
  }, [availableBalanceSources, balanceSourceId, editTransaction]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    const trimmedDescription = description.trim();
    if (!trimmedDescription) newErrors.description = 'Description is required';
    else if (trimmedDescription.length > 200) newErrors.description = 'Description must not exceed 200 characters';

    const numAmount = parseFloat(amount);
    if (!amount || amount.trim() === '') newErrors.amount = 'Amount is required';
    else if (isNaN(numAmount)) newErrors.amount = 'Amount must be a valid number';
    else if (numAmount <= 0) newErrors.amount = 'Amount must be positive';
    else if ((amount.split('.')[1] || '').length > 2) newErrors.amount = 'Amount must have at most 2 decimal places';

    if (!category) newErrors.category = 'Category is required';
    if (availableBalanceSources.length > 0 && !balanceSourceId) newErrors.balanceSource = 'Source is required';

    if (!date) newErrors.date = 'Date is required';
    else {
      const selectedDate = new Date(date);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (selectedDate > today) newErrors.date = 'Date cannot be in the future';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      const transaction: Omit<Transaction, 'id' | 'createdAt'> = {
        description: description.trim(),
        amount: parseFloat(amount),
        type,
        category,
        balanceSourceId: balanceSourceId || undefined,
        date,
      };
      if (editTransaction) updateTransaction(editTransaction.id, transaction);
      else addTransaction(transaction);
      if (!editTransaction) {
        setDescription('');
        setAmount('');
        setType('expense');
        setCategory('');
        setBalanceSourceId(availableBalanceSources[0]?.id || '');
        setDate(format(new Date(), 'yyyy-MM-dd'));
      }
      setErrors({});
      onSuccess?.();
    } catch (error) {
      setErrors({ submit: error instanceof Error ? error.message : 'Failed to save transaction' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearFieldError = (field: string) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleAmountChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
      setAmount(value);
      clearFieldError('amount');
    }
  };

  const handleTypeChange = (newType: 'income' | 'expense') => {
    setType(newType);
    const newCategories = getCategoriesByType(newType);
    const otherCategory = newCategories.find((cat) => cat.name === 'Other');
    setCategory(otherCategory?.id || newCategories[0]?.id || '');
  };

  const renderError = (id: string, error?: string) => error ? <p id={id} className="mt-2 border-l-4 border-[var(--app-border-strong)] pl-2 text-xs font-black uppercase tracking-[0.08em] text-[var(--app-text)]">{error}</p> : null;

  const inputBase = 'app-input w-full px-3 py-3';
  const labelClass = 'mb-1 block text-[11px] font-black uppercase tracking-[0.14em] text-[var(--app-text-muted)]';

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <label className={`relative flex min-h-[44px] cursor-pointer items-center justify-center border px-4 py-3 text-sm font-black uppercase tracking-[0.12em] ${type === 'income' ? 'bg-[var(--color-black)] text-white border-[var(--color-black)]' : 'border-[var(--app-border-strong)] text-[var(--app-text)]'}`}>
          <input type="radio" name="type" value="income" checked={type === 'income'} onChange={() => handleTypeChange('income')} className="sr-only" />
          <span>Income</span>
        </label>
        <label className={`relative flex min-h-[44px] cursor-pointer items-center justify-center border px-4 py-3 text-sm font-black uppercase tracking-[0.12em] ${type === 'expense' ? 'bg-[var(--color-black)] text-white border-[var(--color-black)]' : 'border-[var(--app-border-strong)] text-[var(--app-text)]'}`}>
          <input type="radio" name="type" value="expense" checked={type === 'expense'} onChange={() => handleTypeChange('expense')} className="sr-only" />
          <span>Expense</span>
        </label>
      </div>

      <div>
        <label htmlFor="description" className={labelClass}>Description <span>*</span></label>
        <input type="text" id="description" value={description} onChange={(e) => { setDescription(e.target.value); clearFieldError('description'); }} placeholder="Enter transaction description" className={`${inputBase} ${errors.description ? 'border-[var(--app-border-strong)]' : ''}`} maxLength={200} aria-invalid={!!errors.description} aria-describedby={errors.description ? 'description-error' : undefined} />
        <div className="mt-1 text-[11px] uppercase tracking-[0.12em] text-[var(--app-text-muted)]">{description.length}/200</div>
        {renderError('description-error', errors.description)}
      </div>

      <div>
        <label htmlFor="amount" className={labelClass}>Amount (₱) <span>*</span></label>
        <input type="text" inputMode="decimal" id="amount" value={amount} onChange={handleAmountChange} placeholder="0.00" className={`${inputBase} app-numeric ${errors.amount ? 'border-[var(--app-border-strong)]' : ''}`} aria-invalid={!!errors.amount} aria-describedby={errors.amount ? 'amount-error' : undefined} />
        {renderError('amount-error', errors.amount)}
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="category" className={labelClass}>Category <span>*</span></label>
          <select id="category" value={category} onChange={(e) => { setCategory(e.target.value); clearFieldError('category'); }} className={inputBase} aria-invalid={!!errors.category} aria-describedby={errors.category ? 'category-error' : undefined}>
            {availableCategories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
          </select>
          {renderError('category-error', errors.category)}
        </div>

        <div>
          <label htmlFor="balanceSource" className={labelClass}>Source {availableBalanceSources.length > 0 ? <span>*</span> : null}</label>
          <select id="balanceSource" value={balanceSourceId} onChange={(e) => { setBalanceSourceId(e.target.value); clearFieldError('balanceSource'); }} className={`${inputBase} ${errors.balanceSource ? 'border-[var(--app-border-strong)]' : ''}`} aria-invalid={!!errors.balanceSource} aria-describedby={errors.balanceSource ? 'balanceSource-error' : undefined}>
            <option value="">{availableBalanceSources.length === 0 ? 'No sources available' : 'Select a source'}</option>
            {availableBalanceSources.map((source: BalanceSource) => <option key={source.id} value={source.id}>{source.name}</option>)}
          </select>
          {renderError('balanceSource-error', errors.balanceSource)}
        </div>
      </div>

      <div>
        <label htmlFor="date" className={labelClass}>Date <span>*</span></label>
        <input type="date" id="date" value={date} onChange={(e) => { setDate(e.target.value); clearFieldError('date'); }} max={format(new Date(), 'yyyy-MM-dd')} className={`${inputBase} ${errors.date ? 'border-[var(--app-border-strong)]' : ''}`} aria-invalid={!!errors.date} aria-describedby={errors.date ? 'date-error' : undefined} />
        {renderError('date-error', errors.date)}
      </div>

      {errors.submit && (
        <div className="border border-[var(--app-border-strong)] bg-[var(--color-paper)] px-4 py-3 text-sm">
          <div className="font-black uppercase tracking-[0.12em]">Save Failed</div>
          <p className="mt-1 text-[var(--app-text-muted)]">{errors.submit}</p>
        </div>
      )}

      <button type="submit" disabled={isSubmitting} className="app-button-primary w-full px-4 text-white disabled:opacity-50">
        {isSubmitting ? (editTransaction ? 'Updating...' : 'Adding...') : editTransaction ? 'Update Transaction' : 'Add Transaction'}
      </button>
    </form>
  );
}
