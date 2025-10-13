// src/lib/spellingUtils.ts

import type { Word, SpellingAnswer } from '@/types';

/**
 * スペリング結果の統計情報
 */
export interface SpellingStats {
  total: number;
  correct: number;
  incorrect: number;
  accuracy: number; // パーセンテージ（0-100）
}

/**
 * 回答履歴から統計を計算
 * @param answers 回答の配列
 * @returns 統計情報
 */
export const calculateStats = (answers: SpellingAnswer[]): SpellingStats => {
  const total = answers.length;
  const correct = answers.filter(a => a.isCorrect).length;
  const incorrect = total - correct;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

  return { total, correct, incorrect, accuracy };
};

/**
 * 現在の進捗を計算
 * @param currentIndex 現在のインデックス
 * @param totalWords 総単語数
 * @returns 進捗パーセンテージ（0-100）
 */
export const calculateProgress = (currentIndex: number, totalWords: number): number => {
  if (totalWords === 0) return 0;
  return Math.round(((currentIndex + 1) / totalWords) * 100);
};

/**
 * 特定の単語の回答を取得
 * @param answers 回答の配列
 * @param wordId 単語ID
 * @returns 回答または undefined
 */
export const getAnswerForWord = (
  answers: SpellingAnswer[],
  wordId: number
): SpellingAnswer | undefined => {
  return answers.find(a => a.wordId === wordId);
};

/**
 * 未回答の単語をフィルタリング
 * @param words 単語の配列
 * @param answers 回答の配列
 * @returns 未回答の単語の配列
 */
export const getUnansweredWords = (words: Word[], answers: SpellingAnswer[]): Word[] => {
  const answeredIds = new Set(answers.map(a => a.wordId));
  return words.filter(w => !answeredIds.has(w.id));
};

/**
 * 不正解の単語をフィルタリング
 * @param words 単語の配列
 * @param answers 回答の配列
 * @returns 不正解だった単語の配列
 */
export const getIncorrectWords = (words: Word[], answers: SpellingAnswer[]): Word[] => {
  const incorrectIds = new Set(
    answers.filter(a => !a.isCorrect).map(a => a.wordId)
  );
  return words.filter(w => incorrectIds.has(w.id));
};

/**
 * 範囲から単語数を計算
 * @param start 開始範囲
 * @param end 終了範囲
 * @returns 単語数
 */
export const getWordCount = (start: number, end: number): number => {
  return Math.max(0, end - start + 1);
};

/**
 * 単語リストをシャッフル（ランダム出題用）
 * @param words 単語の配列
 * @returns シャッフルされた配列（元の配列は変更しない）
 */
export const shuffleWords = (words: Word[]): Word[] => {
  const shuffled = [...words];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/**
 * 次に出題する単語を取得（未正解の単語からランダム）
 * @param words 全単語リスト
 * @param answers 回答履歴
 * @returns 次のインデックス、または完了の場合は null
 */
export const getNextWordIndex = (
  words: Word[],
  answers: SpellingAnswer[]
): number | null => {
  // 各単語の最新の回答状況をマップ化
  const answerMap = new Map<number, SpellingAnswer>();
  answers.forEach(answer => {
    const existing = answerMap.get(answer.wordId);
    if (!existing || answers.indexOf(answer) > answers.indexOf(existing)) {
      answerMap.set(answer.wordId, answer);
    }
  });

  // 未回答または不正解の単語のインデックスを集める
  const incorrectIndices: number[] = [];
  words.forEach((word, index) => {
    const answer = answerMap.get(word.id);
    if (!answer || !answer.isCorrect) {
      incorrectIndices.push(index);
    }
  });

  // 未正解の単語がない場合は完了
  if (incorrectIndices.length === 0) {
    return null;
  }

  // ランダムに選択
  const randomIndex = Math.floor(Math.random() * incorrectIndices.length);
  return incorrectIndices[randomIndex];
};

/**
 * すべての単語に正解したか確認
 * @param words 全単語リスト
 * @param answers 回答履歴
 * @returns すべて正解なら true
 */
export const isAllCorrect = (words: Word[], answers: SpellingAnswer[]): boolean => {
  // 各単語の最新の回答状況をチェック
  const answerMap = new Map<number, SpellingAnswer>();
  answers.forEach(answer => {
    const existing = answerMap.get(answer.wordId);
    if (!existing || answers.indexOf(answer) > answers.indexOf(existing)) {
      answerMap.set(answer.wordId, answer);
    }
  });

  // すべての単語が正解かチェック
  return words.every(word => {
    const answer = answerMap.get(word.id);
    return answer && answer.isCorrect;
  });
};

/**
 * 各単語の最終回答状況を取得
 * @param words 全単語リスト
 * @param answers 回答履歴
 * @returns 単語IDをキーとした回答状況のマップ
 */
export const getLatestAnswerMap = (
  answers: SpellingAnswer[]
): Map<number, SpellingAnswer> => {
  const answerMap = new Map<number, SpellingAnswer>();
  answers.forEach(answer => {
    const existing = answerMap.get(answer.wordId);
    if (!existing || answers.indexOf(answer) > answers.indexOf(existing)) {
      answerMap.set(answer.wordId, answer);
    }
  });
  return answerMap;
};
