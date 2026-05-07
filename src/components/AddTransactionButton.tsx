import { useEffect, useState } from 'react';
import { TransactionModal } from './TransactionModal';

export function AddTransactionButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const open = () => setIsModalOpen(true);
    window.addEventListener('open-add-transaction', open as EventListener);
    return () => window.removeEventListener('open-add-transaction', open as EventListener);
  }, []);

  const handleClick = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);
  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsModalOpen(true);
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className="fixed bottom-[74px] left-1/2 z-40 flex h-[60px] w-[60px] -translate-x-1/2 items-center justify-center rounded-full border-[3px] border-[var(--color-black)] bg-[var(--color-paper)] text-[var(--color-black)] shadow-none transition-transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-[var(--app-border-strong)] sm:bottom-6 sm:left-auto sm:right-6 sm:translate-x-0 lg:bottom-8 lg:right-8"
        aria-label="Add new transaction"
        title="Add transaction"
        type="button"
      >
        <span className="pointer-events-none absolute inset-[6px] rounded-full border border-[var(--app-border)]" aria-hidden="true" />
        <svg className="relative h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 5v14m7-7H5" />
        </svg>
      </button>

      <TransactionModal isOpen={isModalOpen} onClose={handleCloseModal} />
    </>
  );
}
