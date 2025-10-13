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
      <footer className="absolute bottom-6 text-xs text-[var(--color-light-text-subtle)]">
        {UI_CONFIG.COPYRIGHT_YEAR} {UI_CONFIG.APP_NAME}
      </footer>
    </div>
  );
};

export default Home;