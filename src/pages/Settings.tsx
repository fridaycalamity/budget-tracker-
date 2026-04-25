import { useState } from 'react';
import { useBudget } from '../contexts';
import { CategoryManager } from '../components';

/**
 * Settings page
 * Provides sync and data management options
 * 
 * Features:
 * - Retry sync for offline queue
 * - Refresh from server
 * - Clear local cache
 * 
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6
 */
export function Settings() {
  const { retrySync, clearLocalCache, forceRefreshFromServer, queuedCount, isSyncing } = useBudget();

  const handleRetrySync = async () => {
    await retrySync();
  };

  const handleClearLocalCache = async () => {
    const confirmed = window.confirm(
      'Clear local offline cache? This will remove all locally cached transactions. You\'ll need to refresh the page to reload data from the server.'
    );
    if (!confirmed) return;
    await clearLocalCache();
  };

  const handleForceRefresh = async () => {
    const confirmed = window.confirm(
      'Re-sync all data from the server? This will replace your local data with a fresh copy from the cloud. Use this if your numbers don\'t match another device.'
    );
    if (!confirmed) return;
    await forceRefreshFromServer();
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
        Settings
      </h2>
      <p className="text-gray-600 dark:text-gray-400">
        Manage your application settings and data
      </p>

      {/* Category Management Section */}
      <CategoryManager />

      {/* Sync & Data Management Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Sync & Data
        </h3>
        <div className="space-y-3">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Offline sync queue: {queuedCount} pending change{queuedCount === 1 ? '' : 's'}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleRetrySync}
              disabled={isSyncing}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              aria-label="Retry sync"
            >
              {isSyncing ? 'Syncing...' : 'Retry Sync'}
            </button>
            <button
              onClick={handleForceRefresh}
              disabled={isSyncing}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              aria-label="Force refresh from server"
            >
              {isSyncing ? 'Refreshing...' : 'Refresh from Server'}
            </button>
            <button
              onClick={handleClearLocalCache}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200"
              aria-label="Clear local cache"
            >
              Clear Local Cache
            </button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            <strong>Retry Sync</strong> — pushes queued offline changes to the server.{' '}
            <strong>Refresh from Server</strong> — replaces local data with a fresh copy from the cloud. Use if numbers don't match another device.
          </p>
        </div>
      </div>
    </div>
  );
}
