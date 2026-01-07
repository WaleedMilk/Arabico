<script lang="ts">
	interface Props {
		current: number;
		total: number;
		correct: number;
	}

	let { current, total, correct }: Props = $props();

	let progress = $derived(total > 0 ? (current / total) * 100 : 0);
	let accuracy = $derived(current > 0 ? Math.round((correct / current) * 100) : 0);
</script>

<div class="review-progress space-y-2">
	<!-- Progress bar -->
	<div class="h-2 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
		<div
			class="h-full bg-gold transition-all duration-300 ease-out"
			style="width: {progress}%"
		></div>
	</div>

	<!-- Stats row -->
	<div class="flex justify-between text-sm">
		<span class="text-[var(--text-muted)]">
			{current} / {total}
		</span>
		{#if current > 0}
			<span class="text-[var(--text-secondary)]">
				{correct} correct ({accuracy}%)
			</span>
		{/if}
	</div>
</div>
