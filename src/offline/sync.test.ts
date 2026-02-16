import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearOutbox, enqueueOutboxItem, getOutboxSize } from './outbox';
import { processOutboxQueue } from './sync';

const serverRows: Array<Record<string, unknown>> = [];

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn((table: string) => {
      const builder: Record<string, unknown> = {
        error: null,
        select: () => builder,
        single: async () => ({ data: null, error: null }),
        upsert: (payload: Record<string, unknown>) => {
          if (table === 'transactions') {
            const index = serverRows.findIndex((row) => row.id === payload.id);
            if (index >= 0) serverRows[index] = payload;
            else serverRows.push(payload);
          }

          return {
            error: null,
            select: () => ({
              single: async () => ({ data: payload, error: null }),
            }),
          };
        },
        delete: () => builder,
        eq: (_field: string, value: string) => {
          if (table === 'transactions' && _field === 'id') {
            const index = serverRows.findIndex((row) => row.id === value);
            if (index >= 0) serverRows.splice(index, 1);
          }
          return builder;
        },
      };
      return builder;
    }),
  },
}));

describe('processOutboxQueue', () => {
  const userId = 'sync-user';
  let online = true;

  beforeEach(async () => {
    serverRows.length = 0;
    localStorage.clear();
    await clearOutbox(userId);
    online = true;
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      get: () => online,
    });
  });

  it('processes queued create/update/delete mutations', async () => {
    await enqueueOutboxItem(userId, {
      type: 'transaction.create',
      entityId: 'tx-1',
      payload: {
        id: 'tx-1',
        description: 'New',
        amount: 100,
        type: 'expense',
        category: 'cat-1',
        date: '2026-02-16',
        createdAt: '2026-02-16T12:00:00Z',
      },
    });

    await enqueueOutboxItem(userId, {
      type: 'transaction.update',
      entityId: 'tx-1',
      payload: {
        id: 'tx-1',
        description: 'Updated',
        amount: 150,
        type: 'expense',
        category: 'cat-1',
        date: '2026-02-16',
        createdAt: '2026-02-16T12:00:00Z',
      },
    });

    await enqueueOutboxItem(userId, {
      type: 'transaction.delete',
      entityId: 'tx-1',
      payload: { id: 'tx-1' },
    });

    const result = await processOutboxQueue(userId);

    expect(result.processed).toBe(3);
    expect(result.failed).toBe(0);
    expect(result.remaining).toBe(0);
    expect(await getOutboxSize(userId)).toBe(0);
    expect(serverRows).toHaveLength(0);
  });

  it('does not process queue when offline', async () => {
    await enqueueOutboxItem(userId, {
      type: 'transaction.create',
      entityId: 'tx-2',
      payload: { id: 'tx-2' },
    });

    online = false;
    const result = await processOutboxQueue(userId);

    expect(result.processed).toBe(0);
    expect(result.remaining).toBe(1);
    expect(await getOutboxSize(userId)).toBe(1);
  });
});
