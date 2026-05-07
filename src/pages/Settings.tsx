import { useBudget } from '../contexts';
import { CategoryManager, BalanceSourceManager } from '../components';

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
    <div className="space-y-4 lg:space-y-5">
      <section>
        <p className="app-kicker mb-2">System</p>
        <h1 className="app-page-title">Settings</h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--app-text-muted)] sm:text-base">Manage source accounts, categories, and sync controls for the ledger.</p>
      </section>

      <CategoryManager />
      <BalanceSourceManager />

      <div className="app-panel p-5 sm:p-6">
        <div className="app-kicker mb-2">Offline Control</div>
        <h3 className="app-section-title text-lg">Sync & Data</h3>
        <div className="mt-4 space-y-3">
          <p className="text-sm text-[var(--app-text-muted)]">
            Offline sync queue: <span className="font-black text-[var(--app-text)]">{queuedCount}</span> pending change{queuedCount === 1 ? '' : 's'}
          </p>
          <div className="flex flex-wrap gap-2">
            <button onClick={handleRetrySync} disabled={isSyncing} className="app-button-primary px-4 text-white disabled:opacity-50" aria-label="Retry sync">
              {isSyncing ? 'Syncing...' : 'Retry Sync'}
            </button>
            <button onClick={handleForceRefresh} disabled={isSyncing} className="app-button-secondary px-4 disabled:opacity-50" aria-label="Force refresh from server">
              {isSyncing ? 'Refreshing...' : 'Refresh from Server'}
            </button>
            <button onClick={handleClearLocalCache} className="app-button-secondary px-4" aria-label="Clear local cache">
              Clear Local Cache
            </button>
          </div>
          <div className="border border-dashed border-[var(--app-border-strong)] p-4 text-xs leading-6 uppercase tracking-[0.08em] text-[var(--app-text-muted)]">
            Retry Sync pushes queued offline changes to the server. Refresh from Server replaces local data with a fresh cloud copy. Clear Local Cache should only be used when you are sure the server has the latest state.
          </div>
        </div>
      </div>
    </div>
  );
}
