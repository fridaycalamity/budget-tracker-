import { useState, useEffect } from 'react';
import { useCategories, useToast } from '../contexts';
import type { Category } from '../types';
import { validateCategory } from '../utils/categoryValidation';
import { CategoryIcon, CATEGORY_ICON_OPTIONS } from './CategoryIcon';

interface CategoryFormProps {
  isOpen: boolean;
  onClose: () => void;
  editCategory?: Category | null;
}

export function CategoryForm({ isOpen, onClose, editCategory }: CategoryFormProps) {
  const { addCategory, updateCategory, categories } = useCategories();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [icon, setIcon] = useState('other');
  const [color, setColor] = useState('#050505');
  const [type, setType] = useState<'income' | 'expense' | 'both'>('expense');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editCategory) {
      setName(editCategory.name);
      setIcon(editCategory.icon);
      setColor(editCategory.color);
      setType(editCategory.type);
    } else {
      setName('');
      setIcon('other');
      setColor('#050505');
      setType('expense');
    }
    setErrors({});
  }, [editCategory, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const categoryData = { name: name.trim(), icon, color, type };
    const validation = validateCategory(categoryData, categories, editCategory?.id);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }
    if (editCategory) {
      updateCategory(editCategory.id, categoryData);
      showToast('Category updated successfully!', 'success');
    } else {
      addCategory(categoryData);
      showToast('Category added successfully!', 'success');
    }
    onClose();
  };

  if (!isOpen) return null;

  const labelClass = 'mb-2 block text-[11px] font-black uppercase tracking-[0.14em] text-[var(--app-text-muted)]';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }} role="dialog" aria-modal="true" aria-labelledby="category-form-title">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px]" />
      <div className="relative app-panel flex h-full w-full flex-col sm:h-auto sm:max-h-[92vh] sm:max-w-2xl">
        <div className="flex items-start justify-between gap-4 border-b app-divider px-5 py-4 sm:px-6">
          <div>
            <div className="app-kicker mb-2">Category Panel</div>
            <h3 id="category-form-title" className="app-section-title text-xl">{editCategory ? 'Edit Category' : 'Add Category'}</h3>
          </div>
          <button onClick={onClose} className="app-button-ghost inline-flex min-h-[44px] min-w-[44px] items-center justify-center px-3" aria-label="Close dialog">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
          <div className="space-y-6">
            <div>
              <label htmlFor="category-name" className={labelClass}>Name *</label>
              <input id="category-name" type="text" value={name} onChange={(e) => { setName(e.target.value); if (errors.name) setErrors({ ...errors, name: '' }); }} maxLength={30} className={`app-input w-full px-4 py-3 ${errors.name ? 'border-[var(--app-border-strong)]' : ''}`} placeholder="e.g., Groceries" aria-invalid={!!errors.name} aria-describedby={errors.name ? 'name-error' : undefined} />
              {errors.name && <p id="name-error" className="mt-2 border-l-4 border-[var(--app-border-strong)] pl-2 text-xs font-black uppercase tracking-[0.08em]">{errors.name}</p>}
              <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-[var(--app-text-muted)]">{name.length}/30</p>
            </div>

            <div>
              <label className={labelClass}>Icon *</label>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
                {CATEGORY_ICON_OPTIONS.map((option) => (
                  <button key={option.key} type="button" onClick={() => setIcon(option.key)} className={`min-h-[82px] border p-3 transition ${icon === option.key ? 'border-[var(--app-border-strong)] bg-[var(--color-black)] text-white' : 'border-[var(--app-border-strong)] text-[var(--app-text)]'}`} aria-label={`Select ${option.label} icon`} aria-pressed={icon === option.key}>
                    <div className="flex flex-col items-center justify-center gap-2">
                      <CategoryIcon name={option.label} icon={option.key} className="h-6 w-6" />
                      <span className="text-[10px] font-black uppercase tracking-[0.08em]">{option.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className={labelClass}>Type *</label>
              <div className="grid grid-cols-3 gap-3">
                {(['expense', 'income', 'both'] as const).map((typeOption) => (
                  <button key={typeOption} type="button" onClick={() => setType(typeOption)} className={`min-h-[44px] border px-4 py-3 text-sm font-black uppercase tracking-[0.12em] ${type === typeOption ? 'border-[var(--color-black)] bg-[var(--color-black)] text-white' : 'border-[var(--app-border-strong)] text-[var(--app-text)]'}`} aria-pressed={type === typeOption}>
                    {typeOption}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t app-divider pt-5 sm:flex-row sm:justify-end">
              <button type="button" onClick={onClose} className="app-button-secondary px-4">Cancel</button>
              <button type="submit" className="app-button-primary px-4 text-white">{editCategory ? 'Update Category' : 'Add Category'}</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
