import { describe, it, expect } from 'vitest';
import {
  needsMigration,
  mapLegacyCategoryToId,
  migrateTransactions,
  generateStableCategoryId,
  initializeDefaultCategories,
} from './categoryMigration';
import type { Transaction } from '../types';
import { DEFAULT_CATEGORIES } from '../types';

describe('categoryMigration', () => {
  describe('needsMigration', () => {
    it('should return false for empty transaction array', () => {
      expect(needsMigration([])).toBe(false);
    });

    it('should return true for transactions with legacy category names', () => {
      const transactions: Transaction[] = [
        {
          id: '1',
          description: 'Test',
          amount: 100,
          type: 'expense',
          category: 'Food', // Legacy string category
          date: '2024-01-01',
          createdAt: '2024-01-01T00:00:00Z',
        },
      ];
      
      expect(needsMigration(transactions)).toBe(true);
    });

    it('should return false for transactions with UUID categories', () => {
      const transactions: Transaction[] = [
        {
          id: '1',
          description: 'Test',
          amount: 100,
          type: 'expense',
          category: '550e8400-e29b-41d4-a716-446655440001', // UUID
          date: '2024-01-01',
          createdAt: '2024-01-01T00:00:00Z',
        },
      ];
      
      expect(needsMigration(transactions)).toBe(false);
    });

    it('should return true if at least one transaction needs migration', () => {
      const transactions: Transaction[] = [
        {
          id: '1',
          description: 'Test 1',
          amount: 100,
          type: 'expense',
          category: '550e8400-e29b-41d4-a716-446655440001', // UUID
          date: '2024-01-01',
          createdAt: '2024-01-01T00:00:00Z',
        },
        {
          id: '2',
          description: 'Test 2',
          amount: 200,
          type: 'expense',
          category: 'Food', // Legacy
          date: '2024-01-02',
          createdAt: '2024-01-02T00:00:00Z',
        },
      ];
      
      expect(needsMigration(transactions)).toBe(true);
    });
  });

  describe('mapLegacyCategoryToId', () => {
    const categories = initializeDefaultCategories(DEFAULT_CATEGORIES);

    it('should map legacy category name to ID', () => {
      const id = mapLegacyCategoryToId('Food', categories);
      const foodCategory = categories.find(cat => cat.name === 'Food');
      
      expect(id).toBe(foodCategory?.id);
    });

    it('should be case-insensitive', () => {
      const id1 = mapLegacyCategoryToId('food', categories);
      const id2 = mapLegacyCategoryToId('FOOD', categories);
      const id3 = mapLegacyCategoryToId('Food', categories);
      
      expect(id1).toBe(id2);
      expect(id2).toBe(id3);
    });

    it('should fallback to "Other" for unknown categories', () => {
      const id = mapLegacyCategoryToId('UnknownCategory', categories);
      const otherCategory = categories.find(cat => cat.name === 'Other');
      
      expect(id).toBe(otherCategory?.id);
    });

    it('should handle all default category names', () => {
      const categoryNames = ['Food', 'Transport', 'Bills', 'Entertainment', 'Salary', 'Freelance', 'Shopping', 'Healthcare', 'Education', 'Other'];
      
      categoryNames.forEach(name => {
        const id = mapLegacyCategoryToId(name, categories);
        const category = categories.find(cat => cat.name === name);
        
        expect(id).toBe(category?.id);
      });
    });
  });

  describe('migrateTransactions', () => {
    const categories = initializeDefaultCategories(DEFAULT_CATEGORIES);

    it('should migrate transactions with legacy categories', () => {
      const transactions: Transaction[] = [
        {
          id: '1',
          description: 'Groceries',
          amount: 100,
          type: 'expense',
          category: 'Food',
          date: '2024-01-01',
          createdAt: '2024-01-01T00:00:00Z',
        },
        {
          id: '2',
          description: 'Bus fare',
          amount: 50,
          type: 'expense',
          category: 'Transport',
          date: '2024-01-02',
          createdAt: '2024-01-02T00:00:00Z',
        },
      ];
      
      const migrated = migrateTransactions(transactions, categories);
      
      expect(migrated[0].category).toBe(categories.find(c => c.name === 'Food')?.id);
      expect(migrated[1].category).toBe(categories.find(c => c.name === 'Transport')?.id);
    });

    it('should not modify already migrated transactions', () => {
      const foodId = categories.find(c => c.name === 'Food')?.id || '';
      const transactions: Transaction[] = [
        {
          id: '1',
          description: 'Groceries',
          amount: 100,
          type: 'expense',
          category: foodId, // Already a UUID
          date: '2024-01-01',
          createdAt: '2024-01-01T00:00:00Z',
        },
      ];
      
      const migrated = migrateTransactions(transactions, categories);
      
      expect(migrated[0].category).toBe(foodId);
    });

    it('should handle mixed legacy and migrated transactions', () => {
      const foodId = categories.find(c => c.name === 'Food')?.id || '';
      const transactions: Transaction[] = [
        {
          id: '1',
          description: 'Groceries',
          amount: 100,
          type: 'expense',
          category: foodId, // Already migrated
          date: '2024-01-01',
          createdAt: '2024-01-01T00:00:00Z',
        },
        {
          id: '2',
          description: 'Bus fare',
          amount: 50,
          type: 'expense',
          category: 'Transport', // Legacy
          date: '2024-01-02',
          createdAt: '2024-01-02T00:00:00Z',
        },
      ];
      
      const migrated = migrateTransactions(transactions, categories);
      
      expect(migrated[0].category).toBe(foodId);
      expect(migrated[1].category).toBe(categories.find(c => c.name === 'Transport')?.id);
    });

    it('should map unknown categories to "Other"', () => {
      const transactions: Transaction[] = [
        {
          id: '1',
          description: 'Something',
          amount: 100,
          type: 'expense',
          category: 'UnknownCategory',
          date: '2024-01-01',
          createdAt: '2024-01-01T00:00:00Z',
        },
      ];
      
      const migrated = migrateTransactions(transactions, categories);
      const otherId = categories.find(c => c.name === 'Other')?.id;
      
      expect(migrated[0].category).toBe(otherId);
    });
  });

  describe('generateStableCategoryId', () => {
    it('should generate stable IDs for default categories', () => {
      const id1 = generateStableCategoryId('Food');
      const id2 = generateStableCategoryId('Food');
      
      expect(id1).toBe(id2);
    });

    it('should generate different IDs for different categories', () => {
      const foodId = generateStableCategoryId('Food');
      const transportId = generateStableCategoryId('Transport');
      
      expect(foodId).not.toBe(transportId);
    });

    it('should generate valid UUIDs', () => {
      const id = generateStableCategoryId('Food');
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      
      expect(uuidPattern.test(id)).toBe(true);
    });
  });

  describe('initializeDefaultCategories', () => {
    it('should add IDs to default categories', () => {
      const categories = initializeDefaultCategories(DEFAULT_CATEGORIES);
      
      expect(categories).toHaveLength(DEFAULT_CATEGORIES.length);
      categories.forEach(cat => {
        expect(cat.id).toBeDefined();
        expect(typeof cat.id).toBe('string');
      });
    });

    it('should preserve all category properties', () => {
      const categories = initializeDefaultCategories(DEFAULT_CATEGORIES);
      
      categories.forEach((cat, index) => {
        expect(cat.name).toBe(DEFAULT_CATEGORIES[index].name);
        expect(cat.icon).toBe(DEFAULT_CATEGORIES[index].icon);
        expect(cat.color).toBe(DEFAULT_CATEGORIES[index].color);
        expect(cat.type).toBe(DEFAULT_CATEGORIES[index].type);
        expect(cat.isDefault).toBe(DEFAULT_CATEGORIES[index].isDefault);
      });
    });

    it('should generate stable IDs for default categories', () => {
      const categories1 = initializeDefaultCategories(DEFAULT_CATEGORIES);
      const categories2 = initializeDefaultCategories(DEFAULT_CATEGORIES);
      
      categories1.forEach((cat, index) => {
        expect(cat.id).toBe(categories2[index].id);
      });
    });
  });
});
