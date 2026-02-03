<script lang="ts">
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { testStore } from '$lib/stores/test.svelte';
	import TestResultReport from '$lib/components/test/TestResultReport.svelte';

	let testId = $derived(page.params.id);

	onMount(() => {
		if (testId) {
			testStore.loadTest(testId);
		}

		return () => {
			testStore.reset();
		};
	});

	function handleRating(rating: 1 | 2 | 3 | 4) {
		testStore.recordRating(rating);
	}

	function handleRetake() {
		if (testId) {
			testStore.loadTest(testId);
		}
	}

	const ratingButtons = [
		{ value: 1 as const, label: 'Again', sublabel: 'Forgot', colorClass: 'btn-again' },
		{ value: 2 as const, label: 'Hard', sublabel: 'Struggled', colorClass: 'btn-hard' },
		{ value: 3 as const, label: 'Good', sublabel: 'Recalled', colorClass: 'btn-good' },
		{ value: 4 as const, label: 'Easy', sublabel: 'Effortless', colorClass: 'btn-easy' },
	];

	function handleMCQSelect(optionText: string) {
		testStore.selectMCQAnswer(optionText);
	}

	function handleKeydown(event: KeyboardEvent) {
		if (testStore.testMode === 'mcq') {
			const key = parseInt(event.key);
			if (key >= 1 && key <= 4 && !testStore.mcqAnswered && testStore.mcqOptions.length >= key) {
				handleMCQSelect(testStore.mcqOptions[key - 1].text);
			}
			return;
		}
		const key = parseInt(event.key);
		if (key >= 1 && key <= 4 && testStore.isRevealed) {
			handleRating(key as 1 | 2 | 3 | 4);
		}
		if (event.key === ' ' && !testStore.isRevealed && !testStore.isComplete) {
			event.preventDefault();
			testStore.reveal();
		}
	}
</script>

<svelte:head>
	<title>{testStore.testConfig?.title || 'Vocabulary Test'} - Arabico</title>
</svelte:head>

<svelte:window onkeydown={handleKeydown} />

<div class="student-page">
	<!-- Loading -->
	{#if testStore.isLoading}
		<div class="center-state">
			<div class="loader"></div>
			<p class="state-text">Loading test...</p>
		</div>

	<!-- Error -->
	{:else if testStore.error}
		<div class="center-state">
			<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="error-icon">
				<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
			</svg>
			<p class="state-text">{testStore.error}</p>
			<a href="/test" class="back-link">Back to Test Creator</a>
		</div>

	<!-- Completed: Show Report -->
	{:else if testStore.isComplete && testStore.result}
		<TestResultReport
			result={testStore.result}
			title={testStore.testConfig?.title}
			testMode={testStore.testMode}
			onRetake={handleRetake}
		/>

	<!-- Active Test -->
	{:else if testStore.currentWord}
		<!-- Progress bar -->
		<div class="progress-section">
			<div class="progress-info">
				<span class="progress-text">
					{testStore.currentIndex + 1} / {testStore.totalWords}
				</span>
				<div class="progress-badges">
					{#if testStore.testMode === 'mcq'}
						<span class="mode-badge">Multiple Choice</span>
					{/if}
					{#if testStore.testConfig?.title}
						<span class="test-title-badge">{testStore.testConfig.title}</span>
					{/if}
				</div>
			</div>
			<div class="progress-track">
				<div class="progress-fill" style="width: {testStore.progress}%"></div>
			</div>
		</div>

		{#if testStore.testMode === 'mcq'}
			<!-- MCQ Mode -->
			<div class="mcq-area">
				<div class="mcq-card">
					<p class="card-arabic">{testStore.currentWord.arabic}</p>
					<p class="card-ref">{testStore.currentWord.ayahRef}</p>
					<p class="mcq-prompt">Choose the correct translation:</p>
				</div>

				<div class="mcq-options">
					{#each testStore.mcqOptions as option, i}
						{@const isSelected = testStore.mcqSelected === option.text}
						{@const showCorrect = testStore.mcqAnswered && option.isCorrect}
						{@const showWrong = testStore.mcqAnswered && isSelected && !option.isCorrect}
						<button
							onclick={() => handleMCQSelect(option.text)}
							disabled={testStore.mcqAnswered}
							class="mcq-btn"
							class:mcq-correct={showCorrect}
							class:mcq-wrong={showWrong}
							class:mcq-dimmed={testStore.mcqAnswered && !showCorrect && !showWrong}
						>
							<span class="mcq-key">{i + 1}</span>
							<span class="mcq-text">{option.text}</span>
						</button>
					{/each}
				</div>
				<p class="key-hint">Press 1-4 to select</p>
			</div>
		{:else}
			<!-- Flashcard Mode -->
			<div class="flashcard-area">
				<div class="flashcard" class:revealed={testStore.isRevealed}>
					<p class="card-arabic">{testStore.currentWord.arabic}</p>
					<p class="card-ref">{testStore.currentWord.ayahRef}</p>

					{#if testStore.isRevealed}
						<div class="card-answer">
							<p class="card-translation">
								{testStore.currentWord.translation || 'No translation available'}
							</p>
							{#if testStore.currentWord.transliteration}
								<p class="card-transliteration">{testStore.currentWord.transliteration}</p>
							{/if}
						</div>
					{:else}
						<button onclick={() => testStore.reveal()} class="reveal-btn">
							Tap to reveal
						</button>
					{/if}
				</div>

				{#if testStore.isRevealed}
					<div class="rating-area">
						<p class="rating-prompt">How well did you know this?</p>
						<div class="rating-buttons">
							{#each ratingButtons as r}
								<button
									onclick={() => handleRating(r.value)}
									class="rating-btn {r.colorClass}"
								>
									<span class="r-label">{r.label}</span>
									<span class="r-sub">{r.sublabel}</span>
								</button>
							{/each}
						</div>
						<p class="key-hint">Space to reveal &middot; 1-4 to rate</p>
					</div>
				{/if}
			</div>
		{/if}

	<!-- No words -->
	{:else}
		<div class="center-state">
			<p class="state-text">No words found for this test.</p>
			<a href="/test" class="back-link">Back to Test Creator</a>
		</div>
	{/if}
</div>

<style>
	.student-page {
		max-width: 32rem;
		margin: 0 auto;
		padding: 1rem 0;
		min-height: 60vh;
	}

	/* Center states (loading, error, empty) */
	.center-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 40vh;
		gap: 0.75rem;
	}

	.state-text {
		font-size: 0.9rem;
		color: var(--text-muted);
	}

	.error-icon {
		width: 2.5rem;
		height: 2.5rem;
		color: #dc2626;
	}

	.back-link {
		font-size: 0.8rem;
		color: var(--accent-color);
		text-decoration: none;
	}

	.back-link:hover {
		text-decoration: underline;
	}

	.loader {
		width: 32px;
		height: 32px;
		border: 3px solid var(--border-color);
		border-top-color: var(--accent-color);
		border-radius: 50%;
		animation: spin 0.7s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	/* Progress */
	.progress-section {
		margin-bottom: 1.5rem;
	}

	.progress-info {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.375rem;
	}

	.progress-text {
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--text-secondary);
	}

	.progress-badges {
		display: flex;
		gap: 0.375rem;
		align-items: center;
	}

	.mode-badge {
		font-size: 0.65rem;
		color: white;
		background: var(--accent-color);
		padding: 0.125rem 0.5rem;
		border-radius: 9999px;
		font-weight: 500;
	}

	.test-title-badge {
		font-size: 0.7rem;
		color: var(--text-muted);
		background: var(--bg-secondary);
		padding: 0.125rem 0.5rem;
		border-radius: 9999px;
		border: 1px solid var(--border-color);
	}

	.progress-track {
		height: 6px;
		background: var(--bg-secondary);
		border-radius: 3px;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		background: var(--accent-color);
		border-radius: 3px;
		transition: width 0.3s ease;
	}

	/* Flashcard */
	.flashcard-area {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.flashcard {
		width: 100%;
		min-height: 16rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 2rem 1.5rem;
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: 16px;
		text-align: center;
		transition: border-color 0.3s;
	}

	.flashcard.revealed {
		border-color: var(--accent-color);
	}

	.card-arabic {
		font-family: var(--font-arabic, 'Amiri', serif);
		font-size: 2.5rem;
		line-height: 1.4;
		color: var(--text-primary);
		margin-bottom: 0.5rem;
	}

	.card-ref {
		font-size: 0.75rem;
		color: var(--text-muted);
		margin-bottom: 1rem;
	}

	.reveal-btn {
		padding: 0.5rem 1.5rem;
		border-radius: 8px;
		background: var(--bg-primary);
		border: 1px dashed var(--border-color);
		color: var(--text-muted);
		font-size: 0.85rem;
		cursor: pointer;
		transition: all 0.2s;
	}

	.reveal-btn:hover {
		background: var(--bg-secondary);
		border-color: var(--accent-color);
		color: var(--text-secondary);
	}

	.card-answer {
		animation: fadeIn 0.25s ease;
	}

	.card-translation {
		font-size: 1.125rem;
		font-weight: 500;
		color: var(--text-primary);
	}

	.card-transliteration {
		font-size: 0.8rem;
		color: var(--text-muted);
		font-style: italic;
		margin-top: 0.25rem;
	}

	@keyframes fadeIn {
		from { opacity: 0; transform: translateY(4px); }
		to { opacity: 1; transform: translateY(0); }
	}

	/* Rating */
	.rating-area {
		width: 100%;
		margin-top: 1.25rem;
		animation: fadeIn 0.25s ease;
	}

	.rating-prompt {
		text-align: center;
		font-size: 0.8rem;
		color: var(--text-muted);
		margin-bottom: 0.5rem;
	}

	.rating-buttons {
		display: flex;
		gap: 0.5rem;
	}

	.rating-btn {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.125rem;
		padding: 0.625rem 0.375rem;
		border-radius: 10px;
		border: 1px solid var(--border-color);
		background: var(--bg-secondary);
		cursor: pointer;
		transition: all 0.2s;
	}

	.rating-btn:hover {
		transform: translateY(-2px);
		box-shadow: 0 3px 10px rgba(0, 0, 0, 0.08);
	}

	.rating-btn:active {
		transform: scale(0.97);
	}

	.r-label {
		font-size: 0.8rem;
		font-weight: 600;
	}

	.r-sub {
		font-size: 0.6rem;
		color: var(--text-muted);
	}

	/* Rating colors */
	.btn-again { border-color: rgba(220, 38, 38, 0.3); }
	.btn-again:hover { background: rgba(220, 38, 38, 0.08); border-color: rgba(220, 38, 38, 0.5); }
	.btn-again .r-label { color: #dc2626; }

	.btn-hard { border-color: rgba(234, 88, 12, 0.3); }
	.btn-hard:hover { background: rgba(234, 88, 12, 0.08); border-color: rgba(234, 88, 12, 0.5); }
	.btn-hard .r-label { color: #ea580c; }

	.btn-good { border-color: rgba(22, 163, 74, 0.3); }
	.btn-good:hover { background: rgba(22, 163, 74, 0.08); border-color: rgba(22, 163, 74, 0.5); }
	.btn-good .r-label { color: #16a34a; }

	.btn-easy { border-color: rgba(37, 99, 235, 0.3); }
	.btn-easy:hover { background: rgba(37, 99, 235, 0.08); border-color: rgba(37, 99, 235, 0.5); }
	.btn-easy .r-label { color: #2563eb; }

	:global(.dark) .rating-btn {
		background: var(--bg-elevated);
	}

	.key-hint {
		text-align: center;
		font-size: 0.6rem;
		color: var(--text-muted);
		margin-top: 0.5rem;
	}

	/* MCQ Mode */
	.mcq-area {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.mcq-card {
		width: 100%;
		padding: 2rem 1.5rem 1.25rem;
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: 16px;
		text-align: center;
	}

	.mcq-prompt {
		font-size: 0.8rem;
		color: var(--text-muted);
		margin-top: 0.75rem;
	}

	.mcq-options {
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-top: 1rem;
	}

	.mcq-btn {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		width: 100%;
		padding: 0.75rem 1rem;
		background: var(--bg-secondary);
		border: 1.5px solid var(--border-color);
		border-radius: 10px;
		cursor: pointer;
		transition: all 0.2s;
		text-align: left;
	}

	.mcq-btn:hover:not(:disabled) {
		border-color: var(--accent-color);
		background: var(--bg-primary);
	}

	.mcq-btn:disabled {
		cursor: default;
	}

	.mcq-btn.mcq-correct {
		border-color: #16a34a;
		background: rgba(22, 163, 74, 0.1);
	}

	.mcq-btn.mcq-wrong {
		border-color: #dc2626;
		background: rgba(220, 38, 38, 0.1);
	}

	.mcq-btn.mcq-dimmed {
		opacity: 0.4;
	}

	.mcq-key {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.5rem;
		height: 1.5rem;
		border-radius: 6px;
		background: var(--bg-primary);
		border: 1px solid var(--border-color);
		font-size: 0.7rem;
		font-weight: 600;
		color: var(--text-muted);
		flex-shrink: 0;
	}

	.mcq-correct .mcq-key {
		background: #16a34a;
		border-color: #16a34a;
		color: white;
	}

	.mcq-wrong .mcq-key {
		background: #dc2626;
		border-color: #dc2626;
		color: white;
	}

	.mcq-text {
		font-size: 0.9rem;
		color: var(--text-primary);
		font-weight: 500;
	}

	.mcq-correct .mcq-text { color: #16a34a; }
	.mcq-wrong .mcq-text { color: #dc2626; }
</style>
