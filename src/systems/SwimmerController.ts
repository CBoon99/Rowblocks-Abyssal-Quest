import * as THREE from 'three';
import { PhysicsWorld } from './PhysicsWorld';
import * as CANNON from 'cannon-es';

export class SwimmerController {
    private velocity: THREE.Vector3 = new THREE.Vector3();
    private direction: THREE.Vector3 = new THREE.Vector3();
    private euler: THREE.Euler = new THREE.Euler(0, 0, 0, 'YXZ');
    private pitchObject: THREE.Object3D = new THREE.Object3D();
    private yawObject: THREE.Object3D = new THREE.Object3D();
    private moveForward: boolean = false;
    private moveBackward: boolean = false;
    private moveLeft: boolean = false;
    private moveRight: boolean = false;
    private moveUp: boolean = false;
    private moveDown: boolean = false;
    private canJump: boolean = false;
    private prevTime: number = performance.now();
    private flashlight: THREE.SpotLight | null = null;
    private physicsBody: CANNON.Body;
    
    private readonly SPEED: number = 5;
    private readonly SWIM_SPEED: number = 3;
    
    constructor(
        private camera: THREE.PerspectiveCamera,
        private physicsWorld: PhysicsWorld
    ) {
        // Note: Camera hierarchy managed separately
        // Camera is added to scene directly, rotation controlled via euler
        
        // Create physics body (capsule shape for swimmer)
        const shape = new CANNON.Cylinder(0.3, 0.3, 1.5, 8);
        this.physicsBody = new CANNON.Body({ mass: 1 });
        this.physicsBody.addShape(shape);
        // Position swimmer above the block grid
        this.physicsBody.position.set(0, 8, 5);
        this.physicsBody.linearDamping = 0.8; // Water resistance
        this.physicsBody.angularDamping = 0.9;
        physicsWorld.addBody(this.physicsBody);
        
        // Set initial camera position to match physics body
        this.camera.position.set(0, 8, 5);
        
        // Create flashlight (intensity will be updated based on upgrades)
        this.flashlight = new THREE.SpotLight(0xffffff, 2, 50, Math.PI / 6, 0.3);
        this.flashlight.position.copy(this.camera.position);
        this.flashlight.target.position.set(0, 0, -10);
        this.camera.add(this.flashlight);
        this.camera.add(this.flashlight.target);
        
        // Subscribe to store for customization updates
        this.updateCustomization();
        const store = (window as any).useGameStore;
        if (store) {
            store.subscribe(() => {
                this.updateCustomization();
            });
        }
        
        this.setupEventListeners();
    }
    
    private setupEventListeners(): void {
        // Keyboard controls - use capture phase to ensure we get events
        const keyDownHandler = (e: KeyboardEvent) => {
            // Don't capture if typing in an input field or if UI is open
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'BUTTON') {
                return;
            }
            // Don't capture if a modal/overlay is visible
            const marinepedia = document.getElementById('marinepedia-container');
            const shop = document.getElementById('customization-shop-container');
            const levelSelect = document.getElementById('level-select-container');
            const upgradeShop = document.getElementById('upgrade-shop-container');
            if (marinepedia?.style.display === 'block' || 
                shop?.style.display === 'block' || 
                levelSelect?.style.display === 'block' ||
                upgradeShop?.style.display === 'block') {
                return;
            }
            this.onKeyDown(e);
        };
        const keyUpHandler = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'BUTTON') {
                return;
            }
            this.onKeyUp(e);
        };
        
        document.addEventListener('keydown', keyDownHandler, true);
        document.addEventListener('keyup', keyUpHandler, true);
        
        // Mouse look (pointer lock) - request on canvas element
        const requestLock = () => {
            // Find canvas element
            const canvas = document.querySelector('canvas');
            if (canvas && document.pointerLockElement !== canvas) {
                canvas.requestPointerLock().catch(err => {
                    console.warn('Pointer lock failed:', err);
                });
            }
        };
        
        // Request pointer lock on click (but not when clicking UI)
        document.addEventListener('click', (e) => {
            // Only request lock if clicking on canvas area (not UI)
            const target = e.target as HTMLElement;
            if (target.tagName === 'CANVAS' || target.id === 'canvas-container' || (!target.closest('#ui-overlay') && !target.closest('#start-screen'))) {
                requestLock();
            }
        });
        
        // Handle pointer lock changes
        const mouseMoveHandler = (e: MouseEvent) => this.onMouseMove(e);
        document.addEventListener('pointerlockchange', () => {
            const canvas = document.querySelector('canvas');
            if (document.pointerLockElement === canvas) {
                document.addEventListener('mousemove', mouseMoveHandler);
                console.log('Pointer lock acquired - mouse controls enabled');
            } else {
                document.removeEventListener('mousemove', mouseMoveHandler);
                console.log('Pointer lock released');
            }
        });
    }
    
    private onKeyDown(event: KeyboardEvent): void {
        switch (event.code) {
            case 'KeyW': this.moveForward = true; break;
            case 'KeyS': this.moveBackward = true; break;
            case 'KeyA': this.moveLeft = true; break;
            case 'KeyD': this.moveRight = true; break;
            case 'Space': 
                // Check if we should collect fish or swim up
                const game = (window as any).game;
                if (game && typeof game.collectFish === 'function') {
                    if (!game.collectFish()) {
                        // No fish caught, swim up
                        this.moveUp = true;
                    }
                } else {
                    this.moveUp = true;
                }
                event.preventDefault(); 
                break;
            case 'ShiftLeft': this.moveDown = true; break;
            case 'KeyE': // Also use E to collect fish
                const gameE = (window as any).game;
                if (gameE && typeof gameE.collectFish === 'function') {
                    gameE.collectFish();
                }
                break;
        }
    }
    
    private onKeyUp(event: KeyboardEvent): void {
        switch (event.code) {
            case 'KeyW': this.moveForward = false; break;
            case 'KeyS': this.moveBackward = false; break;
            case 'KeyA': this.moveLeft = false; break;
            case 'KeyD': this.moveRight = false; break;
            case 'Space': this.moveUp = false; break;
            case 'ShiftLeft': this.moveDown = false; break;
        }
    }
    
    private onMouseMove(event: MouseEvent): void {
        const movementX = event.movementX || 0;
        const movementY = event.movementY || 0;
        
        this.yawObject.rotation.y -= movementX * 0.002;
        this.pitchObject.rotation.x -= movementY * 0.002;
        
        // Limit pitch
        this.pitchObject.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.pitchObject.rotation.x));
    }
    
    update(deltaTime: number): void {
        // Apply camera rotation from yaw/pitch objects
        // FIX: Use quaternion.setFromEuler, not rotation.setFromEuler
        this.euler.set(0, 0, 0, 'YXZ');
        this.euler.y = this.yawObject.rotation.y;
        this.euler.x = this.pitchObject.rotation.x;
        
        // CRITICAL FIX: Use quaternion for rotation to avoid gimbal lock
        this.camera.quaternion.setFromEuler(this.euler);
        
        // Update camera position from physics body
        this.camera.position.copy(this.physicsBody.position as any);
        this.camera.position.y += 0.5; // Offset for eye level
        
        // Calculate movement direction based on camera rotation
        this.velocity.set(0, 0, 0);
        this.direction.set(0, 0, -1);
        // Use quaternion for direction calculation
        this.direction.applyQuaternion(this.camera.quaternion);
        
        if (this.moveForward) {
            this.velocity.add(this.direction.clone().multiplyScalar(this.SPEED));
        }
        if (this.moveBackward) {
            this.velocity.add(this.direction.clone().multiplyScalar(-this.SPEED));
        }
        
        // Strafe - use camera's right vector
        const right = new THREE.Vector3(1, 0, 0);
        right.applyQuaternion(this.camera.quaternion);
        
        if (this.moveLeft) {
            this.velocity.add(right.clone().multiplyScalar(-this.SPEED));
        }
        if (this.moveRight) {
            this.velocity.add(right.clone().multiplyScalar(this.SPEED));
        }
        
        // Vertical movement (swimming up/down)
        if (this.moveUp) {
            this.velocity.y += this.SWIM_SPEED;
        }
        if (this.moveDown) {
            this.velocity.y -= this.SWIM_SPEED;
        }
        
        // Apply velocity to physics body
        const currentVel = this.physicsBody.velocity;
        this.physicsBody.velocity.set(
            this.velocity.x,
            currentVel.y + this.velocity.y * deltaTime,
            this.velocity.z
        );
        
        // Update flashlight
        if (this.flashlight) {
            this.flashlight.position.copy(this.camera.position);
            this.flashlight.target.position.copy(this.camera.position);
            this.flashlight.target.position.add(this.direction.multiplyScalar(10));
        }
    }
    
    getPosition(): THREE.Vector3 {
        return this.camera.position.clone();
    }
    
    getDirection(): THREE.Vector3 {
        return this.direction.clone();
    }
    
    /**
     * Update customization (skin color, helmet upgrade, etc.)
     */
    private updateCustomization(): void {
        try {
            const store = (window as any).useGameStore;
            if (!store) return;
            
            const state = store.getState();
            
            // Update flashlight intensity based on helmet upgrade
            if (this.flashlight) {
                const baseIntensity = 2;
                const upgradeMultiplier = 1 + (state.helmetUpgrade * 0.5);
                this.flashlight.intensity = baseIntensity * upgradeMultiplier;
            }
            
            // TODO: Apply skin color to diver mesh (when diver model is added)
            // For now, skin changes are tracked in store but not visually applied
        } catch (e) {
            console.warn('Could not update customization:', e);
        }
    }
}
