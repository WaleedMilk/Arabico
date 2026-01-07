/**
 * @fileoverview Runtime type guards and validation functions
 *
 * AI Development Guide:
 * - Use these guards when validating external data (API responses, localStorage)
 * - Use these guards in catch blocks when type is unknown
 * - Add new guards when adding new types that need runtime validation
 */

import type {
	ReviewQuality,
	FamiliarityLevel,
	QuranLocation,
	ReviewMode,
	VocabularyEntry
} from './index';

// ============================================
// Primitive Guards
// ============================================

/**
 * Check if value is a non-null object
 */
export function isObject(val: unknown): val is Record<string, unknown> {
	return typeof val === 'object' && val !== null;
}

/**
 * Check if value is a non-empty string
 */
export function isNonEmptyString(val: unknown): val is string {
	return typeof val === 'string' && val.length > 0;
}

/**
 * Check if value is a positive integer
 */
export function isPositiveInteger(val: unknown): val is number {
	return typeof val === 'number' && Number.isInteger(val) && val > 0;
}

/**
 * Check if value is a non-negative integer
 */
export function isNonNegativeInteger(val: unknown): val is number {
	return typeof val === 'number' && Number.isInteger(val) && val >= 0;
}

// ============================================
// Domain-Specific Guards
// ============================================

/**
 * Validate review quality rating (0-5 scale)
 *
 * @example
 * const quality = getUserInput();
 * if (isValidReviewQuality(quality)) {
 *   calculateNextReview(entry, quality);
 * }
 */
export function isValidReviewQuality(val: unknown): val is ReviewQuality {
	return (
		typeof val === 'number' &&
		Number.isInteger(val) &&
		val >= 0 &&
		val <= 5
	);
}

/**
 * Valid familiarity levels
 */
const FAMILIARITY_LEVELS = ['new', 'seen', 'learning', 'known', 'ignored'] as const;

/**
 * Validate familiarity level
 *
 * @example
 * const level = localStorage.getItem('familiarity');
 * if (isValidFamiliarity(level)) {
 *   entry.familiarity = level;
 * }
 */
export function isValidFamiliarity(val: unknown): val is FamiliarityLevel {
	return typeof val === 'string' && FAMILIARITY_LEVELS.includes(val as FamiliarityLevel);
}

/**
 * Valid review modes
 */
const REVIEW_MODES = ['contextual', 'quick', 'recognition', 'recall'] as const;

/**
 * Validate review mode
 */
export function isValidReviewMode(val: unknown): val is ReviewMode {
	return typeof val === 'string' && REVIEW_MODES.includes(val as ReviewMode);
}

/**
 * Validate Quran location (surah, ayah, wordIndex)
 *
 * @example
 * const location = parseLocationFromUrl();
 * if (isValidQuranLocation(location)) {
 *   navigateToWord(location);
 * }
 */
export function isValidQuranLocation(val: unknown): val is QuranLocation {
	if (!isObject(val)) return false;

	const { surah, ayah, wordIndex } = val as Record<string, unknown>;

	return (
		typeof surah === 'number' &&
		Number.isInteger(surah) &&
		surah >= 1 &&
		surah <= 114 &&
		typeof ayah === 'number' &&
		Number.isInteger(ayah) &&
		ayah >= 1 &&
		typeof wordIndex === 'number' &&
		Number.isInteger(wordIndex) &&
		wordIndex >= 0
	);
}

/**
 * Validate surah number (1-114)
 */
export function isValidSurahNumber(val: unknown): val is number {
	return (
		typeof val === 'number' &&
		Number.isInteger(val) &&
		val >= 1 &&
		val <= 114
	);
}

/**
 * Validate ease factor (1.3 - 2.5)
 */
export function isValidEaseFactor(val: unknown): val is number {
	return typeof val === 'number' && val >= 1.3 && val <= 2.5;
}

/**
 * Validate interval (1 - 365 days)
 */
export function isValidInterval(val: unknown): val is number {
	return (
		typeof val === 'number' &&
		Number.isInteger(val) &&
		val >= 1 &&
		val <= 365
	);
}

/**
 * Basic validation for vocabulary entry structure
 * (Checks required fields exist, not full validation)
 */
export function isValidVocabularyEntry(val: unknown): val is VocabularyEntry {
	if (!isObject(val)) return false;

	const entry = val as Record<string, unknown>;

	return (
		isNonEmptyString(entry.wordId) &&
		isNonEmptyString(entry.surfaceForm) &&
		(entry.familiarity === undefined || isValidFamiliarity(entry.familiarity))
	);
}

// ============================================
// Date Guards
// ============================================

/**
 * Check if value is a valid Date object
 */
export function isValidDate(val: unknown): val is Date {
	return val instanceof Date && !isNaN(val.getTime());
}

/**
 * Check if value is a valid ISO date string
 */
export function isValidISODateString(val: unknown): val is string {
	if (typeof val !== 'string') return false;
	const date = new Date(val);
	return !isNaN(date.getTime());
}

/**
 * Parse a date from various formats (Date, string, number)
 * Returns null if invalid
 */
export function parseDate(val: unknown): Date | null {
	if (val instanceof Date) {
		return isNaN(val.getTime()) ? null : val;
	}
	if (typeof val === 'string' || typeof val === 'number') {
		const date = new Date(val);
		return isNaN(date.getTime()) ? null : date;
	}
	return null;
}

// ============================================
// Utility Functions
// ============================================

/**
 * TypeScript utility for exhaustive switch statements
 *
 * @example
 * function handleMode(mode: ReviewMode) {
 *   switch (mode) {
 *     case 'contextual': return 'Contextual';
 *     case 'quick': return 'Quick';
 *     case 'recognition': return 'Recognition';
 *     case 'recall': return 'Recall';
 *     default: return assertNever(mode);
 *   }
 * }
 */
export function assertNever(x: never): never {
	throw new Error(`Unexpected value: ${JSON.stringify(x)}`);
}

/**
 * Safely parse JSON with type guard
 *
 * @example
 * const data = safeParseJSON(localStorage.getItem('settings'), isValidSettings);
 * if (data) {
 *   applySettings(data);
 * }
 */
export function safeParseJSON<T>(
	json: string | null,
	guard: (val: unknown) => val is T
): T | null {
	if (!json) return null;
	try {
		const parsed = JSON.parse(json);
		return guard(parsed) ? parsed : null;
	} catch {
		return null;
	}
}

/**
 * Narrow an error to Error type
 *
 * @example
 * try {
 *   await riskyOperation();
 * } catch (e) {
 *   const error = toError(e);
 *   console.error(error.message);
 * }
 */
export function toError(e: unknown): Error {
	if (e instanceof Error) return e;
	if (typeof e === 'string') return new Error(e);
	return new Error(String(e));
}
