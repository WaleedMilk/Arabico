/**
 * Review Queue Builder for Arabico
 *
 * Builds prioritized review queues based on:
 * - Overdue time (most overdue first)
 * - Difficulty score (harder words more frequently)
 * - Review mode (contextual, quick, etc.)
 * - Optional surah filtering for "reading reinforcement"
 */

import { vocabularyDB } from '$lib/db';
import type { VocabularyEntry, ReviewMode, ReviewCardData, WordOccurrence } from '$lib/types';
import { getSurahById, getSurahAyahs } from '$lib/data/surahs';
import { calculateDifficultyScore } from './srs-algorithm';

export interface ReviewQueueOptions {
	mode: ReviewMode;
	maxWords: number;
	surahFilter?: number; // Only include words from specific surah
	includeNewWords?: boolean; // Include "seen" words that haven't been reviewed
}

/**
 * Build a prioritized review queue based on options
 */
export async function buildReviewQueue(options: ReviewQueueOptions): Promise<VocabularyEntry[]> {
	const { mode, maxWords, surahFilter, includeNewWords = true } = options;

	const now = new Date();

	// Get all words in learning/seen state
	const learningWords = await vocabularyDB.getByFamiliarity('learning');
	const seenWords = includeNewWords ? await vocabularyDB.getByFamiliarity('seen') : [];

	// Combine and filter
	let candidates = [...learningWords, ...seenWords];

	// Apply surah filter if specified
	if (surahFilter) {
		candidates = candidates.filter(
			(w) =>
				w.firstSeen?.surah === surahFilter ||
				w.encounterLocations?.some((loc) => loc.surah === surahFilter)
		);
	}

	// Filter to due words (nextReviewDate <= now or not set)
	const dueWords = candidates.filter((w) => {
		if (!w.nextReviewDate) return true; // Never reviewed
		return new Date(w.nextReviewDate) <= now;
	});

	// Sort by priority
	const sortedWords = sortByPriority(dueWords, mode);

	return sortedWords.slice(0, maxWords);
}

/**
 * Sort words by priority based on review mode
 */
function sortByPriority(words: VocabularyEntry[], mode: ReviewMode): VocabularyEntry[] {
	const now = Date.now();

	return words.sort((a, b) => {
		// Calculate overdue time (higher = more overdue)
		const aOverdue = a.nextReviewDate ? now - new Date(a.nextReviewDate).getTime() : now;
		const bOverdue = b.nextReviewDate ? now - new Date(b.nextReviewDate).getTime() : now;

		// Calculate difficulty score
		const aDifficulty = a.difficultyScore ?? calculateDifficultyScore(a);
		const bDifficulty = b.difficultyScore ?? calculateDifficultyScore(b);

		// Priority formula: overdue time + (difficulty * weight)
		// Difficulty weight varies by mode
		const difficultyWeight = mode === 'quick' ? 500000 : 1000000;

		const aPriority = aOverdue + aDifficulty * difficultyWeight;
		const bPriority = bOverdue + bDifficulty * difficultyWeight;

		return bPriority - aPriority; // Descending (highest priority first)
	});
}

/**
 * Build enriched review card data with contextual information
 * This is the core feature - showing words in their Quranic context
 */
export async function buildReviewCardData(entry: VocabularyEntry): Promise<ReviewCardData> {
	// Get primary context (first seen location)
	const primaryContext = await getWordOccurrence(entry.firstSeen);

	// Get additional contexts from encounter locations
	const additionalLocations = (entry.encounterLocations || [])
		.filter(
			(loc) =>
				loc.surah !== entry.firstSeen.surah ||
				loc.ayah !== entry.firstSeen.ayah ||
				loc.wordIndex !== entry.firstSeen.wordIndex
		)
		.slice(0, 3); // Max 3 additional contexts

	const additionalContexts = await Promise.all(additionalLocations.map(getWordOccurrence));

	return {
		entry,
		primaryContext,
		additionalContexts: additionalContexts.filter((c): c is WordOccurrence => c !== null)
	};
}

/**
 * Get word occurrence data for a specific Quran location
 */
async function getWordOccurrence(location: VocabularyEntry['firstSeen']): Promise<WordOccurrence | null> {
	if (!location) return null;

	try {
		const surah = getSurahById(location.surah);
		if (!surah) return null;

		const ayahs = getSurahAyahs(location.surah);
		const ayah = ayahs?.find((a) => a.id === location.ayah);

		if (!ayah) {
			// Return basic info even without ayah data
			return {
				location,
				surahName: surah.englishName,
				ayahText: '',
				translation: undefined
			};
		}

		return {
			location,
			surahName: surah.englishName,
			ayahText: ayah.text,
			translation: ayah.translation
		};
	} catch {
		return null;
	}
}

/**
 * Get count of words due for review
 */
export async function getDueWordCount(surahFilter?: number): Promise<number> {
	const now = new Date();

	const learningWords = await vocabularyDB.getByFamiliarity('learning');
	const seenWords = await vocabularyDB.getByFamiliarity('seen');

	let candidates = [...learningWords, ...seenWords];

	if (surahFilter) {
		candidates = candidates.filter(
			(w) =>
				w.firstSeen?.surah === surahFilter ||
				w.encounterLocations?.some((loc) => loc.surah === surahFilter)
		);
	}

	return candidates.filter((w) => {
		if (!w.nextReviewDate) return true;
		return new Date(w.nextReviewDate) <= now;
	}).length;
}

/**
 * Get words due in a specific surah (for reading reinforcement badge)
 */
export async function getDueWordsInSurah(surahId: number): Promise<VocabularyEntry[]> {
	const queue = await buildReviewQueue({
		mode: 'contextual',
		maxWords: 100,
		surahFilter: surahId
	});
	return queue;
}

/**
 * Get review queue statistics
 */
export async function getQueueStats(): Promise<{
	totalDue: number;
	learningCount: number;
	seenCount: number;
	overdueCount: number;
}> {
	const now = new Date();

	const learningWords = await vocabularyDB.getByFamiliarity('learning');
	const seenWords = await vocabularyDB.getByFamiliarity('seen');

	const allCandidates = [...learningWords, ...seenWords];

	const overdueCount = allCandidates.filter((w) => {
		if (!w.nextReviewDate) return false;
		const dueDate = new Date(w.nextReviewDate);
		const daysDiff = (now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24);
		return daysDiff > 1; // More than 1 day overdue
	}).length;

	const totalDue = allCandidates.filter((w) => {
		if (!w.nextReviewDate) return true;
		return new Date(w.nextReviewDate) <= now;
	}).length;

	return {
		totalDue,
		learningCount: learningWords.length,
		seenCount: seenWords.length,
		overdueCount
	};
}
