<script lang="ts">
	import { engagement } from '$lib/stores/engagement.svelte';

	interface Props {
		wordsReviewed: number;
		wordsCorrect: number;
		duration: number; // milliseconds
		onContinue: () => void;
		onReviewMore: () => void;
	}

	let { wordsReviewed, wordsCorrect, duration, onContinue, onReviewMore }: Props = $props();

	// Calculate stats
	let accuracy = $derived(
		wordsReviewed > 0 ? Math.round((wordsCorrect / wordsReviewed) * 100) : 0
	);
	let durationMinutes = $derived(Math.round(duration / 60000));
	let durationSeconds = $derived(Math.round((duration % 60000) / 1000));

	// Determine performance message
	let performanceMessage = $derived.by(() => {
		if (accuracy >= 90) return 'Excellent work!';
		if (accuracy >= 70) return 'Great progress!';
		if (accuracy >= 50) return 'Keep practicing!';
		return 'Every review helps!';
	});
</script>

<div class="review-complete bg-[var(--bg-elevated)] rounded-2xl shadow-lg p-8 text-center space-y-6">
	<!-- Success icon -->
	<div class="mx-auto w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
		<svg
			class="w-10 h-10 text-green-600 dark:text-green-400"
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

	<!-- Title -->
	<div>
		<h2 class="text-2xl font-medium text-[var(--text-primary)]">Session Complete!</h2>
		<p class="text-[var(--text-secondary)] mt-1">{performanceMessage}</p>
	</div>

	<!-- Stats grid -->
	<div class="grid grid-cols-3 gap-4">
		<div class="p-4 rounded-lg bg-[var(--bg-secondary)]">
			<div class="text-3xl font-bold text-[var(--text-primary)]">{wordsReviewed}</div>
			<div class="text-xs text-[var(--text-muted)]">Words Reviewed</div>
		</div>
		<div class="p-4 rounded-lg bg-[var(--bg-secondary)]">
			<div class="text-3xl font-bold text-green-600 dark:text-green-400">{accuracy}%</div>
			<div class="text-xs text-[var(--text-muted)]">Accuracy</div>
		</div>
		<div class="p-4 rounded-lg bg-[var(--bg-secondary)]">
			<div class="text-3xl font-bold text-[var(--text-primary)]">
				{#if durationMinutes > 0}
					{durationMinutes}m {durationSeconds}s
				{:else}
					{durationSeconds}s
				{/if}
			</div>
			<div class="text-xs text-[var(--text-muted)]">Duration</div>
		</div>
	</div>

	<!-- Streak display -->
	{#if engagement.currentStreak > 0}
		<div class="py-4 border-y border-[var(--border-color)]">
			<div class="flex items-center justify-center gap-2">
				<span class="text-2xl">🔥</span>
				<span class="text-xl font-medium text-gold">{engagement.currentStreak} Day Streak!</span>
			</div>
			<p class="text-sm text-[var(--text-muted)] mt-1">{engagement.getStreakMessage()}</p>
		</div>
	{/if}

	<!-- Action buttons -->
	<div class="space-y-3">
		<button
			onclick={onReviewMore}
			class="w-full py-3 rounded-xl bg-[var(--accent-color)] text-white font-medium
                   transition-all hover:bg-sepia-600 focus:outline-none focus:ring-2 focus:ring-gold"
		>
			Review More Words
		</button>
		<button
			onclick={onContinue}
			class="w-full py-3 rounded-xl border border-[var(--border-color)] text-[var(--text-secondary)]
                   font-medium transition-all hover:bg-[var(--bg-secondary)] focus:outline-none focus:ring-2 focus:ring-gold"
		>
			Done for Now
		</button>
	</div>
</div>
