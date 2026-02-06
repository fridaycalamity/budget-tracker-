import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Toast, ToastContextValue } from '../types';

// Create the context
const ToastContext = createContext<ToastContextValue | undefined>(undefined);

// Provider props
interface ToastProviderProps {
  children: ReactNode;
}

/**
 * ToastProvider component
 * Manages toast notification queue with auto-dismiss functionality
 */
export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  /**
   * Remove a toast by ID
   */
  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  /**
   * Show a new toast notification
   * Automatically dismisses after specified duration (default: 3000ms)
   */
  const showToast = useCallback((message: string, type: 'success' | 'error', duration = 3000) => {
    const id = uuidv4();
    const newToast: Toast = {
      id,
      message,
      type,
      duration,
    };

    // Add toast to queue
    setToasts((prev) => [...prev, newToast]);

    // Auto-dismiss after duration
    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, [removeToast]);

  const value: ToastContextValue = {
    toasts,
    showToast,
    removeToast,
  };

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

/**
 * Custom hook to use the toast context
 * Throws error if used outside ToastProvider
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
