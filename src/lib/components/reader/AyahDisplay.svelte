<script lang="ts">
	import { toArabicNumerals } from '$lib/data/surahs';
	import type { Ayah, QuranWord, QuranWordWithTranslation } from '$lib/types';
	import WordToken from './WordToken.svelte';

	interface Props {
		ayah: Ayah;
		surahId: number;
		showAllMeanings?: boolean;
		onWordSelect?: (word: QuranWord) => void;
	}

	let { ayah, surahId, showAllMeanings = false, onWordSelect }: Props = $props();

	// Track individually revealed words
	let revealedWords = $state<Set<string>>(new Set());

	function toggleWordMeaning(wordId: string) {
		const newSet = new Set(revealedWords);
		if (newSet.has(wordId)) {
			newSet.delete(wordId);
		} else {
			newSet.add(wordId);
		}
		revealedWords = newSet;
	}

	function isWordRevealed(wordId: string): boolean {
		return showAllMeanings || revealedWords.has(wordId);
	}
</script>

<div class="ayah-container group relative py-4" data-ayah-id={ayah.id}>
	<!-- Ayah text with word tokens -->
	<div class="quran-text-wrapper" dir="rtl">
		{#each ayah.words as word, index (word.id)}
			{@const wordWithTranslation = word as QuranWordWithTranslation}
			<WordToken
				{word}
				surah={surahId}
				ayah={ayah.id}
				wordIndex={index}
				translation={wordWithTranslation.translation}
				showMeaning={isWordRevealed(word.id)}
				onSelect={onWordSelect}
				onToggleMeaning={() => toggleWordMeaning(word.id)}
			/>
		{/each}
		<!-- Ayah number -->
		<span class="ayah-number">
			﴿{toArabicNumerals(ayah.id)}﴾
		</span>
	</div>

	<!-- Translation (if available) -->
	{#if ayah.translation}
		<p class="ayah-translation">
			{ayah.translation}
		</p>
	{/if}
</div>

<style>
	.ayah-container {
		padding: 1rem 0;
	}

	.quran-text-wrapper {
		display: flex;
		flex-wrap: wrap;
		justify-content: flex-start;
		gap: 0.75rem 0.5rem;
		font-family: var(--font-arabic, 'Amiri', serif);
		font-size: 1.875rem;
		line-height: 1.5;
		color: var(--text-primary);
	}

	.ayah-number {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 2.5rem;
		height: 2.5rem;
		color: var(--color-gold, #C4A962);
		font-size: 1rem;
		font-family: var(--font-arabic, 'Amiri', serif);
	}

	.ayah-translation {
		margin-top: 0.75rem;
		font-size: 0.875rem;
		color: var(--text-muted);
		font-style: italic;
		line-height: 1.6;
		text-align: left;
		direction: ltr;
	}
</style>
