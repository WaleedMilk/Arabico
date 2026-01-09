<script lang="ts">
	import { page } from '$app/state';
	import { getSurahById } from '$lib/data/surahs';
	import {
		getSurahAyahsAsync,
		getWordGlossCached,
		preloadAdjacentSurahs
	} from '$lib/data/quran-data';
	import SurahHeader from '$lib/components/reader/SurahHeader.svelte';
	import AyahDisplay from '$lib/components/reader/AyahDisplay.svelte';
	import WordDetailPanel from '$lib/components/reader/WordDetailPanel.svelte';
	import ThreeBackground from '$lib/components/three/ThreeBackground.svelte';
	import type { QuranWord, Ayah } from '$lib/types';

	// Get surah ID from URL (handle invalid IDs)
	function parseSurahId(id: string | undefined): number {
		if (!id) return 0;
		const parsed = parseInt(id, 10);
		return isNaN(parsed) ? 0 : parsed;
	}

	let surahId = $derived(parseSurahId(page.params.id));
	let surah = $derived(getSurahById(surahId));

	// Async loading state
	let ayahs = $state<Ayah[] | null>(null);
	let isLoading = $state(true);

	// Show all meanings toggle
	let showAllMeanings = $state(false);

	// Load ayahs when surah changes
	$effect(() => {
		if (surahId > 0) {
			isLoading = true;
			ayahs = null;
			getSurahAyahsAsync(surahId).then((data) => {
				ayahs = data;
				isLoading = false;
				// Preload adjacent surahs for smooth navigation
				preloadAdjacentSurahs(surahId);
			});
		}
	});

	// Selected word state
	let selectedWord = $state<QuranWord | null>(null);
	let selectedWordGloss = $derived(selectedWord ? getWordGlossCached(selectedWord.id) : null);
	let isPanelOpen = $derived(!!selectedWord);

	// Parse word location from ID
	function parseWordLocation(wordId: string): { surah: number; ayah: number; word: number } | null {
		const parts = wordId.split(':');
		if (parts.length !== 3) return null;
		return {
			surah: parseInt(parts[0], 10),
			ayah: parseInt(parts[1], 10),
			word: parseInt(parts[2], 10)
		};
	}

	function handleWordSelect(word: QuranWord) {
		// Use View Transitions API if available
		if ('startViewTransition' in document) {
			(document as any).startViewTransition(() => {
				selectedWord = word;
			});
		} else {
			selectedWord = word;
		}
	}

	function closePanel() {
		if ('startViewTransition' in document) {
			(document as any).startViewTransition(() => {
				selectedWord = null;
			});
		} else {
			selectedWord = null;
		}
	}

	function toggleAllMeanings() {
		showAllMeanings = !showAllMeanings;
	}
</script>

<svelte:head>
	<title>{surah ? `${surah.englishName} - Arabico` : 'Surah Not Found'}</title>
</svelte:head>

{#if surah}
	<!-- Decorative particle background throughout -->
	<ThreeBackground position="center" size="full" intensity={0.4} class="reader-particles" />

	<!-- Main layout with panel -->
	<div class="reader-layout" class:panel-open={isPanelOpen}>
		<!-- Word Detail Panel (slides from left) -->
		<WordDetailPanel
			word={selectedWord}
			gloss={selectedWordGloss?.gloss}
			lemma={selectedWordGloss?.lemma}
			transliteration={selectedWordGloss?.transliteration}
			surahId={surahId}
			ayahNum={selectedWord ? parseWordLocation(selectedWord.id)?.ayah : undefined}
			wordIndex={selectedWord ? parseWordLocation(selectedWord.id)?.word : undefined}
			isCommonWord={selectedWordGloss?.isCommonWord}
			verbInfo={selectedWordGloss?.verbInfo}
			onClose={closePanel}
		/>

		<!-- Reader content -->
		<div class="reader-content">
			<div class="surah-reader">
				<!-- Surah Header -->
				<SurahHeader {surah} showBismillah={surah.id !== 1} />

				<!-- Toggle meanings button -->
				<div class="meanings-toggle-container">
					<button
						onclick={toggleAllMeanings}
						class="meanings-toggle liquid-glass-btn"
					>
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
							{#if showAllMeanings}
								<path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
							{:else}
								<path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
								<path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
							{/if}
						</svg>
						<span>{showAllMeanings ? 'Hide' : 'Show'} Meanings</span>
					</button>
				</div>

				<!-- Ayahs -->
				{#if isLoading}
					<!-- Loading skeleton -->
					<div class="space-y-4 animate-pulse">
						{#each Array(7) as _}
							<div class="rounded-lg bg-[var(--bg-secondary)] p-6">
								<div class="h-8 bg-[var(--border-color)] rounded w-3/4 mx-auto mb-3"></div>
								<div class="h-4 bg-[var(--border-color)] rounded w-1/2 mx-auto"></div>
							</div>
						{/each}
					</div>
				{:else if ayahs && ayahs.length > 0}
					<div class="space-y-2">
						{#each ayahs as ayah}
							<AyahDisplay
								{ayah}
								{surahId}
								{showAllMeanings}
								onWordSelect={handleWordSelect}
							/>
						{/each}
					</div>
				{:else}
					<!-- Error state -->
					<div class="rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] p-8 text-center">
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="mx-auto h-12 w-12 text-[var(--text-muted)] mb-4">
							<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
						</svg>
						<h3 class="text-lg font-medium text-[var(--text-primary)] mb-2">
							Failed to Load
						</h3>
						<p class="text-[var(--text-muted)] max-w-md mx-auto">
							Could not load this surah's data. Please try again.
						</p>
						<button
							onclick={() => location.reload()}
							class="mt-4 inline-flex items-center gap-2 rounded-lg bg-[var(--accent-color)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-sepia-600"
						>
							Retry
						</button>
					</div>
				{/if}

				<!-- Navigation -->
				<nav class="mt-8 flex items-center justify-between border-t border-[var(--border-color)] pt-6">
					{#if surahId > 1}
						<a
							href="/surah/{surahId - 1}"
							class="nav-link liquid-glass-btn"
						>
							<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="h-5 w-5">
								<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
							</svg>
							<span>Previous</span>
						</a>
					{:else}
						<div></div>
					{/if}

					<a
						href="/"
						class="nav-link-center liquid-glass-btn"
					>
						All Surahs
					</a>

					{#if surahId < 114}
						<a
							href="/surah/{surahId + 1}"
							class="nav-link liquid-glass-btn"
						>
							<span>Next</span>
							<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="h-5 w-5">
								<path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
							</svg>
						</a>
					{:else}
						<div></div>
					{/if}
				</nav>
			</div>
		</div>
	</div>
{:else}
	<!-- Surah not found -->
	<div class="py-12 text-center">
		<h1 class="text-2xl font-medium text-[var(--text-primary)] mb-2">Surah Not Found</h1>
		<p class="text-[var(--text-muted)] mb-4">The requested surah does not exist.</p>
		<a
			href="/"
			class="inline-flex items-center gap-2 text-[var(--accent-color)] hover:underline"
		>
			<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="h-5 w-5">
				<path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
			</svg>
			Back to Surah Index
		</a>
	</div>
{/if}

<style>
	/* Reader Layout - Simple approach with margin shift */
	.reader-layout {
		min-height: 100vh;
	}

	.reader-content {
		transition: margin-left 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
	}

	/* When panel is open, shift content right on desktop */
	.reader-layout.panel-open .reader-content {
		margin-left: 320px;
	}

	.surah-reader {
		max-width: 48rem;
		margin: 0 auto;
		padding: 1rem;
	}

	/* Meanings toggle */
	.meanings-toggle-container {
		display: flex;
		justify-content: center;
		margin: 1rem 0;
	}

	.meanings-toggle {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		border-radius: 9999px;
		font-size: 0.875rem;
		color: var(--text-secondary);
		background: rgba(255, 255, 255, 0.2);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid rgba(255, 255, 255, 0.3);
		box-shadow:
			inset 0 1px 0 0 rgba(255, 255, 255, 0.4),
			0 2px 8px rgba(0, 0, 0, 0.08);
		transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
	}

	.meanings-toggle:hover {
		background: rgba(255, 255, 255, 0.3);
		transform: translateY(-1px);
		color: var(--text-primary);
	}

	:global(.dark) .meanings-toggle {
		background: rgba(255, 255, 255, 0.08);
		border-color: rgba(255, 255, 255, 0.15);
	}

	/* Navigation links */
	.nav-link {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.625rem 1rem;
		border-radius: 12px;
		font-size: 0.875rem;
		color: var(--text-secondary);
		text-decoration: none;
		background: rgba(255, 255, 255, 0.15);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid rgba(255, 255, 255, 0.25);
		box-shadow:
			inset 0 1px 0 0 rgba(255, 255, 255, 0.3),
			0 2px 8px rgba(0, 0, 0, 0.06);
		transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
	}

	.nav-link:hover {
		background: rgba(255, 255, 255, 0.25);
		transform: translateY(-2px);
		color: var(--text-primary);
		box-shadow:
			inset 0 1px 0 0 rgba(255, 255, 255, 0.4),
			0 4px 16px rgba(0, 0, 0, 0.1);
	}

	.nav-link-center {
		padding: 0.625rem 1rem;
		border-radius: 12px;
		font-size: 0.875rem;
		color: var(--text-muted);
		text-decoration: none;
		background: rgba(255, 255, 255, 0.1);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		border: 1px solid rgba(255, 255, 255, 0.2);
		transition: all 0.25s ease;
	}

	.nav-link-center:hover {
		background: rgba(255, 255, 255, 0.2);
		color: var(--text-primary);
	}

	:global(.dark) .nav-link,
	:global(.dark) .nav-link-center {
		background: rgba(255, 255, 255, 0.05);
		border-color: rgba(255, 255, 255, 0.1);
	}

	:global(.dark) .nav-link:hover,
	:global(.dark) .nav-link-center:hover {
		background: rgba(255, 255, 255, 0.1);
	}

	/* View Transitions */
	@supports (view-transition-name: word-panel) {
		.reader-layout {
			view-transition-name: reader-layout;
		}
	}

	/* Mobile responsive */
	@media (max-width: 768px) {
		/* On mobile, panel becomes bottom sheet, no margin shift */
		.reader-layout.panel-open .reader-content {
			margin-left: 0;
		}

		.surah-reader {
			padding: 0.5rem;
		}

		.nav-link span {
			display: none;
		}

		.nav-link {
			padding: 0.5rem;
		}

		/* Hide particles on mobile to reduce distraction */
		:global(.reader-particles) {
			display: none;
		}
	}

	/* Particle styling for reader */
	:global(.reader-particles) {
		opacity: 0.6;
		z-index: -1;
	}
</style>
