# Single Source of Truth - 設定管理

## 📋 概要

このプロジェクトでは、**Single Source of Truth**（信頼できる単一の情報源）の原則を採用しています。

すべての設定値は `src/config/constants.ts` に集約されており、プロジェクト全体で一貫性のある設定管理を実現しています。

---

## 🎯 設計原則

### **Before（改善前）:**
```
❌ 設定が分散している
├── Home.tsx: '1', '100', true
├── spellingSlice.ts: 1, 100, true
├── validation.ts: MIN: 1, MAX: 1900
├── wordsApi.ts: タイムアウト 10000
└── storage.ts: 24 * 60 * 60 * 1000
```

### **After（改善後）:**
```
✅ 設定が一元管理されている
└── config/constants.ts
    ├── DEFAULT_CONFIG
    ├── WORD_RANGE
    ├── SESSION_CONFIG
    ├── API_CONFIG
    └── UI_CONFIG
```

---

## 📁 ファイル構造

```
src/
├── config/
│   └── constants.ts          ← ★ すべての設定はここ！
├── features/
│   ├── home/Home.tsx         ← constants をインポート
│   └── spelling/
│       └── spellingSlice.ts  ← constants をインポート
└── lib/
    ├── index.ts              ← constants を再エクスポート
    ├── validation.ts         ← constants をインポート
    ├── storage.ts            ← constants をインポート
    └── wordsApi.ts           ← constants をインポート
```

---

## ⚙️ 設定ファイル: `src/config/constants.ts`

### **1. DEFAULT_CONFIG - デフォルト設定**

```typescript
export const DEFAULT_CONFIG = {
  startRange: 1,        // デフォルトの開始範囲
  endRange: 100,        // デフォルトの終了範囲
  showImages: true,     // 画像表示のデフォルト
} as const;
```

**使用箇所:**
- `Home.tsx` - 入力フィールドの初期値
- `spellingSlice.ts` - Redux初期状態

**変更方法:**
```typescript
// デフォルトを 1-200 に変更したい場合
export const DEFAULT_CONFIG = {
  startRange: 1,
  endRange: 200,  // ← ここだけ変更すればOK！
  showImages: true,
} as const;
```

---

### **2. WORD_RANGE - 単語範囲の制約**

```typescript
export const WORD_RANGE = {
  MIN: 1,         // 最小単語番号
  MAX: 1900,      // 最大単語番号
} as const;
```

**使用箇所:**
- `Home.tsx` - 入力フィールドの min/max 属性
- `validation.ts` - バリデーション処理

**変更方法:**
```typescript
// 単語数が増えた場合
export const WORD_RANGE = {
  MIN: 1,
  MAX: 2500,  // ← 新しい最大値
} as const;
```

---

### **3. SESSION_CONFIG - セッション設定**

```typescript
export const SESSION_CONFIG = {
  VALIDITY_DURATION: 24 * 60 * 60 * 1000,  // 24時間
  STORAGE_KEY: 'webtarget_spelling_session',
} as const;
```

**使用箇所:**
- `storage.ts` - LocalStorage管理

**変更方法:**
```typescript
// セッション有効期限を12時間に変更
export const SESSION_CONFIG = {
  VALIDITY_DURATION: 12 * 60 * 60 * 1000,  // ← 12時間
  STORAGE_KEY: 'webtarget_spelling_session',
} as const;
```

---

### **4. API_CONFIG - API設定**

```typescript
export const API_CONFIG = {
  BASE_URL: 'https://...',
  CACHE_DURATION: 30 * 60 * 1000,  // 30分
  TIMEOUT: 10000,                   // 10秒
} as const;
```

**使用箇所:**
- `wordsApi.ts` - API通信とキャッシュ管理

**変更方法:**
```typescript
// キャッシュを1時間に延長
export const API_CONFIG = {
  BASE_URL: 'https://...',
  CACHE_DURATION: 60 * 60 * 1000,  // ← 1時間
  TIMEOUT: 10000,
} as const;
```

---

### **5. UI_CONFIG - UI設定**

```typescript
export const UI_CONFIG = {
  APP_NAME: 'WebTarget',
  SUBTITLE: '1900 Words Spelling',
  COPYRIGHT_YEAR: 2025,
} as const;
```

**使用箇所:**
- `Home.tsx` - ヘッダーとフッター

**変更方法:**
```typescript
// アプリ名を変更
export const UI_CONFIG = {
  APP_NAME: 'MySpelling',  // ← 新しい名前
  SUBTITLE: '2500 Words Spelling',
  COPYRIGHT_YEAR: 2025,
} as const;
```

---

## 🔧 設定変更の手順

### **例: デフォルト範囲を 1-200 に変更**

1. **`src/config/constants.ts` を開く**

2. **`DEFAULT_CONFIG` を編集**
   ```typescript
   export const DEFAULT_CONFIG = {
     startRange: 1,
     endRange: 200,  // ← 100 から 200 に変更
     showImages: true,
   } as const;
   ```

3. **保存して完了！**
   - `Home.tsx` の初期値が自動的に更新される
   - `spellingSlice.ts` の初期状態も自動的に更新される
   - 他のファイルを変更する必要なし！

---

## ✅ 利点

### **1. 一貫性**
- すべての箇所で同じ値が使われる
- 設定の不一致が発生しない

### **2. 保守性**
- 1箇所を変更するだけで全体に反映
- 変更箇所を探し回る必要なし

### **3. 可読性**
- 設定値の意味が明確
- コメントで説明を追加できる

### **4. 安全性**
- `as const` で型安全性を確保
- タイポや誤った値の使用を防ぐ

### **5. テスト容易性**
- モック値の差し替えが簡単
- テスト用の設定を一元管理

---

## 📊 使用例

### **コンポーネントでの使用**

```tsx
import { DEFAULT_CONFIG, WORD_RANGE, UI_CONFIG } from '@/config/constants';

const MyComponent = () => {
  const [start, setStart] = useState(DEFAULT_CONFIG.startRange);
  const [end, setEnd] = useState(DEFAULT_CONFIG.endRange);

  return (
    <div>
      <h1>{UI_CONFIG.APP_NAME}</h1>
      <input 
        type="number" 
        min={WORD_RANGE.MIN} 
        max={WORD_RANGE.MAX}
        value={start}
      />
    </div>
  );
};
```

### **ライブラリでの使用**

```typescript
import { API_CONFIG, SESSION_CONFIG } from '@/config/constants';

export const fetchData = async () => {
  const response = await axios.get(API_CONFIG.BASE_URL, {
    timeout: API_CONFIG.TIMEOUT,
  });
  return response.data;
};

export const isValid = (timestamp: number) => {
  return (Date.now() - timestamp) < SESSION_CONFIG.VALIDITY_DURATION;
};
```

### **`@/lib` 経由での使用**

```typescript
// より簡潔に使える
import { DEFAULT_CONFIG, WORD_RANGE } from '@/lib';

const start = DEFAULT_CONFIG.startRange;
const max = WORD_RANGE.MAX;
```

---

## 🎨 カスタマイズガイド

### **よくある変更シナリオ:**

#### **1. デフォルト範囲の変更**
```typescript
// constants.ts
export const DEFAULT_CONFIG = {
  startRange: 1,
  endRange: 200,  // ← 変更
  showImages: true,
} as const;
```

#### **2. セッション有効期限の変更**
```typescript
// constants.ts
export const SESSION_CONFIG = {
  VALIDITY_DURATION: 48 * 60 * 60 * 1000,  // ← 48時間に変更
  STORAGE_KEY: 'webtarget_spelling_session',
} as const;
```

#### **3. APIタイムアウトの変更**
```typescript
// constants.ts
export const API_CONFIG = {
  BASE_URL: '...',
  CACHE_DURATION: 30 * 60 * 1000,
  TIMEOUT: 15000,  // ← 15秒に変更
} as const;
```

#### **4. アプリ名の変更**
```typescript
// constants.ts
export const UI_CONFIG = {
  APP_NAME: 'MyApp',  // ← 変更
  SUBTITLE: 'Custom Spelling',  // ← 変更
  COPYRIGHT_YEAR: 2025,
} as const;
```

---

## 📝 まとめ

### **設定変更は `src/config/constants.ts` だけ！**

| 変更したい内容 | 編集する定数 |
|---|---|
| デフォルトの範囲 | `DEFAULT_CONFIG.startRange/endRange` |
| 最大単語数 | `WORD_RANGE.MAX` |
| セッション有効期限 | `SESSION_CONFIG.VALIDITY_DURATION` |
| API設定 | `API_CONFIG.*` |
| UI表示 | `UI_CONFIG.*` |

### **Single Source of Truth = 洗練された設計** ✨

- ✅ 一箇所で管理
- ✅ 全体に自動反映
- ✅ 保守が簡単
- ✅ バグが減少
- ✅ チーム開発に最適

**完璧な設定管理システム！** 🎉
