<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { theme } from '$lib/stores/settings.svelte';
	import { vocabulary } from '$lib/stores/vocabulary.svelte';
	import ThemeToggle from '$lib/components/ui/ThemeToggle.svelte';

	let { children } = $props();

	onMount(async () => {
		// Initialize theme from localStorage
		if (browser) {
			const stored = localStorage.getItem('theme');
			if (stored === 'dark' || stored === 'light') {
				theme.set(stored);
			} else {
				theme.set('system');
			}
		}

		// Load vocabulary cache
		await vocabulary.init();
	});
</script>

<svelte:head>
	<title>Arabico - Quranic Reader</title>
	<meta name="description" content="A vocabulary-first Quranic adaptive reader" />
</svelte:head>

<div class="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-300">
	<!-- Header -->
	<header class="sticky top-0 z-50 border-b border-[var(--border-color)] bg-[var(--bg-elevated)]/80 backdrop-blur-sm">
		<nav class="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
			<!-- Logo / Title -->
			<a href="/" class="flex items-center gap-2">
				<span class="font-arabic text-2xl text-[var(--accent-color)]">عربي</span>
				<span class="text-lg font-medium tracking-wide text-[var(--text-secondary)]">Arabico</span>
			</a>

			<!-- Navigation -->
			<div class="flex items-center gap-4">
				<a
					href="/"
					class="text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
				>
					Surahs
				</a>
				<a
					href="/vocabulary"
					class="text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
				>
					Vocabulary
				</a>
				<ThemeToggle />
			</div>
		</nav>
	</header>

	<!-- Main Content -->
	<main class="mx-auto max-w-4xl px-4 py-6">
		{@render children()}
	</main>

	<!-- Footer -->
	<footer class="border-t border-[var(--border-color)] py-6 text-center text-sm text-[var(--text-muted)]">
		<p>
			Quran text from <a href="https://tanzil.net" class="underline hover:text-[var(--text-secondary)]" target="_blank" rel="noopener">Tanzil.net</a>
		</p>
		<p class="mt-1">Built with reverence for the sacred text</p>
	</footer>
</div>
