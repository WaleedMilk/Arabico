<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { theme } from '$lib/stores/settings.svelte';
	import { vocabulary } from '$lib/stores/vocabulary.svelte';
	import { auth } from '$lib/stores/auth.svelte';
	import ThemeToggle from '$lib/components/ui/ThemeToggle.svelte';
	import MobileNav from '$lib/components/navigation/MobileNav.svelte';

	let { children } = $props();

	onMount(async () => {
		// Initialize auth and vocabulary
		await auth.init();
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

			<!-- Navigation - hidden on mobile, shown in bottom nav instead -->
			<div class="flex items-center gap-4">
				<a
					href="/"
					class="desktop-nav-link text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
				>
					Surahs
				</a>
				<a
					href="/review"
					class="desktop-nav-link text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
				>
					Review
				</a>
				<a
					href="/vocabulary"
					class="desktop-nav-link text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
				>
					Vocabulary
				</a>
				<ThemeToggle />
			</div>
		</nav>
	</header>

	<!-- Main Content -->
	<main class="main-content mx-auto max-w-4xl px-4 py-6">
		{@render children()}
	</main>

	<!-- Footer - hidden on mobile -->
	<footer class="desktop-footer border-t border-[var(--border-color)] py-6 text-center text-sm text-[var(--text-muted)]">
		<p>
			Quran text from <a href="https://tanzil.net" class="underline hover:text-[var(--text-secondary)]" target="_blank" rel="noopener">Tanzil.net</a>
		</p>
		<p class="mt-1">Built with reverence for the sacred text</p>
	</footer>

	<!-- Mobile Bottom Navigation -->
	<MobileNav />
</div>

<style>
	/* Hide desktop nav links on mobile */
	@media (max-width: 768px) {
		:global(.desktop-nav-link) {
			display: none;
		}

		/* Hide footer on mobile - bottom nav takes its place */
		:global(.desktop-footer) {
			display: none;
		}

		/* Add bottom padding for mobile nav clearance */
		:global(.main-content) {
			padding-bottom: calc(60px + env(safe-area-inset-bottom, 0px) + 1.5rem);
		}
	}
</style>
