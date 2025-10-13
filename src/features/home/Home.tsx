import { useState } from 'react';

const Home = () => {
  const [startRange, setStartRange] = useState<number>(1);
  const [endRange, setEndRange] = useState<number>(100);

  const handleStart = () => {
    // TODO: スペリング画面に遷移
    console.log(`Starting spelling test: ${startRange} - ${endRange}`);
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6">
      {/* Header */}
      <header className="mb-16 text-center">
        <h1 className="text-6xl font-light tracking-tight mb-6">
          WebTarget
        </h1>
        <div className="w-12 h-px bg-white/30 mx-auto mb-6" />
        <p className="text-sm text-white/50 tracking-widest uppercase">
          1900 Words Spelling
        </p>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-md">
        <div className="space-y-8">
          {/* Range Selection */}
          <div className="space-y-4">
            <h2 className="text-sm font-light text-white/70 tracking-wide">
              Select Range
            </h2>
            
            <div className="flex items-center gap-4">
              <input
                type="number"
                min="1"
                max="1900"
                value={startRange}
                onChange={(e) => setStartRange(Number(e.target.value))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-center text-lg font-light focus:outline-none focus:border-white/30 transition-colors"
                placeholder="Start"
              />
              <span className="text-white/30">—</span>
              <input
                type="number"
                min="1"
                max="1900"
                value={endRange}
                onChange={(e) => setEndRange(Number(e.target.value))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-center text-lg font-light focus:outline-none focus:border-white/30 transition-colors"
                placeholder="End"
              />
            </div>

            <p className="text-xs text-white/40 text-center">
              {endRange - startRange + 1} words selected
            </p>
          </div>

          {/* Start Button */}
          <button
            onClick={handleStart}
            className="w-full bg-white text-black py-4 rounded-lg font-light tracking-wide hover:bg-white/90 active:bg-white/80 transition-colors"
          >
            Start Spelling
          </button>

          {/* Quick Select */}
          <div className="space-y-3">
            <p className="text-xs text-white/50 tracking-wide">Quick Select</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: '1-100', start: 1, end: 100 },
                { label: '101-500', start: 101, end: 500 },
                { label: '501-1000', start: 501, end: 1000 },
                { label: '1001-1500', start: 1001, end: 1500 },
                { label: '1501-1900', start: 1501, end: 1900 },
                { label: 'All', start: 1, end: 1900 },
              ].map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => {
                    setStartRange(preset.start);
                    setEndRange(preset.end);
                  }}
                  className="bg-white/5 border border-white/10 py-2 rounded text-xs font-light hover:bg-white/10 hover:border-white/20 transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="absolute bottom-6 text-xs text-white/30">
        © 2025 WebTarget
      </footer>
    </div>
  );
};

export default Home;