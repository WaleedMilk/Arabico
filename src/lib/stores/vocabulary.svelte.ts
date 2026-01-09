import { browser } from '$app/environment';
import { vocabularyDB, db } from '$lib/db';
import { getCurrentUserId, fetchVocabularyFromSupabase } from '$lib/db/supabase';
import { syncManager } from '$lib/stores/sync.svelte';
import type { VocabularyEntry, FamiliarityLevel, QuranLocation } from '$lib/types';

// In-memory cache of word familiarity for fast lookups during reading
function createVocabularyStore() {
	let familiarityCache = $state<Map<string, FamiliarityLevel>>(new Map());
	let isLoaded = $state(false);
	let userId = $state<string | null>(null);
	let isSyncing = $state(false);

	// Load vocabulary from Supabase and merge with local
	async function loadFromSupabase() {
		if (!browser) return;

		try {
			userId = await getCurrentUserId();
			if (!userId) return;

			const remoteEntries = await fetchVocabularyFromSupabase(userId);
			const cache = new Map<string, FamiliarityLevel>();

			for (const entry of remoteEntries) {
				cache.set(entry.word_id, entry.familiarity);

				// Also save to local IndexedDB for offline access
				await vocabularyDB.upsert({
					wordId: entry.word_id,
					surfaceForm: entry.surface_form,
					lemma: entry.lemma,
					root: entry.root,
					gloss: entry.gloss,
					frequencyRank: entry.frequency_rank,
					firstSeen: { surah: 1, ayah: 1, wordIndex: 0 }, // Default, will be overwritten
					familiarity: entry.familiarity,
					lastReviewed: entry.last_reviewed ? new Date(entry.last_reviewed) : undefined,
					reviewCount: entry.review_count,
					easeFactor: 2.5,
					interval: 0,
					consecutiveCorrect: 0,
					encounterLocations: [],
					difficultyScore: 0.5
				});
			}

			familiarityCache = cache;
		} catch (error) {
			console.error('Failed to load from Supabase:', error);
			// Fall back to local data
			await loadFromLocal();
		}
	}

	// Load from local IndexedDB (fallback/offline)
	async function loadFromLocal() {
		if (!browser) return;

		try {
			const allWords = await db.vocabulary.toArray();
			const cache = new Map<string, FamiliarityLevel>();
			for (const word of allWords) {
				cache.set(word.wordId, word.familiarity);
			}
			familiarityCache = cache;
		} catch (error) {
			console.error('Failed to load vocabulary cache:', error);
		}
	}

	// Load all vocabulary into cache on init
	async function loadCache() {
		if (!browser) return;

		try {
			userId = await getCurrentUserId();

			// Try loading from Supabase first
			if (navigator.onLine && userId) {
				await loadFromSupabase();
			} else {
				await loadFromLocal();
			}

			isLoaded = true;
		} catch (error) {
			console.error('Failed to load vocabulary cache:', error);
			// Fallback to local
			await loadFromLocal();
			isLoaded = true;
		}
	}

	// Helper to update cache reactively
	function setCacheEntry(wordId: string, level: FamiliarityLevel) {
		familiarityCache = new Map(familiarityCache).set(wordId, level);
	}

	return {
		get cache() {
			return familiarityCache;
		},
		get isLoaded() {
			return isLoaded;
		},
		get isSyncing() {
			return isSyncing;
		},
		get userId() {
			return userId;
		},

		async init() {
			await loadCache();
		},

		// Force sync with Supabase (delegates to syncManager)
		async syncWithCloud() {
			if (!browser || !userId || isSyncing) return;
			isSyncing = true;
			try {
				await syncManager.forceSyncAll();
				await loadFromSupabase();
			} finally {
				isSyncing = false;
			}
		},

		getFamiliarity(wordId: string): FamiliarityLevel {
			return familiarityCache.get(wordId) || 'new';
		},

		// Get full entry from database (for checking nextReviewDate, etc.)
		async getEntry(wordId: string): Promise<VocabularyEntry | undefined> {
			if (!browser) return undefined;
			return vocabularyDB.getByWordId(wordId);
		},

		async markSeen(wordId: string, surfaceForm: string, lemma: string, gloss: string, location: QuranLocation) {
			if (!browser) return;

			const current = familiarityCache.get(wordId);

			// Only update if word is new
			if (!current || current === 'new') {
				const entry: VocabularyEntry = {
					wordId,
					surfaceForm,
					lemma,
					gloss,
					frequencyRank: 0,
					firstSeen: location,
					familiarity: 'seen',
					reviewCount: 0,
					// SRS defaults
					easeFactor: 2.5,
					interval: 0,
					consecutiveCorrect: 0,
					encounterLocations: [location],
					difficultyScore: 0.5
				};

				// Save locally first (fast)
				await vocabularyDB.upsert(entry);
				setCacheEntry(wordId, 'seen');

				// Queue for cloud sync (debounced)
				syncManager.queueVocabularySync(wordId);
			}
		},

		async updateFamiliarity(wordId: string, level: FamiliarityLevel) {
			if (!browser) return;

			// Update locally first
			await vocabularyDB.updateFamiliarity(wordId, level);
			setCacheEntry(wordId, level);

			// Queue for cloud sync (debounced)
			syncManager.queueVocabularySync(wordId);
		},

		async addToReview(wordId: string) {
			await this.updateFamiliarity(wordId, 'learning');
		},

		async markKnown(wordId: string) {
			await this.updateFamiliarity(wordId, 'known');
		},

		async ignore(wordId: string) {
			await this.updateFamiliarity(wordId, 'ignored');
		},

		async getStats() {
			return vocabularyDB.getStats();
		}
	};
}

export const vocabulary = createVocabularyStore();
