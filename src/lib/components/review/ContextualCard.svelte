<script lang="ts">
	import type { ReviewCardData } from '$lib/types';
	import { getSurahById } from '$lib/data/surahs';

	interface Props {
		cardData: ReviewCardData;
		showAnswer: boolean;
		onReveal: () => void;
	}

	let { cardData, showAnswer, onReveal }: Props = $props();

	// Get surah info
	let surahInfo = $derived(getSurahById(cardData.entry.firstSeen?.surah ?? 1));

	// Highlight the target word in verse text
	function highlightWord(text: string, wordIndex: number): string {
		// Split by spaces and reconstruct with highlighting
		const words = text.split(' ');
		if (wordIndex >= 0 && wordIndex < words.length) {
			words[wordIndex] = `<mark class="bg-gold/40 px-1 rounded">${words[wordIndex]}</mark>`;
		}
		return words.join(' ');
	}
</script>

<div class="contextual-card bg-[var(--bg-elevated)] rounded-2xl shadow-lg overflow-hidden">
	<!-- Header: First seen location -->
	<div class="px-6 py-3 bg-[var(--bg-secondary)] border-b border-[var(--border-color)]">
		<p class="text-xs text-[var(--text-muted)] text-center">
			{#if surahInfo}
				First seen in <span class="font-medium">{surahInfo.englishName}</span>
				({surahInfo.name}), Ayah {cardData.entry.firstSeen?.ayah}
			{:else}
				First encounter
			{/if}
		</p>
	</div>

	<!-- Primary verse context -->
	{#if cardData.primaryContext?.ayahText}
		<div class="px-6 py-4 border-b border-[var(--border-color)]">
			<p
				class="font-arabic text-2xl leading-loose text-center text-[var(--text-primary)]"
				dir="rtl"
			>
				{@html highlightWord(
					cardData.primaryContext.ayahText,
					cardData.entry.firstSeen?.wordIndex ?? -1
				)}
			</p>
			{#if cardData.primaryContext.translation && showAnswer}
				<p class="mt-2 text-sm text-[var(--text-muted)] text-center italic">
					{cardData.primaryContext.translation}
				</p>
			{/if}
		</div>
	{/if}

	<!-- Target word display -->
	<div class="px-6 py-8 text-center">
		<span
			class="font-arabic text-5xl text-[var(--text-primary)] transition-all duration-300"
			class:blur-sm={!showAnswer}
		>
			{cardData.entry.surfaceForm}
		</span>

		{#if !showAnswer}
			<button
				onclick={onReveal}
				class="mt-6 block w-full py-3 rounded-xl bg-[var(--accent-color)] text-white
                       font-medium transition-all hover:bg-sepia-600 focus:outline-none
                       focus:ring-2 focus:ring-gold focus:ring-offset-2"
			>
				Reveal Meaning
			</button>
		{/if}
	</div>

	<!-- Answer section (shown after reveal) -->
	{#if showAnswer}
		<div class="px-6 pb-6 space-y-4 animate-fadeIn">
			<!-- Gloss/meaning -->
			<div class="text-center">
				<p class="text-2xl text-[var(--text-primary)] font-medium">
					{cardData.entry.gloss || 'Translation not available'}
				</p>
				{#if cardData.entry.lemma}
					<p class="mt-1 text-sm text-[var(--text-muted)]">
						Lemma: <span class="font-arabic">{cardData.entry.lemma}</span>
					</p>
				{/if}
				{#if cardData.entry.root}
					<p class="text-sm text-[var(--text-muted)]">
						Root: <span class="font-arabic">{cardData.entry.root}</span>
					</p>
				{/if}
			</div>

			<!-- Additional contexts -->
			{#if cardData.additionalContexts.length > 0}
				<div class="pt-4 border-t border-[var(--border-color)]">
					<p class="text-xs text-[var(--text-muted)] mb-3">Also appears in:</p>
					<div class="space-y-3">
						{#each cardData.additionalContexts as context}
							<div
								class="p-3 rounded-lg bg-[var(--bg-secondary)] text-sm"
							>
								<p class="text-xs text-[var(--text-muted)] mb-1">
									{context.surahName}, Ayah {context.location.ayah}
								</p>
								{#if context.ayahText}
									<p class="font-arabic text-lg text-[var(--text-primary)]" dir="rtl">
										{@html highlightWord(context.ayahText, context.location.wordIndex)}
									</p>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.animate-fadeIn {
		animation: fadeIn 0.3s ease-out;
	}
</style>
