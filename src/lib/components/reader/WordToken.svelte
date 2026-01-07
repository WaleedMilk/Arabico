<script lang="ts">
	import { vocabulary } from '$lib/stores/vocabulary.svelte';
	import type { QuranWord, FamiliarityLevel } from '$lib/types';

	interface Props {
		word: QuranWord;
		surah: number;
		ayah: number;
		wordIndex: number;
		onSelect?: (word: QuranWord) => void;
	}

	let { word, surah, ayah, wordIndex, onSelect }: Props = $props();

	// Get familiarity level for this word
	let familiarity = $derived(vocabulary.getFamiliarity(word.id));

	// CSS classes based on familiarity
	// New = golden beige (encourages learning)
	// Seen = normal/transparent (already encountered)
	// Learning = bright yellow (actively studying)
	// Known = white/clean (mastered)
	// Ignored = gray (de-emphasized)
	const familiarityClasses: Record<FamiliarityLevel, string> = {
		new: 'bg-[var(--highlight-new)]',
		seen: '',
		learning: 'bg-[var(--highlight-learning)]',
		known: 'bg-[var(--highlight-known)]',
		ignored: 'bg-[var(--highlight-ignored)] opacity-60'
	};
	let familiarityClass = $derived(familiarityClasses[familiarity] || '');

	function handleClick() {
		// Mark as seen if new
		if (familiarity === 'new') {
			vocabulary.markSeen(
				word.id,
				word.text,
				word.id, // Using word.id as lemma placeholder
				'', // Gloss will come from morphology data
				{ surah, ayah, wordIndex }
			);
		}

		// Notify parent
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
	class="word-token cursor-pointer rounded px-1 py-0.5 transition-all duration-150 hover:bg-[var(--highlight-learning)] focus:outline-none focus:ring-2 focus:ring-gold/50 {familiarityClass}"
	role="button"
	tabindex="0"
	onclick={handleClick}
	onkeydown={handleKeydown}
	data-word-id={word.id}
	data-familiarity={familiarity}
>
	{word.text}
</span>
