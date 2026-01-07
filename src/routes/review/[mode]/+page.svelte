<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { engagement } from '$lib/stores/engagement.svelte';
	import ReviewSession from '$lib/components/review/ReviewSession.svelte';
	import type { ReviewMode } from '$lib/types';

	// Valid modes
	const validModes: ReviewMode[] = ['contextual', 'quick', 'recognition', 'recall'];

	// Parse mode from URL
	function parseMode(param: string | undefined): ReviewMode {
		if (param && validModes.includes(param as ReviewMode)) {
			return param as ReviewMode;
		}
		return 'contextual'; // Default
	}

	let mode = $derived(parseMode($page.params.mode));

	// Direction ratio for contextual mode (loaded from localStorage)
	let directionRatio = $state(50);

	// Mode titles for display
	const modeTitles: Record<ReviewMode, string> = {
		contextual: 'Contextual Review',
		quick: 'Quick Review',
		recognition: 'Recognition',
		recall: 'Recall'
	};

	onMount(async () => {
		await engagement.init();
		// Load direction ratio from localStorage
		if (browser) {
			const saved = localStorage.getItem('arabico-direction-ratio');
			if (saved) {
				directionRatio = parseInt(saved, 10);
			}
		}
	});

	function handleComplete() {
		goto('/review');
	}

	function handleBack() {
		goto('/review');
	}
</script>

<svelte:head>
	<title>{modeTitles[mode]} - Arabico</title>
</svelte:head>

<div class="review-page">
	<!-- Header -->
	<header class="flex items-center justify-between mb-6">
		<button
			onclick={handleBack}
			class="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
		>
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
			</svg>
			<span>Back</span>
		</button>

		<h1 class="text-lg font-medium text-[var(--text-primary)]">{modeTitles[mode]}</h1>

		<div class="w-16"></div> <!-- Spacer for centering -->
	</header>

	<!-- Review session -->
	<ReviewSession {mode} {directionRatio} onComplete={handleComplete} />
</div>
