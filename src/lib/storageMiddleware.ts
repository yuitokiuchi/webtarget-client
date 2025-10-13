// src/lib/storageMiddleware.ts

import type { Middleware } from '@reduxjs/toolkit';
import { saveSpellingSession, type SpellingSession } from './storage';

/**
 * Redux状態をLocalStorageに自動保存するミドルウェア
 * 
 * 対象アクション:
 * - spelling/setConfig
 * - spelling/submitAnswer
 * - spelling/nextWord
 * - spelling/previousWord
 * - spelling/goToWord
 * - spelling/loadWords/fulfilled
 */
export const createStorageMiddleware = (): Middleware => {
  return (store) => (next) => (action: any) => {
    const result = next(action);
    
    // 保存対象のアクションタイプ
    const saveActions = [
      'spelling/setConfig',
      'spelling/submitAnswer',
      'spelling/nextWord',
      'spelling/previousWord',
      'spelling/goToWord',
      'spelling/loadWords/fulfilled',
    ];
    
    // アクションタイプをチェック
    if (action?.type && saveActions.some(type => action.type.startsWith(type))) {
      const state = store.getState() as any;
      const { spelling } = state;
      
      // セッションデータを構築
      if (spelling.words.length > 0) {
        const session: SpellingSession = {
          startRange: spelling.startRange,
          endRange: spelling.endRange,
          currentIndex: spelling.currentIndex,
          answers: spelling.answers,
          showImages: spelling.showImages,
          startedAt: Date.now(), // 実際には初回保存時のタイムスタンプを使うべき
          lastUpdatedAt: Date.now(),
        };
        
        saveSpellingSession(session);
      }
    }
    
    return result;
  };
};
