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
import { getSurahById } from '$lib/data/surahs';
import { getSurahAyahsAsync } from '$lib/data/quran-data';
import { calculateDifficultyScore } from './srs-algorithm';

export interface ReviewQueueOptions {
	mode: ReviewMode;
	maxWords: number;
	surahFilter?: number; // Only include words from specific surah
	includeNewWords?: boolean; // Include "seen" words that haven't been reviewed
	practiceMode?: boolean; // If true, includes non-due words for extra practice
}

/**
 * Build a prioritized review queue based on options
 */
export async function buildReviewQueue(options: ReviewQueueOptions): Promise<VocabularyEntry[]> {
	const { mode, maxWords, surahFilter, includeNewWords = true, practiceMode = false } = options;

	const now = new Date();
	const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

	// Get all words in learning/seen/known state based on mode
	const learningWords = await vocabularyDB.getByFamiliarity('learning');
	const seenWords = includeNewWords ? await vocabularyDB.getByFamiliarity('seen') : [];

	// For practice mode, also include known words (for extra review)
	const knownWords = practiceMode ? await vocabularyDB.getByFamiliarity('known') : [];

	// Combine and filter
	let candidates = [...learningWords, ...seenWords, ...knownWords];

	// Apply surah filter if specified
	if (surahFilter) {
		candidates = candidates.filter(
			(w) =>
				w.firstSeen?.surah === surahFilter ||
				w.encounterLocations?.some((loc) => loc.surah === surahFilter)
		);
	}

	let wordsToReview: VocabularyEntry[];

	if (practiceMode) {
		// Practice mode: exclude recently reviewed words, include non-due words
		wordsToReview = candidates.filter((w) => {
			// Skip words reviewed in the last hour
			if (w.lastReviewed) {
				const lastReview = new Date(w.lastReviewed);
				if (lastReview > oneHourAgo) return false;
			}

			// Skip completely new words (they should be introduced via normal reviews)
			if ((w.reviewCount ?? 0) === 0) return false;

			return true;
		});
	} else {
		// Normal mode: filter to due words (nextReviewDate <= now or not set)
		wordsToReview = candidates.filter((w) => {
			if (!w.nextReviewDate) return true; // Never reviewed
			return new Date(w.nextReviewDate) <= now;
		});
	}

	// Sort by priority
	const sortedWords = sortByPriority(wordsToReview, mode, practiceMode);

	return sortedWords.slice(0, maxWords);
}

/**
 * Sort words by priority based on review mode
 */
function sortByPriority(
	words: VocabularyEntry[],
	mode: ReviewMode,
	practiceMode: boolean = false
): VocabularyEntry[] {
	const now = Date.now();

	return words.sort((a, b) => {
		if (practiceMode) {
			// In practice mode, prioritize by:
			// 1. Difficulty (harder words first)
			// 2. Time since last review (longest first)
			const aDifficulty = a.difficultyScore ?? calculateDifficultyScore(a);
			const bDifficulty = b.difficultyScore ?? calculateDifficultyScore(b);

			const aLastReview = a.lastReviewed ? new Date(a.lastReviewed).getTime() : 0;
			const bLastReview = b.lastReviewed ? new Date(b.lastReviewed).getTime() : 0;

			// Calculate time since last review (longer = higher priority)
			const aTimeSince = now - aLastReview;
			const bTimeSince = now - bLastReview;

			// Combine difficulty and time since last review
			const aPriority = aDifficulty * 0.5 + (aTimeSince / (1000 * 60 * 60 * 24)) * 0.5;
			const bPriority = bDifficulty * 0.5 + (bTimeSince / (1000 * 60 * 60 * 24)) * 0.5;

			return bPriority - aPriority;
		}

		// Normal mode: prioritize by overdue time and difficulty
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
	const primaryContextResult = await getWordOccurrence(entry.firstSeen);

	// Create fallback context if no data available
	const primaryContext: WordOccurrence = primaryContextResult ?? {
		location: entry.firstSeen,
		surahName: `Surah ${entry.firstSeen.surah}`,
		ayahText: entry.surfaceForm, // Show just the word if no ayah text
		translation: undefined
	};

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

		const ayahs = await getSurahAyahsAsync(location.surah);
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
