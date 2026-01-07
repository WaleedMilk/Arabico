<script lang="ts">
	import { vocabulary } from '$lib/stores/vocabulary.svelte';
	import type { QuranWord, FamiliarityLevel } from '$lib/types';

	interface Props {
		word: QuranWord;
		surah: number;
		ayah: number;
		wordIndex: number;
		translation?: string;
		showMeaning?: boolean;
		onSelect?: (word: QuranWord) => void;
		onToggleMeaning?: () => void;
		showDueIndicator?: boolean;
	}

	let {
		word,
		surah,
		ayah,
		wordIndex,
		translation = '',
		showMeaning = false,
		onSelect,
		onToggleMeaning,
		showDueIndicator = true
	}: Props = $props();

	// Get familiarity level for this word
	let familiarity = $derived(vocabulary.getFamiliarity(word.id));

	// Check if word is due for review (simplified - just check familiarity state)
	// Full date checking is done in the review queue builder
	let isDue = $derived.by(() => {
		if (!showDueIndicator) return false;
		// Words in learning state are shown as due for quick identification
		return familiarity === 'learning';
	});

	// Long press for audio
	let pressTimer: ReturnType<typeof setTimeout> | null = null;
	let isLongPress = false;

	function handlePointerDown() {
		isLongPress = false;
		pressTimer = setTimeout(() => {
			isLongPress = true;
			playWordAudio();
		}, 400);
	}

	function handlePointerUp() {
		if (pressTimer) {
			clearTimeout(pressTimer);
			pressTimer = null;
		}
	}

	function handlePointerLeave() {
		if (pressTimer) {
			clearTimeout(pressTimer);
			pressTimer = null;
		}
	}

	async function playWordAudio() {
		try {
			const url = `https://quranwbw.github.io/audio-words-new/${surah}/${ayah}/${wordIndex + 1}.mp3`;
			const audio = new Audio(url);
			await audio.play();
		} catch (e) {
			console.warn('Audio playback failed:', e);
		}
	}

	function handleClick() {
		// If it was a long press, don't trigger click actions
		if (isLongPress) {
			isLongPress = false;
			return;
		}

		// Mark as seen if new
		if (familiarity === 'new') {
			vocabulary.markSeen(
				word.id,
				word.text,
				word.id,
				translation || '',
				{ surah, ayah, wordIndex }
			);
		}

		// Toggle meaning if available
		onToggleMeaning?.();

		// Notify parent (open panel)
		onSelect?.(word);
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			handleClick();
		}
	}
</script>

<span
	class="word-token-wrapper"
	class:meaning-visible={showMeaning && translation}
>
	<span
		class="word-token {familiarity}"
		class:due={isDue}
		role="button"
		tabindex="0"
		onclick={handleClick}
		onkeydown={handleKeydown}
		onpointerdown={handlePointerDown}
		onpointerup={handlePointerUp}
		onpointerleave={handlePointerLeave}
		data-word-id={word.id}
		data-familiarity={familiarity}
	>
		{word.text}
		{#if isDue}
			<span class="due-indicator"></span>
		{/if}
	</span>

	<!-- Inline meaning (liquid glass reveal) -->
	{#if translation}
		<span
			class="word-meaning"
			class:visible={showMeaning}
		>
			{translation}
		</span>
	{/if}
</span>

<style>
	.word-token-wrapper {
		display: inline-flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		position: relative;
	}

	.word-token {
		position: relative;
		cursor: pointer;
		padding: 0.25rem 0.5rem;
		border-radius: 8px;
		transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
		user-select: none;
		-webkit-user-select: none;

		/* Subtle liquid glass effect on hover */
		background: transparent;
	}

	.word-token:hover {
		background: rgba(255, 255, 255, 0.15);
		backdrop-filter: blur(4px);
		-webkit-backdrop-filter: blur(4px);
		transform: translateY(-2px);
		box-shadow:
			inset 0 1px 0 0 rgba(255, 255, 255, 0.3),
			0 4px 12px rgba(0, 0, 0, 0.08);
	}

	.word-token:active {
		transform: scale(0.98);
	}

	:global(.dark) .word-token:hover {
		background: rgba(255, 255, 255, 0.08);
	}

	/* Familiarity colors */
	.word-token.new {
		color: var(--text-new, #C4A962);
	}

	.word-token.seen {
		color: var(--text-seen, inherit);
	}

	.word-token.learning {
		color: var(--text-learning, #D4A017);
	}

	.word-token.known {
		color: var(--text-known, #5B8C5A);
	}

	.word-token.ignored {
		color: var(--text-ignored, #9CA3AF);
		opacity: 0.6;
	}

	/* Due indicator */
	.word-token.due {
		box-shadow: 0 0 0 2px var(--color-gold, #C4A962);
	}

	.due-indicator {
		position: absolute;
		top: -2px;
		right: -2px;
		width: 8px;
		height: 8px;
		background: var(--color-gold, #C4A962);
		border-radius: 50%;
		animation: pulse 2s infinite;
	}

	@keyframes pulse {
		0%, 100% { opacity: 1; transform: scale(1); }
		50% { opacity: 0.7; transform: scale(1.2); }
	}

	/* Inline meaning with liquid glass effect */
	.word-meaning {
		font-size: 0.625rem;
		color: var(--text-muted);
		text-align: center;
		direction: ltr;
		font-family: var(--font-sans, system-ui);
		letter-spacing: 0.02em;
		max-width: 100px;
		line-height: 1.3;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;

		/* Hidden by default with liquid glass effect */
		opacity: 0;
		transform: translateY(-4px) scale(0.9);
		filter: blur(4px);
		transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);

		/* Glass background when visible */
		padding: 0.125rem 0.375rem;
		border-radius: 6px;
		background: transparent;
	}

	.word-meaning.visible {
		opacity: 1;
		transform: translateY(0) scale(1);
		filter: blur(0);

		/* Liquid glass surface */
		background: rgba(255, 255, 255, 0.2);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		border: 1px solid rgba(255, 255, 255, 0.25);
		box-shadow:
			inset 0 1px 0 0 rgba(255, 255, 255, 0.3),
			0 2px 8px rgba(0, 0, 0, 0.06);
	}

	:global(.dark) .word-meaning.visible {
		background: rgba(255, 255, 255, 0.08);
		border-color: rgba(255, 255, 255, 0.1);
	}

	/* When meaning is visible, adjust wrapper spacing */
	.word-token-wrapper.meaning-visible {
		margin-bottom: 0.25rem;
	}

	/* Focus styles */
	.word-token:focus-visible {
		outline: 2px solid var(--color-gold, #C4A962);
		outline-offset: 2px;
	}
</style>
