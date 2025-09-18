// src/routes/AppRouter.tsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Loading from './Loading';
import NotFound from './NotFound';

// route config: each entry describes path, whether it is protected, and
// a factory for the lazy-loaded component. This scales nicely as the app grows.
const routes: Array<{
  path: string;
  protected?: boolean;
  loader: () => Promise<any>;
}> = [
  { path: '/', protected: true, loader: () => import('@/features/home/Home') },
  { path: '/login', loader: () => import('@/features/auth/Login') },
];

// helper to convert dynamic import into a React.LazyExoticComponent
const toLazy = (factory: () => Promise<any>) =>
  React.lazy(() => factory().then((m) => ({ default: m.default ?? Object.values(m)[0] })));

// AuthGuard placeholder - intentionally no auth logic here. Keep it as a
// drop-in place for real checks later (context/cookie/API). It simply allows
// composition without coupling the router to any auth implementation.
function AuthGuard({ children, protectedRoute }: { children: React.ReactNode; protectedRoute?: boolean }) {
  if (!protectedRoute) return <>{children}</>;
  // no-op guard: when you add real auth, replace the next two lines.
  const isAuthed = 1;//!!localStorage.getItem('auth_token');
  if (!isAuthed) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {routes.map((r) => {
          const Comp = toLazy(r.loader);
          return (
            <Route
              key={r.path}
              path={r.path}
              element={
                <AuthGuard protectedRoute={r.protected}>
                  <React.Suspense fallback={<Loading />}>
                    <Comp />
                  </React.Suspense>
                </AuthGuard>
              }
            />
          );
        })}

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;