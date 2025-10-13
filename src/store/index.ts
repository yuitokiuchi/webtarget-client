// src/store/index.ts

import { configureStore } from '@reduxjs/toolkit';
import rootReducer from './rootReducer';
import { createStorageMiddleware } from '@/lib/storageMiddleware';

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(createStorageMiddleware()),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
