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
    renderGoogleButton, // ← 追加：クリック起点のGSIボタン描画
    clear,
  } = useGoogleAuth();

  // サーバー側の自サービストークンに交換する処理（例）
  const [isExchanging, setIsExchanging] = useState(false);
  const [exchangeError, setExchangeError] = useState<string | null>(null);

  // GoogleのIDトークンを受け取ったら、サーバーへ送って自サービスのセッション/トークンを確立
  useEffect(() => {
    const exchange = async (idToken: string) => {
      setIsExchanging(true);
      setExchangeError(null);
      try {
        // 例: あなたのバックエンドのエンドポイント（Cookieでセッション確立を推奨）
        // サーバー側で: IDトークン検証 → ユーザー作成/紐付け → 自社access/refresh発行（HttpOnly Cookie）
        const res = await fetch("/api/auth/google", {
          method: "POST",
          headers: { "content-type": "application/json" },
          credentials: "include", // ← HttpOnly Cookie受け取り
          body: JSON.stringify({ id_token: idToken }),
        });
        if (!res.ok) {
          const t = await res.text().catch(() => "");
          throw new Error(t || `Exchange failed: ${res.status}`);
        }
        // 必要ならレスポンスJSONを参照（ロールなど）
        // const data = await res.json();
        // 以降は自サービスのセッションでAPIアクセス（BearerよりCookie推奨）
      } catch (e: unknown) {
        if (e instanceof Error) {
          setExchangeError(e.message);
        } else {
          setExchangeError("Failed to exchange ID token");
        }
      } finally {
        setIsExchanging(false);
      }
    };

    if (token) {
      // 受け取ったのはGoogleのIDトークン。ここでサーバー交換を実行。
      exchange(token);
    }
  }, [token]);

  // GSIの「Sign in with Google」ボタンを描画（クリック起点で確実に動く）
  const googleBtnRef = useRef<HTMLDivElement | null>(null);
  const renderedRef = useRef(false);
  useEffect(() => {
    if (!renderedRef.current && isGoogleScriptLoaded && isOneTapAvailable && googleBtnRef.current) {
      renderGoogleButton(googleBtnRef.current, { size: "large", theme: "filled_blue" });
      renderedRef.current = true;
    }
  }, [isGoogleScriptLoaded, isOneTapAvailable, renderGoogleButton]);

  return (
    <div className="flex flex-col gap-4 items-start">
      <div className="text-sm text-gray-600">
        {token ? "Authenticated with Google (ID token acquired)." : "Not authenticated."}
      </div>
      {error && <div className="text-sm text-red-600">GSI/FedCM: {error}</div>}
      {exchangeError && <div className="text-sm text-red-600">Exchange: {exchangeError}</div>}
      {isExchanging && <div className="text-sm text-gray-600">Exchanging token…</div>}

      <div className="flex gap-2 flex-wrap items-center">
        {/* FedCM（ユーザー操作起点）。Firefoxは不可が多いので無効でも正常 */}
        <button
          className="px-3 py-2 rounded bg-black text-white disabled:opacity-50"
          onClick={() => signInWithFedCM("active")}
          disabled={!isFedCMAvailable || isFedCMAuthenticating}
          title={isFedCMAvailable ? "Use FedCM" : "FedCM not available in this browser"}
        >
          {isFedCMAuthenticating ? "Signing in…" : "Sign in with Google (FedCM)"}
        </button>

        {/* One Tap を明示的に試す（出ない環境もある） */}
        <button
          className="px-3 py-2 rounded border border-gray-300 disabled:opacity-50"
          onClick={signInWithOneTap}
          disabled={!isOneTapAvailable}
          title={isOneTapAvailable ? "Use One Tap" : "One Tap not available"}
        >
          Sign in with Google (One Tap)
        </button>

        {/* GSIの可視ボタン（クリック起点）。One Tapが出ない/抑止環境でも進めやすい */}
        <div ref={googleBtnRef} className="inline-block" title="Google Sign-In button will appear here" />

        {/* 標準準拠のフォールバック（最も確実） */}
        <button className="px-3 py-2 rounded border border-gray-300" onClick={() => startOAuthPkce()}>
          Continue with Google (PKCE)
        </button>

        {/* レガシー。基本は不要 */}
        <button className="px-3 py-2 rounded border border-gray-300" onClick={signInWithOAuth}>
          Legacy Implicit Flow
        </button>

        <button className="px-3 py-2 rounded border border-gray-300" onClick={clear}>
          Clear
        </button>
      </div>

      <div className="text-xs text-gray-500">
        Auto attempt: {hasAttemptedAutoLogin ? "done" : "pending"} | FedCM: {String(isFedCMAvailable)} | One Tap:{" "}
        {String(isOneTapAvailable)}
      </div>
    </div>
  );
};

export default Login;