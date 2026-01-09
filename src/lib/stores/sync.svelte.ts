/**
 * Sync Manager for Arabico
 *
 * Handles automatic syncing of user data to Supabase.
 * - Debounces sync operations to avoid excessive API calls
 * - Batches multiple changes together
 * - Handles offline gracefully
 * - Uses UUID as user identifier
 */

import { browser } from '$app/environment';
import {
	supabase,
	getCurrentUserId,
	syncVocabularyToSupabase,
	type DbVocabularyEntry
} from '$lib/db/supabase';
import { vocabularyDB, engagementDB, reviewSessionDB } from '$lib/db';
import type { VocabularyEntry, UserEngagement, ReviewSession } from '$lib/types';

// Sync configuration
const DEBOUNCE_MS = 500;

// Pending sync queues
let pendingVocabulary = new Set<string>();
let pendingEngagement = false;
let pendingSessions = new Set<string>();
let pendingProgress = new Set<number>();

// Debounce timers
let vocabularyTimer: ReturnType<typeof setTimeout> | null = null;
let engagementTimer: ReturnType<typeof setTimeout> | null = null;
let sessionTimer: ReturnType<typeof setTimeout> | null = null;
let progressTimer: ReturnType<typeof setTimeout> | null = null;

function createSyncStore() {
	// State
	let isSyncing = $state(false);
	let lastSyncTime = $state<Date | null>(null);
	let pendingChanges = $state(0);
	let isOnline = $state(browser ? navigator.onLine : true);
	let error = $state<string | null>(null);
	let userId = $state<string | null>(null);

	// Update pending count
	function updatePendingCount() {
		pendingChanges = pendingVocabulary.size +
			(pendingEngagement ? 1 : 0) +
			pendingSessions.size +
			pendingProgress.size;
	}

	// Convert local VocabularyEntry to Supabase format
	function toDbVocabularyEntry(entry: VocabularyEntry, odUserId: string): DbVocabularyEntry {
		// Handle SerializableDate (can be Date or string)
		let lastReviewed: string | undefined;
		if (entry.lastReviewed) {
			lastReviewed = entry.lastReviewed instanceof Date
				? entry.lastReviewed.toISOString()
				: entry.lastReviewed;
		}

		return {
			user_id: odUserId,
			word_id: entry.wordId,
			surface_form: entry.surfaceForm,
			lemma: entry.lemma,
			root: entry.root,
			gloss: entry.gloss,
			frequency_rank: entry.frequencyRank,
			first_seen: new Date().toISOString(),
			familiarity: entry.familiarity,
			last_reviewed: lastReviewed,
			review_count: entry.reviewCount || 0
		};
	}

	return {
		// Getters
		get isSyncing() { return isSyncing; },
		get lastSyncTime() { return lastSyncTime; },
		get pendingChanges() { return pendingChanges; },
		get isOnline() { return isOnline; },
		get error() { return error; },
		get userId() { return userId; },

		/**
		 * Initialize the sync manager
		 */
		async init() {
			if (!browser) return;

			// Get user ID
			userId = await getCurrentUserId();

			// Set up online/offline listeners
			window.addEventListener('online', () => {
				isOnline = true;
				// Attempt to sync pending changes when back online
				this.flushAll();
			});

			window.addEventListener('offline', () => {
				isOnline = false;
			});

			// Initial sync - pull from cloud
			await this.pullFromCloud();
		},

		/**
		 * Pull data from Supabase (on init)
		 */
		async pullFromCloud() {
			if (!browser || !userId || !isOnline) return;

			try {
				isSyncing = true;
				error = null;

				// Pull engagement data
				const { data: engagementData } = await supabase
					.from('user_engagement')
					.select('*')
					.eq('user_id', userId)
					.single();

				if (engagementData) {
					// Update local engagement if cloud is newer
					const localEngagement = await engagementDB.get(userId);
					if (!localEngagement ||
						(engagementData.updated_at && localEngagement.lastReviewDate &&
						 new Date(engagementData.updated_at) > new Date(localEngagement.lastReviewDate))) {
						await engagementDB.upsert({
							userId: engagementData.user_id,
							currentStreak: engagementData.current_streak,
							longestStreak: engagementData.longest_streak,
							lastReviewDate: engagementData.last_review_date,
							totalWordsReviewed: engagementData.total_words_reviewed
						});
					}
				}

				lastSyncTime = new Date();
			} catch (err) {
				console.error('Error pulling from cloud:', err);
				error = err instanceof Error ? err.message : 'Sync failed';
			} finally {
				isSyncing = false;
			}
		},

		/**
		 * Queue a vocabulary entry for sync
		 */
		queueVocabularySync(wordId: string) {
			if (!browser || !isOnline) return;

			pendingVocabulary.add(wordId);
			updatePendingCount();

			// Debounce
			if (vocabularyTimer) clearTimeout(vocabularyTimer);
			vocabularyTimer = setTimeout(() => this.flushVocabulary(), DEBOUNCE_MS);
		},

		/**
		 * Queue engagement data for sync
		 */
		queueEngagementSync() {
			if (!browser || !isOnline) return;

			pendingEngagement = true;
			updatePendingCount();

			// Debounce
			if (engagementTimer) clearTimeout(engagementTimer);
			engagementTimer = setTimeout(() => this.flushEngagement(), DEBOUNCE_MS);
		},

		/**
		 * Queue a review session for sync
		 */
		queueSessionSync(sessionId: string) {
			if (!browser || !isOnline) return;

			pendingSessions.add(sessionId);
			updatePendingCount();

			// Debounce
			if (sessionTimer) clearTimeout(sessionTimer);
			sessionTimer = setTimeout(() => this.flushSessions(), DEBOUNCE_MS);
		},

		/**
		 * Queue reading progress for sync
		 */
		queueProgressSync(surahId: number) {
			if (!browser || !isOnline) return;

			pendingProgress.add(surahId);
			updatePendingCount();

			// Debounce
			if (progressTimer) clearTimeout(progressTimer);
			progressTimer = setTimeout(() => this.flushProgress(), DEBOUNCE_MS);
		},

		/**
		 * Flush pending vocabulary changes to Supabase
		 */
		async flushVocabulary() {
			if (!userId || pendingVocabulary.size === 0) return;

			const wordIds = Array.from(pendingVocabulary);
			pendingVocabulary.clear();
			updatePendingCount();

			try {
				isSyncing = true;

				// Get entries from local DB
				const entries: DbVocabularyEntry[] = [];
				for (const wordId of wordIds) {
					const entry = await vocabularyDB.getByWordId(wordId);
					if (entry) {
						entries.push(toDbVocabularyEntry(entry, userId));
					}
				}

				if (entries.length > 0) {
					await syncVocabularyToSupabase(userId, entries);
				}

				lastSyncTime = new Date();
				error = null;
			} catch (err) {
				console.error('Error syncing vocabulary:', err);
				error = err instanceof Error ? err.message : 'Vocabulary sync failed';
				// Re-add failed items to queue
				wordIds.forEach(id => pendingVocabulary.add(id));
				updatePendingCount();
			} finally {
				isSyncing = false;
			}
		},

		/**
		 * Flush pending engagement data to Supabase
		 */
		async flushEngagement() {
			if (!userId || !pendingEngagement) return;

			pendingEngagement = false;
			updatePendingCount();

			try {
				isSyncing = true;

				const engagement = await engagementDB.get(userId);
				if (engagement) {
					const { error: upsertError } = await supabase
						.from('user_engagement')
						.upsert({
							user_id: userId,
							current_streak: engagement.currentStreak,
							longest_streak: engagement.longestStreak,
							last_review_date: engagement.lastReviewDate,
							total_words_reviewed: engagement.totalWordsReviewed,
							updated_at: new Date().toISOString()
						}, { onConflict: 'user_id' });

					if (upsertError) throw upsertError;
				}

				lastSyncTime = new Date();
				error = null;
			} catch (err) {
				console.error('Error syncing engagement:', err);
				error = err instanceof Error ? err.message : 'Engagement sync failed';
				// Re-queue on failure
				pendingEngagement = true;
				updatePendingCount();
			} finally {
				isSyncing = false;
			}
		},

		/**
		 * Flush pending review sessions to Supabase
		 */
		async flushSessions() {
			if (!userId || pendingSessions.size === 0) return;

			const sessionIds = Array.from(pendingSessions);
			pendingSessions.clear();
			updatePendingCount();

			try {
				isSyncing = true;

				for (const sessionId of sessionIds) {
					const session = await reviewSessionDB.getById(sessionId);

					if (session) {
						const { error: upsertError } = await supabase
							.from('review_sessions')
							.upsert({
								id: session.id,
								user_id: userId,
								mode: session.mode,
								start_time: session.startTime,
								end_time: session.endTime,
								words_reviewed: session.wordsReviewed,
								words_correct: session.wordsCorrect,
								duration: session.duration
							}, { onConflict: 'id' });

						if (upsertError) throw upsertError;
					}
				}

				lastSyncTime = new Date();
				error = null;
			} catch (err) {
				console.error('Error syncing sessions:', err);
				error = err instanceof Error ? err.message : 'Session sync failed';
				// Re-add failed items
				sessionIds.forEach(id => pendingSessions.add(id));
				updatePendingCount();
			} finally {
				isSyncing = false;
			}
		},

		/**
		 * Flush pending reading progress to Supabase
		 */
		async flushProgress() {
			if (!userId || pendingProgress.size === 0) return;

			const surahIds = Array.from(pendingProgress);
			pendingProgress.clear();
			updatePendingCount();

			try {
				isSyncing = true;

				for (const surahId of surahIds) {
					const { error: upsertError } = await supabase
						.from('reading_progress')
						.upsert({
							user_id: userId,
							surah_id: surahId,
							last_read_at: new Date().toISOString()
						}, { onConflict: 'user_id,surah_id' });

					if (upsertError) throw upsertError;
				}

				lastSyncTime = new Date();
				error = null;
			} catch (err) {
				console.error('Error syncing progress:', err);
				error = err instanceof Error ? err.message : 'Progress sync failed';
				// Re-add failed items
				surahIds.forEach(id => pendingProgress.add(id));
				updatePendingCount();
			} finally {
				isSyncing = false;
			}
		},

		/**
		 * Flush all pending changes
		 */
		async flushAll() {
			await Promise.all([
				this.flushVocabulary(),
				this.flushEngagement(),
				this.flushSessions(),
				this.flushProgress()
			]);
		},

		/**
		 * Force a full sync of all data
		 */
		async forceSyncAll() {
			if (!browser || !userId || !isOnline) return;

			try {
				isSyncing = true;
				error = null;

				// Sync all vocabulary
				const allVocabulary = await vocabularyDB.getAll();
				if (allVocabulary.length > 0) {
					const entries = allVocabulary.map(e => toDbVocabularyEntry(e, userId!));
					await syncVocabularyToSupabase(userId, entries);
				}

				// Sync engagement
				const engagement = await engagementDB.get(userId);
				if (engagement) {
					await supabase
						.from('user_engagement')
						.upsert({
							user_id: userId,
							current_streak: engagement.currentStreak,
							longest_streak: engagement.longestStreak,
							last_review_date: engagement.lastReviewDate,
							total_words_reviewed: engagement.totalWordsReviewed,
							updated_at: new Date().toISOString()
						}, { onConflict: 'user_id' });
				}

				// Sync recent sessions
				const sessions = await reviewSessionDB.getRecent(50);
				for (const session of sessions) {
					await supabase
						.from('review_sessions')
						.upsert({
							id: session.id,
							user_id: userId,
							mode: session.mode,
							start_time: session.startTime,
							end_time: session.endTime,
							words_reviewed: session.wordsReviewed,
							words_correct: session.wordsCorrect,
							duration: session.duration
						}, { onConflict: 'id' });
				}

				lastSyncTime = new Date();
			} catch (err) {
				console.error('Error in full sync:', err);
				error = err instanceof Error ? err.message : 'Full sync failed';
			} finally {
				isSyncing = false;
			}
		}
	};
}

export const syncManager = createSyncStore();
