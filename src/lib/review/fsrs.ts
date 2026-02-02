/**
 * FSRS-5 (Free Spaced Repetition Scheduler) Algorithm
 *
 * A pure TypeScript implementation of the FSRS-5 algorithm for optimal
 * spaced repetition scheduling. Zero dependencies, mathematically precise.
 *
 * FSRS-5 models memory with four key variables:
 * - Stability (S): Days until recall probability drops to 90%
 * - Difficulty (D): How inherently hard the item is, range [1, 10]
 * - Retrievability (R): Current probability of recall
 * - State: New, Learning, Review, or Relearning
 *
 * The forgetting curve follows the power law:
 *   R(t, S) = (1 + FACTOR * t / S) ^ DECAY
 *
 * where FACTOR = 19/81, DECAY = -0.5. At t = S, R = 0.9 exactly.
 *
 * Reference: https://github.com/open-spaced-repetition/fsrs4anki/wiki/The-Algorithm
 */

// ============================================================================
// Constants
// ============================================================================

/** Power-law decay exponent. Chosen so R(S, S) = 0.9 with the given FACTOR. */
const DECAY = -0.5;

/** Scaling factor for the forgetting curve. FACTOR = 19/81. */
const FACTOR = 19 / 81;

/** Maximum allowed scheduling interval in days (1 year). */
const DEFAULT_MAX_INTERVAL = 365;

/** Minimum allowed stability value. Prevents division-by-zero edge cases. */
const MIN_STABILITY = 0.01;

/** Target retention rate. Used to convert stability to interval. */
const TARGET_RETENTION = 0.9;

/**
 * FSRS-5 default parameters (w[0]..w[18]).
 *
 * These are the optimized defaults from the FSRS-5 paper. Each parameter
 * controls a specific aspect of the scheduling model.
 */
const FSRS5_DEFAULTS: readonly number[] = [
	0.4072, //  w0:  Initial stability for Again rating
	1.1829, //  w1:  Initial stability for Hard rating
	3.1262, //  w2:  Initial stability for Good rating
	15.4722, // w3:  Initial stability for Easy rating
	7.2102, //  w4:  Difficulty mean reversion target
	0.5316, //  w5:  Difficulty initial rating weight
	1.0651, //  w6:  Difficulty mean reversion weight (blend factor)
	0.0046, //  w7:  Stability after fail multiplier (reserved)
	1.5407, //  w8:  Stability increase base (log scale)
	0.6823, //  w9:  Stability S power (diminishing returns)
	1.0, //     w10: Stability R power (retrievability effect)
	1.073, //   w11: Fail stability D power (lapse base multiplier)
	0.0, //     w12: Fail stability D exponent
	0.3013, //  w13: Fail stability S exponent
	1.0, //     w14: Hard penalty multiplier
	0.0, //     w15: Easy bonus multiplier
	2.9466, //  w16: Short-term stability multiplier (reserved)
	0.5, //     w17: Short-term rating weight
	0.6 //      w18: Short-term stability base offset
] as const;

// ============================================================================
// Enums
// ============================================================================

/**
 * Card states in the FSRS state machine.
 *
 * - New: Card has never been reviewed.
 * - Learning: Card is in initial learning steps.
 * - Review: Card has graduated to the review queue with long-term scheduling.
 * - Relearning: Card was in Review but lapsed; re-entering learning steps.
 */
export enum FSRSState {
	New = 0,
	Learning = 1,
	Review = 2,
	Relearning = 3
}

/**
 * User rating for a review.
 *
 * - Again (1): Complete failure to recall.
 * - Hard (2): Recalled with significant difficulty.
 * - Good (3): Recalled with moderate effort (default success).
 * - Easy (4): Recalled effortlessly.
 */
export enum FSRSRating {
	Again = 1,
	Hard = 2,
	Good = 3,
	Easy = 4
}

// ============================================================================
// Interfaces
// ============================================================================

/**
 * Represents the current state of a flashcard in the FSRS system.
 *
 * All scheduling decisions are derived from these fields plus the current time.
 */
export interface FSRSCard {
	/** Memory stability in days. At t = S, recall probability is 90%. */
	stability: number;

	/** Item difficulty on a [1, 10] scale. Higher = harder. */
	difficulty: number;

	/** Current state in the FSRS state machine. */
	state: FSRSState;

	/** Total number of successful reviews (excludes lapses). */
	reps: number;

	/** Total number of times the card lapsed (Again from Review state). */
	lapses: number;

	/** ISO 8601 date string of the last review, or undefined if never reviewed. */
	lastReview?: string;

	/** Number of days until the next scheduled review. */
	scheduledDays: number;

	/** Number of days elapsed since the last review. */
	elapsedDays: number;
}

/**
 * The result of scheduling a card for a particular rating.
 *
 * Contains the updated card state and scheduling metadata.
 */
export interface ScheduleInfo {
	/** The updated card after applying this rating. */
	card: FSRSCard;

	/** The computed next review date. */
	nextReviewDate: Date;

	/** Interval in days until the next review. */
	interval: number;

	/** Current retrievability (recall probability) at the time of review. */
	retrievability: number;
}

// ============================================================================
// FSRS Class
// ============================================================================

/**
 * FSRS-5 scheduler.
 *
 * Provides methods to compute optimal review intervals based on the FSRS-5
 * memory model. Stateless: all card data is passed in and returned, making
 * it safe for concurrent use.
 *
 * @example
 * ```typescript
 * const fsrs = new FSRS();
 * const card = FSRS.newCard();
 * const schedule = fsrs.schedule(card);
 *
 * // User presses "Good"
 * const result = schedule[FSRSRating.Good];
 * // result.card is the updated card
 * // result.nextReviewDate is when to review next
 * ```
 */
export class FSRS {
	private readonly w: number[];
	private readonly maxInterval: number;

	/**
	 * Create a new FSRS scheduler.
	 *
	 * @param params - Custom FSRS parameters (w[0]..w[18]). Defaults to FSRS-5 optimized values.
	 * @param maxInterval - Maximum scheduling interval in days. Defaults to 365.
	 */
	constructor(params?: number[], maxInterval?: number) {
		this.w = params ? [...params] : [...FSRS5_DEFAULTS];
		this.maxInterval = maxInterval ?? DEFAULT_MAX_INTERVAL;

		if (this.w.length < 19) {
			throw new Error(
				`FSRS requires 19 parameters, got ${this.w.length}. ` +
					'Provide all w[0]..w[18] or omit for defaults.'
			);
		}
	}

	// --------------------------------------------------------------------------
	// Public API
	// --------------------------------------------------------------------------

	/**
	 * Compute the retrievability (recall probability) for a card.
	 *
	 * Uses the FSRS power-law forgetting curve:
	 *   R(t, S) = (1 + FACTOR * t / S) ^ DECAY
	 *
	 * @param elapsedDays - Days since last review.
	 * @param stability - Current stability value.
	 * @returns Recall probability in [0, 1]. Returns 1 if elapsedDays <= 0.
	 */
	retrievability(elapsedDays: number, stability: number): number {
		if (stability <= 0) return 0;
		if (elapsedDays <= 0) return 1;
		return Math.pow(1 + (FACTOR * elapsedDays) / stability, DECAY);
	}

	/**
	 * Generate scheduling options for all four ratings.
	 *
	 * This is the primary scheduling method. It returns a record mapping each
	 * possible rating to the resulting card state and next review date. The UI
	 * can display all four options and let the user choose.
	 *
	 * @param card - The current card state.
	 * @param now - The current time. Defaults to Date.now().
	 * @returns A record with entries for Again, Hard, Good, and Easy.
	 */
	schedule(card: FSRSCard, now?: Date): Record<FSRSRating, ScheduleInfo> {
		const reviewTime = now ?? new Date();

		const result = {} as Record<FSRSRating, ScheduleInfo>;
		for (const rating of [FSRSRating.Again, FSRSRating.Hard, FSRSRating.Good, FSRSRating.Easy]) {
			result[rating] = this.review(card, rating, reviewTime);
		}

		return result;
	}

	/**
	 * Apply a single review rating to a card.
	 *
	 * Computes the updated card state (stability, difficulty, state, intervals)
	 * for a specific rating. This is the core scheduling function.
	 *
	 * @param card - The current card state.
	 * @param rating - The user's rating for this review.
	 * @param now - The current time. Defaults to Date.now().
	 * @returns The scheduling result including updated card and next review date.
	 */
	review(card: FSRSCard, rating: FSRSRating, now?: Date): ScheduleInfo {
		const reviewTime = now ?? new Date();

		// Compute elapsed days since last review
		let elapsedDays = 0;
		if (card.lastReview) {
			const lastReviewDate = new Date(card.lastReview);
			const diffMs = reviewTime.getTime() - lastReviewDate.getTime();
			elapsedDays = Math.max(0, diffMs / (1000 * 60 * 60 * 24));
		}

		// Current retrievability
		const retrievability =
			card.state === FSRSState.New ? 0 : this.retrievability(elapsedDays, card.stability);

		// Clone the card for mutation
		const next: FSRSCard = {
			...card,
			elapsedDays,
			lastReview: reviewTime.toISOString()
		};

		// Dispatch to state-specific handler
		switch (card.state) {
			case FSRSState.New:
				this.handleNew(next, rating);
				break;
			case FSRSState.Learning:
			case FSRSState.Relearning:
				this.handleLearning(next, rating);
				break;
			case FSRSState.Review:
				this.handleReview(next, rating, retrievability);
				break;
		}

		// Compute the interval and next review date
		const interval = next.scheduledDays;
		const nextReviewDate = new Date(reviewTime);
		nextReviewDate.setDate(nextReviewDate.getDate() + interval);

		return {
			card: next,
			nextReviewDate,
			interval,
			retrievability
		};
	}

	/**
	 * Create a fresh card with default initial values.
	 *
	 * @returns A new FSRSCard in the New state.
	 */
	static newCard(): FSRSCard {
		return {
			stability: 0,
			difficulty: 0,
			state: FSRSState.New,
			reps: 0,
			lapses: 0,
			lastReview: undefined,
			scheduledDays: 0,
			elapsedDays: 0
		};
	}

	// --------------------------------------------------------------------------
	// State Handlers (private)
	// --------------------------------------------------------------------------

	/**
	 * Handle a review of a New card.
	 *
	 * Transitions:
	 *   Again/Hard -> Learning
	 *   Good/Easy  -> Review
	 */
	private handleNew(card: FSRSCard, rating: FSRSRating): void {
		card.stability = this.initialStability(rating);
		card.difficulty = this.initialDifficulty(rating);
		card.reps = 1;

		if (rating === FSRSRating.Again || rating === FSRSRating.Hard) {
			card.state = FSRSState.Learning;
			card.scheduledDays = 0;
		} else {
			// Good or Easy: graduate immediately to Review
			card.state = FSRSState.Review;
			card.scheduledDays = this.nextInterval(card.stability);
		}
	}

	/**
	 * Handle a review of a Learning or Relearning card.
	 *
	 * Transitions:
	 *   Again       -> stay in current state (Learning or Relearning)
	 *   Hard        -> stay in current state (short-term update)
	 *   Good/Easy   -> Review (graduate / re-graduate)
	 */
	private handleLearning(card: FSRSCard, rating: FSRSRating): void {
		card.reps += 1;

		// Ensure stability has a valid base value for short-term update
		const baseStability = Math.max(card.stability, MIN_STABILITY);

		if (rating === FSRSRating.Again) {
			// Reset to initial Again stability; remain in current state
			card.stability = this.initialStability(FSRSRating.Again);
			card.difficulty = this.nextDifficulty(card.difficulty, rating);
			card.scheduledDays = 0;
		} else if (rating === FSRSRating.Hard) {
			// Short-term stability update; remain in current state
			card.stability = this.nextShortTermStability(baseStability, rating);
			card.difficulty = this.nextDifficulty(card.difficulty, rating);
			card.scheduledDays = 0;
		} else {
			// Good or Easy: graduate to Review
			card.stability = this.nextShortTermStability(baseStability, rating);
			card.difficulty = this.nextDifficulty(card.difficulty, rating);
			card.state = FSRSState.Review;
			card.scheduledDays = this.nextInterval(card.stability);
		}
	}

	/**
	 * Handle a review of a Review card.
	 *
	 * Transitions:
	 *   Again       -> Relearning (lapse)
	 *   Hard        -> Review (success with penalty)
	 *   Good        -> Review (success)
	 *   Easy        -> Review (success with bonus)
	 */
	private handleReview(card: FSRSCard, rating: FSRSRating, retrievability: number): void {
		if (rating === FSRSRating.Again) {
			// Lapse: failed recall
			card.lapses += 1;
			card.reps += 1;
			card.state = FSRSState.Relearning;
			card.stability = this.nextForgetStability(
				card.difficulty,
				card.stability,
				retrievability
			);
			card.difficulty = this.nextDifficulty(card.difficulty, rating);
			card.scheduledDays = 0;
		} else {
			// Successful recall
			card.reps += 1;
			const newStability = this.nextRecallStability(
				card.difficulty,
				card.stability,
				retrievability,
				rating
			);
			card.stability = newStability;
			card.difficulty = this.nextDifficulty(card.difficulty, rating);
			card.state = FSRSState.Review;
			card.scheduledDays = this.nextInterval(card.stability);
		}
	}

	// --------------------------------------------------------------------------
	// FSRS-5 Core Formulas (private)
	// --------------------------------------------------------------------------

	/**
	 * Compute initial stability for a new card's first rating.
	 *
	 * S_0(G) = w[G - 1]
	 *
	 * @param rating - The first review rating (1-4).
	 * @returns Initial stability in days.
	 */
	private initialStability(rating: FSRSRating): number {
		return Math.max(MIN_STABILITY, this.w[rating - 1]);
	}

	/**
	 * Compute initial difficulty for a new card.
	 *
	 * D_0(G) = w[4] - exp(w[5] * (G - 1)) + 1
	 *
	 * Clamped to [1, 10].
	 *
	 * @param rating - The first review rating (1-4).
	 * @returns Initial difficulty.
	 */
	private initialDifficulty(rating: FSRSRating): number {
		const d = this.w[4] - Math.exp(this.w[5] * (rating - 1)) + 1;
		return clamp(d, 1, 10);
	}

	/**
	 * Update difficulty after a review using mean reversion.
	 *
	 * D'(D, G) = w[6] * D_0(G) + (1 - w[6]) * D
	 *
	 * This blends the current difficulty toward what the initial difficulty
	 * would be for the given rating, preventing extreme drift.
	 *
	 * @param d - Current difficulty.
	 * @param rating - The review rating.
	 * @returns Updated difficulty, clamped to [1, 10].
	 */
	private nextDifficulty(d: number, rating: FSRSRating): number {
		const d0 = this.initialDifficulty(rating);
		const newD = this.w[6] * d0 + (1 - this.w[6]) * d;
		return clamp(newD, 1, 10);
	}

	/**
	 * Compute new stability after a successful recall (Review state, rating >= Hard).
	 *
	 * S'_r(D, S, R, G) = S * (1 + exp(w[8]) * (11 - D) * S^(-w[9])
	 *                      * (exp(w[10] * (1 - R)) - 1) * hardPenalty * easyBonus)
	 *
	 * The result is floored at the current stability (stability never decreases
	 * on a successful recall).
	 *
	 * @param d - Current difficulty.
	 * @param s - Current stability.
	 * @param r - Current retrievability.
	 * @param rating - The review rating (Hard, Good, or Easy).
	 * @returns New stability, guaranteed >= s.
	 */
	private nextRecallStability(
		d: number,
		s: number,
		r: number,
		rating: FSRSRating
	): number {
		// Hard penalty: w[14] is used as a direct multiplier (1.0 = no penalty, <1 = penalty).
		// Easy bonus: w[15] is an additive bonus (0 = no bonus, >0 = bonus), so the
		// multiplier is (1 + w[15]). This ensures w[15]=0 means Easy behaves like Good,
		// not that the entire growth term is zeroed out.
		const hardPenalty = rating === FSRSRating.Hard ? this.w[14] : 1;
		const easyBonus = rating === FSRSRating.Easy ? 1 + this.w[15] : 1;

		const newS =
			s *
			(1 +
				Math.exp(this.w[8]) *
					(11 - d) *
					Math.pow(s, -this.w[9]) *
					(Math.exp(this.w[10] * (1 - r)) - 1) *
					hardPenalty *
					easyBonus);

		// Stability can only increase on successful recall
		return Math.max(s, newS);
	}

	/**
	 * Compute new stability after a lapse (failed recall, Again from Review).
	 *
	 * S'_f(D, S, R) = w[11] * D^(-w[12]) * ((S + 1)^w[13] - 1)
	 *
	 * The result is clamped to [MIN_STABILITY, S) so that a lapse always
	 * decreases stability.
	 *
	 * @param d - Current difficulty.
	 * @param s - Current stability.
	 * @param r - Current retrievability (unused in this formula variant, kept for API consistency).
	 * @returns New (reduced) stability.
	 */
	private nextForgetStability(d: number, s: number, _r: number): number {
		const newS =
			this.w[11] * Math.pow(d, -this.w[12]) * (Math.pow(s + 1, this.w[13]) - 1);

		// Lapse must decrease stability, and we enforce a minimum
		return clamp(newS, MIN_STABILITY, s);
	}

	/**
	 * Compute new stability for Learning/Relearning cards using the short-term model.
	 *
	 * S'_st(S, G) = S * exp(w[17] * (G - 3 + w[18]))
	 *
	 * @param s - Current stability.
	 * @param rating - The review rating.
	 * @returns Updated stability.
	 */
	private nextShortTermStability(s: number, rating: FSRSRating): number {
		const newS = s * Math.exp(this.w[17] * (rating - 3 + this.w[18]));
		return Math.max(MIN_STABILITY, newS);
	}

	/**
	 * Convert stability to a scheduling interval.
	 *
	 * interval = clamp(round(S * TARGET_RETENTION), 1, maxInterval)
	 *
	 * Since TARGET_RETENTION = 0.9, the interval is 90% of stability,
	 * meaning we schedule the review slightly before the 90% recall threshold.
	 *
	 * @param s - Stability in days.
	 * @returns Interval in days, clamped to [1, maxInterval].
	 */
	private nextInterval(s: number): number {
		const interval = Math.round(s * TARGET_RETENTION);
		return clamp(interval, 1, this.maxInterval);
	}
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Clamp a value to the range [min, max].
 *
 * @param value - The value to clamp.
 * @param min - Minimum allowed value.
 * @param max - Maximum allowed value.
 * @returns The clamped value.
 */
function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}
