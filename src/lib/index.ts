// src/lib/index.ts

/**
 * ライブラリモジュールの統合エクスポート
 * 
 * 使用例:
 * import { fetchWords, checkSpelling, calculateStats } from '@/lib';
 */

// 単語API
export { fetchWords, checkSpelling, clearCache } from './wordsApi';

// バリデーション
export { validateWordRange, validateAnswer, sanitizeNumber, WORD_RANGE } from './validation';

// スペリングユーティリティ
export {
  calculateStats,
  calculateProgress,
  getAnswerForWord,
  getUnansweredWords,
  getIncorrectWords,
  getWordCount,
  shuffleWords,
  getNextWordIndex,
  isAllCorrect,
  getLatestAnswerMap,
} from './spellingUtils';

// ストレージ（永続化）
export {
  saveSpellingSession,
  loadSpellingSession,
  clearSpellingSession,
  isSessionValid,
  saveSpellingConfig,
  loadSpellingConfig,
  getDefaultConfig,
  saveSpellingHistory,
  loadSpellingHistory,
  clearSpellingHistory,
  getHistoryStats,
  clearAllData,
  getStorageInfo,
} from './storage';

// ストレージミドルウェア
export { createStorageMiddleware } from './storageMiddleware';

export type { SpellingStats } from './spellingUtils';
export type { ValidationResult } from './validation';
export type { SpellingSession, SpellingConfig, SpellingHistoryEntry } from './storage';

