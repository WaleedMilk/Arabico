import Dexie, { type EntityTable } from 'dexie';
import type { VocabularyEntry, UserProgress, UserSettings } from '$lib/types';

// Database class extending Dexie
class ArabicoDB extends Dexie {
	vocabulary!: EntityTable<VocabularyEntry, 'id'>;
	progress!: EntityTable<UserProgress, 'id'>;
	settings!: EntityTable<UserSettings, 'key'>;

	constructor() {
		super('ArabicoDB');

		this.version(1).stores({
			vocabulary: '++id, wordId, lemma, familiarity, frequencyRank, lastReviewed',
			progress: '++id, surahId, timestamp',
			settings: 'key'
		});
	}
}

// Singleton database instance
export const db = new ArabicoDB();

// Vocabulary operations
export const vocabularyDB = {
	async getByWordId(wordId: string): Promise<VocabularyEntry | undefined> {
		return db.vocabulary.where('wordId').equals(wordId).first();
	},

	async getByLemma(lemma: string): Promise<VocabularyEntry[]> {
		return db.vocabulary.where('lemma').equals(lemma).toArray();
	},

	async getByFamiliarity(level: VocabularyEntry['familiarity']): Promise<VocabularyEntry[]> {
		return db.vocabulary.where('familiarity').equals(level).toArray();
	},

	async upsert(entry: Omit<VocabularyEntry, 'id'>): Promise<number> {
		const existing = await this.getByWordId(entry.wordId);
		if (existing && existing.id !== undefined) {
			await db.vocabulary.update(existing.id, entry);
			return existing.id;
		}
		return db.vocabulary.add(entry as VocabularyEntry) as Promise<number>;
	},

	async updateFamiliarity(wordId: string, familiarity: VocabularyEntry['familiarity']): Promise<void> {
		const entry = await this.getByWordId(wordId);
		if (entry) {
			await db.vocabulary.update(entry.id!, {
				familiarity,
				lastReviewed: new Date(),
				reviewCount: (entry.reviewCount || 0) + 1
			});
		}
	},

	async getWordsForReview(limit = 20): Promise<VocabularyEntry[]> {
		return db.vocabulary
			.where('familiarity')
			.anyOf(['seen', 'learning'])
			.sortBy('lastReviewed')
			.then(words => words.slice(0, limit));
	},

	async getStats(): Promise<Record<VocabularyEntry['familiarity'], number>> {
		const stats: Record<VocabularyEntry['familiarity'], number> = {
			new: 0,
			seen: 0,
			learning: 0,
			known: 0,
			ignored: 0
		};

		const all = await db.vocabulary.toArray();
		for (const entry of all) {
			stats[entry.familiarity]++;
		}
		return stats;
	}
};

// Progress operations
export const progressDB = {
	async getLastPosition(surahId: number): Promise<UserProgress | undefined> {
		return db.progress.where('surahId').equals(surahId).last();
	},

	async savePosition(surahId: number, lastAyah: number): Promise<void> {
		await db.progress.add({
			surahId,
			lastAyah,
			timestamp: new Date()
		});
	},

	async getRecentSurahs(limit = 5): Promise<UserProgress[]> {
		return db.progress.orderBy('timestamp').reverse().limit(limit).toArray();
	}
};

// Settings operations
export const settingsDB = {
	async get<T>(key: string, defaultValue: T): Promise<T> {
		const setting = await db.settings.get(key);
		return setting ? (setting.value as T) : defaultValue;
	},

	async set(key: string, value: string | number | boolean): Promise<void> {
		await db.settings.put({ key, value });
	},

	async getAll(): Promise<Record<string, unknown>> {
		const settings = await db.settings.toArray();
		return Object.fromEntries(settings.map(s => [s.key, s.value]));
	}
};
