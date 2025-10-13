// src/lib/validation.ts

/**
 * 単語範囲の定数
 */
export const WORD_RANGE = {
  MIN: 1,
  MAX: 1900,
} as const;

/**
 * バリデーション結果
 */
export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * 単語範囲のバリデーション
 * @param start 開始範囲
 * @param end 終了範囲
 * @returns バリデーション結果
 */
export const validateWordRange = (start: number, end: number): ValidationResult => {
  // 整数チェック
  if (!Number.isInteger(start) || !Number.isInteger(end)) {
    return {
      isValid: false,
      error: '開始位置と終了位置は整数である必要があります',
    };
  }

  // 範囲チェック
  if (start < WORD_RANGE.MIN || end > WORD_RANGE.MAX) {
    return {
      isValid: false,
      error: `範囲は${WORD_RANGE.MIN}から${WORD_RANGE.MAX}の間で指定してください`,
    };
  }

  // 開始・終了の整合性チェック
  if (start > end) {
    return {
      isValid: false,
      error: '開始位置は終了位置より小さい値を指定してください',
    };
  }

  return { isValid: true };
};

/**
 * 入力値のサニタイズ（数値変換）
 * @param value 入力値（文字列または数値）
 * @param defaultValue デフォルト値
 * @returns サニタイズされた数値
 */
export const sanitizeNumber = (
  value: string | number,
  defaultValue: number
): number => {
  const num = typeof value === 'string' ? parseInt(value, 10) : value;
  return Number.isNaN(num) ? defaultValue : num;
};

/**
 * 回答文字列のバリデーション
 * @param answer ユーザーの回答
 * @returns バリデーション結果
 */
export const validateAnswer = (answer: string): ValidationResult => {
  // 空文字チェック
  if (!answer || answer.trim().length === 0) {
    return {
      isValid: false,
      error: '回答を入力してください',
    };
  }

  // 文字数チェック（異常に長い入力を防ぐ）
  if (answer.length > 100) {
    return {
      isValid: false,
      error: '回答が長すぎます',
    };
  }

  // 英字チェック（オプション：英単語のみを許可する場合）
  // const isEnglishOnly = /^[a-zA-Z\s'-]+$/.test(answer.trim());
  // if (!isEnglishOnly) {
  //   return {
  //     isValid: false,
  //     error: '英字のみを入力してください',
  //   };
  // }

  return { isValid: true };
};
