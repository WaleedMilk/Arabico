<script lang="ts">
	import type { ReviewCardData } from '$lib/types';

	interface Props {
		cardData: ReviewCardData;
		showAnswer: boolean;
		onReveal: () => void;
	}

	let { cardData, showAnswer, onReveal }: Props = $props();

	// Handle tap/click to flip
	function handleFlip() {
		if (!showAnswer) {
			onReveal();
		}
	}

	// Handle keyboard
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === ' ' || event.key === 'Enter') {
			event.preventDefault();
			handleFlip();
		}
	}
</script>

<div
	class="flash-card"
	class:flipped={showAnswer}
	onclick={handleFlip}
	onkeydown={handleKeydown}
	tabindex="0"
	role="button"
	aria-label={showAnswer ? 'Answer revealed' : 'Tap to reveal answer'}
>
	<div class="card-inner">
		<!-- Front: Arabic -->
		<div class="card-front">
			<span class="arabic-word">
				{cardData.entry.surfaceForm}
			</span>
			<p class="tap-hint">Tap to reveal</p>
		</div>

		<!-- Back: English -->
		<div class="card-back">
			<span class="arabic-word-small">
				{cardData.entry.surfaceForm}
			</span>
			<div class="divider"></div>
			<p class="meaning-text">
				{cardData.entry.gloss || 'Translation not available'}
			</p>
			{#if cardData.entry.root}
				<p class="root-text">
					Root: <span class="font-arabic">{cardData.entry.root}</span>
				</p>
			{/if}
		</div>
	</div>
</div>

<style>
	.flash-card {
		perspective: 1000px;
		cursor: pointer;
		outline: none;
		min-height: 280px;
	}

	.flash-card:focus-visible {
		outline: 2px solid var(--accent-color);
		outline-offset: 4px;
		border-radius: 1rem;
	}

	.card-inner {
		position: relative;
		width: 100%;
		min-height: 280px;
		transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
		transform-style: preserve-3d;
	}

	.flash-card.flipped .card-inner {
		transform: rotateY(180deg);
	}

	.card-front,
	.card-back {
		position: absolute;
		width: 100%;
		min-height: 280px;
		backface-visibility: hidden;
		-webkit-backface-visibility: hidden;
		border-radius: 1rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
	}

	.card-front {
		background: linear-gradient(135deg, var(--bg-elevated) 0%, var(--bg-secondary) 100%);
		border: 1px solid var(--border-color);
	}

	.card-back {
		background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-elevated) 100%);
		border: 1px solid var(--border-color);
		transform: rotateY(180deg);
	}

	.arabic-word {
		font-family: var(--font-arabic);
		font-size: 4.5rem;
		color: var(--text-primary);
		line-height: 1.2;
	}

	.arabic-word-small {
		font-family: var(--font-arabic);
		font-size: 2.5rem;
		color: var(--accent-color);
	}

	.tap-hint {
		margin-top: 2rem;
		font-size: 0.875rem;
		color: var(--text-muted);
		opacity: 0.7;
	}

	.divider {
		width: 60px;
		height: 2px;
		background: var(--border-color);
		margin: 1rem 0;
	}

	.meaning-text {
		font-size: 1.75rem;
		font-weight: 500;
		color: var(--text-primary);
		text-align: center;
		line-height: 1.3;
	}

	.root-text {
		margin-top: 0.75rem;
		font-size: 0.875rem;
		color: var(--text-muted);
	}

	/* Hover effect on desktop */
	@media (hover: hover) {
		.flash-card:not(.flipped):hover .card-inner {
			transform: scale(1.02);
		}

		.flash-card:not(.flipped):hover .tap-hint {
			opacity: 1;
		}
	}

	/* Touch feedback on mobile */
	@media (hover: none) {
		.flash-card:active .card-inner {
			transform: scale(0.98);
		}
	}

	/* Mobile typography scaling */
	@media (max-width: 400px) {
		.arabic-word {
			font-size: 3rem;
		}

		.arabic-word-small {
			font-size: 2rem;
		}

		.meaning-text {
			font-size: 1.25rem;
		}

		.card-front,
		.card-back {
			padding: 1.5rem;
		}
	}
</style>
