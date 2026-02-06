import { createContext, useContext, useState, useMemo, type ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { storageService, calculateSummary, validateTransaction, validateBudgetGoal } from '../utils';
import type { Transaction, BudgetGoal, BudgetContextValue, FinancialSummary } from '../types';
import { useToast } from './ToastContext';

// Create the context
const BudgetContext = createContext<BudgetContextValue | undefined>(undefined);

// Provider props
interface BudgetProviderProps {
  children: ReactNode;
}

/**
 * BudgetProvider component
 * Manages transaction and budget goal state with localStorage persistence
 * Calculates financial summary from transactions
 */
export function BudgetProvider({ children }: BudgetProviderProps) {
  const { showToast } = useToast();

  // Initialize transactions from localStorage
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    return storageService.getTransactions();
  });

  // Initialize budget goal from localStorage
  const [budgetGoal, setBudgetGoalState] = useState<BudgetGoal | null>(() => {
    return storageService.getBudgetGoal();
  });

  // Calculate financial summary whenever transactions change
  const summary: FinancialSummary = useMemo(() => {
    return calculateSummary(transactions);
  }, [transactions]);

  /**
   * Add a new transaction
   * Generates unique ID and timestamp, validates data, and persists to localStorage
   */
  const addTransaction = (transaction: Omit<Transaction, 'id' | 'createdAt'>) => {
    // Validate transaction data
    const validation = validateTransaction(transaction);
    if (!validation.isValid) {
      const errorMessages = Object.values(validation.errors).join(', ');
      showToast(`Validation failed: ${errorMessages}`, 'error');
      throw new Error(`Invalid transaction: ${JSON.stringify(validation.errors)}`);
    }

    // Create complete transaction with ID and timestamp
    const newTransaction: Transaction = {
      ...transaction,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };

    // Add to state
    const updatedTransactions = [...transactions, newTransaction];
    setTransactions(updatedTransactions);

    // Save to localStorage immediately
    storageService.saveTransactions(updatedTransactions);

    // Show success toast
    showToast('Transaction added successfully!', 'success');
  };

  /**
   * Delete a transaction by ID
   * Removes from state and updates localStorage immediately
   */
  const deleteTransaction = (id: string) => {
    // Filter out the transaction with the given ID
    const updatedTransactions = transactions.filter((t) => t.id !== id);
    setTransactions(updatedTransactions);

    // Save to localStorage immediately
    storageService.saveTransactions(updatedTransactions);

    // Show success toast
    showToast('Transaction deleted successfully!', 'success');
  };

  /**
   * Set or update budget goal
   * Validates data and persists to localStorage immediately
   */
  const setBudgetGoal = (goal: BudgetGoal | null) => {
    // Validate if goal is not null
    if (goal !== null) {
      const validation = validateBudgetGoal(goal);
      if (!validation.isValid) {
        throw new Error(`Invalid budget goal: ${JSON.stringify(validation.errors)}`);
      }
    }

    // Update state
    setBudgetGoalState(goal);

    // Save to localStorage immediately
    storageService.saveBudgetGoal(goal);
  };

  /**
   * Clear all data
   * Resets transactions and budget goal to initial state
   * Clears localStorage
   */
  const clearAllData = () => {
    // Reset state to empty
    setTransactions([]);
    setBudgetGoalState(null);

    // Clear localStorage
    storageService.clearAll();
  };

  const value: BudgetContextValue = {
    transactions,
    addTransaction,
    deleteTransaction,
    budgetGoal,
    setBudgetGoal,
    clearAllData,
    summary,
  };

  return <BudgetContext.Provider value={value}>{children}</BudgetContext.Provider>;
}

/**
 * Custom hook to use the budget context
 * Throws error if used outside BudgetProvider
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useBudget(): BudgetContextValue {
  const context = useContext(BudgetContext);
  if (context === undefined) {
    throw new Error('useBudget must be used within a BudgetProvider');
  }
  return context;
}
