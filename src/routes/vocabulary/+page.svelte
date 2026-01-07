<script lang="ts">
	import { onMount } from 'svelte';
	import { vocabulary } from '$lib/stores/vocabulary.svelte';
	import { reviewStore } from '$lib/stores/review.svelte';
	import { engagement } from '$lib/stores/engagement.svelte';
	import StreakDisplay from '$lib/components/review/StreakDisplay.svelte';
	import type { FamiliarityLevel } from '$lib/types';

	let stats = $state<Record<FamiliarityLevel, number>>({
		new: 0,
		seen: 0,
		learning: 0,
		known: 0,
		ignored: 0
	});

	let totalWords = $derived(stats.seen + stats.learning + stats.known);

	onMount(async () => {
		stats = await vocabulary.getStats();
		await reviewStore.init();
		await engagement.init();
	});
</script>

<svelte:head>
	<title>Vocabulary - Arabico</title>
</svelte:head>

<div class="space-y-8">
	<!-- Header with Streak -->
	<header class="text-center">
		<h1 class="text-2xl font-medium text-[var(--text-primary)] mb-2">Your Vocabulary</h1>
		<p class="text-[var(--text-muted)]">Track your Quranic Arabic word learning progress</p>

		{#if engagement.currentStreak > 0}
			<div class="mt-4">
				<StreakDisplay size="medium" />
			</div>
		{/if}
	</header>

	<!-- Review Call-to-Action -->
	{#if reviewStore.dueCount > 0 || stats.learning > 0 || stats.seen > 0}
		<div class="rounded-xl border-2 border-gold bg-gold/10 p-6">
			<div class="flex items-center justify-between">
				<div>
					<h2 class="text-lg font-medium text-[var(--text-primary)]">
						{#if reviewStore.dueCount > 0}
							{reviewStore.dueCount} {reviewStore.dueCount === 1 ? 'word' : 'words'} ready for review
						{:else}
							Start reviewing your vocabulary
						{/if}
					</h2>
					<p class="text-sm text-[var(--text-muted)] mt-1">
						Review words in their Quranic context for better retention
					</p>
				</div>
				<a
					href="/review"
					class="shrink-0 inline-flex items-center gap-2 rounded-lg bg-gold px-5 py-3 font-medium text-white transition-all hover:bg-gold/90 hover:scale-105"
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
					</svg>
					Start Review
				</a>
			</div>
		</div>
	{/if}

	<!-- Stats Cards -->
	<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
		<div class="rounded-lg border border-[var(--border-color)] bg-[var(--bg-elevated)] p-4">
			<div class="text-3xl font-medium text-[var(--text-primary)]">{totalWords}</div>
			<div class="text-sm text-[var(--text-muted)]">Total Words Encountered</div>
		</div>
		<div class="rounded-lg border border-[var(--border-color)] bg-[var(--bg-elevated)] p-4">
			<div class="text-3xl font-medium text-gold">{stats.learning}</div>
			<div class="text-sm text-[var(--text-muted)]">Learning</div>
		</div>
		<div class="rounded-lg border border-[var(--border-color)] bg-[var(--bg-elevated)] p-4">
			<div class="text-3xl font-medium text-green-600 dark:text-green-400">{stats.known}</div>
			<div class="text-sm text-[var(--text-muted)]">Known</div>
		</div>
		<div class="rounded-lg border border-[var(--border-color)] bg-[var(--bg-elevated)] p-4">
			<div class="text-3xl font-medium text-[var(--text-secondary)]">{stats.seen}</div>
			<div class="text-sm text-[var(--text-muted)]">Seen</div>
		</div>
	</div>

	<!-- Progress Bar -->
	{#if totalWords > 0}
		<div class="rounded-lg border border-[var(--border-color)] bg-[var(--bg-elevated)] p-6">
			<h2 class="text-lg font-medium text-[var(--text-primary)] mb-4">Progress Overview</h2>
			<div class="h-4 overflow-hidden rounded-full bg-sepia-100 dark:bg-sepia-800">
				<div class="flex h-full">
					{#if stats.known > 0}
						<div
							class="bg-green-500 dark:bg-green-600 transition-all"
							style="width: {(stats.known / totalWords) * 100}%"
						></div>
					{/if}
					{#if stats.learning > 0}
						<div
							class="bg-gold transition-all"
							style="width: {(stats.learning / totalWords) * 100}%"
						></div>
					{/if}
					{#if stats.seen > 0}
						<div
							class="bg-sepia-300 dark:bg-sepia-600 transition-all"
							style="width: {(stats.seen / totalWords) * 100}%"
						></div>
					{/if}
				</div>
			</div>
			<div class="mt-3 flex flex-wrap gap-4 text-sm">
				<div class="flex items-center gap-2">
					<div class="h-3 w-3 rounded-full bg-green-500"></div>
					<span class="text-[var(--text-muted)]">Known ({stats.known})</span>
				</div>
				<div class="flex items-center gap-2">
					<div class="h-3 w-3 rounded-full bg-gold"></div>
					<span class="text-[var(--text-muted)]">Learning ({stats.learning})</span>
				</div>
				<div class="flex items-center gap-2">
					<div class="h-3 w-3 rounded-full bg-sepia-300 dark:bg-sepia-600"></div>
					<span class="text-[var(--text-muted)]">Seen ({stats.seen})</span>
				</div>
			</div>
		</div>
	{/if}

	<!-- Empty State / Getting Started -->
	{#if totalWords === 0}
		<div class="rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] p-8 text-center">
			<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="mx-auto h-12 w-12 text-[var(--text-muted)] mb-4">
				<path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
			</svg>
			<h3 class="text-lg font-medium text-[var(--text-primary)] mb-2">Start Your Journey</h3>
			<p class="text-[var(--text-muted)] max-w-md mx-auto mb-4">
				Begin reading the Quran and tap on words to start building your vocabulary.
				Each word you encounter will be tracked here.
			</p>
			<a
				href="/surah/1"
				class="inline-flex items-center gap-2 rounded-lg bg-[var(--accent-color)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-sepia-600"
			>
				Start Reading Al-Fatihah
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="h-4 w-4">
					<path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
				</svg>
			</a>
		</div>
	{/if}

	<!-- How It Works Section -->
	<div class="rounded-lg border border-[var(--border-color)] bg-[var(--bg-elevated)] p-6">
		<h2 class="text-lg font-medium text-[var(--text-primary)] mb-4">How Contextual Review Works</h2>
		<div class="grid gap-4 sm:grid-cols-3">
			<div class="text-center">
				<div class="mx-auto w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center mb-2">
					<span class="text-xl">1</span>
				</div>
				<h3 class="font-medium text-[var(--text-primary)]">Read & Tap</h3>
				<p class="text-sm text-[var(--text-muted)]">Tap words while reading to mark them as seen</p>
			</div>
			<div class="text-center">
				<div class="mx-auto w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center mb-2">
					<span class="text-xl">2</span>
				</div>
				<h3 class="font-medium text-[var(--text-primary)]">Review in Context</h3>
				<p class="text-sm text-[var(--text-muted)]">Review words within their Quranic verses</p>
			</div>
			<div class="text-center">
				<div class="mx-auto w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center mb-2">
					<span class="text-xl">3</span>
				</div>
				<h3 class="font-medium text-[var(--text-primary)]">Build Mastery</h3>
				<p class="text-sm text-[var(--text-muted)]">Spaced repetition schedules optimal review times</p>
			</div>
		</div>
	</div>
</div>
