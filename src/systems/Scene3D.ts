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
    
    constructor(
        private scene: THREE.Scene,
        private physicsWorld: PhysicsWorld
    ) {
        // Create ambient light (soft underwater glow)
        this.ambientLight = new THREE.HemisphereLight(
            0x4488ff, // Sky color
            0x001133, // Ground color
            0.4
        );
        this.scene.add(this.ambientLight);
        
        // Create directional light (sun rays through water)
        this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
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
            
            // DEBUG: Add visible test cube to verify rendering works
            console.log('🔴 Adding debug cube...');
            const testCubeGeometry = new THREE.BoxGeometry(4, 4, 4);
            const testCubeMaterial = new THREE.MeshBasicMaterial({
                color: 0xff0000,
                wireframe: true
            });
            const testCube = new THREE.Mesh(testCubeGeometry, testCubeMaterial);
            testCube.position.set(0, 2, 0);
            this.scene.add(testCube);
            console.log('✅ DEBUG CUBE ADDED at (0, 2, 0) – should be visible if rendering works');
            
            console.log('✅ Scene3D initialized successfully');
        } catch (error) {
            console.error('❌ Scene3D initialization failed:', error);
            throw error;
        }
    }
    
    private async createOceanFloor(): Promise<void> {
        const geometry = new THREE.PlaneGeometry(200, 200, 50, 50);
        
        // Add noise to create terrain
        const positions = geometry.attributes.position;
        for (let i = 0; i < positions.count; i++) {
            const x = positions.getX(i);
            const y = positions.getY(i);
            const noise = Math.sin(x * 0.1) * Math.cos(y * 0.1) * 2;
            positions.setZ(i, noise);
        }
        geometry.computeVertexNormals();
        
        const material = new THREE.MeshStandardMaterial({
            color: 0x224466,
            roughness: 0.8,
            metalness: 0.1
        });
        
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
    }
    
    getLightPosition(): THREE.Vector3 {
        return this.directionalLight.position.clone();
    }
}
