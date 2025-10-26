// src/config/constants.ts

/**
 * アプリケーション全体の定数設定
 * Single Source of Truth for all configuration values
 */

/**
 * 単語範囲の制約
 */
export const WORD_RANGE = {
  /** 最小単語番号 */
  MIN: 1,
  /** 最大単語番号 */
  MAX: 1900,
} as const;

/**
 * デフォルト設定
 */
export const DEFAULT_CONFIG = {
  /** デフォルトの開始範囲 */
  startRange: 1521,
  /** デフォルトの終了範囲 */
  endRange: 1600,
  /** 画像表示のデフォルト */
  showImages: true,
} as const;

/**
 * セッション設定
 */
export const SESSION_CONFIG = {
  /** セッションの有効期限（ミリ秒） */
  VALIDITY_DURATION: 24 * 60 * 60 * 1000, // 24時間
  /** LocalStorageのキー名 */
  STORAGE_KEY: 'webtarget_spelling_session',
} as const;

/**
 * API設定
 */
export const API_CONFIG = {
  /** APIベースURL */
  BASE_URL: 'https://o3dehrjo4mwajqigkou2ii3fra0ycspw.lambda-url.ap-northeast-1.on.aws/',
  /** キャッシュの有効期限（ミリ秒） */
  CACHE_DURATION: 30 * 60 * 1000, // 30分
  /** タイムアウト（ミリ秒） */
  TIMEOUT: 10000, // 10秒
} as const;

/**
 * UI設定
 */
export const UI_CONFIG = {
  /** アプリケーション名 */
  APP_NAME: 'WebTarget',
  /** サブタイトル */
  SUBTITLE: '1900 Words Spelling',
  /** コピーライト年 */
  COPYRIGHT_YEAR: 2025,
} as const;

// 型エクスポート（必要に応じて）
export type WordRange = typeof WORD_RANGE;
export type DefaultConfig = typeof DEFAULT_CONFIG;
export type SessionConfig = typeof SESSION_CONFIG;
export type ApiConfig = typeof API_CONFIG;
export type UiConfig = typeof UI_CONFIG;
