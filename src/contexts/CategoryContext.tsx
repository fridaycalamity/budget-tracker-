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

const CategoryContext = createContext<CategoryContextValue | undefined>(undefined);

export function CategoryProvider({ children }: { children: React.ReactNode }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [initialized, setInitialized] = useState(false);

  // Initialize categories and handle migration on mount
  useEffect(() => {
    if (initialized) return;

    // Initialize default categories with stable IDs
    const defaultCategories = initializeDefaultCategories(DEFAULT_CATEGORIES);

    // Load custom categories from storage
    const customCategories = storageService.getCategories();

    // Merge default and custom categories
    const allCategories = [...defaultCategories, ...customCategories];
    setCategories(allCategories);

    // Check if migration is needed
    const migrationFlag = storageService.getMigrationFlag();
    if (!migrationFlag) {
      const transactions = storageService.getTransactions();
      
      if (needsMigration(transactions)) {
        // Migrate transactions from legacy string categories to IDs
        const migratedTransactions = migrateTransactions(transactions, defaultCategories);
        storageService.saveTransactions(migratedTransactions);
        console.log('Migrated transactions to new category system');
      }
      
      // Set migration flag to prevent re-migration
      storageService.setMigrationFlag(true);
    }

    setInitialized(true);
  }, [initialized]);

  // Add a new custom category
  const addCategory = useCallback((categoryData: Omit<Category, 'id' | 'isDefault'>) => {
    const newCategory: Category = {
      ...categoryData,
      id: uuidv4(),
      isDefault: false,
    };

    setCategories(prev => {
      const updated = [...prev, newCategory];
      
      // Save only custom categories to storage
      const customCategories = updated.filter(cat => !cat.isDefault);
      storageService.saveCategories(customCategories);
      
      return updated;
    });
  }, []);

  // Update an existing category
  const updateCategory = useCallback((id: string, updates: Partial<Omit<Category, 'id' | 'isDefault'>>) => {
    setCategories(prev => {
      const updated = prev.map(cat => {
        if (cat.id === id && !cat.isDefault) {
          return { ...cat, ...updates };
        }
        return cat;
      });
      
      // Save only custom categories to storage
      const customCategories = updated.filter(cat => !cat.isDefault);
      storageService.saveCategories(customCategories);
      
      return updated;
    });
  }, []);

  // Delete a category and reassign its transactions to "Other"
  const deleteCategory = useCallback((id: string) => {
    const category = categories.find(cat => cat.id === id);
    
    // Prevent deletion of default categories
    if (!category || category.isDefault) {
      console.error('Cannot delete default category');
      return;
    }

    // Find the "Other" category for reassignment
    const otherCategory = categories.find(cat => cat.name === 'Other');
    if (!otherCategory) {
      console.error('Cannot find "Other" category for reassignment');
      return;
    }

    // Reassign all transactions from deleted category to "Other"
    const transactions = storageService.getTransactions();
    const updatedTransactions = transactions.map(transaction => {
      if (transaction.category === id) {
        return { ...transaction, category: otherCategory.id };
      }
      return transaction;
    });
    storageService.saveTransactions(updatedTransactions);

    // Remove category from state
    setCategories(prev => {
      const updated = prev.filter(cat => cat.id !== id);
      
      // Save only custom categories to storage
      const customCategories = updated.filter(cat => !cat.isDefault);
      storageService.saveCategories(customCategories);
      
      return updated;
    });
  }, [categories]);

  // Get category by ID
  const getCategoryById = useCallback((id: string): Category | undefined => {
    return categories.find(cat => cat.id === id);
  }, [categories]);

  // Get categories by type
  const getCategoriesByType = useCallback((type: 'income' | 'expense' | 'both'): Category[] => {
    if (type === 'both') {
      return categories.filter(cat => cat.type === 'both');
    }
    return categories.filter(cat => cat.type === type || cat.type === 'both');
  }, [categories]);

  // Get default categories
  const getDefaultCategories = useCallback((): Category[] => {
    return categories.filter(cat => cat.isDefault);
  }, [categories]);

  // Get custom categories
  const getCustomCategories = useCallback((): Category[] => {
    return categories.filter(cat => !cat.isDefault);
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
  };

  return (
    <CategoryContext.Provider value={value}>
      {children}
    </CategoryContext.Provider>
  );
}

export function useCategories(): CategoryContextValue {
  const context = useContext(CategoryContext);
  if (context === undefined) {
    throw new Error('useCategories must be used within a CategoryProvider');
  }
  return context;
}
