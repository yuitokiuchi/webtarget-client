// src/lib/__mocks__/wordsApi.mock.ts

import type { Word } from '@/types';

/**
 * モック単語データ生成（開発・テスト用）
 */
export const generateMockWords = (start: number, end: number): Word[] => {
  const words: Word[] = [];
  
  const mockData = [
    { word: 'abandon', pos: '動詞', pronunciation: 'əˈbændən', meaning: '見捨てる、放棄する' },
    { word: 'ability', pos: '名詞', pronunciation: 'əˈbɪləti', meaning: '能力、才能' },
    { word: 'abolish', pos: '動詞', pronunciation: 'əˈbɒlɪʃ', meaning: '廃止する' },
    { word: 'absorb', pos: '動詞', pronunciation: 'əbˈzɔːb', meaning: '吸収する' },
    { word: 'abstract', pos: '形容詞', pronunciation: 'ˈæbstrækt', meaning: '抽象的な' },
  ];

  for (let i = start; i <= end && i <= start + 100; i++) {
    const mockIndex = (i - 1) % mockData.length;
    const mock = mockData[mockIndex];
    
    words.push({
      id: i,
      word: `${mock.word}${i > mockData.length ? i : ''}`,
      part_of_speech: mock.pos,
      pronunciation: mock.pronunciation,
      japanese_meaning: mock.meaning,
      example_sentence: `This is an example sentence for ${mock.word}.`,
    });
  }

  return words;
};

/**
 * モックAPI（オフライン開発用）
 */
export const fetchWordsMock = async (start: number, end: number): Promise<Word[]> => {
  // 実際のAPIを模倣して遅延を追加
  await new Promise(resolve => setTimeout(resolve, 300));
  
  return generateMockWords(start, end);
};
