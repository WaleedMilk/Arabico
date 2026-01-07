/**
 * Quran Data Loader
 *
 * Loads word-by-word Quran data from bundled JSON files.
 * Uses lazy loading - only fetches surah data when needed.
 * Data sourced from QuranWBW (qazasaz/quranwbw).
 */

import type {
	Ayah,
	QuranWord,
	QuranWBWSurah,
	QuranWBWAyah,
	QuranWordWithTranslation
} from '$lib/types';

// Cache for loaded surahs
const surahCache = new Map<number, Ayah[]>();
const loadingPromises = new Map<number, Promise<Ayah[] | null>>();

/**
 * Transform QuranWBW data format to our Ayah format
 */
function transformSurahData(surahId: number, data: QuranWBWSurah): Ayah[] {
	const ayahs: Ayah[] = [];

	// QuranWBW uses string keys for ayah numbers
	const ayahNumbers = Object.keys(data)
		.filter(key => !isNaN(Number(key)))
		.map(Number)
		.sort((a, b) => a - b);

	for (const ayahNum of ayahNumbers) {
		const ayahData: QuranWBWAyah = data[String(ayahNum)];
		if (!ayahData || !ayahData.w) continue;

		const words: QuranWordWithTranslation[] = ayahData.w.map((word, index) => ({
			id: `${surahId}:${ayahNum}:${index + 1}`,
			text: word.c,
			transliteration: word.d,
			translation: word.e,
			audioStart: word.b,
			audioDuration: word.h
		}));

		// Combine all word texts for full ayah text
		const fullText = words.map(w => w.text).join(' ');

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
			const response = await fetch(`/data/surahs/${surahId}.json`);
			if (!response.ok) {
				console.error(`Failed to load surah ${surahId}: ${response.status}`);
				return null;
			}

			const data: QuranWBWSurah = await response.json();
			const ayahs = transformSurahData(surahId, data);

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
 */
export function getWordGlossCached(wordId: string): { gloss: string; lemma: string; transliteration: string } | null {
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

	return {
		gloss: word.translation || '',
		lemma: word.text,
		transliteration: word.transliteration || ''
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
