import * as THREE from 'three';

// Theme colors from app.css
export const THEME_COLORS = {
	gold: 0xc4a962,
	sepia500: 0x8b7355,
	sepia700: 0x4a3c2f,
	cream: 0xfaf7f2,
	parchment: 0xf0ebe3,
	darkBg: 0x1a1512
};

export interface SceneConfig {
	canvas: HTMLCanvasElement;
	width: number;
	height: number;
	pixelRatio?: number;
}

export interface SceneContext {
	scene: THREE.Scene;
	camera: THREE.PerspectiveCamera;
	renderer: THREE.WebGLRenderer;
}

export function createScene(config: SceneConfig): SceneContext {
	const { canvas, width, height, pixelRatio = Math.min(window.devicePixelRatio, 2) } = config;

	// Create scene
	const scene = new THREE.Scene();

	// Create camera - slightly elevated, looking down at the book
	const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
	camera.position.set(0, 2, 6);
	camera.lookAt(0, 0, 0);

	// Create renderer with transparency for overlay capability
	const renderer = new THREE.WebGLRenderer({
		canvas,
		antialias: true,
		alpha: true,
		powerPreference: 'high-performance'
	});
	renderer.setSize(width, height);
	renderer.setPixelRatio(pixelRatio);
	renderer.outputColorSpace = THREE.SRGBColorSpace;

	// Setup lighting
	setupLighting(scene);

	return { scene, camera, renderer };
}

function setupLighting(scene: THREE.Scene): void {
	// Ambient light - soft cream fill
	const ambient = new THREE.AmbientLight(THEME_COLORS.cream, 0.4);
	scene.add(ambient);

	// Key light - gold-tinted main light from upper right
	const keyLight = new THREE.DirectionalLight(THEME_COLORS.gold, 0.8);
	keyLight.position.set(5, 10, 7);
	scene.add(keyLight);

	// Fill light - sepia from lower left
	const fillLight = new THREE.DirectionalLight(THEME_COLORS.sepia500, 0.3);
	fillLight.position.set(-5, 2, -5);
	scene.add(fillLight);

	// Rim light - subtle back light for depth
	const rimLight = new THREE.DirectionalLight(THEME_COLORS.parchment, 0.2);
	rimLight.position.set(0, 5, -10);
	scene.add(rimLight);
}

export function handleResize(
	context: SceneContext,
	width: number,
	height: number,
	pixelRatio?: number
): void {
	const { camera, renderer } = context;

	camera.aspect = width / height;
	camera.updateProjectionMatrix();

	renderer.setSize(width, height);
	if (pixelRatio) {
		renderer.setPixelRatio(Math.min(pixelRatio, 2));
	}
}

export function disposeScene(context: SceneContext): void {
	const { scene, renderer } = context;

	// Traverse and dispose all objects
	scene.traverse((object) => {
		if (object instanceof THREE.Mesh) {
			object.geometry.dispose();
			if (Array.isArray(object.material)) {
				object.material.forEach((material) => material.dispose());
			} else if (object.material) {
				object.material.dispose();
			}
		}
		if (object instanceof THREE.Points) {
			object.geometry.dispose();
			if (object.material instanceof THREE.Material) {
				object.material.dispose();
			}
		}
		if (object instanceof THREE.LineSegments) {
			object.geometry.dispose();
			if (object.material instanceof THREE.Material) {
				object.material.dispose();
			}
		}
	});

	// Dispose renderer
	renderer.dispose();
}

// Quality detection for adaptive performance
export type QualityLevel = 'high' | 'medium' | 'low';

export function detectQualityLevel(): QualityLevel {
	if (typeof window === 'undefined') return 'medium';

	const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
	const isLowPower = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4;

	// Check WebGL capabilities
	const canvas = document.createElement('canvas');
	const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');

	if (!gl) return 'low';

	const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
	if (debugInfo) {
		const gpuRenderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
		// Detect integrated graphics
		if (/Intel|Mali|Adreno 3|PowerVR/i.test(gpuRenderer)) {
			return isMobile ? 'low' : 'medium';
		}
	}

	if (isMobile) return 'medium';
	if (isLowPower) return 'medium';

	return 'high';
}

export const QUALITY_SETTINGS = {
	high: {
		particleCount: 400,
		maxConnections: 4,
		connectionDistance: 1.5,
		pageCount: 10
	},
	medium: {
		particleCount: 250,
		maxConnections: 3,
		connectionDistance: 1.3,
		pageCount: 6
	},
	low: {
		particleCount: 100,
		maxConnections: 2,
		connectionDistance: 1.0,
		pageCount: 4
	}
};
