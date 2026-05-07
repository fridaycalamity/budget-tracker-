import { useEffect, useState } from 'react';
import type { Toast as ToastType } from '../types';

interface ToastProps {
  toast: ToastType;
  onRemove: (id: string) => void;
}

export function Toast({ toast, onRemove }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onRemove(toast.id), 300);
  };

  const toneClass = toast.type === 'success' ? 'bg-green-500' : 'bg-red-500';
  const icon = toast.type === 'success' ? '✓' : '✕';

  return (
    <div
      className={`app-panel-dark ${toneClass} flex items-start gap-3 px-4 py-3 transition-all duration-300 ease-in-out ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'}`}
      role="alert"
      aria-live="polite"
    >
      <div className="app-stamp bg-white text-black">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-white/70">Notification</p>
        <p className="mt-1 text-sm text-white">{toast.message}</p>
      </div>
      <button onClick={handleClose} className="inline-flex h-10 w-10 items-center justify-center border border-white/20" aria-label="Close notification">
        ×
      </button>
    </div>
  );
}
