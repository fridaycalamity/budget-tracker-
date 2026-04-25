import type { Transaction } from '../types';

function getVersionValue(transaction: Transaction): number {
  const versionTimestamp = transaction.updatedAt ?? transaction.createdAt;
  const parsed = Date.parse(versionTimestamp);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function mergeTransactions(local: Transaction[], remote: Transaction[]): Transaction[] {
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

  return Array.from(byId.values()).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}
