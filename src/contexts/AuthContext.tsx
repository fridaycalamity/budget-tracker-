import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { storageService } from '../utils/storage';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  hasPendingLocalData: boolean;
  importLocalData: () => Promise<{ error: string | null }>;
  dismissLocalData: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasPendingLocalData, setHasPendingLocalData] = useState(false);

  // Check for existing localStorage data
  const checkLocalData = useCallback(() => {
    const transactions = storageService.getTransactions();
    const categories = storageService.getCategories();
    const budgetGoal = storageService.getBudgetGoal();
    return transactions.length > 0 || categories.length > 0 || budgetGoal !== null;
  }, []);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      if (currentSession?.user && checkLocalData()) {
        setHasPendingLocalData(true);
      }
      setLoading(false);
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user && checkLocalData()) {
        setHasPendingLocalData(true);
      }
    });

    return () => subscription.unsubscribe();
  }, [checkLocalData]);

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error: error?.message ?? null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setHasPendingLocalData(false);
  };

  const importLocalData = async () => {
    if (!user) return { error: 'Not authenticated' };

    try {
      // Import transactions
      const localTransactions = storageService.getTransactions();
      if (localTransactions.length > 0) {
        const transactionsToInsert = localTransactions.map((t) => ({
          description: t.description,
          amount: t.amount,
          type: t.type,
          category_id: t.category,
          date: t.date,
          user_id: user.id,
          created_at: t.createdAt,
        }));

        const { error: txError } = await supabase.from('transactions').insert(transactionsToInsert);
        if (txError) throw txError;
      }

      // Import custom categories
      const localCategories = storageService.getCategories();
      if (localCategories.length > 0) {
        const categoriesToInsert = localCategories.map((c) => ({
          id: c.id,
          name: c.name,
          icon: c.icon,
          color: c.color,
          type: c.type,
          is_default: false,
          user_id: user.id,
        }));

        const { error: catError } = await supabase.from('categories').insert(categoriesToInsert);
        if (catError) throw catError;
      }

      // Import budget goal as budget_limit in user_settings
      const localBudgetGoal = storageService.getBudgetGoal();
      if (localBudgetGoal) {
        await supabase.from('user_settings').upsert(
          {
            user_id: user.id,
            budget_limit: localBudgetGoal.monthlyLimit,
          },
          { onConflict: 'user_id' }
        );
      }

      // Clear localStorage after successful import
      storageService.clearAll();
      setHasPendingLocalData(false);

      return { error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to import local data';
      return { error: message };
    }
  };

  const dismissLocalData = () => {
    storageService.clearAll();
    setHasPendingLocalData(false);
  };

  const value: AuthContextValue = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    hasPendingLocalData,
    importLocalData,
    dismissLocalData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
