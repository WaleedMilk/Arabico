/**
 * Spaced Repetition System (SRS) Algorithm for Arabico
 *
 * Based on SM-2 algorithm with modifications for Quranic Arabic learning:
 * - Root family bonus: knowing related words (same root) speeds learning
 * - Frequency adjustment: common Quranic words get longer intervals
 * - Difficulty tracking: words with poor response history get more practice
 */

import type { VocabularyEntry, ReviewQuality, SRSResult } from '$lib/types';

/**
 * SM-2 Quality Scale Reference:
 * 5 - Perfect response, no hesitation
 * 4 - Correct response after hesitation
 * 3 - Correct response with difficulty
 * 2 - Incorrect response, but upon seeing the correct one, remembered
 * 1 - Incorrect response, remembered upon seeing the correct answer
 * 0 - Complete blackout, no memory
 */

/**
 * Calculate the next review date and SRS parameters based on response quality
 *
 * @param entry - The vocabulary entry being reviewed
 * @param quality - User's self-reported recall quality (0-5)
 * @param rootFamilyBonus - Bonus from knowing related root-family words (0-0.5)
 * @returns New SRS values to apply to the entry
 */
export function calculateNextReview(
	entry: VocabularyEntry,
	quality: ReviewQuality,
	rootFamilyBonus: number = 0
): SRSResult {
	let { easeFactor, interval, consecutiveCorrect } = entry;

	// Ensure defaults
	easeFactor = easeFactor ?? 2.5;
	interval = interval ?? 0;
	consecutiveCorrect = consecutiveCorrect ?? 0;

	// Calculate new ease factor using SM-2 formula
	// EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
	let newEaseFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

	// Clamp ease factor between 1.3 and 2.5
	newEaseFactor = Math.max(1.3, Math.min(2.5, newEaseFactor));

	let newInterval: number;
	let newConsecutiveCorrect: number;

	if (quality < 3) {
		// Failed recall - reset interval but preserve some progress
		newInterval = 1; // Review again tomorrow
		newConsecutiveCorrect = 0;

		// Slightly decrease ease factor on failure
		newEaseFactor = Math.max(1.3, newEaseFactor - 0.2);
	} else {
		// Successful recall
		newConsecutiveCorrect = consecutiveCorrect + 1;

		if (newConsecutiveCorrect === 1) {
			// First successful review
			newInterval = 1;
		} else if (newConsecutiveCorrect === 2) {
			// Second successful review
			newInterval = 6;
		} else {
			// Apply ease factor with root family bonus
			const adjustedEaseFactor = newEaseFactor + rootFamilyBonus;
			newInterval = Math.round(interval * adjustedEaseFactor);
		}

		// Apply frequency multiplier - common words need less review
		const frequencyMultiplier = getFrequencyMultiplier(entry.frequencyRank);
		newInterval = Math.round(newInterval * frequencyMultiplier);

		// Quality-based adjustment
		if (quality === 5) {
			// Perfect recall - slight bonus
			newInterval = Math.round(newInterval * 1.1);
		} else if (quality === 3) {
			// Difficult recall - slight penalty
			newInterval = Math.round(newInterval * 0.9);
		}
	}

	// Clamp interval between 1 and 365 days
	newInterval = Math.max(1, Math.min(365, newInterval));

	// Calculate next review date
	const nextReviewDate = new Date();
	nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);

	return {
		newEaseFactor,
		newInterval,
		nextReviewDate,
		newConsecutiveCorrect
	};
}

/**
 * Get frequency multiplier based on word rank in Quran
 * Common words are naturally reinforced through reading
 */
function getFrequencyMultiplier(frequencyRank: number): number {
	if (!frequencyRank || frequencyRank <= 0) return 1.0;

	// Top 100 most common words - longer intervals (well-reinforced naturally)
	if (frequencyRank <= 100) return 1.3;

	// Top 500 words - slightly longer intervals
	if (frequencyRank <= 500) return 1.15;

	// Top 1000 words - normal intervals
	if (frequencyRank <= 1000) return 1.0;

	// Less common words - shorter intervals (need more practice)
	return 0.9;
}

/**
 * Calculate root family bonus based on known related words
 * Knowing words from the same root family helps learn new ones
 *
 * @param knownInFamily - Number of "known" words in the same root family
 * @param totalInFamily - Total words in the root family
 * @returns Bonus value (0-0.5) to add to ease factor
 */
export function calculateRootFamilyBonus(knownInFamily: number, totalInFamily: number): number {
	if (totalInFamily <= 1 || knownInFamily <= 0) return 0;

	// Calculate ratio of known words (excluding current word)
	const knownRatio = knownInFamily / totalInFamily;

	// Max bonus of 0.5 when most related words are known
	return knownRatio * 0.5;
}

/**
 * Calculate difficulty score based on review history
 * Higher score = more difficult word (needs more practice)
 *
 * @param entry - The vocabulary entry
 * @returns Difficulty score (0-1)
 */
export function calculateDifficultyScore(entry: VocabularyEntry): number {
	const { easeFactor, consecutiveCorrect, reviewCount } = entry;

	// Ensure defaults
	const ef = easeFactor ?? 2.5;
	const cc = consecutiveCorrect ?? 0;
	const rc = reviewCount ?? 0;

	// Factors contributing to difficulty:
	// 1. Lower ease factor = harder word
	const easeComponent = 1 - (ef - 1.3) / (2.5 - 1.3); // 0 at EF=2.5, 1 at EF=1.3

	// 2. Fewer consecutive correct = harder
	const streakComponent = Math.max(0, 1 - cc / 5); // 0 at 5+ streak, 1 at 0

	// 3. More reviews with still not "known" = harder
	const reviewComponent = rc > 0 ? Math.min(1, rc / 20) * 0.3 : 0;

	// Weighted average
	const difficulty = easeComponent * 0.4 + streakComponent * 0.4 + reviewComponent * 0.2;

	return Math.max(0, Math.min(1, difficulty));
}

/**
 * Determine if a word should be promoted to "known" status
 *
 * @param entry - The vocabulary entry after review update
 * @returns Whether the word should be marked as "known"
 */
export function shouldPromoteToKnown(entry: VocabularyEntry): boolean {
	const cc = entry.consecutiveCorrect ?? 0;
	const ef = entry.easeFactor ?? 2.5;
	const interval = entry.interval ?? 0;

	// Criteria for "known":
	// 1. At least 5 consecutive correct answers
	// 2. Ease factor above 2.0 (not struggling)
	// 3. Interval of at least 21 days
	return cc >= 5 && ef >= 2.0 && interval >= 21;
}

/**
 * Get recommended daily review count based on queue size
 *
 * @param dueCount - Number of words currently due
 * @param learningCount - Number of words in "learning" state
 * @returns Recommended number of words to review
 */
export function getRecommendedReviewCount(dueCount: number, learningCount: number): number {
	// Base recommendation: review all due words up to 50
	const dueReview = Math.min(dueCount, 50);

	// Add some new words if due count is low
	if (dueCount < 10 && learningCount > 0) {
		return dueReview + Math.min(5, learningCount);
	}

	return dueReview;
}
