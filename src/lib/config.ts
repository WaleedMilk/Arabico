/**
 * @fileoverview Centralized application configuration
 *
 * AI Development Guide:
 * - All magic numbers and external URLs should be defined here
 * - Environment variables are loaded with fallbacks for development
 * - Use config.storageKeys for localStorage key consistency
 * - SRS algorithm parameters are tuned for Quranic Arabic learning
 */

// Environment-based configuration
const isDev = import.meta.env.DEV;

export const config = {
	// ===========================================
	// External Services
	// ===========================================
	supabase: {
		url: import.meta.env.VITE_SUPABASE_URL || 'https://xhizanisqxprrwifjpbm.supabase.co',
		anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhoaXphbmlzcXhwcnJ3aWZqcGJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzMjE1NzIsImV4cCI6MjA2NDg5NzU3Mn0.wrHsZ4MHGzhmuRvjaG7hDFERdV_i_q-dRFiRn9SWsEI'
	},

	// ===========================================
	// Audio Configuration
	// ===========================================
	audio: {
		/** Base URL for word-by-word audio files */
		wordBaseUrl: 'https://quranwbw.github.io/audio-words-new',

		/** Generate URL for a specific word's audio */
		getWordUrl: (surah: number, ayah: number, wordIndex: number): string =>
			`https://quranwbw.github.io/audio-words-new/${surah}/${ayah}/${wordIndex}.mp3`,

		/** Number of adjacent words to preload */
		preloadCount: 2,

		/** Default playback speed */
		defaultSpeed: 1.0,

		/** Available playback speeds */
		speeds: [0.75, 1.0, 1.25] as const
	},

	// ===========================================
	// SRS Algorithm Parameters
	// Based on SM-2 with Quranic Arabic enhancements
	// ===========================================
	srs: {
		easeFactor: {
			/** Minimum ease factor (hardest words) */
			min: 1.3,
			/** Maximum ease factor (easiest words) */
			max: 2.5,
			/** Starting ease factor for new words */
			default: 2.5,
			/** Penalty subtracted on failure */
			failurePenalty: 0.2
		},
		intervals: {
			/** Days until first review after learning */
			firstSuccess: 1,
			/** Days until second review */
			secondSuccess: 6,
			/** Maximum interval cap */
			maxDays: 365
		},
		promotion: {
			/** Minimum consecutive correct answers to promote to "known" */
			minConsecutiveCorrect: 5,
			/** Minimum ease factor to promote */
			minEaseFactor: 2.0,
			/** Minimum interval (days) to promote */
			minInterval: 21
		},
		/** Maximum bonus for knowing words with same root */
		rootFamilyBonusMax: 0.5,
		/** Quality ratings that count as "correct" (3+) */
		correctThreshold: 3
	},

	// ===========================================
	// Review Session Settings
	// ===========================================
	review: {
		/** Default maximum words per session */
		defaultMaxWords: 15,
		/** Quality rating scale */
		qualityScale: { min: 0, max: 5 },
		/** Percentage of new words vs review words */
		newWordsRatio: 0.3
	},

	// ===========================================
	// Quran Data
	// ===========================================
	quran: {
		/** Total number of surahs */
		totalSurahs: 114,
		/** Data files location */
		dataPath: '/data/surahs'
	},

	// ===========================================
	// UI Constants
	// ===========================================
	ui: {
		/** Breakpoint for tablet/desktop (px) */
		mobileBreakpoint: 768,
		/** Breakpoint for small phones (px) */
		smallPhoneBreakpoint: 400,
		/** Minimum touch target size (px) */
		touchTargetMin: 44,
		/** Bottom navigation height (px) */
		bottomNavHeight: 60,
		/** Debounce delay for search (ms) */
		searchDebounce: 300,
		/** Animation duration for transitions (ms) */
		animationDuration: 300
	},

	// ===========================================
	// Local Storage Keys
	// Centralized for consistency across stores
	// ===========================================
	storageKeys: {
		theme: 'arabico-theme',
		lastSurah: 'arabico-last-surah',
		directionRatio: 'arabico-direction-ratio',
		fontSize: 'arabico-font-size',
		userId: 'arabico-user-id',
		syncTimestamp: 'arabico-sync-timestamp'
	},

	// ===========================================
	// Development Settings
	// ===========================================
	dev: {
		/** Enable debug logging */
		debug: isDev,
		/** Enable performance monitoring */
		performanceMonitoring: isDev,
		/** Mock API responses */
		mockApi: false
	}
} as const;

// Type for the config (useful for AI to understand structure)
export type AppConfig = typeof config;

// Type-safe getter for storage keys
export type StorageKey = keyof typeof config.storageKeys;

/**
 * Helper to get a storage key value
 * @param key - The storage key name
 * @returns The localStorage key string
 */
export function getStorageKey(key: StorageKey): string {
	return config.storageKeys[key];
}
