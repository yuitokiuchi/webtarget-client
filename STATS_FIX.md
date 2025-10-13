# 統計カウント修正 & UI簡素化

## 🐛 修正したバグ

### **問題: カウンターが2倍になる**

**症状:**
- 1つ正解するごとに、カウンターが2つ増えてしまう
- `2 / 10 Accuracy: 100%` が異常に増加

**原因:**
```typescript
// ❌ 問題のあったコード
export const calculateStats = (answers: SpellingAnswer[]): SpellingStats => {
  const total = answers.length;  // ← 回答の総数（重複含む）
  const correct = answers.filter(a => a.isCorrect).length;
  // ...
}
```

**説明:**
1. 同じ単語に複数回回答すると、`answers` 配列に複数回追加される
2. `answers.length` は **回答の総数**（同じ単語への複数回答を含む）
3. 実際には **単語ごとの最新の回答** のみをカウントすべき

**例:**
```
単語1に回答: ❌ 不正解 → answers.length = 1
単語2に回答: ✅ 正解   → answers.length = 2
単語1に再回答: ❌ 不正解 → answers.length = 3  ← 間違い！
単語1に再回答: ✅ 正解   → answers.length = 4  ← 間違い！

正しくは: 2単語のうち1単語正解 = 1/2
表示されていた: 4回答のうち1回正解 = 1/4  ← おかしい！
```

---

## ✅ 修正内容

### **1. 統計計算の修正**

**新しいロジック:**
```typescript
// ✅ 修正後のコード
export const calculateStats = (answers: SpellingAnswer[], words: Word[]): SpellingStats => {
  // 各単語の最新の回答状況をマップ化
  const answerMap = getLatestAnswerMap(answers);

  // 最新の回答で正解した単語の数をカウント
  const correct = Array.from(answerMap.values()).filter(a => a.isCorrect).length;
  
  // 総数は全単語数
  const total = words.length;
  const incorrect = total - correct;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

  return { total, correct, incorrect, accuracy };
};
```

**改善点:**
- ✅ `getLatestAnswerMap()` で各単語の **最新の回答のみ** を取得
- ✅ 総数は `words.length`（全単語数）
- ✅ 正解数は最新の回答で正解した単語数
- ✅ 同じ単語への複数回答は最新のみカウント

---

### **2. 表示の修正**

**Before:**
```tsx
<span className="text-[var(--color-light-text)]">{words.length}</span>
```

**After:**
```tsx
<span className="text-[var(--color-light-text)]">{stats.total}</span>
```

**理由:**
- `stats.total` は `words.length` と同じだが、将来的に拡張可能
- 統計情報を一箇所（`calculateStats`）で管理

---

### **3. 呼び出し元の修正**

**Before:**
```tsx
const stats = calculateStats(answers);
```

**After:**
```tsx
const stats = calculateStats(answers, words);
```

**理由:**
- 単語リスト全体が必要になったため、引数に追加

---

## 🎨 UI簡素化

### **単語カード表示の変更**

**要件:**
> 出題時に表示するのは、日本語と品詞だけにしてください。

**Before:**
```tsx
{/* Japanese Meaning */}
<div className="text-center mb-4">
  <h1 className="text-3xl font-light mb-2">
    {currentWord.japanese_meaning}
  </h1>
  <span className="inline-block px-3 py-1 text-xs bg-[var(--color-gray-100)]">
    {currentWord.part_of_speech}
  </span>
</div>

{/* Pronunciation */}
<div className="text-center mb-6">
  <p className="text-sm text-[var(--color-light-text-subtle)] font-mono">
    /{currentWord.pronunciation}/
  </p>
</div>
```

**After:**
```tsx
{/* Japanese Meaning & Part of Speech */}
<div className="text-center mb-8">
  <h1 className="text-3xl font-light mb-3">
    {currentWord.japanese_meaning}
  </h1>
  <span className="inline-block px-3 py-1 text-xs bg-[var(--color-gray-100)]">
    {currentWord.part_of_speech}
  </span>
</div>
```

**変更点:**
- ❌ **削除:** 発音記号（`/{currentWord.pronunciation}/`）
- ✅ **保持:** 日本語訳
- ✅ **保持:** 品詞
- 📏 **調整:** 余白を `mb-4` + `mb-6` → `mb-8` に統合

---

## 🔍 検証例

### **正しい動作:**

**シナリオ:**
```
単語リスト: 10単語

1. 単語1に回答: ❌ 不正解
   → 表示: 0 / 10 (Accuracy: 0%)

2. 単語2に回答: ✅ 正解
   → 表示: 1 / 10 (Accuracy: 10%)

3. 単語1に再回答: ❌ 不正解
   → 表示: 1 / 10 (Accuracy: 10%)  ← 変わらない（最新が不正解）

4. 単語1に再回答: ✅ 正解
   → 表示: 2 / 10 (Accuracy: 20%)  ← 1つ増える（最新が正解）

5. 単語3に回答: ✅ 正解
   → 表示: 3 / 10 (Accuracy: 30%)
```

**ポイント:**
- ✅ 総数は常に `10`（単語数）
- ✅ 正解数は最新の回答で正解した単語の数
- ✅ 同じ単語への複数回答は最新のみ反映

---

## 📊 データ構造

### **回答履歴の例:**

```typescript
answers = [
  { wordId: 1, userAnswer: "aband", isCorrect: false, correctWord: "abandon" },
  { wordId: 2, userAnswer: "ability", isCorrect: true, correctWord: "ability" },
  { wordId: 1, userAnswer: "abandun", isCorrect: false, correctWord: "abandon" },
  { wordId: 1, userAnswer: "abandon", isCorrect: true, correctWord: "abandon" },
  { wordId: 3, userAnswer: "accept", isCorrect: true, correctWord: "accept" },
]
```

### **最新の回答マップ:**

```typescript
answerMap = Map {
  1 => { wordId: 1, userAnswer: "abandon", isCorrect: true, correctWord: "abandon" },  // 最新
  2 => { wordId: 2, userAnswer: "ability", isCorrect: true, correctWord: "ability" },
  3 => { wordId: 3, userAnswer: "accept", isCorrect: true, correctWord: "accept" },
}
```

### **統計:**

```typescript
stats = {
  total: 10,        // 単語数（仮に10単語）
  correct: 3,       // 最新の回答で正解した単語数
  incorrect: 7,     // 10 - 3
  accuracy: 30      // (3 / 10) * 100
}
```

---

## 🎯 まとめ

### **修正内容:**

1. **✅ カウンターバグ修正**
   - 各単語の最新の回答のみをカウント
   - 総数は単語数（回答数ではない）
   - 正解数は最新の回答で正解した単語の数

2. **🎨 UI簡素化**
   - 発音記号を削除
   - 日本語訳と品詞のみ表示
   - よりシンプルで見やすく

### **結果:**

- ✅ `2 / 10` が正確にカウント
- ✅ 同じ単語への複数回答でもカウントが増えない
- ✅ シンプルで洗練されたUI
- ✅ 正確な統計情報

**完璧！** 🎉
