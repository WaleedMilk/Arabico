<script lang="ts">
	import { surahList, toArabicNumerals } from '$lib/data/surahs';
	import ThreeBackground from '$lib/components/three/ThreeBackground.svelte';
</script>

<svelte:head>
	<title>Arabico - Surah Index</title>
</svelte:head>

<div class="space-y-8">
	<!-- Hero Section with Three.js Background -->
	<section class="hero-section relative py-16 text-center overflow-hidden">
		<ThreeBackground class="hero-canvas" />

		<div class="hero-content relative z-10">
			<h1 class="font-arabic text-5xl text-[var(--text-primary)] mb-3 drop-shadow-sm">القرآن الكريم</h1>
			<p class="text-xl text-[var(--text-secondary)] italic mb-4">The Noble Quran</p>
			<p class="text-[var(--text-muted)] max-w-lg mx-auto leading-relaxed">
				Learn Quranic Arabic through contextual vocabulary exposure.
				Tap any word to see its meaning and track your progress.
			</p>
		</div>
	</section>

	<!-- Surah Grid -->
	<section>
		<h2 class="text-xl font-medium text-[var(--text-primary)] mb-4">Surahs</h2>
		<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
			{#each surahList as surah}
				<a
					href="/surah/{surah.id}"
					class="group flex items-center gap-4 rounded-lg border border-[var(--border-color)] bg-[var(--bg-elevated)] p-4 transition-all hover:border-[var(--accent-color)] hover:shadow-md"
				>
					<!-- Surah Number -->
					<div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-sepia-100 dark:bg-sepia-800">
						<span class="font-arabic text-sm text-[var(--accent-color)]">{toArabicNumerals(surah.id)}</span>
					</div>

					<!-- Surah Info -->
					<div class="min-w-0 flex-1">
						<div class="flex items-baseline justify-between gap-2">
							<h3 class="truncate font-medium text-[var(--text-primary)] group-hover:text-[var(--accent-color)] transition-colors">
								{surah.englishName}
							</h3>
							<span class="font-arabic text-lg text-[var(--text-secondary)] flex-shrink-0">{surah.name}</span>
						</div>
						<div class="flex items-center gap-2 text-sm text-[var(--text-muted)]">
							<span>{surah.englishNameTranslation}</span>
							<span>·</span>
							<span>{surah.numberOfAyahs} verses</span>
						</div>
					</div>

					<!-- Arrow -->
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="1.5"
						stroke="currentColor"
						class="h-5 w-5 flex-shrink-0 text-[var(--text-muted)] transition-transform group-hover:translate-x-1 group-hover:text-[var(--accent-color)]"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
					</svg>
				</a>
			{/each}
		</div>
	</section>

	<!-- Info Section -->
	<section class="rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] p-6">
		<h2 class="text-lg font-medium text-[var(--text-primary)] mb-3">How to Use</h2>
		<ul class="space-y-2 text-[var(--text-secondary)]">
			<li class="flex items-start gap-2">
				<span class="text-gold">•</span>
				<span><strong>Tap any word</strong> to see its English meaning and lemma</span>
			</li>
			<li class="flex items-start gap-2">
				<span class="text-gold">•</span>
				<span><strong>Words are colored</strong> based on your familiarity level</span>
			</li>
			<li class="flex items-start gap-2">
				<span class="text-gold">•</span>
				<span><strong>Add words to review</strong> to build your personal vocabulary</span>
			</li>
			<li class="flex items-start gap-2">
				<span class="text-gold">•</span>
				<span><strong>Progress is saved</strong> automatically in your browser</span>
			</li>
		</ul>
	</section>
</div>

<style>
	.hero-section {
		min-height: 280px;
		display: flex;
		align-items: center;
		justify-content: center;
		margin: -1rem -1rem 0 -1rem;
		padding-left: 1rem;
		padding-right: 1rem;
		background: linear-gradient(
			180deg,
			transparent 0%,
			rgba(250, 247, 242, 0.5) 100%
		);
	}

	:global(.dark) .hero-section {
		background: linear-gradient(
			180deg,
			transparent 0%,
			rgba(26, 21, 18, 0.5) 100%
		);
	}

	.hero-content {
		padding: 2rem 1rem;
	}

	:global(.hero-canvas) {
		opacity: 0.8;
	}

	@media (max-width: 640px) {
		.hero-section {
			min-height: 220px;
			padding-top: 2rem;
			padding-bottom: 2rem;
		}

		.hero-content h1 {
			font-size: 2.5rem;
		}

		.hero-content p {
			font-size: 1rem;
		}
	}
</style>
