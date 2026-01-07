/**
 * Word Audio Manager for Arabico
 *
 * Provides word-level audio playback with:
 * - Caching for instant replay
 * - Preloading adjacent words
 * - Playback speed control
 * - Audio state management
 */

const AUDIO_BASE_URL = 'https://quranwbw.github.io/audio-words-new';

// Cache for preloaded audio elements
const audioCache = new Map<string, HTMLAudioElement>();

// Currently playing audio (for stopping previous playback)
let currentAudio: HTMLAudioElement | null = null;

// Default playback speed
let playbackSpeed = 1;

/**
 * Generate audio URL for a word
 */
export function getWordAudioUrl(surah: number, ayah: number, wordIndex: number): string {
	return `${AUDIO_BASE_URL}/${surah}/${ayah}/${wordIndex}.mp3`;
}

/**
 * Get cache key for a word
 */
function getCacheKey(surah: number, ayah: number, wordIndex: number): string {
	return `${surah}:${ayah}:${wordIndex}`;
}

/**
 * Preload a word's audio into cache
 */
export function preloadWordAudio(surah: number, ayah: number, wordIndex: number): void {
	const key = getCacheKey(surah, ayah, wordIndex);

	// Skip if already cached
	if (audioCache.has(key)) return;

	const url = getWordAudioUrl(surah, ayah, wordIndex);
	const audio = new Audio();
	audio.preload = 'auto';
	audio.src = url;

	// Store in cache once loaded
	audio.addEventListener('canplaythrough', () => {
		audioCache.set(key, audio);
	}, { once: true });

	// Handle errors gracefully
	audio.addEventListener('error', () => {
		// Don't cache failed audio
		console.warn(`Failed to preload audio: ${url}`);
	}, { once: true });
}

/**
 * Preload adjacent words for smooth playback
 */
export function preloadAdjacentWords(
	surah: number,
	ayah: number,
	currentWordIndex: number,
	totalWordsInAyah: number
): void {
	// Preload next 2 words
	for (let i = 1; i <= 2; i++) {
		const nextIndex = currentWordIndex + i;
		if (nextIndex <= totalWordsInAyah) {
			preloadWordAudio(surah, ayah, nextIndex);
		}
	}

	// Also preload previous word for quick replay
	if (currentWordIndex > 1) {
		preloadWordAudio(surah, ayah, currentWordIndex - 1);
	}
}

/**
 * Play word audio with caching
 */
export async function playWordAudio(
	surah: number,
	ayah: number,
	wordIndex: number,
	speed?: number
): Promise<void> {
	const key = getCacheKey(surah, ayah, wordIndex);
	const url = getWordAudioUrl(surah, ayah, wordIndex);

	// Stop any currently playing audio
	stopCurrentAudio();

	// Check cache first
	let audio = audioCache.get(key);

	if (!audio) {
		// Create new audio element
		audio = new Audio(url);
		audioCache.set(key, audio);
	}

	// Reset and configure
	audio.currentTime = 0;
	audio.playbackRate = speed ?? playbackSpeed;

	// Set as current audio
	currentAudio = audio;

	// Play
	try {
		await audio.play();
	} catch (error) {
		// Handle autoplay restrictions gracefully
		console.warn('Audio playback failed:', error);
		throw error;
	}
}

/**
 * Stop currently playing audio
 */
export function stopCurrentAudio(): void {
	if (currentAudio) {
		currentAudio.pause();
		currentAudio.currentTime = 0;
		currentAudio = null;
	}
}

/**
 * Set global playback speed
 */
export function setPlaybackSpeed(speed: number): void {
	playbackSpeed = Math.max(0.5, Math.min(2, speed));

	// Update currently playing audio if any
	if (currentAudio) {
		currentAudio.playbackRate = playbackSpeed;
	}
}

/**
 * Get current playback speed
 */
export function getPlaybackSpeed(): number {
	return playbackSpeed;
}

/**
 * Cycle through common playback speeds
 */
export function cyclePlaybackSpeed(): number {
	const speeds = [0.75, 1, 1.25, 1.5];
	const currentIndex = speeds.indexOf(playbackSpeed);
	const nextIndex = (currentIndex + 1) % speeds.length;
	playbackSpeed = speeds[nextIndex];
	return playbackSpeed;
}

/**
 * Check if audio is currently playing
 */
export function isPlaying(): boolean {
	return currentAudio !== null && !currentAudio.paused;
}

/**
 * Get audio state for a word
 */
export function getAudioState(surah: number, ayah: number, wordIndex: number): {
	isCached: boolean;
	isPlaying: boolean;
} {
	const key = getCacheKey(surah, ayah, wordIndex);
	const cached = audioCache.get(key);

	return {
		isCached: audioCache.has(key),
		isPlaying: cached !== undefined && currentAudio === cached && !cached.paused
	};
}

/**
 * Clear audio cache (for memory management)
 */
export function clearAudioCache(): void {
	stopCurrentAudio();
	audioCache.clear();
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { size: number; keys: string[] } {
	return {
		size: audioCache.size,
		keys: Array.from(audioCache.keys())
	};
}

/**
 * Create audio state store for reactive updates
 * Returns an object that can be used with Svelte's reactivity
 */
export function createAudioStore() {
	let isCurrentlyPlaying = $state(false);
	let currentWordKey = $state<string | null>(null);
	let speed = $state(1);

	return {
		get isPlaying() { return isCurrentlyPlaying; },
		get currentWord() { return currentWordKey; },
		get speed() { return speed; },

		async play(surah: number, ayah: number, wordIndex: number) {
			const key = getCacheKey(surah, ayah, wordIndex);
			currentWordKey = key;
			isCurrentlyPlaying = true;

			try {
				await playWordAudio(surah, ayah, wordIndex, speed);

				// Listen for end
				if (currentAudio) {
					currentAudio.onended = () => {
						isCurrentlyPlaying = false;
						currentWordKey = null;
					};
				}
			} catch {
				isCurrentlyPlaying = false;
				currentWordKey = null;
			}
		},

		stop() {
			stopCurrentAudio();
			isCurrentlyPlaying = false;
			currentWordKey = null;
		},

		setSpeed(newSpeed: number) {
			speed = newSpeed;
			setPlaybackSpeed(newSpeed);
		},

		cycleSpeed() {
			speed = cyclePlaybackSpeed();
			return speed;
		}
	};
}
