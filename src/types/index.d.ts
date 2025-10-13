// src/types/index.d.ts

export interface Word {
  id: number;
  word: string;
  part_of_speech: string;
  pronunciation: string;
  japanese_meaning: string;
  example_sentence: string;
}

export interface SpellingAnswer {
  wordId: number;
  userAnswer: string;
  isCorrect: boolean;
  correctWord: string;
}

export interface SpellingState {
  words: Word[];
  currentIndex: number;
  answers: SpellingAnswer[];
  isLoading: boolean;
  error: string | null;
  showImages: boolean;
  startRange: number;
  endRange: number;
}
