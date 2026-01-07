<script lang="ts">
	import { toArabicNumerals } from '$lib/data/surahs';
	import type { Ayah, QuranWord } from '$lib/types';
	import WordToken from './WordToken.svelte';

	interface Props {
		ayah: Ayah;
		surahId: number;
		onWordSelect?: (word: QuranWord) => void;
	}

	let { ayah, surahId, onWordSelect }: Props = $props();
</script>

<div class="ayah-container group relative py-4" data-ayah-id={ayah.id}>
	<!-- Ayah text with word tokens -->
	<div class="quran-text leading-[2.75] text-[var(--text-primary)]" dir="rtl">
		{#each ayah.words as word, index}
			<WordToken
				{word}
				surah={surahId}
				ayah={ayah.id}
				wordIndex={index}
				onSelect={onWordSelect}
			/>
			{' '}
		{/each}
		<!-- Ayah number -->
		<span class="ayah-number inline-flex items-center justify-center text-gold">
			﴿{toArabicNumerals(ayah.id)}﴾
		</span>
	</div>

	<!-- Translation (if available) -->
	{#if ayah.translation}
		<p class="mt-3 text-sm text-[var(--text-muted)] italic leading-relaxed">
			{ayah.translation}
		</p>
	{/if}
</div>
