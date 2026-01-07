<script lang="ts">
	import { page } from '$app/stores';
	import { getSurahById } from '$lib/data/surahs';
	import { getSurahAyahs, getWordGloss } from '$lib/data/quran-sample';
	import SurahHeader from '$lib/components/reader/SurahHeader.svelte';
	import AyahDisplay from '$lib/components/reader/AyahDisplay.svelte';
	import WordPopover from '$lib/components/reader/WordPopover.svelte';
	import type { QuranWord } from '$lib/types';

	// Get surah ID from URL (handle invalid IDs)
	function parseSurahId(id: string | undefined): number {
		if (!id) return 0;
		const parsed = parseInt(id, 10);
		return isNaN(parsed) ? 0 : parsed;
	}

	let surahId = $derived(parseSurahId($page.params.id));
	let surah = $derived(getSurahById(surahId));
	let ayahs = $derived(getSurahAyahs(surahId));

	// Selected word state
	let selectedWord = $state<QuranWord | null>(null);
	let selectedWordGloss = $derived(selectedWord ? getWordGloss(selectedWord.id) : null);

	function handleWordSelect(word: QuranWord) {
		selectedWord = word;
	}

	function closePopover() {
		selectedWord = null;
	}
</script>

<svelte:head>
	<title>{surah ? `${surah.englishName} - Arabico` : 'Surah Not Found'}</title>
</svelte:head>

{#if surah}
	<div class="surah-reader">
		<!-- Surah Header -->
		<SurahHeader {surah} showBismillah={surah.id !== 1} />

		<!-- Ayahs -->
		{#if ayahs}
			<div class="space-y-2">
				{#each ayahs as ayah}
					<AyahDisplay
						{ayah}
						{surahId}
						onWordSelect={handleWordSelect}
					/>
				{/each}
			</div>
		{:else}
			<!-- Coming soon message for surahs without data -->
			<div class="rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] p-8 text-center">
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="mx-auto h-12 w-12 text-[var(--text-muted)] mb-4">
					<path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
				</svg>
				<h3 class="text-lg font-medium text-[var(--text-primary)] mb-2">
					Coming Soon
				</h3>
				<p class="text-[var(--text-muted)] max-w-md mx-auto">
					This surah's word-by-word data is being prepared. Currently, only Surah Al-Fatihah is available for demonstration.
				</p>
				<a
					href="/surah/1"
					class="mt-4 inline-flex items-center gap-2 rounded-lg bg-[var(--accent-color)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-sepia-600"
				>
					Try Al-Fatihah
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="h-4 w-4">
						<path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
					</svg>
				</a>
			</div>
		{/if}

		<!-- Navigation -->
		<nav class="mt-8 flex items-center justify-between border-t border-[var(--border-color)] pt-6">
			{#if surahId > 1}
				<a
					href="/surah/{surahId - 1}"
					class="flex items-center gap-2 text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
				>
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="h-5 w-5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
					</svg>
					<span>Previous Surah</span>
				</a>
			{:else}
				<div></div>
			{/if}

			<a
				href="/"
				class="text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
			>
				All Surahs
			</a>

			{#if surahId < 114}
				<a
					href="/surah/{surahId + 1}"
					class="flex items-center gap-2 text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
				>
					<span>Next Surah</span>
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="h-5 w-5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
					</svg>
				</a>
			{:else}
				<div></div>
			{/if}
		</nav>
	</div>

	<!-- Word Popover -->
	<WordPopover
		word={selectedWord}
		gloss={selectedWordGloss?.gloss}
		lemma={selectedWordGloss?.lemma}
		onClose={closePopover}
	/>
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
