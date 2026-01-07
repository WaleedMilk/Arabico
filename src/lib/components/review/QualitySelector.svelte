<script lang="ts">
	import type { ReviewQuality } from '$lib/types';

	interface Props {
		onSelect: (quality: ReviewQuality) => void;
	}

	let { onSelect }: Props = $props();

	const qualities: { value: ReviewQuality; label: string; description: string; color: string }[] = [
		{ value: 1, label: '1', description: 'Complete blackout', color: 'bg-red-500' },
		{ value: 2, label: '2', description: 'Wrong, but recognized', color: 'bg-orange-500' },
		{ value: 3, label: '3', description: 'Correct with difficulty', color: 'bg-yellow-500' },
		{ value: 4, label: '4', description: 'Correct with hesitation', color: 'bg-lime-500' },
		{ value: 5, label: '5', description: 'Perfect recall', color: 'bg-green-500' }
	];

	let hoveredQuality = $state<ReviewQuality | null>(null);
</script>

<div class="quality-selector space-y-3">
	<p class="text-center text-sm text-[var(--text-muted)]">How well did you remember?</p>

	<div class="flex justify-center gap-2">
		{#each qualities as q}
			<button
				onclick={() => onSelect(q.value)}
				onmouseenter={() => (hoveredQuality = q.value)}
				onmouseleave={() => (hoveredQuality = null)}
				class="relative w-12 h-12 rounded-lg {q.color} text-white font-bold text-lg
                       transition-all hover:scale-110 hover:shadow-lg focus:outline-none
                       focus:ring-2 focus:ring-offset-2 focus:ring-gold"
				aria-label="{q.label} - {q.description}"
			>
				{q.label}
			</button>
		{/each}
	</div>

	<!-- Description on hover -->
	<div class="h-6 text-center text-sm text-[var(--text-secondary)]">
		{#if hoveredQuality !== null}
			{qualities.find((q) => q.value === hoveredQuality)?.description}
		{:else}
			<span class="text-[var(--text-muted)]">Tap a number to rate</span>
		{/if}
	</div>
</div>
