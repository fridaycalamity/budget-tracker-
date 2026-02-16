import { createContext, useContext, useState, useMemo, useEffect, useCallback, type ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { storageService, calculateSummary, validateTransaction, validateBudgetGoal } from '../utils';
import type { Transaction, BudgetGoal, BudgetContextValue, FinancialSummary } from '../types';
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
    date: transaction.date,
    user_id: userId,
    created_at: transaction.createdAt,
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

export function BudgetProvider({ children }: BudgetProviderProps) {
  const { showToast } = useToast();
  const { user } = useAuth();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
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

  const fetchData = useCallback(async () => {
    if (!user) {
      // Fallback to localStorage when not authenticated
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
      if (localTransactions.length > 0) {
        const localWithStatus = await withQueueStatus(userId, localTransactions);
        setTransactions(localWithStatus);
      }

      await refreshQueueCount();

      if (!navigator.onLine) {
        setLoading(false);
        return;
      }

      if ((await getOutboxSize(userId)) > 0) {
        await syncOutbox();
      }

      const remoteTransactions = await fetchRemoteTransactions(userId);
      const newestLocal = await offlineDb.getTransactions(userId);
      const merged = mergeTransactions(newestLocal, remoteTransactions);
      const mergedWithStatus = await withQueueStatus(userId, merged);

      setTransactions(mergedWithStatus);
      await persistUserTransactions(userId, mergedWithStatus);

      // Fetch user_settings for budget_limit
      const { data: settings, error: settingsError } = await supabase
        .from('user_settings')
        .select('budget_limit')
        .eq('user_id', userId)
        .single();

      if (settingsError && settingsError.code !== 'PGRST116') {
        throw settingsError;
      }

      if (settings && settings.budget_limit > 0) {
        const now = new Date();
        const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        setBudgetGoalState({ monthlyLimit: Number(settings.budget_limit), month });
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
  }, [fetchRemoteTransactions, persistUserTransactions, refreshQueueCount, showToast, syncOutbox, user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      void syncOutbox();
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncOutbox]);

  // Calculate financial summary whenever transactions change
  const summary: FinancialSummary = useMemo(() => {
    return calculateSummary(transactions);
  }, [transactions]);

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

  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'createdAt'>) => {
    const validation = validateTransaction(transaction);
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
        if (isNetworkError(error)) {
          const queued: Transaction[] = optimistic.map((tx) =>
            tx.id === newTransaction.id
              ? { ...tx, __syncStatus: 'queued' as const, __localOnly: true }
              : tx
          );
          setTransactions(queued);
          await persistUserTransactions(user.id, queued);
          await queueMutation('transaction.create', newTransaction.id, newTransaction);
          showToast('Offline: transaction queued for sync.', 'success');
        } else {
          console.error('Error adding transaction:', error);
          showToast('Failed to save transaction to server.', 'error');
        }
      }
      return;
    }

    // localStorage fallback
    const updated = [newTransaction, ...transactions];
    setTransactions(updated);
    storageService.saveTransactions(updated);
    showToast('Transaction added successfully!', 'success');
  };

  const updateTransaction = async (id: string, transaction: Omit<Transaction, 'id' | 'createdAt'>) => {
    const validation = validateTransaction(transaction);
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
        if (isNetworkError(error)) {
          const queued: Transaction[] = optimistic.map((t) =>
            t.id === id ? { ...t, __syncStatus: 'queued' as const, __localOnly: true } : t
          );
          setTransactions(queued);
          await persistUserTransactions(user.id, queued);
          await queueMutation('transaction.update', id, updatedTransaction);
          showToast('Offline: update queued for sync.', 'success');
        } else {
          console.error('Error updating transaction:', error);
          showToast('Failed to update transaction on server.', 'error');
        }
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
        if (isNetworkError(error)) {
          await queueMutation('transaction.delete', id, { id });
          showToast('Offline: deletion queued for sync.', 'success');
        } else {
          console.error('Error deleting transaction:', error);
          setTransactions(previous);
          await persistUserTransactions(user.id, previous);
          showToast('Failed to delete transaction from server.', 'error');
        }
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
      const validation = validateBudgetGoal(goal);
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
        setBudgetGoalState(goal);
      } catch (error) {
        console.error('Error saving budget goal:', error);
        showToast('Failed to save budget goal to server.', 'error');
      }
    } else {
      setBudgetGoalState(goal);
      storageService.saveBudgetGoal(goal);
    }
  };

  const clearAllData = async () => {
    if (user) {
      try {
        await supabase.from('transactions').delete().eq('user_id', user.id);
        await supabase
          .from('user_settings')
          .update({ budget_limit: 0 })
          .eq('user_id', user.id);
      } catch (error) {
        console.error('Error clearing data:', error);
        showToast('Failed to clear data on server.', 'error');
      }

      await offlineDb.clearUserData(user.id);
      setQueuedCount(0);
    }

    setTransactions([]);
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
  }, [user]);

  const value: BudgetContextValue = {
    transactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    budgetGoal,
    setBudgetGoal,
    clearAllData,
    retrySync,
    clearLocalCache,
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
