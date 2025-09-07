// src/features/auth/Login.tsx
import { useEffect, useRef, useState } from 'react';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';

const Login = () => {
  const { idToken, ready, error, signingIn, mountGsiButton } = useGoogleAuth();

  // ボタン描画
  const gsiRef = useRef<HTMLDivElement | null>(null);
  const mountedRef = useRef(false);
  useEffect(() => {
    if (ready && gsiRef.current && !mountedRef.current) {
      mountGsiButton(gsiRef.current, { width: 360 });
      mountedRef.current = true;
    }
  }, [ready, mountGsiButton]);

  // サーバーへIDトークンを送ってセッション確立 → リダイレクト
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const nextUrl = new URL(window.location.href).searchParams.get('next') || '/';
    const exchange = async (token: string) => {
      setSubmitting(true);
      setSubmitError(null);
      try {
        const res = await fetch('/api/auth/google', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ id_token: token }),
        });
        if (!res.ok) {
          const msg = await res.text().catch(() => '');
          throw new Error(msg || 'Sign-in failed');
        }
        // サーバー側で HttpOnly Cookie（refresh 等）をセットし、必要ならアクセストークンをJSONで返す設計
        // 成功したら遷移
        window.location.replace(nextUrl);
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Sign-in failed';
        setSubmitError(msg);
      } finally {
        setSubmitting(false);
      }
    };
    if (idToken) exchange(idToken);


    // test
    console.log('idToken', idToken);
  }, [idToken]);

  const disabled = !ready || signingIn || submitting;

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Sign in</h1>
        </div>

        <div className="space-y-4">
          {/* メインのGSIボタン */}
          <div ref={gsiRef} className="flex justify-center" />

          {/* 進行中の簡潔UI */}
          {(signingIn || submitting) && (
            <div className="text-center text-sm text-gray-600 select-none">Signing in...</div>
          )}

          {/* 最小限のエラー表示 */}
          {(error || submitError) && (
            <div className="text-center text-sm text-red-600" role="alert" aria-live="polite">
              {submitError || error}
            </div>
          )}

          {/* 代替アクション（最小限、冪等にdisabled） */}
          <button
            type="button"
            onClick={() => {
              try {
                // ユーザー操作による明示的なプロンプトを許可（One Tap / FedCM UIはGSIが判断）
                window.google?.accounts?.id?.prompt();
              } catch {
                // ignore
              }
            }}
            disabled={disabled}
            className="w-full text-sm text-gray-600 hover:text-gray-900 underline disabled:opacity-50"
          >
            Try again
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;