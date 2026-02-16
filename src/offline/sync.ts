import type { Transaction } from '../types';
import { supabase } from '../lib/supabase';
import {
  getOutboxItems,
  removeOutboxItem,
  updateOutboxItem,
  type OutboxItem,
} from './outbox';

export interface SyncResult {
  processed: number;
  failed: number;
  remaining: number;
}

function toServerTransaction(transaction: Partial<Transaction> & { id: string }, userId: string) {
  return {
    id: transaction.id,
    description: transaction.description,
    amount: transaction.amount,
    type: transaction.type,
    category_id: transaction.category,
    date: transaction.date,
    user_id: userId,
    created_at: transaction.createdAt,
  };
}

function isOfflineNetworkError(error: unknown): boolean {
  if (!navigator.onLine) return true;
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return message.includes('network') || message.includes('fetch') || message.includes('failed');
}

async function applyOutboxItem(userId: string, item: OutboxItem): Promise<void> {
  if (item.type === 'transaction.delete') {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', item.entityId)
      .eq('user_id', userId);

    if (error) throw error;
    return;
  }

  const row = toServerTransaction(item.payload, userId);
  const { error } = await supabase.from('transactions').upsert(row, { onConflict: 'id' });
  if (error) throw error;
}

function getRetryDelayMs(retryCount: number): number {
  return Math.min(500 * 2 ** retryCount, 8000);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function processOutboxQueue(userId: string): Promise<SyncResult> {
  const queue = await getOutboxItems(userId);

  if (!navigator.onLine || queue.length === 0) {
    return { processed: 0, failed: 0, remaining: queue.length };
  }

  let processed = 0;
  let failed = 0;

  for (const item of queue) {
    try {
      await applyOutboxItem(userId, item);
      await removeOutboxItem(userId, item.id);
      processed += 1;
    } catch (error) {
      failed += 1;

      await updateOutboxItem(userId, item.id, { retryCount: item.retryCount + 1 });

      if (isOfflineNetworkError(error)) {
        break;
      }

      await delay(getRetryDelayMs(item.retryCount));
      break;
    }
  }

  const remaining = (await getOutboxItems(userId)).length;
  return { processed, failed, remaining };
}
