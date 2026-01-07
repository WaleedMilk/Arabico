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
		const words = text.split(' ');
		if (wordIndex >= 0 && wordIndex < words.length) {
			words[wordIndex] = `<mark class="highlight-word">${words[wordIndex]}</mark>`;
		}
		return words.join(' ');
	}
</script>

<div class="recognition-card">
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

	<!-- Primary verse context -->
	{#if cardData.primaryContext?.ayahText}
		<div class="verse-context">
			<p class="verse-text" dir="rtl">
				{@html highlightWord(
					cardData.primaryContext.ayahText,
					cardData.entry.firstSeen?.wordIndex ?? -1
				)}
			</p>
			{#if cardData.primaryContext.translation && showAnswer}
				<p class="verse-translation">
					{cardData.primaryContext.translation}
				</p>
			{/if}
		</div>
	{/if}

	<!-- Target word display -->
	<div class="word-display">
		<span
			class="arabic-word"
			class:blur-sm={!showAnswer}
		>
			{cardData.entry.surfaceForm}
		</span>

		{#if !showAnswer}
			<p class="prompt-text">What does this word mean?</p>
			<button onclick={onReveal} class="reveal-btn">
				Reveal Meaning
			</button>
		{/if}
	</div>

	<!-- Answer section (shown after reveal) -->
	{#if showAnswer}
		<div class="answer-section">
			<!-- Gloss/meaning -->
			<div class="meaning-display">
				<p class="meaning-text">
					{cardData.entry.gloss || 'Translation not available'}
				</p>
				{#if cardData.entry.lemma}
					<p class="meta-text">
						Lemma: <span class="font-arabic">{cardData.entry.lemma}</span>
					</p>
				{/if}
				{#if cardData.entry.root}
					<p class="meta-text">
						Root: <span class="font-arabic">{cardData.entry.root}</span>
					</p>
				{/if}
			</div>

			<!-- Additional contexts -->
			{#if cardData.additionalContexts.length > 0}
				<div class="additional-contexts">
					<p class="contexts-label">Also appears in:</p>
					<div class="contexts-list">
						{#each cardData.additionalContexts.slice(0, 2) as context}
							<div class="context-item">
								<p class="context-location">
									{context.surahName}, Ayah {context.location.ayah}
								</p>
								{#if context.ayahText}
									<p class="context-text" dir="rtl">
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
	.recognition-card {
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
	}

	.verse-text {
		font-family: var(--font-arabic);
		font-size: 1.5rem;
		line-height: 2;
		text-align: center;
		color: var(--text-primary);
	}

	.verse-translation {
		margin-top: 0.5rem;
		font-size: 0.875rem;
		color: var(--text-muted);
		text-align: center;
		font-style: italic;
	}

	.word-display {
		padding: 2rem 1.5rem;
		text-align: center;
	}

	.arabic-word {
		font-family: var(--font-arabic);
		font-size: 3.5rem;
		color: var(--text-primary);
		transition: filter 0.3s ease;
	}

	.prompt-text {
		margin-top: 1rem;
		font-size: 0.875rem;
		color: var(--text-muted);
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
		animation: fadeIn 0.3s ease-out;
	}

	.meaning-display {
		text-align: center;
	}

	.meaning-text {
		font-size: 1.5rem;
		font-weight: 500;
		color: var(--text-primary);
	}

	.meta-text {
		margin-top: 0.25rem;
		font-size: 0.875rem;
		color: var(--text-muted);
	}

	.additional-contexts {
		margin-top: 1.5rem;
		padding-top: 1rem;
		border-top: 1px solid var(--border-color);
	}

	.contexts-label {
		font-size: 0.75rem;
		color: var(--text-muted);
		margin-bottom: 0.75rem;
	}

	.contexts-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.context-item {
		padding: 0.75rem;
		border-radius: 0.5rem;
		background: var(--bg-secondary);
	}

	.context-location {
		font-size: 0.75rem;
		color: var(--text-muted);
		margin-bottom: 0.25rem;
	}

	.context-text {
		font-family: var(--font-arabic);
		font-size: 1.125rem;
		color: var(--text-primary);
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
