// Familiarity levels for vocabulary tracking
export type FamiliarityLevel = 'new' | 'seen' | 'learning' | 'known' | 'ignored';

// Location reference in Quran
export interface QuranLocation {
	surah: number;
	ayah: number;
	wordIndex: number;
}

// Individual word in the Quran
export interface QuranWord {
	id: string; // Format: "surah:ayah:wordIndex"
	text: string; // Arabic surface form
	transliteration?: string;
}

// Vocabulary entry stored in database (with SRS fields)
export interface VocabularyEntry {
	id?: number;
	wordId: string; // Unique identifier (lemma-based)
	surfaceForm: string; // As seen in text
	lemma: string;
	root?: string;
	gloss: string; // English translation
	frequencyRank: number;
	firstSeen: QuranLocation;
	familiarity: FamiliarityLevel;
	lastReviewed?: Date;
	reviewCount: number;

	// SRS Algorithm Fields (SM-2 inspired)
	easeFactor: number; // Default 2.5, range 1.3-2.5
	interval: number; // Days until next review
	nextReviewDate?: Date; // Calculated review date
	consecutiveCorrect: number; // Streak of correct answers

	// Learning Context
	encounterLocations: QuranLocation[]; // All places word was seen
	difficultyScore: number; // Calculated difficulty (0-1)
}

// Default values for new vocabulary entries
export const DEFAULT_SRS_VALUES = {
	easeFactor: 2.5,
	interval: 0,
	consecutiveCorrect: 0,
	difficultyScore: 0.5,
	encounterLocations: [] as QuranLocation[]
};

// User reading progress
export interface UserProgress {
	id?: number;
	surahId: number;
	lastAyah: number;
	timestamp: Date;
}

// User settings/preferences
export interface UserSettings {
	key: string;
	value: string | number | boolean;
}

// Ayah (verse) data structure
export interface Ayah {
	id: number;
	text: string;
	words: QuranWord[];
	translation?: string;
}

// Surah (chapter) data structure
export interface Surah {
	id: number;
	name: string; // Arabic name
	englishName: string;
	englishNameTranslation: string;
	revelationType: 'Meccan' | 'Medinan';
	numberOfAyahs: number;
	ayahs?: Ayah[];
}

// Complete Quran data structure
export interface QuranData {
	surahs: Surah[];
}

// Word morphology data from Quranic Arabic Corpus
export interface WordMorphology {
	wordId: string;
	lemma: string;
	root?: string;
	pos: string; // Part of speech
	features: string[];
	gloss: string;
}

// Audio segment for word-level timing
export interface AudioSegment {
	wordId: string;
	startTime: number;
	endTime: number;
}

// Theme mode
export type ThemeMode = 'light' | 'dark' | 'system';

// App state for global settings
export interface AppState {
	theme: ThemeMode;
	fontSize: 'small' | 'medium' | 'large';
	showTransliteration: boolean;
	selectedReciter: string;
}

// ============================================
// Review & Learning System Types
// ============================================

// Review modes available
export type ReviewMode = 'contextual' | 'quick' | 'recognition' | 'recall';

// Quality rating for SM-2 algorithm (0-5 scale)
export type ReviewQuality = 0 | 1 | 2 | 3 | 4 | 5;

// Individual review response
export interface ReviewResponse {
	timestamp: Date;
	quality: ReviewQuality;
	responseTime: number; // Milliseconds
	reviewMode: ReviewMode;
	wasContextual: boolean;
}

// Review session tracking
export interface ReviewSession {
	id?: string;
	userId: string;
	mode: ReviewMode;
	startTime: Date;
	endTime?: Date;
	wordsReviewed: number;
	wordsCorrect: number;
	duration: number; // Milliseconds
}

// User engagement/streaks (simple version)
export interface UserEngagement {
	userId: string;
	currentStreak: number;
	longestStreak: number;
	lastReviewDate?: Date;
	totalWordsReviewed: number;
}

// SRS calculation result
export interface SRSResult {
	newEaseFactor: number;
	newInterval: number;
	nextReviewDate: Date;
	newConsecutiveCorrect: number;
}

// Word occurrence in Quran (for multi-context display)
export interface WordOccurrence {
	location: QuranLocation;
	surahName: string;
	ayahText: string;
	translation?: string;
}

// Review card data (enriched for display)
export interface ReviewCardData {
	entry: VocabularyEntry;
	primaryContext: WordOccurrence;
	additionalContexts: WordOccurrence[];
}
