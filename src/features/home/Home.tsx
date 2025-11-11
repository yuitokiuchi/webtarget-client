import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { loadWords, setConfig } from '@/features/spelling/spellingSlice';
import { validateWordRange, sanitizeNumber, getWordCount } from '@/lib';
import { DEFAULT_CONFIG, WORD_RANGE, UI_CONFIG } from '@/config/constants';

const Home = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [startRange, setStartRange] = useState<string>(String(DEFAULT_CONFIG.startRange));
  const [endRange, setEndRange] = useState<string>(String(DEFAULT_CONFIG.endRange));
  const [showImages, setShowImages] = useState<boolean>(DEFAULT_CONFIG.showImages);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleStart = async () => {
    // エラーをクリア
    setError('');

    // 数値に変換
    const start = sanitizeNumber(startRange, DEFAULT_CONFIG.startRange);
    const end = sanitizeNumber(endRange, DEFAULT_CONFIG.endRange);

    // バリデーション
    const validation = validateWordRange(start, end);
    if (!validation.isValid) {
      setError(validation.error || '入力値が不正です');
      return;
    }

    try {
      setIsLoading(true);

      // 設定を保存
      dispatch(setConfig({ showImages, startRange: start, endRange: end }));

      // 単語を取得
      await dispatch(loadWords({ start, end })).unwrap();

      // スペリング画面に遷移
      navigate('/spelling');
    } catch (err) {
      setError(err instanceof Error ? err.message : '単語の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetWordCount = () => {
    const start = sanitizeNumber(startRange, 0);
    const end = sanitizeNumber(endRange, 0);
    return getWordCount(start, end);
  };

  return (
    <div className="min-h-screen bg-[var(--color-light-bg)] text-[var(--color-light-text)] flex flex-col items-center justify-center px-6">
      {/* Header */}
      <header className="mb-16 text-center">
        <h1 className="text-6xl font-light tracking-tight mb-6">
          {UI_CONFIG.APP_NAME}
        </h1>
        <div className="w-12 h-px bg-[var(--color-light-border)] mx-auto mb-6" />
        <p className="text-sm text-[var(--color-light-text-subtle)] tracking-widest uppercase">
          {UI_CONFIG.SUBTITLE}
        </p>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-md">
        <div className="space-y-8">
          {/* Range Selection */}
          <div className="space-y-4">
            <h2 className="text-sm font-light text-[var(--color-light-text-muted)] tracking-wide">
              Select Range
            </h2>
            
            <div className="flex items-center gap-4">
              <input
                type="number"
                min={WORD_RANGE.MIN}
                max={WORD_RANGE.MAX}
                value={startRange}
                onChange={(e) => setStartRange(e.target.value)}
                className="w-full bg-[var(--color-light-surface)] border border-[var(--color-light-border)] rounded-lg px-4 py-3 text-center text-lg font-light focus:outline-none focus:border-[var(--color-light-text-muted)] transition-colors"
                placeholder="Start"
              />
              <span className="text-[var(--color-light-text-subtle)]">—</span>
              <input
                type="number"
                min={WORD_RANGE.MIN}
                max={WORD_RANGE.MAX}
                value={endRange}
                onChange={(e) => setEndRange(e.target.value)}
                className="w-full bg-[var(--color-light-surface)] border border-[var(--color-light-border)] rounded-lg px-4 py-3 text-center text-lg font-light focus:outline-none focus:border-[var(--color-light-text-muted)] transition-colors"
                placeholder="End"
              />
            </div>

            <p className="text-xs text-[var(--color-light-text-subtle)] text-center">
              {handleGetWordCount()} words selected
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-[var(--color-error-100)] border border-[var(--color-error-500)] rounded-lg px-4 py-3 text-sm text-[var(--color-error-500)]">
              {error}
            </div>
          )}

          {/* Image Display Setting */}
          <div className="space-y-4">
            <h2 className="text-sm font-light text-[var(--color-light-text-muted)] tracking-wide">
              Settings
            </h2>
            
            <label className="flex items-center justify-between bg-[var(--color-light-surface)] border border-[var(--color-light-border)] rounded-lg px-4 py-3 cursor-pointer hover:bg-[var(--color-gray-100)] transition-colors">
              <span className="text-sm font-light">Show Images</span>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={showImages}
                  onChange={(e) => setShowImages(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-[var(--color-light-border)] rounded-full peer-checked:bg-[var(--color-light-text)] transition-colors" />
                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full peer-checked:translate-x-5 transition-transform shadow-sm" />
              </div>
            </label>
          </div>

          {/* Start Button */}
          <button
            onClick={handleStart}
            disabled={isLoading}
            className="w-full bg-[var(--color-light-text)] text-white py-4 rounded-lg font-light tracking-wide hover:opacity-90 active:opacity-80 transition-opacity shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading && (
              <svg
                className="animate-spin h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            )}
            <span>{isLoading ? 'Loading Words...' : 'Start Spelling'}</span>
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="absolute bottom-6 flex flex-col items-center gap-3">
        <a
          href="https://github.com/yuitokiuchi/webtarget-client"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-2 text-[var(--color-light-text-subtle)] hover:text-[var(--color-light-text)] transition-colors"
          aria-label="View source on GitHub"
        >
          <svg
            className="w-4 h-4"
            fill="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
          <span className="text-xs font-light">
            yuitokiuchi/webtarget-client
          </span>
        </a>
        {/*
        <p className="text-xs text-[var(--color-light-text-subtle)]">
          {UI_CONFIG.COPYRIGHT_YEAR} {UI_CONFIG.APP_NAME}
        </p>*/}
      </footer>
    </div>
  );
};

export default Home;