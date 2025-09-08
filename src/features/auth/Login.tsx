// src/features/auth/Login.tsx
import { useEffect, useRef, useState } from 'react';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import LogoIcon from '@/assets/icons/icon.svg?react';

const Logo = () => (
  <div className="flex items-center space-x-2.5">
    <LogoIcon className="w-8 h-8" />
    <span className="text-lg font-medium text-black">Fooval</span>
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
    <div className="min-h-screen bg-white flex flex-col">
      
      {/* Header */}
      <header className="p-8">
        <Logo />
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-8">
        <div className="w-full max-w-xs space-y-8">
          
          {/* Title */}
          <div className="text-center">
            <h1 className="text-xl font-medium text-black">Sign In</h1>
          </div>

          {/* Google Sign-in Button */}
          <div className="space-y-4">
            <div className="flex justify-center">
              <div ref={gsiRef} />
            </div>
            
            {/* Loading State */}
            {(signingIn || submitting) && (
              <div className="text-center py-2">
                <div className="text-sm text-gray-600">Signing in...</div>
              </div>
            )}

            {/* Error State */}
            {(error || submitError) && (
              <div className="text-center py-2">
                <div className="text-sm text-gray-900">{submitError || error}</div>
              </div>
            )}
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="p-8 text-center">
        <div className="space-x-4 text-sm text-gray-500">
          <a href="/terms" className="hover:text-black transition-colors">Terms</a>
          <a href="/privacy" className="hover:text-black transition-colors">Privacy</a>
        </div>
      </footer>

    </div>
  );
};

export default Login;