<script lang="ts">
	import { vocabulary } from '$lib/stores/vocabulary.svelte';
	import type { QuranWord, QuranWordWithTranslation } from '$lib/types';

	interface Props {
		word: QuranWord | null;
		gloss?: string;
		lemma?: string;
		transliteration?: string;
		surahId?: number;
		ayahNum?: number;
		wordIndex?: number;
		onClose: () => void;
	}

	let { word, gloss = '', lemma = '', transliteration = '', surahId, ayahNum, wordIndex, onClose }: Props = $props();

	let familiarity = $derived(word ? vocabulary.getFamiliarity(word.id) : 'new');
	let isPlaying = $state(false);
	let playbackSpeed = $state(1);

	// Parse word ID for audio URL
	function parseWordId(id: string): { surah: number; ayah: number; word: number } | null {
		const parts = id.split(':');
		if (parts.length !== 3) return null;
		return {
			surah: parseInt(parts[0], 10),
			ayah: parseInt(parts[1], 10),
			word: parseInt(parts[2], 10)
		};
	}

	async function playWordAudio() {
		if (!word) return;
		const loc = parseWordId(word.id);
		if (!loc) return;

		isPlaying = true;
		try {
			const url = `https://quranwbw.github.io/audio-words-new/${loc.surah}/${loc.ayah}/${loc.word}.mp3`;
			const audio = new Audio(url);
			audio.playbackRate = playbackSpeed;
			audio.onended = () => isPlaying = false;
			audio.onerror = () => isPlaying = false;
			await audio.play();
		} catch {
			isPlaying = false;
		}
	}

	function cycleSpeed() {
		const speeds = [0.75, 1, 1.25];
		const idx = speeds.indexOf(playbackSpeed);
		playbackSpeed = speeds[(idx + 1) % speeds.length];
	}

	async function handleAddToReview() {
		if (word) {
			await vocabulary.addToReview(word.id);
		}
	}

	async function handleMarkKnown() {
		if (word) {
			await vocabulary.markKnown(word.id);
		}
	}

	async function handleIgnore() {
		if (word) {
			await vocabulary.ignore(word.id);
			onClose();
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			onClose();
		}
	}

	const familiarityLabels: Record<string, string> = {
		new: 'New Word',
		seen: 'Seen',
		learning: 'Learning',
		known: 'Known',
		ignored: 'Ignored'
	};
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- SVG Filter for liquid glass distortion -->
<svg class="absolute w-0 h-0" aria-hidden="true">
	<defs>
		<filter id="glass-distortion" x="-50%" y="-50%" width="200%" height="200%">
			<feTurbulence type="fractalNoise" baseFrequency="0.012 0.012" numOctaves="2" seed="42" result="noise" />
			<feGaussianBlur in="noise" stdDeviation="1.5" result="blurred" />
			<feDisplacementMap in="SourceGraphic" in2="blurred" scale="12" xChannelSelector="R" yChannelSelector="G" />
		</filter>
	</defs>
</svg>

<aside
	class="word-detail-panel"
	class:open={!!word}
	aria-label="Word details"
>
	{#if word}
		<div class="panel-content">
			<!-- Close button -->
			<button
				onclick={onClose}
				class="close-btn liquid-glass-btn"
				aria-label="Close panel"
			>
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
					<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>

			<!-- Arabic Word Display -->
			<div class="word-display">
				<h2 class="arabic-word" dir="rtl">{word.text}</h2>
				{#if transliteration}
					<p class="transliteration">{transliteration}</p>
				{/if}
			</div>

			<!-- Translation / Gloss -->
			<div class="meaning-section liquid-glass">
				<span class="section-label">Meaning</span>
				{#if gloss}
					<p class="meaning-text">{gloss}</p>
				{:else}
					<p class="meaning-text muted">Translation loading...</p>
				{/if}
			</div>

			<!-- Grammatical Info -->
			{#if lemma && lemma !== word.text}
				<div class="grammar-section">
					<div class="grammar-item">
						<span class="grammar-label">Root Form</span>
						<span class="grammar-value font-arabic" dir="rtl">{lemma}</span>
					</div>
				</div>
			{/if}

			<!-- Audio Section -->
			<div class="audio-section">
				<button
					onclick={playWordAudio}
					class="audio-btn liquid-glass-btn"
					class:playing={isPlaying}
					disabled={isPlaying}
				>
					{#if isPlaying}
						<!-- Waveform animation -->
						<div class="waveform">
							{#each Array(5) as _, i}
								<span class="bar" style="animation-delay: {i * 0.1}s"></span>
							{/each}
						</div>
					{:else}
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
							<path stroke-linecap="round" stroke-linejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
						</svg>
					{/if}
					<span>Listen</span>
				</button>
				<button onclick={cycleSpeed} class="speed-btn liquid-glass-btn">
					{playbackSpeed}x
				</button>
			</div>

			<!-- Status Badge -->
			<div class="status-section">
				<span class="status-badge {familiarity}">
					{familiarityLabels[familiarity]}
				</span>
			</div>

			<!-- Action Buttons -->
			<div class="actions-section">
				{#if familiarity !== 'learning' && familiarity !== 'known'}
					<button onclick={handleAddToReview} class="action-btn primary liquid-glass-btn">
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
							<path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
						</svg>
						Add to Review
					</button>
				{/if}

				{#if familiarity !== 'known'}
					<button onclick={handleMarkKnown} class="action-btn secondary liquid-glass-btn">
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
							<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
						I Know This
					</button>
				{/if}

				{#if familiarity !== 'ignored'}
					<button onclick={handleIgnore} class="action-btn tertiary liquid-glass-btn">
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
							<path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
						</svg>
						Ignore
					</button>
				{/if}
			</div>

			<!-- Word Location -->
			{#if surahId && ayahNum}
				<div class="location-info">
					<span class="location-text">Surah {surahId}, Ayah {ayahNum}</span>
				</div>
			{/if}
		</div>
	{/if}
</aside>

<style>
	.word-detail-panel {
		position: fixed;
		top: 0;
		left: 0;
		height: 100vh;
		width: 320px;
		z-index: 50;

		/* Liquid glass effect */
		background: rgba(var(--bg-elevated-rgb, 255, 255, 255), 0.75);
		backdrop-filter: blur(24px) saturate(180%);
		-webkit-backdrop-filter: blur(24px) saturate(180%);

		/* Subtle inner glow */
		box-shadow:
			inset 1px 1px 0 0 rgba(255, 255, 255, 0.5),
			inset -1px -1px 0 0 rgba(0, 0, 0, 0.05),
			8px 0 32px rgba(0, 0, 0, 0.1);

		border-right: 1px solid rgba(255, 255, 255, 0.3);

		/* Slide animation */
		transform: translateX(-100%);
		transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);

		overflow-y: auto;
		overflow-x: hidden;
	}

	.word-detail-panel.open {
		transform: translateX(0);
	}

	:global(.dark) .word-detail-panel {
		background: rgba(45, 36, 28, 0.85);
		border-right-color: rgba(255, 255, 255, 0.1);
		box-shadow:
			inset 1px 1px 0 0 rgba(255, 255, 255, 0.1),
			inset -1px -1px 0 0 rgba(0, 0, 0, 0.2),
			8px 0 32px rgba(0, 0, 0, 0.3);
	}

	.panel-content {
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.close-btn {
		position: absolute;
		top: 1rem;
		right: 1rem;
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		color: var(--text-muted);
		transition: all 0.2s ease;
	}

	.close-btn:hover {
		color: var(--text-primary);
		transform: scale(1.1);
	}

	/* Liquid Glass Button Base */
	.liquid-glass-btn {
		background: rgba(255, 255, 255, 0.2);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid rgba(255, 255, 255, 0.3);
		box-shadow:
			inset 0 1px 0 0 rgba(255, 255, 255, 0.4),
			inset 0 -1px 0 0 rgba(0, 0, 0, 0.05),
			0 2px 8px rgba(0, 0, 0, 0.08);
		transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
	}

	.liquid-glass-btn:hover {
		background: rgba(255, 255, 255, 0.3);
		transform: translateY(-1px);
		box-shadow:
			inset 0 1px 0 0 rgba(255, 255, 255, 0.5),
			inset 0 -1px 0 0 rgba(0, 0, 0, 0.05),
			0 4px 16px rgba(0, 0, 0, 0.12);
	}

	.liquid-glass-btn:active {
		transform: translateY(0) scale(0.98);
	}

	:global(.dark) .liquid-glass-btn {
		background: rgba(255, 255, 255, 0.08);
		border-color: rgba(255, 255, 255, 0.15);
	}

	:global(.dark) .liquid-glass-btn:hover {
		background: rgba(255, 255, 255, 0.12);
	}

	/* Liquid Glass Surface */
	.liquid-glass {
		background: rgba(255, 255, 255, 0.15);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		border: 1px solid rgba(255, 255, 255, 0.25);
		border-radius: 16px;
		box-shadow:
			inset 0 1px 0 0 rgba(255, 255, 255, 0.3),
			0 4px 16px rgba(0, 0, 0, 0.06);
	}

	:global(.dark) .liquid-glass {
		background: rgba(255, 255, 255, 0.06);
		border-color: rgba(255, 255, 255, 0.1);
	}

	.word-display {
		text-align: center;
		padding: 1.5rem 0;
		margin-top: 1rem;
	}

	.arabic-word {
		font-family: var(--font-arabic, 'Amiri', serif);
		font-size: 3rem;
		line-height: 1.4;
		color: var(--text-primary);
		margin-bottom: 0.5rem;
	}

	.transliteration {
		font-size: 0.875rem;
		color: var(--text-muted);
		font-style: italic;
	}

	.meaning-section {
		padding: 1rem;
		position: relative;
	}

	.section-label {
		position: absolute;
		top: -0.5rem;
		left: 1rem;
		font-size: 0.625rem;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--text-muted);
		background: var(--bg-primary);
		padding: 0 0.5rem;
	}

	.meaning-text {
		font-size: 1.125rem;
		color: var(--text-primary);
		text-align: center;
		line-height: 1.5;
	}

	.meaning-text.muted {
		color: var(--text-muted);
		font-style: italic;
	}

	.grammar-section {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.grammar-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem 0;
		border-bottom: 1px solid var(--border-color);
	}

	.grammar-label {
		font-size: 0.75rem;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.grammar-value {
		font-size: 1rem;
		color: var(--text-primary);
	}

	.font-arabic {
		font-family: var(--font-arabic, 'Amiri', serif);
	}

	.audio-section {
		display: flex;
		gap: 0.5rem;
	}

	.audio-btn {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		border-radius: 12px;
		font-size: 0.875rem;
		color: var(--text-primary);
	}

	.audio-btn.playing {
		background: rgba(var(--color-gold-rgb, 196, 169, 98), 0.2);
	}

	.speed-btn {
		padding: 0.75rem;
		border-radius: 12px;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--text-secondary);
		min-width: 48px;
	}

	/* Waveform Animation */
	.waveform {
		display: flex;
		align-items: center;
		gap: 2px;
		height: 20px;
	}

	.waveform .bar {
		width: 3px;
		height: 100%;
		background: var(--color-gold, #C4A962);
		border-radius: 2px;
		animation: waveform 0.8s ease-in-out infinite;
	}

	@keyframes waveform {
		0%, 100% { transform: scaleY(0.3); }
		50% { transform: scaleY(1); }
	}

	.status-section {
		display: flex;
		justify-content: center;
	}

	.status-badge {
		padding: 0.375rem 1rem;
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 500;
		text-transform: capitalize;
	}

	.status-badge.new {
		background: rgba(var(--color-gold-rgb, 196, 169, 98), 0.2);
		color: var(--color-gold, #C4A962);
	}

	.status-badge.seen {
		background: var(--bg-secondary);
		color: var(--text-secondary);
	}

	.status-badge.learning {
		background: rgba(var(--color-gold-rgb, 196, 169, 98), 0.3);
		color: var(--text-learning);
	}

	.status-badge.known {
		background: rgba(91, 140, 90, 0.2);
		color: var(--text-known);
	}

	.status-badge.ignored {
		background: var(--bg-secondary);
		color: var(--text-muted);
	}

	.actions-section {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.action-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		border-radius: 12px;
		font-size: 0.875rem;
		font-weight: 500;
		transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
	}

	.action-btn.primary {
		background: var(--accent-color);
		color: white;
		border: none;
	}

	.action-btn.primary:hover {
		background: var(--color-sepia-600);
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	.action-btn.secondary {
		color: var(--text-primary);
	}

	.action-btn.tertiary {
		color: var(--text-muted);
	}

	.location-info {
		text-align: center;
		padding-top: 0.5rem;
		border-top: 1px solid var(--border-color);
	}

	.location-text {
		font-size: 0.75rem;
		color: var(--text-muted);
	}

	/* Mobile responsive */
	@media (max-width: 768px) {
		.word-detail-panel {
			width: 100%;
			height: auto;
			max-height: 70vh;
			top: auto;
			bottom: 0;
			border-right: none;
			border-top: 1px solid rgba(255, 255, 255, 0.3);
			border-radius: 24px 24px 0 0;
			transform: translateY(100%);
			box-shadow:
				inset 0 1px 0 0 rgba(255, 255, 255, 0.5),
				0 -8px 32px rgba(0, 0, 0, 0.15);
		}

		.word-detail-panel.open {
			transform: translateY(0);
		}
	}
</style>
