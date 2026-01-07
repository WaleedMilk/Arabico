import { browser } from '$app/environment';
import type { ThemeMode } from '$lib/types';

// Theme state with Svelte 5 runes
function createThemeStore() {
	let mode = $state<ThemeMode>('system');
	let resolvedTheme = $state<'light' | 'dark'>('light');

	// Initialize from localStorage if in browser
	if (browser) {
		const stored = localStorage.getItem('theme') as ThemeMode | null;
		if (stored && ['light', 'dark', 'system'].includes(stored)) {
			mode = stored;
		}
		updateResolvedTheme();
	}

	function updateResolvedTheme() {
		if (!browser) return;

		if (mode === 'system') {
			resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
		} else {
			resolvedTheme = mode;
		}

		// Apply to document
		if (resolvedTheme === 'dark') {
			document.documentElement.classList.add('dark');
		} else {
			document.documentElement.classList.remove('dark');
		}
	}

	// Listen for system theme changes
	if (browser) {
		window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
			if (mode === 'system') {
				updateResolvedTheme();
			}
		});
	}

	return {
		get mode() {
			return mode;
		},
		get resolved() {
			return resolvedTheme;
		},
		set(newMode: ThemeMode) {
			mode = newMode;
			if (browser) {
				localStorage.setItem('theme', newMode);
			}
			updateResolvedTheme();
		},
		toggle() {
			const newMode = resolvedTheme === 'light' ? 'dark' : 'light';
			this.set(newMode);
		}
	};
}

export const theme = createThemeStore();

// Font size state
function createFontSizeStore() {
	let size = $state<'small' | 'medium' | 'large'>('medium');

	if (browser) {
		const stored = localStorage.getItem('fontSize') as 'small' | 'medium' | 'large' | null;
		if (stored && ['small', 'medium', 'large'].includes(stored)) {
			size = stored;
		}
	}

	return {
		get value() {
			return size;
		},
		set(newSize: 'small' | 'medium' | 'large') {
			size = newSize;
			if (browser) {
				localStorage.setItem('fontSize', newSize);
			}
		}
	};
}

export const fontSize = createFontSizeStore();
