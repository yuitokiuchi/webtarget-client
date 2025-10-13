# Lib モジュール

スペリングアプリケーションのコアロジックを提供するシンプルで洗練されたモジュール群。

## 📦 モジュール構成

### `wordsApi.ts` - 単語取得とスペリング判定

単語データの取得とスペリングの正誤判定を行う。

```typescript
import { fetchWords, checkSpelling, clearCache } from '@/lib';

// 単語取得（キャッシュ付き）
const words = await fetchWords(1, 100);

// スペリング判定（瞬時・クライアントサイド）
const isCorrect = checkSpelling('hello', 'Hello'); // true

// キャッシュクリア
clearCache();
```

**特徴:**
- ✅ 範囲バリデーション（1-1900）
- ✅ 自動キャッシング（同じ範囲の再取得を防ぐ）
- ✅ タイムアウト処理（10秒）
- ✅ 詳細なエラーメッセージ
- ✅ 大文字小文字・空白を無視した判定

---

### `spellingUtils.ts` - スペリング用ユーティリティ

統計計算や進捗管理などの便利な関数群。

```typescript
import { calculateStats, calculateProgress, shuffleWords } from '@/lib';

// 統計計算
const stats = calculateStats(answers);
console.log(stats);
// { total: 10, correct: 8, incorrect: 2, accuracy: 80 }

// 進捗計算
const progress = calculateProgress(5, 10); // 60%

// 単語をシャッフル（ランダム出題用）
const shuffled = shuffleWords(words);
```

**提供関数:**
- `calculateStats()` - 正答率などの統計
- `calculateProgress()` - 進捗パーセンテージ
- `getAnswerForWord()` - 特定単語の回答取得
- `getUnansweredWords()` - 未回答の単語
- `getIncorrectWords()` - 不正解の単語
- `getWordCount()` - 範囲から単語数計算
- `shuffleWords()` - 単語のシャッフル

---

### `validation.ts` - バリデーション

入力値のバリデーションとサニタイズ。

```typescript
import { validateWordRange, validateAnswer, sanitizeNumber, WORD_RANGE } from '@/lib';

// 範囲バリデーション
const result = validateWordRange(1, 100);
if (!result.isValid) {
  console.error(result.error);
}

// 回答バリデーション
const answerCheck = validateAnswer(userInput);

// 数値サニタイズ
const num = sanitizeNumber('100', 1); // 100
const num2 = sanitizeNumber('abc', 1); // 1（デフォルト値）

// 定数
console.log(WORD_RANGE.MIN); // 1
console.log(WORD_RANGE.MAX); // 1900
```

---

### `storage.ts` - LocalStorage永続化 🆕

スペリング中の進捗を自動保存・復元。ページ更新後も続きから再開できます。

```typescript
import {
  loadSpellingSession,
  isSessionValid,
  saveSpellingHistory,
  getHistoryStats,
} from '@/lib';

// セッションを復元（24時間以内）
const session = loadSpellingSession();
if (isSessionValid(session)) {
  console.log('続きから再開できます');
}

// 学習履歴を保存
saveSpellingHistory({
  startRange: 1,
  endRange: 100,
  totalWords: 100,
  correctWords: 85,
  accuracy: 85,
  completedAt: Date.now(),
  duration: 600,
});

// 統計を取得
const stats = getHistoryStats();
console.log(stats.averageAccuracy); // 平均正答率
```

**自動保存機能:**
- Redux の状態変更を検知して自動保存
- ミドルウェアで実装（`storageMiddleware.ts`）
- 設定不要で動作

詳細は [`STORAGE.md`](./STORAGE.md) を参照してください。

---

## 🎯 使用例

### Redux Sliceでの使用

```typescript
import { createAsyncThunk } from '@reduxjs/toolkit';
import { fetchWords, checkSpelling } from '@/lib';

export const loadWords = createAsyncThunk(
  'spelling/loadWords',
  async ({ start, end }: { start: number; end: number }) => {
    return await fetchWords(start, end);
  }
);

export const submitAnswer = (state, action: PayloadAction<string>) => {
  const currentWord = state.words[state.currentIndex];
  const isCorrect = checkSpelling(action.payload, currentWord.word);
  // ...
};
```

### コンポーネントでの使用

```typescript
import { useState } from 'react';
import { validateWordRange, getWordCount } from '@/lib';

const RangeSelector = () => {
  const [start, setStart] = useState(1);
  const [end, setEnd] = useState(100);

  const handleSubmit = () => {
    const validation = validateWordRange(start, end);
    if (!validation.isValid) {
      alert(validation.error);
      return;
    }
    
    const count = getWordCount(start, end);
    console.log(`${count}単語を取得します`);
  };
};
```

---

## 🧪 開発・テスト

### モックデータ

オフライン開発用のモック関数を提供。

```typescript
import { fetchWordsMock, generateMockWords } from '@/lib/__mocks__/wordsApi.mock';

// モックAPI（300ms遅延付き）
const words = await fetchWordsMock(1, 10);

// モックデータ生成
const mockWords = generateMockWords(1, 5);
```

---

## 📝 設計原則

1. **シンプル** - 各関数は1つの責任のみ
2. **Pure関数** - 副作用を最小限に
3. **型安全** - 完全なTypeScript対応
4. **テスタブル** - モックとテストが容易
5. **パフォーマンス** - キャッシュと最適化

---

## 🔧 今後の拡張案

- [x] LocalStorageへのキャッシュ永続化 ✅
- [x] 学習履歴の分析機能 ✅
- [ ] オフラインモードのサポート
- [ ] 音声入力のサポート
- [ ] 類似度判定（部分一致、typo許容）
- [ ] ServiceWorkerによる背景同期
