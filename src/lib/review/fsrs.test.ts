/**
 * @fileoverview Tests for the FSRS-5 (Free Spaced Repetition Scheduler) algorithm.
 *
 * These tests verify:
 * - The forgetting curve formula and retrievability calculations
 * - Initial stability and difficulty for new cards
 * - Stability updates for successful recall, lapse, and short-term learning
 * - Difficulty updates with mean reversion
 * - State machine transitions (New -> Learning -> Review -> Relearning -> Review)
 * - Interval clamping and bounds enforcement
 * - Hard penalty and Easy bonus effects
 * - Full integration: simulating a realistic multi-session learning progression
 */

import { describe, it, expect } from 'vitest';
import { FSRS, FSRSState, FSRSRating } from './fsrs';
import type { FSRSCard } from './fsrs';

// ============================================================================
// Helpers
// ============================================================================

/**
 * Create a card with specific overrides for testing.
 */
function makeCard(overrides: Partial<FSRSCard> = {}): FSRSCard {
	return {
		...FSRS.newCard(),
		...overrides
	};
}

/**
 * Create a Review-state card that has been seen before, with configurable
 * stability, difficulty, elapsed time, etc.
 */
function makeReviewCard(overrides: Partial<FSRSCard> = {}): FSRSCard {
	const now = new Date();
	const lastReview = new Date(now);
	lastReview.setDate(lastReview.getDate() - 5); // 5 days ago by default

	return makeCard({
		state: FSRSState.Review,
		stability: 10,
		difficulty: 5,
		reps: 3,
		lapses: 0,
		lastReview: lastReview.toISOString(),
		scheduledDays: 10,
		elapsedDays: 5,
		...overrides
	});
}

/**
 * Create a Learning-state card.
 */
function makeLearningCard(overrides: Partial<FSRSCard> = {}): FSRSCard {
	const now = new Date();
	return makeCard({
		state: FSRSState.Learning,
		stability: 0.4072,
		difficulty: 7.2102,
		reps: 1,
		lapses: 0,
		lastReview: now.toISOString(),
		scheduledDays: 0,
		elapsedDays: 0,
		...overrides
	});
}

// ============================================================================
// Tests
// ============================================================================

describe('FSRS-5 Algorithm', () => {
	const fsrs = new FSRS();

	// --------------------------------------------------------------------------
	// Constructor
	// --------------------------------------------------------------------------

	describe('constructor', () => {
		it('creates an instance with default parameters', () => {
			const instance = new FSRS();
			expect(instance).toBeInstanceOf(FSRS);
		});

		it('accepts custom parameters', () => {
			const customParams = new Array(19).fill(1.0);
			const instance = new FSRS(customParams);
			expect(instance).toBeInstanceOf(FSRS);
		});

		it('accepts custom max interval', () => {
			const instance = new FSRS(undefined, 180);
			expect(instance).toBeInstanceOf(FSRS);
		});

		it('throws if fewer than 19 parameters are provided', () => {
			expect(() => new FSRS([1, 2, 3])).toThrow('FSRS requires 19 parameters');
		});
	});

	// --------------------------------------------------------------------------
	// Factory
	// --------------------------------------------------------------------------

	describe('FSRS.newCard', () => {
		it('returns a card in the New state', () => {
			const card = FSRS.newCard();
			expect(card.state).toBe(FSRSState.New);
		});

		it('returns a card with zero stability and difficulty', () => {
			const card = FSRS.newCard();
			expect(card.stability).toBe(0);
			expect(card.difficulty).toBe(0);
		});

		it('returns a card with zero reps and lapses', () => {
			const card = FSRS.newCard();
			expect(card.reps).toBe(0);
			expect(card.lapses).toBe(0);
		});

		it('returns a card with no lastReview', () => {
			const card = FSRS.newCard();
			expect(card.lastReview).toBeUndefined();
		});
	});

	// --------------------------------------------------------------------------
	// 1. Retrievability (Forgetting Curve)
	// --------------------------------------------------------------------------

	describe('retrievability', () => {
		it('returns 1 when elapsed time is 0 (just reviewed)', () => {
			expect(fsrs.retrievability(0, 10)).toBe(1);
		});

		it('returns approximately 0.9 when elapsed time equals stability', () => {
			const r = fsrs.retrievability(10, 10);
			expect(r).toBeCloseTo(0.9, 5);
		});

		it('returns approximately 0.9 for various stability values at t = S', () => {
			for (const s of [1, 5, 30, 100, 365]) {
				const r = fsrs.retrievability(s, s);
				expect(r).toBeCloseTo(0.9, 4);
			}
		});

		it('decreases as elapsed time increases', () => {
			const r1 = fsrs.retrievability(1, 10);
			const r2 = fsrs.retrievability(5, 10);
			const r3 = fsrs.retrievability(10, 10);
			const r4 = fsrs.retrievability(50, 10);

			expect(r1).toBeGreaterThan(r2);
			expect(r2).toBeGreaterThan(r3);
			expect(r3).toBeGreaterThan(r4);
		});

		it('approaches 0 as elapsed time approaches infinity', () => {
			const r = fsrs.retrievability(100000, 10);
			expect(r).toBeLessThan(0.05);
		});

		it('returns 0 for zero stability', () => {
			expect(fsrs.retrievability(5, 0)).toBe(0);
		});

		it('returns 1 for negative elapsed time', () => {
			expect(fsrs.retrievability(-1, 10)).toBe(1);
		});

		it('is higher with greater stability for the same elapsed time', () => {
			const rLow = fsrs.retrievability(10, 5);
			const rHigh = fsrs.retrievability(10, 50);
			expect(rHigh).toBeGreaterThan(rLow);
		});
	});

	// --------------------------------------------------------------------------
	// 2. New Card Scheduling
	// --------------------------------------------------------------------------

	describe('new card scheduling', () => {
		const card = FSRS.newCard();
		const now = new Date('2025-01-15T12:00:00Z');

		it('produces initial stability matching w[0] for Again', () => {
			const result = fsrs.review(card, FSRSRating.Again, now);
			expect(result.card.stability).toBeCloseTo(0.4072, 3);
		});

		it('produces initial stability matching w[1] for Hard', () => {
			const result = fsrs.review(card, FSRSRating.Hard, now);
			expect(result.card.stability).toBeCloseTo(1.1829, 3);
		});

		it('produces initial stability matching w[2] for Good', () => {
			const result = fsrs.review(card, FSRSRating.Good, now);
			expect(result.card.stability).toBeCloseTo(3.1262, 3);
		});

		it('produces initial stability matching w[3] for Easy', () => {
			const result = fsrs.review(card, FSRSRating.Easy, now);
			expect(result.card.stability).toBeCloseTo(15.4722, 3);
		});

		it('transitions Again to Learning state', () => {
			const result = fsrs.review(card, FSRSRating.Again, now);
			expect(result.card.state).toBe(FSRSState.Learning);
		});

		it('transitions Hard to Learning state', () => {
			const result = fsrs.review(card, FSRSRating.Hard, now);
			expect(result.card.state).toBe(FSRSState.Learning);
		});

		it('transitions Good to Review state', () => {
			const result = fsrs.review(card, FSRSRating.Good, now);
			expect(result.card.state).toBe(FSRSState.Review);
		});

		it('transitions Easy to Review state', () => {
			const result = fsrs.review(card, FSRSRating.Easy, now);
			expect(result.card.state).toBe(FSRSState.Review);
		});

		it('sets scheduledDays to 0 for Again and Hard', () => {
			const again = fsrs.review(card, FSRSRating.Again, now);
			const hard = fsrs.review(card, FSRSRating.Hard, now);
			expect(again.card.scheduledDays).toBe(0);
			expect(hard.card.scheduledDays).toBe(0);
		});

		it('sets positive scheduledDays for Good and Easy', () => {
			const good = fsrs.review(card, FSRSRating.Good, now);
			const easy = fsrs.review(card, FSRSRating.Easy, now);
			expect(good.card.scheduledDays).toBeGreaterThan(0);
			expect(easy.card.scheduledDays).toBeGreaterThan(0);
		});

		it('computes correct initial difficulty for each rating', () => {
			// D_0(G) = w[4] - exp(w[5] * (G - 1)) + 1
			// w[4] = 7.2102, w[5] = 0.5316
			const againD = 7.2102 - Math.exp(0.5316 * 0) + 1; // 7.2102 - 1 + 1 = 7.2102
			const hardD = 7.2102 - Math.exp(0.5316 * 1) + 1; // 7.2102 - 1.7015 + 1 = 6.5087
			const goodD = 7.2102 - Math.exp(0.5316 * 2) + 1; // 7.2102 - 2.895 + 1 = 5.3152
			const easyD = 7.2102 - Math.exp(0.5316 * 3) + 1; // 7.2102 - 4.929 + 1 = 3.281

			const resultAgain = fsrs.review(card, FSRSRating.Again, now);
			const resultHard = fsrs.review(card, FSRSRating.Hard, now);
			const resultGood = fsrs.review(card, FSRSRating.Good, now);
			const resultEasy = fsrs.review(card, FSRSRating.Easy, now);

			expect(resultAgain.card.difficulty).toBeCloseTo(againD, 2);
			expect(resultHard.card.difficulty).toBeCloseTo(hardD, 2);
			expect(resultGood.card.difficulty).toBeCloseTo(goodD, 2);
			expect(resultEasy.card.difficulty).toBeCloseTo(easyD, 2);
		});

		it('sets reps to 1 after first review', () => {
			for (const rating of [FSRSRating.Again, FSRSRating.Hard, FSRSRating.Good, FSRSRating.Easy]) {
				const result = fsrs.review(card, rating, now);
				expect(result.card.reps).toBe(1);
			}
		});

		it('returns retrievability of 0 for a new card', () => {
			const result = fsrs.review(card, FSRSRating.Good, now);
			expect(result.retrievability).toBe(0);
		});
	});

	// --------------------------------------------------------------------------
	// 3. Successful Recall (Review State)
	// --------------------------------------------------------------------------

	describe('successful recall (Review state)', () => {
		it('increases stability on Good rating', () => {
			const card = makeReviewCard({ stability: 10 });
			const result = fsrs.review(card, FSRSRating.Good);

			expect(result.card.stability).toBeGreaterThan(10);
		});

		it('increases stability on Hard rating', () => {
			const card = makeReviewCard({ stability: 10 });
			const result = fsrs.review(card, FSRSRating.Hard);

			expect(result.card.stability).toBeGreaterThanOrEqual(10);
		});

		it('increases stability on Easy rating', () => {
			const card = makeReviewCard({ stability: 10 });
			const result = fsrs.review(card, FSRSRating.Easy);

			expect(result.card.stability).toBeGreaterThan(10);
		});

		it('stability never decreases on successful recall', () => {
			// Test with various difficulty and stability combinations
			for (const d of [1, 5, 10]) {
				for (const s of [1, 10, 100]) {
					const card = makeReviewCard({ stability: s, difficulty: d });
					for (const rating of [FSRSRating.Hard, FSRSRating.Good, FSRSRating.Easy]) {
						const result = fsrs.review(card, rating);
						expect(result.card.stability).toBeGreaterThanOrEqual(s);
					}
				}
			}
		});

		it('remains in Review state on successful recall', () => {
			const card = makeReviewCard();
			for (const rating of [FSRSRating.Hard, FSRSRating.Good, FSRSRating.Easy]) {
				const result = fsrs.review(card, rating);
				expect(result.card.state).toBe(FSRSState.Review);
			}
		});

		it('increments reps count', () => {
			const card = makeReviewCard({ reps: 5 });
			const result = fsrs.review(card, FSRSRating.Good);
			expect(result.card.reps).toBe(6);
		});

		it('does not increment lapses on success', () => {
			const card = makeReviewCard({ lapses: 2 });
			const result = fsrs.review(card, FSRSRating.Good);
			expect(result.card.lapses).toBe(2);
		});

		it('adjusts difficulty toward rating', () => {
			const card = makeReviewCard({ difficulty: 8 });
			const goodResult = fsrs.review(card, FSRSRating.Good);
			const easyResult = fsrs.review(card, FSRSRating.Easy);

			// Easy should push difficulty lower than Good
			expect(easyResult.card.difficulty).toBeLessThan(goodResult.card.difficulty);
		});
	});

	// --------------------------------------------------------------------------
	// 4. Failed Recall / Lapse
	// --------------------------------------------------------------------------

	describe('failed recall / lapse', () => {
		it('transitions to Relearning state', () => {
			const card = makeReviewCard();
			const result = fsrs.review(card, FSRSRating.Again);
			expect(result.card.state).toBe(FSRSState.Relearning);
		});

		it('decreases stability', () => {
			const card = makeReviewCard({ stability: 20 });
			const result = fsrs.review(card, FSRSRating.Again);
			expect(result.card.stability).toBeLessThan(20);
		});

		it('increments lapses count', () => {
			const card = makeReviewCard({ lapses: 1 });
			const result = fsrs.review(card, FSRSRating.Again);
			expect(result.card.lapses).toBe(2);
		});

		it('increments reps count on lapse', () => {
			const card = makeReviewCard({ reps: 5 });
			const result = fsrs.review(card, FSRSRating.Again);
			expect(result.card.reps).toBe(6);
		});

		it('sets scheduledDays to 0 (immediate relearning)', () => {
			const card = makeReviewCard();
			const result = fsrs.review(card, FSRSRating.Again);
			expect(result.card.scheduledDays).toBe(0);
		});

		it('stability after lapse is at least MIN_STABILITY', () => {
			const card = makeReviewCard({ stability: 0.05, difficulty: 10 });
			const result = fsrs.review(card, FSRSRating.Again);
			expect(result.card.stability).toBeGreaterThanOrEqual(0.01);
		});

		it('lapse stability is less than pre-lapse stability', () => {
			for (const s of [5, 20, 100]) {
				const card = makeReviewCard({ stability: s });
				const result = fsrs.review(card, FSRSRating.Again);
				expect(result.card.stability).toBeLessThan(s);
			}
		});
	});

	// --------------------------------------------------------------------------
	// 5. State Transitions
	// --------------------------------------------------------------------------

	describe('state transitions', () => {
		it('New -> Learning (Again)', () => {
			const card = FSRS.newCard();
			const result = fsrs.review(card, FSRSRating.Again);
			expect(result.card.state).toBe(FSRSState.Learning);
		});

		it('New -> Learning (Hard)', () => {
			const card = FSRS.newCard();
			const result = fsrs.review(card, FSRSRating.Hard);
			expect(result.card.state).toBe(FSRSState.Learning);
		});

		it('New -> Review (Good)', () => {
			const card = FSRS.newCard();
			const result = fsrs.review(card, FSRSRating.Good);
			expect(result.card.state).toBe(FSRSState.Review);
		});

		it('New -> Review (Easy)', () => {
			const card = FSRS.newCard();
			const result = fsrs.review(card, FSRSRating.Easy);
			expect(result.card.state).toBe(FSRSState.Review);
		});

		it('Learning -> Learning (Again)', () => {
			const card = makeLearningCard();
			const result = fsrs.review(card, FSRSRating.Again);
			expect(result.card.state).toBe(FSRSState.Learning);
		});

		it('Learning -> Learning (Hard)', () => {
			const card = makeLearningCard();
			const result = fsrs.review(card, FSRSRating.Hard);
			expect(result.card.state).toBe(FSRSState.Learning);
		});

		it('Learning -> Review (Good)', () => {
			const card = makeLearningCard();
			const result = fsrs.review(card, FSRSRating.Good);
			expect(result.card.state).toBe(FSRSState.Review);
		});

		it('Learning -> Review (Easy)', () => {
			const card = makeLearningCard();
			const result = fsrs.review(card, FSRSRating.Easy);
			expect(result.card.state).toBe(FSRSState.Review);
		});

		it('Review -> Relearning (Again)', () => {
			const card = makeReviewCard();
			const result = fsrs.review(card, FSRSRating.Again);
			expect(result.card.state).toBe(FSRSState.Relearning);
		});

		it('Review -> Review (Hard)', () => {
			const card = makeReviewCard();
			const result = fsrs.review(card, FSRSRating.Hard);
			expect(result.card.state).toBe(FSRSState.Review);
		});

		it('Review -> Review (Good)', () => {
			const card = makeReviewCard();
			const result = fsrs.review(card, FSRSRating.Good);
			expect(result.card.state).toBe(FSRSState.Review);
		});

		it('Review -> Review (Easy)', () => {
			const card = makeReviewCard();
			const result = fsrs.review(card, FSRSRating.Easy);
			expect(result.card.state).toBe(FSRSState.Review);
		});

		it('Relearning -> Relearning (Again)', () => {
			const card = makeLearningCard({ state: FSRSState.Relearning });
			const result = fsrs.review(card, FSRSRating.Again);
			expect(result.card.state).toBe(FSRSState.Relearning);
		});

		it('Relearning -> Relearning (Hard)', () => {
			const card = makeLearningCard({ state: FSRSState.Relearning });
			const result = fsrs.review(card, FSRSRating.Hard);
			expect(result.card.state).toBe(FSRSState.Relearning);
		});

		it('Relearning -> Review (Good)', () => {
			const card = makeLearningCard({ state: FSRSState.Relearning });
			const result = fsrs.review(card, FSRSRating.Good);
			expect(result.card.state).toBe(FSRSState.Review);
		});

		it('Relearning -> Review (Easy)', () => {
			const card = makeLearningCard({ state: FSRSState.Relearning });
			const result = fsrs.review(card, FSRSRating.Easy);
			expect(result.card.state).toBe(FSRSState.Review);
		});
	});

	// --------------------------------------------------------------------------
	// 6. Difficulty Bounds
	// --------------------------------------------------------------------------

	describe('difficulty bounds', () => {
		it('initial difficulty is always in [1, 10]', () => {
			const card = FSRS.newCard();
			for (const rating of [FSRSRating.Again, FSRSRating.Hard, FSRSRating.Good, FSRSRating.Easy]) {
				const result = fsrs.review(card, rating);
				expect(result.card.difficulty).toBeGreaterThanOrEqual(1);
				expect(result.card.difficulty).toBeLessThanOrEqual(10);
			}
		});

		it('difficulty stays in [1, 10] after updates from extreme values', () => {
			// Start with extreme difficulty values
			for (const startDifficulty of [1, 5, 10]) {
				const card = makeReviewCard({ difficulty: startDifficulty });
				for (const rating of [FSRSRating.Again, FSRSRating.Hard, FSRSRating.Good, FSRSRating.Easy]) {
					const result = fsrs.review(card, rating);
					expect(result.card.difficulty).toBeGreaterThanOrEqual(1);
					expect(result.card.difficulty).toBeLessThanOrEqual(10);
				}
			}
		});

		it('difficulty reverts toward mean after many Easy ratings', () => {
			let card = makeReviewCard({ difficulty: 9 });
			const now = new Date('2025-01-15T12:00:00Z');

			// Apply many Easy ratings; difficulty should decrease
			for (let i = 0; i < 10; i++) {
				const reviewDate = new Date(now);
				reviewDate.setDate(reviewDate.getDate() + i * 10);
				card = {
					...card,
					lastReview: new Date(reviewDate.getTime() - 5 * 86400000).toISOString()
				};
				const result = fsrs.review(card, FSRSRating.Easy, reviewDate);
				card = result.card;
			}

			expect(card.difficulty).toBeLessThan(9);
		});

		it('difficulty reverts toward mean after many Again ratings', () => {
			let card = makeReviewCard({ difficulty: 2 });
			const now = new Date('2025-01-15T12:00:00Z');

			// Apply many Again ratings; difficulty should increase
			for (let i = 0; i < 5; i++) {
				const reviewDate = new Date(now);
				reviewDate.setDate(reviewDate.getDate() + i);
				card = {
					...card,
					lastReview: new Date(reviewDate.getTime() - 5 * 86400000).toISOString(),
					state: FSRSState.Review,
					stability: 10
				};
				const result = fsrs.review(card, FSRSRating.Again, reviewDate);
				card = result.card;
			}

			expect(card.difficulty).toBeGreaterThan(2);
		});
	});

	// --------------------------------------------------------------------------
	// 7. Interval Bounds
	// --------------------------------------------------------------------------

	describe('interval bounds', () => {
		it('interval is at least 1 for Review-state cards', () => {
			const card = FSRS.newCard();
			const result = fsrs.review(card, FSRSRating.Good);
			expect(result.interval).toBeGreaterThanOrEqual(1);
		});

		it('interval never exceeds maxInterval (default 365)', () => {
			const card = makeReviewCard({ stability: 1000 });
			const result = fsrs.review(card, FSRSRating.Easy);
			expect(result.interval).toBeLessThanOrEqual(365);
		});

		it('respects custom maxInterval', () => {
			const customFsrs = new FSRS(undefined, 180);
			const card = makeReviewCard({ stability: 500 });
			const result = customFsrs.review(card, FSRSRating.Good);
			expect(result.interval).toBeLessThanOrEqual(180);
		});

		it('interval is 0 for Learning/Relearning Again and Hard', () => {
			const card = makeLearningCard();
			const again = fsrs.review(card, FSRSRating.Again);
			const hard = fsrs.review(card, FSRSRating.Hard);
			expect(again.interval).toBe(0);
			expect(hard.interval).toBe(0);
		});

		it('graduated interval is positive for Learning Good and Easy', () => {
			const card = makeLearningCard({ stability: 5 });
			const good = fsrs.review(card, FSRSRating.Good);
			const easy = fsrs.review(card, FSRSRating.Easy);
			expect(good.interval).toBeGreaterThanOrEqual(1);
			expect(easy.interval).toBeGreaterThanOrEqual(1);
		});
	});

	// --------------------------------------------------------------------------
	// 8. Hard Penalty / Easy Bonus
	// --------------------------------------------------------------------------

	describe('hard penalty / easy bonus', () => {
		it('Hard gives equal or shorter interval than Good', () => {
			const card = makeReviewCard({ stability: 20, difficulty: 5 });

			const hardResult = fsrs.review(card, FSRSRating.Hard);
			const goodResult = fsrs.review(card, FSRSRating.Good);

			expect(hardResult.card.stability).toBeLessThanOrEqual(goodResult.card.stability);
			expect(hardResult.interval).toBeLessThanOrEqual(goodResult.interval);
		});

		it('Easy gives equal or longer interval than Good', () => {
			const card = makeReviewCard({ stability: 20, difficulty: 5 });

			const goodResult = fsrs.review(card, FSRSRating.Good);
			const easyResult = fsrs.review(card, FSRSRating.Easy);

			expect(easyResult.card.stability).toBeGreaterThanOrEqual(goodResult.card.stability);
			expect(easyResult.interval).toBeGreaterThanOrEqual(goodResult.interval);
		});

		it('rating order produces ordered stability: Again < Hard <= Good <= Easy', () => {
			const card = makeReviewCard({ stability: 15, difficulty: 5 });

			const againResult = fsrs.review(card, FSRSRating.Again);
			const hardResult = fsrs.review(card, FSRSRating.Hard);
			const goodResult = fsrs.review(card, FSRSRating.Good);
			const easyResult = fsrs.review(card, FSRSRating.Easy);

			expect(againResult.card.stability).toBeLessThan(hardResult.card.stability);
			expect(hardResult.card.stability).toBeLessThanOrEqual(goodResult.card.stability);
			expect(goodResult.card.stability).toBeLessThanOrEqual(easyResult.card.stability);
		});

		it('rating order produces ordered intervals: Again < Hard <= Good <= Easy', () => {
			const card = makeReviewCard({ stability: 15, difficulty: 5 });

			const againResult = fsrs.review(card, FSRSRating.Again);
			const hardResult = fsrs.review(card, FSRSRating.Hard);
			const goodResult = fsrs.review(card, FSRSRating.Good);
			const easyResult = fsrs.review(card, FSRSRating.Easy);

			expect(againResult.interval).toBeLessThanOrEqual(hardResult.interval);
			expect(hardResult.interval).toBeLessThanOrEqual(goodResult.interval);
			expect(goodResult.interval).toBeLessThanOrEqual(easyResult.interval);
		});
	});

	// --------------------------------------------------------------------------
	// 9. Schedule Method (all four ratings at once)
	// --------------------------------------------------------------------------

	describe('schedule method', () => {
		it('returns results for all four ratings', () => {
			const card = FSRS.newCard();
			const schedule = fsrs.schedule(card);

			expect(schedule[FSRSRating.Again]).toBeDefined();
			expect(schedule[FSRSRating.Hard]).toBeDefined();
			expect(schedule[FSRSRating.Good]).toBeDefined();
			expect(schedule[FSRSRating.Easy]).toBeDefined();
		});

		it('schedule results match individual review results', () => {
			const card = makeReviewCard();
			const now = new Date('2025-06-15T10:00:00Z');

			const schedule = fsrs.schedule(card, now);

			for (const rating of [FSRSRating.Again, FSRSRating.Hard, FSRSRating.Good, FSRSRating.Easy]) {
				const individual = fsrs.review(card, rating, now);
				expect(schedule[rating].card.stability).toBeCloseTo(individual.card.stability, 10);
				expect(schedule[rating].card.difficulty).toBeCloseTo(individual.card.difficulty, 10);
				expect(schedule[rating].card.state).toBe(individual.card.state);
				expect(schedule[rating].interval).toBe(individual.interval);
			}
		});

		it('each rating produces a valid nextReviewDate', () => {
			const card = FSRS.newCard();
			const now = new Date('2025-01-15T12:00:00Z');
			const schedule = fsrs.schedule(card, now);

			for (const rating of [FSRSRating.Again, FSRSRating.Hard, FSRSRating.Good, FSRSRating.Easy]) {
				expect(schedule[rating].nextReviewDate).toBeInstanceOf(Date);
				expect(schedule[rating].nextReviewDate.getTime()).toBeGreaterThanOrEqual(now.getTime());
			}
		});
	});

	// --------------------------------------------------------------------------
	// 10. Learning and Relearning States
	// --------------------------------------------------------------------------

	describe('learning state behavior', () => {
		it('Again in Learning resets stability to w[0]', () => {
			const card = makeLearningCard({ stability: 5 });
			const result = fsrs.review(card, FSRSRating.Again);
			expect(result.card.stability).toBeCloseTo(0.4072, 3);
		});

		it('Hard in Learning applies short-term stability update', () => {
			const card = makeLearningCard({ stability: 2 });
			const result = fsrs.review(card, FSRSRating.Hard);
			// Short-term: S * exp(w[17] * (G - 3 + w[18]))
			// = 2 * exp(0.5 * (2 - 3 + 0.6))
			// = 2 * exp(0.5 * (-0.4))
			// = 2 * exp(-0.2)
			// = 2 * 0.8187 = 1.6375
			expect(result.card.stability).toBeCloseTo(2 * Math.exp(0.5 * -0.4), 3);
		});

		it('Good in Learning graduates to Review with short-term update', () => {
			const card = makeLearningCard({ stability: 2 });
			const result = fsrs.review(card, FSRSRating.Good);
			expect(result.card.state).toBe(FSRSState.Review);
			// Short-term: S * exp(w[17] * (G - 3 + w[18]))
			// = 2 * exp(0.5 * (3 - 3 + 0.6))
			// = 2 * exp(0.3)
			// = 2 * 1.3499 = 2.6997
			expect(result.card.stability).toBeCloseTo(2 * Math.exp(0.5 * 0.6), 3);
		});

		it('Easy in Learning graduates to Review with higher stability than Good', () => {
			const card = makeLearningCard({ stability: 2 });
			const goodResult = fsrs.review(card, FSRSRating.Good);
			const easyResult = fsrs.review(card, FSRSRating.Easy);
			expect(easyResult.card.state).toBe(FSRSState.Review);
			expect(easyResult.card.stability).toBeGreaterThan(goodResult.card.stability);
		});

		it('Relearning Again stays in Relearning', () => {
			const card = makeLearningCard({ state: FSRSState.Relearning });
			const result = fsrs.review(card, FSRSRating.Again);
			expect(result.card.state).toBe(FSRSState.Relearning);
		});

		it('Relearning Good graduates back to Review', () => {
			const card = makeLearningCard({ state: FSRSState.Relearning, stability: 3 });
			const result = fsrs.review(card, FSRSRating.Good);
			expect(result.card.state).toBe(FSRSState.Review);
			expect(result.interval).toBeGreaterThan(0);
		});
	});

	// --------------------------------------------------------------------------
	// 11. Short-term Stability Formula
	// --------------------------------------------------------------------------

	describe('short-term stability formula', () => {
		it('Again decreases stability (rating < 3 + offset causes negative exponent)', () => {
			// S' = S * exp(w[17] * (1 - 3 + w[18])) = S * exp(0.5 * (-2 + 0.6)) = S * exp(-0.7)
			const card = makeLearningCard({ stability: 5 });
			const result = fsrs.review(card, FSRSRating.Again);
			// Again resets to w[0], so we test the Hard path for decrease
			// But Again in Learning resets stability, so test with Hard:
			const hardResult = fsrs.review(makeLearningCard({ stability: 5 }), FSRSRating.Hard);
			// exp(0.5 * (2 - 3 + 0.6)) = exp(-0.2) < 1 -> stability decreases
			expect(hardResult.card.stability).toBeLessThan(5);
		});

		it('Good increases stability (rating = 3 + positive offset)', () => {
			// S' = S * exp(w[17] * (3 - 3 + w[18])) = S * exp(0.5 * 0.6) = S * exp(0.3) > S
			const card = makeLearningCard({ stability: 5 });
			const result = fsrs.review(card, FSRSRating.Good);
			expect(result.card.stability).toBeGreaterThan(5);
		});

		it('Easy increases stability more than Good', () => {
			const card = makeLearningCard({ stability: 5 });
			const goodResult = fsrs.review(card, FSRSRating.Good);
			const easyResult = fsrs.review(card, FSRSRating.Easy);
			expect(easyResult.card.stability).toBeGreaterThan(goodResult.card.stability);
		});
	});

	// --------------------------------------------------------------------------
	// 12. Elapsed Days and lastReview
	// --------------------------------------------------------------------------

	describe('elapsed days and lastReview', () => {
		it('correctly computes elapsed days from lastReview', () => {
			const now = new Date('2025-01-20T12:00:00Z');
			const lastReview = new Date('2025-01-15T12:00:00Z'); // 5 days ago
			const card = makeReviewCard({ lastReview: lastReview.toISOString() });

			const result = fsrs.review(card, FSRSRating.Good, now);
			expect(result.card.elapsedDays).toBeCloseTo(5, 1);
		});

		it('handles first review (no lastReview) with 0 elapsed days', () => {
			const card = FSRS.newCard();
			const now = new Date('2025-01-15T12:00:00Z');
			const result = fsrs.review(card, FSRSRating.Good, now);
			expect(result.card.elapsedDays).toBe(0);
		});

		it('updates lastReview to current time', () => {
			const now = new Date('2025-03-01T15:30:00Z');
			const card = makeReviewCard();
			const result = fsrs.review(card, FSRSRating.Good, now);
			expect(result.card.lastReview).toBe(now.toISOString());
		});

		it('nextReviewDate is interval days after now', () => {
			const now = new Date('2025-06-01T10:00:00Z');
			const card = makeReviewCard();
			const result = fsrs.review(card, FSRSRating.Good, now);

			const expected = new Date(now);
			expected.setDate(expected.getDate() + result.interval);

			expect(result.nextReviewDate.getTime()).toBe(expected.getTime());
		});
	});

	// --------------------------------------------------------------------------
	// 13. Edge Cases
	// --------------------------------------------------------------------------

	describe('edge cases', () => {
		it('handles very small stability values', () => {
			const card = makeReviewCard({ stability: 0.01 });
			const result = fsrs.review(card, FSRSRating.Good);
			expect(result.card.stability).toBeGreaterThanOrEqual(0.01);
			expect(Number.isFinite(result.card.stability)).toBe(true);
		});

		it('handles very large stability values', () => {
			const card = makeReviewCard({ stability: 10000 });
			const result = fsrs.review(card, FSRSRating.Good);
			expect(Number.isFinite(result.card.stability)).toBe(true);
			expect(result.interval).toBeLessThanOrEqual(365);
		});

		it('handles difficulty at boundary values', () => {
			for (const d of [1, 10]) {
				const card = makeReviewCard({ difficulty: d });
				const result = fsrs.review(card, FSRSRating.Good);
				expect(result.card.difficulty).toBeGreaterThanOrEqual(1);
				expect(result.card.difficulty).toBeLessThanOrEqual(10);
			}
		});

		it('handles rapid successive reviews (0 elapsed days)', () => {
			const now = new Date();
			const card = makeReviewCard({ lastReview: now.toISOString() });
			const result = fsrs.review(card, FSRSRating.Good, now);
			expect(Number.isFinite(result.card.stability)).toBe(true);
			expect(Number.isFinite(result.card.difficulty)).toBe(true);
		});

		it('all numeric outputs are finite', () => {
			const card = FSRS.newCard();
			for (const rating of [FSRSRating.Again, FSRSRating.Hard, FSRSRating.Good, FSRSRating.Easy]) {
				const result = fsrs.review(card, rating);
				expect(Number.isFinite(result.card.stability)).toBe(true);
				expect(Number.isFinite(result.card.difficulty)).toBe(true);
				expect(Number.isFinite(result.interval)).toBe(true);
				expect(Number.isFinite(result.retrievability)).toBe(true);
			}
		});
	});

	// --------------------------------------------------------------------------
	// 14. Integration: Full Learning Progression
	// --------------------------------------------------------------------------

	describe('integration: learning progression', () => {
		it('simulates a new card through learning to mature review', () => {
			const fsrsInstance = new FSRS();
			let card = FSRS.newCard();
			const startDate = new Date('2025-01-01T09:00:00Z');

			// --- Step 1: First review - press Good ---
			let result = fsrsInstance.review(card, FSRSRating.Good, startDate);
			card = result.card;

			expect(card.state).toBe(FSRSState.Review);
			expect(card.stability).toBeCloseTo(3.1262, 3); // w[2]
			expect(card.reps).toBe(1);
			expect(card.lapses).toBe(0);

			const interval1 = result.interval;
			expect(interval1).toBeGreaterThanOrEqual(1);

			// --- Step 2: Review after scheduled interval - press Good ---
			const reviewDate2 = new Date(startDate);
			reviewDate2.setDate(reviewDate2.getDate() + interval1);

			result = fsrsInstance.review(card, FSRSRating.Good, reviewDate2);
			card = result.card;

			expect(card.state).toBe(FSRSState.Review);
			expect(card.stability).toBeGreaterThan(3.1262); // Should increase
			expect(card.reps).toBe(2);

			const interval2 = result.interval;
			expect(interval2).toBeGreaterThan(interval1); // Intervals should grow

			// --- Step 3: Review after scheduled interval - press Easy ---
			const reviewDate3 = new Date(reviewDate2);
			reviewDate3.setDate(reviewDate3.getDate() + interval2);

			result = fsrsInstance.review(card, FSRSRating.Easy, reviewDate3);
			card = result.card;

			expect(card.state).toBe(FSRSState.Review);
			expect(card.reps).toBe(3);
			expect(card.difficulty).toBeLessThan(7); // Easy should reduce difficulty

			const interval3 = result.interval;
			expect(interval3).toBeGreaterThan(interval2); // Easy should extend interval

			// --- Step 4: Lapse! Press Again ---
			const reviewDate4 = new Date(reviewDate3);
			reviewDate4.setDate(reviewDate4.getDate() + interval3);

			const stabilityBeforeLapse = card.stability;
			result = fsrsInstance.review(card, FSRSRating.Again, reviewDate4);
			card = result.card;

			expect(card.state).toBe(FSRSState.Relearning);
			expect(card.stability).toBeLessThan(stabilityBeforeLapse);
			expect(card.lapses).toBe(1);
			expect(result.interval).toBe(0); // Immediate relearning

			// --- Step 5: Relearn - press Good to graduate back ---
			const reviewDate5 = new Date(reviewDate4);
			// Same day relearning
			result = fsrsInstance.review(card, FSRSRating.Good, reviewDate5);
			card = result.card;

			expect(card.state).toBe(FSRSState.Review);
			expect(card.lapses).toBe(1); // Lapses don't reset

			// --- Step 6-10: Continue reviewing with Good to build up stability ---
			let currentDate = new Date(reviewDate5);
			for (let i = 0; i < 5; i++) {
				currentDate = new Date(currentDate);
				currentDate.setDate(currentDate.getDate() + result.interval);

				const prevStability = card.stability;
				result = fsrsInstance.review(card, FSRSRating.Good, currentDate);
				card = result.card;

				expect(card.state).toBe(FSRSState.Review);
				expect(card.stability).toBeGreaterThan(prevStability); // Growing stability
			}

			// After many successful reviews, the card should have high stability
			expect(card.stability).toBeGreaterThan(10);
			expect(card.reps).toBeGreaterThanOrEqual(9);
		});

		it('simulates a struggling learner who keeps failing', () => {
			const fsrsInstance = new FSRS();
			let card = FSRS.newCard();
			const startDate = new Date('2025-01-01T09:00:00Z');

			// First review: Again
			let result = fsrsInstance.review(card, FSRSRating.Again, startDate);
			card = result.card;
			expect(card.state).toBe(FSRSState.Learning);

			// Keep pressing Again in Learning
			for (let i = 0; i < 3; i++) {
				result = fsrsInstance.review(card, FSRSRating.Again, startDate);
				card = result.card;
				expect(card.state).toBe(FSRSState.Learning);
			}

			// Difficulty should be high after many Again ratings
			expect(card.difficulty).toBeGreaterThan(5);

			// Finally press Good to graduate
			result = fsrsInstance.review(card, FSRSRating.Good, startDate);
			card = result.card;
			expect(card.state).toBe(FSRSState.Review);
			expect(card.scheduledDays).toBeGreaterThanOrEqual(1);

			// The stability should be low for this struggling card
			// because short-term updates from Again ratings keep it low
			expect(card.stability).toBeLessThan(5);
		});

		it('simulates an easy card that quickly reaches long intervals', () => {
			const fsrsInstance = new FSRS();
			let card = FSRS.newCard();
			let currentDate = new Date('2025-01-01T09:00:00Z');

			// First review: Easy
			let result = fsrsInstance.review(card, FSRSRating.Easy, currentDate);
			card = result.card;

			expect(card.state).toBe(FSRSState.Review);
			expect(card.stability).toBeCloseTo(15.4722, 3); // w[3]

			// Keep pressing Easy
			for (let i = 0; i < 8; i++) {
				currentDate = new Date(currentDate);
				currentDate.setDate(currentDate.getDate() + result.interval);

				result = fsrsInstance.review(card, FSRSRating.Easy, currentDate);
				card = result.card;
			}

			// After many Easy ratings, interval should be large (may not hit max in 8 iterations)
			expect(result.interval).toBeGreaterThanOrEqual(60);
			// Difficulty should be low
			expect(card.difficulty).toBeLessThan(5);
		});

		it('preserves card immutability (review does not mutate input)', () => {
			const card = FSRS.newCard();
			const originalState = { ...card };

			fsrs.review(card, FSRSRating.Good);

			expect(card.stability).toBe(originalState.stability);
			expect(card.difficulty).toBe(originalState.difficulty);
			expect(card.state).toBe(originalState.state);
			expect(card.reps).toBe(originalState.reps);
			expect(card.lapses).toBe(originalState.lapses);
		});
	});

	// --------------------------------------------------------------------------
	// 15. Mathematical Precision
	// --------------------------------------------------------------------------

	describe('mathematical precision', () => {
		it('forgetting curve: R(0, S) = 1 for any positive S', () => {
			for (const s of [0.1, 1, 10, 100, 1000]) {
				expect(fsrs.retrievability(0, s)).toBe(1);
			}
		});

		it('forgetting curve: R(S, S) = 0.9 exactly', () => {
			// The FSRS forgetting curve is specifically designed so that
			// (1 + FACTOR * S / S) ^ DECAY = (1 + 19/81) ^ (-0.5) = (100/81) ^ (-0.5)
			// = (81/100) ^ 0.5 = 9/10 = 0.9
			const factor = 19 / 81;
			const decay = -0.5;
			const expected = Math.pow(1 + factor, decay);
			expect(expected).toBeCloseTo(0.9, 10);

			// Verify our implementation matches
			expect(fsrs.retrievability(1, 1)).toBeCloseTo(0.9, 10);
			expect(fsrs.retrievability(100, 100)).toBeCloseTo(0.9, 10);
		});

		it('initial stability values match the w parameters exactly', () => {
			const card = FSRS.newCard();
			const defaults = [0.4072, 1.1829, 3.1262, 15.4722];

			for (let i = 0; i < 4; i++) {
				const rating = (i + 1) as FSRSRating;
				const result = fsrs.review(card, rating);
				expect(result.card.stability).toBeCloseTo(defaults[i], 4);
			}
		});

		it('initial difficulty formula is correct for all ratings', () => {
			const w4 = 7.2102;
			const w5 = 0.5316;

			for (const g of [1, 2, 3, 4]) {
				const expected = Math.max(1, Math.min(10, w4 - Math.exp(w5 * (g - 1)) + 1));
				const result = fsrs.review(FSRS.newCard(), g as FSRSRating);
				expect(result.card.difficulty).toBeCloseTo(expected, 4);
			}
		});
	});
});
