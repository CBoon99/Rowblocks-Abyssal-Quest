import * as THREE from 'three';

interface Bubble {
    position: THREE.Vector3;
    velocity: THREE.Vector3;
    size: number;
    age: number;
    maxAge: number;
}

export class BubblesSystem {
    private bubbles: Bubble[] = [];
    private particles: THREE.Points | null = null;
    private geometry: THREE.BufferGeometry;
    private positions: Float32Array;
    private sizes: Float32Array;
    private scene: THREE.Scene;
    private maxBubbles: number = 200;
    private emissionRate: number = 5; // Bubbles per second
    private emissionTimer: number = 0;
    
    constructor(scene: THREE.Scene) {
        this.scene = scene;
        
        // Create particle system
        this.geometry = new THREE.BufferGeometry();
        this.positions = new Float32Array(this.maxBubbles * 3);
        this.sizes = new Float32Array(this.maxBubbles);
        
        this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
        this.geometry.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1));
        
        const material = new THREE.PointsMaterial({
            color: 0x88ccff,
            size: 0.3,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true,
            depthWrite: false
        });
        
        this.particles = new THREE.Points(this.geometry, material);
        this.scene.add(this.particles);
    }
    
    /**
     * Emit bubbles from a position (e.g., around swimmer or sea floor)
     */
    emitBubbles(position: THREE.Vector3, count: number = 1): void {
        for (let i = 0; i < count; i++) {
            if (this.bubbles.length >= this.maxBubbles) {
                // Remove oldest bubble
                this.bubbles.shift();
            }
            
            const bubble: Bubble = {
                position: position.clone().add(new THREE.Vector3(
                    (Math.random() - 0.5) * 2,
                    (Math.random() - 0.5) * 0.5,
                    (Math.random() - 0.5) * 2
                )),
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.5,
                    Math.random() * 2 + 1, // Upward velocity
                    (Math.random() - 0.5) * 0.5
                ),
                size: Math.random() * 0.2 + 0.1,
                age: 0,
                maxAge: 5 + Math.random() * 5 // 5-10 seconds
            };
            
            this.bubbles.push(bubble);
        }
    }
    
    /**
     * Update bubble positions and remove old ones
     */
    update(deltaTime: number, swimmerPosition?: THREE.Vector3): void {
        // Emit bubbles around swimmer periodically
        if (swimmerPosition) {
            this.emissionTimer += deltaTime;
            const emissionInterval = 1 / this.emissionRate;
            if (this.emissionTimer >= emissionInterval) {
                this.emitBubbles(swimmerPosition, 1);
                this.emissionTimer = 0;
            }
        }
        
        // Update existing bubbles
        const bubblesToRemove: number[] = [];
        
        this.bubbles.forEach((bubble, index) => {
            // Update position
            bubble.position.add(bubble.velocity.clone().multiplyScalar(deltaTime));
            
            // Grow bubble over time (size increases as it rises)
            bubble.size += deltaTime * 0.05;
            
            // Update age
            bubble.age += deltaTime;
            
            // Remove if too old or reached surface (y > 0)
            if (bubble.age > bubble.maxAge || bubble.position.y > 0) {
                bubblesToRemove.push(index);
            }
        });
        
        // Remove old bubbles (reverse order to maintain indices)
        for (let i = bubblesToRemove.length - 1; i >= 0; i--) {
            this.bubbles.splice(bubblesToRemove[i], 1);
        }
        
        // Update particle system
        this.updateParticles();
    }
    
    /**
     * Update particle system geometry with current bubble positions
     */
    private updateParticles(): void {
        const positions = this.geometry.attributes.position as THREE.BufferAttribute;
        const sizes = this.geometry.attributes.size as THREE.BufferAttribute;
        
        // Clear old positions
        for (let i = 0; i < this.maxBubbles * 3; i++) {
            this.positions[i] = 0;
            if (i < this.maxBubbles) {
                this.sizes[i] = 0;
            }
        }
        
        // Set positions and sizes for active bubbles
        this.bubbles.forEach((bubble, index) => {
            const i3 = index * 3;
            this.positions[i3] = bubble.position.x;
            this.positions[i3 + 1] = bubble.position.y;
            this.positions[i3 + 2] = bubble.position.z;
            this.sizes[index] = bubble.size;
        });
        
        // Mark as needing update
        positions.needsUpdate = true;
        sizes.needsUpdate = true;
        
        // Set draw range to only draw active bubbles
        this.geometry.setDrawRange(0, this.bubbles.length);
    }
    
    /**
     * Get current bubble count
     */
    getBubbleCount(): number {
        return this.bubbles.length;
    }
}
