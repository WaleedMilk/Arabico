<script lang="ts">
	import { reviewStore } from '$lib/stores/review.svelte';
	import { engagement } from '$lib/stores/engagement.svelte';
	import type { ReviewMode, ReviewQuality, ReviewDirection } from '$lib/types';
	import RecognitionCard from './RecognitionCard.svelte';
	import RecallCard from './RecallCard.svelte';
	import FlashCard from './FlashCard.svelte';
	import QualitySelector from './QualitySelector.svelte';
	import ReviewProgress from './ReviewProgress.svelte';
	import ReviewComplete from './ReviewComplete.svelte';

	interface Props {
		mode: ReviewMode;
		directionRatio?: number; // 0-100, percentage for arabic-to-english (contextual mode)
		onComplete: () => void;
	}

	let { mode, directionRatio = 50, onComplete }: Props = $props();

	// Determine card direction for contextual mode
	let currentDirection = $state<ReviewDirection>('arabic-to-english');

	function determineDirection(): ReviewDirection {
		if (mode !== 'contextual') return 'arabic-to-english';
		// Random based on ratio: if ratio is 70, 70% chance of arabic-to-english
		return Math.random() * 100 < directionRatio ? 'arabic-to-english' : 'english-to-arabic';
	}

	// Local state
	let showAnswer = $state(false);
	let cardShownTime = $state(Date.now());
	let sessionComplete = $state(false);
	let finalStats = $state<{
		wordsReviewed: number;
		wordsCorrect: number;
		duration: number;
		accuracy: number;
	} | null>(null);

	// Start session on mount
	$effect(() => {
		startSession();
	});

	async function startSession() {
		await reviewStore.startSession(mode);
		cardShownTime = Date.now();
		currentDirection = determineDirection();
	}

	async function handleQualitySelect(quality: ReviewQuality) {
		const responseTime = Date.now() - cardShownTime;

		await reviewStore.recordResponse(quality, responseTime);

		// Check if session is complete
		if (reviewStore.isComplete) {
			await finishSession();
		} else {
			// Move to next card
			showAnswer = false;
			cardShownTime = Date.now();
			currentDirection = determineDirection();
		}
	}

	async function finishSession() {
		const stats = await reviewStore.completeSession();
		if (stats) {
			finalStats = stats;

			// Update streak
			await engagement.updateStreak();
			await engagement.addWordsReviewed(stats.wordsReviewed);
		}
		sessionComplete = true;
	}

	function handleReveal() {
		showAnswer = true;
	}

	async function handleReviewMore() {
		sessionComplete = false;
		finalStats = null;
		showAnswer = false;
		await startSession();
	}

	function handleDone() {
		reviewStore.resetSession();
		onComplete();
	}
</script>

<div class="review-session max-w-lg mx-auto space-y-6">
	{#if reviewStore.isLoading}
		<!-- Loading state -->
		<div class="text-center py-12">
			<div
				class="inline-block w-8 h-8 border-4 border-gold border-t-transparent rounded-full animate-spin"
			></div>
			<p class="mt-4 text-[var(--text-muted)]">Preparing review session...</p>
		</div>
	{:else if sessionComplete && finalStats}
		<!-- Session complete -->
		<ReviewComplete
			wordsReviewed={finalStats.wordsReviewed}
			wordsCorrect={finalStats.wordsCorrect}
			duration={finalStats.duration}
			onContinue={handleDone}
			onReviewMore={handleReviewMore}
		/>
	{:else if reviewStore.queue.length === 0}
		<!-- No words to review -->
		<div class="text-center py-12 bg-[var(--bg-elevated)] rounded-2xl">
			<div class="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
				<svg
					class="w-8 h-8 text-green-600 dark:text-green-400"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M5 13l4 4L19 7"
					/>
				</svg>
			</div>
			<h2 class="text-xl font-medium text-[var(--text-primary)]">All Caught Up!</h2>
			<p class="text-[var(--text-muted)] mt-2">No words due for review right now.</p>
			<p class="text-sm text-[var(--text-muted)] mt-1">Read more to add words to your vocabulary.</p>
			<button
				onclick={handleDone}
				class="mt-6 px-6 py-2 rounded-lg bg-[var(--accent-color)] text-white font-medium
                       hover:bg-sepia-600 transition-colors"
			>
				Continue Reading
			</button>
		</div>
	{:else if reviewStore.currentCard}
		<!-- Active review -->
		<ReviewProgress
			current={reviewStore.currentIndex + 1}
			total={reviewStore.queue.length}
			correct={reviewStore.sessionStats.correct}
		/>

		<!-- Mode-based card rendering -->
		{#if mode === 'quick'}
			<FlashCard
				cardData={reviewStore.currentCard}
				{showAnswer}
				onReveal={handleReveal}
			/>
		{:else if mode === 'recall' || (mode === 'contextual' && currentDirection === 'english-to-arabic')}
			<RecallCard
				cardData={reviewStore.currentCard}
				{showAnswer}
				onReveal={handleReveal}
			/>
		{:else}
			<RecognitionCard
				cardData={reviewStore.currentCard}
				{showAnswer}
				onReveal={handleReveal}
			/>
		{/if}

		{#if showAnswer}
			<QualitySelector onSelect={handleQualitySelect} />
		{/if}

		<!-- Skip button -->
		<div class="text-center">
			<button
				onclick={() => {
					reviewStore.skipWord();
					showAnswer = false;
					cardShownTime = Date.now();
					if (reviewStore.isComplete) finishSession();
				}}
				class="text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
			>
				Skip this word
			</button>
		</div>
	{/if}
</div>
