import { useEffect, useState } from "react";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";

const Login = () => {
  const {
    token,
    error,
    isFedCMAvailable,
    isOneTapAvailable,
    isGoogleScriptLoaded,
    hasAttemptedAutoLogin,
    signInWithOneTap,
    startOAuthPkce,
    clear,
  } = useGoogleAuth();

  // Exchange the Google ID token with your backend to establish an app session (HttpOnly cookies recommended)
  const [isExchanging, setIsExchanging] = useState(false);
  const [exchangeError, setExchangeError] = useState<string | null>(null);
  const [authenticationLogs, setAuthenticationLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setAuthenticationLogs(prev => [`[${timestamp}] ${message}`, ...prev].slice(0, 10));
  };

  useEffect(() => {
    const exchange = async (idToken: string) => {
      setIsExchanging(true);
      setExchangeError(null);
      addLog('Starting token exchange with backend...');
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
        addLog('Token exchange successful');
      } catch (e) {
        const errorMsg = e instanceof Error ? e.message : 'Failed to exchange ID token';
        setExchangeError(errorMsg);
        addLog(`Token exchange failed: ${errorMsg}`);
      } finally {
        setIsExchanging(false);
      }
    };
    if (token) {
      addLog('Google ID token received');
      exchange(token);
    }
  }, [token]);

  // Production sign-in that intelligently tries the best available method
  // Skip FedCM to avoid user dismissal issues, use more reliable methods
  const signInWithGoogle = async () => {
    addLog('Starting Google sign-in...');
    
    // Try One Tap first (more reliable than FedCM)
    if (isOneTapAvailable) {
      addLog('Attempting One Tap authentication...');
      signInWithOneTap();
      return;
    }

    // Fallback to PKCE OAuth (most compatible)
    addLog('Falling back to OAuth with PKCE...');
    await startOAuthPkce();
  };

  const handleClear = () => {
    clear();
    setExchangeError(null);
    setAuthenticationLogs([]);
    addLog('Authentication state cleared');
  };

  const StatusBadge = ({ label, status, color }: { label: string; status: string; color: 'green' | 'red' | 'yellow' | 'blue' }) => {
    const colorClasses = {
      green: 'bg-green-50 text-green-700 border-green-200',
      red: 'bg-red-50 text-red-700 border-red-200',
      yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      blue: 'bg-blue-50 text-blue-700 border-blue-200',
    };

    return (
      <span className={`text-xs px-2 py-1 rounded-full border ${colorClasses[color]}`}>
        {label}: {status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Use your Google account to continue
          </p>
        </div>

        {/* Main Login Card */}
        <div className="bg-white py-8 px-6 shadow-sm rounded-lg border">
          {/* Authentication Status */}
          <div className="mb-6">
            {token ? (
              <div className="flex items-center p-3 bg-green-50 border border-green-200 rounded-md">
                <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-green-800 font-medium">Successfully authenticated</span>
              </div>
            ) : (
              <div className="flex items-center p-3 bg-gray-50 border border-gray-200 rounded-md">
                <svg className="w-5 h-5 text-gray-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-gray-700">Not authenticated</span>
              </div>
            )}
          </div>

          {/* Error Messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-700">Authentication Error: {error}</p>
            </div>
          )}
          {exchangeError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-700">Token Exchange Error: {exchangeError}</p>
            </div>
          )}

          {/* Loading State */}
          {isExchanging && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-sm text-blue-700">
                  Exchanging token...
                </span>
              </div>
            </div>
          )}

          {/* Sign In Button */}
          <div className="space-y-4">
            <button
              onClick={signInWithGoogle}
              disabled={isExchanging}
              className="w-full flex justify-center items-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in with Google
            </button>

            {token && (
              <button
                onClick={handleClear}
                className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Sign Out
              </button>
            )}
          </div>
        </div>

        {/* Status Summary */}
        <div className="bg-white py-6 px-6 shadow-sm rounded-lg border">
          <h3 className="text-sm font-medium text-gray-900 mb-4">Authentication Methods & Status</h3>
          
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <StatusBadge 
                label="FedCM" 
                status={isFedCMAvailable ? 'available' : 'unavailable'} 
                color={isFedCMAvailable ? 'green' : 'red'} 
              />
              <StatusBadge 
                label="One Tap" 
                status={isOneTapAvailable ? 'available' : 'unavailable'} 
                color={isOneTapAvailable ? 'green' : 'red'} 
              />
              <StatusBadge 
                label="GSI Script" 
                status={isGoogleScriptLoaded ? 'loaded' : 'loading'} 
                color={isGoogleScriptLoaded ? 'green' : 'yellow'} 
              />
              <StatusBadge 
                label="Auto Login" 
                status={hasAttemptedAutoLogin ? 'attempted' : 'pending'} 
                color={hasAttemptedAutoLogin ? 'blue' : 'yellow'} 
              />
            </div>

            {authenticationLogs.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-gray-700 mb-2">Recent Activity</h4>
                <div className="bg-gray-50 rounded p-3 max-h-32 overflow-y-auto">
                  {authenticationLogs.map((log, index) => (
                    <div key={index} className="text-xs text-gray-600 font-mono">
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="text-xs text-gray-500 space-y-1">
              <p><strong>Supported Methods:</strong> One Tap (most browsers), OAuth PKCE (universal fallback)</p>
              <p><strong>Security:</strong> ID tokens verified server-side, HttpOnly cookies recommended for sessions</p>
              <p><strong>Note:</strong> FedCM available but skipped to avoid dismissal issues</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;