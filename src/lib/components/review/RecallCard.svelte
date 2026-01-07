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

	// Replace target word with blank in verse text
	function blankWord(text: string, wordIndex: number): string {
		const words = text.split(' ');
		if (wordIndex >= 0 && wordIndex < words.length) {
			words[wordIndex] = '<span class="word-blank">_____</span>';
		}
		return words.join(' ');
	}

	// Highlight the revealed word
	function highlightWord(text: string, wordIndex: number): string {
		const words = text.split(' ');
		if (wordIndex >= 0 && wordIndex < words.length) {
			words[wordIndex] = `<mark class="highlight-word">${words[wordIndex]}</mark>`;
		}
		return words.join(' ');
	}
</script>

<div class="recall-card">
	<!-- Header: First seen location -->
	<div class="card-header">
		<p class="location-text">
			{#if surahInfo}
				First seen in <span class="font-medium">{surahInfo.englishName}</span>
				({surahInfo.name}), Ayah {cardData.entry.firstSeen?.ayah}
			{:else}
				First encounter
			{/if}
		</p>
	</div>

	<!-- Verse context with blank -->
	{#if cardData.primaryContext?.ayahText}
		<div class="verse-context">
			{#if showAnswer}
				<p class="verse-text" dir="rtl">
					{@html highlightWord(
						cardData.primaryContext.ayahText,
						cardData.entry.firstSeen?.wordIndex ?? -1
					)}
				</p>
			{:else}
				<p class="verse-text" dir="rtl">
					{@html blankWord(
						cardData.primaryContext.ayahText,
						cardData.entry.firstSeen?.wordIndex ?? -1
					)}
				</p>
			{/if}
		</div>
	{/if}

	<!-- English meaning display (always visible) -->
	<div class="meaning-display">
		<p class="meaning-label">What is the Arabic word for:</p>
		<p class="meaning-text">
			"{cardData.entry.gloss || 'Translation not available'}"
		</p>

		{#if !showAnswer}
			<button onclick={onReveal} class="reveal-btn">
				Reveal Arabic
			</button>
		{/if}
	</div>

	<!-- Answer section (shown after reveal) -->
	{#if showAnswer}
		<div class="answer-section">
			<div class="arabic-reveal">
				<span class="arabic-word">
					{cardData.entry.surfaceForm}
				</span>
				{#if cardData.entry.lemma && cardData.entry.lemma !== cardData.entry.surfaceForm}
					<p class="transliteration">
						({cardData.entry.lemma})
					</p>
				{/if}
			</div>

			{#if cardData.entry.root}
				<p class="root-info">
					Root: <span class="font-arabic">{cardData.entry.root}</span>
				</p>
			{/if}

			<!-- Verse translation after reveal -->
			{#if cardData.primaryContext?.translation}
				<div class="verse-translation-box">
					<p class="verse-translation">
						{cardData.primaryContext.translation}
					</p>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.recall-card {
		background: var(--bg-elevated);
		border-radius: 1rem;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
		overflow: hidden;
	}

	.card-header {
		padding: 0.75rem 1.5rem;
		background: var(--bg-secondary);
		border-bottom: 1px solid var(--border-color);
	}

	.location-text {
		font-size: 0.75rem;
		color: var(--text-muted);
		text-align: center;
	}

	.verse-context {
		padding: 1rem 1.5rem;
		border-bottom: 1px solid var(--border-color);
		background: var(--bg-secondary);
	}

	.verse-text {
		font-family: var(--font-arabic);
		font-size: 1.375rem;
		line-height: 2;
		text-align: center;
		color: var(--text-primary);
	}

	:global(.word-blank) {
		display: inline-block;
		min-width: 4rem;
		border-bottom: 2px dashed var(--accent-color);
		color: var(--accent-color);
		font-weight: 600;
	}

	.meaning-display {
		padding: 2rem 1.5rem;
		text-align: center;
	}

	.meaning-label {
		font-size: 0.875rem;
		color: var(--text-muted);
		margin-bottom: 0.75rem;
	}

	.meaning-text {
		font-size: 2rem;
		font-weight: 600;
		color: var(--text-primary);
		line-height: 1.3;
	}

	.reveal-btn {
		margin-top: 1.5rem;
		width: 100%;
		padding: 0.875rem;
		border-radius: 0.75rem;
		background: var(--accent-color);
		color: white;
		font-weight: 500;
		transition: all 0.2s ease;
	}

	.reveal-btn:hover {
		background: var(--accent-color-hover, #8b6914);
		transform: translateY(-1px);
	}

	.answer-section {
		padding: 1.5rem;
		text-align: center;
		animation: fadeIn 0.3s ease-out;
	}

	.arabic-reveal {
		margin-bottom: 1rem;
	}

	.arabic-word {
		font-family: var(--font-arabic);
		font-size: 3.5rem;
		color: var(--accent-color);
	}

	.transliteration {
		margin-top: 0.5rem;
		font-size: 1rem;
		color: var(--text-muted);
		font-style: italic;
	}

	.root-info {
		font-size: 0.875rem;
		color: var(--text-muted);
		margin-bottom: 1rem;
	}

	.verse-translation-box {
		margin-top: 1rem;
		padding: 0.75rem;
		border-radius: 0.5rem;
		background: var(--bg-secondary);
	}

	.verse-translation {
		font-size: 0.875rem;
		color: var(--text-secondary);
		font-style: italic;
	}

	:global(.highlight-word) {
		background: rgba(212, 175, 55, 0.3);
		padding: 0 0.25rem;
		border-radius: 0.25rem;
	}

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
</style>
