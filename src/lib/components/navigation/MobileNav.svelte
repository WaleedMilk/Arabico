<script lang="ts">
	import { page } from '$app/stores';
	import { browser } from '$app/environment';

	// Get last visited surah from localStorage (default to 1)
	let lastSurah = $state(1);

	$effect(() => {
		if (browser) {
			const saved = localStorage.getItem('arabico-last-surah');
			if (saved) {
				lastSurah = parseInt(saved, 10) || 1;
			}
		}
	});

	// Update last surah when visiting a surah page
	$effect(() => {
		if (browser && $page.url.pathname.startsWith('/surah/')) {
			const match = $page.url.pathname.match(/\/surah\/(\d+)/);
			if (match) {
				const surahId = parseInt(match[1], 10);
				if (surahId >= 1 && surahId <= 114) {
					lastSurah = surahId;
					localStorage.setItem('arabico-last-surah', surahId.toString());
				}
			}
		}
	});

	// Check if current path matches
	function isActive(path: string, exact = false): boolean {
		if (exact) {
			return $page.url.pathname === path;
		}
		return $page.url.pathname.startsWith(path);
	}
</script>

<nav class="mobile-nav" aria-label="Mobile navigation">
	<a
		href="/"
		class="nav-item"
		class:active={isActive('/', true)}
		aria-current={isActive('/', true) ? 'page' : undefined}
	>
		<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="nav-icon">
			<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
		</svg>
		<span class="nav-label">Home</span>
	</a>

	<a
		href="/surah/{lastSurah}"
		class="nav-item"
		class:active={isActive('/surah')}
		aria-current={isActive('/surah') ? 'page' : undefined}
	>
		<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="nav-icon">
			<path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
		</svg>
		<span class="nav-label">Reader</span>
	</a>

	<a
		href="/review"
		class="nav-item"
		class:active={isActive('/review')}
		aria-current={isActive('/review') ? 'page' : undefined}
	>
		<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="nav-icon">
			<path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
		</svg>
		<span class="nav-label">Review</span>
	</a>

	<a
		href="/vocabulary"
		class="nav-item"
		class:active={isActive('/vocabulary')}
		aria-current={isActive('/vocabulary') ? 'page' : undefined}
	>
		<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="nav-icon">
			<path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
		</svg>
		<span class="nav-label">Words</span>
	</a>
</nav>

<style>
	.mobile-nav {
		display: none;
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		height: 60px;
		padding-bottom: env(safe-area-inset-bottom, 0px);
		background: var(--bg-elevated);
		border-top: 1px solid var(--border-color);
		z-index: 100;
		justify-content: space-around;
		align-items: center;
	}

	@media (max-width: 768px) {
		.mobile-nav {
			display: flex;
		}
	}

	.nav-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.25rem;
		padding: 0.5rem 1rem;
		color: var(--text-muted);
		text-decoration: none;
		transition: color 0.2s ease;
		min-width: 64px;
		-webkit-tap-highlight-color: transparent;
	}

	.nav-item:active {
		transform: scale(0.95);
	}

	.nav-item.active {
		color: var(--accent-color);
	}

	.nav-item.active .nav-icon {
		stroke-width: 2;
	}

	.nav-icon {
		width: 24px;
		height: 24px;
	}

	.nav-label {
		font-size: 0.625rem;
		font-weight: 500;
		letter-spacing: 0.01em;
	}

	/* Glassmorphism effect */
	@supports (backdrop-filter: blur(12px)) {
		.mobile-nav {
			background: rgba(var(--bg-elevated-rgb, 255, 255, 255), 0.85);
			backdrop-filter: blur(12px) saturate(180%);
			-webkit-backdrop-filter: blur(12px) saturate(180%);
		}
	}

	:global(.dark) .mobile-nav {
		background: rgba(30, 30, 30, 0.9);
	}
</style>
