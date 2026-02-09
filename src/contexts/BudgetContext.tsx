import { createContext, useContext, useState, useMemo, useEffect, useCallback, type ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { storageService, calculateSummary, validateTransaction, validateBudgetGoal } from '../utils';
import type { Transaction, BudgetGoal, BudgetContextValue, FinancialSummary } from '../types';
import { useToast } from './ToastContext';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

// Create the context
const BudgetContext = createContext<BudgetContextValue | undefined>(undefined);

// Provider props
interface BudgetProviderProps {
  children: ReactNode;
}

// Map a Supabase row to a frontend Transaction
function mapDbToTransaction(row: Record<string, unknown>): Transaction {
  return {
    id: row.id as string,
    description: row.description as string,
    amount: Number(row.amount),
    type: row.type as 'income' | 'expense',
    category: row.category_id as string,
    date: row.date as string,
    createdAt: row.created_at as string,
  };
}

export function BudgetProvider({ children }: BudgetProviderProps) {
  const { showToast } = useToast();
  const { user } = useAuth();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgetGoal, setBudgetGoalState] = useState<BudgetGoal | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch data from Supabase when user changes
  const fetchData = useCallback(async () => {
    if (!user) {
      // Fallback to localStorage when not authenticated
      setTransactions(storageService.getTransactions());
      setBudgetGoalState(storageService.getBudgetGoal());
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Fetch transactions
      const { data: txData, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (txError) throw txError;
      setTransactions((txData ?? []).map(mapDbToTransaction));

      // Fetch user_settings for budget_limit
      const { data: settings, error: settingsError } = await supabase
        .from('user_settings')
        .select('budget_limit')
        .eq('user_id', user.id)
        .single();

      if (settingsError && settingsError.code !== 'PGRST116') {
        // PGRST116 = no rows found, which is OK for new users
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
      showToast('Failed to load data from server. Using local data.', 'error');
      // Fallback to localStorage
      setTransactions(storageService.getTransactions());
      setBudgetGoalState(storageService.getBudgetGoal());
    } finally {
      setLoading(false);
    }
  }, [user, showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Calculate financial summary whenever transactions change
  const summary: FinancialSummary = useMemo(() => {
    return calculateSummary(transactions);
  }, [transactions]);

  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'createdAt'>) => {
    const validation = validateTransaction(transaction);
    if (!validation.isValid) {
      const errorMessages = Object.values(validation.errors).join(', ');
      showToast(`Validation failed: ${errorMessages}`, 'error');
      throw new Error(`Invalid transaction: ${JSON.stringify(validation.errors)}`);
    }

    const newTransaction: Transaction = {
      ...transaction,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };

    if (user) {
      try {
        const { data, error } = await supabase
          .from('transactions')
          .insert({
            description: newTransaction.description,
            amount: newTransaction.amount,
            type: newTransaction.type,
            category_id: newTransaction.category,
            date: newTransaction.date,
            user_id: user.id,
          })
          .select()
          .single();

        if (error) throw error;

        const savedTransaction = mapDbToTransaction(data);
        setTransactions((prev) => [savedTransaction, ...prev]);
        showToast('Transaction added successfully!', 'success');
      } catch (error) {
        console.error('Error adding transaction:', error);
        showToast('Failed to save transaction to server.', 'error');
        // Fallback to localStorage
        const updated = [newTransaction, ...transactions];
        setTransactions(updated);
        storageService.saveTransactions(updated);
      }
    } else {
      // localStorage fallback
      const updated = [newTransaction, ...transactions];
      setTransactions(updated);
      storageService.saveTransactions(updated);
      showToast('Transaction added successfully!', 'success');
    }
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

    if (user) {
      try {
        const { error } = await supabase
          .from('transactions')
          .update({
            description: transaction.description,
            amount: transaction.amount,
            type: transaction.type,
            category_id: transaction.category,
            date: transaction.date,
          })
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) throw error;

        const updatedTransaction: Transaction = {
          ...transaction,
          id: existingTransaction.id,
          createdAt: existingTransaction.createdAt,
        };

        setTransactions((prev) => prev.map((t) => (t.id === id ? updatedTransaction : t)));
        showToast('Transaction updated successfully!', 'success');
      } catch (error) {
        console.error('Error updating transaction:', error);
        showToast('Failed to update transaction on server.', 'error');
      }
    } else {
      const updatedTransaction: Transaction = {
        ...transaction,
        id: existingTransaction.id,
        createdAt: existingTransaction.createdAt,
      };
      const updated = transactions.map((t) => (t.id === id ? updatedTransaction : t));
      setTransactions(updated);
      storageService.saveTransactions(updated);
      showToast('Transaction updated successfully!', 'success');
    }
  };

  const deleteTransaction = async (id: string) => {
    if (user) {
      try {
        const { error } = await supabase
          .from('transactions')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) throw error;

        setTransactions((prev) => prev.filter((t) => t.id !== id));
        showToast('Transaction deleted successfully!', 'success');
      } catch (error) {
        console.error('Error deleting transaction:', error);
        showToast('Failed to delete transaction from server.', 'error');
      }
    } else {
      const updated = transactions.filter((t) => t.id !== id);
      setTransactions(updated);
      storageService.saveTransactions(updated);
      showToast('Transaction deleted successfully!', 'success');
    }
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
    }

    setTransactions([]);
    setBudgetGoalState(null);
    storageService.clearAll();
  };

  const value: BudgetContextValue = {
    transactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    budgetGoal,
    setBudgetGoal,
    clearAllData,
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
