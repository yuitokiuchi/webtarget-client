// src/features/spelling/Spelling.tsx

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSpelling } from './hooks/useSpelling';
import { calculateStats } from '@/lib';

const Spelling = () => {
  const navigate = useNavigate();
  const {
    currentWord,
    userInput,
    showFeedback,
    isCorrectAnswer,
    allCorrect,
    words,
    answers,
    handleKeyPress,
    handleInputChange,
  } = useSpelling();

  // 単語がない場合はホームに戻る
  useEffect(() => {
    if (words.length === 0) {
      navigate('/');
    }
  }, [words.length, navigate]);

  // すべて正解したら結果画面へ（今は実装していないのでログのみ）
  useEffect(() => {
    if (allCorrect && words.length > 0) {
      console.log('🎉 All correct!');
      // TODO: 結果画面に遷移
      // navigate('/result');
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
  const stats = calculateStats(answers);

  return (
    <div className="min-h-screen bg-[var(--color-light-bg)] text-[var(--color-light-text)] flex items-center justify-center px-6 py-8">
      <div className="w-full max-w-2xl">
        {/* Stats Header */}
        <div className="flex items-center justify-between mb-6 text-sm text-[var(--color-light-text-muted)]">
          <div className="flex items-center gap-6">
            <span>
              <span className="text-[var(--color-success-500)] font-medium">{stats.correct}</span>
              {' / '}
              <span className="text-[var(--color-light-text)]">{words.length}</span>
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
        <div className="bg-[var(--color-light-surface)] border border-[var(--color-light-border)] rounded-xl p-8 shadow-sm">
          {/* Japanese Meaning */}
          <div className="text-center mb-4">
            <h1 className="text-3xl font-light mb-2">
              {currentWord.japanese_meaning}
            </h1>
            <span className="inline-block px-3 py-1 text-xs bg-[var(--color-gray-100)] text-[var(--color-light-text-muted)] rounded-full">
              {currentWord.part_of_speech}
            </span>
          </div>

          {/* Pronunciation */}
          <div className="text-center mb-6">
            <p className="text-sm text-[var(--color-light-text-subtle)] font-mono">
              /{currentWord.pronunciation}/
            </p>
          </div>

          {/* Input Area */}
          <div className="max-w-md mx-auto">
            <div className="relative">
              <input
                type="text"
                value={userInput}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={showFeedback ? '' : 'Type the spelling...'}
                disabled={showFeedback}
                className="w-full px-6 py-3 text-center text-xl font-light bg-white border-2 border-[var(--color-light-border)] rounded-lg focus:outline-none focus:border-[var(--color-primary-500)] transition-colors disabled:bg-[var(--color-gray-100)] disabled:cursor-not-allowed"
                autoFocus
              />

              {/* Feedback Overlay */}
              {showFeedback && (
                <div
                  className={`absolute inset-0 flex items-center justify-center rounded-lg ${
                    isCorrectAnswer
                      ? 'bg-[var(--color-success-500)]'
                      : 'bg-[var(--color-error-500)]'
                  } bg-opacity-10 border-2 ${
                    isCorrectAnswer
                      ? 'border-[var(--color-success-500)]'
                      : 'border-[var(--color-error-500)]'
                  }`}
                >
                  <div className="text-center">
                    <div
                      className={`text-3xl mb-1 ${
                        isCorrectAnswer
                          ? 'text-[var(--color-success-500)]'
                          : 'text-[var(--color-error-500)]'
                      }`}
                    >
                      {isCorrectAnswer ? '✓' : '✗'}
                    </div>
                    {!isCorrectAnswer && (
                      <div className="text-sm text-[var(--color-error-500)] font-medium">
                        {currentWord.word}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Spelling;
