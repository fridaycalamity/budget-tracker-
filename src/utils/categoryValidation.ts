import type { Category, CategoryValidationResult } from '../types';

/**
 * Validates category data against business rules
 * @param data - Partial category data to validate
 * @param existingCategories - Array of existing categories for uniqueness check
 * @param editingId - Optional ID of category being edited (for uniqueness check)
 * @returns Validation result with isValid flag and error messages
 */
export function validateCategory(
  data: Partial<Omit<Category, 'id' | 'isDefault'>>,
  existingCategories: Category[],
  editingId?: string
): CategoryValidationResult {
  const errors: Record<string, string> = {};

  // Validate name
  if (!data.name || data.name.trim().length === 0) {
    errors.name = 'Category name is required';
  } else if (data.name.trim().length > 30) {
    errors.name = 'Category name must not exceed 30 characters';
  } else if (!isCategoryNameUnique(data.name, existingCategories, editingId)) {
    errors.name = 'A category with this name already exists';
  }

  // Validate icon
  if (!data.icon || data.icon.trim().length === 0) {
    errors.icon = 'Please select an icon for the category';
  }

  // Validate color
  if (!data.color || data.color.trim().length === 0) {
    errors.color = 'Please select a color for the category';
  } else if (!/^#[0-9A-Fa-f]{6}$/.test(data.color)) {
    errors.color = 'Please select a valid color';
  }

  // Validate type
  if (!data.type) {
    errors.type = 'Please select a category type';
  } else if (!['income', 'expense', 'both'].includes(data.type)) {
    errors.type = 'Please select a valid category type (Income, Expense, or Both)';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Checks if a category name is unique (case-insensitive)
 * @param name - Category name to check
 * @param existingCategories - Array of existing categories
 * @param editingId - Optional ID of category being edited
 * @returns true if name is unique, false otherwise
 */
export function isCategoryNameUnique(
  name: string,
  existingCategories: Category[],
  editingId?: string
): boolean {
  const normalizedName = name.trim().toLowerCase();
  
  return !existingCategories.some(cat => {
    // Skip the category being edited
    if (editingId && cat.id === editingId) {
      return false;
    }
    
    return cat.name.toLowerCase() === normalizedName;
  });
}

/**
 * Gets category color by ID
 * @param categoryId - Category ID
 * @param categories - Array of categories
 * @returns Hex color string or default gray
 */
export function getCategoryColor(categoryId: string, categories: Category[]): string {
  const category = categories.find(cat => cat.id === categoryId);
  return category?.color || '#6b7280';
}

/**
 * Gets category icon by ID
 * @param categoryId - Category ID
 * @param categories - Array of categories
 * @returns Emoji icon or default icon
 */
export function getCategoryIcon(categoryId: string, categories: Category[]): string {
  const category = categories.find(cat => cat.id === categoryId);
  return category?.icon || '📌';
}

/**
 * Gets category name by ID
 * @param categoryId - Category ID
 * @param categories - Array of categories
 * @returns Category name or 'Unknown'
 */
export function getCategoryName(categoryId: string, categories: Category[]): string {
  const category = categories.find(cat => cat.id === categoryId);
  return category?.name || 'Unknown';
}

/**
 * Reassigns transactions from one category to another
 * @param transactions - Array of transactions
 * @param fromCategoryId - Source category ID
 * @param toCategoryId - Target category ID
 * @returns Updated transactions array
 */
export function reassignTransactions<T extends { category: string }>(
  transactions: T[],
  fromCategoryId: string,
  toCategoryId: string
): T[] {
  return transactions.map(transaction => {
    if (transaction.category === fromCategoryId) {
      return { ...transaction, category: toCategoryId };
    }
    return transaction;
  });
}

/**
 * Counts transactions by category
 * @param transactions - Array of transactions
 * @param categoryId - Category ID to count
 * @returns Number of transactions with the category
 */
export function countTransactionsByCategory<T extends { category: string }>(
  transactions: T[],
  categoryId: string
): number {
  return transactions.filter(t => t.category === categoryId).length;
}
