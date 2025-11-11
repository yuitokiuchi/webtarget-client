// src/routes/AppRouter.tsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Loading from './Loading';
import NotFound from './NotFound';

// route config: each entry describes path and a factory for the lazy-loaded component.
const routes: Array<{
  path: string;
  loader: () => Promise<any>;
}> = [
  { path: '/', loader: () => import('@/features/home/Home') },
  { path: '/spelling', loader: () => import('@/features/spelling/Spelling') },
  { path: '/result', loader: () => import('@/features/result/Result') },
];

// helper to convert dynamic import into a React.LazyExoticComponent
const toLazy = (factory: () => Promise<any>) =>
  React.lazy(() => factory().then((m) => ({ default: m.default ?? Object.values(m)[0] })));

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
                <React.Suspense fallback={<Loading />}>
                  <Comp />
                </React.Suspense>
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