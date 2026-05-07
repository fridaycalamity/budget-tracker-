import { useBudget } from '../contexts';

export function OfflineBanner() {
  const { isOffline, queuedCount, isSyncing } = useBudget();

  if (!isOffline && queuedCount === 0 && !isSyncing) return null;

  return (
    <div className="app-panel-dark px-4 py-2 text-center text-xs font-black uppercase tracking-[0.16em]">
      {isOffline ? 'Offline Mode — Changes Will Sync Later' : 'Back Online'}
      {queuedCount > 0 ? ` · ${queuedCount} queued` : ''}
      {isSyncing ? ' · Syncing' : ''}
    </div>
  );
}
