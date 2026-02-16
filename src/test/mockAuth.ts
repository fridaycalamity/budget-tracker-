import { vi } from 'vitest';
import type { useAuth } from '../contexts/AuthContext';

type MockAuthValue = ReturnType<typeof useAuth>;

const createDefaultAuth = (): MockAuthValue => ({
  user: null,
  session: null,
  loading: false,
  signUp: vi.fn(async () => ({ error: null })),
  signIn: vi.fn(async () => ({ error: null })),
  signInWithGoogle: vi.fn(async () => ({ error: null })),
  signOut: vi.fn(async () => {}),
  hasPendingLocalData: false,
  importLocalData: vi.fn(async () => ({ error: null })),
  dismissLocalData: vi.fn(() => {}),
});

let mockAuthValue = createDefaultAuth();

export const mockUseAuth = vi.fn(() => mockAuthValue);

export const createMockAuth = (overrides: Partial<MockAuthValue> = {}): MockAuthValue => ({
  ...createDefaultAuth(),
  ...overrides,
});

export const setMockAuth = (overrides: Partial<MockAuthValue> = {}): MockAuthValue => {
  mockAuthValue = createMockAuth(overrides);
  mockUseAuth.mockImplementation(() => mockAuthValue);
  return mockAuthValue;
};

export const resetMockAuth = (): MockAuthValue => setMockAuth();
