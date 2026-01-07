/**
 * Review Store for Arabico
 *
 * Manages review session state using Svelte 5 runes:
 * - Review queue
 * - Current session tracking
 * - Due word count
 * - Response recording
 */

import { browser } from '$app/environment';
import { vocabularyDB, reviewSessionDB } from '$lib/db';
import {
	calculateNextReview,
	calculateDifficultyScore,
	shouldPromoteToKnown,
	calculateRootFamilyBonus
} from '$lib/review/srs-algorithm';
import { buildReviewQueue, buildReviewCardData, getDueWordCount } from '$lib/review/review-queue';
import type {
	VocabularyEntry,
	ReviewMode,
	ReviewQuality,
	ReviewSession,
	ReviewCardData
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

		/**
		 * Initialize the store - load due count
		 */
		async init() {
			if (!browser) return;
			await this.refreshDueCount();
		},

		/**
		 * Refresh the due word count
		 */
		async refreshDueCount() {
			if (!browser) return;
			dueCount = await getDueWordCount();
		},

		/**
		 * Start a new review session
		 */
		async startSession(mode: ReviewMode, maxWords: number = 15) {
			if (!browser) return;

			isLoading = true;
			currentIndex = 0;
			sessionStats = { reviewed: 0, correct: 0 };

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
				const userId = localStorage.getItem('arabico_anon_id') || crypto.randomUUID();
				if (!localStorage.getItem('arabico_anon_id')) {
					localStorage.setItem('arabico_anon_id', userId);
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
		async recordResponse(quality: ReviewQuality, responseTime: number) {
			if (!browser || !currentSession || currentIndex >= queue.length) return;

			const entry = queue[currentIndex];

			// Calculate root family bonus (if we have root data)
			let rootFamilyBonus = 0;
			if (entry.root) {
				const relatedWords = await vocabularyDB.getByRoot(entry.root);
				const knownCount = relatedWords.filter((w) => w.familiarity === 'known').length;
				rootFamilyBonus = calculateRootFamilyBonus(knownCount, relatedWords.length);
			}

			// Calculate new SRS values
			const srsResult = calculateNextReview(entry, quality, rootFamilyBonus);

			// Determine new familiarity
			let newFamiliarity = entry.familiarity;
			if (entry.familiarity === 'seen') {
				newFamiliarity = 'learning';
			}

			// Check if should promote to "known"
			const updatedEntry = {
				...entry,
				easeFactor: srsResult.newEaseFactor,
				interval: srsResult.newInterval,
				consecutiveCorrect: srsResult.newConsecutiveCorrect
			};
			if (shouldPromoteToKnown(updatedEntry)) {
				newFamiliarity = 'known';
			}

			// Calculate new difficulty score
			const newDifficulty = calculateDifficultyScore(updatedEntry);

			// Update database
			await vocabularyDB.updateSRS(entry.wordId, {
				easeFactor: srsResult.newEaseFactor,
				interval: srsResult.newInterval,
				nextReviewDate: srsResult.nextReviewDate,
				consecutiveCorrect: srsResult.newConsecutiveCorrect,
				familiarity: newFamiliarity,
				difficultyScore: newDifficulty
			});

			// Update session stats
			sessionStats.reviewed++;
			if (quality >= 3) {
				sessionStats.correct++;
			}

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
			await reviewSessionDB.create({
				...currentSession,
				endTime,
				wordsReviewed: sessionStats.reviewed,
				wordsCorrect: sessionStats.correct,
				duration
			});

			// Refresh due count
			await this.refreshDueCount();

			// Return final stats
			return {
				wordsReviewed: sessionStats.reviewed,
				wordsCorrect: sessionStats.correct,
				duration,
				accuracy: sessionStats.reviewed > 0 ? sessionStats.correct / sessionStats.reviewed : 0
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
		}
	};
}

export const reviewStore = createReviewStore();
