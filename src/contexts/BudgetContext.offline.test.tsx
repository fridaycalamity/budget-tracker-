import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { ToastProvider } from './ToastContext';
import { BudgetProvider, useBudget } from './BudgetContext';
import { setMockAuth } from '../test/testUtils';

type ServerRow = {
  id: string;
  description?: string;
  amount?: number;
  type?: 'income' | 'expense';
  category_id?: string;
  date?: string;
  user_id?: string;
  created_at?: string;
};

const serverTransactions: ServerRow[] = [];

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn((table: string) => {
      const state: {
        selectMode: boolean;
        userId: string | null;
        txId: string | null;
      } = {
        selectMode: false,
        userId: null,
        txId: null,
      };

      const builder: Record<string, unknown> = {
        error: null,
        select: () => {
          state.selectMode = true;
          return builder;
        },
        eq: (field: string, value: string) => {
          if (field === 'user_id') state.userId = value;
          if (field === 'id') state.txId = value;

          if (table === 'transactions' && !state.selectMode && state.txId) {
            const index = serverTransactions.findIndex((row) => row.id === state.txId);
            if (index >= 0) serverTransactions.splice(index, 1);
          }

          return builder;
        },
        order: async () => {
          if (table !== 'transactions') return { data: [], error: null };
          const rows = serverTransactions.filter((row) =>
            state.userId ? row.user_id === state.userId : true
          );
          return { data: rows, error: null };
        },
        single: async () => {
          if (table === 'user_settings') {
            return { data: null, error: { code: 'PGRST116' } };
          }
          return { data: null, error: null };
        },
        upsert: (payload: ServerRow) => {
          if (table === 'transactions') {
            const index = serverTransactions.findIndex((row) => row.id === payload.id);
            if (index >= 0) serverTransactions[index] = payload;
            else serverTransactions.push(payload);
          }

          return {
            error: null,
            select: () => ({
              single: async () => ({ data: payload, error: null }),
            }),
          };
        },
        delete: () => builder,
      };

      return builder;
    }),
  },
}));

function createWrapper() {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <ToastProvider>
        <BudgetProvider>{children}</BudgetProvider>
      </ToastProvider>
    );
  };
}

describe('BudgetContext offline behavior', () => {
  let online = true;

  beforeEach(() => {
    localStorage.clear();
    serverTransactions.length = 0;
    online = true;
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      get: () => online,
    });

    setMockAuth({
      user: { id: 'user-1' } as never,
      session: null,
      loading: false,
    });
  });

  it('queues create/update/delete mutations while offline', async () => {
    online = false;
    const { result } = renderHook(() => useBudget(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.addTransaction({
        description: 'Offline tx',
        amount: 120,
        type: 'expense',
        category: 'cat-1',
        date: '2026-02-16',
      });
    });

    await waitFor(() => expect(result.current.queuedCount).toBe(1));
    expect(result.current.transactions[0].__syncStatus).toBe('queued');

    const txId = result.current.transactions[0].id;

    await act(async () => {
      await result.current.updateTransaction(txId, {
        description: 'Offline tx updated',
        amount: 140,
        type: 'expense',
        category: 'cat-1',
        date: '2026-02-16',
      });
    });

    await waitFor(() => expect(result.current.queuedCount).toBe(2));

    await act(async () => {
      await result.current.deleteTransaction(txId);
    });

    await waitFor(() => expect(result.current.queuedCount).toBe(3));
    expect(result.current.transactions.find((item) => item.id === txId)).toBeUndefined();
  });

  it('syncs queued changes when back online via online event', async () => {
    online = false;
    const { result } = renderHook(() => useBudget(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.addTransaction({
        description: 'Queued tx',
        amount: 50,
        type: 'expense',
        category: 'cat-1',
        date: '2026-02-16',
      });
    });

    await waitFor(() => expect(result.current.queuedCount).toBe(1));

    online = true;
    act(() => {
      window.dispatchEvent(new Event('online'));
    });

    await waitFor(() => expect(result.current.queuedCount).toBe(0));
    expect(result.current.transactions[0].__syncStatus).toBe('synced');
  });
});
