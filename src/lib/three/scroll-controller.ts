export interface ScrollConfig {
	fadeStart: number; // When to start fading (0-1)
	fadeEnd: number; // When to finish fading (0-1)
	minOpacity: number; // Minimum opacity after fade
}

const DEFAULT_CONFIG: ScrollConfig = {
	fadeStart: 0.3,
	fadeEnd: 0.8,
	minOpacity: 0.15
};

export class ScrollController {
	private config: ScrollConfig;
	private scrollProgress: number = 0;
	private landingHeight: number = 0;
	private onScrollUpdate: ((progress: number) => void) | null = null;
	private boundHandleScroll: () => void;

	constructor(config: Partial<ScrollConfig> = {}) {
		this.config = { ...DEFAULT_CONFIG, ...config };
		this.boundHandleScroll = this.handleScroll.bind(this);
	}

	public init(onScrollUpdate: (progress: number) => void): void {
		this.onScrollUpdate = onScrollUpdate;
		this.landingHeight = window.innerHeight;

		window.addEventListener('scroll', this.boundHandleScroll, { passive: true });
		window.addEventListener('resize', this.handleResize.bind(this), { passive: true });

		// Initial calculation
		this.handleScroll();
	}

	private handleScroll(): void {
		const scrollY = window.scrollY;
		this.scrollProgress = Math.min(1, scrollY / this.landingHeight);

		if (this.onScrollUpdate) {
			this.onScrollUpdate(this.scrollProgress);
		}
	}

	private handleResize(): void {
		this.landingHeight = window.innerHeight;
		this.handleScroll();
	}

	public getScrollProgress(): number {
		return this.scrollProgress;
	}

	public getOpacity(): number {
		const { fadeStart, fadeEnd, minOpacity } = this.config;
		const progress = this.scrollProgress;

		if (progress < fadeStart) return 1;
		if (progress > fadeEnd) return minOpacity;

		const fadeProgress = (progress - fadeStart) / (fadeEnd - fadeStart);
		return 1 - (1 - minOpacity) * fadeProgress;
	}

	public getParallaxOffset(factor: number = 0.5): number {
		return this.scrollProgress * -window.innerHeight * factor;
	}

	public dispose(): void {
		window.removeEventListener('scroll', this.boundHandleScroll);
		this.onScrollUpdate = null;
	}
}

// Svelte store-compatible scroll state
export function createScrollState() {
	let scrollProgress = $state(0);
	let opacity = $state(1);

	const config = DEFAULT_CONFIG;

	function updateFromProgress(progress: number) {
		scrollProgress = progress;

		// Calculate opacity
		if (progress < config.fadeStart) {
			opacity = 1;
		} else if (progress > config.fadeEnd) {
			opacity = config.minOpacity;
		} else {
			const fadeProgress = (progress - config.fadeStart) / (config.fadeEnd - config.fadeStart);
			opacity = 1 - (1 - config.minOpacity) * fadeProgress;
		}
	}

	return {
		get scrollProgress() {
			return scrollProgress;
		},
		get opacity() {
			return opacity;
		},
		updateFromProgress
	};
}
