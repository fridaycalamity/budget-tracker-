import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { CategoryProvider, useCategories } from './CategoryContext';
import { storageService } from '../utils/storage';
import type { Transaction } from '../types';

// Mock storage service
vi.mock('../utils/storage', () => ({
  storageService: {
    getCategories: vi.fn(() => []),
    saveCategories: vi.fn(),
    getTransactions: vi.fn(() => []),
    saveTransactions: vi.fn(),
    getMigrationFlag: vi.fn(() => false),
    setMigrationFlag: vi.fn(),
  },
}));

// Mock AuthContext (no authenticated user for localStorage tests)
vi.mock('./AuthContext', () => ({
  useAuth: vi.fn(() => ({ user: null, session: null, loading: false })),
}));

// Mock Supabase client
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  },
}));

describe('CategoryContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with default categories', async () => {
      const { result } = renderHook(() => useCategories(), {
        wrapper: CategoryProvider,
      });

      await waitFor(() => {
        expect(result.current.categories.length).toBeGreaterThan(0);
      });

      const defaultCategories = result.current.getDefaultCategories();
      expect(defaultCategories.length).toBe(10); // 10 default categories
      expect(defaultCategories.every(cat => cat.isDefault)).toBe(true);
    });

    it('should load custom categories from storage', async () => {
      const customCategory = {
        id: 'custom-1',
        name: 'Custom Category',
        icon: '🎯',
        color: '#ff0000',
        type: 'expense' as const,
        isDefault: false,
      };

      vi.mocked(storageService.getCategories).mockReturnValue([customCategory]);

      const { result } = renderHook(() => useCategories(), {
        wrapper: CategoryProvider,
      });

      await waitFor(() => {
        expect(result.current.categories.length).toBeGreaterThan(10);
      });

      const customCategories = result.current.getCustomCategories();
      expect(customCategories).toHaveLength(1);
      expect(customCategories[0].name).toBe('Custom Category');
    });

    it('should migrate legacy transactions on first load', async () => {
      const legacyTransactions: Transaction[] = [
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

      vi.mocked(storageService.getMigrationFlag).mockReturnValue(false);
      vi.mocked(storageService.getTransactions).mockReturnValue(legacyTransactions);

      renderHook(() => useCategories(), {
        wrapper: CategoryProvider,
      });

      await waitFor(() => {
        expect(storageService.saveTransactions).toHaveBeenCalled();
        expect(storageService.setMigrationFlag).toHaveBeenCalledWith(true);
      });
    });

    it('should not migrate if already migrated', async () => {
      vi.mocked(storageService.getMigrationFlag).mockReturnValue(true);

      renderHook(() => useCategories(), {
        wrapper: CategoryProvider,
      });

      await waitFor(() => {
        expect(storageService.saveTransactions).not.toHaveBeenCalled();
      });
    });
  });

  describe('addCategory', () => {
    it('should add a new custom category', async () => {
      const { result } = renderHook(() => useCategories(), {
        wrapper: CategoryProvider,
      });

      await waitFor(() => {
        expect(result.current.categories.length).toBeGreaterThan(0);
      });

      const initialCount = result.current.categories.length;

      act(() => {
        result.current.addCategory({
          name: 'New Category',
          icon: '🎯',
          color: '#ff0000',
          type: 'expense',
        });
      });

      expect(result.current.categories.length).toBe(initialCount + 1);
      
      const newCategory = result.current.categories.find(cat => cat.name === 'New Category');
      expect(newCategory).toBeDefined();
      expect(newCategory?.isDefault).toBe(false);
      expect(newCategory?.id).toBeDefined();
    });

    it('should save custom categories to storage', async () => {
      const { result } = renderHook(() => useCategories(), {
        wrapper: CategoryProvider,
      });

      await waitFor(() => {
        expect(result.current.categories.length).toBeGreaterThan(0);
      });

      act(() => {
        result.current.addCategory({
          name: 'New Category',
          icon: '🎯',
          color: '#ff0000',
          type: 'expense',
        });
      });

      expect(storageService.saveCategories).toHaveBeenCalled();
    });
  });

  describe('updateCategory', () => {
    it('should update a custom category', async () => {
      const customCategory = {
        id: 'custom-1',
        name: 'Custom Category',
        icon: '🎯',
        color: '#ff0000',
        type: 'expense' as const,
        isDefault: false,
      };

      vi.mocked(storageService.getCategories).mockReturnValue([customCategory]);

      const { result } = renderHook(() => useCategories(), {
        wrapper: CategoryProvider,
      });

      await waitFor(() => {
        expect(result.current.categories.length).toBeGreaterThan(10);
      });

      act(() => {
        result.current.updateCategory('custom-1', {
          name: 'Updated Category',
          color: '#00ff00',
        });
      });

      const updated = result.current.getCategoryById('custom-1');
      expect(updated?.name).toBe('Updated Category');
      expect(updated?.color).toBe('#00ff00');
      expect(updated?.icon).toBe('🎯'); // Unchanged
    });

    it('should not update default categories', async () => {
      const { result } = renderHook(() => useCategories(), {
        wrapper: CategoryProvider,
      });

      await waitFor(() => {
        expect(result.current.categories.length).toBeGreaterThan(0);
      });

      const foodCategory = result.current.categories.find(cat => cat.name === 'Food');
      expect(foodCategory).toBeDefined();

      act(() => {
        result.current.updateCategory(foodCategory!.id, {
          name: 'Updated Food',
        });
      });

      const stillFood = result.current.getCategoryById(foodCategory!.id);
      expect(stillFood?.name).toBe('Food'); // Unchanged
    });
  });

  describe('deleteCategory', () => {
    it('should delete a custom category', async () => {
      const customCategory = {
        id: 'custom-1',
        name: 'Custom Category',
        icon: '🎯',
        color: '#ff0000',
        type: 'expense' as const,
        isDefault: false,
      };

      vi.mocked(storageService.getCategories).mockReturnValue([customCategory]);

      const { result } = renderHook(() => useCategories(), {
        wrapper: CategoryProvider,
      });

      await waitFor(() => {
        expect(result.current.categories.length).toBeGreaterThan(10);
      });

      const initialCount = result.current.categories.length;

      act(() => {
        result.current.deleteCategory('custom-1');
      });

      expect(result.current.categories.length).toBe(initialCount - 1);
      expect(result.current.getCategoryById('custom-1')).toBeUndefined();
    });

    it('should not delete default categories', async () => {
      const { result } = renderHook(() => useCategories(), {
        wrapper: CategoryProvider,
      });

      await waitFor(() => {
        expect(result.current.categories.length).toBeGreaterThan(0);
      });

      const foodCategory = result.current.categories.find(cat => cat.name === 'Food');
      expect(foodCategory).toBeDefined();

      const initialCount = result.current.categories.length;

      act(() => {
        result.current.deleteCategory(foodCategory!.id);
      });

      expect(result.current.categories.length).toBe(initialCount); // Unchanged
      expect(result.current.getCategoryById(foodCategory!.id)).toBeDefined();
    });

    it('should reassign transactions to "Other" when deleting a category', async () => {
      const customCategory = {
        id: 'custom-1',
        name: 'Custom Category',
        icon: '🎯',
        color: '#ff0000',
        type: 'expense' as const,
        isDefault: false,
      };

      const transactions: Transaction[] = [
        {
          id: '1',
          description: 'Test',
          amount: 100,
          type: 'expense',
          category: 'custom-1',
          date: '2024-01-01',
          createdAt: '2024-01-01T00:00:00Z',
        },
      ];

      vi.mocked(storageService.getCategories).mockReturnValue([customCategory]);
      vi.mocked(storageService.getTransactions).mockReturnValue(transactions);

      const { result } = renderHook(() => useCategories(), {
        wrapper: CategoryProvider,
      });

      await waitFor(() => {
        expect(result.current.categories.length).toBeGreaterThan(10);
      });

      act(() => {
        result.current.deleteCategory('custom-1');
      });

      expect(storageService.saveTransactions).toHaveBeenCalled();
      
      // Check that the transaction was reassigned
      const savedTransactions = vi.mocked(storageService.saveTransactions).mock.calls[0][0];
      const otherCategory = result.current.categories.find(cat => cat.name === 'Other');
      expect(savedTransactions[0].category).toBe(otherCategory?.id);
    });
  });

  describe('getCategoryById', () => {
    it('should return category by ID', async () => {
      const { result } = renderHook(() => useCategories(), {
        wrapper: CategoryProvider,
      });

      await waitFor(() => {
        expect(result.current.categories.length).toBeGreaterThan(0);
      });

      const foodCategory = result.current.categories.find(cat => cat.name === 'Food');
      expect(foodCategory).toBeDefined();

      const found = result.current.getCategoryById(foodCategory!.id);
      expect(found).toEqual(foodCategory);
    });

    it('should return undefined for non-existent ID', async () => {
      const { result } = renderHook(() => useCategories(), {
        wrapper: CategoryProvider,
      });

      await waitFor(() => {
        expect(result.current.categories.length).toBeGreaterThan(0);
      });

      const found = result.current.getCategoryById('non-existent-id');
      expect(found).toBeUndefined();
    });
  });

  describe('getCategoriesByType', () => {
    it('should return income categories', async () => {
      const { result } = renderHook(() => useCategories(), {
        wrapper: CategoryProvider,
      });

      await waitFor(() => {
        expect(result.current.categories.length).toBeGreaterThan(0);
      });

      const incomeCategories = result.current.getCategoriesByType('income');
      
      expect(incomeCategories.length).toBeGreaterThan(0);
      expect(incomeCategories.every(cat => cat.type === 'income' || cat.type === 'both')).toBe(true);
    });

    it('should return expense categories', async () => {
      const { result } = renderHook(() => useCategories(), {
        wrapper: CategoryProvider,
      });

      await waitFor(() => {
        expect(result.current.categories.length).toBeGreaterThan(0);
      });

      const expenseCategories = result.current.getCategoriesByType('expense');
      
      expect(expenseCategories.length).toBeGreaterThan(0);
      expect(expenseCategories.every(cat => cat.type === 'expense' || cat.type === 'both')).toBe(true);
    });

    it('should return only "both" type categories', async () => {
      const { result } = renderHook(() => useCategories(), {
        wrapper: CategoryProvider,
      });

      await waitFor(() => {
        expect(result.current.categories.length).toBeGreaterThan(0);
      });

      const bothCategories = result.current.getCategoriesByType('both');
      
      expect(bothCategories.every(cat => cat.type === 'both')).toBe(true);
    });
  });

  describe('getDefaultCategories', () => {
    it('should return only default categories', async () => {
      const customCategory = {
        id: 'custom-1',
        name: 'Custom Category',
        icon: '🎯',
        color: '#ff0000',
        type: 'expense' as const,
        isDefault: false,
      };

      vi.mocked(storageService.getCategories).mockReturnValue([customCategory]);

      const { result } = renderHook(() => useCategories(), {
        wrapper: CategoryProvider,
      });

      await waitFor(() => {
        expect(result.current.categories.length).toBeGreaterThan(10);
      });

      const defaultCategories = result.current.getDefaultCategories();
      
      expect(defaultCategories.length).toBe(10);
      expect(defaultCategories.every(cat => cat.isDefault)).toBe(true);
    });
  });

  describe('getCustomCategories', () => {
    it('should return only custom categories', async () => {
      const customCategory = {
        id: 'custom-1',
        name: 'Custom Category',
        icon: '🎯',
        color: '#ff0000',
        type: 'expense' as const,
        isDefault: false,
      };

      vi.mocked(storageService.getCategories).mockReturnValue([customCategory]);

      const { result } = renderHook(() => useCategories(), {
        wrapper: CategoryProvider,
      });

      await waitFor(() => {
        expect(result.current.categories.length).toBeGreaterThan(10);
      });

      const customCategories = result.current.getCustomCategories();
      
      expect(customCategories.length).toBe(1);
      expect(customCategories.every(cat => !cat.isDefault)).toBe(true);
      expect(customCategories[0].name).toBe('Custom Category');
    });

    it('should return empty array when no custom categories exist', async () => {
      // Reset mock to return empty array
      vi.mocked(storageService.getCategories).mockReturnValue([]);
      
      const { result } = renderHook(() => useCategories(), {
        wrapper: CategoryProvider,
      });

      await waitFor(() => {
        expect(result.current.categories.length).toBeGreaterThan(0);
      });

      const customCategories = result.current.getCustomCategories();
      expect(customCategories).toHaveLength(0);
    });
  });
});
