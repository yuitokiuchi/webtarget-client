# スペリング状態の永続化

LocalStorageを使用して、スペリング中の進捗を自動保存・復元します。
ページを更新しても、学習の続きから再開できます。

## 🎯 主な機能

### 1. **自動保存**
Redux の状態変更を検知して、自動的に LocalStorage に保存します。

### 2. **セッション復元**
アプリ起動時に、保存されたセッションから自動復元（24時間以内）

### 3. **学習履歴**
完了したセッションの履歴を最大10件保存

### 4. **設定の永続化**
ユーザー設定（範囲、画像表示など）を保存

---

## 📚 使い方

### 基本的な使用（自動で動作）

Redux ミドルウェアが自動的に保存を行うため、特別な処理は不要です。

```typescript
// store/index.ts で既に設定済み
import { createStorageMiddleware } from '@/lib/storageMiddleware';

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(createStorageMiddleware()),
});
```

### セッションの手動操作

```typescript
import {
  loadSpellingSession,
  saveSpellingSession,
  clearSpellingSession,
  isSessionValid,
} from '@/lib';

// セッションを読み込み
const session = loadSpellingSession();

// セッションが有効か確認（24時間以内）
if (isSessionValid(session)) {
  console.log('セッションを復元できます');
  // Redux に復元
  dispatch(restoreSession({
    currentIndex: session.currentIndex,
    answers: session.answers,
  }));
}

// セッションを手動保存
saveSpellingSession({
  startRange: 1,
  endRange: 100,
  currentIndex: 50,
  answers: [],
  showImages: true,
  startedAt: Date.now(),
  lastUpdatedAt: Date.now(),
});

// セッションをクリア
clearSpellingSession();
```

### 学習履歴の保存

```typescript
import {
  saveSpellingHistory,
  loadSpellingHistory,
  getHistoryStats,
} from '@/lib';

// 完了時に履歴を保存
saveSpellingHistory({
  startRange: 1,
  endRange: 100,
  totalWords: 100,
  correctWords: 85,
  accuracy: 85,
  completedAt: Date.now(),
  duration: 600, // 秒
});

// 履歴を取得
const history = loadSpellingHistory();
console.log(history); // 最新10件

// 統計を取得
const stats = getHistoryStats();
console.log(stats);
// {
//   totalSessions: 5,
//   totalWords: 500,
//   totalCorrect: 425,
//   averageAccuracy: 85,
//   bestAccuracy: 95
// }
```

### 設定の永続化

```typescript
import {
  saveSpellingConfig,
  loadSpellingConfig,
  getDefaultConfig,
} from '@/lib';

// 設定を保存
saveSpellingConfig({
  defaultStartRange: 1,
  defaultEndRange: 200,
  defaultShowImages: false,
});

// 設定を読み込み
const config = loadSpellingConfig();

// デフォルト設定を取得
const defaultConfig = getDefaultConfig();
```

### ストレージ情報の取得（デバッグ用）

```typescript
import { getStorageInfo, clearAllData } from '@/lib';

// ストレージの状態確認
const info = getStorageInfo();
console.log(info);
// {
//   hasSession: true,
//   hasConfig: true,
//   historyCount: 5,
//   isSessionValid: true
// }

// すべてのデータをクリア
clearAllData();
```

---

## 🔄 自動保存のタイミング

以下のアクションが実行された時に、自動的に保存されます：

- `spelling/setConfig` - 設定変更時
- `spelling/submitAnswer` - 回答送信時
- `spelling/nextWord` - 次の単語に進んだ時
- `spelling/previousWord` - 前の単語に戻った時
- `spelling/goToWord` - 特定の単語にジャンプした時
- `spelling/loadWords/fulfilled` - 単語読み込み完了時

---

## 💾 保存されるデータ

### SpellingSession（セッション）
```typescript
{
  startRange: number;      // 開始範囲
  endRange: number;        // 終了範囲
  currentIndex: number;    // 現在の単語インデックス
  answers: SpellingAnswer[]; // 回答履歴
  showImages: boolean;     // 画像表示設定
  startedAt: number;       // 開始時刻（タイムスタンプ）
  lastUpdatedAt: number;   // 最終更新時刻
}
```

### SpellingConfig（設定）
```typescript
{
  defaultStartRange: number;
  defaultEndRange: number;
  defaultShowImages: boolean;
}
```

### SpellingHistoryEntry（履歴）
```typescript
{
  id: string;
  startRange: number;
  endRange: number;
  totalWords: number;
  correctWords: number;
  accuracy: number;        // パーセンテージ
  completedAt: number;     // 完了時刻
  duration: number;        // 所要時間（秒）
}
```

---

## 🎨 UI実装例

### 「続きから再開」ボタン

```typescript
import { loadSpellingSession, isSessionValid } from '@/lib';
import { restoreSession, loadWords } from '@/features/spelling/spellingSlice';

const ResumeButton = () => {
  const dispatch = useAppDispatch();
  const session = loadSpellingSession();
  const canResume = isSessionValid(session);

  const handleResume = async () => {
    if (session) {
      // 単語を再取得
      await dispatch(loadWords({
        start: session.startRange,
        end: session.endRange,
      }));
      
      // セッションを復元
      dispatch(restoreSession({
        currentIndex: session.currentIndex,
        answers: session.answers,
      }));
    }
  };

  if (!canResume) return null;

  return (
    <button onClick={handleResume}>
      続きから再開（{session?.currentIndex + 1} / {session?.endRange})
    </button>
  );
};
```

### 学習履歴の表示

```typescript
import { loadSpellingHistory } from '@/lib';

const HistoryList = () => {
  const history = loadSpellingHistory();

  return (
    <div>
      <h2>学習履歴</h2>
      {history.map(entry => (
        <div key={entry.id}>
          <p>範囲: {entry.startRange} - {entry.endRange}</p>
          <p>正答率: {entry.accuracy}%</p>
          <p>所要時間: {Math.floor(entry.duration / 60)}分</p>
        </div>
      ))}
    </div>
  );
};
```

---

## ⚠️ 注意事項

1. **LocalStorageの容量制限**
   - ブラウザによって異なりますが、通常5-10MB程度
   - 履歴は最新10件のみ保持

2. **プライベートブラウジング**
   - シークレットモードでは保存されない場合があります

3. **セッションの有効期限**
   - 24時間経過すると、自動的に無効になります
   - `isSessionValid()` で確認できます

4. **データのクリア**
   - ブラウザの設定でLocalStorageをクリアすると削除されます
   - `clearAllData()` で手動削除も可能

---

## 🔐 セキュリティ

- LocalStorageは同一オリジンのみアクセス可能
- 個人情報は保存しない設計
- 単語の回答履歴のみを保存
