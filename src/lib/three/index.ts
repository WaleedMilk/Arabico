// Three.js particle system exports
export {
	createScene,
	handleResize,
	disposeScene,
	detectQualityLevel,
	THEME_COLORS,
	QUALITY_SETTINGS,
	type SceneConfig,
	type SceneContext,
	type QualityLevel
} from './scene-manager';
export { ThreadMeshParticleSystem, type ParticleConfig } from './particle-system';
export { ScrollController, createScrollState, type ScrollConfig } from './scroll-controller';
export { MouseController } from './mouse-controller';
