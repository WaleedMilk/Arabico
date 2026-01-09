/**
 * @fileoverview Tests for the SRS (Spaced Repetition System) algorithm
 *
 * These tests verify the core learning algorithm that determines:
 * - When words should be reviewed next
 * - How ease factors adjust based on performance
 * - When words should be promoted to "known" status
 *
 * AI: These tests are critical for ensuring changes to the SRS algorithm
 * don't break the learning system. Run after any algorithm modifications.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
	calculateNextReview,
	calculateRootFamilyBonus,
	calculateDifficultyScore,
	shouldPromoteToKnown,
	getRecommendedReviewCount
} from './srs-algorithm';
import type { VocabularyEntry, ReviewQuality } from '$lib/types';

// Helper to create a mock vocabulary entry
function createMockEntry(overrides: Partial<VocabularyEntry> = {}): VocabularyEntry {
	return {
		id: 1,
		wordId: 'test-word-1',
		surfaceForm: 'بِسْمِ',
		lemma: 'اسم',
		root: 'س-م-و',
		gloss: 'name',
		familiarity: 'learning',
		easeFactor: 2.5,
		interval: 1,
		consecutiveCorrect: 0,
		reviewCount: 0,
		frequencyRank: 500,
		firstSeen: { surah: 1, ayah: 1, wordIndex: 0 },
		encounterLocations: [],
		difficultyScore: 0.5,
		...overrides
	};
}

describe('SRS Algorithm', () => {
	describe('calculateNextReview', () => {
		describe('failed reviews (quality < 3)', () => {
			it('resets interval to 1 day on quality 0', () => {
				const entry = createMockEntry({ interval: 30, consecutiveCorrect: 5 });
				const result = calculateNextReview(entry, 0);

				expect(result.newInterval).toBe(1);
				expect(result.newConsecutiveCorrect).toBe(0);
			});

			it('resets interval to 1 day on quality 1', () => {
				const entry = createMockEntry({ interval: 30 });
				const result = calculateNextReview(entry, 1);

				expect(result.newInterval).toBe(1);
				expect(result.newConsecutiveCorrect).toBe(0);
			});

			it('resets interval to 1 day on quality 2', () => {
				const entry = createMockEntry({ interval: 30 });
				const result = calculateNextReview(entry, 2);

				expect(result.newInterval).toBe(1);
				expect(result.newConsecutiveCorrect).toBe(0);
			});

			it('decreases ease factor on failure', () => {
				const entry = createMockEntry({ easeFactor: 2.5 });
				const result = calculateNextReview(entry, 0);

				expect(result.newEaseFactor).toBeLessThan(2.5);
			});

			it('clamps ease factor at minimum 1.3 on repeated failures', () => {
				const entry = createMockEntry({ easeFactor: 1.3 });
				const result = calculateNextReview(entry, 0);

				expect(result.newEaseFactor).toBe(1.3);
			});
		});

		describe('successful reviews (quality >= 3)', () => {
			it('sets first interval to 1 day on first success', () => {
				const entry = createMockEntry({ consecutiveCorrect: 0 });
				const result = calculateNextReview(entry, 4);

				expect(result.newInterval).toBeGreaterThanOrEqual(1);
				expect(result.newConsecutiveCorrect).toBe(1);
			});

			it('sets second interval to approximately 6 days on second success', () => {
				const entry = createMockEntry({ consecutiveCorrect: 1, interval: 1 });
				const result = calculateNextReview(entry, 4);

				// With frequency multiplier variations, should be around 6
				expect(result.newInterval).toBeGreaterThanOrEqual(5);
				expect(result.newInterval).toBeLessThanOrEqual(8);
				expect(result.newConsecutiveCorrect).toBe(2);
			});

			it('multiplies interval by ease factor on subsequent reviews', () => {
				const entry = createMockEntry({
					consecutiveCorrect: 2,
					interval: 6,
					easeFactor: 2.5
				});
				const result = calculateNextReview(entry, 4);

				// 6 * 2.5 = 15, with frequency adjustments
				expect(result.newInterval).toBeGreaterThan(6);
			});

			it('increments consecutive correct count', () => {
				const entry = createMockEntry({ consecutiveCorrect: 3 });
				const result = calculateNextReview(entry, 4);

				expect(result.newConsecutiveCorrect).toBe(4);
			});

			it('increases ease factor on perfect response (quality 5)', () => {
				const entry = createMockEntry({ easeFactor: 2.3 });
				const result = calculateNextReview(entry, 5);

				expect(result.newEaseFactor).toBeGreaterThan(2.3);
			});
		});

		describe('ease factor adjustments', () => {
			it('increases ease factor for quality 5', () => {
				const entry = createMockEntry({ easeFactor: 2.2 });
				const result = calculateNextReview(entry, 5);

				expect(result.newEaseFactor).toBeGreaterThan(2.2);
			});

			it('slightly increases ease factor for quality 4', () => {
				const entry = createMockEntry({ easeFactor: 2.2 });
				const result = calculateNextReview(entry, 4);

				expect(result.newEaseFactor).toBeGreaterThanOrEqual(2.2);
			});

			it('slightly decreases ease factor for quality 3', () => {
				const entry = createMockEntry({ easeFactor: 2.2 });
				const result = calculateNextReview(entry, 3);

				expect(result.newEaseFactor).toBeLessThanOrEqual(2.2);
			});

			it('clamps ease factor at maximum 2.5', () => {
				const entry = createMockEntry({ easeFactor: 2.5 });
				const result = calculateNextReview(entry, 5);

				expect(result.newEaseFactor).toBeLessThanOrEqual(2.5);
			});

			it('clamps ease factor at minimum 1.3', () => {
				const entry = createMockEntry({ easeFactor: 1.3 });
				const result = calculateNextReview(entry, 0);

				expect(result.newEaseFactor).toBe(1.3);
			});
		});

		describe('interval bounds', () => {
			it('clamps interval at minimum 1 day', () => {
				const entry = createMockEntry({ interval: 0 });
				const result = calculateNextReview(entry, 0);

				expect(result.newInterval).toBeGreaterThanOrEqual(1);
			});

			it('clamps interval at maximum 365 days', () => {
				const entry = createMockEntry({
					consecutiveCorrect: 10,
					interval: 300,
					easeFactor: 2.5
				});
				const result = calculateNextReview(entry, 5);

				expect(result.newInterval).toBeLessThanOrEqual(365);
			});
		});

		describe('root family bonus', () => {
			it('increases interval when root family bonus is applied', () => {
				const entry = createMockEntry({
					consecutiveCorrect: 3,
					interval: 10,
					easeFactor: 2.0
				});
				const withoutBonus = calculateNextReview(entry, 4, 0);
				const withBonus = calculateNextReview(entry, 4, 0.5);

				expect(withBonus.newInterval).toBeGreaterThanOrEqual(withoutBonus.newInterval);
			});
		});

		describe('next review date', () => {
			it('returns a future date', () => {
				const entry = createMockEntry();
				const result = calculateNextReview(entry, 4);
				const now = new Date();

				expect(result.nextReviewDate.getTime()).toBeGreaterThan(now.getTime());
			});

			it('sets date to interval days from now', () => {
				const entry = createMockEntry({ consecutiveCorrect: 0 });
				const result = calculateNextReview(entry, 4);
				const now = new Date();
				const diffDays = Math.round(
					(result.nextReviewDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
				);

				expect(diffDays).toBe(result.newInterval);
			});
		});

		describe('edge cases', () => {
			it('handles entry with undefined values', () => {
				const entry = createMockEntry({
					easeFactor: undefined,
					interval: undefined,
					consecutiveCorrect: undefined
				});
				const result = calculateNextReview(entry, 4);

				expect(result.newEaseFactor).toBeDefined();
				expect(result.newInterval).toBeDefined();
				expect(result.newConsecutiveCorrect).toBeDefined();
			});

			it('handles zero frequency rank', () => {
				const entry = createMockEntry({ frequencyRank: 0 });
				const result = calculateNextReview(entry, 4);

				expect(result.newInterval).toBeGreaterThan(0);
			});
		});
	});

	describe('calculateRootFamilyBonus', () => {
		it('returns 0 for single word family', () => {
			expect(calculateRootFamilyBonus(0, 1)).toBe(0);
		});

		it('returns 0 when no words known', () => {
			expect(calculateRootFamilyBonus(0, 5)).toBe(0);
		});

		it('returns partial bonus for partially known family', () => {
			const bonus = calculateRootFamilyBonus(2, 4);
			expect(bonus).toBeGreaterThan(0);
			expect(bonus).toBeLessThan(0.5);
		});

		it('returns maximum 0.5 for fully known family', () => {
			const bonus = calculateRootFamilyBonus(4, 4);
			expect(bonus).toBeLessThanOrEqual(0.5);
		});

		it('scales linearly with known ratio', () => {
			const halfKnown = calculateRootFamilyBonus(2, 4);
			const quarterKnown = calculateRootFamilyBonus(1, 4);
			expect(halfKnown).toBeGreaterThan(quarterKnown);
		});
	});

	describe('calculateDifficultyScore', () => {
		it('returns higher score for lower ease factor', () => {
			const easy = createMockEntry({ easeFactor: 2.5 });
			const hard = createMockEntry({ easeFactor: 1.3 });

			expect(calculateDifficultyScore(hard)).toBeGreaterThan(calculateDifficultyScore(easy));
		});

		it('returns higher score for fewer consecutive correct', () => {
			const consistent = createMockEntry({ consecutiveCorrect: 5 });
			const inconsistent = createMockEntry({ consecutiveCorrect: 0 });

			expect(calculateDifficultyScore(inconsistent)).toBeGreaterThan(
				calculateDifficultyScore(consistent)
			);
		});

		it('returns score between 0 and 1', () => {
			const entry = createMockEntry();
			const score = calculateDifficultyScore(entry);

			expect(score).toBeGreaterThanOrEqual(0);
			expect(score).toBeLessThanOrEqual(1);
		});

		it('handles undefined values', () => {
			const entry = createMockEntry({
				easeFactor: undefined,
				consecutiveCorrect: undefined,
				reviewCount: undefined
			});
			const score = calculateDifficultyScore(entry);

			expect(score).toBeGreaterThanOrEqual(0);
			expect(score).toBeLessThanOrEqual(1);
		});
	});

	describe('shouldPromoteToKnown', () => {
		it('promotes when all criteria met', () => {
			const entry = createMockEntry({
				consecutiveCorrect: 5,
				easeFactor: 2.0,
				interval: 21
			});
			expect(shouldPromoteToKnown(entry)).toBe(true);
		});

		it('does not promote with insufficient consecutive correct', () => {
			const entry = createMockEntry({
				consecutiveCorrect: 4,
				easeFactor: 2.0,
				interval: 21
			});
			expect(shouldPromoteToKnown(entry)).toBe(false);
		});

		it('does not promote with low ease factor', () => {
			const entry = createMockEntry({
				consecutiveCorrect: 5,
				easeFactor: 1.9,
				interval: 21
			});
			expect(shouldPromoteToKnown(entry)).toBe(false);
		});

		it('does not promote with short interval', () => {
			const entry = createMockEntry({
				consecutiveCorrect: 5,
				easeFactor: 2.0,
				interval: 20
			});
			expect(shouldPromoteToKnown(entry)).toBe(false);
		});

		it('promotes with exceeding criteria', () => {
			const entry = createMockEntry({
				consecutiveCorrect: 10,
				easeFactor: 2.5,
				interval: 60
			});
			expect(shouldPromoteToKnown(entry)).toBe(true);
		});

		it('handles undefined values', () => {
			const entry = createMockEntry({
				consecutiveCorrect: undefined,
				easeFactor: undefined,
				interval: undefined
			});
			// With defaults, should not promote
			expect(shouldPromoteToKnown(entry)).toBe(false);
		});
	});

	describe('getRecommendedReviewCount', () => {
		it('returns due count when under 50', () => {
			expect(getRecommendedReviewCount(30, 10)).toBe(30);
		});

		it('caps at 50 when due count exceeds', () => {
			expect(getRecommendedReviewCount(100, 10)).toBe(50);
		});

		it('adds learning words when due count is low', () => {
			const result = getRecommendedReviewCount(5, 10);
			expect(result).toBeGreaterThan(5);
			expect(result).toBeLessThanOrEqual(10);
		});

		it('returns 0 when both counts are 0', () => {
			expect(getRecommendedReviewCount(0, 0)).toBe(0);
		});

		it('limits added learning words to 5', () => {
			const result = getRecommendedReviewCount(5, 20);
			expect(result).toBe(10); // 5 due + 5 max learning
		});
	});
});

describe('SRS Algorithm Integration', () => {
	it('simulates a typical learning progression', () => {
		let entry = createMockEntry({
			easeFactor: 2.5,
			interval: 0,
			consecutiveCorrect: 0
		});

		// Day 1: First review - success
		let result = calculateNextReview(entry, 4);
		expect(result.newConsecutiveCorrect).toBe(1);

		// Update entry
		entry = {
			...entry,
			easeFactor: result.newEaseFactor,
			interval: result.newInterval,
			consecutiveCorrect: result.newConsecutiveCorrect
		};

		// Day 2: Second review - success
		result = calculateNextReview(entry, 4);
		expect(result.newConsecutiveCorrect).toBe(2);
		expect(result.newInterval).toBeGreaterThan(1);

		// Continue until promotion eligible
		for (let i = 0; i < 5; i++) {
			entry = {
				...entry,
				easeFactor: result.newEaseFactor,
				interval: result.newInterval,
				consecutiveCorrect: result.newConsecutiveCorrect
			};
			result = calculateNextReview(entry, 5); // Perfect recalls
		}

		// Check if eligible for promotion
		const finalEntry = {
			...entry,
			easeFactor: result.newEaseFactor,
			interval: result.newInterval,
			consecutiveCorrect: result.newConsecutiveCorrect
		};

		// After 5+ perfect reviews, should be close to promotion
		expect(finalEntry.consecutiveCorrect).toBeGreaterThanOrEqual(5);
	});

	it('handles a struggling learner pattern', () => {
		let entry = createMockEntry({
			easeFactor: 2.5,
			interval: 10,
			consecutiveCorrect: 3
		});

		// Fail a review
		let result = calculateNextReview(entry, 1);
		expect(result.newConsecutiveCorrect).toBe(0);
		expect(result.newInterval).toBe(1);
		expect(result.newEaseFactor).toBeLessThan(2.5);

		// Update and fail again
		entry = {
			...entry,
			easeFactor: result.newEaseFactor,
			interval: result.newInterval,
			consecutiveCorrect: result.newConsecutiveCorrect
		};
		result = calculateNextReview(entry, 0);

		// Ease factor should continue to drop (but stay above 1.3)
		expect(result.newEaseFactor).toBeGreaterThanOrEqual(1.3);
	});
});
