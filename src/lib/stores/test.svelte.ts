import { browser } from '$app/environment';
import { supabase, getCurrentUserId } from '$lib/db/supabase';
import {
  extractWordsFromRange,
  extractWordsFromSpecificAyahs,
  calculateTestResult,
  shuffleArray,
  generateMCQOptions
} from '$lib/data/test-utils';
import type { TestConfig, TestWord, TestResult, FSRSRatingType, TestMode, MCQOption } from '$lib/types';

function createTestStore() {
  let testConfig = $state<TestConfig | null>(null);
  let testWords = $state<TestWord[]>([]);
  let currentIndex = $state(0);
  let ratings = $state<Map<string, FSRSRatingType>>(new Map());
  let isLoading = $state(false);
  let isComplete = $state(false);
  let isRevealed = $state(false);
  let result = $state<TestResult | null>(null);
  let startTime = $state<Date | null>(null);
  let error = $state<string | null>(null);

  // MCQ state
  let mcqOptions = $state<MCQOption[]>([]);
  let mcqSelected = $state<string | null>(null);
  let mcqAnswered = $state(false);

  function generateOptionsForCurrent() {
    const word = testWords[currentIndex];
    if (word) {
      mcqOptions = generateMCQOptions(word, testWords);
    } else {
      mcqOptions = [];
    }
    mcqSelected = null;
    mcqAnswered = false;
  }

  return {
    get testConfig() { return testConfig; },
    get testWords() { return testWords; },
    get currentIndex() { return currentIndex; },
    get currentWord() { return testWords[currentIndex] ?? null; },
    get ratings() { return ratings; },
    get isLoading() { return isLoading; },
    get isComplete() { return isComplete; },
    get isRevealed() { return isRevealed; },
    get result() { return result; },
    get error() { return error; },
    get progress() {
      return testWords.length > 0 ? Math.round((currentIndex / testWords.length) * 100) : 0;
    },
    get totalWords() { return testWords.length; },
    get testMode(): TestMode { return testConfig?.testMode ?? 'flashcard'; },
    get mcqOptions() { return mcqOptions; },
    get mcqSelected() { return mcqSelected; },
    get mcqAnswered() { return mcqAnswered; },

    /**
     * Teacher: Create a test and save to Supabase
     */
    async createTest(config: {
      title?: string;
      testMode?: TestMode;
      surahStart: number;
      ayahStart: number;
      surahEnd: number;
      ayahEnd: number;
      specificAyahs?: { surah: number; ayah: number }[];
    }): Promise<string | null> {
      if (!browser) return null;

      isLoading = true;
      error = null;

      try {
        // Extract words
        let words: TestWord[];
        if (config.specificAyahs && config.specificAyahs.length > 0) {
          words = await extractWordsFromSpecificAyahs(config.specificAyahs);
        } else {
          words = await extractWordsFromRange(
            config.surahStart, config.ayahStart,
            config.surahEnd, config.ayahEnd
          );
        }

        if (words.length === 0) {
          error = 'No words found in the selected range.';
          return null;
        }

        const userId = await getCurrentUserId();
        const wordIds = words.map(w => w.wordId);

        // Save to Supabase
        const { data, error: insertError } = await supabase
          .from('test_configs')
          .insert({
            creator_id: userId,
            title: config.title || null,
            test_mode: config.testMode || 'flashcard',
            surah_start: config.surahStart,
            ayah_start: config.ayahStart,
            surah_end: config.surahEnd,
            ayah_end: config.ayahEnd,
            specific_ayahs: config.specificAyahs || null,
            word_ids: wordIds,
            word_count: words.length,
          })
          .select('id')
          .single();

        if (insertError) throw insertError;
        return data.id;
      } catch (err) {
        console.error('Error creating test:', err);
        error = err instanceof Error ? err.message : 'Failed to create test';
        return null;
      } finally {
        isLoading = false;
      }
    },

    /**
     * Student: Load a test by ID
     */
    async loadTest(testId: string) {
      if (!browser) return;

      isLoading = true;
      error = null;
      isComplete = false;
      result = null;
      currentIndex = 0;
      ratings = new Map();
      isRevealed = false;
      mcqOptions = [];
      mcqSelected = null;
      mcqAnswered = false;

      try {
        // Fetch test config from Supabase
        const { data, error: fetchError } = await supabase
          .from('test_configs')
          .select('*')
          .eq('id', testId)
          .single();

        if (fetchError) throw fetchError;
        if (!data) throw new Error('Test not found');

        testConfig = {
          id: data.id,
          creatorId: data.creator_id,
          title: data.title,
          testMode: data.test_mode || 'flashcard',
          surahStart: data.surah_start,
          ayahStart: data.ayah_start,
          surahEnd: data.surah_end,
          ayahEnd: data.ayah_end,
          specificAyahs: data.specific_ayahs,
          wordIds: data.word_ids,
          wordCount: data.word_count,
          createdAt: data.created_at,
        };

        // Load word data from the ayah range
        let words: TestWord[];
        if (testConfig.specificAyahs && testConfig.specificAyahs.length > 0) {
          words = await extractWordsFromSpecificAyahs(testConfig.specificAyahs);
        } else {
          words = await extractWordsFromRange(
            testConfig.surahStart, testConfig.ayahStart,
            testConfig.surahEnd, testConfig.ayahEnd
          );
        }

        // Shuffle for test randomness
        testWords = shuffleArray(words);
        startTime = new Date();

        // Generate MCQ options for first word if in MCQ mode
        if (testConfig.testMode === 'mcq') {
          generateOptionsForCurrent();
        }
      } catch (err) {
        console.error('Error loading test:', err);
        error = err instanceof Error ? err.message : 'Failed to load test';
      } finally {
        isLoading = false;
      }
    },

    /**
     * Reveal the translation for the current word (flashcard mode)
     */
    reveal() {
      isRevealed = true;
    },

    /**
     * Record rating for current word and advance (flashcard mode)
     */
    recordRating(rating: FSRSRatingType) {
      if (currentIndex >= testWords.length) return;

      const newRatings = new Map(ratings);
      newRatings.set(testWords[currentIndex].wordId, rating);
      ratings = newRatings;
      isRevealed = false;
      currentIndex++;

      if (currentIndex >= testWords.length) {
        this.completeTest();
      }
    },

    /**
     * Select an MCQ answer. Shows feedback, then auto-advances after delay.
     */
    selectMCQAnswer(optionText: string) {
      if (mcqAnswered || currentIndex >= testWords.length) return;

      mcqSelected = optionText;
      mcqAnswered = true;

      const isCorrect = mcqOptions.find(o => o.text === optionText)?.isCorrect ?? false;
      const rating: FSRSRatingType = isCorrect ? 4 : 1;

      const newRatings = new Map(ratings);
      newRatings.set(testWords[currentIndex].wordId, rating);
      ratings = newRatings;

      // Auto-advance after brief delay for feedback
      setTimeout(() => {
        currentIndex++;
        mcqSelected = null;
        mcqAnswered = false;

        if (currentIndex >= testWords.length) {
          this.completeTest();
        } else {
          generateOptionsForCurrent();
        }
      }, isCorrect ? 600 : 1200);
    },

    /**
     * Complete the test and generate results
     */
    completeTest() {
      if (!startTime) return;
      isComplete = true;
      result = calculateTestResult(testWords, ratings, startTime);
    },

    /**
     * Reset everything
     */
    reset() {
      testConfig = null;
      testWords = [];
      currentIndex = 0;
      ratings = new Map();
      isLoading = false;
      isComplete = false;
      isRevealed = false;
      result = null;
      startTime = null;
      error = null;
      mcqOptions = [];
      mcqSelected = null;
      mcqAnswered = false;
    },
  };
}

export const testStore = createTestStore();
