// src/features/spelling/spellingSlice.ts

import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type { SpellingState, SpellingAnswer } from '@/types';
import { fetchWords, checkSpelling } from '@/lib/wordsApi';
import { loadSpellingSession, isSessionValid } from '@/lib/storage';
import { DEFAULT_CONFIG } from '@/config/constants';

// セッションから復元を試みる
const savedSession = loadSpellingSession();
const canRestoreSession = isSessionValid(savedSession);

const initialState: SpellingState = {
  words: [],
  currentIndex: canRestoreSession && savedSession ? savedSession.currentIndex : 0,
  answers: canRestoreSession && savedSession ? savedSession.answers : [],
  isLoading: false,
  error: null,
  showImages: canRestoreSession && savedSession ? savedSession.showImages : DEFAULT_CONFIG.showImages,
  startRange: canRestoreSession && savedSession ? savedSession.startRange : DEFAULT_CONFIG.startRange,
  endRange: canRestoreSession && savedSession ? savedSession.endRange : DEFAULT_CONFIG.endRange,
  isReviewMode: false,
};

/**
 * 単語リストを取得する非同期アクション
 */
export const loadWords = createAsyncThunk(
  'spelling/loadWords',
  async ({ start, end }: { start: number; end: number }) => {
    const words = await fetchWords(start, end);
    return words;
  }
);

const spellingSlice = createSlice({
  name: 'spelling',
  initialState,
  reducers: {
    /**
     * 設定を更新
     */
    setConfig: (
      state,
      action: PayloadAction<{ showImages: boolean; startRange: number; endRange: number }>
    ) => {
      state.showImages = action.payload.showImages;
      state.startRange = action.payload.startRange;
      state.endRange = action.payload.endRange;
    },

    /**
     * 回答を送信
     */
    submitAnswer: (state, action: PayloadAction<string>) => {
      const currentWord = state.words[state.currentIndex];
      if (!currentWord) return;

      console.log('submitAnswer called:', {
        userAnswer: action.payload,
        currentWord: currentWord.word,
        currentAnswersLength: state.answers.length,
      });

      const isCorrect = checkSpelling(action.payload, currentWord.word);
      const answer: SpellingAnswer = {
        wordId: currentWord.id,
        userAnswer: action.payload,
        isCorrect,
        correctWord: currentWord.word,
      };

      state.answers.push(answer);
      
      console.log('Answer added. Total answers now:', state.answers.length);
    },

    /**
     * 次の単語に進む
     */
    nextWord: (state) => {
      if (state.currentIndex < state.words.length - 1) {
        state.currentIndex += 1;
      }
    },

    /**
     * 前の単語に戻る
     */
    previousWord: (state) => {
      if (state.currentIndex > 0) {
        state.currentIndex -= 1;
      }
    },

    /**
     * 特定の単語にジャンプ
     */
    goToWord: (state, action: PayloadAction<number>) => {
      const index = action.payload;
      if (index >= 0 && index < state.words.length) {
        state.currentIndex = index;
      }
    },

    /**
     * スペリングをリセット
     */
    resetSpelling: (state) => {
      state.currentIndex = 0;
      state.answers = [];
      state.error = null;
    },

    /**
     * すべてをリセット
     */
    resetAll: (state) => {
      // initialStateに戻すが、復習モードはリセット
      Object.assign(state, {
        ...initialState,
        isReviewMode: false,
      });
    },

    /**
     * 間違えた単語で復習モードを開始
     */
    startReviewMode: (state, action: PayloadAction<{ incorrectWords: any[] }>) => {
      console.log('=== startReviewMode reducer ===');
      console.log('incorrectWords received:', action.payload.incorrectWords);
      console.log('incorrectWords length:', action.payload.incorrectWords.length);
      
      state.words = action.payload.incorrectWords;
      state.currentIndex = 0;
      state.answers = [];
      state.isReviewMode = true;
      state.error = null;
      
      console.log('state.words after assignment:', state.words);
      console.log('state.isReviewMode:', state.isReviewMode);
    },

    /**
     * 復習モードを終了
     */
    endReviewMode: (state) => {
      state.isReviewMode = false;
    },

    /**
     * セッションから復元
     */
    restoreSession: (state, action: PayloadAction<{ currentIndex: number; answers: SpellingAnswer[] }>) => {
      state.currentIndex = action.payload.currentIndex;
      state.answers = action.payload.answers;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadWords.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadWords.fulfilled, (state, action) => {
        state.isLoading = false;
        state.words = action.payload;
        // 初回はランダムな位置から開始
        state.currentIndex = Math.floor(Math.random() * action.payload.length);
        state.answers = [];
      })
      .addCase(loadWords.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || '単語の読み込みに失敗しました';
      });
  },
});

export const {
  setConfig,
  submitAnswer,
  nextWord,
  previousWord,
  goToWord,
  resetSpelling,
  resetAll,
  startReviewMode,
  endReviewMode,
  restoreSession,
} = spellingSlice.actions;

export default spellingSlice.reducer;
