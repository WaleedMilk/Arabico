import { getSurahAyahsAsync } from './quran-data';
import { getSurahById } from './surahs';
import type { TestWord, TestResult, FSRSRatingType, MCQOption } from '$lib/types';

/**
 * Extract unique test words from an ayah range.
 * Deduplicates by normalized surface form to avoid testing the same word twice.
 */
export async function extractWordsFromRange(
  surahStart: number,
  ayahStart: number,
  surahEnd: number,
  ayahEnd: number
): Promise<TestWord[]> {
  const words: TestWord[] = [];
  const seen = new Set<string>();

  for (let surahId = surahStart; surahId <= surahEnd; surahId++) {
    const ayahs = await getSurahAyahsAsync(surahId);
    if (!ayahs) continue;

    const surahMeta = getSurahById(surahId);
    const surahName = surahMeta?.englishName ?? `Surah ${surahId}`;

    const startAyah = surahId === surahStart ? ayahStart : 1;
    const endAyah = surahId === surahEnd ? ayahEnd : ayahs.length;

    for (const ayah of ayahs) {
      if (ayah.id < startAyah || ayah.id > endAyah) continue;

      for (let wi = 0; wi < ayah.words.length; wi++) {
        const word = ayah.words[wi];
        // Skip if we've seen this surface form
        const normalized = word.text.trim();
        if (seen.has(normalized) || !normalized) continue;
        seen.add(normalized);

        // Get translation — try the word's own translation data
        const wordWithTrans = word as any;
        const translation = wordWithTrans.commonTranslation || wordWithTrans.translation || wordWithTrans.e || '';

        words.push({
          wordId: `${surahId}:${ayah.id}:${wi + 1}`,
          arabic: normalized,
          translation: translation,
          transliteration: wordWithTrans.transliteration || wordWithTrans.d || undefined,
          surahName,
          ayahRef: `${surahName} ${surahId}:${ayah.id}`,
        });
      }
    }
  }

  return words;
}

/**
 * Extract words from specific ayahs (not a range).
 */
export async function extractWordsFromSpecificAyahs(
  ayahs: { surah: number; ayah: number }[]
): Promise<TestWord[]> {
  const words: TestWord[] = [];
  const seen = new Set<string>();

  for (const { surah, ayah: ayahNum } of ayahs) {
    const surahAyahs = await getSurahAyahsAsync(surah);
    if (!surahAyahs) continue;

    const surahMeta = getSurahById(surah);
    const surahName = surahMeta?.englishName ?? `Surah ${surah}`;

    const ayah = surahAyahs.find(a => a.id === ayahNum);
    if (!ayah) continue;

    for (let wi = 0; wi < ayah.words.length; wi++) {
      const word = ayah.words[wi];
      const normalized = word.text.trim();
      if (seen.has(normalized) || !normalized) continue;
      seen.add(normalized);

      const wordWithTrans = word as any;
      const translation = wordWithTrans.commonTranslation || wordWithTrans.translation || wordWithTrans.e || '';

      words.push({
        wordId: `${surah}:${ayahNum}:${wi + 1}`,
        arabic: normalized,
        translation: translation,
        transliteration: wordWithTrans.transliteration || wordWithTrans.d || undefined,
        surahName,
        ayahRef: `${surahName} ${surah}:${ayahNum}`,
      });
    }
  }

  return words;
}

/**
 * Calculate test result from ratings.
 * Again=0, Hard=33, Good=67, Easy=100 per word, averaged.
 */
export function calculateTestResult(
  words: TestWord[],
  ratings: Map<string, FSRSRatingType>,
  startTime: Date
): TestResult {
  const ratingScores: Record<number, number> = { 1: 0, 2: 33, 3: 67, 4: 100 };

  let totalScore = 0;
  const problemWords: TestWord[] = [];

  for (const word of words) {
    const rating = ratings.get(word.wordId);
    if (rating !== undefined) {
      totalScore += ratingScores[rating] ?? 0;
      if (rating <= 2) {
        problemWords.push(word);
      }
    }
  }

  const overallScore = words.length > 0 ? Math.round(totalScore / words.length) : 0;
  const endTime = new Date();

  return {
    totalWords: words.length,
    ratings,
    overallScore,
    problemWords,
    startTime,
    endTime,
    duration: endTime.getTime() - startTime.getTime(),
  };
}

/**
 * Shuffle array (Fisher-Yates)
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Common Quranic word meanings used as fallback distractors
const FALLBACK_TRANSLATIONS = [
  'Lord', 'mercy', 'believe', 'people', 'earth', 'heaven', 'day', 'truth',
  'knowledge', 'path', 'light', 'heart', 'soul', 'prayer', 'reward',
  'worship', 'forgive', 'righteous', 'guardian', 'sustainer',
];

/**
 * Generate 4 MCQ options for a word (1 correct + 3 distractors).
 * Distractors are picked from other test words' translations.
 */
export function generateMCQOptions(
  correctWord: TestWord,
  allWords: TestWord[]
): MCQOption[] {
  const correctText = correctWord.translation || '—';

  // Collect unique distractor translations from other words
  const otherTranslations = allWords
    .filter(w => w.wordId !== correctWord.wordId && w.translation && w.translation !== correctText)
    .map(w => w.translation);

  // Deduplicate
  const unique = [...new Set(otherTranslations)];
  const distractors: string[] = [];

  // Pick up to 3 random distractors from other test words
  const shuffledUnique = shuffleArray(unique);
  for (const t of shuffledUnique) {
    if (distractors.length >= 3) break;
    distractors.push(t);
  }

  // Pad with fallback translations if needed
  if (distractors.length < 3) {
    const fallbacks = shuffleArray(
      FALLBACK_TRANSLATIONS.filter(f => f !== correctText && !distractors.includes(f))
    );
    for (const f of fallbacks) {
      if (distractors.length >= 3) break;
      distractors.push(f);
    }
  }

  const options: MCQOption[] = [
    { text: correctText, isCorrect: true },
    ...distractors.map(text => ({ text, isCorrect: false })),
  ];

  return shuffleArray(options);
}
