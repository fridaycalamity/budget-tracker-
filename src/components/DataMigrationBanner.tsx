import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export function DataMigrationBanner() {
  const { hasPendingLocalData, importLocalData, dismissLocalData } = useAuth();
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!hasPendingLocalData) return null;

  const handleImport = async () => {
    setImporting(true);
    setError(null);
    const { error: importError } = await importLocalData();
    if (importError) setError(importError);
    setImporting(false);
  };

  return (
    <div className="app-panel border-dashed p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="app-kicker mb-1">Local Ledger Found</p>
          <p className="text-sm font-semibold text-[var(--app-text)]">We found existing data on this device.</p>
          <p className="mt-1 text-sm text-[var(--app-text-muted)]">Import it into your account to preserve previous entries and balances.</p>
          {error && (
            <p className="mt-2 border-l-4 border-[var(--app-border-strong)] pl-2 text-xs font-black uppercase tracking-[0.08em] text-[var(--app-text)]">
              {error}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleImport}
            disabled={importing}
            className="app-button-primary px-4 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {importing ? 'Importing...' : 'Import Data'}
          </button>
          <button
            type="button"
            onClick={dismissLocalData}
            disabled={importing}
            className="app-button-secondary px-4 disabled:opacity-50"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
