<script lang="ts">
	/**
	 * ReviewTimeline Component
	 *
	 * Displays a horizontal bar chart showing upcoming reviews for the next N days.
	 * Each bar represents a day, with height proportional to review count.
	 * Color-coded by review stage (learning, young, mature).
	 */

	import type { ReviewForecast, ReviewStage } from '$lib/types';

	interface Props {
		forecast: ReviewForecast[];
		maxDays?: number;
	}

	let { forecast, maxDays = 14 }: Props = $props();

	// Get max count for scaling bars
	const maxCount = $derived(Math.max(...forecast.map((f) => f.dueCount), 1));

	// Day labels (short format)
	const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

	// Get day label for a date
	function getDayLabel(dateStr: string, index: number): string {
		if (index === 0) return 'Today';
		if (index === 1) return 'Tmrw';
		const date = new Date(dateStr);
		return dayLabels[date.getDay()];
	}

	// Stage colors
	const stageColors: Record<ReviewStage, string> = {
		new: 'var(--color-gold, #c4a962)',
		learning: '#f59e0b',
		young: '#3b82f6',
		mature: '#22c55e',
		suspended: '#6b7280'
	};

	// Get stage breakdown for a day
	function getStageCounts(words: Array<{ id: string; stage: ReviewStage }>): Record<ReviewStage, number> {
		const counts: Record<ReviewStage, number> = {
			new: 0,
			learning: 0,
			young: 0,
			mature: 0,
			suspended: 0
		};
		for (const word of words) {
			counts[word.stage]++;
		}
		return counts;
	}
</script>

<div class="review-timeline">
	<div class="timeline-header">
		<h3 class="timeline-title">Upcoming Reviews</h3>
		<span class="timeline-subtitle">Next {maxDays} days</span>
	</div>

	<div class="timeline-chart">
		{#each forecast.slice(0, maxDays) as day, index}
			{@const stageCounts = getStageCounts(day.words)}
			{@const barHeight = (day.dueCount / maxCount) * 100}

			<div class="day-column" class:today={index === 0}>
				<div class="bar-container">
					{#if day.dueCount > 0}
						<div
							class="bar"
							style="height: {Math.max(barHeight, 8)}%"
							title="{day.dueCount} reviews"
						>
							<!-- Stacked segments -->
							{#each ['mature', 'young', 'learning', 'new'] as stage}
								{@const count = stageCounts[stage as ReviewStage]}
								{#if count > 0}
									<div
										class="bar-segment"
										style="flex: {count}; background: {stageColors[stage as ReviewStage]}"
									></div>
								{/if}
							{/each}
						</div>
					{:else}
						<div class="bar empty"></div>
					{/if}
				</div>
				<span class="count-label">{day.dueCount || '-'}</span>
				<span class="day-label">{getDayLabel(day.date, index)}</span>
			</div>
		{/each}
	</div>

	<!-- Legend -->
	<div class="timeline-legend">
		<div class="legend-item">
			<span class="legend-dot" style="background: {stageColors.new}"></span>
			<span>New</span>
		</div>
		<div class="legend-item">
			<span class="legend-dot" style="background: {stageColors.learning}"></span>
			<span>Learning</span>
		</div>
		<div class="legend-item">
			<span class="legend-dot" style="background: {stageColors.young}"></span>
			<span>Young</span>
		</div>
		<div class="legend-item">
			<span class="legend-dot" style="background: {stageColors.mature}"></span>
			<span>Mature</span>
		</div>
	</div>
</div>

<style>
	.review-timeline {
		background: var(--surface-secondary, #f5f5f5);
		border-radius: 12px;
		padding: 1.25rem;
	}

	:global(.dark) .review-timeline {
		background: var(--surface-secondary, #2a2a2a);
	}

	.timeline-header {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		margin-bottom: 1rem;
	}

	.timeline-title {
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0;
	}

	.timeline-subtitle {
		font-size: 0.75rem;
		color: var(--text-secondary);
	}

	.timeline-chart {
		display: flex;
		gap: 4px;
		height: 120px;
		align-items: flex-end;
	}

	.day-column {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
		min-width: 0;
	}

	.day-column.today {
		background: rgba(var(--color-gold-rgb, 196, 169, 98), 0.1);
		border-radius: 6px;
		padding: 4px 2px;
		margin: -4px -2px;
	}

	.bar-container {
		flex: 1;
		width: 100%;
		display: flex;
		align-items: flex-end;
		justify-content: center;
	}

	.bar {
		width: 100%;
		max-width: 24px;
		min-height: 4px;
		border-radius: 4px 4px 0 0;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		transition: height 0.3s ease;
	}

	.bar.empty {
		height: 4px;
		background: var(--border-color, #ddd);
		opacity: 0.3;
	}

	.bar-segment {
		min-height: 2px;
		transition: flex 0.3s ease;
	}

	.count-label {
		font-size: 0.7rem;
		font-weight: 600;
		color: var(--text-primary);
		min-height: 14px;
	}

	.day-label {
		font-size: 0.6rem;
		color: var(--text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.02em;
	}

	.timeline-legend {
		display: flex;
		justify-content: center;
		gap: 1rem;
		margin-top: 1rem;
		padding-top: 0.75rem;
		border-top: 1px solid var(--border-color, #ddd);
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 4px;
		font-size: 0.7rem;
		color: var(--text-secondary);
	}

	.legend-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
	}

	/* Responsive */
	@media (max-width: 640px) {
		.timeline-chart {
			height: 80px;
		}

		.day-column:nth-child(n + 8) {
			display: none;
		}

		.timeline-legend {
			flex-wrap: wrap;
			gap: 0.5rem;
		}
	}
</style>
