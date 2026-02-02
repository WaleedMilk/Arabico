<script lang="ts">
	interface Props {
		onSelect: (rating: 1 | 2 | 3 | 4) => void;
		intervals?: { again: string; hard: string; good: string; easy: string };
		disabled?: boolean;
	}

	let { onSelect, intervals, disabled = false }: Props = $props();

	const ratings = [
		{ value: 1 as const, label: 'Again', sublabel: 'Forgot', color: 'rating-again' },
		{ value: 2 as const, label: 'Hard', sublabel: 'Struggled', color: 'rating-hard' },
		{ value: 3 as const, label: 'Good', sublabel: 'Recalled', color: 'rating-good' },
		{ value: 4 as const, label: 'Easy', sublabel: 'Effortless', color: 'rating-easy' },
	];

	function handleKeydown(event: KeyboardEvent) {
		const key = parseInt(event.key);
		if (key >= 1 && key <= 4 && !disabled) {
			onSelect(key as 1 | 2 | 3 | 4);
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="rating-selector">
	{#each ratings as r}
		<button
			onclick={() => onSelect(r.value)}
			class="rating-btn {r.color}"
			{disabled}
		>
			<span class="rating-label">{r.label}</span>
			{#if intervals}
				<span class="rating-interval">{intervals[r.label.toLowerCase() as keyof typeof intervals]}</span>
			{/if}
			<span class="rating-sublabel">{r.sublabel}</span>
		</button>
	{/each}
	<p class="rating-hint">Press 1-4 to rate</p>
</div>

<style>
	.rating-selector {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
		justify-content: center;
		padding: 0.5rem 0;
	}

	.rating-btn {
		flex: 1;
		min-width: 70px;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		padding: 0.75rem 0.5rem;
		border-radius: 12px;
		border: 1px solid var(--border-color);
		background: var(--bg-secondary);
		transition: all 0.2s ease;
		cursor: pointer;
	}

	.rating-btn:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.rating-btn:active:not(:disabled) {
		transform: scale(0.97);
	}

	.rating-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.rating-label {
		font-size: 0.875rem;
		font-weight: 600;
	}

	.rating-interval {
		font-size: 0.7rem;
		color: var(--text-muted);
	}

	.rating-sublabel {
		font-size: 0.65rem;
		color: var(--text-muted);
	}

	.rating-hint {
		width: 100%;
		text-align: center;
		font-size: 0.65rem;
		color: var(--text-muted);
		margin-top: 0.25rem;
	}

	.rating-again {
		border-color: rgba(220, 38, 38, 0.3);
	}
	.rating-again:hover:not(:disabled) {
		background: rgba(220, 38, 38, 0.1);
		border-color: rgba(220, 38, 38, 0.5);
	}

	.rating-hard {
		border-color: rgba(234, 88, 12, 0.3);
	}
	.rating-hard:hover:not(:disabled) {
		background: rgba(234, 88, 12, 0.1);
		border-color: rgba(234, 88, 12, 0.5);
	}

	.rating-good {
		border-color: rgba(22, 163, 74, 0.3);
	}
	.rating-good:hover:not(:disabled) {
		background: rgba(22, 163, 74, 0.1);
		border-color: rgba(22, 163, 74, 0.5);
	}

	.rating-easy {
		border-color: rgba(37, 99, 235, 0.3);
	}
	.rating-easy:hover:not(:disabled) {
		background: rgba(37, 99, 235, 0.1);
		border-color: rgba(37, 99, 235, 0.5);
	}

	:global(.dark) .rating-btn {
		background: var(--bg-elevated);
	}
</style>
