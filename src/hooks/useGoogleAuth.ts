// src/hooks/useGoogleAuth.ts
import { useEffect, useRef, useState } from 'react';

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const redirectUri = import.meta.env.VITE_GOOGLE_REDIRECT_URI || '';

interface CredentialResponse {
  credential: string; // Google ID token (JWT). Verify server-side.
}

interface FedCMCredential {
  token: string; // Typically an ID token from the IdP for OIDC scenarios
}

// Minimal PromptMomentNotification to avoid depending on the global `google` namespace types
type PromptMomentNotification = {
  isDisplayed: () => boolean;
  isNotDisplayed: () => boolean;
  getNotDisplayedReason: () => string | undefined;
  isSkippedMoment: () => boolean;
  getSkippedReason: () => string | undefined;
  isDismissedMoment: () => boolean;
  getDismissedReason: () => string | undefined;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: {
            client_id: string;
            callback: (response: CredentialResponse) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          prompt: (
            cb?: (notification: PromptMomentNotification) => void
          ) => void;
          disableAutoSelect?: () => void;
          cancel?: () => void;
          renderButton?: (parent: HTMLElement, options?: Record<string, unknown>) => void;
        };
      };
    };
  }
}

// Singleton loader for the GSI script
let gsiLoadPromise: Promise<void> | null = null;
const loadGsiScript = (): Promise<void> => {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.google?.accounts?.id) return Promise.resolve();
  if (gsiLoadPromise) return gsiLoadPromise;

  gsiLoadPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById('google-gsi') as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Failed to load Google GSI script')), { once: true });
      // If script already loaded before listeners were attached
      if (window.google?.accounts?.id) resolve();
      return;
    }
    const script = document.createElement('script');
    script.id = 'google-gsi';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google GSI script'));
    document.head.appendChild(script);
  });

  return gsiLoadPromise;
};

// Feature detection helpers
const isFedCMSupported = (): boolean => {
  try {
    return (
      typeof window !== 'undefined' &&
      'IdentityCredential' in window &&
      'navigator' in window &&
      'credentials' in navigator &&
      !!navigator.credentials.get
    );
  } catch {
    return false;
  }
};

const isOneTapSupported = (): boolean =>
  typeof window !== 'undefined' && !!window.google?.accounts?.id;

// PKCE helpers for standards-compliant OAuth fallback (optional backend exchange)
const base64UrlEncode = (arr: ArrayBuffer): string =>
  btoa(String.fromCharCode(...new Uint8Array(arr)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

const randomString = (length = 64): string => {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, b => ('0' + b.toString(16)).slice(-2)).join('');
};

const createCodeChallenge = async (verifier: string): Promise<string> => {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return base64UrlEncode(digest);
};

export const useGoogleAuth = () => {
  const [token, setToken] = useState<string | null>(null); // Keep in memory only
  const [error, setError] = useState<string | null>(null);

  const [isFedCMAvailable, setIsFedCMAvailable] = useState(false);
  const [isOneTapAvailable, setIsOneTapAvailable] = useState(false);
  const [isGoogleScriptLoaded, setIsGoogleScriptLoaded] = useState(false);

  const [isFedCMAuthenticating, setIsFedCMAuthenticating] = useState(false);
  const [hasAttemptedAutoLogin, setHasAttemptedAutoLogin] = useState(false);

  const oneTapInitialized = useRef(false);
  const fedcmAbortRef = useRef<AbortController | null>(null);

  // Load GIS script once
  useEffect(() => {
    let cancelled = false;

    if (!clientId) {
      setError('Missing VITE_GOOGLE_CLIENT_ID');
      return;
    }

    loadGsiScript()
      .then(() => {
        if (!cancelled) setIsGoogleScriptLoaded(true);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message || 'Failed to load Google script');
      });

    return () => {
      cancelled = true;
      // Do not remove the script; keep singleton loaded for the app lifetime
    };
  }, []);

  // Auto-login attempt once (FedCM first, then One Tap)
  useEffect(() => {
    if (!isGoogleScriptLoaded || token || isFedCMAuthenticating || hasAttemptedAutoLogin) return;

    const fedCM = isFedCMSupported();
    const oneTap = isOneTapSupported();

    setIsFedCMAvailable(fedCM);
    setIsOneTapAvailable(oneTap);

    const tryOneTap = () => {
      if (!isOneTapSupported()) return;
      initializeGoogleOneTap();
      window.google!.accounts.id.prompt(handlePromptMoment);
      setHasAttemptedAutoLogin(true);
    };

    if (fedCM) {
      // Try passive first; browser may silently succeed if pre-authorized
      authenticateWithFedCM('passive')
        .catch(() => {
          // Fallback to One Tap on failure
          if (oneTap) tryOneTap();
        })
        .finally(() => {
          setHasAttemptedAutoLogin(true);
        });
    } else if (oneTap) {
      tryOneTap();
    } else {
      setError('No supported Google sign-in method. Use OAuth with PKCE.');
      setHasAttemptedAutoLogin(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGoogleScriptLoaded, token, isFedCMAuthenticating, hasAttemptedAutoLogin]);

  const clear = () => {
    setToken(null);
    setError(null);
    // Optional: clear One Tap auto select so user can pick accounts next time
    window.google?.accounts?.id?.disableAutoSelect?.();
  };

  const handleGISCallback = (response: CredentialResponse) => {
    if (response?.credential) {
      setToken(response.credential);
      setError(null);
    } else {
      setError('Missing Google credential');
    }
  };

  const initializeGoogleOneTap = () => {
    if (!window.google?.accounts?.id || oneTapInitialized.current) return;

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: handleGISCallback,
      auto_select: true,
      cancel_on_tap_outside: false,
    });

    oneTapInitialized.current = true;
  };

  const handlePromptMoment = (notification: PromptMomentNotification) => {
    if (notification.isDisplayed()) {
      // One Tap shown
      return;
    }
    if (notification.isNotDisplayed()) {
      const reason = notification.getNotDisplayedReason();
      // Useful for diagnostics; avoid noisy UI here
      if (reason) setError(`One Tap not displayed: ${reason}`);
    }
    if (notification.isSkippedMoment()) {
      const reason = notification.getSkippedReason();
      if (reason) setError(`One Tap skipped: ${reason}`);
    }
    if (notification.isDismissedMoment()) {
      const reason = notification.getDismissedReason();
      if (reason) setError(`One Tap dismissed: ${reason}`);
    }
  };

  // FedCM sign-in. Mode: 'passive' (silent) or 'active' (may show account chooser)
  const authenticateWithFedCM = async (mode: 'passive' | 'active' = 'passive') => {
    if (isFedCMAuthenticating || !isFedCMSupported()) {
      throw new Error('FedCM not available or already authenticating');
    }

    setIsFedCMAuthenticating(true);
    const controller = new AbortController();
    fedcmAbortRef.current = controller;

    try {
      const nonce = crypto.randomUUID?.() || Math.random().toString(36).slice(2);
      const credential = (await navigator.credentials.get({
        identity: {
          context: 'signin',
          providers: [
            {
              configURL: 'https://accounts.google.com/gsi/fedcm.json',
              clientId,
              mode,
              params: { nonce },
            },
          ],
        },
        signal: controller.signal,
      } as never)) as FedCMCredential | null;

      if (credential?.token) {
        setToken(credential.token);
        setError(null);
      } else {
        setError('No FedCM token returned');
        throw new Error('No FedCM token');
      }
    } catch (err) {
      const e = err as Error;
      if (e.name === 'AbortError') {
        // Component unmounted or cancelled
      } else if (e.name === 'NotAllowedError') {
        setError('FedCM blocked or not permitted in browser settings');
        // Fallback expected to One Tap by caller
      } else {
        setError(`FedCM error: ${e.message}`);
      }
      throw err;
    } finally {
      setIsFedCMAuthenticating(false);
      fedcmAbortRef.current = null;
    }
  };

  // Clean up any in-flight FedCM request
  useEffect(() => {
    return () => {
      fedcmAbortRef.current?.abort();
      window.google?.accounts?.id?.cancel?.();
    };
  }, []);

  // Standards-compliant OAuth fallback (Authorization Code with PKCE)
  // Exchange the returned "code" on your backend to mint your session.
  const startOAuthPkce = async (scopes = ['openid', 'email', 'profile']) => {
    if (!clientId || !redirectUri) {
      setError('Missing env: VITE_GOOGLE_CLIENT_ID or VITE_GOOGLE_REDIRECT_URI');
      return;
    }
    const verifier = randomString(64);
    const challenge = await createCodeChallenge(verifier);
    sessionStorage.setItem('pkce_verifier', verifier);

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: scopes.join(' '),
      include_granted_scopes: 'true',
      access_type: 'offline',
      prompt: 'consent',
      code_challenge: challenge,
      code_challenge_method: 'S256',
    });

    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  };

  // For backward compatibility (not recommended): implicit flow redirect
  const signInWithOAuth = () => {
    setError(
      'Implicit flow is discouraged. Prefer One Tap or PKCE. Proceeding anyway.'
    );
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'token',
      scope: 'openid email profile',
      prompt: 'consent',
    });
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  };

  // Optional manual triggers
  const signInWithOneTap = () => {
    if (!isOneTapSupported()) {
      setError('One Tap not available');
      return;
    }
    initializeGoogleOneTap();
    window.google!.accounts.id.prompt(handlePromptMoment);
  };

  const signInWithFedCM = (mode: 'passive' | 'active' = 'active') => {
    if (!isFedCMSupported()) {
      setError('FedCM not available');
      return;
    }
    authenticateWithFedCM(mode).catch(() => {
      // Swallow here; caller can check error state
    });
  };

  return {
    // State
    token,
    error,
    isFedCMAvailable,
    isOneTapAvailable,
    isGoogleScriptLoaded,
    isFedCMAuthenticating,
    hasAttemptedAutoLogin,

    // Actions
    clear,
    signInWithOneTap,
    signInWithFedCM,
    startOAuthPkce, // Preferred standards fallback
    signInWithOAuth, // Legacy fallback (not recommended)
  };
};