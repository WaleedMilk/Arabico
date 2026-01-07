import Dexie, { type EntityTable } from 'dexie';
import type {
	VocabularyEntry,
	UserProgress,
	UserSettings,
	ReviewSession,
	UserEngagement,
	DEFAULT_SRS_VALUES
} from '$lib/types';

// Database class extending Dexie
class ArabicoDB extends Dexie {
	vocabulary!: EntityTable<VocabularyEntry, 'id'>;
	progress!: EntityTable<UserProgress, 'id'>;
	settings!: EntityTable<UserSettings, 'key'>;
	reviewSessions!: EntityTable<ReviewSession, 'id'>;
	userEngagement!: EntityTable<UserEngagement, 'userId'>;

	constructor() {
		super('ArabicoDB');

		// Version 1: Original schema
		this.version(1).stores({
			vocabulary: '++id, wordId, lemma, familiarity, frequencyRank, lastReviewed',
			progress: '++id, surahId, timestamp',
			settings: 'key'
		});

		// Version 2: Add SRS fields and new tables
		this.version(2)
			.stores({
				vocabulary:
					'++id, wordId, lemma, familiarity, frequencyRank, lastReviewed, nextReviewDate, root',
				progress: '++id, surahId, timestamp',
				settings: 'key',
				reviewSessions: '++id, userId, mode, startTime',
				userEngagement: 'userId'
			})
			.upgrade((tx) => {
				// Migrate existing vocabulary entries with default SRS values
				return tx
					.table('vocabulary')
					.toCollection()
					.modify((entry: VocabularyEntry) => {
						if (entry.easeFactor === undefined) entry.easeFactor = 2.5;
						if (entry.interval === undefined) entry.interval = 0;
						if (entry.consecutiveCorrect === undefined) entry.consecutiveCorrect = 0;
						if (entry.difficultyScore === undefined) entry.difficultyScore = 0.5;
						if (entry.encounterLocations === undefined) {
							entry.encounterLocations = entry.firstSeen ? [entry.firstSeen] : [];
						}
					});
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

	async getByRoot(root: string): Promise<VocabularyEntry[]> {
		return db.vocabulary.where('root').equals(root).toArray();
	},

	async getByFamiliarity(level: VocabularyEntry['familiarity']): Promise<VocabularyEntry[]> {
		return db.vocabulary.where('familiarity').equals(level).toArray();
	},

	async upsert(entry: Omit<VocabularyEntry, 'id'>): Promise<number> {
		// Add default SRS values for new entries
		const entryWithDefaults: Omit<VocabularyEntry, 'id'> = {
			easeFactor: 2.5,
			interval: 0,
			consecutiveCorrect: 0,
			difficultyScore: 0.5,
			encounterLocations: entry.firstSeen ? [entry.firstSeen] : [],
			...entry
		};

		const existing = await this.getByWordId(entry.wordId);
		if (existing && existing.id !== undefined) {
			await db.vocabulary.update(existing.id, entryWithDefaults);
			return existing.id;
		}
		return db.vocabulary.add(entryWithDefaults as VocabularyEntry) as Promise<number>;
	},

	async updateFamiliarity(
		wordId: string,
		familiarity: VocabularyEntry['familiarity']
	): Promise<void> {
		const entry = await this.getByWordId(wordId);
		if (entry) {
			await db.vocabulary.update(entry.id!, {
				familiarity,
				lastReviewed: new Date(),
				reviewCount: (entry.reviewCount || 0) + 1
			});
		}
	},

	// Update SRS fields after review
	async updateSRS(
		wordId: string,
		updates: {
			easeFactor: number;
			interval: number;
			nextReviewDate: Date;
			consecutiveCorrect: number;
			familiarity?: VocabularyEntry['familiarity'];
			difficultyScore?: number;
		}
	): Promise<void> {
		const entry = await this.getByWordId(wordId);
		if (entry) {
			await db.vocabulary.update(entry.id!, {
				...updates,
				lastReviewed: new Date(),
				reviewCount: (entry.reviewCount || 0) + 1
			});
		}
	},

	// Add a new encounter location
	async addEncounterLocation(wordId: string, location: VocabularyEntry['firstSeen']): Promise<void> {
		const entry = await this.getByWordId(wordId);
		if (entry) {
			const locations = entry.encounterLocations || [];
			// Avoid duplicates
			const exists = locations.some(
				(loc) =>
					loc.surah === location.surah &&
					loc.ayah === location.ayah &&
					loc.wordIndex === location.wordIndex
			);
			if (!exists) {
				await db.vocabulary.update(entry.id!, {
					encounterLocations: [...locations, location]
				});
			}
		}
	},

	// Get words due for review (nextReviewDate <= now)
	async getDueForReview(limit = 20): Promise<VocabularyEntry[]> {
		const now = new Date();
		const allLearning = await db.vocabulary
			.where('familiarity')
			.anyOf(['seen', 'learning'])
			.toArray();

		// Filter to due words and sort by overdue time
		const dueWords = allLearning
			.filter((w) => !w.nextReviewDate || new Date(w.nextReviewDate) <= now)
			.sort((a, b) => {
				const aDate = a.nextReviewDate ? new Date(a.nextReviewDate).getTime() : 0;
				const bDate = b.nextReviewDate ? new Date(b.nextReviewDate).getTime() : 0;
				return aDate - bDate; // Most overdue first
			});

		return dueWords.slice(0, limit);
	},

	// Count words due for review
	async getDueCount(): Promise<number> {
		const now = new Date();
		const allLearning = await db.vocabulary
			.where('familiarity')
			.anyOf(['seen', 'learning'])
			.toArray();

		return allLearning.filter((w) => !w.nextReviewDate || new Date(w.nextReviewDate) <= now).length;
	},

	// Legacy: get words for review (uses old sorting)
	async getWordsForReview(limit = 20): Promise<VocabularyEntry[]> {
		return db.vocabulary
			.where('familiarity')
			.anyOf(['seen', 'learning'])
			.sortBy('lastReviewed')
			.then((words) => words.slice(0, limit));
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
		return Object.fromEntries(settings.map((s) => [s.key, s.value]));
	}
};

// Review session operations
export const reviewSessionDB = {
	async create(session: Omit<ReviewSession, 'id'>): Promise<string> {
		const id = crypto.randomUUID();
		await db.reviewSessions.add({ ...session, id } as ReviewSession);
		return id;
	},

	async update(id: string, updates: Partial<ReviewSession>): Promise<void> {
		await db.reviewSessions.update(id, updates);
	},

	async getRecent(limit = 10): Promise<ReviewSession[]> {
		return db.reviewSessions.orderBy('startTime').reverse().limit(limit).toArray();
	},

	async getByUserId(userId: string): Promise<ReviewSession[]> {
		return db.reviewSessions.where('userId').equals(userId).toArray();
	}
};

// User engagement operations
export const engagementDB = {
	async get(userId: string): Promise<UserEngagement | undefined> {
		return db.userEngagement.get(userId);
	},

	async upsert(engagement: UserEngagement): Promise<void> {
		await db.userEngagement.put(engagement);
	},

	async updateStreak(userId: string, newStreak: number, longestStreak: number): Promise<void> {
		const existing = await this.get(userId);
		if (existing) {
			await db.userEngagement.update(userId, {
				currentStreak: newStreak,
				longestStreak: Math.max(longestStreak, existing.longestStreak),
				lastReviewDate: new Date()
			});
		} else {
			await db.userEngagement.add({
				userId,
				currentStreak: newStreak,
				longestStreak: newStreak,
				lastReviewDate: new Date(),
				totalWordsReviewed: 0
			});
		}
	},

	async incrementWordsReviewed(userId: string, count: number): Promise<void> {
		const existing = await this.get(userId);
		if (existing) {
			await db.userEngagement.update(userId, {
				totalWordsReviewed: (existing.totalWordsReviewed || 0) + count
			});
		}
	}
};
