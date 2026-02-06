import type { Transaction, Category } from '../types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Checks if transactions need migration from legacy string categories to ID-based categories
 * @param transactions - Array of transactions to check
 * @returns true if migration is needed, false otherwise
 */
export function needsMigration(transactions: Transaction[]): boolean {
  if (transactions.length === 0) {
    return false;
  }
  
  // Check if any transaction has a legacy category name (not a UUID)
  // Legacy categories are simple strings like 'Food', 'Transport', etc.
  // New categories are UUIDs like '550e8400-e29b-41d4-a716-446655440000'
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  
  return transactions.some(transaction => !uuidPattern.test(transaction.category));
}

/**
 * Maps a legacy category name to a default category ID
 * @param legacyName - Legacy category name (e.g., 'Food', 'Transport')
 * @param categories - Array of available categories
 * @returns Category ID, or 'Other' category ID if not found
 */
export function mapLegacyCategoryToId(legacyName: string, categories: Category[]): string {
  // Find category by name (case-insensitive)
  const category = categories.find(
    cat => cat.name.toLowerCase() === legacyName.toLowerCase()
  );
  
  if (category) {
    return category.id;
  }
  
  // Fallback to 'Other' category
  const otherCategory = categories.find(cat => cat.name === 'Other');
  if (otherCategory) {
    console.warn(`Unknown legacy category "${legacyName}", mapping to "Other"`);
    return otherCategory.id;
  }
  
  // This should never happen if default categories are properly initialized
  console.error(`Could not find "Other" category for fallback. Using legacy name as ID.`);
  return legacyName;
}

/**
 * Migrates transactions from legacy string categories to ID-based categories
 * @param transactions - Array of transactions to migrate
 * @param categories - Array of available categories
 * @returns Migrated transactions with category IDs
 */
export function migrateTransactions(
  transactions: Transaction[],
  categories: Category[]
): Transaction[] {
  return transactions.map(transaction => {
    // Check if already migrated (has UUID)
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    if (uuidPattern.test(transaction.category)) {
      // Already migrated, return as-is
      return transaction;
    }
    
    // Migrate legacy category name to ID
    const categoryId = mapLegacyCategoryToId(transaction.category, categories);
    
    return {
      ...transaction,
      category: categoryId,
    };
  });
}

/**
 * Generates stable UUIDs for default categories
 * Uses a deterministic approach based on category name to ensure
 * the same category always gets the same ID across installations
 * 
 * @param name - Category name
 * @returns UUID v4 string
 */
export function generateStableCategoryId(name: string): string {
  // For default categories, we use predefined UUIDs to ensure consistency
  const defaultCategoryIds: Record<string, string> = {
    'Food': '550e8400-e29b-41d4-a716-446655440001',
    'Transport': '550e8400-e29b-41d4-a716-446655440002',
    'Bills': '550e8400-e29b-41d4-a716-446655440003',
    'Entertainment': '550e8400-e29b-41d4-a716-446655440004',
    'Salary': '550e8400-e29b-41d4-a716-446655440005',
    'Freelance': '550e8400-e29b-41d4-a716-446655440006',
    'Shopping': '550e8400-e29b-41d4-a716-446655440007',
    'Healthcare': '550e8400-e29b-41d4-a716-446655440008',
    'Education': '550e8400-e29b-41d4-a716-446655440009',
    'Other': '550e8400-e29b-41d4-a716-446655440010',
  };
  
  return defaultCategoryIds[name] || uuidv4();
}

/**
 * Initializes default categories with stable IDs
 * @param defaultCategoryData - Array of default category data without IDs
 * @returns Array of categories with stable IDs
 */
export function initializeDefaultCategories(
  defaultCategoryData: Omit<Category, 'id'>[]
): Category[] {
  return defaultCategoryData.map(cat => ({
    ...cat,
    id: generateStableCategoryId(cat.name),
  }));
}
