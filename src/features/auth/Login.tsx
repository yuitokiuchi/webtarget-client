// src/features/auth/Login.tsx
import { useEffect, useRef, useState } from 'react';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import LogoIcon from '@/assets/icons/icon.svg?react';

const Logo = () => (
  <div className="flex items-center space-x-2.5">
    <LogoIcon className="w-8 h-8" />
    <span className="text-lg font-medium text-gray-900">Client</span>
  </div>
);

const Login = () => {
  const { idToken, ready, error, signingIn, mountGsiButton } = useGoogleAuth();
  const gsiRef = useRef<HTMLDivElement | null>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    if (ready && gsiRef.current && !mountedRef.current) {
      mountGsiButton(gsiRef.current, { 
        theme: 'outline', 
        size: 'large', 
        width: '320'
      });
      mountedRef.current = true;
    }
  }, [ready, mountGsiButton]);

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
          throw new Error(msg || 'Authentication failed');
        }
        window.location.replace(nextUrl);
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Authentication failed';
        setSubmitError(msg);
      } finally {
        setSubmitting(false);
      }
    };
    if (idToken) exchange(idToken);
  }, [idToken]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      
      {/* Header */}
      <header className="p-8">
        <Logo />
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-8">
        <div className="w-full max-w-xs space-y-8">
          
          {/* Title */}
          <div className="text-center">
            <h1 className="text-xl font-medium text-gray-900">Sign In</h1>
          </div>

          <div className="flex flex-col items-center space-y-4">
            {/* GSI Button Container */}
            <div ref={gsiRef} />
            
            {/* Status Messages */}
            <div className="h-8 flex items-center justify-center">
              {(error || submitError) ? (
                <div className="text-sm text-error-500">{submitError || error}</div>
              ) : (signingIn || submitting) ? (
                <div className="text-sm text-gray-500">Signing in...</div>
              ) : null}
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="p-8 text-center">
        <div className="space-x-4 text-sm text-gray-500">
          <a href="/terms" className="hover:text-gray-900 transition-colors">Terms</a>
          <a href="/privacy" className="hover:text-gray-900 transition-colors">Privacy</a>
        </div>
      </footer>

    </div>
  );
};

export default Login;