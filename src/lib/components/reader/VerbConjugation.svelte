<script lang="ts">
	/**
	 * VerbConjugation Component
	 *
	 * Displays a visual breakdown of how an Arabic verb is conjugated from its root.
	 * Shows prefix, root stem, and suffix with color-coding.
	 */

	import type { VerbInfo } from '$lib/types';

	interface Props {
		verbInfo: VerbInfo;
		conjugatedForm: string; // The actual word as it appears
		compact?: boolean; // Compact mode for review cards
	}

	let { verbInfo, conjugatedForm, compact = false }: Props = $props();

	// Form type labels
	const formTypeLabels: Record<string, string> = {
		past: 'Past tense',
		imperfect: 'Present/Future',
		imperative: 'Command',
		activeParticiple: 'Active participle',
		verbalNoun: 'Verbal noun',
		conjugated: 'Conjugated form'
	};

	// Get the form label
	const formLabel = $derived(formTypeLabels[verbInfo.matchedForm] || verbInfo.matchedForm);
</script>

{#if compact}
	<!-- Compact mode for review cards -->
	<div class="verb-conjugation-compact">
		<div class="root-info">
			<span class="root-letters">{verbInfo.root}</span>
			<span class="root-meaning">"{verbInfo.meaning}"</span>
		</div>
		<div class="form-info">
			<span class="form-label">{formLabel}</span>
		</div>
	</div>
{:else}
	<!-- Full mode for word detail panel -->
	<div class="verb-conjugation">
		<div class="conjugation-header">
			<span class="conjugated-word">{conjugatedForm}</span>
			<span class="arrow">→</span>
			<span class="meaning">"{verbInfo.meaning}"</span>
		</div>

		<div class="root-section">
			<div class="root-label">Root:</div>
			<div class="root-display">
				<span class="root-letters">{verbInfo.root}</span>
				<span class="root-form">({verbInfo.rootForm})</span>
			</div>
		</div>

		<div class="breakdown-section">
			<div class="breakdown-label">Breakdown:</div>
			<div class="breakdown-visual">
				<div class="breakdown-box">
					<span class="conjugated-full">{conjugatedForm}</span>
				</div>
			</div>
		</div>

		<div class="form-section">
			<div class="form-details">
				<span class="base-form-label">Base form:</span>
				<span class="base-form">{verbInfo.baseForm}</span>
				<span class="form-type">({formLabel})</span>
			</div>
		</div>
	</div>
{/if}

<style>
	.verb-conjugation {
		background: var(--surface-secondary, #f5f5f5);
		border-radius: 8px;
		padding: 1rem;
		font-size: 0.9rem;
		margin-top: 0.5rem;
	}

	:global(.dark) .verb-conjugation {
		background: var(--surface-secondary, #2a2a2a);
	}

	.conjugation-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 1rem;
		font-size: 1.1rem;
	}

	.conjugated-word {
		font-family: var(--font-arabic, 'Amiri', serif);
		font-size: 1.4rem;
		color: var(--text-primary);
		direction: rtl;
	}

	.arrow {
		color: var(--text-secondary);
	}

	.meaning {
		color: var(--accent-gold, #c4a962);
		font-style: italic;
	}

	.root-section,
	.breakdown-section,
	.form-section {
		margin-bottom: 0.75rem;
	}

	.root-label,
	.breakdown-label {
		font-size: 0.8rem;
		color: var(--text-secondary);
		margin-bottom: 0.25rem;
	}

	.root-display {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.root-letters {
		font-family: var(--font-arabic, 'Amiri', serif);
		font-size: 1.2rem;
		color: var(--accent-gold, #c4a962);
		letter-spacing: 0.2em;
		direction: rtl;
	}

	.root-form {
		font-family: var(--font-arabic, 'Amiri', serif);
		font-size: 1rem;
		color: var(--text-secondary);
		direction: rtl;
	}

	.breakdown-visual {
		display: flex;
		justify-content: center;
	}

	.breakdown-box {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.75rem 1.5rem;
		background: var(--surface-tertiary, #e8e8e8);
		border-radius: 6px;
		border: 1px solid var(--border-color, #ddd);
	}

	:global(.dark) .breakdown-box {
		background: var(--surface-tertiary, #333);
		border-color: var(--border-color, #444);
	}

	.conjugated-full {
		font-family: var(--font-arabic, 'Amiri', serif);
		font-size: 1.6rem;
		direction: rtl;
		color: var(--text-primary);
	}

	.form-details {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.base-form-label {
		font-size: 0.8rem;
		color: var(--text-secondary);
	}

	.base-form {
		font-family: var(--font-arabic, 'Amiri', serif);
		font-size: 1.1rem;
		color: var(--text-primary);
		direction: rtl;
	}

	.form-type {
		font-size: 0.85rem;
		color: var(--text-secondary);
	}

	/* Compact mode styles */
	.verb-conjugation-compact {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		padding: 0.5rem;
		background: var(--surface-secondary, #f5f5f5);
		border-radius: 6px;
		font-size: 0.85rem;
	}

	:global(.dark) .verb-conjugation-compact {
		background: var(--surface-secondary, #2a2a2a);
	}

	.verb-conjugation-compact .root-info {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.verb-conjugation-compact .root-letters {
		font-family: var(--font-arabic, 'Amiri', serif);
		font-size: 1rem;
		color: var(--accent-gold, #c4a962);
		letter-spacing: 0.15em;
		direction: rtl;
	}

	.verb-conjugation-compact .root-meaning {
		color: var(--text-secondary);
		font-style: italic;
		font-size: 0.8rem;
	}

	.verb-conjugation-compact .form-info {
		color: var(--text-tertiary, #888);
		font-size: 0.75rem;
	}
</style>
