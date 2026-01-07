<script lang="ts">
	import type { Surah } from '$lib/types';

	interface Props {
		surah: Omit<Surah, 'ayahs'>;
		showBismillah?: boolean;
	}

	let { surah, showBismillah = true }: Props = $props();

	// Surah At-Tawbah (9) doesn't have Bismillah
	let shouldShowBismillah = $derived(showBismillah && surah.id !== 9 && surah.id !== 1);
</script>

<header class="surah-header mb-8 border-b border-[var(--border-color)] pb-8 text-center">
	<!-- Decorative top element -->
	<div class="mb-4 flex items-center justify-center gap-4">
		<div class="h-px flex-1 bg-gradient-to-r from-transparent to-[var(--border-color)]"></div>
		<svg class="h-6 w-6 text-gold" viewBox="0 0 24 24" fill="currentColor">
			<path d="M12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2Z"/>
		</svg>
		<div class="h-px flex-1 bg-gradient-to-l from-transparent to-[var(--border-color)]"></div>
	</div>

	<!-- Surah name in Arabic -->
	<h1 class="surah-name-arabic font-arabic text-4xl text-[var(--text-primary)] mb-2">
		سورة {surah.name}
	</h1>

	<!-- English name and translation -->
	<h2 class="text-xl text-[var(--text-secondary)] font-medium mb-1">
		{surah.englishName}
	</h2>
	<p class="text-[var(--text-muted)] italic">
		{surah.englishNameTranslation}
	</p>

	<!-- Metadata -->
	<div class="mt-4 flex items-center justify-center gap-4 text-sm text-[var(--text-muted)]">
		<span class="flex items-center gap-1">
			<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="h-4 w-4">
				<path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
				<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
			</svg>
			{surah.revelationType}
		</span>
		<span>•</span>
		<span>{surah.numberOfAyahs} verses</span>
	</div>

	<!-- Bismillah -->
	{#if shouldShowBismillah}
		<div class="bismillah mt-8 font-arabic text-2xl text-[var(--text-primary)]" dir="rtl">
			بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
		</div>
	{/if}
</header>
