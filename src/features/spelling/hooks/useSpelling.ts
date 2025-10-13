// src/features/spelling/hooks/useSpelling.ts

import { useState, useCallback, useEffect } from 'react';
import { useAppSelector } from '@/hooks/useAppSelector';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import {
  submitAnswer,
  goToWord,
  resetSpelling,
} from '@/features/spelling/spellingSlice';
import {
  checkSpelling,
  getNextWordIndex,
  isAllCorrect,
  calculateProgress,
  getLatestAnswerMap,
} from '@/lib';

/**
 * スペリング画面のロジックを管理するカスタムフック
 * UIから独立した状態管理とビジネスロジック
 */
export const useSpelling = () => {
  const dispatch = useAppDispatch();
  const { words, currentIndex, answers, showImages } = useAppSelector(state => state.spelling);

  // ローカル状態
  const [userInput, setUserInput] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrectAnswer, setIsCorrectAnswer] = useState(false);

  // 現在の単語
  const currentWord = words[currentIndex];

  // 進捗計算
  const progress = calculateProgress(currentIndex, words.length);

  // 最新の回答マップ
  const latestAnswerMap = getLatestAnswerMap(answers);

  // 全問正解かチェック
  const allCorrect = isAllCorrect(words, answers);

  // 現在の単語の回答状況
  const currentWordAnswer = currentWord ? latestAnswerMap.get(currentWord.id) : undefined;
  const hasAnswered = !!currentWordAnswer;
  const wasCorrect = currentWordAnswer?.isCorrect ?? false;

  /**
   * 回答を送信
   */
  const handleSubmit = useCallback(() => {
    console.log('handleSubmit called');
    
    if (!currentWord || !userInput.trim()) return;

    console.log('Submitting answer:', {
      word: currentWord.word,
      userInput,
    });

    // スペリング判定
    const isCorrect = checkSpelling(userInput, currentWord.word);

    // Redux に保存
    dispatch(submitAnswer(userInput));

    // フィードバック表示
    setIsCorrectAnswer(isCorrect);
    setShowFeedback(true);

    // 入力をクリア
    setUserInput('');
  }, [currentWord, userInput, dispatch]);

  /**
   * 次の単語へ進む
   */
  const handleNext = useCallback(() => {
    setShowFeedback(false);

    // 次に出題する単語のインデックスを取得（ランダム）
    const nextIndex = getNextWordIndex(words, answers);

    if (nextIndex !== null) {
      dispatch(goToWord(nextIndex));
    }
    // nextIndex が null の場合、すべて正解で完了
  }, [words, answers, dispatch]);

  /**
   * 特定の単語にジャンプ
   */
  const handleGoToWord = useCallback((index: number) => {
    setShowFeedback(false);
    setUserInput('');
    dispatch(goToWord(index));
  }, [dispatch]);

  /**
   * リセット
   */
  const handleReset = useCallback(() => {
    dispatch(resetSpelling());
    setUserInput('');
    setShowFeedback(false);
    setIsCorrectAnswer(false);
  }, [dispatch]);

  /**
   * Enterキーで送信または次へ
   */
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (showFeedback) {
        // フィードバック表示中は次へ
        handleNext();
      } else {
        // 通常時は回答送信
        handleSubmit();
      }
    }
  }, [showFeedback, handleSubmit, handleNext]);

  /**
   * 入力変更
   */
  const handleInputChange = useCallback((value: string) => {
    if (!showFeedback) {
      setUserInput(value);
    }
  }, [showFeedback]);

  // 単語が変わったらフィードバックをリセット
  useEffect(() => {
    setShowFeedback(false);
    setUserInput('');
  }, [currentIndex]);

  // フィードバック状態が変わったら、フィードバックが消えた時にフォーカスを戻す
  useEffect(() => {
    if (!showFeedback) {
      // 少し遅延させてフォーカスを設定
      setTimeout(() => {
        const input = document.querySelector('input[type="text"]') as HTMLInputElement;
        if (input) {
          input.focus();
        }
      }, 50);
    }
  }, [showFeedback]);

  return {
    // 状態
    currentWord,
    userInput,
    showFeedback,
    isCorrectAnswer,
    progress,
    allCorrect,
    hasAnswered,
    wasCorrect,
    words,
    currentIndex,
    answers,
    showImages,
    latestAnswerMap,

    // アクション
    handleSubmit,
    handleNext,
    handleGoToWord,
    handleReset,
    handleKeyDown,
    handleInputChange,
    setUserInput,
  };
};
