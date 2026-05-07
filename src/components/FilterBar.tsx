import { type ChangeEvent } from 'react';
import type { TransactionFilters } from '../types';
import { useCategories } from '../contexts';

interface FilterBarProps {
  filters: TransactionFilters;
  onFiltersChange: (filters: TransactionFilters) => void;
}

export function FilterBar({ filters, onFiltersChange }: FilterBarProps) {
  const { categories } = useCategories();

  const handleTypeChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value as 'all' | 'income' | 'expense';
    onFiltersChange({ ...filters, type: newType });
  };

  const handleCategoryChange = (e: ChangeEvent<HTMLSelectElement>) => {
    onFiltersChange({ ...filters, category: e.target.value });
  };

  const handleStartDateChange = (e: ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({ ...filters, dateRange: { ...filters.dateRange, start: e.target.value || null } });
  };

  const handleEndDateChange = (e: ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({ ...filters, dateRange: { ...filters.dateRange, end: e.target.value || null } });
  };

  const handleClearFilters = () => {
    onFiltersChange({ type: 'all', category: 'all', dateRange: { start: null, end: null } });
  };

  const hasActiveFilters = filters.type !== 'all' || filters.category !== 'all' || filters.dateRange.start !== null || filters.dateRange.end !== null;

  const inputClass = 'app-input w-full px-3 py-3';
  const labelClass = 'mb-1 block text-[11px] font-black uppercase tracking-[0.14em] text-[var(--app-text-muted)]';

  return (
    <div className="app-panel p-4 sm:p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="app-section-title text-lg">Filters</h3>
          <p className="mt-1 text-sm text-[var(--app-text-muted)]">Refine the ledger by type, category, and date.</p>
        </div>
        {hasActiveFilters && (
          <button onClick={handleClearFilters} className="app-brush-link text-sm" aria-label="Clear all filters">
            Clear All
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div>
          <label htmlFor="type-filter" className={labelClass}>Type</label>
          <select id="type-filter" value={filters.type} onChange={handleTypeChange} className={inputClass} aria-label="Filter by transaction type">
            <option value="all">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
        </div>

        <div>
          <label htmlFor="category-filter" className={labelClass}>Category</label>
          <select id="category-filter" value={filters.category} onChange={handleCategoryChange} className={inputClass} aria-label="Filter by category">
            <option value="all">All Categories</option>
            {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
          </select>
        </div>

        <div>
          <label htmlFor="start-date-filter" className={labelClass}>Start Date</label>
          <input type="date" id="start-date-filter" value={filters.dateRange.start || ''} onChange={handleStartDateChange} className={inputClass} aria-label="Filter by start date" />
        </div>

        <div>
          <label htmlFor="end-date-filter" className={labelClass}>End Date</label>
          <input type="date" id="end-date-filter" value={filters.dateRange.end || ''} onChange={handleEndDateChange} className={inputClass} aria-label="Filter by end date" />
        </div>
      </div>
    </div>
  );
}
