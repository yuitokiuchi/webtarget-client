import { useEffect, useRef, useState } from 'react';

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const redirectUri = import.meta.env.VITE_GOOGLE_REDIRECT_URI || '';
const loginUri = import.meta.env.VITE_GSI_LOGIN_URI || '';

// StrictModeや再マウントでも生存するガード（自動サインインはページライフで一度）:
let autoLoginAttemptedGlobal = false;
// FedCMの並列実行防止（StrictMode再マウント対策も兼ねる）
let fedcmInFlightGlobal = false;

// You can optionally surface your CSP nonce via <meta name="csp-nonce" content="...">
const getCspNonce = (): string | undefined => {
  try {
    const meta = document.querySelector('meta[name="csp-nonce"]') as HTMLMetaElement | null;
    return meta?.content || (window as unknown as { __CSP_NONCE__?: string }).__CSP_NONCE__ || undefined;
  } catch {
    return undefined;
  }
};

interface CredentialResponse {
  credential: string; // Google ID token (JWT). Verify server-side.
}

interface FedCMCredential {
  token: string; // Typically an ID token from the IdP for OIDC scenarios
}

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
            use_fedcm_for_prompt?: boolean;
            itp_support?: boolean;
            login_uri?: string;
          }) => void;
          prompt: (cb?: (notification: PromptMomentNotification) => void) => void;
          disableAutoSelect?: () => void;
          cancel?: () => void;
          renderButton?: (parent: HTMLElement, options?: Record<string, unknown>) => void;
        };
      };
    };
  }
}

// Singleton loader for the GSI script (+ CSP nonce)
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
      if (window.google?.accounts?.id) resolve();
      return;
    }
    const script = document.createElement('script');
    script.id = 'google-gsi';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    const nonce = getCspNonce();
    if (nonce) (script as HTMLScriptElement).nonce = nonce;
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

// PKCE helpers
const base64UrlEncode = (arr: ArrayBuffer): string =>
  btoa(String.fromCharCode(...new Uint8Array(arr)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

const randomString = (length = 64): string => {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => ('0' + b.toString(16)).slice(-2)).join('');
};

const createCodeChallenge = async (verifier: string): Promise<string> => {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return base64UrlEncode(digest);
};

export const useGoogleAuth = () => {
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [isFedCMAvailable, setIsFedCMAvailable] = useState(false);
  const [isOneTapAvailable, setIsOneTapAvailable] = useState(false);
  const [isGoogleScriptLoaded, setIsGoogleScriptLoaded] = useState(false);

  const [isFedCMAuthenticating, setIsFedCMAuthenticating] = useState(false);
  const [hasAttemptedAutoLogin, setHasAttemptedAutoLogin] = useState(false);

  const oneTapInitialized = useRef(false);
  const promptedOnceRef = useRef(false);
  const fedcmAbortRef = useRef<AbortController | null>(null);

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
    };
  }, []);

  // Auto-login once per page life. FedCMが使える場合は「passive」のみを試し、失敗しても自動でOne Tapは起動しない。
  useEffect(() => {
    if (!isGoogleScriptLoaded || token || isFedCMAuthenticating || hasAttemptedAutoLogin) return;

    // StrictMode対策: モジュールスコープのガードで二重起動を封じる
    if (autoLoginAttemptedGlobal) {
      setHasAttemptedAutoLogin(true);
      return;
    }
    autoLoginAttemptedGlobal = true;
    setHasAttemptedAutoLogin(true);

    const fedCM = isFedCMSupported();
    const oneTap = isOneTapSupported();

    setIsFedCMAvailable(fedCM);
    setIsOneTapAvailable(oneTap);

    (async () => {
      if (fedCM) {
        try {
          await authenticateWithFedCM('passive'); // UIなしで取得できるなら取る
        } catch {
          // ここではUIを自動で出さない。ユーザー操作でFedCM active or One Tap or PKCEへ。
        }
      } else {
        // FedCM不可の環境のみ、自動One Tapを試す（ユーザーに見せてもOKなポリシーなら）
        if (oneTap && !promptedOnceRef.current) {
          initializeGoogleOneTap();
          promptedOnceRef.current = true;
          window.google!.accounts.id.prompt();
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGoogleScriptLoaded, token, isFedCMAuthenticating, hasAttemptedAutoLogin]);

  const clear = () => {
    setToken(null);
    setError(null);
    promptedOnceRef.current = false;
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
      use_fedcm_for_prompt: true, // ただしFedCM対応ブラウザでは自動promptしない運用にしたので重複しない
      itp_support: true,
      ...(loginUri ? { login_uri: loginUri } : {}),
    });

    oneTapInitialized.current = true;
  };

  // Optional diagnostics only
  const handlePromptMoment = (notification: PromptMomentNotification) => {
    try {
      if (notification.isNotDisplayed()) {
        const reason = notification.getNotDisplayedReason();
        if (reason) console.debug('[GSI] One Tap not displayed:', reason);
      }
      if (notification.isSkippedMoment()) {
        const reason = notification.getSkippedReason();
        if (reason) console.debug('[GSI] One Tap skipped:', reason);
      }
      if (notification.isDismissedMoment()) {
        const reason = notification.getDismissedReason();
        if (reason) console.debug('[GSI] One Tap dismissed:', reason);
      }
    } catch {
      // ignore
    }
  };

  // FedCM sign-in
  const authenticateWithFedCM = async (mode: 'passive' | 'active' = 'passive') => {
    if (!isFedCMSupported()) {
      throw new Error('FedCM not available');
    }
    // 並列実行をグローバルに防止（StrictMode再マウント時の競合も回避）
    if (fedcmInFlightGlobal) {
      throw new Error('FedCM already in flight');
    }
    fedcmInFlightGlobal = true;

    // One Tapが表示されている可能性を潰してからFedCMへ（UI重複防止）
    window.google?.accounts?.id?.cancel?.();

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
        throw new Error('No FedCM token');
      }
    } catch (err) {
      const e = err as Error;
      if (e.name === 'AbortError') {
        // ignore
      } else if (e.name === 'NotAllowedError') {
        console.debug('FedCM not allowed:', e.message);
      } else {
        console.debug('FedCM error:', e.message);
      }
      throw err;
    } finally {
      setIsFedCMAuthenticating(false);
      fedcmAbortRef.current = null;
      fedcmInFlightGlobal = false;
    }
  };

  useEffect(() => {
    return () => {
      fedcmAbortRef.current?.abort();
      window.google?.accounts?.id?.cancel?.();
    };
  }, []);

  // Authorization Code + PKCE
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

  const signInWithOAuth = () => {
    setError('Implicit flow is discouraged. Prefer One Tap or PKCE. Proceeding anyway.');
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'token',
      scope: 'openid email profile',
      prompt: 'consent',
    });
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  };

  // Manual triggers
  const signInWithOneTap = () => {
    if (!isOneTapSupported()) {
      setError('One Tap not available');
      return;
    }
    // One Tapを起動するときはFedCMを走らせない（UI競合防止）
    if (fedcmInFlightGlobal || isFedCMAuthenticating) return;

    initializeGoogleOneTap();
    if (!promptedOnceRef.current) {
      promptedOnceRef.current = true;
      window.google!.accounts.id.prompt(handlePromptMoment);
    }
  };

  const signInWithFedCM = (mode: 'passive' | 'active' = 'active') => {
    if (!isFedCMSupported()) {
      setError('FedCM not available');
      return;
    }
    authenticateWithFedCM(mode).catch(() => {});
  };

  const renderGoogleButton = (container: HTMLElement, options: Record<string, unknown> = {}) => {
    if (!window.google?.accounts?.id) return;
    initializeGoogleOneTap();
    window.google.accounts.id.renderButton?.(container, {
      type: 'standard',
      theme: 'filled_blue',
      size: 'large',
      text: 'signin_with',
      shape: 'rectangular',
      ...options,
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
    startOAuthPkce,
    signInWithOAuth,
    renderGoogleButton,
  };
};