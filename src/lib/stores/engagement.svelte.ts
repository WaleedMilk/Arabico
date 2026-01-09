/**
 * Engagement Store for Arabico
 *
 * Simple streak tracking using Svelte 5 runes:
 * - Current streak (consecutive days)
 * - Longest streak
 * - Last review date
 * - Total words reviewed
 */

import { browser } from '$app/environment';
import { engagementDB } from '$lib/db';
import { syncManager } from '$lib/stores/sync.svelte';
import type { UserEngagement } from '$lib/types';

function createEngagementStore() {
	// State
	let engagement = $state<UserEngagement | null>(null);
	let isLoading = $state(false);

	// Get user ID from localStorage
	function getUserId(): string {
		if (!browser) return '';
		let userId = localStorage.getItem('arabico_anon_id');
		if (!userId) {
			userId = crypto.randomUUID();
			localStorage.setItem('arabico_anon_id', userId);
		}
		return userId;
	}

	return {
		// Getters
		get engagement() {
			return engagement;
		},
		get currentStreak() {
			return engagement?.currentStreak ?? 0;
		},
		get longestStreak() {
			return engagement?.longestStreak ?? 0;
		},
		get lastReviewDate() {
			return engagement?.lastReviewDate ?? null;
		},
		get totalWordsReviewed() {
			return engagement?.totalWordsReviewed ?? 0;
		},
		get isLoading() {
			return isLoading;
		},

		/**
		 * Initialize the store - load engagement data
		 */
		async init() {
			if (!browser) return;

			isLoading = true;
			try {
				const userId = getUserId();
				engagement = await engagementDB.get(userId) ?? null;

				if (!engagement) {
					// Create initial engagement record
					engagement = {
						userId,
						currentStreak: 0,
						longestStreak: 0,
						lastReviewDate: undefined,
						totalWordsReviewed: 0
					};
					await engagementDB.upsert(engagement);
				}

				// Check if streak is still valid (reviewed yesterday or today)
				await this.checkStreakValidity();
			} finally {
				isLoading = false;
			}
		},

		/**
		 * Check if current streak is still valid
		 * Reset if more than 1 day has passed since last review
		 */
		async checkStreakValidity() {
			if (!engagement || !engagement.lastReviewDate) return;

			const today = new Date();
			today.setHours(0, 0, 0, 0);

			const lastReview = new Date(engagement.lastReviewDate);
			lastReview.setHours(0, 0, 0, 0);

			const daysDiff = Math.floor(
				(today.getTime() - lastReview.getTime()) / (1000 * 60 * 60 * 24)
			);

			// If more than 1 day has passed, streak is broken
			if (daysDiff > 1) {
				engagement = {
					...engagement,
					currentStreak: 0
				};
				await engagementDB.upsert(engagement);
				// Queue for cloud sync
				syncManager.queueEngagementSync();
			}
		},

		/**
		 * Update streak after completing a review session
		 */
		async updateStreak() {
			if (!browser || !engagement) return;

			const today = new Date();
			today.setHours(0, 0, 0, 0);

			const lastReview = engagement.lastReviewDate
				? new Date(engagement.lastReviewDate)
				: null;

			if (lastReview) {
				lastReview.setHours(0, 0, 0, 0);
			}

			const daysDiff = lastReview
				? Math.floor((today.getTime() - lastReview.getTime()) / (1000 * 60 * 60 * 24))
				: -1;

			let newStreak = engagement.currentStreak;
			let newLongest = engagement.longestStreak;

			if (daysDiff === 0) {
				// Already reviewed today - no change to streak
			} else if (daysDiff === 1) {
				// Consecutive day - increment streak
				newStreak++;
			} else {
				// Streak broken or first review - start new streak
				newStreak = 1;
			}

			// Update longest streak if needed
			if (newStreak > newLongest) {
				newLongest = newStreak;
			}

			// Reassign the entire object to trigger Svelte reactivity
			engagement = {
				...engagement,
				currentStreak: newStreak,
				longestStreak: newLongest,
				lastReviewDate: today.toISOString()
			};

			// Save to database
			await engagementDB.upsert(engagement);
			// Queue for cloud sync
			syncManager.queueEngagementSync();
		},

		/**
		 * Add to total words reviewed count
		 */
		async addWordsReviewed(count: number) {
			if (!browser || !engagement) return;

			// Reassign the entire object to trigger Svelte reactivity
			engagement = {
				...engagement,
				totalWordsReviewed: engagement.totalWordsReviewed + count
			};
			await engagementDB.upsert(engagement);
			// Queue for cloud sync
			syncManager.queueEngagementSync();
		},

		/**
		 * Check if user has reviewed today
		 */
		hasReviewedToday(): boolean {
			if (!engagement?.lastReviewDate) return false;

			const today = new Date();
			today.setHours(0, 0, 0, 0);

			const lastReview = new Date(engagement.lastReviewDate);
			lastReview.setHours(0, 0, 0, 0);

			return today.getTime() === lastReview.getTime();
		},

		/**
		 * Get streak status message
		 */
		getStreakMessage(): string {
			if (!engagement) return 'Start your learning journey!';

			const streak = engagement.currentStreak;

			if (streak === 0) {
				return this.hasReviewedToday()
					? 'Great start! Come back tomorrow to build your streak!'
					: 'Ready to start your streak?';
			}

			if (streak >= 30) return `${streak} day streak! Incredible dedication!`;
			if (streak >= 14) return `${streak} day streak! Amazing progress!`;
			if (streak >= 7) return `${streak} day streak! Keep it up!`;
			if (streak >= 3) return `${streak} day streak! Building momentum!`;

			return `${streak} day streak!`;
		}
	};
}

export const engagement = createEngagementStore();
