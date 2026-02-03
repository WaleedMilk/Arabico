<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { auth } from '$lib/stores/auth.svelte';
	import { testStore } from '$lib/stores/test.svelte';
	import { surahList } from '$lib/data/surahs';

	let title = $state('');
	let surahStart = $state(1);
	let ayahStart = $state(1);
	let surahEnd = $state(1);
	let ayahEnd = $state(7);
	let generatedLink = $state<string | null>(null);
	let copied = $state(false);
	let signInError = $state<string | null>(null);

	// Get max ayahs for selected surahs
	let maxAyahStart = $derived(surahList.find(s => s.id === surahStart)?.numberOfAyahs ?? 1);
	let maxAyahEnd = $derived(surahList.find(s => s.id === surahEnd)?.numberOfAyahs ?? 1);

	// Auto-clamp ayah values
	$effect(() => {
		if (ayahStart > maxAyahStart) ayahStart = maxAyahStart;
	});
	$effect(() => {
		if (ayahEnd > maxAyahEnd) ayahEnd = maxAyahEnd;
	});
	// When start surah changes, default end to same surah
	$effect(() => {
		if (surahEnd < surahStart) {
			surahEnd = surahStart;
			ayahEnd = maxAyahEnd;
		}
	});

	async function handleCreate() {
		const testId = await testStore.createTest({
			title: title.trim() || undefined,
			surahStart,
			ayahStart,
			surahEnd,
			ayahEnd,
		});

		if (testId && browser) {
			generatedLink = `${window.location.origin}/test/${testId}`;
		}
	}

	async function copyLink() {
		if (!generatedLink || !browser) return;
		try {
			await navigator.clipboard.writeText(generatedLink);
			copied = true;
			setTimeout(() => (copied = false), 2000);
		} catch {
			// Fallback: select text
		}
	}
</script>

<svelte:head>
	<title>Create Test - Arabico</title>
</svelte:head>

<div class="test-page">
	<h1 class="page-title">Create a Vocabulary Test</h1>
	<p class="page-subtitle">Select an ayah range to test students on the vocabulary within it.</p>

	{#if !auth.isAuthenticated && !auth.isLoading}
		<div class="auth-prompt">
			<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="auth-icon">
				<path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
			</svg>
			<p>Sign in to create tests for your students.</p>
			<button onclick={() => auth.signInWithGoogle()} class="sign-in-btn google-btn">
				<svg viewBox="0 0 24 24" class="btn-icon">
					<path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
					<path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
					<path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
					<path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
				</svg>
				Sign in with Google
			</button>
			{#if signInError}
				<p class="auth-error">{signInError}</p>
			{/if}
		</div>
	{:else}
		<!-- Test creation form -->
		<div class="form-card">
			<!-- Title (optional) -->
			<div class="field">
				<label for="test-title" class="field-label">Test Title (optional)</label>
				<input
					id="test-title"
					type="text"
					bind:value={title}
					placeholder="e.g. Juz 30 Quiz"
					class="field-input"
				/>
			</div>

			<!-- Range selection -->
			<div class="range-section">
				<h3 class="range-heading">Ayah Range</h3>

				<!-- Start -->
				<div class="range-row">
					<span class="range-label">From</span>
					<div class="range-fields">
						<div class="field-inline">
							<label for="surah-start" class="sr-only">Start Surah</label>
							<select id="surah-start" bind:value={surahStart} class="field-select">
								{#each surahList as s}
									<option value={s.id}>{s.id}. {s.englishName}</option>
								{/each}
							</select>
						</div>
						<div class="field-inline ayah-field">
							<label for="ayah-start" class="sr-only">Start Ayah</label>
							<span class="ayah-prefix">Ayah</span>
							<input
								id="ayah-start"
								type="number"
								min="1"
								max={maxAyahStart}
								bind:value={ayahStart}
								class="field-input-sm"
							/>
							<span class="ayah-max">/ {maxAyahStart}</span>
						</div>
					</div>
				</div>

				<!-- End -->
				<div class="range-row">
					<span class="range-label">To</span>
					<div class="range-fields">
						<div class="field-inline">
							<label for="surah-end" class="sr-only">End Surah</label>
							<select id="surah-end" bind:value={surahEnd} class="field-select">
								{#each surahList as s}
									{#if s.id >= surahStart}
										<option value={s.id}>{s.id}. {s.englishName}</option>
									{/if}
								{/each}
							</select>
						</div>
						<div class="field-inline ayah-field">
							<label for="ayah-end" class="sr-only">End Ayah</label>
							<span class="ayah-prefix">Ayah</span>
							<input
								id="ayah-end"
								type="number"
								min="1"
								max={maxAyahEnd}
								bind:value={ayahEnd}
								class="field-input-sm"
							/>
							<span class="ayah-max">/ {maxAyahEnd}</span>
						</div>
					</div>
				</div>
			</div>

			{#if testStore.error}
				<p class="error-msg">{testStore.error}</p>
			{/if}

			<button
				onclick={handleCreate}
				disabled={testStore.isLoading}
				class="create-btn"
			>
				{#if testStore.isLoading}
					<span class="spinner"></span>
					Generating...
				{:else}
					Generate Test Link
				{/if}
			</button>
		</div>

		<!-- Generated link -->
		{#if generatedLink}
			<div class="link-card">
				<h3 class="link-heading">Test Link Ready</h3>
				<p class="link-desc">Share this link with your students. No sign-in required to take the test.</p>
				<div class="link-row">
					<input type="text" readonly value={generatedLink} class="link-input" />
					<button onclick={copyLink} class="copy-btn">
						{copied ? 'Copied!' : 'Copy'}
					</button>
				</div>
				<a href={generatedLink} class="preview-link">Preview test &rarr;</a>
			</div>
		{/if}
	{/if}
</div>

<style>
	.test-page {
		max-width: 32rem;
		margin: 0 auto;
		padding: 1rem 0;
	}

	.page-title {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--text-primary);
		text-align: center;
	}

	.page-subtitle {
		font-size: 0.875rem;
		color: var(--text-muted);
		text-align: center;
		margin-top: 0.25rem;
		margin-bottom: 1.5rem;
	}

	/* Auth prompt */
	.auth-prompt {
		text-align: center;
		padding: 2rem;
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: 12px;
	}

	.auth-icon {
		width: 2.5rem;
		height: 2.5rem;
		color: var(--text-muted);
		margin: 0 auto 0.75rem;
	}

	.auth-prompt p {
		color: var(--text-secondary);
		margin-bottom: 1rem;
	}

	.sign-in-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1.25rem;
		border-radius: 8px;
		font-weight: 500;
		font-size: 0.875rem;
		border: 1px solid var(--border-color);
		cursor: pointer;
		transition: all 0.2s;
	}

	.google-btn {
		background: var(--bg-primary);
		color: var(--text-primary);
	}

	.google-btn:hover {
		background: var(--bg-secondary);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.btn-icon {
		width: 18px;
		height: 18px;
	}

	.auth-error {
		font-size: 0.8rem;
		color: #dc2626;
		margin-top: 0.5rem;
	}

	/* Form card */
	.form-card {
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: 12px;
		padding: 1.5rem;
	}

	.field {
		margin-bottom: 1rem;
	}

	.field-label {
		display: block;
		font-size: 0.8rem;
		font-weight: 500;
		color: var(--text-secondary);
		margin-bottom: 0.375rem;
	}

	.field-input {
		width: 100%;
		padding: 0.5rem 0.75rem;
		background: var(--bg-primary);
		border: 1px solid var(--border-color);
		border-radius: 8px;
		font-size: 0.875rem;
		color: var(--text-primary);
		outline: none;
		transition: border-color 0.2s;
	}

	.field-input:focus {
		border-color: var(--accent-color);
	}

	/* Range section */
	.range-section {
		margin-bottom: 1.25rem;
	}

	.range-heading {
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--text-secondary);
		margin-bottom: 0.75rem;
	}

	.range-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 0.75rem;
	}

	.range-label {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--text-muted);
		text-transform: uppercase;
		width: 2.5rem;
		flex-shrink: 0;
	}

	.range-fields {
		flex: 1;
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.field-inline {
		flex: 1;
		min-width: 120px;
	}

	.field-select {
		width: 100%;
		padding: 0.4rem 0.5rem;
		background: var(--bg-primary);
		border: 1px solid var(--border-color);
		border-radius: 6px;
		font-size: 0.8rem;
		color: var(--text-primary);
		outline: none;
	}

	.field-select:focus {
		border-color: var(--accent-color);
	}

	.ayah-field {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		flex: 0 1 auto;
		min-width: 0;
	}

	.ayah-prefix {
		font-size: 0.75rem;
		color: var(--text-muted);
		white-space: nowrap;
	}

	.field-input-sm {
		width: 3.5rem;
		padding: 0.4rem 0.375rem;
		background: var(--bg-primary);
		border: 1px solid var(--border-color);
		border-radius: 6px;
		font-size: 0.8rem;
		color: var(--text-primary);
		text-align: center;
		outline: none;
	}

	.field-input-sm:focus {
		border-color: var(--accent-color);
	}

	.ayah-max {
		font-size: 0.7rem;
		color: var(--text-muted);
		white-space: nowrap;
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border-width: 0;
	}

	/* Error */
	.error-msg {
		font-size: 0.8rem;
		color: #dc2626;
		margin-bottom: 0.75rem;
	}

	/* Create button */
	.create-btn {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.625rem;
		background: var(--accent-color);
		color: white;
		border: none;
		border-radius: 8px;
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
		transition: opacity 0.2s;
	}

	.create-btn:hover:not(:disabled) {
		opacity: 0.9;
	}

	.create-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.spinner {
		width: 16px;
		height: 16px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top-color: white;
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	/* Link card */
	.link-card {
		margin-top: 1rem;
		padding: 1.25rem;
		background: var(--bg-secondary);
		border: 1px solid var(--accent-color);
		border-radius: 12px;
	}

	.link-heading {
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 0.25rem;
	}

	.link-desc {
		font-size: 0.8rem;
		color: var(--text-muted);
		margin-bottom: 0.75rem;
	}

	.link-row {
		display: flex;
		gap: 0.5rem;
	}

	.link-input {
		flex: 1;
		padding: 0.5rem 0.625rem;
		background: var(--bg-primary);
		border: 1px solid var(--border-color);
		border-radius: 6px;
		font-size: 0.8rem;
		color: var(--text-primary);
		outline: none;
	}

	.copy-btn {
		padding: 0.5rem 1rem;
		background: var(--accent-color);
		color: white;
		border: none;
		border-radius: 6px;
		font-size: 0.8rem;
		font-weight: 500;
		cursor: pointer;
		white-space: nowrap;
		transition: opacity 0.2s;
	}

	.copy-btn:hover {
		opacity: 0.85;
	}

	.preview-link {
		display: inline-block;
		margin-top: 0.75rem;
		font-size: 0.8rem;
		color: var(--accent-color);
		text-decoration: none;
	}

	.preview-link:hover {
		text-decoration: underline;
	}
</style>
