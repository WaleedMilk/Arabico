<script lang="ts">
	import type { TestResult, TestWord, FSRSRatingType } from '$lib/types';

	interface Props {
		result: TestResult;
		title?: string;
		onRetake?: () => void;
	}

	let { result, title, onRetake }: Props = $props();

	const ratingLabels: Record<number, string> = { 1: 'Again', 2: 'Hard', 3: 'Good', 4: 'Easy' };
	const ratingColors: Record<number, string> = {
		1: 'var(--color-again, #dc2626)',
		2: 'var(--color-hard, #ea580c)',
		3: 'var(--color-good, #16a34a)',
		4: 'var(--color-easy, #2563eb)',
	};

	let scoreColor = $derived(
		result.overallScore >= 67 ? '#16a34a' : result.overallScore >= 33 ? '#ea580c' : '#dc2626'
	);

	let formattedDuration = $derived(() => {
		const totalSeconds = Math.floor(result.duration / 1000);
		const minutes = Math.floor(totalSeconds / 60);
		const seconds = totalSeconds % 60;
		if (minutes === 0) return `${seconds}s`;
		return `${minutes}m ${seconds}s`;
	});

	let formattedDate = $derived(
		result.endTime.toLocaleDateString('en-US', {
			weekday: 'short',
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		})
	);

	// Count ratings by type
	let ratingCounts = $derived(() => {
		const counts = { 1: 0, 2: 0, 3: 0, 4: 0 };
		for (const [, rating] of result.ratings) {
			counts[rating]++;
		}
		return counts;
	});

	// SVG circle properties for score ring
	const circumference = 2 * Math.PI * 54;
	let strokeOffset = $derived(circumference - (result.overallScore / 100) * circumference);
</script>

<div class="report" id="test-result-report">
	<!-- Header -->
	<div class="report-header">
		<span class="report-brand">Arabico</span>
		<h2 class="report-title">{title || 'Vocabulary Test'}</h2>
		<p class="report-date">{formattedDate}</p>
	</div>

	<!-- Score Ring -->
	<div class="score-section">
		<div class="score-ring">
			<svg viewBox="0 0 120 120" class="ring-svg">
				<circle cx="60" cy="60" r="54" fill="none" stroke="var(--border-color)" stroke-width="8" />
				<circle
					cx="60" cy="60" r="54"
					fill="none"
					stroke={scoreColor}
					stroke-width="8"
					stroke-linecap="round"
					stroke-dasharray={circumference}
					stroke-dashoffset={strokeOffset}
					transform="rotate(-90 60 60)"
					class="score-arc"
				/>
			</svg>
			<div class="score-value">
				<span class="score-number" style="color: {scoreColor}">{result.overallScore}</span>
				<span class="score-percent">%</span>
			</div>
		</div>
		<p class="score-label">Overall Confidence</p>
	</div>

	<!-- Stats Row -->
	<div class="stats-row">
		<div class="stat">
			<span class="stat-value">{result.totalWords}</span>
			<span class="stat-label">Words</span>
		</div>
		<div class="stat">
			<span class="stat-value">{formattedDuration()}</span>
			<span class="stat-label">Duration</span>
		</div>
		<div class="stat">
			<span class="stat-value">{result.problemWords.length}</span>
			<span class="stat-label">Needs Work</span>
		</div>
	</div>

	<!-- Rating Distribution -->
	<div class="distribution">
		<h3 class="section-title">Rating Breakdown</h3>
		<div class="dist-bars">
			{#each [4, 3, 2, 1] as rating}
				{@const count = ratingCounts()[rating as FSRSRatingType]}
				{@const pct = result.totalWords > 0 ? Math.round((count / result.totalWords) * 100) : 0}
				<div class="dist-row">
					<span class="dist-label" style="color: {ratingColors[rating]}">{ratingLabels[rating]}</span>
					<div class="dist-bar-track">
						<div
							class="dist-bar-fill"
							style="width: {pct}%; background: {ratingColors[rating]}"
						></div>
					</div>
					<span class="dist-count">{count}</span>
				</div>
			{/each}
		</div>
	</div>

	<!-- Problem Words -->
	{#if result.problemWords.length > 0}
		<div class="problem-words">
			<h3 class="section-title">Words to Review</h3>
			<div class="word-list">
				{#each result.problemWords as word}
					<div class="word-item">
						<span class="word-arabic">{word.arabic}</span>
						<div class="word-details">
							<span class="word-translation">{word.translation || '—'}</span>
							<span class="word-ref">{word.ayahRef}</span>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Footer / Actions -->
	{#if onRetake}
		<div class="report-actions">
			<button onclick={onRetake} class="retake-btn">Take Again</button>
		</div>
	{/if}
</div>

<style>
	.report {
		max-width: 28rem;
		margin: 0 auto;
		padding: 1.5rem;
		border-radius: 16px;
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
	}

	.report-header {
		text-align: center;
		margin-bottom: 1.5rem;
	}

	.report-brand {
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--accent-color);
	}

	.report-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0.25rem 0;
	}

	.report-date {
		font-size: 0.8rem;
		color: var(--text-muted);
	}

	/* Score Ring */
	.score-section {
		display: flex;
		flex-direction: column;
		align-items: center;
		margin-bottom: 1.5rem;
	}

	.score-ring {
		position: relative;
		width: 120px;
		height: 120px;
	}

	.ring-svg {
		width: 100%;
		height: 100%;
	}

	.score-arc {
		transition: stroke-dashoffset 0.8s ease-out;
	}

	.score-value {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.score-number {
		font-size: 2rem;
		font-weight: 700;
		line-height: 1;
	}

	.score-percent {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-muted);
		margin-top: 0.25rem;
	}

	.score-label {
		font-size: 0.8rem;
		color: var(--text-muted);
		margin-top: 0.5rem;
	}

	/* Stats */
	.stats-row {
		display: flex;
		justify-content: center;
		gap: 2rem;
		padding: 1rem 0;
		border-top: 1px solid var(--border-color);
		border-bottom: 1px solid var(--border-color);
		margin-bottom: 1.5rem;
	}

	.stat {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.stat-value {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.stat-label {
		font-size: 0.7rem;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	/* Distribution */
	.section-title {
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 0.75rem;
	}

	.distribution {
		margin-bottom: 1.5rem;
	}

	.dist-bars {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.dist-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.dist-label {
		width: 3rem;
		font-size: 0.75rem;
		font-weight: 600;
		text-align: right;
	}

	.dist-bar-track {
		flex: 1;
		height: 8px;
		background: var(--bg-primary);
		border-radius: 4px;
		overflow: hidden;
	}

	.dist-bar-fill {
		height: 100%;
		border-radius: 4px;
		transition: width 0.6s ease-out;
	}

	.dist-count {
		width: 1.5rem;
		font-size: 0.75rem;
		color: var(--text-muted);
		text-align: right;
	}

	/* Problem words */
	.problem-words {
		margin-bottom: 1rem;
	}

	.word-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.word-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.5rem 0.75rem;
		background: var(--bg-primary);
		border-radius: 8px;
		border: 1px solid var(--border-color);
	}

	.word-arabic {
		font-family: var(--font-arabic, 'Amiri', serif);
		font-size: 1.25rem;
		color: var(--text-primary);
		min-width: 4rem;
		text-align: center;
	}

	.word-details {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.word-translation {
		font-size: 0.8rem;
		color: var(--text-secondary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.word-ref {
		font-size: 0.65rem;
		color: var(--text-muted);
	}

	/* Actions */
	.report-actions {
		display: flex;
		justify-content: center;
		padding-top: 1rem;
		border-top: 1px solid var(--border-color);
	}

	.retake-btn {
		padding: 0.5rem 1.5rem;
		border-radius: 8px;
		font-size: 0.875rem;
		font-weight: 500;
		color: white;
		background: var(--accent-color);
		border: none;
		cursor: pointer;
		transition: opacity 0.2s;
	}

	.retake-btn:hover {
		opacity: 0.85;
	}
</style>
