/* eslint-disable @typescript-eslint/no-explicit-any */
import '@testing-library/jest-dom';
import { beforeEach, vi } from 'vitest';
import { mockUseAuth, resetMockAuth } from './mockAuth';

vi.mock('../contexts/AuthContext', async () => {
  const actual = await vi.importActual<typeof import('../contexts/AuthContext')>('../contexts/AuthContext');
  return {
    ...actual,
    useAuth: mockUseAuth,
  };
});

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

// Mock ResizeObserver for Chart.js
(globalThis as any).ResizeObserver = class ResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
};

// Mock HTMLCanvasElement for Chart.js tests
class MockCanvasRenderingContext2D {
  fillRect = vi.fn();
  clearRect = vi.fn();
  getImageData = vi.fn();
  putImageData = vi.fn();
  createImageData = vi.fn();
  setTransform = vi.fn();
  resetTransform = vi.fn();
  drawImage = vi.fn();
  save = vi.fn();
  fillText = vi.fn();
  restore = vi.fn();
  beginPath = vi.fn();
  moveTo = vi.fn();
  lineTo = vi.fn();
  closePath = vi.fn();
  stroke = vi.fn();
  translate = vi.fn();
  scale = vi.fn();
  rotate = vi.fn();
  arc = vi.fn();
  fill = vi.fn();
  measureText = vi.fn(() => ({ width: 0 }));
  transform = vi.fn();
  rect = vi.fn();
  clip = vi.fn();
  canvas = {
    width: 500,
    height: 500,
    style: {},
    getContext: vi.fn(),
    ownerDocument: document,
  };
}

HTMLCanvasElement.prototype.getContext = vi.fn(function(this: HTMLCanvasElement) {
  const ctx = new MockCanvasRenderingContext2D();
  ctx.canvas = this as any;
  return ctx as any;
}) as any;

// Mock canvas dimensions
Object.defineProperty(HTMLCanvasElement.prototype, 'width', {
  get: () => 500,
  set: vi.fn(),
});

Object.defineProperty(HTMLCanvasElement.prototype, 'height', {
  get: () => 500,
  set: vi.fn(),
});

// Clear localStorage before each test
beforeEach(() => {
  localStorageMock.clear();
  resetMockAuth();
});
