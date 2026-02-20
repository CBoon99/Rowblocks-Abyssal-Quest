import * as THREE from 'three';
import { PhysicsWorld } from './PhysicsWorld';

interface Fish {
    mesh: THREE.Mesh;
    tailFin?: THREE.Mesh; // Optional tail fin mesh for animation
    position: THREE.Vector3;
    velocity: THREE.Vector3;
    type: 'clownfish' | 'angelfish' | 'jellyfish' | 'shark';
    size: number;
    swimSpeed: number;
    swimPhase: number; // For sin wave animation
    group?: THREE.Group; // Group for body + tail
}

export class FishSystem {
    private fishes: Fish[] = [];
    private scene: THREE.Scene;
    private physicsWorld: PhysicsWorld;
    private time: number = 0;
    
    constructor(scene: THREE.Scene, physicsWorld: PhysicsWorld) {
        this.scene = scene;
        this.physicsWorld = physicsWorld;
    }
    
    async init(): Promise<void> {
        console.log('🐟 FishSystem.init() started');
        try {
            // Create initial school of fish with boids flocking
            // Increased to 30 fish for better visibility and flocking behavior
            this.createFishSchool(30);
            console.log(`✅ Created ${this.fishes.length} fish with boids flocking`);
            console.log(`🐟 Fish positions: ${this.fishes.slice(0, 3).map(f => `(${f.position.x.toFixed(1)}, ${f.position.y.toFixed(1)}, ${f.position.z.toFixed(1)})`).join(', ')}...`);
        } catch (error) {
            console.error('❌ FishSystem initialization failed:', error);
            throw error;
        }
    }
    
    /**
     * Create a school of fish with different types
     */
    private createFishSchool(count: number): void {
        const fishTypes: Fish['type'][] = ['clownfish', 'angelfish', 'jellyfish'];
        
        for (let i = 0; i < count; i++) {
            const type = fishTypes[Math.floor(Math.random() * fishTypes.length)];
            const fish = this.createFish(type);
            
            // Random starting position closer to origin (where blocks are)
            // Position fish in a sphere around origin, but closer (5-15 units)
            const radius = 5 + Math.random() * 10;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            
            fish.position.set(
                radius * Math.sin(phi) * Math.cos(theta),
                0 + Math.random() * 10, // Between 0 and 10 depth (near blocks)
                radius * Math.sin(phi) * Math.sin(theta)
            );
            
            // Random velocity for swimming
            fish.velocity.set(
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 0.5,
                (Math.random() - 0.5) * 2
            ).normalize().multiplyScalar(fish.swimSpeed);
            
            fish.swimPhase = Math.random() * Math.PI * 2;
            
            this.fishes.push(fish);
            // Add group to scene if it exists, otherwise add mesh
            if (fish.group) {
                this.scene.add(fish.group);
            } else {
                this.scene.add(fish.mesh);
            }
        }
    }
    
    /**
     * Create a single fish mesh based on type with improved visuals
     */
    private createFish(type: Fish['type']): Fish {
        let bodyGeometry: THREE.BufferGeometry;
        let bodyMaterial: THREE.MeshStandardMaterial;
        let size: number;
        let swimSpeed: number;
        
        // Create group for body + tail
        const group = new THREE.Group();
        
        switch (type) {
            case 'clownfish':
                // Cone body + sphere head for better fish shape - MUCH BIGGER
                bodyGeometry = new THREE.ConeGeometry(0.3, 0.8, 8);
                bodyMaterial = new THREE.MeshStandardMaterial({
                    color: 0xff6600,
                    emissive: 0xff3300, // Brighter emissive for visibility
                    emissiveIntensity: 0.8, // Increased emissive
                    metalness: 0.1,
                    roughness: 0.7
                });
                size = 1.0; // Bigger size
                swimSpeed = 1.5;
                break;
                
            case 'angelfish':
                // Taller body for angelfish - MUCH BIGGER
                bodyGeometry = new THREE.ConeGeometry(0.4, 1.0, 8);
                bodyMaterial = new THREE.MeshStandardMaterial({
                    color: 0x00aaff,
                    emissive: 0x0066ff, // Brighter emissive
                    emissiveIntensity: 0.8, // Increased emissive
                    metalness: 0.2,
                    roughness: 0.6
                });
                size = 1.2; // Bigger size
                swimSpeed = 1.2;
                break;
                
            case 'jellyfish':
                // Bell-shaped jellyfish (no tail) - MUCH BIGGER
                bodyGeometry = new THREE.ConeGeometry(0.6, 1.0, 8);
                bodyMaterial = new THREE.MeshStandardMaterial({
                    color: 0xff88ff,
                    emissive: 0xff00ff, // Brighter emissive
                    emissiveIntensity: 1.0, // Very bright for visibility
                    transparent: true,
                    opacity: 0.8, // Less transparent
                    metalness: 0.0,
                    roughness: 0.3
                });
                size = 1.0; // Bigger size
                swimSpeed = 0.8;
                break;
                
            case 'shark':
                bodyGeometry = new THREE.ConeGeometry(0.4, 1.2, 8);
                bodyMaterial = new THREE.MeshStandardMaterial({
                    color: 0x444444,
                    emissive: 0x000000,
                    emissiveIntensity: 0.1,
                    metalness: 0.3,
                    roughness: 0.8
                });
                size = 2;
                swimSpeed = 2.5;
                break;
                
            default:
                bodyGeometry = new THREE.ConeGeometry(0.15, 0.4, 6);
                bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });
                size = 0.5;
                swimSpeed = 1.0;
        }
        
                    // Use ToonMaterial for cartoon fish
                    const toonMaterial = new THREE.MeshToonMaterial({
                        color: bodyMaterial.color,
                        emissive: bodyMaterial.emissive,
                        emissiveIntensity: bodyMaterial.emissiveIntensity || 0.3
                    });
                    
                    // Create gradient for cel shading
                    const gradientTexture = new THREE.DataTexture(
                        new Uint8Array([0, 0, 0, 128, 128, 128, 255, 255, 255]),
                        3, 1,
                        THREE.RGBFormat
                    );
                    gradientTexture.needsUpdate = true;
                    toonMaterial.gradientMap = gradientTexture;
                    
                    const bodyMesh = new THREE.Mesh(bodyGeometry, toonMaterial);
                    bodyMesh.castShadow = true;
                    group.add(bodyMesh);
                    
                    // Store toonMaterial reference for reuse
                    (group as any).toonMaterial = toonMaterial;
                    
                    // Scale up the entire group to make fish more visible
                    group.scale.set(size * 2, size * 2, size * 2); // 2x scale for visibility
                    
                    // Add head sphere with toon material - BIGGER
                    if (type !== 'jellyfish') {
                        const headGeometry = new THREE.SphereGeometry(0.2, 8, 8);
                        const headToonMaterial = new THREE.MeshToonMaterial({
                            color: bodyMaterial.color,
                            emissive: bodyMaterial.emissive,
                            emissiveIntensity: bodyMaterial.emissiveIntensity || 0.8
                        });
                        headToonMaterial.gradientMap = toonMaterial.gradientMap;
                        const headMesh = new THREE.Mesh(headGeometry, headToonMaterial);
                        headMesh.position.set(0, 0, 0.5);
                        group.add(headMesh);
                    }
                    
                    // Add tail fin (except jellyfish) with toon material - BIGGER
                    let tailFin: THREE.Mesh | undefined;
                    if (type !== 'jellyfish') {
                        const tailGeometry = new THREE.ConeGeometry(0.16, 0.4, 4);
                        const tailToonMaterial = new THREE.MeshToonMaterial({
                            color: bodyMaterial.color,
                            emissive: bodyMaterial.emissive,
                            emissiveIntensity: bodyMaterial.emissiveIntensity || 0.8
                        });
                        tailToonMaterial.gradientMap = toonMaterial.gradientMap;
                        tailFin = new THREE.Mesh(tailGeometry, tailToonMaterial);
                        tailFin.position.set(0, 0, -0.5);
                        tailFin.rotation.x = Math.PI;
                        group.add(tailFin);
                    }
        
        return {
            mesh: bodyMesh, // Keep reference to main mesh for compatibility
            tailFin,
            group,
            position: new THREE.Vector3(),
            velocity: new THREE.Vector3(),
            type,
            size,
            swimSpeed,
            swimPhase: 0
        };
    }
    
    /**
     * Update fish positions and animations with boids flocking
     */
    update(deltaTime: number, cameraPosition: THREE.Vector3, currentForce?: THREE.Vector3): void {
        this.time += deltaTime;
        
        // Boids parameters
        const separationDistance = 2.0;
        const alignmentDistance = 5.0;
        const cohesionDistance = 8.0;
        const separationWeight = 1.5;
        const alignmentWeight = 1.0;
        const cohesionWeight = 1.0;
        const maxSpeed = 3.0;
        const maxForce = 0.5;
        
        this.fishes.forEach((fish, index) => {
            // Update swim phase for sin wave animation
            fish.swimPhase += deltaTime * fish.swimSpeed * 2;
            
            // Boids flocking forces
            const separation = this.computeSeparation(fish, separationDistance);
            const alignment = this.computeAlignment(fish, alignmentDistance);
            const cohesion = this.computeCohesion(fish, cohesionDistance);
            
            // Apply boids forces
            separation.multiplyScalar(separationWeight);
            alignment.multiplyScalar(alignmentWeight);
            cohesion.multiplyScalar(cohesionWeight);
            
            fish.velocity.add(separation);
            fish.velocity.add(alignment);
            fish.velocity.add(cohesion);
            
            // Apply current force if provided
            if (currentForce) {
                fish.velocity.add(currentForce.clone().multiplyScalar(deltaTime * 0.5));
            }
            
            // Avoid camera (predator avoidance)
            const distanceToCamera = fish.position.distanceTo(cameraPosition);
            if (distanceToCamera < 5) {
                const avoidDirection = fish.position.clone().sub(cameraPosition).normalize();
                const avoidForce = avoidDirection.multiplyScalar(2.0);
                fish.velocity.add(avoidForce);
            }
            
            // Limit velocity
            if (fish.velocity.length() > maxSpeed) {
                fish.velocity.normalize().multiplyScalar(maxSpeed);
            }
            
            // Update position based on velocity
            fish.position.add(fish.velocity.clone().multiplyScalar(deltaTime));
            
            // Boundary check - wrap around if too far from origin (closer boundary)
            const distanceFromOrigin = fish.position.length();
            if (distanceFromOrigin > 20) {
                // Reset to opposite side, closer to origin
                fish.position.normalize().multiplyScalar(-15);
                fish.velocity.negate();
            }
            
            // Update mesh/group position
            const fishObject = fish.group || fish.mesh;
            fishObject.position.copy(fish.position);
            
            // Rotate fish to face swimming direction
            if (fish.velocity.length() > 0.1) {
                const target = fish.position.clone().add(fish.velocity.clone().normalize());
                fishObject.lookAt(target);
            }
            
            // Animate tail fin (for fish types)
            if (fish.tailFin) {
                fish.tailFin.rotation.z = Math.sin(fish.swimPhase) * 0.3;
            }
            
            // Jellyfish pulsing animation
            if (fish.type === 'jellyfish' && fish.group) {
                const scale = 1 + Math.sin(fish.swimPhase * 2) * 0.1;
                fish.group.scale.set(scale, scale, scale);
            }
        });
    }
    
    /**
     * Boids: Separation - avoid crowding neighbors
     */
    private computeSeparation(fish: Fish, distance: number): THREE.Vector3 {
        const steer = new THREE.Vector3();
        let count = 0;
        
        for (const other of this.fishes) {
            if (other === fish) continue;
            
            const dist = fish.position.distanceTo(other.position);
            if (dist < distance && dist > 0) {
                const diff = fish.position.clone().sub(other.position);
                diff.normalize();
                diff.divideScalar(dist); // Weight by distance
                steer.add(diff);
                count++;
            }
        }
        
        if (count > 0) {
            steer.divideScalar(count);
            steer.normalize();
            steer.multiplyScalar(2.0);
        }
        
        return steer;
    }
    
    /**
     * Boids: Alignment - steer towards average heading of neighbors
     */
    private computeAlignment(fish: Fish, distance: number): THREE.Vector3 {
        const steer = new THREE.Vector3();
        let count = 0;
        
        for (const other of this.fishes) {
            if (other === fish) continue;
            
            const dist = fish.position.distanceTo(other.position);
            if (dist < distance && dist > 0) {
                steer.add(other.velocity);
                count++;
            }
        }
        
        if (count > 0) {
            steer.divideScalar(count);
            steer.normalize();
            steer.multiplyScalar(1.5);
        }
        
        return steer;
    }
    
    /**
     * Boids: Cohesion - steer towards average position of neighbors
     */
    private computeCohesion(fish: Fish, distance: number): THREE.Vector3 {
        const sum = new THREE.Vector3();
        let count = 0;
        
        for (const other of this.fishes) {
            if (other === fish) continue;
            
            const dist = fish.position.distanceTo(other.position);
            if (dist < distance && dist > 0) {
                sum.add(other.position);
                count++;
            }
        }
        
        if (count > 0) {
            sum.divideScalar(count);
            const desired = sum.sub(fish.position);
            desired.normalize();
            desired.multiplyScalar(1.0);
            return desired;
        }
        
        return new THREE.Vector3();
    }
    
    /**
     * Get all fish (for collection system)
     */
    getFishes(): Fish[] {
        return this.fishes;
    }
    
    /**
     * Remove a fish (when collected)
     */
    removeFish(fish: Fish): void {
        const index = this.fishes.indexOf(fish);
        if (index > -1) {
            if (fish.group) {
                this.scene.remove(fish.group);
                fish.group.traverse((child) => {
                    if (child instanceof THREE.Mesh) {
                        child.geometry.dispose();
                        if (child.material instanceof THREE.Material) {
                            child.material.dispose();
                        }
                    }
                });
            } else {
                this.scene.remove(fish.mesh);
                fish.mesh.geometry.dispose();
                if (fish.mesh.material instanceof THREE.Material) {
                    fish.mesh.material.dispose();
                }
            }
            this.fishes.splice(index, 1);
            console.log(`🐟 Fish caught! ${this.fishes.length} remaining`);
        }
    }
    
    /**
     * Get fish at a specific position (for raycasting/collection)
     */
    getFishAtPosition(position: THREE.Vector3, radius: number = 1.5): Fish | null {
        for (const fish of this.fishes) {
            if (fish.position.distanceTo(position) < radius) {
                return fish;
            }
        }
        return null;
    }
    
    /**
     * Raycast to find nearest fish in front of camera
     */
    raycastForFish(raycaster: THREE.Raycaster, maxDistance: number = 5): Fish | null {
        let nearestFish: Fish | null = null;
        let nearestDistance = maxDistance;
        
        for (const fish of this.fishes) {
            // Create ray from camera through fish
            const direction = fish.position.clone().sub(raycaster.ray.origin).normalize();
            raycaster.ray.direction.copy(direction);
            
            // Check if fish is within range
            const distance = fish.position.distanceTo(raycaster.ray.origin);
            if (distance < nearestDistance) {
                // Check if fish is roughly in front of camera (dot product check)
                const toFish = fish.position.clone().sub(raycaster.ray.origin).normalize();
                const dot = raycaster.ray.direction.dot(toFish);
                if (dot > 0.7) { // Fish is in front (70% forward)
                    nearestFish = fish;
                    nearestDistance = distance;
                }
            }
        }
        
        return nearestFish;
    }
}
