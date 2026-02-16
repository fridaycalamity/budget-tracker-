import type { Transaction } from '../types';
import type { OutboxItem } from './outbox';

const DB_NAME = 'budget-tracker-offline-db';
const DB_VERSION = 1;
const STORE_NAME = 'offline_kv';
const FALLBACK_PREFIX = 'budget_tracker_offline_';

type PersistedValue = Transaction[] | OutboxItem[];

function isIndexedDbAvailable(): boolean {
  return typeof indexedDB !== 'undefined';
}

function getFallbackKey(key: string): string {
  return `${FALLBACK_PREFIX}${key}`;
}

async function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB'));
  });
}

async function getFromIndexedDb<T extends PersistedValue>(key: string): Promise<T | null> {
  const db = await openDb();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(key);

    request.onsuccess = () => {
      resolve((request.result?.value as T | undefined) ?? null);
    };
    request.onerror = () => reject(request.error ?? new Error('Failed to read IndexedDB'));

    tx.oncomplete = () => db.close();
    tx.onerror = () => {
      db.close();
      reject(tx.error ?? new Error('IndexedDB read transaction failed'));
    };
  });
}

async function setInIndexedDb<T extends PersistedValue>(key: string, value: T): Promise<void> {
  const db = await openDb();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put({ key, value });

    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error ?? new Error('IndexedDB write transaction failed'));
    };
  });
}

async function deleteInIndexedDb(key: string): Promise<void> {
  const db = await openDb();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(key);

    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error ?? new Error('IndexedDB delete transaction failed'));
    };
  });
}

function getFromFallback<T extends PersistedValue>(key: string): T | null {
  const raw = localStorage.getItem(getFallbackKey(key));
  if (!raw) return null;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function setInFallback<T extends PersistedValue>(key: string, value: T): void {
  localStorage.setItem(getFallbackKey(key), JSON.stringify(value));
}

function deleteInFallback(key: string): void {
  localStorage.removeItem(getFallbackKey(key));
}

async function getJson<T extends PersistedValue>(key: string): Promise<T | null> {
  if (!isIndexedDbAvailable()) return getFromFallback<T>(key);

  try {
    return await getFromIndexedDb<T>(key);
  } catch {
    return getFromFallback<T>(key);
  }
}

async function setJson<T extends PersistedValue>(key: string, value: T): Promise<void> {
  if (!isIndexedDbAvailable()) {
    setInFallback(key, value);
    return;
  }

  try {
    await setInIndexedDb(key, value);
  } catch {
    setInFallback(key, value);
  }
}

async function deleteJson(key: string): Promise<void> {
  if (!isIndexedDbAvailable()) {
    deleteInFallback(key);
    return;
  }

  try {
    await deleteInIndexedDb(key);
  } catch {
    deleteInFallback(key);
  }
}

function userTransactionsKey(userId: string): string {
  return `transactions:${userId}`;
}

function userOutboxKey(userId: string): string {
  return `outbox:${userId}`;
}

export const offlineDb = {
  async getTransactions(userId: string): Promise<Transaction[]> {
    const data = await getJson<Transaction[]>(userTransactionsKey(userId));
    return data ?? [];
  },

  async setTransactions(userId: string, transactions: Transaction[]): Promise<void> {
    await setJson(userTransactionsKey(userId), transactions);
  },

  async getOutbox(userId: string): Promise<OutboxItem[]> {
    const data = await getJson<OutboxItem[]>(userOutboxKey(userId));
    return data ?? [];
  },

  async setOutbox(userId: string, items: OutboxItem[]): Promise<void> {
    await setJson(userOutboxKey(userId), items);
  },

  async clearUserData(userId: string): Promise<void> {
    await Promise.all([
      deleteJson(userTransactionsKey(userId)),
      deleteJson(userOutboxKey(userId)),
    ]);
  },
};
