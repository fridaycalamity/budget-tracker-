import { type ChangeEvent } from 'react';
import type { SortConfig } from '../types';

interface SortControlsProps {
  sortConfig: SortConfig;
  onSortChange: (sortConfig: SortConfig) => void;
}

export function SortControls({ sortConfig, onSortChange }: SortControlsProps) {
  const handleFieldChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const newField = e.target.value as 'date' | 'amount';
    onSortChange({ ...sortConfig, field: newField });
  };

  const handleDirectionChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const newDirection = e.target.value as 'asc' | 'desc';
    onSortChange({ ...sortConfig, direction: newDirection });
  };

  const toggleDirection = () => {
    onSortChange({ ...sortConfig, direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' });
  };

  const inputClass = 'app-input w-full px-3 py-3';
  const labelClass = 'mb-1 block text-[11px] font-black uppercase tracking-[0.14em] text-[var(--app-text-muted)]';

  return (
    <div className="app-panel p-4 sm:p-5">
      <div className="mb-4">
        <h3 className="app-section-title text-lg">Sort By</h3>
        <p className="mt-1 text-sm text-[var(--app-text-muted)]">Change the ledger order without leaving the page.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <label htmlFor="sort-field" className={labelClass}>Field</label>
          <select id="sort-field" value={sortConfig.field} onChange={handleFieldChange} className={inputClass} aria-label="Select sort field">
            <option value="date">Date</option>
            <option value="amount">Amount</option>
          </select>
        </div>

        <div>
          <label htmlFor="sort-direction" className={labelClass}>Direction</label>
          <select id="sort-direction" value={sortConfig.direction} onChange={handleDirectionChange} className={inputClass} aria-label="Select sort direction">
            <option value="asc">Ascending {sortConfig.field === 'date' ? '(Oldest First)' : '(Lowest First)'}</option>
            <option value="desc">Descending {sortConfig.field === 'date' ? '(Newest First)' : '(Highest First)'}</option>
          </select>
        </div>

        <div className="flex items-end">
          <button onClick={toggleDirection} className="app-button-primary w-full px-4 text-white" aria-label={`Toggle sort direction to ${sortConfig.direction === 'asc' ? 'descending' : 'ascending'}`}>
            {sortConfig.direction === 'asc' ? 'Ascending ↑' : 'Descending ↓'}
          </button>
        </div>
      </div>
    </div>
  );
}
