import * as THREE from 'three';

export class MouseController {
	private raycaster: THREE.Raycaster;
	private mouse: THREE.Vector2;
	private worldPosition: THREE.Vector3;
	private plane: THREE.Plane;
	private isActive: boolean = false;

	private onMouseMove: ((worldPos: THREE.Vector3) => void) | null = null;
	private onMouseLeave: (() => void) | null = null;

	private boundHandleMouseMove: (e: MouseEvent) => void;
	private boundHandleMouseLeave: () => void;
	private boundHandleTouchMove: (e: TouchEvent) => void;
	private boundHandleTouchEnd: () => void;

	private camera: THREE.Camera | null = null;
	private container: HTMLElement | null = null;

	constructor() {
		this.raycaster = new THREE.Raycaster();
		this.mouse = new THREE.Vector2();
		this.worldPosition = new THREE.Vector3();
		this.plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0); // XY plane at z=0

		this.boundHandleMouseMove = this.handleMouseMove.bind(this);
		this.boundHandleMouseLeave = this.handleMouseLeave.bind(this);
		this.boundHandleTouchMove = this.handleTouchMove.bind(this);
		this.boundHandleTouchEnd = this.handleTouchEnd.bind(this);
	}

	public init(
		camera: THREE.Camera,
		container: HTMLElement,
		onMouseMove: (worldPos: THREE.Vector3) => void,
		onMouseLeave: () => void
	): void {
		this.camera = camera;
		this.container = container;
		this.onMouseMove = onMouseMove;
		this.onMouseLeave = onMouseLeave;

		container.addEventListener('mousemove', this.boundHandleMouseMove, { passive: true });
		container.addEventListener('mouseleave', this.boundHandleMouseLeave);
		container.addEventListener('touchmove', this.boundHandleTouchMove, { passive: true });
		container.addEventListener('touchend', this.boundHandleTouchEnd);
	}

	private handleMouseMove(event: MouseEvent): void {
		if (!this.camera || !this.container) return;

		const rect = this.container.getBoundingClientRect();
		this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
		this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

		this.updateWorldPosition();
	}

	private handleTouchMove(event: TouchEvent): void {
		if (!this.camera || !this.container || event.touches.length === 0) return;

		const touch = event.touches[0];
		const rect = this.container.getBoundingClientRect();
		this.mouse.x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
		this.mouse.y = -((touch.clientY - rect.top) / rect.height) * 2 + 1;

		this.updateWorldPosition();
	}

	private updateWorldPosition(): void {
		if (!this.camera) return;

		this.raycaster.setFromCamera(this.mouse, this.camera);
		this.raycaster.ray.intersectPlane(this.plane, this.worldPosition);

		this.isActive = true;
		if (this.onMouseMove) {
			this.onMouseMove(this.worldPosition);
		}
	}

	private handleMouseLeave(): void {
		this.isActive = false;
		if (this.onMouseLeave) {
			this.onMouseLeave();
		}
	}

	private handleTouchEnd(): void {
		this.isActive = false;
		if (this.onMouseLeave) {
			this.onMouseLeave();
		}
	}

	public getWorldPosition(): THREE.Vector3 {
		return this.worldPosition.clone();
	}

	public getIsActive(): boolean {
		return this.isActive;
	}

	public dispose(): void {
		if (this.container) {
			this.container.removeEventListener('mousemove', this.boundHandleMouseMove);
			this.container.removeEventListener('mouseleave', this.boundHandleMouseLeave);
			this.container.removeEventListener('touchmove', this.boundHandleTouchMove);
			this.container.removeEventListener('touchend', this.boundHandleTouchEnd);
		}

		this.camera = null;
		this.container = null;
		this.onMouseMove = null;
		this.onMouseLeave = null;
	}
}
