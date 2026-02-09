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
    if (importError) {
      setError(importError);
    }
    setImporting(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
      <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
              We found existing data on this device.
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-0.5">
              Import it to your account?
            </p>
            {error && <p className="text-sm text-red-600 dark:text-red-400 mt-1">{error}</p>}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleImport}
              disabled={importing}
              className="px-4 py-1.5 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {importing ? 'Importing...' : 'Import Data'}
            </button>
            <button
              type="button"
              onClick={dismissLocalData}
              disabled={importing}
              className="px-4 py-1.5 text-sm font-medium rounded-md border border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 disabled:opacity-50 transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
