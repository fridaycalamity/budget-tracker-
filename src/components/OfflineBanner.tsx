import { useBudget } from '../contexts';

export function OfflineBanner() {
  const { isOffline, queuedCount, isSyncing } = useBudget();

  if (!isOffline && queuedCount === 0 && !isSyncing) return null;

  return (
    <div className="bg-amber-500 dark:bg-amber-600 text-white text-center py-2 px-4 text-sm font-medium">
      {isOffline ? "You're offline — using cached data" : 'Back online'}
      {queuedCount > 0 ? ` • ${queuedCount} change${queuedCount === 1 ? '' : 's'} queued` : ''}
      {isSyncing ? ' • Syncing changes...' : ''}
    </div>
  );
}
