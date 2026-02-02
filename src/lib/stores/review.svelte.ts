/**
 * Review Store for Arabico
 *
 * Manages review session state using Svelte 5 runes:
 * - Review queue (due reviews and practice mode)
 * - Current session tracking
 * - Due word count
 * - Response recording
 * - Review forecast for timeline
 */

import { browser } from '$app/environment';
import { vocabularyDB, reviewSessionDB } from '$lib/db';
import { syncManager } from '$lib/stores/sync.svelte';
import { reviewWord, shouldPromoteToKnown, calculateDifficultyScore, getFSRS } from '$lib/review/fsrs-arabico';
import { FSRSRating, FSRSState, type FSRSCard } from '$lib/review/fsrs';
import {
	generateReviewForecast,
	getStageCounts,
	getReviewStage
} from '$lib/review/srs-algorithm';
import { buildReviewQueue, buildReviewCardData, getDueWordCount } from '$lib/review/review-queue';
import type {
	VocabularyEntry,
	ReviewMode,
	ReviewSession,
	ReviewCardData,
	ReviewForecast,
	ReviewStage
} from '$lib/types';

function createReviewStore() {
	// State
	let queue = $state<VocabularyEntry[]>([]);
	let cardData = $state<ReviewCardData[]>([]);
	let currentIndex = $state(0);
	let currentSession = $state<ReviewSession | null>(null);
	let isLoading = $state(false);
	let dueCount = $state(0);
	let sessionStats = $state({ reviewed: 0, correct: 0 });

	// Practice mode state
	let isPracticeMode = $state(false);
	let dueCompletedThisSession = $state(false);

	// Forecast and stage counts
	let forecast = $state<ReviewForecast[]>([]);
	let stageCounts = $state<Record<ReviewStage, number>>({
		new: 0,
		learning: 0,
		young: 0,
		mature: 0,
		suspended: 0
	});

	return {
		// Getters
		get queue() {
			return queue;
		},
		get cardData() {
			return cardData;
		},
		get currentIndex() {
			return currentIndex;
		},
		get currentCard() {
			return cardData[currentIndex] ?? null;
		},
		get currentSession() {
			return currentSession;
		},
		get isLoading() {
			return isLoading;
		},
		get dueCount() {
			return dueCount;
		},
		get sessionStats() {
			return sessionStats;
		},
		get isComplete() {
			return currentIndex >= queue.length && queue.length > 0;
		},
		get progress() {
			return queue.length > 0 ? (currentIndex / queue.length) * 100 : 0;
		},
		get isPracticeMode() {
			return isPracticeMode;
		},
		get dueCompletedThisSession() {
			return dueCompletedThisSession;
		},
		get forecast() {
			return forecast;
		},
		get stageCounts() {
			return stageCounts;
		},
		get canPracticeMore() {
			// Can practice if due reviews are done or if there are words to practice
			return dueCompletedThisSession || dueCount === 0;
		},

		/**
		 * Initialize the store - load due count and forecast
		 */
		async init() {
			if (!browser) return;
			await this.refreshDueCount();
			await this.refreshForecast();
		},

		/**
		 * Refresh the due word count
		 */
		async refreshDueCount() {
			if (!browser) return;
			dueCount = await getDueWordCount();
		},

		/**
		 * Refresh the review forecast and stage counts
		 */
		async refreshForecast(days: number = 14) {
			if (!browser) return;

			try {
				const allEntries = await vocabularyDB.getAll();
				forecast = generateReviewForecast(allEntries, days);
				stageCounts = getStageCounts(allEntries);
			} catch (error) {
				console.error('Error refreshing forecast:', error);
			}
		},

		/**
		 * Start a new review session (due reviews)
		 */
		async startSession(mode: ReviewMode, maxWords: number = 15) {
			if (!browser) return;

			isLoading = true;
			currentIndex = 0;
			sessionStats = { reviewed: 0, correct: 0 };
			isPracticeMode = false;

			try {
				// Build review queue
				queue = await buildReviewQueue({
					mode,
					maxWords,
					includeNewWords: mode !== 'quick'
				});

				// Build card data with contextual information
				cardData = await Promise.all(queue.map(buildReviewCardData));

				// Create session record
				const userId = localStorage.getItem('arabico-anon-id') || crypto.randomUUID();
				if (!localStorage.getItem('arabico-anon-id')) {
					localStorage.setItem('arabico-anon-id', userId);
				}

				currentSession = {
					userId,
					mode,
					startTime: new Date(),
					wordsReviewed: 0,
					wordsCorrect: 0,
					duration: 0
				};
			} finally {
				isLoading = false;
			}
		},

		/**
		 * Start a practice session (non-due reviews)
		 * Can only be called after due reviews are completed or when no reviews are due
		 */
		async startPracticeSession(mode: ReviewMode, maxWords: number = 10) {
			if (!browser) return;

			isLoading = true;
			currentIndex = 0;
			sessionStats = { reviewed: 0, correct: 0 };
			isPracticeMode = true;

			try {
				// Build practice queue - excludes words not due and recently reviewed
				queue = await buildReviewQueue({
					mode,
					maxWords,
					includeNewWords: false,
					practiceMode: true // Signal to queue builder to use practice logic
				});

				// Build card data with contextual information
				cardData = await Promise.all(queue.map(buildReviewCardData));

				// Create session record
				const userId = localStorage.getItem('arabico-anon-id') || crypto.randomUUID();
				if (!localStorage.getItem('arabico-anon-id')) {
					localStorage.setItem('arabico-anon-id', userId);
				}

				currentSession = {
					userId,
					mode,
					startTime: new Date(),
					wordsReviewed: 0,
					wordsCorrect: 0,
					duration: 0
				};
			} finally {
				isLoading = false;
			}
		},

		/**
		 * Record a review response and calculate next review
		 */
		async recordResponse(rating: 1 | 2 | 3 | 4, responseTime: number) {
			if (!browser || !currentSession || currentIndex >= queue.length) return;

			const entry = queue[currentIndex];

			// Build FSRSCard from entry's stored fields
			const card: FSRSCard = {
				stability: entry.stability ?? 0,
				difficulty: entry.difficulty ?? 0,
				state: (entry.fsrsState ?? 0) as FSRSState,
				reps: entry.reps ?? 0,
				lapses: entry.lapses ?? 0,
				lastReview: entry.lastReviewed ? (
					entry.lastReviewed instanceof Date
						? entry.lastReviewed.toISOString()
						: entry.lastReviewed
				) : undefined,
				scheduledDays: entry.scheduledDays ?? 0,
				elapsedDays: entry.elapsedDays ?? 0,
			};

			// Review with FSRS + Quranic adjustments
			const result = await reviewWord(card, rating as FSRSRating, entry);

			// Determine familiarity
			let newFamiliarity = entry.familiarity;
			if (entry.familiarity === 'seen') {
				newFamiliarity = 'learning';
			}
			if (shouldPromoteToKnown(result.card)) {
				newFamiliarity = 'known';
			}

			const newDifficulty = calculateDifficultyScore(result.card);

			// Update database with FSRS fields
			await vocabularyDB.updateFSRS(entry.wordId, {
				stability: result.card.stability,
				difficulty: result.card.difficulty,
				fsrsState: result.card.state,
				reps: result.card.reps,
				lapses: result.card.lapses,
				scheduledDays: result.card.scheduledDays,
				elapsedDays: result.card.elapsedDays,
				nextReviewDate: result.nextReviewDate,
				familiarity: newFamiliarity,
				difficultyScore: newDifficulty,
			});

			// Queue for cloud sync
			syncManager.queueVocabularySync(entry.wordId);

			// Fix: reassign sessionStats for proper Svelte 5 reactivity
			sessionStats = {
				reviewed: sessionStats.reviewed + 1,
				correct: sessionStats.correct + (rating >= 3 ? 1 : 0),
			};

			// Move to next card
			currentIndex++;
		},

		/**
		 * Skip current word without recording response
		 */
		skipWord() {
			if (currentIndex < queue.length) {
				currentIndex++;
			}
		},

		/**
		 * Complete the current session
		 */
		async completeSession() {
			if (!browser || !currentSession) return;

			const endTime = new Date();
			const duration = endTime.getTime() - currentSession.startTime.getTime();

			// Save session to database
			const sessionId = await reviewSessionDB.create({
				...currentSession,
				endTime,
				wordsReviewed: sessionStats.reviewed,
				wordsCorrect: sessionStats.correct,
				duration
			});

			// Queue session for cloud sync
			syncManager.queueSessionSync(sessionId);

			// Mark due reviews as completed if this wasn't a practice session
			if (!isPracticeMode) {
				dueCompletedThisSession = true;
			}

			// Refresh due count and forecast
			await this.refreshDueCount();
			await this.refreshForecast();

			// Return final stats
			return {
				wordsReviewed: sessionStats.reviewed,
				wordsCorrect: sessionStats.correct,
				duration,
				accuracy: sessionStats.reviewed > 0 ? sessionStats.correct / sessionStats.reviewed : 0,
				wasPractice: isPracticeMode
			};
		},

		/**
		 * Reset/cancel current session
		 */
		resetSession() {
			queue = [];
			cardData = [];
			currentIndex = 0;
			currentSession = null;
			sessionStats = { reviewed: 0, correct: 0 };
			isPracticeMode = false;
		},

		/**
		 * Reset the "due completed" flag (e.g., on new day)
		 */
		resetDueCompletedFlag() {
			dueCompletedThisSession = false;
		}
	};
}

export const reviewStore = createReviewStore();
