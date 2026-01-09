/**
 * Quran Data Loader
 *
 * Loads word-by-word Quran data from bundled JSON files.
 * Uses lazy loading - only fetches surah data when needed.
 *
 * Translation Priority:
 * 1. Common vocabulary (80% file) - curated translations for common words
 * 2. WBW translations file - literal glosses
 * 3. QuranWBW embedded translations - fallback
 *
 * For verbs, also stores conjugation info (VerbInfo) for display.
 */

import type {
	Ayah,
	QuranWord,
	QuranWBWSurah,
	QuranWBWAyah,
	QuranWordWithTranslation,
	VerbInfo
} from '$lib/types';
import {
	loadCommonVocabulary,
	getCommonTranslation,
	isVocabularyLoaded,
	type VocabularyIndex,
	type VerbMatch
} from '$lib/data/common-vocabulary';

// Cache for loaded surahs
const surahCache = new Map<number, Ayah[]>();
const loadingPromises = new Map<number, Promise<Ayah[] | null>>();

// Cache for word-by-word translations (loaded once)
let wbwTranslations: Record<string, string> | null = null;
let wbwLoadPromise: Promise<Record<string, string> | null> | null = null;

// Common vocabulary index (loaded once)
let commonVocabIndex: VocabularyIndex | null = null;
let commonVocabLoadPromise: Promise<VocabularyIndex> | null = null;

/**
 * Load the English word-by-word translation file
 */
async function loadWbwTranslations(): Promise<Record<string, string> | null> {
	if (wbwTranslations) return wbwTranslations;
	if (wbwLoadPromise) return wbwLoadPromise;

	wbwLoadPromise = (async () => {
		try {
			const response = await fetch('/data/english-wbw.json');
			if (!response.ok) {
				console.error('Failed to load WBW translations:', response.status);
				return null;
			}
			wbwTranslations = await response.json();
			return wbwTranslations;
		} catch (error) {
			console.error('Error loading WBW translations:', error);
			return null;
		}
	})();

	return wbwLoadPromise;
}

/**
 * Load the common vocabulary index
 */
async function loadCommonVocab(): Promise<VocabularyIndex> {
	if (commonVocabIndex) return commonVocabIndex;
	if (commonVocabLoadPromise) return commonVocabLoadPromise;

	commonVocabLoadPromise = loadCommonVocabulary().then((index) => {
		commonVocabIndex = index;
		return index;
	});

	return commonVocabLoadPromise;
}

/**
 * Build VerbInfo from a verb match result
 */
function buildVerbInfo(verbMatch: VerbMatch): VerbInfo {
	return {
		root: verbMatch.verb.rootLetters,
		rootForm: verbMatch.verb.root,
		meaning: verbMatch.verb.meaning,
		matchedForm: verbMatch.matchedForm,
		baseForm: verbMatch.baseForm
	};
}

/**
 * Transform QuranWBW data format to our Ayah format
 *
 * Translation priority:
 * 1. Common vocabulary (80% file) - for common words/verbs
 * 2. WBW translations file - literal glosses
 * 3. QuranWBW embedded translations - fallback
 */
function transformSurahData(
	surahId: number,
	data: QuranWBWSurah,
	translations: Record<string, string> | null
): Ayah[] {
	const ayahs: Ayah[] = [];

	// QuranWBW uses string keys for ayah numbers
	const ayahNumbers = Object.keys(data)
		.filter((key) => !isNaN(Number(key)))
		.map(Number)
		.sort((a, b) => a - b);

	for (const ayahNum of ayahNumbers) {
		const ayahData: QuranWBWAyah = data[String(ayahNum)];
		if (!ayahData || !ayahData.w) continue;

		const words: QuranWordWithTranslation[] = ayahData.w.map((word, index) => {
			const wordId = `${surahId}:${ayahNum}:${index + 1}`;
			const arabicText = word.c;

			// WBW translation (always used for inline display under words)
			const wbwTranslation = translations?.[wordId] ?? word.e;

			// Check common vocabulary for curated translation (used in side panel)
			const commonResult = getCommonTranslation(arabicText);

			let isCommonWord = false;
			let commonTranslation: string | undefined;
			let verbInfo: VerbInfo | undefined;

			if (commonResult) {
				// Found in common vocabulary
				isCommonWord = true;
				commonTranslation = commonResult.translation;

				// If it's a verb, store conjugation info
				if (commonResult.isVerb && commonResult.verbMatch) {
					verbInfo = buildVerbInfo(commonResult.verbMatch);
				}
			}

			return {
				id: wordId,
				text: arabicText,
				transliteration: word.d,
				translation: wbwTranslation, // WBW for inline display
				audioStart: word.b,
				audioDuration: word.h,
				isCommonWord,
				commonTranslation, // Curated translation for side panel
				verbInfo
			};
		});

		// Combine all word texts for full ayah text
		const fullText = words.map((w) => w.text).join(' ');

		ayahs.push({
			id: ayahNum,
			text: fullText,
			words: words as QuranWord[],
			translation: ayahData.a?.g
		});
	}

	return ayahs;
}

/**
 * Load surah data from static JSON file
 */
async function loadSurahData(surahId: number): Promise<Ayah[] | null> {
	// Check cache first
	if (surahCache.has(surahId)) {
		return surahCache.get(surahId)!;
	}

	// Check if already loading
	if (loadingPromises.has(surahId)) {
		return loadingPromises.get(surahId)!;
	}

	// Start loading
	const loadPromise = (async () => {
		try {
			// Load surah data, WBW translations, and common vocabulary in parallel
			const [surahResponse, translations] = await Promise.all([
				fetch(`/data/surahs/${surahId}.json`),
				loadWbwTranslations(),
				loadCommonVocab() // Ensure common vocab is loaded
			]);

			if (!surahResponse.ok) {
				console.error(`Failed to load surah ${surahId}: ${surahResponse.status}`);
				return null;
			}

			const data: QuranWBWSurah = await surahResponse.json();
			const ayahs = transformSurahData(surahId, data, translations);

			// Cache the result
			surahCache.set(surahId, ayahs);
			loadingPromises.delete(surahId);

			return ayahs;
		} catch (error) {
			console.error(`Error loading surah ${surahId}:`, error);
			loadingPromises.delete(surahId);
			return null;
		}
	})();

	loadingPromises.set(surahId, loadPromise);
	return loadPromise;
}

/**
 * Get ayahs for a surah (async - loads on demand)
 */
export async function getSurahAyahsAsync(surahId: number): Promise<Ayah[] | null> {
	if (surahId < 1 || surahId > 114) return null;
	return loadSurahData(surahId);
}

/**
 * Get ayahs for a surah (sync - returns cached only)
 * Returns null if not yet loaded. Use getSurahAyahsAsync to load first.
 */
export function getSurahAyahsCached(surahId: number): Ayah[] | null {
	return surahCache.get(surahId) ?? null;
}

/**
 * Preload a surah in the background
 */
export function preloadSurah(surahId: number): void {
	if (surahId >= 1 && surahId <= 114 && !surahCache.has(surahId)) {
		loadSurahData(surahId);
	}
}

/**
 * Preload adjacent surahs for smoother navigation
 */
export function preloadAdjacentSurahs(currentSurahId: number): void {
	if (currentSurahId > 1) preloadSurah(currentSurahId - 1);
	if (currentSurahId < 114) preloadSurah(currentSurahId + 1);
}

/**
 * Get word gloss (translation) by word ID
 */
export async function getWordGlossAsync(wordId: string): Promise<{ gloss: string; lemma: string; transliteration: string } | null> {
	const parts = wordId.split(':');
	if (parts.length !== 3) return null;

	const surahId = parseInt(parts[0], 10);
	const ayahNum = parseInt(parts[1], 10);
	const wordIndex = parseInt(parts[2], 10);

	const ayahs = await getSurahAyahsAsync(surahId);
	if (!ayahs) return null;

	const ayah = ayahs.find(a => a.id === ayahNum);
	if (!ayah) return null;

	const word = ayah.words[wordIndex - 1] as QuranWordWithTranslation | undefined;
	if (!word) return null;

	return {
		gloss: word.translation || '',
		lemma: word.text, // Using surface form as lemma for now
		transliteration: word.transliteration || ''
	};
}

/**
 * Get word gloss from cache (sync)
 * Returns common vocabulary translation if available (for side panel),
 * otherwise falls back to WBW translation
 */
export function getWordGlossCached(wordId: string): {
	gloss: string;
	lemma: string;
	transliteration: string;
	isCommonWord?: boolean;
	verbInfo?: VerbInfo;
} | null {
	const parts = wordId.split(':');
	if (parts.length !== 3) return null;

	const surahId = parseInt(parts[0], 10);
	const ayahNum = parseInt(parts[1], 10);
	const wordIndex = parseInt(parts[2], 10);

	const ayahs = surahCache.get(surahId);
	if (!ayahs) return null;

	const ayah = ayahs.find(a => a.id === ayahNum);
	if (!ayah) return null;

	const word = ayah.words[wordIndex - 1] as QuranWordWithTranslation | undefined;
	if (!word) return null;

	// Prefer common vocabulary translation for the side panel
	const gloss = word.commonTranslation || word.translation || '';

	return {
		gloss,
		lemma: word.text,
		transliteration: word.transliteration || '',
		isCommonWord: word.isCommonWord,
		verbInfo: word.verbInfo
	};
}

/**
 * Get word with full translation data
 */
export function getWordWithTranslation(
	surahId: number,
	ayahNum: number,
	wordIndex: number
): QuranWordWithTranslation | null {
	const ayahs = surahCache.get(surahId);
	if (!ayahs) return null;

	const ayah = ayahs.find(a => a.id === ayahNum);
	if (!ayah) return null;

	return (ayah.words[wordIndex - 1] as QuranWordWithTranslation) ?? null;
}

/**
 * Check if a surah is loaded
 */
export function isSurahLoaded(surahId: number): boolean {
	return surahCache.has(surahId);
}

/**
 * Clear cache (useful for memory management)
 */
export function clearCache(): void {
	surahCache.clear();
}

/**
 * Get cache stats
 */
export function getCacheStats(): { loaded: number; total: number } {
	return {
		loaded: surahCache.size,
		total: 114
	};
}
