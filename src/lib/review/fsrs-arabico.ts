import { FSRS, FSRSRating, type FSRSCard, type ScheduleInfo } from './fsrs';
import { vocabularyDB } from '$lib/db';
import type { VocabularyEntry } from '$lib/types';

const fsrs = new FSRS();

/**
 * Review a word with FSRS + Quranic adjustments:
 * 1. Root family bonus: boost stability if related words already known
 * 2. Frequency adjustment: common Quranic words get stability boost
 */
export async function reviewWord(
  card: FSRSCard,
  rating: FSRSRating,
  entry: VocabularyEntry,
  now?: Date
): Promise<ScheduleInfo> {
  const result = fsrs.review(card, rating, now);

  // Root family bonus
  if (entry.root) {
    try {
      const relatedWords = await vocabularyDB.getByRoot(entry.root);
      const knownCount = relatedWords.filter(w => w.familiarity === 'known').length;
      const total = relatedWords.length;
      if (total > 1) {
        const knownRatio = knownCount / total;
        // Up to 20% stability boost
        result.card.stability *= 1 + (knownRatio * 0.2);
      }
    } catch {
      // Skip bonus if DB lookup fails
    }
  }

  // Frequency adjustment
  const freqBonus = getFrequencyBonus(entry.frequencyRank);
  result.card.stability *= freqBonus;

  // Recalculate interval from adjusted stability
  result.interval = Math.max(1, Math.min(365, Math.round(result.card.stability * 0.9)));
  result.nextReviewDate = new Date(now ?? new Date());
  result.nextReviewDate.setDate(result.nextReviewDate.getDate() + result.interval);

  return result;
}

function getFrequencyBonus(rank: number): number {
  if (!rank || rank <= 0) return 1.0;
  if (rank <= 100) return 1.15;
  if (rank <= 500) return 1.08;
  if (rank <= 1000) return 1.0;
  return 0.95;
}

/**
 * Determine if a word should be promoted to "known" status
 */
export function shouldPromoteToKnown(card: FSRSCard): boolean {
  return card.stability >= 21 && card.reps >= 5;
}

/**
 * Calculate a difficulty score (0-1) for queue prioritization
 */
export function calculateDifficultyScore(card: FSRSCard): number {
  const stabilityFactor = Math.min(1, card.stability / 90);
  const diffFactor = card.difficulty / 10;
  return Math.max(0, Math.min(1, (diffFactor * 0.6 + (1 - stabilityFactor) * 0.4)));
}

/**
 * Get the FSRS instance for direct use (e.g., retrievability calculations)
 */
export function getFSRS(): FSRS {
  return fsrs;
}

export { FSRSRating, FSRSState } from './fsrs';
export type { FSRSCard, ScheduleInfo } from './fsrs';
