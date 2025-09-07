import { useGoogleAuth } from "@/hooks/useGoogleAuth";

const Login = () => {
  const {
    token,
    error,
    isFedCMAvailable,
    isOneTapAvailable,
    isFedCMAuthenticating,
    signInWithFedCM,
    signInWithOneTap,
    startOAuthPkce,
    signInWithOAuth,
    clear,
  } = useGoogleAuth();

  return (
    <div className="flex flex-col gap-3 items-start">
      <div className="text-sm text-gray-600">
        {token ? "Authenticated with Google." : "Not authenticated."}
      </div>
      {error && <div className="text-sm text-red-600">{error}</div>}

      <div className="flex gap-2 flex-wrap">
        <button
          className="px-3 py-2 rounded bg-black text-white disabled:opacity-50"
          onClick={() => signInWithFedCM('active')}
          disabled={!isFedCMAvailable || isFedCMAuthenticating}
          title={isFedCMAvailable ? "Use FedCM" : "FedCM not available in this browser"}
        >
          {isFedCMAuthenticating ? 'Signing in…' : 'Sign in with Google (FedCM)'}
        </button>

        <button
          className="px-3 py-2 rounded border border-gray-300"
          onClick={signInWithOneTap}
          disabled={!isOneTapAvailable}
          title={isOneTapAvailable ? "Use One Tap" : "One Tap not available"}
        >
          Sign in with Google (One Tap)
        </button>

        <button
          className="px-3 py-2 rounded border border-gray-300"
          onClick={() => startOAuthPkce()}
        >
          Continue with Google (PKCE)
        </button>

        <button
          className="px-3 py-2 rounded border border-gray-300"
          onClick={signInWithOAuth}
        >
          Legacy Implicit Flow
        </button>

        <button
          className="px-3 py-2 rounded border border-gray-300"
          onClick={clear}
        >
          Clear
        </button>
      </div>
    </div>
  );
};

export default Login;