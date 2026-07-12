import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit(),
		SvelteKitPWA({
			registerType: 'autoUpdate',
			manifest: {
				name: 'Arabico - Arabic Reader',
				short_name: 'Arabico',
				description: 'A vocabulary-first Arabic adaptive reader',
				theme_color: '#8B7355',
				background_color: '#FAF7F2',
				display: 'standalone',
				icons: [
					{
						src: 'favicon.svg',
						sizes: 'any',
						type: 'image/svg+xml'
					}
				]
			},
			workbox: {
				globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}']
			}
		})
	]
});
