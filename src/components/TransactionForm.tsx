import { useState, useMemo, useEffect, type FormEvent, type ChangeEvent } from 'react';
import { format } from 'date-fns';
import { useBudget, useCategories } from '../contexts';
import type { Transaction } from '../types';

/**
 * TransactionForm component
 * Form for adding or editing transactions with validation
 * 
 * Features:
 * - Description input (required, max 200 characters)
 * - Amount input (positive numbers only)
 * - Type selector (income/expense radio buttons)
 * - Category dropdown (dynamic categories from CategoryContext)
 * - Date picker (defaults to current date)
 * - Form validation with error display
 * - Form submission handling
 * - Auto-clear after successful submission (add mode only)
 * - Supports both add and edit modes
 */

interface TransactionFormProps {
  onSuccess?: () => void; // Optional callback after successful submission
  editTransaction?: Transaction | null; // Transaction to edit (null for add mode)
}

export function TransactionForm({ onSuccess, editTransaction }: TransactionFormProps) {
  const { addTransaction, updateTransaction } = useBudget();
  const { getCategoriesByType } = useCategories();

  // Form state
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));

  // Initialize form with edit data
  useEffect(() => {
    if (editTransaction) {
      setDescription(editTransaction.description);
      setAmount(editTransaction.amount.toString());
      setType(editTransaction.type);
      setCategory(editTransaction.category);
      setDate(editTransaction.date);
    } else {
      // Reset form for add mode
      setDescription('');
      setAmount('');
      setType('expense');
      setCategory('');
      setDate(format(new Date(), 'yyyy-MM-dd'));
    }
    setErrors({});
  }, [editTransaction]);

  // Get filtered categories based on transaction type
  const availableCategories = useMemo(() => {
    return getCategoriesByType(type);
  }, [type, getCategoriesByType]);

  // Set default category when type changes or categories load
  useMemo(() => {
    if (availableCategories.length > 0 && !category) {
      // Find "Other" category or use first available
      const otherCategory = availableCategories.find(cat => cat.name === 'Other');
      setCategory(otherCategory?.id || availableCategories[0].id);
    }
  }, [availableCategories, category]);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Validates form data
   * Returns true if valid, false otherwise and sets error messages
   */
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate description
    const trimmedDescription = description.trim();
    if (!trimmedDescription) {
      newErrors.description = 'Description is required';
    } else if (trimmedDescription.length > 200) {
      newErrors.description = 'Description must not exceed 200 characters';
    }

    // Validate amount
    const numAmount = parseFloat(amount);
    if (!amount || amount.trim() === '') {
      newErrors.amount = 'Amount is required';
    } else if (isNaN(numAmount)) {
      newErrors.amount = 'Amount must be a valid number';
    } else if (numAmount <= 0) {
      newErrors.amount = 'Amount must be positive';
    } else {
      // Check for max 2 decimal places
      const decimalPlaces = (amount.split('.')[1] || '').length;
      if (decimalPlaces > 2) {
        newErrors.amount = 'Amount must have at most 2 decimal places';
      }
    }

    // Validate date
    if (!date) {
      newErrors.date = 'Date is required';
    } else {
      const selectedDate = new Date(date);
      const today = new Date();
      today.setHours(23, 59, 59, 999); // End of today

      if (selectedDate > today) {
        newErrors.date = 'Date cannot be in the future';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handles form submission
   */
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Create transaction object
      const transaction = {
        description: description.trim(),
        amount: parseFloat(amount),
        type,
        category,
        date,
      };

      // Add or update transaction via context
      if (editTransaction) {
        updateTransaction(editTransaction.id, transaction);
      } else {
        addTransaction(transaction);
      }

      // Clear form on success (only in add mode)
      if (!editTransaction) {
        setDescription('');
        setAmount('');
        setType('expense');
        // Reset to default category
        const otherCategory = availableCategories.find(cat => cat.name === 'Other');
        setCategory(otherCategory?.id || availableCategories[0]?.id || '');
        setDate(format(new Date(), 'yyyy-MM-dd'));
      }
      setErrors({});

      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      // Handle validation errors from context
      if (error instanceof Error) {
        setErrors({ submit: error.message });
      } else {
        setErrors({ submit: 'Failed to add transaction' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handles description input change
   */
  const handleDescriptionChange = (e: ChangeEvent<HTMLInputElement>) => {
    setDescription(e.target.value);
    // Clear error when user starts typing
    if (errors.description) {
      setErrors((prev) => {
        // Remove description error while keeping other errors
        const newErrors = { ...prev };
        delete newErrors.description;
        return newErrors;
      });
    }
  };

  /**
   * Handles amount input change
   * Only allows positive numbers with up to 2 decimal places
   */
  const handleAmountChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // Allow empty string for clearing
    if (value === '') {
      setAmount('');
      return;
    }

    // Allow valid number format (including partial inputs like "10.")
    if (/^\d*\.?\d{0,2}$/.test(value)) {
      setAmount(value);
      // Clear error when user starts typing
      if (errors.amount) {
        setErrors((prev) => {
          // Remove amount error while keeping other errors
          const newErrors = { ...prev };
          delete newErrors.amount;
          return newErrors;
        });
      }
    }
  };

  /**
   * Handles type change (income/expense)
   * Updates available categories when type changes
   */
  const handleTypeChange = (newType: 'income' | 'expense') => {
    setType(newType);
    // Reset category to first available for new type
    const newCategories = getCategoriesByType(newType);
    if (newCategories.length > 0) {
      const otherCategory = newCategories.find(cat => cat.name === 'Other');
      setCategory(otherCategory?.id || newCategories[0].id);
    }
  };

  /**
   * Handles category change
   */
  const handleCategoryChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setCategory(e.target.value);
  };

  /**
   * Handles date change
   */
  const handleDateChange = (e: ChangeEvent<HTMLInputElement>) => {
    setDate(e.target.value);
    // Clear error when user changes date
    if (errors.date) {
      setErrors((prev) => {
        // Remove date error while keeping other errors
        const newErrors = { ...prev };
        delete newErrors.date;
        return newErrors;
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Description Input */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium mb-1">
          Description <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="description"
          value={description}
          onChange={handleDescriptionChange}
          placeholder="Enter transaction description"
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.description ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
          } dark:bg-gray-700 dark:text-white`}
          maxLength={200}
          aria-invalid={!!errors.description}
          aria-describedby={errors.description ? 'description-error' : undefined}
        />
        {errors.description && (
          <p id="description-error" className="mt-1 text-sm text-red-500">
            {errors.description}
          </p>
        )}
      </div>

      {/* Amount Input */}
      <div>
        <label htmlFor="amount" className="block text-sm font-medium mb-1">
          Amount (₱) <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          inputMode="decimal"
          id="amount"
          value={amount}
          onChange={handleAmountChange}
          placeholder="0.00"
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.amount ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
          } dark:bg-gray-700 dark:text-white`}
          aria-invalid={!!errors.amount}
          aria-describedby={errors.amount ? 'amount-error' : undefined}
        />
        {errors.amount && (
          <p id="amount-error" className="mt-1 text-sm text-red-500">
            {errors.amount}
          </p>
        )}
      </div>

      {/* Type Selector (Radio Buttons) */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Type <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-4">
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="type"
              value="income"
              checked={type === 'income'}
              onChange={() => handleTypeChange('income')}
              className="mr-2 cursor-pointer"
            />
            <span className="text-sm">Income</span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="type"
              value="expense"
              checked={type === 'expense'}
              onChange={() => handleTypeChange('expense')}
              className="mr-2 cursor-pointer"
            />
            <span className="text-sm">Expense</span>
          </label>
        </div>
      </div>

      {/* Category Dropdown */}
      <div>
        <label htmlFor="category" className="block text-sm font-medium mb-1">
          Category <span className="text-red-500">*</span>
        </label>
        <select
          id="category"
          value={category}
          onChange={handleCategoryChange}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
        >
          {availableCategories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.icon} {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Date Picker */}
      <div>
        <label htmlFor="date" className="block text-sm font-medium mb-1">
          Date <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          id="date"
          value={date}
          onChange={handleDateChange}
          max={format(new Date(), 'yyyy-MM-dd')}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.date ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
          } dark:bg-gray-700 dark:text-white`}
          aria-invalid={!!errors.date}
          aria-describedby={errors.date ? 'date-error' : undefined}
        />
        {errors.date && (
          <p id="date-error" className="mt-1 text-sm text-red-500">
            {errors.date}
          </p>
        )}
      </div>

      {/* Submit Error */}
      {errors.submit && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{errors.submit}</p>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
          isSubmitting
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
      >
        {isSubmitting ? (editTransaction ? 'Updating...' : 'Adding...') : (editTransaction ? 'Update Transaction' : 'Add Transaction')}
      </button>
    </form>
  );
}
