import * as THREE from 'three';

/**
 * Creates animated caustic light patterns projected onto surfaces
 * Simulates light refraction through water surface
 */
export class WaterCaustics {
    private causticsTexture: THREE.Texture;
    private projector: THREE.Projector;
    private time: number = 0;
    
    constructor() {
        // Create caustics texture using canvas
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d')!;
        
        // Generate caustic pattern
        this.generateCausticsPattern(ctx, canvas.width, canvas.height);
        
        this.causticsTexture = new THREE.CanvasTexture(canvas);
        this.causticsTexture.wrapS = THREE.RepeatWrapping;
        this.causticsTexture.wrapT = THREE.RepeatWrapping;
        this.causticsTexture.repeat.set(4, 4);
    }
    
    private generateCausticsPattern(ctx: CanvasRenderingContext2D, width: number, height: number): void {
        // Create gradient for caustic effect
        const gradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width / 2);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(0.5, 'rgba(200, 220, 255, 0.4)');
        gradient.addColorStop(1, 'rgba(100, 150, 200, 0)');
        
        // Draw multiple overlapping circles for caustic pattern
        for (let i = 0; i < 20; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const radius = 30 + Math.random() * 50;
            
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();
        }
    }
    
    update(deltaTime: number): void {
        this.time += deltaTime;
        
        // Animate caustics texture
        this.causticsTexture.offset.x += deltaTime * 0.1;
        this.causticsTexture.offset.y += deltaTime * 0.05;
        this.causticsTexture.needsUpdate = true;
    }
    
    getTexture(): THREE.Texture {
        return this.causticsTexture;
    }
    
    applyToMaterial(material: THREE.MeshStandardMaterial): void {
        // Add caustics as emissive map
        material.emissiveMap = this.causticsTexture;
        material.emissiveIntensity = 0.3;
    }
}
