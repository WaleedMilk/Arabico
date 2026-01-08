import * as THREE from 'three';
import { THEME_COLORS } from './scene-manager';

export interface MushafConfig {
	width: number;
	height: number;
	depth: number;
	openAngle: number; // radians
	pageCount: number;
	coverThickness: number;
}

const DEFAULT_CONFIG: MushafConfig = {
	width: 2.0,
	height: 2.8,
	depth: 0.35,
	openAngle: Math.PI / 7, // ~25 degrees
	pageCount: 10,
	coverThickness: 0.03
};

// Materials matching soft academia theme
const MATERIALS = {
	cover: new THREE.MeshStandardMaterial({
		color: THEME_COLORS.sepia700,
		roughness: 0.8,
		metalness: 0.1,
		side: THREE.DoubleSide
	}),
	pages: new THREE.MeshStandardMaterial({
		color: THEME_COLORS.parchment,
		roughness: 0.9,
		metalness: 0.0
	}),
	goldAccent: new THREE.MeshStandardMaterial({
		color: THEME_COLORS.gold,
		roughness: 0.3,
		metalness: 0.7
	}),
	pageEdges: new THREE.MeshStandardMaterial({
		color: 0xd4b86a, // Lighter gold for gilded edges
		roughness: 0.5,
		metalness: 0.5
	}),
	spine: new THREE.MeshStandardMaterial({
		color: 0x3d2e22, // Darker sepia for spine
		roughness: 0.85,
		metalness: 0.05
	})
};

export class MushafGeometry {
	public group: THREE.Group;
	private config: MushafConfig;
	private time: number = 0;
	private baseY: number = 0;

	constructor(config: Partial<MushafConfig> = {}) {
		this.config = { ...DEFAULT_CONFIG, ...config };
		this.group = new THREE.Group();
		this.createMushaf();
	}

	private createMushaf(): void {
		this.createLeftCover();
		this.createRightCover();
		this.createSpine();
		this.createPages();
		this.createGoldBorders();
	}

	private createLeftCover(): void {
		const { width, height, coverThickness, openAngle } = this.config;

		const coverGeometry = new THREE.BoxGeometry(width / 2, height, coverThickness);
		const cover = new THREE.Mesh(coverGeometry, MATERIALS.cover);

		// Position and rotate for open book effect
		cover.position.set(-width / 4, 0, 0);
		cover.rotation.y = openAngle;

		// Pivot from inner edge
		const pivot = new THREE.Group();
		pivot.add(cover);
		cover.position.x = -width / 4;
		pivot.position.x = 0;

		this.group.add(pivot);
	}

	private createRightCover(): void {
		const { width, height, coverThickness, openAngle } = this.config;

		const coverGeometry = new THREE.BoxGeometry(width / 2, height, coverThickness);
		const cover = new THREE.Mesh(coverGeometry, MATERIALS.cover);

		// Position and rotate for open book effect (mirror of left)
		cover.position.set(width / 4, 0, 0);
		cover.rotation.y = -openAngle;

		const pivot = new THREE.Group();
		pivot.add(cover);
		cover.position.x = width / 4;
		pivot.position.x = 0;

		this.group.add(pivot);
	}

	private createSpine(): void {
		const { height, depth, coverThickness } = this.config;

		// Create curved spine using cylinder segment
		const spineRadius = depth / 2;
		const spineGeometry = new THREE.CylinderGeometry(
			spineRadius,
			spineRadius,
			height,
			16, // segments
			1,
			false,
			Math.PI * 0.5, // start angle
			Math.PI // arc length
		);

		const spine = new THREE.Mesh(spineGeometry, MATERIALS.spine);
		spine.rotation.x = Math.PI / 2;
		spine.rotation.z = Math.PI / 2;
		spine.position.z = -spineRadius + coverThickness / 2;

		this.group.add(spine);
	}

	private createPages(): void {
		const { width, height, depth, pageCount, coverThickness, openAngle } = this.config;

		const pageWidth = width / 2 - 0.05;
		const pageHeight = height - 0.1;
		const totalPageDepth = depth - coverThickness * 2;
		const pageThickness = totalPageDepth / pageCount;

		// Create page stack for left side
		const leftPagesGroup = new THREE.Group();
		for (let i = 0; i < pageCount; i++) {
			const pageGeometry = new THREE.BoxGeometry(pageWidth, pageHeight, pageThickness);
			const page = new THREE.Mesh(pageGeometry, MATERIALS.pages);

			// Stack pages with slight offset for visual depth
			const zOffset = -totalPageDepth / 2 + i * pageThickness + pageThickness / 2;
			page.position.set(-pageWidth / 2 - 0.02, 0, zOffset + coverThickness);

			leftPagesGroup.add(page);
		}
		leftPagesGroup.rotation.y = openAngle * 0.8;
		this.group.add(leftPagesGroup);

		// Create page stack for right side
		const rightPagesGroup = new THREE.Group();
		for (let i = 0; i < pageCount; i++) {
			const pageGeometry = new THREE.BoxGeometry(pageWidth, pageHeight, pageThickness);
			const page = new THREE.Mesh(pageGeometry, MATERIALS.pages);

			const zOffset = -totalPageDepth / 2 + i * pageThickness + pageThickness / 2;
			page.position.set(pageWidth / 2 + 0.02, 0, zOffset + coverThickness);

			rightPagesGroup.add(page);
		}
		rightPagesGroup.rotation.y = -openAngle * 0.8;
		this.group.add(rightPagesGroup);

		// Create gilded page edges (visible edge of pages)
		this.createGildedEdges(pageWidth, pageHeight, totalPageDepth);
	}

	private createGildedEdges(pageWidth: number, pageHeight: number, depth: number): void {
		const { openAngle } = this.config;

		// Front edge (visible when book is closed/partially open)
		const edgeThickness = 0.01;

		// Left side gilded edge
		const leftEdgeGeometry = new THREE.BoxGeometry(edgeThickness, pageHeight - 0.05, depth);
		const leftEdge = new THREE.Mesh(leftEdgeGeometry, MATERIALS.pageEdges);
		leftEdge.position.set(-pageWidth - 0.03, 0, depth / 2);
		leftEdge.rotation.y = openAngle * 0.8;
		this.group.add(leftEdge);

		// Right side gilded edge
		const rightEdgeGeometry = new THREE.BoxGeometry(edgeThickness, pageHeight - 0.05, depth);
		const rightEdge = new THREE.Mesh(rightEdgeGeometry, MATERIALS.pageEdges);
		rightEdge.position.set(pageWidth + 0.03, 0, depth / 2);
		rightEdge.rotation.y = -openAngle * 0.8;
		this.group.add(rightEdge);
	}

	private createGoldBorders(): void {
		const { width, height, coverThickness, openAngle } = this.config;

		const borderWidth = 0.02;
		const borderMaterial = MATERIALS.goldAccent;

		// Create decorative borders on covers
		const createBorder = (isLeft: boolean) => {
			const borderGroup = new THREE.Group();

			// Top border
			const topGeometry = new THREE.BoxGeometry(width / 2 - 0.1, borderWidth, borderWidth);
			const top = new THREE.Mesh(topGeometry, borderMaterial);
			top.position.set(0, height / 2 - 0.05, coverThickness / 2 + 0.01);
			borderGroup.add(top);

			// Bottom border
			const bottom = new THREE.Mesh(topGeometry, borderMaterial);
			bottom.position.set(0, -height / 2 + 0.05, coverThickness / 2 + 0.01);
			borderGroup.add(bottom);

			// Side borders
			const sideGeometry = new THREE.BoxGeometry(borderWidth, height - 0.1, borderWidth);
			const inner = new THREE.Mesh(sideGeometry, borderMaterial);
			inner.position.set(isLeft ? 0.05 : -0.05, 0, coverThickness / 2 + 0.01);
			borderGroup.add(inner);

			const outer = new THREE.Mesh(sideGeometry, borderMaterial);
			outer.position.set(isLeft ? -width / 2 + 0.05 : width / 2 - 0.05, 0, coverThickness / 2 + 0.01);
			borderGroup.add(outer);

			// Center ornament (simple geometric pattern)
			const ornamentGeometry = new THREE.BoxGeometry(0.15, 0.15, borderWidth);
			const ornament = new THREE.Mesh(ornamentGeometry, borderMaterial);
			ornament.position.set(isLeft ? -width / 4 : width / 4, 0, coverThickness / 2 + 0.01);
			ornament.rotation.z = Math.PI / 4; // Diamond shape
			borderGroup.add(ornament);

			// Position the border group
			borderGroup.position.x = isLeft ? -width / 4 : width / 4;
			borderGroup.rotation.y = isLeft ? openAngle : -openAngle;

			return borderGroup;
		};

		this.group.add(createBorder(true));
		this.group.add(createBorder(false));
	}

	// Animation update - gentle floating effect
	public update(deltaTime: number): void {
		this.time += deltaTime;

		// Gentle float
		const floatAmplitude = 0.05;
		const floatSpeed = 0.5;
		this.group.position.y = this.baseY + Math.sin(this.time * floatSpeed * Math.PI * 2) * floatAmplitude;

		// Subtle rotation
		this.group.rotation.y = Math.sin(this.time * 0.3) * 0.02;
	}

	// Apply scroll-based transform
	public applyScrollTransform(scrollProgress: number): void {
		// Move up and rotate slightly as user scrolls
		const parallaxY = scrollProgress * -2 * 0.5;
		this.baseY = parallaxY;

		// Tilt forward slightly
		this.group.rotation.x = scrollProgress * Math.PI * 0.05;
	}

	public dispose(): void {
		this.group.traverse((object) => {
			if (object instanceof THREE.Mesh) {
				object.geometry.dispose();
			}
		});
	}
}

// Static material disposal (call on app unmount)
export function disposeMaterials(): void {
	Object.values(MATERIALS).forEach((material) => material.dispose());
}
