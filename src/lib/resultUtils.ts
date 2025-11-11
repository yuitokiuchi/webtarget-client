// src/lib/resultUtils.ts

import type { Word, SpellingAnswer } from '@/types';

/**
 * 単語の間違い統計
 */
export interface WordMistakeStats {
  word: Word;
  mistakeCount: number;
  attempts: number;
  isCorrect: boolean;
  userAnswers: string[];
}

/**
 * 結果統計
 */
export interface ResultStats {
  totalWords: number;
  correctWords: number;
  incorrectWords: number;
  accuracy: number;
  totalAttempts: number;
  duration?: number; // 秒数
}

/**
 * 単語ごとの間違い回数を集計
 * @param words 全単語リスト
 * @param answers 回答履歴
 * @returns 単語ごとの統計（間違い回数の多い順）
 */
export const getMistakeStatsByWord = (
  words: Word[],
  answers: SpellingAnswer[]
): WordMistakeStats[] => {
  // 単語IDをキーとしたマップを作成
  const wordMap = new Map<number, Word>();
  words.forEach(word => wordMap.set(word.id, word));

  // 単語ごとの統計を集計
  const statsMap = new Map<number, {
    mistakeCount: number;
    attempts: number;
    isCorrect: boolean;
    userAnswers: string[];
  }>();

  // 初期化
  words.forEach(word => {
    statsMap.set(word.id, {
      mistakeCount: 0,
      attempts: 0,
      isCorrect: false,
      userAnswers: [],
    });
  });

  // 回答を集計
  answers.forEach(answer => {
    const stats = statsMap.get(answer.wordId);
    if (stats) {
      stats.attempts += 1;
      stats.userAnswers.push(answer.userAnswer);
      if (!answer.isCorrect) {
        stats.mistakeCount += 1;
      } else {
        stats.isCorrect = true;
      }
    }
  });

  // WordMistakeStats 配列に変換
  const result: WordMistakeStats[] = [];
  statsMap.forEach((stats, wordId) => {
    const word = wordMap.get(wordId);
    if (word) {
      result.push({
        word,
        mistakeCount: stats.mistakeCount,
        attempts: stats.attempts,
        isCorrect: stats.isCorrect,
        userAnswers: stats.userAnswers,
      });
    }
  });

  // 間違い回数の多い順にソート（同じ場合は試行回数の多い順）
  result.sort((a, b) => {
    if (b.mistakeCount !== a.mistakeCount) {
      return b.mistakeCount - a.mistakeCount;
    }
    return b.attempts - a.attempts;
  });

  return result;
};

/**
 * 間違えた単語のみを取得（間違い回数の多い順）
 * @param words 全単語リスト
 * @param answers 回答履歴
 * @returns 間違えた単語の統計
 */
export const getIncorrectWordStats = (
  words: Word[],
  answers: SpellingAnswer[]
): WordMistakeStats[] => {
  const allStats = getMistakeStatsByWord(words, answers);
  return allStats.filter(stat => stat.mistakeCount > 0);
};

/**
 * 正解した単語のみを取得
 * @param words 全単語リスト
 * @param answers 回答履歴
 * @returns 正解した単語の統計
 */
export const getCorrectWordStats = (
  words: Word[],
  answers: SpellingAnswer[]
): WordMistakeStats[] => {
  const allStats = getMistakeStatsByWord(words, answers);
  return allStats.filter(stat => stat.isCorrect && stat.mistakeCount === 0);
};

/**
 * 結果統計を計算
 * @param words 全単語リスト
 * @param answers 回答履歴
 * @param startTime 開始時刻（タイムスタンプ）
 * @returns 結果統計
 */
export const calculateResultStats = (
  words: Word[],
  answers: SpellingAnswer[],
  startTime?: number
): ResultStats => {
  const allStats = getMistakeStatsByWord(words, answers);
  
  // 最終的に正解した単語数
  const correctWords = allStats.filter(stat => stat.isCorrect).length;
  
  // 途中で間違えた単語数（最終的に正解していても、途中で間違えた場合はカウント）
  const incorrectWords = allStats.filter(stat => stat.mistakeCount > 0).length;
  
  const totalWords = words.length;
  
  // 正解率は「正解した単語数 / (正解した単語数 + 間違えた単語数)」
  // 結果画面では全単語に回答しているので、correctWords + incorrectWords = totalWords
  const totalAnswered = correctWords + incorrectWords;
  const accuracy = totalAnswered > 0 ? Math.round((correctWords / totalAnswered) * 100) : 0;
  
  // 総試行回数は answers.length
  const totalAttempts = answers.length;

  const result: ResultStats = {
    totalWords,
    correctWords,
    incorrectWords,
    accuracy,
    totalAttempts,
  };

  // 所要時間の計算
  if (startTime) {
    const duration = Math.floor((Date.now() - startTime) / 1000); // 秒数
    result.duration = duration;
  }

  return result;
};

/**
 * 時間を人間が読みやすい形式に変換
 * @param seconds 秒数
 * @returns フォーマットされた時間文字列
 */
export const formatDuration = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes < 60) {
    return remainingSeconds > 0 
      ? `${minutes}m ${remainingSeconds}s`
      : `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return remainingMinutes > 0
    ? `${hours}h ${remainingMinutes}m`
    : `${hours}h`;
};
