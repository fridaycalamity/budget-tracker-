/* eslint-disable @typescript-eslint/no-explicit-any */
import '@testing-library/jest-dom';
import { beforeEach } from 'vitest';

// Mock localStorage for tests
const localStorageMock = {
  getItem: (key: string) => {
    return localStorageMock.store[key] || null;
  },
  setItem: (key: string, value: string) => {
    localStorageMock.store[key] = value;
  },
  removeItem: (key: string) => {
    delete localStorageMock.store[key];
  },
  clear: () => {
    localStorageMock.store = {};
  },
  get length() {
    return Object.keys(localStorageMock.store).length;
  },
  key: (index: number) => {
    const keys = Object.keys(localStorageMock.store);
    return keys[index] || null;
  },
  store: {} as Record<string, string>,
};

(globalThis as any).localStorage = localStorageMock;

// Clear localStorage before each test
beforeEach(() => {
  localStorageMock.clear();
});
