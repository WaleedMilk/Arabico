<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import { reviewStore } from '$lib/stores/review.svelte';
	import { engagement } from '$lib/stores/engagement.svelte';
	import StreakDisplay from '$lib/components/review/StreakDisplay.svelte';
	import ThreeBackground from '$lib/components/three/ThreeBackground.svelte';
	import type { ReviewMode } from '$lib/types';

	let selectedMode = $state<ReviewMode | null>(null);

	// Check if practice mode was requested via URL param
	let isPracticeMode = $derived($page.url.searchParams.get('practice') === 'true');

	// Direction slider for contextual mode (0-100, percentage of Arabic→English)
	let directionRatio = $state(50);

	// Load saved direction ratio from localStorage
	function loadDirectionRatio() {
		if (browser) {
			const saved = localStorage.getItem('arabico-direction-ratio');
			if (saved) {
				directionRatio = parseInt(saved, 10);
			}
		}
	}

	// Save direction ratio to localStorage
	function saveDirectionRatio() {
		if (browser) {
			localStorage.setItem('arabico-direction-ratio', directionRatio.toString());
		}
	}

	$effect(() => {
		// Save whenever ratio changes
		saveDirectionRatio();
	});

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
		loadDirectionRatio();
	});

	function startReview() {
		if (selectedMode) {
			const practiceParam = isPracticeMode ? '?practice=true' : '';
			goto(`/review/${selectedMode}${practiceParam}`);
		}
	}
</script>

<svelte:head>
	<title>Review - Arabico</title>
</svelte:head>

<!-- Decorative particle background throughout -->
<ThreeBackground position="center" size="full" intensity={0.4} class="review-particles" />

<div class="review-hub max-w-lg mx-auto space-y-8">
	<!-- Header with streak -->
	<header class="text-center space-y-4">
		<div class="flex items-center justify-between">
			<a href="/" class="nav-link">
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
					<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
				</svg>
			</a>
			<h1 class="text-2xl font-medium text-[var(--text-primary)]">
				{isPracticeMode ? 'Practice Mode' : 'Review'}
			</h1>
			<a href="/progress" class="nav-link" title="View Progress">
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
					<path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
				</svg>
			</a>
		</div>

		{#if isPracticeMode}
			<div class="practice-badge">
				Extra Practice - Not affecting SRS schedule
			</div>
		{/if}

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

		<!-- Direction slider for contextual mode -->
		{#if selectedMode === 'contextual'}
			<div class="direction-slider-container bg-[var(--bg-elevated)] rounded-xl p-4 border border-[var(--border-color)]">
				<div class="flex items-center justify-between mb-3">
					<label for="direction-slider" class="text-sm font-medium text-[var(--text-secondary)]">
						Review Direction
					</label>
					<span class="text-xs text-[var(--text-muted)] bg-[var(--bg-secondary)] px-2 py-1 rounded">
						{directionRatio}% Arabic → English
					</span>
				</div>

				<input
					id="direction-slider"
					type="range"
					min="0"
					max="100"
					step="10"
					bind:value={directionRatio}
					class="direction-slider w-full"
				/>

				<div class="flex justify-between text-xs text-[var(--text-muted)] mt-2">
					<span>English → Arabic</span>
					<span>Arabic → English</span>
				</div>

				<p class="text-xs text-[var(--text-muted)] mt-3 text-center">
					{#if directionRatio === 0}
						All cards will show English first (recall Arabic)
					{:else if directionRatio === 100}
						All cards will show Arabic first (recall meaning)
					{:else}
						Mixed: {directionRatio}% Arabic→English, {100 - directionRatio}% English→Arabic
					{/if}
				</p>
			</div>
		{/if}

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

			<div class="mt-6 flex flex-col gap-3">
				<a
					href="/surah/1"
					class="inline-block px-6 py-2 rounded-lg bg-[var(--accent-color)] text-white font-medium hover:bg-sepia-600 transition-colors"
				>
					Continue Reading
				</a>

				{#if reviewStore.canPracticeMore}
					<a
						href="/review?practice=true"
						class="inline-block px-6 py-2 rounded-lg border border-[var(--border-color)] text-[var(--text-primary)] font-medium hover:bg-[var(--bg-secondary)] transition-colors"
					>
						Practice More Words
					</a>
				{/if}
			</div>
		</div>
	{/if}

	<!-- Stats summary -->
	{#if engagement.totalWordsReviewed > 0}
		<div class="text-center text-sm text-[var(--text-muted)]">
			<p>Total words reviewed: <span class="font-medium">{engagement.totalWordsReviewed}</span></p>
		</div>
	{/if}
</div>

<style>
	.nav-link {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		border-radius: 10px;
		color: var(--text-secondary);
		transition: all 0.2s ease;
	}

	.nav-link:hover {
		background: var(--bg-secondary);
		color: var(--text-primary);
	}

	.practice-badge {
		display: inline-block;
		padding: 0.375rem 0.75rem;
		border-radius: 9999px;
		background: rgba(59, 130, 246, 0.1);
		color: #3b82f6;
		font-size: 0.75rem;
		font-weight: 500;
	}

	:global(.dark) .practice-badge {
		background: rgba(59, 130, 246, 0.2);
		color: #60a5fa;
	}

	.direction-slider {
		-webkit-appearance: none;
		appearance: none;
		height: 6px;
		border-radius: 3px;
		background: var(--bg-secondary);
		outline: none;
	}

	.direction-slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background: var(--accent-color);
		cursor: pointer;
		border: 2px solid white;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
		transition: transform 0.15s ease;
	}

	.direction-slider::-webkit-slider-thumb:hover {
		transform: scale(1.1);
	}

	.direction-slider::-moz-range-thumb {
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background: var(--accent-color);
		cursor: pointer;
		border: 2px solid white;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
	}

	.direction-slider-container {
		animation: slideIn 0.3s ease-out;
	}

	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* Particle styling for review page */
	:global(.review-particles) {
		opacity: 0.5;
		z-index: -1;
	}

	/* Hide particles on mobile */
	@media (max-width: 768px) {
		:global(.review-particles) {
			display: none;
		}
	}
</style>
