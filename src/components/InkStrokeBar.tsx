interface InkStrokeBarProps {
  percent: number;
  minPercent?: number;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
  fillClassName?: string;
  ariaLabel?: string;
  role?: string;
  ariaValueMin?: number;
  ariaValueMax?: number;
  ariaValueNow?: number;
  showGuide?: boolean;
}

function HorizontalBrush() {
  return (
    <svg viewBox="0 0 160 18" preserveAspectRatio="none" className="block h-full w-full" aria-hidden="true">
      <path d="M2 9.8C5.8 6.1 14.8 5.5 26 5c18.6-.8 39.4-.7 61.2-.7 20.8 0 40.9-.2 58.8.8 6 .3 10.4 1.1 12 2.6-2.5 1.2-6.4 2-11.4 2.6-15.9 1.9-33 2.1-49.7 2.3-24.8.3-49.7.5-74.4-.3-8.2-.2-15.2-.9-20.5-2.5Z" fill="currentColor" />
      <path d="M1.5 10.5c4.2.8 9.4 1.1 15.5 1.2 26.6.4 53.2.5 79.8.1 18.7-.2 37.5-.1 56-2 2.3-.2 4.5-.7 6.2-1.3-3.1 2.1-8.5 3.6-15.8 4.3-12.5 1.2-25.3 1.2-38 1.3-26.8.3-53.7.4-80.6-.3-8.6-.2-16.2-.8-23.1-2.1Z" fill="currentColor" opacity="0.88" />
      <path d="M3.8 7.9c2.4-2 5.7-3 10-3.4" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" opacity="0.25" />
      <path d="M149 7.3c3 .4 5.5 1.1 8 2.3-2.3.8-4.9 1.3-7.8 1.8" fill="currentColor" opacity="0.72" />
    </svg>
  );
}

export function InkStrokeBar({
  percent,
  minPercent = 0,
  orientation = 'horizontal',
  className = '',
  fillClassName = '',
  ariaLabel,
  role,
  ariaValueMin,
  ariaValueMax,
  ariaValueNow,
  showGuide = false,
}: InkStrokeBarProps) {
  const clampedPercent = Math.max(0, Math.min(percent, 100));
  const visiblePercent = clampedPercent > 0 ? Math.max(clampedPercent, minPercent) : 0;

  if (orientation === 'vertical') {
    return (
      <div
        className={`relative overflow-hidden ${className}`.trim()}
        aria-label={ariaLabel}
        role={role}
        aria-valuemin={ariaValueMin}
        aria-valuemax={ariaValueMax}
        aria-valuenow={ariaValueNow}
      >
        {showGuide ? <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-black/10" aria-hidden="true" /> : null}
        <div className={`absolute inset-x-0 bottom-0 bg-[var(--color-black)] ${fillClassName}`.trim()} style={{ height: `${visiblePercent}%` }} />
      </div>
    );
  }

  return (
    <div className={`relative overflow-visible ${className}`.trim()}>
      {showGuide ? <div className="pointer-events-none absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-black/10" aria-hidden="true" /> : null}
      <div
        className={`absolute inset-y-0 left-0 overflow-visible text-[var(--color-black)] ${fillClassName}`.trim()}
        style={{ width: `${visiblePercent}%` }}
        aria-label={ariaLabel}
        role={role}
        aria-valuemin={ariaValueMin}
        aria-valuemax={ariaValueMax}
        aria-valuenow={ariaValueNow}
      >
        <HorizontalBrush />
      </div>
    </div>
  );
}
