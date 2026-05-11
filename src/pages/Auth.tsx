import { useState, useEffect } from 'react';

const LOGIN_SPLASH_DELAY_MS = 2200;

function isGoogleOAuthBlockedBrowser(): boolean {
  if (typeof navigator === 'undefined') return false;

  const userAgent = navigator.userAgent || '';
  return /FBAN|FBAV|FBIOS|FB_IAB|Messenger|Instagram|Line\/|MicroMessenger/i.test(userAgent);
}

function getCurrentAppUrl(): string {
  if (typeof window === 'undefined') return '';
  return window.location.href;
}

import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { mangaAssets } from '../lib/manga';
import { LoadingSpinner, SplashScreen } from '../components';

export function Auth() {
  const { user, loading, signIn, signUp, signInWithGoogle } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showLoginSplash, setShowLoginSplash] = useState(false);
  const [canRedirectAfterLogin, setCanRedirectAfterLogin] = useState(false);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
  const isOAuthBlockedBrowser = isGoogleOAuthBlockedBrowser();

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!user || !showLoginSplash) return;

    const timeoutId = window.setTimeout(() => {
      setCanRedirectAfterLogin(true);
    }, LOGIN_SPLASH_DELAY_MS);

    return () => window.clearTimeout(timeoutId);
  }, [user, showLoginSplash]);

  useEffect(() => {
    if (!user) {
      setShowLoginSplash(false);
      setCanRedirectAfterLogin(false);
    }
  }, [user]);

  if (!loading && user && showLoginSplash && !canRedirectAfterLogin) {
    return <SplashScreen subtitle="Entering Ledger" />;
  }

  if (!loading && user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!email.trim() || !password) return setError('Please fill in all fields.');
    if (isOffline) return setError('Connect to internet to sign in.');
    if (isSignUp && password !== confirmPassword) return setError('Passwords do not match.');
    if (isSignUp && password.length < 6) return setError('Password must be at least 6 characters.');

    setSubmitting(true);
    if (isSignUp) {
      const { error: signUpError } = await signUp(email.trim(), password);
      if (signUpError) setError(signUpError);
      else setMessage('Check your email for a confirmation link to complete sign up.');
    } else {
      const { error: signInError } = await signIn(email.trim(), password);
      if (signInError) setError(signInError);
      else {
        setShowLoginSplash(true);
        setCanRedirectAfterLogin(false);
      }
    }
    setSubmitting(false);
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setCopyMessage(null);
    if (isOffline) return setError('Connect to internet to sign in.');
    if (isOAuthBlockedBrowser) {
      return setError('Google blocks sign-in inside Messenger, Facebook, Instagram, and other in-app browsers. Open RONIN in Safari or your installed home-screen app, then continue with Google.');
    }
    const { error: googleError } = await signInWithGoogle();
    if (googleError) setError(googleError);
  };

  const handleCopyAppLink = async () => {
    const appUrl = getCurrentAppUrl();
    setCopyMessage(null);

    try {
      await navigator.clipboard.writeText(appUrl);
      setCopyMessage('App link copied. Open Safari and paste it there to use Google sign-in.');
    } catch {
      setCopyMessage(`Open this link in Safari: ${appUrl}`);
    }
  };

  if (loading) {
    return <SplashScreen subtitle="Opening Ledger" />;
  }

  const inputClass = 'app-input w-full border border-white/20 bg-[rgba(255,255,255,0.94)] px-4 py-3 text-[var(--color-black)] placeholder:text-[var(--color-mid-gray)]';
  const labelClass = 'mb-2 block text-[11px] font-black uppercase tracking-[0.14em] text-white/78';

  return (
    <div className="app-shell relative min-h-screen overflow-hidden px-4 py-8 sm:py-10 lg:px-8">
      <div
        className="pointer-events-none absolute inset-0 bg-right-bottom bg-contain bg-no-repeat opacity-[0.14] mix-blend-multiply"
        style={{ backgroundImage: `url(${mangaAssets.emptyStateLoneSamurai})` }}
        aria-hidden="true"
      />
      <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-6 lg:grid-cols-[1fr_460px]">
        <section className="hidden lg:block">
          <div className="max-w-xl">
            <p className="app-kicker mb-3">Personal Finance Ledger</p>
            <h1 className="app-wordmark text-[3.1rem] sm:text-[3.6rem]">RONIN</h1>
            <p className="mt-4 text-base leading-7 text-[var(--app-text-muted)]">
              Enter a world of disciplined records, source-aware balances, and sharp monthly reflection. Keep every peso accounted for.
            </p>
            <div className="mt-8 border border-[var(--app-border-strong)] p-5">
              <div className="font-[var(--font-display)] text-2xl uppercase leading-none">Control Your Money</div>
              <div className="mt-1 font-[var(--font-display)] text-2xl uppercase leading-none">Or It Controls You.</div>
            </div>
          </div>
        </section>

        <section className="app-panel-dark mx-auto w-full max-w-[460px] overflow-hidden">
          <div
            className="pointer-events-none absolute inset-0 bg-center bg-cover bg-no-repeat opacity-[0.5] mix-blend-screen"
            style={{ backgroundImage: `url(${mangaAssets.inkMountains})` }}
            aria-hidden="true"
          />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_72%,rgba(255,255,255,0.06),transparent_46%)]" aria-hidden="true" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,5,0.92)_0%,rgba(5,5,5,0.72)_22%,rgba(5,5,5,0.36)_46%,rgba(5,5,5,0.52)_72%,rgba(5,5,5,0.9)_100%)]" aria-hidden="true" />

          <div className="relative flex h-full flex-col px-5 py-6 sm:px-6 sm:py-7">
            <div className="relative z-10 border-b border-white/14 pb-5 text-white">
              <p className="text-[10px] uppercase tracking-[0.28em] text-white/60">{isSignUp ? 'Create Account' : 'Sign In'}</p>
              <div className="mt-3 font-[var(--font-display)] text-[2.1rem] uppercase leading-[0.92] tracking-[-0.05em]">{isSignUp ? 'Enter The Ledger' : 'Return To The Ledger'}</div>
              <p className="mt-3 max-w-[28rem] text-sm leading-6 text-white/72">
                {isSignUp ? 'Create your account and confirm your email.' : 'Sign in to continue tracking balances and entries.'}
              </p>
            </div>

            <div className="relative z-10 mt-5 space-y-3">
              {isOffline && (
                <div className="border border-white/18 bg-black/32 px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-white">
                  Offline Mode — Connect to internet to sign in.
                </div>
              )}

              {isOAuthBlockedBrowser && (
                <div className="border border-white/18 bg-black/42 px-4 py-3 text-sm text-white">
                  <div className="font-black uppercase tracking-[0.12em]">Open In Safari</div>
                  <p className="mt-2 text-white/72">
                    Google sign-in is blocked inside Messenger and other in-app browsers on iPhone. Open RONIN in Safari or from your home screen, then continue with Google.
                  </p>
                  <button
                    type="button"
                    onClick={handleCopyAppLink}
                    className="mt-3 min-h-[40px] border border-white/50 px-3 text-xs font-black uppercase tracking-[0.14em] text-white transition hover:bg-white hover:text-black"
                  >
                    Copy App Link
                  </button>
                  {copyMessage && <p className="mt-2 text-xs leading-5 text-white/64">{copyMessage}</p>}
                </div>
              )}

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isOffline || isOAuthBlockedBrowser}
                className="flex min-h-[44px] w-full items-center justify-center gap-3 border border-white bg-white px-4 text-sm font-extrabold uppercase tracking-[0.12em] text-black transition hover:bg-transparent hover:text-white disabled:opacity-50"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#111111" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#777777" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#D8D8D8" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#050505" />
                </svg>
                Continue with Google
              </button>

              <div className="relative my-3">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/18" /></div>
                <div className="relative flex justify-center text-xs uppercase tracking-[0.18em]">
                  <span className="bg-[rgba(5,5,5,0.82)] px-3 text-white/72">Or Continue With Email</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 border border-white/16 bg-black/32 p-4 sm:p-5">
                <div>
                  <label htmlFor="email" className={labelClass}>Email</label>
                  <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="you@example.com" autoComplete="email" />
                </div>
                <div>
                  <label htmlFor="password" className={labelClass}>Password</label>
                  <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} placeholder={isSignUp ? 'At least 6 characters' : 'Your password'} autoComplete={isSignUp ? 'new-password' : 'current-password'} />
                </div>
                {isSignUp && (
                  <div>
                    <label htmlFor="confirmPassword" className={labelClass}>Confirm Password</label>
                    <input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={inputClass} placeholder="Re-enter your password" autoComplete="new-password" />
                  </div>
                )}

                {error && (
                  <div className="border border-white/18 bg-[rgba(255,255,255,0.18)] px-4 py-3 text-sm text-white">
                    <div className="font-black uppercase tracking-[0.12em]">Sign-In Failed</div>
                    <p className="mt-1 text-white/72">{error}</p>
                  </div>
                )}
                {message && (
                  <div className="border border-white/18 bg-[rgba(255,255,255,0.18)] px-4 py-3 text-sm text-white">
                    <div className="font-black uppercase tracking-[0.12em]">Next Step</div>
                    <p className="mt-1 text-white/72">{message}</p>
                  </div>
                )}

                <button type="submit" disabled={submitting || isOffline} className="app-button-primary w-full px-4 text-white disabled:opacity-50">
                  {submitting ? (
                    <span className="inline-flex items-center justify-center gap-2">
                      <LoadingSpinner size="sm" className="border-white border-t-transparent" />
                      {isSignUp ? 'Creating Account...' : 'Signing In...'}
                    </span>
                  ) : isSignUp ? 'Create Account' : 'Sign In'}
                </button>
              </form>
            </div>

            <p className="relative z-10 mt-6 text-center text-sm text-white/72">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError(null);
                  setMessage(null);
                  setConfirmPassword('');
                }}
                className="font-black uppercase tracking-[0.08em] text-white underline underline-offset-4"
              >
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </button>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
