import { useEffect, useRef, useState } from "react";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";

const Login = () => {
  const {
    token,
    error,
    isFedCMAvailable,
    isOneTapAvailable,
    isGoogleScriptLoaded,
    isFedCMAuthenticating,
    hasAttemptedAutoLogin,
    signInWithFedCM,
    signInWithOneTap,
    startOAuthPkce,
    signInWithOAuth,
    renderGoogleButton, // ← クリック起点のGSIボタン描画
    clear,
  } = useGoogleAuth();

  const AvailabilityBadge = ({ label, available }: { label: string; available: boolean }) => (
    <span
      className={`text-xs px-2 py-1 rounded-full border ${
        available
          ? 'bg-green-50 text-green-700 border-green-200'
          : 'bg-gray-50 text-gray-600 border-gray-200'
      }`}
    >
      {label}: {available ? 'available' : 'unavailable'}
    </span>
  );

  // Exchange the Google ID token with your backend to establish an app session (HttpOnly cookies recommended)
  const [isExchanging, setIsExchanging] = useState(false);
  const [exchangeError, setExchangeError] = useState<string | null>(null);
  useEffect(() => {
    const exchange = async (idToken: string) => {
      setIsExchanging(true);
      setExchangeError(null);
      try {
        const res = await fetch('/api/auth/google', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ id_token: idToken }),
        });
        if (!res.ok) {
          const t = await res.text().catch(() => '');
          throw new Error(t || `Exchange failed: ${res.status}`);
        }
      } catch (e) {
        setExchangeError(e instanceof Error ? e.message : 'Failed to exchange ID token');
      } finally {
        setIsExchanging(false);
      }
    };
    if (token) exchange(token);
  }, [token]);

  // Render the official GSI button on demand (works in environments where One Tap UI is suppressed)
  const googleBtnRef = useRef<HTMLDivElement | null>(null);
  const renderedRef = useRef(false);
  useEffect(() => {
    if (!renderedRef.current && isGoogleScriptLoaded && isOneTapAvailable && googleBtnRef.current) {
      renderGoogleButton(googleBtnRef.current, { size: 'large', theme: 'filled_blue' });
      renderedRef.current = true;
    }
  }, [isGoogleScriptLoaded, isOneTapAvailable, renderGoogleButton]);

  const smartSignIn = async () => {
    // Prefer FedCM active → One Tap → PKCE. Each step is user-initiated, so UI policies are respected.
    if (isFedCMAvailable && !isFedCMAuthenticating) {
      try { await signInWithFedCM('active'); return; } catch {/* fallthrough */}
    }
    if (isOneTapAvailable) {
      signInWithOneTap();
      return;
    }
    await startOAuthPkce();
  };

  return (
    <div className="flex flex-col gap-4 items-start">
      <div className="text-sm text-gray-800 font-medium">Login</div>

      <div className="flex gap-2 items-center flex-wrap">
        <AvailabilityBadge label="FedCM" available={isFedCMAvailable} />
        <AvailabilityBadge label="One Tap" available={isOneTapAvailable} />
        <AvailabilityBadge label="GSI Script" available={isGoogleScriptLoaded} />
      </div>

      <div className="text-sm text-gray-600">
        {token ? 'Authenticated with Google (ID token acquired).' : 'Not authenticated.'}
      </div>
      {error && <div className="text-sm text-red-600">GSI/FedCM: {error}</div>}
      {exchangeError && <div className="text-sm text-red-600">Exchange: {exchangeError}</div>}
      {isExchanging && <div className="text-sm text-gray-600">Exchanging token…</div>}

      <div className="flex flex-col gap-2">
        <button
          className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
          onClick={smartSignIn}
          disabled={isFedCMAuthenticating}
        >
          {isFedCMAuthenticating ? 'Signing in…' : 'Sign in with Google (Smart)'}
        </button>

        <div className="flex gap-2 flex-wrap items-center">
          <button
            className="px-3 py-2 rounded bg-black text-white disabled:opacity-50"
            onClick={() => signInWithFedCM('active')}
            disabled={!isFedCMAvailable || isFedCMAuthenticating}
            title={isFedCMAvailable ? 'Use FedCM' : 'FedCM not available in this browser'}
          >
            Sign in with Google (FedCM)
          </button>

          <button
            className="px-3 py-2 rounded border border-gray-300 disabled:opacity-50"
            onClick={signInWithOneTap}
            disabled={!isOneTapAvailable}
            title={isOneTapAvailable ? 'Use One Tap' : 'One Tap not available'}
          >
            Sign in with Google (One Tap)
          </button>

          <div ref={googleBtnRef} className="inline-block" title="Google Sign-In button will appear here" />

          <button className="px-3 py-2 rounded border border-gray-300" onClick={() => startOAuthPkce()}>
            Continue with Google (PKCE)
          </button>

          <button className="px-3 py-2 rounded border border-gray-300" onClick={signInWithOAuth}>
            Legacy Implicit Flow
          </button>

          <button className="px-3 py-2 rounded border border-gray-300" onClick={clear}>
            Clear
          </button>
        </div>
      </div>

      <div className="text-xs text-gray-500">
        Auto attempt: {hasAttemptedAutoLogin ? 'done' : 'pending'} | FedCM: {String(isFedCMAvailable)} | One Tap: {String(isOneTapAvailable)}
      </div>
    </div>
  );
};

export default Login;