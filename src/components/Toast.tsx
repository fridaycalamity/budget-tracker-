import { useEffect, useState } from 'react';
import type { Toast as ToastType } from '../types';

interface ToastProps {
  toast: ToastType;
  onRemove: (id: string) => void;
}

/**
 * Toast component
 * Displays a temporary notification message with smooth animations
 */
export function Toast({ toast, onRemove }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);

  // Trigger enter animation on mount
  useEffect(() => {
    // Small delay to ensure CSS transition works
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  // Handle close button click
  const handleClose = () => {
    setIsVisible(false);
    // Wait for exit animation before removing
    setTimeout(() => onRemove(toast.id), 300);
  };

  // Determine colors based on toast type
  const bgColor = toast.type === 'success' 
    ? 'bg-green-500 dark:bg-green-600' 
    : 'bg-red-500 dark:bg-red-600';
  
  const icon = toast.type === 'success' ? '✓' : '✕';

  return (
    <div
      className={`
        flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-white
        transition-all duration-300 ease-in-out
        ${bgColor}
        ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'}
      `}
      role="alert"
      aria-live="polite"
    >
      {/* Icon */}
      <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-white bg-opacity-20 font-bold">
        {icon}
      </div>

      {/* Message */}
      <p className="flex-1 text-sm font-medium">{toast.message}</p>

      {/* Close button */}
      <button
        onClick={handleClose}
        className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded hover:bg-white hover:bg-opacity-20 transition-colors"
        aria-label="Close notification"
      >
        ×
      </button>
    </div>
  );
}
