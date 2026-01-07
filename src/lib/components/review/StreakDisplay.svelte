<script lang="ts">
	import { engagement } from '$lib/stores/engagement.svelte';

	interface Props {
		size?: 'small' | 'medium' | 'large';
	}

	let { size = 'medium' }: Props = $props();

	let sizeClasses = $derived.by(() => {
		switch (size) {
			case 'small':
				return { container: 'gap-1', icon: 'text-lg', text: 'text-sm' };
			case 'large':
				return { container: 'gap-3', icon: 'text-4xl', text: 'text-3xl' };
			default:
				return { container: 'gap-2', icon: 'text-2xl', text: 'text-xl' };
		}
	});
</script>

<div class="streak-display flex items-center justify-center {sizeClasses.container}">
	{#if engagement.currentStreak > 0}
		<span class="{sizeClasses.icon}">🔥</span>
		<span class="font-bold text-gold {sizeClasses.text}">
			{engagement.currentStreak}
		</span>
	{:else}
		<span class="{sizeClasses.icon} grayscale opacity-50">🔥</span>
		<span class="text-[var(--text-muted)] {sizeClasses.text}">0</span>
	{/if}
</div>

{#if size === 'large' && engagement.longestStreak > engagement.currentStreak}
	<p class="text-xs text-[var(--text-muted)] text-center mt-1">
		Best: {engagement.longestStreak} days
	</p>
{/if}
