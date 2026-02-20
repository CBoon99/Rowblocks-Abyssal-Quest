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
            // Increased to 25 fish for better flocking behavior
            this.createFishSchool(25);
            console.log(`✅ Created ${this.fishes.length} fish with boids flocking`);
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
            
            // Random starting position in a sphere around origin
            const radius = 20 + Math.random() * 30;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            
            fish.position.set(
                radius * Math.sin(phi) * Math.cos(theta),
                -5 + Math.random() * 15, // Between -5 and 10 depth
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
                // Cone body + sphere head for better fish shape
                bodyGeometry = new THREE.ConeGeometry(0.15, 0.4, 6);
                bodyMaterial = new THREE.MeshStandardMaterial({
                    color: 0xff6600,
                    emissive: 0x331100,
                    emissiveIntensity: 0.3,
                    metalness: 0.1,
                    roughness: 0.7
                });
                size = 0.5;
                swimSpeed = 1.5;
                break;
                
            case 'angelfish':
                // Taller body for angelfish
                bodyGeometry = new THREE.ConeGeometry(0.2, 0.5, 8);
                bodyMaterial = new THREE.MeshStandardMaterial({
                    color: 0x00aaff,
                    emissive: 0x003366,
                    emissiveIntensity: 0.4,
                    metalness: 0.2,
                    roughness: 0.6
                });
                size = 0.6;
                swimSpeed = 1.2;
                break;
                
            case 'jellyfish':
                // Bell-shaped jellyfish (no tail)
                bodyGeometry = new THREE.ConeGeometry(0.3, 0.5, 8);
                bodyMaterial = new THREE.MeshStandardMaterial({
                    color: 0xff88ff,
                    emissive: 0x660066,
                    emissiveIntensity: 0.6,
                    transparent: true,
                    opacity: 0.7,
                    metalness: 0.0,
                    roughness: 0.3
                });
                size = 0.5;
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
        
        const bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
        bodyMesh.castShadow = true;
        group.add(bodyMesh);
        
        // Add head sphere
        if (type !== 'jellyfish') {
            const headGeometry = new THREE.SphereGeometry(0.1, 8, 8);
            const headMesh = new THREE.Mesh(headGeometry, bodyMaterial);
            headMesh.position.set(0, 0, 0.25);
            group.add(headMesh);
        }
        
        // Add tail fin (except jellyfish)
        let tailFin: THREE.Mesh | undefined;
        if (type !== 'jellyfish') {
            const tailGeometry = new THREE.ConeGeometry(0.08, 0.2, 4);
            tailFin = new THREE.Mesh(tailGeometry, bodyMaterial);
            tailFin.position.set(0, 0, -0.25);
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
            
            // Boundary check - wrap around if too far from origin
            const distanceFromOrigin = fish.position.length();
            if (distanceFromOrigin > 50) {
                // Reset to opposite side
                fish.position.normalize().multiplyScalar(-40);
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
