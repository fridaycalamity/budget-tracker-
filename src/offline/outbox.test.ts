import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearOutbox,
  enqueueOutboxItem,
  getOutboxItems,
  getOutboxSize,
  removeOutboxItem,
  updateOutboxItem,
} from './outbox';

describe('outbox', () => {
  const userId = 'user-outbox-test';

  beforeEach(async () => {
    localStorage.clear();
    await clearOutbox(userId);
  });

  it('enqueues and reads outbox items', async () => {
    await enqueueOutboxItem(userId, {
      type: 'transaction.create',
      entityId: 'tx-1',
      payload: {
        id: 'tx-1',
        description: 'Coffee',
      },
    });

    const items = await getOutboxItems(userId);
    expect(items).toHaveLength(1);
    expect(items[0].entityId).toBe('tx-1');
    expect(await getOutboxSize(userId)).toBe(1);
  });

  it('updates and removes outbox items', async () => {
    const item = await enqueueOutboxItem(userId, {
      type: 'transaction.update',
      entityId: 'tx-2',
      payload: {
        id: 'tx-2',
        description: 'Updated',
      },
    });

    await updateOutboxItem(userId, item.id, { retryCount: 3 });
    let items = await getOutboxItems(userId);
    expect(items[0].retryCount).toBe(3);

    await removeOutboxItem(userId, item.id);
    items = await getOutboxItems(userId);
    expect(items).toHaveLength(0);
  });
});
