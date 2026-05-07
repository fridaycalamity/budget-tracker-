import { createContext, useContext, useState, useMemo, useEffect, useCallback, type ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { storageService, calculateSummary, validateTransaction, validateBudgetGoal } from '../utils';
import type {
  Transaction,
  BudgetGoal,
  BudgetContextValue,
  FinancialSummary,
  BalanceSource,
  Subscription,
  SubscriptionPayment,
  CreateSubscriptionInput,
} from '../types';
import { useToast } from './ToastContext';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';
import { offlineDb } from '../offline/db';
import {
  enqueueOutboxItem,
  getOutboxItems,
  getOutboxSize,
  type OutboxMutationType,
} from '../offline/outbox';
import { mergeTransactions } from '../offline/merge';
import { processOutboxQueue } from '../offline/sync';

// Create the context
const BudgetContext = createContext<BudgetContextValue | undefined>(undefined);

// Provider props
interface BudgetProviderProps {
  children: ReactNode;
}

function isNetworkError(error: unknown): boolean {
  if (!navigator.onLine) return true;
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return message.includes('network') || message.includes('fetch') || message.includes('failed');
}

function mapDbToTransaction(row: Record<string, unknown>): Transaction {
  const createdAt = row.created_at as string;
  return {
    id: row.id as string,
    description: row.description as string,
    amount: Number(row.amount),
    type: row.type as 'income' | 'expense',
    category: row.category_id as string,
    balanceSourceId: (row.balance_source_id as string) ?? undefined,
    date: row.date as string,
    createdAt,
    updatedAt: createdAt,
    __syncStatus: 'synced',
  };
}

function toServerTransaction(transaction: Transaction, userId: string) {
  return {
    id: transaction.id,
    description: transaction.description,
    amount: transaction.amount,
    type: transaction.type,
    category_id: transaction.category,
    balance_source_id: transaction.balanceSourceId ?? null,
    date: transaction.date,
    user_id: userId,
    created_at: transaction.createdAt,
  };
}

function mapDbToBalanceSource(row: Record<string, unknown>): BalanceSource {
  return {
    id: row.id as string,
    name: row.name as string,
    userId: row.user_id as string,
    createdAt: (row.created_at as string) ?? new Date().toISOString(),
  };
}

function mapDbToSubscription(row: Record<string, unknown>): Subscription {
  return {
    id: row.id as string,
    name: row.name as string,
    amount: Number(row.amount),
    billingDay: Number(row.billing_day),
    categoryId: row.category_id as string,
    balanceSourceId: (row.balance_source_id as string) ?? undefined,
    isEnabled: Boolean(row.is_enabled),
    userId: row.user_id as string,
    createdAt: (row.created_at as string) ?? new Date().toISOString(),
  };
}

function mapDbToSubscriptionPayment(row: Record<string, unknown>): SubscriptionPayment {
  return {
    id: row.id as string,
    subscriptionId: row.subscription_id as string,
    transactionId: (row.transaction_id as string) ?? null,
    billingMonth: row.billing_month as string,
    userId: row.user_id as string,
    createdAt: (row.created_at as string) ?? new Date().toISOString(),
  };
}

function clearSyncFlags(transaction: Transaction): Transaction {
  return {
    ...transaction,
    __localOnly: false,
    __syncStatus: 'synced',
  };
}

async function withQueueStatus(userId: string, transactions: Transaction[]): Promise<Transaction[]> {
  const outboxItems = await getOutboxItems(userId);
  const queuedById = new Set(
    outboxItems
      .filter((item) => item.type === 'transaction.create' || item.type === 'transaction.update')
      .map((item) => item.entityId)
  );

  return transactions.map((transaction) => {
    if (queuedById.has(transaction.id)) {
      return {
        ...transaction,
        __syncStatus: 'queued',
        __localOnly: true,
      };
    }

    return clearSyncFlags(transaction);
  });
}

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

const DEFAULT_BALANCE_SOURCES = ['GoTyme', 'BPI', 'Gcash', 'Cash'];

export function BudgetProvider({ children }: BudgetProviderProps) {
  const { showToast } = useToast();
  const { user } = useAuth();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balanceSources, setBalanceSources] = useState<BalanceSource[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [subscriptionPayments, setSubscriptionPayments] = useState<SubscriptionPayment[]>([]);
  const [budgetGoal, setBudgetGoalState] = useState<BudgetGoal | null>(null);
  const [loading, setLoading] = useState(true);
  const [queuedCount, setQueuedCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  const persistUserTransactions = useCallback(async (userId: string, next: Transaction[]) => {
    await offlineDb.setTransactions(userId, next);
  }, []);

  const refreshQueueCount = useCallback(async () => {
    if (!user) {
      setQueuedCount(0);
      return;
    }
    const count = await getOutboxSize(user.id);
    setQueuedCount(count);
  }, [user]);

  const fetchRemoteTransactions = useCallback(async (userId: string): Promise<Transaction[]> => {
    const { data: txData, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });
    if (txError) throw txError;
    return (txData ?? []).map(mapDbToTransaction);
  }, []);

  const syncOutbox = useCallback(async () => {
    if (!user || !navigator.onLine) return;
    setIsSyncing(true);
    try {
      await processOutboxQueue(user.id);
      await refreshQueueCount();
      const remoteTransactions = await fetchRemoteTransactions(user.id);
      const localTransactions = await offlineDb.getTransactions(user.id);
      const merged = mergeTransactions(localTransactions, remoteTransactions);
      const mergedWithStatus = await withQueueStatus(user.id, merged);
      setTransactions(mergedWithStatus);
      await persistUserTransactions(user.id, mergedWithStatus);
    } catch (error) {
      if (!isNetworkError(error)) {
        console.error('Sync failed:', error);
        showToast('Failed to sync offline changes.', 'error');
      }
    } finally {
      setIsSyncing(false);
    }
  }, [fetchRemoteTransactions, persistUserTransactions, refreshQueueCount, showToast, user]);

  // Generate subscription transactions for the current month
  const generateSubscriptionTransactions = useCallback(async (
    userId: string,
    subs: Subscription[],
    payments: SubscriptionPayment[]
  ): Promise<Transaction[]> => {
    const currentMonth = getCurrentMonth();
    const now = new Date();
    const maxDay = getDaysInMonth(now.getFullYear(), now.getMonth() + 1);

    const generated: Transaction[] = [];

    for (const sub of subs) {
      if (!sub.isEnabled) continue;

      // Check if already paid for this month
      const alreadyPaid = payments.some(
        (p) => p.subscriptionId === sub.id && p.billingMonth === currentMonth
      );
      if (alreadyPaid) continue;

      // Determine billing date (cap to last day of month)
      const day = Math.min(sub.billingDay, maxDay);
      const dateStr = `${currentMonth}-${String(day).padStart(2, '0')}`;

      const txId = uuidv4();
      const nowIso = new Date().toISOString();

      const txn: Transaction = {
        id: txId,
        description: sub.name,
        amount: sub.amount,
        type: 'expense',
        category: sub.categoryId,
        balanceSourceId: sub.balanceSourceId,
        date: dateStr,
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      // Save to Supabase
      const { data, error } = await supabase
        .from('transactions')
        .upsert(toServerTransaction(txn, userId), { onConflict: 'id' })
        .select()
        .single();

      if (error) {
        console.error('Failed to generate subscription transaction:', error);
        continue;
      }

      // Record payment
      const { error: payError } = await supabase.from('subscription_payments').insert({
        subscription_id: sub.id,
        transaction_id: txId,
        billing_month: currentMonth,
        user_id: userId,
      });
      if (payError) console.error('Failed to record subscription payment:', payError);

      generated.push(clearSyncFlags(mapDbToTransaction(data!)));
    }

    return generated;
  }, []);

  const fetchData = useCallback(async () => {
    if (!user) {
      setTransactions(storageService.getTransactions());
      setBudgetGoalState(storageService.getBudgetGoal());
      setQueuedCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    const userId = user.id;

    try {
      const localTransactions = await offlineDb.getTransactions(userId);
      const localSources = await offlineDb.getBalanceSources(userId);
      const localSubscriptions = await offlineDb.getSubscriptions(userId);
      const localPayments = await offlineDb.getSubscriptionPayments(userId);
      if (localTransactions.length > 0) {
        const localWithStatus = await withQueueStatus(userId, localTransactions);
        setTransactions(localWithStatus);
      }
      if (localSources.length > 0) setBalanceSources(localSources);
      if (localSubscriptions.length > 0) setSubscriptions(localSubscriptions);
      if (localPayments.length > 0) setSubscriptionPayments(localPayments);

      await refreshQueueCount();

      // Fetch balance sources
      let { data: sourcesData } = await supabase
        .from('balance_sources')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });
      if ((sourcesData ?? []).length === 0 && navigator.onLine) {
        const { data: seeded } = await supabase
          .from('balance_sources')
          .insert(DEFAULT_BALANCE_SOURCES.map((name) => ({ name, user_id: userId })))
          .select();
        sourcesData = seeded ?? [];
      }
      const fetchedSources = (sourcesData ?? []).map(mapDbToBalanceSource);
      setBalanceSources(fetchedSources);
      await offlineDb.setBalanceSources(userId, fetchedSources);

      // Fetch subscriptions
      const { data: subsData } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .order('name', { ascending: true });
      const subs = (subsData ?? []).map(mapDbToSubscription);
      setSubscriptions(subs);
      await offlineDb.setSubscriptions(userId, subs);

      // Fetch subscription payments
      const { data: paymentsData } = await supabase
        .from('subscription_payments')
        .select('*')
        .eq('user_id', userId);
      const payments = (paymentsData ?? []).map(mapDbToSubscriptionPayment);
      setSubscriptionPayments(payments);
      await offlineDb.setSubscriptionPayments(userId, payments);

      if (!navigator.onLine) {
        setLoading(false);
        return;
      }

      // Generate subscription transactions if needed
      const currentMonth = getCurrentMonth();
      const currentPayments = payments.filter((p) => p.billingMonth === currentMonth);
      const currentPaymentSubIds = new Set(currentPayments.map((p) => p.subscriptionId));
      const unpaidActiveSubs = subs.filter(
        (s) => s.isEnabled && !currentPaymentSubIds.has(s.id)
      );

      if (unpaidActiveSubs.length > 0) {
        const remoteTxns = await fetchRemoteTransactions(userId);
        const localTxns = await offlineDb.getTransactions(userId);
        const merged = mergeTransactions(localTxns, remoteTxns);

        const generated = await generateSubscriptionTransactions(
          userId,
          unpaidActiveSubs,
          payments
        );

        if (generated.length > 0) {
          const allTxns = [...generated, ...merged];
          const withStatus = await withQueueStatus(userId, allTxns);
          setTransactions(withStatus);
          await persistUserTransactions(userId, withStatus);

          // Refresh payments after generation
          const { data: updatedPayments } = await supabase
            .from('subscription_payments')
            .select('*')
            .eq('user_id', userId);
          const refreshedPayments = (updatedPayments ?? []).map(mapDbToSubscriptionPayment);
          setSubscriptionPayments(refreshedPayments);
          await offlineDb.setSubscriptionPayments(userId, refreshedPayments);
        } else {
          // No new subs generated, proceed with normal fetch
          if ((await getOutboxSize(userId)) > 0) {
            await syncOutbox();
            const afterSync = await offlineDb.getTransactions(userId);
            const withStatus = await withQueueStatus(userId, afterSync);
            setTransactions(withStatus);
            await persistUserTransactions(userId, withStatus);
          } else {
            const remoteTransactions = await fetchRemoteTransactions(userId);
            const newestLocal = await offlineDb.getTransactions(userId);
            const mergedTxns = mergeTransactions(newestLocal, remoteTransactions);
            const mergedWithStatus = await withQueueStatus(userId, mergedTxns);
            setTransactions(mergedWithStatus);
            await persistUserTransactions(userId, mergedWithStatus);
          }
        }
      } else {
        // No unpaid subscriptions, proceed normally
        if ((await getOutboxSize(userId)) > 0) {
          await syncOutbox();
          const afterSync = await offlineDb.getTransactions(userId);
          const withStatus = await withQueueStatus(userId, afterSync);
          setTransactions(withStatus);
          await persistUserTransactions(userId, withStatus);
        } else {
          const remoteTransactions = await fetchRemoteTransactions(userId);
          const newestLocal = await offlineDb.getTransactions(userId);
          const merged = mergeTransactions(newestLocal, remoteTransactions);
          const mergedWithStatus = await withQueueStatus(userId, merged);
          setTransactions(mergedWithStatus);
          await persistUserTransactions(userId, mergedWithStatus);
        }
      }

      // Fetch user_settings for budget_limit
      const { data: settings, error: settingsError } = await supabase
        .from('user_settings')
        .select('budget_limit')
        .eq('user_id', userId)
        .single();

      if (settingsError && settingsError.code !== 'PGRST116') {
        throw settingsError;
      }

      if (settings && Number(settings.budget_limit) > 0) {
        setBudgetGoalState({ monthlyLimit: Number(settings.budget_limit) });
      } else {
        setBudgetGoalState(null);
      }
    } catch (error) {
      console.error('Error fetching budget data:', error);
      showToast('Failed to load server data. Using local cache.', 'error');
      const localFallback = await offlineDb.getTransactions(userId);
      if (localFallback.length > 0) {
        const localWithStatus = await withQueueStatus(userId, localFallback);
        setTransactions(localWithStatus);
      }
      setBudgetGoalState(storageService.getBudgetGoal());
    } finally {
      setLoading(false);
    }
  }, [fetchRemoteTransactions, persistUserTransactions, refreshQueueCount, showToast, syncOutbox, user, generateSubscriptionTransactions]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      void (async () => {
        await syncOutbox();
        await fetchData();
      })();
    };
    const handleOffline = () => {
      setIsOffline(true);
    };
    const handleVisibilityOrFocus = () => {
      if (!user || !navigator.onLine) return;
      void fetchData();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
    };
  }, [fetchData, syncOutbox, user]);

  // Calculate financial summary whenever transactions change
  const summary: FinancialSummary = useMemo(() => {
    return {
      ...calculateSummary(transactions),
      startBalance: 0,
      startBalanceBySource: {},
    };
  }, [transactions]);

  // Monthly summary calculator
  const getMonthlySummary = useCallback(
    (month: string): FinancialSummary => {
      const priorTxns = transactions.filter((t) => t.date.slice(0, 7) < month);
      const monthTxns = transactions.filter((t) => t.date.startsWith(month));
      const throughMonthTxns = transactions.filter((t) => t.date.slice(0, 7) <= month);

      const priorSummary = calculateSummary(priorTxns);
      const monthSummary = calculateSummary(monthTxns);
      const throughMonthSummary = calculateSummary(throughMonthTxns);

      return {
        totalIncome: monthSummary.totalIncome,
        totalExpenses: monthSummary.totalExpenses,
        balance: throughMonthSummary.balance,
        startBalance: priorSummary.balance,
        expensesByCategory: monthSummary.expensesByCategory,
        balanceBySource: throughMonthSummary.balanceBySource,
        startBalanceBySource: priorSummary.balanceBySource,
      };
    },
    [transactions]
  );

  const queueMutation = useCallback(
    async (
      type: OutboxMutationType,
      entityId: string,
      payload: Partial<Transaction> & { id: string }
    ) => {
      if (!user) return;
      await enqueueOutboxItem(user.id, { type, entityId, payload });
      await refreshQueueCount();
    },
    [refreshQueueCount, user]
  );

  // ===== Balance Source CRUD =====

  const addBalanceSource = useCallback(async (name: string) => {
    if (!user) return;
    const trimmedName = name.trim();
    const normalized = trimmedName.toLowerCase();
    if (balanceSources.some((source) => source.name.trim().toLowerCase() === normalized)) {
      showToast('A balance source with this name already exists.', 'error');
      return;
    }
    const { data, error } = await supabase
      .from('balance_sources')
      .insert({ name: trimmedName, user_id: user.id })
      .select()
      .single();
    if (error) {
      showToast('Failed to add balance source.', 'error');
      throw error;
    }
    const source = mapDbToBalanceSource(data);
    const next = [...balanceSources, source];
    setBalanceSources(next);
    await offlineDb.setBalanceSources(user.id, next);
    showToast(`"${source.name}" added.`, 'success');
  }, [user, showToast, balanceSources]);

  const updateBalanceSource = useCallback(async (id: string, name: string) => {
    if (!user) return;
    const trimmedName = name.trim();
    const normalized = trimmedName.toLowerCase();
    if (balanceSources.some((source) => source.id !== id && source.name.trim().toLowerCase() === normalized)) {
      showToast('A balance source with this name already exists.', 'error');
      return;
    }
    const { error } = await supabase
      .from('balance_sources')
      .update({ name: trimmedName })
      .eq('id', id)
      .eq('user_id', user.id);
    if (error) {
      showToast('Failed to update balance source.', 'error');
      throw error;
    }
    const next = balanceSources.map((s) => (s.id === id ? { ...s, name: trimmedName } : s));
    setBalanceSources(next);
    await offlineDb.setBalanceSources(user.id, next);
    showToast('Balance source updated.', 'success');
  }, [user, showToast, balanceSources]);

  const deleteBalanceSource = useCallback(async (id: string) => {
    if (!user) return;
    // Check if any transactions reference this source
    const hasTransactions = transactions.some((t) => t.balanceSourceId === id);
    if (hasTransactions) {
      showToast('Cannot delete: transactions are assigned to this source.', 'error');
      return;
    }
    const { error } = await supabase
      .from('balance_sources')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    if (error) {
      showToast('Failed to delete balance source.', 'error');
      throw error;
    }
    const next = balanceSources.filter((s) => s.id !== id);
    setBalanceSources(next);
    await offlineDb.setBalanceSources(user.id, next);
    showToast('Balance source deleted.', 'success');
  }, [user, showToast, transactions, balanceSources]);

  const assignTransactionsToSource = useCallback(async (transactionIds: string[], sourceId: string) => {
    if (transactionIds.length === 0) return;

    const nextTransactions = transactions.map((transaction) =>
      transactionIds.includes(transaction.id)
        ? { ...transaction, balanceSourceId: sourceId, updatedAt: new Date().toISOString() }
        : transaction
    );

    if (user) {
      const { error } = await supabase
        .from('transactions')
        .update({ balance_source_id: sourceId })
        .in('id', transactionIds)
        .eq('user_id', user.id);
      if (error) {
        showToast('Failed to assign unassigned transactions.', 'error');
        throw error;
      }
      setTransactions(nextTransactions);
      await persistUserTransactions(user.id, nextTransactions);
      showToast('Unassigned transactions were assigned successfully.', 'success');
      return;
    }

    setTransactions(nextTransactions);
    storageService.saveTransactions(nextTransactions);
    showToast('Unassigned transactions were assigned successfully.', 'success');
  }, [transactions, user, showToast, persistUserTransactions]);

  // ===== Subscription CRUD =====

  const addSubscription = useCallback(async (sub: CreateSubscriptionInput) => {
    if (!user) return;
    const startMode = sub.startMode ?? 'current';
    const { data, error } = await supabase
      .from('subscriptions')
      .insert({
        name: sub.name,
        amount: sub.amount,
        billing_day: sub.billingDay,
        category_id: sub.categoryId,
        balance_source_id: sub.balanceSourceId ?? null,
        is_enabled: sub.isEnabled,
        user_id: user.id,
      })
      .select()
      .single();
    if (error) {
      showToast('Failed to add subscription.', 'error');
      throw error;
    }

    const subscription = mapDbToSubscription(data);
    const next = [...subscriptions, subscription];
    setSubscriptions(next);
    await offlineDb.setSubscriptions(user.id, next);

    if (subscription.isEnabled && startMode === 'next') {
      const billingMonth = getCurrentMonth();
      const { data: paymentData, error: paymentError } = await supabase
        .from('subscription_payments')
        .insert({
          subscription_id: subscription.id,
          transaction_id: null,
          billing_month: billingMonth,
          user_id: user.id,
        })
        .select()
        .single();

      if (paymentError) {
        showToast('Subscription added, but failed to mark current month as already handled.', 'error');
        throw paymentError;
      }

      const payment = mapDbToSubscriptionPayment(paymentData);
      const nextPayments = [...subscriptionPayments, payment];
      setSubscriptionPayments(nextPayments);
      await offlineDb.setSubscriptionPayments(user.id, nextPayments);
      showToast(`"${subscription.name}" added. Current month skipped; future months will generate normally.`, 'success');
      return;
    }

    showToast(`"${subscription.name}" added.`, 'success');
  }, [user, showToast, subscriptions, subscriptionPayments]);

  const updateSubscription = useCallback(async (id: string, updates: Partial<Subscription>) => {
    if (!user) return;
    const dbUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.amount !== undefined) dbUpdates.amount = updates.amount;
    if (updates.billingDay !== undefined) dbUpdates.billing_day = updates.billingDay;
    if (updates.categoryId !== undefined) dbUpdates.category_id = updates.categoryId;
    if (updates.balanceSourceId !== undefined) dbUpdates.balance_source_id = updates.balanceSourceId ?? null;
    if (updates.isEnabled !== undefined) dbUpdates.is_enabled = updates.isEnabled;

    const { error } = await supabase
      .from('subscriptions')
      .update(dbUpdates)
      .eq('id', id)
      .eq('user_id', user.id);
    if (error) {
      showToast('Failed to update subscription.', 'error');
      throw error;
    }
    const next = subscriptions.map((s) => {
      if (s.id !== id) return s;
      const updated = { ...s };
      if (updates.name !== undefined) updated.name = updates.name;
      if (updates.amount !== undefined) updated.amount = updates.amount;
      if (updates.billingDay !== undefined) updated.billingDay = updates.billingDay;
      if (updates.categoryId !== undefined) updated.categoryId = updates.categoryId;
      if (updates.balanceSourceId !== undefined) updated.balanceSourceId = updates.balanceSourceId;
      if (updates.isEnabled !== undefined) updated.isEnabled = updates.isEnabled;
      return updated;
    });
    setSubscriptions(next);
    await offlineDb.setSubscriptions(user.id, next);
    showToast('Subscription updated.', 'success');
  }, [user, showToast]);

  const deleteSubscription = useCallback(async (id: string) => {
    if (!user) return;
    const { error } = await supabase
      .from('subscriptions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    if (error) {
      showToast('Failed to delete subscription.', 'error');
      throw error;
    }
    const nextSubscriptions = subscriptions.filter((s) => s.id !== id);
    const nextPayments = subscriptionPayments.filter((p) => p.subscriptionId !== id);
    setSubscriptions(nextSubscriptions);
    setSubscriptionPayments(nextPayments);
    await offlineDb.setSubscriptions(user.id, nextSubscriptions);
    await offlineDb.setSubscriptionPayments(user.id, nextPayments);
    showToast('Subscription deleted.', 'success');
  }, [user, showToast]);

  const toggleSubscription = useCallback(async (id: string) => {
    if (!user) return;
    const sub = subscriptions.find((s) => s.id === id);
    if (!sub) return;
    const nextState = !sub.isEnabled;
    const { error } = await supabase
      .from('subscriptions')
      .update({ is_enabled: nextState })
      .eq('id', id)
      .eq('user_id', user.id);
    if (error) {
      showToast('Failed to update subscription status.', 'error');
      throw error;
    }
    const next = subscriptions.map((s) => (s.id === id ? { ...s, isEnabled: nextState } : s));
    setSubscriptions(next);
    await offlineDb.setSubscriptions(user.id, next);
    showToast(nextState ? 'Subscription resumed.' : 'Subscription paused.', 'success');
  }, [user, subscriptions, showToast]);

  // ===== Transaction CRUD (existing, updated with balanceSourceId) =====

  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'createdAt'>) => {
    const validation = validateTransaction(transaction);
    if (balanceSources.length > 0 && !transaction.balanceSourceId) {
      validation.errors.balanceSourceId = 'Source is required';
      validation.isValid = false;
    }
    if (!validation.isValid) {
      const errorMessages = Object.values(validation.errors).join(', ');
      showToast(`Validation failed: ${errorMessages}`, 'error');
      throw new Error(`Invalid transaction: ${JSON.stringify(validation.errors)}`);
    }

    const nowIso = new Date().toISOString();
    const newTransaction: Transaction = {
      ...transaction,
      id: uuidv4(),
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    if (user) {
      const optimisticTransaction: Transaction = {
        ...newTransaction,
        __syncStatus: navigator.onLine ? 'syncing' : 'queued',
        __localOnly: !navigator.onLine,
      };

      const optimistic = [optimisticTransaction, ...transactions];
      setTransactions(optimistic);
      await persistUserTransactions(user.id, optimistic);

      if (!navigator.onLine) {
        await queueMutation('transaction.create', newTransaction.id, newTransaction);
        showToast('Offline: transaction queued for sync.', 'success');
        return;
      }

      try {
        const { data, error } = await supabase
          .from('transactions')
          .upsert(toServerTransaction(newTransaction, user.id), { onConflict: 'id' })
          .select()
          .single();

        if (error) throw error;

        const savedTransaction = clearSyncFlags(mapDbToTransaction(data));
        const updated = optimistic.map((tx) =>
          tx.id === savedTransaction.id ? savedTransaction : tx
        );
        setTransactions(updated);
        await persistUserTransactions(user.id, updated);
        showToast('Transaction added successfully!', 'success');
      } catch (error) {
        const queued: Transaction[] = optimistic.map((tx) =>
          tx.id === newTransaction.id
            ? { ...tx, __syncStatus: 'queued' as const, __localOnly: true }
            : tx
        );
        setTransactions(queued);
        await persistUserTransactions(user.id, queued);
        await queueMutation('transaction.create', newTransaction.id, newTransaction);
        showToast('Offline: transaction queued for sync.', 'success');
      }
      return;
    }

    const updated = [newTransaction, ...transactions];
    setTransactions(updated);
    storageService.saveTransactions(updated);
    showToast('Transaction added successfully!', 'success');
  };

  const updateTransaction = async (id: string, transaction: Omit<Transaction, 'id' | 'createdAt'>) => {
    const validation = validateTransaction(transaction);
    if (balanceSources.length > 0 && !transaction.balanceSourceId) {
      validation.errors.balanceSourceId = 'Source is required';
      validation.isValid = false;
    }
    if (!validation.isValid) {
      const errorMessages = Object.values(validation.errors).join(', ');
      showToast(`Validation failed: ${errorMessages}`, 'error');
      throw new Error(`Invalid transaction: ${JSON.stringify(validation.errors)}`);
    }

    const existingTransaction = transactions.find((t) => t.id === id);
    if (!existingTransaction) {
      showToast('Transaction not found', 'error');
      throw new Error(`Transaction with id ${id} not found`);
    }

    const updatedTransaction: Transaction = {
      ...transaction,
      id: existingTransaction.id,
      createdAt: existingTransaction.createdAt,
      updatedAt: new Date().toISOString(),
      __syncStatus: navigator.onLine ? 'syncing' : 'queued',
      __localOnly: !navigator.onLine,
    };

    if (user) {
      const optimistic = transactions.map((t) => (t.id === id ? updatedTransaction : t));
      setTransactions(optimistic);
      await persistUserTransactions(user.id, optimistic);

      if (!navigator.onLine) {
        await queueMutation('transaction.update', id, updatedTransaction);
        showToast('Offline: update queued for sync.', 'success');
        return;
      }

      try {
        const { data, error } = await supabase
          .from('transactions')
          .upsert(toServerTransaction(updatedTransaction, user.id), { onConflict: 'id' })
          .select()
          .single();

        if (error) throw error;

        const synced = clearSyncFlags(mapDbToTransaction(data));
        const next = optimistic.map((t) => (t.id === id ? synced : t));
        setTransactions(next);
        await persistUserTransactions(user.id, next);
        showToast('Transaction updated successfully!', 'success');
      } catch (error) {
        const queued: Transaction[] = optimistic.map((t) =>
          t.id === id ? { ...t, __syncStatus: 'queued' as const, __localOnly: true } : t
        );
        setTransactions(queued);
        await persistUserTransactions(user.id, queued);
        await queueMutation('transaction.update', id, updatedTransaction);
        showToast('Offline: update queued for sync.', 'success');
      }
      return;
    }

    const updated = transactions.map((t) => (t.id === id ? updatedTransaction : t));
    setTransactions(updated);
    storageService.saveTransactions(updated);
    showToast('Transaction updated successfully!', 'success');
  };

  const deleteTransaction = async (id: string) => {
    if (user) {
      const previous = transactions;
      const updated = transactions.filter((t) => t.id !== id);
      setTransactions(updated);
      await persistUserTransactions(user.id, updated);

      if (!navigator.onLine) {
        await queueMutation('transaction.delete', id, { id });
        showToast('Offline: deletion queued for sync.', 'success');
        return;
      }

      try {
        const { error } = await supabase
          .from('transactions')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) throw error;
        showToast('Transaction deleted successfully!', 'success');
      } catch (error) {
        setTransactions(previous);
        await persistUserTransactions(user.id, previous);
        showToast('Failed to delete from server. Keeping local copy.', 'error');
      }
      return;
    }

    const updated = transactions.filter((t) => t.id !== id);
    setTransactions(updated);
    storageService.saveTransactions(updated);
    showToast('Transaction deleted successfully!', 'success');
  };

  const setBudgetGoal = async (goal: BudgetGoal | null) => {
    if (goal !== null) {
      const goalToValidate = { ...goal, month: goal.month ?? getCurrentMonth() };
      const validation = validateBudgetGoal(goalToValidate);
      if (!validation.isValid) {
        throw new Error(`Invalid budget goal: ${JSON.stringify(validation.errors)}`);
      }
    }

    if (user) {
      try {
        const { error } = await supabase.from('user_settings').upsert(
          {
            user_id: user.id,
            budget_limit: goal?.monthlyLimit ?? 0,
          },
          { onConflict: 'user_id' }
        );
        if (error) throw error;
        setBudgetGoalState(goal ? { monthlyLimit: goal.monthlyLimit } : null);
      } catch (error) {
        console.error('Error saving budget goal:', error);
        showToast('Failed to save budget goal to server.', 'error');
      }
    } else {
      setBudgetGoalState(goal ? { monthlyLimit: goal.monthlyLimit } : null);
      storageService.saveBudgetGoal(goal ? { monthlyLimit: goal.monthlyLimit } : null);
    }
  };

  const clearAllData = async () => {
    if (user) {
      try {
        await supabase.from('transactions').delete().eq('user_id', user.id);
        await supabase.from('subscriptions').delete().eq('user_id', user.id);
        await supabase.from('subscription_payments').delete().eq('user_id', user.id);
        await supabase.from('balance_sources').delete().eq('user_id', user.id);
        await supabase
          .from('user_settings')
          .update({ budget_limit: 0 })
          .eq('user_id', user.id);
      } catch (error) {
        console.error('Error clearing data:', error);
        showToast('Failed to clear data on server. Local data not removed.', 'error');
        return;
      }

      await offlineDb.clearUserData(user.id);
      setQueuedCount(0);
    }

    setTransactions([]);
    setBalanceSources([]);
    setSubscriptions([]);
    setSubscriptionPayments([]);
    setBudgetGoalState(null);
    storageService.clearAll();
  };

  const retrySync = useCallback(async () => {
    await syncOutbox();
  }, [syncOutbox]);

  const clearLocalCache = useCallback(async () => {
    if (!user) return;
    await offlineDb.clearUserData(user.id);
    setQueuedCount(0);
    setTransactions([]);
    setBalanceSources([]);
    setSubscriptions([]);
    setSubscriptionPayments([]);
  }, [user]);

  const forceRefreshFromServer = useCallback(async () => {
    if (!user) {
      showToast('Must be logged in to refresh from server.', 'error');
      return;
    }

    setIsSyncing(true);
    try {
      await offlineDb.clearUserData(user.id);
      setQueuedCount(0);
      setTransactions([]);
      setBalanceSources([]);
      setSubscriptions([]);
      setSubscriptionPayments([]);

      const remoteTransactions = await fetchRemoteTransactions(user.id);
      const mergedWithStatus = await withQueueStatus(user.id, remoteTransactions);
      setTransactions(mergedWithStatus);
      await persistUserTransactions(user.id, mergedWithStatus);

      // Re-fetch balance sources
      const { data: sourcesData } = await supabase
        .from('balance_sources')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });
      const refreshedSources = (sourcesData ?? []).map(mapDbToBalanceSource);
      setBalanceSources(refreshedSources);
      await offlineDb.setBalanceSources(user.id, refreshedSources);

      // Re-fetch subscriptions
      const { data: subsData } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true });
      const refreshedSubscriptions = (subsData ?? []).map(mapDbToSubscription);
      setSubscriptions(refreshedSubscriptions);
      await offlineDb.setSubscriptions(user.id, refreshedSubscriptions);

      // Re-fetch subscription payments
      const { data: paymentsData } = await supabase
        .from('subscription_payments')
        .select('*')
        .eq('user_id', user.id);
      const refreshedPayments = (paymentsData ?? []).map(mapDbToSubscriptionPayment);
      setSubscriptionPayments(refreshedPayments);
      await offlineDb.setSubscriptionPayments(user.id, refreshedPayments);

      const { data: settings } = await supabase
        .from('user_settings')
        .select('budget_limit')
        .eq('user_id', user.id)
        .single();

      if (settings && Number(settings.budget_limit) > 0) {
        setBudgetGoalState({ monthlyLimit: Number(settings.budget_limit) });
      } else {
        setBudgetGoalState(null);
      }

      showToast('Refreshed from server.', 'success');
    } catch (error) {
      console.error('Force refresh failed:', error);
      showToast('Failed to refresh from server. Check your connection.', 'error');
    } finally {
      setIsSyncing(false);
    }
  }, [fetchRemoteTransactions, persistUserTransactions, showToast, user]);

  const value: BudgetContextValue = {
    transactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    balanceSources,
    addBalanceSource,
    updateBalanceSource,
    deleteBalanceSource,
    assignTransactionsToSource,
    subscriptions,
    addSubscription,
    updateSubscription,
    deleteSubscription,
    toggleSubscription,
    subscriptionPayments,
    budgetGoal,
    setBudgetGoal,
    getMonthlySummary,
    clearAllData,
    retrySync,
    clearLocalCache,
    forceRefreshFromServer,
    queuedCount,
    isSyncing,
    isOffline,
    summary,
    loading,
  };

  return <BudgetContext.Provider value={value}>{children}</BudgetContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useBudget(): BudgetContextValue {
  const context = useContext(BudgetContext);
  if (context === undefined) {
    throw new Error('useBudget must be used within a BudgetProvider');
  }
  return context;
}
