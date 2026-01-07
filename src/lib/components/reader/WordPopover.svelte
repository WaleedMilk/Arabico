<script lang="ts">
	import { vocabulary } from '$lib/stores/vocabulary.svelte';
	import type { QuranWord } from '$lib/types';

	interface Props {
		word: QuranWord | null;
		gloss?: string;
		lemma?: string;
		onClose: () => void;
	}

	let { word, gloss = '', lemma = '', onClose }: Props = $props();

	let familiarity = $derived(word ? vocabulary.getFamiliarity(word.id) : 'new');

	async function handleAddToReview() {
		if (word) {
			await vocabulary.addToReview(word.id);
		}
	}

	async function handleMarkKnown() {
		if (word) {
			await vocabulary.markKnown(word.id);
		}
	}

	async function handleIgnore() {
		if (word) {
			await vocabulary.ignore(word.id);
			onClose();
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			onClose();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if word}
	<!-- Backdrop -->
	<button
		class="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
		onclick={onClose}
		aria-label="Close popover"
	></button>

	<!-- Popover -->
	<div
		class="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl border-t border-[var(--border-color)] bg-[var(--bg-elevated)] p-6 shadow-xl sm:bottom-auto sm:left-1/2 sm:right-auto sm:top-1/2 sm:w-full sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:border"
		role="dialog"
		aria-modal="true"
		aria-labelledby="word-popover-title"
	>
		<!-- Close button -->
		<button
			onclick={onClose}
			class="absolute right-4 top-4 rounded-full p-1 text-[var(--text-muted)] transition-colors hover:bg-sepia-100 hover:text-[var(--text-primary)] dark:hover:bg-sepia-800"
			aria-label="Close"
		>
			<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="h-5 w-5">
				<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
			</svg>
		</button>

		<!-- Word display -->
		<div class="mb-6 text-center">
			<h2 id="word-popover-title" class="font-arabic text-4xl text-[var(--text-primary)] mb-2" dir="rtl">
				{word.text}
			</h2>
			{#if lemma}
				<p class="text-sm text-[var(--text-muted)]">
					Lemma: <span class="font-arabic">{lemma}</span>
				</p>
			{/if}
		</div>

		<!-- Gloss / Translation -->
		<div class="mb-6 rounded-lg bg-[var(--bg-secondary)] p-4 text-center">
			{#if gloss}
				<p class="text-lg text-[var(--text-primary)]">{gloss}</p>
			{:else}
				<p class="text-[var(--text-muted)] italic">Translation not available</p>
			{/if}
		</div>

		<!-- Familiarity indicator -->
		<div class="mb-6 flex items-center justify-center gap-2">
			<span class="text-sm text-[var(--text-muted)]">Status:</span>
			<span class="rounded-full px-3 py-1 text-sm capitalize
				{familiarity === 'new' ? 'bg-sepia-100 text-sepia-600 dark:bg-sepia-800 dark:text-sepia-300' : ''}
				{familiarity === 'seen' ? 'bg-sepia-200 text-sepia-700 dark:bg-sepia-700 dark:text-sepia-200' : ''}
				{familiarity === 'learning' ? 'bg-gold/20 text-gold dark:bg-gold/30' : ''}
				{familiarity === 'known' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : ''}
				{familiarity === 'ignored' ? 'bg-sepia-100 text-sepia-400 dark:bg-sepia-800 dark:text-sepia-500' : ''}
			">
				{familiarity}
			</span>
		</div>

		<!-- Action buttons -->
		<div class="flex flex-wrap gap-2">
			{#if familiarity !== 'learning' && familiarity !== 'known'}
				<button
					onclick={handleAddToReview}
					class="flex-1 rounded-lg bg-[var(--accent-color)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-sepia-600"
				>
					Add to Review
				</button>
			{/if}

			{#if familiarity !== 'known'}
				<button
					onclick={handleMarkKnown}
					class="flex-1 rounded-lg border border-[var(--border-color)] bg-[var(--bg-elevated)] px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-secondary)]"
				>
					I Know This
				</button>
			{/if}

			{#if familiarity !== 'ignored'}
				<button
					onclick={handleIgnore}
					class="rounded-lg border border-[var(--border-color)] px-4 py-2.5 text-sm text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-secondary)]"
				>
					Ignore
				</button>
			{/if}
		</div>

		<!-- Audio button (placeholder) -->
		<button
			class="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--border-color)] px-4 py-2.5 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-secondary)]"
			disabled
		>
			<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="h-4 w-4">
				<path stroke-linecap="round" stroke-linejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
			</svg>
			<span>Hear Word (Coming Soon)</span>
		</button>
	</div>
{/if}
