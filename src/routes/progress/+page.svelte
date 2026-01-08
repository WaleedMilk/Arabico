<script lang="ts">
	/**
	 * Progress Page
	 *
	 * Shows user learning progress with:
	 * - Stage counts (new, learning, young, mature)
	 * - Review timeline forecast
	 * - Streak info
	 * - Practice mode access
	 */

	import { onMount } from 'svelte';
	import { reviewStore } from '$lib/stores/review.svelte';
	import ReviewTimeline from '$lib/components/review/ReviewTimeline.svelte';
	import type { ReviewStage } from '$lib/types';

	let isLoading = $state(true);

	onMount(async () => {
		await reviewStore.init();
		isLoading = false;
	});

	// Stage labels and colors
	const stageInfo: Record<ReviewStage, { label: string; color: string; description: string }> = {
		new: {
			label: 'New',
			color: 'var(--color-gold, #c4a962)',
			description: 'Words you haven\'t reviewed yet'
		},
		learning: {
			label: 'Learning',
			color: '#f59e0b',
			description: 'In active learning (short intervals)'
		},
		young: {
			label: 'Young',
			color: '#3b82f6',
			description: 'Graduated but still strengthening'
		},
		mature: {
			label: 'Mature',
			color: '#22c55e',
			description: 'Well established in memory'
		},
		suspended: {
			label: 'Suspended',
			color: '#6b7280',
			description: 'Paused from reviews'
		}
	};

	// Calculate total words
	const totalWords = $derived(
		Object.values(reviewStore.stageCounts).reduce((sum, count) => sum + count, 0)
	);

	// Get percentage for a stage
	function getPercentage(count: number): number {
		return totalWords > 0 ? (count / totalWords) * 100 : 0;
	}
</script>

<svelte:head>
	<title>Progress - Arabico</title>
</svelte:head>

<div class="progress-page">
	<header class="page-header">
		<a href="/" class="back-link">
			<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
				<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
			</svg>
		</a>
		<h1>Your Progress</h1>
	</header>

	{#if isLoading}
		<div class="loading-state">
			<div class="spinner"></div>
			<p>Loading your progress...</p>
		</div>
	{:else}
		<div class="content">
			<!-- Summary Cards -->
			<div class="summary-section">
				<div class="summary-card total">
					<span class="card-value">{totalWords}</span>
					<span class="card-label">Total Words</span>
				</div>
				<div class="summary-card due">
					<span class="card-value">{reviewStore.dueCount}</span>
					<span class="card-label">Due Today</span>
				</div>
			</div>

			<!-- Stage Breakdown -->
			<section class="stages-section">
				<h2>Learning Stages</h2>
				<div class="stages-bar">
					{#each ['mature', 'young', 'learning', 'new'] as stage}
						{@const count = reviewStore.stageCounts[stage as ReviewStage]}
						{@const info = stageInfo[stage as ReviewStage]}
						{#if count > 0}
							<div
								class="stage-segment"
								style="flex: {count}; background: {info.color}"
								title="{info.label}: {count} words"
							></div>
						{/if}
					{/each}
				</div>
				<div class="stages-grid">
					{#each Object.entries(stageInfo) as [stage, info]}
						{@const count = reviewStore.stageCounts[stage as ReviewStage]}
						{#if stage !== 'suspended' || count > 0}
							<div class="stage-item">
								<div class="stage-header">
									<span class="stage-dot" style="background: {info.color}"></span>
									<span class="stage-label">{info.label}</span>
								</div>
								<span class="stage-count">{count}</span>
								<span class="stage-percent">{getPercentage(count).toFixed(1)}%</span>
								<p class="stage-desc">{info.description}</p>
							</div>
						{/if}
					{/each}
				</div>
			</section>

			<!-- Review Timeline -->
			<section class="timeline-section">
				<h2>Review Schedule</h2>
				<ReviewTimeline forecast={reviewStore.forecast} maxDays={14} />
			</section>

			<!-- Action Buttons -->
			<section class="actions-section">
				{#if reviewStore.dueCount > 0}
					<a href="/review" class="action-btn primary">
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
							<path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
						</svg>
						Start Review ({reviewStore.dueCount} due)
					</a>
				{:else}
					<div class="all-done-message">
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8">
							<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
						<p>All reviews done for now!</p>
					</div>
				{/if}

				{#if reviewStore.canPracticeMore && totalWords > 0}
					<a href="/review?practice=true" class="action-btn secondary">
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
							<path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
						</svg>
						Practice More
					</a>
				{/if}
			</section>
		</div>
	{/if}
</div>

<style>
	.progress-page {
		min-height: 100vh;
		background: var(--bg-primary);
		padding-bottom: 2rem;
	}

	.page-header {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem 1.5rem;
		background: var(--bg-elevated);
		border-bottom: 1px solid var(--border-color);
		position: sticky;
		top: 0;
		z-index: 10;
	}

	.back-link {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		border-radius: 10px;
		color: var(--text-secondary);
		transition: all 0.2s ease;
	}

	.back-link:hover {
		background: var(--bg-secondary);
		color: var(--text-primary);
	}

	.page-header h1 {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0;
	}

	.loading-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 4rem 2rem;
		gap: 1rem;
		color: var(--text-secondary);
	}

	.spinner {
		width: 32px;
		height: 32px;
		border: 3px solid var(--border-color);
		border-top-color: var(--color-gold, #c4a962);
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.content {
		max-width: 600px;
		margin: 0 auto;
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	/* Summary Cards */
	.summary-section {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}

	.summary-card {
		background: var(--surface-secondary);
		border-radius: 12px;
		padding: 1.25rem;
		text-align: center;
	}

	.summary-card.total {
		background: linear-gradient(135deg, var(--color-gold, #c4a962) 0%, #a08540 100%);
		color: white;
	}

	.summary-card.due {
		background: var(--surface-secondary);
	}

	.card-value {
		display: block;
		font-size: 2rem;
		font-weight: 700;
		line-height: 1.2;
	}

	.card-label {
		display: block;
		font-size: 0.8rem;
		opacity: 0.8;
		margin-top: 0.25rem;
	}

	/* Stages Section */
	.stages-section h2,
	.timeline-section h2 {
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0 0 1rem 0;
	}

	.stages-bar {
		display: flex;
		height: 12px;
		border-radius: 6px;
		overflow: hidden;
		background: var(--surface-secondary);
		margin-bottom: 1rem;
	}

	.stage-segment {
		min-width: 4px;
		transition: flex 0.3s ease;
	}

	.stages-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.75rem;
	}

	.stage-item {
		background: var(--surface-secondary);
		border-radius: 10px;
		padding: 0.875rem;
	}

	.stage-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.25rem;
	}

	.stage-dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
	}

	.stage-label {
		font-size: 0.85rem;
		font-weight: 500;
		color: var(--text-primary);
	}

	.stage-count {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--text-primary);
		display: block;
	}

	.stage-percent {
		font-size: 0.75rem;
		color: var(--text-secondary);
	}

	.stage-desc {
		font-size: 0.7rem;
		color: var(--text-tertiary);
		margin: 0.25rem 0 0 0;
		line-height: 1.3;
	}

	/* Actions Section */
	.actions-section {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin-top: 0.5rem;
	}

	.action-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 1rem;
		border-radius: 12px;
		font-size: 1rem;
		font-weight: 500;
		text-decoration: none;
		transition: all 0.2s ease;
	}

	.action-btn.primary {
		background: var(--color-gold, #c4a962);
		color: white;
	}

	.action-btn.primary:hover {
		background: #a08540;
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	.action-btn.secondary {
		background: var(--surface-secondary);
		color: var(--text-primary);
		border: 1px solid var(--border-color);
	}

	.action-btn.secondary:hover {
		background: var(--surface-tertiary);
	}

	.all-done-message {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding: 1.5rem;
		background: rgba(34, 197, 94, 0.1);
		border-radius: 12px;
		color: #22c55e;
		text-align: center;
	}

	.all-done-message p {
		margin: 0;
		font-weight: 500;
	}

	/* Responsive */
	@media (max-width: 480px) {
		.stages-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
