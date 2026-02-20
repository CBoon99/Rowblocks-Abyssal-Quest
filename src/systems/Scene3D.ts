import * as THREE from 'three';
import { PhysicsWorld } from './PhysicsWorld';
import * as CANNON from 'cannon-es';
import { WaterCaustics } from './WaterCaustics';

export class Scene3D {
    private oceanFloor: THREE.Mesh | null = null;
    private ambientLight: THREE.HemisphereLight;
    private directionalLight: THREE.DirectionalLight;
    private pointLights: THREE.PointLight[] = [];
    private particles: THREE.Points | null = null;
    private time: number = 0;
    private waterCaustics: WaterCaustics;
    private causticsProjector: THREE.SpotLight | null = null;
    private causticsTexture: THREE.Texture | null = null;
    
    constructor(
        private scene: THREE.Scene,
        private physicsWorld: PhysicsWorld
    ) {
        // Cartoon lighting - vibrant HemisphereLight for cartoon pop
        this.ambientLight = new THREE.HemisphereLight(
            0x88ccff, // Bright cyan sky (cartoon vibrant)
            0x003366, // Deep blue ground
            0.8 // Higher intensity for cartoon look
        );
        this.scene.add(this.ambientLight);
        
        // Directional light with rim lighting effect
        this.directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
        this.directionalLight.position.set(50, 100, 50);
        this.directionalLight.castShadow = true;
        this.directionalLight.shadow.mapSize.width = 2048;
        this.directionalLight.shadow.mapSize.height = 2048;
        this.directionalLight.shadow.camera.near = 0.5;
        this.directionalLight.shadow.camera.far = 500;
        this.directionalLight.shadow.camera.left = -100;
        this.directionalLight.shadow.camera.right = 100;
        this.directionalLight.shadow.camera.top = 100;
        this.directionalLight.shadow.camera.bottom = -100;
        this.scene.add(this.directionalLight);
    }
    
    async init(): Promise<void> {
        console.log('🌊 Scene3D.init() started');
        try {
            // Initialize water caustics
            console.log('💧 Initializing water caustics...');
            this.waterCaustics = new WaterCaustics();
            
            // Create ocean floor
            console.log('🏔️ Creating ocean floor...');
            await this.createOceanFloor();
            console.log('✅ Ocean floor created');
            
            // Create bioluminescent particles
            console.log('✨ Creating particles...');
            this.createParticles();
            console.log('✅ Particles created');
            
            // Create point lights for bioluminescence
            console.log('💡 Creating lights...');
            this.createBioluminescentLights();
            console.log('✅ Lights created');
            
            // Create enhanced caustics projector
            console.log('💧 Creating caustics projector...');
            this.createCausticsProjector();
            console.log('✅ Caustics projector created');
            
            // DEBUG: Removed debug cube for Phase 4 (cartoon aesthetic)
            // console.log('🔴 Debug cube removed for cartoon aesthetic');
            
            console.log('✅ Scene3D initialized successfully');
        } catch (error) {
            console.error('❌ Scene3D initialization failed:', error);
            throw error;
        }
    }
    
    private async createOceanFloor(): Promise<void> {
        // Enhanced sea floor with better sand-like appearance
        // Higher resolution for smoother terrain
        const geometry = new THREE.PlaneGeometry(200, 200, 128, 128);
        
        // Enhanced noise function for sand dunes/terrain
        const positions = geometry.attributes.position;
        for (let i = 0; i < positions.count; i++) {
            const x = positions.getX(i);
            const y = positions.getY(i);
            
            // Multi-octave noise for more natural sand dunes
            const noise1 = Math.sin(x * 0.05) * Math.cos(y * 0.05) * 3;
            const noise2 = Math.sin(x * 0.15) * Math.cos(y * 0.15) * 1;
            const noise3 = Math.sin(x * 0.3) * Math.cos(y * 0.3) * 0.5;
            const combinedNoise = noise1 + noise2 + noise3;
            
            positions.setZ(i, combinedNoise);
        }
        geometry.computeVertexNormals();
        
        // Cartoon sand material - bright yellow/orange with cel shading
        const material = new THREE.MeshToonMaterial({
            color: 0xffcc88, // Bright cartoon sand (yellow-orange)
            emissive: 0x332200,
            emissiveIntensity: 0.2
        });
        
        // Create gradient texture for cel shading
        const gradientTexture = new THREE.DataTexture(
            new Uint8Array([0, 0, 0, 128, 128, 128, 255, 255, 255]),
            3, 1,
            THREE.RGBFormat
        );
        gradientTexture.needsUpdate = true;
        material.gradientMap = gradientTexture;
        
        // Apply caustics to ocean floor
        this.waterCaustics.applyToMaterial(material);
        
        this.oceanFloor = new THREE.Mesh(geometry, material);
        this.oceanFloor.rotation.x = -Math.PI / 2;
        this.oceanFloor.position.y = -20;
        this.oceanFloor.receiveShadow = true;
        this.scene.add(this.oceanFloor);
        
        // Add physics body for ocean floor
        const floorShape = new CANNON.Plane();
        const floorBody = new CANNON.Body({ mass: 0 });
        floorBody.addShape(floorShape);
        floorBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
        floorBody.position.set(0, -20, 0);
        this.physicsWorld.addBody(floorBody);
        
        console.log('✅ Enhanced sea floor created with sand-like terrain');
    }
    
    private createParticles(): void {
        const particleCount = 1000; // Increased for better effect
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        const velocities = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            
            // Random positions in a sphere
            const radius = 30 + Math.random() * 120;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(Math.random() * 2 - 1);
            
            positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i3 + 2] = radius * Math.cos(phi);
            
            // Random velocities for movement
            velocities[i3] = (Math.random() - 0.5) * 0.5;
            velocities[i3 + 1] = (Math.random() - 0.5) * 0.3;
            velocities[i3 + 2] = (Math.random() - 0.5) * 0.5;
            
            // Enhanced bioluminescent colors with more variety
            const colorChoice = Math.random();
            if (colorChoice < 0.25) {
                colors[i3] = 0.1; colors[i3 + 1] = 0.9; colors[i3 + 2] = 1.0; // Bright Cyan
            } else if (colorChoice < 0.5) {
                colors[i3] = 0.0; colors[i3 + 1] = 0.4; colors[i3 + 2] = 0.9; // Deep Blue
            } else if (colorChoice < 0.75) {
                colors[i3] = 0.7; colors[i3 + 1] = 0.1; colors[i3 + 2] = 0.9; // Purple
            } else {
                colors[i3] = 0.0; colors[i3 + 1] = 0.8; colors[i3 + 2] = 0.6; // Teal
            }
            
            sizes[i] = Math.random() * 1.5 + 0.5;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        (geometry as any).userData.velocities = velocities; // Store velocities
        
        const material = new THREE.PointsMaterial({
            size: 0.8,
            vertexColors: true,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true,
            depthWrite: false
        });
        
        this.particles = new THREE.Points(geometry, material);
        this.scene.add(this.particles);
    }
    
    private createBioluminescentLights(): void {
        // Create several point lights for bioluminescent creatures
        // These could also have associated sounds (creature calls, etc.)
        for (let i = 0; i < 10; i++) {
            const light = new THREE.PointLight(0x00ffff, 0.5, 30);
            light.position.set(
                (Math.random() - 0.5) * 100,
                (Math.random() - 0.5) * 50,
                (Math.random() - 0.5) * 100
            );
            this.scene.add(light);
            this.pointLights.push(light);
            
            // Store position for potential audio attachment
            (light as any).audioPosition = light.position.clone();
        }
    }
    
    getBioluminescentPositions(): THREE.Vector3[] {
        return this.pointLights.map(light => light.position.clone());
    }
    
    update(deltaTime: number): void {
        this.time += deltaTime;
        
        // Animate particles with enhanced movement
        if (this.particles) {
            const positions = this.particles.geometry.attributes.position;
            const velocities = (this.particles.geometry as any).userData.velocities;
            
            if (velocities) {
                for (let i = 0; i < positions.count; i++) {
                    const i3 = i * 3;
                    
                    // Update position based on velocity
                    positions.array[i3] += velocities[i3] * deltaTime;
                    positions.array[i3 + 1] += velocities[i3 + 1] * deltaTime;
                    positions.array[i3 + 2] += velocities[i3 + 2] * deltaTime;
                    
                    // Add gentle floating motion
                    positions.array[i3 + 1] += Math.sin(this.time * 0.5 + i) * 0.005;
                    
                    // Wrap around if out of bounds
                    const radius = Math.sqrt(
                        positions.array[i3] ** 2 + 
                        positions.array[i3 + 1] ** 2 + 
                        positions.array[i3 + 2] ** 2
                    );
                    if (radius > 150) {
                        positions.array[i3] *= 0.8;
                        positions.array[i3 + 1] *= 0.8;
                        positions.array[i3 + 2] *= 0.8;
                    }
                }
                positions.needsUpdate = true;
            }
        }
        
        // Animate bioluminescent lights
        this.pointLights.forEach((light, i) => {
            const pulse = Math.sin(this.time * 2 + i) * 0.3 + 0.7;
            light.intensity = 0.5 * pulse;
            light.position.y += Math.sin(this.time + i) * 0.02;
        });
        
        // Animate directional light (sun rays)
        this.directionalLight.position.x = Math.sin(this.time * 0.1) * 50;
        this.directionalLight.position.z = Math.cos(this.time * 0.1) * 50;
        
        // Update water caustics
        this.waterCaustics.update(deltaTime);
        
        // Animate caustics projector
        if (this.causticsProjector) {
            // Move projector in circular pattern
            const radius = 30;
            this.causticsProjector.position.x = Math.sin(this.time * 0.1) * radius;
            this.causticsProjector.position.z = Math.cos(this.time * 0.1) * radius;
            this.causticsProjector.position.y = 20;
            
            // Animate texture offset for moving caustics
            if (this.causticsTexture) {
                this.causticsTexture.offset.x += deltaTime * 0.1;
                this.causticsTexture.offset.y += deltaTime * 0.05;
                if (this.causticsTexture.offset.x > 1) this.causticsTexture.offset.x -= 1;
                if (this.causticsTexture.offset.y > 1) this.causticsTexture.offset.y -= 1;
            }
        }
    }
    
    /**
     * Create animated caustics projector for enhanced underwater lighting
     */
    private createCausticsProjector(): void {
        // Create caustics texture (procedural noise pattern)
        const size = 512;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d')!;
        
        // Create noise pattern for caustics
        const imageData = ctx.createImageData(size, size);
        for (let i = 0; i < imageData.data.length; i += 4) {
            const x = (i / 4) % size;
            const y = Math.floor((i / 4) / size);
            const noise = Math.sin(x * 0.1) * Math.cos(y * 0.1) * 0.5 + 0.5;
            imageData.data[i] = noise * 255;     // R
            imageData.data[i + 1] = noise * 255; // G
            imageData.data[i + 2] = noise * 255; // B
            imageData.data[i + 3] = noise * 200; // A
        }
        ctx.putImageData(imageData, 0, 0);
        
        this.causticsTexture = new THREE.CanvasTexture(canvas);
        this.causticsTexture.wrapS = THREE.RepeatWrapping;
        this.causticsTexture.wrapT = THREE.RepeatWrapping;
        this.causticsTexture.repeat.set(2, 2);
        
        // Create spotlight projector
        this.causticsProjector = new THREE.SpotLight(0x88ccff, 1.5, 100, Math.PI / 4, 0.3);
        this.causticsProjector.position.set(0, 20, 0);
        this.causticsProjector.target.position.set(0, -20, 0);
        this.causticsProjector.castShadow = true;
        this.causticsProjector.shadow.mapSize.width = 1024;
        this.causticsProjector.shadow.mapSize.height = 1024;
        
        // Apply caustics texture to projector
        (this.causticsProjector as any).map = this.causticsTexture;
        
        this.scene.add(this.causticsProjector);
        this.scene.add(this.causticsProjector.target);
    }
    
    getLightPosition(): THREE.Vector3 {
        return this.directionalLight.position.clone();
    }
}
