import * as THREE from 'three';
import { THEME_COLORS } from './scene-manager';

export interface ParticleConfig {
	particleCount: number;
	connectionDistance: number;
	maxConnections: number;
	emissionRadius: number;
	particleSize: number;
}

const DEFAULT_CONFIG: ParticleConfig = {
	particleCount: 300,
	connectionDistance: 1.5,
	maxConnections: 4,
	emissionRadius: 4,
	particleSize: 0.03
};

// Simple 3D noise function for organic movement
function noise3D(x: number, y: number, z: number, time: number): THREE.Vector3 {
	const scale = 0.5;
	const speed = 0.2;

	return new THREE.Vector3(
		Math.sin(x * scale + time * speed) * Math.cos(z * scale + time * speed * 0.7),
		Math.sin(y * scale + time * speed * 1.1) * Math.cos(x * scale + time * speed * 0.8),
		Math.sin(z * scale + time * speed * 0.9) * Math.cos(y * scale + time * speed * 1.2)
	).multiplyScalar(0.3);
}

export class ThreadMeshParticleSystem {
	public particlesGroup: THREE.Group;
	private particles!: THREE.Points;
	private connections!: THREE.LineSegments;
	private config: ParticleConfig;

	// Particle data
	private positions: Float32Array;
	private velocities: Float32Array;
	private originalPositions: Float32Array;
	private orbitalAngles: Float32Array;
	private orbitalSpeeds: Float32Array;
	private particleSizes: Float32Array;

	// Connection data
	private connectionPositions: Float32Array;
	private maxConnectionCount: number;

	// Time tracking
	private time: number = 0;

	// Mouse influence
	private mouseWorld: THREE.Vector3 = new THREE.Vector3();
	private mouseInfluenceActive: boolean = false;

	constructor(config: Partial<ParticleConfig> = {}) {
		this.config = { ...DEFAULT_CONFIG, ...config };
		this.particlesGroup = new THREE.Group();

		this.positions = new Float32Array(this.config.particleCount * 3);
		this.velocities = new Float32Array(this.config.particleCount * 3);
		this.originalPositions = new Float32Array(this.config.particleCount * 3);
		this.orbitalAngles = new Float32Array(this.config.particleCount);
		this.orbitalSpeeds = new Float32Array(this.config.particleCount);
		this.particleSizes = new Float32Array(this.config.particleCount);

		// Max connections = particleCount * maxConnections / 2 (bidirectional)
		this.maxConnectionCount = (this.config.particleCount * this.config.maxConnections) / 2;
		this.connectionPositions = new Float32Array(this.maxConnectionCount * 6);

		this.initializeParticles();
		this.initializeConnections();
	}

	private initializeParticles(): void {
		const { particleCount, emissionRadius, particleSize } = this.config;

		// Distribute particles in spherical shell around center
		// Using golden ratio spiral for aesthetic distribution
		const goldenRatio = (1 + Math.sqrt(5)) / 2;

		for (let i = 0; i < particleCount; i++) {
			// Golden ratio sphere distribution
			const y = 1 - (i / (particleCount - 1)) * 2; // -1 to 1
			const radiusAtY = Math.sqrt(1 - y * y);
			const theta = (2 * Math.PI * i) / goldenRatio;

			// Add some randomness to the radius
			const radius = emissionRadius * (0.6 + Math.random() * 0.4);

			const x = radiusAtY * Math.cos(theta) * radius;
			const z = radiusAtY * Math.sin(theta) * radius;
			const posY = y * radius * 0.6; // Flatten vertically a bit

			this.positions[i * 3] = x;
			this.positions[i * 3 + 1] = posY;
			this.positions[i * 3 + 2] = z;

			this.originalPositions[i * 3] = x;
			this.originalPositions[i * 3 + 1] = posY;
			this.originalPositions[i * 3 + 2] = z;

			// Initialize velocities to zero
			this.velocities[i * 3] = 0;
			this.velocities[i * 3 + 1] = 0;
			this.velocities[i * 3 + 2] = 0;

			// Random orbital properties
			this.orbitalAngles[i] = Math.random() * Math.PI * 2;
			this.orbitalSpeeds[i] = (0.1 + Math.random() * 0.2) * (Math.random() > 0.5 ? 1 : -1);

			// Varying particle sizes
			this.particleSizes[i] = particleSize * (0.5 + Math.random() * 1);
		}

		// Create particle geometry
		const geometry = new THREE.BufferGeometry();
		geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
		geometry.setAttribute('size', new THREE.BufferAttribute(this.particleSizes, 1));

		// Custom shader material for glowing particles
		const material = new THREE.ShaderMaterial({
			uniforms: {
				color: { value: new THREE.Color(THEME_COLORS.gold) },
				time: { value: 0 }
			},
			vertexShader: `
				attribute float size;
				varying float vAlpha;

				void main() {
					vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
					gl_Position = projectionMatrix * mvPosition;

					// Size attenuation
					gl_PointSize = size * (300.0 / -mvPosition.z);

					// Fade based on distance from center
					float dist = length(position);
					vAlpha = 1.0 - smoothstep(2.0, 5.0, dist);
				}
			`,
			fragmentShader: `
				uniform vec3 color;
				varying float vAlpha;

				void main() {
					// Circular particle with soft edge
					float r = distance(gl_PointCoord, vec2(0.5));
					if (r > 0.5) discard;

					float alpha = (1.0 - smoothstep(0.2, 0.5, r)) * vAlpha;
					gl_FragColor = vec4(color, alpha * 0.95);
				}
			`,
			transparent: true,
			blending: THREE.AdditiveBlending,
			depthWrite: false
		});

		this.particles = new THREE.Points(geometry, material);
		this.particlesGroup.add(this.particles);
	}

	private initializeConnections(): void {
		const geometry = new THREE.BufferGeometry();
		geometry.setAttribute(
			'position',
			new THREE.BufferAttribute(this.connectionPositions, 3).setUsage(THREE.DynamicDrawUsage)
		);

		const material = new THREE.LineBasicMaterial({
			color: THEME_COLORS.sepia500,
			transparent: true,
			opacity: 0.45,
			blending: THREE.AdditiveBlending
		});

		this.connections = new THREE.LineSegments(geometry, material);
		this.particlesGroup.add(this.connections);
	}

	public update(deltaTime: number, reducedMotion: boolean = false): void {
		if (reducedMotion) {
			// Static display - just update connections once
			this.updateConnections();
			return;
		}

		this.time += deltaTime;

		const { particleCount, emissionRadius } = this.config;
		const centerAttraction = 0.02;
		const damping = 0.95;

		for (let i = 0; i < particleCount; i++) {
			const idx = i * 3;

			// Current position
			let x = this.positions[idx];
			let y = this.positions[idx + 1];
			let z = this.positions[idx + 2];

			// Add noise-based drift
			const noiseForce = noise3D(x, y, z, this.time);
			this.velocities[idx] += noiseForce.x * deltaTime * 0.5;
			this.velocities[idx + 1] += noiseForce.y * deltaTime * 0.5;
			this.velocities[idx + 2] += noiseForce.z * deltaTime * 0.5;

			// Orbital motion
			this.orbitalAngles[i] += this.orbitalSpeeds[i] * deltaTime;
			const orbitalForce = 0.1 * deltaTime;
			this.velocities[idx] += Math.cos(this.orbitalAngles[i]) * orbitalForce;
			this.velocities[idx + 2] += Math.sin(this.orbitalAngles[i]) * orbitalForce;

			// Center attraction (keep particles clustered)
			const distFromCenter = Math.sqrt(x * x + y * y + z * z);
			if (distFromCenter > emissionRadius * 0.5) {
				const toCenter = new THREE.Vector3(-x, -y, -z).normalize();
				this.velocities[idx] += toCenter.x * centerAttraction * deltaTime;
				this.velocities[idx + 1] += toCenter.y * centerAttraction * deltaTime;
				this.velocities[idx + 2] += toCenter.z * centerAttraction * deltaTime;
			}

			// Mouse influence
			if (this.mouseInfluenceActive) {
				this.applyMouseInfluence(i);
			}

			// Apply velocity with damping
			this.positions[idx] += this.velocities[idx];
			this.positions[idx + 1] += this.velocities[idx + 1];
			this.positions[idx + 2] += this.velocities[idx + 2];

			// Damping
			this.velocities[idx] *= damping;
			this.velocities[idx + 1] *= damping;
			this.velocities[idx + 2] *= damping;

			// Soft boundary
			const newDist = Math.sqrt(
				this.positions[idx] ** 2 + this.positions[idx + 1] ** 2 + this.positions[idx + 2] ** 2
			);
			if (newDist > emissionRadius * 1.2) {
				const scale = (emissionRadius * 1.2) / newDist;
				this.positions[idx] *= scale;
				this.positions[idx + 1] *= scale;
				this.positions[idx + 2] *= scale;
			}
		}

		// Update particle geometry
		(this.particles.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;

		// Update shader time uniform
		(this.particles.material as THREE.ShaderMaterial).uniforms.time.value = this.time;

		// Update connection lines
		this.updateConnections();
	}

	private applyMouseInfluence(particleIndex: number): void {
		const idx = particleIndex * 3;
		const x = this.positions[idx];
		const y = this.positions[idx + 1];
		const z = this.positions[idx + 2];

		const dx = this.mouseWorld.x - x;
		const dy = this.mouseWorld.y - y;
		const dz = this.mouseWorld.z - z;
		const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

		const repelThreshold = 0.8;
		const attractThreshold = 2.5;

		if (dist < attractThreshold && dist > 0.01) {
			const nx = dx / dist;
			const ny = dy / dist;
			const nz = dz / dist;

			let force: number;
			if (dist < repelThreshold) {
				// Repel - particles flee from cursor
				force = -0.15 / Math.max(dist, 0.1);
			} else {
				// Attract - particles drawn to cursor
				force = 0.05;
			}

			this.velocities[idx] += nx * force;
			this.velocities[idx + 1] += ny * force;
			this.velocities[idx + 2] += nz * force;
		}
	}

	private updateConnections(): void {
		const { particleCount, connectionDistance, maxConnections } = this.config;
		let connectionIndex = 0;

		// Simple O(n^2) neighbor search - could optimize with spatial hashing for large counts
		for (let i = 0; i < particleCount && connectionIndex < this.maxConnectionCount; i++) {
			let connectionsForParticle = 0;

			for (let j = i + 1; j < particleCount && connectionsForParticle < maxConnections; j++) {
				const dx = this.positions[i * 3] - this.positions[j * 3];
				const dy = this.positions[i * 3 + 1] - this.positions[j * 3 + 1];
				const dz = this.positions[i * 3 + 2] - this.positions[j * 3 + 2];
				const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

				if (dist < connectionDistance) {
					// Add line segment
					const baseIdx = connectionIndex * 6;
					this.connectionPositions[baseIdx] = this.positions[i * 3];
					this.connectionPositions[baseIdx + 1] = this.positions[i * 3 + 1];
					this.connectionPositions[baseIdx + 2] = this.positions[i * 3 + 2];
					this.connectionPositions[baseIdx + 3] = this.positions[j * 3];
					this.connectionPositions[baseIdx + 4] = this.positions[j * 3 + 1];
					this.connectionPositions[baseIdx + 5] = this.positions[j * 3 + 2];

					connectionIndex++;
					connectionsForParticle++;
				}
			}
		}

		// Update geometry draw range
		this.connections.geometry.setDrawRange(0, connectionIndex * 2);
		(this.connections.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
	}

	public setMousePosition(worldPosition: THREE.Vector3): void {
		this.mouseWorld.copy(worldPosition);
		this.mouseInfluenceActive = true;
	}

	public clearMouseInfluence(): void {
		this.mouseInfluenceActive = false;
	}

	// Apply scroll-based transform
	public applyScrollTransform(scrollProgress: number): void {
		// Move particles up with parallax
		const parallaxY = scrollProgress * -2 * 0.3;
		this.particlesGroup.position.y = parallaxY;

		// Fade opacity
		const opacity = this.calculateOpacity(scrollProgress);
		(this.connections.material as THREE.LineBasicMaterial).opacity = opacity * 0.3;
	}

	private calculateOpacity(scrollProgress: number): number {
		const fadeStart = 0.3;
		const fadeEnd = 0.8;
		const minOpacity = 0.15;

		if (scrollProgress < fadeStart) return 1;
		if (scrollProgress > fadeEnd) return minOpacity;

		const fadeProgress = (scrollProgress - fadeStart) / (fadeEnd - fadeStart);
		return 1 - (1 - minOpacity) * fadeProgress;
	}

	public dispose(): void {
		this.particles.geometry.dispose();
		(this.particles.material as THREE.Material).dispose();
		this.connections.geometry.dispose();
		(this.connections.material as THREE.Material).dispose();
	}
}
