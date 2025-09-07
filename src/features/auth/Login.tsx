import { useEffect, useMemo, useRef, useState } from "react";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";

const StatusBadge = ({
  label,
  active,
  on,
}: {
  label: string;
  active?: boolean;
  on?: boolean;
}) => {
  const color =
    active ?? on
      ? "bg-green-50 text-green-700 border-green-200"
      : "bg-gray-50 text-gray-600 border-gray-200";
  return (
    <span className={`text-xs px-2 py-1 rounded-full border ${color}`}>
      {label}: {active ?? on ? "available" : "unavailable"}
    </span>
  );
};

const Login = () => {
  const {
    token,
    error,
    isFedCMAvailable,
    isOneTapAvailable,
    isGoogleScriptLoaded,
    isFedCMAuthenticating,
    isOneTapAuthenticating,
    hasAttemptedAutoLogin,

    clear,
    signInWithOneTap,
    signInWithFedCM,
    startOAuthPkce,
    signInWithOAuth,
    renderGoogleButton,
  } = useGoogleAuth();

  // Exchange the Google ID token with your backend (HttpOnly cookies recommended)
  const [isExchanging, setIsExchanging] = useState(false);
  const [exchangeError, setExchangeError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);

  const [logs, setLogs] = useState<string[]>([]);
  const addLog = (m: string) => {
    setLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${m}`, ...prev].slice(0, 12));
  };

  // render GSI visible button once
  const gsiContainerRef = useRef<HTMLDivElement | null>(null);
  const gsiRenderedRef = useRef(false);

  useEffect(() => {
    if (isGoogleScriptLoaded && gsiContainerRef.current && !gsiRenderedRef.current) {
      try {
        renderGoogleButton(gsiContainerRef.current, { size: "large", width: 320 });
        gsiRenderedRef.current = true;
        addLog("GSI button rendered");
      } catch {
        addLog("GSI button render failed; showing PKCE fallback");
      }
    }
  }, [isGoogleScriptLoaded, renderGoogleButton]);

  // exchange guard: only once per unique token
  const lastExchangedRef = useRef<string | null>(null);
  useEffect(() => {
    const exchange = async (idToken: string) => {
      setIsExchanging(true);
      setExchangeError(null);
      setHint(null);
      addLog("Starting token exchange with backend...");
      try {
        const res = await fetch("/api/auth/google", {
          method: "POST",
          headers: { "content-type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ id_token: idToken }),
        });
        if (!res.ok) {
          const t = await res.text().catch(() => "");
          throw new Error(t || `Exchange failed: ${res.status}`);
        }
        addLog("Token exchange successful");
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to exchange ID token";
        setExchangeError(msg);
        addLog(`Token exchange failed: ${msg}`);
        // Helpful hints
        if (/origin.+not allowed/i.test(msg)) {
          setHint(
            "Google OAuth client is not configured for this origin. Add this origin to Authorized JavaScript origins and set the correct redirect URI in Google Cloud Console."
          );
        }
      } finally {
        setIsExchanging(false);
      }
    };

    if (token && lastExchangedRef.current !== token) {
      lastExchangedRef.current = token;
      addLog("Google ID token received");
      exchange(token);
    }
  }, [token]);

  // Aggregated "smart" sign-in button: One Tap → PKCE
  const onClickSmart = () => {
    addLog("Starting smart sign-in");
    if (isOneTapAvailable) {
      addLog("Attempting One Tap");
      signInWithOneTap();
    } else {
      addLog("One Tap unavailable; falling back to PKCE");
      startOAuthPkce();
    }
  };

  // FedCM active (user-initiated)
  const onClickFedCM = async () => {
    addLog("Starting FedCM (active)...");
    try {
      await signInWithFedCM("active");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      addLog(`FedCM failed: ${msg}`);
      setHint(
        "FedCM may fail in Guest/Incognito or when no Google session is present. Try the visible GSI button or PKCE."
      );
    }
  };

  // UI state helpers
  const busy = isFedCMAuthenticating || isOneTapAuthenticating || isExchanging;
  const ua = useMemo(() => (typeof navigator !== "undefined" ? navigator.userAgent : ""), []);

  const resetAll = () => {
    clear();
    setExchangeError(null);
    setHint(null);
    setLogs([]);
    // allow re-render of GSI button on next visit if needed
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full space-y-6">
        <div className="text-center">
          <h2 className="mt-2 text-2xl font-bold text-gray-900">Sign in</h2>
          <p className="mt-1 text-sm text-gray-600">Choose a method. PKCE is the most reliable fallback.</p>
        </div>

        <div className="bg-white p-6 rounded-lg border shadow-sm space-y-4">
          {/* Status */}
          <div className="flex items-center justify-between">
            <div className="text-sm">
              {token ? (
                <span className="text-green-700 font-medium">Authenticated</span>
              ) : (
                <span className="text-gray-700">Not authenticated</span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <StatusBadge label="FedCM" active={isFedCMAvailable} />
              <StatusBadge label="One Tap" active={isOneTapAvailable} />
              <StatusBadge label="GSI Script" active={isGoogleScriptLoaded} />
              <span className="text-xs text-gray-500">AutoLogin: {hasAttemptedAutoLogin ? "yes" : "no"}</span>
            </div>
          </div>

          {/* Messages */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
              Auth Error: {error}
            </div>
          )}
          {exchangeError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
              Exchange Error: {exchangeError}
            </div>
          )}
          {hint && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md text-xs text-yellow-800">
              Hint: {hint}
            </div>
          )}
          {busy && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-700">
              {isFedCMAuthenticating
                ? "Signing in with FedCM..."
                : isOneTapAuthenticating
                ? "Signing in with One Tap..."
                : "Exchanging token..."}
            </div>
          )}

          {/* Methods */}
          <div className="space-y-3">
            {/* Smart button (One Tap → PKCE) */}
            <button
              onClick={onClickSmart}
              disabled={busy}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-md bg-white hover:bg-gray-50 disabled:opacity-50"
              aria-label="Sign in with Google (smart)"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in with Google
            </button>

            {/* GSI visible button (click-driven) */}
            <div className="space-y-2">
              <div className="text-xs text-gray-600">Or use the Google button below:</div>
              <div ref={gsiContainerRef} className="flex justify-center" />
              {!isGoogleScriptLoaded && (
                <button
                  onClick={() => startOAuthPkce()}
                  disabled={busy}
                  className="w-full mt-2 px-4 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Continue with Google (PKCE)
                </button>
              )}
            </div>

            {/* FedCM and One Tap explicit controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <button
                onClick={() => signInWithOneTap()}
                disabled={!isOneTapAvailable || busy}
                className="px-4 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 disabled:opacity-50"
                aria-label="Start One Tap"
              >
                Start One Tap
              </button>
              <button
                onClick={onClickFedCM}
                disabled={!isFedCMAvailable || busy}
                className="px-4 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 disabled:opacity-50"
                aria-label="Sign in with FedCM"
              >
                Sign in with FedCM (active)
              </button>
            </div>

            {/* Reliable universal fallback */}
            <button
              onClick={() => startOAuthPkce()}
              disabled={busy}
              className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 disabled:opacity-50"
              aria-label="Continue with Google using OAuth PKCE"
            >
              Continue with Google (PKCE)
            </button>

            {/* Optional legacy */}
            <button
              onClick={() => signInWithOAuth()}
              disabled={busy}
              className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 disabled:opacity-50"
              aria-label="Legacy implicit flow"
            >
              Legacy implicit (not recommended)
            </button>

            {token && (
              <button
                onClick={resetAll}
                className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Diagnostics */}
        <div className="bg-white p-6 rounded-lg border shadow-sm space-y-3">
          <div className="text-sm text-gray-800 font-medium">Diagnostics</div>
          <div className="text-xs text-gray-600">
            UA: <span className="font-mono">{ua}</span>
          </div>
          {logs.length > 0 && (
            <div>
              <div className="text-xs text-gray-600 mb-1">Recent Events</div>
              <div className="bg-gray-50 rounded p-3 max-h-40 overflow-y-auto">
                {logs.map((l, i) => (
                  <div key={i} className="text-xs text-gray-700 font-mono">
                    {l}
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="text-xs text-gray-500 space-y-1">
            <p>
              If you see “origin is not allowed”, add this origin to Authorized JavaScript origins and set the redirect
              URI in Google Cloud Console.
            </p>
            <p>
              If CSP blocks Google resources, allow accounts.google.com, apis.google.com, ssl.gstatic.com (temporarily
              while debugging).
            </p>
            <p>
              If popups/postMessage are blocked by COOP, set Cross-Origin-Opener-Policy to same-origin-allow-popups on
              your page during auth flows.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;