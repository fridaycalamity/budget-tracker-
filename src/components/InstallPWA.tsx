import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISSED_KEY = 'pwa_install_dismissed_until';
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

function isStandaloneApp(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    ('standalone' in navigator && (navigator as Navigator & { standalone?: boolean }).standalone === true);
}

function isIosDevice(): boolean {
  const userAgent = navigator.userAgent || '';
  return /iPad|iPhone|iPod/i.test(userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function isTemporarilyDismissed(): boolean {
  const dismissedUntil = Number(localStorage.getItem(DISMISSED_KEY));
  if (!Number.isFinite(dismissedUntil)) {
    localStorage.removeItem(DISMISSED_KEY);
    return false;
  }

  if (Date.now() < dismissedUntil) return true;
  localStorage.removeItem(DISMISSED_KEY);
  return false;
}

export function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIosInstallGuide, setIsIosInstallGuide] = useState(false);
  const [canShowInstallLauncher, setCanShowInstallLauncher] = useState(false);

  useEffect(() => {
    if (isStandaloneApp()) return;

    if (isIosDevice()) {
      setIsIosInstallGuide(true);
      setCanShowInstallLauncher(true);
      setShowBanner(!isTemporarilyDismissed());
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsIosInstallGuide(false);
      setCanShowInstallLauncher(true);
      if (!isTemporarilyDismissed()) setShowBanner(true);
    };

    const handleInstalled = () => {
      setShowBanner(false);
      setDeferredPrompt(null);
      setCanShowInstallLauncher(false);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', handleInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', handleInstalled);
    };
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
    localStorage.setItem(DISMISSED_KEY, String(Date.now() + DISMISS_DURATION_MS));
  };

  if (!showBanner) {
    if (!canShowInstallLauncher) return null;

    return (
      <button
        type="button"
        onClick={() => {
          if (!deferredPrompt) setIsIosInstallGuide(true);
          setShowBanner(true);
        }}
        className="fixed bottom-24 right-3 z-50 min-h-[42px] border border-[var(--app-border-strong)] bg-[var(--app-surface)] px-3 text-[11px] font-black uppercase tracking-[0.16em] text-[var(--app-text)] shadow-[0_12px_28px_rgba(0,0,0,0.18)] lg:bottom-6"
        aria-label="Show app install instructions"
      >
        Install App
      </button>
    );
  }

  return (
    <div className="fixed inset-x-3 bottom-24 z-50 lg:inset-x-auto lg:bottom-6 lg:right-6 lg:w-[380px]">
      <div className="app-panel-dark p-4 text-white shadow-[0_18px_42px_rgba(0,0,0,0.28)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.18em] text-white/70">Install RONIN</div>
            <p className="mt-2 text-sm leading-6">
              {isIosInstallGuide
                ? 'Add RONIN to your iPhone home screen for an app-like ledger experience.'
                : 'Install RONIN for a faster ledger experience and better offline support.'}
            </p>
          </div>
          <button onClick={handleDismiss} className="flex h-10 w-10 shrink-0 items-center justify-center border border-white/20" aria-label="Dismiss install prompt">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {isIosInstallGuide ? (
          <div className="mt-4 border border-white/14 bg-black/30 p-3 text-xs leading-5 text-white/78">
            Tap <span className="font-black text-white">Share</span> in Safari, then choose <span className="font-black text-white">Add to Home Screen</span>. In Chrome on iPhone, open the page in Safari first if that option is unavailable.
          </div>
        ) : (
          <button onClick={handleInstall} className="mt-4 app-button-primary w-full px-4 text-sm text-white">
            Install RONIN
          </button>
        )}
      </div>
    </div>
  );
}
