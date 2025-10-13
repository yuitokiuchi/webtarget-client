// src/features/result/hooks/useResult.ts

import { useMemo } from 'react';
import { useAppSelector } from '@/hooks/useAppSelector';
import {
  getMistakeStatsByWord,
  getIncorrectWordStats,
  getCorrectWordStats,
  calculateResultStats,
} from '@/lib/resultUtils';

/**
 * 結果画面のロジックを管理するカスタムフック
 * UIから独立した状態管理とビジネスロジック
 */
export const useResult = () => {
  const { words, answers } = useAppSelector(state => state.spelling);

  // 全単語の統計（間違い回数の多い順）
  const allWordStats = useMemo(
    () => getMistakeStatsByWord(words, answers),
    [words, answers]
  );

  // 間違えた単語のみ（間違い回数の多い順）
  const incorrectWords = useMemo(
    () => getIncorrectWordStats(words, answers),
    [words, answers]
  );

  // 正解した単語のみ
  const correctWords = useMemo(
    () => getCorrectWordStats(words, answers),
    [words, answers]
  );

  // 結果統計
  const stats = useMemo(
    () => calculateResultStats(words, answers),
    [words, answers]
  );

  // データが存在するかチェック
  const hasData = words.length > 0 && answers.length > 0;

  return {
    allWordStats,
    incorrectWords,
    correctWords,
    stats,
    hasData,
  };
};

export type UseResultReturn = ReturnType<typeof useResult>;
