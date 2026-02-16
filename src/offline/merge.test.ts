import { describe, expect, it } from 'vitest';
import { mergeTransactions } from './merge';
import type { Transaction } from '../types';

function tx(overrides: Partial<Transaction> & Pick<Transaction, 'id'>): Transaction {
  const { id, ...rest } = overrides;
  return {
    id,
    description: 'test',
    amount: 100,
    type: 'expense',
    category: 'cat-1',
    date: '2026-02-16',
    createdAt: '2026-02-16T10:00:00Z',
    ...rest,
  };
}

describe('mergeTransactions', () => {
  it('keeps the latest version by updatedAt', () => {
    const local = [
      tx({
        id: '1',
        description: 'local-new',
        updatedAt: '2026-02-16T12:00:00Z',
      }),
    ];
    const remote = [
      tx({
        id: '1',
        description: 'remote-old',
        updatedAt: '2026-02-16T11:00:00Z',
      }),
    ];

    const merged = mergeTransactions(local, remote);
    expect(merged).toHaveLength(1);
    expect(merged[0].description).toBe('local-new');
  });

  it('includes local-only and remote-only transactions', () => {
    const local = [tx({ id: 'local-only', description: 'L' })];
    const remote = [tx({ id: 'remote-only', description: 'R' })];

    const merged = mergeTransactions(local, remote);
    expect(merged.map((item) => item.id).sort()).toEqual(['local-only', 'remote-only']);
  });
});
