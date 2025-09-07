import { useEffect, useRef, useState } from 'react';

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const loginUri = import.meta.env.VITE_GSI_LOGIN_URI || ''; // 使う場合はGoogleから直接POST（任意）
const useLoginUriOnly = import.meta.env.VITE_GSI_USE_LOGIN_URI_ONLY === 'true';

// ページライフで一度きりの制御
let autoAssistTriedGlobal = false; // FedCM passive → One Tap を自動補助として一度だけ
let fedcmInFlightGlobal = false;
let fedcmDismissedGlobal = false;

// CSP nonce 取得（任意）
const getCspNonce = (): string | undefined => {
  try {
    const meta = document.querySelector('meta[name="csp-nonce"]') as HTMLMetaElement | null;
    return meta?.content || (window as unknown as { __CSP_NONCE__?: string }).__CSP_NONCE__ || undefined;
  } catch {
    return undefined;
  }
};

interface CredentialResponse {
  credential: string; // Google ID token (JWT)
  select_by?: string;
}

interface FedCMCredential {
  token: string;
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
            callback?: (response: CredentialResponse) => void;
            login_uri?: string;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
            use_fedcm_for_prompt?: boolean;
            itp_support?: boolean;
            nonce?: string;
          }) => void;
          prompt: (cb?: (notification: PromptMomentNotification) => void) => void;
          renderButton?: (parent: HTMLElement, options?: Record<string, unknown>) => void;
          cancel?: () => void;
          disableAutoSelect?: () => void;
        };
      };
    };
  }
}

// GSIスクリプト読み込み（シングルトン）
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

export const useGoogleAuth = () => {
  const [idToken, setIdToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);

  const [fedcmAvailable, setFedcmAvailable] = useState(false);

  const initializedRef = useRef(false);
  const nonceRef = useRef<string | null>(null);

  // 初期ロード
  useEffect(() => {
    setFedcmAvailable(isFedCMSupported());

    if (!clientId) {
      setError('Configuration error'); // 余計な情報は出さない
      return;
    }
    let cancelled = false;
    loadGsiScript()
      .then(() => {
        if (cancelled) return;
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) setError('Initialization failed');
      });
    return () => {
      cancelled = true;
      try {
        window.google?.accounts?.id?.cancel?.();
        window.google?.accounts?.id?.disableAutoSelect?.();
      } catch {
        // ignore
      }
    };
  }, []);

  // GSI 初期化
  useEffect(() => {
    if (!ready || initializedRef.current) return;

    // リプレイ抑止用 nonce（サーバーでJWTの nonce 検証に使用可）
    const nonce = crypto.randomUUID?.() || Math.random().toString(36).slice(2);
    nonceRef.current = nonce;

    try {
      const common = {
        client_id: clientId,
        use_fedcm_for_prompt: true, // 対応ブラウザではFedCM UIに委譲
        itp_support: true,
        cancel_on_tap_outside: false,
        nonce, // ID token の nonce に反映
      };

      // login_uri を使う場合は、トークンをJSに出さずにサーバーへ直接POST
      if (useLoginUriOnly && loginUri) {
        window.google!.accounts.id.initialize({
          ...common,
          login_uri: loginUri,
        });
      } else {
        window.google!.accounts.id.initialize({
          ...common,
          callback: (resp) => {
            if (resp?.credential) {
              setIdToken(resp.credential);
            } else {
              setError('Sign-in failed');
            }
          },
        });
      }
      initializedRef.current = true;
    } catch {
      setError('Initialization failed');
    }
  }, [ready]);

  // 自動補助: FedCM passive → One Tap（どちらもUIに出さない/出しすぎない）
  useEffect(() => {
    if (!ready || !initializedRef.current) return;
    if (autoAssistTriedGlobal) return;
    autoAssistTriedGlobal = true;

    const tryAssist = async () => {
      // FedCM passive
      if (fedcmAvailable) {
        try {
          await authenticateWithFedCM('passive');
          return; // 取得できた場合は終了
        } catch {
          // continue
        }
      }
      // One Tap（GSIが判断して一度だけ）
      try {
        window.google!.accounts.id.prompt();
      } catch {
        // ignore
      }
    };
    // ほんの少し遅延して、初回レイアウト完了後に実行
    const t = setTimeout(tryAssist, 300);
    return () => clearTimeout(t);
  }, [ready, fedcmAvailable]);

  // FedCM
  const authenticateWithFedCM = async (mode: 'passive' | 'active' = 'passive') => {
    if (!isFedCMSupported()) throw new Error('FedCM not available');
    if (fedcmDismissedGlobal) throw new Error('FedCM dismissed');
    if (fedcmInFlightGlobal) throw new Error('FedCM in flight');
    fedcmInFlightGlobal = true;
    setSigningIn(true);
    try {
      const nonce = nonceRef.current || crypto.randomUUID?.() || Math.random().toString(36).slice(2);
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
      } as never)) as FedCMCredential | null;

      if (credential?.token) {
        setIdToken(credential.token);
      } else {
        throw new Error('No token');
      }
    } catch (e: unknown) {
      if (typeof e === 'object' && e !== null && 'name' in e && (e as { name?: string }).name === 'NotAllowedError') fedcmDismissedGlobal = true;
      throw e;
    } finally {
      setSigningIn(false);
      fedcmInFlightGlobal = false;
    }
  };

  // 外部に提供する：GSIボタンを所定のDOMに描画
  const mountGsiButton = (container: HTMLElement, options: Record<string, unknown> = {}) => {
    if (!ready || !window.google?.accounts?.id) return;
    try {
      window.google.accounts.id.renderButton?.(container, {
        type: 'standard',
        theme: 'outline', // プロダクト感のある控えめデザイン
        size: 'large',
        text: 'signin_with',
        shape: 'pill',
        logo_alignment: 'left',
        width: 340,
        ...options,
      });
    } catch {
      // ignore
    }
  };

  // 補助として明示的に呼び出す（UIには出さない設計だが将来の利用のため）
  const signInWithFedCMActive = async () => {
    return authenticateWithFedCM('active');
  };

  return {
    // state
    idToken,
    ready,
    error,
    signingIn,

    // actions
    mountGsiButton,
    signInWithFedCMActive,
  };
};