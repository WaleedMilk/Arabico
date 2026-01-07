<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { reviewStore } from '$lib/stores/review.svelte';
	import { engagement } from '$lib/stores/engagement.svelte';
	import StreakDisplay from '$lib/components/review/StreakDisplay.svelte';
	import type { ReviewMode } from '$lib/types';

	let selectedMode = $state<ReviewMode | null>(null);

	const modes: { id: ReviewMode; title: string; description: string; icon: string; words: number }[] = [
		{
			id: 'contextual',
			title: 'Contextual Review',
			description: 'Learn words in their Quranic verse context',
			icon: '📖',
			words: 15
		},
		{
			id: 'quick',
			title: 'Quick Review',
			description: 'Rapid flashcard-style practice',
			icon: '⚡',
			words: 20
		},
		{
			id: 'recognition',
			title: 'Recognition',
			description: 'See Arabic, recall the meaning',
			icon: '👁️',
			words: 15
		},
		{
			id: 'recall',
			title: 'Recall',
			description: 'See meaning, recall the Arabic',
			icon: '🧠',
			words: 12
		}
	];

	onMount(async () => {
		await reviewStore.init();
		await engagement.init();
	});

	function startReview() {
		if (selectedMode) {
			goto(`/review/${selectedMode}`);
		}
	}
</script>

<svelte:head>
	<title>Review - Arabico</title>
</svelte:head>

<div class="review-hub max-w-lg mx-auto space-y-8">
	<!-- Header with streak -->
	<header class="text-center space-y-4">
		<h1 class="text-2xl font-medium text-[var(--text-primary)]">Review</h1>

		<div class="py-4">
			<StreakDisplay size="large" />
			<p class="mt-2 text-sm text-[var(--text-secondary)]">
				{engagement.getStreakMessage()}
			</p>
		</div>
	</header>

	<!-- Due words count -->
	<div class="bg-[var(--bg-elevated)] rounded-2xl p-6 text-center shadow-sm">
		<div class="text-5xl font-bold text-gold mb-2">{reviewStore.dueCount}</div>
		<div class="text-[var(--text-muted)]">
			{reviewStore.dueCount === 1 ? 'word' : 'words'} ready for review
		</div>
	</div>

	<!-- Mode selection -->
	{#if reviewStore.dueCount > 0}
		<div class="space-y-4">
			<h2 class="text-sm font-medium text-[var(--text-muted)] uppercase tracking-wide">
				Choose Review Mode
			</h2>

			<div class="grid gap-3">
				{#each modes as mode}
					<button
						onclick={() => selectedMode = mode.id}
						class="mode-card p-4 rounded-xl border-2 text-left transition-all
						       {selectedMode === mode.id
						         ? 'border-gold bg-gold/10'
						         : 'border-[var(--border-color)] hover:border-gold/50 bg-[var(--bg-elevated)]'}"
					>
						<div class="flex items-start gap-3">
							<span class="text-2xl">{mode.icon}</span>
							<div class="flex-1">
								<h3 class="font-medium text-[var(--text-primary)]">{mode.title}</h3>
								<p class="text-sm text-[var(--text-muted)] mt-0.5">{mode.description}</p>
							</div>
							<span class="text-xs text-[var(--text-muted)] bg-[var(--bg-secondary)] px-2 py-1 rounded">
								{mode.words} words
							</span>
						</div>
					</button>
				{/each}
			</div>
		</div>

		<!-- Start button -->
		<button
			onclick={startReview}
			disabled={!selectedMode}
			class="w-full py-4 rounded-xl text-lg font-medium transition-all
			       {selectedMode
			         ? 'bg-[var(--accent-color)] text-white hover:bg-sepia-600'
			         : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] cursor-not-allowed'}"
		>
			{selectedMode ? 'Start Review' : 'Select a mode to begin'}
		</button>
	{:else}
		<!-- No words to review -->
		<div class="bg-[var(--bg-elevated)] rounded-2xl p-8 text-center">
			<div class="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
				<svg class="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
				</svg>
			</div>
			<h2 class="text-xl font-medium text-[var(--text-primary)]">All Caught Up!</h2>
			<p class="text-[var(--text-muted)] mt-2">No words are due for review.</p>
			<p class="text-sm text-[var(--text-muted)] mt-1">
				Keep reading to add more words to your vocabulary.
			</p>
			<a
				href="/surah/1"
				class="inline-block mt-6 px-6 py-2 rounded-lg bg-[var(--accent-color)] text-white font-medium hover:bg-sepia-600 transition-colors"
			>
				Continue Reading
			</a>
		</div>
	{/if}

	<!-- Stats summary -->
	{#if engagement.totalWordsReviewed > 0}
		<div class="text-center text-sm text-[var(--text-muted)]">
			<p>Total words reviewed: <span class="font-medium">{engagement.totalWordsReviewed}</span></p>
		</div>
	{/if}
</div>
