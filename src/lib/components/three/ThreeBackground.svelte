<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	// Props
	let {
		class: className = '',
		reducedMotion = false,
		position = 'center',
		size = 'full',
		intensity = 1.0
	}: {
		class?: string;
		reducedMotion?: boolean;
		position?: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
		size?: 'full' | 'small' | 'medium';
		intensity?: number;
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

			// Adjust settings based on size prop
			const sizeMultiplier = size === 'small' ? 0.5 : size === 'medium' ? 0.7 : 1.0;
			const particleCount = Math.floor(settings.particleCount * sizeMultiplier);

			// Create particle system with adjusted settings
			particles = new particleSystem.ThreadMeshParticleSystem({
				particleCount,
				maxConnections: settings.maxConnections,
				connectionDistance: settings.connectionDistance * sizeMultiplier,
				emissionRadius: size === 'small' ? 2.5 : size === 'medium' ? 3.2 : 4,
				particleSize: 0.045 * intensity // Increased from 0.03
			});
			sceneContext.scene.add(particles.particlesGroup);

			// Offset camera for corner positions
			if (position !== 'center') {
				const offsetX = position.includes('left') ? -3 : position.includes('right') ? 3 : 0;
				const offsetY = position.includes('top') ? 1.5 : position.includes('bottom') ? -1.5 : 0;
				sceneContext.camera.position.set(offsetX, 2 + offsetY, 6);
				sceneContext.camera.lookAt(offsetX * 0.5, offsetY * 0.3, 0);
			}

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
	class:corner-top-left={position === 'top-left'}
	class:corner-top-right={position === 'top-right'}
	class:corner-bottom-left={position === 'bottom-left'}
	class:corner-bottom-right={position === 'bottom-right'}
	class:size-small={size === 'small'}
	class:size-medium={size === 'medium'}
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

	/* Corner positioning */
	.three-background.corner-top-left,
	.three-background.corner-top-right,
	.three-background.corner-bottom-left,
	.three-background.corner-bottom-right {
		position: fixed;
		inset: auto;
	}

	.three-background.corner-top-left {
		top: 0;
		left: 0;
	}

	.three-background.corner-top-right {
		top: 0;
		right: 0;
	}

	.three-background.corner-bottom-left {
		bottom: 0;
		left: 0;
	}

	.three-background.corner-bottom-right {
		bottom: 0;
		right: 0;
	}

	/* Size variants */
	.three-background.size-small {
		width: 200px;
		height: 200px;
	}

	.three-background.size-medium {
		width: 300px;
		height: 300px;
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
			rgba(196, 169, 98, 0.2) 0%,
			rgba(139, 115, 85, 0.12) 40%,
			transparent 70%
		);
	}

	:global(.dark) .fallback-gradient {
		background: radial-gradient(
			ellipse at 50% 30%,
			rgba(196, 169, 98, 0.15) 0%,
			rgba(139, 115, 85, 0.08) 40%,
			transparent 70%
		);
	}
</style>
