import { v4 as uuidv4 } from 'uuid';
import type { Transaction } from '../types';
import { offlineDb } from './db';

export type OutboxMutationType =
  | 'transaction.create'
  | 'transaction.update'
  | 'transaction.delete';

export interface OutboxItem {
  id: string;
  type: OutboxMutationType;
  entityId: string;
  payload: Partial<Transaction> & { id: string };
  createdAt: string;
  retryCount: number;
}

export interface EnqueueOutboxInput {
  type: OutboxMutationType;
  entityId: string;
  payload: Partial<Transaction> & { id: string };
}

export async function enqueueOutboxItem(
  userId: string,
  input: EnqueueOutboxInput
): Promise<OutboxItem> {
  const current = await offlineDb.getOutbox(userId);
  const item: OutboxItem = {
    id: uuidv4(),
    type: input.type,
    entityId: input.entityId,
    payload: input.payload,
    createdAt: new Date().toISOString(),
    retryCount: 0,
  };

  await offlineDb.setOutbox(userId, [...current, item]);
  return item;
}

export async function getOutboxItems(userId: string): Promise<OutboxItem[]> {
  return offlineDb.getOutbox(userId);
}

export async function getOutboxSize(userId: string): Promise<number> {
  const items = await offlineDb.getOutbox(userId);
  return items.length;
}

export async function removeOutboxItem(userId: string, itemId: string): Promise<void> {
  const current = await offlineDb.getOutbox(userId);
  await offlineDb.setOutbox(
    userId,
    current.filter((item) => item.id !== itemId)
  );
}

export async function updateOutboxItem(
  userId: string,
  itemId: string,
  updates: Partial<OutboxItem>
): Promise<void> {
  const current = await offlineDb.getOutbox(userId);
  await offlineDb.setOutbox(
    userId,
    current.map((item) => (item.id === itemId ? { ...item, ...updates } : item))
  );
}

export async function clearOutbox(userId: string): Promise<void> {
  await offlineDb.setOutbox(userId, []);
}
