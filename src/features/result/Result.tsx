// src/features/result/Result.tsx

import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAppSelector } from '@/hooks/useAppSelector';
import { useResult } from './hooks/useResult';
import { resetAll, startReviewMode } from '@/features/spelling/spellingSlice';
import { type WordMistakeStats } from '@/lib/resultUtils';

const Result = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { incorrectWords, stats, hasData } = useResult();
  const { isReviewMode } = useAppSelector(state => state.spelling);
  const prevReviewModeRef = useRef(isReviewMode);

  // データがない場合はホームに戻る（復習モード開始時を除く）
  useEffect(() => {
    if (!hasData && !isReviewMode) {
      navigate('/');
    }
  }, [hasData, isReviewMode, navigate]);

  // 復習モードが開始されたらスペリング画面に遷移（false → true の変化のみ）
  useEffect(() => {
    if (!prevReviewModeRef.current && isReviewMode) {
      navigate('/spelling');
    }
    prevReviewModeRef.current = isReviewMode;
  }, [isReviewMode, navigate]);

  if (!hasData && !isReviewMode) {
    return null;
  }

  // もう一度やり直す
  const handleRetry = () => {
    dispatch(resetAll());
    navigate('/');
  };

  // ホームに戻る
  const handleHome = () => {
    dispatch(resetAll());
    navigate('/');
  };

  // 間違えた問題だけ復習
  const handleReview = () => {
    console.log('=== handleReview called ===');
    console.log('incorrectWords.length:', incorrectWords.length);
    
    if (incorrectWords.length === 0) return;

    // 間違えた単語のリストを抽出
    const incorrectWordList = incorrectWords.map(stat => stat.word);
    console.log('incorrectWordList:', incorrectWordList);

    // 復習モードを開始（useEffectで遷移する）
    dispatch(startReviewMode({ incorrectWords: incorrectWordList }));
    console.log('startReviewMode dispatched');
  };

  return (
    <div className="min-h-screen bg-[var(--color-light-bg)] text-[var(--color-light-text)] px-6 py-8">
      <div className="w-full max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-light mb-4">Result</h1>
          <div className="w-16 h-px bg-[var(--color-light-border)] mx-auto" />
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {/* Accuracy */}
          <div className="bg-[var(--color-light-surface)] border border-[var(--color-light-border)] rounded-lg p-4 text-center">
            <div className="text-3xl font-light text-[var(--color-success-500)] mb-1">
              {stats.accuracy}%
            </div>
            <div className="text-xs text-[var(--color-light-text-subtle)] uppercase tracking-wide">
              Accuracy
            </div>
          </div>

          {/* Correct */}
          <div className="bg-[var(--color-light-surface)] border border-[var(--color-light-border)] rounded-lg p-4 text-center">
            <div className="text-3xl font-light text-[var(--color-success-500)] mb-1">
              {stats.correctWords}
            </div>
            <div className="text-xs text-[var(--color-light-text-subtle)] uppercase tracking-wide">
              Correct
            </div>
          </div>

          {/* Incorrect */}
          <div className="bg-[var(--color-light-surface)] border border-[var(--color-light-border)] rounded-lg p-4 text-center">
            <div className="text-3xl font-light text-[var(--color-error-500)] mb-1">
              {stats.incorrectWords}
            </div>
            <div className="text-xs text-[var(--color-light-text-subtle)] uppercase tracking-wide">
              Incorrect
            </div>
          </div>

          {/* Total Attempts */}
          <div className="bg-[var(--color-light-surface)] border border-[var(--color-light-border)] rounded-lg p-4 text-center">
            <div className="text-3xl font-light mb-1">
              {stats.totalAttempts}
            </div>
            <div className="text-xs text-[var(--color-light-text-subtle)] uppercase tracking-wide">
              Attempts
            </div>
          </div>
        </div>

        {/* Incorrect Words List */}
        {incorrectWords.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-light text-[var(--color-light-text-muted)] tracking-wide mb-4">
              Incorrect Words ({incorrectWords.length})
            </h2>
            
            {/* Scrollable List */}
            <div 
              className="bg-[var(--color-light-surface)] border border-[var(--color-light-border)] rounded-lg overflow-hidden"
              style={{ maxHeight: '400px', overflowY: 'auto' }}
            >
              {incorrectWords.map((stat, index) => (
                <WordMistakeItem key={stat.word.id} stat={stat} index={index} />
              ))}
            </div>
          </div>
        )}

        {/* All Correct Message */}
        {incorrectWords.length === 0 && (
          <div className="bg-[var(--color-success-100)] border border-[var(--color-success-500)] rounded-lg px-6 py-8 text-center mb-8">
            <div className="text-4xl mb-3">🎉</div>
            <div className="text-lg font-light text-[var(--color-success-500)]">
              Perfect Score!
            </div>
            <div className="text-sm text-[var(--color-light-text-subtle)] mt-2">
              All words answered correctly
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-4">
          {/* Review Incorrect Words Button (if there are any) */}
          {incorrectWords.length > 0 && (
            <button
              onClick={handleReview}
              className="w-full bg-[var(--color-error-500)] text-white py-3 rounded-lg font-light tracking-wide hover:opacity-90 active:opacity-80 transition-opacity shadow-sm"
            >
              Review Incorrect Words ({incorrectWords.length})
            </button>
          )}

          {/* Other Buttons */}
          <div className="flex gap-4">
            <button
              onClick={handleRetry}
              className="flex-1 bg-[var(--color-light-text)] text-white py-3 rounded-lg font-light tracking-wide hover:opacity-90 active:opacity-80 transition-opacity"
            >
              Try Again
            </button>
            <button
              onClick={handleHome}
              className="flex-1 bg-[var(--color-light-surface)] border border-[var(--color-light-border)] text-[var(--color-light-text)] py-3 rounded-lg font-light tracking-wide hover:bg-[var(--color-gray-100)] active:bg-[var(--color-gray-200)] transition-colors"
            >
              Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * 間違えた単語の表示アイテム
 */
const WordMistakeItem = ({ stat, index }: { stat: WordMistakeStats; index: number }) => {
  return (
    <div 
      className={`px-6 py-4 flex items-center gap-4 ${
        index !== 0 ? 'border-t border-[var(--color-light-border)]' : ''
      }`}
    >
      {/* Mistake Count Badge */}
      <div className="flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-[var(--color-error-100)] flex items-center justify-center">
          <span className="text-sm font-medium text-[var(--color-error-500)]">
            {stat.mistakeCount}×
          </span>
        </div>
      </div>

      {/* Word Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-3 mb-1">
          <h3 className="text-lg font-light truncate">
            {stat.word.word}
          </h3>
          <span className="text-xs text-[var(--color-light-text-subtle)] flex-shrink-0">
            {stat.word.part_of_speech}
          </span>
        </div>
        <p className="text-sm text-[var(--color-light-text-muted)] truncate">
          {stat.word.japanese_meaning}
        </p>
      </div>

      {/* Attempts */}
      <div className="flex-shrink-0 text-right">
        <div className="text-xs text-[var(--color-light-text-subtle)]">
          {stat.attempts} {stat.attempts === 1 ? 'attempt' : 'attempts'}
        </div>
      </div>
    </div>
  );
};

export default Result;
