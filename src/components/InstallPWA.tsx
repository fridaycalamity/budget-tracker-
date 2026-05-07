import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISSED_KEY = 'pwa_install_dismissed';

export function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(DISMISSED_KEY)) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setShowBanner(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setDeferredPrompt(null);
    localStorage.setItem(DISMISSED_KEY, 'true');
  };

  if (!showBanner) return null;

  return (
    <div className="fixed inset-x-3 bottom-24 z-50 lg:inset-x-auto lg:bottom-6 lg:right-6 lg:w-[360px]">
      <div className="app-panel-dark p-4 text-white shadow-[0_18px_42px_rgba(0,0,0,0.28)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.18em] text-white/70">Install App</div>
            <p className="mt-2 text-sm leading-6">Install Budget Tracker for a faster ledger experience and better offline support.</p>
          </div>
          <button onClick={handleDismiss} className="flex h-10 w-10 items-center justify-center border border-white/20" aria-label="Dismiss install prompt">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <button onClick={handleInstall} className="mt-4 app-button-primary w-full px-4 text-sm text-white">
          Install Budget Tracker
        </button>
      </div>
    </div>
  );
}
