import { mangaAssets } from '../lib/manga';

interface SplashScreenProps {
  title?: string;
  subtitle?: string;
}

function RotatingKatana() {
  return (
    <div className="relative flex h-24 w-24 items-center justify-center sm:h-28 sm:w-28" aria-hidden="true">
      <div className="absolute inset-0 rounded-full border border-[var(--app-border)] bg-[rgba(255,255,255,0.24)]" />
      <div className="absolute inset-[9px] rounded-full border border-[var(--app-border)]" />
      <div className="splash-katana-spin relative h-16 w-16 sm:h-20 sm:w-20 origin-center">
        <svg viewBox="0 0 120 120" className="h-full w-full overflow-visible" fill="none">
          <g transform="rotate(-28 60 60)">
            <path d="M58 18L64 18L67 72L55 72L58 18Z" fill="#050505" />
            <path d="M60 13L64 18L58 18L60 13Z" fill="#050505" />
            <rect x="49" y="72" width="22" height="6" fill="#111111" />
            <rect x="56" y="78" width="8" height="22" rx="1" fill="#050505" />
            <path d="M56 100H64L67 108H53L56 100Z" fill="#050505" />
          </g>
        </svg>
      </div>
    </div>
  );
}

export function SplashScreen({ title = 'RONIN', subtitle = 'Opening Ledger' }: SplashScreenProps) {
  return (
    <section className="app-shell relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8" aria-busy="true" aria-live="polite">
      <div
        className="pointer-events-none absolute inset-0 bg-center bg-cover bg-no-repeat opacity-[0.08] mix-blend-multiply"
        style={{ backgroundImage: `url(${mangaAssets.heroKatanaField})` }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.12),transparent_54%)]"
        aria-hidden="true"
      />

      <div className="app-panel ink-overlay relative w-full max-w-[460px] px-6 py-10 text-center sm:px-8 sm:py-12">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(244,241,234,0.97)_0%,rgba(244,241,234,0.88)_100%)]" aria-hidden="true" />
        <div className="relative z-10">
          <p className="app-kicker mb-3">Personal Finance Ledger</p>
          <h1 className="app-wordmark text-[2.7rem] sm:text-[3.2rem]">{title}</h1>
          <div className="mt-7 flex justify-center">
            <RotatingKatana />
          </div>
          <p className="app-kicker mt-7">{subtitle}</p>
          <p className="mt-3 text-sm leading-6 text-[var(--app-text-muted)]">
            Loading your balances, entries, and monthly record.
          </p>
          <span className="sr-only">Loading application</span>
        </div>
      </div>
    </section>
  );
}
