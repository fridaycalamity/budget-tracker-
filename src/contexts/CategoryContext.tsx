import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Category, CategoryContextValue } from '../types';
import { DEFAULT_CATEGORIES } from '../types';
import { storageService } from '../utils/storage';
import {
  initializeDefaultCategories,
  needsMigration,
  migrateTransactions,
} from '../utils/categoryMigration';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

const CategoryContext = createContext<CategoryContextValue | undefined>(undefined);

// Map a Supabase row to a frontend Category
function mapDbToCategory(row: Record<string, unknown>): Category {
  return {
    id: row.id as string,
    name: row.name as string,
    icon: (row.icon as string) ?? '',
    color: (row.color as string) ?? '#6b7280',
    type: row.type as 'income' | 'expense' | 'both',
    isDefault: (row.is_default as boolean) ?? false,
  };
}

export function CategoryProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Seed default categories for a new user in Supabase
  const seedDefaultCategories = useCallback(
    async (userId: string): Promise<Category[]> => {
      const defaults = initializeDefaultCategories(DEFAULT_CATEGORIES);
      const toInsert = defaults.map((cat) => ({
        id: cat.id,
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        type: cat.type,
        is_default: true,
        user_id: userId,
      }));

      const { error } = await supabase.from('categories').insert(toInsert);
      if (error) {
        console.error('Error seeding default categories:', error);
      }
      return defaults;
    },
    []
  );

  // Load categories
  const loadCategories = useCallback(async () => {
    if (!user) {
      // Fallback to localStorage when not authenticated
      const defaultCategories = initializeDefaultCategories(DEFAULT_CATEGORIES);
      const customCategories = storageService.getCategories();
      setCategories([...defaultCategories, ...customCategories]);

      // Handle legacy migration
      const migrationFlag = storageService.getMigrationFlag();
      if (!migrationFlag) {
        const transactions = storageService.getTransactions();
        if (needsMigration(transactions)) {
          const migratedTransactions = migrateTransactions(transactions, defaultCategories);
          storageService.saveTransactions(migratedTransactions);
        }
        storageService.setMigrationFlag(true);
      }

      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      if (!data || data.length === 0) {
        // New user — seed default categories
        const defaults = await seedDefaultCategories(user.id);
        setCategories(defaults);
      } else {
        setCategories(data.map(mapDbToCategory));
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      // Fallback to localStorage
      const defaultCategories = initializeDefaultCategories(DEFAULT_CATEGORIES);
      const customCategories = storageService.getCategories();
      setCategories([...defaultCategories, ...customCategories]);
    } finally {
      setLoading(false);
    }
  }, [user, seedDefaultCategories]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const addCategory = useCallback(
    async (categoryData: Omit<Category, 'id' | 'isDefault'>) => {
      const newCategory: Category = {
        ...categoryData,
        id: uuidv4(),
        isDefault: false,
      };

      if (user) {
        try {
          const { error } = await supabase.from('categories').insert({
            id: newCategory.id,
            name: newCategory.name,
            icon: newCategory.icon,
            color: newCategory.color,
            type: newCategory.type,
            is_default: false,
            user_id: user.id,
          });

          if (error) throw error;
          setCategories((prev) => [...prev, newCategory]);
        } catch (error) {
          console.error('Error adding category:', error);
        }
      } else {
        setCategories((prev) => {
          const updated = [...prev, newCategory];
          const customCategories = updated.filter((cat) => !cat.isDefault);
          storageService.saveCategories(customCategories);
          return updated;
        });
      }
    },
    [user]
  );

  const updateCategory = useCallback(
    async (id: string, updates: Partial<Omit<Category, 'id' | 'isDefault'>>) => {
      if (user) {
        try {
          const dbUpdates: Record<string, unknown> = {};
          if (updates.name !== undefined) dbUpdates.name = updates.name;
          if (updates.icon !== undefined) dbUpdates.icon = updates.icon;
          if (updates.color !== undefined) dbUpdates.color = updates.color;
          if (updates.type !== undefined) dbUpdates.type = updates.type;

          const { error } = await supabase
            .from('categories')
            .update(dbUpdates)
            .eq('id', id)
            .eq('user_id', user.id)
            .eq('is_default', false);

          if (error) throw error;

          setCategories((prev) =>
            prev.map((cat) => {
              if (cat.id === id && !cat.isDefault) {
                return { ...cat, ...updates };
              }
              return cat;
            })
          );
        } catch (error) {
          console.error('Error updating category:', error);
        }
      } else {
        setCategories((prev) => {
          const updated = prev.map((cat) => {
            if (cat.id === id && !cat.isDefault) {
              return { ...cat, ...updates };
            }
            return cat;
          });
          const customCategories = updated.filter((cat) => !cat.isDefault);
          storageService.saveCategories(customCategories);
          return updated;
        });
      }
    },
    [user]
  );

  const deleteCategory = useCallback(
    async (id: string) => {
      const category = categories.find((cat) => cat.id === id);
      if (!category || category.isDefault) {
        console.error('Cannot delete default category');
        return;
      }

      const otherCategory = categories.find((cat) => cat.name === 'Other');
      if (!otherCategory) {
        console.error('Cannot find "Other" category for reassignment');
        return;
      }

      if (user) {
        try {
          // Reassign transactions in Supabase
          await supabase
            .from('transactions')
            .update({ category_id: otherCategory.id })
            .eq('category_id', id)
            .eq('user_id', user.id);

          // Delete category
          const { error } = await supabase
            .from('categories')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);

          if (error) throw error;

          setCategories((prev) => prev.filter((cat) => cat.id !== id));
        } catch (error) {
          console.error('Error deleting category:', error);
        }
      } else {
        // Reassign transactions in localStorage
        const transactions = storageService.getTransactions();
        const updatedTransactions = transactions.map((transaction) => {
          if (transaction.category === id) {
            return { ...transaction, category: otherCategory.id };
          }
          return transaction;
        });
        storageService.saveTransactions(updatedTransactions);

        setCategories((prev) => {
          const updated = prev.filter((cat) => cat.id !== id);
          const customCategories = updated.filter((cat) => !cat.isDefault);
          storageService.saveCategories(customCategories);
          return updated;
        });
      }
    },
    [categories, user]
  );

  const getCategoryById = useCallback(
    (id: string): Category | undefined => {
      return categories.find((cat) => cat.id === id);
    },
    [categories]
  );

  const getCategoriesByType = useCallback(
    (type: 'income' | 'expense' | 'both'): Category[] => {
      if (type === 'both') {
        return categories.filter((cat) => cat.type === 'both');
      }
      return categories.filter((cat) => cat.type === type || cat.type === 'both');
    },
    [categories]
  );

  const getDefaultCategories = useCallback((): Category[] => {
    return categories.filter((cat) => cat.isDefault);
  }, [categories]);

  const getCustomCategories = useCallback((): Category[] => {
    return categories.filter((cat) => !cat.isDefault);
  }, [categories]);

  const value: CategoryContextValue = {
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    getCategoryById,
    getCategoriesByType,
    getDefaultCategories,
    getCustomCategories,
    loading,
  };

  return <CategoryContext.Provider value={value}>{children}</CategoryContext.Provider>;
}

export function useCategories(): CategoryContextValue {
  const context = useContext(CategoryContext);
  if (context === undefined) {
    throw new Error('useCategories must be used within a CategoryProvider');
  }
  return context;
}
