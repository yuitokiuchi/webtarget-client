// src/lib/storage.ts

import type { SpellingAnswer } from '@/types';

/**
 * LocalStorageのキー定数
 */
const STORAGE_KEYS = {
  SPELLING_STATE: 'webtarget_spelling_state',
  SPELLING_CONFIG: 'webtarget_spelling_config',
  SPELLING_HISTORY: 'webtarget_spelling_history',
} as const;

/**
 * スペリングセッション状態（永続化対象）
 */
export interface SpellingSession {
  startRange: number;
  endRange: number;
  currentIndex: number;
  answers: SpellingAnswer[];
  showImages: boolean;
  startedAt: number; // タイムスタンプ
  lastUpdatedAt: number; // タイムスタンプ
}

/**
 * スペリング設定（ユーザー設定の永続化）
 */
export interface SpellingConfig {
  defaultStartRange: number;
  defaultEndRange: number;
  defaultShowImages: boolean;
}

/**
 * スペリング履歴の1エントリ
 */
export interface SpellingHistoryEntry {
  id: string;
  startRange: number;
  endRange: number;
  totalWords: number;
  correctWords: number;
  accuracy: number;
  completedAt: number; // タイムスタンプ
  duration: number; // 秒数
}

/**
 * LocalStorageへの安全な書き込み
 */
const safeSetItem = (key: string, value: any): boolean => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Failed to save to localStorage: ${key}`, error);
    return false;
  }
};

/**
 * LocalStorageからの安全な読み込み
 */
const safeGetItem = <T>(key: string): T | null => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error(`Failed to load from localStorage: ${key}`, error);
    return null;
  }
};

/**
 * LocalStorageからの安全な削除
 */
const safeRemoveItem = (key: string): boolean => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Failed to remove from localStorage: ${key}`, error);
    return false;
  }
};

// ========== スペリングセッション管理 ==========

/**
 * 現在のスペリングセッションを保存
 */
export const saveSpellingSession = (session: SpellingSession): boolean => {
  const sessionWithTimestamp = {
    ...session,
    lastUpdatedAt: Date.now(),
  };
  return safeSetItem(STORAGE_KEYS.SPELLING_STATE, sessionWithTimestamp);
};

/**
 * スペリングセッションを読み込み
 */
export const loadSpellingSession = (): SpellingSession | null => {
  return safeGetItem<SpellingSession>(STORAGE_KEYS.SPELLING_STATE);
};

/**
 * スペリングセッションをクリア
 */
export const clearSpellingSession = (): boolean => {
  return safeRemoveItem(STORAGE_KEYS.SPELLING_STATE);
};

/**
 * セッションが有効か確認（24時間以内）
 */
export const isSessionValid = (session: SpellingSession | null): boolean => {
  if (!session) return false;
  
  const now = Date.now();
  const twentyFourHours = 24 * 60 * 60 * 1000;
  
  return (now - session.lastUpdatedAt) < twentyFourHours;
};

// ========== スペリング設定管理 ==========

/**
 * スペリング設定を保存
 */
export const saveSpellingConfig = (config: SpellingConfig): boolean => {
  return safeSetItem(STORAGE_KEYS.SPELLING_CONFIG, config);
};

/**
 * スペリング設定を読み込み
 */
export const loadSpellingConfig = (): SpellingConfig | null => {
  return safeGetItem<SpellingConfig>(STORAGE_KEYS.SPELLING_CONFIG);
};

/**
 * デフォルト設定を取得
 */
export const getDefaultConfig = (): SpellingConfig => ({
  defaultStartRange: 1,
  defaultEndRange: 100,
  defaultShowImages: true,
});

// ========== スペリング履歴管理 ==========

/**
 * 履歴を保存（最新10件まで保持）
 */
export const saveSpellingHistory = (entry: Omit<SpellingHistoryEntry, 'id'>): boolean => {
  const history = loadSpellingHistory();
  
  const newEntry: SpellingHistoryEntry = {
    ...entry,
    id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  };
  
  // 最新10件のみ保持
  const updatedHistory = [newEntry, ...history].slice(0, 10);
  
  return safeSetItem(STORAGE_KEYS.SPELLING_HISTORY, updatedHistory);
};

/**
 * 履歴を読み込み
 */
export const loadSpellingHistory = (): SpellingHistoryEntry[] => {
  return safeGetItem<SpellingHistoryEntry[]>(STORAGE_KEYS.SPELLING_HISTORY) || [];
};

/**
 * 履歴をクリア
 */
export const clearSpellingHistory = (): boolean => {
  return safeRemoveItem(STORAGE_KEYS.SPELLING_HISTORY);
};

/**
 * 統計情報を取得
 */
export const getHistoryStats = () => {
  const history = loadSpellingHistory();
  
  if (history.length === 0) {
    return {
      totalSessions: 0,
      totalWords: 0,
      totalCorrect: 0,
      averageAccuracy: 0,
      bestAccuracy: 0,
    };
  }
  
  const totalSessions = history.length;
  const totalWords = history.reduce((sum, entry) => sum + entry.totalWords, 0);
  const totalCorrect = history.reduce((sum, entry) => sum + entry.correctWords, 0);
  const averageAccuracy = Math.round(
    history.reduce((sum, entry) => sum + entry.accuracy, 0) / totalSessions
  );
  const bestAccuracy = Math.max(...history.map(entry => entry.accuracy));
  
  return {
    totalSessions,
    totalWords,
    totalCorrect,
    averageAccuracy,
    bestAccuracy,
  };
};

// ========== ユーティリティ ==========

/**
 * すべてのデータをクリア
 */
export const clearAllData = (): boolean => {
  const results = [
    clearSpellingSession(),
    safeRemoveItem(STORAGE_KEYS.SPELLING_CONFIG),
    clearSpellingHistory(),
  ];
  
  return results.every(result => result);
};

/**
 * ストレージの使用状況を取得（デバッグ用）
 */
export const getStorageInfo = () => {
  const session = loadSpellingSession();
  const config = loadSpellingConfig();
  const history = loadSpellingHistory();
  
  return {
    hasSession: !!session,
    hasConfig: !!config,
    historyCount: history.length,
    isSessionValid: isSessionValid(session),
  };
};
