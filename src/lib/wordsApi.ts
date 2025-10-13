// src/lib/wordsApi.ts

import axios from 'axios';
import type { Word } from '@/types';
import { validateWordRange } from './validation';

const API_BASE_URL = 'https://o3dehrjo4mwajqigkou2ii3fra0ycspw.lambda-url.ap-northeast-1.on.aws';

// シンプルなインメモリキャッシュ
const wordsCache = new Map<string, Word[]>();

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
    return cached;
  }
  
  try {
    const response = await axios.get<Word[]>(API_BASE_URL, {
      params: { start, end },
      timeout: 10000, // 10秒タイムアウト
    });
    
    // レスポンスの検証
    if (!Array.isArray(response.data)) {
      throw new Error('不正なレスポンス形式です');
    }
    
    // キャッシュに保存
    wordsCache.set(cacheKey, response.data);
    
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
