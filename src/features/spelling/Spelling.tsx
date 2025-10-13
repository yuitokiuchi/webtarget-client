// src/features/spelling/Spelling.tsx

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '@/hooks/useAppSelector';
import { useSpelling } from './hooks/useSpelling';
import { calculateStats } from '@/lib';

const Spelling = () => {
  const navigate = useNavigate();
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
  } = useSpelling();

  // 単語がない場合はホームに戻る
  useEffect(() => {
    if (words.length === 0) {
      navigate('/');
    }
  }, [words.length, navigate]);

  // すべて正解したら結果画面へ
  useEffect(() => {
    if (allCorrect && words.length > 0) {
      navigate('/result');
    }
  }, [allCorrect, words.length, navigate]);

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

  return (
    <div className="min-h-screen bg-[var(--color-light-bg)] text-[var(--color-light-text)] px-6 py-8">
      <div className="w-full max-w-2xl mx-auto">
        {/* Review Mode Badge */}
        {isReviewMode && (
          <div className="mb-4 text-center">
            <span className="inline-block px-4 py-2 bg-[var(--color-error-100)] text-[var(--color-error-500)] rounded-full text-sm font-medium">
              📝 Review Mode
            </span>
          </div>
        )}

        {/* Stats Header */}
        <div className="flex items-center justify-between mb-6 text-sm text-[var(--color-light-text-muted)]">
          <div className="flex items-center gap-6">
            <span>
              <span className="text-[var(--color-success-500)] font-medium">{stats.correct}</span>
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
                className="w-full px-6 py-3 text-center text-xl font-light bg-white border-2 border-[var(--color-light-border)] rounded-lg focus:outline-none focus:border-[var(--color-primary-500)] transition-colors read-only:bg-[var(--color-gray-100)] read-only:cursor-default"
                autoFocus
              />

              {/* Feedback Overlay */}
              {showFeedback && (
                <div
                  className={`absolute inset-0 flex items-center justify-center rounded-lg backdrop-blur-sm ${
                    isCorrectAnswer
                      ? 'bg-[var(--color-success-500)]'
                      : 'bg-[var(--color-error-500)]'
                  } bg-opacity-20 border-2 ${
                    isCorrectAnswer
                      ? 'border-[var(--color-success-500)]'
                      : 'border-[var(--color-error-500)]'
                  }`}
                >
                  <div className="text-center bg-white rounded-lg px-6 py-3 shadow-lg">
                    <div
                      className={`text-4xl mb-1 ${
                        isCorrectAnswer
                          ? 'text-[var(--color-success-500)]'
                          : 'text-[var(--color-error-500)]'
                      }`}
                    >
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

            {/* Help Text */}
            <div className="mt-3 text-center">
              {showFeedback ? (
                <p className="text-xs text-[var(--color-light-text-subtle)]">
                  Press <kbd className="px-1.5 py-0.5 bg-[var(--color-gray-200)] text-[var(--color-light-text)] rounded text-xs font-mono">Enter</kbd> to continue
                </p>
              ) : (
                <p className="text-xs text-[var(--color-light-text-subtle)]">
                  Press <kbd className="px-1.5 py-0.5 bg-[var(--color-gray-200)] text-[var(--color-light-text)] rounded text-xs font-mono">Enter</kbd> to submit
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Spelling;
