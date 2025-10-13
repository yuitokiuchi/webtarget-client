# Spelling Feature

スペリング画面の実装ドキュメント。シンプルで洗練された設計により、UIとロジックを完全に分離。

## 📁 ファイル構成

```
features/spelling/
├── Spelling.tsx              # UIコンポーネント（表示のみ）
├── spellingSlice.ts          # Redux状態管理
└── hooks/
    └── useSpelling.ts        # ビジネスロジック（カスタムフック）
```

---

## 🎯 設計思想

### 責務の分離

1. **UIコンポーネント (`Spelling.tsx`)**
   - 表示のみに専念
   - ビジネスロジックを持たない
   - カスタムフックから状態とアクションを受け取る

2. **カスタムフック (`useSpelling.ts`)**
   - すべてのビジネスロジック
   - 状態管理
   - イベントハンドリング
   - UIから完全に独立

3. **Redux Slice (`spellingSlice.ts`)**
   - グローバル状態の管理
   - 永続化（LocalStorage）
   - 非同期処理（単語取得）

---

## 🔄 スペリングの仕組み

### 基本フロー

```
1. ユーザーが単語を見る
   ↓
2. スペリングを入力
   ↓
3. Enter または「回答する」ボタン
   ↓
4. 瞬時にクライアントサイドで正誤判定
   ↓
5. フィードバック表示（2秒）
   ↓
6. 自動的に次の単語へ
```

### 間違えた単語の再出題

**すべて正解するまで終われない仕組み:**

```typescript
// getNextWordIndex() の動作
1. 現在位置より後ろの未回答/不正解の単語を探す
2. なければ、最初から不正解の単語を探す
3. すべて正解なら null を返す（完了）
```

**実装例:**
```typescript
// useSpelling.ts
const handleNext = () => {
  const nextIndex = getNextWordIndex(words, answers, currentIndex);
  
  if (nextIndex !== null) {
    dispatch(goToWord(nextIndex)); // 次の単語へ
  } else {
    // すべて正解！結果画面へ
  }
};
```

### 回答状況の管理

各単語の**最新の回答のみ**を有効とする：

```typescript
// 同じ単語に複数回答答した場合、最新のものを採用
const latestAnswerMap = getLatestAnswerMap(answers);

// 単語 ID 123 の最新の回答
const answer = latestAnswerMap.get(123);
```

---

## 🎨 UI の特徴

### シンプルで洗練されたデザイン

**カード型レイアウト:**
- 日本語の意味（大きく）
- 品詞タグ
- 発音記号
- 例文
- 入力フィールド（中央）

**進捗バー:**
- ヘッダーに固定
- アニメーション付き
- 現在位置と進捗率を表示

**単語ナビゲーション:**
- 全単語を番号で表示
- 色分け:
  - 🟦 現在の単語（青）
  - 🟢 正解済み（緑）
  - 🔴 要復習（赤）
  - ⚪ 未回答（グレー）

**フィードバック:**
- 正解: ✓ と緑のオーバーレイ
- 不正解: × と赤のオーバーレイ + 正解を表示
- 2秒後に自動で次へ

---

## 🔌 使用方法

### 基本的な使用

```typescript
import Spelling from '@/features/spelling/Spelling';

// ルーティングで使用
<Route path="/spelling" element={<Spelling />} />
```

### カスタムフックの使用（別のUIで使いたい場合）

```typescript
import { useSpelling } from '@/features/spelling/hooks/useSpelling';

const MyCustomSpelling = () => {
  const {
    currentWord,
    userInput,
    handleSubmit,
    handleInputChange,
    // ...
  } = useSpelling();

  // 独自のUIを実装
  return <div>...</div>;
};
```

---

## 📊 状態管理

### Redux State

```typescript
interface SpellingState {
  words: Word[];              // 全単語リスト
  currentIndex: number;       // 現在の単語インデックス
  answers: SpellingAnswer[];  // 回答履歴
  isLoading: boolean;         // ローディング中
  error: string | null;       // エラーメッセージ
  showImages: boolean;        // 画像表示設定
  startRange: number;         // 開始範囲
  endRange: number;           // 終了範囲
}
```

### LocalStorage 自動保存

Redux ミドルウェアが以下のアクション時に自動保存：

- `submitAnswer` - 回答送信
- `goToWord` - 単語移動
- `loadWords` - 単語読み込み完了

ページを更新しても続きから再開できます。

---

## 🎮 キーボード操作

| キー | 動作 |
|------|------|
| `Enter` | 回答を送信 |
| タイピング | 自動的に入力フィールドにフォーカス |

---

## 🧪 テスト用のヘルパー

### モックデータで開発

```typescript
import { fetchWordsMock } from '@/lib/__mocks__/wordsApi.mock';

// テスト用に少数の単語で確認
const words = await fetchWordsMock(1, 5);
```

### 状態のリセット

```typescript
import { resetSpelling, resetAll } from '@/features/spelling/spellingSlice';

// 回答履歴のみリセット
dispatch(resetSpelling());

// すべてリセット
dispatch(resetAll());
```

---

## 🔧 カスタマイズ

### 自動遷移の遅延を変更

```typescript
// useSpelling.ts の handleSubmit 内
setTimeout(() => {
  handleNext();
}, 2000); // <- この値を変更（ミリ秒）
```

### フィードバックの表示内容を変更

```typescript
// Spelling.tsx の Feedback 部分を編集
{!isCorrectAnswer && (
  <div className="...">
    正解: {currentWord.word}
    {/* ここに追加情報を表示 */}
  </div>
)}
```

### 画像表示機能の追加

```typescript
// Spelling.tsx に追加
{showImages && currentWord.imageUrl && (
  <img src={currentWord.imageUrl} alt={currentWord.word} />
)}
```

---

## 🚀 今後の拡張

- [ ] タイマー機能（制限時間）
- [ ] ヒント機能（最初の文字を表示）
- [ ] 音声読み上げ
- [ ] キーボードショートカット拡張
- [ ] アニメーション強化
- [ ] ダークモード対応
- [ ] 結果画面の実装

---

## 💡 ベストプラクティス

1. **UIとロジックの完全分離**
   - テストしやすい
   - 再利用しやすい
   - 保守しやすい

2. **Pure関数の使用**
   - `getNextWordIndex()`
   - `isAllCorrect()`
   - `getLatestAnswerMap()`

3. **型安全性**
   - すべてTypeScriptで型付け
   - 実行時エラーを防止

4. **パフォーマンス**
   - `useCallback` でメモ化
   - 不要な再レンダリングを防止

5. **アクセシビリティ**
   - `autoFocus` で入力しやすく
   - キーボード操作対応
   - `disabled` 状態の適切な管理
