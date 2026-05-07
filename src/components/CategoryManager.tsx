import { useState } from 'react';
import { useCategories, useToast, useBudget } from '../contexts';
import { CategoryForm } from './CategoryForm';
import { CategoryIcon } from './CategoryIcon';
import { countTransactionsByCategory, reassignTransactions } from '../utils/categoryValidation';
import type { Category } from '../types';
import { storageService } from '../utils';

export function CategoryManager() {
  const { categories, deleteCategory, getDefaultCategories } = useCategories();
  const { transactions } = useBudget();
  const { showToast } = useToast();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

  const defaultCategoryIds = new Set(getDefaultCategories().map((cat: Category) => cat.id));

  const handleConfirmDelete = () => {
    if (!deletingCategory) return;

    const transactionCount = countTransactionsByCategory(transactions, deletingCategory.id);
    if (transactionCount > 0) {
      const otherCategory = categories.find((cat: Category) => cat.name === 'Other');
      if (otherCategory) {
        const updatedTransactions = reassignTransactions(transactions, deletingCategory.id, otherCategory.id);
        storageService.saveTransactions(updatedTransactions);
      }
    }

    deleteCategory(deletingCategory.id);
    showToast('Category deleted successfully!', 'success');
    setDeletingCategory(null);
  };

  const getTypeLabel = (type: Category['type']) => type === 'both' ? 'Both' : type === 'income' ? 'Income' : 'Expense';

  return (
    <div className="app-panel p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="app-kicker mb-2">Ledger Taxonomy</div>
          <h3 className="app-section-title text-lg">Manage Categories</h3>
          <p className="mt-1 text-sm text-[var(--app-text-muted)]">Customize category names, icons, and types without breaking the ledger.</p>
        </div>
        <button onClick={() => { setEditingCategory(null); setIsFormOpen(true); }} className="app-button-primary inline-flex items-center gap-2 px-4 text-white" aria-label="Add new category">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4v16m8-8H4" /></svg>
          Add Category
        </button>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-2">
        {categories.map((category: Category) => {
          const isDefault = defaultCategoryIds.has(category.id);
          const transactionCount = countTransactionsByCategory(transactions, category.id);

          return (
            <div key={category.id} className="app-panel-subtle grid grid-cols-[auto_1fr_auto] items-center gap-4 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center border border-[var(--app-border-strong)]">
                  <CategoryIcon name={category.name} icon={category.icon} className="h-6 w-6" />
                </div>
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="truncate text-sm font-black uppercase tracking-[0.08em]">{category.name}</h4>
                  {isDefault && <span className="app-stamp">Default</span>}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[var(--app-text-muted)]">
                  <span className="app-stamp">{getTypeLabel(category.type)}</span>
                  {transactionCount > 0 && <span>{transactionCount} transaction{transactionCount !== 1 ? 's' : ''}</span>}
                </div>
              </div>

              {!isDefault && (
                <div className="flex flex-wrap justify-end gap-2">
                  <button onClick={() => { setEditingCategory(category); setIsFormOpen(true); }} className="app-button-secondary px-3 text-xs" aria-label={`Edit ${category.name} category`}>Edit</button>
                  <button onClick={() => setDeletingCategory(category)} className="app-button-secondary px-3 text-xs" aria-label={`Delete ${category.name} category`}>Delete</button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <CategoryForm isOpen={isFormOpen} onClose={() => { setIsFormOpen(false); setEditingCategory(null); }} editCategory={editingCategory} />

      {deletingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) setDeletingCategory(null); }} role="dialog" aria-modal="true" aria-labelledby="delete-dialog-title" aria-describedby="delete-dialog-description">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px]" />
          <div className="relative app-panel w-full max-w-md p-6">
            <div className="app-kicker mb-2">Stamped Warning</div>
            <h3 id="delete-dialog-title" className="app-section-title text-xl">Delete Category?</h3>
            <div id="delete-dialog-description" className="mt-4 space-y-2 text-sm text-[var(--app-text-muted)]">
              <p>Are you sure you want to delete <strong className="text-[var(--app-text)]">{deletingCategory.name}</strong>?</p>
              {countTransactionsByCategory(transactions, deletingCategory.id) > 0 && <p>This category has {countTransactionsByCategory(transactions, deletingCategory.id)} transaction(s). They will be reassigned to “Other”.</p>}
            </div>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button onClick={() => setDeletingCategory(null)} className="app-button-secondary px-4">Cancel</button>
              <button onClick={handleConfirmDelete} className="app-button-primary px-4 text-white">Delete Category</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
