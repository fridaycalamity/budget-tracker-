import { useMemo, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { mangaAssets } from '../lib/manga';

function DashboardIcon() { return <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="M4 13h6v7H4zM14 4h6v16h-6zM4 4h6v6H4zM14 14h6v6h-6z" /></svg>; }
function LedgerIcon() { return <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="M7 4h10a2 2 0 012 2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V6a2 2 0 012-2z" /><path d="M9 8h6M9 12h6M9 16h4" /></svg>; }
function BudgetIcon() { return <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="M4 12h16" /><path d="M4 6h16" /><path d="M4 18h10" /></svg>; }
function SubscriptionIcon() { return <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="M7 4h10l2 4-2 4H7L5 8z" /><path d="M7 12v8" /><path d="M17 12v8" /></svg>; }
function SettingsIcon() { return <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="M12 8.5A3.5 3.5 0 1012 15.5 3.5 3.5 0 1012 8.5z" /><path d="M19.4 15a1 1 0 00.2 1.1l.1.1a2 2 0 01-2.8 2.8l-.1-.1a1 1 0 00-1.1-.2 1 1 0 00-.6.9V20a2 2 0 01-4 0v-.1a1 1 0 00-.7-.9 1 1 0 00-1.1.2l-.1.1a2 2 0 01-2.8-2.8l.1-.1a1 1 0 00.2-1.1 1 1 0 00-.9-.6H4a2 2 0 010-4h.1a1 1 0 00.9-.7 1 1 0 00-.2-1.1l-.1-.1a2 2 0 012.8-2.8l.1.1a1 1 0 001.1.2 1 1 0 00.6-.9V4a2 2 0 014 0v.1a1 1 0 00.7.9 1 1 0 001.1-.2l.1-.1a2 2 0 012.8 2.8l-.1.1a1 1 0 00-.2 1.1 1 1 0 00.9.6H20a2 2 0 010 4h-.1a1 1 0 00-.9.7z" /></svg>; }

const navItems = [
  { to: '/', label: 'Dashboard', subtitle: 'Overview', icon: DashboardIcon },
  { to: '/transactions', label: 'Transactions', subtitle: 'Ledger', icon: LedgerIcon },
  { to: '/budget-goals', label: 'Budget Goals', subtitle: 'Limits', icon: BudgetIcon },
  { to: '/subscriptions', label: 'Subscriptions', subtitle: 'Recurring', icon: SubscriptionIcon },
  { to: '/settings', label: 'Settings', subtitle: 'Sources', icon: SettingsIcon },
] as const;

export function Header() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const currentLabel = useMemo(() => navItems.find((item) => (item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to)))?.label ?? 'RONIN', [location.pathname]);
  const handleSignOut = async () => { setIsMobileMenuOpen(false); await signOut(); };
  const avatarLabel = user?.email?.charAt(0).toUpperCase() || 'W';
  const avatarImage = !avatarFailed ? mangaAssets.wandererAvatar : null;

  return (
    <>
      <aside className="app-panel-dark fixed inset-y-0 left-0 z-30 hidden w-[272px] overflow-hidden lg:flex lg:flex-col">
        <div className="pointer-events-none absolute inset-0 bg-center bg-cover bg-no-repeat opacity-[0.5] mix-blend-screen" style={{ backgroundImage: `url(${mangaAssets.sidebarSamuraiStanding})` }} aria-hidden="true" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_72%,rgba(255,255,255,0.06),transparent_46%)]" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,5,0.92)_0%,rgba(5,5,5,0.72)_22%,rgba(5,5,5,0.36)_46%,rgba(5,5,5,0.52)_72%,rgba(5,5,5,0.9)_100%)]" aria-hidden="true" />
        <div className="relative flex h-full flex-col px-5 py-6">
          <div className="relative z-10 border-b border-white/14 pb-6">
            <p className="app-brand-kicker text-white/60">Personal Finance Ledger</p>
            <Link to="/" className="mt-3 block text-white">
              <div className="app-wordmark text-[2.35rem]">RONIN<span className="sr-only">Budget Tracker</span></div>
            </Link>
          </div>

          <nav className="relative z-10 mt-5 space-y-1.5" aria-label="Primary">
            {navItems.map(({ to, label, subtitle, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) => `group grid grid-cols-[18px_1fr] items-center gap-3 px-3 py-3 transition ${isActive ? 'bg-white text-black' : 'text-white hover:bg-white/8'}`}
              >
                <Icon />
                <span className="min-w-0">
                  <span className="block text-sm font-extrabold uppercase tracking-[0.11em]">{label}</span>
                  <span className="block text-[10px] uppercase tracking-[0.18em] opacity-60">{subtitle}</span>
                </span>
              </NavLink>
            ))}
          </nav>

          <div className="relative z-10 mt-auto pt-8 text-white">
            <div className="space-y-4">
              <div className="max-w-[165px] font-[var(--font-display)] text-[0.92rem] uppercase leading-tight tracking-[0.03em]">Control your money<br />or it controls you.</div>
              {user && (
                <div className="border border-white/16 bg-black/32 p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/35 bg-black/30 text-xs font-black uppercase">
                      {avatarImage ? <img src={avatarImage} alt="Wanderer avatar" className="h-full w-full object-cover grayscale" onError={() => setAvatarFailed(true)} /> : avatarLabel}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] uppercase tracking-[0.2em] text-white/60">Wanderer</div>
                      <div className="mt-1 truncate text-sm font-medium">{user.email}</div>
                    </div>
                  </div>
                  <button type="button" onClick={handleSignOut} className="mt-3 w-full border border-white px-3 py-2 text-xs font-extrabold uppercase tracking-[0.14em] transition hover:bg-white hover:text-black">Sign Out</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      <div className="app-panel fixed inset-x-0 top-0 z-30 border-x-0 border-t-0 px-3 lg:hidden">
        <div className="grid h-[58px] grid-cols-[44px_1fr_44px] items-center gap-2">
          <button type="button" onClick={() => setIsMobileMenuOpen((open) => !open)} className="flex h-11 w-11 items-center justify-center" aria-expanded={isMobileMenuOpen} aria-label="Toggle navigation menu">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
          </button>
          <div className="text-center">
            <div className="app-wordmark text-[1.42rem]">RONIN<span className="sr-only">Budget Tracker</span></div>
            <div className="mt-0.5 text-[10px] uppercase tracking-[0.24em] text-[var(--app-text-muted)]">{currentLabel}</div>
          </div>
          <div className="ml-auto flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-[var(--app-border-strong)] bg-[var(--color-paper)] text-xs font-black uppercase shadow-[3px_3px_0_var(--color-black)]">
            {avatarImage ? <img src={avatarImage} alt="Wanderer avatar" className="h-full w-full object-cover grayscale" onError={() => setAvatarFailed(true)} /> : avatarLabel}
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true">
          <button type="button" className="absolute inset-0 bg-black/45" aria-label="Close navigation menu" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="app-panel-dark relative h-full w-[88%] max-w-[360px] overflow-hidden p-5 text-white sm:w-[84%] sm:max-w-[320px]">
            <div className="pointer-events-none absolute inset-0 bg-[center_bottom_18%] bg-cover bg-no-repeat opacity-[0.48] mix-blend-screen" style={{ backgroundImage: `url(${mangaAssets.sidebarSamuraiStanding})` }} aria-hidden="true" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_48%_62%,rgba(255,255,255,0.08),transparent_44%)]" aria-hidden="true" />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,5,0.94)_0%,rgba(5,5,5,0.78)_24%,rgba(5,5,5,0.48)_52%,rgba(5,5,5,0.72)_78%,rgba(5,5,5,0.94)_100%)]" aria-hidden="true" />
            <div className="relative z-10 flex items-center justify-between border-b border-white/14 pb-4">
              <div>
                <div className="app-wordmark text-2xl">RONIN<span className="sr-only">Budget Tracker</span></div>
                <div className="app-brand-kicker mt-1 text-white/70">Personal Finance Ledger</div>
              </div>
              <button type="button" onClick={() => setIsMobileMenuOpen(false)} className="flex h-11 w-11 items-center justify-center border border-white/25 bg-black/20" aria-label="Close menu"><svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 6l12 12M18 6L6 18" /></svg></button>
            </div>
            <nav className="relative z-10 mt-6 space-y-1.5">
              {navItems.map(({ to, label, subtitle, icon: Icon }) => (
                <NavLink key={to} to={to} end={to === '/'} onClick={() => setIsMobileMenuOpen(false)} className={({ isActive }) => `grid grid-cols-[18px_1fr] items-center gap-3 px-3 py-3 transition ${isActive ? 'bg-white text-black' : 'text-white hover:bg-white/8'}`}>
                  <Icon />
                  <span><span className="block text-sm font-extrabold uppercase tracking-[0.08em]">{label}</span><span className="block text-[10px] uppercase tracking-[0.18em] opacity-75">{subtitle}</span></span>
                </NavLink>
              ))}
            </nav>
            {user && <div className="relative z-10 mt-8 border border-white/22 bg-black/34 p-3"><div className="flex items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/35 bg-black/30 text-xs font-black uppercase">{avatarImage ? <img src={avatarImage} alt="Wanderer avatar" className="h-full w-full object-cover grayscale" onError={() => setAvatarFailed(true)} /> : avatarLabel}</div><div className="min-w-0"><div className="text-[10px] uppercase tracking-[0.18em] text-white/70">Signed In</div><div className="mt-1 truncate text-sm">{user.email}</div></div></div><button type="button" onClick={handleSignOut} className="mt-3 w-full border border-white px-3 py-2 text-xs font-extrabold uppercase tracking-[0.14em] transition hover:bg-white hover:text-black">Sign Out</button></div>}
          </div>
        </div>
      )}

      <nav className="app-panel-dark fixed inset-x-0 bottom-0 z-30 grid h-[72px] grid-cols-4 border-x-0 border-b-0 border-t px-1.5 lg:hidden" aria-label="Bottom Navigation">
        {navItems.slice(0, 4).map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `flex min-w-0 flex-col items-center justify-center gap-1 px-1 text-center text-[8.5px] font-black uppercase leading-tight tracking-[0.06em] sm:text-[9px] sm:tracking-[0.1em] ${isActive ? 'text-white' : 'text-white/58'}`}>
            <Icon />
            <span className="block max-w-full truncate">{label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
}
