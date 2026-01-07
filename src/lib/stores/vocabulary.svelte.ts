import { browser } from '$app/environment';
import { vocabularyDB, db } from '$lib/db';
import type { VocabularyEntry, FamiliarityLevel, QuranLocation } from '$lib/types';

// In-memory cache of word familiarity for fast lookups during reading
function createVocabularyStore() {
	let familiarityCache = $state<Map<string, FamiliarityLevel>>(new Map());
	let isLoaded = $state(false);

	// Load all vocabulary into cache on init
	async function loadCache() {
		if (!browser) return;

		try {
			// Single query to get all words (more efficient)
			const allWords = await db.vocabulary.toArray();

			const cache = new Map<string, FamiliarityLevel>();
			for (const word of allWords) {
				cache.set(word.wordId, word.familiarity);
			}
			familiarityCache = cache;
			isLoaded = true;
		} catch (error) {
			console.error('Failed to load vocabulary cache:', error);
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

		async init() {
			await loadCache();
		},

		getFamiliarity(wordId: string): FamiliarityLevel {
			return familiarityCache.get(wordId) || 'new';
		},

		async markSeen(wordId: string, surfaceForm: string, lemma: string, gloss: string, location: QuranLocation) {
			if (!browser) return;

			const current = familiarityCache.get(wordId);

			// Only update if word is new
			if (!current || current === 'new') {
				const entry: Omit<VocabularyEntry, 'id'> = {
					wordId,
					surfaceForm,
					lemma,
					gloss,
					frequencyRank: 0, // Will be populated from corpus data
					firstSeen: location,
					familiarity: 'seen',
					reviewCount: 0
				};

				await vocabularyDB.upsert(entry);
				setCacheEntry(wordId, 'seen');
			}
		},

		async updateFamiliarity(wordId: string, level: FamiliarityLevel) {
			if (!browser) return;

			await vocabularyDB.updateFamiliarity(wordId, level);
			setCacheEntry(wordId, level);
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
