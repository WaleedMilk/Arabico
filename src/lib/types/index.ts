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

// Vocabulary entry stored in database
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
}

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
