<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	// Props
	let {
		class: className = '',
		reducedMotion = false
	}: {
		class?: string;
		reducedMotion?: boolean;
	} = $props();

	let canvas: HTMLCanvasElement;
	let container: HTMLDivElement;
	let isInitialized = $state(false);
	let animationId: number | null = null;

	// Three.js modules (lazy loaded)
	let THREE: typeof import('three') | null = null;
	let sceneManager: typeof import('$lib/three/scene-manager') | null = null;
	let particleSystem: typeof import('$lib/three/particle-system') | null = null;
	let mouseController: typeof import('$lib/three/mouse-controller') | null = null;

	// Scene state
	let sceneContext: import('$lib/three/scene-manager').SceneContext | null = null;
	let particles: import('$lib/three/particle-system').ThreadMeshParticleSystem | null = null;
	let mouse: import('$lib/three/mouse-controller').MouseController | null = null;
	let clock: import('three').Clock | null = null;
	let qualityLevel: import('$lib/three/scene-manager').QualityLevel = 'medium';

	onMount(() => {
		if (!browser) return;

		// Check for reduced motion preference
		const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		if (prefersReducedMotion) {
			reducedMotion = true;
		}

		// Lazy load Three.js modules
		initThree();

		return () => {
			cleanup();
		};
	});

	async function initThree() {
		try {
			// Dynamic imports for code splitting
			const [threeModule, sceneModule, particleModule, mouseModule] = await Promise.all([
				import('three'),
				import('$lib/three/scene-manager'),
				import('$lib/three/particle-system'),
				import('$lib/three/mouse-controller')
			]);

			THREE = threeModule;
			sceneManager = sceneModule;
			particleSystem = particleModule;
			mouseController = mouseModule;

			// Detect quality level
			qualityLevel = sceneManager.detectQualityLevel();
			const settings = sceneManager.QUALITY_SETTINGS[qualityLevel];

			// Create scene
			const rect = container.getBoundingClientRect();
			sceneContext = sceneManager.createScene({
				canvas,
				width: rect.width,
				height: rect.height
			});

			// Create particle system
			particles = new particleSystem.ThreadMeshParticleSystem({
				particleCount: settings.particleCount,
				maxConnections: settings.maxConnections,
				connectionDistance: settings.connectionDistance
			});
			sceneContext.scene.add(particles.particlesGroup);

			// Create mouse controller
			mouse = new mouseController.MouseController();
			mouse.init(
				sceneContext.camera,
				container,
				(worldPos) => {
					particles?.setMousePosition(worldPos);
				},
				() => {
					particles?.clearMouseInfluence();
				}
			);

			// Create clock for delta time
			clock = new THREE.Clock();

			// Handle resize
			const resizeObserver = new ResizeObserver((entries) => {
				for (const entry of entries) {
					const { width, height } = entry.contentRect;
					if (sceneContext && sceneManager) {
						sceneManager.handleResize(sceneContext, width, height);
					}
				}
			});
			resizeObserver.observe(container);

			// Start animation loop
			isInitialized = true;
			animate();

			// Cleanup resize observer on unmount
			return () => {
				resizeObserver.disconnect();
			};
		} catch (error) {
			console.error('Failed to initialize Three.js:', error);
		}
	}

	function animate() {
		if (!sceneContext || !particles || !clock) return;

		animationId = requestAnimationFrame(animate);

		const deltaTime = clock.getDelta();

		// Update particle system
		particles.update(deltaTime, reducedMotion);

		// Render
		sceneContext.renderer.render(sceneContext.scene, sceneContext.camera);
	}

	function cleanup() {
		if (animationId !== null) {
			cancelAnimationFrame(animationId);
			animationId = null;
		}

		if (mouse) {
			mouse.dispose();
			mouse = null;
		}

		if (particles) {
			particles.dispose();
			particles = null;
		}

		if (sceneContext && sceneManager) {
			sceneManager.disposeScene(sceneContext);
			sceneContext = null;
		}
	}
</script>

<div
	bind:this={container}
	class="three-background {className}"
	aria-hidden="true"
>
	<canvas bind:this={canvas}></canvas>

	{#if !isInitialized}
		<!-- Fallback gradient while loading -->
		<div class="fallback-gradient"></div>
	{/if}
</div>

<style>
	.three-background {
		position: absolute;
		inset: 0;
		overflow: hidden;
		pointer-events: none;
		z-index: 0;
	}

	.three-background canvas {
		width: 100%;
		height: 100%;
		pointer-events: auto;
	}

	.fallback-gradient {
		position: absolute;
		inset: 0;
		background: radial-gradient(
			ellipse at 50% 30%,
			rgba(196, 169, 98, 0.15) 0%,
			rgba(139, 115, 85, 0.08) 40%,
			transparent 70%
		);
	}

	:global(.dark) .fallback-gradient {
		background: radial-gradient(
			ellipse at 50% 30%,
			rgba(196, 169, 98, 0.1) 0%,
			rgba(139, 115, 85, 0.05) 40%,
			transparent 70%
		);
	}
</style>
