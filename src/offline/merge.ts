import type { Transaction } from '../types';

function getVersionValue(transaction: Transaction): number {
  const versionTimestamp = transaction.updatedAt ?? transaction.createdAt;
  const parsed = Date.parse(versionTimestamp);
  return Number.isNaN(parsed) ? 0 : parsed;
}

/**
 * Generates a content-based key for a transaction.
 * Two transactions with the same key represent the same logical record
 * (even if they have different UUIDs due to cross-device creation).
 */
function getContentKey(transaction: Transaction): string {
  return `${transaction.description.trim().toLowerCase()}|${transaction.amount}|${transaction.type}|${transaction.date}`;
}

export function mergeTransactions(local: Transaction[], remote: Transaction[]): Transaction[] {
  // Phase 1: Deduplicate by ID (existing behavior)
  const byId = new Map<string, Transaction>();

  for (const transaction of remote) {
    byId.set(transaction.id, transaction);
  }

  for (const localTransaction of local) {
    const existing = byId.get(localTransaction.id);
    if (!existing) {
      byId.set(localTransaction.id, localTransaction);
      continue;
    }

    if (getVersionValue(localTransaction) >= getVersionValue(existing)) {
      byId.set(localTransaction.id, localTransaction);
    }
  }

  // Phase 2: Deduplicate by content (prevents cross-device duplicate creation)
  const byContent = new Map<string, Transaction>();
  const allTransactions = Array.from(byId.values());

  for (const transaction of allTransactions) {
    const key = getContentKey(transaction);
    const existing = byContent.get(key);

    if (!existing) {
      byContent.set(key, transaction);
      continue;
    }

    // Keep the newer version when content matches
    if (getVersionValue(transaction) >= getVersionValue(existing)) {
      byContent.set(key, transaction);
    }
  }

  return Array.from(byContent.values()).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}
