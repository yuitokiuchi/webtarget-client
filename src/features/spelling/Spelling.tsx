// src/features/spelling/Spelling.tsx

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '@/hooks/useAppSelector';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useSpelling } from './hooks/useSpelling';
import { calculateStats } from '@/lib';
import { endReviewMode } from '@/features/spelling/spellingSlice';

const Spelling = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isReviewMode } = useAppSelector(state => state.spelling);
  const {
    currentWord,
    userInput,
    showFeedback,
    isCorrectAnswer,
    allCorrect,
    words,
    answers,
    handleKeyDown,
    handleInputChange,
    handleSubmit,
    handleNext,
  } = useSpelling();

  // 単語がない場合はホームに戻る（復習モードを除く）
  useEffect(() => {
    if (words.length === 0 && !isReviewMode) {
      navigate('/');
    }
  }, [words.length, navigate, isReviewMode]);

  // すべて正解したら結果画面へ
  useEffect(() => {
    if (allCorrect && words.length > 0) {
      // 復習モードを終了してから結果画面へ
      if (isReviewMode) {
        dispatch(endReviewMode());
      }
      navigate('/result');
    }
  }, [allCorrect, words.length, isReviewMode, dispatch, navigate]);

  if (!currentWord) {
    return (
      <div className="min-h-screen bg-[var(--color-light-bg)] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[var(--color-light-text-subtle)]">Loading words...</p>
        </div>
      </div>
    );
  }

  // 統計計算
  const stats = calculateStats(answers, words);

  // ホームに戻る
  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[var(--color-light-bg)] text-[var(--color-light-text)] px-6 py-8">
      <div className="w-full max-w-2xl mx-auto">
        {/* Home Button */}
        <div className="mb-4">
          <button
            onClick={handleGoHome}
            className="text-sm text-[var(--color-light-text-muted)] hover:text-[var(--color-light-text)] transition-colors flex items-center gap-1"
            aria-label="Go to home"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Home</span>
          </button>
        </div>

        {/* Review Mode Badge */}
        {isReviewMode && (
          <div className="mb-4 text-center">
            <span className="inline-block px-4 py-2 bg-[var(--color-gray-200)] text-[var(--color-light-text-muted)] rounded-full text-sm font-light">
              Review Mode
            </span>
          </div>
        )}

        {/* Stats Header */}
        <div className="flex items-center justify-between mb-6 text-sm text-[var(--color-light-text-muted)]">
          <div className="flex items-center gap-6">
            <span>
              <span className="text-[var(--color-light-text)] font-medium">{stats.correct}</span>
              {' / '}
              <span className="text-[var(--color-light-text)]">{stats.total}</span>
            </span>
            {stats.total > 0 && (
              <span className="text-[var(--color-light-text-subtle)]">
                Accuracy: {stats.accuracy}%
              </span>
            )}
          </div>
          <span className="text-xs">
            Press Enter
          </span>
        </div>

        {/* Word Card */}
        <div 
          className="bg-[var(--color-light-surface)] border border-[var(--color-light-border)] rounded-xl p-8 shadow-sm"
          tabIndex={-1}
        >
          {/* Japanese Meaning & Part of Speech */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-light mb-3">
              {currentWord.japanese_meaning}
            </h1>
            <span className="inline-block px-3 py-1 text-xs bg-[var(--color-gray-100)] text-[var(--color-light-text-muted)] rounded-full">
              {currentWord.part_of_speech}
            </span>
          </div>

          {/* Input Area */}
          <div className="max-w-md mx-auto">
            <div className="relative">
              <input
                type="text"
                value={userInput}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={showFeedback ? '' : 'Type the spelling...'}
                readOnly={showFeedback}
                className="w-full px-6 py-3 text-center text-xl font-light bg-white border-2 border-[var(--color-light-border)] rounded-lg focus:outline-none focus:border-[var(--color-light-text)] transition-colors read-only:bg-[var(--color-gray-100)] read-only:cursor-default"
                autoFocus
              />

              {/* Feedback Overlay */}
              {showFeedback && (
                <div
                  className={`absolute inset-0 flex items-center justify-center rounded-lg backdrop-blur-sm ${
                    isCorrectAnswer
                      ? 'bg-[var(--color-success-500)] border-[var(--color-success-500)]'
                      : 'bg-[var(--color-error-500)] border-[var(--color-error-500)]'
                  } bg-opacity-20 border-2`}
                >
                  <div className="text-center bg-white rounded-lg px-6 py-3 shadow-lg">
                    <div className={`text-4xl mb-1 ${
                      isCorrectAnswer
                        ? 'text-[var(--color-success-500)]'
                        : 'text-[var(--color-error-500)]'
                    }`}>
                      {isCorrectAnswer ? '✓' : '✗'}
                    </div>
                    {!isCorrectAnswer && (
                      <div className="text-base text-[var(--color-error-500)] font-medium">
                        {currentWord.word}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Action Button */}
            <div className="mt-4">
              <button
                onClick={showFeedback ? handleNext : handleSubmit}
                className="w-full bg-[var(--color-light-text)] text-white py-3 rounded-lg font-light tracking-wide hover:opacity-90 active:opacity-80 transition-opacity"
              >
                {showFeedback ? 'Next' : 'Submit'}
              </button>
            </div>

            {/* Help Text */}
            <div className="mt-3 text-center">
              {showFeedback ? (
                <p className="text-xs text-[var(--color-light-text-subtle)]">
                  Press <kbd>Enter</kbd> to continue
                </p>
              ) : (
                <p className="text-xs text-[var(--color-light-text-subtle)]">
                  Press <kbd>Enter</kbd> to submit
                </p>
              )}
            </div>
          </div>

          {/* Zoom Tip */}
          <div className="mt-12 text-center">
            <p className="text-xs text-[var(--color-light-text-subtle)]">
              拡大縮小: <kbd>Ctrl</kbd> + <kbd>+</kbd> / <kbd>-</kbd>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Spelling;
