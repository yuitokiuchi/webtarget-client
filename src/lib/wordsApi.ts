// src/lib/wordsApi.ts

import axios from 'axios';
import type { Word } from '@/types';
import { validateWordRange } from './validation';
import { API_CONFIG } from '@/config/constants';

// シンプルなインメモリキャッシュ
const wordsCache = new Map<string, { data: Word[]; timestamp: number }>();

/**
 * キャッシュキーの生成
 */
const getCacheKey = (start: number, end: number): string => `${start}-${end}`;

/**
 * 単語リストを取得
 * @param start 開始範囲（1-1900）
 * @param end 終了範囲（1-1900）
 * @returns 単語の配列
 * @throws エラー時は詳細なメッセージを含むErrorをスロー
 */
export const fetchWords = async (start: number, end: number): Promise<Word[]> => {
  // バリデーション
  const validation = validateWordRange(start, end);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }
  
  // キャッシュチェック
  const cacheKey = getCacheKey(start, end);
  const cached = wordsCache.get(cacheKey);
  if (cached) {
    // キャッシュの有効期限チェック
    const now = Date.now();
    if (now - cached.timestamp < API_CONFIG.CACHE_DURATION) {
      return cached.data;
    }
    // 期限切れの場合はキャッシュを削除
    wordsCache.delete(cacheKey);
  }
  
  try {
    const response = await axios.get<Word[]>(API_CONFIG.BASE_URL, {
      params: { start, end },
      timeout: API_CONFIG.TIMEOUT,
    });
    
    // レスポンスの検証
    if (!Array.isArray(response.data)) {
      throw new Error('不正なレスポンス形式です');
    }
    
    // キャッシュに保存（タイムスタンプ付き）
    wordsCache.set(cacheKey, {
      data: response.data,
      timestamp: Date.now(),
    });
    
    return response.data;
  } catch (error) {
    // Axiosエラーの詳細なハンドリング
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as any;
      
      if (axiosError.code === 'ECONNABORTED') {
        throw new Error('リクエストがタイムアウトしました。もう一度お試しください');
      }
      
      if (!axiosError.response) {
        throw new Error('ネットワークに接続できません。接続を確認してください');
      }
      
      throw new Error(`サーバーエラー: ${axiosError.response.status}`);
    }
    
    throw new Error('単語の取得に失敗しました');
  }
};

/**
 * 文字列を正規化（スペリング判定用）
 * - 前後の空白を削除
 * - 小文字に変換
 * - 連続する空白を1つに
 */
const normalizeString = (str: string): string => {
  return str.trim().toLowerCase().replace(/\s+/g, ' ');
};

/**
 * スペリングの正誤判定（瞬時判定）
 * @param userAnswer ユーザーの回答
 * @param correctWord 正しい単語
 * @returns 正誤判定結果
 */
export const checkSpelling = (userAnswer: string, correctWord: string): boolean => {
  // 空文字チェック
  if (!userAnswer || !correctWord) {
    return false;
  }
  
  // 正規化して比較
  return normalizeString(userAnswer) === normalizeString(correctWord);
};

/**
 * キャッシュをクリア（テストや強制再読み込み用）
 */
export const clearCache = (): void => {
  wordsCache.clear();
};
