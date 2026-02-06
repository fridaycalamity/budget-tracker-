import { useState, useEffect } from 'react';
import { useCategories, useToast } from '../contexts';
import type { Category } from '../types';
import { validateCategory } from '../utils/categoryValidation';

interface CategoryFormProps {
  isOpen: boolean;
  onClose: () => void;
  editCategory?: Category | null;
}

const AVAILABLE_EMOJIS = [
  '🍔', '🚗', '💡', '🎮', '🏠', '💰', '📱', '🎓',
  '✈️', '🎵', '🛒', '💼', '🏥', '🎁', '👕', '⚽',
  '📚', '🐾', '💊', '🔧'
];

const AVAILABLE_COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // purple
  '#EC4899', // pink
];

/**
 * CategoryForm component
 * Modal form for adding or editing categories
 * 
 * Features:
 * - Name input with validation (required, max 30 chars, unique)
 * - Emoji picker grid
 * - Color swatches
 * - Type radio buttons (Income/Expense/Both)
 * - Works for both add and edit modes
 * - Shows toast on save
 * - Light/dark mode support
 */
export function CategoryForm({ isOpen, onClose, editCategory }: CategoryFormProps) {
  const { addCategory, updateCategory, categories } = useCategories();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [icon, setIcon] = useState('💰');
  const [color, setColor] = useState('#3B82F6');
  const [type, setType] = useState<'income' | 'expense' | 'both'>('expense');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form with edit data
  useEffect(() => {
    if (editCategory) {
      setName(editCategory.name);
      setIcon(editCategory.icon);
      setColor(editCategory.color);
      setType(editCategory.type);
    } else {
      // Reset form for add mode
      setName('');
      setIcon('💰');
      setColor('#3B82F6');
      setType('expense');
    }
    setErrors({});
  }, [editCategory, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate category
    const categoryData = { name: name.trim(), icon, color, type };
    const validation = validateCategory(
      categoryData,
      categories,
      editCategory?.id
    );

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    // Save category
    if (editCategory) {
      updateCategory(editCategory.id, categoryData);
      showToast('Category updated successfully!', 'success');
    } else {
      addCategory(categoryData);
      showToast('Category added successfully!', 'success');
    }

    onClose();
  };

  const handleCancel = () => {
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleCancel();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="category-form-title"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Dialog Content */}
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 animate-slideUp max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3
            id="category-form-title"
            className="text-xl font-semibold text-gray-900 dark:text-white"
          >
            {editCategory ? 'Edit Category' : 'Add Category'}
          </h3>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Close dialog"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name Input */}
          <div>
            <label htmlFor="category-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              id="category-name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) {
                  setErrors({ ...errors, name: '' });
                }
              }}
              maxLength={30}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                errors.name
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
              }`}
              placeholder="e.g., Groceries"
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? 'name-error' : undefined}
            />
            {errors.name && (
              <p id="name-error" className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.name}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {name.length}/30 characters
            </p>
          </div>

          {/* Emoji Picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Icon <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-10 gap-2">
              {AVAILABLE_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setIcon(emoji)}
                  className={`w-10 h-10 text-2xl flex items-center justify-center rounded-lg transition-all duration-200 ${
                    icon === emoji
                      ? 'bg-blue-100 dark:bg-blue-900/30 ring-2 ring-blue-500 scale-110'
                      : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                  aria-label={`Select ${emoji} icon`}
                  aria-pressed={icon === emoji}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Color Swatches */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Color <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-3">
              {AVAILABLE_COLORS.map((colorOption) => (
                <button
                  key={colorOption}
                  type="button"
                  onClick={() => setColor(colorOption)}
                  className={`w-10 h-10 rounded-lg transition-all duration-200 ${
                    color === colorOption
                      ? 'ring-2 ring-offset-2 ring-gray-900 dark:ring-white dark:ring-offset-gray-800 scale-110'
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: colorOption }}
                  aria-label={`Select color ${colorOption}`}
                  aria-pressed={color === colorOption}
                />
              ))}
            </div>
          </div>

          {/* Type Radio Buttons */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Type <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {(['expense', 'income', 'both'] as const).map((typeOption) => (
                <label
                  key={typeOption}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="category-type"
                    value={typeOption}
                    checked={type === typeOption}
                    onChange={(e) => setType(e.target.value as typeof type)}
                    className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                    {typeOption}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors duration-200"
            >
              {editCategory ? 'Update' : 'Add'} Category
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
