import * as THREE from 'three';

export class MouseInteractionController {
	private mouse: THREE.Vector2 = new THREE.Vector2();
	private mouseWorld: THREE.Vector3 = new THREE.Vector3();
	private raycaster: THREE.Raycaster;
	private camera: THREE.PerspectiveCamera;
	private plane: THREE.Plane;
	private isActive: boolean = false;

	constructor(camera: THREE.PerspectiveCamera) {
		this.camera = camera;
		this.raycaster = new THREE.Raycaster();
		// Interaction plane at z=0
		this.plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
	}

	public updateMousePosition(event: MouseEvent | Touch, canvas: HTMLCanvasElement): void {
		const rect = canvas.getBoundingClientRect();

		// Convert to normalized device coordinates (-1 to +1)
		this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
		this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

		// Project to world space on interaction plane
		this.raycaster.setFromCamera(this.mouse, this.camera);
		this.raycaster.ray.intersectPlane(this.plane, this.mouseWorld);

		this.isActive = true;
	}

	public handlePointerMove(event: PointerEvent, canvas: HTMLCanvasElement): void {
		this.updateMousePosition(event, canvas);
	}

	public handleTouchMove(event: TouchEvent, canvas: HTMLCanvasElement): void {
		if (event.touches.length > 0) {
			this.updateMousePosition(event.touches[0], canvas);
		}
	}

	public handlePointerLeave(): void {
		this.isActive = false;
	}

	public getWorldPosition(): THREE.Vector3 {
		return this.mouseWorld.clone();
	}

	public getIsActive(): boolean {
		return this.isActive;
	}

	public clearInfluence(): void {
		this.isActive = false;
	}

	// Update camera reference if it changes
	public setCamera(camera: THREE.PerspectiveCamera): void {
		this.camera = camera;
	}
}

// Helper to create event handlers for Svelte
export function createMouseHandlers(
	controller: MouseInteractionController,
	canvas: HTMLCanvasElement
): {
	onPointerMove: (e: PointerEvent) => void;
	onPointerLeave: () => void;
	onTouchMove: (e: TouchEvent) => void;
	onTouchEnd: () => void;
} {
	return {
		onPointerMove: (e: PointerEvent) => {
			controller.handlePointerMove(e, canvas);
		},
		onPointerLeave: () => {
			controller.handlePointerLeave();
		},
		onTouchMove: (e: TouchEvent) => {
			controller.handleTouchMove(e, canvas);
		},
		onTouchEnd: () => {
			controller.handlePointerLeave();
		}
	};
}
